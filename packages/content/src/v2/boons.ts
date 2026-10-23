// Boons: passives that last a whole run (docs/03_CAMPAIGN.md §5.1, Combat v2). Elites and Wardens drop them, the merchant
// sells one. The engine handles mana / handSize / fightStart / turnStart; the campaign handles maxHp / healAfterFight /
// shardsPerFight. Boons never appear in PvP.

import type { BoonDef } from '@sr/combat';
import { barrier, draw, heal, status } from './build';

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
    id: 'ward-stone',
    name: 'Ward Stone',
    rarity: 'common',
    text: 'Start each fight Shielded: ignore the first hit.',
    fightStart: [status('shielded', 1)],
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
    text: 'Draw 1 more card each turn.',
    handSize: 1,
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
  // rare
  {
    id: 'rift-core',
    name: 'Rift Core',
    rarity: 'rare',
    text: 'Gain 1 extra Mana each turn.',
    mana: 1,
  },
  {
    id: 'scholars-tome',
    name: "Scholar's Tome",
    rarity: 'rare',
    text: 'Draw 1 extra card at the start of each of your turns.',
    turnStart: [draw(1)],
  },
];
