// Which Riftwalkers' default look (no skin worn) is an animated 2D rig, and the folder under art/heroes2d/ it lives in
// (DECISIONS #676, #680). Kept apart from heroSprite.ts so a screen can ask without loading the rig code (and Pixi) up front.
export const HERO_RIGS: Readonly<Partial<Record<string, string>>> = {
  knight: 'sun-knight',
  // (the class shown as the Rogue, DECISIONS #519)
  assassin: 'rogue',
};
