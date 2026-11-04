import type { Env } from './env';
import { makeSession, sha256 } from './auth';

const headers = {
  'content-type': 'application/json',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
};
const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers });

/** Trust only Valve's verified Steam ID, never a client-submitted identity or app ID. */
export async function steamLogin(
  request: Request,
  env: Env,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (
    !env.SESSION_SECRET ||
    !env.STEAM_WEB_API_KEY ||
    !/^[1-9]\d*$/.test(env.STEAM_APP_ID ?? '') ||
    env.STEAM_APP_ID === '480'
  )
    return json({ error: 'Steam sign-in is not configured yet.' }, 503);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'ticket' }, 400);
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      const value: unknown = part.value;
      if (!(value instanceof Uint8Array)) return json({ error: 'ticket' }, 400);
      bytes += value.byteLength;
      if (bytes > 32768) {
        await reader.cancel();
        return json({ error: 'ticket' }, 413);
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    let data: { ticket?: unknown };
    try {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
        return json({ error: 'ticket' }, 400);
      data = parsed;
    } catch {
      return json({ error: 'ticket' }, 400);
    }
    if (
      typeof data.ticket !== 'string' ||
      data.ticket.length < 2 ||
      data.ticket.length > 16384 ||
      !/^(?:[\da-f]{2})+$/i.test(data.ticket)
    )
      return json({ error: 'ticket' }, 400);
    const url = new URL('https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/');
    url.search = new URLSearchParams({
      key: env.STEAM_WEB_API_KEY,
      appid: env.STEAM_APP_ID!,
      ticket: data.ticket,
      identity: 'shattered-rifts',
    }).toString();
    const result = await fetcher(url, { signal: AbortSignal.timeout(10000) });
    const verified = await result.json<{
      response?: { params?: { result?: string; steamid?: string; publisherbanned?: boolean } };
    }>();
    const params = verified.response?.params;
    if (
      !result.ok ||
      params?.result !== 'OK' ||
      !/^765\d{14}$/.test(params.steamid ?? '') ||
      params.publisherbanned
    )
      return json({ error: 'Steam could not verify this session.' }, 401);
    const steamId = params.steamid!;
    const token = await makeSession(
      env.SESSION_SECRET,
      { account: await sha256(`steam:${steamId}`), provider: 'steam' },
      now,
    );
    return json({ token, steamId, expires: now + 30 * 86400000 }, 200);
  } catch {
    return json({ error: 'Steam sign-in is temporarily unavailable.' }, 503);
  }
}
