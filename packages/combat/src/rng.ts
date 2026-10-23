// Seeded PRNG: xoshiro128** seeded via splitmix32 from a string hash.
// The generator state lives in GameState.rng, so seed + action log replays a game exactly.

export type RngState = [number, number, number, number];

function hashString(seed: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function splitmix32(a: number): () => number {
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    t ^= t >>> 15;
    return t >>> 0;
  };
}

export function seedRng(seed: string): RngState {
  const next = splitmix32(hashString(seed));
  const s: RngState = [next(), next(), next(), next()];
  // xoshiro must not start from the all-zero state
  if (s.every((x) => x === 0)) s[0] = 1;
  return s;
}

function rotl(x: number, k: number): number {
  return (x << k) | (x >>> (32 - k));
}

/** Advances `s` in place and returns a uint32. */
export function nextU32(s: RngState): number {
  const result = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
  const t = s[1] << 9;
  s[2] ^= s[0];
  s[3] ^= s[1];
  s[1] ^= s[2];
  s[0] ^= s[3];
  s[2] ^= t;
  s[3] = rotl(s[3], 11);
  s[0] >>>= 0;
  s[1] >>>= 0;
  s[2] >>>= 0;
  s[3] >>>= 0;
  return result;
}

/** Uniform integer in [0, n). Rejection sampling avoids modulo bias. */
export function nextInt(s: RngState, n: number): number {
  if (n <= 0 || !Number.isInteger(n)) throw new Error(`nextInt: bad range ${n}`);
  const limit = Math.floor(0x100000000 / n) * n;
  let x = nextU32(s);
  while (x >= limit) x = nextU32(s);
  return x % n;
}

/** Fisher–Yates, in place. */
export function shuffle<T>(s: RngState, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(s, i + 1);
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/** Picks `count` distinct items (in random order). */
export function sample<T>(s: RngState, arr: readonly T[], count: number): T[] {
  return shuffle(s, [...arr]).slice(0, count);
}
