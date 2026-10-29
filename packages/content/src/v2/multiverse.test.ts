// The multiverse enemy expansion (DECISIONS #437): its 62 enemies are sound data, every move of each comes up in play (the second
// loop of a boss at half HP), its encounters use only units that exist, and the Hunger Orchard's summons stop at the enemy cap.

import { describe, expect, it } from 'vitest';
import { applyAction, createCombat, legalActions, MAX_ENEMIES, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS } from './index';
import { ENEMY_UNITS } from './units';
import { MULTIVERSE_UNITS } from './unitsMultiverse';

const NEW = new Set(MULTIVERSE_UNITS.map((u) => u.id));
const movesOf = (u: (typeof MULTIVERSE_UNITS)[number]) =>
  u.brain.kind === 'enemy' ? Object.keys(u.brain.moves) : [];

/** the hero ends every turn and cannot die; returns the moves the enemies showed */
function watch(
  units: string[],
  turns: number,
  hpPct = 100,
): { seen: Set<string>; state: CombatState } {
  let { state } = createCombat(db, {
    seed: `watch-${units.join('-')}-${hpPct}`,
    a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
    b: { enemies: units },
  });
  const seen = new Set<string>();
  const look = () => {
    for (const u of state.sides.b.units) if (u.intent) seen.add(`${u.def}:${u.intent.move}`);
  };
  state = JSON.parse(JSON.stringify(state)) as CombatState; // (a copy to change)
  for (const u of state.sides.b.units) u.hp = Math.max(1, Math.floor((u.maxHp * hpPct) / 100));
  look();
  for (let t = 0; t < turns && !state.winner; t++) {
    const hero = state.sides.a.units.find((u) => u.kind === 'hero');
    if (hero) hero.hp = hero.maxHp = 9999;
    const end = legalActions(db, state).find((a) => a.type === 'endTurn');
    if (!end) break;
    state = applyAction(db, state, end).state;
    look();
  }
  return { seen, state };
}

describe('the multiverse expansion (DECISIONS #437)', () => {
  it('adds 62 enemies with unique ids, taking the enemies from 31 to 93', () => {
    expect(MULTIVERSE_UNITS).toHaveLength(62);
    expect(NEW.size).toBe(62);
    expect(ENEMY_UNITS).toHaveLength(93);
    expect(new Set(ENEMY_UNITS.map((u) => u.id)).size).toBe(93);
  });

  it('each enemy has HP, three or more moves, and a pattern that names only its own moves and uses all of them', () => {
    for (const u of MULTIVERSE_UNITS) {
      expect(u.maxHp, u.id).toBeGreaterThan(0);
      expect(u.brain.kind, u.id).toBe('enemy');
      if (u.brain.kind !== 'enemy') continue;
      const moves = Object.keys(u.brain.moves);
      expect(moves.length, u.id).toBeGreaterThanOrEqual(3);
      const p = u.brain.pattern;
      const orders =
        p.kind === 'phases'
          ? p.phases.map((x) => (x.pattern.kind === 'cycle' ? x.pattern.order : []))
          : [p.kind === 'cycle' ? p.order : []];
      const named = orders.flat();
      for (const m of named) expect(moves, `${u.id} names ${m}`).toContain(m);
      for (const m of moves) expect(named, `${u.id} never uses ${m}`).toContain(m);
    }
  });

  it('every encounter uses units that exist, and every new enemy is in at least one', () => {
    for (const e of ENCOUNTERS)
      for (const id of e.units) expect(db.units[id], `${e.id}: ${id}`).toBeDefined();
    const used = new Set(ENCOUNTERS.flatMap((e) => e.units));
    for (const id of NEW) expect(used.has(id), id).toBe(true);
  });

  it('every move of every new enemy comes up in play (a boss shows its second loop at half HP)', () => {
    for (const u of MULTIVERSE_UNITS) {
      const seen = new Set([...watch([u.id], 6).seen, ...watch([u.id], 6, 40).seen]);
      for (const m of movesOf(u))
        expect(seen.has(`${u.id}:${m}`), `${u.id} never showed ${m}`).toBe(true);
    }
  }, 60_000);

  it("the Hunger Orchard's summons stop at the enemy cap", () => {
    const { state } = watch(['hunger-orchard', 'thornback-toad', 'orchid-maw'], 12);
    const enemies = state.sides.b.units.filter((u) => u.kind !== 'hero');
    expect(enemies.length).toBeLessThanOrEqual(MAX_ENEMIES);
    expect(enemies.length).toBe(MAX_ENEMIES); // (it did summon, up to the cap)
  });
});

describe('the multiverse enemies’ Exposed and Fate land where they count (DECISIONS #437 review)', () => {
  // a hit on the hero while the hero is Exposed, counting the Exposed put on inside the same enemy turn, in event order
  const exposedHit = (id: string): boolean => {
    let { state } = createCombat(db, {
      seed: `exp-${id}`,
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: [id] },
    });
    for (let i = 0; i < 12 && !state.winner; i++) {
      const hero = state.sides.a.units.find((u) => u.kind === 'hero')!;
      let exposed = hero.statuses.exposed ?? 0;
      const r = applyAction(db, state, { type: 'endTurn' });
      for (const e of r.events) {
        if (e.type === 'status' && e.target === hero.id && e.status === 'exposed')
          exposed = e.total;
        if (e.type === 'damage' && e.kind === 'attack' && e.target === hero.id && exposed > 0)
          return true;
      }
      state = r.state;
      const h = state.sides.a.units.find((u) => u.kind === 'hero');
      if (h) h.hp = h.maxHp = 9999;
    }
    return false;
  };
  for (const id of [
    'marble-mantis',
    'prism-magistrate',
    'welding-cherub',
    'mirror-moth',
    'shard-peacock',
  ])
    it(`${id}: its Exposed is still on the hero when an attack lands`, () => {
      expect(exposedHit(id)).toBe(true);
    });

  it('Fate goes on the hero, past a companion in front', () => {
    let n = 0;
    for (const u of MULTIVERSE_UNITS) {
      const b = u.brain;
      if (b?.kind !== 'enemy') continue;
      for (const m of Object.values(b.moves))
        for (const o of m.effects)
          if (o.op === 'status' && o.status === 'doom') {
            n++;
            expect(o.to, u.id).toBe('foeHero');
          }
    }
    expect(n).toBeGreaterThan(0);
  });
});
