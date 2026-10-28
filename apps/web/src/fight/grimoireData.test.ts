import { describe, expect, it } from 'vitest';
import { CARD_SIZES, fitBook, type CardSize } from './grimoireData';

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
});
