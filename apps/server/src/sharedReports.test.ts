import { expect, it, vi } from 'vitest';
import { sharedReports } from './sharedReports';
import type { Env } from './env';
import { validPerformanceReport } from '@sr/pvp';

const text =
  'Shattered Rifts performance report (test)\n== Machine ==\nGraphics: test\n== Frames ==\n<script>alert(1)</script>';
const id = 'a'.repeat(32);
it('bounds Unicode report bytes without silently truncating the recording', () => {
  expect(validPerformanceReport(text)).toBe(true);
  expect(validPerformanceReport(text + '💥'.repeat(50_000))).toBe(false);
});
it('accepts explicit reports only from game origins and enforces the payload bound before storage', async () => {
  const fetch = vi.fn(() => Promise.resolve(Response.json({ ok: true, id })));
  const env = { BOARD: { idFromName: () => '', get: () => ({ fetch }) } } as unknown as Env;
  const post = (origin: string, body = JSON.stringify({ text }), extra = {}) =>
    new Request('https://game.test/pvp/reports', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', ...extra },
      body,
    });
  expect((await sharedReports(post('https://evil.invalid'), env)).status).toBe(403);
  expect(
    (await sharedReports(post('https://game.test', JSON.stringify({ text: 'unrelated' })), env))
      .status,
  ).toBe(400);
  expect(
    (await sharedReports(post('https://game.test', '{}', { 'content-length': '999999' }), env))
      .status,
  ).toBe(413);
  expect(fetch).not.toHaveBeenCalled();
  expect(
    (
      await sharedReports(
        post('https://game.test', JSON.stringify({ text: 'x'.repeat(240_000) })),
        env,
      )
    ).status,
  ).toBe(413);
  const saved = await sharedReports(post('srgame://app'), env);
  expect(saved.status).toBe(200);
  expect(saved.headers.get('cache-control')).toBe('no-store');
  expect(saved.headers.get('access-control-allow-origin')).toBe('srgame://app');
  expect(await saved.json()).toEqual({ ok: true, id });
  const forwarded = fetch.mock.calls[0] as unknown as [Request];
  const body = await forwarded[0].json<{ text: string; ip: string }>();
  expect(body.text).toBe(text);
  expect(body.ip).toMatch(/^[a-f0-9]{64}$/);
  expect((await sharedReports(post('srgame://local'), env)).status).toBe(200);
});
it('serves report text as escaped readable HTML and structured JSON without executing it', async () => {
  const env = {
    BOARD: {
      idFromName: () => '',
      get: () => ({ fetch: () => Promise.resolve(Response.json({ id, at: 1, text })) }),
    },
  } as unknown as Env;
  const html = await sharedReports(new Request(`https://game.test/pvp/reports/${id}`), env, id);
  expect(html.headers.get('content-type')).toContain('text/html');
  expect(html.headers.get('content-security-policy')).toContain("default-src 'none'");
  const body = await html.text();
  expect(body).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(body).not.toContain('<script>');
  const json = await sharedReports(
    new Request(`https://game.test/pvp/reports/${id}?format=json`),
    env,
    id,
  );
  expect(await json.json()).toEqual({ id, at: 1, text });
});
