// The rules of the trial mini-games, as plain functions of a seed: no DOM, no clock. The same seed is always the same
// puzzle, so a reloaded event offers the puzzle it offered before. (The components in this folder only draw these.)

/** A small seeded generator (mulberry32): the puzzle of a trial comes from the trial's seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const int = (r: () => number, n: number): number => Math.floor(r() * n);

// ---- Echoes: watch the stones ring, then ring them back --------------------------------------------------
export const ECHO_PADS = 4;
export const ECHO_ROUNDS = 6;
export const ECHO_LIVES = 2;
/** The whole song, one note per stone struck; round k asks for its first k + 2 notes. */
export function echoSong(seed: number): number[] {
  const r = rng(seed);
  const out: number[] = [];
  for (let i = 0; i < ECHO_ROUNDS + 2; i++) {
    // never the same stone three times running: a song with a rhythm to it
    let n = int(r, ECHO_PADS);
    while (out.length >= 2 && out[out.length - 1] === n && out[out.length - 2] === n)
      n = int(r, ECHO_PADS);
    out.push(n);
  }
  return out;
}
export const echoLength = (round: number): number => round + 3;

// ---- Pairs: turn tiles, find the matching pairs ---------------------------------------------------------
export const PAIR_COUNT = 6;
/** Wrong turns allowed before the glass wakes. */
export const PAIR_MISSES = 7;
/** A shuffled board of PAIR_COUNT pairs: each entry is a rune index. */
export function pairBoard(seed: number): number[] {
  const r = rng(seed);
  const tiles = Array.from({ length: PAIR_COUNT * 2 }, (_, i) => Math.floor(i / 2));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = int(r, i + 1);
    [tiles[i], tiles[j]] = [tiles[j] as number, tiles[i] as number];
  }
  return tiles;
}

// ---- Rune lock: touch a rune and it and its neighbours flip; darken them all ----------------------------
export const LOCK_SIZE = 4;
export const LOCK_PRESSES = 12;
/** Press rune `i` of a size x size board: it and its four neighbours flip. */
export function press(board: readonly boolean[], i: number, size = LOCK_SIZE): boolean[] {
  const b = [...board];
  const x = i % size;
  const y = Math.floor(i / size);
  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < size && ny >= 0 && ny < size) b[ny * size + nx] = !b[ny * size + nx];
  }
  return b;
}
/** A lock that can always be solved: a dark board scrambled by a few presses (so those same presses undo it). */
export function lockBoard(seed: number, presses = 4): { board: boolean[]; solution: number[] } {
  const r = rng(seed);
  let board: boolean[] = Array.from({ length: LOCK_SIZE * LOCK_SIZE }, () => false);
  const cells = Array.from({ length: LOCK_SIZE * LOCK_SIZE }, (_, i) => i);
  const solution: number[] = [];
  for (let k = 0; k < presses; k++) {
    const at = int(r, cells.length);
    const cell = cells.splice(at, 1)[0] as number;
    solution.push(cell);
    board = press(board, cell);
  }
  // (a scramble that happens to be dark already would be solved before it begins)
  if (!board.some(Boolean)) return lockBoard(seed + 1, presses);
  return { board, solution };
}
export const lockSolved = (board: readonly boolean[]): boolean => !board.some(Boolean);

// ---- Rhythm: strike as the needle crosses the gold --------------------------------------------------------
export const RHYTHM_ROUNDS = 5;
export const RHYTHM_NEEDED = 4;
export interface Beat {
  /** the centre of the gold, 0..1 along the dial */
  at: number;
  /** its width, 0..1 */
  width: number;
  /** seconds for the needle to go across and back */
  period: number;
}
export function rhythmBeats(seed: number): Beat[] {
  const r = rng(seed);
  return Array.from({ length: RHYTHM_ROUNDS }, (_, i) => ({
    at: 0.2 + r() * 0.6,
    width: [0.2, 0.17, 0.15, 0.13, 0.11][i] as number,
    period: [1.9, 1.7, 1.5, 1.35, 1.2][i] as number,
  }));
}
/** Where the needle is (0..1) `t` seconds after the round began: back and forth. */
export function needleAt(t: number, period: number): number {
  const p = (((t / period) % 1) + 1) % 1;
  return p < 0.5 ? p * 2 : (1 - p) * 2;
}
export const inGold = (pos: number, b: Beat): boolean => Math.abs(pos - b.at) <= b.width / 2;

// ---- Cipher: crack a code of runes ---------------------------------------------------------------------
export const CIPHER_RUNES = 6;
export const CIPHER_LENGTH = 4;
export const CIPHER_GUESSES = 8;
/** The secret: CIPHER_LENGTH different runes of CIPHER_RUNES. */
export function cipherSecret(seed: number): number[] {
  const r = rng(seed);
  const pool = Array.from({ length: CIPHER_RUNES }, (_, i) => i);
  const out: number[] = [];
  while (out.length < CIPHER_LENGTH) out.push(pool.splice(int(r, pool.length), 1)[0] as number);
  return out;
}
/** `exact`: the right rune in the right slot. `near`: a right rune in the wrong slot. */
export function cipherScore(
  secret: readonly number[],
  guess: readonly number[],
): { exact: number; near: number } {
  let exact = 0;
  let near = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) exact++;
    else if (secret.includes(guess[i] as number)) near++;
  }
  return { exact, near };
}
