// The Monk's pool expansion (DECISIONS #426): six strategies within Martial Forms and Mastery (Root that turns into damage, Current's
// ordered pair, Ember's commitment, Mastery kept, small spends, adapting the form), 36 cards, 12 Auras. The cards before it are frozen in
// reviews/balance-baselines/2026-10-29-monk-expansion/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool } from './index';

const TRAIT = 3; // the trait's Barrier on a completion

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.monk.starter;
  const { state } = createCombat(db, {
    seed: 'monk-expansion',
    a: { hero: 'monk', deck: [...deck, ...deck] },
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
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState, side: 'a' | 'b' = 'a'): Unit =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const mastery = (s: CombatState): number => hero(s).statuses.mastery ?? 0;
/** play a card from hand (aimed if a target is given); a choice it asks is answered with `pick`, or the bot's answer */
const play = (s: CombatState, id: string, target?: string, pick?: string[]): CombatState => {
  const side = s.active;
  const inst = s.sides[side].hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  if (pick && r.pending) r = applyAction(db, r, { type: 'pick', cards: pick }).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
/** the enemies only guard; her turn ends and the next begins */
const quietTurn = (s: CombatState): CombatState => {
  for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
  return applyAction(db, s, { type: 'endTurn' }).state;
};

describe('the Monk expansion (DECISIONS #426)', () => {
  it('87 reward-eligible Monk cards (89 with the two basics) and 12 Auras; no card is both techniques', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'monk' && !c.id.endsWith('+') && !c.id.includes('~'),
    );
    expect(own).toHaveLength(89);
    expect(rewardPool('monk').filter((id) => db.cards[id]?.hero === 'monk')).toHaveLength(87);
    expect(own.filter((c) => c.kind === 'power')).toHaveLength(12);
    for (const c of own)
      expect(c.tags?.includes('defensive') && c.tags?.includes('striking'), c.id).toBeFalsy();
    // (a healthy mix: untagged cards neither help nor break the progress)
    expect(own.filter((c) => !c.tags?.length).length).toBeGreaterThanOrEqual(20);
  });

  describe('Root: discipline that turns into damage', () => {
    it('Coiled Stance: 6 Barrier and 3 Primed for the next attack, on every hit of it', () => {
      let s = fight(['coiled-stance', 'flurry-of-palms']);
      s = play(s, 'coiled-stance');
      expect(hero(s).barrier).toBe(6);
      expect(hero(s).statuses.vigor).toBe(3);
      s = play(s, 'flurry-of-palms', foe(s).id);
      expect(foe(s).hp).toBe(200 - 2 * (3 + 3));
      expect(hero(s).statuses.vigor ?? 0).toBe(0);
    });

    it('Coiled Stance never stacks Primed: a second copy (or a second turn) while Primed adds none', () => {
      let s = fight(['coiled-stance', 'coiled-stance']);
      s = play(s, 'coiled-stance');
      s = play(s, 'coiled-stance');
      expect(hero(s).statuses.vigor).toBe(3);
      expect(hero(s).barrier).toBe(12);
    });

    it('Mountain Roots: 5 Barrier, 1 Faltering on every enemy; with Coiled Stance it completes Root', () => {
      let s = fight(['mountain-roots', 'coiled-stance']);
      s.sides.a.form = 'root';
      s = play(s, 'mountain-roots');
      expect([foe(s, 0), foe(s, 1)].map((u) => u.statuses.faltering)).toEqual([1, 1]);
      s = play(s, 'coiled-stance');
      expect(mastery(s)).toBe(1);
      expect(hero(s).barrier).toBe(5 + 6 + TRAIT);
    });

    it('Unleashed Stillness: 7, +3 for each Defensive technique played before it this turn', () => {
      let s = fight(['still-guard', 'iron-shirt', 'unleashed-stillness']);
      s = play(s, 'still-guard');
      s = play(s, 'iron-shirt');
      s = play(s, 'unleashed-stillness', foe(s).id);
      expect(foe(s).hp).toBe(200 - 13);
    });

    it('Earth Shrug: a Mana next turn only in Root', () => {
      let s = fight(['earth-shrug']);
      s.sides.a.form = 'root';
      s = play(s, 'earth-shrug');
      expect(s.sides.a.nextMana).toBe(1);
      let t = fight(['earth-shrug']);
      t = play(t, 'earth-shrug');
      expect(t.sides.a.nextMana ?? 0).toBe(0);
    });

    it('Patient Thunder: 7 Barrier, 6 to every enemy in Root, Held', () => {
      let s = fight(['patient-thunder']);
      s.sides.a.form = 'root';
      s = play(s, 'patient-thunder');
      expect([foe(s, 0).hp, foe(s, 1).hp]).toEqual([194, 194]);
      expect(db.cards['patient-thunder']!.retain).toBe(true);
    });

    it('Stored Strength: 4 Primed after a Root completion, never while still Primed', () => {
      let s = fight(['stored-strength', 'still-guard', 'iron-shirt']);
      s.sides.a.form = 'root';
      s = play(s, 'stored-strength');
      s = play(s, 'still-guard');
      s = play(s, 'iron-shirt');
      s = quietTurn(s);
      expect(hero(s).statuses.vigor).toBe(4);
      // (a second Root completion while still Primed adds nothing)
      s.sides.a.hand = [
        { id: 'X1', card: 'still-guard' },
        { id: 'X2', card: 'iron-shirt' },
      ];
      s.sides.a.mana = 9;
      s = play(s, 'still-guard');
      s = play(s, 'iron-shirt');
      s = quietTurn(s);
      expect(hero(s).statuses.vigor).toBe(4);
    });
  });

  describe('Mastery kept: benefits at 1 or 2, never spent', () => {
    it('Centred Strike, Quiet Confidence and Master’s Calm read the Mastery and leave it', () => {
      let s = fight(['centred-strike', 'quiet-confidence', 'masters-calm', 'unhurried-sweep']);
      hero(s).statuses.mastery = 2;
      s = play(s, 'centred-strike', foe(s).id);
      expect(foe(s).hp).toBe(200 - 11);
      s = play(s, 'quiet-confidence');
      expect(hero(s).barrier).toBe(10);
      s = play(s, 'masters-calm');
      expect(hero(s).barrier).toBe(10 + 11);
      s = play(s, 'unhurried-sweep');
      expect(foe(s, 1).hp).toBe(200 - 16);
      // (none was spent; Quiet Confidence then Unhurried Sweep completed Current: 1 more)
      expect(mastery(s)).toBe(3);
      expect(db.cards['masters-calm']!.retain).toBe(true);
    });

    it('Inner Reserve: 4 Barrier at the end of a turn with any Mastery; none with 0', () => {
      let s = fight(['inner-reserve']);
      s = play(s, 'inner-reserve');
      hero(s).statuses.mastery = 1;
      const events = applyAction(db, s, { type: 'endTurn' }).events;
      expect(events.some((e) => e.type === 'barrier' && 'amount' in e && e.amount === 4)).toBe(
        true,
      );
      let t = fight(['inner-reserve']);
      t = play(t, 'inner-reserve');
      const none = applyAction(db, t, { type: 'endTurn' }).events;
      expect(none.some((e) => e.type === 'barrier' && 'amount' in e && e.amount === 4)).toBe(false);
    });

    it('Composed Mind draws a second card with 2 Mastery, and spends none', () => {
      let s = fight(['composed-mind']);
      hero(s).statuses.mastery = 2;
      const n = s.sides.a.hand.length;
      s = play(s, 'composed-mind');
      expect(s.sides.a.hand.length).toBe(n - 1 + 2);
      expect(mastery(s)).toBe(2);
    });
  });

  describe('small spends that compete for the same Mastery', () => {
    it('Clear Mind, Long Exhale and Pinpoint Strike spend 1 each; with none they do their base', () => {
      let s = fight(['clear-mind', 'long-exhale', 'pinpoint-strike']);
      hero(s).statuses.mastery = 2;
      const n = s.sides.a.hand.length;
      s = play(s, 'clear-mind');
      expect(s.sides.a.hand.length).toBe(n - 1 + 2);
      s = play(s, 'long-exhale');
      expect(s.sides.a.nextMana).toBe(1);
      expect(mastery(s)).toBe(0);
      s = play(s, 'pinpoint-strike', foe(s).id);
      expect(foe(s).statuses.exposed ?? 0).toBe(0);
      expect(foe(s).hp).toBe(193);
    });

    it('Pinpoint Strike puts the Exposed on before its hit', () => {
      let s = fight(['pinpoint-strike']);
      hero(s).statuses.mastery = 1;
      s = play(s, 'pinpoint-strike', foe(s).id);
      expect(foe(s).statuses.exposed).toBe(2);
      expect(foe(s).hp).toBe(200 - Math.floor(7 * 1.5));
    });

    it('Deflecting Spirit and Decisive Moment scale with the Mastery spent (at most 2)', () => {
      let s = fight(['deflecting-spirit', 'decisive-moment']);
      hero(s).statuses.mastery = 3;
      s = play(s, 'deflecting-spirit');
      expect([foe(s, 0), foe(s, 1)].map((u) => u.statuses.faltering)).toEqual([2, 2]);
      expect(mastery(s)).toBe(1);
      const n = s.sides.a.hand.length;
      const b = hero(s).barrier;
      s = play(s, 'decisive-moment');
      expect(s.sides.a.hand.length).toBe(n - 1 + 1);
      expect(hero(s).barrier).toBe(b + 3 + 3);
      expect(mastery(s)).toBe(0);
    });

    it('Flowing Release: 3 Barrier for each card that spends Mastery, none for one that finds none', () => {
      let s = fight(['flowing-release', 'angry-palm', 'angry-palm']);
      s = play(s, 'flowing-release');
      hero(s).statuses.mastery = 1;
      s = play(s, 'angry-palm', foe(s).id);
      expect(hero(s).barrier).toBe(3);
      s = play(s, 'angry-palm', foe(s).id);
      expect(hero(s).barrier).toBe(3);
    });
  });

  describe('Current: the ordered pair', () => {
    it('Ebbing Guard is Held; Riverstone Strike and River’s Answer pay after a Defensive technique', () => {
      expect(db.cards['ebbing-guard']!.retain).toBe(true);
      let s = fight(['ebbing-guard', 'riverstone-strike', 'rivers-answer']);
      s = play(s, 'ebbing-guard');
      s = play(s, 'riverstone-strike', foe(s).id);
      expect(foe(s).statuses.faltering).toBe(2);
      expect(mastery(s)).toBe(1);
      s = play(s, 'rivers-answer', foe(s, 1).id);
      expect(foe(s, 1).hp).toBe(200 - 26);
      let t = fight(['rivers-answer']);
      t = play(t, 'rivers-answer', foe(t).id);
      expect(foe(t).hp).toBe(186);
    });

    it('Undertow and Seek the Strike bring back a technique of their kind from the discard pile', () => {
      let s = fight(['undertow', 'seek-the-strike']);
      s.sides.a.discard = [
        { id: 'D1', card: 'strike' },
        { id: 'D2', card: 'iron-shirt' },
        { id: 'D3', card: 'quick-palms' },
      ];
      s = play(s, 'undertow', foe(s).id);
      expect(s.sides.a.hand.map((c) => c.card)).toContain('iron-shirt');
      s = play(s, 'seek-the-strike');
      // (Undertow itself is in the discard pile now: either Striking technique may come back)
      expect(s.sides.a.hand.some((c) => ['quick-palms', 'undertow'].includes(c.card))).toBe(true);
    });

    it('Read the Water draws 2 and puts one back on top', () => {
      let s = fight(['read-the-water']);
      const n = s.sides.a.hand.length;
      const drawn = s.sides.a.draw.length;
      s = play(s, 'read-the-water');
      expect(s.sides.a.hand.length).toBe(n - 1 + 2 - 1);
      expect(s.sides.a.draw.length).toBe(drawn - 2 + 1);
    });

    it('Ebb and Flow: the first Striking technique after a Defensive one gives 2 Barrier and 1 Faltering, once a turn', () => {
      let s = fight(['ebb-and-flow', 'still-guard', 'quick-palms', 'quick-palms+']);
      s = play(s, 'ebb-and-flow');
      s = play(s, 'still-guard');
      s = play(s, 'quick-palms', foe(s).id);
      expect(foe(s).statuses.faltering).toBe(1);
      expect(hero(s).barrier).toBe(6 + 2 + TRAIT);
      s = play(s, 'quick-palms+', foe(s).id);
      expect(foe(s).statuses.faltering).toBe(1);
    });
  });

  describe('Ember: commitment to one enemy', () => {
    it('First Touch (free) Exposes; Follow-Through hits the Exposed enemy harder; together they complete Ember', () => {
      let s = fight(['first-touch', 'follow-through']);
      s.sides.a.form = 'ember';
      s.sides.a.mana = 1;
      s = play(s, 'first-touch', foe(s).id);
      expect(s.sides.a.mana).toBe(1);
      s = play(s, 'follow-through', foe(s).id);
      expect(foe(s).hp).toBe(200 - 3 - Math.floor(8 * 1.5) - Math.floor(4 * 1.5));
      expect(mastery(s)).toBe(1);
    });

    it("Ember's Edge: +4 when the technique is one step from done, not when it is done or not begun", () => {
      let s = fight(['quick-palms', 'embers-edge', 'embers-edge+']);
      s.sides.a.form = 'ember';
      s = play(s, 'quick-palms', foe(s).id);
      s = play(s, 'embers-edge', foe(s).id);
      expect(foe(s).hp).toBe(200 - 6 - 13);
      s = play(s, 'embers-edge+', foe(s, 1).id);
      expect(foe(s, 1).hp).toBe(200 - 12);
    });

    it('Searing Combination: +5 on an Exposed target, then 2 Exposed', () => {
      let s = fight(['searing-combination', 'searing-combination']);
      s = play(s, 'searing-combination', foe(s).id);
      expect(foe(s).hp).toBe(190);
      expect(foe(s).statuses.exposed).toBe(2);
      s = play(s, 'searing-combination', foe(s).id);
      expect(foe(s).hp).toBe(190 - 15 - 7);
    });

    it('Heart of the Ember: one hit more for each Mastery spent, at most 2', () => {
      let s = fight(['heart-of-the-ember', 'heart-of-the-ember']);
      hero(s).statuses.mastery = 3;
      s = play(s, 'heart-of-the-ember', foe(s).id);
      expect(foe(s).hp).toBe(200 - 30);
      expect(mastery(s)).toBe(1);
      s = play(s, 'heart-of-the-ember', foe(s, 1).id);
      expect(foe(s, 1).hp).toBe(200 - 20);
    });

    it('Kindled Focus: the first Striking technique each turn Exposes its target, twice in Ember', () => {
      let s = fight(['kindled-focus', 'quick-palms', 'quick-palms+']);
      s.sides.a.form = 'ember';
      s = play(s, 'kindled-focus');
      s = play(s, 'quick-palms', foe(s).id);
      expect(foe(s).statuses.exposed).toBe(2);
      s = play(s, 'quick-palms+', foe(s).id);
      expect(foe(s).statuses.exposed).toBe(2);
    });
  });

  describe('adapting the form (a change still starts the progress again)', () => {
    it('Shifting Stance changes form, then counts as the new form’s first step', () => {
      let s = fight(['still-guard', 'shifting-stance', 'iron-shirt']);
      s = play(s, 'still-guard');
      s = play(s, 'shifting-stance', undefined, ['root']);
      expect(s.sides.a.form).toBe('root');
      expect(s.sides.a.formSteps?.map((x) => x.card)).toEqual(['shifting-stance']);
      s = play(s, 'iron-shirt');
      expect(mastery(s)).toBe(1);
    });

    it('Change of Heart, Thousand Forms and Adapting Flow change form; Adapting Flow only before a completion', () => {
      let s = fight(['change-of-heart', 'thousand-forms']);
      s = play(s, 'change-of-heart', foe(s).id, ['ember']);
      expect(s.sides.a.form).toBe('ember');
      s = play(s, 'thousand-forms', undefined, ['root']);
      expect(s.sides.a.form).toBe('root');
      expect(hero(s).barrier).toBe(14);
      let t = fight(['adapting-flow']);
      t = play(t, 'adapting-flow', undefined, ['ember']);
      expect(t.sides.a.form).toBe('ember');
      let u = fight(['still-guard', 'quick-palms', 'adapting-flow']);
      u = play(u, 'still-guard');
      u = play(u, 'quick-palms', foe(u).id);
      u = play(u, 'adapting-flow');
      expect(u.pending).toBeNull();
      expect(u.sides.a.form).toBe('current');
    });

    it('Unfinished Form: a turn without a completion Holds the hand and gives 4 Barrier; a completed one does not', () => {
      let s = fight(['unfinished-form', 'strike', 'defend']);
      s = play(s, 'unfinished-form');
      s = quietTurn(s);
      expect(s.sides.a.hand.filter((c) => c.id === 'T1' || c.id === 'T2')).toHaveLength(2);
      let t = fight(['unfinished-form', 'still-guard', 'quick-palms', 'strike']);
      t = play(t, 'unfinished-form');
      t = play(t, 'still-guard');
      t = play(t, 'quick-palms', foe(t).id);
      t = quietTurn(t);
      expect(t.sides.a.hand.some((c) => c.id === 'T3')).toBe(false);
    });
  });

  describe('once a turn, and no loops', () => {
    it('a change of form after a completion does not allow a second one', () => {
      let s = fight(['still-guard', 'quick-palms', 'shifting-stance', 'iron-shirt']);
      s = play(s, 'still-guard');
      s = play(s, 'quick-palms', foe(s).id);
      expect(mastery(s)).toBe(1);
      s = play(s, 'shifting-stance', undefined, ['root']);
      s = play(s, 'iron-shirt');
      expect(mastery(s)).toBe(1);
    });

    it('First Touch is free but draws nothing; no new free card makes Mana or cards', () => {
      for (const id of ['first-touch', 'first-touch+']) {
        const c = db.cards[id]!;
        expect(c.cost).toBe(0);
        expect(JSON.stringify(c.effects)).not.toMatch(/"draw"|"mana"|"fetch"/);
      }
    });
  });

  describe('the Arena: two Monks (HP as packages/pvp sets it: 480, and 540 for seat b)', () => {
    function arena(hand: string[]): CombatState {
      const deck = RIFTWALKERS.monk.starter;
      const { state } = createCombat(db, {
        seed: 'monk-arena',
        a: { hero: 'monk', deck: [...deck], hp: 480, maxHp: 480 },
        b: { hero: 'monk', deck: [...deck], hp: 540, maxHp: 540 },
      });
      const s = clone(state);
      s.sides.a.hand = hand.map((card, i) => ({ id: `A${i}`, card }));
      hero(s, 'b').barrier = 0;
      return s;
    }

    it('Ember aims at the other hero; the burst ceiling on 3 Mana and 3 Mastery is 81 of 540', () => {
      let s = arena(['first-touch+', 'heart-of-the-ember+', 'follow-through+']);
      s.sides.a.mana = 3;
      s.sides.a.form = 'ember';
      hero(s).statuses.mastery = 3;
      const b = hero(s, 'b').id;
      s = play(s, 'first-touch+', b);
      s = play(s, 'heart-of-the-ember+', b);
      s = play(s, 'follow-through+', b);
      // 5, then x1.5 for Exposed: three hits of 12 (54) and 11 + 4 (22): 81; the completion refilled 1 Mastery
      expect(540 - hero(s, 'b').hp).toBe(81);
      expect(mastery(s)).toBe(2);
    });

    it('a Root deck needs no attacker: Patient Thunder hits the other hero in Root', () => {
      let s = arena(['patient-thunder']);
      s.sides.a.mana = 3;
      s.sides.a.form = 'root';
      s = play(s, 'patient-thunder');
      expect(540 - hero(s, 'b').hp).toBe(6);
    });
  });

  it('the new cards read plainly', () => {
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('coiled-stance')).toBe(
      'Defensive technique. Gain 6 Barrier. If you are not Primed: Gain 3 Primed.',
    );
    expect(text('embers-edge')).toBe(
      'Striking technique. Deal 9 damage. If your technique is one step from done: Deal 4 damage.',
    );
    expect(text('unfinished-form')).toContain('If you have not completed your technique this turn');
  });
});
