// Reverb's icon (DECISIONS #743): "your next Attack is played twice" as a plain x2 on the red gem the free-Attack icon uses, in place
// of two crossed swords, which read as "an attack" and nothing more. Drawn here, not painted, so it can be redrawn; the painted two
// swords are still in git history (apps/web/public/art/icons/twinned.png before 0.249.0).
//
//   pnpm --filter @sr/tools icon:reverb     write apps/web/public/art/icons/twinned.png (96 x 96)

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = resolve(ROOT, 'apps/web/public/art/icons/twinned.png');

// (drawn at four times the size and shrunk, so the edges are smooth)
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="384" height="384">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe9a0"/>
      <stop offset="0.5" stop-color="#f0b63c"/>
      <stop offset="1" stop-color="#a86a12"/>
    </linearGradient>
    <radialGradient id="red" cx="0.42" cy="0.36" r="0.75">
      <stop offset="0" stop-color="#f0503c"/>
      <stop offset="0.6" stop-color="#c2201a"/>
      <stop offset="1" stop-color="#7a0e10"/>
    </radialGradient>
    <linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdf2"/>
      <stop offset="1" stop-color="#f1dfae"/>
    </linearGradient>
  </defs>
  <!-- the gem: a dark outline, a gold rim with a point on each side, the red face -->
  <path d="M26 8H70L88 26V70L70 88H26L8 70V26Z" fill="#1a0d08"/>
  <path d="M27.5 11.5H68.5L84.5 27.5V68.5L68.5 84.5H27.5L11.5 68.5V27.5Z" fill="url(#gold)"/>
  <path d="M30.5 18.5H65.5L77.5 30.5V65.5L65.5 77.5H30.5L18.5 65.5V30.5Z" fill="#5a0a0c"/>
  <path d="M31.5 21H64.5L75 31.5V64.5L64.5 75H31.5L21 64.5V31.5Z" fill="url(#red)"/>
  <path d="M33 23.5H63L72.5 33" fill="none" stroke="#ff9a80" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
  <g fill="url(#gold)" stroke="#1a0d08" stroke-width="1.6" stroke-linejoin="round">
    <path d="M48 3.5L54 12L48 18.5L42 12Z"/>
    <path d="M48 92.5L54 84L48 77.5L42 84Z"/>
    <path d="M3.5 48L12 42L18.5 48L12 54Z"/>
    <path d="M92.5 48L84 42L77.5 48L84 54Z"/>
  </g>
  <!-- x2: a thick dark outline under ivory, as the numbers on the other icons are -->
  <g stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M26 41L40 59M40 41L26 59" stroke="#1a0d08" stroke-width="11.5"/>
    <path d="M26 41L40 59M40 41L26 59" stroke="url(#ivory)" stroke-width="6"/>
    <path d="M48 41C49 33 68 32 68 43C68 52 49 55 48 65H70" stroke="#1a0d08" stroke-width="12.5"/>
    <path d="M48 41C49 33 68 32 68 43C68 52 49 55 48 65H70" stroke="url(#ivory)" stroke-width="7"/>
  </g>
</svg>`;

async function main(): Promise<void> {
  await sharp(Buffer.from(SVG))
    .resize(96, 96, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  console.log(`twinned.png: Reverb as x2 (${OUT})`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});
