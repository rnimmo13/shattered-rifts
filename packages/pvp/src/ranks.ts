// Arena ranks (DECISIONS #240): a rating per player per season, moved by every counted Arena win and loss (Elo: beating a stronger
// player moves you further), and shown as a rank: Bronze, Silver, Gold, Platinum and Diamond, the first four in three divisions
// (III, II, I). A season is a calendar month of the Arena board; at the start of the next, every rating is pulled halfway back to
// the start, so a season is a climb and nobody is locked at the top. Pure: the server keeps the ratings (apps/server/src/board.ts).

import { periodStart } from './board';

export const RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const;
export type RankName = (typeof RANKS)[number];

/** Where everyone starts a first season (Bronze II). */
export const RATING_START = 1000;
/** The lowest rating of each rank (Bronze has no floor). */
export const RANK_FLOORS = [0, 1100, 1250, 1400, 1550] as const;
/** Each rank below Diamond is three divisions; Bronze's are counted down from Silver's floor. */
const DIVISIONS = 3;
/** How far a rating moves: further in a player's first games of a season, while it finds its level. */
export const K_PLACEMENT = 40;
export const K_SETTLED = 24;
export const PLACEMENT_GAMES = 10;
/** A season's board lists only players with at least this many ranked games. */
export const RANKED_MIN_GAMES = 3;
/** A new season keeps this share of how far a rating was from the start. */
export const SEASON_CARRY = 0.5;

export interface RankBadge {
  rating: number;
  /** ranked games this season */
  games: number;
}

export interface Rank {
  /** 0 Bronze ... 4 Diamond */
  tier: number;
  name: RankName;
  /** 3, 2 or 1 (I is the top of the rank); null for Diamond */
  division: number | null;
  /** "Gold II" */
  label: string;
  /** the rating where the next division or rank begins (null at Diamond) */
  next: number | null;
  /** how far through this division, 0 to 1 */
  progress: number;
}

const ROMAN = ['', 'I', 'II', 'III'];

/** The rank a rating stands at. */
export function rankOf(rating: number): Rank {
  let tier = 0;
  for (let i = RANKS.length - 1; i >= 0; i--)
    if (rating >= (RANK_FLOORS[i] ?? 0)) {
      tier = i;
      break;
    }
  const name = RANKS[tier] as RankName;
  if (tier === RANKS.length - 1)
    return { tier, name, division: null, label: name, next: null, progress: 1 };
  const top = RANK_FLOORS[tier + 1] as number;
  // (Bronze is as wide as Silver, counted down from Silver's floor; below that is still Bronze III)
  const span = (RANK_FLOORS[2] - RANK_FLOORS[1]) / DIVISIONS;
  const width = tier === 0 ? span : (top - (RANK_FLOORS[tier] as number)) / DIVISIONS;
  const below = Math.max(0, Math.ceil((top - rating) / width));
  const division = Math.min(DIVISIONS, Math.max(1, below));
  const lo = top - division * width;
  return {
    tier,
    name,
    division,
    label: `${name} ${ROMAN[division]}`,
    next: lo + width,
    progress: Math.max(0, Math.min(1, (rating - lo) / width)),
  };
}

/** A win's expected chance (Elo) for a player rated `a` against one rated `b`. */
export const expected = (a: number, b: number): number => 1 / (1 + 10 ** ((b - a) / 400));

/** How a counted match moves both ratings. The winner always gains at least 1, and the loser always loses at least 1. */
export function rateMatch(winner: RankBadge, loser: RankBadge): { winner: number; loser: number } {
  const k = (p: RankBadge): number => (p.games < PLACEMENT_GAMES ? K_PLACEMENT : K_SETTLED);
  const e = expected(winner.rating, loser.rating);
  const gain = Math.max(1, Math.round(k(winner) * (1 - e)));
  const loss = Math.max(1, Math.round(k(loser) * (1 - e)));
  return { winner: winner.rating + gain, loser: Math.max(0, loser.rating - loss) };
}

/** Where a rating starts the next season. */
export const carryOver = (rating: number): number =>
  Math.round(RATING_START + (rating - RATING_START) * SEASON_CARRY);

/** The season a moment is in: the start of its month on the Arena board (Pacific time), as the season's id. */
export const seasonOf = (now: number): number => periodStart(now, 'month');

/** A rank badge as a browser receives it, checked (anything else is dropped). */
export function cleanRank(raw: unknown): RankBadge | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const rating = r['rating'];
  const games = r['games'];
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 0 || rating > 10_000)
    return undefined;
  if (typeof games !== 'number' || !Number.isInteger(games) || games < 0 || games > 1_000_000)
    return undefined;
  return { rating, games };
}

export interface RankedStanding {
  name: string;
  rating: number;
  games: number;
  wins: number;
  peak: number;
  hero: string;
}
