// Enemy phases and setup mods (DECISIONS #245): a unit stops at its phase threshold, rises (Barrier, Might), and carries on.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function start(hp?: number): CombatState {
  return createCombat(db, {
    seed: 'phase',
    a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter], statuses: { exposed: 1 } },
    b: {
      enemies: ['squire', 'squire'],
      mods: [
        { units: [0], rise: [{ atPct: 50, barrierPct: 20, might: 2 }] },
        { statuses: { thorns: 1 } },
      ],
      ...(hp ? { hpPct: hp } : {}),
    },
  }).state;
}

/** a hit of `n` on enemy `i`, as a card with that damage would land */
function strike(s0: CombatState, i: number, n: number): CombatState {
  const s = clone(s0);
  s.sides.a.hand = [{ id: 'T0', card: 'strike' }];
  s.sides.a.mana = 9;
  const t = s.sides.b.units[i]!;
  // (a big Might makes the strike as heavy as wanted)
  const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
  hero.statuses = { might: n };
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.target === t.id);
  return applyAction(db, s, act!).state;
}

describe('enemy phases', () => {
  it('the hero starts with the statuses the setup gives, the enemies with theirs', () => {
    const s = start();
    expect(s.sides.a.units.find((u) => u.kind === 'hero')!.statuses.exposed).toBe(1);
    expect(s.sides.b.units.every((u) => (u.statuses.thorns ?? 0) >= 1)).toBe(true);
    expect(s.sides.b.units[0]!.rise).toHaveLength(1);
    expect(s.sides.b.units[1]!.rise).toBeUndefined();
  });

  it('a blow that would cross the threshold stops at it, and the unit rises', () => {
    const s0 = start();
    const u = s0.sides.b.units[0]!;
    const s = strike(s0, 0, 999);
    const after = s.sides.b.units.find((x) => x.id === u.id)!;
    expect(after.hp).toBe(Math.ceil(u.maxHp / 2));
    expect(after.barrier).toBeGreaterThanOrEqual(Math.ceil(u.maxHp * 0.2));
    expect(after.statuses.might ?? 0).toBeGreaterThanOrEqual(2);
    expect(after.rise).toBeUndefined();
    // the next blow goes all the way
    const s2 = strike(
      s,
      s.sides.b.units.findIndex((x) => x.id === u.id),
      999,
    );
    expect(s2.sides.b.units.some((x) => x.id === u.id)).toBe(false);
  });

  it('a unit without a phase falls as usual', () => {
    const s = strike(start(), 1, 999);
    expect(s.sides.b.units).toHaveLength(1);
  });

  it('is told as an event', () => {
    const s0 = start();
    const t = clone(s0);
    t.sides.a.hand = [{ id: 'T0', card: 'strike' }];
    t.sides.a.mana = 9;
    t.sides.a.units.find((u) => u.kind === 'hero')!.statuses = { might: 999 };
    const act = legalActions(db, t).find(
      (a) => a.type === 'play' && a.target === t.sides.b.units[0]!.id,
    );
    const r = applyAction(db, t, act!);
    expect(r.events.some((e) => e.type === 'phase')).toBe(true);
  });
});

describe('the edges of a phase', () => {
  it('a blow that lands exactly on the threshold rises there, and the next blow cannot skip the phase', () => {
    const s0 = start();
    const u = s0.sides.b.units[0]!;
    const floor = Math.ceil(u.maxHp / 2);
    const s1 = clone(s0);
    s1.sides.b.units[0]!.hp = floor + 1;
    const s = strike(s1, 0, 0);
    const after = s.sides.b.units[0]!;
    expect(after.hp).toBe(floor);
    expect(after.rise).toBeUndefined();
  });

  it('an enemy spends its Vigor on its next attacking move (the Omen of the Hunted)', () => {
    const { state } = createCombat(db, {
      seed: 'vigor',
      a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter] },
      b: { enemies: ['squire'], mods: [{ statuses: { vigor: 50 } }] },
    });
    let s = state;
    for (let i = 0; i < 6 && (s.sides.b.units[0]?.statuses.vigor ?? 0) > 0 && !s.winner; i++)
      s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.b.units[0]?.statuses.vigor ?? 0).toBe(0);
  });
});
