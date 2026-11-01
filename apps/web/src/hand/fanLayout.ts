// Pure layout for the hand fan. Positions are in px relative to the hand's anchor (bottom centre).
// The hovered card lifts, grows and straightens; its neighbours slide away to make room.

export interface FanSlot {
  x: number;
  y: number;
  /** degrees */
  rot: number;
  scale: number;
  z: number;
}

export interface FanOptions {
  cardWidth: number;
  /** widest the fan may spread, px */
  maxSpread: number;
  /** index of the hovered/dragged card, or null */
  focus: number | null;
}

export function fanLayout(n: number, o: FanOptions): FanSlot[] {
  if (n <= 0) return [];
  const w = o.cardWidth;
  const pitch = n === 1 ? 0 : Math.min(w * 0.8, o.maxSpread / (n - 1));
  const stepDeg = Math.min(4.2, 30 / Math.max(1, n - 1));
  const out: FanSlot[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i - (n - 1) / 2; // -k..k around the middle
    const norm = n === 1 ? 0 : t / ((n - 1) / 2); // -1..1
    let x = t * pitch;
    let y = norm * norm * w * 0.07;
    let rot = t * stepDeg;
    let scale = 1;
    let z = i;
    if (o.focus !== null) {
      if (i === o.focus) {
        y = -w * 0.4;
        rot = 0;
        scale = 1.28;
        z = 100;
      } else {
        const d = i - o.focus;
        const push = (w * 0.36) / Math.abs(d) ** 0.7;
        x += Math.sign(d) * push;
      }
    }
    out.push({ x, y, rot, scale, z });
  }
  return out;
}

/** Held upright, the hand is a grid in a band of fixed height, so nothing above it moves as cards come and go (DECISIONS #511). */
const GRID_GAP = 6;
const GRID_PAD = 8;
const GRID_MAX_WIDTH = 200;

/** How tall the hand's band is on a screen held upright (px): two rows of cards, under a third of the screen, as the board needs the rest. */
export function portraitHandBand(viewportHeight: number): number {
  return Math.round(Math.min(viewportHeight * 0.32, 2 * GRID_MAX_WIDTH * 1.4 + 2 * GRID_GAP));
}

export interface HandGrid {
  cardWidth: number;
  /** how far the top of the hand reaches up from the bottom of the screen */
  height: number;
  /** how many cards in each row, top row first */
  rows: number[];
}

/**
 * The biggest cards that fit: every row is centred and the cards are all one size, so a hand is always symmetrical and always wholly
 * readable. A hand of under five is sized as five would be, so the cards keep their size as a hand is played down; one row wins a tie.
 */
export function handGrid(n: number, viewportWidth: number, band: number): HandGrid {
  const sized = Math.max(n, 5);
  const across = (cols: number): number =>
    (viewportWidth - 2 * GRID_PAD - (cols - 1) * GRID_GAP) / cols;
  const oneWidth = Math.min(GRID_MAX_WIDTH, across(sized), (band - GRID_GAP) / 1.4);
  const twoWidth = Math.min(
    GRID_MAX_WIDTH,
    across(Math.ceil(sized / 2)),
    (band - 2 * GRID_GAP) / 2 / 1.4,
  );
  const two = twoWidth > oneWidth;
  const cardWidth = Math.floor(two ? twoWidth : oneWidth);
  // (three or fewer always fit on one row; otherwise the top row takes the odd card)
  const rows = two && n > 3 ? [Math.ceil(n / 2), Math.floor(n / 2)] : [n];
  const h = cardWidth * 1.4;
  return { cardWidth, rows, height: rows.length * h + (rows.length - 1) * GRID_GAP + GRID_GAP };
}

/** Where each card of a grid sits: x from the middle of the screen, y up from the bottom (negative), reading order. */
export function gridSlots(g: HandGrid, focus: number | null): FanSlot[] {
  const h = g.cardWidth * 1.4;
  const out: FanSlot[] = [];
  g.rows.forEach((count, row) => {
    const fromBottom = g.rows.length - 1 - row;
    for (let i = 0; i < count; i++) {
      const at = out.length;
      out.push({
        x: (i - (count - 1) / 2) * (g.cardWidth + GRID_GAP),
        y: -(GRID_GAP + fromBottom * (h + GRID_GAP)),
        rot: 0,
        scale: at === focus ? 1.06 : 1,
        z: at === focus ? 100 : at,
      });
    }
  });
  return out;
}

/** Card width for the hand at the current window size (px). */
export function handCardWidth(viewportWidth: number, viewportHeight: number): number {
  const wide = Math.round(Math.max(168, Math.min(238, viewportWidth * 0.122)));
  // (DECISIONS #443) held upright: about five cards across, and never a fifth of the height (a tap shows a card big)
  if (viewportHeight > viewportWidth)
    return Math.round(Math.max(72, Math.min(wide, viewportWidth * 0.21, viewportHeight * 0.17)));
  // a phone on its side (a short window): the cards shrink so the hand takes under a quarter of the screen
  if (viewportHeight < 600 || viewportWidth < 700)
    return Math.round(Math.max(72, Math.min(wide, viewportHeight * 0.24, viewportWidth * 0.2)));
  // a tablet held sideways: a fifth of the height, so the board has room above
  if (viewportWidth < 1200 && viewportHeight < 900)
    return Math.round(Math.min(wide, viewportHeight * 0.2));
  return wide;
}

/** How far the resting hand reaches up from the bottom of the screen: the board is fitted above this. */
export function handReserve(cardWidth: number): number {
  return Math.round(cardWidth * 1.4 + 6);
}

/** Resting cards sink this far (fraction of card width) below the screen edge; hovering lifts them clear. */
export const HAND_SINK = 0.03;
