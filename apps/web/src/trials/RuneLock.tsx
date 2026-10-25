// Rune lock: touch a rune and it and the runes beside it flip. Darken every rune before the presses run out.

import { useEffect, useRef, useState, useMemo } from 'react';
import { play } from '../audio/sfx';
import { LOCK_PRESSES, LOCK_SIZE, lockBoard, lockSolved, press } from './logic';
import type { GameProps } from './TrialHost';

export function RuneLock({ seed, onEnd }: GameProps) {
  const first = useMemo(() => lockBoard(seed).board, [seed]);
  const [board, setBoard] = useState<boolean[]>(first);
  const [left, setLeft] = useState(LOCK_PRESSES);
  const [over, setOver] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const touch = (i: number): void => {
    if (over) return;
    const next = press(board, i);
    const l = left - 1;
    setBoard(next);
    setLeft(l);
    play('click');
    if (lockSolved(next)) {
      setOver(true);
      play('win');
      timer.current = window.setTimeout(() => onEnd(true), 800);
    } else if (l <= 0) {
      setOver(true);
      timer.current = window.setTimeout(() => onEnd(false), 800);
    }
  };

  return (
    <div className="tg">
      <div className="tg__status">
        <span>Presses left {left}</span>
        <span>Lit runes {board.filter(Boolean).length}</span>
      </div>
      <div
        className="lock"
        style={{ '--n': LOCK_SIZE } as React.CSSProperties}
        role="group"
        aria-label="The lock"
      >
        {board.map((on, i) => (
          <button
            key={i}
            type="button"
            className={`lock__rune${on ? ' is-on' : ''}`}
            aria-label={`Rune ${i + 1}, ${on ? 'lit' : 'dark'}`}
            aria-pressed={on}
            onClick={() => touch(i)}
          >
            ✦
          </button>
        ))}
      </div>
      <p className="tg__note">Touch a rune: it and the ones beside it (not the diagonals) flip.</p>
    </div>
  );
}
