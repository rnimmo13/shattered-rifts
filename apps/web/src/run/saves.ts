// Run saves in the browser. Storage can be unavailable (private windows, blocked site data), so every call is
// guarded and the game still works without it (the run just is not remembered).

import { parseRun, serializeRun, type RunState } from '@sr/campaign';

const KEY = 'sr.run.v2';

export function loadSavedRun(): RunState | null {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return null;
    const run = parseRun(text);
    // keep what we could not read, so a bug in a newer build can never silently destroy someone's run
    if (!run) localStorage.setItem(`${KEY}.rejected`, text);
    return run;
  } catch {
    return null;
  }
}

const STARTED = 'sr.duel.started';

/** Remember that this duel was begun. If the page is reloaded mid-duel, that duel counts as lost. */
export function markDuelStarted(key: string): void {
  try {
    localStorage.setItem(STARTED, key);
  } catch {
    /* ignore */
  }
}

export function duelWasStarted(key: string): boolean {
  try {
    return localStorage.getItem(STARTED) === key;
  } catch {
    return false;
  }
}

export function clearDuelStarted(): void {
  try {
    localStorage.removeItem(STARTED);
  } catch {
    /* ignore */
  }
}

export function saveRun(run: RunState): void {
  try {
    localStorage.setItem(KEY, serializeRun(run));
  } catch {
    /* not fatal: the run continues unsaved */
  }
}

export function clearSavedRun(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Download the run as a .json file (only ever started by the player pressing Export). */
export function exportRun(run: RunState): void {
  const blob = new Blob([serializeRun(run)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shattered-rifts-run-${run.seed}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
