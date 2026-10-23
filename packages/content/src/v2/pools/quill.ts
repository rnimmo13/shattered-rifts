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
  mana,
  on,
  per,
  pool,
  scaled,
  status,
  loseHpScaled,
} from '../build';

const q = pool('quill', 'umbral');

export const QUILL: CardDef[] = [
  // --- basics and the token ---
  q('basic', 'quick-jab', 'Quick Jab', 'attack', 0, 'foe', [dmg(3), status('faltering', 1, 'target')]),
  q('basic', 'slip-away', 'Slip Away', 'skill', 1, 'none', [barrier(7), discard(1)]),
  q('common', 'sleeve-knife', 'Sleeve Knife', 'attack', 0, 'foe', [dmg(4)], {
    exhaust: true,
    tags: ['knife'],
    source: 'token',
  }),

  // --- Shivs ---
  q('common', 'palmed-knives', 'Palmed Knives', 'skill', 1, 'none', [addTo('sleeve-knife', 3)]),
  q('common', 'hidden-blade', 'Hidden Blade', 'skill', 1, 'none', [barrier(6), addTo('sleeve-knife')]),
  q('common', 'sleeve-flick', 'Sleeve Flick', 'skill', 0, 'none', [addTo('sleeve-knife', 2)], { exhaust: true }),
  q('common', 'whirling-knives', 'Whirling Knives', 'attack', 1, 'none', [dmg(4, 'allFoes', 2)]),
  q('common', 'knife-volley', 'Knife Volley', 'attack', 1, 'foe', [dmg(3, 'target', 3)]),
  q('uncommon', 'endless-edges', 'Endless Edges', 'power', 1, 'none', [
    on('turnStart', [addTo('sleeve-knife')]),
  ]),
  q('uncommon', 'keen-edge', 'Keen Edge', 'power', 1, 'none', [status('edge', 3)]),
  q('uncommon', 'razor-halo', 'Razor Halo', 'power', 2, 'none', [
    on('play', [dmg(3, 'allFoes')], { tag: 'knife' }),
  ]),
  q('uncommon', 'empty-the-sleeves', 'Empty the Sleeves', 'skill', 1, 'none', [
    discard(9),
    addTo('sleeve-knife', 0, 'hand', per('discarded')),
  ]),
  q('uncommon', 'killing-flourish', 'Killing Flourish', 'attack', 1, 'foe', [
    scaled(
      { op: 'damage', amount: 6, hits: 0, to: 'target' },
      per('attacksPlayed', 1, undefined, 'hits'),
    ),
  ]),
  q('rare', 'countless-nicks', 'Countless Nicks', 'power', 2, 'none', [on('play', [dmg(1, 'allFoes')])]),

  // --- Seared ---
  q('common', 'needle-jab', 'Needle Jab', 'attack', 0, 'foe', [dmg(4), status('seared', 1, 'target')]),
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
  q('uncommon', 'flashpoint', 'Flashpoint', 'skill', 1, 'foe', [doubleSt('seared', 'target')], {
    exhaust: true,
  }),
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
  q('uncommon', 'cash-in', 'Cash In', 'skill', 1, 'foe', [loseHpScaled(per('seared', 1, 'target'))], {
    exhaust: true,
  }),
  q('rare', 'plague-bloom', 'Plague Bloom', 'skill', 2, 'none', [doubleSt('seared', 'allFoes', 3)], {
    exhaust: true,
  }),
  q(
    'rare',
    'nightfall',
    'Nightfall',
    'skill',
    3,
    'none',
    [status('seared', 5, 'allFoes'), status('exposed', 2, 'allFoes')],
    { exhaust: true },
  ),

  // --- Sleight ---
  q('common', 'quick-hands', 'Quick Hands', 'skill', 0, 'none', [draw(1), discard(1)]),
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
  q('uncommon', 'fold-the-hand', 'Fold the Hand', 'skill', 0, 'none', [discard(3), mana(2)]),
  q('uncommon', 'all-in', 'All In', 'skill', 0, 'none', [
    discard(9),
    scaled(draw(0), per('discarded')),
  ], { exhaust: true }),
  q('uncommon', 'hidden-palm', 'Hidden Palm', 'power', 1, 'none', [on('discard', [barrier(2)])]),
  q('uncommon', 'flaying-spree', 'Flaying Spree', 'attack', 2, 'foe', [
    scaled({ op: 'damage', amount: 7, to: 'target' }, per('discarded', 1, undefined, 'hits')),
  ]),
  q('rare', 'lingering-step', 'Lingering Step', 'power', 1, 'none', [on('play', [barrier(1)])]),
  q('common', 'poisoned-needle', 'Poisoned Needle', 'snare', 1, 'none', [
    dmg(3, 'attacker'),
    status('seared', 4, 'attacker'),
  ], { trigger: { on: 'attacked' } }),
  q('uncommon', 'knife-in-the-dark', 'Knife in the Dark', 'snare', 1, 'none', [
    dmg(5, 'attacker'),
    addTo('sleeve-knife', 2),
  ], { trigger: { on: 'foeDefends' } }),
  q('uncommon', 'encore', 'Encore', 'skill', 1, 'none', [status('mirrored', 1)]),
  q('uncommon', 'palmed-card', 'Palmed Card', 'skill', 0, 'none', [discoverOp('attack')], {
    exhaust: true,
    up: { effects: [discoverOp('attack', 1, true)] },
  }),
  q('uncommon', 'nimble-hands', 'Nimble Hands', 'skill', 0, 'none', [cheapen(1, 'random'), draw(1)], {
    exhaust: true,
  }),
];
