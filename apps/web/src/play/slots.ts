// Mapping between engine state (players, slot indexes, instance ids) and the scene's slot keys
// ("me-unit-2", "opp-trap-0"). The human is always seat 0 and is drawn on the near side.

import type { GameView, InstanceId, PlayerId } from '@sr/engine';
import { HUMAN } from './session';

export const sideOf = (p: PlayerId): 'me' | 'opp' => (p === HUMAN ? 'me' : 'opp');
export const unitKey = (p: PlayerId, slot: number): string => `${sideOf(p)}-unit-${slot}`;
export const trapKey = (p: PlayerId, slot: number): string => `${sideOf(p)}-trap-${slot}`;

/** Every field card (unit or back-row) in a view, with the scene key of the slot it stands in. */
export function fieldKeys(view: GameView): Map<InstanceId, string> {
  const m = new Map<InstanceId, string>();
  view.players.forEach((ps, p) => {
    ps.units.forEach((id, i) => {
      if (id) m.set(id, unitKey(p as PlayerId, i));
    });
    ps.backrow.forEach((id, i) => {
      if (id) m.set(id, trapKey(p as PlayerId, i));
    });
  });
  return m;
}

/**
 * Scene key for an instance id while replaying a batch: where it stands after the batch, or, for cards that
 * left the field during it (destroyed units), where it stood before.
 */
export function keyResolver(
  before: GameView,
  after: GameView,
): (id: InstanceId) => string | undefined {
  const a = fieldKeys(after);
  const b = fieldKeys(before);
  return (id) => a.get(id) ?? b.get(id);
}

/** Which player owns the slot key. */
export function playerOfKey(key: string): PlayerId {
  return key.startsWith('me-') ? HUMAN : ((1 - HUMAN) as PlayerId);
}

/** Slot index from a key like "me-unit-3". */
export function slotIndexOf(key: string): number {
  return Number(key.split('-')[2] ?? 0);
}

/** Instance id standing in a slot key, per a view (null when empty). */
export function idAtKey(view: GameView, key: string): InstanceId | null {
  const p = playerOfKey(key);
  const i = slotIndexOf(key);
  const ps = view.players[p];
  return (key.includes('-unit-') ? ps.units[i] : ps.backrow[i]) ?? null;
}
