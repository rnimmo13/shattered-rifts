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
        let modelHeight = height * 0.94;
        const span = ((p.right - p.left) * modelHeight) / fitH;
        if (span > width * 1.36) modelHeight *= (width * 1.36) / span;
        const actual = skinPreviewLayout(id, width, height)!;
        expect(actual.height, id).toBeCloseTo((p.height * modelHeight) / fitH);
        expect(actual.width, id).toBeCloseTo((p.width * modelHeight) / fitH);
        expect(actual.top, id).toBeCloseTo(height + (p.y * modelHeight) / fitH);
      }
    }
  });

  it('leaves unlisted skins on the existing fallback', () => {
    expect(skinPreviewLayout('unknown', 240, 280)).toBeUndefined();
  });
});
