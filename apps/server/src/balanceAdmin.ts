import type { Env } from './env';

/** Owner-only, server-to-server export. No browser token storage or public deck endpoint. */
export async function balanceAdmin(request: Request, env: Env): Promise<Response> {
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  const reject = (status: number) =>
    new Response(JSON.stringify({ ok: false }), { status, headers });
  if (request.method !== 'GET') return reject(405);
  const secret = env.BALANCE_ADMIN_TOKEN;
  const given = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!secret || secret.length < 32 || !given || given.length > 512) return reject(401);
  const digest = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(secret), digest(given)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  if (diff) return reject(401);
  const url = new URL(request.url);
  const after = url.searchParams.get('after') ?? '0';
  if (!/^\d{1,15}$/.test(after)) return reject(400);
  const kind = url.searchParams.get('kind') ?? 'arena';
  // (fights: every online Campaign fight with its numbers and replay, DECISIONS #714)
  if (!['arena', 'campaign', 'fights'].includes(kind)) return reject(400);
  try {
    const res = await env.BOARD.get(env.BOARD.idFromName('main')).fetch(
      new Request(
        `https://board.invalid/balance/${kind === 'arena' ? '' : `${kind}/`}export?after=${after}`,
      ),
    );
    return new Response(await res.text(), { status: res.status, headers });
  } catch {
    return reject(503);
  }
}
