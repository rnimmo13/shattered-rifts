import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { LUCK_WEIGHTS, newRun, offerCards, parseRun, serializeRun } from './index';

const raresIn = (luck: 'normal' | 'lucky' | 'blessed', quality: 'duel' | 'elite'): number => {
  let rare = 0;
  let total = 0;
  for (let i = 0; i < 400; i++) {
    for (const id of offerCards(seedRng(`luck${luck}${i}`), 'maren', [], quality, 3, luck)) {
      total++;
      if (COMBAT_DB.cards[id]?.rarity === 'rare') rare++;
    }
  }
  return rare / total;
};

describe('card luck', () => {
  it('every setting is a full set of weights', () => {
    for (const l of Object.values(LUCK_WEIGHTS))
      for (const q of Object.values(l)) {
        expect(Object.keys(q).sort()).toEqual(['common', 'rare', 'uncommon']);
        expect(Object.values(q).reduce((a, b) => a + b, 0)).toBe(100);
      }
  });

  it('lucky and blessed offer clearly more rare cards than normal, in that order', () => {
    for (const q of ['duel', 'elite'] as const) {
      const n = raresIn('normal', q);
      const l = raresIn('lucky', q);
      const b = raresIn('blessed', q);
      expect(l).toBeGreaterThan(n * 1.4);
      expect(b).toBeGreaterThan(l * 1.2);
    }
  });

  it('a run remembers its luck, saves it, and old saves without it are normal', () => {
    const r = newRun('quill', 'luck', 'normal', 'blessed');
    expect(r.luck).toBe('blessed');
    expect(parseRun(serializeRun(r))?.luck).toBe('blessed');
    const old = JSON.parse(serializeRun(r)) as Record<string, unknown>;
    delete old['luck'];
    expect(parseRun(JSON.stringify(old))?.luck).toBe('normal');
    expect(parseRun(JSON.stringify({ ...old, luck: 'cheating' }))).toBeNull();
    expect(newRun('quill', 'luck2').luck).toBe('normal');
  });
});
