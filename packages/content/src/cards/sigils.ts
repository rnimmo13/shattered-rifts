import type { CardDef } from '@sr/engine';

/** Character Sigils: non-card passives, live from the start of every duel (02_CARDS §5.1). */
export const SIGILS: CardDef[] = [
  {
    id: 'SIG-MAREN',
    name: 'Oathbound',
    realm: 'aurelion',
    type: 'sigil',
    rarity: 'common',
    cost: 0,
    abilities: [
      {
        kind: 'whenever',
        event: { type: 'unitSummoned', side: 'friendly' },
        oncePerGame: true,
        effects: [
          {
            op: 'grant',
            target: { pick: 'eventSource' },
            keyword: 'shield',
            duration: 'permanent',
          },
        ],
      },
    ],
    text: 'Your first unit each duel gains **Shield**.',
    collectible: false,
  },
  {
    id: 'SIG-RIVET',
    name: 'Spare Parts',
    realm: 'nexus',
    type: 'sigil',
    rarity: 'common',
    cost: 0,
    abilities: [{ kind: 'duelStart', effects: [{ op: 'summon', card: 'TOK-DRONE', count: 1 }] }],
    text: 'Start each duel with a 1/1 **Drone**.',
    collectible: false,
  },
  {
    id: 'SIG-KESH',
    name: 'Pack Hunger',
    realm: 'wyldmaw',
    type: 'sigil',
    rarity: 'common',
    cost: 0,
    abilities: [
      {
        kind: 'whenever',
        event: { type: 'devoured', side: 'friendly' },
        oncePerGame: true,
        effects: [{ op: 'draw', player: 'self', amount: 1 }],
      },
    ],
    text: 'The first time you Devour each duel, draw a card.',
    collectible: false,
  },
  {
    id: 'SIG-VESPER',
    name: 'Sleight',
    realm: 'umbral',
    type: 'sigil',
    rarity: 'common',
    cost: 0,
    abilities: [
      {
        kind: 'duelStart',
        effects: [
          { op: 'setFrom', zone: 'deck', filter: { type: 'trap' }, choose: 'random', free: true },
        ],
      },
    ],
    text: 'At the start of each duel, set a random Trap from your deck.',
    collectible: false,
  },
];
