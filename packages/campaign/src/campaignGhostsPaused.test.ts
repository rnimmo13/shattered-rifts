import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  CAMPAIGN_GHOSTS_ENABLED,
  attachGhost,
  checkGhostBoss,
  duelPlan,
  enterNode,
  finishDuel,
  generateStageMap,
  ghostToSettle,
  ghostWanted,
  newRun,
  parseRun,
  serializeRun,
  settleGhost,
  type GhostBoss,
  type RunState,
  type StageRealm,
} from './index';

const ghost: GhostBoss = {
  id: 'legacy-ghost',
  name: 'A rival',
  hero: 'knight',
  deck: [...RIFTWALKERS.knight.starter],
  boons: [],
  tier: 5,
  stage: 1,
};

function legacy(kind: 'echo' | 'warden', settled = true): RunState {
  const run = newRun('engineer', `paused-${kind}`);
  run.tier = 5;
  run.map = generateStageMap(seedRng('paused-map'), 1, 'aurelion', 'engineer', undefined, 5);
  const node = run.map.nodes.find((n) =>
    kind === 'warden' ? n.kind === 'warden' : n.kind === 'duel' || n.kind === 'elite',
  )!;
  node.kind = kind;
  node.ghost = true;
  if (settled) node.ghostDeck = ghost;
  run.phase = 'duel';
  run.at = node.id;
  run.context = { nodeId: node.id, ...(settled ? { ghost, ghostAsked: true } : {}) };
  run.hp = 27;
  run.shards = 123;
  run.eventResult = kind === 'echo' ? 'Echo! A ghost stands here.' : 'Ghost Warden! A rival.';
  return run;
}

describe('campaign ghosts are paused (#592)', () => {
  it('generates no Echoes or ghost Wardens throughout all twenty tiers and realms', () => {
    expect(CAMPAIGN_GHOSTS_ENABLED).toBe(false);
    const realms: StageRealm[] = ['aurelion', 'nexus', 'wyldmaw', 'umbral', 'rift'];
    for (let tier = 1; tier <= 20; tier++) {
      for (const realm of realms) {
        for (let seed = 0; seed < 8; seed++) {
          const map = generateStageMap(
            seedRng(`paused-${seed}`),
            1,
            realm,
            'engineer',
            undefined,
            tier,
          );
          expect(map.nodes.some((n) => n.kind === 'echo' || n.ghost || n.ghostDeck)).toBe(false);
          expect(map.nodes.filter((n) => n.kind === 'warden')).toHaveLength(1);
          expect(map.nodes.filter((n) => n.kind === 'cache')).toHaveLength(1);
        }
      }
    }
  });

  it.each(['echo', 'warden'] as const)(
    'migrates an active %s to its authored enemy without spending progress',
    (kind) => {
      const old = legacy(kind);
      const node = old.map.nodes.find((n) => n.id === old.at)!;
      const loaded = parseRun(serializeRun(old))!;
      expect(loaded).not.toBeNull();
      expect(loaded.phase).toBe('duel');
      expect(loaded.at).toBe(old.at);
      expect(loaded.hp).toBe(old.hp);
      expect(loaded.resolve).toBe(old.resolve);
      expect(loaded.shards).toBe(old.shards);
      expect(loaded.stats).toEqual(old.stats);
      expect(loaded.deck).toEqual(old.deck);
      expect(loaded.rng).toEqual(old.rng);
      expect(loaded.cleared).toEqual(old.cleared);
      expect(loaded.map.nodes.find((n) => n.id === old.at)).toEqual({
        ...node,
        kind: kind === 'echo' ? 'duel' : 'warden',
        ghost: undefined,
        ghostDeck: undefined,
      });
      expect(duelPlan(loaded)?.encounterId).toBe(node.enemyId);
      expect(duelPlan(loaded)?.ghost).toBeUndefined();
      expect(loaded.context?.ghost).toBeUndefined();
      expect(loaded.context?.ghostAsked).toBeUndefined();
      expect(loaded.eventResult).toBeUndefined();
      expect(loaded.reworkNotice).toContain('no Resolve spent');
      // Once the UI has cleared the old logs, subsequent loads need no further restart.
      delete loaded.reworkNotice;
      expect(parseRun(serializeRun(loaded))).toEqual(loaded);
      expect(node.ghost).toBe(true);
    },
  );

  it('converts future saved nodes without restarting a normal current battle', () => {
    const old = legacy('echo');
    old.context = { nodeId: old.map.nodes.find((n) => n.kind === 'warden')!.id };
    const loaded = parseRun(serializeRun(old))!;
    expect(loaded.reworkNotice).toBeUndefined();
    expect(loaded.map.nodes.some((n) => n.kind === 'echo' || n.ghost || n.ghostDeck)).toBe(false);
  });

  it('keeps rewards already earned from a completed ghost fight', () => {
    const old = legacy('echo');
    old.phase = 'reward';
    old.cleared.push(old.at!);
    old.context = {
      ...old.context!,
      offers: [old.deck[0]!],
      shardsGained: 12,
      spoils: { shards: 10 },
    };
    const loaded = parseRun(serializeRun(old))!;
    expect(loaded).not.toBeNull();
    expect(loaded.phase).toBe('reward');
    expect(loaded.context?.offers).toEqual(old.context.offers);
    expect(loaded.context?.spoils).toEqual(old.context.spoils);
    expect(loaded.cleared).toEqual(old.cleared);
    expect(loaded.reworkNotice).toBeUndefined();
  });

  it('never requests campaign ghosts and ignores late network answers', () => {
    const old = legacy('warden', false);
    expect(ghostWanted(old)).toBe(false);
    expect(ghostToSettle({ ...old, phase: 'map' })).toBeNull();
    for (const run of [attachGhost(old, ghost), settleGhost(old, ghost)]) {
      expect(duelPlan(run)?.ghost).toBeUndefined();
      expect(run.map.nodes.some((n) => n.ghost || n.ghostDeck)).toBe(false);
    }
    expect(old.map.nodes.find((n) => n.id === old.at)?.ghost).toBe(true);
  });

  it('uses normal fights even for legacy states passed directly to the runtime', () => {
    const old = legacy('echo');
    expect(duelPlan(old)?.ghost).toBeUndefined();
    const lost = finishDuel(old, false);
    expect(lost.resolve).toBe(old.resolve - 1);
    expect(lost.map.nodes.find((n) => n.id === old.at)?.kind).toBe('duel');
    const before = old.map.nodes.find((n) => n.next.includes(old.at!))!;
    const entered = enterNode(
      { ...old, phase: 'map', at: before?.id ?? null, context: null },
      old.at!,
    );
    expect(entered.phase).toBe('duel');
    expect(entered.context?.ghost).toBeUndefined();
    expect(duelPlan(entered)?.ghost).toBeUndefined();
  });

  it('can recover an obsolete ghost payload while still rejecting a damaged encounter', () => {
    const old = legacy('warden');
    const raw = JSON.parse(serializeRun(old)) as Omit<RunState, 'context'> & {
      context: { nodeId: string; ghost: unknown };
    };
    raw.context.ghost = { obsolete: true };
    expect(parseRun(JSON.stringify(raw))?.reworkNotice).toContain(
      'Campaign ghost fights are paused',
    );
    raw.context.nodeId = 'missing-node';
    expect(parseRun(JSON.stringify(raw))).toBeNull();
  });

  it('keeps generic ghost validation available for Arena decks', () => {
    expect(checkGhostBoss(ghost)).toEqual(ghost);
  });
});
