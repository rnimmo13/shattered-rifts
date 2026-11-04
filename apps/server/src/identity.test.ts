import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { Identity } from './identity';
import { authRoute, googleCallback, makeSession, sessionOf, sha256 } from './auth';
import type { Env } from './env';

const now = 1800000000000;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());
function setup(seal = true) {
  const records = new Map<string, unknown>();
  const storage = {
    get: <T>(key: string): Promise<T | undefined> =>
      Promise.resolve(records.get(key) as T | undefined),
    put: (key: string, value: unknown) => {
      records.set(key, structuredClone(value));
      return Promise.resolve();
    },
    delete: (key: string) => Promise.resolve(records.delete(key)),
    setAlarm: vi.fn(() => Promise.resolve()),
    list: ({ prefix }: { prefix: string }) =>
      Promise.resolve(new Map([...records].filter(([key]) => key.startsWith(prefix)))),
  };
  let gate: Promise<unknown> = Promise.resolve();
  const ctx = {
    storage,
    blockConcurrencyWhile: <T>(fn: () => Promise<T>): Promise<T> => {
      const p = gate.then(fn);
      gate = p.catch(() => undefined);
      return p;
    },
  };
  const sealFetch = vi.fn(() => Promise.resolve(Response.json({}, { status: seal ? 200 : 409 })));
  const env = {
    SESSION_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'client',
    GOOGLE_CLIENT_SECRET: 'secret',
    VAULT: { idFromName: (s: string) => s, get: () => ({ fetch: sealFetch }) },
  } as unknown as Env;
  const object = new Identity(ctx as unknown as DurableObjectState, env);
  const call = (action: string, body: object) =>
    object.fetch(
      new Request(`https://identity.invalid/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  env.IDENTITY = {
    idFromName: (s: string) => s,
    get: () => ({ fetch: (r: Request) => object.fetch(r) }),
  } as unknown as DurableObjectNamespace;
  const verifier = 'a'.repeat(64),
    google = 'b'.repeat(64),
    steam = 'c'.repeat(64);
  const begin = async (link = false) => {
    const r = await call('begin', {
      challenge: await sha256(verifier),
      steam: link ? steam : null,
      ip: 'test',
    });
    return (await r.json<{ id: string }>()).id;
  };
  const authorize = async (id: string) =>
    (await (await call('authorize', { id, account: google })).json<{ confirmation: string }>())
      .confirmation;
  return { call, begin, authorize, verifier, google, steam, records, env, sealFetch, storage };
}
describe('native browser handoff and canonical accounts', () => {
  it('requires the app proof and browser confirmation, exchanges once and supports revocation', async () => {
    const t = setup(),
      id = await t.begin();
    expect((await t.call('exchange', { id, verifier: 'd'.repeat(64) })).status).toBe(401);
    expect((await t.call('exchange', { id, verifier: t.verifier })).status).toBe(202);
    const confirmation = await t.authorize(id);
    expect((await t.call('exchange', { id, verifier: t.verifier })).status).toBe(202);
    expect(
      (await t.call('confirm', { id, account: t.google, confirmation: '0'.repeat(64) })).status,
    ).toBe(403);
    await t.call('confirm', { id, account: t.google, confirmation });
    const result = await (
      await t.call('exchange', { id, verifier: t.verifier })
    ).json<{ token: string }>();
    expect(result.token).toMatch(/^d1\./);
    expect((await t.call('exchange', { id, verifier: t.verifier })).status).toBe(410);
    const request = new Request('https://game.test/auth/me', {
      headers: { authorization: `Bearer ${result.token}` },
    });
    expect(await sessionOf(request, t.env)).toEqual({ provider: 'google', account: t.google });
    expect(
      (
        await t.call('session', {
          token: result.token.slice(0, -1) + (result.token.endsWith('0') ? '1' : '0'),
        })
      ).status,
    ).toBe(401);
    await t.call('logout', { token: result.token });
    expect(await sessionOf(request, t.env)).toBeNull();
  });
  it('expires attempts and sessions, handles cancellation, and rate limits starts', async () => {
    const t = setup(),
      id = await t.begin();
    expect((await t.call('cancel', { id, verifier: 'e'.repeat(64) })).status).toBe(401);
    await t.call('cancel', { id, verifier: t.verifier });
    expect((await t.call('inspect', { id })).status).toBe(410);
    const expired = await t.begin();
    vi.setSystemTime(now + 600001);
    expect((await t.call('authorize', { id: expired, account: t.google })).status).toBe(410);
    for (let i = 0; i < 10; i++) await t.begin();
    expect(
      (await t.call('begin', { challenge: await sha256(t.verifier), steam: null, ip: 'test' }))
        .status,
    ).toBe(429);
    const key = 'session:' + '1'.repeat(64),
      secret = '2'.repeat(64);
    t.records.set(key, { proof: await sha256(secret), account: t.google, expires: Date.now() - 1 });
    expect((await t.call('session', { token: `d1.${'1'.repeat(64)}.${secret}` })).status).toBe(401);
  });
  it('links verified identities to Google, resolves old Steam tokens, and refuses replacement', async () => {
    const t = setup(),
      id = await t.begin(true),
      confirmation = await t.authorize(id);
    expect((await t.call('confirm', { id, account: t.google, confirmation })).status).toBe(200);
    const token = await makeSession('test-secret', { provider: 'steam', account: t.steam }, now);
    expect(
      await sessionOf(
        new Request('https://game.test/x', { headers: { authorization: `Bearer ${token}` } }),
        t.env,
      ),
    ).toEqual({ provider: 'steam', account: t.google, linked: true });
    expect(t.sealFetch).toHaveBeenCalledOnce();
    const other = await t.begin(true);
    const c = await (
      await t.call('authorize', { id: other, account: 'd'.repeat(64) })
    ).json<{ confirmation: string }>();
    expect(
      (
        await t.call('confirm', {
          id: other,
          account: 'd'.repeat(64),
          confirmation: c.confirmation,
        })
      ).status,
    ).toBe(409);
  });
  it('does not redirect a Steam identity when its old Vault refuses the seal', async () => {
    const t = setup(false),
      id = await t.begin(true),
      confirmation = await t.authorize(id);
    expect((await t.call('confirm', { id, account: t.google, confirmation })).status).toBe(409);
    expect(await (await t.call('resolve', { account: t.steam })).json()).toEqual({
      account: t.steam,
    });
  });
  it('binds OAuth state to the browser, uses only openid, and keeps credentials out of pages', async () => {
    const t = setup(),
      id = await t.begin();
    const start = await authRoute(
      new Request(`https://game.test/auth/google/start?desktop=${id}`),
      t.env,
    );
    const state = new URL(start!.headers.get('location')!).searchParams.get('state')!;
    const cookie = start!.headers.getSetCookie()[0]!.split(';')[0]!;
    const payload = btoa(JSON.stringify({ aud: 'client', sub: 'google-user' }));
    const response = await googleCallback(
      new Request(`https://game.test/auth/google/callback?state=${state}&code=code`, {
        headers: { cookie },
      }),
      t.env,
      () => Promise.resolve(Response.json({ id_token: `x.${payload}.y` })),
      now,
    );
    const html = await response.text();
    expect(html).toContain('Sign in to the desktop app');
    expect(html).not.toContain('d1.');
    expect(response.headers.get('referrer-policy')).toBe('same-origin');
    expect(response.headers.getSetCookie().some((c) => c.startsWith('sr_session='))).toBe(false);
    expect(
      response.headers
        .getSetCookie()
        .some((c) => c.startsWith('sr_desktop_confirm=') && c.includes('Max-Age=600')),
    ).toBe(true);
    expect((await t.call('exchange', { id, verifier: t.verifier })).status).toBe(202);
  });
});
