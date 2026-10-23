// A Riftwalker's own icon: their emblem on a round plate in their colour. Every character has a different symbol and colour,
// so they can be told apart at a glance on the title screen, the pickers, the fight plates and the card book.

import { HERO_COLOR, HERO_EMBLEM, emblemSvg } from '../art/emblems';

export function HeroIcon(props: { hero: string; size?: number; plate?: boolean; title?: string }) {
  const { hero, size = 40, plate = true } = props;
  const color = HERO_COLOR[hero] ?? '#d4a84b';
  const markup = emblemSvg(HERO_EMBLEM[hero] ?? 'shield', plate ? '#10142a' : color);
  const id = `hi-${hero}`;
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
          <circle cx="32" cy="32" r="38" fill={`url(#${id})`} stroke="#0a0c1a" strokeWidth="3" />
          <circle cx="32" cy="32" r="34" fill="none" stroke="#fff8" strokeWidth="1.2" />
          <g
            transform="translate(10 10) scale(0.66)"
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        </>
      )}
      {!plate && <g dangerouslySetInnerHTML={{ __html: markup }} />}
    </svg>
  );
}
