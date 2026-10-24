// What you see after banking a deck: it goes into the Vault (this browser's list of banked decks, the ones you can take into
// a PvP match). A full Vault asks which deck to give up.

import { useState } from 'react';
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

  const replace = (id: string): void => {
    const r = bankInto(state.list, deckFromRun(run, at), id);
    if (r.ok) {
      saveVault(r.list);
      setState({ list: r.list, saved: true });
    }
  };

  return (
    <section className="stage-panel" aria-label="Deck banked">
      <h2 className="stage-panel__title">{state.saved ? 'Deck banked' : 'Your Vault is full'}</h2>
      {state.saved ? (
        <p className="stage-panel__hint">
          This {run.deck.length}-card deck is in your Vault ({state.list.length} of {VAULT_SLOTS}{' '}
          slots used). Take it into a match from <b>Arena</b> on the title screen.
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
                <button className="btn btn--small" onClick={() => replace(d.id)}>
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
