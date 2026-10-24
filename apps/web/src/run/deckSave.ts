// Saving a run's deck into the Vault ("pocketing" it) without ending the run: the run bar's Save deck button and the cleared-tier
// screen. The saved copy is a snapshot; the live run goes on and its deck can still change or be lost.
//
// The real game offers a save in the time between Rift Tiers: on the cleared-tier screen, and at the start of the next tier just
// before its stage 1. MID_RUN_SAVES adds the points between stages, for test builds only (decision #168, #172): set it to false
// before release.

import type { RunState } from '@sr/campaign';
import {
  VAULT_SLOTS,
  bankInto,
  deckFromRun,
  deckFromStage,
  loadVault,
  saveVault,
} from '../pvp/vault';
import { syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

export const MID_RUN_SAVES = true;

/**
 * Where a deck can be saved now: 'cleared' (a Rift Tier has just been cleared), a stage count (0 = the start of a tier beyond the
 * first, just before its stage 1; 1 or 2 = between stages, test builds only), or null (not now: never in the middle of a stage).
 */
export type SavePoint = 'cleared' | number | null;

export function savePoint(run: RunState): SavePoint {
  if (run.phase === 'loopCleared') return 'cleared';
  if (run.phase === 'prelude' && run.stage === 1 && run.tier >= 2) return 0;
  if (MID_RUN_SAVES && run.phase === 'stageClear') return run.stage;
  return null;
}

export const canSaveForArena = (run: RunState): boolean => savePoint(run) !== null;

/** Copy the deck into the Vault (and the online copy); the answer is a line to show the player. */
export async function saveForArena(run: RunState): Promise<string> {
  const at = savePoint(run);
  if (at === null) return 'You can save a deck between Rift Tiers, not in the middle of a stage.';
  const deck = at === 'cleared' ? deckFromRun(run, Date.now()) : deckFromStage(run, Date.now(), at);
  const r = bankInto(loadVault(), deck);
  if (!r.ok)
    return `Your Vault is full (${VAULT_SLOTS} decks). Remove one on the Saved decks page (from the home page) first, then save.`;
  saveVault(r.list);
  if (r.already) return 'This deck is already in your Vault.';
  // the online copy follows; the deck is saved in this browser either way
  await whoAmI();
  const online = await syncVault(vaultKey(), r.list);
  return online.ok
    ? 'Saved to your Vault. You can play it in the Arena, and your run carries on.'
    : 'Saved in this browser. It will be saved online when you open the Arena.';
}
