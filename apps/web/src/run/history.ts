// The run history: every run that has ended on this device (fallen, banked or abandoned), newest first, with its deck, how far it
// got, and the last fight it played (to watch again, or read the recap of: the fight that ended a fallen run). Kept in this
// browser only; a parked run is not history until it ends.

import type { RunState } from '@sr/campaign';
import type { FightReplay } from '../fight/recap';
import { BUILD } from '../build';
import { canonicalCard } from '@sr/content/v2';

const KEY = 'sr.runHistory';
/** How many runs are kept, and how many of the newest keep their last fight (a fight's moves are a few kilobytes). */
export const HISTORY_RUNS = 40;
export const HISTORY_FIGHTS = 12;

export type RunEnd = 'collapsed' | 'banked' | 'abandoned';

export interface RunRecord {
  /** the run's seed (a run is recorded once; ending it again replaces the record) */
  id: string;
  /** when it ended, epoch ms */
  at: number;
  hero: string;
  difficulty: string;
  tier: number;
  stage: number;
  end: RunEnd;
  deck: string[];
  boons: string[];
  maxHp: number;
  duelsWon: number;
  duelsLost: number;
  nodesCleared: number;
  /** the last fight the run played, and whether it was won */
  lastFight?: FightReplay & { won: boolean };
  /** the game version it ended on (a fight from another may no longer play out the same) */
  version?: string;
}

function read(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    // (a card taken out of the game becomes its replacement, so an old run can still be watched: DECISIONS #312)
    const v: unknown = JSON.parse(raw, (_k, val: unknown) =>
      typeof val === 'string' && val.length <= 40 ? canonicalCard(val) : val,
    );
    return Array.isArray(v)
      ? v.filter(
          (r): r is RunRecord =>
            typeof r === 'object' &&
            r !== null &&
            typeof (r as RunRecord).id === 'string' &&
            typeof (r as RunRecord).at === 'number' &&
            typeof (r as RunRecord).hero === 'string' &&
            Array.isArray((r as RunRecord).deck),
        )
      : [];
  } catch {
    return [];
  }
}

/** The runs that have ended on this device, newest first. */
export function runHistory(): RunRecord[] {
  return read().sort((a, b) => b.at - a.at);
}

/** The record a run makes when it ends. */
export function recordOf(
  run: RunState,
  end: RunEnd,
  now: number,
  lastFight?: FightReplay & { won: boolean },
): RunRecord {
  return {
    id: run.seed,
    at: now,
    hero: run.character,
    difficulty: run.difficulty,
    tier: run.tier,
    stage: run.stage,
    end,
    deck: [...run.deck],
    boons: [...run.boons, ...(run.heart ? [run.heart] : [])],
    maxHp: run.maxHp,
    duelsWon: run.stats.duelsWon,
    duelsLost: run.stats.duelsLost,
    nodesCleared: run.stats.nodesCleared,
    ...(lastFight ? { lastFight } : {}),
    version: BUILD.version,
  };
}

/** Keep a run that has ended (the newest few keep their last fight; the oldest go when the list is full). */
export function addToHistory(rec: RunRecord): void {
  write([rec, ...read().filter((r) => r.id !== rec.id)]);
}

/** Take the history as it stands after comparing with the player's other devices (DECISIONS #318). */
export function replaceHistory(list: readonly RunRecord[]): void {
  write(list);
}

/** Write the history: newest first, the newest few with their last fight, the oldest dropped when it is full. */
function write(all: readonly RunRecord[]): void {
  const list = [...all]
    .sort((a, b) => b.at - a.at)
    .slice(0, HISTORY_RUNS)
    .map((r, i) => {
      if (i < HISTORY_FIGHTS || !r.lastFight) return r;
      const { lastFight: _gone, ...rest } = r;
      void _gone;
      return rest;
    });
  // (storage that is full or blocked keeps no history: the game goes on without it)
  for (let keep = list.length; keep > 0; keep = Math.floor(keep / 2)) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, keep)));
      return;
    } catch {
      /* too big: try with fewer */
    }
  }
}

const REMOVED_KEY = 'sr.runHistory.removed';

/** The runs forgotten here, so the player's other devices forget them too (DECISIONS #318). */
export function historyRemoved(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(REMOVED_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Remember ids as removed (the list the server last agreed, or ones forgotten here). */
export function setHistoryRemoved(ids: readonly string[]): void {
  try {
    localStorage.setItem(REMOVED_KEY, JSON.stringify([...new Set(ids)].slice(-200)));
  } catch {
    /* not remembered: a forgotten run may come back from another device */
  }
}

/** Forget one run, or every run (on the player's other devices too). */
export function forgetRun(id: string | null): void {
  const ids = id === null ? read().map((r) => r.id) : [id];
  setHistoryRemoved([...historyRemoved(), ...ids]);
  try {
    if (id === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(read().filter((r) => r.id !== id)));
  } catch {
    /* nothing to forget */
  }
}
