import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { EVENTS, eventWeight, RIFT_CROSSED_EVENTS } from './events';
import { heartCrossedMultiplier } from './hearts';
import { generateStageMap } from './mapgen';
import { newRun } from './run';

describe('Rift Heart opportunities', () => {
  it('triples only eligible foreign-card event weights without consuming RNG', () => {
    const r = newRun('monk', 'rift-heart-events');
    const rng = [...r.rng];
    for (const id of RIFT_CROSSED_EVENTS) expect(EVENTS.some((e) => e.id === id)).toBe(true);
    for (const e of EVENTS) {
      expect(eventWeight(r, e)).toBe(e.weight);
      expect(eventWeight({ ...r, heart: 'ember-heart' }, e)).toBe(
        e.weight * (RIFT_CROSSED_EVENTS.has(e.id) ? 3 : 1),
      );
      expect(eventWeight({ ...r, heart: 'thorned-heart' }, e)).toBe(e.weight);
    }
    expect(r.rng).toEqual(rng);
    expect(heartCrossedMultiplier({ heart: 'ember-heart' })).toBe(3);
    expect(heartCrossedMultiplier({})).toBe(1);
  });
  it('applies the merchant multiplier to generated shops without changing the default', () => {
    const map = (mult?: number) =>
      generateStageMap(
        seedRng('rift-heart-map'),
        1,
        'aurelion',
        'monk',
        undefined,
        1,
        undefined,
        undefined,
        false,
        mult,
      );
    expect(map()).toEqual(map(1));
    const none = map(0).nodes.filter((n) => n.kind === 'merchant');
    const all = map(100).nodes.filter((n) => n.kind === 'merchant');
    expect(none.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(0);
    expect(none.every((n) => !n.crossed)).toBe(true);
    expect(all.every((n) => n.crossed && n.crossed !== 'monk')).toBe(true);
  });
});
