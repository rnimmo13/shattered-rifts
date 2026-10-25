// The Vault: the decks a player has banked, kept in this browser (localStorage), and on the server under a Vault code (vaultSync.ts). A banked deck is
// what you take into a PvP match. The functions that change a list are pure (and tested); only load and save touch storage.

import type { RunState } from '@sr/campaign';
import {
  bankInto,
  cleanVault,
  runOf,
  runKey,
  mergeVaults,
  oneEach,
  RUN_PREFIX,
  dropFrom,
  safeId,
  VAULT_SLOTS,
  type Banked,
  type Entry,
  type VaultDeck,
} from '@sr/pvp';
import { heroName, progressLabel, tierLabel } from './deckLayout';

export {
  bankInto,
  dropFrom,
  mergeVaults,
  oneEach,
  runOf,
  VAULT_SLOTS,
  type Banked,
  type VaultDeck,
};
const KEY = 'sr-vault-v1';

/** The deck a banked run leaves in the Vault. */
export function deckFromRun(
  run: Pick<RunState, 'seed' | 'tier' | 'character' | 'deck' | 'boons'>,
  now: number,
): VaultDeck {
  return {
    // the id is also a key on the server, so keep to the characters it accepts (a typed seed can hold anything)
    id: safeId(RUN_PREFIX + run.seed),
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

/** A copy of the deck as it stood after stage `after` (0 = the start of the tier). Like every save, it replaces the run's earlier one. */
export function deckFromStage(
  run: Pick<RunState, 'seed' | 'tier' | 'character' | 'deck' | 'boons'>,
  now: number,
  after: number,
): VaultDeck {
  return { ...deckFromRun(run, now), stage: after };
}

/** A copy of the deck as it is right now, wherever the run is: what the Arena deck is saved from after every stop. */
export function deckSnapshot(
  run: Pick<RunState, 'seed' | 'tier' | 'phase' | 'stage' | 'character' | 'deck' | 'boons'>,
  now: number,
): VaultDeck {
  return { ...deckFromRun(run, now), stage: stagesCleared(run) };
}

/** Where a saved deck is in the campaign, as everywhere else: "Tier 2 · Stage 1/3". */
export const progressLabelOf = (d: Pick<VaultDeck, 'tier' | 'stage'>): string =>
  progressLabel(d.tier, d.stage);

/** What a PvP match is told about a deck. */
export function entryFor(d: VaultDeck, name: string): Entry {
  return {
    name,
    hero: d.hero,
    deck: [...d.deck],
    boons: [...d.boons],
    tier: d.tier,
    run: runKey(d.id),
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
