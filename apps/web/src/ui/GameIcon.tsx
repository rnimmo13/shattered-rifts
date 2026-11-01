// Draws a picture: the painted one in public/art/icons when `pic` names one, otherwise (or if its file fails to load) the drawing from
// art/gameIcons.ts: the ink outline first, then the shapes, then the shading and detail.

import { useState } from 'react';
import { ICON_INK, PAINTED, iconUrl, type IconArt, type IconPart } from '../art/gameIcons';

/** How far the ink reaches past a shape, on the icons' 48 x 48 grid. */
const OUTLINE = 4;

function Part({ q, ink }: { q: IconPart; ink?: boolean }) {
  const line = q.w !== undefined;
  if (ink) {
    return (
      <path
        d={q.d}
        transform={q.t}
        fill={line ? 'none' : ICON_INK}
        stroke={ICON_INK}
        strokeWidth={(q.w ?? 0) + OUTLINE}
      />
    );
  }
  return line ? (
    <path d={q.d} transform={q.t} fill="none" stroke={q.f} strokeWidth={q.w} />
  ) : (
    <path d={q.d} transform={q.t} fill={q.f} />
  );
}

export function GameIcon(props: { art: IconArt; pic?: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const { base, top } = props.art;
  const cls = `gameicon${props.className ? ` ${props.className}` : ''}`;
  if (props.pic && PAINTED.has(props.pic) && failed !== props.pic) {
    return (
      <img
        className={cls}
        src={iconUrl(props.pic)}
        alt=""
        draggable={false}
        onError={() => setFailed(props.pic ?? null)}
      />
    );
  }
  return (
    <svg
      className={cls}
      viewBox="-2 -2 52 52"
      aria-hidden
      fillRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {base.map((q, i) => (
        <Part key={`i${i}`} q={q} ink />
      ))}
      {base.map((q, i) => (
        <Part key={`b${i}`} q={q} />
      ))}
      {top.map((q, i) => (
        <Part key={`t${i}`} q={q} />
      ))}
    </svg>
  );
}
