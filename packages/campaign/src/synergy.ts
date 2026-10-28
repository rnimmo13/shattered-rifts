// Synergy hints (DECISIONS #243): whether a card on offer fits the deck it would join. Every Riftwalker's cards come in build paths
// (docs/09_ROSTER.md); a card fits when the deck already holds a few of its build path, and it opens a build path when the deck holds none.
// A hint, never a rule: it only tells the player what they would otherwise have to count.
//
// OFF for now (Robert, 2026-10-28, DECISIONS #365): while BUILD_PATHS_SHOWN is false, `fitOf` and `mainPath` answer null, so no card is
// hinted at, and nothing that leans on the deck's main build path (the trades, the merchant's stock) has one to lean on. The working
// versions are `fitOfPaths` and `mainPathOf`.

import {
  BUILD_PATHS_SHOWN,
  COMBAT_DB,
  RIFTWALKERS,
  pathName,
  pathOf,
  stripRoll,
  type HeroId,
} from '@sr/content/v2';

/** A deck holding this many cards of a build path is building it (fewer is a card or two, not yet a plan). */
export const FIT_AT = 2;

const base = (id: string): string => stripRoll(id).replace(/\+$/, '');

/** The build path a card belongs to, as "hero:path", or null (basics, glue, Legendary and Ancestral cards have none). */
function pathKey(id: string): { hero: HeroId; path: number } | null {
  const b = base(id);
  const hero = COMBAT_DB.cards[b]?.hero;
  const path = pathOf(b);
  if (path === undefined || !hero || !Object.hasOwn(RIFTWALKERS, hero)) return null;
  return { hero: hero as HeroId, path };
}

/** How many cards of each build path a deck holds, by "hero:path". */
export function pathCounts(deck: readonly string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const id of deck) {
    const k = pathKey(id);
    if (k) out.set(`${k.hero}:${k.path}`, (out.get(`${k.hero}:${k.path}`) ?? 0) + 1);
  }
  return out;
}

export type Fit =
  /** the deck already builds this card's build path: `n` of its cards are in it */
  | { kind: 'fits'; path: string; n: number }
  /** the deck has none of this build path yet, while it builds another (a new direction) */
  | { kind: 'new'; path: string };

/** Whether a card on offer fits the deck (null for a card with no build path, or a build path the deck has only one card of). */
export function fitOf(deck: readonly string[], cardId: string): Fit | null {
  return BUILD_PATHS_SHOWN ? fitOfPaths(deck, cardId) : null;
}

export function fitOfPaths(
  deck: readonly string[],
  cardId: string,
  counts = pathCounts(deck),
): Fit | null {
  const k = pathKey(cardId);
  if (!k) return null;
  const path = pathName(k.hero, k.path);
  const n = counts.get(`${k.hero}:${k.path}`) ?? 0;
  if (n >= FIT_AT) return { kind: 'fits', path, n };
  // (a new build path is only worth saying once the deck is building another one: early on, every build path is new)
  const building = RIFTWALKERS[k.hero].buildPaths.some((_, l) => (counts.get(`${k.hero}:${l}`) ?? 0) >= 3);
  if (n === 0 && building) return { kind: 'new', path };
  return null;
}

/** The build path of its own class a deck leans on most (at least three cards of it), as a build path index, or null. */
export function mainPath(hero: HeroId, deck: readonly string[]): number | null {
  return BUILD_PATHS_SHOWN ? mainPathOf(hero, deck) : null;
}

export function mainPathOf(hero: HeroId, deck: readonly string[]): number | null {
  const counts = pathCounts(deck);
  let best: number | null = null;
  let bestN = 2;
  for (let path = 0; path < RIFTWALKERS[hero].buildPaths.length; path++) {
    const n = counts.get(`${hero}:${path}`) ?? 0;
    if (n > bestN) {
      best = path;
      bestN = n;
    }
  }
  return best;
}

/** What a hint says on a card: "Fits your Bulwark (4)" or "New build path: Swarm". */
export const fitLabel = (f: Fit): string =>
  f.kind === 'fits' ? `Fits your ${f.path} (${f.n})` : `New build path: ${f.path}`;
