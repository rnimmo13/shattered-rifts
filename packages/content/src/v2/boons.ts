// Boons: passives that last a whole run (docs/03_CAMPAIGN.md §5.1, Combat v2). Elites often drop them, the merchant sells one, some
// events and bargains give one; clearing a loop may leave one. The engine handles mana / handSize / fightStart / turnStart; the
// campaign handles maxHp / healAfterFight / shardsPerFight. Boons never appear in PvP.
//
// Boons have no rarity: every one is worth about the same, 7-15 points a fight (DECISIONS #497; docs/14_CARD_COSTING.md §16). Nothing
// here gives Mana every turn (DECISIONS #496, #516); an extra card every turn is only ever a Warden's Heart, at a price.

import type { BoonDef } from '@sr/combat';
import { barrier, draw, heal, lose, status } from './build';

export const BOONS: BoonDef[] = [
  {
    id: 'iron-sigil',
    name: 'Iron Sigil',
    text: 'Start each fight with 6 Barrier.',
    fightStart: [barrier(6)],
  },
  {
    id: 'thorn-charm',
    name: 'Thorn Charm',
    text: 'Start each fight with 2 Thorns.',
    fightStart: [status('thorns', 2)],
  },
  {
    id: 'might-idol',
    name: 'Idol of Might',
    text: 'Start each fight with 1 Might.',
    fightStart: [status('might', 1)],
  },
  {
    id: 'ember-lamp',
    name: 'Ember Lamp',
    text: 'Gain 2 Barrier at the start of each of your turns.',
    turnStart: [barrier(2)],
  },
  {
    id: 'healing-vial',
    name: 'Healing Vial',
    text: 'Heal 6 HP after every fight.',
    healAfterFight: 6,
  },
  {
    id: 'rift-satchel',
    name: 'Rift Satchel',
    text: 'Draw 2 more cards on the first turn of each fight.',
    fightStart: [draw(2)],
  },
  {
    id: 'crystal-heart',
    name: 'Crystal Heart',
    text: 'Gain 12 max HP.',
    maxHp: 12,
  },
  {
    id: 'coin-purse',
    name: 'Shard Purse',
    text: 'Gain 6 extra shards after every fight.',
    shardsPerFight: 6,
  },
  {
    id: 'vigor-wick',
    name: 'Vigor Wick',
    text: 'Heal 1 HP at the start of each of your turns.',
    turnStart: [heal(1)],
  },
  {
    id: 'hex-lantern',
    name: 'Hex Lantern',
    text: 'Every enemy starts each fight Faltering for 2 turns.',
    fightStart: [status('faltering', 2, 'allFoes')],
  },
  {
    id: 'hunters-lens',
    name: "Hunter's Lens",
    text: 'Every enemy starts each fight Exposed for 1 turn.',
    fightStart: [status('exposed', 1, 'allFoes')],
  },
  {
    id: 'aegis-of-ages',
    name: 'Aegis of Ages',
    text: 'Start each fight Shielded: ignore the first hit.',
    fightStart: [status('shielded', 1)],
  },
  {
    id: 'gilded-crown',
    name: 'The Gilded Crown',
    text: 'Gain 6 max HP, and heal 3 HP after every fight.',
    maxHp: 6,
    healAfterFight: 3,
  },
];

/**
 * Warden's Hearts (DECISIONS #246): offered instead of the Warden's Gift card (take a rare card, a Heart, or nothing). Each one changes
 * how every fight plays, and each one costs something real. A run holds one at a time: taking another gives the first back.
 */
export const HEARTS: BoonDef[] = [
  {
    id: 'ember-heart',
    name: 'Ember Heart',
    heart: true,
    text: 'At the start of each of your turns, a random enemy gains 3 Burn. You start each fight with 2 Burn.',
    fightStart: [status('burn', 2)],
    turnStart: [status('burn', 3, 'randomFoe')],
  },
  {
    id: 'gluttons-heart',
    name: "Glutton's Heart",
    heart: true,
    text: 'Draw one card more every turn. 20 less Max HP.',
    handSize: 1,
    maxHp: -20,
  },
  {
    id: 'blood-heart',
    name: 'Blood Heart',
    heart: true,
    text: 'Start each fight with 3 Might. Lose 2 HP at the start of each of your turns.',
    fightStart: [status('might', 3)],
    turnStart: [lose(2)],
  },
  {
    id: 'thorned-heart',
    name: 'Thorned Heart',
    heart: true,
    text: 'Start each fight with 4 Thorns and 2 Might, and Exposed for 2 turns.',
    fightStart: [status('thorns', 4), status('might', 2), status('exposed', 2)],
  },
  {
    id: 'warded-heart',
    name: 'Warded Heart',
    heart: true,
    text: 'Start each fight Shielded, with 7 Plating. At the start of each of your turns, become Brittle (the Barrier you gain is 25% smaller).',
    fightStart: [status('shielded', 1), status('plating', 7)],
    turnStart: [status('brittle', 1)],
  },
];
