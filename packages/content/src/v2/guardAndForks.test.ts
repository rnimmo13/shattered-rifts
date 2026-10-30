// DECISIONS #427: the Shaman's Forks (N different random enemies, 25% more when only one enemy stands) and his new starter, Forked Lightning,
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
    let t = fight('shaman', ['eye-of-the-tempest'], ['squire', 'squire']);
    t = play(t, 'eye-of-the-tempest');
    // two enemies: each takes 11 once (more hits find no fresh enemy), no bonus
    expect(t.sides.b.units.map((u) => 200 - u.hp)).toEqual([11, 11]);
  });

  it('a Fork is a Storm spell, and a totem no longer adds to it (the help went with the totem cycle, DECISIONS #430)', () => {
    let s = fight('shaman', ['forked-lightning'], ['squire', 'squire']);
    s.sides.a.totems = ['thunderbird', null, null];
    s = play(s, 'forked-lightning');
    expect(s.sides.b.units.map((u) => 200 - u.hp)).toEqual([5, 5]);
    expect(db.cards['forked-lightning']!.tags).toContain('storm');
  });

  it('the preview shows the lone bonus against one enemy, and plain damage against several', () => {
    const one = fight('shaman', ['eye-of-the-tempest']);
    expect(previewCardDamage(db, one, 'T0', null).get(0)?.lo).toBe(14);
    const two = fight('shaman', ['eye-of-the-tempest'], ['squire', 'squire']);
    expect(previewCardDamage(db, two, 'T0', null).get(0)?.lo).toBe(11);
  });

  it('Eye of the Tempest is a reward; the text names the bonus', () => {
    expect(cardText(db, db.cards['forked-lightning']!)).toBe(
      'Storm. Deal 5 damage to 2 different random enemies (25% more when only one enemy stands).',
    );
    const pool = rewardPool('shaman');
    expect(pool).toContain('eye-of-the-tempest');
  });

  it('Gathering Storm is a common reward now, and he starts with two Forked Lightning instead', () => {
    expect(db.cards['gathering-storm']!.rarity).toBe('common');
    expect(rewardPool('shaman')).toContain('gathering-storm');
    expect(RIFTWALKERS.shaman.starter).not.toContain('gathering-storm');
    expect(RIFTWALKERS.shaman.starter.filter((c) => c === 'forked-lightning')).toHaveLength(2);
  });
});
