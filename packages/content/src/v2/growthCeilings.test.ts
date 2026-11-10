// Cards that grow over a fight: full rate to the turn-5 count, half after, a hard stop at the turn-10 ceiling (DECISIONS #722).
import { describe, expect, it } from 'vitest';
import { applyAction, cardText, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db } from './index';

let n = 0;
function play(s: CombatState, card: string): { s: CombatState; plants: number } {
  const id = `g722-${n++}`;
  s.sides.a.hand.push({ id, card });
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, card).toBeTruthy();
  const r = applyAction(db, s, act!);
  const plants = r.events.filter((e) => e.type === 'totems' && e.side === 'a' && e.at !== undefined).length;
  return { s: r.state, plants };
}
function fight(hero: string): CombatState {
  const s = clone(
    createCombat(db, { seed: 'g722', a: { hero, deck: [] }, b: { enemies: ['squire'] } }).state,
  );
  s.sides.a.mana = 20;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 5000;
  return s;
}

describe('Thunder Memory (#722)', () => {
  // 1 + the Thunderbirds planted this fight: full to 5, half after, no cap (Robert: "it should be able to place a lot")
  for (const [planted, plants] of [
    [0, 1],
    [4, 5],
    [5, 6],
    [9, 8],
    [13, 10],
    [25, 16],
  ] as const)
    it(`${planted} planted before: plants ${plants}, does not count its own, and Consumes`, () => {
      const s = fight('shaman');
      (s.sides.a.channeledBy ??= {}).thunderbird = planted;
      const r = play(s, 'thunder-memory');
      expect(r.plants).toBe(plants);
      expect(r.s.sides.a.channeledBy?.thunderbird ?? 0).toBe(planted);
      expect(r.s.sides.a.exhausted.some((c) => c.card === 'thunder-memory')).toBe(true);
    });

  it('upgraded: 2 more to start, still Consumes, and a second copy reads the same count', () => {
    const s = fight('shaman');
    (s.sides.a.channeledBy ??= {}).thunderbird = 5;
    const one = play(s, 'thunder-memory+');
    expect(one.plants).toBe(8);
    expect(one.s.sides.a.exhausted.some((c) => c.card === 'thunder-memory+')).toBe(true);
    const two = play(one.s, 'thunder-memory+');
    expect(two.plants).toBe(8);
  });
});

describe('Slow Murder (#722)', () => {
  for (const [drawn, dmg] of [
    [0, 8],
    [28, 36],
    [40, 42],
    [60, 52],
    [200, 52],
  ] as const)
    it(`${drawn} cards drawn: ${dmg} damage`, () => {
      const s = fight('assassin');
      s.sides.a.drawn = drawn;
      const before = s.sides.b.units[0]!.hp;
      const r = play(s, 'slow-murder');
      expect(before - r.s.sides.b.units[0]!.hp).toBe(dmg);
    });

  it('says its limits', () => {
    expect(cardText(db, db.cards['slow-murder']!)).toContain('half as much past +28, at most +44');
    expect(cardText(db, db.cards['thunder-memory']!)).toContain('(half as many past 5)');
  });
});
