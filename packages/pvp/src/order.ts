// Who goes first. Each player says whether they want to: going first, or going second with more HP (SECOND_PLAYER_HP). If
// the two answers differ everyone gets what they asked for. If they are the same (or someone did not answer) the referee's
// coin decides. Pure: the coin is passed in.

import type { Seat } from './protocol';

/** The two players, in the order they arrived (the host, then the guest). */
export type Arrival = 'a' | 'b';

export interface Order {
  /** who goes first */
  first: Arrival;
  /** the coin decided (both wanted the same, or someone did not answer) */
  random: boolean;
}

export function decideOrder(choices: Partial<Record<Arrival, boolean>>, coin: Arrival): Order {
  const a = choices.a;
  const b = choices.b;
  if (a !== undefined && b !== undefined && a !== b) return { first: a ? 'a' : 'b', random: false };
  return { first: coin, random: true };
}

/** Seat a moves first, seat b second (and has more HP); this says which player took which. */
export function seatsFor(first: Arrival): Record<Arrival, Seat> {
  return first === 'a' ? { a: 'a', b: 'b' } : { a: 'b', b: 'a' };
}
