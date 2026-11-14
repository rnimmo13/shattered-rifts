// Boons: passives that last a whole run (docs/03_CAMPAIGN.md §5.1, Combat v2). Elites often drop them, the merchant sells one, some
// events and bargains give one; clearing a loop may leave one. The engine handles mana / handSize / fightStart / turnStart; the
// campaign handles maxHp / healAfterFight / shardsPerFight. Boons never appear in PvP.
//
// Boons have no rarity: every one is worth about the same, 7-15 points a fight (DECISIONS #497; docs/14_CARD_COSTING.md §16). Nothing
// here gives Mana every turn (DECISIONS #496, #516); an extra card every turn is only ever a Warden's Heart, at a price.

import type { BoonDef } from '@sr/combat';
import { barrier, draw, heal, status } from './build';

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
    name: 'Rift Heart',
    heart: true,
    text: 'Ordinary card offers have a 20% Rift-Crossed chance per card instead of 3%. Rift-Crossed events have triple selection weight, and new maps have triple the chance of Rift-Crossed merchants. Earn 25% fewer shards from fight victories.',
    crossedOfferPct: 20,
    fightShardsPct: -25,
  },
  {
    id: 'gluttons-heart',
    name: "Glutton's Heart",
    heart: true,
    text: 'Draw one card more every turn. 5% less Max HP (rounded down, minimum 1 HP).',
    handSize: 1,
    maxHpPct: -5,
  },
  {
    id: 'blood-heart',
    name: 'Blood Heart',
    heart: true,
    text: 'Your cards deal 25% more damage, excluding HP payments, companions, totems and status damage. Start each fight with 3 turns of Faltering.',
    cardDamagePct: 25,
    fightStart: [status('faltering', 3)],
  },
  {
    id: 'thorned-heart',
    name: 'Gilded Heart',
    heart: true,
    text: 'Earn 40% more shards from fight victories. Ordinary card offers contain no Rift-Crossed cards. Explicit Rift-Crossed events and merchants are unchanged.',
    crossedOfferPct: 0,
    fightShardsPct: 40,
  },
  {
    id: 'warded-heart',
    name: 'Warded Heart',
    heart: true,
    text: 'Gain 25% more Barrier from your cards. Start each fight with 3 turns of Brittle.',
    cardBarrierPct: 25,
    fightStart: [status('brittle', 3)],
  },
  {
    id: 'resurgent-heart',
    name: 'Resurgent Heart',
    heart: true,
    text: 'Once each fight, a hit that would take you to half HP or below stops at half HP, then grants 25% of your Max HP as Barrier (rounded up). Start each fight with 3 turns of Exposed. Starting below half HP does not heal you.',
    rise: [{ atPct: 50, barrierPct: 25, might: 0 }],
    fightStart: [status('exposed', 3)],
  },
];
