// Boons: passives that last a whole run (docs/03_CAMPAIGN.md §5.1, Combat v2). Elites drop them, the merchant sells one, some
// events and bargains give one; clearing a loop may leave a Legendary one. The engine handles mana / handSize / fightStart /
// turnStart; the campaign handles maxHp / healAfterFight / shardsPerFight. Boons never appear in PvP.
//
// Rarity is how often a Boon turns up (rewards.ts, BOON_WEIGHTS). Legendary Boons are the ones that change every turn of every
// fight (an extra Mana, an extra card): they are the rarest, never sold, and mostly come from clearing a loop (DECISIONS #227).

import type { BoonDef } from '@sr/combat';
import { barrier, draw, heal, lose, status } from './build';

export const BOONS: BoonDef[] = [
  // common
  {
    id: 'iron-sigil',
    name: 'Iron Sigil',
    rarity: 'common',
    text: 'Start each fight with 6 Barrier.',
    fightStart: [barrier(6)],
  },
  {
    id: 'thorn-charm',
    name: 'Thorn Charm',
    rarity: 'common',
    text: 'Start each fight with 2 Thorns.',
    fightStart: [status('thorns', 2)],
  },
  {
    id: 'might-idol',
    name: 'Idol of Might',
    rarity: 'common',
    text: 'Start each fight with 1 Might.',
    fightStart: [status('might', 1)],
  },
  {
    id: 'ember-lamp',
    name: 'Ember Lamp',
    rarity: 'common',
    text: 'Gain 2 Barrier at the start of each of your turns.',
    turnStart: [barrier(2)],
  },
  {
    id: 'healing-vial',
    name: 'Healing Vial',
    rarity: 'common',
    text: 'Heal 6 HP after every fight.',
    healAfterFight: 6,
  },
  // uncommon
  {
    id: 'rift-satchel',
    name: 'Rift Satchel',
    rarity: 'uncommon',
    text: 'Draw 2 more cards on the first turn of each fight.',
    fightStart: [draw(2)],
  },
  {
    id: 'crystal-heart',
    name: 'Crystal Heart',
    rarity: 'uncommon',
    text: 'Gain 12 max HP.',
    maxHp: 12,
  },
  {
    id: 'coin-purse',
    name: 'Shard Purse',
    rarity: 'uncommon',
    text: 'Gain 10 extra shards after every fight.',
    shardsPerFight: 10,
  },
  {
    id: 'vigor-wick',
    name: 'Vigor Wick',
    rarity: 'uncommon',
    text: 'Heal 2 HP at the start of each of your turns.',
    turnStart: [heal(2)],
  },
  {
    id: 'hex-lantern',
    name: 'Hex Lantern',
    rarity: 'uncommon',
    text: 'Every enemy starts each fight Faltering for 2 turns.',
    fightStart: [status('faltering', 2, 'allFoes')],
  },
  // rare
  {
    id: 'battle-standard',
    name: 'Battle Standard',
    rarity: 'rare',
    text: 'Start each fight with 2 Might.',
    fightStart: [status('might', 2)],
  },
  {
    id: 'hunters-lens',
    name: "Hunter's Lens",
    rarity: 'rare',
    text: 'Every enemy starts each fight Exposed for 2 turns.',
    fightStart: [status('exposed', 2, 'allFoes')],
  },
  {
    id: 'phoenix-ember',
    name: 'Phoenix Ember',
    rarity: 'rare',
    text: 'Heal 15 HP after every fight.',
    healAfterFight: 15,
  },
  // legendary
  {
    id: 'rift-core',
    name: 'Rift Core',
    rarity: 'legendary',
    text: 'Gain 1 extra Mana each turn.',
    mana: 1,
  },
  {
    id: 'scholars-tome',
    name: "Scholar's Tome",
    rarity: 'legendary',
    text: 'Draw 1 extra card at the start of each of your turns.',
    turnStart: [draw(1)],
  },
  {
    id: 'aegis-of-ages',
    name: 'Aegis of Ages',
    rarity: 'legendary',
    text: 'Start each fight Shielded: ignore the first hit.',
    fightStart: [status('shielded', 1)],
  },
  {
    id: 'gilded-crown',
    name: 'The Gilded Crown',
    rarity: 'legendary',
    text: 'Gain 25 max HP, and heal 10 HP after every fight.',
    maxHp: 25,
    healAfterFight: 10,
  },
];

/** The Legendary Boons: the rarest, never sold (rewards.ts). */
export const LEGENDARY_BOONS = BOONS.filter((b) => b.rarity === 'legendary').map((b) => b.id);

/**
 * Warden's Hearts (DECISIONS #246): offered instead of the Warden's Gift card (take a rare card, a Heart, or nothing). Each one changes
 * how every fight plays, and each one costs something real. A run holds one at a time: taking another gives the first back.
 */
export const HEARTS: BoonDef[] = [
  {
    id: 'ember-heart',
    name: 'Ember Heart',
    rarity: 'legendary',
    heart: true,
    text: '+1 Mana every turn. Draw one card fewer every turn.',
    mana: 1,
    handSize: -1,
  },
  {
    id: 'gluttons-heart',
    name: "Glutton's Heart",
    rarity: 'legendary',
    heart: true,
    text: 'Draw one card more every turn. 15 less Max HP.',
    handSize: 1,
    maxHp: -15,
  },
  {
    id: 'blood-heart',
    name: 'Blood Heart',
    rarity: 'legendary',
    heart: true,
    text: '+1 Mana every turn. Lose 3 HP at the start of each of your turns.',
    mana: 1,
    turnStart: [lose(3)],
  },
  {
    id: 'thorned-heart',
    name: 'Thorned Heart',
    rarity: 'legendary',
    heart: true,
    text: 'Start each fight with 6 Thorns and 2 Might, and Exposed for 2 turns.',
    fightStart: [status('thorns', 6), status('might', 2), status('exposed', 2)],
  },
  {
    id: 'warded-heart',
    name: 'Warded Heart',
    rarity: 'legendary',
    heart: true,
    text: 'Start each fight with 16 Barrier and Shielded. At the start of each of your turns, become Brittle (the Barrier you gain is 25% smaller).',
    fightStart: [barrier(16), status('shielded', 1)],
    turnStart: [status('brittle', 1)],
  },
];
