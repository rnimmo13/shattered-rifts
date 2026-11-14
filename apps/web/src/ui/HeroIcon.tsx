// A Riftwalker's own icon: their painted class crest (class-01 sheet), or, on a card or if the picture fails, their emblem on a
// round plate in their colour. Every character has a different symbol and colour, so they can be told apart at a glance on the
// title screen, the pickers, the fight plates and the card book.

import { useId } from 'react';
import { RIFTWALKERS, canonicalHero } from '@sr/content/v2';
import { HERO_COLOR, HERO_EMBLEM, emblemSvg } from '../art/emblems';
import { Picture } from './Picture';
import { classCrestPic } from '../fight/fxMoments';

export function HeroIcon(props: {
  hero: string;
  size?: number;
  plate?: boolean;
  title?: string;
  /** 'dark': a dark plate with a ring and emblem in the character's colour (for cards, where a bright plate would melt into the gold frame) */
  tone?: 'bright' | 'dark';
}) {
  // (an id from an old save or the server is read through its current name; one the game doesn't know keeps the emblem)
  const hero = canonicalHero(props.hero);
  if (props.tone === 'dark' || props.plate === false || !Object.hasOwn(RIFTWALKERS, hero))
    return <EmblemIcon {...props} />;
  return (
    <Picture
      id={classCrestPic(hero)}
      className="heroicon heroicon--crest"
      size={props.size ?? 40}
      {...(props.title ? { alt: props.title } : {})}
    >
      <EmblemIcon {...props} />
    </Picture>
  );
}

function EmblemIcon(props: {
  hero: string;
  size?: number;
  plate?: boolean;
  title?: string;
  tone?: 'bright' | 'dark';
}) {
  const { hero, size = 40, plate = true, tone = 'bright' } = props;
  // (own keys only: a hero id such as "constructor" from outside would otherwise find Object's own, DECISIONS #804)
  const known = Object.hasOwn(HERO_COLOR, hero);
  const color = (known ? HERO_COLOR[hero] : undefined) ?? '#d4a84b';
  const dark = tone === 'dark';
  const markup = emblemSvg(
    (Object.hasOwn(HERO_EMBLEM, hero) ? HERO_EMBLEM[hero] : undefined) ?? 'shield',
    plate && !dark ? '#10142a' : color,
  );
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
