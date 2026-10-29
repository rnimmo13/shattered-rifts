import { describe, expect, it } from 'vitest';
import { oddsCycle } from './odds';

describe("a chance's reel shows its odds (DECISIONS #407)", () => {
  it('has exactly the share of winning tiles', () => {
    for (const pct of [5, 25, 40, 50, 60, 75, 95]) {
      const c = oddsCycle(pct);
      expect(c.filter((t) => t === 0).length / c.length, `${pct}%`).toBe(pct / 100);
    }
    expect(oddsCycle(33).filter((t) => t === 0)).toHaveLength(33);
  });

  it('spreads them: any ten tiles in a row of a 60% reel hold 6 wins', () => {
    const c = oddsCycle(60);
    const twice = [...c, ...c];
    for (let i = 0; i < c.length; i++)
      expect(twice.slice(i, i + 10).filter((t) => t === 0)).toHaveLength(6);
  });
});
