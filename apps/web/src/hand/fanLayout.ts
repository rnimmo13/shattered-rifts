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
  const pitch = n === 1 ? 0 : Math.min(w * 0.66, o.maxSpread / (n - 1));
  const stepDeg = Math.min(4.2, 30 / Math.max(1, n - 1));
  const out: FanSlot[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i - (n - 1) / 2; // -k..k around the middle
    const norm = n === 1 ? 0 : t / ((n - 1) / 2); // -1..1
    let x = t * pitch;
    let y = norm * norm * w * 0.16;
    let rot = t * stepDeg;
    let scale = 1;
    let z = i;
    if (o.focus !== null) {
      if (i === o.focus) {
        y = -w * 0.62;
        rot = 0;
        scale = 1.5;
        z = 100;
      } else {
        const d = i - o.focus;
        const push = (w * 0.5) / Math.abs(d) ** 0.7;
        x += Math.sign(d) * push;
      }
    }
    out.push({ x, y, rot, scale, z });
  }
  return out;
}
