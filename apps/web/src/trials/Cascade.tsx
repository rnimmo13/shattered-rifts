// Brass Cascade: aim and drop a ball on a board of pegs. It bounces down into one of ten lanes, each with a prize hung over
// it. Three balls: every lane a ball lands in is a prize earned (the event then lets you choose one). You can lean on a ball
// as it falls, a few times in all. Aim anywhere on the board with the mouse or finger (or hold the arrow keys: they slide
// the aim smoothly); click, release or Space drops it from that spot; the arrows nudge it on the way down.

import { useCallback, useEffect, useRef, useState } from 'react';
import { play } from '../audio/sfx';
import { rng } from './logic';
import {
  BALLS,
  BALL_R,
  BOARD_H,
  BOARD_W,
  DT,
  LANE_H,
  NUDGES,
  PEGS,
  PEG_R,
  SLOT_COUNT,
  SLOT_W,
  newBall,
  nudge,
  step,
  type Ball,
} from './physics';
import { PRIZE_MARK } from './prizes';
import type { GameProps } from './TrialHost';

/** how fast the arrow keys and buttons move the aim, in board units a second */
const AIM_SPEED = 320;
const AIM_MIN_Y = BALL_R + 4;
const AIM_MAX_Y = BOARD_H - LANE_H - 30;

export function Cascade({ prizes, onEnd }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ballNo, setBallNo] = useState(0);
  const [phase, setPhase] = useState<'aim' | 'fall' | 'between'>('aim');
  const [nudgesLeft, setNudgesLeft] = useState(NUDGES);
  const [earned, setEarned] = useState<number[]>([]);
  const [note, setNote] = useState('Aim, then drop the ball.');

  // the live board lives in refs: it changes sixty times a second and is only drawn, never rendered by React
  const ball = useRef<Ball | null>(null);
  const prev = useRef({ x: 0, y: 0 });
  const trail = useRef<{ x: number; y: number }[]>([]);
  // where the next ball will be dropped from: anywhere on the board, moved freely (never in steps)
  const aim = useRef({ x: BOARD_W / 2, y: BALL_R + 4 });
  const held = useRef({ left: false, right: false, up: false, down: false });
  const phaseRef = useRef(phase);
  const earnedRef = useRef(earned);
  const nudgesRef = useRef(nudgesLeft);
  const timers = useRef<number[]>([]);
  // (the loop below reads these without restarting)
  const ballNoRef = useRef(0);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
    phaseRef.current = phase;
    earnedRef.current = earned;
    nudgesRef.current = nudgesLeft;
  });
  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );

  const drop = useCallback(() => {
    if (phaseRef.current !== 'aim') return;
    const b = newBall(aim.current.x, aim.current.y);
    // a touch of sideways speed from the hand that let go of it: the same drop is never quite the same
    b.vx = (Math.random() - 0.5) * 40;
    ball.current = b;
    prev.current = { x: b.x, y: b.y };
    trail.current = [];
    held.current = { left: false, right: false, up: false, down: false };
    phaseRef.current = 'fall';
    setPhase('fall');
    setNote('Lean on it with the arrows.');
    play('click');
  }, []);

  const lean = useCallback((d: -1 | 1) => {
    const b = ball.current;
    if (phaseRef.current !== 'fall' || !b || b.landed) return;
    if (nudgesRef.current <= 0) {
      setNote('No nudges left.');
      return;
    }
    nudge(b, d);
    nudgesRef.current -= 1;
    setNudgesLeft(nudgesRef.current);
    play('select');
  }, []);

  // the game loop: fixed physics steps, drawn at the screen's pace with the position blended between steps
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    // the little random wobble of each bounce (never the same twice)
    const wobble = rng((Math.random() * 4294967296) >>> 0);
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = BOARD_W * dpr;
    cv.height = BOARD_H * dpr;

    const draw = (alpha: number): void => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, 0, BOARD_H);
      bg.addColorStop(0, '#1a2250');
      bg.addColorStop(1, '#0a0c1c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);
      // the lanes: tinted when a ball has landed in them, with dividers
      const laneTop = BOARD_H - LANE_H;
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (earnedRef.current.includes(i)) {
          ctx.fillStyle = 'rgba(232, 198, 104, 0.28)';
          ctx.fillRect(i * SLOT_W, laneTop, SLOT_W, LANE_H);
        }
      }
      ctx.strokeStyle = 'rgba(232, 198, 104, 0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i <= SLOT_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * SLOT_W, laneTop);
        ctx.lineTo(i * SLOT_W, BOARD_H);
        ctx.stroke();
      }
      // the pegs
      for (const p of PEGS) {
        const g = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, PEG_R + 1);
        g.addColorStop(0, '#fff2c8');
        g.addColorStop(1, '#a8802c');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
        ctx.fill();
      }
      const b = ball.current;
      if (phaseRef.current === 'aim') {
        // where it will be dropped from
        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(aim.current.x, aim.current.y + BALL_R + 4);
        ctx.lineTo(aim.current.x, BOARD_H - LANE_H);
        ctx.stroke();
        ctx.setLineDash([]);
        drawBall(ctx, aim.current.x, aim.current.y, 0.85);
      } else if (b) {
        const x = prev.current.x + (b.x - prev.current.x) * alpha;
        const y = prev.current.y + (b.y - prev.current.y) * alpha;
        // a fading trail
        const t = trail.current;
        for (let i = 0; i < t.length; i++) {
          ctx.fillStyle = `rgba(232, 198, 104, ${(i / t.length) * 0.35})`;
          ctx.beginPath();
          ctx.arc(t[i]!.x, t[i]!.y, BALL_R * (0.4 + (0.5 * i) / t.length), 0, Math.PI * 2);
          ctx.fill();
        }
        if (phaseRef.current === 'fall') drawBall(ctx, x, y, 1);
        else if (!b.landed) drawBall(ctx, x, y, 1);
        else drawBall(ctx, b.x, b.y, 1);
      }
    };

    const frame = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000);
      acc += dt;
      last = now;
      if (phaseRef.current === 'aim') {
        // the keys and buttons slide the aim smoothly while held
        const h = held.current;
        aim.current.x = Math.max(BALL_R, Math.min(BOARD_W - BALL_R, aim.current.x + ((h.right ? 1 : 0) - (h.left ? 1 : 0)) * AIM_SPEED * dt));
        aim.current.y = Math.max(AIM_MIN_Y, Math.min(AIM_MAX_Y, aim.current.y + ((h.down ? 1 : 0) - (h.up ? 1 : 0)) * AIM_SPEED * dt));
      }
      const b = ball.current;
      if (b && phaseRef.current === 'fall') {
        while (acc >= DT && !b.landed) {
          prev.current = { x: b.x, y: b.y };
          step(b, wobble);
          acc -= DT;
        }
        const t = trail.current;
        t.push({ x: b.x, y: b.y });
        if (t.length > 16) t.shift();
        if (b.landed) {
          phaseRef.current = 'between';
          const lane = b.slot ?? 0;
          const all = [...earnedRef.current, lane];
          const uniq = [...new Set(all)];
          earnedRef.current = uniq;
          setEarned(uniq);
          setPhase('between');
          setNote(`Lane ${lane + 1}: ${prizes[lane]?.short ?? 'a prize'}!`);
          play('buff');
          const done = ballNoRef.current + 1 >= BALLS;
          timers.current.push(
            window.setTimeout(
              () => {
                if (done) onEndRef.current(true, uniq);
                else {
                  ballNoRef.current += 1;
                  setBallNo(ballNoRef.current);
                  ball.current = null;
                  trail.current = [];
                  phaseRef.current = 'aim';
                  setPhase('aim');
                  setNote('Aim the next ball.');
                }
              },
              done ? 1600 : 1300,
            ),
          );
        }
      } else acc = 0;
      draw(Math.min(1, acc / DT));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [prizes]);

  useEffect(() => {
    const side = (k: string): 'left' | 'right' | 'up' | 'down' | null =>
      k === 'ArrowLeft' || k === 'a'
        ? 'left'
        : k === 'ArrowRight' || k === 'd'
          ? 'right'
          : k === 'ArrowUp' || k === 'w'
            ? 'up'
            : k === 'ArrowDown' || k === 's'
              ? 'down'
              : null;
    const down = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = side(e.key);
      if (s) {
        e.preventDefault();
        if (phaseRef.current === 'aim') held.current[s] = true;
        else if (!e.repeat && (s === 'left' || s === 'right')) lean(s === 'left' ? -1 : 1);
      } else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault();
        drop();
      }
    };
    const up = (e: KeyboardEvent): void => {
      const s = side(e.key);
      if (s) held.current[s] = false;
    };
    // a key that is let go while the window is not looking would otherwise stay held
    const blur = (): void => {
      held.current = { left: false, right: false, up: false, down: false };
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [lean, drop]);

  const aimFrom = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (phaseRef.current !== 'aim') return;
    const r = e.currentTarget.getBoundingClientRect();
    aim.current = {
      x: Math.max(BALL_R, Math.min(BOARD_W - BALL_R, ((e.clientX - r.left) / r.width) * BOARD_W)),
      y: Math.max(AIM_MIN_Y, Math.min(AIM_MAX_Y, ((e.clientY - r.top) / r.height) * BOARD_H)),
    };
  };

  return (
    <div className="tg cascade">
      <div className="tg__status">
        <span>
          Ball {Math.min(ballNo + 1, BALLS)} of {BALLS}
        </span>
        <span>
          Lanes earned {earned.length}
        </span>
        <span>Nudges {nudgesLeft}</span>
      </div>
      <div className="cascade__board">
        <canvas
          ref={canvas}
          className="cascade__canvas"
          aria-label="The board"
          onPointerMove={aimFrom}
          onPointerDown={aimFrom}
          onPointerUp={(e) => {
            if (e.button !== 0) return;
            aimFrom(e);
            drop();
          }}
        />
        <ol className="cascade__lanes" aria-label="What each lane pays">
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const p = prizes[i];
            const mark = PRIZE_MARK[p?.icon ?? ''] ?? PRIZE_MARK['shards']!;
            return (
              <li
                key={i}
                className={`cascade__lane${earned.includes(i) ? ' is-earned' : ''}`}
                title={p?.label}
                style={{ '--mark': mark.color } as React.CSSProperties}
              >
                <b>{mark.glyph}</b>
                <span>{p?.short}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="cascade__controls">
        <button
          type="button"
          className="btn btn--small"
          onPointerDown={() => {
            if (phaseRef.current === 'aim') held.current.left = true;
            else lean(-1);
          }}
          onPointerUp={() => (held.current.left = false)}
          onPointerLeave={() => (held.current.left = false)}
        >
          <span>{phase === 'aim' ? '◀ Aim' : '◀ Nudge'}</span>
        </button>
        {phase === 'aim' && (
          <button type="button" className="btn btn--small" onClick={drop}>
            <span>Drop!</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn--small"
          onPointerDown={() => {
            if (phaseRef.current === 'aim') held.current.right = true;
            else lean(1);
          }}
          onPointerUp={() => (held.current.right = false)}
          onPointerLeave={() => (held.current.right = false)}
        >
          <span>{phase === 'aim' ? 'Aim ▶' : 'Nudge ▶'}</span>
        </button>
      </div>
      <p className="tg__note" aria-live="polite">
        {note}
      </p>
    </div>
  );
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, a: number): void {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.shadowColor = 'rgba(232, 198, 104, 0.9)';
  ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, BALL_R);
  g.addColorStop(0, '#fff7d6');
  g.addColorStop(0.6, '#e8c668');
  g.addColorStop(1, '#8a6a24');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
