// Practice for the elite-event reel (the Brass Reel) and the reel spun for a chance (its tiles are the odds), without needing a run. Nothing here is kept
// and nothing here costs anything.

import { useState } from 'react';
import { ChanceReel } from '../run/ChanceReel';
import { Reel } from './Reel';
import { SAMPLE_PRIZES, TRIAL_INFO } from './info';
import './trials.css';

export default function TrialsPractice() {
  const [coin, setCoin] = useState<{ pct: number; won: boolean } | null>(null);
  const [spins, setSpins] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const [from, setFrom] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = (): void => {
    if (spinning) return;
    // (practice draws its own: a real spin is drawn by the rules)
    const pool = SAMPLE_PRIZES.map((_, i) => i).filter((i) => i !== target);
    setFrom(target);
    setTarget(pool[Math.floor(Math.random() * pool.length)] ?? 0);
    setSpins(spins + 1);
    setSpinning(true);
  };

  return (
    <main className="trials">
      <a className="btn btn--small" href="#/fight">
        <span>Back to Sandbox</span>
      </a>
      <h1>Elite Events</h1>
      <p>
        Elite events in a run (about 1 in 10) offer the {TRIAL_INFO.reel.name}:{' '}
        {TRIAL_INFO.reel.blurb} Try it here for free, on a sample reel.
      </p>
      <Reel
        prizes={SAMPLE_PRIZES}
        target={target}
        from={from}
        spinKey={spins}
        spinning={spinning}
        onSettled={() => setSpinning(false)}
      />
      <p aria-live="polite">
        {target === null
          ? 'Spin to try it.'
          : spinning
            ? 'Spinning…'
            : `It stopped on: ${SAMPLE_PRIZES[target]?.short ?? 'a prize'}`}
      </p>
      <ul className="trials__grid">
        <li>
          <button type="button" disabled={spinning} onClick={spin}>
            <b>Spin the reel</b>
            <small>Free here. In a run a spin costs 25 shards.</small>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setCoin({ pct: 60, won: Math.random() < 0.6 })}>
            <b>A chance</b>
            <small>
              The reel spun for any chance in an event: its tiles are the odds (this one is 60%).
            </small>
          </button>
        </li>
      </ul>
      {coin && <ChanceReel flips={[coin]} onDone={() => setCoin(null)} />}
    </main>
  );
}
