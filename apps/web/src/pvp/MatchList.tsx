// The History page's Arena tab: the matches played on this device, each a replay kept on the server, to watch again or share.

import { useEffect, useState } from 'react';
import { RECENT_REPLAYS } from '@sr/pvp';
import { fetchRecentReplays } from './boardApi';
import { type MatchRecord } from './matchHistory';
import { heroName } from './deckLayout';
import { matchHistory, replayLink } from './matchHistory';
import { ShareLink } from './ShareLink';
import './ranks.css';

export function MatchHistory() {
  const [list, setList] = useState(() => matchHistory().slice(0, RECENT_REPLAYS));
  const [status, setStatus] = useState('Loading your recent games…');
  useEffect(() => {
    let live = true;
    void fetchRecentReplays().then((replays) => {
      if (!live) return;
      if (replays) {
        // The server history is authoritative; local rows remain a fallback for older games.
        if (replays.length)
          setList(
            replays.map((r): MatchRecord => {
              return {
                id: r.id,
                at: r.at,
                names: { a: r.a.name, b: r.b.name },
                heroes: { a: r.a.hero, b: r.b.hero },
                seat: r.viewerSeat,
                winner: r.winner,
                reason: r.reason,
                ghost: !!r.ghost,
                ...(r.game ? { game: r.game } : {}),
              };
            }),
          );
        setStatus(
          'Your latest 10 games stay available. Older shared links may expire after 30 days. Save a match record to keep a copy.',
        );
      } else setStatus('Server history is unavailable. Showing games remembered on this device.');
    });
    return () => {
      live = false;
    };
  }, []);
  if (list.length === 0)
    return (
      <p className="history__empty">
        No Arena matches yet. Your last {RECENT_REPLAYS} games will appear here to watch, share or
        save. {status} <a href="#/replay">Open a saved match record</a>
      </p>
    );
  return (
    <>
      <p className="history__lead">
        {status} Anyone with a replay link can watch the game and see both decks.{' '}
        <a href="#/replay">Open a saved match record</a>
      </p>
      <ol className="matchlist">
        {list.map((m) => {
          const foe = m.seat === 'a' ? 'b' : 'a';
          const won = m.winner === m.seat;
          return (
            <li key={m.id}>
              <span className="matchlist__who">
                <span className={won ? 'matchlist__won' : 'matchlist__lost'}>
                  {m.winner === 'draw' ? 'Draw' : won ? 'Won' : 'Lost'}
                </span>{' '}
                as the {heroName(m.heroes[m.seat])} against <b>{m.names[foe]}</b>
                {m.ghost ? ' (ghost)' : ''} · {heroName(m.heroes[foe])}
                {m.game ? ` · game ${m.game}` : ''}
                <br />
                <small>{new Date(m.at).toLocaleString()}</small>
              </span>
              <a className="btn btn--small" href={`#/replay/${m.id}`}>
                <span>Replay / save</span>
              </a>
              <ShareLink link={replayLink(m.id)} label="Copy link" />
            </li>
          );
        })}
      </ol>
    </>
  );
}
