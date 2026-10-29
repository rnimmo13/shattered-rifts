// A chance in an event, played out (DECISIONS #407). The rules have already decided; this shows it on the slider reel, whose tiles are
// exactly the odds: a 60% chance is 12 "it goes your way" tiles in every 20, spread along the strip, so what you see is the real
// chance. The reel slows to a stop on a tile of the result. (It replaced a coin, which looked like 50/50 whatever the odds, and a wheel.)

import { useEffect, useMemo, useRef, useState } from 'react';
import { Reel } from '../trials/Reel';
import { oddsCycle } from '../trials/odds';
import type { LanePrize } from '../trials/prizes';
import '../pvp/pvp.css';
import './chancereel.css';

export interface Flip {
  pct: number;
  won: boolean;
}

const TILES: LanePrize[] = [
  { icon: 'win', short: 'Your way', label: 'It goes your way' },
  { icon: 'lose', short: 'Not this time', label: 'Not this time' },
];

export function ChanceReel(props: { flips: Flip[]; onDone: () => void }) {
  const { flips } = props;
  // (the caller passes a new closure each render: keep the latest without restarting the timer)
  const doneRef = useRef(props.onDone);
  useEffect(() => {
    doneRef.current = props.onDone;
  });
  const onDone = (): void => doneRef.current();
  const [i, setI] = useState(0);
  const [landed, setLanded] = useState(false);
  const flip = flips[Math.min(i, flips.length - 1)];
  const cycle = useMemo(() => oddsCycle(flip?.pct ?? 50), [flip?.pct]);

  // once it has stopped, hold the result a moment, then the next chance or the end
  useEffect(() => {
    if (!landed) return;
    const t = window.setTimeout(() => {
      if (i + 1 < flips.length) {
        setI(i + 1);
        setLanded(false);
      } else onDone();
    }, 1500);
    return () => window.clearTimeout(t);
  }, [landed, i, flips.length]);

  if (!flip) return null;
  const wins = cycle.filter((t) => t === 0).length;
  return (
    <div className="coinscreen chancereel" role="dialog" aria-label="A chance">
      <h2>{landed ? (flip.won ? 'It goes your way' : 'Not this time') : 'The reel is turning…'}</h2>
      <Reel
        key={i}
        prizes={TILES}
        target={flip.won ? 0 : 1}
        from={null}
        spinKey={i + 1}
        spinning={!landed}
        cycle={cycle}
        onSettled={() => setLanded(true)}
      />
      <p className="chancereel__pct">
        {`A ${flip.pct}% chance: ${wins} of every ${cycle.length} tiles go your way`}
        {flips.length > 1 ? ` (${Math.min(i + 1, flips.length)} of ${flips.length})` : ''}
      </p>
      <button
        type="button"
        className="btn btn--ghost btn--small chancereel__skip"
        onClick={() => {
          if (i + 1 < flips.length) {
            setI(i + 1);
            setLanded(false);
          } else onDone();
        }}
      >
        <span>Skip</span>
      </button>
    </div>
  );
}
