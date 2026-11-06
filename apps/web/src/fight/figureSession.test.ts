import { expect, it } from 'vitest';
import { FigureSession } from './figureSession';
it('late artwork cannot replace a live minion after an action, while a new summon gets the loaded art', () => {
  const session = new FigureSession<object>();
  const fallback = {},
    painted = {};
  let available = fallback;
  expect(session.get('u1', 'hound', () => available)).toBe(fallback);
  available = painted;
  expect(session.get('u1', 'hound', () => available)).toBe(fallback);
  expect(session.get('u2', 'hound', () => available)).toBe(painted);
});
it('a Thrall intentionally growing into a Colossus changes its form once', () => {
  const session = new FigureSession<object>();
  const skeleton = {},
    colossus = {};
  expect(session.get('u1', 'bone-thrall', () => skeleton)).toBe(skeleton);
  expect(session.get('u1', 'grave-colossus', () => colossus)).toBe(colossus);
  expect(session.get('u1', 'grave-colossus', () => ({}))).toBe(colossus);
});
