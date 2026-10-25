// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, which are Tier I stage 1). So `hp: [100, 125, 150]`
// means stage 1 enemies have their written HP, stage 2 a quarter more and the Rift (stage 3) half as much again.
//
// Why it looks like this (docs/BALANCE.md, "Balance audit" 2026-10-25): a deck keeps its cards, upgrades and Boons from tier to
// tier, so it grows fast over the first few tiers and then levels off at the best deck it can be. The stages climb inside a tier
// because the deck grows a lot inside one loop (about 18 picks); the tiers climb gently because the deck grows little after a few
// loops, so the table rises quickly to Tier 10 (where a deck has about stopped growing) and slowly after it. Tier 20 asks for a
// godly build: about three times the HP and twice the damage of Tier I, not thirty times.
// Stage 1 of the next tier is a step down from stage 3 of this one, like the first act of a new Ascension after the last act.

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

export const TIER_TABLE: readonly TierRow[] = [
  { hp: [100, 125, 150], dmg: [100, 112, 125] }, // Tier 1
  { hp: [122, 153, 183], dmg: [111, 124, 139] }, // Tier 2
  { hp: [141, 176, 212], dmg: [120, 134, 150] }, // Tier 3
  { hp: [159, 199, 239], dmg: [130, 146, 163] }, // Tier 4
  { hp: [178, 223, 267], dmg: [139, 156, 174] }, // Tier 5
  { hp: [192, 240, 288], dmg: [146, 164, 183] }, // Tier 6
  { hp: [206, 258, 309], dmg: [153, 171, 191] }, // Tier 7
  { hp: [220, 275, 330], dmg: [160, 179, 200] }, // Tier 8
  { hp: [234, 293, 351], dmg: [167, 187, 209] }, // Tier 9
  { hp: [248, 310, 372], dmg: [174, 195, 218] }, // Tier 10
  { hp: [254, 318, 381], dmg: [177, 198, 221] }, // Tier 11
  { hp: [261, 326, 392], dmg: [181, 203, 226] }, // Tier 12
  { hp: [267, 334, 401], dmg: [184, 206, 230] }, // Tier 13
  { hp: [274, 343, 411], dmg: [187, 209, 234] }, // Tier 14
  { hp: [280, 350, 420], dmg: [191, 214, 239] }, // Tier 15
  { hp: [286, 358, 429], dmg: [194, 217, 243] }, // Tier 16
  { hp: [293, 366, 440], dmg: [197, 221, 246] }, // Tier 17
  { hp: [299, 374, 449], dmg: [200, 224, 250] }, // Tier 18
  { hp: [306, 383, 459], dmg: [204, 228, 255] }, // Tier 19
  { hp: [312, 390, 468], dmg: [207, 232, 259] }, // Tier 20
];

const rowOf = (tier: number): TierRow => {
  const i = Math.max(1, Math.min(TIER_TABLE.length, Math.round(tier))) - 1;
  return TIER_TABLE[i] as TierRow;
};

/** Where this stage of this tier sits: percent of the written enemy HP and damage (100 = Tier I stage 1). */
export function enemyScale(tier: number, stage: number): { hp: number; dmg: number } {
  const row = rowOf(tier);
  const s = Math.max(1, Math.min(3, Math.round(stage))) - 1;
  return { hp: row.hp[s] as number, dmg: row.dmg[s] as number };
}
