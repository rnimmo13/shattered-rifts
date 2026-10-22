// Where a card may be dropped. These are display rules for the Phase 2 preview; in the duel proper the
// engine's legalActions() decides (the client never decides rules).

import type { CardDef } from '@sr/engine';

export type DropKind = 'unit' | 'trap' | 'spell';

export function dropKind(def: Pick<CardDef, 'type'>): DropKind {
  if (def.type === 'unit' || def.type === 'token') return 'unit';
  if (def.type === 'trap' || def.type === 'relic') return 'trap';
  return 'spell';
}

export const UNIT_SLOTS = 5;
export const TRAP_SLOTS = 4;

/** Slot keys (see slotKey in the scene) a card may be dropped on. Spells have none: they're cast anywhere. */
export function validSlotKeys(def: Pick<CardDef, 'type'>): Set<string> {
  const kind = dropKind(def);
  const keys = new Set<string>();
  if (kind === 'unit') for (let i = 0; i < UNIT_SLOTS; i++) keys.add(`me-unit-${i}`);
  if (kind === 'trap') for (let i = 0; i < TRAP_SLOTS; i++) keys.add(`me-trap-${i}`);
  return keys;
}

export function isPlayable(def: Pick<CardDef, 'cost'>, aether: number): boolean {
  return def.cost <= aether;
}

/** A spell is cast by releasing it above this fraction of the viewport height (clear of the hand). */
export const SPELL_CAST_LINE = 0.62;
