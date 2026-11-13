import { GOTHIC_SKIN, gothicPicture } from './gothicPalette';
import { iconUrl, paintedFiles } from './gameIcons';
import { WORLD_UNIT_ART } from '@sr/content/v2';
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
  /** alternate looks for the Store: skin id ("knight-moonlit-regent": the class id, then the skin) -> figure (DECISIONS #402) */
  skins?: Record<string, string>;
}

const figures = new Map<string, HTMLCanvasElement>();
const cards = new Map<string, string>();
const backdrops = new Map<string, string>();
const skins = new Map<string, string>();
let loading: Promise<void> | null = null;
let staged: Stages | null = null;

export interface ArtProgress {
  completed: number;
  total: number;
  stage: 'manifest' | 'heroes' | 'ready';
}
let progress: ArtProgress = { completed: 0, total: 0, stage: 'manifest' };
const progressListeners = new Set<(progress: ArtProgress) => void>();
function reportProgress(next: ArtProgress): void {
  progress = next;
  for (const listener of progressListeners) listener(progress);
}
/** Counts settled hero requests, including failed artwork that can use a placeholder. */
export function observeArtProgress(listener: (progress: ArtProgress) => void): () => void {
  progressListeners.add(listener);
  listener(progress);
  return () => {
    progressListeners.delete(listener);
  };
}

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

/**
 * The stages of loading the art: the manifest, then the hero figures (the first screens need them). Every other figure (enemies,
 * companions) is fetched only when a fight that can show it opens (preloadFightArt): all of them at once was about 64 MB on a first
 * visit and a full-size canvas each in memory.
 */
interface Stages {
  manifest: Promise<void>;
  heroes: Promise<void>;
}

/** every figure the manifest lists, by key ("unit:slime"), to its URL */
const figurePaths = new Map<string, string>();
/** figures asked for and not yet in (or in, or failed: one request each) */
const figureLoads = new Map<string, Promise<void>>();

/** Fetch one listed figure into the store, once. */
function fetchFigure(key: string): Promise<void> {
  let p = figureLoads.get(key);
  if (!p) {
    const url = figurePaths.get(key);
    p = !url
      ? Promise.resolve()
      : loadImage(url).then((img) => {
          if (!img) return;
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d')?.drawImage(img, 0, 0);
          figures.set(key, c);
          // (a fight on show swaps it in for its stand-in; not ART_READY_EVENT, which redraws whole screens)
          if (!key.startsWith('hero:')) window.dispatchEvent(new Event(FIGURE_READY_EVENT));
        });
    figureLoads.set(key, p);
  }
  return p;
}

/** A unit's figure that was not in when a fight drew it has arrived (needsFigure): the fight draws it now. */
export const FIGURE_READY_EVENT = 'sr-figure-ready';
/** the manifest has been read (or failed): until then no figure can be known to be missing */
let manifestSettled = false;

/** The figure key a unit is drawn from: its own, or the world unit it borrows its art from (as realFigure reads it). */
function unitKey(id: string): string {
  // (an upgraded unit, "patrol-drone+", stands as its base)
  const unit = id.replace(/\+$/, '');
  const own = `unit:${unit}`;
  if (figurePaths.has(own)) return own;
  const alias = WORLD_UNIT_ART[unit];
  return alias ? `unit:${alias}` : own;
}

function load(): Stages {
  const none = Promise.resolve();
  const start = async (): Promise<{ heroes: Promise<void> }> => {
    let m: Manifest;
    try {
      const res = await fetch(`${base()}art/manifest.json`, { cache: 'no-cache' });
      if (!res.ok) {
        reportProgress({ completed: 0, total: 0, stage: 'ready' });
        return { heroes: none };
      }
      m = (await res.json()) as Manifest;
    } catch {
      reportProgress({ completed: 0, total: 0, stage: 'ready' });
      return { heroes: none }; // no manifest: all placeholders
    }
    for (const [id, path] of Object.entries(m.cards ?? {})) cards.set(id, `${base()}art/${path}`);
    for (const [id, path] of Object.entries(m.backdrops ?? {}))
      backdrops.set(id, `${base()}art/${path}`);
    // (skins are only listed: the Store shows them as plain images, so nothing is fetched here)
    for (const [id, path] of Object.entries(m.skins ?? {})) skins.set(id, `${base()}art/${path}`);
    // (not awaited: the recoloured picture must never hold up the start for everyone else)
    if (m.skins?.[GOTHIC_SKIN]) {
      gothicPicture().then(
        (url) => skins.set(GOTHIC_SKIN, url),
        () => {
          /* retain the existing fallback if art cannot load */
        },
      );
    }
    for (const [key, path] of Object.entries(m.figures ?? {}))
      figurePaths.set(key, `${base()}art/${path}`);
    const heroKeys = [...figurePaths.keys()].filter((k) => k.startsWith('hero:'));
    reportProgress({ completed: 0, total: heroKeys.length, stage: 'heroes' });
    // the heroes only: the home screen and every character screen show them
    const heroes = Promise.all(
      heroKeys.map((k) =>
        fetchFigure(k).finally(() => {
          reportProgress({ ...progress, completed: progress.completed + 1 });
        }),
      ),
    ).then(() => {
      reportProgress({ ...progress, stage: 'ready' });
    });
    return { heroes };
  };
  const staged = start();
  const manifest = staged.then(
    () => {
      manifestSettled = true;
    },
    () => {
      manifestSettled = true;
    },
  );
  return { manifest, heroes: staged.then((x) => x.heroes) };
}

/** How long a first screen waits for the hero figures on a slow connection (about 8 MB the first time, cached after). */
const HEROES_WAIT_MS = 15000;
/** How long a fight waits for its own figures (its enemies and the companions it can summon). */
const FIGHT_WAIT_MS = 10000;

const wait = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

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

let iconsAsked = false;
/** Ask for the status, Boon and pile pictures once, so one is there the moment it first comes up in a fight. */
function preloadIcons(): void {
  if (iconsAsked) return;
  iconsAsked = true;
  for (const id of paintedFiles()) new Image().src = iconUrl(id);
}

/** Load the figures of these units (unit def ids), once each, after the manifest. Resolves when they are in (or failed). */
export function loadUnitFigures(units: Iterable<string>): Promise<void> {
  void preloadArt();
  const want = [...new Set(units)];
  return (staged as Stages).manifest
    .then(() => Promise.all(want.map((u) => fetchFigure(unitKey(u)))))
    .then(() => undefined)
    .catch(() => undefined);
}

/**
 * What a fight needs before it draws: the hero figures, the figures of the units it can show (its enemies, and every companion or
 * summon its cards and units can bring: fightUnits), and the status icons. Waits at most FIGHT_WAIT_MS; a figure that comes later is
 * swapped in at the next redraw (needsFigure).
 */
export function preloadFightArt(units: Iterable<string>): Promise<void> {
  const heroes = preloadArt();
  preloadIcons();
  return Promise.race([
    Promise.all([heroes, loadUnitFigures(units)]).then(() => undefined),
    wait(FIGHT_WAIT_MS),
  ]);
}

/**
 * True when a unit has a real figure listed that is not in yet (it is fetched now): the caller draws the stand-in this time and asks
 * again at its next redraw. A unit no one expected (a card made mid-fight that summons something new) still gets its art this way.
 */
export function needsFigure(unit: string): boolean {
  // (a fight opened before the manifest came: everything may still be coming; it is fetched once the manifest is in)
  if (!manifestSettled) {
    if (staged)
      void staged.manifest.then(() => {
        needsFigure(unit);
      });
    return true;
  }
  const key = unitKey(unit);
  if (figures.has(key) || !figurePaths.has(key)) return false;
  void fetchFigure(key);
  return true;
}

/** A real figure for a hero ('hero:knight') or unit ('unit:slime'), if one was supplied. */
export const realFigure = (key: string): HTMLCanvasElement | undefined =>
  figures.get(key) ??
  (key.startsWith('unit:') && WORLD_UNIT_ART[key.slice(5)]
    ? figures.get(`unit:${WORLD_UNIT_ART[key.slice(5)]}`)
    : undefined);

/**
 * The id a card's picture is filed under: an upgrade ("strike+") and a sanctified card ("hi~strike", "lo~strike+") share the art of
 * the card they come from, and so does a card with an engraved tag ("hold^strike").
 */
export const artKey = (id: string): string =>
  id
    .replace(/^(hi|lo)~/, '')
    .replace(/^[a-z]+\^/, '')
    .replace(/\+$/, '');

/** A real card-art URL for a card id (upgrades and sanctified cards share their base card's art), if one was supplied. */
export const realCardArt = (id: string): string | undefined => cards.get(artKey(id));

/** A real backdrop URL for a realm, if one was supplied. */
export const realBackdrop = (realm: string): string | undefined => backdrops.get(realm);

/** An alternate look for a Riftwalker (a Store cosmetic, DECISIONS #402): its id, the class it dresses, and its figure's URL. */
export interface Skin {
  id: string;
  hero: string;
  url: string;
}

/** Every skin the manifest lists, in its order (empty until the manifest has loaded: call after preloadArt). */
export const realSkins = (): Skin[] =>
  [...skins].map(([id, url]) => ({ id, hero: id.split('-')[0] ?? id, url }));

const skinLoads = new Map<string, Promise<void>>();

/**
 * Load a skin's figure once (an equipped skin is drawn as the hero's figure, DECISIONS #406). Screens on show redraw when it arrives
 * (ART_READY_EVENT), so a figure asked for before it is in shows the hero's own look until then.
 */
export function loadSkin(id: string): Promise<void> {
  const url = skins.get(id);
  if (!url) return Promise.resolve();
  let p = skinLoads.get(id);
  if (!p) {
    p = loadImage(url).then((img) => {
      if (!img) return;
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')?.drawImage(img, 0, 0);
      figures.set(`skin:${id}`, c);
      window.dispatchEvent(new Event(ART_READY_EVENT));
    });
    skinLoads.set(id, p);
  }
  return p;
}

/** A skin's figure, if it has been loaded (see loadSkin). */
export const realSkinFigure = (id: string): HTMLCanvasElement | undefined =>
  figures.get(`skin:${id}`);
