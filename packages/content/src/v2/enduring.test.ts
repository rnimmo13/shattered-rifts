// Enduring: a campaign ghost loses at most a share of its Max HP in any one turn, so no deck one-shots it (DECISIONS #549).

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, type CombatState, type Unit } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

const foe = (s: CombatState): Unit => s.sides.b.units.find((u) => u.hp > 0)!;

/** A knight against one enemy of 100 Max HP that is Enduring 25, with five Strikes in hand and Mana to play them all. */
function setup(): CombatState {
  const { state } = createCombat(db, {
    seed: 'enduring',
    a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
    b: { enemies: ['squire'], mods: [{ statuses: { enduring: 25 } }] },
  });
  const s = clone(state);
  const h = s.sides.a.units.find((u) => u.kind === 'hero')!;
  h.hp = h.maxHp = 9000;
  const u = foe(s);
  u.hp = u.maxHp = 100;
  s.sides.a.mana = 9;
  s.sides.a.hand = [0, 1, 2, 3, 4].map((i) => ({ id: `W${i}`, card: 'strike' }));
  return s;
}

const strikeAll = (s0: CombatState): CombatState => {
  let s = s0;
  for (const c of [...s0.sides.a.hand]) {
    s = applyAction(db, s, { type: 'play', card: c.id, target: foe(s).id }).state;
  }
  return s;
};

describe('Enduring', () => {
  it('stops a turn at its share of Max HP, however many hits land', () => {
    const s = strikeAll(setup());
    expect(foe(s).hp).toBe(75);
  });

  it('counts afresh each turn', () => {
    let s = strikeAll(setup());
    s = applyAction(db, s, { type: 'endTurn' }).state;
    for (let i = 0; i < 3 && s.active !== 'a' && !s.winner; i++)
      s = applyAction(db, s, { type: 'endTurn' }).state;
    s = clone(s);
    s.sides.a.mana = 9;
    s.sides.a.hand = [0, 1].map((i) => ({ id: `X${i}`, card: 'strike' }));
    const after = strikeAll(s);
    expect(foe(s).hp - foe(after).hp).toBeGreaterThan(0);
    expect(foe(after).hp).toBeGreaterThanOrEqual(50);
  });

  it('a ghost deck can start with it', () => {
    const { state } = createCombat(db, {
      seed: 'enduring-ghost',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { hero: 'knight', deck: RIFTWALKERS.knight.starter, statuses: { enduring: 34 } },
    });
    const ghost = state.sides.b.units.find((u) => u.kind === 'hero')!;
    expect(ghost.statuses.enduring).toBe(34);
  });
});
