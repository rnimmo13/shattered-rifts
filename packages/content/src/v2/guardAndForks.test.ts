// DECISIONS #427: the Knight's Guard counts a hit her Barrier stops at least half of, and her starter gains a 1-Mana counter (Counter
// Cut); the Shaman's Forks (N different random enemies, 25% more when only one enemy stands) and his new starter, Forked Lightning,
// with Gathering Storm moved to the rewards.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool, type HeroId } from './index';

function fight(hero: HeroId, hand: string[], enemies: string[] = ['squire']): CombatState {
  const deck = RIFTWALKERS[hero].starter;
  const { state } = createCombat(db, {
    seed: 'guard-forks',
    a: { hero, deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  // (no totem help unless a test plants one)
  if (s.sides.a.totems) s.sides.a.totems = s.sides.a.totems.map(() => null);
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  heroOf(s).barrier = 0;
  return s;
}
const heroOf = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const enemyTurn = (s: CombatState, move = 'slash'): CombatState => {
  const h = heroOf(s);
  for (const u of s.sides.b.units) u.intent = { move, target: h.id };
  return applyAction(db, s, { type: 'endTurn' }).state;
};

describe('the Knight: Guard on half a hit, and Counter Cut (DECISIONS #427)', () => {
  it('a big hit she stops half of leaves the attacker Open, and the earned-Opening trigger answers', () => {
    // Slash 9 against 5 Barrier: 5 stopped, 4 through; the trait's 3 Barrier is the earned trigger
    let s = fight('knight', []);
    heroOf(s).barrier = 5;
    s = enemyTurn(s);
    expect(foe(s).statuses.opening).toBe(1);
    expect(heroOf(s).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 4);
  });

  it('exactly half counts; one short does not', () => {
    // (a Squire's Slash is 9: 5 is more than half, 4 less; check the boundary with an even hit)
    let s = fight('knight', []);
    foe(s).statuses.sapped = 1; // Slash 9 - 1 = 8: 4 stopped is exactly half
    heroOf(s).barrier = 4;
    s = enemyTurn(s);
    expect(foe(s).statuses.opening).toBe(1);
    let t = fight('knight', []);
    t.sides.b.units[0]!.statuses.sapped = 1;
    heroOf(t).barrier = 3;
    t = enemyTurn(t);
    expect(foe(t).statuses.opening ?? 0).toBe(0);
  });

  it('Counter Cut: 6, +4 against an Open target (spent); 9 upgraded; in the starter', () => {
    let s = fight('knight', ['counter-cut', 'counter-cut']);
    foe(s).statuses.opening = 1;
    s = play(s, 'counter-cut', foe(s).id);
    expect(foe(s).hp).toBe(190);
    expect(foe(s).statuses.opening ?? 0).toBe(0);
    s = play(s, 'counter-cut', foe(s).id);
    expect(foe(s).hp).toBe(184);
    expect(db.cards['counter-cut+']!.effects[0]).toMatchObject({ amount: 9, riposte: 4 });
    expect(RIFTWALKERS.knight.starter.filter((c) => c === 'counter-cut')).toHaveLength(1);
    expect(db.cards['counter-cut']!.cost).toBe(1);
  });
});

describe('the Shaman: Forks (DECISIONS #427)', () => {
  it('Forked Lightning hits two different enemies once each', () => {
    let s = fight('shaman', ['forked-lightning'], ['squire', 'squire', 'squire']);
    s = play(s, 'forked-lightning');
    const hit = s.sides.b.units.map((u) => 200 - u.hp).sort((x, y) => y - x);
    expect(hit).toEqual([5, 5, 0]);
  });

  it('against one enemy it hits once, 25% harder (5 -> 6; 7 -> 9 upgraded)', () => {
    let s = fight('shaman', ['forked-lightning', 'forked-lightning+']);
    s = play(s, 'forked-lightning');
    expect(foe(s).hp).toBe(194);
    s = play(s, 'forked-lightning+');
    expect(foe(s).hp).toBe(194 - 9);
  });

  it('the bonus reads the enemies standing as it began: a first hit that kills does not make the second one harder', () => {
    let s = fight('shaman', ['forked-lightning'], ['squire', 'squire']);
    foe(s, 0).hp = 3;
    foe(s, 1).hp = 3;
    s = play(s, 'forked-lightning');
    expect(s.sides.b.units).toHaveLength(0);
    let t = fight('shaman', ['thunder-fork'], ['squire', 'squire']);
    t = play(t, 'thunder-fork');
    // two enemies: each takes 10 once (a third hit finds no fresh enemy), no bonus
    expect(t.sides.b.units.map((u) => 200 - u.hp)).toEqual([10, 10]);
  });

  it("a Fork is a Storm spell: the Thunderbird's help goes on every hit of it", () => {
    let s = fight('shaman', ['forked-lightning'], ['squire', 'squire']);
    s.sides.a.totems = [null, null, 'thunderbird'];
    s = play(s, 'forked-lightning');
    expect(s.sides.b.units.map((u) => 200 - u.hp)).toEqual([7, 7]);
  });

  it('the preview shows the lone bonus against one enemy, and plain damage against several', () => {
    const one = fight('shaman', ['thunder-fork']);
    expect(previewCardDamage(db, one, 'T0', null).get(0)?.lo).toBe(13);
    const two = fight('shaman', ['thunder-fork'], ['squire', 'squire']);
    expect(previewCardDamage(db, two, 'T0', null).get(0)?.lo).toBe(10);
  });

  it('Spark Fork (0) and Thunder Fork (2) are rewards; the text names the bonus', () => {
    let s = fight('shaman', ['spark-fork']);
    s.sides.a.mana = 0;
    s = play(s, 'spark-fork');
    expect(foe(s).hp).toBe(195);
    expect(cardText(db, db.cards['forked-lightning']!)).toBe(
      'Storm. Deal 5 damage to 2 different random enemies (25% more when only one enemy stands).',
    );
    const pool = rewardPool('shaman');
    expect(pool).toContain('spark-fork');
    expect(pool).toContain('thunder-fork');
  });

  it('Gathering Storm is a common reward now, and he starts with two Forked Lightning instead', () => {
    expect(db.cards['gathering-storm']!.rarity).toBe('common');
    expect(rewardPool('shaman')).toContain('gathering-storm');
    expect(RIFTWALKERS.shaman.starter).not.toContain('gathering-storm');
    expect(RIFTWALKERS.shaman.starter.filter((c) => c === 'forked-lightning')).toHaveLength(2);
  });
});
