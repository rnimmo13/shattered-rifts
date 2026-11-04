import { describe, expect, it, vi } from 'vitest';
import { steamLogin } from './steamAuth';
import { makeSession, sessionOf, sha256 } from './auth';
import type { Env } from './env';

const env = {
  STEAM_APP_ID: '12345',
  STEAM_WEB_API_KEY: 'server-only-key',
  SESSION_SECRET: 'test-signing-secret',
} as Env;
const request = (body: unknown) =>
  new Request('https://game.test/auth/steam', { method: 'POST', body: JSON.stringify(body) });
const NOW = 100000;
describe('Steam ticket verification', () => {
  it('uses the configured app and verified identity, and issues a signed Steam session', async () => {
    const fetcher = vi.fn((_url: unknown) =>
      Promise.resolve(
        new Response(
          JSON.stringify({ response: { params: { result: 'OK', steamid: '76561198000000001' } } }),
        ),
      ),
    );
    const res = await steamLogin(
      request({ ticket: '0102', steamId: 'forged', appId: 480 }),
      env,
      fetcher,
      NOW,
    );
    expect(res.status).toBe(200);
    const verifiedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(verifiedUrl.searchParams.get('appid')).toBe('12345');
    expect(verifiedUrl.searchParams.get('identity')).toBe('shattered-rifts');
    const { token } = await res.json<{ token: string }>();
    const who = await sessionOf(
      new Request('https://game.test/pvp/vault/list', {
        headers: { authorization: `Bearer ${token}` },
      }),
      env,
      NOW + 1,
    );
    expect(who).toEqual({ provider: 'steam', account: await sha256('steam:76561198000000001') });
    expect(
      await sessionOf(
        new Request('https://game.test/x', { headers: { authorization: `Bearer ${token}broken` } }),
        env,
        NOW,
      ),
    ).toBeNull();
    expect(
      await sessionOf(
        new Request('https://game.test/x', { headers: { authorization: `Bearer ${token}` } }),
        env,
        NOW + 31 * 86400000,
      ),
    ).toBeNull();
  });
  it('rejects invalid tickets and unconfigured servers before calling Valve', async () => {
    const fetcher = vi.fn();
    expect((await steamLogin(request({ ticket: 'not-hex' }), env, fetcher, NOW)).status).toBe(400);
    expect((await steamLogin(request({ ticket: '0102' }), {} as Env, fetcher, NOW)).status).toBe(
      503,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects a Valve error or publisher-banned account without issuing a token', async () => {
    for (const params of [
      { result: 'Fail' },
      { result: 'OK', steamid: '76561198000000001', publisherbanned: true },
    ]) {
      const fetcher = (() =>
        Promise.resolve(new Response(JSON.stringify({ response: { params } })))) as typeof fetch;
      expect((await steamLogin(request({ ticket: '0102' }), env, fetcher, NOW)).status).toBe(401);
    }
  });
  it('does not accept a Google token through the desktop Steam bearer path', async () => {
    const token = await makeSession(
      env.SESSION_SECRET!,
      { provider: 'google', account: await sha256('google:one') },
      NOW,
    );
    expect(
      await sessionOf(
        new Request('https://game.test/x', { headers: { authorization: `Bearer ${token}` } }),
        env,
        NOW,
      ),
    ).toBeNull();
  });
});
