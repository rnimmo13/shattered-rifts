import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gothicPixels } from './gothicPalette';

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
  it('ships the painted palette and grimoire effect at both qualities', () => {
    for (const set of ['heroes-sheets', 'heroes-sheets-lite']) {
      const man = JSON.parse(
        readFileSync(
          new URL(
            `../../public/art/${set}/skins/necromancer-gothic-puppeteer/sprites.json`,
            import.meta.url,
          ),
          'utf8',
        ),
      );
      expect(man.nativeGothicPalette).toBe(true);
      expect(man.clips.idle.effects[0]).toMatchObject({ kind: 'grimoire' });
    }
  });
});
