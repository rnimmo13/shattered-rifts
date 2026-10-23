// The practice-fight deck builder's logic, kept apart from the screen so it can be tested: the card catalogue, filtering it,
// turning counts into a deck, and a random deck for quick experiments.

import { nextInt, seedRng, type CardDef, type CombatDb } from '@sr/combat';
import { RIFTWALKERS } from '@sr/content/v2';

export type PoolKey = 'all' | 'neutral' | 'wardens' | 'tokens' | 'other' | string; // or a Riftwalker id

export interface CatalogCard {
  def: CardDef;
  /** which pool filter it belongs to */
  pool: PoolKey;
  /** true for a "+" version */
  upgraded: boolean;
}

/** Which pool a card is listed under. */
export function poolOf(def: CardDef): PoolKey {
  if (def.source === 'token') return 'tokens';
  if (def.source?.startsWith('boss:')) return 'wardens';
  if (def.hero && Object.hasOwn(RIFTWALKERS, def.hero)) return def.hero;
  if (def.hero === 'neutral') return 'neutral';
  return 'other';
}

/** Every card in the game, sorted by pool then cost then name. An upgraded card is a card whose id ends in "+". */
export function catalog(db: CombatDb): CatalogCard[] {
  const heroOrder = Object.keys(RIFTWALKERS);
  const rank = (p: PoolKey): number =>
    p === 'neutral'
      ? 100
      : heroOrder.includes(p)
        ? heroOrder.indexOf(p)
        : 200 + ['wardens', 'tokens', 'other'].indexOf(p);
  return Object.values(db.cards)
    .map((def) => ({ def, pool: poolOf(def), upgraded: def.id.endsWith('+') }))
    .sort(
      (a, b) =>
        rank(a.pool) - rank(b.pool) ||
        a.def.cost - b.def.cost ||
        a.def.name.localeCompare(b.def.name),
    );
}

export interface CatalogFilter {
  pool: PoolKey;
  rarity: 'all' | 'basic' | 'common' | 'uncommon' | 'rare';
  text: string;
  /** show "+" versions instead of the plain ones */
  upgraded: boolean;
}

export function filterCatalog(
  cards: readonly CatalogCard[],
  f: CatalogFilter,
  describe: (c: CardDef) => string,
): CatalogCard[] {
  const q = f.text.trim().toLowerCase();
  return cards.filter((c) => {
    if (c.upgraded !== f.upgraded) return false;
    // a token has no "+" version: show it either way
    if (f.pool !== 'all' && c.pool !== f.pool) return false;
    if (f.rarity !== 'all' && (c.def.rarity ?? 'common') !== f.rarity) return false;
    if (q && !`${c.def.name} ${describe(c.def)}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Counts per card id to a deck (a list with an id repeated for each copy), in a stable order. */
export function flatten(counts: Readonly<Record<string, number>>): string[] {
  return Object.keys(counts)
    .sort()
    .flatMap((id) => Array<string>(Math.max(0, counts[id] ?? 0)).fill(id));
}

export function countsOf(deck: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of deck) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/**
 * A random deck of `size` cards from every playable card in the game (any Riftwalker's, Neutral, Warden gifts and tokens), for
 * trying odd combinations. Deterministic for a given seed.
 */
export function randomDeck(db: CombatDb, size: number, seed: string): string[] {
  const rng = seedRng(`deck:${seed}`);
  const pool = Object.values(db.cards)
    .filter((c) => !c.unplayable || c.onDiscard)
    .map((c) => c.id)
    .sort();
  return Array.from({ length: size }, () => pool[nextInt(rng, pool.length)] as string);
}
