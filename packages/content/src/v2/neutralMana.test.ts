// The Neutral Mana cards and the Ancestral cards after their review (DECISIONS #500): a Neutral card is never better than the class card it
// resembles, and an Ancestral card may compete.

import { describe, expect, it } from 'vitest';
import { cardText, type CardDef } from '@sr/combat';
import { COMBAT_DB as db, canonicalCard } from './index';

const text = (id: string): string => cardText(db, db.cards[id]!);
const CASES: [id: string, rarity: string, cost: number, text: string, upCost: number, upText: string][] = [
  ['rift-surge', 'common', 1, 'Gain 2 Mana. Consume.', 1, 'Gain 2 Mana. Consume. Hold.'],
  ['nerve-surge', 'uncommon', 0, 'Draw 1 card. Gain 1 Mana. Consume.', 0, 'Draw 2 cards. Gain 1 Mana. Consume.'],
  ['plan-ahead', 'common', 1, 'Next turn, gain 1 extra Mana. Next turn, draw 1 extra card.', 1, 'Next turn, gain 1 extra Mana. Next turn, draw 2 extra cards.'],
  ['fever-dream', 'uncommon', 0, 'A random card in your hand costs 2 less the next time you play it. Consume.', 0, 'A random card in your hand costs 2 less the next time you play it. Consume. Hold.'],
  ['heart-of-the-rift', 'uncommon', 2, 'At the start of your turn: Draw 1 card.', 1, 'At the start of your turn: Draw 1 card.'],
  ['attunement', 'rare', 3, 'From your next turn, gain 1 more Mana every turn for the rest of the fight.', 2, 'From your next turn, gain 1 more Mana every turn for the rest of the fight.'],
  ['rift-collapse', 'rare', 3, 'Deal 30 damage to ALL enemies. Lose 15 HP. Consume.', 3, 'Deal 36 damage to ALL enemies. Lose 15 HP. Consume.'],
  ['ancestral-blade', 'ancestral', 2, 'Deal 30 damage. Consume.', 2, 'Deal 34 damage. Consume.'],
  ['elders-bulwark', 'ancestral', 2, 'Gain 28 Barrier. Consume. Hold.', 2, 'Gain 32 Barrier. Consume. Hold.'],
  ['echo-of-ages', 'ancestral', 1, 'Gain 2 Might. Gain 2 Thorns. Consume.', 1, 'Gain 3 Might. Gain 2 Thorns. Consume.'],
  ['lineage', 'ancestral', 1, 'Whenever you play an Aura: Draw 1 card.', 1, 'Opening hand. Whenever you play an Aura: Draw 1 card.'],
  ['the-long-memory', 'ancestral', 2, 'Opening hand. At the start of your turn: Gain 1 Mana.', 2, 'Draw 1 card. Opening hand. At the start of your turn: Gain 1 Mana.'],
];

describe('the Neutral and Ancestral review (DECISIONS #500)', () => {
  for (const [id, rarity, cost, says, upCost, upSays] of CASES)
    it(id, () => {
      const c = db.cards[id]!;
      expect(c.rarity).toBe(rarity);
      expect(c.cost).toBe(cost);
      expect(text(id)).toBe(says);
      expect(db.cards[`${id}+`]!.cost).toBe(upCost);
      expect(text(`${id}+`)).toBe(upSays);
    });

  it('Stolen Time is retired into Rift Surge, upgraded copies too', () => {
    expect(db.cards['borrowed-time']).toBeUndefined();
    expect(canonicalCard('borrowed-time')).toBe('rift-surge');
    expect(canonicalCard('borrowed-time+')).toBe('rift-surge+');
  });

  it('no Neutral Mana card does what a class card does for the same Mana or less', () => {
    // (by what they do, whatever order the text says it in)
    const does = (c: CardDef): string =>
      JSON.stringify([c.effects.map((e) => JSON.stringify(e)).sort(), !!c.exhaust, !!c.retain, !!c.innate, !!c.ethereal]);
    const classCards = Object.values(db.cards).filter(
      (c) => c.hero !== 'neutral' && c.hero !== 'junk' && !c.source && !c.id.endsWith('+'),
    );
    const repeats = Object.values(db.cards)
      .filter((c) => c.hero === 'neutral' && !c.source && !c.id.endsWith('+') && /Mana/.test(cardText(db, c)))
      .filter((c) => classCards.some((k) => does(k) === does(c) && c.cost <= k.cost))
      .map((c) => c.id);
    expect(repeats).toEqual([]);
  });
});
