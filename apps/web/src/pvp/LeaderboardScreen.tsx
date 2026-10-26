// The leaderboards (#/board): the Arena (most wins), the campaign (furthest run) and the ghosts, for this week or this month. Each is a
// table of up to 100 places, and a player who is known also sees where they stand, even when that is below the last place shown.

import { useEffect, useState, type ReactNode } from 'react';
import {
  periodEnd,
  type GhostStanding,
  type Period,
  type PvpStanding,
  type RunStanding,
} from '@sr/pvp';
import { HeroIcon } from '../ui/HeroIcon';
import { TrophyBadges } from './Trophies';
import { heroName, progressLabel } from './deckLayout';
import { viewBoard, type BoardKind, type BoardView, type GhostView } from './boardApi';
import { RankedBoard } from './RankedBoard';
import { NameClaim } from './NameClaim';
import { syncSavedRuns } from '../run/syncRuns';
import '../play/play.css';
import { Notice } from '../ui/Toast';
import './board.css';

/** "3 days left", "5 hours left": how long this period has to run (boards turn over at midnight Pacific time). */
function timeLeft(now: number, period: Period): string {
  const ms = Math.max(0, periodEnd(now, period) - now);
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days left`;
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'} left`;
  return 'under an hour left';
}

const percent = (wins: number, losses: number): string =>
  wins + losses === 0 ? '' : `${Math.round((100 * wins) / (wins + losses))}%`;

/** The characters a player used, each with its own record. */
function Characters(props: { heroes: { hero: string; wins: number; losses: number }[] }) {
  return (
    <span className="board__heroes">
      {props.heroes.map((h) => (
        <span
          key={h.hero}
          className="board__hero"
          title={`${heroName(h.hero)}: ${h.wins} won, ${h.losses} lost`}
        >
          <HeroIcon hero={h.hero} size={24} />
          <small>
            {h.wins}–{h.losses}
          </small>
        </span>
      ))}
    </span>
  );
}

/** A board as a table: the places shown, and (when the player is known and below them) their own place after a gap. */
function Table<T>(props: {
  caption: string;
  head: string[];
  rows: T[];
  you: (T & { rank: number }) | null;
  cells: (row: T) => ReactNode[];
  empty: string;
  /** which columns are numbers (right-aligned) */
  numeric?: number[];
}) {
  const { rows, you } = props;
  const outside = you !== null && you.rank > rows.length;
  const line = (row: T, rank: number, mine: boolean, key: string) => (
    <tr key={key} className={mine ? 'is-you' : undefined} aria-current={mine ? 'true' : undefined}>
      <th scope="row" className="board__rank">
        {rank}
      </th>
      {props.cells(row).map((c, i) => (
        <td key={i} className={props.numeric?.includes(i) ? 'is-num' : undefined}>
          {c}
        </td>
      ))}
    </tr>
  );
  return (
    <div className="board__wrap">
      <table className="board__table">
        <caption className="sr-only">{props.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="board__rank">
              #
            </th>
            {props.head.map((h, i) => (
              <th key={h} scope="col" className={props.numeric?.includes(i) ? 'is-num' : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={props.head.length + 1} className="board__empty">
                {props.empty}
              </td>
            </tr>
          )}
          {rows.map((r, i) => line(r, i + 1, you !== null && you.rank === i + 1, `r${i}`))}
          {outside && you && (
            <>
              <tr className="board__gap" aria-hidden>
                <td colSpan={props.head.length + 1}>…</td>
              </tr>
              {line(you, you.rank, true, 'you')}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** One line saying where the player stands (or that they have not played yet). */
function YourPlace(props: { rank: number | null; played: string }) {
  return (
    <p className="board__yourplace" role="status">
      {props.rank === null ? (
        props.played
      ) : (
        <>
          You are number <b>{props.rank}</b>.
        </>
      )}
    </p>
  );
}

type Seen = BoardView<PvpStanding> | BoardView<RunStanding> | GhostView;

export function LeaderboardScreen() {
  const [tab, setKind] = useState<BoardKind | 'ranks'>('pvp');
  // (the ranked board fetches itself: the others share the week/month machinery below)
  const kind: BoardKind = tab === 'ranks' ? 'pvp' : tab;
  const [period, setPeriod] = useState<Period>('week');
  // what came back, with what it was asked for (an answer for another board counts as still loading)
  const [got, setGot] = useState<{ kind: BoardKind; period: Period; view: Seen | null } | null>(
    null,
  );
  // asking again (the Retry button)
  const [tries, setTry] = useState(0);
  // (read once: how long is left changes by the hour, and a page left open is not worth redrawing for it)
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    // (the runs saved in this browser are announced first, so a run the board has missed shows up)
    void (kind === 'runs' ? syncSavedRuns() : Promise.resolve())
      .then(() => viewBoard(kind, period))
      .then((view) => live && setGot({ kind, period, view }));
    return () => {
      live = false;
    };
  }, [kind, period, tries]);

  const here = got?.kind === kind && got.period === period ? got : null;
  const loading = here === null;
  const failed = here !== null && here.view === null;
  const view = here?.view ?? null;

  const toggle = (label: string, on: boolean, set: () => void) => (
    <button aria-pressed={on} className={`btn btn--small${on ? ' is-open' : ''}`} onClick={set}>
      <span>{label}</span>
    </button>
  );

  return (
    <main className="setup setup--wide board">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Leaderboards</h1>
        <p className="setup__lead">
          Arena boards rank wins; campaign boards rank how far a run got; ghost boards show how the
          computer-played decks are doing. The best 100 are shown. A week runs Monday to Monday and
          a month from the 1st, both from midnight Pacific time. When an Arena board closes, its top
          100 each win a trophy (silver for a week, gold for a month): see your{' '}
          <a href="#/trophies">Trophy case</a>.
        </p>
      </header>

      <div className="board__tabs" role="group" aria-label="Which board">
        {toggle('Arena', tab === 'pvp', () => setKind('pvp'))}
        {toggle('Ranked', tab === 'ranks', () => setKind('ranks'))}
        {toggle('Campaign', tab === 'runs', () => setKind('runs'))}
        {toggle('Ghosts', tab === 'ghosts', () => setKind('ghosts'))}
      </div>
      {tab === 'ranks' ? (
        <RankedBoard />
      ) : (
        <>
          <div className="board__tabs" role="group" aria-label="Which period">
            {toggle('This week', period === 'week', () => setPeriod('week'))}
            {toggle('This month', period === 'month', () => setPeriod('month'))}
          </div>
          <p className="board__left">
            {timeLeft(now, period)}
            <small>
              {period === 'week'
                ? ' · the week turns over on Sunday night at midnight Pacific time'
                : ' · the month turns over at midnight Pacific time on the 1st'}
            </small>
          </p>

          {loading && (
            <p className="board__note" role="status">
              Loading the board…
            </p>
          )}
          {failed && (
            <Notice tone="bad" showAgain={tries}>
              The boards could not be reached. Check your connection and try again.{' '}
              <button className="btn btn--small" onClick={() => setTry((n) => n + 1)}>
                <span>Retry</span>
              </button>
            </Notice>
          )}

          {kind === 'pvp' && view && 'board' in view && (
            <>
              <YourPlace
                rank={view.you?.rank ?? null}
                played={`You have not played a counted Arena match this ${period}.`}
              />
              <Table<PvpStanding>
                caption={`Arena wins this ${period}`}
                head={['Player', 'Wins', 'Losses', 'Win %', 'Characters']}
                numeric={[1, 2, 3]}
                rows={view.board as PvpStanding[]}
                you={view.you as (PvpStanding & { rank: number }) | null}
                empty={`No matches yet this ${period}. Be the first.`}
                cells={(s) => [
                  <span key="n" className="board__name">
                    {s.name} <TrophyBadges trophies={s.trophies} />
                  </span>,
                  <b key="w">{s.wins}</b>,
                  s.losses,
                  percent(s.wins, s.losses),
                  <Characters key="c" heroes={s.heroes} />,
                ]}
              />
            </>
          )}

          {kind === 'runs' && view && 'board' in view && (
            <>
              <YourPlace
                rank={view.you?.rank ?? null}
                played={`You have not made progress on a run begun this ${period}.`}
              />
              <Table<RunStanding>
                caption={`Furthest campaign runs this ${period}`}
                head={['Player', 'Character', 'Where they are', 'Stages cleared']}
                numeric={[3]}
                rows={view.board as RunStanding[]}
                you={view.you as (RunStanding & { rank: number }) | null}
                empty={`No runs yet this ${period}. Be the first.`}
                cells={(s) => [
                  <span key="n" className="board__name">
                    {s.name}
                  </span>,
                  <span key="h" className="board__hero">
                    <HeroIcon hero={s.hero} size={24} />
                    <small>{heroName(s.hero)}</small>
                  </span>,
                  <b key="t">{progressLabel(s.tier, s.stage)}</b>,
                  s.total,
                ]}
              />
            </>
          )}

          {kind === 'ghosts' && view && 'ghosts' in view && (
            <>
              <p className="board__note">
                A ghost is a deck that has played in the Arena, piloted by the computer.{' '}
                {view.decks} {view.decks === 1 ? 'deck is' : 'decks are'} out there to be met. Ghost
                matches do not count on the Arena board.
              </p>
              <p>
                <a href="#/ghosts">See every ghost deck</a> (whose it is, how far it got and how it
                has done).
              </p>
              <h2 className="board__h">Ghosts</h2>
              <Table<GhostStanding>
                caption={`Ghost decks by wins this ${period}`}
                head={['Deck of', 'Character', 'Rift Tier', 'Wins', 'Losses', 'Win %']}
                numeric={[2, 3, 4, 5]}
                rows={view.ghosts}
                you={null}
                empty={`No ghost has been fought yet this ${period}.`}
                cells={(g) => [
                  <span key="n" className="board__name">
                    {g.name}&rsquo;s ghost
                  </span>,
                  <span key="h" className="board__hero">
                    <HeroIcon hero={g.hero} size={24} />
                    <small>{heroName(g.hero)}</small>
                  </span>,
                  g.tier,
                  <b key="w">{g.wins}</b>,
                  g.losses,
                  percent(g.wins, g.losses),
                ]}
              />
              <h2 className="board__h">People against ghosts</h2>
              <YourPlace
                rank={view.you?.rank ?? null}
                played={`You have not fought a ghost this ${period}.`}
              />
              <Table<PvpStanding>
                caption={`Wins against ghosts this ${period}`}
                head={['Player', 'Wins', 'Losses', 'Win %', 'Characters']}
                numeric={[1, 2, 3]}
                rows={view.players}
                you={view.you}
                empty={`Nobody has fought a ghost yet this ${period}.`}
                cells={(s) => [
                  <span key="n" className="board__name">
                    {s.name} <TrophyBadges trophies={s.trophies} />
                  </span>,
                  <b key="w">{s.wins}</b>,
                  s.losses,
                  percent(s.wins, s.losses),
                  <Characters key="c" heroes={s.heroes} />,
                ]}
              />
            </>
          )}
        </>
      )}

      <section className="board__you">
        <NameClaim label="Username" button="Change username" onDone={() => setTry((t) => t + 1)} />
        <p className="board__note">
          It is the same username you use in the Arena and the campaign, and no one else can have
          it. Everything you have already done on the boards moves to the new username.
        </p>
      </section>
    </main>
  );
}
