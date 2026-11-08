import { describe, expect, it } from 'vitest';
import { applyAction, createCombat, heroOf, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db } from './index';

const setup = (hero: string, ascendancy?: string) => {
  const s = createCombat(db, {
    seed: 'balance-revision',
    a: { hero, deck: [], ...(ascendancy ? { ascendancy } : {}) },
    b: { hero: 'knight', deck: [], hp: 10000, maxHp: 10000 },
  }).state;
  s.sides.a.mana = 50;
  return s;
};
let next = 0;
const play = (s: CombatState, card: string, target?: string) => {
  const id = `revision-${next++}`;
  s.sides.a.hand.push({ id, card });
  const action = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(action, card).toBeTruthy();
  return applyAction(db, s, action!).state;
};
const round = (s: CombatState) =>
  applyAction(db, applyAction(db, s, { type: 'endTurn' }).state, { type: 'endTurn' }).state;

describe('simulation-led balance revision', () => {
  it('Blood Oath shares its payment and Reserve allowance across base/upgraded copies and resets next own turn', () => {
    let s = setup('knight');
    s.sides.a.reserves = 0;
    const hp = heroOf(s.sides.a)!.hp;
    s = play(s, 'blood-oath');
    expect(s.sides.a.reserves).toBe(3);
    expect(heroOf(s.sides.a)!.hp).toBe(hp - 3);
    s.sides.a.reserves = 0;
    s = play(s, 'blood-oath+');
    expect(s.sides.a.reserves).toBe(0);
    expect(heroOf(s.sides.a)!.hp).toBe(hp - 3);
    s = round(s);
    s.sides.a.reserves = 0;
    const before = heroOf(s.sides.a)!.hp;
    s = play(s, 'blood-oath+');
    expect(s.sides.a.reserves).toBe(3);
    expect(heroOf(s.sides.a)!.hp).toBe(before - 2);
  });

  it('Marshal gains a Reserve each own turn, within the four-Reserve limit', () => {
    let s = setup('knight', 'knight:marshal');
    expect(s.sides.a.reserves).toBe(2);
    s.sides.a.mana = 0;
    s.sides.a.reserves = 0;
    s = round(s);
    expect(s.sides.a.reserves).toBe(1);
    s = round(s);
    expect(s.sides.a.reserves).toBe(4);
  });

  it('Golemancer guards the hero from living companion max HP after growth, with a capped shield and uncapped HP', () => {
    let s = setup('engineer', 'engineer:golemancer');
    const ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.hp = ally.maxHp = 160;
    s = round(s);
    expect(s.sides.a.units.find((u) => u.id === ally.id)!.maxHp).toBe(164); // 3 growth + the base class's healing growth
    expect(heroOf(s.sides.a)!.barrier).toBe(12);
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero');
    s = round(s);
    expect(heroOf(s.sides.a)!.barrier).toBe(0);
  });

  it("Bulwark Frame shields both the selected machine and its hero from that machine's max HP", () => {
    let s = setup('engineer');
    const ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.hp = ally.maxHp = 160;
    s = play(s, 'bulwark-frame', ally.id);
    expect(heroOf(s.sides.a)!.barrier).toBe(40);
    expect(s.sides.a.units.find((u) => u.id === ally.id)!.barrier).toBe(40);
    s = play(s, 'bulwark-frame+', ally.id);
    expect(heroOf(s.sides.a)!.barrier).toBe(83);
  });

  it('Swarmwright grants protection for three successful summons, not a fourth, and resets next turn', () => {
    let s = setup('engineer', 'engineer:swarmwright');
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero');
    heroOf(s.sides.a)!.barrier = 0;
    for (let i = 0; i < 4; i++) s = play(s, 'spare-parts');
    expect(heroOf(s.sides.a)!.barrier).toBe(9);
    s = round(s);
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero');
    s = play(s, 'spare-parts');
    expect(heroOf(s.sides.a)!.barrier).toBe(3);
  });

  it.each([
    ['restless-spirits', 15, 6],
    ['restless-spirits+', 24, 8],
  ] as const)(
    '%s pays full scaling for three souls per turn and keeps a smaller later payoff',
    (card, total, nextHit) => {
      let s = play(setup('necromancer'), card);
      const before = heroOf(s.sides.b)!.hp;
      for (let i = 0; i < 6; i++) s = play(s, 'gravesoul');
      expect(before - heroOf(s.sides.b)!.hp).toBe(total);
      s = round(s);
      const later = heroOf(s.sides.b)!.hp;
      s = play(s, 'gravesoul');
      expect(later - heroOf(s.sides.b)!.hp).toBe(nextHit);
    },
  );

  it('Spiritwalker gains Spirit once on ordered commands, while cultivation remains a separate identity', () => {
    let s = setup('shaman', 'shaman:spiritwalker');
    const before = heroOf(s.sides.a)!.statuses.spirit ?? 0;
    s = play(s, 'spirit-call');
    expect(heroOf(s.sides.a)!.statuses.spirit).toBe(before + 1);
    s = play(s, 'spirit-call');
    expect(heroOf(s.sides.a)!.statuses.spirit).toBe(before + 1);
  });

  // (2 Mana since #689: only the healthiest companion strikes; 16 + 1.5x its max HP upgraded since #691)
  it('The Drowned King+ spends two Mana while preserving its complete max-HP command payoff', () => {
    let s = setup('necromancer');
    const ally = s.sides.a.units.find((u) => u.kind === 'ally')!;
    ally.hp = ally.maxHp = 20;
    s.sides.a.mana = 2;
    const before = heroOf(s.sides.b)!.hp;
    s = play(s, 'the-drowned-king+', heroOf(s.sides.b)!.id);
    expect(s.sides.a.mana).toBe(0);
    expect(before - heroOf(s.sides.b)!.hp).toBe(46); // (16 + 1.5 x its max HP since #691)
  });

  it.each([
    ['link-up', 6],
    ['link-up+', 8],
    ['pack-tactics', 4],
    ['pack-tactics+', 6],
  ] as const)('%s protects the hero and companion immediately', (card, amount) => {
    let s = setup(card.startsWith('link') ? 'engineer' : 'hunter');
    s = play(s, card);
    expect(s.sides.a.units.map((u) => u.barrier)).toEqual([amount, amount]);
  });

  it.each([
    ['heavy-industry', 4],
    ['heavy-industry+', 6],
    // (3 / 4 since #693)
    ['pack-bond', 3],
    ['pack-bond+', 4],
  ] as const)('%s costs one Mana and gives its shield next turn, not on play', (card, amount) => {
    let s = setup(card.startsWith('heavy') ? 'engineer' : 'hunter');
    s.sides.a.mana = 1;
    s = play(s, card);
    expect(s.sides.a.mana).toBe(0);
    expect(heroOf(s.sides.a)!.barrier).toBe(0);
    s = round(s);
    expect(heroOf(s.sides.a)!.barrier).toBe(amount);
  });

  it.each(['bloodburst', 'bloodburst+'])(
    '%s spends two Mana and still ticks Bleed immediately',
    (card) => {
      let s = setup('assassin');
      s.sides.a.mana = 2;
      const before = heroOf(s.sides.b)!.hp;
      s = play(s, card);
      expect(s.sides.a.mana).toBe(0);
      expect(before - heroOf(s.sides.b)!.hp).toBe(card.endsWith('+') ? 12 : 9);
    },
  );

  it('Drago opens with a setup intent; the smaller Ward grants Primed without permanent Might growth', () => {
    let s = createCombat(db, {
      seed: 'revision-vorthax',
      a: { hero: 'engineer', deck: [], hp: 10000, maxHp: 10000 },
      b: { enemies: ['rift-ward', 'vorthax'], tier: 1, hpPct: 850, dmgPct: 185 },
    }).state;
    const ward = s.sides.b.units.find((u) => u.def === 'rift-ward')!;
    expect(ward.maxHp).toBe(128);
    expect(s.sides.b.units.find((u) => u.def === 'vorthax')!.intent?.move).toBe('call-pyrewing');
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.b.units.some((u) => u.def === 'rift-ward')).toBe(false);
    expect(s.sides.b.units.some((u) => u.def === 'pyrewing-incarnation')).toBe(true);
    expect(s.sides.b.units.find((u) => u.def === 'vorthax')!.statuses.might ?? 0).toBe(0);
    expect(s.sides.b.units.find((u) => u.def === 'vorthax')!.statuses.vigor).toBe(1);
  });
});
