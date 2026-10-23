import { describe, expect, it } from 'vitest';
import { depthScale, floorTop, project, rows, unproject } from './layout';
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
});
