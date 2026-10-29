// The Assassin rebuilt (docs/BASE_CLASS_REWORKS.md §6, DECISIONS #416): Preparation (at most 3, kept between turns, spent by
// finishers) and knives embedded in enemies (at most 3 each, pulled for a payoff). His old Silent copy is archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.assassin.starter;
  const { state } = createCombat(db, {
    seed: 'assassin-knives',
    a: { hero: 'assassin', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  hero(s).statuses = {};
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const knives = (u: Unit | undefined): number => u?.statuses.knives ?? 0;
const prep = (s: CombatState): number => hero(s).statuses.prep ?? 0;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};

describe('the Assassin: Preparation and knives', () => {
  it('starts with 1 Preparation and a knife in every enemy; his starter has an embed, a pull, a finisher and a setup card', () => {
    const { state } = createCombat(db, {
      seed: 'a',
      a: { hero: 'assassin', deck: RIFTWALKERS.assassin.starter },
      b: { enemies: ['squire', 'squire'] },
    });
    expect(hero(state).statuses.prep).toBe(1);
    expect(state.sides.b.units.map(knives)).toEqual([1, 1]);
    expect(RIFTWALKERS.assassin.starter).toEqual([
      ...Array<string>(4).fill('strike'),
      ...Array<string>(3).fill('defend'),
      'quiet-incision',
      'draw-steel',
      'finishing-thrust',
      'patient-footwork',
    ]);
    expect(RIFTWALKERS.assassin.trait.turnStart).toBeUndefined(); // no Dagger a turn
  });

  it('has three build paths of at least 12 cards, and none of the old engines', () => {
    expect(pathSizes('assassin').every((n) => n >= 12)).toBe(true);
    for (const gone of [
      'sleeve-knife',
      'bottomless-sleeves',
      'thin-the-blood',
      'bloodburst',
      'grand-scheme',
      'serpents-coil',
    ])
      expect(db.cards[gone], gone).toBeUndefined();
  });

  describe('knives', () => {
    it('a knife card embeds after its hit lands on a living enemy, and the trait gives Preparation the first time each turn', () => {
      let s = fight(['quiet-incision', 'quiet-incision']);
      s = play(s, 'quiet-incision', foe(s, 0).id);
      expect(knives(foe(s, 0))).toBe(1);
      expect(prep(s)).toBe(1);
      s = play(s, 'quiet-incision', foe(s, 0).id);
      expect(knives(foe(s, 0))).toBe(2);
      expect(prep(s)).toBe(1); // once a turn
    });

    it('stops at 3 in an enemy, and the cap gives nothing back', () => {
      let s = fight(['pincushion', 'quiet-incision']);
      s = play(s, 'pincushion', foe(s, 0).id);
      expect(knives(foe(s, 0))).toBe(3);
      s = play(s, 'quiet-incision', foe(s, 0).id);
      expect(knives(foe(s, 0))).toBe(3);
    });

    it('no knife goes in when Shielded stops the hit, or into an enemy the hit killed', () => {
      let s = fight(['quiet-incision', 'quiet-incision']);
      foe(s, 0).statuses.shielded = 1;
      s = play(s, 'quiet-incision', foe(s, 0).id);
      expect(knives(foe(s, 0))).toBe(0);
      foe(s, 1).hp = 3;
      const id = foe(s, 1).id;
      s = play(s, 'quiet-incision', id);
      expect(s.sides.b.units.find((u) => u.id === id)).toBeUndefined();
    });

    it('a knife that only sits there deals nothing at the turn change', () => {
      let s = fight(['executioners-mark']);
      s = play(s, 'executioners-mark', foe(s, 0).id);
      const hp = foe(s, 0).hp;
      for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(foe(s, 0).hp).toBe(hp);
      expect(knives(foe(s, 0))).toBe(3);
    });

    it('Draw Steel pulls exactly what is there (up to 2): 4 + 4 a knife, and 3 more a knife from Knife Work', () => {
      let s = fight(['draw-steel', 'draw-steel', 'draw-steel']);
      foe(s, 0).statuses.knives = 3;
      let hp = foe(s, 0).hp;
      s = play(s, 'draw-steel', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(4 + 2 * 4 + 2 * 3);
      expect(knives(foe(s, 0))).toBe(1);
      hp = foe(s, 0).hp;
      s = play(s, 'draw-steel', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(4 + 4 + 3);
      expect(knives(foe(s, 0))).toBe(0);
      hp = foe(s, 0).hp;
      s = play(s, 'draw-steel', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(4);
    });

    it('Harvest the Field pulls every knife from every enemy, and each pays on the enemy it came from', () => {
      let s = fight(['harvest-the-field']);
      foe(s, 0).statuses.knives = 2;
      foe(s, 1).statuses.knives = 1;
      const hp = [foe(s, 0).hp, foe(s, 1).hp];
      s = play(s, 'harvest-the-field');
      expect([hp[0]! - foe(s, 0).hp, hp[1]! - foe(s, 1).hp]).toEqual([2 * (6 + 3), 6 + 3]);
      expect([knives(foe(s, 0)), knives(foe(s, 1))]).toEqual([0, 0]);
    });

    it('a target that dies mid-card keeps nothing to pull, and the counts never go below 0', () => {
      let s = fight(['reap-the-steel']);
      foe(s, 0).statuses.knives = 3;
      foe(s, 0).hp = 5;
      foe(s, 1).statuses.knives = 1;
      const hp1 = foe(s, 1).hp;
      s = play(s, 'reap-the-steel');
      expect(s.sides.b.units).toHaveLength(1);
      expect(hp1 - foe(s, 0).hp).toBe(6 + 4 + 3);
      expect(knives(foe(s, 0))).toBe(0);
    });

    it('every knife pulled pays what is yours, even after the enemy dies of an earlier one', () => {
      let s = fight(['recall-the-blades']);
      foe(s, 0).statuses.knives = 3;
      foe(s, 0).hp = 3;
      hero(s).barrier = 0;
      s = play(s, 'recall-the-blades');
      expect(prep(s)).toBe(3);
      expect(hero(s).barrier).toBe(12);
    });

    it('a pull into a Shielded enemy: its own first hit takes the Shield, and the preview says so', () => {
      const s = fight(['draw-steel']);
      foe(s, 0).statuses.knives = 2;
      foe(s, 0).statuses.shielded = 1;
      const id = s.sides.a.hand[0]!.id;
      const shown = previewCardDamage(db, s, id, foe(s, 0).id).get(1)?.lo;
      const hp = foe(s, 0).hp;
      const after = play(s, 'draw-steel', foe(s, 0).id);
      expect(shown).toBe(4 + 2 * 4);
      // (the first Knife Work hit is cancelled by the Shield, the second lands: 3, then the attack's 12)
      expect(hp - foe(after, 0).hp).toBe(3 + 12);
    });

    it('the preview shows exactly what a pull will deal against the target', () => {
      const s = fight(['draw-steel']);
      foe(s, 0).statuses.knives = 2;
      const id = s.sides.a.hand[0]!.id;
      expect(previewCardDamage(db, s, id, foe(s, 0).id).get(1)?.lo).toBe(4 + 2 * 4);
      expect(previewCardDamage(db, s, id, foe(s, 1).id).get(1)?.lo).toBe(4);
    });
  });

  describe('Preparation', () => {
    it('stops at 3, stays through the turn change, and an ordinary attack leaves it', () => {
      let s = fight(['prepared-ambush', 'prepared-ambush', 'strike']);
      s = play(s, 'prepared-ambush');
      s = play(s, 'prepared-ambush');
      expect(prep(s)).toBe(3);
      s = play(s, 'strike', foe(s, 0).id);
      expect(prep(s)).toBe(3);
      for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(prep(s)).toBe(3);
    });

    it('Finishing Thrust spends up to 3 for +4 each, and only what there is', () => {
      let s = fight(['finishing-thrust', 'finishing-thrust']);
      hero(s).statuses.prep = 2;
      let hp = foe(s, 0).hp;
      s = play(s, 'finishing-thrust', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(8 + 2 * 4);
      expect(prep(s)).toBe(0);
      hp = foe(s, 0).hp;
      s = play(s, 'finishing-thrust', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(8);
    });

    it('the preview shows a finisher with the Preparation you have, without spending it', () => {
      const s = fight(['severing-finish']);
      hero(s).statuses.prep = 3;
      const id = s.sides.a.hand[0]!.id;
      expect(previewCardDamage(db, s, id, foe(s, 0).id).get(1)?.lo).toBe(14 + 3 * 4);
      expect(prep(s)).toBe(3);
    });

    it('Eyes in the Dark answers the first spend each turn only', () => {
      let s = fight(['eyes-in-the-dark', 'knife-in-the-back', 'knife-in-the-back']);
      s = play(s, 'eyes-in-the-dark');
      hero(s).statuses.prep = 2;
      const hand = s.sides.a.hand.length;
      s = play(s, 'knife-in-the-back', foe(s, 0).id);
      expect(s.sides.a.hand.length).toBe(hand - 1 + 1);
      expect(hero(s).barrier).toBe(4);
      hero(s).statuses.prep = 1;
      s = play(s, 'knife-in-the-back', foe(s, 0).id);
      expect(hero(s).barrier).toBe(4);
    });
  });

  it('in the Arena the knives sit in the other hero and only their owner pulls them', () => {
    const { state } = createCombat(db, {
      seed: 'a-pvp',
      a: { hero: 'assassin', deck: RIFTWALKERS.assassin.starter },
      b: { hero: 'assassin', deck: RIFTWALKERS.assassin.starter },
    });
    const s = clone(state);
    const b = s.sides.b.units.find((u) => u.kind === 'hero')!;
    expect(b.statuses.knives).toBe(1); // a's Knife Work put one in b
    expect(s.sides.a.units.find((u) => u.kind === 'hero')!.statuses.knives ?? 0).toBe(0);
  });

  it('reads plainly on the card', () => {
    expect(cardText(db, db.cards['quiet-incision']!)).toBe(
      'Deal 6 damage. Embed a knife in the target.',
    );
    expect(cardText(db, db.cards['draw-steel']!)).toBe(
      'Pull up to 2 knives from the target. Deal 4 (+4 per knife pulled) damage.',
    );
    expect(cardText(db, db.cards['finishing-thrust']!)).toBe(
      'Spend up to 3 Preparation. Deal 8 (+4 per Preparation spent) damage.',
    );
    expect(cardText(db, db.cards['harvest-the-field']!)).toBe(
      'Pull every knife from every enemy: for each, deal 6 damage to that enemy.',
    );
    expect(cardText(db, db.cards['disarm']!)).toBe(
      'Pull up to 3 knives from the target: for each, apply 1 Faltering to that enemy and gain 4 Barrier.',
    );
    expect(cardText(db, db.cards['twist-the-blade']!)).toBe(
      'Pull a knife from the target. Deal 6 (+6 per knife pulled) damage.',
    );
  });
});
