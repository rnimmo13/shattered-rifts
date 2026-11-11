// The Vault: the decks a player has banked. These are the pure rules for a list of them (shared by the browser and the server):
// how many it holds, banking into it, and cleaning what arrives from outside. Where it is kept is not decided here.

import { V2_DECK_RULES, ascendancyOf, withStartingWeapons } from '@sr/content/v2';
import { checkEntry, cleanMaxHp } from './deck';
import { periodStart } from './board';

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
  /** the Ascendancy the run took (DECISIONS #519) */
  ascendancy?: string;
  /** the run's Max HP when it was saved: its ghost Warden starts from it (DECISIONS #538); absent on older decks */
  maxHp?: number;
  /** its run cleared the campaign (DECISIONS #739); absent on decks saved before, which the run history speaks for */
  won?: true;
  bankedAt: number;
  /** (DECISIONS #436) its deck holds the starting weapon as a card (missing: saved before; the weapon is added once) */
  weaponCards?: true;
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

/**
 * A short fingerprint of a deck's run, safe to send to the server and to opponents (the seed itself is not): saves of the same run get the
 * same key, so the server keeps one ghost deck per run instead of one per save. (cyrb53, 14 hex digits.)
 */
export function runKey(id: string): string {
  const text = runOf(id);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

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
  a.boons.every((c, i) => c === b.boons[i]) &&
  a.ascendancy === b.ascendancy &&
  a.maxHp === b.maxHp &&
  a.won === b.won;

/**
 * Put a deck in the Vault. One run keeps one deck: saving the same run again replaces its earlier save (as it stood then) rather than
 * adding a second one. The same deck again is left as it is; a full Vault says so unless `replaceId` names a deck to give up.
 */
export function bankInto(list: readonly VaultDeck[], saved: VaultDeck, replaceId?: string): Banked {
  const earlier = list.filter((x) => runOf(x.id) === runOf(saved.id));
  // (a run that cleared the campaign stays marked so, whatever saves it again: an older build does not know the mark, DECISIONS #739)
  const d: VaultDeck = !saved.won && earlier.some((x) => x.won) ? { ...saved, won: true } : saved;
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
  // (a deck saved before the weapons were cards of the deck gets its weapon once, DECISIONS #436)
  const rawDeck =
    o['weaponCards'] !== true && Array.isArray(o['deck']) && typeof o['hero'] === 'string'
      ? withStartingWeapons(o['hero'], o['deck'] as string[])
      : o['deck'];
  const checked = checkEntry({
    name: 'x',
    hero: o['hero'],
    deck: rawDeck,
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
    ...(ascendancyOf(checked.entry.hero, o['ascendancy'])
      ? { ascendancy: (ascendancyOf(checked.entry.hero, o['ascendancy']) as { id: string }).id }
      : {}),
    ...(cleanMaxHp(o['maxHp']) === null ? {} : { maxHp: cleanMaxHp(o['maxHp']) as number }),
    ...(o['won'] === true ? { won: true as const } : {}),
    bankedAt: typeof at === 'number' && Number.isFinite(at) ? at : 0,
    weaponCards: true,
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

// ---- seasons (DECISIONS #736, #737) ----

/**
 * The first season that begins with a wipe: December 2026 (the 1st, midnight Pacific). Decks saved before the rule was announced are
 * kept until then, so nobody loses a deck without having been told.
 */
export const FIRST_DECK_WIPE = 1_796_112_000_000;

/**
 * A saved deck lasts the season it was last saved in: when the monthly leaderboard rolls over, it is wiped. (A run still going saves
 * its deck again as it plays on, so its deck is the new season's.)
 */
export function deckExpired(d: Pick<VaultDeck, 'bankedAt'>, now: number): boolean {
  const season = periodStart(now, 'month');
  return season >= FIRST_DECK_WIPE && d.bankedAt < season;
}

/** The decks of the list that are still this season's. */
export const inSeason = <T extends Pick<VaultDeck, 'bankedAt'>>(
  list: readonly T[],
  now: number,
): T[] => list.filter((d) => !deckExpired(d, now));

/** How far ahead of the server's clock a deck's save time may be before it is taken as saved now (a device whose clock is wrong). */
export const BANK_CLOCK_SLACK_MS = 10 * 60_000;
