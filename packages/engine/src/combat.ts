// Damage, destruction, combat resolution and state-based checks.

import type { InstanceId, Link, PlayerId } from './types';
import { defOf, emit, inst, maybeInst, moveCard, player, unitIds, type Rt } from './rt';
import { computeStats, damageReduction, hasKeyword } from './stats';
import { syncBackrow } from './board';
import { fire, queueOwn } from './triggers';
import { other } from './util';

export type DamageTarget = { card: InstanceId } | { player: PlayerId };

/** Deals one instance of damage. Returns the amount actually dealt. */
export function dealDamage(
  rt: Rt,
  target: DamageTarget,
  amount: number,
  sourceId: InstanceId | null,
  cause: 'combat' | 'effect',
  opts: { lifebind?: boolean } = {},
): number {
  if (amount <= 0) return 0;
  const src = maybeInst(rt, sourceId);
  if ('player' in target) {
    player(rt, target.player).essence -= amount;
    emit(rt, { type: 'damageDealt', sourceId, target: { player: target.player }, amount });
  } else {
    const c = maybeInst(rt, target.card);
    if (!c || c.zone !== 'units') return 0;
    // static damage reduction (Warframe "Bastion"): applied before Shield
    amount = Math.max(0, amount - damageReduction(rt, c));
    if (amount <= 0) return 0;
    if (c.shield) {
      c.shield = false;
      emit(rt, { type: 'shieldPopped', id: c.id });
      if (src) {
        fire(rt, {
          type: 'shieldPopped',
          player: c.controller,
          sourceId: src.id,
          sourceCardId: src.cardId,
          targetId: c.id,
        });
      }
      return 0;
    }
    const absorbed = Math.min(c.tempGuard, amount);
    c.tempGuard -= absorbed;
    c.damage += amount - absorbed;
    c.lastHit = { by: sourceId, cause };
    emit(rt, { type: 'damageDealt', sourceId, target: c.id, amount });
  }
  if (src && src.zone === 'units') {
    src.veiled = false; // Veiled ends when it deals damage
    if (opts.lifebind !== false && hasKeyword(rt, src, 'lifebind')) {
      heal(rt, { player: src.controller }, amount);
    }
  }
  return amount;
}

export function heal(rt: Rt, target: DamageTarget, amount: number): void {
  if (amount <= 0) return;
  if ('player' in target) {
    const ps = player(rt, target.player);
    const before = ps.essence;
    ps.essence = Math.min(ps.maxEssence, ps.essence + amount);
    if (ps.essence > before)
      emit(rt, { type: 'healed', target: { player: target.player }, amount: ps.essence - before });
  } else {
    const c = maybeInst(rt, target.card);
    if (!c || c.zone !== 'units') return;
    const healed = Math.min(c.damage, amount);
    if (healed <= 0) return;
    c.damage -= healed;
    emit(rt, { type: 'healed', target: c.id, amount: healed });
  }
}

/** Destroys a unit: it dies (death triggers fire). */
export function killUnit(
  rt: Rt,
  id: InstanceId,
  cause: 'combat' | 'effect' | 'damage' | 'devoured',
  killerId: InstanceId | null = null,
): void {
  const c = inst(rt, id);
  const cardId = c.cardId;
  const controller = c.controller;
  const moved = moveCard(rt, id, 'void');
  emit(rt, { type: 'unitDestroyed', id, cardId, player: controller, cause });
  fire(rt, {
    type: 'unitDied',
    player: controller,
    sourceId: id,
    sourceCardId: cardId,
    killerId,
    cause: cause === 'combat' ? 'combat' : 'effect',
  });
  queueOwn(rt, cardId, 'onDeath', controller, moved?.id ?? id);
}

/** Destroys a non-unit card on the field (relic, set trap). No death trigger. */
export function destroyCard(rt: Rt, id: InstanceId): void {
  const c = inst(rt, id);
  const { cardId, controller } = c;
  moveCard(rt, id, 'void');
  emit(rt, { type: 'cardDestroyed', id, cardId, player: controller });
}

/** State-based checks: units at 0 Guard die. Returns true if the game ended. */
export function stateBasedChecks(rt: Rt): boolean {
  syncBackrow(rt);
  // a death can expose another (e.g. a lost aura), so repeat until a pass kills nothing
  for (let killed = true; killed;) {
    killed = false;
    for (const p of [rt.s.active, other(rt.s.active)]) {
      for (const id of unitIds(rt, p)) {
        const c = inst(rt, id);
        if (computeStats(rt, c).guard <= 0) {
          const hit = c.lastHit;
          killUnit(rt, id, hit?.cause === 'combat' ? 'combat' : 'damage', hit?.by ?? null);
          killed = true;
        }
      }
    }
  }
  return checkGameOver(rt);
}

export function checkGameOver(rt: Rt): boolean {
  if (rt.s.winner !== null) return true;
  const dead = rt.s.players.map((ps) => ps.essence <= 0);
  if (!dead[0] && !dead[1]) return false;
  endGame(rt, dead[0] && dead[1] ? 'draw' : dead[0] ? 1 : 0);
  return true;
}

export function endGame(rt: Rt, winner: PlayerId | 'draw'): void {
  if (rt.s.winner !== null) return;
  rt.s.winner = winner;
  rt.s.phase = 'ended';
  // spells/traps still staged on the chain go to the Void so every card stays in a real zone
  for (const c of Object.values(rt.s.cards)) if (c.zone === 'chain') moveCard(rt, c.id, 'void');
  rt.s.chain = [];
  rt.s.tasks = [];
  rt.s.triggers = [];
  rt.s.pending = null;
  rt.s.window = null;
  emit(rt, { type: 'gameOver', winner });
}

/** Resolves an attack link (01_GAME_DESIGN §3.5). Returns false if it fizzled. */
export function resolveAttack(rt: Rt, link: Link): boolean {
  const a = maybeInst(rt, link.sourceId);
  if (!a || a.zone !== 'units' || a.controller !== link.controller) return false;
  const defender = other(link.controller);
  const target = link.event.targetId;
  const pa = computeStats(rt, a).power;
  if (target === 'face' || target === undefined) {
    dealDamage(rt, { player: defender }, pa, a.id, 'combat');
    return true;
  }
  const d = maybeInst(rt, target);
  if (!d || d.zone !== 'units' || d.controller !== defender) return false;
  const pd = computeStats(rt, d).power;
  const guardBefore = computeStats(rt, d).guard;
  const shielded = d.shield;
  // simultaneous
  dealDamage(rt, { card: d.id }, pa, a.id, 'combat');
  dealDamage(rt, { card: a.id }, pd, d.id, 'combat');
  if (!shielded && pa > guardBefore && rt.s.cards[a.id] && hasKeyword(rt, a, 'pierce')) {
    // the carry-over is part of the same hit: Lifebind already healed for the full Power
    dealDamage(rt, { player: defender }, pa - Math.max(0, guardBefore), a.id, 'combat', {
      lifebind: false,
    });
  }
  return true;
}

/** Two units deal damage equal to their Power to each other (not an attack). */
export function fight(rt: Rt, aId: InstanceId, bId: InstanceId): void {
  const a = maybeInst(rt, aId);
  const b = maybeInst(rt, bId);
  if (!a || !b || a.zone !== 'units' || b.zone !== 'units' || a.id === b.id) return;
  const pa = computeStats(rt, a).power;
  const pb = computeStats(rt, b).power;
  dealDamage(rt, { card: b.id }, pa, a.id, 'effect');
  dealDamage(rt, { card: a.id }, pb, b.id, 'effect');
}

export function unitPowerOf(rt: Rt, id: InstanceId): number {
  const c = maybeInst(rt, id);
  return c ? computeStats(rt, c).power : 0;
}

export function isTokenId(rt: Rt, id: InstanceId): boolean {
  const c = maybeInst(rt, id);
  return !!c && defOf(rt, c).type === 'token';
}
