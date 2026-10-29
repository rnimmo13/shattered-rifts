// Shared pieces of the class-rework balance ledgers (`pnpm --filter @sr/tools exec tsx src/ledger/write.ts <class>`): the budget a
// card should land on by the costing guide (docs/14_CARD_COSTING.md §1, §7), and the shape of a hand price. The prices themselves are
// written by hand in ledger/<class>.ts; the generator adds each card's live text, budget and deviation, so the ledger can never drift
// from the card data.

import type { CardDef } from '@sr/combat';

export interface Price {
  /** the points of the base card (the guide's rates; new rates are in docs/14_CARD_COSTING.md §15) */
  pts: number;
  /** the points of its "+" version */
  up: number;
  /** the arithmetic, and the assumptions it rests on */
  how: string;
  /** what it is for: its strategy, and a producer/consumer package it belongs to */
  role: string;
  /** why it is fine where it lands, when it is off budget by more than 15% (an engine piece, a payoff, a known strong glue card) */
  why?: string;
  /** the card Consumes where it would otherwise be played every reshuffle: +25% budget (guide §6) */
  consume?: boolean;
}

/** The common budget of a cost (guide §1): 0 = 6, 1 = 10, 2 = 19, 3 = 28, then +9 a Mana. */
export const costBudget = (cost: number): number =>
  cost <= 0 ? 6 : cost === 1 ? 10 : cost === 2 ? 19 : 28 + 9 * (cost - 3);

const RARITY: Record<string, number> = {
  basic: 0.8,
  common: 1,
  uncommon: 1.12,
  rare: 1.25,
  legendary: 1.25,
  ancestral: 1.25,
};
/** An Aura is priced over four useful turns: about 1.5x the budget of its cost at uncommon, 2x at rare (guide §7). */
const AURA: Record<string, number> = { basic: 1.25, common: 1.25, uncommon: 1.5, rare: 2 };

/** What a card should be worth: its cost's budget, its rarity, an Aura's four turns, and Consume. */
export function budgetOf(c: CardDef, p: Pick<Price, 'consume'>): number {
  const base = costBudget(c.x ? 1 : c.cost);
  const r = c.rarity ?? 'common';
  const b =
    c.kind === 'power' ? base * (AURA[r] ?? 1.5) : base * (RARITY[r] ?? 1) * (p.consume ? 1.25 : 1);
  return Math.round(b * 100) / 100;
}

export const pct = (pts: number, budget: number): string => {
  const d = Math.round((pts / budget - 1) * 100);
  return `${d >= 0 ? '+' : ''}${d}%`;
};
