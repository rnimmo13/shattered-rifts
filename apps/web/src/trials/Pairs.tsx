// Pairs: twelve face-down tiles hide six pairs of runes. Turn two at a time; too many wrong turns and the glass wakes.

import { useEffect, useRef, useState, useMemo } from 'react';
import { play } from '../audio/sfx';
import { PAIR_MISSES, pairBoard } from './logic';
import { RUNES } from './runes';
import type { GameProps } from './TrialHost';

export function Pairs({ seed, onEnd }: GameProps) {
  const board = useMemo(() => pairBoard(seed), [seed]);
  const [up, setUp] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [note, setNote] = useState('Turn two tiles.');
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );
  const later = (fn: () => void, ms: number): void => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const turn = (i: number): void => {
    if (busy.current || up.includes(i) || matched.includes(i)) return;
    play('click');
    const now = [...up, i];
    setUp(now);
    if (now.length < 2) return;
    busy.current = true;
    const [a, b] = now as [number, number];
    if (board[a] === board[b]) {
      const all = [...matched, a, b];
      later(() => {
        setMatched(all);
        setUp([]);
        busy.current = false;
        play('buff');
        if (all.length === board.length) {
          setNote('Every pair found.');
          busy.current = true;
          later(() => onEnd(true), 700);
        } else setNote('A pair!');
      }, 450);
    } else {
      const m = misses + 1;
      setMisses(m);
      later(() => {
        setUp([]);
        if (m >= PAIR_MISSES) {
          busy.current = true;
          setNote('The glass wakes.');
          later(() => onEnd(false), 700);
        } else {
          busy.current = false;
          setNote('Not a pair.');
        }
      }, 900);
    }
  };

  return (
    <div className="tg">
      <div className="tg__status">
        <span>
          Pairs {matched.length / 2} of {board.length / 2}
        </span>
        <span>
          Wrong turns {misses} of {PAIR_MISSES}
        </span>
      </div>
      <div className="pairs" role="group" aria-label="The tiles">
        {board.map((rune, i) => {
          const shown = up.includes(i) || matched.includes(i);
          const r = RUNES[rune];
          return (
            <button
              key={i}
              type="button"
              className={`pairs__tile${shown ? ' is-up' : ''}${matched.includes(i) ? ' is-matched' : ''}`}
              style={{ '--rune': r?.color } as React.CSSProperties}
              aria-label={shown ? r?.name : 'Face-down tile'}
              onClick={() => turn(i)}
            >
              <span className="pairs__face">{shown ? r?.glyph : ''}</span>
            </button>
          );
        })}
      </div>
      <p className="tg__note" aria-live="polite">
        {note}
      </p>
    </div>
  );
}
