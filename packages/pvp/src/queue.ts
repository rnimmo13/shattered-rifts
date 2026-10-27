// The matchmaking queue: who plays whom. Pure: the clock is passed in.

import { QUEUE_RATING_GAP, QUEUE_WIDEN_MS } from './protocol';

export interface Waiting {
  /** the player (one place in the queue per player) */
  id: string;
  /** the player's Arena rating this season (DECISIONS #307: matched by rank, not by a deck's Rift Tier) */
  rating: number;
  /** when they joined, epoch ms */
  since: number;
}

export interface Pairing {
  pairs: [Waiting, Waiting][];
  rest: Waiting[];
}

/**
 * Pair people up. The longest-waiting player goes first and takes the closest Arena rating among everyone else, but only within
 * QUEUE_RATING_GAP until they have waited QUEUE_WIDEN_MS, after which anyone will do. Whoever is left stays queued.
 */
export function pairUp(queue: readonly Waiting[], now: number): Pairing {
  const left = [...queue].sort((a, b) => a.since - b.since || a.id.localeCompare(b.id));
  const pairs: [Waiting, Waiting][] = [];
  const rest: Waiting[] = [];
  while (left.length > 0) {
    const first = left.shift() as Waiting;
    const widened = now - first.since >= QUEUE_WIDEN_MS;
    let best = -1;
    let bestGap = Infinity;
    left.forEach((o, i) => {
      const gap = Math.abs(o.rating - first.rating);
      if (
        (gap <= QUEUE_RATING_GAP || widened || now - o.since >= QUEUE_WIDEN_MS) &&
        gap < bestGap
      ) {
        best = i;
        bestGap = gap;
      }
    });
    if (best < 0) {
      rest.push(first);
      continue;
    }
    pairs.push([first, left.splice(best, 1)[0] as Waiting]);
  }
  return { pairs, rest };
}

/** Put a player in the queue (a second place for the same player replaces the first). */
export function enqueue(queue: readonly Waiting[], w: Waiting): Waiting[] {
  return [...queue.filter((x) => x.id !== w.id), w];
}

/** Take a player out. */
export function leave(queue: readonly Waiting[], id: string): Waiting[] {
  return queue.filter((x) => x.id !== id);
}
