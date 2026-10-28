// A run's deck goes to the Arena by itself: it is copied into the Vault after every stop on the map that is finished (every fight once its
// reward is taken, and every shop, shrine and event too, since those change the deck). The saved copy is a snapshot, replaced by the
// next one (one run keeps one saved deck); the live run goes on. If the run collapses, its saved deck leaves the player's Vault (they
// can no longer bring it to the Arena), but the ghost made from it stays on the server for others to face (DECISIONS #231).

import type { RunState } from '@sr/campaign';
import { RUN_PREFIX, safeId } from '@sr/pvp';
import { bankInto, deckSnapshot, loadVault, progressLabelOf, runOf, saveVault } from '../pvp/vault';
import { forgetRun, syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

/**
 * A run that collapses takes the deck it saved for the Arena out of the player's Vault: every saved copy of that run's deck is removed,
 * here and online, so it can no longer be brought to the Arena. Its ghost is a separate record on the leaderboard server and stays:
 * other players can still meet it (DECISIONS #231). Returns how many saved decks went.
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

/** The words for where this run's deck stands in the Arena ("Tier 2 · Stage 1/3"), or null if no copy of it is saved. */
export function savedArenaLabel(run: Pick<RunState, 'seed'>): string | null {
  const mine = runOf(safeId(RUN_PREFIX + run.seed));
  const d = loadVault().find((x) => runOf(x.id) === mine);
  return d ? progressLabelOf(d) : null;
}

/** Whether the step from `before` to `after` finished a stop on the map (a fight and its reward, a shop, a shrine, an event): time to save. */
export function shouldAutoSave(before: RunState, after: RunState): boolean {
  return (
    before.seed === after.seed &&
    // (a Warden is cleared before its Gift is picked, so the Gift card is saved when the pick is made)
    (after.stats.nodesCleared > before.stats.nodesCleared ||
      (before.phase === 'gift' && after.phase !== 'gift') ||
      // (an extra card reward after a Warden's Gift: the stage is cleared when it is picked)
      (before.context?.afterWarden === true && after.phase !== 'reward')) &&
    after.phase !== 'collapsed' &&
    after.phase !== 'banked'
  );
}

export type AutoSave =
  /** the Arena deck was updated (`online`: the online copy too) */
  | { kind: 'saved'; online: boolean; label: string }
  /** the Arena deck was already this deck */
  | { kind: 'same'; label: string }
  /** the Vault has no room for this run's deck */
  | { kind: 'full' };

/** Copy the run's deck into the Vault (and the online copy), replacing this run's earlier save. Never throws. */
export async function autoSaveForArena(run: RunState): Promise<AutoSave> {
  const deck = deckSnapshot(run, Date.now());
  const label = progressLabelOf(deck);
  const r = bankInto(loadVault(), deck);
  if (!r.ok) return { kind: 'full' };
  if (r.already) return { kind: 'same', label };
  saveVault(r.list);
  // the online copy follows (the server replaces the run's earlier save too); the deck is saved in this browser either way
  try {
    await whoAmI();
    const online = await syncVault(vaultKey(), r.list);
    return { kind: 'saved', online: online.ok && online.complete, label };
  } catch {
    return { kind: 'saved', online: false, label };
  }
}
