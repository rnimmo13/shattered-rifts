// Layered stats (base → permanent buffs → statics → temporary), keyword sets, filters and costs.
// Statics are recomputed on demand, never stored as mutated numbers (07_TECH_ARCHITECTURE §3.1).

import type {
  CardDef,
  CardInstance,
  Filter,
  InstanceId,
  Keyword,
  PlayerId,
  Side,
  StaticModifier,
} from './types';
import { def, defOf, isUnitDef, livePermanents, type Rt } from './rt';
import { other } from './util';

export interface Stats {
  power: number;
  /** Current remaining Guard (including temporary Guard). */
  guard: number;
  maxGuard: number;
  keywords: Set<Keyword>;
}

interface LiveStatic {
  controller: PlayerId;
  sourceId: InstanceId;
  modifier: StaticModifier;
}

/** Keywords that are mechanical properties of a unit (others in `keywords` are descriptive). */
const UNIT_KEYWORDS: ReadonlySet<Keyword> = new Set<Keyword>([
  'guardian',
  'blitz',
  'ward',
  'pierce',
  'lifebind',
]);

export function liveStatics(rt: Rt): LiveStatic[] {
  const out: LiveStatic[] = [];
  for (const p of [0, 1] as const) {
    for (const c of livePermanents(rt, p)) {
      for (const a of defOf(rt, c).abilities) {
        if (a.kind === 'static')
          out.push({ controller: c.controller, sourceId: c.id, modifier: a.modifier });
      }
    }
  }
  return out;
}

export function sideMatches(side: Side | undefined, actor: PlayerId, subject: PlayerId): boolean {
  if (!side || side === 'any') return true;
  return side === 'friendly' ? actor === subject : actor !== subject;
}

/** Keywords from the card, grants and statuses (no statics). */
function ownKeywords(rt: Rt, c: CardInstance): Set<Keyword> {
  const ks = new Set<Keyword>();
  if (c.faceDown) return ks;
  for (const k of defOf(rt, c).keywords ?? []) if (UNIT_KEYWORDS.has(k)) ks.add(k);
  for (const g of c.granted) ks.add(g.keyword);
  if (c.shield) ks.add('shield');
  if (c.veiled) ks.add('veiled');
  return ks;
}

/**
 * Filter check. `useStats` = false uses printed/base values only, for statics' own filters
 * (avoids aura ↔ stat recursion). Face-down cards expose no characteristics (DECISIONS #26).
 */
export function matchesFilter(
  rt: Rt,
  c: CardInstance,
  filter: Filter | undefined,
  sourceId: InstanceId | undefined,
  useStats = true,
): boolean {
  if (!filter) return true;
  if (filter.notSelf && c.id === sourceId) return false;
  const hasCharacteristicKeys = Object.keys(filter).some((k) => k !== 'notSelf');
  if (c.faceDown) return !hasCharacteristicKeys;
  const d = defOf(rt, c);
  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    // a token counts as a unit for "unit" filters
    const t = d.type === 'token' ? 'unit' : d.type;
    if (!types.includes(t) && !types.includes(d.type)) return false;
  }
  if (filter.tribe && !(d.tribes ?? []).includes(filter.tribe)) return false;
  if (filter.minCost !== undefined && d.cost < filter.minCost) return false;
  if (filter.maxCost !== undefined && d.cost > filter.maxCost) return false;
  if (filter.withoutShield && c.shield) return false;
  const needsStats =
    filter.minPower !== undefined ||
    filter.maxPower !== undefined ||
    filter.maxGuard !== undefined ||
    filter.damaged !== undefined ||
    filter.keyword !== undefined;
  if (!needsStats) return true;
  if (!isUnitDef(d)) return false;
  const st = useStats ? computeStats(rt, c) : baseStats(rt, c);
  if (filter.minPower !== undefined && st.power < filter.minPower) return false;
  if (filter.maxPower !== undefined && st.power > filter.maxPower) return false;
  if (filter.maxGuard !== undefined && st.guard > filter.maxGuard) return false;
  if (filter.damaged !== undefined && c.damage > 0 !== filter.damaged) return false;
  if (filter.keyword !== undefined && !st.keywords.has(filter.keyword)) return false;
  return true;
}

function baseStats(rt: Rt, c: CardInstance): Stats {
  const d = defOf(rt, c);
  let power = d.power ?? 0;
  let maxGuard = d.guard ?? 0;
  for (const b of c.buffs) {
    power += b.power;
    maxGuard += b.guard;
  }
  maxGuard += c.tempGuard;
  return {
    power: Math.max(0, power),
    maxGuard,
    guard: maxGuard - c.damage,
    keywords: ownKeywords(rt, c),
  };
}

/** Full layered stats for a unit on the field. */
export function computeStats(rt: Rt, c: CardInstance): Stats {
  const d = defOf(rt, c);
  let power = d.power ?? 0;
  let guard = d.guard ?? 0;
  // permanent buffs (incl. Corrode stacks applied at Dawn)
  for (const b of c.buffs)
    if (b.duration === 'permanent') {
      power += b.power;
      guard += b.guard;
    }
  const keywords = ownKeywords(rt, c);
  // statics
  if (c.zone === 'units' && !c.faceDown) {
    for (const st of liveStatics(rt)) {
      const m = st.modifier;
      if (m.type === 'aura') {
        if (!sideMatches(m.side, st.controller, c.controller)) continue;
        if (!matchesFilter(rt, c, m.filter, st.sourceId, false)) continue;
        power += m.power ?? 0;
        guard += m.guard ?? 0;
        if (m.keyword) keywords.add(m.keyword);
      } else if (m.type === 'powerPerCount' && st.sourceId === c.id) {
        power += m.amount * countUnits(rt, st.controller, m.count.side, m.count.filter, c.id);
      }
    }
  }
  // temporary
  for (const b of c.buffs)
    if (b.duration === 'turn') {
      power += b.power;
      guard += b.guard;
    }
  const maxGuard = guard + c.tempGuard;
  return { power: Math.max(0, power), maxGuard, guard: maxGuard - c.damage, keywords };
}

export function countUnits(
  rt: Rt,
  actor: PlayerId,
  side: Side,
  filter: Filter | undefined,
  sourceId: InstanceId | undefined,
): number {
  let n = 0;
  for (const p of [0, 1] as const) {
    if (!sideMatches(side, actor, p)) continue;
    for (const id of rt.s.players[p].units) {
      if (!id) continue;
      const u = rt.s.cards[id];
      if (u && matchesFilter(rt, u, filter, sourceId, false)) n++;
    }
  }
  return n;
}

export function hasKeyword(rt: Rt, c: CardInstance, k: Keyword): boolean {
  return computeStats(rt, c).keywords.has(k);
}

export function cantAttack(rt: Rt, c: CardInstance): boolean {
  return liveStatics(rt).some((st) => st.sourceId === c.id && st.modifier.type === 'cantAttack');
}

/** Cost after modifiers, plus which once-per-turn modifier sources were used to get it. */
function costWithMods(
  rt: Rt,
  controller: PlayerId,
  d: CardDef,
  on: 'play' | 'activate',
): { cost: number; used: InstanceId[] } {
  let cost = d.cost;
  const used: InstanceId[] = [];
  for (const st of liveStatics(rt)) {
    const m = st.modifier;
    if (m.type !== 'costMod' || m.on !== on) continue;
    if (!sideMatches(m.side, st.controller, controller)) continue;
    if (!defMatches(d, m.filter)) continue;
    if (m.firstEachTurn) {
      if (rt.s.cards[st.sourceId]?.usedTurn['costMod'] === rt.s.turn) continue;
      used.push(st.sourceId);
    }
    cost += m.amount;
  }
  if (on === 'play') {
    for (const a of d.abilities) {
      if (a.kind !== 'static' || a.modifier.type !== 'selfCost') continue;
      cost += a.modifier.amount * selfCostCount(rt, controller, a.modifier.per);
    }
  }
  return { cost: Math.max(0, cost), used };
}

function selfCostCount(rt: Rt, p: PlayerId, per: 'backrowCards' | 'voidTypes'): number {
  const ps = rt.s.players[p];
  if (per === 'backrowCards') return ps.backrow.filter(Boolean).length;
  const types = new Set<string>();
  for (const id of ps.void) {
    const c = rt.s.cards[id];
    if (c) types.add(def(rt, c.baseCardId).type);
  }
  return types.size;
}

/** Effective cost of playing (from hand) or activating (a Trap), after cost modifiers. */
export function effectiveCost(
  rt: Rt,
  controller: PlayerId,
  d: CardDef,
  on: 'play' | 'activate',
): number {
  return costWithMods(rt, controller, d, on).cost;
}

/** Marks the once-per-turn cost modifiers that this play/activation used. */
export function consumeCostMods(
  rt: Rt,
  controller: PlayerId,
  d: CardDef,
  on: 'play' | 'activate',
): void {
  for (const id of costWithMods(rt, controller, d, on).used) {
    const c = rt.s.cards[id];
    if (c) c.usedTurn['costMod'] = rt.s.turn;
  }
}

export function hasStatic(rt: Rt, p: PlayerId, type: StaticModifier['type']): boolean {
  return liveStatics(rt).some((st) => st.controller === p && st.modifier.type === type);
}

export function damageReduction(rt: Rt, c: CardInstance): number {
  let n = 0;
  for (const st of liveStatics(rt)) {
    if (st.sourceId === c.id && st.modifier.type === 'damageReduction') n += st.modifier.amount;
  }
  return n;
}

/** Printed-characteristics filter on a definition (cards in hand/backrow for cost modifiers). */
export function defMatches(d: CardDef, filter: Filter): boolean {
  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    const tokenAsUnit = d.type === 'token' && types.includes('unit');
    if (!types.includes(d.type) && !tokenAsUnit) return false;
  }
  if (filter.tribe && !(d.tribes ?? []).includes(filter.tribe)) return false;
  if (filter.minCost !== undefined && d.cost < filter.minCost) return false;
  if (filter.maxCost !== undefined && d.cost > filter.maxCost) return false;
  return true;
}

export function isStunned(rt: Rt, c: CardInstance): boolean {
  return c.stunTurn !== 0 && c.stunTurn === rt.s.turn;
}

/** Turn number of `p`'s next turn (for Stun). */
export function nextTurnOf(rt: Rt, p: PlayerId): number {
  return rt.s.active === p ? rt.s.turn + 2 : rt.s.turn + 1;
}

export function enemyOf(p: PlayerId): PlayerId {
  return other(p);
}

/** Initial statuses for a unit entering the field face-up (Shield, Veiled from printed keywords). */
export function initEnterStatuses(rt: Rt, c: CardInstance): void {
  const ks = def(rt, c.cardId).keywords ?? [];
  if (ks.includes('shield')) c.shield = true;
  if (ks.includes('veiled')) c.veiled = true;
}
