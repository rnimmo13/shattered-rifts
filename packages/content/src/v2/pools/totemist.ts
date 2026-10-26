// Ilvane (display name; the id stays 'totemist', DECISIONS #141). An elder shaman who carves. Three build paths (DECISIONS #256):
//   Totems    - plant totems (Hawk hits one enemy, Splinter every enemy, Bear guards, Elder charges, Owl gives Mana), make them
//               stronger with Spirit (the `resonance` status) and more slots, and awaken them for their big effect
//   Whittling - Carvings (tag "carving"): small 0-cost cards that keep coming back from the discard pile, and payoffs for playing them
//   Rites     - Auras that pay you whenever you play another Aura, and cards that scale with how many Auras you have
// Totems stand in 3 slots; a fourth pushes the oldest out and it topples, awakening it.
// (Ids keep the old rune names: `channel`/`evoke` ops, rune ids spark/ward/hollow/prism. Many card ids are older than the card they
// name now: an id keeps a card's art and every saved deck, so a reworked card keeps its id.)

import type { CardDef, RuneDef } from '@sr/combat';
import {
  addTo,
  barrier,
  channel,
  dmg,
  draw,
  evoke,
  mana,
  manaNext,
  maxMana,
  on,
  PREVENT,
  per,
  pool,
  scaled,
  scry,
  status,
  upgradeOp,
  discoverOp,
  lose,
  discard,
  fetchTag,
} from '../build';

export const RUNES: RuneDef[] = [
  {
    id: 'spark',
    name: 'Hawk',
    text: 'Passive: 3 damage to a random enemy at the end of your turn. Awaken: 9 damage to the front enemy.',
    passive: [dmg(3, 'randomFoe')],
    evoke: [dmg(9, 'front')],
  },
  {
    id: 'splinter',
    name: 'Splinter',
    text: 'Passive: 2 damage to every enemy at the end of your turn. Awaken: 6 damage to every enemy.',
    passive: [dmg(2, 'allFoes')],
    evoke: [dmg(6, 'allFoes')],
  },
  {
    id: 'ward',
    name: 'Bear',
    text: 'Passive: 1 Barrier at the end of your turn. Awaken: 6 Barrier.',
    passive: [barrier(1)],
    evoke: [barrier(6)],
  },
  {
    id: 'hollow',
    name: 'Elder',
    text: 'Charges by 2 at the end of each of your turns. Awaken: damage equal to its charge to the front enemy (the charge is spent).',
    grow: 2,
    passive: [],
    evoke: [scaled(dmg(0, 'front'), per('charge'))],
  },
  {
    id: 'prism',
    name: 'Owl',
    text: 'Passive: 1 Barrier at the end of your turn. Awaken: gain 1 Mana.',
    passive: [barrier(1)],
    evoke: [mana(1)],
  },
];

const i = pool('totemist', 'nexus');
/** a Carving: the Whittling build path's small cards (payoffs say "Whenever you play a Carving") */
const CARVING = { tags: ['carving'] };

export const TOTEMIST: CardDef[] = [
  // --- basics ---
  i('basic', 'spark-cast', 'Plant Hawk', 'skill', 1, 'none', [channel('spark'), barrier(3)]),
  i('basic', 'twin-evocation', 'Twin Awakening', 'skill', 1, 'none', [evoke(2)]),

  // --- Totems ---
  i('common', 'crackling-orb', "Hawk's Dive", 'attack', 1, 'foe', [
    dmg(4, 'target', 2),
    channel('spark'),
  ]),
  i('common', 'arc-flash', 'Feather Storm', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    channel('spark'),
  ]),
  i('common', 'spark-lance', 'Talon Lance', 'attack', 2, 'foe', [dmg(12), channel('spark')]),
  i('common', 'splinter-cast', 'Plant Splinter', 'skill', 1, 'none', [channel('splinter')]),
  i('uncommon', 'prismatic-burst', 'Splintering Burst', 'attack', 2, 'none', [
    dmg(6, 'allFoes'),
    channel('splinter'),
  ]),
  i('uncommon', 'shard-chorus', 'Splinter Grove', 'skill', 2, 'none', [channel('splinter', 2)]),
  i('rare', 'glasswright', 'Woodcarver', 'power', 2, 'none', [
    on('turnStart', [channel('splinter')]),
  ]),
  i('uncommon', 'glyph-lattice', 'Totem Row', 'skill', 1, 'none', [{ op: 'runeSlots', amount: 2 }]),
  i('uncommon', 'charged-blow', 'Awakened Blow', 'attack', 1, 'foe', [
    scaled(dmg(4), per('runes', 2)),
  ]),
  // (awakens the whole row; half a Mana for each totem, so it is never a free Mana engine)
  i(
    'uncommon',
    'shatter-the-row',
    'Shatter the Row',
    'skill',
    0,
    'none',
    [scaled(mana(0), per('runes', 0.5)), scaled(draw(0), per('runes')), evoke(10)],
    { exhaust: true },
  ),
  i(
    'rare',
    'glyphstorm',
    'Totem Storm',
    'skill',
    0,
    'none',
    [{ op: 'channel', rune: 'splinter', times: 0, scale: per('x') }, draw(1)],
    { x: true },
  ),
  i('rare', 'grand-glyph', 'Grand Totem', 'skill', 3, 'none', [
    channel('spark'),
    channel('ward'),
    channel('hollow'),
  ]),
  i('common', 'rune-barrage', 'Totem Barrage', 'attack', 1, 'none', [
    scaled({ op: 'damage', amount: 2, hits: 0, to: 'allFoes' }, per('runes', 1, undefined, 'hits')),
  ]),
  i('uncommon', 'driver-of-runes', 'Totem Driver', 'attack', 1, 'foe', [
    dmg(7),
    scaled(draw(0), per('runes', 0.5)),
  ]),
  i('rare', 'meteor-glyph', 'Meteor Totem', 'attack', 3, 'foe', [
    dmg(22),
    channel('prism'),
    channel('ward'),
  ]),
  i('common', 'forked-current', 'Forked Branch', 'attack', 2, 'none', [
    dmg(8, 'allFoes'),
    channel('spark'),
  ]),
  i('uncommon', 'spent-coil', 'Spent Husk', 'skill', 1, 'none', [evoke(), channel('spark')]),
  i('rare', 'sparkstorm', 'Hawkstorm', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('runes'))]),
  ]),
  i('uncommon', 'arc-reactor', 'Heartwood', 'attack', 2, 'foe', [
    dmg(6, 'target', 2),
    channel('spark'),
  ]),
  i('rare', 'blazing-aperture', 'Blazing Eye', 'attack', 3, 'none', [dmg(18, 'allFoes'), evoke(3)]),
  i(
    'uncommon',
    'static-snare',
    'Static Trap',
    'snare',
    1,
    'none',
    [dmg(6, 'allFoes'), channel('splinter')],
    { trigger: { on: 'foeTurn' } },
  ),
  i('common', 'frostglass', 'Frostbark', 'skill', 2, 'none', [
    barrier(4),
    channel('ward'),
    channel('hollow'),
  ]),
  i('common', 'ward-strike', 'Bear Strike', 'attack', 1, 'foe', [dmg(6), channel('ward')]),
  i(
    'common',
    'cold-snap',
    'Bear Pack',
    'skill',
    1,
    'none',
    [{ op: 'channel', rune: 'ward', times: 0, scale: per('foes') }],
    { exhaust: true },
  ),
  i('uncommon', 'chilled-focus', "Bear's Patience", 'skill', 1, 'none', [channel('ward'), scry(3)]),
  i('uncommon', 'rune-carapace', 'Bark Carapace', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('runes'))]),
  ]),
  i('uncommon', 'rune-shield', 'Totem Shield', 'skill', 1, 'none', [
    scaled(barrier(0), per('runes', 3)),
  ]),
  i('rare', 'glacial-bastion', 'Ancient Bastion', 'skill', 2, 'none', [
    barrier(10),
    channel('ward', 2),
  ]),
  i('common', 'rime-strike', 'Barkskin Strike', 'attack', 1, 'foe', [
    dmg(5),
    barrier(4),
    channel('ward'),
  ]),
  i('uncommon', 'permafrost', 'Den of Bears', 'power', 2, 'none', [
    on('turnStart', [channel('ward')]),
  ]),
  i('rare', 'echoing-loop', 'Unending Call', 'power', 2, 'none', [
    on('turnEnd', [evoke(1, 1, true)]),
  ]),
  i('common', 'crystal-ward', 'Bark Ward', 'skill', 1, 'none', [barrier(7), channel('ward')], {
    retain: true,
  }),
  i('common', 'frost-nova', 'Bramble Bloom', 'attack', 1, 'none', [
    dmg(5, 'allFoes'),
    status('faltering', 1, 'allFoes'),
    channel('ward'),
  ]),
  i('uncommon', 'bulwark-glyph', 'Bulwark Totem', 'skill', 2, 'none', [
    scaled(barrier(4), per('runes', 3)),
    status('bracing', 1),
  ]),
  i('rare', 'aegis-array', 'Totem Ring', 'skill', 3, 'none', [barrier(8), channel('ward', 3)]),
  i('uncommon', 'rune-snare', 'Totem Trap', 'snare', 2, 'none', [PREVENT, channel('ward')], {
    trigger: { on: 'attacked' },
  }),
  i('common', 'hollow-strike', 'Elder Strike', 'attack', 1, 'foe', [dmg(7), channel('hollow')]),
  i('uncommon', 'gloomwave', "Elder's Roar", 'attack', 2, 'none', [
    dmg(10, 'allFoes'),
    channel('hollow'),
  ]),
  i('uncommon', 'echo-chamber', 'Echo Chamber', 'skill', 1, 'none', [evoke(1, 1, true)]),
  // (one Spirit and a slot to put it to work: Spirit alone was a plain copy of a famous card)
  i('uncommon', 'tune-the-lattice', 'Tune the Spirits', 'power', 1, 'none', [
    status('resonance', 1),
    { op: 'runeSlots', amount: 1 },
  ]),
  i('uncommon', 'overtune', 'Spirit Surge', 'skill', 1, 'none', [status('resonance', 1), draw(1)], {
    exhaust: true,
  }),
  i('uncommon', 'resonant-strike', 'Spirit Strike', 'attack', 1, 'foe', [
    scaled(dmg(6), per('resonance', 2)),
  ]),
  i('rare', 'chorus-of-glyphs', 'Chorus of Totems', 'power', 2, 'none', [
    status('resonance', 2),
    { op: 'runeSlots', amount: 1 },
  ]),
  i('common', 'void-pulse', "Elder's Shelter", 'skill', 1, 'none', [channel('hollow'), barrier(4)]),
  i('uncommon', 'deep-charge', 'Deep Roots', 'skill', 1, 'none', [channel('hollow'), draw(1)]),
  i('rare', 'abyssal-glyph', 'Ancient Elder', 'skill', 2, 'none', [channel('hollow', 2)]),
  i('rare', 'consuming-dark', 'Elder Vigil', 'power', 2, 'none', [
    on('turnEnd', [channel('hollow')]),
  ]),
  i('rare', 'biased-weave', 'Sap Offering', 'power', 2, 'none', [
    status('resonance', 3),
    on('turnStart', [lose(1)]),
  ]),
  i('uncommon', 'hollow-tide', 'Elder Tide', 'attack', 2, 'foe', [
    scaled(dmg(6), per('resonance', 2)),
    channel('hollow'),
  ]),
  i('rare', 'echo-cascade', 'Echo Cascade', 'skill', 2, 'none', [evoke(1, 3, true)], {
    exhaust: true,
  }),
  i(
    'rare',
    'lattice-collapse',
    'Toppling Row',
    'attack',
    2,
    'none',
    [scaled(dmg(8, 'allFoes'), per('runes', 4)), evoke(3)],
    { exhaust: true },
  ),
  i('rare', 'gathering-dark', 'Gathering Elders', 'power', 2, 'none', [
    on('play', [channel('hollow')], { filter: 'skill' }),
  ]),
  i('common', 'silent-glyph', 'Silent Totem', 'skill', 1, 'none', [barrier(5), channel('hollow')], {
    onDiscard: [channel('hollow')],
  }),
  i('common', 'rune-burst', 'Totem Burst', 'skill', 1, 'none', [evoke(), draw(1)]),
  i('common', 'glimmer', 'Owl Glint', 'skill', 1, 'none', [channel('prism')], { exhaust: true }),
  i('uncommon', 'prism-cut', 'Owl Cut', 'skill', 1, 'none', [channel('prism'), draw(1)]),
  i('uncommon', 'prism-beam', "Owl's Gaze", 'attack', 0, 'foe', [
    dmg(3),
    status('exposed', 1, 'target'),
  ]),
  i('uncommon', 'harmonic-wave', 'Spirit Wave', 'attack', 2, 'none', [dmg(11, 'allFoes'), evoke()]),
  // (the awakened totem stays: one totem answers again and again, but the card is spent)
  i(
    'uncommon',
    'many-voices',
    'Many Voices',
    'skill',
    0,
    'none',
    [{ op: 'evoke', times: 0, keep: true, scale: per('x') }],
    { x: true, exhaust: true },
  ),
  i('rare', 'glyph-engine', 'Totem Engine', 'power', 2, 'none', [
    on('turnStart', [channel('spark')]),
  ]),
  i(
    'uncommon',
    'glyph-trap',
    'Hidden Totem',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), channel('ward')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  i('uncommon', 'stored-charge', 'Stored Charge', 'skill', 1, 'none', [
    manaNext(1),
    channel('ward'),
  ]),

  // --- Whittling ---
  // Carvings: 0-cost, small, and they come back (Gather the Shavings, Fresh Shavings, Clear the Bench)
  i('common', 'live-wire', 'Hawk Carving', 'attack', 0, 'foe', [dmg(5)], CARVING),
  i('common', 'sweeping-ray', 'Talon Carving', 'attack', 0, 'none', [dmg(3, 'allFoes')], CARVING),
  i('common', 'echo-of-glyphs', 'Bear Carving', 'skill', 0, 'none', [barrier(5)], CARVING),
  i('common', 'skim-the-weave', 'Owl Carving', 'skill', 0, 'none', [scry(3)], CARVING),
  i(
    'uncommon',
    'umbra-glyph',
    'Elder Carving',
    'attack',
    0,
    'foe',
    [scaled(dmg(2), per('played'))],
    CARVING,
  ),
  i('common', 'bleed-the-void', 'Splinter Carving', 'skill', 0, 'none', [channel('splinter')], {
    ...CARVING,
    exhaust: true,
  }),
  i('common', 'rune-recall', 'Gather the Shavings', 'skill', 1, 'none', [
    barrier(3),
    fetchTag(2, 'carving'),
  ]),
  i('uncommon', 'void-dividend', 'Fresh Shavings', 'skill', 1, 'none', [
    draw(2),
    fetchTag(1, 'carving'),
  ]),
  i('uncommon', 'streamlined-strike', 'Whittle Down', 'attack', 1, 'foe', [
    scaled(dmg(4), per('played', 2)),
  ]),
  i('uncommon', 'conduit', "Whittler's Knife", 'power', 1, 'none', [
    on('play', [dmg(3, 'randomFoe')], { tag: 'carving' }),
  ]),
  i('rare', 'frozen-ledger', 'Shavings Underfoot', 'power', 1, 'none', [
    on('play', [barrier(3)], { tag: 'carving' }),
  ]),
  i('rare', 'creative-engine', "Carver's Bench", 'power', 2, 'none', [
    on('turnStart', [addTo('live-wire'), addTo('echo-of-glyphs')]),
  ]),
  i('rare', 'rainbow-glyph', 'Living Wood', 'power', 3, 'none', [
    on('play', [channel('splinter')], { tag: 'carving' }),
  ]),
  i(
    'rare',
    'reset-the-weave',
    'Clear the Bench',
    'skill',
    1,
    'none',
    [discard(9, 'any'), fetchTag(10, 'carving'), draw(1)],
    { exhaust: true },
  ),

  // --- Rites ---
  // Auras that pay off when another Aura is played, and cards that count your Auras
  i('common', 'static-guard', 'Rite Strike', 'attack', 1, 'foe', [
    scaled(dmg(5), per('powers', 2)),
  ]),
  i('common', 'glyph-guard', 'Rite of Warding', 'skill', 1, 'none', [
    scaled(barrier(5), per('powers', 2)),
  ]),
  i('common', 'spark-cluster', 'Kindled Rite', 'power', 0, 'none', [on('turnEnd', [barrier(3)])]),
  i('common', 'ice-shell', 'Rite of Thorns', 'power', 0, 'none', [
    on('turnStart', [dmg(3, 'randomFoe')]),
  ]),
  i('uncommon', 'glacial-memory', 'Drum Circle', 'skill', 1, 'none', [
    draw(1),
    scaled(draw(0), per('powers', 0.5)),
  ]),
  i('uncommon', 'thundercall', 'Thunder Rite', 'power', 1, 'none', [
    on('play', [channel('splinter'), barrier(2)], { filter: 'power' }),
  ]),
  i('uncommon', 'sentinel-sigil', 'Sentinel Totem', 'power', 2, 'none', [
    status('shielded', 1),
    on('turnStart', [barrier(3)]),
  ]),
  i('uncommon', 'tuning-fork', 'Spirit Drum', 'power', 2, 'none', [
    on('play', [barrier(4)], { filter: 'power' }),
  ]),
  i('rare', 'machine-learning', 'Ancestral Learning', 'power', 1, 'none', [
    on('play', [draw(1)], { filter: 'power' }),
  ]),
  i('rare', 'fevered-attunement', 'Fevered Communion', 'power', 2, 'none', [
    status('resonance', 1),
    on('play', [status('resonance', 1)], { filter: 'power' }),
  ]),
  i(
    'rare',
    'white-noise',
    'Spirit Whisper',
    'skill',
    1,
    'none',
    [discoverOp('power', 1, true), draw(1)],
    {
      exhaust: true,
    },
  ),
  i(
    'rare',
    'hyperbeam',
    'Skyfall Rite',
    'attack',
    2,
    'none',
    [scaled(dmg(8, 'allFoes'), per('powers', 2))],
    {
      exhaust: true,
    },
  ),
  i('rare', 'echoing-form', 'Echoing Chant', 'power', 3, 'none', [
    on('turnStart', [scaled(dmg(0, 'allFoes'), per('powers', 2))]),
  ]),

  // --- glue ---
  i('uncommon', 'retune', 'Retune', 'skill', 1, 'none', [upgradeOp('random')], { exhaust: true }),
  i('rare', 'leyline-tap', 'Root Tap', 'skill', 2, 'none', [maxMana(1), barrier(6)], {
    exhaust: true,
  }),
  i('legendary', 'the-grand-design', 'The Great Pole', 'power', 3, 'none', [
    { op: 'runeSlots', amount: 3 },
    status('resonance', 3),
    on('turnStart', [channel('hollow')]),
  ]),
  i(
    'legendary',
    'cataclysm-glyph',
    'Cataclysm Totem',
    'attack',
    2,
    'none',
    [dmg(10, 'allFoes'), evoke(10, 2)],
    { exhaust: true },
  ),
];
