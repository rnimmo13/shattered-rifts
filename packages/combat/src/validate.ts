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
    opts: {
      aimed: boolean;
      snare: boolean;
      pick?: boolean;
      card?: boolean;
      rune?: boolean;
      /** an Aura that answers an ally falling: it may strike the one that killed it (DECISIONS #326) */
      attacker?: boolean;
      /** inside an Aura that answers a card being played */
      played?: boolean;
    },
  ): void => {
    for (const o of ops) {
      if (o.op === 'summon' && !db.units[o.unit])
        errs.push(`${where}: summons unknown unit "${o.unit}"`);
      if (o.op === 'addCard' && !db.cards[o.card])
        errs.push(`${where}: adds unknown card "${o.card}"`);
      if (o.op === 'prevent' && !opts.snare) errs.push(`${where}: "prevent" only works in a Trap`);
      if ('to' in o && o.to === 'attacker' && !opts.snare && !opts.attacker)
        errs.push(
          `${where}: "attacker" only works in a Trap, or an Aura that answers an ally dying`,
        );
      if ('to' in o && o.to === 'target' && !opts.aimed)
        errs.push(`${where}: uses "target" but nothing is aimed`);
      if ('amount' in o && !Number.isFinite(o.amount)) errs.push(`${where}: bad amount`);
      if (
        (o.op === 'damage' ||
          o.op === 'loseHp' ||
          o.op === 'barrier' ||
          o.op === 'heal' ||
          o.op === 'growHp') &&
        o.amount < 0
      )
        errs.push(`${where}: negative amount`);
      if (
        o.op === 'damage' &&
        o.lifesteal !== undefined &&
        !(Number.isFinite(o.lifesteal) && o.lifesteal > 0 && o.lifesteal <= 100)
      )
        errs.push(`${where}: Lifesteal must be 1-100 percent`);
      // (a random discard or consume asks no one, so an Aura may do it: Tools of the Trade)
      if (
        ((o.op === 'discard' && !o.random) ||
          (o.op === 'exhaustCards' && !o.random) ||
          o.op === 'scry' ||
          o.op === 'topdeck' ||
          (o.op === 'transform' && o.choose)) &&
        !opts.pick
      )
        errs.push(
          `${where}: "${o.op}" asks the player to choose, so only a card's own effects may use it`,
        );
      if (opts.rune && (o.op === 'evoke' || o.op === 'channel' || o.op === 'pulse'))
        errs.push(
          `${where}: a rune's own effects cannot evoke or channel (they would call themselves)`,
        );
      if (o.op === 'copySelf' && !opts.card) errs.push(`${where}: "copySelf" only works in a card`);
      if (
        o.op === 'discover' &&
        o.count !== undefined &&
        (!Number.isInteger(o.count) || o.count < (o.scale ? 0 : 1))
      )
        errs.push(`${where}: bad discover count`);
      if (o.op === 'when') checkOps(`${where}.when`, o.ops, opts);
      if (o.op === 'damage' && o.onKill) checkOps(`${where}.onKill`, o.onKill, opts);
      if ((o.op === 'copyPlayed' || o.op === 'returnPlayed') && !opts.played)
        errs.push(`${where}: "${o.op}" only works in a trigger that answers a card being played`);
      if (o.op === 'recost' && !opts.card) errs.push(`${where}: "recost" only works in a card`);
      // (the Necrobinder copy) a command's ops run with each companion as the actor; a Raise needs a known unit
      if (o.op === 'command') checkOps(`${where}.command`, o.ops, opts);
      // (the Knight's Riposte reads the target's Opening, so it needs one)
      if (o.op === 'riposte') {
        if (!opts.aimed) errs.push(`${where}: "riposte" needs a target`);
        checkOps(`${where}.riposte`, o.ops, opts);
      }
      // (or at every enemy: each Open one spends its own Opening, Answer Them All, DECISIONS #423)
      if (o.op === 'damage' && o.riposte && o.to !== 'target' && o.to !== 'allFoes')
        errs.push(
          `${where}: a Riposte bonus needs a damage effect aimed at the target or every enemy`,
        );
      // (the Assassin's knives: in the target needs one; a pull's ops are aimed at the enemy each knife came from)
      if (
        (o.op === 'embed' || o.op === 'extract') &&
        (o.to ?? 'target') === 'target' &&
        !opts.aimed
      )
        errs.push(`${where}: "${o.op}" into the target needs a target`);
      if (o.op === 'extract' && o.ops)
        checkOps(`${where}.extract`, o.ops, { ...opts, aimed: true });
      if (o.op === 'raise' && !db.units[o.unit])
        errs.push(`${where}: raises unknown unit "${o.unit}"`);
      if (o.op === 'power') {
        if (!opts.card) errs.push(`${where}: "power" only works in a card`);
        checkOps(`${where}.power`, o.ops, {
          // (an Aura that answers your Attack hitting an enemy aims at that enemy: Envenom; so do Fate and debuff answers, a pinned
          // Aura, and an awakening's Aura, at each enemy the totem struck)
          aimed:
            o.when === 'play' ||
            o.when === 'hitFoe' ||
            o.when === 'doomFoe' ||
            o.when === 'debuffFoe' ||
            o.when === 'evoke' ||
            // (the Knight's: the enemy left Open, the one whose Opening was spent, the attacker the Thorns struck)
            o.when === 'opening' ||
            o.when === 'riposte' ||
            o.when === 'thorns' ||
            // (the Assassin's: the enemy a knife went into or came out of)
            o.when === 'embed' ||
            o.when === 'extract' ||
            !!o.pin,
          snare: false,
          attacker: o.when === 'allyDies' || o.when === 'allyLost' || o.when === 'thorns',
          played: o.when === 'play',
        });
      }
      if (o.op === 'channel' && o.rune !== '*' && !db.runes?.[o.rune])
        errs.push(`${where}: channels unknown rune "${o.rune}"`);
      if (o.op === 'plant' && o.spirit !== '*' && !db.totems?.[o.spirit])
        errs.push(`${where}: plants unknown totem "${o.spirit}"`);
      if (
        o.op === 'totemCommand' &&
        !['choose', 'random', 'all', 'front', 'newest'].includes(o.spirit) &&
        !db.totems?.[o.spirit]
      )
        errs.push(`${where}: commands unknown totem "${o.spirit}"`);
      if (o.op === 'forge' && !db.cards[o.card])
        errs.push(`${where}: forges unknown card "${o.card}"`);
      if (o.op === 'transform' && !db.cards[o.into])
        errs.push(`${where}: transforms into unknown card "${o.into}"`);
      if ((o.op === 'growSelf' || o.op === 'endTurn') && !opts.card)
        errs.push(`${where}: "${o.op}" only works in a card`);
      if ('scale' in o && o.scale) {
        if (o.scale.by === 'charge' && !opts.rune)
          errs.push(`${where}: "charge" only works in a rune`);
        if ((o.scale.by === 'x' || o.scale.by === 'bonus') && !opts.card)
          errs.push(`${where}: "${o.scale.by}" only works in a card`);
        if (o.scale.into === 'hits' && o.op !== 'damage')
          errs.push(`${where}: only damage has hits`);
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
      if (!c.trigger) errs.push(`${id}: a Trap needs a trigger`);
      if (c.target !== 'none') errs.push(`${id}: a Trap cannot take a target`);
    } else if (c.trigger) errs.push(`${id}: only Traps have triggers`);
    const aimed = c.target !== 'none';
    // inside a Trap "target" is the attacker, so it counts as aimed
    checkOps(id, c.effects, {
      aimed: aimed || c.kind === 'snare',
      snare: c.kind === 'snare',
      card: true,
      pick: c.kind !== 'snare',
    });
    if (c.onDiscard)
      checkOps(`${id}.onDiscard`, c.onDiscard, { aimed: false, snare: false, card: true });
    if (c.onExhaust)
      checkOps(`${id}.onExhaust`, c.onExhaust, { aimed: false, snare: false, card: true });
    if (c.inHandAtEnd) checkOps(`${id}.inHandAtEnd`, c.inHandAtEnd, { aimed: false, snare: false });
    if (c.onDraw) checkOps(`${id}.onDraw`, c.onDraw, { aimed: false, snare: false, card: true });
    if (c.returnEvery && (!Number.isInteger(c.returnEvery.n) || c.returnEvery.n < 1))
      errs.push(`${id}: bad returnEvery`);
    if (c.x && c.cost !== 0) errs.push(`${id}: an X card must have cost 0`);
    const flat = [...c.effects, ...c.effects.flatMap((o) => (o.op === 'power' ? o.ops : []))];
    const readsX = flat.some((o) => 'scale' in o && o.scale?.by === 'x');
    if ((c.x || c.starX) && !readsX) errs.push(`${id}: an X card must scale something by x`);
    if (!c.x && !c.starX && readsX) errs.push(`${id}: scales by x but is not an X card`);
    if (c.x && c.starX) errs.push(`${id}: a card spends all its Mana or all its Arcana, not both`);
    if (c.effects.some((o) => o.op === 'sacrifice' && !o.self) && c.target !== 'ally')
      errs.push(`${id}: sacrifice needs a card that targets an ally`);
    if (
      (c.target === 'ally' || c.target === 'friend') &&
      c.effects.some((o) => o.op === 'damage' && o.to === 'target')
    )
      errs.push(`${id}: aims at your own unit but deals it damage`);
    if (c.starCost !== undefined && (!Number.isInteger(c.starCost) || c.starCost < 0))
      errs.push(`${id}: bad star cost`);
    if (
      c.statusCost !== undefined &&
      (!Number.isInteger(c.statusCost.amount) ||
        (c.statusCost.x ? c.statusCost.amount !== 0 : c.statusCost.amount <= 0))
    )
      errs.push(`${id}: bad status cost`);
    if (
      c.kind === 'snare' &&
      c.trigger !== undefined &&
      c.trigger.on !== 'attacked' &&
      c.effects.some((o) => o.op === 'prevent')
    )
      errs.push(`${id}: "prevent" only cancels an attack`);
    // (inside a condition, or a card played at the target: Bubble Bubble, Knife Trap; a command aims its companions at the card's
    // target; a pinned Aura remembers it; a spread reads it)
    const usesTarget = (ops: readonly Op[]): boolean =>
      ops.some(
        (o) =>
          ('to' in o && o.to === 'target') ||
          (o.op === 'when' && usesTarget(o.ops)) ||
          (o.op === 'playPile' && o.aim === 'target') ||
          (o.op === 'command' && usesTarget(o.ops)) ||
          (o.op === 'power' && !!o.pin) ||
          o.op === 'spreadDebuffs' ||
          // (the Knight's Riposte reads the target; the Assassin's knives go into it or come out of it)
          o.op === 'riposte' ||
          ((o.op === 'embed' || o.op === 'extract') && (o.to ?? 'target') === 'target'),
      );
    // (a cost can only read the side counters costOf knows)
    const COUNTERS = [
      'attacksPlayed',
      'played',
      'allyStrikes',
      'drawnTurn',
      'doomedTurn',
      'etherealPlayed',
      'deaths',
      'suits',
    ];
    for (const by of [c.freeIf?.by, c.cheaperPer?.by])
      if (by && !COUNTERS.includes(by)) errs.push(`${id}: a cost cannot read "${by}"`);
    // (the Spellblade's: a discharge feeds the card's attack, so it comes before the damage it adds to)
    {
      const d = c.effects.findIndex((o) => o.op === 'discharge');
      const hit = c.effects.findIndex((o) => o.op === 'damage');
      if (d >= 0 && hit >= 0 && d > hit)
        errs.push(`${id}: a discharge must come before the card's damage`);
    }
    if (c.target === 'foe' && !usesTarget(c.effects))
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
    if (h.trait?.clutch) {
      const c = h.trait.clutch;
      if (!((c.perMissingHp ?? 0) > 0) === !((c.perMissingPct ?? 0) > 0))
        errs.push(`hero ${id}: clutch needs one of perMissingHp or perMissingPct above 0`);
    }
    if (
      h.trait &&
      !h.trait.fightStart?.length &&
      !h.trait.turnStart?.length &&
      !h.trait.triggers?.length &&
      !h.trait.clutch &&
      !h.trait.shareMight &&
      !h.trait.healAfterFight
    )
      errs.push(`hero ${id}: trait "${h.trait.name}" does nothing`);
    if (h.trait?.fightStart)
      checkOps(`hero ${id} trait`, h.trait.fightStart, { aimed: false, snare: false });
    if (h.trait?.turnStart)
      checkOps(`hero ${id} trait`, h.trait.turnStart, { aimed: false, snare: false });
    if (h.trait?.triggers)
      for (const t of h.trait.triggers) {
        if (t.op !== 'power') errs.push(`hero ${id}: a trait trigger must be a power op`);
        // (a trait trigger that answers something done to one enemy aims at it, as an Aura's does: the Assassin's pulls)
        else
          checkOps(`hero ${id} trait`, t.ops, {
            aimed: [
              'opening',
              'riposte',
              'thorns',
              'embed',
              'extract',
              'doomFoe',
              'debuffFoe',
              'hitFoe',
            ].includes(t.when),
            snare: false,
          });
      }
    for (const e of h.startUnits ?? []) {
      const s = typeof e === 'string' ? e : e.unit;
      if (typeof e !== 'string' && !(Number.isInteger(e.hp) && e.hp >= 1))
        errs.push(`hero ${id}: start unit "${s}" needs a whole hp of 1 or more`);
      const u = db.units[s];
      if (!u) errs.push(`hero ${id}: unknown start unit "${s}"`);
      else if (u.brain.kind !== 'ally') errs.push(`hero ${id}: start unit "${s}" is not an ally`);
    }
  }
  return errs;
}
