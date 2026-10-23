// KP, the Homeless Drunk (Nexus-9). A short, fat, bald dwarf with a hammer, a sawed-off 12 gauge and a shopping trolley of
// window panes. No companions. Three lanes:
//   Junk Traps - a few booby traps built from bottles and glass (Snares are a shared tool; Vesper still owns the most)
//   Glass      - hang panes of glass: Barrier and Thorns, then break them over someone's head
//   Shells     - Buckshot Shells (0-cost, hit EVERY enemy, consumed) and liquid courage to keep swinging
// Shells are KP's alone, the way Sleeve Knives are Quill's: a shell hits the whole room for a little, a knife one enemy.

import type { CardDef } from '@sr/combat';
import {
  PREVENT,
  addTo,
  barrier,
  dmg,
  draw,
  heal,
  lose,
  mana,
  on,
  per,
  pool,
  scaled,
  scry,
  status,
  discard,
} from '../build';

const p = pool('kp', 'nexus');

export const KP: CardDef[] = [
  // --- basics ---
  p('basic', 'hammer-swing', 'Hammer Swing', 'attack', 1, 'foe', [
    dmg(6),
    status('brittle', 1, 'target'),
  ]),
  p('basic', 'pane-up', 'Pane Up', 'skill', 1, 'none', [barrier(6), status('thorns', 1)]),
  p(
    'basic',
    'bottle-tripwire',
    'Bottle Tripwire',
    'snare',
    1,
    'none',
    [dmg(7, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  // the token every shell card makes
  p('common', 'buckshot-shell', 'Buckshot Shell', 'attack', 0, 'none', [dmg(5, 'allFoes')], {
    exhaust: true,
    tags: ['shell'],
    source: 'token',
  }),

  // --- Junk Traps (a few Snares; Vesper has the real arsenal) ---
  p(
    'common',
    'glass-trap',
    'Glass Trap',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('brittle', 2, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  p(
    'uncommon',
    'pit-of-bottles',
    'Pit of Bottles',
    'snare',
    1,
    'none',
    [dmg(8, 'allFoes'), status('brittle', 1, 'allFoes')],
    { trigger: { on: 'foeTurn' } },
  ),
  p(
    'rare',
    'booby-trapped-window',
    'Booby-Trapped Window',
    'snare',
    2,
    'none',
    [PREVENT, dmg(14, 'attacker'), status('stunned', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),

  // --- Glass: Barrier and Thorns ---
  p('common', 'window-pane', 'Window Pane', 'skill', 1, 'none', [barrier(7), status('thorns', 1)]),
  p('common', 'pane-in-the-face', 'Pane in the Face', 'attack', 1, 'foe', [
    scaled(dmg(5), per('thorns', 2)),
  ]),
  p('common', 'shard-toss', 'Shard Toss', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    status('brittle', 1, 'allFoes'),
  ]),
  p('common', 'broken-bottle', 'Broken Bottle', 'attack', 1, 'foe', [
    dmg(7),
    status('exposed', 1, 'target'),
  ]),
  p('common', 'sob-story', 'Sob Story', 'skill', 1, 'none', [barrier(4), draw(2)]),
  p('uncommon', 'double-glazing', 'Double Glazing', 'skill', 2, 'none', [
    barrier(12),
    status('thorns', 2),
  ]),
  p('uncommon', 'shatter', 'Shatter', 'attack', 2, 'foe', [scaled(dmg(7), per('thorns', 3))]),
  p('uncommon', 'stained-glass', 'Stained Glass', 'power', 1, 'none', [
    on('turnStart', [status('thorns', 1), barrier(2)]),
  ]),
  p('uncommon', 'glazier', 'Glazier', 'power', 1, 'none', [
    on('play', [barrier(3)], { filter: 'skill' }),
  ]),
  p(
    'rare',
    'panorama-window',
    'Panorama Window',
    'skill',
    2,
    'none',
    [barrier(14), status('thorns', 3)],
    { exhaust: true },
  ),
  p('rare', 'broken-window-theory', 'Broken Window Theory', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('thorns', 1))]),
  ]),

  // --- Shells: the 12 gauge ---
  p('common', 'load-shells', 'Load Shells', 'skill', 1, 'none', [addTo('buckshot-shell', 3)]),
  p('common', 'shell-pocket', 'Shell Pocket', 'skill', 0, 'none', [addTo('buckshot-shell', 2)], {
    exhaust: true,
  }),
  p('common', 'twelve-gauge', 'Twelve Gauge', 'attack', 2, 'foe', [dmg(16)]),
  p('common', 'rock-salt', 'Rock Salt', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  p('uncommon', 'double-barrel', 'Double Barrel', 'attack', 2, 'foe', [dmg(9, 'target', 2)]),
  p('uncommon', 'pump-action', 'Pump Action', 'skill', 1, 'none', [
    addTo('buckshot-shell', 2),
    draw(1),
  ]),
  p('uncommon', 'shotgun-wedding', 'Shotgun Wedding', 'attack', 2, 'none', [dmg(6, 'allFoes', 2)]),
  p('uncommon', 'shell-game', 'Shell Game', 'power', 1, 'none', [
    on('turnStart', [addTo('buckshot-shell')]),
  ]),
  p('rare', 'boomstick', 'Boomstick', 'attack', 3, 'none', [
    scaled(dmg(10, 'allFoes'), per('exhausted', 1)),
  ]),
  p(
    'rare',
    'last-shell',
    'The Last Shell',
    'attack',
    2,
    'foe',
    [dmg(24), status('exposed', 1, 'target')],
    { exhaust: true, retain: true },
  ),

  // --- liquid courage ---
  p('common', 'swig', 'Swig', 'skill', 0, 'none', [heal(4), status('might', 2, 'self', true)], {
    exhaust: true,
  }),
  p('common', 'liquid-courage', 'Liquid Courage', 'skill', 1, 'none', [
    barrier(5),
    status('vigor', 6),
  ]),
  p('common', 'drunken-swing', 'Drunken Swing', 'attack', 1, 'foe', [
    dmg(12),
    status('faltering', 1),
  ]),
  p('uncommon', 'barroom-brawl', 'Barroom Brawl', 'attack', 2, 'none', [
    dmg(9, 'allFoes'),
    lose(3),
  ]),
  p('uncommon', 'dutch-courage', 'Dutch Courage', 'power', 1, 'none', [
    on('turnStart', [heal(2), status('might', 1, 'self', true)]),
  ]),
  p('uncommon', 'dumpster-dive', 'Dumpster Dive', 'skill', 1, 'none', [draw(3), discard(1)]),
  p('uncommon', 'spare-change', 'Spare Change', 'skill', 0, 'none', [draw(1), mana(1), scry(2)], {
    exhaust: true,
  }),
  p('rare', 'hammer-time', 'Hammer Time', 'attack', 2, 'foe', [
    dmg(22),
    status('brittle', 2, 'target'),
  ]),
  p('rare', 'bottomless-flask', 'Bottomless Flask', 'power', 2, 'none', [
    on('turnStart', [heal(3), draw(1)]),
  ]),
  p('rare', 'pass-out', 'Pass Out', 'skill', 2, 'none', [barrier(22), heal(8)], {
    exhaust: true,
  }),

  // --- legendary ---
  p('legendary', 'one-more-round', 'One More Round', 'power', 3, 'none', [
    on('turnStart', [addTo('buckshot-shell', 3), heal(3)]),
  ]),
  p('legendary', 'the-glass-palace', 'The Glass Palace', 'power', 3, 'none', [
    status('thorns', 6),
    on('turnStart', [barrier(8)]),
  ]),
];
