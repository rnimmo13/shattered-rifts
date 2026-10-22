// #/run: the campaign. Start a run, walk the stage maps, duel, build your deck, and decide whether to Bank or push on.
// The run state lives in @sr/campaign (pure); this screen only calls its functions and shows the result.
// The run is saved to this browser after every step and can be exported to a file.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHARACTERS, character, type CharacterId } from '@sr/content';
import {
  REALM_LABEL,
  RunError,
  availableNodes,
  bank,
  buyCard,
  buyRemoval,
  chooseCard,
  chooseEvent,
  continueLoop,
  duelPlan,
  enterNode,
  finishDuel,
  leaveMerchant,
  newRun,
  nextStage,
  parseRun,
  realmOfStage,
  takeShrine,
  type RunState,
} from '@sr/campaign';
import { DuelView } from '../play/DuelView';
import { MapView } from './MapView';
import { CardOffer, DeckModal, EventView, MerchantView, ShrineView } from './Pickers';
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

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
};

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
  const [run, setRun] = useState<RunState | null>(initial.run);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [showDeck, setShowDeck] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  // autosave after every step; a finished run (collapsed or banked) is not kept as a save
  useEffect(() => {
    if (!run) return;
    // a collapsed run is gone; a banked deck stays saved until the player leaves it (there is no Vault yet)
    if (run.phase === 'collapsed') clearSavedRun();
    else saveRun(run);
    if (run.phase === 'duel' && run.context) markDuelStarted(duelKey(run));
  }, [run]);

  /** Apply a rule function, showing its message instead of crashing if the rules refuse. */
  const act = useCallback((fn: (r: RunState) => RunState) => {
    setRun((cur) => {
      if (!cur) return cur;
      try {
        setNotice(null);
        return fn(cur);
      } catch (e) {
        setNotice(e instanceof RunError ? e.message : 'Something went wrong with that choice.');
        return cur;
      }
    });
  }, []);

  const reportResult = useCallback(
    (won: boolean) => {
      clearDuelStarted();
      act((r) => finishDuel(r, won));
    },
    [act],
  );

  const startRun = (c: CharacterId) => setRun(newRun(c, newSeed()));
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
        <DuelView
          key={`${run.context.nodeId}:${run.stats.duelsWon}:${run.stats.duelsLost}`}
          setup={{
            seed: `${run.seed}:${run.context.nodeId}:${run.stats.duelsWon}:${run.stats.duelsLost}`,
            character: run.character,
            enemyId: plan.enemyId,
            deck: plan.deck,
            enemyEssence: plan.essence,
          }}
          // there is no "leave" in a campaign duel: giving up counts as a loss
          onExit={() => reportResult(false)}
          onAgain={() => reportResult(false)}
          campaign={{ onResult: reportResult }}
        />
      );
    }
  }

  return (
    <main className="run">
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
      {showDeck && (
        <DeckModal deck={run.deck} title="Your deck" onClose={() => setShowDeck(false)} />
      )}
      {confirmAbandon && (
        <div className="modal" role="alertdialog" aria-label="Abandon this run?">
          <div className="modal__panel">
            <h2 className="modal__title">Abandon this run?</h2>
            <p className="modal__hint">Your deck and progress in this run will be lost.</p>
            <div className="modal__row">
              <button className="btn" onClick={leaveRun}>
                <span>Abandon</span>
              </button>
              <button className="btn btn--ghost" onClick={() => setConfirmAbandon(false)}>
                <span>Keep playing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Sanctum(props: {
  onStart: (c: CharacterId) => void;
  onImport: (f: File | undefined) => void;
  notice: string | null;
}) {
  const [pick, setPick] = useState<CharacterId>('maren');
  const c = character(pick);
  return (
    <main className="setup">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <h1 className="setup__title">The Sanctum</h1>
      <p className="setup__lead">
        Choose a Riftwalker and begin a run: five stages, each ending in a Warden. Win duels, add
        cards to your deck, and survive. Lose a duel and you lose Resolve; lose all of it and the
        run collapses. Early alpha: the difficulty is not tuned yet.
      </p>
      <div className="setup__chars" role="radiogroup" aria-label="Riftwalker">
        {CHARACTERS.map((x) => (
          <button
            key={x.id}
            role="radio"
            aria-checked={pick === x.id}
            className={`setup__char realm--${x.realm}${pick === x.id ? ' is-on' : ''}`}
            onClick={() => setPick(x.id)}
          >
            <span className="setup__charName">{x.name}</span>
            <span className="setup__charRealm">{REALM_NAME[x.realm]}</span>
            <span className="setup__charDeck">{x.starterName}</span>
          </button>
        ))}
      </div>
      <p className="setup__lead">
        <b>{c.name}</b> starts with a 20-card deck, <i>{c.starterName}</i>.
      </p>
      {props.notice && (
        <p className="run__notice" role="alert">
          {props.notice}
        </p>
      )}
      <div className="modal__row">
        <button className="btn btn--primary setup__go" onClick={() => props.onStart(pick)}>
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
    </main>
  );
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
        <b>{character(run.character).name}</b>
        <span>
          Tier {run.tier} · Stage {run.stage}/5 · {REALM_LABEL[realmOfStage(run, run.stage)]}
        </span>
      </div>
      <div className="runbar__stats">
        <span className="resolve" aria-label={`Resolve ${run.resolve} of ${run.maxResolve}`}>
          {Array.from({ length: run.maxResolve }, (_, i) => (
            <i key={i} className={i < run.resolve ? 'is-full' : ''} />
          ))}
          <em>Resolve</em>
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
        </section>
      );
    case 'reward':
      return (
        <CardOffer
          title="Choose a card"
          hint="Add one to your deck, or skip: a thin deck draws its best cards more often."
          offers={run.context?.offers ?? []}
          shards={run.context?.shardsGained}
          onPick={(id) => act((r) => chooseCard(r, id))}
          onSkip={() => act((r) => chooseCard(r, null))}
        />
      );
    case 'gift':
      return (
        <CardOffer
          title="The Warden's Gift"
          hint="The Warden falls. Take one of their signature cards."
          offers={run.context?.offers ?? []}
          shards={run.context?.shardsGained}
          onPick={(id) => act((r) => chooseCard(r, id))}
        />
      );
    case 'shrine':
      return (
        <ShrineView
          run={run}
          onRest={() => act((r) => takeShrine(r, { kind: 'rest' }))}
          onRemove={(card) => act((r) => takeShrine(r, { kind: 'remove', card }))}
        />
      );
    case 'merchant':
      return (
        <MerchantView
          run={run}
          onBuy={(i) => act((r) => buyCard(r, i))}
          onRemove={(card) => act((r) => buyRemoval(r, card))}
          onLeave={() => act((r) => leaveMerchant(r))}
        />
      );
    case 'event':
      return <EventView run={run} onChoose={(id) => act((r) => chooseEvent(r, id))} />;
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
            You cleared all five stages at Rift Tier {run.tier}. <b>Bank</b> this deck to keep it
            safe for PvP, or <b>Continue</b> one Tier deeper: harder enemies and better rewards, and
            if Resolve runs out the deck is lost.
          </p>
          <div className="choices-row">
            <button className="bigchoice" onClick={() => act((r) => bank(r))}>
              <b>Bank the deck</b>
              <span>End the run and keep this deck.</span>
            </button>
            <button className="bigchoice" onClick={() => act((r) => continueLoop(r))}>
              <b>Continue to Tier {run.tier + 1}</b>
              <span>Keep your deck, go back to stage 1, one deeper.</span>
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
          </p>
          <button className="btn btn--primary" onClick={props.onLeave}>
            <span>Back to the Sanctum</span>
          </button>
        </section>
      );
    case 'banked':
      return (
        <section className="stage-panel" aria-label="Deck banked">
          <h2 className="stage-panel__title">Deck banked</h2>
          <p className="stage-panel__hint">
            This {run.deck.length}-card deck is safe. The Vault and PvP arrive in a later phase; for
            now, use Export run to keep a copy.
          </p>
          <div className="choices-row">
            <button className="btn" onClick={() => exportRun(run)}>
              <span>Export run</span>
            </button>
            <button className="btn btn--primary" onClick={props.onLeave}>
              <span>Back to the Sanctum</span>
            </button>
          </div>
        </section>
      );
    case 'duel':
      return null;
  }
}
