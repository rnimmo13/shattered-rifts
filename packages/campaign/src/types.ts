// Run state for the campaign (docs/03_CAMPAIGN.md, adapted to Combat v2 in docs/08). Plain JSON so it can be saved,
// exported and replayed. Everything that looks random comes from the seeded PRNG kept inside the run, so a seed and the
// choices made reproduce the same run.

import type { RngState } from '@sr/combat';
import type { HeroId } from '@sr/content/v2';

export type Difficulty = 'easy' | 'normal';

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
  | 'map' // choose the next node
  | 'duel' // a fight is waiting to be played at the current node
  | 'reward' // pick a card (or skip)
  | 'gift' // the Warden's Gift: pick one rare card
  | 'shrine'
  | 'merchant'
  | 'event'
  | 'stageClear' // a stage was just cleared; the next stage begins when the player continues
  | 'loopCleared' // all five stages done: Bank or Continue
  | 'collapsed' // Resolve reached 0: the run and its deck are lost
  | 'banked'; // the deck was banked for PvP

export interface MerchantItem {
  cardId: string;
  price: number;
  sold: boolean;
}

export interface EventOption {
  id: 'shards' | 'card' | 'heal' | 'upgrade' | 'bleed' | 'boon' | 'leave';
  label: string;
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
  merchant?: {
    items: MerchantItem[];
    removePrice: number;
    removed: boolean;
    boon?: { id: string; price: number; sold: boolean };
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
  /** The run's difficulty setting (see DIFFICULTY): easy while the game is being built and tested. */
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
  shards: number;
  /** Run passives (Boons) are part of the design but not built yet. */
  boons: string[];
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
}
