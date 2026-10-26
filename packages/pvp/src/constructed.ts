// The Constructed Arena (DECISIONS #242): decks built card by card from a Riftwalker's whole pool, instead of decks won in a run.
// The deck rules live here so the builder, a saved deck and (once the mode opens) the server all judge a deck the same way. The
// mode itself is switched off (ARENA_MODES.constructed): decks can be built and kept, but nobody can fight with them yet.

import {
  COMBAT_DB,
  RIFTWALKERS,
  V2_DECK_RULES,
  ancestralCards,
  canonicalHero,
  rewardPool,
  type HeroId,
} from '@sr/content/v2';

/**
 * Which Arena modes are open. One switch per mode: flip `constructed` to true (and deploy) to open the Constructed Arena once its
 * queue is built; while it is false the builder still works, and its decks say the mode is coming.
 */
export const ARENA_MODES = { constructed: false } as const;

export const CONSTRUCTED_RULES = {
  minSize: 20,
  maxSize: 30,
  /** copies of any one card (a basic card included) */
  maxCopies: 3,
  maxLegendary: V2_DECK_RULES.maxLegendary,
  maxAncestral: V2_DECK_RULES.maxAncestral,
} as const;

/**
 * The cards a Constructed deck for this Riftwalker may hold: their own pool and the Neutral cards (as their runs offer them), their
 * starting basics, and the classless Ancestral cards. Plain versions only: no "+" upgrades, no Sanctum rolls or engravings, and no
 * other Riftwalker's cards (a Rift-crossed card is a run's luck, not a pick from a list).
 */
export function constructedPool(hero: HeroId): string[] {
  const basics = RIFTWALKERS[hero].starter.filter(
    (id) => COMBAT_DB.cards[id]?.rarity === 'basic' && !id.endsWith('+'),
  );
  return [...new Set([...rewardPool(hero), ...basics, ...ancestralCards()])];
}

const poolCache = new Map<HeroId, Set<string>>();
const poolSet = (hero: HeroId): Set<string> => {
  let s = poolCache.get(hero);
  if (!s) {
    s = new Set(constructedPool(hero));
    poolCache.set(hero, s);
  }
  return s;
};

export type ConstructedCheck = { ok: true } | { ok: false; message: string };

/** Whether one more copy of `id` may go into this deck (the pool and the copy limits; the size is checked on its own). */
export function constructedRoom(hero: HeroId, deck: readonly string[], id: string): boolean {
  if (!poolSet(hero).has(id)) return false;
  if (deck.length >= CONSTRUCTED_RULES.maxSize) return false;
  if (deck.filter((c) => c === id).length >= CONSTRUCTED_RULES.maxCopies) return false;
  const rarity = COMBAT_DB.cards[id]?.rarity;
  const of = (r: string): number => deck.filter((c) => COMBAT_DB.cards[c]?.rarity === r).length;
  if (rarity === 'legendary' && of('legendary') >= CONSTRUCTED_RULES.maxLegendary) return false;
  if (rarity === 'ancestral' && of('ancestral') >= CONSTRUCTED_RULES.maxAncestral) return false;
  return true;
}

/** Whether a whole deck is a legal Constructed deck for this Riftwalker, and if not, the first thing wrong with it. */
export function checkConstructed(heroRaw: unknown, deck: unknown): ConstructedCheck {
  const hero = typeof heroRaw === 'string' ? canonicalHero(heroRaw) : '';
  if (!Object.hasOwn(RIFTWALKERS, hero)) return { ok: false, message: 'Unknown Riftwalker.' };
  if (!Array.isArray(deck) || !deck.every((c) => typeof c === 'string'))
    return { ok: false, message: 'The deck is not a list of cards.' };
  const cards: string[] = deck;
  const { minSize, maxSize } = CONSTRUCTED_RULES;
  if (cards.length < minSize || cards.length > maxSize)
    return {
      ok: false,
      message: `A Constructed deck holds ${minSize} to ${maxSize} cards (this one has ${cards.length}).`,
    };
  const held: string[] = [];
  for (const id of cards) {
    const name = COMBAT_DB.cards[id]?.name ?? id.slice(0, 40);
    if (!poolSet(hero as HeroId).has(id))
      return {
        ok: false,
        message: `${name} is not in ${RIFTWALKERS[hero as HeroId].hero.name}'s Constructed pool.`,
      };
    if (!constructedRoom(hero as HeroId, held, id))
      return { ok: false, message: `Too many copies of ${name}, or of its rarity.` };
    held.push(id);
  }
  return { ok: true };
}
