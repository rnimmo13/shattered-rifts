// Small deterministic helpers for procedural art: a seeded RNG and tileable value noise.
// The art is generated, never random per load, so the battlefield looks identical every time.

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** A tileable value-noise field: sample(x, y) in lattice units wraps every `size` cells. */
export class TileNoise {
  private readonly v: Float32Array;
  constructor(
    readonly size: number,
    seed: number,
  ) {
    const r = rng(seed);
    this.v = new Float32Array(size * size);
    for (let i = 0; i < this.v.length; i++) this.v[i] = r();
  }

  sample(x: number, y: number): number {
    const n = this.size;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const xa = ((x0 % n) + n) % n;
    const ya = ((y0 % n) + n) % n;
    const xb = (xa + 1) % n;
    const yb = (ya + 1) % n;
    const a = this.v[ya * n + xa] as number;
    const b = this.v[ya * n + xb] as number;
    const c = this.v[yb * n + xa] as number;
    const d = this.v[yb * n + xb] as number;
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
}

/** Tileable fractal noise (each octave doubles the lattice, so the tile still wraps). */
export function fbm(octaves: TileNoise[], u: number, v: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = 1;
  for (const o of octaves) {
    sum += amp * o.sample(u * freq, v * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

export function makeOctaves(baseSize: number, count: number, seed: number): TileNoise[] {
  // octave k uses a lattice of baseSize * 2^k cells so it wraps with the same period as octave 0
  return Array.from({ length: count }, (_, k) => new TileNoise(baseSize * 2 ** k, seed + k * 101));
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));
