import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  hashState,
  legalActions,
  previewCardDamage,
  viewFor,
  type CardDef,
  type CombatState,
  type Op,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as base, RIFTWALKERS } from './index';

const card = (id: string, effects: Op[], more: Partial<CardDef> = {}): CardDef => ({
  id,
  name: id,
  kind: 'skill',
  cost: 0,
  target: 'none',
  effects,
  ...more,
});
const hit = (amount = 10, hits = 1): Op => ({ op: 'damage', amount, hits, to: 'target' });
const db = {
  ...base,
  cards: {
    ...base.cards,
    'probe-hit': card('probe-hit', [hit()], { kind: 'attack', target: 'foe' }),
    'probe-double': card('probe-double', [hit(10, 2)], { kind: 'attack', target: 'foe' }),
    'probe-cost': card('probe-cost', [hit()], { kind: 'attack', target: 'foe', cost: 4 }),
    'probe-x': card('probe-x', [hit()], { kind: 'attack', target: 'foe', x: true }),
    'probe-skill': card('probe-skill', []),
    'probe-skill-damage': card('probe-skill-damage', [hit()], { target: 'foe' }),
    'probe-spell-guard': card(
      'probe-spell-guard',
      [hit(), { op: 'barrier', amount: 5, to: 'self' }],
      { kind: 'attack', target: 'foe', tags: ['spell'], starCost: 6 },
    ),
    'probe-blood': card('probe-blood', [{ op: 'loseHp', amount: 8, to: 'self' }]),
    'probe-flame': card('probe-flame', [], { tags: ['flame'] }),
    'probe-frost': card('probe-frost', [], { tags: ['frost'] }),
    'probe-storm': card('probe-storm', [], { tags: ['storm'] }),
    'probe-fury': card('probe-fury', [{ op: 'stance', stance: 'wrath' }]),
    'probe-calm': card('probe-calm', [{ op: 'stance', stance: 'calm' }]),
    'probe-radiant': card('probe-radiant', [{ op: 'stance', stance: 'radiant' }]),
    'probe-spell': card('probe-spell', [hit(10, 3)], {
      kind: 'attack',
      target: 'foe',
      tags: ['spell'],
      starCost: 6,
    }),
    'probe-choice': card('probe-choice', [hit(), { op: 'scry', amount: 1 }, hit()], {
      kind: 'attack',
      target: 'foe',
    }),
  },
  units: {
    ...base.units,
    'probe-wall': {
      id: 'probe-wall',
      name: 'Wall',
      maxHp: 10000,
      brain: {
        kind: 'enemy' as const,
        moves: { wait: { id: 'wait', name: 'Wait', effects: [] } },
        pattern: { kind: 'cycle' as const, order: ['wait'] },
      },
    },
  },
};
const hero = (s: CombatState, side: 'a' | 'b' = 'a'): Unit =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState): Unit => s.sides.b.units[0]!;
const fight = (classId: string, asc: string): CombatState =>
  createCombat(db, {
    seed: 'ascendancy-scaling',
    a: {
      hero: classId,
      ascendancy: `${classId}:${asc}`,
      deck: RIFTWALKERS[classId as keyof typeof RIFTWALKERS].starter,
    },
    b: { enemies: ['probe-wall', 'probe-wall'] },
  }).state;
function play(s: CombatState, id: string, target?: string): ReturnType<typeof applyAction> {
  s.sides.a.hand.push({ id: `probe-${s.sides.a.played}-${s.sides.a.hand.length}`, card: id });
  const inst = s.sides.a.hand.at(-1)!;
  const act = legalActions(db, s).find(
    (a) =>
      a.type === 'play' &&
      a.card === inst.id &&
      (!('target' in a) || a.target === (target ?? foe(s).id)),
  );
  expect(act, `${id} is playable`).toBeTruthy();
  return applyAction(db, s, act!);
}
const end = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
const damage = (r: ReturnType<typeof applyAction>): number[] =>
  r.events.flatMap((e) =>
    e.type === 'damage' && e.target.startsWith('u') && e.source ? [e.lost + e.blocked] : [],
  );

describe('distinct late-game Ascendancy disciplines', () => {
  it('Marshal rewards actual Reserve spending, including X, resets next turn, and previews without mutation', () => {
    let s = fight('knight', 'marshal');
    s.sides.a.mana = 0;
    s.sides.a.reserves = 4;
    s.sides.a.hand = [{ id: 'preview', card: 'probe-cost' }];
    const before = hashState(s);
    expect([...previewCardDamage(db, s, 'preview', foe(s).id).values()][0]?.lo).toBe(14);
    expect(hashState(s)).toBe(before);
    const r = applyAction(db, s, { type: 'play', card: 'preview', target: foe(s).id });
    expect(damage(r)).toEqual([14]);
    expect(r.state.sides.a.discipline?.progress).toBe(4);
    s = end(r.state);
    expect(s.sides.a.discipline?.progress).toBe(0);
    s.sides.a.mana = 0;
    s.sides.a.reserves = 4;
    expect(damage(play(s, 'probe-x'))).toEqual([14]);
  });
  it('Blood Knight charges from actual lost HP with round and bank caps, then spends once for a multi-hit Attack', () => {
    let s = fight('knight', 'blood-knight');
    s = play(s, 'probe-blood').state;
    expect(s.sides.a.discipline?.progress).toBe(30);
    s = play(s, 'probe-blood').state;
    expect(s.sides.a.discipline?.progress).toBe(30);
    expect(damage(play(s, 'probe-double'))).toEqual([13, 13]);
    s = end(s);
    hero(s).hp = hero(s).maxHp;
    s = play(play(s, 'probe-blood').state, 'probe-blood').state;
    expect(s.sides.a.discipline?.progress).toBe(60);
    expect(damage(play(s, 'probe-hit'))).toEqual([16]);
  });
  it('prevented HP payments do not create retaliation', () => {
    const s = fight('knight', 'blood-knight');
    hero(s).statuses.buffer = 1;
    expect(play(s, 'probe-blood').state.sides.a.discipline?.progress).toBe(0);
  });
  it('Golemancer multiplies large-machine attacks including Might, caps the bonus and shows the same intent', () => {
    const s = fight('engineer', 'golemancer');
    const u = s.sides.a.units.find((x) => x.kind === 'ally')!;
    u.def = 'siege-engine';
    u.maxHp = u.hp = 100;
    u.statuses.might = 5;
    const shown = viewFor(db, s, 'a').sides.a.units.find((x) => x.id === u.id)!.intentView!;
    expect(shown.damage).toBe(18); // (4 + 5) x 2, on both hits
    const r = applyAction(db, s, { type: 'endTurn' });
    expect(
      r.events
        .filter((e) => e.type === 'damage' && e.source === u.id)
        .map((e) => (e.type === 'damage' ? e.amount : 0)),
    ).toEqual([18, 18]);
    u.def = 'drone';
    expect(viewFor(db, s, 'a').sides.a.units.find((x) => x.id === u.id)!.intentView!.damage).toBe(
      9,
    );
  });
  it('Seer marks a deliberate enemy once per turn and restarts when changing marks', () => {
    let s = fight('trickster', 'seer');
    const first = foe(s).id,
      second = s.sides.b.units[1]!.id;
    let r = play(s, 'probe-double', first);
    expect(damage(r)).toEqual([16, 16]);
    expect(r.state.sides.a.discipline?.progress).toBe(10);
    s = play(r.state, 'probe-hit', second).state;
    expect(s.sides.a.discipline?.target).toBe(first);
    s = end(s);
    r = play(s, 'probe-hit', first);
    expect(damage(r)).toEqual([18]);
    s = end(r.state);
    s = play(s, 'probe-hit', second).state;
    expect(s.sides.a.discipline?.progress).toBe(10);
    expect(s.sides.a.discipline?.target).toBe(second);
  });
  it('Assassin prepares through Skills and executes wounded enemies, without a Dagger passive', () => {
    let s = fight('assassin', 'assassin');
    expect(hero(s).statuses.edge ?? 0).toBe(0);
    for (let i = 0; i < 2; i++) s = play(s, 'probe-skill').state;
    foe(s).hp = foe(s).maxHp / 2;
    let r = play(s, 'probe-double');
    expect(damage(r)).toEqual([15, 15]);
    expect(r.state.sides.a.discipline?.progress).toBe(0);
    r = play(r.state, 'probe-hit');
    expect(damage(r)).toEqual([12]);
  });
  it('preparation caps at 60%, and non-Attack damage does not spend it', () => {
    let s = fight('assassin', 'assassin');
    for (let i = 0; i < 8; i++) s = play(s, 'probe-skill').state;
    expect(s.sides.a.discipline?.progress).toBe(60);
    const modified = {
      ...db,
      cards: {
        ...db.cards,
        'probe-skill-hit': card('probe-skill-hit', [hit()], { target: 'foe' }),
      },
    };
    s.sides.a.hand = [{ id: 'skill-hit', card: 'probe-skill-hit' }];
    s = applyAction(modified, s, { type: 'play', card: 'skill-hit', target: foe(s).id }).state;
    expect(s.sides.a.discipline?.progress).toBe(60);
    expect(damage(play(s, 'probe-hit'))).toEqual([16]);
  });
  it('prepared damage survives a choice between damage effects and save serialization', () => {
    let s = fight('assassin', 'assassin');
    s = play(play(s, 'probe-skill').state, 'probe-skill').state;
    const first = play(s, 'probe-choice');
    expect(damage(first)).toEqual([13]);
    s = JSON.parse(JSON.stringify(first.state)) as CombatState;
    const pick = legalActions(db, s)[0]!;
    expect(pick.type).toBe('pick');
    expect(damage(applyAction(db, s, pick))).toEqual([13]);
  });
  it('Totemist grows Spirit when preserving the row, but not after a command', () => {
    let s = fight('shaman', 'totemist');
    const initial = hero(s).statuses.spirit ?? 0;
    s = end(s);
    expect(hero(s).statuses.spirit).toBe(initial + 1);
    s.sides.a.mana = 3;
    s = play(s, 'spirit-call').state;
    const before = hero(s).statuses.spirit;
    s = end(s);
    expect(hero(s).statuses.spirit).toBe(before);
  });
  it('Elementalist grows each element once per own turn and rewards switching elements', () => {
    let s = fight('shaman', 'elementalist');
    s = play(s, 'probe-flame').state;
    s = play(s, 'probe-flame').state;
    expect(s.sides.a.discipline?.counts?.flame).toBe(1);
    const frost = play(s, 'probe-frost');
    expect(frost.events.some((e) => e.type === 'barrier' && e.amount === 5)).toBe(true);
    s = end(frost.state);
    const flame = play(s, 'probe-flame');
    expect(
      flame.events.some((e) => e.type === 'status' && e.status === 'burn' && e.amount === 6),
    ).toBe(true);
  });
  it('Zealot develops Fury once per turn and rewards only the first controlled exit', () => {
    let s = fight('monk', 'zealot');
    s = play(s, 'probe-fury').state;
    expect(s.sides.a.discipline?.progress).toBe(8);
    let r = play(s, 'probe-calm');
    expect(
      r.events
        .filter((e) => e.type === 'barrier')
        .map((e) => (e.type === 'barrier' ? e.amount : 0)),
    ).toContain(6);
    s = play(r.state, 'probe-fury').state;
    r = play(s, 'probe-calm');
    expect(r.events.filter((e) => e.type === 'barrier')).toHaveLength(0);
    expect(r.state.sides.a.discipline?.progress).toBe(8);
    s = play(end(r.state), 'probe-fury').state;
    expect(s.sides.a.discipline?.progress).toBe(16);
  });
  it('Sunwalker retains increasing Fervor after Radiant exits, with a four-Fervor ceiling', () => {
    let s = fight('monk', 'sunwalker');
    for (let i = 0; i < 5; i++) {
      s = play(s, 'probe-radiant').state;
      s = play(s, 'probe-calm').state;
      expect(s.sides.a.discipline?.progress).toBe(i + 1);
      expect(hero(s).statuses.mantra ?? 0).toBeGreaterThanOrEqual(Math.min(4, 2 + i));
      s = end(s);
      delete hero(s).statuses.mantra;
    }
  });
  it('Sunwalker also returns Fervor when Radiant expires naturally', () => {
    const s = play(fight('monk', 'sunwalker'), 'probe-radiant').state;
    const next = end(s);
    expect(next.sides.a.discipline?.progress).toBe(1);
    expect(hero(next).statuses.mantra ?? 0).toBeGreaterThanOrEqual(2);
    expect(hero(next).statuses.radiant ?? 0).toBe(0);
  });
  it('Archmage boosts only the first paid Spell Attack and refunds half next turn', () => {
    let s = fight('spellblade', 'archmage');
    s.sides.a.stars = 12;
    s.sides.a.hand = [{ id: 'spell-preview', card: 'probe-spell' }];
    const before = hashState(s);
    expect([...previewCardDamage(db, s, 'spell-preview', foe(s).id).values()][0]?.lo).toBe(16);
    expect(hashState(s)).toBe(before);
    let r = applyAction(db, s, { type: 'play', card: 'spell-preview', target: foe(s).id });
    expect(damage(r)).toEqual([16, 16, 16]);
    expect(r.state.sides.a.nextStars).toBe(3);
    r = play(r.state, 'probe-spell');
    expect(damage(r)).toEqual([10, 10, 10]);
    s = end(r.state);
    expect(s.sides.a.stars).toBe(6); // refund 3, class 1 and Archmage's sustained 2
    expect(s.sides.a.nextStars).toBe(0);
  });
  it('Archmage damage support does not also boost Barrier on a Spell Attack', () => {
    const s = fight('spellblade', 'archmage');
    s.sides.a.stars = 6;
    const r = play(s, 'probe-spell-guard');
    expect(damage(r)).toEqual([16]);
    expect(
      r.events
        .filter((e) => e.type === 'barrier')
        .map((e) => (e.type === 'barrier' ? e.amount : 0)),
    ).toEqual([5]);
  });
  it('Brewmaster develops only after actual Hangover payments and caps Fermentation at five', () => {
    let s = fight('drunkard', 'brewmaster');
    for (let i = 0; i < 7; i++) {
      hero(s).hp = hero(s).maxHp;
      hero(s).statuses.hangover = 3;
      s = end(s);
      expect(s.sides.a.discipline?.progress).toBe(Math.min(5, i + 1));
    }
    const progress = s.sides.a.discipline?.progress;
    hero(s).hp = 1;
    hero(s).statuses.hangover = 3;
    s = end(s);
    expect(s.sides.a.discipline?.progress).toBe(progress);
  });
  it('Deathwish has one emergency save, not immunity to later hits, including before its first Arena turn', () => {
    let s = createCombat(db, {
      seed: 'last-stand',
      a: { hero: 'knight', deck: ['probe-hit', 'probe-hit'] },
      b: { hero: 'drunkard', ascendancy: 'drunkard:deathwish', deck: ['probe-hit'] },
    }).state;
    const enemy = hero(s, 'b');
    enemy.hp = 1;
    enemy.barrier = 0;
    const r = play(s, 'probe-hit', enemy.id);
    expect(hero(r.state, 'b').hp).toBe(1);
    expect(r.state.sides.b.discipline?.used).toBe(true);
    s = clone(r.state);
    hero(s, 'b').barrier = 0;
    expect(play(s, 'probe-hit', enemy.id).state.winner).toBe('a');
  });
  it('Deathwish multiplies ordinary Clutch only in the low-HP band and does not stop self-damage', () => {
    let s = fight('drunkard', 'deathwish');
    hero(s).hp = Math.floor(hero(s).maxHp * 0.4);
    // Recompute ordinary Clutch through a real small HP payment.
    s = play(s, 'probe-blood').state;
    const clutch = hero(s).statuses.clutch ?? 0;
    expect(damage(play(s, 'probe-hit'))).toEqual([
      Math.floor(Math.floor((10 * (100 + clutch)) / 100) * 1.25),
    ]);
    hero(s).hp = 1;
    const dead = play(s, 'probe-blood').state;
    expect(dead.winner).toBe('b');
    expect(dead.sides.a.discipline?.used ?? false).toBe(false);
  });
  it('Deathwish rescues hostile Skill damage but not unattributed damage over time', () => {
    const setup = {
      seed: 'last-stand-skill',
      a: { hero: 'knight', deck: ['probe-skill-damage'] },
      b: { hero: 'drunkard', ascendancy: 'drunkard:deathwish', deck: ['probe-hit'] },
    };
    const s = createCombat(db, setup).state;
    const enemy = hero(s, 'b');
    enemy.hp = 1;
    enemy.barrier = 0;
    const r = play(s, 'probe-skill-damage', enemy.id);
    expect(r.state.winner).toBeNull();
    expect(hero(r.state, 'b').hp).toBe(1);
    expect(r.state.sides.b.discipline?.used).toBe(true);
    const bleeding = fight('drunkard', 'deathwish');
    hero(bleeding).hp = 1;
    hero(bleeding).statuses.seared = 1;
    const expired = end(bleeding);
    expect(expired.winner).toBe('b');
    expect(expired.sides.a.discipline?.used ?? false).toBe(false);
  });
  it('Deathwish can rescue an opposing attack overflowing through a companion', () => {
    const s = createCombat(db, {
      seed: 'last-stand-overflow',
      a: { hero: 'knight', deck: ['probe-hit'] },
      b: { hero: 'drunkard', ascendancy: 'drunkard:deathwish', deck: ['probe-hit'] },
    }).state;
    const enemy = hero(s, 'b');
    enemy.hp = 1;
    enemy.barrier = 0;
    s.sides.b.units.unshift({
      ...clone(enemy),
      id: 'overflow-ally',
      kind: 'ally',
      def: 'drone',
      hp: 1,
      maxHp: 1,
      statuses: {},
      taunt: true,
    });
    const r = play(s, 'probe-hit', 'overflow-ally');
    expect(hero(r.state, 'b').hp).toBe(1);
    expect(r.state.sides.b.discipline?.used).toBe(true);
  });
  it('stateful bonuses remain deterministic after JSON save restoration in Arena and PvE', () => {
    for (const mode of ['pve', 'pvp'] as const) {
      let s = fight('assassin', 'assassin');
      s.mode = mode;
      s = play(s, 'probe-skill').state;
      s.sides.a.hand = [{ id: 'deterministic', card: 'probe-double' }];
      const action = { type: 'play' as const, card: 'deterministic', target: foe(s).id };
      const snapshot = JSON.parse(JSON.stringify(s)) as CombatState;
      expect(applyAction(db, s, action)).toEqual(applyAction(db, snapshot, action));
    }
  });
});
