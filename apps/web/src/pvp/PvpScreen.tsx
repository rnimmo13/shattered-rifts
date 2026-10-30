// #/pvp: duel another player with decks saved from campaign runs (the only decks the Arena takes). Find a match from the queue,
// fight a ghost or play a friend with a room code; every deck in your Vault comes along, and you choose one before each game.

import { useEffect, useRef, useState } from 'react';
import { ARENA_MIN_DECK, MAX_MATCH_DECKS, QUEUE_WIDEN_MS, checkArenaEntry, type Entry } from '@sr/pvp';
import { COMBAT_DB } from '@sr/content/v2';
import { FightView } from '../fight/FightView';
import { arenaFor } from './arenaVenue';
import { ShareLink } from './ShareLink';
import { replayLink, watchLink } from './matchHistory';
import { HeroIcon } from '../ui/HeroIcon';
import { getClaimed, getName, playerId, serverBase, setName as saveName } from './config';
import { PvpSession, newRoomCode, savedRoom, type Snapshot } from './session';
import { takeName } from './takeName';
import { VAULT_SLOTS, entryFor, loadVault, saveVault, type VaultDeck } from './vault';
import { ChoosePanel, GhostOffer, WaitTimer, WhoGoesFirst } from './PvpParts';
import { boardId, queueCount, viewRanks, type RankedView } from './boardApi';
import { RankPanel } from './RankedBoard';
/** where the saved decks stand online (still being checked, saved, partly saved, or not reachable) */
type Online = 'checking' | 'saved' | 'partial' | 'offline';
import { AccountBox } from './AccountBox';
import { RarityTally } from './DeckReport';
import { dateLabel, heroName, progressLabel } from './deckLayout';
import '../play/play.css';
import './decks.css';
import { syncVault, vaultKey, whoAmI, type Me } from './vaultSync';
import { Notice } from '../ui/Toast';
import './pvp.css';

/** how often the Arena page asks how many players are queued */
const QUEUE_POLL_MS = 15_000;

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
  /** the player changed the Vault by hand, so a sync still on its way must not overwrite it */
  const touched = useRef(false);
  // only banked decks can be taken into the Arena
  const decks = vault;
  const [name, setNameState] = useState(() => getName());
  const [code, setCode] = useState('');
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [confirmResign, setConfirmResign] = useState(false);
  /** your rank this season (once the board has said; nothing when it cannot be reached) */
  const [ranked, setRanked] = useState<RankedView['you']>(null);
  useEffect(() => {
    let live = true;
    void viewRanks().then((v) => live && setRanked(v?.you ?? null));
    return () => {
      live = false;
    };
  }, []);
  /** how many players are waiting in the Arena queue (null until the server says, or when it cannot be reached) */
  const [queued, setQueued] = useState<number | null>(null);
  // (the deck picker shows while idle or after an error, so the count is kept fresh for both)
  const idle = snap.phase === 'idle' || snap.phase === 'error';
  useEffect(() => {
    if (!idle) return;
    let live = true;
    const look = (): void => {
      if (document.visibilityState === 'visible')
        void queueCount().then((n) => live && setQueued(n));
    };
    look();
    const t = window.setInterval(look, QUEUE_POLL_MS);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [idle]);
  /** why the name was not accepted (taken, not allowed) */
  const [nameProblem, setNameProblem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** the match whose order reel has been shown (the match opens behind it, then stands ready) */
  const [tossShown, setTossShown] = useState<string | null>(null);
  const session = useRef<PvpSession | null>(null);

  // reloading the page in the middle of a match puts you back in it
  useEffect(() => {
    const saved = savedRoom();
    if (!saved || session.current) return;
    const s = new PvpSession(serverBase(), playerId(), setSnap);
    session.current = s;
    s.joinRoom(saved.room, saved.decks);
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

  // who this player is on the leaderboards (asked once; a match without it is simply not recorded)
  const [who, setWho] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void boardId().then((id) => live && setWho(id));
    return () => {
      live = false;
    };
  }, []);
  // every deck in the Vault the Arena takes comes to the match: one is chosen before each game (DECISIONS #307)
  const playerName = name.trim() || 'Riftwalker';
  const checks = decks.map((d) =>
    checkArenaEntry({ ...entryFor(d, playerName), ...(who ? { who } : {}) }),
  );
  const usable = checks.flatMap((c) => (c.ok ? [c.entry] : [])).slice(0, MAX_MATCH_DECKS);
  const firstProblem = checks.find((c) => !c.ok);
  const problem =
    decks.length > 0 && usable.length === 0 && firstProblem && !firstProblem.ok
      ? firstProblem.message
      : null;
  const ready = usable.length > 0;
  // (some decks pass and others do not: the short ones are left out, and the player is told how many)
  const skipped = checks.filter((c) => !c.ok).length;
  const busy = snap.phase !== 'idle' && snap.phase !== 'error';

  /** the decks that went to the server (with the board id), so a ghost can be asked for later from the queue */
  const sent = useRef<Entry[] | null>(null);
  const begin = async (how: 'queue' | 'create' | 'join' | 'ghost'): Promise<void> => {
    if (!ready) return;
    // names are unique: the one on the decks must be this player's (a name the server has not confirmed is claimed now)
    if (getClaimed() !== playerName) {
      const problem = await takeName(playerName);
      if (problem && !problem.unreachable) {
        setNameProblem(problem.message);
        return;
      }
    }
    setNameProblem(null);
    // (the name as the server wrote it, if it confirmed one)
    if (getClaimed() === '') saveName(playerName);
    // (the board id is normally here already; if it was slow, wait a moment for it rather than play an unrecorded match)
    const id =
      who ??
      (await Promise.race([boardId(), new Promise<null>((r) => setTimeout(() => r(null), 1500))]));
    const toSend = usable.map((e) => (id ? { ...e, who: id } : e));
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
    // the order reel (or the agreed order) comes first; the match waits behind it with its moves held
    if (match.toss && tossShown !== match.setup.seed) {
      const meSeat = match.seat;
      const foeSeat = meSeat === 'a' ? 'b' : 'a';
      return (
        <WhoGoesFirst
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
            topExtra={
              // (a friend can watch the match as it is played: the hand stays hidden from them)
              !over && match.room ? (
                <ShareLink link={watchLink(match.room)} label="Invite to watch" />
              ) : undefined
            }
            resultExtra={() =>
              match.replayId ? (
                <ShareLink link={replayLink(match.replayId)} label="Share the replay" />
              ) : null
            }
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
          <div className="pvp__deck">
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
          </div>
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
          Take a saved deck into a match against another player. Turns alternate, there are no enemy
          intents, and each turn has a time limit. Every match against another player counts toward
          your <b>Arena rank</b>, from Bronze to Diamond, for the month&apos;s season. A run saves
          its deck to your Vault as you play ({vault.length} of {VAULT_SLOTS} used).
        </p>
        {/* (someone the board does not know yet starts where everyone starts) */}
        <RankPanel rank={ranked} place={ranked?.place ?? null} />
      </header>

      {snap.phase === 'error' && snap.message && (
        <p className="pvp__error" role="alert">
          {snap.message}
        </p>
      )}

      {snap.phase === 'choose' && snap.choose ? (
        <ChoosePanel
          info={snap.choose}
          onPick={(deck) => session.current?.pickDeck(deck)}
          onChoose={(first, deck) => session.current?.chooseOrder(first, deck)}
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
                <Notice tone="bad" showAgain={snap.message}>
                  {snap.message}
                </Notice>
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
                  {me.available && !me.signedIn && (
                    <p>Saved decks on another device? Sign in below to bring them here.</p>
                  )}
                  <a className="btn btn--primary" href="#/run">
                    <span>Start a New Run</span>
                  </a>
                </>
              )}
            </section>
          ) : (
            <>
              <h2 className="pvp__h">Your decks</h2>
              <p className="pvp__hint pvp__hint--center">
                All of them come to every match: once you are matched, you choose one before each
                game, and your opponent does the same without seeing yours.
              </p>
              <p className="pvp__deckslot">
                {decks.length} of {VAULT_SLOTS} saved decks · <a href="#/decks">Saved decks</a> ·{' '}
                <a href="#/board">Leaderboards</a> · <a href="#/ghosts">Ghost decks</a>
              </p>
              {deckList}
              {problem && <p className="pvp__error">{problem}</p>}
              {!problem && skipped > 0 && usable.length > 0 && (
                <p className="pvp__hint">
                  {skipped} of your saved decks {skipped === 1 ? 'does' : 'do'} not pass the Arena&apos;s check (a deck needs at least {ARENA_MIN_DECK} cards) and {skipped === 1 ? 'is' : 'are'} left out.
                </p>
              )}
              <div className="pvp__actions">
                <button
                  className="btn btn--primary"
                  disabled={!ready}
                  onClick={() => void begin('queue')}
                >
                  <span>Find a match</span>
                </button>
                <button
                  className="btn"
                  disabled={!ready}
                  onClick={() => void begin('ghost')}
                  title="Face a deck another player has used in the Arena, played by the computer. It does not count on the Arena board."
                >
                  <span>Fight a ghost</span>
                </button>
              </div>
              {queued !== null && (
                <p className="pvp__queued" aria-live="polite">
                  <span className={`pvp__queued-dot${queued > 0 ? ' is-live' : ''}`} />
                  {queued === 0
                    ? 'Nobody is looking for a match right now'
                    : `${queued} ${queued === 1 ? 'player is' : 'players are'} looking for a match`}
                </p>
              )}
              <div className="pvp__friend" role="group" aria-label="Play a friend">
                <h3 className="pvp__friend-h">Play a friend</h3>
                <div className="pvp__friend-row">
                  <button className="btn" disabled={!ready} onClick={() => void begin('create')}>
                    <span>Make a room</span>
                  </button>
                  <span className="pvp__friend-or">or</span>
                  <span className="pvp__join">
                    <input
                      value={code}
                      placeholder="Room code"
                      maxLength={12}
                      onChange={(e) =>
                        setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && ready && code.trim().length >= 4)
                          void begin('join');
                      }}
                      aria-label="Room code"
                    />
                    <button
                      className="btn"
                      disabled={!ready || code.trim().length < 4}
                      onClick={() => void begin('join')}
                    >
                      <span>Join</span>
                    </button>
                  </span>
                </div>
              </div>
              <p className="pvp__hint">
                A ghost is a deck another player has used in the Arena, played by the computer. It
                is practice and counts only on the Ghosts board: never toward your Arena rank or the
                Arena board.
              </p>
              <p className="pvp__hint">
                <a href="#/history">Match history and replays</a>
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
        </>
      )}
    </main>
  );
}
