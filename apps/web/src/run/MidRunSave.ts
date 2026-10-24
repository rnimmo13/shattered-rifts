// TEST BUILD ONLY. Between stage 1 and stage 2 the run bar's Save button copies the deck into the Vault, so the Arena can be tried
// without a full run. The real game saves a deck only when a Rift Tier is cleared (Bank), so set MID_RUN_SAVES to false (or delete
// this file and its uses in RunScreen) before release. See docs/DECISIONS.md #168.

import type { RunState } from '@sr/campaign';
import { VAULT_SLOTS, bankInto, deckFromStage, loadVault, saveVault } from '../pvp/vault';
import { syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

export const MID_RUN_SAVES = true;

/** The one moment a deck can be saved: stage 1 is cleared and the next stage has not begun. */
export const canSaveForArena = (run: RunState): boolean =>
  MID_RUN_SAVES && run.phase === 'stageClear' && run.stage === 1;

/** Copy the deck into the Vault (and the online copy); the answer is a line to show the player. */
export async function saveForArena(run: RunState): Promise<string> {
  if (!canSaveForArena(run)) return 'You can save a deck once stage 1 is cleared.';
  const r = bankInto(loadVault(), deckFromStage(run, Date.now()));
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
