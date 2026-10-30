// Card rewards (03_CAMPAIGN §2.3, §2.4) for Combat v2. Offers come from the Riftwalker's own pool plus Neutral; about 1 in 10
// is "Rift-crossed" (another Riftwalker's pool). A card the deck already holds 5 of (or a Legendary or Ancestral one it holds) is never offered (DECISIONS #337).

import { nextInt, type CardDef, type Op, type RngState } from '@sr/combat';
import {
  BOONS,
  COMBAT_DB,
  POTIONS,
  RIFTWALKERS,
  V2_DECK_RULES,
  maxCopiesOf,
  ancestralCards,
  stripRoll,
  rewardPool,
  type HeroId,
} from '@sr/content/v2';
import type { StageRealm } from './types';

export type OfferQuality = 'duel' | 'elite';

const rarityOf = (id: string): string => COMBAT_DB.cards[id]?.rarity ?? 'common';

/**
 * A card can be added unless the deck holds 5 of it already, or it is a Legendary or Ancestral card the deck already holds (#337), or
 * (with `rarityLimits`, the default) the deck already holds its Legendary or its two Ancestral cards. Checking a deck that already
 * exists (a Vault deck, a ghost) passes false: one built before the limits came down (DECISIONS #238) is still a deck, only not one
 * for the Arena.
 */
export function canAdd(deck: readonly string[], cardId: string, rarityLimits = true): boolean {
  const c = COMBAT_DB.cards[cardId];
  // a card that cannot be played is only worth having if discarding it pays (Reflex, Tactician)
  if (!c || (c.unplayable && !c.onDiscard)) return false;
  // a deck holds one Legendary and two Ancestral cards, so taking one is a choice (a deck that is full is never offered more)
  const held = (rarity: string): number =>
    deck.filter((x) => rarityOf(stripRoll(x).replace(/\+$/, '')) === rarity).length;
  if (rarityLimits && c.rarity === 'legendary' && held('legendary') >= V2_DECK_RULES.maxLegendary)
    return false;
  if (rarityLimits && c.rarity === 'ancestral' && held('ancestral') >= V2_DECK_RULES.maxAncestral)
    return false;
  // at most 5 copies of any card, basics too, and a Legendary or Ancestral card is one of a kind (a card and its "+" count as one; #337)
  const base = (id: string): string => stripRoll(id).replace(/\+$/, '');
  return deck.filter((x) => base(x) === base(cardId)).length < maxCopiesOf(c.rarity);
}

/**
 * What only one Riftwalker builds (through their trait): cards that spend, count or wait for it never cross over, since they would be
 * dead in another deck. The Trickster's Suits (DECISIONS #387): only her trait keeps the suits played, so "per suit", "if you have
 * played a ♥" and "whenever you make a Full Trick" do nothing for anyone else.
 */
const OWNER_ONLY = new Set<string>([
  'suits',
  'spades',
  'hearts',
  'diamonds',
  'clubs',
  'allSuits',
  // (the Shaman's totems, DECISIONS #418: only his trait gives the positions and the command)
  'totems',
  'totemKinds',
  'totemsOf',
  'spirit',
  'commanded',
  'uprooted',
  'replacedNow',
  'spiritSpent',
  'command',
  'plant',
  'replace',
  'trinity',
  'trinityDone',
  'elementsTurn',
  // (the Monk's Martial Forms, DECISIONS #419: only his trait gives a form, its techniques and Mastery)
  'mastery',
  'masterySpent',
  'techniqueDone',
  'techniquesTurn',
  'defensiveTurn',
  'inRoot',
  'inCurrent',
  'inEmber',
  'technique',
  'formChange',
]);
/** statuses and tags only those traits make worth anything: Spirit, Rousing and Shelter feed a command, Mastery a form, the
 * technique tags a form's objective */
const OWNER_STATUS = new Set<string>(['spirit', 'rousing', 'shelter', 'mastery']);
const OWNER_TAG = new Set<string>(['defensive', 'striking']);
/** whether an effect, or anything it holds (an Aura's trigger, a condition's effects), reads or waits for an owner-only thing */
const readsOwnerOnly = (o: Op): boolean =>
  // (leaving Serene pays only through the Monk's trait, DECISIONS #413: a card that enters it loses most of its worth for anyone else)
  // (and so does one that pays for being in it or entering it: Still Water, Gentle Return)
  (o.op === 'stance' && o.stance === 'calm') ||
  o.op === 'plant' ||
  o.op === 'uproot' ||
  o.op === 'totemSlot' ||
  o.op === 'totemCommand' ||
  o.op === 'totemBoost' ||
  o.op === 'totemPulse' ||
  o.op === 'totemRotate' ||
  o.op === 'form' ||
  ((o.op === 'spend' || o.op === 'status') && OWNER_STATUS.has(o.status)) ||
  ('scale' in o && !!o.scale && (OWNER_ONLY.has(o.scale.by) || o.scale.by === 'calm')) ||
  (o.op === 'when' && (OWNER_ONLY.has(o.by) || o.ops.some(readsOwnerOnly))) ||
  (o.op === 'power' &&
    (OWNER_ONLY.has(o.when) ||
      o.stance === 'calm' ||
      (!!o.tag && OWNER_TAG.has(o.tag)) ||
      o.ops.some(readsOwnerOnly)));
const ownerOnly = (c: CardDef | undefined): boolean =>
  !!c &&
  ((!!c.statusCost && OWNER_ONLY.has(c.statusCost.status)) ||
    (!!c.cheaperPer && OWNER_ONLY.has(c.cheaperPer.by)) ||
    c.effects.some(readsOwnerOnly));

/** Whether a card would be dead in any deck but its owner's (it reads something only its owner's trait builds). */
export const deadElsewhere = (id: string): boolean => ownerOnly(COMBAT_DB.cards[id]);

/** Cards of every other Riftwalker's pool (the Rift-crossed pool). */
export function crossedPool(hero: HeroId): string[] {
  return (Object.keys(RIFTWALKERS) as HeroId[])
    .filter((h) => h !== hero)
    .flatMap((h) =>
      rewardPool(h).filter(
        // (a card that spends or counts a status only its owner builds, would be dead in another deck)
        (id) =>
          COMBAT_DB.cards[id]?.hero === h &&
          COMBAT_DB.cards[id]?.rarity !== 'legendary' &&
          !ownerOnly(COMBAT_DB.cards[id]),
      ),
    );
}

/** Up to `count` different Rift-crossed cards the deck can take, one rarity each (cycling through `rarities`); fewer if the pool runs dry. */
export function crossedOffers(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  rarities: readonly string[],
  count: number,
): string[] {
  const pool = crossedPool(hero).filter((id) => canAdd(deck, id));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const want = rarities[i % rarities.length];
    const from = pool.filter((id) => rarityOf(id) === want && !out.includes(id));
    const any = from.length ? from : pool.filter((id) => !out.includes(id));
    if (!any.length) break;
    out.push(any[nextInt(rng, any.length)] as string);
  }
  return out;
}

// Per card offered (DECISIONS #269). Slay the Spire is the yardstick, but it has three rarities to our four, so Legendary takes the
// top 1% of a fight and rare sits at about Slay the Spire's elite rate; an Elite is a step up from both. (The merchant's stock is
// rolled at the Elite odds too.)
export const CARD_ODDS: Record<OfferQuality, Record<string, number>> = {
  // (no Legendary cards for now, DECISIONS #363: their 1% and 3% went to Rare; put them back when Legendary does)
  duel: { common: 55, uncommon: 35, rare: 10, legendary: 0 },
  elite: { common: 35, uncommon: 42, rare: 23, legendary: 0 },
};

function rollRarity(rng: RngState, quality: OfferQuality): string {
  const w = CARD_ODDS[quality];
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = nextInt(rng, total);
  for (const [rarity, weight] of Object.entries(w)) {
    if (r < weight) return rarity;
    r -= weight;
  }
  return 'common';
}

/** The chance (percent) that a card in an ordinary offer is a Rift-crossed card (another Riftwalker's). */
export const CROSSED_OFFER_CHANCE = 3;

const LADDER = ['legendary', 'rare', 'uncommon', 'common'];

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
    // a Rift-crossed card (another class's) is rare: about 3 in 100, so rewards are nearly always for your own deck
    const fromCrossed = nextInt(rng, 100) < CROSSED_OFFER_CHANCE && crossed.length > 0;
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

/** Ancestral cards the deck can still take (one copy each). They are offered only by special events, never as ordinary rewards. */
export function ancestralPool(deck: readonly string[]): string[] {
  return ancestralCards().filter((id) => canAdd(deck, id));
}

/** A random card of one rarity from the Riftwalker's own pool that the deck can still take, or null. */
export function cardOfRarity(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'ancestral',
): string | null {
  if (rarity === 'ancestral') {
    const a = ancestralPool(deck);
    return a.length ? (a[nextInt(rng, a.length)] as string) : null;
  }
  const pool = rewardPool(hero).filter((id) => rarityOf(id) === rarity && canAdd(deck, id));
  return pool.length ? (pool[nextInt(rng, pool.length)] as string) : null;
}

/** A run holds at most one Legendary Boon (DECISIONS #293): once it has one, no other is offered, sold or given. */
export function holdsLegendBoon(owned: readonly string[]): boolean {
  return owned.some((id) => BOONS.some((b) => b.id === id && b.rarity === 'legendary'));
}

/** A Boon of one rarity the player does not own (any rarity if that one is used up), or null if they own them all. */
export function boonOfRarity(
  rng: RngState,
  owned: readonly string[],
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary',
  /** a Legendary may be offered although one is held: the player swaps one for the other */
  swap = false,
): string | null {
  const legendOk = swap || !holdsLegendBoon(owned);
  const left = BOONS.filter((b) => !owned.includes(b.id) && (legendOk || b.rarity !== 'legendary'));
  if (left.length === 0) return null;
  const same = left.filter((b) => b.rarity === rarity);
  // (a Legendary Boon is only ever given when one was asked for)
  const from = same.length ? same : left.filter((b) => b.rarity !== 'legendary');
  if (!from.length) return null;
  return (from[nextInt(rng, from.length)] as (typeof BOONS)[number]).id;
}

/** The chance (percent) that the Warden's Gift includes one of your Legendary cards. */
export const GIFT_LEGEND_CHANCE = 30;

/**
 * The Warden's Gift: rare cards of YOUR class (never Neutral, Warden or other classes' cards), and sometimes one of your
 * legendaries as well. It can be skipped like any card reward.
 */
export function giftOffers(
  rng: RngState,
  hero: HeroId,
  deck: readonly string[],
  count: number,
  _bossId = '',
): string[] {
  const own = rewardPool(hero).filter(
    (id) => COMBAT_DB.cards[id]?.hero === hero && canAdd(deck, id),
  );
  const out: string[] = [];
  const legends = own.filter((id) => rarityOf(id) === 'legendary');
  const chance = GIFT_LEGEND_CHANCE;
  if (legends.length && nextInt(rng, 100) < chance)
    out.push(legends[nextInt(rng, legends.length)] as string);
  // rare cards of your class; should your deck already hold every one it may (5 copies each), the next rarity down fills the
  // Gift, so a Warden always has cards to give (DECISIONS #352)
  for (const rarity of ['rare', 'uncommon', 'common']) {
    const pool = own.filter((id) => rarityOf(id) === rarity && !out.includes(id));
    for (let guard = 0; out.length < count && pool.length && guard < 100; guard++) {
      const pick = pool[nextInt(rng, pool.length)] as string;
      if (!out.includes(pick)) out.push(pick);
    }
    if (out.length >= count) break;
  }
  return out;
}

/**
 * The chance of each Boon rarity (by where the Boon comes from). Legendary Boons are rare on purpose (DECISIONS #227): an Elite
 * gives one 3% of the time, the merchant never sells one, and clearing a loop may leave one (LOOP_LEGEND_CHANCE).
 */
export const BOON_WEIGHTS: Record<OfferQuality, Record<string, number>> = {
  duel: { common: 70, uncommon: 25, rare: 5, legendary: 0 },
  elite: { common: 50, uncommon: 35, rare: 12, legendary: 3 },
};

/** The chance (percent) that clearing a loop (beating Vorthax) leaves a Legendary Boon you do not have yet. */
export const LOOP_LEGEND_CHANCE = 40;

/** A Boon the player does not own yet (falls down the rarity ladder when a rarity is used up), or null if they have them all. */
export function offerBoon(
  rng: RngState,
  owned: readonly string[],
  quality: OfferQuality,
  /** a shop never sells a Legendary Boon */
  noLegend = false,
  /** a Legendary may be offered although one is held: the player swaps one for the other */
  swap = false,
): string | null {
  noLegend = noLegend || (!swap && holdsLegendBoon(owned));
  const left = BOONS.filter(
    (b) => !owned.includes(b.id) && !(noLegend && b.rarity === 'legendary'),
  );
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
  if (noLegend && want === 'legendary') want = 'rare';
  const order = ['legendary', 'rare', 'uncommon', 'common'];
  for (let i = order.indexOf(want); i < order.length; i++) {
    const pool = left.filter((b) => b.rarity === order[i]);
    if (pool.length > 0) return (pool[nextInt(rng, pool.length)] as (typeof BOONS)[number]).id;
  }
  // (nothing left below what was asked for: never fall back up into a Legendary)
  const rest = left.filter((b) => b.rarity !== 'legendary' || want === 'legendary');
  return rest.length ? (rest[nextInt(rng, rest.length)] as (typeof BOONS)[number]).id : null;
}

/** The chance of each potion rarity. */
export const POTION_WEIGHTS = { common: 60, uncommon: 30, rare: 10 } as const;

/** A random Potion, weighted toward common ones. */
export function offerPotion(rng: RngState): string {
  const weights = POTION_WEIGHTS;
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
/** The deepest Rift Tier for now: clearing this one ends the climb (Bank is the only choice left). */
export const MAX_TIER = 20;

export const BOON_PRICE: Record<string, number> = {
  common: 70,
  uncommon: 120,
  rare: 200,
  legendary: 400,
};

export const PRICE: Record<string, number> = {
  common: 30,
  uncommon: 55,
  rare: 95,
  legendary: 260,
  ancestral: 240,
};
export const priceOf = (id: string): number => PRICE[rarityOf(id)] ?? 60;
export const REMOVE_PRICE = 40;
/**
 * Each card removal bought from a merchant in a run doubles the price of the next (Robert, 2026-10-30; it was 15 more each time up to 100,
 * DECISIONS #243): 40, 80, 160, 320... Past 20 it stops doubling, so the number stays one a save can hold.
 */
export const removePrice = (bought: number): number =>
  REMOVE_PRICE * 2 ** Math.min(20, Math.max(0, bought));
/** One card on each merchant's table is on sale: this share off its price. */
export const SALE_OFF = 0.3;
/**
 * What the merchant charges to upgrade a card: this much the first time at a shop, and each upgrade bought at that same shop makes the next
 * one dearer by the step. The next merchant starts from the base again.
 */
export const UPGRADE_PRICE = 60;
export const UPGRADE_STEP = 40;
export const upgradePrice = (doneHere: number): number =>
  UPGRADE_PRICE + UPGRADE_STEP * Math.max(0, doneHere);

/** For the stage-clear screen and the map: the realm's display name. */
export const REALM_LABEL: Record<StageRealm, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  rift: 'The Heart of the Rift',
};
