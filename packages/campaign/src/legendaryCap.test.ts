// A deck holds at most V2_DECK_RULES.maxLegendary Legendary cards: once it is full no more are offered or taken.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES } from '@sr/content/v2';
import { canAdd, cardOfRarity } from './rewards';
import { seedRng } from '@sr/combat';

const legends = Object.values(COMBAT_DB.cards)
  .filter((c) => c.hero === 'maren' && c.rarity === 'legendary' && !c.id.endsWith('+'))
  .map((c) => c.id);

describe('the Legendary limit', () => {
  it('a deck stops accepting Legendaries once it holds the limit', () => {
    expect(legends.length).toBeGreaterThanOrEqual(3);
    const deck = [...RIFTWALKERS.maren.starter];
    for (let n = 0; n < V2_DECK_RULES.maxLegendary; n++) {
      expect(canAdd(deck, legends[n] as string)).toBe(true);
      deck.push(legends[n] as string);
    }
    for (const id of legends.slice(V2_DECK_RULES.maxLegendary)) expect(canAdd(deck, id)).toBe(false);
    // ordinary cards are not affected
    expect(canAdd(deck, 'strike')).toBe(true);
  });

  it('a full deck is never offered a Legendary', () => {
    const deck = [...RIFTWALKERS.maren.starter, legends[0] as string, legends[1] as string];
    const rng = seedRng('cap');
    for (let i = 0; i < 30; i++) expect(cardOfRarity(rng, 'maren', deck, 'legendary')).toBeNull();
  });
});
