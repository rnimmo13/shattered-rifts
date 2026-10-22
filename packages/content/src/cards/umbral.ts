import type { CardDef } from '@sr/engine';

/** 👁 Umbral Veil Commons (02_CARDS §4). */
export const UMBRAL: CardDef[] = [
  {
    id: 'UMB-01',
    name: 'Veilshade',
    realm: 'umbral',
    type: 'unit',
    rarity: 'common',
    cost: 1,
    power: 1,
    guard: 2,
    tribes: ['Shade'],
    keywords: ['ambush'],
    params: { ambush: true },
    abilities: [
      {
        kind: 'onFlip',
        effects: [{ op: 'stun', target: { pick: 'chosen', side: 'enemy', zone: 'units' } }],
      },
    ],
    text: '**Ambush**. Flip: **Stun** an enemy unit.',
    collectible: true,
  },
  {
    id: 'UMB-02',
    name: 'Whisper Acolyte',
    realm: 'umbral',
    type: 'unit',
    rarity: 'common',
    cost: 2,
    power: 1,
    guard: 3,
    tribes: ['Human', 'Cultist'],
    abilities: [
      {
        kind: 'static',
        modifier: {
          type: 'costMod',
          side: 'friendly',
          filter: { type: 'trap' },
          amount: -1,
          on: 'activate',
        },
      },
    ],
    text: 'Your Traps cost 1 less to activate.',
    collectible: true,
  },
  {
    id: 'UMB-03',
    name: 'Gloomstalker',
    realm: 'umbral',
    type: 'unit',
    rarity: 'common',
    cost: 3,
    power: 3,
    guard: 3,
    tribes: ['Shade'],
    keywords: ['veiled'],
    abilities: [],
    text: '**Veiled**.',
    collectible: true,
  },
  {
    id: 'UMB-05',
    name: 'Hollow Lurcher',
    realm: 'umbral',
    type: 'unit',
    rarity: 'common',
    cost: 4,
    power: 2,
    guard: 5,
    tribes: ['Shade'],
    keywords: ['ambush'],
    params: { ambush: true },
    abilities: [
      {
        kind: 'onFlip',
        effects: [
          { op: 'damage', target: { pick: 'chosen', side: 'enemy', zone: 'units' }, amount: 3 },
        ],
      },
    ],
    text: '**Ambush**. Flip: deal 3 damage to an enemy unit.',
    collectible: true,
  },
  {
    id: 'UMB-08',
    name: 'Mindrot',
    realm: 'umbral',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    keywords: ['resonance'],
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          {
            op: 'conditional',
            if: { resonanceAtLeast: 3 },
            then: [{ op: 'discardRandom', player: 'enemy', amount: 2 }],
            else: [{ op: 'discardRandom', player: 'enemy', amount: 1 }],
          },
        ],
      },
    ],
    text: 'The enemy discards a random card. **Resonance 3:** two cards instead.',
    collectible: true,
  },
  {
    id: 'UMB-10',
    name: 'Shadow Coil',
    realm: 'umbral',
    type: 'trap',
    rarity: 'common',
    cost: 1,
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'attackDeclared', side: 'enemy' },
        effects: [{ op: 'buff', target: { pick: 'eventSource' }, power: -3, duration: 'turn' }],
      },
    ],
    text: 'Trigger: When an enemy attacks. The attacker gets −3 Power this turn.',
    collectible: true,
  },
  {
    id: 'UMB-16',
    name: 'Whispered Bargain',
    realm: 'umbral',
    type: 'spell',
    rarity: 'common',
    cost: 1,
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          { op: 'draw', player: 'self', amount: 2 },
          { op: 'topdeckFromHand', player: 'self', amount: 1 },
        ],
      },
    ],
    text: 'Draw 2 cards. Then put a card from your hand on top of your deck.',
    collectible: true,
  },
];
