// What you see after banking a deck: it goes into the Vault (this browser's list of banked decks, the ones you can take into
// a PvP match). A full Vault asks which deck to give up.

import { useEffect, useState } from 'react';
import type { RunState } from '@sr/campaign';
import {
  VAULT_SLOTS,
  bankInto,
  deckFromRun,
  labelOf,
  loadVault,
  saveVault,
  type VaultDeck,
} from '../pvp/vault';
import { ensureVaultCode, getVaultCode, remoteVault, syncVault } from '../pvp/vaultSync';

export function BankedPanel(props: { run: RunState; onExport: () => void; onLeave: () => void }) {
  const { run } = props;
  const [at] = useState(() => Date.now());
  const [state, setState] = useState<{ list: VaultDeck[]; saved: boolean }>(() => {
    const current = loadVault();
    const r = bankInto(current, deckFromRun(run, at));
    if (r.ok) {
      saveVault(r.list);
      return { list: r.list, saved: true };
    }
    return { list: current, saved: false };
  });

  const [online, setOnline] = useState<'saving' | 'saved' | 'partial' | 'offline'>('saving');
  /** counts the times the Vault is changed by hand, so the server copy follows */
  const [tick, setTick] = useState(0);

  // a second copy goes to the server (the Vault code on the Arena screen is the key to it)
  useEffect(() => {
    let live = true;
    void syncVault(ensureVaultCode(), state.list).then((r) => {
      if (live) setOnline(r.ok ? (r.complete ? 'saved' : 'partial') : 'offline');
    });
    return () => {
      live = false;
    };
  }, [state.list, tick]);

  const replace = async (id: string): Promise<void> => {
    const r = bankInto(state.list, deckFromRun(run, at), id);
    if (!r.ok) return;
    saveVault(r.list);
    setState({ list: r.list, saved: true });
    // the deck given up leaves the server copy too, or it would fill the slot there
    const key = getVaultCode();
    if (key) await remoteVault.drop(key, id);
    setTick((t) => t + 1);
  };

  return (
    <section className="stage-panel" aria-label="Deck banked">
      <h2 className="stage-panel__title">{state.saved ? 'Deck banked' : 'Your Vault is full'}</h2>
      {state.saved ? (
        <p className="stage-panel__hint">
          This {run.deck.length}-card deck is in your Vault ({state.list.length} of {VAULT_SLOTS}{' '}
          slots used). Take it into a match from <b>Arena</b> on the title screen.{' '}
          {online === 'saved' && 'It is saved online too.'}
          {online === 'partial' &&
            'The online Vault is full of other decks, so it stays in this browser. Open Arena to manage them.'}
          {online === 'offline' && 'It could not be saved online, so it stays in this browser.'}
        </p>
      ) : (
        <>
          <p className="stage-panel__hint">
            The Vault holds {VAULT_SLOTS} decks. Give one up to keep this {run.deck.length}-card
            deck, or leave without banking it.
          </p>
          <ul className="vaultlist">
            {state.list.map((d) => (
              <li key={d.id}>
                <span>
                  {labelOf(d)} <small>({d.deck.length} cards)</small>
                </span>
                <button className="btn btn--small" onClick={() => void replace(d.id)}>
                  <span>Replace this one</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="choices-row">
        <button className="btn" onClick={props.onExport}>
          <span>Export run</span>
        </button>
        <button className="btn btn--primary" onClick={props.onLeave}>
          <span>Back to the Sanctum</span>
        </button>
      </div>
    </section>
  );
}
