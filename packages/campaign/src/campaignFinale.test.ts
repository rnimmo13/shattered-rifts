import { describe, expect, it } from 'vitest';
import { ascendanciesOf } from '@sr/content/v2';
import { COMBAT_DB } from '@sr/content/v2';
import { createCombat } from '@sr/combat';
import {
  availableNodes,
  bank,
  chooseCard,
  continueLoop,
  enterNode,
  finishDuel,
  duelPlan,
  gauntletMap,
  MAX_TIER,
  newRun,
  parseRun,
  serializeRun,
  WARDEN_SEQUENCE,
  type RunState,
} from './index';

describe('the twelve-tier campaign', () => {
  it('assigns each of the eleven Wardens to one tier and enters a pure final gauntlet', () => {
    expect(MAX_TIER).toBe(12);
    let run = newRun('engineer', 'twelve-tier-roster');
    const seen: string[] = [];
    for (let tier = 1; tier <= 11; tier++) {
      expect(run.tier).toBe(tier);
      const bosses = run.map.nodes.filter((n) => n.kind === 'warden');
      expect(bosses).toHaveLength(1);
      expect(bosses[0]!.enemyId).toBe(run.wardenOrder![tier - 1]);
      seen.push(bosses[0]!.enemyId!);
      run = parseRun(serializeRun(run))!;
      run = continueLoop({ ...run, phase: 'loopCleared', context: null });
    }
    expect(run.tier).toBe(12);
    expect(run.phase).toBe('map');
    expect(new Set(seen).size).toBe(11);
    expect([...seen].sort()).toEqual([...WARDEN_SEQUENCE].sort());
    expect(run.map.nodes).toHaveLength(12);
    expect(run.map.nodes.every((n) => n.kind === 'warden')).toBe(true);
    expect(
      run.map.nodes
        .slice(0, 11)
        .map((n) => n.enemyId)
        .sort(),
    ).toEqual([...WARDEN_SEQUENCE].sort());
    expect(run.map.nodes.at(-1)!.enemyId).toBe('vorthax');
    expect(parseRun(serializeRun(run))!.map).toEqual(run.map);
    expect(availableNodes(run)).toHaveLength(1);
  });
  it('varies both saved Warden permutations across run seeds', () => {
    const first = new Set<string>(),
      finale = new Set<string>();
    for (const seed of ['order-a', 'order-b', 'order-c', 'order-d']) {
      const run = newRun('knight', seed);
      expect(newRun('knight', seed).wardenOrder).toEqual(run.wardenOrder);
      first.add(run.wardenOrder!.join(','));
      const end = continueLoop({ ...run, tier: 11, phase: 'loopCleared', context: null });
      finale.add(end.map.nodes.map((n) => n.enemyId).join(','));
      expect(
        end.map.nodes
          .slice(0, 11)
          .map((n) => n.enemyId)
          .sort(),
      ).toEqual([...WARDEN_SEQUENCE].sort());
    }
    expect(first.size).toBe(4);
    expect(finale.size).toBe(4);
  });
  it('Resolve reseeds the real fight shuffle and preserves that attempt after save/reload', () => {
    const base = newRun('knight', 'retry-deck-shuffle', 'easy');
    const node = base.map.nodes.find((n) => n.kind === 'duel')!;
    base.phase = 'duel';
    base.context = { nodeId: node.id };
    base.at = node.id;
    const initial = duelPlan(base)!;
    const retry = finishDuel(base, false);
    const next = duelPlan(retry)!;
    expect(next.encounterId).toBe(initial.encounterId);
    expect(next.seed).not.toBe(initial.seed);
    const opening = (plan: typeof initial) => {
      const state = createCombat(COMBAT_DB, {
        seed: plan.seed,
        a: { hero: 'knight', deck: plan.deck },
        b: { enemies: plan.units },
      }).state;
      return [...state.sides.a.hand, ...state.sides.a.draw].map((c) => c.card);
    };
    expect(opening(next)).not.toEqual(opening(initial));
    expect(duelPlan(parseRun(serializeRun(retry))!)!.seed).toBe(next.seed);
    expect(opening(duelPlan(parseRun(serializeRun(retry))!)!)).toEqual(opening(next));
    expect(duelPlan(finishDuel(retry, false))!.seed).not.toBe(next.seed);
  });

  it('keeps Warden Gifts with reduced finale recovery, saves between fights, then records victory', () => {
    let run: RunState = {
      ...newRun('engineer', 'gauntlet-rewards'),
      tier: 12,
      map: gauntletMap(),
      at: null,
      cleared: [],
      context: null,
      phase: 'map',
      ascendancy: ascendanciesOf('engineer')[0]!.id,
    };
    run = enterNode(run, availableNodes(run)[0]!.id);
    for (let i = 0; i < 12; i++) {
      expect(run.phase).toBe('duel');
      const before = run.maxHp;
      if (i === 11) {
        // Valerion: no Gift, shards, potion, Boon, Max HP or healing; straight to the victory screen
        const { shards, potions, boons, resolve } = run;
        run = finishDuel(run, true, 10, run.potions, 0, 2);
        expect(run.maxHp).toBe(before);
        expect(run.hp).toBe(10);
        expect(run.shards).toBe(shards);
        expect(run.potions).toEqual(potions);
        expect(run.boons).toEqual(boons);
        expect(run.resolve).toBe(resolve);
        expect(run.context).toBeNull();
        expect(run.eventResult).toBeUndefined();
        expect(run.stats.nodesCleared).toBe(12);
        expect(run.cleared).toContain(run.map.nodes[11]!.id);
        break;
      }
      run = finishDuel(run, true, 10);
      expect(run.maxHp).toBeGreaterThanOrEqual(before + 5);
      expect(run.hp).toBeGreaterThanOrEqual(15 + Math.ceil(run.maxHp * 0.15));
      if (i === 0) expect(run.hp).toBe(15 + Math.ceil(run.maxHp * 0.15));
      if (i === 0) expect(run.maxHp).toBe(before + 5);
      expect(run.phase).toBe('gift');
      const restored = parseRun(serializeRun(run));
      expect(restored).not.toBeNull();
      run = chooseCard(restored!, null);
      expect(run.stats.nodesCleared).toBe(i + 1);
      if (i < 11) {
        expect(run.phase).toBe('map');
        expect(run.context).toBeNull();
        expect(run.at).toBe(run.map.nodes[i]!.id);
        expect(run.cleared).toContain(run.at);
        expect(run.won).not.toBe(true);
        const parked = parseRun(serializeRun(run))!;
        expect(parked).toEqual(run);
        expect(availableNodes(parked).map((n) => n.id)).toEqual([run.map.nodes[i + 1]!.id]);
        run = enterNode(parked, availableNodes(parked)[0]!.id);
        expect(run.context!.nodeId).toBe(run.map.nodes[i + 1]!.id);
        expect(duelPlan(parseRun(serializeRun(run))!)!.seed).toBe(duelPlan(run)!.seed);
      }
    }
    expect(run.phase).toBe('loopCleared');
    expect(run.won).toBe(true);
    expect(parseRun(serializeRun(run))?.won).toBe(true);
    expect(() => continueLoop(run)).toThrow();
    expect(bank(run).phase).toBe('banked');
  });

  it('sends a run saved on the old post-Valerion Gift straight to victory', () => {
    const base = newRun('knight', 'vorthax-gift-save');
    const map = gauntletMap();
    const last = map.nodes.at(-1)!;
    const saved: RunState = {
      ...base,
      tier: MAX_TIER,
      map,
      at: last.id,
      cleared: map.nodes.map((n) => n.id),
      phase: 'gift',
      context: { nodeId: last.id, offers: [base.deck[0]!] },
      eventResult: 'The Warden falls: +5 Max HP.',
    };
    const loaded = parseRun(serializeRun(saved))!;
    expect(loaded.phase).toBe('loopCleared');
    expect(loaded.won).toBe(true);
    expect(loaded.context).toBeNull();
    expect(loaded.eventResult).toBeUndefined();
    expect(loaded.stats.nodesCleared).toBe(base.stats.nodesCleared);
  });

  it('does not erase an existing map, and migrates a cleared legacy tier without discarding earned progress', () => {
    const legacy = newRun('knight', 'legacy-finale');
    delete legacy.campaignRoute;
    legacy.tier = 13;
    legacy.phase = 'map';
    legacy.context = null;
    const before = serializeRun(legacy);
    const loaded = parseRun(serializeRun(legacy))!;
    expect(loaded.map).toEqual(parseRun(before)!.map);
    legacy.phase = 'loopCleared';
    legacy.stats.nodesCleared = 300;
    const migrated = parseRun(serializeRun(legacy))!;
    expect(migrated.tier).toBe(12);
    expect(migrated.map.gauntlet).toBe(true);
    expect(migrated.stats.nodesCleared).toBe(300);
    expect(migrated.deck).toEqual(legacy.deck);
    expect(migrated.hp).toBe(legacy.hp);
  });
});
