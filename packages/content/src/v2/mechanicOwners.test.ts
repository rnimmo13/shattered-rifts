// Each class known for its debuffs (DECISIONS #788): Shocked is the Shaman's Storm and the Engineer's, Sapped the Monk's and the
// Necromancer's, Thorns the Knight's (knight.test.ts, manaReserves.test.ts), Debilitated the Trickster's, Brittle the Drunkard's.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
  type StatusId,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function fight(
  hero: HeroId,
  hand: string[],
  enemies: string[] = ['squire', 'squire'],
): CombatState {
  const { state } = createCombat(db, {
    seed: 'mechanic-owners',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  // big, plain enemies, so a number read off them is the card's own
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 300;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
/** the instance in hand holding this card (actions name the instance, T0, T1...) */
const inst = (s: CombatState, id: string): string | undefined =>
  s.sides.a.hand.find((c) => c.card === id)?.id;
const play = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst(s, id));
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState): Unit => s.sides.a.units[s.sides.a.units.length - 1]!;
const foes = (s: CombatState): Unit[] => s.sides.b.units;
const count = (s: CombatState, st: StatusId): number =>
  foes(s).filter((u) => (u.statuses[st] ?? 0) > 0).length;

describe('Shocked: the Shaman’s Storm and the Engineer', () => {
  it('Wind Wall: 4 Barrier and one random enemy Shocked, no Sapped', () => {
    const s = play(fight('shaman', ['wind-wall']), 'wind-wall');
    expect(hero(s).barrier).toBe(4);
    expect(count(s, 'stunned')).toBe(1);
    expect(count(s, 'sapped')).toBe(0);
  });

  it('Static Veil: 6 Barrier and the chosen enemy Shocked', () => {
    const s0 = fight('shaman', ['static-veil']);
    const target = foes(s0)[1]!.id;
    const act = legalActions(db, s0).find(
      (a) => a.type === 'play' && a.card === inst(s0, 'static-veil') && a.target === target,
    );
    expect(act).toBeTruthy();
    const s = applyAction(db, s0, act!).state;
    expect(hero(s).barrier).toBe(6);
    expect(foes(s)[1]!.statuses.stunned).toBe(1);
    expect(foes(s)[0]!.statuses.stunned).toBeUndefined();
  });

  it('Calm Before the Storm: a random enemy Shocked at the start of each turn; upgraded it is in the opening hand', () => {
    let s = play(fight('shaman', ['calm-before-the-storm']), 'calm-before-the-storm');
    expect(count(s, 'stunned')).toBe(0);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(count(s, 'stunned')).toBe(1);
    expect(db.cards['calm-before-the-storm+']!.innate).toBe(true);
  });

  it('Static Field: 3 to every enemy and one random enemy Shocked', () => {
    const s = play(fight('engineer', ['static-field']), 'static-field');
    for (const u of foes(s)) expect(u.hp).toBe(297);
    expect(count(s, 'stunned')).toBe(1);
    expect(count(s, 'faltering')).toBe(0);
  });

  it('Arc Relay: 9 to every enemy and one random enemy Shocked', () => {
    const s = play(fight('engineer', ['arc-relay']), 'arc-relay');
    for (const u of foes(s)) expect(u.hp).toBe(291);
    expect(count(s, 'stunned')).toBe(1);
  });

  it('a Shocked enemy takes 50% more attack damage', () => {
    let s = fight('engineer', ['static-field', 'strike']);
    s = play(s, 'static-field');
    const shocked = foes(s).find((u) => u.statuses.stunned)!;
    const before = shocked.hp;
    const act = legalActions(db, s).find(
      (a) => a.type === 'play' && a.card === inst(s, 'strike') && a.target === shocked.id,
    )!;
    s = applyAction(db, s, act).state;
    expect(before - foes(s).find((u) => u.id === shocked.id)!.hp).toBe(9);
  });
});

describe('Sapped: the Monk and the Necromancer', () => {
  it('Watchful Calm: 4 Sapped on the target, Serene, Foresee 2', () => {
    const s = play(fight('monk', ['vigilance']), 'vigilance');
    expect(count(s, 'sapped')).toBe(1);
    expect(foes(s).some((u) => u.statuses.sapped === 4)).toBe(true);
    expect(hero(s).statuses.calm).toBe(1);
    expect(hero(s).barrier).toBe(0);
  });

  it('Unmoved Mind: entering a stance Saps a random enemy by 2 and deals 2', () => {
    let s = play(fight('monk', ['unmoved-mind', 'kindle-fury']), 'unmoved-mind');
    s = play(s, 'kindle-fury');
    expect(foes(s).reduce((n, u) => n + (u.statuses.sapped ?? 0), 0)).toBe(2);
    expect(hero(s).barrier).toBe(0);
  });

  it('Grave Defiance: 5 Barrier and 4 Sapped, Fleeting', () => {
    const s = play(fight('necromancer', ['grave-defiance']), 'grave-defiance');
    expect(hero(s).barrier).toBe(5);
    expect(foes(s).some((u) => u.statuses.sapped === 4)).toBe(true);
    expect(count(s, 'faltering')).toBe(0);
    expect(db.cards['grave-defiance']!.ethereal).toBe(true);
  });
});

describe('Debilitated: the Trickster', () => {
  it('Strip the Guard: 2 Exposed and 2 Debilitated, no Brittle', () => {
    const s = play(fight('trickster', ['strip-the-guard']), 'strip-the-guard');
    const t = foes(s).find((u) => u.statuses.debilitated)!;
    expect(t.statuses.exposed).toBe(2);
    expect(t.statuses.debilitated).toBe(2);
    expect(t.statuses.brittle).toBeUndefined();
  });

  it('Death Mark: 12 damage, 2 Exposed and 1 Debilitated', () => {
    const s = play(fight('trickster', ['death-mark']), 'death-mark');
    const t = foes(s).find((u) => u.statuses.debilitated)!;
    expect(t.hp).toBe(288);
    expect(t.statuses.exposed).toBe(2);
    expect(t.statuses.debilitated).toBe(1);
    expect(cardText(db, db.cards['death-mark']!)).toContain('Debilitated');
  });
});
