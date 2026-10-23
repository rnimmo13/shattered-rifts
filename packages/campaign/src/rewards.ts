// Card rewards (03_CAMPAIGN §2.3, §2.4) for Combat v2. Offers come from the Riftwalker's realm plus Neutral; about 1 in 10
// is "Rift-crossed" (another realm). A card that would exceed the copy limit is never offered.

import { nextInt, type RngState } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, rewardPool, type HeroId } from '@sr/content/v2';
import type { StageRealm } from './types';

export type OfferQuality = 'duel' | 'elite';

const rarityOf = (id: string): string => COMBAT_DB.cards[id]?.rarity ?? 'common';

/** A card can be added unless the deck already holds the copy limit of it (basic cards are exempt). */
export function canAdd(deck: readonly string[], cardId: string): boolean {
  const c = COMBAT_DB.cards[cardId];
  if (!c || c.unplayable) return false;
  if (c.rarity === 'basic') return true;
  return deck.filter((x) => x === cardId).length < V2_DECK_RULES.maxCopies;
}

/** Cards of the other three playable realms (the Rift-crossed pool). */
export function crossedPool(hero: HeroId): string[] {
  const mine = RIFTWALKERS[hero].realm;
  return (Object.keys(RIFTWALKERS) as HeroId[])
    .filter((h) => RIFTWALKERS[h].realm !== mine)
    .flatMap((h) => rewardPool(h).filter((id) => COMBAT_DB.cards[id]?.realm !== 'neutral'));
}

const WEIGHTS: Record<OfferQuality, Record<string, number>> = {
  duel: { common: 65, uncommon: 28, rare: 7 },
  elite: { common: 30, uncommon: 50, rare: 20 },
};

function rollRarity(rng: RngState, quality: OfferQuality): string {
  const w = WEIGHTS[quality];
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = nextInt(rng, total);
  for (const [rarity, weight] of Object.entries(w)) {
    if (r < weight) return rarity;
    r -= weight;
  }
  return 'common';
}

const LADDER = ['rare', 'uncommon', 'common'];

/** `count` distinct cards to choose from, falling down the rarity ladder when a rarity has nothing left. */
export function offerCards(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  quality: OfferQuality,
  count: number,
): string[] {
  const own = rewardPool(hero).filter((id) => canAdd(deck, id));
  const crossed = crossedPool(hero).filter((id) => canAdd(deck, id));
  const out: string[] = [];
  for (let guard = 0; out.length < count && guard < 200; guard++) {
    const fromCrossed = nextInt(rng, 10) === 0 && crossed.length > 0;
    const pool = (fromCrossed ? crossed : own).filter((id) => !out.includes(id));
    if (pool.length === 0) continue;
    let from = LADDER.indexOf(rollRarity(rng, quality));
    let candidates: string[] = [];
    while (from < LADDER.length && candidates.length === 0) {
      candidates = pool.filter((id) => rarityOf(id) === LADDER[from]);
      from++;
    }
    if (candidates.length === 0) candidates = pool;
    out.push(candidates[nextInt(rng, candidates.length)] as string);
  }
  return out;
}

/** The Warden's Gift: a choice among rare cards of your realm (Warden signature cards come later). */
export function giftOffers(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  count: number,
): string[] {
  const rares = rewardPool(hero).filter((id) => rarityOf(id) === 'rare' && canAdd(deck, id));
  const out: string[] = [];
  for (let guard = 0; out.length < count && out.length < rares.length && guard < 100; guard++) {
    const pick = rares[nextInt(rng, rares.length)] as string;
    if (!out.includes(pick)) out.push(pick);
  }
  return out;
}

export const PRICE: Record<string, number> = { common: 30, uncommon: 55, rare: 95 };
export const priceOf = (id: string): number => PRICE[rarityOf(id)] ?? 60;
export const REMOVE_PRICE = 40;
export const MIN_DECK = V2_DECK_RULES.minSize;

/** For the stage-clear screen and the map: the realm's display name. */
export const REALM_LABEL: Record<StageRealm, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  rift: 'The Heart of the Rift',
};
