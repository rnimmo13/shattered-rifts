// Backdrops for card art: each Riftwalker's cards are set in their own place (the knight's castle walls, the engineer's factory, the hunter's
// pine forest...), painted as two layers of silhouettes, a far one faded into the sky and a near one dark, with a few lit
// details (windows, lanterns, lava). Everything is placed by the card's own seeded random numbers, so no two cards share
// a skyline. Cards without a scene keep the plain jagged horizon (proceduralArt.ts).

type G = CanvasRenderingContext2D;
type R = () => number;

export interface SceneColors {
  dark: string;
  glow: string;
}

const hexA = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function fillPath(g: G, c: string, pts: [number, number][]): void {
  g.fillStyle = c;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}

/** a rolling ground line from x=0 to x=W around height `y`, closed along the bottom */
function ground(g: G, c: string, W: number, H: number, y: number, r: R, rough = 10): void {
  const pts: [number, number][] = [[0, H]];
  for (let x = 0; x <= W; x += 40) pts.push([x, y + (r() - 0.5) * rough]);
  pts.push([W, H]);
  fillPath(g, c, pts);
}

/** a soft round light (a lit window, a lantern, a moon's glow) */
function lamp(g: G, c: string, x: number, y: number, rad: number, a = 0.6): void {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, rad);
  gr.addColorStop(0, hexA(c, a));
  gr.addColorStop(1, hexA(c, 0));
  g.fillStyle = gr;
  g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.restore();
}

function pine(g: G, c: string, x: number, base: number, h: number): void {
  const w = h * 0.36;
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * h * 0.22;
    fillPath(g, c, [
      [x, top],
      [x + w * (0.55 + i * 0.22), base - h * (0.42 - i * 0.16)],
      [x - w * (0.55 + i * 0.22), base - h * (0.42 - i * 0.16)],
    ]);
  }
  g.fillStyle = c;
  g.fillRect(x - h * 0.03, base - h * 0.2, h * 0.06, h * 0.2);
}

function deadTree(g: G, c: string, x: number, base: number, h: number, r: R): void {
  g.strokeStyle = c;
  g.lineCap = 'round';
  const branch = (
    x0: number,
    y0: number,
    len: number,
    ang: number,
    w: number,
    depth: number,
  ): void => {
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    if (depth > 0) {
      branch(x1, y1, len * 0.7, ang - 0.5 - r() * 0.3, w * 0.62, depth - 1);
      branch(x1, y1, len * 0.66, ang + 0.4 + r() * 0.3, w * 0.62, depth - 1);
    }
  };
  branch(x, base, h * 0.42, -Math.PI / 2 + (r() - 0.5) * 0.3, h * 0.07, 3);
}

/** the two layers every scene paints, far (faded) then near (dark) */
function layers(c: SceneColors, paint: (col: string, near: boolean) => void): void {
  paint(hexA(c.dark, 0.45), false);
  paint(hexA(c.dark, 0.92), true);
}

const SCENES: Record<string, (g: G, W: number, H: number, c: SceneColors, r: R) => void> = {
  // castle walls and towers with banners
  knight(g, W, H, c, r) {
    layers(c, (col, near) => {
      const base = H * (near ? 0.8 : 0.7);
      const pts: [number, number][] = [[0, H]];
      const towers: [number, number][] = [];
      for (let x = 0; x <= W;) {
        const tower = r() < 0.35;
        const w = tower ? 40 + r() * 30 : 60 + r() * 60;
        const top = base - (tower ? 70 + r() * 70 : 20 + r() * 20);
        pts.push([x, top]);
        // crenellations
        for (let k = x; k < x + w - 8; k += 16)
          pts.push([k, top], [k, top - 9], [k + 8, top - 9], [k + 8, top]);
        pts.push([x + w, top]);
        if (tower) towers.push([x + w / 2, top]);
        x += w;
      }
      pts.push([W, H]);
      fillPath(g, col, pts);
      if (!near) return;
      // lit windows in the towers, painted over the wall so they show, and a banner flying from the first two
      for (const [x, top] of towers) lamp(g, c.glow, x, top + 26, 12, 0.5);
      for (const [tx, top] of towers.slice(0, 2)) {
        const x = tx - 1.5;
        const y = top - 59;
        g.fillStyle = col;
        g.fillRect(x, y, 3, 50);
        fillPath(g, hexA(c.glow, 0.5), [
          [x + 3, y],
          [x + 34, y + 8],
          [x + 3, y + 18],
        ]);
      }
    });
  },
  // temple pillars on a mountainside, the sun behind a peak
  barbarian(g, W, H, c, r) {
    lamp(g, c.glow, W * (0.3 + r() * 0.4), H * 0.42, 120, 0.35);
    fillPath(g, hexA(c.dark, 0.4), [
      [0, H * 0.75],
      [W * 0.3, H * (0.35 + r() * 0.1)],
      [W * 0.45, H * 0.5],
      [W * 0.62, H * (0.3 + r() * 0.1)],
      [W, H * 0.7],
      [W, H],
      [0, H],
    ]);
    const base = H * 0.82;
    ground(g, hexA(c.dark, 0.92), W, H, base, r, 6);
    const n = 3 + Math.floor(r() * 3);
    const x0 = W * (r() < 0.5 ? 0.04 : 0.55);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 52;
      g.fillStyle = hexA(c.dark, 0.92);
      g.fillRect(x, base - 150, 22, 150);
      g.fillRect(x - 6, base - 158, 34, 10);
    }
    g.fillRect(x0 - 10, base - 172, n * 52 + 8, 16);
  },
  // a factory skyline: chimneys, tanks, smoke and lit windows
  engineer(g, W, H, c, r) {
    layers(c, (col, near) => {
      const base = H * (near ? 0.82 : 0.72);
      for (let x = -10; x < W;) {
        const w = 50 + r() * 70;
        const h = 40 + r() * (near ? 80 : 120);
        g.fillStyle = col;
        g.fillRect(x, base - h, w, H);
        if (r() < 0.6) {
          const cx = x + w * (0.2 + r() * 0.6);
          const ch = 50 + r() * 70;
          g.fillRect(cx - 7, base - h - ch, 14, ch);
          if (near) lamp(g, '#9aa8b8', cx, base - h - ch - 20, 26, 0.18);
        }
        if (near)
          for (let k = 0; k < 3; k++)
            if (r() < 0.5) {
              g.fillStyle = hexA(c.glow, 0.7);
              g.fillRect(x + 8 + k * 16, base - h + 14, 8, 6);
            }
        x += w + r() * 10;
      }
    });
  },
  // a forest of pines and carved totem poles, spirit-lights drifting
  shaman(g, W, H, c, r) {
    layers(c, (col, near) => {
      const base = H * (near ? 0.86 : 0.74);
      for (let x = r() * 30; x < W; x += 34 + r() * 40)
        pine(g, col, x, base, near ? 110 + r() * 60 : 80 + r() * 50);
      ground(g, col, W, H, base, r, 6);
      if (near)
        for (let i = 0; i < 2; i++) {
          const x = W * (0.1 + r() * 0.8);
          g.fillStyle = col;
          g.fillRect(x - 9, base - 120, 18, 120);
          fillPath(g, col, [
            [x - 30, base - 116],
            [x, base - 128],
            [x + 30, base - 116],
            [x, base - 106],
          ]);
          lamp(g, c.glow, x - 3, base - 90, 8, 0.8);
          lamp(g, c.glow, x + 3, base - 90, 8, 0.8);
        }
    });
    for (let i = 0; i < 5; i++) lamp(g, c.glow, r() * W, H * (0.3 + r() * 0.4), 10 + r() * 10, 0.5);
  },
  // deep pine forest under a big moon
  hunter(g, W, H, c, r) {
    lamp(g, '#fff0d0', W * (0.15 + r() * 0.7), H * 0.25, 60, 0.35);
    layers(c, (col, near) => {
      const base = H * (near ? 0.9 : 0.76);
      for (let x = r() * 20; x < W; x += 26 + r() * 30)
        pine(g, col, x, base, near ? 150 + r() * 90 : 90 + r() * 60);
      ground(g, col, W, H, base, r, 8);
    });
  },
  // moonlit rooftops, with web lines strung between the chimneys
  trickster(g, W, H, c, r) {
    lamp(g, '#e8e0ff', W * (0.2 + r() * 0.6), H * 0.22, 50, 0.4);
    const tops: [number, number][] = [];
    const windows: [number, number][] = [];
    layers(c, (col, near) => {
      const base = H * (near ? 0.84 : 0.72);
      const pts: [number, number][] = [[0, H]];
      for (let x = 0; x <= W;) {
        const w = 60 + r() * 60;
        const h = base - (30 + r() * 70);
        pts.push([x, h], [x + w / 2, h - 30 - r() * 20], [x + w, h]);
        if (near) tops.push([x + w / 2, h - 30]);
        if (near && r() < 0.5) windows.push([x + w / 2, h + 24]);
        x += w;
      }
      pts.push([W, H]);
      fillPath(g, col, pts);
      for (const [x, y] of windows) lamp(g, c.glow, x, y, 9, 0.55);
    });
    g.strokeStyle = hexA('#d8d0ff', 0.35);
    g.lineWidth = 1.5;
    for (let i = 0; i + 1 < tops.length; i += 2) {
      const [a, b] = [tops[i]!, tops[i + 1]!];
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 30, b[0], b[1]);
      g.stroke();
    }
  },
  // a narrow alley: walls left and right, hanging lanterns, washing lines
  assassin(g, W, H, c, r) {
    layers(c, (col, near) => {
      if (!near) {
        ground(g, col, W, H, H * 0.7, r, 30);
        return;
      }
      const lw = W * (0.14 + r() * 0.1);
      const rw = W * (0.14 + r() * 0.1);
      fillPath(g, col, [
        [0, 0],
        [lw, H * 0.15],
        [lw, H * 0.9],
        [0, H],
      ]);
      fillPath(g, col, [
        [W, 0],
        [W - rw, H * 0.12],
        [W - rw, H * 0.9],
        [W, H],
      ]);
      ground(g, col, W, H, H * 0.88, r, 4);
      g.strokeStyle = col;
      g.lineWidth = 2;
      for (let i = 0; i < 2; i++) {
        const y = H * (0.2 + r() * 0.15);
        g.beginPath();
        g.moveTo(lw, y);
        g.quadraticCurveTo(W / 2, y + 30, W - rw, y + (r() - 0.5) * 20);
        g.stroke();
        lamp(g, c.glow, W * (0.3 + r() * 0.4), y + 26, 14, 0.7);
      }
    });
  },
  // obsidian spires and shards with lava in the cracks
  spellblade(g, W, H, c, r) {
    // a lava glow along the horizon, behind everything
    const hz = g.createLinearGradient(0, H * 0.5, 0, H * 0.8);
    hz.addColorStop(0, hexA(c.glow, 0));
    hz.addColorStop(1, hexA(c.glow, 0.22));
    g.fillStyle = hz;
    g.fillRect(0, H * 0.5, W, H * 0.3);
    layers(c, (col, near) => {
      const base = H * (near ? 0.86 : 0.74);
      // a few great leaning shards of black glass, each with one lit facet edge
      for (let x = r() * 60; x < W; x += 70 + r() * 90) {
        const h = near ? 120 + r() * 150 : 150 + r() * 130;
        const w = 22 + r() * 24;
        const lean = (r() - 0.5) * 60;
        const tip: [number, number] = [x + lean, base - h];
        fillPath(g, col, [[x - w, base], tip, [x + w * 0.4, base - h * 0.35], [x + w, base]]);
        if (near) {
          g.strokeStyle = hexA(c.glow, 0.55);
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(tip[0], tip[1]);
          g.lineTo(x + w * 0.4, base - h * 0.35);
          g.lineTo(x + w, base);
          g.stroke();
        }
      }
      ground(g, col, W, H, base, r, 8);
      if (near) {
        g.strokeStyle = hexA(c.glow, 0.8);
        g.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          let x = r() * W;
          let y = base + 6;
          g.beginPath();
          g.moveTo(x, y);
          for (let k = 0; k < 4; k++) g.lineTo((x += (r() - 0.5) * 50), (y += 10 + r() * 12));
          g.stroke();
        }
        lamp(g, c.glow, W / 2, H, W * 0.5, 0.25);
      }
    });
  },
  // a swamp: dead trees, low mist, still water
  necromancer(g, W, H, c, r) {
    layers(c, (col, near) => {
      const base = H * (near ? 0.86 : 0.74);
      for (let i = 0; i < (near ? 3 : 5); i++)
        deadTree(g, col, W * (0.05 + r() * 0.9), base, near ? 170 + r() * 80 : 100 + r() * 50, r);
      ground(g, col, W, H, base, r, 4);
    });
    // mist, then a sheen of still water
    for (let i = 0; i < 4; i++) {
      const y = H * (0.76 + r() * 0.12);
      const gr = g.createLinearGradient(0, y - 18, 0, y + 18);
      gr.addColorStop(0, hexA(c.glow, 0));
      gr.addColorStop(0.5, hexA(c.glow, 0.1));
      gr.addColorStop(1, hexA(c.glow, 0));
      g.fillStyle = gr;
      g.fillRect(0, y - 18, W, 36);
    }
    for (let i = 0; i < 3; i++) lamp(g, c.glow, r() * W, H * (0.5 + r() * 0.25), 8, 0.7);
  },
  // a back alley: a brick wall, a street lamp, bins and bottles
  drunkard(g, W, H, c, r) {
    const wall = H * (0.42 + r() * 0.1);
    g.fillStyle = hexA(c.dark, 0.5);
    g.fillRect(0, wall, W, H);
    g.strokeStyle = hexA(c.dark, 0.8);
    g.lineWidth = 2;
    for (let y = wall + 18, row = 0; y < H; y += 18, row++)
      for (let x = (row % 2) * 24; x < W; x += 48) g.strokeRect(x, y - 18, 48, 18);
    const lx = W * (r() < 0.5 ? 0.12 + r() * 0.1 : 0.78 + r() * 0.1);
    g.fillStyle = hexA(c.dark, 0.95);
    g.fillRect(lx - 4, H * 0.18, 8, H);
    g.fillRect(lx - 18, H * 0.18, 36, 10);
    lamp(g, c.glow, lx, H * 0.22, 90, 0.4);
    ground(g, hexA(c.dark, 0.95), W, H, H * 0.88, r, 4);
    for (let i = 0; i < 4; i++) {
      const x = r() * W;
      const h = 22 + r() * 16;
      fillPath(g, hexA(c.dark, 0.95), [
        [x - 6, H * 0.89],
        [x - 6, H * 0.89 - h * 0.6],
        [x - 2, H * 0.89 - h * 0.75],
        [x - 2, H * 0.89 - h],
        [x + 2, H * 0.89 - h],
        [x + 2, H * 0.89 - h * 0.75],
        [x + 6, H * 0.89 - h * 0.6],
        [x + 6, H * 0.89],
      ]);
    }
  },
};

/** Paint a Riftwalker's backdrop. Returns false (and paints nothing) if there is no scene for that id. */
export function paintScene(
  g: G,
  W: number,
  H: number,
  scene: string | undefined,
  c: SceneColors,
  r: R,
): boolean {
  const paint = scene ? SCENES[scene] : undefined;
  if (!paint) return false;
  g.save();
  paint(g, W, H, c, r);
  g.restore();
  return true;
}
