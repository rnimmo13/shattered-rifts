// Obsidia, Spellblade of the Hollow Crown (display name; the id stays 'spellblade', DECISIONS #140). A spellblade of black glass and ember.
// No companions. She is the Slay the Spire 2 Regent's card list on purpose, for now (Robert, 2026-10-28: "close copies of the originals,
// but obviously change names and keep our theme, i will adjust things going forward, but we need good baselines right now"), in her own
// theme: the Regent's Stars are her Arcana (the `stars` op and the `starCost` field), his Sovereign Blade is her Obsidian Blade (the
// token 'starforged-blade', sharpened by the `forge` op), his minions are her Retainers and his Colorless cards are Neutral cards.
// One card for every card of the Regent's (StS2 Beta v0.111; Arcana costs from sts2.untapped.gg), and nothing else. Not copied:
// Constellation, Largesse, Tutor and Hammer Time (they need a second player) and Royalties (gold after a fight is an economy change,
// for Robert to decide). Each card's comment names the Regent card it copies; numbers and rarities are the Regent's unless the comment
// says why not (DECISIONS #369).
//
// Build paths are hidden for now (DECISIONS #365) and the headings below are only a first sort, to be redone when they come back:
//   Blade  - sharpen the Obsidian Blade and swing it
//   Arcana - gain Arcana and spend it on big cards
//   Court  - create cards (Retainers, Neutral cards, Rubble), play many, and the Auras that pay for it

import type { CardDef, Op } from '@sr/combat';
import {
  addTo,
  barrier,
  barrierNext,
  cheapen,
  copyInHand,
  discoverNeutral,
  dmg,
  draw,
  drawNext,
  endTurnOp,
  exhaustN,
  fetchAnywhere,
  fetchCards,
  forge,
  growSelf,
  mana,
  manaNext,
  on,
  onKill,
  per,
  playPile,
  pool,
  scaled,
  seekTop,
  stars,
  starsNext,
  status,
  statusTheirs,
  topdeck,
  transformSome,
  when,
} from '../build';

const a = pool('spellblade', 'starfall');
/** the Obsidian Blade: the Regent's Sovereign Blade */
const BLADE = 'starforged-blade';
const sharpen = (n: number): Op => forge(BLADE, n);
/** "Deal N damage for each M" as a number of hits */
const hitsPer = (
  amount: number,
  by: Parameters<typeof per>[0],
  to: 'target' | 'allFoes' | 'randomFoe' = 'target',
): Op => ({
  op: 'damage',
  amount,
  hits: 0,
  to,
  scale: per(by, 1, undefined, 'hits'),
});
/** Weak and Vulnerable: Faltering and Exposed */
const weakVuln = (n: number): Op[] => [
  status('faltering', n, 'target'),
  status('exposed', n, 'target'),
];

export const SPELLBLADE: CardDef[] = [
  // --- basics and tokens ---
  // (Falling Star)
  a('basic', 'meteor-jab', 'Cinderfall', 'attack', 0, 'foe', [dmg(8), ...weakVuln(1)], {
    starCost: 2,
    up: { effects: [dmg(12), ...weakVuln(1)] },
  }),
  // (Venerate)
  a('basic', 'gather-light', 'Gather Arcana', 'skill', 1, 'none', [stars(2)]),
  // (Sovereign Blade: 2 Mana, 10 damage, Hold; every Sharpen adds to it for the fight)
  a('common', BLADE, 'Obsidian Blade', 'attack', 2, 'foe', [scaled(dmg(10), per('bonus'))], {
    retain: true,
    tags: ['blade'],
    source: 'token',
    weapon: true,
  }),
  // (Debris: a card that only takes up room; it costs 1 to play away)
  a('basic', 'rubble', 'Rubble', 'skill', 1, 'none', [], {
    exhaust: true,
    source: 'token',
    hero: 'junk',
  }),
  // (Minion Strike)
  a('common', 'retainer-strike', 'Retainer Strike', 'attack', 0, 'foe', [dmg(6), draw(1)], {
    exhaust: true,
    source: 'token',
    up: { effects: [dmg(9), draw(1)] },
  }),
  // (Minion Dive Bomb)
  a('common', 'retainer-dive', 'Retainer Dive', 'attack', 0, 'foe', [dmg(13)], {
    exhaust: true,
    source: 'token',
    up: { effects: [dmg(16)] },
  }),
  // (Minion Sacrifice)
  a('common', 'retainer-guard', 'Retainer Guard', 'skill', 0, 'none', [barrier(7)], {
    exhaust: true,
    source: 'token',
    up: { effects: [barrier(10)] },
  }),

  // --- Blade ---
  // (Wrought in War)
  a('common', 'forged-in-fury', 'Forged in Fury', 'attack', 1, 'foe', [dmg(7), sharpen(7)], {
    up: { effects: [dmg(9), sharpen(9)] },
  }),
  // (Refine Blade)
  a('common', 'whetstone', 'Whetstone', 'skill', 1, 'none', [sharpen(8), manaNext(1)], {
    up: { effects: [sharpen(12), manaNext(1)] },
  }),
  // (Spoils of Battle)
  a('common', 'spoils', 'Spoils', 'skill', 1, 'none', [sharpen(6), draw(2)], {
    up: { effects: [sharpen(9), draw(2)] },
  }),
  // (Patter)
  a('common', 'feint', 'Feint', 'skill', 1, 'none', [barrier(8), status('vigor', 2)], {
    up: { effects: [barrier(10), status('vigor', 3)] },
  }),
  // (Celestial Might)
  a('common', 'obsidian-flurry', 'Obsidian Flurry', 'attack', 2, 'foe', [dmg(6, 'target', 3)], {
    up: { effects: [dmg(6, 'target', 4)] },
  }),
  // (Kingly Kick: it costs 1 less every time you draw it, until you play it)
  a('uncommon', 'tyrants-stomp', "Tyrant's Stomp", 'attack', 4, 'foe', [dmg(27)], {
    onDraw: [cheapen(1, 'self')],
    up: { effects: [dmg(35)] },
  }),
  // (Kingly Punch: every time you draw it, it hits harder for the fight)
  a(
    'uncommon',
    'crowned-fist',
    'Crowned Fist',
    'attack',
    1,
    'foe',
    [scaled(dmg(8), per('bonus'))],
    {
      onDraw: [growSelf(4)],
      up: { effects: [scaled(dmg(10), per('bonus'))], onDraw: [growSelf(6)] },
    },
  ),
  // (Bulwark)
  a('uncommon', 'bladewall', 'Bladewall', 'skill', 2, 'none', [barrier(12), sharpen(10)], {
    up: { effects: [barrier(15), sharpen(13)] },
  }),
  // (Conqueror: the Blade strikes the chosen enemy twice as hard this turn)
  a(
    'uncommon',
    'conqueror',
    'Crowned Edge',
    'skill',
    1,
    'foe',
    [sharpen(3), status('bladebane', 1, 'target', true)],
    { up: { effects: [sharpen(5), status('bladebane', 1, 'target', true)] } },
  ),
  // (Summon Forth: the Blade comes to your hand from wherever it is, then is sharpened; a new one is made if there is none)
  a(
    'uncommon',
    'call-the-blade',
    'Call the Blade',
    'skill',
    1,
    'none',
    [fetchAnywhere('blade'), sharpen(8)],
    {
      up: { effects: [fetchAnywhere('blade'), sharpen(11)] },
    },
  ),
  // (Terraforming)
  a('uncommon', 'forge-heat', 'Heat of the Forge', 'skill', 1, 'none', [status('vigor', 7)], {
    up: { effects: [status('vigor', 10)] },
  }),
  // (Furnace)
  a('uncommon', 'warm-anvil', 'Warm Anvil', 'power', 1, 'none', [on('turnStart', [sharpen(5)])], {
    up: { effects: [on('turnStart', [sharpen(7)])] },
  }),
  // (Parry)
  a(
    'uncommon',
    'parry',
    'Glass Guard',
    'power',
    1,
    'none',
    [on('play', [barrier(10)], { tag: 'blade' })],
    {
      up: { effects: [on('play', [barrier(14)], { tag: 'blade' })] },
    },
  ),
  // (Beat into Shape: the Sharpen grows with every earlier hit on that enemy this turn)
  a(
    'rare',
    'hammer-and-anvil',
    'Hammer and Anvil',
    'attack',
    1,
    'foe',
    [scaled(sharpen(5), per('hitsTaken', 5, 'target')), dmg(5)],
    { up: { effects: [scaled(sharpen(5), per('hitsTaken', 7, 'target')), dmg(7)] } },
  ),
  // (Heavenly Drill: X hits, twice as many at 4 or more; its "+" is X+1, as for every X card, not 10 damage)
  a(
    'rare',
    'obsidian-drill',
    'Obsidian Drill',
    'attack',
    0,
    'foe',
    [hitsPer(8, 'x'), when('x', { atLeast: 4 }, [hitsPer(8, 'x')])],
    { x: true },
  ),
  // (Seeking Edge)
  a(
    'rare',
    'cleaving-edge',
    'Cleaving Edge',
    'power',
    1,
    'none',
    [sharpen(7), status('bladesweep', 1)],
    {
      up: { effects: [sharpen(11), status('bladesweep', 1)] },
    },
  ),
  // (Sword Sage: the Blade is played twice; the source gives no upgrade, so it is a Mana cheaper)
  a('rare', 'echoing-blade', 'Echoing Blade', 'power', 2, 'none', [status('bladeecho', 1)], {
    up: { cost: 1 },
  }),
  // (The Smith)
  a('rare', 'the-forgemaster', 'The Forgemaster', 'skill', 1, 'none', [sharpen(30)], {
    starCost: 4,
    up: { effects: [sharpen(40)] },
  }),
  // (Big Bang)
  a(
    'rare',
    'big-bang',
    'Magma Surge',
    'skill',
    0,
    'none',
    [draw(1), mana(1), stars(1), sharpen(5)],
    {
      exhaust: true,
      up: { innate: true },
    },
  ),

  // --- Arcana ---
  // (Astral Pulse)
  a('common', 'astral-pulse', 'Arcane Pulse', 'attack', 0, 'none', [dmg(6, 'allFoes', 2)], {
    starCost: 3,
    up: { effects: [dmg(8, 'allFoes', 2)] },
  }),
  // (Crescent Spear: 2 more for every card with an Arcana cost in your deck)
  a(
    'common',
    'cosmic-lance',
    'Obsidian Lance',
    'attack',
    1,
    'foe',
    [scaled(dmg(8), per('starCards', 2))],
    {
      starCost: 1,
      up: { effects: [scaled(dmg(8), per('starCards', 3))] },
    },
  ),
  // (Guiding Star)
  a('common', 'skybolt', 'Spellbolt', 'attack', 1, 'foe', [dmg(12), drawNext(2)], {
    starCost: 2,
    up: { effects: [dmg(13), drawNext(3)] },
  }),
  // (Solar Strike)
  a('common', 'sunstrike', 'Emberstrike', 'attack', 1, 'foe', [dmg(9), stars(1)], {
    up: { effects: [dmg(10), stars(2)] },
  }),
  // (Cloak of Stars)
  a('common', 'star-barrier', 'Arcane Barrier', 'skill', 0, 'none', [barrier(7)], { starCost: 1 }),
  // (Gather Light)
  a('common', 'pale-beacon', 'Pale Ward', 'skill', 1, 'none', [barrier(8), stars(1)], {
    up: { effects: [barrier(11), stars(1)] },
  }),
  // (Glow)
  a('common', 'faint-glow', 'Faint Ember', 'skill', 1, 'none', [stars(1), draw(1), drawNext(1)], {
    up: { effects: [stars(2), draw(1), drawNext(1)] },
  }),
  // (Hidden Cache)
  a('common', 'ember-cache', 'Ember Cache', 'skill', 1, 'none', [stars(1), starsNext(3)], {
    up: { effects: [stars(1), starsNext(4)] },
  }),
  // (Know Thy Place)
  a('common', 'humble', 'Humble', 'skill', 0, 'foe', weakVuln(1), {
    exhaust: true,
    up: { exhaust: false },
  }),
  // (Devastate)
  a('uncommon', 'devastate', 'Molten Ruin', 'attack', 1, 'foe', [dmg(35)], {
    starCost: 4,
    up: { effects: [dmg(45)] },
  }),
  // (Gamma Blast)
  a('uncommon', 'gamma-burst', 'Glass Burst', 'attack', 0, 'foe', [dmg(13), ...weakVuln(2)], {
    starCost: 3,
    up: { effects: [dmg(18), ...weakVuln(2)] },
  }),
  // (Knockout Blow)
  a(
    'uncommon',
    'final-shatter',
    'Final Shatter',
    'attack',
    3,
    'foe',
    [onKill(dmg(30), [stars(5)])],
    {
      up: { effects: [onKill(dmg(38), [stars(5)])] },
    },
  ),
  // (Radiate: one hit on every enemy for each Arcana gained this turn)
  a(
    'uncommon',
    'radiance',
    'Arcane Flood',
    'attack',
    0,
    'none',
    [hitsPer(3, 'starsGained', 'allFoes')],
    {
      up: { effects: [hitsPer(4, 'starsGained', 'allFoes')] },
    },
  ),
  // (Shining Strike)
  a('uncommon', 'shard-strike', 'Shard Strike', 'attack', 1, 'foe', [dmg(8), stars(2)], {
    after: 'drawTop',
    up: { effects: [dmg(11), stars(2)] },
  }),
  // (Stardust: it spends all your Arcana, one hit on a random enemy for each)
  a(
    'uncommon',
    'falling-sky',
    'Falling Shards',
    'attack',
    0,
    'none',
    [hitsPer(5, 'x', 'randomFoe')],
    {
      starX: true,
      up: { effects: [hitsPer(7, 'x', 'randomFoe')] },
    },
  ),
  // (Hegemony)
  a('uncommon', 'sovereign-strike', 'Tyrant Strike', 'attack', 2, 'foe', [dmg(15), manaNext(2)], {
    up: { effects: [dmg(18), manaNext(3)] },
  }),
  // (Black Hole: whenever you gain or spend Arcana)
  a(
    'uncommon',
    'gravity-well',
    'Hungering Void',
    'power',
    1,
    'none',
    [on('gainArcana', [dmg(3, 'allFoes')]), on('arcana', [dmg(3, 'allFoes')])],
    { up: { effects: [on('gainArcana', [dmg(4, 'allFoes')]), on('arcana', [dmg(4, 'allFoes')])] } },
  ),
  // (Child of the Stars: 2 Barrier for each Arcana spent)
  a(
    'uncommon',
    'cygnus',
    'Sigil of Glass',
    'power',
    1,
    'none',
    [on('arcana', [scaled(barrier(0), per('spent', 2))])],
    {
      up: { effects: [on('arcana', [scaled(barrier(0), per('spent', 3))])] },
    },
  ),
  // (Alignment)
  a('uncommon', 'chart-the-orbit', 'Ley Line', 'skill', 0, 'none', [mana(2)], {
    starCost: 3,
    up: { effects: [mana(3)] },
  }),
  // (Convergence)
  a(
    'uncommon',
    'banked-embers',
    'Banked Embers',
    'skill',
    1,
    'none',
    [manaNext(1), starsNext(1), status('holdfast', 1)],
    { up: { effects: [manaNext(1), starsNext(2), status('holdfast', 1)] } },
  ),
  // (Reflect)
  a(
    'uncommon',
    'mirror-glass',
    'Mirror Glass',
    'skill',
    1,
    'none',
    [barrier(15), status('reflect', 1)],
    {
      starCost: 3,
      up: { effects: [barrier(20), status('reflect', 1)] },
    },
  ),
  // (Resonance: Arcana cost 2, the newer list's; the enemies' Might loss lasts)
  a(
    'uncommon',
    'crowns-weight',
    'Weight of the Crown',
    'skill',
    1,
    'none',
    [status('might', 1), status('sapped', 1, 'allFoes')],
    { starCost: 2, up: { effects: [status('might', 2), status('sapped', 1, 'allFoes')] } },
  ),
  // (Royal Gamble)
  a('uncommon', 'starburst', 'Arcane Burst', 'skill', 0, 'none', [stars(9)], {
    starCost: 5,
    exhaust: true,
    up: { retain: true },
  }),
  // (Particle Wall)
  a('uncommon', 'glass-wall', 'Glass Wall', 'skill', 0, 'none', [barrier(9)], {
    starCost: 2,
    after: 'hand',
    up: { effects: [barrier(12)] },
  }),
  // (Comet)
  a('rare', 'comet', 'Lava Bomb', 'attack', 0, 'foe', [dmg(33), ...weakVuln(3)], {
    starCost: 5,
    up: { effects: [dmg(44), ...weakVuln(3)] },
  }),
  // (Dying Star: every enemy hits 9 softer through its next turn)
  a(
    'rare',
    'dying-star',
    'Dying Ember',
    'attack',
    1,
    'none',
    [dmg(9, 'allFoes'), statusTheirs('sapped', 9, 'allFoes')],
    {
      starCost: 3,
      ethereal: true,
      up: { effects: [dmg(11, 'allFoes'), statusTheirs('sapped', 11, 'allFoes')] },
    },
  ),
  // (Seven Stars: the source gives no upgrade, so it is a Mana cheaper)
  a('rare', 'seven-shards', 'Seven Shards', 'attack', 2, 'none', [dmg(7, 'allFoes', 7)], {
    starCost: 7,
    up: { cost: 1 },
  }),
  // (Genesis)
  a('rare', 'orion', 'Sigil of Kindling', 'power', 2, 'none', [on('turnStart', [stars(2)])], {
    up: { effects: [on('turnStart', [stars(3)])] },
  }),
  // (Neutron Aegis: Plating, as Valeria's Stoneskin has it)
  a('rare', 'obsidian-aegis', 'Obsidian Aegis', 'power', 1, 'none', [status('plating', 8)], {
    starCost: 5,
    up: { effects: [status('plating', 11)] },
  }),
  // (Decisions, Decisions: the Skill played 3 times is a random one of your hand, not chosen)
  a(
    'rare',
    'weigh-the-crown',
    'Weigh the Crown',
    'skill',
    0,
    'none',
    [draw(3), playPile('hand', { kind: 'skill', repeat: 3 })],
    {
      starCost: 6,
      exhaust: true,
      up: { effects: [draw(5), playPile('hand', { kind: 'skill', repeat: 3 })] },
    },
  ),

  // --- Court ---
  // (Collision Course)
  a('common', 'magma-crash', 'Magma Crash', 'attack', 0, 'foe', [dmg(10), addTo('rubble')], {
    up: { effects: [dmg(14), addTo('rubble')] },
  }),
  // (Crush Under: every enemy hits 1 softer through its next turn)
  a(
    'common',
    'molten-weight',
    'Molten Weight',
    'attack',
    1,
    'none',
    [dmg(8, 'allFoes'), statusTheirs('sapped', 1, 'allFoes')],
    { up: { effects: [dmg(9, 'allFoes'), statusTheirs('sapped', 2, 'allFoes')] } },
  ),
  // (Photon Cut)
  a('common', 'gleam', 'Glint', 'attack', 1, 'foe', [dmg(10), draw(1), topdeck(1)], {
    up: { effects: [dmg(13), draw(2), topdeck(1)] },
  }),
  // (BEGONE!)
  a(
    'common',
    'out-of-my-sight',
    'Out of My Sight!',
    'skill',
    1,
    'none',
    [transformSome('retainer-strike', { amount: 1, choose: true })],
    { up: { effects: [transformSome('retainer-strike+', { amount: 1, choose: true })] } },
  ),
  // (Cosmic Indifference: the card put back on top of your draw pile is a random one of your discard pile)
  a(
    'common',
    'hollow-gaze',
    'Hollow Gaze',
    'skill',
    1,
    'none',
    [barrier(6), fetchCards(1, 'draw')],
    {
      up: { effects: [barrier(9), fetchCards(1, 'draw')] },
    },
  ),
  // (Glitterstream: 5 Barrier next turn, as sts2.untapped.gg has it)
  a('common', 'glass-veil', 'Glass Veil', 'skill', 2, 'none', [barrier(11), barrierNext(5)], {
    up: { effects: [barrier(13), barrierNext(7)] },
  }),
  // (Lunar Blast: one hit for each Skill played this turn)
  a('uncommon', 'hex-volley', 'Hex Volley', 'attack', 0, 'foe', [hitsPer(4, 'skillsPlayed')], {
    up: { effects: [hitsPer(5, 'skillsPlayed')] },
  }),
  // (Supermassive: 2 per card created, not 3: balance.test allows at most 2 per point of something that only grows)
  a(
    'uncommon',
    'collapsing-star',
    'Collapsing Vein',
    'attack',
    1,
    'foe',
    [scaled(dmg(5), per('created', 2))],
    {
      up: { effects: [scaled(dmg(8), per('created', 2))] },
    },
  ),
  // (Orbit: the source gives no upgrade, so it is a Mana cheaper)
  a('uncommon', 'orbit', 'Sigil of Momentum', 'power', 2, 'none', [status('orbit', 1)], {
    up: { cost: 1 },
  }),
  // (Pale Blue Dot)
  a(
    'uncommon',
    'distant-ember',
    'Distant Ember',
    'power',
    1,
    'none',
    [on('turnEnd', [when('played', { atLeast: 5 }, [drawNext(1)])])],
    { up: { effects: [on('turnEnd', [when('played', { atLeast: 5 }, [drawNext(2)])])] } },
  ),
  // (Pillar of Creation)
  a(
    'uncommon',
    'pillar-of-light',
    'Pillar of Glass',
    'power',
    1,
    'none',
    [on('created', [barrier(2)])],
    {
      up: { effects: [on('created', [barrier(3)])] },
    },
  ),
  // (Spectrum Shift: the source gives no upgrade, so it is a Mana cheaper)
  a(
    'uncommon',
    'sigil-of-wandering',
    'Sigil of Wandering',
    'power',
    2,
    'none',
    [on('turnStart', [discoverNeutral()])],
    { up: { cost: 1 } },
  ),
  // (CHARGE!!: the two cards are random ones of your draw pile, not chosen)
  a(
    'uncommon',
    'to-arms',
    'To Arms!',
    'skill',
    1,
    'none',
    [transformSome('retainer-dive', { amount: 2, from: 'draw' })],
    { up: { effects: [transformSome('retainer-dive+', { amount: 2, from: 'draw' })] } },
  ),
  // (Glimmer)
  a('uncommon', 'stellar-wind', 'Ash Wind', 'skill', 1, 'none', [draw(3), topdeck(1)], {
    up: { effects: [draw(4), topdeck(1)] },
  }),
  // (Manifest Authority)
  a(
    'uncommon',
    'royal-decree',
    'Royal Decree',
    'skill',
    1,
    'none',
    [barrier(7), discoverNeutral()],
    {
      up: { effects: [barrier(8), discoverNeutral(1, true)] },
    },
  ),
  // (Monologue)
  a(
    'uncommon',
    'grand-speech',
    'Grand Speech',
    'skill',
    0,
    'none',
    [on('play', [status('might', 1, 'self', true)], { temp: true })],
    { up: { retain: true } },
  ),
  // (Plot)
  a('uncommon', 'scheme', 'Scheme', 'skill', 1, 'none', [drawNext(2)]),
  // (Prophesize)
  a('uncommon', 'read-the-embers', 'Read the Embers', 'skill', 2, 'none', [draw(6)], {
    up: { effects: [draw(9)] },
  }),
  // (Quasar: a random Neutral card, not a choice of 3)
  a('uncommon', 'wild-spark', 'Wild Spark', 'skill', 0, 'none', [discoverNeutral()], {
    starCost: 2,
    up: { effects: [discoverNeutral(1, true)] },
  }),
  // (Bombardment)
  a('rare', 'endless-barrage', 'Endless Barrage', 'attack', 3, 'foe', [dmg(18)], {
    exhaust: true,
    replayFromExhaust: true,
    up: { effects: [dmg(24)] },
  }),
  // (Crash Landing)
  a(
    'rare',
    'supernova',
    'Cataclysm',
    'attack',
    1,
    'none',
    [dmg(21, 'allFoes'), addTo('rubble', 0, 'hand', per('handRoom'))],
    { up: { effects: [dmg(26, 'allFoes'), addTo('rubble', 0, 'hand', per('handRoom'))] } },
  ),
  // (Heirloom Hammer: the Neutral card copied is a random one of your hand, not chosen)
  a('rare', 'heirloom-maul', 'Heirloom Maul', 'attack', 2, 'foe', [dmg(20), copyInHand(true)], {
    up: { effects: [dmg(25), copyInHand(true)] },
  }),
  // (Make It So)
  a('rare', 'by-decree', 'By Decree', 'attack', 0, 'foe', [dmg(6)], {
    returnEvery: { kind: 'skill', n: 3 },
  }),
  // (Arsenal)
  a(
    'rare',
    'glass-armory',
    'Glass Armory',
    'power',
    1,
    'none',
    [on('created', [status('might', 1)])],
    {
      up: { innate: true },
    },
  ),
  // (Monarch's Gaze: the enemy each Attack is aimed at hits 1 softer through its next turn; no upgrade given, so a Mana cheaper)
  a(
    'rare',
    'tyrants-gaze',
    "Tyrant's Gaze",
    'power',
    2,
    'none',
    [on('play', [statusTheirs('sapped', 1, 'target')], { filter: 'attack' })],
    { up: { cost: 1 } },
  ),
  // (Tyranny: the card consumed is a random one of your hand, not chosen)
  a(
    'rare',
    'iron-rule',
    'Iron Rule',
    'power',
    1,
    'none',
    [on('turnStart', [draw(1), exhaustN(1, 'random')])],
    {
      up: { innate: true },
    },
  ),
  // (Void Form)
  a('rare', 'hollow-form', 'Hollow Form', 'power', 3, 'none', [endTurnOp, status('freeplay', 2)], {
    ethereal: true,
    up: { ethereal: false },
  }),
  // (Bundle of Joy)
  a('rare', 'rift-gifts', 'Rift Gifts', 'skill', 1, 'none', [discoverNeutral(3)], {
    exhaust: true,
    up: { effects: [discoverNeutral(4)] },
  }),
  // (Foregone Conclusion: "next turn, put 2 cards of your choice from your draw pile into your hand". The choice is made now and the
  // cards wait on top of the draw pile, then 2 extra are drawn next turn: the same hand, with no choice at the start of a turn)
  a('rare', 'fated-hand', 'Fated Hand', 'skill', 1, 'none', [seekTop(2), drawNext(2)], {
    up: { effects: [seekTop(3), drawNext(3)] },
  }),
  // (GUARDS!!!: any number of cards in your hand become Retainer Guards)
  a(
    'rare',
    'call-the-guard',
    'Call the Guard!',
    'skill',
    2,
    'none',
    [transformSome('retainer-guard', { choose: true })],
    {
      exhaust: true,
      up: { effects: [transformSome('retainer-guard+', { choose: true })] },
    },
  ),
  // (I Am Invincible)
  a('rare', 'unbreakable-crown', 'Unbreakable Crown', 'skill', 1, 'none', [barrier(10)], {
    playFromTop: true,
  }),
];
