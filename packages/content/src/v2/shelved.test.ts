// Legendary is put away (DECISIONS #363): the cards that were Legendary are Rares, each is still in the game, and nothing is
// Legendary right now.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB as db, SHELVED_LEGENDARIES, lendLegendaries } from './index';

describe('the shelved Legendaries', () => {
  it('are Rares, each in its own pool, and no card is Legendary', () => {
    for (const id of SHELVED_LEGENDARIES) {
      expect(db.cards[id]?.rarity, id).toBe('rare');
      expect(db.cards[`${id}+`]?.rarity, `${id}+`).toBe('rare');
    }
    expect(Object.values(db.cards).filter((c) => c.rarity === 'legendary')).toEqual([]);
  });

  it('can be lent as Legendaries for a test, and are Rares again afterwards', () => {
    const undo = lendLegendaries(db);
    expect(db.cards['overclocked-legion']?.rarity).toBe('legendary');
    expect(db.cards['overclocked-legion+']?.rarity).toBe('legendary');
    undo();
    expect(db.cards['overclocked-legion']?.rarity).toBe('rare');
    expect(db.cards['overclocked-legion+']?.rarity).toBe('rare');
  });
});
