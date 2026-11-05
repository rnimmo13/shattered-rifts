// Ascendancies (DECISIONS #519).

import { describe, expect, it } from 'vitest';
import { applyAction, createCombat, validateDb, type CombatState, type Unit } from '@sr/combat';
import {
  ASCENDANCIES,
  COMBAT_DB as db,
  RIFTWALKERS,
  ascendanciesOf,
  ascendancyOf,
  classNameOf,
  classTrait,
} from './index';

const fight = (hero: string, ascendancy?: string): CombatState =>
  createCombat(db, {
    seed: 'asc-' + hero + (ascendancy ?? ''),
    a: {
      hero,
      deck: RIFTWALKERS[hero as keyof typeof RIFTWALKERS].starter,
      ...(ascendancy ? { ascendancy } : {}),
    },
    b: { enemies: ['squire', 'squire'] },
  }).state;
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('Ascendancies', () => {
  it('every class has three, each with its own class name', () => {
    for (const id of Object.keys(RIFTWALKERS)) expect(ascendanciesOf(id), id).toHaveLength(3);
    const names = ASCENDANCIES.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
    const classes = Object.values(RIFTWALKERS).map((r) => r.hero.name);
    for (const n of names) expect(classes, n).not.toContain(n);
  });

  it('are valid data, and every one plays a whole round in a fight', () => {
    expect(validateDb(db)).toEqual([]);
    for (const a of ASCENDANCIES) {
      const s = fight(a.hero, a.id);
      expect(hero(s).name, a.id).toBe(a.name);
      expect(s.sides.a.ascendancy).toBe(a.id);
      const next = applyAction(db, s, { type: 'endTurn' }).state;
      expect(next.turn, a.id).toBeGreaterThan(s.turn);
    }
  });

  it('take effect', () => {
    // (the Paladin keeps 60% of last turn's Barrier, not Fortified's 75%: DECISIONS #545)
    // (Barrier as the next turn begins, from 60 held at the end of this one: the enemies' blows take the same off both)
    // (the same seed for both, so the same blows land: only the share kept differs, and it is at most 60% of what was held)
    const kept = (asc?: string): number => {
      const s = createCombat(db, {
        seed: 'paladin-keep',
        a: {
          hero: 'knight',
          deck: RIFTWALKERS.knight.starter,
          ...(asc ? { ascendancy: asc } : {}),
        },
        b: { enemies: ['squire', 'squire'] },
      }).state;
      hero(s).barrier = 60;
      return hero(applyAction(db, s, { type: 'endTurn' }).state).barrier;
    };
    const plain = kept();
    const paladin = kept('knight:paladin');
    expect(paladin).toBeGreaterThan(plain);
    expect(paladin - plain).toBeLessThanOrEqual(Math.floor(60 * 0.6));
    expect(hero(fight('knight', 'knight:paladin')).statuses.fortified ?? 0).toBe(0);
    expect(fight('knight', 'knight:marshal').sides.a.maxReserves).toBe(4);
    expect(fight('knight').sides.a.maxReserves).toBe(3);
    const foreman = fight('engineer', 'engineer:foreman').sides.a.units.filter(
      (u) => u.kind === 'ally',
    );
    expect(foreman.length).toBe(
      fight('engineer').sides.a.units.filter((u) => u.kind === 'ally').length,
    );
    expect(hero(fight('engineer', 'engineer:foreman')).name).toBe('Artillerist');
    expect(hero(fight('engineer', 'engineer:foreman')).statuses.might).toBe(2);
    expect(fight('assassin', 'assassin:assassin').sides.a.discipline?.rule.kind).toBe('execution');
  });

  it('an Ascendancy that is not the hero’s own does nothing', () => {
    const s = fight('knight', 'monk:zealot');
    expect(hero(s).name).toBe('Knight');
    expect(s.sides.a.ascendancy).toBeUndefined();
    expect(ascendancyOf('knight', 'monk:zealot')).toBeUndefined();
    expect(ascendancyOf('knight', 7)).toBeUndefined();
  });

  it('the trait reads with what was taken', () => {
    const t = classTrait('knight', 'knight:paladin');
    expect(t?.name).toBe('Paladin');
    expect(t?.text).toContain('Mana Reserves'.split(' ')[0]);
    expect(t?.text).toContain('Fortified');
    expect(classTrait('knight')?.name).toBe('Mana Reserves');
  });

  it('the class name changes, and the Assassin is what a Rogue can become', () => {
    expect(classNameOf('knight')).toBe('Knight');
    expect(classNameOf('knight', 'knight:paladin')).toBe('Paladin');
    expect(classNameOf('assassin')).toBe('Rogue');
    expect(classNameOf('assassin', 'assassin:assassin')).toBe('Assassin');
  });
});

describe("the Knight's foundation (DECISIONS #521)", () => {
  it('starts every fight with 1 Reserve (2 until DECISIONS #560), and Barrier for what is held at the end of the turn', () => {
    const s = fight('knight');
    expect(s.sides.a.reserves).toBe(1);
    const { state, events } = applyAction(db, s, { type: 'endTurn' });
    // (3 unspent Mana fills his Reserves to 3, and that much Barrier comes)
    const gained = events.flatMap((e) =>
      e.type === 'barrier' && e.target === hero(s).id ? [e.amount] : [],
    );
    expect(gained).toEqual([3]);
    expect(state.sides.a.reserves).toBe(3);
  });
});
