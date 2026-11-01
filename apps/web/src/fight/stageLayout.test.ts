import { describe, expect, it } from 'vitest';
import { PORTRAIT, boardReserve, frameFor, portraitMyY } from './stageLayout';

describe('the upright stage', () => {
  it('stands you lower on a taller phone, up to a limit', () => {
    const short = portraitMyY(360, 640);
    const tall = portraitMyY(412, 915);
    expect(tall).toBeGreaterThan(short);
    expect(short).toBeGreaterThanOrEqual(PORTRAIT.myY);
    // (it leaves room under the feet for the plate's two rows of buffs, however tall the screen)
    expect(short).toBeLessThan(1000);
    // (your companions, about 215 stage px tall, stand below the enemies' plates on an ordinary phone: DECISIONS #511)
    for (const [w, h] of [[390, 844], [412, 915], [430, 932]] as const) {
      const frame = frameFor('portrait', h);
      const r = boardReserve('portrait', w, h);
      const scale = Math.min(w / (frame.x1 - frame.x0), (h - r.top - r.bottom) / (frame.bottom - frame.top));
      const foePlateBottom = PORTRAIT.foeY + 60 / scale;
      expect(portraitMyY(w, h) - 215, `${w}x${h}`).toBeGreaterThanOrEqual(foePlateBottom);
    }
    expect(portraitMyY(412, 5000)).toBe(PORTRAIT.myMaxY);
  });
});
