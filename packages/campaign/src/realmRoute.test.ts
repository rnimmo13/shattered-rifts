import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { CAMPAIGN_REALMS, CAMPAIGN_REALM_IDS, DRAGON_WARDENS, encounter } from '@sr/content/v2';
import {
  availableNodes,
  chooseCard,
  continueLoop,
  enterNode,
  finishDuel,
  leaveShrine,
  newRun,
  parseRun,
  serializeRun,
  type RunState,
} from './index';
import { ambushEnemy, gauntletMap, generateStageMap, WARDEN_SEQUENCE } from './mapgen';

describe('eleven distinct realm tiers and Drago’s native finale', () => {
  it('visits every realm once and keeps every map fight, boss and event ambush in its realm', () => {
    let run = newRun('knight', 'world-tour');
    const seen = [];
    for (let tier = 1; tier <= 11; tier++) {
      expect(run.realmRoute).toBe('eleven');
      expect(run.map.realm).toBe(run.realmOrder![tier - 1]);
      expect(run.map.themed).toBe(true);
      seen.push(run.map.realm);
      for (const node of run.map.nodes.filter((node) => node.enemyId))
        expect(encounter(node.enemyId!).realm, node.enemyId).toBe(run.map.realm);
      for (const kind of ['duel', 'elite'] as const) {
        const id = ambushEnemy(seedRng(`event-${tier}`), [run.map.realm], kind, [], 3, tier, true);
        expect(id).toBeTruthy();
        expect(encounter(id!).realm).toBe(run.map.realm);
      }
      expect(parseRun(serializeRun(run))).toEqual(run);
      run = continueLoop({ ...run, phase: 'loopCleared', context: null });
    }
    expect(seen.toSorted()).toEqual([...CAMPAIGN_REALM_IDS].sort());
    expect(run.map.realm).toBe('ruin');
    expect(run.map.finale).toBe('dragons');
    expect(
      run.map.nodes
        .filter((n) => n.kind === 'warden')
        .map((n) => n.enemyId)
        .slice(0, 5)
        .sort(),
    ).toEqual([...DRAGON_WARDENS].sort());
    expect(run.map.nodes.at(-1)?.enemyId).toBe('vorthax');
    expect(run.map.nodes.filter((n) => n.refinement)).toHaveLength(3);
  });
  it('saves the selected Warden once, exposes both choices in shared realms across seeds and rejects a mismatched saved boss', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const run = newRun('knight', `realm-choice-${i}`);
      for (const id of run.wardenOrder!) seen.add(id);
      expect(newRun('knight', `realm-choice-${i}`).wardenOrder).toEqual(run.wardenOrder);
      expect(new Set(run.realmOrder).size).toBe(11);
    }
    for (const world of CAMPAIGN_REALMS)
      for (const boss of world.wardens) expect(seen.has(boss), boss).toBe(true);
    const bad = newRun('knight', 'wrong-world');
    bad.wardenOrder![0] = 'vorthax';
    expect(parseRun(serializeRun(bad))).toBeNull();
  });
  it('retains a legacy map and boss order, then applies realm identity and native finale only to new maps', () => {
    const old = newRun('knight', 'legacy-worlds');
    delete old.realmRoute;
    delete old.realmOrder;
    old.wardenOrder = [...WARDEN_SEQUENCE];
    old.map = generateStageMap(
      seedRng('legacy-map'),
      1,
      'aurelion',
      'knight',
      undefined,
      1,
      'twelve',
      old.wardenOrder,
    );
    const loaded = parseRun(serializeRun(old))!;
    expect(loaded.map).toEqual(old.map);
    const next = continueLoop({ ...loaded, phase: 'loopCleared', context: null });
    expect(next.realmRoute).toBe('legacy-themed');
    expect(next.map.themed).toBe(true);
    expect(next.map.realm).toBe(encounter(next.wardenOrder![1]!).realm);
    for (const node of next.map.nodes.filter((node) => node.enemyId))
      expect(encounter(node.enemyId!).realm).toBe(next.map.realm);
    expect(parseRun(serializeRun(next))).toEqual(next);
    const end = continueLoop({ ...loaded, tier: 11, phase: 'loopCleared', context: null });
    expect(end.map.realm).toBe('ruin');
    expect(end.map.finale).toBe('dragons');
    expect(end.map.nodes.filter((n) => n.kind === 'warden')).toHaveLength(6);
    expect(end.wardenOrder).toEqual(old.wardenOrder);
  });
  it('preserves rewards, save/resume and three free refinement opportunities through all five dragons, then completes without a final payout', () => {
    let run: RunState = {
      ...newRun('knight', 'native-rewards'),
      tier: 11,
      phase: 'loopCleared',
      context: null,
      ascendancy: 'knight:paladin',
    };
    run = continueLoop(run);
    const fights = run.map.nodes.filter((n) => n.kind === 'warden');
    let refinements = 0;
    for (let i = 0; i < 6; i++) {
      const next = availableNodes(run)[0]!;
      run = enterNode(run, next.id);
      if (run.phase === 'shrine') {
        refinements++;
        expect(run.context?.gambler).toBeUndefined();
        run = leaveShrine(run);
        run = enterNode(run, availableNodes(run)[0]!.id);
      }
      expect(run.context?.nodeId).toBe(fights[i]!.id);
      const shards = run.shards;
      const maxHp = run.maxHp;
      run = finishDuel(run, true, 10);
      if (i === 5) {
        expect(run.won).toBe(true);
        expect(run.shards).toBe(shards);
        expect(run.maxHp).toBe(maxHp);
      } else {
        expect(run.phase).toBe('gift');
        expect(run.shards).toBeGreaterThan(shards);
        run = chooseCard(run, null);
        expect(run.phase).toBe('map');
      }
      run = parseRun(serializeRun(run))!;
      expect(run).toBeTruthy();
    }
    expect(refinements).toBe(3);
    expect(run.cleared).toHaveLength(9);
  });
  it('keeps the legacy gauntlet helper available for old saved routes', () => {
    const legacy = gauntletMap();
    expect(legacy.nodes).toHaveLength(17);
    expect(legacy.nodes.at(-1)?.enemyId).toBe('vorthax');
    const old = newRun('knight', 'already-in-old-finale');
    delete old.realmRoute;
    delete old.realmOrder;
    old.wardenOrder = [...WARDEN_SEQUENCE];
    old.tier = 12;
    old.map = legacy;
    old.phase = 'map';
    old.context = null;
    const pending = enterNode(old, legacy.nodes[0]!.id);
    expect(parseRun(serializeRun(pending))).toEqual(pending);
  });
});
