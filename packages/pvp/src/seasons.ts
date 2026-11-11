// Seasons (DECISIONS #241): a month of the Arena (the ranked season and the monthly board turn over together), and the hook for
// seasonal themes later. A season with a theme takes its name and colours from it (and later a themed Rift, events and a
// cosmetic); a season without one is named for its month. Nothing is themed yet: SEASON_THEMES is where the first one goes.

import { civilMonth, periodEnd, periodStart } from './board';
import { RANKED_MIN_GAMES, RANKS, rankOf, type RankName } from './ranks';

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

// ---- a season's rewards (DECISIONS #737) ----
//
// Each season gives cosmetics of its own, one set for Campaign play and one for Arena play. They are earned in that season only and
// kept for good. Nothing is made yet: SEASON_REWARDS is where a season's rewards go, by season key, naming cosmetics from
// packages/content/src/v2/cosmetics.ts (marked `earned`, so only the server can give them).

export interface SeasonRewards {
  /** Campaign: clearing this Rift Tier, or a higher one, during the season gives the cosmetic */
  campaign: readonly { tier: number; cosmetic: string }[];
  /** Arena: standing at this rank, or a higher one, at any time in the season (by the season's peak rating) gives the cosmetic */
  arena: readonly { rank: RankName; cosmetic: string }[];
}

/** Rewards by season key ("2026-12"). */
export const SEASON_REWARDS: Readonly<Record<string, SeasonRewards>> = {};

/** What a player did in one season, as the leaderboard knows it. */
export interface SeasonRecord {
  /** the highest Rift Tier cleared (0: none) */
  tierCleared: number;
  /** the highest rating reached */
  peak: number;
  /** ranked games played */
  games: number;
}

export const NO_SEASON_RECORD: SeasonRecord = { tierCleared: 0, peak: 0, games: 0 };

/** The cosmetics a season's record has earned. A rank counts only with enough ranked games to be on the season's board. */
export function rewardsEarned(rewards: SeasonRewards | undefined, record: SeasonRecord): string[] {
  if (!rewards) return [];
  const out: string[] = [];
  for (const r of rewards.campaign) if (record.tierCleared >= r.tier) out.push(r.cosmetic);
  if (record.games >= RANKED_MIN_GAMES) {
    const reached = rankOf(record.peak).tier;
    for (const r of rewards.arena) if (reached >= RANKS.indexOf(r.rank)) out.push(r.cosmetic);
  }
  return [...new Set(out)];
}

/**
 * The seasons whose rewards can still be given: this one, and the one before (a reward earned in a player's last sitting of a season
 * is given when they next come back; the leaderboard keeps a finished season's records for BOARD_KEEP_DAYS).
 */
export function rewardSeasons(now: number): Season[] {
  const current = seasonAt(now);
  return [current, seasonAt(current.id - 1)];
}
