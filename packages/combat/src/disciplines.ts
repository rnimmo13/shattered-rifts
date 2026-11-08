// Stateful, data-driven passives shared by campaign, Arena, ghosts and previews.
import type {
  CardDef,
  CardInst,
  CombatState,
  Op,
  SideState,
  Stance,
  TriggerWhen,
  Unit,
} from './types';

/** (the Spiritwalker) how much more the hero's card damage deals for the Spirit held: perSpirit% each, up to the cap; 0 without it */
export function attunementPct(side: SideState): number {
  const r = side.discipline?.rule;
  if (r?.kind !== 'attunement') return 0;
  const spirit = side.units.find((u) => u.kind === 'hero')?.statuses['spirit'] ?? 0;
  return Math.min(r.cap, Math.max(0, spirit) * r.perSpirit);
}

export interface DisciplineContext {
  card?: CardDef;
  inst?: CardInst;
  lost?: number;
  stance?: Stance;
}

export function disciplineTrigger(
  state: CombatState,
  side: SideState,
  when: TriggerWhen,
  ctx: DisciplineContext,
): Op[] {
  const d = side.discipline;
  const hero = side.units.find((u) => u.kind === 'hero');
  if (!d || !hero || hero.hp <= 0) return [];
  const r = d.rule;
  const own = state.active === side.id;
  const barrier = (amount: number): Op => ({ op: 'barrier', amount, to: 'self' });
  if (r.kind === 'harvest' && when === 'exhaust' && d.roundGain < (r.roundLimit ?? Infinity)) {
    d.progress++;
    d.roundGain++;
  }
  if (r.kind === 'retaliation' && when === 'hurt' && (ctx.lost ?? 0) > 0) {
    // Fractional percentage charge is retained, avoiding rewards for splitting a loss into many hits.
    const gain = Math.max(
      0,
      Math.min(r.roundCap - d.roundGain, ((ctx.lost ?? 0) * 100 * r.perLostPct) / hero.maxHp),
    );
    d.roundGain += gain;
    d.progress = Math.min(r.cap, d.progress + gain);
  }
  if (
    r.kind === 'retaliation' &&
    own &&
    when === 'loseHp' &&
    (ctx.lost ?? 0) > 0 &&
    r.paymentBonus &&
    d.paymentTurn !== state.turn
  ) {
    d.paymentTurn = state.turn;
    const gain = Math.min(r.paymentBonus, Math.max(0, r.roundCap - d.roundGain));
    d.roundGain += gain;
    d.progress = Math.min(r.cap, d.progress + gain);
  }
  if (!own) return [];
  if (r.kind === 'commandGuard' && ctx.card?.tags?.includes(r.tag) && ctx.inst) {
    if (when === 'playStart' && d.usedTurn !== state.turn) {
      d.usedTurn = state.turn;
      d.guardCard = ctx.inst.id;
    }
    if (when === 'play' && d.guardCard === ctx.inst.id) {
      delete d.guardCard;
      const count = side.units.filter(
        (u) => u.kind === 'ally' && u.hp > 0 && u.def.replace(/\+$/, '') === r.unit,
      ).length;
      return [barrier(Math.min(r.cap, count * r.perAlly))];
    }
  }
  if (
    r.kind === 'desperation' &&
    r.attackBarrierPct &&
    when === 'playStart' &&
    ctx.card?.kind === 'attack' &&
    d.usedTurn !== state.turn
  ) {
    // The first Attack spends the opportunity even if its hero is above the threshold.
    d.usedTurn = state.turn;
    if (hero.hp * 100 <= hero.maxHp * r.threshold)
      return [barrier(Math.ceil((hero.maxHp * r.attackBarrierPct) / 100))];
  }
  if (
    r.kind === 'harvest' &&
    when === 'turnSettled' &&
    (side.exhaustedTurn ?? 0) > 0 &&
    d.usedTurn !== state.turn
  ) {
    d.usedTurn = state.turn;
    return [{ op: 'damage', amount: r.base + r.perConsumed * d.progress, to: 'weakestFoe' }];
  }
  if (r.kind === 'execution' && when === 'play' && ctx.card?.kind === 'skill')
    d.progress = Math.min(r.cap, d.progress + r.perSkill);
  if (r.kind === 'volley' && when === 'play' && ctx.card?.tags?.includes(r.tag)) {
    if (d.usedTurn !== state.turn) {
      d.usedTurn = state.turn;
      d.progress = 0;
    }
    d.progress++;
  }
  if (
    r.kind === 'cultivation' &&
    when === 'turnEnd' &&
    !side.commanded &&
    (side.totems?.filter(Boolean).length ?? 0) >= r.minimum
  ) {
    const amount = Math.min(r.spirit, (r.cap ?? Infinity) - d.progress);
    if (amount <= 0) return [];
    d.progress += amount;
    return [{ op: 'status', status: 'spirit', amount, to: 'self' }];
  }
  if (r.kind === 'elements' && when === 'play') {
    const ops: Op[] = [];
    for (const element of ['flame', 'frost', 'storm'] as const) {
      if (!ctx.card?.tags?.includes(element) || d.elementTurns?.[element] === state.turn) continue;
      const prior = d.counts?.[element] ?? 0;
      const amount =
        r[element] + prior + (d.lastElement && d.lastElement !== element ? r.sequence : 0);
      (d.counts ??= {})[element] = prior + 1;
      (d.elementTurns ??= {})[element] = state.turn;
      d.lastElement = element;
      ops.push(
        element === 'flame'
          ? { op: 'status', status: 'burn', amount, to: 'randomFoe' }
          : element === 'frost'
            ? barrier(amount)
            : { op: 'damage', amount, to: 'allFoes' },
      );
    }
    return ops;
  }
  if (r.kind === 'fury') {
    if (when === 'stance' && ctx.stance === 'wrath' && d.usedTurn !== state.turn) {
      d.usedTurn = state.turn;
      d.progress = Math.min(r.cap, d.progress + r.perEntry);
    }
    if (when === 'stanceLeft' && ctx.stance === 'wrath' && d.exitTurn !== state.turn) {
      d.exitTurn = state.turn;
      return [barrier(r.barrier + Math.floor(d.progress / r.perEntry) * r.perExit)];
    }
  }
  if (
    r.kind === 'radiance' &&
    when === 'stanceLeft' &&
    ctx.stance === 'radiant' &&
    d.usedTurn !== state.turn
  ) {
    d.usedTurn = state.turn;
    const amount = Math.min(r.cap, r.first + d.progress * r.step);
    d.progress++;
    return [{ op: 'status', status: 'mantra', amount, to: 'self' }];
  }
  if (r.kind === 'brewing') {
    if (when === 'hangoverPaid' && (ctx.lost ?? 0) > 0 && d.usedTurn !== state.turn) {
      d.usedTurn = state.turn;
      d.progress = Math.min(r.cap, d.progress + 1);
    }
    if (when === 'turnEnd' && d.progress > 0)
      return [
        { op: 'heal', amount: Math.ceil((hero.maxHp * d.progress * r.healPct) / 100), to: 'self' },
        barrier(d.progress * r.barrier),
      ];
  }
  return [];
}

/** Called once per damaging Attack act; preview calls this on a private copy of state. */
export function disciplineAttack(
  state: CombatState,
  side: SideState,
  actor: Unit,
  card: CardDef | null,
  target: Unit | null,
  slots: number,
): number {
  const d = side.discipline;
  if (!d) return 0;
  const r = d.rule;
  if (actor.kind === 'ally')
    return r.kind === 'frame' && slots >= r.minSlots ? Math.min(r.cap, actor.maxHp * r.perHp) : 0;
  if (actor.kind !== 'hero' || card?.kind !== 'attack') return 0;
  if (r.kind === 'retaliation' || r.kind === 'execution') {
    const bonus = Math.floor(d.progress);
    d.progress = 0;
    return bonus;
  }
  if (r.kind === 'reserves') return Math.min(r.cap, d.progress * r.perSpent);
  if (
    r.kind === 'pursuit' &&
    state.active === side.id &&
    card.target === 'foe' &&
    target &&
    target.side !== side.id &&
    target.hp > 0 &&
    d.usedTurn !== state.turn
  ) {
    d.usedTurn = state.turn;
    d.progress = d.target === target.id ? Math.min(r.cap, d.progress + r.perTurn) : r.perTurn;
    d.target = target.id;
  }
  if (r.kind === 'fury' && (actor.statuses.wrath ?? 0) > 0) return d.progress;
  if (r.kind === 'desperation') {
    const hpPct = (actor.hp * 100) / actor.maxHp;
    if (hpPct <= r.threshold + 1e-9) {
      // (and on below it, to the deep bonus: DECISIONS #685)
      if (r.deepBonus === undefined || r.deepAt === undefined || r.deepAt >= r.threshold)
        return r.bonus;
      if (hpPct <= r.deepAt + 1e-9) return r.deepBonus;
      return (
        r.bonus +
        Math.floor(
          ((r.deepBonus - r.bonus) * (r.threshold - hpPct)) / (r.threshold - r.deepAt) + 1e-9,
        )
      );
    }
    if (r.rampFrom && r.rampFrom > r.threshold)
      return Math.max(
        0,
        Math.floor((r.bonus * (r.rampFrom - hpPct)) / (r.rampFrom - r.threshold) + 1e-9),
      );
  }
  return 0;
}

export function disciplineTarget(side: SideState, target: Unit): number {
  const d = side.discipline;
  if (d?.rule.kind === 'pursuit' && d.target === target.id) return d.progress;
  if (d?.rule.kind === 'execution' && target.hp * 100 <= target.maxHp * d.rule.woundedPct)
    return d.rule.bonus;
  return 0;
}

export function disciplineLabel(side: SideState, state: CombatState): string {
  const d = side.discipline;
  if (!d) return '';
  const r = d.rule;
  switch (r.kind) {
    case 'reserves':
      return `Assault +${Math.min(r.cap, d.progress * r.perSpent)}%`;
    case 'retaliation':
      return `Retaliation ${Math.floor(d.progress)}%`;
    case 'frame':
      return `Reinforced machines${d.recovery ? ` · ${d.recovery} HP saved` : ''}`;
    case 'pursuit':
      return `${
        Object.values(state.sides)
          .flatMap((s) => s.units)
          .find((u) => u.id === d.target)?.name ?? 'No mark'
      } +${d.progress}%`;
    case 'execution':
      return `Prepared +${d.progress}%`;
    case 'cultivation':
      return r.cap !== undefined && d.progress >= r.cap
        ? `Cultivated ${d.progress}/${r.cap}`
        : side.commanded
          ? 'Cultivation interrupted'
          : `Cultivation ready${r.cap !== undefined ? ` ${d.progress}/${r.cap}` : ''}`;
    case 'attunement':
      return `Attuned +${attunementPct(side)}%`;
    case 'snarecraft':
      return `Traps +${Math.min(r.cap, (side.snaresSprung ?? 0) * r.perSprung)}%`;
    case 'volley':
      return `Volley +${d.usedTurn === side.turnBegan ? Math.min(r.cap, d.progress * r.perCard) : 0}%`;
    case 'elements':
      return `Flame ${d.counts?.flame ?? 0} · Frost ${d.counts?.frost ?? 0} · Storm ${d.counts?.storm ?? 0}`;
    case 'fury':
      return `Zeal +${d.progress}%`;
    case 'radiance':
      return `Return ${Math.min(r.cap, r.first + d.progress * r.step)} Fervor`;
    case 'spellCycle':
      return `Recovery ${side.nextStars ?? 0} Spell Power`;
    case 'brewing':
      return `Fermentation ${d.progress}/${r.cap}`;
    case 'harvest':
      return `Harvest ${d.progress} · Reap ${r.base + r.perConsumed * d.progress}${(side.exhaustedTurn ?? 0) > 0 && d.usedTurn !== state.turn ? ' ready' : ''}`;
    case 'commandGuard':
      return d.usedTurn === state.turn ? 'Command guard spent' : 'Command guard ready';
    case 'desperation':
      return d.used ? 'Last stand spent' : 'Last stand ready';
  }
}

export function disciplineText(side: SideState): string | null {
  const d = side.discipline;
  if (!d) return null;
  const r = d.rule;
  switch (r.kind) {
    case 'reserves':
      return `Reserve assault: +${Math.min(r.cap, d.progress * r.perSpent)}% attack damage this turn.`;
    case 'retaliation':
      return `Retaliation: next Attack +${Math.floor(d.progress)}%. Round charge ${Math.floor(d.roundGain)}/${r.roundCap}%.`;
    case 'frame':
      return `Large-machine attacks: +${r.perHp}% per max HP, up to +${r.cap}%. Rebuild reserve: ${d.recovery ?? 0} max HP. Death saves half earned growth, up to ${r.recoverCap ?? 0}; new builds use it, revivals do not.`;
    case 'pursuit':
      return `Attacks against your marked enemy deal ${d.progress}% more damage.`;
    case 'execution':
      return `Preparation: next Attack +${d.progress}%; +${r.bonus}% against enemies at ${r.woundedPct}% HP or less.`;
    case 'cultivation':
      return r.cap !== undefined && d.progress >= r.cap
        ? `Cultivation: complete, ${d.progress}/${r.cap} Spirit gained this fight.`
        : `Cultivation: ${side.commanded ? 'interrupted this turn' : `keep at least ${r.minimum} totems standing without commanding or pushing them out`}.${r.cap !== undefined ? ` ${d.progress}/${r.cap} Spirit gained this fight.` : ''}`;
    case 'snarecraft':
      return `Trapcraft: your Traps deal ${Math.min(r.cap, (side.snaresSprung ?? 0) * r.perSprung)}% more damage (+${r.perSprung}% per Trap sprung this fight, up to +${r.cap}%).`;
    case 'volley':
      return `Volley: your Daggers deal ${d.usedTurn === side.turnBegan ? Math.min(r.cap, d.progress * r.perCard) : 0}% more damage this turn (+${r.perCard}% for each one played before, up to +${r.cap}%; resets each turn).`;
    case 'attunement':
      return `Attunement: your cards deal ${attunementPct(side)}% more damage (+${r.perSpirit}% per Spirit, up to +${r.cap}%). Totems are not included: Spirit already adds to their numbers.`;
    case 'elements':
      return `Element growth: Flame ${d.counts?.flame ?? 0}, Frost ${d.counts?.frost ?? 0}, Storm ${d.counts?.storm ?? 0}. Last: ${d.lastElement ?? 'none'}.`;
    case 'fury':
      return `Zeal: +${d.progress}% attack damage in Fury.`;
    case 'radiance':
      return `Radiant cycles: ${d.progress}; next exit returns ${Math.min(r.cap, r.first + d.progress * r.step)} Fervor.`;
    case 'spellCycle':
      return `Spell recovery: ${side.nextStars ?? 0} Spell Power due next turn; ${d.usedTurn === side.turnBegan ? 'used this turn' : 'ready'}.`;
    case 'brewing':
      return `Fermentation: ${d.progress}/${r.cap}; end turn heals ${Number((d.progress * r.healPct).toFixed(2))}% max HP and gives ${d.progress * r.barrier} Barrier.`;
    case 'harvest':
      return `Harvest ${d.progress}; ${d.roundGain}/${r.roundLimit ?? '∞'} eligible consumptions this round. After hand cleanup and companion actions, consuming a card this turn enables one Reap for ${r.base + r.perConsumed * d.progress} non-attack damage against the lowest-HP enemy. Barrier can absorb it.`;
    case 'desperation':
      return `Death-defying save: ${d.used ? 'spent this fight' : 'available once this fight'}.${r.attackBarrierPct ? ` Your first Attack on your turn grants ${r.attackBarrierPct}% max HP as Barrier (rounded up) before resolving if you are at ${r.threshold}% HP or lower.` : ''}`;
    case 'commandGuard':
      return `Your first Command on your turn grants ${r.perAlly} Barrier per surviving ${r.unitName}, up to ${r.cap}, after resolving.`;
  }
}
