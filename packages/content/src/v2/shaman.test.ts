// The Shaman's totem cycle (Robert, DECISIONS #430): his totems stand in a row in the order they were planted, front first. Each does
// something every turn while it stands; a command makes the front totem act and consumes it; planting into a full row pushes the front
// one out, which acts as it goes. Every totem number grows by 1 per Spirit (the Elder Tree and the Moon Owl excepted). No Trinity, no
// help on spells.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  nextInt,
  seedRng,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes, rewardPool } from './index';

/** a fight on his turn with the given hand, his three starting totems planted, and one enemy (or the ones named) at 200 HP */
function fight(hand: string[], enemies: string[] = ['squire']): CombatState {
  const deck = RIFTWALKERS.shaman.starter;
  const { state } = createCombat(db, {
    seed: 'shaman-cycle',
    a: { hero: 'shaman', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  s.sides.a.draw = Array.from({ length: 8 }, (_, i) => ({ id: `D${i}`, card: 'strike' }));
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  hero(s).statuses = {};
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const lost = (s: CombatState): number[] => s.sides.b.units.map((u) => 200 - u.hp);
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  // (a choice a card asks, a discard: the first option)
  for (let k = 0; k < 4 && r.pending; k++) {
    const p = r.pending;
    r = applyAction(db, r, { type: 'pick', cards: p.pool.slice(0, Math.max(p.min, 1)) }).state;
  }
  return r;
};
/** every enemy guards: his turn ends, the enemy turn runs, and his next turn begins */
const endTurn = (s: CombatState): CombatState => {
  for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
  return applyAction(db, s, { type: 'endTurn' }).state;
};
const row = (s: CombatState): (string | null)[] => s.sides.a.totems ?? [];

describe('the Shaman: the totem cycle (DECISIONS #430)', () => {
  it('starts with a Hawk, a Bear and a Thunderbird in that order; no Trinity, no help on spells', () => {
    const { state } = createCombat(db, {
      seed: 'sh',
      a: { hero: 'shaman', deck: RIFTWALKERS.shaman.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.totems).toEqual(['hawk', 'bear', 'thunderbird']);
    expect(RIFTWALKERS.shaman.trait.trinity).toBeFalsy();
    for (const t of Object.values(db.totems ?? {})) {
      expect(t.boost, t.id).toBeUndefined();
      expect(t.onTrinity, t.id).toBeUndefined();
      expect(t.passive, t.id).toBeDefined();
    }
    // (Raise the Hawk into a full row pushes the front Hawk out: it hits for 7)
    let s = fight(['raise-the-hawk']);
    s = play(s, 'raise-the-hawk');
    expect(row(s)).toEqual(['bear', 'thunderbird', 'hawk']);
    expect(foe(s).hp).toBe(193);
  });

  it('a command makes the front totem act and consumes it; the rest move up', () => {
    let s = fight(['spirit-call', 'spirit-call']);
    s = play(s, 'spirit-call');
    // (Spirit Call acts the front totem twice: the Hawk hits twice for 7)
    expect(lost(s)).toEqual([14]);
    expect(row(s)).toEqual(['bear', 'thunderbird', null]);
    s = play(s, 'spirit-call');
    // (the Bear: 6 Barrier twice)
    expect(hero(s).barrier).toBe(12);
    expect(row(s)).toEqual(['thunderbird', null, null]);
  });

  it('a plant goes to the back; into a full row it pushes the front one out, and that one acts as it goes', () => {
    let s = fight(['wardkeepers-pact', 'hawks-dive']);
    s = play(s, 'wardkeepers-pact');
    // (full: the Hawk at the front is pushed out and hits for 7; a Bear stands at the back; Bear Call's 4 Barrier)
    expect(row(s)).toEqual(['bear', 'thunderbird', 'bear']);
    expect(lost(s)).toEqual([7]);
    expect(hero(s).barrier).toBe(4);
    s = play(s, 'hawks-dive', foe(s).id);
    // (Hawk's Dive 7, the Bear pushed out: 6 Barrier)
    expect(row(s)).toEqual(['thunderbird', 'bear', 'hawk']);
    expect(lost(s)).toEqual([7 + 7]);
    expect(hero(s).barrier).toBe(4 + 6);
    let t = fight(['hawks-dive']);
    t.sides.a.totems = ['bear', null, null];
    t = play(t, 'hawks-dive', foe(t).id);
    expect(row(t)).toEqual(['bear', 'hawk', null]);
    expect(hero(t).barrier).toBe(0);
    expect(lost(t)).toEqual([7]);
  });

  it('Rally the Spirits commands the front totem twice, then it is consumed', () => {
    let w = fight(['rally-the-spirits']);
    w.sides.a.totems = ['bear', 'hawk', null];
    w = play(w, 'rally-the-spirits');
    expect(hero(w).barrier).toBe(6 + 6 + 4);
    expect(row(w)).toEqual(['hawk', null, null]);
  });

  it('a command finds nothing in an empty row', () => {
    let s = fight(['spirit-call']);
    s.sides.a.totems = [null, null, null];
    s = play(s, 'spirit-call');
    expect(hero(s).barrier).toBe(0);
    expect(row(s)).toEqual([null, null, null]);
  });

  it('passives at the end of his turn: Hawk a random hit, Bear Barrier, Thunderbird a Fork; all +1 per Spirit', () => {
    let s = fight([], ['squire', 'squire', 'squire']);
    hero(s).statuses.spirit = 2;
    s = endTurn(s);
    // (the Hawk 3 + 2 on one random enemy, the Fork 3 + 2 on two different enemies)
    expect(hero(s).statuses.vigor ?? 0).toBe(0);
    expect(lost(s).reduce((a, b) => a + b, 0)).toBe(15);
  });

  it("the Bear's end-of-turn Barrier is there for the enemy turn", () => {
    let s = fight([]);
    hero(s).statuses.spirit = 1;
    s.sides.a.totems = ['bear', null, null];
    for (const u of s.sides.b.units) u.intent = { move: 'slash', target: hero(s).id };
    s = applyAction(db, s, { type: 'endTurn' }).state;
    // (Slash 9 against 3 Barrier: 6 through)
    expect(hero(s).hp).toBe(RIFTWALKERS.shaman.hero.maxHp - 6);
  });

  it("the Thunderbird's Fork is 25% harder against a lone enemy", () => {
    let s = fight([]);
    s.sides.a.totems = ['thunderbird', null, null];
    s = endTurn(s);
    expect(lost(s)).toEqual([Math.round(3 * 1.25)]);
  });

  it('the Elder Tree: 1 Mana at the start of his turn and 2 when commanded, whatever his Spirit', () => {
    let s = fight(['spirit-call']);
    hero(s).statuses.spirit = 5;
    s.sides.a.totems = ['elder', null, null];
    s = endTurn(s);
    expect(s.sides.a.mana).toBe(RIFTWALKERS.shaman.hero.mana + 1);
    s.sides.a.hand = [{ id: 'C', card: 'spirit-call' }];
    s = play(s, 'spirit-call');
    expect(s.sides.a.mana).toBe(RIFTWALKERS.shaman.hero.mana + 1 - 1 + 4);
  });

  it('the Moon Owl: 1 Spirit at the start of his turn, 2 when commanded', () => {
    let s = fight(['spirit-call']);
    s.sides.a.totems = ['owl', null, null];
    s = endTurn(s);
    expect(hero(s).statuses.spirit).toBe(1);
    s.sides.a.hand = [{ id: 'C', card: 'spirit-call' }];
    s.sides.a.mana = 9;
    s = play(s, 'spirit-call');
    expect(hero(s).statuses.spirit).toBe(5);
    expect(row(s)).toEqual([null, null, null]);
  });

  it('Spirit adds to every totem number: a Bear commanded at 3 Spirit gives 9, a Thunderbird 11 to all', () => {
    let s = fight(['spirit-call', 'spirit-call'], ['squire', 'squire']);
    s.sides.a.totems = ['bear', 'thunderbird', null];
    hero(s).statuses.spirit = 3;
    s = play(s, 'spirit-call');
    expect(hero(s).barrier).toBe(18);
    s = play(s, 'spirit-call');
    expect(lost(s)).toEqual([22, 22]);
  });

  it("the Hawk's command hits a random enemy for 7 + 1 per Spirit", () => {
    let s = fight(['spirit-call']);
    hero(s).statuses.spirit = 4;
    s = play(s, 'spirit-call');
    expect(lost(s)).toEqual([22]);
  });

  it('Spirit Rush gives 2 Spirit for the turn only and is consumed', () => {
    let s = fight(['spirit-rush']);
    s = play(s, 'spirit-rush');
    expect(hero(s).statuses.spirit).toBe(2);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('spirit-rush');
    s = endTurn(s);
    expect(hero(s).statuses.spirit ?? 0).toBe(0);
  });

  it('Primed goes on every hit of his next attack, and is spent by it', () => {
    let s = fight(['twin-cinders']);
    hero(s).statuses.vigor = 4;
    s = play(s, 'twin-cinders', foe(s).id);
    expect(foe(s).hp).toBe(200 - 2 * (4 + 4));
    expect(hero(s).statuses.vigor ?? 0).toBe(0);
  });

  it('Spirit Offering gives 2 Mana and adds a Void to your discard pile; it is not consumed', () => {
    let s = fight(['spirit-offering']);
    s = play(s, 'spirit-offering');
    expect(s.sides.a.mana).toBe(9 + 2);
    expect(s.sides.a.discard.map((c) => c.card)).toContain('void-drain');
    expect(s.sides.a.exhausted.map((c) => c.card)).not.toContain('spirit-offering');
  });

  it('Stone Sling hits for 4 and adds a Void to your discard pile', () => {
    let s = fight(['stone-sling']);
    s = play(s, 'stone-sling', foe(s).id);
    expect(lost(s)).toEqual([4]);
    expect(s.sides.a.discard.map((c) => c.card)).toContain('void-drain');
  });

  it('Flame Spear does 16 and 3 Burn; Twin Cinders burns too', () => {
    let s = fight(['flame-spear']);
    s = play(s, 'flame-spear', foe(s).id);
    expect(lost(s)).toEqual([16]);
    expect(foe(s).statuses.burn).toBe(3);
  });

  it('Hawk Call gives 4 Barrier now and a Hawk at the start of each of the next two turns', () => {
    let s = fight(['spark-cast']);
    s.sides.a.totems = [null, null, null];
    s = play(s, 'spark-cast');
    expect(hero(s).barrier).toBe(4);
    expect(row(s)).toEqual([null, null, null]);
    s = endTurn(s);
    expect(row(s).filter((k) => k === 'hawk')).toHaveLength(1);
    s = endTurn(s);
    expect(row(s).filter((k) => k === 'hawk')).toHaveLength(2);
    s = endTurn(s);
    expect(row(s).filter((k) => k === 'hawk')).toHaveLength(2);
  });

  it('Gathering Storm still stacks: every copy grows 3 each time one is cast', () => {
    let s = fight(['gathering-storm', 'gathering-storm'], ['squire', 'squire']);
    s = play(s, 'gathering-storm');
    expect(lost(s)).toEqual([4, 4]);
    s = play(s, 'gathering-storm');
    expect(lost(s)).toEqual([4 + 7, 4 + 7]);
  });

  it('Gathering Storm hits two different enemies, 25% harder against a lone one', () => {
    let s = fight(['gathering-storm'], ['squire', 'squire', 'squire']);
    s = play(s, 'gathering-storm');
    expect(lost(s).filter((n) => n === 4)).toHaveLength(2);
    let t = fight(['gathering-storm']);
    t = play(t, 'gathering-storm');
    expect(lost(t)).toEqual([5]);
  });

  it('Auras stack: two Totem Drums each strike when a totem acts; Harmony and Storm Sovereign answer a push-out too', () => {
    let s = fight(['totem-drum', 'totem-drum', 'harmony', 'storm-sovereign', 'hawks-dive']);
    for (const id of ['totem-drum', 'totem-drum', 'harmony', 'storm-sovereign']) s = play(s, id);
    const hp = foe(s).hp;
    s = play(s, 'hawks-dive', foe(s).id);
    // (the Hawk pushed out hits for 7, 3 + 3 from the Drums, 3 from the Sovereign, 3 Barrier from Harmony)
    expect(hp - foe(s).hp).toBe(7 + 7 + 3 + 3 + 3);
    expect(hero(s).barrier).toBe(3);
  });

  it('Spirit Chorus commands the front totem at the start of each turn', () => {
    let s = fight(['spirit-chorus']);
    s = play(s, 'spirit-chorus');
    s = endTurn(s);
    expect(row(s)).toEqual(['bear', 'thunderbird', null]);
    // (the Hawk's command, 7, on top of its end-of-turn hit and the Thunderbird's Fork)
    expect(lost(s)[0]).toBeGreaterThanOrEqual(7);
  });

  it('the new plant and command cards do what they say', () => {
    let s = fight(
      ['talon-strike', 'thunderbird-call', 'totem-circle', 'raise-a-totem'],
      ['squire', 'squire'],
    );
    s = play(s, 'talon-strike', foe(s).id);
    // (11, and the Hawk pushed out hits a random enemy for 7)
    expect(lost(s).reduce((a, b) => a + b, 0)).toBe(11 + 7);
    expect(row(s)).toEqual(['bear', 'thunderbird', 'hawk']);
    s = play(s, 'thunderbird-call');
    // (4 to all, the Bear pushed out: 6 Barrier)
    expect(row(s)).toEqual(['thunderbird', 'hawk', 'thunderbird']);
    expect(hero(s).barrier).toBe(6);
    s = play(s, 'totem-circle');
    expect(row(s)).toEqual(['hawk', 'bear', 'thunderbird']);
    s = play(s, 'raise-a-totem');
    expect(row(s).filter((k) => k !== null)).toHaveLength(3);
    let t = fight(['spirit-strike', 'spirit-ward', 'spirit-call']);
    t = play(t, 'spirit-strike', foe(t).id);
    // (11, and the Hawk it commands hits for 7)
    expect(foe(t).hp).toBe(182);
    t = play(t, 'spirit-ward');
    expect(hero(t).barrier).toBe(2 + 6);
    t = play(t, 'spirit-call');
    expect(row(t)).toEqual([null, null, null]);
  });

  it('the rare totems are planted by their own cards, for 3 and 2 Mana', () => {
    let s = fight(['call-the-elder-tree', 'call-the-moon-owl']);
    s = play(s, 'call-the-elder-tree');
    expect(row(s)).toEqual(['bear', 'thunderbird', 'elder']);
    s = play(s, 'call-the-moon-owl');
    expect(row(s)).toEqual(['thunderbird', 'elder', 'owl']);
    expect(s.sides.a.mana).toBe(9 - 5);
    expect(db.cards['call-the-elder-tree']!.cost).toBe(3);
  });

  it('every Shaman card plays, and its upgrade is a different card', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'shaman' && !c.id.endsWith('+') && !c.id.includes('~'),
    );
    for (const c of own) {
      const up = db.cards[`${c.id}+`];
      expect(up, c.id).toBeDefined();
      expect(
        JSON.stringify(up!.effects) !== JSON.stringify(c.effects) || up!.innate || up!.cost !== c.cost,
        c.id,
      ).toBeTruthy();
      expect(cardText(db, c).length, c.id).toBeGreaterThan(3);
    }
  });

  it('pool: about 78 reward-eligible cards, 12 Auras, three element paths of 15 or more', () => {
    const own = rewardPool('shaman').filter((id) => db.cards[id]?.hero === 'shaman');
    expect(own.length).toBeGreaterThanOrEqual(75);
    expect(own.length).toBeLessThanOrEqual(78);
    expect(own.filter((id) => db.cards[id]?.kind === 'power')).toHaveLength(12);
    expect(pathSizes('shaman').every((n) => n >= 15)).toBe(true);
  });

  it('no loop: an 8-card deck of free plants, commands, the Elder and the Owl plays a bounded number of cards a turn', () => {
    const deck = [
      'spirit-call',
      'hawks-dive',
      'wardkeepers-pact',
      'thunderbird-call',
      'spirit-offering',
      'wind-whisper',
      'call-the-elder-tree',
      'gathering-storm',
    ];
    for (let g = 0; g < 30; g++) {
      const { state } = createCombat(db, {
        seed: `loop-${g}`,
        a: { hero: 'shaman', deck },
        b: { enemies: ['squire'] },
      });
      let s = clone(state);
      for (const u of s.sides.b.units) u.hp = u.maxHp = 9999;
      const rng = seedRng(`pick-${g}`);
      for (let turn = 0; turn < 8 && !s.winner; turn++) {
        let plays = 0;
        for (let k = 0; k < 200 && !s.winner && s.active === 'a'; k++) {
          if (s.pending) {
            s = applyAction(db, s, {
              type: 'pick',
              cards: s.pending.pool.slice(0, Math.max(1, s.pending.min)),
            }).state;
            continue;
          }
          const acts = legalActions(db, s).filter((x) => x.type === 'play');
          if (!acts.length) break;
          s = applyAction(db, s, acts[nextInt(rng, acts.length)]!).state;
          plays++;
        }
        expect(plays).toBeLessThan(30);
        if (!s.winner) s = endTurn(s);
      }
    }
  });

  it('in the Arena (seat b) his totems work against the other hero, and the Thunderbird Forks onto it', () => {
    const { state } = createCombat(db, {
      seed: 'sh-pvp',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 480, maxHp: 480 },
      b: { hero: 'shaman', deck: RIFTWALKERS.shaman.starter, hp: 540, maxHp: 540 },
    });
    let s = clone(state);
    s = applyAction(db, s, { type: 'endTurn' }).state; // seat b's turn
    expect(s.sides.b.totems).toEqual(['hawk', 'bear', 'thunderbird']);
    const knight = s.sides.a.units.find((u) => u.kind === 'hero')!;
    const before = knight.hp + knight.barrier;
    s.sides.b.hand = [{ id: 'B0', card: 'spirit-call' }];
    s.sides.b.mana = 3;
    s = applyAction(db, s, { type: 'play', card: 'B0' }).state;
    expect(s.sides.b.totems).toEqual(['bear', 'thunderbird', null]);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    const k2 = s.sides.a.units.find((u) => u.kind === 'hero')!;
    // (the Thunderbird's 3 + 1 Spirit, 25% more on the lone hero: 5)
    expect(before - (k2.hp + k2.barrier)).toBeGreaterThanOrEqual(5);
  });

  it('the burst ceiling, through legal actions, on a 540 HP hero: Primed into Inferno', () => {
    const { state } = createCombat(db, {
      seed: 'sh-burst',
      a: { hero: 'shaman', deck: RIFTWALKERS.shaman.starter },
      b: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 540, maxHp: 540 },
    });
    let s = clone(state);
    const k = s.sides.b.units.find((u) => u.kind === 'hero')!;
    k.barrier = 0;
    k.statuses = {};
    // (mid-fight: 4 Spirit, Primed 6 from last turn's Hawk, an Owl at the front, a Thunderbird behind it, 4 Mana with the Elder)
    hero(s).statuses = { spirit: 4, vigor: 6 };
    s.sides.a.totems = ['owl', 'thunderbird', 'thunderbird'];
    s.sides.a.mana = 4;
    s.sides.a.hand = [
      { id: 'H0', card: 'spirit-call' },
      { id: 'H1', card: 'inferno+' },
      { id: 'H2', card: 'spirit-call' },
    ];
    const hp = k.hp;
    s = play(s, 'spirit-call');
    // (Inferno+ costs 3; Primed 6 goes on it; the Owl's command gave Spirit instead)
    s = play(s, 'inferno+', k.id);
    const dealt = hp - s.sides.b.units.find((u) => u.kind === 'hero')!.hp;
    // (Inferno+ 38 + Primed 6; its Burn ticks later)
    expect(dealt).toBe(38 + 6);
    expect(dealt).toBeLessThan(540 / 5);
  });
});
