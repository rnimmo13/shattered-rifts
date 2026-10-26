// The Brass Reel: a strip of every prize, scrolling past a pointer and slowing to a stop on the one the rules drew (like opening a case).
// It only animates: which prize it stops on is decided by the rules before the reel moves (spinReel in the campaign package).

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { play } from '../audio/sfx';
import { PRIZE_MARK, type LanePrize } from './prizes';
// the reel's own styles (and the prize list under it) come with it: they used to be loaded only by the lazy practice page, so in a
// run the reel showed as a long line of unstyled text until that page had been opened once
import './trials.css';
import { WithArrows } from '../ui/Arrow';

const TILE_W = 132;
const TILE_GAP = 8;
const STEP = TILE_W + TILE_GAP;
/** tiles in a strip, the place the reel starts from and the place it stops at */
const LENGTH = 64;
const START = 4;
const STOP = 52;
/** how long the spin takes (ms) */
const SPIN_MS = 5200;
/** the spin with Reduce motion on: short and gentle, but still a spin */
const REDUCED_SPIN_MS = 1400;

/** a small seeded generator for the look of a strip (nothing here decides a prize) */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The tiles of one spin: prizes in a shuffled-looking run, the one it started on near the start and the one it stops on at STOP. */
function buildStrip(count: number, from: number | null, to: number, spinKey: number): number[] {
  const r = mulberry(spinKey * 7919 + 17);
  const out: number[] = [];
  for (let i = 0; i < LENGTH; i++) {
    let k = Math.floor(r() * count);
    // (never the same prize twice side by side, so the strip reads as a run of different things)
    while (count > 1 && k === out[i - 1]) k = (k + 1) % count;
    out.push(k);
  }
  if (from !== null) out[START] = from;
  out[STOP] = to;
  // the neighbours of the stopping place are never the same prize either
  for (const i of [STOP - 1, STOP + 1]) if (out[i] === to) out[i] = (to + 1) % count;
  return out;
}

export function Reel(props: {
  prizes: LanePrize[];
  /** the prize on the table (the one the reel stopped on, or is about to), or null before the first spin */
  target: number | null;
  /** the prize that was on the table before this spin */
  from: number | null;
  /** changes with every spin, and shapes the strip */
  spinKey: number;
  /** the reel is turning now (and will stop on `target`) */
  spinning: boolean;
  onSettled: () => void;
}) {
  const { prizes, target, from, spinKey, spinning } = props;
  const box = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const done = useRef(props.onSettled);
  useEffect(() => {
    done.current = props.onSettled;
  });

  // (the same strip before, during and after a spin, so nothing jumps when it stops)
  const tiles = useMemo(
    () =>
      target === null
        ? buildStrip(prizes.length, null, 0, 0)
        : buildStrip(prizes.length, from, target, spinKey),
    [prizes.length, target, from, spinKey],
  );

  // where the strip rests so that tile `i` is under the pointer
  const restAt = (i: number, jitter = 0): number => {
    const w = box.current?.clientWidth ?? 600;
    return -(i * STEP + TILE_W / 2 - w / 2) + jitter;
  };

  // resting: the strip stands with the prize on the table (or the start of the strip) under the pointer
  useLayoutEffect(() => {
    const s = strip.current;
    if (!s || spinning) return;
    // (a strip that has just finished this spin stays where it stopped: the pointer is somewhere on the tile, and it must not jump)
    if (s.dataset['spun'] === String(spinKey)) return;
    s.style.transition = 'none';
    s.style.transform = `translateX(${restAt(target === null ? START : STOP)}px)`;
  });

  // spinning: from the previous prize to the new one, slowing like a case being opened
  // (started before the browser paints, so the new winner is never seen under the pointer for a frame)
  useLayoutEffect(() => {
    const s = strip.current;
    if (!s || !spinning || target === null) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let finished = false;
    let settle = 0;
    const finish = (): void => {
      if (finished) return;
      finished = true;
      play('buff');
      done.current();
    };
    s.dataset['spun'] = String(spinKey);
    s.style.transition = 'none';
    s.style.transform = `translateX(${restAt(START)}px)`;
    // (the pointer stops somewhere on the tile, never always dead centre)
    const jitter = (mulberry(spinKey * 31 + 5)() - 0.5) * TILE_W * 0.6;
    void s.offsetWidth; // let the start position take before the move
    play('click');
    // (with Reduce motion on, as it often is on a Mac, the reel still turns, briefly and gently, instead of jumping straight to the
    // prize: the spin is the whole point of it. DECISIONS #284)
    const ms = reduced ? REDUCED_SPIN_MS : SPIN_MS;
    const ease = reduced ? 'cubic-bezier(0.25, 0.6, 0.3, 1)' : 'cubic-bezier(0.08, 0.72, 0.12, 1)';
    // (the move starts on the next frames, not in the same breath as the jump to the start: Safari can drop a transition started
    // straight after a style change in the same frame)
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        s.style.transition = `transform ${ms}ms ${ease}`;
        s.style.transform = `translateX(${restAt(STOP, jitter)}px)`;
      });
    });
    const onEnd = (e: TransitionEvent): void => {
      if (e.target === s && e.propertyName === 'transform') settle = window.setTimeout(finish, 500);
    };
    s.addEventListener('transitionend', onEnd);
    // (if the browser never says the move ended, the prize is shown anyway)
    const fallback = window.setTimeout(finish, ms + 1500);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      s.removeEventListener('transitionend', onEnd);
      window.clearTimeout(fallback);
      window.clearTimeout(settle);
    };
    // the spin is started once per spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, spinKey]);

  return (
    <div
      className={`reel${spinning ? ' is-spinning' : ''}`}
      ref={box}
      role="img"
      aria-label={
        spinning
          ? 'The reel is spinning'
          : target === null
            ? 'The prize reel'
            : `The reel stopped on ${prizes[target]?.short ?? 'a prize'}`
      }
    >
      <div className="reel__strip" ref={strip}>
        {tiles.map((k, i) => {
          const p = prizes[k];
          const mark = PRIZE_MARK[p?.icon ?? ''] ?? PRIZE_MARK['shards']!;
          return (
            <div
              key={i}
              aria-hidden
              className={`reel__tile${!spinning && target !== null && i === STOP ? ' is-win' : ''}`}
              style={{ '--mark': mark.color, width: TILE_W } as React.CSSProperties}
            >
              <b>
                <WithArrows text={mark.glyph} />
              </b>
              <span>{p?.short ?? ''}</span>
            </div>
          );
        })}
      </div>
      <i className="reel__pointer" aria-hidden />
    </div>
  );
}
