// Target candidates, choice slots and target combinations.
// Chosen targets are picked when a link is created and re-validated when it resolves (DECISIONS #25).

import type { Ability, Effect, InstanceId, PlayerId, SlotSpec, Target, TargetZone } from './types';
import { inst, player, type Rt } from './rt';
import { matchesFilter, sideMatches } from './stats';
import { combinations, product } from './util';

function zonesOf(t: Target): TargetZone[] {
  if (!t.zone) return ['units'];
  return Array.isArray(t.zone) ? t.zone : [t.zone];
}

/**
 * Card candidates for a target spec. `targeting` = true applies targeting restrictions
 * (enemy Veiled units can't be chosen). 'all' / 'random' are not targeting.
 */
export function candidates(
  rt: Rt,
  controller: PlayerId,
  t: Target,
  sourceId: InstanceId,
  targeting: boolean,
): InstanceId[] {
  const out: InstanceId[] = [];
  const seen = new Set<InstanceId>();
  const add = (id: InstanceId) => {
    if (seen.has(id)) return;
    const c = inst(rt, id);
    if (!matchesFilter(rt, c, t.filter, sourceId)) return;
    if (targeting && c.veiled && c.controller !== controller) return;
    seen.add(id);
    out.push(id);
  };
  for (const p of [0, 1] as const) {
    if (!sideMatches(t.side, controller, p)) continue;
    const ps = player(rt, p);
    for (const z of zonesOf(t)) {
      if (z === 'units') for (const id of ps.units) if (id) add(id);
      if (z === 'backrow') for (const id of ps.backrow) if (id) add(id);
      if (z === 'relics')
        for (const id of ps.backrow)
          if (id && !inst(rt, id).faceDown && rt.db[inst(rt, id).cardId]?.type === 'relic') add(id);
      if (z === 'setCards') {
        for (const id of ps.backrow) if (id && inst(rt, id).faceDown) add(id);
        for (const id of ps.units) if (id && inst(rt, id).faceDown) add(id);
      }
    }
  }
  return out;
}

/** First 'chosen' target spec per slot, walking nested effects. */
export function chosenSlots(
  effects: readonly Effect[],
  into = new Map<number, Target>(),
): Map<number, Target> {
  const visit = (t: Target) => {
    if (t.pick !== 'chosen') return;
    const slot = t.slot ?? 0;
    if (!into.has(slot)) into.set(slot, t);
  };
  for (const e of effects) {
    switch (e.op) {
      case 'conditional':
        chosenSlots(e.then, into);
        if (e.else) chosenSlots(e.else, into);
        break;
      case 'atEndOfTurn':
        chosenSlots(e.effects, into);
        break;
      case 'fight':
        visit(e.a);
        visit(e.b);
        break;
      default:
        if ('target' in e) visit(e.target);
    }
  }
  return into;
}

export function abilityEffects(a: Ability): Effect[] {
  if (a.kind === 'static') return [];
  const base = a.effects;
  if ('resonance' in a && a.resonance) return [...base, ...a.resonance.effects];
  return base;
}

/** Slot specs (with legal options) for a set of abilities resolved together. */
export function slotSpecs(
  rt: Rt,
  controller: PlayerId,
  sourceId: InstanceId,
  abilities: readonly Ability[],
): SlotSpec[] {
  const slots = new Map<number, Target>();
  for (const a of abilities) chosenSlots(abilityEffects(a), slots);
  return [...slots.entries()]
    .sort(([a], [b]) => a - b)
    .map(([slot, t]) => ({
      slot,
      count: t.count ?? 1,
      options: candidates(rt, controller, t, sourceId, true),
    }));
}

/** Every legal assignment of targets. A slot with no options gets [] (its effects are skipped). */
export function targetCombos(specs: readonly SlotSpec[]): InstanceId[][][] {
  if (specs.length === 0) return [[]];
  const maxSlot = Math.max(...specs.map((s) => s.slot));
  const perSlot = specs.map((s) => combinations(s.options, Math.min(s.count, s.options.length)));
  return product(perSlot).map((choice) => {
    const targets: InstanceId[][] = Array.from({ length: maxSlot + 1 }, () => []);
    specs.forEach((s, i) => {
      targets[s.slot] = choice[i] ?? [];
    });
    return targets;
  });
}

/** True if every slot that has a spec has at least one legal option (spells need a target). */
export function allSlotsHaveOptions(specs: readonly SlotSpec[]): boolean {
  return specs.every((s) => s.options.length > 0);
}

/**
 * Re-validates chosen targets on resolution. Returns the still-legal targets per slot and
 * whether the link fizzles (it had chosen targets and none remain).
 */
export function revalidate(
  rt: Rt,
  controller: PlayerId,
  sourceId: InstanceId,
  abilities: readonly Ability[],
  targets: readonly InstanceId[][],
): { targets: InstanceId[][]; fizzles: boolean } {
  const specs = new Map<number, Target>();
  for (const a of abilities) chosenSlots(abilityEffects(a), specs);
  let hadAny = false;
  let remaining = 0;
  const out = targets.map((ids, slot) => {
    const spec = specs.get(slot);
    if (ids.length > 0) hadAny = true;
    if (!spec) return [];
    const legal = new Set(candidates(rt, controller, spec, sourceId, true));
    const kept = ids.filter((id) => legal.has(id));
    remaining += kept.length;
    return kept;
  });
  return { targets: out, fizzles: hadAny && remaining === 0 };
}
