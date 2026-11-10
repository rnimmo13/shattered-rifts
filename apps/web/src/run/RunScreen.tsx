// #/run: the campaign. Start a run, walk the stage maps, duel, build your deck, and decide whether to Bank or push on.
// The run state lives in @sr/campaign (pure); this screen only calls its functions and shows the result.
// The run is saved to this browser after every step and can be exported to a file.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COMBAT_DB,
  CAMPAIGN_REALMS,
  RIFTWALKERS,
  ascendancyOf,
  classNameOf,
  encounter,
  type HeroId,
} from '@sr/content/v2';
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
  bank,
  sellPotion,
  buyRemoval,
  buyUpgrade,
  upgradedCards,
  chooseAscendancy,
  chooseCard,
  canRerollReward,
  rerollReward,
  chooseSpoil,
  spoilAmounts,
  type Spoil,
  resolveCost,
  chooseHeart,
  ghostToSettle,
  ghostsToSkip,
  settleGhost,
  omensOf,
  omensAt,
  chooseEvent,
  claimTrialPrize,
  pickEventCard,
  pickDeckCard,
  settleInterrupted,
  rollTrial,
  choosePrelude,
  continueLoop,
  attachGhost,
  duelPlan,
  ghostWanted,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  realmOfRun,
  takeShrine,
  leaveShrine,
  type Difficulty,
  type RunState,
} from '@sr/campaign';
import { FightView } from '../fight/FightView';
import { recordCampaignFight, recordBalanceAscendancy } from '../app/balanceJournal';
import { venueFor } from '../duel/scene/venue';
import { SceneBackdrop } from './SceneBackdrop';
import { BoonCard, BoonChip } from '../fight/BoonChip';
import { tipAttrs } from '../ui/tip';
import { SettingsButton } from '../ui/SettingsButton';
import { Notice, Toast } from '../ui/Toast';
import { getHero, rememberHero } from '../app/heroChoice';
import { BoonToast } from './BoonToast';
import { ChanceReel, type Flip } from './ChanceReel';
import { PotionChip } from '../fight/PotionChip';
import { BankedPanel, DeckSaved } from './BankedPanel';
import { canPlay, localOnly } from '../playAccess';
import { ArenaProblems } from '../pvp/ArenaRules';
import type { ArenaProblem } from '@sr/pvp';
import {
  arenaProblemsOf,
  autoSaveForArena,
  loseSavedDecks,
  savedArenaLabel,
  shouldAutoSave,
} from './deckSave';
import { endOnBoard } from './boardEnd';
import { stagesInAll } from '@sr/pvp';
import { stagesCleared } from '../pvp/vault';
import { progressLabel } from '../pvp/deckLayout';
import { reportRun } from '../pvp/boardApi';
import { syncSavedRuns } from './syncRuns';
import { getName, hasUsername } from '../pvp/config';
import { AscendReveal } from './AscendReveal';
import { crestPic } from '../fight/fxMoments';
import { iconUrl } from '../art/gameIcons';
import { Picture } from '../ui/Picture';
import { CharacterPicker } from './CharacterPicker';
import { MapLegend, MapView } from './MapView';
import { useHorizontalMap } from './useHorizontalMap';
import { VictoryPanel } from './VictoryPanel';
import { CardOffer, DeckModal, EventView, MerchantView, PreludeView, ShrineView } from './Pickers';
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
  RUN_SLOTS,
  loadActiveRun,
  runCount,
  saveRunSlot,
  startRunSlot,
  setActiveRun,
} from './saves';
import { soonSyncRuns } from './runCloud';
import '../play/play.css';
import './run.css';
import { useRunClock } from './useRunClock';
import { ShareFight } from './ShareFight';
import { campaignFight } from './campaignFights';
import { RunTimer } from './RunTimer';
import { newRunId, newSeedCode, readSeed, showSeed } from './runSeed';
import type { RunClock } from './runClock';

const duelKey = (r: RunState): string =>
  `${r.seed}:${r.context?.nodeId ?? ''}:${r.stats.duelsWon}:${r.stats.duelsLost}`;

export default function RunScreen() {
  // A fight that was in progress is picked up where it was (see fightLog.ts): reloading the page costs nothing.
  const [initial] = useState(() => {
    const found = loadActiveRun();
    const saved = found?.run ?? null;
    const slot = found?.id ?? null;
    // Load migrations (class reworks or retired ghost encounters) restart obsolete fight logs
    // at the saved checkpoint, then save without the one-time notice.
    if (saved?.reworkNotice) {
      const notice = saved.reworkNotice;
      delete saved.reworkNotice;
      clearFightLog(duelKey(saved));
      clearGhostLog(duelKey(saved));
      return { run: settleInterrupted(saved).run, slot, loaded: null as RunState | null, notice };
    }
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
  const persistTime = useCallback((seed: string, elapsedMs: number, upload = true) => {
    const current = runRef.current;
    const slot = slotRef.current;
    if (!current || current.seed !== seed || !slot || elapsedMs <= (current.elapsedMs ?? 0)) return;
    const next = { ...current, elapsedMs };
    runRef.current = next;
    // Synchronous local checkpoint also works during route unmount/page hide.
    if (saveRunSlot(slot, next) && upload) soonSyncRuns();
  }, []);
  const runClock = useRunClock(run, persistTime);
  /** reels spun for an event's chances, played before the result is shown (the result waits in `then`) */
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
        const at = `${r.seed}:${r.tier}`;
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
  /** an Ascendancy just chosen: its moment is on the screen */
  const [ascended, setAscended] = useState<string | null>(null);
  const clearAscended = useCallback(() => setAscended(null), []);
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
      if (run.won) endOnBoard(run, 'completed');
      // a run that falls takes its saved Arena deck with it
      if (run.phase === 'collapsed' && !run.won) {
        void loseSavedDecks(run).then(setLostDecks);
        // (the board shows the run as fallen)
        endOnBoard(run, 'fell');
      }
    } else if (!saveRunSlot(id, run)) {
      // the slot is gone (the run was abandoned in another window): do not bring it back
      slotRef.current = null;
    }
    // (the player's other devices get the run soon after)
    soonSyncRuns();
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
      completed: r.won === true,
      shards: r.shards,
      seed: r.seed,
      hero: r.character,
      ascendancy: r.ascendancy,
      tier: r.tier,
      stage: done,
      name: getName() || 'Riftwalker',
      playMs: r.elapsedMs,
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
        const next = fn({ ...cur, elapsedMs: runClock.elapsed() });
        runRef.current = next; // so two quick clicks never both act on the old state
        if (shouldAutoSave(cur, next)) saveToArena(next);
        // a run that has got further is told to the leaderboards (best effort; never in the way)
        const was = stagesInAll(cur.tier, stagesCleared(cur));
        const now = stagesInAll(next.tier, stagesCleared(next));
        // (going on to the next Rift Tier is told too: Tier 1 stage 3 and Tier 2 stage 0 are the same count, but the board should say Tier 2)
        // (and after every finished stop, so a new run is on the board from its first fight; a repeat costs the server nothing)
        if (
          (now > was ||
            (next.won && !cur.won) ||
            next.tier > cur.tier ||
            next.shards !== cur.shards ||
            shouldAutoSave(cur, next)) &&
          next.seed === cur.seed &&
          hasUsername()
        )
          void reportRun({
            completed: next.won === true,
            shards: next.shards,
            seed: next.seed,
            hero: next.character,
            ascendancy: next.ascendancy,
            tier: next.tier,
            stage: stagesCleared(next),
            name: getName() || 'Riftwalker',
            playMs: next.elapsedMs,
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
        // a chance in the event is shown on the reel first, and the result waits for it
        // (only when an option was just taken: picking the card a chance won leaves its flips on the run, and must not spin it again)
        if (
          cur.phase === 'event' &&
          !cur.context?.event?.trial &&
          !cur.context?.event?.choose &&
          !cur.context?.event?.chooseDeck &&
          next.eventFlips?.length
        ) {
          setCoin({ flips: next.eventFlips, then: told });
          say(null);
        } else say(told, true);
        setRun(next);
      } catch (e) {
        say(e instanceof RunError ? e.message : 'Something went wrong with that choice.');
      }
    },
    [setRun, saveToArena, runClock],
  );

  // a won run banks itself: its deck goes to the Vault and the run is recorded as completed, without a button to press (Robert
  // 2026-11-09, #701). This also finishes a won run that was parked on its victory screen before this.
  const wonUnbanked = run?.won === true && run.phase === 'loopCleared';
  useEffect(() => {
    // (read from the ref: an effect run twice must not bank twice)
    // (and only while this device may play: a run another device has taken over is not finished from here)
    const cur = runRef.current;
    if (wonUnbanked && cur?.won && cur.phase === 'loopCleared' && (canPlay() || localOnly()))
      act(bank);
  }, [wonUnbanked, act]);

  const reportResult = useCallback(
    (
      won: boolean,
      hp?: number,
      potions?: string[],
      maxHpGained?: number,
      extraRewards?: number,
      turns?: number,
    ) => {
      if (runRef.current) {
        recordCampaignFight(runRef.current, won, turns);
        clearFightLog(duelKey(runRef.current));
        clearGhostLog(duelKey(runRef.current));
      }
      act((r) => finishDuel(r, won, hp, potions, maxHpGained, extraRewards));
    },
    [act],
  );

  /** Start a new run: it takes a free slot; if every slot is taken it is refused (nothing is thrown away). */
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
  /** a new run, on a seed a friend shared or a fresh one (DECISIONS #698) */
  const startRun = (c: HeroId, d: Difficulty, shared?: string) => {
    const code = shared ?? newSeedCode();
    begin(newRun(c, newRunId(code), d, code));
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
    // (giving up in the middle of a fight counts as falling: the run's deck leaves the Arena. Given up anywhere else, the deck as
    // last saved stays: going deeper risks it, stopping keeps it. DECISIONS #270)
    if (cur?.phase === 'duel') void loseSavedDecks(cur);
    // (the board shows how it ended: given up mid-fight it fell, anywhere else it was abandoned)
    if (cur && cur.phase !== 'collapsed' && cur.phase !== 'banked')
      endOnBoard(cur, cur.phase === 'duel' ? 'fell' : 'abandoned');
    if (runRef.current) {
      clearFightLog(duelKey(runRef.current));
      clearGhostLog(duelKey(runRef.current));
    }
    if (slotRef.current) clearSavedRun(slotRef.current);
    slotRef.current = null;
    setRun(null);
    setConfirmAbandon(false);
  };

  // a stage whose Warden may be a ghost: as the stage begins, the server is asked for one from your tier or up to three below it.
  // None (or no connection): the map shows the usual Warden, and that is the fight (DECISIONS #253)
  const settling = run !== null ? (ghostToSettle(run)?.id ?? null) : null;
  useEffect(() => {
    if (!settling) return;
    let live = true;
    const at = runRef.current;
    // (never one this run has met, nor one already waiting on this map: a Warden's and an Echo's, DECISIONS #549)
    void fetchGhostBoss(at?.tier ?? 1, at ? ghostsToSkip(at) : []).then((g) => {
      if (live) act((r) => (ghostToSettle(r)?.id === settling ? settleGhost(r, g) : r));
    });
    return () => {
      live = false;
    };
  }, [settling, act]);

  // (a save from before that: its ghost Warden is asked for as the fight begins, as it was)
  const wanted = run !== null && ghostWanted(run);
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    // (read from the ref: the ghost is asked for once per Warden, not again whenever the run changes)
    const at = runRef.current;
    void fetchGhostBoss(at?.tier ?? 1, at ? ghostsToSkip(at) : []).then((g) => {
      if (live) act((r) => (ghostWanted(r) ? attachGhost(r, g) : r));
    });
    return () => {
      live = false;
    };
  }, [wanted, act]);

  if (!run)
    return (
      <Sanctum
        onStart={startRun}
        notice={notice}
        onDismiss={() => say(null)}
      />
    );

  // ---- a duel replaces the whole screen ----
  if (run.phase === 'duel' && run.context) {
    const atNode = run.map.nodes.find((n) => n.id === run.context?.nodeId);
    if (wanted)
      return (
        <main className="run">
          <section className="stage-panel" aria-label="A rival rises">
            <h2 className="stage-panel__title">A rival rises</h2>
            <p className="stage-panel__hint">
              {atNode?.kind === 'echo'
                ? 'An Echo: a deck that has fought in the Arena. Summoning it…'
                : 'The Warden here is a ghost: a deck that has fought in the Arena. Summoning it…'}
            </p>
          </section>
        </main>
      );
    // a chance that was lost into a fight is shown on its reel first: the fight waits for it (it replaces the whole screen, so the
    // reel drawn over the other pages would never be seen, and would turn up after the fight instead)
    if (coin)
      return (
        <main className="run">
          <ChanceReel
            flips={coin.flips}
            onDone={() => {
              say(coin.then, true);
              setCoin(null);
            }}
          />
        </main>
      );
    const plan = duelPlan(run);
    // a Warden fight or an Echo always says what is at stake: the Resolve left, and what losing it would leave (DECISIONS #274, #549)
    const what = atNode?.kind === 'echo' ? 'Echo' : 'Warden fight';
    const stakes =
      atNode &&
      (atNode.kind === 'warden' ||
        atNode.kind === 'echo' ||
        (atNode.enemyId && encounter(atNode.enemyId).kind === 'warden'))
        ? run.resolve - resolveCost(atNode.kind) <= 0
          ? {
              text: `Resolve ${run.resolve}: lose this ${what} and the run collapses`,
              tone: 'bad' as const,
            }
          : {
              text: `Resolve ${run.resolve}: losing this ${what} costs ${resolveCost(atNode.kind)}, leaving ${run.resolve - resolveCost(atNode.kind)}`,
              tone: 'info' as const,
            }
        : undefined;
    if (plan) {
      /** the fight screen (a ghost Warden is fought over the PvP link, with the computer in the other seat) */
      const fightView = (link?: PvpLink) => (
        <FightView
          key={plan.seed}
          runTimer={<RunTimer clock={runClock} />}
          {...(stakes ? { stakes } : {})}
          {...(!plan.ghost && encounter(plan.encounterId).rule
            ? { rule: encounter(plan.encounterId).rule }
            : {})}
          omens={omensAt(run.tier, !run.campaignRoute).map((o) => ({
            name: o.name,
            text: o.text(run.tier),
          }))}
          {...(link
            ? { pvp: link }
            : {
                resume: loadFightLog(duelKey(run), plan.seed),
                onMove: (a: Action) => appendFightMove(duelKey(run), plan.seed, a),
                onResumeFailed: () => clearFightLog(duelKey(run)),
              })}
          venue={venueFor(encounter(plan.encounterId), plan.seed, !!plan.ghost)}
          db={COMBAT_DB}
          setup={{
            seed: plan.seed,
            a: {
              hero: run.character,
              ...(plan.ascendancy ? { ascendancy: plan.ascendancy } : {}),
              deck: plan.deck,
              hp: plan.hp,
              maxHp: plan.maxHp,
              ...(plan.maxHpBeforeHeart !== undefined
                ? { maxHpBeforeHeart: plan.maxHpBeforeHeart }
                : {}),
              boons: plan.boons,
              potions: plan.potions,
              statuses: plan.heroStatuses,
            },
            b: plan.ghost
              ? {
                  hero: plan.ghost.hero,
                  ...(plan.ghost.ascendancy ? { ascendancy: plan.ghost.ascendancy } : {}),
                  deck: plan.ghost.deck,
                  hp: plan.ghost.hp,
                  maxHp: plan.ghost.hp,
                  dmgPct: plan.ghost.dmgPct,
                  boons: plan.ghost.boons,
                  potions: [],
                }
              : {
                  enemies: plan.units,
                  tier: plan.tier,
                  hpPct: plan.hpPct,
                  dmgPct: plan.dmgPct,
                  mods: plan.mods,
                },
          }}
          title={`${plan.ghost ? `${atNode?.kind === 'echo' ? 'Echo' : 'Ghost Warden'}: ${/^[AEIOU]/.test(classNameOf(plan.ghost.hero, plan.ghost.ascendancy)) ? 'an' : 'a'} ${classNameOf(plan.ghost.hero, plan.ghost.ascendancy)} deck` : encounter(plan.encounterId).name} · Tier ${run.tier}${floorLabel(run) && ` · ${floorLabel(run)}`}`}
          exitLabel="Forfeit"
          topFirst={
            <button className="btn btn--small btn--ghost" onClick={() => setShowMap(true)}>
              <span>View map</span>
            </button>
          }
          topExtra={
            <button className="btn btn--small btn--ghost" onClick={() => setConfirmAbandon(true)}>
              <span>Abandon run</span>
            </button>
          }
          // there is no "leave" in a campaign fight: giving up counts as a loss
          onExit={() => setConfirmForfeit(true)}
          // (DECISIONS #697: the fight is kept for the signed-in player as its result shows, to share by a link or save as a file)
          resultExtra={(r) =>
            r.replay ? (
              <ShareFight
                fight={campaignFight(r.replay, run, r.winner === 'a', {
                  encounter: plan.ghost ? 'ghost' : plan.encounterId,
                  ...(atNode ? { node: atNode.kind, floor: atNode.floor } : {}),
                })}
              />
            ) : null
          }
          onDone={(r) => {
            if (r.replay) lastFightRef.current = { ...r.replay, won: r.winner === 'a' };
            reportResult(
              r.winner === 'a',
              r.winner === 'a' ? r.hp : undefined,
              r.potions,
              r.winner === 'a' ? r.maxHpGained : undefined,
              r.winner === 'a' ? r.extraRewards : undefined,
              r.turns,
            );
          }}
        />
      );
      return (
        <>
          {notice && (
            <Toast tone={noticeGood ? 'good' : 'bad'} onDismiss={() => say(null)}>
              {notice}
            </Toast>
          )}
          {showMap && (
            <div
              className="mapmodal"
              role="dialog"
              aria-label="Tier map"
              data-realm={run.map.realm}
              onClick={() => setShowMap(false)}
            >
              <div className="mapmodal__panel" onClick={(e) => e.stopPropagation()}>
                <h2 className="stage-panel__title">
                  Tier {run.tier}: {REALM_LABEL[realmOfRun(run)]}
                </h2>
                <div className="mapwrap">
                  <MapView
                    map={run.map}
                    at={run.at}
                    cleared={run.cleared}
                    available={new Set()}
                    onEnter={() => undefined}
                    inkKey={`${run.seed}:${run.tier}`}
                  />
                </div>
                <MapLegend />
                <div className="modal__row">
                  {run.map.gauntlet && !plan.ghost && (
                    <button
                      className="btn btn--ghost"
                      title="Keep this run and fight saved, then resume from Home."
                      onClick={goHome}
                    >
                      <span>Home</span>
                    </button>
                  )}
                  <button className="btn" onClick={() => setShowMap(false)}>
                    <span>Back to the fight</span>
                  </button>
                </div>
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
            <AbandonDialog
              midFight={run.phase === 'duel'}
              onConfirm={leaveRun}
              onCancel={() => setConfirmAbandon(false)}
            />
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
                  ...(plan.ascendancy ? { ascendancy: plan.ascendancy } : {}),
                  deck: plan.deck,
                  hp: plan.hp,
                  maxHp: plan.maxHp,
                  ...(plan.maxHpBeforeHeart !== undefined
                    ? { maxHpBeforeHeart: plan.maxHpBeforeHeart }
                    : {}),
                  boons: plan.boons,
                  potions: plan.potions,
                  statuses: plan.heroStatuses,
                },
                b: {
                  hero: plan.ghost.hero,
                  ...(plan.ghost.ascendancy ? { ascendancy: plan.ghost.ascendancy } : {}),
                  deck: plan.ghost.deck,
                  hp: plan.ghost.hp,
                  maxHp: plan.ghost.hp,
                  dmgPct: plan.ghost.dmgPct,
                  boons: plan.ghost.boons,
                  potions: [],
                },
              }}
              names={{ a: 'You', b: plan.ghost.name ? `${plan.ghost.name}'s ghost` : 'Ghost deck' }}
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

  // (a plain call: this sits after the screen's early returns, where a hook may not go, and the check is a pass over at most 80
  // cards)
  const arenaProblems = arenaProblemsOf(run);
  return (
    <main
      className={`run${run.phase === 'map' ? ' run--map' : ''}`}
      data-realm={run.phase === 'map' ? run.map.realm : undefined}
    >
      <RunBar
        run={run}
        clock={runClock}
        onDeck={() => setShowDeck(true)}
        arenaLabel={arena?.seed === run.seed ? arena.label : savedArenaLabel(run)}
        arenaProblems={arenaProblems}
        onHome={goHome}
        onAbandon={() => setConfirmAbandon(true)}
      />
      {/* the deck would not pass the Arena's check: why, in full, on the map (dismissed, it comes back when the reasons change) */}
      {/* (a deck still growing to 15 cards, as every run's starts out, has only the button's tip: no alarm on every new run) */}
      {run.phase === 'map' && arenaProblems.some((p) => !p.growing) && (
        <Notice
          tone="bad"
          className="run__arenaNotice"
          showAgain={arenaProblems.map((p) => p.kind).join('|')}
        >
          <ArenaProblems problems={arenaProblems} />
        </Notice>
      )}
      {run.phase === 'map' && (
        <p className="run__balanceNotice">
          Online Campaign saves contribute private deck and progression snapshots for developer
          balance review. Your raw save and account details are not included. Offline runs are not
          uploaded.
        </p>
      )}
      {notice && (
        <Toast tone={noticeGood ? 'good' : 'bad'} onDismiss={() => say(null)}>
          {notice}
        </Toast>
      )}
      {arenaNote === 'intro' && (
        <Toast
          tone="good"
          onDismiss={() => {
            markArenaIntroSeen();
            setArenaNote(null);
          }}
        >
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
        </Toast>
      )}
      {arenaNote === 'full' && (
        <Toast tone="bad" role="status" onDismiss={() => setArenaNote(null)}>
          Your saved decks are full, so this run's deck is not in the Arena yet. Free a slot on the{' '}
          <a href="#/decks">Saved decks page</a> and it will be saved after your next fight.{' '}
        </Toast>
      )}
      <Body
        run={run}
        act={act}
        onLeave={leaveRun}
        onHome={goHome}
        lostDecks={lostDecks}
        onAscended={setAscended}
      />
      {/* (only if the rules took the choice) */}
      {ascended && run.ascendancy === ascended && (
        <AscendReveal
          id={ascended}
          from={RIFTWALKERS[run.character].hero.name}
          to={classNameOf(run.character, ascended)}
          text={ascendancyOf(run.character, ascended)?.text ?? ''}
          onDone={clearAscended}
        />
      )}
      {coin && (
        <ChanceReel
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
        <AbandonDialog
          midFight={run.phase === 'duel'}
          onConfirm={leaveRun}
          onCancel={() => setConfirmAbandon(false)}
        />
      )}
    </main>
  );
}

/** "Abandon this run?": the whole run is thrown away, so it asks first. */
function AbandonDialog(props: { onConfirm: () => void; onCancel: () => void; midFight: boolean }) {
  return (
    <div className="modal" role="alertdialog" aria-label="Abandon this run?">
      <div className="modal__panel">
        <h2 className="modal__title">Abandon this run?</h2>
        <p className="modal__hint">
          {props.midFight
            ? 'You are in the middle of a fight: giving up now counts as falling, so this run’s deck leaves the Arena too.'
            : 'The run ends here. If its deck was saved for the Arena, it stays there as last saved.'}
        </p>
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
  onStart: (c: HeroId, d: Difficulty, seed?: string) => void;
  notice: string | null;
  onDismiss: () => void;
}) {
  const [pick, setPickState] = useState<HeroId>(getHero);
  const setPick = (h: HeroId): void => {
    setPickState(h);
    rememberHero(h);
  };
  const difficulty: Difficulty = 'normal';
  const [seedText, setSeedText] = useState('');
  const [seedOpen, setSeedOpen] = useState(false);
  // (a seed only counts while its box is open: closed, Begin plays a new one)
  const seed = seedOpen && seedText.trim() ? readSeed(seedText) : undefined;
  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">The Sanctum</h1>
        <p className="setup__lead">
          Choose a Riftwalker and begin a journey through the realms. Defeat their Wardens, win
          fights, add cards to your deck, and survive: your HP carries from fight to fight. Lose a
          fight and you lose Resolve; lose all of it and the run collapses.
        </p>
      </header>
      <CharacterPicker value={pick} onChange={setPick} />
      {props.notice && <Toast onDismiss={props.onDismiss}>{props.notice}</Toast>}
      <div className="setup__actions">
        <div className="setup__start">
          <button
            className="btn btn--primary setup__go"
            disabled={seed === null}
            onClick={() => props.onStart(pick, difficulty, seed ?? undefined)}
          >
            <span>
              {seed
                ? `Begin on seed ${showSeed(seed)}`
                : seed === null
                  ? 'Finish the seed below'
                  : 'Begin the run'}
            </span>
          </button>
        </div>
      </div>
      <details
        className="setup__seed"
        open={seedOpen}
        onToggle={(e) => setSeedOpen(e.currentTarget.open)}
      >
        <summary>Play a shared seed</summary>
        <p>
          Type a seed a friend shared (it is on their run bar) to play the same maps, Wardens and
          offers. The run starts with Begin. Close this to play a new seed instead.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (seed) props.onStart(pick, difficulty, seed);
          }}
        >
          <input
            className="setup__seedInput"
            type="text"
            value={seedText}
            placeholder="K7QM-2XRP"
            maxLength={24}
            spellCheck={false}
            autoCapitalize="characters"
            aria-label="Seed"
            aria-invalid={seed === null}
            onChange={(e) => setSeedText(e.target.value)}
          />
        </form>
        {/* (said once something the length of a seed has been typed, not at the first letter) */}
        {seed === null && seedText.replace(/[\s-]/g, '').length >= 8 && (
          <small role="alert">That is not a seed: 8 letters and digits, like K7QM-2XRP.</small>
        )}
      </details>
      <p className="setup__note">
        Early alpha. Easy mode is on by default so the whole game can be tested quickly: enemies are
        weaker and you start with extra Resolve and shards.
      </p>
    </main>
  );
}

/** The run's seed on the run bar: a click copies it, to share (DECISIONS #698). */
function SeedButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn--small btn--ghost runbar__seed"
      {...tipAttrs({
        kicker: 'Seed',
        title: showSeed(code),
        text: 'Share this seed and a friend can play the same maps, Wardens and offers: they type it in the Sanctum under Play a shared seed. Click to copy it.',
      })}
      onClick={() => {
        void navigator.clipboard?.writeText(showSeed(code)).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          },
          () => undefined,
        );
      }}
    >
      <span>{copied ? 'Copied' : `Seed ${showSeed(code)}`}</span>
    </button>
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
  clock: RunClock;
  onDeck: () => void;
  /** where the deck stands in the Arena (null: nothing saved yet) */
  arenaLabel: string | null;
  /** every reason the deck as it stands could not be brought to the Arena (none: it could) */
  arenaProblems: readonly ArenaProblem[];
  onHome: () => void;
  onAbandon: () => void;
}) {
  const { run } = props;
  const problems = props.arenaProblems;
  return (
    <header className="runbar">
      <RunTimer clock={props.clock} />
      <div className="runbar__who">
        <b
          {...(run.ascendancy
            ? tipAttrs({
                kicker: 'Ascendancy',
                title: classNameOf(run.character, run.ascendancy),
                tone: 'good',
                text: ascendancyOf(run.character, run.ascendancy)?.text ?? '',
              })
            : {})}
        >
          {run.ascendancy && (
            <Picture id={crestPic(run.ascendancy)} className="runbar__crest">
              {null}
            </Picture>
          )}
          {classNameOf(run.character, run.ascendancy)}
        </b>
        <span>
          {progressLabel(run.tier, stagesCleared(run))}
          {floorLabel(run) && ` · ${floorLabel(run)}`} · {REALM_LABEL[realmOfRun(run)]}
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
        {run.heart && (
          <span className="boons" aria-label="Warden's Heart">
            <BoonChip id={run.heart} />
          </span>
        )}
        {omensAt(run.tier, !run.campaignRoute).length > 0 && (
          <span
            className="runbar__omens"
            tabIndex={0}
            {...tipAttrs({
              kicker: 'Rift Omens',
              title: `${omensAt(run.tier, !run.campaignRoute).length} ${omensAt(run.tier, !run.campaignRoute).length === 1 ? 'Omen' : 'Omens'} at Tier ${run.tier}`,
              tone: 'bad',
              text: 'Every Rift Tier brings an Omen, starting with the first, and they stack. Each grows the deeper you go. Existing legacy tiers retain their saved schedule until advancing.',
              lines: omensAt(run.tier, !run.campaignRoute).map((o) => ({
                title: o.name,
                text: o.text(run.tier),
              })),
            })}
          >
            <span aria-hidden>☾</span> {omensAt(run.tier, !run.campaignRoute).length}{' '}
            {omensAt(run.tier, !run.campaignRoute).length === 1 ? 'Omen' : 'Omens'}
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
        {/* whether the deck is in the Arena: green when it is, red and struck through until the first fight saves it, or while
            the deck as it stands would not pass the Arena's check (DECISIONS #442); the details in its tip (DECISIONS #345) */}
        <a
          className={`runbar__arena ${props.arenaLabel && problems.length === 0 ? 'is-in' : 'is-out'}`}
          href={problems.length > 0 ? '#/arena-rules' : '#/decks'}
          aria-label={
            problems.length > 0
              ? `Not valid for the Arena: ${problems.map((p) => p.text).join(' ')}`
              : props.arenaLabel
                ? `In the Arena: ${props.arenaLabel}`
                : 'Not in the Arena yet: saved after your first fight'
          }
          {...tipAttrs(
            problems.length > 0
              ? {
                  kicker: 'Not valid for the Arena',
                  tone: 'bad',
                  // (every reason, not only the first: DECISIONS #729)
                  title:
                    problems.length === 1
                      ? (problems[0]?.text ?? '')
                      : `${problems.length} things keep this deck out of the Arena`,
                  ...(problems.length > 1
                    ? { lines: problems.map((p, i) => ({ title: `${i + 1}.`, text: p.text })) }
                    : {}),
                  text: 'The Arena checks every deck before a match. Fix these on the way and the deck is entered again after your next fight.',
                  hint: 'Click to see what the Arena takes.',
                }
              : {
                  kicker: props.arenaLabel ? 'In the Arena' : 'Not in the Arena yet',
                  title: props.arenaLabel ?? 'Saved after your first fight',
                  text: 'Your deck is entered in the Arena by itself, and updated after every fight. Once it has cleared Tier 3, other players may face it as a ghost (the computer plays it). If this run collapses, you can no longer bring it to the Arena yourself, but a ghost stays. Click to see your saved decks.',
                },
          )}
        >
          <span>Arena</span>
        </a>
        {run.seedCode && <SeedButton code={run.seedCode} />}
        <SettingsButton />
        <button className="btn btn--small runbar__deck" onClick={props.onDeck}>
          <span>Deck ({run.deck.length})</span>
        </button>
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
  onAscended: (id: string) => void;
}) {
  const { run, act } = props;
  const available = useMemo(() => new Set(availableNodes(run).map((n) => n.id)), [run]);
  const horizontalMap = useHorizontalMap();

  switch (run.phase) {
    case 'map':
      return (
        <section className="stage-panel stage-panel--map" aria-label="Tier map">
          <h2 className="stage-panel__title">
            Tier {run.tier}: {REALM_LABEL[realmOfRun(run)]}
          </h2>
          <p className="stage-panel__hint">
            {run.map.gauntlet ? (
              <>
                Choose the next Warden when ready. You can go Home and resume this gauntlet later.
              </>
            ) : (
              <>
                Choose a glowing stop. Follow the paths {horizontalMap ? 'to the right' : 'down'} as
                they split and meet; the Warden waits at the end.
              </>
            )}
            {run.map.themed && (
              <span className="stage-panel__realm-story">
                {run.map.finale === 'dragons' ? (
                  'Drago’s homeland is gone. Five dragon Wardens guard its remains; Drago waits beyond them.'
                ) : (
                  <>
                    {CAMPAIGN_REALMS.find((world) => world.id === run.map.realm)?.description}{' '}
                    <strong>
                      Warden:{' '}
                      {
                        encounter(run.map.nodes.find((node) => node.kind === 'warden')!.enemyId!)
                          .name
                      }
                    </strong>
                  </>
                )}
              </span>
            )}
          </p>
          <div className="mapwrap">
            <MapView
              map={run.map}
              at={run.at}
              cleared={run.cleared}
              available={available}
              onEnter={(id) => act((r) => enterNode(r, id))}
              inkKey={`${run.seed}:${run.tier}`}
            />
          </div>
          <MapLegend />
        </section>
      );
    case 'reward':
      return (
        <CardOffer
          title={run.context?.extraReward ? 'Choose another card' : 'Choose a card'}
          onReroll={canRerollReward(run) ? () => act(rerollReward) : undefined}
          hint={
            run.context?.extraReward
              ? 'An extra card reward, earned by a killing blow. Add one to your deck, or skip.'
              : 'Add one to your deck, or skip: a thin deck draws its best cards more often.'
          }
          offers={run.context?.offers ?? []}
          character={run.character}
          shards={run.context?.shardsGained}
          boon={run.context?.boonGained}
          potion={run.context?.potionGained}
          onPick={(id) => act((r) => chooseCard(r, id))}
          onSkip={() => act((r) => chooseCard(r, null))}
          spoilTaken={run.context?.spoilTaken}
          spoils={(() => {
            const amt = spoilAmounts(run);
            return amt
              ? { ...amt, onTake: (sp: Spoil) => act((r) => chooseSpoil(r, sp)) }
              : undefined;
          })()}
        />
      );
    case 'ascend':
      return (
        <section className="stage-panel" aria-label="Choose your Ascendancy">
          <div
            className="ascendbanner"
            style={{ backgroundImage: `url("${iconUrl('ascend-banner')}")` }}
          >
            <h2 className="stage-panel__title">Ascend</h2>
          </div>
          <p className="stage-panel__hint">
            The Warden falls, and you are not who you were.{' '}
            {run.context?.shardsGained ? `+${run.context.shardsGained} shards. ` : ''}This is your
            reward: choose what the {RIFTWALKERS[run.character].hero.name} becomes. It lasts the
            rest of this run, and it stays with this deck in the Arena.
          </p>
          <div className="choices-row">
            {(run.context?.ascendancies ?? []).map((id) => {
              const x = ascendancyOf(run.character, id);
              return x ? (
                <button
                  key={id}
                  className="bigchoice"
                  onClick={() => {
                    act((r) => {
                      const next = chooseAscendancy(r, id);
                      recordBalanceAscendancy(r, id);
                      return next;
                    });
                    props.onAscended(id);
                  }}
                >
                  <Picture id={crestPic(id)} className="bigchoice__crest">
                    {null}
                  </Picture>
                  <b>{x.name}</b>
                  <span>{x.text}</span>
                  <small>Leans into: {x.leans}</small>
                </button>
              ) : null;
            })}
          </div>
        </section>
      );
    case 'gift':
      return (
        <>
          <CardOffer
            title="The Warden's Gift"
            onReroll={canRerollReward(run) ? () => act(rerollReward) : undefined}
            hint={
              run.context?.hearts?.length
                ? "The Warden falls. Take one of your class's rare cards, or one of the Warden's Hearts below, or neither."
                : "The Warden falls. Take one of your class's rare cards, or skip it."
            }
            offers={run.context?.offers ?? []}
            character={run.character}
            shards={run.context?.shardsGained}
            boon={run.context?.boonGained}
            onPick={(id) => act((r) => chooseCard(r, id))}
            onSkip={() => act((r) => chooseCard(r, null))}
          />
          {run.context?.hearts && run.context.hearts.length > 0 && (
            <section className="stage-panel hearts" aria-label="Warden's Hearts">
              <h2 className="stage-panel__title">Or a Warden's Heart</h2>
              <p className="stage-panel__hint">
                A Heart changes every fight for the rest of the run, for a price. You hold one at a
                time
                {run.heart
                  ? `: taking one gives back your ${COMBAT_DB.boons[run.heart]?.name ?? 'Heart'}`
                  : ''}
                . It takes the place of the card.
              </p>
              <div className="hearts__row">
                {run.context.hearts.map((id) => (
                  <div key={id} className="hearts__one">
                    <BoonCard id={id} />
                    <button className="btn" onClick={() => act((r) => chooseHeart(r, id))}>
                      <span>Take the {COMBAT_DB.boons[id]?.name ?? 'Heart'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      );
    case 'shrine':
      return (
        <>
          <SceneBackdrop scene="shrine" mode="dim" />
          <ShrineView
            run={run}
            onTake={(choice) => act((r) => takeShrine(r, choice))}
            onLeave={() => act((r) => leaveShrine(r))}
            onRoll={() => act((r) => rollTrial(r))}
            onPrize={(id, pick, cards) => act((r) => claimTrialPrize(r, id, pick, cards))}
          />
        </>
      );
    case 'merchant':
      return (
        <>
          <SceneBackdrop scene="merchant" mode="dim" />
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
        </>
      );
    case 'event':
      return (
        <>
          <SceneBackdrop scene={run.context?.event?.scene} mode="side" />
          <EventView
            key={run.context?.nodeId}
            run={run}
            onChoose={(id) => act((r) => chooseEvent(r, id))}
            onRoll={() => act((r) => rollTrial(r))}
            onPickCard={(i) => act((r) => pickEventCard(r, i))}
            onPickDeck={(id) => act((r) => pickDeckCard(r, id))}
            onPrize={(id, pick, cards) => act((r) => claimTrialPrize(r, id, pick, cards))}
          />
        </>
      );
    case 'prelude':
      return <PreludeView run={run} onChoose={(id) => act((r) => choosePrelude(r, id))} />;
    case 'loopCleared':
      // (only for a moment: a won run banks itself, #701)
      if (run.won) return <VictoryPanel run={run} onHome={() => act(bank)} />;
      return (
        <section className="stage-panel" aria-label="Tier cleared">
          <h2 className="stage-panel__title">
            {run.tier < MAX_TIER ? 'The Warden has fallen' : 'The Heart of the Rift is silent'}
          </h2>
          <p className="stage-panel__hint">
            You cleared Rift Tier {run.tier}. This deck is already in the Arena.
            {run.tier < MAX_TIER ? (
              <>
                <b> Continue</b> one Tier deeper for harder enemies and better rewards, but if
                Resolve runs out the run collapses and you can no longer bring its deck to the Arena
                (past Tier 3 it stays as a ghost others may face). Or leave the run parked and come
                back to it later.
              </>
            ) : (
              ' You have climbed the whole Rift, and beaten Drago at the top of it.'
            )}
          </p>
          <div className="choices-row">
            {run.tier < MAX_TIER ? (
              <button className="bigchoice" onClick={() => act((r) => continueLoop(r))}>
                <b>Continue to Tier {run.tier + 1}</b>
                <span>
                  {run.tier + 1 === MAX_TIER
                    ? 'Enter the First Ruin: five dragon Wardens, then Drago. Normal Warden rewards and recovery, with three upgrade/remove shrines.'
                    : 'Keep your deck and HP. One tier deeper, one floor longer.'}
                </span>
                <span className="bigchoice__omen">
                  {omensOf(run.tier + 1).map((o) => (
                    <span key={o.id}>
                      A new Omen: <b>{o.name}</b>. {o.text(run.tier + 1)}{' '}
                    </span>
                  ))}
                  {omensAt(run.tier, !run.campaignRoute).length > 0 &&
                    'The Omens you have grow too.'}
                </span>
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
      return run.won ? (
        <VictoryPanel run={run} onHome={props.onLeave}>
          <DeckSaved run={run} />
        </VictoryPanel>
      ) : (
        <BankedPanel run={run} onLeave={props.onLeave} />
      );
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
