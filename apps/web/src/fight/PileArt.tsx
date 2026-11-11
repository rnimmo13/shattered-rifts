// The piles as real stacks of cards (DECISIONS #505, #510): face-down cards for the draw pile, thrown face-up cards for the discard pile,
// burnt cards for the Consumed pile. Each comes in four sizes and grows as the pile fills; an empty pile is an outline. The draw pile
// shows the player's card back (DECISIONS #737): the S|R crest unless they have chosen another.

import { useState } from 'react';
import { inUse } from '@sr/pvp';
import { iconUrl, pilePicture, type PileKind } from '../art/gameIcons';
import { drawPileUrl } from '../cosmetics/cardBack';
import { useCosmetics } from '../cosmetics/cosmetics';

/** Which size of stack a pile of this many cards shows: 0 is empty, 4 the tallest. */
export function pileTier(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 7) return 2;
  if (count <= 17) return 3;
  return 4;
}

export function PileArt(props: { kind: PileKind; count: number }) {
  const tier = pileTier(props.count);
  const back = inUse(useCosmetics(), 'cardBack');
  // (a picture that fails to load: a chosen card back gives way to the default one, and the default to the outline, so the pile can
  // still be seen)
  const [failed, setFailed] = useState<string[]>([]);
  const wanted =
    tier === 0
      ? []
      : props.kind === 'draw'
        ? [...(back ? [drawPileUrl(back, tier)] : []), drawPileUrl(undefined, tier)]
        : [iconUrl(pilePicture(props.kind, tier))];
  const src = wanted.find((u) => !failed.includes(u));
  if (src) {
    return (
      <img
        className="pile__art"
        src={src}
        alt=""
        draggable={false}
        onError={() => setFailed((f) => (f.includes(src) ? f : [...f, src]))}
      />
    );
  }
  return (
    <svg className="pile__art" viewBox="0 0 104 146" aria-hidden>
      <rect
        x="9"
        y="9"
        width="86"
        height="128"
        rx="8"
        fill="#0a0c1a"
        fillOpacity="0.65"
        stroke="#8b7a4a"
        strokeWidth="2.5"
        strokeDasharray="8 7"
      />
    </svg>
  );
}
