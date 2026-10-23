import { describe, expect, it } from 'vitest';
import { createCombat, viewFor } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { TIP_RULES, nextTip } from './tips';

const viewOf = (hero: HeroId) => {
  const { state } = createCombat(db, {
    seed: 'tips',
    a: { hero, deck: RIFTWALKERS[hero].starter },
    b: { enemies: ['squire'] },
  });
  return viewFor(db, state, 'a');
};
const ctx = { usesRunes: false, usesStars: false };

describe('teaching tips', () => {
  it('start with the basics, once', () => {
    const v = viewOf('maren');
    expect(nextTip(v, ctx, new Set())?.id).toBe('basics');
    expect(nextTip(v, ctx, new Set(['basics']))).toBeNull();
  });

  it('show what a character brings the first time it is on the board', () => {
    const seen = new Set(['basics']);
    expect(nextTip(viewOf('ilvane'), { ...ctx, usesRunes: true }, seen)?.id).toBe('runes');
    expect(nextTip(viewOf('astra'), { ...ctx, usesStars: true }, seen)?.id).toBe('lumen');
    expect(nextTip(viewOf('sehra'), ctx, seen)?.id).toBe('stance');
    expect(nextTip(viewOf('rivet'), ctx, seen)?.id).toBe('ally');
    expect(nextTip(viewOf('mire'), ctx, seen)?.id).toBe('ally');
  });

  it('never repeats a tip that was seen, and every tip has a title and text', () => {
    const ids = TIP_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of TIP_RULES) {
      expect(r.title.length).toBeGreaterThan(2);
      expect(r.text.length).toBeGreaterThan(30);
    }
    const seen = new Set(ids);
    expect(nextTip(viewOf('sehra'), { usesRunes: true, usesStars: true }, seen)).toBeNull();
  });
});
