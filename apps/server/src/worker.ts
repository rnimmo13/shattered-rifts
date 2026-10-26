// The PvP Worker. The browser build (apps/web/dist) is served as static assets; only /pvp/* reaches this code
// (see run_worker_first in wrangler.jsonc).
//
//   GET /pvp/health            a quick "is the server up"
//   GET /pvp/queue  (WebSocket)  the matchmaking queue
//   GET /pvp/room/CODE (WebSocket)  a match room (a friend code, or the room the queue picked)
//   POST /pvp/vault/list|bank|drop  a player's saved decks: under the signed-in account, or else the Vault code in the JSON body {code, ...}
//   /pvp/board/*                    the weekly and monthly leaderboards (board.ts)
//   /auth/*                         sign in with Google (auth.ts)

import type { Env } from './env';
import { normaliseCode, runKey } from '@sr/pvp';
import { authRoute, sessionOf, sha256 } from './auth';
import { ROOM_CODE } from './wire';

export { Matchmaker } from './matchmaker';
export { MatchRoom } from './room';
export { Vault } from './vault';
export { Leaderboard } from './board';

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
    const data = await res.json<{ ok?: boolean }>();
    // a deck that was just saved can be met as a ghost (the player's Arena name comes with it)
    if (action === 'bank' && res.ok && data.ok) await registerSavedGhost(request, env, body);
    return json(data, res.status);
  } catch {
    return json({ ok: false, error: 'unavailable' }, 503);
  }
}

/** Tell the leaderboard about a deck that was saved, so it can be a ghost. Never fails the save. */
async function registerSavedGhost(
  request: Request,
  env: Env,
  body: Record<string, unknown>,
): Promise<void> {
  try {
    const owner = await boardId(request, env, body);
    const d = body['deck'] as Record<string, unknown> | undefined;
    if (!owner || !d) return;
    await env.BOARD.get(env.BOARD.idFromName('main')).fetch(
      new Request('https://board.invalid/ghost/register', {
        method: 'POST',
        body: JSON.stringify({
          owner,
          entry: {
            name: body['name'],
            hero: d['hero'],
            deck: d['deck'],
            boons: d['boons'],
            tier: d['tier'],
            stage: d['stage'],
            run: typeof d['id'] === 'string' ? runKey(d['id']) : undefined,
          },
        }),
      }),
    );
  } catch {
    /* the deck is saved either way */
  }
}

/** The id a player has on the leaderboards: a hash derived from their account or their Vault code, never the code itself. */
async function boardId(
  request: Request,
  env: Env,
  body: Record<string, unknown>,
): Promise<string | null> {
  if (body['code'] === undefined) {
    const s = await sessionOf(request, env);
    return s ? await sha256(`shattered-rifts-board-account:${s.account}`) : null;
  }
  const code = typeof body['code'] === 'string' ? normaliseCode(body['code']) : null;
  return code ? await sha256(`shattered-rifts-board:${code}`) : null;
}

const CORS_POST = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

/**
 * GET  /pvp/board/pvp|runs?period=week|month   a leaderboard
 * POST /pvp/board/ghostboss {code?}              a ghost deck to stand in for a campaign Warden (cards and Boons included)
 * GET  /pvp/board/ghostdecks                    the decks that can be met as ghosts (who, Riftwalker, how far; never the cards)
 * POST /pvp/board/id    {code?}                 this player's leaderboard id (so a match can carry it)
 * POST /pvp/board/run   {code?, run, name, hero, tier, stage}   a run has reached this far (counted under the player's claimed username)
 * POST /pvp/board/claim {code?, name}            claim a username: 3 to 20 characters, and no two players share one
 * POST /pvp/board/trophies {code?}              this player's Arena trophies (DECISIONS #238)
 */
async function boardRoute(request: Request, env: Env, what: string, url: URL): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_POST });
  const stub = env.BOARD.get(env.BOARD.idFromName('main'));
  try {
    if (
      request.method === 'GET' &&
      (what === 'pvp' || what === 'runs' || what === 'ghosts' || what === 'ghostdecks')
    ) {
      const res = await stub.fetch(
        new Request(
          `https://board.invalid/${what}?period=${url.searchParams.get('period') === 'month' ? 'month' : 'week'}`,
        ),
      );
      // a board is worked out afresh at most twice a minute per edge, however often it is asked for
      return new Response(JSON.stringify(await res.json()), {
        status: res.status,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'cache-control': 'public, max-age=30',
        },
      });
    }
    if (
      request.method !== 'POST' ||
      (what !== 'id' &&
        what !== 'run' &&
        what !== 'claim' &&
        what !== 'view' &&
        what !== 'trophies' &&
        what !== 'ghostboss')
    )
      return json({ ok: false, error: 'not found' }, 404);
    const text = await request.text();
    // (a ghost Warden request carries the ghosts a run has met: up to 25 ids of 64 characters)
    if (text.length > (what === 'ghostboss' ? 4_000 : 2_000))
      return json({ ok: false, error: 'too big' }, 413);
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
        throw new Error('shape');
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'bad-body' }, 400);
    }
    const id = await boardId(request, env, body);
    if (what === 'view') {
      // anyone may look at a board; someone who is known also sees where they stand (a visitor with no id just sees the board)
      const res = await stub.fetch(
        new Request('https://board.invalid/view', {
          method: 'POST',
          body: JSON.stringify({
            kind: body['kind'],
            period: body['period'],
            player: id ?? undefined,
          }),
        }),
      );
      return json(await res.json(), res.status);
    }
    if (what === 'ghostboss') {
      // a ghost to stand in for a campaign Warden: anyone may ask (someone who is known never meets their own deck)
      const res = await stub.fetch(
        new Request('https://board.invalid/ghost/boss', {
          method: 'POST',
          body: JSON.stringify({
            requester: id ?? undefined,
            // the player's tier (a ghost near it is chosen) and the ghosts this run has met (never met twice)
            tier: body['tier'],
            exclude: body['exclude'],
            // where it came from (hashed), so one address cannot ask over and over to collect decks
            ip: await sha256(
              `shattered-rifts-board-ip:${request.headers.get('CF-Connecting-IP') ?? 'local'}`,
            ),
          }),
        }),
      );
      return json(await res.json(), res.status);
    }
    if (!id)
      return json({ ok: false, error: body['code'] === undefined ? 'signin' : 'bad-code' }, 401);
    if (what === 'id') return json({ ok: true, id });
    if (what === 'trophies') {
      // the Trophy case: this player's Arena trophies
      const res = await stub.fetch(
        new Request('https://board.invalid/trophies', {
          method: 'POST',
          body: JSON.stringify({ player: id }),
        }),
      );
      return json(await res.json(), res.status);
    }
    const res = await stub.fetch(
      new Request(
        what === 'claim' ? 'https://board.invalid/name/claim' : 'https://board.invalid/run',
        {
          method: 'POST',
          body: JSON.stringify({
            ...body,
            code: undefined,
            player: id,
            // where it came from (hashed), so one address cannot flood the board
            ip: await sha256(
              `shattered-rifts-board-ip:${request.headers.get('CF-Connecting-IP') ?? 'local'}`,
            ),
          }),
        },
      ),
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
    const boardWhat = /^\/pvp\/board\/(\w+)$/.exec(url.pathname)?.[1];
    if (boardWhat !== undefined) return boardRoute(request, env, boardWhat, url);
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
