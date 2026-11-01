// What a player has drawn on the act map, to plan a path (DECISIONS #506). Purely a note to themselves: it lives in this browser, never in
// the run or its save, and no rule ever sees it. Points are shares of the map's size, so a drawing stays with the map when the window changes (near enough: the map's fixed side margins move a stop by a few px).

export interface InkStroke {
  color: string;
  /** x, y, x, y..., each 0 to 1 */
  pts: number[];
}

export const PEN_COLORS: readonly { id: string; name: string }[] = [
  { id: '#f4c94e', name: 'Gold' },
  { id: '#fbf8ef', name: 'White' },
  { id: '#ff5a6e', name: 'Red' },
  { id: '#5fe08a', name: 'Green' },
  { id: '#46c4f0', name: 'Blue' },
  { id: '#c79bff', name: 'Violet' },
];

/** The longest gap between two points of a stroke, in px: the eraser looks at points, so a quick line is filled in. */
const STEP_PX = 6;
export const MAX_STROKES = 200;
const MAX_POINTS = 8000;

const share = (n: number): number => Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000;

/** The stroke so far, carried on to (x, y) in px on a w x h map. */
export function extendStroke(pts: readonly number[], x: number, y: number, w: number, h: number): number[] {
  const out = [...pts];
  // (a pen dragged off the map stays at its edge)
  x = Math.max(0, Math.min(w, x));
  y = Math.max(0, Math.min(h, y));
  if (out.length < 2) return [share(x / w), share(y / h)];
  const lx = out[out.length - 2]! * w;
  const ly = out[out.length - 1]! * h;
  const dist = Math.hypot(x - lx, y - ly);
  if (dist < 2 || out.length >= MAX_POINTS) return out;
  const steps = Math.ceil(dist / STEP_PX);
  for (let i = 1; i <= steps; i++) {
    out.push(share((lx + ((x - lx) * i) / steps) / w), share((ly + ((y - ly) * i) / steps) / h));
  }
  return out;
}

/** How far (px, py) is from the segment a-b. */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** The drawing after the eraser has moved from a to b (px): it rubs out what it touches, so a stroke it crosses becomes two. */
export function eraseInk(
  strokes: readonly InkStroke[],
  a: { x: number; y: number },
  b: { x: number; y: number },
  radius: number,
  w: number,
  h: number,
): InkStroke[] {
  const out: InkStroke[] = [];
  for (const s of strokes) {
    let run: number[] = [];
    let touched = false;
    const flush = () => {
      if (run.length > 0) out.push({ color: s.color, pts: run });
      run = [];
    };
    for (let i = 0; i + 1 < s.pts.length; i += 2) {
      if (distToSegment(s.pts[i]! * w, s.pts[i + 1]! * h, a.x, a.y, b.x, b.y) <= radius) {
        touched = true;
        flush();
      } else {
        run.push(s.pts[i]!, s.pts[i + 1]!);
      }
    }
    if (!touched) {
      out.push(s);
      continue;
    }
    flush();
  }
  return out;
}

/** The SVG path of a stroke on a w x h map (a single point is a dot: round caps draw it). */
export function strokePath(pts: readonly number[], w: number, h: number): string {
  if (pts.length < 2) return '';
  let d = `M${(pts[0]! * w).toFixed(1)} ${(pts[1]! * h).toFixed(1)}`;
  if (pts.length === 2) return `${d}L${(pts[0]! * w).toFixed(1)} ${(pts[1]! * h).toFixed(1)}`;
  for (let i = 2; i + 1 < pts.length; i += 2) d += `L${(pts[i]! * w).toFixed(1)} ${(pts[i + 1]! * h).toFixed(1)}`;
  return d;
}

/** A saved drawing, or nothing for anything that is not one (browser storage can hold anything). */
export function parseInk(text: string | null): InkStroke[] {
  if (!text) return [];
  try {
    const raw: unknown = JSON.parse(text);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (s: unknown): s is InkStroke =>
          typeof s === 'object' &&
          s !== null &&
          typeof (s as InkStroke).color === 'string' &&
          /^#[0-9a-f]{6}$/i.test((s as InkStroke).color) &&
          Array.isArray((s as InkStroke).pts) &&
          (s as InkStroke).pts.length % 2 === 0 &&
          (s as InkStroke).pts.every((n) => typeof n === 'number' && n >= 0 && n <= 1),
      )
      .slice(-MAX_STROKES);
  } catch {
    return [];
  }
}

const PREFIX = 'sr.mapInk.';
const INDEX_KEY = 'sr.mapInkIndex';
/** How many maps keep their drawing: an old run's goes when its place is needed. */
const KEEP = 8;

export function loadInk(key: string): InkStroke[] {
  try {
    return parseInk(localStorage.getItem(PREFIX + key));
  } catch {
    return [];
  }
}

export function saveInk(key: string, strokes: readonly InkStroke[]): void {
  try {
    const index = parseIndex(localStorage.getItem(INDEX_KEY)).filter((k) => k !== key);
    if (strokes.length === 0) {
      localStorage.removeItem(PREFIX + key);
    } else {
      localStorage.setItem(PREFIX + key, JSON.stringify(strokes.slice(-MAX_STROKES)));
      index.push(key);
    }
    for (const old of index.splice(0, Math.max(0, index.length - KEEP))) localStorage.removeItem(PREFIX + old);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* (no room or no storage: the drawing simply lasts as long as the screen) */
  }
}

function parseIndex(text: string | null): string[] {
  try {
    const raw: unknown = JSON.parse(text ?? '[]');
    return Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

const COLOR_KEY = 'sr.mapInkColor';

export function loadPenColor(): string {
  try {
    const c = localStorage.getItem(COLOR_KEY);
    if (c && PEN_COLORS.some((p) => p.id === c)) return c;
  } catch {
    /* (the first colour, then) */
  }
  return PEN_COLORS[0]!.id;
}

export function savePenColor(color: string): void {
  try {
    localStorage.setItem(COLOR_KEY, color);
  } catch {
    /* (it goes back to the first colour next time) */
  }
}
