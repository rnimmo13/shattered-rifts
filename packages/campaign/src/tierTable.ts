// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, the base). So `hp: [100, 125, 150]` would mean stage 1
// enemies have their written HP, stage 2 a quarter more and the Rift (stage 3) half as much again. Tier I itself runs above the base
// (players found the base too easy, DECISIONS #228; raised to 130% / 120%, #234, then to 150% / 124% with a steeper climb, #257): edit row 1 to move the whole game's starting difficulty.
//
// Why it looks like this (docs/BALANCE.md; DECISIONS #223, #228-#230): the whole table is one rising ladder. Tier 1 stage 1, 2 and 3,
// then Tier 2 stage 1 and so on: every step is harder than the one before it, and stage 1 of a tier is always harder than stage 3 of
// the tier below (Robert: it must never take a step back; the table test checks it). Each stage adds +18% HP and +6% damage to Tier
// 10 (+55% / +20% a tier: #257), then +6% / +2% to Tier 20, where a deck has long stopped growing. Edit by hand, but keep it rising.

export interface TierRow {
  /** enemy HP at stages 1, 2 and 3, percent of the written numbers */
  hp: readonly [number, number, number];
  /** enemy attack damage at stages 1, 2 and 3, percent of the written numbers */
  dmg: readonly [number, number, number];
}

export const TIER_TABLE: readonly TierRow[] = [
  { hp: [150, 168, 186], dmg: [124, 130, 136] }, // Tier 1
  { hp: [205, 223, 241], dmg: [144, 150, 156] }, // Tier 2
  { hp: [260, 278, 296], dmg: [164, 170, 176] }, // Tier 3
  { hp: [315, 333, 351], dmg: [184, 190, 196] }, // Tier 4
  { hp: [370, 388, 406], dmg: [204, 210, 216] }, // Tier 5
  { hp: [425, 443, 461], dmg: [224, 230, 236] }, // Tier 6
  { hp: [480, 498, 516], dmg: [244, 250, 256] }, // Tier 7
  { hp: [535, 553, 571], dmg: [264, 270, 276] }, // Tier 8
  { hp: [590, 608, 626], dmg: [284, 290, 296] }, // Tier 9
  { hp: [645, 663, 681], dmg: [304, 310, 316] }, // Tier 10
  { hp: [702, 708, 714], dmg: [325, 327, 329] }, // Tier 11
  { hp: [720, 726, 732], dmg: [331, 333, 335] }, // Tier 12
  { hp: [738, 744, 750], dmg: [337, 339, 341] }, // Tier 13
  { hp: [756, 762, 768], dmg: [343, 345, 347] }, // Tier 14
  { hp: [774, 780, 786], dmg: [349, 351, 353] }, // Tier 15
  { hp: [792, 798, 804], dmg: [355, 357, 359] }, // Tier 16
  { hp: [810, 816, 822], dmg: [361, 363, 365] }, // Tier 17
  { hp: [828, 834, 840], dmg: [367, 369, 371] }, // Tier 18
  { hp: [846, 852, 858], dmg: [373, 375, 377] }, // Tier 19
  { hp: [864, 870, 876], dmg: [379, 381, 383] }, // Tier 20
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
