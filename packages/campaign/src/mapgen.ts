// Stage maps: a run is three stages. Stages 1 and 2 are each one realm: seven floors and that realm's Warden. Stage 3 is the
// Rift: eight floors drawing on the two realms the run has not visited, then Vorthax (03_CAMPAIGN §2.1).
// Generated from the run seed, so a run always has the same maps.

import { nextInt, type RngState } from '@sr/combat';
import { ENCOUNTERS, RIFTWALKERS, type Encounter } from '@sr/content/v2';
import type { MapNode, NodeKind, StageMap, StageRealm } from './types';

/** The chance (percent) that a merchant on the map is a Rift-crossed stranger selling another Riftwalker's cards. */
export const CROSSED_MERCHANT_CHANCE = 7.5;

/** A run is this many stages; the last one ends with Vorthax. */
export const FINAL_STAGE = 3;

/** Floors before the Warden: the Rift (the last stage) is a little longer. */
export const floorsOf = (stage: number): number => (stage >= FINAL_STAGE ? 8 : 7);

/** at most this many Events in a row along any path */
export const MAX_EVENTS_IN_A_ROW = 2;

const WARDEN_OF: Record<StageRealm, string> = {
  aurelion: 'seraphine',
  nexus: 'kron',
  wyldmaw: 'gorrmaw',
  umbral: 'nyxara',
  rift: 'vorthax',
};

export function wardenFor(realm: StageRealm): Encounter {
  const id = WARDEN_OF[realm];
  const e = ENCOUNTERS.find((x) => x.id === id);
  if (!e) throw new Error(`No warden for ${realm}`);
  return e;
}

function enemiesOf(realm: StageRealm, kind: Encounter['kind']): Encounter[] {
  return ENCOUNTERS.filter((e) => e.realm === realm && e.kind === kind);
}

function pick<T>(rng: RngState, list: readonly T[]): T {
  if (list.length === 0) throw new Error('Cannot pick from an empty list');
  return list[nextInt(rng, list.length)] as T;
}

/** Kind of a node on the middle floors given what has already been placed this stage. */
function rollKind(
  rng: RngState,
  floor: number,
  elitesPlaced: number,
  merchantsPlaced: number,
  maxElites: number,
): NodeKind {
  const r = nextInt(rng, 100);
  if (floor >= 3 && elitesPlaced < maxElites && r < (elitesPlaced < 1 ? 22 : 12)) return 'elite';
  if (merchantsPlaced < 2 && r >= 22 && r < 33) return 'merchant';
  if (floor >= 3 && r >= 33 && r < 41) return 'shrine';
  if (r >= 41 && r < 65) return 'event';
  return 'duel';
}

/** A merchant is now and then a stranger from another world; decided with the map so the map can say so. */
function crossedFor(rng: RngState, character: string | undefined): string | undefined {
  if (nextInt(rng, 1000) >= CROSSED_MERCHANT_CHANCE * 10) return undefined;
  const others = Object.keys(RIFTWALKERS).filter((h) => h !== character);
  return others.length ? pick(rng, others) : undefined;
}

/**
 * `realm` is the stage's realm; `pool` is where its enemies come from (just that realm, except in the Rift, which draws on
 * the two realms the run has not visited).
 */
export function generateStageMap(
  rng: RngState,
  stage: number,
  realm: StageRealm,
  character?: string,
  pool: readonly StageRealm[] = stage >= FINAL_STAGE ? ['umbral', 'wyldmaw'] : [realm],
): StageMap {
  const regulars = pool.flatMap((r) => enemiesOf(r, 'regular'));
  const elites = pool.flatMap((r) => enemiesOf(r, 'elite'));
  const used = new Set<string>();
  const regular = (): string => {
    const fresh = regulars.filter((e) => !used.has(e.id));
    const e = pick(rng, fresh.length > 0 ? fresh : regulars);
    used.add(e.id);
    return e.id;
  };

  const FLOORS = floorsOf(stage);
  const maxElites = FLOORS >= 7 ? 3 : 2;
  const byFloor: MapNode[][] = [];
  let elites_ = 0;
  let merchants = 0;
  for (let floor = 1; floor <= FLOORS; floor++) {
    const count = floor === FLOORS ? 2 : floor === 1 ? 2 + nextInt(rng, 2) : 2 + nextInt(rng, 3); // 2-4 nodes (2-3 on the first floor)
    const row: MapNode[] = [];
    for (let i = 0; i < count; i++) {
      const id = `s${stage}-f${floor}-${String.fromCharCode(97 + i)}`;
      let kind: NodeKind;
      if (floor === 1) kind = 'duel';
      else if (floor === FLOORS)
        kind = i === 0 ? 'shrine' : merchants < 1 || stage >= FINAL_STAGE ? 'merchant' : 'shrine';
      else kind = rollKind(rng, floor, elites_, merchants, maxElites);
      // (never two Elites side by side on one floor: they spread out over the stage)
      if (kind === 'elite' && row.some((n) => n.kind === 'elite')) kind = 'duel';
      if (kind === 'elite') elites_++;
      if (kind === 'merchant') merchants++;
      const node: MapNode = { id, floor, kind, next: [] };
      if (kind === 'merchant') {
        const crossed = crossedFor(rng, character);
        if (crossed) node.crossed = crossed;
      }
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
    enemyId: wardenFor(stage >= FINAL_STAGE ? 'rift' : realm).id,
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
      if (nextRow.length > 1 && nextInt(rng, 100) < 55) {
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

  // never two Merchants in a row on any path: the earlier one becomes a Duel
  for (let f = FLOORS - 2; f >= 0; f--) {
    const after = byFloor[f + 1] as MapNode[];
    for (const n of byFloor[f] as MapNode[]) {
      if (
        n.kind === 'merchant' &&
        n.next.some((id) => after.find((m) => m.id === id)?.kind === 'merchant')
      ) {
        n.kind = 'duel';
        delete n.crossed;
        n.enemyId = regular();
      }
    }
  }

  // never more than MAX_EVENTS_IN_A_ROW Events in a row on any path: a third becomes a Duel
  const run = new Map<string, number>();
  for (let f = 0; f < FLOORS; f++) {
    for (const n of byFloor[f] as MapNode[]) {
      if (n.kind === 'event' && (run.get(n.id) ?? 1) > MAX_EVENTS_IN_A_ROW) {
        n.kind = 'duel';
        n.enemyId = regular();
      }
      const mine = n.kind === 'event' ? (run.get(n.id) ?? 1) : 0;
      for (const t of n.next) run.set(t, Math.max(run.get(t) ?? 1, mine + 1));
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
