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
  | 'clutch'; // an innate trait's state: you deal this % more attack damage (set by the engine while you are hurt)
export const STATUS_IDS: readonly StatusId[] = [
  'exposed',
  'faltering',
  'might',
  'seared',
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
  'clutch',
];
/** Debuffs: a Steadfast unit ignores the next one put on it. */
export const DEBUFFS: readonly StatusId[] = [
  'exposed',
  'faltering',
  'seared',
  'stunned',
  'brittle',
  'doom',
];
export const STANCES = ['calm', 'wrath', 'radiant'] as const;
export type Stance = (typeof STANCES)[number];
/** Mantra needed to enter Radiant (the stack is spent). Slay the Spire's number: Radiant is a payoff you build to, not an opener. */
export const MANTRA_GOAL = 10;
/** Attacks from cards with this tag gain the Edge status's bonus damage. */
export const EDGE_TAG = 'knife';
/** Mana gained when leaving Calm (the first time each turn: stepping in and out again pays nothing, so it cannot loop), and on entering Radiant. */
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
  | 'attacker';

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
  | 'exposed'
  | 'might'
  | 'thorns'
  | 'mantra'
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
  | 'foes'
  | 'snares'
  | 'stars'
  | 'runes'
  | 'powers' // Auras (Powers) you have in play
  | 'mana'
  | 'played' // cards played this turn (before this one)
  | 'attacksPlayed'
  | 'skillsPlayed' // Skills played this turn (before this one)
  | 'drawn' // cards drawn this fight
  | 'created' // cards created (added to a pile by an effect) this fight
  | 'discarded' // cards discarded by effects this turn
  // about the thing being resolved
  | 'x' // Mana spent on an X card
  | 'charge' // a rune's charge
  | 'bonus'; // the forge bonus of the card being played
export interface Scale {
  by: Metric;
  mult?: number;
  of?: 'self' | 'target' | 'each';
  into?: 'amount' | 'hits';
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
  | 'snare' // one of your Traps sprang
  | 'stance' // you entered a stance
  | 'barrier' // your hero gained Barrier (from anything)
  | 'loseHp' // your hero lost HP to one of your own effects
  | 'draw' // you drew a card
  | 'created' // a card was created in one of your piles
  | 'arcana' // you spent Arcana (a card's Arcana cost was paid; DECISIONS #288)
  | 'shuffle'; // your discard pile was shuffled into a new draw pile (DECISIONS #299)

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
  | { op: 'status'; status: StatusId; amount: number; to: Sel; scale?: Scale; temp?: boolean }
  /** multiply the stacks of a status already on the target (floor); 2 doubles it */
  /** multiply a status (Double the Seared...); `max` is the most stacks it adds, so a doubler played again and again cannot run away */
  | { op: 'scaleStatus'; status: StatusId; mult: number; to: Sel; max?: number }
  | { op: 'draw'; amount: number; scale?: Scale }
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
  | { op: 'exhaustCards'; amount: number; random?: boolean; any?: boolean }
  | { op: 'scry'; amount: number }
  // --- Powers: run `ops` whenever `when` happens (`filter`/`tag` narrow 'play')
  | {
      op: 'power';
      when: TriggerWhen;
      ops: Op[];
      /** 'play': only cards of this kind / with this tag; 'stance': only entering this stance */
      filter?: CardKind;
      tag?: string;
      stance?: Stance;
    }
  // --- runes
  | { op: 'channel'; rune: string; times?: number; scale?: Scale }
  | { op: 'evoke'; count?: number; times?: number; keep?: boolean; scale?: Scale }
  | { op: 'runeSlots'; amount: number }
  // --- stances
  | { op: 'stance'; stance: Stance | 'none' }
  // --- scaling cards
  | { op: 'forge'; card: CardId; amount: number }
  /** the targeted ally leaves the fight (put it after any effect that reads the target) */
  | { op: 'sacrifice' }
  | { op: 'reclaim'; amount: number } // bring random Consumed cards back to your hand (never Auras)
  | { op: 'revive' } // your most recently fallen ally returns at half its HP
  // --- tempo and tricks
  | { op: 'manaNext'; amount: number } // extra Mana at the start of your next turn (negative: Mana you owe)
  | { op: 'maxMana'; amount: number } // more (or less) Mana every turn for the rest of the fight, from the next turn on
  | { op: 'drawNext'; amount: number } // extra cards at the start of your next turn
  /** add random cards from your own pool (and Neutral) to your hand; `free`: they cost 0 for the rest of the fight */
  | { op: 'discover'; kind?: CardKind; count?: number; free?: boolean }
  /** replace cards in your hand with their "+" versions for the rest of the fight */
  | { op: 'upgrade'; scope: 'hand' | 'random' }
  /** cards in your hand cost less for the rest of the fight (one random card, or all of them) */
  | { op: 'cheapen'; amount: number; scope: 'hand' | 'random' }
  /** move random cards from your discard pile to your hand (or the top of your draw pile); `kind` and `tag` narrow which */
  | { op: 'fetch'; amount: number; to: 'hand' | 'draw'; kind?: CardKind; tag?: string }
  /** add a copy of the card being played */
  | { op: 'copySelf'; to: 'hand' | 'discard' | 'draw' };

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

export interface CardDef {
  id: CardId;
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
  /** an X card: costs all your remaining Mana and the Metric 'x' is how much was spent (give it cost 0) */
  x?: boolean;
  /** an X card's "+1": X counts as this much more than the Mana spent (the "+" version of every X card has 1) */
  xBonus?: number;
  /** starts in your opening hand */
  innate?: boolean;
  /** exhausts if it is still in your hand at the end of your turn */
  ethereal?: boolean;
  /** runs when an effect discards this card (not the end-of-turn discard) */
  onDiscard?: Op[];
  /** runs when this card is exhausted */
  onExhaust?: Op[];
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
  /** statuses it starts the fight with */
  statuses?: Partial<Record<StatusId, number>>;
  brain: Brain;
  /** UI hint: how to draw it */
  art?: string;
}

/**
 * An innate trait: a passive every Riftwalker has. `fightStart` ops run once as the fight begins, `turnStart` ops every one
 * of their turns, `triggers` work like an Aura's for the whole fight (but are not an Aura: they are never counted or listed as
 * one), and `clutch` makes them deal `damagePct`% more attack damage while at or below `below`% of their HP.
 */
export interface HeroTrait {
  name: string;
  /** what it does, in a sentence (shown on the character screens and the hero's plate) */
  text: string;
  fightStart?: Op[];
  turnStart?: Op[];
  triggers?: Extract<Op, { op: 'power' }>[];
  clutch?: { below: number; damagePct: number };
  /** the share of the hero's Might their companions hold (rounded down): 1 shares it all, 0.5 half; a new companion arrives with it */
  shareMight?: number;
  /** HP healed after every fight the hero wins (in a run) */
  healAfterFight?: number;
}

export interface HeroDef {
  id: string;
  name: string;
  maxHp: number;
  mana: number; // per turn
  handSize: number;
  /** allies it starts every fight with */
  startUnits?: string[];
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
}

export interface CombatDb {
  runes?: Record<string, RuneDef>;
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
  lastMoves: string[];
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
}

/** A choice the acting player owes before anything else happens. */
export interface Pending {
  kind: 'discard' | 'exhaust' | 'scry';
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
  /** the card is played a second time when it finishes (a Reverb attack or Mirrored skill) */
  again?: 'twinned' | 'mirrored' | null;
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
  discarded: number;
  /** leaving Calm has already paid its Mana this turn */
  calmPaid?: boolean;
  /** counters for the whole fight */
  drawn: number;
  created: number;
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
  /** `release` names the companion that leaves to make room, when a card that summons is played with every companion slot taken */
  | { type: 'play'; card: InstId; target?: UnitId; release?: UnitId }
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
    }
  | { type: 'barrier'; target: UnitId; amount: number; total: number }
  | {
      type: 'barrierDrop';
      target: UnitId;
      /** Barrier left after the drop (Fortified keeps some) */ total?: number;
    }
  /** `hp`: the target's HP after the heal (for the battle log) */
  | { type: 'heal'; target: UnitId; amount: number; hp?: number }
  | { type: 'status'; target: UnitId; status: StatusId; amount: number; total: number }
  | { type: 'summon'; side: Side; unit: UnitId; def: string; index: number }
  | {
      type: 'died';
      unit: UnitId;
      /** it left to make room for another companion: not a death */ released?: boolean;
    }
  | { type: 'intent'; unit: UnitId; move: string; target: UnitId | null }
  | { type: 'snareSet'; side: Side; snare: string }
  | { type: 'snareSprung'; side: Side; snare: string; card: CardId }
  | { type: 'prevented'; unit: UnitId }
  | { type: 'stars'; side: Side; stars: number }
  | { type: 'runeChannel'; side: Side; rune: string; index: number }
  | { type: 'runeFire'; side: Side; rune: string; how: 'passive' | 'evoke' }
  | { type: 'runeGone'; side: Side; rune: string }
  | { type: 'stance'; unit: UnitId; stance: Stance | 'none' }
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
