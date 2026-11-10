// Fervor payoffs read the Fervor gained, not the Fervor held (DECISIONS #721): Fervor is spent at 10 on Radiant, so what is held is
// always 0-9, and 0 on the turn it was spent.
import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, heroOf, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db } from './index';

let n = 0;
function play(s: CombatState, card: string, target?: string): CombatState {
  const id = `f721-${n++}`;
  s.sides.a.hand.push({ id, card });
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (target === undefined || a.target === target),
  );
  expect(act, card).toBeTruthy();
  return applyAction(db, s, act!).state;
}
function fight(): CombatState {
  const s = clone(
    createCombat(db, { seed: 'f721', a: { hero: 'monk', deck: [] }, b: { enemies: ['squire', 'squire'] } })
      .state,
  );
  s.sides.a.mana = 20;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 500;
  return s;
}
const foeHp = (s: CombatState): number[] => s.sides.b.units.map((u) => u.hp);

describe('Burning Litany (#721)', () => {
  it('deals half the Fervor gained this fight to all enemies, then enters Radiant', () => {
    let s = fight();
    for (const c of ['the-offering', 'bowing-low', 'bowing-low']) s = play(s, c); // 9 gained, 9 held
    expect(s.sides.a.fervorGained).toBe(9);
    s = play(s, 'burning-litany');
    expect(foeHp(s)).toEqual([496, 496]);
    expect(heroOf(s.sides.a)!.statuses.radiant ?? 0).toBeGreaterThan(0);
    expect(s.sides.a.exhausted.some((c) => c.card === 'burning-litany')).toBe(true);
  });

  it('upgraded: 4 more', () => {
    let s = fight();
    for (const c of ['the-offering', 'bowing-low', 'bowing-low']) s = play(s, c); // 9 gained
    s = play(s, 'burning-litany+');
    expect(foeHp(s)).toEqual([500 - 8, 500 - 8]);
  });

  it('keeps counting past 10, though the Fervor held was spent on Radiant', () => {
    let s = fight();
    for (const c of ['the-offering', 'the-offering', 'bowing-low']) s = play(s, c); // 12+ gained: 10 spent on Radiant
    const gained = s.sides.a.fervorGained ?? 0;
    expect(gained).toBeGreaterThanOrEqual(12);
    expect(heroOf(s.sides.a)!.statuses.mantra ?? 0).toBeLessThan(10);
    expect(heroOf(s.sides.a)!.statuses.radiant ?? 0).toBeGreaterThan(0);
    s = play(s, 'burning-litany');
    // (a Skill's damage is the number printed: Radiant triples attacks only, DECISIONS #376)
    const hit = Math.floor(gained / 2);
    expect(foeHp(s)).toEqual([500 - hit, 500 - hit]);
  });
});

describe('Mantra Engine (#721)', () => {
  it('gives Barrier equal to the Fervor gained this turn, counting Fervor spent on Radiant', () => {
    let s = fight();
    s = play(s, 'mantra-engine');
    for (const c of ['the-offering', 'the-offering', 'bowing-low']) s = play(s, c); // 12+ gained this turn, 10 spent
    const turn = s.sides.a.fervorGainedTurn ?? 0;
    expect(turn).toBeGreaterThanOrEqual(12);
    expect(heroOf(s.sides.a)!.statuses.mantra ?? 0).toBeLessThan(10);
    const hero = heroOf(s.sides.a)!.id;
    const r = applyAction(db, s, { type: 'endTurn' });
    const barrier = r.events
      .filter((e) => e.type === 'barrier' && e.target === hero)
      .map((e) => (e as { amount: number }).amount);
    expect(barrier).toContain(turn);
    expect(r.state.sides.a.fervorGainedTurn).toBe(0);
    expect(r.state.sides.a.fervorGained).toBe(turn);
  });
});
