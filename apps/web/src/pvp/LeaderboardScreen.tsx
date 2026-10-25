// The leaderboards (#/board): the Arena (most wins) and the campaign (furthest run), for this week or this month.

import { useEffect, useState } from 'react';
import { periodEnd, type Period, type PvpStanding, type RunStanding } from '@sr/pvp';
import { HeroIcon } from '../ui/HeroIcon';
import { heroName } from './deckLayout';
import { pvpBoard, runBoard, type Board } from './boardApi';
import { getName, setName } from './config';
import './board.css';

type Kind = 'pvp' | 'runs';

/** "3 days left", "5 hours left": how long this period has to run. */
function timeLeft(now: number, period: Period): string {
  const ms = Math.max(0, periodEnd(now, period) - now);
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`;
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} left`;
  return 'under an hour left';
}

export function LeaderboardScreen() {
  const [kind, setKind] = useState<Kind>('pvp');
  const [period, setPeriod] = useState<Period>('week');
  // what came back, with the period it was asked for (an answer for the other period counts as still loading)
  const [pvpGot, setPvp] = useState<{ period: Period; board: Board<PvpStanding> | null } | null>(
    null,
  );
  const [runsGot, setRuns] = useState<{ period: Period; board: Board<RunStanding> | null } | null>(
    null,
  );
  // asking again (the Retry button)
  const [tries, setTry] = useState(0);
  const [name, setNameState] = useState(() => getName() || 'Riftwalker');
  // (read once: how long is left changes by the hour, and a page left open is not worth redrawing for it)
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    void pvpBoard(period).then((board) => live && setPvp({ period, board }));
    void runBoard(period).then((board) => live && setRuns({ period, board }));
    return () => {
      live = false;
    };
  }, [period, tries]);

  const pvp = pvpGot?.period === period ? pvpGot.board : undefined;
  const runs = runsGot?.period === period ? runsGot.board : undefined;
  const loading = kind === 'pvp' ? pvp === undefined : runs === undefined;
  const failed = kind === 'pvp' ? pvp === null : runs === null;

  return (
    <main className="setup setup--wide board">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Leaderboards</h1>
        <p className="setup__lead">
          Arena boards rank wins; campaign boards rank how far a run got. A week runs Monday to
          Monday and a month from the 1st, both on UTC time.
        </p>
      </header>

      <div className="board__tabs" role="group" aria-label="Which board">
        <button
          aria-pressed={kind === 'pvp'}
          className={`btn btn--small${kind === 'pvp' ? ' is-open' : ''}`}
          onClick={() => setKind('pvp')}
        >
          <span>Arena</span>
        </button>
        <button
          aria-pressed={kind === 'runs'}
          className={`btn btn--small${kind === 'runs' ? ' is-open' : ''}`}
          onClick={() => setKind('runs')}
        >
          <span>Campaign</span>
        </button>
      </div>
      <div className="board__tabs" role="group" aria-label="Which period">
        <button
          aria-pressed={period === 'week'}
          className={`btn btn--small${period === 'week' ? ' is-open' : ''}`}
          onClick={() => setPeriod('week')}
        >
          <span>This week</span>
        </button>
        <button
          aria-pressed={period === 'month'}
          className={`btn btn--small${period === 'month' ? ' is-open' : ''}`}
          onClick={() => setPeriod('month')}
        >
          <span>This month</span>
        </button>
      </div>
      <p className="board__left">{timeLeft(now, period)}</p>

      {loading && (
        <p className="board__note" role="status">
          Loading the board…
        </p>
      )}
      {failed && (
        <div className="notice notice--bad" role="alert">
          The boards could not be reached. Check your connection and try again.{' '}
          <button className="btn btn--small" onClick={() => setTry((n) => n + 1)}>
            <span>Retry</span>
          </button>
        </div>
      )}

      {kind === 'pvp' && pvp && (
        <ol className="board__list" aria-label="Arena wins this period">
          {pvp.board.length === 0 && (
            <li className="board__empty">No matches yet this {period}. Be the first.</li>
          )}
          {pvp.board.map((s, i) => (
            <li key={`${s.name}-${i}`} className="board__row">
              <span className="board__rank">{i + 1}</span>
              <span className="board__name">{s.name}</span>
              <span className="board__record">
                <b>{s.wins}</b> – {s.losses}
                <small>
                  {s.wins + s.losses === 0
                    ? ''
                    : ` ${Math.round((100 * s.wins) / (s.wins + s.losses))}%`}
                </small>
              </span>
              <span className="board__heroes">
                {s.heroes.map((h) => (
                  <span
                    key={h.hero}
                    className="board__hero"
                    title={`${heroName(h.hero)}: ${h.wins} won, ${h.losses} lost`}
                  >
                    <HeroIcon hero={h.hero} size={26} />
                    <small>
                      {h.wins}–{h.losses}
                    </small>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ol>
      )}

      {kind === 'runs' && runs && (
        <ol className="board__list" aria-label="Furthest campaign runs this period">
          {runs.board.length === 0 && (
            <li className="board__empty">No runs yet this {period}. Be the first.</li>
          )}
          {runs.board.map((s, i) => (
            <li key={`${s.name}-${i}`} className="board__row">
              <span className="board__rank">{i + 1}</span>
              <span className="board__name">{s.name}</span>
              <span className="board__record">
                Rift Tier <b>{s.tier}</b>
                <small>
                  {' '}
                  · {s.stage} of 3 stages · {s.total} in all
                </small>
              </span>
              <span className="board__heroes">
                <span className="board__hero" title={heroName(s.hero)}>
                  <HeroIcon hero={s.hero} size={26} />
                  <small>{heroName(s.hero)}</small>
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <section className="board__you">
        <label>
          <span>Your name on the boards</span>
          <input
            value={name}
            maxLength={20}
            onChange={(e) => {
              setNameState(e.target.value);
              setName(e.target.value.trim());
            }}
            aria-label="Your name on the boards"
          />
        </label>
        <p className="board__note">
          It is the same name you use in the Arena. Results already recorded keep the name they were
          made under until your next match or run.
        </p>
      </section>
    </main>
  );
}
