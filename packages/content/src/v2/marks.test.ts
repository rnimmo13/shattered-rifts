// Engraved card tags (DECISIONS #227): "hold^strike" is Strike with Hold, derived on demand like a sanctified roll.

import { describe, expect, it } from 'vitest';
import { createCombat } from '@sr/combat';
import {
  COMBAT_DB as db,
  RIFTWALKERS,
  canMark,
  isVariant,
  markOf,
  markedId,
  rolledId,
  stripRoll,
} from './index';

describe('engraved card tags', () => {
  it('Hold, Opening hand and Flare change only what they say', () => {
    const base = db.cards['strike']!;
    expect(db.cards['hold^strike']).toMatchObject({
      retain: true,
      cost: base.cost,
      effects: base.effects,
    });
    expect(db.cards['opening^strike']).toMatchObject({ innate: true, cost: base.cost });
    expect(db.cards['flare^strike']).toMatchObject({ exhaust: true, cost: base.cost - 1 });
    expect(db.cards['hold^strike']!.name).toBe(`${base.name} ◆`);
  });

  it('a tagged card upgrades into the tagged upgrade, and can be sanctified too', () => {
    expect(db.cards['hold^strike']!.upgrade).toBe('hold^strike+');
    expect(db.cards['hold^strike+']).toMatchObject({
      retain: true,
      effects: db.cards['strike+']!.effects,
    });
    const rolled = rolledId('hold^strike', 1);
    expect(rolled).toBe('hi~hold^strike');
    expect(db.cards[rolled]).toMatchObject({ retain: true });
    expect(db.cards[rolled]!.effects).not.toEqual(db.cards['strike']!.effects);
    expect(db.cards[rolled]!.upgrade).toBe('hi~hold^strike+');
  });

  it('ids round-trip: markOf, markedId, stripRoll and isVariant', () => {
    expect(markOf('hi~flare^defend+')).toBe('flare');
    expect(markOf('strike')).toBeNull();
    expect(markedId('hi~strike+', 'opening')).toBe('hi~opening^strike+');
    expect(markedId('hold^strike', 'opening')).toBe('opening^strike');
    expect(stripRoll('lo~hold^strike+')).toBe('strike+');
    expect(isVariant('hold^strike')).toBe(true);
    expect(isVariant('strike')).toBe(false);
    expect(db.cards['bogus^strike']).toBeUndefined();
    expect(db.cards['hold^not-a-card']).toBeUndefined();
    // an id an event could never make is not a card (a Power, a card that already holds)
    const power = Object.values(db.cards).find((c) => c.kind === 'power')!;
    expect(db.cards[`flare^${power.id}`]).toBeUndefined();
    const held = Object.values(db.cards).find(
      (c) => c.retain && c.kind !== 'power' && !c.id.endsWith('+'),
    )!;
    expect(db.cards[`hold^${held.id}`]).toBeUndefined();
  });

  it('never tags a Power, an unplayable card, or a card that already has the keyword', () => {
    const power = Object.values(db.cards).find((c) => c.kind === 'power')!;
    expect(canMark(power, 'hold')).toBe(false);
    expect(canMark(db.cards['wound']!, 'opening')).toBe(false);
    const held = Object.values(db.cards).find((c) => c.retain && c.kind !== 'power')!;
    expect(canMark(held, 'hold')).toBe(false);
    const free = Object.values(db.cards).find(
      (c) => c.cost === 0 && !c.exhaust && c.kind !== 'power' && !c.unplayable,
    )!;
    expect(canMark(free, 'flare')).toBe(false);
  });

  it('an Opening hand card is in the first hand', () => {
    const deck = [
      ...RIFTWALKERS.knight.starter.filter((x) => x !== 'dawn-smite'),
      'opening^dawn-smite',
    ];
    for (let i = 0; i < 8; i++) {
      const { state } = createCombat(db, {
        seed: `open-${i}`,
        a: { hero: 'knight', deck },
        b: { enemies: ['squire'] },
      });
      expect(state.sides.a.hand.some((c) => c.card === 'opening^dawn-smite')).toBe(true);
    }
  });
});
