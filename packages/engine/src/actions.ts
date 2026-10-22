// legalActions() enumerates every legal decision; performAction() applies one.
// The client and the AI only ever choose from legalActions(), so illegal moves can't be made.

import type { Ability, Action, CardDef, CardInstance, InstanceId, PlayerId } from './types';
import {
  addResonance,
  available,
  backrowIds,
  defOf,
  drawCards,
  emit,
  freeBackrowSlot,
  freeUnitSlot,
  inst,
  isUnitDef,
  livePermanents,
  moveCard,
  newInstance,
  pay,
  player,
  unitIds,
  type Rt,
} from './rt';
import {
  cantAttack,
  effectiveCost,
  hasKeyword,
  initEnterStatuses,
  isStunned,
  matchesFilter,
} from './stats';
import { allSlotsHaveOptions, slotSpecs, targetCombos } from './targeting';
import {
  addFlipLink,
  addLink,
  chooseTriggerTargets,
  flipAbilities,
  pushTriggerFrame,
  scheduleAfterAction,
  scheduleEndTurn,
  trapMatch,
} from './flow';
import { fire } from './triggers';
import { endGame, killUnit } from './combat';
import { shuffle } from './rng';
import { combinations, other, permutations, product, RulesError } from './util';

// ---------------------------------------------------------------------------------------------
// Enumeration
// ---------------------------------------------------------------------------------------------

export function legalActions(rt: Rt, p: PlayerId): Action[] {
  const s = rt.s;
  if (s.winner !== null) return [];
  if (s.pending) return s.pending.player === p ? pendingAnswers(rt, p) : [];
  if (s.tasks.length > 0) return [];
  if (s.window) {
    if (s.window.priority !== p) return [];
    return [{ type: 'pass', player: p }, ...fastActions(rt, p)];
  }
  if (s.phase !== 'main' || s.active !== p || s.chain.length > 0) return [];
  return [...mainActions(rt, p), { type: 'endTurn', player: p }];
}

function pendingAnswers(rt: Rt, p: PlayerId): Action[] {
  const pend = rt.s.pending;
  if (!pend) return [];
  switch (pend.kind) {
    case 'mulligan': {
      const hand = player(rt, p).hand;
      const out: Action[] = [];
      for (let k = 0; k <= hand.length; k++) {
        for (const cards of combinations(hand, k)) out.push({ type: 'mulligan', player: p, cards });
      }
      return out;
    }
    case 'chooseTargets':
      return targetCombos(pend.slots).map((targets) => ({
        type: 'chooseTargets',
        player: p,
        targets,
      }));
    case 'chooseOptional':
      return [
        { type: 'chooseOptional', player: p, accept: true },
        { type: 'chooseOptional', player: p, accept: false },
      ];
    case 'scry': {
      const out: Action[] = [];
      const n = pend.cards.length;
      for (let k = 0; k <= n; k++) {
        for (const bottomSet of combinations(pend.cards, k)) {
          const topSet = pend.cards.filter((c) => !bottomSet.includes(c));
          for (const top of permutations(topSet)) {
            for (const bottom of permutations(bottomSet))
              out.push({ type: 'scry', player: p, top, bottom });
          }
        }
      }
      return out;
    }
    case 'chooseCards':
      return combinations(pend.from, pend.count).map((cards) => ({
        type: 'chooseCards',
        player: p,
        cards,
      }));
  }
}

/** Ability indices of a given kind. */
function idxOf(d: CardDef, kind: Ability['kind']): number[] {
  const out: number[] = [];
  d.abilities.forEach((a, i) => {
    if (a.kind === kind) out.push(i);
  });
  return out;
}

function abilitiesAt(d: CardDef, idxs: number[]): Ability[] {
  return idxs.map((i) => d.abilities[i] as Ability);
}

/** Variants of a unit play: overclock on/off × optional abilities declined or not × targets. */
function unitPlayVariants(
  rt: Rt,
  p: PlayerId,
  c: CardInstance,
  budget: number,
  base: Omit<Extract<Action, { type: 'play' }>, 'targets'>,
): Action[] {
  const d = defOf(rt, c);
  const out: Action[] = [];
  const summonIdx = idxOf(d, 'onSummon');
  const ocCost = d.params?.overclock;
  const ocOptions = ocCost !== undefined && budget >= ocCost ? [false, true] : [false];
  for (const overclock of ocOptions) {
    const active = summonIdx.filter((i) => {
      const a = d.abilities[i] as Ability;
      return !('overclock' in a && a.overclock) || overclock;
    });
    const optional = active.filter((i) => {
      const a = d.abilities[i] as Ability;
      return 'optional' in a && !!a.optional;
    });
    // each optional ability may be declined; one whose targets have no options must be declined
    const declineChoices = product(
      optional.map((i) => {
        const specs = slotSpecs(rt, p, c.id, [d.abilities[i] as Ability]);
        return allSlotsHaveOptions(specs) ? [false, true] : [true];
      }),
    );
    for (const choice of declineChoices) {
      const declined = optional.filter((_, k) => choice[k]);
      const used = active.filter((i) => !declined.includes(i));
      const specs = slotSpecs(rt, p, c.id, abilitiesAt(d, used));
      for (const targets of targetCombos(specs)) {
        const a: Extract<Action, { type: 'play' }> = { ...base, targets };
        if (declined.length > 0) a.declined = declined;
        if (overclock) a.overclock = true;
        out.push(a);
      }
    }
  }
  return out;
}

function spellVariants(rt: Rt, p: PlayerId, c: CardInstance, echo: boolean): Action[] {
  const d = defOf(rt, c);
  const specs = slotSpecs(rt, p, c.id, abilitiesAt(d, idxOf(d, 'onResolve')));
  if (!allSlotsHaveOptions(specs)) return []; // a spell needs a legal target (DECISIONS #25)
  return targetCombos(specs).map((targets) => {
    const a: Extract<Action, { type: 'play' }> = { type: 'play', player: p, card: c.id, targets };
    if (echo) a.echo = true;
    return a;
  });
}

function mainActions(rt: Rt, p: PlayerId): Action[] {
  const ps = player(rt, p);
  const out: Action[] = [];
  const budget = available(rt, p);
  const unitSlot = freeUnitSlot(rt, p) >= 0;
  const backSlot = freeBackrowSlot(rt, p) >= 0;

  for (const id of ps.hand) {
    const c = inst(rt, id);
    const d = defOf(rt, c);
    const cost = effectiveCost(rt, p, d, 'play');
    if (isUnitDef(d)) {
      if (!unitSlot) continue;
      if (budget >= cost) {
        out.push(
          ...unitPlayVariants(rt, p, c, budget - cost, { type: 'play', player: p, card: id }),
        );
      }
      if (d.ascend) {
        const victims = unitIds(rt, p).filter((u) =>
          matchesFilter(rt, inst(rt, u), d.ascend?.filter, id),
        );
        for (const ascend of combinations(victims, d.ascend.destroy)) {
          out.push(
            ...unitPlayVariants(rt, p, c, budget, { type: 'play', player: p, card: id, ascend }),
          );
        }
      }
      if (d.params?.ambush && budget >= 1) out.push({ type: 'setAmbush', player: p, card: id });
    } else if (d.type === 'spell') {
      if (budget >= cost) out.push(...spellVariants(rt, p, c, false));
    } else if (d.type === 'trap') {
      if (backSlot) out.push({ type: 'setTrap', player: p, card: id });
    } else if (d.type === 'relic') {
      if (backSlot && budget >= cost) out.push({ type: 'play', player: p, card: id, targets: [] });
    } else if (d.type === 'rift') {
      if (budget >= cost) out.push({ type: 'play', player: p, card: id, targets: [] });
    }
  }

  // Echo: cast from the Void
  for (const id of ps.void) {
    const c = inst(rt, id);
    const d = defOf(rt, c);
    const echo = d.params?.echo;
    if (echo === undefined || budget < echo) continue;
    if (isUnitDef(d) && unitSlot) {
      out.push(
        ...unitPlayVariants(rt, p, c, budget - echo, {
          type: 'play',
          player: p,
          card: id,
          echo: true,
        }),
      );
    } else if (d.type === 'spell') {
      out.push(...spellVariants(rt, p, c, true));
    }
  }

  // Attacks
  for (const id of unitIds(rt, p)) {
    const c = inst(rt, id);
    if (!canAttack(rt, c)) continue;
    for (const target of attackTargets(rt, p))
      out.push({ type: 'attack', player: p, attacker: id, target });
  }

  // Voluntary Ambush flips (cost − 1, on a later turn: DECISIONS #17, #23)
  for (const id of unitIds(rt, p)) {
    const c = inst(rt, id);
    if (!c.faceDown || rt.s.turn <= c.setTurn) continue;
    if (budget < flipCost(rt, c)) continue;
    const abilities = abilitiesAt(defOf(rt, c), flipAbilities(rt, id));
    for (const targets of targetCombos(slotSpecs(rt, p, id, abilities))) {
      out.push({ type: 'flip', player: p, unit: id, targets });
    }
  }

  out.push(...activatedActions(rt, p, false));
  return out;
}

function fastActions(rt: Rt, p: PlayerId): Action[] {
  const out: Action[] = [];
  const budget = available(rt, p);
  for (const id of player(rt, p).hand) {
    const c = inst(rt, id);
    const d = defOf(rt, c);
    if (d.type !== 'spell' || !(d.keywords ?? []).includes('swift')) continue;
    if (budget >= effectiveCost(rt, p, d, 'play')) out.push(...spellVariants(rt, p, c, false));
  }
  for (const id of backrowIds(rt, p)) {
    const c = inst(rt, id);
    const d = defOf(rt, c);
    if (!c.faceDown || d.type !== 'trap' || rt.s.turn <= c.setTurn) continue;
    if (budget < effectiveCost(rt, p, d, 'activate')) continue;
    const m = trapMatch(rt, id);
    if (!m) continue;
    const specs = slotSpecs(rt, p, id, [d.abilities[m.ability] as Ability]);
    for (const targets of targetCombos(specs))
      out.push({ type: 'activateTrap', player: p, card: id, targets });
  }
  out.push(...activatedActions(rt, p, true));
  return out;
}

function activatedActions(rt: Rt, p: PlayerId, quickOnly: boolean): Action[] {
  const out: Action[] = [];
  const budget = available(rt, p);
  for (const c of livePermanents(rt, p)) {
    if (c.zone === 'units' && isStunned(rt, c)) continue;
    defOf(rt, c).abilities.forEach((a, ability) => {
      if (a.kind !== 'activated') return;
      if (quickOnly && !a.quick) return;
      if (a.oncePerTurn && c.usedTurn[ability] === rt.s.turn) return;
      if (budget < a.cost) return;
      for (const targets of targetCombos(slotSpecs(rt, p, c.id, [a]))) {
        out.push({ type: 'activate', player: p, card: c.id, ability, targets });
      }
    });
  }
  return out;
}

export function canAttack(rt: Rt, c: CardInstance): boolean {
  if (c.zone !== 'units' || c.faceDown) return false;
  if (c.attackedTurn === rt.s.turn) return false;
  if (c.arrivedTurn >= rt.s.turn && !hasKeyword(rt, c, 'blitz')) return false;
  if (isStunned(rt, c) || cantAttack(rt, c)) return false;
  return true;
}

/** Legal attack targets for `p`: Guardians first, never Veiled units (01_GAME_DESIGN §3.5). */
export function attackTargets(rt: Rt, p: PlayerId): (InstanceId | 'face')[] {
  const enemies = unitIds(rt, other(p)).filter((id) => !inst(rt, id).veiled);
  const guardians = enemies.filter((id) => {
    const c = inst(rt, id);
    return !c.faceDown && hasKeyword(rt, c, 'guardian');
  });
  if (guardians.length > 0) return guardians;
  return [...enemies, 'face'];
}

function flipCost(rt: Rt, c: CardInstance): number {
  return Math.max(0, defOf(rt, c).cost - 1);
}

// ---------------------------------------------------------------------------------------------
// Performing actions (the action is already known to be legal)
// ---------------------------------------------------------------------------------------------

export function performAction(rt: Rt, a: Action): void {
  const s = rt.s;
  switch (a.type) {
    case 'mulligan':
      return doMulligan(rt, a.player, a.cards);
    case 'play':
      return doPlay(rt, a);
    case 'setTrap': {
      const c = moveCard(rt, a.card, 'backrow', { controller: a.player });
      if (!c) return;
      c.faceDown = true;
      c.setTurn = s.turn;
      emit(rt, { type: 'trapSet', player: a.player, id: c.id, cardId: c.cardId });
      return;
    }
    case 'setAmbush': {
      pay(rt, a.player, 1);
      const slot = freeUnitSlot(rt, a.player);
      const c = moveCard(rt, a.card, 'units', { slot, controller: a.player });
      if (!c) return;
      c.faceDown = true;
      c.setTurn = s.turn;
      c.arrivedTurn = s.turn;
      emit(rt, { type: 'ambushSet', player: a.player, id: c.id, cardId: c.cardId, slot });
      return;
    }
    case 'flip': {
      const c = inst(rt, a.unit);
      pay(rt, a.player, flipCost(rt, c));
      c.faceDown = false;
      initEnterStatuses(rt, c);
      emit(rt, { type: 'flipped', player: a.player, id: c.id, cardId: c.cardId });
      if (flipAbilities(rt, c.id).length > 0) addFlipLink(rt, c.id, a.targets);
      scheduleAfterAction(rt);
      return;
    }
    case 'attack':
      return doAttack(rt, a.player, a.attacker, a.target);
    case 'activateTrap':
      return doActivateTrap(rt, a.player, a.card, a.targets);
    case 'activate': {
      const c = inst(rt, a.card);
      const ab = defOf(rt, c).abilities[a.ability];
      if (!ab || ab.kind !== 'activated') throw new RulesError('Not an activated ability');
      pay(rt, a.player, ab.cost);
      c.usedTurn[a.ability] = s.turn;
      addResonance(rt, a.player);
      addLink(rt, {
        kind: 'ability',
        controller: a.player,
        sourceId: c.id,
        cardId: c.cardId,
        abilities: [a.ability],
        targets: a.targets,
        event: {
          type: 'abilityActivated',
          player: a.player,
          sourceId: c.id,
          sourceCardId: c.cardId,
        },
      });
      scheduleAfterAction(rt);
      return;
    }
    case 'pass': {
      const w = s.window;
      if (!w) throw new RulesError('No window open');
      emit(rt, { type: 'passed', player: a.player });
      w.passes += 1;
      if (w.passes >= 2) {
        s.window = null;
        s.tasks.push({ t: 'resolveTop' });
      } else {
        w.priority = other(w.priority);
      }
      return;
    }
    case 'endTurn':
      scheduleEndTurn(rt);
      return;
    case 'concede':
      endGame(rt, other(a.player));
      return;
    case 'chooseTargets': {
      const pend = s.pending;
      if (pend?.kind !== 'chooseTargets') throw new RulesError('No target prompt');
      s.pending = null;
      if (pend.then.kind === 'trigger') pushTriggerFrame(rt, pend.then.trigger, a.targets);
      else addFlipLink(rt, pend.then.unitId, a.targets);
      return;
    }
    case 'chooseOptional': {
      const pend = s.pending;
      if (pend?.kind !== 'chooseOptional') throw new RulesError('No optional prompt');
      s.pending = null;
      if (a.accept) chooseTriggerTargets(rt, pend.trigger);
      return;
    }
    case 'scry': {
      const pend = s.pending;
      if (pend?.kind !== 'scry') throw new RulesError('No scry prompt');
      s.pending = null;
      const ps = player(rt, a.player);
      const rest = ps.deck.slice(pend.cards.length);
      ps.deck = [...a.top, ...rest, ...a.bottom];
      emit(rt, { type: 'scried', player: a.player, top: a.top.length, bottom: a.bottom.length });
      return;
    }
    case 'chooseCards': {
      const pend = s.pending;
      if (pend?.kind !== 'chooseCards') throw new RulesError('No card prompt');
      s.pending = null;
      for (const id of a.cards) {
        const cardId = inst(rt, id).cardId;
        moveCard(rt, id, 'deck', { position: 'top' });
        emit(rt, { type: 'cardToDeck', player: a.player, cardId, position: 'top' });
      }
      return;
    }
  }
}

function doMulligan(rt: Rt, p: PlayerId, cards: InstanceId[]): void {
  const s = rt.s;
  const ps = player(rt, p);
  for (const id of cards) moveCard(rt, id, 'deck');
  shuffle(s.rng, ps.deck);
  drawCards(rt, p, cards.length);
  ps.mulliganed = true;
  emit(rt, { type: 'mulliganed', player: p, count: cards.length });
  const second = other(s.first);
  if (!player(rt, second).mulliganed) {
    s.pending = { kind: 'mulligan', player: second };
    return;
  }
  // Setup: the second player gets Rift Spark, Sigils' duel-start effects fire, then turn 1.
  s.pending = null;
  s.phase = 'setup';
  const bonus = s.rules.secondPlayerCard;
  if (bonus) {
    const spark = newInstance(rt, bonus, second, 'hand');
    player(rt, second).hand.push(spark.id);
    emit(rt, { type: 'cardDrawn', player: second, id: spark.id, cardId: spark.cardId });
  }
  s.tasks.push({ t: 'startTurn', player: s.first }, { t: 'drain' }, { t: 'duelStart' });
}

function doPlay(rt: Rt, a: Extract<Action, { type: 'play' }>): void {
  const s = rt.s;
  const p = a.player;
  const from = inst(rt, a.card);
  const d = defOf(rt, from);

  // pay
  if (a.ascend) {
    for (const v of a.ascend) if (rt.s.cards[v]) killUnit(rt, v, 'effect', null);
  } else {
    const base = a.echo ? (d.params?.echo ?? 0) : effectiveCost(rt, p, d, 'play');
    pay(rt, p, base + (a.overclock ? (d.params?.overclock ?? 0) : 0));
  }
  addResonance(rt, p);

  if (isUnitDef(d)) {
    const slot = freeUnitSlot(rt, p);
    const c = moveCard(rt, a.card, 'units', { slot, controller: p });
    if (!c) return;
    c.arrivedTurn = s.turn;
    c.echoed = !!a.echo;
    initEnterStatuses(rt, c);
    emit(rt, {
      type: 'cardPlayed',
      player: p,
      id: c.id,
      fromId: a.card,
      cardId: c.cardId,
      ...(a.echo ? { echo: true } : {}),
    });
    emit(rt, { type: 'unitSummoned', player: p, id: c.id, cardId: c.cardId, slot, token: false });
    fire(rt, { type: 'unitSummoned', player: p, sourceId: c.id, sourceCardId: c.cardId });
    const abilities = idxOf(d, 'onSummon').filter((i) => {
      const ab = d.abilities[i] as Ability;
      if ('overclock' in ab && ab.overclock && !a.overclock) return false;
      return !(a.declined ?? []).includes(i);
    });
    // summoning itself can't be negated: the unit has landed; its summon effect is the link
    const link: Parameters<typeof addLink>[1] = {
      kind: 'summon',
      controller: p,
      sourceId: c.id,
      cardId: c.cardId,
      abilities,
      targets: remapSelf(a.targets, a.card, c.id),
      event: { type: 'unitSummoned', player: p, sourceId: c.id, sourceCardId: c.cardId },
    };
    if (a.overclock) link.overclocked = true;
    addLink(rt, link);
    scheduleAfterAction(rt);
    return;
  }

  if (d.type === 'spell') {
    const c = moveCard(rt, a.card, 'chain');
    if (!c) return;
    c.echoed = !!a.echo;
    const swift = (d.keywords ?? []).includes('swift');
    emit(rt, {
      type: 'cardPlayed',
      player: p,
      id: c.id,
      fromId: a.card,
      cardId: c.cardId,
      ...(a.echo ? { echo: true } : {}),
    });
    addLink(rt, {
      kind: 'spell',
      controller: p,
      sourceId: c.id,
      cardId: c.cardId,
      abilities: idxOf(d, 'onResolve'),
      targets: a.targets,
      event: { type: 'spellCast', player: p, sourceId: c.id, sourceCardId: c.cardId, swift },
    });
    fire(rt, { type: 'spellCast', player: p, sourceId: c.id, sourceCardId: c.cardId, swift });
    scheduleAfterAction(rt);
    return;
  }

  if (d.type === 'relic' || d.type === 'rift') {
    let c: CardInstance | null;
    if (d.type === 'relic') {
      c = moveCard(rt, a.card, 'backrow', { controller: p });
      if (c) c.charges = d.params?.charges ?? 0;
    } else {
      const old = player(rt, p).rift;
      if (old) moveCard(rt, old, 'void');
      c = moveCard(rt, a.card, 'rift', { controller: p });
      if (c) emit(rt, { type: 'riftChanged', player: p, id: c.id, cardId: c.cardId });
    }
    if (!c) return;
    emit(rt, { type: 'cardPlayed', player: p, id: c.id, fromId: a.card, cardId: c.cardId });
    addLink(rt, {
      kind: 'play',
      controller: p,
      sourceId: c.id,
      cardId: c.cardId,
      abilities: [],
      targets: [],
      event: { type: 'played', player: p, sourceId: c.id, sourceCardId: c.cardId },
    });
    scheduleAfterAction(rt);
    return;
  }
  throw new RulesError(`Can't play a ${d.type}`);
}

/** Targets were computed while the card was in hand; nothing in them can be the card itself. */
function remapSelf(targets: InstanceId[][], oldId: InstanceId, newId: InstanceId): InstanceId[][] {
  return targets.map((ids) => ids.map((id) => (id === oldId ? newId : id)));
}

function doAttack(rt: Rt, p: PlayerId, attackerId: InstanceId, target: InstanceId | 'face'): void {
  const s = rt.s;
  const att = inst(rt, attackerId);
  att.attackedTurn = s.turn;
  att.veiled = false; // Veiled ends when it attacks
  emit(rt, { type: 'attackDeclared', player: p, attackerId, target });
  addLink(rt, {
    kind: 'attack',
    controller: p,
    sourceId: attackerId,
    cardId: att.cardId,
    abilities: [],
    targets: [],
    event: {
      type: 'attackDeclared',
      player: p,
      sourceId: attackerId,
      sourceCardId: att.cardId,
      targetId: target,
    },
  });
  fire(rt, {
    type: 'attackDeclared',
    player: p,
    sourceId: attackerId,
    sourceCardId: att.cardId,
    targetId: target,
  });
  scheduleAfterAction(rt);
  // attacking a face-down Ambush unit flips it first; its Flip effect goes on the chain
  if (target !== 'face') {
    const t = inst(rt, target);
    if (t.faceDown) {
      t.faceDown = false;
      initEnterStatuses(rt, t);
      emit(rt, { type: 'flipped', player: t.controller, id: t.id, cardId: t.cardId });
      s.tasks.push({ t: 'flipLink', unitId: t.id });
    }
  }
}

function doActivateTrap(rt: Rt, p: PlayerId, trapId: InstanceId, targets: InstanceId[][]): void {
  const trap = inst(rt, trapId);
  const d = defOf(rt, trap);
  const m = trapMatch(rt, trapId);
  if (!m) throw new RulesError('Trap trigger does not match');
  pay(rt, p, effectiveCost(rt, p, d, 'activate'));
  addResonance(rt, p);
  const c = moveCard(rt, trapId, 'chain');
  if (!c) return;
  addLink(rt, {
    kind: 'trap',
    controller: p,
    sourceId: c.id,
    cardId: c.cardId,
    abilities: [m.ability],
    targets,
    event: { type: 'trapActivated', player: p, sourceId: c.id, sourceCardId: c.cardId },
    triggerLinkId: m.link.id,
  });
  fire(rt, { type: 'trapActivated', player: p, sourceId: c.id, sourceCardId: c.cardId });
  scheduleAfterAction(rt);
}
