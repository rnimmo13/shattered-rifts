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
    // (an Ember Bolt with a Hawk standing deals its printed 7)
    let s = fight(['ember-bolt']);
    s = play(s, 'ember-bolt', foe(s).id);
    expect(foe(s).hp).toBe(193);
  });

  it('a command makes the front totem act and consumes it; the rest move up', () => {
    let s = fight(['spirit-call', 'spirit-call']);
    s = play(s, 'spirit-call');
    // (the Hawk: 1 Spirit)
    expect(hero(s).statuses.spirit).toBe(1);
    expect(row(s)).toEqual(['bear', 'thunderbird', null]);
    s = play(s, 'spirit-call');
    // (the Bear: 6 + 1 Spirit Barrier)
    expect(hero(s).barrier).toBe(7);
    expect(row(s)).toEqual(['thunderbird', null, null]);
  });

  it('a plant goes to the back; into a full row it pushes the front one out, and that one acts as it goes', () => {
    let s = fight(['hawk-feather', 'bear-hide']);
    s = play(s, 'hawk-feather');
    // (full: the Hawk at the front is pushed out, gives 1 Spirit, and a new Hawk stands at the back)
    expect(row(s)).toEqual(['bear', 'thunderbird', 'hawk']);
    expect(hero(s).statuses.spirit).toBe(1);
    s = play(s, 'bear-hide');
    // (the Bear is pushed out: 6 + 1 Barrier)
    expect(row(s)).toEqual(['thunderbird', 'hawk', 'bear']);
    expect(hero(s).barrier).toBe(7);
    let t = fight(['hawk-feather']);
    t.sides.a.totems = ['bear', null, null];
    t = play(t, 'hawk-feather');
    expect(row(t)).toEqual(['bear', 'hawk', null]);
    expect(hero(t).barrier).toBe(0);
  });

  it('the newest, the first of a kind, every totem in order, and twice-then-consumed', () => {
    let s = fight(['last-called']);
    s = play(s, 'last-called');
    // (the Thunderbird, last planted: 8 to every enemy)
    expect(lost(s)).toEqual([8]);
    expect(row(s)).toEqual(['hawk', 'bear', null]);
    let t = fight(['bears-guard']);
    t = play(t, 'bears-guard');
    expect(row(t)).toEqual(['hawk', 'thunderbird', null]);
    expect(hero(t).barrier).toBe(6 + 3);
    let u = fight(['great-spirits-call'], ['squire', 'squire']);
    u = play(u, 'great-spirits-call');
    // (front to back: Hawk +1 Spirit, then the Bear 6 + 1, the Thunderbird 8 + 1 to each enemy)
    expect(row(u)).toEqual([null, null, null]);
    expect(hero(u).statuses.spirit).toBe(1);
    expect(hero(u).barrier).toBe(7 + 5);
    expect(lost(u)).toEqual([9, 9]);
    let w = fight(['rally-the-spirits']);
    w.sides.a.totems = ['bear', 'hawk', null];
    w = play(w, 'rally-the-spirits');
    expect(hero(w).barrier).toBe(6 + 6 + 4);
    expect(row(w)).toEqual(['hawk', null, null]);
  });

  it('a command finds nothing in an empty row, and a kind that is not there commands nothing', () => {
    let s = fight(['spirit-call', 'hawks-dive']);
    s.sides.a.totems = ['bear', null, null];
    s = play(s, 'hawks-dive');
    expect(row(s)).toEqual(['bear', null, null]);
    expect(hero(s).barrier).toBe(2);
    s.sides.a.totems = [null, null, null];
    s = play(s, 'spirit-call');
    expect(hero(s).barrier).toBe(2);
  });

  it('passives at the end of his turn: Hawk Primed (if he is not), Bear Barrier, Thunderbird a Fork; all +1 per Spirit', () => {
    let s = fight([], ['squire', 'squire', 'squire']);
    hero(s).statuses.spirit = 2;
    s = endTurn(s);
    // (Primed 2 + 2, kept for his next attack; the Bear's 2 + 2 Barrier went at his turn start; the Fork 3 + 2 on two enemies)
    expect(hero(s).statuses.vigor).toBe(4);
    expect(lost(s).filter((n) => n === 5)).toHaveLength(2);
    expect(lost(s).filter((n) => n === 0)).toHaveLength(1);
    // (already Primed: the Hawk adds none)
    s = endTurn(s);
    expect(hero(s).statuses.vigor).toBe(4);
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
    expect(s.sides.a.mana).toBe(RIFTWALKERS.shaman.hero.mana + 1 - 1 + 2);
  });

  it('the Moon Owl: the first elemental spell each turn costs 1 less, once; its command plays the next elemental spell twice', () => {
    let s = fight([]);
    s.sides.a.totems = ['owl', null, null];
    s = endTurn(s);
    s.sides.a.hand = [
      { id: 'F', card: 'flame-spear' },
      { id: 'G', card: 'flame-spear' },
      { id: 'C', card: 'spirit-call' },
      { id: 'E', card: 'ember-bolt' },
    ];
    s.sides.a.mana = 9;
    s = play(s, 'flame-spear', foe(s).id);
    expect(s.sides.a.mana).toBe(8);
    s = play(s, 'flame-spear', foe(s).id);
    expect(s.sides.a.mana).toBe(6);
    // (a non-elemental card is not cheaper, and the command doubles the next elemental spell)
    s = play(s, 'spirit-call');
    expect(s.sides.a.mana).toBe(5);
    const hp = foe(s).hp;
    s = play(s, 'ember-bolt', foe(s).id);
    expect(hp - foe(s).hp).toBe(14);
    expect(hero(s).statuses.twinspell ?? 0).toBe(0);
  });

  it('Spirit adds to every totem number: a Bear commanded at 3 Spirit gives 9, a Thunderbird 11 to all', () => {
    let s = fight(['bears-guard', 'thunderbirds-cry'], ['squire', 'squire']);
    hero(s).statuses.spirit = 3;
    s = play(s, 'bears-guard');
    expect(hero(s).barrier).toBe(9 + 3);
    s = play(s, 'thunderbirds-cry');
    expect(lost(s)).toEqual([11, 11]);
  });

  it("the Hawk's command gives exactly 1 Spirit, whatever his Spirit", () => {
    let s = fight(['hawks-dive']);
    hero(s).statuses.spirit = 4;
    s = play(s, 'hawks-dive');
    expect(hero(s).statuses.spirit).toBe(5);
  });

  it('Primed from the Hawk goes on every hit of his next attack, and is spent by it', () => {
    let s = fight(['twin-cinders']);
    hero(s).statuses.vigor = 4;
    s = play(s, 'twin-cinders', foe(s).id);
    expect(foe(s).hp).toBe(200 - 2 * (4 + 4));
    expect(hero(s).statuses.vigor ?? 0).toBe(0);
  });

  it('Turn the Wheel moves the front totem to the back; it draws one and discards one', () => {
    let s = fight(['turn-the-wheel']);
    s.sides.a.mana = 0;
    s = play(s, 'turn-the-wheel');
    expect(row(s)).toEqual(['bear', 'thunderbird', 'hawk']);
  });

  it('Gathering Storm still stacks: every copy grows 3 each time one is cast', () => {
    let s = fight(['gathering-storm', 'gathering-storm'], ['squire', 'squire']);
    s = play(s, 'gathering-storm');
    expect(lost(s)).toEqual([4, 4]);
    s = play(s, 'gathering-storm');
    expect(lost(s)).toEqual([4 + 7, 4 + 7]);
  });

  it('Auras stack: two Totem Drums each strike when a totem acts; Harmony and Storm Sovereign answer a push-out too', () => {
    let s = fight(['totem-drum', 'totem-drum', 'harmony', 'storm-sovereign', 'hawk-feather']);
    for (const id of ['totem-drum', 'totem-drum', 'harmony', 'storm-sovereign']) s = play(s, id);
    const hp = foe(s).hp;
    s = play(s, 'hawk-feather');
    // (the Hawk pushed out acts once: 3 + 3 from the Drums, 3 from the Sovereign, 3 Barrier from Harmony)
    expect(hp - foe(s).hp).toBe(3 + 3 + 3);
    expect(hero(s).barrier).toBe(3);
  });

  it('Spirit Chorus commands the front totem at the start of each turn', () => {
    let s = fight(['spirit-chorus']);
    s = play(s, 'spirit-chorus');
    s = endTurn(s);
    expect(row(s)).toEqual(['bear', 'thunderbird', null]);
    expect(hero(s).statuses.spirit).toBe(1);
  });

  it('the new plant and command cards do what they say', () => {
    let s = fight(
      ['talon-strike', 'thunderbird-call', 'totem-circle', 'raise-a-totem'],
      ['squire', 'squire'],
    );
    s = play(s, 'talon-strike', foe(s).id);
    expect(lost(s)[0]).toBe(11);
    expect(row(s)).toEqual(['bear', 'thunderbird', 'hawk']);
    expect(hero(s).statuses.spirit).toBe(1);
    s = play(s, 'thunderbird-call');
    // (4 to all, the Bear pushed out: 6 + 1 Barrier)
    expect(row(s)).toEqual(['thunderbird', 'hawk', 'thunderbird']);
    expect(hero(s).barrier).toBe(7);
    s = play(s, 'totem-circle');
    expect(row(s)).toEqual(['hawk', 'bear', 'thunderbird']);
    s = play(s, 'raise-a-totem');
    expect(row(s).filter((k) => k !== null)).toHaveLength(3);
    let t = fight(['spirit-strike', 'spirit-ward', 'call-again']);
    t = play(t, 'spirit-strike', foe(t).id);
    expect(foe(t).hp).toBe(189);
    t = play(t, 'spirit-ward');
    expect(hero(t).barrier).toBe(2 + 7);
    t = play(t, 'call-again');
    expect(row(t)).toEqual([null, null, null]);
    expect(t.sides.a.exhausted.map((c) => c.card)).toContain('call-again');
    let u = fight(['ancestral-exchange', 'totem-strike']);
    u = play(u, 'ancestral-exchange');
    expect(row(u).filter((k) => k !== null)).toHaveLength(3);
    expect(row(u)[0]).toBe('hawk');
    u = play(u, 'totem-strike', foe(u).id);
    expect(foe(u).hp).toBe(200 - 8 - (2 + 3 * 3));
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
        JSON.stringify(up!.effects) !== JSON.stringify(c.effects) || up!.innate,
        c.id,
      ).toBeTruthy();
      expect(cardText(db, c).length, c.id).toBeGreaterThan(3);
    }
  });

  it('pool: about 87 reward-eligible cards, 12 Auras, three element paths of 15 or more', () => {
    const own = rewardPool('shaman').filter((id) => db.cards[id]?.hero === 'shaman');
    expect(own.length).toBeGreaterThanOrEqual(85);
    expect(own.length).toBeLessThanOrEqual(87);
    expect(own.filter((id) => db.cards[id]?.kind === 'power')).toHaveLength(12);
    expect(pathSizes('shaman').every((n) => n >= 15)).toBe(true);
  });

  it('no loop: an 8-card deck of free plants, commands, the Elder and the Owl plays a bounded number of cards a turn', () => {
    const deck = [
      'call-again',
      'hawk-feather',
      'bear-hide',
      'storm-feather',
      'turn-the-wheel',
      'wind-whisper',
      'call-the-elder-tree',
      'spark-fork',
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

  it('the burst ceiling, through legal actions, on a 540 HP hero: a Spirit-built row and Primed into Inferno', () => {
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
      { id: 'H2', card: 'thunderbirds-cry' },
    ];
    const hp = k.hp;
    s = play(s, 'spirit-call');
    // (Inferno+ costs 3: the Owl's command plays it twice; Primed 6 goes on the first)
    s = play(s, 'inferno+', k.id);
    const dealt = hp - s.sides.b.units.find((u) => u.kind === 'hero')!.hp;
    // (Inferno+ 38 + Primed 6, then again 38; its Burn ticks later)
    expect(dealt).toBe(38 + 6 + 38);
    expect(dealt).toBeLessThan(540 / 5);
  });
});
