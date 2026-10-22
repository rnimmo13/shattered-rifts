import { afterEach, describe, expect, it, vi } from 'vitest';
import { profileFor } from './effects';

function stubMatchMedia(reduce: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }));
}

afterEach(() => vi.unstubAllGlobals());

describe('effects profiles', () => {
  it('full effects use the particle, fog, parallax and pulse budgets', () => {
    stubMatchMedia(false);
    const p = profileFor('full');
    expect(p.particles).toBeGreaterThan(0);
    expect(p.particles).toBeLessThanOrEqual(100); // hard cap: ambient particles stay cheap
    expect(p.fogSpeed).toBe(1);
    expect(p.parallax).toBe(1);
    expect(p.still).toBe(false);
  });

  it('reduced effects cut particles, parallax and pulse strength and lower the render cap', () => {
    stubMatchMedia(false);
    const full = profileFor('full');
    const r = profileFor('reduced');
    expect(r.particles).toBeLessThan(full.particles);
    expect(r.parallax).toBe(0);
    expect(r.pulse).toBeLessThan(full.pulse);
    expect(r.maxResolution).toBeLessThan(full.maxResolution);
  });

  it('prefers-reduced-motion stops everything from moving, in either mode', () => {
    stubMatchMedia(true);
    for (const mode of ['full', 'reduced'] as const) {
      const p = profileFor(mode);
      expect(p.still).toBe(true);
      expect(p.particles).toBe(0);
      expect(p.fogSpeed).toBe(0);
      expect(p.parallax).toBe(0);
      expect(p.pulse).toBe(0);
    }
  });
});
