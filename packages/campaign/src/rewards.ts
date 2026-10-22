// Card rewards (03_CAMPAIGN §2.3, §2.4). Offers come from the character's realm plus Neutral; about 1 in 10 is
// "Rift-crossed" (another realm). Cards that would break the deck rules are never offered.

import { nextInt, type CardDef, type RngState } from '@sr/engine';
import {
  ALL_CARDS,
  CARD_DB,
  DECK_RULES,
  validateDeck,
  character,
  type CharacterId,
} from '@sr/content';
import type { StageRealm } from './types';

export type OfferQuality = 'duel' | 'elite';

const PLAYABLE_TYPES = new Set(['unit', 'spell', 'trap', 'relic', 'rift']);

/** Cards that can show up as ordinary rewards: collectible, not a Warden signature, a real playable type. */
function isRewardCard(c: CardDef): boolean {
  return c.collectible && !c.source && PLAYABLE_TYPES.has(c.type);
}

/** Warden signature cards, keyed by the boss id used in `source` ("boss:seraphine"). */
const BOSS_SOURCE: Record<string, string> = {
  'aur-seraphine': 'boss:seraphine',
  'nex-kron': 'boss:kron',
  'wyl-gorrmaw': 'boss:gorrmaw',
  'umb-nyxara': 'boss:nyxara',
  vorthax: 'boss:vorthax',
};

export function signatureCards(enemyId: string): CardDef[] {
  const src = BOSS_SOURCE[enemyId];
  return src ? ALL_CARDS.filter((c) => c.collectible && c.source === src) : [];
}

export function canAdd(deck: readonly string[], cardId: string): boolean {
  return validateDeck([...deck, cardId], CARD_DB, 0).length === 0;
}

/** Your card pool: realm + Neutral. */
export function ownPool(characterId: CharacterId): CardDef[] {
  const realm = character(characterId).realm;
  return ALL_CARDS.filter((c) => isRewardCard(c) && (c.realm === realm || c.realm === 'neutral'));
}

/** Rift-crossed pool: every other playable realm's cards. */
export function crossedPool(characterId: CharacterId): CardDef[] {
  const realm = character(characterId).realm;
  return ALL_CARDS.filter((c) => isRewardCard(c) && c.realm !== realm && c.realm !== 'neutral');
}

const WEIGHTS: Record<OfferQuality, Record<string, number>> = {
  duel: { common: 70, rare: 25, epic: 5 },
  elite: { common: 25, rare: 50, epic: 20, legendary: 4, mythic: 1 },
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

const LADDER = ['mythic', 'legendary', 'epic', 'rare', 'common'];

/**
 * `count` distinct cards to choose from. Never offers a card the deck cannot legally take.
 * Falls back down the rarity ladder when a rarity has nothing left to offer.
 */
export function offerCards(
  rng: RngState,
  characterId: CharacterId,
  deck: readonly string[],
  quality: OfferQuality,
  count: number,
): string[] {
  const own = ownPool(characterId).filter((c) => canAdd(deck, c.id));
  const crossed = crossedPool(characterId).filter((c) => canAdd(deck, c.id));
  const out: string[] = [];
  for (let guard = 0; out.length < count && guard < 200; guard++) {
    const fromCrossed = nextInt(rng, 10) === 0 && crossed.length > 0;
    const pool = (fromCrossed ? crossed : own).filter((c) => !out.includes(c.id));
    if (pool.length === 0) continue;
    const want = rollRarity(rng, quality);
    let from = LADDER.indexOf(want);
    let candidates: CardDef[] = [];
    while (from < LADDER.length && candidates.length === 0) {
      candidates = pool.filter((c) => c.rarity === LADDER[from]);
      from++;
    }
    if (candidates.length === 0) candidates = pool;
    out.push((candidates[nextInt(rng, candidates.length)] as CardDef).id);
  }
  return out;
}

/** The Warden's Gift: one of that Warden's signature cards (padded with rare+ cards if there are too few). */
export function giftOffers(
  rng: RngState,
  characterId: CharacterId,
  deck: readonly string[],
  bossId: string,
  count: number,
): string[] {
  const sig = signatureCards(bossId).filter((c) => canAdd(deck, c.id));
  const out = sig.slice(0, count).map((c) => c.id);
  if (out.length < count) {
    for (const id of offerCards(rng, characterId, deck, 'elite', count * 2)) {
      if (out.length >= count) break;
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}

export const PRICE: Record<string, number> = {
  common: 30,
  rare: 60,
  epic: 110,
  legendary: 200,
  mythic: 220,
};

export const REMOVE_PRICE = 40;
export const MIN_DECK = DECK_RULES.minSize;

/** For the stage-clear screen and the map: the realm's display name. */
export const REALM_LABEL: Record<StageRealm, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  rift: 'The Heart of the Rift',
};
