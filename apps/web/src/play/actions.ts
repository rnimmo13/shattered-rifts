// Pure helpers that turn the engine's flat list of legal actions into what the UI needs: which cards can be
// played and how, what a unit can attack or activate, and human-readable labels. Nothing here decides a rule:
// it only reads legalActions() (golden rule 3).

import type { Action, GameView, InstanceId } from '@sr/engine';
import { CARD_DB } from '@sr/content';

export type PlayLike = Extract<Action, { type: 'play' | 'setTrap' | 'setAmbush' }>;

/** Every way to play/set the card with this instance id (hand cards, and Echo casts from the Void). */
export function cardPlays(legal: readonly Action[], cardId: InstanceId): PlayLike[] {
  return legal.filter(
    (a): a is PlayLike =>
      (a.type === 'play' || a.type === 'setTrap' || a.type === 'setAmbush') && a.card === cardId,
  );
}

/** Hand cards that have at least one legal play. */
export function playableIds(legal: readonly Action[]): Set<InstanceId> {
  const out = new Set<InstanceId>();
  for (const a of legal) {
    if (a.type === 'play') {
      if (!a.echo) out.add(a.card);
    } else if (a.type === 'setTrap' || a.type === 'setAmbush') out.add(a.card);
  }
  return out;
}

/** Cards in the Void that can be cast again with Echo. */
export function echoPlays(legal: readonly Action[]): PlayLike[] {
  return legal.filter((a): a is PlayLike => a.type === 'play' && a.echo === true);
}

export function attackTargets(
  legal: readonly Action[],
  attacker: InstanceId,
): (InstanceId | 'face')[] {
  const out: (InstanceId | 'face')[] = [];
  for (const a of legal) if (a.type === 'attack' && a.attacker === attacker) out.push(a.target);
  return out;
}

export function canAttackWith(legal: readonly Action[], unit: InstanceId): boolean {
  return legal.some((a) => a.type === 'attack' && a.attacker === unit);
}

/** Activated abilities, flips and trap activations for one field card. */
export function fieldActions(legal: readonly Action[], id: InstanceId): Action[] {
  return legal.filter(
    (a) =>
      (a.type === 'activate' && a.card === id) ||
      (a.type === 'flip' && a.unit === id) ||
      (a.type === 'activateTrap' && a.card === id),
  );
}

/** During a response window: everything except Pass. */
export function windowOptions(legal: readonly Action[]): Action[] {
  return legal.filter((a) => a.type !== 'pass');
}

export const hasPass = (legal: readonly Action[]): boolean => legal.some((a) => a.type === 'pass');
export const endTurnAction = (legal: readonly Action[]): Action | undefined =>
  legal.find((a) => a.type === 'endTurn');

export function cardName(view: GameView, id: InstanceId): string {
  const c = view.cards[id];
  if (!c || c.cardId === '?') return 'a hidden card';
  return CARD_DB[c.cardId]?.name ?? c.cardId;
}

/**
 * A card named well enough to tell two of the same name apart: "Whelp (yours, slot 2, 3/2)". Cards that are not on
 * the field (hand, Void) are just named.
 */
export function cardLabel(view: GameView, id: InstanceId): string {
  const base = cardName(view, id);
  for (let p = 0; p < 2; p++) {
    const ps = view.players[p as 0 | 1];
    const owner = p === view.viewer ? 'yours' : "enemy's";
    const u = ps.units.indexOf(id);
    if (u >= 0) {
      const st = view.stats[id];
      return `${base} (${owner}, slot ${u + 1}${st ? `, ${st.power}/${st.guard}` : ''})`;
    }
    const b = ps.backrow.indexOf(id);
    if (b >= 0) return `${base} (${owner}, back row ${b + 1})`;
  }
  return base;
}

function targetNames(view: GameView, targets: readonly (readonly InstanceId[])[]): string {
  return targets
    .flat()
    .map((id) => cardLabel(view, id))
    .join(', ');
}

/** A short label for one variant of an action, used by the chooser when a card has several ways to be played. */
export function describeAction(a: Action, view: GameView): string {
  switch (a.type) {
    case 'play': {
      const bits: string[] = [];
      if (a.echo) bits.push('Echo');
      if (a.overclock) bits.push('Overclocked');
      if (a.ascend && a.ascend.length > 0)
        bits.push(`Ascend: sacrifice ${a.ascend.map((id) => cardLabel(view, id)).join(', ')}`);
      if (a.declined && a.declined.length > 0) bits.push('without the optional effect');
      const t = a.targets.length > 0 ? targetNames(view, a.targets) : '';
      const card = cardName(view, a.card);
      const head = bits.length > 0 ? `${bits.join(' · ')} ${card}` : `Play ${card}`;
      return t ? `${head} → ${t}` : head;
    }
    case 'setTrap':
      return 'Set face-down';
    case 'setAmbush':
      return 'Set face-down as an Ambush';
    case 'flip':
      return `Flip ${cardLabel(view, a.unit)}`;
    case 'activate':
      return `Use ${cardName(view, a.card)}${a.targets.length > 0 ? ` → ${targetNames(view, a.targets)}` : ''}`;
    case 'activateTrap':
      return `Spring ${cardName(view, a.card)}${a.targets.length > 0 ? ` → ${targetNames(view, a.targets)}` : ''}`;
    case 'attack':
      return `${cardLabel(view, a.attacker)} attacks ${a.target === 'face' ? 'directly' : cardLabel(view, a.target)}`;
    case 'pass':
      return 'Pass';
    case 'endTurn':
      return 'End turn';
    case 'chooseTargets':
      return a.targets.length > 0 ? targetNames(view, a.targets) : 'No target';
    case 'chooseOptional':
      return a.accept ? 'Yes' : 'No';
    case 'chooseCards':
      return a.cards.length > 0 ? a.cards.map((id) => cardLabel(view, id)).join(', ') : 'None';
    case 'mulligan':
      return a.cards.length > 0 ? `Replace ${a.cards.length}` : 'Keep all';
    case 'scry': {
      const list = (ids: readonly InstanceId[]) =>
        ids.length > 0 ? ids.map((id) => cardName(view, id)).join(', ') : 'nothing';
      return `Top: ${list(a.top)} · Bottom: ${list(a.bottom)}`;
    }
    case 'concede':
      return 'Concede';
  }
}

/** Distinct values at one target slot across a set of variants (used to offer a pick-a-target step). */
export function distinctTargets(variants: readonly PlayLike[], slot = 0): InstanceId[] {
  const seen = new Set<InstanceId>();
  for (const v of variants)
    if (v.type === 'play') for (const id of v.targets[slot] ?? []) seen.add(id);
  return [...seen];
}

/** Actions that pick targets (card plays, traps, abilities, flips). */
export type Targeted = Extract<Action, { type: 'play' | 'activateTrap' | 'activate' | 'flip' }>;

/** The targets an action picks, or undefined when it picks none. */
export function targetsOfAction(a: Action): readonly (readonly InstanceId[])[] | undefined {
  return a.type === 'play' ||
    a.type === 'activateTrap' ||
    a.type === 'activate' ||
    a.type === 'flip'
    ? a.targets
    : undefined;
}

/** Everything about an action except what it targets (Overclock, Echo, Ascend, which ability, set face-down...). */
export function modeKey(a: Action): string {
  if (a.type === 'play')
    return JSON.stringify([
      a.overclock ?? false,
      a.declined ?? [],
      a.ascend ?? [],
      a.echo ?? false,
    ]);
  if (a.type === 'activate') return `activate:${a.ability}`;
  return a.type;
}

/** Split a set of actions into groups that differ only by target. */
export function groupByMode<T extends Action>(variants: readonly T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const v of variants) {
    const k = modeKey(v);
    const g = groups.get(k);
    if (g) g.push(v);
    else groups.set(k, [v]);
  }
  return [...groups.values()];
}

/** A label for a mode, without its target ("Play Rift Bolt", "Overclocked Field Technician"). */
export function describeMode(a: Action, view: GameView): string {
  return describeAction(
    a.type === 'play' || a.type === 'activateTrap' || a.type === 'activate' || a.type === 'flip'
      ? { ...a, targets: [] }
      : a,
    view,
  );
}

/**
 * When every variant picks exactly one target card, map each target to the variant that picks it. Returns null
 * when the choice is not a simple single target (so the caller falls back to a list).
 */
export function singleTargetMap<T extends Action>(
  variants: readonly T[],
  targetsOf: (a: T) => readonly (readonly InstanceId[])[] | undefined,
): Map<InstanceId, T> | null {
  const out = new Map<InstanceId, T>();
  for (const v of variants) {
    const t = targetsOf(v);
    if (!t || t.length !== 1 || t[0]?.length !== 1) return null;
    const id = t[0][0] as InstanceId;
    if (out.has(id)) return null; // two variants for one target: not a pure single-target choice
    out.set(id, v);
  }
  return out;
}

export const chooseTargetsOf = (
  a: Extract<Action, { type: 'chooseTargets' }>,
): readonly (readonly InstanceId[])[] => a.targets;
