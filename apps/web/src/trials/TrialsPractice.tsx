// Practice for the elite-event game (the Brass Cascade) and the coin tossed for a chance, without needing a run. Nothing
// here is kept.

import { useState } from 'react';
import { cascadeLanes } from '@sr/campaign';
import { ChanceCoin } from '../run/ChanceCoin';
import { SAMPLE_PRIZES, TRIAL_INFO } from './info';
import { TrialHost } from './TrialHost';
import './trials.css';

export default function TrialsPractice() {
  const [round, setRound] = useState<number | null>(null);
  const [coin, setCoin] = useState<{ pct: number; won: boolean } | null>(null);
  const [last, setLast] = useState<string | null>(null);

  if (round !== null)
    return (
      <TrialHost
        key={round}
        prizes={SAMPLE_PRIZES}
        lanes={cascadeLanes(round * 7919 + 13)}
        practice
        onDone={(earned) => {
          setLast(
            `${TRIAL_INFO.cascade.name}: ${earned.length} lane${earned.length === 1 ? '' : 's'} earned`,
          );
          setRound(null);
        }}
        onAgain={() => setRound(round + 1)}
        onCancel={() => setRound(null)}
      />
    );

  return (
    <main className="trials">
      <a className="btn btn--small" href="#/fight">
        <span>Back to Sandbox</span>
      </a>
      <h1>Elite Events</h1>
      <p>
        Elite events in a run (about 1 in 10) offer the Brass Cascade for a choice of better rewards.
        Try it here on a sample board.
      </p>
      {last && <p aria-live="polite">Last: {last}</p>}
      <ul className="trials__grid">
        <li>
          <button type="button" onClick={() => setRound((n) => (n ?? 0) + 1)}>
            <b>{TRIAL_INFO.cascade.name}</b>
            <small>
              {TRIAL_INFO.cascade.blurb} {TRIAL_INFO.cascade.time}.
            </small>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setCoin({ pct: 50, won: Math.random() < 0.5 })}>
            <b>The coin</b>
            <small>The coin tossed for any chance in an event (this one is an even chance).</small>
          </button>
        </li>
      </ul>
      {coin && <ChanceCoin flips={[coin]} onDone={() => setCoin(null)} />}
    </main>
  );
}
