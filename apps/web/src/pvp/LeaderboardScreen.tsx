// The leaderboards (#/board): the Arena (most wins), the campaign (furthest run) and the ghosts, for this week or this month. Each is a
// table of up to 100 places, and a player who is known also sees where they stand, even when that is below the last place shown.

import { useEffect, useState, type ReactNode } from 'react';
import {
  periodEnd,
  seasonAt,
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
import { seasonLeft } from './seasonText';
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

const BOARDS: { id: BoardKind; name: string; blurb: string }[] = [
  { id: 'pvp', name: 'Arena', blurb: 'Ranks and wins against other players' },
  { id: 'runs', name: 'Campaign', blurb: 'How far runs have got' },
  { id: 'ghosts', name: 'Ghosts', blurb: 'The computer-played decks' },
];

/** What each board counts, for the "How this board works" fold. */
const HOW: Record<BoardKind | 'ranks', string> = {
  ranks:
    'Every Arena match against another player moves your rating: up for a win, down for a loss, further when the other player is rated higher. Bronze, Silver, Gold and Platinum have three divisions each; Diamond is the top. A season is a month, and a new season pulls every rating halfway back to the start. Matches against ghosts never count. The board lists players with at least 3 Arena matches this season.',
  pvp: 'Arena wins against other players this week or this month. When a week or month closes, its top 100 each win a trophy: silver for a week, gold for a month (see your Trophy case). Weeks start on Monday and months on the 1st, at midnight Pacific time.',
  runs: 'Every run that made progress this week or month, at how far it has got in all, one place per player and Riftwalker. A run counts from its first fight; you need a username to be on it.',
  ghosts:
    'Ghosts are decks that have played in the Arena, piloted by the computer. The first table ranks the ghosts by their wins, the second the people who beat them. Ghost matches never count toward Arena ranks or the Arena board.',
};

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
  // (the Arena opens on its ranks; its week and month boards, which give the trophies, are a click away)
  const [tab, setKind] = useState<BoardKind | 'ranks'>('ranks');
  // (the ranks board fetches itself: the others share the week/month machinery below)
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

  const seg = (label: string, on: boolean, set: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      className={`board__segBtn${on ? ' is-on' : ''}`}
      onClick={set}
    >
      {label}
    </button>
  );

  return (
    <main className="setup setup--wide board">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Leaderboards</h1>
        <p className="setup__lead">The best 100 on each board. Your own place is highlighted.</p>
      </header>

      <nav className="board__boards" aria-label="Which board">
        {BOARDS.map((b) => {
          const on = b.id === 'pvp' ? tab === 'pvp' || tab === 'ranks' : tab === b.id;
          return (
            <button
              key={b.id}
              type="button"
              className={`board__pick${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => setKind(b.id === 'pvp' ? 'ranks' : b.id)}
            >
              <b>{b.name}</b>
              <small>{b.blurb}</small>
            </button>
          );
        })}
      </nav>

      <div className="board__bar">
        <div className="board__seg" role="group" aria-label="Which board">
          {(tab === 'pvp' || tab === 'ranks') &&
            seg('Season ranks', tab === 'ranks', () => setKind('ranks'))}
          {seg(
            tab === 'pvp' || tab === 'ranks' ? 'Wins this week' : 'This week',
            tab !== 'ranks' && period === 'week',
            () => {
              if (tab === 'ranks') setKind('pvp');
              setPeriod('week');
            },
          )}
          {seg(
            tab === 'pvp' || tab === 'ranks' ? 'Wins this month' : 'This month',
            tab !== 'ranks' && period === 'month',
            () => {
              if (tab === 'ranks') setKind('pvp');
              setPeriod('month');
            },
          )}
        </div>
        <span className="board__clock" title="Boards turn over at midnight Pacific time">
          {tab === 'ranks'
            ? `${seasonAt(now).name} season · ${seasonLeft(now)}`
            : `${timeLeft(now, period)} this ${period}`}
        </span>
      </div>

      <details className="board__how">
        <summary>How this board works</summary>
        <p>{HOW[tab]}</p>
      </details>

      {tab === 'ranks' ? (
        <RankedBoard />
      ) : (
        <>
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
                played={`You have not made progress on a run this ${period}.`}
              />
              <Table<RunStanding>
                caption={`Furthest campaign runs this ${period}`}
                head={['Player', 'Character', 'Where they are', 'Run', 'Stages cleared']}
                numeric={[4]}
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
                  // (still going, or how it ended; DECISIONS #292)
                  <span key="s" className={`board__status board__status--${s.status ?? 'live'}`}>
                    {s.status === 'fell' ? 'Fell' : s.status === 'abandoned' ? 'Abandoned' : 'Live'}
                  </span>,
                  s.total,
                ]}
              />
            </>
          )}

          {kind === 'ghosts' && view && 'ghosts' in view && (
            <>
              <p className="board__note">
                {view.decks} {view.decks === 1 ? 'deck is' : 'decks are'} out there to be met.{' '}
                <a href="#/ghosts">See every ghost deck</a>.
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
