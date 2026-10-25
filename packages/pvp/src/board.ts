// The weekly and monthly leaderboards: the pure rules. How the periods are cut, how a player's results are added up and ranked,
// how far a run has got, and what a name on a board may be. Where the results are kept is not decided here (apps/server/src/board.ts).

import { RIFTWALKERS } from '@sr/content/v2';
import { MAX_TIER } from '@sr/campaign';
import { cleanName } from './deck';

/** Whether this is the id of a Riftwalker in the game. */
export const isHero = (h: unknown): h is string =>
  typeof h === 'string' && Object.hasOwn(RIFTWALKERS, h);

export type Period = 'week' | 'month';

/** Results older than this are never shown (a month is the longest board) and are cleared from the server. */
export const BOARD_KEEP_DAYS = 70;
/** How many places a board shows. */
export const BOARD_SIZE = 25;
/** The same winner beating the same opponent counts at most this many times in a day, so two friends cannot farm wins. */
export const SAME_FOE_PER_DAY = 3;
/** One player's counted Arena wins in a day (so no amount of playing alts or friends tops the board on its own). */
export const WINS_PER_DAY = 20;
/**
 * A run cannot be further along than this many stages after it has been going this long: a couple of stages at once (a first report
 * that was missed is made up for), then one more for every minute. A real stage takes longer than a minute.
 */
export const RUN_START_GRACE = 2;
export const RUN_MIN_STAGE_MS = 60_000;
/** The furthest a run can be believed to be (the last Rift Tier). */
export const RUN_MAX_TIER = MAX_TIER;
/** Reports and new runs allowed per player and per address, so a script cannot flood the board. */
export const RUN_REPORTS_PER_HOUR = 40;
export const NEW_RUNS_PER_DAY = 10;
export const IP_REPORTS_PER_HOUR = 120;
export const IP_NEW_RUNS_PER_DAY = 30;

/** The furthest stage count a run that began `ageMs` ago may claim. */
export const believableStages = (ageMs: number): number =>
  RUN_START_GRACE + Math.floor(Math.max(0, ageMs) / RUN_MIN_STAGE_MS);

const DAY = 86_400_000;

/** The date (UTC) of a day count since 1970-01-01. (Plain arithmetic: this package has no clock to ask.) */
function civil(days: number): { y: number; m: number } {
  const z = days + 719_468;
  const era = Math.floor(z / 146_097);
  const doe = z - era * 146_097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36_524) - Math.floor(doe / 146_096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return { y, m };
}

/** The day count since 1970-01-01 of the first of a month (UTC). */
function firstOf(y: number, m: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5);
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146_097 + doe - 719_468;
}

/** When the current week (Monday 00:00 UTC) or month (the 1st, 00:00 UTC) began. */
export function periodStart(now: number, period: Period): number {
  const days = Math.floor(now / DAY);
  if (period === 'month') {
    const { y, m } = civil(days);
    return firstOf(y, m) * DAY;
  }
  const weekday = (((days + 3) % 7) + 7) % 7; // Monday = 0 (1 January 1970 was a Thursday)
  return (days - weekday) * DAY;
}

/** When the period ends (the start of the next one), so a board can say how long is left. */
export function periodEnd(now: number, period: Period): number {
  if (period === 'week') return periodStart(now, 'week') + 7 * DAY;
  const { y, m } = civil(Math.floor(now / DAY));
  return (m === 12 ? firstOf(y + 1, 1) : firstOf(y, m + 1)) * DAY;
}

// ---- names ----

const BLOCKED = /\b(fuck\w*|shit\w*|cunt\w*|bitch\w*|nigg\w*|slut\w*|whore\w*)\b/i;

/** A name as it may appear on a board: the usual cleaning, one line, short, and not plainly abusive (that becomes "Riftwalker"). */
export function cleanBoardName(raw: unknown): string {
  const name = cleanName(raw).replace(/\s+/g, ' ').trim().slice(0, 20);
  if (name === '' || BLOCKED.test(name)) return 'Riftwalker';
  return name;
}

// ---- the Arena board ----

export interface PvpRow {
  /** who the result belongs to (an id the server derives; never shown) */
  player: string;
  name: string;
  hero: string;
  won: boolean;
  at: number;
}

export interface PvpStanding {
  name: string;
  wins: number;
  losses: number;
  /** the Riftwalkers they played, most played first, each with its own record */
  heroes: { hero: string; wins: number; losses: number }[];
}

/** Add up each player's results and rank them: most wins first, then fewest losses, then the earliest to get there. */
export function rankPvp(rows: readonly PvpRow[], limit = BOARD_SIZE): PvpStanding[] {
  interface Acc {
    name: string;
    wins: number;
    losses: number;
    lastWin: number;
    latest: number;
    heroes: Map<string, { wins: number; losses: number; n: number }>;
  }
  const by = new Map<string, Acc>();
  for (const r of rows) {
    let a = by.get(r.player);
    if (!a) {
      a = { name: r.name, wins: 0, losses: 0, lastWin: 0, latest: 0, heroes: new Map() };
      by.set(r.player, a);
    }
    if (r.at >= a.latest) {
      a.latest = r.at;
      a.name = r.name; // (their newest name is the one shown)
    }
    const h = a.heroes.get(r.hero) ?? { wins: 0, losses: 0, n: 0 };
    h.n++;
    if (r.won) {
      a.wins++;
      h.wins++;
      a.lastWin = Math.max(a.lastWin, r.at);
    } else {
      a.losses++;
      h.losses++;
    }
    a.heroes.set(r.hero, h);
  }
  return [...by.values()]
    .sort(
      (x, y) =>
        y.wins - x.wins ||
        x.losses - y.losses ||
        x.lastWin - y.lastWin ||
        x.name.localeCompare(y.name),
    )
    .slice(0, limit)
    .map((a) => ({
      name: a.name,
      wins: a.wins,
      losses: a.losses,
      heroes: [...a.heroes.entries()]
        .sort((p, q) => q[1].n - p[1].n)
        .map(([hero, h]) => ({ hero, wins: h.wins, losses: h.losses })),
    }));
}

// ---- the campaign board ----

/** How many stages a run has cleared in all: three to a Rift Tier. */
export function stagesInAll(tier: number, clearedInTier: number): number {
  const t = Number.isFinite(tier) ? Math.max(1, Math.floor(tier)) : 1;
  const c = Number.isFinite(clearedInTier)
    ? Math.max(0, Math.min(3, Math.floor(clearedInTier)))
    : 0;
  return (t - 1) * 3 + c;
}

export interface RunRow {
  player: string;
  name: string;
  hero: string;
  tier: number;
  /** stages cleared in that Rift Tier (0 to 3) */
  stage: number;
  /** when that progress was made */
  at: number;
}

export interface RunStanding {
  name: string;
  hero: string;
  tier: number;
  stage: number;
  total: number;
}

/** Each player's furthest run in the period, furthest first (a tie goes to whoever got there first). */
export function rankRuns(rows: readonly RunRow[], limit = BOARD_SIZE): RunStanding[] {
  const best = new Map<string, RunRow & { total: number }>();
  for (const r of rows) {
    const total = stagesInAll(r.tier, r.stage);
    const cur = best.get(r.player);
    if (!cur || total > cur.total || (total === cur.total && r.at < cur.at))
      best.set(r.player, { ...r, total });
  }
  return [...best.values()]
    .sort((x, y) => y.total - x.total || x.at - y.at)
    .slice(0, limit)
    .map((r) => ({ name: r.name, hero: r.hero, tier: r.tier, stage: r.stage, total: r.total }));
}
