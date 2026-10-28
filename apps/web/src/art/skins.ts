// Skins (DECISIONS #402): alternate looks for a Riftwalker, sold in the Store as cosmetics only. A skin's id is its class id, then its
// name in kebab case ("knight-moonlit-regent"); a "gender-..." skin is the class drawn as the other gender ("engineer-gender-female").

import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import type { Skin } from './assets';

/** The class a skin dresses, as players see it ("Knight"), or its id when it is not a Riftwalker. */
export const skinClass = (hero: string): string =>
  Object.hasOwn(RIFTWALKERS, hero) ? RIFTWALKERS[hero as HeroId].hero.name : hero;

/** A skin's name from its id: "knight-moonlit-regent" is "Moonlit Regent", "engineer-gender-female" is "Female Engineer". */
export function skinName(s: Pick<Skin, 'id' | 'hero'>): string {
  const words = s.id.split('-').slice(1);
  const title = (w: string): string => w.charAt(0).toUpperCase() + w.slice(1);
  if (words[0] === 'gender' && words[1]) return `${title(words[1])} ${skinClass(s.hero)}`;
  return words.map(title).join(' ');
}
