import { describe, expect, it } from 'vitest';
import { rng } from './logic';
import {
  BALL_R,
  BOARD_H,
  BOARD_W,
  DT,
  PEGS,
  PEG_R,
  SLOT_COUNT,
  SLOT_W,
  newBall,
  nudge,
  simulateDrop,
  step,
} from './physics';

describe('the cascade board', () => {
  it('the same seed is the same stream of numbers', () => {
    expect(rng(7)()).toBe(rng(7)());
    expect(rng(7)()).not.toBe(rng(8)());
  });

  it('has room for a ball between every pair of pegs, and none outside the board', () => {
    for (const a of PEGS) {
      expect(a.x).toBeGreaterThanOrEqual(0);
      expect(a.x).toBeLessThanOrEqual(BOARD_W);
      expect(a.y).toBeLessThan(BOARD_H);
      for (const b of PEGS) {
        if (a === b) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d).toBeGreaterThan(2 * PEG_R + 2 * BALL_R + 4);
      }
    }
    expect(SLOT_W * SLOT_COUNT).toBe(BOARD_W);
  });

  it('every ball lands in a slot, stays on the board, and never goes wild, wherever it is dropped', () => {
    const r = rng(11);
    for (let i = 0; i < 200; i++) {
      const b = newBall(BALL_R + r() * (BOARD_W - 2 * BALL_R));
      let steps = 0;
      while (!b.landed && steps < 240 * 40) {
        step(b, r);
        steps++;
        expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true);
        expect(b.x).toBeGreaterThanOrEqual(BALL_R - 0.001);
        expect(b.x).toBeLessThanOrEqual(BOARD_W - BALL_R + 0.001);
        expect(b.y).toBeLessThanOrEqual(BOARD_H);
        expect(Math.abs(b.vx)).toBeLessThan(1200);
      }
      expect(b.landed).toBe(true);
      expect(b.slot).toBeGreaterThanOrEqual(0);
      expect(b.slot).toBeLessThan(SLOT_COUNT);
      // a ball takes a while to fall: not instant, not forever
      expect(steps * DT).toBeGreaterThan(1.5);
      expect(steps * DT).toBeLessThan(20);
    }
  }, 60_000);

  it('is not predictable: the same drop does not always land in the same lane', () => {
    const r = rng(3);
    const lanes = new Set<number>();
    for (let i = 0; i < 60; i++) lanes.add(simulateDrop(BOARD_W / 2, r));
    expect(lanes.size).toBeGreaterThanOrEqual(4);
  });

  it('where you drop it matters, and every lane, the edges included, can come up', () => {
    const r = rng(5);
    const N = 400;
    const counts = (x: number): number[] => {
      const c = Array.from({ length: SLOT_COUNT }, () => 0);
      for (let i = 0; i < N; i++) c[simulateDrop(x, r)]!++;
      return c.map((n) => n / N);
    };
    const left = counts(14);
    const mid = counts(BOARD_W / 2);
    const right = counts(BOARD_W - 14);
    const share = (c: number[], from: number, to: number): number =>
      c.slice(from, to + 1).reduce((a, b) => a + b, 0);
    // dropped at an edge, the ball tends to land on that side, dropped in the middle it tends to land in the middle
    expect(share(left, 0, 4)).toBeGreaterThan(share(right, 0, 4) + 0.1);
    expect(share(right, 5, 9)).toBeGreaterThan(share(left, 5, 9) + 0.1);
    // (and a ball is bouncy enough that no drop is a sure thing: the middle lanes are the likeliest, not the only ones)
    expect(share(mid, 4, 5)).toBeGreaterThan(share(mid, 0, 1));
    // the edge lanes are reachable from the edge, but are not a given
    expect(left[0]!).toBeGreaterThan(0.02);
    expect(right[9]!).toBeGreaterThan(0.02);
    expect(left[0]!).toBeLessThan(0.5);
  });

  it('a nudge pushes the ball sideways, and not once it has landed', () => {
    const b = newBall(300);
    nudge(b, 1);
    expect(b.vx).toBeGreaterThan(100);
    nudge(b, -1);
    expect(Math.abs(b.vx)).toBeLessThan(1);
    const r = rng(1);
    while (!b.landed) step(b, r);
    nudge(b, 1);
    expect(b.vx).toBe(0);
  });

  it('nudges help: leaning toward an edge lands there more often', () => {
    const r = rng(9);
    const N = 200;
    let plain = 0;
    let leaned = 0;
    for (let i = 0; i < N; i++) {
      plain += simulateDrop(180, r) <= 2 ? 1 : 0;
      const b = newBall(180);
      let frame = 0;
      while (!b.landed) {
        // two nudges to the left early in the fall
        if (frame === 90 || frame === 180) nudge(b, -1);
        step(b, r);
        frame++;
      }
      leaned += (b.slot as number) <= 2 ? 1 : 0;
    }
    expect(leaned).toBeGreaterThan(plain);
  });
});
