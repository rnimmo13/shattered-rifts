// A match room: one Durable Object per room code. It holds the match (the real engine, via @sr/pvp's Match), checks every
// move, tells both players the accepted moves, and runs the turn clock. What it remembers (the two decks, the seed and
// the list of moves) is saved after every move, so the room survives being put to sleep and a player who reconnects is
// brought up to date by replaying the moves.

import { DurableObject } from 'cloudflare:workers';
import { chooseSmartAction, type Action } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import {
  CHOOSE_MS,
  checkEntry,
  checkArenaEntry,
  decideOrder,
  Match,
  newSeries,
  other,
  RECONNECT_MS,
  GAME_MS,
  RULES_VERSION,
  scoreGame,
  seatsFor,
  SERIES_CHOOSE_MS,
  seriesFor,
  seriesWinner,
  type Accepted,
  type Entry,
  type Outcome,
  type Seat,
  type SeriesState,
  type ServerMsg,
  type TrophyCount,
  type RankBadge,
  cleanTrophies,
  cleanRank,
  REPLAY_MIN_MOVES,
} from '@sr/pvp';
import type { Env } from './env';
import { cleanAction, parse, send } from './wire';

/** A match counts on the leaderboard only if at least this many moves were made (and, if it ended any way but a win, this many). */
const MIN_RECORDED_MOVES = 6;
const MIN_FORFEIT_MOVES = 14;

/** A room nobody joins, or whose result nobody collects, is cleared after this long. */
const IDLE_MS = 15 * 60_000;
const LINGER_MS = 5 * 60_000;
/** A browser pings every 20 s; one silent for this long is treated as gone, and how often we look. */
const QUIET_MS = 60_000;
const HEARTBEAT_CHECK_MS = 30_000;
/** When the computer is to choose the order between games, it waits this long (the result is on screen first), ms. */
const GHOST_PAUSE_MS = 8_000;
/** The most people watching one match at once. */
const MAX_WATCHERS = 50;

interface Saved {
  created: number;
  /** who sits where, by their own random id (seats are only fixed when the second player joins) */
  ids: Partial<Record<Seat, string>>;
  entries: Partial<Record<Seat, Entry>>;
  /** a ghost sits in this room: a deck from a past match, played by the computer (never sent to a player) */
  ghost?: { seat: Seat; id: string };
  /** when the ghost's next move is due (ms), if it is the ghost's turn */
  ghostAt?: number;
  /** each seat's leaderboard id. Kept apart from the entries on purpose: entries are sent to both players, and this is never shown */
  who?: Partial<Record<Seat, string>>;
  started: boolean;
  seed: string;
  /** the RULES_VERSION the game in progress was started under (missing: before there was one) */
  rules?: number;
  log: { seat: Seat; action: Action }[];
  deadline: number;
  /** when the game in progress began (epoch ms): it is called GAME_MS later (DECISIONS #259) */
  gameStart?: number;
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
  /** a match is the best of three games: which game it is and each player's wins (by player id, because the seats swap) */
  series: SeriesState;
  /** the match is decided (a second game win, or a player left) */
  decided: boolean;
  /** a game is over and the match goes on: the players are waiting to choose the order of the next one */
  between: boolean;
  /** between games: the seat that chooses (whoever lost the last game); the other waits */
  chooser?: Seat;
  /** between games: how the game just played ended (a player who reconnects is told) */
  lastEnd?: Outcome;
  /** moves made in the games already finished (a match is recorded on the board by its total) */
  moves: number;
  /** the replay id of the game that ended last (told to a player who comes back to the result) */
  lastReplay?: string;
}

interface Attach {
  playerId: string;
  seat: Seat | null;
  /** someone watching the match, not playing in it */
  watch?: true;
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
  series: newSeries(),
  decided: false,
  between: false,
  moves: 0,
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
        // (a room saved before a field existed gets that field's starting value)
        this.data = { ...fresh(), ...saved };
        if (saved.moves === undefined) this.data.moves = saved.log.length;
        this.rebuild();
        // a room woken from sleep with the ghost to move (its move was due, or was never arranged) sets it going again
        if (saved.ghost && this.match && !saved.over && saved.ghostAt === undefined) {
          this.planGhost();
          if (this.data.ghostAt !== undefined) await this.save();
        }
      }
    });
  }

  override async fetch(request: Request): Promise<Response> {
    // the matchmaker sets a room up with a ghost in it before the player is told to join
    if (request.method === 'POST' && new URL(request.url).pathname.startsWith('/ghost/'))
      return this.setupGhost(request);
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected a WebSocket.', { status: 426 });
    this.code = new URL(request.url).pathname.split('/').pop() ?? '';
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Put a ghost in the second place of an empty room (only the matchmaker, inside the Worker, ever asks for this). */
  private async setupGhost(request: Request): Promise<Response> {
    const d = this.data;
    if (d.ids.a || d.ids.b || d.started || d.ghost)
      return new Response('room in use', { status: 409 });
    let body: { ghost?: { id?: unknown; entry?: unknown } };
    try {
      body = await request.json<typeof body>();
    } catch {
      return new Response('bad body', { status: 400 });
    }
    const checked = checkEntry(body.ghost?.entry);
    const id = body.ghost?.id;
    if (!checked.ok || typeof id !== 'string') return new Response('bad ghost', { status: 400 });
    const { who: _who, ...entry } = checked.entry;
    void _who;
    d.ghost = { seat: 'b', id };
    d.ids.b = `ghost:${crypto.randomUUID()}`;
    d.entries.b = entry;
    await this.save();
    return new Response('ok');
  }

  /** Whether it is the ghost's turn: if so, its next move comes up after a short pause (so it plays like someone thinking). */
  private planGhost(): void {
    const d = this.data;
    const m = this.match;
    if (d.ghost && m && !d.over && m.active === d.ghost.seat) {
      // (it pauses between moves like someone thinking, but a turn of many cards still fits well inside the turn clock)
      const played = m.state.sides[d.ghost.seat].played;
      d.ghostAt = Date.now() + (played > 12 ? 250 : 800 + Math.floor(Math.random() * 700));
    } else delete d.ghostAt;
  }

  /** The ghost makes its next move (the smart bot chooses it from the position, looking only at its own side's choices). */
  private async ghostMove(): Promise<void> {
    const d = this.data;
    const m = this.match;
    if (!m || !d.ghost || d.over) return;
    const seat = d.ghost.seat;
    if (m.active !== seat) {
      delete d.ghostAt;
      await this.save();
      return;
    }
    let action: Action;
    try {
      action = chooseSmartAction(COMBAT_DB, m.state);
    } catch (err) {
      console.error('[room] the ghost could not choose', err);
      action = { type: 'endTurn' };
    }
    let r = m.submit(seat, m.log.length + 1, action, Date.now());
    if (!r.ok) {
      // (a move the engine refuses must not stall the match: the ghost ends its turn instead)
      action = { type: 'endTurn' };
      r = m.submit(seat, m.log.length + 1, action, Date.now());
      if (!r.ok) {
        delete d.ghostAt;
        await this.save();
        return;
      }
    }
    d.log.push({ seat, action });
    d.deadline = r.deadline;
    d.missed = { ...m.missed };
    this.broadcast({
      type: 'action',
      seq: r.seq,
      seat,
      action,
      hash: r.hash,
      deadline: r.deadline,
      now: Date.now(),
    });
    if (r.outcome) {
      await this.finish(r.outcome);
      return;
    }
    this.planGhost();
    await this.save();
  }

  /** Replay the saved moves to get the match back. */
  private rebuild(): void {
    const d = this.data;
    const a = d.entries.a;
    const b = d.entries.b;
    if (!d.started || !a || !b || d.between) return;
    // a game started under other rules (a new version came out mid-match) would replay as a different game: it is ended instead
    if (d.rules !== RULES_VERSION) {
      d.over ??= { winner: 'draw', reason: 'disconnect' };
      this.match = null;
      return;
    }
    try {
      const m = new Match(d.seed, a, b, Date.now());
      for (const { seat, action } of d.log) {
        const r = m.submit(seat, m.log.length + 1, action, Date.now());
        if (!r.ok) throw new Error(`replay refused move ${m.log.length + 1}: ${r.message}`);
      }
      m.deadline = d.deadline;
      // (a game saved before there was a game clock starts its full time now)
      m.startedAt = d.gameStart ?? Date.now();
      d.gameStart = m.startedAt;
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

  /** The players' connections (someone watching is not one of them). */
  private sockets(seat?: Seat): { ws: WebSocket; at: Attach }[] {
    return this.ctx.getWebSockets().flatMap((ws) => {
      const at = ws.deserializeAttachment() as Attach | null;
      return at && !at.watch && (seat === undefined || at.seat === seat) ? [{ ws, at }] : [];
    });
  }

  /** The connections of people watching. */
  private watchers(): WebSocket[] {
    return this.ctx.getWebSockets().filter((ws) => {
      const at = ws.deserializeAttachment() as Attach | null;
      return at?.watch === true;
    });
  }

  /** Tell everyone in the room, players and watchers. */
  private broadcast(msg: ServerMsg): void {
    for (const { ws } of this.sockets()) send(ws, msg);
    for (const ws of this.watchers()) send(ws, msg);
  }

  /** Bring someone watching up to date: the game so far (seen from the first seat), or that it has not begun. */
  private welcomeWatcher(ws: WebSocket): void {
    const d = this.data;
    if (!d.started || d.choosing) {
      send(ws, { type: 'waiting', room: this.code });
      // (between games: how the last one ended)
      if (d.between && d.lastEnd) {
        send(ws, this.endMessage(d.lastEnd));
        if (d.lastReplay) send(ws, { type: 'replay', id: d.lastReplay });
      }
      return;
    }
    const start = this.startMessage('a');
    if (!start || start.type !== 'start') return;
    send(ws, { ...start, watching: true });
    for (let i = 0; i < d.log.length; i++) send(ws, this.actionMessage(i, null));
    if (d.over) send(ws, this.endMessage(d.over));
    if (d.over && d.lastReplay) send(ws, { type: 'replay', id: d.lastReplay });
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
      if (d.gameStart !== undefined) at = Math.min(at, d.gameStart + GAME_MS);
      if (d.ghostAt !== undefined) at = Math.min(at, d.ghostAt);
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
      ...(d.gameStart !== undefined ? { gameEnds: d.gameStart + GAME_MS } : {}),
      replay: d.log.length,
      now: Date.now(),
      toss: d.toss,
      series: this.seriesNow(),
      ...(d.ghost ? { ghost: d.ghost.seat } : {}),
    };
  }

  /** The score of the match as the seats sit now (`over`: the match is decided). */
  private seriesNow(): ReturnType<typeof seriesFor> {
    const d = this.data;
    return seriesFor(d.series, d.ids, d.decided);
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
      seat,
      ...(d.between
        ? { series: this.seriesNow(), chooser: d.chooser === seat && d.choices[seat] === undefined }
        : {}),
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
    const whos: Partial<Record<Seat, string>> = {};
    const away: Partial<Record<Seat, number>> = {};
    if (d.ghost) d.ghost = { ...d.ghost, seat: seats[d.ghost.seat] };
    for (const arrival of ['a', 'b'] as const) {
      const id = d.ids[arrival];
      const entry = d.entries[arrival];
      if (id && entry) {
        ids[seats[arrival]] = id;
        entries[seats[arrival]] = entry;
        const w = d.who?.[arrival];
        if (w) whos[seats[arrival]] = w;
        const gone = d.away[arrival];
        if (gone !== undefined) away[seats[arrival]] = gone;
      }
    }
    d.away = away;
    d.ids = ids;
    d.entries = entries;
    d.who = whos;
    d.choosing = false;
    d.between = false;
    delete d.chooser;
    delete d.lastEnd;
    d.choices = {};
    d.log = [];
    d.over = null;
    d.started = true;
    d.rules = RULES_VERSION;
    d.toss = { random: order.random };
    d.seed = crypto.randomUUID();
    this.match = new Match(d.seed, entries.a as Entry, entries.b as Entry, Date.now());
    d.deadline = this.match.deadline;
    d.gameStart = this.match.startedAt;
    d.missed = { a: 0, b: 0 };
    for (const s of this.sockets()) {
      const seatOf: Seat = d.ids.a === s.at.playerId ? 'a' : 'b';
      s.ws.serializeAttachment({ playerId: s.at.playerId, seat: seatOf } satisfies Attach);
    }
    // a seat nobody is connected to is away from the start
    for (const seatOf of ['a', 'b'] as const)
      if (this.sockets(seatOf).length === 0 && seatOf !== d.ghost?.seat)
        d.away[seatOf] ??= Date.now();
    this.planGhost();
    await this.save();
    for (const s of this.sockets()) {
      const m = this.startMessage(s.at.seat as Seat);
      if (m) send(s.ws, m);
    }
    // (people watching see each game from the first seat)
    const seen = this.startMessage('a');
    if (seen?.type === 'start')
      for (const ws of this.watchers()) send(ws, { ...seen, watching: true });
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

    if (msg.type === 'watch') {
      if (at) return; // (already in the room on this socket)
      if (msg.rules !== RULES_VERSION) {
        send(ws, {
          type: 'error',
          code: 'outdated',
          message: 'The game has been updated. Reload the page to watch.',
        });
        ws.close(1008, 'outdated');
        return;
      }
      if (this.watchers().length >= MAX_WATCHERS) {
        send(ws, { type: 'error', code: 'room-full', message: 'Too many people are watching.' });
        ws.close(1008, 'full');
        return;
      }
      ws.serializeAttachment({
        playerId: `watch:${crypto.randomUUID()}`,
        seat: null,
        watch: true,
      } satisfies Attach);
      this.welcomeWatcher(ws);
      return;
    }

    if (msg.type === 'join') {
      if (at) return; // already seated on this socket
      if (msg.rules !== RULES_VERSION) {
        send(ws, {
          type: 'error',
          code: 'outdated',
          message: 'The game has been updated. Reload the page to play.',
        });
        ws.close(1008, 'outdated');
        return;
      }
      if (msg.playerId.startsWith('ghost:')) {
        send(ws, { type: 'error', code: 'bad-message', message: 'That is not a player id.' });
        ws.close(1008, 'bad id');
        return;
      }
      const checked = checkArenaEntry(msg.entry);
      if (!checked.ok) {
        send(ws, { type: 'error', code: 'bad-deck', message: checked.message });
        ws.close(1008, 'bad deck');
        return;
      }
      // the trophies they hold go on their card for the opponent to see (the board is asked, briefly, before a seat is taken, so
      // nothing about the room changes while waiting for it; a browser cannot claim any)
      const badge = checked.entry.who ? await this.badgeOf(checked.entry.who) : {};
      // (this socket may have been seated by a second join sent while the board was asked)
      if (ws.deserializeAttachment()) return;
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
      // the leaderboard id is taken out of the entry before it is kept (the entry goes to the opponent)
      const { who, ...publicEntry } = checked.entry;
      d.entries[free] = {
        ...publicEntry,
        ...(badge.trophies ? { trophies: badge.trophies } : {}),
        ...(badge.rank ? { rank: badge.rank } : {}),
      };
      d.who ??= {};
      if (who) d.who[free] = who;
      else delete d.who[free];
      ws.serializeAttachment({ playerId: msg.playerId, seat: free } satisfies Attach);
      if (!(d.ids.a && d.ids.b)) {
        await this.save();
        send(ws, { type: 'waiting', room: this.code });
        return;
      }
      // both are here: each is asked whether to go first
      d.choosing = true;
      d.choices = d.ghost ? { [d.ghost.seat]: Math.random() < 0.5 } : {};
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
      if (d.between) {
        // between games only the player who lost chooses; what they ask for, the other gets the opposite of
        if (seat !== d.chooser || d.choices[seat] !== undefined) return;
        d.choices[seat] = msg.first;
        d.choices[other(seat)] = !msg.first;
        await this.begin();
        return;
      }
      d.choices[seat] = msg.first;
      await this.save();
      if (d.choices.a !== undefined && d.choices.b !== undefined) await this.begin();
      return;
    }
    const match = this.match;
    if (!match || !d.started || d.between) {
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
      else {
        this.planGhost();
        await this.save();
      }
    }
  }

  /** Bring a (re)connecting player up to date: the start, then every move so far. */
  private welcome(ws: WebSocket, seat: Seat): void {
    const d = this.data;
    if (d.choosing) {
      // (someone who was away when the game ended is told how it ended before they are asked about the next)
      if (d.between && d.lastEnd) send(ws, this.endMessage(d.lastEnd));
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
    if (d.over) send(ws, this.endMessage(d.over));
    if (d.over && d.lastReplay) send(ws, { type: 'replay', id: d.lastReplay });
  }

  private endMessage(o: Outcome): ServerMsg {
    return { type: 'end', winner: o.winner, reason: o.reason, series: this.seriesNow() };
  }

  /** Keep the game that has just ended, so it can be watched again (its id, or nothing if the board could not take it). */
  /** What a replay of the game just ended holds (taken before the room moves on), or null when it is not kept. */
  private replayOf(outcome: Outcome): Record<string, unknown> | null {
    const d = this.data;
    const a = d.entries.a;
    const b = d.entries.b;
    if (!a || !b || d.log.length < REPLAY_MIN_MOVES || d.rules !== RULES_VERSION) return null;
    // (only a game with a known player in it is kept, and the board limits how many each keeps: see saveReplay)
    const owners = Object.values(d.who ?? {}).filter((w): w is string => typeof w === 'string');
    if (owners.length === 0) return null;
    // (the trophies and rank on a card are of the moment: a replay keeps the decks and names only)
    const plain = (e: Entry): Entry => {
      const { trophies: _t, rank: _r, ...rest } = e;
      void _t;
      void _r;
      return rest;
    };
    return {
      owners,
      replay: {
        rules: d.rules,
        seed: d.seed,
        a: plain(a),
        b: plain(b),
        log: [...d.log],
        winner: outcome.winner,
        reason: outcome.reason,
        game: d.series.game,
        ...(d.ghost ? { ghost: d.ghost.seat } : {}),
      },
    };
  }

  /**
   * Keep a game that has ended, after its result is out (never in its way): once the board gives it an id, everyone in the room is
   * told. The room may have moved on, or been cleared, while the board was asked: then nothing more is done.
   */
  private async keepReplay(body: Record<string, unknown> | null, seed: string): Promise<void> {
    if (!body) return;
    let id: string | undefined;
    try {
      const res = await this.env.BOARD.get(this.env.BOARD.idFromName('main')).fetch(
        new Request('https://board.invalid/replay/save', {
          method: 'POST',
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        }),
      );
      const data = await res.json<{ id?: unknown }>();
      if (typeof data.id === 'string') id = data.id;
    } catch {
      return;
    }
    if (!id || this.data.seed !== seed || !this.data.started) return;
    this.data.lastReplay = id;
    await this.save();
    this.broadcast({ type: 'replay', id });
  }

  /**
   * A game is over. A win, a resignation or two missed turns end only the game: the score is kept, and unless someone has won two
   * games the players are asked (the loser first) who goes first in the next. A player leaving (or both) ends the whole match.
   */
  private async finish(outcome: Outcome): Promise<void> {
    const d = this.data;
    d.over = outcome;
    d.moves += d.log.length;
    // (what its replay holds is taken now; it is kept once the result is out)
    const replay = this.replayOf(outcome);
    const seed = d.seed;
    delete d.lastReplay;
    const gameOnly = outcome.reason !== 'disconnect';
    if (gameOnly) {
      const winnerId = outcome.winner === 'draw' ? null : (d.ids[outcome.winner] ?? null);
      d.series = scoreGame(d.series, winnerId);
    }
    d.decided = !gameOnly || seriesWinner(d.series) !== null;
    const over = this.endMessage(outcome);
    if (d.decided) {
      await this.save();
      this.broadcast(over);
      await this.record(outcome);
      await this.keepReplay(replay, seed);
      return;
    }
    // the match goes on: the result is shown, then the loser of this game chooses who goes first in the next
    const loser: Seat = outcome.winner === 'draw' ? 'a' : other(outcome.winner);
    d.over = null;
    d.between = true;
    d.lastEnd = outcome;
    d.chooser = loser;
    d.choosing = true;
    d.log = [];
    this.match = null;
    delete d.ghostAt;
    if (d.ghost?.seat === loser) {
      const wants = Math.random() < 0.5;
      d.choices = { [loser]: wants, [other(loser)]: !wants };
      d.chooseBy = Date.now() + GHOST_PAUSE_MS;
    } else {
      d.choices = {};
      d.chooseBy = Date.now() + SERIES_CHOOSE_MS;
    }
    await this.save();
    this.broadcast(over);
    for (const sock of this.sockets()) this.askOrder(sock.ws, sock.at.seat as Seat);
    await this.keepReplay(replay, seed);
  }

  /** The Arena trophies a player holds and their rank (neither if the board cannot be reached: a card without them is no loss). */
  private async badgeOf(who: string): Promise<{ trophies?: TrophyCount; rank?: RankBadge }> {
    try {
      // (a second at most: a slow board never holds up a match)
      const res = await this.env.BOARD.get(this.env.BOARD.idFromName('main')).fetch(
        new Request('https://board.invalid/trophies/count', {
          method: 'POST',
          body: JSON.stringify({ players: [who] }),
          signal: AbortSignal.timeout(1000),
        }),
      );
      const data = await res.json<{
        counts?: Record<string, unknown>;
        ranks?: Record<string, unknown>;
      }>();
      const trophies = cleanTrophies(data.counts?.[who]);
      const rank = cleanRank(data.ranks?.[who]);
      return { ...(trophies ? { trophies } : {}), ...(rank ? { rank } : {}) };
    } catch {
      return {};
    }
  }

  /** A played match with a winner goes on the Arena leaderboard (a match that never got going, or a draw, does not). */
  private async record(outcome: Outcome): Promise<void> {
    const d = this.data;
    // a match that was barely played does not count, nor does a win by forfeit or a missed clock in the first few moves
    if (outcome.winner === 'draw' || !d.started || d.moves < MIN_RECORDED_MOVES) return;
    if (outcome.reason !== 'win' && d.moves < MIN_FORFEIT_MOVES) return;
    if (d.ghost) {
      await this.recordGhost(outcome.winner);
      return;
    }
    const w = d.entries[outcome.winner];
    const l = d.entries[other(outcome.winner)];
    const wid = d.who?.[outcome.winner];
    const lid = d.who?.[other(outcome.winner)];
    if (!w || !l || !wid || !lid) return;
    try {
      await this.env.BOARD.get(this.env.BOARD.idFromName('main')).fetch(
        new Request('https://board.invalid/pvp', {
          method: 'POST',
          body: JSON.stringify({
            winner: { id: wid, name: w.name, hero: w.hero, entry: w },
            loser: { id: lid, name: l.name, hero: l.hero, entry: l },
          }),
        }),
      );
    } catch {
      /* the board is a nicety: a match never fails because it could not be recorded */
    }
  }

  /** A match against a ghost has ended: tell the board whether the person or the ghost won. */
  private async recordGhost(winner: Seat): Promise<void> {
    const d = this.data;
    const ghost = d.ghost;
    if (!ghost) return;
    const humanSeat = other(ghost.seat);
    const human = d.entries[humanSeat];
    const hid = d.who?.[humanSeat];
    if (!human || !hid) return;
    try {
      await this.env.BOARD.get(this.env.BOARD.idFromName('main')).fetch(
        new Request('https://board.invalid/ghost/result', {
          method: 'POST',
          body: JSON.stringify({
            ghost: ghost.id,
            human: { id: hid, name: human.name, hero: human.hero },
            ghostWon: winner === ghost.seat,
          }),
        }),
      );
    } catch {
      /* never in the way of a match */
    }
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
      if (d.between) {
        // between games a player who has been gone too long forfeits the match (both gone: nobody wins)
        const gone = (['a', 'b'] as const).filter((s) => {
          const t = d.away[s];
          return t !== undefined && now - t >= RECONNECT_MS;
        });
        if (gone.length > 0) {
          d.choosing = false;
          d.between = false;
          delete d.chooser;
          await this.finish(
            gone.length === 2
              ? { winner: 'draw', reason: 'disconnect' }
              : { winner: other(gone[0] as Seat), reason: 'disconnect' },
          );
          return;
        }
      }
      // time to answer ran out: whoever did not answer leaves it to the coin
      if (now >= d.chooseBy) await this.begin();
      else await this.save();
      return;
    }
    if (d.over || !d.started) {
      // nothing more will happen here: clear the room (and send away anyone still watching)
      for (const ws of this.ctx.getWebSockets()) ws.close(1000, 'room closed');
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
    // the game's time (GAME_MS) is up: it is called for the larger share of HP left
    const called = match.callTime(now);
    if (called) {
      await this.finish(called);
      return;
    }
    // the ghost's move is due
    if (d.ghost && d.ghostAt !== undefined && now >= d.ghostAt) {
      await this.ghostMove();
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
    // (the clock may just have passed the turn to the ghost)
    this.planGhost();
    await this.save();
  }
}
