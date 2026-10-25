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
