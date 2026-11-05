import { SHARED_REPORT_ID, SHARED_REPORT_DAYS, validPerformanceReport } from '@sr/pvp';
import type { Env } from './env';
import { allowedOrigin } from './origins';
import { sha256 } from './auth';

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};

/** Tiny public links work in Discord and are readable without the game or a login. */
export async function sharedReports(request: Request, env: Env, id?: string): Promise<Response> {
  const url = new URL(request.url),
    origin = request.headers.get('origin');
  const allowed = !!origin && (origin === 'srgame://local' || allowedOrigin(origin, url.host));
  const cors = allowed
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        vary: 'Origin',
      }
    : {};
  const json = (body: unknown, status: number) =>
    Response.json(body, { status, headers: { ...headers, ...cors } });
  if (!id && request.method === 'OPTIONS')
    return new Response(null, { status: allowed ? 204 : 403, headers: cors });
  if (id && request.method === 'GET') {
    if (!SHARED_REPORT_ID.test(id)) return json({ ok: false }, 404);
    const res = await env.BOARD.get(env.BOARD.idFromName('main')).fetch(
      new Request(`https://board.invalid/reports/get?id=${id}`),
    );
    if (!res.ok)
      return new Response('This report is unavailable or has expired.', {
        status: res.status,
        headers,
      });
    const data = await res.json<{ id: string; at: number; text: string }>();
    if (url.searchParams.get('format') === 'json') return json(data, 200);
    return new Response(
      `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shattered Rifts performance report</title><meta name="description" content="A shared Shattered Rifts performance recording for review."><style>body{font:16px system-ui;background:#10141c;color:#eee;max-width:1100px;margin:24px auto;padding:0 16px}pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5}a{color:#a9caff}</style><h1>Performance report</h1><p>Shared ${escape(new Date(data.at).toISOString())}. Available for up to ${SHARED_REPORT_DAYS} days; older reports may be removed when storage is full. This report was supplied by a player.</p><p><a href="?format=json">View report data</a> · <a href="https://shatteredrifts.app/">Shattered Rifts</a></p><pre>${escape(data.text)}</pre></html>`,
      { headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } },
    );
  }
  if (id || request.method !== 'POST') return json({ ok: false }, 405);
  if (!allowed) return json({ ok: false, error: 'origin' }, 403);
  // Bound streamed requests too, rather than trusting Content-Length.
  if (Number(request.headers.get('content-length') ?? 0) > 230_000)
    return json({ ok: false, error: 'too-large' }, 413);
  const stream = request.body as ReadableStream<Uint8Array> | null;
  const reader = stream?.getReader();
  if (!reader) return json({ ok: false, error: 'empty' }, 400);
  let text = '',
    bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.length;
      if (bytes > 230_000) {
        await reader.cancel();
        return json({ ok: false, error: 'too-large' }, 413);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const body = JSON.parse(text) as { text?: unknown };
    if (!validPerformanceReport(body?.text))
      return json({ ok: false, error: 'invalid-report' }, 400);
    const ip = await sha256(
      `shared-report-ip:${request.headers.get('CF-Connecting-IP') ?? 'local'}`,
    );
    const res = await env.BOARD.get(env.BOARD.idFromName('main')).fetch(
      new Request('https://board.invalid/reports/save', {
        method: 'POST',
        body: JSON.stringify({ text: body.text, ip }),
      }),
    );
    return json(await res.json(), res.status);
  } catch {
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}
