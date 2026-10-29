// Ilvane (display name; the id stays 'shaman', DECISIONS #141), an elder shaman of the old spirits. Rebuilt a second time on
// 2026-10-29 to Robert's direction (docs/reworks/SHAMAN_ELEMENTS_PROPOSAL.md, DECISIONS #420): he casts Flame, Frost and Storm spells
// himself; three totems stand beside him from the start and help those spells every turn; he commands their spirits to act for him;
// Trinity (a spell of every element in one turn) raises his Spirit, which never goes down and strengthens his totems and commands.
// No summons. The first rework (one aimed command a turn, Rousing, Empower; DECISIONS #418) and the Defect copy before it are recorded
// in the DECISIONS log and reviews/balance-baselines/2026-10-29-pre-identity-reworks/.
//
// Totems (TOTEMS below): each helps the first spell of its element each turn that has a damage or Barrier number of its own (+N to
// each such number, every hit and every enemy; never to an "If ...:" bonus; every 2 Spirit add 1; DECISIONS #422), and acts when a
// card commands it (no free command, #421; it aims by itself; every Spirit adds 1 to it):
//   Hawk        - Flame spells +3;  command: 6 damage to a random enemy
//   Bear        - Frost spells +3;  command: 5 Barrier to him
//   Thunderbird - Storm spells +2;  command: 3 damage to every enemy
//   Elder Tree  - (rare) the first spell of any element +2; planting it gives 2 Spirit; command: 1 Spirit and a card
//   Moon Owl    - (rare) 1 Mana whenever Trinity triggers; command: his next elemental spell costs 0
// Elements (a spell's tag): Flame - single-target damage and Burn (as Bleed, DECISIONS #421), defence through Thorns; Frost - Barrier and Faltering, attacks that
// leave enemies Faltering; Storm - every enemy or random ones several times, defence through Sapped.
//
// Build paths stay hidden (DECISIONS #365); the three elements are the first sort, the totem, Trinity and utility cards are glue.
// Costs and points: docs/reworks/SHAMAN.md and shaman-ledger.md (docs/14_CARD_COSTING.md §15).

import type { CardDef, Op, TotemDef } from '@sr/combat';
import {
  addTo,
  barrier,
  barrierNext,
  card,
  commandOne,
  commandTotem,
  dmg,
  draw,
  exhaustN,
  fetchCards,
  FLAME,
  forge,
  FROST,
  gainSpirit,
  ifTotem,
  lose,
  mana,
  manaNext,
  on,
  onKill,
  per,
  plant,
  pool,
  PRISM,
  recost,
  scaled,
  scry,
  status,
  statusTheirs,
  STATUS_TAG,
  STORM,
  totemSlot,
  when,
} from '../build';

export const TOTEMS: TotemDef[] = [
  {
    id: 'hawk',
    name: 'Hawk',
    text: 'Your first Flame spell each turn with damage or Barrier: +3 to each of its damage and Barrier numbers (every hit; not "If" bonuses). Command: 6 damage to a random enemy.',
    aim: 'none',
    command: [dmg(6, 'randomFoe')],
    empower: false,
    boost: { element: 'flame', amount: 3 },
  },
  {
    id: 'bear',
    name: 'Bear',
    text: 'Your first Frost spell each turn with damage or Barrier: +3 to each of its damage and Barrier numbers (every hit; not "If" bonuses). Command: gain 5 Barrier.',
    aim: 'none',
    command: [barrier(5)],
    empower: false,
    boost: { element: 'frost', amount: 3 },
  },
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    text: 'Your first Storm spell each turn with damage or Barrier: +2 to each of its damage and Barrier numbers (every hit; not "If" bonuses). Command: 3 damage to every enemy.',
    aim: 'none',
    command: [dmg(3, 'allFoes')],
    empower: false,
    boost: { element: 'storm', amount: 2 },
  },
  {
    id: 'elder',
    name: 'Elder Tree',
    text: 'Planting it gives 2 Spirit. Your first elemental spell each turn with damage or Barrier: +2 to each of its damage and Barrier numbers (every hit; not "If" bonuses). Command: gain 1 Spirit and draw a card.',
    aim: 'none',
    command: [gainSpirit(1), draw(1)],
    empower: false,
    boost: { element: 'any', amount: 2 },
    onPlant: [gainSpirit(2)],
    rare: true,
  },
  {
    id: 'owl',
    name: 'Moon Owl',
    text: 'Whenever Trinity triggers, gain 1 Mana. Command: your next elemental spell costs 0.',
    aim: 'none',
    command: [status('freespell', 1)],
    empower: false,
    onTrinity: [mana(1)],
    rare: true,
  },
];

const i = pool('shaman', 'nexus');
/** Thorns until the enemies' turn ends (a Flame ward) */
const thorns = (n: number): Op => statusTheirs('thorns', n, 'self');
/** Sapped on every enemy until the end of their next turn (a Storm ward) */
const sapAll = (n: number): Op => statusTheirs('sapped', n, 'allFoes');
const ifBurning = (ops: Op[]): Op => ({ op: 'when', by: 'burn', of: 'target', atLeast: 1, ops });
/** doubles the target's Burn, at most 10 more (balance.test: a multiplier Consumes and is capped) */
const doubleBurn: Op = { op: 'scaleStatus', status: 'burn', mult: 2, to: 'target', max: 10 };
const gatheringStorm = (n: number, grow: number): Op[] => [
  scaled(dmg(n, 'allFoes'), per('bonus')),
  forge('gathering-storm', grow),
];

export const SHAMAN: CardDef[] = [
  // --- basics ---
  i('basic', 'ember-bolt', 'Ember Bolt', 'attack', 1, 'foe', [dmg(7)], {
    ...FLAME,
    up: { effects: [dmg(10)] },
  }),
  i(
    'basic',
    'frost-ward',
    'Frost Ward',
    'skill',
    1,
    'none',
    [barrier(5), status('faltering', 1, 'randomFoe')],
    { ...FROST, up: { effects: [barrier(8), status('faltering', 1, 'randomFoe')] } },
  ),
  // (a stacking storm: every copy hits every enemy 2 harder each time one is cast, for the fight)
  i('basic', 'gathering-storm', 'Gathering Storm', 'attack', 1, 'none', gatheringStorm(3, 2), {
    ...STORM,
    forgeWord: 'Gather',
    up: { effects: gatheringStorm(4, 3) },
  }),

  // --- Flame: single-target damage and Burn; Thorns for defence ---
  i(
    'common',
    'searing-lash',
    'Searing Lash',
    'attack',
    1,
    'foe',
    [dmg(7), status('burn', 2, 'target')],
    {
      ...FLAME,
      up: { effects: [dmg(10), status('burn', 2, 'target')] },
    },
  ),
  i('common', 'kindle', 'Kindle', 'attack', 0, 'foe', [dmg(4), ifTotem('hawk', [dmg(2)])], {
    ...FLAME,
    up: { effects: [dmg(6), ifTotem('hawk', [dmg(2)])] },
  }),
  i('common', 'firebrand', 'Firebrand', 'attack', 1, 'foe', [dmg(7), ifBurning([dmg(4)])], {
    ...FLAME,
    up: { effects: [dmg(10), ifBurning([dmg(4)])] },
  }),
  i('common', 'twin-cinders', 'Twin Cinders', 'attack', 1, 'foe', [dmg(4, 'target', 2)], {
    ...FLAME,
    up: { effects: [dmg(6, 'target', 2)] },
  }),
  i('common', 'flame-spear', 'Flame Spear', 'attack', 2, 'foe', [dmg(17)], {
    ...FLAME,
    up: { effects: [dmg(22)] },
  }),
  i('common', 'flame-shield', 'Flame Shield', 'skill', 1, 'none', [barrier(5), thorns(3)], {
    ...FLAME,
    up: { effects: [barrier(8), thorns(3)] },
  }),
  i(
    'uncommon',
    'immolate',
    'Immolate',
    'attack',
    2,
    'foe',
    [dmg(13), status('burn', 4, 'target')],
    {
      ...FLAME,
      up: { effects: [dmg(17), status('burn', 4, 'target')] },
    },
  ),
  i('uncommon', 'spreading-flames', 'Wildfire', 'attack', 1, 'foe', [dmg(9), doubleBurn], {
    ...FLAME,
    exhaust: true,
    up: { effects: [dmg(12), doubleBurn] },
  }),
  i(
    'uncommon',
    'ember-lance',
    'Ember Lance',
    'attack',
    1,
    'foe',
    [dmg(10), when('played', { atMost: 0 }, [dmg(3)])],
    { ...FLAME, up: { effects: [dmg(13), when('played', { atMost: 0 }, [dmg(3)])] } },
  ),
  i(
    'uncommon',
    'spirit-lance',
    'Spirit Lance',
    'attack',
    1,
    'foe',
    [scaled(dmg(7), per('spirit'))],
    {
      ...FLAME,
      up: { effects: [scaled(dmg(10), per('spirit'))] },
    },
  ),
  i(
    'rare',
    'phoenix-feather',
    'Phoenix Feather',
    'skill',
    1,
    'none',
    [status('twinned', 1), draw(1)],
    { ...FLAME, up: { effects: [status('twinned', 1), draw(2)] } },
  ),
  i('uncommon', 'pyre-ward', 'Pyre Ward', 'skill', 2, 'none', [barrier(12), thorns(4)], {
    ...FLAME,
    up: { effects: [barrier(15), thorns(5)] },
  }),
  i(
    'uncommon',
    'smoulder',
    'Smoulder',
    'power',
    1,
    'none',
    [on('play', [status('burn', 3, 'randomFoe')], { tag: 'flame' })],
    { up: { effects: [on('play', [status('burn', 4, 'randomFoe')], { tag: 'flame' })] } },
  ),
  i(
    'rare',
    'flash-burn',
    'Flashpoint',
    'attack',
    1,
    'foe',
    [scaled(dmg(4), per('burn', 3, 'target'))],
    { ...FLAME, exhaust: true, up: { effects: [scaled(dmg(8), per('burn', 3, 'target'))] } },
  ),
  i(
    'rare',
    'heart-of-the-pyre',
    'Heart of the Pyre',
    'power',
    1,
    'none',
    [on('play', [dmg(5, 'randomFoe')], { tag: 'flame' })],
    { up: { effects: [on('play', [dmg(6, 'randomFoe')], { tag: 'flame' })] } },
  ),
  i('rare', 'burning-aegis', 'Burning Aegis', 'power', 1, 'none', [on('turnStart', [thorns(3)])], {
    up: { effects: [on('turnStart', [thorns(4)])] },
  }),
  i('rare', 'inferno', 'Inferno', 'attack', 3, 'foe', [dmg(30), status('burn', 3, 'target')], {
    ...FLAME,
    up: { effects: [dmg(38), status('burn', 3, 'target')] },
  }),

  // --- Frost: Barrier and Faltering; attacks that leave enemies Faltering ---
  i(
    'common',
    'frost-needle',
    'Frost Needle',
    'attack',
    0,
    'foe',
    [
      dmg(4),
      {
        op: 'when',
        by: 'attacking',
        of: 'target',
        atLeast: 1,
        ops: [status('faltering', 1, 'target')],
      },
    ],
    {
      ...FROST,
      up: {
        effects: [
          dmg(6),
          {
            op: 'when',
            by: 'attacking',
            of: 'target',
            atLeast: 1,
            ops: [status('faltering', 1, 'target')],
          },
        ],
      },
    },
  ),
  i(
    'common',
    'rime-shield',
    'Rime Shield',
    'skill',
    1,
    'none',
    [barrier(7), ifTotem('bear', [barrier(2)])],
    { ...FROST, up: { effects: [barrier(10), ifTotem('bear', [barrier(2)])] } },
  ),
  i(
    'common',
    'chill-touch',
    'Chill Touch',
    'attack',
    1,
    'foe',
    [dmg(6), status('faltering', 1, 'target')],
    { ...FROST, up: { effects: [dmg(9), status('faltering', 1, 'target')] } },
  ),
  i(
    'common',
    'hoarfrost',
    'Hoarfrost',
    'skill',
    1,
    'none',
    [barrier(5), status('faltering', 1, 'allFoes')],
    { ...FROST, up: { effects: [barrier(8), status('faltering', 1, 'allFoes')] } },
  ),
  i('uncommon', 'ice-wall', 'Ice Wall', 'skill', 2, 'none', [barrier(16)], {
    ...FROST,
    up: { effects: [barrier(20)] },
  }),
  i(
    'uncommon',
    'glacier-guard',
    'Glacier Guard',
    'skill',
    1,
    'none',
    [barrier(6), barrierNext(4)],
    {
      ...FROST,
      up: { effects: [barrier(8), barrierNext(6)] },
    },
  ),
  i(
    'uncommon',
    'frozen-grasp',
    'Frozen Grasp',
    'skill',
    1,
    'foe',
    [status('faltering', 2, 'target'), barrier(4)],
    { ...FROST, up: { effects: [status('faltering', 2, 'target'), barrier(7)] } },
  ),
  i(
    'uncommon',
    'frost-shatter',
    'Ice Shatter',
    'attack',
    1,
    'foe',
    [scaled(dmg(6), per('faltering', 3, 'target'))],
    {
      ...FROST,
      up: { effects: [scaled(dmg(9), per('faltering', 3, 'target'))] },
    },
  ),
  i(
    'uncommon',
    'ice-mirror',
    'Ice Mirror',
    'skill',
    1,
    'none',
    [barrier(6), status('reflect', 1)],
    {
      ...FROST,
      up: { effects: [barrier(9), status('reflect', 1)] },
    },
  ),
  i(
    'rare',
    'winters-embrace',
    "Winter's Embrace",
    'skill',
    2,
    'none',
    [barrier(12), status('faltering', 2, 'allFoes')],
    { ...FROST, up: { effects: [barrier(15), status('faltering', 2, 'allFoes')] } },
  ),
  i(
    'uncommon',
    'permafrost',
    'Hail Rite',
    'power',
    1,
    'none',
    [on('turnEnd', [ifTotem('bear', [barrier(4)])])],
    { up: { effects: [on('turnEnd', [ifTotem('bear', [barrier(5)])])] } },
  ),
  i('rare', 'frostbound', 'Frostbound', 'power', 1, 'none', [on('debuffFoe', [barrier(3)])], {
    up: { effects: [on('debuffFoe', [barrier(4)])] },
  }),
  i(
    'rare',
    'avalanche',
    'Avalanche',
    'attack',
    2,
    'none',
    [dmg(14, 'allFoes'), status('faltering', 1, 'allFoes')],
    { ...FROST, up: { effects: [dmg(18, 'allFoes'), status('faltering', 1, 'allFoes')] } },
  ),
  i(
    'rare',
    'absolute-zero',
    'Absolute Zero',
    'attack',
    2,
    'none',
    [scaled(dmg(10, 'allFoes'), per('faltering', 3, 'each')), status('faltering', 2, 'allFoes')],
    {
      ...FROST,
      up: {
        effects: [
          scaled(dmg(13, 'allFoes'), per('faltering', 3, 'each')),
          status('faltering', 2, 'allFoes'),
        ],
      },
    },
  ),
  i(
    'rare',
    'glacial-fortress',
    'Glacial Fortress',
    'skill',
    3,
    'none',
    [barrier(22), status('faltering', 2, 'allFoes')],
    { ...FROST, up: { effects: [barrier(28), status('faltering', 2, 'allFoes')] } },
  ),

  // --- Storm: every enemy, or random ones several times; Sapped for defence ---
  i('common', 'chain-lightning', 'Chain Lightning', 'attack', 1, 'none', [dmg(3, 'randomFoe', 3)], {
    ...STORM,
    up: { effects: [dmg(4, 'randomFoe', 3)] },
  }),
  i('common', 'static-crackle', 'Static Crackle', 'attack', 0, 'none', [dmg(4, 'allFoes')], {
    ...STORM,
    up: { effects: [dmg(5, 'allFoes')] },
  }),
  i('common', 'gale-call', 'Gale Call', 'attack', 1, 'none', [dmg(5, 'allFoes'), draw(1)], {
    ...STORM,
    up: { effects: [dmg(8, 'allFoes'), draw(1)] },
  }),
  i('uncommon', 'thunderclap', 'Thunderclap', 'attack', 2, 'none', [dmg(15, 'allFoes')], {
    ...STORM,
    up: { effects: [dmg(19, 'allFoes')] },
  }),
  i('common', 'wind-wall', 'Wind Wall', 'skill', 1, 'none', [barrier(5), sapAll(2)], {
    ...STORM,
    up: { effects: [barrier(8), sapAll(2)] },
  }),
  i('uncommon', 'squall', 'Squall', 'attack', 1, 'none', [dmg(2, 'randomFoe', 4)], {
    ...STORM,
    up: { effects: [dmg(3, 'randomFoe', 4)] },
  }),
  i(
    'uncommon',
    'storm-front',
    'Storm Front',
    'attack',
    1,
    'none',
    [dmg(3, 'allFoes', 2), draw(1)],
    { ...STORM, up: { effects: [dmg(4, 'allFoes', 2), draw(1)] } },
  ),
  i(
    'uncommon',
    'tempest-call',
    'Tempest Call',
    'skill',
    1,
    'none',
    [forge('gathering-storm', 2), draw(1)],
    { ...STORM, up: { effects: [forge('gathering-storm', 3), draw(1)] } },
  ),
  i('rare', 'maelstrom', 'Maelstrom', 'attack', 2, 'none', [dmg(8, 'allFoes', 2)], {
    ...STORM,
    up: { effects: [dmg(10, 'allFoes', 2)] },
  }),
  i(
    'uncommon',
    'charged-sky',
    'Charged Sky',
    'attack',
    2,
    'none',
    [dmg(10, 'allFoes'), status('exposed', 2, 'allFoes')],
    { ...STORM, up: { effects: [dmg(13, 'allFoes'), status('exposed', 2, 'allFoes')] } },
  ),
  i('uncommon', 'static-veil', 'Static Veil', 'skill', 1, 'none', [barrier(6), sapAll(3)], {
    ...STORM,
    up: { effects: [barrier(9), sapAll(3)] },
  }),
  i(
    'uncommon',
    'lightning-rod',
    'Lightning Rod',
    'power',
    1,
    'none',
    [on('play', [dmg(3, 'randomFoe')], { tag: 'storm' })],
    { up: { effects: [on('play', [dmg(4, 'randomFoe')], { tag: 'storm' })] } },
  ),
  i(
    'rare',
    'eye-of-the-tempest',
    'Eye of the Tempest',
    'attack',
    2,
    'none',
    [dmg(3, 'randomFoe', 6), ifTotem('thunderbird', [dmg(3, 'randomFoe')])],
    {
      ...STORM,
      up: { effects: [dmg(4, 'randomFoe', 6), ifTotem('thunderbird', [dmg(4, 'randomFoe')])] },
    },
  ),
  i(
    'rare',
    'storm-sovereign',
    'Storm Sovereign',
    'power',
    1,
    'none',
    [on('command', [dmg(3, 'allFoes')])],
    {
      up: { effects: [on('command', [dmg(4, 'allFoes')])] },
    },
  ),
  i(
    'rare',
    'calm-before-the-storm',
    'Calm Before the Storm',
    'power',
    1,
    'none',
    [on('turnStart', [sapAll(3)])],
    { up: { effects: [on('turnStart', [sapAll(4)])] } },
  ),
  i('rare', 'superstorm', 'Superstorm', 'attack', 3, 'none', [dmg(6, 'allFoes', 4)], {
    ...STORM,
    up: { effects: [dmg(8, 'allFoes', 4)] },
  }),

  // --- glue: totems and commands (a totem acts only when a card commands it, DECISIONS #421) ---
  i('basic', 'spirit-call', 'Spirit Call', 'skill', 1, 'none', [commandTotem('choose')], {
    up: { effects: [commandTotem('choose'), barrier(3)] },
  }),
  i('common', 'hawks-dive', "Hawk's Dive", 'skill', 1, 'none', [commandOne('hawk'), barrier(3)], {
    up: { effects: [commandOne('hawk'), barrier(6)] },
  }),
  i('common', 'bears-guard', "Bear's Guard", 'skill', 1, 'none', [commandOne('bear')], {
    up: { effects: [commandOne('bear'), barrier(3)] },
  }),
  i(
    'common',
    'thunderbirds-cry',
    "Thunderbird's Cry",
    'skill',
    1,
    'none',
    [commandOne('thunderbird'), draw(1)],
    {
      up: { effects: [commandOne('thunderbird'), dmg(3, 'allFoes'), draw(1)] },
    },
  ),
  i('common', 'spark-cast', 'Hawk Call', 'skill', 1, 'none', [plant('hawk'), commandOne('hawk')], {
    up: { effects: [plant('hawk'), commandOne('hawk'), barrier(3)] },
  }),
  i('common', 'wardkeepers-pact', 'Bear Call', 'skill', 1, 'none', [plant('bear'), barrier(7)], {
    up: { effects: [plant('bear'), barrier(10)] },
  }),
  i(
    'common',
    'thunderbird-call',
    'Thunderbird Call',
    'skill',
    1,
    'none',
    [plant('thunderbird'), dmg(4, 'allFoes'), barrier(3)],
    { up: { effects: [plant('thunderbird'), dmg(6, 'allFoes'), barrier(4)] } },
  ),
  i('common', 'call-again', 'Call Again', 'skill', 0, 'none', [commandTotem('random')], {
    // (a free command Consumes: three Elder Trees and two Call Agains in a thin deck commanded each other for ever, DECISIONS #422)
    exhaust: true,
    up: { effects: [commandTotem('random'), barrier(2)] },
  }),
  i(
    'uncommon',
    'raise-the-pole',
    'Raise the Pole',
    'skill',
    1,
    'none',
    [totemSlot, barrier(5), draw(1)],
    {
      up: { effects: [totemSlot, barrier(8), draw(1)] },
    },
  ),
  i(
    'rare',
    'carve-the-spirit-pole',
    'Carve the Spirit Pole',
    'skill',
    1,
    'none',
    [totemSlot, plant('*'), draw(2)],
    { up: { effects: [totemSlot, plant('*'), draw(3)] } },
  ),
  i(
    'uncommon',
    'rally-the-spirits',
    'Rally the Spirits',
    'skill',
    2,
    'none',
    [commandTotem('choose', 2), barrier(4)],
    {
      up: { effects: [commandTotem('choose', 2), barrier(7)] },
    },
  ),
  i(
    'uncommon',
    'ancestral-exchange',
    'Ancestral Exchange',
    'skill',
    1,
    'none',
    [plant('*', true), when('replacedNow', { atLeast: 1 }, [gainSpirit(1)]), draw(1), barrier(3)],
    {
      up: {
        effects: [
          plant('*', true),
          when('replacedNow', { atLeast: 1 }, [gainSpirit(1)]),
          draw(1),
          barrier(6),
        ],
      },
    },
  ),
  i(
    'uncommon',
    'thunder-roost',
    'Thunder Roost',
    'power',
    1,
    'none',
    [on('turnStart', [ifTotem('thunderbird', [dmg(3, 'allFoes')])])],
    { up: { effects: [on('turnStart', [ifTotem('thunderbird', [dmg(4, 'allFoes')])])] } },
  ),
  i(
    'rare',
    'rune-carapace',
    'Bark Carapace',
    'power',
    1,
    'none',
    [on('turnStart', [scaled(barrier(1), per('totems'))])],
    { up: { innate: true } },
  ),
  i('rare', 'call-the-elder-tree', 'Call the Elder Tree', 'skill', 1, 'none', [plant('elder')], {
    up: { effects: [plant('elder'), barrier(3)] },
  }),
  i('rare', 'call-the-moon-owl', 'Call the Moon Owl', 'skill', 1, 'none', [plant('owl'), draw(1)], {
    up: { effects: [plant('owl'), draw(2)] },
  }),
  i(
    'rare',
    'spirit-chorus',
    'Spirit Chorus',
    'power',
    2,
    'none',
    [on('turnStart', [commandTotem('random'), barrier(2)])],
    {
      up: { innate: true },
    },
  ),
  i(
    'rare',
    'great-spirits-call',
    "Great Spirit's Call",
    'skill',
    3,
    'none',
    [commandTotem('all'), barrier(5)],
    {
      up: { effects: [commandTotem('all'), barrier(9)] },
    },
  ),

  // --- glue: Trinity and Spirit ---
  i('uncommon', 'prism-spell', 'Prism Spell', 'attack', 1, 'foe', [dmg(4), barrier(3)], {
    ...PRISM,
    up: { effects: [dmg(6), barrier(5)] },
  }),
  i('uncommon', 'spirit-surge', 'Spirit Surge', 'skill', 1, 'none', [gainSpirit(1), barrier(5)], {
    up: { effects: [gainSpirit(1), barrier(8)] },
  }),
  i(
    'uncommon',
    'tune-the-lattice',
    'Communion',
    'skill',
    1,
    'none',
    [gainSpirit(1), draw(1), barrier(3)],
    { up: { effects: [gainSpirit(1), draw(2), barrier(3)] } },
  ),
  i(
    'rare',
    'spiritstorm',
    'Spiritstorm',
    'attack',
    1,
    'none',
    [scaled(dmg(6, 'allFoes'), per('spirit'))],
    { up: { effects: [scaled(dmg(9, 'allFoes'), per('spirit'))] } },
  ),
  i('rare', 'harmony', 'Harmony', 'power', 1, 'none', [on('trinity', [barrier(6), draw(1)])], {
    up: { effects: [on('trinity', [barrier(9), draw(1)])] },
  }),
  i('rare', 'spirit-walk', 'Spirit Walk', 'skill', 1, 'none', [gainSpirit(2), draw(2)], {
    exhaust: true,
    up: { effects: [gainSpirit(2), draw(3)] },
  }),

  // --- glue: utility ---
  i('common', 'stone-skin', 'Stone Skin', 'skill', 1, 'none', [barrier(9)]),
  i('common', 'tidecaller', 'Tidecaller', 'skill', 1, 'none', [barrier(7), manaNext(1)], {
    up: { effects: [barrier(10), manaNext(1)] },
  }),
  i('common', 'spirit-memory', 'Spirit Memory', 'skill', 1, 'none', [barrier(6), fetchCards(1)], {
    up: { effects: [barrier(9), fetchCards(1)] },
  }),
  i('common', 'read-the-winds', 'Read the Winds', 'skill', 1, 'none', [scry(3), barrier(4)], {
    up: { effects: [scry(3), barrier(7)] },
  }),
  i('uncommon', 'clear-spring', 'Clear Spring', 'skill', 1, 'none', [draw(3)]),
  i('uncommon', 'crystal-ward', 'Crystal Ward', 'skill', 0, 'none', [barrier(10)], {
    innate: true,
    exhaust: true,
  }),
  i(
    'uncommon',
    'ironbark',
    'Ironbark',
    'skill',
    1,
    'none',
    [barrier(13), addTo('wound', 2, 'discard')],
    { up: { effects: [barrier(17), addTo('wound', 2, 'discard')] } },
  ),
  i(
    'uncommon',
    'shamans-insight',
    "Shaman's Insight",
    'skill',
    1,
    'none',
    [draw(1), barrier(3), status('freespell', 1)],
    { up: { effects: [draw(2), barrier(3), status('freespell', 1)] } },
  ),
  i(
    'uncommon',
    'smoke-offering',
    'Smoke Offering',
    'skill',
    1,
    'none',
    [exhaustN(1), manaNext(2), draw(1)],
    { up: { effects: [exhaustN(1), manaNext(2), draw(2)] } },
  ),
  i('uncommon', 'skybreaker', 'Skybreaker', 'attack', 3, 'foe', [onKill(dmg(26), [mana(1)])], {
    up: { effects: [onKill(dmg(34), [mana(1)])] },
  }),
  i('rare', 'spirit-vision', 'Spirit Vision', 'skill', 1, 'none', [draw(3), gainSpirit(1)], {
    exhaust: true,
    up: { effects: [draw(4), gainSpirit(1)] },
  }),
  i('common', 'gale-strike', 'Gale Strike', 'attack', 1, 'foe', [dmg(8), recost(-1)], {
    up: { effects: [dmg(11), recost(-1)] },
  }),
];

// The status cards his old pools made (Dazed, Burn, Slimed, Void; Wound is shared and lives in neutral.ts). Junk, like Wound: never a
// reward. The enemies and events that use them still do.
const junk = (
  id: string,
  name: string,
  cost: number,
  effects: Op[],
  extra: Partial<CardDef>,
): CardDef => ({
  ...card('junk', 'basic', id, name, 'skill', cost, 'none', effects),
  hero: 'junk',
  source: 'token',
  tags: [STATUS_TAG],
  ...extra,
});

export const SHAMAN_STATUSES: CardDef[] = [
  // (Dazed)
  junk('haze', 'Haze', 0, [], { unplayable: true, ethereal: true }),
  // (Burn: 2 damage in their game, which Block stops; here HP lost)
  junk('scorch', 'Scorch', 0, [], { unplayable: true, inHandAtEnd: [lose(2)] }),
  // (Slimed)
  junk('muck', 'Muck', 1, [draw(1)], { exhaust: true }),
  // (Void)
  junk('void-drain', 'Drain', 0, [], { unplayable: true, ethereal: true, onDraw: [mana(-1)] }),
];
