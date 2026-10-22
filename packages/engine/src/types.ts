// Core types: the effect DSL (cards are data), game state (plain JSON), actions, prompts and events.
// Rules: docs/01_GAME_DESIGN.md §3. DSL: docs/02_CARDS.md §2.1 (+ extensions logged in docs/DECISIONS.md).

export type PlayerId = 0 | 1;
export type InstanceId = string;

// ---------------------------------------------------------------------------------------------
// Card definitions & effect DSL
// ---------------------------------------------------------------------------------------------

export type Realm = 'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'neutral';
export type CardType = 'unit' | 'spell' | 'trap' | 'relic' | 'rift' | 'token' | 'sigil';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type Keyword =
  | 'guardian'
  | 'blitz'
  | 'shield'
  | 'ward'
  | 'pierce'
  | 'lifebind'
  | 'veiled'
  | 'stun'
  | 'corrode'
  | 'ambush'
  | 'devour'
  | 'evolve'
  | 'assemble'
  | 'overclock'
  | 'resonance'
  | 'echo'
  | 'ascend'
  | 'scry'
  | 'swift'
  | 'quick'
  | 'negate'
  | 'charges';

export type Side = 'friendly' | 'enemy' | 'any';
export type TargetZone = 'units' | 'backrow' | 'setCards' | 'relics';
export type Duration = 'turn' | 'permanent';

/** Card filter. All present keys must match. Face-down cards expose no characteristics. */
export interface Filter {
  type?: CardType | CardType[];
  tribe?: string;
  minCost?: number;
  maxCost?: number;
  minPower?: number;
  maxPower?: number;
  /** Current remaining Guard. */
  maxGuard?: number;
  keyword?: Keyword;
  damaged?: boolean;
  notSelf?: boolean;
  withoutShield?: boolean;
}

export interface Target {
  pick:
    | 'chosen'
    | 'random'
    | 'all'
    | 'self'
    | 'eventSource'
    | 'eventTarget'
    | 'riftwalker'
    | 'linkTarget'
    | 'summonedByThis';
  side?: Side;
  zone?: TargetZone | TargetZone[];
  filter?: Filter;
  count?: number;
  /** Choice slot. Targets with the same slot share one choice (default 0). */
  slot?: number;
}

export interface ValueExpr {
  countOf: Target;
  times?: number;
  plus?: number;
}
export type Amount = number | ValueExpr;

export interface Condition {
  /** The chosen target (slot 0 unless `slot`) is the attacker of an attack on the chain. */
  targetIsAttacking?: boolean;
  slot?: number;
  eventSource?: Filter;
  resonanceAtLeast?: number;
  handCountAtMost?: number;
}

export type Effect =
  | { op: 'damage' | 'heal'; target: Target; amount: Amount }
  | { op: 'destroy'; target: Target; devour?: boolean }
  | {
      op: 'banish' | 'returnToHand' | 'stun' | 'corrode' | 'takeControl' | 'assemble';
      target: Target;
    }
  | { op: 'buff'; target: Target; power?: number; guard?: number; duration: Duration }
  | { op: 'grant'; target: Target; keyword: Keyword; duration: Duration }
  | { op: 'summon'; card: string; count: number; side?: 'friendly' | 'enemy' }
  | {
      op: 'draw' | 'discardRandom' | 'scry' | 'gainAether' | 'topdeckFromHand';
      player: 'self' | 'enemy';
      amount: number;
      /** gainAether only: temporary (default) or held Aether. */
      temporary?: boolean;
    }
  | { op: 'negate'; link: 'trigger' }
  | { op: 'fight'; a: Target; b: Target }
  | { op: 'transform'; target: Target; into: string }
  | { op: 'setFrom'; zone: 'deck'; filter?: Filter; choose: 'random'; free: true }
  | { op: 'removeCharge'; target: Target; amount?: number }
  | { op: 'atEndOfTurn'; effects: Effect[] }
  | { op: 'conditional'; if: Condition; then: Effect[]; else?: Effect[] };

export type EventType =
  | 'attackDeclared'
  | 'unitSummoned'
  | 'spellCast'
  | 'swiftCast'
  | 'trapActivated'
  | 'unitDied'
  | 'devoured';

/** `side` is relative to the ability's controller: whose unit / who acted. */
export interface EventFilter {
  type: EventType;
  side: Side;
  /** Applies to the event's source (attacker, summoned unit, dead unit, devourer, cast card). */
  filter?: Filter;
  /** attackDeclared only: what was attacked. */
  attackTarget?: 'friendlyUnit' | 'riftwalker';
  /** unitDied only: the ability's source dealt the killing blow. */
  killedBySelf?: boolean;
  cause?: 'combat';
}

export interface ResonanceBonus {
  n: number;
  effects: Effect[];
}

export type TimedKind =
  | 'onResolve'
  | 'onSummon'
  | 'onDeath'
  | 'onFlip'
  | 'onDevoured'
  | 'startOfTurn'
  | 'endOfTurn'
  | 'duelStart';

export type Ability =
  | {
      kind: TimedKind;
      effects: Effect[];
      resonance?: ResonanceBonus;
      /** "You may": the controller can decline (Devour, Assemble). */
      optional?: boolean;
      /** Only applies if the Overclock cost was paid. */
      overclock?: boolean;
    }
  | {
      kind: 'whenever';
      event: EventFilter | EventFilter[];
      effects: Effect[];
      oncePerTurn?: boolean;
      oncePerGame?: boolean;
    }
  | { kind: 'trigger'; event: EventFilter | EventFilter[]; effects: Effect[] }
  | { kind: 'activated'; quick?: boolean; cost: number; oncePerTurn?: boolean; effects: Effect[] }
  | { kind: 'static'; modifier: StaticModifier };

export type StaticModifier =
  | { type: 'cantAttack' }
  | {
      type: 'costMod';
      side: Side;
      filter: Filter;
      amount: number;
      /** 'play' = playing from hand; 'activate' = activating a set Trap. */
      on: 'play' | 'activate';
    }
  | { type: 'powerPerCount'; count: { side: Side; filter: Filter }; amount: number }
  | {
      type: 'aura';
      side: Side;
      filter?: Filter;
      power?: number;
      guard?: number;
      keyword?: Keyword;
    };

export interface AscendCost {
  destroy: number;
  filter?: Filter;
}

export interface CardDef {
  id: string;
  name: string;
  realm: Realm;
  type: CardType;
  rarity: Rarity;
  /** Aether. Traps: activation cost. */
  cost: number;
  power?: number;
  guard?: number;
  tribes?: string[];
  keywords?: Keyword[];
  params?: { overclock?: number; echo?: number; charges?: number; ambush?: true };
  ascend?: AscendCost;
  abilities: Ability[];
  text: string;
  flavor?: string;
  art?: { file?: string; prompt: string; focal?: [number, number] };
  collectible: boolean;
  source?: string;
}

export type CardDb = Readonly<Record<string, CardDef>>;

// ---------------------------------------------------------------------------------------------
// Game state (plain JSON)
// ---------------------------------------------------------------------------------------------

export type Zone =
  'deck' | 'hand' | 'units' | 'backrow' | 'rift' | 'void' | 'beyond' | 'chain' | 'sigil';

export interface Buff {
  power: number;
  guard: number;
  duration: Duration;
}

export interface CardInstance {
  id: InstanceId;
  /** Current identity (changes on Evolve/transform). */
  cardId: string;
  /** Printed card; a transformed card reverts to this when it leaves the field. */
  baseCardId: string;
  owner: PlayerId;
  controller: PlayerId;
  zone: Zone;
  faceDown: boolean;
  /** Turn it was set (traps, Ambush units). */
  setTurn: number;
  /** Turn it entered the field (Arriving). */
  arrivedTurn: number;
  attackedTurn: number;
  damage: number;
  /** Temporary Guard: absorbs damage first, gone at end of turn. */
  tempGuard: number;
  buffs: Buff[];
  granted: { keyword: Keyword; duration: Duration }[];
  shield: boolean;
  veiled: boolean;
  /** The controller's turn number during which this is Stunned (0 = not stunned). */
  stunTurn: number;
  corrode: number;
  wardTurn: number;
  charges: number;
  /** Cast/played via Echo: goes Beyond when it leaves. */
  echoed: boolean;
  /** abilityIndex → turn it was last used (oncePerTurn). */
  usedTurn: Record<string, number>;
  /** Who last damaged this unit, for "destroys an enemy unit in combat" (Evolve). */
  lastHit?: { by: InstanceId | null; cause: 'combat' | 'effect' };
}

export interface PlayerState {
  essence: number;
  maxEssence: number;
  aether: number;
  tempAether: number;
  maxAether: number;
  resonance: number;
  fatigue: number;
  deck: InstanceId[]; // index 0 = top
  hand: InstanceId[];
  units: (InstanceId | null)[];
  backrow: (InstanceId | null)[];
  rift: InstanceId | null;
  void: InstanceId[];
  beyond: InstanceId[];
  sigil: InstanceId | null;
  mulliganed: boolean;
  /** oncePerGame keys already used. */
  once: Record<string, true>;
}

/** What happened that a link represents (used for Trap Trigger matching). */
export interface LinkEvent {
  type:
    | 'attackDeclared'
    | 'unitSummoned'
    | 'spellCast'
    | 'trapActivated'
    | 'abilityActivated'
    | 'played'
    | 'flipped';
  player: PlayerId;
  sourceId: InstanceId;
  sourceCardId: string;
  /** Attack target: unit id or the defending player's face. */
  targetId?: InstanceId | 'face';
  swift?: boolean;
}

export interface Link {
  id: string;
  kind: 'summon' | 'spell' | 'trap' | 'attack' | 'flip' | 'ability' | 'play';
  controller: PlayerId;
  sourceId: InstanceId;
  cardId: string;
  /** Indices into the card's abilities that this link resolves. */
  abilities: number[];
  /** Chosen targets per slot. */
  targets: InstanceId[][];
  event: LinkEvent;
  negated: boolean;
  /** Trap links: the link whose event sprang the Trap. */
  triggerLinkId?: string;
  overclocked?: boolean;
}

export interface EffectCtx {
  controller: PlayerId;
  sourceId: InstanceId;
  sourceCardId: string;
  targets: InstanceId[][];
  eventSourceId?: InstanceId;
  eventTargetId?: InstanceId | 'face';
  /** Who the event target belongs to when it is a face. */
  eventTargetPlayer?: PlayerId;
  triggerLinkId?: string;
  summoned: InstanceId[];
}

/** A passive trigger (or delayed effect) waiting in the queue. Not a chain link. */
export interface QueuedTrigger {
  controller: PlayerId;
  sourceId: InstanceId;
  cardId: string;
  /** Ability index on the card, or -1 for a delayed effect (uses `effects`). */
  ability: number;
  effects?: Effect[];
  ctx?: EffectCtx;
  eventSourceId?: InstanceId;
  eventTargetId?: InstanceId | 'face';
}

export type Task =
  | { t: 'frame'; effects: Effect[]; i: number; ctx: EffectCtx }
  | { t: 'drain' }
  | { t: 'openWindow' }
  | { t: 'resolveTop' }
  | { t: 'afterResolve'; link: Link }
  | { t: 'flipLink'; unitId: InstanceId }
  | { t: 'duelStart' }
  | { t: 'startTurn'; player: PlayerId }
  | { t: 'dawnDraw' }
  | { t: 'queueTimed'; kind: 'startOfTurn' | 'endOfTurn' }
  | { t: 'dusk' }
  | { t: 'enterMain' };

export interface SlotSpec {
  slot: number;
  count: number;
  options: InstanceId[];
}

export type Pending =
  | { kind: 'mulligan'; player: PlayerId }
  | {
      kind: 'chooseTargets';
      player: PlayerId;
      slots: SlotSpec[];
      /** What happens with the answer. */
      then: { kind: 'trigger'; trigger: QueuedTrigger } | { kind: 'flip'; unitId: InstanceId };
    }
  | { kind: 'chooseOptional'; player: PlayerId; trigger: QueuedTrigger }
  | { kind: 'scry'; player: PlayerId; cards: InstanceId[] }
  | {
      kind: 'chooseCards';
      player: PlayerId;
      from: InstanceId[];
      count: number;
      purpose: 'topdeck';
    };

export interface Rules {
  unitSlots: number;
  backrowSlots: number;
  handLimit: number;
  maxAether: number;
  openingHand: number;
  maxTurns: number;
  chainCap: number;
  triggerCap: number;
  /** Card given to the second player after mulligans (Rift Spark, §3.1). null = none. */
  secondPlayerCard: string | null;
}

export interface GameState {
  v: 1;
  seed: string;
  rng: [number, number, number, number];
  rules: Rules;
  turn: number;
  active: PlayerId;
  first: PlayerId;
  phase: 'mulligan' | 'setup' | 'main' | 'ended';
  players: [PlayerState, PlayerState];
  cards: Record<InstanceId, CardInstance>;
  nextId: number;
  nextLinkId: number;
  chain: Link[];
  window: { priority: PlayerId; passes: number } | null;
  tasks: Task[];
  triggers: QueuedTrigger[];
  delayed: { turn: number; trigger: QueuedTrigger }[];
  pending: Pending | null;
  winner: PlayerId | 'draw' | null;
}

export interface PlayerConfig {
  deck: string[];
  sigil?: string;
  essence?: number;
  name?: string;
}

export interface GameConfig {
  seed: string;
  players: [PlayerConfig, PlayerConfig];
  /** Default: chosen by the seeded PRNG. */
  first?: PlayerId;
  rules?: Partial<Rules>;
}

// ---------------------------------------------------------------------------------------------
// Actions (every decision answers the current state; only legalActions() are accepted)
// ---------------------------------------------------------------------------------------------

export type Action =
  | { type: 'mulligan'; player: PlayerId; cards: InstanceId[] }
  | {
      type: 'play';
      player: PlayerId;
      card: InstanceId;
      targets: InstanceId[][];
      /** Optional abilities (by index) the player declined. */
      declined?: number[];
      overclock?: boolean;
      /** Ascend: friendly units destroyed instead of paying Aether. */
      ascend?: InstanceId[];
      /** Echo: cast from the Void. */
      echo?: boolean;
    }
  | { type: 'setTrap'; player: PlayerId; card: InstanceId }
  | { type: 'setAmbush'; player: PlayerId; card: InstanceId }
  | { type: 'flip'; player: PlayerId; unit: InstanceId; targets: InstanceId[][] }
  | { type: 'attack'; player: PlayerId; attacker: InstanceId; target: InstanceId | 'face' }
  | { type: 'activateTrap'; player: PlayerId; card: InstanceId; targets: InstanceId[][] }
  | {
      type: 'activate';
      player: PlayerId;
      card: InstanceId;
      ability: number;
      targets: InstanceId[][];
    }
  | { type: 'pass'; player: PlayerId }
  | { type: 'endTurn'; player: PlayerId }
  | { type: 'concede'; player: PlayerId }
  | { type: 'chooseTargets'; player: PlayerId; targets: InstanceId[][] }
  | { type: 'chooseOptional'; player: PlayerId; accept: boolean }
  | { type: 'scry'; player: PlayerId; top: InstanceId[]; bottom: InstanceId[] }
  | { type: 'chooseCards'; player: PlayerId; cards: InstanceId[] };

// ---------------------------------------------------------------------------------------------
// Events (the only thing the client animates from)
// ---------------------------------------------------------------------------------------------

export type GameEvent =
  | { type: 'gameStarted'; first: PlayerId }
  | { type: 'mulliganed'; player: PlayerId; count: number }
  | { type: 'turnStarted'; turn: number; player: PlayerId }
  | { type: 'aetherChanged'; player: PlayerId; aether: number; temp: number; max: number }
  | { type: 'resonanceChanged'; player: PlayerId; value: number }
  | { type: 'cardDrawn'; player: PlayerId; id: InstanceId; cardId: string }
  | { type: 'cardBurned'; player: PlayerId; cardId: string }
  | { type: 'fatigue'; player: PlayerId; amount: number }
  | {
      type: 'cardPlayed';
      player: PlayerId;
      id: InstanceId;
      fromId: InstanceId;
      cardId: string;
      echo?: boolean;
    }
  | {
      type: 'unitSummoned';
      player: PlayerId;
      id: InstanceId;
      cardId: string;
      slot: number;
      token: boolean;
    }
  | { type: 'trapSet'; player: PlayerId; id: InstanceId; cardId: string }
  | { type: 'ambushSet'; player: PlayerId; id: InstanceId; cardId: string; slot: number }
  | { type: 'flipped'; player: PlayerId; id: InstanceId; cardId: string }
  | {
      type: 'attackDeclared';
      player: PlayerId;
      attackerId: InstanceId;
      target: InstanceId | 'face';
    }
  | { type: 'responseWindowOpened'; priority: PlayerId; chainLength: number }
  | { type: 'passed'; player: PlayerId }
  | {
      type: 'chainLinkAdded';
      linkId: string;
      index: number;
      kind: Link['kind'];
      player: PlayerId;
      sourceId: InstanceId;
      cardId: string;
      targets: InstanceId[];
    }
  | { type: 'chainLinkResolving'; linkId: string; index: number }
  | { type: 'chainLinkResolved'; linkId: string }
  | { type: 'negated'; linkId: string; byId: InstanceId }
  | { type: 'fizzled'; linkId: string }
  | {
      type: 'damageDealt';
      sourceId: InstanceId | null;
      target: InstanceId | { player: PlayerId };
      amount: number;
    }
  | { type: 'healed'; target: InstanceId | { player: PlayerId }; amount: number }
  | { type: 'shieldPopped'; id: InstanceId }
  | { type: 'statsChanged'; id: InstanceId; power: number; guard: number }
  | { type: 'keywordGranted'; id: InstanceId; keyword: Keyword }
  | { type: 'statusApplied'; id: InstanceId; status: 'stunned' | 'corroded' | 'warded' }
  | {
      type: 'unitDestroyed';
      id: InstanceId;
      cardId: string;
      player: PlayerId;
      cause: 'combat' | 'effect' | 'damage' | 'devoured';
    }
  | { type: 'cardDestroyed'; id: InstanceId; cardId: string; player: PlayerId }
  | { type: 'unitBanished'; id: InstanceId; cardId: string; player: PlayerId }
  | {
      type: 'returnedToHand';
      fromId: InstanceId;
      id: InstanceId | null;
      cardId: string;
      player: PlayerId;
    }
  | { type: 'controlChanged'; id: InstanceId; player: PlayerId }
  | { type: 'evolved'; id: InstanceId; from: string; to: string }
  | { type: 'assembled'; id: InstanceId; absorbedId: InstanceId }
  | { type: 'devoured'; devourerId: InstanceId; victimId: InstanceId }
  | { type: 'relicChargeChanged'; id: InstanceId; charges: number }
  | { type: 'relicBroken'; id: InstanceId; cardId: string }
  | { type: 'riftChanged'; player: PlayerId; id: InstanceId; cardId: string }
  | { type: 'discarded'; player: PlayerId; cardId: string }
  | { type: 'cardToDeck'; player: PlayerId; cardId: string; position: 'top' | 'bottom' }
  | { type: 'scried'; player: PlayerId; top: number; bottom: number }
  | { type: 'gameOver'; winner: PlayerId | 'draw' };

export interface PlayerView {
  viewer: PlayerId;
  state: GameState;
}
