// A tiny sample ruleset used by the tests and the CLI fight. The real cards, heroes and enemies live in
// packages/content (milestone C2); nothing here ships in the game.

import type { PotionDef, BoonDef, CardDef, CombatDb, HeroDef, UnitDef } from './types';

const card = (c: CardDef): [string, CardDef] => [c.id, c];

export const SAMPLE_CARDS: Record<string, CardDef> = Object.fromEntries([
  card({
    id: 'strike',
    name: 'Strike',
    kind: 'attack',
    cost: 1,
    target: 'foe',
    effects: [{ op: 'damage', amount: 6, to: 'target' }],
  }),
  card({
    id: 'defend',
    name: 'Defend',
    kind: 'skill',
    cost: 1,
    target: 'none',
    effects: [{ op: 'barrier', amount: 5, to: 'self' }],
  }),
  card({
    id: 'bash',
    name: 'Bash',
    kind: 'attack',
    cost: 2,
    target: 'foe',
    effects: [
      { op: 'damage', amount: 8, to: 'target' },
      { op: 'status', status: 'exposed', amount: 2, to: 'target' },
    ],
  }),
  card({
    id: 'cleave',
    name: 'Cleave',
    kind: 'attack',
    cost: 1,
    target: 'none',
    effects: [{ op: 'damage', amount: 4, to: 'allFoes' }],
  }),
  card({
    id: 'flurry',
    name: 'Flurry',
    kind: 'attack',
    cost: 1,
    target: 'none',
    effects: [{ op: 'damage', amount: 3, hits: 3, to: 'randomFoe' }],
  }),
  card({
    id: 'quick-draw',
    name: 'Quick Draw',
    kind: 'skill',
    cost: 0,
    target: 'none',
    exhaust: true,
    effects: [{ op: 'draw', amount: 2 }],
  }),
  card({
    id: 'battle-cry',
    name: 'Battle Cry',
    kind: 'power',
    cost: 1,
    target: 'none',
    effects: [{ op: 'status', status: 'might', amount: 2, to: 'self' }],
  }),
  card({
    id: 'ward',
    name: 'Ward',
    kind: 'skill',
    cost: 1,
    target: 'friend',
    effects: [{ op: 'status', status: 'shielded', amount: 1, to: 'target' }],
  }),
  card({
    id: 'call-drone',
    name: 'Call Drone',
    kind: 'summon',
    cost: 1,
    target: 'none',
    effects: [{ op: 'summon', unit: 'drone' }],
  }),
  card({
    id: 'call-golem',
    name: 'Call Golem',
    kind: 'summon',
    cost: 2,
    target: 'none',
    effects: [{ op: 'summon', unit: 'golem' }],
  }),
  card({
    id: 'rally',
    name: 'Rally',
    kind: 'skill',
    cost: 1,
    target: 'none',
    effects: [{ op: 'actAllies' }],
  }),
  card({
    id: 'tripwire',
    name: 'Tripwire',
    kind: 'snare',
    cost: 1,
    target: 'none',
    trigger: { on: 'attacked' },
    effects: [{ op: 'damage', amount: 8, to: 'attacker' }],
  }),
  card({
    id: 'mirror-ward',
    name: 'Mirror Ward',
    kind: 'snare',
    cost: 1,
    target: 'none',
    trigger: { on: 'attacked' },
    effects: [{ op: 'prevent' }, { op: 'status', status: 'faltering', amount: 2, to: 'attacker' }],
  }),
  card({
    id: 'wound',
    name: 'Wound',
    kind: 'skill',
    cost: 0,
    target: 'none',
    unplayable: true,
    effects: [],
  }),
  card({
    id: 'brace',
    name: 'Brace',
    kind: 'skill',
    cost: 1,
    target: 'none',
    retain: true,
    effects: [{ op: 'barrier', amount: 4, to: 'self' }],
  }),
]);

export const SAMPLE_UNITS: Record<string, UnitDef> = Object.fromEntries(
  (
    [
      {
        id: 'drone',
        name: 'Drone',
        maxHp: 8,
        brain: { kind: 'ally', act: [{ op: 'damage', amount: 3, to: 'target' }] },
      },
      {
        id: 'golem',
        name: 'Golem',
        maxHp: 14,
        taunt: true,
        brain: { kind: 'ally', act: [{ op: 'barrier', amount: 3, to: 'hero' }] },
      },
      {
        id: 'slime',
        name: 'Rift Slime',
        maxHp: 14,
        brain: {
          kind: 'enemy',
          pattern: { kind: 'cycle', order: ['smack', 'smack', 'goo'] },
          moves: {
            smack: {
              id: 'smack',
              name: 'Smack',
              effects: [{ op: 'damage', amount: 6, to: 'target' }],
            },
            goo: {
              id: 'goo',
              name: 'Goo',
              effects: [
                { op: 'status', status: 'faltering', amount: 1, to: 'target' },
                { op: 'barrier', amount: 4, to: 'self' },
              ],
            },
          },
        },
      },
      {
        id: 'cultist',
        name: 'Cultist',
        maxHp: 22,
        brain: {
          kind: 'enemy',
          opening: 'chant',
          pattern: {
            kind: 'weighted',
            options: [
              { move: 'stab', weight: 3 },
              { move: 'chant', weight: 1 },
            ],
          },
          moves: {
            chant: {
              id: 'chant',
              name: 'Chant',
              effects: [{ op: 'status', status: 'might', amount: 2, to: 'self' }],
            },
            stab: {
              id: 'stab',
              name: 'Stab',
              effects: [{ op: 'damage', amount: 5, hits: 2, to: 'target' }],
            },
          },
        },
      },
      {
        id: 'summoner',
        name: 'Rift Caller',
        maxHp: 30,
        brain: {
          kind: 'enemy',
          pattern: { kind: 'cycle', order: ['call', 'zap', 'zap'] },
          moves: {
            call: { id: 'call', name: 'Call Slime', effects: [{ op: 'summon', unit: 'slime' }] },
            zap: { id: 'zap', name: 'Zap', effects: [{ op: 'damage', amount: 7, to: 'target' }] },
          },
        },
      },
      {
        id: 'warden',
        name: 'Sample Warden',
        maxHp: 80,
        brain: {
          kind: 'enemy',
          foe: 'lowest',
          pattern: {
            kind: 'phases',
            phases: [
              { atOrBelowPct: 100, pattern: { kind: 'cycle', order: ['slam', 'guard'] } },
              { atOrBelowPct: 50, pattern: { kind: 'cycle', order: ['rage', 'slam', 'slam'] } },
            ],
          },
          moves: {
            slam: {
              id: 'slam',
              name: 'Slam',
              effects: [{ op: 'damage', amount: 10, to: 'target' }],
            },
            guard: {
              id: 'guard',
              name: 'Guard',
              effects: [{ op: 'barrier', amount: 12, to: 'self' }],
            },
            rage: {
              id: 'rage',
              name: 'Rage',
              effects: [
                { op: 'status', status: 'might', amount: 3, to: 'self' },
                { op: 'addCard', card: 'wound', to: 'discard', side: 'foe' },
              ],
            },
          },
        },
      },
    ] satisfies UnitDef[]
  ).map((u): [string, UnitDef] => [u.id, u]),
);

export const SAMPLE_HEROES: Record<string, HeroDef> = {
  knight: { id: 'knight', name: 'Sample Knight', maxHp: 60, mana: 3, handSize: 5 },
  tinker: {
    id: 'tinker',
    name: 'Sample Tinker',
    maxHp: 50,
    mana: 3,
    handSize: 5,
    startUnits: ['drone'],
  },
};

export const SAMPLE_BOONS: Record<string, BoonDef> = {
  'iron-sigil': {
    id: 'iron-sigil',
    name: 'Iron Sigil',
    rarity: 'common',
    text: 'Start each fight with 6 Barrier.',
    fightStart: [{ op: 'barrier', amount: 6, to: 'self' }],
  },
  'ember-lamp': {
    id: 'ember-lamp',
    name: 'Ember Lamp',
    rarity: 'common',
    text: 'Gain 2 Barrier at the start of each of your turns.',
    turnStart: [{ op: 'barrier', amount: 2, to: 'self' }],
  },
  satchel: {
    id: 'satchel',
    name: 'Rift Satchel',
    rarity: 'uncommon',
    text: 'Draw 1 more card each turn.',
    handSize: 1,
  },
  'rift-core': {
    id: 'rift-core',
    name: 'Rift Core',
    rarity: 'rare',
    text: '+1 Mana each turn.',
    mana: 1,
  },
};

export const SAMPLE_POTIONS: Record<string, PotionDef> = {
  'fire-flask': {
    id: 'fire-flask',
    name: 'Fire Flask',
    rarity: 'common',
    text: 'Deal 12 damage to an enemy.',
    target: 'foe',
    effects: [{ op: 'damage', amount: 12, to: 'target' }],
  },
  'guard-draught': {
    id: 'guard-draught',
    name: 'Guard Draught',
    rarity: 'common',
    text: 'Gain 12 Barrier.',
    target: 'none',
    effects: [{ op: 'barrier', amount: 12, to: 'self' }],
  },
};

export const SAMPLE_DB: CombatDb = {
  cards: SAMPLE_CARDS,
  boons: SAMPLE_BOONS,
  potions: SAMPLE_POTIONS,
  units: SAMPLE_UNITS,
  heroes: SAMPLE_HEROES,
};

export const SAMPLE_DECK: string[] = [
  ...Array<string>(5).fill('strike'),
  ...Array<string>(4).fill('defend'),
  'bash',
  'cleave',
  'flurry',
  'quick-draw',
  'battle-cry',
  'call-drone',
  'tripwire',
  'mirror-ward',
  'ward',
  'rally',
  'brace',
];
