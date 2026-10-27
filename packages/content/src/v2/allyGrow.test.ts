// A heal never mends a companion: it grows it, as much max HP and HP (DECISIONS #356).

import { describe, expect, it } from 'vitest';
import { applyAction, cardText, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'grow-test',
    a: { hero: 'engineer', deck: [...RIFTWALKERS.engineer.starter, ...RIFTWALKERS.engineer.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || ('target' in a && a.target === target)),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');

describe('healing a companion grows it', () => {
  it('a hurt drone gains the whole heal as max HP and HP', () => {
    let s = play(fight(['deploy-drone', 'sync-pulse']), 'T0');
    const drone = allies(s)[0]!;
    drone.hp = drone.maxHp - 2;
    const { hp, maxHp } = drone;
    s = play(s, 'T1'); // heal 3 to all friends
    const after = allies(s)[0]!;
    expect(after.maxHp).toBe(maxHp + 3);
    expect(after.hp).toBe(hp + 3);
  });

  it('the hero still only heals up to max HP', () => {
    let s = fight(['sync-pulse']);
    const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
    const max = hero.maxHp;
    hero.hp = max - 1;
    s = play(s, 'T0');
    const after = s.sides.a.units.find((u) => u.kind === 'hero')!;
    expect(after.hp).toBe(max);
    expect(after.maxHp).toBe(max);
  });

  it('says so on the card', () => {
    expect(cardText(db, db.cards['sync-pulse']!)).toContain('Your companions gain 3 max HP');
  });
});
