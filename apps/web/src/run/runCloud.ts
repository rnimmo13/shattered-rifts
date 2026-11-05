// Runs that follow the player from device to device (DECISIONS #309): this browser's runs and the copies in the player's Vault on the
// server (their account when signed in, else this browser's Vault code) are brought together, the newest copy of each run winning.
// The browser's runs always work without the server: this only adds the copy, and never holds the game up.

import {
  cleanListItems,
  type ListItem,
  type ListName,
  type RunCopy,
  cleanRunCopies,
  RULES_VERSION,
} from '@sr/pvp';
import { BUILD } from '../build';
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
import { adoptSharedRuns, adoptSharedReplays, runCopies, sharedReplays } from './saves';
import {
  canPlay,
  localOnly,
  pausePlay,
  playRevision,
  playState,
  setPlayRevision,
} from '../playAccess';

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

/** Ask the player's Vault; null when the server cannot be reached or says no. */
async function ask(
  action: 'runs' | 'runsave',
  body: Record<string, unknown>,
): Promise<{ runs: RunCopy[]; revision: number; replays: unknown } | null> {
  try {
    const key = vaultKey();
    const res = await fetch(`${httpBase()}/pvp/vault/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...(key === null ? {} : { code: key }),
        ...body,
        ...(action === 'runsave'
          ? { balanceRules: RULES_VERSION, balanceVersion: BUILD.version }
          : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as {
      ok?: unknown;
      runs?: unknown;
      revision?: unknown;
      replays?: unknown;
    };
    return data.ok === true && typeof data.revision === 'number'
      ? { runs: cleanRunCopies(data.runs), revision: data.revision, replays: data.replays }
      : null;
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
      body: JSON.stringify({
        ...(key === null ? {} : { code: key }),
        ...body,
        readOnly: !canPlay(),
      }),
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
  if (localOnly()) return false;
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
  if (localOnly()) return Promise.resolve(false);
  running ??= (async () => {
    try {
      // (signed in or not decides whose Vault: the account's, or this browser's code)
      await whoAmI();
      const epoch = playState().epoch;
      const theirs = await ask('runs', {});
      if (!theirs) return false;
      if (playState().epoch !== epoch) return false;
      if (!canPlay()) {
        if (theirs.revision === 0 && theirs.runs.length === 0) return false;
        const changed = adoptSharedRuns(theirs.runs);
        adoptSharedReplays(theirs.replays);
        return changed;
      }
      if (theirs.revision !== playRevision()) {
        pausePlay('Another confirmed save exists. Reconnect to load it before playing.');
        return false;
      }
      const mine = runCopies();
      // what the server lacks, or holds an older copy of, goes up
      const newer = mine.filter((c) => {
        const t = theirs.runs.find((x) => x.id === c.id);
        return !t || c.text !== t.text || !!c.gone !== !!t.gone;
      });
      const replays = sharedReplays();
      if (!newer.length && JSON.stringify(replays) === JSON.stringify(theirs.replays ?? {}))
        return false;
      const after = await ask('runsave', { runs: newer, revision: playRevision(), replays });
      if (!after) return false;
      setPlayRevision(after.revision);
      return adoptSharedRuns(after.runs, mine);
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
