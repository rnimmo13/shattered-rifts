// Runs that follow a player from device to device (DECISIONS #309). Each device keeps its runs in the browser; the player's Vault
// on the server keeps a copy of each too. A copy is a run's saved text and when it was saved; a run that ended or was abandoned
// leaves a "gone" copy behind, so the other devices let it go as well. Whichever copy of a run is newest wins. Pure: the browser and
// the server both use these.

/** One run as one device (or the server) knows it. */
export interface RunCopy {
  /** the run's slot id (made by the device that started it) */
  id: string;
  /** when this copy was saved, epoch ms */
  updated: number;
  /** the run, as the campaign saves it (absent on a gone copy) */
  text?: string;
  /** the run ended or was abandoned */
  gone?: boolean;
}

/** The longest saved run the server keeps (a long run is a few KB). */
export const MAX_RUN_TEXT = 200_000;
/** The most copies one Vault keeps (live runs and gone ones together); the oldest gone ones are let go first. */
export const MAX_RUN_COPIES = 300;
/** A gone copy is kept this long, so a device that has been away a while still hears that the run is over, ms. */
export const GONE_KEEP_MS = 90 * 24 * 60 * 60 * 1000;

const RUN_ID = /^[A-Za-z0-9-]{1,40}$/;

/** Whatever arrived (from a browser, or the server) as run copies: anything malformed is left out. */
export function cleanRunCopies(raw: unknown): RunCopy[] {
  if (!Array.isArray(raw)) return [];
  const out: RunCopy[] = [];
  for (const v of raw as unknown[]) {
    if (typeof v !== 'object' || v === null) continue;
    const r = v as Record<string, unknown>;
    const id = r['id'];
    const updated = r['updated'];
    if (typeof id !== 'string' || !RUN_ID.test(id)) continue;
    if (typeof updated !== 'number' || !Number.isFinite(updated) || updated < 0) continue;
    if (r['gone'] === true) {
      out.push({ id, updated, gone: true });
      continue;
    }
    const text = r['text'];
    if (typeof text !== 'string' || text.length === 0 || text.length > MAX_RUN_TEXT) continue;
    out.push({ id, updated, text });
  }
  // (one copy per run: the newest)
  return newestPerRun(out);
}

/** Which of two copies of a run stands: a run that ended stays ended (a gone copy beats any live one), else the newer copy. */
function better(a: RunCopy, b: RunCopy): RunCopy {
  if (!!a.gone !== !!b.gone) return a.gone ? a : b;
  return b.updated > a.updated ? b : a;
}

function newestPerRun(copies: readonly RunCopy[]): RunCopy[] {
  const best = new Map<string, RunCopy>();
  for (const c of copies) {
    const have = best.get(c.id);
    best.set(c.id, have ? better(have, c) : c);
  }
  return [...best.values()];
}

/**
 * Bring a device's runs and the server's together: a run that ended anywhere stays ended; otherwise the newest copy wins (a tie
 * goes to the device's own). `merged` is
 * every run as it now stands (gone ones included, so they are remembered); `push` is what the server lacks or holds an older copy of.
 * Gone copies older than GONE_KEEP_MS are forgotten.
 */
export function mergeRunCopies(
  local: readonly RunCopy[],
  remote: readonly RunCopy[],
  now: number,
): { merged: RunCopy[]; push: RunCopy[] } {
  const mine = new Map(newestPerRun(local).map((c) => [c.id, c]));
  const theirs = new Map(newestPerRun(remote).map((c) => [c.id, c]));
  const merged: RunCopy[] = [];
  const push: RunCopy[] = [];
  for (const id of new Set([...mine.keys(), ...theirs.keys()])) {
    const l = mine.get(id);
    const r = theirs.get(id);
    // (a run that ended on any device stays ended: a later save from a device that still had it open cannot bring it back)
    const win = !r ? l : !l ? r : better(r, l);
    if (!win) continue;
    if (win.gone && now - win.updated > GONE_KEEP_MS) continue;
    merged.push(win);
    if (win === l && (!r || r.updated !== l.updated || !!r.gone !== !!l.gone)) push.push(l);
  }
  return { merged, push };
}

/** What a Vault keeps when copies arrive: the newest of each run, at most MAX_RUN_COPIES (live runs before gone ones, newest first). */
export function keepRunCopies(have: readonly RunCopy[], arrived: readonly RunCopy[]): RunCopy[] {
  const all = newestPerRun([...have, ...arrived]);
  return all
    .sort((a, b) => Number(!!a.gone) - Number(!!b.gone) || b.updated - a.updated)
    .slice(0, MAX_RUN_COPIES);
}
