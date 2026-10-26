// #/trophies: the Trophy case. Every weekly and monthly Arena trophy this player has won (a top-100 finish when that board closed,
// DECISIONS #238), newest first, with the totals on top.

import { useEffect, useState } from 'react';
import { TROPHY_PLACES, type Trophy } from '@sr/pvp';
import { fetchTrophies } from './boardApi';
import { TrophyCup } from './Trophies';
import './trophies.css';

const DAY = 86_400_000;
/** "Week of Oct 19" / "October 2026": the period a trophy was won for (in the board's own time zone, more or less) */
function periodLabel(t: Trophy): string {
  // (the period starts at Pacific midnight, so the day itself is read half a day in)
  const d = new Date(t.period + DAY / 2);
  return t.kind === 'month'
    ? d.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`;
}

export default function TrophyCaseScreen() {
  const [trophies, setTrophies] = useState<Trophy[] | null | 'loading'>('loading');
  useEffect(() => {
    let alive = true;
    void fetchTrophies().then((t) => {
      if (alive) setTrophies(t);
    });
    return () => {
      alive = false;
    };
  }, []);
  const list = Array.isArray(trophies) ? trophies : [];
  const months = list.filter((t) => t.kind === 'month');
  const weeks = list.filter((t) => t.kind === 'week');
  return (
    <main className="trophycase">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="trophycase__title">Trophy case</h1>
      <p className="trophycase__lead">
        Finish a week or a month in the top {TROPHY_PLACES} of the Arena board and its trophy is
        yours for good: a silver cup for a week, a gold one for a month. Your trophies show on your
        card in every Arena match.
      </p>
      {trophies === 'loading' ? (
        <p className="trophycase__empty">Opening the case…</p>
      ) : trophies === null ? (
        <p className="trophycase__empty">
          Your trophies could not be loaded. Trophies are kept with your Vault code or account: play
          an Arena match, or <a href="#/decks">save a deck</a>, to have one.
        </p>
      ) : (
        <>
          <div className="trophycase__totals">
            <div className="trophycase__total">
              <TrophyCup kind="month" size={40} />
              <b>{months.length}</b>
              <span>monthly</span>
            </div>
            <div className="trophycase__total">
              <TrophyCup kind="week" size={34} />
              <b>{weeks.length}</b>
              <span>weekly</span>
            </div>
          </div>
          {list.length === 0 ? (
            <p className="trophycase__empty">
              No trophies yet. The <a href="#/board">Arena board</a> closes every Monday and on the
              first of every month: be in its top {TROPHY_PLACES} when it does.
            </p>
          ) : (
            <ul className="trophycase__shelf">
              {list.map((t) => (
                <li
                  key={`${t.kind}-${t.period}`}
                  className={`trophycase__item trophycase__item--${t.kind}`}
                >
                  <TrophyCup kind={t.kind} size={t.kind === 'month' ? 44 : 36} />
                  <b>{periodLabel(t)}</b>
                  <small>
                    {t.kind === 'month' ? 'Monthly' : 'Weekly'} · place {t.place}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
