// Saving a run's deck into the Vault ("pocketing" it) without ending the run: the run bar's Save deck button and the cleared-tier
// screen. The saved copy is a snapshot; the live run goes on and its deck can still change or be lost.
//
// The real game offers a save in the time between Rift Tiers: on the cleared-tier screen, and at the start of the next tier just
// before its stage 1. MID_RUN_SAVES adds the points between stages, for test builds only (decision #168, #172): set it to false
// before release.

import type { RunState } from '@sr/campaign';
import { RUN_PREFIX, safeId } from '@sr/pvp';
import {
  VAULT_SLOTS,
  bankInto,
  deckFromRun,
  deckFromStage,
  deckSnapshot,
  loadVault,
  runOf,
  saveVault,
} from '../pvp/vault';
import { forgetRun, syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

export const MID_RUN_SAVES = true;
/** TEST BUILD ONLY: a deck can be saved at any moment of a run, so the Arena and saving can be tried freely. Set to false before release. */
export const SAVE_ANYTIME = true;

/**
 * Where a deck can be saved now: 'cleared' (a Rift Tier has just been cleared), a stage count (0 = the start of a tier beyond the
 * first, just before its stage 1; 1 or 2 = between stages, test builds only), or null (not now: never in the middle of a stage).
 */
export type SavePoint = 'cleared' | 'now' | number | null;

export function savePoint(run: RunState): SavePoint {
  if (run.phase === 'loopCleared') return 'cleared';
  if (run.phase === 'prelude' && run.stage === 1 && run.tier >= 2) return 0;
  if (MID_RUN_SAVES && run.phase === 'stageClear') return run.stage;
  if (SAVE_ANYTIME && run.phase !== 'collapsed' && run.phase !== 'banked') return 'now';
  return null;
}

export const canSaveForArena = (run: RunState): boolean => savePoint(run) !== null;

/**
 * A run that collapses takes the deck it saved for the Arena with it: every saved copy of that run's deck is removed, here and online.
 * (Saving a deck is a snapshot, but it is only safe while the run is alive: a run that ends in defeat loses it.) Returns how many saved
 * decks went.
 */
export async function loseSavedDecks(run: Pick<RunState, 'seed'>): Promise<number> {
  const mine = runOf(safeId(RUN_PREFIX + run.seed));
  const here = loadVault();
  const gone = here.filter((d) => runOf(d.id) === mine);
  if (gone.length > 0) saveVault(here.filter((d) => runOf(d.id) !== mine));
  // the online copy goes too, including anything the server holds that this browser does not (if the server cannot be reached,
  // forgetRun remembers the run and the next sync finishes the job)
  await whoAmI();
  const online = (await forgetRun(vaultKey(), mine)) ?? 0;
  return Math.max(gone.length, online);
}

/** Copy the deck into the Vault (and the online copy); the answer is a line to show the player. */
export async function saveForArena(run: RunState): Promise<{ ok: boolean; text: string }> {
  const at = savePoint(run);
  if (at === null)
    return {
      ok: false,
      text: 'You can save a deck between Rift Tiers, not in the middle of a stage.',
    };
  const deck =
    at === 'cleared'
      ? deckFromRun(run, Date.now())
      : at === 'now'
        ? deckSnapshot(run, Date.now())
        : deckFromStage(run, Date.now(), at);
  const before = loadVault();
  // one run keeps one saved deck: saving again replaces the earlier save
  const replaced = before.some((x) => runOf(x.id) === runOf(deck.id));
  const r = bankInto(before, deck);
  if (!r.ok)
    return {
      ok: false,
      text: `Your Vault is full (${VAULT_SLOTS} decks). Remove one on the Saved decks page (from the home page) first, then save.`,
    };
  saveVault(r.list);
  if (r.already) return { ok: true, text: 'This deck is already in your Vault.' };
  // the online copy follows (the server replaces the run's earlier save too); the deck is saved in this browser either way
  await whoAmI();
  const online = await syncVault(vaultKey(), r.list);
  if (!online.ok || !online.complete)
    return {
      ok: true,
      text: 'Saved in this browser. It will be saved online when you open the Arena.',
    };
  return {
    ok: true,
    text: replaced
      ? 'Updated your saved deck for this run. Your run carries on. If the run collapses, it is lost with it.'
      : 'Saved to your Vault. You can play it in the Arena, and your run carries on. If the run collapses, this saved deck is lost with it.',
  };
}
