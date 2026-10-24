// The PvP Worker. The browser build (apps/web/dist) is served as static assets; only /pvp/* reaches this code
// (see run_worker_first in wrangler.jsonc).
//
//   GET /pvp/health            a quick "is the server up"
//   GET /pvp/queue  (WebSocket)  the matchmaking queue
//   GET /pvp/room/CODE (WebSocket)  a match room (a friend code, or the room the queue picked)

import type { Env } from './env';
import { ROOM_CODE } from './wire';

export { Matchmaker } from './matchmaker';
export { MatchRoom } from './room';

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/pvp/health') return json({ ok: true, service: 'shattered-rifts-pvp' });

    // a browser says where the page came from; other clients (a test script) say nothing
    const origin = request.headers.get('Origin');
    if (origin && !ORIGINS.some((re) => re.test(origin)) && !sameHost(origin, url.host))
      return json({ ok: false, error: 'origin not allowed' }, 403);

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
