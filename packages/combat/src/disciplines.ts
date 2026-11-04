// Stateful, data-driven passives shared by campaign, Arena, ghosts and previews.
import type { CardDef, CombatState, Op, SideState, Stance, TriggerWhen, Unit } from './types';

export interface DisciplineContext {
  card?: CardDef;
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
  if (r.kind === 'retaliation' && when === 'hurt' && (ctx.lost ?? 0) > 0) {
    // Fractional percentage charge is retained, avoiding rewards for splitting a loss into many hits.
    const gain = Math.max(
      0,
      Math.min(r.roundCap - d.roundGain, ((ctx.lost ?? 0) * 100 * r.perLostPct) / hero.maxHp),
    );
    d.roundGain += gain;
    d.progress = Math.min(r.cap, d.progress + gain);
  }
  if (!own) return [];
  if (r.kind === 'execution' && when === 'play' && ctx.card?.kind === 'skill')
    d.progress = Math.min(r.cap, d.progress + r.perSkill);
  if (
    r.kind === 'cultivation' &&
    when === 'turnEnd' &&
    !side.commanded &&
    (side.totems?.filter(Boolean).length ?? 0) >= r.minimum
  )
    return [{ op: 'status', status: 'spirit', amount: r.spirit, to: 'self' }];
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
  if (r.kind === 'desperation' && actor.hp * 100 <= actor.maxHp * r.threshold) return r.bonus;
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
      return 'Reinforced machines';
    case 'pursuit':
      return `${
        Object.values(state.sides)
          .flatMap((s) => s.units)
          .find((u) => u.id === d.target)?.name ?? 'No mark'
      } +${d.progress}%`;
    case 'execution':
      return `Prepared +${d.progress}%`;
    case 'cultivation':
      return side.commanded ? 'Cultivation interrupted' : 'Cultivation ready';
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
      return `Large-machine attacks: +${r.perHp}% per max HP, up to +${r.cap}%.`;
    case 'pursuit':
      return `Attacks against your marked enemy deal ${d.progress}% more damage.`;
    case 'execution':
      return `Preparation: next Attack +${d.progress}%; +${r.bonus}% against enemies at ${r.woundedPct}% HP or less.`;
    case 'cultivation':
      return `Cultivation: ${side.commanded ? 'interrupted this turn' : 'keep at least two totems standing without commanding or pushing them out'}.`;
    case 'elements':
      return `Element growth: Flame ${d.counts?.flame ?? 0}, Frost ${d.counts?.frost ?? 0}, Storm ${d.counts?.storm ?? 0}. Last: ${d.lastElement ?? 'none'}.`;
    case 'fury':
      return `Zeal: +${d.progress}% attack damage in Fury.`;
    case 'radiance':
      return `Radiant cycles: ${d.progress}; next exit returns ${Math.min(r.cap, r.first + d.progress * r.step)} Fervor.`;
    case 'spellCycle':
      return `Spell recovery: ${side.nextStars ?? 0} Spell Power due next turn; ${d.usedTurn === side.turnBegan ? 'used this turn' : 'ready'}.`;
    case 'brewing':
      return `Fermentation: ${d.progress}/${r.cap}; end turn heals ${d.progress * r.healPct}% max HP and gives ${d.progress * r.barrier} Barrier.`;
    case 'desperation':
      return `Death-defying save: ${d.used ? 'spent this fight' : 'available once this fight'}.`;
  }
}
