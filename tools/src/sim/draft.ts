// A simple "draft bot" that grows a run deck the way a sensible player would, so the sim can ask
// "does a deck banked after N loops crush one banked after 1?" (the power-plateau goal, DECISIONS #12).
//
// It is a MODEL, not the campaign: no map, no Resolve, no Tempering. It exists to compare tiers.

import { nextInt, seedRng, type CardDef, type RngState } from '@sr/engine';
import { ALL_CARDS, CHARACTERS, character, starterDeck, type CharacterId } from '@sr/content';
import type { DeckSpec } from './play';

const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;

/** Rarity odds per card offer by Rift Tier (03_CAMPAIGN §6.2). Mythic is Vorthax-only. */
function oddsForTier(tier: number): number[] {
  if (tier <= 2) return [70, 25, 4.5, 0.5];
  if (tier <= 4) return [62, 29, 7, 2];
  if (tier <= 6) return [55, 32, 10, 3];
  if (tier <= 9) return [50, 33, 13, 4];
  return [45, 35, 15, 5];
}

export interface DraftOptions {
  /** Regular duel offers per loop (1 of 3 each). Design target: ~2–3 per stage × 4 stages. */
  duelOffers?: number;
  /** Elite offers per loop (better odds). */
  eliteOffers?: number;
  /** Cards removed at shrines per loop. */
  removals?: number;
}

function pickIndex(rng: RngState, n: number): number {
  return nextInt(rng, n);
}

function cardScore(c: CardDef, deck: string[], realm: string, byId: Map<string, CardDef>): number {
  const base = { common: 3, rare: 5, epic: 7, legendary: 9, mythic: 8 }[c.rarity];
  let v = base;
  if (c.type === 'unit' || c.type === 'token') {
    const stats = (c.power ?? 0) + (c.guard ?? 0);
    v += 0.5 * (stats - (2 * c.cost + 1));
  } else if (c.type === 'relic' || c.type === 'rift') v += 0;
  else v += 0.5;
  if (c.realm === realm) v += 1.5;
  else if (c.realm !== 'neutral') v -= 1.5;
  const copies = deck.filter((id) => id === c.id).length;
  v -= 1.5 * copies;
  const sameCost = deck.filter((id) => byId.get(id)?.cost === c.cost).length;
  if (sameCost >= 5) v -= 1.5;
  if (c.cost >= 6 && deck.filter((id) => (byId.get(id)?.cost ?? 0) >= 6).length >= 3) v -= 2;
  const units = deck.filter((id) => byId.get(id)?.type === 'unit').length;
  if (deck.length > 0 && units / deck.length < 0.45 && c.type === 'unit') v += 1.5;
  return v;
}

function legalToAdd(c: CardDef, deck: string[], byId: Map<string, CardDef>): boolean {
  const copies = deck.filter((id) => id === c.id).length;
  if (c.rarity === 'legendary' || c.rarity === 'mythic') {
    if (copies >= 1) return false;
    const big = deck.filter((id) =>
      ['legendary', 'mythic'].includes(byId.get(id)?.rarity ?? ''),
    ).length;
    return big < 2;
  }
  return copies < 3;
}

export function draftDeck(
  id: CharacterId,
  loops: number,
  seed: string,
  opts: DraftOptions = {},
): DeckSpec {
  const ch = character(id);
  const rng = seedRng(`draft:${id}:${seed}`);
  const byId = new Map(ALL_CARDS.map((c) => [c.id, c]));
  const normal = ALL_CARDS.filter(
    (c) => c.collectible && !c.source?.startsWith('boss:') && c.rarity !== 'mythic',
  );
  const signature = ALL_CARDS.filter((c) => c.collectible && c.source?.startsWith('boss:'));
  const ownPool = (r: string) =>
    normal.filter((c) => c.rarity === r && (c.realm === ch.realm || c.realm === 'neutral'));
  const crossPool = (r: string) =>
    normal.filter((c) => c.rarity === r && c.realm !== ch.realm && c.realm !== 'neutral');

  const deck = [...starterDeck(id)];
  const offerSize = 3;

  const rollRarity = (tier: number, boost: boolean): string => {
    const odds = oddsForTier(boost ? tier + 2 : tier);
    let x = nextInt(rng, 10_000) / 100;
    for (let i = 0; i < RARITIES.length; i++) {
      x -= odds[i] as number;
      if (x < 0) return RARITIES[i] as string;
    }
    return 'common';
  };

  const offer = (tier: number, boost: boolean): CardDef[] => {
    const out: CardDef[] = [];
    for (let i = 0; i < offerSize; i++) {
      const r = rollRarity(tier, boost);
      // about 1 in 10 offers is Rift-crossed (another realm's card)
      const pool = nextInt(rng, 10) === 0 ? crossPool(r) : ownPool(r);
      const list = pool.length > 0 ? pool : ownPool('common');
      out.push(list[pickIndex(rng, list.length)] as CardDef);
    }
    return out;
  };

  const choose = (cards: CardDef[]) => {
    const options = cards.filter((c) => legalToAdd(c, deck, byId));
    if (options.length === 0) return;
    const scored = options.map((c) => ({ c, v: cardScore(c, deck, ch.realm, byId) }));
    const best = scored.reduce((b, x) => (x.v > b.v ? x : b));
    // thin, focused decks are strong: skip a mediocre card once the deck is big
    const bar = deck.length <= 24 ? 0 : 3 + 0.35 * (deck.length - 24);
    if (best.v >= bar) deck.push(best.c.id);
  };

  for (let tier = 1; tier <= loops; tier++) {
    for (let i = 0; i < (opts.duelOffers ?? 10); i++) choose(offer(tier, false));
    for (let i = 0; i < (opts.eliteOffers ?? 2); i++) choose(offer(tier, true));
    // Warden's Gift: one signature card per Warden (the best of three), 4 Wardens per loop
    for (let w = 0; w < 4; w++) {
      const gift: CardDef[] = [];
      for (let i = 0; i < 3; i++) gift.push(signature[pickIndex(rng, signature.length)] as CardDef);
      choose(gift);
    }
    // shrine surgery: drop the weakest cards once the deck is above the floor
    for (let i = 0; i < (opts.removals ?? 2) && deck.length > 22; i++) {
      let worst = 0;
      let worstV = Infinity;
      deck.forEach((cid, k) => {
        const c = byId.get(cid) as CardDef;
        const v = cardScore(
          c,
          deck.filter((_, j) => j !== k),
          ch.realm,
          byId,
        );
        if (v < worstV) {
          worstV = v;
          worst = k;
        }
      });
      deck.splice(worst, 1);
    }
  }
  return { label: `${ch.id} T${loops}`, cards: deck, sigil: ch.sigil };
}

export function characterIds(): CharacterId[] {
  return CHARACTERS.map((c) => c.id);
}
