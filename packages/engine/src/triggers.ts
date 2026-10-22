// Passive triggers ("Whenever...", onDeath, onDevoured). They are NOT chain links: they queue and
// resolve right after the current link / action, active player's first (01_GAME_DESIGN §3.6).

import type { EventFilter, EventType, InstanceId, PlayerId, QueuedTrigger } from './types';
import { def, defOf, livePermanents, player, type Rt } from './rt';
import { defMatches, matchesFilter, sideMatches } from './stats';
import { EngineCapError } from './util';

export interface TrigEvent {
  type: Exclude<EventType, 'swiftCast'>;
  /** Whose unit / who acted. */
  player: PlayerId;
  sourceId: InstanceId;
  sourceCardId: string;
  targetId?: InstanceId | 'face';
  killerId?: InstanceId | null;
  cause?: 'combat' | 'effect';
  swift?: boolean;
  /** spellCast: the units the spell targets. */
  targets?: InstanceId[];
}

/** Does an event filter (from an ability controlled by `ctl` on `srcId`) match this event? */
export function eventMatches(
  rt: Rt,
  f: EventFilter,
  ev: TrigEvent,
  ctl: PlayerId,
  srcId: InstanceId,
): boolean {
  if (f.type === 'swiftCast') {
    if (ev.type !== 'spellCast' || !ev.swift) return false;
  } else if (f.type !== ev.type) return false;
  if (!sideMatches(f.side, ctl, ev.player)) return false;
  if (f.filter) {
    const live = rt.s.cards[ev.sourceId];
    if (live) {
      if (!matchesFilter(rt, live, f.filter, srcId)) return false;
    } else {
      // last-known information for cards that already left (e.g. a dead unit)
      if (f.filter.notSelf && ev.sourceId === srcId) return false;
      if (!defMatches(def(rt, ev.sourceCardId), f.filter)) return false;
    }
  }
  if (f.attackTarget) {
    if (f.attackTarget === 'riftwalker' && ev.targetId !== 'face') return false;
    if (f.attackTarget === 'friendlyUnit') {
      if (!ev.targetId || ev.targetId === 'face') return false;
      const t = rt.s.cards[ev.targetId];
      if (!t || t.controller !== ctl) return false;
    }
  }
  if (f.killedBySelf && ev.killerId !== srcId) return false;
  if (f.cause && ev.cause !== f.cause) return false;
  if (f.onSelf && ev.targetId !== srcId) return false;
  if (f.spellTargets === 'friendlyUnit') {
    if (!ev.targets?.some((id) => rt.s.cards[id]?.controller === ctl)) return false;
  }
  return true;
}

export function anyMatches(
  rt: Rt,
  f: EventFilter | EventFilter[],
  ev: TrigEvent,
  ctl: PlayerId,
  srcId: InstanceId,
): boolean {
  return (Array.isArray(f) ? f : [f]).some((x) => eventMatches(rt, x, ev, ctl, srcId));
}

export function queueTrigger(rt: Rt, t: QueuedTrigger): void {
  rt.s.triggers.push(t);
  rt.trigCount = (rt.trigCount ?? 0) + 1;
  if (rt.trigCount > rt.s.rules.triggerCap) {
    throw new EngineCapError(`Trigger queue cap (${rt.s.rules.triggerCap}) hit in one action`);
  }
}

/** Queues every live `whenever` ability that matches the event. */
export function fire(rt: Rt, ev: TrigEvent): void {
  for (const p of [rt.s.active, rt.s.active === 0 ? 1 : 0] as const) {
    for (const c of livePermanents(rt, p)) {
      defOf(rt, c).abilities.forEach((a, idx) => {
        if (a.kind !== 'whenever') return;
        if (!anyMatches(rt, a.event, ev, c.controller, c.id)) return;
        if (a.oncePerTurn) {
          if (c.usedTurn[idx] === rt.s.turn) return;
          c.usedTurn[idx] = rt.s.turn;
        }
        if (a.oncePerGame) {
          const key = `${c.cardId}:${idx}`;
          const ps = player(rt, c.controller);
          if (ps.once[key]) return;
          ps.once[key] = true;
        }
        const t: QueuedTrigger = {
          controller: c.controller,
          sourceId: c.id,
          cardId: c.cardId,
          ability: idx,
          eventSourceId: ev.sourceId,
        };
        if (ev.targetId !== undefined) t.eventTargetId = ev.targetId;
        queueTrigger(rt, t);
      });
    }
  }
}

/** Queues a card's own timed abilities of one kind (onDeath / onDevoured), using last-known info. */
export function queueOwn(
  rt: Rt,
  cardId: string,
  kind: 'onDeath' | 'onDevoured' | 'onBreak',
  controller: PlayerId,
  sourceId: InstanceId,
  eventSourceId?: InstanceId,
): void {
  def(rt, cardId).abilities.forEach((a, idx) => {
    if (a.kind !== kind) return;
    const t: QueuedTrigger = { controller, sourceId, cardId, ability: idx };
    if (eventSourceId !== undefined) t.eventSourceId = eventSourceId;
    queueTrigger(rt, t);
  });
}

/** Next trigger to resolve: the active player's first (FIFO within a player). */
export function takeNextTrigger(rt: Rt): QueuedTrigger | undefined {
  const q = rt.s.triggers;
  if (q.length === 0) return undefined;
  let i = q.findIndex((t) => t.controller === rt.s.active);
  if (i < 0) i = 0;
  return q.splice(i, 1)[0];
}
