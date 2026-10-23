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
    opts: { aimed: boolean; snare: boolean },
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
      if (o.op === 'damage' && o.hits !== undefined && (!Number.isInteger(o.hits) || o.hits < 1))
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
    checkOps(id, c.effects, { aimed: aimed || c.kind === 'snare', snare: c.kind === 'snare' });
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

  for (const [id, b] of Object.entries(db.boons)) {
    if (b.id !== id) errs.push(`boon key "${id}" does not match its id`);
    checkOps(`boon ${id}`, [...(b.fightStart ?? []), ...(b.turnStart ?? [])], {
      aimed: false,
      snare: false,
    });
    if (!b.text) errs.push(`boon ${id}: needs text`);
  }

  for (const [id, h] of Object.entries(db.heroes)) {
    if (h.id !== id) errs.push(`hero key "${id}" does not match its id`);
    for (const s of h.startUnits ?? []) {
      const u = db.units[s];
      if (!u) errs.push(`hero ${id}: unknown start unit "${s}"`);
      else if (u.brain.kind !== 'ally') errs.push(`hero ${id}: start unit "${s}" is not an ally`);
    }
  }
  return errs;
}
