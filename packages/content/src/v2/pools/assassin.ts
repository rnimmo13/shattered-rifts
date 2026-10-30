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

/** Deal `amount` damage once per point of a metric (Flechettes, Skewer). */
const hitsPer = (amount: number, by: 'x' | 'skillsInHand'): Op =>
  scaled({ op: 'damage', amount, hits: 0, to: 'target' }, per(by, 1, undefined, 'hits'));
const knifeTrap = (upgrade: boolean): Op =>
  playPile('exhaust', { tag: 'knife', all: true, aim: 'target', ...(upgrade ? { upgrade } : {}) });
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
      up: { effects: [dmg(4), status('faltering', 2, 'target')] },
    },
  ),
  // (Survivor)
  q('basic', 'duck-and-weave', 'Duck and Weave', 'skill', 1, 'none', [barrier(8), discard(1)]),
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
  q('common', 'blade-flurry', 'Blade Flurry', 'attack', 1, 'none', [dmg(4, 'allFoes', 2)], {
    up: { effects: [dmg(6, 'allFoes', 2)] },
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
      up: { effects: [dmg(10), status('faltering', 2, 'target')] },
    },
  ),
  // (Predator)
  q('common', 'stalkers-lunge', "Stalker's Lunge", 'attack', 2, 'foe', [dmg(15), defer()], {
    up: { effects: [dmg(20), defer()] },
  }),
  // (Ricochet: Sly)
  q('common', 'glancing-knives', 'Glancing Knives', 'attack', 2, 'none', [dmg(3, 'randomFoe', 4), defer()], {
    sly: true,
    up: { effects: [dmg(3, 'randomFoe', 5), defer()] },
  }),
  // (Flick-Flack: Sly)
  q('common', 'cartwheel-cut', 'Cartwheel Cut', 'attack', 1, 'none', [dmg(5, 'allFoes'), defer()], {
    sly: true,
    up: { effects: [dmg(7, 'allFoes'), defer()] },
  }),
  // (Accuracy: Edge is the knives' extra damage)
  q('uncommon', 'whetted-edge', 'Whetted Edge', 'power', 1, 'none', [status('edge', 4)], {
    up: { effects: [status('edge', 6)] },
  }),
  // (Backstab)
  q('uncommon', 'knife-in-the-back', 'Knife in the Back', 'attack', 0, 'foe', [dmg(11)], {
    innate: true,
    exhaust: true,
    up: { effects: [dmg(15)] },
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
    { up: { effects: [discard(2), addTo('sleeve-knife+', 2)] } },
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
  q('uncommon', 'ghost-knives', 'Ghost Knives', 'power', 1, 'none', [status('honed', 9)], {
    up: { effects: [status('honed', 12)] },
  }),
  // (Up My Sleeve)
  q('uncommon', 'spare-blades', 'Spare Blades', 'skill', 2, 'none', [
    addTo('sleeve-knife', 3),
    { op: 'selfCost', amount: 1 },
  ]),
  // (Echoing Slash)
  q('uncommon', 'rippling-cut', 'Rippling Cut', 'attack', 1, 'none', [
    { op: 'damage', amount: 10, to: 'allFoes', repeatOnKill: true },
  ]),
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
    [scaled(dmg(0), per('attacksPlayed', 6))],
    { up: { effects: [scaled(dmg(0), per('attacksPlayed', 8))] } },
  ),
  // (Skewer: an X card, so its upgrade is X+1, as every X card's is, not 11 damage)
  q('uncommon', 'run-through', 'Run Through', 'attack', 0, 'foe', [hitsPer(8, 'x')], { x: true }),
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
  q('uncommon', 'clean-cut', 'Clean Cut', 'attack', 0, 'foe', [scaled(dmg(13), per('hand', -2))]),
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
  q('rare', 'inked-blades', 'Inked Blades', 'skill', 1, 'none', [addTo('inked-knife', 2)]),
  // (Fan of Knives: knives hit every enemy for the rest of the fight)
  q(
    'rare',
    'wide-arc',
    'Wide Arc',
    'power',
    2,
    'none',
    [status('fanned', 1), addTo('sleeve-knife', 4)],
    { up: { effects: [status('fanned', 1), addTo('sleeve-knife', 5)] } },
  ),
  // (Knife Trap)
  q('rare', 'recall-the-blades', 'Recall the Blades', 'skill', 2, 'foe', [knifeTrap(false)], {
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
    [on('play', [dmg(4, 'randomFoe')])],
    { up: { effects: [on('play', [dmg(6, 'randomFoe')])] } },
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
      up: { effects: [defer(4, true), discard(99), status('poised', 1)] },
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
    [discard(99), addTo('sleeve-knife', 0, 'hand', per('discardedNow'))],
    { up: { effects: [discard(99), addTo('sleeve-knife+', 0, 'hand', per('discardedNow'))] } },
  ),
  // (The Hunt: a kill gives one more card reward after the fight, which the run hands out)
  q(
    'rare',
    'marked-for-death',
    'Marked for Death',
    'attack',
    1,
    'foe',
    [onKill(dmg(10), [extraReward(1)])],
    {
      exhaust: true,
      up: { effects: [onKill(dmg(15), [extraReward(1)])] },
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
      up: { effects: [dmg(8), status('seared', 4, 'target')] },
    },
  ),
  // (Snakebite)
  q('common', 'vipers-kiss', "Viper's Kiss", 'skill', 2, 'foe', [status('seared', 7, 'target')], {
    retain: true,
    up: { effects: [status('seared', 10, 'target')] },
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
  q('uncommon', 'thin-the-blood', 'Thin the Blood', 'power', 1, 'none', [status('virulent', 1)]),
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
    2,
    'none',
    [status('seared', 4, 'allFoes'), status('faltering', 1, 'allFoes')],
    { up: { effects: [status('seared', 6, 'allFoes'), status('faltering', 2, 'allFoes')] } },
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
    { up: { effects: [on('turnStart', [status('seared', 3, 'allFoes')])] } },
  ),
  // (Strangle: the enemy loses HP whenever you play a card this turn)
  q(
    'uncommon',
    'garrote',
    'Garrote',
    'attack',
    1,
    'foe',
    [dmg(8), status('strangled', 2, 'target', true)],
    { up: { effects: [dmg(10), status('strangled', 3, 'target', true)] } },
  ),
  // (Corrosive Wave)
  q(
    'rare',
    'hemorrhage',
    'Hemorrhage',
    'skill',
    1,
    'none',
    [on('draw', [status('seared', 2, 'allFoes')], { temp: true })],
    { up: { effects: [on('draw', [status('seared', 3, 'allFoes')], { temp: true })] } },
  ),
  // (Envenom)
  q(
    'rare',
    'serrated-edges',
    'Serrated Edges',
    'power',
    2,
    'none',
    [on('hitFoe', [status('seared', 1, 'target')])],
    { up: { effects: [on('hitFoe', [status('seared', 2, 'target')])] } },
  ),
  // (Outbreak: Bleed on every enemy, and it burns at once)
  q(
    'rare',
    'bloodburst',
    'Bloodburst',
    'skill',
    1,
    'none',
    [status('seared', 9, 'allFoes'), tick('allFoes')],
    { up: { effects: [status('seared', 12, 'allFoes'), tick('allFoes')] } },
  ),
  // (Malaise: Strength lost for good is Sapped for good)
  q(
    'rare',
    'sapping-wound',
    'Sapping Wound',
    'skill',
    0,
    'foe',
    [
      scaled(status('sapped', 0, 'target'), per('x')),
      scaled(status('faltering', 0, 'target'), per('x')),
    ],
    { x: true, exhaust: true },
  ),
  // (Tracking: Weak enemies take 50% more from Attacks)
  q('rare', 'blood-scent', 'Blood Scent', 'power', 2, 'none', [status('tracking', 1)], {
    up: { cost: 1 },
  }),

  // --- Sleight ---
  // (Anticipate: Dexterity this turn is Bracing this turn)
  q(
    'common',
    'sense-the-blow',
    'Sense the Blow',
    'skill',
    0,
    'none',
    [status('bracing', 2, 'self', true)],
    {
      up: { effects: [status('bracing', 4, 'self', true)] },
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
  q('common', 'turn-aside', 'Turn Aside', 'skill', 0, 'none', [barrier(4)]),
  // (Dodge and Roll)
  q('common', 'roll-away', 'Roll Away', 'skill', 1, 'none', [barrier(4), status('guarded', 4)], {
    up: { effects: [barrier(6), status('guarded', 6)] },
  }),
  // (Prepared)
  q('common', 'shuffle-up', 'Shuffle Up', 'skill', 0, 'none', [draw(1), discard(1)], {
    up: { effects: [draw(2), discard(2)] },
  }),
  // (Untouchable: Sly)
  q('common', 'slip-the-blow', 'Slip the Blow', 'skill', 2, 'none', [barrier(6), defer()], { sly: true }),
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
    [discard(99), scaled(draw(0), per('discardedNow'))],
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
    [draw(1), when('skillsDrawnNow', { atLeast: 1 }, [barrier(3)])],
    {
      exhaust: true,
      up: { effects: [draw(1), when('skillsDrawnNow', { atLeast: 1 }, [barrier(5)])] },
    },
  ),
  // (Expertise)
  q('uncommon', 'practiced-hands', 'Practiced Hands', 'skill', 1, 'none', [
    { op: 'draw', amount: 2, hold: true },
  ]),
  // (Expose: Artifact is Steadfast)
  q(
    'uncommon',
    'lay-bare',
    'Lay Bare',
    'skill',
    0,
    'foe',
    [{ op: 'strip', to: 'target' }, status('exposed', 2, 'target')],
    { exhaust: true },
  ),
  // (Flechettes: 5 damage once for each Skill in your hand)
  q('uncommon', 'needle-rain', 'Needle Rain', 'attack', 1, 'foe', [hitsPer(5, 'skillsInHand')], {
    up: { effects: [hitsPer(7, 'skillsInHand')] },
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
  q('uncommon', 'quick-reflexes', 'Quick Reflexes', 'skill', 3, 'none', [draw(1), defer()], { sly: true }),
  // (Sidestep: a card of your hand waits a turn and comes back cheaper)
  q('uncommon', 'side-slip', 'Side Slip', 'skill', 0, 'none', [defer()]),
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
  q('uncommon', 'cool-head', 'Cool Head', 'skill', 3, 'none', [mana(1)], {
    sly: true,
    up: { effects: [mana(2)] },
  }),
  // (Abrasive: Sly)
  q(
    'rare',
    'razor-skin',
    'Razor Skin',
    'power',
    3,
    'none',
    [status('bracing', 1), status('thorns', 4)],
    { sly: true, up: { effects: [status('bracing', 1), status('thorns', 6)] } },
  ),
  // (Adrenaline)
  q('rare', 'rush-of-blood', 'Rush of Blood', 'skill', 0, 'none', [mana(1), draw(2)], {
    exhaust: true,
    up: { effects: [mana(2), draw(2)] },
  }),
  // (Afterimage: the upgrade is in your opening hand)
  q('rare', 'shadow-echo', 'Shadow Echo', 'power', 1, 'none', [on('play', [barrier(1)])], {
    up: { innate: true },
  }),
  // (Bullet Time)
  q('rare', 'stilled-time', 'Stilled Time', 'skill', 3, 'none', [drawLock, { op: 'freeHand' }]),
  // (Burst)
  q('rare', 'double-trick', 'Double Trick', 'skill', 1, 'none', [status('mirrored', 1)]),
  // (Master Planner)
  q('rare', 'grand-scheme', 'Grand Scheme', 'power', 2, 'none', [status('planner', 1)], {
    up: { cost: 1 },
  }),
  // (Murder)
  q('rare', 'slow-murder', 'Slow Murder', 'attack', 3, 'foe', [scaled(dmg(1), per('drawn'))], {
    up: { cost: 2 },
  }),
  // (Nightmare)
  q(
    'rare',
    'recurring-dream',
    'Recurring Dream',
    'skill',
    3,
    'none',
    [{ op: 'copyNext', times: 3 }],
    {
      exhaust: true,
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
    [status('meld', 1, 'self', true)],
    {
      up: { cost: 0 },
    },
  ),
  // (Tools of the Trade: the card discarded is a random one)
  q('rare', 'nimble-routine', 'Nimble Routine', 'power', 1, 'none', [
    on('turnStart', [draw(1), discard(1, 'random')]),
  ]),
  // (Well-Laid Plans: your whole hand Holds every turn)
  q('rare', 'patient-hands', 'Patient Hands', 'power', 1, 'none', [
    on('turnEnd', [status('holdfast', 1)]),
  ]),
];
