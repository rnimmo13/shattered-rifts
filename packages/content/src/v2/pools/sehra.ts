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
  s('basic', 'eruption', 'Eruption', 'attack', 1, 'foe', [dmg(8), stance('wrath')]),
  s('basic', 'vigilance', 'Vigilance', 'skill', 1, 'none', [barrier(7), stance('calm')]),

  // --- Wrath ---
  s('common', 'flurry-of-blows', 'Flurry of Blows', 'attack', 0, 'foe', [dmg(3)]),
  s('common', 'wallop', 'Wallop', 'attack', 1, 'foe', [scaled(dmg(7), per('wrath', 6))]),
  s('common', 'battle-cry', 'Battle Cry', 'skill', 0, 'none', [stance('wrath'), draw(1)]),
  s('common', 'ashen-fist', 'Ashen Fist', 'attack', 2, 'foe', [dmg(14), stance('wrath')]),
  s('uncommon', 'tantrum', 'Tantrum', 'attack', 1, 'foe', [dmg(3, 'target', 3), stance('wrath')]),
  s('uncommon', 'crescendo', 'Crescendo', 'skill', 0, 'none', [stance('wrath')], {
    retain: true,
    exhaust: true,
  }),
  s('uncommon', 'swift-step', 'Swift Step', 'skill', 1, 'none', [stance('wrath'), draw(1)]),
  s('uncommon', 'reckoning', 'Reckoning', 'attack', 2, 'foe', [scaled(dmg(10), per('wrath', 8))]),
  s('uncommon', 'rushdown', 'Rushdown', 'power', 1, 'none', [
    on('stance', [draw(2)], { stance: 'wrath' }),
  ]),
  s('rare', 'rage-of-ages', 'Rage of Ages', 'attack', 3, 'none', [dmg(5, 'randomFoe', 5)]),
  s('rare', 'wrath-incarnate', 'Wrath Incarnate', 'power', 2, 'none', [
    on('turnStart', [stance('wrath')]),
  ]),

  // --- Calm ---
  s('common', 'meditate', 'Meditate', 'skill', 1, 'none', [draw(2), stance('calm')]),
  s('common', 'empty-body', 'Empty Body', 'skill', 1, 'none', [barrier(7), stance('none')]),
  s('common', 'empty-fist', 'Empty Fist', 'attack', 1, 'foe', [dmg(9), stance('none')]),
  s('common', 'third-eye', 'Third Eye', 'skill', 1, 'none', [barrier(7), scry(3)]),
  s('common', 'cut-through-fate', 'Cut Through Fate', 'attack', 1, 'foe', [dmg(7), scry(2), draw(1)]),
  s('uncommon', 'inner-peace', 'Inner Peace', 'skill', 1, 'none', [
    scaled(draw(0), per('calm', 3)),
    stance('calm'),
  ]),
  s('uncommon', 'breathe', 'Breathe', 'skill', 1, 'none', [stance('calm'), barrier(5)]),
  s('uncommon', 'tranquility', 'Tranquility', 'skill', 0, 'none', [stance('calm')], {
    retain: true,
    exhaust: true,
  }),
  s('uncommon', 'like-water', 'Like Water', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('calm', 5))]),
  ]),
  s('uncommon', 'mental-fortress', 'Mental Fortress', 'power', 1, 'none', [
    on('stance', [barrier(4)]),
  ]),
  s('rare', 'deva-form', 'Deva Form', 'power', 2, 'none', [on('turnStart', [mana(1)])]),
  s('rare', 'serenity', 'Serenity', 'skill', 2, 'none', [barrier(12), stance('calm'), draw(1)]),

  // --- Mantra ---
  s('common', 'pray', 'Pray', 'skill', 1, 'none', [status('mantra', 3), scry(2)]),
  s('common', 'prostrate', 'Prostrate', 'skill', 0, 'none', [status('mantra', 2), barrier(4)]),
  s('common', 'devout-strike', 'Devout Strike', 'attack', 1, 'foe', [dmg(7), status('mantra', 1)]),
  s('common', 'shield-of-faith', 'Shield of Faith', 'skill', 1, 'none', [
    barrier(7),
    status('mantra', 1),
  ]),
  s('common', 'sunlit-blade', 'Sunlit Blade', 'attack', 1, 'foe', [dmg(9), scry(2)]),
  s('uncommon', 'worship', 'Worship', 'skill', 2, 'none', [status('mantra', 5)], { retain: true }),
  s('uncommon', 'litany', 'Litany', 'power', 2, 'none', [
    on('play', [status('mantra', 1)], { filter: 'skill' }),
  ]),
  s('rare', 'devotion', 'Devotion', 'power', 1, 'none', [on('turnStart', [status('mantra', 2)])]),
  s('rare', 'ascension', 'Ascension', 'skill', 2, 'none', [stance('radiant')], { exhaust: true }),
  s('uncommon', 'martyrs-vow', "Martyr's Vow", 'skill', 0, 'none', [lose(3), status('mantra', 3)]),
];
