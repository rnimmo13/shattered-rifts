// #/watch/ROOM: someone else's Arena match, watched as it is played (DECISIONS #239). The room sends a watcher what it sends the
// players (the start, every accepted move, the end), seen from the first seat; the hand and Traps of that seat stay hidden, so a
// watcher has nothing to pass on to the other player. Each game of a best of three follows on by itself.

import { useEffect, useMemo, useRef, useState } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import type { CombatSetup, Side } from '@sr/combat';
import {
  RULES_VERSION,
  cleanRank,
  cleanTrophies,
  setupFor,
  type Entry,
  type RankBadge,
  type Series,
  type ServerMsg,
  type TrophyCount,
} from '@sr/pvp';
import { FightView, type WatchMode } from '../fight/FightView';
import { MoveFeed, type PvpLink } from './link';
import { serverBase } from './config';
import { arenaFor } from './arenaVenue';
import { replayLink } from './matchHistory';
import { ShareLink } from './ShareLink';
import './ranks.css';

interface Game {
  seed: string;
  setup: CombatSetup;
  names: Record<Side, string>;
  progress: Record<Side, { tier: number; stage?: number }>;
  trophies: Record<Side, TrophyCount | undefined>;
  ranks: Record<Side, RankBadge | undefined>;
  feed: MoveFeed;
  /** moves that arrive as history (the game was under way when the page opened) */
  replay: number;
  series: Series | null;
  end: { winner: Side | 'draw'; reason: string } | null;
  replayId: string | null;
}

type View =
  | { phase: 'connecting' | 'waiting' }
  | { phase: 'error'; message: string }
  | { phase: 'game'; game: Game };

const progressOf = (e: Entry): { tier: number; stage?: number } =>
  e.stage === undefined ? { tier: e.tier } : { tier: e.tier, stage: e.stage };

export default function WatchScreen(props: { room: string }) {
  const room = props.room.toUpperCase();
  const [view, setView] = useState<View>({ phase: 'connecting' });
  const lastSeq = useRef(0);
  /** the game whose result was closed while the next is still to come */
  const [waitNext, setWaitNext] = useState<string | null>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let alive = true;
    let tries = 0;
    let retry: number | undefined;
    let ping: number | undefined;
    const handle = (m: ServerMsg): void => {
      switch (m.type) {
        case 'waiting':
          if (!gameRef.current) setView({ phase: 'waiting' });
          return;
        case 'start': {
          if (gameRef.current?.seed === m.seed) return; // (a reconnection: the same game)
          lastSeq.current = 0;
          const game: Game = {
            seed: m.seed,
            setup: setupFor(m.seed, m.a, m.b),
            names: { a: m.a.name, b: m.b.name },
            progress: { a: progressOf(m.a), b: progressOf(m.b) },
            trophies: { a: cleanTrophies(m.a.trophies), b: cleanTrophies(m.b.trophies) },
            ranks: { a: cleanRank(m.a.rank), b: cleanRank(m.b.rank) },
            feed: new MoveFeed(),
            replay: m.replay,
            series: m.series ?? null,
            end: null,
            replayId: null,
          };
          gameRef.current = game;
          setView({ phase: 'game', game });
          return;
        }
        case 'action': {
          const g = gameRef.current;
          if (!g || m.seq <= lastSeq.current) return;
          lastSeq.current = m.seq;
          g.feed.push({
            kind: 'move',
            move: { seq: m.seq, seat: m.seat, action: m.action, hash: m.hash, deadline: 0 },
            history: m.seq <= g.replay,
          });
          return;
        }
        case 'end': {
          const g = gameRef.current;
          if (!g) return;
          const next: Game = {
            ...g,
            end: { winner: m.winner, reason: m.reason },
            series: m.series ?? g.series,
          };
          gameRef.current = next;
          setView({ phase: 'game', game: next });
          return;
        }
        case 'replay': {
          const g = gameRef.current;
          if (!g?.end) return;
          const next: Game = { ...g, replayId: m.id };
          gameRef.current = next;
          setView({ phase: 'game', game: next });
          return;
        }
        case 'error':
          setView({ phase: 'error', message: m.message });
          alive = false;
          return;
        default:
          return;
      }
    };
    const open = (): void => {
      try {
        ws = new WebSocket(`${serverBase()}/pvp/room/${room}`);
      } catch {
        setView({ phase: 'error', message: 'The server could not be reached.' });
        return;
      }
      const sock = ws;
      sock.addEventListener('open', () => {
        tries = 0;
        sock.send(JSON.stringify({ type: 'watch', rules: RULES_VERSION }));
        window.clearInterval(ping);
        ping = window.setInterval(() => {
          if (sock.readyState === WebSocket.OPEN) sock.send('ping');
        }, 15_000);
      });
      sock.addEventListener('message', (e) => {
        if (e.data === 'pong') return;
        try {
          handle(JSON.parse(String(e.data)) as ServerMsg);
        } catch {
          /* not a message we know */
        }
      });
      sock.addEventListener('close', () => {
        window.clearInterval(ping);
        const g = gameRef.current;
        // (the room closes a while after the match is decided: nothing more to watch)
        if (!alive || (g?.end && (!g.series || g.series.over))) return;
        if (tries++ < 10) retry = window.setTimeout(open, Math.min(4000, 500 * tries));
        else setView({ phase: 'error', message: 'The connection to the match was lost.' });
      });
    };
    open();
    return () => {
      alive = false;
      window.clearTimeout(retry);
      window.clearInterval(ping);
      ws?.close();
    };
  }, [room]);

  const game = view.phase === 'game' ? view.game : null;
  const link = useMemo((): PvpLink | null => {
    if (!game) return null;
    return {
      seat: 'a',
      names: game.names,
      progress: game.progress,
      trophies: game.trophies,
      ranks: game.ranks,
      feed: game.feed,
      send: () => false,
      replay: game.replay,
      deadline: null,
      skew: 0,
      end: game.end,
      series: game.series,
    };
  }, [game]);
  // (one watching mode per game: its feed is the game's)
  const watch = useMemo(
    (): WatchMode | null =>
      game ? { feed: game.feed, total: null, end: game.end, hideHand: true } : null,
    [game],
  );
  const leave = (): void => {
    window.location.hash = '#/';
  };

  if (view.phase !== 'game' || !game || !link || !watch)
    return (
      <main className="watchpage">
        <h1>Watching room {room}</h1>
        <p>
          {view.phase === 'error'
            ? view.message
            : view.phase === 'waiting'
              ? 'The match here has not begun yet. It appears on this page as soon as it does.'
              : 'Finding the match…'}
        </p>
        <a className="btn" href="#/">
          <span>Home</span>
        </a>
      </main>
    );
  const between = game.end !== null && game.series !== null && !game.series.over;
  if (waitNext === game.seed)
    return (
      <main className="watchpage">
        <h1>Watching room {room}</h1>
        <p>
          Game {game.series?.game ?? 1} is over ({game.names.a} {game.series?.wins.a ?? 0},{' '}
          {game.names.b} {game.series?.wins.b ?? 0}). The next game appears here as soon as it
          begins.
        </p>
        <a className="btn" href="#/">
          <span>Leave</span>
        </a>
      </main>
    );
  return (
    <FightView
      key={game.seed}
      db={COMBAT_DB}
      setup={game.setup}
      title={`${game.names.a} vs ${game.names.b}${game.series ? ` · Game ${game.series.game} of 3` : ''}`}
      venue={arenaFor(game.seed)}
      pvp={link}
      watch={watch}
      exitLabel="Leave"
      doneLabel={between ? 'Wait for the next game' : 'Leave'}
      onExit={leave}
      onDone={() => {
        // between games, wait for the next one (its start replaces this screen when it comes)
        if (between) setWaitNext(game.seed);
        else leave();
      }}
      resultExtra={() =>
        game.replayId ? (
          <ShareLink link={replayLink(game.replayId)} label="Share the replay" />
        ) : null
      }
    />
  );
}
