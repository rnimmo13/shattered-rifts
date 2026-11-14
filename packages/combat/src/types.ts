// Combat v2 data model (docs/08_COMBAT_V2.md). Everything here is plain JSON so a fight can be saved,
// replayed from seed + actions, and sent over the wire.

import type { RngState } from './rng';

/** 'a' is the player (or PvP seat 1); 'b' is the enemy side (or PvP seat 2). */
export type Side = 'a' | 'b';
export const other = (s: Side): Side => (s === 'a' ? 'b' : 'a');

export type UnitId = string;
export type CardId = string; // card definition id
export type InstId = string; // a card instance in a deck/hand/pile

export type StatusId =
  | 'exposed' // takes 50% more attack damage (turns)
  | 'faltering' // deals 25% less attack damage (turns)
  | 'might' // +1 attack damage per stack (permanent)
  | 'seared' // takes stacks damage at the start of its turn, then loses 1
  | 'burn' // (the Shaman's Flame, DECISIONS #421, #501) Burn: as Bleed, but Barrier soaks it, and it ticks before Barrier falls away
  | 'stunned' // counts as Exposed, Faltering and Brittle (never on top of them) for its own count of turns (DECISIONS #310)
  | 'thorns' // reflects stacks damage to attackers (permanent)
  | 'shielded' // ignores the next instance of damage per stack
  | 'backup' // each charge revives one fallen companion at half its base max HP, then is spent
  | 'resonance' // runes: +1 to the damage/Barrier of every rune effect per stack (permanent)
  | 'calm' // stance: leaving it grants Mana
  | 'wrath' // stance: you deal double attack damage and take 50% more
  | 'radiant' // stance: your first attack hit deals 2.5x, the rest double (triple until #764; #792); it ends with your turn
  | 'mantra' // builds towards Radiant: at MANTRA_GOAL you enter it
  | 'edge' // +1 damage per stack to the first EDGE_LIMIT (4) attacks tagged "knife" you play each turn (permanent; #692)
  | 'bracing' // +1 Barrier from every Barrier you gain, per stack (permanent)
  | 'brittle' // Barrier it gains is 25% smaller (turns)
  | 'ghostly' // each hit it takes is capped at 1 damage (turns)
  | 'slippery' // the next hit it takes is capped at 1 damage, and takes one off (a Warden's rule, DECISIONS #528)
  // (Wardens' rules, DECISIONS #546)
  | 'veiled' // its intent is hidden from the other side until it is hit; any hit takes it all off
  | 'gravity' // at the end of your turn, up to this many cards left in your hand go on top of your draw pile, costliest first
  | 'unmaking' // once your hand is drawn, your costliest card in it is Consumed, per stack; then it clears
  | 'steadfast' // the next debuff put on it is ignored, per stack
  | 'armored' // at the end of its turn it gains stacks Barrier; losing HP to an attack costs 1 stack
  | 'ritual' // at the end of its turn it gains stacks Might
  | 'vigor' // its next attack deals stacks more damage, then it is spent
  | 'doom' // if its HP is at or below its Doom at the end of its turn, it dies
  | 'twinned' // your next attack card is played twice, per stack
  | 'mirrored' // your next skill card is played twice, per stack
  | 'unbound' // your skills cost 0 and are consumed when played
  | 'fortified' // you keep 75% of your Barrier at the start of your turn instead of losing it all
  | 'plating' // at the end of its turn it gains this much Barrier, then this goes down by 1 (DECISIONS #513)
  | 'holdfast' // your whole hand is held at the end of your turn, per stack (one turn each)
  | 'hangover' // at the start of its turn it loses 1% of its Max HP per stack, rounded up (never below 1 HP), then it clears (KP's drinks; DECISIONS #354, #502)
  | 'clutch' // an innate trait's state: you deal this % more attack damage (set by the engine while you are hurt)
  | 'sapped' // its attacks deal this much less damage (it wears off at the end of its own turn when a card puts it on an enemy: one put on during that enemy's turn ends with it)
  | 'cruelty' // your attacks deal 25% more to Exposed enemies
  | 'sturdy' // you take half damage from Exposed enemies (until the enemies' next turn is over)
  | 'unmovable' // the first Barrier a card gives you each turn is doubled
  | 'freeattack' // your next Attack costs 0, per stack
  // (the Silent-shaped assassin's pieces: DECISIONS #368)
  | 'virulent' // Bleed on your enemies deals its damage this many more times each turn (and loses 1 each time)
  | 'honed' // your Daggers Hold, and the first one you play each turn deals this much more
  | 'fanned' // your Daggers hit ALL enemies (all they aim spreads, DECISIONS #552)
  | 'tracking' // your attacks deal 50% more to Faltering enemies
  | 'guarded' // at the start of your next turn you gain this much Barrier, then it clears
  | 'blur' // your Barrier is not removed at the start of your next turn (one turn per stack)
  | 'meld' // Barrier you gain is doubled
  | 'poised' // at the start of your next turn it becomes Empowered
  | 'empowered' // your attacks deal double damage (it wears off at the end of your turn)
  | 'strangled' // whenever the other side plays a card, it loses this much HP
  | 'freeskill' // your next Skill costs 0, per stack
  | 'planner' // a Skill you play gains Sly for the rest of the fight
  // --- the Regent's pieces (Obsidia, the spellblade; DECISIONS #369)
  | 'reflect' // Barrier that soaks an attack sends the soaked damage back to the attacker; it ends when your next turn starts
  | 'bladesweep' // your blade cards (tag BLADE_TAG: the Obsidian Blade) strike every enemy instead of one
  | 'bladeecho' // your blade-tagged attacks strike once more per stack (DECISIONS #488)
  | 'bladebane' // takes double damage from blade-tagged attacks (a card puts it on for the rest of the turn)
  | 'freeplay' // the first this-many cards you play each turn cost no Mana
  | 'orbit' // for every ORBIT_STEP Mana you spend, gain this much Mana
  // --- the Necrobinder copy (Dorian; DECISIONS #370)
  | 'marrow' // your companions' attacks deal this much more damage (Calcify)
  | 'reaping' // whenever your Attacks take HP off an enemy, it is cursed with that much Fate (Reaper Form)
  | 'debilitated' // Exposed and Faltering on it count double (turns: it wears off at the end of its own turn)
  | 'lethality' // your first Attack each turn deals this % more damage
  | 'noose' // cards tagged "noose" deal double damage to it, per stack (Hang)
  | 'quarry' // whenever one of your companions hits it, a companion like the one that hit it is raised with this much HP (this turn)
  | 'freeethereal' // your next Fleeting card costs 0, per stack
  // (the Defect copy, shaman: Echo Form, Signal Boost, Synthesis, One for All)
  | 'echoing' // the first card you play each turn is played an extra time (the first N cards, for N stacks)
  | 'boosted' // your next Aura is played an extra time, per stack
  | 'freepower' // your next Aura costs 0, per stack
  | 'deftness' // your 0-cost Attacks deal this much more damage
  // (the Knight's Guard, DECISIONS #415)
  | 'opening' // Open: a hit of its was fully stopped by a Guard hero's Barrier (at most 1); a Riposte against it spends it
  // (the Assassin's knives and Preparation, DECISIONS #416)
  | 'knives' // knives embedded in it by the other side (at most KNIFE_MAX); a card pulls them for a payoff
  | 'prep' // Preparation: the Assassin's setup, at most PREP_MAX, kept between turns; finishers spend it
  // (the Spellblade's, DECISIONS #417)
  | 'twinedge' // the next enchantment you discharge this turn takes effect twice (it is still spent once)
  // (the Shaman's commanded totems, DECISIONS #418)
  | 'spirit' // Spirit: at most SPIRIT_MAX, kept between turns; one is spent to empower a command (+SPIRIT_BOOST)
  | 'rousing' // your next command this turn deals or gives this much more (it wears off at the end of your turn)
  | 'shelter' // this turn, your next command that aims at a friendly gives its Barrier to every friendly
  | 'freespell' // (the Shaman, DECISIONS #420) your next elemental spell costs 0, per stack
  | 'spellcut' // (the Shaman's Moon Owl, DECISIONS #430) your next elemental spell this turn costs this much less; spent by it
  | 'twinspell' // (the Shaman's Moon Owl, DECISIONS #430) your next elemental spell is played twice, per stack
  | 'buffer' // the next time you would lose HP, you lose none instead (per stack; Barrier still soaks first)
  | 'umbra' // (the Shaman's Moon Owl, the Dark orb) the charge the Owls hold: it grows every turn, and a command spends it all
  // (the Monk's Martial Forms, DECISIONS #419)
  | 'mastery' // Mastery: at most MASTERY_MAX, kept between turns; earned by completing a form's technique, spent by techniques
  // (the Spellblade's Spell Power rework, DECISIONS #480)
  | 'fracture' // cracks on a unit that only ever add up: every SHATTER_AT, the side that put them there Shatters it, harder each time
  | 'keen' // your Sword hits deal this much more (permanent)
  | 'ruinous'; // your first Spell Attack each turn that spends Spell Power deals this much more per point spent
export const STATUS_IDS: readonly StatusId[] = [
  'exposed',
  'faltering',
  'might',
  'seared',
  'burn',
  'stunned',
  'thorns',
  'shielded',
  'backup',
  'resonance',
  'calm',
  'wrath',
  'radiant',
  'mantra',
  'edge',
  'bracing',
  'brittle',
  'ghostly',
  'slippery',
  'veiled',
  'gravity',
  'unmaking',
  'steadfast',
  'armored',
  'ritual',
  'vigor',
  'doom',
  'twinned',
  'mirrored',
  'unbound',
  'fortified',
  'plating',
  'holdfast',
  'hangover',
  'clutch',
  'sapped',
  'cruelty',
  'sturdy',
  'unmovable',
  'freeattack',
  'virulent',
  'honed',
  'fanned',
  'tracking',
  'guarded',
  'blur',
  'meld',
  'poised',
  'empowered',
  'strangled',
  'freeskill',
  'planner',
  'reflect',
  'bladesweep',
  'bladeecho',
  'bladebane',
  'freeplay',
  'orbit',
  'marrow',
  'reaping',
  'debilitated',
  'lethality',
  'noose',
  'quarry',
  'freeethereal',
  'echoing',
  'boosted',
  'freepower',
  'deftness',
  'opening',
  'knives',
  'prep',
  'twinedge',
  'fracture',
  'keen',
  'ruinous',
  'spirit',
  'rousing',
  'shelter',
  'mastery',
  'freespell',
  'umbra',
  'buffer',
];
/** Debuffs: a Steadfast unit ignores the next one put on it. */
export const DEBUFFS: readonly StatusId[] = [
  'fracture',
  'exposed',
  'faltering',
  'seared',
  'burn',
  'stunned',
  'brittle',
  'doom',
  'sapped',
  'strangled',
  'bladebane',
  'debilitated',
  'gravity',
  'unmaking',
];
export const STANCES = ['calm', 'wrath', 'radiant'] as const;
export type Stance = (typeof STANCES)[number];
/** Mantra needed to enter Radiant (the stack is spent). Slay the Spire's number: Radiant is a payoff you build to, not an opener. */
export const MANTRA_GOAL = 10;
/** Attacks from cards with this tag gain the Edge status's bonus damage. */
export const EDGE_TAG = 'knife';
/** The most knives one unit can have embedded, and the most Preparation a hero can hold (the Assassin, DECISIONS #416). */
export const KNIFE_MAX = 3;
export const PREP_MAX = 3;
/** The Shaman's totems (DECISIONS #420): the most positions he can grow to (8 since DECISIONS #459). Spirit has no cap (Robert, 2026-10-29). */
export const TOTEM_SLOTS = 8;
/** The Shaman's elements (DECISIONS #420): a spell's tag. A prism spell counts as the element he has not cast yet this turn. */
export const ELEMENTS = ['flame', 'frost', 'storm'] as const;
export type Element = (typeof ELEMENTS)[number];
export const PRISM_TAG = 'prism';
/** The Monk's Martial Forms (DECISIONS #419): the form changes which two techniques complete his objective, once a turn, for 1 Mastery. */
export const FORMS = ['root', 'current', 'ember'] as const;
export type Form = (typeof FORMS)[number];
export const MASTERY_MAX = 3;
/** The technique tags his cards carry ("Defensive technique", "Striking technique"): only tagged cards are steps of an objective. */
export const DEFENSIVE_TAG = 'defensive';
export const STRIKING_TAG = 'striking';
/**
 * The Spellblade's enchantments (DECISIONS #417): her Obsidian Blade holds ENCHANT_SLOTS of them, in the order they were imbued. A
 * discharge spends them: Ember adds EMBER_DAMAGE to the first hit of the attack, Glass deals GLASS_DAMAGE to every enemy after it (a
 * shard, not an attack), Ward gives WARD_BARRIER at once.
 */
export type Enchant = 'ember' | 'glass' | 'ward';
export const ENCHANTS: readonly Enchant[] = ['ember', 'glass', 'ward'];
export const ENCHANT_SLOTS = 2;
export const EMBER_DAMAGE = 3;
export const GLASS_DAMAGE = 2;
export const WARD_BARRIER = 3;
/** Cards with this tag are "the blade" for Blade Sweep, Blade Echo and Bladebane (Obsidia's Obsidian Blade). */
export const BLADE_TAG = 'blade';
/** (the Spellblade's Spell Power rework, DECISIONS #480) her Swords, and her Spells */
export const SWORD_TAG = 'sword';
export const SPELL_TAG = 'spell';
/** A unit Shatters at every this much Fracture. Its k-th Shatter deals SHATTER_BASE + SHATTER_STEP x k + the Spell Power of whoever applied it: 20 at 10, 23 at 20, 26 at 30... 47 at 100, with none held (DECISIONS #713, #726)
 * (plus what its owner's Deepening adds, DECISIONS #483). */
export const SHATTER_AT = 10;
export const SHATTER_BASE = 17;
/** 3 more each threshold since #726 (Robert: "lower teh shatterer step"; 5 since #713, 10 before) */
export const SHATTER_STEP = 3;
/** (DECISIONS #768) the step is in full for this many Shatters on a unit and half after; and what Deepening adds to every Shatter is in
 * full to SHATTER_BONUS_FULL and half after. Diminishing returns, as on every other stat that grows all fight (#762). */
export const SHATTER_STEP_FULL = 10;
export const SHATTER_BONUS_FULL = 15;
/** (DECISIONS #708, #713) from the Shatter at this much Fracture on, every Shatter also puts SHATTER_SPREAD Fracture on another enemy */
export const SHATTER_SPREAD_AT = 50;
export const SHATTER_SPREAD = 10;
/** In the Arena (1000 HP), HP a hero's own effects cost them is this many times what the card says, so paying HP is a real cost there:
 * "Lose 2 HP" costs 10. Five, not ten: an Arena opponent deals far more than a Campaign enemy (Robert, DECISIONS #707, #713).
 * The Campaign is unchanged. */
export const ARENA_HP_COST_MULT = 5;
/** Orbit pays out for every this much Mana spent. */
export const ORBIT_STEP = 4;
/** Mana gained when leaving Calm (the Monk's trait, the first time each turn: stepping in and out again pays nothing, so it cannot loop;
 * DECISIONS #413), and on entering Radiant (the engine). */
export const CALM_EXIT_MANA = 2;
export const RADIANT_ENTER_MANA = 1;
/** What Radiant multiplies attack damage by (3 until DECISIONS #764: a Sunwalker reaches it every turn from turn 3). */
export const RADIANT_DAMAGE = 2;
/** Radiant's first attack hit on an enemy, once a turn, rounded down (DECISIONS #792): above Fury's x2 without Fury's cost. */
export const RADIANT_FIRST_HIT = 2.5;
/** A hero's card that hits this many times or more carries half the Might and Primed on each hit, as an X card does (#711, #726). */
export const MANY_HITS = 3;
/** A Bleed or Burn tick deals the stack in full up to this much, and half of what is past it (#726). */
export const TICK_FULL = 30;
/** Ticks in one turn from this one on (counting from 0) deal half: the Bloodletter's own second tick is full, more from Hemorrhage are not. */
export const TICK_EXTRA_FROM = 2;

// --- effects (the op DSL) -------------------------------------------------------------------------------

/**
 * Who an op applies to, relative to whoever is acting (a hero playing a card, an ally acting, an enemy using a move):
 *  target      the chosen target (a card's target, or the foe an enemy/ally picked)
 *  self        the acting unit (for a card: the hero)
 *  hero        the hero on the actor's side (an ally guarding its hero)
 *  allFoes / randomFoe / front   foes on the other side (front = the one nearest the centre)
 *  allFriends  everyone on the actor's side, including the actor
 *  attacker    inside a Trap: the unit whose attack sprang it
 */
export type Sel =
  | 'target'
  | 'self'
  | 'hero'
  | 'allFoes'
  | 'randomFoe'
  | 'front'
  | 'allFriends'
  /** each of the actor's allies (companions, minions), never the hero */
  | 'allAllies'
  | 'attacker'
  /** the attacker if there is one still standing, or else a random enemy (a Thrall killed, or one sacrificed: DECISIONS #518) */
  | 'attackerOrRandom'
  /** the living enemy with the least HP (a Dark orb's awakening) */
  | 'weakestFoe'
  /** your living companion with the most max HP (DECISIONS #383) */
  | 'biggestAlly'
  /** (DECISIONS #437 review) the other side's hero, past any companion in front of it (an enemy's Fate) */
  | 'foeHero'
  /** the card's target if it still stands, or else the living enemy with the most Fracture (the first of them on a tie; DECISIONS #564) */
  | 'targetOrMostFracture'
  /** (Serrated Edges, #692) the card's target if it still stands, or else a random enemy */
  | 'targetOrRandom'
  /** (Blood Scent, #692) the living enemy with the most Bleed (the first of them on a tie) */
  | 'mostBledFoe';

/**
 * A number that depends on the board: `amount + floor(mult * metric)`. Unit metrics read `of` (default: the actor; "target" is the
 * card's chosen target; "each" is whichever unit the op is being applied to). `into: 'hits'` adds the result to a damage op's hit count instead.
 */
export type Metric =
  // about a unit
  | 'barrier'
  | 'hp'
  | 'missingHp'
  /** the share of the unit's max HP it is missing, 0-100 (a card that grows as you get hurt reads this, so it is the same in the
   * campaign and in the Arena, where heroes have several times the HP) */
  | 'missingPct'
  | 'seared'
  | 'burn' // (about a unit) its Burn
  | 'exposed'
  | 'faltering'
  | 'might'
  | 'thorns'
  | 'mantra'
  | 'hangover'
  | 'resonance'
  | 'doom'
  | 'calm' // 1 while in that stance
  | 'wrath'
  | 'radiant'
  // about the acting side
  | 'hand'
  | 'drawPile'
  | 'discardPile'
  | 'exhausted'
  | 'allies'
  | 'biggestAlly' // the max HP of your biggest living companion (DECISIONS #358)
  | 'slots' // the companion slots your companions fill: a Heavy counts 2, a Colossal 3 (DECISIONS #383)
  | 'foes'
  | 'snares'
  | 'stars'
  | 'runes'
  | 'powers' // Auras (Powers) you have in play
  | 'mana'
  | 'played' // cards played this turn (before this one)
  | 'attacksPlayed'
  /** (Final Flourish, #692) Attacks played this turn that cost 1 or more Mana when played (before this one) */
  | 'paidAttacksPlayed'
  | 'skillsPlayed' // Skills played this turn (before this one)
  | 'strikes' // cards with "Strike" in their name anywhere in your deck (hand, piles, consumed, and the card being played)
  | 'drawn' // cards drawn this fight
  | 'created' // cards created (added to a pile by an effect) this fight
  | 'discarded' // cards discarded by effects this turn
  | 'hpLostTurn' // times your hero lost HP this turn
  | 'hpLostFight' // times your hero lost HP this fight
  | 'fallenMaxHp' // in an 'allyDies' trigger: the fallen companion's max HP, when an enemy that is still standing killed it (else 0)
  | 'diedMaxHp' // in an 'allyDies' trigger: the fallen companion's max HP, however it died (Grave Debt, #688)
  | 'exhaustedTurn' // cards consumed this turn
  | 'attacksInHand'
  | 'nonAttacksInHand'
  | 'exhaustedNow' // cards the card being played has consumed so far
  | 'exhaustedDamage' // the damage of the Attacks the card being played has consumed so far
  | 'skillsInHand'
  | 'foesSeared' // the Bleed on all enemies together
  | 'discardedNow' // cards the card being played has discarded so far
  | 'skillsDrawnNow' // Skills the card being played has drawn so far
  | 'starsGained' // Arcana gained this turn
  | 'starCards' // cards with an Arcana cost anywhere in your deck (hand, piles, consumed, and the card being played)
  | 'handRoom' // room left in your hand (MAX_HAND less the cards in it)
  | 'hitsTaken' // (about a unit) times it has been hit by an attack this turn
  // (the Trickster's Suits) how many of the four suits are showing this turn (the card being played counts), and whether one is
  | 'suits'
  | 'spades'
  | 'hearts'
  | 'diamonds'
  | 'clubs'
  | 'fullTricks' // Full Tricks made earlier this fight (DECISIONS #398)
  | 'fullTrickTurn' // 1 after completing a Full Trick this turn
  | 'summonedFight' // successful non-starting companion summons by this side
  | 'snaresSprung' // this side's Traps sprung this fight
  | 'fervorGained' // positive Fervor gained by this side's hero this fight
  | 'fervorGainedTurn' // positive Fervor gained by this side's hero this turn (DECISIONS #721)
  | 'tagExhaustedBeforePlay' // tagged consumed cards, excluding the card whose play triggered this effect
  | 'spent' // in an 'arcana' trigger: the Arcana just spent
  // (the Defect copy, shaman)
  | 'runeKinds' // how many different totems you have
  | 'runesOf' // how many totems of the kind named by `rune` you have
  | 'channeledOf' // how many totems of the kind named by `rune` you have planted this fight
  | 'manaSpent' // Mana spent on cards this turn (this card's own cost included)
  | 'attacking' // 1 if the unit (usually the target) means to attack this turn
  // about the thing being resolved
  | 'x' // Mana spent on an X card
  | 'charge' // a rune's charge
  | 'healed' // in a 'heal' trigger: the HP the heal tried to restore (past full HP too)
  | 'bonus' // the forge bonus of the card being played
  // --- the Necrobinder copy (Dorian)
  | 'maxHp' // a unit's max HP
  | 'dealt' // the HP the card's last damage effect took off its target(s)
  | 'lost' // in an 'allyHurt' trigger: the HP the companion lost
  | 'hpLostNow' // (DECISIONS #434) in a 'loseHp' trigger: the HP just lost
  | 'allyStrikes' // times your companions were commanded to strike this turn (once per card)
  | 'drawnTurn' // cards drawn this turn after the opening hand
  | 'doomedTurn' // times you cursed an enemy with Fate this turn
  | 'samePlayed' // copies of the card being played already played this turn
  | 'etherealPlayed' // Fleeting cards played this fight
  | 'deaths' // units (either side) that have died this fight
  | 'tagExhausted' // consumed cards with the scale's `tag`
  | 'tagDeck' // cards with the scale's `tag` anywhere in your deck (the card being played included)
  | 'tagPlayed' // cards with the scale's `tag` you played earlier this fight (Death Grip's Commands, Robert 2026-11-08)
  // (the Knight's Guard, DECISIONS #415)
  | 'opening' // (about a unit) 1 while it is Open
  | 'foesOpen' // enemies that are Open
  | 'foesAttacking' // enemies that mean to attack this turn
  // (the Assassin, DECISIONS #416)
  | 'knives' // (about a unit) knives embedded in it
  | 'knivesAll' // knives embedded in all enemies together
  | 'prep' // (about a unit) its Preparation
  | 'extracted' // knives the card being played has pulled so far
  | 'prepSpent' // Preparation the card being played has spent
  // (the Spellblade, DECISIONS #417)
  | 'enchants' // enchantments on your blade (0-2)
  | 'enchantKinds' // different kinds of them
  | 'wards' // Ward enchantments on your blade
  | 'discharged' // enchantments the card being played has discharged
  // (the Spellblade's expansion, DECISIONS #425)
  | 'bladeEmbers' // Ember enchantments on your blade
  | 'bladeGlass' // Glass enchantments on your blade
  | 'bladePair' // 1 when both positions hold the same kind
  | 'dischargedPair' // 1 when the card being played discharged two of the same kind at once
  | 'dischargedMix' // 1 when it discharged two different kinds at once
  // (the Shaman, DECISIONS #418)
  | 'totems' // totems you have planted (0-3)
  | 'totemKinds' // different kinds of them
  | 'totemsOf' // your totems of the `rune` kind
  | 'spirit' // (about a unit) its Spirit
  | 'umbra' // (about a unit) the Moon Owl's charge
  | 'reserves' // your Reserves (the Mana Reserves trait pool)
  | 'commanded' // 1 once you have commanded a totem this turn
  | 'uprooted' // totems the card being played has uprooted
  | 'replacedNow' // totems the card being played has replaced with a different kind
  | 'spiritSpent' // Spirit the card being played has spent
  | 'thornsSpent' // (the Knight, DECISIONS #423) temporary Thorns the card being played has shed
  // (the Monk, DECISIONS #419)
  | 'mastery' // (about a unit) its Mastery
  | 'masterySpent' // Mastery the card being played has spent
  | 'techniqueDone' // 1 once you have completed your form's technique this turn
  | 'techniquesTurn' // technique cards (Defensive or Striking) you have played this turn
  | 'defensiveTurn' // Defensive techniques you have played this turn
  | 'inRoot' // 1 while you are in Root form
  | 'inCurrent' // 1 while you are in Current form
  | 'inEmber' // 1 while you are in Ember form
  // (the Monk's expansion, DECISIONS #426)
  | 'formProgress' // how far your form's objective is this turn: 0, 1 or 2 (complete)
  | 'vigor' // (about a unit) its Vigor: damage its next attack adds
  // (the Shaman, DECISIONS #420)
  | 'elementsTurn' // different elements you have cast this turn (0-3)
  | 'trinityDone' // 1 once Trinity has triggered this turn
  // (the Spellblade's Spell Power rework, DECISIONS #480)
  | 'starSpend' // the Spell Power this X or X/2 card spent
  | 'starsSpentTurn' // Spell Power spent this turn
  | 'lastSpend' // the Spell Power the card last played spent
  | 'prevSpell' // 1 when the card played just before this one this turn was a Spell
  | 'swordsPlayed' // Swords played this turn (before this one)
  | 'spellsPlayed' // Spells played this turn (before this one)
  | 'swordFoes' // different enemies your Swords have hit this turn
  | 'fracture' // (about a unit) the Fracture on it
  | 'shatteredNow'; // Shatters the card being played has caused so far
export interface Scale {
  by: Metric;
  mult?: number;
  of?: 'self' | 'target' | 'each';
  into?: 'amount' | 'hits';
  /** count the metric in steps: floor(metric / step) * mult ("5 more for every 10 Fate") */
  step?: number;
  /** for 'tagExhausted' / 'tagDeck': the tag counted */
  tag?: string;
  /** for 'runesOf' and 'channeledOf': which totem */
  rune?: string;
  /** (DECISIONS #434) the scaled part is at most this much ("+1 per HP you lost, at most 6") */
  max?: number;
  /** (DECISIONS #722) past this much, the scaled part grows at half the rate ("half as much past +28"), before `max` */
  half?: number;
  /** Lower bound and rounding of the scaled contribution. Defaults to floor with no minimum. */
  min?: number;
  round?: 'ceil';
}

/** When a Power's trigger fires. */
export type TriggerWhen =
  | 'turnStart'
  | 'turnEnd'
  | 'turnSettled' // after hand cleanup and companion actions, before turn-end decay
  | 'play'
  | 'playStart' // a legal card play, after payment but before its effects (also free plays)
  | 'exhaust'
  | 'discard'
  | 'summon' // you summoned an ally
  | 'allyDies' // one of your allies died (or was sacrificed)
  | 'allyLost' // one of your allies died or was scrapped (released to make room for another; DECISIONS #383)
  | 'snare' // one of your Traps sprang
  | 'stance' // you entered a stance
  | 'stanceLeft' // you left a stance (for another, or for none)
  | 'barrier' // your hero gained Barrier (from anything)
  | 'heal' // your hero was healed (from anything; a heal at full HP still counts, for its whole amount)
  | 'loseHp' // your hero lost HP to one of your own effects
  | 'hangoverPaid' // Hangover actually cost your hero HP
  | 'orderedCommand' // an explicit totem command finished (not a passive or a plant push-out)
  | 'hurt' // your hero lost HP to anything: an enemy's attack, or one of your own effects (Scarred Hide)
  | 'draw' // you drew a card
  | 'created' // a card was created in one of your piles
  | 'arcana' // you spent Arcana (a card's Arcana cost was paid; DECISIONS #288)
  | 'shuffle' // your discard pile was shuffled into a new draw pile (DECISIONS #299)
  | 'exposeFoe' // you put Exposed on an enemy
  | 'hitFoe' // one of your Attacks made an enemy lose HP (the trigger's target is that enemy)
  | 'drawMidTurn' // you drew a card during your turn (not the draw that starts it)
  | 'gainArcana' // you gained Arcana
  | 'doomFoe' // you cursed an enemy with Fate (the target is that enemy)
  | 'debuffFoe' // you put a debuff on an enemy (the target is that enemy)
  | 'allyHurt' // one of your companions lost HP (metric 'lost')
  | 'evoke' // one of your totems awakened (`rune` narrows it; the target is each enemy its awakening struck)
  | 'allSuits' // (the Trickster's Suits) all four suits are showing, the first time this turn (a Full Trick)
  // (the Knight's Guard, DECISIONS #415; the target is that enemy)
  | 'opening' // your Barrier fully stopped an enemy's attack hit and left it Open (an Opening earned, not one a card gives)
  | 'riposte' // you spent an enemy's Opening with a Riposte
  | 'thorns' // your Thorns struck an attacker
  // (the Assassin's knives, DECISIONS #416; the target is that enemy)
  | 'embed' // you embedded a knife in an enemy
  | 'extract' // you pulled a knife from an enemy
  | 'spend' // you spent stacks of a status of your own (`status` narrows which: Preparation)
  // (the Spellblade's, DECISIONS #417)
  | 'imbue' // you imbued an enchantment
  | 'discharge' // a card of yours discharged at least one enchantment
  | 'dischargeMixed' // a card discharged two different kinds at once
  | 'recast' // (DECISIONS #425) your newest enchantment was changed into another kind
  // (the Shaman's totems, DECISIONS #418; `rune` narrows them to one kind of spirit)
  | 'command' // you commanded a totem (the target is what its spirit aimed at)
  | 'plant' // you planted a totem
  | 'replace' // a totem you planted replaced one of a different kind
  // (the Monk's Martial Forms, DECISIONS #419)
  | 'technique' // you completed your form's technique (at most once a turn)
  | 'formChange' // you changed form
  // (the Shaman's Trinity, DECISIONS #420)
  | 'trinity' // you cast a Flame, a Frost and a Storm spell this turn (the first time each turn)
  // (the Spellblade's Spell Power rework, DECISIONS #480)
  | 'fracture' // a card of yours applied Fracture (Auras applying it do not count)
  | 'shatter' // you Shattered an enemy (the target is that enemy)
  | 'grown'; // a card of yours grew itself ("Grows N")

/** Data-driven combat disciplines. No class or card ids are interpreted by the engine. */
export type CombatDiscipline =
  | { kind: 'reserves'; perSpent: number; cap: number }
  | {
      kind: 'retaliation';
      perLostPct: number;
      roundCap: number;
      cap: number;
      paymentBonus?: number;
    }
  | {
      kind: 'frame';
      minSlots: number;
      perHp: number;
      cap: number;
      recoverPct?: number;
      recoverCap?: number;
    }
  /** `halfPast`: from this much on, each qualifying turn adds half of `perTurn` (DECISIONS #768) */
  | { kind: 'pursuit'; perTurn: number; cap: number; exposed: number; halfPast?: number }
  /** Preparation (the Assassin): each Skill adds perSkill%; or (the Predator's Ambush, #693) each card drawn on your turn after the
   * opening hand adds perDraw%. The next Attack spends it. `woundedPct`/`bonus`: more against a wounded enemy. `name`: what it is called */
  | {
      kind: 'execution';
      perSkill?: number;
      perDraw?: number;
      cap: number;
      woundedPct?: number;
      bonus?: number;
      name?: string;
    }
  /** (the Reaver, #693) every perHp HP your own effects cost you gives 1 Might for the fight, up to cap; at lowPct% HP or less your
   * Attacks heal healPct% of the HP they take off */
  | {
      kind: 'bloodlust';
      perHp: number;
      cap: number;
      healPct: number;
      lowPct: number;
      /** Might it gives a turn at most; the rest waits for a later payment */ perTurn?: number;
    }
  /** `cap`: the most Spirit cultivation gives in a fight (progress counts it) */
  | { kind: 'cultivation'; minimum: number; spirit: number; cap?: number }
  /** (the Trapmaster) Trap damage +perSprung% for each of your Traps already sprung this fight, up to cap% */
  | { kind: 'snarecraft'; perSprung: number; cap: number }
  /** (the Bladedancer) cards with `tag` deal +perCard% for each one played before it this turn, up to cap%; resets each turn */
  | { kind: 'volley'; tag: string; perCard: number; cap: number }
  /** the hero's card damage (Attacks and spells, not totems) +perSpirit% for each Spirit, up to cap% */
  | { kind: 'attunement'; perSpirit: number; cap: number }
  /** `grow`: what each element's bonus gains every time it triggers (1 when left out; DECISIONS #766) */
  | {
      kind: 'elements';
      flame: number;
      frost: number;
      storm: number;
      sequence: number;
      grow?: number;
    }
  | { kind: 'fury'; perEntry: number; cap: number; barrier: number; perExit: number }
  | { kind: 'radiance'; first: number; step: number; cap: number }
  | { kind: 'spellCycle'; perSpent: number; refundDivisor: number }
  /** `attackPct`: the hero's Attacks deal that much % more per Fermentation (#695) */
  | { kind: 'brewing'; cap: number; healPct: number; barrier: number; attackPct?: number }
  | { kind: 'harvest'; base: number; perConsumed: number; roundLimit?: number }
  | {
      kind: 'commandGuard';
      tag: string;
      unit: string;
      unitName: string;
      perAlly: number;
      cap: number;
    }
  | {
      kind: 'desperation';
      threshold: number;
      bonus: number;
      emergencyBarrierPct: number;
      rampFrom?: number;
      attackBarrierPct?: number;
      /** below the threshold the bonus keeps growing, to `deepBonus` at `deepAt`% HP */
      deepBonus?: number;
      deepAt?: number;
    };

export interface DisciplineState {
  rule: CombatDiscipline;
  /** Current charge, investment, or progress, as described by rule.kind. */
  progress: number;
  roundGain: number;
  /** (bloodlust) the Might given so far, and this turn */
  given?: number;
  givenTurn?: number;
  givenAt?: number;
  usedTurn?: number;
  exitTurn?: number;
  target?: UnitId;
  used?: boolean;
  counts?: Partial<Record<Element, number>>;
  elementTurns?: Partial<Record<Element, number>>;
  lastElement?: Element;
  /** Frame recovery saved for the next newly built qualifying companion (never a revival). */
  recovery?: number;
  paymentTurn?: number;
  /** First qualifying card awaiting completion; survives choices and save restoration. */
  guardCard?: string;
}

export type Op =
  | { op: 'discipline'; rule: CombatDiscipline }
  /** Shared per-side allowance, including copies/replays; claimed only when this operation is reached. */
  | { op: 'oncePerTurn'; key: string; ownTurn?: boolean; ops: Op[] }
  /** `lonePct`: Point Blank, this much more damage (percent) when it hits only one enemy */
  /** `lifesteal`: the attacker heals this percent of the HP the attack took off (Barrier it hit does not count; DECISIONS #285) */
  | {
      op: 'damage';
      amount: number;
      hits?: number;
      to: Sel;
      scale?: Scale;
      lonePct?: number;
      /** (Death Grip, #696) x`mult` damage to an enemy at `belowPct`% of its max HP or less, as the hit lands */
      finisher?: { belowPct: number; mult: number };
      lifesteal?: number;
      /** with `to: 'randomFoe'`: each hit finds an enemy no earlier hit of it struck, so `hits` is how many different
       * enemies it strikes, once each (fewer when fewer are standing; DECISIONS #357) */
      distinct?: boolean;
      /** run these once for each enemy this kills (Feed: gain max HP) */
      onKill?: Op[];
      /** the whole effect happens again once for each enemy it kills (Echoing Slash) */
      repeatOnKill?: boolean;
      /** Riposte (the Knight, DECISIONS #415): against an Open target, every hit deals this much more and the Opening is spent */
      riposte?: number;
      /** each hit that lands applies this much Fracture to what it struck (DECISIONS #480) */
      hitFracture?: number;
    }
  | { op: 'loseHp'; amount: number; to: Sel; scale?: Scale } // unblockable, unmodified
  | { op: 'barrier'; amount: number; to: Sel; scale?: Scale }
  | { op: 'heal'; amount: number; to: Sel; scale?: Scale }
  /** companions (never a hero) gain this much max HP, and heal as much: a minion that grows instead of only being shielded */
  | { op: 'growHp'; amount: number; to: Sel; scale?: Scale }
  /**
   * lessen every debuff (Exposed, Faltering, Seared, Stunned, Brittle, Doom) on the target by `amount` stacks, or by `pct`% of its
   * stacks (rounded up) when that is more, so it still bites on a big pile of Doom; `all` dispels them completely
   */
  | { op: 'cleanse'; amount: number; to: Sel; all?: boolean; pct?: number }
  /** `temp`: the stacks wear off again at the end of the acting side's turn (a Flex) */
  | {
      op: 'status';
      status: StatusId;
      amount: number;
      to: Sel;
      scale?: Scale;
      /** true: wears off at the end of your turn; 'theirs': lasts through the other side's next turn (Mangle on an enemy, Flame Barrier's Thorns on you) */
      temp?: boolean | 'theirs';
    }
  /** multiply the stacks of a status already on the target (floor); 2 doubles it */
  /** multiply a status (Double the Seared...); `max` is the most stacks it adds, so a doubler played again and again cannot run away */
  | { op: 'scaleStatus'; status: StatusId; mult: number; to: Sel; max?: number }
  /** `hold`: the cards drawn Hold this turn; `keepCost`: of the cards drawn this way, those that cost more than this are discarded at once (Scrape) */
  | { op: 'draw'; amount: number; scale?: Scale; hold?: boolean; keepCost?: number }
  | { op: 'mana'; amount: number; scale?: Scale }
  | { op: 'stars'; amount: number; scale?: Scale }
  /** (DECISIONS #480) apply Fracture; `marked`: only to those that already have some */
  | { op: 'fracture'; amount: number; to: Sel; scale?: Scale; marked?: boolean }
  /** your Shatters deal this much more for the rest of the fight */
  /** `pct`: every Shatter deals that much more, in percent (DECISIONS #542) */
  | { op: 'shatterUp'; amount: number; pct?: number }
  /** your companions' attacks deal this much more, in percent, for the rest of the fight (DECISIONS #542) */
  | { op: 'allyPct'; amount: number }
  /** Continuous bonus per attack hit. Applies to present and future units without granting transferable Might. */
  | { op: 'attackAura'; amount: number; scope: 'friends' | 'companions'; perSummons?: number }
  /** deal your current Shatter damage (it is not a Shatter: no Fracture is removed and nothing that answers a Shatter hears of it) */
  | { op: 'shatterBlast'; to: Sel }
  /** apply to the target half the Fracture on your most-cracked other enemy (it keeps its own) plus `amount`; with one enemy, apply `alone` */
  | { op: 'carryFracture'; amount: number; alone: number }
  /** choose a card in your hand with this tag: it yields this much more for the rest of the fight (The Forgemaster) */
  | { op: 'empower'; amount: number; tag: string }
  /** `ifAbsent`: nothing happens while one of that unit stands on this side */
  | {
      op: 'summon';
      unit: string;
      ifAbsent?: boolean;
      /** Release matching friendly summons before making room; not deaths. */ replace?: string[];
      /** (#693) it arrives with this much more max HP (Dire Wolf+) */
      bonusHp?: number;
    }
  /** (Gorrmaw's rule, DECISIONS #546) every other unit of this kind on your side is eaten: for each, heal `heal` and gain `might`
   * Might, plus `healPct` percent of its max HP; with none to eat, `none` happens instead */
  | { op: 'devour'; unit: string; heal: number; might: number; none?: Op[]; healPct?: number }
  /** (the Upside-Down Stag's rule, DECISIONS #546) its Barrier and the other side's hero's change places */
  | { op: 'swapBarrier' }
  | {
      op: 'addCard';
      card: CardId;
      to: 'hand' | 'discard' | 'draw';
      side: 'self' | 'foe';
      /** how many copies (default 1; with a scale this is the base) */
      times?: number;
      scale?: Scale;
    }
  /** every ally of the actor acts now; `bare`: without their Might (Wild Hunt, DECISIONS #768) */
  | { op: 'actAllies'; bare?: boolean }
  | { op: 'prevent' } // Trap only: cancel the attack that sprang it
  // --- choices and card movement (card effects only; a choice asks the player and the card resumes afterwards)
  | { op: 'discard'; amount: number; random?: boolean; any?: boolean }
  | {
      op: 'exhaustCards';
      amount: number;
      random?: boolean;
      any?: boolean;
      /** only cards of this kind, or every kind but this one */
      only?: CardKind;
      not?: CardKind;
      /** only cards with this tag */
      tag?: string;
      /** every such card in your hand, draw pile and discard pile, without a choice (Flak Cannon) */
      everywhere?: boolean;
    }
  | { op: 'scry'; amount: number }
  // --- Powers: run `ops` whenever `when` happens (`filter`/`tag` narrow 'play')
  | {
      op: 'power';
      when: TriggerWhen;
      ops: Op[];
      /** 'play': only cards of this kind / with this tag; 'stance' / 'stanceLeft': only entering / leaving this stance */
      filter?: CardKind;
      tag?: string;
      /** 'play': cards with this tag answer too ("a Sword or a Spell", DECISIONS #564) */
      orTag?: string;
      stance?: Stance;
      /** it ends with this turn (Rage) */
      temp?: boolean;
      /** it answers only the first time each turn (Iteration, Feral) */
      once?: boolean;
      /** only during the owner's turn; stance triggers exclude initial setup */
      ownTurn?: boolean;
      /** Number of qualifying activations before switching to afterLimit (or stopping). */
      perTurnLimit?: number;
      /** Maximum actual Barrier granted by this trigger instance per turn, after modifiers. */
      barrierCap?: number;
      /** Same limit measured from the start of the owner's turn to its next turn. */
      perRoundLimit?: number;
      afterLimit?: Op[];
      /** it answers only once a round: from the start of its side's turn to the next, the other side's turn included (DECISIONS #542) */
      round?: boolean;
      /** 'play' / 'draw': only Fleeting cards */
      ethereal?: boolean;
      /** 'play': only cards that cost at least this much */
      minCost?: number;
      /** it remembers the card's target and aims at it whenever it fires (Oblivion) */
      pin?: boolean;
      /** 'play': only cards that cost at most this much */
      maxCost?: number;
      /** it goes after answering this many times (Lightning Rod: the next 2 turns) */
      times?: number;
      /** 'evoke': only this totem */
      rune?: string;
      /** 'spend': only spending this status */
      status?: StatusId;
      /** it answers only while this holds; checked first, so a once-a-turn Aura is not spent when it does not */
      only?: { by: Metric; atLeast?: number; atMost?: number };
    }
  // --- runes
  /** `rune: '*'` plants a random totem (any of them) */
  | { op: 'channel'; rune: string; times?: number; scale?: Scale }
  /** `last`: the newest totems instead of the oldest */
  | { op: 'evoke'; count?: number; times?: number; keep?: boolean; scale?: Scale; last?: boolean }
  /**
   * your totems' passives fire now, without the end of the turn: every totem (or every one of kind `rune`), or only the oldest
   * (`first`); `aim`: what they would strike at random they strike at the card's target instead
   */
  | { op: 'pulse'; rune?: string; first?: boolean; times?: number; aim?: boolean }
  | { op: 'runeSlots'; amount: number }
  // --- stances
  | { op: 'stance'; stance: Stance | 'none' }
  // --- scaling cards
  | { op: 'forge'; card: CardId; amount: number; scale?: Scale }
  /** the targeted ally leaves the fight (put it after any effect that reads the target) */
  | { op: 'sacrifice'; self?: boolean }
  | { op: 'reclaim'; amount: number } // bring random Consumed cards back to your hand (never Auras)
  | { op: 'revive'; hpPct?: number } // default: half HP; explicit percent rounds down, minimum 1
  // --- tempo and tricks
  | { op: 'manaNext'; amount: number; foe?: boolean } // extra Mana at the start of your next turn (negative: Mana you owe; `foe`: the other side's)
  | { op: 'maxMana'; amount: number } // more (or less) Mana every turn for the rest of the fight, from the next turn on
  | { op: 'drawNext'; amount: number; foe?: boolean } // extra cards at the start of your next turn (negative: fewer; `foe`: the other side's)
  /** add random cards from your own pool (and Neutral) to your hand; `free`: they cost 0 for the rest of the fight */
  /** `neutral`: Neutral cards only; `upgraded`: their "+" versions */
  | {
      op: 'discover';
      kind?: CardKind;
      count?: number;
      free?: boolean;
      scale?: Scale;
      neutral?: boolean;
      upgraded?: boolean;
      /** the cards it makes cost 0 this turn only (White Noise) */
      turn?: boolean;
      /** the cards it makes are Fleeting */
      ethereal?: boolean;
      /** (Whispers Beyond+, #691) the cards it makes cost this much less until played */
      cheaper?: number;
    }
  /** replace cards in your hand with their "+" versions for the rest of the fight */
  /** `discard`: `amount` random cards of your discard pile (default 1) */
  | { op: 'upgrade'; scope: 'hand' | 'random' | 'discard'; amount?: number }
  /** cards in your hand cost less for the rest of the fight (one random card, or all of them) */
  /** 'self': the card being resolved (one that gets cheaper when it is drawn) */
  | { op: 'cheapen'; amount: number; scope: 'hand' | 'random' | 'self' }
  /** move random cards from your discard pile to your hand (or the top of your draw pile); `kind` and `tag` narrow which */
  | {
      op: 'fetch';
      amount: number;
      to: 'hand' | 'draw';
      kind?: CardKind;
      tag?: string;
      /** the cards come back as their "+" versions */
      upgrade?: boolean;
      /** look in the draw pile and the consumed pile too, not only the discard pile */
      anywhere?: boolean;
      /** only cards that cost at most this much */
      maxCost?: number;
    }
  /** add a copy of the card being played */
  /** `free`: the copy costs 0 for the rest of the fight */
  | { op: 'copySelf'; to: 'hand' | 'discard' | 'draw'; free?: boolean }
  // --- playing cards for free (Cascade, Havoc, Stampede, Hellraiser, Howl From Beyond)
  /**
   * play cards for free, each against a random enemy: from the top of the draw pile, the exhaust pile (it goes back there), a
   * random one of your hand, or the card you have just drawn. `amount` (and `scale`) is how many; `kind` and `match` (a part of the
   * name) narrow which; `exhaust` consumes each one afterwards
   */
  | {
      op: 'playPile';
      from: 'draw' | 'exhaust' | 'hand' | 'drawn';
      amount?: number;
      scale?: Scale;
      kind?: CardKind;
      match?: string;
      exhaust?: boolean;
      /** only cards with this tag; `all`: every fitting card in the pile, once each; `aim`: at the card's target, not a random
       * enemy; `upgrade`: each is upgraded first (Knife Trap) */
      tag?: string;
      all?: boolean;
      /** Maximum fitting cards taken by an all-pile play, in existing pile order. */
      limit?: number;
      /** an all-pile play: past this many fitting cards, only every second one is played (DECISIONS #762) */
      halfPast?: number;
      aim?: 'target';
      upgrade?: boolean;
      /** each card taken is played this many times */
      repeat?: number;
    }
  /** no more Mana can be gained this turn / no more cards can be drawn this turn */
  | { op: 'manaLock' }
  | { op: 'drawLock' }
  /** draw until a card that is not of this kind comes up */
  | { op: 'drawUntil'; not: CardKind }
  /** consume cards from the top of your draw pile */
  | { op: 'exhaustTop'; amount: number }
  /**
   * cards become another card: every card of `kind` in your hand, or (`amount`) that many from your hand or your draw pile, at random
   * or (`choose`, from the hand) chosen by the player; `choose` without `amount` is "any number"
   */
  | {
      op: 'transform';
      kind?: CardKind;
      /** only cards with this tag */
      tag?: string;
      into: CardId;
      from?: 'hand' | 'draw';
      amount?: number;
      choose?: boolean;
    }
  /** run these ops only while a metric is within bounds ("on your third Attack") */
  | {
      op: 'when';
      by: Metric;
      of?: Scale['of'];
      atLeast?: number;
      atMost?: number;
      ops: Op[];
      /** for 'runesOf' and 'channeledOf': which totem */
      rune?: string;
    }
  /** add a copy of the card that has just been played (in a 'play' trigger) to your hand */
  | { op: 'copyPlayed' }
  /** raise max HP, and HP with it (for the fight; a run keeps what a card says it keeps) */
  | { op: 'maxHp'; amount: number; to: Sel }
  /** this many more card rewards after the fight, if it is won (a run reads `SideState.extraRewards`; The Hunt) */
  | { op: 'extraReward'; amount: number }
  // --- the Silent-shaped assassin's pieces
  /** Bleed on the targets deals its damage now (and loses 1), as it does at the start of their turn */
  | { op: 'tick'; to: Sel }
  /** remove the targets' Barrier and Steadfast */
  /** remove Barrier and Steadfast; `amount`: at most this much Barrier, and Steadfast stays */
  | { op: 'strip'; to: Sel; amount?: number }
  /** this copy of the card costs this much less for the rest of the fight (Up My Sleeve) */
  | { op: 'selfCost'; amount: number }
  /** every card in your hand costs 0 this turn */
  | { op: 'freeHand' }
  /** a random Skill in your hand gains Sly this turn */
  | { op: 'giveSly' }
  /** (assassin) Defer: choose `count` cards in your hand (`upTo`: any number up to it) that cost 1 or more and are not X cards: they leave now and come back at the start of your next turn costing 1 less until played */
  | { op: 'defer'; count: number; upTo?: boolean }
  /** (the Mana Reserves trait) gain Reserves, up to the Max Reserves */
  | { op: 'reserves'; amount: number }
  /** (the Mana Reserves trait) raise the Max Reserves: for this turn only (`turn`), or for the rest of the fight */
  | { op: 'maxReserves'; amount: number; turn?: boolean }
  /** choose a card in your hand: at the start of your next turn, add this many copies of it to your hand */
  | { op: 'copyNext'; times: number }
  // --- the Regent's pieces (Obsidia, the spellblade)
  /** Barrier / Arcana that arrive at the start of your next turn */
  | { op: 'barrierNext'; amount: number }
  | { op: 'starsNext'; amount: number }
  /** put cards from your hand on top of your draw pile (the player chooses); `from: 'draw'`: cards chosen from anywhere in the
   * draw pile go to its top (Foregone Conclusion, with a next-turn draw) */
  | { op: 'topdeck'; amount: number; from?: 'hand' | 'draw' }
  /** your turn ends once this card is done */
  | { op: 'endTurn' }
  /** the card being resolved deals this much more damage for the rest of the fight (it reads the 'bonus' metric) */
  /** `grown`: this is a card's own "Grows N": a replay does not grow it again, and it sets off the Auras that answer it */
  /** `that`: said of the card that has just grown (Crucible Heart), in an Aura's text */
  | { op: 'growSelf'; amount: number; grown?: boolean; that?: boolean }
  /** add a copy of a random card in your hand (`neutral`: a Neutral one) */
  | { op: 'copyInHand'; neutral?: boolean }
  // --- the Necrobinder copy (Dorian; his minions stand in for Osty, several at once)
  /**
   * Raise (Summon N): a companion of `unit` rises with `amount` max HP, `times` times (its scale adds to the times); with every
   * companion slot taken, your weakest companion gains that much max HP instead
   */
  /**
   * a companion of `unit` rises with `amount` HP; with no slot free the healthiest companion gains `amount` max HP instead, or with
   * `same`, the healthiest of that unit when one stands (Raise Colossus feeds a Colossus, #684)
   */
  | { op: 'raise'; unit: string; amount: number; times?: number; scale?: Scale; same?: boolean }
  /** each of your living companions does these, as the actor ("Osty deals 6"); nothing happens with none. It counts as a strike */
  /** each living companion strikes with `ops` (only companions of `unit`, when it is given); a companion's `commandPct` scales its damage */
  /** `healthiest`: only the companion with the most max HP strikes (the first on a tie; The Drowned King, #689) */
  | { op: 'command'; ops: Op[]; unit?: string; healthiest?: boolean }
  /** every target whose HP is at or below its Fate dies now */
  | { op: 'doomNow'; to: Sel }
  /** the debuffs on the target are put on every other enemy too (Misery) */
  | { op: 'spreadDebuffs' }
  /** a random card in your hand (not one that has it already) gains Fleeting, Hold or Replay; `costUp` makes it cost more for the fight */
  /** `pick`: the player chooses the card (Echo of the Dead, #691); otherwise a random one */
  | { op: 'mark'; flag: 'ethereal' | 'retain' | 'replay'; costUp?: number; pick?: boolean }
  /** cards cost this much more for the rest of the turn */
  | { op: 'costTax'; amount: number }
  // --- the Defect copy (shaman)
  /** this card costs `amount` more (less, if negative) for the rest of the fight, and it adds up (Modded, Momentum Strike) */
  | { op: 'recost'; amount: number }
  /** your hand and discard pile are shuffled into your draw pile (Reboot) */
  | { op: 'reshuffle' }
  /** every card of your draw pile (with this `tag`, if given) goes to your discard pile */
  | { op: 'sweep'; tag?: string }
  /** in a 'play' trigger: the card just played comes back from your discard pile to your hand (Feral) */
  | { op: 'returnPlayed' }
  // --- the Knight's Guard (DECISIONS #415)
  /** Riposte: if the target is Open, spend its Opening and run these */
  | { op: 'riposte'; ops: Op[] }
  // --- the Assassin's knives and Preparation (DECISIONS #416)
  /**
   * embed `amount` knives (at most KNIFE_MAX in a unit) in the target (or each enemy, or a random one), after the card's attack: an
   * enemy the card attacked gets them only if a hit of it landed (not one a Trap or Shielded stopped); a dead one gets none
   */
  | { op: 'embed'; amount: number; to?: 'target' | 'allFoes' | 'randomFoe' }
  /** pull up to `amount` knives from the target (or every enemy): each knife pulled runs `ops` once, aimed at that enemy, and is gone */
  | { op: 'extract'; amount: number; to?: 'target' | 'allFoes'; ops?: Op[] }
  /** spend up to `amount` stacks of a status of your own (Preparation): the `prepSpent` metric says how many were spent */
  | { op: 'spend'; status: StatusId; amount: number }
  /** (DECISIONS #423) take away up to `amount` of your temporary stacks of a status (never lasting ones); `thornsSpent` reads it */
  | { op: 'shedTemp'; status: StatusId; amount: number }
  // --- the Spellblade's enchantments (DECISIONS #417)
  /**
   * imbue an enchantment: into a free position; with both taken, the player chooses which one it replaces (a replacement is not a
   * discharge). `ifRoom`: only when a position is free (nothing is asked or replaced)
   */
  | { op: 'imbue'; kind: Enchant; ifRoom?: boolean }
  /** discharge 1 (the player chooses when the two differ) or 2 (both) enchantments: put it before the card's damage */
  | { op: 'discharge'; count: 1 | 2; kind?: Enchant }
  /** (DECISIONS #425) the charges this card has discharged take effect once more (Ember on the next hit, Glass after the attack, Ward
   * Barrier now): nothing goes back on the blade and nothing answers it */
  | { op: 'echoCharges' }
  /** your newest enchantment becomes another kind (the player chooses which) */
  | { op: 'recast' }
  // --- the Shaman's totems (DECISIONS #418)
  /**
   * plant a totem of `spirit` ('*': a random kind that is not rare) at the back of the row (DECISIONS #430, the totem cycle): into the
   * first free position; with all taken, the front totem is pushed out (its spirit acts as it goes) and the rest move up.
   * (`anywhere` is retired: nothing chooses a position.)
   */
  | {
      op: 'plant';
      spirit: string;
      anywhere?: boolean;
      times?: number;
      scale?: Scale;
      /** (DECISIONS #722) these totems are not counted as planted this fight (the `channeledOf` metric), so a card that reads the count cannot feed itself */
      uncounted?: boolean;
    }
  /** uproot every totem you have (the `uprooted` metric counts them) */
  | { op: 'uproot' }
  /** (DECISIONS #420) one more totem position (at most TOTEM_SLOTS), empty */
  | { op: 'totemSlot'; amount?: number }
  /** this many more Traps can be set at once for the rest of the fight */
  | { op: 'snareSlot'; amount: number }
  /**
   * (an enemy's move, DECISIONS #751) set this Trap card for the actor's side, owned by the actor: it springs with the actor acting
   * (flat damage, scaled by the enemy's difficulty, never an attack), and breaks when the actor falls. A full row loses its oldest.
   * A hero never uses it: a hero's Traps are played from the hand.
   */
  | { op: 'setTrap'; card: CardId }
  /** (the Defect's Loop) the oldest totem's passive fires now, `times` times, whatever its timing */
  | { op: 'totemPulse'; times?: number }
  /** for the rest of the fight, a commanded (or pushed-out) totem of this kind does `amount` more in each of its damage and Barrier numbers (its end-of-turn effect is not changed) */
  | { op: 'totemBoost'; rune: string; amount: number }
  /**
   * (DECISIONS #430, the totem cycle) a totem's spirit acts `times` times and the totem is consumed (it leaves the row, the rest move
   * up): 'front' the oldest (the next in the cycle), 'newest' the last planted, a kind the front-most of that kind, 'all' every totem
   * in order from the front ('random' / 'choose' are read as a random one / the front). Nothing else acts but a push-out.
   */
  | { op: 'totemCommand'; spirit: string; times?: number; one?: boolean; scale?: Scale }
  /** (DECISIONS #430) the front totem moves to the back of the row (nothing acts) */
  | { op: 'totemRotate' }
  // --- the Monk's Martial Forms (DECISIONS #419)
  /** change to this form ('*': the player may choose one, or keep the form they are in); the turn's progress starts again */
  | { op: 'form'; form: Form | '*' };

export type CardKind = 'attack' | 'skill' | 'power' | 'summon' | 'snare';
/** foe = an enemy; friend = any unit of yours (hero or ally); ally = one of your allies, never the hero */
export type CardTarget = 'foe' | 'friend' | 'ally' | 'none';
export type Rarity = 'basic' | 'common' | 'uncommon' | 'rare' | 'legendary' | 'ancestral';

export type SnareTrigger =
  | { on: 'attacked' } // an enemy attack is about to hit your hero or an ally
  | { on: 'hpLost'; min: number } // your hero loses at least `min` HP in one hit
  | { on: 'foeSummons' } // the other side summons a unit
  | { on: 'foeDefends' } // an enemy gains Barrier
  | { on: 'foeTurn' }; // the enemy phase begins

/** A card's suit (the Trickster's Suits, suits.ts): ♠ Attacks, ♥ protection, ♦ cards and Mana, ♣ Traps and debuffs. */
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface CardDef {
  id: CardId;
  /** its suit, when the rule in suits.ts would read it wrong; 'wild' shows the first suit missing this turn */
  suit?: Suit | 'wild';
  name: string;
  kind: CardKind;
  cost: number;
  target: CardTarget;
  rarity?: Rarity;
  /** Rules text is generated by the UI from effects; this is an override for odd cards. */
  text?: string;
  effects: Op[];
  /** snare cards only */
  trigger?: SnareTrigger;
  exhaust?: boolean;
  retain?: boolean;
  unplayable?: boolean;
  /** the "+" version of this card */
  upgrade?: CardId;
  /** flavour: the realm the card comes from, or 'neutral' */
  realm?: string;
  /** whose pool it is in (a Riftwalker id), or 'neutral' */
  hero?: string;
  /** free-form tags; "knife" cards gain damage from the Edge status */
  tags?: string[];
  /** Stars paid on top of the Mana cost */
  starCost?: number;
  /** stacks of a status on your hero paid on top of the Mana cost; unplayable without them (no card uses it right now: Devotion, its only user, is gone; DECISIONS #364) */
  /** `x`: the card spends all of it (its effects do the spending; `amount` is 0), shown as "X" (DECISIONS #357) */
  statusCost?: { status: StatusId; amount: number; x?: boolean };
  /** an X card: costs all your remaining Mana and the Metric 'x' is how much was spent (give it cost 0) */
  x?: boolean;
  /** an X card's "+1": X counts as this much more than the Mana spent (the "+" version of every X card has 1) */
  xBonus?: number;
  /** an X card spends at most this much Mana (then Reserves); the rest stays for other cards (DECISIONS #706) */
  xMax?: number;
  /** starts in your opening hand */
  innate?: boolean;
  /** only playable while this many cards (not Auras) are in your consumed pile */
  needsExhausted?: number;
  /** costs this much less for each Attack played this turn */
  cheaperPerAttack?: number;
  /** costs this much less for each Skill played this turn */
  cheaperPerSkill?: number;
  /** only playable while your draw pile is empty */
  needsEmptyDraw?: boolean;
  /** Sly: when an effect discards it from your hand, it is played for free */
  sly?: boolean;
  /** at the start of your turn, if it is in your consumed pile, it is played for free and goes back */
  replayFromExhaust?: boolean;
  /** costs 0 while a metric (of your side) is at least this much (Flatten) */
  freeIf?: { by: Metric; atLeast: number };
  /** costs `mult` less for every point of a metric (of your side) */
  /** `min`: it never gets cheaper than this by it (Showstopper, #694) */
  cheaperPer?: { by: Metric; mult: number; min?: number };
  /** whenever you play a card that costs at least this much, this comes back from your discard pile to your hand */
  recallOnCost?: number;
  /** exhausts if it is still in your hand at the end of your turn */
  ethereal?: boolean;
  /** runs when an effect discards this card (not the end-of-turn discard) */
  onDiscard?: Op[];
  /** runs when this card is exhausted */
  onExhaust?: Op[];
  /** runs when this card is drawn (the card is the one being resolved: growSelf, cheapen 'self') */
  onDraw?: Op[];
  /** an Arcana X card: it spends all your Arcana and the Metric 'x' is how much was spent */
  starX?: boolean;
  /** X/2: it spends half your Spell Power, rounded down (DECISIONS #482) */
  starHalf?: boolean;
  /** where it goes after it is played, instead of the discard pile: back to your hand, or on top of your draw pile */
  after?: 'hand' | 'drawTop';
  /** every `n`th card of `kind` you play in a turn brings this back to your hand from your draw or discard pile */
  returnEvery?: { kind: CardKind; n: number };
  /** at the end of your turn, if this is on top of your draw pile, it is played */
  playFromTop?: boolean;
  /** runs if this card is in your hand at the end of your turn (Burn) */
  inHandAtEnd?: Op[];
  /** whenever a card with this tag is created in your piles, this card costs 1 less until it is played (Rocket Punch) */
  cheaperOnCreate?: string;
  /** a weapon's own name for Sharpen (the Old Twelve Gauge's Precision: a separate stat from the Obsidian Blade's, DECISIONS #400) */
  forgeWord?: string;
  /** a weapon (the Obsidian Blade, the Old Twelve Gauge): a new copy starts as sharp as the rest (DECISIONS #399). Cards that grow
   * themselves with `forge` (Mounting Fury, Reaping Scythe, Gathering Storm) are not weapons, so a new copy of them starts fresh */
  weapon?: boolean;
  /** where a special card comes from (e.g. 'boss:seraphine'); such cards are never ordinary rewards */
  source?: string;
}

// --- units -------------------------------------------------------------------------------------------------

export type SimplePattern =
  /** `lead`: moves played once, in order, before the loop starts (each time its phase begins) */
  | { kind: 'cycle'; order: string[]; lead?: string[] }
  | { kind: 'weighted'; options: { move: string; weight: number }[] };

export type Pattern =
  SimplePattern | { kind: 'phases'; phases: { atOrBelowPct: number; pattern: SimplePattern }[] };

export interface Move {
  id: string;
  name: string;
  effects: Op[];
}

export type FoeRule = 'hero' | 'lowest' | 'random';

export type Brain =
  /** acts automatically at the end of its owner's turn */
  | { kind: 'ally'; act: Op[] }
  /** shows an intent, then performs it on its side's phase */
  | {
      kind: 'enemy';
      moves: Record<string, Move>;
      pattern: Pattern;
      opening?: string;
      foe?: FoeRule;
    };

export interface UnitDef {
  id: string;
  name: string;
  maxHp: number;
  taunt?: boolean;
  /** when it falls, the rest of its side falls with it (Drago, DECISIONS #547) */
  leader?: boolean;
  /** how many of its side's companion slots it takes: 1 Light (the default), 2 Heavy, 3 Colossal (DECISIONS #383) */
  slots?: number;
  /** the share (percent) of a Command's damage it deals when commanded (the Grave Colossus: half); 100 when absent */
  commandPct?: number;
  /** statuses it starts the fight with */
  statuses?: Partial<Record<StatusId, number>>;
  brain: Brain;
  /** UI hint: how to draw it */
  art?: string;
}

/**
 * An innate trait: a passive every Riftwalker has. `fightStart` ops run once as the fight begins, `turnStart` ops every one
 * of their turns, `triggers` work like an Aura's for the whole fight (but are not an Aura: they are never counted or listed as
 * one), and `clutch` makes them deal `perMissingHp`% more attack damage for every HP they are missing, or `perMissingPct`% for every 1% of
 * their max HP they are missing (rounded down; the same in a run and in the Arena's bigger HP, DECISIONS #429).
 */
export interface HeroTrait {
  name: string;
  /** what it does, in a sentence (shown on the character screens and the hero's plate) */
  text: string;
  fightStart?: Op[];
  turnStart?: Op[];
  triggers?: Extract<Op, { op: 'power' }>[];
  /** the share of Barrier (percent) the hero keeps through the turn change without Fortified (the Paladin, DECISIONS #545); Fortified keeps more */
  keepBarrier?: number;
  clutch?: {
    perMissingHp?: number;
    perMissingPct?: number;
    /** the most it gives, in percent (DECISIONS #542) */ max?: number;
  };
  /** the share of the hero's Might their companions hold (rounded down): 1 shares it all, 0.5 half; a new companion arrives with it */
  shareMight?: number;
  /** with `shareMight`: the hero's Might past this counts half towards the share (DECISIONS #762) */
  shareMightFull?: number;
  /** with `shareMight`: the most Might the companions ever hold from the share (DECISIONS #767) */
  shareMightMax?: number;
  /** with `shareMightFull`: the part of the Might past it that counts (a half when left out; DECISIONS #768) */
  shareMightRest?: number;
  /** this hero keeps a stance from turn to turn (the Monk); any other hero leaves Fury or Serene as their next turn begins (DECISIONS #762) */
  stances?: boolean;
  /** HP healed after every fight the hero wins (in a run) */
  healAfterFight?: number;
  /**
   * Suits: this hero shows the suits played each turn, and the first time in a turn all four are showing, `fullTrick` runs (a
   * Full Trick) and `allSuits` Auras answer it.
   */
  suits?: { fullTrick: Op[] };
  /** Salvage: a companion summoned by a card that scrapped others to make room takes their Might and Primed, and half their HP
   * as extra max HP (DECISIONS #383) */
  salvage?: boolean;
  /** Guard (the Knight, DECISIONS #415, #427): an enemy attack hit this hero's Barrier stops at least half of leaves the attacker Open */
  openings?: boolean;
  /** Totems (the Shaman, DECISIONS #418, #420, #421): he starts with this many positions; cards command them */
  totems?: number;
  /** Trinity (DECISIONS #420): the first time each turn he has cast a spell of every element, he gains 1 Spirit */
  trinity?: boolean;
  /** Max Reserves (the Mana Reserves trait, DECISIONS #452): unspent Mana is not lost, it is kept as Reserves up to this many; cards spend Mana before Reserves */
  maxReserves?: number;
  /** Martial Forms (the Monk, DECISIONS #419): the form he starts each fight in; completing its objective gives 1 Mastery */
  forms?: Form;
}

export interface HeroDef {
  id: string;
  name: string;
  maxHp: number;
  mana: number; // per turn
  handSize: number;
  /** allies it starts every fight with (an entry with `hp` starts with that HP instead of the unit's own) */
  startUnits?: (string | { unit: string; hp: number })[];
  /** how many companions it can have at once (MAX_ALLIES when missing) */
  maxAllies?: number;
  /** the Sigil: ops run when the fight begins (after the first draw) */
  sigil?: Op[];
  /** the innate trait: something this character always has (see HeroTrait) */
  trait?: HeroTrait;
  art?: string;
}

/**
 * A Boon: a passive that lasts a whole run. The engine uses `mana`, `handSize`, `fightStart` (applied to the hero as the
 * first turn begins) and `turnStart` (every one of your turns, after the draw). `maxHp`, `healAfterFight` and `shardsPerFight`
 * are for the campaign.
 */
export interface BoonDef {
  id: string;
  name: string;
  /** shown to the player; written by hand because some boons mix engine and campaign effects */
  text: string;
  mana?: number;
  handSize?: number;
  fightStart?: Op[];
  turnStart?: Op[];
  maxHp?: number;
  /** Campaign maximum HP multiplier; the run tracks the withheld HP for reversible Heart swaps. */
  maxHpPct?: number;
  /** Percentage bonuses to damage/Barrier operations sourced from a hero's card. */
  cardDamagePct?: number;
  cardBarrierPct?: number;
  /** Ordinary reward/shop card slot chance; explicit foreign-class offers are unaffected. */
  crossedOfferPct?: number;
  fightShardsPct?: number;
  /** One-time fight phases, including the same damage stop used by enemy Omens. */
  rise?: Rise[];
  healAfterFight?: number;
  shardsPerFight?: number;
  /** a Warden's Heart (DECISIONS #246): a run holds at most one, and it is never offered or sold as a Boon */
  heart?: boolean;
}

/** A Potion: a one-use item carried between fights. Using one is free and takes no Mana. */
export interface PotionDef {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare';
  text: string;
  /** what it must be aimed at: an enemy, one of your units, or nothing */
  target: CardTarget;
  effects: Op[];
}

/** A rune: its passive happens at the end of your turn; its evoke happens when it is pushed out or evoked by a card. */
export interface RuneDef {
  id: string;
  name: string;
  /** shown to the player */
  text: string;
  passive: Op[];
  evoke: Op[];
  /** charge gained each time the passive fires (Metric 'charge' in either list of ops) */
  grow?: number;
  /** the charge it is planted with (a Dark orb starts at 6) */
  start?: number;
  /** charge lost each time the passive fires, after it fires (Glass fades), never below 0 */
  decay?: number;
  /** Spirit does not add to its awakening (a Dark orb's Focus went into its charge already) */
  plainEvoke?: boolean;
  /** its passive fires at the start of your turn instead of the end (Plasma) */
  atStart?: boolean;
}

/**
 * A spirit of the Shaman's totems (DECISIONS #418). It does nothing on its own: once a turn the player commands one planted totem and
 * its `command` runs, aimed at a foe, a friendly or nothing. Rousing, and one Spirit when `empower` allows, add to its numbers.
 */
export interface TotemDef {
  id: string;
  name: string;
  text: string;
  /** (DECISIONS #420) every command aims by itself: 'none' (its ops say where: a random enemy, him, every enemy) */
  aim: 'foe' | 'friend' | 'none';
  command: Op[];
  /** (DECISIONS #418, retired) a Spirit could be spent on it */
  empower: boolean;
  /** its help each turn: the first spell of this element each turn ('any': the first spell of any element) deals or gives this much
   * more (each damage and Barrier number on it); every 2 Spirit add 1 */
  boost?: { element: Element | 'any'; amount: number };
  /** what planting it does */
  onPlant?: Op[];
  /** (DECISIONS #430, the totem cycle) what it does every turn while it stands, at the start or the end of his turn (its numbers
   * scale with Spirit through `per('spirit')` in the ops themselves; `command` is what its spirit does when it acts and leaves) */
  passive?: { when: 'turnStart' | 'turnEnd'; ops: Op[] };
  /** what it does when Trinity triggers (the Moon Owl's Mana) */
  onTrinity?: Op[];
  /** a rare totem (the Elder Tree, the Moon Owl): only a card that names it plants it, never a "totem of your choice" */
  rare?: boolean;
}

export interface CombatDb {
  runes?: Record<string, RuneDef>;
  totems?: Record<string, TotemDef>;
  cards: Record<CardId, CardDef>;
  potions: Record<string, PotionDef>;
  boons: Record<string, BoonDef>;
  units: Record<string, UnitDef>;
  heroes: Record<string, HeroDef>;
  /** a hero as an Ascendancy makes it, by Ascendancy id (DECISIONS #519) */
  ascended?: Record<string, HeroDef>;
}

// --- state -------------------------------------------------------------------------------------------------

export interface ChosenMove {
  move: string;
  /** the foe it means to hit; re-resolved when it acts (the target may have died) */
  target: UnitId | null;
}

export interface Unit {
  id: UnitId;
  def: string; // UnitDef id, or HeroDef id for heroes
  name: string;
  kind: 'hero' | 'ally' | 'enemy';
  side: Side;
  hp: number;
  maxHp: number;
  barrier: number;
  statuses: Partial<Record<StatusId, number>>;
  /** Origin of a debuff, including damage-over-time on the other side's turn. */
  statusSources?: Partial<Record<StatusId, Side>>;
  /** Max HP earned after creation; inherited Salvage/recovery never enters this counter. */
  investedHp?: number;
  taunt: boolean;
  intent: ChosenMove | null;
  /** moves this unit has used (drives patterns) */
  moveCount: number;
  /** Radiant's first attack hit is still to come (x2.5 not x2, DECISIONS #792): set on entering Radiant once a turn, spent by a hit */
  radiantEdge?: boolean;
  /** which pattern/phase it is in, and how many moves it has made in it (cycles restart on a phase change) */
  pat: string;
  patCount: number;
  /** lowest HP% it has been at when choosing a move: phases only move forward, healing never undoes one */
  lowPct: number;
  /** percent of normal attack damage this unit deals (enemies are scaled by the difficulty setting) */
  dmgPct: number;
  /** a Stun landed during this unit's own turn: it does not count down at that turn's end */
  stunFresh?: boolean;
  /** the unit whose attack killed this companion, so an Aura that answers "an ally dies" can strike back at it (DECISIONS #326) */
  killedBy?: UnitId;
  lastMoves: string[];
  /** attack hits it has taken this turn (Hammer and Anvil) */
  hitsTaken?: number;
  /**
   * Its remaining phases, highest first. Each grants Barrier and Might when HP reaches its threshold.
   * An attack crossing an enemy's threshold continues through the new Barrier. Other phase-triggering damage stops at the threshold.
   */
  rise?: Rise[];
}

/** A phase an enemy rises into when its HP first reaches `atPct`% of its max: it gains this much Barrier (% of max HP) and Might. */
export interface Rise {
  atPct: number;
  barrierPct: number;
  might: number;
}

/**
 * Something a PvE setup changes about its enemies (the campaign's Omens): the units it applies to (indices into `enemies`; every
 * enemy when missing) start with these statuses, and rise into these phases.
 */
export interface EnemyMod {
  units?: number[];
  statuses?: Partial<Record<StatusId, number>>;
  rise?: Rise[];
}

export interface CardInst {
  id: InstId;
  card: CardId;
  /** forge bonus (see the forge op) */
  bonus?: number;
  /** cost change for the rest of the fight (negative = cheaper) */
  costMod?: number;
  /** this copy is cheaper by this much for the rest of the fight, however often it is played (Up My Sleeve) */
  costDown?: number;
  /** it costs 0 this turn (Bullet Time) */
  freeTurn?: boolean;
  /** it Holds this turn (Expertise) */
  held?: boolean;
  /** it has Premeditate (the `sly` flag; was Sly until DECISIONS #433): for this turn, or for the rest of the fight */
  sly?: 'turn' | 'fight';
  /** (DECISIONS #433) it came back through Premeditate: it costs 0 until it is played */
  premeditated?: boolean;
  /** it came back through Defer: it costs 1 less on the turn it returns, until it is played or that turn ends */
  deferred?: boolean;
  /** keywords a card gave this copy (Sculpting Strike, Snap, Transfigure): Fleeting, Hold, played this many more times */
  ethereal?: boolean;
  retain?: boolean;
  replay?: number;
  /** a lasting cost change (a rise, or with the recost op a drop): unlike costMod it is not spent when played */
  costUp?: number;
  /** (#691) the turn this copy last came back by recallOnCost: it returns once a turn */
  recalledTurn?: number;
}

/** A rune on the board. */
export interface RuneState {
  rune: string;
  charge: number;
}

/** The `card` of a PowerState that comes from a trait, not from an Aura card. */
export const TRAIT_POWER = '@trait';

export interface PowerState {
  id: string;
  card: CardId;
  when: TriggerWhen;
  ops: Op[];
  filter?: CardKind;
  tag?: string;
  /** cards with this tag answer too (DECISIONS #564) */
  orTag?: string;
  stance?: Stance;
  /** it ends with this turn (Rage) */
  temp?: boolean;
  once?: boolean;
  ownTurn?: boolean;
  perTurnLimit?: number;
  barrierCap?: number;
  barrierAt?: number;
  barrierUsed?: number;
  perRoundLimit?: number;
  afterLimit?: Op[];
  usesAt?: number;
  uses?: number;
  /** once a round (see the op's `round`) */
  round?: boolean;
  ethereal?: boolean;
  minCost?: number;
  /** the unit it aims at (a pinned power), and the card copy that made it (which does not set it off) */
  target?: UnitId;
  from?: InstId;
  maxCost?: number;
  /** answers left before it goes */
  left?: number;
  rune?: string;
  /** 'spend': only spending this status */
  status?: StatusId;
  /** it answers only while this holds */
  only?: { by: Metric; atLeast?: number; atMost?: number };
  /** the turn it last answered (for `once`) */
  firedTurn?: number;
}

/** A choice the acting player owes before anything else happens. */
export interface Pending {
  disciplineBonus?: number;
  spellBonus?: number;
  /** (the Spellblade's: 'enchant' which enchantment a new one replaces, 'discharge' which to spend, 'recast' what the newest becomes;
   * their pool is enchantment positions 'e0'/'e1', or kinds for 'recast') */
  kind:
    | 'discard'
    | 'exhaust'
    | 'scry'
    | 'copy'
    | 'topdeck'
    | 'transform'
    | 'enchant'
    | 'discharge'
    | 'recast'
    | 'plantKind'
    | 'plantAt'
    | 'form'
    | 'commandPick'
    | 'defer'
    | 'empower'
    /** (Echo of the Dead, #691) the chosen card is played one more time */
    | 'replay';
  /** (the Shaman's: 'plantKind' which spirit to plant, pool the totem ids; 'plantAt' which position, pool 't0'-'t7', none = keep) */
  spirit?: string;
  /** (the Shaman) the totem boost the card's first play got, carried over the choice */
  plus?: number;
  anywhere?: boolean;
  /** 'enchant': the enchantment being imbued */
  charge?: Enchant;
  /** what the card had discharged so far (Ember's damage still to land, Glass still to break), carried over the choice */
  ember?: number;
  glass?: number;
  discharged?: number;
  /** the kinds it had discharged (DECISIONS #425) */
  charges?: Enchant[];
  /** 'copy': how many copies come next turn */
  times?: number;
  /** 'replay': how much more the chosen card costs for the fight (Echo of the Dead, #691) */
  costUp?: number;
  /** for 'transform': what the chosen cards become */
  into?: CardId;
  /** the cards to choose among (your hand, or the top of your draw pile for scry) */
  pool: InstId[];
  min: number;
  max: number;
  /** what the card still has to do once the choice is made */
  rest: Op[];
  actor: UnitId;
  target: UnitId | null;
  /** the card being played, put away when the choice (and everything after it) is done */
  finish: CardInst | null;
  x: number;
  /** 'topdeck': the cards are chosen from the draw pile, not the hand */
  from?: 'draw';
  /** the card is played once more for each of these when it finishes (a Reverb attack, a Mirrored skill, a Boosted Aura, the first card under
   * Echoing Spirit...): each that applies adds its own play (DECISIONS #717) */
  again?: AgainSource[] | null;
  /** what the card cost when it was played (a "costs 2 or more" Aura reads it when the card finishes) */
  paid?: number;
}

export interface SnareState {
  id: string;
  card: CardId;
  /** (an enemy's Trap, DECISIONS #751) the unit that set it: it acts when the Trap springs, and the Trap breaks when it falls */
  owner?: UnitId;
}

export interface SideState {
  /** An Ascendancy's data-driven combat discipline; resets with every fight. */
  discipline?: DisciplineState;
  /** the Ascendancy this side's hero has taken (DECISIONS #519) */
  ascendancy?: string;
  id: Side;
  /** nearest the centre first; a hero (if any) is always last */
  units: Unit[];
  hand: CardInst[];
  draw: CardInst[];
  discard: CardInst[];
  exhausted: CardInst[];
  /** the def ids of allies that have died this fight, most recent last (for Revive) */
  fallen: string[];
  mana: number;
  maxMana: number;
  handSize: number;
  snares: SnareState[];
  hero: string | null; // hero def id
  /** Boon ids active for this side (a run-long passive; see BoonDef) */
  boons: string[];
  /** Potion ids carried (the rest of the run keeps whatever is unused) */
  potions: string[];
  stars: number;
  /** (the Mana Reserves trait) Mana kept from earlier turns, spent after the turn's own Mana, and the most that can be kept */
  reserves: number;
  maxReserves: number;
  /** Mana and cards that arrive at the start of your next turn */
  nextMana: number;
  nextDraw: number;
  /** statuses that wear off at the end of this side's turn */
  temps: { unit: UnitId; status: StatusId; amount: number }[];
  runes: RuneState[];
  runeSlots: number;
  powers: PowerState[];
  /** Passive Auras, evaluated when an attack happens, rather than copied into each unit's statuses. */
  attackAuras?: {
    id: string;
    card: CardId;
    amount: number;
    scope: 'friends' | 'companions';
    perSummons?: number;
  }[];
  /** counters for this turn, reset when it starts */
  played: number;
  attacksPlayed: number;
  /** (#762) times a card or Aura has made the companions act again this turn: every time after the first deals half damage */
  extraActs?: number;
  /** (#692) Attacks this turn that cost 1 or more Mana when played */
  paidAttacksTurn?: number;
  skillsPlayed: number;
  /** (the Trickster's Suits) the suits showing this turn, and whether the Full Trick has gone off */
  suitsTurn?: Suit[];
  fullTrickTurn?: boolean;
  /** the card being played lit the fourth suit: its Full Trick goes off once the card has done what it does */
  fullTrickDue?: boolean;
  /** Full Tricks made this fight (the trait's damage grows with them) */
  fullTricks?: number;
  summonedFight?: number;
  snaresSprung?: number;
  /** Trap slots above MAX_SNARES (the Trapmaster's two) */
  snareSlots?: number;
  fervorGained?: number;
  /** Fervor gained this turn (DECISIONS #721: Mantra Engine) */
  fervorGainedTurn?: number;
  discarded: number;
  /** times your hero lost HP this turn / this fight, cards consumed this turn */
  lostHpTurn?: number;
  lostHpFight?: number;
  exhaustedTurn?: number;
  /** no more Mana / cards can come this turn (Expect a Fight, Battle Trance) */
  manaLocked?: boolean;
  drawLocked?: boolean;
  /** the first Barrier from a card this turn has been doubled (Unmovable) */
  barrierDoubled?: boolean;
  /** max HP the hero has gained this fight (a run keeps it) */
  maxHpGained?: number;
  /** Underlying campaign maximum before a percentage Heart, for exact in-fight growth. */
  maxHpBeforeHeart?: number;
  /** extra card rewards earned this fight (a run offers them after a win) */
  extraRewards?: number;
  /** cards whose copies arrive at the start of your next turn (Nightmare); Honed's first knife this turn has been played */
  nextCopies?: { card: CardId; times: number }[];
  /** (DECISIONS #433) Premeditate: cards an effect discarded this turn, coming back to the hand next turn at 0 */
  premeditating?: CardInst[];
  /** (the Mana Reserves trait) this turn's extra Max Reserves (Stand Fast): it ends when the next turn begins */
  reservesTurn?: number;
  /** Defer: cards set aside this turn, coming back to the hand next turn costing 1 less */
  deferring?: CardInst[];
  honedUsed?: boolean;
  /** the turn Radiant last gave its Mana (once a turn) */
  radiantManaTurn?: number;
  /** Mana spent on cards this turn; totems planted this fight, by kind */
  spentTurn?: number;
  /** (the Spellblade's Spell Power rework, DECISIONS #480) what her Shatters deal on top of SHATTER_DAMAGE; this turn's spending and sequence */
  shatterBonus?: number;
  /** (DECISIONS #542) what every Shatter of hers deals more, in percent */
  shatterPct?: number;
  /** (DECISIONS #542) what the side's companions' attacks deal more, in percent */
  allyPct?: number;
  /** the turn number this side's latest turn began on (for an Aura that answers once a round) */
  turnBegan?: number;
  /** Last activation turn for data-defined effect groups shared across card copies. */
  effectTurns?: Record<string, number>;
  starsSpentTurn?: number;
  lastSpend?: number;
  lastSpell?: boolean;
  prevSpell?: boolean;
  swordsPlayed?: number;
  spellsPlayed?: number;
  swordFoes?: UnitId[];
  ruinUsed?: boolean;
  channeledBy?: Record<string, number>;
  /** (the Shaman) standing boosts to a kind of totem's command, by totem id */
  totemBoost?: Record<string, number>;
  /** counters for the whole fight */
  drawn: number;
  created: number;
  /** Arcana gained this turn; Barrier and Arcana due at the start of the next turn; Mana spent towards Orbit */
  starsGainedTurn?: number;
  nextBarrier?: number;
  nextStars?: number;
  /** Sharpen played so far this fight, by card (a record: a copy made later starts fresh since DECISIONS #441) */
  forged?: Record<CardId, number>;
  orbitSpent?: number;
  // --- the Necrobinder copy (Dorian): counters for this turn and this fight
  allyStrikes?: number;
  drawnTurn?: number;
  doomedTurn?: number;
  /** base card ids played this turn */
  playedTurn?: string[];
  etherealPlayed?: number;
  /** cards played this fight, by tag (the `tagPlayed` metric) */
  tagsPlayed?: Record<string, number>;
  deaths?: number;
  /** cards cost this much more this turn (Borrowed Time) */
  costTax?: number;
  /** (the Spellblade) the enchantments on her blade, oldest first (at most ENCHANT_SLOTS) */
  enchants?: Enchant[];
  /** (the Shaman) totem positions, each a TotemDef id or null; missing for a hero without totems (DECISIONS #418) */
  totems?: (string | null)[];
  /** a totem was commanded this turn (only ever by a card, DECISIONS #421) */
  commanded?: boolean;
  /** (the Shaman, DECISIONS #420) the elements cast this turn, the totem boosts already used ('flame' / 'frost' / 'storm' / 'any'),
   * and whether Trinity has triggered this turn */
  elementsTurn?: Element[];
  boostsUsed?: string[];
  trinityDone?: boolean;
  /** (the Monk, DECISIONS #419) his form; the technique steps played in it this turn (card id, tag, aimed enemy), whether the
   * objective is done this turn (once a turn, however often he changes form), and the turn's technique counters */
  form?: Form;
  formSteps?: { card: string; tag: 'defensive' | 'striking'; target?: UnitId }[];
  formDone?: boolean;
  techniquesTurn?: number;
  defensiveTurn?: number;
}

export type Winner = Side | 'draw';

/** What can play a card one more time as it finishes (DECISIONS #717). */
export type AgainSource = 'twinned' | 'mirrored' | 'boosted' | 'twinspell' | 'echo';

export interface CombatState {
  seed: string;
  rng: RngState;
  mode: 'pve' | 'pvp';
  /** Rift Tier of the enemies (1 = normal): each tier above 1 gives enemies more HP (see tierHp) and +1 Might */
  tier: number;
  /** difficulty: percent of normal enemy HP and attack damage (100 = normal) */
  enemyHpPct: number;
  enemyDmgPct: number;
  turn: number; // counts every turn taken, both sides
  active: Side;
  sides: Record<Side, SideState>;
  winner: Winner | null;
  nextId: number;
  /** a choice the active player must make before anything else (see Pending) */
  pending: Pending | null;
}

export const MAX_ALLIES = 3;

/**
 * Overflow (DECISIONS #321): when a single-target attack kills one of a hero's companions, this percent of the damage left over
 * (after the companion's Barrier and HP) carries through to that hero. One number, to tune (50 at first, 100 since #322).
 */
export const OVERFLOW_PCT = 100;
/** What the rule is called to players. */
export const OVERFLOW_NAME = 'Overflow';
/** Maximum Mana can be raised during a fight, but never past this */
export const MAX_MAX_MANA = 6;
/** How many enemies a fight can bring in at once through summons. */
export const MAX_ENEMIES = 4;
/** How many a fight may START with (a swarm), though summons stop at MAX_ENEMIES. */
export const MAX_START_ENEMIES = 7;
export const MAX_SNARES = 3;
/** how many Traps this side can have set at once */
export const snareCap = (sd: { snareSlots?: number }): number =>
  MAX_SNARES + Math.max(0, sd.snareSlots ?? 0);
export const MAX_HAND = 10;
export const MAX_RUNES = 10;
/**
 * PvP sudden death (DECISIONS #259): from the turn after this one (the "Turn N" players see: both seats' turns together), each
 * hero loses SUDDEN_DEATH_STEP HP more at the start of every one of their turns (10, then 20, 30...), straight through Barrier,
 * Shielded and Ghostly, so no match can stall for ever.
 */
export const SUDDEN_DEATH_AFTER = 50;
export const SUDDEN_DEATH_STEP = 10;
export const DEFAULT_RUNE_SLOTS = 3;

/**
 * HP multiplier for enemies at a Rift Tier. Each tier adds more than the one before (the step grows by 0.02 each time), so the
 * climb steepens as you go deeper. (The campaign no longer uses this: it plays at engine Tier I and scales through its own table, packages/campaign/src/tierTable.ts.)
 */
export const tierHp = (tier: number): number => {
  const t = Math.max(0, tier - 1);
  return 1 + 0.2 * t + 0.01 * t * t;
};
/** Enemy HP after the Rift Tier and the difficulty setting. */
export const scaledEnemyHp = (base: number, tier: number, hpPct: number): number =>
  Math.max(1, Math.round(base * tierHp(tier) * (hpPct / 100)));
/**
 * (DECISIONS #548) An enemy's own Barrier and healing grow with its HP, so a "12 Barrier" turn still counts deep in a run: at half the
 * rate (#555), so an enemy with 10x its written HP guards and heals 5.5x, and never below the written number (Tier I is as it was).
 */
export const enemyGuardFactor = (tier: number, hpPct: number): number =>
  Math.max(1, 1 + (tierHp(tier) * (hpPct / 100) - 1) / 2);
/** Might for enemies at a Rift Tier: one more each tier, up to 12 (it stopped at 6 before, so the deep tiers stopped getting meaner). */
export const tierMight = (tier: number): number => Math.min(12, Math.max(0, tier - 1));

// --- setup -------------------------------------------------------------------------------------------------

export interface HeroSetup {
  hero: string;
  deck: CardId[];
  /** start the fight at this HP (HP carries between fights in a run) */
  hp?: number;
  /** the hero's max HP in this run (Boons and the blood altar can raise it); defaults to the hero's base */
  maxHp?: number;
  maxHpBeforeHeart?: number;
  /** the Boons the hero carries */
  boons?: string[];
  potions?: string[];
  /**
   * the damage this hero (and its allies) deals, percent of the written numbers (default 100): a ghost Warden is a hero deck that
   * grows with the Rift Tier like any Warden
   */
  dmgPct?: number;
  /** statuses the hero starts the fight with (an Omen's Dread, say) */
  statuses?: Partial<Record<StatusId, number>>;
  /** the Ascendancy this hero has taken: its class and trait for the fight (DECISIONS #519) */
  ascendancy?: string;
}

export interface CombatSetup {
  seed: string;
  a: HeroSetup;
  /** PvE: a list of unit def ids (and what Omens change about them). PvP: the second hero. */
  b:
    | { enemies: string[]; tier?: number; hpPct?: number; dmgPct?: number; mods?: EnemyMod[] }
    | HeroSetup;
}

// --- actions & events ----------------------------------------------------------------------------------------

export type Action =
  /** `release` names the companion that leaves (is scrapped) to make room, when a card summons more than the free companion slots
   * hold; a list when several have to go (DECISIONS #383) */
  /** `grow` (Raise Colossus, DECISIONS #700): the Colossus standing that takes the HP, so no companion has to make way for another */
  | { type: 'play'; card: InstId; target?: UnitId; release?: UnitId | UnitId[]; grow?: UnitId }
  /** `potion` names the potion meant, so a belt that has since shifted can never drink the wrong one */
  | { type: 'potion'; index: number; potion?: string; target?: UnitId }
  | { type: 'endTurn' }
  /** answer a pending choice with the cards picked (their ids, in any order) */
  | { type: 'pick'; cards: InstId[] };

export type CombatEvent =
  | { type: 'turnStart'; side: Side; turn: number }
  | { type: 'turnEnd'; side: Side }
  | { type: 'draw'; side: Side; card: InstId; def: CardId }
  | { type: 'shuffle'; side: Side }
  | { type: 'burn'; side: Side; card: InstId; def: CardId } // drawn with a full hand
  /** `routine`: the end-of-turn sweep and the like, not an effect; `defer`: it was set aside by Defer, not discarded */
  | { type: 'discard'; side: Side; card: InstId; def: CardId; routine?: true; defer?: true }
  /** a discarded card will come back next turn through Premeditate */
  | { type: 'premeditate'; side: Side; card: InstId; def: CardId }
  /** `routine`: an Aura leaving the deck as it starts, and the like, not something Consumed */
  | { type: 'exhaust'; side: Side; card: InstId; def: CardId; routine?: true }
  | { type: 'addCard'; side: Side; card: InstId; def: CardId; to: 'hand' | 'discard' | 'draw' }
  | { type: 'mana'; side: Side; mana: number }
  | { type: 'maxMana'; side: Side; max: number }
  | { type: 'play'; side: Side; card: InstId; def: CardId; target: UnitId | null }
  | { type: 'potion'; side: Side; index: number; potion: string; target: UnitId | null }
  /** a unit begins its action (lunge animation); `damage`/`hits`: what its move's first attack deals per hit, Might and the like counted */
  | { type: 'act'; unit: UnitId; move: string | null; damage?: number; hits?: number }
  | { type: 'skip'; unit: UnitId; reason: 'stunned' }
  | {
      type: 'damage';
      source: UnitId | null;
      target: UnitId;
      amount: number; // after modifiers
      blocked: number; // soaked by Barrier
      lost: number; // HP lost
      shielded: boolean;
      kind: 'attack' | 'direct';
      /** the target's HP after the hit (for the battle log) */
      hp?: number;
      /** this is the part of an attack that carried on past a fallen companion, to the next companion or the hero (OVERFLOW_PCT) */
      overflow?: true;
      /** Fate took the last of its HP as its turn ended */
      fate?: true;
    }
  | { type: 'barrier'; target: UnitId; amount: number; total: number }
  | {
      type: 'barrierDrop';
      target: UnitId;
      /** Barrier left after the drop (Fortified keeps some) */ total?: number;
    }
  /** `hp`: the target's HP after the heal (for the battle log) */
  /** `maxHp`: set when the unit grew (a companion healed, or growHp), its new max HP */
  | { type: 'heal'; target: UnitId; amount: number; hp?: number; maxHp?: number }
  | { type: 'status'; target: UnitId; status: StatusId; amount: number; total: number }
  | { type: 'summon'; side: Side; unit: UnitId; def: string; index: number }
  | {
      type: 'died';
      unit: UnitId;
      /** it left to make room for another companion: not a death */ released?: boolean;
    }
  | { type: 'intent'; unit: UnitId; move: string; target: UnitId | null }
  /** `card` and `owner`: an enemy's Trap (DECISIONS #751), set by a move rather than played from a hand */
  | { type: 'snareSet'; side: Side; snare: string; card?: CardId; owner?: UnitId }
  /** a Trap gone without springing: its enemy fell, or a newer one pushed it out of a full row */
  | { type: 'snareBroken'; side: Side; snare: string; card: CardId }
  /** the suits showing this turn changed (`full`: all four, a Full Trick) */
  | { type: 'suits'; side: Side; suits: Suit[]; full: boolean }
  /** `caught`: the unit that set the Trap off (none when it springs as the foe's turn begins); display only */
  | { type: 'snareSprung'; side: Side; snare: string; card: CardId; caught?: UnitId }
  | { type: 'prevented'; unit: UnitId }
  | { type: 'stars'; side: Side; stars: number }
  | { type: 'reserves'; side: Side; reserves: number; max: number }
  | { type: 'runeChannel'; side: Side; rune: string; index: number }
  | { type: 'runeFire'; side: Side; rune: string; how: 'passive' | 'evoke' }
  /** `index`: where in the row it stood (the newest can go first, Consuming Shadow) */
  | { type: 'runeGone'; side: Side; rune: string; index?: number }
  | { type: 'stance'; unit: UnitId; stance: Stance | 'none' }
  /** the enchantments on a side's blade changed (the Spellblade's); `spent`: these were just discharged */
  | { type: 'enchant'; side: Side; enchants: Enchant[]; spent?: Enchant[] }
  /** a side's totems changed (the Shaman's); `at`: the position that changed */
  | { type: 'totems'; side: Side; totems: (string | null)[]; at?: number }
  /** (the Monk) his form or its progress changed: the objective's steps done (0-2), and whether it is complete this turn */
  | { type: 'form'; side: Side; form: Form; progress: number; done: boolean }
  /** (the Shaman) the elements cast this turn, and whether Trinity just triggered */
  | { type: 'elements'; side: Side; elements: Element[]; trinity: boolean }
  /** a totem was commanded: its spirit manifests and acts */
  | {
      type: 'command';
      side: Side;
      totem: number;
      spirit: string;
      target: UnitId | null;
      empowered: boolean;
    }
  | { type: 'power'; side: Side; card: CardId }
  /** `changed`: it really became another card, not a cost or a keyword changing on it */
  | { type: 'transform'; side: Side; card: InstId; def: CardId; costMod?: number; changed?: true }
  | { type: 'forge'; side: Side; card: CardId; amount: number }
  | { type: 'scry'; side: Side; cards: InstId[] }
  | { type: 'pending'; side: Side; kind: Pending['kind'] }
  /** an enemy reached a phase threshold and rose into its next phase (`left`: phases still to come) */
  | { type: 'phase'; unit: UnitId; left: number }
  | { type: 'gameOver'; winner: Winner };

export class RulesError extends Error {}

/** Deep clone. State is plain JSON by design, so a JSON round-trip is exact. */
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
