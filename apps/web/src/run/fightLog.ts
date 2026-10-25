// A campaign fight in progress, kept so a reload picks it up where it was. The engine is deterministic (the same seed and the same
// moves are the same fight), so all that is kept is the fight's seed and the moves made so far: the fight is replayed from them.
// There is nothing to gain from reloading (the fight is the same), so it costs nothing.

import type { Action } from '@sr/combat';

const PREFIX = 'sr.fightlog:';

interface Log {
  seed: string;
  moves: Action[];
}

function read(key: string): Log | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Log>;
    return typeof v.seed === 'string' && Array.isArray(v.moves) ? { seed: v.seed, moves: v.moves } : null;
  } catch {
    return null;
  }
}

/** The moves made so far in this fight (none when there is no log, or it belongs to another seed). */
export function loadFightLog(key: string, seed: string): Action[] {
  const log = read(key);
  return log && log.seed === seed ? log.moves : [];
}

/** Add a move the player has just made. */
export function appendFightMove(key: string, seed: string, move: Action): void {
  try {
    const log = read(key);
    const moves = log && log.seed === seed ? log.moves : [];
    localStorage.setItem(PREFIX + key, JSON.stringify({ seed, moves: [...moves, move] }));
  } catch {
    /* storage can be full or blocked: the fight is simply not resumable */
  }
}

/** The fight is over (won, lost or forfeited), or the log is no good: forget it. */
export function clearFightLog(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* nothing to clear */
  }
}
