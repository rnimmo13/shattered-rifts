// Quill, the Knife-Dancer (Umbral). No companions. The Silent of the roster: three lanes that mix.
//   Shivs   - 0-cost Shiv attacks, many hits, payoffs per card played
//   Seared  - stack our poison, double it, cash it out
//   Sleight - discard and cycle for value
// Seared and Shivs are Quill's alone (docs/09_ROSTER.md): nobody else gets the engine.

import type { CardDef } from '@sr/combat';
import {
  addTo,
  barrier,
  cheapen,
  discoverOp,
  dmg,
  doubleSt,
  discard,
  draw,
  drawNext,
  fetchCards,
  reclaim,
  mana,
  on,
  per,
  pool,
  scaled,
  status,
  loseHpScaled,
} from '../build';

const q = pool('assassin', 'umbral');

export const ASSASSIN: CardDef[] = [
  // --- basics and the token ---
  q('basic', 'quick-jab', 'Quick Jab', 'attack', 0, 'foe', [
    dmg(3),
    status('faltering', 1, 'target'),
  ]),
  q('basic', 'slip-away', 'Slip Away', 'skill', 1, 'none', [barrier(7), discard(1)]),
  q('common', 'sleeve-knife', 'Sleeve Knife', 'attack', 0, 'foe', [dmg(4)], {
    exhaust: true,
    tags: ['knife'],
    source: 'token',
  }),

  // --- Shivs ---
  q('common', 'palmed-knives', 'Palmed Knives', 'skill', 1, 'none', [addTo('sleeve-knife', 3)]),
  q('common', 'hidden-blade', 'Hidden Blade', 'skill', 1, 'none', [
    barrier(6),
    addTo('sleeve-knife'),
  ]),
  q('common', 'sleeve-flick', 'Sleeve Flick', 'skill', 0, 'none', [addTo('sleeve-knife', 2)], {
    exhaust: true,
  }),
  q('common', 'whirling-knives', 'Whirling Knives', 'attack', 1, 'none', [dmg(4, 'allFoes', 2)]),
  q('common', 'knife-volley', 'Knife Volley', 'attack', 1, 'foe', [dmg(3, 'target', 3)]),
  q('uncommon', 'endless-edges', 'Endless Edges', 'power', 1, 'none', [
    on('turnStart', [addTo('sleeve-knife')]),
  ]),
  q('uncommon', 'keen-edge', 'Keen Edge', 'power', 1, 'none', [status('edge', 2)]),
  q('uncommon', 'razor-halo', 'Razor Halo', 'power', 2, 'none', [
    on('play', [dmg(2, 'allFoes')], { tag: 'knife' }),
  ]),
  q('uncommon', 'empty-the-sleeves', 'Empty the Sleeves', 'skill', 1, 'none', [
    discard(9),
    addTo('sleeve-knife', 0, 'hand', per('discarded')),
  ]),
  q('uncommon', 'killing-flourish', 'Killing Flourish', 'attack', 1, 'foe', [
    scaled(
      { op: 'damage', amount: 4, hits: 0, to: 'target' },
      per('attacksPlayed', 1, undefined, 'hits'),
    ),
  ]),
  q('rare', 'countless-nicks', 'Countless Nicks', 'power', 2, 'none', [
    on('play', [dmg(1, 'allFoes')]),
  ]),

  q('common', 'knife-fan', 'Knife Fan', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    addTo('sleeve-knife'),
  ]),

  // (more Knives)
  q('common', 'cut-low', 'Cut Low', 'attack', 0, 'foe', [dmg(5)]),
  q('common', 'smoke-and-slip', 'Smoke and Slip', 'skill', 1, 'none', [
    barrier(6),
    addTo('sleeve-knife'),
  ]),
  q('uncommon', 'ambush-cut', 'Ambush Cut', 'attack', 0, 'foe', [dmg(11)], {
    innate: true,
    exhaust: true,
  }),
  q('rare', 'knife-cascade', 'Knife Cascade', 'power', 3, 'none', [
    on('turnStart', [addTo('sleeve-knife', 3)]),
  ]),
  q(
    'rare',
    'assassins-mark',
    "Assassin's Mark",
    'attack',
    0,
    'foe',
    [dmg(10), status('exposed', 1, 'target')],
    {
      innate: true,
      exhaust: true,
    },
  ),

  // (Knives, round three)
  q('common', 'rising-tempo', 'Rising Tempo', 'attack', 0, 'foe', [
    scaled(dmg(2), per('played', 1)),
  ]),
  q('common', 'whetstone-pass', 'Whetstone Pass', 'skill', 0, 'none', [
    status('edge', 2, 'self', true),
  ]),
  q('uncommon', 'spent-steel', 'Spent Steel', 'attack', 1, 'foe', [
    scaled(dmg(5), per('created', 0.2)),
  ]),
  q('uncommon', 'gather-the-blades', 'Gather the Blades', 'skill', 1, 'none', [reclaim(3)], {
    exhaust: true,
  }),
  q('uncommon', 'jugglers-poise', "Juggler's Poise", 'power', 1, 'none', [
    on('play', [barrier(2)], { tag: 'knife' }),
  ]),
  q(
    'rare',
    'knife-storm',
    'Knife Storm',
    'attack',
    0,
    'foe',
    [scaled({ op: 'damage', amount: 5, hits: 0, to: 'target' }, per('x', 1, undefined, 'hits'))],
    { x: true },
  ),
  q('rare', 'spent-blades-sing', 'Spent Blades Sing', 'power', 1, 'none', [
    on('exhaust', [dmg(2, 'randomFoe')]),
  ]),

  // --- Seared ---
  q('common', 'needle-jab', 'Needle Jab', 'attack', 0, 'foe', [
    dmg(4),
    status('seared', 1, 'target'),
  ]),
  q('common', 'ember-dose', 'Ember Dose', 'skill', 1, 'foe', [status('seared', 5, 'target')]),
  q('common', 'choking-haze', 'Choking Haze', 'skill', 2, 'none', [
    status('seared', 4, 'allFoes'),
    status('faltering', 2, 'allFoes'),
  ]),
  q('common', 'scattered-vials', 'Scattered Vials', 'skill', 2, 'none', [
    status('seared', 3, 'randomFoe'),
    status('seared', 3, 'randomFoe'),
    status('seared', 3, 'randomFoe'),
  ]),
  q('uncommon', 'mindrot', 'Mindrot', 'skill', 1, 'foe', [
    status('seared', 4, 'target'),
    status('exposed', 1, 'target'),
  ]),
  q(
    'uncommon',
    'flashpoint',
    'Flashpoint',
    'skill',
    1,
    'foe',
    [doubleSt('seared', 'target', 2, 15)],
    {
      exhaust: true,
    },
  ),
  q('uncommon', 'smouldering-air', 'Smouldering Air', 'power', 1, 'none', [
    on('turnStart', [status('seared', 2, 'allFoes')]),
  ]),
  q('uncommon', 'tainted-edges', 'Tainted Edges', 'power', 1, 'none', [
    on('play', [status('seared', 1, 'target')], { tag: 'knife' }),
  ]),
  q('uncommon', 'hungering-dark', 'Hungering Dark', 'skill', 2, 'none', [
    status('seared', 3, 'allFoes'),
  ]),
  q('uncommon', 'venom-fang', 'Venom Fang', 'attack', 2, 'foe', [
    dmg(10),
    status('seared', 5, 'target'),
  ]),
  q(
    'uncommon',
    'cash-in',
    'Cash In',
    'skill',
    1,
    'foe',
    [loseHpScaled(per('seared', 1, 'target'))],
    {
      exhaust: true,
    },
  ),
  q(
    'rare',
    'plague-bloom',
    'Plague Bloom',
    'skill',
    2,
    'none',
    [doubleSt('seared', 'allFoes', 2, 12)],
    {
      exhaust: true,
    },
  ),
  q(
    'rare',
    'nightfall',
    'Nightfall',
    'skill',
    2,
    'none',
    [status('seared', 5, 'allFoes'), status('exposed', 2, 'allFoes')],
    { exhaust: true },
  ),

  // (more Bleed)
  q('common', 'poison-tip', 'Poison Tip', 'attack', 1, 'foe', [
    dmg(6),
    status('seared', 3, 'target'),
  ]),
  q('common', 'deadly-vial', 'Deadly Vial', 'skill', 1, 'foe', [status('seared', 5, 'target')]),
  q('uncommon', 'caustic-vial', 'Caustic Vial', 'skill', 2, 'none', [
    status('seared', 4, 'allFoes'),
  ]),
  q('uncommon', 'noxious-haze', 'Noxious Haze', 'power', 1, 'none', [
    on('turnStart', [status('seared', 2, 'allFoes')]),
  ]),
  q('rare', 'tainted-edge', 'Tainted Edge', 'power', 2, 'none', [
    on('play', [status('seared', 1, 'allFoes')], { filter: 'attack' }),
  ]),
  q('rare', 'plague-cloud', 'Plague Cloud', 'skill', 2, 'none', [status('seared', 9, 'allFoes')], {
    exhaust: true,
  }),
  q('rare', 'festering-wound', 'Festering Wound', 'attack', 2, 'foe', [
    scaled(dmg(8), per('seared', 1, 'target')),
  ]),
  q(
    'rare',
    'mirage',
    'Mirage',
    'skill',
    1,
    'foe',
    [status('faltering', 1, 'target'), scaled(barrier(0), per('seared', 1, 'target'))],
    {
      exhaust: true,
    },
  ),
  q('rare', 'fatal-dose', 'Fatal Dose', 'skill', 2, 'foe', [doubleSt('seared', 'target', 2, 15)], {
    exhaust: true,
  }),

  // (Bleed, round three)
  q('common', 'scatter-shot', 'Scatter Shot', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('seared', 2, 'allFoes'),
  ]),
  q('common', 'withering-slash', 'Withering Slash', 'attack', 1, 'foe', [
    dmg(6),
    status('seared', 2, 'target'),
    status('faltering', 1, 'target'),
  ]),
  q('common', 'slow-poison', 'Slow Poison', 'skill', 0, 'foe', [status('seared', 3, 'target')], {
    exhaust: true,
  }),
  q('uncommon', 'open-veins', 'Open Veins', 'attack', 1, 'foe', [
    scaled(dmg(2), per('seared', 0.5, 'target')),
  ]),
  q(
    'uncommon',
    'contagion',
    'Contagion',
    'skill',
    2,
    'foe',
    [
      status('seared', 2, 'target'),
      scaled(status('seared', 0, 'allFoes'), per('seared', 1, 'target')),
    ],
    { exhaust: true },
  ),
  q('uncommon', 'sour-sleight', 'Sour Sleight', 'power', 1, 'none', [
    on('discard', [status('seared', 2, 'randomFoe')]),
  ]),
  q('rare', 'compounding-interest', 'Compounding Interest', 'power', 2, 'none', [
    on('turnStart', [status('seared', 3, 'allFoes')]),
  ]),

  // --- Sleight ---
  q('common', 'quick-hands', 'Quick Hands', 'skill', 0, 'none', [draw(1), discard(1)], {
    up: { effects: [draw(2), discard(2)] },
  }),
  q('common', 'tumble', 'Tumble', 'skill', 1, 'none', [draw(3), discard(1)]),
  q('common', 'roll-clear', 'Roll Clear', 'skill', 1, 'none', [barrier(5), draw(2)]),
  q('uncommon', 'ace-up-the-sleeve', 'Ace Up the Sleeve', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [draw(2)],
  }),
  q('uncommon', 'pilfered-time', 'Pilfered Time', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [mana(1)],
  }),
  q('uncommon', 'fold-the-hand', 'Fold the Hand', 'skill', 0, 'none', [discard(3), mana(2)], {
    exhaust: true,
  }),
  q(
    'uncommon',
    'all-in',
    'All In',
    'skill',
    0,
    'none',
    [discard(9), scaled(draw(0), per('discarded'))],
    { exhaust: true },
  ),
  q('uncommon', 'hidden-palm', 'Hidden Palm', 'power', 1, 'none', [on('discard', [barrier(2)])]),
  q('uncommon', 'flaying-spree', 'Flaying Spree', 'attack', 2, 'foe', [
    scaled({ op: 'damage', amount: 8, to: 'target' }, per('discarded', 1, undefined, 'hits')),
  ]),
  q('rare', 'lingering-step', 'Lingering Step', 'power', 1, 'none', [on('play', [barrier(1)])]),
  q(
    'common',
    'poisoned-needle',
    'Poisoned Needle',
    'snare',
    1,
    'none',
    [dmg(3, 'attacker'), status('seared', 4, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  q(
    'uncommon',
    'knife-in-the-dark',
    'Knife in the Dark',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), addTo('sleeve-knife', 2)],
    { trigger: { on: 'foeDefends' } },
  ),
  q('uncommon', 'encore', 'Encore', 'skill', 1, 'none', [status('mirrored', 1)]),
  q('uncommon', 'palmed-card', 'Palmed Card', 'skill', 0, 'none', [discoverOp('attack')], {
    exhaust: true,
    up: { effects: [discoverOp('attack', 1, true)] },
  }),
  q(
    'uncommon',
    'nimble-hands',
    'Nimble Hands',
    'skill',
    0,
    'none',
    [cheapen(1, 'random'), draw(1)],
    {
      exhaust: true,
    },
  ),
  q(
    'legendary',
    'deck-of-a-thousand-knives',
    'Deck of a Thousand Knives',
    'power',
    2,
    'none',
    [on('turnStart', [addTo('sleeve-knife', 3)]), status('edge', 2)],
    { up: { cost: 1, effects: [on('turnStart', [addTo('sleeve-knife', 3)]), status('edge', 3)] } },
  ),
  q(
    'legendary',
    'death-warrant',
    'Death Warrant',
    'skill',
    1,
    'foe',
    [loseHpScaled(per('seared', 2, 'target'))],
    { exhaust: true },
  ),
  q('uncommon', 'light-fingers', 'Light Fingers', 'skill', 1, 'none', [mana(2), discard(1)], {
    up: { effects: [mana(2), draw(1), discard(1)] },
  }),
  // (more Sleight)
  q('rare', 'speed-reader', 'Speed Reader', 'power', 1, 'none', [on('draw', [dmg(2, 'allFoes')])]),
  q('uncommon', 'showmans-flourish', "Showman's Flourish", 'attack', 1, 'foe', [
    scaled(dmg(4), per('skillsPlayed', 4)),
  ]),
  q('common', 'dart-throw', 'Dart Throw', 'attack', 1, 'foe', [dmg(9), draw(1), discard(1)]),
  q('common', 'tangle-wire', 'Tangle Wire', 'attack', 1, 'foe', [
    dmg(8),
    status('faltering', 1, 'target'),
  ]),
  q('common', 'quick-draw', 'Quick Draw', 'skill', 1, 'none', [barrier(5), draw(2)]),
  q('uncommon', 'light-feet', 'Light Feet', 'power', 1, 'none', [status('bracing', 2)]),
  q('rare', 'blur-step', 'Blur Step', 'skill', 1, 'none', [
    discard(9, 'any'),
    status('twinned', 1),
  ]),
  q('rare', 'nimble-fingers', 'Nimble Fingers', 'skill', 1, 'none', [status('mirrored', 1)]),
  q('rare', 'lingering-blur', 'Lingering Blur', 'power', 1, 'none', [on('play', [barrier(1)])]),
  q('rare', 'adrenaline-rush', 'Adrenaline Rush', 'skill', 0, 'none', [mana(1), draw(2)], {
    exhaust: true,
  }),
  q('rare', 'tricks-of-the-trade', 'Tricks of the Trade', 'power', 1, 'none', [
    on('turnStart', [draw(1)]),
  ]),
  q('rare', 'careful-plan', 'Careful Plan', 'skill', 1, 'none', [draw(1), status('holdfast', 1)]),
  q('rare', 'cold-killing', 'Cold Killing', 'attack', 1, 'foe', [
    scaled(dmg(1), per('drawn', 0.25)),
  ]),
  q('rare', 'coiled-strike', 'Coiled Strike', 'power', 3, 'none', [
    on('play', [dmg(2, 'randomFoe')]),
  ]),
  q(
    'rare',
    'veil-of-dust',
    'Veil of Dust',
    'skill',
    1,
    'none',
    [scaled(barrier(0), per('barrier', 1))],
    {
      exhaust: true,
    },
  ),

  // (Sleight, round three)
  q('common', 'cold-open', 'Cold Open', 'attack', 0, 'foe', [dmg(6), discard(1)]),
  q('uncommon', 'magicians-exit', "Magician's Exit", 'skill', 1, 'none', [
    discard(9, 'any'),
    scaled(barrier(0), per('discarded', 3)),
  ]),
  q('uncommon', 'loaded-die', 'Loaded Die', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [dmg(6, 'allFoes')],
  }),
  q('uncommon', 'cut-and-shuffle', 'Cut and Shuffle', 'skill', 1, 'none', [
    fetchCards(2),
    discard(1),
  ]),
  q('uncommon', 'fortunes-edge', "Fortune's Edge", 'attack', 1, 'foe', [
    scaled(dmg(6), per('discarded', 2)),
  ]),
  q('rare', 'jokers-gambit', "Joker's Gambit", 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [addTo('sleeve-knife', 3)],
  }),
  q('rare', 'showy-reflex', 'Showy Reflex', 'power', 1, 'none', [
    on('discard', [dmg(4, 'randomFoe')]),
  ]),
  q(
    'rare',
    'tricksters-vanish',
    "Trickster's Vanish",
    'skill',
    1,
    'none',
    [barrier(12), drawNext(2)],
    { exhaust: true },
  ),
];
