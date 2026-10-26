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

import type { TrophyCount } from './trophies';
import type { RankBadge } from './ranks';
import type { Action } from '@sr/combat';

export type Seat = 'a' | 'b';

/** What a player brings to a match: a banked deck and the Riftwalker it belongs to. */
export interface Entry {
  /** shown to the opponent */
  name: string;
  /** a Riftwalker id */
  hero: string;
  deck: string[];
  /** the Boons the deck was saved with (shown with it; an Arena match leaves them out, DECISIONS #236) */
  boons: string[];
  /** the Rift Tier the deck was banked at (the matchmaker pairs similar tiers first) */
  tier: number;
  /** how many of the tier's 3 stages the deck had cleared when it was saved (3 = the whole tier); absent on older decks */
  stage?: number;
  /** a fingerprint of the run the deck came from (see runKey): the Ghost decks list keeps one deck per run, so saving the same run again replaces its ghost */
  run?: string;
  /** who the player is on the leaderboards: a hash derived from their Vault code or account (never shown, never the code itself) */
  who?: string;
  /** the Arena trophies the player holds (set by the server when they join a room; whatever a browser sends is dropped) */
  trophies?: TrophyCount;
  /** the player's Arena rank this season (set by the server, like trophies) */
  rank?: RankBadge;
}

/**
 * The version of the rules a match is played by: raise it whenever a change alters how a match plays out (cards, HP, the engine), so a
 * browser still on the old version is told to reload instead of playing a different game from the server's, and a match saved under
 * the old rules is ended rather than replayed under the new ones (DECISIONS #237).
 */
export const RULES_VERSION = 2;

export type ClientMsg =
  /** to the queue: wait for an opponent */
  | { type: 'queue'; playerId: string; entry: Entry; rules?: number }
  /** to the queue (or instead of waiting in it): face a ghost, a deck that has played in the Arena, with the computer at the controls */
  | { type: 'ghost'; playerId: string; entry: Entry; rules?: number }
  /** to a room: take a seat (a code from a friend, or the room the queue made) */
  | { type: 'join'; playerId: string; entry: Entry; rules?: number }
  | { type: 'action'; seq: number; action: Action }
  /** your answer to "who goes first?": true = I will go first, false = I will go second (and have more HP) */
  | { type: 'order'; first: boolean }
  | { type: 'resign' }
  /** to a room: watch the match in it (no seat; the moves arrive as they are made) */
  | { type: 'watch'; rules?: number };

export type EndReason = 'win' | 'resign' | 'timeout' | 'disconnect';

export type ServerMsg =
  | { type: 'queued'; waiting: number }
  /** the queue found an opponent: open this room and join it */
  | { type: 'matched'; room: string; /** the opponent is a ghost */ ghost?: boolean }
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
      /** the seat you hold (between games the seats swap with the order of play) */
      seat?: Seat;
      /** between games of a best of three: the score, and whether YOU choose (the player who lost the last game does; the other waits) */
      series?: Series;
      chooser?: boolean;
    }
  | {
      type: 'start';
      seat: Seat;
      seed: string;
      a: Entry;
      b: Entry;
      /** the seat the computer plays, when this is a match against a ghost */
      ghost?: Seat;
      /** epoch ms by which the active player must act */
      deadline: number;
      /** how many moves follow at once as history (a player coming back mid-match); 0 for a new match */
      replay: number;
      /** the server's clock (epoch ms) when this was sent, so a browser can show a correct countdown */
      now: number;
      /** how the order was settled: `random` means both wanted the same and the coin chose (seat a is the winner) */
      toss: { random: boolean };
      /** the score of the best of three, and which game this is */
      series?: Series;
      /** you are watching, not playing (the seat is the one the match is seen from) */
      watching?: boolean;
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
  /** a game is over (`series.over` says whether the whole match is) */
  | { type: 'end'; winner: Seat | 'draw'; reason: EndReason; series?: Series }
  /** the game that just ended was kept: it can be watched again by this id (sent a moment after its end) */
  | { type: 'replay'; id: string }
  | { type: 'error'; code: ErrorCode; message: string };

export type ErrorCode =
  | 'bad-message'
  | 'bad-deck'
  | 'room-full'
  | 'not-your-turn'
  | 'illegal'
  | 'out-of-order'
  | 'no-match'
  /** there is no ghost to face yet (no deck has played in the Arena) */
  | 'no-ghost'
  /** this browser plays by older rules than the server (RULES_VERSION): reload the page */
  | 'outdated';

/**
 * Every Arena hero (a player's, or a ghost's) has this many times its usual HP, so a match lasts long enough to play and no deck
 * wins on its first turn (DECISIONS #237: the strongest first turn found is about 60% of the lowest Arena HP; `pnpm arenasim`).
 */
export const ARENA_HP_MULT = 6;
/** The player who goes second starts with this much more HP (and max HP): the old 10, scaled with everyone else's. */
export const SECOND_PLAYER_HP = 10 * ARENA_HP_MULT;
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

/** A match is the best of three games: this many game wins take it. */
export const SERIES_WINS = 2;
/** The most games a match can last. */
export const SERIES_MAX_GAMES = 3;
/** Between games the player who lost chooses who goes first: they have this long (the result is on screen first), ms. */
export const SERIES_CHOOSE_MS = CHOOSE_MS + 10_000;

/** Where a best-of-three stands, as the seats sit in the game just played (or being played). */
export interface Series {
  /** the game now being played, 1 to 3 */
  game: number;
  /** each seat's game wins */
  wins: Record<Seat, number>;
  /** the match is decided: no further game follows */
  over: boolean;
}
