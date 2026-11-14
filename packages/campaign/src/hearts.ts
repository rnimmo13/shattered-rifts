import { COMBAT_DB } from '@sr/content/v2';
import type { RunState } from './types';

export const heartCrossedChance = (r: RunState): number =>
  (r.heart ? COMBAT_DB.boons[r.heart]?.crossedOfferPct : undefined) ?? 3;

/** Rift Heart favors foreign-card opportunities; other Hearts keep their existing map/event odds. */
export const heartCrossedMultiplier = (r: Pick<RunState, 'heart'>): number =>
  r.heart === 'ember-heart' ? 3 : 1;

/** Preserve the unpenalized maximum, so growth and swapping never compound rounding. */
export function changeMaxHp(r: RunState, amount: number, heal = true, minimum = 1): number {
  const before = r.maxHp;
  const base = Math.max(minimum, r.maxHp + (r.heartMaxHpLoss ?? 0) + amount);
  const pct = r.heart ? (COMBAT_DB.boons[r.heart]?.maxHpPct ?? 0) : 0;
  r.maxHp = Math.max(1, Math.floor((base * (100 + pct)) / 100));
  if (pct) r.heartMaxHpLoss = base - r.maxHp;
  else delete r.heartMaxHpLoss;
  const gained = r.maxHp - before;
  r.hp = Math.max(1, Math.min(r.maxHp, r.hp + (heal && amount > 0 ? gained : 0)));
  return gained;
}

/** Old Glutton saves had already paid a flat 20 HP. Restore that maximum once, without healing. */
export function migrateHeart(r: RunState): void {
  if (r.heart && COMBAT_DB.boons[r.heart]?.maxHpPct && r.heartMaxHpLoss === undefined) {
    r.maxHp += 20;
    changeMaxHp(r, 0, false);
  } else if (!r.heart || !COMBAT_DB.boons[r.heart]?.maxHpPct) {
    delete r.heartMaxHpLoss;
  }
}
