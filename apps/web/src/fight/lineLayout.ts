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

/** A line packed from `near` towards `far` (left to right), then slid so the group sits in the middle of that span. */
export function centredLine(items: LineItem[], near: number, far: number): LineFit {
  const fit = packLine(items, near, far);
  const last = items.length - 1;
  if (last < 0) return fit;
  const first = (fit.xs[0] as number) - ((items[0] as LineItem).fw * fit.scale) / 2;
  const end = (fit.xs[last] as number) + ((items[last] as LineItem).fw * fit.scale) / 2;
  const shift = (near + far) / 2 - (first + end) / 2;
  return { ...fit, xs: fit.xs.map((x) => x + shift) };
}

/** Fixed-size figures use rows of two rather than shrinking when another summon joins. */
export function stableFormation(
  items: LineItem[],
  near: number,
  far: number,
): { xs: number[]; rows: number[] } {
  const xs: number[] = [],
    rows: number[] = [];
  for (let start = 0; start < items.length; start += 2) {
    const fit = centredLine(items.slice(start, start + 2), near, far);
    xs.push(...fit.xs);
    rows.push(...fit.xs.map(() => Math.floor(start / 2)));
  }
  return { xs, rows };
}

/** Use the whole side for selectable silhouettes, with a real gutter even for flyers.
 * Three figures fit across before another rank is needed. Every rank shares a scale;
 * callers must apply it to the models as well as their positions.
 */
export function selectionFormation(
  items: LineItem[],
  near: number,
  far: number,
): {
  xs: number[];
  rows: number[];
  scale: number;
} {
  if (!items.length) return { xs: [], rows: [], scale: 1 };
  const columns = Math.min(3, items.length);
  const pitch = Math.abs(far - near) / columns;
  const largest = Math.max(...items.map((item) => item.fw));
  const scale = Math.min(1, (pitch - 32) / largest);
  const dir = far >= near ? 1 : -1;
  const xs: number[] = [],
    rows: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const row = Math.floor(i / columns);
    const count = Math.min(columns, items.length - row * columns);
    xs.push(near + dir * (pitch * ((columns - count) / 2 + (i % columns) + 0.5)));
    rows.push(row);
  }
  return { xs, rows, scale };
}
