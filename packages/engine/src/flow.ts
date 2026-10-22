// The task loop, the Chain (links, response windows, priority, resolution) and turn structure.
// Rules: 01_GAME_DESIGN.md §3.4 and §3.6.

import type { Ability, EffectCtx, InstanceId, Link, PlayerId, QueuedTrigger, Task } from './types';
import {
  def,
  defOf,
  drawCards,
  emit,
  emitAether,
  inst,
  livePermanents,
  maybeInst,
  moveCard,
  player,
  unitIds,
  type Rt,
} from './rt';
import { resolveAttack, stateBasedChecks, endGame } from './combat';
import { frameTask, stepFrame } from './effects';
import { queueTrigger, takeNextTrigger, type TrigEvent, anyMatches } from './triggers';
import { revalidate, slotSpecs } from './targeting';
import { computeStats, hasKeyword } from './stats';
import { EngineCapError, RulesError, other } from './util';

const MAX_STEPS = 200_000;

/** Runs queued tasks until the game needs a decision (prompt, window, main phase) or ends. */
export function advance(rt: Rt): void {
  const s = rt.s;
  for (let steps = 0; steps < MAX_STEPS; steps++) {
    if (s.winner !== null || s.pending) return;
    const task = s.tasks.pop();
    if (!task) return;
    runTask(rt, task);
  }
  throw new EngineCapError('advance(): step limit exceeded (possible infinite loop)');
}

function runTask(rt: Rt, task: Task): void {
  const s = rt.s;
  switch (task.t) {
    case 'frame':
      if (task.i < task.effects.length) {
        s.tasks.push({ ...task, i: task.i + 1 });
        stepFrame(rt, task.effects, task.i, task.ctx);
      }
      return;
    case 'drain': {
      if (stateBasedChecks(rt)) return;
      const trig = takeNextTrigger(rt);
      if (!trig) return;
      s.tasks.push({ t: 'drain' });
      startTrigger(rt, trig);
      return;
    }
    case 'openWindow':
      openWindowOnTop(rt);
      return;
    case 'resolveTop':
      resolveTop(rt);
      return;
    case 'afterResolve':
      afterResolve(rt, task.link);
      return;
    case 'flipLink':
      flipLinkFor(rt, task.unitId);
      return;
    case 'duelStart':
      for (const p of [s.first, other(s.first)]) queueTimed(rt, p, 'duelStart');
      return;
    case 'startTurn':
      startTurn(rt, task.player);
      return;
    case 'dawnDraw':
      if (!(s.turn === 1 && s.active === s.first)) drawCards(rt, s.active, 1);
      return;
    case 'queueTimed':
      queueTimed(rt, s.active, task.kind);
      if (task.kind === 'endOfTurn') {
        const due = s.delayed.filter((d) => d.turn === s.turn);
        s.delayed = s.delayed.filter((d) => d.turn !== s.turn);
        for (const d of due) queueTrigger(rt, d.trigger);
      }
      return;
    case 'dusk':
      dusk(rt);
      return;
    case 'enterMain':
      s.phase = 'main';
      return;
  }
}

// --- Links & windows -------------------------------------------------------------------------

export function addLink(rt: Rt, link: Omit<Link, 'id' | 'negated'>): Link {
  const s = rt.s;
  if (s.chain.length >= s.rules.chainCap) {
    throw new EngineCapError(`Chain depth cap (${s.rules.chainCap}) hit`);
  }
  const full: Link = { ...link, id: `L${s.nextLinkId++}`, negated: false };
  s.chain.push(full);
  emit(rt, {
    type: 'chainLinkAdded',
    linkId: full.id,
    index: s.chain.length,
    kind: full.kind,
    player: full.controller,
    sourceId: full.sourceId,
    cardId: full.cardId,
    targets: full.targets.flat(),
  });
  return full;
}

/** After a link is added: priority goes to the player who did NOT create the newest link. */
function openWindowOnTop(rt: Rt): void {
  const top = rt.s.chain[rt.s.chain.length - 1];
  if (!top) return;
  rt.s.window = { priority: other(top.controller), passes: 0 };
  emit(rt, {
    type: 'responseWindowOpened',
    priority: rt.s.window.priority,
    chainLength: rt.s.chain.length,
  });
}

function linkAbilities(rt: Rt, link: Link): Ability[] {
  const abilities = def(rt, link.cardId).abilities;
  return link.abilities.map((i) => abilities[i]).filter((a): a is Ability => !!a);
}

/** Both players passed in a row: the top link resolves (LIFO). */
function resolveTop(rt: Rt): void {
  const s = rt.s;
  const index = s.chain.length;
  const link = s.chain.pop();
  if (!link) return;
  s.window = null;
  emit(rt, { type: 'chainLinkResolving', linkId: link.id, index });
  s.tasks.push({ t: 'afterResolve', link }, { t: 'drain' });
  if (link.negated) return;

  if (link.kind === 'attack') {
    if (!resolveAttack(rt, link)) emit(rt, { type: 'fizzled', linkId: link.id });
    return;
  }

  const abilities = linkAbilities(rt, link);
  if (abilities.length === 0) return;
  const check = revalidate(rt, link.controller, link.sourceId, abilities, link.targets);
  if (check.fizzles) {
    emit(rt, { type: 'fizzled', linkId: link.id });
    return;
  }
  const targets = applyWard(rt, link, check.targets);
  if (link.targets.some((t) => t.length > 0) && targets.every((t) => t.length === 0)) {
    emit(rt, { type: 'fizzled', linkId: link.id });
    return;
  }

  const ctx: EffectCtx = {
    controller: link.controller,
    sourceId: link.sourceId,
    sourceCardId: link.cardId,
    targets,
    summoned: [],
  };
  if (link.triggerLinkId) {
    ctx.triggerLinkId = link.triggerLinkId;
    const trigger = s.chain.find((l) => l.id === link.triggerLinkId);
    if (trigger) {
      ctx.eventSourceId = trigger.event.sourceId;
      if (trigger.event.targetId !== undefined) {
        ctx.eventTargetId = trigger.event.targetId;
        if (trigger.event.targetId === 'face') ctx.eventTargetPlayer = other(trigger.event.player);
      }
    }
  }
  const effects = abilities.flatMap((a) => effectsAtResolution(rt, a, link.controller));
  if (effects.length > 0) s.tasks.push(frameTask(effects, ctx));
}

/** Ward: the first enemy effect that targets this each turn is negated (for that unit). */
function applyWard(rt: Rt, link: Link, targets: InstanceId[][]): InstanceId[][] {
  return targets.map((ids) =>
    ids.filter((id) => {
      const c = inst(rt, id);
      if (c.controller === link.controller || c.zone !== 'units') return true;
      if (!hasKeyword(rt, c, 'ward') || c.wardTurn === rt.s.turn) return true;
      c.wardTurn = rt.s.turn;
      emit(rt, { type: 'statusApplied', id, status: 'warded' });
      return false;
    }),
  );
}

/** Ability effects plus its Resonance bonus if live now (checked on resolution, §3.3). */
export function effectsAtResolution(rt: Rt, a: Ability, controller: PlayerId) {
  if (a.kind === 'static') return [];
  const base = a.effects;
  if ('resonance' in a && a.resonance && player(rt, controller).resonance >= a.resonance.n) {
    return [...base, ...a.resonance.effects];
  }
  return base;
}

function afterResolve(rt: Rt, link: Link): void {
  const s = rt.s;
  if (link.kind === 'spell' || link.kind === 'trap') {
    const c = maybeInst(rt, link.sourceId);
    if (c && c.zone === 'chain') moveCard(rt, c.id, 'void');
  }
  emit(rt, { type: 'chainLinkResolved', linkId: link.id });
  if (s.winner !== null) return;
  if (s.chain.length > 0) {
    // the window reopens on the remaining chain, starting with the non-owner of the new top link
    openWindowOnTop(rt);
  } else {
    s.window = null;
  }
}

/** Converts a chain link's event into the shape Trap triggers are matched against. */
export function linkTrigEvent(link: Link): TrigEvent | null {
  const e = link.event;
  if (e.type === 'played' || e.type === 'flipped' || e.type === 'abilityActivated') return null;
  const ev: TrigEvent = {
    type: e.type,
    player: e.player,
    sourceId: e.sourceId,
    sourceCardId: e.sourceCardId,
  };
  if (e.targetId !== undefined) ev.targetId = e.targetId;
  if (e.swift !== undefined) ev.swift = e.swift;
  return ev;
}

/** The most recent unresolved link a set Trap can respond to, if any (DECISIONS #21). */
export function trapMatch(rt: Rt, trapId: InstanceId): { link: Link; ability: number } | null {
  const trap = inst(rt, trapId);
  const abilities = defOf(rt, trap).abilities;
  const idx = abilities.findIndex((a) => a.kind === 'trigger');
  const a = abilities[idx];
  if (!a || a.kind !== 'trigger') return null;
  for (let i = rt.s.chain.length - 1; i >= 0; i--) {
    const link = rt.s.chain[i] as Link;
    const ev = linkTrigEvent(link);
    if (ev && anyMatches(rt, a.event, ev, trap.controller, trap.id)) return { link, ability: idx };
  }
  return null;
}

// --- Passive triggers -----------------------------------------------------------------------

function startTrigger(rt: Rt, trig: QueuedTrigger): void {
  if (trig.ability < 0) {
    if (trig.effects && trig.ctx) rt.s.tasks.push(frameTask(trig.effects, trig.ctx));
    return;
  }
  const a = def(rt, trig.cardId).abilities[trig.ability];
  if (!a || a.kind === 'static') return;
  if ('optional' in a && a.optional) {
    rt.s.pending = { kind: 'chooseOptional', player: trig.controller, trigger: trig };
    return;
  }
  chooseTriggerTargets(rt, trig);
}

/** Prompts for a trigger's targets if there is a real choice; otherwise resolves it. */
export function chooseTriggerTargets(rt: Rt, trig: QueuedTrigger): void {
  const a = def(rt, trig.cardId).abilities[trig.ability];
  if (!a) return;
  const specs = slotSpecs(rt, trig.controller, trig.sourceId, [a]);
  if (specs.some((sp) => sp.options.length > sp.count)) {
    rt.s.pending = {
      kind: 'chooseTargets',
      player: trig.controller,
      slots: specs,
      then: { kind: 'trigger', trigger: trig },
    };
    return;
  }
  const targets: InstanceId[][] = [];
  for (const sp of specs) targets[sp.slot] = sp.options.slice(0, sp.count);
  pushTriggerFrame(rt, trig, fillHoles(targets));
}

export function fillHoles(targets: InstanceId[][]): InstanceId[][] {
  return Array.from({ length: targets.length }, (_, i) => targets[i] ?? []);
}

export function pushTriggerFrame(rt: Rt, trig: QueuedTrigger, targets: InstanceId[][]): void {
  const a = def(rt, trig.cardId).abilities[trig.ability];
  if (!a) return;
  const ctx: EffectCtx = {
    controller: trig.controller,
    sourceId: trig.sourceId,
    sourceCardId: trig.cardId,
    targets,
    summoned: [],
  };
  if (trig.eventSourceId !== undefined) ctx.eventSourceId = trig.eventSourceId;
  if (trig.eventTargetId !== undefined) ctx.eventTargetId = trig.eventTargetId;
  const effects = effectsAtResolution(rt, a, trig.controller);
  if (effects.length > 0) rt.s.tasks.push(frameTask(effects, ctx));
}

function queueTimed(rt: Rt, p: PlayerId, kind: 'startOfTurn' | 'endOfTurn' | 'duelStart'): void {
  for (const c of livePermanents(rt, p)) {
    defOf(rt, c).abilities.forEach((a, idx) => {
      if (a.kind === kind)
        queueTrigger(rt, { controller: p, sourceId: c.id, cardId: c.cardId, ability: idx });
    });
  }
}

// --- Ambush flips ----------------------------------------------------------------------------

export function flipAbilities(rt: Rt, unitId: InstanceId): number[] {
  const out: number[] = [];
  defOf(rt, inst(rt, unitId)).abilities.forEach((a, i) => {
    if (a.kind === 'onFlip') out.push(i);
  });
  return out;
}

/** An attacked Ambush unit's Flip effect becomes a link owned by the defender (DECISIONS #26). */
function flipLinkFor(rt: Rt, unitId: InstanceId): void {
  const u = maybeInst(rt, unitId);
  if (!u || u.zone !== 'units') return;
  const idxs = flipAbilities(rt, unitId);
  if (idxs.length === 0) return;
  const abilities = idxs.map((i) => defOf(rt, u).abilities[i] as Ability);
  const specs = slotSpecs(rt, u.controller, u.id, abilities);
  if (specs.some((sp) => sp.options.length > sp.count)) {
    rt.s.pending = {
      kind: 'chooseTargets',
      player: u.controller,
      slots: specs,
      then: { kind: 'flip', unitId },
    };
    return;
  }
  const targets: InstanceId[][] = [];
  for (const sp of specs) targets[sp.slot] = sp.options.slice(0, sp.count);
  addFlipLink(rt, unitId, fillHoles(targets));
}

export function addFlipLink(rt: Rt, unitId: InstanceId, targets: InstanceId[][]): void {
  const u = inst(rt, unitId);
  addLink(rt, {
    kind: 'flip',
    controller: u.controller,
    sourceId: u.id,
    cardId: u.cardId,
    abilities: flipAbilities(rt, unitId),
    targets,
    event: { type: 'flipped', player: u.controller, sourceId: u.id, sourceCardId: u.cardId },
  });
}

// --- Turn structure ---------------------------------------------------------------------------

function startTurn(rt: Rt, p: PlayerId): void {
  const s = rt.s;
  s.turn += 1;
  if (s.turn > s.rules.maxTurns) {
    endGame(rt, 'draw');
    return;
  }
  s.active = p;
  emit(rt, { type: 'turnStarted', turn: s.turn, player: p });
  // Dawn: reset Resonance → max Aether +1 → refill (held Aether is lost) → draw → start-of-turn effects
  for (const q of [0, 1] as const) {
    if (player(rt, q).resonance !== 0) {
      player(rt, q).resonance = 0;
      emit(rt, { type: 'resonanceChanged', player: q, value: 0 });
    }
  }
  const ps = player(rt, p);
  ps.maxAether = Math.min(s.rules.maxAether, ps.maxAether + 1);
  ps.aether = ps.maxAether;
  emitAether(rt, p);
  // Corrode: each stack costs 1 Power at the start of its controller's turn
  for (const id of unitIds(rt, p)) {
    const c = inst(rt, id);
    if (c.corrode > 0 && !c.faceDown) {
      c.buffs.push({ power: -c.corrode, guard: 0, duration: 'permanent' });
      const st = computeStats(rt, c);
      emit(rt, { type: 'statsChanged', id, power: st.power, guard: st.guard });
    }
  }
  s.tasks.push(
    { t: 'enterMain' },
    { t: 'drain' },
    { t: 'queueTimed', kind: 'startOfTurn' },
    { t: 'drain' },
    { t: 'dawnDraw' },
  );
}

/** Dusk cleanup: temporary buffs, grants, Guard and Aether expire. */
function dusk(rt: Rt): void {
  const s = rt.s;
  for (const p of [0, 1] as const) {
    for (const id of unitIds(rt, p)) {
      const c = inst(rt, id);
      const before = computeStats(rt, c);
      c.buffs = c.buffs.filter((b) => b.duration === 'permanent');
      c.granted = c.granted.filter((g) => g.duration === 'permanent');
      c.tempGuard = 0;
      const after = computeStats(rt, c);
      if (after.power !== before.power || after.maxGuard !== before.maxGuard) {
        emit(rt, { type: 'statsChanged', id, power: after.power, guard: after.guard });
      }
    }
    const ps = player(rt, p);
    if (ps.tempAether !== 0) {
      ps.tempAether = 0;
      emitAether(rt, p);
    }
  }
  s.tasks.push({ t: 'startTurn', player: other(s.active) }, { t: 'drain' });
}

export function scheduleEndTurn(rt: Rt): void {
  rt.s.tasks.push({ t: 'dusk' }, { t: 'drain' }, { t: 'queueTimed', kind: 'endOfTurn' });
}

export function scheduleAfterAction(rt: Rt): void {
  rt.s.tasks.push({ t: 'openWindow' }, { t: 'drain' });
}

export function assertMain(rt: Rt, p: PlayerId): void {
  const s = rt.s;
  if (s.phase !== 'main' || s.active !== p || s.window || s.chain.length > 0 || s.pending) {
    throw new RulesError('Not your main phase');
  }
}
