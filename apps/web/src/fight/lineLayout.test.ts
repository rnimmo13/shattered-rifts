import { describe, expect, it } from 'vitest';
import { MIN_SCALE, centredLine, packLine, stableFormation, TUCK } from './lineLayout';

describe('packLine', () => {
  it('adds a second row without shrinking or moving the first pair when another minion joins', () => {
    const pair = [
      { fw: 234, tier: 0 },
      { fw: 234, tier: 0 },
    ];
    const first = stableFormation(pair, 440, 910);
    const crowd = stableFormation([...pair, ...pair], 440, 910);
    expect(crowd.xs.slice(0, 2)).toEqual(first.xs);
    expect(crowd.rows).toEqual([0, 0, 1, 1]);
    expect(crowd.xs[1]! - crowd.xs[0]!).toBeGreaterThanOrEqual(234);
    expect(crowd.xs.every((x) => x - 117 >= 440 && x + 117 <= 910)).toBe(true);
  });
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

describe('centredLine (the upright layout, DECISIONS #443)', () => {
  it('sits the group in the middle of its span', () => {
    const r = centredLine(
      [
        { fw: 200, tier: 0 },
        { fw: 200, tier: 0 },
      ],
      500,
      1500,
    );
    expect(r.xs).toEqual([900, 1100]);
  });
  it('fills the span when it has to shrink, and handles an empty side', () => {
    const r = centredLine(
      Array.from({ length: 4 }, () => ({ fw: 250, tier: 0 })),
      500,
      1300,
    );
    expect(r.scale).toBeLessThan(1);
    expect(r.xs[0]! - (250 * r.scale) / 2).toBeCloseTo(500, 0);
    expect(centredLine([], 500, 1300)).toEqual({ xs: [], scale: 1 });
  });
});
