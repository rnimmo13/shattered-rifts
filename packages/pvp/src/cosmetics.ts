// A player's cosmetics (DECISIONS #406, #737): what they own (skins, card backs, name plates), the skin each Riftwalker wears, and the
// card back and name plate in use. Pure rules shared by the browser and the server: cleaning what arrives from outside, and merging two
// copies (another device's, the server's). Owning only grows (a skin got on one device is owned on every device, and nothing is ever
// taken away, not by a season's end and not by a wipe); for each look the newest choice wins.

import { RIFTWALKERS, cosmeticDef, currentSkinId } from '@sr/content/v2';

/** The look a Riftwalker wears: a skin id, or null for its own look; `at` is when it was chosen (ms), so the newest choice wins. */
export interface Worn {
  skin: string | null;
  at: number;
}

/** What is not worn by one Riftwalker but by the player: one card back, one name plate. */
export type Slot = 'cardBack' | 'plate';
export const SLOTS: readonly Slot[] = ['cardBack', 'plate'];

/** The item in a slot: its id, or null for the one everyone starts with; `at` as for a skin. */
export interface Using {
  id: string | null;
  at: number;
}

export interface Cosmetics {
  /** cosmetic ids of any kind, in the order they were got */
  owned: string[];
  /** by Riftwalker id */
  worn: Record<string, Worn>;
  /** the card back and name plate chosen (left out while none has ever been chosen, as copies made before #737 are) */
  using?: Partial<Record<Slot, Using>>;
}

export const NO_COSMETICS: Cosmetics = { owned: [], worn: {} };

const isHero = (id: string): boolean => Object.hasOwn(RIFTWALKERS, id);
const isAt = (at: unknown): at is number =>
  typeof at === 'number' && Number.isFinite(at) && at >= 0;

/**
 * What arrives from outside, kept only as far as it makes sense: known cosmetics, known Riftwalkers, a skin worn only by its own
 * class, a slot holding only its own kind.
 */
export function cleanCosmetics(raw: unknown): Cosmetics {
  if (typeof raw !== 'object' || raw === null) return { owned: [], worn: {} };
  const r = raw as Record<string, unknown>;
  // (a renamed skin's old id is read as its new one, so nobody loses a skin to a rename: DECISIONS #408)
  const now = (id: unknown): unknown => (typeof id === 'string' ? currentSkinId(id) : id);
  const owned: string[] = [];
  if (Array.isArray(r['owned']))
    for (const raw of r['owned']) {
      const id = now(raw);
      if (cosmeticDef(id) && !owned.includes(id as string)) owned.push(id as string);
    }
  const worn: Record<string, Worn> = {};
  const w = r['worn'];
  if (typeof w === 'object' && w !== null && !Array.isArray(w))
    for (const [hero, v] of Object.entries(w as Record<string, unknown>)) {
      if (!isHero(hero) || typeof v !== 'object' || v === null) continue;
      const { skin: was, at } = v as { skin?: unknown; at?: unknown };
      const skin = now(was);
      if (!isAt(at)) continue;
      const def = cosmeticDef(skin);
      if (skin === null) worn[hero] = { skin: null, at };
      else if (def?.kind === 'skin' && def.hero === hero) worn[hero] = { skin: def.id, at };
    }
  const using: Partial<Record<Slot, Using>> = {};
  const u = r['using'];
  if (typeof u === 'object' && u !== null && !Array.isArray(u))
    for (const slot of SLOTS) {
      const v = (u as Record<string, unknown>)[slot];
      if (typeof v !== 'object' || v === null) continue;
      const { id, at } = v as { id?: unknown; at?: unknown };
      if (!isAt(at)) continue;
      if (id === null) using[slot] = { id: null, at };
      else if (cosmeticDef(id)?.kind === slot) using[slot] = { id: id as string, at };
    }
  return { owned, worn, ...(Object.keys(using).length ? { using } : {}) };
}

/** Two copies together: everything either owns, and for each look the newer choice (a cosmetic no longer owned is not worn). */
export function mergeCosmetics(a: Cosmetics, b: Cosmetics): Cosmetics {
  const owned = [...a.owned, ...b.owned.filter((id) => !a.owned.includes(id))];
  const worn: Record<string, Worn> = {};
  for (const hero of new Set([...Object.keys(a.worn), ...Object.keys(b.worn)])) {
    const x = a.worn[hero];
    const y = b.worn[hero];
    const pick = !x ? y : !y ? x : y.at > x.at ? y : x;
    if (pick && (pick.skin === null || owned.includes(pick.skin))) worn[hero] = pick;
  }
  const using: Partial<Record<Slot, Using>> = {};
  for (const slot of SLOTS) {
    const x = a.using?.[slot];
    const y = b.using?.[slot];
    const pick = !x ? y : !y ? x : y.at > x.at ? y : x;
    if (pick && (pick.id === null || owned.includes(pick.id))) using[slot] = pick;
  }
  return { owned, worn, ...(Object.keys(using).length ? { using } : {}) };
}

/** The skin a Riftwalker wears, if it wears one the player owns. */
export const wornSkin = (c: Cosmetics, hero: string): string | undefined => {
  const s = c.worn[hero]?.skin;
  return s && c.owned.includes(s) ? s : undefined;
};

/** The card back or name plate in use, if one the player owns is chosen (none: the one everyone starts with). */
export const inUse = (c: Cosmetics, slot: Slot): string | undefined => {
  const id = c.using?.[slot]?.id;
  return id && c.owned.includes(id) ? id : undefined;
};

/** A cosmetic a device may say it owns without the server having given it: free, and not earned. */
export const selfClaimable = (id: string): boolean => {
  const def = cosmeticDef(id);
  return !!def && !def.earned && def.price === 0;
};

/**
 * A device's copy as the server takes it: it may claim only what is free to take. What it says it wears is left alone (the merge
 * with the server's own copy drops a look the player turns out not to own).
 */
export const selfClaimed = (c: Cosmetics): Cosmetics => ({
  ...c,
  owned: c.owned.filter(selfClaimable),
});

/** The copy with these cosmetics given (the server's doing: a season's reward, a keepsake). Unknown ids are passed over. */
export function grantCosmetics(c: Cosmetics, ids: readonly string[]): Cosmetics {
  const owned = [...c.owned];
  for (const id of ids) if (cosmeticDef(id) && !owned.includes(id)) owned.push(id);
  return { ...c, owned };
}
