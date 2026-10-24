// The PvP Worker. The browser build (apps/web/dist) is served as static assets; only /pvp/* reaches this code
// (see run_worker_first in wrangler.jsonc).
//
//   GET /pvp/health            a quick "is the server up"
//   GET /pvp/queue  (WebSocket)  the matchmaking queue
//   GET /pvp/room/CODE (WebSocket)  a match room (a friend code, or the room the queue picked)
//   POST /pvp/vault/list|bank|drop  a player's saved decks: under the signed-in account, or else the Vault code in the JSON body {code, ...}
//   /auth/*                         sign in with Google (auth.ts)

import type { Env } from './env';
import { normaliseCode } from '@sr/pvp';
import { authRoute, sessionOf, sha256 } from './auth';
import { ROOM_CODE } from './wire';

export { Matchmaker } from './matchmaker';
export { MatchRoom } from './room';
export { Vault } from './vault';

/** Pages allowed to open a socket from a browser (the game is also served from GitHub Pages). */
const ORIGINS = [
  /^https:\/\/(www\.)?shatteredrifts\.app$/,
  /^https:\/\/rnimmo13\.github\.io$/,
  /^https:\/\/[a-z0-9-]+\.workers\.dev$/,
  /^https:\/\/[a-z0-9-]+\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

/** A page served from the Worker's own address (a custom domain) is always welcome. */
const sameHost = (origin: string, host: string): boolean => {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });

const VAULT_ACTIONS = new Set(['list', 'bank', 'drop']);

/** The Vault object is named by a hash of the code, so the code itself is never stored. */
async function vaultName(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(`shattered-rifts-vault:${code}`);
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** POST /pvp/vault/<action> with {code, ...}: pass the rest on to that player's Vault. */
async function vault(request: Request, env: Env, action: string): Promise<Response> {
  if (request.method !== 'POST' || !VAULT_ACTIONS.has(action))
    return json({ ok: false, error: 'not found' }, 404);
  if (Number(request.headers.get('content-length') ?? 0) > 20_000)
    return json({ ok: false, error: 'too big' }, 413);
  const text = await request.text();
  if (text.length > 20_000) return json({ ok: false, error: 'too big' }, 413);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'bad-body' }, 400);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    return json({ ok: false, error: 'bad-body' }, 400);
  const body = parsed as Record<string, unknown>;
  // a signed-in account has its own Vault; a guest names theirs with a Vault code
  let name: string;
  if (body['code'] === undefined) {
    const s = await sessionOf(request, env);
    if (!s) return json({ ok: false, error: 'signin' }, 401);
    name = await sha256(`shattered-rifts-account-vault:${s.account}`);
  } else {
    const code = typeof body['code'] === 'string' ? normaliseCode(body['code']) : null;
    if (!code) return json({ ok: false, error: 'bad-code' }, 400);
    name = await vaultName(code);
  }
  const stub = env.VAULT.get(env.VAULT.idFromName(name));
  try {
    const res = await stub.fetch(
      new Request(`https://vault.invalid/${action}`, {
        method: 'POST',
        body: JSON.stringify({ ...body, code: undefined }),
      }),
    );
    return json(await res.json(), res.status);
  } catch {
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/pvp/health') return json({ ok: true, service: 'shattered-rifts-pvp' });

    // a browser says where the page came from; other clients (a test script) say nothing
    const origin = request.headers.get('Origin');
    if (origin && !ORIGINS.some((re) => re.test(origin)) && !sameHost(origin, url.host))
      return json({ ok: false, error: 'origin not allowed' }, 403);

    const auth = await authRoute(request, env);
    if (auth) return auth;
    const vaultAction = /^\/pvp\/vault\/(\w+)$/.exec(url.pathname)?.[1];
    if (vaultAction !== undefined) {
      if (request.method === 'OPTIONS')
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'POST',
            'access-control-allow-headers': 'content-type',
            'access-control-max-age': '86400',
          },
        });
      return vault(request, env, vaultAction);
    }
    if (url.pathname === '/pvp/queue') {
      const stub = env.MATCHMAKER.get(env.MATCHMAKER.idFromName('main'));
      return stub.fetch(request);
    }
    const room = /^\/pvp\/room\/([A-Za-z0-9]+)$/.exec(url.pathname)?.[1]?.toUpperCase();
    if (room && ROOM_CODE.test(room)) {
      const stub = env.MATCH.get(env.MATCH.idFromName(room));
      // the room learns its own code from the path
      return stub.fetch(new Request(`https://room.invalid/pvp/room/${room}`, request));
    }
    return json({ ok: false, error: 'not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
