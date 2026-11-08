// Keeping the Vault on the server as well as in this browser. A player has no account: a random Vault code is made here and is the
// key to their saved decks; typing it on another device brings the same decks there. The browser copy (vault.ts) always works
// without the server; this only adds a second copy and the means to move it.

import {
  cleanVault,
  mergeVaults,
  normaliseCode,
  runOf,
  VAULT_CODE_ALPHABET,
  VAULT_CODE_LENGTH,
  type VaultDeck,
} from '@sr/pvp';
import { serverBase, getName } from './config';
import { desktopBridge } from '../desktopBridge';

const CODE_KEY = 'sr-vault-code';
/** the code in use, kept here too so it is the same code everywhere even when storage is blocked */
let made: string | null = null;

export function getVaultCode(): string | null {
  try {
    const c = localStorage.getItem(CODE_KEY);
    return c ? normaliseCode(c) : null;
  } catch {
    return null;
  }
}

export function setVaultCode(code: string): void {
  made = code;
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* not saved (storage blocked): the code lasts until the page is closed */
  }
}

/** A new random code. Bytes are drawn until one fits the alphabet evenly, so no letter is likelier than another. */
export function makeVaultCode(): string {
  const n = VAULT_CODE_ALPHABET.length;
  const limit = 256 - (256 % n);
  let out = '';
  while (out.length < VAULT_CODE_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    for (const b of bytes) {
      if (b < limit && out.length < VAULT_CODE_LENGTH) out += VAULT_CODE_ALPHABET[b % n];
    }
  }
  return out;
}

/** The code this browser uses, made on first need. */
export function ensureVaultCode(): string {
  const have = getVaultCode() ?? made;
  if (have) return have;
  made = makeVaultCode();
  setVaultCode(made);
  return made;
}

/**
 * Why a call failed. 'play': another device holds play, so this one may only read (#579); 'signin': the account's sign-in has ended
 * (on the desktop app, its Google session expired and needs reconnecting).
 */
export type RemoteError = 'full' | 'offline' | 'bad-deck' | 'bad-code' | 'play' | 'signin';

export type Remote =
  | { ok: true; decks: VaultDeck[] }
  | { ok: false; error: RemoteError; decks: VaultDeck[] };

/** The server's web address: the same host as the game's socket. */
const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

async function call(action: string, body: Record<string, unknown>): Promise<Remote> {
  try {
    const res = await fetch(`${httpBase()}/pvp/vault/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; decks?: unknown };
    const decks = cleanVault(data.decks);
    if (data.ok) return { ok: true, decks };
    const e = data.error;
    if (e === 'signin') {
      // the desktop app's Google session ended: it stays the account's (never a device-only Vault in its place, which hid the
      // account's decks without a word, 2026-11-07) and asks to be reconnected
      if (desktopBridge() && desktopGoogle) accountExpired = true;
      else {
        // the browser's session ended (it expired, or was cleared elsewhere): treat this browser as a guest again
        signedIn = false;
        me = null;
      }
    }
    return {
      ok: false,
      error:
        e === 'full' || e === 'bad-deck' || e === 'bad-code' || e === 'signin'
          ? e
          : e === 'play-required'
            ? 'play'
            : 'offline',
      decks,
    };
  } catch {
    return { ok: false, error: 'offline', decks: [] };
  }
}

/** Whose Vault: a Vault code, or null for the signed-in account (the server knows them from their session cookie). */
export type Key = string | null;

const withKey = (key: Key, rest: Record<string, unknown>): Record<string, unknown> =>
  key === null ? rest : { code: key, ...rest };

export const remoteVault = {
  list: (key: Key): Promise<Remote> => call('list', withKey(key, {})),
  bank: (key: Key, deck: VaultDeck, replaceId?: string): Promise<Remote> =>
    call(
      'bank',
      withKey(key, {
        deck,
        // (the name the deck will have as a ghost)
        name: getName(),
        ...(replaceId === undefined ? {} : { replaceId }),
      }),
    ),
  drop: (key: Key, id: string): Promise<Remote> => call('drop', withKey(key, { id })),
};

// ---- signing in (Google, on the game's own address) ----

let signedIn = false;
let me: Promise<Me> | null = null;
/** (the desktop app) a Google account is saved on this device */
let desktopGoogle = false;
/** (the desktop app) that account's session has ended: it must be reconnected before its decks can be read */
let accountExpired = false;

/** The desktop app's Google session has ended and needs reconnecting (Settings > Account). False in a browser. */
export const accountNeedsReconnect = (): boolean => accountExpired;

export interface Me {
  signedIn: boolean;
  /** this server has sign-in set up and this page is on its address (sign-in uses a cookie, so no other address can use it) */
  available: boolean;
}

/** Who is using this browser. Asked once; `refreshMe` asks again (after signing out). */
export function whoAmI(): Promise<Me> {
  const desktop = desktopBridge();
  if (desktop)
    return desktop
      .status()
      .then((status) => {
        // (a saved Google account whose session ended is still the account: its Vault is the account's, and the game asks for a
        // reconnect instead of quietly using a device-only Vault code)
        desktopGoogle = status.provider === 'google';
        accountExpired = desktopGoogle && !status.online;
        signedIn = status.online || desktopGoogle;
        return { signedIn, available: status.available === true };
      })
      .catch(() => ({ signedIn: false, available: false }));
  me ??= (async (): Promise<Me> => {
    try {
      const base = httpBase();
      if (new URL(base).origin !== window.location.origin)
        return { signedIn: false, available: false };
      const r = (await (await fetch(`${base}/auth/me`)).json()) as {
        signedIn?: boolean;
        available?: boolean;
      };
      signedIn = r.signedIn === true;
      return { signedIn, available: r.available === true };
    } catch {
      me = null; // not remembered, so a failed check is asked again
      return { signedIn: false, available: false };
    }
  })();
  return me;
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${httpBase()}/auth/logout`, { method: 'POST' });
  } catch {
    /* the cookie stays until it expires */
  }
  signedIn = false;
  me = null;
}

export const signInUrl = (to: 'home' | 'arena' = 'arena'): string =>
  `${httpBase()}/auth/google/start?to=${to}`;

/** The key to use for the Vault now: null when signed in (call `whoAmI` first), else this browser's Vault code. */
export const vaultKey = (): Key => (signedIn ? null : ensureVaultCode());

export type Synced =
  | {
      ok: true;
      decks: VaultDeck[];
      /** every deck this device holds is online too */
      complete: boolean;
      /** why some of this device's decks are not online yet: another device holds play, the online Vault is full, or a save failed */
      waiting?: 'play' | 'full' | 'offline';
    }
  | { ok: false; error: RemoteError; decks: VaultDeck[] };

/**
 * The runs whose decks this device has seen online, for each Vault (the account's, or a Vault code's). A deck this device holds that
 * the server no longer has was removed elsewhere if it was seen there before (it goes here too), and is new on this device if not (it
 * goes up). Before this, every deck the server lacked was sent back up, so a deck removed or replaced on another device came back,
 * and while another device held play the refused upload left this device's old list on show (2026-11-07). With nothing seen yet (the
 * first sync after the update) every deck goes up once, as before, so none is lost.
 */
const SEEN_KEY = 'sr.vaultSeen';

/** For one Vault: each run seen online, with the newest save of it seen there (its `bankedAt`). */
function seenFor(key: Key): Map<string, number> {
  try {
    const all: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}');
    const one = all && typeof all === 'object' ? (all as Record<string, unknown>)[key ?? ''] : null;
    const out = new Map<string, number>();
    if (one && typeof one === 'object' && !Array.isArray(one))
      for (const [run, at] of Object.entries(one as Record<string, unknown>))
        if (typeof at === 'number') out.set(run, at);
    return out;
  } catch {
    return new Map();
  }
}

function rememberSeen(key: Key, seen: Map<string, number>): void {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}');
    const all = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    // (the newest 200 runs are plenty: a Vault holds far fewer)
    all[key ?? ''] = Object.fromEntries([...seen].sort((a, b) => a[1] - b[1]).slice(-200));
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: the next sync uploads what it cannot tell apart, as before */
  }
}

const PENDING_KEY = 'sr.pendingDrops';

function pendingRuns(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function setPendingRuns(runs: string[]): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(runs.slice(-50)));
  } catch {
    /* storage unavailable: the drop is simply not remembered */
  }
}

/**
 * Remove every online deck saved from a run (a run that collapsed). Returns how many went, or null if the server could not be
 * reached or refused: then the run is remembered and the drop is retried at the next sync, which also keeps the deck out of the
 * browser's list until then.
 */
export async function forgetRun(code: Key, run: string): Promise<number | null> {
  const r = await remoteVault.list(code);
  let ok = r.ok;
  let n = 0;
  if (r.ok) {
    for (const d of r.decks.filter((x) => runOf(x.id) === run)) {
      const g = await remoteVault.drop(code, d.id);
      if (g.ok) n++;
      else ok = false;
    }
  }
  const rest = pendingRuns().filter((x) => x !== run);
  setPendingRuns(ok ? rest : [...rest, run]);
  return ok ? n : null;
}

/**
 * Bring this device's decks and the server's together. The server's list is the one to show: a deck saved on this device and not yet
 * online (new here, or a newer save of a run) goes up first, as far as the slots and the play claim allow; a deck the server no longer
 * has that this device saw there before was removed on another device and leaves this list too. Decks that could not go up yet stay
 * in the list beside the server's, and `waiting` says why. If the server can't be reached at all, this device's list stands.
 */
export async function syncVault(code: Key, localAll: readonly VaultDeck[]): Promise<Synced> {
  // runs that collapsed while the server could not be reached: finish dropping their decks before anything is merged back
  for (const run of pendingRuns()) await forgetRun(code, run);
  const gone = new Set(pendingRuns());
  const local = localAll.filter((d) => !gone.has(runOf(d.id)));
  let r = await remoteVault.list(code);
  if (!r.ok) return { ok: false, error: r.error, decks: [...local] };
  const seen = seenFor(code);
  const newer = (d: VaultDeck, list: readonly VaultDeck[]): boolean =>
    !list.some((x) => runOf(x.id) === runOf(d.id) && x.bankedAt >= d.bankedAt);
  // this device's decks the server should have: new here, or a newer save than any seen online. A save no newer than one seen online
  // that the server no longer holds was removed on another device. (By date, not by run: a run whose deck was removed elsewhere and
  // then played on here saves a newer deck, and that one goes up; review of 2026-11-07)
  const toSend = local.filter((d) => {
    if (!newer(d, r.decks)) return false;
    const seenAt = seen.get(runOf(d.id));
    const onServer = r.decks.some((x) => runOf(x.id) === runOf(d.id));
    return onServer || seenAt === undefined || d.bankedAt > seenAt;
  });
  let waiting: 'play' | 'full' | 'offline' | undefined;
  for (const d of toSend) {
    const next = await remoteVault.bank(code, d);
    if (next.ok) r = next;
    // (a deck the server will not take is skipped; the rest still go up)
    else if (next.error === 'bad-deck' || next.error === 'bad-code') continue;
    else {
      waiting = next.error === 'full' ? 'full' : next.error === 'play' ? 'play' : 'offline';
      if (next.error === 'full') r = { ok: true, decks: next.decks };
      break;
    }
  }
  const server = r.decks;
  for (const x of server) {
    const run = runOf(x.id);
    seen.set(run, Math.max(seen.get(run) ?? 0, x.bankedAt));
  }
  rememberSeen(code, seen);
  // what did not get online yet stays in this device's list, in front, beside everything the server holds
  const left = toSend.filter((d) => newer(d, server));
  return {
    ok: true,
    complete: left.length === 0,
    decks: mergeVaults(left, server),
    ...(left.length && waiting ? { waiting } : {}),
  };
}
