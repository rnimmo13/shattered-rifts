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
import { heroName, tierLabel } from './deckLayout';

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
    // (a cleared tier is all 3 stages; the mid-run copies below say where they were taken)
    stage: 3,
    deck: [...run.deck],
    boons: [...run.boons],
    bankedAt: now,
  };
}

/** How many of the tier's stages the run has cleared (3: the tier is cleared). */
export function stagesCleared(run: Pick<RunState, 'phase' | 'stage'>): number {
  if (run.phase === 'loopCleared') return 3;
  // (the Warden's gift comes after the Warden has fallen, so that stage is already beaten)
  const n = run.phase === 'stageClear' || run.phase === 'gift' ? run.stage : run.stage - 1;
  return Math.min(3, Math.max(0, n));
}

/** TEST BUILD ONLY: a copy of the deck taken after stage `after` (0 = the start of the tier; see run/deckSave.ts). It has its own id, so it never clashes with the Bank at the end. */
export function deckFromStage(
  run: Pick<RunState, 'seed' | 'tier' | 'character' | 'deck' | 'boons'>,
  now: number,
  after: number,
): VaultDeck {
  return {
    ...deckFromRun(run, now),
    stage: after,
    id: safeId(`${run.seed}:t${run.tier}:s${after}`),
  };
}

/** TEST BUILD ONLY: a copy of the deck as it is right now, at any point. The id follows the deck's contents, so saving the same deck twice is one entry. */
export function deckSnapshot(
  run: Pick<RunState, 'seed' | 'tier' | 'phase' | 'stage' | 'character' | 'deck' | 'boons'>,
  now: number,
): VaultDeck {
  let h = 5381;
  for (const ch of `${run.deck.join(',')}|${run.boons.join(',')}`)
    h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  const stage = stagesCleared(run);
  return {
    ...deckFromRun(run, now),
    stage,
    id: safeId(`${run.seed}:t${run.tier}:n${run.stage}:${h.toString(36)}`),
  };
}

/** What a PvP match is told about a deck. */
export function entryFor(d: VaultDeck, name: string): Entry {
  return {
    name,
    hero: d.hero,
    deck: [...d.deck],
    boons: [...d.boons],
    tier: d.tier,
    ...(d.stage === undefined ? {} : { stage: d.stage }),
  };
}

/** A readable name for a deck. */
export function labelOf(d: VaultDeck): string {
  return `${heroName(d.hero)}: ${tierLabel(d)}`;
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
