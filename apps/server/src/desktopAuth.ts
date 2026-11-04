import type { Env } from './env';
import { identityCall } from './identity';
import { readSession, sha256 } from './auth';

export const desktopPage = (message: string, form = '', status = 200): Response =>
  new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shattered Rifts sign-in</title><body><h1>Shattered Rifts</h1><p>${message.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</p>${form}</body></html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-security-policy':
          "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff',
      },
    },
  );

async function smallBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const p = await reader.read();
    if (p.done) break;
    const value: unknown = p.value;
    if (!(value instanceof Uint8Array)) throw new Error('Invalid body');
    size += value.length;
    if (size > 4096) {
      await reader.cancel();
      throw new Error('Body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.length;
  }
  const raw = new TextDecoder().decode(bytes);
  const value: unknown = request.headers
    .get('content-type')
    ?.startsWith('application/x-www-form-urlencoded')
    ? Object.fromEntries(new URLSearchParams(raw))
    : JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid body');
  return value as Record<string, unknown>;
}

export async function desktopAuthRoute(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url),
    action = url.pathname.slice('/auth/desktop/'.length);
  if (!env.IDENTITY || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SESSION_SECRET)
    return desktopPage('Desktop sign-in is not configured on this server.', '', 503);
  if (action === 'browser' && request.method === 'GET') {
    const id = url.searchParams.get('id');
    const result = await identityCall(env, 'inspect', { id });
    if (!result.ok)
      return desktopPage('This sign-in attempt expired. Try again from the desktop app.', '', 410);
    return new Response(null, {
      status: 302,
      headers: {
        location: `/auth/google/start?desktop=${id}`,
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
      },
    });
  }
  if (request.method !== 'POST') return desktopPage('Not found.', '', 404);
  let b: Record<string, unknown>;
  try {
    b = await smallBody(request);
  } catch {
    return desktopPage('Invalid request.', '', 400);
  }
  if (action === 'start') {
    let steam: string | null = null;
    if (b['link'] === true) {
      const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
      const s = await readSession(env.SESSION_SECRET, token, Date.now());
      if (s?.provider !== 'steam')
        return desktopPage('A verified Steam session is required to link accounts.', '', 401);
      steam = s.account;
    }
    const ip = await sha256(request.headers.get('cf-connecting-ip') ?? 'unknown');
    const result = await identityCall(env, 'begin', { challenge: b['challenge'], steam, ip });
    if (!result.ok) return result;
    const { id } = await result.json<{ id: string }>();
    return Response.json(
      { id, url: `${url.origin}/auth/desktop/browser?id=${id}` },
      { headers: { 'cache-control': 'no-store' } },
    );
  }
  if (action === 'exchange') return identityCall(env, 'exchange', b);
  if (action === 'cancel') return identityCall(env, 'cancel', b);
  if (action === 'logout') {
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
    return identityCall(env, 'logout', { token });
  }
  if (action === 'confirm') {
    const cookie = /(?:^|;\s*)sr_desktop_confirm=([^;]+)/.exec(
      request.headers.get('cookie') ?? '',
    )?.[1];
    const s = await readSession(env.SESSION_SECRET, cookie, Date.now());
    if (s?.provider !== 'google')
      return desktopPage('Sign in with Google again to confirm this link.', '', 401);
    const result = await identityCall(env, 'confirm', {
      id: b['id'],
      confirmation: b['confirmation'],
      account: s.account,
      cancel: b['cancel'] === 'yes',
    });
    if (!result.ok)
      return desktopPage(
        (await result.json<{ error?: string }>()).error ?? 'Could not link these accounts.',
        '',
        result.status,
      );
    return desktopPage(
      b['cancel'] === 'yes'
        ? 'Sign-in cancelled. You can return to the game.'
        : 'Confirmed. Return to the desktop game; this browser window can be closed.',
    );
  }
  return desktopPage('Not found.', '', 404);
}
