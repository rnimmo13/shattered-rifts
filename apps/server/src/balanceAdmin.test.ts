import { expect, it, vi } from 'vitest';
import { balanceAdmin } from './balanceAdmin';
import type { Env } from './env';
it('keeps deck exports private and uncached, requiring a configured owner secret', async () => {
  const fetch = vi.fn(() =>
    Promise.resolve(Response.json({ schema: 1, games: [], next: 0, more: false })),
  );
  const env = {
    BALANCE_ADMIN_TOKEN: 'a'.repeat(40),
    BOARD: { idFromName: () => '', get: () => ({ fetch }) },
  } as unknown as Env;
  for (const token of ['', 'wrong', 'a'.repeat(40) + 'x']) {
    expect(
      (
        await balanceAdmin(
          new Request('https://example.test/admin/balance', {
            headers: { authorization: 'Bearer ' + token },
          }),
          env,
        )
      ).status,
    ).toBe(401);
  }
  expect(fetch).not.toHaveBeenCalled();
  const request = new Request('https://example.test/admin/balance?after=12', {
    headers: { authorization: 'Bearer ' + env.BALANCE_ADMIN_TOKEN },
  });
  const res = await balanceAdmin(request, env);
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('no-store');
  expect(res.headers.has('access-control-allow-origin')).toBe(false);
  expect(fetch).toHaveBeenCalledOnce();
  expect(
    (await balanceAdmin(request, { ...env, BALANCE_ADMIN_TOKEN: undefined } as unknown as Env))
      .status,
  ).toBe(401);
});
