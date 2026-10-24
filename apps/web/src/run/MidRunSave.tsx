// TEST BUILD ONLY. After a stage is cleared, offer to copy the deck into the Vault so the Arena can be tried without a full run.
// The real game saves a deck only when a Rift Tier is cleared (Bank), so set MID_RUN_SAVES to false (or delete this file and its
// one use in RunScreen) before release. See docs/DECISIONS.md #168.

import { useState } from 'react';
import type { RunState } from '@sr/campaign';
import { VAULT_SLOTS, bankInto, deckFromStage, loadVault, saveVault } from '../pvp/vault';
import { syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

export const MID_RUN_SAVES = true;

type Result = 'saved' | 'already' | 'full' | 'online-failed';

export function MidRunSave(props: { run: RunState }) {
  const { run } = props;
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (): Promise<void> => {
    setBusy(true);
    const r = bankInto(loadVault(), deckFromStage(run, Date.now()));
    if (!r.ok) {
      setResult('full');
      setBusy(false);
      return;
    }
    saveVault(r.list);
    // the online copy follows; the deck is saved in this browser either way
    await whoAmI();
    const online = await syncVault(vaultKey(), r.list);
    setResult(r.already ? 'already' : online.ok ? 'saved' : 'online-failed');
    setBusy(false);
  };

  return (
    <div className="midsave">
      <p className="stage-panel__hint">
        <b>Test build:</b> save a copy of this deck to your Vault to try it in the Arena. Your run
        carries on as normal.
      </p>
      {result === null || result === 'full' ? (
        <button className="btn" disabled={busy} onClick={() => void save()}>
          <span>Save this deck for the Arena</span>
        </button>
      ) : null}
      {result === 'saved' && <p className="stage-panel__hint">Saved to your Vault.</p>}
      {result === 'already' && (
        <p className="stage-panel__hint">This deck is already in your Vault.</p>
      )}
      {result === 'online-failed' && (
        <p className="stage-panel__hint">
          Saved in this browser. It could not be saved online yet; it will be when you open the
          Arena.
        </p>
      )}
      {result === 'full' && (
        <p className="stage-panel__hint">
          Your Vault is full ({VAULT_SLOTS} decks). Remove one on the Arena screen first, then come
          back.
        </p>
      )}
    </div>
  );
}
