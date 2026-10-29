// The Shaman's hand prices (docs/reworks/shaman-ledger.md is generated from these), for the second rework (DECISIONS #420, #421). New
// rates (docs/14_CARD_COSTING.md §15): an element tag 0 (the totems' help on the first spell of each element is the trait's); Spirit
// gained 5 a point (it never goes down, +1 to every command and +1 per 2 to every totem's help, about a point of Might for the rest of
// the fight); a command (only cards command, #421) is worth its spirit's act: a Hawk's dive 5.4 (6 at random), a Bear's 6 (5 Barrier),
// a Thunderbird's 3.9 (3 to all), ~5.3 for a random totem, ~6 for one of your choice, plus the Spirit he has; a plant ~1.5 (he starts
// with three totems, so a plant is usually a replacement); a totem position ~2; Thorns until the enemy turn ends 1.5 a stack; Sapped on
// every enemy for a turn ~1.56 a point; Faltering on every enemy 3.9, on a random one 2.7; a random-enemy hit 0.9 a point; Burn as
// Bleed by the guide. 'Whenever you cast a Flame / Storm spell' ~1.2 a turn; Trinity ~55% of turns in a deck built for it; 'whenever
// you command' ~1.2 a turn. A command over a fight is weighed early 40% (one totem of the kind, 0 Spirit), mid 40% (two, 3 Spirit), late
// 20% (3-4, 7 Spirit), so "a Hawk" ~7.7, "a Bear" ~9.1, "a Thunderbird" ~7.3, "one of your choice" ~8.2, "a random one" ~7.6, "every
// totem" ~29 (DECISIONS #422). The help on a multi-hit or mixed spell: the first number is the trait's; each further hit or number is
// the card's, at the help x0.6 (the chance it is the first spell of its element that turn).

import type { Price } from './common';

export const SHAMAN_PRICES: Record<string, Price> = {
  // (the starter)
  'ember-bolt': { pts: 7, up: 10, how: '7', role: 'the starter Flame spell' },
  'frost-ward': {
    pts: 8.7,
    up: 12.3,
    how: '5 Barrier 6 + 1 Faltering on a random enemy 2.7',
    role: 'the starter Frost spell',
  },
  'gathering-storm': {
    pts: 7,
    up: 9.9,
    how: '3 to ALL 3.9 + every copy +2 (2 x1.2 x1.3) 3.1',
    role: 'the starter Storm spell: two copies grow each other',
  },
  // (Flame)
  'searing-lash': { pts: 8.95, up: 11.95, how: '7 + 2 Bleed 1.95', role: 'Flame' },
  kindle: {
    pts: 6,
    up: 8,
    how: '4 + 2 with a Hawk (he starts with one: certain)',
    role: 'Flame: a free element',
  },
  firebrand: {
    pts: 9,
    up: 12,
    how: '7 + 4 if the target bleeds (x0.5)',
    role: 'Flame: Bleed payoff',
  },
  'twin-cinders': {
    pts: 9.8,
    up: 13.8,
    how: "4 x2 + the second hit's help when it is the first Flame spell (3 x0.6) 1.8",
    role: 'Flame',
  },
  'flame-spear': { pts: 17, up: 22, how: '17', role: 'Flame: the heavy hit' },
  'flame-shield': {
    pts: 10.5,
    up: 14.1,
    how: '5 Barrier 6 + 3 Thorns 4.5',
    role: 'Flame: the defence (Thorns)',
  },
  immolate: { pts: 19.5, up: 23.5, how: '13 + 4 Bleed 6.5', role: 'Flame: Bleed' },
  'spreading-flames': {
    pts: 12.9,
    up: 15.9,
    consume: true,
    how: '9 + doubling ~3 Bleed already there (at most 10 more) ~3.9',
    role: 'Flame: Bleed payoff',
  },
  'ember-lance': {
    pts: 11,
    up: 14,
    how: '10 + 3 as the first card (~35%)',
    role: 'Flame: the opener',
  },
  'spirit-lance': {
    pts: 10,
    up: 13,
    how: '7 + Spirit (~3 over a fight)',
    role: 'Flame: grows with Spirit',
  },
  'phoenix-feather': {
    pts: 12,
    up: 16,
    how: 'Reverb (the next Flame attack twice ~9) + draw 3',
    role: 'Flame: a big turn',
  },
  'pyre-ward': {
    pts: 20.4,
    up: 25.5,
    how: '12 Barrier 14.4 + 4 Thorns 6',
    role: 'Flame: heavy defence',
  },
  smoulder: {
    pts: 16.8,
    up: 23,
    how: '4 turns x ~1.2 Flame spells x 3 Bleed (~3.5 on a stack)',
    role: 'Flame: the Bleed engine',
  },
  'flash-burn': {
    pts: 16,
    up: 20,
    consume: true,
    how: '4 + 3 a Bleed (~4 in a Flame deck)',
    role: 'Flame: the Bleed finisher',
  },
  'heart-of-the-pyre': {
    pts: 21.6,
    up: 25.9,
    how: '4 turns x ~1.2 Flame spells x 5 to a random enemy (4.5)',
    role: 'Flame: pays for every Flame spell',
  },
  'burning-aegis': {
    pts: 18,
    up: 24,
    how: '4 turns x 3 Thorns (4.5)',
    role: 'Flame: Thorns every turn',
  },
  inferno: { pts: 33.9, up: 41.9, how: '30 + 3 Bleed 3.9', role: 'Flame: the boss finisher' },
  // (Frost)
  'frost-needle': {
    pts: 6.1,
    up: 8.1,
    how: '4 + 1 Faltering if attacking (3 x0.7)',
    role: 'Frost: a free element',
  },
  'rime-shield': {
    pts: 10.8,
    up: 14.4,
    how: '7 Barrier 8.4 + 2 with a Bear (certain: he starts with one) 2.4; the help never adds to an "If" bonus',
    role: 'Frost',
  },
  'chill-touch': { pts: 9, up: 12, how: '6 + 1 Faltering 3', role: 'Frost: offence that blunts' },
  hoarfrost: { pts: 9.9, up: 13.5, how: '5 Barrier 6 + 1 Faltering on ALL 3.9', role: 'Frost' },
  'ice-wall': { pts: 19.2, up: 24, how: '16 Barrier', role: 'Frost: heavy defence' },
  'glacier-guard': { pts: 11.2, up: 15.6, how: '6 Barrier 7.2 + 4 next turn 4', role: 'Frost' },
  'frozen-grasp': { pts: 10.8, up: 14.4, how: '2 Faltering 6 + 4 Barrier 4.8', role: 'Frost' },
  'frost-shatter': {
    pts: 11.4,
    up: 14.4,
    how: '6 + 3 a Faltering on the target (~1.8 in a Frost deck)',
    role: 'Frost: the finisher (pays off the Faltering it spreads)',
  },
  'ice-mirror': {
    pts: 11.2,
    up: 14.8,
    how: '6 Barrier 7.2 + soaked damage dealt back ~4',
    role: 'Frost',
  },
  'winters-embrace': {
    pts: 22.2,
    up: 25.8,
    how: '12 Barrier 14.4 + 2 Faltering on ALL 7.8',
    role: 'Frost: defence for a crowd',
  },
  permafrost: {
    pts: 16.3,
    up: 20.4,
    how: '4 turns x a Bear (~85%) x 4 Barrier 4.8',
    role: 'Frost: steady defence',
  },
  frostbound: {
    pts: 21.6,
    up: 28.8,
    how: '4 turns x ~1.5 debuffs x 3 Barrier 3.6',
    role: 'Frost: pays for Faltering',
  },
  avalanche: {
    pts: 22.1,
    up: 27.3,
    how: '14 to ALL 18.2 + 1 Faltering on ALL 3.9',
    role: 'Frost: offence for a crowd',
  },
  'absolute-zero': {
    pts: 26.7,
    up: 30.6,
    how: '10 to ALL 13 + 3 a Faltering on each (~1.5, x1.3) 5.9 + 2 Faltering on ALL 7.8',
    role: 'Frost: the crowd finisher',
  },
  'glacial-fortress': {
    pts: 34.2,
    up: 41.4,
    how: '22 Barrier 26.4 + 2 Faltering on ALL 7.8',
    role: 'Frost: the boss wall',
  },
  // (Storm)
  'chain-lightning': {
    pts: 10.3,
    up: 13,
    how: '3 x3 at random 8.1 + two more hits of help (2 x2 x0.9 x0.6) 2.2',
    role: 'Storm',
  },
  'static-crackle': { pts: 5.2, up: 6.5, how: '4 to ALL', role: 'Storm: a free element' },
  'gale-call': { pts: 9.5, up: 13.4, how: '5 to ALL 6.5 + draw 3', role: 'Storm' },
  thunderclap: { pts: 19.5, up: 24.7, how: '15 to ALL', role: 'Storm: the heavy hit' },
  'wind-wall': {
    pts: 9.1,
    up: 12.7,
    how: '5 Barrier 6 + 2 Sapped on ALL 3.1',
    role: 'Storm: the defence (Sapped)',
  },
  squall: {
    pts: 10.4,
    up: 14,
    how: '2 x4 at random 7.2 + three more hits of help (3 x2 x0.9 x0.6) 3.2',
    role: 'Storm: multi-hit',
  },
  'storm-front': {
    pts: 12.4,
    up: 15,
    how: '3 x2 to ALL 7.8 + the second hit of help (2 x1.3 x0.6) 1.6 + draw 3',
    role: 'Storm',
  },
  'tempest-call': {
    pts: 10.8,
    up: 14.7,
    how: 'Gathering Storms +2 (2 copies x ~1.5 casts x1.3) 7.8 + draw 3',
    role: 'Storm: the Gathering Storm builder',
  },
  maelstrom: {
    pts: 22.4,
    up: 27.6,
    how: '8 x2 to ALL 20.8 + the second hit of help 1.6',
    role: 'Storm',
  },
  'charged-sky': {
    pts: 20.8,
    up: 24.7,
    how: '10 to ALL 13 + 2 Exposed on ALL 7.8',
    role: 'Storm: opens a crowd',
  },
  'static-veil': {
    pts: 11.9,
    up: 15.5,
    how: '6 Barrier 7.2 + 3 Sapped on ALL 4.7',
    role: 'Storm: defence',
  },
  'lightning-rod': {
    pts: 13,
    up: 17.3,
    how: '4 turns x ~1.2 Storm spells x 3 at random (2.7)',
    role: 'Storm: pays for every Storm spell',
  },
  'eye-of-the-tempest': {
    pts: 24.3,
    up: 30.6,
    how: '3 x6 at random 16.2 + five more hits of help 5.4 + one with a Thunderbird (no help) 2.7',
    role: 'Storm: many hits',
  },
  'storm-sovereign': {
    pts: 18.7,
    up: 25,
    how: '4 turns x ~1.2 commands (a command card can command several) x 3 to ALL 3.9',
    role: 'Storm/commands: the command payoff',
  },
  'calm-before-the-storm': {
    pts: 18.7,
    up: 25,
    how: '4 turns x 3 Sapped on ALL 4.7',
    role: 'Storm: defence every turn',
  },
  superstorm: {
    pts: 35.9,
    up: 46.3,
    how: '6 x4 to ALL 31.2 + three more hits of help (3 x2 x1.3 x0.6) 4.7',
    role: 'Storm: the finisher',
  },
  // (totems and commands)
  'spirit-call': {
    pts: 8.2,
    up: 11.8,
    how: 'a totem of your choice acts ~8.2 over a fight (early 6, mid 8.5, late 12)',
    role: 'the starter command',
  },
  'hawks-dive': {
    pts: 11.3,
    up: 14.9,
    how: 'a Hawk dives ~7.7 (early 5.4, mid 8.1, late 11.7) + 3 Barrier 3.6',
    role: 'commands: the Hawk',
  },
  'bears-guard': {
    pts: 9.1,
    up: 12.7,
    how: 'a Bear guards ~9.1 (early 6, mid 9.6, late 14.4)',
    role: 'commands: the Bear',
  },
  'thunderbirds-cry': {
    pts: 10.3,
    up: 14.2,
    how: 'a Thunderbird strikes ~7.3 (early 3.9, mid 7.8, late 13) + draw 3',
    role: 'commands: the Thunderbird',
  },
  'spark-cast': {
    pts: 9.2,
    up: 12.8,
    how: 'plant a Hawk 1.5 + a Hawk dives ~7.7',
    role: 'totems: a second Hawk doubles the Flame help',
  },
  'wardkeepers-pact': {
    pts: 9.9,
    up: 13.5,
    how: 'plant a Bear 1.5 + 7 Barrier 8.4',
    role: 'totems',
  },
  'thunderbird-call': {
    pts: 10.3,
    up: 14.1,
    how: 'plant a Thunderbird 1.5 + 4 to ALL 5.2 + 3 Barrier 3.6',
    role: 'totems',
  },
  'call-again': {
    pts: 7.6,
    up: 10,
    how: 'a random totem acts ~7.6 (early 5.3, mid 8, late 11.5); + 2 Barrier',
    role: 'commands: the cheap one',
    consume: true,
  },
  'raise-the-pole': {
    pts: 11,
    up: 14.6,
    how: 'a totem position 2 + 5 Barrier 6 + draw 3',
    role: 'totems: room for a fourth',
  },
  'carve-the-spirit-pole': {
    pts: 11,
    up: 15,
    how: 'a position 2 + plant a totem of your choice 2 + draw 2 (7)',
    role: 'totems: a fourth totem at once',
  },
  'rally-the-spirits': {
    pts: 21.2,
    up: 24.8,
    how: 'a totem of your choice acts twice (2 x ~8.2) + 4 Barrier 4.8',
    role: 'commands: the command turn',
  },
  'ancestral-exchange': {
    pts: 12.1,
    up: 15.7,
    how: 'plant any kind anywhere 2 + 1 Spirit if it changed (5 x0.7) + draw 3 + 3 Barrier 3.6',
    role: 'totems: reshape the row',
  },
  'thunder-roost': {
    pts: 14,
    up: 18.7,
    how: '4 turns x a Thunderbird (~90%) x 3 to ALL 3.9',
    role: 'totems/Storm',
  },
  'rune-carapace': {
    pts: 20.6,
    up: 24.1,
    how: '4 turns x (1 Barrier a totem, ~3.3, + 1) x1.2; + Opening hand 3.5',
    role: 'totems: defence for a full row',
  },
  'call-the-elder-tree': {
    pts: 13,
    up: 16.6,
    how: '2 Spirit 10 + the Elder Tree in place of a basic totem ~3',
    role: 'the rare totem: Spirit',
  },
  'call-the-moon-owl': {
    pts: 13,
    up: 17,
    how: 'the Moon Owl: 1 Mana on ~55% of turns (~10 over a fight) + draw 3',
    role: 'the rare totem: Mana on Trinity',
  },
  'spirit-chorus': {
    pts: 40,
    up: 43.5,
    how: '4 turns x (a random totem acts ~7.6 + 2 Barrier 2.4); + Opening hand 3.5',
    role: 'commands: the command engine',
  },
  'great-spirits-call': {
    pts: 35.3,
    up: 40.1,
    how: 'every totem acts ~29.3 (early 3 totems 15.3, mid 3.5 at 3 Spirit 28, late 5 at 7 Spirit 60) + 5 Barrier 6',
    role: 'commands: the duplicate-totem payoff',
  },
  // (Trinity and Spirit)
  'prism-spell': {
    pts: 11.2,
    up: 15.6,
    how: "4 + 3 Barrier 3.6 + the second number's help (~2.7 x0.6) 1.6 + the missing element ~2",
    role: 'Trinity: the wildcard',
  },
  'spirit-surge': { pts: 11, up: 14.6, how: '1 Spirit 5 + 5 Barrier 6', role: 'Spirit' },
  'tune-the-lattice': {
    pts: 11.6,
    up: 15.6,
    how: '1 Spirit 5 + draw 3 + 3 Barrier 3.6',
    role: 'Spirit',
  },
  spiritstorm: {
    pts: 12.35,
    up: 16.25,
    how: '(6 + Spirit ~3.5) to ALL x1.3',
    role: 'Spirit: the payoff',
  },
  harmony: {
    pts: 22.4,
    up: 30.4,
    how: '4 turns x Trinity ~55% x (6 Barrier 7.2 + draw 3)',
    role: 'Trinity: the payoff',
  },
  'spirit-walk': {
    pts: 17,
    up: 21,
    how: '2 Spirit 10 + draw 2 (7)',
    role: 'Spirit',
    consume: true,
  },
  // (utility)
  'stone-skin': { pts: 10.8, up: 14.4, how: '9 Barrier', role: 'utility' },
  tidecaller: {
    pts: 12.4,
    up: 16,
    how: '7 Barrier 8.4 + 1 Mana next turn 4',
    role: 'utility',
    why: 'the guide’s own worked example (§9), kept',
  },
  'spirit-memory': {
    pts: 10.2,
    up: 13.8,
    how: '6 Barrier 7.2 + a random card back 3',
    role: 'utility',
  },
  'read-the-winds': {
    pts: 8.8,
    up: 12.4,
    how: 'Foresee 3 (3 + 1) + 4 Barrier 4.8',
    role: 'utility: find the missing element',
  },
  'clear-spring': {
    pts: 11,
    up: 13,
    how: 'draw 3 (3 + 4 + 4); + a 4th at half',
    role: 'utility',
  },
  'crystal-ward': {
    pts: 15.5,
    up: 19.1,
    how: '10 Barrier 12 + Opening hand 3.5',
    role: 'utility',
    consume: true,
    why: 'the guide’s example (§6) of a 0-cost Consume Opening-hand card carrying a 1-cost budget, unchanged',
  },
  ironbark: { pts: 11.6, up: 16.4, how: '13 Barrier 15.6 - 2 Wounds 4', role: 'utility' },
  'shamans-insight': {
    pts: 12.6,
    up: 16.6,
    how: 'draw 3 + 3 Barrier 3.6 + the next spell free ~6',
    role: 'utility',
  },
  'smoke-offering': {
    pts: 11,
    up: 14.5,
    how: '2 Mana next turn 8 + draw 3 (a card consumed: thinning against a card lost, ~0)',
    role: 'utility: a big next turn',
  },
  skybreaker: { pts: 28, up: 36, how: '26 + if fatal 1 Mana ~2', role: 'utility: the heavy hit' },
  'spirit-vision': {
    pts: 16,
    up: 18,
    how: 'draw 3 (11) + 1 Spirit 5',
    role: 'utility',
    consume: true,
  },
  'gale-strike': { pts: 11, up: 14, how: '8 + costs 1 less for the fight 3', role: 'utility' },
};
