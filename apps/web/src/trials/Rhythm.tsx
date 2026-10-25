// Rhythm: a needle sweeps a dial; strike (click, tap, or Space) as it crosses the gold. The gold narrows and the needle
// quickens each round. Four of five strikes open the gate.

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { play } from '../audio/sfx';
import { RHYTHM_NEEDED, RHYTHM_ROUNDS, inGold, needleAt, rhythmBeats } from './logic';
import type { GameProps } from './TrialHost';

const LEAD_IN = 900;

export function Rhythm({ seed, onEnd }: GameProps) {
  const beats = useMemo(() => rhythmBeats(seed), [seed]);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const [lamps, setLamps] = useState<('hit' | 'miss' | null)[]>(() =>
    Array.from({ length: RHYTHM_ROUNDS }, () => null),
  );
  const needle = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const settled = useRef(false);
  const timers = useRef<number[]>([]);
  const beat = beats[Math.min(round, RHYTHM_ROUNDS - 1)]!;

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  // settle a round: it was a hit or a miss, then the next begins (or the gate opens or stays shut)
  const settle = useCallback(
    (hit: boolean) => {
      if (settled.current) return;
      settled.current = true;
      play(hit ? 'buff' : 'refuse');
      setFlash(hit ? 'hit' : 'miss');
      const h = hits + (hit ? 1 : 0);
      setHits(h);
      setLamps((l) => l.map((x, i) => (i === round ? (hit ? 'hit' : 'miss') : x)));
      const rest = RHYTHM_ROUNDS - round - 1;
      timers.current.push(
        window.setTimeout(() => {
          if (h >= RHYTHM_NEEDED) onEnd(true);
          else if (h + rest < RHYTHM_NEEDED) onEnd(false);
          else {
            setFlash(null);
            settled.current = false;
            setRound(round + 1);
          }
        }, 800),
      );
    },
    [hits, round, onEnd],
  );

  // the needle: moved directly each frame (no re-render), restarting with each round
  useEffect(() => {
    startedAt.current = performance.now();
    let raf = 0;
    const tick = (): void => {
      const t = Math.max(0, performance.now() - startedAt.current - LEAD_IN) / 1000;
      if (needle.current) needle.current.style.left = `${needleAt(t, beat.period) * 100}%`;
      // a round that is never struck is a miss, after two and a half sweeps
      if (t > beat.period * 2.5) settle(false);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beat, round, settle]);

  const strike = useCallback(() => {
    if (settled.current) return;
    const t = (performance.now() - startedAt.current - LEAD_IN) / 1000;
    if (t < 0) return; // the lead-in: the needle has not begun
    settle(inGold(needleAt(t, beat.period), beat));
  }, [beat, settle]);

  useEffect(() => {
    const on = (e: KeyboardEvent): void => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        strike();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [strike]);

  return (
    <div className="tg">
      <div className="tg__status">
        <span>
          Strike {Math.min(round + 1, RHYTHM_ROUNDS)} of {RHYTHM_ROUNDS}
        </span>
        <span className="rhythm__lamps" aria-label={`${hits} hits, ${RHYTHM_NEEDED} needed`}>
          {lamps.map((l, i) => (
            <i key={i} className={l ? `is-${l}` : ''} />
          ))}
        </span>
      </div>
      <button
        type="button"
        className={`rhythm${flash ? ` is-${flash}` : ''}`}
        onPointerDown={(e) => {
          e.preventDefault();
          strike();
        }}
        aria-label="Strike"
      >
        <span
          className="rhythm__gold"
          style={{ left: `${(beat.at - beat.width / 2) * 100}%`, width: `${beat.width * 100}%` }}
        />
        <span className="rhythm__needle" ref={needle} />
      </button>
      <p className="tg__note">
        {flash === 'hit'
          ? 'On the beat!'
          : flash === 'miss'
            ? 'Off the beat.'
            : `Strike as the needle crosses the gold. ${RHYTHM_NEEDED} of ${RHYTHM_ROUNDS} opens the gate.`}
      </p>
    </div>
  );
}
