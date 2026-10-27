// #/history: the runs that have ended on this device (with their decks and the last fight each played, to watch again or read
// the recap of), and the Arena matches played here (each a replay, to watch or share).

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { syncLists } from './runCloud';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { DIFFICULTY, type Difficulty } from '@sr/campaign';
import { HeroIcon } from '../ui/HeroIcon';
import { FightRecap } from '../fight/FightRecap';
import type { FightReplay } from '../fight/recap';
import { forgetRun, runHistory, type RunRecord } from './history';
import { MatchHistory } from '../pvp/MatchList';
import { BUILD } from '../build';
import './history.css';

const ReplayPlayer = lazy(() => import('../fight/ReplayPlayer'));

const END_LABEL: Record<RunRecord['end'], string> = {
  collapsed: 'Fell',
  banked: 'Saved',
  abandoned: 'Abandoned',
};

const when = (at: number): string =>
  new Date(at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** The cards of a deck, counted: "Strike ×4". */
function deckLines(deck: readonly string[]): { name: string; n: number }[] {
  const by = new Map<string, number>();
  for (const id of deck) {
    const name = COMBAT_DB.cards[id]?.name ?? id;
    by.set(name, (by.get(name) ?? 0) + 1);
  }
  return [...by.entries()]
    .map(([name, n]) => ({ name, n }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function HistoryScreen() {
  const [tab, setTab] = useState<'runs' | 'arena'>('runs');
  const [runs, setRuns] = useState<RunRecord[]>(runHistory);
  const [open, setOpen] = useState<string | null>(null);
  const [recap, setRecap] = useState<FightReplay | null>(null);
  const [watching, setWatching] = useState<FightReplay | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  /** bumped when the player's other devices brought something new (DECISIONS #318), so the lists are read again */
  const [synced, setSynced] = useState(0);
  useEffect(() => {
    let live = true;
    void syncLists().then((changed) => {
      if (!live || !changed) return;
      setRuns(runHistory());
      setSynced((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, []);

  if (watching)
    return (
      <Suspense fallback={<div className="loading">Opening the replay…</div>}>
        <ReplayPlayer replay={watching} onClose={() => setWatching(null)} />
      </Suspense>
    );

  return (
    <main className="history">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="history__title">History</h1>
      <div className="history__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'runs'}
          className={`btn btn--small${tab === 'runs' ? ' is-on' : ''}`}
          onClick={() => setTab('runs')}
        >
          <span>Runs</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'arena'}
          className={`btn btn--small${tab === 'arena' ? ' is-on' : ''}`}
          onClick={() => setTab('arena')}
        >
          <span>Arena matches</span>
        </button>
      </div>
      {tab === 'arena' ? (
        <MatchHistory key={synced} />
      ) : (
        <>
          <p className="history__lead">
            Every run that has ended on this device: how far it got, its deck, and the last fight it
            played (for a run that fell, the fight that ended it), to watch again or to read what
            went wrong. Runs in progress appear here once they end.
          </p>
          {runs.length === 0 && (
            <p className="history__empty">No runs have ended yet. Go and start one.</p>
          )}
          <ol className="history__list">
            {runs.map((r) => (
              <RunRow
                key={r.id}
                run={r}
                open={open === r.id}
                onToggle={() => setOpen(open === r.id ? null : r.id)}
                onRecap={setRecap}
                onWatch={setWatching}
                onForget={() => {
                  forgetRun(r.id);
                  setRuns(runHistory());
                }}
              />
            ))}
          </ol>
          {runs.length > 0 &&
            (confirmClear ? (
              <p className="history__clear">
                Forget every run here?{' '}
                <button
                  className="btn btn--small"
                  onClick={() => {
                    forgetRun(null);
                    setRuns([]);
                    setConfirmClear(false);
                  }}
                >
                  <span>Forget them</span>
                </button>{' '}
                <button
                  className="btn btn--small btn--ghost"
                  onClick={() => setConfirmClear(false)}
                >
                  <span>Keep them</span>
                </button>
              </p>
            ) : (
              <button className="btn btn--small btn--ghost" onClick={() => setConfirmClear(true)}>
                <span>Clear the history</span>
              </button>
            ))}
        </>
      )}
      {recap && <FightRecap db={COMBAT_DB} replay={recap} onClose={() => setRecap(null)} />}
    </main>
  );
}

function RunRow(props: {
  run: RunRecord;
  open: boolean;
  onToggle: () => void;
  onRecap: (r: FightReplay) => void;
  onWatch: (r: FightReplay) => void;
  onForget: () => void;
}) {
  const { run } = props;
  const hero = Object.hasOwn(RIFTWALKERS, run.hero) ? (run.hero as HeroId) : null;
  const lines = useMemo(() => deckLines(run.deck), [run.deck]);
  const fight = run.lastFight;
  return (
    <li className={`history__run history__run--${run.end}`}>
      <button className="history__runHead" aria-expanded={props.open} onClick={props.onToggle}>
        {hero && <HeroIcon hero={hero} size={40} />}
        <span className="history__runName">
          <b>{hero ? RIFTWALKERS[hero].hero.name : run.hero}</b>
          <small>
            {DIFFICULTY[run.difficulty as Difficulty]?.label ?? run.difficulty} · {when(run.at)}
          </small>
        </span>
        <span className="history__runWhere">
          <b className={`history__end history__end--${run.end}`}>{END_LABEL[run.end]}</b>
          <small>
            Tier {run.tier} · Stage {run.stage}
          </small>
        </span>
        <span className="history__runStats">
          {run.duelsWon} won · {run.duelsLost} lost · {run.deck.length} cards
        </span>
      </button>
      {props.open && (
        <div className="history__runBody">
          {fight && (
            <div className="history__fight">
              <span>
                Last fight: <b>{fight.title}</b> ({fight.won ? 'won' : 'lost'})
              </span>
              {run.version !== BUILD.version && (
                <small>
                  (played on {run.version ? `version ${run.version}` : 'an older version'}: cards
                  may have changed since, so it may not play out quite the same)
                </small>
              )}
              <button className="btn btn--small" onClick={() => props.onWatch(fight)}>
                <span>Watch it again</span>
              </button>
              <button className="btn btn--small btn--ghost" onClick={() => props.onRecap(fight)}>
                <span>Recap and battle log</span>
              </button>
            </div>
          )}
          <p className="history__meta">
            Max HP {run.maxHp} · {run.nodesCleared} stops cleared
            {run.boons.length > 0 &&
              ` · Boons: ${run.boons.map((b) => COMBAT_DB.boons[b]?.name ?? b).join(', ')}`}
          </p>
          <ul className="history__deck" aria-label="Deck">
            {lines.map((l) => (
              <li key={l.name}>
                {l.name}
                {l.n > 1 && <small> ×{l.n}</small>}
              </li>
            ))}
          </ul>
          <button className="btn btn--small btn--ghost" onClick={props.onForget}>
            <span>Forget this run</span>
          </button>
        </div>
      )}
    </li>
  );
}
