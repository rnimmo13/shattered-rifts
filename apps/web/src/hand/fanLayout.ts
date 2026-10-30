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

/** Card width for the hand at the current window size (px). */
export function handCardWidth(viewportWidth: number, viewportHeight = Infinity): number {
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
