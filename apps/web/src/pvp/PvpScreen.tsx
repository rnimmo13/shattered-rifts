// #/pvp: duel another player with a banked deck. Pick a deck from your Vault (or a Riftwalker's starting deck, so a match can
// be tried before anyone has cleared a run), then find a match from the queue or play a friend with a room code.

import { useEffect, useRef, useState } from 'react';
import { QUEUE_WIDEN_MS, checkEntry } from '@sr/pvp';
import { COMBAT_DB } from '@sr/content/v2';
import { FightView } from '../fight/FightView';
import type { VenueId } from '../duel/scene/venue';
import { HeroIcon } from '../ui/HeroIcon';
import {
  getClaimed,
  getName,
  getServerSetting,
  playerId,
  serverBase,
  setName as saveName,
  setServerSetting,
} from './config';
import { PvpSession, newRoomCode, savedRoom, type Snapshot } from './session';
import { takeName } from './takeName';
import { VAULT_SLOTS, entryFor, loadVault, saveVault, type VaultDeck } from './vault';
import { ChoosePanel, CoinFlip, GhostOffer, WaitTimer } from './PvpParts';
import { boardId } from './boardApi';
import { VaultCode, type Online } from './VaultCode';
import { AccountBox } from './AccountBox';
import { RarityTally } from './DeckReport';
import { dateLabel, heroName, progressLabel } from './deckLayout';
import '../play/play.css';
import './decks.css';
import { syncVault, vaultKey, whoAmI, type Me } from './vaultSync';
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
  ghosting: false,
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
  // only banked decks can be taken into the Arena
  const decks = vault;
  const [deckId, setDeckId] = useState<string>(() => decks[0]?.id ?? '');
  const [name, setNameState] = useState(() => getName());
  const [code, setCode] = useState('');
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [server, setServer] = useState(getServerSetting);
  const [confirmResign, setConfirmResign] = useState(false);
  /** why the name was not accepted (taken, not allowed) */
  const [nameProblem, setNameProblem] = useState<string | null>(null);
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
  // who this player is on the leaderboards (asked once; a match without it is simply not recorded)
  const [who, setWho] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void boardId().then((id) => live && setWho(id));
    return () => {
      live = false;
    };
  }, []);
  const entry = deck
    ? { ...entryFor(deck, name.trim() || 'Riftwalker'), ...(who ? { who } : {}) }
    : null;
  const check = entry ? checkEntry(entry) : null;
  const problem = check && !check.ok ? check.message : null;
  const busy = snap.phase !== 'idle' && snap.phase !== 'error';

  /** the entry that went to the server (with the board id), so a ghost can be asked for later from the queue */
  const sent = useRef<typeof entry>(null);
  const begin = async (how: 'queue' | 'create' | 'join' | 'ghost'): Promise<void> => {
    if (!entry || !check?.ok) return;
    // names are unique: the one on the entry must be this player's (a name the server has not confirmed is claimed now)
    if (getClaimed() !== entry.name) {
      const problem = await takeName(entry.name);
      if (problem && !problem.unreachable) {
        setNameProblem(problem.message);
        return;
      }
    }
    setNameProblem(null);
    // (the name as the server wrote it, if it confirmed one)
    if (getClaimed() === '') saveName(entry.name);
    // (the board id is normally here already; if it was slow, wait a moment for it rather than play an unrecorded match)
    const id =
      who ??
      (await Promise.race([boardId(), new Promise<null>((r) => setTimeout(() => r(null), 1500))]));
    const toSend = id ? { ...check.entry, who: id } : check.entry;
    sent.current = toSend;
    // a new session (the server setting may have changed)
    session.current?.leave();
    const s = new PvpSession(serverBase(), playerId(), setSnap);
    session.current = s;
    setSnap(EMPTY);
    if (how === 'queue') s.queue(toSend);
    else if (how === 'ghost') s.ghost(toSend);
    else if (how === 'create') s.joinRoom(newRoomCode(), toSend);
    else s.joinRoom(code.trim().toUpperCase(), toSend);
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
            key={`${match.room}:${match.setup.seed}`}
            db={COMBAT_DB}
            setup={match.setup}
            title={`${match.names.a} vs ${match.names.b}${match.series && !match.series.over ? ` · Game ${match.series.game} of 3 (${match.series.wins.a}–${match.series.wins.b})` : ''}`}
            venue={arenaFor(match.setup.seed)}
            pvp={link}
            exitLabel={over ? 'Leave' : 'Resign'}
            onExit={() => (over ? back() : setConfirmResign(true))}
            // a game that is not the last: on to the next (the loser chooses who goes first); the last game ends the match
            onDone={() =>
              match.series && !match.series.over ? session.current?.nextGame() : back()
            }
          />
          {confirmResign && (
            <div className="pvp__confirm" role="dialog" aria-label="Resign">
              <div className="pvp__confirmBody">
                <h2>Resign this game?</h2>
                <p>
                  It counts as a loss for you and a win for{' '}
                  {match.names[match.seat === 'a' ? 'b' : 'a']}. The match is the best of three, so
                  it carries on unless this loss decides it.
                </p>
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
              <b>
                {heroName(d.hero)} · {progressLabel(d.tier, d.stage)}
              </b>
              <small>
                {dateLabel(d.bankedAt)} · {d.deck.length} cards
              </small>
              <span className="pvp__deckmeta">
                <RarityTally deck={d.deck} />
              </span>
            </span>
          </button>
          {!busy && (
            <a className="pvp__viewdeck" href="#/decks">
              <span>View</span>
            </a>
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
              <h2>{snap.ghosting ? 'Finding a ghost…' : 'Looking for an opponent…'}</h2>
              {!snap.ghosting && <WaitTimer label="In the queue" widenAfterMs={QUEUE_WIDEN_MS} />}
              <p>
                {snap.ghosting
                  ? 'A ghost is a deck another player has used in the Arena, played by the computer.'
                  : snap.waiting > 1
                    ? `${snap.waiting} players are waiting.`
                    : 'You are in the queue. Players with a similar Rift Tier are matched first.'}
              </p>
              {snap.message && (
                <p className="notice notice--bad" role="alert">
                  {snap.message}
                </p>
              )}
              {!snap.ghosting && (
                <GhostOffer
                  afterMs={QUEUE_WIDEN_MS}
                  onGhost={() => {
                    if (sent.current) session.current?.ghost(sent.current);
                  }}
                />
              )}
            </>
          )}
          {snap.phase === 'waiting' && (
            <>
              <h2>Waiting for a friend</h2>
              <WaitTimer label="Waiting" />
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
            Username
            <input
              value={name}
              maxLength={24}
              onChange={(e) => {
                setNameState(e.target.value);
                setNameProblem(null);
              }}
              placeholder="Choose a name"
              aria-label="Username"
            />
          </label>
          {nameProblem && (
            <p className="nameclaim__error" role="alert">
              {nameProblem}
            </p>
          )}
          {decks.length === 0 ? (
            <section className="pvp__status pvp__nodecks" aria-live="polite">
              {online === 'checking' ? (
                <h2>Looking for your saved decks…</h2>
              ) : (
                <>
                  <h2>You need a saved deck to play in the Arena</h2>
                  <p>
                    The Arena is played with decks you have built in the campaign. Your deck is
                    entered here automatically after every fight, so just play a run. You keep it
                    whether you win or lose a match. If the run collapses you can no longer bring
                    that deck to the Arena yourself, but once it has cleared Tier 3 it stays as a
                    ghost other players may face.
                  </p>
                  <p>
                    Banked decks on another device?{' '}
                    {me.available && !me.signedIn ? 'Sign in below' : 'Use your Vault code below'}{' '}
                    to load them.
                  </p>
                  <a className="btn btn--primary" href="#/run">
                    <span>Start a New Run</span>
                  </a>
                </>
              )}
            </section>
          ) : (
            <>
              <h2 className="pvp__h">Choose a deck</h2>
              <p className="pvp__deckslot">
                {decks.length} of {VAULT_SLOTS} saved decks · <a href="#/decks">Saved decks</a> ·{' '}
                <a href="#/board">Leaderboards</a>
                <a href="#/ghosts">Ghost decks</a>
              </p>
              {deckList}
              {problem && <p className="pvp__error">{problem}</p>}
              <div className="pvp__actions">
                <button
                  className="btn btn--primary"
                  disabled={!entry || problem !== null}
                  onClick={() => void begin('queue')}
                >
                  <span>Find a match</span>
                </button>
                <button
                  className="btn"
                  disabled={!entry || problem !== null}
                  onClick={() => void begin('ghost')}
                  title="Face a deck another player has used in the Arena, played by the computer. It does not count on the Arena board."
                >
                  <span>Fight a ghost</span>
                </button>
                <button
                  className="btn"
                  disabled={!entry || problem !== null}
                  onClick={() => void begin('create')}
                >
                  <span>Make a room for a friend</span>
                </button>
                <span className="pvp__join">
                  <input
                    value={code}
                    placeholder="ROOM CODE"
                    maxLength={12}
                    onChange={(e) =>
                      setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    }
                    aria-label="Room code"
                  />
                  <button
                    className="btn"
                    disabled={!entry || problem !== null || code.trim().length < 4}
                    onClick={() => void begin('join')}
                  >
                    <span>Join a room</span>
                  </button>
                </span>
              </div>
              <p className="pvp__hint">
                A ghost is a deck another player has used in the Arena, played by the computer. It
                is a fight for fun and for the Ghosts board: it does not count on the Arena board.
              </p>
            </>
          )}
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
                setDeckId(decks[0]?.id ?? '');
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
