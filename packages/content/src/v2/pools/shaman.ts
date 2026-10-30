// Ilvane (display name; the id stays 'shaman', DECISIONS #141), an elder shaman of the old spirits. Rebuilt a third time on
// 2026-10-29 to Robert's direction (DECISIONS #430, the totem cycle): his totems stand in a row in the order they were planted, as
// Slay the Spire 2's orbs do. Each does something every turn while it stands (its passive); a command makes the FRONT totem's spirit
// act and consumes it, and planting into a full row pushes the front one out, which acts as it goes. Every totem number grows by 1
// for each Spirit he has (the Elder Tree and the Moon Owl excepted). Trinity and the totems' help on spells are gone (#420-#422 are
// in the DECISIONS log; their cards are frozen in reviews/balance-baselines/2026-10-29-shaman-cycle/). No summons.
//
// Totems (TOTEMS below; +1 Spirit adds 1 to each number marked +S):
//   Hawk        - end of turn: 3+S damage to a random enemy;        command: 7+S to a random enemy
//   Bear        - end of turn: 2+S Barrier;                         command: 6+S Barrier
//   Thunderbird - end of turn: 3+S damage to 2 different random enemies (25% more when one stands);   command: 8+S to every enemy
//   Elder Tree  - (rare) start of turn: 1 Mana;                     command: 2 Mana
//   Moon Owl    - (rare) the Dark orb: end of turn: its charge (shared by every Owl, status umbra) grows by 6;   command: 6 + the charge to the weakest enemy, the charge is spent
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
  commandTotem,
  discard,
  exhaustN,
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
  returnPlayed,
  scaled,
  reshuffle,
  recost,
  scry,
  status,
  statusTheirs,
  STATUS_TAG,
  STORM,
  totemSlot,
  when,
  wound,
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
/** plant `n` of a totem at once (the card says "Plant 2 Bears", not the same sentence twice) */
const plantN = (spirit: string, n: number): Op => ({ op: 'plant', spirit, times: n });
/** add `n` Wounds to your discard pile in one line */
const woundN = (n: number): Op => ({ op: 'addCard', card: 'wound', to: 'discard', side: 'self', times: n });
/** a totem number: +1 for each Spirit he has */
const sp = <T extends Op>(o: T): T => scaled(o, per('spirit'));

export const TOTEMS: TotemDef[] = [
  {
    id: 'hawk',
    name: 'Hawk',
    text: 'At the end of your turn: deal 3 (+1 per Spirit) damage to a random enemy. Command: deal 7 (+1 per Spirit) damage to a random enemy.',
    aim: 'none',
    command: [sp(dmg(7, 'randomFoe'))],
    empower: false,
    passive: { when: 'turnEnd', ops: [sp(dmg(3, 'randomFoe'))] },
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
    // (the Dark orb: it grows every turn and hits the weakest enemy when it goes; the charge is shared by all your Owls)
    text: 'At the end of your turn: its charge grows by 6. Command: deal 6 plus its charge to the enemy with the least HP; the charge is spent.',
    aim: 'none',
    command: [scaled(dmg(6, 'weakestFoe'), per('umbra')), status('umbra', -999)],
    empower: false,
    passive: { when: 'turnEnd', ops: [status('umbra', 6)] },
    rare: true,
  },
];

const i = pool('shaman', 'nexus');
/** Sapped on every enemy until the end of their next turn (a Storm ward) */
const sapAll = (n: number): Op => statusTheirs('sapped', n, 'allFoes');
const ifBurning = (ops: Op[]): Op => ({ op: 'when', by: 'burn', of: 'target', atLeast: 1, ops });
/** doubles the target's Burn with no limit (Robert, 2026-10-30; balance.test lets Wildfire off the cap rule, it Consumes) */
const doubleBurn: Op = { op: 'scaleStatus', status: 'burn', mult: 2, to: 'target' };
const gatheringStorm = (n: number, grow: number): Op[] => [
  scaled(fork(n, 2), per('bonus')),
  forge('gathering-storm', grow),
];

export const SHAMAN: CardDef[] = [
  // --- basics ---
  // (the starting Hawk: it works every turn it stands)
  i('basic', 'raise-the-hawk', 'Raise the Hawk', 'skill', 1, 'none', [plant('hawk')], {
    up: { cost: 0 },
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
  i('basic', 'spirit-call', 'Spirit Call', 'skill', 1, 'none', [commandTotem('front', 2)], {
    up: { cost: 0 },
  }),

  // --- Flame: big single-target bursts; Burn is a small extra ---
  i(
    'common',
    'firebrand',
    'Firebrand',
    'attack',
    1,
    'foe',
    [dmg(7), ifBurning([dmg(4)]), status('burn', 1, 'target')],
    { ...FLAME, up: { effects: [dmg(10), ifBurning([dmg(4)]), status('burn', 1, 'target')] } },
  ),
  i('common', 'twin-cinders', 'Twin Cinders', 'attack', 1, 'foe', [dmg(4, 'target', 2), status('burn', 2, 'target')], {
    ...FLAME,
    up: { effects: [dmg(6, 'target', 2), status('burn', 2, 'target')] },
  }),
  i('common', 'flame-spear', 'Flame Spear', 'attack', 2, 'foe', [dmg(16), status('burn', 3, 'target')], {
    ...FLAME,
    up: { effects: [dmg(19), status('burn', 5, 'target')] },
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
    'spirit-lance',
    'Spirit Lance',
    'attack',
    1,
    'foe',
    [scaled(dmg(7), per('spirit')), { op: 'draw', amount: 4, keepCost: 0 }],
    {
      ...FLAME,
      up: { effects: [scaled(dmg(10), per('spirit')), { op: 'draw', amount: 5, keepCost: 0 }] },
    },
  ),
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
  // (a free ward that clutters the discard pile with a Void)
  i('common', 'hasty-ward', 'Hasty Ward', 'skill', 0, 'none', [barrier(6), wound('self', 'void-drain')], {
    ...FROST,
    up: { effects: [barrier(9), wound('self', 'void-drain')] },
  }),
  // (a Frost ward that brings a Bear)
  i('common', 'wardkeepers-pact', 'Bear Call', 'skill', 1, 'none', [plant('bear'), barrier(4)], {
    ...FROST,
    up: { effects: [plant('bear'), barrier(7)] },
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

  // --- Storm: every enemy, or Forks; Sapped for defence ---
  // (a stacking storm: every copy hits every enemy 3 harder each time one is cast, for the fight)
  i('common', 'gathering-storm', 'Gathering Storm', 'attack', 0, 'none', gatheringStorm(4, 3), {
    ...STORM,
    forgeWord: 'Gather',
    up: { effects: gatheringStorm(6, 3) },
  }),
  i('common', 'gale-call', 'Gale Call', 'attack', 1, 'none', [dmg(6, 'allFoes'), draw(1)], {
    ...STORM,
    up: { effects: [dmg(9, 'allFoes'), draw(1)] },
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

  // --- glue: planting totems (at the back of the row; a full row pushes the front one out, and it acts as it goes) ---
  // (a Hawk on each of your next two turns, not now)
  i(
    'common',
    'spark-cast',
    'Hawk Call',
    'skill',
    1,
    'none',
    [barrier(4), on('turnStart', [plant('hawk')], { times: 2 })],
    { up: { effects: [barrier(7), on('turnStart', [plant('hawk')], { times: 2 })] } },
  ),
  // (free Mana, paid for with a Void in the discard pile, which costs you Mana when it is drawn)
  i('common', 'spirit-offering', 'Spirit Offering', 'skill', 0, 'none', [mana(2), wound('self', 'void-drain')], {
    up: { effects: [mana(3), wound('self', 'void-drain')] },
  }),
  // (a free, one-shot Spirit boost: it wears off at the end of the turn)
  i('common', 'spirit-rush', 'Spirit Rush', 'skill', 0, 'none', [status('spirit', 2, 'self', true)], {
    exhaust: true,
    up: { effects: [status('spirit', 3, 'self', true)] },
  }),
  i('common', 'raise-a-totem', 'Raise a Totem', 'skill', 1, 'none', [plant('*'), barrier(4)], {
    up: { effects: [plant('*'), barrier(7)] },
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
    2,
    'none',
    [{ op: 'totemSlot', amount: 2 }, barrier(5), draw(1)],
    {
      up: { effects: [{ op: 'totemSlot', amount: 2 }, barrier(8), draw(1)] },
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
  // (a dive that brings a Hawk)
  i('common', 'hawks-dive', "Hawk's Dive", 'attack', 1, 'foe', [dmg(7), plant('hawk')], {
    up: { effects: [dmg(10), plant('hawk')] },
  }),

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
  i(
    'rare',
    'storm-sovereign',
    'Storm Sovereign',
    'power',
    1,
    'none',
    [on('command', [dmg(3, 'allFoes'), barrier(3)])],
    { up: { effects: [on('command', [dmg(4, 'allFoes'), barrier(4)])] } },
  ),
  // (the cycle on its own: each turn the front totem acts and goes)

  // --- glue: Spirit ---
  i('uncommon', 'spirit-surge', 'Spirit Surge', 'skill', 2, 'none', [gainSpirit(2), barrier(8)], {
    up: { effects: [gainSpirit(3), barrier(12)] },
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
  i('common', 'read-the-winds', 'Read the Winds', 'skill', 0, 'none', [scry(3)], {
    exhaust: true,
    up: { effects: [scry(5)] },
  }),
  // (free cycling: it draws one and discards one, so it never replaces itself for nothing)
  // (a free sweep of the draw pile: the Status cards in it go to the discard pile, so you do not draw them)
  i('common', 'sweep-away', 'Sweep Away', 'skill', 0, 'none', [{ op: 'sweep', tag: STATUS_TAG }], {
    up: { effects: [{ op: 'sweep', tag: STATUS_TAG }, barrier(4)] },
  }),
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

  // --- Flame (more, from the Defect: the uncommons and rares, Robert 2026-10-30; original names, not priced) ---
  i('uncommon', 'ash-chant', 'Ash Chant', 'power', 1, 'none', [on('created', [status('burn', 5, 'allFoes')])], {
    up: { effects: [on('created', [status('burn', 7, 'allFoes')])] },
  }),
  // (the status payoffs, to rival the Drunkard's Haymaker: 3 per Status card anywhere in your deck, as his is 3 per Hangover, which tops out at 10)
  i('rare', 'sorrows-hammer', "Sorrow's Hammer", 'attack', 2, 'foe', [scaled(dmg(12), { by: 'tagDeck', tag: STATUS_TAG, mult: 3 })], {
    ...FLAME,
    up: { effects: [scaled(dmg(18), { by: 'tagDeck', tag: STATUS_TAG, mult: 3 })] },
  }),
  i('rare', 'echoing-strike', 'Echoing Strike', 'attack', 2, 'foe', [dmg(18), { op: 'copySelf', to: 'discard', free: true }], {
    ...FLAME,
    up: { effects: [dmg(23), { op: 'copySelf', to: 'discard', free: true }] },
  }),
  i('rare', 'return-of-the-free', 'Return of the Free', 'attack', 2, 'foe', [dmg(10), { op: 'fetch', amount: 99, to: 'hand', maxCost: 0 }], {
    ...FLAME,
    up: { effects: [dmg(14), { op: 'fetch', amount: 99, to: 'hand', maxCost: 0 }] },
  }),
  i('uncommon', 'twin-talons', 'Twin Talons', 'attack', 3, 'foe', [dmg(9, 'target', 2), plantN('hawk', 2)], {
    ...FLAME,
    up: { effects: [dmg(12, 'target', 2), plantN('hawk', 2)] },
  }),
  i('uncommon', 'boon-strike', 'Boon Strike', 'attack', 2, 'foe', [dmg(14), status('freepower', 1)], {
    ...FLAME,
    up: { effects: [dmg(18), status('freepower', 1)] },
  }),
  i('rare', 'spent-strike', 'Spent Strike', 'attack', 0, 'foe', [scaled(dmg(0), per('manaSpent', 3))], {
    ...FLAME,
    up: { effects: [scaled(dmg(0), per('manaSpent', 4))] },
  }),
  i(
    'rare',
    'flak-burst',
    'Flak Burst',
    'attack',
    2,
    'none',
    [
      { op: 'exhaustCards', amount: 99, any: true, everywhere: true, tag: STATUS_TAG },
      scaled({ op: 'damage', amount: 8, hits: 0, to: 'randomFoe' }, per('exhaustedNow', 1, undefined, 'hits')),
    ],
    {
      up: {
        effects: [
          { op: 'exhaustCards', amount: 99, any: true, everywhere: true, tag: STATUS_TAG },
          scaled({ op: 'damage', amount: 11, hits: 0, to: 'randomFoe' }, per('exhaustedNow', 1, undefined, 'hits')),
        ],
      },
    },
  ),

  // --- Frost (more) ---
  i('uncommon', 'cold-breath', 'Cold Breath', 'skill', 0, 'none', [{ op: 'plant', spirit: 'bear', scale: per('foes') }], {
    ...FROST,
    exhaust: true,
    up: { exhaust: false },
  }),
  i('uncommon', 'frostbound-hide', 'Frostbound Hide', 'skill', 2, 'none', [barrier(6), plantN('bear', 2)], {
    ...FROST,
    up: { effects: [barrier(9), plantN('bear', 2)] },
  }),
  i(
    'uncommon',
    'grim-ward',
    'Grim Ward',
    'skill',
    1,
    'none',
    [barrier(13), woundN(2)],
    { ...FROST, up: { effects: [barrier(17), woundN(2)] } },
  ),
  i('uncommon', 'dawn-ward', 'Dawn Ward', 'skill', 0, 'none', [barrier(10)], {
    ...FROST,
    innate: true,
    exhaust: true,
    up: { effects: [barrier(13)] },
  }),
  i(
    'rare',
    'glacial-lance',
    'Glacial Lance',
    'attack',
    3,
    'foe',
    [dmg(19), plantN('bear', 3)],
    { ...FROST, up: { effects: [dmg(24), plantN('bear', 3)] } },
  ),
  i(
    'rare',
    'totem-mantle',
    'Totem Mantle',
    'power',
    1,
    'none',
    [on('turnStart', [scaled(barrier(0), per('totemKinds', 2))])],
    { up: { effects: [on('turnStart', [scaled(barrier(0), per('totemKinds', 3))])] } },
  ),
  i(
    'rare',
    'hail-chant',
    'Hail Chant',
    'power',
    1,
    'none',
    [on('turnEnd', [ifTotem('bear', [status('faltering', 1, 'allFoes'), barrier(4)])])],
    {
      up: {
        effects: [on('turnEnd', [ifTotem('bear', [status('faltering', 2, 'allFoes'), barrier(6)])])],
      },
    },
  ),
  i(
    'rare',
    'consuming-dusk',
    'Consuming Dusk',
    'power',
    2,
    'none',
    [plantN('owl', 2), on('turnEnd', [commandTotem('front')])],
    { up: { effects: [plantN('owl', 3), on('turnEnd', [commandTotem('front')])] } },
  ),
  i(
    'rare',
    'three-winds',
    'Three Winds',
    'skill',
    2,
    'none',
    [plant('thunderbird'), plant('bear'), plant('owl')],
    { exhaust: true, up: { cost: 1 } },
  ),

  // --- Storm (more) ---
  i('uncommon', 'storm-chant', 'Storm Chant', 'power', 2, 'none', [on('play', [mana(1), plant('thunderbird')], { filter: 'power' })], {
    up: { effects: [on('play', [mana(1), plantN('thunderbird', 2)], { filter: 'power' })] },
  }),
  // (and Blind Drunk: 2 hits at random, and one more for every Status card in your deck)
  i(
    'rare',
    'blighted-chorus',
    'Blighted Chorus',
    'attack',
    2,
    'none',
    [scaled(dmg(5, 'randomFoe', 2), { by: 'tagDeck', tag: STATUS_TAG, into: 'hits' })],
    { ...STORM, up: { effects: [scaled(dmg(6, 'randomFoe', 2), { by: 'tagDeck', tag: STATUS_TAG, into: 'hits' })] } },
  ),
  i('uncommon', 'swift-strike', 'Swift Strike', 'attack', 0, 'foe', [dmg(5), when('played', { atMost: 2 }, [draw(1)])], {
    ...STORM,
    up: { effects: [dmg(6), when('played', { atMost: 3 }, [draw(1)])] },
  }),
  i('rare', 'shattering-call', 'Shattering Call', 'attack', 2, 'none', [dmg(7, 'allFoes'), commandTotem('all', 2)], {
    ...STORM,
    exhaust: true,
    up: { cost: 1, effects: [dmg(11, 'allFoes'), commandTotem('all', 2)] },
  }),
  // (X cost: Tempest channelled X Lightning, upgraded: X counts as one more, like every X card)
  i('uncommon', 'thunder-rush', 'Thunder Rush', 'skill', 0, 'none', [{ op: 'plant', spirit: 'thunderbird', scale: per('x') }], {
    ...STORM,
    x: true,
  }),
  i('uncommon', 'spark-strike', 'Spark Strike', 'attack', 0, 'foe', [scaled(dmg(3), { by: 'totemsOf', rune: 'thunderbird', mult: 4 })], {
    ...STORM,
    up: { effects: [scaled(dmg(5), { by: 'totemsOf', rune: 'thunderbird', mult: 6 })] },
  }),
  i('rare', 'thunder-beam', 'Thunder Beam', 'attack', 2, 'none', [dmg(28, 'allFoes'), status('spirit', -3)], {
    ...STORM,
    up: { effects: [dmg(36, 'allFoes'), status('spirit', -3)] },
  }),
  i('uncommon', 'swift-study', 'Swift Study', 'skill', 1, 'none', [draw(3)], {
    ...STORM,
    up: { effects: [draw(4)] },
  }),
  i(
    'uncommon',
    'thunder-chant',
    'Thunder Chant',
    'power',
    1,
    'none',
    [{ op: 'totemBoost', rune: 'thunderbird', amount: 5 }],
    { up: { effects: [{ op: 'totemBoost', rune: 'thunderbird', amount: 8 }] } },
  ),

  // --- glue: more Powers and utilities (from the Defect, mapped onto totems) ---
  i('uncommon', 'hurried-prayer', 'Hurried Prayer', 'skill', 0, 'none', [draw(2), wound('self', 'void-drain')], {
    exhaust: true,
    up: { effects: [draw(3), wound('self', 'void-drain')] },
  }),
  i(
    'uncommon',
    'harmonize',
    'Harmonize',
    'skill',
    1,
    'none',
    [scaled(status('spirit', 0, 'self', true), per('totemKinds', 2))],
    { exhaust: true, up: { effects: [scaled(status('spirit', 0, 'self', true), per('totemKinds', 3))] } },
  ),
  i('uncommon', 'double-rite', 'Double Rite', 'skill', 1, 'none', [scaled(mana(0), per('mana'))], {
    exhaust: true,
    up: { cost: 0 },
  }),
  i('uncommon', 'burnt-offering', 'Burnt Offering', 'skill', 1, 'none', [exhaustN(1), manaNext(2)], {
    up: { effects: [exhaustN(1), manaNext(3)] },
  }),
  i('rare', 'awakened-spirit', 'Awakened Spirit', 'power', 1, 'none', [gainSpirit(1)], {
    up: { effects: [gainSpirit(2)] },
  }),
  i('rare', 'echoing-spirit', 'Echoing Spirit', 'power', 3, 'none', [status('echoing', 1)], {
    ethereal: true,
    up: { ethereal: false },
  }),
  i('rare', 'elder-recall', 'Elder Recall', 'power', 1, 'none', [on('turnStart', [draw(1)])], {
    up: { innate: true },
  }),
  i('rare', 'hawk-banner', 'Hawk Banner', 'power', 1, 'none', [on('turnStart', [plant('hawk')])], {
    up: { effects: [plant('hawk'), on('turnStart', [plant('hawk')])] },
  }),
  i('rare', 'wellspring', 'Wellspring', 'skill', 0, 'none', [mana(4)], {
    exhaust: true,
    up: { effects: [mana(5)] },
  }),
  i('rare', 'doubled-vow', 'Doubled Vow', 'skill', 1, 'none', [status('boosted', 1)], {
    exhaust: true,
    up: { cost: 0 },
  }),
  i('rare', 'free-hand', 'Free Hand', 'power', 1, 'none', [status('deftness', 3)], {
    up: { effects: [status('deftness', 4)] },
  }),
  // (X cost: Multi-Cast evoked the rightmost orb X times, upgraded likewise; here the front totem acts X times and is consumed)
  i('rare', 'chain-of-calls', 'Chain of Calls', 'skill', 0, 'none', [{ op: 'totemCommand', spirit: 'front', scale: per('x') }], {
    x: true,
  }),
  // (the Defect's other Powers, with the engine to run them, Robert 2026-10-30: copied as they are, to be changed by hand)
  i('rare', 'salvage-spirit', 'Salvage Spirit', 'power', 1, 'none', [on('created', [plant('*')], { tag: STATUS_TAG })], {
    up: { cost: 0 },
  }),
  i('rare', 'dream-weaving', 'Dream Weaving', 'power', 3, 'none', [on('turnStart', [{ op: 'discover', kind: 'power', count: 1 }])], {
    up: { cost: 2 },
  }),
  i('uncommon', 'snap-back', 'Snap Back', 'power', 2, 'none', [on('play', [returnPlayed], { filter: 'attack', maxCost: 0, once: true })], {
    up: { cost: 1 },
  }),
  i('uncommon', 'bitter-lesson', 'Bitter Lesson', 'power', 1, 'none', [on('draw', [draw(2)], { tag: STATUS_TAG, once: true })], {
    up: { effects: [on('draw', [draw(3)], { tag: STATUS_TAG, once: true })] },
  }),
  i('uncommon', 'turning-wheel', 'Turning Wheel', 'power', 1, 'none', [on('turnStart', [{ op: 'totemPulse' }])], {
    up: { effects: [on('turnStart', [{ op: 'totemPulse', times: 2 }])] },
  }),
  i('rare', 'ward-of-the-spirits', 'Ward of the Spirits', 'power', 2, 'none', [status('buffer', 1)], {
    up: { effects: [status('buffer', 2)] },
  }),
  i('uncommon', 'wild-vision', 'Wild Vision', 'skill', 1, 'none', [{ op: 'discover', kind: 'power', count: 1, turn: true }], {
    exhaust: true,
    up: { cost: 0 },
  }),
  i('uncommon', 'kindling-ward', 'Kindling Ward', 'skill', 1, 'none', [barrier(6), { op: 'transform', tag: STATUS_TAG, into: 'tinder' }], {
    up: { effects: [barrier(7), { op: 'transform', tag: STATUS_TAG, into: 'dry-tinder' }] },
  }),
  i('rare', 'grow-the-pole', 'Grow the Pole', 'skill', 0, 'none', [totemSlot, draw(1), recost(1)], {
    up: { effects: [totemSlot, draw(2), recost(1)] },
  }),
  i('rare', 'fresh-start', 'Fresh Start', 'skill', 0, 'none', [reshuffle, draw(4)], {
    exhaust: true,
    up: { effects: [reshuffle, draw(6)] },
  }),
  i('rare', 'thunder-memory', 'Thunder Memory', 'skill', 3, 'none', [{ op: 'plant', spirit: 'thunderbird', scale: { by: 'channeledOf', rune: 'thunderbird' } }], {
    exhaust: true,
    up: { exhaust: false },
  }),
  // (the supply: three Wounds into your discard pile, and a hand to play them with; each one is a Status card for the payoffs, and Ash Chant, Salvage Spirit and Bitter Lesson answer every one)
  i('uncommon', 'harvest-of-ruin', 'Harvest of Ruin', 'skill', 1, 'none', [woundN(3), draw(2)], {
    up: { effects: [woundN(3), draw(3)] },
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
  // (Void: Slay the Spire 2's, exactly: it costs you a Mana when you draw it)
  junk('void-drain', 'Void', 0, [], { unplayable: true, ethereal: true, onDraw: [mana(-1)] }),
  // (Infection, Toxic, Soot and Debris of Slay the Spire 2, for enemies and events to use)
  junk('blight', 'Blight', 0, [], { unplayable: true, inHandAtEnd: [lose(3)] }),
  junk('venom', 'Venom', 1, [], { exhaust: true, inHandAtEnd: [lose(5)] }),
  junk('smudge', 'Smudge', 0, [], { unplayable: true }),
  junk('scrap', 'Scrap', 1, [], { exhaust: true }),
  // (Fuel, the Defect's: what Compact makes of your status cards; not a status itself)
  junk('tinder', 'Tinder', 0, [mana(1)], { exhaust: true, tags: [] }),
  junk('dry-tinder', 'Dry Tinder', 0, [mana(2)], { exhaust: true, tags: [] }),
];
