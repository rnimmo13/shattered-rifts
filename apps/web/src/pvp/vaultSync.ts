// Keeping the Vault on the server as well as in this browser. A player has no account: a random Vault code is made here and is the
// key to their saved decks; typing it on another device brings the same decks there. The browser copy (vault.ts) always works
// without the server; this only adds a second copy and the means to move it.

import {
  cleanVault,
  mergeVaults,
  normaliseCode,
  VAULT_CODE_ALPHABET,
  VAULT_CODE_LENGTH,
  type VaultDeck,
} from '@sr/pvp';
import { serverBase } from './config';

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

export type Remote =
  | { ok: true; decks: VaultDeck[] }
  | { ok: false; error: 'full' | 'offline' | 'bad-deck' | 'bad-code'; decks: VaultDeck[] };

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
    return {
      ok: false,
      error: e === 'full' || e === 'bad-deck' || e === 'bad-code' ? e : 'offline',
      decks,
    };
  } catch {
    return { ok: false, error: 'offline', decks: [] };
  }
}

export const remoteVault = {
  list: (code: string): Promise<Remote> => call('list', { code }),
  bank: (code: string, deck: VaultDeck, replaceId?: string): Promise<Remote> =>
    call('bank', replaceId === undefined ? { code, deck } : { code, deck, replaceId }),
  drop: (code: string, id: string): Promise<Remote> => call('drop', { code, id }),
};

export type Synced =
  | { ok: true; decks: VaultDeck[]; complete: boolean }
  | { ok: false; error: 'offline' | 'bad-code' | 'full' | 'bad-deck'; decks: VaultDeck[] };

/**
 * Bring the browser's decks and the server's together: whatever the browser has that the server lacks goes up (as far as the
 * slots allow), and the result is what the server now holds. If the server can't be reached the browser's list stands.
 */
export async function syncVault(code: string, local: readonly VaultDeck[]): Promise<Synced> {
  let r = await remoteVault.list(code);
  if (!r.ok) return { ok: false, error: r.error, decks: [...local] };
  for (const d of local) {
    if (r.decks.some((x) => x.id === d.id)) continue;
    const next = await remoteVault.bank(code, d);
    if (next.ok) r = next;
    else if (next.error === 'full') {
      r = { ok: true, decks: next.decks };
      break;
    } else if (next.error === 'offline') return { ok: false, error: 'offline', decks: [...local] };
  }
  const server = r.decks;
  // everything fitted: the two lists are now one. Otherwise the server is full of other decks, so the browser's list stands
  // (nothing is lost on either side) and the caller is told it is not all online.
  const complete = local.every((d) => server.some((x) => x.id === d.id));
  return { ok: true, complete, decks: complete ? mergeVaults(local, server) : [...local] };
}
