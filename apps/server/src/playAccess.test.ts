import { describe, expect, it } from 'vitest';
import { checkPlay, playVaultName } from './playAccess';
import { makeSession, sha256 } from './auth';
import type { Env } from './env';

describe('verified account ownership boundary', () => {
  it('uses the authenticated account even if a different guest code is supplied', async () => {
    const account = await sha256('steam:test');
    const token = await makeSession('secret', { account, provider: 'steam' }, Date.now());
    const request = new Request('https://game.test/pvp/play/claim', {
      headers: { authorization: `Bearer ${token}` },
    });
    const env = { SESSION_SECRET: 'secret' } as Env;
    const first = await playVaultName(request, env, 'ABCDEFGHJKMNPQRS');
    const second = await playVaultName(request, env, '23456789ABCDEFGH');
    expect(first).toBe(second);
    expect(first).toBe(await sha256(`shattered-rifts-account-vault:${account}`));
  });
  it('shares a guest boundary only for the same valid Vault code', async () => {
    const request = new Request('https://game.test/x');
    expect(await playVaultName(request, {} as Env, 'abcdefghjkmnpqrs')).toBe(
      await playVaultName(request, {} as Env, 'ABCDEFGHJKMNPQRS'),
    );
    expect(await playVaultName(request, {} as Env, 'short')).toBeNull();
  });
  it('does not accept a proof check that expired while its response was in flight', async () => {
    for (const [expires, expected] of [
      [Date.now() - 1, false],
      [Date.now() + 60000, true],
    ] as const) {
      const env = {
        VAULT: {
          idFromName: (name: string) => name,
          get: () => ({ fetch: () => Promise.resolve(new Response(JSON.stringify({ expires }))) }),
        },
      } as unknown as Env;
      expect(await checkPlay(env, 'account', 'proof')).toBe(expected);
    }
  });
});
