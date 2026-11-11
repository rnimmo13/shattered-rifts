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

// ---- card backs and name plates (DECISIONS #737) ----
//
// A card back's id starts "back-", a name plate's "plate-", so neither can be mistaken for a skin ("<class>-..."). The card back
// everyone starts with (the S|R crest, #735) is not an item: wearing none shows it. A card back's pictures are
// apps/web/public/art/cardbacks/<id>/pile-draw-{1..4}.png (the draw pile at its four sizes) and face.png (one card, upright, 5:7).
// Nothing is made yet: the first season's rewards go here.

export interface ItemDef {
  id: string;
  /** shown in the Collection */
  name: string;
  /** what it costs in the Store (0: not sold) */
  price: number;
  /**
   * Anyone may take it. Left out, the item is earned or sold: only the server gives it (a season's reward, a keepsake, a purchase)
   * and a device can never claim it for itself. Earned is the default so a reward is never free to take by a slip.
   */
  free?: true;
}

export const CARD_BACKS: readonly ItemDef[] = [];
export const PLATES: readonly ItemDef[] = [];

export type CosmeticKind = 'skin' | 'cardBack' | 'plate';

/** Any cosmetic, whatever its kind: what owning and granting need to know of it. */
export interface CosmeticDef {
  id: string;
  kind: CosmeticKind;
  price: number;
  earned: boolean;
  /** a skin's Riftwalker */
  hero?: HeroId;
}

const ITEMS = new Map<string, CosmeticDef>([
  ...SKINS.map((s): [string, CosmeticDef] => [
    s.id,
    { id: s.id, kind: 'skin', price: s.price, earned: false, hero: s.hero },
  ]),
  ...CARD_BACKS.map((b): [string, CosmeticDef] => [
    b.id,
    { id: b.id, kind: 'cardBack', price: b.price, earned: b.free !== true },
  ]),
  ...PLATES.map((p): [string, CosmeticDef] => [
    p.id,
    { id: p.id, kind: 'plate', price: p.price, earned: p.free !== true },
  ]),
]);

/** The cosmetic with this id, of any kind. */
export const cosmeticDef = (id: unknown): CosmeticDef | undefined =>
  typeof id === 'string' ? ITEMS.get(id) : undefined;
