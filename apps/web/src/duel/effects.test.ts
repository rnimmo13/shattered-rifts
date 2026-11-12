import { afterEach, describe, expect, it, vi } from 'vitest';
import { profileFor, resetLightDevice } from './effects';

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

  it('Low graphics quality keeps everything still at rest, in either mode (DECISIONS #570)', () => {
    stubMatchMedia(false);
    for (const mode of ['full', 'reduced'] as const) {
      const p = profileFor(mode, 'low');
      expect(p.low).toBe(true);
      expect(p.particles).toBe(0);
      expect(p.fogSpeed).toBe(0);
      expect(p.parallax).toBe(0);
      expect(p.pulse).toBe(0);
      expect(p.maxResolution).toBeLessThanOrEqual(1);
      expect(p.still).toBe(false); // the blows and effects of a card still play
    }
    expect(profileFor('full').low).toBe(false);
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

describe('graphics quality (DECISIONS #570, #759)', () => {
  const env = (o: { stored?: string; memory?: number; coarse?: boolean; short?: number }) => {
    const items: Record<string, string> = o.stored ? { 'sr.graphics': o.stored } : {};
    vi.stubGlobal('localStorage', { getItem: (k: string) => items[k] ?? null, setItem: () => {} });
    vi.stubGlobal('navigator', o.memory === undefined ? {} : { deviceMemory: o.memory });
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('coarse') && !!o.coarse }));
    vi.stubGlobal('screen', { width: 1920, height: o.short ?? 1080 });
    resetLightDevice();
  };

  it('keeps what the player picked', async () => {
    const { loadGraphicsQuality } = await import('./effects');
    for (const q of ['high', 'medium', 'low']) {
      env({ stored: q, memory: 2, coarse: true, short: 400 });
      expect(loadGraphicsQuality()).toBe(q);
    }
  });

  it('starts a phone or a small-memory device on Medium, anything else on High', async () => {
    const { loadGraphicsQuality } = await import('./effects');
    env({ coarse: true, short: 400 });
    expect(loadGraphicsQuality()).toBe('medium');
    env({ memory: 4 });
    expect(loadGraphicsQuality()).toBe('medium');
    env({ memory: 8 });
    expect(loadGraphicsQuality()).toBe('high');
    env({ coarse: true, short: 1200 });
    expect(loadGraphicsQuality()).toBe('high');
  });

  it('Medium has the full look on the board (only the hero models are lighter)', () => {
    stubMatchMedia(false);
    expect(profileFor('full', 'medium')).toEqual(profileFor('full', 'high'));
  });
});
