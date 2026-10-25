// Practice for the elite-event trials (and the coin tossed for a chance): play any of the mini-games on a fresh puzzle,
// or toss the coin, without needing a run. Nothing here is kept.

import { useState } from 'react';
import type { TrialGame } from '@sr/campaign';
import { ChanceCoin } from '../run/ChanceCoin';
import { TRIAL_INFO } from './info';
import { TrialHost } from './TrialHost';
import './trials.css';

const GAMES = Object.keys(TRIAL_INFO) as TrialGame[];
const freshSeed = (): number => Math.floor(Math.random() * 1_000_000_000);

export default function TrialsPractice() {
  const [play, setPlay] = useState<{ game: TrialGame; seed: number } | null>(null);
  const [coin, setCoin] = useState<{ pct: number; won: boolean } | null>(null);
  const [last, setLast] = useState<string | null>(null);

  if (play)
    return (
      <TrialHost
        key={play.seed}
        game={play.game}
        seed={play.seed}
        practice
        onDone={(won) => {
          setLast(`${TRIAL_INFO[play.game].name}: ${won ? 'passed' : 'failed'}`);
          setPlay(null);
        }}
        onAgain={() => setPlay({ game: play.game, seed: freshSeed() })}
        onCancel={() => setPlay(null)}
      />
    );

  return (
    <main className="trials">
      <a className="btn btn--small" href="#/fight">
        <span>Back to Practice</span>
      </a>
      <h1>Trials</h1>
      <p>
        Elite events in a run (about 1 in 10) offer a short puzzle for a choice of better rewards.
        Try them here on a fresh puzzle each time.
      </p>
      {last && <p aria-live="polite">Last: {last}</p>}
      <ul className="trials__grid">
        {GAMES.map((g) => (
          <li key={g}>
            <button type="button" onClick={() => setPlay({ game: g, seed: freshSeed() })}>
              <b>{TRIAL_INFO[g].name}</b>
              <small>
                {TRIAL_INFO[g].blurb} {TRIAL_INFO[g].time}.
              </small>
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setCoin({ pct: 50, won: Math.random() < 0.5 })}
          >
            <b>The coin</b>
            <small>The coin tossed for any chance in an event (this one is an even chance).</small>
          </button>
        </li>
      </ul>
      {coin && <ChanceCoin flips={[coin]} onDone={() => setCoin(null)} />}
    </main>
  );
}
