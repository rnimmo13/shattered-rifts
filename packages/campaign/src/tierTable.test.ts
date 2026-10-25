import { describe, expect, it } from 'vitest';
import { TIER_TABLE, enemyScale } from './tierTable';

describe('the tier table', () => {
  it('has a row for every Rift Tier up to 20', () => {
    expect(TIER_TABLE).toHaveLength(20);
  });

  it('stage 1 of a tier is exactly the row, as a percent of base', () => {
    for (let t = 1; t <= 20; t++) {
      const row = TIER_TABLE[t - 1]!;
      expect(enemyScale(t, 1)).toEqual({ hp: 100 + row.hp, dmg: 100 + row.dmg });
    }
  });

  it('stages climb evenly toward the next tier without reaching it', () => {
    for (let t = 1; t < 20; t++) {
      const [s1, s2, s3] = [1, 2, 3].map((s) => enemyScale(t, s)) as [
        { hp: number; dmg: number },
        { hp: number; dmg: number },
        { hp: number; dmg: number },
      ];
      const next = enemyScale(t + 1, 1);
      expect(s2.hp).toBeGreaterThan(s1.hp);
      expect(s3.hp).toBeGreaterThan(s2.hp);
      expect(s3.hp).toBeLessThan(next.hp);
      expect(s3.dmg).toBeLessThan(next.dmg);
      // a third of the gap, two thirds of the gap
      expect(s2.hp).toBe(Math.round(s1.hp + (next.hp - s1.hp) / 3));
      expect(s3.hp).toBe(Math.round(s1.hp + ((next.hp - s1.hp) * 2) / 3));
    }
  });

  it('the top tier keeps climbing by the gap that led into it', () => {
    const gapHp = TIER_TABLE[19]!.hp - TIER_TABLE[18]!.hp;
    const gapDmg = TIER_TABLE[19]!.dmg - TIER_TABLE[18]!.dmg;
    expect(enemyScale(20, 3).hp).toBe(Math.round(100 + TIER_TABLE[19]!.hp + (gapHp * 2) / 3));
    expect(enemyScale(20, 3).dmg).toBe(Math.round(100 + TIER_TABLE[19]!.dmg + (gapDmg * 2) / 3));
  });

  it('clamps tiers and stages that are out of range', () => {
    expect(enemyScale(0, 1)).toEqual(enemyScale(1, 1));
    expect(enemyScale(1, 9)).toEqual(enemyScale(1, 3));
    expect(enemyScale(1, 0)).toEqual(enemyScale(1, 1));
  });
});
