// Run saves in the browser. A player can keep up to RUN_SLOTS unfinished runs at once (a saved deck can be "pocketed" and the run
// left parked while other runs are played). Each run lives in its own slot, and the run screen holds on to the id of the slot it
// is playing: it only ever writes to that slot, so another tab cannot make it overwrite a different run. The "active" key says
// only which run the run screen should open. Storage can be unavailable (private windows, blocked site data), so every call is
// guarded and the game still works without it (the run just is not remembered).

import { parseRun, serializeRun, type RunState } from '@sr/campaign';

/** How many unfinished runs a player can keep. */
export const RUN_SLOTS = 3;

/** The single save the game kept before runs could be parked; moved into a slot on first use. */
const LEGACY_KEY = 'sr.run.v2';
const SLOTS_KEY = 'sr.runs.v3';
const ACTIVE_KEY = 'sr.run.active';

interface Slot {
  id: string;
  text: string;
  updated: number;
}

export interface SavedRun {
  id: string;
  run: RunState;
  updated: number;
}

const newSlotId = (): string =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

function parseSlots(raw: string | null): Slot[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return (v as unknown[]).filter(
      (s): s is Slot =>
        typeof s === 'object' &&
        s !== null &&
        typeof (s as Slot).id === 'string' &&
        typeof (s as Slot).text === 'string' &&
        typeof (s as Slot).updated === 'number',
    );
  } catch {
    return [];
  }
}

/** Write the slots and read them back: true only if what was written is what is now stored. */
function writeSlots(slots: readonly Slot[]): boolean {
  try {
    const text = JSON.stringify(slots);
    localStorage.setItem(SLOTS_KEY, text);
    return localStorage.getItem(SLOTS_KEY) === text;
  } catch {
    return false;
  }
}

/** An older build's single save becomes a parked run (and the active one, so `#/run` still resumes it). */
function migrateLegacy(): void {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;
    const slots = parseSlots(localStorage.getItem(SLOTS_KEY));
    if (slots.some((s) => s.text === legacy)) {
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    // no room: the old save stays where it is, untouched, rather than being lost
    if (slots.length >= RUN_SLOTS) return;
    const id = newSlotId();
    if (!writeSlots([...slots, { id, text: legacy, updated: Date.now() }])) return;
    localStorage.removeItem(LEGACY_KEY);
    if (!localStorage.getItem(ACTIVE_KEY)) localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* try again next time */
  }
}

function readSlots(): Slot[] {
  migrateLegacy();
  try {
    return parseSlots(localStorage.getItem(SLOTS_KEY));
  } catch {
    return [];
  }
}

export function activeRunId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

/** Choose which saved run the run screen opens (null: none, so it opens on a new run). */
export function setActiveRun(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

/** How many slots are taken, counting any that cannot be read (they are kept, not thrown away). */
export const runCount = (): number => readSlots().length;

/** Every saved run that can be read, most recently played first. */
export function listRuns(): SavedRun[] {
  const out: SavedRun[] = [];
  for (const s of readSlots()) {
    const run = parseRun(s.text);
    if (run) out.push({ id: s.id, run, updated: s.updated });
  }
  return out.sort((a, b) => b.updated - a.updated);
}

/**
 * The saved runs this build cannot read (a save from a build with other rules, or one that was damaged). They still take a slot, so
 * the home page lists them, to copy for a bug report or to remove (DECISIONS #277); they are never thrown away on their own.
 */
export function unreadableRuns(): { id: string; text: string; updated: number }[] {
  return readSlots()
    .filter((s) => parseRun(s.text) === null)
    .map((s) => ({ id: s.id, text: s.text, updated: s.updated }));
}

/** The run the active key points at, with the id of its slot (null when there is none or it cannot be read). */
export function loadActiveRun(): { id: string; run: RunState } | null {
  const id = activeRunId();
  if (!id) return null;
  const slot = readSlots().find((s) => s.id === id);
  if (!slot) return null;
  const run = parseRun(slot.text);
  if (!run) {
    // keep what could not be read, so a bug in a newer build can never silently destroy someone's run
    try {
      localStorage.setItem(`sr.run.rejected.${slot.id}`, slot.text);
    } catch {
      /* ignore */
    }
    return null;
  }
  return { id, run };
}

/** Put a new run in a free slot and make it the active one; null if every slot is taken (nothing is thrown away to make room). */
export function startRunSlot(run: RunState): string | null {
  const slots = readSlots();
  if (slots.length >= RUN_SLOTS) return null;
  const id = newSlotId();
  if (!writeSlots([...slots, { id, text: serializeRun(run), updated: Date.now() }])) return null;
  setActiveRun(id);
  return id;
}

/** Save a run into its own slot. False if that slot no longer exists (the run was abandoned elsewhere): it is not brought back. */
export function saveRunSlot(id: string, run: RunState): boolean {
  const slots = readSlots();
  const i = slots.findIndex((s) => s.id === id);
  if (i < 0) return false;
  slots[i] = { id, text: serializeRun(run), updated: Date.now() };
  return writeSlots(slots);
}

/** Throw away one saved run. */
export function clearSavedRun(id: string | null = activeRunId()): void {
  if (!id) return;
  writeSlots(readSlots().filter((s) => s.id !== id));
  if (id === activeRunId()) setActiveRun(null);
}

/** Throw away every saved run (a last resort when a save keeps crashing the game). */
export function clearAllRuns(): void {
  try {
    localStorage.removeItem(SLOTS_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  setActiveRun(null);
}

// A duel that was begun and then left (the page closed) counts as lost. The marker is kept per run, so leaving one run's duel
// does not forget another's.
const STARTED = 'sr.duel.started';
const startedKey = (key: string): string => `${STARTED}:${key.split(':')[0]}`;

/** Remember that this duel was begun. If the page is reloaded mid-duel, that duel counts as lost. */
export function markDuelStarted(key: string): void {
  try {
    localStorage.setItem(startedKey(key), key);
  } catch {
    /* ignore */
  }
}

export function duelWasStarted(key: string): boolean {
  try {
    return localStorage.getItem(startedKey(key)) === key;
  } catch {
    return false;
  }
}

/** Forget one run's marker (given its duel key), or every marker. */
export function clearDuelStarted(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(startedKey(key));
      return;
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(`${STARTED}:`)) localStorage.removeItem(k);
    }
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
