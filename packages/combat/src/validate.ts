// Content validation: catches data mistakes (missing ids, impossible targets, empty patterns) before a fight does.

import type { CombatDb, Op, Pattern } from './types';

function patternMoves(p: Pattern): string[] {
  if (p.kind === 'cycle') return p.order;
  if (p.kind === 'weighted') return p.options.map((o) => o.move);
  return p.phases.flatMap((ph) => patternMoves(ph.pattern));
}

/** Returns a list of human-readable problems; empty means the database is sound. */
export function validateDb(db: CombatDb): string[] {
  const errs: string[] = [];
  const checkOps = (
    where: string,
    ops: readonly Op[],
    opts: { aimed: boolean; snare: boolean; pick?: boolean; card?: boolean; rune?: boolean },
  ): void => {
    for (const o of ops) {
      if (o.op === 'summon' && !db.units[o.unit])
        errs.push(`${where}: summons unknown unit "${o.unit}"`);
      if (o.op === 'addCard' && !db.cards[o.card])
        errs.push(`${where}: adds unknown card "${o.card}"`);
      if (o.op === 'prevent' && !opts.snare) errs.push(`${where}: "prevent" only works in a Snare`);
      if ('to' in o && o.to === 'attacker' && !opts.snare)
        errs.push(`${where}: "attacker" only works in a Snare`);
      if ('to' in o && o.to === 'target' && !opts.aimed)
        errs.push(`${where}: uses "target" but nothing is aimed`);
      if ('amount' in o && !Number.isFinite(o.amount)) errs.push(`${where}: bad amount`);
      if (
        (o.op === 'damage' || o.op === 'loseHp' || o.op === 'barrier' || o.op === 'heal') &&
        o.amount < 0
      )
        errs.push(`${where}: negative amount`);
      if ((o.op === 'discard' || o.op === 'exhaustCards' || o.op === 'scry') && !opts.pick)
        errs.push(`${where}: "${o.op}" asks the player to choose, so only a card's own effects may use it`);
      if (opts.rune && (o.op === 'evoke' || o.op === 'channel'))
        errs.push(`${where}: a rune's own effects cannot evoke or channel (they would call themselves)`);
      if (o.op === 'copySelf' && !opts.card) errs.push(`${where}: "copySelf" only works in a card`);
      if (o.op === 'discover' && (o.count !== undefined && (!Number.isInteger(o.count) || o.count < 1)))
        errs.push(`${where}: bad discover count`);
      if (o.op === 'power') {
        if (!opts.card) errs.push(`${where}: "power" only works in a card`);
        checkOps(`${where}.power`, o.ops, { aimed: o.when === 'play', snare: false });
      }
      if (o.op === 'channel' && !db.runes?.[o.rune]) errs.push(`${where}: channels unknown rune "${o.rune}"`);
      if (o.op === 'forge' && !db.cards[o.card]) errs.push(`${where}: forges unknown card "${o.card}"`);
      if ('scale' in o && o.scale) {
        if (o.scale.by === 'charge' && !opts.rune) errs.push(`${where}: "charge" only works in a rune`);
        if ((o.scale.by === 'x' || o.scale.by === 'bonus') && !opts.card)
          errs.push(`${where}: "${o.scale.by}" only works in a card`);
        if (o.scale.into === 'hits' && o.op !== 'damage') errs.push(`${where}: only damage has hits`);
      }
      if (o.op === 'status' && ['calm', 'wrath', 'radiant'].includes(o.status))
        errs.push(`${where}: use the stance op for stances`);
      if (
        o.op === 'damage' &&
        o.hits !== undefined &&
        (!Number.isInteger(o.hits) || o.hits < (o.scale?.into === 'hits' ? 0 : 1))
      )
        errs.push(`${where}: bad hit count`);
    }
  };

  for (const [id, c] of Object.entries(db.cards)) {
    if (c.id !== id) errs.push(`card key "${id}" does not match its id "${c.id}"`);
    if (!Number.isInteger(c.cost) || c.cost < 0) errs.push(`${id}: bad cost`);
    if (c.upgrade && !db.cards[c.upgrade]) errs.push(`${id}: unknown upgrade "${c.upgrade}"`);
    if (c.kind === 'snare') {
      if (!c.trigger) errs.push(`${id}: a Snare needs a trigger`);
      if (c.target !== 'none') errs.push(`${id}: a Snare cannot take a target`);
    } else if (c.trigger) errs.push(`${id}: only Snares have triggers`);
    const aimed = c.target !== 'none';
    // inside a Snare "target" is the attacker, so it counts as aimed
    checkOps(id, c.effects, {
      aimed: aimed || c.kind === 'snare',
      snare: c.kind === 'snare',
      card: true,
      pick: c.kind !== 'snare',
    });
    if (c.onDiscard) checkOps(`${id}.onDiscard`, c.onDiscard, { aimed: false, snare: false, card: true });
    if (c.onExhaust) checkOps(`${id}.onExhaust`, c.onExhaust, { aimed: false, snare: false, card: true });
    if (c.x && c.cost !== 0) errs.push(`${id}: an X card must have cost 0`);
    const flat = [...c.effects, ...c.effects.flatMap((o) => (o.op === 'power' ? o.ops : []))];
    const readsX = flat.some((o) => 'scale' in o && o.scale?.by === 'x');
    if (c.x && !readsX) errs.push(`${id}: an X card must scale something by x`);
    if (!c.x && readsX) errs.push(`${id}: scales by x but is not an X card`);
    if (c.effects.some((o) => o.op === 'sacrifice') && c.target !== 'ally')
      errs.push(`${id}: sacrifice needs a card that targets an ally`);
    if (
      (c.target === 'ally' || c.target === 'friend') &&
      c.effects.some((o) => o.op === 'damage' && o.to === 'target')
    )
      errs.push(`${id}: aims at your own unit but deals it damage`);
    if (c.starCost !== undefined && (!Number.isInteger(c.starCost) || c.starCost < 0)) errs.push(`${id}: bad star cost`);
    if (
      c.kind === 'snare' &&
      c.trigger !== undefined &&
      c.trigger.on !== 'attacked' &&
      c.effects.some((o) => o.op === 'prevent')
    )
      errs.push(`${id}: "prevent" only cancels an attack`);
    if (c.target === 'foe' && !c.effects.some((o) => 'to' in o && o.to === 'target'))
      errs.push(`${id}: asks for a target but no effect uses it`);
  }

  for (const [id, u] of Object.entries(db.units)) {
    if (u.id !== id) errs.push(`unit key "${id}" does not match its id "${u.id}"`);
    if (!(u.maxHp > 0)) errs.push(`${id}: bad HP`);
    if (u.brain.kind === 'ally') {
      checkOps(id, u.brain.act, { aimed: true, snare: false });
      if (u.brain.act.some((o) => o.op === 'actAllies'))
        errs.push(`${id}: an ally cannot use actAllies`);
    } else {
      const b = u.brain;
      const moves = patternMoves(b.pattern);
      if (!moves.length) errs.push(`${id}: empty pattern`);
      for (const m of moves) if (!b.moves[m]) errs.push(`${id}: pattern uses unknown move "${m}"`);
      if (b.opening && !b.moves[b.opening]) errs.push(`${id}: unknown opening "${b.opening}"`);
      if (b.pattern.kind === 'weighted' && !b.pattern.options.some((o) => o.weight > 0))
        errs.push(`${id}: weighted pattern with no positive weight`);
      if (b.pattern.kind === 'phases' && !b.pattern.phases.length) errs.push(`${id}: no phases`);
      if (b.pattern.kind === 'phases')
        for (const ph of b.pattern.phases) {
          if (ph.pattern.kind === 'cycle' && !ph.pattern.order.length)
            errs.push(`${id}: empty phase cycle`);
        }
      for (const [mid, m] of Object.entries(b.moves)) {
        if (m.id !== mid) errs.push(`${id}: move key "${mid}" does not match its id`);
        checkOps(`${id}.${mid}`, m.effects, { aimed: true, snare: false });
      }
    }
  }

  for (const [id, p] of Object.entries(db.potions)) {
    if (p.id !== id) errs.push(`potion key "${id}" does not match its id`);
    checkOps(`potion ${id}`, p.effects, { aimed: p.target !== 'none', snare: false });
    if (p.target === 'foe' && !p.effects.some((o) => 'to' in o && o.to === 'target'))
      errs.push(`potion ${id}: asks for a target but no effect uses it`);
  }

  for (const [id, b] of Object.entries(db.boons)) {
    if (b.id !== id) errs.push(`boon key "${id}" does not match its id`);
    checkOps(`boon ${id}`, [...(b.fightStart ?? []), ...(b.turnStart ?? [])], {
      aimed: false,
      snare: false,
    });
    if (!b.text) errs.push(`boon ${id}: needs text`);
  }

  for (const [id, rd] of Object.entries(db.runes ?? {})) {
    if (rd.id !== id) errs.push(`rune key "${id}" does not match its id`);
    checkOps(`rune ${id}.passive`, rd.passive, { aimed: false, snare: false, rune: true });
    checkOps(`rune ${id}.evoke`, rd.evoke, { aimed: false, snare: false, rune: true });
    if (!rd.text) errs.push(`rune ${id}: needs text`);
  }

  for (const [id, h] of Object.entries(db.heroes)) {
    if (h.id !== id) errs.push(`hero key "${id}" does not match its id`);
    if (h.sigil) checkOps(`hero ${id} sigil`, h.sigil, { aimed: false, snare: false });
    for (const s of h.startUnits ?? []) {
      const u = db.units[s];
      if (!u) errs.push(`hero ${id}: unknown start unit "${s}"`);
      else if (u.brain.kind !== 'ally') errs.push(`hero ${id}: start unit "${s}" is not an ally`);
    }
  }
  return errs;
}
