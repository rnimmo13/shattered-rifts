import { describe, expect, it } from 'vitest';
import { TIER_TABLE, enemyScale } from './tierTable';

describe('the tier table', () => {
  it('has a row for every Rift Tier up to 20', () => {
    expect(TIER_TABLE).toHaveLength(20);
  });

  it('Tier I already asks more than the enemies as written (they are the base the table scales)', () => {
    expect(enemyScale(1, 1).hp).toBeGreaterThanOrEqual(100);
    expect(enemyScale(1, 1).dmg).toBeGreaterThanOrEqual(100);
  });

  it('reads each stage straight from the row', () => {
    for (let t = 1; t <= 20; t++)
      for (let st = 1; st <= 3; st++) {
        const row = TIER_TABLE[t - 1]!;
        expect(enemyScale(t, st)).toEqual({ hp: row.hp[st - 1], dmg: row.dmg[st - 1] });
      }
  });

  it('climbs through the stages of a tier, and from tier to tier at every stage', () => {
    for (let t = 1; t <= 20; t++) {
      const [s1, s2, s3] = [1, 2, 3].map((st) => enemyScale(t, st)) as [
        { hp: number; dmg: number },
        { hp: number; dmg: number },
        { hp: number; dmg: number },
      ];
      expect(s2.hp).toBeGreaterThan(s1.hp);
      expect(s3.hp).toBeGreaterThan(s2.hp);
      expect(s2.dmg).toBeGreaterThan(s1.dmg);
      expect(s3.dmg).toBeGreaterThan(s2.dmg);
      if (t < 20)
        for (let st = 1; st <= 3; st++) {
          expect(enemyScale(t + 1, st).hp).toBeGreaterThan(enemyScale(t, st).hp);
          expect(enemyScale(t + 1, st).dmg).toBeGreaterThan(enemyScale(t, st).dmg);
        }
    }
  });

  it('is one rising ladder: every stage harder than the last, and stage 1 of a tier harder than stage 3 of the tier below', () => {
    const steps = TIER_TABLE.flatMap((row) =>
      [0, 1, 2].map((i) => ({ hp: row.hp[i]!, dmg: row.dmg[i]! })),
    );
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]!.hp, `step ${i + 1}`).toBeGreaterThan(steps[i - 1]!.hp);
      expect(steps[i]!.dmg, `step ${i + 1}`).toBeGreaterThan(steps[i - 1]!.dmg);
    }
  });

  it('stays in the range a deck can grow into (no thirty-fold HP sponges)', () => {
    for (const row of TIER_TABLE) {
      for (const v of row.hp) expect(v).toBeLessThanOrEqual(1350);
      for (const v of row.dmg) expect(v).toBeLessThanOrEqual(400);
    }
  });

  it('clamps tiers and stages that are out of range', () => {
    expect(enemyScale(0, 1)).toEqual(enemyScale(1, 1));
    expect(enemyScale(1, 9)).toEqual(enemyScale(1, 3));
    expect(enemyScale(1, 0)).toEqual(enemyScale(1, 1));
    expect(enemyScale(25, 2)).toEqual(enemyScale(20, 2));
  });
});
