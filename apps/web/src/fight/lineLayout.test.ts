import { describe, expect, it } from 'vitest';
import { MIN_SCALE, packLine, TUCK } from './lineLayout';

describe('packLine', () => {
  it('stands figures left to right without touching when there is room', () => {
    const r = packLine(
      [
        { fw: 200, tier: 0 },
        { fw: 200, tier: 0 },
      ],
      1000,
      1800,
    );
    expect(r.scale).toBe(1);
    expect(r.xs).toEqual([1100, 1300]);
  });

  it('lets a flyer tuck in beside a figure on the floor, but not two on the floor', () => {
    const r = packLine(
      [
        { fw: 200, tier: 0 },
        { fw: 200, tier: 1 },
        { fw: 200, tier: 0 },
      ],
      1000,
      2400,
    );
    expect(r.xs[1]! - r.xs[0]!).toBeCloseTo(200 * TUCK);
    expect(r.xs[2]! - r.xs[1]!).toBeCloseTo(200 * TUCK);
    const same = packLine(
      [
        { fw: 200, tier: 0 },
        { fw: 200, tier: 0 },
      ],
      1000,
      2400,
    );
    expect(same.xs[1]! - same.xs[0]!).toBe(200);
  });

  it('shrinks a crowded side to fit, down to a floor', () => {
    const crowd = Array.from({ length: 4 }, () => ({ fw: 250, tier: 0 }));
    const r = packLine(crowd, 1000, 1800);
    expect(r.scale).toBeLessThan(1);
    expect(r.scale).toBeGreaterThanOrEqual(MIN_SCALE);
    // the last figure's far edge stays inside the room (while above the minimum scale)
    const last = r.xs[r.xs.length - 1]! + (250 * r.scale) / 2;
    expect(last).toBeLessThanOrEqual(1800.5);
    const many = packLine(
      Array.from({ length: 30 }, () => ({ fw: 250, tier: 0 })),
      1000,
      1800,
    );
    expect(many.scale).toBe(MIN_SCALE);
  });

  it('runs to the left for the allies', () => {
    const r = packLine(
      [
        { fw: 200, tier: 0 },
        { fw: 200, tier: 0 },
      ],
      900,
      300,
    );
    expect(r.xs).toEqual([800, 600]);
  });

  it('handles an empty side', () => {
    expect(packLine([], 1000, 1800)).toEqual({ xs: [], scale: 1 });
  });
});
