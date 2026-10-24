// Ilvane (display name; the id stays 'ilvane', DECISIONS #141). Carves totems and plants them in a row. Three lanes:
//   Hawk    - damage totems: chip every turn, burst when they topple (Hawk hits one enemy, Splinter hits every enemy)
//   Bear    - Barrier totems: defence that accumulates
//   Elder   - ancestral totems that build for a huge awakening, and Spirit (the `resonance` status) to make every totem stronger
// Awaken cards (glue) cash totems in early. Totems stand in 3 slots; a fourth pushes the oldest out and it topples, awakening it.
// (Ids keep the old rune names: `channel`/`evoke` ops, rune ids spark/ward/hollow/prism.)

import type { CardDef, RuneDef } from '@sr/combat';
import {
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
  status,
  upgradeOp,
  fetchCards,
  discoverOp,
  lose,
  cheapen,
  discard,
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
    text: 'Charges by 2 at the end of each of your turns. Awaken: damage equal to its charge to the front enemy.',
    grow: 2,
    passive: [],
    evoke: [scaled(dmg(0, 'front'), per('charge'))],
  },
  {
    id: 'prism',
    name: 'Owl',
    text: 'Passive: 1 Barrier at the end of your turn. Awaken: gain 1 Mana and draw a card.',
    passive: [barrier(1)],
    evoke: [mana(1), draw(1)],
  },
];

const i = pool('ilvane', 'nexus');

export const ILVANE: CardDef[] = [
  // --- basics ---
  i('basic', 'spark-cast', 'Plant Hawk', 'skill', 1, 'none', [channel('spark')]),
  i('basic', 'twin-evocation', 'Twin Awakening', 'skill', 1, 'none', [evoke(1, 2)]),

  // --- Hawk ---
  i('common', 'crackling-orb', "Hawk's Dive", 'attack', 1, 'foe', [dmg(7), channel('spark')]),
  i('common', 'arc-flash', 'Feather Storm', 'attack', 1, 'none', [dmg(4, 'allFoes'), channel('spark')]),
  i('common', 'spark-lance', 'Talon Lance', 'attack', 2, 'foe', [dmg(12), channel('spark')]),
  i('common', 'spark-cluster', 'Hawk Flock', 'skill', 2, 'none', [channel('spark', 2)]),
  i('common', 'static-guard', 'Wary Hawk', 'skill', 1, 'none', [barrier(5), channel('spark')]),
  i('common', 'splinter-cast', 'Plant Splinter', 'skill', 1, 'none', [channel('splinter')]),
  i('uncommon', 'prismatic-burst', 'Splintering Burst', 'attack', 2, 'none', [
    dmg(6, 'allFoes'),
    channel('splinter'),
  ]),
  i('uncommon', 'shard-chorus', 'Splinter Grove', 'skill', 2, 'none', [channel('splinter', 2)]),
  i('rare', 'glasswright', 'Woodcarver', 'power', 2, 'none', [
    on('turnStart', [channel('splinter')]),
  ]),
  i('uncommon', 'glyph-lattice', 'Totem Row', 'skill', 1, 'none', [
    { op: 'runeSlots', amount: 2 },
  ]),
  i('uncommon', 'thundercall', 'Stormcall', 'power', 1, 'none', [
    on('play', [channel('spark')], { filter: 'power' }),
  ]),
  i('uncommon', 'charged-blow', 'Awakened Blow', 'attack', 1, 'foe', [
    scaled(dmg(4), per('runes', 2)),
  ]),
  i(
    'uncommon',
    'shatter-the-row',
    'Shatter the Row',
    'skill',
    0,
    'none',
    [scaled(mana(0), per('runes')), scaled(draw(0), per('runes')), evoke(10)],
    { exhaust: true },
  ),
  i(
    'rare',
    'glyphstorm',
    'Totem Storm',
    'skill',
    0,
    'none',
    [{ op: 'channel', rune: 'spark', times: 0, scale: per('x') }],
    { x: true },
  ),
  i('rare', 'grand-glyph', 'Grand Totem', 'skill', 3, 'none', [
    channel('spark'),
    channel('ward'),
    channel('hollow'),
  ]),

  // (more Spark)
  i('common', 'rune-barrage', 'Totem Barrage', 'attack', 1, 'foe', [
    scaled({ op: 'damage', amount: 4, hits: 0, to: 'target' }, per('runes', 1, undefined, 'hits')),
  ]),
  i('common', 'sweeping-ray', 'Sweeping Talons', 'attack', 1, 'none', [dmg(6, 'allFoes'), draw(1)]),
  i('uncommon', 'driver-of-runes', 'Totem Driver', 'attack', 1, 'foe', [
    dmg(7),
    scaled(draw(0), per('runes', 0.5)),
  ]),
  i('rare', 'hyperbeam', 'Skyfall Talons', 'attack', 2, 'none', [dmg(24, 'allFoes')], { exhaust: true }),
  i('rare', 'meteor-glyph', 'Meteor Totem', 'attack', 3, 'foe', [dmg(28), channel('prism', 2)]),
  i(
    'rare',
    'rainbow-glyph',
    'Three Spirits',
    'skill',
    2,
    'none',
    [channel('spark'), channel('ward'), channel('splinter')],
    { exhaust: true },
  ),

  // --- Bear ---
  i('common', 'glyph-guard', 'Totem Guard', 'skill', 1, 'none', [barrier(5), channel('ward')]),
  i('common', 'frostglass', 'Frostbark', 'skill', 2, 'none', [barrier(6), channel('ward', 2)]),
  i('common', 'ward-strike', 'Bear Strike', 'attack', 1, 'foe', [dmg(6), channel('ward')]),
  i(
    'common',
    'cold-snap',
    'Cold Snap',
    'skill',
    1,
    'none',
    [{ op: 'channel', rune: 'ward', times: 0, scale: per('foes') }],
    { exhaust: true },
  ),
  i('uncommon', 'chilled-focus', 'Winter Focus', 'skill', 1, 'none', [channel('ward'), draw(1)]),
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

  i('common', 'rime-strike', 'Rime Strike', 'attack', 1, 'foe', [
    dmg(5),
    barrier(4),
    channel('ward'),
  ]),
  i('common', 'ice-shell', 'Bark Shell', 'skill', 2, 'none', [barrier(14), channel('ward')]),
  i('uncommon', 'permafrost', 'Permafrost', 'power', 2, 'none', [
    on('turnStart', [channel('ward')]),
  ]),
  i('uncommon', 'glacial-memory', 'Elder Memory', 'skill', 1, 'none', [
    scaled(barrier(0), per('runes', 4)),
    draw(1),
  ]),

  // (more Ward)
  i('common', 'skim-the-weave', 'Skim the Grain', 'skill', 1, 'none', [draw(3)]),
  i('common', 'echo-of-glyphs', 'Echo of Totems', 'skill', 1, 'none', [barrier(4), fetchCards(1)], {
    exhaust: true,
  }),
  i('uncommon', 'streamlined-strike', 'Streamlined Strike', 'attack', 2, 'foe', [
    dmg(14),
    cheapen(1, 'random'),
  ]),
  i('rare', 'machine-learning', 'Ancestral Learning', 'power', 2, 'none', [
    on('turnStart', [draw(1)]),
  ]),
  i('rare', 'echoing-loop', 'Echoing Loop', 'power', 2, 'none', [
    on('turnEnd', [evoke(1, 1, true)]),
  ]),

  // --- Elder and Spirit ---
  i('common', 'umbra-glyph', 'Shadow Totem', 'skill', 1, 'none', [channel('hollow')]),
  i('common', 'hollow-strike', 'Elder Strike', 'attack', 1, 'foe', [dmg(7), channel('hollow')]),
  i('uncommon', 'gloomwave', 'Gloomwave', 'attack', 2, 'none', [
    dmg(10, 'allFoes'),
    channel('hollow'),
  ]),
  i('uncommon', 'echo-chamber', 'Echo Chamber', 'skill', 1, 'none', [evoke(1, 1, true)]),
  i('uncommon', 'tune-the-lattice', 'Tune the Spirits', 'power', 1, 'none', [
    status('resonance', 1),
  ]),
  i('uncommon', 'overtune', 'Spirit Surge', 'skill', 1, 'none', [status('resonance', 1), draw(1)], {
    exhaust: true,
  }),
  i('uncommon', 'resonant-strike', 'Spirit Strike', 'attack', 1, 'foe', [
    scaled(dmg(6), per('resonance', 3)),
  ]),
  i('rare', 'fevered-attunement', 'Fevered Communion', 'power', 1, 'none', [
    status('resonance', 4),
    on('turnStart', [status('resonance', -1)]),
  ]),
  i('rare', 'chorus-of-glyphs', 'Chorus of Totems', 'power', 2, 'none', [
    status('resonance', 2),
    { op: 'runeSlots', amount: 1 },
  ]),

  i('common', 'void-pulse', 'Void Pulse', 'skill', 1, 'none', [channel('hollow'), barrier(4)]),
  i('uncommon', 'deep-charge', 'Deep Charge', 'skill', 1, 'none', [channel('hollow'), draw(1)]),
  i('rare', 'abyssal-glyph', 'Abyssal Totem', 'skill', 2, 'none', [channel('hollow', 2)]),

  // (more Hollow)
  i('uncommon', 'prism-beam', "Owl's Gaze", 'attack', 0, 'foe', [
    dmg(3),
    status('exposed', 1, 'target'),
  ]),
  i(
    'rare',
    'reset-the-weave',
    'Reset the Weave',
    'skill',
    0,
    'none',
    [discard(9, 'any'), draw(4)],
    { exhaust: true },
  ),
  i('rare', 'echoing-form', 'Echoing Form', 'power', 3, 'none', [
    on('turnStart', [status('twinned', 1)]),
  ]),
  i('rare', 'white-noise', 'White Noise', 'skill', 1, 'none', [discoverOp('power', 1, true)], {
    exhaust: true,
  }),
  i('rare', 'creative-engine', "Carver's Engine", 'power', 3, 'none', [
    on('turnStart', [discoverOp(undefined, 1, false)]),
  ]),
  i('rare', 'consuming-dark', 'Consuming Dark', 'power', 2, 'none', [
    on('turnEnd', [channel('hollow')]),
  ]),
  i('rare', 'biased-weave', 'Biased Grain', 'power', 2, 'none', [
    status('resonance', 3),
    on('turnStart', [lose(2)]),
  ]),

  // --- awaken glue ---
  i('common', 'rune-burst', 'Totem Burst', 'skill', 1, 'none', [evoke(), draw(1)]),
  i('common', 'glimmer', 'Owl Glint', 'skill', 1, 'none', [channel('prism')], { exhaust: true }),
  i('uncommon', 'prism-cut', 'Owl Cut', 'skill', 1, 'none', [channel('prism'), draw(1)]),
  i('uncommon', 'harmonic-wave', 'Spirit Wave', 'attack', 2, 'none', [
    dmg(8, 'allFoes'),
    evoke(),
  ]),
  i(
    'uncommon',
    'many-voices',
    'Many Voices',
    'skill',
    0,
    'none',
    [{ op: 'evoke', times: 0, scale: per('x') }],
    { x: true },
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
  i('uncommon', 'retune', 'Retune', 'skill', 1, 'none', [upgradeOp('random')], { exhaust: true }),
  i('uncommon', 'stored-charge', 'Stored Charge', 'skill', 1, 'none', [
    manaNext(1),
    channel('ward'),
  ]),
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
  i('rare', 'leyline-tap', 'Root Tap', 'skill', 2, 'none', [maxMana(1), barrier(6)], {
    exhaust: true,
  }),

  // --- Hawk (more) ---
  i('common', 'live-wire', 'Live Branch', 'attack', 0, 'foe', [dmg(3), channel('spark')], {
    exhaust: true,
  }),
  i('common', 'forked-current', 'Forked Branch', 'attack', 2, 'none', [
    dmg(8, 'allFoes'),
    channel('spark'),
  ]),
  i('uncommon', 'spent-coil', 'Spent Husk', 'skill', 1, 'none', [evoke(), channel('spark')]),
  i('uncommon', 'conduit', 'Spirit Conduit', 'power', 1, 'none', [
    on('play', [dmg(2, 'randomFoe')], { filter: 'attack' }),
  ]),
  i('rare', 'sparkstorm', 'Hawkstorm', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('runes'))]),
  ]),
  i('uncommon', 'arc-reactor', 'Heartwood', 'attack', 2, 'foe', [
    dmg(6, 'target', 2),
    channel('spark'),
  ]),
  i('rare', 'blazing-aperture', 'Blazing Eye', 'attack', 3, 'none', [
    dmg(14, 'allFoes'),
    evoke(3),
  ]),
  i(
    'uncommon',
    'static-snare',
    'Static Snare',
    'snare',
    1,
    'none',
    [dmg(6, 'allFoes'), channel('splinter')],
    { trigger: { on: 'foeTurn' } },
  ),

  // --- Bear (more) ---
  i('common', 'crystal-ward', 'Bark Ward', 'skill', 1, 'none', [barrier(7), channel('ward')], {
    retain: true,
  }),
  i('common', 'frost-nova', 'Frost Bloom', 'attack', 1, 'none', [
    dmg(5, 'allFoes'),
    status('faltering', 1, 'allFoes'),
    channel('ward'),
  ]),
  i('uncommon', 'bulwark-glyph', 'Bulwark Totem', 'skill', 2, 'none', [
    scaled(barrier(4), per('runes', 3)),
    status('bracing', 1),
  ]),
  i('uncommon', 'sentinel-sigil', 'Sentinel Totem', 'power', 2, 'none', [
    status('shielded', 1),
    on('turnStart', [barrier(3)]),
  ]),
  i(
    'common',
    'rune-recall',
    'Totem Recall',
    'skill',
    0,
    'none',
    [barrier(3), fetchCards(1, 'hand', 'skill')],
    { exhaust: true },
  ),
  i('rare', 'aegis-array', 'Totem Ring', 'skill', 3, 'none', [barrier(8), channel('ward', 3)]),
  i('rare', 'frozen-ledger', 'Frozen Grove', 'power', 1, 'none', [on('exhaust', [barrier(4)])]),
  i('uncommon', 'rune-snare', 'Totem Snare', 'snare', 2, 'none', [PREVENT, channel('ward')], {
    trigger: { on: 'attacked' },
  }),

  // --- Elder (more) ---
  i(
    'common',
    'bleed-the-void',
    'Bleed the Void',
    'skill',
    0,
    'none',
    [channel('hollow'), lose(2)],
    {
      exhaust: true,
    },
  ),
  i('uncommon', 'hollow-tide', 'Elder Tide', 'attack', 2, 'foe', [
    scaled(dmg(6), per('resonance', 4)),
    channel('hollow'),
  ]),
  i('uncommon', 'tuning-fork', 'Spirit Drum', 'skill', 1, 'none', [
    status('resonance', 1),
    channel('prism'),
  ]),
  i('rare', 'echo-cascade', 'Echo Cascade', 'skill', 2, 'none', [evoke(1, 3, true)], {
    exhaust: true,
  }),
  i(
    'rare',
    'lattice-collapse',
    'Lattice Collapse',
    'attack',
    2,
    'none',
    [scaled(dmg(8, 'allFoes'), per('runes', 4)), evoke(3)],
    { exhaust: true },
  ),
  i('rare', 'gathering-dark', 'Gathering Dark', 'power', 2, 'none', [
    on('play', [channel('hollow')], { filter: 'skill' }),
  ]),
  i('uncommon', 'void-dividend', 'Void Dividend', 'skill', 1, 'none', [
    scaled(draw(0), per('runes')),
    cheapen(1, 'random'),
  ]),
  i('common', 'silent-glyph', 'Silent Totem', 'skill', 1, 'none', [barrier(5), channel('hollow')], {
    onDiscard: [channel('hollow')],
  }),
];
