// The Monk's costing pass (when she was the Barbarian) (DECISIONS #390, docs/BARBARIAN_REVIEW.md): Inner Fire gives Fervor only, Still Guard is a basic
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
    a: { hero: 'monk', deck: [...RIFTWALKERS.monk.starter] },
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

describe('the Monk costing pass', () => {
  it('Inner Fire gives 1 Fervor for a stance and no Barrier, and 2 Primed on leaving Fury (DECISIONS #412)', () => {
    const s0 = fight(['rising-ire', 'centre-yourself']);
    hero(s0).barrier = 0;
    const fervor = hero(s0).statuses.mantra ?? 0;
    const s = play(s0, 'rising-ire');
    expect(hero(s).statuses.mantra ?? 0).toBe(fervor + 1);
    expect(hero(s).barrier).toBe(0);
    expect(hero(s).statuses.vigor ?? 0).toBe(0); // entering Fury gives none
    const out = play(s, 'centre-yourself'); // Fury to Serene
    expect(hero(out).statuses.vigor ?? 0).toBe(2);
    expect(hero(out).statuses.mantra ?? 0).toBe(fervor + 2);
  });

  it('Still Guard: 3 Barrier and Serene', () => {
    expect(cardText(db, db.cards['still-guard']!)).toBe('Gain 3 Barrier. Enter Serene.');
  });

  it('Surge of Ire answers only the first Fury each turn, and says so', () => {
    expect(cardText(db, db.cards['surge-of-ire']!)).toMatch(
      /^The first time each turn you enter Fury/,
    );
    let s = play(
      fight(['surge-of-ire', 'rising-ire', 'centre-yourself', 'rage-unbound']),
      'surge-of-ire',
    );
    hero(s).barrier = 0;
    const hand = () => s.sides.a.hand.length;
    // the first Fury: Surge of Ire gives 6 Barrier and a card (Rising Ire draws one too, and leaves the hand)
    const start = hand();
    s = play(s, 'rising-ire');
    expect(hero(s).barrier).toBe(6);
    expect(hand()).toBe(start - 1 + 2);
    // Serene, then Fury again: nothing more this turn
    s = play(s, 'centre-yourself');
    const barrier = hero(s).barrier;
    const before = hand();
    s = play(s, 'rage-unbound');
    expect(hero(s).barrier).toBe(barrier);
    expect(hand()).toBe(before - 1);
  });

  it('All-Seeing costs what the Trickster’s Pickpocket Master costs', () => {
    expect(db.cards['all-seeing']?.cost).toBe(db.cards['pickpocket-master']?.cost);
    expect(db.cards['deep-breath']?.exhaust).toBe(true);
  });
});
