// A chance in an event, played out. The rules have already decided; this shows it. An even chance is a coin: it spins and lands
// on a gold sigil (it went your way) or a dark one. Any other chance is a wheel with exactly that share of it gold (a 25% chance
// is a quarter of the wheel), which turns and stops with the gold or the dark under the pointer: a coin would say 50/50.

import { useEffect, useRef, useState } from 'react';
import '../pvp/pvp.css';
import './chancecoin.css';

export interface Flip {
  pct: number;
  won: boolean;
}

/**
 * Where the wheel stops (degrees turned): a few whole turns, then the middle of the gold share (won) or of the dark share (lost)
 * under the pointer at the top. The gold share starts at the top and runs clockwise.
 */
function wheelStop(f: Flip): number {
  const gold = f.pct * 3.6;
  const at = f.won ? gold / 2 : gold + (360 - gold) / 2;
  return 4 * 360 + (360 - at);
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
        {landed
          ? flip.won
            ? 'It goes your way'
            : 'Not this time'
          : flip.pct === 50
            ? 'The coin is in the air…'
            : 'The wheel is turning…'}
      </h2>
      {flip.pct === 50 ? (
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
      ) : (
        <div className="wheelstage">
          <span className="wheel__pointer" aria-hidden />
          <div
            key={i}
            className={`wheel${landed ? ' is-landed' : ''}${reduced ? ' is-still' : ''}`}
            style={
              {
                '--gold': `${flip.pct * 3.6}deg`,
                '--end': `${wheelStop(flip)}deg`,
              } as React.CSSProperties
            }
            onAnimationEnd={(e) => {
              if (e.animationName === 'wheel-spin') setLanded(true);
            }}
          >
            <span className="wheel__label">{flip.pct}%</span>
          </div>
        </div>
      )}
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
