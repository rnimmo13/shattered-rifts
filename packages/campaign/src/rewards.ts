// Card rewards (03_CAMPAIGN §2.3, §2.4) for Combat v2. Offers come from the Riftwalker's own pool plus Neutral; about 1 in 10
// is "Rift-crossed" (another Riftwalker's pool). A card that would exceed the copy limit is never offered.

import { nextInt, type RngState } from '@sr/combat';
import {
  BOONS,
  COMBAT_DB,
  POTIONS,
  RIFTWALKERS,
  V2_DECK_RULES,
  rewardPool,
  signatureCards,
  type HeroId,
} from '@sr/content/v2';
import type { Luck, StageRealm } from './types';

export type OfferQuality = 'duel' | 'elite';

const rarityOf = (id: string): string => COMBAT_DB.cards[id]?.rarity ?? 'common';

/** A card can be added unless the deck already holds the copy limit of it (basic cards are exempt). */
export function canAdd(deck: readonly string[], cardId: string): boolean {
  const c = COMBAT_DB.cards[cardId];
  // a card that cannot be played is only worth having if discarding it pays (Reflex, Tactician)
  if (!c || (c.unplayable && !c.onDiscard)) return false;
  if (c.rarity === 'basic') return true;
  // a card and its "+" version share one limit
  const base = (id: string): string => id.replace(/\+$/, '');
  return deck.filter((x) => base(x) === base(cardId)).length < V2_DECK_RULES.maxCopies;
}

/** Cards of every other Riftwalker's pool (the Rift-crossed pool). */
export function crossedPool(hero: HeroId): string[] {
  return (Object.keys(RIFTWALKERS) as HeroId[])
    .filter((h) => h !== hero)
    .flatMap((h) => rewardPool(h).filter((id) => COMBAT_DB.cards[id]?.hero === h));
}

const WEIGHTS: Record<OfferQuality, Record<string, number>> = {
  duel: { common: 65, uncommon: 28, rare: 7 },
  elite: { common: 30, uncommon: 50, rare: 20 },
};

/** Card luck: the same offers, tilted towards better cards (a setting; Normal is the designed game). */
export const LUCK_WEIGHTS: Record<Luck, Record<OfferQuality, Record<string, number>>> = {
  normal: WEIGHTS,
  lucky: {
    duel: { common: 45, uncommon: 38, rare: 17 },
    elite: { common: 15, uncommon: 50, rare: 35 },
  },
  blessed: {
    duel: { common: 20, uncommon: 45, rare: 35 },
    elite: { common: 5, uncommon: 40, rare: 55 },
  },
};

function rollRarity(rng: RngState, quality: OfferQuality, luck: Luck = 'normal'): string {
  const w = LUCK_WEIGHTS[luck][quality];
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
  luck: Luck = 'normal',
): string[] {
  const own = rewardPool(hero).filter((id) => canAdd(deck, id));
  const crossed = crossedPool(hero).filter((id) => canAdd(deck, id));
  const out: string[] = [];
  for (let guard = 0; out.length < count && guard < 200; guard++) {
    const fromCrossed = nextInt(rng, 10) === 0 && crossed.length > 0;
    const pool = (fromCrossed ? crossed : own).filter((id) => !out.includes(id));
    if (pool.length === 0) continue;
    let from = LADDER.indexOf(rollRarity(rng, quality, luck));
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

/** A random card of one rarity from the Riftwalker's own pool that the deck can still take, or null. */
export function cardOfRarity(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  rarity: 'common' | 'uncommon' | 'rare',
): string | null {
  const pool = rewardPool(hero).filter((id) => rarityOf(id) === rarity && canAdd(deck, id));
  return pool.length ? (pool[nextInt(rng, pool.length)] as string) : null;
}

/** A Boon of one rarity the player does not own (any rarity if that one is used up), or null if they own them all. */
export function boonOfRarity(
  rng: RngState,
  owned: readonly string[],
  rarity: 'common' | 'uncommon' | 'rare',
): string | null {
  const left = BOONS.filter((b) => !owned.includes(b.id));
  if (left.length === 0) return null;
  const same = left.filter((b) => b.rarity === rarity);
  const from = same.length ? same : left;
  return (from[nextInt(rng, from.length)] as (typeof BOONS)[number]).id;
}

/** The Warden's Gift: a choice among rare cards of your realm (Warden signature cards come later). */
export function giftOffers(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  count: number,
  bossId = '',
): string[] {
  // the Warden's own cards first, then rare cards of your realm to fill the choice
  const out: string[] = signatureCards(bossId)
    .filter((id) => canAdd(deck, id))
    .slice(0, count);
  const rares = rewardPool(hero).filter(
    (id) => rarityOf(id) === 'rare' && canAdd(deck, id) && !out.includes(id),
  );
  const target = Math.min(count, out.length + rares.length);
  for (let guard = 0; out.length < target && guard < 100; guard++) {
    const pick = rares[nextInt(rng, rares.length)] as string;
    if (!out.includes(pick)) out.push(pick);
  }
  return out;
}

const BOON_WEIGHTS: Record<OfferQuality, Record<string, number>> = {
  duel: { common: 70, uncommon: 25, rare: 5 },
  elite: { common: 45, uncommon: 40, rare: 15 },
};

/** A Boon the player does not own yet (falls down the rarity ladder when a rarity is used up), or null if they have them all. */
export function offerBoon(
  rng: RngState,
  owned: readonly string[],
  quality: OfferQuality,
): string | null {
  const left = BOONS.filter((b) => !owned.includes(b.id));
  if (left.length === 0) return null;
  const w = BOON_WEIGHTS[quality];
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = nextInt(rng, total);
  let want = 'common';
  for (const [rarity, weight] of Object.entries(w)) {
    if (r < weight) {
      want = rarity;
      break;
    }
    r -= weight;
  }
  const order = ['rare', 'uncommon', 'common'];
  for (let i = order.indexOf(want); i < order.length; i++) {
    const pool = left.filter((b) => b.rarity === order[i]);
    if (pool.length > 0) return (pool[nextInt(rng, pool.length)] as (typeof BOONS)[number]).id;
  }
  return (left[nextInt(rng, left.length)] as (typeof BOONS)[number]).id;
}

/** A random Potion, weighted toward common ones. */
export function offerPotion(rng: RngState): string {
  const weights = { common: 60, uncommon: 30, rare: 10 } as const;
  const total = 100;
  let r = nextInt(rng, total);
  let want: keyof typeof weights = 'common';
  for (const k of Object.keys(weights) as (keyof typeof weights)[]) {
    if (r < weights[k]) {
      want = k;
      break;
    }
    r -= weights[k];
  }
  const pool = POTIONS.filter((p) => p.rarity === want);
  const from = pool.length > 0 ? pool : POTIONS;
  return (from[nextInt(rng, from.length)] as (typeof POTIONS)[number]).id;
}

export const POTION_PRICE: Record<string, number> = { common: 30, uncommon: 50, rare: 80 };
export const MAX_POTIONS = 3;

export const BOON_PRICE: Record<string, number> = { common: 70, uncommon: 120, rare: 200 };

export const PRICE: Record<string, number> = { common: 30, uncommon: 55, rare: 95 };
export const priceOf = (id: string): number => PRICE[rarityOf(id)] ?? 60;
export const REMOVE_PRICE = 40;

/** For the stage-clear screen and the map: the realm's display name. */
export const REALM_LABEL: Record<StageRealm, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  rift: 'The Heart of the Rift',
};
