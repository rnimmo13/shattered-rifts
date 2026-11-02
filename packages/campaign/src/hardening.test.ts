// Phases, Elites and ghost Wardens harden with the Rift Tier (DECISIONS #527).

import { describe, expect, it } from 'vitest';
import { GHOST_ARENA_TIER, availableNodes, duelPlan, enterNode, ghostBossHp, newRun } from './run';
import { omenEffects } from './omens';
import { enemyScale } from './tierTable';
import type { NodeKind, RunState } from './types';

const planAt = (tier: number, kind: NodeKind) => {
  const run: RunState = { ...newRun('knight', 'harden'), tier, phase: 'map', context: null };
  const node = availableNodes(run)[0]!;
  node.kind = kind;
  node.enemyId = kind === 'warden' ? 'seraphine' : 'prism-magistrate';
  return duelPlan(enterNode(run, node.id))!;
};

describe('the Rift hardens at Tiers 5, 10 and 15', () => {
  it('each threshold makes every phase tougher than the one before, and nothing moves between them', () => {
    const rise = (t: number) => omenEffects(t).leaderRise[0]!;
    expect(omenEffects(4).riseBarrierPct).toBe(0);
    for (const [before, at] of [[4, 5], [9, 10], [14, 15]] as const) {
      expect(rise(at).barrierPct).toBeGreaterThan(rise(before).barrierPct);
      expect(rise(at).might).toBeGreaterThan(rise(before).might);
    }
    expect([5, 10, 15].map((t) => omenEffects(t).riseBarrierPct)).toEqual([5, 10, 15]);
    expect([5, 10, 15].map((t) => omenEffects(t).riseMight)).toEqual([1, 2, 3]);
    expect(omenEffects(9).riseBarrierPct).toBe(5);
    expect(omenEffects(16).riseBarrierPct).toBe(15);
  });

  it('it reaches every kind of phase', () => {
    const e = omenEffects(20);
    for (const r of [...e.bossRise, ...e.leaderRise, ...e.allRise]) expect(r.might).toBeGreaterThanOrEqual(3);
    // (Second Wind at Tier 15 alone is 33% and 4 Might)
    expect(omenEffects(15).bossRise[0]).toMatchObject({ barrierPct: 33 + 15, might: 4 + 3 });
  });

  it('Elites gain HP and damage at each threshold; plain fights and Wardens do not', () => {
    expect([1, 5, 10, 15].map((t) => omenEffects(t).eliteHpPct)).toEqual([0, 10, 20, 30]);
    expect([1, 5, 10, 15].map((t) => omenEffects(t).eliteDmgPct)).toEqual([0, 5, 10, 15]);
    const scale = enemyScale(15, 1);
    const elite = planAt(15, 'elite');
    expect(elite.hpPct).toBe(Math.round(scale.hp * 1.3));
    expect(elite.dmgPct).toBe(Math.round(scale.dmg * 1.15));
    expect(planAt(15, 'duel').hpPct).toBe(scale.hp);
    expect(planAt(15, 'duel').dmgPct).toBe(scale.dmg);
    expect(planAt(15, 'warden').hpPct).toBe(scale.hp);
  });

  it("a Warden on an Elite stop has no Elite's bump, and the act's own Warden hits at least as hard", () => {
    const run: RunState = { ...newRun('knight', 'inversion'), tier: 20, phase: 'map', context: null };
    const node = availableNodes(run)[0]!;
    node.kind = 'elite';
    node.enemyId = 'seraphine';
    const mid = duelPlan(enterNode(run, node.id))!;
    const boss = planAt(20, 'warden');
    expect(mid.hpPct).toBeLessThanOrEqual(boss.hpPct);
    expect(mid.dmgPct).toBeLessThanOrEqual(boss.dmgPct);
  });

  it('Tier 1 fights are untouched', () => {
    const scale = enemyScale(1, 1);
    expect(planAt(1, 'elite').hpPct).toBe(scale.hp);
    expect(planAt(1, 'elite').dmgPct).toBe(scale.dmg);
  });
});

describe('a ghost Warden from Tier 10', () => {
  it('jumps to six times its Riftwalker at Tier 10, never falls after that, and is unchanged below it', () => {
    expect(GHOST_ARENA_TIER).toBe(10);
    expect(ghostBossHp('knight', 10, 1)).toBe(480);
    expect(ghostBossHp('knight', 10, 1)).toBeGreaterThan(ghostBossHp('knight', 9, 3));
    expect(ghostBossHp('knight', 9, 1)).toBe(Math.round((80 * 2.6 * enemyScale(9, 1).hp) / enemyScale(4, 1).hp));
    let last = 0;
    for (let tier = 10; tier <= 20; tier++) {
      for (let stage = 1; stage <= 3; stage++) {
        expect(ghostBossHp('knight', tier, stage)).toBeGreaterThan(last);
        last = ghostBossHp('knight', tier, stage);
      }
    }
  });
});
