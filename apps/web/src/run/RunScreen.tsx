// #/run: the campaign. Start a run, walk the stage maps, duel, build your deck, and decide whether to Bank or push on.
// The run state lives in @sr/campaign (pure); this screen only calls its functions and shows the result.
// The run is saved to this browser after every step and can be exported to a file.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COMBAT_DB, RIFTWALKERS, encounter, type HeroId } from '@sr/content/v2';
import {
  DIFFICULTY,
  REALM_LABEL,
  RunError,
  availableNodes,
  bank,
  buyBoon,
  buyCard,
  holdCard,
  buyPotion,
  MAX_TIER,
  sellPotion,
  buyRemoval,
  chooseCard,
  chooseEvent,
  chooseKit,
  choosePrelude,
  continueLoop,
  duelPlan,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  nextStage,
  parseRun,
  FINAL_STAGE,
  realmOfStage,
  takeShrine,
  type Difficulty,
  type Luck,
  type RunState,
} from '@sr/campaign';
import { FightView } from '../fight/FightView';
import { venueForRealm } from '../duel/scene/venue';
import { BoonChip } from '../fight/BoonChip';
import { getHero, rememberHero } from '../app/heroChoice';
import { BoonToast } from './BoonToast';
import { PotionChip } from '../fight/PotionChip';
import { BankedPanel } from './BankedPanel';
import { MID_RUN_SAVES, MidRunSave } from './MidRunSave';
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
import {
  clearDuelStarted,
  clearSavedRun,
  duelWasStarted,
  exportRun,
  loadSavedRun,
  markDuelStarted,
  saveRun,
} from './saves';
import '../play/play.css';
import './run.css';

const newSeed = (): string =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

const duelKey = (r: RunState): string =>
  `${r.seed}:${r.context?.nodeId ?? ''}:${r.stats.duelsWon}:${r.stats.duelsLost}`;

export default function RunScreen() {
  // Resuming into a duel that was already begun counts as a loss: closing the page is not a free retry.
  const [initial] = useState(() => {
    const saved = loadSavedRun();
    if (saved && saved.phase === 'duel' && saved.context && duelWasStarted(duelKey(saved))) {
      clearDuelStarted();
      return {
        run: finishDuel(saved, false),
        notice: 'You left the last duel unfinished, so it counted as a loss.',
      };
    }
    return { run: saved, notice: null as string | null };
  });
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
  const nextGained = useCallback(() => setGained((g) => g.slice(1)), []);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [showDeck, setShowDeck] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  // autosave after every step; a finished run (collapsed or banked) is not kept as a save
  useEffect(() => {
    if (!run) return;
    // a collapsed run is gone; a banked deck stays saved until the player leaves it (it is also copied into the Vault)
    if (run.phase === 'collapsed') clearSavedRun();
    else saveRun(run);
    if (run.phase === 'duel' && run.context) markDuelStarted(duelKey(run));
  }, [run]);

  /** Apply a rule function, showing its message instead of crashing if the rules refuse. */
  const act = useCallback(
    (fn: (r: RunState) => RunState) => {
      const cur = runRef.current;
      if (!cur) return;
      try {
        const next = fn(cur);
        runRef.current = next; // so two quick clicks never both act on the old state
        // what an event just did is worth reading: show it once
        setNotice(
          next.eventResult && next.eventResult !== cur.eventResult ? next.eventResult : null,
        );
        setRun(next);
      } catch (e) {
        setNotice(e instanceof RunError ? e.message : 'Something went wrong with that choice.');
      }
    },
    [setRun],
  );

  const reportResult = useCallback(
    (won: boolean, hp?: number, potions?: string[]) => {
      clearDuelStarted();
      act((r) => finishDuel(r, won, hp, potions));
    },
    [act],
  );

  const startRun = (c: HeroId, d: Difficulty, l: Luck) => setRun(newRun(c, newSeed(), d, l));
  const leaveRun = () => {
    clearSavedRun();
    setRun(null);
    setConfirmAbandon(false);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseRun(await file.text());
    if (!parsed) {
      setNotice('That file is not a valid run save.');
      return;
    }
    setNotice(null);
    setRun(parsed);
  };

  if (!run)
    return <Sanctum onStart={startRun} onImport={(f) => void onImport(f)} notice={notice} />;

  // ---- a duel replaces the whole screen ----
  if (run.phase === 'duel' && run.context) {
    const plan = duelPlan(run);
    if (plan) {
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
                        setNotice('You forfeited: Resolve was spent and the fight starts again.');
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
          <FightView
            key={plan.seed}
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
              b: { enemies: plan.units, tier: plan.tier, hpPct: plan.hpPct, dmgPct: plan.dmgPct },
            }}
            title={`${encounter(plan.encounterId).name} · Stage ${run.stage}${floorLabel(run) && ` · ${floorLabel(run)}`}`}
            exitLabel="Forfeit"
            topExtra={
              <>
                <button className="btn btn--small btn--ghost" onClick={() => setShowMap(true)}>
                  <span>View map</span>
                </button>
                <button
                  className="btn btn--small btn--ghost"
                  onClick={() => setConfirmAbandon(true)}
                >
                  <span>Abandon run</span>
                </button>
              </>
            }
            // there is no "leave" in a campaign fight: giving up counts as a loss
            onExit={() => setConfirmForfeit(true)}
            onDone={(r) =>
              reportResult(r.winner === 'a', r.winner === 'a' ? r.hp : undefined, r.potions)
            }
          />
        </>
      );
    }
  }

  return (
    <main className="run" data-realm={run.phase === 'map' ? run.map.realm : undefined}>
      <RunBar
        run={run}
        onDeck={() => setShowDeck(true)}
        onExport={() => exportRun(run)}
        onAbandon={() => setConfirmAbandon(true)}
      />
      {notice && (
        <p className="run__notice" role="alert">
          {notice}
        </p>
      )}
      <Body run={run} act={act} onLeave={leaveRun} />
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
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [luck, setLuck] = useState<Luck>('normal');
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
        <label className="setup__select">
          <span className="sr-only">Difficulty</span>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
              <option key={d} value={d} title={DIFFICULTY[d].blurb}>
                {DIFFICULTY[d].label}: {DIFFICULTY[d].blurb}
              </option>
            ))}
          </select>
        </label>
        <label
          className="setup__select"
          title="Tilts card rewards and the merchant's stock towards better cards. Handy for testing strong decks."
        >
          <span className="sr-only">Card luck</span>
          <select value={luck} onChange={(e) => setLuck(e.target.value as Luck)}>
            <option value="normal">Card luck: normal</option>
            <option value="lucky">Card luck: lucky (more rares)</option>
            <option value="blessed">Card luck: blessed (mostly rares)</option>
          </select>
        </label>
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
  onExport: () => void;
  onAbandon: () => void;
}) {
  const { run } = props;
  return (
    <header className="runbar">
      <div className="runbar__who">
        <b>{RIFTWALKERS[run.character].hero.name}</b>
        <span>
          Tier {run.tier} · Stage {run.stage}/{FINAL_STAGE}
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
        <button className="btn btn--small btn--ghost" onClick={props.onExport}>
          <span>Export run</span>
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
          onRest={() => act((r) => takeShrine(r, { kind: 'rest' }))}
          onUpgrade={(card) => act((r) => takeShrine(r, { kind: 'upgrade', card }))}
          onRemove={(card) => act((r) => takeShrine(r, { kind: 'remove', card }))}
        />
      );
    case 'merchant':
      return (
        <MerchantView
          run={run}
          onBuy={(i) => act((r) => buyCard(r, i))}
          onHold={(i) => act((r) => holdCard(r, i))}
          onBuyBoon={() => act((r) => buyBoon(r))}
          onBuyPotion={(i) => act((r) => buyPotion(r, i))}
          onSellPotion={(i) => act((r) => sellPotion(r, i))}
          onRemove={(card) => act((r) => buyRemoval(r, card))}
          onLeave={() => act((r) => leaveMerchant(r))}
        />
      );
    case 'event':
      return <EventView run={run} onChoose={(id) => act((r) => chooseEvent(r, id))} />;
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
          {MID_RUN_SAVES && <MidRunSave run={run} />}
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
            You cleared all three stages at Rift Tier {run.tier}. <b>Bank</b> this deck to keep it
            safe for PvP, or <b>Continue</b> one Tier deeper: harder enemies and better rewards, and
            if Resolve runs out the deck is lost.
          </p>
          <div className="choices-row">
            <button className="bigchoice" onClick={() => act((r) => bank(r))}>
              <b>Bank the deck</b>
              <span>End the run and keep this deck.</span>
            </button>
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
          </p>
          <button className="btn btn--primary" onClick={props.onLeave}>
            <span>Back to the Sanctum</span>
          </button>
        </section>
      );
    case 'banked':
      return <BankedPanel run={run} onExport={() => exportRun(run)} onLeave={props.onLeave} />;
    case 'duel':
      return null;
  }
}
