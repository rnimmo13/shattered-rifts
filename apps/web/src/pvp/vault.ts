// The Vault: the decks a player has banked, kept in this browser (localStorage) until there are accounts. A banked deck is
// what you take into a PvP match. The functions that change a list are pure (and tested); only load and save touch storage.

import type { RunState } from '@sr/campaign';
import { checkEntry, type Entry } from '@sr/pvp';
import { RIFTWALKERS, V2_DECK_RULES, type HeroId } from '@sr/content/v2';

export interface VaultDeck {
  /** one per cleared loop: the run's seed and Rift Tier */
  id: string;
  hero: string;
  tier: number;
  deck: string[];
  bankedAt: number;
}

export const VAULT_SLOTS: number = V2_DECK_RULES.vaultSlots;
const KEY = 'sr-vault-v1';

/** The deck a banked run leaves in the Vault. */
export function deckFromRun(
  run: Pick<RunState, 'seed' | 'tier' | 'character' | 'deck'>,
  now: number,
): VaultDeck {
  return {
    id: `${run.seed}:t${run.tier}`,
    hero: run.character,
    tier: run.tier,
    deck: [...run.deck],
    bankedAt: now,
  };
}

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

/** What a PvP match is told about a deck. */
export function entryFor(d: VaultDeck, name: string): Entry {
  return { name, hero: d.hero, deck: [...d.deck], tier: d.tier };
}

/** Each Riftwalker's starting deck, always available so a match can be tested before anyone has cleared a run. */
export function starterDecks(): VaultDeck[] {
  return (Object.keys(RIFTWALKERS) as HeroId[]).map((h) => ({
    id: `starter:${h}`,
    hero: h,
    tier: 1,
    deck: [...RIFTWALKERS[h].starter],
    bankedAt: 0,
  }));
}

export const isStarter = (d: VaultDeck): boolean => d.id.startsWith('starter:');

/** A readable name for a deck. */
export function labelOf(d: VaultDeck): string {
  const name = Object.hasOwn(RIFTWALKERS, d.hero)
    ? RIFTWALKERS[d.hero as HeroId].hero.name
    : d.hero;
  return isStarter(d) ? `${name}: starting deck` : `${name}: Rift Tier ${d.tier}`;
}

/** Parse what was saved; anything that is no longer a legal deck is dropped rather than trusted. */
export function parseVault(raw: string | null): VaultDeck[] {
  if (!raw) return [];
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(v)) return [];
  const out: VaultDeck[] = [];
  for (const x of v as unknown[]) {
    if (typeof x !== 'object' || x === null) continue;
    const o = x as Record<string, unknown>;
    if (typeof o['id'] !== 'string' || typeof o['bankedAt'] !== 'number') continue;
    const checked = checkEntry({ name: 'x', hero: o['hero'], deck: o['deck'], tier: o['tier'] });
    if (!checked.ok) continue;
    out.push({
      id: o['id'],
      hero: checked.entry.hero,
      tier: checked.entry.tier,
      deck: checked.entry.deck,
      bankedAt: o['bankedAt'],
    });
  }
  return out.slice(0, VAULT_SLOTS);
}

export function loadVault(): VaultDeck[] {
  try {
    return parseVault(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

export function saveVault(list: readonly VaultDeck[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* not saved (storage full or blocked) */
  }
}
