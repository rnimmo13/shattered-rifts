import { describe, expect, it } from 'vitest';
import { skinPreview, skinPreviewLayout } from './skinPreview';
import previews from './skinPreviews.json';

describe('Store still and animated preview scale', () => {
  it('matches the sheet renderer at narrow and wide tile widths', () => {
    const contained = Object.keys(previews).filter(
      (id) => id !== 'knight-demon-knight' && id !== 'hunter-glacier-lancer',
    );
    for (const id of contained) {
      const p = skinPreview(id)!;
      for (const width of [140, 240, 400]) {
        const height = 280;
        const fitH = Math.max(p.height / p.displayScale / 0.78, p.fitWidth / p.displayScale / 0.85);
        const actual = skinPreviewLayout(id, width, height, 1.34)!;
        expect(actual.picture.height, id).toBeCloseTo((p.height * actual.fitHeight) / fitH);
        expect(actual.picture.width, id).toBeLessThanOrEqual(width);
        expect(actual.picture.height, id).toBeLessThanOrEqual(height);
        expect(actual.picture.left, id).toBeGreaterThanOrEqual(0);
        expect(actual.picture.top, id).toBeCloseTo(height + (p.y * actual.fitHeight) / fitH);
      }
    }
  });

  it.each(['knight-demon-knight', 'hunter-glacier-lancer'])(
    'keeps %s on its full-height footing even in a narrow tile',
    (id) => {
      const narrow = skinPreviewLayout(id, 140, 240, 1.34)!;
      const wide = skinPreviewLayout(id, 320, 240, 1.34)!;
      expect(narrow.fitHeight).toBe(wide.fitHeight);
      expect(narrow.picture.height).toBeGreaterThan(220);
      expect(narrow.picture.width).toBeGreaterThan(140);
      expect(narrow.shift).toBe(0);
    },
  );

  it('leaves unlisted skins on the existing fallback', () => {
    expect(skinPreviewLayout('unknown', 240, 280)).toBeUndefined();
  });
});
