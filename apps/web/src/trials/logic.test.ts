import { describe, expect, it } from 'vitest';
import {
  CIPHER_LENGTH,
  ECHO_PADS,
  ECHO_ROUNDS,
  LOCK_SIZE,
  PAIR_COUNT,
  cipherScore,
  cipherSecret,
  echoLength,
  echoSong,
  inGold,
  lockBoard,
  lockSolved,
  needleAt,
  pairBoard,
  press,
  rhythmBeats,
} from './logic';

describe('trial puzzles', () => {
  it('are the same puzzle for the same seed, and different for another', () => {
    expect(echoSong(7)).toEqual(echoSong(7));
    expect(pairBoard(7)).toEqual(pairBoard(7));
    expect(lockBoard(7)).toEqual(lockBoard(7));
    expect(cipherSecret(7)).toEqual(cipherSecret(7));
    expect(rhythmBeats(7)).toEqual(rhythmBeats(7));
    expect(pairBoard(7)).not.toEqual(pairBoard(8));
  });

  it('echoes: the song is long enough for the last round, on the pads', () => {
    for (let s = 0; s < 50; s++) {
      const song = echoSong(s);
      expect(song.length).toBeGreaterThanOrEqual(echoLength(ECHO_ROUNDS - 1));
      for (const n of song) expect(n).toBeLessThan(ECHO_PADS);
    }
  });

  it('pairs: every rune appears exactly twice', () => {
    for (let s = 0; s < 50; s++) {
      const b = pairBoard(s);
      for (let i = 0; i < PAIR_COUNT; i++) expect(b.filter((x) => x === i)).toHaveLength(2);
    }
  });

  it('rune lock: always solvable by the presses that scrambled it, and never starts solved', () => {
    for (let s = 0; s < 200; s++) {
      const { board, solution } = lockBoard(s);
      expect(lockSolved(board)).toBe(false);
      let b = board;
      for (const cell of solution) b = press(b, cell);
      expect(lockSolved(b)).toBe(true);
    }
  });

  it('rune lock: a press flips the rune and its neighbours, and stays on the board', () => {
    const dark = Array.from({ length: LOCK_SIZE * LOCK_SIZE }, () => false);
    expect(press(dark, 0).filter(Boolean)).toHaveLength(3);
    expect(press(dark, 5).filter(Boolean)).toHaveLength(5);
    expect(lockSolved(press(press(dark, 5), 5))).toBe(true);
  });

  it('rhythm: the needle goes across and back, and the gold is a window', () => {
    expect(needleAt(0, 2)).toBe(0);
    expect(needleAt(1, 2)).toBe(1);
    expect(needleAt(2, 2)).toBeCloseTo(0);
    expect(needleAt(0.5, 2)).toBeCloseTo(0.5);
    const b = { at: 0.5, width: 0.2, period: 1 };
    expect(inGold(0.55, b)).toBe(true);
    expect(inGold(0.7, b)).toBe(false);
    for (const beat of rhythmBeats(3)) {
      expect(beat.at - beat.width / 2).toBeGreaterThan(0);
      expect(beat.at + beat.width / 2).toBeLessThan(1);
    }
  });

  it('cipher: a secret of different runes, scored by place and by rune', () => {
    for (let s = 0; s < 50; s++) {
      const secret = cipherSecret(s);
      expect(secret).toHaveLength(CIPHER_LENGTH);
      expect(new Set(secret).size).toBe(CIPHER_LENGTH);
    }
    expect(cipherScore([0, 1, 2, 3], [0, 1, 2, 3])).toEqual({ exact: 4, near: 0 });
    expect(cipherScore([0, 1, 2, 3], [3, 2, 1, 0])).toEqual({ exact: 0, near: 4 });
    expect(cipherScore([0, 1, 2, 3], [0, 2, 4, 5])).toEqual({ exact: 1, near: 1 });
  });
});
