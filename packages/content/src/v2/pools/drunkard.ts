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
/** a drink's price: that much HP at the start of your next turn (DECISIONS #354) */
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
    [dmg(6), status('brittle', 1, 'target')],
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
    tags: ['shell'],
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
    [dmg(6, 'allFoes'), status('brittle', 1, 'allFoes')],
    { up: { effects: [dmg(9, 'allFoes'), status('brittle', 1, 'allFoes')] } },
  ),
  p('uncommon', 'shatter', 'Smash the Pane', 'attack', 2, 'foe', [
    scaled(dmg(12), per('missingPct', 1 / 4)),
  ]),

  // --- Shells: the 12 gauge ---
  // (two, not three: a Shell is a free card that hits every enemy, DECISIONS #393)
  p('common', 'load-shells', 'Load Shells', 'skill', 1, 'none', [addTo('buckshot-shell', 2)]),
  p('common', 'slug-round', 'Slug Round', 'attack', 2, 'foe', [dmg(16)]),
  p(
    'uncommon',
    'pump-action',
    'Pump Action',
    'skill',
    1,
    'none',
    [addTo('buckshot-shell', 2), draw(1)],
    { up: { effects: [addTo('buckshot-shell', 3), draw(1)] } },
  ),
  p('uncommon', 'shotgun-wedding', 'Shotgun Wedding', 'attack', 2, 'none', [dmg(7, 'allFoes', 2)]),
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
  p('rare', 'boomstick', 'Boomstick', 'attack', 3, 'none', [
    scaled(dmg(14, 'allFoes'), per('exhausted', 2)),
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

  // --- legendary ---
  p(
    'rare',
    'one-more-round',
    'One More Round',
    'power',
    3,
    'none',
    [on('turnStart', [addTo('buckshot-shell', 2), heal(3)])],
    { up: { effects: [on('turnStart', [addTo('buckshot-shell', 2), heal(6)])] } },
  ),
  // Hangover: Barrier that grows as you hurt, and every wound you deal yourself (a Hangover too) cuts every enemy (DECISIONS #338, #354)
  p(
    'rare',
    'the-glass-palace',
    'The Glass Palace',
    'power',
    3,
    'none',
    [on('turnStart', [scaled(barrier(3), per('missingPct', 1 / 6))]), on('loseHp', [hurtBack(5)])],
    {
      up: {
        effects: [
          on('turnStart', [scaled(barrier(3), per('missingPct', 1 / 6))]),
          on('loseHp', [hurtBack(7)]),
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
    { up: { effects: [barrier(7), forge('old-twelve-gauge', 4)] } },
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
  p('uncommon', 'reload', 'Reload', 'skill', 1, 'none', [forge('old-twelve-gauge', 3), draw(1)], {
    up: { effects: [forge('old-twelve-gauge', 5), draw(1)] },
  }),
  p(
    'rare',
    'extended-mag',
    'Extended Mag',
    'power',
    2,
    'none',
    [on('turnStart', [forge('old-twelve-gauge', 2), addTo('buckshot-shell')])],
    { up: { effects: [on('turnStart', [forge('old-twelve-gauge', 3), addTo('buckshot-shell')])] } },
  ),
  p('rare', 'rack-and-ruin', 'Rack and Ruin', 'attack', 2, 'none', [
    dmg(10, 'allFoes'),
    forge('old-twelve-gauge', 4),
  ]),
  p(
    'rare',
    'trigger-discipline',
    'Trigger Discipline',
    'power',
    1,
    'none',
    [on('play', [forge('old-twelve-gauge', 1)], { filter: 'attack' })],
    { up: { innate: true } },
  ),
  p('common', 'shell-shock', 'Shell Shock', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    addTo('buckshot-shell'),
  ]),

  // (more Shells)
  p('uncommon', 'slugfest', 'Slugfest', 'attack', 2, 'foe', [dmg(5, 'target', 4)]),
  p(
    'uncommon',
    'shellshocked',
    'Shellshocked',
    'power',
    1,
    'none',
    [on('exhaust', [dmg(2, 'allFoes')])],
    { up: { effects: [on('exhaust', [dmg(3, 'allFoes')])] } },
  ),
  p(
    'rare',
    'fire-in-the-hole',
    'Fire in the Hole',
    'attack',
    2,
    'none',
    [scaled(dmg(12, 'allFoes'), per('exhausted', 1))],
    { up: { effects: [scaled(dmg(15, 'allFoes'), per('exhausted', 1))] } },
  ),
  // (six shells, not eight (Robert, 2026-10-26); upgraded, the same six, each one upgraded)
  p('rare', 'ammo-dump', 'Ammo Dump', 'skill', 2, 'none', [addTo('buckshot-shell', 6)], {
    exhaust: true,
    up: { effects: [addTo('buckshot-shell+', 6)] },
  }),
  p('rare', 'rolling-thunder', 'Rolling Thunder', 'power', 2, 'none', [
    on('turnStart', [addTo('buckshot-shell', 2)]),
  ]),
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
    [forge('old-twelve-gauge', 3), addTo('buckshot-shell', 2)],
    { exhaust: true, up: { effects: [forge('old-twelve-gauge', 3), addTo('buckshot-shell', 3)] } },
  ),
  p(
    'rare',
    'gunmetal-soul',
    'Gunmetal Soul',
    'power',
    1,
    'none',
    [on('turnEnd', [forge('old-twelve-gauge', 1), barrier(3)])],
    { up: { effects: [on('turnEnd', [forge('old-twelve-gauge', 1), barrier(5)])] } },
  ),
  p('uncommon', 'bar-stool', 'Bar Stool', 'attack', 1, 'foe', [
    scaled(dmg(7), per('missingPct', 1 / 6)),
  ]),
  p('rare', 'last-orders', 'Last Orders', 'attack', 2, 'none', [
    scaled(dmg(8, 'allFoes'), per('missingPct', 1 / 4)),
  ]),

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
    [on('loseHp', [hurtBack(6), barrier(2)])],
    { up: { effects: [on('loseHp', [hurtBack(8), barrier(3)])] } },
  ),

  // --- Shells (more) ---
  p('uncommon', 'sawn-off', 'Sawn-Off', 'attack', 1, 'none', [dmg(9, 'allFoes'), lose(1)]),
  p('uncommon', 'tin-can-alley', 'Tin Can Alley', 'attack', 1, 'none', [dmg(3, 'allFoes', 3)]),
  p('uncommon', 'pick-up-the-brass', 'Pick Up the Brass', 'skill', 1, 'none', [reclaim(2)], {
    exhaust: true,
  }),
  p(
    'rare',
    'hot-brass',
    'Hot Brass',
    'power',
    1,
    'none',
    [on('exhaust', [barrier(1), forge('old-twelve-gauge', 1)])],
    { up: { effects: [on('exhaust', [barrier(2), forge('old-twelve-gauge', 1)])] } },
  ),
  p('uncommon', 'spray-and-pray', 'Spray and Pray', 'attack', 2, 'none', [
    scaled(dmg(10, 'allFoes'), per('created', 0.5)),
  ]),

  // --- brought back (DECISIONS #337) ---
  p('common', 'birdshot', 'Birdshot', 'attack', 0, 'none', [dmg(6, 'allFoes')], { exhaust: true }),

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
    [on('play', [barrier(3)], { tag: 'gun' })],
    {
      up: { effects: [on('play', [barrier(4)], { tag: 'gun' })] },
    },
  ),
  p(
    'uncommon',
    'dead-eye',
    'Dead Eye',
    'skill',
    1,
    'none',
    [forge('old-twelve-gauge', 2), status('exposed', 1, 'allFoes')],
    { up: { effects: [forge('old-twelve-gauge', 2), status('exposed', 2, 'allFoes')] } },
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
  p('common', 'rummage-the-bin', 'Rummage the Bin', 'skill', 0, 'none', [scry(3)]),
  p('uncommon', 'sway', 'Sway', 'skill', 1, 'none', [barrier(7), draw(1)], {
    up: { effects: [barrier(10), draw(1)] },
  }),

  // --- more glue: uncommons and rares for any deck (DECISIONS #339) ---
  p('rare', 'whiskey-miracle', 'Whiskey Miracle', 'skill', 1, 'none', [heal(10)], {
    exhaust: true,
  }),
  p('rare', 'rock-bottom', 'Rock Bottom', 'power', 1, 'none', [
    status('might', 2),
    on('turnStart', [lose(1)]),
  ]),
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
    [PREVENT, dmg(13, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  p(
    'rare',
    'broken-window-theory',
    'Broken Window Theory',
    'power',
    2,
    'none',
    [on('turnEnd', [scaled(dmg(1, 'allFoes'), per('missingPct', 1 / 6))])],
    { up: { effects: [on('turnEnd', [scaled(dmg(3, 'allFoes'), per('missingPct', 1 / 6))])] } },
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
    [on('play', [barrier(2)], { tag: 'shell' })],
    { up: { effects: [on('play', [barrier(3)], { tag: 'shell' })] } },
  ),
  p(
    'rare',
    'scattergun-symphony',
    'Scattergun Symphony',
    'power',
    1,
    'none',
    [on('play', [dmg(3, 'allFoes')], { tag: 'shell' })],
    { up: { effects: [on('play', [dmg(4, 'allFoes')], { tag: 'shell' })] } },
  ),
  p('rare', 'ricochet', 'Ricochet', 'power', 1, 'none', [on('play', [draw(1)], { tag: 'shell' })], {
    up: { innate: true },
  }),

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
    { up: { effects: [scaled(barrier(8), { by: 'hangover', max: 8 })] } },
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
  // Drinks give something big now and Hangover: at the start of your next turn you lose that much HP (never your last). Every HP
  // lost makes Clutch Genes hit harder (1% a HP, DECISIONS #411), and his heals grow with the HP he is missing to bring him back.
  p('common', 'liquid-lunch', 'Liquid Lunch', 'skill', 0, 'none', [mana(2), hangover(3)], {
    exhaust: true,
    up: { effects: [mana(2), hangover(2)] },
  }),
  p('common', 'one-for-the-road', 'One for the Road', 'skill', 0, 'none', [draw(3), hangover(3)], {
    exhaust: true,
    up: { effects: [draw(3), hangover(2)] },
  }),
  p('common', 'drunken-swing', 'Drunken Swing', 'attack', 1, 'foe', [dmg(14), hangover(3)], {
    up: { effects: [dmg(18), hangover(3)] },
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
    { exhaust: true, up: { effects: [scaled(heal(6), per('missingPct', 1 / 8)), draw(1)] } },
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
    [status('might', 4, 'self', true), hangover(2)],
    {
      exhaust: true,
      up: { effects: [status('might', 5, 'self', true), hangover(2)] },
    },
  ),
  p(
    'uncommon',
    'barroom-brawl',
    'Barroom Brawl',
    'attack',
    2,
    'none',
    [dmg(16, 'allFoes'), hangover(2)],
    {
      up: { effects: [dmg(20, 'allFoes'), hangover(2)] },
    },
  ),
  p('uncommon', 'black-out', 'Black Out', 'skill', 1, 'none', [barrier(14), hangover(4)], {
    up: { effects: [barrier(18), hangover(4)] },
  }),
  p('uncommon', 'bender', 'Bender', 'attack', 1, 'foe', [
    scaled(dmg(3, 'target', 1), per('hangover', 1, undefined, 'hits')),
  ]),
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
  p('rare', 'hammer-time', 'Haymaker', 'attack', 2, 'foe', [scaled(dmg(14), per('hangover', 3))], {
    up: { effects: [scaled(dmg(20), per('hangover', 3))] },
  }),
  p('rare', 'bottoms-up', 'Bottoms Up', 'skill', 1, 'none', [mana(2), draw(2), hangover(4)], {
    exhaust: true,
    up: { effects: [mana(2), draw(3), hangover(4)] },
  }),
  // (an Aura, DECISIONS #410: +1 Mana a turn is ~28 over a fight, a 2-cost Aura like Inner Furnace and Deep Pockets; at 1 its 4
  // Hangover was too light a price, and nearly free in a Hangover deck. The Hangover stays as his flavour, and feeds his payoffs)
  p(
    'rare',
    'last-call',
    'Last Call',
    'power',
    2,
    'none',
    [hangover(2), on('turnStart', [mana(1)])],
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
    [on('turnStart', [scaled(heal(2), per('missingPct', 1 / 10)), draw(1)])],
    { up: { effects: [on('turnStart', [scaled(heal(4), per('missingPct', 1 / 10)), draw(1)])] } },
  ),
  p(
    'rare',
    'pass-out',
    'Pass Out',
    'skill',
    2,
    'none',
    [scaled(heal(8), per('missingPct', 1 / 3)), soberUp],
    { exhaust: true },
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
    [dmg(9, 'randomFoe'), barrier(4), hangover(2)],
    {
      tags: ['stagger'],
      up: { effects: [dmg(12, 'randomFoe'), barrier(4), hangover(2)] },
    },
  ),
  p('uncommon', 'free-for-all', 'Free-for-All', 'attack', 2, 'none', [dmg(7, 'randomFoe', 3)], {
    tags: ['stagger'],
    up: { effects: [dmg(9, 'randomFoe', 3)] },
  }),
  // (a deck plays one or two Stagger cards a turn, so each one pays a little more than a Shell's Bandolier)
  p(
    'uncommon',
    'drunken-master',
    'Drunken Master',
    'power',
    1,
    'none',
    [on('play', [barrier(2), dmg(2, 'randomFoe')], { tag: 'stagger' })],
    { up: { effects: [on('play', [barrier(3), dmg(3, 'randomFoe')], { tag: 'stagger' })] } },
  ),
  // (two hits, and one more for every point of Hangover: the drunker, the wilder)
  p(
    'rare',
    'blind-drunk',
    'Blind Drunk',
    'attack',
    2,
    'none',
    [scaled(dmg(6, 'randomFoe', 2), per('hangover', 1, undefined, 'hits'))],
    { tags: ['stagger'] },
  ),
];
