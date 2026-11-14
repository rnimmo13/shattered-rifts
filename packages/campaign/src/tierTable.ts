// Normal campaign scaling: 100% HP / 93% damage at Tier I, reaching 700% / 200% at XII (DECISIONS #790; 95% / 250% before).
// Interpolate evenly and round each result to a whole percentage. Current runs use stage 1.
// Stage offsets and rows XIII–XX remain for legacy data; those rows extrapolate the same slope.

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

/** enemy HP at Tier I stage 1, percent of the written numbers */
export const HP_START = 100;
/** added to enemy HP for every Rift Tier up (percentage points; 20 until DECISIONS #536, 30 until #555) */
export const HP_PER_TIER = (700 - HP_START) / 11;
/** added to enemy HP for each stage inside a tier (percentage points) */
export const HP_PER_STAGE = 5;

/** enemy attack damage at Tier I stage 1, percent of the written numbers */
export const DMG_START = 93;
/** added to enemy damage for every Rift Tier up (percentage points; 12 until DECISIONS #555) */
export const DMG_PER_TIER = (200 - DMG_START) / 11;
/** added to enemy damage for each stage inside a tier (percentage points) */
export const DMG_PER_STAGE = 1;

/** how many Rift Tiers there are */
const TIERS = 20;

const at = (
  start: number,
  perTier: number,
  perStage: number,
  tier: number,
  stage: number,
): number => Math.round(start + (tier - 1) * perTier + (stage - 1) * perStage);
const stages = (start: number, perTier: number, perStage: number, tier: number) =>
  [1, 2, 3].map((st) => at(start, perTier, perStage, tier, st)) as [number, number, number];

export const TIER_TABLE: readonly TierRow[] = Array.from({ length: TIERS }, (_, i) => ({
  hp: stages(HP_START, HP_PER_TIER, HP_PER_STAGE, i + 1),
  dmg: stages(DMG_START, DMG_PER_TIER, DMG_PER_STAGE, i + 1),
}));

const rowOf = (tier: number): TierRow => {
  const i = Math.max(1, Math.min(TIER_TABLE.length, Math.round(tier))) - 1;
  return TIER_TABLE[i] as TierRow;
};

/** Where this stage of this tier sits: percent of the written enemy HP and damage (100 = the numbers in units.ts). */
export function enemyScale(tier: number, stage: number): { hp: number; dmg: number } {
  const row = rowOf(tier);
  const s = Math.max(1, Math.min(3, Math.round(stage))) - 1;
  return { hp: row.hp[s] as number, dmg: row.dmg[s] as number };
}
