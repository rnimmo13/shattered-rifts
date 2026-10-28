// Valeria, the knight (Aurelion). No companions. She is the Slay the Spire 2 Ironclad on purpose, for now (Robert, 2026-10-28:
// "our knight should more closely resemble the ironclad with some different mechanics"; "just add all of those"; DECISIONS #364, #366):
// the same cards under original names, one for every card of the Ironclad's (DECISIONS #367: "i want this class as a reference point for
// balancing other classes"), and nothing else: Thorns, Traps and her own older cards are gone. The only Ironclad cards missing are
// Tank and Demonic Shield (they need a second player) and Break (an event card in their game). Each card's comment names the Ironclad
// card it imitates; numbers and rarities are the Ironclad's (StS2 v0.103.2) unless a comment says why not.
//
// Build paths are hidden for now (DECISIONS #365) and the headings below are only a first sort, to be redone when they come back:
//   Bulwark - Barrier that scales, and hits for the Barrier you hold
//   Might   - Might (Strength) and cards that hit many times, so it pays; Exposed as the setup
//   Consume - Consume your own cards for value (draw, Barrier, damage); Corruption, Dark Embrace, Fiend Fire
//   Blood   - pay HP for Mana, cards and Might; payoffs for losing it
// Numbers assume 3 Mana and a 5-card hand.

import type { CardDef } from '@sr/combat';
import {
  barrier,
  copyPlayed,
  copySelf,
  discoverOp,
  dmg,
  doubleSt,
  draw,
  drawLock,
  drawUntil,
  exhaustN,
  exhaustTop,
  fetchCards,
  forge,
  heal,
  lose,
  mana,
  manaLock,
  maxHpUp,
  on,
  onKill,
  per,
  playPile,
  pool,
  scaled,
  status,
  statusTheirs,
  transformHand,
  upgradeOp,
  when,
} from '../build';

const m = pool('knight', 'aurelion');

export const KNIGHT: CardDef[] = [
  // --- basics ---
  // (the Bash of the deck: a 2-Mana hit that sets up Exposed)
  m('basic', 'sundering-blow', 'Sundering Blow', 'attack', 2, 'foe', [
    dmg(8),
    status('exposed', 2, 'target'),
  ]),

  // --- Bulwark ---
  // (Body Slam: your Barrier, as damage)
  m('common', 'bulwark-blow', 'Bulwark Blow', 'attack', 1, 'foe', [
    scaled(dmg(0), per('barrier', 1)),
  ]),
  // (Shrug It Off)
  m('common', 'oath-of-iron', 'Oath of Iron', 'skill', 1, 'none', [barrier(8), draw(1)]),
  // (Armaments: a little Barrier, and one card in your hand is upgraded for the fight)
  m('common', 'field-repairs', 'Field Repairs', 'skill', 1, 'none', [
    barrier(5),
    upgradeOp('random'),
  ]),
  // (Evil Eye)
  m('uncommon', 'cold-stare', 'Cold Stare', 'skill', 1, 'none', [
    barrier(8),
    when('exhaustedTurn', { atLeast: 1 }, [barrier(8)]),
  ]),
  // (Taunt)
  m('uncommon', 'provoke', 'Provoke', 'skill', 1, 'foe', [
    barrier(7),
    status('exposed', 1, 'target'),
  ]),
  // (Stone Armor)
  m('uncommon', 'stoneskin', 'Stoneskin', 'power', 1, 'none', [status('plating', 4)], {
    up: { effects: [status('plating', 6)] },
  }),
  // (Colossus: Exposed enemies hit you half as hard until your next turn)
  m('uncommon', 'giants-stance', "Giant's Stance", 'skill', 1, 'none', [
    barrier(5),
    status('sturdy', 1),
  ]),
  // (Juggernaut)
  m('rare', 'bastion-engine', 'Bastion Engine', 'power', 2, 'none', [
    on('barrier', [dmg(5, 'randomFoe')]),
  ]),
  // (Impervious)
  m(
    'rare',
    'immovable-oath',
    'Immovable Oath',
    'skill',
    2,
    'none',
    [barrier(30)],
    {
      exhaust: true,
    },
  ),
  // (Barricade) Fortified is huge: 3 Mana, 2 upgraded (DECISIONS #349)
  m('rare', 'unbroken-wall', 'Unbroken Wall', 'power', 3, 'none', [status('fortified', 1)], {
    up: { cost: 2 },
  }),
  // (Unmovable)
  m('rare', 'stone-stance', 'Stone Stance', 'power', 2, 'none', [status('unmovable', 1)]),
  // (Flame Barrier: hits back for 4 this turn, as Thorns that wear off)
  m('uncommon', 'ember-ward', 'Ember Ward', 'skill', 2, 'none', [
    barrier(12),
    status('thorns', 4, 'self', true),
  ]),

  // --- Might ---
  // (Twin Strike)
  m('common', 'twin-cut', 'Twin Cut', 'attack', 1, 'foe', [dmg(5, 'target', 2)]),
  // (Setup Strike)
  m('common', 'braced-strike', 'Braced Strike', 'attack', 1, 'foe', [
    dmg(7),
    status('might', 2, 'self', true),
  ]),
  // (Sword Boomerang)
  m('common', 'cleaving-throws', 'Cleaving Throws', 'attack', 1, 'none', [
    dmg(3, 'randomFoe', 3),
  ]),
  // (Pommel Strike)
  m('common', 'hilt-strike', 'Hilt Strike', 'attack', 1, 'foe', [dmg(9), draw(1)]),
  // (Thunderclap)
  m('common', 'clarion-clap', 'Clarion Clap', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    status('exposed', 1, 'allFoes'),
  ]),
  // (Tremble)
  m('common', 'rattle', 'Rattle', 'skill', 1, 'foe', [status('exposed', 3, 'target')], {
    exhaust: true,
  }),
  // (Perfected Strike: every card with Strike in its name, in the whole deck)
  m('common', 'mastered-strike', 'Mastered Strike', 'attack', 2, 'foe', [
    scaled(dmg(6), per('strikes', 2)),
  ]),
  // (Inflame)
  m('uncommon', 'steel-resolve', 'Steel Resolve', 'power', 1, 'none', [status('might', 2)]),
  // (Fight Me!)
  m(
    'uncommon',
    'challenge',
    'Challenge',
    'attack',
    2,
    'foe',
    [dmg(5, 'target', 2), status('might', 2), status('might', 1, 'target')],
    // (the enemy's Might stays 1: more Might for you is the upgrade)
    { up: { effects: [dmg(5, 'target', 2), status('might', 3), status('might', 1, 'target')] } },
  ),
  // (Dominate)
  m(
    'uncommon',
    'intimidate',
    'Intimidate',
    'skill',
    1,
    'foe',
    [status('exposed', 1, 'target'), scaled(status('might', 0), per('exposed', 1, 'target'))],
    { exhaust: true },
  ),
  // (Dismantle: it hits twice against an Exposed enemy)
  m('uncommon', 'break-guard', 'Break Guard', 'attack', 1, 'foe', [
    dmg(8),
    when('exposed', { atLeast: 1, of: 'target' }, [dmg(8)]),
  ]),
  // (Uppercut)
  m('uncommon', 'rising-fist', 'Rising Fist', 'attack', 2, 'foe', [
    dmg(13),
    status('faltering', 1, 'target'),
    status('exposed', 1, 'target'),
  ]),
  // (Bully)
  m('uncommon', 'pile-on', 'Pile On', 'attack', 0, 'foe', [
    scaled(dmg(4), per('exposed', 2, 'target')),
  ]),
  // (Whirlwind)
  m(
    'uncommon',
    'whirling-blade',
    'Whirling Blade',
    'attack',
    0,
    'none',
    [{ op: 'damage', amount: 5, hits: 0, to: 'allFoes', scale: { by: 'x', into: 'hits' } }],
    { x: true },
  ),
  // (Rampage: every copy gains damage each time you play one)
  m(
    'uncommon',
    'mounting-fury',
    'Mounting Fury',
    'attack',
    1,
    'foe',
    [scaled(dmg(9), per('bonus')), forge('mounting-fury', 5)],
    { up: { effects: [scaled(dmg(9), per('bonus')), forge('mounting-fury', 8)] } },
  ),
  // (Bludgeon)
  m('uncommon', 'hammer-fall', 'Hammer Fall', 'attack', 3, 'foe', [dmg(32)]),
  // (Pillage)
  m('uncommon', 'plunder', 'Plunder', 'attack', 1, 'foe', [dmg(6), drawUntil('attack')]),
  // (Stomp: 12 to everyone, and it costs 1 less for every Attack you have played this turn)
  m('uncommon', 'trampling-charge', 'Trampling Charge', 'attack', 3, 'none', [dmg(12, 'allFoes')], {
    cheaperPerAttack: 1,
  }),
  // (Unrelenting)
  m('uncommon', 'relentless-push', 'Relentless Push', 'attack', 2, 'foe', [
    dmg(12),
    status('freeattack', 1),
  ]),
  // (Rage)
  m('uncommon', 'berserkers-rage', "Berserker's Rage", 'skill', 0, 'none', [
    on('play', [barrier(3)], { filter: 'attack', temp: true }),
  ]),
  // (Stampede)
  m('uncommon', 'charging-herd', 'Charging Herd', 'power', 2, 'none', [
    on('turnEnd', [playPile('hand', { kind: 'attack' })]),
  ]),
  // (Juggling: your third Attack each turn comes back to your hand)
  m('uncommon', 'jugglers-rhythm', "Juggler's Rhythm", 'power', 1, 'none', [
    on('play', [when('attacksPlayed', { atLeast: 3, atMost: 3 }, [copyPlayed])], {
      filter: 'attack',
    }),
  ]),
  // (Vicious)
  m('uncommon', 'scent-of-weakness', 'Scent of Weakness', 'power', 1, 'none', [
    on('exposeFoe', [draw(1)]),
  ]),
  // (Demon Form)
  m('rare', 'warlords-oath', "Warlord's Oath", 'power', 3, 'none', [
    on('turnStart', [status('might', 2)]),
  ]),
  // (Conflagration)
  m('rare', 'wildfire', 'Wildfire', 'attack', 1, 'none', [
    scaled(dmg(8, 'allFoes'), per('attacksPlayed', 2)),
  ]),
  // (One-Two Punch)
  m('rare', 'double-down', 'Double Down', 'skill', 1, 'none', [status('twinned', 1)]),
  // (Cruelty)
  m('rare', 'cruel-streak', 'Cruel Streak', 'power', 1, 'none', [status('cruelty', 1)]),
  // (Mangle: the enemy hits 10 softer through its next turn)
  m('rare', 'crippling-blow', 'Crippling Blow', 'attack', 3, 'foe', [
    dmg(15),
    statusTheirs('sapped', 10, 'target'),
  ]),
  // (Feed: if it kills, your max HP grows for good)
  m(
    'rare',
    'bloodfeast',
    'Bloodfeast',
    'attack',
    1,
    'foe',
    [onKill(dmg(10), [maxHpUp(3)])],
    { exhaust: true },
  ),
  // (Hellraiser: every Strike you draw is played against a random enemy)
  m('rare', 'raised-hell', 'Raised Hell', 'power', 2, 'none', [
    on('draw', [playPile('drawn', { match: 'strike' })]),
  ]),
  // (Aggression: an Attack from your discard pile comes back upgraded every turn)
  m('rare', 'unforgiving-drill', 'Unforgiving Drill', 'power', 1, 'none', [
    on('turnStart', [fetchCards(1, 'hand', 'attack', true)]),
  ]),
  // (Primal Force: every Attack in your hand becomes a Giant Rock)
  m('rare', 'stone-fury', 'Stone Fury', 'skill', 0, 'none', [transformHand('attack', 'giant-rock')]),
  m('common', 'giant-rock', 'Giant Rock', 'attack', 1, 'foe', [dmg(16)], { source: 'token' }),

  // --- Consume ---
  // (True Grit)
  m('common', 'sacrificial-guard', 'Sacrificial Guard', 'skill', 1, 'none', [
    barrier(7),
    exhaustN(1, 'random'),
  ]),
  // (Cinder)
  m('common', 'scorching-blow', 'Scorching Blow', 'attack', 2, 'foe', [
    dmg(17),
    exhaustN(1, 'random'),
  ]),
  // (Molten Fist)
  m(
    'common',
    'searing-fist',
    'Searing Fist',
    'attack',
    1,
    'foe',
    [dmg(10), doubleSt('exposed', 'target', 2, 3)],
    { exhaust: true },
  ),
  // (Headbutt)
  m('common', 'ram-home', 'Ram Home', 'attack', 1, 'foe', [dmg(9), fetchCards(1, 'draw')]),
  // (Havoc: play the top card of your draw pile, and consume it)
  m('common', 'wild-gamble', 'Wild Gamble', 'skill', 1, 'none', [
    playPile('draw', { exhaust: true }),
  ]),
  // (Ashen Strike)
  m('uncommon', 'smoldering-blow', 'Smoldering Blow', 'attack', 1, 'foe', [
    scaled(dmg(6), per('exhausted', 1)),
  ]),
  // (Battle Trance: draw 3, and no more this turn)
  m('uncommon', 'grim-focus', 'Grim Focus', 'skill', 0, 'none', [draw(3), drawLock]),
  // (Feel No Pain)
  m('uncommon', 'numbing-rite', 'Numbing Rite', 'power', 1, 'none', [
    on('exhaust', [barrier(3)]),
  ]),
  // (Infernal Blade)
  m(
    'uncommon',
    'borrowed-blade',
    'Borrowed Blade',
    'skill',
    1,
    'none',
    [discoverOp('attack', 1, true)],
    {
      exhaust: true,
      up: { effects: [discoverOp('attack', 2, true)] },
    },
  ),
  // (Second Wind: every card that is not an Attack is consumed, 5 Barrier for each)
  m('uncommon', 'bitter-breath', 'Bitter Breath', 'skill', 1, 'none', [
    exhaustN(99, 'choose', { not: 'attack' }),
    scaled(barrier(0), per('exhaustedNow', 5)),
  ]),
  // (Drum of Battle)
  m('uncommon', 'war-drums', 'War Drums', 'power', 0, 'none', [
    draw(2),
    on('turnStart', [exhaustTop(1)]),
  ]),
  // (Expect a Fight: a Mana for every Attack in your hand, and no more Mana this turn)
  m('uncommon', 'brace-for-battle', 'Brace for Battle', 'skill', 2, 'none', [
    scaled(mana(0), per('attacksInHand')),
    manaLock,
  ]),
  // (Forgotten Ritual)
  m(
    'uncommon',
    'ritual-of-ash',
    'Ritual of Ash',
    'skill',
    1,
    'none',
    [when('exhaustedTurn', { atLeast: 1 }, [mana(3)])],
    { exhaust: true },
  ),
  // (Thrash: consume a random Attack in your hand and add its damage)
  m('rare', 'flailing-blows', 'Flailing Blows', 'attack', 1, 'foe', [
    exhaustN(1, 'random', { only: 'attack' }),
    dmg(4, 'target', 2),
    scaled(dmg(0), per('exhaustedDamage')),
  ]),
  // (Dark Embrace)
  m('rare', 'rite-of-recall', 'Rite of Recall', 'power', 2, 'none', [on('exhaust', [draw(1)])]),
  // (Corruption: your Skills cost 0 and are consumed)
  m('rare', 'unholy-pact', 'Unholy Pact', 'power', 3, 'none', [status('unbound', 1)], {
    up: { cost: 2 },
  }),
  // (Fiend Fire: 7 damage for every card in your hand, and the whole hand is consumed)
  m(
    'rare',
    'burn-it-all',
    'Burn It All',
    'attack',
    2,
    'foe',
    [scaled(dmg(0), per('hand', 7)), exhaustN(99)],
    { exhaust: true, up: { effects: [scaled(dmg(0), per('hand', 10)), exhaustN(99)] } },
  ),
  // (Brand)
  m('rare', 'forsake', 'Forsake', 'skill', 0, 'none', [
    lose(1),
    exhaustN(1),
    status('might', 1),
  ]),
  // (Cascade: play the top X cards of your draw pile)
  m(
    'rare',
    'unravel',
    'Unravel',
    'skill',
    0,
    'none',
    [playPile('draw', { amount: 0, scale: per('x') })],
    { x: true },
  ),
  // (Stoke: consume your hand, and a random card of your pool comes for each one)
  m('rare', 'fan-the-flames', 'Fan the Flames', 'skill', 1, 'none', [
    exhaustN(99),
    discoverOp(undefined, 0, false, per('exhaustedNow')),
  ]),
  // (Howl From Beyond: it comes back from the consumed pile every turn)
  m('uncommon', 'howl-of-the-fallen', 'Howl of the Fallen', 'attack', 3, 'none', [dmg(16, 'allFoes')], {
    exhaust: true,
    replayFromExhaust: true,
  }),
  m('rare', 'ashen-reckoning', 'Ashen Reckoning', 'attack', 0, 'none', [dmg(17, 'allFoes')], {
    needsExhausted: 3,
  }),

  // --- Blood ---
  // (Bloodletting)
  m('common', 'draw-blood', 'Draw Blood', 'skill', 0, 'none', [lose(3), mana(2)], {
    exhaust: true,
  }),
  // (Blood Wall)
  m('common', 'blood-plate', 'Blood Plate', 'skill', 2, 'none', [lose(2), barrier(16)]),
  // (Breakthrough)
  m('common', 'breach', 'Breach', 'attack', 1, 'none', [lose(1), dmg(9, 'allFoes')]),
  // (Hemokinesis)
  m('uncommon', 'reckless-smite', 'Reckless Smite', 'attack', 1, 'foe', [lose(2), dmg(15)]),
  // (Rupture)
  m('uncommon', 'scar-over', 'Scar Over', 'power', 1, 'none', [
    on('loseHp', [status('might', 1)]),
  ]),
  // (Inferno)
  m('uncommon', 'blood-fire', 'Blood Fire', 'power', 1, 'none', [
    on('turnStart', [lose(1)]),
    on('loseHp', [dmg(6, 'allFoes')]),
  ]),
  // (Spite: it hits twice if you have lost HP this turn)
  m('uncommon', 'spiteful-jab', 'Spiteful Jab', 'attack', 0, 'foe', [
    dmg(6),
    when('hpLostTurn', { atLeast: 1 }, [dmg(6)]),
  ]),
  // (Offering)
  m('rare', 'crimson-offering', 'Crimson Offering', 'skill', 0, 'none', [lose(6), mana(2), draw(3)], {
    exhaust: true,
  }),
  // (Crimson Mantle)
  m('rare', 'bloodied-plate', 'Bloodied Plate', 'power', 1, 'none', [
    on('turnStart', [lose(1), barrier(8)]),
  ]),
  // (Tear Asunder: one more hit for every time you have lost HP this fight)
  m('rare', 'rending-fury', 'Rending Fury', 'attack', 2, 'foe', [
    scaled(dmg(5), per('hpLostFight', 1, undefined, 'hits')),
  ]),
  // (Not Yet)
  m('rare', 'rally', 'Rally', 'skill', 2, 'none', [heal(10)], { exhaust: true }),

  // --- glue ---
  // (Iron Wave)
  m('common', 'dawn-smite', 'Dawn Smite', 'attack', 1, 'foe', [dmg(5), barrier(5)]),
  // (Anger)
  m('common', 'hot-temper', 'Hot Temper', 'attack', 0, 'foe', [dmg(6), copySelf('discard')]),
  // (Burning Pact)
  m('uncommon', 'pact-of-embers', 'Pact of Embers', 'skill', 1, 'none', [exhaustN(1), draw(2)]),
  // (Pyre)
  m('rare', 'inner-furnace', 'Inner Furnace', 'power', 2, 'none', [on('turnStart', [mana(1)])]),
];
