// The Ascendancy pass (DECISIONS #542): Blood Knight once a round, Deathwish capped, Fateweaver by max HP, the Elementalist, Zealot once a
// turn, Shatterer and Foreman by a percentage, the Gunslinger's Gun every turn, and an old Pyromancer read as the Elementalist.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, ascendancyOf } from './index';

function fight(
  hero: string,
  ascendancy: string | undefined,
  hand: string[],
  enemies: string[] = ['squire'],
): CombatState {
  const { state } = createCombat(db, {
    seed: 'asc-pass-' + (ascendancy ?? hero),
    a: {
      hero,
      deck: RIFTWALKERS[hero as keyof typeof RIFTWALKERS].starter,
      ...(ascendancy ? { ascendancy } : {}),
    },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `H${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
const foe = (s: CombatState): Unit => s.sides.b.units[0]!;
const play = (s: CombatState, card: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === card);
  const act = legalActions(db, s).find(
    (a) =>
      a.type === 'play' &&
      a.card === inst?.id &&
      (!('target' in a) || !a.target || a.target === foe(s).id),
  );
  expect(act, `${card} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;

describe('the Ascendancy pass (DECISIONS #542)', () => {
  it('Fateweaver: 2 Fate plus 2% of the enemy max HP (DECISIONS #544)', () => {
    // (the class's own Fate, from its Thralls, comes on top: compared with the same fight without it)
    const doom = (asc?: string): number =>
      foe(endTurn(fight('necromancer', asc, []))).statuses.doom ?? 0;
    expect(doom('necromancer:fateweaver') - doom()).toBe(2 + 4);
  });

  it('Elementalist: the first Flame card each turn adds 3 Burn, the second none', () => {
    let s = play(
      fight('shaman', 'shaman:elementalist', ['spreading-flames', 'spreading-flames']),
      'spreading-flames',
    );
    expect(foe(s).statuses.burn).toBe(8 + 3);
    s = play(s, 'spreading-flames');
    expect(foe(s).statuses.burn).toBe(8 + 3 + 8);
  });

  it('Shatterer: every Shatter 15% more', () => {
    const shatter = (asc?: string): number => {
      const s = fight('spellblade', asc, ['hairline-crack']);
      foe(s).statuses.fracture = 9;
      const hp = foe(s).hp;
      return hp - foe(play(s, 'hairline-crack')).hp;
    };
    const plain = shatter();
    expect(plain).toBeGreaterThan(0);
    expect(shatter('spellblade:shatterer')).toBe(Math.floor((plain * 115) / 100));
  });

  it('companion percentage damage remains supported; retired Foreman maps to Artillerist', () => {
    // (one companion, the Engineer's own Drone: the Foreman's second Drone would make any bonus look like more damage)
    const strike = (pct: number): { landed: number; shown: number | null } => {
      const s = fight('engineer', undefined, []);
      if (pct) s.sides.a.allyPct = pct;
      const drone = s.sides.a.units.find((u) => u.kind === 'ally')!;
      const shown =
        viewFor(db, s, 'a').sides.a.units.find((u) => u.id === drone.id)?.intentView?.damage ??
        null;
      const after = applyAction(db, s, { type: 'endTurn' });
      const landed = after.events
        .filter(
          (e) =>
            e.type === 'damage' &&
            (e as { source: string | null }).source === drone.id &&
            (e as { target: string }).target === foe(s).id,
        )
        .reduce((n, e) => n + (e as { lost: number }).lost + (e as { blocked: number }).blocked, 0);
      return { landed, shown };
    };
    const plain = strike(0);
    const more = strike(25);
    expect(plain.landed).toBeGreaterThan(0);
    expect(more.landed).toBe(Math.round(plain.landed * 1.25));
    // (what the intent says is what lands, a whole number)
    expect(more.shown).toBe(more.landed);
    expect(fight('engineer', 'engineer:foreman', []).sides.a.allyPct).toBeUndefined();
    expect(ascendancyOf('engineer', 'engineer:foreman')?.id).toBe('engineer:artillerist');
  });

  it('Gunslinger: the Gun grows sharper every turn', () => {
    let s = fight('drunkard', 'drunkard:gunslinger', []);
    const at = (x: CombatState): number =>
      JSON.stringify(x.sides.a).match(/"forged":\{[^}]*"old-twelve-gauge":(\d+)/)?.[1]
        ? Number(JSON.stringify(x.sides.a).match(/"forged":\{[^}]*"old-twelve-gauge":(\d+)/)![1])
        : -1;
    const first = at(s);
    s = endTurn(s);
    expect(at(s)).toBe(first + 2);
  });

  it('a Pyromancer from an old save is the Elementalist', () => {
    expect(ascendancyOf('shaman', 'shaman:pyromancer')?.id).toBe('shaman:elementalist');
  });
});

describe('the Swarmwright (DECISIONS #569)', () => {
  // play Deploy Drones while one fits without releasing a companion; how many companions stand then
  const fill = (asc?: string): number => {
    let s = fight(
      'engineer',
      asc,
      Array.from({ length: 6 }, () => 'deploy-drone'),
    );
    for (;;) {
      const inst = s.sides.a.hand.find((c) => c.card === 'deploy-drone');
      const act = legalActions(db, s).find(
        (a) => a.type === 'play' && a.card === inst?.id && !('release' in a && a.release),
      );
      if (!inst || !act) break;
      s = applyAction(db, s, act).state;
    }
    return s.sides.a.units.filter((u) => u.kind === 'ally').length;
  };

  it('has a 4th companion slot; the Engineer and his other Ascendancies have 3', () => {
    expect(fill()).toBe(3);
    expect(fill('engineer:foreman')).toBe(3);
    expect(fill('engineer:swarmwright')).toBe(4);
  });

  it('gives each companion 1 Primed at the start of the turn', () => {
    let s = fight('engineer', 'engineer:swarmwright', ['deploy-drone']);
    s = endTurn(play(s, 'deploy-drone'));
    const allies = s.sides.a.units.filter((u) => u.kind === 'ally');
    expect(allies.length).toBeGreaterThan(0);
    for (const u of allies) expect(u.statuses.vigor ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('an Overclocker from an old save is the Swarmwright', () => {
    expect(ascendancyOf('engineer', 'engineer:overclocker')?.id).toBe('engineer:swarmwright');
    expect(db.ascended?.['engineer:overclocker']?.maxAllies).toBe(4);
  });
});
