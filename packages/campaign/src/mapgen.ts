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

/** The chances (percent) for each middle-floor node: an Elite (the first of a stage, then later ones; from floor 3), a Merchant (at most 2), a Shrine (from floor 3), an Event; the rest are fights. */
export const NODE_ODDS = {
  eliteFirst: 22,
  eliteMore: 12,
  merchant: 11,
  shrine: 8,
  event: 24,
} as const;

/** Kind of a node on the middle floors given what has already been placed this stage. */
function rollKind(
  rng: RngState,
  floor: number,
  elitesPlaced: number,
  merchantsPlaced: number,
  maxElites: number,
): NodeKind {
  const r = nextInt(rng, 100);
  const o = NODE_ODDS;
  const merchantAt = o.eliteFirst;
  const shrineAt = merchantAt + o.merchant;
  const eventAt = shrineAt + o.shrine;
  if (floor >= 3 && elitesPlaced < maxElites && r < (elitesPlaced < 1 ? o.eliteFirst : o.eliteMore))
    return 'elite';
  if (merchantsPlaced < 2 && r >= merchantAt && r < shrineAt) return 'merchant';
  if (floor >= 3 && r >= shrineAt && r < eventAt) return 'shrine';
  if (r >= eventAt && r < eventAt + o.event) return 'event';
  return 'duel';
}

/**
 * An Event stop is now and then not an event at all but a fight: this percent of the time it is an Elite (only from the third floor), this
 * percent a plain fight. Decided when the stop is entered, so the map still shows an Event.
 */
export const EVENT_FIGHT_ODDS = { elite: 5, duel: 10 } as const;

/** The enemy that ambushes the player at an Event stop (null if the realm has none of that kind). Avoids the stage's own fights when it can. */
export function ambushEnemy(
  rng: RngState,
  pool: readonly StageRealm[],
  kind: 'duel' | 'elite',
  taken: readonly (string | undefined)[],
): string | null {
  const all = pool.flatMap((r) => enemiesOf(r, kind === 'elite' ? 'elite' : 'regular'));
  const fresh = all.filter((e) => !taken.includes(e.id));
  const from = fresh.length > 0 ? fresh : all;
  return from.length > 0 ? pick(rng, from).id : null;
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
/** Warden ghosts: from the Rift Tier after this one, a Warden may be a ghost deck. */
export const GHOST_FROM_TIER = 3;
/** A ghost deck must have reached this Rift Tier to stand in for a Warden (an early deck makes a poor boss; DECISIONS #231). */
export const GHOST_BOSS_MIN_TIER = 3;
/** The chance (percent) that a Warden beyond that is a ghost, so players do not meet the same few Wardens over and over. */
export const GHOST_WARDEN_CHANCE = 35;

export function generateStageMap(
  rng: RngState,
  stage: number,
  realm: StageRealm,
  character?: string,
  pool: readonly StageRealm[] = stage >= FINAL_STAGE ? ['umbral', 'wyldmaw'] : [realm],
  tier = 1,
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
        kind = 'shrine'; // the last stop before a Warden is always a Shrine
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
  // every stage still has a Merchant somewhere: if chance placed none, one takes the place of a plain fight or event in the middle
  if (!byFloor.some((row) => row.some((n) => n.kind === 'merchant')) && FLOORS >= 3) {
    const middle = byFloor.slice(1, FLOORS - 1).flat();
    const plain = middle.filter((n) => n.kind === 'duel' || n.kind === 'event');
    const spot = pick(rng, plain.length > 0 ? plain : middle);
    spot.kind = 'merchant';
    delete spot.enemyId;
    const crossed = crossedFor(rng, character);
    if (crossed) spot.crossed = crossed;
  }

  const warden: MapNode = {
    id: `s${stage}-warden`,
    floor: FLOORS + 1,
    kind: 'warden',
    enemyId: wardenFor(stage >= FINAL_STAGE ? 'rift' : realm).id,
    next: [],
  };
  // beyond the first few Rift Tiers, now and then the Warden is a ghost (decided with the map, so the map can say so)
  if (tier > GHOST_FROM_TIER && nextInt(rng, 100) < GHOST_WARDEN_CHANCE) warden.ghost = true;

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
