export interface Point {
  x: number;
  y: number;
}

/** Quadratic control point: bows the arrow upward, more the longer it is. */
export function arrowControl(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  return { x: (from.x + to.x) / 2 - dy * 0.12, y: (from.y + to.y) / 2 - Math.min(180, len * 0.28) };
}
