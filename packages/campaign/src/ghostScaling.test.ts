import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import { ECHO_HP_PCT, ghostBossDmg, ghostBossHp } from './run';

describe('linear campaign ghost scaling', () => {
  it.each(Object.keys(RIFTWALKERS))(
    '%s has constant tier growth, including Tiers XIII and XVIII',
    (hero) => {
      for (const savedHp of [undefined, 120, 10000]) {
        const hp = Array.from({ length: 17 }, (_, i) => ghostBossHp(hero, i + 4, 1, savedHp));
        const increments = hp.slice(1).map((v, i) => v - hp[i]!);
        expect(Math.min(...increments)).toBeGreaterThan(0);
        // Integer HP can alternate by one point, but never jump to a new growth rate.
        expect(Math.max(...increments) - Math.min(...increments)).toBeLessThanOrEqual(1);
        const echoes = hp.map((v) => Math.round((v * ECHO_HP_PCT) / 100));
        const echoIncrements = echoes.slice(1).map((v, i) => v - echoes[i]!);
        expect(Math.min(...echoIncrements)).toBeGreaterThan(0);
        expect(Math.max(...echoIncrements) - Math.min(...echoIncrements)).toBeLessThanOrEqual(2);
      }
    },
  );

  it('damage adds exactly three percentage points each tier, without late acceleration', () => {
    const damage = Array.from({ length: 17 }, (_, i) => ghostBossDmg(i + 4));
    expect(damage[0]).toBe(100);
    expect(damage.at(-1)).toBe(148);
    expect(damage.slice(1).map((v, i) => v - damage[i]!)).toEqual(Array(16).fill(3));
  });

  it('credits earned HP additively instead of multiplying it with tier', () => {
    for (const tier of [4, 5, 10, 13, 18, 20]) {
      expect(ghostBossHp('knight', tier, 1, 100) - ghostBossHp('knight', tier)).toBe(20);
      expect(ghostBossHp('knight', tier, 1, 120) - ghostBossHp('knight', tier)).toBe(40);
      expect(ghostBossHp('knight', tier, 1, 10000)).toBe(ghostBossHp('knight', tier, 1, 120));
      expect(ghostBossHp('knight', tier, 1, 1)).toBe(ghostBossHp('knight', tier));
    }
  });

  it('has reviewable checkpoints for an 80-base-HP Knight with 120 saved Max HP', () => {
    expect(
      [4, 5, 10, 15, 20].map((tier) => {
        const hp = ghostBossHp('knight', tier, 1, 120);
        return [tier, hp, Math.round((hp * ECHO_HP_PCT) / 100), ghostBossDmg(tier)];
      }),
    ).toEqual([
      [4, 216, 130, 100],
      [5, 232, 139, 103],
      [10, 312, 187, 118],
      [15, 392, 235, 133],
      [20, 472, 283, 148],
    ]);
  });

  it('clamps tier/stage inputs and tolerates missing or invalid optional saved HP', () => {
    expect(ghostBossHp('knight', 1)).toBe(ghostBossHp('knight', 4));
    expect(ghostBossHp('knight', 99)).toBe(ghostBossHp('knight', 20));
    expect(ghostBossDmg(99)).toBe(148);
    expect(ghostBossDmg(4, -1)).toBe(100);
    expect(ghostBossDmg(4, 99)).toBe(102);
    expect(ghostBossHp('knight', 4, 1, NaN)).toBe(176);
    expect(ghostBossHp('knight', 4, 1, Infinity)).toBe(176);
  });
});
