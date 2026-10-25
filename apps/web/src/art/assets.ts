// Real artwork, when there is some. Drop PNG/WebP files into apps/web/public/art/ and list them in
// public/art/manifest.json (see docs/09_ART_BRIEF_V2.md); anything not listed keeps its generated placeholder.
//
//   {
//     "figures": { "hero:maren": "figures/maren.png", "unit:slime": "figures/slime.png" },
//     "cards":   { "strike": "cards/strike.webp" },
//     "backdrops": { "aurelion": "backdrops/aurelion.webp" }
//   }
//
// Figures are transparent cut-outs (any size; their feet should touch the bottom edge). Card art is the 4:3 window.

interface Manifest {
  figures?: Record<string, string>;
  cards?: Record<string, string>;
  backdrops?: Record<string, string>;
}

const figures = new Map<string, HTMLCanvasElement>();
const cards = new Map<string, string>();
const backdrops = new Map<string, string>();
let loading: Promise<void> | null = null;

function base(): string {
  return import.meta.env.BASE_URL;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function load(): Promise<void> {
  let m: Manifest;
  try {
    const res = await fetch(`${base()}art/manifest.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    m = (await res.json()) as Manifest;
  } catch {
    return; // no manifest: all placeholders
  }
  const jobs: Promise<void>[] = [];
  for (const [key, path] of Object.entries(m.figures ?? {})) {
    jobs.push(
      loadImage(`${base()}art/${path}`).then((img) => {
        if (!img) return;
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d')?.drawImage(img, 0, 0);
        figures.set(key, c);
      }),
    );
  }
  for (const [id, path] of Object.entries(m.cards ?? {})) cards.set(id, `${base()}art/${path}`);
  for (const [id, path] of Object.entries(m.backdrops ?? {}))
    backdrops.set(id, `${base()}art/${path}`);
  await Promise.all(jobs);
}

/** Load the artwork manifest once (safe to call from several places; resolves even when there is none). */
export function preloadArt(): Promise<void> {
  loading ??= Promise.race([
    load().catch(() => undefined),
    // never hold the first screen hostage to a slow connection: art that arrives later is used next time
    new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
  ]);
  return loading;
}

/** A real figure for a hero ('hero:maren') or unit ('unit:slime'), if one was supplied. */
export const realFigure = (key: string): HTMLCanvasElement | undefined => figures.get(key);

/**
 * The id a card's picture is filed under: an upgrade ("strike+") and a sanctified card ("hi~strike", "lo~strike+") share the art of
 * the card they come from.
 */
export const artKey = (id: string): string => id.replace(/^(hi|lo)~/, '').replace(/\+$/, '');

/** A real card-art URL for a card id (upgrades and sanctified cards share their base card's art), if one was supplied. */
export const realCardArt = (id: string): string | undefined => cards.get(artKey(id));

/** A real backdrop URL for a realm, if one was supplied. */
export const realBackdrop = (realm: string): string | undefined => backdrops.get(realm);
