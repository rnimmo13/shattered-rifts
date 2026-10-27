// The practice-fight deck builder's logic, kept apart from the screen so it can be tested: the card catalogue, filtering it,
// turning counts into a deck, and a random deck for quick experiments.

import { nextInt, seedRng, type CardDef, type CombatDb } from '@sr/combat';
import { REALMS, RIFTWALKERS, pathName, pathOf, type HeroId } from '@sr/content/v2';

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
  rarity: 'all' | 'basic' | 'common' | 'uncommon' | 'rare' | 'legendary' | 'ancestral';
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
    // (a card with no "+" version, a token say, is shown either way)
    if (c.upgraded !== f.upgraded && !(f.upgraded && !c.def.upgrade)) return false;
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

// ---- the grimoire: the catalogue as the pages of a book, one bookmark (tab) per realm ----

export interface GrimoireTab {
  id: string;
  name: string;
}

/** The bookmarks of the grimoire: a realm each, then the cards that belong to no one. */
export const TABS: GrimoireTab[] = [
  ...REALMS.map((r) => ({ id: r.id, name: r.name })),
  { id: 'neutral', name: 'Neutral' },
  { id: 'wardens', name: 'Warden gifts' },
  { id: 'tokens', name: 'Tokens' },
  { id: 'other', name: 'Other' },
];

/** Which bookmark a card is filed under: its owner's realm (a Riftwalker's cards live in that Riftwalker's realm). */
export function tabOf(def: CardDef): string {
  const pool = poolOf(def);
  const hero = (RIFTWALKERS as Record<string, { realm: string }>)[pool];
  return hero ? hero.realm : pool;
}

const RARITY_RANK: Record<string, number> = {
  basic: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
  ancestral: 5,
};

/** The cards on one bookmark: grouped by character, then rarity (basic to legendary), cost, name. */
export function tabCards(
  cards: readonly CatalogCard[],
  tab: string,
  by: 'book' | 'character' = 'book',
): CatalogCard[] {
  return sortCards(
    cards.filter((c) => tabOf(c.def) === tab),
    by,
  );
}

/**
 * Book order: character, build path, then rarity (basic to legendary), cost, name. With `by: 'character'` the build paths are not
 * kept apart (character, rarity, cost, name). With `by: 'rarity'` the rarest come first across every character (then character,
 * cost, name), so a page is a run of cards with no sections.
 */
export function sortCards(
  cards: readonly CatalogCard[],
  by: 'book' | 'character' | 'rarity' = 'book',
): CatalogCard[] {
  const heroOrder = Object.keys(RIFTWALKERS);
  const heroRank = (p: PoolKey): number => {
    const i = heroOrder.indexOf(p);
    return i >= 0 ? i : heroOrder.length + ['neutral', 'wardens', 'tokens', 'other'].indexOf(p);
  };
  const rank = (c: CatalogCard): number => RARITY_RANK[c.def.rarity ?? 'common'] ?? 1;
  if (by === 'rarity')
    return [...cards].sort(
      (a, b) =>
        rank(b) - rank(a) ||
        heroRank(a.pool) - heroRank(b.pool) ||
        a.def.cost - b.def.cost ||
        a.def.name.localeCompare(b.def.name),
    );
  return [...cards].sort(
    (a, b) =>
      heroRank(a.pool) - heroRank(b.pool) ||
      (by === 'book' ? (pathOf(a.def.id) ?? 9) - (pathOf(b.def.id) ?? 9) : 0) ||
      (RARITY_RANK[a.def.rarity ?? 'common'] ?? 1) - (RARITY_RANK[b.def.rarity ?? 'common'] ?? 1) ||
      a.def.cost - b.def.cost ||
      a.def.name.localeCompare(b.def.name),
  );
}

/**
 * Cut a run of cards into book pages of `perPage`. A page never mixes characters or build paths, and its heading names them
 * ("Ser Maren Ashcourt · Bulwark"), so the book shows each character's build paths as sections.
 */
export function paginate(
  cards: readonly CatalogCard[],
  perPage: number,
  /** fill every page to the brim, whatever the character or build path (the heading then lists the characters on the page) */
  packed = false,
  /** start a new page for each build path (false: only for each character) */
  byPath = true,
): { cards: CatalogCard[]; heroes: string[]; heroIds: string[]; path?: string }[] {
  const pages: { cards: CatalogCard[]; heroes: string[]; heroIds: string[]; path?: string }[] = [];
  if (packed) {
    const names = RIFTWALKERS as Record<string, { hero: { name: string } }>;
    for (let k = 0; k < cards.length; k += perPage) {
      const slice = cards.slice(k, k + perPage);
      const heroIds = [...new Set(slice.map((c) => c.pool))].filter((p) => Object.hasOwn(names, p));
      const heroes = heroIds.map((p) => names[p]?.hero.name ?? p);
      pages.push({ cards: slice, heroes, heroIds });
    }
    return pages;
  }
  const keyOf = (c: CatalogCard): string => (byPath ? `${c.pool}|${pathOf(c.def.id) ?? ''}` : c.pool);
  let i = 0;
  while (i < cards.length) {
    // the run of cards sharing a character and build path
    let j = i + 1;
    while (j < cards.length && keyOf(cards[j] as CatalogCard) === keyOf(cards[i] as CatalogCard))
      j++;
    for (let k = i; k < j; k += perPage) {
      const slice = cards.slice(k, Math.min(j, k + perPage));
      const first = slice[0] as CatalogCard;
      const hero = (RIFTWALKERS as Record<string, { hero: { name: string } }>)[first.pool]?.hero
        .name;
      const path = pathOf(first.def.id);
      pages.push({
        cards: slice,
        heroes: hero ? [hero] : [],
        heroIds: hero ? [first.pool] : [],
        ...(byPath && hero && path !== undefined ? { path: pathName(first.pool as HeroId, path) } : {}),
      });
    }
    i = j;
  }
  return pages;
}
