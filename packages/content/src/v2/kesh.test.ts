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

  it('strikes the enemy that killed one of her companions, and only that', () => {
    const run = (hand: string[]): { hp: number[]; fallen: number } => {
      let s = fight(hand);
      for (let k = 0; k < hand.length; k++) s = play(s, 'T' + k);
      for (const u of s.sides.a.units) if (u.kind === 'ally') u.hp = 1;
      const before = s.sides.a.units.filter((u) => u.kind === 'ally').length;
      s = applyAction(db, s, { type: 'endTurn' }).state;
      return {
        hp: s.sides.b.units.map((u) => u.hp),
        fallen: before - s.sides.a.units.filter((u) => u.kind === 'ally').length,
      };
    };
    // the same turn without Den Mother, and with her: each companion an enemy killed costs that enemy 15 more
    const without = run(['summon-pup']);
    const withHer = run(['den-mother', 'summon-pup']);
    expect(withHer.fallen).toBe(without.fallen);
    expect(without.fallen).toBeGreaterThan(0);
    const lost = without.hp.map((hp, i) => hp - (withHer.hp[i] ?? 0));
    // (15, plus the 1 Might her trait gives her at the start of every fight)
    expect(lost.reduce((a, b) => a + b, 0)).toBe((15 + 1) * withHer.fallen);
  });

  it('does nothing when a companion was not killed by an attack (a sacrifice)', () => {
    let s = fight(['den-mother', 'summon-pup', 'devour-ally']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    const before = s.sides.b.units.map((u) => u.hp);
    const act = legalActions(db, s).find(
      (a) =>
        a.type === 'play' &&
        a.card === 'T2' &&
        s.sides.a.units.find((u) => u.id === a.target)?.def === 'pup',
    );
    expect(act, 'Devour Ally on the Pup').toBeTruthy();
    s = applyAction(db, s, act!).state;
    expect(s.sides.a.units.some((u) => u.def === 'pup')).toBe(false);
    expect(s.sides.b.units.map((u) => u.hp)).toEqual(before);
  });
});

describe('the summons, by cost', () => {
  it('Summon Pup is 1 Mana for a Pup, Alpha Call 2 for the Alpha, Dire Wolf 3 for the Dire Wolf', () => {
    expect(db.cards['summon-pup']!.cost).toBe(1);
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
    // the Pup never outgrows the Hound, even upgraded
    expect(hp('pup+')).toBeLessThanOrEqual(hp('hound'));
    expect(hit('pup+')).toBeLessThanOrEqual(hit('hound'));
  });
});
