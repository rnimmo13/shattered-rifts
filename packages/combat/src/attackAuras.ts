import type { SideState, Unit } from './types';
import { TRAIT_POWER } from './types';

/** Flat per-hit attack bonus. Skills, Traps, totems and Aura damage never qualify. */
export function attackAuraBonus(side: SideState, unit: Unit, attack: boolean): number {
  if (!attack) return 0;
  return (side.attackAuras ?? []).reduce((total, aura) => {
    if (aura.scope === 'companions' && unit.kind !== 'ally') return total;
    return (
      total +
      aura.amount +
      (aura.perSummons && aura.perSummons > 0
        ? Math.floor((side.summonedFight ?? 0) / aura.perSummons)
        : 0)
    );
  }, 0);
}

export function attackAuraProgress(side: SideState): string | undefined {
  const growing = (side.attackAuras ?? []).filter(
    (aura) => aura.card === TRAIT_POWER && aura.perSummons,
  );
  if (!growing.length) return undefined;
  const bonus = growing.reduce(
    (n, aura) => n + aura.amount + Math.floor((side.summonedFight ?? 0) / aura.perSummons!),
    0,
  );
  return `Fabrication +${bonus} damage · ${side.summonedFight ?? 0} summons`;
}
