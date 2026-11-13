import previews from './skinPreviews.json';

export const skinPreview = (id?: string) =>
  id ? previews[id as keyof typeof previews] : undefined;

/** Match the sheet renderer's resting-pose fit, including intentional character scale. */
export function skinPreviewLayout(id: string, width: number, height: number, fill = 0.94) {
  const p = skinPreview(id);
  if (!p) return undefined;
  const fit = Math.max(p.height / 0.78, p.fitWidth / 0.85) / p.displayScale;
  const scale = Math.min(
    (height * fill) / fit,
    (height * 0.99) / p.height,
    (width * 0.98) / p.width,
  );
  const shift = (-(p.left + p.right) * scale) / 2;
  return {
    fitHeight: fit * scale,
    shift,
    picture: {
      width: p.width * scale,
      height: p.height * scale,
      left: width / 2 + shift + p.x * scale,
      top: height + p.y * scale,
    },
  };
}
