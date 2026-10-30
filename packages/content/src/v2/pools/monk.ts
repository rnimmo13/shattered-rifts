// Solen, the Still Flame (Aurelion). A monk of the Gilded Order's silent branch (the Barbarian until DECISIONS #391). No companions.
// Starts the fight Serene.
// Stances (ids calm/wrath/radiant): Serene (leaving it gives 2 Mana, once a turn), Fury (deal double, take 50% more), Radiant (deal
// triple, ends with your turn). Fervor (id mantra) builds to 10, then you enter Radiant.
// Three themes (DECISIONS #255):
//   Fury     - burst: enter Fury, hit as hard as you can, and live through the damage it lets in
//   Flow     - stance dancing: change stance again and again; every change pays (Barrier, damage, cards, the Mana of leaving Serene)
//   Radiant  - build Fervor to 10 and cash it in on a Radiant turn
// (Card ids are older than some names: an id keeps a card's art and every saved deck.)

import type { CardDef } from '@sr/combat';
import {
  barrier,
  dmg,
  draw,
  mana,
  manaNext,
  on,
  per,
  pool,
  scaled,
  scry,
  stance,
  status,
  fetchCards,
  discoverOp,
  heal,
  lose,
} from '../build';

const s = pool('monk', 'aurelion');

export const MONK: CardDef[] = [
  // --- basics ---
  s('basic', 'kindle-fury', 'Kindle Fury', 'attack', 2, 'foe', [dmg(9), stance('wrath')]),
  // (7 Barrier and Serene for 1 Mana was the Watcher's 2-cost Vigilance at half price: DECISIONS #390)
  s('basic', 'still-guard', 'Still Guard', 'skill', 1, 'none', [barrier(3), stance('calm')]),

  // --- Fury ---
  s('common', 'angry-palm', 'Angry Palm', 'attack', 1, 'foe', [scaled(dmg(7), per('wrath', 6))]),
  s('common', 'ashen-fist', 'Ashen Fist', 'attack', 2, 'foe', [dmg(14), stance('wrath')]),
  s('uncommon', 'temper-flare', 'Temper Flare', 'attack', 1, 'foe', [
    dmg(2, 'target', 3),
    stance('wrath'),
  ]),
  s('common', 'rising-ire', 'Rising Ire', 'skill', 0, 'none', [stance('wrath'), draw(1)], {
    exhaust: true,
  }),
  s('uncommon', 'swift-step', 'Swift Step', 'skill', 1, 'none', [
    stance('wrath'),
    status('vigor', 4),
  ]),
  s('rare', 'final-account', 'Final Account', 'attack', 2, 'foe', [
    scaled(dmg(14), per('wrath', 10)),
  ]),
  // (Fury lets damage in: entering it is when to put a guard up)
  s(
    'rare',
    'surge-of-ire',
    'Surge of Ire',
    'power',
    2,
    'none',
    [on('stance', [barrier(6), draw(1)], { stance: 'wrath', once: true })],
    { up: { effects: [on('stance', [barrier(9), draw(1)], { stance: 'wrath', once: true })] } },
  ),
  s('rare', 'rage-of-ages', 'Rage of Ages', 'attack', 3, 'none', [dmg(8, 'allFoes', 3)]),
  s('rare', 'wrath-incarnate', 'Wrath Incarnate', 'power', 2, 'none', [
    on('turnStart', [stance('wrath')]),
  ]),
  s('common', 'red-mist', 'Burning Breath', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    stance('wrath'),
  ]),
  s('common', 'flurry-of-palms', 'Flurry of Palms', 'attack', 0, 'foe', [dmg(3, 'target', 2)]),
  s('uncommon', 'wheel-kick', 'Spinning Heel', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 2, 'target'),
    draw(1),
  ]),
  s('uncommon', 'wrathful-guard', 'Wrathful Guard', 'skill', 1, 'none', [
    barrier(6),
    stance('wrath'),
  ]),
  s(
    'rare',
    'rampage-of-ire',
    'Rampage of Ire',
    'power',
    2,
    'none',
    [on('stance', [dmg(6, 'allFoes')], { stance: 'wrath' })],
    { up: { effects: [on('stance', [dmg(9, 'allFoes')], { stance: 'wrath' })] } },
  ),
  s(
    'rare',
    'rage-unbound',
    'Rage Unbound',
    'skill',
    0,
    'none',
    [stance('wrath'), mana(1), lose(3)],
    {
      exhaust: true,
    },
  ),
  s('uncommon', 'hot-blooded', 'Hot-Blooded', 'attack', 1, 'foe', [
    scaled(dmg(4), per('missingPct', 1 / 6)),
    stance('wrath'),
  ]),
  s(
    'uncommon',
    'berserk-tide',
    'Storm of Fists',
    'attack',
    0,
    'foe',
    [
      scaled({ op: 'damage', amount: 4, hits: 0, to: 'target' }, per('x', 1, undefined, 'hits')),
      stance('wrath'),
    ],
    { x: true },
  ),
  s('common', 'unleashed-roar', 'Unleashed Roar', 'skill', 1, 'none', [
    status('exposed', 1, 'allFoes'),
    stance('wrath'),
  ]),
  s(
    'uncommon',
    'cornered-beast',
    'Coiled Serpent',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('vigor', 4), stance('wrath')],
    { trigger: { on: 'hpLost', min: 5 } },
  ),
  s('rare', 'ashes-of-restraint', 'Ashes of Restraint', 'attack', 2, 'foe', [
    scaled(dmg(9), per('exhausted', 2)),
    stance('wrath'),
  ]),

  // --- Flow ---
  s('common', 'centre-yourself', 'Centre Yourself', 'skill', 1, 'none', [draw(1), stance('calm')]),
  // (into Fury and straight back to Serene: two stance changes, and leaving Serene pays its Mana once a turn)
  s(
    'common',
    'unburdened-guard',
    'Shifting Guard',
    'skill',
    1,
    'none',
    [barrier(2), stance('wrath'), stance('calm')],
    { up: { effects: [barrier(4), stance('wrath'), stance('calm')] } },
  ),
  s('common', 'thread-cutter', 'Thread-Cutter', 'attack', 1, 'foe', [
    dmg(3),
    stance('wrath'),
    stance('calm'),
  ]),
  s('uncommon', 'settled-mind', 'Settled Mind', 'skill', 1, 'none', [
    scaled(draw(0), per('calm', 3)),
    stance('calm'),
  ]),
  s(
    'common',
    'hushed-stillness',
    'Hushed Stillness',
    'skill',
    0,
    'none',
    [stance('calm'), draw(1)],
    {
      exhaust: true,
    },
  ),
  s(
    'uncommon',
    'unmoved-mind',
    'Unmoved Mind',
    'power',
    2,
    'none',
    [on('stance', [barrier(2), dmg(2, 'randomFoe')])],
    { up: { effects: [on('stance', [barrier(3), dmg(3, 'randomFoe')])] } },
  ),
  s('rare', 'ascendant-form', 'Ascendant Form', 'power', 2, 'none', [on('turnStart', [mana(1)])]),
  s('rare', 'perfect-calm', 'Perfect Calm', 'skill', 2, 'none', [
    barrier(12),
    stance('calm'),
    draw(1),
  ]),
  s(
    'common',
    'vigilance',
    'Watchful Calm',
    'skill',
    1,
    'none',
    [barrier(2), stance('calm'), scry(2)],
    { up: { effects: [barrier(5), stance('calm'), scry(2)] } },
  ),
  s('common', 'empty-fist', 'Settling Fist', 'attack', 1, 'foe', [dmg(7), stance('none')]),
  s(
    'uncommon',
    'inner-calm',
    'Wheel of Motion',
    'power',
    2,
    'none',
    [on('stance', [dmg(3, 'allFoes')])],
    { up: { effects: [on('stance', [dmg(4, 'allFoes')])] } },
  ),
  s('uncommon', 'fearless', 'Unafraid', 'attack', 1, 'foe', [dmg(6), stance('calm')]),
  s('rare', 'meditate', 'Recollect', 'skill', 1, 'none', [fetchCards(1), stance('calm')], {
    retain: true,
  }),
  s('uncommon', 'sanctity', 'Let Go', 'skill', 1, 'none', [draw(2), stance('none')]),
  // (the Trickster's Pickpocket Master word for word, so the same cost: 2)
  s('rare', 'all-seeing', 'All-Seeing', 'skill', 2, 'none', [discoverOp(undefined, 2, true)], {
    exhaust: true,
  }),
  s(
    'rare',
    'serenity-incarnate',
    'Serenity Incarnate',
    'power',
    3,
    'none',
    [on('turnEnd', [heal(3), barrier(6)])],
    { up: { effects: [on('turnEnd', [heal(3), barrier(9)])] } },
  ),
  s(
    'uncommon',
    'still-water',
    'Still Water',
    'skill',
    1,
    'none',
    [scaled(barrier(4), per('calm', 6)), draw(1)],
    { up: { effects: [scaled(barrier(7), per('calm', 6)), draw(1)] } },
  ),
  s('uncommon', 'exhale', 'Exhale', 'skill', 0, 'none', [stance('none'), mana(1)], {
    exhaust: true,
  }),
  s(
    'uncommon',
    'mirror-pool',
    'Mirror Pool',
    'skill',
    1,
    'none',
    [scaled(barrier(0), per('mana', 3)), stance('calm')],
    { retain: true },
  ),
  s(
    'rare',
    'gentle-return',
    'Gentle Return',
    'power',
    1,
    'none',
    [on('stance', [heal(1), barrier(3)], { stance: 'calm' })],
    { up: { effects: [on('stance', [heal(1), barrier(5)], { stance: 'calm' })] } },
  ),
  s(
    'rare',
    'tide-of-peace',
    'Tide of Peace',
    'skill',
    0,
    'none',
    [scaled(barrier(0), per('x', 4)), draw(2), stance('calm')],
    { x: true },
  ),

  // --- Radiant ---
  s('common', 'whispered-vow', 'Whispered Vow', 'skill', 1, 'none', [status('mantra', 3), scry(2)]),
  s('common', 'bowing-low', 'Bowing Low', 'skill', 0, 'none', [status('mantra', 2), barrier(2)], {
    up: { effects: [status('mantra', 3), barrier(2)] },
  }),
  s('common', 'sunlit-blade', 'Sunlit Blade', 'attack', 1, 'foe', [dmg(9), status('mantra', 1)]),
  s('uncommon', 'the-offering', 'The Offering', 'skill', 1, 'none', [status('mantra', 5)], {
    retain: true,
  }),
  s('rare', 'litany', 'Litany', 'power', 1, 'none', [
    on('play', [status('mantra', 1)], { filter: 'skill' }),
  ]),
  s(
    'uncommon',
    'daily-rite',
    'Daily Rite',
    'power',
    1,
    'none',
    [on('turnStart', [status('mantra', 2)])],
    { up: { effects: [on('turnStart', [status('mantra', 3)])] } },
  ),
  s('rare', 'rise-radiant', 'Rise Radiant', 'skill', 2, 'none', [stance('radiant')], {
    exhaust: true,
  }),
  s(
    'common',
    'reading-the-signs',
    'Reading the Signs',
    'power',
    1,
    'none',
    [on('discard', [status('mantra', 1)])],
    { up: { innate: true } },
  ),
  s(
    'rare',
    'perfect-balance',
    'Perfect Balance',
    'power',
    2,
    'none',
    [on('stance', [draw(1), barrier(2)])],
    { up: { effects: [on('stance', [draw(1), barrier(4)])] } },
  ),
  s(
    'rare',
    'still-flame-ascendant',
    'Still Flame Ascendant',
    'skill',
    3,
    'none',
    [stance('radiant'), status('vigor', 4), draw(2)],
    { exhaust: true },
  ),
  // (it makes more Mana than it costs, so it Consumes: the costing guide's rule for Mana cards)
  s('uncommon', 'deep-breath', 'Gather Breath', 'skill', 1, 'none', [manaNext(2), draw(2)], {
    exhaust: true,
    // (the "+" draws one more, not more Mana as well)
    up: { effects: [manaNext(2), draw(3)] },
  }),
  s('common', 'prostrate', 'Kneel', 'skill', 0, 'none', [status('mantra', 2), draw(1)], {
    exhaust: true,
    up: { effects: [status('mantra', 3), draw(1)] },
  }),
  s('uncommon', 'worship', 'Hymn of Embers', 'skill', 2, 'none', [status('mantra', 5), barrier(8)]),
  s(
    'uncommon',
    'devotion',
    'Morning Prayer',
    'power',
    1,
    'none',
    [on('turnStart', [status('mantra', 1), barrier(2)])],
    { up: { effects: [on('turnStart', [status('mantra', 1), barrier(4)])] } },
  ),
  s('rare', 'scrawl', 'Flood of Visions', 'skill', 1, 'none', [draw(5), status('mantra', 2)], {
    exhaust: true,
  }),
  s('rare', 'last-rites-of-flame', 'Last Rites of the Flame', 'attack', 3, 'none', [
    dmg(16, 'allFoes'),
    status('mantra', 5),
  ]),
  s(
    'rare',
    'radiant-heart',
    'Radiant Heart',
    'power',
    1,
    'none',
    [on('stance', [draw(3)], { stance: 'radiant' })],
    { up: { effects: [on('stance', [draw(4)], { stance: 'radiant' })] } },
  ),
  s('uncommon', 'foretold-flame', 'Foretold Flame', 'attack', 1, 'foe', [
    scaled(dmg(5), per('mantra', 1)),
    scry(2),
  ]),
  s('common', 'faith-kept', 'Faith Kept', 'skill', 1, 'none', [status('mantra', 3)], {
    retain: true,
    onExhaust: [status('mantra', 3)],
  }),
  s('uncommon', 'mantra-engine', 'Mantra Engine', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('mantra', 1))]),
  ]),
  s(
    'rare',
    'burning-litany',
    'Burning Litany',
    'skill',
    3,
    'none',
    [scaled(dmg(0, 'allFoes'), per('mantra', 1)), stance('radiant')],
    { exhaust: true },
  ),
  s(
    'rare',
    'unwavering',
    'Unwavering',
    'power',
    2,
    'none',
    [
      on('discard', [barrier(4), status('mantra', 1)]),
      on('exhaust', [barrier(4), status('mantra', 1)]),
    ],
    {
      up: {
        effects: [
          on('discard', [barrier(6), status('mantra', 1)]),
          on('exhaust', [barrier(6), status('mantra', 1)]),
        ],
      },
    },
  ),

  // --- glue: cards for any deck (DECISIONS #337) ---
  s(
    'common',
    'crushing-palm',
    'Crushing Palm',
    'attack',
    1,
    'foe',
    [dmg(8), status('exposed', 1, 'target')],
    { up: { effects: [dmg(11), status('exposed', 1, 'target')] } },
  ),
  s('uncommon', 'inner-sight', 'Inner Sight', 'skill', 1, 'none', [barrier(5), scry(4)]),
  s('common', 'quick-palms', 'Quick Palms', 'attack', 0, 'foe', [dmg(4), status('mantra', 1)], {
    up: { effects: [dmg(7), status('mantra', 1)] },
  }),

  // --- more glue: uncommons and rares for any deck (DECISIONS #339) ---
  s('rare', 'spirit-shield', "Mountain's Stillness", 'skill', 2, 'none', [
    scaled(barrier(6), per('hand', 3)),
  ]),
  s(
    'rare',
    'breath-between-blows',
    'Breath Between Blows',
    'power',
    1,
    'none',
    [on('play', [barrier(2)], { filter: 'skill' })],
    { up: { effects: [on('play', [barrier(3)], { filter: 'skill' })] } },
  ),
  s('uncommon', 'held-breath', 'Held Breath', 'skill', 1, 'none', [status('holdfast', 1)]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  s('uncommon', 'rending-hands', 'Rending Hands', 'attack', 1, 'foe', [
    dmg(6, 'target', 2),
    lose(1),
  ]),
  s(
    'uncommon',
    'blood-on-the-sand',
    'Iron Body',
    'power',
    1,
    'none',
    [on('stance', [lose(2), status('vigor', 3)], { stance: 'wrath' })],
    { up: { effects: [on('stance', [lose(1), status('vigor', 3)], { stance: 'wrath' })] } },
  ),
  s('uncommon', 'open-palm', 'Open Palm', 'attack', 1, 'foe', [
    dmg(5, 'target', 2),
    stance('none'),
  ]),
  s(
    'uncommon',
    'shield-of-faith',
    'Shield of Faith',
    'skill',
    1,
    'none',
    [barrier(7), status('mantra', 1)],
    {
      up: { effects: [barrier(10), status('mantra', 1)] },
    },
  ),
  s('uncommon', 'poise', 'Poise', 'power', 1, 'none', [status('bracing', 3)]),

  // --- new for the 20/30/25 rarity target (DECISIONS #341) ---
  s('rare', 'thousand-palms', 'Thousand Palms', 'attack', 2, 'foe', [dmg(3, 'target', 7)]),
  s(
    'rare',
    'unbroken-calm',
    'Unbroken Calm',
    'power',
    2,
    'none',
    [on('turnStart', [barrier(4), draw(1)])],
    { up: { effects: [on('turnStart', [barrier(6), draw(1)])] } },
  ),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  s('uncommon', 'wreath-of-flame', 'Crown of Embers', 'skill', 1, 'none', [
    status('vigor', 6),
    status('mantra', 2),
  ]),
];
