import { useEffect, useState } from 'react';
import { RIFTWALKERS, classNameOf } from '@sr/content/v2';
import { loadVault, mergeVaults, type VaultDeck } from '../pvp/vault';
import { remoteVault, vaultKey, whoAmI } from '../pvp/vaultSync';
import { localOnly } from '../playAccess';

/** Copies the current account's existing saved decks; never edits the Vault. */
export function SavedDeckPicker({ onLoad }: { onLoad: (deck: VaultDeck) => void }) {
  const [decks, setDecks] = useState(loadVault);
  const [selected, setSelected] = useState('');
  const [loaded, setLoaded] = useState('');
  useEffect(() => {
    let live = true;
    const refresh = () => {
      setDecks(loadVault());
      if (!localOnly())
        void whoAmI()
          .then(() => remoteVault.list(vaultKey()))
          .then((result) => {
            if (live && result.ok) setDecks(mergeVaults(loadVault(), result.decks));
          })
          .catch(() => undefined);
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      live = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const chosen = decks.find((deck) => deck.id === selected);
  return (
    <section className="setup__full sandbox-saved-decks">
      <h2 className="setup__h">My saved decks</h2>
      <p className="setup__lead">
        Bring a saved Arena deck into Sandbox with its class, Ascendancy, cards, Boons and saved
        Campaign Max HP. Test a copy against any encounter.
      </p>
      {decks.length ? (
        <>
          <label className="setup__select">
            Saved deck
            <select
              value={chosen?.id ?? ''}
              onChange={(event) => {
                setSelected(event.target.value);
                setLoaded('');
              }}
            >
              <option value="">Choose one of your saved decks</option>
              {decks.map((deck, index) => (
                <option key={deck.id} value={deck.id}>
                  {RIFTWALKERS[deck.hero as keyof typeof RIFTWALKERS]?.hero.name ?? deck.hero} ·
                  Tier {deck.tier} ·{' '}
                  {deck.ascendancy ? classNameOf(deck.hero, deck.ascendancy) : 'base class'} ·{' '}
                  {deck.deck.length} cards · #{index + 1}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn--small"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              onLoad({ ...chosen, deck: [...chosen.deck], boons: [...chosen.boons] });
              setLoaded('Saved deck loaded. Your original stays in the Vault.');
            }}
          >
            <span>Load saved deck</span>
          </button>
        </>
      ) : (
        <p className="setup__lead">Your saved Arena decks will appear here once you have one.</p>
      )}
      <p role="status">{loaded}</p>
    </section>
  );
}
