// Where a card back's pictures are (DECISIONS #735, #737, #739). The card back everyone starts with is the S|R crest: the draw pile's
// own paintings and the crest on the flying card. There are two kinds of card back a player can own and choose:
//  - a painted one has its own folder, public/art/cardbacks/<id>/: pile-draw-1..4.png (the draw pile at its four sizes, drawn like
//    the default ones) and face.png (one card, upright, 5:7);
//  - a crest one (a Riftwalker's mastery) is the default card back with that Riftwalker's crest in place of the S|R crest. It has no
//    pictures of its own: the plain pile paintings (public/art/cardbacks/plain) and the class crest are put together here.

import { cosmeticDef } from '@sr/content/v2';
import { iconUrl, pilePicture } from '../art/gameIcons';

const base = (): string => import.meta.env.BASE_URL;

/** The Riftwalker whose crest a card back bears, if it is a crest one. */
export const backCrestHero = (back: string | undefined): string | undefined =>
  back ? cosmeticDef(back)?.crest : undefined;

/** A Riftwalker's painted class crest. */
export const heroCrestUrl = (hero: string): string => iconUrl(`crest-${hero}`);

/** The draw pile's picture at this size (1 to 4) for a painted card back; none chosen gives the default. */
export const drawPileUrl = (back: string | undefined, tier: number): string =>
  back
    ? `${base()}art/cardbacks/${back}/pile-draw-${tier}.png`
    : iconUrl(pilePicture('draw', tier));

/** One face-down card of a painted card back (the default and the crest ones have no picture: they are drawn, with a crest on them). */
export const cardBackFaceUrl = (back: string | undefined): string | null =>
  back && !backCrestHero(back) ? `${base()}art/cardbacks/${back}/face.png` : null;

/** The crest on the default card back. */
export const crestUrl = (): string => `${base()}branding/logo-192.png`;

/** The crest a drawn card back shows: its Riftwalker's, or the S|R crest. */
export const cardBackCrestUrl = (back: string | undefined): string => {
  const hero = backCrestHero(back);
  return hero ? heroCrestUrl(hero) : crestUrl();
};

// ---- a crest card back's draw pile ----

/**
 * Where a crest sits on each plain pile painting (240 x 240): its middle, and the crest's own width and height as arrows on the
 * picture, so it lies on the top card with the stack's slant. The same numbers tools/src/cardBackCrest.ts lays the S|R crest with.
 */
const LAYS: Record<
  number,
  { at: [number, number]; across: [number, number]; down: [number, number] }
> = {
  1: { at: [125, 106], across: [70, 24], down: [-30, 70] },
  2: { at: [120, 101], across: [72, 22], down: [-30, 65] },
  3: { at: [121, 88], across: [72, 21], down: [-29, 60] },
  4: { at: [124, 78], across: [72, 20], down: [-28, 56] },
};

const picture = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });

const made = new Map<string, string>();
const making = new Map<string, Promise<string>>();

/** A crest pile picture that is already made, if it is. */
export const crestPileNow = (hero: string, tier: number): string | undefined =>
  made.get(`${hero}:${tier}`);

/**
 * The draw pile at this size (1 to 4) with a Riftwalker's crest on its top card: painted once, then kept. Fails if a picture cannot
 * be loaded (whoever asked shows the default pile instead).
 */
export function crestPile(hero: string, tier: number): Promise<string> {
  const key = `${hero}:${tier}`;
  const have = making.get(key);
  if (have) return have;
  const job = (async (): Promise<string> => {
    const lay = LAYS[tier];
    if (!lay) throw new Error('no such pile');
    const [pile, crest] = await Promise.all([
      picture(`${base()}art/cardbacks/plain/pile-draw-${tier}.png`),
      picture(heroCrestUrl(hero)),
    ]);
    // (twice the painting's size, so the crest stays sharp on a large screen)
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = 240 * scale;
    canvas.height = 240 * scale;
    const g = canvas.getContext('2d');
    if (!g) throw new Error('no canvas');
    g.imageSmoothingQuality = 'high';
    g.drawImage(pile, 0, 0, canvas.width, canvas.height);
    // (a unit square, centred on the crest's place, laid along the two arrows)
    g.setTransform(
      lay.across[0] * scale,
      lay.across[1] * scale,
      lay.down[0] * scale,
      lay.down[1] * scale,
      lay.at[0] * scale,
      lay.at[1] * scale,
    );
    // a dark plate with a gold rim over the painting's centre gem, then the crest on it
    g.beginPath();
    g.arc(0, 0, 0.5, 0, Math.PI * 2);
    g.fillStyle = '#15102c';
    g.fill();
    g.lineWidth = 0.045;
    g.strokeStyle = '#e2b659';
    g.stroke();
    g.drawImage(crest, -0.43, -0.43, 0.86, 0.86);
    const url = canvas.toDataURL('image/png');
    made.set(key, url);
    return url;
  })();
  making.set(key, job);
  // (a failure is not kept: the next ask tries again)
  job.catch(() => making.delete(key));
  return job;
}
