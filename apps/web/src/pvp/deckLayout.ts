// How a saved deck is laid out for reading, like a post-game report: its cards by rarity, best first, repeats stacked with a count.

import type { CardDef } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import type { VaultDeck } from './vault';

/** Best first. */
export const RARITY_ORDER = [
  'ancestral',
  'legendary',
  'rare',
  'uncommon',
  'common',
  'basic',
] as const;

const rankOf = (def: CardDef): number => {
  const i = RARITY_ORDER.indexOf(def.rarity ?? 'common');
  return i < 0 ? RARITY_ORDER.length : i;
};

export interface ReportCard {
  def: CardDef;
  /** copies in the deck */
  n: number;
}

/** The deck's distinct cards: rarity descending, then dearer first, then by name; an upgraded card counts as its own card. */
export function reportCards(ids: readonly string[]): ReportCard[] {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const out: ReportCard[] = [];
  for (const [id, n] of counts) {
    const def = Object.hasOwn(COMBAT_DB.cards, id) ? COMBAT_DB.cards[id] : undefined;
    if (def) out.push({ def, n });
  }
  return out.sort(
    (a, b) =>
      rankOf(a.def) - rankOf(b.def) ||
      b.def.cost - a.def.cost ||
      a.def.name.localeCompare(b.def.name),
  );
}

/** How many cards of each rarity, best first, leaving out rarities the deck has none of. */
export function rarityCounts(ids: readonly string[]): { rarity: string; n: number }[] {
  const n = new Map<string, number>();
  for (const id of ids) {
    const r = Object.hasOwn(COMBAT_DB.cards, id) ? (COMBAT_DB.cards[id]?.rarity ?? 'common') : null;
    if (r) n.set(r, (n.get(r) ?? 0) + 1);
  }
  return RARITY_ORDER.filter((r) => n.has(r)).map((r) => ({ rarity: r, n: n.get(r) ?? 0 }));
}

/** "Oct 24, 2026" (decks have no names: a deck is told apart by its Riftwalker, tier and date). */
export const dateLabel = (ms: number): string =>
  ms > 0
    ? new Date(ms).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date unknown';

export const heroName = (hero: string): string =>
  Object.hasOwn(RIFTWALKERS, hero) ? RIFTWALKERS[hero as HeroId].hero.name : hero;

/** "Rift Tier 2" or "Rift Tier 1, after stage 1" for a copy taken mid-run. */
export function tierLabel(d: Pick<VaultDeck, 'id' | 'tier'>): string {
  const stage = /:s(\d)$/.exec(d.id)?.[1];
  return stage ? `Rift Tier ${d.tier}, after stage ${stage}` : `Rift Tier ${d.tier}`;
}
