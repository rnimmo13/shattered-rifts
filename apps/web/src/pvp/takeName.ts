import { claimName } from './boardApi';
import { setClaimed, setName } from './config';

/** Claim `name` and, if it is free, keep it. Resolves to why not (and whether the server could not be reached), or null when the name is now this player's. */
export async function takeName(
  name: string,
): Promise<{ message: string; unreachable: boolean } | null> {
  const r = await claimName(name);
  if (!r.ok) return { message: r.message, unreachable: r.error === 'unreachable' };
  setName(r.name);
  setClaimed(r.name);
  return null;
}
