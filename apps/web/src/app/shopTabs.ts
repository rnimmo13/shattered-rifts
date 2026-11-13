// The kinds of cosmetics the Store and the Cosmetics Vault show as tabs, and the tab a page was left on (DECISIONS #409).

import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { AVAILABLE_SKINS } from '../art/heroRigs';

export type ShopTab = 'looks' | 'backs' | 'fields' | 'frames' | 'titles' | 'emotes';

const ALL_TABS: { id: ShopTab; name: string; text: string }[] = [
  { id: 'looks', name: 'Skins', text: 'Other outfits for your Riftwalkers.' },
  { id: 'backs', name: 'Card backs', text: 'New designs for the back of every card you draw.' },
  {
    id: 'fields',
    name: 'Battlefields',
    text: 'Arenas to fight on, from drowned halls to burning skies.',
  },
  {
    id: 'frames',
    name: 'Card frames',
    text: 'Foil and gilded frames for the cards you love most.',
  },
  { id: 'titles', name: 'Titles and banners', text: 'Show them on your Arena player card.' },
  { id: 'emotes', name: 'Emotes', text: 'Something to say to your opponent in the Arena.' },
];

/** Riftwalker looks are shown once there is a skin with an animated model. */
export const SHOP_TABS = ALL_TABS.filter((t) => AVAILABLE_SKINS.length > 0 || t.id !== 'looks');

/** The tab a page opens on when none was remembered. */
export const FIRST_TAB: ShopTab = SHOP_TABS[0]!.id;

export const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

/** The tab and class a page was left on, remembered in this browser (a convenience: it starts on FIRST_TAB when storage is blocked). */
export function remembered<T extends string>(
  key: string,
  fallback: T,
  ok: (v: string) => boolean,
): T {
  try {
    const v = localStorage.getItem(key);
    return v && ok(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}
export function remember(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* (storage blocked: it starts on the default next time) */
  }
}
