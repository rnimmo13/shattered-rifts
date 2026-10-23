import { afterEach, describe, expect, it } from 'vitest';
import { gsap } from 'gsap';
import {
  holdSlow,
  hitStopFor,
  isSlowed,
  releaseSlow,
  resetTimeScale,
  setBaseSpeed,
  shakeFor,
} from './timescale';

afterEach(() => resetTimeScale());

describe('animation clock', () => {
  it('combines the speed setting with the slowest hold', () => {
    setBaseSpeed(2);
    expect(gsap.globalTimeline.timeScale()).toBe(2);
    holdSlow('trap', 0.35);
    expect(gsap.globalTimeline.timeScale()).toBeCloseTo(0.7, 6);
    holdSlow('hit', 0.05);
    expect(gsap.globalTimeline.timeScale()).toBeCloseTo(0.1, 6);
    releaseSlow('hit');
    expect(gsap.globalTimeline.timeScale()).toBeCloseTo(0.7, 6);
    releaseSlow('trap');
    expect(gsap.globalTimeline.timeScale()).toBe(2);
    expect(isSlowed()).toBe(false);
  });

  it('resets fully when leaving the duel', () => {
    setBaseSpeed(4);
    holdSlow('x', 0.1);
    resetTimeScale();
    expect(gsap.globalTimeline.timeScale()).toBe(1);
  });

  it('shake and hit-stop grow with the size of the hit, and small hits do not stop time', () => {
    expect(shakeFor(1)).toBeLessThan(shakeFor(5));
    expect(shakeFor(100)).toBeLessThanOrEqual(26);
    expect(hitStopFor(1)).toBe(0);
    expect(hitStopFor(2)).toBeGreaterThan(0);
    expect(hitStopFor(7)).toBeGreaterThan(hitStopFor(4));
  });
});
