// Valeria's Devotion: every heal (even at full HP) builds it through her trait, and her spenders cash it in.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function fight(hero: HeroId, hand: string[], devotion = 0): CombatState {
  const { state } = createCombat(db, {
    seed: 'devotion-test',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  if (devotion) heroOf(s).statuses.devotion = devotion;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 100;
    u.barrier = 0;
  }
  return s;
}
const heroOf = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const playable = (s: CombatState, id: string): boolean =>
  legalActions(db, s).some((a) => a.type === 'play' && a.card === id);
const playCard = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe("Valeria's Devotion", () => {
  it('a heal at full HP still gives its whole amount as Devotion', () => {
    let s = fight('knight', ['lightbearer']);
    expect(heroOf(s).hp).toBe(heroOf(s).maxHp);
    s = playCard(s, 'T0'); // heal 4
    expect(heroOf(s).statuses.devotion).toBe(4);
  });

  it('a heal that only partly lands counts in full too', () => {
    let s = fight('knight', ['benediction']);
    heroOf(s).hp = heroOf(s).maxHp - 3;
    s = playCard(s, 'T0'); // heal 10: 3 land, 10 Devotion
    expect(heroOf(s).hp).toBe(heroOf(s).maxHp);
    expect(heroOf(s).statuses.devotion).toBe(10);
  });

  it('is her trait: another Riftwalker who heals gains none', () => {
    let s = fight('hunter', ['lightbearer']);
    s = playCard(s, 'T0');
    expect(heroOf(s).statuses.devotion).toBeUndefined();
  });

  it('Lightbrand needs 5 Devotion, spends it and deals 14', () => {
    let s = fight('knight', ['lightbrand'], 4);
    expect(playable(s, 'T0')).toBe(false);
    s = fight('knight', ['lightbrand'], 7);
    s = playCard(s, 'T0');
    expect(heroOf(s).statuses.devotion).toBe(2);
    expect(s.sides.b.units[0]!.hp).toBe(86);
  });

  it('Hymn of Reckoning spends 6 Devotion to hit every enemy for 10', () => {
    let s = fight('knight', ['hymn-of-reckoning'], 6);
    s = playCard(s, 'T0');
    expect(heroOf(s).statuses.devotion ?? 0).toBe(0);
    for (const u of s.sides.b.units) expect(u.hp).toBe(90);
  });

  it('Sunfall needs 10 Devotion and spends it all: 2 damage per Devotion you had', () => {
    expect(playable(fight('knight', ['sunfall'], 9), 'T0')).toBe(false);
    let s = fight('knight', ['sunfall'], 25);
    s = playCard(s, 'T0'); // 10 paid, then 20 + 2 x 15 = 50
    expect(s.sides.b.units[0]!.hp).toBe(50);
    expect(heroOf(s).statuses.devotion ?? 0).toBe(0);
  });

  it('Sunforged Edge grows with Devotion and keeps it', () => {
    let s = fight('knight', ['sunforged-edge'], 10);
    s = playCard(s, 'T0'); // 8 + 10 / 2
    expect(s.sides.b.units[0]!.hp).toBe(87);
    expect(heroOf(s).statuses.devotion).toBe(10);
  });
});

describe("the paladin's judgments", () => {
  it('Hand of Justice: 4 Devotion, deal 10 and Expose', () => {
    let s = fight('knight', ['hand-of-justice'], 4);
    s = playCard(s, 'T0');
    expect(s.sides.b.units[0]!.hp).toBe(90);
    expect(s.sides.b.units[0]!.statuses.exposed).toBe(1);
    expect(heroOf(s).statuses.devotion ?? 0).toBe(0);
  });

  it('Consecrated Blade: 8 Devotion, deal 9 twice and gain 6 Barrier', () => {
    let s = fight('knight', ['consecrated-blade'], 8);
    const barrier = heroOf(s).barrier;
    s = playCard(s, 'T0');
    expect(s.sides.b.units[0]!.hp).toBe(82);
    expect(heroOf(s).barrier).toBe(barrier + 6);
  });

  it('Hand of God: 15 Devotion, deal 36', () => {
    expect(playable(fight('knight', ['hand-of-god'], 14), 'T0')).toBe(false);
    let s = fight('knight', ['hand-of-god'], 15);
    s = playCard(s, 'T0');
    expect(s.sides.b.units[0]!.hp).toBe(64);
  });
});
