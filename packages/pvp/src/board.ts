// The weekly and monthly leaderboards: the pure rules. How the periods are cut, how a player's results are added up and ranked,
// how far a run has got, and what a name on a board may be. Where the results are kept is not decided here (apps/server/src/board.ts).

import { RIFTWALKERS, canonicalHero } from '@sr/content/v2';
import { MAX_TIER, ghostCleared } from '@sr/campaign';
import type { TrophyCount } from './trophies';

export { ghostCleared };
import { cleanName } from './deck';

/** Whether this is the id of a Riftwalker in the game. */
export const isHero = (h: unknown): h is string =>
  typeof h === 'string' && Object.hasOwn(RIFTWALKERS, canonicalHero(h));

export { LEGACY_HERO_IDS } from '@sr/content/v2';

/** The id a board stores for a Riftwalker: the current one (an old id from before the class names is converted). */
export const storedHero = (h: string): string => canonicalHero(h);

export type Period = 'week' | 'month';

/** Results older than this are never shown (a month is the longest board) and are cleared from the server. */
export const BOARD_KEEP_DAYS = 70;
/** How many places a board shows. */
export const BOARD_SIZE = 100;
/** The same winner beating the same opponent counts at most this many times in a day, so two friends cannot farm wins. */
export const SAME_FOE_PER_DAY = 3;
/** One player's counted Arena wins in a day (so no amount of playing alts or friends tops the board on its own). */
export const WINS_PER_DAY = 20;
/**
 * A run cannot be further along than this many stages after it has been going this long: up to three Rift Tiers at once (so a run
 * the board has not seen yet, or whose reports were missed, catches up when the browser tells it where the run is), then one more for
 * every minute. A real stage takes longer than a minute.
 */
export const RUN_START_GRACE = 9;
export const RUN_MIN_STAGE_MS = 60_000;
/** Stages a run may move on in one report beyond what the time since the last one allows (a tier change, a missed report). */
export const RUN_STEP_ALLOWANCE = 3;
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

const HOUR = 3_600_000;
const weekdayOf = (days: number): number => (((days + 3) % 7) + 7) % 7; // Monday = 0 (1 January 1970 was a Thursday)

/**
 * US Pacific time's offset from UTC (ms) at a moment: -7 h while daylight saving runs (from 02:00 on the second Sunday of March to
 * 02:00 on the first Sunday of November), -8 h otherwise.
 */
function pacificOffset(utc: number): number {
  const { y } = civil(Math.floor(utc / DAY));
  const sunday = (month: number, nth: number): number => {
    const first = firstOf(y, month);
    return first + ((6 - weekdayOf(first) + 7) % 7) + 7 * (nth - 1);
  };
  const start = sunday(3, 2) * DAY + 10 * HOUR; // 02:00 PST
  const end = sunday(11, 1) * DAY + 9 * HOUR; // 02:00 PDT
  return utc >= start && utc < end ? -7 * HOUR : -8 * HOUR;
}

/** The UTC moment of a Pacific wall-clock midnight (given as that date's day count). Midnight is never inside the clock change. */
const pacificMidnight = (localDays: number): number => {
  const guess = localDays * DAY + 8 * HOUR;
  return localDays * DAY - pacificOffset(guess);
};

/**
 * When the current week or month began: boards turn over at midnight Pacific time (a week starts at Sunday night's midnight, that is
 * Monday 00:00 Pacific; a month on the 1st at 00:00 Pacific), whatever the viewer's own time zone.
 */
export function periodStart(now: number, period: Period): number {
  const localDays = Math.floor((now + pacificOffset(now)) / DAY);
  if (period === 'month') {
    const { y, m } = civil(localDays);
    return pacificMidnight(firstOf(y, m));
  }
  return pacificMidnight(localDays - weekdayOf(localDays));
}

/** When the period ends (the start of the next one), so a board can say how long is left. */
export function periodEnd(now: number, period: Period): number {
  const localDays = Math.floor((now + pacificOffset(now)) / DAY);
  if (period === 'week') return pacificMidnight(localDays - weekdayOf(localDays) + 7);
  const { y, m } = civil(localDays);
  return pacificMidnight(m === 12 ? firstOf(y + 1, 1) : firstOf(y, m + 1));
}

// ---- names ----

/** A name as it may appear on a board: the usual cleaning (which also replaces abusive names), one line, short. */
export function cleanBoardName(raw: unknown): string {
  const name = cleanName(raw).replace(/\s+/g, ' ').trim().slice(0, 20);
  return name === '' ? 'Riftwalker' : name;
}

/** Names nobody may take: they are what a player with no name is shown as. */
const RESERVED_NAMES = new Set([
  'riftwalker',
  'you',
  'enemy',
  'opponent',
  'player',
  'guest',
  'admin',
]);

export type Username = { ok: true; name: string; key: string } | { ok: false; message: string };

/**
 * A username a player may claim: 3 to 20 letters, digits, spaces and _ - . ' with nothing blocked in it. `key` is what two names are
 * compared by, so "Rob the Brave", "rob_the_brave" and "ROB THE BRAVE" are the same name (a name cannot be taken by changing how it is
 * written).
 */
export function checkUsername(raw: unknown): Username {
  if (typeof raw !== 'string') return { ok: false, message: 'Choose a name.' };
  // (NFKC folds full-width and compatibility forms into ordinary letters)
  const name = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (name.length < 3) return { ok: false, message: 'A name needs at least 3 characters.' };
  if (name.length > 20) return { ok: false, message: 'A name can be at most 20 characters.' };
  // Latin letters only: a lookalike from another alphabet could pass for someone else's name
  if (!/^[\p{Script=Latin}\p{N} _.'-]+$/u.test(name))
    return {
      ok: false,
      message: "Use the letters A to Z (accents are fine), digits, spaces and _ - . ' only.",
    };
  const key = name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (key.length < 3) return { ok: false, message: 'A name needs at least 3 letters or digits.' };
  if (RESERVED_NAMES.has(key) || cleanName(name) !== name)
    return { ok: false, message: 'That name cannot be used. Choose another.' };
  return { ok: true, name, key };
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
  /** the Arena trophies they hold (the server adds them to a board it shows) */
  trophies?: TrophyCount;
  /** the Riftwalkers they played, most played first, each with its own record */
  heroes: { hero: string; wins: number; losses: number }[];
}

/** Add up each player's results and rank them: most wins first, then fewest losses, then the earliest to get there. */
export function standingsPvp(rows: readonly PvpRow[]): (PvpStanding & { player: string })[] {
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
  return [...by.entries()]
    .sort(
      ([, x], [, y]) =>
        y.wins - x.wins ||
        x.losses - y.losses ||
        x.lastWin - y.lastWin ||
        x.name.localeCompare(y.name),
    )
    .map(([player, a]) => ({
      player,
      name: a.name,
      wins: a.wins,
      losses: a.losses,
      heroes: [...a.heroes.entries()]
        .sort((p, q) => q[1].n - p[1].n)
        .map(([hero, h]) => ({ hero, wins: h.wins, losses: h.losses })),
    }));
}

/** A place on a board without the id of whoever holds it (that never leaves the server). */
export const withoutPlayer = <T extends { player: string }>(s: T): Omit<T, 'player'> => {
  const { player: _player, ...rest } = s;
  void _player;
  return rest;
};

/** The top of the Arena board: most wins first, then fewest losses, then the earliest to get there. */
export function rankPvp(rows: readonly PvpRow[], limit = BOARD_SIZE): PvpStanding[] {
  return standingsPvp(rows).slice(0, limit).map(withoutPlayer);
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

/** Each player's furthest run with each Riftwalker in the period, furthest first (a tie goes to whoever got there first). */
export function standingsRuns(rows: readonly RunRow[]): (RunStanding & { player: string })[] {
  const best = new Map<string, RunRow & { total: number }>();
  for (const r of rows) {
    const total = stagesInAll(r.tier, r.stage);
    // (a player may be on the board once for each Riftwalker they have taken furthest)
    const k = `${r.player}|${r.hero}`;
    const cur = best.get(k);
    if (!cur || total > cur.total || (total === cur.total && r.at < cur.at))
      best.set(k, { ...r, total });
  }
  return [...best.values()]
    .sort((x, y) => y.total - x.total || x.at - y.at || x.name.localeCompare(y.name))
    .map((r) => ({
      player: r.player,
      name: r.name,
      hero: r.hero,
      tier: r.tier,
      stage: r.stage,
      total: r.total,
    }));
}

/** The top of the campaign board: each player's furthest run, furthest first. */
export function rankRuns(rows: readonly RunRow[], limit = BOARD_SIZE): RunStanding[] {
  return standingsRuns(rows).slice(0, limit).map(withoutPlayer);
}

// ---- ghosts: a player's deck, played by the computer ----

/** A ghost is only picked from decks that have played in the last this many days. */
export const GHOST_FRESH_DAYS = 30;
/** One player's counted wins against ghosts in a day. */
export const GHOST_WINS_PER_DAY = 15;

/** A deck that has been entered into the Arena, and how it has done. */
export interface GhostDeck {
  id: string;
  /** whose deck it was (never shown) */
  owner: string;
  ownerName: string;
  hero: string;
  tier: number;
  stage: number | null;
  /** its record when people played it, and when the computer did */
  wins: number;
  losses: number;
  ghostWins: number;
  ghostLosses: number;
  lastAt: number;
}

const totalWins = (d: GhostDeck): number => d.wins + d.ghostWins;
const rate = (d: GhostDeck): number => {
  const n = d.wins + d.losses + d.ghostWins + d.ghostLosses;
  return n === 0 ? 0 : totalWins(d) / n;
};

/**
 * The ghost to face: one of the decks in the upper half by wins (people's wins and its own as a ghost, then win rate), never the
 * exact deck the asker is playing with (`own`; their other decks may come up) and never one that has not played lately. `roll` is a number from 0 up to (not including) 1, chosen by the caller.
 * Null when there is no deck to face.
 */
export function pickGhost(
  decks: readonly GhostDeck[],
  own: string | null,
  roll: number,
  now: number,
): GhostDeck | null {
  const fresh = decks
    .filter(
      (d) =>
        d.id !== own &&
        ghostCleared(d.tier, d.stage) &&
        d.lastAt >= now - GHOST_FRESH_DAYS * 86_400_000,
    )
    .sort(
      (x, y) =>
        totalWins(y) - totalWins(x) ||
        rate(y) - rate(x) ||
        y.lastAt - x.lastAt ||
        x.id.localeCompare(y.id),
    );
  if (fresh.length === 0) return null;
  const upper = fresh.slice(0, Math.ceil(fresh.length / 2));
  const i = Math.min(upper.length - 1, Math.max(0, Math.floor(roll * upper.length)));
  return upper[i] ?? null;
}

/** The most ghosts a run can ask to be left out (the ones it has met already). */
export const GHOST_BOSS_EXCLUDE_MAX = 25;

/**
 * The ghost to stand in for a campaign Warden (DECISIONS #231): a deck that cleared Tier GHOST_BOSS_MIN_TIER or further, never the
 * asker's own, never one this run has met already, and as close to the player's tier as there is. Among the closest (the decks
 * within one tier of the nearest), one of the better half by wins.
 */
export function pickGhostBoss(
  decks: readonly GhostDeck[],
  opts: {
    requester: string | null;
    tier: number;
    exclude: readonly string[];
    roll: number;
    now: number;
  },
): GhostDeck | null {
  const skip = new Set(opts.exclude);
  const fresh = decks.filter(
    (d) =>
      ghostCleared(d.tier, d.stage) &&
      d.owner !== opts.requester &&
      !skip.has(d.id) &&
      d.lastAt >= opts.now - GHOST_FRESH_DAYS * 86_400_000,
  );
  if (fresh.length === 0) return null;
  const dist = (d: GhostDeck): number => Math.abs(d.tier - opts.tier);
  const nearest = Math.min(...fresh.map(dist));
  const close = fresh
    .filter((d) => dist(d) <= nearest + 1)
    .sort(
      (x, y) =>
        totalWins(y) - totalWins(x) ||
        rate(y) - rate(x) ||
        y.lastAt - x.lastAt ||
        x.id.localeCompare(y.id),
    );
  const upper = close.slice(0, Math.ceil(close.length / 2));
  const i = Math.min(upper.length - 1, Math.max(0, Math.floor(opts.roll * upper.length)));
  return upper[i] ?? null;
}

/** One finished match between a person and a ghost. */
export interface GhostGame {
  ghost: string;
  ownerName: string;
  hero: string;
  tier: number;
  stage: number | null;
  ghostWon: boolean;
  human: string;
  humanName: string;
  humanHero: string;
  at: number;
}

export interface GhostStanding {
  /** the name of whoever's deck it was */
  name: string;
  hero: string;
  tier: number;
  stage: number | null;
  /** how it did as a ghost in the period */
  wins: number;
  losses: number;
}

/** The ghosts ranked by their wins in the period (then fewer losses). */
export function rankGhosts(games: readonly GhostGame[], limit = BOARD_SIZE): GhostStanding[] {
  const by = new Map<string, GhostStanding & { latest: number }>();
  for (const g of games) {
    let s = by.get(g.ghost);
    if (!s) {
      s = {
        name: g.ownerName,
        hero: g.hero,
        tier: g.tier,
        stage: g.stage,
        wins: 0,
        losses: 0,
        latest: 0,
      };
      by.set(g.ghost, s);
    }
    if (g.at >= s.latest) {
      s.latest = g.at;
      s.name = g.ownerName;
    }
    if (g.ghostWon) s.wins++;
    else s.losses++;
  }
  return [...by.values()]
    .sort((x, y) => y.wins - x.wins || x.losses - y.losses || x.name.localeCompare(y.name))
    .slice(0, limit)
    .map(({ name, hero, tier, stage, wins, losses }) => ({
      name,
      hero,
      tier,
      stage,
      wins,
      losses,
    }));
}

/** Every person's place by wins against ghosts in the period (the same shape as the Arena board). */
export function standingsVsGhosts(
  games: readonly GhostGame[],
): (PvpStanding & { player: string })[] {
  return standingsPvp(
    games.map((g) => ({
      player: g.human,
      name: g.humanName,
      hero: g.humanHero,
      won: !g.ghostWon,
      at: g.at,
    })),
  );
}

/** The top of the people-against-ghosts board. */
export function rankVsGhosts(games: readonly GhostGame[], limit = BOARD_SIZE): PvpStanding[] {
  return standingsVsGhosts(games).slice(0, limit).map(withoutPlayer);
}
