// Small drawn pictures for buffs, debuffs, Boons and the map's pens (DECISIONS #505). Each one is a single bold object with a dark ink
// outline and flat shading, so it still reads at chip size: a drop of blood for Bleed, a flame for Burn. All on a 48 x 48 grid.
// Icons are data: GameIcon.tsx draws them. Original drawings only.

import type { StatusId } from '@sr/combat';

/** One shape: its colour, its path, a line width if it is a line and not a filled shape, and a transform for a shape reused smaller. */
export interface IconPart {
  f: string;
  d: string;
  w?: number;
  t?: string;
}
/** `base` shapes get the shared ink outline; `top` shapes are shading and detail on top of them. */
export interface IconArt {
  base: readonly IconPart[];
  top: readonly IconPart[];
}

export const ICON_INK = '#120b16';

const C = {
  blood: '#d3202f',
  bloodHi: '#ff7a78',
  bloodLo: '#86101f',
  fire: '#f0641e',
  fireHi: '#ffd24a',
  fireLo: '#a82f12',
  gold: '#e8b93c',
  goldHi: '#fff0a8',
  goldLo: '#9a6c17',
  steel: '#a9b7c8',
  steelHi: '#eaf2fb',
  steelLo: '#62718a',
  bone: '#ece2c6',
  boneLo: '#a89a78',
  dark: '#241a2c',
  wood: '#8a5a30',
  woodLo: '#5a3618',
  leaf: '#54b34a',
  leafHi: '#b2ec74',
  leafLo: '#266b2f',
  sky: '#46c4f0',
  skyHi: '#d4f6ff',
  skyLo: '#1d6fa8',
  violet: '#9356f0',
  violetHi: '#dcc0ff',
  violetLo: '#4d2596',
  rose: '#ea5a92',
  obsidian: '#352a4e',
  obsidianHi: '#8e7cc8',
  white: '#fbf8ef',
  rope: '#c49a5a',
  ropeLo: '#7d5c2c',
} as const;

const p = (f: string, d: string, w?: number): IconPart => (w === undefined ? { f, d } : { f, d, w });
const art = (base: readonly IconPart[], top: readonly IconPart[] = []): IconArt => ({ base, top });
const ring = (x: number, y: number, r: number): string =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
/** The same shapes smaller, moved and turned. */
const at = (parts: readonly IconPart[], s: number, x: number, y: number, turn = 0): IconPart[] =>
  parts.map((q) => ({
    ...q,
    t: `translate(${x} ${y}) rotate(${turn} 24 24) scale(${s})${q.t ? ` ${q.t}` : ''}`,
  }));
const mix = (...arts: readonly IconArt[]): IconArt => ({
  base: arts.flatMap((a) => a.base),
  top: arts.flatMap((a) => a.top),
});
const place = (a: IconArt, s: number, x: number, y: number, turn = 0): IconArt => ({
  base: at(a.base, s, x, y, turn),
  top: at(a.top, s, x, y, turn),
});

// ---- the shapes the icons are built from ----

const DROP = 'M24 4C24 4 39 21 39 31A15 15 0 0 1 9 31C9 21 24 4 24 4Z';
const FLAME =
  'M25 2C27 12 40 17 40 31C40 40 33 46 24 46C15 46 8 40 8 31C8 23 13 19 15 11C19 14 20 18 20 22C23 17 26 11 25 2Z';
const SHIELD = 'M24 3L42 9V24C42 34 34 41 24 46C14 41 6 34 6 24V9Z';
const SHIELD_R = 'M24 3L42 9V24C42 34 34 41 24 46Z';
const HEART = 'M24 44C10 33 4 25 4 16C4 9 10 5 15 5C19 5 22 7 24 11C26 7 29 5 33 5C38 5 44 9 44 16C44 25 38 33 24 44Z';
const HEART_R = 'M24 11C26 7 29 5 33 5C38 5 44 9 44 16C44 25 38 33 24 44Z';
const CARD = 'M13 4H35A4 4 0 0 1 39 8V40A4 4 0 0 1 35 44H13A4 4 0 0 1 9 40V8A4 4 0 0 1 13 4Z';

const drop = (a: string, hi: string, lo: string): IconArt =>
  art(
    [p(a, DROP)],
    [p(lo, 'M24 4C24 4 39 21 39 31A15 15 0 0 1 24 46C33 40 32 22 24 4Z'), p(hi, 'M16 29C14 33 16 38 20 40', 3.5)],
  );
const flame = (a: string, hi: string, lo: string): IconArt =>
  art(
    [p(a, FLAME)],
    [
      p(lo, 'M25 2C27 12 40 17 40 31C40 40 33 46 24 46C32 40 36 24 25 2Z'),
      p(hi, 'M24 22C26 28 32 30 32 37C32 42 28 46 24 46C20 46 16 42 16 37C16 31 22 29 24 22Z'),
    ],
  );
const shield = (a: string, lo: string, hi: string): IconArt =>
  art([p(a, SHIELD)], [p(lo, SHIELD_R), p(hi, 'M11 12V24C11 30 15 35 20 38', 2.5)]);
const heart = (a: string, lo: string, hi: string): IconArt =>
  art([p(a, HEART)], [p(lo, HEART_R), p(hi, 'M10 17C10 13 12 11 15 11', 3.5)]);
const sword = (a: string, lo: string): IconArt =>
  art(
    [
      p(a, 'M24 1L30 9V31H18V9Z'),
      p(C.gold, 'M9 30H39V36H9Z'),
      p(C.wood, 'M20.5 36H27.5V43H20.5Z'),
      p(C.gold, ring(24, 44, 3)),
    ],
    [p(lo, 'M24 1L30 9V31H24Z'), p(C.goldLo, 'M24 30H39V36H24Z')],
  );
const STEEL_SWORD = sword(C.steelHi, C.steel);
const OBSIDIAN_SWORD = sword(C.obsidianHi, C.obsidian);
const dagger = (a: string, lo: string): IconArt =>
  art(
    [p(a, 'M24 3L31 24V30H17V24Z'), p(C.gold, 'M12 29H36V34H12Z'), p(C.woodLo, 'M21 34H27V44H21Z')],
    [p(lo, 'M24 3L31 24V30H24Z')],
  );
const STEEL_DAGGER = dagger(C.steelHi, C.steel);
const card = (a: string, lo: string): IconArt =>
  art(
    [p(a, CARD)],
    [p(lo, 'M24 4H35A4 4 0 0 1 39 8V40A4 4 0 0 1 35 44H24Z'), p(C.gold, 'M14 9H34V39H14Z M16 11V37H32V11Z')],
  );
/** A card with a zero on it: "your next one of these costs nothing". */
const freeCard = (a: string, lo: string): IconArt =>
  mix(card(a, lo), art([], [p(C.white, 'M24 15C19 15 18 20 18 24C18 28 19 33 24 33C29 33 30 28 30 24C30 20 29 15 24 15Z M24 19C22.5 19 22 21.5 22 24C22 26.5 22.5 29 24 29C25.5 29 26 26.5 26 24C26 21.5 25.5 19 24 19Z')]));
const SPARK = 'M24 2L29 19L46 24L29 29L24 46L19 29L2 24L19 19Z';
const spark = (a: string): IconArt => art([p(a, SPARK)]);
const BOLT = 'M29 2L9 27H21L16 46L39 18H26Z';
const bolt = (a: string, lo: string): IconArt => art([p(a, BOLT)], [p(lo, 'M26 18H39L16 46L21 27Z')]);
const DOWN: IconArt = art([p(C.bloodHi, 'M24 42L42 22H32V6H16V22H6Z')], [p(C.blood, 'M24 42L42 22H32V6H24Z')]);
const down = (s = 0.42): IconArt => place(DOWN, s, 27, 26);

const FIST = art(
  [
    p(
      '#e8ad78',
      'M9 21C9 16 13 14 16 15C17 10 22 9 25 12C27 9 32 10 33 14C37 12 41 15 40 20V30C40 39 33 45 24 45C15 45 9 39 9 30Z',
    ),
  ],
  [
    p('#b87745', 'M33 14C37 12 41 15 40 20V30C40 39 33 45 24 45C32 40 34 28 33 14Z'),
    p('#7d4a26', 'M16 15V24 M25 12V24 M33 14V24', 2.5),
    p('#7d4a26', 'M13 28H28C32 28 32 34 28 34H19', 2.5),
  ],
);
const SKULL = (a: string, lo: string, eye: string): IconArt =>
  art(
    [p(a, 'M24 3C12 3 6 11 6 20C6 27 9 30 13 32V43H35V32C39 30 42 27 42 20C42 11 36 3 24 3Z')],
    [
      p(lo, 'M24 3C36 3 42 11 42 20C42 27 39 30 35 32V43H24Z'),
      p(eye, ring(16, 21, 5)),
      p(eye, ring(32, 21, 5)),
      p(eye, 'M24 26L27 32H21Z'),
      p(eye, 'M19 36V43 M24 36V43 M29 36V43', 2.2),
    ],
  );
const OWL = art(
  [p('#8d7bb0', 'M9 7L17 12C21 10 27 10 31 12L39 7V30C39 39 32 45 24 45C16 45 9 39 9 30Z')],
  [
    p('#5e4c82', 'M31 12L39 7V30C39 39 32 45 24 45C31 38 33 24 31 12Z'),
    p(C.goldHi, ring(17, 21, 6.5)),
    p(C.goldHi, ring(31, 21, 6.5)),
    p(C.dark, ring(17, 21, 3)),
    p(C.dark, ring(31, 21, 3)),
    p(C.gold, 'M24 24L28 29L24 33L20 29Z'),
  ],
);
const MOON = art(
  [p(C.goldHi, 'M31 3A21 21 0 1 0 45 33A17 17 0 0 1 31 3Z')],
  [p(C.gold, 'M45 33A21 21 0 0 1 8 33C22 42 38 40 45 33Z')],
);
const OPEN_HAND = art([
  p(
    '#e8ad78',
    'M13 26V12C13 8 18 8 18 12V8C18 4 23 4 23 8V7C23 3 28 3 28 7V10C28 7 33 7 33 11V26L37 21C40 18 44 22 41 25L32 41C31 44 27 45 24 45H21C15 45 13 41 13 35Z',
  ),
]);
const CHEVRONS = (a: string, lo: string): IconArt =>
  art([p(a, 'M6 7H42L24 24Z'), p(a, 'M6 24H42L24 41Z')], [p(lo, 'M24 7H42L24 24Z'), p(lo, 'M24 24H42L24 41Z')]);
const BONE = art(
  [
    p(
      C.bone,
      'M9 15C5 13 7 6 12 7C13 3 20 4 20 9L39 28C43 26 48 31 44 35C47 40 40 44 37 39C33 42 28 38 30 34Z',
    ),
  ],
  [p(C.boneLo, 'M20 9L39 28C43 26 48 31 44 35L40 37C37 30 26 18 15 13C17 12 18 10 20 9Z')],
);
const BOTTLE = (liquid: string, lo: string): IconArt =>
  art(
    [
      p(C.woodLo, 'M19 2H29V9H19Z'),
      p(C.skyHi, 'M19 9H29V16C36 19 41 25 41 32C41 40 33 45 24 45C15 45 7 40 7 32C7 25 12 19 19 16Z'),
    ],
    [
      p(liquid, 'M8 29C14 25 20 33 26 29C31 26 36 26 40.5 29C41.5 38 33 44 24 44C15 44 7 38 8 29Z'),
      p(lo, 'M24 44C33 44 41.5 38 40.5 29C37 27 33 26.5 29.5 27.5C33 34 31 40 24 44Z'),
      p(C.white, 'M14 22C12 24 11 25 11 27', 2.5),
    ],
  );

// ---- buffs and debuffs ----

export const STATUS_ICONS: Record<StatusId, IconArt> = {
  // (a shield in two halves: nothing left to stop the blow)
  exposed: art(
    [p(C.steel, 'M21 3L6 9V24C6 32 11 38 19 43L24 28L17 20Z'), p(C.steelLo, 'M27 3L42 9V24C42 34 34 41 26 46L30 28L24 20Z')],
    [p(C.bloodHi, 'M21 3L17 20L24 28L19 43', 2), p(C.steelHi, 'M10 12V23', 2.5)],
  ),
  // (a sword snapped halfway, the tip falling away)
  faltering: art(
    [
      p(C.steelHi, 'M18 22H30V31H18Z'),
      p(C.gold, 'M9 30H39V36H9Z'),
      p(C.wood, 'M20.5 36H27.5V44H20.5Z'),
      p(C.steel, 'M33 3L41 7L35 18L27 14Z'),
    ],
    [p(C.steel, 'M24 22H30V31H24Z'), p(C.goldLo, 'M24 30H39V36H24Z')],
  ),
  might: FIST,
  burn: flame(C.fire, C.fireHi, C.fireLo),
  seared: drop(C.blood, C.bloodHi, C.bloodLo),
  stunned: mix(bolt(C.fireHi, C.gold), place(spark(C.white), 0.3, 32, 2), place(spark(C.white), 0.24, 3, 32)),
  thorns: art(
    [
      p(C.leaf, 'M5 43C14 34 18 28 24 22S34 12 43 5', 6),
      p(C.leafLo, 'M11 34L2 28L16 29Z'),
      p(C.leafLo, 'M20 25L14 13L27 19Z'),
      p(C.leafLo, 'M29 16L29 3L37 12Z'),
      p(C.leafLo, 'M21 33L33 37L27 25Z'),
      p(C.leafLo, 'M33 22L45 22L37 13Z'),
    ],
    [p(C.leafHi, 'M8 38C16 31 20 25 27 19', 2)],
  ),
  // (a bright bubble: the next hit slides off)
  shielded: art(
    [p(C.sky, ring(24, 24, 21))],
    [
      p(C.skyLo, 'M45 24A21 21 0 0 1 8 37C22 42 38 36 45 24Z'),
      p(C.skyHi, 'M12 21C13 15 17 11 23 10', 4),
      p(C.white, ring(32, 12, 2.5)),
    ],
  ),
  resonance: art(
    [
      p(C.wood, 'M15 4H33V44H15Z'),
      p(C.woodLo, 'M7 16H15V24H7Z'),
      p(C.woodLo, 'M33 16H41V24H33Z'),
    ],
    [
      p(C.woodLo, 'M24 4H33V44H24Z'),
      p(C.goldHi, ring(20, 12, 2.2)),
      p(C.goldHi, ring(28, 12, 2.2)),
      p(C.dark, 'M15 22H33 M15 33H33', 2),
    ],
  ),
  // (a lotus on still water)
  calm: art(
    [
      p(C.sky, 'M24 4C33 14 33 26 24 36C15 26 15 14 24 4Z'),
      p(C.skyLo, 'M5 17C15 17 22 25 24 36C13 36 6 28 5 17Z'),
      p(C.skyLo, 'M43 17C33 17 26 25 24 36C35 36 42 28 43 17Z'),
      p(C.sky, 'M6 40H42V45H6Z'),
    ],
    [p(C.skyHi, 'M24 10C21 16 21 22 24 28', 3)],
  ),
  // (a burst with furious eyes)
  wrath: art(
    [p(C.blood, 'M24 1L29 10L39 5L38 16L47 19L40 26L46 35L35 35L33 46L24 39L15 46L13 35L2 35L8 26L1 19L10 16L9 5L19 10Z')],
    [
      p(C.bloodLo, 'M24 39L33 46L35 35L46 35L40 26L47 19L38 16C39 26 32 35 24 39Z'),
      p(C.fireHi, 'M12 18L22 24L14 27Z'),
      p(C.fireHi, 'M36 18L26 24L34 27Z'),
      p(C.dark, 'M18 33C21 30 27 30 30 33', 3),
    ],
  ),
  radiant: art(
    [
      p(C.fireHi, 'M24 1L28 12H20Z M24 47L20 36H28Z M1 24L12 20V28Z M47 24L36 28V20Z M8 8L18 13L13 18Z M40 40L30 35L35 30Z M40 8L35 18L30 13Z M8 40L13 30L18 35Z'),
      p(C.gold, ring(24, 24, 12)),
    ],
    [p(C.goldHi, ring(21, 21, 6))],
  ),
  // (prayer beads)
  mantra: art(
    [
      p(C.gold, ring(24, 7, 5.5)),
      p(C.gold, ring(36, 12, 5.5)),
      p(C.gold, ring(41, 24, 5.5)),
      p(C.gold, ring(36, 36, 5.5)),
      p(C.gold, ring(12, 36, 5.5)),
      p(C.gold, ring(7, 24, 5.5)),
      p(C.gold, ring(12, 12, 5.5)),
      p(C.blood, 'M24 33L30 45H18Z'),
    ],
    [p(C.goldHi, ring(22.5, 5.5, 1.8)), p(C.goldHi, ring(5.5, 22.5, 1.8)), p(C.goldHi, ring(34.5, 10.5, 1.8))],
  ),
  bracing: mix(shield(C.sky, C.skyLo, C.skyHi), art([], [p(C.white, 'M21 13H27V20H34V26H27V33H21V26H14V20H21Z')])),
  // (a shield of cracked ice)
  brittle: art(
    [p(C.skyHi, SHIELD)],
    [p(C.sky, SHIELD_R), p(C.skyLo, 'M24 3L19 15L28 22L20 31L25 46 M28 22L38 17 M19 15L9 13 M20 31L11 29', 2.2)],
  ),
  ghostly: art(
    [p(C.skyHi, 'M24 3C14 3 8 11 8 20V45L14 39L19 45L24 39L29 45L34 39L40 45V20C40 11 34 3 24 3Z')],
    [
      p('#9fc7da', 'M24 3C34 3 40 11 40 20V45L34 39L29 45L28 40C33 30 33 12 24 3Z'),
      p(C.dark, ring(17, 20, 3.5)),
      p(C.dark, ring(30, 20, 3.5)),
      p(C.dark, ring(23.5, 30, 2.5)),
    ],
  ),
  // (a closed helm: nothing gets in)
  steadfast: art(
    [p(C.steel, 'M24 3C13 3 8 12 8 22V40L17 45H31L40 40V22C40 12 35 3 24 3Z')],
    [
      p(C.steelLo, 'M24 3C35 3 40 12 40 22V40L31 45H24Z'),
      p(C.dark, 'M12 22H36V27H26V40H22V27H12Z'),
      p(C.steelHi, 'M13 16C14 12 16 10 19 8', 2.5),
    ],
  ),
  // (a breastplate)
  armored: art(
    [p(C.steel, 'M9 6L17 4C19 8 29 8 31 4L39 6L44 15L38 19V38C33 44 15 44 10 38V19L4 15Z')],
    [p(C.steelLo, 'M24 7C27 7 30 6 31 4L39 6L44 15L38 19V38C35 41 30 43 24 43Z'), p(C.steelHi, 'M24 12V40', 2), p(C.gold, 'M18 17H30V21H18Z')],
  ),
  // (a metronome keeping time)
  ritual: art(
    [p(C.wood, 'M18 3H30L39 45H9Z')],
    [
      p(C.woodLo, 'M24 3H30L39 45H24Z'),
      p(C.bone, 'M19 11H29L32 36H16Z'),
      p(C.dark, 'M24 34L32 12', 2.5),
      p(C.gold, 'M26 19H33V25H26Z'),
    ],
  ),
  // (cracked black glass, lit from inside)
  fracture: art(
    [p(C.obsidian, 'M22 2L38 12L44 31L27 46L8 37L5 15Z')],
    [
      p('#211832', 'M38 12L44 31L27 46L25 24Z'),
      p(C.violetHi, 'M22 2L25 24L8 37 M25 24L44 31 M25 24L27 46 M15 30L10 16', 2.2),
    ],
  ),
  keen: mix(STEEL_SWORD, place(spark(C.white), 0.4, 26, -1)),
  // (a molten stone falling, its trail behind it)
  ruinous: art(
    [p(C.fire, 'M46 2L34 21L38 26A12 12 0 0 1 22 42C16 42 11 37 11 30C11 24 17 19 21 17L25 19Z'), p(C.dark, ring(16, 33, 13))],
    [p(C.obsidian, ring(16, 33, 9)), p(C.fireHi, 'M9 33L15 30L18 35L24 31', 2.2)],
  ),
  // (an arrow nocked and drawn)
  vigor: art(
    [p(C.wood, 'M13 3C33 9 33 39 13 45', 5), p(C.bone, 'M13 3L28 24L13 45', 1.8), p(C.steel, 'M28 24H6', 3.5), p(C.steelHi, 'M46 24L36 19V29Z'), p(C.steel, 'M6 24H38', 3.5)],
    [p(C.leafHi, 'M4 20L9 24L4 28', 2)],
  ),
  // (two blades crossed: the next Attack lands twice)
  twinned: mix(place(STEEL_SWORD, 0.86, 3, 3, -35), place(STEEL_SWORD, 0.86, 3, 3, 35)),
  // (a card and its reflection)
  mirrored: mix(place(card(C.leaf, C.leafLo), 0.72, -3, 7), place(card(C.skyHi, C.sky), 0.72, 16, 7)),
  marrow: BONE,
  // (a scythe)
  reaping: art(
    [p(C.wood, 'M31 10L15 46', 4.5), p(C.violetHi, 'M31 8C21 1 8 5 3 16C12 10 22 11 28 16Z')],
    [p(C.violet, 'M28 16C22 11 12 10 3 16C12 13 22 13 27 19Z')],
  ),
  debilitated: CHEVRONS(C.violet, C.violetLo),
  lethality: mix(dagger(C.bloodHi, C.blood), place(drop(C.blood, C.bloodHi, C.bloodLo), 0.28, 30, 0)),
  noose: art(
    [
      p(C.rope, 'M24 2V19', 5),
      p(C.rope, ring(24, 32, 11) + ring(24, 32, 6.5)),
      p(C.ropeLo, 'M18 16H30V24H18Z'),
    ],
    [p(C.bone, 'M20 16.5V24 M24 16.5V24 M28 16.5V24', 1.6)],
  ),
  // (the crosshair on it)
  quarry: art(
    [p(C.blood, ring(24, 24, 17) + ring(24, 24, 11)), p(C.blood, 'M21 2H27V15H21Z M21 33H27V46H21Z M2 21H15V27H2Z M33 21H46V27H33Z')],
    [p(C.bloodHi, ring(24, 24, 3.5))],
  ),
  freeethereal: mix(freeCard('#9fc7da', '#74a1b8')),
  // (a broken chain)
  unbound: art(
    [
      p(C.steel, 'M4 17L14 7C18 3 23 3 26 7L28 9L23 14L21 12C20 11 19 11 18 12L9 21C8 22 8 23 9 24L11 26L6 31L4 29C0 26 0 21 4 17Z'),
      p(C.steel, 'M44 31L34 41C30 45 25 45 22 41L20 39L25 34L27 36C28 37 29 37 30 36L39 27C40 26 40 25 39 24L37 22L42 17L44 19C48 22 48 27 44 31Z'),
    ],
    [p(C.steelHi, 'M7 18L16 9', 2), p(C.fireHi, 'M30 11L33 4 M36 14L43 11 M18 37L15 44 M12 34L5 37', 2.5)],
  ),
  // (a tower)
  fortified: art(
    [p(C.steel, 'M8 4H15V10H20V4H28V10H33V4H40V18L35 22V45H13V22L8 18Z')],
    [
      p(C.steelLo, 'M24 4H28V10H33V4H40V18L35 22V45H24Z'),
      p(C.dark, 'M19 45V34C19 27 29 27 29 34V45Z'),
      p(C.dark, 'M22 15H26V22H22Z'),
    ],
  ),
  // (overlapping plates)
  plating: art(
    [
      p(C.steelLo, 'M6 30L24 22L42 30V37L24 45L6 37Z'),
      p(C.steel, 'M6 19L24 11L42 19V26L24 34L6 26Z'),
      p(C.steelHi, 'M6 9L24 2L42 9V15L24 23L6 15Z'),
    ],
    [p(C.steel, 'M24 2L42 9V15L24 23Z')],
  ),
  // (a twist of genes)
  clutch: art(
    [p(C.blood, 'M14 3C14 17 34 17 34 31C34 37 28 42 14 45', 5.5), p(C.sky, 'M34 3C34 17 14 17 14 31C14 37 20 42 34 45', 5.5)],
    [p(C.white, 'M17 9H31 M17 39H31', 2.5)],
  ),
  hangover: art(
    [
      p(C.wood, 'M9 15H33V45H9Z'),
      p(C.wood, 'M33 21H42V37H33Z M36 25V33H39V25Z'),
      p(C.white, 'M8 15C5 11 8 6 12 7C14 2 21 2 23 6C27 3 34 6 33 11C36 12 35 17 33 16V19C31 21 29 19 29 16H9Z'),
    ],
    [p(C.woodLo, 'M21 19H33V45H21Z'), p(C.goldLo, 'M9 25H33V29H9Z'), p(C.goldLo, 'M9 37H33V41H9Z')],
  ),
  // (an open hand, cards held)
  holdfast: mix(place(card(C.steel, C.steelLo), 0.72, 7, -3), place(OPEN_HAND, 0.74, 5, 13)),
  edge: mix(STEEL_DAGGER, art([], [p(C.white, 'M23 8L21 24', 2)])),
  sapped: mix(place(FIST, 0.84, -3, 0), down()),
  // (a fanged grin)
  cruelty: art(
    [p(C.dark, 'M3 14C14 21 34 21 45 14C44 32 34 42 24 42C14 42 4 32 3 14Z')],
    [
      p(C.white, 'M8 18L15 20L12 28Z M18 21L24 22L21 31Z M24 22L31 21L27 31Z M33 20L40 18L36 28Z'),
      p(C.blood, 'M13 34C19 39 29 39 35 34C31 37 17 37 13 34Z'),
      p(C.blood, 'M18 37V41', 2),
    ],
  ),
  // (an anvil)
  sturdy: art(
    [p(C.steelLo, 'M3 10H38C45 10 45 19 39 21L32 24V31L38 41H10L16 31V24C9 24 3 18 3 10Z')],
    [p('#3e4a5f', 'M24 10H38C45 10 45 19 39 21L32 24V31L38 41H24Z'), p(C.steelHi, 'M7 13H36', 2.5)],
  ),
  // (a mountain)
  unmovable: art(
    [p(C.steelLo, 'M2 44L18 11L25 22L31 7L46 44Z')],
    [p('#3e4a5f', 'M31 7L46 44H27L28 26Z'), p(C.white, 'M31 7L36 19L31 16L27 19Z'), p(C.white, 'M18 11L23 21L18 19L14 20Z')],
  ),
  freeattack: freeCard(C.blood, C.bloodLo),
  // (three drops running)
  virulent: mix(place(drop(C.blood, C.bloodHi, C.bloodLo), 0.62, 9, -2), place(drop(C.blood, C.bloodHi, C.bloodLo), 0.5, -1, 22), place(drop(C.bloodLo, C.bloodHi, '#5a0a14'), 0.5, 23, 22)),
  honed: mix(STEEL_DAGGER, place(spark(C.white), 0.38, 26, -2)),
  // (three daggers spread like a hand of cards)
  fanned: mix(place(STEEL_DAGGER, 0.8, 1, 8, -32), place(STEEL_DAGGER, 0.8, 7.4, 13.6, 32), place(STEEL_DAGGER, 0.8, 5, 6)),
  // (a paw print on the trail)
  tracking: art(
    [
      p(C.woodLo, 'M24 22C32 22 38 30 37 37C36 44 29 41 24 41C19 41 12 44 11 37C10 30 16 22 24 22Z'),
      p(C.woodLo, ring(9, 20, 5.5)),
      p(C.woodLo, ring(18, 10, 5.5)),
      p(C.woodLo, ring(30, 10, 5.5)),
      p(C.woodLo, ring(39, 20, 5.5)),
    ],
    [p(C.wood, ring(18, 10, 2.5)), p(C.wood, ring(30, 10, 2.5)), p(C.wood, ring(9, 20, 2.5)), p(C.wood, ring(39, 20, 2.5))],
  ),
  // (a shield that arrives next turn: an arrow into it)
  guarded: mix(place(shield(C.sky, C.skyLo, C.skyHi), 0.85, 7, 1), place(art([p(C.goldHi, 'M3 24L22 8V18H45V30H22V40Z')], [p(C.gold, 'M3 24L22 24V40Z M22 24H45V30H22Z')]), 0.5, -4, 22)),
  // (a shape smeared by speed)
  blur: art(
    [
      p(C.skyHi, 'M15 8H43', 5),
      p(C.sky, 'M5 19H36', 5),
      p(C.skyHi, 'M11 30H45', 5),
      p(C.sky, 'M3 41H30', 5),
    ],
  ),
  // (two shields folded into one)
  meld: mix(place(shield(C.violet, C.violetLo, C.violetHi), 0.72, -1, 3), place(shield(C.sky, C.skyLo, C.skyHi), 0.72, 14, 11)),
  // (a coiled spring)
  poised: art(
    [p(C.steel, 'M9 42H39 M12 36C22 41 36 37 36 33S12 30 12 26S36 23 36 19S12 16 12 12S28 6 37 7', 5)],
    [p(C.steelHi, 'M12 12C14 9 24 7 34 7', 1.6)],
  ),
  // (lightning held in the fist)
  empowered: mix(place(FIST, 0.8, 4, 10), place(bolt(C.fireHi, C.gold), 0.62, 16, -2)),
  // (a rope knotted tight)
  strangled: art(
    [p(C.rope, 'M7 7C14 18 24 22 41 41', 7), p(C.rope, 'M41 7C34 18 24 22 7 41', 7), p(C.ropeLo, ring(24, 24, 8))],
    [p(C.bone, 'M19 20L29 28 M19 27L27 20', 2)],
  ),
  freeskill: freeCard(C.leaf, C.leafLo),
  // (a scroll and a quill)
  planner: art(
    [p(C.bone, 'M8 7H34V37C34 43 28 44 26 44H10C14 42 14 40 14 37H8Z'), p(C.violetHi, 'M46 2C36 3 28 11 23 28L27 29C33 22 42 14 46 2Z')],
    [p(C.boneLo, 'M12 14H27 M12 21H22 M12 28H20', 2.2), p(C.violet, 'M46 2C40 10 33 18 25 28L27 29C33 22 42 14 46 2Z')],
  ),
  // (a blow turned back off a shield)
  reflect: mix(place(shield(C.steel, C.steelLo, C.steelHi), 0.8, -3, 5), art([p(C.fireHi, 'M43 33C43 17 34 9 22 8', 5), p(C.fire, 'M24 1L12 8L24 15Z')])),
  bladesweep: mix(place(OBSIDIAN_SWORD, 0.9, 2, 5, 28), art([p(C.violetHi, 'M4 38C2 22 10 9 22 4', 4)])),
  bladeecho: mix(place(sword('#6d5fa6', '#2a2140'), 0.8, -3, 5, -12), place(OBSIDIAN_SWORD, 0.9, 9, 2, 8)),
  bladebane: mix(place(OBSIDIAN_SWORD, 0.92, 2, 2), art([p(C.blood, 'M8 10L40 40 M40 10L8 40', 6)], [p(C.bloodHi, 'M10 12L38 38', 1.5)])),
  freeplay: mix(place(freeCard(C.gold, C.goldLo), 0.9, 2, 2), place(spark(C.white), 0.34, 29, -1)),
  // (mana going round: two arrows chasing)
  orbit: art(
    [
      p(C.sky, 'M6 24C6 13 15 6 26 7', 6),
      p(C.skyHi, 'M26 -1L39 7L26 15Z'),
      p(C.sky, 'M42 24C42 35 33 42 22 41', 6),
      p(C.skyHi, 'M22 33L9 41L22 49Z'),
    ],
    [p(C.violetHi, 'M24 16L32 24L24 32L16 24Z')],
  ),
  // (a sound going out in rings)
  echoing: art(
    [p(C.violet, ring(10, 24, 7)), p(C.violetHi, 'M21 13C26 19 26 29 21 35', 5), p(C.violet, 'M30 7C38 16 38 32 30 41', 5), p(C.violetLo, 'M39 2C49 14 49 34 39 46', 4)],
    [p(C.violetHi, ring(8, 22, 2.5))],
  ),
  // (a bell)
  boosted: art(
    [p(C.gold, 'M24 3C28 3 30 6 30 9C37 11 38 19 38 26C38 31 41 34 44 37H4C7 34 10 31 10 26C10 19 11 11 18 9C18 6 20 3 24 3Z'), p(C.goldLo, ring(24, 41, 5))],
    [p(C.goldLo, 'M24 9C31 9 38 13 38 26C38 31 41 34 44 37H24Z'), p(C.goldHi, 'M15 26C15 20 16 16 20 14', 3)],
  ),
  freepower: freeCard(C.violet, C.violetLo),
  // (a light throwing dart)
  deftness: art(
    [p(C.steelHi, 'M46 2L24 17L31 24Z'), p(C.steel, 'M24 17L6 35L13 42L31 24Z'), p(C.blood, 'M14 27L2 28L7 33L6 35L13 42L15 41L20 46L21 34Z')],
    [p(C.bloodLo, 'M13 42L15 41L20 46L21 34L17 31Z')],
  ),
  // (a dagger stuck in, handle out)
  knives: art(
    [p(C.steel, 'M3 45L20 18L30 28Z'), p(C.gold, 'M19 16L32 29L29 32L16 19Z'), p(C.woodLo, 'M27 20L36 11L39 14L30 23Z'), p(C.gold, ring(39, 9, 4))],
    [p(C.fireHi, 'M9 30L3 29 M18 42L19 47', 2.5)],
  ),
  // (an hourglass: the setup kept for later)
  prep: art(
    [p(C.skyHi, 'M12 7H36C36 17 28 20 28 24C28 28 36 31 36 41H12C12 31 20 28 20 24C20 20 12 17 12 7Z'), p(C.wood, 'M7 2H41V8H7Z'), p(C.wood, 'M7 40H41V46H7Z')],
    [p(C.fireHi, 'M17 13H31C30 17 25 19 24 23C23 19 18 17 17 13Z'), p(C.fireHi, 'M15 39C17 33 21 31 24 30C27 31 31 33 33 39Z')],
  ),
  // (one hilt, two blades)
  twinedge: art(
    [
      p(C.steelHi, 'M13 2L21 31H14L6 8Z'),
      p(C.steelHi, 'M35 2L42 8L34 31H27Z'),
      p(C.gold, 'M9 30H39V36H9Z'),
      p(C.wood, 'M20.5 36H27.5V45H20.5Z'),
    ],
    [p(C.steel, 'M35 2L42 8L34 31H30Z'), p(C.steel, 'M13 2L21 31H17L11 5Z')],
  ),
  freespell: freeCard(C.skyLo, '#124a78'),
  spellcut: mix(place(MOON, 0.85, -2, -1), down()),
  // (a heart safe in a bubble)
  buffer: mix(art([p(C.skyHi, ring(24, 24, 21))], [p(C.sky, 'M45 24A21 21 0 0 1 8 37C22 42 38 36 45 24Z')]), place(heart(C.blood, C.bloodLo, C.bloodHi), 0.54, 11, 11)),
  umbra: OWL,
  twinspell: mix(place(OWL, 0.68, -2, 12), place(OWL, 0.68, 17, 0)),
  // (a cut gem)
  mastery: art(
    [p(C.sky, 'M12 5H36L46 18L24 45L2 18Z')],
    [
      p(C.skyLo, 'M24 45L46 18H33Z'),
      p(C.skyHi, 'M12 5H24L15 18H2Z'),
      p(C.skyLo, 'M36 5L46 18H33Z'),
      p(C.white, 'M15 18H33L24 45Z'),
    ],
  ),
  // (a wisp rising)
  spirit: flame(C.skyHi, C.white, C.sky),
  // (a war horn)
  rousing: art(
    [p(C.bone, 'M4 8C10 28 24 38 44 38V24C31 24 19 19 11 5Z')],
    [p(C.boneLo, 'M6 12C13 29 26 36 44 38V33C30 32 16 26 6 12Z'), p(C.gold, 'M35 23.5V38.5', 4.5), p(C.gold, 'M21 17V32', 4.5)],
  ),
  // (a tent to come in under)
  shelter: art(
    [p(C.wood, 'M24 3L46 43H2Z')],
    [p(C.woodLo, 'M24 3L46 43H24Z'), p(C.dark, 'M24 19L33 43H15Z'), p(C.gold, 'M22 1H26V8H22Z')],
  ),
  // (a keyhole: the way in)
  opening: art(
    [p(C.gold, ring(24, 24, 21))],
    [
      p(C.goldLo, 'M45 24A21 21 0 0 1 8 37C22 42 38 36 45 24Z'),
      p(C.dark, ring(24, 18, 7)),
      p(C.dark, 'M21 20H27L30 37H18Z'),
    ],
  ),
  // (the skull of a curse)
  doom: SKULL(C.violetHi, C.violet, C.violetLo),
};

// ---- Boons and Warden's Hearts ----

/** A round charm, for a Boon that is a sigil or a token. */
const charm = (a: string, lo: string, inner: IconArt): IconArt =>
  mix(art([p(a, ring(24, 24, 21))], [p(lo, 'M45 24A21 21 0 0 1 8 37C22 42 38 36 45 24Z')]), place(inner, 0.62, 9, 9));
const HEART_ART = heart(C.blood, C.bloodLo, C.bloodHi);

export const BOON_ICONS: Record<string, IconArt> = {
  'iron-sigil': charm(C.steelLo, '#3e4a5f', shield(C.steelHi, C.steel, C.white)),
  'thorn-charm': charm(C.woodLo, '#3a2410', STATUS_ICONS.thorns),
  // (a little gold figure with a raised fist)
  'might-idol': art(
    [p(C.gold, 'M31 27L39 15', 6), p(C.gold, ring(39, 10, 6.5)), p(C.gold, 'M13 44L17 24H31L35 44Z'), p(C.gold, ring(24, 15, 9.5)), p(C.goldLo, 'M9 40H39V46H9Z')],
    [
      p(C.goldLo, 'M24 24H31L35 40H24Z'),
      p(C.goldLo, 'M24 5.5A9.5 9.5 0 0 1 24 24.5Z'),
      p(C.dark, ring(20.5, 14, 1.8)),
      p(C.dark, ring(27.5, 14, 1.8)),
      p(C.goldHi, ring(37, 8, 2)),
    ],
  ),
  'ember-lamp': mix(
    place(flame(C.fire, C.fireHi, C.fireLo), 0.46, 13, 0),
    art(
      [p(C.gold, 'M4 25H36C42 25 46 21 45 17L40 19C39 22 37 22 36 22H4C4 34 13 40 24 40C31 40 34 37 36 33H6Z'), p(C.goldLo, 'M15 40H33V45H15Z')],
      [p(C.goldHi, 'M9 28C11 32 15 35 21 36', 2.5)],
    ),
  ),
  'healing-vial': mix(
    BOTTLE(C.bloodHi, C.blood),
    art([], [p(C.white, 'M21.5 28H26.5V32H31V37H26.5V41H21.5V37H17V32H21.5Z')]),
  ),
  'rift-satchel': art(
    [p(C.wood, 'M15 12C15 2 33 2 33 12', 4), p(C.wood, 'M6 12H42V40C42 43 40 45 37 45H11C8 45 6 43 6 40Z')],
    [
      p(C.woodLo, 'M24 12H42V40C42 43 40 45 37 45H24Z'),
      p(C.violet, 'M6 12H42V24C33 31 15 31 6 24Z'),
      p(C.violetLo, 'M24 12H42V24C38 27 31 29 24 29.5Z'),
      p(C.gold, 'M20 24H28V33H20Z'),
    ],
  ),
  // (a heart cut like a gem)
  'crystal-heart': art(
    [p(C.sky, HEART)],
    [
      p(C.skyLo, HEART_R),
      p(C.skyHi, 'M4 16C4 9 10 5 15 5L24 22L13 34C7 28 4 22 4 16Z'),
      p(C.white, 'M24 22L13 34L24 44Z'),
    ],
  ),
  'coin-purse': art(
    [
      p(C.gold, ring(35, 12, 9)),
      p(C.wood, 'M15 12H29L27 17C37 22 42 30 40 37C39 43 33 45 22 45C11 45 5 43 4 37C2 30 9 22 18 17Z'),
    ],
    [
      p(C.goldHi, ring(33, 10, 3)),
      p(C.woodLo, 'M22 17H27C37 22 42 30 40 37C39 43 33 45 22 45C31 38 31 26 22 17Z'),
      p(C.rope, 'M16 18H28', 3),
    ],
  ),
  // (a candle)
  'vigor-wick': mix(
    place(flame(C.leaf, C.leafHi, C.leafLo), 0.38, 15, -1),
    art(
      [p(C.bone, 'M15 18H33V41H15Z'), p(C.gold, 'M6 41H42V46H6Z')],
      [p(C.boneLo, 'M24 18H33V41H24Z'), p(C.white, 'M19 18V30', 3)],
    ),
  ),
  'hex-lantern': mix(
    art(
      [
        p(C.steel, 'M17 8C17 1 31 1 31 8', 3.5),
        p(C.steelLo, 'M14 8H34V15H14Z'),
        p(C.dark, 'M12 15H36V38H12Z'),
        p(C.steelLo, 'M10 38H38V45H10Z'),
      ],
      [p(C.violetLo, 'M15 18H33V35H15Z')],
    ),
    place(flame(C.leaf, C.leafHi, C.leafLo), 0.34, 16, 16),
  ),
  // (a lens to spot the weak place)
  'hunters-lens': art(
    [p(C.wood, 'M31 31L44 44', 7), p(C.gold, ring(20, 20, 17))],
    [p(C.skyHi, ring(20, 20, 12)), p(C.sky, 'M32 20A12 12 0 0 1 11 28C18 31 27 28 32 20Z'), p(C.white, 'M13 19C13 15 15 13 19 12', 3)],
  ),
  // (an old round shield, its boss worn)
  'aegis-of-ages': art(
    [p(C.goldLo, ring(24, 24, 21))],
    [
      p(C.wood, ring(24, 24, 16)),
      p(C.woodLo, 'M40 24A16 16 0 0 1 11 33C20 37 33 33 40 24Z'),
      p(C.gold, ring(24, 24, 7)),
      p(C.goldHi, ring(22, 22, 2.5)),
    ],
  ),
  'gilded-crown': art(
    [p(C.gold, 'M3 13L14 24L24 6L34 24L45 13L41 41H7Z')],
    [
      p(C.goldLo, 'M24 6L34 24L45 13L41 41H24Z'),
      p(C.blood, ring(24, 31, 4)),
      p(C.sky, ring(13, 33, 2.8)),
      p(C.sky, ring(35, 33, 2.8)),
    ],
  ),
  'ember-heart': mix(heart(C.fireLo, '#6e1c0c', C.fire), place(flame(C.fire, C.fireHi, C.fireLo), 0.5, 12, 15)),
  // (a heart with a mouth)
  'gluttons-heart': mix(
    HEART_ART,
    art([], [p(C.dark, 'M11 20C16 24 32 24 37 20C36 30 30 35 24 35C18 35 12 30 11 20Z'), p(C.white, 'M15 22.5L18 28L21 23.5Z M27 23.5L30 28L33 22.5Z')]),
  ),
  'blood-heart': mix(heart(C.bloodLo, '#5a0a14', C.blood), place(drop(C.bloodHi, C.white, C.blood), 0.42, 14, 14)),
  'thorned-heart': mix(
    art([p(C.leafLo, 'M2 12L12 13L7 21Z M46 12L36 13L41 21Z M2 30L10 27L10 35Z M46 30L38 27L38 35Z M21 2L24 11L28 3Z')]),
    HEART_ART,
    art([], [p(C.leaf, 'M6 18C16 28 32 28 42 18', 3)]),
  ),
  'warded-heart': mix(HEART_ART, place(shield(C.steelHi, C.steel, C.white), 0.48, 12.5, 11)),
};

// ---- the map's pens ----

export const TOOL_ICONS = {
  pen: art(
    [p(C.gold, 'M36 3L45 12L17 40L8 31Z'), p(C.bone, 'M8 31L17 40L3 45Z')],
    [p(C.goldLo, 'M40.5 7.5L45 12L17 40L12.5 35.5Z'), p(C.dark, 'M3 45L9 43L5 39Z')],
  ),
  eraser: art(
    [p(C.rose, 'M28 4L45 21L27 39L10 22Z'), p(C.bone, 'M10 22L27 39L20 45H12L3 33Z')],
    [p('#b03a6a', 'M36.5 12.5L45 21L27 39L18.5 30.5Z'), p(C.boneLo, 'M18.5 30.5L27 39L20 45L14 39Z')],
  ),
  clear: art(
    [p(C.steel, 'M10 15H38L34 45H14Z'), p(C.steelHi, 'M6 8H42V14H6Z'), p(C.steel, 'M18 8V3H30V8Z')],
    [p(C.steelLo, 'M24 15H38L34 45H24Z'), p(C.steelLo, 'M18 21L20 39 M24 21V39 M30 21L28 39', 2.5)],
  ),
} as const satisfies Record<string, IconArt>;

/** A companion that makes the enemy strike it: a shield with a mark on it. */
export const TAUNT_ICON: IconArt = mix(shield(C.gold, C.goldLo, C.goldHi), art([], [p(C.blood, ring(24, 23, 10) + ring(24, 23, 6)), p(C.blood, ring(24, 23, 2.5))]));

/** A Boon's picture, if it has one. */
export const boonIcon = (id: string): IconArt | undefined =>
  Object.hasOwn(BOON_ICONS, id) ? BOON_ICONS[id] : undefined;
