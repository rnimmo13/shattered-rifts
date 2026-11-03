// Which arena an Arena match is fought in: the Crossing, the Rift-crossed colosseum built for duels between Riftwalkers, so
// both players (and anyone watching, or a replay) see the same. It is symmetric, so neither side has the better half.

import type { VenueId } from '../duel/scene/venue';

export function arenaFor(_seed: string): VenueId {
  return 'crossing';
}
