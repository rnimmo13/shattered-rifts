// Which Riftwalkers' default look (no skin worn) is animated, and how (DECISIONS #676, #680, #715, #755). Kept apart from heroSprite.ts
// so a screen can ask without loading the animation code (and Pixi) up front.
import { SKINS, skinDef } from '@sr/content/v2';
import { HERO_VIDEOS } from './heroVideos';

// (No skeletal rigs for now: the Sun Knight and Rogue rigs went back to their still paintings, Robert 2026-11-08, DECISIONS #690. Their
// rig files stay in art/heroes2d/ for a better pass; adding an entry here, e.g. knight: 'sun-knight', assassin: 'rogue', turns one on.)
export const HERO_RIGS: Readonly<Partial<Record<string, string>>> = {};

/**
 * (DECISIONS #755) The heroes with a pose-sheet model: their default look, animated from atlases in public/art/heroes-sheets/<id>/
 * (made in assets-src/heroes-pose-sheets: the pipeline's export, then _pipeline/pack_for_game.py). Every Riftwalker has one.
 */
export const HERO_SHEETS: ReadonlySet<string> = new Set([
  'knight',
  'assassin',
  'drunkard',
  'engineer',
  'hunter',
  'monk',
  'necromancer',
  'shaman',
  'spellblade',
  'trickster',
]);

// Older still-only skins remain in saved cosmetics while their animated models are unavailable.
export const DEMON_KNIGHT_SKIN = 'knight-demon-knight';
export const NOVA_RONIN_SKIN = 'spellblade-nova-ronin';
export const ARC_WELDER_SKIN = 'engineer-arc-welder';
export const ARC_WELDER_HORNET = 'arc-welder-hornet';
export const ANIMATED_SKINS: ReadonlySet<string> = new Set([
  DEMON_KNIGHT_SKIN,
  NOVA_RONIN_SKIN,
  ARC_WELDER_SKIN,
]);
export const AVAILABLE_SKINS = SKINS.filter(({ id }) => ANIMATED_SKINS.has(id));

const KEY = 'sr.animatedModels';

/** (DECISIONS #715) The beta "2D animated models" setting (the video clips): off unless the player turned it on. */
export function loadAnimatedModels(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveAnimatedModels(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, 'on');
    else localStorage.removeItem(KEY);
  } catch {
    /* storage can be unavailable (private windows): the setting just does not stick */
  }
}

/** The video id of a hero's animated model ("video:knight"), when it has one. */
export const VIDEO_PREFIX = 'video:';

/** The id of a hero's pose-sheet model ("sheet:knight", heroSheet.ts). */
export const SHEET_PREFIX = 'sheet:';
/** a creature's pose-sheet model (public/art/units-sheets, DECISIONS #760): "unitsheet:<figure id>" */
export const UNIT_SHEET_PREFIX = 'unitsheet:';

/**
 * How this hero's default look is animated (DECISIONS #755: two modes): its video model when the beta setting is on and it has an idle
 * video, else its pose-sheet model, else its skeletal rig, else nothing (the still picture). The id goes to heroSprite's loadRig and
 * HeroSprite.create.
 */
export function heroRigFor(hero: string, skin?: string): string | undefined {
  if (skin)
    return ANIMATED_SKINS.has(skin) && skinDef(skin)?.hero === hero
      ? `${SHEET_PREFIX}skins/${skin}`
      : undefined;
  if (loadAnimatedModels() && HERO_VIDEOS[hero]?.['idle']) return `${VIDEO_PREFIX}${hero}`;
  if (HERO_SHEETS.has(hero)) return `${SHEET_PREFIX}${hero}`;
  return HERO_RIGS[hero];
}
