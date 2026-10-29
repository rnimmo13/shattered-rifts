// The Monk's hand prices (docs/reworks/monk-ledger.md is generated from these). New rates (docs/14_CARD_COSTING.md §15): Mastery comes
// from completing his form's technique (the trait, at most once a turn: ~60% of turns with the starter, ~80% in a technique deck), so a
// spender is paid 0.8 of its payoff a point at the Mastery there usually is (~1.5 for "up to 2", ~0.9 for "up to 1"); Mastery a card
// gives 2.5. A card's technique tag is priced at nothing (the completion it enables is the trait's). A form change 1 (a chosen one
// 1.5). "If this is your first technique" and "if you played a Defensive technique" x0.65; "if you completed your technique" and "in
// <form>" x0.5; "whenever you complete your technique" ~0.75 a turn; a Defensive or a Striking technique played ~1.2 a turn each.

import type { Price } from './common';

export const MONK_PRICES: Record<string, Price> = {
  // (the starter)
  'kindle-fury': {
    pts: 8.9,
    up: 11.9,
    how: '6 + 4 for up to 1 Mastery (x0.9 x0.8)',
    role: 'the starter Striking technique, and its Mastery spender',
  },
  'still-guard': {
    pts: 7.2,
    up: 9.6,
    how: '6 Barrier',
    role: 'the starter Defensive technique (with Planted Heel, a Root pair)',
  },
  // (glue)
  'settle-the-root': {
    pts: 9.4,
    up: 13,
    how: '7 Barrier 8.4 + enter Root 1',
    role: 'Root: choose the form',
  },
  'find-the-current': {
    pts: 10.4,
    up: 14,
    how: '2 Barrier 2.4 + draw 2 (7) + enter Current 1',
    role: 'Current: choose the form',
  },
  'stoke-the-ember': {
    pts: 11,
    up: 14,
    how: '7 + 1 Exposed 3 + enter Ember 1',
    role: 'Ember: choose the form (not a technique itself)',
  },
  'read-the-rhythm': {
    pts: 10.3,
    up: 13.9,
    how: '4 Barrier 4.8 + Foresee 3 (3 + 1) + a form of your choice 1.5',
    role: 'glue: plan the hand and adapt the form',
  },
  'inner-sight': {
    pts: 10.5,
    up: 14.1,
    how: '5 Barrier 6 + Foresee 4 (3 + 1.5)',
    role: 'glue: find the pair',
  },
  'deep-breath': {
    pts: 15,
    up: 19,
    how: '2 Mana next turn 8 + draw 2 (7)',
    role: 'glue: a big next turn',
    consume: true,
  },
  'held-breath': {
    pts: 10.4,
    up: 14,
    how: '7 Barrier 8.4 + Holdfast ~2',
    role: 'Current: keep a pair for next turn',
  },
  'cornered-beast': {
    pts: 11.41,
    up: 13.51,
    how: '(9 + 4 Barrier 4.8 + 1 Mastery 2.5) x0.7 (a Trap: 5+ HP lost)',
    role: 'glue: his Trap',
  },
  scrawl: {
    pts: 15,
    up: 17,
    how: 'draw 5 (3 + 4 + 4 + 2 + 2)',
    role: 'glue',
    consume: true,
  },
  'perfected-motion': {
    pts: 19.8,
    up: 23.3,
    how: '4 turns x a completion ~75% x (draw 3 + 3 Barrier 3.6); + Opening hand 3.5',
    role: 'any form: the completion payoff (no Mana)',
  },
  'grandmasters-patience': {
    pts: 18,
    up: 24,
    how: '4 turns x 3 Mastery held ~30% x (6 Barrier 7.2 + 6 to ALL 7.8)',
    role: 'Root/Ember: pays for holding Mastery instead of spending it',
  },
  // (Root: discipline)
  'planted-heel': {
    pts: 8.76,
    up: 11.16,
    how: '6 Barrier 7.2 + 2 if the first technique (2.4 x0.65)',
    role: 'Root/Current: the opening step',
  },
  'iron-shirt': { pts: 9.6, up: 13.2, how: '8 Barrier', role: 'Root: a plain Defensive technique' },
  'centre-yourself': {
    pts: 6,
    up: 8.4,
    how: '5 Barrier',
    role: 'Root: a free Defensive step',
  },
  'bowing-low': {
    pts: 6.6,
    up: 9,
    how: '3 Barrier 3.6 + Foresee 1 (3)',
    role: 'Root: a free step that finds the next',
    consume: true,
  },
  'rooted-resolve': {
    pts: 12.3,
    up: 15.9,
    how: '7 Barrier 8.4 + (2 Barrier 2.4 + draw 3) for up to 1 Mastery (x0.9 x0.8)',
    role: 'Root: the defensive spender',
  },
  'shield-of-faith': {
    pts: 11.86,
    up: 15.46,
    how: '7 Barrier 8.4 + 4 Barrier for up to 1 Mastery (4.8 x0.9 x0.8)',
    role: 'Root: the defensive spender',
  },
  'still-water': {
    pts: 11.1,
    up: 14.7,
    how: '8 Barrier 9.6 + draw if completed (3 x0.5)',
    role: 'Root: rewards the finished pair',
  },
  'perfect-calm': {
    pts: 22.56,
    up: 27.36,
    how: '14 Barrier 16.8 + 4 Barrier a Mastery up to 2 (4.8 x1.5 x0.8)',
    role: 'Root: the heavy defensive spender',
  },
  'spirit-shield': {
    pts: 20.4,
    up: 24,
    how: '8 + 3 a card in hand (~3) = 17 Barrier',
    role: 'Root: defence for a full hand',
  },
  'unbroken-calm': {
    pts: 19.2,
    up: 24,
    how: '4 turns x (3 Barrier 3.6 + draw in Root ~40% 1.2)',
    role: 'Root: steady defence',
  },
  'breath-between-blows': {
    pts: 17.3,
    up: 23,
    how: '4 turns x ~1.2 Defensive techniques x 3 Barrier 3.6',
    role: 'Root: pays for each Defensive technique',
  },
  // (Current: flow)
  'deflecting-palm': {
    pts: 10,
    up: 13,
    how: '4 + 5 Barrier 6',
    role: 'Current: a Defensive technique that hits',
  },
  'swift-step': {
    pts: 10.2,
    up: 13.8,
    how: '6 Barrier 7.2 + draw 3',
    role: 'Current: step and find',
  },
  'flowing-step': {
    pts: 8.7,
    up: 12.3,
    how: '6 Barrier 7.2 + draw in Current (3 x0.5)',
    role: 'Current: a reason to stay in it',
  },
  vigilance: {
    pts: 9.5,
    up: 13.1,
    how: '5 Barrier 6 + Foresee 2 (3 + 0.5)',
    role: 'Current: plan',
  },
  'turning-palm': {
    pts: 9.6,
    up: 12.6,
    how: '7 + 4 after a Defensive technique (x0.65)',
    role: 'Current: the second step',
  },
  redirect: {
    pts: 9.12,
    up: 12.12,
    how: '6 + 4 Barrier after a Defensive technique (4.8 x0.65)',
    role: 'Current: the second step that guards',
  },
  fearless: {
    pts: 10.8,
    up: 13.8,
    how: '6 + 4 Barrier 4.8',
    role: 'Current: a Striking technique that guards',
  },
  'open-palm': {
    pts: 10,
    up: 12,
    how: '5 x2 (no Might source in the class)',
    role: 'Current/Ember',
  },
  'foretold-flame': {
    pts: 12.1,
    up: 15.1,
    how: '5 + 3 a Mastery up to 2 (x1.5 x0.8) 3.6 + Foresee 2 3.5',
    role: 'Current: spend and plan',
  },
  'river-turns': {
    pts: 15.4,
    up: 20.2,
    how: '4 turns x (~1.2 Defensive x 1 Barrier 1.2 + ~1.2 Striking x 2 damage)',
    role: 'Current: pays for alternating',
  },
  'unmoved-mind': {
    pts: 15.6,
    up: 19.5,
    how: '4 turns x a completion ~75% x 4 to ALL (5.2)',
    role: 'any form: the completion payoff',
  },
  'wreath-of-flame': {
    pts: 11.45,
    up: 15.05,
    how: '6 Barrier 7.2 + draw 3 + 1 Mastery if completed (2.5 x0.5)',
    role: 'Current/Ember: the one card that adds Mastery',
  },
  // (Ember: pressure)
  'ember-step': {
    pts: 10,
    up: 13,
    how: '7 + 1 Exposed 3',
    role: 'Ember: a step that opens the target',
  },
  'crushing-palm': { pts: 11, up: 14, how: '8 + 1 Faltering 3', role: 'Ember' },
  'flurry-of-palms': { pts: 6, up: 8, how: '3 x2', role: 'Ember: a free step' },
  'quick-palms': { pts: 6, up: 8, how: '6', role: 'Ember: a free step' },
  'sunlit-blade': { pts: 9, up: 12, how: '9', role: 'Ember' },
  'focused-strike': {
    pts: 9.5,
    up: 12.5,
    how: '8 + 3 in Ember (x0.5)',
    role: 'Ember: a reason to stay in it',
  },
  'ashen-fist': { pts: 17, up: 21, how: '14 + 1 Exposed 3', role: 'Ember: the heavy step' },
  'angry-palm': {
    pts: 9.6,
    up: 12.6,
    how: '6 + 5 for up to 1 Mastery (x0.9 x0.8)',
    role: 'Ember: the cheap spender',
  },
  'red-mist': {
    pts: 9.1,
    up: 11.7,
    how: '7 to ALL x1.3',
    role: 'Ember/Current: many enemies (no single target: not an Ember step)',
  },
  'mountain-breaker': {
    pts: 19.6,
    up: 24.6,
    how: '16 + 3 a Mastery up to 2 (x1.5 x0.8)',
    role: 'Ember: the finisher (upgrade raises the base, not the rate)',
  },
  'wheel-kick': { pts: 21, up: 25, how: '12 + 2 Exposed 6 + draw 3', role: 'Ember' },
  'temper-flare': { pts: 12, up: 15, how: '3 x3 + 1 Exposed 3', role: 'Ember' },
  'masters-flourish': {
    pts: 6,
    up: 7.2,
    how: '5 a Mastery up to 2 (x1.5 x0.8)',
    role: 'Ember: a free spender',
  },
  'thousand-palms': {
    pts: 21,
    up: 28,
    how: '3 x7 (no Might or Primed in the class now)',
    role: 'Ember',
  },
  'final-account': {
    pts: 31.2,
    up: 37.2,
    how: '24 + 6 a Mastery up to 2 (x1.5 x0.8)',
    role: 'Ember: the boss finisher',
  },
  'rage-of-ages': {
    pts: 31.2,
    up: 35.1,
    how: '8 x3 to ALL (24 x1.3)',
    role: 'Ember: many enemies',
  },
  'last-rites-of-flame': {
    pts: 30.94,
    up: 37.44,
    how: '19 to ALL 24.7 + 4 to ALL a Mastery up to 2 (5.2 x1.5 x0.8)',
    role: 'Ember: the spender for many enemies',
  },
};
