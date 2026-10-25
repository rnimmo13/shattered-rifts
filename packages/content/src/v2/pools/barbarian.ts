// Sehra, the Still Flame (Aurelion). A barbarian of the Gilded Order's silent branch. No companions. Starts the fight in Calm.
// Stances: Calm (leaving it gives 2 Mana), Wrath (deal double, take 50% more), Radiant (deal triple, ends with your turn).
// Three lanes:
//   Wrath   - burst: enter Wrath, hit hard, get out
//   Calm    - economy: Mana, cards and Barrier from stepping in and out of stillness
//   Mantra  - build Mantra (with Scry and Retain) towards Radiant

import type { CardDef } from '@sr/combat';
import {
  barrier,
  dmg,
  draw,
  lose,
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
  s('basic', 'kindle-fury', 'Kindle Fury', 'attack', 1, 'foe', [dmg(7), stance('wrath')]),
  s('basic', 'still-guard', 'Still Guard', 'skill', 1, 'none', [barrier(7), stance('calm')]),

  // --- Wrath ---
  s('common', 'quick-palms', 'Quick Palms', 'attack', 0, 'foe', [dmg(3)]),
  s('common', 'angry-palm', 'Angry Palm', 'attack', 1, 'foe', [scaled(dmg(7), per('wrath', 6))]),
  s('common', 'war-breath', 'War Breath', 'skill', 1, 'none', [stance('wrath'), draw(1)]),
  s('common', 'ashen-fist', 'Ashen Fist', 'attack', 2, 'foe', [dmg(14), stance('wrath')]),
  s('uncommon', 'temper-flare', 'Temper Flare', 'attack', 1, 'foe', [
    dmg(3, 'target', 3),
    stance('wrath'),
  ]),
  s('uncommon', 'rising-ire', 'Rising Ire', 'skill', 0, 'none', [stance('wrath')], {
    retain: true,
    exhaust: true,
  }),
  s('uncommon', 'swift-step', 'Swift Step', 'skill', 1, 'none', [stance('wrath'), draw(1)]),
  s('uncommon', 'final-account', 'Final Account', 'attack', 2, 'foe', [
    scaled(dmg(10), per('wrath', 8)),
  ]),
  s('uncommon', 'surge-of-ire', 'Surge of Ire', 'power', 1, 'none', [
    on('stance', [draw(2)], { stance: 'wrath' }),
  ]),
  s('rare', 'rage-of-ages', 'Rage of Ages', 'attack', 3, 'none', [dmg(5, 'randomFoe', 5)]),
  s('rare', 'wrath-incarnate', 'Wrath Incarnate', 'power', 2, 'none', [
    on('turnStart', [stance('wrath')]),
  ]),

  s('common', 'red-mist', 'Red Mist', 'attack', 1, 'none', [dmg(5, 'allFoes'), stance('wrath')]),

  // (more Fury)
  s('common', 'flurry-of-palms', 'Flurry of Palms', 'attack', 0, 'foe', [dmg(3, 'target', 2)]),
  s('common', 'crushing-palm', 'Crushing Palm', 'attack', 1, 'foe', [
    dmg(8),
    status('exposed', 1, 'target'),
  ]),
  s('uncommon', 'wheel-kick', 'Wheel Kick', 'attack', 2, 'foe', [dmg(15), draw(2)]),
  s('uncommon', 'cut-through-fate', 'Cut Through Fate', 'attack', 1, 'foe', [
    dmg(7),
    scry(2),
    draw(1),
  ]),
  s('uncommon', 'wrathful-guard', 'Wrathful Guard', 'skill', 1, 'none', [
    barrier(6),
    stance('wrath'),
  ]),
  s('rare', 'brilliance', 'Brilliance', 'attack', 1, 'foe', [scaled(dmg(12), per('mantra', 1))]),
  s('rare', 'rampage-of-ire', 'Rampage of Ire', 'power', 2, 'none', [
    on('stance', [dmg(6, 'allFoes')], { stance: 'wrath' }),
  ]),
  s('rare', 'rage-unbound', 'Rage Unbound', 'skill', 0, 'none', [stance('wrath'), mana(1)], {
    exhaust: true,
  }),

  // --- Calm ---
  s('common', 'centre-yourself', 'Centre Yourself', 'skill', 1, 'none', [draw(2), stance('calm')]),
  s('common', 'unburdened-guard', 'Unburdened Guard', 'skill', 1, 'none', [
    barrier(7),
    stance('none'),
  ]),
  s('common', 'open-palm', 'Open Palm', 'attack', 1, 'foe', [dmg(9), stance('none')]),
  s('common', 'inner-sight', 'Inner Sight', 'skill', 1, 'none', [barrier(7), scry(3)]),
  s('common', 'thread-cutter', 'Thread-Cutter', 'attack', 1, 'foe', [dmg(7), scry(2), draw(1)]),
  s('uncommon', 'settled-mind', 'Settled Mind', 'skill', 1, 'none', [
    scaled(draw(0), per('calm', 3)),
    stance('calm'),
  ]),
  s('uncommon', 'breathe', 'Breathe', 'skill', 1, 'none', [stance('calm'), barrier(5)]),
  s('uncommon', 'hushed-stillness', 'Hushed Stillness', 'skill', 0, 'none', [stance('calm')], {
    retain: true,
    exhaust: true,
  }),
  s('uncommon', 'still-pool', 'Still Pool', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('calm', 5))]),
  ]),
  s('uncommon', 'unmoved-mind', 'Unmoved Mind', 'power', 1, 'none', [on('stance', [barrier(4)])]),
  s('rare', 'ascendant-form', 'Ascendant Form', 'power', 2, 'none', [on('turnStart', [mana(1)])]),
  s('rare', 'perfect-calm', 'Perfect Calm', 'skill', 2, 'none', [
    barrier(12),
    stance('calm'),
    draw(1),
  ]),

  // (more Serene)
  s('common', 'vigilance', 'Vigilance', 'skill', 1, 'none', [barrier(8), stance('calm')]),
  s('common', 'empty-vessel', 'Empty Vessel', 'skill', 1, 'none', [barrier(7), stance('none')]),
  s('common', 'empty-fist', 'Empty Fist', 'attack', 1, 'foe', [dmg(9), stance('none')]),
  s('uncommon', 'inner-calm', 'Inner Calm', 'skill', 1, 'none', [stance('calm'), draw(2)]),
  s('uncommon', 'fearless', 'Fearless', 'attack', 1, 'foe', [dmg(8), stance('calm')]),
  s('uncommon', 'meditate', 'Meditate', 'skill', 1, 'none', [fetchCards(1), stance('calm')], {
    retain: true,
  }),
  s('uncommon', 'sanctity', 'Sanctity', 'skill', 1, 'none', [barrier(6), draw(2)]),
  s('rare', 'spirit-shield', 'Spirit Shield', 'skill', 2, 'none', [
    scaled(barrier(0), per('hand', 3)),
  ]),
  s('rare', 'all-seeing', 'All-Seeing', 'skill', 3, 'none', [discoverOp(undefined, 2, true)], {
    exhaust: true,
  }),
  s('rare', 'serenity-incarnate', 'Serenity Incarnate', 'power', 3, 'none', [
    on('turnEnd', [heal(3), barrier(6)]),
  ]),

  // --- Mantra ---
  s('common', 'whispered-vow', 'Whispered Vow', 'skill', 1, 'none', [status('mantra', 3), scry(2)]),
  s('common', 'bowing-low', 'Bowing Low', 'skill', 0, 'none', [status('mantra', 2), barrier(6)]),
  s('common', 'devout-strike', 'Devout Strike', 'attack', 1, 'foe', [dmg(7), status('mantra', 1)]),
  s('common', 'shield-of-faith', 'Shield of Faith', 'skill', 1, 'none', [
    barrier(7),
    status('mantra', 1),
  ]),
  s('common', 'sunlit-blade', 'Sunlit Blade', 'attack', 1, 'foe', [dmg(9), scry(2)]),
  s('uncommon', 'the-offering', 'The Offering', 'skill', 2, 'none', [status('mantra', 5)], {
    retain: true,
  }),
  s('uncommon', 'litany', 'Litany', 'power', 2, 'none', [
    on('play', [status('mantra', 1)], { filter: 'skill' }),
  ]),
  s('rare', 'daily-rite', 'Daily Rite', 'power', 1, 'none', [
    on('turnStart', [status('mantra', 2)]),
  ]),
  s('rare', 'rise-radiant', 'Rise Radiant', 'skill', 2, 'none', [stance('radiant')], {
    exhaust: true,
  }),
  s('uncommon', 'martyrs-vow', "Martyr's Vow", 'skill', 0, 'none', [lose(3), status('mantra', 3)]),
  s(
    'uncommon',
    'poised-riposte',
    'Poised Riposte',
    'snare',
    1,
    'none',
    [dmg(9, 'attacker'), stance('wrath')],
    { trigger: { on: 'attacked' } },
  ),
  s('uncommon', 'held-breath', 'Held Breath', 'skill', 1, 'none', [status('holdfast', 1)]),
  s('uncommon', 'poise', 'Poise', 'power', 1, 'none', [status('bracing', 2)]),
  s('uncommon', 'reading-the-signs', 'Reading the Signs', 'power', 1, 'none', [
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
  s('uncommon', 'deep-breath', 'Deep Breath', 'skill', 1, 'none', [manaNext(2), draw(1)]),
  // (more Fervor)
  s('common', 'prostrate', 'Prostrate', 'skill', 0, 'none', [status('mantra', 2), draw(1)]),
  s('common', 'pray', 'Pray', 'skill', 1, 'none', [status('mantra', 3), barrier(3)]),
  s('uncommon', 'worship', 'Worship', 'skill', 2, 'none', [status('mantra', 5)]),
  s('uncommon', 'devotion', 'Devotion', 'power', 1, 'none', [
    on('turnStart', [status('mantra', 2)]),
  ]),
  s('uncommon', 'wreath-of-flame', 'Wreath of Flame', 'skill', 1, 'none', [status('vigor', 6)]),
  s('rare', 'scrawl', 'Scrawl', 'skill', 1, 'none', [draw(7)], { exhaust: true }),
  s('rare', 'last-rites-of-flame', 'Last Rites of the Flame', 'attack', 3, 'none', [
    dmg(14, 'allFoes'),
    status('mantra', 5),
  ]),
  s('rare', 'radiant-heart', 'Radiant Heart', 'power', 2, 'none', [
    on('stance', [draw(2), mana(1)], { stance: 'radiant' }),
  ]),

  // --- Wrath (more) ---
  s(
    'common',
    'ember-jab',
    'Ember Jab',
    'attack',
    0,
    'foe',
    [dmg(4), status('exposed', 1, 'target')],
    {
      exhaust: true,
    },
  ),
  s('common', 'rending-hands', 'Rending Hands', 'attack', 1, 'foe', [dmg(5, 'target', 2), lose(2)]),
  s('uncommon', 'hot-blooded', 'Hot-Blooded', 'attack', 1, 'foe', [
    scaled(dmg(8), per('missingHp', 0.2)),
    stance('wrath'),
  ]),
  s(
    'uncommon',
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
  s('uncommon', 'unleashed-roar', 'Unleashed Roar', 'skill', 1, 'none', [
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
  s('rare', 'blood-on-the-sand', 'Blood on the Sand', 'power', 1, 'none', [
    on('stance', [lose(2), status('vigor', 2)], { stance: 'wrath' }),
  ]),
  s('rare', 'ashes-of-restraint', 'Ashes of Restraint', 'attack', 2, 'foe', [
    scaled(dmg(6), per('exhausted', 3)),
    stance('wrath'),
  ]),

  // --- Calm (more) ---
  s('common', 'settled-palms', 'Settled Palms', 'skill', 0, 'none', [barrier(3), scry(2)]),
  s('common', 'quiet-strike', 'Quiet Strike', 'attack', 1, 'foe', [
    dmg(7),
    barrier(3),
    stance('calm'),
  ]),
  s('uncommon', 'still-water', 'Still Water', 'skill', 1, 'none', [
    scaled(barrier(4), per('calm', 6)),
    draw(1),
  ]),
  s('uncommon', 'exhale', 'Exhale', 'skill', 0, 'none', [stance('none'), mana(1), draw(1)], {
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
  s('rare', 'breath-between-blows', 'Breath Between Blows', 'power', 1, 'none', [
    on('play', [barrier(2)], { filter: 'skill' }),
  ]),

  // --- Mantra (more) ---
  s('common', 'candle-vigil', 'Candle Vigil', 'skill', 1, 'none', [status('mantra', 2), draw(1)]),
  s('common', 'chanted-blow', 'Chanted Blow', 'attack', 1, 'foe', [dmg(6), status('mantra', 2)]),
  s('uncommon', 'foretold-flame', 'Foretold Flame', 'attack', 1, 'foe', [
    scaled(dmg(5), per('mantra', 1)),
    scry(2),
  ]),
  s('uncommon', 'faith-kept', 'Faith Kept', 'skill', 1, 'none', [status('mantra', 2)], {
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
    2,
    'none',
    [scaled(dmg(0, 'allFoes'), per('mantra', 1)), stance('radiant')],
    { exhaust: true },
  ),
  s('rare', 'unwavering', 'Unwavering', 'power', 2, 'none', [
    on('discard', [barrier(4), status('mantra', 1)]),
    on('exhaust', [barrier(4), status('mantra', 1)]),
  ]),
];
