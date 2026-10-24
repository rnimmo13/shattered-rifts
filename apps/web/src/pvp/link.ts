// What the fight screen needs from a PvP match, and nothing else: whose seat it is, how to send a move, and a feed of the
// moves the server accepted (the opponent's, and mine echoed back). The screen never talks to the network itself.

import type { Action, Side } from '@sr/combat';

/** A move the server accepted, in the server's order. */
export interface Move {
  seq: number;
  seat: Side;
  action: Action;
  /** the server's fingerprint of the state after the move ('' for history replayed to a returning player) */
  hash: string;
  deadline: number;
}

export type FeedItem =
  | { kind: 'move'; move: Move; /** history is applied silently (no animation) */ history: boolean }
  | { kind: 'refused'; message: string };

/**
 * A one-reader queue: items pushed before the screen has mounted wait, and are delivered in order once it attaches.
 */
export class MoveFeed {
  private buffer: FeedItem[] = [];
  private reader: ((item: FeedItem) => void) | null = null;

  push(item: FeedItem): void {
    if (this.reader) this.reader(item);
    else this.buffer.push(item);
  }

  /** Start reading (everything waiting is delivered first); the returned function stops. */
  attach(reader: (item: FeedItem) => void): () => void {
    this.reader = reader;
    for (const item of this.buffer.splice(0)) reader(item);
    return () => {
      if (this.reader === reader) this.reader = null;
    };
  }
}

export interface PvpLink {
  /** the seat you sit in */
  seat: Side;
  names: Record<Side, string>;
  feed: MoveFeed;
  /** ask the server to make this move (`seq` is the number you expect it to get) */
  send: (seq: number, action: Action) => void;
  /** how many moves arrive at once as history (you came back to a match in progress); 0 for a new one */
  replay: number;
  /** epoch ms (server clock) by which whoever is to move must move; null before it is known */
  deadline: number | null;
  /** add this to the local clock to get the server's */
  skew: number;
  /** set when the match is over */
  end: { winner: Side | 'draw'; reason: string } | null;
}
