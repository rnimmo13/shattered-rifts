import { describe, expect, it } from 'vitest';
import { rng } from './logic';
import {
  BALL_R,
  BOARD_H,
  BOARD_W,
  DT,
  LANE_H,
  PEGS,
  PEG_R,
  SLOT_COUNT,
  SLOT_W,
  newBall,
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

  it('every ball lands in the lane it was drawn for, from any drop point, on the board and in a sane time', () => {
    const r = rng(11);
    for (let target = 0; target < SLOT_COUNT; target++)
      for (const x of [BALL_R, 120, 300, 480, BOARD_W - BALL_R, BALL_R + r() * (BOARD_W - 2 * BALL_R)]) {
        const b = newBall(x, target);
        let steps = 0;
        let entryOff = -1;
        while (!b.landed && steps < 240 * 40) {
          step(b, r);
          steps++;
          expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true);
          expect(b.x).toBeGreaterThanOrEqual(BALL_R - 0.001);
          expect(b.x).toBeLessThanOrEqual(BOARD_W - BALL_R + 0.001);
          expect(b.y).toBeLessThanOrEqual(BOARD_H);
          if (entryOff < 0 && b.slot !== null) entryOff = Math.abs(b.x - (target + 0.5) * SLOT_W);
        }
        expect(b.landed).toBe(true);
        expect(b.slot).toBe(target);
        // it arrives inside its lane, not snapped into it from the next one over
        expect(entryOff).toBeLessThan(SLOT_W / 2);
        // a ball takes a while to fall: not instant, not forever
        expect(steps * DT).toBeGreaterThan(1.5);
        expect(steps * DT).toBeLessThan(16);
        expect(b.y).toBeGreaterThan(BOARD_H - LANE_H);
      }
  }, 120_000);

  it('bounces about: two balls dropped from the same place to the same lane do not take the same path', () => {
    const path = (seed: number): string => {
      const r = rng(seed);
      const b = newBall(300, 4);
      const xs: number[] = [];
      for (let i = 0; i < 240 * 20 && !b.landed; i++) {
        step(b, r);
        if (i % 120 === 0) xs.push(Math.round(b.x));
      }
      return xs.join(',');
    };
    expect(path(1)).not.toBe(path(2));
    expect(simulateDrop(300, 4, rng(9))).toBe(4);
  });
});
