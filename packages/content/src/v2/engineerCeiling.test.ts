// The Engineer's ceiling cards (Robert, 2026-10-30): Final Volley grows with the crew, Critical Mass with Might.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function setup() {
  const { state } = createCombat(db, {
    seed: 'engineer-ceiling',
    a: { hero: 'engineer', deck: [...RIFTWALKERS.engineer.starter] },
    b: { enemies: ['patrol-unit'] },
  });
  const s = clone(state);
  s.sides.a.mana = 9;
  return s;
}
const play = (s: ReturnType<typeof setup>, card: string) => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'X');
  expect(act, card).toBeDefined();
  return applyAction(db, s, act!).state;
};

describe('Engineer ceiling cards', () => {
  it('Full Throttle: the crew acts twice, at least double a single Assemble', () => {
    const dealt = (card: string): number => {
      let s = setup();
      const foe = s.sides.b.units[0]!;
      foe.hp = 500;
      foe.maxHp = 500;
      foe.barrier = 0;
      foe.statuses = {};
      s.sides.a.hand = [{ id: 'X', card }];
      s = play(s, card);
      return 500 - s.sides.b.units[0]!.hp;
    };
    const one = dealt('assemble');
    expect(one).toBeGreaterThan(0);
    expect(dealt('full-throttle')).toBeGreaterThanOrEqual(one * 2);
    expect(db.cards['full-throttle']!.exhaust).toBe(true);
  });
  it('Final Volley: 6 plus 10 for each companion standing', () => {
    const hit = (crew: number): number => {
      let s = setup();
      let kept = 0;
      s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally' || kept++ < crew);
      const foe = s.sides.b.units[0]!;
      foe.hp = 500;
      foe.maxHp = 500;
      foe.barrier = 0;
      foe.statuses = {};
      s.sides.a.hand = [{ id: 'X', card: 'final-volley' }];
      s = play(s, 'final-volley');
      return 500 - s.sides.b.units[0]!.hp;
    };
    expect(hit(0)).toBe(6);
    expect(hit(1)).toBe(16);
    expect(db.cards['final-volley']!.exhaust).toBe(true);
  });
  it('Critical Mass: 10 plus 3 per Might, plus the Might itself on the hit', () => {
    const hit = (might: number): number => {
      let s = setup();
      const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
      hero.statuses = { ...hero.statuses, ...(might ? { might } : {}) };
      const foe = s.sides.b.units[0]!;
      foe.hp = 500;
      foe.maxHp = 500;
      foe.barrier = 0;
      foe.statuses = {};
      s.sides.a.hand = [{ id: 'X', card: 'critical-mass' }];
      s = play(s, 'critical-mass');
      return 500 - s.sides.b.units[0]!.hp;
    };
    expect(hit(0)).toBe(10);
    expect(hit(6)).toBe(10 + 18 + 6);
    expect(hit(9)).toBeGreaterThan(hit(6));
  });
});
