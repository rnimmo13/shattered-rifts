// The player's cosmetics in this browser (DECISIONS #406): the skins they own and the look each Riftwalker wears. A copy is kept here
// so it works offline and draws at once; it is merged with the copy on their Vault (a Vault code, or their account when signed in), so
// it follows them from device to device. Getting a skin is free for now.

import { useSyncExternalStore } from 'react';
import { cleanCosmetics, mergeCosmetics, wornSkin, type Cosmetics } from '@sr/pvp';
import { skinDef } from '@sr/content/v2';
import { serverBase } from '../pvp/config';
import { getVaultCode, vaultKey, whoAmI } from '../pvp/vaultSync';
import { loadSkin } from '../art/assets';

const KEY = 'sr-cosmetics';

function load(): Cosmetics {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? cleanCosmetics(JSON.parse(raw)) : { owned: [], worn: {} };
  } catch {
    return { owned: [], worn: {} };
  }
}

let state: Cosmetics = load();
const listeners = new Set<() => void>();

function set(next: Cosmetics): void {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* (storage blocked: it lasts until the page is closed, and the Vault still has it) */
  }
  for (const l of listeners) l();
}

/** This browser's cosmetics, now. */
export const cosmetics = (): Cosmetics => state;

/** The skin this player's Riftwalker wears, if any: only ever theirs (an opponent of the same class keeps their own look). */
export const mySkin = (hero: string): string | undefined => wornSkin(state, hero);

const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = (): Cosmetics => state;

/** The cosmetics, for a component: it redraws when they change. */
export function useCosmetics(): Cosmetics {
  return useSyncExternalStore(subscribe, snapshot);
}

const httpBase = (): string => serverBase().replace(/^ws/i, 'http');

/** Send this browser's copy to the Vault and keep the merged result. False when the server could not be reached. */
export async function syncCosmetics(): Promise<boolean> {
  try {
    const me = await whoAmI();
    // (a guest with no Vault code and nothing got yet has nothing to keep: no Vault is made for them just for opening the page)
    if (!me.signedIn && getVaultCode() === null && state.owned.length === 0) return true;
    const key = vaultKey();
    const res = await fetch(`${httpBase()}/pvp/vault/cosmetics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...(key === null ? {} : { code: key }), cosmetics: state }),
    });
    const data = (await res.json()) as { ok?: boolean; cosmetics?: unknown };
    if (!data.ok) return false;
    // (anything changed here while the request was out is kept too)
    set(mergeCosmetics(state, cleanCosmetics(data.cosmetics)));
    return true;
  } catch {
    return false;
  }
}

/** Get a skin (free for now): owned at once here, then on the Vault. */
export function getSkin(id: string): void {
  if (!skinDef(id) || state.owned.includes(id)) return;
  set({ ...state, owned: [...state.owned, id] });
  // (its figure starts loading now, so it is in before the next fight: a fight never swaps a figure halfway)
  void loadSkin(id);
  void syncCosmetics();
}

/** Wear a skin on its Riftwalker, or null for the Riftwalker's own look. */
export function wear(hero: string, skin: string | null): void {
  if (skin !== null && (skinDef(skin)?.hero !== hero || !state.owned.includes(skin))) return;
  // (a clock that went backwards still makes this the newest choice)
  const at = Math.max(Date.now(), (state.worn[hero]?.at ?? 0) + 1);
  set({ ...state, worn: { ...state.worn, [hero]: { skin, at } } });
  if (skin) void loadSkin(skin);
  void syncCosmetics();
}
