// Small helpers shared by the two Durable Objects: parsing what a browser sends and sending what the server says.

import type { Action } from '@sr/combat';
import type { ClientMsg, ServerMsg } from '@sr/pvp';

/** Biggest message accepted (a deck of 80 cards is about 2 KB, and a player brings up to MAX_MATCH_DECKS of them). */
export const MAX_MESSAGE_BYTES = 65_536;

export function send(ws: WebSocket, msg: ServerMsg): void {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    /* the socket is already gone */
  }
}

/** Parse a message from a browser; anything that is not a known, well-shaped message is null. */
export function parse(message: string | ArrayBuffer): ClientMsg | null {
  if (typeof message !== 'string' || message.length > MAX_MESSAGE_BYTES) return null;
  let v: unknown;
  try {
    v = JSON.parse(message);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const m = v as Record<string, unknown>;
  switch (m['type']) {
    case 'queue':
    case 'ghost':
    case 'join':
      return typeof m['playerId'] === 'string' &&
        m['playerId'].length > 0 &&
        m['playerId'].length <= 64
        ? (m as unknown as ClientMsg)
        : null;
    case 'action':
      return typeof m['seq'] === 'number' &&
        typeof m['action'] === 'object' &&
        m['action'] !== null &&
        typeof (m['action'] as Record<string, unknown>)['type'] === 'string'
        ? (m as unknown as ClientMsg)
        : null;
    case 'pick':
      return typeof m['deck'] === 'number' && Number.isInteger(m['deck']) && m['deck'] >= 0
        ? { type: 'pick', deck: m['deck'] }
        : null;
    case 'order':
      return typeof m['first'] === 'boolean' ? { type: 'order', first: m['first'] } : null;
    case 'resign':
      return { type: 'resign' };
    case 'watch':
      return typeof m['rules'] === 'number'
        ? { type: 'watch', rules: m['rules'] }
        : { type: 'watch' };
    default:
      return null;
  }
}

/** An action as the engine knows it, and nothing else a client might have stuck on it. */
export function cleanAction(a: Action): Action {
  const o = a as unknown as Record<string, unknown>;
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' ? v.slice(0, 64) : undefined;
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isInteger(v) && Math.abs(v) < 1e6 ? v : undefined;
  switch (o['type']) {
    case 'endTurn':
      return { type: 'endTurn' };
    case 'play': {
      const target = str(o['target']);
      // (one companion, or a short list when several have to go to make room: DECISIONS #383)
      const raw = o['release'];
      const release = Array.isArray(raw)
        ? raw
            .slice(0, 8)
            .map(str)
            .filter((x): x is string => !!x)
        : str(raw);
      return {
        type: 'play',
        card: str(o['card']) ?? '',
        ...(target ? { target } : {}),
        ...(release && release.length ? { release } : {}),
      };
    }
    case 'potion': {
      const target = str(o['target']);
      const potion = str(o['potion']);
      return {
        type: 'potion',
        index: num(o['index']) ?? -1,
        ...(potion ? { potion } : {}),
        ...(target ? { target } : {}),
      };
    }
    case 'pick':
      return {
        type: 'pick',
        cards: Array.isArray(o['cards'])
          ? (o['cards'] as unknown[]).slice(0, 40).map((c) => str(c) ?? '')
          : [],
      };
    default:
      return { type: 'endTurn' };
  }
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A room code a person can read out loud (no 0/O or 1/I). */
export function roomCode(len = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const ROOM_CODE = /^[A-Z0-9]{4,12}$/;
