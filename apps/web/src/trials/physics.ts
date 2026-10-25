// The Brass Cascade's board: a ball falls through staggered pegs with gravity and bounce, and lands in one of ten slots.
// Pure and time-free (the component feeds it fixed time steps), so it can be tested without a screen. A little random
// wobble on each bounce (from the generator it is given) keeps a ball from balancing on a peg, and is what makes it a game
// of chance as well as aim.

export const BOARD_W = 600;
export const BOARD_H = 680;
export const SLOT_COUNT = 10;
/** the height of the row of slots at the bottom */
export const LANE_H = 60;
export const PEG_R = 6;
export const BALL_R = 9;
const GRAVITY = 1000;
/** how bouncy a peg is (1 would be perfectly elastic) */
const BOUNCE = 0.82;
/** the sideways speed a nudge adds */
export const NUDGE_SPEED = 190;
export const BALLS = 3;
export const NUDGES = 6;
/** the fixed time step the board is advanced by */
export const DT = 1 / 240;

export interface Peg {
  x: number;
  y: number;
}
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** the slot it has dropped into (null while it is still among the pegs) */
  slot: number | null;
  /** it has come to rest at the bottom */
  landed: boolean;
  /** how many times it has bounced off the floor */
  floorBounces: number;
}

export const SLOT_W = BOARD_W / SLOT_COUNT;

/** Rows of pegs, each row offset half a gap from the one above (like a Galton board). */
export function makePegs(): Peg[] {
  const pegs: Peg[] = [];
  const rows = 12;
  const top = 90;
  const gap = (BOARD_H - LANE_H - top - 36) / (rows - 1);
  for (let r = 0; r < rows; r++) {
    const odd = r % 2 === 1;
    const n = odd ? SLOT_COUNT - 1 : SLOT_COUNT;
    for (let i = 0; i < n; i++)
      pegs.push({ x: (odd ? SLOT_W : SLOT_W / 2) + i * SLOT_W, y: top + r * gap });
    // half pegs in the walls, on the rows that would leave a clear lane down the side
    if (odd) pegs.push({ x: 0, y: top + r * gap }, { x: BOARD_W, y: top + r * gap });
  }
  return pegs;
}

export const PEGS: readonly Peg[] = makePegs();

export function newBall(x: number, y: number = BALL_R + 4): Ball {
  return {
    x: Math.max(BALL_R, Math.min(BOARD_W - BALL_R, x)),
    y: Math.max(BALL_R + 4, Math.min(BOARD_H - LANE_H - 30, y)),
    vx: 0,
    vy: 0,
    slot: null,
    landed: false,
    floorBounces: 0,
  };
}

/** Push the ball sideways (a nudge). */
export function nudge(b: Ball, dir: -1 | 1): void {
  if (!b.landed) b.vx += dir * NUDGE_SPEED;
}

/** Advance the ball by one fixed step. `r` gives numbers in [0, 1) for the wobble. */
export function step(b: Ball, r: () => number, pegs: readonly Peg[] = PEGS): void {
  if (b.landed) return;
  b.vy += GRAVITY * DT;
  b.x += b.vx * DT;
  b.y += b.vy * DT;

  // the walls
  if (b.x < BALL_R) {
    b.x = BALL_R;
    b.vx = Math.abs(b.vx) * 0.8;
  } else if (b.x > BOARD_W - BALL_R) {
    b.x = BOARD_W - BALL_R;
    b.vx = -Math.abs(b.vx) * 0.8;
  }

  if (b.slot === null) {
    // the pegs
    const reach = BALL_R + PEG_R;
    for (const p of pegs) {
      const dx = b.x - p.x;
      if (dx > reach || dx < -reach) continue;
      const dy = b.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= reach * reach) continue;
      const d = Math.sqrt(d2) || 0.0001;
      const nx = dx / d;
      const ny = dy / d;
      // out of the peg, then bounce off it (only if it is moving into it)
      b.x = p.x + nx * reach;
      b.y = p.y + ny * reach;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= (1 + BOUNCE) * vn * nx;
        b.vy -= (1 + BOUNCE) * vn * ny;
        // a little wobble, so a ball cannot balance on a peg
        b.vx += (r() - 0.5) * 90;
      }
    }
    // the ball has reached the row of slots
    if (b.y >= BOARD_H - LANE_H) b.slot = Math.min(SLOT_COUNT - 1, Math.max(0, Math.floor(b.x / SLOT_W)));
  }

  if (b.slot !== null) {
    // between the dividers of its slot
    const lo = b.slot * SLOT_W + BALL_R;
    const hi = (b.slot + 1) * SLOT_W - BALL_R;
    if (b.x < lo) {
      b.x = lo;
      b.vx = Math.abs(b.vx) * 0.5;
    } else if (b.x > hi) {
      b.x = hi;
      b.vx = -Math.abs(b.vx) * 0.5;
    }
    // the floor: a bounce or two, then it rests
    if (b.y >= BOARD_H - BALL_R) {
      b.y = BOARD_H - BALL_R;
      if (b.vy > 120 && b.floorBounces < 3) {
        b.vy = -b.vy * 0.5;
        b.floorBounces++;
      } else {
        b.vy = 0;
        b.vx = 0;
        b.landed = true;
      }
    }
  }
}

/** Drop a ball from `x` and run it to the end, returning the slot it lands in (for tests and previews). */
export function simulateDrop(x: number, r: () => number): number {
  const b = newBall(x);
  for (let i = 0; i < 240 * 30 && !b.landed; i++) step(b, r);
  if (!b.landed || b.slot === null) throw new Error('The ball never landed');
  return b.slot;
}
