// Potions: one-use items, carried up to three at a time, used for free during your turn.
// Dropped by fights and sold by the merchant.

import type { PotionDef } from '@sr/combat';
import { barrier, dmg, draw, heal, mana, status } from './build';

export const POTIONS: PotionDef[] = [
  {
    id: 'fire-flask',
    name: 'Fire Flask',
    rarity: 'common',
    text: 'Deal 14 damage to an enemy.',
    target: 'foe',
    effects: [dmg(14)],
  },
  {
    id: 'guard-draught',
    name: 'Guard Draught',
    rarity: 'common',
    text: 'Gain 14 Barrier.',
    target: 'none',
    effects: [barrier(14)],
  },
  {
    id: 'mana-vial',
    name: 'Mana Vial',
    rarity: 'common',
    text: 'Gain 2 Mana.',
    target: 'none',
    effects: [mana(2)],
  },
  {
    id: 'swift-draught',
    name: 'Swift Draught',
    rarity: 'common',
    text: 'Draw 3 cards.',
    target: 'none',
    effects: [draw(3)],
  },
  {
    id: 'might-tonic',
    name: 'Might Tonic',
    rarity: 'uncommon',
    text: 'Gain 2 Might.',
    target: 'none',
    effects: [status('might', 2)],
  },
  {
    id: 'healing-philtre',
    name: 'Healing Philtre',
    rarity: 'uncommon',
    text: 'Heal 18 HP.',
    target: 'none',
    effects: [heal(18)],
  },
  {
    id: 'ember-bomb',
    name: 'Ember Bomb',
    rarity: 'uncommon',
    text: 'Deal 9 damage to ALL enemies.',
    target: 'none',
    effects: [dmg(9, 'allFoes')],
  },
  {
    id: 'frost-phial',
    name: 'Frost Phial',
    rarity: 'uncommon',
    text: 'Apply 3 Exposed and 2 Faltering to ALL enemies.',
    target: 'none',
    effects: [status('exposed', 3, 'allFoes'), status('faltering', 2, 'allFoes')],
  },
  {
    id: 'stun-tonic',
    name: 'Stun Tonic',
    rarity: 'uncommon',
    text: 'Stun an enemy and apply 1 Exposed.',
    target: 'foe',
    effects: [status('stunned', 1, 'target'), status('exposed', 1, 'target')],
  },
  {
    id: 'ward-elixir',
    name: 'Ward Elixir',
    rarity: 'rare',
    text: 'Gain 2 Shielded and 3 Thorns.',
    target: 'none',
    effects: [status('shielded', 2), status('thorns', 3)],
  },
];
