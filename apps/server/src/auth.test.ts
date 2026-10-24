import { describe, expect, it } from 'vitest';
import type { Env } from './env';
import { authRoute, googleCallback, makeSession, readSession, sessionOf, sha256 } from './auth';

const env = {
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
  SESSION_SECRET: 'a-long-test-secret',
} as unknown as Env;

const b64 = (o: object): string => btoa(JSON.stringify(o)).replace(/=+$/, '');
const idToken = (sub: string): string => `x.${b64({ sub, aud: 'id' })}.y`;
const NOW = 1_000_000;

describe('sessions', () => {
  it('round-trips, expires, and rejects tampering', async () => {
    const account = await sha256('google:123');
    const token = await makeSession('s', { account, provider: 'google' }, NOW);
    expect(await readSession('s', token, NOW + 1000)).toEqual({ account, provider: 'google' });
    expect(await readSession('s', token, NOW + 31 * 86_400_000)).toBeNull();
    expect(await readSession('other', token, NOW)).toBeNull();
    const bad = token.replace(account, await sha256('google:999'));
    expect(await readSession('s', bad, NOW)).toBeNull();
    expect(await readSession('s', undefined, NOW)).toBeNull();
    expect(await readSession('s', 'v1.google.zz.1.2', NOW)).toBeNull();
  });
});

describe('Google sign-in', () => {
  const cb = (query: string, cookie: string): Request =>
    new Request(`https://game.test/auth/google/callback?${query}`, { headers: { cookie } });

  it('starts by sending the browser to Google with a state cookie, asking only for openid', async () => {
    const res = await authRoute(new Request('https://game.test/auth/google/start'), env);
    const to = new URL(res?.headers.get('location') ?? '');
    expect(to.host).toBe('accounts.google.com');
    expect(to.searchParams.get('scope')).toBe('openid');
    expect(to.searchParams.get('redirect_uri')).toBe('https://game.test/auth/google/callback');
    expect(res?.headers.get('set-cookie')).toContain(`sr_oauth=${to.searchParams.get('state')}`);
    expect(res?.headers.get('set-cookie')).toContain('HttpOnly');
  });

  it('is off, politely, until the secrets exist', async () => {
    const res = await authRoute(new Request('https://game.test/auth/google/start'), {} as Env);
    expect(res?.status).toBe(503);
    const me = await authRoute(new Request('https://game.test/auth/me'), {} as Env);
    expect(await me?.json()).toMatchObject({ signedIn: false, available: false });
  });

  it('signs in with a good answer and keeps only a hash of the id', async () => {
    let sent = '';
    const fetcher = ((_u: unknown, init: RequestInit) => {
      sent = init.body instanceof URLSearchParams ? init.body.toString() : '';
      return Promise.resolve(new Response(JSON.stringify({ id_token: idToken('user-42') })));
    }) as unknown as typeof fetch;
    const res = await googleCallback(
      cb('code=abc&state=s1', `sr_oauth=s1.${NOW}`),
      env,
      fetcher,
      NOW + 5,
    );
    expect(res.headers.get('location')).toBe('/#/arena');
    expect(sent).toContain('code=abc');
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith('sr_session='));
    expect(cookie).toBeDefined();
    expect(cookie).not.toContain('user-42');
    const token = cookie!.split(';')[0]!.slice('sr_session='.length);
    const who = await sessionOf(
      new Request('https://game.test/x', { headers: { cookie: `sr_session=${token}` } }),
      env,
      NOW + 10,
    );
    expect(who?.account).toBe(await sha256('google:user-42'));
  });

  it('refuses a wrong state, a stale state, a refusal by the player, and a failed exchange', async () => {
    const ok = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ id_token: idToken('u') })),
      )) as unknown as typeof fetch;
    const signedIn = (r: Response): boolean =>
      r.headers.getSetCookie().some((c) => c.startsWith('sr_session=') && !c.includes('Max-Age=0'));
    expect(
      signedIn(await googleCallback(cb('code=a&state=WRONG', `sr_oauth=s1.${NOW}`), env, ok, NOW)),
    ).toBe(false);
    expect(
      signedIn(
        await googleCallback(
          cb('code=a&state=s1', `sr_oauth=s1.${NOW}`),
          env,
          ok,
          NOW + 11 * 60_000,
        ),
      ),
    ).toBe(false);
    expect(signedIn(await googleCallback(cb('code=a&state=s1', ''), env, ok, NOW))).toBe(false);
    expect(
      signedIn(
        await googleCallback(
          cb('error=access_denied&state=s1', `sr_oauth=s1.${NOW}`),
          env,
          ok,
          NOW,
        ),
      ),
    ).toBe(false);
    const bad = (() =>
      Promise.resolve(new Response('no', { status: 400 }))) as unknown as typeof fetch;
    expect(
      signedIn(await googleCallback(cb('code=a&state=s1', `sr_oauth=s1.${NOW}`), env, bad, NOW)),
    ).toBe(false);
    const boom = (() => Promise.reject(new Error('down'))) as unknown as typeof fetch;
    expect(
      signedIn(await googleCallback(cb('code=a&state=s1', `sr_oauth=s1.${NOW}`), env, boom, NOW)),
    ).toBe(false);
  });

  it('logs out by clearing the cookie', async () => {
    const res = await authRoute(
      new Request('https://game.test/auth/logout', { method: 'POST' }),
      env,
    );
    expect(res?.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
