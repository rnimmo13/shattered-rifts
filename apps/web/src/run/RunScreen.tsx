// #/run: the campaign. Start a run, walk the stage maps, duel, build your deck, and decide whether to Bank or push on.
// The run state lives in @sr/campaign (pure); this screen only calls its functions and shows the result.
// The run is saved to this browser after every step and can be exported to a file.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COMBAT_DB, RIFTWALKERS, encounter, type HeroId } from '@sr/content/v2';
import {
  REALM_LABEL,
  RunError,
  availableNodes,
  buyBoon,
  buyCard,
  holdCard,
  releaseHold,
  buyPotion,
  MAX_TIER,
  sellPotion,
  buyRemoval,
  buyUpgrade,
  upgradedCards,
  chooseCard,
  chooseEvent,
  claimTrialPrize,
  pickEventCard,
  pickDeckCard,
  settleInterrupted,
  rollTrial,
  chooseKit,
  choosePrelude,
  continueLoop,
  attachGhost,
  duelPlan,
  ghostWanted,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  nextStage,
  parseRun,
  realmOfStage,
  takeShrine,
  leaveShrine,
  type Difficulty,
  type Luck,
  type RunState,
} from '@sr/campaign';
import { FightView } from '../fight/FightView';
import { venueForRealm } from '../duel/scene/venue';
import { BoonChip } from '../fight/BoonChip';
import { getHero, rememberHero } from '../app/heroChoice';
import { BoonToast } from './BoonToast';
import { ChanceCoin, type Flip } from './ChanceCoin';
import { PotionChip } from '../fight/PotionChip';
import { BankedPanel } from './BankedPanel';
import { autoSaveForArena, loseSavedDecks, savedArenaLabel, shouldAutoSave } from './deckSave';
import { stagesInAll } from '@sr/pvp';
import { stagesCleared } from '../pvp/vault';
import { progressLabel } from '../pvp/deckLayout';
import { reportRun } from '../pvp/boardApi';
import { syncSavedRuns } from './syncRuns';
import { getName, hasUsername } from '../pvp/config';
import { CharacterPicker } from './CharacterPicker';
import { MapLegend, MapView } from './MapView';
import {
  CardOffer,
  DeckModal,
  EventView,
  KitView,
  MerchantView,
  PreludeView,
  ShrineView,
} from './Pickers';
import { appendFightMove, clearFightLog, loadFightLog } from './fightLog';
import { addToHistory, recordOf } from './history';
import type { FightReplay } from '../fight/recap';
import { clearGhostLog } from './ghostDuel';
import { GhostLink } from './GhostLink';
import { fetchGhostBoss } from '../pvp/boardApi';
import type { PvpLink } from '../pvp/link';
import type { Action } from '@sr/combat';
import {
  clearSavedRun,
  exportRun,
  RUN_SLOTS,
  loadActiveRun,
  runCount,
  saveRunSlot,
  startRunSlot,
  setActiveRun,
} from './saves';
import '../play/play.css';
import './run.css';

const newSeed = (): string =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

const duelKey = (r: RunState): string =>
  `${r.seed}:${r.context?.nodeId ?? ''}:${r.stats.duelsWon}:${r.stats.duelsLost}`;

export default function RunScreen() {
  // A fight that was in progress is picked up where it was (see fightLog.ts): reloading the page costs nothing.
  const [initial] = useState(() => {
    const found = loadActiveRun();
    const saved = found?.run ?? null;
    const slot = found?.id ?? null;
    // ... and so does a trial that was begun: it is spent, and the run moves on
    const settled = saved ? settleInterrupted(saved) : null;
    if (saved && settled?.notice)
      return { run: settled.run, slot, loaded: null as RunState | null, notice: settled.notice };
    return { run: saved, slot, loaded: saved, notice: null as string | null };
  });
  /** the saved slot this run is kept in (null: not kept, as when storage is blocked); it only ever writes to this one */
  const slotRef = useRef<string | null>(initial.slot);
  /** the run as it was loaded, which needs no save until something changes */
  const loadedRef = useRef<RunState | null>(initial.loaded);
  const runRef = useRef<RunState | null>(initial.run);
  const [run, setRunState] = useState<RunState | null>(initial.run);
  const [confirmForfeit, setConfirmForfeit] = useState(false);
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    if (!showMap) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setShowMap(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMap]);
  // Boons that just arrived, waiting to be shown (one banner at a time)
  const [gained, setGained] = useState<string[]>([]);
  const setRun = useCallback((r: RunState | null) => {
    const had = runRef.current?.boons ?? [];
    const fresh = r ? r.boons.filter((b) => !had.includes(b)) : [];
    if (fresh.length) setGained((g) => [...g, ...fresh]);
    runRef.current = r;
    setRunState(r);
  }, []);
  /** coins tossed by an event's chances, played before the result is shown (the result waits in `then`) */
  const [coin, setCoin] = useState<{ flips: Flip[]; then: string | null } | null>(null);
  const nextGained = useCallback(() => setGained((g) => g.slice(1)), []);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  /** a result worth reading (what an event or a choice did) is shown green; a refusal or an error stays red */
  const [noticeGood, setNoticeGood] = useState(false);
  const say = (text: string | null, good = false): void => {
    setNotice(text);
    setNoticeGood(good);
  };
  /** where the run's deck stands in the Arena (it is saved by itself after every stop), and a note about it: the first-time explanation, or a full Vault */
  const [arena, setArena] = useState<{ seed: string; label: string } | null>(null);
  const [arenaNote, setArenaNote] = useState<'intro' | 'full' | null>(null);
  /** the stages at which the player has been told the Vault is full (once per stage, then quiet) */
  const fullTold = useRef(new Set<string>());
  /** The run's deck goes to the Arena by itself after every finished stop; the player is told what that means the first time. */
  const saveToArena = useCallback((r: RunState): void => {
    void autoSaveForArena(r).then((a) => {
      if (runRef.current?.seed !== r.seed) return; // (the run was left in the meantime)
      if (a.kind === 'full') {
        const at = `${r.seed}:${r.tier}:${r.stage}`;
        if (fullTold.current.has(at)) return;
        fullTold.current.add(at);
        setArenaNote('full');
        return;
      }
      setArena({ seed: r.seed, label: a.label });
      // (a Vault that was full a moment ago has room now)
      setArenaNote((n) => (n === 'full' ? null : n));
      if (!arenaIntroSeen()) setArenaNote((n) => n ?? 'intro');
    });
  }, []);
  const [showDeck, setShowDeck] = useState(false);
  /** how many saved Arena decks the run took down with it when it collapsed (null: not known yet) */
  const [lostDecks, setLostDecks] = useState<number | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  /** the last fight played in this run (the run history keeps it: the fight that ended a fallen run) */
  const lastFightRef = useRef<(FightReplay & { won: boolean }) | null>(null);

  // autosave after every step; a finished run (collapsed or banked) is not kept as a save
  useEffect(() => {
    if (!run) return;
    const id = slotRef.current;
    if (!id || run === loadedRef.current) return;
    // a collapsed run is gone, and a banked one (an older save) is finished: neither is kept as a parked run
    if (run.phase === 'collapsed' || run.phase === 'banked') {
      clearSavedRun(id);
      slotRef.current = null;
      // (an ended run goes into the run history, with the fight that ended it)
      addToHistory(recordOf(run, run.phase, Date.now(), lastFightRef.current ?? undefined));
      // a run that falls takes its saved Arena deck with it
      if (run.phase === 'collapsed') void loseSavedDecks(run).then(setLostDecks);
    } else if (!saveRunSlot(id, run)) {
      // the slot is gone (the run was abandoned in another window): do not bring it back
      slotRef.current = null;
    }
  }, [run]);

  // a run that is picked up again tells the leaderboards where it is (a report that was missed on the way is made up for)
  const resumedSeed = run?.seed;
  useEffect(() => {
    const r = runRef.current;
    if (!r || r.seed !== resumedSeed || !hasUsername()) return;
    const done = stagesCleared(r);
    // (from its first finished stop: a run abandoned before its first fight does not use up a new-run slot on the server)
    if (stagesInAll(r.tier, done) === 0 && r.stats.nodesCleared === 0) return;
    void reportRun({
      seed: r.seed,
      hero: r.character,
      tier: r.tier,
      stage: done,
      name: getName() || 'Riftwalker',
    });
  }, [resumedSeed]);

  // the leaderboard is told again when the browser comes back (online, or the tab is looked at again), so a report that was missed
  // while the connection was down is made up for without waiting for the app to be reopened
  useEffect(() => {
    const tell = (): void => {
      if (document.visibilityState === 'visible') void syncSavedRuns();
    };
    window.addEventListener('online', tell);
    document.addEventListener('visibilitychange', tell);
    return () => {
      window.removeEventListener('online', tell);
      document.removeEventListener('visibilitychange', tell);
    };
  }, []);

  /** Apply a rule function, showing its message instead of crashing if the rules refuse. */
  const act = useCallback(
    (fn: (r: RunState) => RunState) => {
      const cur = runRef.current;
      if (!cur) return;
      try {
        const next = fn(cur);
        runRef.current = next; // so two quick clicks never both act on the old state
        if (shouldAutoSave(cur, next)) saveToArena(next);
        // a run that has got further is told to the leaderboards (best effort; never in the way)
        const was = stagesInAll(cur.tier, stagesCleared(cur));
        const now = stagesInAll(next.tier, stagesCleared(next));
        // (going on to the next Rift Tier is told too: Tier 1 stage 3 and Tier 2 stage 0 are the same count, but the board should say Tier 2)
        // (and after every finished stop, so a new run is on the board from its first fight; a repeat costs the server nothing)
        if (
          (now > was || next.tier > cur.tier || shouldAutoSave(cur, next)) &&
          next.seed === cur.seed &&
          hasUsername()
        )
          void reportRun({
            seed: next.seed,
            hero: next.character,
            tier: next.tier,
            stage: stagesCleared(next),
            name: getName() || 'Riftwalker',
          });
        // what an event just did is worth reading: show it once
        const eventTold =
          next.eventResult &&
          // (an ambush is told every time, even if the same words were left over from an earlier stop)
          (next.eventResult !== cur.eventResult || (cur.phase === 'map' && next.phase === 'duel'))
            ? next.eventResult
            : null;
        // and so is any card that was upgraded, wherever the upgrade came from (a Shrine, the merchant, an event, a prize)
        const ups = upgradedCards(cur.deck, next.deck).map(
          ([a, b]) => `${COMBAT_DB.cards[a]?.name ?? a} → ${COMBAT_DB.cards[b]?.name ?? b}`,
        );
        const told =
          [
            eventTold,
            ups.length && !(eventTold && /upgrade/i.test(eventTold))
              ? `Upgraded: ${ups.join(', ')}.`
              : null,
          ]
            .filter((x): x is string => x !== null)
            .join(' ') || null;
        // a chance in the event is shown as a coin first, and the result waits for it
        if (cur.phase === 'event' && !cur.context?.event?.trial && next.eventFlips?.length) {
          setCoin({ flips: next.eventFlips, then: told });
          say(null);
        } else say(told, true);
        setRun(next);
      } catch (e) {
        say(e instanceof RunError ? e.message : 'Something went wrong with that choice.');
      }
    },
    [setRun, saveToArena],
  );

  const reportResult = useCallback(
    (won: boolean, hp?: number, potions?: string[]) => {
      if (runRef.current) {
        clearFightLog(duelKey(runRef.current));
        clearGhostLog(duelKey(runRef.current));
      }
      act((r) => finishDuel(r, won, hp, potions));
    },
    [act],
  );

  /** Start a run from a new or imported state: it takes a free slot; if every slot is taken it is refused (nothing is thrown away). */
  const begin = (r: RunState): boolean => {
    if (runCount() >= RUN_SLOTS) {
      say(
        `You have ${RUN_SLOTS} runs in progress. Finish or abandon one (on the home page) before starting another.`,
      );
      return false;
    }
    // (with storage blocked there is no slot, and the run is played without being kept)
    slotRef.current = startRunSlot(r);
    loadedRef.current = null;
    say(null);
    setRun(r);
    return true;
  };
  const startRun = (c: HeroId, d: Difficulty, l: Luck) => {
    begin(newRun(c, newSeed(), d, l));
  };
  /** Back to the home page with the run parked: it is already saved, and can be carried on from there. */
  const goHome = () => {
    setActiveRun(null);
    window.location.hash = '#/';
  };
  const leaveRun = () => {
    // a run given up after it got going is history too
    // (a fallen or banked run was already recorded as such: leaving it afterwards is not abandoning it)
    const cur = runRef.current;
    if (cur && cur.stats.nodesCleared > 0 && cur.phase !== 'collapsed' && cur.phase !== 'banked')
      addToHistory(recordOf(cur, 'abandoned', Date.now(), lastFightRef.current ?? undefined));
    if (runRef.current) {
      clearFightLog(duelKey(runRef.current));
      clearGhostLog(duelKey(runRef.current));
    }
    if (slotRef.current) clearSavedRun(slotRef.current);
    slotRef.current = null;
    setRun(null);
    setConfirmAbandon(false);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseRun(await file.text());
    if (!parsed) {
      say('That file is not a valid run save.');
      return;
    }
    begin(settleInterrupted(parsed).run);
  };

  // a Warden that is a ghost: its deck is fetched once (if none can be had, the usual Warden is fought)
  const wanted = run !== null && ghostWanted(run);
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    // (read from the ref: the ghost is asked for once per Warden, not again whenever the run changes)
    const at = runRef.current;
    void fetchGhostBoss(at?.tier ?? 1, at?.ghostsMet ?? []).then((g) => {
      if (live) act((r) => (ghostWanted(r) ? attachGhost(r, g) : r));
    });
    return () => {
      live = false;
    };
  }, [wanted, act]);

  if (!run)
    return <Sanctum onStart={startRun} onImport={(f) => void onImport(f)} notice={notice} />;

  // ---- a duel replaces the whole screen ----
  if (run.phase === 'duel' && run.context) {
    if (wanted)
      return (
        <main className="run">
          <section className="stage-panel" aria-label="A rival rises">
            <h2 className="stage-panel__title">A rival rises</h2>
            <p className="stage-panel__hint">
              The Warden here is a ghost: a deck that has fought in the Arena. Summoning it…
            </p>
          </section>
        </main>
      );
    const plan = duelPlan(run);
    if (plan) {
      /** the fight screen (a ghost Warden is fought over the PvP link, with the computer in the other seat) */
      const fightView = (link?: PvpLink) => (
        <FightView
          key={plan.seed}
          {...(link
            ? { pvp: link }
            : {
                resume: loadFightLog(duelKey(run), plan.seed),
                onMove: (a: Action) => appendFightMove(duelKey(run), plan.seed, a),
                onResumeFailed: () => clearFightLog(duelKey(run)),
              })}
          venue={venueForRealm(encounter(plan.encounterId).realm)}
          db={COMBAT_DB}
          setup={{
            seed: plan.seed,
            a: {
              hero: run.character,
              deck: plan.deck,
              hp: plan.hp,
              maxHp: plan.maxHp,
              boons: plan.boons,
              potions: plan.potions,
            },
            b: plan.ghost
              ? {
                  hero: plan.ghost.hero,
                  deck: plan.ghost.deck,
                  hp: plan.ghost.hp,
                  maxHp: plan.ghost.hp,
                  dmgPct: plan.ghost.dmgPct,
                  boons: plan.ghost.boons,
                  potions: [],
                }
              : { enemies: plan.units, tier: plan.tier, hpPct: plan.hpPct, dmgPct: plan.dmgPct },
          }}
          title={`${plan.ghost ? `Ghost Warden: ${plan.ghost.name}'s ${RIFTWALKERS[plan.ghost.hero]?.role ?? 'Riftwalker'} deck` : encounter(plan.encounterId).name} · Stage ${run.stage}${floorLabel(run) && ` · ${floorLabel(run)}`}`}
          exitLabel="Forfeit"
          topExtra={
            <>
              <button className="btn btn--small btn--ghost" onClick={() => setShowMap(true)}>
                <span>View map</span>
              </button>
              <button className="btn btn--small btn--ghost" onClick={() => setConfirmAbandon(true)}>
                <span>Abandon run</span>
              </button>
            </>
          }
          // there is no "leave" in a campaign fight: giving up counts as a loss
          onExit={() => setConfirmForfeit(true)}
          onDone={(r) => {
            if (r.replay) lastFightRef.current = { ...r.replay, won: r.winner === 'a' };
            reportResult(r.winner === 'a', r.winner === 'a' ? r.hp : undefined, r.potions);
          }}
        />
      );
      return (
        <>
          {notice && (
            <p className="run__notice run__notice--fight" role="alert">
              {notice}
            </p>
          )}
          {showMap && (
            <div
              className="mapmodal"
              role="dialog"
              aria-label="Stage map"
              data-realm={run.map.realm}
              onClick={() => setShowMap(false)}
            >
              <div className="mapmodal__panel" onClick={(e) => e.stopPropagation()}>
                <h2 className="stage-panel__title">
                  Stage {run.stage}: {REALM_LABEL[realmOfStage(run, run.stage)]}
                </h2>
                <div className="mapwrap">
                  <MapView
                    map={run.map}
                    at={run.at}
                    cleared={run.cleared}
                    available={new Set()}
                    onEnter={() => undefined}
                  />
                </div>
                <MapLegend />
                <button className="btn" onClick={() => setShowMap(false)}>
                  <span>Back to the fight</span>
                </button>
              </div>
            </div>
          )}
          {confirmForfeit && (
            <div className="modal" role="alertdialog" aria-label="Forfeit this fight?">
              <div className="modal__panel">
                <h2 className="modal__title">Forfeit this fight?</h2>
                <p className="modal__hint">It counts as a loss and costs Resolve.</p>
                <div className="modal__row">
                  <button
                    className="btn"
                    onClick={() => {
                      setConfirmForfeit(false);
                      reportResult(false);
                      // the fight restarts, so say plainly that the forfeit counted
                      if (runRef.current?.phase === 'duel')
                        say('You forfeited: Resolve was spent and the fight starts again.');
                    }}
                  >
                    <span>Forfeit</span>
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmForfeit(false)}>
                    <span>Keep fighting</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {confirmAbandon && (
            <AbandonDialog onConfirm={leaveRun} onCancel={() => setConfirmAbandon(false)} />
          )}
          {/* the fight: a ghost Warden is played over the PvP link, any other fight as before */}
          {plan.ghost ? (
            <GhostLink
              key={plan.seed}
              logKey={duelKey(run)}
              setup={{
                seed: plan.seed,
                a: {
                  hero: run.character,
                  deck: plan.deck,
                  hp: plan.hp,
                  maxHp: plan.maxHp,
                  boons: plan.boons,
                  potions: plan.potions,
                },
                b: {
                  hero: plan.ghost.hero,
                  deck: plan.ghost.deck,
                  hp: plan.ghost.hp,
                  maxHp: plan.ghost.hp,
                  dmgPct: plan.ghost.dmgPct,
                  boons: plan.ghost.boons,
                  potions: [],
                },
              }}
              names={{ a: 'You', b: `${plan.ghost.name}'s ghost deck` }}
              progress={{
                a: { tier: run.tier },
                b: {
                  tier: plan.ghost.tier,
                  ...(plan.ghost.stage !== null ? { stage: plan.ghost.stage } : {}),
                },
              }}
            >
              {(link) => fightView(link)}
            </GhostLink>
          ) : (
            fightView()
          )}
        </>
      );
    }
  }

  return (
    <main className="run" data-realm={run.phase === 'map' ? run.map.realm : undefined}>
      <RunBar
        run={run}
        onDeck={() => setShowDeck(true)}
        arenaLabel={arena?.seed === run.seed ? arena.label : savedArenaLabel(run)}
        onHome={goHome}
        onAbandon={() => setConfirmAbandon(true)}
      />
      {notice && (
        <p className={`run__notice${noticeGood ? ' run__notice--good' : ''}`} role="alert">
          {notice}
        </p>
      )}
      {arenaNote === 'intro' && (
        <p className="run__notice run__notice--good" role="status">
          <b>Your deck is now in the Arena.</b> It is saved by itself after every fight, so the
          Arena always has your latest deck, and once it has cleared Tier 3 other players may face
          it as a ghost (the computer plays it). If this run collapses you can no longer bring it to
          the Arena yourself, but a ghost stays. See it under <a href="#/decks">Saved decks</a>.{' '}
          <button
            className="btn btn--small"
            onClick={() => {
              markArenaIntroSeen();
              setArenaNote(null);
            }}
          >
            <span>Got it</span>
          </button>
        </p>
      )}
      {arenaNote === 'full' && (
        <p className="run__notice" role="status">
          Your saved decks are full, so this run's deck is not in the Arena yet. Free a slot on the{' '}
          <a href="#/decks">Saved decks page</a> and it will be saved after your next fight.{' '}
          <button className="btn btn--small btn--ghost" onClick={() => setArenaNote(null)}>
            <span>Dismiss</span>
          </button>
        </p>
      )}
      <Body run={run} act={act} onLeave={leaveRun} onHome={goHome} lostDecks={lostDecks} />
      {coin && (
        <ChanceCoin
          flips={coin.flips}
          onDone={() => {
            say(coin.then, true);
            setCoin(null);
          }}
        />
      )}
      {gained[0] && <BoonToast id={gained[0]} more={gained.length - 1} onDone={nextGained} />}
      {showDeck && (
        <DeckModal deck={run.deck} title="Your deck" onClose={() => setShowDeck(false)} />
      )}
      {confirmAbandon && (
        <AbandonDialog onConfirm={leaveRun} onCancel={() => setConfirmAbandon(false)} />
      )}
    </main>
  );
}

/** "Abandon this run?": the whole run is thrown away, so it asks first. */
function AbandonDialog(props: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal" role="alertdialog" aria-label="Abandon this run?">
      <div className="modal__panel">
        <h2 className="modal__title">Abandon this run?</h2>
        <p className="modal__hint">Your deck and progress in this run will be lost.</p>
        <div className="modal__row">
          <button className="btn" onClick={props.onConfirm}>
            <span>Abandon</span>
          </button>
          <button className="btn btn--ghost" onClick={props.onCancel}>
            <span>Keep playing</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Sanctum(props: {
  onStart: (c: HeroId, d: Difficulty, l: Luck) => void;
  onImport: (f: File | undefined) => void;
  notice: string | null;
}) {
  const [pick, setPickState] = useState<HeroId>(getHero);
  const setPick = (h: HeroId): void => {
    setPickState(h);
    rememberHero(h);
  };
  const difficulty: Difficulty = 'normal';
  const luck: Luck = 'normal';
  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">The Sanctum</h1>
        <p className="setup__lead">
          Choose a Riftwalker and begin a run: three stages, each ending in a Warden. Win fights,
          add cards to your deck, and survive: your HP carries from fight to fight. Lose a fight and
          you lose Resolve; lose all of it and the run collapses.
        </p>
      </header>
      <CharacterPicker value={pick} onChange={setPick} />
      {props.notice && (
        <p className="run__notice" role="alert">
          {props.notice}
        </p>
      )}
      <div className="setup__actions">
        <button
          className="btn btn--primary setup__go"
          onClick={() => props.onStart(pick, difficulty, luck)}
        >
          <span>Begin the run</span>
        </button>
        <label className="btn btn--ghost">
          <span>Import a run file</span>
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => props.onImport(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="setup__note">
        Early alpha. Easy mode is on by default so the whole game can be tested quickly: enemies are
        weaker and you start with extra Resolve and shards.
      </p>
    </main>
  );
}

/** "Floor 4/9" for the node the player stands on ("" before the first step of a stage). */
function floorLabel(run: RunState): string {
  const node = run.map.nodes.find((n) => n.id === run.at);
  if (!node) return '';
  const top = Math.max(...run.map.nodes.map((n) => n.floor));
  return `Floor ${node.floor}/${top}`;
}

function RunBar(props: {
  run: RunState;
  onDeck: () => void;
  /** where the deck stands in the Arena (null: nothing saved yet) */
  arenaLabel: string | null;
  onHome: () => void;
  onAbandon: () => void;
}) {
  const { run } = props;
  return (
    <header className="runbar">
      <div className="runbar__who">
        <b>{RIFTWALKERS[run.character].hero.name}</b>
        <span>
          {progressLabel(run.tier, stagesCleared(run))}
          {floorLabel(run) && ` · ${floorLabel(run)}`} · {REALM_LABEL[realmOfStage(run, run.stage)]}
        </span>
      </div>
      <div className="runbar__stats">
        {run.potions.length > 0 && (
          <span className="boons" aria-label="Potions">
            {run.potions.map((id, i) => (
              <PotionChip key={`${id}-${i}`} id={id} />
            ))}
          </span>
        )}
        {run.boons.length > 0 && (
          <span className="boons" aria-label="Boons">
            {run.boons.map((id) => (
              <BoonChip key={id} id={id} />
            ))}
          </span>
        )}
        <span className="resolve" aria-label={`Resolve ${run.resolve} of ${run.maxResolve}`}>
          {Array.from({ length: run.maxResolve }, (_, i) => (
            <i key={i} className={i < run.resolve ? 'is-full' : ''} />
          ))}
          <em>Resolve</em>
        </span>
        <span className="shards" aria-label={`HP ${run.hp} of ${run.maxHp}`}>
          <b>
            {run.hp}/{run.maxHp}
          </b>{' '}
          HP
        </span>
        <span className="shards">
          <b>{run.shards}</b> shards
        </span>
      </div>
      <div className="runbar__actions">
        <button className="btn btn--small" onClick={props.onDeck}>
          <span>Deck ({run.deck.length})</span>
        </button>
        <a
          className="btn btn--small btn--ghost runbar__arena"
          href="#/decks"
          title="Your deck is entered in the Arena by itself, and updated after every fight. Once it has cleared Tier 3, other players may face it as a ghost (the computer plays it). If this run collapses, you can no longer bring it to the Arena yourself, but a ghost stays. Click to see your saved decks."
        >
          <span>Arena deck: {props.arenaLabel ?? 'saved after your first fight'}</span>
        </a>
        <button
          className="btn btn--small btn--ghost"
          title="Leave for now. This run is kept, and you can carry on from the home page."
          onClick={props.onHome}
        >
          <span>Home</span>
        </button>
        <button className="btn btn--small btn--ghost" onClick={props.onAbandon}>
          <span>Abandon</span>
        </button>
      </div>
    </header>
  );
}

function Body(props: {
  run: RunState;
  act: (fn: (r: RunState) => RunState) => void;
  onLeave: () => void;
  onHome: () => void;
  lostDecks: number | null;
}) {
  const { run, act } = props;
  const available = useMemo(() => new Set(availableNodes(run).map((n) => n.id)), [run]);

  switch (run.phase) {
    case 'map':
      return (
        <section className="stage-panel" aria-label="Stage map">
          <h2 className="stage-panel__title">
            Stage {run.stage}: {REALM_LABEL[realmOfStage(run, run.stage)]}
          </h2>
          <p className="stage-panel__hint">
            Choose where to go next. Floors run left to right; the Warden waits at the end.
          </p>
          <div className="mapwrap">
            <MapView
              map={run.map}
              at={run.at}
              cleared={run.cleared}
              available={available}
              onEnter={(id) => act((r) => enterNode(r, id))}
            />
          </div>
          <MapLegend />
        </section>
      );
    case 'reward':
      return (
        <CardOffer
          title="Choose a card"
          hint="Add one to your deck, or skip: a thin deck draws its best cards more often."
          offers={run.context?.offers ?? []}
          deck={run.deck}
          character={run.character}
          shards={run.context?.shardsGained}
          boon={run.context?.boonGained}
          potion={run.context?.potionGained}
          onPick={(id) => act((r) => chooseCard(r, id))}
          onSkip={() => act((r) => chooseCard(r, null))}
        />
      );
    case 'gift':
      return (
        <CardOffer
          title="The Warden's Gift"
          hint="The Warden falls. Take one of your class's rare cards, or skip it."
          offers={run.context?.offers ?? []}
          deck={run.deck}
          character={run.character}
          shards={run.context?.shardsGained}
          boon={run.context?.boonGained}
          onPick={(id) => act((r) => chooseCard(r, id))}
          onSkip={() => act((r) => chooseCard(r, null))}
        />
      );
    case 'shrine':
      return (
        <ShrineView
          run={run}
          onTake={(choice) => act((r) => takeShrine(r, choice))}
          onLeave={() => act((r) => leaveShrine(r))}
          onRoll={() => act((r) => rollTrial(r))}
          onPrize={(id, pick, cards) => act((r) => claimTrialPrize(r, id, pick, cards))}
        />
      );
    case 'merchant':
      return (
        <MerchantView
          run={run}
          onBuy={(i) => act((r) => buyCard(r, i))}
          onHold={(i) => act((r) => holdCard(r, i))}
          onRelease={(i) => act((r) => releaseHold(r, i))}
          onBuyBoon={() => act((r) => buyBoon(r))}
          onBuyPotion={(i) => act((r) => buyPotion(r, i))}
          onSellPotion={(i) => act((r) => sellPotion(r, i))}
          onRemove={(card) => act((r) => buyRemoval(r, card))}
          onUpgrade={(card) => act((r) => buyUpgrade(r, card))}
          onLeave={() => act((r) => leaveMerchant(r))}
        />
      );
    case 'event':
      return (
        <EventView
          key={run.context?.nodeId}
          run={run}
          onChoose={(id) => act((r) => chooseEvent(r, id))}
          onRoll={() => act((r) => rollTrial(r))}
          onPickCard={(i) => act((r) => pickEventCard(r, i))}
          onPickDeck={(id) => act((r) => pickDeckCard(r, id))}
          onPrize={(id, pick, cards) => act((r) => claimTrialPrize(r, id, pick, cards))}
        />
      );
    case 'kit':
      return <KitView run={run} onChoose={(id) => act((r) => chooseKit(r, id))} />;
    case 'prelude':
      return <PreludeView run={run} onChoose={(id) => act((r) => choosePrelude(r, id))} />;
    case 'stageClear':
      return (
        <section className="stage-panel" aria-label="Stage cleared">
          <h2 className="stage-panel__title">Stage {run.stage} cleared</h2>
          <p className="stage-panel__hint">
            The Warden is beaten and the rift seals behind you. Onward to stage {run.stage + 1}.
          </p>
          <button className="btn btn--primary" onClick={() => act((r) => nextStage(r))}>
            <span>Onward</span>
          </button>
        </section>
      );
    case 'loopCleared':
      return (
        <section className="stage-panel" aria-label="Loop cleared">
          <h2 className="stage-panel__title">The Heart of the Rift is silent</h2>
          <p className="stage-panel__hint">
            You cleared all three stages at Rift Tier {run.tier}. This deck is already in the Arena.
            <b> Continue</b> one Tier deeper for harder enemies and better rewards, but if Resolve
            runs out the run collapses and you can no longer bring its deck to the Arena (past Tier
            3 it stays as a ghost others may face). Or leave the run parked and come back to it
            later.
          </p>
          <div className="choices-row">
            {run.tier < MAX_TIER ? (
              <button className="bigchoice" onClick={() => act((r) => continueLoop(r))}>
                <b>Continue to Tier {run.tier + 1}</b>
                <span>Keep your deck, heal fully, go back to stage 1, one deeper.</span>
              </button>
            ) : (
              <p className="stage-panel__hint">
                Rift Tier {MAX_TIER} is as deep as the rift goes for now.
              </p>
            )}
            <button className="bigchoice" onClick={props.onHome}>
              <b>Leave it for now</b>
              <span>Go home. The run is kept, parked here, to carry on later.</span>
            </button>
          </div>
        </section>
      );
    case 'collapsed':
      return (
        <section className="stage-panel stage-panel--bad" aria-label="Rift collapse">
          <h2 className="stage-panel__title">Rift Collapse</h2>
          <p className="stage-panel__hint">
            Your Resolve is gone and the run falls apart. You won {run.stats.duelsWon} duels and
            cleared {run.stats.nodesCleared} nodes.
            {props.lostDecks !== null && props.lostDecks > 0 && (
              <>
                {' '}
                You can no longer bring this run's deck to the Arena. If it had cleared Tier 3, it
                stays as a ghost that other players may face.
              </>
            )}
          </p>
          <div className="choices-row">
            <button className="btn btn--primary" onClick={props.onLeave}>
              <span>Back to the Sanctum</span>
            </button>
            <a className="btn" href="#/history">
              <span>Run history (watch the last fight)</span>
            </a>
          </div>
        </section>
      );
    case 'banked':
      return <BankedPanel run={run} onExport={() => exportRun(run)} onLeave={props.onLeave} />;
    case 'duel':
      return null;
  }
}

const ARENA_INTRO_KEY = 'sr.arenaIntro';
const arenaIntroSeen = (): boolean => {
  try {
    return localStorage.getItem(ARENA_INTRO_KEY) === '1';
  } catch {
    return false;
  }
};
const markArenaIntroSeen = (): void => {
  try {
    localStorage.setItem(ARENA_INTRO_KEY, '1');
  } catch {
    /* it will be explained again next time */
  }
};
