// Echoes: four stones ring in a pattern that grows each round; ring them back in order. Two wrong notes and the hall closes.

import { useEffect, useRef, useState, useMemo } from 'react';
import { playNote } from '../audio/sfx';
import { ECHO_LIVES, ECHO_PADS, ECHO_ROUNDS, echoLength, echoSong } from './logic';
import { RUNES } from './runes';
import type { GameProps } from './TrialHost';

const STEP = 620;
const GLOW = 380;

export function Echoes({ seed, onEnd }: GameProps) {
  const song = useMemo(() => echoSong(seed), [seed]);
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(ECHO_LIVES);
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [at, setAt] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [note, setNote] = useState('Listen…');
  const done = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number): void => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  // play the song for this round (and again after a wrong note)
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const n = echoLength(round);
    const mine: number[] = [];
    const go = (fn: () => void, ms: number): void => {
      mine.push(window.setTimeout(fn, ms));
    };
    for (let i = 0; i < n; i++) {
      go(
        () => {
          setLit(song[i] as number);
          playNote((song[i] as number) * 2);
        },
        700 + i * STEP,
      );
      go(() => setLit(null), 700 + i * STEP + GLOW);
    }
    go(
      () => {
        setPhase('input');
        setNote('Your turn: ring them back.');
      },
      700 + n * STEP,
    );
    return () => {
      for (const t of mine) window.clearTimeout(t);
    };
  }, [round, replay, song]);

  const ring = (pad: number): void => {
    if (phase !== 'input' || done.current) return;
    setLit(pad);
    playNote(pad * 2);
    later(() => setLit(null), 200);
    if (song[at] === pad) {
      const next = at + 1;
      setAt(next);
      if (next === echoLength(round)) {
        if (round + 1 === ECHO_ROUNDS) {
          done.current = true;
          setNote('The last stone falls silent. The door opens.');
          later(() => onEnd(true), 900);
        } else {
          setPhase('show');
          setNote('Again, and longer…');
          later(() => {
            setAt(0);
            setRound(round + 1);
          }, 900);
        }
      }
    } else if (lives <= 1) {
      done.current = true;
      setLives(0);
      setNote('A wrong note. The hall falls quiet for good.');
      later(() => onEnd(false), 1000);
    } else {
      setLives(lives - 1);
      setPhase('show');
      setNote('A wrong note. The stones sing it again.');
      later(() => {
        setAt(0);
        setReplay((x) => x + 1);
      }, 1000);
    }
  };

  return (
    <div className="tg">
      <div className="tg__status">
        <span>
          Round {Math.min(round + 1, ECHO_ROUNDS)} of {ECHO_ROUNDS}
        </span>
        <span aria-label={`${lives} lives`}>
          {'♥'.repeat(lives)}
          {'♡'.repeat(ECHO_LIVES - lives)}
        </span>
      </div>
      <div className="echoes" role="group" aria-label="The stones">
        {Array.from({ length: ECHO_PADS }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`echoes__pad${lit === i ? ' is-lit' : ''}`}
            style={{ '--rune': RUNES[i]?.color } as React.CSSProperties}
            disabled={phase !== 'input'}
            aria-label={RUNES[i]?.name}
            onClick={() => ring(i)}
          >
            {RUNES[i]?.glyph}
          </button>
        ))}
      </div>
      <p className="tg__note" aria-live="polite">
        {note}
      </p>
    </div>
  );
}
