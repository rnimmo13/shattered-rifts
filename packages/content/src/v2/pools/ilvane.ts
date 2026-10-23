// Ilvane, the Glyphwright (Nexus-9). Carves runes into the air. Three lanes:
//   Spark   - damage runes: chip every turn, burst when pushed out
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
  on,
  per,
  pool,
  scaled,
  status,
} from '../build';

export const RUNES: RuneDef[] = [
  {
    id: 'spark',
    name: 'Spark',
    text: 'Passive: 3 damage to a random enemy at the end of your turn. Evoke: 9 damage to the front enemy.',
    passive: [dmg(3, 'randomFoe')],
    evoke: [dmg(9, 'front')],
  },
  {
    id: 'ward',
    name: 'Ward',
    text: 'Passive: 2 Barrier at the end of your turn. Evoke: 8 Barrier.',
    passive: [barrier(2)],
    evoke: [barrier(8)],
  },
  {
    id: 'hollow',
    name: 'Hollow',
    text: 'Charges by 3 at the end of each of your turns. Evoke: damage equal to its charge to the front enemy.',
    grow: 3,
    passive: [],
    evoke: [scaled(dmg(0, 'front'), per('charge'))],
  },
  {
    id: 'prism',
    name: 'Prism',
    text: 'Passive: 1 Barrier at the end of your turn. Evoke: gain 1 Mana and draw a card.',
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
  i('uncommon', 'glyph-lattice', 'Glyph Lattice', 'skill', 1, 'none', [{ op: 'runeSlots', amount: 2 }]),
  i('uncommon', 'thundercall', 'Thundercall', 'power', 1, 'none', [
    on('play', [channel('spark')], { filter: 'power' }),
  ]),
  i('uncommon', 'charged-blow', 'Charged Blow', 'attack', 1, 'foe', [
    scaled(dmg(4), per('runes', 2)),
  ]),
  i('uncommon', 'shatter-the-row', 'Shatter the Row', 'skill', 0, 'none', [
    scaled(mana(0), per('runes')),
    scaled(draw(0), per('runes')),
    evoke(10),
  ], { exhaust: true }),
  i('rare', 'glyphstorm', 'Glyphstorm', 'skill', 0, 'none', [
    { op: 'channel', rune: 'spark', times: 0, scale: per('x') },
  ], { x: true }),
  i('rare', 'grand-glyph', 'Grand Glyph', 'skill', 3, 'none', [
    channel('spark'),
    channel('ward'),
    channel('hollow'),
  ]),

  // --- Ward ---
  i('common', 'glyph-guard', 'Glyph Guard', 'skill', 1, 'none', [barrier(6), channel('ward')]),
  i('common', 'frostglass', 'Frostglass', 'skill', 2, 'none', [barrier(7), channel('ward', 2)]),
  i('common', 'ward-strike', 'Ward Strike', 'attack', 1, 'foe', [dmg(6), channel('ward')]),
  i('common', 'cold-snap', 'Cold Snap', 'skill', 0, 'none', [
    { op: 'channel', rune: 'ward', times: 0, scale: per('foes') },
  ], { exhaust: true }),
  i('uncommon', 'chilled-focus', 'Chilled Focus', 'skill', 1, 'none', [channel('ward'), draw(1)]),
  i('uncommon', 'rune-carapace', 'Rune Carapace', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('runes'))]),
  ]),
  i('uncommon', 'rune-shield', 'Rune Shield', 'skill', 1, 'none', [scaled(barrier(0), per('runes', 3))]),
  i('rare', 'glacial-bastion', 'Glacial Bastion', 'skill', 2, 'none', [barrier(12), channel('ward', 3)]),

  // --- Hollow and Resonance ---
  i('common', 'umbra-glyph', 'Umbra Glyph', 'skill', 1, 'none', [channel('hollow')]),
  i('common', 'hollow-strike', 'Hollow Strike', 'attack', 1, 'foe', [dmg(7), channel('hollow')]),
  i('uncommon', 'gloomwave', 'Gloomwave', 'attack', 2, 'none', [
    dmg(10, 'allFoes'),
    channel('hollow'),
  ]),
  i('uncommon', 'echo-chamber', 'Echo Chamber', 'skill', 1, 'none', [evoke(1, 1, true)]),
  i('uncommon', 'tune-the-lattice', 'Tune the Lattice', 'power', 1, 'none', [status('resonance', 1)]),
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

  // --- evoke glue ---
  i('common', 'rune-burst', 'Rune Burst', 'skill', 1, 'none', [evoke(), draw(1)]),
  i('common', 'glimmer', 'Glimmer', 'skill', 0, 'none', [channel('prism')], { exhaust: true }),
  i('uncommon', 'prism-cut', 'Prism Cut', 'skill', 1, 'none', [channel('prism'), draw(1)]),
  i('uncommon', 'harmonic-wave', 'Harmonic Wave', 'attack', 2, 'none', [dmg(6, 'allFoes'), evoke()]),
  i('uncommon', 'many-voices', 'Many Voices', 'skill', 0, 'none', [
    { op: 'evoke', times: 0, scale: per('x') },
  ], { x: true }),
  i('rare', 'glyph-engine', 'Glyph Engine', 'power', 2, 'none', [on('turnStart', [channel('spark')])]),
];
