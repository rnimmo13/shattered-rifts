import { expect, it, vi } from 'vitest';
import { balanceAdmin } from './balanceAdmin';
import type { Env } from './env';

// (DECISIONS #723) the player-data export is public: no key, kept at the edge for 5 minutes
it('answers with no key, a public short-cached page, and checks its query', async () => {
  const fetch = vi.fn(() =>
    Promise.resolve(Response.json({ schema: 1, games: [], next: 0, more: false })),
  );
  const env = { BOARD: { idFromName: () => '', get: () => ({ fetch }) } } as unknown as Env;
  const res = await balanceAdmin(new Request('https://example.test/admin/balance?after=12'), env);
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  expect(res.headers.get('access-control-allow-origin')).toBe('*');
  expect(fetch).toHaveBeenCalledOnce();
  for (const bad of ['?after=x', '?kind=secrets', '?after=1234567890123456'])
    expect(
      (await balanceAdmin(new Request('https://example.test/admin/balance' + bad), env)).status,
    ).toBe(400);
  expect(
    (await balanceAdmin(new Request('https://example.test/admin/balance', { method: 'POST' }), env))
      .status,
  ).toBe(405);
  expect(fetch).toHaveBeenCalledOnce();
});
