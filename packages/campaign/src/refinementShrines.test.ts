import { expect, it } from 'vitest';
import {
  newRun,
  gauntletMap,
  enterNode,
  takeShrine,
  parseRun,
  serializeRun,
  duelPlan,
  type RunState,
} from './index';
const base = (): RunState => ({
  ...newRun('knight', 'refinement'),
  tier: 12,
  map: gauntletMap(),
  phase: 'map',
  at: null,
  cleared: [],
  context: null,
});
it('places five free upgrade/remove-only shrines between fights, with no healing or wagers', () => {
  const r = base();
  let fights = 0;
  const stops: number[] = [];
  for (const node of r.map.nodes) {
    if (node.kind === 'warden') fights++;
    if (node.refinement) stops.push(fights);
  }
  expect(stops).toEqual([2, 4, 6, 8, 10]);
  const shrine = r.map.nodes.find((n) => n.refinement)!;
  const before = r.map.nodes.find((n) => n.next.includes(shrine.id))!;
  r.at = before.id;
  r.cleared = r.map.nodes.filter((n) => n.floor <= before.floor).map((n) => n.id);
  r.hp = 30;
  r.deck.push('wound');
  const entered = enterNode(r, shrine.id);
  expect(entered.context?.gambler).toBeUndefined();
  expect(entered.context?.event).toBeUndefined();
  expect(() => takeShrine(entered, { kind: 'rest' })).toThrow('only upgrades or removes');
  expect(() => takeShrine(entered, { kind: 'ledger' })).toThrow();
  const removed = takeShrine(entered, { kind: 'remove', card: 'wound' });
  expect(removed.deck).not.toContain('wound');
  expect(removed.hp).toBe(30);
  expect(removed.shards).toBe(r.shards);
  expect(removed.phase).toBe('map');
  const card = entered.deck.find((id) => id === 'defend')!;
  expect(takeShrine(entered, { kind: 'upgrade', card }).deck).toContain('defend+');
});
it('migrates existing gauntlets without changing entered fight seeds or making players backtrack', () => {
  const r = base();
  const fights = r.map.nodes
    .filter((n) => n.kind === 'warden')
    .map((n, i, a) => ({ ...n, floor: i + 1, next: a[i + 1] ? [a[i + 1]!.id] : [] }));
  r.map = { ...r.map, floors: 12, nodes: fights };
  r.at = fights[4]!.id;
  r.cleared = fights.slice(0, 4).map((n) => n.id);
  r.phase = 'duel';
  r.context = { nodeId: r.at };
  const seed = duelPlan(r)!.seed;
  const loaded = parseRun(serializeRun(r))!;
  expect(loaded.map.nodes).toHaveLength(17);
  expect(loaded.at).toBe(r.at);
  expect(duelPlan(loaded)!.seed).toBe(seed);
  expect(loaded.cleared.filter((id) => id.endsWith('-refinement'))).toHaveLength(2);
  expect(parseRun(serializeRun(loaded))).toEqual(loaded);
  const between = {
    ...r,
    phase: 'map' as const,
    at: fights[1]!.id,
    cleared: fights.slice(0, 2).map((n) => n.id),
    context: null,
  };
  const migrated = parseRun(serializeRun(between))!;
  const next = migrated.map.nodes.find((n) => n.id === migrated.at)!.next[0]!;
  expect(migrated.map.nodes.find((n) => n.id === next)!.refinement).toBe(true);
  expect(migrated.cleared).not.toContain(next);
});
