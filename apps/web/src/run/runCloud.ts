// Runs that follow the player from device to device (DECISIONS #309): this browser's runs and the copies in the player's Vault on the
// server (their account when signed in, else this browser's Vault code) are brought together, the newest copy of each run winning.
// The browser's runs always work without the server: this only adds the copy, and never holds the game up.

import {
  cleanListItems,
  type ListItem,
  type ListName,
  type RunCopy,
  cleanRunCopies,
} from '@sr/pvp';
import { matchHistory, replaceMatches, type MatchRecord } from '../pvp/matchHistory';
import {
  historyRemoved,
  replaceHistory,
  runHistory,
  setHistoryRemoved,
  type RunRecord,
} from './history';
import { serverBase } from '../pvp/config';
import { vaultKey, whoAmI } from '../pvp/vaultSync';
import { applyRunCopies, runCopies } from './saves';

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

/** Ask the player's Vault; null when the server cannot be reached or says no. */
async function ask(
  action: 'runs' | 'runsave',
  body: Record<string, unknown>,
): Promise<RunCopy[] | null> {
  try {
    const key = vaultKey();
    const res = await fetch(`${httpBase()}/pvp/vault/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key === null ? body : { code: key, ...body }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { ok?: unknown; runs?: unknown };
    return data.ok === true ? cleanRunCopies(data.runs) : null;
  } catch {
    return null;
  }
}

/** Bring one list together with the server's; the merged list (and the ids removed from it), or null when it cannot be reached. */
async function syncList(
  name: ListName,
  items: readonly ListItem[],
  removed: readonly string[],
): Promise<{ items: ListItem[]; removed: string[] } | null> {
  try {
    const key = vaultKey();
    const body = { list: name, items, removed };
    const res = await fetch(`${httpBase()}/pvp/vault/listsync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(key === null ? body : { code: key, ...body }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { ok?: unknown; items?: unknown; removed?: unknown };
    if (data.ok !== true) return null;
    return {
      items: cleanListItems(name, data.items),
      removed: Array.isArray(data.removed)
        ? data.removed.filter((x): x is string => typeof x === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

/** The run history and the Arena match history, brought together with the player's other devices (DECISIONS #318). */
export async function syncLists(): Promise<boolean> {
  await whoAmI();
  let changed = false;
  const runsBefore = JSON.stringify(runHistory().map((r) => [r.id, r.at]));
  const history = await syncList(
    'history',
    runHistory() as unknown as ListItem[],
    historyRemoved(),
  );
  if (history) {
    // (a run forgotten here while the server was asked is still forgotten)
    const gone = new Set([...history.removed, ...historyRemoved()]);
    // (and a run that ended here while the server was asked is kept)
    const ids = new Set(history.items.map((r) => r.id));
    replaceHistory(
      [
        ...(history.items as unknown as RunRecord[]),
        ...runHistory().filter((r) => !ids.has(r.id)),
      ].filter((r) => !gone.has(r.id)),
    );
    setHistoryRemoved([...gone]);
    changed ||= JSON.stringify(runHistory().map((r) => [r.id, r.at])) !== runsBefore;
  }
  const matchesBefore = matchHistory().length;
  const matches = await syncList('matches', matchHistory() as unknown as ListItem[], []);
  if (matches) {
    // (a game recorded here while the server was asked is kept)
    const here = matchHistory();
    const ids = new Set(matches.items.map((m) => m.id));
    replaceMatches([
      ...(matches.items as unknown as MatchRecord[]),
      ...here.filter((m) => !ids.has(m.id)),
    ]);
    changed ||= matchHistory().length !== matchesBefore;
  }
  return changed;
}

let running: Promise<boolean> | null = null;

/** Bring this browser's runs and the server's together. Resolves true when the runs here changed (so a list should be redrawn). */
export function syncRuns(): Promise<boolean> {
  running ??= (async () => {
    try {
      // (signed in or not decides whose Vault: the account's, or this browser's code)
      await whoAmI();
      const theirs = await ask('runs', {});
      if (!theirs) return false;
      const mine = runCopies();
      // what the server lacks, or holds an older copy of, goes up
      const newer = mine.filter((c) => {
        const t = theirs.find((x) => x.id === c.id);
        return !t || c.updated > t.updated;
      });
      const after = newer.length > 0 ? ((await ask('runsave', { runs: newer })) ?? theirs) : theirs;
      return applyRunCopies(after);
    } finally {
      running = null;
    }
  })();
  return running;
}

let timer: number | undefined;

/** A run was saved or ended here: send it up shortly (saves come one after another during a run, so they are gathered). */
export function soonSyncRuns(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    void syncRuns();
    void syncLists();
  }, 4000);
}
