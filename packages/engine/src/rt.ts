// Runtime context and low-level state helpers (zones, instances, Aether, drawing).
// Everything here mutates the working copy `rt.s`; applyAction() clones before calling in.

import type {
  CardDb,
  CardDef,
  CardInstance,
  GameEvent,
  GameState,
  InstanceId,
  PlayerId,
  PlayerState,
  Zone,
} from './types';
import { RulesError } from './util';

export interface Rt {
  s: GameState;
  db: CardDb;
  ev: GameEvent[];
  /** Triggers queued during the current action (safety cap). */
  trigCount?: number;
}

export function emit(rt: Rt, e: GameEvent): void {
  rt.ev.push(e);
}

export function def(rt: Rt, cardId: string): CardDef {
  const d = rt.db[cardId];
  if (!d) throw new RulesError(`Unknown card id: ${cardId}`);
  return d;
}

export function inst(rt: Rt, id: InstanceId): CardInstance {
  const c = rt.s.cards[id];
  if (!c) throw new RulesError(`Unknown instance: ${id}`);
  return c;
}

export function maybeInst(rt: Rt, id: InstanceId | undefined | null): CardInstance | undefined {
  return id ? rt.s.cards[id] : undefined;
}

export function defOf(rt: Rt, c: CardInstance): CardDef {
  return def(rt, c.cardId);
}

export function player(rt: Rt, p: PlayerId): PlayerState {
  return rt.s.players[p];
}

export const isUnitDef = (d: CardDef): boolean => d.type === 'unit' || d.type === 'token';
export const onField = (c: CardInstance): boolean =>
  c.zone === 'units' || c.zone === 'backrow' || c.zone === 'rift';

export function newInstance(
  rt: Rt,
  cardId: string,
  owner: PlayerId,
  zone: Zone,
  controller: PlayerId = owner,
): CardInstance {
  def(rt, cardId); // validate
  const id = `c${rt.s.nextId++}`;
  const c: CardInstance = {
    id,
    cardId,
    baseCardId: cardId,
    owner,
    controller,
    zone,
    faceDown: false,
    setTurn: 0,
    arrivedTurn: 0,
    attackedTurn: 0,
    damage: 0,
    tempGuard: 0,
    buffs: [],
    granted: [],
    shield: false,
    veiled: false,
    stunTurn: 0,
    corrode: 0,
    wardTurn: 0,
    charges: 0,
    echoed: false,
    usedTurn: {},
  };
  rt.s.cards[id] = c;
  return c;
}

/** Removes an instance from whatever container holds it (does not delete the record). */
function detach(rt: Rt, c: CardInstance): void {
  const ps = player(rt, c.controller);
  const owner = player(rt, c.owner);
  const drop = (arr: InstanceId[]) => {
    const i = arr.indexOf(c.id);
    if (i >= 0) arr.splice(i, 1);
  };
  switch (c.zone) {
    case 'deck':
      drop(owner.deck);
      break;
    case 'hand':
      drop(owner.hand);
      break;
    case 'void':
      drop(owner.void);
      break;
    case 'beyond':
      drop(owner.beyond);
      break;
    case 'units': {
      const i = ps.units.indexOf(c.id);
      if (i >= 0) ps.units[i] = null;
      break;
    }
    case 'backrow': {
      const i = ps.backrow.indexOf(c.id);
      if (i >= 0) ps.backrow[i] = null;
      break;
    }
    case 'rift':
      if (ps.rift === c.id) ps.rift = null;
      break;
    case 'sigil':
      if (ps.sigil === c.id) ps.sigil = null;
      break;
    case 'chain':
      break;
  }
}

export interface MoveOpts {
  /** For units/backrow: explicit slot (default: first free). */
  slot?: number;
  /** For deck: top (default) or bottom. */
  position?: 'top' | 'bottom';
  /** New controller for field zones (default: owner). */
  controller?: PlayerId;
}

/**
 * Moves a card to a zone. Every zone change creates a NEW instance (new id, fresh state), which
 * keeps the rules simple and stops hidden cards being tracked by id (DECISIONS #27). Control
 * changes don't use this. Tokens that leave the field cease to exist (returns null). Transformed
 * cards revert. Echoed cards that would go to the Void go Beyond instead.
 */
export function moveCard(
  rt: Rt,
  id: InstanceId,
  zone: Zone,
  opts: MoveOpts = {},
): CardInstance | null {
  const old = inst(rt, id);
  detach(rt, old);
  delete rt.s.cards[id];
  const leavingField = old.zone === 'units' || old.zone === 'chain';
  const cardId = leavingField || zone !== 'units' ? old.baseCardId : old.cardId;
  const d = def(rt, cardId);
  if (d.type === 'token' && zone !== 'units') return null;
  if (old.echoed && zone === 'void') zone = 'beyond';

  const controller =
    zone === 'units' || zone === 'backrow' || zone === 'rift'
      ? (opts.controller ?? old.owner)
      : old.owner;
  const c = newInstance(rt, cardId, old.owner, zone, controller);
  place(rt, c, opts);
  return c;
}

/** Puts a (new, unplaced) instance into its zone container. */
export function place(rt: Rt, c: CardInstance, opts: MoveOpts = {}): void {
  const ps = player(rt, c.controller);
  const owner = player(rt, c.owner);
  switch (c.zone) {
    case 'deck':
      if (opts.position === 'bottom') owner.deck.push(c.id);
      else owner.deck.unshift(c.id);
      break;
    case 'hand':
      owner.hand.push(c.id);
      break;
    case 'void':
      owner.void.push(c.id);
      break;
    case 'beyond':
      owner.beyond.push(c.id);
      break;
    case 'units': {
      const slot = opts.slot ?? ps.units.indexOf(null);
      if (slot < 0 || ps.units[slot] !== null) throw new RulesError('No free unit slot');
      ps.units[slot] = c.id;
      break;
    }
    case 'backrow': {
      const slot = opts.slot ?? ps.backrow.indexOf(null);
      if (slot < 0 || ps.backrow[slot] !== null) throw new RulesError('No free backrow slot');
      ps.backrow[slot] = c.id;
      break;
    }
    case 'rift':
      ps.rift = c.id;
      break;
    case 'sigil':
      ps.sigil = c.id;
      break;
    case 'chain':
      break;
  }
}

export const freeUnitSlot = (rt: Rt, p: PlayerId): number => player(rt, p).units.indexOf(null);
export const freeBackrowSlot = (rt: Rt, p: PlayerId): number => player(rt, p).backrow.indexOf(null);

export function unitIds(rt: Rt, p: PlayerId): InstanceId[] {
  return player(rt, p).units.filter((x): x is InstanceId => x !== null);
}

export function backrowIds(rt: Rt, p: PlayerId): InstanceId[] {
  return player(rt, p).backrow.filter((x): x is InstanceId => x !== null);
}

/** Face-up permanents whose abilities are live: units, relics, rift, sigil. */
export function livePermanents(rt: Rt, p: PlayerId): CardInstance[] {
  const ps = player(rt, p);
  const out: CardInstance[] = [];
  if (ps.sigil) out.push(inst(rt, ps.sigil));
  for (const id of ps.units) if (id && !inst(rt, id).faceDown) out.push(inst(rt, id));
  for (const id of ps.backrow) {
    if (!id) continue;
    const c = inst(rt, id);
    if (!c.faceDown) out.push(c);
  }
  if (ps.rift) out.push(inst(rt, ps.rift));
  return out;
}

// --- Aether ---------------------------------------------------------------------------------

export function available(rt: Rt, p: PlayerId): number {
  const ps = player(rt, p);
  return ps.aether + ps.tempAether;
}

export function pay(rt: Rt, p: PlayerId, amount: number): void {
  if (amount <= 0) return;
  const ps = player(rt, p);
  if (ps.aether + ps.tempAether < amount) throw new RulesError('Not enough Aether');
  const fromTemp = Math.min(ps.tempAether, amount);
  ps.tempAether -= fromTemp;
  ps.aether -= amount - fromTemp;
  emitAether(rt, p);
}

export function emitAether(rt: Rt, p: PlayerId): void {
  const ps = player(rt, p);
  emit(rt, {
    type: 'aetherChanged',
    player: p,
    aether: ps.aether,
    temp: ps.tempAether,
    max: ps.maxAether,
  });
}

export function addResonance(rt: Rt, p: PlayerId): void {
  const ps = player(rt, p);
  ps.resonance += 1;
  emit(rt, { type: 'resonanceChanged', player: p, value: ps.resonance });
}

// --- Drawing --------------------------------------------------------------------------------

export function drawCards(rt: Rt, p: PlayerId, n: number): void {
  for (let i = 0; i < n; i++) drawOne(rt, p);
}

function drawOne(rt: Rt, p: PlayerId): void {
  const ps = player(rt, p);
  const top = ps.deck[0];
  if (top === undefined) {
    ps.fatigue += 1;
    ps.essence -= ps.fatigue;
    emit(rt, { type: 'fatigue', player: p, amount: ps.fatigue });
    return;
  }
  if (ps.hand.length >= rt.s.rules.handLimit) {
    const burned = moveCard(rt, top, 'void');
    emit(rt, {
      type: 'cardBurned',
      player: p,
      cardId: burned ? burned.cardId : inst(rt, top).cardId,
    });
    return;
  }
  const c = moveCard(rt, top, 'hand');
  if (c) emit(rt, { type: 'cardDrawn', player: p, id: c.id, cardId: c.cardId });
}

/** Puts a card into its owner's hand, burning it if the hand is full (DECISIONS #32). */
export function toHand(rt: Rt, id: InstanceId): CardInstance | null {
  const c = inst(rt, id);
  const owner = player(rt, c.owner);
  if (owner.hand.length >= rt.s.rules.handLimit) {
    const cardId = c.baseCardId;
    moveCard(rt, id, 'void');
    emit(rt, { type: 'cardBurned', player: c.owner, cardId });
    return null;
  }
  return moveCard(rt, id, 'hand');
}
