// The leaderboards, kept on the server: one Durable Object (named "main") with a small SQLite table of Arena results and another of
// campaign progress. It never holds a name, email or code beyond the display name a player typed; a player is told apart by an id the
// server derives (a hash), which is never sent out. The boards themselves are worked out by the pure rules in @sr/pvp (board.ts).
//
// The campaign board takes its progress from the browser, which cannot be checked, so it is guarded instead: a run can only be as far
// along as the time it has been going allows, and reports are limited per player and per address.

import { DurableObject } from 'cloudflare:workers';
import {
  BOARD_KEEP_DAYS,
  IP_NEW_RUNS_PER_DAY,
  IP_REPORTS_PER_HOUR,
  NEW_RUNS_PER_DAY,
  RUN_MAX_TIER,
  RUN_REPORTS_PER_HOUR,
  SAME_FOE_PER_DAY,
  WINS_PER_DAY,
  believableStages,
  cleanBoardName,
  isHero,
  periodStart,
  rankPvp,
  rankRuns,
  stagesInAll,
  type Period,
  type PvpRow,
  type RunRow,
} from '@sr/pvp';
import type { Env } from './env';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const DAY = 86_400_000;
const HOUR = 3_600_000;
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const isAddr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 80;

interface RunSql extends Record<string, SqlStorageValue> {
  player: string;
  name: string;
  hero: string;
  tier: number;
  stage: number;
  at: number;
}

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
    // how often a player or an address has done something in the current hour or day
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS limits (
         key TEXT PRIMARY KEY, window INTEGER NOT NULL, n INTEGER NOT NULL
       )`,
    );
  }

  /** Count one more of `key` in its current window, and say whether it is still within `max`. */
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

  /** Throw out what no board can show any more. */
  private prune(now: number): void {
    const before = now - BOARD_KEEP_DAYS * DAY;
    this.ctx.storage.sql.exec('DELETE FROM pvp WHERE at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM runs WHERE at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM limits WHERE window < ?', Math.floor(before / DAY));
  }

  private recordPvp(b: Record<string, unknown>, now: number): Response {
    const w = b['winner'] as Record<string, unknown> | undefined;
    const l = b['loser'] as Record<string, unknown> | undefined;
    if (!w || !l || !isId(w['id']) || !isId(l['id']) || !isHero(w['hero']) || !isHero(l['hero']))
      return json({ ok: false, error: 'bad-result' }, 400);
    // nobody plays themselves, the same pair counts only so often in a day, and a player's wins in a day are capped
    if (w['id'] === l['id']) return json({ ok: true, counted: false });
    const count = (sql: string, ...args: SqlStorageValue[]): number =>
      this.ctx.storage.sql.exec<{ n: number }>(sql, ...args).one().n;
    const pair = count(
      'SELECT COUNT(*) AS n FROM pvp WHERE winner = ? AND loser = ? AND at > ?',
      w['id'],
      l['id'],
      now - DAY,
    );
    if (pair >= SAME_FOE_PER_DAY) return json({ ok: true, counted: false });
    const wins = count(
      'SELECT COUNT(*) AS n FROM pvp WHERE winner = ? AND at > ?',
      w['id'],
      now - DAY,
    );
    if (wins >= WINS_PER_DAY) return json({ ok: true, counted: false });
    this.ctx.storage.sql.exec(
      'INSERT INTO pvp (at, winner, winner_name, winner_hero, loser, loser_name, loser_hero) VALUES (?, ?, ?, ?, ?, ?, ?)',
      now,
      w['id'],
      cleanBoardName(w['name']),
      w['hero'],
      l['id'],
      cleanBoardName(l['name']),
      l['hero'],
    );
    this.prune(now);
    return json({ ok: true, counted: true });
  }

  private recordRun(b: Record<string, unknown>, now: number): Response {
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
    // a flood from one player or one address is ignored
    if (
      !this.within(`run:${b['player']}`, HOUR, RUN_REPORTS_PER_HOUR, now) ||
      !this.within(`ip-run:${ip}`, HOUR, IP_REPORTS_PER_HOUR, now)
    )
      return json({ ok: true, counted: false, limited: true });
    const total = stagesInAll(tier, stage);
    const name = cleanBoardName(b['name']);
    const old = this.ctx.storage.sql
      .exec<{ total: number; first_at: number }>(
        'SELECT total, first_at FROM runs WHERE player = ? AND run = ?',
        b['player'],
        run,
      )
      .toArray()[0];
    if (old) {
      // progress only moves forward, and only as fast as a real run could
      if (total <= old.total) return json({ ok: true, counted: false });
      if (total > believableStages(now - old.first_at)) return json({ ok: true, counted: false });
      this.ctx.storage.sql.exec(
        'UPDATE runs SET name = ?, hero = ?, tier = ?, stage = ?, total = ?, at = ? WHERE player = ? AND run = ?',
        name,
        b['hero'],
        tier,
        stage,
        total,
        now,
        b['player'],
        run,
      );
      return json({ ok: true, counted: true });
    }
    // a run is first seen near its start (a report that never arrived is made up for within the grace)
    if (total > believableStages(0)) return json({ ok: true, counted: false });
    if (
      !this.within(`new-run:${b['player']}`, DAY, NEW_RUNS_PER_DAY, now) ||
      !this.within(`ip-new-run:${ip}`, DAY, IP_NEW_RUNS_PER_DAY, now)
    )
      return json({ ok: true, counted: false, limited: true });
    this.ctx.storage.sql.exec(
      'INSERT INTO runs (player, run, name, hero, tier, stage, total, first_at, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      b['player'],
      run,
      name,
      b['hero'],
      tier,
      stage,
      total,
      now,
      now,
    );
    this.prune(now);
    return json({ ok: true, counted: true });
  }

  private pvpBoard(period: Period, now: number): unknown {
    const from = periodStart(now, period);
    const rows = this.ctx.storage.sql
      .exec<{
        winner: string;
        winner_name: string;
        winner_hero: string;
        loser: string;
        loser_name: string;
        loser_hero: string;
        at: number;
      }>('SELECT * FROM pvp WHERE at >= ? LIMIT 20000', from)
      .toArray();
    const flat: PvpRow[] = rows.flatMap((r): PvpRow[] => [
      { player: r.winner, name: r.winner_name, hero: r.winner_hero, won: true, at: r.at },
      { player: r.loser, name: r.loser_name, hero: r.loser_hero, won: false, at: r.at },
    ]);
    return { ok: true, period, from, board: rankPvp(flat) };
  }

  private runBoard(period: Period, now: number): unknown {
    const from = periodStart(now, period);
    // a run counts on the board for the period it was begun in (so one that carries on across a Monday is not credited twice)
    const rows = this.ctx.storage.sql
      .exec<RunSql>(
        'SELECT player, name, hero, tier, stage, at FROM runs WHERE first_at >= ? LIMIT 20000',
        from,
      )
      .toArray();
    const flat: RunRow[] = rows.map((r) => ({
      player: r.player,
      name: r.name,
      hero: r.hero,
      tier: r.tier,
      stage: r.stage,
      at: r.at,
    }));
    return { ok: true, period, from, board: rankRuns(flat) };
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const now = Date.now();
    if (request.method === 'GET') {
      const period: Period = url.searchParams.get('period') === 'month' ? 'month' : 'week';
      if (url.pathname === '/pvp') return json(this.pvpBoard(period, now));
      if (url.pathname === '/runs') return json(this.runBoard(period, now));
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
    if (url.pathname === '/pvp') return this.recordPvp(body, now);
    if (url.pathname === '/run') return this.recordRun(body, now);
    return json({ ok: false, error: 'not-found' }, 404);
  }
}
