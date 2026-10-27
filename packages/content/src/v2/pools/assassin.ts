// Sylas (id assassin, Umbral). No companions. Three build paths that mix (DECISIONS #255); his trait (a Sleeve Knife every turn)
// feeds all three.
//   Shivs   - 0-cost Shiv attacks, many hits, payoffs per card played
//   Seared  - stack our poison, double it, cash it out
//   Sleight - discard and cycle for value
// Seared and Shivs are Quill's alone (docs/09_ROSTER.md): nobody else gets the engine.

import type { CardDef } from '@sr/combat';
import {
  addTo,
  barrier,
  dmg,
  doubleSt,
  discard,
  draw,
  reclaim,
  mana,
  on,
  per,
  pool,
  scaled,
  status,
  loseHpScaled,
  drawNext,
  cheapen,
  discoverOp,
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
  q('common', 'palmed-knives', 'Palmed Knives', 'skill', 1, 'none', [
    addTo('sleeve-knife', 2),
    draw(1),
  ]),
  q('common', 'hidden-blade', 'Hidden Blade', 'skill', 1, 'none', [
    barrier(4),
    addTo('sleeve-knife'),
    status('edge', 1, 'self', true),
  ]),
  q('common', 'whirling-knives', 'Whirling Knives', 'attack', 1, 'none', [dmg(4, 'allFoes', 2)]),
  q('common', 'knife-volley', 'Knife Volley', 'attack', 1, 'foe', [dmg(3, 'target', 3)]),
  q('rare', 'endless-edges', 'Endless Edges', 'power', 2, 'none', [
    on('turnStart', [addTo('sleeve-knife', 2)]),
  ]),
  q('uncommon', 'keen-edge', 'Keen Edge', 'power', 1, 'none', [status('edge', 2)]),
  q('rare', 'razor-halo', 'Razor Halo', 'power', 2, 'none', [
    on('play', [dmg(2, 'allFoes')], { tag: 'knife' }),
  ]),
  q('rare', 'empty-the-sleeves', 'Empty the Sleeves', 'skill', 1, 'none', [
    discard(9),
    addTo('sleeve-knife', 0, 'hand', per('discarded')),
    status('edge', 1, 'self', true),
  ]),
  q('uncommon', 'killing-flourish', 'Killing Flourish', 'attack', 1, 'foe', [
    scaled(
      { op: 'damage', amount: 4, hits: 0, to: 'target' },
      per('attacksPlayed', 1, undefined, 'hits'),
    ),
  ]),

  q('common', 'knife-fan', 'Knife Fan', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    addTo('sleeve-knife'),
  ]),

  // (more Knives)
  q('common', 'cut-low', 'Cut Low', 'attack', 0, 'foe', [dmg(5)]),
  q('uncommon', 'smoke-and-slip', 'Smoke and Slip', 'skill', 1, 'none', [
    barrier(6),
    discard(1),
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
  q('common', 'ember-dose', 'Ember Dose', 'skill', 1, 'foe', [
    status('seared', 5, 'target'),
    barrier(3),
  ]),
  q('uncommon', 'choking-haze', 'Choking Haze', 'skill', 2, 'none', [
    status('seared', 3, 'allFoes'),
    status('faltering', 2, 'allFoes'),
    barrier(4),
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
    on('turnStart', [status('seared', 1, 'allFoes'), barrier(2)]),
  ]),
  q('common', 'tainted-edges', 'Tainted Edges', 'power', 1, 'none', [
    on('play', [status('seared', 1, 'target')], { tag: 'knife' }),
  ]),
  q('uncommon', 'hungering-dark', 'Hungering Dark', 'skill', 2, 'none', [
    status('seared', 3, 'allFoes'),
  ]),
  q('uncommon', 'venom-fang', 'Venom Fang', 'attack', 2, 'foe', [
    dmg(10),
    status('seared', 5, 'target'),
  ]),
  q('rare', 'cash-in', 'Cash In', 'skill', 1, 'foe', [loseHpScaled(per('seared', 1, 'target'))], {
    exhaust: true,
  }),
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
    dmg(4),
    status('seared', 4, 'target'),
  ]),
  q('common', 'deadly-vial', 'Deadly Vial', 'skill', 1, 'foe', [
    status('seared', 4, 'target'),
    draw(1),
  ]),
  q('rare', 'tainted-edge', 'Tainted Edge', 'power', 2, 'none', [
    on('play', [status('seared', 1, 'allFoes')], { filter: 'attack' }),
  ]),
  q('rare', 'festering-wound', 'Festering Wound', 'attack', 2, 'foe', [
    scaled(dmg(8), per('seared', 1, 'target')),
  ]),

  // (Bleed, round three)
  q('uncommon', 'scatter-shot', 'Scatter Shot', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('seared', 2, 'allFoes'),
  ]),
  q('common', 'withering-slash', 'Withering Slash', 'attack', 1, 'foe', [
    dmg(6),
    status('seared', 2, 'target'),
    status('faltering', 1, 'target'),
  ]),
  q(
    'rare',
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
  q('common', 'roll-clear', 'Roll Clear', 'skill', 1, 'none', [barrier(4), draw(2), discard(1)]),
  q('common', 'ace-up-the-sleeve', 'Ace Up the Sleeve', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [draw(2), addTo('sleeve-knife')],
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
    [discard(9), scaled(draw(0), per('discarded')), addTo('sleeve-knife')],
    { exhaust: true },
  ),
  q('uncommon', 'hidden-palm', 'Hidden Palm', 'power', 1, 'none', [on('discard', [barrier(3)])]),
  q('rare', 'flaying-spree', 'Flaying Spree', 'attack', 2, 'foe', [
    scaled({ op: 'damage', amount: 8, to: 'target' }, per('discarded', 1, undefined, 'hits')),
  ]),
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
  q('rare', 'encore', 'Encore', 'skill', 1, 'none', [status('mirrored', 1), draw(1)]),
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
  q('common', 'showmans-flourish', "Showman's Flourish", 'attack', 1, 'foe', [
    scaled(dmg(4), per('skillsPlayed', 4)),
  ]),
  q('common', 'dart-throw', 'Dart Throw', 'attack', 1, 'foe', [dmg(7), discard(1), draw(2)]),
  q('common', 'quick-draw', 'Quick Draw', 'skill', 1, 'none', [
    barrier(3),
    draw(1),
    addTo('sleeve-knife'),
  ]),
  q(
    'rare',
    'adrenaline-rush',
    'Cold Sweat',
    'skill',
    0,
    'none',
    [mana(1), draw(1), addTo('sleeve-knife')],
    {
      exhaust: true,
    },
  ),
  q('rare', 'tricks-of-the-trade', 'Tradecraft', 'power', 1, 'none', [on('turnStart', [draw(1)])]),

  // (Sleight, round three)
  q('uncommon', 'magicians-exit', "Magician's Exit", 'skill', 1, 'none', [
    discard(9, 'any'),
    scaled(barrier(0), per('discarded', 4)),
  ]),
  q('common', 'loaded-die', 'Loaded Die', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [dmg(6, 'allFoes')],
  }),
  q('uncommon', 'fortunes-edge', "Fortune's Edge", 'attack', 1, 'foe', [
    scaled(dmg(6), per('discarded', 3)),
  ]),
  q('rare', 'jokers-gambit', "Joker's Gambit", 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [addTo('sleeve-knife', 3)],
  }),
  q('rare', 'showy-reflex', 'Showy Reflex', 'power', 1, 'none', [
    on('discard', [dmg(4, 'randomFoe')]),
  ]),

  // --- glue: cards for any build path (DECISIONS #337) ---
  q('common', 'tangle-wire', 'Tangle Wire', 'attack', 1, 'foe', [
    dmg(8),
    status('faltering', 1, 'target'),
  ]),
  q('uncommon', 'quick-hands', 'Quick Hands', 'skill', 0, 'none', [draw(2), discard(2)], {
    up: { effects: [draw(2), discard(2), barrier(3)] },
  }),
  q('common', 'cold-open', 'Cold Open', 'attack', 0, 'foe', [dmg(6), discard(1)]),

  // --- more glue: uncommons and rares for any build path (DECISIONS #339) ---
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

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  q('uncommon', 'whetstone-pass', 'Whetstone Pass', 'skill', 0, 'none', [
    status('edge', 2, 'self', true),
  ]),
  q('uncommon', 'rising-tempo', 'Rising Tempo', 'attack', 0, 'foe', [
    scaled(dmg(2), per('played', 1)),
  ]),
  q('uncommon', 'noxious-haze', 'Noxious Haze', 'power', 1, 'none', [
    on('turnStart', [status('seared', 3, 'randomFoe')]),
  ]),
  q('uncommon', 'blur-step', 'Blur Step', 'skill', 1, 'none', [
    discard(9, 'any'),
    status('twinned', 1),
  ]),
  q('uncommon', 'careful-plan', 'Careful Plan', 'skill', 1, 'none', [
    draw(1),
    status('holdfast', 1),
  ]),
  q('rare', 'countless-nicks', 'Countless Nicks', 'power', 2, 'none', [
    on('play', [status('seared', 1, 'randomFoe')]),
  ]),
  q('rare', 'plague-cloud', 'Plague Cloud', 'skill', 2, 'none', [status('seared', 9, 'allFoes')], {
    exhaust: true,
  }),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  q('uncommon', 'palmed-card', 'Palmed Card', 'skill', 0, 'none', [discoverOp('attack')], {
    exhaust: true,
    up: { effects: [discoverOp('attack', 1, true)] },
  }),
];
