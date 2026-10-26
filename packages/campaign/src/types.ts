// Run state for the campaign (docs/03_CAMPAIGN.md, adapted to Combat v2 in docs/08). Plain JSON so it can be saved,
// exported and replayed. Everything that looks random comes from the seeded PRNG kept inside the run, so a seed and the
// choices made reproduce the same run.

import type { RngState } from '@sr/combat';
import type { CardMark, HeroId } from '@sr/content/v2';
import type { GamblerShrine } from './gambler';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type NodeKind = 'duel' | 'elite' | 'event' | 'shrine' | 'merchant' | 'warden';

export interface MapNode {
  id: string;
  /** 1-based floor within the stage; the Warden sits one floor above the last. */
  floor: number;
  kind: NodeKind;
  /** Duel, Elite and Warden nodes: the encounter that waits here (an id from the content's ENCOUNTERS). */
  enemyId?: string;
  /** Warden nodes beyond Rift Tier 3: the Warden may be a ghost (a deck from the Arena) in place of the usual one, if the server can supply one; `enemyId` is the Warden to fight if not */
  ghost?: boolean;
  /** the ghost deck this Warden will be, settled when the stage begins (a stage with no valid ghost loses its `ghost` mark instead) */
  ghostDeck?: GhostBoss;
  /** Merchant nodes: the Riftwalker whose cards this visiting merchant sells (a Rift-crossed stranger), shown on the map. */
  crossed?: string;
  /** Ids of the nodes on the next floor this one connects to. */
  next: string[];
  /** an event that became a fight: what winning it also pays (on top of the usual reward) */
  bonus?: DealStep[];
}

export type StageRealm = 'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'rift';

export interface StageMap {
  stage: number;
  realm: StageRealm;
  floors: number;
  nodes: MapNode[];
}

export type RunPhase =
  | 'kit' // choose one of two starting decks (the very start of a run)
  | 'map' // choose the next node
  | 'duel' // a fight is waiting to be played at the current node
  | 'reward' // pick a card (or skip)
  | 'gift' // the Warden's Gift: pick one rare card
  | 'shrine'
  | 'merchant'
  | 'event'
  | 'prelude' // the choice at the start of a run or a stage
  | 'stageClear' // a stage was just cleared; the next stage begins when the player continues
  | 'loopCleared' // all three stages done: Bank or Continue
  | 'collapsed' // Resolve reached 0: the run and its deck are lost
  | 'banked'; // the deck was banked for PvP

export interface MerchantItem {
  cardId: string;
  price: number;
  sold: boolean;
  /** a card you put on hold at an earlier visit, back for the reduced price you were promised */
  held?: boolean;
  /** this visit's sale: the price is already SALE_OFF less */
  sale?: boolean;
  /** you put this card on hold at this visit: it will be waiting at the next merchant */
  onHold?: boolean;
}

/** The prize games an elite event can offer: the reel (the client animates it: apps/web/src/trials), and the retired pegboard of older saves. */
export type TrialGame = 'reel' | 'cascade';

/** One prize to choose from when a trial is won: what it does is a list of deal steps, and what to show of it. */
export interface TrialPrize {
  /** d1..d3, or p0.. for the prizes on the Brass Reel */
  id: string;
  label: string;
  deal: DealStep[];
  /** a few words for its tile on the reel (a card or Boon name, "Upgrade ×3") */
  short?: string;
  /** what kind of thing it is, for the little mark on its slot: card, boon, potion, crossed, hp, upgrade, shards, heal */
  icon?: string;
  card?: string;
  /** a prize that is a choice of cards (the Rift-crossed build path: three rares): you pick one when you take it */
  choices?: string[];
  boon?: string;
  potion?: string;
  /** a prize that lets you remove up to this many cards of your choice (none is fine): the cards are named when you take it */
  removeUpTo?: number;
}

export interface TrialOffer {
  game: TrialGame;
  /** the Rift Tier the run was on (a trial can get harder the deeper you go); missing in older saves = 1 */
  tier?: number;
  /** (what the older pegboard game was made from; the reel draws from the run's own stream and does not use it) */
  seed: number;
  /** open: not spun yet. won: a prize is on the table (take it, or spin again). playing: only in older saves (a pegboard game that was begun). */
  state: 'open' | 'playing' | 'won';
  /** (the shards an older pegboard game paid for trying) */
  consolation: number;
  /** what the prizes are, in a few words ("Legendary cards") */
  theme: string;
  prizes: TrialPrize[];
  /** the prize the reel stopped on (the number of its place on the reel): the one on the table, which you take or spin away */
  earned?: number[];
  /** how many times the reel has been spun here */
  rolls?: number;
  /** (second prizes of the older pegboard game; no longer used) */
  seconds?: TrialPrize[];
}

export interface EventOption {
  id:
    | 'shards'
    | 'card'
    | 'heal'
    | 'upgrade'
    | 'bleed'
    | 'boon'
    | 'ancestor'
    | 'cross'
    | 'sanctify'
    | 'bet'
    | 'help'
    | 'rob'
    | 'idol'
    | 'drink'
    | 'mirror'
    | 'scrap'
    | 'sell'
    | 'maxhp'
    | 'tend'
    | 'purge'
    | 'temper'
    | 'spin'
    | 'grab'
    | 'burn'
    | 'lab'
    | 'transform'
    | 'trial'
    | 'd1'
    | 'd2'
    | 'd3'
    | 'd4'
    | 'leave';
  label: string;
  /** data-driven options (d1..d4): what choosing it does, step by step (see deals.ts) */
  deal?: DealStep[];
  /** a line of story shown before what happened, for a data-driven option */
  say?: string;
  /** the cards this option would take from the deck and give it, picked when the event was built, shown beside it (DECISIONS #273) */
  shows?: { lose: string[]; gain: string[] };
}

/** One effect of a data-driven event option. They run in order; if one cannot happen the option is not allowed. */
export type DealStep =
  | { k: 'hurt'; n: number }
  | { k: 'hurtPct'; n: number }
  | { k: 'heal'; pct: number }
  | { k: 'maxHp'; n: number }
  /** negative n: pay shards */
  | { k: 'shards'; n: number }
  | { k: 'wound'; n: number }
  | { k: 'potion'; n: number }
  /** the event's Boon */
  | { k: 'boon' }
  | { k: 'upgrade'; n: number }
  /** 'wound': a Wound, else a basic card; 'basic': a basic card; 'any': any card */
  /** `ids`: the exact cards it takes, picked when the event was built so the option can name them (DECISIONS #233) */
  | { k: 'remove'; of: 'wound' | 'basic' | 'any'; n: number; ids?: string[] }
  /** a random basic card becomes a random card of your class */
  | { k: 'transform' }
  /** a random non-basic card is copied */
  | { k: 'copy' }
  /** a random card of your class and that rarity joins the deck */
  | { k: 'gift'; rarity: 'common' | 'uncommon' | 'rare' }
  /** a random card from another Riftwalker's pool (never Legendary) joins the deck */
  | { k: 'crossed'; rarity: 'common' | 'uncommon' | 'rare' }
  /** three cards from other Riftwalkers' pools are laid out and the player chooses one (the event waits for the pick) */
  | { k: 'crossedPick'; rarity: 'common' | 'uncommon' | 'rare' }
  /** this exact card joins the deck (the event named it when it was built) */
  | { k: 'card'; id: string }
  /** `from` (a card of the deck) is given up and `to` takes its place: the deck rules are checked without `from`, so a deck at its
   *  Legendary limit can trade its Legendary for another (DECISIONS #238) */
  | { k: 'swap'; from: string; to: string }
  | { k: 'static'; n: number }
  /** a random Boon is given up */
  | { k: 'loseBoon' }
  | { k: 'losePotion'; n: number }
  /** a random card (not basic) leaves the deck and a Rift-crossed card of the same rarity takes its place */
  | { k: 'exchange' }
  /** this exact Boon / potion (named when the event was built) */
  | { k: 'boonOf'; id: string }
  | { k: 'potionOf'; id: string }
  /** set (or, with off, clear) a flag on the run that a later event can ask for */
  | { k: 'mark'; id: string; off?: boolean }
  | { k: 'chance'; pct: number; win: DealStep[]; lose: DealStep[] }
  /** the player chooses a card of their deck, and it is upgraded / removed / transformed / tagged (the event waits for the pick) */
  | { k: 'choose'; act: DeckChoice; mark?: CardMark }
  /** the stop becomes a fight (a regular one or an Elite); winning it also pays `bonus` */
  | { k: 'fight'; kind: 'duel' | 'elite'; bonus?: DealStep[] };

/** What an event does to a card you choose from your deck. */
export type DeckChoice = 'upgrade' | 'remove' | 'transform' | 'copy' | 'mark';

/** One of the three starting decks (one per build path) offered at the start of a run. */
export interface KitOption {
  id: 'a' | 'b' | 'c';
  /** what it leans toward, in the player's words ("Traps", "Fate"...) */
  leans: string;
  /** the whole deck you would start with */
  deck: string[];
  /** the two cards this kit adds, and the plain cards it replaces */
  added: string[];
  removed: string[];
}

/** One thing a prelude option does. Amounts are fixed; "random" ones are rolled when the option is taken. */
export type PreludeEffect =
  | { k: 'maxHp'; n: number }
  | { k: 'heal'; pct: number }
  | { k: 'hp'; n: number } // lose HP (never below 1)
  | { k: 'shards'; n: number }
  | { k: 'card'; rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'ancestral' }
  | { k: 'upgrade'; n: number }
  /** Attack / Defend only; `only`: just Strikes, or just Defends */
  | { k: 'remove'; n: number; only?: 'strike' | 'defend' }
  | { k: 'boon'; rarity: 'common' | 'uncommon' | 'rare' }
  | { k: 'potion' }
  | { k: 'resolve'; n: number }
  | { k: 'wound'; n: number }
  /** Attack / Defend into random cards (`better`: uncommon or rare instead of common or uncommon) */
  | { k: 'transform'; n: number; better?: boolean }
  /** choose one of three cards of this rarity from your class's pool (`upgraded`: offered as their "+" versions) */
  | {
      k: 'pick';
      rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'ancestral';
      upgraded?: boolean;
      /** only Attacks, or only Skills */
      kind?: 'attack' | 'skill';
    };

export interface PreludeOption {
  id: string;
  name: string;
  /** generated from the effects */
  text: string;
  effects: PreludeEffect[];
  /** has a price: shown in a warning colour */
  risky?: boolean;
}

export type PreludeKind = 'threshold' | 'stage';

export interface PreludeOffer {
  kind: PreludeKind;
  title: string;
  text: string;
  options: PreludeOption[];
}

/** What the current node is asking for. Only the field matching `phase` is meaningful. */
/** A deck from the Arena that stands in for a Warden: someone's Riftwalker, cards and Boons, played by the computer. */
export interface GhostBoss {
  /** the ghost's id on the server (so a run never meets the same one twice); missing from an older server */
  id?: string;
  /** whose deck it was (shown as "<name>'s ghost") */
  name: string;
  hero: HeroId;
  deck: string[];
  boons: string[];
  /** how far its owner had got when it was entered */
  tier: number;
  stage: number | null;
}

export interface NodeContext {
  nodeId: string;
  /** a Warden that is a ghost: the deck that was fetched for it (kept, so a retry or a reload meets the same one) */
  ghost?: GhostBoss;
  /** the server has been asked for this Warden's ghost (whether or not one came): do not ask again */
  ghostAsked?: boolean;
  /** reward / gift: the cards on offer */
  offers?: string[];
  /** gift: the Warden's Hearts on offer instead of a card */
  hearts?: string[];
  /** reward: shards already granted for the win */
  shardsGained?: number;
  /** reward: a Boon the fight dropped (already added to the run) */
  boonGained?: string;
  /** reward: a Potion the fight dropped (already in your belt) */
  potionGained?: string;
  merchant?: {
    items: MerchantItem[];
    /** a visiting merchant from another Riftwalker's world: every card here is that Riftwalker's (a hero id) */
    crossed?: string;
    removePrice: number;
    removed: boolean;
    /** cards upgraded at this shop so far: each makes the next upgrade dearer (missing = none; the next shop starts again from none) */
    upgrades?: number;
    boon?: { id: string; price: number; sold: boolean };
    potions?: { id: string; price: number; sold: boolean }[];
  };
  event?: {
    title: string;
    text: string;
    options: EventOption[];
    cardOffer: string;
    /** an event that lays several cards on the table (you can read them before you choose) */
    cardOffers?: string[];
    /** a choice waiting to be made: pick one of these cards to take (the event is not over until you do) */
    choose?: { cards: string[] };
    /** a choice waiting to be made: pick a card of your deck (one of `cards`) to upgrade / remove / transform / tag */
    chooseDeck?: { act: DeckChoice; mark?: CardMark; cards: string[] };
    /** the option taken starts a fight here (the run turns the stop into it) */
    fight?: { kind: 'duel' | 'elite'; bonus?: DealStep[] };
    /** an event that offers a Boon */
    boonOffer?: string;
    /** an elite event: an optional mini-game for a choice of better rewards (see trials.ts) */
    trial?: TrialOffer;
  };
  shrineUsed?: boolean;
  /**
   * a Gambler's Shrine (Tier GAMBLER_TIER and up, DECISIONS #234): its altar, chisel and the blessings taken here (two different
   * ones may be taken), with the Brass Reel beside it in `event` (until its prize is taken)
   */
  gambler?: GamblerShrine;
  /** prelude: the choice on offer (nodeId is empty) */
  prelude?: PreludeOffer;
  /** kit: the two starting decks on offer (nodeId is empty) */
  kits?: KitOption[];
}

export interface RunStats {
  duelsWon: number;
  duelsLost: number;
  nodesCleared: number;
}

export interface RunState {
  v: 2;
  /** the ghost Wardens this run has met (their server ids), so it never meets one twice */
  ghostsMet?: string[];
  /** how many times the Gambler's Ledger has been signed this run (each signature gives more Max HP) */
  ledger?: number;
  /** card removals bought from merchants this run (each makes the next dearer); missing = none */
  removals?: number;
  /** the Warden's Heart this run holds, if any (DECISIONS #246) */
  heart?: string;
  seed: string;
  character: HeroId;
  /** The run's difficulty setting (see DIFFICULTY): Normal unless chosen otherwise (see DIFFICULTY). */
  difficulty: Difficulty;
  /** Rift Tier: loops cleared + 1. */
  tier: number;
  /** 1..5 */
  stage: number;
  /** HP carries from fight to fight, as in Slay the Spire. A lost fight restarts at the HP you entered it with. */
  hp: number;
  maxHp: number;
  resolve: number;
  maxResolve: number;
  deck: string[];
  /** the deck has been through the Sanctum of Change: it never happens twice in a run */
  sanctified?: boolean;
  /** merchant cards put on hold (deposit paid): each is for sale again, cheaper, at the next merchant */
  held?: { cardId: string; price: number }[];
  shards: number;
  /** Run passives (Boons) are part of the design but not built yet. */
  boons: string[];
  /** Potions carried (up to MAX_POTIONS); a lost fight does not use them up */
  potions: string[];
  /** The run's four realms, shuffled: stages 1 and 2 are the first two, the Rift (stage 3) draws on the last two. */
  stageRealms: StageRealm[];
  map: StageMap;
  /** Nodes cleared this stage. */
  cleared: string[];
  /** The node the player is standing on (cleared or in progress), or null at the start of a stage. */
  at: string | null;
  phase: RunPhase;
  context: NodeContext | null;
  rng: RngState;
  stats: RunStats;
  /** the coin tosses the last event made, in order (the screen plays them before it says what happened) */
  eventFlips?: { pct: number; won: boolean }[];
  /** flags set by events for a later event to find (a buried map...) */
  marks?: string[];
  /** what the last event did, in a sentence (shown once it is over) */
  eventResult?: string;
}
