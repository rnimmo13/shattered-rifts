// Arena replays (DECISIONS #239): every finished game of a match is kept for a while on the server, as what rebuilds it exactly (the
// seed, the two decks and the moves), so it can be watched again from a link. A replay is only good for the rules it was played
// under: one from another RULES_VERSION would play out as a different game, so it is refused rather than shown wrong.

import type { Action } from '@sr/combat';
import { checkEntry } from './deck';
import type { EndReason, Entry, Seat } from './protocol';

/** How long a replay is kept, days, and how many at most (the oldest go first). */
export const REPLAY_KEEP_DAYS = 30;
export const REPLAY_MAX = 20_000;
/** A game shorter than this many moves is not kept (nothing happened in it). */
export const REPLAY_MIN_MOVES = 2;

export interface StoredReplay {
  id: string;
  at: number;
  /** the RULES_VERSION it was played under */
  rules: number;
  seed: string;
  a: Entry;
  b: Entry;
  /** each move, and (from 2026-10-26) the fingerprint of the game after it, so a replay can tell the move where it no longer plays
   *  out as it did (the cards changed since, or a bug) */
  log: { seat: Seat; action: Action; hash?: string }[];
  winner: Seat | 'draw';
  reason: EndReason;
  /** the seat a ghost played, if one did */
  ghost?: Seat;
  /** which game of the match it was (1 to 3) */
  game?: number;
}

/** A replay id: 10 letters and digits. */
export const REPLAY_ID = /^[A-Za-z0-9]{10}$/;

// (every way a game ends: a game the clock called could not be watched again while 'time' was missing here)
const REASONS: readonly EndReason[] = ['win', 'resign', 'timeout', 'disconnect', 'time'];
const ACTIONS = new Set(['play', 'potion', 'endTurn', 'pick', 'command']);

/** A replay as a browser receives it, checked (null if anything in it is not what a replay holds). */
export function cleanReplay(raw: unknown): StoredReplay | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = r['id'];
  const at = r['at'];
  const rules = r['rules'];
  const seed = r['seed'];
  const winner = r['winner'];
  const reason = r['reason'];
  if (typeof id !== 'string' || !REPLAY_ID.test(id)) return null;
  if (typeof at !== 'number' || typeof rules !== 'number' || typeof seed !== 'string') return null;
  if (winner !== 'a' && winner !== 'b' && winner !== 'draw') return null;
  if (typeof reason !== 'string' || !REASONS.includes(reason as EndReason)) return null;
  const a = checkEntry(r['a']);
  const b = checkEntry(r['b']);
  if (!a.ok || !b.ok) return null;
  const log = r['log'];
  if (!Array.isArray(log)) return null;
  const moves: StoredReplay['log'] = [];
  for (const m of log as unknown[]) {
    if (typeof m !== 'object' || m === null) return null;
    const seat = (m as Record<string, unknown>)['seat'];
    const action = (m as Record<string, unknown>)['action'];
    if (seat !== 'a' && seat !== 'b') return null;
    if (typeof action !== 'object' || action === null) return null;
    if (!ACTIONS.has(String((action as Record<string, unknown>)['type']))) return null;
    const hash = (m as Record<string, unknown>)['hash'];
    moves.push({
      seat,
      action: action as Action,
      ...(typeof hash === 'string' && hash.length <= 64 ? { hash } : {}),
    });
  }
  const ghost = r['ghost'];
  const game = r['game'];
  // (the server's own words for each deck's name and progress are kept: checkEntry cleans them as it would any deck)
  const { who: _wa, ...ea } = a.entry;
  const { who: _wb, ...eb } = b.entry;
  void _wa;
  void _wb;
  return {
    id,
    at,
    rules,
    seed,
    a: ea,
    b: eb,
    log: moves,
    winner,
    reason: reason as EndReason,
    ...(ghost === 'a' || ghost === 'b' ? { ghost } : {}),
    ...(typeof game === 'number' && Number.isInteger(game) && game >= 1 && game <= 3
      ? { game }
      : {}),
  };
}
