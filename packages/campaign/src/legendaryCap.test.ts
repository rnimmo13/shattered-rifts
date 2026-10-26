// A deck holds at most V2_DECK_RULES.maxLegendary Legendary cards (one, DECISIONS #238) and maxAncestral Ancestral ones: once
// it is full no more are offered or taken.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES } from '@sr/content/v2';
import { canAdd, cardOfRarity } from './rewards';
import { seedRng } from '@sr/combat';

const legends = Object.values(COMBAT_DB.cards)
  .filter((c) => c.hero === 'knight' && c.rarity === 'legendary' && !c.id.endsWith('+'))
  .map((c) => c.id);

describe('the Legendary limit', () => {
  it('a deck stops accepting Legendaries once it holds the limit', () => {
    expect(legends.length).toBeGreaterThanOrEqual(3);
    const deck = [...RIFTWALKERS.knight.starter];
    for (let n = 0; n < V2_DECK_RULES.maxLegendary; n++) {
      expect(canAdd(deck, legends[n] as string)).toBe(true);
      deck.push(legends[n] as string);
    }
    for (const id of legends.slice(V2_DECK_RULES.maxLegendary))
      expect(canAdd(deck, id)).toBe(false);
    // ordinary cards are not affected
    expect(canAdd(deck, 'strike')).toBe(true);
  });

  it('a full deck is never offered a Legendary', () => {
    const deck = [...RIFTWALKERS.knight.starter, legends[0] as string, legends[1] as string];
    const rng = seedRng('cap');
    for (let i = 0; i < 30; i++) expect(cardOfRarity(rng, 'knight', deck, 'legendary')).toBeNull();
  });
});

describe('the Ancestral limit (DECISIONS #238)', () => {
  it('a deck takes two different Ancestral cards, then no more', () => {
    const anc = Object.values(COMBAT_DB.cards)
      .filter((c) => c.rarity === 'ancestral' && !c.id.endsWith('+'))
      .map((c) => c.id);
    expect(V2_DECK_RULES.maxAncestral).toBe(2);
    const deck = [...RIFTWALKERS.knight.starter];
    for (const id of anc.slice(0, V2_DECK_RULES.maxAncestral)) {
      expect(canAdd(deck, id)).toBe(true);
      deck.push(id);
    }
    for (const id of anc.slice(V2_DECK_RULES.maxAncestral)) expect(canAdd(deck, id)).toBe(false);
    // and a deck holds one Legendary
    expect(V2_DECK_RULES.maxLegendary).toBe(1);
  });
});
