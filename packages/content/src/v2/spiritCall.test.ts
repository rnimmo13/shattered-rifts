// Spirit Call commands the front totem twice (Robert, 2026-10-30: a friend was not sure it works): every kind of totem acts two times
// and then leaves, each act answers "a totem acts", and the Heavy Hitter never counts a companion that is already dead.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatEvent,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const deck = RIFTWALKERS.shaman.starter;
  const { state } = createCombat(db, {
    seed: 'spirit-call',
    a: { hero: 'shaman', deck: [...deck, ...deck] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = Array.from({ length: 12 }, (_, i) => ({ id: `D${i}`, card: 'defend' }));
  s.sides.a.discard = [];
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
    u.intent = null;
  }
  return s;
}
const play = (s: CombatState, id: string): { s: CombatState; events: CombatEvent[] } => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  const r = applyAction(db, s, act!);
  return { s: r.state, events: r.events };
};
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;
const lost = (s: CombatState): number => 500 - s.sides.b.units[0]!.hp;
const acts = (events: CombatEvent[]): number => events.filter((e) => e.type === 'command').length;

describe('Spirit Call', () => {
  it('says it commands the front totem twice, and costs 0 when upgraded', () => {
    expect(cardText(db, db.cards['spirit-call']!)).toBe('Command your front totem twice.');
    expect(db.cards['spirit-call+']!.cost).toBe(0);
  });

  it('makes a Hawk act twice (7 + 7), once for each act, and the Hawk is gone', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = ['hawk', null, null];
    const { s, events } = play(s0, 'spirit-call');
    expect(acts(events)).toBe(2);
    expect(lost(s)).toBe(14);
    expect(s.sides.a.totems).toEqual([null, null, null]);
  });

  it('makes a Bear give 6 Barrier twice', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = ['bear', null, null];
    const { s, events } = play(s0, 'spirit-call');
    expect(acts(events)).toBe(2);
    expect(hero(s).barrier).toBe(12);
  });

  it('makes a Thunderbird hit every enemy twice (8 + 8)', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = ['thunderbird', null, null];
    const { s, events } = play(s0, 'spirit-call');
    expect(acts(events)).toBe(2);
    expect(lost(s)).toBe(16);
  });

  it('makes an Elder Tree give its 2 Mana twice', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = ['elder', null, null];
    const { s, events } = play(s0, 'spirit-call');
    expect(acts(events)).toBe(2);
    // (9 Mana, 1 for the card, 2 + 2 from the Tree)
    expect(s.sides.a.mana).toBe(9 - 1 + 4);
  });

  it('acts only the front totem: the one behind it stays', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = ['hawk', 'bear', null];
    const { s, events } = play(s0, 'spirit-call');
    expect(acts(events)).toBe(2);
    expect(s.sides.a.totems).toEqual(['bear', null, null]);
    expect(hero(s).barrier).toBe(0);
  });

  it('with Spirit, each act is stronger (Hawk 7 + 2 Spirit, twice)', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = ['hawk', null, null];
    hero(s0).statuses.spirit = 2;
    const { s } = play(s0, 'spirit-call');
    expect(lost(s)).toBe((7 + 2) * 2);
  });

  it('does nothing, and costs the Mana, with no totem standing', () => {
    const s0 = fight(['spirit-call']);
    s0.sides.a.totems = [null, null, null];
    const { s, events } = play(s0, 'spirit-call');
    expect(acts(events)).toBe(0);
    expect(lost(s)).toBe(0);
  });
});

describe('Heavy Hitter', () => {
  it('reads the biggest companion that is alive, never one that has died', () => {
    const { state } = createCombat(db, {
      seed: 'heavy-hitter',
      a: { hero: 'engineer', deck: [...RIFTWALKERS.engineer.starter, ...RIFTWALKERS.engineer.starter] },
      b: { enemies: ['squire'] },
    });
    let s = clone(state);
    s.sides.a.hand = ['build-enforcer', 'heavy-hitter'].map((card, i) => ({ id: `T${i}`, card }));
    s.sides.a.mana = 9;
    const play2 = (id: string): void => {
      const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
      expect(act, `${id} playable`).toBeTruthy();
      s = applyAction(db, s, act!).state;
    };
    play2('T0');
    const foe = () => s.sides.b.units[0]!;
    foe().hp = foe().maxHp = 200;
    foe().barrier = 0;
    const crew = () => s.sides.a.units.filter((u) => u.kind === 'ally');
    const enforcer = crew().find((u) => u.maxHp === 12)!;
    const drone = crew().find((u) => u.maxHp !== 12)!;
    // the Enforcer has fallen (it is still in the list at 0 HP, as when an attack has just killed it)
    enforcer.hp = 0;
    play2('T1');
    expect(200 - foe().hp).toBe(drone.maxHp);
    expect(cardText(db, db.cards['heavy-hitter']!)).toMatch(/living/);
  });
});
