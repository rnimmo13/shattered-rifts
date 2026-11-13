import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gothicPageMarks, gothicPixels } from './gothicPalette';
import nose from './gothicNose.json';

describe('Gothic Puppeteer palette', () => {
  it('changes crimson cloth to green without changing alpha, skin, ivory, leather or charcoal', () => {
    const colors = [
      [196, 31, 63, 255],
      [240, 175, 145, 255],
      [224, 203, 166, 128],
      [110, 65, 45, 255],
      [42, 38, 39, 255],
      [196, 31, 63, 0],
    ];
    const data = new Uint8ClampedArray(colors.flat());
    gothicPixels(data);
    expect(data[1]).toBeGreaterThan(data[0]!);
    expect(data[1]).toBeGreaterThan(data[2]!);
    expect(data[3]).toBe(255);
    expect([...data.slice(4)]).toEqual(colors.slice(1).flat());
  });
  it('covers every actual animation frame and keeps landmarks in bounds at both qualities', () => {
    for (const set of ['heroes-sheets', 'heroes-sheets-lite']) {
      const man = JSON.parse(
        readFileSync(
          new URL(
            `../../public/art/${set}/skins/necromancer-gothic-puppeteer/sprites.json`,
            import.meta.url,
          ),
          'utf8',
        ),
      ) as { pages: string[]; clips: Record<string, { frames: number[][] }> };
      for (const [name, c] of Object.entries(man.clips) as [
        keyof typeof nose,
        { frames: number[][] },
      ][]) {
        expect(nose[name].length, name).toBe(c.frames.length);
        for (const [u, v] of nose[name]) {
          expect(u).toBeGreaterThan(0);
          expect(u).toBeLessThan(1);
          expect(v).toBeGreaterThan(0);
          expect(v).toBeLessThan(1);
        }
      }
      for (let i = 0; i < man.pages.length; i++)
        for (const mark of gothicPageMarks(man, i)) {
          expect(Number.isFinite(mark.x + mark.y + mark.angle + mark.scale)).toBe(true);
          expect(mark.scale).toBeGreaterThan(0);
        }
    }
  });
});
