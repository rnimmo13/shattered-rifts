// The coin tossed for a chance in an event ("an even chance", "60%"). The rules have already decided; this plays it:
// the coin spins and lands on a gold sigil (it went your way) or a dark one (it did not). It reuses the Arena's coin.

import { useEffect, useRef, useState } from 'react';
import '../pvp/pvp.css';
import './chancecoin.css';

export interface Flip {
  pct: number;
  won: boolean;
}

export function ChanceCoin(props: { flips: Flip[]; onDone: () => void }) {
  const { flips } = props;
  // (the caller passes a new closure each render: keep the latest without restarting the timer)
  const doneRef = useRef(props.onDone);
  useEffect(() => {
    doneRef.current = props.onDone;
  });
  const onDone = (): void => doneRef.current();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [i, setI] = useState(0);
  const [landed, setLanded] = useState(reduced);
  const flip = flips[Math.min(i, flips.length - 1)];

  // once it has landed, hold the result a moment, then the next coin or the end
  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => {
      if (i + 1 < flips.length) {
        setI(i + 1);
        setLanded(reduced);
      } else onDone();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [landed, i, flips.length, reduced]);

  if (!flip) return null;
  const odds = flip.pct === 50 ? 'An even chance' : `A ${flip.pct}% chance`;
  return (
    <div className="coinscreen chancecoin" role="dialog" aria-label="A chance">
      <h2>
        {landed ? (flip.won ? 'It goes your way' : 'Not this time') : 'The coin is in the air…'}
      </h2>
      <div className="coinstage">
        <div
          key={i}
          className={`coin${landed ? ' is-landed' : ''}`}
          style={{ '--end': `${flip.won ? 1800 : 1980}deg` } as React.CSSProperties}
          onAnimationEnd={(e) => {
            if (e.animationName === 'coin-spin') setLanded(true);
          }}
        >
          <div className="coin__face coin__face--front">✦</div>
          <div className="coin__face coin__face--back">✖</div>
        </div>
      </div>
      <p className="chancecoin__pct">
        {odds}
        {flips.length > 1 ? ` (${Math.min(i + 1, flips.length)} of ${flips.length})` : ''}
      </p>
      <button
        type="button"
        className="btn btn--ghost btn--small chancecoin__skip"
        onClick={() => {
          if (i + 1 < flips.length) {
            setI(i + 1);
            setLanded(reduced);
          } else onDone();
        }}
      >
        <span>Skip</span>
      </button>
    </div>
  );
}
