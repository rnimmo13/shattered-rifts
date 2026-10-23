// Vesper Nightlace (Umbral). No companions. Three lanes:
//   Snares  - set traps with different triggers; payoffs for having them out
//   Exposed - mark the enemy, then spend the mark
//   Bluff   - hold Mana and cards back: Retain, Scry, patience

import type { CardDef } from '@sr/combat';
import {
  addTo,
  barrier,
  dmg,
  draw,
  lose,
  mana,
  manaNext,
  on,
  per,
  pool,
  PREVENT,
  scaled,
  scry,
  status,
} from '../build';

const v = pool('vesper', 'umbral');

export const VESPER: CardDef[] = [
  // --- basics ---
  v('basic', 'veil-strike', 'Veil Strike', 'attack', 1, 'foe', [
    dmg(6),
    status('exposed', 1, 'target'),
  ]),
  v(
    'basic',
    'set-the-web',
    'Set the Web',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),

  // --- Snares ---
  v('common', 'trip-line', 'Trip Line', 'snare', 0, 'none', [dmg(6, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  v(
    'common',
    'hollow-snare',
    'Hollow Snare',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  v(
    'common',
    'whisper-net',
    'Whisper Net',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('stunned', 1, 'attacker')],
    { trigger: { on: 'foeSummons' } },
  ),
  v(
    'common',
    'cage',
    'Cage',
    'snare',
    1,
    'none',
    [dmg(10, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'foeDefends' } },
  ),
  v('common', 'snare-kit', 'Snare Kit', 'skill', 1, 'none', [addTo('trip-line', 2)], {
    exhaust: true,
  }),
  v(
    'uncommon',
    'mirror-veil',
    'Mirror Veil',
    'snare',
    2,
    'none',
    [PREVENT, status('faltering', 2, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  v('uncommon', 'pain-link', 'Pain Link', 'snare', 0, 'none', [dmg(6, 'allFoes')], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  v('uncommon', 'time-bomb', 'Time Bomb', 'snare', 1, 'none', [dmg(9, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
  v('uncommon', 'spring-loaded', 'Spring-Loaded', 'skill', 1, 'none', [
    scaled(barrier(0), per('snares', 5)),
  ]),
  v('uncommon', 'master-trapper', 'Master Trapper', 'power', 1, 'none', [
    on('play', [draw(1)], { filter: 'snare' }),
  ]),
  v(
    'rare',
    'bait-and-switch',
    'Bait and Switch',
    'snare',
    2,
    'none',
    [PREVENT, dmg(12, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  v(
    'rare',
    'silencing-snare',
    'Silencing Snare',
    'snare',
    2,
    'none',
    [status('stunned', 1, 'attacker'), status('shielded', 1)],
    { trigger: { on: 'attacked' } },
  ),
  v('rare', 'echo-trap', 'Echo Trap', 'power', 2, 'none', [on('snare', [barrier(5), draw(1)])]),

  // --- Exposed ---
  v('common', 'mark-prey', 'Mark Prey', 'skill', 0, 'foe', [status('exposed', 2, 'target')]),
  v('common', 'unmask', 'Unmask', 'skill', 1, 'none', [status('exposed', 2, 'allFoes')]),
  v('common', 'exploit-weakness', 'Exploit Weakness', 'attack', 1, 'foe', [
    scaled(dmg(5), per('exposed', 3, 'target')),
  ]),
  v('common', 'tear-the-veil', 'Tear the Veil', 'skill', 1, 'none', [
    status('exposed', 1, 'allFoes'),
    draw(1),
  ]),
  v('common', 'ambush', 'Ambush', 'attack', 2, 'foe', [dmg(14), status('exposed', 1, 'target')]),
  v('common', 'veil-dance', 'Veil Dance', 'skill', 1, 'none', [
    status('faltering', 1, 'allFoes'),
    barrier(5),
  ]),
  v('uncommon', 'death-mark', 'Death Mark', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 3, 'target'),
  ]),
  v('uncommon', 'shadow-volley', 'Shadow Volley', 'attack', 1, 'none', [dmg(4, 'randomFoe', 3)]),
  v('uncommon', 'spotlight', 'Spotlight', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('faltering', 1, 'target'),
  ]),
  v('rare', 'coup-de-grace', 'Coup de Grace', 'attack', 3, 'foe', [
    scaled(dmg(16), per('exposed', 6, 'target')),
  ]),

  // --- Bluff ---
  v('common', 'cold-read', 'Cold Read', 'skill', 0, 'none', [scry(4)]),
  v('common', 'patient-blade', 'Patient Blade', 'attack', 1, 'foe', [dmg(9)], { retain: true }),
  v('common', 'shadow-cloak', 'Shadow Cloak', 'skill', 1, 'none', [barrier(6), draw(1)]),
  v('common', 'dark-study', 'Dark Study', 'skill', 1, 'none', [draw(2)]),
  v('uncommon', 'banked-breath', 'Banked Breath', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('mana', 2))]),
  ]),
  v('uncommon', 'stolen-moment', 'Stolen Moment', 'skill', 0, 'none', [mana(1), draw(1), scry(2)], {
    exhaust: true,
  }),
  v('uncommon', 'shadow-step', 'Shadow Step', 'skill', 1, 'none', [barrier(7)], { retain: true }),
  v('uncommon', 'cold-bargain', 'Cold Bargain', 'skill', 0, 'none', [lose(3), mana(1), draw(1)], {
    exhaust: true,
  }),
  v('rare', 'long-game', 'The Long Game', 'power', 2, 'none', [on('turnStart', [draw(1)])]),
  v('uncommon', 'spare-traps', 'Spare Traps', 'skill', 0, 'none', [addTo('trip-line'), draw(1)], {
    exhaust: true,
  }),
  v('rare', 'gleeful-trapsmith', 'Gleeful Trapsmith', 'power', 1, 'none', [
    on('play', [dmg(4, 'allFoes')], { filter: 'snare' }),
  ]),
  v('common', 'break-the-guard', 'Break the Guard', 'skill', 1, 'foe', [
    status('brittle', 3, 'target'),
    status('exposed', 1, 'target'),
  ]),
  v('uncommon', 'mask-of-faces', 'Mask of Faces', 'skill', 1, 'none', [status('steadfast', 2)]),
  v('uncommon', 'marked-cards', 'Marked Cards', 'power', 1, 'none', [
    on('discard', [dmg(3, 'randomFoe')]),
  ]),
  v('rare', 'between-worlds', 'Between Worlds', 'skill', 2, 'none', [status('ghostly', 2)], {
    exhaust: true,
  }),
  v(
    'legendary',
    'the-perfect-trap',
    'The Perfect Trap',
    'snare',
    3,
    'none',
    [PREVENT, dmg(22, 'attacker'), status('stunned', 1, 'attacker'), status('shielded', 2)],
    { trigger: { on: 'attacked' } },
  ),
  v('legendary', 'masquerade', 'Masquerade', 'power', 2, 'none', [
    on('snare', [draw(2), mana(1), dmg(4, 'allFoes')]),
  ]),
  v('uncommon', 'saved-breath', 'Saved Breath', 'skill', 0, 'none', [manaNext(2), scry(2)], {
    exhaust: true,
  }),
];
