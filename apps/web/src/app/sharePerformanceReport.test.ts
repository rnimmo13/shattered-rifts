import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../pvp/config', () => ({ serverBase: () => 'wss://shatteredrifts.app' }));
import { uploadPerformanceReport } from './sharePerformanceReport';
const text = 'Shattered Rifts performance report (test)\n== Machine ==\nGPU\n== Frames ==\n60fps';
afterEach(() => vi.unstubAllGlobals());
it('uploads the full report and returns a short web link rather than report text or a desktop URL', async () => {
  const fetch = vi.fn(() => Promise.resolve(Response.json({ ok: true, id: 'a'.repeat(32) })));
  vi.stubGlobal('fetch', fetch);
  const link = await uploadPerformanceReport(text);
  expect(link).toBe('https://shatteredrifts.app/pvp/reports/' + 'a'.repeat(32));
  expect(link.length).toBeLessThan(100);
  expect(fetch).toHaveBeenCalledWith(
    'https://shatteredrifts.app/pvp/reports',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  );
});
it('preserves an actionable failure and never claims an unconfirmed report was saved', async () => {
  vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 429 })));
  await expect(uploadPerformanceReport(text)).rejects.toThrow('Too many reports');
  vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ ok: true, id: 'bad' })));
  await expect(uploadPerformanceReport(text)).rejects.toThrow('did not confirm');
  vi.stubGlobal('fetch', () => Promise.reject(Error('Network failed')));
  await expect(uploadPerformanceReport(text)).rejects.toThrow('Check your connection');
});
