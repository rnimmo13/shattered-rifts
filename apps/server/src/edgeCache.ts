// (DECISIONS #723) Public read-only data kept at Cloudflare's edge for a short while: however often a page is asked for, the Durable
// Object behind it answers it once per `seconds` per edge, so an open link cannot run up the request bill (the 2026-11-06 outage).

/**
 * Answer a GET from the edge cache, or make it with `make` and keep it there for `seconds`. Only an OK answer is kept. `key` is built
 * from the checked query alone (a made-up URL), so extra or reordered parameters cannot make a new copy and reach the Durable Object.
 */
export async function edgeCached(
  key: string,
  seconds: number,
  make: () => Promise<Response>,
): Promise<Response> {
  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'cache-control': `public, max-age=${seconds}`,
  };
  const req = new Request(key, { method: 'GET' });
  const cache =
    typeof caches !== 'undefined' ? (caches as unknown as { default?: Cache }).default : undefined;
  const hit = cache ? await cache.match(req) : undefined;
  if (hit) return hit;
  const made = await make();
  const res = new Response(await made.text(), { status: made.status, headers });
  if (cache && res.ok) await cache.put(req, res.clone());
  return res;
}
