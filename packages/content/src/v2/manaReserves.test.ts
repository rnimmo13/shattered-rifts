// The Mana Reserves (Robert, 2026-10-30, DECISIONS #452, #454): unspent Mana is not lost, it is kept as Reserves, up to the Max Reserves
// (3); cards spend the turn's Mana first and Reserves after it; some cards raise the Max Reserves. No other class keeps Mana.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hero: 'knight' | 'assassin', hand: string[] = []): CombatState {
  const deck = RIFTWALKERS[hero].starter;
  const { state } = createCombat(db, {
    seed: 'vow-test',
    a: { hero, deck: [...deck, ...deck] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
    u.intent = null;
  }
  if (hand.length) {
    s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
    s.sides.a.draw = Array.from({ length: 12 }, (_, i) => ({ id: `D${i}`, card: 'defend' }));
    s.sides.a.discard = [];
  }
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === inst?.id);
  const act = acts.find((a) => a.type === 'play' && (!a.target || a.target === s.sides.b.units[0]!.id)) ?? acts[0];
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;
const lost = (s: CombatState, i = 0): number => 500 - s.sides.b.units[i]!.hp;

describe("the Mana Reserves trait", () => {
  it('is the Knight’s trait: Max Reserves 3, and no opening Barrier or Plating', () => {
    const t = RIFTWALKERS.knight.trait;
    expect(t.name).toBe('Mana Reserves');
    expect(t.maxReserves).toBe(3);
    const s = fight('knight');
    expect(s.sides.a.maxReserves).toBe(3);
    expect(s.sides.a.reserves).toBe(0);
    expect(hero(s).barrier).toBe(0);
    expect(hero(s).statuses.plating).toBeUndefined();
  });

  it('unspent Mana is kept as Reserves, and the next turn still gives the usual 3', () => {
    const s = endTurn(fight('knight'));
    expect(s.sides.a.reserves).toBe(3);
    expect(s.sides.a.mana).toBe(3);
  });

  it('only what is left over is kept, and no more than the Max Reserves', () => {
    const a = fight('knight');
    a.sides.a.mana = 1;
    expect(endTurn(a).sides.a.reserves).toBe(1);
    const b = fight('knight');
    b.sides.a.mana = 7;
    const sb = endTurn(b);
    expect(sb.sides.a.reserves).toBe(3);
    // (full: more unspent Mana is lost)
    expect(endTurn(sb).sides.a.reserves).toBe(3);
    const c = fight('knight');
    c.sides.a.mana = 0;
    expect(endTurn(c).sides.a.reserves).toBe(0);
  });

  it('cards spend the Mana of the turn first, and Reserves after it', () => {
    let s = fight('knight', ['hammer-fall', 'twin-cut', 'twin-cut']);
    s.sides.a.reserves = 3;
    s.sides.a.mana = 3;
    // (Hammer Fall costs 3: all from Mana, so the Reserves are untouched)
    s = play(s, 'hammer-fall');
    expect(s.sides.a.mana).toBe(0);
    expect(s.sides.a.reserves).toBe(3);
    // (no Mana left: the next card is paid from the Reserves)
    s = play(s, 'twin-cut');
    expect(s.sides.a.reserves).toBe(2);
    s = play(s, 'twin-cut');
    expect(s.sides.a.reserves).toBe(1);
  });

  it('a card costing more than the Mana of the turn can be paid with Reserves', () => {
    const s = fight('knight', ['hammer-fall']);
    s.sides.a.mana = 1;
    s.sides.a.reserves = 2;
    const next = play(s, 'hammer-fall');
    expect(next.sides.a.mana).toBe(0);
    expect(next.sides.a.reserves).toBe(0);
    // (not enough of both: it cannot be played)
    const poor = fight('knight', ['hammer-fall']);
    poor.sides.a.mana = 1;
    poor.sides.a.reserves = 1;
    expect(legalActions(db, poor).some((a) => a.type === 'play')).toBe(false);
  });

  it('an X card spends the Mana and all the Reserves', () => {
    let s = fight('knight', ['whirling-blade']);
    s.sides.a.mana = 3;
    s.sides.a.reserves = 3;
    s = play(s, 'whirling-blade');
    // (Whirling Blade: 5 damage X times to ALL enemies, X = 6)
    expect(lost(s)).toBe(5 * 6);
    expect(s.sides.a.mana).toBe(0);
    expect(s.sides.a.reserves).toBe(0);
  });

  it('other classes keep nothing', () => {
    const s = endTurn(fight('assassin'));
    expect(s.sides.a.reserves).toBe(0);
    expect(s.sides.a.maxReserves).toBe(0);
  });
});

describe('the Reserves cards', () => {
  it('Stand Fast: 5 Barrier and 1 Plating, and 2 more Max Reserves for this turn only, so more Mana is kept', () => {
    let s = play(fight('knight', ['stand-fast']), 'stand-fast');
    expect(hero(s).barrier).toBe(5);
    expect(hero(s).statuses.plating).toBe(1);
    expect(s.sides.a.mana).toBe(2);
    s.sides.a.mana = 5;
    s = endTurn(s);
    expect(s.sides.a.reserves).toBe(5);
    // (the extra limit is gone next turn, but nothing already kept is lost)
    s = endTurn(s);
    expect(s.sides.a.reserves).toBe(5);
  });

  it('Oath Unbroken raises the Max Reserves for good, and 4 or more Reserves at the end of the turn give 3 Might', () => {
    let s = fight('knight', ['oath-unbroken']);
    s.sides.a.mana = 3;
    s = play(s, 'oath-unbroken');
    expect(s.sides.a.maxReserves).toBe(5);
    s.sides.a.reserves = 4;
    s = endTurn(s);
    expect(hero(s).statuses.might).toBe(3);
  });

  it('Measured Strike: 7, and 5 more with 2 or more Reserves', () => {
    const a = fight('knight', ['measured-strike']);
    expect(lost(play(a, 'measured-strike'))).toBe(7);
    const b = fight('knight', ['measured-strike']);
    b.sides.a.reserves = 2;
    expect(lost(play(b, 'measured-strike'))).toBe(12);
  });

  it('Vow Kept: 3, and 5 for every Reserve (the cost is paid with Mana first)', () => {
    const a = fight('knight', ['vow-kept']);
    a.sides.a.reserves = 3;
    expect(lost(play(a, 'vow-kept'))).toBe(3 + 5 * 3);
    // (no Mana: the cost takes a Reserve first)
    const b = fight('knight', ['vow-kept']);
    b.sides.a.mana = 0;
    b.sides.a.reserves = 3;
    expect(lost(play(b, 'vow-kept'))).toBe(3 + 5 * 2);
  });

  it('Vow Fulfilled: 18, and 7 for every Reserve', () => {
    const s = fight('knight', ['vow-fulfilled']);
    s.sides.a.reserves = 3;
    expect(lost(play(s, 'vow-fulfilled'))).toBe(18 + 7 * 3);
  });

  it('Blood Oath: 3 HP for 3 Reserves, never past the Max Reserves', () => {
    let s = play(fight('knight', ['blood-oath']), 'blood-oath');
    expect(s.sides.a.reserves).toBe(3);
    expect(hero(s).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 3);
    s = fight('knight', ['blood-oath']);
    s.sides.a.reserves = 2;
    s = play(s, 'blood-oath');
    expect(s.sides.a.reserves).toBe(3);
  });

  it('Patient Wall: 4 Barrier for every Reserve at the end of the turn (Mana just kept counts)', () => {
    let s = fight('knight', ['patient-wall']);
    s = play(s, 'patient-wall');
    // (2 Reserves already, and the 1 Mana left over is kept first: 3 Reserves, 12 Barrier)
    s.sides.a.reserves = 2;
    s.sides.a.mana = 1;
    const res = applyAction(db, s, { type: 'endTurn' });
    expect(res.state.sides.a.reserves).toBe(3);
    const gains = res.events.filter((e) => e.type === 'barrier' && e.target === hero(s).id);
    expect(gains.some((e) => e.type === 'barrier' && e.amount === 12)).toBe(true);
  });

  it('Unyielding Line: with 10 or more Barrier at the end of the turn, gain 2 Reserves', () => {
    let s = fight('knight', ['unyielding-line']);
    s.sides.a.mana = 1;
    s = play(s, 'unyielding-line');
    hero(s).barrier = 10;
    s = endTurn(s);
    expect(s.sides.a.reserves).toBe(2);
    const t = fight('knight', ['unyielding-line']);
    const t2 = play(t, 'unyielding-line');
    hero(t2).barrier = 9;
    t2.sides.a.mana = 0;
    expect(endTurn(t2).sides.a.reserves).toBe(0);
  });

  it('Gilded Bulwark: while you hold 10 or more Barrier, each Attack hits a random enemy for 6 more', () => {
    let s = fight('knight', ['gilded-bulwark', 'twin-cut']);
    s = play(s, 'gilded-bulwark');
    hero(s).barrier = 10;
    s = play(s, 'twin-cut');
    // (Twin Cut: 5 twice, and 6 more from the Bulwark)
    expect(lost(s) + lost(s, 1)).toBe(5 * 2 + 6);
    const t = play(fight('knight', ['gilded-bulwark', 'twin-cut']), 'gilded-bulwark');
    hero(t).barrier = 9;
    const t2 = play(t, 'twin-cut');
    expect(lost(t2) + lost(t2, 1)).toBe(10);
  });

  it('Cast the Shield spends all your Barrier for 2 damage each', () => {
    const s0 = fight('knight', ['cast-the-shield']);
    hero(s0).barrier = 10;
    const s = play(s0, 'cast-the-shield');
    expect(lost(s)).toBe(20);
    expect(hero(s).barrier).toBe(0);
  });

  it('Hardened Scars: 3 Barrier whenever you lose HP to your own cards', () => {
    let s = fight('knight', ['hardened-scars', 'blood-oath']);
    s = play(s, 'hardened-scars');
    s = play(s, 'blood-oath');
    expect(hero(s).barrier).toBe(3);
  });

  it('Scarred Hide: every time you lose HP, to your own cards or to an enemy, a random enemy is Sapped for 3', () => {
    let s = fight('knight', ['scarred-hide', 'blood-oath']);
    s = play(s, 'scarred-hide');
    s = play(s, 'blood-oath');
    const sapped = (x: CombatState): number =>
      x.sides.b.units.reduce((n, u) => n + (u.statuses.sapped ?? 0), 0);
    expect(sapped(s)).toBe(3);
    // (an enemy hit counts too)
    const t = play(fight('knight', ['scarred-hide']), 'scarred-hide');
    for (const u of t.sides.b.units) u.intent = { move: 'slash', target: hero(t).id };
    const res = applyAction(db, t, { type: 'endTurn' });
    expect(res.events.some((e) => e.type === 'status' && e.status === 'sapped' && e.amount === 3)).toBe(true);
    // (the hit really cost HP)
    expect(res.events.some((e) => e.type === 'damage' && e.target === hero(t).id && e.lost > 0)).toBe(true);
    // (a hit that Barrier soaks completely costs no HP: nothing is Sapped)
    const soaked = play(fight('knight', ['scarred-hide']), 'scarred-hide');
    hero(soaked).barrier = 500;
    for (const u of soaked.sides.b.units) u.intent = { move: 'slash', target: hero(soaked).id };
    const none = applyAction(db, soaked, { type: 'endTurn' });
    expect(none.events.some((e) => e.type === 'status' && e.status === 'sapped')).toBe(false);
    expect(cardText(db, db.cards['scarred-hide']!)).toBe("Whenever you lose HP: Apply 3 Sapped to a random enemy until the end of the enemy's turn.");
  });

  it('some Barrier cards split their Barrier with Plating (2 Barrier for 1 Plating)', () => {
    const s = play(fight('knight', ['oath-of-iron']), 'oath-of-iron');
    expect(hero(s).barrier).toBe(6);
    expect(hero(s).statuses.plating).toBe(1);
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('oath-of-iron')).toContain('Gain 6 Barrier. Gain 1 Plating.');
    expect(text('ember-ward')).toContain('Gain 8 Barrier. Gain 2 Plating.');
    expect(text('blood-plate')).toContain('Gain 12 Barrier. Gain 2 Plating.');
    expect(text('dawn-smite')).toContain('Gain 3 Barrier. Gain 1 Plating.');
  });

  it('the cards say it', () => {
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('stand-fast')).toBe('Gain 5 Barrier. Gain 1 Plating. Max Reserves +2 this turn.');
    expect(text('blood-oath')).toBe('Lose 3 HP. Gain 3 Reserves.');
    expect(text('oath-unbroken')).toContain('Max Reserves +2 for the rest of the fight.');
    expect(text('unyielding-line')).toContain('Gain 2 Reserves.');
  });
});
