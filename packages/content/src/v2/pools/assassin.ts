// Sylas (id assassin, Umbral). No companions. He is the Slay the Spire 2 Silent on purpose, for now (Robert, 2026-10-28: "close
// copies of the originals, but obviously change names and keep our theme, i will adjust things going forward, but we need good
// baselines right now"; DECISIONS #368): one card for every card of the Silent's under an original name, and
// nothing else. Shivs are his Sleeve Knives (cards tagged "knife"; Edge is the Silent's Accuracy), Poison is Bleed (the engine's
// `seared`), Weak is Faltering, Vulnerable is Exposed, Dexterity is Bracing, Strength lost is Sapped, Sly is Sly. Each card's
// comment names the Silent card it imitates; numbers and rarities are the Silent's (slaythespire.wiki.gg, 2026-10-27: the v0.110
// beta list) unless a comment says why not. Not here: Blade Symphony, Concoct, Fade, Flanking and Sneaky (they need a second
// player), and the Ancient cards Suppress and Wraith Form (an event's prize in their game, as the knight's Break is).
//
// The headings below are only a first sort:
//   Shivs  - Sleeve Knives and the attacks around them
//   Bleed  - stack Bleed and make it burn harder
//   Sleight - draw, discard (Sly cards play themselves when discarded) and dodge
// Numbers assume 3 Mana and a 5-card hand.

import type { CardDef, Op } from '@sr/combat';
import {
  addTo,
  barrier,
  discard,
  dmg,
  draw,
  drawLock,
  defer,
  extraReward,
  mana,
  manaNext,
  on,
  onKill,
  per,
  playPile,
  pool,
  scaled,
  status,
  statusTheirs,
  when,
} from '../build';

const q = pool('assassin', 'umbral');

/** Deal `amount` damage per Skill in hand, on one hit (Flechettes, DECISIONS #507). */
const perSkill = (amount: number): Op => scaled(dmg(0), per('skillsInHand', amount));
const knifeTrap = (upgrade: boolean): Op =>
  playPile('exhaust', {
    tag: 'knife',
    all: true,
    // (the first 20 Daggers and every second one after, DECISIONS #762: all of them had no slowdown, ~450 from one card by turn 7)
    halfPast: 20,
    aim: 'target',
    ...(upgrade ? { upgrade } : {}),
  });
const tick = (to: 'allFoes' | 'target'): Op => ({ op: 'tick', to });

export const ASSASSIN: CardDef[] = [
  // --- basics and tokens ---
  // (Neutralize)
  q(
    'basic',
    'hobbling-jab',
    'Hobbling Jab',
    'attack',
    0,
    'foe',
    [dmg(3), status('faltering', 1, 'target')],
    {
      // (5 and 1 since #692: 4 and 2 was +67%)
      up: { effects: [dmg(5), status('faltering', 1, 'target')] },
    },
  ),
  // (Survivor)
  q('basic', 'duck-and-weave', 'Duck and Weave', 'skill', 1, 'none', [barrier(8), discard(1)]),
  // (two more basics for damage in the starting deck: Robert 2026-10-30)
  q('basic', 'fang-and-claw', 'Fang and Claw', 'attack', 1, 'foe', [
    dmg(4, 'target', 2),
    status('seared', 1, 'target'),
  ]),
  // (upgraded 2 Daggers and 2 Barrier since #692: a third Dagger was +50%)
  q('basic', 'pocket-blades', 'Pocket Blades', 'skill', 1, 'none', [addTo('sleeve-knife', 2)], {
    up: { effects: [addTo('sleeve-knife', 2), barrier(2)] },
  }),
  // (Shiv: 4 damage, Consume; Shiv+ deals 6. Shown as the Dagger since 2026-10-28, DECISIONS #379; the id stays for saves)
  q('common', 'sleeve-knife', 'Dagger', 'attack', 0, 'foe', [dmg(4)], {
    exhaust: true,
    tags: ['knife'],
    source: 'token',
    up: { effects: [dmg(6)] },
  }),
  // (Blade of Ink's Inky Shiv: a Shiv with 1 more damage and 1 Weak)
  q(
    'common',
    'inked-knife',
    'Inked Dagger',
    'attack',
    0,
    'foe',
    [dmg(5), status('faltering', 1, 'target')],
    { exhaust: true, tags: ['knife'], source: 'token' },
  ),
  // (#692: what Hidden Blades gives a Bloodletter in place of a Dagger. Not a knife: no Edge, Honed, Volley or Recall for it; ~5 points,
  // a Dagger's worth, for a Bleed deck)
  q(
    'common',
    'barbed-dagger',
    'Barbed Dagger',
    'attack',
    0,
    'foe',
    [dmg(1), status('seared', 3, 'target')],
    { exhaust: true, source: 'token' },
  ),
  // (#692: what Hidden Blades gives an Assassin: a free Skill that feeds Prepared, ~4 points)
  q('common', 'shadow-feint', 'Shadow Feint', 'skill', 0, 'none', [barrier(3)], {
    exhaust: true,
    source: 'token',
  }),

  // --- Shivs ---
  // (Blade Dance)
  q('common', 'knife-juggle', 'Knife Juggle', 'skill', 1, 'none', [addTo('sleeve-knife', 3)], {
    exhaust: true,
  }),
  // (Cloak and Dagger)
  q(
    'common',
    'shroud-and-shank',
    'Shroud and Shank',
    'skill',
    1,
    'none',
    [barrier(6), addTo('sleeve-knife')],
    { up: { effects: [barrier(6), addTo('sleeve-knife', 2)] } },
  ),
  // (Leading Strike)
  q(
    'common',
    'feint-strike',
    'Feint Strike',
    'attack',
    1,
    'foe',
    [dmg(3), addTo('sleeve-knife', 2)],
    {
      up: { effects: [dmg(6), addTo('sleeve-knife', 2)] },
    },
  ),
  // (Dagger Spray)
  // (upgraded 5 x 2 since #692: 6 x 2 was +50%)
  q('common', 'blade-flurry', 'Blade Flurry', 'attack', 1, 'none', [dmg(4, 'allFoes', 2)], {
    up: { effects: [dmg(5, 'allFoes', 2)] },
  }),
  // (Slice)
  q('common', 'quick-slash', 'Quick Slash', 'attack', 0, 'foe', [dmg(6)]),
  // (Sucker Punch)
  q(
    'common',
    'dirty-hit',
    'Dirty Hit',
    'attack',
    1,
    'foe',
    [dmg(8), status('faltering', 1, 'target')],
    {
      // (11 and 1 since #692: 10 and 2 was +45%)
      up: { effects: [dmg(11), status('faltering', 1, 'target')] },
    },
  ),
  // (Predator)
  q('common', 'stalkers-lunge', "Stalker's Lunge", 'attack', 2, 'foe', [dmg(15), defer()], {
    up: { effects: [dmg(20), defer()] },
  }),
  // (Ricochet: Sly)
  q(
    'common',
    'glancing-knives',
    'Glancing Knives',
    'attack',
    2,
    'none',
    [dmg(3, 'randomFoe', 4), defer()],
    {
      sly: true,
      up: { effects: [dmg(3, 'randomFoe', 5), defer()] },
    },
  ),
  // (Flick-Flack: Sly)
  q('common', 'cartwheel-cut', 'Cartwheel Cut', 'attack', 1, 'none', [dmg(5, 'allFoes'), defer()], {
    sly: true,
    up: { effects: [dmg(7, 'allFoes'), defer()] },
  }),
  // (Accuracy: Edge is the knives' extra damage. Since #692 2 Mana and Edge 2, which reaches your first 4 Daggers each turn: Edge 4 on
  // every one of 6-8 Daggers a turn was ~6x its budget. ~32 over four turns, 112%; upgraded it costs 1)
  q('uncommon', 'whetted-edge', 'Whetted Edge', 'power', 2, 'none', [status('edge', 2)], {
    up: { cost: 1 },
  }),
  // (Backstab. 9 since #692: 112%; upgraded 13, +32%)
  q('uncommon', 'knife-in-the-back', 'Knife in the Back', 'attack', 0, 'foe', [dmg(9)], {
    innate: true,
    exhaust: true,
    up: { effects: [dmg(13)] },
  }),
  // (Hidden Daggers: the upgrade makes upgraded knives)
  q(
    'uncommon',
    'sleeve-drop',
    'Sleeve Drop',
    'skill',
    0,
    'none',
    [discard(2), addTo('sleeve-knife', 2)],
    // (2 Barrier since #692: upgraded Daggers were +67%; a draw would let a free card replace itself)
    { up: { effects: [discard(2), addTo('sleeve-knife', 2), barrier(2)] } },
  ),
  // (Infinite Blades: the upgrade is in your opening hand)
  q(
    'uncommon',
    'bottomless-sleeves',
    'Bottomless Sleeves',
    'power',
    1,
    'none',
    [on('turnStart', [addTo('sleeve-knife')])],
    { up: { innate: true } },
  ),
  // (Phantom Blades: knives Hold, and the first each turn hits harder)
  // (2 Mana and 7 since #692: 9 for 1 was ~2.7x its budget; ~32, 112%; upgraded 9, +25%)
  q('uncommon', 'ghost-knives', 'Ghost Knives', 'power', 2, 'none', [status('honed', 7)], {
    up: { effects: [status('honed', 9)] },
  }),
  // (Up My Sleeve. 5 Daggers since #692: 3 was ~70%; ~23, 108%; upgraded it costs 1)
  q(
    'uncommon',
    'spare-blades',
    'Spare Blades',
    'skill',
    2,
    'none',
    [addTo('sleeve-knife', 5), { op: 'selfCost', amount: 1 }],
    { up: { cost: 1 } },
  ),
  // (Echoing Slash. 8 since #692: 116%; upgraded 10, +25%)
  q(
    'uncommon',
    'rippling-cut',
    'Rippling Cut',
    'attack',
    1,
    'none',
    [{ op: 'damage', amount: 8, to: 'allFoes', repeatOnKill: true }],
    { up: { effects: [{ op: 'damage', amount: 10, to: 'allFoes', repeatOnKill: true }] } },
  ),
  // (Dash)
  q('uncommon', 'darting-strike', 'Darting Strike', 'attack', 2, 'foe', [barrier(10), dmg(10)]),
  // (Finisher)
  q(
    'uncommon',
    'final-flourish',
    'Final Flourish',
    'attack',
    1,
    'foe',
    // (6 + 6 per Attack costing 1 or more played this turn since #692: every Dagger counted, ~42 for 1 Mana; ~12, 107%; upgraded 8 + 8)
    [scaled(dmg(6), per('paidAttacksPlayed', 6))],
    { up: { effects: [scaled(dmg(8), per('paidAttacksPlayed', 8))] } },
  ),
  // (Skewer: an X card, so its upgrade is X+1, as every X card's is, not 11 damage)
  q(
    'uncommon',
    'run-through',
    'Run Through',
    'attack',
    0,
    'foe',
    [scaled({ op: 'damage', amount: 8, hits: 0, to: 'target' }, per('x', 1, undefined, 'hits'))],
    { x: true },
  ),
  // (Pounce)
  q(
    'uncommon',
    'spring-attack',
    'Spring Attack',
    'attack',
    2,
    'foe',
    [dmg(14), status('freeskill', 1)],
    {
      up: { effects: [dmg(20), status('freeskill', 1)] },
    },
  ),
  // (Pinpoint)
  q('uncommon', 'nerve-strike', 'Nerve Strike', 'attack', 3, 'foe', [dmg(15)], {
    cheaperPerSkill: 1,
    up: { effects: [dmg(19)] },
  }),
  // (Precise Cut: 2 less for each other card in your hand)
  // (11 since #692: 119%; upgraded 13, +25%)
  q('uncommon', 'clean-cut', 'Clean Cut', 'attack', 0, 'foe', [scaled(dmg(11), per('hand', -2))], {
    up: { effects: [scaled(dmg(13), per('hand', -2))] },
  }),
  // (Assassinate)
  q(
    'rare',
    'killing-stroke',
    'Killing Stroke',
    'attack',
    0,
    'foe',
    [dmg(10), status('exposed', 1, 'target')],
    { innate: true, exhaust: true },
  ),
  // (Blade of Ink)
  // (upgraded also a Dagger since #692, +25%)
  q('rare', 'inked-blades', 'Inked Blades', 'skill', 1, 'none', [addTo('inked-knife', 2)], {
    up: { effects: [addTo('inked-knife', 2), addTo('sleeve-knife')] },
  }),
  // (Fan of Knives: knives hit every enemy for the rest of the fight)
  q(
    'rare',
    'wide-arc',
    'Wide Arc',
    'power',
    2,
    'none',
    // (Opening hand and 3 Daggers since #692: ~53% before; ~48, 126%; upgraded it costs 1)
    [status('fanned', 1), addTo('sleeve-knife', 3)],
    { innate: true, up: { cost: 1 } },
  ),
  // (Knife Trap)
  q('rare', 'recall-the-blades', 'Recall the Blades', 'skill', 3, 'foe', [knifeTrap(false)], {
    exhaust: true,
    up: { effects: [knifeTrap(true)] },
  }),
  // (Serpent Form)
  q(
    'rare',
    'serpents-coil',
    "Serpent's Coil",
    'power',
    3,
    'none',
    // (5 damage on the first 5 cards each turn since #692: every Dagger counted, ~2.6x its budget in a Dagger deck; ~72 over four turns
    // with ~4 cards a turn, 129%; upgraded Opening hand, +25%)
    [on('play', [dmg(5, 'randomFoe')], { perTurnLimit: 5 })],
    { up: { innate: true } },
  ),
  // (Shadow Step: next turn your Attacks deal double damage)
  q(
    'rare',
    'into-the-shadows',
    'Into the Shadows',
    'skill',
    2,
    'none',
    [defer(3, true), discard(99), status('poised', 1)],
    {
      // (upgraded it costs 1 since #692: Defer 4 was +10%)
      up: { cost: 1 },
    },
  ),
  // (Storm of Steel: a knife for every card discarded; upgraded knives when upgraded)
  q(
    'rare',
    'steel-monsoon',
    'Steel Monsoon',
    'skill',
    1,
    'none',
    // (a Dagger per card discarded plus 1, then draw 1, since #692: ~72% before; ~16, 128%; upgraded plus 2 Daggers, +25%)
    [discard(99), addTo('sleeve-knife', 1, 'hand', per('discardedNow')), draw(1)],
    { up: { effects: [discard(99), addTo('sleeve-knife', 2, 'hand', per('discardedNow')), draw(1)] } },
  ),
  // (The Hunt: a kill gives one more card reward after the fight, which the run hands out)
  q(
    'rare',
    'marked-for-death',
    'Marked for Death',
    'attack',
    1,
    'foe',
    // (14 since #692, a rare in A: ~17, 136%; upgraded 19, +29%)
    [onKill(dmg(14), [extraReward(1)])],
    {
      exhaust: true,
      up: { effects: [onKill(dmg(19), [extraReward(1)])] },
    },
  ),
  // (Grand Finale)
  q('rare', 'final-bow', 'Final Bow', 'attack', 0, 'none', [dmg(60, 'allFoes')], {
    needsEmptyDraw: true,
    up: { effects: [dmg(75, 'allFoes')] },
  }),

  // --- Bleed ---
  // (Deadly Poison)
  q('common', 'open-vein', 'Open Vein', 'skill', 1, 'foe', [status('seared', 5, 'target')]),
  // (Poisoned Stab)
  q(
    'common',
    'barbed-stab',
    'Barbed Stab',
    'attack',
    1,
    'foe',
    [dmg(6), status('seared', 3, 'target')],
    {
      // (6 and 4 since #692: 8 and 4 was +46%)
      up: { effects: [dmg(6), status('seared', 4, 'target')] },
    },
  ),
  // (Snakebite)
  // (upgraded 8 since #692: 10 was +86%, Bleed's total grows with the square of the stack)
  q('common', 'vipers-kiss', "Viper's Kiss", 'skill', 2, 'foe', [status('seared', 7, 'target')], {
    retain: true,
    up: { effects: [status('seared', 8, 'target')] },
  }),
  // (Piercing Wail: Strength lost for the turn is Sapped until the end of their turn)
  q(
    'common',
    'chilling-shriek',
    'Chilling Shriek',
    'skill',
    1,
    'none',
    [statusTheirs('sapped', 6, 'allFoes')],
    {
      exhaust: true,
    },
  ),
  // (Accelerant)
  // (kept A on purpose, the Bleed build's engine, #692; upgraded Opening hand, +25%, not a second Hemorrhage)
  q('uncommon', 'thin-the-blood', 'Thin the Blood', 'power', 1, 'none', [status('virulent', 1)], {
    up: { innate: true },
  }),
  // (Bouncing Flask)
  q(
    'uncommon',
    'tossed-vials',
    'Tossed Vials',
    'skill',
    2,
    'none',
    [
      status('seared', 3, 'randomFoe'),
      status('seared', 3, 'randomFoe'),
      status('seared', 3, 'randomFoe'),
    ],
    {
      up: {
        effects: [
          status('seared', 3, 'randomFoe'),
          status('seared', 3, 'randomFoe'),
          status('seared', 3, 'randomFoe'),
          status('seared', 3, 'randomFoe'),
        ],
      },
    },
  ),
  // (Bubble Bubble)
  q(
    'uncommon',
    'reopen-the-wound',
    'Reopen the Wound',
    'skill',
    1,
    'foe',
    [when('seared', { atLeast: 1, of: 'target' }, [status('seared', 9, 'target')])],
    {
      up: {
        effects: [when('seared', { atLeast: 1, of: 'target' }, [status('seared', 12, 'target')])],
      },
    },
  ),
  // (Haze: 2 Mana since the v0.110 beta)
  q(
    'uncommon',
    'blood-mist',
    'Blood Mist',
    'skill',
    // (1 Mana since #692: ~61% at 2; ~13, 116%; upgraded 5 Bleed, +32%: 6 and 2 was +105%)
    1,
    'none',
    [status('seared', 4, 'allFoes'), status('faltering', 1, 'allFoes')],
    { up: { effects: [status('seared', 5, 'allFoes'), status('faltering', 1, 'allFoes')] } },
  ),
  // (Mirage: the upgrade is no longer consumed)
  q(
    'uncommon',
    'red-mirage',
    'Red Mirage',
    'skill',
    1,
    'none',
    [scaled(barrier(0), per('foesSeared'))],
    { exhaust: true, up: { exhaust: false } },
  ),
  // (Noxious Fumes)
  q(
    'uncommon',
    'weeping-cuts',
    'Weeping Cuts',
    'power',
    1,
    'none',
    [on('turnStart', [status('seared', 2, 'allFoes')])],
    // (upgraded Opening hand since #692: 3 a turn was +50%)
    { up: { innate: true } },
  ),
  // (Corrosive Wave)
  q(
    'rare',
    'hemorrhage',
    'Red Tide',
    'skill',
    1,
    'none',
    // (draw 1, then 4 Bleed a card drawn this turn, since #692: ~80% before; ~19, 152%; upgraded 5, +25%. The draw comes first, as the
    // text reads, so it does not count)
    [draw(1), on('draw', [status('seared', 4, 'allFoes')], { temp: true })],
    {
      up: { effects: [draw(1), on('draw', [status('seared', 5, 'allFoes')], { temp: true })] },
    },
  ),
  // (Envenom)
  q(
    'rare',
    'serrated-edges',
    'Serrated Edges',
    'power',
    // (Robert 2026-11-08, #692: every hit, so every Dagger, applied Bleed, which made the Bleed Rare a Dagger card. Now 1 Mana, 2 Bleed
    // on each Attack that costs 1 or more: ~2 a turn is ~26 over four turns, 130%; upgraded Opening hand)
    1,
    'none',
    [on('play', [status('seared', 2, 'targetOrRandom')], { filter: 'attack', minCost: 1 })],
    { up: { innate: true } },
  ),
  // (Outbreak: Bleed on every enemy, and it burns at once)
  q(
    'rare',
    'bloodburst',
    'Bloodburst',
    'skill',
    2,
    'none',
    [status('seared', 9, 'allFoes'), tick('allFoes')],
    // (Consume since #728: two copies replayed every cycle were an extra tick a turn; the Bloodletter killed on turn 6)
    { exhaust: true, up: { effects: [status('seared', 12, 'allFoes'), tick('allFoes')] } },
  ),
  // (Malaise: Strength lost for good is Sapped for good)
  q(
    'rare',
    'sapping-wound',
    'Sapping Wound',
    'skill',
    0,
    'foe',
    // (and 2 Bleed per X since #692: ~149% at X = 3)
    [
      scaled(status('sapped', 0, 'target'), per('x')),
      scaled(status('faltering', 0, 'target'), per('x')),
      scaled(status('seared', 0, 'target'), per('x', 2)),
    ],
    { x: true, exhaust: true },
  ),
  // (Tracking: Weak enemies take 50% more from Attacks)
  // (and at the start of your turn the most-bled enemy is Faltering, since #692, joining the Bleed and Faltering plans: ~63% before,
  // ~125%; upgraded it costs 1)
  q(
    'rare',
    'blood-scent',
    'Blood Scent',
    'power',
    2,
    'none',
    [status('tracking', 1), on('turnStart', [status('faltering', 1, 'mostBledFoe')])],
    { up: { cost: 1 } },
  ),

  // --- Sleight ---
  // (Anticipate: Dexterity this turn is Bracing this turn)
  q(
    'common',
    'sense-the-blow',
    'Sense the Blow',
    'skill',
    0,
    'none',
    // (3 Barrier and 3 Bracing this turn since #692: ~40% before; ~6.6, 110%; upgraded 4 and 4)
    [barrier(3), status('bracing', 3, 'self', true)],
    {
      up: { effects: [barrier(4), status('bracing', 4, 'self', true)] },
    },
  ),
  // (Backflip)
  q('common', 'backspring', 'Backspring', 'skill', 1, 'none', [barrier(5), draw(2)], {
    up: { effects: [barrier(8), draw(2)] },
  }),
  // (Dagger Throw)
  q('common', 'flick-knife', 'Flick Knife', 'attack', 1, 'foe', [dmg(9), draw(1), discard(1)], {
    up: { effects: [dmg(12), draw(1), discard(1)] },
  }),
  // (Deflect)
  // (5 since #692: 4 was 80%; upgraded 7)
  q('common', 'turn-aside', 'Turn Aside', 'skill', 0, 'none', [barrier(5)], {
    up: { effects: [barrier(7)] },
  }),
  // (Dodge and Roll. 5 and 5 since #692: 88% before; upgraded 7 and 6, +31%)
  q('common', 'roll-away', 'Roll Away', 'skill', 1, 'none', [barrier(5), status('guarded', 5)], {
    up: { effects: [barrier(7), status('guarded', 6)] },
  }),
  // (Prepared. Draw 2, discard 1 and Consume since #692: ~50% before; a free card that draws must be consumed; ~93%; upgraded also
  // 2 Barrier)
  q('common', 'shuffle-up', 'Shuffle Up', 'skill', 0, 'none', [draw(2), discard(1)], {
    exhaust: true,
    up: { effects: [draw(2), discard(1), barrier(2)] },
  }),
  // (Untouchable: Sly. 9 Barrier since #692: 74% before; upgraded 12)
  q('common', 'slip-the-blow', 'Slip the Blow', 'skill', 2, 'none', [barrier(9), defer()], {
    sly: true,
    up: { effects: [barrier(12), defer()] },
  }),
  // (Acrobatics)
  q('uncommon', 'nimble-deal', 'Nimble Deal', 'skill', 1, 'none', [draw(3), discard(1)], {
    up: { effects: [draw(4), discard(1)] },
  }),
  // (Blur)
  q('uncommon', 'smoke-veil', 'Smoke Veil', 'skill', 1, 'none', [barrier(5), status('blur', 1)], {
    up: { effects: [barrier(8), status('blur', 1)] },
  }),
  // (Calculated Gamble: the upgrade Holds)
  q(
    'uncommon',
    'all-or-nothing',
    'All or Nothing',
    'skill',
    0,
    'none',
    // (and 2 Barrier since #692: 83% before)
    [discard(99), scaled(draw(0), per('discardedNow')), barrier(2)],
    { exhaust: true, up: { retain: true } },
  ),
  // (Escape Plan: Consumed here, as a free card that draws must be: balance.test.ts)
  q(
    'uncommon',
    'bolt-hole',
    'Bolt Hole',
    'skill',
    0,
    'none',
    // (4 Barrier whatever it draws since #692: 69% before; upgraded 6)
    [draw(1), barrier(4)],
    {
      exhaust: true,
      up: { effects: [draw(1), barrier(6)] },
    },
  ),
  // (Expertise)
  // (draw 3 since #692: 71% before; upgraded 4)
  q(
    'uncommon',
    'practiced-hands',
    'Practiced Hands',
    'skill',
    1,
    'none',
    [{ op: 'draw', amount: 3, hold: true }],
    { up: { effects: [{ op: 'draw', amount: 4, hold: true }] } },
  ),
  // (Expose: Artifact is Steadfast)
  q(
    'uncommon',
    'lay-bare',
    'Lay Bare',
    'skill',
    0,
    'foe',
    // (3 Exposed since #692: 83% before; upgraded 4)
    [{ op: 'strip', to: 'target' }, status('exposed', 3, 'target')],
    { exhaust: true, up: { effects: [{ op: 'strip', to: 'target' }, status('exposed', 4, 'target')] } },
  ),
  // (Flechettes: 5 damage for each Skill in your hand, on one hit)
  // (6 a Skill since #692: 67-112% before; upgraded 8)
  q('uncommon', 'needle-rain', 'Needle Rain', 'attack', 1, 'foe', [perSkill(6)], {
    up: { effects: [perSkill(8)] },
  }),
  // (Footwork)
  q('uncommon', 'fleet-step', 'Fleet Step', 'power', 1, 'none', [status('bracing', 2)]),
  // (Hand Trick: you choose the card, and it comes back cheaper next turn)
  q('uncommon', 'palm-switch', 'Palm Switch', 'skill', 1, 'none', [barrier(7), defer()]),
  // (Leg Sweep)
  q('uncommon', 'sweep-the-leg', 'Sweep the Leg', 'skill', 2, 'foe', [
    status('faltering', 2, 'target'),
    barrier(11),
  ]),
  // (Memento Mori)
  q(
    'uncommon',
    'graveside-cut',
    'Graveside Cut',
    'attack',
    1,
    'foe',
    [scaled(dmg(9), per('discarded', 4))],
    { up: { effects: [scaled(dmg(11), per('discarded', 5))] } },
  ),
  // (Reflex: Sly)
  // (draw 2 and 2 Barrier since #692: 82% before; upgraded 4 Barrier)
  q('uncommon', 'quick-reflexes', 'Quick Reflexes', 'skill', 3, 'none', [draw(2), barrier(2)], {
    sly: true,
    up: { effects: [draw(2), barrier(4)] },
  }),
  // (Sidestep: a card of your hand waits a turn and comes back cheaper. And 3 Barrier since #692 (a draw would let a free card replace
  // itself): 58% before; ~118%; upgraded 5 Barrier, +34%)
  q('common', 'side-slip', 'Side Slip', 'skill', 0, 'none', [defer(), barrier(3)], {
    up: { effects: [defer(), barrier(5)] },
  }),
  // (Speedster: the draw that starts your turn does not count; the upgrade is in your opening hand)
  q(
    'uncommon',
    'fleet-fingers',
    'Fleet Fingers',
    'power',
    2,
    'none',
    [on('drawMidTurn', [dmg(2, 'allFoes')])],
    { up: { innate: true } },
  ),
  // (Tactician: Sly)
  // (and 2 Barrier since #692; upgraded 4 Barrier, not +2 Mana, which was +100%)
  q('uncommon', 'cool-head', 'Cool Head', 'skill', 3, 'none', [mana(1), barrier(2)], {
    sly: true,
    up: { effects: [mana(1), barrier(4)] },
  }),
  // (Abrasive: Sly)
  q(
    'rare',
    'razor-skin',
    'Razor Skin',
    'power',
    // (2 Mana and 6 Thorns since #692: ~50% before; ~138% with its Premeditate; upgraded 8 Thorns, +30%)
    2,
    'none',
    [status('bracing', 1), status('thorns', 6)],
    { sly: true, up: { effects: [status('bracing', 1), status('thorns', 8)] } },
  ),
  // (Adrenaline)
  q('rare', 'rush-of-blood', 'Rush of Blood', 'skill', 0, 'none', [mana(1), draw(2)], {
    exhaust: true,
    up: { effects: [mana(1), manaNext(1), draw(2)] },
  }),
  // (Afterimage: the upgrade is in your opening hand)
  q(
    'rare',
    'shadow-echo',
    'Shadow Echo',
    'power',
    1,
    'none',
    // (2 Barrier for each card that costs 1 or more since #692: every Dagger counted, up to 15 a turn; ~29 over four turns, 144%)
    [on('play', [barrier(2)], { minCost: 1, barrierCap: 15 })],
    {
      up: { innate: true },
    },
  ),
  // (Bullet Time)
  // (2 Mana, and it draws 2 first, since #692: ~69% before; ~34, 143%; upgraded it costs 1)
  q(
    'rare',
    'stilled-time',
    'Stilled Time',
    'skill',
    2,
    'none',
    [draw(2), drawLock, { op: 'freeHand' }],
    { up: { cost: 1 } },
  ),
  // (Burst. 0 Mana since #692: 88% before; ~147%; upgraded also 3 Barrier, +33%)
  q('rare', 'double-trick', 'Double Trick', 'skill', 0, 'none', [status('mirrored', 1)], {
    up: { effects: [status('mirrored', 1), barrier(3)] },
  }),
  // (Master Planner. 1 Mana and Opening hand since #692: ~53% before; ~125%; upgraded it costs 0)
  q('rare', 'grand-scheme', 'Grand Scheme', 'power', 1, 'none', [status('planner', 1)], {
    innate: true,
    up: { cost: 0 },
  }),
  // (Murder. 8 + 1 per card drawn since #692: ~101% before; ~131%; upgraded 16, +26%)
  // (#722: full to 28 cards drawn, about turn 5, 36 damage; half after, at most +44: 52 by turn 10, the 2x ceiling of a 2-Mana rare
  // you can play again. It was 68 by turn 10 and still growing.)
  q('rare', 'slow-murder', 'Slow Murder', 'attack', 2, 'foe', [scaled(dmg(8), { ...per('drawn'), half: 28, max: 44 })], {
    up: { effects: [scaled(dmg(16), { ...per('drawn'), half: 28, max: 44 })] },
  }),
  // (Nightmare)
  q(
    'rare',
    'recurring-dream',
    'Recurring Dream',
    'skill',
    // (2 Mana since #692: ~135%; upgraded 4 copies, +33%)
    2,
    'none',
    [{ op: 'copyNext', times: 3 }],
    {
      exhaust: true,
      up: { effects: [{ op: 'copyNext', times: 4 }] },
    },
  ),
  // (Shadowmeld: Barrier you gain this turn is doubled)
  q(
    'rare',
    'mantle-of-night',
    'Mantle of Night',
    'skill',
    1,
    'none',
    // (and draw 1 since #692: ~139%; upgraded draw 2, in place of costing 0, +60%)
    [status('meld', 1, 'self', true), draw(1)],
    {
      up: { effects: [status('meld', 1, 'self', true), draw(2)] },
    },
  ),
  // (Tools of the Trade: the card discarded is a random one)
  // (draw 2 since #692: ~60% before; ~140%; upgraded Opening hand)
  q(
    'rare',
    'nimble-routine',
    'Nimble Routine',
    'power',
    1,
    'none',
    [on('turnStart', [draw(2), discard(1, 'random')])],
    { up: { innate: true } },
  ),
  // (Well-Laid Plans: your whole hand Holds every turn. And a card more each turn since #692: ~80% before; ~140%; upgraded Opening hand)
  q(
    'rare',
    'patient-hands',
    'Patient Hands',
    'power',
    1,
    'none',
    [on('turnEnd', [status('holdfast', 1)]), on('turnStart', [draw(1)])],
    { up: { innate: true } },
  ),
];
