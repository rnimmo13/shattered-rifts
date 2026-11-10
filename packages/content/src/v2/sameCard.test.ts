// Every copy of a card is the same card, whatever a Sanctum roll or an engraving wrote on it (DECISIONS #732).
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  baseCardId,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'same-card',
    a: { hero: 'necromancer', deck: RIFTWALKERS.necromancer.starter },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  s.sides.a.draw = Array.from({ length: 8 }, (_, i) => ({ id: `D${i}`, card: 'strike' }));
  for (const u of s.sides.b.units) u.hp = u.maxHp = 500;
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe('the same card', () => {
  it('reads past a Sanctum roll, an engraving and the upgrade', () => {
    expect(baseCardId('hi~hold^gathering-storm+')).toBe('gathering-storm');
    expect(baseCardId('lo~strike')).toBe('strike');
    expect(baseCardId('flare^bone-toss')).toBe('bone-toss');
    expect(baseCardId('strike+')).toBe('strike');
  });

  it('an engraved copy is the same card played this turn (Bone Toss draws only for the first)', () => {
    let s = fight(['bone-toss', 'hold^bone-toss']);
    const hand0 = s.sides.a.hand.length;
    s = play(s, 'bone-toss');
    // (the first of the turn draws one: the hand is one card out, one card in)
    expect(s.sides.a.hand.length).toBe(hand0);
    s = play(s, 'hold^bone-toss');
    // (the second is the same card: no draw)
    expect(s.sides.a.hand.length).toBe(hand0 - 1);
  });
});
