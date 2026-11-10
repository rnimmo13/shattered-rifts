// Every source that plays a card again adds its own play (DECISIONS #717): a Boosted Aura (Doubled Vow) that is also the first card of the
// turn under Echoing Spirit is played three times; before, only one of them counted and the Boost was spent for nothing.
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  heroOf,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db } from './index';

let n = 0;
function play(s: CombatState, card: string): CombatState {
  const id = `x717-${n++}`;
  s.sides.a.hand.push({ id, card });
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, card).toBeTruthy();
  return applyAction(db, s, act!).state;
}
function fight(): CombatState {
  const s = clone(
    createCombat(db, { seed: 'x717', a: { hero: 'shaman', deck: [] }, b: { enemies: ['squire'] } })
      .state,
  );
  s.sides.a.mana = 20;
  return s;
}
// (Free Hand: each time it resolves, 3 Deftness)
const deft = (s: CombatState): number => heroOf(s.sides.a)!.statuses.deftness ?? 0;

describe('extra plays add up (#717)', () => {
  it('a Boosted Aura that is the first card under Echoing Spirit is played three times, and the Boost is spent', () => {
    let s = fight();
    heroOf(s.sides.a)!.statuses.echoing = 1;
    heroOf(s.sides.a)!.statuses.boosted = 1;
    s = play(s, 'free-hand');
    expect(deft(s)).toBe(9);
    expect(heroOf(s.sides.a)!.statuses.boosted ?? 0).toBe(0);
  });

  it('Doubled Vow echoed gives two Boosts: the next two Auras are each played twice', () => {
    let s = fight();
    heroOf(s.sides.a)!.statuses.echoing = 1;
    s = play(s, 'doubled-vow');
    expect(heroOf(s.sides.a)!.statuses.boosted).toBe(2);
    s = play(s, 'free-hand');
    expect(deft(s)).toBe(6);
    s = play(s, 'free-hand');
    expect(deft(s)).toBe(12);
    expect(heroOf(s.sides.a)!.statuses.boosted ?? 0).toBe(0);
  });

  it('one source alone still plays it once more, and the second card of the turn is not echoed', () => {
    let s = fight();
    heroOf(s.sides.a)!.statuses.echoing = 1;
    s = play(s, 'free-hand');
    expect(deft(s)).toBe(6);
    s = play(s, 'free-hand');
    expect(deft(s)).toBe(9);
  });

  it('a Mirrored Skill that is the first card under Echoing Spirit is played three times', () => {
    let s = fight();
    heroOf(s.sides.a)!.statuses.echoing = 1;
    heroOf(s.sides.a)!.statuses.mirrored = 1;
    const before = heroOf(s.sides.a)!.barrier;
    s = play(s, 'defend');
    const one = (db.cards['defend']!.effects[0] as { amount: number }).amount;
    expect(heroOf(s.sides.a)!.barrier - before).toBe(3 * one);
    expect(heroOf(s.sides.a)!.statuses.mirrored ?? 0).toBe(0);
  });
});

describe('Tide of Peace (#720)', () => {
  it('heals 3 per Mana spent, draws 2 and Consumes', () => {
    let s = fight();
    const h = heroOf(s.sides.a)!;
    h.hp = 20;
    s.sides.a.mana = 3;
    s.sides.a.draw = Array.from({ length: 5 }, (_, i) => ({ id: `d${i}`, card: 'defend' }));
    const hand = s.sides.a.hand.length;
    s = play(s, 'tide-of-peace');
    expect(heroOf(s.sides.a)!.hp).toBe(20 + 9);
    expect(s.sides.a.hand.length).toBe(hand + 2);
    expect(s.sides.a.exhausted.some((c) => c.card === 'tide-of-peace')).toBe(true);
    expect(db.cards['tide-of-peace+']?.xBonus).toBe(1);
  });
});
