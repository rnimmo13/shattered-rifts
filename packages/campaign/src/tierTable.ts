// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, the base). So `hp: [100, 125, 150]` would mean stage 1
// enemies have their written HP, stage 2 a quarter more and the Rift (stage 3) half as much again. Tier I itself runs above the base
// (players found the base too easy, DECISIONS #228; raised again to 130% / 120%, #234): edit row 1 to move the whole game's starting difficulty.
//
// Why it looks like this (docs/BALANCE.md; DECISIONS #223, #228-#230): the whole table is one rising ladder. Tier 1 stage 1, 2 and 3,
// then Tier 2 stage 1 and so on: every step is harder than the one before it, and stage 1 of a tier is always harder than stage 3 of
// the tier below (Robert: it must never take a step back; the table test checks it). Each stage adds +15% HP and +6% damage to Tier
// 10 (+45% / +18% a tier), then +7% / +3% to Tier 20, where a deck has long stopped growing. Edit by hand, but keep it rising.

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

export const TIER_TABLE: readonly TierRow[] = [
  { hp: [130, 145, 160], dmg: [120, 126, 132] }, // Tier 1
  { hp: [175, 190, 205], dmg: [138, 144, 150] }, // Tier 2
  { hp: [220, 235, 250], dmg: [156, 162, 168] }, // Tier 3
  { hp: [265, 280, 295], dmg: [174, 180, 186] }, // Tier 4
  { hp: [310, 325, 340], dmg: [192, 198, 204] }, // Tier 5
  { hp: [355, 370, 385], dmg: [210, 216, 222] }, // Tier 6
  { hp: [400, 415, 430], dmg: [228, 234, 240] }, // Tier 7
  { hp: [445, 460, 475], dmg: [246, 252, 258] }, // Tier 8
  { hp: [490, 505, 520], dmg: [264, 270, 276] }, // Tier 9
  { hp: [535, 550, 565], dmg: [282, 288, 294] }, // Tier 10
  { hp: [572, 579, 586], dmg: [297, 300, 303] }, // Tier 11
  { hp: [593, 600, 607], dmg: [306, 309, 312] }, // Tier 12
  { hp: [614, 621, 628], dmg: [315, 318, 321] }, // Tier 13
  { hp: [635, 642, 649], dmg: [324, 327, 330] }, // Tier 14
  { hp: [656, 663, 670], dmg: [333, 336, 339] }, // Tier 15
  { hp: [677, 684, 691], dmg: [342, 345, 348] }, // Tier 16
  { hp: [698, 705, 712], dmg: [351, 354, 357] }, // Tier 17
  { hp: [719, 726, 733], dmg: [360, 363, 366] }, // Tier 18
  { hp: [740, 747, 754], dmg: [369, 372, 375] }, // Tier 19
  { hp: [761, 768, 775], dmg: [378, 381, 384] }, // Tier 20
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
