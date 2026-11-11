// What you see after a run's deck is banked: it goes into the Vault (the banked decks, the ones you can take into an Arena match), here and
// online. A full Vault asks which deck to give up. A won run banks itself and shows this under its victory (Robert 2026-11-09, DECISIONS #701).

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
import { masteryRose, remoteVault, syncVault, vaultKey, whoAmI } from '../pvp/vaultSync';

/** Puts the run's deck in the Vault when it mounts, and says where it went (or, with a full Vault, asks which deck to give up). */
export function DeckSaved(props: { run: RunState }) {
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

  // a second copy goes to the server (kept under this browser's own key, or the account when signed in)
  useEffect(() => {
    let live = true;
    void whoAmI()
      .then(() => syncVault(vaultKey(), state.list))
      .then((r) => {
        // (DECISIONS #741) a campaign cleared: its mastery and what it earned are fetched now. The server says when a number
        // rises, but one lost reply must not leave the card back unannounced until the game is next opened
        if (run.won) masteryRose();
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
    await whoAmI();
    await remoteVault.drop(vaultKey(), id);
    setTick((t) => t + 1);
  };

  return state.saved ? (
    <p className="stage-panel__hint">
      Your {run.deck.length}-card deck is saved in your Vault ({state.list.length} of {VAULT_SLOTS}{' '}
      slots used). Take it into a match from <b>Arena</b> on the title screen.{' '}
      {online === 'saved' && 'It is saved online too.'}
      {online === 'partial' &&
        'The online Vault is full of other decks, so it stays in this browser. Open Arena to manage them.'}
      {online === 'offline' && 'It could not be saved online, so it stays in this browser.'}
    </p>
  ) : (
    <>
      <p className="stage-panel__hint">
        Your Vault is full: it holds {VAULT_SLOTS} decks. Give one up to keep this {run.deck.length}
        -card deck, or leave without saving it.
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
  );
}

/** A banked run that was not won (an older save banked before the finale banked itself). */
export function BankedPanel(props: { run: RunState; onLeave: () => void }) {
  return (
    <section className="stage-panel" aria-label="Deck saved">
      <h2 className="stage-panel__title">Deck saved</h2>
      <DeckSaved run={props.run} />
      <div className="choices-row">
        <button className="btn btn--primary" onClick={props.onLeave}>
          <span>Back to the Sanctum</span>
        </button>
      </div>
    </section>
  );
}
