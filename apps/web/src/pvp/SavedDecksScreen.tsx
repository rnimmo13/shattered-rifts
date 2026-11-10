// #/decks: every saved deck in full, as a report (see DeckReport). The Arena lists the same decks in short.

import { useEffect, useRef, useState } from 'react';
import { DeckReport } from './DeckReport';
import { VAULT_SLOTS, dropFrom, loadVault, saveVault, type VaultDeck } from './vault';
import { gameplayAction } from '../playAccess';
import { remoteVault, syncVault, vaultKey, whoAmI } from './vaultSync';
import '../play/play.css';
import './decks.css';

/** How the list stands against the online copy, said under the heading (2026-11-07: a stale list used to look current). */
type SyncState =
  | { kind: 'checking' }
  | { kind: 'synced'; at: number; waiting?: 'play' | 'full' | 'offline' }
  | { kind: 'failed'; error: 'offline' | 'signin' | 'other' };

function syncLine(s: SyncState): string {
  if (s.kind === 'checking') return 'Checking your online decks…';
  if (s.kind === 'failed')
    return s.error === 'signin'
      ? 'Your sign-in has ended, so this is the copy on this device. Reconnect in Settings > Account to see your online decks.'
      : 'Could not reach your online decks, so this is the copy on this device.';
  const at = new Date(s.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (s.waiting === 'play')
    return `Up to date with your online decks (${at}). A deck saved on this device goes online once you play here: you are playing on another device.`;
  if (s.waiting === 'full')
    return `Up to date with your online decks (${at}). Your online Vault is full, so a deck saved here stays on this device until you make room.`;
  if (s.waiting === 'offline')
    return `Up to date with your online decks (${at}). A deck saved here could not go online yet; it will try again.`;
  return `Up to date with your online decks (${at}).`;
}

export default function SavedDecksScreen() {
  const [decks, setDecks] = useState<VaultDeck[]>(loadVault);
  const [sync, setSync] = useState<SyncState>({ kind: 'checking' });
  const checking = sync.kind === 'checking';
  /** a deck was removed by hand, so a sync still on its way must not bring it back */
  const touched = useRef(false);
  const live = useRef(true);
  const busy = useRef(false);

  // the decks saved online and the ones on this device are brought together: on opening, and again whenever the window comes
  // back into focus (a deck saved or removed on another device then shows here without reopening the page)
  const refresh = useRef(async (): Promise<void> => {
    if (busy.current) return;
    busy.current = true;
    try {
      await whoAmI();
      const key = vaultKey();
      const r = await syncVault(key, loadVault());
      if (!live.current || vaultKey() !== key || touched.current) {
        touched.current = false;
        return;
      }
      if (r.ok) {
        setDecks(r.decks);
        saveVault(r.decks);
        setSync({ kind: 'synced', at: Date.now(), ...(r.waiting ? { waiting: r.waiting } : {}) });
      } else
        setSync({
          kind: 'failed',
          error: r.error === 'signin' ? 'signin' : r.error === 'offline' ? 'offline' : 'other',
        });
    } finally {
      busy.current = false;
    }
  });
  useEffect(() => {
    live.current = true;
    void refresh.current();
    const again = (): void => {
      if (document.visibilityState === 'visible') void refresh.current();
    };
    window.addEventListener('focus', again);
    document.addEventListener('visibilitychange', again);
    return () => {
      live.current = false;
      window.removeEventListener('focus', again);
      document.removeEventListener('visibilitychange', again);
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
          <a href="#/arena">Take a deck into the Arena</a> ·{' '}
          <a href="#/arena-rules">What the Arena takes</a>
        </p>
        <p className={`decks__sync decks__sync--${sync.kind}`} role="status">
          {syncLine(sync)}{' '}
          {sync.kind === 'failed' && sync.error !== 'signin' && (
            <button type="button" className="btn btn--small" onClick={() => void refresh.current()}>
              <span>Try again</span>
            </button>
          )}
        </p>
      </header>
      {newestFirst.length === 0 ? (
        <section className="pvp__status">
          <h2>{checking ? 'Looking for your saved decks…' : 'No saved decks yet'}</h2>
          {!checking && (
            <>
              <p>
                Play a run and its deck is saved here as you go. Saved decks are what you play with
                in the Arena.
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
                void gameplayAction(() => {
                  touched.current = true;
                  const next = dropFrom(decks, d.id);
                  setDecks(next);
                  saveVault(next);
                  void whoAmI().then(() => remoteVault.drop(vaultKey(), d.id));
                });
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
