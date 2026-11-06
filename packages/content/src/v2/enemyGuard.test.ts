// An enemy's own Barrier and healing grow with the tier, at half the rate its HP does (DECISIONS #548, #555).

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  describeIntent,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

/** A fight at this share of the written enemy HP, as the campaign's tier table sets it. */
function fight(enemies: string[], hpPct: number): CombatState {
  const { state } = createCombat(db, {
    seed: 'guard',
    a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
    b: { enemies, tier: 1, hpPct },
  });
  const s = clone(state);
  const h = s.sides.a.units.find((u) => u.kind === 'hero')!;
  h.hp = h.maxHp = 90000;
  return s;
}
const first = (s: CombatState, def: string): Unit => s.sides.b.units.find((u) => u.def === def)!;
/** Its Barrier after it plays `move` (its Barrier from before has fallen as its turn began). */
function barrierAfter(hpPct: number, def: string, move: string): number {
  const s = fight([def], hpPct);
  const u = first(s, def);
  u.intent = { move, target: s.sides.a.units[0]!.id };
  return first(applyAction(db, s, { type: 'endTurn' }).state, def).barrier;
}

describe('enemy Barrier and healing grow with the tier (DECISIONS #548)', () => {
  // (the Hooded Acolyte's Chant: 7 Barrier as written)
  it('as written at Tier I, and never below it', () => {
    expect(barrierAfter(100, 'hooded-acolyte', 'chant')).toBe(7);
    expect(barrierAfter(90, 'hooded-acolyte', 'chant')).toBe(7);
  });

  it('five and a half times at ten times the HP (half the rate, DECISIONS #555)', () => {
    expect(barrierAfter(1000, 'hooded-acolyte', 'chant')).toBe(39);
  });

  it('healing too (the Bloated One’s Devour heals 8 as written: 3x at 5x the HP)', () => {
    const s = fight(['bloated-one'], 500);
    const u = first(s, 'bloated-one');
    u.hp = 100;
    u.intent = { move: 'devour', target: s.sides.a.units[0]!.id };
    expect(first(applyAction(db, s, { type: 'endTurn' }).state, 'bloated-one').hp).toBe(124);
  });

  it('the intent shows the grown number', () => {
    const s = fight(['hooded-acolyte'], 1000);
    const u = first(s, 'hooded-acolyte');
    u.intent = { move: 'chant', target: s.sides.a.units[0]!.id };
    expect(describeIntent(db, s, u)?.text).toContain('39 Barrier');
  });

  it('an enemy’s Armored grows too; a hero’s does not', () => {
    const s = fight(['hooded-acolyte'], 1000);
    const u = first(s, 'hooded-acolyte');
    u.statuses.armored = 3;
    u.intent = { move: 'stab', target: s.sides.a.units[0]!.id };
    expect(first(applyAction(db, s, { type: 'endTurn' }).state, 'hooded-acolyte').barrier).toBe(17);
    const h = s.sides.a.units.find((x) => x.kind === 'hero')!;
    h.statuses.armored = 3;
    s.sides.a.hand = [];
    s.sides.a.mana = 0;
    s.sides.a.reserves = 3;
    const r = applyAction(db, s, { type: 'endTurn' });
    const gained = r.events.flatMap((e) =>
      e.type === 'barrier' && e.target === h.id ? [e.amount] : [],
    );
    expect(gained).toContain(3);
    expect(gained.every((n) => n < 17)).toBe(true);
  });

  it('a share of max HP is not grown twice (Drago’s Refract)', () => {
    const s = fight(['vorthax'], 1000);
    const v = first(s, 'vorthax');
    v.hp = Math.floor(v.maxHp * 0.9);
    v.intent = { move: 'refract', target: s.sides.a.units[0]!.id };
    expect(first(applyAction(db, s, { type: 'endTurn' }).state, 'vorthax').barrier).toBe(
      Math.floor(v.maxHp * 0.02),
    );
  });
});
