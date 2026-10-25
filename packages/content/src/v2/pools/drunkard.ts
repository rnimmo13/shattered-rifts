// DRUNKARD, the Homeless Drunk (the Midden, the rift's rubbish heap). A short, fat, bald dwarf with a hammer, a sawed-off 12 gauge and a shopping trolley of
// window panes. No companions. Three lanes:
//   Junk Traps - a few booby traps built from bottles and glass (Traps are a shared tool; Vesper still owns the most)
//   Glass      - hang panes of glass: Barrier and Thorns, then break them over someone's head
//   Shells     - Buckshot Shells (0-cost, hit EVERY enemy, consumed) and liquid courage to keep swinging
// Shells are KP's alone, the way Sleeve Knives are Quill's: a shell hits the whole room for a little, a knife one enemy.

import type { CardDef } from '@sr/combat';
import {
  addTo,
  barrier,
  discard,
  dmg,
  draw,
  forge,
  heal,
  lose,
  mana,
  manaNext,
  maxMana,
  on,
  per,
  pool,
  PREVENT,
  reclaim,
  scaled,
  scry,
  status,
} from '../build';

const p = pool('drunkard', 'midden');

export const DRUNKARD: CardDef[] = [
  // --- basics ---
  p('basic', 'hammer-swing', 'Hammer Swing', 'attack', 1, 'foe', [
    dmg(6),
    status('brittle', 1, 'target'),
  ]),
  p('basic', 'pane-up', 'Pane Up', 'skill', 1, 'none', [
    barrier(6),
    scaled(barrier(0), per('missingHp', 0.1)),
  ]),
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
  p('common', 'buckshot-shell', 'Buckshot Shell', 'attack', 0, 'none', [dmg(4, 'allFoes')], {
    exhaust: true,
    tags: ['shell'],
    source: 'token',
  }),

  // --- Junk Traps (a few Traps; Vesper has the real arsenal) ---
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
    [dmg(6, 'allFoes'), status('brittle', 1, 'allFoes')],
    { trigger: { on: 'foeTurn' } },
  ),
  p(
    'rare',
    'booby-trapped-window',
    'Booby-Trapped Window',
    'snare',
    2,
    'none',
    [PREVENT, dmg(10, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),

  // --- Glass: Barrier and Thorns ---
  p('common', 'window-pane', 'Window Pane', 'skill', 1, 'none', [
    barrier(7),
    scaled(barrier(0), per('missingHp', 0.15)),
  ]),
  p('common', 'pane-in-the-face', 'Pane in the Face', 'attack', 1, 'foe', [
    scaled(dmg(5), per('missingHp', 0.2)),
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
    scaled(barrier(0), per('missingHp', 0.2)),
  ]),
  p('uncommon', 'shatter', 'Shatter', 'attack', 2, 'foe', [scaled(dmg(8), per('missingHp', 0.3))]),
  p('uncommon', 'stained-glass', 'Stained Glass', 'power', 1, 'none', [
    on('turnStart', [barrier(3), scaled(barrier(0), per('missingHp', 0.1))]),
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
    [barrier(14), scaled(barrier(0), per('missingHp', 0.3))],
    { exhaust: true },
  ),
  p('rare', 'broken-window-theory', 'Broken Window Theory', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('missingHp', 0.2))]),
  ]),

  // --- Shells: the 12 gauge ---
  p('common', 'load-shells', 'Load Shells', 'skill', 1, 'none', [addTo('buckshot-shell', 3)]),
  p('common', 'shell-pocket', 'Shell Pocket', 'skill', 0, 'none', [addTo('buckshot-shell', 2)], {
    exhaust: true,
  }),
  p('common', 'slug-round', 'Slug Round', 'attack', 2, 'foe', [dmg(16)]),
  p('common', 'rock-salt', 'Rock Salt', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  p('uncommon', 'double-barrel', 'Double Barrel', 'attack', 2, 'foe', [dmg(9, 'target', 2)]),
  p('uncommon', 'pump-action', 'Pump Action', 'skill', 1, 'none', [
    addTo('buckshot-shell', 2),
    draw(1),
  ]),
  p('uncommon', 'shotgun-wedding', 'Shotgun Wedding', 'attack', 2, 'none', [dmg(7, 'allFoes', 2)]),
  p('uncommon', 'shell-game', 'Shell Game', 'power', 1, 'none', [
    on('turnStart', [addTo('buckshot-shell')]),
  ]),
  p('rare', 'boomstick', 'Boomstick', 'attack', 3, 'none', [
    scaled(dmg(12, 'allFoes'), per('exhausted', 3)),
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
    dmg(10, 'allFoes'),
    lose(2),
  ]),
  p('uncommon', 'dutch-courage', 'Dutch Courage', 'power', 1, 'none', [
    on('turnStart', [heal(2), status('might', 1, 'self', true)]),
  ]),
  p('uncommon', 'dumpster-dive', 'Dumpster Dive', 'skill', 1, 'none', [draw(3), discard(1)]),
  p('uncommon', 'spare-change', 'Spare Change', 'skill', 0, 'none', [mana(1), scry(2)], {
    exhaust: true,
  }),
  p('rare', 'hammer-time', 'Hammer Time', 'attack', 2, 'foe', [
    dmg(22),
    status('brittle', 2, 'target'),
  ]),
  p('rare', 'bottomless-flask', 'Bottomless Flask', 'power', 2, 'none', [
    on('turnStart', [heal(3), draw(1)]),
  ]),
  p('rare', 'pass-out', 'Pass Out', 'skill', 2, 'none', [barrier(18), heal(6)], {
    exhaust: true,
  }),

  // --- legendary ---
  p('legendary', 'one-more-round', 'One More Round', 'power', 3, 'none', [
    on('turnStart', [addTo('buckshot-shell', 3), heal(3)]),
  ]),
  p('legendary', 'the-glass-palace', 'The Glass Palace', 'power', 3, 'none', [
    on('turnStart', [barrier(6), scaled(barrier(0), per('missingHp', 0.2))]),
  ]),

  // --- the Old Twelve Gauge: a weapon that hits every enemy and gets sharper (Sharpen), with its own interactions ---
  p(
    'common',
    'old-twelve-gauge',
    'Old Twelve Gauge',
    'attack',
    1,
    'none',
    [scaled(dmg(5, 'allFoes'), per('bonus'))],
    {
      retain: true,
      tags: ['gun'],
      source: 'token',
    },
  ),
  p('common', 'rack-the-slide', 'Rack the Slide', 'skill', 1, 'none', [
    forge('old-twelve-gauge', 3),
  ]),
  p('common', 'powder-load', 'Powder Load', 'skill', 0, 'none', [forge('old-twelve-gauge', 4)], {
    exhaust: true,
  }),
  p('common', 'pistol-whip', 'Pistol Whip', 'attack', 1, 'foe', [
    dmg(6),
    forge('old-twelve-gauge', 2),
  ]),
  p('uncommon', 'glass-cover', 'Glass Cover', 'skill', 1, 'none', [
    barrier(7),
    forge('old-twelve-gauge', 2),
  ]),
  p('uncommon', 'hair-trigger', 'Hair Trigger', 'power', 1, 'none', [
    on('play', [forge('old-twelve-gauge', 1)], { tag: 'shell' }),
  ]),
  p('uncommon', 'reload', 'Reload', 'skill', 1, 'none', [forge('old-twelve-gauge', 3), draw(1)]),
  p('rare', 'extended-mag', 'Extended Mag', 'power', 2, 'none', [
    on('turnStart', [forge('old-twelve-gauge', 2), addTo('buckshot-shell')]),
  ]),
  p('rare', 'rack-and-ruin', 'Rack and Ruin', 'attack', 2, 'none', [
    dmg(10, 'allFoes'),
    forge('old-twelve-gauge', 4),
  ]),
  p('uncommon', 'gunmetal-polish', 'Gunmetal Polish', 'skill', 1, 'none', [
    forge('old-twelve-gauge', 3),
    barrier(4),
  ]),
  p('rare', 'trigger-discipline', 'Trigger Discipline', 'power', 2, 'none', [
    on('play', [forge('old-twelve-gauge', 1)], { filter: 'attack' }),
  ]),
  p('common', 'shell-shock', 'Shell Shock', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    addTo('buckshot-shell'),
  ]),

  // (more Shells)
  p('common', 'birdshot', 'Birdshot', 'attack', 0, 'none', [dmg(3, 'allFoes')], { exhaust: true }),
  p(
    'common',
    'shell-casing',
    'Shell Casing',
    'skill',
    0,
    'none',
    [addTo('buckshot-shell'), draw(1)],
    { exhaust: true },
  ),
  p('uncommon', 'slugfest', 'Slugfest', 'attack', 2, 'foe', [dmg(5, 'target', 4)]),
  p('uncommon', 'magazine', 'Magazine', 'skill', 1, 'none', [addTo('buckshot-shell', 4)], {
    exhaust: true,
  }),
  p('uncommon', 'shellshocked', 'Shellshocked', 'power', 1, 'none', [
    on('exhaust', [dmg(2, 'allFoes')]),
  ]),
  p('rare', 'fire-in-the-hole', 'Fire in the Hole', 'attack', 2, 'none', [
    scaled(dmg(6, 'allFoes'), per('exhausted', 0.5)),
  ]),
  p('rare', 'ammo-dump', 'Ammo Dump', 'skill', 2, 'none', [addTo('buckshot-shell', 8)], {
    exhaust: true,
  }),
  p('rare', 'rolling-thunder', 'Rolling Thunder', 'power', 2, 'none', [
    on('turnStart', [addTo('buckshot-shell', 2)]),
  ]),
  // (more Gun)
  p('common', 'barrel-roll', 'Barrel Roll', 'skill', 1, 'none', [
    barrier(6),
    forge('old-twelve-gauge', 2),
  ]),
  p('common', 'aim', 'Aim', 'skill', 0, 'none', [forge('old-twelve-gauge', 2)], { retain: true }),
  p('uncommon', 'scope', 'Scope', 'power', 1, 'none', [
    on('turnStart', [forge('old-twelve-gauge', 1)]),
  ]),
  p('uncommon', 'steady-hands', 'Steady Hands', 'skill', 1, 'none', [
    forge('old-twelve-gauge', 3),
    draw(1),
  ]),
  p(
    'rare',
    'ironsights',
    'Ironsights',
    'skill',
    1,
    'none',
    [forge('old-twelve-gauge', 5), addTo('buckshot-shell', 2)],
    { exhaust: true },
  ),
  p('rare', 'gunmetal-soul', 'Gunmetal Soul', 'power', 2, 'none', [
    on('turnEnd', [forge('old-twelve-gauge', 1), barrier(3)]),
  ]),
  // (more Hangover)
  p('common', 'hair-of-the-dog', 'Hair of the Dog', 'skill', 0, 'none', [
    heal(3),
    status('might', 1, 'self', true),
  ]),
  p('uncommon', 'black-out', 'Black Out', 'skill', 1, 'none', [barrier(14), lose(3)]),
  p('uncommon', 'bar-stool', 'Bar Stool', 'attack', 1, 'foe', [
    scaled(dmg(10), per('missingHp', 0.2)),
  ]),
  p('uncommon', 'liquid-dinner', 'Liquid Dinner', 'skill', 1, 'none', [heal(8), draw(1)]),
  p('rare', 'last-orders', 'Last Orders', 'attack', 2, 'none', [
    scaled(dmg(8, 'allFoes'), per('missingHp', 0.3)),
  ]),
  p('rare', 'rock-bottom', 'Rock Bottom', 'power', 2, 'none', [
    status('might', 2),
    on('turnStart', [lose(1)]),
  ]),
  p('rare', 'whiskey-miracle', 'Whiskey Miracle', 'skill', 1, 'none', [heal(15)], {
    exhaust: true,
  }),

  p('uncommon', 'liquid-lunch', 'Liquid Lunch', 'skill', 0, 'none', [mana(2), manaNext(-1)], {
    exhaust: true,
  }),
  p('rare', 'last-call', 'Last Call', 'skill', 2, 'none', [maxMana(1), heal(6)], { exhaust: true }),
  // --- Junk Traps (more) ---
  p(
    'uncommon',
    'rusty-nail-board',
    'Rusty Nail Board',
    'snare',
    1,
    'none',
    [dmg(5, 'allFoes'), status('faltering', 1, 'allFoes')],
    { trigger: { on: 'foeTurn' } },
  ),
  p(
    'uncommon',
    'trolley-barricade',
    'Trolley Barricade',
    'snare',
    1,
    'none',
    [barrier(12), dmg(10, 'attacker')],
    { trigger: { on: 'hpLost', min: 6 } },
  ),
  p(
    'rare',
    'molotov-cocktail',
    'Molotov Cocktail',
    'snare',
    1,
    'none',
    [dmg(12, 'allFoes'), status('brittle', 1, 'allFoes')],
    { trigger: { on: 'foeSummons' } },
  ),

  // --- Glass (more) ---
  p('common', 'sheet-of-glass', 'Sheet of Glass', 'skill', 1, 'none', [
    barrier(6),
    status('thorns', 2),
  ]),
  p('common', 'splinters', 'Splinters', 'attack', 1, 'foe', [scaled(dmg(3), per('thorns', 2))]),
  p('uncommon', 'glass-underfoot', 'Glass Underfoot', 'power', 1, 'none', [
    on('turnStart', [status('thorns', 2)]),
  ]),
  p('rare', 'glass-jaw', 'Glass Jaw', 'power', 1, 'none', [
    on('loseHp', [dmg(4, 'allFoes'), barrier(3)]),
  ]),

  // --- Shells (more) ---
  p('uncommon', 'sawn-off', 'Sawn-Off', 'attack', 1, 'none', [dmg(7, 'allFoes'), lose(2)]),
  p('uncommon', 'tin-can-alley', 'Tin Can Alley', 'attack', 1, 'none', [dmg(3, 'allFoes', 3)]),
  p('uncommon', 'pick-up-the-brass', 'Pick Up the Brass', 'skill', 1, 'none', [reclaim(2)], {
    exhaust: true,
  }),
  p('rare', 'hot-brass', 'Hot Brass', 'power', 1, 'none', [
    on('exhaust', [barrier(2), forge('old-twelve-gauge', 1)]),
  ]),
  p('rare', 'spray-and-pray', 'Spray and Pray', 'attack', 2, 'none', [
    scaled(dmg(4, 'allFoes'), per('created', 0.25)),
  ]),

  // --- liquid courage (more) ---
  p('common', 'chaser', 'Chaser', 'skill', 0, 'none', [lose(2), mana(1), draw(1)], {
    exhaust: true,
  }),
  p('uncommon', 'bar-tab', 'Bar Tab', 'skill', 0, 'none', [draw(2), manaNext(-1)], {
    exhaust: true,
  }),
  p('rare', 'mean-drunk', 'Mean Drunk', 'power', 2, 'none', [on('loseHp', [status('might', 1)])]),
];
