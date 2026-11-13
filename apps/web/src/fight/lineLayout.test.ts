import { describe, expect, it } from 'vitest';
import {
  MIN_SCALE,
  centredLine,
  fixedFormation,
  packLine,
  rowScale,
  stableFormation,
  selectionFormation,
  TUCK,
} from './lineLayout';

describe('selectable formations', () => {
  it('gives three differently sized enemies separate full silhouettes and a gutter', () => {
    const items = [
      { fw: 270, tier: 0 },
      { fw: 420, tier: 1 },
      { fw: 310, tier: 0 },
    ];
    for (const [near, far] of [
      [990, 1840],
      [600, 1360],
      [790, 1350],
      [900, 440],
    ]) {
      const fit = selectionFormation(items, near!, far!);
      expect(fit.rows).toEqual([0, 0, 0]);
      for (let i = 1; i < items.length; i++) {
        const gap =
          Math.abs(fit.xs[i]! - fit.xs[i - 1]!) -
          ((items[i]!.fw + items[i - 1]!.fw) * fit.scale) / 2;
        expect(gap).toBeGreaterThanOrEqual(32);
      }
      items.forEach((item, i) => {
        expect(fit.xs[i]! - (item.fw * fit.scale) / 2).toBeGreaterThanOrEqual(
          Math.min(near!, far!),
        );
        expect(fit.xs[i]! + (item.fw * fit.scale) / 2).toBeLessThanOrEqual(Math.max(near!, far!));
      });
    }
  });
  it('centers the second rank between the first rank columns and handles empty sides', () => {
    const fit = selectionFormation(
      Array.from({ length: 5 }, () => ({ fw: 260, tier: 0 })),
      990,
      1840,
    );
    expect(fit.rows).toEqual([0, 0, 0, 1, 1]);
    expect(fit.xs[3]).toBeGreaterThan(fit.xs[0]!);
    expect(fit.xs[3]).toBeLessThan(fit.xs[1]!);
    expect(selectionFormation([], 0, 1)).toEqual({ xs: [], rows: [], scale: 1 });
  });
});

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

describe('a wide screen: one size all fight, one row, nobody hidden (Robert, 2026-11-12)', () => {
  const item = (fw: number) => ({ fw, tier: 0 });
  it('stands everyone in one row at the size it is given, whatever the crowd', () => {
    for (let n = 1; n <= 7; n++) {
      const fit = fixedFormation(
        Array.from({ length: n }, () => item(260)),
        990,
        1840,
        0.8,
      );
      expect(fit.scale).toBe(0.8);
      expect(fit.rows.every((r) => r === 0)).toBe(true);
      expect(fit.xs).toHaveLength(n);
    }
  });
  it('no two figures stand at the same place, even crowded', () => {
    const fit = fixedFormation(
      Array.from({ length: 4 }, () => item(500)),
      990,
      1240,
      0.6,
    );
    for (let i = 1; i < fit.xs.length; i++)
      expect(Math.abs(fit.xs[i]! - fit.xs[i - 1]!)).toBeGreaterThan(40);
  });
  it('sizes a side for the crowd it can reach, so a summon joining needs no resize', () => {
    // (a summoner and room kept for three summons of its width: the size then holds when they arrive)
    const room = 850;
    const before = rowScale([300], [300, 300, 300], room);
    const after = rowScale([300, 300, 300, 300], [], room);
    expect(before).toBeCloseTo(after, 5);
    // (no summoner: a full-size line stays full size)
    expect(rowScale([300, 300], [], room)).toBe(1);
  });
  it('a row keeps to its own half: three companions never reach the enemies (#774)', () => {
    // (a Beastmaster's three wolves on the allies' side, 910 down to 440, at the size the side was given)
    const scale = rowScale([220, 220, 220], [], 470);
    const allies = fixedFormation([item(220), item(220), item(220)], 910, 440, scale);
    const w = 220 * scale;
    // (the nearest wolf's edge within 20 px of the side's near end)
    expect(allies.xs[0]! + w / 2).toBeLessThanOrEqual(910 + 20 + 0.001);
    // (and the three still stand apart)
    for (let i = 1; i < allies.xs.length; i++)
      expect(allies.xs[i - 1]! - allies.xs[i]!).toBeGreaterThanOrEqual(130 - 0.001);
    // (three enemies on their side, 990 to 1840: their nearest edge keeps the same distance)
    const foes = fixedFormation([item(260), item(260), item(260)], 990, 1840, 1);
    expect(foes.xs[0]! - 130).toBeGreaterThanOrEqual(990 - 20 - 0.001);
    // (so the two rows are apart)
    expect(foes.xs[0]! - 130).toBeGreaterThan(allies.xs[0]! + w / 2);
  });
  it('a row with room to spare is not closed up', () => {
    const fit = fixedFormation([item(200), item(200)], 990, 1840, 1);
    expect(fit.xs[1]! - fit.xs[0]!).toBeGreaterThanOrEqual(240 - 0.001);
  });
  it('runs from right to left on the allies side', () => {
    const fit = fixedFormation([item(250), item(250)], 910, 440, 0.7);
    expect(fit.xs[0]!).toBeGreaterThan(fit.xs[1]!);
  });
});
