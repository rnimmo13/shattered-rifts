// Sehra, the Still Flame (Aurelion). A barbarian of the Gilded Order's silent branch. No companions. Starts the fight Serene.
// Stances (ids calm/wrath/radiant): Serene (leaving it gives 2 Mana, once a turn), Fury (deal double, take 50% more), Radiant (deal
// triple, ends with your turn). Fervor (id mantra) builds to 10, then you enter Radiant.
// Three build paths (DECISIONS #255):
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
} from '../build';

const s = pool('barbarian', 'aurelion');

export const BARBARIAN: CardDef[] = [
  // --- basics ---
  s('basic', 'kindle-fury', 'Kindle Fury', 'attack', 2, 'foe', [dmg(9), stance('wrath')]),
  s('basic', 'still-guard', 'Still Guard', 'skill', 1, 'none', [barrier(7), stance('calm')]),

  // --- Fury ---
  s('common', 'angry-palm', 'Angry Palm', 'attack', 1, 'foe', [scaled(dmg(7), per('wrath', 6))]),
  s('common', 'ashen-fist', 'Ashen Fist', 'attack', 2, 'foe', [dmg(14), stance('wrath')]),
  s('uncommon', 'temper-flare', 'Temper Flare', 'attack', 1, 'foe', [
    dmg(3, 'target', 3),
    stance('wrath'),
  ]),
  s('common', 'rising-ire', 'Rising Ire', 'skill', 0, 'none', [stance('wrath'), draw(1)], {
    exhaust: true,
  }),
  s('common', 'swift-step', 'Swift Step', 'skill', 1, 'none', [
    stance('wrath'),
    status('vigor', 4),
  ]),
  s('uncommon', 'final-account', 'Final Account', 'attack', 2, 'foe', [
    scaled(dmg(10), per('wrath', 8)),
  ]),
  // (Fury lets damage in: entering it is when to put a guard up)
  s('uncommon', 'surge-of-ire', 'Surge of Ire', 'power', 1, 'none', [
    on('stance', [barrier(6), draw(1)], { stance: 'wrath' }),
  ]),
  s('rare', 'rage-of-ages', 'Rage of Ages', 'attack', 3, 'none', [dmg(5, 'allFoes', 3)]),
  s('rare', 'wrath-incarnate', 'Wrath Incarnate', 'power', 2, 'none', [
    on('turnStart', [stance('wrath')]),
  ]),
  s('common', 'red-mist', 'Red Mist', 'attack', 1, 'none', [dmg(5, 'allFoes'), stance('wrath')]),
  s('common', 'flurry-of-palms', 'Flurry of Palms', 'attack', 0, 'foe', [dmg(3, 'target', 2)]),
  s('uncommon', 'wheel-kick', 'Spinning Heel', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 2, 'target'),
    draw(1),
  ]),
  s('uncommon', 'wrathful-guard', 'Wrathful Guard', 'skill', 1, 'none', [
    barrier(8),
    stance('wrath'),
  ]),
  s('rare', 'rampage-of-ire', 'Rampage of Ire', 'power', 2, 'none', [
    on('stance', [dmg(6, 'allFoes')], { stance: 'wrath' }),
  ]),
  s('rare', 'rage-unbound', 'Rage Unbound', 'skill', 0, 'none', [stance('wrath'), mana(1)], {
    exhaust: true,
  }),
  s('uncommon', 'hot-blooded', 'Hot-Blooded', 'attack', 1, 'foe', [
    scaled(dmg(8), per('missingPct', 1 / 6)),
    stance('wrath'),
  ]),
  s(
    'common',
    'berserk-tide',
    'Berserk Tide',
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
    'Cornered Beast',
    'snare',
    1,
    'none',
    [dmg(12, 'attacker'), status('vigor', 4), stance('wrath')],
    { trigger: { on: 'hpLost', min: 5 } },
  ),
  s('rare', 'ashes-of-restraint', 'Ashes of Restraint', 'attack', 2, 'foe', [
    scaled(dmg(6), per('exhausted', 2)),
    stance('wrath'),
  ]),

  // --- Flow ---
  s('common', 'centre-yourself', 'Centre Yourself', 'skill', 1, 'none', [draw(2), stance('calm')]),
  // (into Fury and straight back to Serene: two stance changes, and leaving Serene pays its Mana once a turn)
  s('common', 'unburdened-guard', 'Shifting Guard', 'skill', 1, 'none', [
    barrier(5),
    stance('wrath'),
    stance('calm'),
  ]),
  s('common', 'thread-cutter', 'Thread-Cutter', 'attack', 1, 'foe', [
    dmg(5),
    stance('wrath'),
    stance('calm'),
  ]),
  s('common', 'settled-mind', 'Settled Mind', 'skill', 1, 'none', [
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
  s('uncommon', 'unmoved-mind', 'Unmoved Mind', 'power', 1, 'none', [
    on('stance', [barrier(3), dmg(2, 'randomFoe')]),
  ]),
  s('rare', 'ascendant-form', 'Ascendant Form', 'power', 2, 'none', [on('turnStart', [mana(1)])]),
  s('rare', 'perfect-calm', 'Perfect Calm', 'skill', 2, 'none', [
    barrier(12),
    stance('calm'),
    draw(1),
  ]),
  s('common', 'vigilance', 'Watchful Calm', 'skill', 1, 'none', [
    barrier(6),
    stance('calm'),
    scry(2),
  ]),
  s('common', 'empty-fist', 'Settling Fist', 'attack', 1, 'foe', [
    dmg(8),
    barrier(3),
    stance('none'),
  ]),
  s('uncommon', 'inner-calm', 'Wheel of Motion', 'power', 1, 'none', [
    on('stance', [dmg(3, 'allFoes')]),
  ]),
  s('uncommon', 'fearless', 'Unafraid', 'attack', 1, 'foe', [dmg(8), stance('calm')]),
  s('uncommon', 'meditate', 'Recollect', 'skill', 1, 'none', [fetchCards(1), stance('calm')], {
    retain: true,
  }),
  s('uncommon', 'sanctity', 'Let Go', 'skill', 1, 'none', [draw(2), stance('none')]),
  s('rare', 'all-seeing', 'All-Seeing', 'skill', 3, 'none', [discoverOp(undefined, 2, true)], {
    exhaust: true,
  }),
  s('rare', 'serenity-incarnate', 'Serenity Incarnate', 'power', 3, 'none', [
    on('turnEnd', [heal(3), barrier(6)]),
  ]),
  s('common', 'still-water', 'Still Water', 'skill', 1, 'none', [
    scaled(barrier(4), per('calm', 6)),
    draw(1),
  ]),
  s('common', 'exhale', 'Exhale', 'skill', 0, 'none', [stance('none'), mana(1), draw(1)], {
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
  s('uncommon', 'gentle-return', 'Gentle Return', 'power', 1, 'none', [
    on('stance', [heal(2), barrier(3)], { stance: 'calm' }),
  ]),
  s(
    'rare',
    'tide-of-peace',
    'Tide of Peace',
    'skill',
    0,
    'none',
    [scaled(barrier(0), per('x', 5)), scaled(draw(0), per('x', 1)), stance('calm')],
    { x: true },
  ),

  // --- Radiant ---
  s('common', 'whispered-vow', 'Whispered Vow', 'skill', 1, 'none', [status('mantra', 3), scry(2)]),
  s('common', 'bowing-low', 'Bowing Low', 'skill', 0, 'none', [status('mantra', 2), barrier(6)]),
  s('common', 'sunlit-blade', 'Sunlit Blade', 'attack', 1, 'foe', [dmg(9), status('mantra', 1)]),
  s('uncommon', 'the-offering', 'The Offering', 'skill', 2, 'none', [status('mantra', 5)], {
    retain: true,
  }),
  s('uncommon', 'litany', 'Litany', 'power', 2, 'none', [
    on('play', [status('mantra', 1)], { filter: 'skill' }),
  ]),
  s('uncommon', 'daily-rite', 'Daily Rite', 'power', 1, 'none', [
    on('turnStart', [status('mantra', 2)]),
  ]),
  s('rare', 'rise-radiant', 'Rise Radiant', 'skill', 2, 'none', [stance('radiant')], {
    exhaust: true,
  }),
  s('common', 'reading-the-signs', 'Reading the Signs', 'power', 1, 'none', [
    on('discard', [status('mantra', 1)]),
  ]),
  s('legendary', 'perfect-balance', 'Perfect Balance', 'power', 2, 'none', [
    on('stance', [draw(1), barrier(5), status('mantra', 1)]),
  ]),
  s(
    'legendary',
    'still-flame-ascendant',
    'Still Flame Ascendant',
    'skill',
    3,
    'none',
    [stance('radiant'), status('vigor', 4), draw(2)],
    { exhaust: true },
  ),
  s('uncommon', 'deep-breath', 'Gather Breath', 'skill', 1, 'none', [manaNext(2), draw(1)]),
  s('common', 'prostrate', 'Kneel', 'skill', 0, 'none', [status('mantra', 2), draw(1)], {
    exhaust: true,
  }),
  s('uncommon', 'worship', 'Hymn of Embers', 'skill', 2, 'none', [status('mantra', 4), barrier(6)]),
  s('common', 'devotion', 'Morning Prayer', 'power', 1, 'none', [
    on('turnStart', [status('mantra', 1), barrier(3)]),
  ]),
  s('uncommon', 'scrawl', 'Flood of Visions', 'skill', 1, 'none', [draw(5), status('mantra', 2)], {
    exhaust: true,
  }),
  s('rare', 'last-rites-of-flame', 'Last Rites of the Flame', 'attack', 3, 'none', [
    dmg(14, 'allFoes'),
    status('mantra', 5),
  ]),
  s('rare', 'radiant-heart', 'Radiant Heart', 'power', 2, 'none', [
    on('stance', [draw(2)], { stance: 'radiant' }),
  ]),
  s('uncommon', 'foretold-flame', 'Foretold Flame', 'attack', 1, 'foe', [
    scaled(dmg(5), per('mantra', 1)),
    scry(2),
  ]),
  s('common', 'faith-kept', 'Faith Kept', 'skill', 1, 'none', [status('mantra', 2)], {
    retain: true,
    onExhaust: [status('mantra', 3)],
  }),
  s('common', 'mantra-engine', 'Mantra Engine', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('mantra', 1))]),
  ]),
  s(
    'rare',
    'burning-litany',
    'Burning Litany',
    'skill',
    2,
    'none',
    [scaled(dmg(0, 'allFoes'), per('mantra', 1)), stance('radiant')],
    { exhaust: true },
  ),
  s('rare', 'unwavering', 'Unwavering', 'power', 2, 'none', [
    on('discard', [barrier(4), status('mantra', 1)]),
    on('exhaust', [barrier(4), status('mantra', 1)]),
  ]),

  // --- glue: cards for any build path (DECISIONS #337) ---
  s('common', 'crushing-palm', 'Crushing Palm', 'attack', 1, 'foe', [
    dmg(8),
    status('exposed', 1, 'target'),
  ]),
  s('common', 'inner-sight', 'Inner Sight', 'skill', 1, 'none', [barrier(5), scry(4)]),
  s('common', 'quick-palms', 'Quick Palms', 'attack', 0, 'foe', [dmg(3)]),

  // --- more glue: uncommons and rares for any build path (DECISIONS #339) ---
  s('rare', 'spirit-shield', "Mountain's Stillness", 'skill', 2, 'none', [
    scaled(barrier(4), per('hand', 2)),
  ]),
  s('rare', 'breath-between-blows', 'Breath Between Blows', 'power', 1, 'none', [
    on('play', [barrier(2)], { filter: 'skill' }),
  ]),
  s('uncommon', 'held-breath', 'Held Breath', 'skill', 1, 'none', [status('holdfast', 1)]),
];
