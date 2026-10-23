// Sehra, the Still Flame (Aurelion). A monk of the Gilded Order's silent branch. No companions. Starts the fight in Calm.
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
  on,
  per,
  pool,
  scaled,
  scry,
  stance,
  status,
} from '../build';

const s = pool('sehra', 'aurelion');

export const SEHRA: CardDef[] = [
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

  // --- Mantra ---
  s('common', 'whispered-vow', 'Whispered Vow', 'skill', 1, 'none', [status('mantra', 3), scry(2)]),
  s('common', 'bowing-low', 'Bowing Low', 'skill', 0, 'none', [status('mantra', 2), barrier(4)]),
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
    2,
    'none',
    [stance('radiant'), status('vigor', 8), draw(2)],
    { exhaust: true },
  ),
];
