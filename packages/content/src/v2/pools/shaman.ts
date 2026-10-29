// Ilvane (display name; the id stays 'shaman', DECISIONS #141), an elder shaman of the old spirits. Rebuilt a third time on
// 2026-10-29 to Robert's direction (DECISIONS #430, the totem cycle): his totems stand in a row in the order they were planted, as
// Slay the Spire 2's orbs do. Each does something every turn while it stands (its passive); a command makes the FRONT totem's spirit
// act and consumes it, and planting into a full row pushes the front one out, which acts as it goes. Every totem number grows by 1
// for each Spirit he has (the Elder Tree and the Moon Owl excepted). Trinity and the totems' help on spells are gone (#420-#422 are
// in the DECISIONS log; their cards are frozen in reviews/balance-baselines/2026-10-29-shaman-cycle/). No summons.
//
// Totems (TOTEMS below; +1 Spirit adds 1 to each number marked +S):
//   Hawk        - end of turn: 2+S Primed, if he is not Primed;     command / pushed out: gain 1 Spirit (flat)
//   Bear        - end of turn: 2+S Barrier;                         command: 6+S Barrier
//   Thunderbird - end of turn: 3+S damage to 2 different random enemies (25% more when one stands);   command: 8+S to every enemy
//   Elder Tree  - (rare) start of turn: 1 Mana;                     command: 2 Mana
//   Moon Owl    - (rare) start of turn: his first elemental spell this turn costs 1 less;   command: his next elemental spell is played twice
// Elements (a spell's tag): Flame - big single-target bursts, Burn as a small extra; Frost - Barrier and Faltering; Storm - every enemy,
// or Forks (2 or 3 different random enemies, 25% more when one stands), and Gathering Storm, which grows.
//
// Build paths stay hidden (DECISIONS #365); the three elements are the first sort, the totem, Spirit and utility cards are glue.
// Costs and points: docs/reworks/SHAMAN.md and shaman-ledger.md (docs/14_CARD_COSTING.md §15).

import type { CardDef, Op, TotemDef } from '@sr/combat';
import {
  barrier,
  barrierNext,
  card,
  commandOne,
  commandTotem,
  discard,
  dmg,
  draw,
  FLAME,
  forge,
  FROST,
  gainSpirit,
  ifTotem,
  lose,
  mana,
  manaNext,
  on,
  per,
  plant,
  pool,
  scaled,
  scry,
  status,
  statusTheirs,
  STATUS_TAG,
  STORM,
  totemRotate,
  totemSlot,
  when,
} from '../build';

/** Fork N (DECISIONS #427): N different random enemies once each, 25% more when only one enemy stands */
const fork = (n: number, targets: number): Op => ({
  op: 'damage',
  amount: n,
  to: 'randomFoe',
  hits: targets,
  distinct: true,
  lonePct: 25,
});
/** a totem number: +1 for each Spirit he has */
const sp = <T extends Op>(o: T): T => scaled(o, per('spirit'));

export const TOTEMS: TotemDef[] = [
  {
    id: 'hawk',
    name: 'Hawk',
    // (only if he is not Primed: Primed adds to every hit of his next attack, so it never piles up over quiet turns)
    text: 'At the end of your turn: if you are not Primed, gain 2 (+1 per Spirit) Primed. Command: gain 1 Spirit.',
    aim: 'none',
    command: [gainSpirit(1)],
    empower: false,
    passive: {
      when: 'turnEnd',
      ops: [when('vigor', { atMost: 0 }, [sp(status('vigor', 2))])],
    },
  },
  {
    id: 'bear',
    name: 'Bear',
    text: 'At the end of your turn: gain 2 (+1 per Spirit) Barrier. Command: gain 6 (+1 per Spirit) Barrier.',
    aim: 'none',
    command: [sp(barrier(6))],
    empower: false,
    passive: { when: 'turnEnd', ops: [sp(barrier(2))] },
  },
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    text: 'At the end of your turn: deal 3 (+1 per Spirit) damage to 2 different random enemies (25% more when only one stands). Command: deal 8 (+1 per Spirit) damage to ALL enemies.',
    aim: 'none',
    command: [sp(dmg(8, 'allFoes'))],
    empower: false,
    passive: { when: 'turnEnd', ops: [sp(fork(3, 2))] },
  },
  {
    id: 'elder',
    name: 'Elder Tree',
    text: 'At the start of your turn: gain 1 Mana. Command: gain 2 Mana.',
    aim: 'none',
    command: [mana(2)],
    empower: false,
    passive: { when: 'turnStart', ops: [mana(1)] },
    rare: true,
  },
  {
    id: 'owl',
    name: 'Moon Owl',
    text: 'At the start of your turn: your first elemental spell this turn costs 1 less. Command: your next elemental spell is played twice.',
    aim: 'none',
    command: [status('twinspell', 1)],
    empower: false,
    passive: { when: 'turnStart', ops: [status('spellcut', 1, 'self', true)] },
    rare: true,
  },
];

const i = pool('shaman', 'nexus');
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
  // (his starting Storm spell, DECISIONS #427: a Fork, two enemies, or one harder)
  i('basic', 'forked-lightning', 'Forked Lightning', 'attack', 1, 'none', [fork(5, 2)], {
    ...STORM,
    up: { effects: [fork(7, 2)] },
  }),
  // (the starter command: the front totem acts and goes)
  i('basic', 'spirit-call', 'Spirit Call', 'skill', 1, 'none', [commandTotem('front')], {
    up: { effects: [commandTotem('front'), barrier(3)] },
  }),

  // --- Flame: big single-target bursts; Burn is a small extra ---
  i(
    'common',
    'searing-lash',
    'Searing Lash',
    'attack',
    1,
    'foe',
    [dmg(8), status('burn', 2, 'target')],
    { ...FLAME, up: { effects: [dmg(11), status('burn', 2, 'target')] } },
  ),
  i('common', 'kindle', 'Kindle', 'attack', 0, 'foe', [dmg(6)], {
    ...FLAME,
    up: { effects: [dmg(8)] },
  }),
  i('common', 'firebrand', 'Firebrand', 'attack', 1, 'foe', [dmg(7), ifBurning([dmg(4)])], {
    ...FLAME,
    up: { effects: [dmg(10), ifBurning([dmg(4)])] },
  }),
  i('common', 'twin-cinders', 'Twin Cinders', 'attack', 1, 'foe', [dmg(4, 'target', 2)], {
    ...FLAME,
    up: { effects: [dmg(6, 'target', 2)] },
  }),
  i('common', 'flame-spear', 'Flame Spear', 'attack', 2, 'foe', [dmg(18)], {
    ...FLAME,
    up: { effects: [dmg(23)] },
  }),
  i('common', 'flare', 'Flare', 'attack', 1, 'foe', [dmg(10)], {
    ...FLAME,
    up: { effects: [dmg(13)] },
  }),
  // (a Flame attack that brings a Hawk)
  i('common', 'talon-strike', 'Talon Strike', 'attack', 2, 'foe', [dmg(11), plant('hawk')], {
    ...FLAME,
    up: { effects: [dmg(14), plant('hawk')] },
  }),
  i(
    'uncommon',
    'immolate',
    'Immolate',
    'attack',
    2,
    'foe',
    [dmg(14), status('burn', 4, 'target')],
    { ...FLAME, up: { effects: [dmg(18), status('burn', 4, 'target')] } },
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
  i('uncommon', 'pyroclasm', 'Pyroclasm', 'attack', 2, 'foe', [dmg(16), ifBurning([dmg(8)])], {
    ...FLAME,
    up: { effects: [dmg(21), ifBurning([dmg(8)])] },
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
    'phoenix-feather',
    'Phoenix Feather',
    'skill',
    1,
    'none',
    [status('twinned', 1), draw(1)],
    { ...FLAME, up: { effects: [status('twinned', 1), draw(2)] } },
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
  i('rare', 'inferno', 'Inferno', 'attack', 3, 'foe', [dmg(30), status('burn', 3, 'target')], {
    ...FLAME,
    up: { effects: [dmg(38), status('burn', 3, 'target')] },
  }),

  // --- Frost: Barrier and Faltering ---
  i(
    'common',
    'frost-needle',
    'Frost Needle',
    'attack',
    0,
    'foe',
    [dmg(3), status('faltering', 1, 'target')],
    { ...FROST, up: { effects: [dmg(5), status('faltering', 1, 'target')] } },
  ),
  i('common', 'rime-shield', 'Rime Shield', 'skill', 1, 'none', [barrier(8)], {
    ...FROST,
    up: { effects: [barrier(11)] },
  }),
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
  // (a Frost ward that brings a Bear)
  i('common', 'wardkeepers-pact', 'Bear Call', 'skill', 1, 'none', [plant('bear'), barrier(2)], {
    ...FROST,
    up: { effects: [plant('bear'), barrier(5)] },
  }),
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
    { ...FROST, up: { effects: [barrier(8), barrierNext(6)] } },
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
    { ...FROST, up: { effects: [scaled(dmg(9), per('faltering', 3, 'target'))] } },
  ),
  i(
    'uncommon',
    'ice-mirror',
    'Ice Mirror',
    'skill',
    1,
    'none',
    [barrier(6), status('reflect', 1)],
    { ...FROST, up: { effects: [barrier(9), status('reflect', 1)] } },
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

  // --- Storm: every enemy, or Forks; Sapped for defence ---
  // (a stacking storm: every copy hits every enemy 3 harder each time one is cast, for the fight)
  i('common', 'gathering-storm', 'Gathering Storm', 'attack', 1, 'none', gatheringStorm(4, 3), {
    ...STORM,
    forgeWord: 'Gather',
    up: { effects: gatheringStorm(6, 3) },
  }),
  i('common', 'spark-fork', 'Spark Fork', 'attack', 0, 'none', [fork(4, 2)], {
    ...STORM,
    up: { effects: [fork(5, 2)] },
  }),
  i('common', 'chain-lightning', 'Chain Lightning', 'attack', 1, 'none', [dmg(3, 'randomFoe', 3)], {
    ...STORM,
    up: { effects: [dmg(4, 'randomFoe', 3)] },
  }),
  i('common', 'gale-call', 'Gale Call', 'attack', 1, 'none', [dmg(5, 'allFoes'), draw(1)], {
    ...STORM,
    up: { effects: [dmg(8, 'allFoes'), draw(1)] },
  }),
  i('common', 'wind-wall', 'Wind Wall', 'skill', 1, 'none', [barrier(5), sapAll(2)], {
    ...STORM,
    up: { effects: [barrier(8), sapAll(2)] },
  }),
  // (a Storm attack that brings a Thunderbird)
  i(
    'common',
    'thunderbird-call',
    'Thunderbird Call',
    'attack',
    2,
    'none',
    [dmg(8, 'allFoes'), plant('thunderbird')],
    { ...STORM, up: { effects: [dmg(11, 'allFoes'), plant('thunderbird')] } },
  ),
  i('uncommon', 'thunder-fork', 'Thunder Fork', 'attack', 2, 'none', [fork(10, 3)], {
    ...STORM,
    up: { effects: [fork(13, 3)] },
  }),
  i('uncommon', 'thunderclap', 'Thunderclap', 'attack', 2, 'none', [dmg(15, 'allFoes')], {
    ...STORM,
    up: { effects: [dmg(19, 'allFoes')] },
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
    'uncommon',
    'thunder-roost',
    'Thunder Roost',
    'power',
    1,
    'none',
    [on('turnStart', [ifTotem('thunderbird', [dmg(3, 'allFoes')])])],
    { up: { effects: [on('turnStart', [ifTotem('thunderbird', [dmg(4, 'allFoes')])])] } },
  ),
  i('rare', 'maelstrom', 'Maelstrom', 'attack', 2, 'none', [dmg(8, 'allFoes', 2)], {
    ...STORM,
    up: { effects: [dmg(10, 'allFoes', 2)] },
  }),
  // (a Fork of four, not six random hits: Primed adds to every hit, so many-hit Storm spells are kept few)
  i('rare', 'eye-of-the-tempest', 'Eye of the Tempest', 'attack', 2, 'none', [fork(11, 4)], {
    ...STORM,
    up: { effects: [fork(14, 4)] },
  }),
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
  // (two big hits, not four: Primed adds to every hit on every enemy)
  i('rare', 'superstorm', 'Superstorm', 'attack', 3, 'none', [dmg(12, 'allFoes', 2)], {
    ...STORM,
    up: { effects: [dmg(15, 'allFoes', 2)] },
  }),

  // --- glue: planting totems (at the back of the row; a full row pushes the front one out, and it acts as it goes) ---
  i('common', 'spark-cast', 'Hawk Call', 'skill', 1, 'none', [plant('hawk'), draw(1)], {
    up: { effects: [plant('hawk'), draw(1), barrier(3)] },
  }),
  i('common', 'raise-a-totem', 'Raise a Totem', 'skill', 1, 'none', [plant('*'), barrier(2)], {
    up: { effects: [plant('*'), barrier(5)] },
  }),
  // (free plants Consume: a push-out is a free command)
  i('common', 'hawk-feather', 'Hawk Feather', 'skill', 0, 'none', [plant('hawk')], {
    exhaust: true,
    up: { effects: [plant('hawk'), barrier(3)] },
  }),
  i('common', 'bear-hide', 'Bear Hide', 'skill', 0, 'none', [plant('bear')], {
    exhaust: true,
    up: { effects: [plant('bear'), barrier(3)] },
  }),
  i('common', 'storm-feather', 'Storm Feather', 'skill', 0, 'none', [plant('thunderbird')], {
    exhaust: true,
    up: { effects: [plant('thunderbird'), barrier(3)] },
  }),
  i(
    'uncommon',
    'totem-circle',
    'Totem Circle',
    'skill',
    2,
    'none',
    [plant('hawk'), plant('bear'), plant('thunderbird')],
    { up: { effects: [plant('hawk'), plant('bear'), plant('thunderbird'), barrier(4)] } },
  ),
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
    [totemSlot, plant('*'), draw(1)],
    { up: { effects: [totemSlot, plant('*'), draw(2)] } },
  ),
  // (the rare totems are dear to plant: the Elder's Mana every turn and its 2 Mana when it acts, the Owl's discount, pay them back)
  i('rare', 'call-the-elder-tree', 'Call the Elder Tree', 'skill', 3, 'none', [plant('elder')], {
    up: { effects: [plant('elder'), draw(1)] },
  }),
  i('rare', 'call-the-moon-owl', 'Call the Moon Owl', 'skill', 2, 'none', [plant('owl')], {
    up: { effects: [plant('owl'), draw(1)] },
  }),

  // --- glue: commands (a totem acts and is consumed: the front one unless the card says otherwise) ---
  i(
    'common',
    'spirit-strike',
    'Spirit Strike',
    'attack',
    2,
    'foe',
    [dmg(11), commandTotem('front')],
    {
      up: { effects: [dmg(15), commandTotem('front')] },
    },
  ),
  i(
    'common',
    'spirit-ward',
    'Spirit Ward',
    'skill',
    1,
    'none',
    [barrier(2), commandTotem('front')],
    {
      up: { effects: [barrier(5), commandTotem('front')] },
    },
  ),
  // (a free command Consumes: the Elder Tree's command makes Mana)
  i('common', 'call-again', 'Call Again', 'skill', 0, 'none', [commandTotem('front')], {
    exhaust: true,
    up: { effects: [commandTotem('front'), barrier(3)] },
  }),
  i('common', 'hawks-dive', "Hawk's Dive", 'skill', 1, 'none', [commandOne('hawk'), barrier(2)], {
    up: { effects: [commandOne('hawk'), barrier(5)] },
  }),
  i('common', 'bears-guard', "Bear's Guard", 'skill', 1, 'none', [commandOne('bear'), barrier(3)], {
    up: { effects: [commandOne('bear'), barrier(6)] },
  }),
  i(
    'common',
    'thunderbirds-cry',
    "Thunderbird's Cry",
    'skill',
    1,
    'none',
    [commandOne('thunderbird')],
    { up: { effects: [commandOne('thunderbird'), draw(1)] } },
  ),
  // (the cycle's utility: the front totem goes to the back, so the next command finds the one behind it; it draws and discards one)
  i(
    'common',
    'turn-the-wheel',
    'Turn the Wheel',
    'skill',
    0,
    'none',
    [totemRotate, draw(1), discard(1), barrier(3)],
    {
      up: { effects: [totemRotate, draw(1), discard(1), barrier(5)] },
    },
  ),
  i(
    'uncommon',
    'last-called',
    'Last Called',
    'skill',
    1,
    'none',
    [commandTotem('newest'), draw(1)],
    {
      up: { effects: [commandTotem('newest'), draw(1), barrier(4)] },
    },
  ),
  i(
    'uncommon',
    'ancestral-exchange',
    'Ancestral Exchange',
    'skill',
    2,
    'none',
    [commandTotem('newest'), plant('*'), barrier(3)],
    { up: { effects: [commandTotem('newest'), plant('*'), barrier(6)] } },
  ),
  i(
    'uncommon',
    'rally-the-spirits',
    'Rally the Spirits',
    'skill',
    2,
    'none',
    [commandTotem('front', 2), barrier(4)],
    { up: { effects: [commandTotem('front', 2), barrier(7)] } },
  ),
  i(
    'rare',
    'great-spirits-call',
    "Great Spirit's Call",
    'skill',
    3,
    'none',
    [commandTotem('all'), barrier(5)],
    { up: { effects: [commandTotem('all'), barrier(9)] } },
  ),
  i(
    'uncommon',
    'totem-strike',
    'Totem Strike',
    'attack',
    1,
    'foe',
    [scaled(dmg(2), per('totems', 3))],
    { up: { effects: [scaled(dmg(5), per('totems', 3))] } },
  ),

  // --- glue: Auras that stack (every copy answers on its own) ---
  i(
    'uncommon',
    'totem-drum',
    'Totem Drum',
    'power',
    1,
    'none',
    [on('command', [dmg(3, 'randomFoe')])],
    { up: { effects: [on('command', [dmg(4, 'randomFoe')])] } },
  ),
  i('rare', 'harmony', 'Harmony', 'power', 1, 'none', [on('command', [barrier(3)])], {
    up: { effects: [on('command', [barrier(4)])] },
  }),
  i(
    'rare',
    'storm-sovereign',
    'Storm Sovereign',
    'power',
    1,
    'none',
    [on('command', [dmg(3, 'allFoes')])],
    { up: { effects: [on('command', [dmg(4, 'allFoes')])] } },
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
  // (the cycle on its own: each turn the front totem acts and goes)
  i(
    'rare',
    'spirit-chorus',
    'Spirit Chorus',
    'power',
    2,
    'none',
    [on('turnStart', [commandTotem('front'), barrier(2)])],
    { up: { innate: true } },
  ),

  // --- glue: Spirit ---
  i('uncommon', 'spirit-surge', 'Spirit Surge', 'skill', 2, 'none', [gainSpirit(1), barrier(8)], {
    up: { effects: [gainSpirit(1), barrier(12)] },
  }),
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
  i('rare', 'spirit-walk', 'Spirit Walk', 'skill', 1, 'none', [gainSpirit(1), draw(2)], {
    exhaust: true,
    up: { effects: [gainSpirit(1), draw(3)] },
  }),

  // --- glue: utility ---
  i('common', 'stone-skin', 'Stone Skin', 'skill', 1, 'none', [barrier(9)]),
  i('common', 'tidecaller', 'Tidecaller', 'skill', 1, 'none', [barrier(7), manaNext(1)], {
    up: { effects: [barrier(10), manaNext(1)] },
  }),
  i('common', 'read-the-winds', 'Read the Winds', 'skill', 1, 'none', [scry(3), barrier(4)], {
    up: { effects: [scry(3), barrier(7)] },
  }),
  // (free cycling: it draws one and discards one, so it never replaces itself for nothing)
  i(
    'common',
    'wind-whisper',
    'Wind Whisper',
    'skill',
    0,
    'none',
    [draw(1), discard(1), barrier(3)],
    {
      up: { effects: [draw(1), discard(1), barrier(5)] },
    },
  ),
  i('uncommon', 'clear-spring', 'Clear Spring', 'skill', 1, 'none', [draw(3)]),
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
