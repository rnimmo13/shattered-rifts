// Ilvane (display name; the id stays 'totemist', DECISIONS #141). An elder shaman who carves. Three build paths (DECISIONS #255):
//   Totems    - plant totems (Hawk hits one enemy, Splinter every enemy, Bear guards, Elder charges, Owl gives Mana), make them
//               stronger with Spirit (the `resonance` status) and more slots, and awaken them for their big effect
//   Elements  - lightning, ice, fire, water and earth spells that grow with Spirit (DECISIONS #353)
//   Rites     - Auras that pay you whenever you play another Aura, and cards that scale with how many Auras you have
// Totems stand in 3 slots; a fourth pushes the oldest out and it topples, awakening it.
// (Ids keep the old rune names: `channel`/`evoke` ops, rune ids spark/ward/hollow/prism. Many card ids are older than the card they
// name now: an id keeps a card's art and every saved deck, so a reworked card keeps its id.)

import type { CardDef, RuneDef } from '@sr/combat';
import {
  barrier,
  channel,
  dmg,
  draw,
  evoke,
  mana,
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
  forge,
} from '../build';

// (every damage number of Ilvane's +1, Splinter's passive kept at 2: DECISIONS #360)
export const RUNES: RuneDef[] = [
  {
    id: 'spark',
    name: 'Hawk',
    text: 'Passive: 4 damage to a random enemy at the end of your turn. Awaken: 10 damage to the front enemy.',
    passive: [dmg(4, 'randomFoe')],
    evoke: [dmg(10, 'front')],
  },
  {
    id: 'splinter',
    name: 'Splinter',
    text: 'Passive: 2 damage to every enemy at the end of your turn. Awaken: 7 damage to every enemy.',
    passive: [dmg(2, 'allFoes')],
    evoke: [dmg(7, 'allFoes')],
  },
  {
    id: 'ward',
    name: 'Bear',
    // (2 Barrier a turn, was 1: DECISIONS #351)
    text: 'Passive: 2 Barrier at the end of your turn. Awaken: 6 Barrier.',
    passive: [barrier(2)],
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

export const TOTEMIST: CardDef[] = [
  // --- basics ---
  i('basic', 'spark-cast', 'Plant Hawk', 'skill', 1, 'none', [channel('spark'), barrier(3)]),
  i('basic', 'twin-evocation', 'Twin Awakening', 'skill', 1, 'none', [evoke(2)]),

  // --- Totems ---
  i('uncommon', 'prismatic-burst', 'Splintering Burst', 'attack', 2, 'none', [
    dmg(7, 'allFoes'),
    channel('splinter'),
  ]),
  i('uncommon', 'shard-chorus', 'Splinter Grove', 'skill', 2, 'none', [channel('splinter', 2)]),
  i('rare', 'charged-blow', 'Awakened Blow', 'attack', 1, 'foe', [scaled(dmg(5), per('runes', 2))]),
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
  i('uncommon', 'driver-of-runes', 'Totem Driver', 'attack', 1, 'foe', [
    dmg(8),
    scaled(draw(0), per('runes', 0.5)),
  ]),
  i('uncommon', 'forked-current', 'Forked Branch', 'attack', 2, 'none', [
    dmg(9, 'allFoes'),
    channel('spark'),
  ]),
  i('uncommon', 'arc-reactor', 'Heartwood', 'attack', 2, 'foe', [
    dmg(7, 'target', 2),
    channel('spark'),
  ]),
  i('rare', 'blazing-aperture', 'Blazing Eye', 'attack', 3, 'none', [dmg(19, 'allFoes'), evoke(3)]),
  i('common', 'frostglass', 'Frostbark', 'skill', 2, 'none', [
    barrier(4),
    channel('ward'),
    channel('hollow'),
  ]),
  i('uncommon', 'chilled-focus', "Bear's Patience", 'skill', 1, 'none', [channel('ward'), scry(3)]),
  i('common', 'rime-strike', 'Barkskin Strike', 'attack', 1, 'foe', [
    dmg(6),
    barrier(4),
    channel('ward'),
  ]),
  i('rare', 'bulwark-glyph', 'Bulwark Totem', 'skill', 2, 'none', [
    scaled(barrier(4), per('runes', 3)),
    status('bracing', 1),
  ]),
  i('rare', 'aegis-array', 'Totem Ring', 'skill', 3, 'none', [barrier(8), channel('ward', 3)]),
  i('rare', 'rune-snare', 'Totem Trap', 'snare', 2, 'none', [PREVENT, channel('ward')], {
    trigger: { on: 'attacked' },
  }),
  i('common', 'echo-chamber', 'Echo Chamber', 'skill', 1, 'none', [evoke(1, 1, true)]),
  // (one Spirit and a slot to put it to work: Spirit alone was a plain copy of a famous card)
  i('common', 'tune-the-lattice', 'Tune the Spirits', 'power', 1, 'none', [
    status('resonance', 1),
    { op: 'runeSlots', amount: 1 },
  ]),
  i('common', 'resonant-strike', 'Spirit Strike', 'attack', 1, 'foe', [
    scaled(dmg(7), per('resonance', 2)),
  ]),
  i('rare', 'chorus-of-glyphs', 'Chorus of Totems', 'power', 2, 'none', [
    status('resonance', 2),
    { op: 'runeSlots', amount: 1 },
  ]),
  i('common', 'void-pulse', "Elder's Shelter", 'skill', 1, 'none', [channel('hollow'), barrier(4)]),
  i('rare', 'echo-cascade', 'Echo Cascade', 'skill', 2, 'none', [evoke(1, 3, true)], {
    exhaust: true,
  }),
  // (the awakened totem stays: one totem answers again and again, but the card is spent)


  // --- Rites ---
  // Auras that pay off when another Aura is played, and cards that count your Auras
  i('common', 'static-guard', 'Rite Strike', 'attack', 1, 'foe', [
    scaled(dmg(6), per('powers', 2)),
  ]),
  i('common', 'glyph-guard', 'Rite of Warding', 'skill', 1, 'none', [
    scaled(barrier(5), per('powers', 2)),
  ]),
  i('common', 'spark-cluster', 'Ember Rite', 'power', 0, 'none', [on('turnEnd', [barrier(3)])], {
    up: { effects: [on('turnEnd', [barrier(5)])] },
  }),
  i(
    'common',
    'ice-shell',
    'Rite of Thorns',
    'power',
    0,
    'none',
    [on('turnStart', [dmg(4, 'randomFoe')])],
    { up: { effects: [on('turnStart', [dmg(6, 'randomFoe')])] } },
  ),
  i('common', 'glacial-memory', 'Drum Circle', 'skill', 1, 'none', [
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
  i('uncommon', 'machine-learning', 'Ancestral Learning', 'power', 1, 'none', [
    on('play', [draw(1)], { filter: 'power' }),
  ]),
  i('rare', 'fevered-attunement', 'Fevered Communion', 'power', 2, 'none', [
    status('resonance', 1),
    on('play', [status('resonance', 1)], { filter: 'power' }),
  ]),
  i(
    'uncommon',
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
    [scaled(dmg(9, 'allFoes'), per('powers', 2))],
    {
      exhaust: true,
    },
  ),
  i('rare', 'echoing-form', 'Echoing Chant', 'power', 3, 'none', [
    on('turnStart', [scaled(dmg(0, 'allFoes'), per('powers', 2))]),
  ]),
  i('rare', 'sparkstorm', 'Hawkstorm', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('runes'))]),
  ]),
  i('uncommon', 'permafrost', 'Den of Bears', 'power', 2, 'none', [
    on('turnStart', [channel('ward')]),
  ]),
  i('rare', 'echoing-loop', 'Unending Call', 'power', 2, 'none', [
    on('turnEnd', [evoke(1, 1, true)]),
  ]),
  i('rare', 'gathering-dark', 'Gathering Elders', 'power', 2, 'none', [
    on('play', [channel('hollow')], { filter: 'skill' }),
  ]),

  // --- glue ---
  i('uncommon', 'retune', 'Retune', 'skill', 1, 'none', [upgradeOp('random')], { exhaust: true }),
  i('rare', 'leyline-tap', 'Root Tap', 'skill', 2, 'none', [maxMana(1), barrier(6)], {
    exhaust: true,
  }),
  i(
    'legendary',
    'the-grand-design',
    'The Great Pole',
    'power',
    3,
    'none',
    [{ op: 'runeSlots', amount: 3 }, status('resonance', 3), on('turnStart', [channel('hollow')])],
    { up: { cost: 2 } },
  ),
  i(
    'legendary',
    'cataclysm-glyph',
    'Cataclysm Totem',
    'attack',
    2,
    'none',
    [dmg(11, 'allFoes'), evoke(10, 2)],
    { exhaust: true, up: { effects: [dmg(11, 'allFoes'), evoke(10, 3)] } },
  ),
  i('common', 'rune-burst', 'Totem Burst', 'skill', 1, 'none', [evoke(), draw(1)]),
  i('rare', 'prism-cut', 'Owl Cut', 'skill', 1, 'none', [channel('prism'), draw(1)]),
  i('rare', 'harmonic-wave', 'Spirit Wave', 'attack', 2, 'none', [dmg(12, 'allFoes'), evoke()]),

  // --- brought back (DECISIONS #337) ---
  i('common', 'arc-flash', 'Feather Storm', 'attack', 1, 'none', [
    dmg(5, 'allFoes'),
    channel('spark'),
  ]),
  i(
    'rare',
    'lattice-collapse',
    'Toppling Row',
    'attack',
    2,
    'none',
    [scaled(dmg(9, 'allFoes'), per('runes', 4)), evoke(3)],
    { exhaust: true },
  ),
  i('uncommon', 'tuning-fork', 'Spirit Drum', 'power', 2, 'none', [
    on('play', [barrier(4)], { filter: 'power' }),
  ]),
  i('uncommon', 'rune-carapace', 'Bark Carapace', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('runes'))]),
  ]),


  // --- more glue: uncommons and rares for any build path (DECISIONS #339) ---
  i('uncommon', 'overtune', 'Spirit Surge', 'skill', 1, 'none', [status('resonance', 1), draw(1)], {
    exhaust: true,
  }),
  i('common', 'glyph-lattice', 'Totem Row', 'skill', 1, 'none', [{ op: 'runeSlots', amount: 2 }]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  i('uncommon', 'crystal-ward', 'Bark Ward', 'skill', 1, 'none', [barrier(7), channel('ward')], {
    retain: true,
  }),
  i(
    'uncommon',
    'cold-snap',
    'Bear Pack',
    'skill',
    1,
    'none',
    [{ op: 'channel', rune: 'ward', times: 0, scale: per('foes') }],
    { exhaust: true },
  ),
  i('rare', 'biased-weave', 'Sap Offering', 'power', 2, 'none', [
    status('resonance', 3),
    on('turnStart', [lose(1)]),
  ]),
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

  // --- new for the 20/30/25 rarity target (DECISIONS #341) ---
  i('uncommon', 'kindled-rite', 'Kindled Rite', 'power', 1, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('powers'))]),
  ]),
  i('uncommon', 'smoke-offering', 'Smoke Offering', 'power', 1, 'none', [
    on('turnStart', [scaled(barrier(0), per('powers', 2))]),
  ]),

  // --- Elements: lightning, ice, fire, water and earth spells that grow with Spirit (replaces Whittling; DECISIONS #353) ---
  i('common', 'spark-lash', 'Spark Lash', 'attack', 1, 'foe', [scaled(dmg(6), per('resonance'))]),
  i('common', 'frost-needle', 'Frost Needle', 'attack', 1, 'foe', [
    scaled(dmg(5), per('resonance')),
    status('faltering', 1, 'target'),
  ]),
  i('common', 'ember-toss', 'Ember Toss', 'attack', 1, 'none', [
    scaled(dmg(4, 'allFoes'), per('resonance')),
  ]),
  i('common', 'stone-skin', 'Stone Skin', 'skill', 1, 'none', [
    scaled(barrier(6), per('resonance', 2)),
  ]),
  i('common', 'clear-spring', 'Clear Spring', 'skill', 1, 'none', [draw(2)]),
  i('common', 'elemental-focus', 'Elemental Focus', 'skill', 0, 'none', [status('resonance', 1)], {
    exhaust: true,
  }),
  // lightning leaves them shocked (Exposed)
  i('uncommon', 'storm-call', 'Storm Call', 'attack', 2, 'none', [
    scaled(dmg(6, 'allFoes'), per('resonance', 2)),
    status('exposed', 1, 'allFoes'),
  ]),
  // every copy grows each time one is cast (DECISIONS #353)
  i(
    'uncommon',
    'gathering-storm',
    'Gathering Storm',
    'attack',
    1,
    'foe',
    [scaled(dmg(5), per('bonus')), forge('gathering-storm', 2)],
    // (upgraded it hits harder from the start; it grows by the same 2)
    { up: { effects: [scaled(dmg(8), per('bonus')), forge('gathering-storm', 2)] } },
  ),
  i('uncommon', 'glacial-ward', 'Glacial Ward', 'skill', 1, 'none', [
    scaled(barrier(8), per('resonance', 2)),
    status('faltering', 1, 'allFoes'),
  ]),
  i('uncommon', 'tidecaller', 'Tidecaller', 'skill', 0, 'none', [mana(1), draw(1)], {
    exhaust: true,
  }),
  i('uncommon', 'fire-bloom', 'Fire Bloom', 'attack', 2, 'foe', [
    scaled(dmg(11), per('resonance', 2)),
  ]),
  i('uncommon', 'arc-lightning', 'Arc Lightning', 'attack', 1, 'none', [
    scaled(dmg(4, 'randomFoe', 3), per('resonance')),
  ]),
  i('uncommon', 'earthen-rampart', 'Earthen Rampart', 'power', 1, 'none', [
    on('turnStart', [scaled(barrier(2), per('resonance'))]),
  ]),
  i('uncommon', 'inner-flame', 'Inner Flame', 'skill', 1, 'none', [status('resonance', 2)], {
    exhaust: true,
  }),
  i('uncommon', 'quench', 'Quench', 'skill', 1, 'none', [barrier(6), draw(1)]),
  // the fire feeds your spells (Spirit)
  i('rare', 'firestorm', 'Firestorm', 'attack', 2, 'none', [
    scaled(dmg(9, 'allFoes'), per('resonance', 2)),
    status('resonance', 1),
  ]),
  i(
    'rare',
    'skybreaker',
    'Skybreaker',
    'attack',
    2,
    'foe',
    [scaled(dmg(25), per('resonance', 3))],
    {
      exhaust: true,
    },
  ),
  i('rare', 'deep-freeze', 'Deep Freeze', 'attack', 2, 'foe', [
    scaled(dmg(13), per('resonance', 2)),
    status('stunned', 1, 'target'),
  ]),
  i('rare', 'stormcrown', 'Stormcrown', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('resonance', 2))]),
  ]),
  i(
    'rare',
    'mountains-heart',
    "Mountain's Heart",
    'skill',
    2,
    'none',
    [scaled(barrier(15), per('resonance', 3))],
    {
      exhaust: true,
    },
  ),
  i('rare', 'spiritfont', 'Spiritfont', 'power', 2, 'none', [
    on('turnStart', [status('resonance', 1)]),
  ]),
  i('rare', 'prismatic-cascade', 'Prismatic Cascade', 'attack', 2, 'none', [
    scaled(dmg(5, 'allFoes', 3), per('resonance')),
  ]),
];
