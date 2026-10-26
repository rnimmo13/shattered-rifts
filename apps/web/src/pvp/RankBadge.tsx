// An Arena rank on a player's card (DECISIONS #240): a small cut gem in the rank's colour, with the rank and division ("Gold II").
// Each rank's gem has one more facet than the one below, so the ranks read apart without their colours too.

import { useId } from 'react';
import { rankOf, type RankBadge as Badge } from '@sr/pvp';
import { tipAttrs } from '../ui/tip';
import './ranks.css';

const COLOURS = ['#c9824a', '#cfd8e6', '#f2c14e', '#7fe0d0', '#9cc2ff'] as const;
const LIGHT = ['#f3c79a', '#ffffff', '#fff1b8', '#d8fff8', '#eaf3ff'] as const;

/** A regular polygon's points (a gem's outline), `n` sides, radius `r`, centred in a 16 by 16 box. */
const gem = (n: number, r: number): string =>
  Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return `${(8 + r * Math.cos(a)).toFixed(2)},${(8 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

export function RankGem(props: { tier: number; size?: number }) {
  const size = props.size ?? 16;
  const grad = `rank-${useId().replace(/:/g, '')}`;
  const t = Math.max(0, Math.min(4, props.tier));
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden focusable="false">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LIGHT[t]} />
          <stop offset="1" stopColor={COLOURS[t]} />
        </linearGradient>
      </defs>
      <polygon
        points={gem(t + 3, 7)}
        fill={`url(#${grad})`}
        stroke="#0b0e1a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon points={gem(t + 3, 3.2)} fill="#ffffff" opacity="0.35" />
    </svg>
  );
}

export function RankBadge(props: { rank: Badge | undefined; showRating?: boolean }) {
  if (!props.rank) return null;
  const r = rankOf(props.rank.rating);
  return (
    <span
      className={`rankbadge rankbadge--${r.name.toLowerCase()}`}
      {...tipAttrs({
        kicker: 'Arena rank',
        title: r.label,
        text: `Rating ${props.rank.rating}. ${props.rank.games ? `${props.rank.games} Arena ${props.rank.games === 1 ? 'match' : 'matches'} this season.` : 'No Arena matches yet this season.'}`,
      })}
    >
      <RankGem tier={r.tier} />
      <b>{r.label}</b>
      {props.showRating && <small>{props.rank.rating}</small>}
    </span>
  );
}
