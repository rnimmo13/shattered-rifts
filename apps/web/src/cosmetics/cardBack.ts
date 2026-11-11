// Where a card back's pictures are (DECISIONS #735, #737). The card back everyone starts with is the S|R crest: the draw pile's own
// paintings and the crest on the flying card. A card back a player owns and has chosen has its own folder,
// public/art/cardbacks/<id>/: pile-draw-1..4.png (the draw pile at its four sizes, drawn like the default ones) and face.png (one
// card, upright, 5:7).

import { iconUrl, pilePicture } from '../art/gameIcons';

const base = (): string => import.meta.env.BASE_URL;

/** The draw pile's picture at this size (1 to 4) for a card back; none chosen gives the default. */
export const drawPileUrl = (back: string | undefined, tier: number): string =>
  back
    ? `${base()}art/cardbacks/${back}/pile-draw-${tier}.png`
    : iconUrl(pilePicture('draw', tier));

/** One face-down card of a chosen card back (the default has no picture of its own: it is drawn, with the crest on it). */
export const cardBackFaceUrl = (back: string | undefined): string | null =>
  back ? `${base()}art/cardbacks/${back}/face.png` : null;

/** The crest on the default card back. */
export const crestUrl = (): string => `${base()}branding/logo-192.png`;
