// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, the base). So `hp: [100, 125, 150]` would mean stage 1
// enemies have their written HP, stage 2 a quarter more and the Rift (stage 3) half as much again. Tier I itself runs above the base
// (players found the base too easy, DECISIONS #228): edit row 1 to move the whole game's starting difficulty.
//
// Why it looks like this (docs/BALANCE.md, "Balance audit" 2026-10-25): a deck keeps its cards, upgrades and Boons from tier to
// tier, so it grows fast over the first few tiers and then levels off at the best deck it can be. The stages climb inside a tier
// because the deck grows a lot inside one loop (about 18 picks); the tiers climb gently because the deck grows little after a few
// loops, so the table rises quickly to Tier 10 (where a deck has about stopped growing) and slowly after it, and every tier is a step
// up you can feel. Tier 20 asks for a godly build: about three times Tier I's HP and twice its damage, not thirty times.
// Stage 1 of the next tier is a step down from stage 3 of this one, like the first act of a new Ascension after the last act.

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

export const TIER_TABLE: readonly TierRow[] = [
  { hp: [115, 144, 173], dmg: [112, 125, 140] }, // Tier 1
  { hp: [130, 163, 195], dmg: [119, 133, 149] }, // Tier 2
  { hp: [150, 188, 225], dmg: [129, 144, 161] }, // Tier 3
  { hp: [176, 220, 264], dmg: [142, 159, 178] }, // Tier 4
  { hp: [206, 258, 309], dmg: [157, 176, 196] }, // Tier 5
  { hp: [224, 280, 336], dmg: [166, 186, 208] }, // Tier 6
  { hp: [242, 303, 363], dmg: [175, 196, 219] }, // Tier 7
  { hp: [260, 325, 390], dmg: [184, 206, 230] }, // Tier 8
  { hp: [278, 348, 417], dmg: [193, 216, 241] }, // Tier 9
  { hp: [296, 370, 444], dmg: [202, 226, 253] }, // Tier 10
  { hp: [304, 380, 456], dmg: [207, 232, 259] }, // Tier 11
  { hp: [312, 390, 468], dmg: [211, 236, 264] }, // Tier 12
  { hp: [320, 400, 480], dmg: [216, 242, 270] }, // Tier 13
  { hp: [328, 410, 492], dmg: [220, 246, 275] }, // Tier 14
  { hp: [336, 420, 504], dmg: [225, 252, 281] }, // Tier 15
  { hp: [344, 430, 516], dmg: [229, 256, 286] }, // Tier 16
  { hp: [352, 440, 528], dmg: [234, 262, 293] }, // Tier 17
  { hp: [360, 450, 540], dmg: [238, 267, 298] }, // Tier 18
  { hp: [368, 460, 552], dmg: [243, 272, 304] }, // Tier 19
  { hp: [376, 470, 564], dmg: [247, 277, 309] }, // Tier 20
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
