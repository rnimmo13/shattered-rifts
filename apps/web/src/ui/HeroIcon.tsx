// A Riftwalker's own icon: their emblem on a round plate in their colour. Every character has a different symbol and colour,
// so they can be told apart at a glance on the title screen, the pickers, the fight plates and the card book.

import { useId } from 'react';
import { HERO_COLOR, HERO_EMBLEM, emblemSvg } from '../art/emblems';

export function HeroIcon(props: {
  hero: string;
  size?: number;
  plate?: boolean;
  title?: string;
  /** 'dark': a dark plate with a ring and emblem in the character's colour (for cards, where a bright plate would melt into the gold frame) */
  tone?: 'bright' | 'dark';
}) {
  const { hero, size = 40, plate = true, tone = 'bright' } = props;
  const color = HERO_COLOR[hero] ?? '#d4a84b';
  const dark = tone === 'dark';
  const markup = emblemSvg(HERO_EMBLEM[hero] ?? 'shield', plate && !dark ? '#10142a' : color);
  const id = `hi-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className="heroicon"
      width={size}
      height={size}
      viewBox="-8 -8 80 80"
      role={props.title ? 'img' : undefined}
      aria-label={props.title}
      aria-hidden={props.title ? undefined : true}
    >
      {plate && (
        <>
          <defs>
            <radialGradient id={id} cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="0.35" stopColor={color} />
              <stop offset="1" stopColor={color} stopOpacity="0.55" />
            </radialGradient>
          </defs>
          {dark ? (
            <>
              <circle cx="32" cy="32" r="38" fill="#0b1026" stroke={color} strokeWidth="5" />
              <circle cx="32" cy="32" r="31" fill="none" stroke="#000a" strokeWidth="2" />
            </>
          ) : (
            <>
              <circle
                cx="32"
                cy="32"
                r="38"
                fill={`url(#${id})`}
                stroke="#0a0c1a"
                strokeWidth="3"
              />
              <circle cx="32" cy="32" r="34" fill="none" stroke="#fff8" strokeWidth="1.2" />
            </>
          )}
          <g
            transform={dark ? 'translate(6.5 6.5) scale(0.8)' : 'translate(10 10) scale(0.66)'}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </>
      )}
      {!plate && <g dangerouslySetInnerHTML={{ __html: markup }} />}
    </svg>
  );
}
