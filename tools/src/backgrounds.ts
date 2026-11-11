// The menu backgrounds (DECISIONS #745, #747): the seven painted places in assets-src/backgrounds (made from the prompts in
// docs/background-prompts.md) are cut to 16:9 and saved as WebP for the pages that show them. Run again after replacing a painting.
//
//   pnpm --filter @sr/tools backgrounds     write apps/web/public/art/backgrounds/<name>.webp (1920 x 1080)

import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = resolve(ROOT, 'assets-src/backgrounds');
const OUT = resolve(ROOT, 'apps/web/public/art/backgrounds');

export const PLACES = [
  'sanctum',
  'market',
  'vault',
  'crossing-gate',
  'archive',
  'champions',
  'chronicle',
] as const;

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  for (const name of PLACES) {
    const to = resolve(OUT, `${name}.webp`);
    await sharp(resolve(SRC, `${name}.png`))
      .resize(1920, 1080, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
      .webp({ quality: 80, effort: 6 })
      .toFile(to);
    console.log(`${name}.webp: ${Math.round((await stat(to)).size / 1024)} KB`);
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});
