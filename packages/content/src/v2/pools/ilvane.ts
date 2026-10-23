// Ilvane, the Glyphwright (Nexus-9). Carves runes into the air. Three lanes:
//   Spark   - damage runes: chip every turn, burst when pushed out (Spark hits one enemy, Splinter hits every enemy)
//   Ward    - Barrier runes: defence that accumulates
//   Hollow  - charging runes that build for a huge evoke, and Resonance to make every rune stronger
// Evoke cards (glue) cash runes in early. Runes sit in 3 slots; a fourth pushes the oldest out and evokes it.

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
    name: 'Spark',
    text: 'Passive: 3 damage to a random enemy at the end of your turn. Release: 9 damage to the front enemy.',
    passive: [dmg(3, 'randomFoe')],
    evoke: [dmg(9, 'front')],
  },
  {
    id: 'splinter',
    name: 'Splinter',
    text: 'Passive: 2 damage to every enemy at the end of your turn. Release: 6 damage to every enemy.',
    passive: [dmg(2, 'allFoes')],
    evoke: [dmg(6, 'allFoes')],
  },
  {
    id: 'ward',
    name: 'Ward',
    text: 'Passive: 1 Barrier at the end of your turn. Release: 6 Barrier.',
    passive: [barrier(1)],
    evoke: [barrier(6)],
  },
  {
    id: 'hollow',
    name: 'Hollow',
    text: 'Charges by 2 at the end of each of your turns. Release: damage equal to its charge to the front enemy.',
    grow: 2,
    passive: [],
    evoke: [scaled(dmg(0, 'front'), per('charge'))],
  },
  {
    id: 'prism',
    name: 'Prism',
    text: 'Passive: 1 Barrier at the end of your turn. Release: gain 1 Mana and draw a card.',
    passive: [barrier(1)],
    evoke: [mana(1), draw(1)],
  },
];

const i = pool('ilvane', 'nexus');

export const ILVANE: CardDef[] = [
  // --- basics ---
  i('basic', 'spark-cast', 'Spark Cast', 'skill', 1, 'none', [channel('spark')]),
  i('basic', 'twin-evocation', 'Twin Evocation', 'skill', 1, 'none', [evoke(1, 2)]),

  // --- Spark ---
  i('common', 'crackling-orb', 'Crackling Orb', 'attack', 1, 'foe', [dmg(7), channel('spark')]),
  i('common', 'arc-flash', 'Arc Flash', 'attack', 1, 'none', [dmg(4, 'allFoes'), channel('spark')]),
  i('common', 'spark-lance', 'Spark Lance', 'attack', 2, 'foe', [dmg(12), channel('spark')]),
  i('common', 'spark-cluster', 'Spark Cluster', 'skill', 2, 'none', [channel('spark', 2)]),
  i('common', 'static-guard', 'Static Guard', 'skill', 1, 'none', [barrier(5), channel('spark')]),
  i('common', 'splinter-cast', 'Splinter Cast', 'skill', 1, 'none', [channel('splinter')]),
  i('uncommon', 'prismatic-burst', 'Prismatic Burst', 'attack', 2, 'none', [
    dmg(6, 'allFoes'),
    channel('splinter'),
  ]),
  i('uncommon', 'shard-chorus', 'Shard Chorus', 'skill', 2, 'none', [channel('splinter', 2)]),
  i('rare', 'glasswright', 'Glasswright', 'power', 2, 'none', [
    on('turnStart', [channel('splinter')]),
  ]),
  i('uncommon', 'glyph-lattice', 'Glyph Lattice', 'skill', 1, 'none', [
    { op: 'runeSlots', amount: 2 },
  ]),
  i('uncommon', 'thundercall', 'Thundercall', 'power', 1, 'none', [
    on('play', [channel('spark')], { filter: 'power' }),
  ]),
  i('uncommon', 'charged-blow', 'Charged Blow', 'attack', 1, 'foe', [
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
    'Glyphstorm',
    'skill',
    0,
    'none',
    [{ op: 'channel', rune: 'spark', times: 0, scale: per('x') }],
    { x: true },
  ),
  i('rare', 'grand-glyph', 'Grand Glyph', 'skill', 3, 'none', [
    channel('spark'),
    channel('ward'),
    channel('hollow'),
  ]),

  // (more Spark)
  i('common', 'rune-barrage', 'Rune Barrage', 'attack', 1, 'foe', [
    scaled({ op: 'damage', amount: 4, hits: 0, to: 'target' }, per('runes', 1, undefined, 'hits')),
  ]),
  i('common', 'sweeping-ray', 'Sweeping Ray', 'attack', 1, 'none', [dmg(6, 'allFoes'), draw(1)]),
  i('uncommon', 'driver-of-runes', 'Driver of Runes', 'attack', 1, 'foe', [
    dmg(7),
    scaled(draw(0), per('runes', 0.5)),
  ]),
  i('rare', 'hyperbeam', 'Hyperbeam', 'attack', 2, 'none', [dmg(24, 'allFoes')], { exhaust: true }),
  i('rare', 'meteor-glyph', 'Meteor Glyph', 'attack', 3, 'foe', [dmg(28), channel('prism', 2)]),
  i(
    'rare',
    'rainbow-glyph',
    'Rainbow Glyph',
    'skill',
    2,
    'none',
    [channel('spark'), channel('ward'), channel('splinter')],
    { exhaust: true },
  ),

  // --- Ward ---
  i('common', 'glyph-guard', 'Glyph Guard', 'skill', 1, 'none', [barrier(5), channel('ward')]),
  i('common', 'frostglass', 'Frostglass', 'skill', 2, 'none', [barrier(6), channel('ward', 2)]),
  i('common', 'ward-strike', 'Ward Strike', 'attack', 1, 'foe', [dmg(6), channel('ward')]),
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
  i('uncommon', 'chilled-focus', 'Chilled Focus', 'skill', 1, 'none', [channel('ward'), draw(1)]),
  i('uncommon', 'rune-carapace', 'Rune Carapace', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('runes'))]),
  ]),
  i('uncommon', 'rune-shield', 'Rune Shield', 'skill', 1, 'none', [
    scaled(barrier(0), per('runes', 3)),
  ]),
  i('rare', 'glacial-bastion', 'Glacial Bastion', 'skill', 2, 'none', [
    barrier(10),
    channel('ward', 2),
  ]),

  i('common', 'rime-strike', 'Rime Strike', 'attack', 1, 'foe', [
    dmg(5),
    barrier(4),
    channel('ward'),
  ]),
  i('common', 'ice-shell', 'Ice Shell', 'skill', 2, 'none', [barrier(14), channel('ward')]),
  i('uncommon', 'permafrost', 'Permafrost', 'power', 2, 'none', [
    on('turnStart', [channel('ward')]),
  ]),
  i('uncommon', 'glacial-memory', 'Glacial Memory', 'skill', 1, 'none', [
    scaled(barrier(0), per('runes', 4)),
    draw(1),
  ]),

  // (more Ward)
  i('common', 'skim-the-weave', 'Skim the Weave', 'skill', 1, 'none', [draw(3)]),
  i('common', 'echo-of-glyphs', 'Echo of Glyphs', 'skill', 1, 'none', [barrier(4), fetchCards(1)], {
    exhaust: true,
  }),
  i('uncommon', 'streamlined-strike', 'Streamlined Strike', 'attack', 2, 'foe', [
    dmg(14),
    cheapen(1, 'random'),
  ]),
  i('rare', 'machine-learning', 'Machine Learning', 'power', 2, 'none', [
    on('turnStart', [draw(1)]),
  ]),
  i('rare', 'echoing-loop', 'Echoing Loop', 'power', 2, 'none', [
    on('turnEnd', [evoke(1, 1, true)]),
  ]),

  // --- Hollow and Resonance ---
  i('common', 'umbra-glyph', 'Umbra Glyph', 'skill', 1, 'none', [channel('hollow')]),
  i('common', 'hollow-strike', 'Hollow Strike', 'attack', 1, 'foe', [dmg(7), channel('hollow')]),
  i('uncommon', 'gloomwave', 'Gloomwave', 'attack', 2, 'none', [
    dmg(10, 'allFoes'),
    channel('hollow'),
  ]),
  i('uncommon', 'echo-chamber', 'Echo Chamber', 'skill', 1, 'none', [evoke(1, 1, true)]),
  i('uncommon', 'tune-the-lattice', 'Tune the Lattice', 'power', 1, 'none', [
    status('resonance', 1),
  ]),
  i('uncommon', 'overtune', 'Overtune', 'skill', 1, 'none', [status('resonance', 1), draw(1)], {
    exhaust: true,
  }),
  i('uncommon', 'resonant-strike', 'Resonant Strike', 'attack', 1, 'foe', [
    scaled(dmg(6), per('resonance', 3)),
  ]),
  i('rare', 'fevered-attunement', 'Fevered Attunement', 'power', 1, 'none', [
    status('resonance', 4),
    on('turnStart', [status('resonance', -1)]),
  ]),
  i('rare', 'chorus-of-glyphs', 'Chorus of Glyphs', 'power', 2, 'none', [
    status('resonance', 2),
    { op: 'runeSlots', amount: 1 },
  ]),

  i('common', 'void-pulse', 'Void Pulse', 'skill', 1, 'none', [channel('hollow'), barrier(4)]),
  i('uncommon', 'deep-charge', 'Deep Charge', 'skill', 1, 'none', [channel('hollow'), draw(1)]),
  i('rare', 'abyssal-glyph', 'Abyssal Glyph', 'skill', 2, 'none', [channel('hollow', 2)]),

  // (more Hollow)
  i('uncommon', 'prism-beam', 'Prism Beam', 'attack', 0, 'foe', [
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
  i('rare', 'creative-engine', 'Creative Engine', 'power', 3, 'none', [
    on('turnStart', [discoverOp(undefined, 1, false)]),
  ]),
  i('rare', 'consuming-dark', 'Consuming Dark', 'power', 2, 'none', [
    on('turnEnd', [channel('hollow')]),
  ]),
  i('rare', 'biased-weave', 'Biased Weave', 'power', 2, 'none', [
    status('resonance', 3),
    on('turnStart', [lose(2)]),
  ]),

  // --- evoke glue ---
  i('common', 'rune-burst', 'Rune Burst', 'skill', 1, 'none', [evoke(), draw(1)]),
  i('common', 'glimmer', 'Glimmer', 'skill', 1, 'none', [channel('prism')], { exhaust: true }),
  i('uncommon', 'prism-cut', 'Prism Cut', 'skill', 1, 'none', [channel('prism'), draw(1)]),
  i('uncommon', 'harmonic-wave', 'Harmonic Wave', 'attack', 2, 'none', [
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
  i('rare', 'glyph-engine', 'Glyph Engine', 'power', 2, 'none', [
    on('turnStart', [channel('spark')]),
  ]),
  i(
    'uncommon',
    'glyph-trap',
    'Glyph Trap',
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
  i('legendary', 'the-grand-design', 'The Grand Design', 'power', 3, 'none', [
    { op: 'runeSlots', amount: 3 },
    status('resonance', 3),
    on('turnStart', [channel('hollow')]),
  ]),
  i(
    'legendary',
    'cataclysm-glyph',
    'Cataclysm Glyph',
    'attack',
    2,
    'none',
    [dmg(10, 'allFoes'), evoke(10, 2)],
    { exhaust: true },
  ),
  i('rare', 'leyline-tap', 'Leyline Tap', 'skill', 2, 'none', [maxMana(1), barrier(6)], {
    exhaust: true,
  }),
];
