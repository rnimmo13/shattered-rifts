// Test-only cards for engine rules tests. They exercise generic mechanics without depending on
// @sr/content (which depends on the engine). Real cards are tested in packages/content.

import type { CardDef } from '../types';

const unit = (id: string, power: number, guard: number, extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name: id,
  realm: 'neutral',
  type: 'unit',
  rarity: 'common',
  cost: Math.max(1, Math.floor((power + guard - 1) / 2)),
  power,
  guard,
  abilities: [],
  text: '',
  collectible: true,
  ...extra,
});

const card = (
  id: string,
  type: CardDef['type'],
  cost: number,
  extra: Partial<CardDef> = {},
): CardDef => ({
  id,
  name: id,
  realm: 'neutral',
  type,
  rarity: 'common',
  cost,
  abilities: [],
  text: '',
  collectible: true,
  ...extra,
});

export const FIXTURE_CARDS: CardDef[] = [
  card('TOK-SPARK', 'spell', 0, {
    keywords: ['swift'],
    collectible: false,
    abilities: [{ kind: 'onResolve', effects: [{ op: 'gainAether', player: 'self', amount: 1 }] }],
  }),
  unit('TST-FILLER', 1, 1, { cost: 1 }),
  unit('TST-2-2', 2, 2, { cost: 2 }),
  unit('TST-3-3', 3, 3, { cost: 3 }),
  unit('TST-5-5', 5, 5, { cost: 5 }),
  unit('TST-GUARD', 1, 4, { cost: 2, keywords: ['guardian'] }),
  unit('TST-BLITZ', 2, 1, { cost: 2, keywords: ['blitz'] }),
  unit('TST-PIERCE', 4, 2, { cost: 3, keywords: ['pierce'] }),
  unit('TST-LIFEBIND', 2, 3, { cost: 3, keywords: ['lifebind'] }),
  unit('TST-VEILED', 3, 2, { cost: 3, keywords: ['veiled'] }),
  unit('TST-SHIELD', 2, 2, { cost: 2, keywords: ['shield'] }),
  unit('TST-WARD', 2, 2, { cost: 2, keywords: ['ward'] }),
  unit('TST-CANTATTACK', 0, 4, {
    cost: 2,
    abilities: [{ kind: 'static', modifier: { type: 'cantAttack' } }],
  }),
  unit('TST-TOKEN', 1, 1, { type: 'token', cost: 0, collectible: false }),
  unit('TST-AMBUSH', 1, 2, {
    cost: 3,
    params: { ambush: true },
    keywords: ['ambush'],
    abilities: [
      {
        kind: 'onFlip',
        effects: [{ op: 'damage', target: { pick: 'chosen', side: 'enemy' }, amount: 2 }],
      },
    ],
  }),
  unit('TST-ECHO', 2, 2, { cost: 2, params: { echo: 3 }, keywords: ['echo'] }),
  unit('TST-ASCEND', 6, 6, { cost: 8, ascend: { destroy: 2 }, keywords: ['ascend'] }),
  unit('TST-QUICK', 1, 3, {
    cost: 2,
    abilities: [
      {
        kind: 'activated',
        quick: true,
        cost: 1,
        oncePerTurn: true,
        effects: [{ op: 'damage', target: { pick: 'riftwalker', side: 'enemy' }, amount: 1 }],
      },
    ],
  }),
  unit('TST-SUMMONER', 1, 1, {
    cost: 1,
    abilities: [{ kind: 'onSummon', effects: [{ op: 'summon', card: 'TST-TOKEN', count: 1 }] }],
  }),
  unit('TST-DEVOUR', 3, 3, {
    cost: 3,
    keywords: ['devour'],
    abilities: [
      {
        kind: 'onSummon',
        optional: true,
        effects: [
          {
            op: 'destroy',
            devour: true,
            target: { pick: 'chosen', side: 'friendly', filter: { notSelf: true } },
          },
          { op: 'buff', target: { pick: 'self' }, power: 2, guard: 2, duration: 'permanent' },
        ],
      },
    ],
  }),
  unit('TST-DEATHDRAW', 1, 1, {
    cost: 1,
    abilities: [{ kind: 'onDeath', effects: [{ op: 'draw', player: 'self', amount: 1 }] }],
  }),
  unit('TST-WATCHER', 1, 3, {
    cost: 2,
    abilities: [
      {
        kind: 'whenever',
        event: { type: 'unitDied', side: 'friendly', filter: { notSelf: true } },
        effects: [{ op: 'buff', target: { pick: 'self' }, power: 1, duration: 'permanent' }],
      },
    ],
  }),
  unit('TST-ENEMYWATCHER', 1, 3, {
    cost: 2,
    abilities: [
      {
        kind: 'whenever',
        event: { type: 'unitDied', side: 'enemy' },
        effects: [{ op: 'damage', target: { pick: 'riftwalker', side: 'enemy' }, amount: 1 }],
      },
    ],
  }),
  unit('TST-EOT-PINGER', 0, 3, {
    cost: 2,
    abilities: [
      {
        kind: 'endOfTurn',
        effects: [{ op: 'damage', target: { pick: 'riftwalker', side: 'enemy' }, amount: 1 }],
      },
    ],
  }),
  unit('TST-HEALER', 1, 3, {
    cost: 2,
    abilities: [
      {
        kind: 'endOfTurn',
        effects: [
          {
            op: 'heal',
            target: { pick: 'chosen', side: 'friendly', filter: { damaged: true } },
            amount: 2,
          },
        ],
      },
    ],
  }),
  unit('TST-SCRY', 1, 1, {
    cost: 1,
    abilities: [{ kind: 'onSummon', effects: [{ op: 'scry', player: 'self', amount: 2 }] }],
  }),
  unit('TST-RESO', 2, 2, {
    cost: 2,
    abilities: [
      {
        kind: 'onSummon',
        effects: [],
        resonance: { n: 3, effects: [{ op: 'draw', player: 'self', amount: 1 }] },
      },
    ],
  }),
  unit('TST-OVERCLOCK', 2, 2, {
    cost: 2,
    params: { overclock: 1 },
    keywords: ['overclock'],
    abilities: [
      {
        kind: 'onSummon',
        overclock: true,
        effects: [{ op: 'buff', target: { pick: 'self' }, power: 2, duration: 'permanent' }],
      },
    ],
  }),
  card('TST-BOLT', 'spell', 1, {
    keywords: ['swift'],
    abilities: [
      { kind: 'onResolve', effects: [{ op: 'damage', target: { pick: 'chosen' }, amount: 2 }] },
    ],
  }),
  card('TST-SLOWBOLT', 'spell', 1, {
    abilities: [
      { kind: 'onResolve', effects: [{ op: 'damage', target: { pick: 'chosen' }, amount: 2 }] },
    ],
  }),
  card('TST-NOVA', 'spell', 1, {
    abilities: [
      {
        kind: 'onResolve',
        effects: [{ op: 'damage', target: { pick: 'riftwalker', side: 'any' }, amount: 5 }],
      },
    ],
  }),
  card('TST-DRAW', 'spell', 1, {
    abilities: [{ kind: 'onResolve', effects: [{ op: 'draw', player: 'self', amount: 2 }] }],
  }),
  card('TST-RECALL', 'spell', 2, {
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          { op: 'returnToHand', target: { pick: 'chosen', side: 'friendly' } },
          { op: 'draw', player: 'self', amount: 1 },
        ],
      },
    ],
  }),
  card('TST-PIT', 'trap', 2, {
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'attackDeclared', side: 'enemy' },
        effects: [{ op: 'destroy', target: { pick: 'eventSource' } }],
      },
    ],
  }),
  card('TST-LOCK', 'trap', 3, {
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'attackDeclared', side: 'enemy' },
        effects: [
          { op: 'negate', link: 'trigger' },
          { op: 'stun', target: { pick: 'eventSource' } },
        ],
      },
    ],
  }),
  card('TST-NULL', 'trap', 3, {
    abilities: [
      {
        kind: 'trigger',
        event: [
          { type: 'trapActivated', side: 'enemy' },
          { type: 'swiftCast', side: 'enemy' },
        ],
        effects: [{ op: 'negate', link: 'trigger' }],
      },
    ],
  }),
  card('TST-GRID', 'trap', 2, {
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'unitSummoned', side: 'enemy' },
        effects: [{ op: 'damage', target: { pick: 'eventSource' }, amount: 3 }],
      },
    ],
  }),
  card('TST-REBUKE', 'trap', 3, {
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'spellCast', side: 'enemy' },
        effects: [{ op: 'negate', link: 'trigger' }],
      },
    ],
  }),
  card('TST-RELIC', 'relic', 1, {
    params: { charges: 2 },
    keywords: ['charges'],
    abilities: [
      {
        kind: 'startOfTurn',
        effects: [
          { op: 'draw', player: 'self', amount: 1 },
          { op: 'removeCharge', target: { pick: 'self' } },
        ],
      },
    ],
  }),
  card('TST-AURA', 'relic', 2, {
    abilities: [{ kind: 'static', modifier: { type: 'aura', side: 'friendly', power: 1 } }],
  }),
  card('TST-RIFT', 'rift', 2, {
    abilities: [
      {
        kind: 'startOfTurn',
        effects: [{ op: 'heal', target: { pick: 'riftwalker', side: 'friendly' }, amount: 1 }],
      },
    ],
  }),
  card('TST-RIFT2', 'rift', 2),
  card('TST-OVERCHARGE', 'spell', 1, {
    keywords: ['swift'],
    abilities: [
      {
        kind: 'onResolve',
        effects: [
          { op: 'buff', target: { pick: 'chosen', side: 'friendly' }, power: 3, duration: 'turn' },
          {
            op: 'atEndOfTurn',
            effects: [{ op: 'damage', target: { pick: 'linkTarget' }, amount: 1 }],
          },
        ],
      },
    ],
  }),
  card('TST-TEMPGUARD', 'spell', 1, {
    keywords: ['swift'],
    abilities: [
      {
        kind: 'onResolve',
        effects: [{ op: 'buff', target: { pick: 'chosen' }, guard: 2, duration: 'turn' }],
      },
    ],
  }),
  card('TST-LOOP-TRAP', 'trap', 0, {
    abilities: [
      {
        kind: 'trigger',
        event: { type: 'trapActivated', side: 'any' },
        effects: [],
      },
    ],
  }),
  {
    id: 'SIG-TEST',
    name: 'Test Sigil',
    realm: 'neutral',
    type: 'sigil',
    rarity: 'common',
    cost: 0,
    abilities: [{ kind: 'duelStart', effects: [{ op: 'summon', card: 'TST-TOKEN', count: 1 }] }],
    text: '',
    collectible: false,
  },
];

export const FIXTURE_DB: Readonly<Record<string, CardDef>> = Object.fromEntries(
  FIXTURE_CARDS.map((c) => [c.id, c]),
);
