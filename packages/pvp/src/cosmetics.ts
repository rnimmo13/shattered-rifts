// A player's cosmetics (DECISIONS #406): the skins they own and the one each Riftwalker wears. Pure rules shared by the browser and the
// server: cleaning what arrives from outside, and merging two copies (another device's, the server's). Owning only grows (a skin got
// on one device is owned on every device); for each Riftwalker the newest choice of look wins.

import { RIFTWALKERS, currentSkinId, skinDef } from '@sr/content/v2';

/** The look a Riftwalker wears: a skin id, or null for its own look; `at` is when it was chosen (ms), so the newest choice wins. */
export interface Worn {
  skin: string | null;
  at: number;
}

export interface Cosmetics {
  /** skin ids, in the order they were got */
  owned: string[];
  /** by Riftwalker id */
  worn: Record<string, Worn>;
}

export const NO_COSMETICS: Cosmetics = { owned: [], worn: {} };

const isHero = (id: string): boolean => Object.hasOwn(RIFTWALKERS, id);

/** What arrives from outside, kept only as far as it makes sense: known skins, known Riftwalkers, a skin worn only by its own class. */
export function cleanCosmetics(raw: unknown): Cosmetics {
  if (typeof raw !== 'object' || raw === null) return { owned: [], worn: {} };
  const r = raw as Record<string, unknown>;
  // (a renamed skin's old id is read as its new one, so nobody loses a skin to a rename: DECISIONS #408)
  const now = (id: unknown): unknown => (typeof id === 'string' ? currentSkinId(id) : id);
  const owned: string[] = [];
  if (Array.isArray(r['owned']))
    for (const raw of r['owned']) {
      const id = now(raw);
      if (skinDef(id) && !owned.includes(id as string)) owned.push(id as string);
    }
  const worn: Record<string, Worn> = {};
  const w = r['worn'];
  if (typeof w === 'object' && w !== null && !Array.isArray(w))
    for (const [hero, v] of Object.entries(w as Record<string, unknown>)) {
      if (!isHero(hero) || typeof v !== 'object' || v === null) continue;
      const { skin: was, at } = v as { skin?: unknown; at?: unknown };
      const skin = now(was);
      if (typeof at !== 'number' || !Number.isFinite(at) || at < 0) continue;
      if (skin === null) worn[hero] = { skin: null, at };
      else if (skinDef(skin)?.hero === hero) worn[hero] = { skin: skin as string, at };
    }
  return { owned, worn };
}

/** Two copies together: every skin either owns, and for each Riftwalker the newer choice (a skin no longer owned is not worn). */
export function mergeCosmetics(a: Cosmetics, b: Cosmetics): Cosmetics {
  const owned = [...a.owned, ...b.owned.filter((id) => !a.owned.includes(id))];
  const worn: Record<string, Worn> = {};
  for (const hero of new Set([...Object.keys(a.worn), ...Object.keys(b.worn)])) {
    const x = a.worn[hero];
    const y = b.worn[hero];
    const pick = !x ? y : !y ? x : y.at > x.at ? y : x;
    if (pick && (pick.skin === null || owned.includes(pick.skin))) worn[hero] = pick;
  }
  return { owned, worn };
}

/** The skin a Riftwalker wears, if it wears one the player owns. */
export const wornSkin = (c: Cosmetics, hero: string): string | undefined => {
  const s = c.worn[hero]?.skin;
  return s && c.owned.includes(s) ? s : undefined;
};
