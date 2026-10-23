// Quill, the Knife-Dancer (Umbral). No companions. The Silent of the roster: three lanes that mix.
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
  q('common', 'shiv', 'Shiv', 'attack', 0, 'foe', [dmg(4)], {
    exhaust: true,
    tags: ['shiv'],
    source: 'token',
  }),

  // --- Shivs ---
  q('common', 'blade-dance', 'Blade Dance', 'skill', 1, 'none', [addTo('shiv', 3)]),
  q('common', 'cloak-and-dagger', 'Cloak and Dagger', 'skill', 1, 'none', [barrier(6), addTo('shiv')]),
  q('common', 'knife-roll', 'Knife Roll', 'skill', 0, 'none', [addTo('shiv', 2)], { exhaust: true }),
  q('common', 'dagger-spray', 'Dagger Spray', 'attack', 1, 'none', [dmg(4, 'allFoes', 2)]),
  q('common', 'throwing-knives', 'Throwing Knives', 'attack', 1, 'foe', [dmg(3, 'target', 3)]),
  q('uncommon', 'infinite-blades', 'Infinite Blades', 'power', 1, 'none', [
    on('turnStart', [addTo('shiv')]),
  ]),
  q('uncommon', 'accuracy', 'Accuracy', 'power', 1, 'none', [status('edge', 3)]),
  q('uncommon', 'fan-of-knives', 'Fan of Knives', 'power', 2, 'none', [
    on('play', [dmg(3, 'allFoes')], { tag: 'shiv' }),
  ]),
  q('uncommon', 'storm-of-steel', 'Storm of Steel', 'skill', 1, 'none', [
    discard(9),
    addTo('shiv', 0, 'hand', per('discarded')),
  ]),
  q('uncommon', 'finisher', 'Finisher', 'attack', 1, 'foe', [
    scaled(
      { op: 'damage', amount: 6, hits: 0, to: 'target' },
      per('attacksPlayed', 1, undefined, 'hits'),
    ),
  ]),
  q('rare', 'thousand-cuts', 'Thousand Cuts', 'power', 2, 'none', [on('play', [dmg(1, 'allFoes')])]),

  // --- Seared ---
  q('common', 'needle-jab', 'Needle Jab', 'attack', 0, 'foe', [dmg(4), status('seared', 1, 'target')]),
  q('common', 'deadly-venom', 'Deadly Venom', 'skill', 1, 'foe', [status('seared', 5, 'target')]),
  q('common', 'crippling-cloud', 'Crippling Cloud', 'skill', 2, 'none', [
    status('seared', 4, 'allFoes'),
    status('faltering', 2, 'allFoes'),
  ]),
  q('common', 'bouncing-flask', 'Bouncing Flask', 'skill', 2, 'none', [
    status('seared', 3, 'randomFoe'),
    status('seared', 3, 'randomFoe'),
    status('seared', 3, 'randomFoe'),
  ]),
  q('uncommon', 'mindrot', 'Mindrot', 'skill', 1, 'foe', [
    status('seared', 4, 'target'),
    status('exposed', 1, 'target'),
  ]),
  q('uncommon', 'catalyst', 'Catalyst', 'skill', 1, 'foe', [doubleSt('seared', 'target')], {
    exhaust: true,
  }),
  q('uncommon', 'noxious-fumes', 'Noxious Fumes', 'power', 1, 'none', [
    on('turnStart', [status('seared', 2, 'allFoes')]),
  ]),
  q('uncommon', 'envenom', 'Envenom', 'power', 1, 'none', [
    on('play', [status('seared', 1, 'target')], { tag: 'shiv' }),
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
  q('common', 'prepared', 'Prepared', 'skill', 0, 'none', [draw(1), discard(1)]),
  q('common', 'acrobatics', 'Acrobatics', 'skill', 1, 'none', [draw(3), discard(1)]),
  q('common', 'backflip', 'Backflip', 'skill', 1, 'none', [barrier(5), draw(2)]),
  q('uncommon', 'reflex', 'Reflex', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [draw(2)],
  }),
  q('uncommon', 'tactician', 'Tactician', 'skill', 0, 'none', [], {
    unplayable: true,
    onDiscard: [mana(1)],
  }),
  q('uncommon', 'concentrate', 'Concentrate', 'skill', 0, 'none', [discard(3), mana(2)]),
  q('uncommon', 'calculated-gamble', 'Calculated Gamble', 'skill', 0, 'none', [
    discard(9),
    scaled(draw(0), per('discarded')),
  ], { exhaust: true }),
  q('uncommon', 'hidden-palm', 'Hidden Palm', 'power', 1, 'none', [on('discard', [barrier(2)])]),
  q('uncommon', 'eviscerate', 'Eviscerate', 'attack', 2, 'foe', [
    scaled({ op: 'damage', amount: 7, to: 'target' }, per('discarded', 1, undefined, 'hits')),
  ]),
  q('rare', 'after-image', 'After Image', 'power', 1, 'none', [on('play', [barrier(1)])]),
];
