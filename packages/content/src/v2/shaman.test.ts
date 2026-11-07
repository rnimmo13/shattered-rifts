// The Shaman's totem cycle (Robert, DECISIONS #430): his totems stand in a row in the order they were planted, front first. Each does
// something every turn while it stands; a command makes the front totem act and consumes it; planting into a full row pushes the front
// one out, which acts as it goes. Every totem number grows by 1 per Spirit (the Elder Tree and the Moon Owl excepted). No Trinity, no
// help on spells.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  nextInt,
  seedRng,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool } from './index';

/** a fight on his turn with the given hand, his full starting row, and enemies at 200 HP */
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
  // Keep the row explicit for the individual card scenarios.
  s.sides.a.totems = ['hawk', 'bear', 'thunderbird'];
  s.sides.a.channeledBy = { ...s.sides.a.channeledBy, thunderbird: 1 };
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
  it('starts with a Hawk, Bear and Thunderbird in order; no Trinity, no help on spells', () => {
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

  it('the Moon Owl (a Dark orb): its charge grows 6 each turn; a command hits the weakest enemy for 6 plus the charge', () => {
    let s = fight(['spirit-call'], ['squire', 'squire']);
    s.sides.a.totems = ['owl', null, null];
    s.sides.b.units[1]!.hp = 50;
    s = endTurn(s);
    expect(hero(s).statuses.umbra).toBe(6);
    s.sides.a.hand = [{ id: 'C', card: 'spirit-call' }];
    s.sides.a.mana = 9;
    for (const u of s.sides.b.units) u.barrier = 0;
    const before = s.sides.b.units.map((u) => u.hp);
    s = play(s, 'spirit-call');
    // (Spirit Call acts it twice: 6 + 6 = 12, then the charge is spent and the second act is 6; both go to the weakest enemy)
    const lostNow = s.sides.b.units.map((u, i) => before[i]! - u.hp);
    expect(lostNow).toEqual([0, 18]);
    expect(hero(s).statuses.umbra ?? 0).toBe(0);
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

  it('Spirit Offering gives 1 Mana now and 1 next turn, adding a Void without being consumed', () => {
    let s = fight(['spirit-offering']);
    s = play(s, 'spirit-offering');
    expect(s.sides.a.mana).toBe(9 + 1);
    expect(s.sides.a.discard.map((c) => c.card)).toContain('void-drain');
    expect(s.sides.a.exhausted.map((c) => c.card)).not.toContain('spirit-offering');
  });

  it('Wildfire is a skill that applies 8 Burn and deals nothing (DECISIONS #501)', () => {
    expect(db.cards['spreading-flames']?.kind).toBe('skill');
    let s = fight(['spreading-flames']);
    s = play(s, 'spreading-flames', foe(s).id);
    expect(lost(s)).toEqual([0]);
    expect(foe(s).statuses.burn).toBe(8);
    expect(s.sides.a.mana).toBe(8);
    s = fight(['spreading-flames+']);
    s = play(s, 'spreading-flames+', foe(s).id);
    expect(foe(s).statuses.burn).toBe(10);
  });

  it('Flashpoint costs 2, deals 12 + 2 per Burn and spends half the Burn, rounded down (DECISIONS #501)', () => {
    let s = fight(['flash-burn']);
    foe(s).statuses.burn = 21;
    s = play(s, 'flash-burn', foe(s).id);
    expect(lost(s)).toEqual([12 + 42]);
    expect(foe(s).statuses.burn).toBe(10);
    expect(s.sides.a.mana).toBe(7);
    expect(cardText(db, db.cards['flash-burn']!)).toContain('Halve the Burn on the target.');
    s = fight(['flash-burn+']);
    s = play(s, 'flash-burn+', foe(s).id);
    expect(lost(s)).toEqual([16]);
  });

  it('Burn has to get through the Barrier still standing, Bleed does not, and either way it loses its 1 (DECISIONS #501)', () => {
    const ticked = (barrier: number, status: 'burn' | 'seared'): CombatState => {
      const s = fight([]);
      s.sides.a.totems = [];
      s.sides.a.runes = [];
      foe(s).barrier = barrier;
      foe(s).statuses[status] = 5;
      return endTurn(s);
    };
    expect(lost(ticked(3, 'burn'))).toEqual([2]);
    expect(lost(ticked(20, 'burn'))).toEqual([0]);
    expect(foe(ticked(20, 'burn')).statuses.burn).toBe(4);
    expect(lost(ticked(0, 'burn'))).toEqual([5]);
    expect(lost(ticked(20, 'seared'))).toEqual([5]);
  });

  it('Barrier a Burn tick brings (a phase rise) stays; what is left of last turn still falls away (DECISIONS #501)', () => {
    const s = fight([]);
    s.sides.a.totems = [];
    s.sides.a.runes = [];
    foe(s).hp = 103;
    foe(s).barrier = 1;
    foe(s).statuses.burn = 5;
    foe(s).rise = [{ atPct: 50, barrierPct: 20, might: 0 }];
    const after = endTurn(s);
    const plain = fight([]);
    plain.sides.a.totems = [];
    plain.sides.a.runes = [];
    // (what the enemy's own guard move gives)
    const none = foe(endTurn(plain)).barrier;
    // (1 soaked, 3 of the other 4 reach the 100 HP floor, and the rise brings 40)
    expect(foe(after).hp).toBe(100);
    expect(foe(after).barrier).toBe(40 + none);
    const kept = fight([]);
    kept.sides.a.totems = [];
    kept.sides.a.runes = [];
    foe(kept).barrier = 30;
    foe(kept).statuses.burn = 5;
    expect(foe(endTurn(kept)).barrier).toBe(none);
    // (Fortified keeps its share of what the tick left: 10 - 4 = 6, 75% of it is 4)
    const fort = fight([]);
    fort.sides.a.totems = [];
    fort.sides.a.runes = [];
    foe(fort).barrier = 10;
    foe(fort).statuses.burn = 4;
    foe(fort).statuses.fortified = 1;
    expect(foe(endTurn(fort)).barrier).toBe(4 + none);
  });

  it('a bot counts Burn, so it plays Wildfire', () => {
    const s = fight(['spreading-flames']);
    expect(chooseAction(db, s).type).toBe('play');
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

  it('Auras stack: two Storm Sovereigns each answer when a totem acts, a push-out too', () => {
    let s = fight(['storm-sovereign', 'storm-sovereign', 'hawks-dive']);
    for (const id of ['storm-sovereign', 'storm-sovereign']) s = play(s, id);
    const hp = foe(s).hp;
    s = play(s, 'hawks-dive', foe(s).id);
    // (the Hawk pushed out hits for 7, and each Sovereign adds 3 damage and 3 Barrier)
    expect(hp - foe(s).hp).toBe(7 + 7 + 3 + 3);
    expect(hero(s).barrier).toBe(6);
  });

  it('the new plant and command cards do what they say', () => {
    let s = fight(
      ['hawks-dive', 'thunderbird-call', 'totem-circle', 'raise-a-totem'],
      ['squire', 'squire'],
    );
    s = play(s, 'hawks-dive', foe(s).id);
    // (7, and the Hawk pushed out hits a random enemy for 7)
    expect(lost(s).reduce((a, b) => a + b, 0)).toBe(7 + 7);
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
    // (5, and the Hawk it commands hits for 7)
    expect(foe(t).hp).toBe(188);
    t = play(t, 'spirit-ward');
    expect(hero(t).barrier).toBe(2 + 6);
    t = play(t, 'spirit-call');
    expect(row(t)).toEqual([null, null, null]);
  });

  it('the Defect-shaped uncommons and rares do what they say', () => {
    // (Dawn Ward: 10 Barrier, consumed; Frostbound Hide: 6 and two Bears, which push the Hawk and the Bear out: the Bear gives 6 more)
    let s = fight(['dawn-ward', 'frostbound-hide']);
    s = play(s, 'dawn-ward');
    expect(hero(s).barrier).toBe(10);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('dawn-ward');
    s = play(s, 'frostbound-hide');
    expect(hero(s).barrier).toBe(10 + 6 + 6);
    // Wellspring:2 Mana now and2 next turn, consumed; Thunder Beam remains28 to all.
    let t = fight(['wellspring', 'thunder-beam'], ['squire', 'squire']);
    hero(t).statuses.spirit = 2;
    t = play(t, 'wellspring');
    expect(t.sides.a.mana).toBe(9 + 2);
    t = play(t, 'thunder-beam');
    expect(lost(t)).toEqual([28, 28]);
    expect(hero(t).statuses.spirit ?? 0).toBe(0);
    // (Spirit Surge: 2 Spirit and 8 Barrier)
    let u = fight(['spirit-surge']);
    u = play(u, 'spirit-surge');
    expect(hero(u).statuses.spirit).toBe(2);
    // (Hail Chant: with a Bear standing, the end of turn gives 4 Barrier and 1 Faltering to every enemy)
    let hc = fight(['hail-chant']);
    hc = play(hc, 'hail-chant');
    hc.sides.a.totems = ['bear', null, null];
    const res = applyAction(db, hc, { type: 'endTurn' });
    expect(
      res.events.some((e) => e.type === 'status' && e.status === 'faltering' && e.amount > 0),
    ).toBe(true);
    // (Spark Strike: 3, and 4 more for each Thunderbird standing)
    let w = fight(['spark-strike']);
    w = play(w, 'spark-strike', foe(w).id);
    expect(lost(w)).toEqual([7]);
    // (Grim Ward: 13 Barrier and two Wounds in your discard)
    let x = fight(['grim-ward']);
    x = play(x, 'grim-ward');
    expect(hero(x).barrier).toBe(13);
    expect(x.sides.a.discard.filter((c) => c.card === 'wound')).toHaveLength(2);
    // (Echoing Spirit: the first card each turn is played twice)
    let y = fight(['echoing-spirit', 'spark-strike']);
    y = play(y, 'echoing-spirit');
    expect(hero(y).statuses.echoing).toBe(1);
  });

  it('X-cost cards: Thunder Rush plants a Thunderbird per Mana, Chain of Calls acts the front totem that many times', () => {
    let s = fight(['thunder-rush']);
    s.sides.a.totems = [null, null, null];
    s.sides.a.mana = 2;
    s = play(s, 'thunder-rush');
    expect(row(s).filter((k) => k === 'thunderbird')).toHaveLength(2);
    let t = fight(['chain-of-calls']);
    t.sides.a.mana = 3;
    t = play(t, 'chain-of-calls');
    // (the Hawk at the front acts three times, 7 each, and is consumed)
    expect(lost(t)).toEqual([21]);
    expect(row(t)).toEqual(['bear', 'thunderbird', null]);
  });

  it('the Defect Powers with their own engine: Buffer, Loop, Salvage Spirit, Iteration, Feral, Dream Weaving', () => {
    // (Ward of the Spirits: the next HP loss is none; Barrier still soaks first)
    let b = fight(['ward-of-the-spirits']);
    b = play(b, 'ward-of-the-spirits');
    expect(hero(b).statuses.buffer).toBe(1);
    for (const u of b.sides.b.units) u.intent = { move: 'slash', target: hero(b).id };
    const hp = hero(b).hp;
    b = applyAction(db, b, { type: 'endTurn' }).state;
    expect(hero(b).hp).toBe(hp);
    expect(hero(b).statuses.buffer ?? 0).toBe(0);
    // (Turning Wheel: the front totem's passive fires at the start of each turn, without consuming it)
    let l = fight(['turning-wheel']);
    l.sides.a.totems = ['bear', null, null];
    l = play(l, 'turning-wheel');
    l = endTurn(l);
    // (the Bear's end-of-turn Barrier, and its pulse at the start of the next turn)
    expect(hero(l).barrier).toBeGreaterThanOrEqual(2);
    expect(row(l)).toEqual(['bear', null, null]);
    // (Salvage Spirit: a Void or Wound made in your piles plants a random totem)
    let v = fight(['salvage-spirit', 'spirit-offering']);
    v.sides.a.totems = [null, null, null];
    v = play(v, 'salvage-spirit');
    v = play(v, 'spirit-offering');
    expect(row(v).filter((k) => k !== null)).toHaveLength(1);
    // (Bitter Lesson: the first Status you draw each turn draws 2 more)
    let d = fight(['bitter-lesson', 'swift-study']);
    d = play(d, 'bitter-lesson');
    d.sides.a.draw = [
      { id: 'V1', card: 'void-drain' },
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'strike' },
      { id: 'D3', card: 'strike' },
      { id: 'D4', card: 'strike' },
      { id: 'D5', card: 'strike' },
    ];
    d = play(d, 'swift-study');
    expect(d.sides.a.hand).toHaveLength(5);
    // (Snap Back: the first 0-cost Attack each turn returns to your hand)
    let f = fight(['snap-back', 'spark-strike']);
    f = play(f, 'snap-back');
    f = play(f, 'spark-strike', foe(f).id);
    expect(f.sides.a.hand.some((c) => c.card === 'spark-strike')).toBe(true);
  });

  it('the rest of the Defect copies: Chill, Sunder, Compact, Modded, Reboot, Voltaic, Shatter, All for One, Adaptive Strike', () => {
    // (Kindling Ward: Void and Wound cards in your hand become Tinder, which gives a Mana)
    let w = fight(['kindling-ward']);
    w.sides.a.hand.push({ id: 'V', card: 'void-drain' }, { id: 'W', card: 'wound' });
    w = play(w, 'kindling-ward');
    expect(w.sides.a.hand.filter((x) => x.card === 'tinder')).toHaveLength(2);
    // (Fresh Start: every card goes back into the draw pile, then 4 are drawn)
    let f = fight(['fresh-start']);
    f.sides.a.discard = [
      { id: 'X1', card: 'strike' },
      { id: 'X2', card: 'defend' },
    ];
    f = play(f, 'fresh-start');
    expect(f.sides.a.hand).toHaveLength(4);
    // Thunder Memory: one Thunderbird plus one for each already planted this fight.
    let v = fight(['thunder-memory']);
    v.sides.a.channeledBy = { thunderbird: 2 };
    v.sides.a.totems = [null, null, null];
    v.sides.a.mana = 9;
    v = play(v, 'thunder-memory');
    expect(row(v).filter((k) => k === 'thunderbird')).toHaveLength(3);
    // (Shattering Call: 7 to all, then every totem acts twice)
    let h = fight(['shattering-call'], ['squire', 'squire']);
    h = play(h, 'shattering-call');
    expect(row(h)).toEqual([null, null, null]);
    expect(lost(h).every((n) => n > 7)).toBe(true);
    // (Return of the Free: every 0-cost card in your discard pile comes back)
    let r = fight(['return-of-the-free']);
    r.sides.a.discard = [
      { id: 'Z1', card: 'spark-strike' },
      { id: 'Z2', card: 'strike' },
    ];
    r = play(r, 'return-of-the-free', foe(r).id);
    expect(r.sides.a.hand.map((x) => x.card)).toContain('spark-strike');
    expect(r.sides.a.hand.map((x) => x.card)).not.toContain('strike');
    // (Echoing Strike: a free copy of itself goes into your discard pile)
    let e = fight(['echoing-strike']);
    e = play(e, 'echoing-strike', foe(e).id);
    expect(e.sides.a.discard.filter((x) => x.card === 'echoing-strike')).toHaveLength(1);
    expect(e.sides.a.discard.filter((x) => x.card === 'flame-echo')).toHaveLength(1);
    // (Wild Vision: a random Power joins your hand free this turn)
    let p = fight(['wild-vision']);
    p = play(p, 'wild-vision');
    const power = p.sides.a.hand.find((x) => db.cards[x.card]?.kind === 'power');
    expect(power).toBeTruthy();
    expect(power!.freeTurn).toBe(true);
  });

  it('status payoffs: Blighted Chorus grows with the Status cards in your deck, Harvest of Ruin feeds them, Sweep Away clears the draw pile of them', () => {
    // (3 Wounds from Harvest of Ruin go to the discard pile)
    let h = fight(['harvest-of-ruin']);
    h = play(h, 'harvest-of-ruin');
    expect(h.sides.a.discard.filter((x) => x.card === 'wound')).toHaveLength(3);
    // (Blighted Chorus: 2 hits, harder per Status card)
    let b = fight(['blighted-chorus']);
    b.sides.a.discard = [
      { id: 'W1', card: 'wound' },
      { id: 'W2', card: 'wound' },
      { id: 'W3', card: 'void-drain' },
    ];
    b = play(b, 'blighted-chorus');
    expect(lost(b)).toEqual([2 * (5 + 2 * 3)]);
    // (Sweep Away: only the Status cards leave the draw pile)
    let w = fight(['sweep-away']);
    w.sides.a.draw = [
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'wound' },
      { id: 'D3', card: 'void-drain' },
    ];
    w = play(w, 'sweep-away');
    expect(w.sides.a.draw.map((x) => x.card)).toEqual(['strike']);
    expect(
      w.sides.a.discard.filter((x) => x.card === 'wound' || x.card === 'void-drain'),
    ).toHaveLength(2);
  });

  it('Thunder Chant: a commanded Thunderbird deals 5 more; its end-of-turn effect does not change; Spirit Lance draws', () => {
    let s = fight(['thunder-chant', 'spirit-call'], ['squire', 'squire']);
    s.sides.a.totems = ['thunderbird', null, null];
    s = play(s, 'thunder-chant');
    s = play(s, 'spirit-call');
    // (Spirit Call acts it twice: 8 + 5 to every enemy, each time)
    expect(lost(s)).toEqual([26, 26]);
    let l = fight(['spirit-lance']);
    l.sides.a.draw = Array.from({ length: 6 }, (_, n) => ({
      id: 'L' + n,
      card: n < 2 ? 'strike' : 'spark-strike',
    }));
    l.sides.a.hand = [{ id: 'SL', card: 'spirit-lance' }];
    l = play(l, 'spirit-lance', foe(l).id);
    // (4 drawn: the 1-cost Strikes are discarded, the free Spark Strikes stay)
    expect(l.sides.a.hand.every((c) => c.card === 'spark-strike')).toBe(true);
  });

  it('from the real full starting row: planting commands the front, and Thunder Memory counts the starting Thunderbird', () => {
    const { state } = createCombat(db, {
      seed: 'sh-two',
      a: { hero: 'shaman', deck: RIFTWALKERS.shaman.starter },
      b: { enemies: ['squire'] },
    });
    const start = (hand: string[]): CombatState => {
      const s = clone(state);
      s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
      s.sides.a.mana = 9;
      for (const u of s.sides.b.units) u.hp = u.maxHp = 200;
      return s;
    };
    // The full starting row pushes out the Hawk for 7 damage.
    const raised = play(start(['raise-the-hawk']), 'raise-the-hawk');
    expect(row(raised)).toEqual(['bear', 'thunderbird', 'hawk']);
    expect(foe(raised).hp).toBe(193);
    // Unchanged Thunder Memory plants one plus the one already planted at fight start.
    const memory = play(start(['thunder-memory']), 'thunder-memory');
    expect(row(memory)).toEqual(['thunderbird', 'thunderbird', 'thunderbird']);
    expect(foe(memory).hp).toBe(193);
    expect(hero(memory).barrier).toBe(6);
  });

  it("starts with ten cards including basic Hawk's Dive instead of a fourth Strike", () => {
    const deck = RIFTWALKERS.shaman.starter;
    expect(deck).toHaveLength(10);
    expect(deck.filter((id) => id === 'strike')).toHaveLength(3);
    expect(deck.filter((id) => id === 'hawks-dive')).toHaveLength(1);
    for (const id of ['hawks-dive', 'hawks-dive+']) {
      expect(db.cards[id]!.rarity).toBe('basic');
      expect(db.cards[id]!.cost).toBe(1);
    }
    expect(rewardPool('shaman')).not.toContain('hawks-dive');
    for (const [id, damage] of [
      ['hawks-dive', 7],
      ['hawks-dive+', 10],
    ] as const) {
      const s = fight([id]);
      const result = play(s, id, foe(s).id);
      expect(lost(result)).toEqual([damage + 7]);
      expect(row(result)).toEqual(['bear', 'thunderbird', 'hawk']);
      expect(result.sides.a.mana).toBe(8);
    }
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
        JSON.stringify(up!.effects) !== JSON.stringify(c.effects) ||
          up!.innate ||
          up!.cost !== c.cost ||
          up!.ethereal !== c.ethereal ||
          up!.xBonus !== c.xBonus ||
          up!.exhaust !== c.exhaust,
        c.id,
      ).toBeTruthy();
      expect(cardText(db, c).length, c.id).toBeGreaterThan(3);
    }
  });

  it('pool: about 88 reward-eligible cards, 19 Auras', () => {
    const own = rewardPool('shaman').filter((id) => db.cards[id]?.hero === 'shaman');
    expect(own.length).toBeGreaterThanOrEqual(80);
    expect(own.length).toBeLessThanOrEqual(145);
    expect(own.filter((id) => db.cards[id]?.kind === 'power')).toHaveLength(20);
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
    // (Inferno+ 38 + Primed 6; its Burn ticks later; Spirit Call acts the Owl twice: 6 + 6 more)
    expect(dealt).toBe(38 + 6 + 12);
    expect(dealt).toBeLessThan(540 / 5);
  });
});
