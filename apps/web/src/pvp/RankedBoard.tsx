// The leaderboards' Ranked tab, and the rank panel on the Arena page (DECISIONS #240): this season's highest ratings, your rank and
// how far it is to the next one.

import { useEffect, useState } from 'react';
import {
  RANKS,
  RANK_FLOORS,
  RANKED_MIN_GAMES,
  RATING_START,
  rankOf,
  seasonAt,
  type RankBadge as Badge,
} from '@sr/pvp';
import { HeroIcon } from '../ui/HeroIcon';
import { heroName } from './deckLayout';
import { viewRanks, type RankedView } from './boardApi';
import { RankBadge, RankGem } from './RankBadge';
import './ranks.css';

/** How long until the season turns over ("12 days left"). */
function seasonLeft(now: number): string {
  const ms = Math.max(0, seasonAt(now).ends - now);
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} left`;
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
}

/** Your rank, the meter to the next division, and what the season is. */
export function RankPanel(props: { rank: Badge | null; place?: number | null }) {
  const [now] = useState(() => Date.now());
  const season = seasonAt(now);
  const rating = props.rank?.rating ?? RATING_START;
  const r = rankOf(rating);
  return (
    <div className="rankpanel" aria-label="Your Arena rank">
      <RankGem tier={r.tier} size={34} />
      <div>
        <RankBadge rank={props.rank ?? { rating, games: 0 }} showRating />
        <br />
        <small>
          {season.name} season · {seasonLeft(now)}
          {props.place ? ` · number ${props.place}` : ''}
        </small>
      </div>
      {r.next !== null && (
        <>
          <span
            className="rankpanel__meter"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(r.progress * 100)}
            aria-label="Progress to the next division"
          >
            <i style={{ width: `${Math.round(r.progress * 100)}%` }} />
          </span>
          <small>{r.next - rating} to the next</small>
        </>
      )}
    </div>
  );
}

export function RankedBoard() {
  const [got, setGot] = useState<RankedView | null | 'loading'>('loading');
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    void viewRanks().then((v) => live && setGot(v));
    return () => {
      live = false;
    };
  }, [tries]);
  const view = got === 'loading' ? null : got;
  return (
    <>
      <p className="board__note">
        Every counted Arena win against a person moves your rating up and every loss moves it down,
        further when the other player is rated higher than you. Ranks:{' '}
        {RANKS.map((name, i) =>
          `${name} ${RANK_FLOORS[i] ? `from ${RANK_FLOORS[i]}` : ''}`.trim(),
        ).join(', ')}
        . Each rank below Diamond has three divisions (III, II, I). Everyone starts at{' '}
        {RATING_START}. When a season (a month) ends, every rating is pulled halfway back to{' '}
        {RATING_START}. Games against ghosts are not ranked. The board lists players with at least{' '}
        {RANKED_MIN_GAMES} ranked games.
      </p>
      {got === 'loading' && (
        <p className="board__note" role="status">
          Loading the board…
        </p>
      )}
      {got === null && (
        <div className="notice notice--bad" role="alert">
          The ranked board could not be reached.{' '}
          <button className="btn btn--small" onClick={() => setTries((n) => n + 1)}>
            <span>Retry</span>
          </button>
        </div>
      )}
      {view && (
        <>
          {view.you && <RankPanel rank={view.you} place={view.you.place} />}
          <div className="board__wrap">
            <table className="board__table">
              <caption className="sr-only">Ranked board this season</caption>
              <thead>
                <tr>
                  <th scope="col" className="board__rank">
                    #
                  </th>
                  <th scope="col">Player</th>
                  <th scope="col">Rank</th>
                  <th scope="col" className="is-num">
                    Rating
                  </th>
                  <th scope="col" className="is-num">
                    Games
                  </th>
                  <th scope="col">Plays</th>
                </tr>
              </thead>
              <tbody>
                {view.board.length === 0 && (
                  <tr>
                    <td colSpan={6} className="board__empty">
                      Nobody has played {RANKED_MIN_GAMES} ranked games yet this season.
                    </td>
                  </tr>
                )}
                {view.board.map((s, i) => (
                  <tr key={`${s.name}-${i}`}>
                    <th scope="row" className="board__rank">
                      {i + 1}
                    </th>
                    <td className="board__name">{s.name}</td>
                    <td>
                      <RankBadge rank={{ rating: s.rating, games: s.games }} />
                    </td>
                    <td className="is-num">
                      <b>{s.rating}</b>
                    </td>
                    <td className="is-num">
                      {s.wins}–{s.games - s.wins}
                    </td>
                    <td>
                      {s.hero && (
                        <span className="board__hero">
                          <HeroIcon hero={s.hero} size={24} />
                          <small>{heroName(s.hero)}</small>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
