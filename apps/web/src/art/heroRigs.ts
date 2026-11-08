// Which Riftwalkers' default look (no skin worn) is an animated 2D rig, and the folder under art/heroes2d/ it lives in
// (DECISIONS #676, #680). Kept apart from heroSprite.ts so a screen can ask without loading the rig code (and Pixi) up front.
// (None for now: the Sun Knight and Rogue rigs went back to their still paintings, Robert 2026-11-08, DECISIONS #690. Their rig
// files stay in art/heroes2d/ for a better pass; adding an entry here, e.g. knight: 'sun-knight', assassin: 'rogue', turns one on.)
export const HERO_RIGS: Readonly<Partial<Record<string, string>>> = {};
