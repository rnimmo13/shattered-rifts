// Rift Omens (DECISIONS #245) and Warden's Hearts (#246).

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, HEARTS } from '@sr/content/v2';
import {
  MAX_TIER,
  OMENS,
  availableNodes,
  chooseHeart,
  duelPlan,
  enterNode,
  newRun,
  omenEffects,
  omenOf,
  omensAt,
  parseRun,
  serializeRun,
  type RunState,
} from './index';

describe('Rift Omens', () => {
  it('one comes with every tier from II to the last, and none at Tier I', () => {
    expect(omensAt(1)).toHaveLength(0);
    for (let t = 2; t <= MAX_TIER; t++) {
      expect(omenOf(t), `Tier ${t}`).toBeDefined();
      expect(omensAt(t)).toHaveLength(t - 1);
    }
    expect(new Set(OMENS.map((o) => o.id)).size).toBe(OMENS.length);
  });

  it('stack, and grow with the tier', () => {
    const two = omenEffects(2);
    expect(two.bossRise).toHaveLength(1);
    const deep = omenEffects(MAX_TIER);
    expect(deep.bossRise[0]!.barrierPct).toBeGreaterThan(two.bossRise[0]!.barrierPct);
    expect(deep.bossRise.length).toBeGreaterThan(1);
    expect(deep.pricePct).toBeGreaterThan(omenEffects(3).pricePct);
    expect(Object.keys(deep.heroStatuses).length).toBeGreaterThan(0);
    for (const o of OMENS) expect(o.text(MAX_TIER).length).toBeGreaterThan(10);
  });
});

/** a run at a tier, standing at a fight of this kind */
function at(tier: number, kind: 'duel' | 'elite' | 'warden'): RunState {
  const base: RunState = {
    ...newRun('knight', `omen-${tier}-${kind}`),
    phase: 'map',
    context: null,
    tier,
  };
  const node = availableNodes(base)[0]!;
  const enemy = base.map.nodes.find((n) => n.kind === kind && n.enemyId)?.enemyId;
  return enterNode(
    {
      ...base,
      map: {
        ...base.map,
        nodes: base.map.nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                kind,
                ...((enemy ?? n.enemyId) ? { enemyId: (enemy ?? n.enemyId) as string } : {}),
              }
            : n,
        ),
      },
    },
    node.id,
  );
}

describe('Omens in a fight', () => {
  it('Tier I fights are as they were', () => {
    const plan = duelPlan(at(1, 'elite'))!;
    expect(plan.mods).toEqual([]);
    expect(plan.heroStatuses).toEqual({});
  });

  it('from Tier II an elite rises into a second phase', () => {
    const plan = duelPlan(at(2, 'elite'))!;
    expect(plan.mods.some((m) => m.rise?.some((r) => r.atPct === 50))).toBe(true);
  });

  it('deep in, you start shaken and Static joins your draw pile', () => {
    const r = at(MAX_TIER, 'duel');
    const plan = duelPlan(r)!;
    expect(plan.heroStatuses.faltering).toBeGreaterThan(0);
    expect(plan.deck.length).toBeGreaterThan(r.deck.length);
    expect(plan.deck.filter((c) => c === 'static').length).toBeGreaterThan(0);
  });
});

describe("Warden's Hearts", () => {
  const gift = (heart?: string): RunState => ({
    ...newRun('knight', 'hearts'),
    phase: 'gift',
    ...(heart ? { heart } : {}),
    context: { nodeId: 'x', offers: [], hearts: HEARTS.map((h) => h.id) },
  });

  it('are Hearts, and never ordinary Boons', () => {
    for (const h of HEARTS) expect(COMBAT_DB.boons[h.id]?.heart).toBe(true);
  });

  it('one is taken instead of the card, and its Max HP change comes with it', () => {
    const r = gift();
    const g = chooseHeart(r, 'gluttons-heart');
    expect(g.heart).toBe('gluttons-heart');
    expect(g.maxHp).toBe(r.maxHp - 15);
    expect(g.phase).toBe('stageClear');
  });

  it('taking another gives the first back', () => {
    const r = { ...gift('gluttons-heart'), maxHp: 65, hp: 65 };
    const g = chooseHeart(r, 'ember-heart');
    expect(g.heart).toBe('ember-heart');
    expect(g.maxHp).toBe(80);
  });

  it('works in fights like a Boon, and is kept in a save', () => {
    const r = { ...at(2, 'duel'), heart: 'ember-heart' };
    expect(duelPlan(r)!.boons).toContain('ember-heart');
    expect(parseRun(serializeRun(r))?.heart).toBe('ember-heart');
  });
});
