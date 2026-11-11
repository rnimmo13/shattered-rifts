// #/decks: every saved deck in full, as a report (see DeckReport). The Arena lists the same decks in short.

import { useEffect, useMemo, useRef, useState } from 'react';
import { RUN_PREFIX, safeId, type BrokenDeck } from '@sr/pvp';
import { BrokenNotices, InactiveDecks } from './BrokenDecks';
import { DeckReport } from './DeckReport';
import { VAULT_SLOTS, dropFrom, loadVault, runOf, saveVault, type VaultDeck } from './vault';
import { runHistory, type RunRecord } from '../run/history';
import { VictoryAgain } from '../run/VictoryPanel';
import { gameplayAction } from '../playAccess';
import { remoteVault, syncVault, vaultKey, whoAmI, type Remote } from './vaultSync';
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
  /** saved decks an update left unplayable, as the server holds them (DECISIONS #754) */
  const [broken, setBroken] = useState<BrokenDeck[]>([]);
  /** why the last Got it or Remove on one of them did not go through */
  const [brokenNote, setBrokenNote] = useState<string | null>(null);
  /** counts those presses, so a sync that was asked before one cannot put the older list back */
  const brokenEdits = useRef(0);
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
      const edits = brokenEdits.current;
      const r = await syncVault(key, loadVault());
      if (!live.current || vaultKey() !== key || touched.current) {
        touched.current = false;
        return;
      }
      if (r.ok) {
        setDecks(r.decks);
        if (edits === brokenEdits.current) setBroken(r.broken);
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

  // (DECISIONS #739) a deck whose run cleared the campaign is marked. A deck saved before decks said so is spoken for by the run
  // history, which also knows how many fights the run won (for the ending, opened again)
  const wonRuns = useMemo(() => {
    const by = new Map<string, RunRecord>();
    for (const r of runHistory()) if (r.won) by.set(runOf(safeId(RUN_PREFIX + r.id)), r);
    return by;
  }, []);
  const [ending, setEnding] = useState<VaultDeck | null>(null);
  // (the page shows at once what was asked for. The server's answer then stands; if it refuses, the list goes back as it was and
  // the page says why)
  const settle = (was: BrokenDeck[], r: Remote): void => {
    if (!live.current) return;
    brokenEdits.current++;
    if (r.ok) {
      if (r.broken) setBroken(r.broken);
      setBrokenNote(null);
      return;
    }
    setBroken(was);
    setBrokenNote(
      r.error === 'play'
        ? 'That did not go through: you are playing on another device. Try again from there, or once you play here.'
        : r.error === 'signin'
          ? 'That did not go through: your sign-in has ended. Reconnect in Settings > Account and try again.'
          : 'That did not go through: your online decks could not be reached. Try again in a moment.',
    );
  };
  const acknowledge = (d: BrokenDeck): void => {
    const was = broken;
    brokenEdits.current++;
    setBroken(was.map((x) => (x.id === d.id ? { ...x, inactive: true } : x)));
    void whoAmI()
      .then(() => remoteVault.acknowledge(vaultKey(), d.id))
      .then((r) => settle(was, r));
  };
  const removeBroken = (d: BrokenDeck): void => {
    void gameplayAction(() => {
      const was = broken;
      brokenEdits.current++;
      setBroken(was.filter((x) => x.id !== d.id));
      void whoAmI()
        .then(() => remoteVault.drop(vaultKey(), d.id))
        .then((r) => settle(was, r));
    });
  };
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
        <p className="setup__lead decks__season">
          Saved decks are kept from month to month. Only your Arena rank resets each month.
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
      {brokenNote && (
        <p className="decks__sync decks__sync--failed" role="alert">
          {brokenNote}
        </p>
      )}
      <BrokenNotices decks={broken} onAcknowledge={acknowledge} onRemove={removeBroken} />
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
              completed={d.won === true || wonRuns.has(runOf(d.id))}
              onEnding={() => setEnding(d)}
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
      <InactiveDecks decks={broken} onRemove={removeBroken} />
      {ending && (
        <VictoryAgain
          record={{
            hero: ending.hero,
            ascendancy: ending.ascendancy,
            victories: wonRuns.get(runOf(ending.id))?.duelsWon,
            cards: ending.deck.length,
          }}
          onClose={() => setEnding(null)}
        />
      )}
    </main>
  );
}
