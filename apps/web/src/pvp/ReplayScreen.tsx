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
import {
  downloadReplayArchive,
  readReplayArchive,
  type ArchivedDefinitions,
} from './replayArchive';

const ReplayPlayer = lazy(() => import('../fight/ReplayPlayer'));

const progressOf = (e: StoredReplay['a']): { tier: number; stage?: number } =>
  e.stage === undefined ? { tier: e.tier } : { tier: e.tier, stage: e.stage };

export default function ReplayScreen(props: { id?: string }) {
  const [got, setGot] = useState<StoredReplay | 'gone' | null | 'loading'>(
    props.id ? 'loading' : null,
  );
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [definitions, setDefinitions] = useState<ArchivedDefinitions>();
  useEffect(() => {
    let alive = true;
    if (!props.id) return;
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
  const tools = stored && (
    <section className="watchpage" aria-label="Match record">
      <p>
        Copy the replay link to send this game to Robert or a friend through Discord or chat. The
        game is stored online, including both decks and captured turn evidence. You can also save a
        file as an optional backup. Display names are included.
      </p>
      <label>
        Your plan or feedback (optional; included in saved files)
        <textarea
          value={note}
          maxLength={4000}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', minHeight: 70 }}
        />
      </label>
      <ShareLink link={replayLink(stored.id)} label="Copy replay link" />
      <button
        className="btn btn--small"
        onClick={() => downloadReplayArchive(stored, note, definitions)}
      >
        <span>Save match record</span>
      </button>
      <p>
        {stored.evidence
          ? `${stored.evidence.frames.length} captured positions across ${stored.evidence.totalActions} accepted moves.${stored.evidence.truncated ? ' Capture limit reached: later positions are missing; the move log is still included.' : ''}`
          : 'This older replay has no recorded position evidence. Its decks and move log are still included.'}
      </p>
      {stored.evidence && (
        <details>
          <summary>Turn-by-turn evidence</summary>
          <p>
            Accepted moves include events and resources. Opening, turn-boundary and lethal positions
            also include hands and boards. These observations remain readable after rules updates.
          </p>
          {stored.evidence.frames.map((f) => (
            <details key={f.seq}>
              <summary>
                Move {f.seq} · turn index {f.turn} · {f.seat ?? f.active} ·{' '}
                {f.card ?? f.action?.type ?? 'opening'}
              </summary>
              <pre style={{ overflow: 'auto', maxHeight: 360 }}>{JSON.stringify(f, null, 2)}</pre>
            </details>
          ))}
        </details>
      )}
    </section>
  );

  if (!props.id && !stored)
    return (
      <main className="watchpage">
        <h1>Open a saved match record</h1>
        <p>Choose a match JSON file. The file stays on this device.</p>
        <input
          type="file"
          accept=".json,application/json"
          aria-label="Match record file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 8_000_000) {
              setError('This file is too large.');
              return;
            }
            void file
              .text()
              .then((text) => {
                const parsed = readReplayArchive(JSON.parse(text) as unknown);
                if (!parsed) throw Error('Invalid match record');
                setGot(parsed.replay);
                setDefinitions({ content: parsed.content, contentRules: parsed.contentRules });
                setNote(parsed.note);
                setError('');
              })
              .catch(() =>
                setError(
                  'This match record could not be opened. Keep the original file for review.',
                ),
              );
          }}
        />
        {error && <p role="alert">{error}</p>}
        <p>
          <a href="#/history">Back to History</a>
        </p>
      </main>
    );

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
            ? `This replay is not available. Games outside a player's latest 10 may expire after ${REPLAY_KEEP_DAYS} days.`
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
        {tools}
        <a className="btn" href="#/">
          <span>Home</span>
        </a>
      </main>
    );
  if (!playing)
    return (
      <main className="watchpage">
        <h1>
          {stored.a.name} vs {stored.b.name}
        </h1>
        <p>
          {new Date(stored.at).toLocaleString()} · {stored.reason} · rules {stored.rules}
        </p>
        <button className="btn" onClick={() => setPlaying(true)}>
          <span>Watch replay</span>
        </button>
        <a className="btn btn--small" href="#/history">
          <span>History</span>
        </a>
        {tools}
      </main>
    );
  return (
    <Suspense fallback={<div className="loading">Opening the replay…</div>}>
      <ReplayPlayer
        replay={replay}
        // (a win plays out on its own; a resignation or a missed clock is said at the end)
        end={stored.reason === 'win' ? null : { winner: stored.winner, reason: stored.reason }}
        closeLabel="Match record"
        onClose={() => setPlaying(false)}
        topExtra={
          <>
            <ShareLink link={replayLink(stored.id)} label="Share" />
            <button
              className="btn btn--small"
              onClick={() => downloadReplayArchive(stored, note, definitions)}
            >
              <span>Save match record</span>
            </button>
          </>
        }
      />
    </Suspense>
  );
}
