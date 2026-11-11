// Hero mastery in this browser (DECISIONS #739, #741): each Riftwalker's mastery (campaigns cleared with it), the numbers beside it
// (the highest Rift Tier cleared, matches won against players and against ghosts), and the log of what the player has earned.
//
// The server is the one that counts the campaign: from the decks a run saves as it is played, and from the run history. This browser
// shows the server's numbers and keeps a copy so they draw at once. It counts only matches won (the server takes the larger count),
// and, for an offline profile that never reaches the server (the desktop's local saves), the campaign too. What mastery earns is
// given by the server without asking: nothing is claimed.

import { useSyncExternalStore } from 'react';
import type { RunState } from '@sr/campaign';
import {
  cleanEarned,
  cleanMastery,
  sameMastery,
  unseenEarned,
  withArenaWin,
  withCampaignOf,
  withRun,
  withSeen,
  type Earned,
  type Mastery,
} from '@sr/pvp';
import { serverBase } from '../pvp/config';
import { getVaultCode, onMasteryRose, vaultKey, whoAmI } from '../pvp/vaultSync';
import { stagesCleared } from '../pvp/vault';
import { localOnly } from '../playAccess';
import { takeCosmetics } from './cosmetics';

const KEY = 'sr-mastery';
const EARNED_KEY = 'sr-earned';
/** How many cleared runs an offline profile remembers as counted (so a run is never counted twice). */
const RUNS_KEPT = 400;

interface Saved {
  mastery: Mastery;
  /** (an offline profile) the runs whose clear has been counted */
  runs: string[];
  /** the matches whose win has been counted here (the newest), so a match is counted once */
  matches?: string[];
  /** the Vault this copy was last brought together with (the server's mark for it); none before the first time */
  owner?: string;
}

interface State extends Saved {
  earned: Earned[];
}

function load(): State {
  const state: State = { mastery: {}, runs: [], earned: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as {
        mastery?: unknown;
        runs?: unknown;
        matches?: unknown;
        owner?: unknown;
      };
      state.mastery = cleanMastery(v.mastery);
      if (Array.isArray(v.runs))
        state.runs = v.runs.filter((x): x is string => typeof x === 'string').slice(-RUNS_KEPT);
      if (Array.isArray(v.matches))
        state.matches = v.matches.filter((x): x is string => typeof x === 'string').slice(-100);
      if (typeof v.owner === 'string') state.owner = v.owner;
    }
    state.earned = cleanEarned(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
  } catch {
    /* (storage blocked or unreadable: it starts empty, and the Vault still has it) */
  }
  return state;
}

function store(s: State): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        mastery: s.mastery,
        runs: s.runs,
        ...(s.matches?.length ? { matches: s.matches } : {}),
        ...(s.owner ? { owner: s.owner } : {}),
      }),
    );
    localStorage.setItem(EARNED_KEY, JSON.stringify(s.earned));
  } catch {
    /* (storage blocked: it lasts until the page is closed, and the Vault still has it) */
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function set(next: State): void {
  state = next;
  store(next);
  for (const l of listeners) l();
}

const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** This browser's mastery, now. */
export const mastery = (): Mastery => state.mastery;
/** What the player has earned, newest first. */
export const earned = (): Earned[] => state.earned;

/** Hero mastery, for a component: it redraws when it changes. */
export function useMastery(): Mastery {
  return useSyncExternalStore(subscribe, mastery);
}

/** The earned log, for a component. */
export function useEarned(): Earned[] {
  return useSyncExternalStore(subscribe, earned);
}

/**
 * A run as it stands now. Online, nothing is counted here: the server counts the run from the deck it saves after every stop, and
 * tells this browser when a number rose. An offline profile has no server, so its runs are counted here (a clear once per run).
 */
export function noteRun(
  run: Pick<RunState, 'seed' | 'character' | 'tier' | 'phase'> & {
    context?: RunState['context'];
    won?: boolean;
  },
): void {
  if (!localOnly()) return;
  const won = run.won === true;
  const fresh = won && !state.runs.includes(run.seed);
  const next = withRun(
    state.mastery,
    run.character,
    { tier: run.tier, tierCleared: stagesCleared(run) === 3, won },
    fresh,
  );
  if (next === state.mastery && !fresh) return;
  set({
    ...state,
    mastery: next,
    runs: fresh ? [...state.runs, run.seed].slice(-RUNS_KEPT) : state.runs,
  });
}

/**
 * A battle won with this Riftwalker (each game of a best of three is one: DECISIONS #746): against another player, or against a
 * ghost. `match` names the battle, so hearing of its end again (a rejoin) does not count it twice.
 */
export function noteArenaWin(hero: string, ghost: boolean, match: string): void {
  if (state.matches?.includes(match)) return;
  const next = withArenaWin(state.mastery, hero, ghost);
  if (next === state.mastery) return;
  set({ ...state, mastery: next, matches: [...(state.matches ?? []), match].slice(-100) });
  void syncMastery();
}

/** The player has acknowledged these entries of the earned log (every one not yet seen, when none are named). */
export function acknowledge(ids?: readonly string[]): void {
  const which = ids ?? unseenEarned(state.earned).map((e) => e.id);
  if (which.length === 0) return;
  set({ ...state, earned: withSeen(state.earned, which) });
  void syncMastery();
}

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

let flying: Promise<boolean> | null = null;
let again = false;
/** the last try did not reach the server: it is made again when the connection or the window comes back (never on a timer) */
let failed = false;
if (typeof window !== 'undefined') {
  const retry = (): void => {
    if (failed) void syncMastery();
  };
  window.addEventListener('online', retry);
  window.addEventListener('focus', retry);
}

async function syncOnce(): Promise<boolean> {
  try {
    const me = await whoAmI();
    // (a guest with no Vault code has played nothing the server knows of: no Vault is made for them just for opening the page)
    if (!me.signedIn && getVaultCode() === null) return true;
    const key = vaultKey();
    const res = await fetch(`${httpBase()}/pvp/vault/mastery`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...(key === null ? {} : { code: key }),
        // (only its match counts are taken: the server counts the campaign itself)
        mastery: state.mastery,
        ...(state.owner ? { owner: state.owner } : {}),
        seen: state.earned.filter((e) => e.seen).map((e) => e.id),
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      mastery?: unknown;
      cosmetics?: unknown;
      earned?: unknown;
      owner?: unknown;
      reset?: unknown;
    };
    if (!data.ok) return false;
    // (the player may have changed who they are while the request was out: its answer is then another Vault's)
    if (vaultKey() !== key) return false;
    if (data.cosmetics !== undefined) takeCosmetics(data.cosmetics);
    const owner = typeof data.owner === 'string' ? { owner: data.owner } : {};
    const theirs = cleanMastery(data.mastery);
    // This browser's copy was another player's (another account signed in here before): the server took none of it, and this
    // browser starts again from this Vault's numbers, with nothing acknowledged.
    if (data.reset === true) {
      set({ mastery: theirs, runs: [], earned: cleanEarned(data.earned), ...owner });
      return true;
    }
    // (the campaign is the server's to say; a match won or a reward acknowledged here while the request was out is kept)
    const merged = withCampaignOf(theirs, state.mastery);
    const seenHere = new Set(state.earned.filter((e) => e.seen).map((e) => e.id));
    const log = cleanEarned(data.earned).map((e) =>
      seenHere.has(e.id) && !e.seen ? { ...e, seen: true as const } : e,
    );
    if (
      !sameMastery(merged, state.mastery) ||
      JSON.stringify(log) !== JSON.stringify(state.earned) ||
      (owner.owner !== undefined && owner.owner !== state.owner)
    )
      set({ ...state, mastery: merged, earned: log, ...owner });
    return true;
  } catch {
    return false;
  }
}

/**
 * Take the Vault's mastery, what it gave for it (a mastered Riftwalker's card back) and the earned log, and send it the matches
 * won here. One request at a time: a change made while one is out is sent when it comes back. False when the server could not be
 * reached (it is tried again when the connection or the window comes back). An offline profile is never sent.
 */
export function syncMastery(): Promise<boolean> {
  if (localOnly()) return Promise.resolve(false);
  if (flying) {
    again = true;
    return flying;
  }
  flying = (async () => {
    let ok = await syncOnce();
    while (again) {
      again = false;
      ok = await syncOnce();
    }
    flying = null;
    failed = !ok;
    return ok;
  })();
  return flying;
}

// (the server says so when a deck or the run history it was sent raised a number: the new numbers, and what they earned, are fetched)
onMasteryRose(() => void syncMastery());
