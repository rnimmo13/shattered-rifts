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
import { ASCENDANCIES } from './ascendancies';

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
    'probe-knife': card('probe-knife', [hit()], { kind: 'attack', target: 'foe', tags: ['knife'] }),
    'probe-sword': card('probe-sword', [hit()], { kind: 'attack', target: 'foe', tags: ['sword'] }),
    'probe-trap': card('probe-trap', [{ op: 'damage', amount: 10, to: 'allFoes' }], {
      kind: 'snare',
      trigger: { on: 'foeTurn' },
    }),
    // (a Trap these enemies never spring: they summon nothing)
    'probe-quiet-trap': card('probe-quiet-trap', [{ op: 'damage', amount: 10, to: 'allFoes' }], {
      kind: 'snare',
      trigger: { on: 'foeSummons' },
    }),
    'probe-expose': card('probe-expose', [{ op: 'status', status: 'exposed', amount: 1, to: 'target' }], {
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
    // (two Skills are 40% since #767, 30% before, and 20% for the wounded enemy: 10 x 1.6)
    let r = play(s, 'probe-double');
    expect(damage(r)).toEqual([16, 16]);
    expect(r.state.sides.a.discipline?.progress).toBe(0);
    r = play(r.state, 'probe-hit');
    expect(damage(r)).toEqual([12]);
  });
  it('preparation is 20% a Skill and caps at 100% (#767; 15% and 60% before), and non-Attack damage does not spend it', () => {
    let s = fight('assassin', 'assassin');
    for (let i = 0; i < 8; i++) s = play(s, 'probe-skill').state;
    expect(s.sides.a.discipline?.progress).toBe(100);
    const modified = {
      ...db,
      cards: {
        ...db.cards,
        'probe-skill-hit': card('probe-skill-hit', [hit()], { target: 'foe' }),
      },
    };
    s.sides.a.hand = [{ id: 'skill-hit', card: 'probe-skill-hit' }];
    s = applyAction(modified, s, { type: 'play', card: 'skill-hit', target: foe(s).id }).state;
    expect(s.sides.a.discipline?.progress).toBe(100);
    expect(damage(play(s, 'probe-hit'))).toEqual([20]);
  });
  it('prepared damage survives a choice between damage effects and save serialization', () => {
    let s = fight('assassin', 'assassin');
    s = play(play(s, 'probe-skill').state, 'probe-skill').state;
    // (two Skills: 40% since #767, 30% before)
    const first = play(s, 'probe-choice');
    expect(damage(first)).toEqual([14]);
    s = JSON.parse(JSON.stringify(first.state)) as CombatState;
    const pick = legalActions(db, s)[0]!;
    expect(pick.type).toBe('pick');
    expect(damage(applyAction(db, s, pick))).toEqual([14]);
  });
  it('Spiritwalker cards deal 5% more per Spirit, up to 50%, Attacks and spells alike', () => {
    let s = fight('shaman', 'spiritwalker');
    hero(s).statuses.spirit = 4;
    expect(damage(play(s, 'probe-hit'))).toEqual([12]);
    s = fight('shaman', 'spiritwalker');
    hero(s).statuses.spirit = 4;
    expect(damage(play(s, 'probe-skill-damage'))).toEqual([12]);
    // (capped at +50%, however much Spirit)
    s = fight('shaman', 'spiritwalker');
    hero(s).statuses.spirit = 30;
    expect(damage(play(s, 'probe-hit'))).toEqual([15]);
    // (a plain Shaman's cards do not grow with Spirit)
    s = fight('shaman', 'totemist');
    hero(s).statuses.spirit = 4;
    expect(damage(play(s, 'probe-hit'))).toEqual([10]);
  });
  it('Spiritwalker draws 1 and gains 1 Spirit on the first ordered command of the turn only', () => {
    let s = fight('shaman', 'spiritwalker');
    s.sides.a.mana = 9;
    const spirit = hero(s).statuses.spirit ?? 0;
    const hand = s.sides.a.hand.length;
    s = play(s, 'spirit-call').state;
    expect(hero(s).statuses.spirit).toBe(spirit + 1);
    // (the card played left the hand; one card was drawn)
    expect(s.sides.a.hand.length).toBe(hand + 1);
    s = play(s, 'spirit-call').state;
    expect(hero(s).statuses.spirit).toBe(spirit + 1);
    expect(s.sides.a.hand.length).toBe(hand + 1);
  });
  it('Totemist starts with five totem positions, all planted: Hawk, Bear, Thunderbird, Hawk, Bear', () => {
    const s = fight('shaman', 'totemist');
    expect(s.sides.a.totems).toEqual(['hawk', 'bear', 'thunderbird', 'hawk', 'bear']);
    // (the plain Shaman keeps three)
    expect(fight('shaman', 'shaman').sides.a.totems).toEqual(['hawk', 'bear', 'thunderbird']);
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
    // (#766: Frost 3 + 3 for the switch from Flame; 3 + 2 before)
    const frost = play(s, 'probe-frost');
    expect(frost.events.some((e) => e.type === 'barrier' && e.amount === 6)).toBe(true);
    s = end(frost.state);
    // (#766: Flame 4 + 2 for its one earlier trigger + 3 for the switch from Frost; 3 + 1 + 2 before)
    const flame = play(s, 'probe-flame');
    expect(
      flame.events.some((e) => e.type === 'status' && e.status === 'burn' && e.amount === 9),
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
  it('Brewmaster develops only after actual Hangover payments and caps Fermentation at eight (#695)', () => {
    let s = fight('drunkard', 'brewmaster');
    for (let i = 0; i < 10; i++) {
      hero(s).hp = hero(s).maxHp;
      hero(s).statuses.hangover = 3;
      s = end(s);
      expect(s.sides.a.discipline?.progress).toBe(Math.min(8, i + 1));
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
    // (paying 8 lands it on 40%: below that the bonus grows on, DECISIONS #685)
    hero(s).hp = Math.floor(hero(s).maxHp * 0.4) + 8;
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

describe('the 0.228 Ascendancy pass (DECISIONS #685)', () => {
  it('Totemist starts with no extra Spirit or Barrier, and Cultivation stops after 5 Spirit', () => {
    let s = fight('shaman', 'totemist');
    const start = fight('shaman', 'shaman');
    expect(hero(s).statuses.spirit ?? 0).toBe(hero(start).statuses.spirit ?? 0);
    expect(hero(s).barrier).toBe(hero(start).barrier);
    const initial = hero(s).statuses.spirit ?? 0;
    for (let k = 0; k < 8; k++) s = end(end(s));
    expect(s.sides.a.discipline?.progress).toBe(5);
    // (Spirit from Cultivation only: the Hawks' and the trait's own gains are separate)
    expect(hero(s).statuses.spirit ?? 0).toBeGreaterThanOrEqual(initial + 5);
    const at = hero(s).statuses.spirit ?? 0;
    s = end(end(s));
    expect(s.sides.a.discipline?.progress).toBe(5);
    expect(hero(s).statuses.spirit ?? 0).toBeLessThanOrEqual(at);
  });
  it('Artillerist gains 3 Might on each of its first 8 turns, 24 in all (#767; 5 turns and 15 since #726)', () => {
    let s = fight('engineer', 'artillerist');
    expect(hero(s).statuses.might).toBe(3);
    for (let k = 0; k < 9; k++) s = end(end(s));
    expect(hero(s).statuses.might).toBe(24);
  });
  it('Paladin gains 1 Might at the start of each of its first 10 turns and none after (#767)', () => {
    const plain = createCombat(db, {
      seed: 'ascendancy-scaling',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['probe-wall', 'probe-wall'] },
    }).state;
    const base = hero(plain).statuses.might ?? 0;
    let s = fight('knight', 'paladin');
    for (let turn = 1; turn <= 13; turn++) {
      expect(s.active).toBe('a');
      expect(hero(s).statuses.might ?? 0, `turn ${turn}`).toBe(base + Math.min(10, turn));
      s = end(s);
    }
  });
  it('Paladin deals a quarter of its Barrier, rounded down, to a random enemy as its turn ends; Might adds nothing (#767)', () => {
    const blow = (barrier: number, might?: number, reserves = 0): number[] => {
      const s = fight('knight', 'paladin');
      // (no Mana left to keep: the Knight's Reserves give Barrier of their own as the turn ends)
      s.sides.a.mana = 0;
      s.sides.a.reserves = reserves;
      hero(s).barrier = barrier;
      if (might !== undefined) hero(s).statuses.might = might;
      const before = s.sides.b.units.map((u) => u.hp);
      const r = applyAction(db, s, { type: 'endTurn' });
      const lost = r.state.sides.b.units.map((u, k) => before[k]! - u.hp);
      // (every blow in the turn's events is the hero's, and it lands before the enemy phase)
      const hits = r.events.flatMap((e) => (e.type === 'damage' ? [e] : []));
      expect(hits.every((e) => e.source === hero(s).id)).toBe(true);
      expect(hits.map((e) => e.lost)).toEqual(lost.filter((x) => x > 0));
      const theirs = r.events.findIndex((e) => e.type === 'turnStart' && e.side === 'b');
      for (const e of hits) expect(r.events.indexOf(e)).toBeLessThan(theirs);
      return lost.sort((x, y) => x - y);
    };
    // (one enemy of the two takes it all)
    expect(blow(40)).toEqual([0, 10]);
    expect(blow(43)).toEqual([0, 10]);
    expect(blow(10)).toEqual([0, 2]);
    expect(blow(4)).toEqual([0, 1]);
    // (nothing with no Barrier, or with less than 4)
    expect(blow(0)).toEqual([0, 0]);
    expect(blow(3)).toEqual([0, 0]);
    // (not an Attack: Might does not change it)
    expect(blow(40, 0)).toEqual([0, 10]);
    expect(blow(40, 50)).toEqual([0, 10]);
    // (the Barrier the Knight's Reserves give as the turn ends comes first and counts: 41 + 3 is 44)
    expect(blow(41)).toEqual([0, 10]);
    expect(blow(41, undefined, 3)).toEqual([0, 11]);
    // (the plain Knight has none of it)
    const plain = createCombat(db, {
      seed: 'ascendancy-scaling',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['probe-wall', 'probe-wall'] },
    }).state;
    hero(plain).barrier = 40;
    const hp = plain.sides.b.units.map((u) => u.hp);
    expect(end(plain).sides.b.units.map((u) => u.hp)).toEqual(hp);
  });
  it('Trapmaster sets up to 5 Traps, and its Traps deal 5% more per Trap sprung before, up to 50%', () => {
    const s = fight('trickster', 'trapmaster');
    const can = (n: number, st: CombatState): boolean => {
      const t = clone(st);
      t.sides.a.mana = 9;
      t.sides.a.snares = Array.from({ length: n }, (_, k) => ({ id: `set-${k}`, card: 'probe-trap' }));
      t.sides.a.hand.push({ id: 'next-trap', card: 'probe-trap' });
      return legalActions(db, t).some((x) => x.type === 'play' && x.card === 'next-trap');
    };
    expect(can(4, s)).toBe(true);
    expect(can(5, s)).toBe(false);
    expect(viewFor(db, s, 'a').sides.a.snareCap).toBe(5);
    // (the plain Trickster keeps three)
    expect(can(3, fight('trickster', 'cardsharp'))).toBe(false);
    const spring = (sprung: number): number => {
      const t = clone(s);
      t.sides.a.snaresSprung = sprung;
      t.sides.a.snares = [{ id: 'live-trap', card: 'probe-trap' }];
      const hp = foe(t).hp;
      return hp - foe(end(t)).hp;
    };
    // (10% a Trap sprung before it, up to double, since #694; and since #766 the one Trap still set as the turn ends deals 4 first,
    // which the Trap bonus does not touch)
    expect(spring(0)).toBe(4 + 10);
    expect(spring(4)).toBe(4 + 14);
    expect(spring(30)).toBe(4 + 20);
  });
  it('Trapmaster deals 4 to every enemy for each Trap set as its turn ends, and nothing with none set (#766)', () => {
    const lost = (traps: number, sprung = 0, might = 0): number[] => {
      const s = fight('trickster', 'trapmaster');
      s.sides.a.snaresSprung = sprung;
      if (might) hero(s).statuses.might = might;
      s.sides.a.snares = Array.from({ length: traps }, (_, k) => ({
        id: `quiet-${k}`,
        card: 'probe-quiet-trap',
      }));
      const before = s.sides.b.units.map((u) => u.hp);
      const r = applyAction(db, s, { type: 'endTurn' });
      // (the Traps wait for a summon that never comes: every one is still set)
      expect(r.state.sides.a.snares).toHaveLength(traps);
      // (it comes from the hero, as their turn ends: before the enemy phase begins)
      const hurt = r.events.findIndex((e) => e.type === 'damage');
      const theirs = r.events.findIndex((e) => e.type === 'turnStart' && e.side === 'b');
      if (traps) {
        expect(hurt).toBeGreaterThanOrEqual(0);
        expect(hurt).toBeLessThan(theirs);
        expect(damage(r)).toEqual(s.sides.b.units.map(() => 4 * traps));
      } else expect(hurt).toBe(-1);
      return r.state.sides.b.units.map((u, k) => before[k]! - u.hp);
    };
    expect(lost(0)).toEqual([0, 0]);
    expect(lost(1)).toEqual([4, 4]);
    expect(lost(3)).toEqual([12, 12]);
    expect(lost(5)).toEqual([20, 20]);
    // (it is not a Trap and not an Attack: Traps sprung before and Might add nothing)
    expect(lost(2, 30)).toEqual([8, 8]);
    expect(lost(2, 0, 7)).toEqual([8, 8]);
    // (the plain Trickster's other Ascendancy has none of it)
    const other = fight('trickster', 'cardsharp');
    other.sides.a.snares = [{ id: 'quiet-0', card: 'probe-quiet-trap' }];
    const hp = foe(other).hp;
    expect(foe(end(other)).hp).toBe(hp);
  });
  it('Bladedancer Daggers ramp 0/10/20/30/40/50% within a turn and start over next turn', () => {
    let s = fight('assassin', 'bladedancer');
    s.sides.a.mana = 9;
    const got: number[] = [];
    for (let k = 0; k < 7; k++) {
      const r = play(s, 'probe-knife');
      got.push(...damage(r));
      s = r.state;
    }
    expect(got).toEqual([10, 11, 12, 13, 14, 15, 15]);
    s.sides.a.hand = [{ id: 'preview-knife', card: 'probe-knife' }];
    expect([...previewCardDamage(db, s, 'preview-knife', foe(s).id).values()][0]?.lo).toBe(15);
    // (other Attacks do not ramp or gain)
    expect(damage(play(s, 'probe-hit'))).toEqual([10]);
    s = end(end(s));
    expect(damage(play(s, 'probe-knife'))).toEqual([10]);
  });
  it('Blademaster starts with 2 Keen and gains 2 from its first Sword each turn, six times, up to 14 Keen (#766; 1 and 1 up to 5 before)', () => {
    let s = fight('spellblade', 'blademaster');
    expect(hero(s).statuses.keen).toBe(2);
    s = play(s, 'probe-sword').state;
    s = play(s, 'probe-sword').state;
    // (2 + 2: the second Sword of the turn gives none)
    expect(hero(s).statuses.keen).toBe(4);
    // (five more turns give 2 each, the seventh turn's Sword none: 2 + 6 x 2)
    for (let k = 0; k < 5; k++) s = play(end(end(s)), 'probe-sword').state;
    expect(hero(s).statuses.keen).toBe(14);
    s = play(end(end(s)), 'probe-sword').state;
    expect(hero(s).statuses.keen).toBe(14);
  });
  it('Cardsharp Full Tricks give 1 Mana and 3 Might, eight times a fight (#766; 2 Might six times since #694)', () => {
    const [mana, might] = ASCENDANCIES.find((x) => x.id === 'trickster:cardsharp')?.triggers ?? [];
    // (the Mana every Full Trick; only the Might stops after eight)
    expect(mana?.when).toBe('allSuits');
    expect(mana?.times).toBeUndefined();
    expect(mana?.ops).toEqual([{ op: 'mana', amount: 1 }]);
    expect(might?.when).toBe('allSuits');
    expect(might?.times).toBe(8);
    expect(might?.ops).toEqual([{ op: 'status', status: 'might', amount: 3, to: 'self' }]);
  });
  it('Predator gains 1 Might with the card it draws for the first Exposed it applies each turn, ten times a fight (#766)', () => {
    let s = fight('hunter', 'predator');
    const start = hero(s).statuses.might ?? 0;
    const expose = (st: CombatState): CombatState => {
      // (room in hand, so the card drawn always arrives)
      st.sides.a.discard.push(...st.sides.a.hand);
      st.sides.a.hand = [];
      return play(st, 'probe-expose').state;
    };
    for (let turn = 1; turn <= 12; turn++) {
      const earned = Math.min(10, turn);
      s = expose(s);
      expect(hero(s).statuses.might ?? 0, `turn ${turn}, first Exposed`).toBe(start + earned);
      // (the card played left the hand; the draw goes on after the Might has stopped)
      expect(s.sides.a.hand, `turn ${turn}, the draw`).toHaveLength(1);
      // (a second Exposed the same turn, on the other enemy: no Might and no card)
      s.sides.a.hand.push({ id: `second-${turn}`, card: 'probe-expose' });
      s = applyAction(db, s, {
        type: 'play',
        card: `second-${turn}`,
        target: s.sides.b.units[1]!.id,
      }).state;
      expect(hero(s).statuses.might ?? 0, `turn ${turn}, second Exposed`).toBe(start + earned);
      expect(s.sides.a.hand, `turn ${turn}, no second draw`).toHaveLength(1);
      s = end(s);
      expect(s.active).toBe('a');
    }
    expect(hero(s).statuses.might ?? 0).toBe(start + 10);
  });
  it('Reaver Bloodlust (#693, #726): every 3 HP paid is 1 Might for the fight, up to 12, at most 2 a turn', () => {
    let s = fight('hunter', 'reaver');
    const might = hero(s).statuses.might ?? 0;
    hero(s).hp = hero(s).maxHp = 500;
    // (8 HP paid: 2 Might; more the same turn is owed, not given)
    s = play(s, 'probe-blood').state;
    expect(hero(s).statuses.might ?? 0).toBe(might + 2);
    for (let i = 0; i < 10; i++) s = play(s, 'probe-blood').state;
    expect(hero(s).statuses.might ?? 0).toBe(might + 2);
    // (what is owed arrives with a payment on a later turn, 2 a turn, and stops at 12)
    for (let turn = 0; turn < 4; turn++) {
      s.turn += 1;
      s = play(s, 'probe-blood').state;
      expect(hero(s).statuses.might ?? 0).toBe(might + 4 + 2 * turn);
    }
    for (let turn = 0; turn < 6; turn++) {
      s.turn += 1;
      s = play(s, 'probe-blood').state;
    }
    expect(hero(s).statuses.might ?? 0).toBe(might + 12);
  });
  let uniq = 0;
  // (an id no other card has, so a later turn never plays an older copy)
  const playOne = (s: CombatState, id: string): CombatState => {
    const inst = { id: `monk-${uniq++}`, card: id };
    s.sides.a.hand.push(inst);
    return applyAction(db, s, { type: 'play', card: inst.id }).state;
  };
  it('Sage draws on leaving Serene and grows Enlightenment: Might for 5 exits, Bracing for 3', () => {
    const run = (asc: string, turns: number) => {
      let s = fight('monk', asc);
      let drawn = 0;
      for (let k = 0; k < turns; k++) {
        s.sides.a.mana = 9;
        // (room in hand, and cards to draw; no Fervor, so Radiant never takes it out of Serene first)
        delete hero(s).statuses.mantra;
        s.sides.a.discard.push(...s.sides.a.hand);
        s.sides.a.hand = [];
        if (k > 0) s = playOne(s, 'probe-calm');
        const hand = s.sides.a.hand.length;
        s = playOne(s, 'probe-fury');
        drawn += s.sides.a.hand.length - hand;
        s = end(end(s));
      }
      return { s, drawn };
    };
    const sage = run('sage', 7);
    const zealot = run('zealot', 7);
    expect((hero(sage.s).statuses.might ?? 0) - (hero(zealot.s).statuses.might ?? 0)).toBe(5);
    expect(hero(sage.s).statuses.bracing).toBe(3);
    expect(hero(zealot.s).statuses.bracing ?? 0).toBe(0);
    // (the card played left the hand; Sage drew one each turn, Zealot none)
    expect(sage.drawn - zealot.drawn).toBe(7);
  });
  it('Sunwalker Dawn: the first 5 Radiant entries each give 1 Might (#726; was 2)', () => {
    const run = (asc: string) => {
      let s = fight('monk', asc);
      for (let k = 0; k < 7; k++) {
        s.sides.a.mana = 9;
        s = end(end(playOne(s, 'probe-radiant')));
      }
      return hero(s).statuses.might ?? 0;
    };
    expect(run('sunwalker') - run('zealot')).toBe(5);
  });
  it('Deathwish keeps growing below 40% HP, to +50% at 10% HP (#695)', () => {
    const at = (pct: number): number => {
      const s = fight('drunkard', 'deathwish');
      hero(s).hp = Math.floor((hero(s).maxHp * pct) / 100);
      hero(s).statuses.clutch = 0;
      return damage(play(s, 'probe-double'))[0] ?? 0;
    };
    expect(at(40)).toBe(13);
    expect(at(25)).toBe(14);
    expect(at(10)).toBe(15);
    expect(at(5)).toBe(15);
  });
});
