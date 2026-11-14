import { describe, expect, it } from 'vitest';
import { CARD_SIZES, COL_GAP, fitBook, fitScroll, type CardSize } from './grimoireData';

const SIZES = Object.keys(CARD_SIZES) as CardSize[];
const WINDOWS: [number, number][] = [
  [1920, 1000],
  [1440, 820],
  [1280, 640],
  [1024, 700],
  [800, 900],
  [390, 760],
];

describe('fitBook', () => {
  it('keeps every card inside its size range, whatever the window', () => {
    for (const size of SIZES)
      for (const [w, h] of WINDOWS)
        for (const n of [1, 10, 30, 400]) {
          const f = fitBook(w, h, n, size);
          expect(f.cardWidth).toBeGreaterThanOrEqual(CARD_SIZES[size].min);
          expect(f.cardWidth).toBeLessThanOrEqual(CARD_SIZES[size].max);
        }
  });

  it('puts a short deck on one spread with bigger cards than a long one', () => {
    const short = fitBook(1880, 900, 10, 'read');
    const long = fitBook(1880, 900, 60, 'read');
    expect(short.spread * short.cols * short.rows).toBeGreaterThanOrEqual(10);
    expect(short.cardWidth).toBeGreaterThanOrEqual(long.cardWidth);
  });

  it('never opens two pages when one holds every card', () => {
    const f = fitBook(1880, 900, 4, 'pick');
    expect(f.spread).toBe(1);
  });

  it('does not change for a window a few px different', () => {
    const a = fitBook(1500, 850, 40, 'read');
    const b = fitBook(1502, 851, 40, 'read');
    expect(b).toEqual(a);
  });

  it('a growing book puts as many across as fit, and just the rows its cards need', () => {
    const f = fitBook(900, Infinity, 12, 'small', { spread: 1 });
    expect(f.cols).toBe(6);
    expect(f.rows).toBe(2);
    expect(f.cardWidth).toBeGreaterThanOrEqual(CARD_SIZES.small.min);
  });

  it('on a phone the slimmer book fits two cards across a page (DECISIONS #443)', () => {
    expect(fitBook(330, Infinity, 10, 'small', { spread: 1 }).cols).toBe(1);
    const f = fitBook(330, Infinity, 10, 'small', { spread: 1, narrow: true });
    expect(f.cols).toBe(2);
    expect(f.cardWidth).toBeGreaterThanOrEqual(CARD_SIZES.small.min);
  });
});

describe('fitScroll (DECISIONS #725)', () => {
  it('fits a starter deck in five desktop columns while preserving readable narrow layouts', () => {
    for (const width of [600, 900, 1400]) {
      const fit = fitScroll(width, Infinity, 'small', false, 5);
      expect(fit.cols).toBe(5);
      expect(fit.cols * fit.cardWidth + 4 * COL_GAP).toBeLessThanOrEqual(width);
    }
    expect(fitScroll(320, Infinity, 'small', true, 5)).toEqual(
      fitScroll(320, Infinity, 'small', true),
    );
    expect(fitScroll(450, Infinity, 'small', false, 5)).toEqual(
      fitScroll(450, Infinity, 'small', false),
    );
  });
  const span = (w: number, f: { cols: number; cardWidth: number }): number =>
    (f.cols * f.cardWidth + (f.cols - 1) * COL_GAP) / w;

  it('keeps every card inside its size range, whatever the width', () => {
    for (const size of SIZES)
      for (const w of [300, 700, 1100, 1500, 2339, 3500])
        for (const h of [Infinity, 500, 900]) {
          const f = fitScroll(w, h, size);
          expect(f.cardWidth).toBeGreaterThanOrEqual(CARD_SIZES[size].min);
          expect(f.cardWidth).toBeLessThanOrEqual(CARD_SIZES[size].max);
        }
  });

  it('fills the row across the page, not a narrow grid with bare parchment beside it', () => {
    // (Robert's screen, 2026-11-10: a page 2,339 px wide held six 220 px cards and a 1,000 px empty strip)
    for (const size of ['read', 'pick', 'browse'] as const)
      for (const w of [900, 1300, 1800, 2339, 3500])
        expect(span(w, fitScroll(w, 900, size))).toBeGreaterThan(0.85);
    expect(fitScroll(2339, 900, 'pick').cols).toBeGreaterThanOrEqual(9);
  });

  it('never makes a card taller than the list can show at once', () => {
    const f = fitScroll(2000, 300, 'pick');
    expect(f.cardWidth * 1.4).toBeLessThanOrEqual(Math.max(300, CARD_SIZES.pick.min * 1.4));
  });

  it('does not change for a window a few px different', () => {
    expect(fitScroll(1502, 851, 'read')).toEqual(fitScroll(1500, 850, 'read'));
  });

  it('on a phone two cards fit across', () => {
    expect(fitScroll(320, Infinity, 'read', true).cols).toBe(2);
  });
});
