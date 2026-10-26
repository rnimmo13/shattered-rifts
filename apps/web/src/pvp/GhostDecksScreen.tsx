// #/ghosts: the decks that are out there to be met as ghosts. You see whose each came from, which Riftwalker, how far it got (Rift Tier
// and stage) and how it has done, but never its cards or Boons: that is for the fight to show.

import { useEffect, useMemo, useState } from 'react';
import { RIFTWALKERS } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { viewGhostDecks, type GhostDeckRow } from './boardApi';
import { heroName, progressLabel } from './deckLayout';
import '../play/play.css';
import './board.css';

type Sort = 'recent' | 'ghost' | 'tier';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'ghost', label: 'Best as a ghost' },
  { id: 'tier', label: 'Furthest' },
];

/** "today", "yesterday", "5 days ago" */
function ago(at: number, now: number): string {
  const days = Math.floor((now - at) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const record = (w: number, l: number): string => (w + l === 0 ? '-' : `${w}–${l}`);

export default function GhostDecksScreen() {
  const [rows, setRows] = useState<GhostDeckRow[] | null | undefined>(undefined);
  const [sort, setSort] = useState<Sort>('recent');
  const [hero, setHero] = useState('all');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    void viewGhostDecks().then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    const list = rows.filter((r) => hero === 'all' || r.hero === hero);
    const stages = (r: GhostDeckRow): number => r.tier * 10 + (r.stage ?? 0);
    return [...list].sort((a, b) =>
      sort === 'recent'
        ? b.lastAt - a.lastAt
        : sort === 'ghost'
          ? b.ghostWins - a.ghostWins || a.ghostLosses - b.ghostLosses || b.lastAt - a.lastAt
          : stages(b) - stages(a) || b.lastAt - a.lastAt,
    );
  }, [rows, sort, hero]);

  return (
    <main className="setup setup--wide board">
      <a className="btn btn--small setup__back" href="#/arena">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Ghost decks</h1>
        <p className="setup__lead">
          A ghost is a deck that has been entered in the Arena, played by the computer so there is
          always someone to fight. Only a deck that has cleared Tier 3 becomes a ghost. Here is who
          they came from and how far they got. You cannot see their cards or Boons: you find out by
          fighting one. Decks that have not played for a month drop off.
        </p>
      </header>
      <div className="board__tabs" role="group" aria-label="Sort">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={sort === s.id}
            className={`btn btn--small${sort === s.id ? ' is-open' : ''}`}
            onClick={() => setSort(s.id)}
          >
            <span>{s.label}</span>
          </button>
        ))}
        <select
          className="btn btn--small"
          aria-label="Riftwalker"
          value={hero}
          onChange={(e) => setHero(e.target.value)}
        >
          <option value="all">Every Riftwalker</option>
          {Object.keys(RIFTWALKERS).map((h) => (
            <option key={h} value={h}>
              {heroName(h)}
            </option>
          ))}
        </select>
      </div>

      {rows === undefined && (
        <p className="board__note" role="status">
          Looking for ghosts…
        </p>
      )}
      {rows === null && (
        <div className="notice notice--bad" role="alert">
          The ghost list could not be reached. Check your connection and try again.
        </div>
      )}
      {rows && (
        <div className="board__wrap">
          <table className="board__table">
            <caption className="sr-only">Ghost decks</caption>
            <thead>
              <tr>
                <th scope="col">Deck of</th>
                <th scope="col">Riftwalker</th>
                <th scope="col">Got to</th>
                <th scope="col" className="is-num">
                  As a ghost
                </th>
                <th scope="col" className="is-num">
                  Played by people
                </th>
                <th scope="col">Last played</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="board__empty">
                    {rows.length === 0
                      ? 'No ghost decks yet. Clear Tier 3, then play a match in the Arena or save the deck, and yours becomes one.'
                      : 'No ghost deck matches that.'}
                  </td>
                </tr>
              )}
              {shown.map((g, i) => (
                <tr key={i}>
                  <td>{g.name}&rsquo;s ghost</td>
                  <td>
                    <span className="board__heroes">
                      <HeroIcon hero={g.hero} size={24} /> <small>{heroName(g.hero)}</small>
                    </span>
                  </td>
                  <td>{progressLabel(g.tier, g.stage ?? undefined)}</td>
                  <td className="is-num" title="Wins and losses against people who fought it">
                    {record(g.ghostWins, g.ghostLosses)}
                  </td>
                  <td className="is-num" title="Wins and losses when its owner played it">
                    {record(g.wins, g.losses)}
                  </td>
                  <td>{ago(g.lastAt, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
