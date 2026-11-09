// DRUNKARD, the Homeless Drunk (the Midden, the rift's rubbish heap). A short, fat, bald dwarf with a hammer, a sawed-off 12 gauge and a shopping trolley of
// window panes. No companions. Three themes:
//   Gun        - the Old Twelve Gauge: it hits every enemy, and Precision cards (its Sharpen) make it hit harder for the fight
//   Shells     - Buckshot Shells (0-cost, hit EVERY enemy, consumed) and a few junk Traps
//   Hangover   - drink now, pay tomorrow: drinks leave Hangover (HP lost next turn), payoffs grow with it, heals grow with missing HP
// Shells are KP's alone, the way Sleeve Knives are Quill's: a shell hits the whole room for a little, a knife one enemy.

import type { CardDef, Op } from '@sr/combat';
import {
  addTo,
  barrier,
  discard,
  doubleSt,
  dmg,
  draw,
  forge,
  heal,
  lose,
  mana,
  on,
  per,
  pool,
  reclaim,
  scry,
  scaled,
  status,
  PREVENT,
} from '../build';

/** (DECISIONS #434) damage to every enemy equal to the HP he just lost (to his own cards or Hangover), at most `cap` */
const hurtBack = (cap: number): Op =>
  ({ ...dmg(0, 'allFoes'), scale: { by: 'hpLostNow', max: cap } }) as Op;
/** Might until the end of his turn: 1 for every 2 HP he just lost, at most `cap` */
const hurtMight = (cap: number): Op =>
  ({ ...status('might', 0, 'self', true), scale: { by: 'hpLostNow', mult: 0.5, max: cap } }) as Op;

const p = pool('drunkard', 'midden');
/** a card that fires the gun (DECISIONS #681): The Twelve-Gauge Opera and Gun Oil answer it, and it shows a gun badge */
const GUN = { tags: ['gun'] };
/** a drink's price: 1% of Max HP per stack at the start of your next turn (DECISIONS #354, #502) */
const hangover = (n: number): Op => status('hangover', n);
/** clear your Hangover */
const soberUp: Op = doubleSt('hangover', 'self', 0);

export const DRUNKARD: CardDef[] = [
  // --- basics ---
  p(
    'basic',
    'hammer-swing',
    'Hammer Swing',
    'attack',
    1,
    'foe',
    // (7 since #695: ~84%; upgraded 9, +26%)
    [dmg(7), status('brittle', 1, 'target')],
    { up: { effects: [dmg(9), status('brittle', 1, 'target')] } },
  ),
  p('basic', 'pane-up', 'Pane Up', 'skill', 1, 'none', [
    scaled(barrier(5), per('missingPct', 1 / 11)),
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
    // (a shell is fired from the gun: it counts as both, DECISIONS #681)
    tags: ['shell', 'gun'],
    source: 'token',
    // (+2, not the usual +3: six of them from an Ammo Dump+ would otherwise be 42 to every enemy for 2 Mana)
    up: { effects: [dmg(6, 'allFoes')] },
  }),

  // --- Junk Traps (a few Traps; Vesper has the real arsenal) ---

  // --- Glass: Barrier and Thorns ---
  p(
    'common',
    'shard-toss',
    'Shard Toss',
    'attack',
    1,
    'none',
    // (7 to all since #695: ~88%; upgraded 9)
    [dmg(7, 'allFoes'), status('brittle', 1, 'allFoes')],
    { up: { effects: [dmg(9, 'allFoes'), status('brittle', 1, 'allFoes')] } },
  ),
  p('uncommon', 'shatter', 'Smash the Pane', 'attack', 2, 'foe', [
    scaled(dmg(12), per('missingPct', 1 / 4)),
  ]),

  // --- Shells: the 12 gauge ---
  // (two, not three: a Shell is a free card that hits every enemy, DECISIONS #393)
  p('common', 'load-shells', 'Load Shells', 'skill', 1, 'none', [addTo('buckshot-shell', 2)]),
  // (19 since #695: ~84%; upgraded 24)
  p('common', 'slug-round', 'Slug Round', 'attack', 2, 'foe', [dmg(19)], {
    ...GUN,
    up: { effects: [dmg(24)] },
  }),
  p(
    'uncommon',
    'pump-action',
    'Pump Action',
    'skill',
    1,
    'none',
    [addTo('buckshot-shell', 2), draw(1)],
    // (upgraded draw 2 since #695: a third Shell was +39%)
    { up: { effects: [addTo('buckshot-shell', 2), draw(2)] } },
  ),
  p(
    'uncommon',
    'shotgun-wedding',
    'Shotgun Wedding',
    'attack',
    2,
    'none',
    // (8 x 2 since #695: ~85%; upgraded 10 x 2)
    [dmg(8, 'allFoes', 2)],
    { ...GUN, up: { effects: [dmg(10, 'allFoes', 2)] } },
  ),
  p(
    'uncommon',
    'shell-game',
    'Shell Game',
    'power',
    1,
    'none',
    [on('turnStart', [addTo('buckshot-shell')])],
    { up: { innate: true } },
  ),
  p(
    'rare',
    'boomstick',
    'Boomstick',
    'attack',
    3,
    'none',
    // (22 to all + 2 a card consumed since #695: ~97%; ~126%; upgraded 30 + 2)
    [scaled(dmg(22, 'allFoes'), per('exhausted', 2))],
    { ...GUN, up: { effects: [scaled(dmg(30, 'allFoes'), per('exhausted', 2))] } },
  ),
  p(
    'rare',
    'last-shell',
    'The Last Shell',
    'attack',
    2,
    'foe',
    // (32 and 2 Exposed since #695: ~98%; ~135%; upgraded 42)
    [dmg(32), status('exposed', 2, 'target')],
    {
      exhaust: true,
      retain: true,
      ...GUN,
      up: { effects: [dmg(42), status('exposed', 2, 'target')] },
    },
  ),

  // --- liquid courage ---

  // --- legendary ---
  p(
    'rare',
    'one-more-round',
    'One More Round',
    'power',
    3,
    'none',
    // (3 Shells since #695: ~107%; ~134%; upgraded heal 6)
    [on('turnStart', [addTo('buckshot-shell', 3), heal(3)])],
    { up: { effects: [on('turnStart', [addTo('buckshot-shell', 3), heal(6)])] } },
  ),
  // Hangover: Barrier that grows as you hurt, and every wound you deal yourself (a Hangover too) cuts every enemy (DECISIONS #338, #354)
  p(
    'rare',
    'the-glass-palace',
    'The Glass Palace',
    'power',
    3,
    'none',
    // (4 Barrier and up to 6 since #695: ~124%; ~132%; upgraded up to 8)
    [on('turnStart', [scaled(barrier(4), per('missingPct', 1 / 6))]), on('loseHp', [hurtBack(6)])],
    {
      up: {
        effects: [
          on('turnStart', [scaled(barrier(4), per('missingPct', 1 / 6))]),
          on('loseHp', [hurtBack(8)]),
        ],
      },
    },
  ),

  // --- the Old Twelve Gauge: a weapon that hits every enemy and gets sharper (Sharpen), with its own interactions ---
  p(
    'common',
    'old-twelve-gauge',
    'Old Twelve Gauge',
    'attack',
    1,
    'none',
    // Point Blank (DECISIONS #247): against a single enemy the spread all lands, 25% more
    [{ ...scaled(dmg(5, 'allFoes'), per('bonus')), lonePct: 25 } as Op],
    {
      retain: true,
      // (a card of his starting deck since DECISIONS #436, always in the opening hand)
      innate: true,
      tags: ['gun'],
      source: 'token',
      // (his Sharpen is called Precision: its own stat, never the Obsidian Blade's, DECISIONS #400)
      forgeWord: 'Precision',
      weapon: true,
    },
  ),
  p('common', 'rack-the-slide', 'Rack the Slide', 'skill', 1, 'none', [
    forge('old-twelve-gauge', 4),
  ]),
  p('common', 'powder-load', 'Powder Load', 'skill', 0, 'none', [forge('old-twelve-gauge', 3)], {
    exhaust: true,
    up: { effects: [forge('old-twelve-gauge', 4)] },
  }),
  p(
    'common',
    'pistol-whip',
    'Pistol Whip',
    'attack',
    1,
    'foe',
    [dmg(6), forge('old-twelve-gauge', 2)],
    { up: { effects: [dmg(9), forge('old-twelve-gauge', 2)] } },
  ),
  p(
    'uncommon',
    'glass-cover',
    'Glass Cover',
    'skill',
    1,
    'none',
    [barrier(7), forge('old-twelve-gauge', 2)],
    // (upgraded 3 Precision since #695: 4 was +37%)
    { up: { effects: [barrier(7), forge('old-twelve-gauge', 3)] } },
  ),
  p(
    'uncommon',
    'hair-trigger',
    'Hair Trigger',
    'power',
    1,
    'none',
    [on('play', [forge('old-twelve-gauge', 1)], { tag: 'shell' })],
    { up: { innate: true } },
  ),
  // (upgraded 4 since #695: 5 was +48%)
  p('uncommon', 'reload', 'Reload', 'skill', 1, 'none', [forge('old-twelve-gauge', 3), draw(1)], {
    up: { effects: [forge('old-twelve-gauge', 4), draw(1)] },
  }),
  p(
    'rare',
    'extended-mag',
    'Extended Mag',
    'power',
    2,
    'none',
    // (3 Precision since #695: ~108%; ~133%; upgraded Opening hand)
    [on('turnStart', [forge('old-twelve-gauge', 3), addTo('buckshot-shell')])],
    { up: { innate: true } },
  ),
  // (12 to all and 6 Precision since #695: ~97%; ~129%; upgraded 14 and 8)
  p(
    'rare',
    'rack-and-ruin',
    'Rack and Ruin',
    'attack',
    2,
    'none',
    [dmg(12, 'allFoes'), forge('old-twelve-gauge', 6)],
    {
      up: { effects: [dmg(14, 'allFoes'), forge('old-twelve-gauge', 8)] },
    },
  ),
  p(
    'rare',
    'trigger-discipline',
    'Trigger Discipline',
    'power',
    1,
    'none',
    // (and 1 Barrier an Attack since #695: ~100%; ~148%)
    [on('play', [forge('old-twelve-gauge', 1), barrier(1)], { filter: 'attack' })],
    { up: { innate: true } },
  ),
  p(
    'common',
    'shell-shock',
    'Shell Shock',
    'attack',
    1,
    'none',
    [dmg(3, 'allFoes'), addTo('buckshot-shell')],
    GUN,
  ),

  // (more Shells)
  // (6 x 4 since #695: ~85%; upgraded 7 x 4)
  p('uncommon', 'slugfest', 'Slugfest', 'attack', 2, 'foe', [dmg(6, 'target', 4)], {
    up: { effects: [dmg(7, 'target', 4)] },
  }),
  p(
    'uncommon',
    'shellshocked',
    'Shellshocked',
    'power',
    1,
    'none',
    [on('exhaust', [dmg(2, 'allFoes')])],
    // (upgraded Opening hand since #695: 3 was +50%)
    { up: { innate: true } },
  ),
  p(
    'rare',
    'fire-in-the-hole',
    'Fire in the Hole',
    'attack',
    2,
    'none',
    // (16 + 1.5 a card consumed since #695: ~99%; ~137%; upgraded 20 + 2)
    [scaled(dmg(16, 'allFoes'), per('exhausted', 1.5))],
    { up: { effects: [scaled(dmg(20, 'allFoes'), per('exhausted', 2))] } },
  ),
  // (six shells, not eight (Robert, 2026-10-26); upgraded, the same six, each one upgraded)
  // (7 Shells and draw 1 since #695: ~105%, upgraded Shells+ was +50%; ~133%; upgraded 9 Shells)
  p('rare', 'ammo-dump', 'Ammo Dump', 'skill', 2, 'none', [addTo('buckshot-shell', 7), draw(1)], {
    exhaust: true,
    up: { effects: [addTo('buckshot-shell', 9), draw(1)] },
  }),
  // (Opening hand since #695: ~110%; ~137%; upgraded it costs 1)
  p(
    'rare',
    'rolling-thunder',
    'Rolling Thunder',
    'power',
    2,
    'none',
    [on('turnStart', [addTo('buckshot-shell', 2)])],
    {
      innate: true,
      up: { cost: 1 },
    },
  ),
  // (more Gun)
  p('common', 'aim', 'Aim', 'skill', 0, 'none', [forge('old-twelve-gauge', 2)], { retain: true }),
  p(
    'uncommon',
    'scope',
    'Scope',
    'power',
    1,
    'none',
    [on('turnStart', [forge('old-twelve-gauge', 2)])],
    { up: { effects: [on('turnStart', [forge('old-twelve-gauge', 3)])] } },
  ),
  p(
    'rare',
    'ironsights',
    'Ironsights',
    'skill',
    1,
    'none',
    // (4 Precision since #695: ~115%; ~131%; upgraded 3 Shells)
    [forge('old-twelve-gauge', 4), addTo('buckshot-shell', 2)],
    { exhaust: true, up: { effects: [forge('old-twelve-gauge', 4), addTo('buckshot-shell', 3)] } },
  ),
  p(
    'rare',
    'gunmetal-soul',
    'Gunmetal Soul',
    'power',
    1,
    'none',
    // (4 Barrier since #695: ~122%; ~146%; upgraded 6)
    [on('turnEnd', [forge('old-twelve-gauge', 1), barrier(4)])],
    { up: { effects: [on('turnEnd', [forge('old-twelve-gauge', 1), barrier(6)])] } },
  ),
  p('uncommon', 'bar-stool', 'Bar Stool', 'attack', 1, 'foe', [
    scaled(dmg(7), per('missingPct', 1 / 6)),
  ]),
  // (14 + 1 per 3% missing since #695: ~85%; ~131%; upgraded 18 + 0.4 a %)
  p(
    'rare',
    'last-orders',
    'Last Orders',
    'attack',
    2,
    'none',
    [scaled(dmg(14, 'allFoes'), per('missingPct', 1 / 3))],
    {
      up: { effects: [scaled(dmg(18, 'allFoes'), per('missingPct', 0.4))] },
    },
  ),

  // --- Junk Traps (more) ---
  p(
    'uncommon',
    'rusty-nail-board',
    'Rusty Nail Board',
    'snare',
    1,
    'none',
    // (7 to all since #695: ~88%; upgraded 9)
    [dmg(7, 'allFoes'), status('faltering', 1, 'allFoes')],
    {
      trigger: { on: 'foeTurn' },
      up: { effects: [dmg(9, 'allFoes'), status('faltering', 1, 'allFoes')] },
    },
  ),
  p(
    'uncommon',
    'molotov-cocktail',
    'Molotov Cocktail',
    'snare',
    0,
    'none',
    [dmg(12, 'allFoes'), status('brittle', 1, 'allFoes')],
    { trigger: { on: 'foeSummons' } },
  ),

  // --- Glass (more) ---
  p(
    'rare',
    'glass-jaw',
    'Glass Jaw',
    'power',
    2,
    'none',
    // (up to 7 and 3 Barrier since #695: ~120%; ~132%; upgraded 9 and 4)
    [on('loseHp', [hurtBack(7), barrier(3)])],
    { up: { effects: [on('loseHp', [hurtBack(9), barrier(4)])] } },
  ),

  // --- Shells (more) ---
  p('uncommon', 'sawn-off', 'Sawn-Off', 'attack', 1, 'none', [dmg(9, 'allFoes'), lose(1)], GUN),
  p('uncommon', 'tin-can-alley', 'Tin Can Alley', 'attack', 1, 'none', [dmg(3, 'allFoes', 3)], GUN),
  // (3 since #695: ~74%; upgraded Hold)
  p('uncommon', 'pick-up-the-brass', 'Pick Up the Brass', 'skill', 1, 'none', [reclaim(3)], {
    exhaust: true,
    up: { retain: true },
  }),
  p(
    'rare',
    'hot-brass',
    'Hot Brass',
    'power',
    1,
    'none',
    // (2 Barrier since #695: ~111%; ~147%; upgraded 3)
    [on('exhaust', [barrier(2), forge('old-twelve-gauge', 1)])],
    { up: { effects: [on('exhaust', [barrier(3), forge('old-twelve-gauge', 1)])] } },
  ),
  p(
    'uncommon',
    'spray-and-pray',
    'Spray and Pray',
    'attack',
    2,
    'none',
    // (12 + 1 a card made since #695: ~80%; upgraded 16 + 1)
    [scaled(dmg(12, 'allFoes'), per('created', 1))],
    { ...GUN, up: { effects: [scaled(dmg(16, 'allFoes'), per('created', 1))] } },
  ),

  // --- brought back (DECISIONS #337) ---
  p('common', 'birdshot', 'Birdshot', 'attack', 0, 'none', [dmg(6, 'allFoes')], {
    exhaust: true,
    ...GUN,
  }),

  // --- Gun, filled to its minimum (DECISIONS #337) ---
  p(
    'common',
    'buttstroke',
    'Buttstroke',
    'attack',
    1,
    'foe',
    [dmg(5), status('faltering', 1, 'target'), forge('old-twelve-gauge', 1)],
    {
      up: {
        effects: [dmg(8), status('faltering', 1, 'target'), forge('old-twelve-gauge', 1)],
      },
    },
  ),
  p('uncommon', 'spare-barrel', 'Spare Barrel', 'skill', 1, 'none', [
    forge('old-twelve-gauge', 2),
    addTo('buckshot-shell'),
  ]),
  p(
    'common',
    'gun-oil',
    'Gun Oil',
    'power',
    1,
    'none',
    // (2, DECISIONS #681: every shell is a gun now, and Bandolier is the shell specialist)
    [on('play', [barrier(2)], { tag: 'gun' })],
    // (upgraded Opening hand since #695: 3 was +50%)
    { up: { innate: true } },
  ),
  p(
    'uncommon',
    'dead-eye',
    'Dead Eye',
    'skill',
    1,
    'none',
    // (3 Precision since #695: ~85%; upgraded 4)
    [forge('old-twelve-gauge', 3), status('exposed', 1, 'allFoes')],
    { up: { effects: [forge('old-twelve-gauge', 4), status('exposed', 1, 'allFoes')] } },
  ),

  // --- glue: cards for any deck (DECISIONS #337) ---
  p(
    'common',
    'broken-bottle',
    'Broken Bottle',
    'attack',
    1,
    'foe',
    [dmg(7), status('exposed', 1, 'target')],
    { up: { effects: [dmg(10), status('exposed', 1, 'target')] } },
  ),
  p('common', 'chaser', 'Chaser', 'skill', 0, 'none', [lose(2), mana(1), draw(1)], {
    exhaust: true,
    up: { effects: [lose(1), mana(1), draw(1)] },
  }),
  p(
    'uncommon',
    'dumpster-dive',
    'Dumpster Dive',
    'skill',
    1,
    'none',
    [draw(2), discard(1), heal(4)],
    {
      up: { effects: [draw(3), discard(1), heal(4)] },
    },
  ),
  // (utility for any deck, DECISIONS #393: a look at what is coming, and a guard that draws)
  // (and 1 Barrier since #695: ~83%; upgraded 3 Barrier)
  p('common', 'rummage-the-bin', 'Rummage the Bin', 'skill', 0, 'none', [scry(3), barrier(1)], {
    up: { effects: [scry(3), barrier(3)] },
  }),
  p('uncommon', 'sway', 'Sway', 'skill', 1, 'none', [barrier(7), draw(1)], {
    up: { effects: [barrier(10), draw(1)] },
  }),

  // --- more glue: uncommons and rares for any deck (DECISIONS #339) ---
  // (and 1 per 10% missing since #695: ~96%; ~125%; upgraded heal 14)
  p(
    'rare',
    'whiskey-miracle',
    'Whiskey Miracle',
    'skill',
    1,
    'none',
    [scaled(heal(10), per('missingPct', 0.1))],
    {
      exhaust: true,
      up: { effects: [scaled(heal(14), per('missingPct', 0.1))] },
    },
  ),
  // (3 Might now, then 1 HP for 1 Might each of your first 6 turns, since #695: ~35% before; A in a pain deck; upgraded Opening hand)
  p(
    'rare',
    'rock-bottom',
    'Rock Bottom',
    'power',
    1,
    'none',
    [status('might', 3), on('turnStart', [lose(1), status('might', 1)], { times: 6 })],
    {
      up: { innate: true },
    },
  ),
  p('uncommon', 'liquid-courage', 'Liquid Courage', 'skill', 1, 'none', [
    barrier(5),
    status('vigor', 6),
  ]),
  p('uncommon', 'window-pane', 'Window Pane', 'skill', 1, 'none', [
    scaled(barrier(7), per('missingPct', 1 / 8)),
  ]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  p(
    'uncommon',
    'mean-drunk',
    'Mean Drunk',
    'power',
    2,
    'none',
    [on('loseHp', [hurtMight(3), barrier(2)])],
    { up: { effects: [on('loseHp', [hurtMight(3), barrier(4)])] } },
  ),
  p(
    'rare',
    'booby-trapped-window',
    'Booby-Trapped Window',
    'snare',
    2,
    'none',
    // (18, 2 Brittle and 5 Barrier since #695: ~89%; ~134%; upgraded 26. Its own glass rider, not the Trickster's Bait and
    // Switch's Exposed)
    [PREVENT, dmg(18, 'attacker'), status('brittle', 2, 'attacker'), barrier(5)],
    {
      trigger: { on: 'attacked' },
      up: { effects: [PREVENT, dmg(26, 'attacker'), status('brittle', 2, 'attacker'), barrier(5)] },
    },
  ),
  p(
    'rare',
    'broken-window-theory',
    'Broken Window Theory',
    'power',
    2,
    'none',
    // (4 + 1 per 5% missing since #695: ~82%; ~137%; upgraded 7)
    [on('turnEnd', [scaled(dmg(4, 'allFoes'), per('missingPct', 1 / 5))])],
    { up: { effects: [on('turnEnd', [scaled(dmg(7, 'allFoes'), per('missingPct', 1 / 5))])] } },
  ),

  // --- new for the 20/30/25 rarity target (DECISIONS #341) ---
  p('uncommon', 'double-tap', 'Double Tap', 'skill', 1, 'none', [addTo('old-twelve-gauge')]),
  p(
    'uncommon',
    'bandolier',
    'Bandolier',
    'power',
    1,
    'none',
    // (3, DECISIONS #681: more than Gun Oil's 2, which every gun sets off)
    [on('play', [barrier(3)], { tag: 'shell' })],
    { up: { effects: [on('play', [barrier(4)], { tag: 'shell' })] } },
  ),
  p(
    'rare',
    'scattergun-symphony',
    'Scattergun Symphony',
    'power',
    1,
    'none',
    // (4 since #695: ~117%; ~156%; upgraded 5)
    [on('play', [dmg(4, 'allFoes')], { tag: 'shell' })],
    { up: { effects: [on('play', [dmg(5, 'allFoes')], { tag: 'shell' })] } },
  ),
  // (and 1 Barrier a Shell since #695: ~90%; ~126%)
  p(
    'rare',
    'ricochet',
    'Ricochet',
    'power',
    1,
    'none',
    [on('play', [draw(1), barrier(1)], { tag: 'shell' })],
    {
      up: { innate: true },
    },
  ),

  // --- Hangover: drink now, pay tomorrow (DECISIONS #354) ---
  // (DECISIONS #434: more for the cards that pay off losing HP; Hangover counts as losing it)
  p(
    'common',
    'bar-fight',
    'Bar Fight',
    'attack',
    1,
    'foe',
    [scaled(dmg(7), { by: 'hpLostTurn', mult: 3, max: 9 })],
    { up: { effects: [scaled(dmg(10), { by: 'hpLostTurn', mult: 3, max: 9 })] } },
  ),
  p(
    'common',
    'nurse-the-hangover',
    'Nurse the Hangover',
    'skill',
    1,
    'none',
    [scaled(barrier(5), { by: 'hangover', max: 8 })],
    // (upgraded 7 since #695: 8 was +37%)
    { up: { effects: [scaled(barrier(7), { by: 'hangover', max: 8 })] } },
  ),
  p(
    'uncommon',
    'take-it-on-the-chin',
    'Take It on the Chin',
    'skill',
    1,
    'none',
    [{ op: 'loseHp', amount: 3, to: 'self' }, barrier(10), draw(1)],
    { up: { effects: [{ op: 'loseHp', amount: 3, to: 'self' }, barrier(13), draw(1)] } },
  ),
  // Drinks give something big now and Hangover: at the start of your next turn you lose 1% of your Max HP per stack (never your last). Every HP
  // lost makes Clutch Genes hit harder (1% a HP, DECISIONS #411), and his heals grow with the HP he is missing to bring him back.
  p('common', 'liquid-lunch', 'Liquid Lunch', 'skill', 0, 'none', [mana(2), hangover(3)], {
    exhaust: true,
    up: { effects: [mana(2), hangover(2)] },
  }),
  // (2 Hangover since #695: ~87%; upgraded 1)
  p('common', 'one-for-the-road', 'One for the Road', 'skill', 0, 'none', [draw(3), hangover(2)], {
    exhaust: true,
    up: { effects: [draw(3), hangover(1)] },
  }),
  // (upgraded 17 since #695: 18 was +42%)
  p('common', 'drunken-swing', 'Drunken Swing', 'attack', 1, 'foe', [dmg(14), hangover(3)], {
    up: { effects: [dmg(17), hangover(3)] },
  }),
  p('common', 'bottle-to-the-head', 'Bottle to the Head', 'attack', 1, 'foe', [
    scaled(dmg(5), per('hangover', 2)),
  ]),
  p(
    'common',
    'sob-story',
    'Sob Story',
    'skill',
    1,
    'none',
    [scaled(heal(3), per('missingPct', 1 / 8)), draw(1)],
    // (upgraded heal 5 since #695: 6 was +45%)
    { exhaust: true, up: { effects: [scaled(heal(5), per('missingPct', 1 / 8)), draw(1)] } },
  ),
  p(
    'common',
    'sweat-it-out',
    'Sweat It Out',
    'skill',
    1,
    'none',
    [barrier(4), scaled(heal(0), per('hangover')), soberUp],
    { exhaust: true, up: { effects: [barrier(7), scaled(heal(0), per('hangover')), soberUp] } },
  ),
  p(
    'uncommon',
    'swig',
    'Swig',
    'skill',
    0,
    'none',
    // (5 Might and draw 1 since #695: ~60%; ~119%; upgraded 6 Might)
    [status('might', 5, 'self', true), hangover(2), draw(1)],
    {
      exhaust: true,
      up: { effects: [status('might', 6, 'self', true), hangover(2), draw(1)] },
    },
  ),
  p(
    'uncommon',
    'barroom-brawl',
    'Barroom Brawl',
    'attack',
    2,
    'none',
    // (18 to all since #695: ~84%; upgraded 23)
    [dmg(18, 'allFoes'), hangover(2)],
    {
      up: { effects: [dmg(23, 'allFoes'), hangover(2)] },
    },
  ),
  // (upgraded 17 since #695: 18 was +48%)
  p('uncommon', 'black-out', 'Black Out', 'skill', 1, 'none', [barrier(14), hangover(4)], {
    up: { effects: [barrier(17), hangover(4)] },
  }),
  // (2 hits, harder the drunker, DECISIONS #502, #509)
  p(
    'uncommon',
    'bender',
    'Bender',
    'attack',
    1,
    'foe',
    [scaled(dmg(4, 'target', 2), { by: 'hangover', step: 2 })],
    { up: { effects: [scaled(dmg(6, 'target', 2), { by: 'hangover', step: 2 })] } },
  ),
  // (the old cure: one more drink, and the morning never comes)
  p(
    'uncommon',
    'hair-of-the-dog',
    'Hair of the Dog',
    'skill',
    0,
    'none',
    [soberUp, mana(1), hangover(2)],
    { exhaust: true, up: { effects: [soberUp, mana(1), draw(1), hangover(2)] } },
  ),
  p(
    'uncommon',
    'liquid-dinner',
    'Liquid Dinner',
    'skill',
    1,
    'none',
    [scaled(heal(2), per('missingPct', 1 / 5)), draw(1)],
    { exhaust: true, up: { effects: [scaled(heal(5), per('missingPct', 1 / 5)), draw(1)] } },
  ),
  p(
    'uncommon',
    'dutch-courage',
    'Dutch Courage',
    'power',
    1,
    'none',
    [on('turnEnd', [scaled(barrier(0), per('hangover', 1))])],
    { up: { cost: 0 } },
  ),
  // (18 + 4 a Hangover since #695: ~97%; ~126%; upgraded 26 + 4)
  p('rare', 'hammer-time', 'Haymaker', 'attack', 2, 'foe', [scaled(dmg(18), per('hangover', 4))], {
    up: { effects: [scaled(dmg(26), per('hangover', 4))] },
  }),
  // (draw 3, 3 Hangover since #695: ~96%; ~131%; upgraded draw 4, 2 Hangover)
  p('rare', 'bottoms-up', 'Bottoms Up', 'skill', 1, 'none', [mana(2), draw(3), hangover(3)], {
    exhaust: true,
    up: { effects: [mana(2), draw(4), hangover(2)] },
  }),
  // (an Aura, DECISIONS #410: +1 Mana a turn is ~28 over a fight, a 2-cost Aura like Inner Furnace and Deep Pockets; at 1 its 4
  // Hangover was too light a price, and nearly free in a Hangover deck. The Hangover stays as his flavour, and feeds his payoffs)
  p(
    'rare',
    'last-call',
    'Last Call',
    'power',
    // (#695, Robert: 1 Mana, and the tab runs every turn: +1 Mana and 1 Hangover at the start of each turn. The Hangover each turn is the
    // real price #410 asks of a 1-Mana +1 Mana Aura (~22 points, ~110%, B on its own), and in a Brewmaster deck it builds Fermentation every turn (A))
    // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
    2,
    'none',
    [on('turnStart', [mana(1), hangover(1)])],
    {
      up: { innate: true },
    },
  ),
  p(
    'rare',
    'bottomless-flask',
    'Bottomless Flask',
    'power',
    2,
    'none',
    // (heal 3 since #695: ~121%; ~137%; upgraded heal 5)
    [on('turnStart', [scaled(heal(3), per('missingPct', 1 / 10)), draw(1)])],
    { up: { effects: [on('turnStart', [scaled(heal(5), per('missingPct', 1 / 10)), draw(1)])] } },
  ),
  p(
    'rare',
    'pass-out',
    'Pass Out',
    'skill',
    2,
    'none',
    // (and draw 2 since #695: ~106%; ~140%; upgraded it costs 1)
    [scaled(heal(8), per('missingPct', 1 / 3)), soberUp, draw(2)],
    { exhaust: true, up: { cost: 1 } },
  ),

  // --- Hangover: Stagger, a drunk's swing (DECISIONS #393) ---
  // A Stagger card's damage lands on a random enemy (you can't aim it), so it hits about 15% harder than an aimed one (random
  // targeting is 0.9 a point in the costing guide). The tag lets payoffs find them.
  p('common', 'haphazard-hook', 'Haphazard Hook', 'attack', 0, 'none', [dmg(7, 'randomFoe')], {
    tags: ['stagger'],
  }),
  p('common', 'drunken-lurch', 'Drunken Lurch', 'attack', 1, 'none', [dmg(12, 'randomFoe')], {
    tags: ['stagger'],
  }),
  p(
    'uncommon',
    'stumble',
    'Stumble',
    'attack',
    1,
    'none',
    // (10 and 5 Barrier since #695: ~88%; upgraded 13)
    [dmg(10, 'randomFoe'), barrier(5), hangover(2)],
    {
      tags: ['stagger'],
      up: { effects: [dmg(13, 'randomFoe'), barrier(5), hangover(2)] },
    },
  ),
  // (8 x 3 since #695: ~89%; upgraded 10 x 3)
  p('uncommon', 'free-for-all', 'Free-for-All', 'attack', 2, 'none', [dmg(8, 'randomFoe', 3)], {
    tags: ['stagger'],
    up: { effects: [dmg(10, 'randomFoe', 3)] },
  }),
  // (a deck plays one or two Stagger cards a turn, so each one pays a little more than a Shell's Bandolier)
  p(
    'uncommon',
    'drunken-master',
    'Drunken Master',
    'power',
    2,
    'none',
    [on('play', [status('might', 1), barrier(3)], { tag: 'stagger', once: true, ownTurn: true })],
    { up: { cost: 1 } },
  ),
  // (three wild swings: the drunker, the harder, DECISIONS #502, #509)
  p(
    'rare',
    'blind-drunk',
    'Blind Drunk',
    'attack',
    2,
    'none',
    // (9 x 3 since #695: ~93%; ~128%; upgraded 12 x 3)
    [scaled(dmg(9, 'randomFoe', 3), { by: 'hangover', step: 2, mult: 2 })],
    {
      tags: ['stagger'],
      up: { effects: [scaled(dmg(12, 'randomFoe', 3), { by: 'hangover', step: 2, mult: 2 })] },
    },
  ),
  p(
    'uncommon',
    'morning-after',
    'Morning After',
    'power',
    2,
    'none',
    [on('hangoverPaid', [status('might', 1), barrier(3)], { once: true, ownTurn: true })],
    {
      up: {
        effects: [
          on('hangoverPaid', [status('might', 1), barrier(5)], { once: true, ownTurn: true }),
        ],
      },
    },
  ),
];
