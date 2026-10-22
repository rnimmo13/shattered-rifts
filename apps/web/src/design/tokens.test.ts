import { describe, expect, it } from 'vitest';
import { color, ease, glow, hex, rgba, stage, time } from './tokens';

describe('design tokens', () => {
  it('converts hex colours for Pixi and rgba for canvas/CSS', () => {
    expect(hex('#ff8a3d')).toBe(0xff8a3d);
    expect(hex('#000000')).toBe(0);
    expect(rgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('every colour is a valid #rrggbb', () => {
    for (const [name, c] of Object.entries(color)) expect(c, name).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('keeps the dark-fantasy palette: dark depths, warm gold, violet and cyan rift energy', () => {
    const lum = (c: string) => {
      const n = hex(c);
      return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    };
    for (const c of [color.void, color.obsidian, color.navy]) expect(lum(c)).toBeLessThan(0.12);
    expect(lum(color.goldLight)).toBeGreaterThan(0.6);
    expect(hex(color.gold) >> 16).toBeGreaterThan(hex(color.gold) & 255); // gold is warm: more red than blue
    expect(hex(color.cyan) & 255).toBeGreaterThan(hex(color.cyan) >> 16); // cyan is cool
  });

  it('has no linear easing for motion, and timings that get slower, never faster', () => {
    for (const [name, e] of Object.entries(ease)) {
      expect(e.gsap, name).not.toMatch(/none|linear/);
      expect(e.css, name).toMatch(/^cubic-bezier/);
    }
    expect(time.instant).toBeLessThan(time.fast);
    expect(time.fast).toBeLessThan(time.base);
    expect(time.base).toBeLessThan(time.slow);
    expect(time.slow).toBeLessThan(time.slower);
  });

  it('defines glows for the three accent colours and the stage size', () => {
    for (const k of ['gold', 'violet', 'cyan'] as const) expect(glow[k]).toContain('0 0');
    expect(stage).toEqual({ width: 1920, height: 1080 });
  });
});
