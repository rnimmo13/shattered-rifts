// The Vault: the decks a player has banked. These are the pure rules for a list of them (shared by the browser and the server):
// how many it holds, banking into it, and cleaning what arrives from outside. Where it is kept is not decided here.

import { V2_DECK_RULES } from '@sr/content/v2';
import { checkEntry } from './deck';

export interface VaultDeck {
  /** one per cleared loop: the run's seed and Rift Tier */
  id: string;
  hero: string;
  tier: number;
  deck: string[];
  /** the Boons the run held when it was saved (shown with the deck; a match does not use them) */
  boons: string[];
  bankedAt: number;
}

export const VAULT_SLOTS: number = V2_DECK_RULES.vaultSlots;

export type Banked =
  | { ok: true; list: VaultDeck[]; already: boolean }
  | { ok: false; reason: 'full'; list: VaultDeck[] };

/** Put a deck in the Vault. A deck already there (same id) is left as it is; a full Vault says so unless `replaceId` names a deck to give up. */
export function bankInto(list: readonly VaultDeck[], d: VaultDeck, replaceId?: string): Banked {
  if (list.some((x) => x.id === d.id)) return { ok: true, list: [...list], already: true };
  if (replaceId !== undefined) {
    const without = list.filter((x) => x.id !== replaceId);
    if (without.length < VAULT_SLOTS) return { ok: true, list: [...without, d], already: false };
  }
  if (list.length >= VAULT_SLOTS) return { ok: false, reason: 'full', list: [...list] };
  return { ok: true, list: [...list, d], already: false };
}

export function dropFrom(list: readonly VaultDeck[], id: string): VaultDeck[] {
  return list.filter((x) => x.id !== id);
}

/** A deck id made safe to use as a key: letters, digits and `:.~-` only, at most 100 long (a typed run seed can hold anything). */
export const safeId = (raw: string): string => raw.replace(/[^\w:.~-]/g, '_').slice(0, 100);

const BOON_ID = /^[\w-]{1,40}$/;

/** Boon ids as they arrive from outside: a short list of plain ids (whether they exist is for whoever shows them to say). */
function cleanBoons(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const b of raw as unknown[])
    if (typeof b === 'string' && BOON_ID.test(b) && !(b in Object.prototype) && !out.includes(b))
      out.push(b);
  return out.slice(0, 40);
}

/** One deck as it arrives from outside (a browser's saved list, a request): a clean copy if it is a legal deck, else null. */
export function cleanDeck(raw: unknown): VaultDeck | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o['id'] !== 'string' || o['id'] === '') return null;
  const id = safeId(o['id']);
  const at = o['bankedAt'];
  const checked = checkEntry({ name: 'x', hero: o['hero'], deck: o['deck'], tier: o['tier'] });
  if (!checked.ok) return null;
  return {
    id,
    hero: checked.entry.hero,
    tier: checked.entry.tier,
    deck: checked.entry.deck,
    boons: cleanBoons(o['boons']),
    bankedAt: typeof at === 'number' && Number.isFinite(at) ? at : 0,
  };
}

/** A whole saved list: every deck cleaned, anything that is not a legal deck dropped, no more than the slots. */
export function cleanVault(raw: unknown): VaultDeck[] {
  if (!Array.isArray(raw)) return [];
  const out: VaultDeck[] = [];
  for (const x of raw as unknown[]) {
    const d = cleanDeck(x);
    if (d && !out.some((y) => y.id === d.id)) out.push(d);
  }
  return out.slice(0, VAULT_SLOTS);
}

/** Merge two lists of the same player's decks: `first` wins, then whatever `second` adds, up to the slots. */
export function mergeVaults(
  first: readonly VaultDeck[],
  second: readonly VaultDeck[],
): VaultDeck[] {
  const out = [...first];
  for (const d of second)
    if (out.length < VAULT_SLOTS && !out.some((x) => x.id === d.id)) out.push(d);
  return out;
}

/** A Vault code: 16 letters and digits (no 0, 1, I, L, O, U), shown in groups of four. It is the only key to a Vault. */
export const VAULT_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
export const VAULT_CODE_LENGTH = 16;

/** The code as typed (any case, spaces or dashes) in its plain form, or null if it can't be a code. */
export function normaliseCode(raw: string): string | null {
  const s = raw.toUpperCase().replace(/[\s-]+/g, '');
  if (s.length !== VAULT_CODE_LENGTH) return null;
  for (const ch of s) if (!VAULT_CODE_ALPHABET.includes(ch)) return null;
  return s;
}

export const showCode = (code: string): string => code.replace(/(.{4})(?=.)/g, '$1-');
