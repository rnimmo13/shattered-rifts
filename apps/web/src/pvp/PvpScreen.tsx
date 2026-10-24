// #/pvp: duel another player with a banked deck. Pick a deck from your Vault (or a Riftwalker's starting deck, so a match can
// be tried before anyone has cleared a run), then find a match from the queue or play a friend with a room code.

import { useEffect, useMemo, useRef, useState } from 'react';
import { checkEntry } from '@sr/pvp';
import { COMBAT_DB } from '@sr/content/v2';
import { FightView } from '../fight/FightView';
import type { VenueId } from '../duel/scene/venue';
import { HeroIcon } from '../ui/HeroIcon';
import {
  getName,
  getServerSetting,
  playerId,
  serverBase,
  setName as saveName,
  setServerSetting,
} from './config';
import { PvpSession, newRoomCode, savedRoom, type Snapshot } from './session';
import {
  VAULT_SLOTS,
  dropFrom,
  entryFor,
  isStarter,
  labelOf,
  loadVault,
  saveVault,
  starterDecks,
  type VaultDeck,
} from './vault';
import { ChoosePanel, CoinFlip } from './PvpParts';
import { VaultCode, type Online } from './VaultCode';
import { AccountBox } from './AccountBox';
import { remoteVault, syncVault, vaultKey, whoAmI, type Me } from './vaultSync';
import './pvp.css';

const ARENAS: VenueId[] = [
  'castle',
  'factory',
  'forest',
  'cave',
  'glass',
  'swamp',
  'alley',
  'rift',
];

/** Both players see the same arena: it is picked from the match's seed. */
function arenaFor(seed: string): VenueId {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  return ARENAS[h % ARENAS.length] as VenueId;
}

const EMPTY: Snapshot = {
  phase: 'idle',
  room: null,
  waiting: 0,
  message: null,
  choose: null,
  match: null,
};

export default function PvpScreen() {
  const [vault, setVault] = useState<VaultDeck[]>(loadVault);
  const [online, setOnline] = useState<Online>('checking');
  const [me, setMe] = useState<Me>({ signedIn: false, available: false });
  /** who is signed in has been found out (until then no Vault code is shown or made) */
  const [known, setKnown] = useState(false);
  /** the player changed the Vault by hand, so a sync still on its way must not overwrite it */
  const touched = useRef(false);
  const starters = useMemo(starterDecks, []);
  const decks = useMemo(() => [...vault, ...starters], [vault, starters]);
  const [deckId, setDeckId] = useState<string>(() => decks[0]?.id ?? '');
  const [name, setNameState] = useState(() => getName() || 'Riftwalker');
  const [code, setCode] = useState('');
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [server, setServer] = useState(getServerSetting);
  const [confirmResign, setConfirmResign] = useState(false);
  const [copied, setCopied] = useState(false);
  /** the match whose coin has been shown (the match opens behind it, then stands ready) */
  const [tossShown, setTossShown] = useState<string | null>(null);
  const session = useRef<PvpSession | null>(null);

  // reloading the page in the middle of a match puts you back in it
  useEffect(() => {
    const saved = savedRoom();
    if (!saved || session.current) return;
    const s = new PvpSession(serverBase(), playerId(), setSnap);
    session.current = s;
    s.joinRoom(saved.room, saved.entry);
  }, []);

  // the decks saved on the server and the ones in this browser are brought together
  const alive = useRef(true);
  const runSync = useRef((_local: VaultDeck[]): void => undefined);
  useEffect(() => {
    alive.current = true;
    runSync.current = (local) => {
      void (async () => {
        const who = await whoAmI();
        if (!alive.current) return;
        setMe(who);
        setKnown(true);
        const key = vaultKey();
        const r = await syncVault(key, local);
        // the answer is stale if the page was left, the Vault was changed, or a deck was removed while it was on its way
        if (!alive.current || vaultKey() !== key || touched.current) return;
        setOnline(r.ok ? (r.complete ? 'saved' : 'partial') : 'offline');
        if (r.ok) {
          setVault(r.decks);
          saveVault(r.decks);
        }
      })();
    };
    runSync.current(loadVault());
    return () => {
      alive.current = false;
    };
  }, []);

  // leaving the page ends whatever connection is open
  useEffect(
    () => () => {
      session.current?.close();
      session.current = null;
    },
    [],
  );

  const deck = decks.find((d) => d.id === deckId) ?? decks[0];
  const entry = deck ? entryFor(deck, name.trim() || 'Riftwalker') : null;
  const check = entry ? checkEntry(entry) : null;
  const problem = check && !check.ok ? check.message : null;
  const busy = snap.phase !== 'idle' && snap.phase !== 'error';

  const begin = (how: 'queue' | 'create' | 'join'): void => {
    if (!entry || !check?.ok) return;
    saveName(entry.name);
    // a new session (the server setting may have changed)
    session.current?.leave();
    const s = new PvpSession(serverBase(), playerId(), setSnap);
    session.current = s;
    setSnap(EMPTY);
    if (how === 'queue') s.queue(check.entry);
    else if (how === 'create') s.joinRoom(newRoomCode(), check.entry);
    else s.joinRoom(code.trim().toUpperCase(), check.entry);
  };

  const match = snap.match;
  if (snap.phase === 'match' && match) {
    const link = session.current?.link();
    const over = match.end !== null;
    // the coin (or the agreed order) comes first; the match waits behind it with its moves held
    if (match.toss && tossShown !== match.setup.seed) {
      const meSeat = match.seat;
      const foeSeat = meSeat === 'a' ? 'b' : 'a';
      return (
        <CoinFlip
          me={{ name: match.names[meSeat], hero: match.heroes[meSeat] }}
          foe={{ name: match.names[foeSeat], hero: match.heroes[foeSeat] }}
          first={meSeat === 'a' ? 'me' : 'foe'}
          random={match.toss.random}
          onDone={() => setTossShown(match.setup.seed)}
        />
      );
    }
    if (link)
      return (
        <>
          <FightView
            key={match.room}
            db={COMBAT_DB}
            setup={match.setup}
            title={`${match.names.a} vs ${match.names.b}`}
            venue={arenaFor(match.setup.seed)}
            pvp={link}
            exitLabel={over ? 'Leave' : 'Resign'}
            onExit={() => (over ? back() : setConfirmResign(true))}
            onDone={() => back()}
          />
          {confirmResign && (
            <div className="pvp__confirm" role="dialog" aria-label="Resign">
              <div className="pvp__confirmBody">
                <h2>Resign this match?</h2>
                <p>You lose, and {match.names[match.seat === 'a' ? 'b' : 'a']} wins.</p>
                <div className="modal__row">
                  <button className="btn" onClick={() => setConfirmResign(false)}>
                    <span>Keep playing</span>
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      setConfirmResign(false);
                      session.current?.resign();
                    }}
                  >
                    <span>Resign</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
  }

  function back(): void {
    session.current?.leave();
    setSnap(EMPTY);
    setConfirmResign(false);
  }

  const deckList = (
    <ul className="pvp__decks" aria-label="Your decks">
      {decks.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            className={`pvp__deck${d.id === deck?.id ? ' is-picked' : ''}`}
            aria-pressed={d.id === deck?.id}
            disabled={busy}
            onClick={() => setDeckId(d.id)}
          >
            <HeroIcon hero={d.hero} size={36} />
            <span>
              <b>{labelOf(d)}</b>
              <small>
                {d.deck.length} cards
                {isStarter(d) ? ' · for trying it out' : ' · banked'}
              </small>
            </span>
          </button>
          {!isStarter(d) && !busy && (
            <button
              type="button"
              className="btn btn--small btn--ghost"
              onClick={() => {
                const next = dropFrom(vault, d.id);
                setVault(next);
                saveVault(next);
                touched.current = true;
                void whoAmI().then(() => remoteVault.drop(vaultKey(), d.id));
                if (deckId === d.id) setDeckId(next[0]?.id ?? starters[0]?.id ?? '');
              }}
            >
              <span>Remove</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <main className="setup setup--wide pvp">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Arena</h1>
        <p className="setup__lead">
          Take a banked deck into a match against another player. Turns alternate, there are no
          enemy intents, and each turn has a time limit. Clear a run and choose <b>Bank</b> to add
          decks to your Vault ({vault.length} of {VAULT_SLOTS} used).
        </p>
      </header>

      {snap.phase === 'error' && snap.message && (
        <p className="pvp__error" role="alert">
          {snap.message}
        </p>
      )}

      {snap.phase === 'choose' && snap.choose ? (
        <ChoosePanel
          info={snap.choose}
          onChoose={(first) => session.current?.chooseOrder(first)}
          onCancel={back}
        />
      ) : busy ? (
        <section className="pvp__status" aria-live="polite">
          {snap.phase === 'queue' && (
            <>
              <h2>Looking for an opponent…</h2>
              <p>
                {snap.waiting > 1
                  ? `${snap.waiting} players are waiting.`
                  : 'You are in the queue. Players with a similar Rift Tier are matched first.'}
              </p>
            </>
          )}
          {snap.phase === 'waiting' && (
            <>
              <h2>Waiting for a friend</h2>
              <p>
                Send them this code and ask them to choose <b>Join a room</b>:
              </p>
              <p className="pvp__code">
                <b>{snap.room}</b>
                <button
                  className="btn btn--small"
                  onClick={() => {
                    void navigator.clipboard?.writeText(snap.room ?? '').then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    });
                  }}
                >
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </p>
            </>
          )}
          {snap.phase === 'match' && <h2>Connecting to the match…</h2>}
          {snap.phase !== 'choose' && (
            <button className="btn" onClick={back}>
              <span>Cancel</span>
            </button>
          )}
        </section>
      ) : (
        <>
          <label className="pvp__field">
            Your name (shown to your opponent)
            <input
              value={name}
              maxLength={24}
              onChange={(e) => setNameState(e.target.value)}
              aria-label="Your name"
            />
          </label>
          <h2 className="pvp__h">Choose a deck</h2>
          {deckList}
          {problem && <p className="pvp__error">{problem}</p>}
          <div className="pvp__actions">
            <button
              className="btn btn--primary"
              disabled={!entry || problem !== null}
              onClick={() => begin('queue')}
            >
              <span>Find a match</span>
            </button>
            <button
              className="btn"
              disabled={!entry || problem !== null}
              onClick={() => begin('create')}
            >
              <span>Make a room for a friend</span>
            </button>
            <span className="pvp__join">
              <input
                value={code}
                placeholder="ROOM CODE"
                maxLength={12}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                aria-label="Room code"
              />
              <button
                className="btn"
                disabled={!entry || problem !== null || code.trim().length < 4}
                onClick={() => begin('join')}
              >
                <span>Join a room</span>
              </button>
            </span>
          </div>
          <AccountBox
            me={me}
            onSignedOut={() => {
              // the account's decks must not stay here to be uploaded to a guest Vault
              setMe({ signedIn: false, available: true });
              setOnline('checking');
              setVault([]);
              saveVault([]);
              touched.current = false;
              runSync.current([]);
            }}
          />
          {known && !me.signedIn && (
            <VaultCode
              online={online}
              local={vault}
              onRestore={(decks, complete) => {
                touched.current = true;
                setVault(decks);
                saveVault(decks);
                setOnline(complete ? 'saved' : 'partial');
                setDeckId(decks[0]?.id ?? starters[0]?.id ?? '');
              }}
            />
          )}
          <details className="pvp__server">
            <summary>Server</summary>
            <p>
              Matches run on the PvP server. This build connects to <code>{serverBase()}</code>.
              Change it only if you were given another address.
            </p>
            <input
              value={server}
              placeholder={serverBase()}
              onChange={(e) => {
                setServer(e.target.value);
                setServerSetting(e.target.value);
              }}
              aria-label="Server address"
            />
          </details>
        </>
      )}
    </main>
  );
}
