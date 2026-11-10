// The leaderboards, kept on the server: one Durable Object (named "main") with small SQLite tables of Arena results, campaign progress and
// ghosts. It never holds a name, email or code beyond the display name a player typed; a player is told apart by an id the server
// derives (a hash), which is never sent out. The boards themselves are worked out by the pure rules in @sr/pvp (board.ts).
//
// The campaign board takes its progress from the browser, which cannot be checked, so it is guarded instead: a run can only move on as
// fast as the time since its last report allows, and reports and new runs are limited per player and per address.
//
// A ghost is a deck that has been played in the Arena, kept so that someone with no opponent can face it with the computer at the
// controls. Every counted Arena match adds to both decks' records; a match against a ghost adds to the ghost's own.

import { DurableObject } from 'cloudflare:workers';
import {
  BOARD_KEEP_DAYS,
  GHOST_BOSS_EXCLUDE_MAX,
  GHOST_WINS_PER_DAY,
  IP_NEW_RUNS_PER_DAY,
  IP_REPORTS_PER_HOUR,
  NEW_RUNS_PER_DAY,
  RUN_MAX_TIER,
  RUN_REPORTS_PER_HOUR,
  RUN_MIN_STAGE_MS,
  RUN_STEP_ALLOWANCE,
  SAME_FOE_PER_DAY,
  WINS_PER_DAY,
  checkEntry,
  pickGhostBoss,
  checkUsername,
  cleanBoardName,
  isHero,
  storedHero,
  LEGACY_HERO_IDS,
  periodStart,
  BOARD_SIZE,
  pickGhost,
  lastFinished,
  trophyWinners,
  type Trophy,
  type TrophyCount,
  ghostCleared,
  rankGhosts,
  standingsPvp,
  standingsRuns,
  standingsVsGhosts,
  stagesInAll,
  withoutPlayer,
  type Entry,
  type GhostDeck,
  type GhostGame,
  type Period,
  type PvpRow,
  type RunRow,
  RANKED_MIN_GAMES,
  RATING_START,
  REPLAY_ID,
  REPLAY_KEEP_DAYS,
  REPLAY_MAX,
  RECENT_REPLAYS,
  SHARED_REPORT_ID,
  SHARED_REPORT_DAYS,
  validPerformanceReport,
  carryOver,
  rateMatch,
  seasonOf,
  type RankBadge,
  type RankedStanding,
  isArenaBalanceGame,
  cleanFightStats,
} from '@sr/pvp';
import { ascendancyOf } from '@sr/content/v2';
import type { Env } from './env';
import { CURRENT_GHOSTS_VIEW, UNCLEARED_GHOSTS } from './ghostSql';
import { campaignDeckFacts } from './campaignBalance';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const DAY = 86_400_000;
/** How often one player may ask for a ghost in an hour. */
const GHOST_ASKS_PER_HOUR = 40;
const HOUR = 3_600_000;
/** Username claims (and changes) one player, or one address, may make in a day. */
const NAME_CLAIMS_PER_DAY = 8;
const IP_NAME_CLAIMS_PER_DAY = 40;
/** Arena games one player may have kept as replays in a day. */
const REPLAYS_PER_DAY = 120;
/** (DECISIONS #697) Campaign fights kept for each account, how many it may save in a day, and the biggest one kept. */
const FIGHTS_KEPT = 10;
const FIGHTS_PER_DAY = 300;
/** the longest a kept fight's text may be, in characters */
const FIGHT_MAX_CHARS = 300_000;
/** fights one address may save in a day (any number of accounts behind it) */
// (400 since #714: every fight is now balance data, and testers may share a home connection)
const FIGHTS_PER_IP_DAY = 400;
/** all kept fights together, in characters: past it the oldest anyone's are let go, so this one board never fills */
const FIGHTS_TOTAL_CHARS = 400_000_000;
/** (DECISIONS #714) player balance data: every online Campaign fight's numbers and replay, and the balance tables, kept this many days
 * (Robert: "30 day retention only"), and at most this many characters of fights in all (past it the oldest go) */
const BALANCE_DAYS = 30;
const BALANCE_FIGHTS_TOTAL_CHARS = 1_500_000_000;
/** a fight's id: 10 letters and digits, as a replay's */
const FIGHT_ID = /^[A-Za-z0-9]{10}$/;
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isAddr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 80;
/** An Ascendancy id that belongs to this Riftwalker, or null (what a browser sends, or an old row, is checked: DECISIONS #539). */
const boardAscendancy = (hero: unknown, raw: unknown): string | null =>
  typeof hero === 'string' ? (ascendancyOf(storedHero(hero), raw)?.id ?? null) : null;

interface RunSql extends Record<string, SqlStorageValue> {
  shards: number | null;
  player: string;
  name: string;
  hero: string;
  ascendancy: string | null;
  tier: number;
  stage: number;
  at: number;
  ended: string | null;
  play_ms: number | null;
}

interface GhostSql extends Record<string, SqlStorageValue> {
  id: string;
  owner: string;
  owner_name: string;
  hero: string;
  deck: string;
  boons: string;
  ascendancy: string | null;
  max_hp?: number | null;
  tier: number;
  stage: number | null;
  wins: number;
  losses: number;
  ghost_wins: number;
  ghost_losses: number;
  last_at: number;
}

const toDeck = (r: GhostSql): GhostDeck => ({
  id: r.id,
  owner: r.owner,
  ownerName: r.owner_name,
  hero: storedHero(r.hero),
  tier: r.tier,
  stage: r.stage,
  wins: r.wins,
  losses: r.losses,
  ghostWins: r.ghost_wins,
  ghostLosses: r.ghost_losses,
  lastAt: r.last_at,
});

const parseList = (text: string): string[] => {
  try {
    const v: unknown = JSON.parse(text);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export class Leaderboard extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS pvp (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         at INTEGER NOT NULL,
         winner TEXT NOT NULL, winner_name TEXT NOT NULL, winner_hero TEXT NOT NULL,
         loser TEXT NOT NULL, loser_name TEXT NOT NULL, loser_hero TEXT NOT NULL
       )`,
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS pvp_at ON pvp (at)');
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS runs (
         player TEXT NOT NULL, run TEXT NOT NULL,
         name TEXT NOT NULL, hero TEXT NOT NULL,
         tier INTEGER NOT NULL, stage INTEGER NOT NULL, total INTEGER NOT NULL,
         first_at INTEGER NOT NULL, at INTEGER NOT NULL,
         PRIMARY KEY (player, run)
       )`,
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS runs_at ON runs (at)');
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS ghosts (
         id TEXT PRIMARY KEY,
         owner TEXT NOT NULL, owner_name TEXT NOT NULL,
         hero TEXT NOT NULL, deck TEXT NOT NULL, boons TEXT NOT NULL,
         tier INTEGER NOT NULL, stage INTEGER,
         wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0,
         ghost_wins INTEGER NOT NULL DEFAULT 0, ghost_losses INTEGER NOT NULL DEFAULT 0,
         first_at INTEGER NOT NULL, last_at INTEGER NOT NULL
       )`,
    );
    // (DECISIONS #723) the deck lookup finds a player's decks by owner, or by the name they were saved under
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS ghosts_owner ON ghosts (owner)');
    ctx.storage.sql.exec(
      'CREATE INDEX IF NOT EXISTS ghosts_owner_name ON ghosts (owner_name COLLATE NOCASE)',
    );
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS ghost_games (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         at INTEGER NOT NULL, ghost TEXT NOT NULL, ghost_won INTEGER NOT NULL,
         human TEXT NOT NULL, human_name TEXT NOT NULL, human_hero TEXT NOT NULL
       )`,
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS ghost_games_at ON ghost_games (at)');
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS ghost_games_ghost ON ghost_games (ghost)');
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS ghost_games_human ON ghost_games (human, at)');
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS ghosts_last ON ghosts (last_at)');
    // a ghost remembers which run it came from (a fingerprint; empty for decks saved before that), so saving a run again replaces it
    const hasRun = ctx.storage.sql
      .exec<{ name: string }>("SELECT name FROM pragma_table_info('ghosts')")
      .toArray()
      .some((c) => c.name === 'run');
    if (!hasRun) ctx.storage.sql.exec('ALTER TABLE ghosts ADD COLUMN run TEXT');
    // ... and the Ascendancy its run took (DECISIONS #519)
    const hasAscendancy = ctx.storage.sql
      .exec<{ name: string }>("SELECT name FROM pragma_table_info('ghosts')")
      .toArray()
      .some((c) => c.name === 'ascendancy');
    if (!hasAscendancy) ctx.storage.sql.exec('ALTER TABLE ghosts ADD COLUMN ascendancy TEXT');
    // ... and the Max HP its run had (DECISIONS #538)
    const hasMaxHp = ctx.storage.sql
      .exec<{ name: string }>("SELECT name FROM pragma_table_info('ghosts')")
      .toArray()
      .some((c) => c.name === 'max_hp');
    if (!hasMaxHp) ctx.storage.sql.exec('ALTER TABLE ghosts ADD COLUMN max_hp INTEGER');
    // a run remembers how it ended (null while it is still going; DECISIONS #292)
    const hasEnded = ctx.storage.sql
      .exec<{ name: string }>("SELECT name FROM pragma_table_info('runs')")
      .toArray()
      .some((c) => c.name === 'ended');
    if (!hasEnded) ctx.storage.sql.exec('ALTER TABLE runs ADD COLUMN ended TEXT');
    // the Ascendancy a run took, and each side's in an Arena result, for the boards (DECISIONS #539)
    const columnsOf = (table: string): string[] =>
      ctx.storage.sql
        .exec<{ name: string }>(`SELECT name FROM pragma_table_info('${table}')`)
        .toArray()
        .map((c) => c.name);
    if (!columnsOf('runs').includes('ascendancy'))
      ctx.storage.sql.exec('ALTER TABLE runs ADD COLUMN ascendancy TEXT');
    if (!columnsOf('runs').includes('shards'))
      ctx.storage.sql.exec('ALTER TABLE runs ADD COLUMN shards INTEGER');
    if (!columnsOf('runs').includes('shards_at'))
      ctx.storage.sql.exec('ALTER TABLE runs ADD COLUMN shards_at INTEGER NOT NULL DEFAULT 0');
    // the run's own play clock, shown as the time a completed run took
    if (!columnsOf('runs').includes('play_ms'))
      ctx.storage.sql.exec('ALTER TABLE runs ADD COLUMN play_ms INTEGER');
    const pvpColumns = columnsOf('pvp');
    if (!pvpColumns.includes('winner_asc'))
      ctx.storage.sql.exec('ALTER TABLE pvp ADD COLUMN winner_asc TEXT');
    if (!pvpColumns.includes('loser_asc'))
      ctx.storage.sql.exec('ALTER TABLE pvp ADD COLUMN loser_asc TEXT');
    // The ghosts that can be met and listed: only the latest version of a deck (see ghostSql.ts)
    ctx.storage.sql.exec('DROP VIEW IF EXISTS current_ghosts');
    ctx.storage.sql.exec(CURRENT_GHOSTS_VIEW);
    // a ghost must have cleared Tier 3 (DECISIONS #235): decks saved before that rule are let go (their match history stays)
    if (ctx.storage.kv.get('unclearedGhostsGone') !== true) {
      ctx.storage.sql.exec(`DELETE FROM ghosts WHERE ${UNCLEARED_GHOSTS}`);
      ctx.storage.kv.put('unclearedGhostsGone', true);
    }
    // rows written before the Riftwalkers were named for their class (maren -> knight) are brought up to date (it does nothing once they are)
    const legacy = Object.entries(LEGACY_HERO_IDS);
    // (once per set of renames: the set is kept, so a wake-up does not read every row again, but a new rename, like totemist ->
    // shaman or trapper -> trickster, runs once more; DECISIONS #372)
    const stamp = legacy
      .map(([o, n]) => `${o}>${n}`)
      .sort()
      .join(',');
    const done = ctx.storage.kv.get('heroIdsRenamed') === stamp;
    const rename = (table: string, col: string): void => {
      const cases = legacy.map(([o, n]) => `WHEN '${o}' THEN '${n}'`).join(' ');
      const olds = legacy.map(([o]) => `'${o}'`).join(',');
      ctx.storage.sql.exec(
        `UPDATE ${table} SET ${col} = CASE ${col} ${cases} ELSE ${col} END WHERE ${col} IN (${olds})`,
      );
    };
    if (!done) {
      rename('pvp', 'winner_hero');
      rename('pvp', 'loser_hero');
      rename('runs', 'hero');
      rename('ghosts', 'hero');
      rename('ghost_games', 'human_hero');
      ctx.storage.kv.put('heroIdsRenamed', stamp);
    }
    // usernames: one per player, and no two players share one (compared by `key`, which ignores case and punctuation)
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS names (
         player TEXT PRIMARY KEY, name TEXT NOT NULL, key TEXT NOT NULL UNIQUE, at INTEGER NOT NULL
       )`,
    );
    // Arena trophies (DECISIONS #238): one row per trophy, given for good when a week or month of the Arena board ends
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS trophies (
         player TEXT NOT NULL, kind TEXT NOT NULL, period INTEGER NOT NULL,
         place INTEGER NOT NULL, name TEXT NOT NULL, at INTEGER NOT NULL,
         PRIMARY KEY (player, kind, period)
       )`,
    );
    // Arena ranks (DECISIONS #240): each player's rating in each season (a month); a season with no row yet starts from the last one's
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS ratings (
         player TEXT NOT NULL, season INTEGER NOT NULL,
         rating INTEGER NOT NULL, games INTEGER NOT NULL, wins INTEGER NOT NULL, peak INTEGER NOT NULL,
         name TEXT NOT NULL, hero TEXT NOT NULL, at INTEGER NOT NULL,
         PRIMARY KEY (player, season)
       )`,
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS ratings_board ON ratings (season, rating)');
    // Arena replays (DECISIONS #239): each finished game, kept a while so it can be watched again from a link
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS replays (
         id TEXT PRIMARY KEY, at INTEGER NOT NULL, data TEXT NOT NULL
       )`,
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS replays_at ON replays (at)');
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS shared_reports (id TEXT PRIMARY KEY, at INTEGER NOT NULL, text TEXT NOT NULL)',
    );
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS replay_owners (owner TEXT NOT NULL, id TEXT NOT NULL, at INTEGER NOT NULL, seat TEXT NOT NULL, PRIMARY KEY (owner, id))',
    );
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS replay_keys (game TEXT PRIMARY KEY, id TEXT NOT NULL)',
    );
    // Campaign fights (DECISIONS #697): each account's last few, so a fight can be watched again or shared from a link
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS fight_replays (id TEXT PRIMARY KEY, owner TEXT NOT NULL, at INTEGER NOT NULL, key TEXT NOT NULL, summary TEXT NOT NULL, data TEXT NOT NULL)',
    );
    ctx.storage.sql.exec(
      'CREATE INDEX IF NOT EXISTS fight_replays_owner ON fight_replays (owner, at)',
    );
    // (one fight saved twice, as when the game is reloaded on its result, is kept once)
    ctx.storage.sql.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS fight_replays_key ON fight_replays (owner, key)',
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS fight_replays_at ON fight_replays (at)');
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS balance_games (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, at INTEGER NOT NULL, data TEXT NOT NULL)',
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS balance_games_at ON balance_games (at)');
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS balance_campaign (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, at INTEGER NOT NULL, data TEXT NOT NULL)',
    );
    // (DECISIONS #714) every online Campaign fight, for the owner's balance review: its numbers and its replay, BALANCE_DAYS
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS balance_fights (seq INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL, key TEXT NOT NULL, at INTEGER NOT NULL, len INTEGER NOT NULL, data TEXT NOT NULL)',
    );
    ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS balance_fights_at ON balance_fights (at)');
    ctx.storage.sql.exec(
      'CREATE UNIQUE INDEX IF NOT EXISTS balance_fights_key ON balance_fights (owner, key)',
    );
    // how often a player or an address has done something in the current hour or day
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS limits (
         key TEXT PRIMARY KEY, window INTEGER NOT NULL, n INTEGER NOT NULL
       )`,
    );
  }

  /** Count one more of `key` in its current window, and say whether it is still within `max`. */
  /** Whether `key` still has room in its window, without counting anything (DECISIONS #350). */
  private hasRoom(key: string, windowMs: number, max: number, now: number): boolean {
    const window = Math.floor(now / windowMs);
    const row = this.ctx.storage.sql
      .exec<{ window: number; n: number }>('SELECT window, n FROM limits WHERE key = ?', key)
      .toArray()[0];
    return (row && row.window === window ? row.n : 0) < max;
  }

  private within(key: string, windowMs: number, max: number, now: number): boolean {
    const window = Math.floor(now / windowMs);
    const row = this.ctx.storage.sql
      .exec<{ window: number; n: number }>('SELECT window, n FROM limits WHERE key = ?', key)
      .toArray()[0];
    const n = row && row.window === window ? row.n + 1 : 1;
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO limits (key, window, n) VALUES (?, ?, ?)',
      key,
      window,
      n,
    );
    return n <= max;
  }

  /**
   * Give out the trophies of any week or month that has ended since the last time (each period once: a flag keeps the last one
   * settled). The results of a finished period are still kept (BOARD_KEEP_DAYS is longer than a month), so a period settled late
   * comes out the same.
   */
  private settleTrophies(now: number): void {
    for (const kind of ['week', 'month'] as const) {
      const flag = `trophiesSettled:${kind}`;
      const done = this.ctx.storage.kv.get<number>(flag);
      const last = lastFinished(now, kind);
      if (done === last.from) continue;
      // every period that has ended since the last one settled, oldest first (a quiet week with no visitor after it ends is not
      // skipped); the first time, only the one just gone. Never further back than the results are kept.
      const due: { from: number; to: number }[] = [];
      const oldest = now - BOARD_KEEP_DAYS * DAY;
      for (
        let p = last;
        p.from > (done ?? last.from - 1) && p.from >= oldest;
        p = lastFinished(p.from, kind)
      ) {
        due.unshift(p);
        if (done === undefined) break;
      }
      for (const p of due)
        for (const w of trophyWinners(this.pvpRows(p.from, p.to)))
          this.ctx.storage.sql.exec(
            'INSERT OR IGNORE INTO trophies (player, kind, period, place, name, at) VALUES (?, ?, ?, ?, ?, ?)',
            w.player,
            kind,
            p.from,
            w.place,
            w.name,
            now,
          );
      this.ctx.storage.kv.put(flag, last.from);
    }
  }

  /** Each player's trophy counts, for the players asked about (a player with none is left out). */
  private trophyCounts(players: readonly string[]): Map<string, TrophyCount> {
    const out = new Map<string, TrophyCount>();
    const ids = [...new Set(players)];
    // (in groups: SQLite here takes at most 100 bound values in one statement)
    for (let i = 0; i < ids.length; i += 50) {
      const group = ids.slice(i, i + 50);
      const rows = this.ctx.storage.sql
        .exec<{ player: string; kind: string; n: number }>(
          `SELECT player, kind, COUNT(*) AS n FROM trophies WHERE player IN (${group.map(() => '?').join(',')}) GROUP BY player, kind`,
          ...group,
        )
        .toArray();
      for (const r of rows) {
        const c = out.get(r.player) ?? { week: 0, month: 0 };
        if (r.kind === 'week') c.week = r.n;
        else if (r.kind === 'month') c.month = r.n;
        out.set(r.player, c);
      }
    }
    return out;
  }

  /** A player's trophies, newest first (for the Trophy case). */
  private trophiesOf(player: string): Trophy[] {
    return this.ctx.storage.sql
      .exec<{ kind: string; period: number; place: number; name: string }>(
        'SELECT kind, period, place, name FROM trophies WHERE player = ? ORDER BY period DESC, kind DESC LIMIT 500',
        player,
      )
      .toArray()
      .map((t) => ({
        kind: t.kind === 'month' ? 'month' : 'week',
        period: t.period,
        place: t.place,
        name: t.name,
      }));
  }

  /** The Arena results in [from, to), one row per player per match. */
  private pvpRows(from: number, to = Number.MAX_SAFE_INTEGER): PvpRow[] {
    const rows = this.ctx.storage.sql
      .exec<{
        winner: string;
        winner_name: string;
        winner_hero: string;
        loser: string;
        loser_name: string;
        loser_hero: string;
        winner_asc: string | null;
        loser_asc: string | null;
        at: number;
      }>('SELECT * FROM pvp WHERE at >= ? AND at < ? ORDER BY at LIMIT 20000', from, to)
      .toArray();
    return rows.flatMap((r): PvpRow[] => [
      {
        player: r.winner,
        name: r.winner_name,
        hero: r.winner_hero,
        ascendancy: r.winner_asc,
        won: true,
        at: r.at,
      },
      {
        player: r.loser,
        name: r.loser_name,
        hero: r.loser_hero,
        ascendancy: r.loser_asc,
        won: false,
        at: r.at,
      },
    ]);
  }

  /** Throw out what no board can show any more. */
  private prune(now: number): void {
    const before = now - BOARD_KEEP_DAYS * DAY;
    this.ctx.storage.sql.exec('DELETE FROM pvp WHERE at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM runs WHERE at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM ghost_games WHERE at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM ghosts WHERE last_at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM limits WHERE window < ?', Math.floor(before / DAY));
    // (ratings: a season is only ever carried over from the one before, so older ones can go)
    this.ctx.storage.sql.exec('DELETE FROM ratings WHERE season < ?', before);
  }

  // ---- Arena ranks ----

  /** A player's rating in a season: their row, or (none yet) carried over from their latest earlier season, or the start. */
  private ratingOf(player: string, season: number): RankBadge & { wins: number; peak: number } {
    const row = this.ctx.storage.sql
      .exec<{ rating: number; games: number; wins: number; peak: number }>(
        'SELECT rating, games, wins, peak FROM ratings WHERE player = ? AND season = ?',
        player,
        season,
      )
      .toArray()[0];
    if (row) return row;
    const before = this.ctx.storage.sql
      .exec<{ rating: number }>(
        'SELECT rating FROM ratings WHERE player = ? AND season < ? ORDER BY season DESC LIMIT 1',
        player,
        season,
      )
      .toArray()[0];
    const rating = before ? carryOver(before.rating) : RATING_START;
    return { rating, games: 0, wins: 0, peak: rating };
  }

  /** A counted Arena match moves both players' ratings for the season it was played in. */
  private rate(
    w: { id: string; name: string; hero: string },
    l: { id: string; name: string; hero: string },
    now: number,
  ): void {
    const season = seasonOf(now);
    const a = this.ratingOf(w.id, season);
    const b = this.ratingOf(l.id, season);
    const moved = rateMatch(a, b);
    const put = (
      p: { id: string; name: string; hero: string },
      was: { games: number; wins: number; peak: number },
      rating: number,
      won: boolean,
    ): void => {
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO ratings (player, season, rating, games, wins, peak, name, hero, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p.id,
        season,
        rating,
        was.games + 1,
        was.wins + (won ? 1 : 0),
        Math.max(was.peak, rating),
        p.name,
        p.hero,
        now,
      );
    };
    put(w, a, moved.winner, true);
    put(l, b, moved.loser, false);
  }

  /** The rank badges of the players asked about, this season (for their cards in a match). */
  private rankBadges(players: readonly string[], now: number): Map<string, RankBadge> {
    const season = seasonOf(now);
    const out = new Map<string, RankBadge>();
    for (const p of new Set(players)) {
      const r = this.ratingOf(p, season);
      out.set(p, { rating: r.rating, games: r.games });
    }
    return out;
  }

  /** The season's ranked board: the highest ratings among players with a few ranked games, and where the asker stands. */
  private rankBoard(now: number, player?: string): unknown {
    const season = seasonOf(now);
    const rows = this.ctx.storage.sql
      .exec<{
        player: string;
        name: string;
        hero: string;
        rating: number;
        games: number;
        wins: number;
        peak: number;
      }>(
        'SELECT player, name, hero, rating, games, wins, peak FROM ratings WHERE season = ? AND games >= ? ORDER BY rating DESC, peak DESC, at ASC LIMIT ?',
        season,
        RANKED_MIN_GAMES,
        BOARD_SIZE,
      )
      .toArray();
    const board: RankedStanding[] = rows.map((r) => ({
      name: this.claimedName(r.player) ?? r.name,
      hero: r.hero,
      rating: r.rating,
      games: r.games,
      wins: r.wins,
      peak: r.peak,
    }));
    let you: unknown = null;
    if (player) {
      const r = this.ratingOf(player, season);
      const above = this.count(
        'SELECT COUNT(*) AS n FROM ratings WHERE season = ? AND games >= ? AND rating > ?',
        season,
        RANKED_MIN_GAMES,
        r.rating,
      );
      you = {
        rating: r.rating,
        games: r.games,
        wins: r.wins,
        peak: r.peak,
        place: r.games >= RANKED_MIN_GAMES ? above + 1 : null,
      };
    }
    return { ok: true, season, board, you };
  }

  // ---- Arena replays ----

  /** Keep a finished game (only a room sends one): it gets an id a link can carry. */
  private saveReplay(body: Record<string, unknown>, now: number): Response {
    // (each player in it may have so many games kept a day: a script playing itself cannot push everyone's replays out)
    const owners = Array.isArray(body['owners']) ? body['owners'].filter(isId) : [];
    const b = body['replay'];
    if (owners.length === 0 || typeof b !== 'object' || b === null)
      return json({ ok: false, error: 'bad-replay' }, 400);
    const key = typeof body['key'] === 'string' && body['key'].length <= 200 ? body['key'] : null;
    if (key) {
      const prior = this.ctx.storage.sql
        .exec<{ id: string }>(
          'SELECT k.id FROM replay_keys k JOIN replays r ON r.id = k.id WHERE k.game = ?',
          key,
        )
        .toArray()[0];
      if (prior) return json({ ok: true, id: prior.id });
    }
    if (!owners.every((o) => this.within(`replay:${o}`, DAY, REPLAYS_PER_DAY, now)))
      return json({ ok: false, error: 'limited' });
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const id = Array.from(bytes, (x) => abc[x % abc.length]).join('');
    const data = JSON.stringify({ ...(b as Record<string, unknown>), id, at: now });
    // (a game is a few kilobytes; one that is not is not kept)
    if (data.length > 400_000) return json({ ok: false, error: 'too-big' }, 413);
    this.ctx.storage.sql.exec('INSERT INTO replays (id, at, data) VALUES (?, ?, ?)', id, now, data);
    if (key)
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO replay_keys (game, id) VALUES (?, ?)',
        key,
        id,
      );
    for (const owner of new Set(owners)) {
      const seats = body['ownerSeats'] as Record<string, unknown> | undefined;
      this.ctx.storage.sql.exec(
        'INSERT INTO replay_owners (owner, id, at, seat) VALUES (?, ?, ?, ?)',
        owner,
        id,
        now,
        seats?.[owner] === 'b' ? 'b' : 'a',
      );
      this.ctx.storage.sql.exec(
        'DELETE FROM replay_owners WHERE owner = ? AND id NOT IN (SELECT id FROM replay_owners WHERE owner = ? ORDER BY at DESC, rowid DESC LIMIT ?)',
        owner,
        owner,
        RECENT_REPLAYS,
      );
    }
    // the oldest go: past their time, or past the most kept
    this.ctx.storage.sql.exec(
      'DELETE FROM replays WHERE at < ? AND id NOT IN (SELECT id FROM replay_owners)',
      now - REPLAY_KEEP_DAYS * DAY,
    );
    const n = this.count('SELECT COUNT(*) AS n FROM replays');
    if (n > REPLAY_MAX)
      this.ctx.storage.sql.exec(
        'DELETE FROM replays WHERE id IN (SELECT id FROM replays WHERE id NOT IN (SELECT id FROM replay_owners) ORDER BY at ASC LIMIT ?)',
        n - REPLAY_MAX,
      );
    this.ctx.storage.sql.exec('DELETE FROM replay_keys WHERE id NOT IN (SELECT id FROM replays)');
    return json({ ok: true, id });
  }

  private replay(id: string | null): Response {
    if (!id || !REPLAY_ID.test(id)) return json({ ok: false, error: 'not-found' }, 404);
    const row = this.ctx.storage.sql
      .exec<{ data: string }>('SELECT data FROM replays WHERE id = ?', id)
      .toArray()[0];
    if (!row) return json({ ok: false, error: 'not-found' }, 404);
    return new Response(`{"ok":true,"replay":${row.data}}`, {
      headers: { 'content-type': 'application/json' },
    });
  }

  // ---- Campaign fights (DECISIONS #697) ----

  /** Keep a finished Campaign fight for its player: the newest FIGHTS_KEPT stay, older ones go. */
  private saveFight(body: Record<string, unknown>, now: number): Response {
    const owner = body['player'];
    const f = body['fight'];
    if (!isId(owner) || !isId(body['ip']) || !isRecord(f))
      return json({ ok: false, error: 'bad-fight' }, 400);
    const replay = f['replay'];
    const setup = isRecord(replay) ? replay['setup'] : null;
    const shortText = (v: unknown, max: number): v is string =>
      typeof v === 'string' && v.length > 0 && v.length <= max;
    const optText = (v: unknown, max: number): boolean => v === undefined || shortText(v, max);
    if (
      !isRecord(replay) ||
      !isRecord(setup) ||
      !shortText(setup['seed'], 200) ||
      !Array.isArray(replay['moves']) ||
      replay['moves'].length > 6000 ||
      typeof f['rules'] !== 'number' ||
      !Number.isInteger(f['rules']) ||
      !shortText(f['title'], 200) ||
      typeof f['won'] !== 'boolean' ||
      typeof f['tier'] !== 'number' ||
      !Number.isInteger(f['tier']) ||
      !shortText(f['hero'], 40) ||
      !optText(f['version'], 40) ||
      !optText(f['ascendancy'], 40)
    )
      return json({ ok: false, error: 'bad-fight' }, 400);
    // (the fight's seed names it: the same fight sent again gets the link it already has)
    const key = setup['seed'];
    const known = this.ctx.storage.sql
      .exec<{ id: string }>('SELECT id FROM fight_replays WHERE owner = ? AND key = ?', owner, key)
      .toArray()[0];
    if (known) return json({ ok: true, id: known.id });
    if (
      !this.within(`fight:${owner}`, DAY, FIGHTS_PER_DAY, now) ||
      !this.within(`fight-ip:${body['ip']}`, DAY, FIGHTS_PER_IP_DAY, now)
    )
      return json({ ok: false, error: 'limited' });
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const id = Array.from(bytes, (x) => abc[x % abc.length]).join('');
    // (only what is known is kept, in a known shape: anything else sent along is dropped)
    const summary = {
      id,
      at: now,
      title: f['title'],
      won: f['won'],
      rules: f['rules'],
      version: f['version'],
      hero: f['hero'],
      ascendancy: f['ascendancy'],
      tier: f['tier'],
    };
    const data = JSON.stringify({ ...summary, replay });
    if (data.length > FIGHT_MAX_CHARS) return json({ ok: false, error: 'too-big' }, 413);
    this.keepBalanceFight(owner, key, f, summary, replay, now);
    this.ctx.storage.sql.exec(
      'INSERT INTO fight_replays (id, owner, at, key, summary, data) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      owner,
      now,
      key,
      JSON.stringify(summary),
      data,
    );
    this.ctx.storage.sql.exec(
      'DELETE FROM fight_replays WHERE owner = ? AND id NOT IN (SELECT id FROM fight_replays WHERE owner = ? ORDER BY at DESC, rowid DESC LIMIT ?)',
      owner,
      owner,
      FIGHTS_KEPT,
    );
    // past the total, the oldest fights anyone kept are let go, a hundred at a time
    for (
      let i = 0;
      i < 20 &&
      this.count('SELECT COALESCE(SUM(length(data)), 0) AS n FROM fight_replays') >
        FIGHTS_TOTAL_CHARS;
      i++
    )
      this.ctx.storage.sql.exec(
        'DELETE FROM fight_replays WHERE id IN (SELECT id FROM fight_replays ORDER BY at ASC, rowid ASC LIMIT 100)',
      );
    return json({ ok: true, id });
  }

  /**
   * (DECISIONS #714) The owner's copy of a Campaign fight for balance review: kept BALANCE_DAYS whatever the player's own ten do, with the
   * stats the client worked out (checked for shape) and where on the map it was. Only known fields are kept.
   */
  private keepBalanceFight(
    owner: string,
    key: string,
    f: Record<string, unknown>,
    summary: Record<string, unknown>,
    replay: unknown,
    now: number,
  ): void {
    const short = (v: unknown, max: number): string | undefined =>
      typeof v === 'string' && v.length > 0 && v.length <= max ? v : undefined;
    const floor = f['floor'];
    const row = {
      ...summary,
      encounter: short(f['encounter'], 80),
      node: short(f['node'], 40),
      floor:
        typeof floor === 'number' && Number.isInteger(floor) && floor >= 0 && floor < 1000
          ? floor
          : undefined,
      stats: cleanFightStats(f['stats']) ?? undefined,
      replay,
    };
    const data = JSON.stringify(row);
    this.ctx.storage.sql.exec(
      'INSERT OR IGNORE INTO balance_fights (owner, key, at, len, data) VALUES (?, ?, ?, ?, ?)',
      owner,
      key,
      now,
      data.length,
      data,
    );
    this.ctx.storage.sql.exec('DELETE FROM balance_fights WHERE at < ?', now - BALANCE_DAYS * DAY);
    // (the total is checked now and then, not on every fight, from the small len column (never the text itself); past it the oldest go,
    // as many as bring it back under in one statement)
    if (Math.random() < 0.02) {
      const over =
        this.count('SELECT COALESCE(SUM(len), 0) AS n FROM balance_fights') -
        BALANCE_FIGHTS_TOTAL_CHARS;
      if (over > 0)
        this.ctx.storage.sql.exec(
          'DELETE FROM balance_fights WHERE seq <= (SELECT seq FROM (SELECT seq, SUM(len) OVER (ORDER BY seq) AS run FROM balance_fights) WHERE run >= ? ORDER BY seq LIMIT 1)',
          over,
        );
    }
  }

  /** One kept fight, for anyone with its link. */
  private fight(id: string | null): Response {
    if (!id || !FIGHT_ID.test(id)) return json({ ok: false, error: 'not-found' }, 404);
    const row = this.ctx.storage.sql
      .exec<{ data: string }>('SELECT data FROM fight_replays WHERE id = ?', id)
      .toArray()[0];
    if (!row) return json({ ok: false, error: 'not-found' }, 404);
    return new Response(`{"ok":true,"fight":${row.data}}`, {
      headers: { 'content-type': 'application/json' },
    });
  }

  /** A player's kept fights, newest first: what each was, not its moves (those come with its link). */
  private recentFights(player: unknown): Response {
    if (!isId(player)) return json({ ok: false }, 401);
    const rows = this.ctx.storage.sql
      .exec<{ summary: string }>(
        'SELECT summary FROM fight_replays WHERE owner = ? ORDER BY at DESC, rowid DESC LIMIT ?',
        player,
        FIGHTS_KEPT,
      )
      .toArray();
    return new Response(`{"ok":true,"fights":[${rows.map((r) => r.summary).join(',')}]}`, {
      headers: { 'content-type': 'application/json' },
    });
  }

  private count(sql: string, ...args: SqlStorageValue[]): number {
    return this.ctx.storage.sql.exec<{ n: number }>(sql, ...args).one().n;
  }

  // ---- ghosts ----

  /** A deck's id: one ghost per run (a hash of whose it is and which run), so saving the same run again replaces its ghost; a deck with no run (an older client) is told apart by what is in it. */
  private async deckId(owner: string, e: Entry): Promise<string> {
    const text = e.run
      ? `${owner}|run|${e.run}`
      : `${owner}|${e.hero}|${[...e.deck].sort().join(',')}|${[...e.boons].sort().join(',')}`;
    const bytes = new TextEncoder().encode(`shattered-rifts-ghost:${text}`);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return Array.from(hash, (x) => x.toString(16).padStart(2, '0')).join('');
  }

  /** Remember a deck that has played in the Arena (so it can be met as a ghost), adding this match to its record if there is one. */
  private async registerDeck(
    owner: string,
    entry: unknown,
    now: number,
    result: 'win' | 'loss' | null,
  ): Promise<boolean> {
    const checked = checkEntry(entry);
    if (!checked.ok) return false;
    const e = checked.entry;
    // (a deck that has not cleared Tier 3 plays in the Arena, but is not kept as a ghost: DECISIONS #235)
    if (!ghostCleared(e.tier, e.stage ?? null)) return false;
    const id = await this.deckId(owner, e);
    const name = cleanBoardName(e.name);
    const wins = result === 'win' ? 1 : 0;
    const losses = result === 'loss' ? 1 : 0;
    if (this.count('SELECT COUNT(*) AS n FROM ghosts WHERE id = ?', id) > 0) {
      this.ctx.storage.sql.exec(
        'UPDATE ghosts SET owner_name = ?, hero = ?, deck = ?, boons = ?, ascendancy = ?, max_hp = COALESCE(?, max_hp), run = ?, tier = ?, stage = ?, wins = wins + ?, losses = losses + ?, last_at = ? WHERE id = ?',
        name,
        e.hero,
        JSON.stringify(e.deck),
        JSON.stringify(e.boons),
        e.ascendancy ?? null,
        e.maxHp ?? null,
        e.run ?? null,
        e.tier,
        e.stage ?? null,
        wins,
        losses,
        now,
        id,
      );
      return true;
    }
    this.ctx.storage.sql.exec(
      'INSERT INTO ghosts (id, owner, owner_name, hero, deck, boons, ascendancy, max_hp, run, tier, stage, wins, losses, first_at, last_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      owner,
      name,
      e.hero,
      JSON.stringify(e.deck),
      JSON.stringify(e.boons),
      e.ascendancy ?? null,
      e.maxHp ?? null,
      e.run ?? null,
      e.tier,
      e.stage ?? null,
      wins,
      losses,
      now,
      now,
    );
    return true;
  }

  /** A deck a player saved becomes a ghost others can meet, even before it has played a match. */
  private async registerSaved(b: Record<string, unknown>, now: number): Promise<Response> {
    if (!isId(b['owner'])) return json({ ok: false, error: 'bad-request' }, 400);
    if (!this.within(`ghost-save:${b['owner']}`, HOUR, 30, now))
      return json({ ok: true, registered: false });
    const checked = checkEntry(b['entry']);
    if (!checked.ok) return json({ ok: true, registered: false });
    const kept = await this.registerDeck(b['owner'], checked.entry, now, null);
    return json({ ok: true, registered: kept });
  }

  /**
   * A ghost to stand in for a campaign Warden or Echo: a recent nearby-tier deck, never the asker's own, whatever its
   * Riftwalker. Its cards and Boons go to the player for that one fight (they are played against them), nothing about its owner but a name.
   */
  private ghostBoss(b: Record<string, unknown>, now: number): Response {
    const requester = isId(b['requester']) ? b['requester'] : null;
    if (requester && !this.within(`ghost-boss:${requester}`, HOUR, 30, now))
      return json({ ok: true, ghost: null, limited: true });
    // (and by address, so someone with no id cannot ask over and over to collect the decks)
    const ip = typeof b['ip'] === 'string' ? b['ip'].slice(0, 64) : 'unknown';
    if (!this.within(`ghost-boss-ip:${ip}`, HOUR, 40, now))
      return json({ ok: true, ghost: null, limited: true });
    const rows = this.ctx.storage.sql
      .exec<GhostSql>(
        `SELECT id, owner, owner_name, hero, '' AS deck, '' AS boons, ascendancy, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at
           FROM current_ghosts WHERE last_at >= ?
          ORDER BY last_at DESC, id ASC LIMIT 400`,
        now - 31 * DAY,
      )
      .toArray();
    const tier = typeof b['tier'] === 'number' && Number.isInteger(b['tier']) ? b['tier'] : 1;
    const exclude = Array.isArray(b['exclude'])
      ? (b['exclude'] as unknown[])
          .filter((x): x is string => typeof x === 'string' && x.length <= 80)
          .slice(0, GHOST_BOSS_EXCLUDE_MAX)
      : [];
    const requesters = Array.isArray(b['requesters'])
      ? (b['requesters'] as unknown[]).filter(isId).slice(0, 4)
      : [];
    const name = typeof b['name'] === 'string' ? b['name'].slice(0, 40) : undefined;
    const chosen = pickGhostBoss(rows.map(toDeck), {
      requester,
      requesters,
      ...(name ? { name } : {}),
      tier,
      exclude,
      roll: Math.random(),
      now,
    });
    if (!chosen) return json({ ok: true, ghost: null });
    const row = this.ctx.storage.sql
      .exec<GhostSql>('SELECT * FROM ghosts WHERE id = ?', chosen.id)
      .toArray()[0];
    if (!row) return json({ ok: true, ghost: null });
    return json({
      ok: true,
      ghost: {
        id: row.id,
        name: row.owner_name,
        hero: storedHero(row.hero),
        deck: parseList(row.deck),
        boons: parseList(row.boons),
        ...(row.ascendancy ? { ascendancy: row.ascendancy } : {}),
        ...(row.max_hp ? { maxHp: row.max_hp } : {}),
        tier: row.tier,
        stage: row.stage,
      },
    });
  }

  /** The ghost for someone to face: one of the better decks (the upper half by wins) that is not the deck they play. */
  private async pick(b: Record<string, unknown>, now: number): Promise<Response> {
    if (!isId(b['requester'])) return json({ ok: false, error: 'bad-request' }, 400);
    // asking for ghosts over and over is limited (a ghost match is a match, not something to be refreshed)
    if (!this.within(`ghost-ask:${b['requester']}`, HOUR, GHOST_ASKS_PER_HOUR, now))
      return json({ ok: true, ghost: null, limited: true });
    // only what is ranked is read (not the cards), and only the best of them: the upper half is taken from these
    const rows = this.ctx.storage.sql
      .exec<GhostSql>(
        `SELECT id, owner, owner_name, hero, '' AS deck, '' AS boons, ascendancy, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at
           FROM current_ghosts WHERE last_at >= ?
          ORDER BY (wins + ghost_wins) DESC, last_at DESC LIMIT 400`,
        now - 31 * DAY,
      )
      .toArray();
    // the asker's exact deck is never met as a ghost; their other decks may be
    const checked = checkEntry(b['entry']);
    const own = checked.ok ? await this.deckId(b['requester'], checked.entry) : null;
    const chosen = pickGhost(rows.map(toDeck), own, Math.random(), now);
    if (!chosen) return json({ ok: true, ghost: null });
    const row = this.ctx.storage.sql
      .exec<GhostSql>('SELECT * FROM ghosts WHERE id = ?', chosen.id)
      .toArray()[0];
    if (!row) return json({ ok: true, ghost: null });
    return json({
      ok: true,
      ghost: {
        id: row.id,
        owner: row.owner,
        entry: {
          name: `${row.owner_name}'s ghost`,
          hero: storedHero(row.hero),
          deck: parseList(row.deck),
          boons: parseList(row.boons),
          ...(row.ascendancy ? { ascendancy: row.ascendancy } : {}),
          tier: row.tier,
          ...(row.stage === null ? {} : { stage: row.stage }),
        },
      },
    });
  }

  /** A match between a person and a ghost has ended. */
  private ghostResult(b: Record<string, unknown>, now: number): Response {
    const h = b['human'] as Record<string, unknown> | undefined;
    if (
      !h ||
      typeof b['ghost'] !== 'string' ||
      !isId(h['id']) ||
      !isHero(h['hero']) ||
      typeof b['ghostWon'] !== 'boolean'
    )
      return json({ ok: false, error: 'bad-result' }, 400);
    const known = this.count('SELECT COUNT(*) AS n FROM ghosts WHERE id = ?', b['ghost']);
    if (!known) return json({ ok: true, counted: false });
    // a person's wins against ghosts in a day are capped, so one ghost cannot be farmed (their losses always count)
    if (
      b['ghostWon'] === false &&
      this.count(
        'SELECT COUNT(*) AS n FROM ghost_games WHERE human = ? AND ghost_won = 0 AND at > ?',
        h['id'],
        now - DAY,
      ) >= GHOST_WINS_PER_DAY
    )
      return json({ ok: true, counted: false });
    this.ctx.storage.sql.exec(
      'INSERT INTO ghost_games (at, ghost, ghost_won, human, human_name, human_hero) VALUES (?, ?, ?, ?, ?, ?)',
      now,
      b['ghost'],
      b['ghostWon'] ? 1 : 0,
      h['id'],
      cleanBoardName(h['name']),
      storedHero(h['hero']),
    );
    this.ctx.storage.sql.exec(
      b['ghostWon']
        ? 'UPDATE ghosts SET ghost_wins = ghost_wins + 1 WHERE id = ?'
        : 'UPDATE ghosts SET ghost_losses = ghost_losses + 1 WHERE id = ?',
      b['ghost'],
    );
    this.prune(now);
    return json({ ok: true, counted: true });
  }

  private ghostBoard(period: Period, now: number, player?: string): unknown {
    const from = periodStart(now, period);
    const rows = this.ctx.storage.sql
      .exec<{
        ghost: string;
        ghost_won: number;
        human: string;
        human_name: string;
        human_hero: string;
        at: number;
        owner_name: string;
        hero: string;
        ascendancy: string | null;
        tier: number;
        stage: number | null;
      }>(
        `SELECT g.ghost, g.ghost_won, g.human, g.human_name, g.human_hero, g.at,
                d.owner_name, d.hero, d.ascendancy, d.tier, d.stage
           FROM ghost_games g JOIN current_ghosts d ON d.id = g.ghost
          WHERE g.at >= ? LIMIT 20000`,
        from,
      )
      .toArray();
    const games: GhostGame[] = rows.map((r) => ({
      ghost: r.ghost,
      ownerName: r.owner_name,
      hero: r.hero,
      ascendancy: boardAscendancy(r.hero, r.ascendancy),
      tier: r.tier,
      stage: r.stage,
      ghostWon: r.ghost_won === 1,
      human: r.human,
      humanName: r.human_name,
      humanHero: r.human_hero,
      at: r.at,
    }));
    const decks = this.count(
      'SELECT COUNT(*) AS n FROM current_ghosts WHERE last_at >= ?',
      now - 31 * DAY,
    );
    const all = standingsVsGhosts(games);
    return {
      ok: true,
      period,
      from,
      decks,
      ghosts: rankGhosts(games),
      players: all.slice(0, BOARD_SIZE).map(withoutPlayer),
      you: this.placeOf(all, player),
    };
  }

  /**
   * The decks that can be met as ghosts, for the Ghost decks page: whose, which Riftwalker, how far it got and how it has done. Never
   * the cards, the Boons, the owner's id or the deck's id: only what a player may know before fighting it.
   */
  private ghostDecks(now: number): Record<string, unknown> {
    const rows = this.ctx.storage.sql
      .exec<GhostSql>(
        `SELECT id, owner, owner_name, hero, '' AS deck, '' AS boons, ascendancy, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at
           FROM current_ghosts WHERE last_at >= ? ORDER BY last_at DESC LIMIT 200`,
        now - 31 * DAY,
      )
      .toArray();
    return {
      ok: true,
      decks: rows.map((r) => ({
        name: r.owner_name,
        hero: r.hero,
        ...(r.ascendancy ? { ascendancy: r.ascendancy } : {}),
        tier: r.tier,
        stage: r.stage,
        wins: r.wins,
        losses: r.losses,
        ghostWins: r.ghost_wins,
        ghostLosses: r.ghost_losses,
        lastAt: r.last_at,
      })),
    };
  }

  /**
   * (DECISIONS #723) A player's saved decks, by their username: public (Robert: "i want player decks to be public"), reached from an
   * unlisted page. Every deck they have saved that cleared Tier 3 (one per run; earlier ones are not kept, #235), with its cards, Boons and how far it went, and their runs on the board.
   */
  private playerDecks(name: string | null): Record<string, unknown> {
    if (!name || name.length > 40) return { ok: false, error: 'bad-name' };
    const checked = checkUsername(name);
    const player = checked.ok
      ? this.ctx.storage.sql
          .exec<{ player: string; name: string }>(
            'SELECT player, name FROM names WHERE key = ?',
            checked.key,
          )
          .toArray()[0]
      : undefined;
    // (a claimed name is that player's decks only; a name nobody holds now finds the decks saved under it, so a player who changed
    // name is still found by the old one, and someone who takes a freed name never shows the old holder's decks as theirs)
    const cols = `id, owner, owner_name, hero, deck, boons, ascendancy, max_hp, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at`;
    const rows = (
      player
        ? this.ctx.storage.sql.exec<GhostSql>(
            `SELECT ${cols} FROM ghosts WHERE owner = ? ORDER BY last_at DESC LIMIT 60`,
            player.player,
          )
        : this.ctx.storage.sql.exec<GhostSql>(
            `SELECT ${cols} FROM ghosts WHERE owner_name = ? COLLATE NOCASE ORDER BY last_at DESC LIMIT 60`,
            name.trim(),
          )
    ).toArray();
    const runs = player
      ? this.ctx.storage.sql
          .exec<{ hero: string; tier: number; stage: number; at: number }>(
            'SELECT hero, tier, stage, at FROM runs WHERE player = ? ORDER BY at DESC LIMIT 20',
            player.player,
          )
          .toArray()
      : [];
    return {
      ok: true,
      name: player?.name ?? rows[0]?.owner_name ?? name.trim(),
      found: !!player || rows.length > 0,
      decks: rows.map((r) => ({
        hero: storedHero(r.hero),
        ...(r.ascendancy ? { ascendancy: r.ascendancy } : {}),
        tier: r.tier,
        stage: r.stage,
        maxHp: r.max_hp ?? null,
        cards: parseList(r.deck),
        boons: parseList(r.boons),
        wins: r.wins,
        losses: r.losses,
        ghostWins: r.ghost_wins,
        ghostLosses: r.ghost_losses,
        savedAt: r.last_at,
      })),
      runs: runs.map((r) => ({ hero: storedHero(r.hero), tier: r.tier, stage: r.stage, at: r.at })),
    };
  }

  /** Where `player` stands in a full ranking: their place and their line, whether or not they are in the part that is shown. */
  private placeOf<T extends { player: string }>(
    all: readonly T[],
    player: string | undefined,
  ): (Omit<T, 'player'> & { rank: number }) | null {
    if (!player) return null;
    const i = all.findIndex((x) => x.player === player);
    const at = all[i];
    return i < 0 || !at ? null : { rank: i + 1, ...withoutPlayer(at) };
  }

  // ---- the Arena board ----

  private async recordPvp(b: Record<string, unknown>, now: number): Promise<Response> {
    const w = b['winner'] as Record<string, unknown> | undefined;
    const l = b['loser'] as Record<string, unknown> | undefined;
    if (!w || !l || !isId(w['id']) || !isId(l['id']) || !isHero(w['hero']) || !isHero(l['hero']))
      return json({ ok: false, error: 'bad-result' }, 400);
    const wid = w['id'];
    const lid = l['id'];
    // the decks that played are remembered as ghosts whether or not the result counts; a counted result is added to their records
    const remember = async (result: boolean): Promise<void> => {
      await this.registerDeck(wid, w['entry'], now, result ? 'win' : null);
      await this.registerDeck(lid, l['entry'], now, result ? 'loss' : null);
    };
    // nobody plays themselves, the same pair counts only so often in a day, and a player's wins in a day are capped
    const notCounted = async (): Promise<Response> => {
      await remember(false);
      return json({ ok: true, counted: false });
    };
    if (wid === lid) return json({ ok: true, counted: false });
    if (
      this.count(
        'SELECT COUNT(*) AS n FROM pvp WHERE winner = ? AND loser = ? AND at > ?',
        wid,
        lid,
        now - DAY,
      ) >= SAME_FOE_PER_DAY
    )
      return notCounted();
    if (
      this.count('SELECT COUNT(*) AS n FROM pvp WHERE winner = ? AND at > ?', wid, now - DAY) >=
      WINS_PER_DAY
    )
      return notCounted();
    this.ctx.storage.sql.exec(
      'INSERT INTO pvp (at, winner, winner_name, winner_hero, winner_asc, loser, loser_name, loser_hero, loser_asc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      now,
      wid,
      this.claimedName(wid) ?? cleanBoardName(w['name']),
      storedHero(w['hero']),
      boardAscendancy(
        w['hero'],
        (w['entry'] as Record<string, unknown> | undefined)?.['ascendancy'],
      ),
      lid,
      this.claimedName(lid) ?? cleanBoardName(l['name']),
      storedHero(l['hero']),
      boardAscendancy(
        l['hero'],
        (l['entry'] as Record<string, unknown> | undefined)?.['ascendancy'],
      ),
    );
    await remember(true);
    // (a counted match is a ranked one: both ratings move)
    this.rate(
      {
        id: wid,
        name: this.claimedName(wid) ?? cleanBoardName(w['name']),
        hero: storedHero(w['hero']),
      },
      {
        id: lid,
        name: this.claimedName(lid) ?? cleanBoardName(l['name']),
        hero: storedHero(l['hero']),
      },
      now,
    );
    this.prune(now);
    return json({ ok: true, counted: true });
  }

  /** The username this player has claimed, if any (it is what the boards show for them). */
  private claimedName(player: string): string | null {
    const row = this.ctx.storage.sql
      .exec<{ name: string }>('SELECT name FROM names WHERE player = ?', player)
      .toArray()[0];
    return row?.name ?? null;
  }

  /** A player claims a username. It must be free (or already theirs); a player has one at a time, and changing it frees the old one. */
  private claimName(b: Record<string, unknown>, now: number): Response {
    const player = b['player'];
    const ip = isAddr(b['ip']) ? b['ip'] : 'unknown';
    if (!isId(player)) return json({ ok: false, error: 'bad-player' }, 400);
    const checked = checkUsername(b['name']);
    if (!checked.ok) return json({ ok: false, error: 'bad-name', message: checked.message }, 200);
    const mine = this.ctx.storage.sql
      .exec<{ name: string; key: string }>('SELECT name, key FROM names WHERE player = ?', player)
      .toArray()[0];
    // asking for the name you already have changes nothing
    if (mine && mine.name === checked.name) return json({ ok: true, name: checked.name });
    if (!mine || mine.key !== checked.key) {
      if (
        !this.within(`name:${player}`, DAY, NAME_CLAIMS_PER_DAY, now) ||
        !this.within(`ip-name:${ip}`, DAY, IP_NAME_CLAIMS_PER_DAY, now)
      )
        return json({
          ok: false,
          error: 'limited',
          message: 'Too many name changes today. Try again tomorrow.',
        });
    }
    const taken = this.ctx.storage.sql
      .exec<{ player: string }>('SELECT player FROM names WHERE key = ?', checked.key)
      .toArray()[0];
    if (taken && taken.player !== player)
      return json({ ok: false, error: 'taken', message: 'That name is taken. Choose another.' });
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO names (player, name, key, at) VALUES (?, ?, ?, ?)',
      player,
      checked.name,
      checked.key,
      now,
    );
    // what this player has already done on the boards carries the name they hold now
    const sql = this.ctx.storage.sql;
    sql.exec('UPDATE runs SET name = ? WHERE player = ?', checked.name, player);
    sql.exec('UPDATE pvp SET winner_name = ? WHERE winner = ?', checked.name, player);
    sql.exec('UPDATE pvp SET loser_name = ? WHERE loser = ?', checked.name, player);
    sql.exec('UPDATE ghosts SET owner_name = ? WHERE owner = ?', checked.name, player);
    sql.exec('UPDATE ghost_games SET human_name = ? WHERE human = ?', checked.name, player);
    return json({ ok: true, name: checked.name });
  }

  private recordRun(b: Record<string, unknown>, now: number): Response {
    const shards = b['shards'] === undefined ? null : b['shards'];
    if (
      shards !== null &&
      (typeof shards !== 'number' ||
        !Number.isSafeInteger(shards) ||
        shards < 0 ||
        shards > 1_000_000)
    )
      return json({ ok: false, error: 'bad-run' }, 400);
    const reportedAt =
      typeof b['reportedAt'] === 'number' && Number.isSafeInteger(b['reportedAt'])
        ? Math.max(0, Math.min(now, b['reportedAt']))
        : now;
    const tier = b['tier'];
    const stage = b['stage'];
    const run = b['run'];
    const ip = isAddr(b['ip']) ? b['ip'] : 'unknown';
    if (
      !isId(b['player']) ||
      typeof run !== 'string' ||
      run.length < 1 ||
      run.length > 64 ||
      !isHero(b['hero']) ||
      typeof tier !== 'number' ||
      !Number.isInteger(tier) ||
      tier < 1 ||
      tier > RUN_MAX_TIER ||
      typeof stage !== 'number' ||
      !Number.isInteger(stage) ||
      stage < 0 ||
      stage > 3
    )
      return json({ ok: false, error: 'bad-run' }, 400);
    const total = stagesInAll(tier, stage);
    const completed = b['ended'] === 'completed';
    // the run's play clock (optional: older clients do not send it), in whole ms up to a thousand hours
    const playMs =
      typeof b['playMs'] === 'number' &&
      Number.isSafeInteger(b['playMs']) &&
      b['playMs'] > 0 &&
      b['playMs'] <= 1000 * 3_600_000
        ? b['playMs']
        : null;
    if (completed && (tier < 12 || stage !== 3)) return json({ ok: false, error: 'bad-run' }, 400);
    // a run counts under the player's username (one is needed to be on the campaign board)
    const name = this.claimedName(b['player']);
    if (!name) return json({ ok: true, counted: false, error: 'no-name' });
    // (taken for beating Tier III, so a run below it has none)
    const ascendancy = tier >= 3 ? boardAscendancy(b['hero'], b['ascendancy']) : null;
    // (an Ascendancy is taken after the Warden of Tier III, when the run has made no new progress: it is recorded as soon as it is told,
    // once, whether or not the report counts as progress; DECISIONS #539)
    if (ascendancy)
      this.ctx.storage.sql.exec(
        'UPDATE runs SET ascendancy = ? WHERE player = ? AND run = ? AND ascendancy IS NULL',
        ascendancy,
        b['player'],
        run,
      );
    // the clock only moves forward and stops once the run has ended: a victory keeps the time its completing report carried
    // (a completing report may still set it on a run an older client wrongly marked as fallen)
    if (playMs !== null)
      this.ctx.storage.sql.exec(
        "UPDATE runs SET play_ms = ? WHERE player = ? AND run = ? AND (play_ms IS NULL OR play_ms < ?) AND (ended IS NULL OR (? = 1 AND ended <> 'completed'))",
        playMs,
        b['player'],
        run,
        playMs,
        completed ? 1 : 0,
      );
    // the run has ended (it fell, or was abandoned): only a run the board knows is marked, and only once
    if (b['ended'] === 'fell' || b['ended'] === 'abandoned') {
      this.ctx.storage.sql.exec(
        'UPDATE runs SET ended = ? WHERE player = ? AND run = ? AND ended IS NULL',
        b['ended'],
        b['player'],
        run,
      );
      return json({ ok: true, counted: false, ended: b['ended'] });
    }
    const old = this.ctx.storage.sql
      .exec<{
        total: number;
        tier: number;
        first_at: number;
        at: number;
        ended: string | null;
        shards_at: number;
      }>(
        'SELECT total, tier, first_at, at, ended, shards_at FROM runs WHERE player = ? AND run = ?',
        b['player'],
        run,
      )
      .toArray()[0];
    if (old) {
      // A saved victory can correct an older client's death/abandonment label. Late death
      // reports cannot overwrite it because ordinary endings only fill a null status.
      if (completed)
        this.ctx.storage.sql.exec(
          "UPDATE runs SET ended = 'completed' WHERE player = ? AND run = ?",
          b['player'],
          run,
        );
      if (
        !old.ended &&
        total === old.total &&
        tier === old.tier &&
        shards !== null &&
        reportedAt >= old.shards_at
      ) {
        this.ctx.storage.sql.exec(
          'UPDATE runs SET shards = ?, shards_at = ? WHERE player = ? AND run = ?',
          shards,
          reportedAt,
          b['player'],
          run,
        );
      }
      // progress only moves forward, and only as fast as a real run could
      // (a repeat of what the board already knows changes nothing, so it is not counted against the flood limits: the app repeats its
      // reports on purpose, and counting them used up a player's hour and silently dropped the real ones that followed)
      // (the same count in a later Rift Tier is progress too: the tier is shown, and Tier 1 stage 3 is the same count as Tier 2 stage 0)
      if (total < old.total || (total === old.total && tier <= old.tier))
        return json({ ok: true, counted: false });
      // a flood from one player or one address is ignored
      // (checked first, counted only when it is let through: a report that was refused is tried again and must not use up the hour)
      if (
        !this.hasRoom(`run:${b['player']}`, HOUR, RUN_REPORTS_PER_HOUR, now) ||
        !this.hasRoom(`ip-run:${ip}`, HOUR, IP_REPORTS_PER_HOUR, now)
      )
        return json({ ok: true, counted: false, limited: true });
      this.within(`run:${b['player']}`, HOUR, RUN_REPORTS_PER_HOUR, now);
      this.within(`ip-run:${ip}`, HOUR, IP_REPORTS_PER_HOUR, now);
      // (judged on the progress since the last report, so a run the board first heard of far along climbs normally from there; a
      // little allowance covers a tier change and a report or two that went missing)
      if (total - old.total > RUN_STEP_ALLOWANCE + Math.floor((now - old.at) / RUN_MIN_STAGE_MS))
        return json({ ok: true, counted: false });
      this.ctx.storage.sql.exec(
        'UPDATE runs SET name = ?, hero = ?, tier = ?, stage = ?, total = ?, at = ?, shards = COALESCE(?, shards), shards_at = ? WHERE player = ? AND run = ?',
        name,
        storedHero(b['hero']),
        tier,
        stage,
        total,
        now,
        shards,
        reportedAt,
        b['player'],
        run,
      );
      return json({ ok: true, counted: true });
    }
    // a run the board has not heard of is taken where it says it is (DECISIONS #232): runs played before the board, before a
    // username or while offline used to be refused for good once they were past the first few stages; the limits below still apply
    // (checked first and counted only once the run is in: the app repeats a report it has no answer to, after every stop and whenever
    // the tab is looked at again, and counting each try used up a player's new runs for the day without one being recorded, so every
    // run after that was dropped without a trace; DECISIONS #350)
    const limits: [string, number, number][] = [
      [`run:${b['player']}`, HOUR, RUN_REPORTS_PER_HOUR],
      [`ip-run:${ip}`, HOUR, IP_REPORTS_PER_HOUR],
      [`new-run:${b['player']}`, DAY, NEW_RUNS_PER_DAY],
      [`ip-new-run:${ip}`, DAY, IP_NEW_RUNS_PER_DAY],
    ];
    if (!limits.every(([key, windowMs, max]) => this.hasRoom(key, windowMs, max, now)))
      return json({ ok: true, counted: false, limited: true });
    for (const [key, windowMs, max] of limits) this.within(key, windowMs, max, now);
    this.ctx.storage.sql.exec(
      'INSERT INTO runs (player, run, name, hero, ascendancy, tier, stage, total, first_at, at, shards, shards_at, ended, play_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      b['player'],
      run,
      name,
      storedHero(b['hero']),
      ascendancy,
      tier,
      stage,
      total,
      now,
      now,
      shards,
      reportedAt,
      completed ? 'completed' : null,
      playMs,
    );
    this.prune(now);
    return json({ ok: true, counted: true });
  }

  private pvpBoard(period: Period, now: number, player?: string): unknown {
    const from = periodStart(now, period);
    const all = standingsPvp(this.pvpRows(from));
    // each place shows the trophies its player holds
    const top = all.slice(0, BOARD_SIZE);
    const held = this.trophyCounts([...top.map((s) => s.player), ...(player ? [player] : [])]);
    const withTrophies = <T extends object>(s: T, id: string): T & { trophies?: TrophyCount } => {
      const t = held.get(id);
      return t ? { ...s, trophies: t } : s;
    };
    const you = this.placeOf(all, player);
    return {
      ok: true,
      period,
      from,
      board: top.map((s) => withTrophies(s, s.player)).map(withoutPlayer),
      you: you && player ? withTrophies(you, player) : you,
    };
  }

  private runBoard(period: Period, now: number, player?: string): unknown {
    const from = periodStart(now, period);
    // a run is on the board for every period it made progress in, at how far it has gone in all (Robert, 2026-10-26: "show anyone
    // who made progress this week"; DECISIONS #281)
    const rows = this.ctx.storage.sql
      .exec<RunSql>(
        'SELECT player, name, hero, ascendancy, tier, stage, at, ended, shards, play_ms FROM runs WHERE at >= ? LIMIT 20000',
        from,
      )
      .toArray();
    const flat: RunRow[] = rows.map((r) => ({
      player: r.player,
      name: r.name,
      hero: r.hero,
      ascendancy: boardAscendancy(r.hero, r.ascendancy),
      tier: r.tier,
      stage: r.stage,
      at: r.at,
      shards: r.shards,
      ended:
        r.ended === 'fell' || r.ended === 'abandoned' || r.ended === 'completed' ? r.ended : null,
      playMs: r.play_ms,
    }));
    const all = standingsRuns(flat);
    return {
      ok: true,
      period,
      from,
      board: all.slice(0, BOARD_SIZE).map(withoutPlayer),
      you: this.placeOf(all, player),
    };
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const now = Date.now();
    // (a week or month that has ended is settled before anything is shown or recorded)
    this.settleTrophies(now);
    if (request.method === 'GET') {
      if (url.pathname === '/reports/get') {
        const id = url.searchParams.get('id') ?? '';
        if (!SHARED_REPORT_ID.test(id)) return json({}, 404);
        const row = this.ctx.storage.sql
          .exec<{ id: string; at: number; text: string }>(
            'SELECT id, at, text FROM shared_reports WHERE id = ? AND at >= ?',
            id,
            now - SHARED_REPORT_DAYS * DAY,
          )
          .toArray()[0];
        return row ? json(row) : json({}, 404);
      }
      if (url.pathname === '/balance/campaign/export') {
        const after = Number(url.searchParams.get('after') ?? 0);
        if (!Number.isSafeInteger(after) || after < 0) return json({}, 400);
        const rows = this.ctx.storage.sql
          .exec<{ seq: number; data: string }>(
            'SELECT seq, data FROM balance_campaign WHERE seq > ? ORDER BY seq LIMIT 251',
            after,
          )
          .toArray();
        const page = rows.slice(0, 250);
        return json({
          schema: 1,
          snapshots: page.map((r) => JSON.parse(r.data) as unknown),
          next: page.at(-1)?.seq ?? after,
          more: rows.length > 250,
          retentionDays: BALANCE_DAYS,
          maxSnapshots: 20000,
        });
      }
      if (url.pathname === '/balance/fights/export') {
        const after = Number(url.searchParams.get('after') ?? 0);
        if (!Number.isSafeInteger(after) || after < 0) return json({}, 400);
        const rows = this.ctx.storage.sql
          .exec<{ seq: number; owner: string; data: string }>(
            'SELECT seq, owner, data FROM balance_fights WHERE seq > ? ORDER BY seq LIMIT 21',
            after,
          )
          .toArray();
        // (20 a page: a fight with its replay can be a few hundred kilobytes, and the board must not hold too much at once)
        const page = rows.slice(0, 20);
        return json({
          schema: 1,
          // (the owner id is already a one-way hash of the account: kept so one player's fights can be told apart, never who they are)
          fights: page.map((r) => ({ player: r.owner, ...(JSON.parse(r.data) as object) })),
          next: page.at(-1)?.seq ?? after,
          more: rows.length > 20,
          retentionDays: BALANCE_DAYS,
        });
      }
      if (url.pathname === '/balance/export') {
        const after = Number(url.searchParams.get('after') ?? 0);
        if (!Number.isSafeInteger(after) || after < 0) return json({ ok: false }, 400);
        // (DECISIONS #714: each game with its replay, seed and every move, when one was kept, so the owner's tool can replay it card by
        // card; fewer a page, as replays are big)
        const rows = this.ctx.storage.sql
          .exec<{ seq: number; data: string; replay: string | null }>(
            'SELECT g.seq, g.data, r.data AS replay FROM balance_games g LEFT JOIN replay_keys k ON k.game = g.id LEFT JOIN replays r ON r.id = k.id WHERE g.seq > ? ORDER BY g.seq LIMIT 21',
            after,
          )
          .toArray();
        const page = rows.slice(0, 20);
        // (a replay keeps the players' names for its viewers: the balance export never carries them)
        const nameless = (text: string): unknown => {
          const r = JSON.parse(text) as Record<string, unknown>;
          for (const seat of ['a', 'b'] as const) {
            const e = r[seat];
            if (e && typeof e === 'object') {
              const { name: _name, ...rest } = e as Record<string, unknown>;
              void _name;
              r[seat] = rest;
            }
          }
          delete r['names'];
          return r;
        };
        return json({
          schema: 1,
          games: page.map((r) => ({
            ...(JSON.parse(r.data) as object),
            ...(r.replay ? { replay: nameless(r.replay) } : {}),
          })),
          next: page.at(-1)?.seq ?? after,
          more: rows.length > 20,
          retentionDays: BALANCE_DAYS,
          maxGames: 20000,
        });
      }
      const period: Period = url.searchParams.get('period') === 'month' ? 'month' : 'week';
      if (url.pathname === '/pvp') return json(this.pvpBoard(period, now));
      if (url.pathname === '/runs') return json(this.runBoard(period, now));
      if (url.pathname === '/ghosts') return json(this.ghostBoard(period, now));
      if (url.pathname === '/ghostdecks') return json(this.ghostDecks(now));
      if (url.pathname === '/decks') return json(this.playerDecks(url.searchParams.get('name')));
      if (url.pathname === '/ranks') return json(this.rankBoard(now));
      if (url.pathname === '/replay') return this.replay(url.searchParams.get('id'));
      if (url.pathname === '/fight') return this.fight(url.searchParams.get('id'));
      return json({ ok: false, error: 'not-found' }, 404);
    }
    let body: Record<string, unknown>;
    try {
      const parsed = await request.json<unknown>();
      if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'bad-body' }, 400);
    }
    if (url.pathname === '/balance/save') {
      const game = body['game'];
      if (!isArenaBalanceGame(game)) return json({ ok: false }, 400);
      this.ctx.storage.sql.exec(
        'INSERT OR IGNORE INTO balance_games (id, at, data) VALUES (?, ?, ?)',
        game.id,
        now,
        JSON.stringify(game),
      );
      this.ctx.storage.sql.exec('DELETE FROM balance_games WHERE at < ?', now - BALANCE_DAYS * DAY);
      this.ctx.storage.sql.exec(
        'DELETE FROM balance_games WHERE seq IN (SELECT seq FROM balance_games ORDER BY seq DESC LIMIT -1 OFFSET 20000)',
      );
      return json({ ok: true });
    }
    if (url.pathname === '/reports/save') {
      if (!validPerformanceReport(body['text']) || !isId(body['ip']))
        return json({ ok: false }, 400);
      if (!this.within(`report:${body['ip']}`, DAY, 20, now))
        return json({ ok: false, error: 'limited' }, 429);
      const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');
      this.ctx.storage.sql.exec(
        'INSERT INTO shared_reports (id, at, text) VALUES (?, ?, ?)',
        id,
        now,
        body['text'],
      );
      this.ctx.storage.sql.exec(
        'DELETE FROM shared_reports WHERE at < ?',
        now - SHARED_REPORT_DAYS * DAY,
      );
      this.ctx.storage.sql.exec(
        'DELETE FROM shared_reports WHERE id IN (SELECT id FROM shared_reports ORDER BY at DESC, rowid DESC LIMIT -1 OFFSET 2000)',
      );
      return json({ ok: true, id, retentionDays: SHARED_REPORT_DAYS });
    }
    if (url.pathname === '/balance/campaign/save') {
      const s = body['snapshot'] as Record<string, unknown> | undefined;
      if (
        !s ||
        s['schema'] !== 1 ||
        s['source'] !== 'client-observed' ||
        typeof s['id'] !== 'string' ||
        !/^[a-f0-9]{64}$/.test(s['id']) ||
        typeof s['run'] !== 'string' ||
        !/^[a-f0-9]{64}$/.test(s['run']) ||
        !Number.isSafeInteger(s['rules']) ||
        typeof s['version'] !== 'string' ||
        s['version'].length > 40
      )
        return json({}, 400);
      const facts = campaignDeckFacts({
        ...s,
        v: 2,
        character: s['hero'],
        deck: s['cards'],
        draftLog: s['drafts'],
        stats: { duelsWon: s['fightsWon'], duelsLost: s['fightsLost'] },
      });
      if (!facts) return json({}, 400);
      // Rebuild instead of persisting unexpected fields from a caller.
      const snapshot = {
        schema: 1,
        id: s['id'],
        run: s['run'],
        rules: s['rules'],
        version: s['version'],
        source: 'client-observed',
        ...facts,
        clearedNodes: Number.isSafeInteger(s['clearedNodes']) ? s['clearedNodes'] : null,
        at: now,
      };
      this.ctx.storage.sql.exec(
        'INSERT OR IGNORE INTO balance_campaign (id, at, data) VALUES (?, ?, ?)',
        snapshot.id,
        now,
        JSON.stringify(snapshot),
      );
      this.ctx.storage.sql.exec(
        'DELETE FROM balance_campaign WHERE at < ?',
        now - BALANCE_DAYS * DAY,
      );
      this.ctx.storage.sql.exec(
        'DELETE FROM balance_campaign WHERE seq IN (SELECT seq FROM balance_campaign ORDER BY seq DESC LIMIT -1 OFFSET 20000)',
      );
      return json({ ok: true });
    }
    if (url.pathname === '/fight/save') return this.saveFight(body, now);
    if (url.pathname === '/fight/recent') return this.recentFights(body['player']);
    if (url.pathname === '/replay/recent') {
      if (!isId(body['player'])) return json({ ok: false }, 401);
      const rows = this.ctx.storage.sql
        .exec<{ data: string; seat: string }>(
          'SELECT r.data, o.seat FROM replay_owners o JOIN replays r ON r.id = o.id WHERE o.owner = ? ORDER BY o.at DESC, o.rowid DESC LIMIT ?',
          body['player'],
          RECENT_REPLAYS,
        )
        .toArray();
      return json({
        ok: true,
        replays: rows.map((r) => ({ ...(JSON.parse(r.data) as object), viewerSeat: r.seat })),
      });
    }
    if (url.pathname === '/view') {
      // a board seen by someone who is known: it also says where they stand
      const period: Period = body['period'] === 'month' ? 'month' : 'week';
      const player = isId(body['player']) ? body['player'] : undefined;
      if (body['kind'] === 'pvp') return json(this.pvpBoard(period, now, player));
      if (body['kind'] === 'runs') return json(this.runBoard(period, now, player));
      if (body['kind'] === 'ghosts') return json(this.ghostBoard(period, now, player));
      if (body['kind'] === 'ranks') return json(this.rankBoard(now, player));
      return json({ ok: false, error: 'not-found' }, 404);
    }
    if (url.pathname === '/pvp') return this.recordPvp(body, now);
    if (url.pathname === '/run') return this.recordRun(body, now);
    if (url.pathname === '/name/claim') return this.claimName(body, now);
    if (url.pathname === '/name/of')
      return json({
        ok: true,
        name: isId(body['player']) ? this.claimedName(body['player']) : null,
      });
    if (url.pathname === '/ghost/pick') return this.pick(body, now);
    if (url.pathname === '/ghost/boss') return this.ghostBoss(body, now);
    if (url.pathname === '/ghost/register') return this.registerSaved(body, now);
    if (url.pathname === '/ghost/result') return this.ghostResult(body, now);
    if (url.pathname === '/trophies') {
      // the Trophy case: one player's trophies (the worker has worked out who they are)
      if (!isId(body['player'])) return json({ ok: true, trophies: [] });
      return json({ ok: true, trophies: this.trophiesOf(body['player']) });
    }
    if (url.pathname === '/trophies/count') {
      // a room asking how many trophies its players hold, and their ranks, to show on their cards
      const ids = Array.isArray(body['players']) ? body['players'].filter(isId).slice(0, 10) : [];
      return json({
        ok: true,
        counts: Object.fromEntries(this.trophyCounts(ids)),
        ranks: Object.fromEntries(this.rankBadges(ids, now)),
      });
    }
    if (url.pathname === '/replay/save') return this.saveReplay(body, now);
    return json({ ok: false, error: 'not-found' }, 404);
  }
}
