// Kesh's pack: Den Mother (an Aura that strikes back when a companion falls), and the summons by cost (DECISIONS #325).

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'kesh-test',
    a: { hero: 'hunter', deck: [...RIFTWALKERS.hunter.starter, ...RIFTWALKERS.hunter.starter] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 200;
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe('Den Mother', () => {
  it('is a 3 Mana Aura, and the upgrade hits harder without costing less', () => {
    const c = db.cards['den-mother']!;
    const up = db.cards['den-mother+']!;
    expect([c.kind, c.cost]).toEqual(['power', 3]);
    expect([up.kind, up.cost]).toEqual(['power', 3]);
    expect(up.retain).toBeFalsy();
    expect(up.innate).toBeFalsy();
    const dmg = (id: string): number => {
      const p = db.cards[id]!.effects[0];
      return p?.op === 'power' && p.ops[0]?.op === 'damage' ? p.ops[0].amount : 0;
    };
    expect(dmg('den-mother')).toBe(15);
    expect(dmg('den-mother+')).toBe(20);
  });

  it('strikes an enemy when one of her companions dies', () => {
    let s = play(fight(['den-mother', 'whelp']), 'T0');
    s = play(s, 'T1');
    const pup = s.sides.a.units.find((u) => u.def === 'pup')!;
    const enemyHp = (): number => s.sides.b.units.reduce((n, u) => n + u.hp, 0);
    const before = enemyHp();
    // the Hound she starts with stands in front; an enemy attack kills companions in turn
    pup.hp = 1;
    for (const u of s.sides.a.units) if (u.kind === 'ally') u.hp = 1;
    s = applyAction(db, s, { type: 'endTurn' }).state;
    const fallen = 2 - s.sides.a.units.filter((u) => u.kind === 'ally').length;
    expect(fallen).toBeGreaterThan(0);
    // each companion that fell cost the enemies 15 (the companions' own attacks at the end of the turn come first)
    expect(before - enemyHp()).toBeGreaterThanOrEqual(15 * fallen);
  });
});

describe('the summons, by cost', () => {
  it('Whelp is 1 Mana for a Pup, Alpha Call 2 for the Alpha, Dire Wolf 3 for the Dire Wolf', () => {
    expect(db.cards['whelp']!.cost).toBe(1);
    expect(db.cards['alpha-call']!.cost).toBe(2);
    expect(db.cards['dire-wolf']!.cost).toBe(3);
    const hp = (id: string): number => db.units[id]!.maxHp;
    const hit = (id: string): number => {
      const b = db.units[id]!.brain;
      const o = b.kind === 'ally' ? b.act[0] : undefined;
      return o?.op === 'damage' ? o.amount : 0;
    };
    expect([hp('pack-alpha'), hit('pack-alpha')]).toEqual([16, 10]);
    expect(hp('dire-wolf')).toBeGreaterThan(hp('pack-alpha'));
    expect(hit('dire-wolf')).toBeGreaterThan(hit('pack-alpha'));
    expect(hp('pup')).toBeLessThan(hp('hound'));
  });
});
