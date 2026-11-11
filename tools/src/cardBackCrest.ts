// The default card back carries the S|R crest (DECISIONS #735). The draw pile's four pictures are paintings of a stack seen at an
// angle, so the crest is laid onto the top card's face with the same slant: the plain paintings are kept in
// assets-src/icons/pile-draw-plain, and this writes the crested ones the game shows. Run again after changing the logo or the numbers.
//
//   pnpm --filter @sr/tools cardback:crest            write apps/web/public/art/icons/pile-draw-{1..4}.png
//   pnpm --filter @sr/tools cardback:crest -- --probe  print where each painting's bright centre gem is (to set `at`)

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOGO = resolve(ROOT, 'assets-src/icons/shattered-rifts-logo.png');
const PLAIN = resolve(ROOT, 'assets-src/icons/pile-draw-plain');
const OUT = resolve(ROOT, 'apps/web/public/art/icons');

/** Where the crest sits on each painting (240 x 240): its middle, and the crest's own width and height as arrows on the picture. */
type Lay = { at: [number, number]; across: [number, number]; down: [number, number] };
const CREST_LAYS: Record<number, Lay> = {
  1: { at: [125, 106], across: [70, 24], down: [-30, 70] },
  2: { at: [120, 101], across: [72, 22], down: [-30, 65] },
  3: { at: [121, 88], across: [72, 21], down: [-29, 60] },
  4: { at: [124, 78], across: [72, 20], down: [-28, 56] },
};

const LOGO_SIDE = 256;

async function probe(): Promise<void> {
  for (const tier of [1, 2, 3, 4]) {
    const { data, info } = await sharp(resolve(PLAIN, `pile-draw-${tier}.png`))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let n = 0;
    let sx = 0;
    let sy = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * 4;
        // (the gem's lightning is the only near-white, blue-leaning part of the painting)
        if (data[i]! > 200 && data[i + 1]! > 190 && data[i + 2]! > 235 && data[i + 3]! > 200) {
          n++;
          sx += x;
          sy += y;
        }
      }
    }
    console.log(
      `pile-draw-${tier}: gem centre ${n ? `${(sx / n).toFixed(1)}, ${(sy / n).toFixed(1)}` : 'not found'} (${n} px)`,
    );
  }
}

async function crest(tier: number): Promise<void> {
  const lay = CREST_LAYS[tier]!;
  const logo = await sharp(LOGO)
    .resize(LOGO_SIDE, LOGO_SIDE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  // (the logo's width becomes the `across` arrow and its height the `down` arrow)
  const slanted = await sharp(logo)
    .affine(
      [
        [lay.across[0] / LOGO_SIDE, lay.down[0] / LOGO_SIDE],
        [lay.across[1] / LOGO_SIDE, lay.down[1] / LOGO_SIDE],
      ],
      { background: { r: 0, g: 0, b: 0, alpha: 0 }, interpolator: sharp.interpolators.bicubic },
    )
    .png()
    .toBuffer({ resolveWithObject: true });
  const left = Math.round(lay.at[0] - slanted.info.width / 2);
  const top = Math.round(lay.at[1] - slanted.info.height / 2);
  await sharp(resolve(PLAIN, `pile-draw-${tier}.png`))
    .composite([{ input: slanted.data, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT, `pile-draw-${tier}.png`));
  console.log(`pile-draw-${tier}.png: crest at ${lay.at.join(', ')}`);
}

async function main(): Promise<void> {
  if (process.argv.includes('--probe')) return probe();
  await mkdir(OUT, { recursive: true });
  for (const tier of [1, 2, 3, 4]) await crest(tier);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});
