import type { CardDef } from '@sr/engine';

/** ⚙ Nexus-9 Commons (02_CARDS §4). */
export const NEXUS: CardDef[] = [
  {
    id: 'NEX-01',
    name: 'Patrol Drone',
    realm: 'nexus',
    type: 'unit',
    rarity: 'common',
    cost: 1,
    power: 1,
    guard: 1,
    tribes: ['Construct', 'Drone'],
    abilities: [{ kind: 'onSummon', effects: [{ op: 'summon', card: 'TOK-DRONE', count: 1 }] }],
    text: 'When summoned: summon a 1/1 **Drone**.',
    collectible: true,
  },
  {
    id: 'NEX-02',
    name: 'Field Technician',
    realm: 'nexus',
    type: 'unit',
    rarity: 'common',
    cost: 2,
    power: 2,
    guard: 2,
    tribes: ['Human', 'Engineer'],
    keywords: ['overclock'],
    params: { overclock: 1 },
    abilities: [
      {
        kind: 'onSummon',
        overclock: true,
        effects: [
          {
            op: 'buff',
            target: {
              pick: 'chosen',
              side: 'friendly',
              zone: 'units',
              filter: { tribe: 'Construct' },
            },
            power: 2,
            duration: 'permanent',
          },
        ],
      },
    ],
    text: '**Overclock 1:** when summoned, give a friendly Construct +2 Power.',
    collectible: true,
  },
  {
    id: 'NEX-03',
    name: 'Sentry Turret',
    realm: 'nexus',
    type: 'unit',
    rarity: 'common',
    cost: 2,
    power: 0,
    guard: 4,
    tribes: ['Construct'],
    keywords: ['guardian'],
    abilities: [
      { kind: 'static', modifier: { type: 'cantAttack' } },
      {
        kind: 'endOfTurn',
        effects: [
          { op: 'damage', target: { pick: 'random', side: 'enemy', zone: 'units' }, amount: 1 },
        ],
      },
    ],
    text: "**Guardian**. Can't attack. At the end of your turn: deal 1 damage to a random enemy unit.",
    collectible: true,
  },
  {
    id: 'NEX-04',
    name: 'Enforcer Mk.II',
    realm: 'nexus',
    type: 'unit',
    rarity: 'common',
    cost: 3,
    power: 3,
    guard: 3,
    tribes: ['Construct'],
    keywords: ['assemble'],
    abilities: [
      {
        kind: 'onSummon',
        optional: true,
        effects: [
          {
            op: 'assemble',
            target: {
              pick: 'chosen',
              side: 'friendly',
              zone: 'units',
              filter: { tribe: 'Construct', notSelf: true },
            },
          },
        ],
      },
    ],
    text: '**Assemble**.',
    collectible: true,
  },
  {
    id: 'NEX-08',
    name: 'Overcharge',
    realm: 'nexus',
    type: 'spell',
    rarity: 'common',
    cost: 1,
    keywords: ['swift'],
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          {
            op: 'buff',
            target: { pick: 'chosen', zone: 'units', filter: { tribe: 'Construct' } },
            power: 3,
            duration: 'turn',
          },
          {
            op: 'atEndOfTurn',
            effects: [{ op: 'damage', target: { pick: 'linkTarget' }, amount: 1 }],
          },
        ],
      },
    ],
    text: '**Swift**. Give a Construct +3 Power this turn. At the end of turn, it takes 1 damage.',
    collectible: true,
  },
  {
    id: 'NEX-09',
    name: 'Swarm Protocol',
    realm: 'nexus',
    type: 'spell',
    rarity: 'common',
    cost: 3,
    keywords: ['resonance'],
    abilities: [
      {
        kind: 'onResolve',
        effects: [{ op: 'summon', card: 'TOK-DRONE', count: 3 }],
        resonance: {
          n: 3,
          effects: [
            {
              op: 'grant',
              target: { pick: 'summonedByThis' },
              keyword: 'blitz',
              duration: 'permanent',
            },
          ],
        },
      },
    ],
    text: 'Summon three 1/1 **Drones**. **Resonance 3:** they have **Blitz**.',
    collectible: true,
  },
  {
    id: 'NEX-11',
    name: 'Recompile',
    realm: 'nexus',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          { op: 'returnToHand', target: { pick: 'chosen', side: 'friendly', zone: 'units' } },
          { op: 'draw', player: 'self', amount: 1 },
        ],
      },
    ],
    text: 'Return a friendly unit to your hand. Draw a card.',
    collectible: true,
  },
  {
    id: 'NEX-12',
    name: 'Countermeasure Grid',
    realm: 'nexus',
    type: 'trap',
    rarity: 'common',
    cost: 2,
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'unitSummoned', side: 'enemy' },
        effects: [{ op: 'damage', target: { pick: 'eventSource' }, amount: 3 }],
      },
    ],
    text: 'Trigger: When an enemy unit is summoned. Deal 3 damage to it.',
    collectible: true,
  },
  {
    id: 'NEX-16',
    name: 'Salvage Bot',
    realm: 'nexus',
    type: 'unit',
    rarity: 'common',
    cost: 2,
    power: 2,
    guard: 1,
    tribes: ['Construct'],
    abilities: [{ kind: 'onDeath', effects: [{ op: 'draw', player: 'self', amount: 1 }] }],
    text: 'When this dies: draw a card.',
    collectible: true,
  },
];
