// Rift Omens (DECISIONS #245) and Warden's Hearts (#246).

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, HEARTS } from '@sr/content/v2';
import {
  MAX_TIER,
  continueLoop,
  OMENS,
  availableNodes,
  chooseAscendancy,
  chooseHeart,
  duelPlan,
  enterNode,
  finishDuel,
  newRun,
  omenEffects,
  omensOf,
  omensAt,
  parseRun,
  serializeRun,
  type RunState,
} from './index';

describe('Rift Omens', () => {
  it('Second Wind at Tier II, Times Are Tough at III, Rallied Foes at IV, and they only add up (DECISIONS #515)', () => {
    expect(omensAt(1)).toHaveLength(0);
    expect(omensOf(2).map((o) => o.id)).toEqual(['second-wind']);
    expect(omensOf(3).map((o) => o.id)).toEqual(['times-are-tough']);
    expect(omensOf(4).map((o) => o.id)).toEqual(['rallied-foes']);
    for (let t = 2; t <= MAX_TIER; t++) {
      expect(omensAt(t).length).toBe(omensAt(t - 1).length + omensOf(t).length);
    }
    expect(omensAt(MAX_TIER)).toHaveLength(OMENS.length);
    expect(new Set(OMENS.map((o) => o.id)).size).toBe(OMENS.length);
  });

  it('Times Are Tough: from Tier III Shrines heal less, fights pay less, rewards offer one card fewer, and merchants charge more', () => {
    const before = omenEffects(2);
    expect([before.restPct, before.shardsPct, before.fewerChoices, before.pricePct]).toEqual([0, 0, 0, 0]);
    const t3 = omenEffects(3);
    expect([t3.restPct, t3.shardsPct, t3.fewerChoices, t3.pricePct]).toEqual([25, 20, 1, 25]);
    expect(omenEffects(4).pricePct).toBe(30);
    expect(omenEffects(20).pricePct).toBe(110);
    expect(omenEffects(20).fewerChoices).toBe(1);
  });

  it('Second Wind is 20% Barrier and 2 Might at Tier II', () => {
    expect(omenEffects(2).bossRise).toEqual([{ atPct: 50, barrierPct: 20, might: 2 }]);
  });

  it('no enemy starts with Thorns from an Omen any more', () => {
    expect(omenEffects(MAX_TIER).enemyStatuses.thorns ?? 0).toBe(0);
  });

  it('Rift Scars: from Tier V each new tier leaves a Wound in the deck', () => {
    expect(omenEffects(4).actWounds).toBe(0);
    expect(omenEffects(5).actWounds).toBe(1);
    expect(omenEffects(12).actWounds).toBe(2);
    const run = { ...newRun('knight', 'scars'), tier: 4, phase: 'loopCleared' as const };
    const after = continueLoop(run);
    expect(after.deck.filter((c) => c === 'wound')).toHaveLength(1);
    expect(after.context?.prelude?.text).toContain('Rift Scars: a Wound joins your deck.');
    // (no more than 6 in a deck)
    const full = { ...run, deck: [...run.deck, ...Array.from({ length: 6 }, () => 'wound')] };
    expect(continueLoop(full).deck.filter((c) => c === 'wound')).toHaveLength(6);
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
    expect(g.maxHp).toBe(r.maxHp - 20);
    expect(g.phase).toBe('loopCleared');
  });

  it('taking another gives the first back', () => {
    const r = { ...gift('gluttons-heart'), maxHp: 60, hp: 60 };
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

describe('an Ascendancy for beating Tier III (DECISIONS #519)', () => {
  const beat = (tier: number, _old: number, ascendancy?: string): RunState => {
    const r = newRun('knight', 'ascend-' + tier);
    const warden = r.map.nodes.find((n) => n.kind === 'warden')!;
    const here: RunState = {
      ...r,
      tier,
      phase: 'duel',
      at: warden.id,
      ...(ascendancy ? { ascendancy } : {}),
      context: { nodeId: warden.id },
    };
    return finishDuel(here, true, 40);
  };

  it('Tier III\'s Warden offers three, in place of the Gift', () => {
    const r = beat(3, 3);
    expect(r.phase).toBe('ascend');
    expect(r.context?.ascendancies).toHaveLength(3);
    expect(r.context?.offers).toBeUndefined();
    expect(r.context?.hearts).toBeUndefined();
  });

  it('no other Warden does', () => {
    expect(beat(1, 1).phase).toBe('gift');
    expect(beat(2, 1).phase).toBe('gift');
    expect(beat(4, 1, 'knight:paladin').phase).toBe('gift');
  });

  it('a run past Tier III without one, saved before they came, is offered it at its next Warden', () => {
    expect(beat(5, 3).phase).toBe('ascend');
    // (a run past Tier III without one is offered it at any Warden; a run below that, or with one, is not; DECISIONS #529)
    expect(beat(4, 1).phase).toBe('ascend');
    expect(beat(5, 2).phase).toBe('ascend');
    expect(beat(2, 1).phase).toBe('gift');
    expect(beat(4, 1, 'knight:paladin').phase).toBe('gift');
    expect(chooseAscendancy(beat(4, 1), 'knight:paladin').phase).toBe('loopCleared');
    expect(() => chooseAscendancy({ ...beat(4, 1), ascendancy: 'knight:marshal' }, 'knight:paladin')).toThrow();
  });

  it('taking one changes the class for the rest of the run and clears the tier', () => {
    const r = chooseAscendancy(beat(3, 3), 'knight:marshal');
    expect(r.ascendancy).toBe('knight:marshal');
    expect(r.phase).toBe('loopCleared');
    expect(parseRun(serializeRun(r))?.ascendancy).toBe('knight:marshal');
  });

  it('an extra card reward the fight earned comes after the choice', () => {
    const r = newRun('knight', 'ascend-extra');
    const warden = r.map.nodes.find((n) => n.kind === 'warden')!;
    const won = finishDuel({ ...r, tier: 3, stage: 3, phase: 'duel', at: warden.id, context: { nodeId: warden.id } }, true, 40, [], 0, 1);
    expect(won.phase).toBe('ascend');
    const after = chooseAscendancy(won, 'knight:paladin');
    expect(after.phase).toBe('reward');
    expect(after.context?.offers?.length).toBeGreaterThan(0);
  });

  it('cannot take another classâ€™s, or one not on offer', () => {
    expect(() => chooseAscendancy(beat(3, 3), 'monk:zealot')).toThrow();
    expect(() => chooseAscendancy(beat(2, 1), 'knight:marshal')).toThrow();
  });

  it('a save mid-choice comes back, and a save naming another classâ€™s loses it', () => {
    const r = beat(3, 3);
    expect(parseRun(serializeRun(r))?.phase).toBe('ascend');
    const odd = { ...chooseAscendancy(r, 'knight:paladin'), ascendancy: 'monk:zealot' };
    expect(parseRun(serializeRun(odd))?.ascendancy).toBeUndefined();
  });
});
