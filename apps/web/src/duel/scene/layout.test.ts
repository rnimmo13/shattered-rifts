import { describe, expect, it } from 'vitest';
import { camera, depthScale, floorTop, project, rows, slotGeometry, unproject } from './layout';
import { stage } from '../../design/tokens';

describe('battlefield layout', () => {
  it('project and unproject are inverses on the floor', () => {
    for (const [X, Z] of [
      [0, 6],
      [-3.2, 8.5],
      [4.1, 11],
    ] as const) {
      const p = project(X, Z);
      const q = unproject(p.x, p.y);
      expect(q.X).toBeCloseTo(X, 6);
      expect(q.Z).toBeCloseTo(Z, 6);
    }
  });

  it('things further away are smaller (perspective)', () => {
    expect(depthScale(rows.oppUnit)).toBeLessThan(depthScale(rows.myUnit));
    expect(depthScale(rows.myUnit)).toBeCloseTo(1, 6);
    expect(depthScale(rows.myTrap)).toBeGreaterThan(1);
  });

  it('the rows run from the far edge toward the player, in order, inside the stage', () => {
    const ys = [rows.oppTrap, rows.oppUnit, rows.riftLine, rows.myUnit, rows.myTrap];
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    expect(rows.oppTrap).toBeGreaterThan(floorTop);
    expect(rows.myTrap).toBeLessThan(stage.height);
  });

  it('has 5 unit slots and 4 trap slots per side, centred on the screen', () => {
    const slots = slotGeometry();
    for (const side of ['me', 'opp'] as const) {
      for (const [kind, n] of [
        ['unit', 5],
        ['trap', 4],
      ] as const) {
        const row = slots.filter((s) => s.side === side && s.kind === kind);
        expect(row).toHaveLength(n);
        const mean = row.reduce((t, s) => t + s.x, 0) / n;
        expect(mean).toBeCloseTo(camera.cx, 6);
        // left to right by index, evenly spaced
        row.forEach((s, i) => expect(s.index).toBe(i));
        const gaps = row.slice(1).map((s, i) => s.x - (row[i] as { x: number }).x);
        for (const g of gaps) expect(g).toBeCloseTo(gaps[0] as number, 6);
      }
    }
  });

  it('the near side is drawn larger than the far side', () => {
    const slots = slotGeometry();
    const far = slots.find((s) => s.side === 'opp' && s.kind === 'unit') as { width: number };
    const near = slots.find((s) => s.side === 'me' && s.kind === 'unit') as { width: number };
    expect(near.width).toBeGreaterThan(far.width * 1.4);
  });

  it('no slots overlap within a row', () => {
    const slots = slotGeometry();
    for (const side of ['me', 'opp'] as const) {
      for (const kind of ['unit', 'trap'] as const) {
        const row = slots.filter((s) => s.side === side && s.kind === kind);
        for (let i = 1; i < row.length; i++) {
          const a = row[i - 1] as { x: number; width: number };
          const b = row[i] as { x: number; width: number };
          expect(b.x - a.x).toBeGreaterThan(((a.width + b.width) / 2) * 0.85);
        }
      }
    }
  });
});
