// The size table (DECISIONS #793) must match the High sets on disk: a stale entry would show a model larger than its pixels (soft) or
// needlessly small. scripts/model-pixels.mjs writes it before dev and build; this catches a sheet repacked without it.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODEL_PIXELS } from './modelPixels';
import { HERO_SHEETS, UNIT_SHEET_PREFIX, SHEET_PREFIX } from './heroRigs';
import { UNIT_SHEETS } from './unitSheets';

const art = path.resolve(__dirname, '../../public/art');
const fitted = (dir: string, unit: boolean): number => {
  const man = JSON.parse(fs.readFileSync(path.join(dir, 'sprites.json'), 'utf8')) as {
    displayScale?: number;
    fitWidth?: number;
    clips: { idle: { frames: number[][] } };
  };
  const rest = man.clips.idle.frames[0]!;
  const scale = man.displayScale ?? 1;
  const h = rest[4]! / scale;
  return Math.round(unit ? h : Math.max(h / 0.78, (man.fitWidth ?? rest[3]!) / scale / 0.85));
};

describe('model pixel sizes', () => {
  it('match every High hero set', () => {
    for (const hero of HERO_SHEETS)
      expect(MODEL_PIXELS[`${SHEET_PREFIX}${hero}`]).toBe(
        fitted(path.join(art, 'heroes-sheets', hero), false),
      );
  });
  it('match every High creature set', () => {
    for (const unit of UNIT_SHEETS)
      expect(MODEL_PIXELS[`${UNIT_SHEET_PREFIX}${unit}`]).toBe(
        fitted(path.join(art, 'units-sheets', unit), true),
      );
  });
});
