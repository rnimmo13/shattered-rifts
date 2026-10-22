// Stage maps: 5 floors plus the Warden for stages 1-4, a single floor plus Vorthax for stage 5 (03_CAMPAIGN §2.1).
// Generated from the run seed, so a run always has the same maps.

import { nextInt, type RngState } from '@sr/engine';
import { ENEMIES, type EnemyDef } from '@sr/content';
import type { MapNode, NodeKind, StageMap, StageRealm } from './types';

const WARDEN_OF: Record<StageRealm, string> = {
  aurelion: 'aur-seraphine',
  nexus: 'nex-kron',
  wyldmaw: 'wyl-gorrmaw',
  umbral: 'umb-nyxara',
  rift: 'vorthax',
};

export function wardenFor(realm: StageRealm): EnemyDef {
  const id = WARDEN_OF[realm];
  const e = ENEMIES.find((x) => x.id === id);
  if (!e) throw new Error(`No warden for ${realm}`);
  return e;
}

function enemiesOf(realm: StageRealm, kind: EnemyDef['kind']): EnemyDef[] {
  return ENEMIES.filter((e) => e.realm === realm && e.kind === kind);
}

function pick<T>(rng: RngState, list: readonly T[]): T {
  if (list.length === 0) throw new Error('Cannot pick from an empty list');
  return list[nextInt(rng, list.length)] as T;
}

/** Kind of a node on floors 2-4 given what has already been placed this stage. */
function rollKind(
  rng: RngState,
  floor: number,
  elitesPlaced: number,
  merchantsPlaced: number,
): NodeKind {
  const r = nextInt(rng, 100);
  if (floor >= 3 && elitesPlaced < 1 && r < 22) return 'elite';
  if (merchantsPlaced < 1 && r >= 22 && r < 34) return 'merchant';
  if (r >= 34 && r < 56) return 'event';
  return 'duel';
}

export function generateStageMap(rng: RngState, stage: number, realm: StageRealm): StageMap {
  if (stage === 5) {
    // the final stage: Shrine or Merchant (the player's choice), then Vorthax
    const boss = wardenFor('rift');
    const nodes: MapNode[] = [
      { id: 's5-f1-a', floor: 1, kind: 'shrine', next: ['s5-warden'] },
      { id: 's5-f1-b', floor: 1, kind: 'merchant', next: ['s5-warden'] },
      { id: 's5-warden', floor: 2, kind: 'warden', enemyId: boss.id, next: [] },
    ];
    return { stage, realm, floors: 2, nodes };
  }

  const regulars = enemiesOf(realm, 'regular');
  const elites = enemiesOf(realm, 'elite');
  const used = new Set<string>();
  const regular = (): string => {
    const fresh = regulars.filter((e) => !used.has(e.id));
    const e = pick(rng, fresh.length > 0 ? fresh : regulars);
    used.add(e.id);
    return e.id;
  };

  const FLOORS = 5;
  const byFloor: MapNode[][] = [];
  let elites_ = 0;
  let merchants = 0;
  for (let floor = 1; floor <= FLOORS; floor++) {
    const count = floor === FLOORS ? 2 : 2 + nextInt(rng, 2); // 2-3 nodes
    const row: MapNode[] = [];
    for (let i = 0; i < count; i++) {
      const id = `s${stage}-f${floor}-${String.fromCharCode(97 + i)}`;
      let kind: NodeKind;
      if (floor === 1) kind = 'duel';
      else if (floor === FLOORS) kind = i === 0 ? 'shrine' : merchants < 1 ? 'merchant' : 'shrine';
      else kind = rollKind(rng, floor, elites_, merchants);
      if (kind === 'elite') elites_++;
      if (kind === 'merchant') merchants++;
      const node: MapNode = { id, floor, kind, next: [] };
      if (kind === 'duel') node.enemyId = regular();
      if (kind === 'elite') node.enemyId = pick(rng, elites).id;
      row.push(node);
    }
    byFloor.push(row);
  }
  const warden: MapNode = {
    id: `s${stage}-warden`,
    floor: FLOORS + 1,
    kind: 'warden',
    enemyId: wardenFor(realm).id,
    next: [],
  };

  // edges: every node leads forward to 1-2 nodes by position; every node on the next floor is reachable
  for (let f = 0; f < FLOORS; f++) {
    const row = byFloor[f] as MapNode[];
    const nextRow = f === FLOORS - 1 ? [warden] : (byFloor[f + 1] as MapNode[]);
    for (const n of row) n.next = [];
    row.forEach((n, i) => {
      const t = Math.min(
        nextRow.length - 1,
        Math.round((i * (nextRow.length - 1)) / Math.max(1, row.length - 1)),
      );
      const a = nextRow[t] as MapNode;
      n.next.push(a.id);
      // sometimes branch to a neighbour too
      if (nextRow.length > 1 && nextInt(rng, 100) < 45) {
        const alt = nextRow[t + 1 < nextRow.length ? t + 1 : t - 1] as MapNode;
        if (!n.next.includes(alt.id)) n.next.push(alt.id);
      }
    });
    // anything on the next floor nobody leads to gets an incoming edge from the nearest node
    for (const m of nextRow) {
      if (!row.some((n) => n.next.includes(m.id))) {
        const j = Math.min(row.length - 1, nextRow.indexOf(m));
        (row[j] as MapNode).next.push(m.id);
      }
    }
  }

  return { stage, realm, floors: FLOORS + 1, nodes: [...byFloor.flat(), warden] };
}

/** Nodes you can choose next: the whole first floor at the start of a stage, else the neighbours of `at`. */
export function reachableNodes(
  map: StageMap,
  at: string | null,
  cleared: readonly string[],
): MapNode[] {
  if (at === null) return map.nodes.filter((n) => n.floor === 1);
  const here = map.nodes.find((n) => n.id === at);
  if (!here) return [];
  return here.next
    .map((id) => map.nodes.find((n) => n.id === id))
    .filter((n): n is MapNode => !!n && !cleared.includes(n.id));
}
