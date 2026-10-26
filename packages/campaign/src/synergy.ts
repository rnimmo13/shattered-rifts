// Synergy hints (DECISIONS #243): whether a card on offer fits the deck it would join. Every Riftwalker's cards come in three lanes
// (docs/09_ROSTER.md); a card fits when the deck already holds a few of its lane, and it opens a lane when the deck holds none.
// A hint, never a rule: it only tells the player what they would otherwise have to count.

import { COMBAT_DB, RIFTWALKERS, laneName, laneOf, stripRoll, type HeroId } from '@sr/content/v2';

/** A deck holding this many cards of a lane is building it (fewer is a card or two, not yet a plan). */
export const FIT_AT = 2;

const base = (id: string): string => stripRoll(id).replace(/\+$/, '');

/** The lane a card belongs to, as "hero:lane", or null (basics, glue, Legendary and Ancestral cards have none). */
function laneKey(id: string): { hero: HeroId; lane: number } | null {
  const b = base(id);
  const hero = COMBAT_DB.cards[b]?.hero;
  const lane = laneOf(b);
  if (lane === undefined || !hero || !Object.hasOwn(RIFTWALKERS, hero)) return null;
  return { hero: hero as HeroId, lane };
}

/** How many cards of each lane a deck holds, by "hero:lane". */
export function laneCounts(deck: readonly string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const id of deck) {
    const k = laneKey(id);
    if (k) out.set(`${k.hero}:${k.lane}`, (out.get(`${k.hero}:${k.lane}`) ?? 0) + 1);
  }
  return out;
}

export type Fit =
  /** the deck already builds this card's lane: `n` of its cards are in it */
  | { kind: 'fits'; lane: string; n: number }
  /** the deck has none of this lane yet, while it builds another (a new direction) */
  | { kind: 'new'; lane: string };

/** Whether a card on offer fits the deck (null for a card with no lane, or a lane the deck has only one card of). */
export function fitOf(
  deck: readonly string[],
  cardId: string,
  counts = laneCounts(deck),
): Fit | null {
  const k = laneKey(cardId);
  if (!k) return null;
  const lane = laneName(k.hero, k.lane);
  const n = counts.get(`${k.hero}:${k.lane}`) ?? 0;
  if (n >= FIT_AT) return { kind: 'fits', lane, n };
  // (a new lane is only worth saying once the deck is building another one: early on, every lane is new)
  const building = [0, 1, 2].some((l) => (counts.get(`${k.hero}:${l}`) ?? 0) >= 3);
  if (n === 0 && building) return { kind: 'new', lane };
  return null;
}

/** The lane of its own class a deck leans on most (at least three cards of it), as a lane index, or null. */
export function mainLane(hero: HeroId, deck: readonly string[]): number | null {
  const counts = laneCounts(deck);
  let best: number | null = null;
  let bestN = 2;
  for (let lane = 0; lane < 3; lane++) {
    const n = counts.get(`${hero}:${lane}`) ?? 0;
    if (n > bestN) {
      best = lane;
      bestN = n;
    }
  }
  return best;
}

/** What a hint says on a card: "Fits your Bulwark (4)" or "New lane: Swarm". */
export const fitLabel = (f: Fit): string =>
  f.kind === 'fits' ? `Fits your ${f.lane} (${f.n})` : `New lane: ${f.lane}`;
