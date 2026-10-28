// The first choice of a run (Robert, 2026-10-28, DECISIONS #365: "the starting hand just let the player choose two uncommon cards to start the
// run with"): any two of your Riftwalker's own uncommon cards. They take the place of two plain cards of the usual starter (an Attack
// replaces a Strike, anything else a Defend), so the deck keeps its size. This replaced the three build-path kits (DECISIONS #333, #335).

import { COMBAT_DB, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';
import type { StarterPick } from './types';

/** How many uncommon cards a run starts with. */
export const STARTER_PICKS = 2;

/** Every uncommon card of the Riftwalker's own pool that a deck could start with. */
export function starterOptions(hero: HeroId): string[] {
  return rewardPool(hero).filter((id) => {
    const c = COMBAT_DB.cards[id];
    return c?.hero === hero && c.rarity === 'uncommon' && !c.unplayable;
  });
}

/** The choice on offer at the start of a run. */
export const starterPick = (hero: HeroId): StarterPick => ({
  options: starterOptions(hero),
  count: STARTER_PICKS,
});

const isPlainBasic = (id: string): boolean =>
  COMBAT_DB.cards[id]?.hero === 'neutral' && COMBAT_DB.cards[id]?.rarity === 'basic';

/** The starting deck with these cards swapped in for plain Strikes and Defends. */
export function starterDeck(hero: HeroId, picks: readonly string[]): string[] {
  const deck = [...RIFTWALKERS[hero].starter];
  for (const id of picks) {
    const attack = COMBAT_DB.cards[id]?.kind === 'attack';
    let at = deck.findIndex(
      (c) => isPlainBasic(c) && (COMBAT_DB.cards[c]?.kind === 'attack') === attack,
    );
    if (at < 0) at = deck.findIndex(isPlainBasic);
    if (at >= 0) deck.splice(at, 1);
  }
  deck.push(...picks);
  return deck;
}
