// The effect DSL interpreter. Cards are data: every behaviour here is a generic `op`.
// Frames run one effect per step so a resolution can pause on a prompt (Scry, choose a card) and
// resume exactly where it stopped after the prompt is answered.

import type {
  Ability,
  Amount,
  Condition,
  Effect,
  EffectCtx,
  InstanceId,
  PlayerId,
  Target,
  Task,
} from './types';
import {
  def,
  defOf,
  emit,
  emitMana,
  freeBackrowSlot,
  freeUnitSlot,
  inst,
  maybeInst,
  moveCard,
  newInstance,
  onField,
  place,
  player,
  toHand,
  drawCards,
  type Rt,
} from './rt';
import { computeStats, defMatches, hasStatic, initEnterStatuses, nextTurnOf } from './stats';
import { allSlotsHaveOptions, candidates, slotSpecs, wardFilter } from './targeting';
import { dealDamage, destroyCard, fight, heal, killUnit, type DamageTarget } from './combat';
import { fire, queueOwn } from './triggers';
import { nextInt, sample } from './rng';
import { clone, other } from './util';

type Ref = { card: InstanceId } | { player: PlayerId };

export function frameTask(effects: Effect[], ctx: EffectCtx): Task {
  return { t: 'frame', effects, i: 0, ctx };
}

/** Executes the next effect of a frame. The caller has already re-pushed the advanced frame. */
export function stepFrame(rt: Rt, effects: readonly Effect[], i: number, ctx: EffectCtx): void {
  const e = effects[i];
  if (e) runEffect(rt, e, ctx);
}

function resolveTarget(rt: Rt, ctx: EffectCtx, t: Target): Ref[] {
  const cards = (ids: (InstanceId | undefined)[]): Ref[] =>
    ids.filter((id): id is InstanceId => !!id && !!rt.s.cards[id]).map((card) => ({ card }));
  switch (t.pick) {
    case 'chosen':
    case 'linkTarget':
      return cards(
        (ctx.targets[t.slot ?? 0] ?? []).filter((id) => {
          const c = rt.s.cards[id];
          return !!c && onField(c);
        }),
      );
    case 'random': {
      const pool = candidates(rt, ctx.controller, t, ctx.sourceId, false);
      if (pool.length === 0) return [];
      return cards(sample(rt.s.rng, pool, Math.min(t.count ?? 1, pool.length)));
    }
    case 'all': {
      let ids = candidates(rt, ctx.controller, t, ctx.sourceId, false);
      if (t.filter?.sameNameAsEventSource) {
        const name = ctx.eventSourceCardId ? def(rt, ctx.eventSourceCardId).name : undefined;
        ids = ids.filter((id) => defOf(rt, inst(rt, id)).name === name);
      }
      return cards(ids);
    }
    case 'self':
      return cards([ctx.sourceId]);
    case 'eventSource':
      return cards([ctx.eventSourceId]);
    case 'eventTarget':
      if (ctx.eventTargetId === 'face') {
        return ctx.eventTargetPlayer === undefined ? [] : [{ player: ctx.eventTargetPlayer }];
      }
      return cards([ctx.eventTargetId]);
    case 'riftwalker': {
      const side = t.side ?? 'enemy';
      if (side === 'friendly') return [{ player: ctx.controller }];
      if (side === 'enemy') return [{ player: other(ctx.controller) }];
      return [{ player: ctx.controller }, { player: other(ctx.controller) }];
    }
    case 'summonedByThis':
      return cards(ctx.summoned);
  }
}

function unitRefs(rt: Rt, refs: Ref[]): InstanceId[] {
  return refs.flatMap((r) => ('card' in r && rt.s.cards[r.card]?.zone === 'units' ? [r.card] : []));
}

function amountOf(rt: Rt, ctx: EffectCtx, a: Amount): number {
  if (typeof a === 'number') return a;
  if ('powerOf' in a) {
    const units = unitRefs(rt, resolveTarget(rt, ctx, a.powerOf));
    const sum = units.reduce((n, id) => n + computeStats(rt, inst(rt, id)).power, 0);
    return sum * (a.times ?? 1) + (a.plus ?? 0);
  }
  const n = resolveTarget(rt, ctx, { ...a.countOf, pick: 'all' }).length;
  return n * (a.times ?? 1) + (a.plus ?? 0);
}

function playerOf(ctx: EffectCtx, who: 'self' | 'enemy'): PlayerId {
  return who === 'self' ? ctx.controller : other(ctx.controller);
}

export function evalCondition(rt: Rt, ctx: EffectCtx, cond: Condition): boolean {
  if (cond.targetIsAttacking !== undefined) {
    const id = ctx.targets[cond.slot ?? 0]?.[0];
    const attacking = !!id && rt.s.chain.some((l) => l.kind === 'attack' && l.sourceId === id);
    if (attacking !== cond.targetIsAttacking) return false;
  }
  if (cond.eventSource) {
    const src = maybeInst(rt, ctx.eventSourceId);
    if (!src) return false;
    const f = cond.eventSource;
    if (f.maxGuard !== undefined && computeStats(rt, src).guard > f.maxGuard) return false;
    if (f.minPower !== undefined && computeStats(rt, src).power < f.minPower) return false;
    if (f.maxPower !== undefined && computeStats(rt, src).power > f.maxPower) return false;
    if (!defMatches(defOf(rt, src), f)) return false;
  }
  if (
    cond.resonanceAtLeast !== undefined &&
    player(rt, ctx.controller).resonance < cond.resonanceAtLeast
  ) {
    return false;
  }
  if (
    cond.handCountAtMost !== undefined &&
    player(rt, ctx.controller).hand.length > cond.handCountAtMost
  ) {
    return false;
  }
  return true;
}

function runEffect(rt: Rt, e: Effect, ctx: EffectCtx): void {
  const s = rt.s;
  switch (e.op) {
    case 'damage': {
      const n = amountOf(rt, ctx, e.amount);
      for (const r of resolveTarget(rt, ctx, e.target))
        dealDamage(rt, toDamageTarget(r), n, liveSource(rt, ctx), 'effect');
      return;
    }
    case 'heal': {
      const n = amountOf(rt, ctx, e.amount);
      for (const r of resolveTarget(rt, ctx, e.target)) heal(rt, toDamageTarget(r), n);
      return;
    }
    case 'destroy': {
      for (const r of resolveTarget(rt, ctx, e.target)) {
        if (!('card' in r)) continue;
        const c = inst(rt, r.card);
        if (c.zone === 'units') {
          const victimCardId = c.cardId;
          const victimController = c.controller;
          killUnit(rt, c.id, e.devour ? 'devoured' : 'effect', liveSource(rt, ctx));
          if (e.devour) {
            emit(rt, { type: 'devoured', devourerId: ctx.sourceId, victimId: r.card });
            fire(rt, {
              type: 'devoured',
              player: ctx.controller,
              sourceId: ctx.sourceId,
              sourceCardId: ctx.sourceCardId,
            });
            queueOwn(rt, victimCardId, 'onDevoured', victimController, r.card, ctx.sourceId);
          }
        } else if (onField(c)) {
          destroyCard(rt, c.id);
        }
      }
      return;
    }
    case 'banish':
      for (const id of cardRefs(resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        const { cardId, controller } = c;
        moveCard(rt, id, 'beyond');
        emit(rt, { type: 'unitBanished', id, cardId, player: controller });
      }
      return;
    case 'returnToHand':
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        const { cardId, owner, faceDown } = c;
        const moved = toHand(rt, id);
        emit(rt, {
          type: 'returnedToHand',
          fromId: id,
          id: moved?.id ?? null,
          cardId,
          player: owner,
          ...(faceDown ? { faceDown: true } : {}),
        });
      }
      return;
    case 'stun':
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        c.stunTurn = nextTurnOf(rt, c.controller);
        emit(rt, { type: 'statusApplied', id, status: 'stunned' });
      }
      return;
    case 'corrode':
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        inst(rt, id).corrode += 1;
        emit(rt, { type: 'statusApplied', id, status: 'corroded' });
      }
      return;
    case 'takeControl':
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        if (c.controller === ctx.controller) continue;
        const slot = freeUnitSlot(rt, ctx.controller);
        if (slot < 0) continue;
        const from = player(rt, c.controller);
        const original = c.controller;
        from.units[from.units.indexOf(id)] = null;
        c.controller = ctx.controller;
        c.arrivedTurn = s.turn;
        if (e.duration === 'turn') c.revertControl = original;
        else delete c.revertControl;
        if (e.grant) c.granted.push({ keyword: e.grant.keyword, duration: e.grant.duration });
        place(rt, c, { slot });
        emit(rt, { type: 'controlChanged', id, player: ctx.controller });
      }
      return;
    case 'assemble': {
      const self = maybeInst(rt, ctx.sourceId);
      if (!self || self.zone !== 'units') return;
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        if (id === self.id) continue;
        const t = inst(rt, id);
        const st = computeStats(rt, t);
        self.buffs.push({ power: st.power, guard: Math.max(0, st.guard), duration: 'permanent' });
        for (const k of st.keywords) {
          if (k === 'shield') self.shield = true;
          else if (k === 'veiled') self.veiled = true;
          else self.granted.push({ keyword: k, duration: 'permanent' });
        }
        moveCard(rt, id, 'void'); // leaves, doesn't die
        emit(rt, { type: 'assembled', id: self.id, absorbedId: id });
        fire(rt, {
          type: 'assembled',
          player: ctx.controller,
          sourceId: self.id,
          sourceCardId: self.cardId,
        });
        emitStats(rt, self.id);
      }
      return;
    }
    case 'buff': {
      const power = e.power === undefined ? 0 : amountOf(rt, ctx, e.power);
      const guard = e.guard === undefined ? 0 : amountOf(rt, ctx, e.guard);
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        if (e.duration === 'turn' && guard > 0) {
          c.tempGuard += guard;
          if (power !== 0) c.buffs.push({ power, guard: 0, duration: 'turn' });
        } else {
          c.buffs.push({ power, guard, duration: e.duration });
        }
        emitStats(rt, id);
      }
      return;
    }
    case 'grant':
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        if (e.keyword === 'shield') c.shield = true;
        else if (e.keyword === 'veiled') c.veiled = true;
        else c.granted.push({ keyword: e.keyword, duration: e.duration });
        emit(rt, { type: 'keywordGranted', id, keyword: e.keyword });
      }
      return;
    case 'summon': {
      const side = e.side === 'enemy' ? other(ctx.controller) : ctx.controller;
      for (let n = 0; n < e.count; n++) {
        const slot = freeUnitSlot(rt, side);
        if (slot < 0) break;
        const c = newInstance(rt, e.card, side, 'units');
        c.arrivedTurn = s.turn;
        initEnterStatuses(rt, c);
        place(rt, c, { slot });
        ctx.summoned.push(c.id);
        emit(rt, {
          type: 'unitSummoned',
          player: side,
          id: c.id,
          cardId: c.cardId,
          slot,
          token: def(rt, e.card).type === 'token',
        });
        // effect-made summons fire passives only, never open windows (DECISIONS #18)
        fire(rt, { type: 'unitSummoned', player: side, sourceId: c.id, sourceCardId: c.cardId });
      }
      return;
    }
    case 'draw':
      drawCards(rt, playerOf(ctx, e.player), e.amount);
      return;
    case 'discardRandom': {
      const p = playerOf(ctx, e.player);
      for (let n = 0; n < e.amount; n++) {
        const hand = player(rt, p).hand;
        if (hand.length === 0) break;
        const id = hand[nextInt(s.rng, hand.length)] as InstanceId;
        const cardId = inst(rt, id).cardId;
        moveCard(rt, id, 'void');
        emit(rt, { type: 'discarded', player: p, cardId });
      }
      return;
    }
    case 'scry': {
      const p = playerOf(ctx, e.player);
      const cards = player(rt, p).deck.slice(0, e.amount);
      if (cards.length > 0) s.pending = { kind: 'scry', player: p, cards };
      return;
    }
    case 'topdeckFromHand': {
      const p = playerOf(ctx, e.player);
      const hand = player(rt, p).hand;
      if (hand.length > 0) {
        const n = Math.min(e.amount, hand.length);
        s.pending = {
          kind: 'chooseCards',
          player: p,
          from: [...hand],
          eligible: [...hand],
          min: n,
          max: n,
          purpose: 'topdeck',
          rest: 'none',
        };
      }
      return;
    }
    case 'gainMana': {
      const p = playerOf(ctx, e.player);
      const ps = player(rt, p);
      if (e.temporary === false) ps.mana += e.amount;
      else ps.tempMana += e.amount;
      emitMana(rt, p);
      return;
    }
    case 'negate': {
      const link = s.chain.find((l) => l.id === ctx.triggerLinkId);
      if (link && !link.negated) {
        link.negated = true;
        emit(rt, { type: 'negated', linkId: link.id, byId: ctx.sourceId });
      }
      return;
    }
    case 'fight': {
      const [a] = unitRefs(rt, resolveTarget(rt, ctx, e.a));
      const [b] = unitRefs(rt, resolveTarget(rt, ctx, e.b));
      if (a && b) fight(rt, a, b);
      return;
    }
    case 'transform':
      for (const id of unitRefs(rt, resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        const from = c.cardId;
        c.cardId = e.into;
        c.arrivedTurn = s.turn; // Evolve resets Arriving (DECISIONS #30)
        emit(rt, { type: 'evolved', id, from, to: e.into });
        emitStats(rt, id);
      }
      return;
    case 'setFrom': {
      const p = ctx.controller;
      const ps = player(rt, p);
      const pool = ps.deck.filter(
        (id) => !e.filter || defMatches(defOf(rt, inst(rt, id)), e.filter),
      );
      const slot = freeBackrowSlot(rt, p);
      if (pool.length === 0 || slot < 0) return;
      const pick = pool[nextInt(s.rng, pool.length)] as InstanceId;
      const c = moveCard(rt, pick, 'backrow', { slot, controller: p });
      if (!c) return;
      c.faceDown = true;
      c.setTurn = s.turn;
      emit(rt, { type: 'trapSet', player: p, id: c.id, cardId: c.cardId });
      return;
    }
    case 'removeCharge':
      for (const id of cardRefs(resolveTarget(rt, ctx, e.target))) {
        const c = inst(rt, id);
        c.charges -= e.amount ?? 1;
        emit(rt, { type: 'relicChargeChanged', id, charges: Math.max(0, c.charges) });
        if (c.charges <= 0) {
          const { cardId, controller } = c;
          emit(rt, { type: 'relicBroken', id, cardId });
          const moved = moveCard(rt, id, 'void');
          queueOwn(rt, cardId, 'onBreak', controller, moved?.id ?? id);
        }
      }
      return;
    case 'addRandomToHand': {
      const p = playerOf(ctx, e.player);
      const pool = Object.values(rt.db)
        .filter((c) => c.collectible && c.realm === e.realm && c.type === e.cardType)
        .map((c) => c.id)
        .sort();
      if (pool.length === 0) return;
      const cardId = pool[nextInt(s.rng, pool.length)] as string;
      if (player(rt, p).hand.length >= s.rules.handLimit) {
        // a full hand burns it like any draw: it goes to the (public) Void
        place(rt, newInstance(rt, cardId, p, 'void'));
        emit(rt, { type: 'cardBurned', player: p, cardId });
        return;
      }
      const c = newInstance(rt, cardId, p, 'hand');
      place(rt, c);
      emit(rt, { type: 'cardAdded', player: p, id: c.id, cardId });
      return;
    }
    case 'setTrapFrom': {
      const p = ctx.controller;
      const ps = player(rt, p);
      const from = e.zone === 'hand' ? [...ps.hand] : ps.deck.slice(0, e.n ?? 3);
      const rest = e.zone === 'hand' ? 'none' : 'bottom';
      const eligible =
        freeBackrowSlot(rt, p) >= 0
          ? from.filter((id) => defOf(rt, inst(rt, id)).type === 'trap')
          : [];
      if (eligible.length === 0) {
        if (rest === 'bottom')
          for (const id of from) moveCard(rt, id, 'deck', { position: 'bottom' });
        return;
      }
      s.pending = {
        kind: 'chooseCards',
        player: p,
        from,
        eligible,
        min: 0,
        max: 1,
        purpose: 'setTrap',
        rest,
      };
      return;
    }
    case 'peekDestroy': {
      const p = ctx.controller;
      const foe = other(p);
      if (hasStatic(rt, foe, 'protectSetCards')) return;
      const fps = player(rt, foe);
      const from = [...fps.backrow, ...fps.units].filter(
        (id): id is InstanceId => !!id && !!rt.s.cards[id]?.faceDown,
      );
      if (from.length === 0) return;
      const eligible = from.filter(
        (id) => !e.filter || defMatches(defOf(rt, inst(rt, id)), e.filter),
      );
      s.pending = {
        kind: 'chooseCards',
        player: p,
        from,
        eligible,
        min: 0,
        max: eligible.length > 0 ? 1 : 0,
        purpose: 'destroySet',
        rest: 'none',
      };
      return;
    }
    case 'copySpell': {
      const ps = player(rt, ctx.controller);
      const ids =
        e.which === 'lastCast'
          ? ps.lastSpell
            ? [ps.lastSpell]
            : []
          : distinctVoidSpells(rt, ctx.controller);
      const frames: Task[] = [];
      for (const cardId of ids) {
        const abilities = def(rt, cardId).abilities.filter((a) => a.kind === 'onResolve');
        const specs = slotSpecs(rt, ctx.controller, ctx.sourceId, abilities);
        if (!allSlotsHaveOptions(specs)) continue;
        if (e.targets === 'choose' && specs.some((sp) => sp.options.length > sp.count)) {
          s.pending = {
            kind: 'chooseTargets',
            player: ctx.controller,
            slots: specs,
            then: { kind: 'copy', cardId, controller: ctx.controller, sourceId: ctx.sourceId },
          };
          return;
        }
        const targets: InstanceId[][] = [];
        for (const sp of specs) {
          const n = Math.min(sp.count, sp.options.length);
          targets[sp.slot] =
            e.targets === 'random' ? sample(s.rng, sp.options, n) : sp.options.slice(0, n);
        }
        frames.push(copyFrameTask(rt, cardId, ctx.controller, ctx.sourceId, targets));
      }
      for (let i = frames.length - 1; i >= 0; i--) s.tasks.push(frames[i] as Task);
      return;
    }
    case 'redirect': {
      const link = s.chain.find((l) => l.id === ctx.triggerLinkId);
      if (!link || link.kind !== 'spell' || link.negated) return;
      const abilities = link.abilities
        .map((i) => def(rt, link.cardId).abilities[i])
        .filter((a): a is Ability => !!a);
      const spec = slotSpecs(rt, link.controller, link.sourceId, abilities).find(
        (sp) => sp.slot === 0,
      );
      const options = (spec?.options ?? []).filter(
        (id) => rt.s.cards[id]?.zone === 'units' && rt.s.cards[id]?.controller === link.controller,
      );
      if (options.length === 0) {
        link.negated = true;
        emit(rt, { type: 'negated', linkId: link.id, byId: ctx.sourceId });
        return;
      }
      const to = options[nextInt(s.rng, options.length)] as InstanceId;
      link.targets[0] = [to];
      emit(rt, { type: 'redirected', linkId: link.id, to });
      return;
    }
    case 'revealHand': {
      const p = playerOf(ctx, e.player);
      player(rt, p).revealedHandTurn = s.turn;
      emit(rt, { type: 'handRevealed', player: p });
      return;
    }
    case 'resetSelf': {
      const c = maybeInst(rt, ctx.sourceId);
      const key = `reset:${ctx.sourceCardId}`;
      const ps = player(rt, ctx.controller);
      if (!c || c.zone !== 'chain' || ps.once[key]) return;
      c.reset = true;
      return;
    }
    case 'atEndOfTurn':
      s.delayed.push({
        turn: s.turn,
        trigger: {
          controller: ctx.controller,
          sourceId: ctx.sourceId,
          cardId: ctx.sourceCardId,
          ability: -1,
          effects: e.effects,
          ctx: clone(ctx),
        },
      });
      return;
    case 'conditional': {
      const branch = evalCondition(rt, ctx, e.if) ? e.then : (e.else ?? []);
      if (branch.length > 0) s.tasks.push(frameTask(branch, ctx));
      return;
    }
  }
}

function cardRefs(refs: Ref[]): InstanceId[] {
  return refs.flatMap((r) => ('card' in r ? [r.card] : []));
}

function toDamageTarget(r: Ref): DamageTarget {
  return 'card' in r ? { card: r.card } : { player: r.player };
}

/** The effect's source if it is still a unit on the field (for Lifebind / Veiled / kill credit). */
function liveSource(rt: Rt, ctx: EffectCtx): InstanceId | null {
  const c = rt.s.cards[ctx.sourceId];
  return c && c.zone === 'units' ? c.id : null;
}

function emitStats(rt: Rt, id: InstanceId): void {
  const c = maybeInst(rt, id);
  if (!c || c.faceDown) return; // a face-down unit's real stats are hidden information
  const st = computeStats(rt, c);
  emit(rt, { type: 'statsChanged', id, power: st.power, guard: st.guard });
}

/** Ability effects plus its Resonance bonus if live now (checked on resolution, §3.3). */
export function effectsAtResolution(rt: Rt, a: Ability, controller: PlayerId): Effect[] {
  if (a.kind === 'static') return [];
  const base = a.effects;
  if ('resonance' in a && a.resonance && player(rt, controller).resonance >= a.resonance.n) {
    return [...base, ...a.resonance.effects];
  }
  return base;
}

/** A frame that resolves a copy of a spell's effects with the given targets. */
export function copyFrameTask(
  rt: Rt,
  cardId: string,
  controller: PlayerId,
  sourceId: InstanceId,
  targets: InstanceId[][],
): Task {
  const abilities = def(rt, cardId).abilities.filter((a) => a.kind === 'onResolve');
  const warded = wardFilter(rt, controller, targets);
  const hadTargets = targets.some((t) => t.length > 0);
  const ctx: EffectCtx = {
    controller,
    sourceId,
    sourceCardId: cardId,
    targets: Array.from({ length: warded.length }, (_, i) => warded[i] ?? []),
    summoned: [],
  };
  // every chosen target was warded away: the copy does nothing (like a fizzle)
  if (hadTargets && warded.every((t) => t.length === 0)) return frameTask([], ctx);
  return frameTask(
    abilities.flatMap((a) => effectsAtResolution(rt, a, controller)),
    ctx,
  );
}

/** Each different Spell in a player's Void, in the order first seen. */
function distinctVoidSpells(rt: Rt, p: PlayerId): string[] {
  const seen: string[] = [];
  for (const id of player(rt, p).void) {
    const c = rt.s.cards[id];
    if (c && def(rt, c.baseCardId).type === 'spell' && !seen.includes(c.baseCardId)) {
      seen.push(c.baseCardId);
    }
  }
  return seen;
}
