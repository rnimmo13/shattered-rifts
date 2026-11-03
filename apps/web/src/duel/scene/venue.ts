// Venues: where a fight takes place. Most venues are painted arenas (public/art/arenas, see arena.ts); a venue only swaps
// the backdrop, floor and scenery: the board geometry, fighters and effects are the same everywhere. The procedural
// 'rift' arena, and the skyline of a Riftwalker's card-art scene, are what a venue falls back on without painted layers.
import { floorTop } from './layout';
import { FULL_W, PAD_Y, makeCanvas } from './textures';
import { paintScene } from '../../art/scenes';
import { rng } from './noise';

/** A Warden's own arena (boss-<name>, see BOSS_VENUE). */
export type BossVenueId =
  | 'boss-seraphine'
  | 'boss-benediction'
  | 'boss-kron'
  | 'boss-static'
  | 'boss-gorrmaw'
  | 'boss-stag'
  | 'boss-nyxara'
  | 'boss-applause'
  | 'boss-tide'
  | 'boss-queen'
  | 'boss-regent'
  | 'boss-vorthax';

export type VenueId =
  | 'rift'
  | 'cave'
  | 'castle'
  | 'factory'
  | 'forest'
  | 'glass'
  | 'swamp'
  | 'alley'
  // a second site for each realm, and the Far Rifts' own
  | 'ramparts'
  | 'dock'
  | 'canopy'
  | 'garden'
  | 'stilts'
  | 'bazaar'
  | 'cellar'
  | 'farrift'
  | BossVenueId
  // the Rift-crossed arena: ghosts (a ghost Warden, an Echo) and the Arena's PvP
  | 'crossing';

/** Painted-skyline venues: each reuses a Riftwalker's card-art scene (art/scenes.ts) as a far backdrop. */
const SCENE_VENUES = {
  castle: {
    scene: 'knight',
    skyTop: '#141c3c',
    skyLow: '#c9906a',
    dark: '#241f33',
    glow: '#ffd27a',
    floorTint: 0xe0b878,
  },
  factory: {
    scene: 'engineer',
    skyTop: '#0a1626',
    skyLow: '#4f9ab8',
    dark: '#16222e',
    glow: '#5fd6ff',
    floorTint: 0x8cc8e0,
  },
  forest: {
    scene: 'hunter',
    skyTop: '#07161a',
    skyLow: '#4f9a78',
    dark: '#0d1f18',
    glow: '#8ff09a',
    floorTint: 0x98d09a,
  },
  glass: {
    scene: 'spellblade',
    skyTop: '#07080d',
    skyLow: '#59607a',
    dark: '#0f111a',
    glow: '#aab4cc',
    floorTint: 0x9aa3ba,
  },
  swamp: {
    scene: 'necromancer',
    skyTop: '#0a1612',
    skyLow: '#7fa05a',
    dark: '#101a15',
    glow: '#9fe070',
    floorTint: 0x98c878,
  },
  alley: {
    scene: 'drunkard',
    skyTop: '#0d0d16',
    skyLow: '#8a6a5a',
    dark: '#16161e',
    glow: '#ffb35c',
    floorTint: 0xd0a888,
  },
} as const;

/** Each Warden's own arena, by encounter id. */
export const BOSS_VENUE: Record<string, BossVenueId> = {
  seraphine: 'boss-seraphine',
  'the-hollow-benediction': 'boss-benediction',
  kron: 'boss-kron',
  'mother-of-static': 'boss-static',
  gorrmaw: 'boss-gorrmaw',
  'the-upside-down-stag': 'boss-stag',
  nyxara: 'boss-nyxara',
  'the-applause-below': 'boss-applause',
  'the-mourning-tide': 'boss-tide',
  'queen-of-the-unmade': 'boss-queen',
  'event-horizon-regent': 'boss-regent',
  vorthax: 'boss-vorthax',
};

/** A realm's second site (its other fights are split between the two). */
const SECOND_SITE: Partial<Record<VenueId, VenueId>> = {
  castle: 'ramparts',
  factory: 'dock',
  forest: 'canopy',
  cave: 'garden',
  swamp: 'stilts',
  glass: 'bazaar',
  alley: 'cellar',
};

/**
 * Where a fight takes place: a Warden in its own arena, a ghost (a ghost Warden or an Echo) in the Crossing, and any other
 * fight at one of its realm's two sites, picked by the fight's seed (so a resumed or replayed fight keeps its place; a retry
 * after a loss has a new seed, and may move to the other site).
 */
export function venueFor(
  enc: { id: string; realm?: string },
  seed: string | number,
  ghost = false,
): VenueId {
  if (ghost) return 'crossing';
  const boss = BOSS_VENUE[enc.id];
  if (boss) return boss;
  const first = venueForRealm(enc.realm);
  const second = SECOND_SITE[first];
  return second && seedHash(String(seed)) % 2 === 1 ? second : first;
}

function seedHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Which venue a realm's fights use (the first of its two sites). Realms not listed fight in the Rift arena. */
export function venueForRealm(realm: string | undefined): VenueId {
  switch (realm) {
    case 'aurelion':
      return 'castle';
    case 'nexus':
      return 'factory';
    case 'wyldmaw':
      return 'forest';
    case 'umbral':
      return 'cave';
    case 'starfall':
      return 'glass';
    case 'gloomfen':
      return 'swamp';
    case 'midden':
      return 'alley';
    case 'beyond':
      return 'farrift';
    default:
      return 'rift';
  }
}

export interface SceneArt {
  id: 'scene';
  scene: string;
  skyTop: string;
  skyLow: string;
  dark: string;
  glow: string;
  floorTint: number;
}

export type VenueArt = SceneArt;

/** The skyline look of a venue; null (so the Rift arena is used) for a venue with no skyline of its own. */
export function loadVenueArt(id: VenueId): Promise<VenueArt | null> {
  if (!Object.hasOwn(SCENE_VENUES, id)) return Promise.resolve(null);
  return Promise.resolve({ id: 'scene', ...SCENE_VENUES[id as keyof typeof SCENE_VENUES] });
}

/** A painted skyline backdrop: sky gradient, then the Riftwalker's card-art scene scaled up, then a haze at the horizon. */
// (painted once per look and kept between fights: DECISIONS #572)
const keptWalls = new Map<string, HTMLCanvasElement>();
export function sceneWall(art: SceneArt): HTMLCanvasElement {
  const key = JSON.stringify(art);
  let c = keptWalls.get(key);
  if (!c) {
    c = paintSceneWall(art);
    keptWalls.set(key, c);
    // (about 8 MB each: only the last two are kept)
    for (const old of keptWalls.keys()) {
      if (keptWalls.size <= 2) break;
      keptWalls.delete(old);
    }
  }
  return c;
}
function paintSceneWall(art: SceneArt): HTMLCanvasElement {
  const W = FULL_W;
  const H = floorTop + PAD_Y + 40;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, art.skyTop);
  sky.addColorStop(0.55, art.skyTop);
  sky.addColorStop(0.93, art.skyLow);
  sky.addColorStop(1, art.skyLow);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // the scene is painted for a small card window, so paint it small and scale it up into a distant skyline
  const k = 2;
  const small = makeCanvas(Math.ceil(W / k), Math.ceil(H / k));
  const sg = small.getContext('2d') as CanvasRenderingContext2D;
  paintScene(
    sg,
    small.width,
    small.height,
    art.scene,
    { dark: art.dark, glow: art.glow },
    rng(4242),
  );
  g.imageSmoothingEnabled = true;
  // the scenes put their near ground line at 80% of the height: sit that line on the horizon (where the floor starts)
  const dy = floorTop + PAD_Y + 10 - 0.8 * small.height * k;
  g.drawImage(small, 0, dy, small.width * k, small.height * k);
  g.fillStyle = art.dark;
  g.fillRect(0, dy + small.height * k - 1, W, H);
  const haze = g.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(0,0,0,0)');
  haze.addColorStop(1, art.skyLow + 'aa');
  g.fillStyle = haze;
  g.fillRect(0, H * 0.6, W, H * 0.4);
  return c;
}
