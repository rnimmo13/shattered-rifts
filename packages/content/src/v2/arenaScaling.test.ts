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
/** The hero gains `might` Might the way cards give it, one real play at a time (Open a Vein: 2, Blood Tithe: 1), so the share is the
 * engine's own. HP is topped up, as both cost some. */
function giveMight(s: CombatState, might: number): CombatState {
  let t = s;
  for (let left = might; left > 0; ) {
    hero(t).hp = hero(t).maxHp;
    const card = left >= 2 ? 'open-a-vein' : 'blood-tithe';
    const had = hero(t).statuses.might ?? 0;
    t = play(t, card);
    const got = (hero(t).statuses.might ?? 0) - had;
    expect(got, card).toBeGreaterThan(0);
    left -= got;
  }
  expect(hero(t).statuses.might ?? 0).toBe(might);
  return t;
}
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
      '(half as much past +8, at most +18)',
    );
    expect(cardText(db, db.cards['off-the-leash']!)).toContain('(half as much past +10)');
  });
  it('Gathering Storm reads its Gather in full to +8, half after, at most +18 (#768; +12 and +24 before)', () => {
    const at = (bonus: number): number =>
      dealt(fight('shaman'), { card: 'gathering-storm', bonus });
    const base = at(0);
    // (one enemy: the Fork lands as one hit, a quarter more)
    expect(at(8) - base).toBe(Math.round(12 * 1.25) - Math.round(4 * 1.25));
    expect(at(16)).toBe(at(8) + Math.round(4 * 1.25));
    expect(at(28)).toBe(at(500));
    expect(at(500) - base).toBe(Math.round(22 * 1.25) - Math.round(4 * 1.25));
  });
  it('Old Twelve Gauge reads Precision in full to +20, half after, at most +70 (#768; +30 and +90 before)', () => {
    const at = (bonus: number): number =>
      dealt(fight('drunkard'), { card: 'old-twelve-gauge', bonus });
    expect(at(20)).toBe(Math.round((5 + 20) * 1.25));
    expect(at(32)).toBe(Math.round((5 + 26) * 1.25));
    expect(at(120)).toBe(Math.round((5 + 70) * 1.25));
    expect(at(400)).toBe(at(120));
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
  it('Off the Leash adds half a companion’s HP to +10 and a quarter after (#768; +15 before)', () => {
    const s = fight('necromancer');
    const [first, ...rest] = allies(s);
    expect(first).toBeTruthy();
    s.sides.a.units = s.sides.a.units.filter((u) => !rest.includes(u));
    first!.statuses = {};
    first!.hp = first!.maxHp = 20;
    expect(dealt(clone(s), { card: 'off-the-leash' })).toBe(4 + 10);
    first!.hp = first!.maxHp = 30;
    expect(dealt(clone(s), { card: 'off-the-leash' })).toBe(4 + 10 + Math.floor((15 - 10) / 2));
    first!.hp = first!.maxHp = 100;
    expect(dealt(clone(s), { card: 'off-the-leash' })).toBe(4 + 10 + Math.floor((50 - 10) / 2));
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

describe('the Beastmaster shares half the Might and the Hunter a quarter, rounded down (#777)', () => {
  it('a tall stack passes on less, and a new companion arrives with the same share', () => {
    let s = fight('hunter', 'hunter:beastmaster');
    hero(s).statuses = {};
    for (const u of allies(s)) u.statuses = {};
    s = playInst(s, { card: 'the-hunger' }).state;
    const might = hero(s).statuses.might ?? 0;
    expect(might).toBeGreaterThan(0);
    // (half, rounded down, no stop: #777)
    const share = (m: number): number => Math.floor(m / 2);
    expect(allies(s)[0]!.statuses.might ?? 0).toBe(share(might));
    hero(s).statuses.might = 20;
    for (const u of allies(s)) u.statuses.might = share(20);
    s = play(s, 'slip-the-leash');
    expect(hero(s).statuses.might).toBe(28);
    expect(share(28)).toBe(14);
    expect(allies(s)[0]!.statuses.might).toBe(14);
  });
  it('the base Hunter’s companions hold a quarter of the Might, rounded down, and never more than a Beastmaster’s', () => {
    for (const might of [1, 2, 3, 6, 7, 12, 20, 40]) {
      const h = fight('hunter');
      hero(h).statuses = {};
      for (const u of allies(h)) u.statuses = {};
      expect(allies(h).length).toBeGreaterThan(0);
      const hs = giveMight(h, might);
      expect(allies(hs)[0]!.statuses.might ?? 0, `Hunter at ${might}`).toBe(Math.floor(might / 4));
      const b = fight('hunter', 'hunter:beastmaster');
      hero(b).statuses = {};
      for (const u of allies(b)) u.statuses = {};
      const bs = giveMight(b, might);
      const beast = allies(bs)[0]!.statuses.might ?? 0;
      expect(beast, `Beastmaster at ${might}`).toBe(Math.floor(might / 2));
      expect(beast).toBeGreaterThanOrEqual(Math.floor(might / 4));
    }
  });
});

describe('Wild Hunt’s action is without the companions’ Might (#768)', () => {
  it('at the start of the turn each companion hits for its plain number; its own action at the end of a turn keeps its Might', () => {
    let s = fight('hunter', 'hunter:beastmaster');
    s = play(s, 'wild-hunt');
    hero(s).statuses = {};
    const pack = allies(s);
    expect(pack.length).toBeGreaterThan(0);
    for (const u of pack) u.statuses = { might: 9 };
    const id = pack[0]!.id;
    // (ending the turn: the companion's own action with its Might, the enemy's turn, then Wild Hunt as the next turn begins)
    const ended = applyAction(db, s, { type: 'endTurn' });
    expect(ended.state.active).toBe('a');
    const turnStart = ended.events.findIndex((e) => e.type === 'turnStart' && e.side === 'a');
    expect(turnStart).toBeGreaterThan(0);
    const hits = (from: number, to: number): number[] =>
      ended.events
        .slice(from, to)
        .flatMap((e) => (e.type === 'damage' && e.source === id ? [e.amount] : []));
    const own = hits(0, turnStart);
    const bare = hits(turnStart, ended.events.length);
    expect(own.length).toBeGreaterThan(0);
    expect(bare.length).toBe(own.length);
    expect(bare.every((x, i) => x === own[i]! - 9)).toBe(true);
    expect(bare.every((x) => x > 0)).toBe(true);
    expect(cardText(db, db.cards['wild-hunt']!)).toContain('without their Might');
  });
});

describe('a first-Attack bonus is for the card’s own play, not its replays (#768)', () => {
  // (what the hero's own hits took off, one number a hit)
  const hits = (s: CombatState, inst: Omit<CardInst, 'id'>): { state: CombatState; hits: number[] } => {
    const me = hero(s).id;
    const r = playInst(s, inst);
    return {
      state: r.state,
      hits: r.events.flatMap((e) => (e.type === 'damage' && e.source === me ? [e.lost] : [])),
    };
  };
  // (a Necromancer with no Thralls and twice the damage on the first Attack of the turn)
  const lethal = (more: Unit['statuses'] = {}): CombatState => {
    const s = fight('necromancer');
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero');
    hero(s).statuses = { lethality: 100, ...more };
    return s;
  };
  const plain = (): number => {
    const s = lethal();
    hero(s).statuses = {};
    return hits(s, { card: 'strike' }).hits[0]!;
  };
  it('with no replay: the first Attack of the turn gets it, a second Attack none', () => {
    const base = plain();
    expect(base).toBe(6);
    const first = hits(lethal(), { card: 'strike' });
    expect(first.hits).toEqual([2 * base]);
    expect(hits(first.state, { card: 'strike+' }).hits).toEqual([plain() + 3]);
  });
  it('Reverb: the first play gets it, the replay does not, and neither does the next Attack', () => {
    const base = plain();
    const first = hits(lethal({ twinned: 1 }), { card: 'strike' });
    expect(first.hits).toEqual([2 * base, base]);
    expect(hero(first.state).statuses.twinned ?? 0).toBe(0);
    expect(hits(first.state, { card: 'strike+' }).hits).toEqual([base + 3]);
  });
  it('a Replay mark: the first play gets it, the replays do not', () => {
    const base = plain();
    const first = hits(lethal(), { card: 'strike', replay: 2 });
    expect(first.hits).toEqual([2 * base, base, base]);
    expect(hits(first.state, { card: 'strike+' }).hits).toEqual([base + 3]);
  });
  it('Echoing Spirit: the first play gets it, the echo does not', () => {
    const base = plain();
    const first = hits(lethal({ echoing: 1 }), { card: 'strike' });
    expect(first.hits).toEqual([2 * base, base]);
  });
  it('Killing Chill itself: 30% on the first play of the first Attack only', () => {
    let s = lethal();
    hero(s).statuses = { twinned: 1 };
    s = play(s, 'killing-chill');
    expect(hero(s).statuses.lethality).toBe(30);
    const base = plain();
    expect(hits(s, { card: 'strike' }).hits).toEqual([Math.round(base * 1.3), base]);
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

describe('Hot Temper played again is not the first Attack of the turn (#769)', () => {
  const copies = (s: CombatState): number =>
    [...s.sides.a.hand, ...s.sides.a.draw, ...s.sides.a.discard, ...s.sides.a.exhausted].filter(
      (c) => c.card === 'hot-temper',
    ).length;
  it('with Reverb it hits twice and still adds one copy', () => {
    const s = fight('knight');
    hero(s).statuses = { twinned: 1 };
    const before = copies(s);
    const hp = foe(s).hp;
    const after = play(s, 'hot-temper');
    expect(hp - foe(after).hp).toBe(12);
    // (the card played, and one copy)
    expect(copies(after)).toBe(before + 2);
  });
  it('with a Replay mark the same', () => {
    const s = fight('knight');
    hero(s).statuses = {};
    const before = copies(s);
    const after = playInst(s, { card: 'hot-temper', replay: 2 }).state;
    expect(copies(after)).toBe(before + 2);
  });
});
