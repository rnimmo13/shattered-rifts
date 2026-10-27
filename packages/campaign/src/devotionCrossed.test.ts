import { describe, expect, it } from 'vitest';
import { crossedPool } from './rewards';

describe('Devotion cards stay with Valeria', () => {
  it('cards that spend or count Devotion are never Rift-crossed', () => {
    const pool = crossedPool('hunter');
    for (const id of ['lightbrand', 'hymn-of-reckoning', 'sunfall', 'sunforged-edge'])
      expect(pool).not.toContain(id);
    expect(pool).toContain('lightbearer'); // a plain heal still crosses
  });
});
