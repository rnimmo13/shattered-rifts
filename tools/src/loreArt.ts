import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const source = join(root, 'assets-src/lore'),
  destination = join(root, 'apps/web/public/art/lore');
const brief = readFileSync(join(root, 'docs/lore-prompts.md'), 'utf8');
const requests = [...brief.matchAll(/^\d+\. \*\*([^*]+\.png)\*\*(?: \([^\n]*?\))?: (.+)$/gm)].map(
  (m) => ({ file: m[1]!, prompt: m[2]! }),
);
if (requests.length !== 26)
  throw new Error(`Expected 26 lore art requests, found ${requests.length}`);
const partial = process.argv.includes('--partial');
mkdirSync(destination, { recursive: true });
const assets = [];
for (const request of requests) {
  const file = join(source, request.file);
  if (!existsSync(file)) {
    if (partial) continue;
    throw new Error(`Missing lore artwork: ${file}`);
  }
  const name = request.file.replace(/\.png$/, '');
  const bytes = readFileSync(file),
    image = sharp(bytes),
    metadata = await image.metadata();
  const full = await image
    .clone()
    .resize({ width: 1440, withoutEnlargement: true })
    .webp({ quality: 85, effort: 5 })
    .toBuffer();
  const small = await image
    .clone()
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 81, effort: 5 })
    .toBuffer();
  writeFileSync(join(destination, `${name}.webp`), full);
  writeFileSync(join(destination, `${name}-small.webp`), small);
  if (name === 'key-art') {
    writeFileSync(
      join(destination, 'key-art-thumb.webp'),
      await image.clone().resize({ width: 360 }).webp({ quality: 78 }).toBuffer(),
    );
    writeFileSync(
      join(root, 'apps/web/public/lore-social.jpg'),
      await image
        .clone()
        .resize(1200, 630, { fit: 'cover' })
        .jpeg({ quality: 87, mozjpeg: true })
        .toBuffer(),
    );
  }
  assets.push({
    file: request.file,
    source: `assets-src/lore/${request.file}`,
    web: `art/lore/${name}.webp`,
    width: metadata.width,
    height: metadata.height,
    sourceSha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: full.length,
    prompt: request.prompt,
    reviewStatus: 'concept; pending Robert’s review',
  });
}
if (!partial) {
  const generated = join(root, '.wrangler/lore-generated.json');
  const generation: unknown = existsSync(generated)
    ? JSON.parse(readFileSync(generated, 'utf8'))
    : null;
  writeFileSync(
    join(root, 'docs/lore-art-manifest.json'),
    JSON.stringify(
      {
        version: 1,
        tool: 'built-in image_gen',
        model: 'Model identifier not exposed by built-in tool',
        brief: 'docs/lore-prompts.md',
        characterModels: 'Default class models in assets-src/heroes/<class>.png; no skins',
        assets,
        generation,
      },
      null,
      2,
    ) + '\n',
  );
}
console.log(`Encoded ${assets.length}/26 lore illustrations and responsive previews as WebP.`);
