// The History page's Arena tab: the matches played on this device, each a replay kept on the server, to watch again or share.

import { useState } from 'react';
import { REPLAY_KEEP_DAYS } from '@sr/pvp';
import { heroName } from './deckLayout';
import { matchHistory, replayLink } from './matchHistory';
import { ShareLink } from './ShareLink';
import './ranks.css';

const DAY = 86_400_000;

export function MatchHistory() {
  const [list] = useState(matchHistory);
  const [now] = useState(() => Date.now());
  if (list.length === 0)
    return (
      <p className="history__empty">
        No Arena matches yet. Each game you play in the Arena is kept here as a replay for{' '}
        {REPLAY_KEEP_DAYS} days, to watch again or send to a friend.
      </p>
    );
  return (
    <>
      <p className="history__lead">
        Each game you have played in the Arena on this device. A replay is kept on the server for{' '}
        {REPLAY_KEEP_DAYS} days after the game; anyone with its link can watch it.
      </p>
      <ol className="matchlist">
        {list.map((m) => {
          const foe = m.seat === 'a' ? 'b' : 'a';
          const won = m.winner === m.seat;
          const gone = now - m.at > REPLAY_KEEP_DAYS * DAY;
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
              {gone ? (
                <small>The replay has expired.</small>
              ) : (
                <>
                  <a className="btn btn--small" href={`#/replay/${m.id}`}>
                    <span>Watch</span>
                  </a>
                  <ShareLink link={replayLink(m.id)} label="Copy link" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
