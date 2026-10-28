// Cards that only work in their owner's deck never cross to another Riftwalker (DECISIONS #387: the Trickster's Suits).

import { describe, expect, it } from 'vitest';
import { crossedPool, deadElsewhere } from './rewards';

describe('cards dead in another deck', () => {
  it('the Suits payoffs are dead elsewhere; the rest of the Trickster is not', () => {
    for (const id of [
      'royal-flourish',
      'card-fan',
      'card-sharp',
      'queen-of-hearts',
      'showstopper',
      'the-whole-deck',
      'masquerade',
      'flourish',
      'cut-the-deck',
      'ace-of-clubs',
    ])
      expect(deadElsewhere(id), id).toBe(true);
    expect(deadElsewhere('time-bomb')).toBe(false);
    expect(deadElsewhere('cold-read')).toBe(false);
  });

  it('never reach the Rift-crossed pool', () => {
    const pool = crossedPool('knight');
    expect(pool.filter(deadElsewhere)).toEqual([]);
    expect(pool).toContain('time-bomb');
  });
});
