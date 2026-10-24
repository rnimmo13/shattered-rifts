// A match room: one Durable Object per room code. It holds the match (the real engine, via @sr/pvp's Match), checks every
// move, tells both players the accepted moves, and runs the turn clock. What it remembers (the two decks, the seed and
// the list of moves) is saved after every move, so the room survives being put to sleep and a player who reconnects is
// brought up to date by replaying the moves.

import { DurableObject } from 'cloudflare:workers';
import type { Action } from '@sr/combat';
import {
  checkEntry,
  Match,
  other,
  RECONNECT_MS,
  type Accepted,
  type Entry,
  type Outcome,
  type Seat,
  type ServerMsg,
} from '@sr/pvp';
import type { Env } from './env';
import { parse, send } from './wire';

/** A room nobody joins, or whose result nobody collects, is cleared after this long. */
const IDLE_MS = 15 * 60_000;
const LINGER_MS = 5 * 60_000;

interface Saved {
  created: number;
  /** who sits where, by their own random id (seats are only fixed when the second player joins) */
  ids: Partial<Record<Seat, string>>;
  entries: Partial<Record<Seat, Entry>>;
  started: boolean;
  seed: string;
  log: { seat: Seat; action: Action }[];
  deadline: number;
  over: Outcome | null;
  /** when each seat's last connection dropped (ms), if it is away */
  away: Partial<Record<Seat, number>>;
}

interface Attach {
  playerId: string;
  seat: Seat | null;
}

const fresh = (): Saved => ({
  created: Date.now(),
  ids: {},
  entries: {},
  started: false,
  seed: '',
  log: [],
  deadline: 0,
  over: null,
  away: {},
});

export class MatchRoom extends DurableObject<Env> {
  private data: Saved = fresh();
  private match: Match | null = null;
  private code = '';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      const saved = await ctx.storage.get<Saved>('room');
      if (saved) {
        this.data = saved;
        this.rebuild();
      }
    });
  }

  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected a WebSocket.', { status: 426 });
    this.code = new URL(request.url).pathname.split('/').pop() ?? '';
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Replay the saved moves to get the match back. */
  private rebuild(): void {
    const d = this.data;
    const a = d.entries.a;
    const b = d.entries.b;
    if (!d.started || !a || !b) return;
    const m = new Match(d.seed, a, b, Date.now());
    for (const { seat, action } of d.log) m.submit(seat, m.log.length + 1, action, Date.now());
    m.deadline = d.deadline;
    this.match = m;
  }

  private async save(): Promise<void> {
    await this.ctx.storage.put('room', this.data);
    await this.reschedule();
  }

  private sockets(seat?: Seat): { ws: WebSocket; at: Attach }[] {
    return this.ctx.getWebSockets().flatMap((ws) => {
      const at = ws.deserializeAttachment() as Attach | null;
      return at && (seat === undefined || at.seat === seat) ? [{ ws, at }] : [];
    });
  }

  private broadcast(msg: ServerMsg): void {
    for (const { ws } of this.sockets()) send(ws, msg);
  }

  /** The next moment something must happen (a turn running out, a player's time to come back, an idle room). */
  private async reschedule(): Promise<void> {
    const d = this.data;
    let at: number;
    if (d.over) at = Date.now() + LINGER_MS;
    else if (!d.started) at = d.created + IDLE_MS;
    else {
      at = d.deadline;
      for (const t of Object.values(d.away)) at = Math.min(at, t + RECONNECT_MS);
    }
    await this.ctx.storage.setAlarm(Math.max(Date.now() + 250, at));
  }

  private startMessage(seat: Seat): ServerMsg | null {
    const d = this.data;
    const a = d.entries.a;
    const b = d.entries.b;
    if (!d.started || !a || !b) return null;
    return { type: 'start', seat, seed: d.seed, a, b, deadline: d.deadline, replay: d.log.length, now: Date.now() };
  }

  private actionMessage(i: number, m: Accepted | null): ServerMsg {
    const e = this.data.log[i] as Saved['log'][number];
    // (a replayed move carries no hash: the player rebuilding it checks the last one against the room)
    return {
      type: 'action',
      seq: i + 1,
      seat: e.seat,
      action: e.action,
      hash: m?.hash ?? '',
      deadline: this.data.deadline,
      now: Date.now(),
    };
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const msg = parse(message);
    if (!msg) {
      send(ws, { type: 'error', code: 'bad-message', message: 'That message was not understood.' });
      return;
    }
    const at = ws.deserializeAttachment() as Attach | null;
    const d = this.data;

    if (msg.type === 'join') {
      if (at) return; // already seated on this socket
      const checked = checkEntry(msg.entry);
      if (!checked.ok) {
        send(ws, { type: 'error', code: 'bad-deck', message: checked.message });
        ws.close(1008, 'bad deck');
        return;
      }
      // a player already in the room is coming back
      const seat = (['a', 'b'] as const).find((s) => d.ids[s] === msg.playerId) ?? null;
      if (seat) {
        ws.serializeAttachment({ playerId: msg.playerId, seat } satisfies Attach);
        delete d.away[seat];
        await this.save();
        this.welcome(ws, seat);
        return;
      }
      if (d.started || (d.ids.a && d.ids.b) || d.over) {
        send(ws, { type: 'error', code: 'room-full', message: 'That room is full.' });
        ws.close(1008, 'full');
        return;
      }
      if (!d.ids.a) {
        d.ids.a = msg.playerId;
        d.entries.a = checked.entry;
        ws.serializeAttachment({ playerId: msg.playerId, seat: 'a' } satisfies Attach);
        await this.save();
        send(ws, { type: 'waiting', room: this.code });
        return;
      }
      // the second player: the seats are drawn by lot, then the match begins
      const first = d.entries.a as Entry;
      const firstId = d.ids.a;
      const flip = (crypto.getRandomValues(new Uint8Array(1))[0] ?? 0) % 2 === 1;
      d.ids = flip ? { a: msg.playerId, b: firstId } : { a: firstId, b: msg.playerId };
      d.entries = flip ? { a: checked.entry, b: first } : { a: first, b: checked.entry };
      d.started = true;
      d.seed = crypto.randomUUID();
      this.match = new Match(d.seed, d.entries.a as Entry, d.entries.b as Entry, Date.now());
      d.deadline = this.match.deadline;
      for (const s of this.sockets()) {
        const seatOf = d.ids.a === s.at.playerId ? 'a' : 'b';
        s.ws.serializeAttachment({ playerId: s.at.playerId, seat: seatOf } satisfies Attach);
      }
      ws.serializeAttachment({
        playerId: msg.playerId,
        seat: d.ids.a === msg.playerId ? 'a' : 'b',
      } satisfies Attach);
      await this.save();
      for (const s of this.sockets()) {
        const m = this.startMessage(s.at.seat as Seat);
        if (m) send(s.ws, m);
      }
      return;
    }

    if (!at || !at.seat) {
      send(ws, { type: 'error', code: 'bad-message', message: 'Join the room first.' });
      return;
    }
    const seat = at.seat;
    const match = this.match;
    if (!match || !d.started) {
      send(ws, { type: 'error', code: 'no-match', message: 'The match has not started.' });
      return;
    }

    if (msg.type === 'resign') {
      if (!d.over) await this.finish(match.end(other(seat), 'resign'));
      return;
    }

    if (msg.type === 'action') {
      const r = match.submit(seat, msg.seq, msg.action, Date.now());
      if (!r.ok) {
        send(ws, { type: 'error', code: r.code, message: r.message });
        return;
      }
      d.log.push({ seat, action: msg.action });
      d.deadline = r.deadline;
      this.broadcast({
        type: 'action',
        seq: r.seq,
        seat,
        action: msg.action,
        hash: r.hash,
        deadline: r.deadline,
        now: Date.now(),
      });
      if (r.outcome) await this.finish(r.outcome);
      else await this.save();
    }
  }

  /** Bring a (re)connecting player up to date: the start, then every move so far. */
  private welcome(ws: WebSocket, seat: Seat): void {
    const d = this.data;
    if (!d.started) {
      send(ws, { type: 'waiting', room: this.code });
      return;
    }
    const start = this.startMessage(seat);
    if (start) send(ws, start);
    for (let i = 0; i < d.log.length; i++) send(ws, this.actionMessage(i, null));
    if (d.over) send(ws, { type: 'end', winner: d.over.winner, reason: d.over.reason });
  }

  private async finish(outcome: Outcome): Promise<void> {
    this.data.over = outcome;
    await this.save();
    this.broadcast({ type: 'end', winner: outcome.winner, reason: outcome.reason });
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    const at = ws.deserializeAttachment() as Attach | null;
    try {
      ws.close(1000, 'bye');
    } catch {
      /* already closed */
    }
    if (!at?.seat || this.data.over || !this.data.started) return;
    // away only if they have no other connection (a second tab)
    const stillThere = this.sockets(at.seat).some((s) => s.ws !== ws);
    if (!stillThere) {
      this.data.away[at.seat] = Date.now();
      await this.save();
    }
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  override async alarm(): Promise<void> {
    const d = this.data;
    const now = Date.now();
    if (d.over || !d.started) {
      // nothing more will happen here: clear the room
      for (const { ws } of this.sockets()) ws.close(1000, 'room closed');
      await this.ctx.storage.deleteAll();
      this.data = fresh();
      this.match = null;
      return;
    }
    const match = this.match;
    if (!match) return;
    // a player who has been gone too long forfeits (both gone: nobody wins)
    const gone = (['a', 'b'] as const).filter((s) => {
      const t = d.away[s];
      return t !== undefined && now - t >= RECONNECT_MS;
    });
    if (gone.length > 0) {
      const outcome =
        gone.length === 2
          ? match.end('draw', 'disconnect')
          : match.end(other(gone[0] as Seat), 'disconnect');
      await this.finish(outcome);
      return;
    }
    if (now >= d.deadline) {
      const t = match.timeout(now);
      for (const m of t.moves) {
        d.log.push({ seat: m.seat, action: m.action });
        d.deadline = m.deadline;
        this.broadcast({
          type: 'action',
          seq: m.seq,
          seat: m.seat,
          action: m.action,
          hash: m.hash,
          deadline: m.deadline,
          now: Date.now(),
        });
      }
      d.deadline = match.deadline;
      if (t.outcome) {
        await this.finish(t.outcome);
        return;
      }
    }
    await this.save();
  }
}
