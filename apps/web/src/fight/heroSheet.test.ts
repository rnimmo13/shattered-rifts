import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STRIKE_LEAD, strikeStart } from './heroSheet';

describe('a Riftwalker’s strike leaves out its slow wind-up (DECISIONS #770)', () => {
  it('starts STRIKE_LEAD before the first marked moment, on a frame, and never before the clip', () => {
    expect(strikeStart({ fps: 60, events: [{ frame: 16 }, { frame: 22 }] })).toBeCloseTo(10 / 60);
    expect(strikeStart({ fps: 24, events: [{ frame: 6 }] })).toBeCloseTo(4 / 24);
    expect(strikeStart({ fps: 60, events: [{ frame: 3 }] })).toBe(0);
    expect(strikeStart({ fps: 60, events: [] })).toBe(0);
    expect(strikeStart({ fps: 60 })).toBe(0);
  });
  it('every Riftwalker’s attack clips come to the same short wait before the moment', () => {
    const root = join(__dirname, '../../public/art/heroes-sheets');
    const heroes = readdirSync(root).filter((h) => existsSync(join(root, h, 'sprites.json')));
    expect(heroes.length).toBe(10);
    for (const hero of heroes) {
      const man = JSON.parse(readFileSync(join(root, hero, 'sprites.json'), 'utf8')) as {
        clips: Record<string, { fps: number; count: number; events?: { frame: number }[] }>;
      };
      for (const name of ['attack', 'attack2', 'slash']) {
        const c = man.clips[name];
        if (!c) continue;
        const first = Math.min(...(c.events ?? []).map((e) => e.frame));
        expect(Number.isFinite(first), hero + ' ' + name).toBe(true);
        const wait = first / c.fps - strikeStart(c);
        // (a frame's worth of rounding either side of STRIKE_LEAD)
        expect(wait, hero + ' ' + name).toBeGreaterThan(STRIKE_LEAD - 1 / c.fps);
        expect(wait, hero + ' ' + name).toBeLessThan(STRIKE_LEAD + 1 / c.fps);
        expect(strikeStart(c), hero + ' ' + name).toBeLessThan(c.count / c.fps);
      }
    }
  });
});
