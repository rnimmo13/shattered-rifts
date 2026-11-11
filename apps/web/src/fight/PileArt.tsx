// The piles as real stacks of cards (DECISIONS #505, #510): face-down cards for the draw pile, thrown face-up cards for the discard pile,
// burnt cards for the Consumed pile. Each comes in four sizes and grows as the pile fills; an empty pile is an outline. The draw pile
// shows the player's card back (DECISIONS #737, #739): the S|R crest unless they have chosen another.

import { useEffect, useState } from 'react';
import { inUse } from '@sr/pvp';
import { iconUrl, pilePicture, type PileKind } from '../art/gameIcons';
import { backCrestHero, crestPile, crestPileNow, drawPileUrl } from '../cosmetics/cardBack';
import { useCosmetics } from '../cosmetics/cosmetics';

/** Which size of stack a pile of this many cards shows: 0 is empty, 4 the tallest. */
export function pileTier(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 7) return 2;
  if (count <= 17) return 3;
  return 4;
}

/**
 * The draw pile's picture for a card back at this size, best first: a crest back's is painted here (until it is, and if it cannot
 * be, the default shows), a painted back's is its own file, and the default one comes last.
 */
export function useDrawPile(back: string | undefined, tier: number): string[] {
  const hero = backCrestHero(back);
  const [, redraw] = useState(0);
  useEffect(() => {
    if (!hero || tier === 0) return;
    // (the other sizes are painted too, so the pile never shows the default for a moment when it grows or shrinks)
    for (const t of [1, 2, 3, 4]) if (t !== tier) void crestPile(hero, t).catch(() => undefined);
    if (crestPileNow(hero, tier)) return;
    let live = true;
    crestPile(hero, tier).then(
      () => live && redraw((v) => v + 1),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [hero, tier]);
  if (tier === 0) return [];
  const crested = hero ? crestPileNow(hero, tier) : undefined;
  return [
    ...(crested ? [crested] : []),
    ...(back && !hero ? [drawPileUrl(back, tier)] : []),
    drawPileUrl(undefined, tier),
  ];
}

export function PileArt(props: { kind: PileKind; count: number }) {
  const tier = pileTier(props.count);
  const back = inUse(useCosmetics(), 'cardBack');
  const draw = useDrawPile(props.kind === 'draw' ? back : undefined, tier);
  // (a picture that fails to load: a chosen card back gives way to the default one, and the default to the outline, so the pile can
  // still be seen)
  const [failed, setFailed] = useState<string[]>([]);
  const wanted =
    tier === 0 ? [] : props.kind === 'draw' ? draw : [iconUrl(pilePicture(props.kind, tier))];
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
