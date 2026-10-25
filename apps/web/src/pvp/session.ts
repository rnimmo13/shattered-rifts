// The browser's side of a PvP match: it talks to the server over WebSockets (queue, room), keeps the match's state in a
// small snapshot for the screen, and feeds the accepted moves to the fight screen through a MoveFeed. No React in here.

import type { Action, CombatSetup, Side } from '@sr/combat';
import { setupFor, type ClientMsg, type Entry, type ServerMsg } from '@sr/pvp';
import { MoveFeed, type PvpLink } from './link';

const progressOf = (e: Entry): { tier: number; stage?: number } =>
  e.stage === undefined ? { tier: e.tier } : { tier: e.tier, stage: e.stage };

export type Phase = 'idle' | 'queue' | 'waiting' | 'choose' | 'match' | 'error';

/** The question "who goes first?" while it is open. */
export interface ChooseInfo {
  me: Entry;
  foe: Entry;
  deadline: number;
  skew: number;
  /** you have answered and are waiting for the other player */
  chosen: boolean;
}

export interface MatchInfo {
  room: string;
  seat: Side;
  names: Record<Side, string>;
  /** the Riftwalker each seat plays */
  heroes: Record<Side, string>;
  /** where each player is in the campaign, as their deck was saved */
  progress: Record<Side, { tier: number; stage?: number }>;
  setup: CombatSetup;
  /** how many moves arrived as history when this player (re)joined */
  replay: number;
  deadline: number | null;
  skew: number;
  end: { winner: Side | 'draw'; reason: string } | null;
  /** how the order was settled, for a match that has just begun (null when you come back to one in progress) */
  toss: { random: boolean } | null;
  /** the seat the computer plays, when the opponent is a ghost */
  ghost: Side | null;
  feed: MoveFeed;
}

export interface Snapshot {
  phase: Phase;
  /** the room code (a friend code, or the room the queue picked) */
  room: string | null;
  /** players waiting in the queue, including you */
  waiting: number;
  /** a ghost has been asked for (the queue is not being waited in for a person) */
  ghosting: boolean;
  message: string | null;
  choose: ChooseInfo | null;
  match: MatchInfo | null;
}

const IDLE: Snapshot = {
  phase: 'idle',
  room: null,
  waiting: 0,
  ghosting: false,
  message: null,
  choose: null,
  match: null,
};

/** Room codes people can read out loud: no 0/O or 1/I. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newRoomCode(len = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => LETTERS[b % LETTERS.length]).join('');
}

const ROOM_KEY = 'sr-pvp-room';

/** The room this tab is in, remembered so that reloading the page puts the player back in their match. */
function remember(v: { room: string; entry: Entry }): void {
  try {
    sessionStorage.setItem(ROOM_KEY, JSON.stringify(v));
  } catch {
    /* not remembered */
  }
}
function forget(): void {
  try {
    sessionStorage.removeItem(ROOM_KEY);
  } catch {
    /* nothing to forget */
  }
}
/** The room a reload should return to, if any. */
export function savedRoom(): { room: string; entry: Entry } | null {
  try {
    const raw = sessionStorage.getItem(ROOM_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { room?: unknown; entry?: unknown };
    return typeof v.room === 'string' && typeof v.entry === 'object' && v.entry !== null
      ? { room: v.room, entry: v.entry as Entry }
      : null;
  } catch {
    return null;
  }
}

export class PvpSession {
  private snap: Snapshot = IDLE;
  private ws: WebSocket | null = null;
  private entry: Entry | null = null;
  /** this session has put the player in the queue for a person (as opposed to asking only for a ghost) */
  private queuedForPerson = false;
  private room: string | null = null;
  /** the highest move number given to the screen (a rejoin replays from 1; those already seen are skipped) */
  private lastSeq = 0;
  private retries = 0;
  private closing = false;
  private retryTimer: number | undefined;
  private pingTimer: number | undefined;
  private waitTimer: number | undefined;
  /** the last time the server said anything (a pong counts), to notice a connection that died without closing */
  private lastHeard = 0;

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
      this.lastHeard = Date.now();
      // a ping every 15 s keeps the server's idea of us fresh, and a silence of 45 s means the line is dead: close it, which
      // starts the usual reconnection
      window.clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => {
        if (this.ws !== ws) return;
        if (Date.now() - this.lastHeard > 45_000) ws.close();
        else if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 15_000);
      onOpen();
    });
    ws.addEventListener('message', (e) => {
      if (this.ws !== ws) return; // a late message from a socket we have already let go
      this.lastHeard = Date.now();
      if (e.data === 'pong') return;
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
    window.clearInterval(this.pingTimer);
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

  /** False when there is no open connection (nothing was sent). */
  private send(m: ClientMsg): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(m));
    return true;
  }

  // ---- what the player can do ----------------------------------------------------------------------------------

  /** Wait in the queue for an opponent. */
  queue(entry: Entry): void {
    this.reset();
    this.entry = entry;
    this.queuedForPerson = true;
    this.set({ phase: 'queue', ghosting: false, message: null, waiting: 1 });
    this.open('/pvp/queue', () => this.send({ type: 'queue', playerId: this.playerId, entry }));
  }

  /**
   * Face a ghost: a deck another player has used in the Arena, with the computer at the controls. If this player is waiting in the
   * queue the request goes on that same connection (and they leave the queue); otherwise a connection is made just for it.
   */
  ghost(entry: Entry): void {
    this.entry = entry;
    if (this.snap.phase === 'queue' && this.ws?.readyState === WebSocket.OPEN) {
      this.set({ ghosting: true, message: null });
      this.send({ type: 'ghost', playerId: this.playerId, entry });
      return;
    }
    this.reset();
    this.entry = entry;
    this.set({ phase: 'queue', ghosting: true, message: null, waiting: 1 });
    this.open('/pvp/queue', () => this.send({ type: 'ghost', playerId: this.playerId, entry }));
  }

  /** Take a seat in a room (a code from a friend, or one you just made). */
  joinRoom(code: string, entry: Entry, fromQueue = false): void {
    this.reset();
    this.entry = entry;
    this.room = code.toUpperCase();
    remember({ room: this.room, entry });
    this.set({ phase: 'waiting', room: this.room, message: null });
    // a room the queue opened is for someone who may never arrive: after a while, go back to looking
    if (fromQueue)
      this.waitTimer = window.setTimeout(() => {
        if (this.snap.phase === 'waiting') {
          this.queue(entry);
          this.set({ message: 'Your opponent did not arrive. Looking for another…' });
        }
      }, 45_000);
    this.open(`/pvp/room/${this.room}`, () =>
      this.send({ type: 'join', playerId: this.playerId, entry }),
    );
  }

  /** Answer "who goes first?" */
  chooseOrder(first: boolean): void {
    if (this.send({ type: 'order', first }) && this.snap.choose)
      this.set({ choose: { ...this.snap.choose, chosen: true } });
  }

  /** The move sender the fight screen uses. */
  sendMove = (seq: number, action: Action): boolean => this.send({ type: 'action', seq, action });

  resign(): void {
    this.send({ type: 'resign' });
  }

  /** Drop the connection but remember the room: used when the page is left, so coming back (or reloading) rejoins. */
  close(): void {
    this.closing = true;
    window.clearTimeout(this.waitTimer);
    this.closeSocket();
  }

  /** Leave whatever is going on and go back to the lobby. */
  leave(): void {
    this.reset();
    this.set(IDLE);
  }

  private reset(): void {
    this.closing = true;
    window.clearTimeout(this.waitTimer);
    forget();
    this.entry = null;
    this.queuedForPerson = false;
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
        // the queue found someone (or a ghost): leave it and take a seat in the room it opened
        if (this.entry) this.joinRoom(m.room, this.entry, m.ghost !== true);
        return;
      case 'waiting':
        this.set({ phase: 'waiting', room: m.room, choose: null });
        return;
      case 'choose':
        this.set({
          phase: 'choose',
          choose: {
            me: m.me,
            foe: m.foe,
            deadline: m.deadline,
            skew: m.now - Date.now(),
            chosen: m.chosen,
          },
        });
        return;
      case 'start': {
        const skew = m.now - Date.now();
        window.clearTimeout(this.waitTimer);
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
            heroes: { a: m.a.hero, b: m.b.hero },
            progress: { a: progressOf(m.a), b: progressOf(m.b) },
            setup: setupFor(m.seed, m.a, m.b),
            replay: m.replay,
            deadline: m.deadline,
            skew,
            end: null,
            toss: m.replay === 0 ? m.toss : null,
            ghost: m.ghost ?? null,
            feed,
          },
          choose: null,
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
        if (m.code === 'no-ghost') {
          // still in the queue if they were waiting for a person; if they asked only for a ghost there is nothing to wait for
          if (this.queuedForPerson) this.set({ ghosting: false, message: m.message });
          else {
            this.reset();
            this.set({ ...IDLE, phase: 'error', message: m.message });
          }
          return;
        }
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
      progress: m.progress,
      feed: m.feed,
      send: this.sendMove,
      replay: m.replay,
      deadline: m.end ? null : m.deadline,
      skew: m.skew,
      end: m.end,
    };
  }
}
