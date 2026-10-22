// Public engine API (07_TECH_ARCHITECTURE §3.1): createEngine(cardDb) returns pure functions.

import type {
  Action,
  CardDb,
  GameConfig,
  GameEvent,
  GameState,
  InstanceId,
  Keyword,
  PlayerId,
  PlayerState,
  Rules,
} from './types';
import { inst, newInstance, type Rt } from './rt';
import { computeStats } from './stats';
import { legalActions as enumerate, performAction } from './actions';
import { advance } from './flow';
import { nextInt, seedRng, shuffle } from './rng';
import { clone, hashState, RulesError, stableStringify } from './util';
import { eventsFor, viewFor as redact, type GameView } from './view';

export const DEFAULT_RULES: Rules = {
  unitSlots: 5,
  backrowSlots: 4,
  handLimit: 9,
  maxAether: 10,
  openingHand: 5,
  maxTurns: 200,
  chainCap: 64,
  triggerCap: 256,
  secondPlayerCard: 'TOK-SPARK',
};

export const STARTING_ESSENCE = 30;

export interface Engine {
  createGame(cfg: GameConfig): GameState;
  legalActions(s: GameState, player: PlayerId): Action[];
  applyAction(s: GameState, a: Action): { state: GameState; events: GameEvent[] };
  /** The viewer's redacted view, including layered stats for the units they can see. */
  viewFor(s: GameState, player: PlayerId): GameView;
  eventsFor: typeof eventsFor;
  hashState(s: GameState): string;
  /** Who must act next (pending prompt, priority, or the active player in Main). */
  toAct(s: GameState): PlayerId | null;
  /** Layered stats of a card on the field (for rendering). */
  stats(s: GameState, id: InstanceId): UnitStats;
}

export interface UnitStats {
  power: number;
  guard: number;
  maxGuard: number;
  keywords: Keyword[];
}

function emptyPlayer(rules: Rules, essence: number): PlayerState {
  return {
    essence,
    maxEssence: essence,
    aether: 0,
    tempAether: 0,
    maxAether: 0,
    resonance: 0,
    fatigue: 0,
    deck: [],
    hand: [],
    units: Array.from({ length: rules.unitSlots }, () => null),
    backrow: Array.from({ length: rules.backrowSlots }, () => null),
    rift: null,
    void: [],
    beyond: [],
    sigil: null,
    mulliganed: false,
    once: {},
    lastSpell: null,
    revealedHandTurn: 0,
  };
}

export function createEngine(db: CardDb): Engine {
  const rtFor = (s: GameState): Rt => ({ s, db, ev: [] });

  function createGame(cfg: GameConfig): GameState {
    const rules: Rules = { ...DEFAULT_RULES, ...cfg.rules };
    const rng = seedRng(cfg.seed);
    const s: GameState = {
      v: 1,
      seed: cfg.seed,
      rng,
      rules,
      turn: 0,
      active: 0,
      first: 0,
      phase: 'mulligan',
      players: [
        emptyPlayer(rules, cfg.players[0].essence ?? STARTING_ESSENCE),
        emptyPlayer(rules, cfg.players[1].essence ?? STARTING_ESSENCE),
      ],
      cards: {},
      nextId: 1,
      nextLinkId: 1,
      chain: [],
      window: null,
      tasks: [],
      triggers: [],
      delayed: [],
      pending: null,
      winner: null,
    };
    const rt = rtFor(s);
    for (const p of [0, 1] as const) {
      const pc = cfg.players[p];
      // shuffle the list first, then create instances, so ids carry no information
      const order = shuffle(s.rng, [...pc.deck]);
      for (const cardId of order) s.players[p].deck.push(newInstance(rt, cardId, p, 'deck').id);
      if (pc.sigil) s.players[p].sigil = newInstance(rt, pc.sigil, p, 'sigil').id;
    }
    s.first = cfg.first ?? (nextInt(s.rng, 2) as PlayerId);
    s.active = s.first;
    for (const p of [0, 1] as const) {
      const ps = s.players[p];
      for (let i = 0; i < rules.openingHand && ps.deck.length > 0; i++) {
        const id = ps.deck.shift() as string;
        const c = s.cards[id];
        if (c) c.zone = 'hand';
        ps.hand.push(id);
      }
    }
    s.pending = { kind: 'mulligan', player: s.first };
    return s;
  }

  function legalActions(s: GameState, player: PlayerId): Action[] {
    return enumerate(rtFor(s), player);
  }

  function applyAction(s: GameState, a: Action): { state: GameState; events: GameEvent[] } {
    if (s.winner !== null) throw new RulesError('The game is over');
    const rt = rtFor(clone(s));
    if (a.type !== 'concede') {
      const key = stableStringify(a);
      const legal = enumerate(rt, a.player);
      if (!legal.some((x) => stableStringify(x) === key)) {
        throw new RulesError(`Illegal action: ${key}`);
      }
    }
    rt.trigCount = 0;
    performAction(rt, a);
    advance(rt);
    return { state: rt.s, events: rt.ev };
  }

  function toAct(s: GameState): PlayerId | null {
    if (s.winner !== null) return null;
    if (s.pending) return s.pending.player;
    if (s.window) return s.window.priority;
    if (s.tasks.length > 0) return null;
    return s.phase === 'main' ? s.active : null;
  }

  function stats(s: GameState, id: InstanceId): UnitStats {
    const st = computeStats(rtFor(s), inst(rtFor(s), id));
    return { power: st.power, guard: st.guard, maxGuard: st.maxGuard, keywords: [...st.keywords] };
  }

  function viewFor(s: GameState, player: PlayerId): GameView {
    return redact(s, player, (id) => stats(s, id));
  }

  return { createGame, legalActions, applyAction, viewFor, eventsFor, hashState, toAct, stats };
}
