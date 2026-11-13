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

/** How much more than its span a row may take, standing a little into each other, before the board sizes the side down. */
export const ROW_GIVE = 1.25;
const ROW_GAP = 24;
/** the least distance between neighbours' centres on a wide screen, stage px: a name plate's narrowest width and its gap (126 screen px)
 * even where the camera draws the stage smallest: Drago's fight, about 0.56 */
export const MIN_PITCH = 240;
/** How far past its near end, toward the middle of the stage, a row's nearest figure may stand (stage px), and the least distance between
 * neighbours' centres when a row is closed up to keep to that. Spreading every row to MIN_PITCH whatever its room put a Beastmaster's
 * third wolf on top of the nearest enemy (Robert's screenshot, 2026-11-12, DECISIONS #774): the two sides' rows each keep to their own
 * half first, and only a row that cannot fit even at TIGHT_PITCH reaches further. */
export const NEAR_REACH = 20;
export const TIGHT_PITCH = 130;

/**
 * The one size a wide screen gives a side's line for a whole fight (Robert, 2026-11-12: "keep a consistent model size", "not
 * stacked"): the largest it can be while the biggest crowd that side can reach still stands in one row, `room` wide with a little
 * give. `widths` are the figures standing now (at full size); `reserve` the widths of those that may still join (the summons to
 * come, at full size). Pure.
 */
export function rowScale(widths: number[], reserve: number[], room: number): number {
  const all = [...widths, ...reserve];
  const need = all.reduce((a, b) => a + b, 0) + ROW_GAP * Math.max(0, all.length - 1);
  return need <= 0 ? 1 : Math.min(1, (room * ROW_GIVE) / need);
}

/**
 * A wide screen's line: one row, every figure at the side's fixed `scale` (rowScale, kept all fight), centred in the span. If the
 * row still overruns the span, the gaps close up and neighbours stand a little into each other: positions only, never the size,
 * and never a rank behind, where a figure would hide.
 */
export function fixedFormation(
  items: LineItem[],
  near: number,
  far: number,
  scale = 1,
): {
  xs: number[];
  rows: number[];
  scale: number;
} {
  const room = Math.abs(far - near);
  const dir = far >= near ? 1 : -1;
  const ws = items.map((it) => it.fw * scale);
  const used = ws.reduce((a, b) => a + b, 0) + ROW_GAP * Math.max(0, items.length - 1);
  const over = used > room ? room / used : 1;
  let edge = (near + far) / 2 - (dir * Math.min(used, room)) / 2;
  const xs: number[] = [];
  for (const w0 of ws) {
    const w = w0 * over;
    xs.push(edge + (dir * w) / 2);
    edge += dir * (w + ROW_GAP * over);
  }
  // (neighbours' centres never closer than a name plate needs: closer, the plates drop a line, and a dropped plate can end up under
  // the hand. The row then reaches a little past its near end, toward the middle of the stage, rather than crowd the plates)
  for (let i = xs.length - 2; i >= 0; i--)
    if (dir * ((xs[i + 1] as number) - (xs[i] as number)) < MIN_PITCH)
      xs[i] = (xs[i + 1] as number) - dir * MIN_PITCH;
  // (but never onto the other side: the row's nearest edge stays within NEAR_REACH of its near end, the row closing up from its
  // far end to do so, down to TIGHT_PITCH between centres)
  if (xs.length > 1) {
    const last = xs[xs.length - 1] as number;
    const edge = (xs[0] as number) - (dir * (ws[0] as number)) / 2;
    const over2 = dir * (near - dir * NEAR_REACH - edge);
    const span = dir * (last - (xs[0] as number));
    if (over2 > 0 && span > 0) {
      const kept = Math.max(span - over2, (xs.length - 1) * TIGHT_PITCH);
      if (kept < span)
        for (let i = 0; i < xs.length - 1; i++)
          xs[i] = last - ((last - (xs[i] as number)) * kept) / span;
    }
  }
  return { xs, rows: items.map(() => 0), scale };
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
