import type { PlayerId } from './types';

export const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);

/** JSON.stringify with sorted object keys, so equal values always serialise identically. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      return Object.fromEntries(
        Object.keys(o)
          .sort()
          .map((k) => [k, o[k]]),
      );
    }
    return v;
  });
}

/** cyrb53: fast 53-bit string hash, returned as hex. Used for state hashes (determinism tests). */
export function hashString53(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export function hashState(state: unknown): string {
  return hashString53(stableStringify(state));
}

export class RulesError extends Error {
  override name = 'RulesError';
}

/** Thrown when an engine safety cap is hit (chain depth / trigger queue). A test must fail if this happens. */
export class EngineCapError extends Error {
  override name = 'EngineCapError';
}

/** Deep clone. Game state is plain JSON by design, so a JSON round-trip is exact. */
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** All k-combinations of `items` (in order). */
export function combinations<T>(items: readonly T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  const out: T[][] = [];
  const rec = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      acc.push(items[i] as T);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(0, []);
  return out;
}

export function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

/** Cartesian product of arrays. */
export function product<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>((acc, list) => acc.flatMap((a) => list.map((x) => [...a, x])), [[]]);
}
