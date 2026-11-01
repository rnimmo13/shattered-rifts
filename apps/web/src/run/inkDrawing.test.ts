import { describe, expect, it } from 'vitest';
import { eraseInk, extendStroke, parseInk, strokePath, type InkStroke } from './inkDrawing';

const W = 1000;
const H = 500;

describe('drawing on the map', () => {
  it('keeps points as shares of the map, so a drawing survives a resize', () => {
    expect(extendStroke([], 500, 250, W, H)).toEqual([0.5, 0.5]);
    expect(extendStroke([], 2000, -40, W, H)).toEqual([1, 0]);
  });

  it('fills in a quick line, so the eraser can find every part of it', () => {
    const pts = extendStroke([0, 0], 600, 0, W, H);
    expect(pts.length / 2).toBeGreaterThanOrEqual(100);
    expect(pts[pts.length - 2]).toBe(0.6);
  });

  it('a pen dragged off the map adds nothing past its edge', () => {
    const pts = extendStroke([1, 0.5], 5000, 250, W, H);
    expect(pts).toEqual([1, 0.5]);
  });

  it('ignores a pointer that has hardly moved', () => {
    expect(extendStroke([0.5, 0.5], 501, 250, W, H)).toEqual([0.5, 0.5]);
  });

  it('the eraser cuts a stroke in two where it crosses, and keeps its colour', () => {
    const line: InkStroke = { color: '#ff5a6e', pts: extendStroke([0, 0.5], 1000, 250, W, H) };
    const left = eraseInk([line], { x: 500, y: 240 }, { x: 500, y: 260 }, 12, W, H);
    expect(left).toHaveLength(2);
    expect(left.every((s) => s.color === '#ff5a6e')).toBe(true);
    expect(Math.max(...left[0]!.pts.filter((_, i) => i % 2 === 0))).toBeLessThan(0.49);
    expect(Math.min(...left[1]!.pts.filter((_, i) => i % 2 === 0))).toBeGreaterThan(0.51);
  });

  it('the eraser leaves what it does not touch, and rubs out a whole stroke it covers', () => {
    const dot: InkStroke = { color: '#f4c94e', pts: [0.1, 0.1] };
    const same = eraseInk([dot], { x: 900, y: 400 }, { x: 900, y: 400 }, 12, W, H);
    expect(same[0]).toBe(dot);
    expect(eraseInk([dot], { x: 100, y: 50 }, { x: 100, y: 50 }, 12, W, H)).toEqual([]);
  });

  it('a single point draws as a dot', () => {
    expect(strokePath([0.5, 0.5], W, H)).toBe('M500.0 250.0L500.0 250.0');
  });

  it('reads back only a real drawing', () => {
    const good = JSON.stringify([{ color: '#46c4f0', pts: [0.1, 0.2] }]);
    expect(parseInk(good)).toHaveLength(1);
    for (const bad of [
      null,
      'not json',
      '{}',
      JSON.stringify([{ color: 'url(evil)', pts: [0.1, 0.2] }]),
      JSON.stringify([{ color: '#46c4f0', pts: [0.1] }]),
      JSON.stringify([{ color: '#46c4f0', pts: [5, 0.2] }]),
    ]) {
      expect(parseInk(bad)).toEqual([]);
    }
  });
});
