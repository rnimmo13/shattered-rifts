// The Trickster cost pass (Robert 2026-11-08, DECISIONS #694): Trapmaster's Traps and Barrier grow, Cardsharp draws at three suits,
// the Seer's bonus survives its mark's death, and Showstopper never costs less than 1.
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  costOf,
  createCombat,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], ascendancy?: string, foes = 1): CombatState {
  const { state } = createCombat(db, {
    seed: 'trickster-694',
    a: {
      hero: 'trickster',
      deck: [...RIFTWALKERS.trickster.starter, ...RIFTWALKERS.trickster.starter],
      ...(ascendancy ? { ascendancy: `trickster:${ascendancy}` } : {}),
    },
    b: { enemies: Array<string>(foes).fill('squire') },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
  }
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe('the Trickster cost pass (#694)', () => {
  it('Trapmaster: a sprung Trap gives 2 Barrier plus 1 per Trap sprung this fight, up to 8 more', () => {
    const barrierAfter = (sprung: number): number => {
      let s = fight(['pinprick-trap'], 'trapmaster');
      s = play(s, 'T0');
      s.sides.a.snaresSprung = sprung;
      hero(s).barrier = 0;
      const out = applyAction(db, s, { type: 'endTurn' });
      const gained = out.events
        .filter((e) => e.type === 'barrier' && e.target === hero(s).id)
        .reduce((n, e) => n + (e.type === 'barrier' ? e.amount : 0), 0);
      return gained;
    };
    // (the Trap that springs counts itself: 0 before it means 1 with it)
    expect(barrierAfter(0)).toBe(2 + 1);
    expect(barrierAfter(3)).toBe(2 + 4);
    expect(barrierAfter(30)).toBe(2 + 8);
  });

  it('Cardsharp draws 1 the first time each turn three suits are showing', () => {
    // (♠ an Attack, ♥ protection, ♦ cards: Veil Strike, Shadow Cloak, Pick a Card)
    // (the same plays as a Seer, who does not draw for suits: Cardsharp ends one card ahead, and only one)
    const run = (asc: string): number => {
      let s = fight(['veil-strike', 'shadow-cloak', 'pick-a-card', 'veil-strike'], asc);
      s = play(s, 'T0', foe(s).id);
      s = play(s, 'T1');
      s = play(s, 'T2');
      // (Pick a Card's Foresee is a choice: the bot takes one)
      while (s.pending) s = applyAction(db, s, chooseAction(db, s)).state;
      s = play(s, 'T3', foe(s).id);
      return s.sides.a.hand.length;
    };
    expect(run('cardsharp') - run('seer')).toBe(1);
  });

  it('Seer: when the marked enemy dies, the new mark keeps the bonus', () => {
    let s = fight(['veil-strike', 'veil-strike'], 'seer', 2);
    s = play(s, 'T0', foe(s, 0).id);
    expect(s.sides.a.discipline?.progress).toBe(10);
    // (the mark dies; next turn a new mark grows on from 10, not from scratch)
    s.sides.b.units = s.sides.b.units.filter((u) => u.id !== foe(s, 0).id);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    s.sides.a.mana = 9;
    s.sides.a.hand.push({ id: 'T9', card: 'veil-strike' });
    s = play(s, 'T9', foe(s, 0).id);
    expect(s.sides.a.discipline?.progress).toBe(20);
    // (a mark killed in place, still on the board at 0 HP: the same)
    let k = fight(['veil-strike'], 'seer', 2);
    k = play(k, 'T0', foe(k, 0).id);
    foe(k, 0).hp = 0;
    k = applyAction(db, k, { type: 'endTurn' }).state;
    k.sides.a.mana = 9;
    k.sides.a.hand.push({ id: 'K9', card: 'veil-strike' });
    const live = k.sides.b.units.find((u) => u.hp > 0)!;
    k = play(k, 'K9', live.id);
    expect(k.sides.a.discipline?.progress).toBe(20);
    // (a living mark left for another: back to 10)
    let n = fight(['veil-strike'], 'seer', 2);
    n = play(n, 'T0', foe(n, 0).id);
    n = applyAction(db, n, { type: 'endTurn' }).state;
    n.sides.a.mana = 9;
    n.sides.a.hand.push({ id: 'N9', card: 'veil-strike' });
    n = play(n, 'N9', foe(n, 1).id);
    expect(n.sides.a.discipline?.progress).toBe(10);
  });

  it('Showstopper never costs less than 1, and says so', () => {
    const s = fight(['showstopper']);
    s.sides.a.suitsTurn = ['spades', 'hearts', 'diamonds', 'clubs'];
    expect(costOf(db, s.sides.a, s.sides.a.hand[0]!)).toBe(1);
    expect(cardText(db, db.cards.showstopper!)).toMatch(/never takes it below 1/);
    s.sides.a.suitsTurn = ['spades'];
    expect(costOf(db, s.sides.a, s.sides.a.hand[0]!)).toBe(2);
  });

  it('Patient Guard gives 4 Barrier for each card you hold at the end of your turn', () => {
    let s = fight(['misdirection', 'strike', 'strike']);
    s = play(s, 'T0');
    const held = s.sides.a.hand.length;
    hero(s).barrier = 0;
    const out = applyAction(db, s, { type: 'endTurn' });
    const gained = out.events
      .filter((e) => e.type === 'barrier' && e.target === hero(s).id)
      .reduce((n, e) => n + (e.type === 'barrier' ? e.amount : 0), 0);
    expect(gained).toBe(Math.min(24, 4 * held));
    // (at most 24, however many are held)
    let big = fight(['misdirection', ...Array<string>(9).fill('patient-blade')]);
    big = play(big, 'T0');
    hero(big).barrier = 0;
    const many = applyAction(db, big, { type: 'endTurn' }).events.filter(
      (e) => e.type === 'barrier' && e.target === hero(big).id,
    );
    expect(many.reduce((n, e) => n + (e.type === 'barrier' ? e.amount : 0), 0)).toBe(24);
  });
});
