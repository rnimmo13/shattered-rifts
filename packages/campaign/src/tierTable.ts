// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I) and gives enemy HP and attack damage for each of the run's three stages, as a percent
// of the numbers written on the enemies (packages/content/src/v2/units.ts, the base). So `hp: [100, 125, 150]` would mean stage 1
// enemies have their written HP, stage 2 a quarter more and the Rift (stage 3) half as much again. Tier I itself runs above the base
// (players found the base too easy, DECISIONS #228): edit row 1 to move the whole game's starting difficulty.
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
  { hp: [115, 130, 145], dmg: [112, 118, 124] }, // Tier 1
  { hp: [160, 175, 190], dmg: [130, 136, 142] }, // Tier 2
  { hp: [205, 220, 235], dmg: [148, 154, 160] }, // Tier 3
  { hp: [250, 265, 280], dmg: [166, 172, 178] }, // Tier 4
  { hp: [295, 310, 325], dmg: [184, 190, 196] }, // Tier 5
  { hp: [340, 355, 370], dmg: [202, 208, 214] }, // Tier 6
  { hp: [385, 400, 415], dmg: [220, 226, 232] }, // Tier 7
  { hp: [430, 445, 460], dmg: [238, 244, 250] }, // Tier 8
  { hp: [475, 490, 505], dmg: [256, 262, 268] }, // Tier 9
  { hp: [520, 535, 550], dmg: [274, 280, 286] }, // Tier 10
  { hp: [557, 564, 571], dmg: [289, 292, 295] }, // Tier 11
  { hp: [578, 585, 592], dmg: [298, 301, 304] }, // Tier 12
  { hp: [599, 606, 613], dmg: [307, 310, 313] }, // Tier 13
  { hp: [620, 627, 634], dmg: [316, 319, 322] }, // Tier 14
  { hp: [641, 648, 655], dmg: [325, 328, 331] }, // Tier 15
  { hp: [662, 669, 676], dmg: [334, 337, 340] }, // Tier 16
  { hp: [683, 690, 697], dmg: [343, 346, 349] }, // Tier 17
  { hp: [704, 711, 718], dmg: [352, 355, 358] }, // Tier 18
  { hp: [725, 732, 739], dmg: [361, 364, 367] }, // Tier 19
  { hp: [746, 753, 760], dmg: [370, 373, 376] }, // Tier 20
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
