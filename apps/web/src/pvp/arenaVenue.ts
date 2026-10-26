// Which arena an Arena match is fought in: picked from the match's seed, so both players (and anyone watching, or a replay) see the same.

import type { VenueId } from '../duel/scene/venue';

const ARENAS: VenueId[] = ['castle', 'factory', 'forest', 'cave', 'glass', 'swamp', 'alley', 'rift'];

export function arenaFor(seed: string): VenueId {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  return ARENAS[h % ARENAS.length] as VenueId;
}
