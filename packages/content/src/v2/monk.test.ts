// The Monk rebuilt (docs/BASE_CLASS_REWORKS.md §12, Option A; DECISIONS #419): Martial Forms and Mastery. His form decides which two
// techniques complete his objective this turn (Root: two different Defensive; Current: a Defensive then a Striking; Ember: two
// different Striking at the same enemy); once a turn it gives 1 Mastery (at most 3) and the trait's 3 Barrier. His Watcher-shaped
// stances are archived in reviews/balance-baselines/2026-10-29-pre-identity-reworks/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type CombatState,
  type Op,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.monk.starter;
  const { state } = createCombat(db, {
    seed: 'monk-forms',
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
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const mastery = (s: CombatState): number => hero(s).statuses.mastery ?? 0;
const ops = (o: Op): Op[] => [o, ...('ops' in o && Array.isArray(o.ops) ? o.ops : [])];

describe('the Monk: Martial Forms and Mastery', () => {
  it('starts in Current with no stance, no Fervor and no Mana refund; his starter has two of each technique', () => {
    const { state } = createCombat(db, {
      seed: 'mk',
      a: { hero: 'monk', deck: RIFTWALKERS.monk.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.form).toBe('current');
    const h = state.sides.a.units.find((u) => u.kind === 'hero')!;
    expect(h.statuses.calm ?? 0).toBe(0);
    expect(h.statuses.mantra ?? 0).toBe(0);
    expect(RIFTWALKERS.monk.hero.sigil).toBeUndefined();
    const starter = RIFTWALKERS.monk.starter.map((id) => db.cards[id]!);
    expect(starter.filter((c) => c.tags?.includes('defensive')).map((c) => c.id)).toEqual([
      'still-guard',
      'planted-heel',
    ]);
    expect(starter.filter((c) => c.tags?.includes('striking')).map((c) => c.id)).toEqual([
      'kindle-fury',
      'turning-palm',
    ]);
    for (const c of starter) expect(['basic', 'common'], c.id).toContain(c.rarity);
    expect(pathSizes('monk').every((n) => n >= 12)).toBe(true);
    // (no card of his enters a stance, gains Fervor or spends more than 2 Mastery; no card is both techniques)
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'monk')) {
      for (const o of c.effects.flatMap(ops)) {
        expect(o.op, c.id).not.toBe('stance');
        if (o.op === 'status')
          expect(['mantra', 'calm', 'wrath', 'radiant'], c.id).not.toContain(o.status);
        if (o.op === 'spend' && o.status === 'mastery')
          expect(o.amount, c.id).toBeLessThanOrEqual(2);
      }
      expect(c.tags?.includes('defensive') && c.tags?.includes('striking'), c.id).toBeFalsy();
    }
  });

  it('Current: a Defensive then a Striking technique completes it, once a turn, for 1 Mastery and 3 Barrier', () => {
    let s = fight(['still-guard', 'kindle-fury', 'turning-palm', 'planted-heel']);
    s = play(s, 'still-guard');
    expect(viewFor(db, s, 'a').sides.a.formProgress).toBe(1);
    s = play(s, 'kindle-fury', foe(s).id);
    expect(s.sides.a.formDone).toBe(true);
    expect(mastery(s)).toBe(1);
    expect(hero(s).barrier).toBe(6 + 3);
    // a second sequence the same turn gives nothing more
    s = play(s, 'planted-heel');
    s = play(s, 'turning-palm', foe(s).id);
    expect(mastery(s)).toBe(1);
  });

  it('Current: the order matters, and a Strike before any Defensive technique does not count', () => {
    let s = fight(['kindle-fury', 'still-guard']);
    s = play(s, 'kindle-fury', foe(s).id);
    s = play(s, 'still-guard');
    expect(s.sides.a.formDone).toBe(false);
    expect(mastery(s)).toBe(0);
  });

  it('Root: two different Defensive techniques; the same card twice is one step; an untagged card is no step', () => {
    let s = fight(['settle-the-root', 'still-guard', 'still-guard', 'defend', 'planted-heel']);
    s = play(s, 'settle-the-root');
    expect(s.sides.a.form).toBe('root');
    s = play(s, 'still-guard');
    s = play(s, 'still-guard');
    s = play(s, 'defend');
    expect(s.sides.a.formDone).toBe(false);
    s = play(s, 'planted-heel');
    expect(s.sides.a.formDone).toBe(true);
    expect(mastery(s)).toBe(1);
  });

  it('Ember: two different Striking techniques at the same enemy; a change of form starts the progress again', () => {
    let s = fight(['stoke-the-ember', 'quick-palms', 'flurry-of-palms', 'sunlit-blade']);
    s = play(s, 'stoke-the-ember', foe(s).id);
    expect(s.sides.a.form).toBe('ember');
    s = play(s, 'quick-palms', foe(s, 0).id);
    s = play(s, 'flurry-of-palms', foe(s, 1).id);
    expect(s.sides.a.formDone).toBe(false);
    s = play(s, 'sunlit-blade', foe(s, 0).id);
    expect(s.sides.a.formDone).toBe(true);
    // (Current's progress was dropped when Stoke the Ember changed the form)
    let t = fight(['still-guard', 'stoke-the-ember', 'kindle-fury']);
    t = play(t, 'still-guard');
    t = play(t, 'stoke-the-ember', foe(t).id);
    t = play(t, 'kindle-fury', foe(t).id);
    expect(t.sides.a.formDone).toBe(false);
  });

  it('Mastery stops at 3, a card spends at most 2, and the spend pays exactly what it says', () => {
    // (the cap holds for a gain: Wreath of Flame's 1 on top of 3 stays 3)
    let s = fight(['mountain-breaker', 'angry-palm', 'wreath-of-flame']);
    hero(s).statuses.mastery = 3;
    s.sides.a.formDone = true;
    s = play(s, 'wreath-of-flame');
    expect(mastery(s)).toBe(3);
    hero(s).statuses.mastery = 3;
    hero(s).statuses.mastery = 3;
    s = play(s, 'mountain-breaker', foe(s).id);
    expect(foe(s).hp).toBe(200 - 16 - 6);
    expect(mastery(s)).toBe(1);
    s = play(s, 'angry-palm', foe(s).id);
    expect(foe(s).hp).toBe(200 - 22 - 11);
    expect(mastery(s)).toBe(0);
  });

  it('the progress and the once-a-turn completion reset at the start of each turn', () => {
    let s = fight(['still-guard', 'kindle-fury']);
    s = play(s, 'still-guard');
    s = applyAction(db, s, { type: 'endTurn' }).state;
    while (s.active !== 'a' && !s.winner) s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.formSteps).toEqual([]);
    expect(s.sides.a.formDone).toBe(false);
  });

  it('Read the Rhythm offers the other two forms, or keeping his', () => {
    let s = fight(['read-the-rhythm']);
    s.sides.a.draw = [
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'strike' },
      { id: 'D3', card: 'strike' },
      ...s.sides.a.draw,
    ];
    s = play(s, 'read-the-rhythm');
    // (Foresee asks first)
    if (s.pending?.kind === 'scry') s = applyAction(db, s, { type: 'pick', cards: ['D1'] }).state;
    expect(s.pending?.kind).toBe('form');
    expect(viewFor(db, s, 'a').pending?.forms).toEqual(['root', 'ember']);
    const kept = applyAction(db, s, { type: 'pick', cards: [] }).state;
    expect(kept.sides.a.form).toBe('current');
    const root = applyAction(db, s, { type: 'pick', cards: ['root'] }).state;
    expect(root.sides.a.form).toBe('root');
  });

  it('Perfected Motion and Unmoved Mind answer the completion', () => {
    let s = fight(['perfected-motion', 'unmoved-mind', 'still-guard', 'kindle-fury']);
    s.sides.a.draw = [{ id: 'D1', card: 'strike' }, ...s.sides.a.draw];
    s = play(s, 'perfected-motion');
    s = play(s, 'unmoved-mind');
    s = play(s, 'still-guard');
    const hand = s.sides.a.hand.length;
    s = play(s, 'kindle-fury', foe(s, 1).id);
    expect(s.sides.a.hand.length).toBe(hand - 1 + 1);
    expect(foe(s, 0).hp).toBe(200 - 4);
    expect(foe(s, 1).hp).toBe(200 - 6 - 4);
  });

  it('a strike that kills its target and then asks a choice still completes Ember (review H1)', () => {
    let s = fight(['stoke-the-ember', 'quick-palms', 'foretold-flame']);
    s.sides.a.draw = [
      { id: 'D1', card: 'strike' },
      { id: 'D2', card: 'strike' },
      ...s.sides.a.draw,
    ];
    s = play(s, 'stoke-the-ember', foe(s).id);
    s = play(s, 'quick-palms', foe(s).id);
    foe(s).hp = 3;
    const id = foe(s).id;
    s = play(s, 'foretold-flame', id);
    expect(s.sides.b.units.some((u) => u.id === id)).toBe(false);
    expect(s.pending?.kind).toBe('scry');
    s = applyAction(db, s, { type: 'pick', cards: ['D1'] }).state;
    expect(s.sides.a.formDone).toBe(true);
    expect(mastery(s)).toBe(1);
  });

  it('Still Water draws on the play that completes Root', () => {
    let s = fight(['settle-the-root', 'still-guard', 'still-water']);
    s.sides.a.draw = [{ id: 'D1', card: 'strike' }, ...s.sides.a.draw];
    s = play(s, 'settle-the-root');
    s = play(s, 'still-guard');
    s = play(s, 'still-water');
    expect(s.sides.a.formDone).toBe(true);
    expect(s.sides.a.hand.map((c) => c.id)).toContain('D1');
  });

  it('every Monk card has text', () => {
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'monk' && !x.source))
      expect(cardText(db, c).length, c.id).toBeGreaterThan(5);
  });
});
