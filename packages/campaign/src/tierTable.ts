// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// (Since DECISIONS #531 a run has no acts: fights use a row's first column, and the other two only keep old rows readable.)
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, the base). Tier I itself runs above the base (players
// found the base too easy, DECISIONS #228; #234, #257, #261).
//
// HP and damage are three numbers each, not typed row by row (DECISIONS #262): Tier I stage 1 starts at HP_START, every Tier up adds a flat
// HP_PER_TIER, and every stage inside a tier adds HP_PER_STAGE. Keep HP_PER_TIER above twice HP_PER_STAGE, so stage 1 of a tier is
// still harder than stage 3 of the one below. Enemy attack damage works the same way with the DMG_ numbers.
//
// Why it looks like this (docs/BALANCE.md; DECISIONS #223, #228-#230): the whole table is one rising ladder. Tier 1 stage 1, 2 and 3,
// then Tier 2 stage 1 and so on: every step is harder than the one before it, and stage 1 of a tier is always harder than stage 3 of
// the tier below (Robert: it must never take a step back; the table test checks it). HP and damage climb the same amount every tier
// up to Tier 10, and more steeply from there to Tier 20 (DECISIONS #520): damage twice as fast, HP by HP_STEEP a tier, so Tier XX
// enemies have ten times their written HP (#536).

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

/** enemy HP at Tier I stage 1, percent of the written numbers */
export const HP_START = 90;
/** added to enemy HP for every Rift Tier up (percentage points; 20 until DECISIONS #536) */
export const HP_PER_TIER = 30;
/** added to enemy HP for every Rift Tier past STEEP_FROM (percentage points): 90 + 9 x 30 + 10 x 64 = 1000 at Tier XX (#536) */
export const HP_STEEP = 64;
/** added to enemy HP for each stage inside a tier (percentage points) */
export const HP_PER_STAGE = 5;

/** enemy attack damage at Tier I stage 1, percent of the written numbers */
export const DMG_START = 90;
/** added to enemy damage for every Rift Tier up (percentage points) */
export const DMG_PER_TIER = 12;
/** added to enemy damage for each stage inside a tier (percentage points) */
export const DMG_PER_STAGE = 3;

/** how many Rift Tiers there are */
const TIERS = 20;

/** Past this Rift Tier the climb is twice as steep: Tier XI on is meant to be where a run dies (DECISIONS #520). */
export const STEEP_FROM = 10;

// (a tier past STEEP_FROM adds `steep` in place of `perTier`)
const at = (
  start: number,
  perTier: number,
  steep: number,
  perStage: number,
  tier: number,
  stage: number,
): number =>
  start +
  (Math.min(tier, STEEP_FROM) - 1) * perTier +
  Math.max(0, tier - STEEP_FROM) * steep +
  (stage - 1) * perStage;
const stages = (start: number, perTier: number, steep: number, perStage: number, tier: number) =>
  [1, 2, 3].map((st) => at(start, perTier, steep, perStage, tier, st)) as [number, number, number];

export const TIER_TABLE: readonly TierRow[] = Array.from({ length: TIERS }, (_, i) => ({
  hp: stages(HP_START, HP_PER_TIER, HP_STEEP, HP_PER_STAGE, i + 1),
  dmg: stages(DMG_START, DMG_PER_TIER, 2 * DMG_PER_TIER, DMG_PER_STAGE, i + 1),
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
