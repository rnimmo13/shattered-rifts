import { describe, expect, it } from 'vitest';
import { skinPreview, skinPreviewLayout } from './skinPreview';
import previews from './skinPreviews.json';

describe('Store still and animated preview scale', () => {
  it('matches the sheet renderer at narrow and wide tile widths', () => {
    for (const id of Object.keys(previews)) {
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

  it('leaves unlisted skins on the existing fallback', () => {
    expect(skinPreviewLayout('unknown', 240, 280)).toBeUndefined();
  });
});
