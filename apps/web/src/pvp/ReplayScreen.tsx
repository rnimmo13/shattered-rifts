// #/replay/ID: a finished Arena game, watched again from a link (DECISIONS #239). The server keeps the seed, the two decks and the
// moves; the game is played again here from them, seen from the first seat, with both hands showing (it is over: nothing to hide).

import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { RULES_VERSION, REPLAY_KEEP_DAYS, setupFor, type StoredReplay } from '@sr/pvp';
import { fetchReplay } from './boardApi';
import { arenaFor } from './arenaVenue';
import { replayLink } from './matchHistory';
import { ShareLink } from './ShareLink';
import type { FightReplay } from '../fight/recap';
import './ranks.css';

const ReplayPlayer = lazy(() => import('../fight/ReplayPlayer'));

const progressOf = (e: StoredReplay['a']): { tier: number; stage?: number } =>
  e.stage === undefined ? { tier: e.tier } : { tier: e.tier, stage: e.stage };

export default function ReplayScreen(props: { id: string }) {
  const [got, setGot] = useState<StoredReplay | 'gone' | null | 'loading'>('loading');
  useEffect(() => {
    let alive = true;
    void fetchReplay(props.id).then((r) => {
      if (alive) setGot(r);
    });
    return () => {
      alive = false;
    };
  }, [props.id]);

  const stored = typeof got === 'object' && got !== null ? got : null;
  const replay = useMemo((): FightReplay | null => {
    if (!stored) return null;
    return {
      setup: setupFor(stored.seed, stored.a, stored.b),
      moves: stored.log,
      title: `${stored.a.name} vs ${stored.b.name}${stored.game ? ` · game ${stored.game}` : ''}`,
      me: 'a',
      names: { a: stored.a.name, b: stored.b.name },
      progress: { a: progressOf(stored.a), b: progressOf(stored.b) },
      venue: arenaFor(stored.seed),
    };
  }, [stored]);
  const leave = (): void => {
    window.location.hash = '#/';
  };

  if (got === 'loading')
    return (
      <main className="watchpage">
        <p>Fetching the replay…</p>
      </main>
    );
  if (!stored || !replay)
    return (
      <main className="watchpage">
        <h1>Replay</h1>
        <p>
          {got === 'gone'
            ? `This replay is not there any more. Arena games are kept for ${REPLAY_KEEP_DAYS} days.`
            : 'The server could not be reached. Try again in a moment.'}
        </p>
        <a className="btn" href="#/">
          <span>Home</span>
        </a>
      </main>
    );
  if (stored.rules !== RULES_VERSION)
    return (
      <main className="watchpage">
        <h1>Replay</h1>
        <p>
          This game was played on an earlier version of the game, and the cards have changed since:
          it would not play out the same way, so it cannot be shown.
        </p>
        <a className="btn" href="#/">
          <span>Home</span>
        </a>
      </main>
    );
  return (
    <Suspense fallback={<div className="loading">Opening the replay…</div>}>
      <ReplayPlayer
        replay={replay}
        // (a win plays out on its own; a resignation or a missed clock is said at the end)
        end={stored.reason === 'win' ? null : { winner: stored.winner, reason: stored.reason }}
        closeLabel="Leave"
        onClose={leave}
        topExtra={<ShareLink link={replayLink(stored.id)} label="Share" />}
      />
    </Suspense>
  );
}
