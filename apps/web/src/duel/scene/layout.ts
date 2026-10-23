// The battlefield's geometry, in 1920×1080 "stage" coordinates. One camera looks down at a floating
// stone arena; everything (floor, slots, later monsters) is placed through project() so perspective
// is consistent. Nothing here touches the engine: it's pure layout.

import { stage } from '../../design/tokens';

export const camera = {
  /** Screen x of the vanishing point. */
  cx: stage.width / 2,
  /** Screen y of the horizon (above the screen top: we look steeply down at the arena). */
  vpY: -100,
  /** focal length × camera height; one world unit is f·d/A stage px at screen depth d = y − vpY. */
  A: 5900,
  f: 1000,
} as const;

/** The arena floor starts here (its far edge, where it fades into the abyss). */
export const floorTop = 330;

/** World (X, Z) → stage (x, y). */
export function project(X: number, Z: number): { x: number; y: number } {
  return { x: camera.cx + (X * camera.f) / Z, y: camera.vpY + camera.A / Z };
}

/** Stage (x, y) → world (X, Z) on the floor plane. */
export function unproject(x: number, y: number): { X: number; Z: number } {
  const Z = camera.A / (y - camera.vpY);
  return { X: ((x - camera.cx) * Z) / camera.f, Z };
}

/** Perspective scale at stage row y: 1 at the near unit row. */
export function depthScale(y: number): number {
  return (y - camera.vpY) / (rows.myUnit - camera.vpY);
}

/** The rows of the board (stage y of each row's centre). The Rift line runs between the two sides. */
export const rows = {
  oppTrap: 392,
  oppUnit: 510,
  riftLine: 640,
  myUnit: 770,
  myTrap: 912,
} as const;
