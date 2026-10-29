// The Shaman's hand prices (docs/reworks/shaman-ledger.md is generated from these). New rates (docs/14_CARD_COSTING.md §15): one
// command a turn whatever he has planted, so a plant is priced for the choice it adds, not for a command: a kind he does not have yet
// 2 (the starter's Bear, the Elder), one he probably has (a Hawk: the trait plants one) 1, a plant into a chosen position 1.5. Rousing
// 0.8 a point (it lands on the next Hawk or Bear command; x0.85 behind "if you have a Hawk/Bear"); Spirit gained 1.8 a point (it is
// spent for +2 on a later command, capped at 3); a spend pays its payoff minus 1.8 a point, at ~2 Spirit. "Whenever you command" fires
// about once a turn; "your Hawk" about 65% of turns in a Hawk deck, "your Bear" about half.

import type { Price } from './common';

export const SHAMAN_PRICES: Record<string, Price> = {
  // (the starter)
  'wardkeepers-pact': {
    pts: 8,
    up: 10.4,
    how: '5 Barrier 6 + plant a Bear (a new kind) 2',
    role: 'the starter defence: a second spirit to choose from on turn 1',
  },
  'guided-talon': {
    pts: 8.04,
    up: 11.04,
    how: '6 + Rousing 3 if a Hawk (2.4 x0.85)',
    role: 'the starter attack: a 7-damage Hawk command the same turn',
  },
  // (glue)
  'stone-skin': { pts: 10.8, up: 14.4, how: '9 Barrier', role: 'glue' },
  'gale-strike': {
    pts: 11,
    up: 14,
    how: '8 + costs 1 less for the fight 3',
    role: 'glue (was 11: the cost cut was free)',
  },
  'ember-toss': { pts: 10.8, up: 14.7, how: '6 to ALL 7.8 + draw 3', role: 'glue: many enemies' },
  mudslide: { pts: 10, up: 13, how: '4 x3 12 - a Muck 2', role: 'glue' },
  tidecaller: {
    pts: 12.4,
    up: 16,
    how: '7 Barrier 8.4 + 1 Mana next turn 4',
    role: 'glue: Mana for a big turn',
    why: 'the guide’s own worked example (§9), kept: a strong common it names as such',
  },
  'arc-flash': { pts: 6, up: 8, how: '3 + 1 Exposed 3', role: 'glue' },
  'frost-needle': {
    pts: 6.1,
    up: 8.1,
    how: '4 + 1 Faltering if attacking (3 x0.7)',
    role: 'glue',
  },
  'spirit-memory': {
    pts: 10.2,
    up: 13.8,
    how: '6 Barrier 7.2 + a random card back 3',
    role: 'glue (no longer Consumes)',
  },
  'clear-spring': { pts: 11, up: 13, how: 'draw 3 (3 + 4 + 4); + a 4th at half', role: 'glue' },
  'crystal-ward': {
    pts: 15.5,
    up: 19.1,
    how: '10 Barrier 12 + Opening hand 3.5',
    role: 'glue',
    consume: true,
    why: 'the guide’s example (§6) of a 0-cost Consume Opening-hand card carrying a 1-cost budget (11.2): +38% on that, unchanged',
  },
  ironbark: { pts: 11.6, up: 16.4, how: '13 Barrier 15.6 - 2 Wounds 4', role: 'glue' },
  skybreaker: { pts: 28, up: 36, how: '26 + if fatal 1 Mana ~2', role: 'glue: the heavy hit' },
  // (Storm: the Hawk on the attack)
  'spark-cast': {
    pts: 9,
    up: 10.6,
    how: 'plant a Hawk (often a second) 1 + Rousing 4 3.2 + 4 Barrier 4.8',
    role: 'Storm: an 8-damage command now',
  },
  'spark-lash': {
    pts: 9.6,
    up: 12.6,
    how: '7 + plant a Hawk 1 + Rousing 2 1.6',
    role: 'Storm: attack and set up',
  },
  'charged-blow': {
    pts: 8.8,
    up: 11,
    how: '4 a totem x ~2.2 (no Might source in the class)',
    role: 'Storm/Rites: pays for planting',
  },
  'hawkeye-strike': {
    pts: 10.55,
    up: 13.55,
    how: '8 + 1 Exposed if a Hawk (3 x0.85)',
    role: 'Storm: a reason to keep a Hawk',
  },
  'diving-talon': {
    pts: 17.2,
    up: 21.2,
    how: '14 + Rousing 4 3.2',
    role: 'Storm: the heavy attack',
  },
  'hawks-counsel': {
    pts: 10.3,
    up: 12.1,
    how: 'plant a Hawk where you choose 1.5 + 1 Spirit 1.8 + draw 2 (7)',
    role: 'Storm/Rites: move the Hawk in, with cards',
  },
  stormcrown: {
    pts: 13.5,
    up: 16.9,
    how: '4 turns x Hawk commanded ~65% x 4 to ALL (5.2)',
    role: 'Storm: the Hawk payoff',
  },
  'arc-lightning': {
    pts: 6.55,
    up: 8.55,
    how: '4 + 3 if a Hawk (x0.85)',
    role: 'Storm: a free hit',
  },
  thunderhead: {
    pts: 18.3,
    up: 22.2,
    how: '12 to ALL 15.6 + Rousing 4 if a Hawk (3.2 x0.85)',
    role: 'Storm: many enemies',
  },
  'eye-of-the-tempest': {
    pts: 23.7,
    up: 29.7,
    how: '7 x3 + Rousing 4 if a Hawk 2.7',
    role: 'Storm: many hits',
  },
  'stormcallers-rite': {
    pts: 11.2,
    up: 13.6,
    how: 'Rousing 8 6.4 + 1 Spirit 1.8 + draw 3',
    role: 'Storm: one big command (4 + 8 + 2 = 14 empowered)',
  },
  'falling-star': {
    pts: 33.4,
    up: 39.4,
    how: '24 + 2 Exposed 6 + Rousing 5 if a Hawk 3.4',
    role: 'Storm: the boss hit',
  },
  // (Shelter: the Bear and Barrier)
  'rime-strike': {
    pts: 11.1,
    up: 14.1,
    how: '6 + 3 Barrier 3.6 + plant a Bear 1.5',
    role: 'Shelter: attack, guard and plant',
  },
  'chilled-focus': {
    pts: 9.45,
    up: 13.05,
    how: '6 Barrier 7.2 + draw if a Bear (3 x0.75)',
    role: 'Shelter: a reason to keep a Bear',
  },
  frostbark: {
    pts: 10,
    up: 13.6,
    how: '7 Barrier 8.4 + Rousing 2 1.6',
    role: 'Shelter: guard now, a bigger command',
  },
  'bear-hug': {
    pts: 10.6,
    up: 13.6,
    how: '7 + 4 Barrier if a Bear (4.8 x0.75)',
    role: 'Shelter: an attack that guards',
  },
  'shared-shelter': {
    pts: 10.7,
    up: 14.3,
    how: '6 Barrier 7.2 + Shelter ~0.5 (he has no companions of his own) + draw 3',
    role: 'Shelter: companions from Neutral cards share the Bear',
  },
  frostglass: {
    pts: 18.3,
    up: 21.9,
    how: '12 Barrier 14.4 + plant a Bear 1.5 + Rousing 3 2.4',
    role: 'Shelter: heavy defence',
  },
  'void-pulse': {
    pts: 19.2,
    up: 24.8,
    how: '11 Barrier 13.2 + 6 next turn 6',
    role: 'Shelter: two turns of defence',
  },
  permafrost: {
    pts: 16.6,
    up: 20.8,
    how: '4 turns x a Bear ~80% x 4 to ALL (5.2)',
    role: 'Shelter: pays for keeping a Bear',
  },
  'rune-carapace': {
    pts: 21.1,
    up: 24.6,
    how: '4 turns x 2 Barrier a totem x ~2.2 (2.4 a point); + Opening hand 3.5',
    role: 'Shelter/Rites: pays for planting',
  },
  'ancestral-bulwark': {
    pts: 20.9,
    up: 25.7,
    how: '14 Barrier 16.8 + Rousing 6 if a Bear (4.8 x0.85)',
    role: 'Shelter: heavy defence and a 10-Barrier command',
  },
  'deep-freeze': {
    pts: 31.5,
    up: 36.5,
    how: '18 + 10 Barrier 12 + plant a Bear 1.5',
    role: 'Shelter: the heavy hit',
  },
  'roar-of-the-den': {
    pts: 17.8,
    up: 23,
    how: '4 turns x Bear commanded ~50% x (2 Barrier 2.4 + 5 to ALL 6.5)',
    role: 'Shelter: the Bear payoff',
  },
  // (Rites: Spirit, the Elder, replacement and uprooting)
  'gathering-dusk': {
    pts: 8.6,
    up: 10.4,
    how: 'plant an Elder 2 + 1 Spirit 1.8 + 4 Barrier 4.8',
    role: 'Rites: the Elder',
  },
  'resonant-strike': {
    pts: 9.8,
    up: 12.8,
    how: '8 + 1 Spirit 1.8',
    role: 'Rites: attack and Spirit',
  },
  'tune-the-spirits': {
    pts: 9.6,
    up: 13.2,
    how: '2 Spirit 3.6 + 5 Barrier 6',
    role: 'Rites: Spirit for two empowered commands',
  },
  'driver-of-runes': {
    pts: 8.8,
    up: 11.8,
    how: '7 + draw if an Elder (3 x0.6)',
    role: 'Rites: a reason to keep an Elder',
  },
  'ancestral-exchange': {
    pts: 10.2,
    up: 13.8,
    how: '4 Barrier 4.8 + plant any kind anywhere 2 + (1 Spirit + draw) 4.8 when the kind changed ~70%',
    role: 'Rites: deliberate replacement',
  },
  'rite-of-returning': {
    pts: 14,
    up: 17.5,
    how: '4 turns x a card next turn 3.5 (one command a turn); + Opening hand 3.5',
    role: 'Rites: every command a card',
  },
  'resounding-call': {
    pts: 20.4,
    up: 24,
    how: 'Rousing 6 4.8 + 2 Spirit 3.6 + 10 Barrier 12',
    role: 'Rites/Shelter: defence and a big command',
  },
  'elders-wisdom': {
    pts: 10.6,
    up: 14.2,
    how: '6 Barrier 7.2 + (a card 3.5 - 1.8) a Spirit x ~2',
    role: 'Rites: Spirit into cards',
  },
  'chorus-of-glyphs': {
    pts: 9.8,
    up: 11.8,
    how: '4 a kind x ~2 + 1 Spirit 1.8',
    role: 'Rites: pays for different spirits',
  },
  'spirit-drum': {
    pts: 16.8,
    up: 21.6,
    how: '4 turns x (1 Spirit 1.8 + 2 Barrier 2.4)',
    role: 'Rites: an empowered command most turns',
  },
  'circle-of-ancestors': {
    pts: 22.6,
    up: 26.1,
    how: '4 turns x a replacement ~50% x (1 Spirit 1.8 + draw 3 + 5 to ALL 6.5); + Opening hand 3.5',
    role: 'Rites: the replacement payoff',
  },
  'tune-the-lattice': {
    pts: 11,
    up: 15,
    how: '3 Spirit (the cap: ~2.2 of it new) 4 + draw 2 (7)',
    role: 'Rites: fill the Spirit',
  },
  'world-tree': {
    pts: 21.6,
    up: 26.4,
    how: '4 turns x (1 Spirit 1.8 + 3 Barrier 3.6)',
    role: 'Rites: steady Spirit',
  },
  spiritstorm: {
    pts: 12,
    up: 15.9,
    how: '4 to ALL 5.2 + (4 to ALL 5.2 - 1.8) a Spirit x ~2',
    role: 'Rites: the Spirit finisher',
  },
  'shatter-the-row': {
    pts: 14.5,
    up: 17.75,
    how: '6 to ALL a totem x ~2.5 (19.5) - losing them ~2 each (5): no command until he plants again',
    role: 'Rites: uproot for a burst',
    consume: true,
  },
};
