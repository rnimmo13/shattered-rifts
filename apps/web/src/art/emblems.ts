// Emblems: bold one-colour symbols on a 64x64 grid (filled shapes `f` and stroked lines `s`). They are the character icons
// (each Riftwalker has its own), and they are painted big into card art so a card shows WHAT it is about (a bottle, a
// window pane, a rune, a bell...) and not only what it does. Pure data plus two painters: SVG text for the DOM, a Path2D for canvas.

export interface Emblem {
  /** filled paths (even-odd, so a hole is just a second shape) */
  f: string[];
  /** stroked paths (round caps), drawn 4 wide */
  s?: string[];
}

const ngon = (cx: number, cy: number, r: number, n: number, rot = -Math.PI / 2): string =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    return `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ') + 'Z';

const star = (cx: number, cy: number, ro: number, ri: number, n: number): string =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 ? ri : ro;
    return `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ') + 'Z';

const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const rays = (cx: number, cy: number, r1: number, r2: number, n: number): string =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n;
    const w = Math.PI / n / 2.4;
    const p = (r: number, d: number): string =>
      `${(cx + r * Math.cos(a + d)).toFixed(1)} ${(cy + r * Math.sin(a + d)).toFixed(1)}`;
    return `M${p(r1, -w)}L${p(r2, 0)}L${p(r1, w)}Z`;
  }).join('');

/** A gear: teeth around a body with a hole. */
const gear = (cx: number, cy: number, r: number, teeth: number, hole: number): string => {
  let d = '';
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i * Math.PI) / teeth;
    const a1 = ((i + 1) * Math.PI) / teeth;
    const rr = i % 2 ? r * 0.78 : r;
    const pt = (a: number, q: number): string =>
      `${(cx + q * Math.cos(a)).toFixed(1)} ${(cy + q * Math.sin(a)).toFixed(1)}`;
    d += `${i ? 'L' : 'M'}${pt(a0 + 0.06, rr)}L${pt(a1 - 0.06, rr)}`;
  }
  return d + 'Z' + circle(cx, cy, hole);
};

export const EMBLEMS: Record<string, Emblem> = {
  // ---- the ten Riftwalkers ----
  // Maren: a shield with a dawn on it
  sunshield: {
    f: [
      'M32 4L56 12V32C56 46 46 57 32 61C18 57 8 46 8 32V12Z',
      circle(32, 30, 8) + rays(32, 30, 11, 19, 8),
    ],
  },
  // Rivet: a gear with a bolt
  cog: { f: [gear(32, 32, 28, 8, 0) + circle(32, 32, 10), ngon(32, 32, 5, 6)] },
  // Kesh the hunter: a bow, drawn, with an arrow
  bow: {
    f: ['M44 6L60 4L56 20L52 14L36 30L33 27L49 11Z', 'M10 50L14 54L6 58Z'],
    s: ['M14 8C-2 28 -2 40 14 58', 'M14 8L14 58', 'M14 32L50 14'],
  },
  // Vesper: a domino mask caught in a web
  mask: {
    f: [
      'M6 24C16 16 24 20 32 24C40 20 48 16 58 24C58 40 48 48 40 44C36 42 34 38 32 38C30 38 28 42 24 44C16 48 6 40 6 24Z' +
        circle(21, 30, 4.5) +
        circle(43, 30, 4.5),
    ],
    s: ['M32 4L32 14', 'M32 50L32 60', 'M10 56L20 46', 'M54 56L44 46'],
  },
  // Quill: a fan of three knives
  daggers: {
    f: [
      'M32 4L38 34L32 38L26 34Z',
      'M10 14L26 36L21 41L8 24Z',
      'M54 14L38 36L43 41L56 24Z',
      'M27 40H37V44H27Z',
      'M29 44H35V60H29Z',
    ],
  },
  // Ilvane: a rune ring around a glyph
  runering: {
    f: [
      circle(32, 32, 28) + circle(32, 32, 24),
      'M30 14H34V50H30Z',
      'M18 22L34 34L30 38L14 26Z',
      'M46 22L50 26L34 38L30 34Z',
    ],
  },
  // Sehra: a closed fist, wrapped
  fist: {
    f: [
      'M14 28C14 20 20 18 24 20C26 14 34 14 36 18C40 16 46 18 46 24C52 24 54 30 52 36L50 46C48 54 40 58 32 58C22 58 14 52 14 42Z',
    ],
    s: ['M20 40H46', 'M20 46H46', 'M24 30V36', 'M32 28V36', 'M40 28V36'],
  },
  // Astra: an eight-point star with a bright core
  star8: { f: [star(32, 32, 30, 10, 8), circle(32, 32, 6)] },
  // Mire: a skull with a lantern flame in the brow
  skull: {
    f: [
      'M10 28C10 14 20 6 32 6C44 6 54 14 54 28C54 36 50 40 46 42V52H38V46H34V52H30V46H26V52H18V42C14 40 10 36 10 28Z' +
        circle(22, 30, 6) +
        circle(42, 30, 6) +
        'M32 36L28 44H36Z',
    ],
  },
  // KP: a bottle with a window pane
  bottlepane: {
    f: [
      'M10 4H22V14C26 18 28 22 28 28V58H4V28C4 22 6 18 10 14Z' + 'M8 34H24V50H8Z',
      'M34 12H60V58H34Z' +
        'M37 15H46V34H37Z' +
        'M49 15H57V34H49Z' +
        'M37 37H46V55H37Z' +
        'M49 37H57V55H49Z',
    ],
  },

  // ---- things a card can be about ----
  sword: { f: ['M32 2L38 38H26Z', 'M18 38H46V43H18Z', 'M29 43H35V56H29Z', 'M26 56H38V61H26Z'] },
  shield: { f: ['M32 4L56 12V32C56 46 46 57 32 61C18 57 8 46 8 32V12Z'] },
  flame: {
    f: [
      'M34 2C36 14 52 22 52 40C52 52 44 60 32 60C20 60 12 52 12 40C12 32 16 28 20 24C20 32 24 34 26 34C24 22 30 10 34 2Z',
    ],
  },
  heart: {
    f: [
      'M32 58C10 42 6 30 6 21C6 12 13 7 20 7C26 7 30 11 32 15C34 11 38 7 44 7C51 7 58 12 58 21C58 30 54 42 32 58Z',
    ],
  },
  eye: {
    f: [
      'M2 32C12 16 22 10 32 10C42 10 52 16 62 32C52 48 42 54 32 54C22 54 12 48 2 32Z' +
        circle(32, 32, 11),
    ],
    s: [],
  },
  bolt: { f: ['M38 2L12 36H28L22 62L52 24H34Z'] },
  moon: {
    f: [
      'M44 6C26 8 14 22 14 36C14 50 26 60 40 60C46 60 52 58 56 54C40 54 28 44 28 32C28 20 34 10 44 6Z',
    ],
  },
  coin: {
    f: [
      circle(32, 32, 28) + circle(32, 32, 22),
      'M28 18H36V24H42V30H36V34H42V40H36V46H28V40H22V34H28V30H22V24H28Z',
    ],
  },
  hourglass: {
    f: [
      'M12 4H52V10C52 20 40 28 36 32C40 36 52 44 52 54V60H12V54C12 44 24 36 28 32C24 28 12 20 12 10Z',
    ],
  },
  claw: {
    s: ['M12 6C18 24 20 40 14 58', 'M28 4C36 22 38 40 32 60', 'M44 6C52 24 54 40 48 58'],
    f: [],
  },
  bone: {
    f: [
      'M10 8C4 8 4 18 12 18L20 26L42 48L48 54C48 60 60 60 60 52C60 48 56 46 52 46L46 40L24 18L16 12C16 8 14 8 10 8Z',
    ],
  },
  bell: {
    f: [
      'M32 4C36 4 38 6 38 9C48 12 52 22 52 32V42L58 50V54H6V50L12 42V32C12 22 16 12 26 9C26 6 28 4 32 4Z',
      circle(32, 58, 5),
    ],
  },
  web: {
    f: [],
    s: [
      'M32 4V60',
      'M4 32H60',
      'M10 10L54 54',
      'M54 10L10 54',
      'M32 14L50 32L32 50L14 32Z',
      'M32 23L41 32L32 41L23 32Z',
    ],
  },
  thorn: { f: ['M32 2L40 28L62 32L40 36L32 62L24 36L2 32L24 28Z'], s: [] },
  hammer: { f: ['M10 6H46V26H10Z', 'M46 12H58V20H46Z', 'M26 26H34V60H26Z'] },
  shell: { f: ['M18 4H46V50H18Z' + 'M22 8H42V30H22Z', 'M18 50H46V60H18Z'] },
  pane: {
    f: [
      'M8 4H56V60H8Z' +
        'M13 9H29V30H13Z' +
        'M35 9H51V30H35Z' +
        'M13 35H29V55H13Z' +
        'M35 35H51V55H35Z',
    ],
  },
  bottle: { f: ['M24 2H40V14C46 18 50 24 50 32V60H14V32C14 24 18 18 24 14Z' + 'M20 38H44V52H20Z'] },
  book: {
    f: ['M6 8C16 6 26 8 32 14C38 8 48 6 58 8V54C48 52 38 54 32 60C26 54 16 52 6 54Z' + 'M32 18V54'],
  },
  wave: {
    f: [],
    s: [
      'M2 20C10 10 18 10 24 20C30 30 38 30 44 20C50 10 58 10 62 14',
      'M2 36C10 26 18 26 24 36C30 46 38 46 44 36C50 26 58 26 62 30',
      'M2 52C10 42 18 42 24 52C30 62 38 62 44 52',
    ],
  },
  key: { f: [circle(20, 20, 14) + circle(20, 20, 7), 'M28 30L58 60H46V52H40V46H34V40L28 34Z'] },
  rune: { f: ['M28 4H36V60H28Z', 'M10 14L36 36L30 42L6 20Z', 'M54 14L58 20L34 42L28 36Z'] },
  crown: { f: ['M6 50V16L20 30L32 8L44 30L58 16V50Z', 'M6 54H58V60H6Z'] },
  anvil: { f: ['M4 10H52C52 18 44 22 36 24V34H46V46H54V56H10V46H18V34H26V24C20 22 10 20 4 10Z'] },
};

/** SVG markup for an emblem in one colour. */
export function emblemSvg(name: string, color: string): string {
  const e = EMBLEMS[name] ?? EMBLEMS['shield']!;
  const fills = e.f.map((d) => `<path d="${d}" fill-rule="evenodd"/>`).join('');
  const strokes = (e.s ?? [])
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('');
  return `<g fill="${color}">${fills}</g>${strokes}`;
}

type G = CanvasRenderingContext2D;

/** Paint an emblem onto a canvas, centred, `size` px square. */
export function paintEmblem(
  g: G,
  name: string,
  cx: number,
  cy: number,
  size: number,
  color: string,
): void {
  const e = EMBLEMS[name] ?? EMBLEMS['shield']!;
  g.save();
  g.translate(cx - size / 2, cy - size / 2);
  g.scale(size / 64, size / 64);
  g.fillStyle = color;
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const d of e.f) g.fill(new Path2D(d), 'evenodd');
  for (const d of e.s ?? []) g.stroke(new Path2D(d));
  g.restore();
}

/** Which emblem each Riftwalker wears. */
export const HERO_EMBLEM: Record<string, string> = {
  maren: 'sunshield',
  rivet: 'cog',
  kesh: 'bow',
  vesper: 'mask',
  quill: 'daggers',
  ilvane: 'runering',
  sehra: 'fist',
  astra: 'star8',
  mire: 'skull',
  kp: 'bottlepane',
};

export const HERO_COLOR: Record<string, string> = {
  maren: '#f3d58a',
  rivet: '#6fe6ff',
  kesh: '#ff8a6a',
  vesper: '#b99aff',
  quill: '#f08acb',
  ilvane: '#4fb8ff',
  sehra: '#ffb060',
  astra: '#ffe9a0',
  mire: '#9be86a',
  kp: '#ff9a3c',
};
