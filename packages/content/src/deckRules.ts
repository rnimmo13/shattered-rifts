// Deck rules shared by runs, PvP and enemy decks (01_GAME_DESIGN §3.1, DECISIONS #4).

import type { CardDb } from '@sr/engine';

export const DECK_RULES = {
  minSize: 20,
  maxCopies: 3,
  maxCopiesLegendary: 1,
  maxLegendaryTotal: 2,
  maxTempered: 5,
  vaultSlots: 5,
} as const;

/** Returns a list of rule violations (empty = legal). */
export function validateDeck(
  cards: readonly string[],
  db: CardDb,
  minSize: number = DECK_RULES.minSize,
): string[] {
  const errors: string[] = [];
  if (cards.length < minSize) errors.push(`needs at least ${minSize} cards (has ${cards.length})`);
  const counts = new Map<string, number>();
  for (const id of cards) counts.set(id, (counts.get(id) ?? 0) + 1);
  let big = 0;
  for (const [id, n] of counts) {
    const d = db[id];
    if (!d) {
      errors.push(`unknown card ${id}`);
      continue;
    }
    if (!d.collectible) errors.push(`${id} is not collectible`);
    const single = d.rarity === 'legendary' || d.rarity === 'mythic';
    if (single) big += n;
    const max = single ? DECK_RULES.maxCopiesLegendary : DECK_RULES.maxCopies;
    if (n > max) errors.push(`${n}× ${id} (max ${max})`);
  }
  if (big > DECK_RULES.maxLegendaryTotal) {
    errors.push(`${big} Legendary/Mythic cards (max ${DECK_RULES.maxLegendaryTotal})`);
  }
  return errors;
}

/** A legal random deck from the whole card pool (property tests). `rand(n)` returns 0..n-1. */
export function randomLegalDeck(db: CardDb, size: number, rand: (n: number) => number): string[] {
  const pool = Object.values(db)
    .filter((c) => c.collectible)
    .map((c) => c.id)
    .sort();
  const deck: string[] = [];
  let guard = 0;
  while (deck.length < size && guard++ < 10_000) {
    const next = pool[rand(pool.length)] as string;
    const trial = [...deck, next];
    if (validateDeck(trial, db, 0).length === 0) deck.push(next);
  }
  return deck;
}
