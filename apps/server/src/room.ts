// A match room: one Durable Object per room code. It holds the match (the real engine, via @sr/pvp's Match), checks every
// move, tells both players the accepted moves, and runs the turn clock. What it remembers (the two decks, the seed and
// the list of moves) is saved after every move, so the room survives being put to sleep and a player who reconnects is
// brought up to date by replaying the moves.

import { DurableObject } from 'cloudflare:workers';
import type { Action } from '@sr/combat';
import {
  CHOOSE_MS,
  checkEntry,
  decideOrder,
  Match,
  other,
  RECONNECT_MS,
  seatsFor,
  type Accepted,
  type Entry,
  type Outcome,
  type Seat,
  type ServerMsg,
} from '@sr/pvp';
import type { Env } from './env';
import { cleanAction, parse, send } from './wire';

/** A room nobody joins, or whose result nobody collects, is cleared after this long. */
const IDLE_MS = 15 * 60_000;
const LINGER_MS = 5 * 60_000;
/** A browser pings every 20 s; one silent for this long is treated as gone, and how often we look. */
const QUIET_MS = 60_000;
const HEARTBEAT_CHECK_MS = 30_000;

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
  /** turns each seat has let run out in a row */
  missed: Record<Seat, number>;
  /** both players are in and being asked who goes first (seats a and b are the order they arrived in until it is settled) */
  choosing: boolean;
  choices: Partial<Record<Seat, boolean>>;
  chooseBy: number;
  /** how the order was settled */
  toss: { random: boolean };
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
  missed: { a: 0, b: 0 },
  choosing: false,
  choices: {},
  chooseBy: 0,
  toss: { random: false },
});

export class MatchRoom extends DurableObject<Env> {
  private data: Saved = fresh();
  private match: Match | null = null;
  private code = '';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // a browser sends 'ping' now and then; the answer is made without waking the object, and its time tells us who has gone quiet
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
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
    try {
      const m = new Match(d.seed, a, b, Date.now());
      for (const { seat, action } of d.log) {
        const r = m.submit(seat, m.log.length + 1, action, Date.now());
        if (!r.ok) throw new Error(`replay refused move ${m.log.length + 1}: ${r.message}`);
      }
      m.deadline = d.deadline;
      // what the moves alone cannot tell: whether it was already over, and how many turns each seat has missed
      m.restore(d.over, d.missed);
      this.match = m;
    } catch (err) {
      // (a card changed in a new version, say) the match cannot be rebuilt: end it rather than leave the room stuck
      console.error('[room] cannot rebuild the match', err);
      d.over ??= { winner: 'draw', reason: 'disconnect' };
      this.match = null;
    }
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
    else if (d.choosing) at = d.chooseBy;
    else if (!d.started) at = d.created + IDLE_MS;
    else {
      at = d.deadline;
      for (const t of Object.values(d.away)) at = Math.min(at, t + RECONNECT_MS);
      // look for players who have gone quiet (a closed laptop sends no goodbye) at least this often
      at = Math.min(at, Date.now() + HEARTBEAT_CHECK_MS);
    }
    await this.ctx.storage.setAlarm(Math.max(Date.now() + 250, at));
  }

  private startMessage(seat: Seat): ServerMsg | null {
    const d = this.data;
    const a = d.entries.a;
    const b = d.entries.b;
    if (!d.started || !a || !b) return null;
    return {
      type: 'start',
      seat,
      seed: d.seed,
      a,
      b,
      deadline: d.deadline,
      replay: d.log.length,
      now: Date.now(),
      toss: d.toss,
    };
  }

  /** Ask one player whether they want to go first. */
  private askOrder(ws: WebSocket, seat: Seat): void {
    const d = this.data;
    const me = d.entries[seat];
    const foe = d.entries[other(seat)];
    if (!me || !foe) return;
    send(ws, {
      type: 'choose',
      me,
      foe,
      deadline: d.chooseBy,
      now: Date.now(),
      chosen: d.choices[seat] !== undefined,
    });
  }

  /** The answers are in (or time ran out): settle who goes first, seat everyone and start the match. */
  private async begin(): Promise<void> {
    const d = this.data;
    const coin = (crypto.getRandomValues(new Uint8Array(1))[0] ?? 0) % 2 === 0 ? 'a' : 'b';
    const order = decideOrder(d.choices, coin);
    const seats = seatsFor(order.first);
    const ids: Partial<Record<Seat, string>> = {};
    const entries: Partial<Record<Seat, Entry>> = {};
    for (const arrival of ['a', 'b'] as const) {
      const id = d.ids[arrival];
      const entry = d.entries[arrival];
      if (id && entry) {
        ids[seats[arrival]] = id;
        entries[seats[arrival]] = entry;
      }
    }
    d.ids = ids;
    d.entries = entries;
    d.choosing = false;
    d.choices = {};
    d.started = true;
    d.toss = { random: order.random };
    d.seed = crypto.randomUUID();
    this.match = new Match(d.seed, entries.a as Entry, entries.b as Entry, Date.now());
    d.deadline = this.match.deadline;
    d.missed = { a: 0, b: 0 };
    for (const s of this.sockets()) {
      const seatOf: Seat = d.ids.a === s.at.playerId ? 'a' : 'b';
      s.ws.serializeAttachment({ playerId: s.at.playerId, seat: seatOf } satisfies Attach);
    }
    // a seat nobody is connected to is away from the start
    for (const seatOf of ['a', 'b'] as const)
      if (this.sockets(seatOf).length === 0) d.away[seatOf] = Date.now();
    await this.save();
    for (const s of this.sockets()) {
      const m = this.startMessage(s.at.seat as Seat);
      if (m) send(s.ws, m);
    }
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
      // a free place (a and b are the order of arrival; the real seats are settled once both have answered)
      const free = !d.ids.a ? 'a' : !d.ids.b ? 'b' : null;
      if (d.started || d.over || !free) {
        send(ws, { type: 'error', code: 'room-full', message: 'That room is full.' });
        ws.close(1008, 'full');
        return;
      }
      d.ids[free] = msg.playerId;
      d.entries[free] = checked.entry;
      ws.serializeAttachment({ playerId: msg.playerId, seat: free } satisfies Attach);
      if (!(d.ids.a && d.ids.b)) {
        await this.save();
        send(ws, { type: 'waiting', room: this.code });
        return;
      }
      // both are here: each is asked whether to go first
      d.choosing = true;
      d.choices = {};
      d.chooseBy = Date.now() + CHOOSE_MS;
      await this.save();
      for (const s of this.sockets()) this.askOrder(s.ws, s.at.seat as Seat);
      return;
    }

    if (!at || !at.seat) {
      send(ws, { type: 'error', code: 'bad-message', message: 'Join the room first.' });
      return;
    }
    const seat = at.seat;
    if (msg.type === 'order') {
      if (!d.choosing) {
        send(ws, { type: 'error', code: 'no-match', message: 'Nobody is choosing the order now.' });
        return;
      }
      d.choices[seat] = msg.first;
      await this.save();
      if (d.choices.a !== undefined && d.choices.b !== undefined) await this.begin();
      return;
    }
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
      // nothing is accepted once a match is over, whatever the moves say
      if (d.over) {
        send(ws, { type: 'error', code: 'no-match', message: 'The match is over.' });
        return;
      }
      const action = cleanAction(msg.action);
      const r = match.submit(seat, msg.seq, action, Date.now());
      if (!r.ok) {
        send(ws, { type: 'error', code: r.code, message: r.message });
        return;
      }
      d.log.push({ seat, action });
      d.deadline = r.deadline;
      d.missed = { ...match.missed };
      this.broadcast({
        type: 'action',
        seq: r.seq,
        seat,
        action,
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
    if (d.choosing) {
      this.askOrder(ws, seat);
      return;
    }
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

  override async webSocketClose(ws: WebSocket, _code = 1000): Promise<void> {
    const at = ws.deserializeAttachment() as Attach | null;
    try {
      ws.close(1000, 'bye');
    } catch {
      /* already closed */
    }
    if (!at?.seat || this.data.over) return;
    // gone only if they have no other connection (a second tab)
    ws.serializeAttachment(null);
    const stillThere = this.sockets(at.seat).length > 0;
    if (stillThere) return;
    if (!this.data.started) {
      // a player who leaves before the match starts gives up their seat, so nobody is matched with an empty chair
      delete this.data.ids[at.seat];
      delete this.data.entries[at.seat];
      if (this.data.choosing) {
        // the other player goes back to waiting for someone
        this.data.choosing = false;
        this.data.choices = {};
        for (const rest of this.sockets()) send(rest.ws, { type: 'waiting', room: this.code });
      }
    } else this.data.away[at.seat] = Date.now();
    await this.save();
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  override async alarm(): Promise<void> {
    const d = this.data;
    const now = Date.now();
    if (d.choosing) {
      // time to answer ran out: whoever did not answer leaves it to the coin
      if (now >= d.chooseBy) await this.begin();
      else await this.save();
      return;
    }
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
    // a player whose connection went quiet without closing (a closed laptop, a dead network) is as good as gone
    for (const { ws, at } of this.sockets()) {
      const last = this.ctx.getWebSocketAutoResponseTimestamp(ws);
      if (last && now - last.getTime() > QUIET_MS) await this.webSocketClose(ws, 1001);
      void at;
    }
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
      d.missed = { ...match.missed };
      if (t.outcome) {
        await this.finish(t.outcome);
        return;
      }
    }
    await this.save();
  }
}
