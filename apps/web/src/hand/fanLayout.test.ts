import { describe, expect, it } from 'vitest';
import { gridSlots, handGrid, portraitHandBand } from './fanLayout';

const PHONE = { w: 390, h: 844 };
const band = portraitHandBand(PHONE.h);

describe('the hand as a grid, held upright (DECISIONS #511)', () => {
  it('fits every hand from 1 to 12 cards, whole, inside the width and the band', () => {
    for (const size of [PHONE, { w: 360, h: 640 }, { w: 430, h: 932 }, { w: 768, h: 1024 }]) {
      const b = portraitHandBand(size.h);
      for (let n = 1; n <= 12; n++) {
        const g = handGrid(n, size.w, b);
        const slots = gridSlots(g, null);
        expect(slots, `${n} cards`).toHaveLength(n);
        expect(g.rows.reduce((a, c) => a + c, 0)).toBe(n);
        expect(g.height, `${n} cards in ${size.w}x${size.h}`).toBeLessThanOrEqual(b);
        for (const s of slots)
          expect(Math.abs(s.x) + g.cardWidth / 2, `${n} cards`).toBeLessThanOrEqual(size.w / 2);
      }
    }
  });

  it('no two cards overlap', () => {
    for (let n = 1; n <= 12; n++) {
      const g = handGrid(n, PHONE.w, band);
      const s = gridSlots(g, null);
      const h = g.cardWidth * 1.4;
      for (let a = 0; a < n; a++)
        for (let b2 = a + 1; b2 < n; b2++) {
          const apart =
            Math.abs(s[a]!.x - s[b2]!.x) >= g.cardWidth || Math.abs(s[a]!.y - s[b2]!.y) >= h;
          expect(apart, `${n} cards, ${a} and ${b2}`).toBe(true);
        }
    }
  });

  it('every row is centred', () => {
    for (let n = 1; n <= 12; n++) {
      const g = handGrid(n, PHONE.w, band);
      const s = gridSlots(g, null);
      let at = 0;
      for (const count of g.rows) {
        const row = s.slice(at, at + count);
        at += count;
        expect(row.reduce((sum, c) => sum + c.x, 0)).toBeCloseTo(0);
      }
    }
  });

  it('the cards are bigger than the old fan, and keep their size as a hand of 3 to 6 is played down', () => {
    const sizes = [3, 4, 5, 6].map((n) => handGrid(n, PHONE.w, band).cardWidth);
    expect(new Set(sizes).size).toBe(1);
    expect(sizes[0]).toBeGreaterThan(82);
    expect(handGrid(5, PHONE.w, band).rows).toEqual([3, 2]);
    expect(handGrid(8, PHONE.w, band).rows).toEqual([4, 4]);
    expect(handGrid(10, PHONE.w, band).rows).toEqual([5, 5]);
  });

  it('a tablet held upright keeps one row while it fits bigger', () => {
    expect(handGrid(5, 768, portraitHandBand(1024)).rows).toEqual([5]);
  });

  it('the card in focus comes forward and stays in its place', () => {
    const g = handGrid(5, PHONE.w, band);
    const rest = gridSlots(g, null);
    const on = gridSlots(g, 3);
    expect(on[3]!.x).toBe(rest[3]!.x);
    expect(on[3]!.y).toBe(rest[3]!.y);
    expect(on[3]!.scale).toBeGreaterThan(1);
    expect(on[3]!.z).toBeGreaterThan(on[4]!.z);
  });
});
