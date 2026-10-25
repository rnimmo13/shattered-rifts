// The Rift Tier table: THE place to tune how hard each tier is. Edit the numbers; nothing else needs to change.
//
// Each row is one Rift Tier (row 1 = Tier I). `hp` and `dmg` are how many percent MORE than the enemy's base (designed) HP and
// damage that tier starts at, so `hp: 27` means 127% of base HP. Stage 1 of a tier is exactly the row's value; stages 2 and 3
// climb evenly toward the NEXT tier's row without reaching it (stage 2 is a third of the way, stage 3 two thirds), so Tier N
// stage 3 is always a little easier than Tier N+1 stage 1. Tier 20 climbs by the same gap as 19 to 20.
// There is no separate Might any more: the damage column carries all of it.
//
// The starting values were worked out from the old formulas (HP 1 + 0.2t + 0.01t^2, damage +5% a tier plus +1 Might a tier),
// so stage 1 of each tier matches 0.51.0 until you change them. Within a tier the stages rise less steeply than before (Tier I stage 3 was 173% HP, now 145%).

import { FINAL_STAGE } from './mapgen';

export interface TierRow {
  /** percent more than base enemy HP at stage 1 of this tier */
  hp: number;
  /** percent more than base enemy damage at stage 1 of this tier */
  dmg: number;
}

export const TIER_TABLE: readonly TierRow[] = [
  { hp: 50, dmg: 50 }, // Tier 1
  { hp: 100, dmg: 100 }, // Tier 2
  { hp: 200, dmg: 150 }, // Tier 3
  { hp: 300, dmg: 200 }, // Tier 4
  { hp: 450, dmg: 250 }, // Tier 5
  { hp: 500, dmg: 300 }, // Tier 6
  { hp: 650, dmg: 350 }, // Tier 7
  { hp: 700, dmg: 400 }, // Tier 8
  { hp: 850, dmg: 450 }, // Tier 9
  { hp: 900, dmg: 500 }, // Tier 10
  { hp: 1000, dmg: 550 }, // Tier 11
  { hp: 1200, dmg: 600 }, // Tier 12
  { hp: 1400, dmg: 650 }, // Tier 13
  { hp: 1600, dmg: 700 }, // Tier 14
  { hp: 1800, dmg: 750 }, // Tier 15
  { hp: 2000, dmg: 800 }, // Tier 16
  { hp: 2200, dmg: 850 }, // Tier 17
  { hp: 2400, dmg: 900 }, // Tier 18
  { hp: 2600, dmg: 950 }, // Tier 19
  { hp: 3000, dmg: 1000 }, // Tier 20
];

const rowOf = (tier: number): TierRow => {
  const i = Math.max(1, Math.min(TIER_TABLE.length, Math.round(tier))) - 1;
  return TIER_TABLE[i] as TierRow;
};

/** Where this stage of this tier sits: percent of base enemy HP and damage (100 = the designed enemy). */
export function enemyScale(tier: number, stage: number): { hp: number; dmg: number } {
  const here = rowOf(tier);
  const last = tier >= TIER_TABLE.length;
  const next = last ? rowOf(tier) : rowOf(tier + 1);
  const prev = rowOf(tier - 1);
  // the top tier has no next row: it keeps climbing by the gap that led into it
  const hpGap = last ? here.hp - prev.hp : next.hp - here.hp;
  const dmgGap = last ? here.dmg - prev.dmg : next.dmg - here.dmg;
  const through = (Math.max(1, Math.min(FINAL_STAGE, stage)) - 1) / FINAL_STAGE;
  return {
    hp: Math.round(100 + here.hp + hpGap * through),
    dmg: Math.round(100 + here.dmg + dmgGap * through),
  };
}
