import type { Env } from './env';
import { edgeCached } from './edgeCache';

/**
 * The player-data export (DECISIONS #714): every online Campaign fight with its numbers and replay, Campaign deck snapshots and Arena
 * games. Public since #723 (Robert: no key; nothing in it says who a player is beyond a one-way id and the usernames already on the
 * boards). Each page is kept at the edge for 5 minutes, so reading it again and again does not reach the board each time.
 */
export async function balanceAdmin(request: Request, env: Env): Promise<Response> {
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  const reject = (status: number) =>
    new Response(JSON.stringify({ ok: false }), { status, headers });
  if (request.method !== 'GET') return reject(405);
  const url = new URL(request.url);
  const after = url.searchParams.get('after') ?? '0';
  if (!/^\d{1,15}$/.test(after)) return reject(400);
  const kind = url.searchParams.get('kind') ?? 'arena';
  if (!['arena', 'campaign', 'fights'].includes(kind)) return reject(400);
  try {
    return await edgeCached(
      `${url.origin}/admin/balance-cache/${kind}?after=${Number(after)}`,
      300,
      () =>
        env.BOARD.get(env.BOARD.idFromName('main')).fetch(
          new Request(
            `https://board.invalid/balance/${kind === 'arena' ? '' : `${kind}/`}export?after=${after}`,
          ),
        ),
    );
  } catch {
    return reject(503);
  }
}
