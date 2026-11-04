// Size/format derivatives of the supplied logo, preserving its aspect ratio and alpha.
import { app, nativeImage } from 'electron';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
app.setPath('userData', resolve(root, '.wrangler/brand-assets-profile'));
app
  .whenReady()
  .then(() => {
    const source = nativeImage.createFromPath(
      resolve(root, 'assets-src/icons/shattered-rifts-logo.png'),
    );
    if (source.isEmpty()) throw new Error('Missing or invalid source logo');
    const dimensions = source.getSize();
    const square = (size) => {
      const ratio = size / Math.max(dimensions.width, dimensions.height);
      const width = Math.round(dimensions.width * ratio),
        height = Math.round(dimensions.height * ratio);
      const pixels = source.resize({ width, height, quality: 'best' }).toBitmap();
      const padded = Buffer.alloc(size * size * 4);
      const x = Math.floor((size - width) / 2),
        y = Math.floor((size - height) / 2);
      for (let row = 0; row < height; row++)
        pixels.copy(padded, ((y + row) * size + x) * 4, row * width * 4, (row + 1) * width * 4);
      return nativeImage.createFromBitmap(padded, { width: size, height: size }).toPNG();
    };
    const brand = resolve(root, 'apps/web/public/branding');
    const resources = resolve(root, 'apps/desktop/resources');
    mkdirSync(brand, { recursive: true });
    mkdirSync(resources, { recursive: true });
    for (const size of [32, 180, 192, 512])
      writeFileSync(resolve(brand, `logo-${size}.png`), square(size));
    // ICO entries contain PNG payloads, retaining transparency at each Windows icon size.
    const sizes = [16, 24, 32, 48, 64, 128, 256],
      pngs = sizes.map(square);
    const directory = Buffer.alloc(6 + sizes.length * 16);
    directory.writeUInt16LE(1, 2);
    directory.writeUInt16LE(sizes.length, 4);
    let offset = directory.length;
    sizes.forEach((size, i) => {
      const at = 6 + i * 16;
      directory[at] = size === 256 ? 0 : size;
      directory[at + 1] = directory[at];
      directory.writeUInt16LE(1, at + 4);
      directory.writeUInt16LE(32, at + 6);
      directory.writeUInt32LE(pngs[i].length, at + 8);
      directory.writeUInt32LE(offset, at + 12);
      offset += pngs[i].length;
    });
    const ico = Buffer.concat([directory, ...pngs]);
    writeFileSync(resolve(root, 'apps/web/public/favicon.ico'), ico);
    writeFileSync(resolve(resources, 'icon.ico'), ico);
    console.log('Generated browser, mobile and Windows icons from the supplied logo.');
    app.quit();
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
