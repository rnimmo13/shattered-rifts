// The Trickster's Suits (DECISIONS #387): every card shows a suit; the first time in a turn all four show, a Full Trick goes off.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  suitOf,
  type CombatState,
  type CombatEvent,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], hero: 'trickster' | 'knight' = 'trickster'): CombatState {
  const { state } = createCombat(db, {
    seed: 'suits-test',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
  }
  return s;
}
const play = (s: CombatState, id: string) => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!);
};
const playAll = (s: CombatState, ids: string[]) => {
  const events: CombatEvent[] = [];
  for (const id of ids) {
    const r = play(s, id);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
};
const foe = (s: CombatState) => s.sides.b.units[0]!;

describe('Suits', () => {
  it('reads a suit from what a card does', () => {
    const suit = (id: string) => suitOf(db.cards[id]!);
    expect(suit('strike')).toBe('spades');
    expect(suit('defend')).toBe('hearts');
    expect(suit('cold-read')).toBe('diamonds');
    expect(suit('set-the-web')).toBe('clubs');
    expect(suit('mark-prey')).toBe('clubs');
    expect(suit('wild-card')).toBe('wild');
  });

  it('shows each suit once, and the fourth makes a Full Trick: 5 to every enemy and a card', () => {
    const s0 = fight(['strike', 'defend', 'pick-a-card', 'mark-prey', 'strike']);
    const three = playAll(s0, ['strike', 'defend', 'mark-prey']).state;
    expect(three.sides.a.suitsTurn).toEqual(['spades', 'hearts', 'clubs']);
    const hp = foe(three).hp;
    const hand = three.sides.a.hand.length;
    const r = play(three, 'pick-a-card');
    expect(r.state.sides.a.suitsTurn).toEqual(['spades', 'hearts', 'diamonds', 'clubs']);
    expect(r.events.some((e) => e.type === 'suits' && e.full)).toBe(true);
    // (the Full Trick waits for the card to finish: Pick a Card's Foresee asks for a choice first)
    expect(foe(r.state).hp).toBe(hp);
    const pending = r.state.pending!;
    const done = applyAction(db, r.state, { type: 'pick', cards: [pending.pool[0]!] }).state;
    expect(foe(done).hp).toBe(hp - 5);
    // (Pick a Card left the hand, Foresee drew one, the Full Trick drew one)
    expect(done.sides.a.hand.length).toBe(hand + 1);
    expect(done.sides.a.fullTrickTurn).toBe(true);
  });

  it('a Full Trick goes off once a turn, and a new turn clears the suits', () => {
    let s = playAll(fight(['strike', 'defend', 'cold-read', 'mark-prey']), [
      'strike',
      'defend',
      'cold-read',
    ]).state;
    if (s.pending) s = applyAction(db, s, { type: 'pick', cards: [s.pending.pool[0]!] }).state;
    s = play(s, 'mark-prey').state;
    expect(s.sides.a.fullTrickTurn).toBe(true);
    const next = applyAction(db, s, { type: 'endTurn' }).state;
    expect(next.sides.a.suitsTurn).toEqual([]);
    expect(next.sides.a.fullTrickTurn).toBe(false);
  });

  it('the card that lights the fourth suit strikes first: the Full Trick never takes its target from it', () => {
    let s = playAll(fight(['defend', 'mark-prey', 'pick-a-card', 'strike']), [
      'defend',
      'mark-prey',
      'pick-a-card',
    ]).state;
    s = applyAction(db, s, { type: 'pick', cards: [s.pending!.pool[0]!] }).state;
    foe(s).hp = 4;
    const target = foe(s).id;
    const r = play(s, 'strike');
    const hits = r.events.filter((e) => e.type === 'damage' && e.target === target);
    // (one hit lands on it, the Strike's: 6 on an Exposed target, more than the Full Trick's flat 5)
    expect(hits).toHaveLength(1);
    expect(hits[0]!.type === 'damage' && hits[0].amount).toBeGreaterThan(5);
    expect(r.state.sides.a.fullTrickTurn).toBe(true);
  });

  it('a Wild card shows every suit at once', () => {
    const s = play(fight(['wild-card']), 'wild-card').state;
    expect(s.sides.a.suitsTurn).toHaveLength(4);
    expect(s.sides.a.fullTrickTurn).toBe(true);
  });

  it('only a hero with Suits keeps them', () => {
    const s = play(fight(['strike'], 'knight'), 'strike').state;
    expect(s.sides.a.suitsTurn).toBeUndefined();
  });

  it('per-suit payoffs count the card being played; Showstopper costs 1 less a suit', () => {
    // Card Fan: 4 + 3 per suit; after ♥ and ♣ it is the third suit: 13
    const s = playAll(fight(['defend', 'mark-prey', 'card-fan']), ['defend', 'mark-prey']).state;
    const before = foe(s).hp;
    const exposed = foe(s).statuses.exposed ?? 0;
    const after = foe(play(s, 'card-fan').state).hp;
    expect(before - after).toBe(Math.floor(13 * (exposed > 0 ? 1.5 : 1)));
    const show = playAll(fight(['defend', 'mark-prey', 'showstopper']), ['defend', 'mark-prey']);
    const stopper = show.state.sides.a.hand.find((c) => c.card === 'showstopper')!;
    const mana = show.state.sides.a.mana;
    const r = applyAction(db, show.state, {
      type: 'play',
      card: stopper.id,
      target: foe(show.state).id,
    });
    expect(mana - r.state.sides.a.mana).toBe(1);
  });
});
