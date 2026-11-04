import { normaliseCode } from '@sr/pvp';
import { sessionOf, sha256 } from './auth';
import type { Env } from './env';

export const PLAY_HEADER = 'x-sr-play-token';
export const PLAY_VAULT_HEADER = 'x-sr-play-vault';
export interface PlaySocket {
  vault: string;
  token: string;
}
export const socketPlay = (request: Request): PlaySocket | undefined => {
  const vault = request.headers.get(PLAY_VAULT_HEADER);
  const token = request.headers.get(PLAY_HEADER);
  return vault && token ? { vault, token } : undefined;
};
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
  try {
    const response = await env.VAULT.get(env.VAULT.idFromName(name)).fetch(
      new Request('https://vault.invalid/play/check', {
        method: 'POST',
        headers: { [PLAY_HEADER]: token },
        body: '{}',
      }),
    );
    if (!response.ok) return false;
    const data = await response.json<{ expires?: unknown }>();
    return typeof data.expires === 'number' && Date.now() < data.expires;
  } catch {
    return false;
  }
}
