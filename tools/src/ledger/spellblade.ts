// The Spellblade's hand prices (docs/reworks/spellblade-ledger.md is generated from these). New rates (docs/14_CARD_COSTING.md §15):
// an enchantment is worth Ember 3, Glass 2.6, Ward 3.6 when it is discharged; an Imbue is its producer and pays 0.85 of that (about one
// in seven is lost to the fight ending, a replacement or a card that never comes): Ember 2.5, Glass 2.2, Ward 3. A Discharge is the
// consumer and pays only the choice and timing it adds: +1 for one, +1.5 for both (the charge itself is the Imbue's). "Per enchantment
// discharged" by a both-discharge counts ~1.6; "per enchantment on your blade" ~1.3; Wards on the blade in a Ward deck ~1.5 after an
// Imbue. A trigger on Discharge fires about once a turn in a deck that wants it.

import type { Price } from './common';

export const SPELLBLADE_PRICES: Record<string, Price> = {
  // (the starter)
  'ember-inscription': {
    pts: 7.5,
    up: 10.5,
    how: '5 + Imbue Ember 2.5',
    role: 'the starter Imbue: a spell that hits and charges',
  },
  'obsidian-cut': {
    pts: 7,
    up: 10,
    how: '6 + a Discharge 1',
    role: 'the starter Discharge (with the trait Ward and Ember Inscription it always has something to spend)',
  },
  // (glue)
  gleam: {
    pts: 11.5,
    up: 14.5,
    how: '7 + draw 3 + a card on top 1.5',
    role: 'glue: sets up the next draw (an Imbue for the next attack)',
    why: 'kept from the old pool unchanged; +15% exactly, a known strong glue common',
  },
  'hollow-gaze': {
    pts: 9.4,
    up: 13,
    how: '7 Barrier 8.4 + a random card from discard on top ~1',
    role: 'glue: defence that recovers a spent Imbue or Discharge',
  },
  humble: {
    pts: 6,
    up: 7.5,
    how: '1 Faltering 3 + 1 Exposed 3 (Consume is its price at 0); + loses Consume +1.5',
    role: 'glue: debuffs before a Crownfall',
  },
  'molten-weight': {
    pts: 10.6,
    up: 13.2,
    how: '7 to ALL x1.3 + 1 Sapped to ALL for a turn ~1.5',
    role: 'glue: many enemies',
  },
  'stellar-wind': {
    pts: 12.5,
    up: 14.5,
    how: 'draw 3 (3 + 4 + 4) + a card on top 1.5; + a 4th card at half',
    role: 'glue: finds an Imbue and a Discharge together',
  },
  // (Edge: frequent single discharges)
  'forged-in-fury': {
    pts: 9.5,
    up: 12.5,
    how: '7 + Imbue Ember 2.5',
    role: 'Edge: attack and charge',
  },
  skybolt: {
    pts: 10,
    up: 13,
    how: '6 + draw 3 + a Discharge 1',
    role: 'Edge: the cheap spender that replaces itself',
  },
  'ember-cache': {
    pts: 9.5,
    up: 13.5,
    how: 'Imbue Ember 2.5 + draw 2 (7)',
    role: 'Edge: charge and cards',
  },
  'faint-glow': {
    pts: 6,
    up: 6.5,
    how: 'Imbue Ember 2.5 + Foresee 2 (3 + 0.5); Consume stops a free charge every reshuffle',
    role: 'Edge: a free charge',
  },
  sunstrike: {
    pts: 10,
    up: 13,
    how: '9 + Imbue Ember when the blade is empty (~40%) 1',
    role: 'Edge: refills after a spend',
  },
  'fracture-script': {
    pts: 9.2,
    up: 12.2,
    how: '7 + Imbue Glass 2.2',
    role: 'Edge/Burst: a spell that hits and plants Glass',
  },
  'astral-pulse': {
    pts: 10.1,
    up: 12.7,
    how: '7 to ALL x1.3 + a Discharge 1',
    role: 'Edge: many enemies (Glass on top)',
  },
  'gamma-burst': {
    pts: 12,
    up: 15,
    how: '5 + 1 Faltering 3 + 1 Exposed 3 + a Discharge 1',
    role: 'Edge: a spender that softens',
  },
  'shard-strike': {
    pts: 10.2,
    up: 13.2,
    how: '8 + Imbue Glass 2.2',
    role: 'Edge: attack and charge',
  },
  'sovereign-strike': {
    pts: 20,
    up: 24,
    how: '15 + 1 Mana next turn 4 + a Discharge 1',
    role: 'Edge: a heavy spender that pays for the next Imbue',
  },
  'recast-the-edge': {
    pts: 11.7,
    up: 15.3,
    how: 'change the newest charge ~1.5 + 6 Barrier 7.2 + draw 3',
    role: 'Edge/Burst: fixes a charge (no copy, no discharge)',
  },
  'warm-anvil': {
    pts: 16.6,
    up: 21.4,
    how: '4 turns x (Ember when there is room ~70% 1.75 + 2 Barrier 2.4)',
    role: 'Edge: a steady charge for a deck that spends every turn',
  },
  'call-the-blade': {
    pts: 10.8,
    up: 14.4,
    how: 'draw until a non-Skill (~1.5 cards: 3 + 2) + Imbue Glass 2.2 + 3 Barrier 3.6',
    role: 'Edge: finds the attack to spend with',
  },
  'echoing-blade': {
    pts: 9,
    up: 12.6,
    how: 'Twin Edge (the next first charge twice: ~3 x0.8) 2.4 + draw 3 + 3 Barrier 3.6',
    role: 'Edge/Burst: doubles one charge, never copies it',
    consume: true,
  },
  'cleaving-edge': {
    pts: 20.8,
    up: 26,
    how: '4 turns x 1 Discharge x 4 to ALL (5.2)',
    role: 'Edge: the payoff for spending often',
  },
  'big-bang': {
    pts: 9.5,
    up: 12.5,
    how: '+1 Mana 7 + Imbue Ember 2.5; + Opening hand 3',
    role: 'Edge/Burst: a free charge and the Mana to spend it',
    why: 'a 0-cost Mana card with Consume is priced by the rule (guide §6, Rift Surge, Draw Blood), not its points',
  },
  'dying-star': {
    pts: 22,
    up: 26.6,
    how: '10 to ALL 13 + 6 Sapped to ALL for a turn ~8 (never more than the hits) + a Discharge 1',
    role: 'Edge: many enemies, blunted',
  },
  // (Burst: mixed charges, full discharges)
  whetstone: {
    pts: 10.7,
    up: 14.3,
    how: 'Imbue Ember 2.5 + Imbue Glass 2.2 + 5 Barrier 6',
    role: 'Burst: fills both positions at once (Inscribe Twice)',
  },
  'obsidian-flurry': {
    pts: 19,
    up: 25,
    how: '6 x3 (no Might source in the class) + a Discharge 1',
    role: 'Burst/Edge: Ember lands on the first hit only',
  },
  'cosmic-lance': {
    pts: 8.9,
    up: 11.9,
    how: '5 + 3 a charge held x1.3 (not spent)',
    role: 'Burst: the reason to keep a charge',
  },
  crownfall: {
    pts: 18.5,
    up: 23.5,
    how: '17 + both Discharged 1.5',
    role: 'Burst: the staple full discharge',
  },
  devastate: {
    pts: 27.5,
    up: 35.5,
    how: '26 + both Discharged 1.5',
    role: 'Burst: the heavy full discharge',
  },
  radiance: {
    pts: 11.4,
    up: 14,
    how: '4 x2 to ALL (8 x1.3) + a Discharge 1',
    role: 'Burst/Edge: many enemies',
  },
  'overcharge-edge': {
    pts: 11.9,
    up: 14.9,
    how: '4 + 4 a charge x1.6 + both Discharged 1.5',
    role: 'Burst: the cheap full discharge',
  },
  'final-shatter': {
    pts: 28,
    up: 36,
    how: '26 + if fatal Ember and Glass when there is room (~40% of 4.7) 2',
    role: 'Burst: a finisher that recharges',
  },
  'banked-embers': {
    pts: 12.1,
    up: 15.7,
    how: 'Imbue Ember 2.5 + 1 Mana next turn 4 + Holdfast ~2 + 3 Barrier 3.6',
    role: 'Burst: set up a big turn',
  },
  scheme: {
    pts: 11.6,
    up: 15.1,
    how: '2 cards next turn 7 + Imbue Glass 2.2 + 2 Barrier 2.4',
    role: 'Burst: set up a big turn',
  },
  'emberglass-covenant': {
    pts: 20.2,
    up: 26.6,
    how: '4 turns x ~45% a mixed full discharge x (1 Mana next turn 4 + 6 Barrier 7.2)',
    role: 'Burst: the payoff for two different charges',
  },
  comet: {
    pts: 33.5,
    up: 39.5,
    how: '20 + 2 Faltering 6 + 2 Exposed 6 + both Discharged 1.5',
    role: 'Burst: the boss finisher',
  },
  'seven-shards': {
    pts: 22.5,
    up: 29.5,
    how: '3 x7 + both Discharged 1.5 (Ember on the first hit)',
    role: 'Burst: many hits',
  },
  'heirloom-maul': {
    pts: 22.9,
    up: 27.9,
    how: '16 + draw ~1.6 (3 + 2.4) + both Discharged 1.5',
    role: 'Burst: a full discharge that refills the hand',
  },
  supernova: {
    pts: 13.2,
    up: 17.1,
    how: '9 to ALL x1.3 + both Discharged 1.5',
    role: 'Burst: many enemies',
  },
  'twin-sigils': {
    pts: 13.3,
    up: 16.9,
    how: 'Imbue Ember 2.5 + Imbue Ward 3 + 4 Barrier 4.8 + draw 3',
    role: 'Burst/Ward: a mixed pair at once',
  },
  'glass-requiem': {
    pts: 21.7,
    up: 26.7,
    how: '14 + 3 a charge to ALL (x1.6 x1.3) 6.2 + both Discharged 1.5',
    role: 'Burst: many enemies',
  },
  // (Ward: defensive weaving)
  'glass-veil': {
    pts: 18.2,
    up: 22.6,
    how: '11 Barrier 13.2 + 5 next turn 5',
    role: 'Ward: plain defence',
  },
  shatterguard: {
    pts: 11.1,
    up: 13.5,
    how: '5 Barrier a charge (x1.6) 9.6 + both Discharged 1.5',
    role: 'Ward: a full discharge that defends',
  },
  glassward: {
    pts: 9,
    up: 12.6,
    how: '5 Barrier 6 + Imbue Ward 3',
    role: 'Ward: defend and charge',
  },
  'pale-beacon': {
    pts: 11.4,
    up: 15,
    how: '8 Barrier 9.6 + draw if a Ward (~60%) 1.8',
    role: 'Ward: a reason to keep a Ward',
  },
  'star-barrier': {
    pts: 9.4,
    up: 13,
    how: '7 Barrier 8.4 + a Discharge 1',
    role: 'Ward: spends a Ward without an attack (Ember is lost, Glass breaks)',
  },
  bladewall: {
    pts: 19.8,
    up: 24.6,
    how: '14 Barrier 16.8 + Imbue Ward 3',
    role: 'Ward: heavy defence and charge',
  },
  parry: {
    pts: 14.4,
    up: 19.2,
    how: '4 turns x 1 Discharge x 3 Barrier 3.6',
    role: 'Ward/Edge: the defensive payoff for spending',
  },
  'mirror-glass': {
    pts: 19.2,
    up: 24,
    how: '11 Barrier 13.2 + soaked damage dealt back ~5 + a Discharge 1',
    role: 'Ward: defence that hits back',
  },
  'glass-wall': {
    pts: 12,
    up: 15.6,
    how: '5 Barrier 6 + Imbue Ward 3 + Foresee 1 (a draw 3)',
    role: 'Ward: defend, charge, find',
  },
  'ward-weave': {
    pts: 11.4,
    up: 13.2,
    how: 'Imbue Ward 3 + 3 Barrier a Ward (~1.5) 5.4 + draw 3',
    role: 'Ward: grows with stacked Wards (at most 2)',
  },
  'obsidian-aegis': {
    pts: 18.7,
    up: 25,
    how: '4 turns x 3 Barrier a charge held (~1.3) 4.7',
    role: 'Ward/Burst: pays for holding charges',
  },
  'unbreakable-crown': {
    pts: 25.2,
    up: 30,
    how: '16 Barrier 19.2 + two Imbue Ward 6',
    role: 'Ward: fills the blade with Wards',
  },
};
