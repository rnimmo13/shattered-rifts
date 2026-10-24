// The browser's side of a PvP match: it talks to the server over WebSockets (queue, room), keeps the match's state in a
// small snapshot for the screen, and feeds the accepted moves to the fight screen through a MoveFeed. No React in here.

import type { Action, CombatSetup, Side } from '@sr/combat';
import { setupFor, type ClientMsg, type Entry, type ServerMsg } from '@sr/pvp';
import { MoveFeed, type PvpLink } from './link';

export type Phase = 'idle' | 'queue' | 'waiting' | 'match' | 'error';

export interface MatchInfo {
  room: string;
  seat: Side;
  names: Record<Side, string>;
  setup: CombatSetup;
  /** how many moves arrived as history when this player (re)joined */
  replay: number;
  deadline: number | null;
  skew: number;
  end: { winner: Side | 'draw'; reason: string } | null;
  feed: MoveFeed;
}

export interface Snapshot {
  phase: Phase;
  /** the room code (a friend code, or the room the queue picked) */
  room: string | null;
  /** players waiting in the queue, including you */
  waiting: number;
  message: string | null;
  match: MatchInfo | null;
}

const IDLE: Snapshot = { phase: 'idle', room: null, waiting: 0, message: null, match: null };

/** Room codes people can read out loud: no 0/O or 1/I. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newRoomCode(len = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => LETTERS[b % LETTERS.length]).join('');
}

export class PvpSession {
  private snap: Snapshot = IDLE;
  private ws: WebSocket | null = null;
  private entry: Entry | null = null;
  private room: string | null = null;
  /** the highest move number given to the screen (a rejoin replays from 1; those already seen are skipped) */
  private lastSeq = 0;
  private retries = 0;
  private closing = false;
  private retryTimer: number | undefined;

  constructor(
    private readonly base: string,
    private readonly playerId: string,
    private readonly onChange: (s: Snapshot) => void,
  ) {}

  get snapshot(): Snapshot {
    return this.snap;
  }

  private set(next: Partial<Snapshot>): void {
    this.snap = { ...this.snap, ...next };
    this.onChange(this.snap);
  }

  private setMatch(patch: Partial<MatchInfo>): void {
    if (this.snap.match) this.set({ match: { ...this.snap.match, ...patch } });
  }

  private open(path: string, onOpen: () => void): void {
    this.closeSocket();
    this.closing = false;
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${this.base}${path}`);
    } catch {
      this.set({ phase: 'error', message: `Could not reach the server (${this.base}).` });
      return;
    }
    this.ws = ws;
    ws.addEventListener('open', () => {
      this.retries = 0;
      onOpen();
    });
    ws.addEventListener('message', (e) => {
      try {
        this.handle(JSON.parse(String(e.data)) as ServerMsg);
      } catch (err) {
        console.warn('[pvp] bad message', err);
      }
    });
    ws.addEventListener('close', () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.lost();
    });
    ws.addEventListener('error', () => {
      /* the close event follows */
    });
  }

  private closeSocket(): void {
    window.clearTimeout(this.retryTimer);
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
    }
  }

  /** The connection dropped: in a room, try to come back (the server keeps the match for a minute); the queue just ends. */
  private lost(): void {
    if (this.closing) return;
    const { phase, match } = this.snap;
    if (phase === 'match' && match?.end) return;
    if (
      (phase === 'match' || phase === 'waiting') &&
      this.room &&
      this.entry &&
      this.retries < 20
    ) {
      this.retries++;
      const room = this.room;
      const entry = this.entry;
      this.retryTimer = window.setTimeout(
        () =>
          this.open(`/pvp/room/${room}`, () =>
            this.send({ type: 'join', playerId: this.playerId, entry }),
          ),
        Math.min(4000, 500 * this.retries),
      );
      return;
    }
    if (phase === 'queue' || phase === 'waiting' || phase === 'match')
      this.set({ ...IDLE, phase: 'error', message: 'The connection to the server was lost.' });
  }

  private send(m: ClientMsg): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  // ---- what the player can do ----------------------------------------------------------------------------------

  /** Wait in the queue for an opponent. */
  queue(entry: Entry): void {
    this.reset();
    this.entry = entry;
    this.set({ phase: 'queue', message: null, waiting: 1 });
    this.open('/pvp/queue', () => this.send({ type: 'queue', playerId: this.playerId, entry }));
  }

  /** Take a seat in a room (a code from a friend, or one you just made). */
  joinRoom(code: string, entry: Entry): void {
    this.reset();
    this.entry = entry;
    this.room = code.toUpperCase();
    this.set({ phase: 'waiting', room: this.room, message: null });
    this.open(`/pvp/room/${this.room}`, () =>
      this.send({ type: 'join', playerId: this.playerId, entry }),
    );
  }

  /** The move sender the fight screen uses. */
  sendMove = (seq: number, action: Action): void => this.send({ type: 'action', seq, action });

  resign(): void {
    this.send({ type: 'resign' });
  }

  /** Leave whatever is going on and go back to the lobby. */
  leave(): void {
    this.reset();
    this.set(IDLE);
  }

  private reset(): void {
    this.closing = true;
    this.closeSocket();
    this.lastSeq = 0;
    this.retries = 0;
    this.room = null;
    this.snap = IDLE;
  }

  // ---- what the server says ------------------------------------------------------------------------------------

  private handle(m: ServerMsg): void {
    switch (m.type) {
      case 'queued':
        this.set({ waiting: m.waiting });
        return;
      case 'matched':
        // the queue found someone: leave it and take a seat in the room it opened
        if (this.entry) this.joinRoom(m.room, this.entry);
        return;
      case 'waiting':
        this.set({ phase: 'waiting', room: m.room });
        return;
      case 'start': {
        const skew = m.now - Date.now();
        if (this.snap.match) {
          // a reconnection: the same match; moves already seen are skipped
          this.setMatch({ deadline: m.deadline, skew });
          return;
        }
        const feed = new MoveFeed();
        this.set({
          phase: 'match',
          message: null,
          match: {
            room: this.room ?? '',
            seat: m.seat,
            names: { a: m.a.name, b: m.b.name },
            setup: setupFor(m.seed, m.a, m.b),
            replay: m.replay,
            deadline: m.deadline,
            skew,
            end: null,
            feed,
          },
        });
        return;
      }
      case 'action': {
        const match = this.snap.match;
        if (!match || m.seq <= this.lastSeq) return;
        this.lastSeq = m.seq;
        match.feed.push({
          kind: 'move',
          move: { seq: m.seq, seat: m.seat, action: m.action, hash: m.hash, deadline: m.deadline },
          history: m.seq <= match.replay,
        });
        if (m.seq > match.replay) this.setMatch({ deadline: m.deadline, skew: m.now - Date.now() });
        return;
      }
      case 'end':
        this.setMatch({ end: { winner: m.winner, reason: m.reason } });
        return;
      case 'error':
        if (m.code === 'bad-deck' || m.code === 'room-full' || m.code === 'bad-message') {
          this.reset();
          this.set({ ...IDLE, phase: 'error', message: m.message });
        } else this.snap.match?.feed.push({ kind: 'refused', message: m.message });
        return;
    }
  }

  /** The link the fight screen is given. */
  link(): PvpLink | null {
    const m = this.snap.match;
    if (!m) return null;
    return {
      seat: m.seat,
      names: m.names,
      feed: m.feed,
      send: this.sendMove,
      replay: m.replay,
      deadline: m.end ? null : m.deadline,
      skew: m.skew,
      end: m.end,
    };
  }
}
