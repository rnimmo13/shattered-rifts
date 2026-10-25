// Real artwork, when there is some. Drop PNG/WebP files into apps/web/public/art/ and list them in
// public/art/manifest.json (see docs/09_ART_BRIEF_V2.md); anything not listed keeps its generated placeholder.
//
//   {
//     "figures": { "hero:knight": "figures/knight.png", "unit:slime": "figures/slime.png" },
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
let staged: Stages | null = null;

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

/** The two stages of loading the art: the manifest and the hero figures (the first screens need them), then everything else. */
interface Stages {
  heroes: Promise<void>;
  all: Promise<void>;
}

function load(): Stages {
  const none = Promise.resolve();
  const start = async (): Promise<Stages> => {
    let m: Manifest;
    try {
      const res = await fetch(`${base()}art/manifest.json`, { cache: 'no-cache' });
      if (!res.ok) return { heroes: none, all: none };
      m = (await res.json()) as Manifest;
    } catch {
      return { heroes: none, all: none }; // no manifest: all placeholders
    }
    for (const [id, path] of Object.entries(m.cards ?? {})) cards.set(id, `${base()}art/${path}`);
    for (const [id, path] of Object.entries(m.backdrops ?? {}))
      backdrops.set(id, `${base()}art/${path}`);
    const fetchFigure = (key: string, path: string): Promise<void> =>
      loadImage(`${base()}art/${path}`).then((img) => {
        if (!img) return;
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d')?.drawImage(img, 0, 0);
        figures.set(key, c);
      });
    const entries = Object.entries(m.figures ?? {});
    // the heroes come first: the home screen and every character screen show them
    const heroes = Promise.all(entries.filter(([k]) => k.startsWith('hero:')).map(([k, p]) => fetchFigure(k, p))).then(
      () => undefined,
    );
    const rest = Promise.all(entries.filter(([k]) => !k.startsWith('hero:')).map(([k, p]) => fetchFigure(k, p)));
    return { heroes, all: Promise.all([heroes, rest]).then(() => undefined) };
  };
  const staged = start();
  return { heroes: staged.then((x) => x.heroes), all: staged.then((x) => x.all) };
}

/** How long a first screen waits for the hero figures on a slow connection (about 8 MB the first time, cached after). */
const HEROES_WAIT_MS = 15000;
/** How long a fight waits for the rest of the figures (enemies, companions). */
const ALL_WAIT_MS = 10000;

const wait = (ms: number): Promise<void> => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Tell the screens that art which was not there in time is there now (a first visit on a slow connection). */
export const ART_READY_EVENT = 'sr-art-ready';

/** Load the artwork manifest and the hero figures once (safe to call from several places; resolves even when there is none). */
export function preloadArt(): Promise<void> {
  if (!staged) {
    staged = load();
    // if the wait ran out and the figures arrive later, say so: the screen on show redraws with the real art
    void staged.heroes.then(() => window.dispatchEvent(new Event(ART_READY_EVENT)));
  }
  loading ??= Promise.race([staged.heroes.catch(() => undefined), wait(HEROES_WAIT_MS)]);
  return loading;
}

/** Load all the figures (heroes, enemies, companions): what a fight needs before it draws. */
export function preloadAllArt(): Promise<void> {
  void preloadArt();
  return Promise.race([(staged as Stages).all.catch(() => undefined), wait(ALL_WAIT_MS)]);
}

/** A real figure for a hero ('hero:knight') or unit ('unit:slime'), if one was supplied. */
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
