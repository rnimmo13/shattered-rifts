// How the fight screen is laid out for the window it is in (DECISIONS #443). Pure: sizes in, a layout out.
//
// - 'wide': a desktop or a big landscape screen. The side-by-side line as it always was.
// - 'compact': a phone on its side or a tablet held sideways. The same line, with smaller figures, a smaller hand and the
//   sky cropped harder, so the board sits higher and the controls have room.
// - 'portrait': any screen taller than it is wide (a phone held upright, a tablet in portrait). The enemies stand on a row
//   behind, your side on a row in front, and the camera frames the middle of the stage, so the figures stay big enough to
//   read on a narrow screen. Boons and Auras fold into a drawer.

import type { BoardFrame } from '../duel/scene/BattlefieldScene';
import { handCardWidth, handReserve } from '../hand/fanLayout';

export type StageMode = 'wide' | 'compact' | 'portrait';

export function stageModeFor(width: number, height: number): StageMode {
  if (height > width) return 'portrait';
  // a phone on its side (short), or a tablet held sideways (neither side much over a thousand px)
  if (height < 600 || (width < 1200 && height < 900)) return 'compact';
  return 'wide';
}

/** Whether the window is small enough that the side lists (Boons, Auras...) fold into a drawer. */
export const foldsSide = (mode: StageMode): boolean => mode !== 'wide';

/** The rows and spans of the upright layout (stage px). */
export const PORTRAIT = {
  /** the part of the stage the camera frames */
  x0: 550,
  x1: 1370,
  /** the enemies' row (behind) and yours (in front) */
  foeY: 580,
  myY: 1040,
  /** where your hero stands, and how far right your companions may reach */
  heroX: 700,
  allyNear: 880,
  allyFar: 1350,
  /** the enemies' line: centred in this span */
  foeNear: 570,
  foeFar: 1350,
  /** an opponent's hero in the Arena (on the row behind, on the right, facing you) */
  foeHeroX: 1200,
  foeAllyNear: 1040,
  foeAllyFar: 570,
} as const;

/** On a small screen held sideways your hero stands further in from the edge, clear of the potion belt, Mana and the piles. */
export const COMPACT = {
  heroX: 340,
  allyFar: 550,
} as const;

/** How big the figures are drawn, against the wide layout. */
export function figureScale(mode: StageMode, hero: boolean): number {
  if (mode === 'portrait') return hero ? 0.84 : 0.9;
  if (mode === 'compact') return hero ? 0.8 : 0.84;
  return 1;
}

/** The part of the stage the camera must show. */
export function frameFor(mode: StageMode, height = window.innerHeight): BoardFrame {
  if (mode === 'portrait')
    return { x0: PORTRAIT.x0, x1: PORTRAIT.x1, top: 130, bottom: 1120, hang: true };
  // (smaller figures need less sky: the board is fitted from lower down, so it grows and sits higher; on a phone on its side the
  // board is fitted by its height and has width to spare, so the line moves right, clear of the potions, Mana and the draw pile)
  if (mode === 'compact') return { x0: height < 600 ? -110 : 0, x1: 1920, top: 300, bottom: 960 };
  return { x0: 0, x1: 1920, top: 150, bottom: 960 };
}

/** The strips at the top and bottom of the screen that are not the board's (px): the hand, and upright the top bar and the row of controls. */
export function boardReserve(
  mode: StageMode,
  width = window.innerWidth,
  height = window.innerHeight,
): { top: number; bottom: number } {
  const hand = handReserve(handCardWidth(width, height));
  if (mode === 'portrait')
    return { top: PORTRAIT_TOP_BAR, bottom: hand + PORTRAIT_CONTROLS + PORTRAIT_STRIP };
  return { top: 0, bottom: hand };
}

/** Upright: the height of the top bar, and of the row of controls (Mana, End turn, the piles) that sits on the hand. */
export const PORTRAIT_TOP_BAR = 46;
export const PORTRAIT_CONTROLS = 58;
/** ...and of the strip above it (the potion belt, the drawer's button) */
export const PORTRAIT_STRIP = 50;
