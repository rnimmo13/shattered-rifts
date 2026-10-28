// The Barbarian's costing pass (DECISIONS #390, docs/BARBARIAN_REVIEW.md): Inner Fire gives Fervor only, Still Guard is a basic
// again, Surge of Ire answers the first Fury each turn, and a card that copies another class's costs what that one costs.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'barbarian-pass',
    a: { hero: 'barbarian', deck: [...RIFTWALKERS.barbarian.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `B${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('the Barbarian costing pass', () => {
  it('Inner Fire gives 1 Fervor for a stance, and no Barrier', () => {
    const s0 = fight(['rising-ire']);
    hero(s0).barrier = 0;
    const fervor = hero(s0).statuses.mantra ?? 0;
    const s = play(s0, 'rising-ire');
    expect(hero(s).statuses.mantra ?? 0).toBe(fervor + 1);
    expect(hero(s).barrier).toBe(0);
  });

  it('Still Guard: 3 Barrier and Serene', () => {
    expect(cardText(db, db.cards['still-guard']!)).toBe('Gain 3 Barrier. Enter Serene.');
  });

  it('Surge of Ire answers only the first Fury each turn', () => {
    let s = play(
      fight(['surge-of-ire', 'rising-ire', 'centre-yourself', 'rage-unbound']),
      'surge-of-ire',
    );
    const hand = () => s.sides.a.hand.length;
    s = play(s, 'rising-ire');
    const afterFirst = hand();
    s = play(s, 'centre-yourself');
    const before = hand();
    s = play(s, 'rage-unbound');
    // (Rage Unbound left the hand; the second Fury drew nothing)
    expect(hand()).toBe(before - 1);
    expect(afterFirst).toBeGreaterThan(0);
  });

  it('All-Seeing costs what the Trickster’s Pickpocket Master costs', () => {
    expect(db.cards['all-seeing']?.cost).toBe(db.cards['pickpocket-master']?.cost);
    expect(db.cards['deep-breath']?.exhaust).toBe(true);
  });
});
