// Cosmetics (DECISIONS #406): what the Store sells. They change how something looks, never how it plays (the pillars rule out
// pay-to-win). For now every look is free to get; a price goes here when the Store starts selling.
//
// A skin's id is its class id, then its name in kebab case ("knight-moonlit-regent"); "<class>-gender-<x>" is the class drawn as the
// other gender. Its figure is apps/web/public/art/figures/skins/<id>.png (tools/pack-heroes.ps1 cuts it from assets-src/heroes/skins).

import type { HeroId } from './index';

export interface SkinDef {
  id: string;
  hero: HeroId;
  /** what it costs in the Store (0: free to get) */
  price: number;
}

const skin = (hero: HeroId, name: string): SkinDef => ({ id: `${hero}-${name}`, hero, price: 0 });

export const SKINS: readonly SkinDef[] = [
  // (the Knight's own look is a man in sun armour now; the woman who was the Moonlit Regent is the Female Knight: #408)
  skin('knight', 'sunwarden'),
  skin('knight', 'gender-female'),
  skin('engineer', 'aether-forgemaster'),
  skin('engineer', 'gender-female'),
  skin('hunter', 'tempest-prowler'),
  skin('hunter', 'gender-male'),
  skin('trickster', 'crimson-illusionist'),
  skin('trickster', 'gender-male'),
  skin('assassin', 'gilded-corsair'),
  skin('assassin', 'gender-female'),
  skin('shaman', 'autumn-oracle'),
  skin('shaman', 'gender-female'),
  skin('monk', 'eclipse-ascetic'),
  skin('monk', 'gender-female'),
  skin('spellblade', 'aurora-empress'),
  skin('spellblade', 'gender-male'),
  skin('necromancer', 'frostbound-warden'),
  skin('necromancer', 'gender-female'),
  skin('drunkard', 'admiral-ale'),
  skin('drunkard', 'gender-female'),
];

const BY_ID = new Map(SKINS.map((s) => [s.id, s]));

/** A skin that was renamed: whoever had it has it under its new id (DECISIONS #408). */
export const RENAMED_SKINS: Readonly<Record<string, string>> = {
  'knight-moonlit-regent': 'knight-gender-female',
};

/** A skin id as it is now (an old id of a renamed skin gives the new one). */
export const currentSkinId = (id: string): string => RENAMED_SKINS[id] ?? id;

/** The skin with this id, if the Store has one. */
export const skinDef = (id: unknown): SkinDef | undefined =>
  typeof id === 'string' ? BY_ID.get(id) : undefined;
