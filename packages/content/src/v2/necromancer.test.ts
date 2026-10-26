// The Necromancer's missing pieces: bring Consumed cards back, bring a fallen ally back, and get paid when allies die.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'mire-test',
    a: {
      hero: 'necromancer',
      deck: [...RIFTWALKERS.necromancer.starter, ...RIFTWALKERS.necromancer.starter],
    },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');

describe('Mire gets the dead back', () => {
  it('Grave Robbery returns a random Consumed card to the hand (never an Aura)', () => {
    const s = fight(['grave-robbery']);
    s.sides.a.exhausted = [
      { id: 'X1', card: 'strike' },
      { id: 'X2', card: 'lineage' },
    ];
    const after = play(s, 'T0');
    expect(after.sides.a.hand.map((c) => c.card)).toContain('strike');
    expect(after.sides.a.exhausted.map((c) => c.card)).not.toContain('strike');
    // the Aura stays where it was
    expect(after.sides.a.exhausted.map((c) => c.card)).toContain('lineage');
  });

  it('Reanimate brings the last fallen ally back with half its HP; nothing happens with none fallen', () => {
    const none = play(fight(['reanimate']), 'T0');
    expect(allies(none)).toHaveLength(allies(fight([])).length);
    let s = fight(['fen-offering', 'reanimate']);
    const thrall = allies(s)[0]!;
    s = play(s, 'T0', thrall.id); // Fen Offering sacrifices the Thrall
    expect(allies(s)).toHaveLength(0);
    expect(s.sides.a.fallen).toEqual([thrall.def]);
    s = play(s, 'T1');
    const back = allies(s)[0]!;
    expect(back.def).toBe(thrall.def);
    expect(back.hp).toBe(back.maxHp - Math.floor(back.maxHp / 2));
    expect(s.sides.a.fallen).toEqual([]);
  });

  it('Death Feeds pays Barrier and a card each time an ally dies', () => {
    let s = fight(['death-feeds', 'fen-offering']);
    s = play(s, 'T0');
    const thrall = allies(s)[0]!;
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    const barrierBefore = hero.barrier;
    const handBefore = s.sides.a.hand.length;
    s = play(s, 'T1', thrall.id);
    const heroAfter = s.sides.a.units[s.sides.a.units.length - 1]!;
    expect(heroAfter.barrier).toBeGreaterThanOrEqual(barrierBefore + 8);
    // the sacrifice card left the hand, the Aura drew one
    expect(s.sides.a.hand.length).toBeGreaterThanOrEqual(handBefore - 1 + 1);
  });
});
