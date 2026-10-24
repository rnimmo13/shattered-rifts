// Sign in with Google. No personal data is kept: Google tells us a permanent user id (`sub`, from the `openid` scope only: no email,
// no name), and only a one-way hash of "google:" + that id is used, as the account id. The session is a signed cookie.
//
//   GET  /auth/google/start      send the browser to Google
//   GET  /auth/google/callback   Google sends it back here with a code
//   GET  /auth/me                {signedIn, provider}
//   POST /auth/logout            clear the session

import type { Env } from './env';

const SESSION_COOKIE = 'sr_session';
const STATE_COOKIE = 'sr_oauth';
const SESSION_DAYS = 30;
const STATE_MS = 10 * 60 * 1000;
const enc = new TextEncoder();

const hex = (b: ArrayBuffer | Uint8Array): string =>
  Array.from(b instanceof Uint8Array ? b : new Uint8Array(b), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');

export async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

const hmacKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);

async function sign(secret: string, text: string): Promise<string> {
  return hex(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text)));
}

const same = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export interface Session {
  /** the one-way hash that names the account's Vault */
  account: string;
  provider: 'google';
}

/** A session token: `v1.<provider>.<account>.<expires>.<signature>`. */
export async function makeSession(secret: string, s: Session, now: number): Promise<string> {
  const body = `v1.${s.provider}.${s.account}.${now + SESSION_DAYS * 86_400_000}`;
  return `${body}.${await sign(secret, body)}`;
}

export async function readSession(
  secret: string,
  token: string | undefined,
  now: number,
): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 5 || parts[0] !== 'v1' || parts[1] !== 'google') return null;
  const [, provider, account, expires, sig] = parts as [string, string, string, string, string];
  if (!/^[0-9a-f]{64}$/.test(account) || !/^\d+$/.test(expires)) return null;
  if (Number(expires) < now) return null;
  const good = await sign(secret, `v1.${provider}.${account}.${expires}`);
  return same(good, sig) ? { account, provider: 'google' } : null;
}

function cookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

const setCookie = (
  request: Request,
  name: string,
  value: string,
  maxAgeS: number,
  path: string,
): string =>
  `${name}=${value}; Max-Age=${maxAgeS}; Path=${path}; HttpOnly; SameSite=Lax${
    new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  }`;

/** Who is asking, from the session cookie (null when nobody is signed in or sign-in is not set up). */
export async function sessionOf(
  request: Request,
  env: Env,
  now = Date.now(),
): Promise<Session | null> {
  if (!env.SESSION_SECRET) return null;
  return readSession(env.SESSION_SECRET, cookies(request)[SESSION_COOKIE], now);
}

const text = (body: string, status: number, extra: Record<string, string> = {}): Response =>
  new Response(body, { status, headers: { 'content-type': 'text/plain', ...extra } });

const json = (body: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  });

const redirect = (to: string, cookiesOut: string[] = []): Response => {
  const h = new Headers({ location: to });
  for (const c of cookiesOut) h.append('set-cookie', c);
  return new Response(null, { status: 302, headers: h });
};

const redirectUri = (request: Request): string =>
  `${new URL(request.url).origin}/auth/google/callback`;

const ready = (env: Env): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET);

function googleStart(request: Request, env: Env): Response {
  // where to land afterwards: the home page or the Arena (only these two, so it can't be made to go anywhere else)
  const to = new URL(request.url).searchParams.get('to') === 'home' ? 'home' : 'arena';
  if (!ready(env)) return text('Sign-in is not set up on this server.', 503);
  const state = hex(crypto.getRandomValues(new Uint8Array(16)));
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID as string);
  url.searchParams.set('redirect_uri', redirectUri(request));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return redirect(url.toString(), [
    setCookie(request, STATE_COOKIE, `${state}.${Date.now()}.${to}`, STATE_MS / 1000, '/auth'),
  ]);
}

/** The `sub` inside a Google id_token. The token comes straight from Google's token endpoint over TLS, so it is not re-verified. */
function subOf(idToken: unknown, audience: string): string | null {
  if (typeof idToken !== 'string') return null;
  const payload = idToken.split('.')[1];
  if (!payload) return null;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))) as {
      sub?: unknown;
      aud?: unknown;
    };
    // a cheap safety net: the token must have been issued to this app
    if (json.aud !== audience) return null;
    return typeof json.sub === 'string' && json.sub ? json.sub : null;
  } catch {
    return null;
  }
}

export async function googleCallback(
  request: Request,
  env: Env,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<Response> {
  if (!ready(env)) return text('Sign-in is not set up on this server.', 503);
  const url = new URL(request.url);
  const clear = setCookie(request, STATE_COOKIE, '', 0, '/auth');
  const [state, at, to] = (cookies(request)[STATE_COOKIE] ?? '').split('.');
  const back = to === 'home' ? '/#/' : '/#/arena';
  const code = url.searchParams.get('code');
  // the state ties the answer to the browser that asked, and a refused or stale attempt just goes back to the game
  if (
    url.searchParams.get('error') ||
    !code ||
    !state ||
    !same(state, url.searchParams.get('state') ?? '') ||
    !(now - Number(at) <= STATE_MS)
  )
    return redirect(back, [clear]);

  let sub: string | null = null;
  try {
    const res = await fetcher('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID as string,
        client_secret: env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: redirectUri(request),
        grant_type: 'authorization_code',
      }),
    });
    if (res.ok)
      sub = subOf(
        (await res.json<{ id_token?: unknown }>()).id_token,
        env.GOOGLE_CLIENT_ID as string,
      );
  } catch {
    sub = null;
  }
  if (!sub) return redirect(back, [clear]);

  const token = await makeSession(
    env.SESSION_SECRET as string,
    { account: await sha256(`google:${sub}`), provider: 'google' },
    now,
  );
  return redirect(back, [
    clear,
    setCookie(request, SESSION_COOKIE, token, SESSION_DAYS * 86_400, '/'),
  ]);
}

/** The /auth/* routes; null when the path is not one of them. */
export async function authRoute(request: Request, env: Env): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (path === '/auth/google/start' && request.method === 'GET') return googleStart(request, env);
  if (path === '/auth/google/callback' && request.method === 'GET')
    return googleCallback(request, env);
  if (path === '/auth/me' && request.method === 'GET') {
    const s = await sessionOf(request, env);
    return json(
      { signedIn: s !== null, provider: s?.provider ?? null, available: ready(env) },
      200,
      { 'cache-control': 'no-store' },
    );
  }
  if (path === '/auth/logout' && request.method === 'POST')
    return json({ ok: true }, 200, {
      'set-cookie': setCookie(request, SESSION_COOKIE, '', 0, '/'),
    });
  return path.startsWith('/auth/') ? text('Not found', 404) : null;
}
