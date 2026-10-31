import { describe, expect, it } from 'vitest';
import { PORTRAIT, portraitMyY } from './stageLayout';

describe('the upright stage', () => {
  it('stands you lower on a taller phone, up to a limit', () => {
    const short = portraitMyY(360, 640);
    const tall = portraitMyY(412, 915);
    expect(tall).toBeGreaterThan(short);
    expect(short).toBeGreaterThanOrEqual(PORTRAIT.myY);
    expect(portraitMyY(412, 5000)).toBe(PORTRAIT.myMaxY);
  });
});
