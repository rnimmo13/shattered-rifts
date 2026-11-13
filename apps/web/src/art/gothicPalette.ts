import nose from './gothicNose.json';
/** Render-time palette swap: keeps every approved pose, alpha edge and weapon measurement intact. */
export const GOTHIC_SKIN = 'necromancer-gothic-puppeteer';
export const GOTHIC_CURSE = '#49d7c9';

export function gothicPixels(pixels: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!,
      g = pixels[i + 1]!,
      b = pixels[i + 2]!;
    if (!pixels[i + 3] || r < 25 || r < g * 2 || r < b * 1.15 || b < g * 1.1) continue;
    const saturation = (r - Math.min(g, b)) / r;
    if (saturation < 0.5) continue;
    const value = r * 0.83;
    const chroma = value * saturation * 0.7;
    pixels[i] = value - chroma * 0.26;
    pixels[i + 1] = value;
    pixels[i + 2] = value - chroma;
  }
}

// The base Necromancer uses muted olive fabric and a separate emerald light ramp.
export function paintedGothicPixels(pixels: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!,
      g = pixels[i + 1]!,
      b = pixels[i + 2]!;
    if (!pixels[i + 3] || g < 26) continue;
    const strength =
      Math.min(1, Math.max(0, (g - b - 6) / 26)) * Math.min(1, Math.max(0, (g - r + 6) / 8));
    if (strength === 0) continue;
    const olive = g * 0.68;
    pixels[i] = r + (olive * 0.95 - r) * strength;
    pixels[i + 1] = g + (olive - g) * strength;
    pixels[i + 2] = b + (olive * 0.66 - b) * strength;
  }
}

export function gothicCanvas(
  image: CanvasImageSource,
  width: number,
  height: number,
  marks: { x: number; y: number; angle: number; scale: number }[] = [],
  painted = false,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Gothic palette needs a 2D canvas');
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height);
  (painted ? paintedGothicPixels : gothicPixels)(pixels.data);
  ctx.putImageData(pixels, 0, 0);
  for (const mark of marks) {
    const angle = (mark.angle * Math.PI) / 180;
    const dx = -9 * mark.scale,
      dy = 10 * mark.scale;
    const x = mark.x + dx * Math.cos(angle) + dy * Math.sin(angle);
    const y = mark.y - dx * Math.sin(angle) + dy * Math.cos(angle);
    // Preserve her lipstick instead of treating it as outfit trim.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, 10 * mark.scale, 6 * mark.scale, -angle, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, 0, 0);
    ctx.restore();
    drawNoseStud(ctx, mark.x, mark.y, mark.scale);
  }
  return canvas;
}

let gothicStill: Promise<string> | undefined;

/** Shared recolored fallback for the Store, Collection and Low graphics. */
export function gothicPicture(): Promise<string> {
  const url = `${import.meta.env.BASE_URL}art/skin-previews/${GOTHIC_SKIN}.png`;
  return (gothicStill ??= (async () => {
    const image = new Image();
    image.src = url;
    await image.decode();
    return gothicCanvas(image, image.naturalWidth, image.naturalHeight, [], true).toDataURL();
  })().catch(() => {
    gothicStill = undefined;
    return url;
  }));
}

/** A small silver nostril stud, with a dark rim so it reads against pale skin. */
export function drawNoseStud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
): void {
  ctx.save();
  ctx.fillStyle = '#403c3d';
  ctx.beginPath();
  ctx.arc(x, y, 1.6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eeeade';
  ctx.beginPath();
  ctx.arc(x - 0.3 * scale, y - 0.3 * scale, 1.05 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Landmarks follow each approved drawing in both atlas sizes; no face detection runs in the game. */
export function gothicPageMarks(
  man: { clips: Record<string, { frames: number[][] }> },
  page: number,
) {
  const marks: { x: number; y: number; angle: number; scale: number }[] = [];
  const seen = new Set<string>();
  const scale = man.clips['idle']!.frames[0]![4]! / 643;
  for (const [name, clip] of Object.entries(man.clips)) {
    const points = nose[name as keyof typeof nose];
    clip.frames.forEach((f, i) => {
      const point = points?.[i];
      if (f[0] !== page || !point) return;
      const key = `${f[1]}:${f[2]}`;
      if (seen.has(key)) return;
      seen.add(key);
      marks.push({
        x: f[1]! + point[0]! * f[3]!,
        y: f[2]! + point[1]! * f[4]!,
        angle: point[2]!,
        scale: scale * point[3]!,
      });
    });
  }
  return marks;
}
