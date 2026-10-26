// Decks for the balance audit, built the way a person drafts: commit to one of the character's three build paths and take the best card of
// that build path on offer (higher rarity first), fall back to a good Neutral card now and then, skip the rest. Deeper levels have seen more
// offers (more loops), keep only the best of them, have cut more Strikes and Defends, upgraded more cards and own more Boons.
// Deterministic for a seed.

import {
  COMBAT_DB as db,
  pathOf,
  rewardPool,
  RIFTWALKERS,
  V2_DECK_RULES,
  BOONS,
  type HeroId,
} from '@sr/content/v2';
import { CARD_ODDS } from '@sr/campaign';

export type Level = 't1s1' | 't1s3' | 't2' | 't5' | 't10' | 't20';
export const LEVELS: Level[] = ['t1s1', 't1s3', 't2', 't5', 't10', 't20'];

interface LevelSpec {
  /** reward screens seen (3 cards each); a deeper deck has seen more */
  offers: number;
  /** share of offers that are Elite quality (better rarity odds) */
  eliteShare: number;
  /** how many drafted cards the deck keeps (the best of everything seen) */
  keep: number;
  /** Strikes / Defends cut */
  cut: number;
  /** cards upgraded (999 = all) */
  upgrades: number;
  /** Boons owned: how many, and whether the strongest are among them */
  boons: number;
  bestBoons: boolean;
  /** the tier and stage a deck like this is meant to face */
  tier: number;
  stage: number;
}

export const LEVEL_SPEC: Record<Level, LevelSpec> = {
  // the first Warden of a run: about six fights in
  t1s1: {
    offers: 6,
    eliteShare: 0.15,
    keep: 6,
    cut: 0,
    upgrades: 1,
    boons: 1,
    bestBoons: false,
    tier: 1,
    stage: 1,
  },
  // the end of the first loop (Vorthax)
  t1s3: {
    offers: 18,
    eliteShare: 0.2,
    keep: 12,
    cut: 2,
    upgrades: 4,
    boons: 4,
    bestBoons: false,
    tier: 1,
    stage: 3,
  },
  t2: {
    offers: 36,
    eliteShare: 0.2,
    keep: 14,
    cut: 4,
    upgrades: 8,
    boons: 7,
    bestBoons: false,
    tier: 2,
    stage: 2,
  },
  t5: {
    offers: 90,
    eliteShare: 0.2,
    keep: 16,
    cut: 6,
    upgrades: 16,
    boons: 12,
    bestBoons: true,
    tier: 5,
    stage: 2,
  },
  t10: {
    offers: 180,
    eliteShare: 0.2,
    keep: 16,
    cut: 8,
    upgrades: 999,
    boons: 12,
    bestBoons: true,
    tier: 10,
    stage: 2,
  },
  // a godly build: has seen everything, kept only the best, fully upgraded, every Boon
  t20: {
    offers: 400,
    eliteShare: 0.25,
    keep: 15,
    cut: 9,
    upgrades: 999,
    boons: 12,
    bestBoons: true,
    tier: 20,
    stage: 2,
  },
};

/** mulberry32: a small seeded PRNG for the tools (the engine has its own). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const RANK: Record<string, number> = { common: 1, uncommon: 2, rare: 3, legendary: 4 };
// the campaign's card offer odds (packages/campaign/src/rewards.ts)
const ODDS = CARD_ODDS;

function rollRarity(r: () => number, elite: boolean): string {
  const w = elite ? ODDS.elite : ODDS.duel;
  let x = r() * 100;
  for (const [k, v] of Object.entries(w)) {
    if (x < v) return k;
    x -= v;
  }
  return 'common';
}

export interface AuditDeck {
  deck: string[];
  boons: string[];
}

/** Boons in the order a strong player would want them (Legendary ones apart: they are rare, DECISIONS #227). */
const BEST_BOONS = [
  'battle-standard',
  'hunters-lens',
  'rift-satchel',
  'might-idol',
  'hex-lantern',
  'ward-stone',
  'iron-sigil',
  'ember-lamp',
  'vigor-wick',
  'phoenix-ember',
  'crystal-heart',
  'thorn-charm',
  'healing-vial',
  'coin-purse',
];
const LEGEND_BOONS = ['rift-core', 'scholars-tome', 'aegis-of-ages', 'gilded-crown'];
/** how many Legendary Boons a deck of each depth has found by then */
const LEGENDS: Record<Level, number> = { t1s1: 0, t1s3: 0, t2: 0, t5: 1, t10: 2, t20: 4 };

export function buildDeck(hero: HeroId, path: number, level: Level, seed: number): AuditDeck {
  const spec = LEVEL_SPEC[level];
  const r = rng(seed);
  const pool = rewardPool(hero);
  const byRarity = new Map<string, string[]>();
  for (const id of pool) {
    const k = db.cards[id]?.rarity ?? 'common';
    byRarity.set(k, [...(byRarity.get(k) ?? []), id]);
  }
  // what the player would want from an offer: their build path first, then rarity; a Neutral card is a fallback
  const score = (id: string): number => {
    const c = db.cards[id];
    if (!c) return -1;
    const own = c.hero === hero;
    const l = pathOf(id);
    const onPath = own && l === path;
    const glue = own && l === undefined; // legendaries and glue cards serve every build path
    const rank = RANK[c.rarity ?? 'common'] ?? 1;
    if (onPath) return 10 + rank * 2;
    if (glue) return 8 + rank * 2;
    if (own) return 2 + rank; // another build path: only if nothing better
    return 1 + rank; // neutral
  };
  const seen: string[] = [];
  for (let o = 0; o < spec.offers; o++) {
    const elite = r() < spec.eliteShare;
    const offer: string[] = [];
    for (let k = 0; k < 3; k++) {
      const want = rollRarity(r, elite);
      const from = byRarity.get(want) ?? byRarity.get('common') ?? [];
      const pick = from[Math.floor(r() * from.length)];
      if (pick && !offer.includes(pick)) offer.push(pick);
    }
    offer.sort((a, b) => score(b) - score(a));
    if (offer[0] && score(offer[0]) >= 8) seen.push(offer[0]);
  }
  // keep the best `keep` cards, honouring copy and Legendary limits
  seen.sort((a, b) => score(b) - score(a) || r() - 0.5);
  const kept: string[] = [];
  let legends = 0;
  for (const id of seen) {
    if (kept.length >= spec.keep) break;
    const c = db.cards[id];
    if (!c) continue;
    const copies = kept.filter((x) => x === id).length;
    const limit = c.rarity === 'legendary' ? 1 : V2_DECK_RULES.maxCopies;
    if (copies >= limit) continue;
    if (c.rarity === 'legendary') {
      if (legends >= V2_DECK_RULES.maxLegendary) continue;
      legends++;
    }
    kept.push(id);
  }
  // cut Strikes first, then Defends (the character's own basics stay)
  const deck = [...RIFTWALKERS[hero].starter];
  for (let c = 0; c < spec.cut; c++) {
    const i = deck.indexOf('strike') >= 0 ? deck.indexOf('strike') : deck.indexOf('defend');
    if (i < 0 || deck.length <= V2_DECK_RULES.minSize) break;
    deck.splice(i, 1);
  }
  deck.push(...kept);
  // upgrade drafted cards first (they matter most), then the rest
  const order = deck
    .map((id, i) => ({ id, i, w: db.cards[id]?.rarity === 'basic' ? 0 : 1 }))
    .sort((a, b) => b.w - a.w || r() - 0.5);
  for (let u = 0, n = 0; u < order.length && n < spec.upgrades; u++) {
    const slot = order[u]!;
    const up = db.cards[slot.id]?.upgrade;
    if (up) {
      deck[slot.i] = up;
      n++;
    }
  }
  const plain = BOONS.filter((b) => b.rarity !== 'legendary').map((b) => b.id);
  let boons: string[];
  if (spec.bestBoons) boons = BEST_BOONS.slice(0, spec.boons);
  else {
    const shuffled = [...plain].sort(() => r() - 0.5);
    boons = shuffled.slice(0, spec.boons);
  }
  boons.push(...LEGEND_BOONS.slice(0, LEGENDS[level]));
  return { deck, boons };
}
