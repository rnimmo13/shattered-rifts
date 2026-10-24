// The messages between a player's browser and the PvP server (JSON over a WebSocket). Both sides import these types.
//
// How a match works: both browsers run the real combat engine from the same seed and the same two decks. A player only
// ever sends "my action"; the server checks that it is their turn and a legal move (by running the engine too), then tells
// BOTH browsers the accepted action and a hash of the resulting state. Because the engine is deterministic, the browsers
// stay in step, and a hash that ever differs means a desync (reported, never ignored).
//
// Known limit of this first version: each browser holds the whole game state, so a modified client could look at the
// opponent's hand. The server still decides every move, so nobody can cheat the rules, only peek. Hiding information
// (the server sends each player only their own view) is a later step.

import type { Action } from '@sr/combat';

export type Seat = 'a' | 'b';

/** What a player brings to a match: a banked deck and the Riftwalker it belongs to. */
export interface Entry {
  /** shown to the opponent */
  name: string;
  /** a Riftwalker id */
  hero: string;
  deck: string[];
  /** the Boons the deck was saved with: they are in effect for the whole match */
  boons: string[];
  /** the Rift Tier the deck was banked at (the matchmaker pairs similar tiers first) */
  tier: number;
}

export type ClientMsg =
  /** to the queue: wait for an opponent */
  | { type: 'queue'; playerId: string; entry: Entry }
  /** to a room: take a seat (a code from a friend, or the room the queue made) */
  | { type: 'join'; playerId: string; entry: Entry }
  | { type: 'action'; seq: number; action: Action }
  /** your answer to "who goes first?": true = I will go first, false = I will go second (and have more HP) */
  | { type: 'order'; first: boolean }
  | { type: 'resign' };

export type EndReason = 'win' | 'resign' | 'timeout' | 'disconnect';

export type ServerMsg =
  | { type: 'queued'; waiting: number }
  /** the queue found an opponent: open this room and join it */
  | { type: 'matched'; room: string }
  /** in a room, waiting for the second player (a friend code is this room's name) */
  | { type: 'waiting'; room: string }
  /** both players are in: each is asked who should go first (see order.ts) */
  | {
      type: 'choose';
      /** you, and who you are playing */
      me: Entry;
      foe: Entry;
      /** epoch ms by which to answer (no answer means the coin decides) */
      deadline: number;
      now: number;
      /** true when you have already answered (you came back to the screen) */
      chosen: boolean;
    }
  | {
      type: 'start';
      seat: Seat;
      seed: string;
      a: Entry;
      b: Entry;
      /** epoch ms by which the active player must act */
      deadline: number;
      /** how many moves follow at once as history (a player coming back mid-match); 0 for a new match */
      replay: number;
      /** the server's clock (epoch ms) when this was sent, so a browser can show a correct countdown */
      now: number;
      /** how the order was settled: `random` means both wanted the same and the coin chose (seat a is the winner) */
      toss: { random: boolean };
    }
  | {
      type: 'action';
      /** 1, 2, 3 ... in the order the server accepted them */
      seq: number;
      seat: Seat;
      action: Action;
      /** a fingerprint of the state after the action (hashState), to catch a desync */
      hash: string;
      deadline: number;
      now: number;
    }
  | { type: 'end'; winner: Seat | 'draw'; reason: EndReason }
  | { type: 'error'; code: ErrorCode; message: string };

export type ErrorCode =
  | 'bad-message'
  | 'bad-deck'
  | 'room-full'
  | 'not-your-turn'
  | 'illegal'
  | 'out-of-order'
  | 'no-match';

/** The player who goes second starts with this much more HP (and max HP). */
export const SECOND_PLAYER_HP = 10;
/** How long each player has to say whether they want to go first, ms. */
export const CHOOSE_MS = 20_000;
/** How long the active player has for a turn, ms. */
export const TURN_MS = 75_000;
/** How long a disconnected player has to come back before forfeiting, ms. */
export const RECONNECT_MS = 60_000;
/** Turns missed in a row (timed out) that forfeit the match. */
export const MAX_MISSED_TURNS = 2;
/** After this long in the queue a player is paired with anyone, whatever their Rift Tier, ms. */
export const QUEUE_WIDEN_MS = 20_000;
/** Tiers further apart than this are not paired until the wait widens. */
export const QUEUE_TIER_GAP = 1;
