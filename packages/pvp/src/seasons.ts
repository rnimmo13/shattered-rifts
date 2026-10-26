// Seasons (DECISIONS #241): a month of the Arena (the ranked season and the monthly board turn over together), and the hook for
// seasonal themes later. A season with a theme takes its name and colours from it (and later a themed Rift, events and a
// cosmetic); a season without one is named for its month. Nothing is themed yet: SEASON_THEMES is where the first one goes.

import { civilMonth, periodEnd, periodStart } from './board';

export interface SeasonTheme {
  /** "The Frozen Rift" */
  name: string;
  /** a line about it, for the Arena and home pages */
  blurb: string;
  /** the season's colour (a CSS colour), for its badge */
  accent: string;
  /** a realm the season leans on, for later (a themed Rift, its events) */
  realm?: string;
}

/** Themes by season key ("2026-12"). */
export const SEASON_THEMES: Readonly<Record<string, SeasonTheme>> = {};

export interface Season {
  /** the season's id: when it began (epoch ms), as the ranked ratings are kept by */
  id: number;
  /** "2026-10" */
  key: string;
  /** "October 2026", or its theme's name */
  name: string;
  theme?: SeasonTheme;
  /** when the next season begins (epoch ms) */
  ends: number;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** The season a moment falls in. */
export function seasonAt(now: number): Season {
  const id = periodStart(now, 'month');
  // (the season starts at midnight Pacific on the 1st; half a day later it is the 1st everywhere in the Americas and in UTC)
  const { y, m: month } = civilMonth(id + 12 * 3_600_000);
  const m = month - 1;
  const key = `${y}-${String(month).padStart(2, '0')}`;
  const theme = SEASON_THEMES[key];
  return {
    id,
    key,
    name: theme?.name ?? `${MONTHS[m]} ${y}`,
    ...(theme ? { theme } : {}),
    ends: periodEnd(now, 'month'),
  };
}
