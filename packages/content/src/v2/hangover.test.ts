// KP's Hangover (DECISIONS #354): drinks pay off now, and at the start of his next turn he loses that much HP, never his last.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], hangover = 0): CombatState {
  const { state } = createCombat(db, {
    seed: 'hangover-test',
    a: { hero: 'drunkard', deck: [...RIFTWALKERS.drunkard.starter, ...RIFTWALKERS.drunkard.starter] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  if (hangover) heroOf(s).statuses.hangover = hangover;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 100;
    u.barrier = 0;
  }
  return s;
}
const heroOf = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const playCard = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
/** end the turn behind a wall of Barrier, so only the Hangover costs HP */
const nextTurn = (s: CombatState): CombatState => {
  heroOf(s).barrier = 999;
  return applyAction(db, s, { type: 'endTurn' }).state;
};

describe("KP's Hangover", () => {
  it('a drink pays now, and the HP goes at the start of the next turn', () => {
    let s = fight(['liquid-lunch']);
    const hp = heroOf(s).hp;
    s = playCard(s, 'T0');
    expect(s.sides.a.mana).toBe(11);
    expect(heroOf(s).statuses.hangover).toBe(3);
    expect(heroOf(s).hp).toBe(hp);
    s = nextTurn(s);
    expect(heroOf(s).hp).toBe(hp - 3);
    expect(heroOf(s).statuses.hangover ?? 0).toBe(0);
  });

  it('never takes the last HP', () => {
    let s = fight([], 10);
    heroOf(s).hp = 2;
    s = nextTurn(s);
    expect(heroOf(s).hp).toBe(1);
    expect(s.winner).toBeFalsy();
  });

  it('counts as losing HP to your own cards (Mean Drunk)', () => {
    let s = fight(['mean-drunk']);
    s = playCard(s, 'T0');
    heroOf(s).statuses.hangover = 3;
    s = nextTurn(s);
    expect(heroOf(s).statuses.might ?? 0).toBe(1);
    expect(heroOf(s).barrier).toBeGreaterThanOrEqual(2);
  });

  it('Bottle to the Head and Bender hit harder the more Hangover you carry', () => {
    let s = fight(['bottle-to-the-head', 'bender'], 4);
    s = playCard(s, 'T0');
    expect(s.sides.b.units[0]!.hp).toBe(87); // 5 + 2 x 4
    s = playCard(s, 'T1');
    expect(s.sides.b.units[0]!.hp).toBe(72); // 3 damage, 1 + 4 times
  });

  it('Hair of the Dog clears the Hangover and leaves a smaller one', () => {
    let s = fight(['hair-of-the-dog'], 9);
    s = playCard(s, 'T0');
    expect(heroOf(s).statuses.hangover).toBe(2);
  });

  it('Sweat It Out heals twice the Hangover and clears it', () => {
    let s = fight(['sweat-it-out'], 5);
    heroOf(s).hp = 30;
    s = playCard(s, 'T0');
    expect(heroOf(s).hp).toBe(40);
    expect(heroOf(s).statuses.hangover ?? 0).toBe(0);
  });

  it('his heals grow with the HP he is missing', () => {
    const at = (hp: number): number => {
      const s = fight(['liquid-dinner']);
      heroOf(s).hp = hp;
      return heroOf(playCard(s, 'T0')).hp - hp;
    };
    expect(at(heroOf(fight([])).maxHp)).toBe(0);
    expect(at(Math.floor(heroOf(fight([])).maxHp / 2))).toBeGreaterThanOrEqual(13);
  });
});
