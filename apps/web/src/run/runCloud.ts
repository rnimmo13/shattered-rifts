// Runs that follow the player from device to device (DECISIONS #309): this browser's runs and the copies in the player's Vault on the
// server (their account when signed in, else this browser's Vault code) are brought together, the newest copy of each run winning.
// The browser's runs always work without the server: this only adds the copy, and never holds the game up.

import { cleanRunCopies, type RunCopy } from '@sr/pvp';
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
  timer = window.setTimeout(() => void syncRuns(), 4000);
}
