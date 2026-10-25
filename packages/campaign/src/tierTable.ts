// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, the base). So `hp: [100, 125, 150]` would mean stage 1
// enemies have their written HP, stage 2 a quarter more and the Rift (stage 3) half as much again. Tier I itself runs above the base
// (players found the base too easy, DECISIONS #228): edit row 1 to move the whole game's starting difficulty.
//
// Why it looks like this (docs/BALANCE.md, "Balance audit" 2026-10-25): a deck keeps its cards, upgrades and Boons from tier to
// tier, so it grows fast over the first few tiers and then levels off at the best deck it can be. The stages climb inside a tier
// because the deck grows a lot inside one loop (about 18 picks). The tiers climb steeply, +30% HP and +14% damage a tier to Tier 10,
// then half that to Tier 20 (Robert, DECISIONS #229: every tier should be a step up you can feel; players beat the bots easily). Tier 20 asks for a godly build: about four and a half times Tier I's HP and a little over twice its damage, not thirty times.
// Stage 1 of the next tier is a step down from stage 3 of this one, like the first act of a new Ascension after the last act.

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

export const TIER_TABLE: readonly TierRow[] = [
  { hp: [115, 144, 173], dmg: [112, 125, 140] }, // Tier 1
  { hp: [145, 181, 218], dmg: [126, 141, 158] }, // Tier 2
  { hp: [175, 219, 263], dmg: [140, 157, 175] }, // Tier 3
  { hp: [205, 256, 308], dmg: [154, 172, 193] }, // Tier 4
  { hp: [235, 294, 353], dmg: [168, 188, 210] }, // Tier 5
  { hp: [265, 331, 398], dmg: [182, 204, 228] }, // Tier 6
  { hp: [295, 369, 443], dmg: [196, 220, 245] }, // Tier 7
  { hp: [325, 406, 488], dmg: [210, 235, 263] }, // Tier 8
  { hp: [355, 444, 533], dmg: [224, 251, 280] }, // Tier 9
  { hp: [385, 481, 578], dmg: [238, 267, 298] }, // Tier 10
  { hp: [400, 500, 600], dmg: [245, 274, 306] }, // Tier 11
  { hp: [415, 519, 623], dmg: [252, 282, 315] }, // Tier 12
  { hp: [430, 538, 645], dmg: [259, 290, 324] }, // Tier 13
  { hp: [445, 556, 668], dmg: [266, 298, 333] }, // Tier 14
  { hp: [460, 575, 690], dmg: [273, 306, 341] }, // Tier 15
  { hp: [475, 594, 713], dmg: [280, 314, 350] }, // Tier 16
  { hp: [490, 613, 735], dmg: [287, 321, 359] }, // Tier 17
  { hp: [505, 631, 758], dmg: [294, 329, 368] }, // Tier 18
  { hp: [520, 650, 780], dmg: [301, 337, 376] }, // Tier 19
  { hp: [535, 669, 803], dmg: [308, 345, 385] }, // Tier 20
];

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
