// Run state for the campaign (docs/03_CAMPAIGN.md, adapted to Combat v2 in docs/08). Plain JSON so it can be saved,
// exported and replayed. Everything that looks random comes from the seeded PRNG kept inside the run, so a seed and the
// choices made reproduce the same run.

import type { RngState } from '@sr/combat';
import type { HeroId } from '@sr/content/v2';

export type Difficulty = 'easy' | 'normal' | 'hard';

/** How kind card rewards are: a setting for testing and for players who want a stronger deck sooner. */
export type Luck = 'normal' | 'lucky' | 'blessed';

export type NodeKind = 'duel' | 'elite' | 'event' | 'shrine' | 'merchant' | 'warden';

export interface MapNode {
  id: string;
  /** 1-based floor within the stage; the Warden sits one floor above the last. */
  floor: number;
  kind: NodeKind;
  /** Duel, Elite and Warden nodes: the encounter that waits here (an id from the content's ENCOUNTERS). */
  enemyId?: string;
  /** Ids of the nodes on the next floor this one connects to. */
  next: string[];
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
  | 'loopCleared' // all five stages done: Bank or Continue
  | 'collapsed' // Resolve reached 0: the run and its deck are lost
  | 'banked'; // the deck was banked for PvP

export interface MerchantItem {
  cardId: string;
  price: number;
  sold: boolean;
  /** a card you put on hold at an earlier visit, back for the reduced price you were promised */
  held?: boolean;
  /** you put this card on hold at this visit: it will be waiting at the next merchant */
  onHold?: boolean;
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
    | 'leave';
  label: string;
}

/** One of the two starting decks offered at the start of a run. */
export interface KitOption {
  id: 'a' | 'b';
  /** what it leans toward, in the player's words ("Snares", "Fate"...) */
  leans: string;
  /** the whole deck you would start with */
  deck: string[];
  /** the three cards this kit adds, and the plain cards it replaces */
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
  | { k: 'remove'; n: number } // Slash / Guard only
  | { k: 'boon'; rarity: 'common' | 'uncommon' | 'rare' }
  | { k: 'potion' }
  | { k: 'resolve'; n: number }
  | { k: 'wound'; n: number }
  | { k: 'transform'; n: number }; // Slash / Guard into random cards

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
export interface NodeContext {
  nodeId: string;
  /** reward / gift: the cards on offer */
  offers?: string[];
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
    boon?: { id: string; price: number; sold: boolean };
    potions?: { id: string; price: number; sold: boolean }[];
  };
  event?: {
    title: string;
    text: string;
    options: EventOption[];
    cardOffer: string;
    /** an event that offers a Boon */
    boonOffer?: string;
  };
  shrineUsed?: boolean;
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
  seed: string;
  character: HeroId;
  /** The run's difficulty setting (see DIFFICULTY): Normal unless chosen otherwise (see DIFFICULTY). */
  difficulty: Difficulty;
  /** Card luck: shifts card offers (and the merchant's stock) towards uncommon and rare cards. Missing in old saves = normal. */
  luck?: Luck;
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
  /** a merchant card put on hold (deposit paid): it is for sale again, cheaper, at the next merchant */
  held?: { cardId: string; price: number };
  shards: number;
  /** Run passives (Boons) are part of the design but not built yet. */
  boons: string[];
  /** Potions carried (up to MAX_POTIONS); a lost fight does not use them up */
  potions: string[];
  /** The realm order for stages 1-3 (stage 4 is always Umbral Veil, stage 5 the Rift). */
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
  /** what the last event did, in a sentence (shown once it is over) */
  eventResult?: string;
}
