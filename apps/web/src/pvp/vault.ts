// The Vault: the decks a player has banked, kept in this browser (localStorage), and on the server under a Vault code (vaultSync.ts). A banked deck is
// what you take into a PvP match. The functions that change a list are pure (and tested); only load and save touch storage.

import type { RunState } from '@sr/campaign';
import {
  bankInto,
  cleanVault,
  dropFrom,
  safeId,
  VAULT_SLOTS,
  type Banked,
  type Entry,
  type VaultDeck,
} from '@sr/pvp';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';

export { bankInto, dropFrom, VAULT_SLOTS, type Banked, type VaultDeck };
const KEY = 'sr-vault-v1';

/** The deck a banked run leaves in the Vault. */
export function deckFromRun(
  run: Pick<RunState, 'seed' | 'tier' | 'character' | 'deck' | 'boons'>,
  now: number,
): VaultDeck {
  return {
    // the id is also a key on the server, so keep to the characters it accepts (a typed seed can hold anything)
    id: safeId(`${run.seed}:t${run.tier}`),
    hero: run.character,
    tier: run.tier,
    deck: [...run.deck],
    boons: [...run.boons],
    bankedAt: now,
  };
}

/** TEST BUILD ONLY: a copy of the deck taken after a stage (see run/MidRunSave.tsx). It has its own id, so it never clashes with the Bank at the end. */
export function deckFromStage(
  run: Pick<RunState, 'seed' | 'tier' | 'stage' | 'character' | 'deck' | 'boons'>,
  now: number,
): VaultDeck {
  return { ...deckFromRun(run, now), id: safeId(`${run.seed}:t${run.tier}:s${run.stage}`) };
}

/** What a PvP match is told about a deck. */
export function entryFor(d: VaultDeck, name: string): Entry {
  return { name, hero: d.hero, deck: [...d.deck], boons: [...d.boons], tier: d.tier };
}

/** A readable name for a deck. */
export function labelOf(d: VaultDeck): string {
  const name = Object.hasOwn(RIFTWALKERS, d.hero)
    ? RIFTWALKERS[d.hero as HeroId].hero.name
    : d.hero;
  const stage = /:s(\d)$/.exec(d.id)?.[1];
  return stage
    ? `${name}: Rift Tier ${d.tier}, after stage ${stage}`
    : `${name}: Rift Tier ${d.tier}`;
}

/** Parse what was saved; anything that is no longer a legal deck is dropped rather than trusted. */
export function parseVault(raw: string | null): VaultDeck[] {
  if (!raw) return [];
  try {
    return cleanVault(JSON.parse(raw));
  } catch {
    return [];
  }
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
