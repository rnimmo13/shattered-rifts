// Small helpers shared by the two Durable Objects: parsing what a browser sends and sending what the server says.

import type { ClientMsg, ServerMsg } from '@sr/pvp';

/** Biggest message accepted (a deck of 80 cards is about 2 KB). */
export const MAX_MESSAGE_BYTES = 16_384;

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
    case 'resign':
      return { type: 'resign' };
    default:
      return null;
  }
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A room code a person can read out loud (no 0/O or 1/I). */
export function roomCode(len = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const ROOM_CODE = /^[A-Z0-9]{4,12}$/;
