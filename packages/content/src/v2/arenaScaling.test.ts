// The 2026-11-12 Arena scaling pass (DECISIONS #762): the stats that grew all fight with no slowdown now count half past a threshold,
// and three rules that multiplied them are closed (free cards and added cost, Fury outside the Monk, companions acting again).
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CardInst,
  type CombatEvent,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { ascendancyOf, COMBAT_DB as db } from './index';

let n = 0;
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const allies = (s: CombatState): Unit[] => s.sides.a.units.filter((u) => u.kind === 'ally');
const foe = (s: CombatState): Unit => s.sides.b.units[0]!;
function fight(heroId: string, ascendancy?: string): CombatState {
  const s = clone(
    createCombat(db, {
      seed: 'd762',
      a: { hero: heroId, deck: [], ...(ascendancy ? { ascendancy } : {}) },
      b: { enemies: ['squire'] },
    }).state,
  );
  s.sides.a.mana = 20;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 50000;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
function playInst(
  s: CombatState,
  inst: Omit<CardInst, 'id'>,
): { state: CombatState; events: CombatEvent[] } {
  const id = `d762-${n++}`;
  s.sides.a.hand.push({ ...inst, id });
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, inst.card).toBeTruthy();
  return applyAction(db, s, act!);
}
const play = (s: CombatState, card: string): CombatState => playInst(s, { card }).state;
const dealt = (s: CombatState, inst: Omit<CardInst, 'id'>): number => {
  const before = foe(s).hp;
  return before - foe(playInst(s, inst).state).hp;
};

describe('a free card still pays a cost added to its copy', () => {
  it('Bone Crush is free after a Command, but each Replay mark on it costs its Mana', () => {
    let s = fight('necromancer');
    expect(allies(s).length).toBeGreaterThan(0);
    s = play(s, 'off-the-leash');
    const mana = s.sides.a.mana;
    s = playInst(s, { card: 'bone-crush' }).state;
    expect(s.sides.a.mana).toBe(mana);
    s = playInst(s, { card: 'bone-crush', costUp: 2 }).state;
    expect(s.sides.a.mana).toBe(mana - 2);
    s = playInst(s, { card: 'bone-crush', costUp: 2, costDown: 1 }).state;
    expect(s.sides.a.mana).toBe(mana - 3);
  });
});

describe('ceilings on the cards that read a stat with no limit', () => {
  it('Exploit Weakness: 2 per Exposed to +16, half after, at most +32', () => {
    const at = (card: string, exposed: number): number => {
      const s = fight('trickster');
      foe(s).statuses = { exposed };
      return dealt(s, { card });
    };
    // (Exposed itself adds half again)
    expect(at('exploit-weakness', 9)).toBe(Math.round((5 + 16 + 1) * 1.5));
    expect(at('exploit-weakness+', 100)).toBe((8 + 32) * 1.5);
    expect(at('exploit-weakness+', 500)).toBe((8 + 32) * 1.5);
    expect(cardText(db, db.cards['exploit-weakness']!)).toContain('at most +32');
    expect(cardText(db, db.cards['gathering-storm']!)).toContain(
      '(half as much past +12, at most +24)',
    );
    expect(cardText(db, db.cards['off-the-leash']!)).toContain('(half as much past +15)');
  });
  it('Gathering Storm reads its Gather in full to +12, half after, at most +24', () => {
    const at = (bonus: number): number =>
      dealt(fight('shaman'), { card: 'gathering-storm', bonus });
    const base = at(0);
    // (one enemy: the Fork lands as one hit, a quarter more)
    expect(at(12) - base).toBe(Math.round(16 * 1.25) - Math.round(4 * 1.25));
    expect(at(20)).toBe(at(12) + Math.round(4 * 1.25));
    expect(at(36)).toBe(at(500));
    expect(at(500) - base).toBe(Math.round(28 * 1.25) - Math.round(4 * 1.25));
  });
  it('Old Twelve Gauge reads Precision in full to +30, half after, at most +90', () => {
    const at = (bonus: number): number =>
      dealt(fight('drunkard'), { card: 'old-twelve-gauge', bonus });
    expect(at(30)).toBe(Math.round((5 + 30) * 1.25));
    expect(at(42)).toBe(Math.round((5 + 36) * 1.25));
    expect(at(150)).toBe(Math.round((5 + 90) * 1.25));
    expect(at(400)).toBe(at(150));
  });
  it('Slip the Leash doubles Might but gains at most 8 (10 upgraded)', () => {
    const after = (card: string, might: number): number => {
      const s = fight('hunter');
      hero(s).statuses = { might };
      return hero(play(s, card)).statuses.might ?? 0;
    };
    expect(after('slip-the-leash', 3)).toBe(6);
    expect(after('slip-the-leash', 20)).toBe(28);
    expect(after('slip-the-leash+', 20)).toBe(30);
  });
  it('Off the Leash adds half a companion’s HP to +15 and a quarter after', () => {
    const s = fight('necromancer');
    const [first, ...rest] = allies(s);
    expect(first).toBeTruthy();
    s.sides.a.units = s.sides.a.units.filter((u) => !rest.includes(u));
    first!.statuses = {};
    first!.hp = first!.maxHp = 30;
    expect(dealt(clone(s), { card: 'off-the-leash' })).toBe(4 + 15);
    first!.hp = first!.maxHp = 100;
    expect(dealt(clone(s), { card: 'off-the-leash' })).toBe(4 + 15 + Math.floor((50 - 15) / 2));
  });
});

describe('Fury outside the Monk', () => {
  const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
  it('a hero with no stances of their own leaves Fury as their next turn begins', () => {
    let s = play(fight('knight'), 'swift-step');
    expect(hero(s).statuses.wrath).toBe(1);
    s = endTurn(s);
    expect(s.active).toBe('a');
    expect(hero(s).statuses.wrath ?? 0).toBe(0);
  });
  it('the Monk, and a Monk who has ascended, keep it', () => {
    for (const asc of [undefined, 'sunwalker', 'zealot', 'sage']) {
      if (asc) expect(ascendancyOf('monk', `monk:${asc}`), asc).toBeTruthy();
      let s = play(fight('monk', asc ? `monk:${asc}` : undefined), 'swift-step');
      expect(hero(s).statuses.wrath).toBe(1);
      s = endTurn(s);
      expect(hero(s).statuses.wrath, asc ?? 'monk').toBe(1);
    }
  });
});

describe('companions acting again', () => {
  it('the first extra action each turn is in full, every later one for half damage', () => {
    const s = fight('hunter', 'hunter:beastmaster');
    const pack = allies(s);
    expect(pack.length).toBeGreaterThan(0);
    // (Pack Frenzy: 3 Might, then the companions act twice)
    const { events } = playInst(s, { card: 'pack-frenzy' });
    const hits = events.flatMap((e) =>
      e.type === 'damage' && e.source === pack[0]!.id ? [e.lost] : [],
    );
    expect(hits.length).toBeGreaterThanOrEqual(2);
    const perAct = hits.length / 2;
    const first = hits.slice(0, perAct).reduce((a, b) => a + b, 0);
    const second = hits.slice(perAct).reduce((a, b) => a + b, 0);
    expect(first).toBeGreaterThan(0);
    expect(second).toBe(hits.slice(0, perAct).reduce((a, b) => a + Math.round(b / 2), 0));
    // (the whole hit is halved, Might and Sapped with it: a base of 4 with 1 Might and 3 Sapped hits for 2, then 1)
    const t = fight('hunter', 'hunter:beastmaster');
    hero(t).statuses = {};
    for (const u of allies(t)) u.statuses = { sapped: 3 };
    const again = playInst(t, { card: 'pack-frenzy' }).events.flatMap((e) =>
      e.type === 'damage' && e.source === allies(t)[0]!.id ? [e.lost] : [],
    );
    expect(again.slice(perAct).every((x, i) => x === Math.round(again[i]! / 2))).toBe(true);
    expect(cardText(db, db.cards['pack-frenzy']!)).toContain('they deal half damage');
  });
  it('a card that makes nobody act is not counted', () => {
    let s = fight('hunter', 'hunter:beastmaster');
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    s = play(s, 'pack-frenzy');
    expect(s.sides.a.extraActs ?? 0).toBe(0);
  });
  it('the count starts again each turn', () => {
    let s = fight('hunter', 'hunter:beastmaster');
    s = play(s, 'pack-frenzy');
    expect(s.sides.a.extraActs).toBe(2);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.active).toBe('a');
    expect(s.sides.a.extraActs ?? 0).toBe(0);
  });
});

describe('the Beastmaster shares the first 6 Might in full, half of the rest and at most 14 (#767)', () => {
  it('a tall stack passes on less, and a new companion arrives with the same share', () => {
    let s = fight('hunter', 'hunter:beastmaster');
    hero(s).statuses = {};
    for (const u of allies(s)) u.statuses = {};
    s = playInst(s, { card: 'the-hunger' }).state;
    const might = hero(s).statuses.might ?? 0;
    expect(might).toBeGreaterThan(0);
    // (at most 14 in all since #767)
    const share = (m: number): number => Math.min(14, m > 6 ? 6 + Math.floor((m - 6) / 2) : m);
    expect(allies(s)[0]!.statuses.might ?? 0).toBe(share(might));
    hero(s).statuses.might = 20;
    for (const u of allies(s)) u.statuses.might = share(20);
    s = play(s, 'slip-the-leash');
    expect(hero(s).statuses.might).toBe(28);
    // (6 + 11 would be 17: held at the maximum, #767)
    expect(share(28)).toBe(14);
    expect(allies(s)[0]!.statuses.might).toBe(14);
  });
});

describe('answers to curses (#763)', () => {
  it('Shake It Off, Steady Nerves and Purging Light Hold once upgraded, and keep their numbers', () => {
    for (const id of ['shrug-it-off', 'steady-nerves', 'purging-light']) {
      expect(db.cards[id]!.retain ?? false, id).toBe(false);
      expect(db.cards[id + '+']!.retain, id).toBe(true);
      expect(cardText(db, db.cards[id + '+']!)).toContain('Hold.');
    }
    expect(cardText(db, db.cards['shrug-it-off+']!)).toContain('Gain 7 Barrier');
    expect(cardText(db, db.cards['steady-nerves+']!)).toContain('Gain 9 Barrier');
    expect(cardText(db, db.cards['purging-light+']!)).toContain('Gain 11 Barrier');
  });
});
