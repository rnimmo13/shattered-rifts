// The matchmaking queue: one Durable Object, one WebSocket per waiting player. A player's place in the queue lives on their
// socket (as an attachment), so it survives the object being put to sleep. When two players fit (see pairUp), both are told
// the code of a fresh room and their queue sockets close; they then join the room as if a friend had sent them the code.

import { DurableObject } from 'cloudflare:workers';
import { checkEntry, pairUp, type Waiting } from '@sr/pvp';
import type { Env } from './env';
import { parse, roomCode as makeCode, send } from './wire';

interface Place {
  playerId: string;
  tier: number;
  since: number;
}

export class Matchmaker extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected a WebSocket.', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private waiting(): { ws: WebSocket; place: Place }[] {
    return this.ctx.getWebSockets().flatMap((ws) => {
      const place = ws.deserializeAttachment() as Place | null;
      return place ? [{ ws, place }] : [];
    });
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const msg = parse(message);
    if (!msg || msg.type !== 'queue') {
      send(ws, { type: 'error', code: 'bad-message', message: 'Send {type:"queue"} first.' });
      return;
    }
    const checked = checkEntry(msg.entry);
    if (!checked.ok) {
      send(ws, { type: 'error', code: 'bad-deck', message: checked.message });
      ws.close(1008, 'bad deck');
      return;
    }
    // one place per player: a second tab replaces the first (its place is cleared at once, before its socket finishes closing)
    for (const w of this.waiting())
      if (w.place.playerId === msg.playerId && w.ws !== ws) {
        w.ws.serializeAttachment(null);
        w.ws.close(1000, 'replaced');
      }
    const place: Place = { playerId: msg.playerId, tier: checked.entry.tier, since: Date.now() };
    ws.serializeAttachment(place);
    send(ws, { type: 'queued', waiting: this.waiting().length });
    await this.pairAll();
  }

  override webSocketClose(ws: WebSocket): void {
    try {
      ws.close(1000, 'bye');
    } catch {
      /* already closed */
    }
  }

  override webSocketError(ws: WebSocket): void {
    this.webSocketClose(ws);
  }

  override async alarm(): Promise<void> {
    await this.pairAll();
  }

  private async pairAll(): Promise<void> {
    const now = Date.now();
    // a waiting player who has gone quiet (no ping for a minute) is dropped, so nobody is paired with a ghost
    for (const w of this.waiting()) {
      const last = this.ctx.getWebSocketAutoResponseTimestamp(w.ws);
      if (last && now - last.getTime() > 60_000) {
        w.ws.serializeAttachment(null);
        w.ws.close(1001, 'quiet');
      }
    }
    const all = this.waiting();
    const byId = new Map(all.map((w) => [w.place.playerId, w]));
    const queue: Waiting[] = all.map((w) => ({
      id: w.place.playerId,
      tier: w.place.tier,
      since: w.place.since,
    }));
    const { pairs, rest } = pairUp(queue, Date.now());
    for (const [p, q] of pairs) {
      const room = makeCode();
      for (const w of [p, q]) {
        const sock = byId.get(w.id)?.ws;
        if (!sock) continue;
        send(sock, { type: 'matched', room });
        sock.close(1000, 'matched');
      }
    }
    // those still waiting are looked at again soon: the tier gap widens with time, and a quiet player is found out
    if (rest.length > 0)
      await this.ctx.storage.setAlarm(Date.now() + (rest.length > 1 ? 2000 : 8000));
  }
}
