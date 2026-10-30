// Defer (Robert, 2026-10-30): a card of your hand waits a turn and comes back costing 1 less for that turn. A card that costs 0
// and an X card are not offered; a deferred card is set aside, not discarded; the 1 off stacks with other cost cuts.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  costOf,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const deck = RIFTWALKERS.assassin.starter;
  const { state } = createCombat(db, {
    seed: 'defer-test',
    a: { hero: 'assassin', deck: [...deck, ...deck] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = Array.from({ length: 12 }, (_, i) => ({ id: `D${i}`, card: 'defend' }));
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
  }
  return s;
}
/** play the first card in hand with this id, and leave any choice it asks for open */
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const target = s.sides.b.units[0]?.id;
  const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === inst?.id);
  const act = acts.find((a) => a.type === 'play' && (!a.target || a.target === target)) ?? acts[0];
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const pick = (s: CombatState, ...cards: string[]): CombatState =>
  applyAction(db, s, { type: 'pick', cards }).state;
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;

describe('Defer', () => {
  it('Stalker\'s Lunge asks for a card: it leaves now, is not discarded, and comes back next turn costing 1 less', () => {
    let s = play(fight(['stalkers-lunge', 'dirty-hit', 'strike']), 'stalkers-lunge');
    expect(s.pending?.kind).toBe('defer');
    expect(s.pending?.pool.sort()).toEqual(['T1', 'T2']);
    s = pick(s, 'T1');
    expect(s.pending).toBeNull();
    expect(s.sides.a.hand.some((c) => c.id === 'T1')).toBe(false);
    expect(s.sides.a.deferring?.map((c) => c.card)).toEqual(['dirty-hit']);
    // (set aside, not discarded: nothing that answers a discard hears of it)
    expect(s.sides.a.discard.map((c) => c.card)).toEqual(['stalkers-lunge']);
    expect(s.sides.a.discarded).toBe(0);
    s = endTurn(s);
    const back = s.sides.a.hand.find((c) => c.id === 'T1');
    expect(back?.deferred).toBe(true);
    expect(costOf(db, s.sides.a, back!)).toBe(0);
    // (the regular hand is drawn too, and the card comes on top of it)
    expect(s.sides.a.hand.length).toBeGreaterThan(RIFTWALKERS.assassin.hero.handSize);
    // the 1 off is spent when it is played
    const mana = s.sides.a.mana;
    s = play(s, 'dirty-hit');
    expect(s.sides.a.mana).toBe(mana);
    const played = s.sides.a.discard.find((c) => c.id === 'T1');
    expect(played?.deferred).toBeUndefined();
    expect(costOf(db, s.sides.a, played!)).toBe(1);
  });

  it('its 1 off is for the turn it comes back: unplayed, it is full price again', () => {
    let s = pick(play(fight(['stalkers-lunge', 'sweep-the-leg', 'strike']), 'stalkers-lunge'), 'T1');
    s = endTurn(s);
    expect(s.sides.a.hand.find((c) => c.id === 'T1')?.deferred).toBe(true);
    s = endTurn(s);
    const card = [...s.sides.a.hand, ...s.sides.a.discard, ...s.sides.a.draw].find((c) => c.id === 'T1');
    expect(card?.deferred).toBeUndefined();
    expect(costOf(db, s.sides.a, card!)).toBe(db.cards['sweep-the-leg']!.cost);
  });

  it('a card that costs 0 and an X card are not offered; with nothing to take it does nothing', () => {
    const s = play(fight(['stalkers-lunge', 'quick-slash', 'run-through']), 'stalkers-lunge');
    expect(s.pending).toBeNull();
    expect(s.sides.a.deferring ?? []).toHaveLength(0);
    expect(s.sides.a.hand.map((c) => c.card).sort()).toEqual(['quick-slash', 'run-through']);
  });

  it('a lone card that qualifies is deferred without asking', () => {
    const s = play(fight(['stalkers-lunge', 'quick-slash', 'dirty-hit']), 'stalkers-lunge');
    expect(s.pending).toBeNull();
    expect(s.sides.a.deferring?.map((c) => c.card)).toEqual(['dirty-hit']);
  });

  it('it stacks with another cost cut, and never goes below 0', () => {
    const s0 = fight(['palm-switch', 'sweep-the-leg']);
    s0.sides.a.hand[1]!.costDown = 1;
    let s = play(s0, 'palm-switch');
    // (cost 2, 1 less for the rest of the fight: it costs 1, so it can be deferred)
    expect(s.pending).toBeNull();
    s = endTurn(s);
    const back = s.sides.a.hand.find((c) => c.card === 'sweep-the-leg')!;
    expect(db.cards['sweep-the-leg']!.cost).toBe(2);
    expect(costOf(db, s.sides.a, back)).toBe(0);
    back.costDown = 3;
    expect(costOf(db, s.sides.a, back)).toBe(0);
  });

  it('Palm Switch: 7 Barrier, and a chosen card comes back cheaper', () => {
    let s = play(fight(['palm-switch', 'sweep-the-leg', 'dirty-hit']), 'palm-switch');
    expect(hero(s).barrier).toBe(7);
    s = pick(s, 'T1');
    expect(s.sides.a.deferring?.map((c) => c.card)).toEqual(['sweep-the-leg']);
  });

  it('Into the Shadows: defer up to 3, discard the rest of the hand, gain Poised', () => {
    let s = play(
      fight(['into-the-shadows', 'sweep-the-leg', 'dirty-hit', 'backspring', 'quick-slash', 'strike']),
      'into-the-shadows',
    );
    expect(s.pending?.kind).toBe('defer');
    expect(s.pending?.min).toBe(0);
    expect(s.pending?.max).toBe(3);
    s = pick(s, 'T1', 'T2');
    expect(s.pending).toBeNull();
    expect(hero(s).statuses.poised).toBe(1);
    expect(s.sides.a.hand).toHaveLength(0);
    expect(s.sides.a.deferring?.map((c) => c.card).sort()).toEqual(['dirty-hit', 'sweep-the-leg']);
    // (the rest was discarded: Backspring, Quick Slash and Strike, and Into the Shadows itself is played)
    expect(s.sides.a.discarded).toBe(3);
    s = endTurn(s);
    expect(s.sides.a.hand.filter((c) => c.deferred).map((c) => c.card).sort()).toEqual([
      'dirty-hit',
      'sweep-the-leg',
    ]);
  });

  it('Into the Shadows can defer nothing', () => {
    let s = play(fight(['into-the-shadows', 'sweep-the-leg', 'dirty-hit']), 'into-the-shadows');
    s = pick(s);
    expect(s.sides.a.deferring ?? []).toHaveLength(0);
    expect(s.sides.a.discarded).toBe(2);
  });

  it('a full hand at the start of the turn never discards a deferred card: it waits on top of the draw pile, still cheaper', () => {
    let s = pick(play(fight(['stalkers-lunge', 'dirty-hit', 'strike']), 'stalkers-lunge'), 'T1');
    s.sides.a.draw = Array.from({ length: 20 }, (_, i) => ({ id: 'F' + i, card: 'defend' }));
    // (a hand drawn up to the limit leaves no room for it)
    s.sides.a.handSize = 10;
    s = endTurn(s);
    expect(s.sides.a.hand.some((c) => c.id === 'T1')).toBe(false);
    expect(s.sides.a.discard.some((c) => c.id === 'T1')).toBe(false);
    expect(s.sides.a.draw[0]?.id).toBe('T1');
    expect(s.sides.a.draw[0]?.deferred).toBe(true);
    // it comes with the next draw, and still costs 1 less
    s = endTurn(s);
    const back = s.sides.a.hand.find((c) => c.id === 'T1');
    expect(back?.deferred).toBe(true);
    expect(costOf(db, s.sides.a, back!)).toBe(0);
  });

  it('a card that is both deferred and Premeditate costs 0 and loses both when it is played', () => {
    const s0 = fight(['cartwheel-cut']);
    const c = s0.sides.a.hand[0]!;
    c.deferred = true;
    c.premeditated = true;
    expect(costOf(db, s0.sides.a, c)).toBe(0);
    const s = play(s0, 'cartwheel-cut');
    const played = s.sides.a.discard.find((x) => x.id === 'T0');
    expect(played?.deferred).toBeUndefined();
    expect(played?.premeditated).toBeUndefined();
  });

  it('an Aura or trigger may not use Defer (it asks the player to choose)', () => {
    expect(db.cards['grand-scheme']!.effects.some((o) => o.op === 'defer')).toBe(false);
  });

  it('the cards say it', () => {
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('stalkers-lunge')).toBe('Deal 15 damage. Defer a card.');
    expect(text('side-slip')).toBe('Defer a card.');
    expect(text('palm-switch')).toBe('Gain 7 Barrier. Defer a card.');
    expect(text('quick-reflexes')).toBe('Premeditate. Draw 1 card. Defer a card.');
    expect(text('cartwheel-cut')).toBe('Premeditate. Deal 5 damage to ALL enemies. Defer a card.');
    expect(text('into-the-shadows')).toBe('Defer up to 3 cards. Discard your hand. Gain 1 Poised.');
    expect(db.cards['into-the-shadows']!.cost).toBe(2);
  });
});
