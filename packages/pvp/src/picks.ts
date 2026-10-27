// Choosing a deck before each game of a match (DECISIONS #307). Pure: the room keeps who picked what and asks these.

import type { Seat } from './protocol';

/**
 * The deck a player plays the next game with: the one they picked, or else the one they played last, or else their first. An index
 * out of range (a list that changed) falls through to the next.
 */
export function deckToPlay(count: number, pick?: number, last?: number): number {
  const ok = (i: number | undefined): i is number =>
    i !== undefined && Number.isInteger(i) && i >= 0 && i < count;
  return ok(pick) ? pick : ok(last) ? last : 0;
}

/** Both players have their deck for the next game: picked, or with only one to play (`auto`: a seat the computer plays). */
export function picksDone(
  counts: Partial<Record<Seat, number>>,
  picks: Partial<Record<Seat, number>>,
  auto?: Seat,
): boolean {
  return (['a', 'b'] as const).every(
    (s) => s === auto || (counts[s] ?? 0) <= 1 || picks[s] !== undefined,
  );
}
