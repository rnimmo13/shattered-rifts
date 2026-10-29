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
  | 'burn' // (the Shaman's Flame, DECISIONS #421) Burn: exactly as Bleed, a status of its own
  | 'stunned' // counts as Exposed, Faltering and Brittle (never on top of them) for its own count of turns (DECISIONS #310)
  | 'thorns' // reflects stacks damage to attackers (permanent)
  | 'shielded' // ignores the next instance of damage per stack
  | 'resonance' // runes: +1 to the damage/Barrier of every rune effect per stack (permanent)
  | 'calm' // stance: leaving it grants Mana
  | 'wrath' // stance: you deal double attack damage and take 50% more
  | 'radiant' // stance: you deal triple attack damage; it ends with your turn
  | 'mantra' // builds towards Radiant: at MANTRA_GOAL you enter it
  | 'edge' // +1 damage per stack to your attacks tagged "knife" (permanent)
  | 'bracing' // +1 Barrier from every Barrier you gain, per stack (permanent)
  | 'brittle' // Barrier it gains is 25% smaller (turns)
  | 'ghostly' // each hit it takes is capped at 1 damage (turns)
  | 'steadfast' // the next debuff put on it is ignored, per stack
  | 'armored' // at the end of its turn it gains stacks Barrier; losing HP to an attack costs 1 stack
  | 'ritual' // at the end of its turn it gains stacks Might
  | 'vigor' // its next attack deals stacks more damage, then it is spent
  | 'doom' // if its HP is at or below its Doom at the end of its turn, it dies
  | 'twinned' // your next attack card is played twice, per stack
  | 'mirrored' // your next skill card is played twice, per stack
  | 'unbound' // your skills cost 0 and are consumed when played
  | 'fortified' // you keep 75% of your Barrier at the start of your turn instead of losing it all
  | 'plating' // you keep up to this much Barrier through each turn change, and it shrinks by 1 every turn
  | 'holdfast' // your whole hand is held at the end of your turn, per stack (one turn each)
  | 'hangover' // at the start of its turn it loses this much HP (never below 1), then it clears (KP's drinks; DECISIONS #354)
  | 'clutch' // an innate trait's state: you deal this % more attack damage (set by the engine while you are hurt)
  | 'sapped' // its attacks deal this much less damage (it wears off at the end of its own turn when a card puts it on an enemy)
  | 'cruelty' // your attacks deal 25% more to Exposed enemies
  | 'sturdy' // you take half damage from Exposed enemies (until the enemies' next turn is over)
  | 'unmovable' // the first Barrier a card gives you each turn is doubled
  | 'freeattack' // your next Attack costs 0, per stack
  // (the Silent-shaped assassin's pieces: DECISIONS #368)
  | 'virulent' // Bleed on your enemies deals its damage this many more times each turn (and loses 1 each time)
  | 'honed' // your Daggers Hold, and the first one you play each turn deals this much more
  | 'fanned' // your Daggers hit ALL enemies
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
  | 'bladeecho' // your blade-tagged attacks are played once more per stack
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
  // (the Monk's Martial Forms, DECISIONS #419)
  | 'mastery'; // Mastery: at most MASTERY_MAX, kept between turns; earned by completing a form's technique, spent by techniques
export const STATUS_IDS: readonly StatusId[] = [
  'exposed',
  'faltering',
  'might',
  'seared',
  'burn',
  'stunned',
  'thorns',
  'shielded',
  'resonance',
  'calm',
  'wrath',
  'radiant',
  'mantra',
  'edge',
  'bracing',
  'brittle',
  'ghostly',
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
  'spirit',
  'rousing',
  'shelter',
  'mastery',
  'freespell',
];
/** Debuffs: a Steadfast unit ignores the next one put on it. */
export const DEBUFFS: readonly StatusId[] = [
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
/** The Shaman's totems (DECISIONS #420): the most positions he can grow to. Spirit has no cap (Robert, 2026-10-29). */
export const TOTEM_SLOTS = 5;
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
/** Orbit pays out for every this much Mana spent. */
export const ORBIT_STEP = 4;
/** Mana gained when leaving Calm (the Monk's trait, the first time each turn: stepping in and out again pays nothing, so it cannot loop;
 * DECISIONS #413), and on entering Radiant (the engine). */
export const CALM_EXIT_MANA = 2;
export const RADIANT_ENTER_MANA = 1;

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
  /** the living enemy with the least HP (a Dark orb's awakening) */
  | 'weakestFoe'
  /** your living companion with the most max HP (DECISIONS #383) */
  | 'biggestAlly';

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
  | 'skillsPlayed' // Skills played this turn (before this one)
  | 'strikes' // cards with "Strike" in their name anywhere in your deck (hand, piles, consumed, and the card being played)
  | 'drawn' // cards drawn this fight
  | 'created' // cards created (added to a pile by an effect) this fight
  | 'discarded' // cards discarded by effects this turn
  | 'hpLostTurn' // times your hero lost HP this turn
  | 'hpLostFight' // times your hero lost HP this fight
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
  | 'allyStrikes' // times your companions were commanded to strike this turn (once per card)
  | 'drawnTurn' // cards drawn this turn after the opening hand
  | 'doomedTurn' // times you cursed an enemy with Fate this turn
  | 'samePlayed' // copies of the card being played already played this turn
  | 'etherealPlayed' // Fleeting cards played this fight
  | 'deaths' // units (either side) that have died this fight
  | 'tagExhausted' // consumed cards with the scale's `tag`
  | 'tagDeck' // cards with the scale's `tag` anywhere in your deck (the card being played included)
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
  | 'trinityDone'; // 1 once Trinity has triggered this turn
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
}

/** When a Power's trigger fires. */
export type TriggerWhen =
  | 'turnStart'
  | 'turnEnd'
  | 'play'
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
  | 'trinity'; // you cast a Flame, a Frost and a Storm spell this turn (the first time each turn)

export type Op =
  /** `lonePct`: Point Blank, this much more damage (percent) when it hits only one enemy */
  /** `lifesteal`: the attacker heals this percent of the HP the attack took off (Barrier it hit does not count; DECISIONS #285) */
  | {
      op: 'damage';
      amount: number;
      hits?: number;
      to: Sel;
      scale?: Scale;
      lonePct?: number;
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
  | { op: 'summon'; unit: string }
  | {
      op: 'addCard';
      card: CardId;
      to: 'hand' | 'discard' | 'draw';
      side: 'self' | 'foe';
      /** how many copies (default 1; with a scale this is the base) */
      times?: number;
      scale?: Scale;
    }
  | { op: 'actAllies' } // every ally of the actor acts now
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
      stance?: Stance;
      /** it ends with this turn (Rage) */
      temp?: boolean;
      /** it answers only the first time each turn (Iteration, Feral) */
      once?: boolean;
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
  | { op: 'revive' } // your most recently fallen ally returns at half its HP
  // --- tempo and tricks
  | { op: 'manaNext'; amount: number } // extra Mana at the start of your next turn (negative: Mana you owe)
  | { op: 'maxMana'; amount: number } // more (or less) Mana every turn for the rest of the fight, from the next turn on
  | { op: 'drawNext'; amount: number } // extra cards at the start of your next turn
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
      /** the cards it makes are Fleeting */
      ethereal?: boolean;
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
  | { op: 'strip'; to: Sel }
  /** this copy of the card costs this much less for the rest of the fight (Up My Sleeve) */
  | { op: 'selfCost'; amount: number }
  /** every card in your hand costs 0 this turn */
  | { op: 'freeHand' }
  /** a random Skill in your hand gains Sly this turn */
  | { op: 'giveSly' }
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
  | { op: 'growSelf'; amount: number }
  /** add a copy of a random card in your hand (`neutral`: a Neutral one) */
  | { op: 'copyInHand'; neutral?: boolean }
  // --- the Necrobinder copy (Dorian; his minions stand in for Osty, several at once)
  /**
   * Raise (Summon N): a companion of `unit` rises with `amount` max HP, `times` times (its scale adds to the times); with every
   * companion slot taken, your weakest companion gains that much max HP instead
   */
  | { op: 'raise'; unit: string; amount: number; times?: number; scale?: Scale }
  /** each of your living companions does these, as the actor ("Osty deals 6"); nothing happens with none. It counts as a strike */
  | { op: 'command'; ops: Op[] }
  /** every target whose HP is at or below its Fate dies now */
  | { op: 'doomNow'; to: Sel }
  /** the debuffs on the target are put on every other enemy too (Misery) */
  | { op: 'spreadDebuffs' }
  /** a random card in your hand (not one that has it already) gains Fleeting, Hold or Replay; `costUp` makes it cost more for the fight */
  | { op: 'mark'; flag: 'ethereal' | 'retain' | 'replay'; costUp?: number }
  /** cards cost this much more for the rest of the turn */
  | { op: 'costTax'; amount: number }
  // --- the Defect copy (shaman)
  /** this card costs `amount` more (less, if negative) for the rest of the fight, and it adds up (Modded, Momentum Strike) */
  | { op: 'recost'; amount: number }
  /** your hand and discard pile are shuffled into your draw pile (Reboot) */
  | { op: 'reshuffle' }
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
   * plant a totem of `spirit` ('*': the player chooses the kind): into the first free position; with all taken, the player chooses
   * one to replace or keeps them all (no plant). `anywhere`: the player chooses any position, free or taken (Hawk's Counsel).
   */
  | { op: 'plant'; spirit: string; anywhere?: boolean }
  /** uproot every totem you have (the `uprooted` metric counts them) */
  | { op: 'uproot' }
  /** (DECISIONS #420) one more totem position (at most TOTEM_SLOTS), empty */
  | { op: 'totemSlot' }
  /**
   * (DECISIONS #421) totems act, `times` times: every totem of the `spirit` kind; 'choose' one the player picks; 'random' a random
   * one; 'all' every totem he has. `one` (with a kind): one totem of that kind, not every one (DECISIONS #422). The only way a totem
   * acts: there is no free command.
   */
  | { op: 'totemCommand'; spirit: string; times?: number; one?: boolean }
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
  /** its suit, when the rule in suits.ts would read it wrong; 'wild' counts as every suit */
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
  cheaperPer?: { by: Metric; mult: number };
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
  | { kind: 'cycle'; order: string[] }
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
  /** how many of its side's companion slots it takes: 1 Light (the default), 2 Heavy, 3 Colossal (DECISIONS #383) */
  slots?: number;
  /** statuses it starts the fight with */
  statuses?: Partial<Record<StatusId, number>>;
  brain: Brain;
  /** UI hint: how to draw it */
  art?: string;
}

/**
 * An innate trait: a passive every Riftwalker has. `fightStart` ops run once as the fight begins, `turnStart` ops every one
 * of their turns, `triggers` work like an Aura's for the whole fight (but are not an Aura: they are never counted or listed as
 * one), and `clutch` makes them deal `perMissingHp`% more attack damage for every HP they are missing (rounded down).
 */
export interface HeroTrait {
  name: string;
  /** what it does, in a sentence (shown on the character screens and the hero's plate) */
  text: string;
  fightStart?: Op[];
  turnStart?: Op[];
  triggers?: Extract<Op, { op: 'power' }>[];
  clutch?: { perMissingHp: number };
  /** the share of the hero's Might their companions hold (rounded down): 1 shares it all, 0.5 half; a new companion arrives with it */
  shareMight?: number;
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
  /** Guard (the Knight, DECISIONS #415): an enemy attack hit this hero's Barrier stops completely leaves the attacker Open */
  openings?: boolean;
  /** Totems (the Shaman, DECISIONS #418, #420, #421): he starts with this many positions; cards command them */
  totems?: number;
  /** Trinity (DECISIONS #420): the first time each turn he has cast a spell of every element, he gains 1 Spirit */
  trinity?: boolean;
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
  /** legendary: the rarest, for the Boons that change every turn (an extra Mana, an extra card) */
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  /** shown to the player; written by hand because some boons mix engine and campaign effects */
  text: string;
  mana?: number;
  handSize?: number;
  fightStart?: Op[];
  turnStart?: Op[];
  maxHp?: number;
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
  /** what planting it does (the Elder Tree's Spirit) */
  onPlant?: Op[];
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
  taunt: boolean;
  intent: ChosenMove | null;
  /** moves this unit has used (drives patterns) */
  moveCount: number;
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
   * its phases still to come (highest first): the first time its HP would fall below `atPct`% of its max, it stops there and rises
   * into the next phase (Barrier, Might). Set by a setup's enemy mods (the campaign's Omens), never by a card.
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
  /** it has Sly: for this turn, or for the rest of the fight */
  sly?: 'turn' | 'fight';
  /** keywords a card gave this copy (Sculpting Strike, Snap, Transfigure): Fleeting, Hold, played this many more times */
  ethereal?: boolean;
  retain?: boolean;
  replay?: number;
  /** a lasting cost change (a rise, or with the recost op a drop): unlike costMod it is not spent when played */
  costUp?: number;
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
  stance?: Stance;
  /** it ends with this turn (Rage) */
  temp?: boolean;
  once?: boolean;
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
  /** the turn it last answered (for `once`) */
  firedTurn?: number;
}

/** A choice the acting player owes before anything else happens. */
export interface Pending {
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
    | 'commandPick';
  /** (the Shaman's: 'plantKind' which spirit to plant, pool the totem ids; 'plantAt' which position, pool 't0'-'t4', none = keep) */
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
  /** the card is played a second time when it finishes (a Reverb attack or Mirrored skill) */
  again?: 'twinned' | 'mirrored' | 'boosted' | 'echo' | null;
  /** what the card cost when it was played (a "costs 2 or more" Aura reads it when the card finishes) */
  paid?: number;
}

export interface SnareState {
  id: string;
  card: CardId;
}

export interface SideState {
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
  /** Mana and cards that arrive at the start of your next turn */
  nextMana: number;
  nextDraw: number;
  /** statuses that wear off at the end of this side's turn */
  temps: { unit: UnitId; status: StatusId; amount: number }[];
  runes: RuneState[];
  runeSlots: number;
  powers: PowerState[];
  /** counters for this turn, reset when it starts */
  played: number;
  attacksPlayed: number;
  skillsPlayed: number;
  /** (the Trickster's Suits) the suits showing this turn, and whether the Full Trick has gone off */
  suitsTurn?: Suit[];
  fullTrickTurn?: boolean;
  /** the card being played lit the fourth suit: its Full Trick goes off once the card has done what it does */
  fullTrickDue?: boolean;
  /** Full Tricks made this fight (the trait's damage grows with them) */
  fullTricks?: number;
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
  /** extra card rewards earned this fight (a run offers them after a win) */
  extraRewards?: number;
  /** cards whose copies arrive at the start of your next turn (Nightmare); Honed's first knife this turn has been played */
  nextCopies?: { card: CardId; times: number }[];
  honedUsed?: boolean;
  /** Mana spent on cards this turn; totems planted this fight, by kind */
  spentTurn?: number;
  channeledBy?: Record<string, number>;
  /** counters for the whole fight */
  drawn: number;
  created: number;
  /** Arcana gained this turn; Barrier and Arcana due at the start of the next turn; Mana spent towards Orbit */
  starsGainedTurn?: number;
  nextBarrier?: number;
  nextStars?: number;
  /** Sharpen so far this fight, by card: a copy made later starts this sharp (DECISIONS #399) */
  forged?: Record<CardId, number>;
  orbitSpent?: number;
  // --- the Necrobinder copy (Dorian): counters for this turn and this fight
  allyStrikes?: number;
  drawnTurn?: number;
  doomedTurn?: number;
  /** base card ids played this turn */
  playedTurn?: string[];
  etherealPlayed?: number;
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
  | { type: 'play'; card: InstId; target?: UnitId; release?: UnitId | UnitId[] }
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
  | { type: 'discard'; side: Side; card: InstId; def: CardId }
  | { type: 'exhaust'; side: Side; card: InstId; def: CardId }
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
  | { type: 'snareSet'; side: Side; snare: string }
  /** the suits showing this turn changed (`full`: all four, a Full Trick) */
  | { type: 'suits'; side: Side; suits: Suit[]; full: boolean }
  | { type: 'snareSprung'; side: Side; snare: string; card: CardId }
  | { type: 'prevented'; unit: UnitId }
  | { type: 'stars'; side: Side; stars: number }
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
  | { type: 'transform'; side: Side; card: InstId; def: CardId; costMod?: number }
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
