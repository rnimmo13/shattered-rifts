import { normaliseCode } from '@sr/pvp';
import { sessionOf, sha256 } from './auth';
import type { Env } from './env';

export const PLAY_HEADER = 'x-sr-play-token';
export const PLAY_VAULT_HEADER = 'x-sr-play-vault';
/** the player's leaderboard id, worked out by the Worker from their account or Vault code (never what a browser sent, DECISIONS #804) */
export const PLAY_WHO_HEADER = 'x-sr-play-who';
export interface PlaySocket {
  vault: string;
  token: string;
  /** the leaderboard id the Worker worked out for this socket (a Room and the Matchmaker use it, never a deck's own `who`) */
  who?: string;
}
export const socketPlay = (request: Request): PlaySocket | undefined => {
  const vault = request.headers.get(PLAY_VAULT_HEADER);
  const token = request.headers.get(PLAY_HEADER);
  const who = request.headers.get(PLAY_WHO_HEADER);
  return vault && token
    ? { vault, token, ...(who && /^[0-9a-f]{64}$/.test(who) ? { who } : {}) }
    : undefined;
};
/** The leaderboard id of a socket's player: the same one the board gives them (/pvp/board/id), from their account or Vault code. */
export async function playBoardId(
  request: Request,
  env: Env,
  code: unknown,
): Promise<string | null> {
  const session = await sessionOf(request, env);
  if (session) return sha256(`shattered-rifts-board-account:${session.account}`);
  const clean = typeof code === 'string' ? normaliseCode(code) : null;
  return clean ? sha256(`shattered-rifts-board:${clean}`) : null;
}
export async function playVaultName(
  request: Request,
  env: Env,
  code: unknown,
): Promise<string | null> {
  const session = await sessionOf(request, env);
  if (session) return sha256(`shattered-rifts-account-vault:${session.account}`);
  const clean = typeof code === 'string' ? normaliseCode(code) : null;
  return clean ? sha256(`shattered-rifts-vault:${clean}`) : null;
}
export async function checkPlay(env: Env, name: string, token: string): Promise<boolean> {
  return (await askPlay(env, name, token, false)).ok;
}

/** The play check, and the looks the player wears by Riftwalker (DECISIONS #776): the same one request to the Vault. */
export async function playLooks(
  env: Env,
  name: string,
  token: string,
): Promise<{ ok: boolean; skins: Record<string, string> }> {
  return askPlay(env, name, token, true);
}

async function askPlay(
  env: Env,
  name: string,
  token: string,
  looks: boolean,
): Promise<{ ok: boolean; skins: Record<string, string> }> {
  const none = { ok: false, skins: {} };
  try {
    const response = await env.VAULT.get(env.VAULT.idFromName(name)).fetch(
      new Request('https://vault.invalid/play/check', {
        method: 'POST',
        headers: { [PLAY_HEADER]: token },
        body: looks ? '{"looks":true}' : '{}',
      }),
    );
    if (!response.ok) return none;
    const data = await response.json<{ expires?: unknown; skins?: unknown }>();
    if (!(typeof data.expires === 'number' && Date.now() < data.expires)) return none;
    const skins: Record<string, string> = {};
    if (typeof data.skins === 'object' && data.skins !== null)
      for (const [hero, skin] of Object.entries(data.skins as Record<string, unknown>))
        if (typeof skin === 'string') skins[hero] = skin;
    return { ok: true, skins };
  } catch {
    return none;
  }
}
