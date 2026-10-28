// Ilvane (display name; the id stays 'shaman', DECISIONS #141), an elder shaman. He is the Slay the Spire 2 Defect on purpose, for
// now, as Valeria is the Ironclad (Robert, 2026-10-28: "close copies of the originals, but obviously change names and keep our theme, i
// will adjust things going forward, but we need good baselines right now"): one card for every Defect card under an original name, and
// nothing else. The Defect's orbs are his totems (`channel`/`evoke` ops, the rune ids spark/ward/hollow/prism/splinter) and Focus is
// his Spirit (the `resonance` status). Each card's comment names the Defect card it imitates; numbers and rarities are the Defect's
// (StS2 Beta v0.111, slaythespire2.gg) unless a comment says why not. Not copied: Ignition and Imitation Learning (they need another
// player), Hibernate (half of it gives other players Block), Genetic Algorithm (it grows for the whole run, which a card cannot yet),
// and the two Ancient cards (Biased Cognition, Quadcast), which come from events in their game.
//
// Build paths are hidden for now (DECISIONS #365) and the headings below are only a first sort:
//   Totems   - plant totems, more slots, awaken them (orbs)
//   Elements - storm, ice and fire strikes, 0-cost cards and status cards
//   Rites    - Auras, Spirit (Focus) and Mana
// Totems stand in 3 slots; a fourth pushes the oldest (the Defect's "rightmost" orb) out and it awakens. Numbers assume 3 Mana and a
// 5-card hand. (Many card ids are older than the card they name now: an id keeps a card's art and every saved deck.)

import type { CardDef, Op, RuneDef } from '@sr/combat';
import {
  addTo,
  barrier,
  card,
  channel,
  discoverOp,
  dmg,
  draw,
  evoke,
  exhaustN,
  fetchCards,
  forge,
  lose,
  mana,
  manaNext,
  on,
  onKill,
  per,
  playPile,
  pool,
  pulse,
  recost,
  reshuffle,
  returnPlayed,
  scaled,
  status,
  STATUS_TAG,
} from '../build';

// The Defect's orbs (StS2): Lightning 3 / 8, Frost 2 / 5, Dark +6 a turn from 6 / its charge on the weakest enemy, Plasma 1 Mana at
// the start of the turn / 2 Mana, Glass 4 to every enemy and fading / twice that. Spirit adds to every number but Mana and the Dark's
// awakening (its Spirit went into the charge).
export const RUNES: RuneDef[] = [
  {
    // (Lightning)
    id: 'spark',
    name: 'Hawk',
    text: 'Passive: 3 damage to a random enemy at the end of your turn. Awaken: 8 damage to a random enemy.',
    passive: [dmg(3, 'randomFoe')],
    evoke: [dmg(8, 'randomFoe')],
  },
  {
    // (Glass: it fades a little every time it strikes)
    id: 'splinter',
    name: 'Splinter',
    text: 'Planted with a charge of 4. Passive: damage equal to its charge to ALL enemies at the end of your turn, then its charge falls by 1. Awaken: twice its charge to ALL enemies.',
    start: 4,
    decay: 1,
    passive: [
      { op: 'when', by: 'charge', atLeast: 1, ops: [scaled(dmg(0, 'allFoes'), per('charge'))] },
    ],
    evoke: [scaled(dmg(0, 'allFoes'), per('charge', 2))],
  },
  {
    // (Frost)
    id: 'ward',
    name: 'Bear',
    text: 'Passive: 2 Barrier at the end of your turn. Awaken: 5 Barrier.',
    passive: [barrier(2)],
    evoke: [barrier(5)],
  },
  {
    // (Dark)
    id: 'hollow',
    name: 'Elder',
    text: 'Planted with a charge of 6; charges by 6 more at the end of each of your turns (Spirit adds to that). Awaken: damage equal to its charge to the enemy with the least HP.',
    start: 6,
    grow: 6,
    plainEvoke: true,
    passive: [],
    evoke: [scaled(dmg(0, 'weakestFoe'), per('charge'))],
  },
  {
    // (Plasma)
    id: 'prism',
    name: 'Owl',
    text: 'Passive: gain 1 Mana at the start of your turn. Awaken: gain 2 Mana.',
    atStart: true,
    passive: [mana(1)],
    evoke: [mana(2)],
  },
];

const i = pool('shaman', 'nexus');
const RAND = '*';
/** "Deal N damage once for every totem you have" (Barrage) */
const perTotem = (n: number): Op => ({
  op: 'damage',
  amount: n,
  hits: 0,
  to: 'target',
  scale: { by: 'runes', into: 'hits' },
});
/** "If you have a Bear: ..." (Hailstorm) */
const ifBear = (ops: Op[]): Op => ({ op: 'when', by: 'runesOf', rune: 'ward', atLeast: 1, ops });
const exhaustStatuses: Op = { op: 'exhaustCards', amount: 99, tag: STATUS_TAG, everywhere: true };
const perConsumed = (n: number): Op => ({
  op: 'damage',
  amount: n,
  hits: 0,
  to: 'randomFoe',
  scale: { by: 'exhaustedNow', into: 'hits' },
});
const zeroCostFromDiscard: Op = { op: 'fetch', amount: 99, to: 'hand', maxCost: 0 };
const scrape = (n: number): Op => ({ op: 'draw', amount: n, keepCost: 0 });
const freeCopy: Op = { op: 'copySelf', to: 'discard', free: true };
const spiritThisTurn = (n: number): Op => status('resonance', n, 'self', true);

export const SHAMAN: CardDef[] = [
  // --- basics ---
  // (Zap)
  i('basic', 'spark-cast', 'Hawk Call', 'skill', 1, 'none', [channel('spark')]),
  // (Dualcast)
  i('basic', 'twin-evocation', 'Twin Awakening', 'skill', 1, 'none', [evoke(1, 2)]),

  // --- Totems ---
  // (Ball Lightning)
  i('common', 'spark-lash', 'Spark Lash', 'attack', 1, 'foe', [dmg(7), channel('spark')]),
  // (Barrage)
  i('common', 'charged-blow', 'Totem Volley', 'attack', 1, 'foe', [perTotem(5)], {
    up: { effects: [perTotem(7)] },
  }),
  // (Cold Snap)
  i('common', 'rime-strike', 'Rime Strike', 'attack', 1, 'foe', [dmg(6), channel('ward')]),
  // (Compile Driver)
  i(
    'common',
    'driver-of-runes',
    'Totem Driver',
    'attack',
    1,
    'foe',
    [dmg(7), scaled(draw(0), per('runeKinds'))],
    { up: { effects: [dmg(10), scaled(draw(0), per('runeKinds'))] } },
  ),
  // (Coolheaded)
  i('common', 'chilled-focus', 'Still Water', 'skill', 1, 'none', [channel('ward'), draw(1)]),
  // (Lightning Rod)
  i('common', 'storm-pole', 'Storm Pole', 'skill', 1, 'none', [
    barrier(4),
    on('turnStart', [channel('spark')], { times: 2 }),
  ]),
  // (Capacitor)
  i(
    'uncommon',
    'glyph-lattice',
    'Totem Row',
    'power',
    1,
    'none',
    [{ op: 'runeSlots', amount: 2 }],
    {
      up: { effects: [{ op: 'runeSlots', amount: 3 }] },
    },
  ),
  // (Chaos)
  i('uncommon', 'wild-call', 'Wild Call', 'skill', 1, 'none', [channel(RAND)], {
    up: { effects: [channel(RAND, 2)] },
  }),
  // (Chill)
  i(
    'uncommon',
    'cold-snap',
    'Bear Pack',
    'skill',
    0,
    'none',
    [{ op: 'channel', rune: 'ward', times: 0, scale: per('foes') }],
    { exhaust: true, up: { exhaust: false } },
  ),
  // (Darkness)
  i(
    'uncommon',
    'gathering-dusk',
    'Gathering Dusk',
    'skill',
    1,
    'none',
    [channel('hollow'), pulse({ rune: 'hollow' })],
    { up: { effects: [channel('hollow'), pulse({ rune: 'hollow', times: 2 })] } },
  ),
  // (Fusion)
  i('uncommon', 'prism-cut', 'Owl Call', 'skill', 1, 'none', [channel('prism')], {
    exhaust: true,
    up: { exhaust: false },
  }),
  // (Glacier)
  i('uncommon', 'frostglass', 'Frostbark', 'skill', 2, 'none', [barrier(6), channel('ward', 2)]),
  // (Glasswork)
  i('uncommon', 'shard-chorus', 'Splinter Ward', 'skill', 1, 'none', [
    barrier(5),
    channel('splinter'),
  ]),
  // (Loop: the oldest totem's passive, at the start of your turn)
  i(
    'uncommon',
    'echoing-loop',
    'Unending Call',
    'power',
    1,
    'none',
    [on('turnStart', [pulse({ first: true })])],
    { up: { effects: [on('turnStart', [pulse({ first: true, times: 2 })])] } },
  ),
  // (Null)
  i('uncommon', 'night-veil', 'Night Veil', 'attack', 2, 'foe', [
    dmg(10),
    status('faltering', 1, 'target'),
    channel('hollow'),
  ]),
  // (Refract)
  i(
    'uncommon',
    'prismatic-cascade',
    'Prismatic Cascade',
    'attack',
    3,
    'foe',
    [dmg(10, 'target', 2), channel('splinter', 2)],
    { up: { effects: [dmg(13, 'target', 2), channel('splinter', 2)] } },
  ),
  // (Shadow Shield)
  i(
    'uncommon',
    'void-pulse',
    "Elder's Shelter",
    'skill',
    2,
    'none',
    [barrier(11), channel('hollow')],
    {
      up: { effects: [barrier(15), channel('hollow')] },
    },
  ),
  // (Tempest)
  i(
    'uncommon',
    'sparkstorm',
    'Hawkstorm',
    'skill',
    0,
    'none',
    [{ op: 'channel', rune: 'spark', times: 0, scale: per('x') }],
    { x: true },
  ),
  // (Tesla Coil: every Hawk's passive, against the target)
  i(
    'uncommon',
    'arc-lightning',
    'Arc Lightning',
    'attack',
    0,
    'foe',
    [dmg(3), pulse({ rune: 'spark', aim: true })],
    { up: { effects: [dmg(4), pulse({ rune: 'spark', aim: true, times: 2 })] } },
  ),
  // (Consuming Shadow: your newest totem awakens at the end of every turn)
  i(
    'rare',
    'gathering-dark',
    'Devouring Night',
    'power',
    2,
    'none',
    [channel('hollow', 2), on('turnEnd', [{ op: 'evoke', last: true }])],
    { up: { effects: [channel('hollow', 3), on('turnEnd', [{ op: 'evoke', last: true }])] } },
  ),
  // (Coolant)
  i(
    'rare',
    'rune-carapace',
    'Bark Carapace',
    'power',
    1,
    'none',
    [on('turnStart', [scaled(barrier(0), per('runeKinds', 2))])],
    { up: { effects: [on('turnStart', [scaled(barrier(0), per('runeKinds', 3))])] } },
  ),
  // (Ice Lance)
  i('rare', 'deep-freeze', 'Deep Freeze', 'attack', 3, 'foe', [dmg(19), channel('ward', 3)], {
    up: { effects: [dmg(24), channel('ward', 3)] },
  }),
  // (Meteor Strike)
  i('rare', 'falling-star', 'Falling Star', 'attack', 5, 'foe', [dmg(24), channel('prism', 3)], {
    up: { effects: [dmg(30), channel('prism', 3)] },
  }),
  // (Modded: it costs 1 more every time you play it)
  i('rare', 'carve-a-notch', 'Carve a Notch', 'skill', 0, 'none', [
    { op: 'runeSlots', amount: 1 },
    draw(1),
    recost(1),
  ]),
  // (Multi-Cast)
  i(
    'rare',
    'many-voices',
    'Many Voices',
    'skill',
    0,
    'none',
    [{ op: 'evoke', times: 0, scale: per('x') }],
    { x: true },
  ),
  // (Rainbow)
  i(
    'rare',
    'aegis-array',
    'Circle of Spirits',
    'skill',
    2,
    'none',
    [channel('spark'), channel('ward'), channel('hollow')],
    { exhaust: true, up: { exhaust: false } },
  ),
  // (Shatter: every totem awakens twice)
  i(
    'rare',
    'shatter-the-row',
    'Shatter the Row',
    'attack',
    1,
    'none',
    [dmg(7, 'allFoes'), evoke(10, 2)],
    { exhaust: true, up: { effects: [dmg(11, 'allFoes'), evoke(10, 2)] } },
  ),
  // (Spinner)
  i(
    'rare',
    'splinter-wheel',
    'Splinter Wheel',
    'power',
    1,
    'none',
    [on('turnStart', [channel('splinter')])],
    { up: { effects: [channel('splinter'), on('turnStart', [channel('splinter')])] } },
  ),
  // (Voltaic: a Hawk for every Hawk planted this fight)
  i(
    'rare',
    'echo-cascade',
    'Endless Storm',
    'skill',
    3,
    'none',
    [{ op: 'channel', rune: 'spark', times: 0, scale: { by: 'channeledOf', rune: 'spark' } }],
    { exhaust: true, up: { exhaust: false } },
  ),

  // --- Elements ---
  // (Beam Cell)
  i(
    'common',
    'arc-flash',
    'Arc Flash',
    'attack',
    0,
    'foe',
    [dmg(3), status('exposed', 1, 'target')],
    {
      up: { effects: [dmg(4), status('exposed', 2, 'target')] },
    },
  ),
  // (Boost Away)
  i('common', 'gust-step', 'Gust Step', 'skill', 0, 'none', [
    barrier(6),
    addTo('haze', 1, 'discard'),
  ]),
  // (Claw: every copy hits harder each time one is played)
  i(
    'common',
    'gathering-storm',
    'Gathering Storm',
    'attack',
    0,
    'foe',
    [scaled(dmg(3), per('bonus')), forge('gathering-storm', 2)],
    { up: { effects: [scaled(dmg(4), per('bonus')), forge('gathering-storm', 3)] } },
  ),
  // (Go for the Eyes)
  i(
    'common',
    'frost-needle',
    'Frost Needle',
    'attack',
    0,
    'foe',
    [
      dmg(3),
      {
        op: 'when',
        by: 'attacking',
        of: 'target',
        atLeast: 1,
        ops: [status('faltering', 1, 'target')],
      },
    ],
    {
      up: {
        effects: [
          dmg(4),
          {
            op: 'when',
            by: 'attacking',
            of: 'target',
            atLeast: 1,
            ops: [status('faltering', 2, 'target')],
          },
        ],
      },
    },
  ),
  // (Gunk Up)
  i('common', 'mudslide', 'Mudslide', 'attack', 1, 'foe', [
    dmg(4, 'target', 3),
    addTo('muck', 1, 'discard'),
  ]),
  // (Hologram: a random card comes back, not a chosen one)
  i('common', 'spirit-memory', 'Spirit Memory', 'skill', 1, 'none', [barrier(3), fetchCards(1)], {
    exhaust: true,
    up: { effects: [barrier(5), fetchCards(1)], exhaust: false },
  }),
  // (Leap)
  i('common', 'stone-skin', 'Stone Skin', 'skill', 1, 'none', [barrier(9)]),
  // (Momentum Strike: after the first play it costs 0 for the fight)
  i('common', 'gale-strike', 'Gale Strike', 'attack', 1, 'foe', [dmg(11), recost(-1)], {
    up: { effects: [dmg(15), recost(-1)] },
  }),
  // (Sweeping Beam)
  i('common', 'ember-toss', 'Ember Toss', 'attack', 1, 'none', [dmg(6, 'allFoes'), draw(1)], {
    up: { effects: [dmg(9, 'allFoes'), draw(1)] },
  }),
  // (Uproar)
  i(
    'common',
    'storm-call',
    'Storm Call',
    'attack',
    2,
    'foe',
    [dmg(6, 'target', 2), playPile('draw', { kind: 'attack' })],
    { up: { effects: [dmg(8, 'target', 2), playPile('draw', { kind: 'attack' })] } },
  ),
  // (Boot Sequence)
  i('uncommon', 'crystal-ward', 'Crystal Ward', 'skill', 0, 'none', [barrier(10)], {
    innate: true,
    exhaust: true,
  }),
  // (Compact: every status card in your hand becomes Kindling)
  i(
    'uncommon',
    'gather-kindling',
    'Gather Kindling',
    'skill',
    1,
    'none',
    [barrier(6), { op: 'transform', tag: STATUS_TAG, into: 'kindling' }],
    { up: { effects: [barrier(7), { op: 'transform', tag: STATUS_TAG, into: 'kindling+' }] } },
  ),
  // (Feral: the first 0-cost Attack you play each turn comes back to your hand)
  i('uncommon', 'wild-heart', 'Wild Heart', 'power', 2, 'none', [
    on('play', [returnPlayed], { filter: 'attack', maxCost: 0, once: true }),
  ]),
  // (Fight Through)
  i(
    'uncommon',
    'ironbark',
    'Ironbark',
    'skill',
    1,
    'none',
    [barrier(13), addTo('wound', 2, 'discard')],
    {
      up: { effects: [barrier(17), addTo('wound', 2, 'discard')] },
    },
  ),
  // (FTL)
  i(
    'uncommon',
    'rapids',
    'Rapids',
    'attack',
    0,
    'foe',
    [dmg(5), { op: 'when', by: 'played', atMost: 2, ops: [draw(1)] }],
    { up: { effects: [dmg(6), { op: 'when', by: 'played', atMost: 3, ops: [draw(1)] }] } },
  ),
  // (Iteration)
  i(
    'uncommon',
    'glacial-memory',
    'Smoke Reading',
    'power',
    1,
    'none',
    [on('draw', [draw(2)], { tag: STATUS_TAG, once: true })],
    { up: { effects: [on('draw', [draw(3)], { tag: STATUS_TAG, once: true })] } },
  ),
  // (Overclock) Consumed, unlike theirs: balance.test forbids a free card that draws and stays (as the knight's Bloodletting)
  i(
    'uncommon',
    'feed-the-fire',
    'Feed the Fire',
    'skill',
    0,
    'none',
    [draw(2), addTo('scorch', 1, 'discard')],
    { exhaust: true },
  ),
  // (Rocket Punch)
  i('uncommon', 'boulder-fist', 'Boulder Fist', 'attack', 2, 'foe', [dmg(13), draw(1)], {
    cheaperOnCreate: STATUS_TAG,
    up: { effects: [dmg(14), draw(2)] },
  }),
  // (Scavenge)
  i('uncommon', 'smoke-offering', 'Smoke Offering', 'skill', 1, 'none', [exhaustN(1), manaNext(2)]),
  // (Scrape)
  i('uncommon', 'river-scour', 'Riverscour', 'attack', 1, 'foe', [dmg(7), scrape(4)], {
    up: { effects: [dmg(10), scrape(5)] },
  }),
  // (Skim)
  i('uncommon', 'clear-spring', 'Clear Spring', 'skill', 1, 'none', [draw(3)]),
  // (Smokestack)
  i(
    'uncommon',
    'kindled-rite',
    'Kindled Rite',
    'power',
    1,
    'none',
    [on('created', [dmg(5, 'allFoes')], { tag: STATUS_TAG })],
    { up: { effects: [on('created', [dmg(7, 'allFoes')], { tag: STATUS_TAG })] } },
  ),
  // (Sunder)
  i('uncommon', 'skybreaker', 'Skybreaker', 'attack', 3, 'foe', [onKill(dmg(26), [mana(1)])], {
    up: { effects: [onKill(dmg(34), [mana(1)])] },
  }),
  // (Adaptive Strike)
  i('rare', 'shifting-strike', 'Shifting Strike', 'attack', 2, 'foe', [dmg(18), freeCopy], {
    up: { effects: [dmg(23), freeCopy] },
  }),
  // (All for One)
  i('rare', 'harmonic-wave', 'Spirit Wave', 'attack', 2, 'foe', [dmg(10), zeroCostFromDiscard], {
    up: { effects: [dmg(14), zeroCostFromDiscard] },
  }),
  // (Flak Cannon)
  i(
    'rare',
    'blazing-aperture',
    'Blazing Eye',
    'attack',
    2,
    'none',
    [exhaustStatuses, perConsumed(8)],
    {
      up: { effects: [exhaustStatuses, perConsumed(11)] },
    },
  ),
  // (Helix Drill)
  i('rare', 'whirlpool', 'Whirlpool', 'attack', 0, 'foe', [scaled(dmg(0), per('manaSpent', 3))], {
    up: { effects: [scaled(dmg(0), per('manaSpent', 5))] },
  }),
  // (One for All: in their game everyone's 0-cost Attacks; here only yours)
  i('rare', 'winds-favor', "Wind's Favor", 'power', 1, 'none', [status('deftness', 3)]),
  // (Reboot)
  i('rare', 'retune', 'Retune', 'skill', 0, 'none', [reshuffle, draw(4)], {
    exhaust: true,
    up: { effects: [reshuffle, draw(6)] },
  }),
  // (Trash to Treasure)
  i('rare', 'biased-weave', 'Ash to Spirits', 'power', 1, 'none', [
    on('created', [channel(RAND)], { tag: STATUS_TAG }),
  ]),

  // --- Rites ---
  // (Charge Battery)
  i('common', 'tidecaller', 'Tidecaller', 'skill', 1, 'none', [barrier(7), manaNext(1)], {
    up: { effects: [barrier(10), manaNext(1)] },
  }),
  // (Focused Strike)
  i('common', 'resonant-strike', 'Spirit Strike', 'attack', 1, 'foe', [dmg(9), spiritThisTurn(1)], {
    up: { effects: [dmg(11), spiritThisTurn(2)] },
  }),
  // (Hotfix)
  i('common', 'elemental-focus', 'Elemental Focus', 'skill', 0, 'none', [spiritThisTurn(2)], {
    exhaust: true,
    up: { exhaust: false },
  }),
  // (TURBO) Consumed, unlike theirs: balance.test forbids a free card that makes Mana and stays (as the knight's Bloodletting)
  i(
    'common',
    'inner-flame',
    'Inner Flame',
    'skill',
    0,
    'none',
    [mana(2), addTo('void-drain', 1, 'discard')],
    {
      exhaust: true,
      up: { effects: [mana(3), addTo('void-drain', 1, 'discard')] },
    },
  ),
  // (Bulk Up: Bracing is the Dexterity)
  i('uncommon', 'earthen-might', 'Earthen Might', 'power', 2, 'none', [
    { op: 'runeSlots', amount: -1 },
    status('might', 2),
    status('bracing', 2),
  ]),
  // (Double Energy)
  i('uncommon', 'leyline-tap', 'Root Tap', 'skill', 1, 'none', [scaled(mana(0), per('mana'))], {
    exhaust: true,
    up: { cost: 0 },
  }),
  // (Energy Surge: in their game every player gains it)
  i('uncommon', 'tidal-surge', 'Tidal Surge', 'skill', 1, 'none', [mana(2)], {
    exhaust: true,
    up: { effects: [mana(3)] },
  }),
  // (Hailstorm)
  i(
    'uncommon',
    'permafrost',
    'Hail Rite',
    'power',
    1,
    'none',
    [on('turnEnd', [ifBear([dmg(6, 'allFoes')])])],
    { up: { effects: [on('turnEnd', [ifBear([dmg(8, 'allFoes')])])] } },
  ),
  // (Storm)
  i(
    'uncommon',
    'thundercall',
    'Thunder Rite',
    'power',
    1,
    'none',
    [on('play', [channel('spark')], { filter: 'power' })],
    { up: { effects: [on('play', [channel('spark', 2)], { filter: 'power' })] } },
  ),
  // (Subroutine)
  i('uncommon', 'tuning-fork', 'Spirit Drum', 'power', 1, 'none', [
    on('play', [mana(1)], { filter: 'power' }),
  ]),
  // (Synchronize)
  i(
    'uncommon',
    'chorus-of-glyphs',
    'Chorus of Totems',
    'skill',
    1,
    'none',
    [scaled(spiritThisTurn(0), per('runeKinds'))],
    { up: { effects: [scaled(spiritThisTurn(0), per('runeKinds', 2))] } },
  ),
  // (Synthesis)
  i('uncommon', 'fire-bloom', 'Fire Bloom', 'attack', 2, 'foe', [dmg(14), status('freepower', 1)], {
    up: { effects: [dmg(20), status('freepower', 1)] },
  }),
  // (Thunder: each enemy a Hawk's awakening strikes is struck again)
  i(
    'uncommon',
    'stormcrown',
    'Stormcrown',
    'power',
    1,
    'none',
    [on('evoke', [dmg(8)], { rune: 'spark' })],
    { up: { effects: [on('evoke', [dmg(11)], { rune: 'spark' })] } },
  ),
  // (White Noise: free for the rest of the fight, not the turn)
  i(
    'uncommon',
    'white-noise',
    'Spirit Whisper',
    'skill',
    1,
    'none',
    [discoverOp('power', 1, true)],
    {
      exhaust: true,
      up: { cost: 0 },
    },
  ),
  // (Buffer)
  i('rare', 'sentinel-sigil', 'Spirit Ward', 'power', 2, 'none', [status('shielded', 1)], {
    up: { effects: [status('shielded', 2)] },
  }),
  // (Creative AI)
  i('rare', 'spiritfont', 'Spiritfont', 'power', 3, 'none', [
    on('turnStart', [discoverOp('power')]),
  ]),
  // (Defragment)
  i('rare', 'tune-the-lattice', 'Tune the Spirits', 'power', 1, 'none', [status('resonance', 1)]),
  // (Echo Form)
  i('rare', 'echoing-form', 'Echoing Chant', 'power', 3, 'none', [status('echoing', 1)], {
    ethereal: true,
    up: { ethereal: false },
  }),
  // (Hyperbeam)
  i('rare', 'hyperbeam', 'Skyfall', 'attack', 2, 'none', [dmg(24, 'allFoes'), spiritThisTurn(-3)], {
    up: { effects: [dmg(30, 'allFoes'), spiritThisTurn(-3)] },
  }),
  // (Machine Learning)
  i(
    'rare',
    'machine-learning',
    'Ancestral Learning',
    'power',
    1,
    'none',
    [on('turnStart', [draw(1)])],
    { up: { innate: true } },
  ),
  // (Signal Boost)
  i('rare', 'overtune', 'Resounding Call', 'skill', 1, 'none', [status('boosted', 1)], {
    exhaust: true,
    up: { cost: 0 },
  }),
  // (Supercritical)
  i('rare', 'firestorm', 'Heart of Flame', 'skill', 0, 'none', [mana(4)], {
    exhaust: true,
    up: { effects: [mana(6)] },
  }),

  // --- glue: the cards his cards make ---
  // (Fuel, which Compact makes)
  i('common', 'kindling', 'Kindling', 'skill', 0, 'none', [mana(1)], {
    exhaust: true,
    source: 'token',
    up: { effects: [mana(2)] },
  }),
];

// The Defect's status cards (Dazed, Burn, Slimed, Void; Wound is shared and lives in neutral.ts). Junk, like Wound: never a reward.
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
