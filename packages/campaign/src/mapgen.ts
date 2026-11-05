// Seeded realm maps lead to unique Wardens; a separate final map contains the Warden gauntlet and Valerion.
// Existing saved maps retain their topology. Historical generic generation remains available for legacy fixtures.

import { nextInt, shuffle, type RngState } from '@sr/combat';
import { ENCOUNTERS, RIFTWALKERS, type Encounter } from '@sr/content/v2';
import type { MapNode, NodeKind, StageMap, StageRealm } from './types';
import { CAMPAIGN_GHOSTS_ENABLED } from './features';

/** The chance (percent) that a merchant on the map is a Rift-crossed stranger selling another Riftwalker's cards. */
export const CROSSED_MERCHANT_CHANCE = 7.5;

/** How deep enemy pools reach: the most `depthOf` gives, where the far realms join. */
export const FINAL_STAGE = 3;
/** One unique Warden for each of the first eleven tiers, then the same roster in the finale. */
export const WARDEN_SEQUENCE = [
  'seraphine',
  'kron',
  'gorrmaw',
  'nyxara',
  'the-hollow-benediction',
  'mother-of-static',
  'the-upside-down-stag',
  'the-applause-below',
  'the-mourning-tide',
  'queen-of-the-unmade',
  'event-horizon-regent',
] as const;
export function shuffledWardens(rng: RngState): string[] {
  return shuffle(rng, [...WARDEN_SEQUENCE]);
}
export function gauntletMap(stage = 1, order: readonly string[] = WARDEN_SEQUENCE): StageMap {
  const bosses = [...order, 'vorthax'];
  return {
    stage,
    realm: 'rift',
    gauntlet: true,
    floors: bosses.length,
    nodes: bosses.map((enemyId, i) => ({
      id: `s${stage}-gauntlet-${i + 1}`,
      floor: i + 1,
      kind: 'warden',
      enemyId,
      next: i < bosses.length - 1 ? [`s${stage}-gauntlet-${i + 2}`] : [],
    })),
  };
}
/** Which enemies a tier can bring: the trios from Tier III, the far realms from Tier VI. (Its difficulty is the tier table's.) */
export const depthOf = (tier: number): number => (tier >= 6 ? 3 : tier >= 3 ? 2 : 1);

/** Floors before the Warden: 10 at Tier I and 1 more each tier, 29 at Tier XX (DECISIONS #531, #556). */
export const floorsOf = (tier: number): number => 9 + Math.max(1, tier);
/** A map is cut into stretches of this many floors, each with its own Merchants. */
export const MERCHANT_STRETCH = 7;
const MIN_STRETCH = 3;
/** At most this many Elites by a map's own roll per floor (a deep tier adds more, DECISIONS #524), and Merchants in a stretch. */
export const MAX_ELITES_A_FLOOR = 6 / 14;
export const MAX_MERCHANTS_A_STRETCH = 2;

/** at most this many Events in a row along any path */
export const MAX_EVENTS_IN_A_ROW = 2;

const WARDEN_OF: Record<StageRealm, string> = {
  aurelion: 'seraphine',
  nexus: 'kron',
  wyldmaw: 'gorrmaw',
  umbral: 'nyxara',
  rift: 'vorthax',
};

/**
 * (DECISIONS #437) The realms of the multiverse expansion that are not stages of their own: their regular fights and Elites join
 * the Rift (the last stage), and their Wardens may hold the second stage.
 */
export const FAR_REALMS: readonly Encounter['realm'][] = ['gloomfen', 'starfall', 'beyond'];

/** A realm's first Warden (the one it always had): the finale for the Rift. */
export function wardenFor(realm: StageRealm): Encounter {
  const id = WARDEN_OF[realm];
  const e = ENCOUNTERS.find((x) => x.id === id);
  if (!e) throw new Error(`No warden for ${realm}`);
  return e;
}

/**
 * (DECISIONS #437, #531) Every Warden a tier in this realm can end with: its first Warden and the ones of the expansion; from the second depth
 * the far realms' Wardens too, and not one that waits for a deeper tier. Tier XX, the Rift, ends with Valerion.
 */
export function wardensFor(realm: StageRealm, stage: number, tier = 1): Encounter[] {
  if (realm === 'rift' || tier >= LAST_TIER) return [wardenFor('rift')];
  const first = wardenFor(realm);
  const more = ENCOUNTERS.filter(
    (e) =>
      e.kind === 'warden' &&
      e.id !== first.id &&
      (e.realm === realm || (stage >= 2 && FAR_REALMS.includes(e.realm))),
  );
  return [first, ...more].filter((e) => (e.fromTier ?? 1) <= tier);
}

function enemiesOf(realm: string, kind: Encounter['kind'], stage = 1): Encounter[] {
  return ENCOUNTERS.filter(
    (e) => e.realm === realm && e.kind === kind && (e.fromStage ?? 1) <= stage,
  );
}

/** (DECISIONS #437) where a stage's fights come from: its realm(s), and in the Rift the far realms as well */
const fightRealms = (pool: readonly StageRealm[], stage: number): string[] =>
  stage >= FINAL_STAGE ? [...pool, ...FAR_REALMS] : [...pool];

function pick<T>(rng: RngState, list: readonly T[]): T {
  if (list.length === 0) throw new Error('Cannot pick from an empty list');
  return list[nextInt(rng, list.length)] as T;
}

/** The chances (percent) for each middle-floor node: an Elite (the first of a map, then later ones; from floor 3; a deeper tier adds more, see eliteFightChance), a Merchant (at most MAX_MERCHANTS_A_STRETCH in each stretch), a Shrine (from floor 3), an Event; the rest are fights. */
export const NODE_ODDS = {
  eliteFirst: 22,
  eliteMore: 20,
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
  if (merchantsPlaced < MAX_MERCHANTS_A_STRETCH && r >= merchantAt && r < shrineAt)
    return 'merchant';
  if (floor >= 3 && r >= shrineAt && r < eventAt) return 'shrine';
  if (r >= eventAt && r < eventAt + o.event) return 'event';
  return 'duel';
}

/**
 * An Event stop is now and then not an event at all but a fight: this percent of the time it is an Elite (only from the third floor), this
 * percent a plain fight (which a deeper tier can make an Elite, on any floor). Decided when the stop is entered, so the map still shows an Event.
 */
export const EVENT_FIGHT_ODDS = { elite: 5, duel: 10 } as const;

/** From this Rift Tier every fight is an Elite (DECISIONS #524, #526). */
export const ALL_ELITE_TIER = 11;
/** At this Rift Tier every one of those Elites is a Warden's fight (DECISIONS #526). */
export const ALL_WARDEN_TIER = 20;
/** The last Rift Tier, whose Warden is Valerion. */
const LAST_TIER = 20;
/** The chance (percent) that a plain fight is an Elite instead: none at Tier I, then evenly up to all of them at ALL_ELITE_TIER. */
export const eliteFightChance = (tier: number): number =>
  Math.min(100, Math.round(((Math.max(1, tier) - 1) * 100) / (ALL_ELITE_TIER - 1)));
/** Is this plain fight an Elite at this tier? (No roll at Tier I, so its maps and replays stay as they were.) */
export const rollEliteFight = (rng: RngState, tier: number): boolean => {
  const chance = eliteFightChance(tier);
  return chance > 0 && nextInt(rng, 100) < chance;
};

/**
 * The Wardens an act's fights can bring at ALL_WARDEN_TIER: the ones of its realms and of the far realms, so even a first act has a few to
 * bring. Never Valerion, who is the Rift's finale.
 */
function fightWardens(pool: readonly StageRealm[], stage: number): Encounter[] {
  const realms = fightRealms(pool, stage);
  return ENCOUNTERS.filter(
    (e) =>
      e.kind === 'warden' &&
      e.id !== WARDEN_OF.rift &&
      (realms.includes(e.realm) || FAR_REALMS.includes(e.realm)),
  );
}

/** The enemy that ambushes the player at an Event stop (null if the realm has none of that kind). Avoids the stage's own fights when it can. */
export function ambushEnemy(
  rng: RngState,
  pool: readonly StageRealm[],
  kind: 'duel' | 'elite',
  taken: readonly (string | undefined)[],
  stage = 1,
  tier = 1,
): string | null {
  const all =
    kind === 'elite' && tier >= ALL_WARDEN_TIER
      ? fightWardens(pool, stage)
      : fightRealms(pool, stage).flatMap((r) =>
          enemiesOf(r, kind === 'elite' ? 'elite' : 'regular', stage),
        );
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
/** A ghost deck must have cleared this Rift Tier, all three stages, to be a ghost at all (an early deck makes a poor ghost; DECISIONS #231, #235). */
export const GHOST_BOSS_MIN_TIER = 3;

/** Has a deck at this tier, with this many of its stages cleared (0-3; null: not known), cleared Tier GHOST_BOSS_MIN_TIER? */
export function ghostCleared(tier: number, stage: number | null | undefined): boolean {
  return tier > GHOST_BOSS_MIN_TIER || (tier === GHOST_BOSS_MIN_TIER && (stage ?? 0) >= 3);
}
/** The chance (percent) that a Warden beyond that is a ghost, so players do not meet the same few Wardens over and over. */
export const GHOST_WARDEN_CHANCE = 35;
/** From this Rift Tier each map has an Echo: a ghost deck met on the way, for one of its cards (DECISIONS #549). */
export const ECHO_FROM_TIER = GHOST_FROM_TIER + 1;

export function generateStageMap(
  rng: RngState,
  stage: number,
  realm: StageRealm,
  character?: string,
  pool: readonly StageRealm[] = realm === 'rift' ? ['umbral', 'wyldmaw'] : [realm],
  tier = 1,
  campaignRoute?: 'twelve',
  wardenOrder: readonly string[] = WARDEN_SEQUENCE,
): StageMap {
  if (campaignRoute === 'twelve' && tier === 12) return gauntletMap(stage, shuffledWardens(rng));
  const regulars = fightRealms(pool, stage).flatMap((r) => enemiesOf(r, 'regular', stage));
  const elites = fightRealms(pool, stage).flatMap((r) => enemiesOf(r, 'elite', stage));
  const used = new Set<string>();
  const regular = (): string => {
    const fresh = regulars.filter((e) => !used.has(e.id));
    const e = pick(rng, fresh.length > 0 ? fresh : regulars);
    used.add(e.id);
    return e.id;
  };

  const FLOORS = floorsOf(tier);
  const maxElites = Math.ceil(FLOORS * MAX_ELITES_A_FLOOR);
  const byFloor: MapNode[][] = [];
  let elites_ = 0;
  let merchants = 0;
  for (let floor = 1; floor <= FLOORS; floor++) {
    // (a last stretch too short to be one joins the one before)
    if (floor > 1 && (floor - 1) % MERCHANT_STRETCH === 0 && FLOORS - floor >= MIN_STRETCH)
      merchants = 0;
    // Five starting lanes, a meeting point every six floors, then a fresh five-way split.
    // The final pair of Shrines and the number of stops walked stay the same.
    const count =
      floor === FLOORS ? 2 : floor % 6 === 1 ? 5 : floor % 6 === 0 ? 1 : 2 + nextInt(rng, 4);
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
      if (kind === 'elite') {
        // (a different Elite each time while there are any left)
        const fresh = elites.filter((e) => !used.has(e.id));
        node.enemyId = pick(rng, fresh.length > 0 ? fresh : elites).id;
        used.add(node.enemyId);
      }
      row.push(node);
    }
    byFloor.push(row);
  }
  const warden: MapNode = {
    id: `s${stage}-warden`,
    floor: FLOORS + 1,
    kind: 'warden',
    enemyId: pick(rng, wardensFor(realm, stage, tier)).id,
    next: [],
  };
  if (campaignRoute === 'twelve' && tier <= WARDEN_SEQUENCE.length)
    warden.enemyId = wardenOrder[tier - 1]!;
  // beyond the first few Rift Tiers, now and then the Warden is a ghost (decided with the map, so the map can say so)
  // (never Valerion: the climb ends with him, DECISIONS #531)
  if (
    CAMPAIGN_GHOSTS_ENABLED &&
    tier > GHOST_FROM_TIER &&
    realm !== 'rift' &&
    nextInt(rng, 100) < GHOST_WARDEN_CHANCE
  )
    warden.ghost = true;

  // Forward routes follow lane order; every node on the next floor has an incoming path.
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
    });
    // anything on the next floor nobody leads to gets an incoming edge from the nearest node
    for (const m of nextRow) {
      if (!row.some((n) => n.next.includes(m.id))) {
        const j = Math.round(
          (nextRow.indexOf(m) * (row.length - 1)) / Math.max(1, nextRow.length - 1),
        );
        (row[j] as MapNode).next.push(m.id);
      }
    }
    // Add neighbour choices only where their lines do not cross another route.
    row.forEach((n, i) => {
      if (nextRow.length < 2 || nextInt(rng, 100) >= 55) return;
      const t = Math.round((i * (nextRow.length - 1)) / Math.max(1, row.length - 1));
      const alt = t + (nextInt(rng, 2) ? 1 : -1);
      if (alt < 0 || alt >= nextRow.length) return;
      const target = nextRow[alt] as MapNode;
      const crosses = row.some((other, j) =>
        other.next.some((id) => (i - j) * (alt - nextRow.findIndex((m) => m.id === id)) < 0),
      );
      if (!crosses && !n.next.includes(target.id)) n.next.push(target.id);
    });
  }

  // never two Merchants, Shrines or Elites in a row on any path: the earlier one becomes a Duel
  for (let f = FLOORS - 2; f >= 0; f--) {
    const after = byFloor[f + 1] as MapNode[];
    for (const n of byFloor[f] as MapNode[]) {
      if (
        (n.kind === 'merchant' || n.kind === 'shrine' || n.kind === 'elite') &&
        n.next.some((id) => after.find((m) => m.id === id)?.kind === n.kind)
      ) {
        n.kind = 'duel';
        delete n.crossed;
        n.enemyId = regular();
      }
    }
  }

  // each stretch still has a Merchant somewhere: if none is left, one takes the place of a plain fight or event, away from any other
  const nextTo = (n: MapNode, kind: NodeKind): boolean =>
    n.next.some((id) => byFloor[n.floor]?.find((m) => m.id === id)?.kind === kind) ||
    (byFloor[n.floor - 2] ?? []).some((m) => m.kind === kind && m.next.includes(n.id));
  const stretches: MapNode[][][] = [];
  for (let at = 1; at < FLOORS - 1;) {
    let end = Math.min(FLOORS - 1, at === 1 ? MERCHANT_STRETCH : at + MERCHANT_STRETCH);
    if (FLOORS - 1 - end < MIN_STRETCH) end = FLOORS - 1;
    stretches.push(byFloor.slice(at, end));
    at = end;
  }
  for (const part of stretches) {
    const stops = part.flat();
    if (stops.length === 0) continue;
    if (stops.some((n) => n.kind === 'merchant')) continue;
    const plain = stops.filter((n) => n.kind === 'duel' || n.kind === 'event');
    const apart = plain.filter((n) => !nextTo(n, 'merchant'));
    const spot = pick(rng, apart.length > 0 ? apart : plain.length > 0 ? plain : stops);
    spot.kind = 'merchant';
    delete spot.enemyId;
    const crossed = crossedFor(rng, character);
    if (crossed) spot.crossed = crossed;
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

  // one Rift Cache a map, and from ECHO_FROM_TIER one Echo, each on a plain fight of a middle floor, never beside the other (DECISIONS #549).
  // An Echo keeps its fight: if no ghost can be had for it, that is the fight
  const placeOn = (kind: 'cache' | 'echo'): void => {
    const spots = byFloor
      .flat()
      .filter(
        (n) =>
          n.kind === 'duel' &&
          n.floor >= 3 &&
          n.floor <= FLOORS - 2 &&
          !nextTo(n, 'cache') &&
          !nextTo(n, 'echo'),
      );
    if (spots.length === 0) return;
    const spot = pick(rng, spots);
    spot.kind = kind;
    if (kind === 'cache') delete spot.enemyId;
    else spot.ghost = true;
  };
  placeOn('cache');
  if (CAMPAIGN_GHOSTS_ENABLED && tier >= ECHO_FROM_TIER) placeOn('echo');

  // deeper tiers turn plain fights into Elites, past the limits above: by ALL_ELITE_TIER there are no plain fights left (DECISIONS #524)
  if (elites.length > 0) {
    for (const n of byFloor.flat()) {
      if (n.kind !== 'duel' || !rollEliteFight(rng, tier)) continue;
      const fresh = elites.filter((e) => !used.has(e.id));
      n.kind = 'elite';
      n.enemyId = pick(rng, fresh.length > 0 ? fresh : elites).id;
      used.add(n.enemyId);
    }
  }
  // and at the deepest tier each of them is a Warden's fight, played and paid as an Elite: only the last stop ends the act (DECISIONS #526)
  if (tier >= ALL_WARDEN_TIER) {
    const wardens = fightWardens(pool, stage);
    // (the one at the end of the act is met there, while there are others to bring)
    if (warden.enemyId) used.add(warden.enemyId);
    for (const n of byFloor.flat()) {
      if (n.kind !== 'elite' || wardens.length === 0) continue;
      const fresh = wardens.filter((e) => !used.has(e.id));
      n.enemyId = pick(rng, fresh.length > 0 ? fresh : wardens).id;
      used.add(n.enemyId);
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
