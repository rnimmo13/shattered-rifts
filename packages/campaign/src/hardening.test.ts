// Campaign growth and bounded phase pressure (DECISIONS #576).

import { describe, expect, it } from 'vitest';
import { availableNodes, duelPlan, enterNode, ghostBossHp, newRun } from './run';
import { omenEffects } from './omens';
import { enemyScale } from './tierTable';
import type { NodeKind, RunState } from './types';
import { applyAction, createCombat, heroOf } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';

const planAt = (tier: number, kind: NodeKind) => {
  const run: RunState = { ...newRun('knight', 'harden'), tier, phase: 'map', context: null };
  const node = availableNodes(run)[0]!;
  node.kind = kind;
  node.enemyId = kind === 'warden' ? 'seraphine' : 'prism-magistrate';
  return duelPlan(enterNode(run, node.id))!;
};

describe('linear campaign growth', () => {
  it('uses the same tier budget for ordinary fights, Elites and Wardens', () => {
    for (let tier = 1; tier <= 20; tier++) {
      for (const kind of ['duel', 'elite', 'warden'] as const) {
        const plan = planAt(tier, kind);
        expect(plan.hpPct).toBe(enemyScale(tier, 1).hp);
        expect(plan.dmgPct).toBe(enemyScale(tier, 1).dmg);
      }
    }
  });

  it('bounds opening penalties and damage growth from Omens through Tier XX', () => {
    for (let tier = 1; tier <= 20; tier++) {
      const e = omenEffects(tier);
      expect(e.heroStatuses.exposed ?? 0).toBe(0);
      expect(e.heroStatuses.faltering ?? 0).toBeLessThanOrEqual(1);
      expect(e.heroStatuses.brittle ?? 0).toBeLessThanOrEqual(1);
      expect(e.bossStatuses.ritual ?? 0).toBe(0);
      expect(e.bossStatuses.might ?? 0).toBeLessThanOrEqual(1);
      expect(e.leadStatuses.vigor ?? 0).toBeLessThanOrEqual(1);
      expect(e.fightCards.length).toBeLessThanOrEqual(1);
      expect(e.actWounds).toBeLessThanOrEqual(1);
      expect(e.bossRise.reduce((sum, r) => sum + r.might, 0)).toBeLessThanOrEqual(3);
      expect(e.allRise.every((r) => r.might === 0)).toBe(true);
    }
    expect(omenEffects(20,true).bossRise).toEqual([
      { atPct: 50, barrierPct: 24, might: 2 },
      { atPct: 25, barrierPct: 13.5, might: 1 },
    ]);
    expect(omenEffects(12).bossRise).toEqual([
      {atPct:50,barrierPct:20,might:2},
      {atPct:25,barrierPct:11,might:1},
    ]);
  });

  it('phase protection grows smoothly without threshold hardening bonuses', () => {
    for (let tier = 3; tier <= 20; tier++) {
      expect(
        omenEffects(tier).bossRise[0]!.barrierPct - omenEffects(tier - 1).bossRise[0]!.barrierPct,
      ).toBe(0.5);
      expect(omenEffects(tier).bossRise[0]!.might).toBe(2);
    }
  });

  it.each([1, 5, 10, 15, 17, 18, 19, 20])(
    'applies the Tier %i damage budget to an actual multi-hit attack',
    (tier) => {
      const plan = planAt(tier, 'duel');
      const { state } = createCombat(COMBAT_DB, {
        seed: 'campaign-damage-budget',
        a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
        b: { enemies: ['patrol-unit'], hpPct: plan.hpPct, dmgPct: plan.dmgPct },
      });
      const hero = heroOf(state.sides.a)!;
      hero.hp = hero.maxHp = 10000;
      // Isolate incoming damage from the Knight's Barrier for unspent Mana/Reserves.
      state.sides.a.mana = 0;
      state.sides.a.reserves = 0;
      const foe = state.sides.b.units[0]!;
      foe.intent = { move: 'burst', target: hero.id };
      const result = applyAction(COMBAT_DB, state, { type: 'endTurn' });
      expect(10000 - heroOf(result.state.sides.a)!.hp).toBe(
        3 * Math.floor((5 * plan.dmgPct) / 100),
      );
    },
  );

  it('keeps a large Tier XX Warden hit within its base damage budget', () => {
    const plan = planAt(20, 'warden');
    const { state } = createCombat(COMBAT_DB, {
      seed: 'warden-hit-budget',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['seraphine'], hpPct: plan.hpPct, dmgPct: plan.dmgPct },
    });
    const hero = heroOf(state.sides.a)!;
    hero.hp = hero.maxHp = 10000;
    state.sides.a.mana = 0;
    state.sides.a.reserves = 0;
    state.sides.b.units[0]!.intent = { move: 'bell2', target: hero.id };
    const result = applyAction(COMBAT_DB, state, { type: 'endTurn' });
    expect(10000 - heroOf(result.state.sides.a)!.hp).toBe(62);
  });
});
describe('campaign ghost scaling', () => {
  it('has no Tier 13 Arena-HP jump and stays increasing through legacy stages', () => {
    expect(ghostBossHp('knight', 13, 1) - ghostBossHp('knight', 12, 1)).toBe(16);
    expect(ghostBossHp('knight', 13, 1)).toBeGreaterThan(ghostBossHp('knight', 12, 3));
    expect(ghostBossHp('knight', 12, 1)).toBe(304);
    let last = 0;
    for (let tier = 4; tier <= 20; tier++) {
      for (let stage = 1; stage <= 3; stage++) {
        expect(ghostBossHp('knight', tier, stage)).toBeGreaterThan(last);
        last = ghostBossHp('knight', tier, stage);
      }
    }
  });
});
