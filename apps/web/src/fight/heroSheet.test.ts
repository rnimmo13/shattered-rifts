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

describe('a look whose resting pose holds a weapon far out is fitted by its body (DECISIONS #772)', () => {
  const sets = ['heroes-sheets', 'heroes-sheets-lite'];
  const load = (set: string) =>
    JSON.parse(
      readFileSync(
        join(__dirname, '../../public/art', set, 'skins/knight-demon-knight/sprites.json'),
        'utf8',
      ),
    ) as {
      displayScale: number;
      fitWidth?: number;
      clips: Record<string, { frames: number[][] }>;
    };
  it('the Demon Knight\u2019s body fills the same share of the height as any Riftwalker\u2019s, in both sets', () => {
    for (const set of sets) {
      const man = load(set);
      const rest = man.clips['idle']!.frames[0]!;
      expect(man.fitWidth, set).toBeGreaterThan(0);
      // (narrower than the whole picture, sword and all)
      expect(man.fitWidth!, set).toBeLessThan(rest[3]!);
      // (the fit: the body 0.78 of the height unless its width, at most 0.85 of the height, asks for more room)
      const bodyH = rest[4]! / man.displayScale;
      const bodyW = man.fitWidth! / man.displayScale;
      expect(bodyW / 0.85, set).toBeLessThanOrEqual(bodyH / 0.78);
    }
  });
  it('his feet stand on the same line in every resting frame (the frames are cut from one scaled canvas)', () => {
    for (const set of sets) {
      const man = load(set);
      // (the bottom edge of every idle frame, measured from the feet: the boots never rise or sink)
      const bottoms = new Set(man.clips['idle']!.frames.map((f) => f[6]! + f[4]!));
      expect([...bottoms], set).toHaveLength(1);
    }
  });
});
