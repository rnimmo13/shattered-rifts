// The Vault: the decks a player has banked. These are the pure rules for a list of them (shared by the browser and the server):
// how many it holds, banking into it, and cleaning what arrives from outside. Where it is kept is not decided here.

import { V2_DECK_RULES } from '@sr/content/v2';
import { checkEntry } from './deck';

export interface VaultDeck {
  /** one per cleared loop: the run's seed and Rift Tier */
  id: string;
  hero: string;
  tier: number;
  /** stages of the tier cleared when it was saved (0-3; 3 = the tier cleared); absent on older decks */
  stage?: number;
  deck: string[];
  /** the Boons the run held when it was saved (shown with the deck; a match does not use them) */
  boons: string[];
  bankedAt: number;
}

export const VAULT_SLOTS: number = V2_DECK_RULES.vaultSlots;

export type Banked =
  | { ok: true; list: VaultDeck[]; already: boolean }
  | { ok: false; reason: 'full'; list: VaultDeck[] };

/**
 * The run a deck came from. A deck's id is its run's seed; decks saved by older builds had the Rift Tier (and stage) added
 * (`seed:t2`, `seed:t1:s1`), which are the same run.
 */
export const runOf = (id: string): string =>
  id.startsWith(RUN_PREFIX) ? id : RUN_PREFIX + id.replace(/:t\d+(?::.*)?$/, '');

/** New ids are this plus the run's seed, so a seed that happens to contain `:t5` is never mistaken for an older id's tier suffix. */
export const RUN_PREFIX = 'r~';

const sameDeck = (a: VaultDeck, b: VaultDeck): boolean =>
  a.id === b.id &&
  a.hero === b.hero &&
  a.tier === b.tier &&
  a.stage === b.stage &&
  a.deck.length === b.deck.length &&
  a.deck.every((c, i) => c === b.deck[i]) &&
  a.boons.length === b.boons.length &&
  a.boons.every((c, i) => c === b.boons[i]);

/**
 * Put a deck in the Vault. One run keeps one deck: saving the same run again replaces its earlier save (as it stood then) rather than
 * adding a second one. The same deck again is left as it is; a full Vault says so unless `replaceId` names a deck to give up.
 */
export function bankInto(list: readonly VaultDeck[], d: VaultDeck, replaceId?: string): Banked {
  const earlier = list.filter((x) => runOf(x.id) === runOf(d.id));
  const [only] = earlier;
  if (earlier.length === 1 && only && sameDeck(only, d))
    return { ok: true, list: [...list], already: true };
  // an older copy of the run never replaces a newer one (a device that was offline, or an old tab)
  if (earlier.some((x) => x.bankedAt > d.bankedAt))
    return { ok: true, list: [...list], already: true };
  const rest = list.filter((x) => runOf(x.id) !== runOf(d.id) && x.id !== replaceId);
  if (rest.length >= VAULT_SLOTS) return { ok: false, reason: 'full', list: [...list] };
  return { ok: true, list: [...rest, d], already: false };
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
  const checked = checkEntry({
    name: 'x',
    hero: o['hero'],
    deck: o['deck'],
    tier: o['tier'],
    stage: o['stage'],
  });
  if (!checked.ok) return null;
  return {
    id,
    hero: checked.entry.hero,
    tier: checked.entry.tier,
    ...(checked.entry.stage === undefined ? {} : { stage: checked.entry.stage }),
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
    if (d) out.push(d);
  }
  return oneEach(out).slice(0, VAULT_SLOTS);
}

/** One deck per run: of several saves of the same run (older builds kept one per tier or stage) the newest stays, in the place of the first. */
export function oneEach(list: readonly VaultDeck[]): VaultDeck[] {
  const out: VaultDeck[] = [];
  for (const d of list) {
    const i = out.findIndex((x) => runOf(x.id) === runOf(d.id));
    const at = out[i];
    if (!at) out.push(d);
    else if (d.bankedAt > at.bankedAt) out[i] = d;
  }
  return out;
}

/** Merge two lists of the same player's decks: `first` leads, then whatever `second` adds, up to the slots; of two saves of one run the newer wins. */
export function mergeVaults(
  first: readonly VaultDeck[],
  second: readonly VaultDeck[],
): VaultDeck[] {
  const kept = oneEach(first);
  const out = [...kept];
  for (const d of oneEach(second)) {
    const i = out.findIndex((x) => runOf(x.id) === runOf(d.id));
    const at = out[i];
    if (at) {
      if (d.bankedAt > at.bankedAt) out[i] = d;
    } else if (out.length < VAULT_SLOTS) out.push(d);
  }
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
