// Arena trophies, drawn small (DECISIONS #238): a weekly trophy is a silver cup, a monthly one a larger gold cup with a star, so the
// two are told apart at a glance. Each shows how many the player holds; nothing is drawn for a kind they hold none of.

import { useId } from 'react';
import type { TrophyCount } from '@sr/pvp';
import './trophies.css';

/** One cup. `kind` picks its look; `size` is its height in px. */
export function TrophyCup(props: { kind: 'week' | 'month'; size?: number }) {
  const month = props.kind === 'month';
  const size = props.size ?? (month ? 18 : 15);
  const [light, mid, dark] = month
    ? ['#fff1b8', '#f2c14e', '#a8731c']
    : ['#ffffff', '#cfd8e6', '#7d8aa3'];
  // (each cup its own gradient id: many cups share a page)
  const id = `cup-${props.kind}-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      {/* handles, bowl, stem and foot */}
      <path
        d="M6 5 H3.5 C3.5 9 5 10.5 7 10.8 M18 5 H20.5 C20.5 9 19 10.5 17 10.8"
        fill="none"
        stroke={dark}
        strokeWidth="1.6"
      />
      <path
        d="M6 3 H18 V8 C18 12 15.5 14 12 14 C8.5 14 6 12 6 8 Z"
        fill={`url(#${id})`}
        stroke={dark}
        strokeWidth="0.8"
      />
      <path d="M10.5 14 H13.5 V17.5 H10.5 Z" fill={mid} />
      <path
        d="M7.5 21 C7.5 18.6 9.5 17.5 12 17.5 C14.5 17.5 16.5 18.6 16.5 21 Z"
        fill={`url(#${id})`}
        stroke={dark}
        strokeWidth="0.8"
      />
      {month && (
        <path
          d="M12 5.2 L12.9 7.2 L15 7.4 L13.4 8.8 L13.9 10.9 L12 9.8 L10.1 10.9 L10.6 8.8 L9 7.4 L11.1 7.2 Z"
          fill="#fffbe8"
        />
      )}
    </svg>
  );
}

/** A player's trophies as small cups with counts (monthly first). Nothing when they hold none. */
export function TrophyBadges(props: { trophies?: TrophyCount | undefined; className?: string }) {
  const t = props.trophies;
  if (!t || (t.week === 0 && t.month === 0)) return null;
  const said = [
    t.month ? `${t.month} monthly ${t.month === 1 ? 'trophy' : 'trophies'}` : '',
    t.week ? `${t.week} weekly ${t.week === 1 ? 'trophy' : 'trophies'}` : '',
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <span
      className={`trophies${props.className ? ` ${props.className}` : ''}`}
      title={`Arena trophies: ${said} (a top-100 finish on the Arena board)`}
      aria-label={`Arena trophies: ${said}`}
    >
      {t.month > 0 && (
        <span className="trophies__one trophies__one--month">
          <TrophyCup kind="month" />
          <b>{t.month}</b>
        </span>
      )}
      {t.week > 0 && (
        <span className="trophies__one trophies__one--week">
          <TrophyCup kind="week" />
          <b>{t.week}</b>
        </span>
      )}
    </span>
  );
}
