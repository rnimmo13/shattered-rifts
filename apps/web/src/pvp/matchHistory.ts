// The Arena matches played on this device, newest first: each game the server kept as a replay (its id, who played, how it ended),
// so it can be watched again or shared from the History page. The replay itself stays on the server (for REPLAY_KEEP_DAYS).

import type { Side } from '@sr/combat';
import { REPLAY_ID } from '@sr/pvp';

const KEY = 'sr.matchHistory';
const KEEP = 60;

export interface MatchRecord {
  /** the replay id */
  id: string;
  at: number;
  names: Record<Side, string>;
  heroes: Record<Side, string>;
  /** the seat this player sat in */
  seat: Side;
  winner: Side | 'draw';
  reason: string;
  /** the opponent was a ghost */
  ghost: boolean;
  /** which game of the best of three */
  game?: number;
}

const isRecord = (r: unknown): r is MatchRecord =>
  typeof r === 'object' &&
  r !== null &&
  typeof (r as MatchRecord).id === 'string' &&
  REPLAY_ID.test((r as MatchRecord).id) &&
  typeof (r as MatchRecord).at === 'number' &&
  typeof (r as MatchRecord).names === 'object' &&
  (r as MatchRecord).names !== null &&
  typeof (r as MatchRecord).heroes === 'object' &&
  (r as MatchRecord).heroes !== null &&
  ((r as MatchRecord).seat === 'a' || (r as MatchRecord).seat === 'b');

export function matchHistory(): MatchRecord[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter(isRecord).sort((a, b) => b.at - a.at) : [];
  } catch {
    return [];
  }
}

/** Keep a game that has ended (once: the same replay again changes nothing). */
export function recordMatch(rec: MatchRecord): void {
  try {
    const list = matchHistory();
    if (list.some((r) => r.id === rec.id)) return;
    localStorage.setItem(KEY, JSON.stringify([rec, ...list].slice(0, KEEP)));
  } catch {
    /* storage full or blocked: no history */
  }
}

/** Take the match history as it stands after comparing with the player's other devices (DECISIONS #318). */
export function replaceMatches(list: readonly MatchRecord[]): void {
  try {
    const clean = list.filter(isRecord).sort((a, b) => b.at - a.at);
    localStorage.setItem(KEY, JSON.stringify(clean.slice(0, KEEP)));
  } catch {
    /* storage full or blocked */
  }
}

/** The address of this page with another route on it (what a shared link points at). */
const here = (route: string): string =>
  `${window.location.origin}${window.location.pathname}${route}`;

/** A link anyone can open to watch a finished game again. */
export const replayLink = (id: string): string => here(`#/replay/${id}`);
/** A link anyone can open to watch a match as it is played. */
export const watchLink = (room: string): string => here(`#/watch/${room}`);

/** Copy a link, falling back to showing it when the clipboard cannot be written (an old browser, a denied permission). */
export async function copyLink(link: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    return false;
  }
}
