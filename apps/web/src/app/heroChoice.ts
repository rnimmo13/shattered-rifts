// Which Riftwalker the player last picked, remembered between screens: choose on the title screen, then Begin Run or
// Practice fight starts with that character (and the Sanctum and practice setup open on them).

import { RIFTWALKERS, type HeroId } from '@sr/content/v2';

const KEY = 'sr.hero';

export function getHero(): HeroId {
  try {
    const v = localStorage.getItem(KEY);
    if (v && Object.hasOwn(RIFTWALKERS, v)) return v as HeroId;
  } catch {
    /* storage can be unavailable (private windows): fall back to the first character */
  }
  return 'maren';
}

export function rememberHero(h: HeroId): void {
  try {
    localStorage.setItem(KEY, h);
  } catch {
    /* not remembered */
  }
}
