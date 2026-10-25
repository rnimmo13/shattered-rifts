// The leaderboards, kept on the server: one Durable Object (named "main") with small SQLite tables of Arena results, campaign progress and
// ghosts. It never holds a name, email or code beyond the display name a player typed; a player is told apart by an id the server
// derives (a hash), which is never sent out. The boards themselves are worked out by the pure rules in @sr/pvp (board.ts).
//
// The campaign board takes its progress from the browser, which cannot be checked, so it is guarded instead: a run can only be as far
// along as the time it has been going allows, and reports are limited per player and per address.
//
// A ghost is a deck that has been played in the Arena, kept so that someone with no opponent can face it with the computer at the
// controls. Every counted Arena match adds to both decks' records; a match against a ghost adds to the ghost's own.

import { DurableObject } from 'cloudflare:workers';
import {
  BOARD_KEEP_DAYS,
  GHOST_WINS_PER_DAY,
  IP_NEW_RUNS_PER_DAY,
  IP_REPORTS_PER_HOUR,
  NEW_RUNS_PER_DAY,
  RUN_MAX_TIER,
  RUN_REPORTS_PER_HOUR,
  SAME_FOE_PER_DAY,
  WINS_PER_DAY,
  believableStages,
  checkEntry,
  cleanBoardName,
  isHero,
  storedHero,
  LEGACY_HERO_IDS,
  periodStart,
  BOARD_SIZE,
  pickGhost,
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
} from '@sr/pvp';
import type { Env } from './env';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const DAY = 86_400_000;
/** How often one player may ask for a ghost in an hour. */
const GHOST_ASKS_PER_HOUR = 40;
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

interface GhostSql extends Record<string, SqlStorageValue> {
  id: string;
  owner: string;
  owner_name: string;
  hero: string;
  deck: string;
  boons: string;
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
  hero: r.hero,
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
    // rows written before the Riftwalkers were named for their class (maren -> knight) are brought up to date (it does nothing once they are)
    const legacy = Object.entries(LEGACY_HERO_IDS);
    // (once only: a flag is kept, so a wake-up does not read every row again)
    const done = ctx.storage.kv.get('heroIdsRenamed') === true;
    const rename = (table: string, col: string): void => {
      const cases = legacy.map(([o, n]) => `WHEN '${o}' THEN '${n}'`).join(' ');
      const olds = legacy.map(([o]) => `'${o}'`).join(',');
      ctx.storage.sql.exec(`UPDATE ${table} SET ${col} = CASE ${col} ${cases} ELSE ${col} END WHERE ${col} IN (${olds})`);
    };
    if (!done) {
      rename('pvp', 'winner_hero');
      rename('pvp', 'loser_hero');
      rename('runs', 'hero');
      rename('ghosts', 'hero');
      rename('ghost_games', 'human_hero');
      ctx.storage.kv.put('heroIdsRenamed', true);
    }
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
    this.ctx.storage.sql.exec('DELETE FROM ghost_games WHERE at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM ghosts WHERE last_at < ?', before);
    this.ctx.storage.sql.exec('DELETE FROM limits WHERE window < ?', Math.floor(before / DAY));
  }

  private count(sql: string, ...args: SqlStorageValue[]): number {
    return this.ctx.storage.sql.exec<{ n: number }>(sql, ...args).one().n;
  }

  // ---- ghosts ----

  /** A deck's id: the same player with the same deck is always the same ghost (a hash of whose it is and what is in it). */
  private async deckId(owner: string, e: Entry): Promise<string> {
    const text = `${owner}|${e.hero}|${[...e.deck].sort().join(',')}|${[...e.boons].sort().join(',')}`;
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
  ): Promise<void> {
    const checked = checkEntry(entry);
    if (!checked.ok) return;
    const e = checked.entry;
    const id = await this.deckId(owner, e);
    const name = cleanBoardName(e.name);
    const wins = result === 'win' ? 1 : 0;
    const losses = result === 'loss' ? 1 : 0;
    if (this.count('SELECT COUNT(*) AS n FROM ghosts WHERE id = ?', id) > 0) {
      this.ctx.storage.sql.exec(
        'UPDATE ghosts SET owner_name = ?, tier = ?, stage = ?, wins = wins + ?, losses = losses + ?, last_at = ? WHERE id = ?',
        name,
        e.tier,
        e.stage ?? null,
        wins,
        losses,
        now,
        id,
      );
      return;
    }
    this.ctx.storage.sql.exec(
      'INSERT INTO ghosts (id, owner, owner_name, hero, deck, boons, tier, stage, wins, losses, first_at, last_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      owner,
      name,
      e.hero,
      JSON.stringify(e.deck),
      JSON.stringify(e.boons),
      e.tier,
      e.stage ?? null,
      wins,
      losses,
      now,
      now,
    );
  }

  /** A deck a player saved becomes a ghost others can meet, even before it has played a match. */
  private async registerSaved(b: Record<string, unknown>, now: number): Promise<Response> {
    if (!isId(b['owner'])) return json({ ok: false, error: 'bad-request' }, 400);
    if (!this.within(`ghost-save:${b['owner']}`, HOUR, 30, now))
      return json({ ok: true, registered: false });
    const checked = checkEntry(b['entry']);
    if (!checked.ok) return json({ ok: true, registered: false });
    await this.registerDeck(b['owner'], checked.entry, now, null);
    return json({ ok: true, registered: true });
  }

  /**
   * A ghost to stand in for a campaign Warden: one of the better decks (the upper half by wins), never the asker's own, whatever its
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
        `SELECT id, owner, owner_name, hero, '' AS deck, '' AS boons, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at
           FROM ghosts WHERE last_at >= ?
          ORDER BY (wins + ghost_wins) DESC, last_at DESC LIMIT 400`,
        now - 31 * DAY,
      )
      .toArray();
    const chosen = pickGhost(
      rows.map(toDeck).filter((d) => d.owner !== requester),
      null,
      Math.random(),
      now,
    );
    if (!chosen) return json({ ok: true, ghost: null });
    const row = this.ctx.storage.sql
      .exec<GhostSql>('SELECT * FROM ghosts WHERE id = ?', chosen.id)
      .toArray()[0];
    if (!row) return json({ ok: true, ghost: null });
    return json({
      ok: true,
      ghost: {
        name: row.owner_name,
        hero: row.hero,
        deck: parseList(row.deck),
        boons: parseList(row.boons),
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
        `SELECT id, owner, owner_name, hero, '' AS deck, '' AS boons, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at
           FROM ghosts WHERE last_at >= ?
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
          hero: row.hero,
          deck: parseList(row.deck),
          boons: parseList(row.boons),
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
        tier: number;
        stage: number | null;
      }>(
        `SELECT g.ghost, g.ghost_won, g.human, g.human_name, g.human_hero, g.at,
                d.owner_name, d.hero, d.tier, d.stage
           FROM ghost_games g JOIN ghosts d ON d.id = g.ghost
          WHERE g.at >= ? LIMIT 20000`,
        from,
      )
      .toArray();
    const games: GhostGame[] = rows.map((r) => ({
      ghost: r.ghost,
      ownerName: r.owner_name,
      hero: r.hero,
      tier: r.tier,
      stage: r.stage,
      ghostWon: r.ghost_won === 1,
      human: r.human,
      humanName: r.human_name,
      humanHero: r.human_hero,
      at: r.at,
    }));
    const decks = this.count('SELECT COUNT(*) AS n FROM ghosts WHERE last_at >= ?', now - 31 * DAY);
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
        `SELECT id, owner, owner_name, hero, '' AS deck, '' AS boons, tier, stage, wins, losses, ghost_wins, ghost_losses, last_at
           FROM ghosts WHERE last_at >= ? ORDER BY last_at DESC LIMIT 200`,
        now - 31 * DAY,
      )
      .toArray();
    return {
      ok: true,
      decks: rows.map((r) => ({
        name: r.owner_name,
        hero: r.hero,
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
      'INSERT INTO pvp (at, winner, winner_name, winner_hero, loser, loser_name, loser_hero) VALUES (?, ?, ?, ?, ?, ?, ?)',
      now,
      wid,
      cleanBoardName(w['name']),
      storedHero(w['hero']),
      lid,
      cleanBoardName(l['name']),
      storedHero(l['hero']),
    );
    await remember(true);
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
        storedHero(b['hero']),
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
      storedHero(b['hero']),
      tier,
      stage,
      total,
      now,
      now,
    );
    this.prune(now);
    return json({ ok: true, counted: true });
  }

  private pvpBoard(period: Period, now: number, player?: string): unknown {
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
    const all = standingsPvp(flat);
    return {
      ok: true,
      period,
      from,
      board: all.slice(0, BOARD_SIZE).map(withoutPlayer),
      you: this.placeOf(all, player),
    };
  }

  private runBoard(period: Period, now: number, player?: string): unknown {
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
    if (request.method === 'GET') {
      const period: Period = url.searchParams.get('period') === 'month' ? 'month' : 'week';
      if (url.pathname === '/pvp') return json(this.pvpBoard(period, now));
      if (url.pathname === '/runs') return json(this.runBoard(period, now));
      if (url.pathname === '/ghosts') return json(this.ghostBoard(period, now));
      if (url.pathname === '/ghostdecks') return json(this.ghostDecks(now));
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
    if (url.pathname === '/view') {
      // a board seen by someone who is known: it also says where they stand
      const period: Period = body['period'] === 'month' ? 'month' : 'week';
      const player = isId(body['player']) ? body['player'] : undefined;
      if (body['kind'] === 'pvp') return json(this.pvpBoard(period, now, player));
      if (body['kind'] === 'runs') return json(this.runBoard(period, now, player));
      if (body['kind'] === 'ghosts') return json(this.ghostBoard(period, now, player));
      return json({ ok: false, error: 'not-found' }, 404);
    }
    if (url.pathname === '/pvp') return this.recordPvp(body, now);
    if (url.pathname === '/run') return this.recordRun(body, now);
    if (url.pathname === '/ghost/pick') return this.pick(body, now);
    if (url.pathname === '/ghost/boss') return this.ghostBoss(body, now);
    if (url.pathname === '/ghost/register') return this.registerSaved(body, now);
    if (url.pathname === '/ghost/result') return this.ghostResult(body, now);
    return json({ ok: false, error: 'not-found' }, 404);
  }
}
