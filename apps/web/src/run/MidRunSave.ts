// TEST BUILD ONLY. At a few points between stages the run bar's Save button copies the deck into the Vault, so the Arena can be
// tried without a full run. The real game saves a deck only when a Rift Tier is cleared (Bank), so set MID_RUN_SAVES to false (or delete
// this file and its uses in RunScreen) before release. See docs/DECISIONS.md #168.

import type { RunState } from '@sr/campaign';
import { VAULT_SLOTS, bankInto, deckFromStage, loadVault, saveVault } from '../pvp/vault';
import { syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

export const MID_RUN_SAVES = true;

/**
 * Where a deck can be saved, as "after stage N" (0 = the very start of a Rift Tier), or null when it cannot be saved now:
 * - just before a new stage beyond stage 1 begins (stage 1 or 2 has been cleared), or
 * - on a Rift Tier beyond the first, just before stage 1 of that tier begins (right after choosing Continue).
 * Never in the middle of a stage.
 */
export function savePoint(run: RunState): number | null {
  if (!MID_RUN_SAVES) return null;
  if (run.phase === 'stageClear') return run.stage;
  if (run.phase === 'prelude' && run.stage === 1 && run.tier >= 2) return 0;
  return null;
}

export const canSaveForArena = (run: RunState): boolean => savePoint(run) !== null;

/** Copy the deck into the Vault (and the online copy); the answer is a line to show the player. */
export async function saveForArena(run: RunState): Promise<string> {
  const after = savePoint(run);
  if (after === null)
    return 'You can save a deck just before a new stage begins (not in the middle of one).';
  const r = bankInto(loadVault(), deckFromStage(run, Date.now(), after));
  if (!r.ok)
    return `Your Vault is full (${VAULT_SLOTS} decks). Remove one on the Saved decks page (from the home page) first, then save.`;
  saveVault(r.list);
  if (r.already) return 'This deck is already in your Vault.';
  // the online copy follows; the deck is saved in this browser either way
  await whoAmI();
  const online = await syncVault(vaultKey(), r.list);
  return online.ok
    ? 'Saved to your Vault. You can play it in the Arena.'
    : 'Saved in this browser. It will be saved online when you open the Arena.';
}
