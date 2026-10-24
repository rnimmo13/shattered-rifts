// Where the figures of one side stand, measured from their real widths so that no two overlap. Pure (no canvas, no Pixi).
// Neighbours that stand at different heights (one on the floor, one flying, or flyers on two tiers) may tuck a little
// into each other's width, since one is above the other; if the side still does not fit, every figure on it shrinks.

export interface LineItem {
  /** how much floor the figure needs, stage px (its body, not the empty corners of its picture) */
  fw: number;
  /** 0 = stands on the floor; 1 and up = flies, and each tier is its own height */
  tier: number;
}

/** How close two neighbours on different tiers may stand, as a share of the width they would otherwise need. */
export const TUCK = 0.8;
/** Figures never shrink below this share of their size (a very big crowd overlaps a little instead). */
export const MIN_SCALE = 0.55;

export interface LineFit {
  /** the stage x of each figure's centre, in the order given */
  xs: number[];
  /** how much every figure on this side was shrunk to fit (1 = not at all) */
  scale: number;
}

/**
 * Stand `items` in a row from `near` (the middle of the stage) toward `far`, left to right in the order given.
 * `far` may be below `near` (the allies' side runs to the left).
 */
export function packLine(items: LineItem[], near: number, far: number): LineFit {
  const dir = far >= near ? 1 : -1;
  const place = (s: number): { xs: number[]; used: number } => {
    const xs: number[] = [];
    let edge = near; // the far edge of the last figure
    let prev: LineItem | null = null;
    for (const it of items) {
      const w = it.fw * s;
      const tuck = prev && prev.tier !== it.tier ? TUCK : 1;
      const back = prev ? (prev.fw * s * 0.5 + w * 0.5) * tuck : w * 0.5;
      const centre: number = prev ? (xs[xs.length - 1] as number) + dir * back : near + dir * back;
      xs.push(centre);
      edge = centre + dir * w * 0.5;
      prev = it;
    }
    return { xs, used: Math.abs(edge - near) };
  };
  const room = Math.abs(far - near);
  const full = place(1);
  if (full.used <= room || items.length === 0) return { xs: full.xs, scale: 1 };
  // the width needed grows in step with the scale, so one correction fits it
  const scale = Math.max(MIN_SCALE, room / full.used);
  return { xs: place(scale).xs, scale };
}
