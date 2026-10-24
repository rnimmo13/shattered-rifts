// #/decks: every saved deck in full, as a report (see DeckReport). The Arena lists the same decks in short.

import { useEffect, useRef, useState } from 'react';
import { DeckReport } from './DeckReport';
import { VAULT_SLOTS, dropFrom, loadVault, saveVault, type VaultDeck } from './vault';
import { remoteVault, syncVault, vaultKey, whoAmI } from './vaultSync';
import './decks.css';

export default function SavedDecksScreen() {
  const [decks, setDecks] = useState<VaultDeck[]>(loadVault);
  const [checking, setChecking] = useState(true);
  /** a deck was removed by hand, so a sync still on its way must not bring it back */
  const touched = useRef(false);

  // the decks saved online and the ones in this browser are brought together
  useEffect(() => {
    let live = true;
    void (async () => {
      await whoAmI();
      const key = vaultKey();
      const r = await syncVault(key, loadVault());
      if (!live) return;
      if (vaultKey() !== key || touched.current) {
        setChecking(false);
        return;
      }
      if (r.ok) {
        setDecks(r.decks);
        saveVault(r.decks);
      }
      setChecking(false);
    })();
    return () => {
      live = false;
    };
  }, []);

  const newestFirst = [...decks].sort((a, b) => b.bankedAt - a.bankedAt);
  return (
    <main className="setup setup--wide decks">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Saved decks</h1>
        <p className="setup__lead">
          <b>
            {decks.length} of {VAULT_SLOTS}
          </b>{' '}
          saved. Playing in the Arena never costs you a deck. To make room for a new one, remove an
          old one.
        </p>
        <p className="decks__links">
          <a href="#/arena">Take a deck into the Arena</a>
        </p>
      </header>
      {newestFirst.length === 0 ? (
        <section className="pvp__status">
          <h2>{checking ? 'Looking for your saved decks…' : 'No saved decks yet'}</h2>
          {!checking && (
            <>
              <p>
                Clear a Rift Tier and save your deck to keep it here. Banked decks are what you play
                with in the Arena.
              </p>
              <a className="btn btn--primary" href="#/run">
                <span>Start a New Run</span>
              </a>
            </>
          )}
        </section>
      ) : (
        <div className="decks__list">
          {newestFirst.map((d) => (
            <DeckReport
              key={d.id}
              deck={d}
              onRemove={() => {
                touched.current = true;
                const next = dropFrom(decks, d.id);
                setDecks(next);
                saveVault(next);
                void whoAmI().then(() => remoteVault.drop(vaultKey(), d.id));
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
