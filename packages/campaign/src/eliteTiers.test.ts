// Elites grow with the Rift Tier, their rewards fade, and the last tier is Wardens (DECISIONS #524, #526).

import { describe, expect, it } from 'vitest';
import { clone, seedRng } from '@sr/combat';
import { COMBAT_DB, encounter } from '@sr/content/v2';
import { ALL_ELITE_TIER, ALL_WARDEN_TIER, FINAL_STAGE, ambushEnemy, eliteFightChance, generateStageMap, rollEliteFight, wardenFor } from './mapgen';
import { omenEffects } from './omens';
import { ELITE_HEAL_LAST_TIER, ELITE_HEAL_PCT, ELITE_SPOIL_HEAL_PCT, ELITE_SPOIL_MAX_HP, FIGHT_SHARDS, chooseCard, chooseSpoil, POTION_DROP_CHANCE, availableNodes, duelPlan, continueLoop, eliteRewards, enterNode, finishDuel, newRun } from './run';
import type { RunState, StageMap, StageRealm } from './types';

const REALMS: StageRealm[] = ['aurelion', 'nexus', 'wyldmaw', 'umbral'];
const count = (m: StageMap, kind: string): number => m.nodes.filter((n) => n.kind === kind).length;
const mapAt = (seed: string, stage: number, realm: StageRealm, tier: number): StageMap =>
  generateStageMap(seedRng(seed), stage, realm, 'knight', undefined, tier);

describe('Elites by Rift Tier', () => {
  it('the chance starts at Tier 2, climbs every tier, and is all of them from Tier 19', () => {
    expect(eliteFightChance(1)).toBe(0);
    expect(eliteFightChance(2)).toBeGreaterThan(0);
    for (let t = 2; t <= ALL_ELITE_TIER; t++) expect(eliteFightChance(t)).toBeGreaterThan(eliteFightChance(t - 1));
    expect(eliteFightChance(18)).toBeLessThan(100);
    expect(eliteFightChance(ALL_ELITE_TIER)).toBe(100);
    expect(ALL_ELITE_TIER).toBe(19);
    expect(ALL_WARDEN_TIER).toBe(20);
    expect(eliteFightChance(ALL_WARDEN_TIER)).toBe(100);
  });

  it('Tier 1 maps are what they always were: no more than the usual Elites, and plain fights remain', () => {
    for (let i = 0; i < 40; i++) {
      const m = mapAt(`t1-${i}`, 1, 'nexus', 1);
      expect(count(m, 'elite')).toBeLessThanOrEqual(6);
      expect(count(m, 'duel')).toBeGreaterThan(0);
      // (the default tier is the same map, roll for roll)
      expect(generateStageMap(seedRng(`t1-${i}`), 1, 'nexus', 'knight')).toEqual(m);
    }
  });

  it('the next tier builds its map at its own tier', () => {
    const base: RunState = { ...newRun('knight', 'next'), phase: 'loopCleared', context: null };
    const looped = continueLoop({ ...base, tier: ALL_ELITE_TIER });
    expect(looped.tier).toBe(ALL_WARDEN_TIER);
    expect(count(looped.map, 'duel')).toBe(0);
    for (const n of looped.map.nodes) if (n.kind === 'elite') expect(encounter(n.enemyId!).kind).toBe('warden');
  });

  it('Tier 1 uses no roll for this, and its map is pinned', () => {
    const rng = seedRng('pin');
    const before = clone(rng);
    expect(rollEliteFight(rng, 1)).toBe(false);
    expect(rng).toEqual(before);
    const m = generateStageMap(seedRng('pinned-map'), 1, 'nexus', 'knight');
    expect(m.nodes.map((n) => n.kind[0]).join('')).toMatchInlineSnapshot(`"ddddddddddemmededeeddeeescdddeessw"`);
  });

  it('at Tier 19 no fight on any map is a plain one, on any floor of any act', () => {
    for (let i = 0; i < 30; i++) {
      for (let stage = 1; stage <= FINAL_STAGE; stage++) {
        for (const realm of REALMS) {
          const m = mapAt(`t19-${i}`, stage, realm, ALL_ELITE_TIER);
          expect(count(m, 'duel'), `${realm} act ${stage}`).toBe(0);
          for (const n of m.nodes) if (n.kind === 'elite') expect(n.enemyId).toBeTruthy();
          expect(m.nodes.filter((n) => n.floor === 1).every((n) => n.kind === 'elite')).toBe(true);
        }
      }
    }
  });

  it('deeper tiers really do hold more Elites and fewer plain fights', () => {
    const share = (tier: number): number => {
      let elites = 0;
      let fights = 0;
      for (let i = 0; i < 200; i++) {
        const m = mapAt(`share-${i}`, 1, 'nexus', tier);
        elites += count(m, 'elite');
        fights += count(m, 'elite') + count(m, 'duel');
      }
      return elites / fights;
    };
    const [t1, t5, t10, t15] = [share(1), share(5), share(10), share(15)];
    expect(t5).toBeGreaterThan(t1);
    expect(t10).toBeGreaterThan(t5);
    expect(t15).toBeGreaterThan(t10);
  });

  it('a deep map still has its merchants and its one Warden', () => {
    for (let i = 0; i < 30; i++) {
      const m = mapAt(`stops-${i}`, 2, 'umbral', ALL_ELITE_TIER);
      expect(count(m, 'merchant')).toBeGreaterThan(0);
      expect(m.nodes.filter((n) => n.kind === 'warden').length).toBe(1);
    }
  });

  it('an ambush follows the same odds: plain at Tier 1, an Elite at Tier 19, a Warden at Tier 20, even on the second floor', () => {
    let foes: string[] = [];
    const ambushes = (tier: number): string[] => {
      foes = [];
      const kinds: string[] = [];
      for (let i = 0; i < 80; i++) {
        const run: RunState = { ...newRun('knight', `amb-${i}`), tier, phase: 'map', context: null };
        const first = availableNodes(run)[0]!;
        const node = run.map.nodes.find((n) => n.id === first.next[0])!;
        run.cleared = run.map.nodes.filter((n) => n.floor < 2).map((n) => n.id);
        run.at = first.id;
        node.kind = 'event';
        delete node.enemyId;
        const r = enterNode(run, node.id);
        if (r.phase === 'duel') {
          const at = r.map.nodes.find((n) => n.id === node.id)!;
          kinds.push(at.kind);
          foes.push(encounter(at.enemyId!).kind);
        }
      }
      return kinds;
    };
    const low = ambushes(1);
    const high = ambushes(ALL_ELITE_TIER);
    expect(low.length).toBeGreaterThan(0);
    expect(low.every((k) => k === 'duel')).toBe(true);
    expect(high.length).toBeGreaterThan(0);
    expect(high.every((k) => k === 'elite')).toBe(true);
    expect(foes.every((k) => k === 'elite')).toBe(true);
    expect(ambushes(ALL_WARDEN_TIER).every((k) => k === 'elite')).toBe(true);
    expect(foes.length).toBeGreaterThan(0);
    expect(foes.every((k) => k === 'warden')).toBe(true);
  }, 20000); // (it plays many maps: slow on a busy machine)

  it('at Tier 19 the fights are real Elites, and at Tier 20 every one is a Warden, but only the last stop ends the act', () => {
    const vorthax = wardenFor('rift').id;
    for (let i = 0; i < 20; i++) {
      for (let stage = 1; stage <= FINAL_STAGE; stage++) {
        for (const realm of REALMS) {
          const fights = (m: StageMap) => m.nodes.filter((n) => n.kind === 'elite');
          for (const n of fights(mapAt(`w19-${i}`, stage, realm, ALL_ELITE_TIER)))
            expect(encounter(n.enemyId!).kind).toBe('elite');
          const m = mapAt(`w20-${i}`, stage, realm, ALL_WARDEN_TIER);
          expect(count(m, 'duel')).toBe(0);
          expect(fights(m).length).toBeGreaterThan(0);
          for (const n of fights(m)) {
            expect(encounter(n.enemyId!).kind, `${realm} act ${stage}`).toBe('warden');
            expect(n.enemyId).not.toBe(vorthax);
          }
          expect(count(m, 'warden')).toBe(1);
        }
      }
    }
    expect(mapAt('finale', FINAL_STAGE, 'rift', ALL_WARDEN_TIER).nodes.find((n) => n.kind === 'warden')?.enemyId).toBe(vorthax);
  });

  it("at Tier 20 an act's stops have a good few Wardens, and mostly not its own", () => {
    for (let stage = 1; stage <= FINAL_STAGE; stage++) {
      for (const realm of REALMS) {
        const m = mapAt(`spread-${stage}`, stage, realm, ALL_WARDEN_TIER);
        const stops = m.nodes.filter((n) => n.kind === 'elite');
        const own = m.nodes.find((n) => n.kind === 'warden')?.enemyId;
        expect(new Set(stops.map((n) => n.enemyId)).size).toBeGreaterThanOrEqual(5);
        expect(stops.filter((n) => n.enemyId === own).length).toBeLessThanOrEqual(stops.length / 3);
      }
    }
  });

  it('an ambush at Tier 20 brings a Warden, on every act, and never Vorthax', () => {
    for (let stage = 1; stage <= FINAL_STAGE; stage++) {
      const id = ambushEnemy(seedRng(`a${stage}`), ['umbral'], 'elite', [], stage, ALL_WARDEN_TIER);
      expect(encounter(id!).kind).toBe('warden');
      expect(id).not.toBe(wardenFor('rift').id);
    }
  });

  it('an Elite that is a Warden does not bring a second one with the Omen that adds to Elites', () => {
    const run: RunState = { ...newRun('knight', 'swarm'), tier: ALL_WARDEN_TIER, phase: 'map', context: null };
    const node = availableNodes(run)[0]!;
    node.kind = 'elite';
    node.enemyId = wardenFor('nexus').id;
    const r = enterNode(run, node.id);
    expect(duelPlan(r)?.units).toEqual(encounter(node.enemyId).units);
  });
});

describe('what an Elite pays by Rift Tier', () => {
  const win = (tier: number, seed: string): { before: RunState; after: RunState } => {
    const run: RunState = { ...newRun('knight', seed), tier, phase: 'map', context: null };
    const node = availableNodes(run)[0]!;
    node.kind = 'elite';
    node.enemyId = ambushEnemy(seedRng(seed), ['nexus'], 'elite', [], 1)!;
    const before = enterNode(run, node.id);
    return { before, after: finishDuel(before, true, 20) };
  };

  it('Tier 1 pays in full, and it fades every tier to a plain fight\'s shards and potions at Tier 19', () => {
    expect(eliteRewards(1)).toEqual({ shards: FIGHT_SHARDS.elite, potionPct: POTION_DROP_CHANCE.elite, boonPct: 100, healPct: ELITE_HEAL_PCT });
    expect(eliteRewards(10)).toMatchObject({ shards: 26, potionPct: 58, boonPct: 55 });
    for (const t of [ALL_ELITE_TIER, ALL_WARDEN_TIER])
      expect(eliteRewards(t)).toEqual({ shards: FIGHT_SHARDS.duel, potionPct: POTION_DROP_CHANCE.duel, boonPct: 10, healPct: 0 });
    for (let t = 2; t <= ALL_ELITE_TIER; t++) {
      expect(eliteRewards(t).boonPct).toBeLessThan(eliteRewards(t - 1).boonPct);
      expect(eliteRewards(t).shards).toBeLessThanOrEqual(eliteRewards(t - 1).shards);
      expect(eliteRewards(t).potionPct).toBeLessThanOrEqual(eliteRewards(t - 1).potionPct);
    }
  });

  it('heals through Tier 10 and not after', () => {
    expect(win(ELITE_HEAL_LAST_TIER, 'heal').after.hp).toBe(20 + Math.ceil((newRun('knight', 'heal').maxHp * ELITE_HEAL_PCT) / 100));
    expect(win(ELITE_HEAL_LAST_TIER + 1, 'heal').after.hp).toBe(20);
  });

  it('Tier 1 always leaves a Boon; Tier 19 only now and then', () => {
    const boons = (tier: number): number => {
      let n = 0;
      for (let i = 0; i < 60; i++) {
        const { before, after } = win(tier, `boon-${i}`);
        if (after.boons.length > before.boons.length) n++;
      }
      return n;
    };
    expect(boons(1)).toBe(60);
    expect(boons(ALL_ELITE_TIER)).toBeLessThan(20);
  });

  it('a won Elite really pays the faded shards (as its spoils, DECISIONS #555) and potion chance', () => {
    for (const tier of [1, 10, ALL_ELITE_TIER]) {
      const { before, after } = win(tier, 'shards');
      const paid = Math.round(eliteRewards(tier).shards * (1 - omenEffects(tier).shardsPct / 100));
      expect(after.shards).toBe(before.shards);
      expect(after.context?.spoils).toEqual({ shards: paid });
      expect(chooseSpoil(after, 'shards').shards - before.shards).toBe(paid);
    }
    const potions = (tier: number): number => {
      let n = 0;
      for (let i = 0; i < 150; i++) {
        const { before, after } = win(tier, `potion-${i}`);
        if (after.potions.length > before.potions.length) n++;
      }
      return n;
    };
    expect(potions(1)).toBeGreaterThan(potions(ALL_ELITE_TIER) + 20);
  });

  it('an Elite lets you choose its spoils: shards, Max HP or a heal, and a card chosen first takes the shards (DECISIONS #555)', () => {
    const { before, after } = win(12, 'spoils');
    const hurt: RunState = { ...after, hp: 30 };
    const hp = chooseSpoil(hurt, 'maxHp');
    expect(hp.maxHp).toBe(after.maxHp + ELITE_SPOIL_MAX_HP);
    expect(hp.hp).toBe(30 + ELITE_SPOIL_MAX_HP);
    expect(hp.shards).toBe(before.shards);
    expect(hp.context?.spoils).toBeUndefined();
    expect(() => chooseSpoil(hp, 'heal')).toThrow();
    const healed = chooseSpoil(hurt, 'heal');
    expect(healed.hp).toBe(Math.min(after.maxHp, 30 + Math.ceil((after.maxHp * ELITE_SPOIL_HEAL_PCT) / 100)));
    expect(healed.maxHp).toBe(after.maxHp);
    const skipped = chooseCard(after, null);
    expect(skipped.shards - before.shards).toBe(after.context!.spoils!.shards);
    // (a plain fight pays its shards as before, with no spoils)
    const run: RunState = { ...newRun('knight', 'plain'), tier: 12, phase: 'map', context: null };
    const node = availableNodes(run)[0]!;
    node.kind = 'duel';
    node.enemyId = ambushEnemy(seedRng('plain'), ['nexus'], 'duel', [], 1)!;
    const plain = finishDuel(enterNode(run, node.id), true, 20);
    expect(plain.context?.spoils).toBeUndefined();
    expect(plain.context?.shardsGained).toBeGreaterThan(0);
  });

  it("the card reward keeps an Elite's rarity chance at the deepest tier", () => {
    const better = (kind: 'elite' | 'duel'): number => {
      let n = 0;
      for (let i = 0; i < 150; i++) {
        const run: RunState = { ...newRun('knight', `cards-${i}`), tier: ALL_ELITE_TIER, phase: 'map', context: null };
        const node = availableNodes(run)[0]!;
        node.kind = kind;
        node.enemyId = ambushEnemy(seedRng(`cards-${i}`), ['nexus'], kind, [], 1)!;
        const after = finishDuel(enterNode(run, node.id), true, 20);
        for (const c of after.context?.offers ?? []) if (COMBAT_DB.cards[c]?.rarity !== 'common') n++;
      }
      return n;
    };
    expect(better('elite')).toBeGreaterThan(better('duel'));
  });

  it('a Warden on an Elite stop plays out as an Elite: no Gift, no Max HP, the act goes on, 2 Resolve if lost', () => {
    const run: RunState = { ...newRun('knight', 'warden-stop'), tier: ALL_WARDEN_TIER, phase: 'map', context: null };
    const node = availableNodes(run)[0]!;
    node.kind = 'elite';
    node.enemyId = wardenFor('nexus').id;
    const before = enterNode(run, node.id);
    const won = finishDuel(before, true, 20);
    expect(won.phase).toBe('reward');
    expect(won.maxHp).toBe(before.maxHp);
    expect(won.stage).toBe(before.stage);
    const lost = finishDuel({ ...before, resolve: 3, maxResolve: 3 }, false, 0);
    expect(lost.resolve).toBe(1);
  });
});
