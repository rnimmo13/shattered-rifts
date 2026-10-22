import type { CardDef } from '@sr/engine';

/** 🦴 Wyldmaw Commons (02_CARDS §4). */
export const WYLDMAW: CardDef[] = [
  {
    id: 'WYL-01',
    name: 'Gnashling',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 1,
    power: 2,
    guard: 1,
    tribes: ['Beast'],
    abilities: [
      {
        kind: 'onDevoured',
        effects: [
          {
            op: 'buff',
            target: { pick: 'eventSource' },
            power: 1,
            guard: 1,
            duration: 'permanent',
          },
        ],
      },
    ],
    text: 'When this is Devoured, the devourer gets an extra +1/+1.',
    collectible: true,
  },
  {
    id: 'WYL-02',
    name: 'Rift Raptor',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 2,
    power: 3,
    guard: 2,
    tribes: ['Beast'],
    keywords: ['evolve'],
    abilities: [
      {
        kind: 'whenever',
        event: { type: 'unitDied', side: 'enemy', killedBySelf: true, cause: 'combat' },
        effects: [{ op: 'transform', target: { pick: 'self' }, into: 'TOK-RAVAGER' }],
      },
    ],
    text: '**Evolve:** after this destroys an enemy unit in combat, transform into **Rift Ravager**.',
    collectible: true,
  },
  {
    id: 'WYL-03',
    name: 'Acid Spitter',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 2,
    power: 2,
    guard: 2,
    tribes: ['Beast'],
    abilities: [
      {
        kind: 'onSummon',
        effects: [{ op: 'corrode', target: { pick: 'chosen', side: 'enemy', zone: 'units' } }],
      },
    ],
    text: 'When summoned: **Corrode** an enemy unit.',
    collectible: true,
  },
  {
    id: 'WYL-04',
    name: 'Ravenous Packhound',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 3,
    power: 2,
    guard: 3,
    tribes: ['Beast'],
    abilities: [
      {
        kind: 'static',
        modifier: {
          type: 'powerPerCount',
          count: { side: 'friendly', filter: { tribe: 'Beast', notSelf: true } },
          amount: 1,
        },
      },
    ],
    text: 'Has +1 Power for each other friendly Beast.',
    collectible: true,
  },
  {
    id: 'WYL-05',
    name: 'Maw Brute',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 4,
    power: 4,
    guard: 4,
    tribes: ['Beast'],
    keywords: ['devour'],
    abilities: [
      {
        kind: 'onSummon',
        optional: true,
        effects: [
          {
            op: 'destroy',
            devour: true,
            target: { pick: 'chosen', side: 'friendly', zone: 'units', filter: { notSelf: true } },
          },
          { op: 'buff', target: { pick: 'self' }, power: 3, guard: 3, duration: 'permanent' },
        ],
      },
    ],
    text: '**Devour:** gain +3/+3.',
    collectible: true,
  },
  {
    id: 'WYL-08',
    name: 'Blood Frenzy',
    realm: 'wyldmaw',
    type: 'spell',
    rarity: 'common',
    cost: 2,
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          {
            op: 'buff',
            target: { pick: 'chosen', side: 'friendly', zone: 'units' },
            power: 3,
            duration: 'turn',
          },
          {
            op: 'grant',
            target: { pick: 'chosen', side: 'friendly', zone: 'units' },
            keyword: 'blitz',
            duration: 'turn',
          },
        ],
      },
    ],
    text: 'Give a friendly unit +3 Power and **Blitz** this turn.',
    collectible: true,
  },
  {
    id: 'WYL-09',
    name: 'Primal Feast',
    realm: 'wyldmaw',
    type: 'spell',
    rarity: 'common',
    cost: 1,
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          { op: 'destroy', target: { pick: 'chosen', side: 'friendly', zone: 'units' } },
          { op: 'draw', player: 'self', amount: 2 },
        ],
      },
    ],
    text: 'Destroy a friendly unit. Draw 2 cards.',
    collectible: true,
  },
  {
    id: 'WYL-11',
    name: 'Bone Pit',
    realm: 'wyldmaw',
    type: 'trap',
    rarity: 'common',
    cost: 2,
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'attackDeclared', side: 'enemy' },
        effects: [
          {
            op: 'conditional',
            if: { eventSource: { maxGuard: 3 } },
            then: [{ op: 'destroy', target: { pick: 'eventSource' } }],
          },
        ],
      },
    ],
    text: 'Trigger: When an enemy attacks. Destroy the attacker if its Guard is 3 or less.',
    collectible: true,
  },
  {
    id: 'WYL-15',
    name: 'Carrion Picker',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 3,
    power: 3,
    guard: 3,
    tribes: ['Beast'],
    abilities: [
      {
        kind: 'whenever',
        event: { type: 'unitDied', side: 'friendly', filter: { notSelf: true } },
        effects: [{ op: 'buff', target: { pick: 'self' }, power: 1, duration: 'permanent' }],
      },
    ],
    text: 'Whenever another friendly unit dies: gain +1 Power.',
    collectible: true,
  },
  {
    id: 'WYL-16',
    name: 'Ironhide Charger',
    realm: 'wyldmaw',
    type: 'unit',
    rarity: 'common',
    cost: 5,
    power: 5,
    guard: 5,
    tribes: ['Beast'],
    keywords: ['guardian'],
    abilities: [
      {
        kind: 'onDevoured',
        effects: [
          {
            op: 'grant',
            target: { pick: 'eventSource' },
            keyword: 'guardian',
            duration: 'permanent',
          },
        ],
      },
    ],
    text: '**Guardian**. When this is Devoured, the devourer gains **Guardian**.',
    collectible: true,
  },
];
