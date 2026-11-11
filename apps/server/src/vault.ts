// A player's Vault, kept on the server: one Durable Object per Vault code (or account), with a small SQLite table of decks, and
// one of their runs so a run follows them from device to device (DECISIONS #309). The code is the
// only thing that identifies a player (there are no accounts yet): whoever holds it can read and change that Vault, so it is
// long and random, and the object is named by a hash of it rather than by the code itself.

import { DurableObject } from 'cloudflare:workers';
import {
  claimPlay,
  takeOverPlay,
  emptyPlayLease,
  ownsPlay,
  releasePlay,
  renewPlay,
  type PlayLease,
} from '@sr/pvp';
import { PLAY_HEADER } from './playAccess';
import {
  bankInto,
  cleanDeck,
  cleanListItems,
  cleanRemoved,
  cleanCosmetics,
  cleanRunCopies,
  deckExpired,
  dropFrom,
  grantCosmetics,
  selfClaimed,
  cleanEarned,
  cleanMastery,
  countRuns,
  deckRunFacts,
  historyRunFacts,
  matchCountsOnly,
  masteryRewards,
  type RunFacts,
  mergeMastery,
  sameMastery,
  withEarned,
  withSeen,
  type Earned,
  type EarnedWhy,
  type Mastery,
  BANK_CLOCK_SLACK_MS,
  isListName,
  keepRunCopies,
  regressesRun,
  mergeCosmetics,
  mergeList,
  type Cosmetics,
  type ListName,
  type RunCopy,
  type VaultDeck,
} from '@sr/pvp';
import type { Env } from './env';
import { RULES_VERSION, periodStart } from '@sr/pvp';
import { campaignDeckFacts } from './campaignBalance';

interface Row extends Record<string, SqlStorageValue> {
  id: string;
  hero: string;
  tier: number;
  stage: number | null;
  deck: string;
  boons: string;
  ascendancy: string | null;
  max_hp: number | null;
  won: number | null;
  banked_at: number;
}

/** The most records of a history a device brings that are counted for mastery in one request (a history keeps 40). */
const HISTORY_COUNTED_AT_ONCE = 80;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export class Vault extends DurableObject<Env> {
  /** the season (its start) this object last checked its decks against, so the check runs once a season and not on every request */
  private seasonChecked = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // the decks the last season's end wiped (DECISIONS #737): kept until the next wipe, so a wipe can be looked at and, if it was
    // wrong, undone
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS past_decks (id TEXT PRIMARY KEY, wiped INTEGER NOT NULL, data TEXT NOT NULL)',
    );
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS identity_redirect (k INTEGER PRIMARY KEY, account TEXT NOT NULL)',
    );
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS play_lease (k INTEGER PRIMARY KEY, data TEXT NOT NULL)',
    );
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS play_replays (k INTEGER PRIMARY KEY, data TEXT NOT NULL)',
    );
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS run_backups (id TEXT NOT NULL, updated INTEGER NOT NULL, text TEXT NOT NULL, PRIMARY KEY(id, updated))',
    );
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS decks (
         id TEXT PRIMARY KEY,
         hero TEXT NOT NULL,
         tier INTEGER NOT NULL,
         deck TEXT NOT NULL,
         banked_at INTEGER NOT NULL
       )`,
    );
    // Vaults made before decks carried Boons gain the column (an existing column makes this fail harmlessly)
    const columns = ctx.storage.sql.exec<{ name: string }>('PRAGMA table_info(decks)').toArray();
    if (!columns.some((c) => c.name === 'boons'))
      ctx.storage.sql.exec(`ALTER TABLE decks ADD COLUMN boons TEXT NOT NULL DEFAULT '[]'`);
    // ... and the stage the deck was saved at (empty for older decks)
    if (!columns.some((c) => c.name === 'stage'))
      ctx.storage.sql.exec('ALTER TABLE decks ADD COLUMN stage INTEGER');
    // ... and the Ascendancy its run took (DECISIONS #519)
    if (!columns.some((c) => c.name === 'ascendancy'))
      ctx.storage.sql.exec('ALTER TABLE decks ADD COLUMN ascendancy TEXT');
    // ... and the run's Max HP (DECISIONS #538)
    if (!columns.some((c) => c.name === 'max_hp'))
      ctx.storage.sql.exec('ALTER TABLE decks ADD COLUMN max_hp INTEGER');
    // ... and whether its run cleared the campaign (DECISIONS #739)
    if (!columns.some((c) => c.name === 'won'))
      ctx.storage.sql.exec('ALTER TABLE decks ADD COLUMN won INTEGER');
    // the player's synced lists (run history, Arena matches): one JSON row each (DECISIONS #318)
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS lists (
         name TEXT PRIMARY KEY,
         items TEXT NOT NULL DEFAULT '[]',
         removed TEXT NOT NULL DEFAULT '[]'
       )`,
    );
    // the player's cosmetics (DECISIONS #406): one JSON row, the skins they own and the look each Riftwalker wears
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS cosmetics (k TEXT PRIMARY KEY, data TEXT NOT NULL)',
    );
    // hero mastery and the log of what the player has earned (DECISIONS #739): one JSON row each. Like cosmetics, no wipe touches them
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS mastery (k TEXT PRIMARY KEY, data TEXT NOT NULL)',
    );
    // the player's runs: the newest copy of each (text is empty on a run that ended: gone = 1)
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS runs (
         id TEXT PRIMARY KEY,
         updated INTEGER NOT NULL,
         gone INTEGER NOT NULL DEFAULT 0,
         text TEXT NOT NULL DEFAULT ''
       )`,
    );
  }

  /** A synced list as kept here (DECISIONS #318): its items, newest first, and the ids removed from it. */
  private list_(name: ListName): { items: ReturnType<typeof cleanListItems>; removed: string[] } {
    const row = this.ctx.storage.sql
      .exec<{ items: string; removed: string }>(
        'SELECT items, removed FROM lists WHERE name = ?',
        name,
      )
      .toArray()[0];
    return row
      ? {
          items: cleanListItems(name, parseJson(row.items)),
          removed: cleanRemoved(parseJson(row.removed)),
        }
      : { items: [], removed: [] };
  }

  private cosmetics(): Cosmetics {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM cosmetics WHERE k = 'me'")
      .toArray()[0];
    return cleanCosmetics(row ? parseJson(row.data) : null);
  }

  private mastery(): Mastery {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM mastery WHERE k = 'me'")
      .toArray()[0];
    return cleanMastery(row ? parseJson(row.data) : null);
  }

  /** The runs whose campaign clear has been counted (the newest kept), so no run is counted twice, whichever device or record says it. */
  private countedRuns(): string[] {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM mastery WHERE k = 'runs'")
      .toArray()[0];
    const v = row ? parseJson(row.data) : null;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  }

  /**
   * Count runs into this player's mastery (DECISIONS #741): the server does the counting, from the decks a run saves and from the
   * run history. What the count earns (a mastered Riftwalker's card back) is given at once. True when a number rose.
   */
  private countMastery(runs: readonly RunFacts[]): boolean {
    if (runs.length === 0) return false;
    const before = this.mastery();
    const counted = this.countedRuns();
    const { mastery, newlyCounted } = countRuns(before, counted, runs);
    if (mastery === before && newlyCounted.length === 0) return false;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO mastery (k, data) VALUES ('me', ?)",
        JSON.stringify(mastery),
      );
      if (newlyCounted.length)
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO mastery (k, data) VALUES ('runs', ?)",
          JSON.stringify([...counted, ...newlyCounted].slice(-5000)),
        );
    });
    const rewards = masteryRewards(mastery);
    if (rewards.length) this.give(rewards, 'mastery');
    return !sameMastery(before, mastery);
  }

  /** The runs the run history tells of. */
  private historyRuns(items: readonly unknown[]): RunFacts[] {
    return items.flatMap((x) => {
      const f = historyRunFacts(x);
      return f ? [f] : [];
    });
  }

  private earned(): Earned[] {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM mastery WHERE k = 'earned'")
      .toArray()[0];
    return cleanEarned(row ? parseJson(row.data) : null);
  }

  private setEarned(log: Earned[]): void {
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO mastery (k, data) VALUES ('earned', ?)",
      JSON.stringify(log),
    );
  }

  /**
   * Give cosmetics (DECISIONS #737, #739): they are added to what the player owns, and each one that is new goes into the log of
   * what they have earned, for a device to show them. Returns the ones that were new.
   */
  private give(
    ids: readonly string[],
    why: EarnedWhy,
  ): { cosmetics: Cosmetics; granted: string[] } {
    const before = this.cosmetics();
    const after = grantCosmetics(before, ids);
    const granted = after.owned.filter((id) => !before.owned.includes(id));
    if (granted.length)
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO cosmetics (k, data) VALUES ('me', ?)",
          JSON.stringify(after),
        );
        this.setEarned(withEarned(this.earned(), granted, why, Date.now()));
      });
    return { cosmetics: after, granted };
  }

  private runs(): RunCopy[] {
    const rows = this.ctx.storage.sql
      .exec<{ id: string; updated: number; gone: number; text: string }>(
        'SELECT id, updated, gone, text FROM runs',
      )
      .toArray();
    return cleanRunCopies(
      rows.map((r) =>
        r.gone
          ? { id: r.id, updated: r.updated, gone: true }
          : { id: r.id, updated: r.updated, text: r.text },
      ),
    );
  }

  /** Take what a device sends: the newest copy of each run is kept, within the limit. */
  private saveRuns(arrived: RunCopy[]): void {
    const before = this.runs();
    const now = Math.max(Date.now(), ...before.map((c) => c.updated + 1));
    const accepted = arrived.map((c) => ({ ...c, updated: now }));
    const keep = keepRunCopies(before, accepted);
    const ids = new Set(keep.map((c) => c.id));
    for (const old of before)
      if (!ids.has(old.id)) this.ctx.storage.sql.exec('DELETE FROM runs WHERE id = ?', old.id);
    const had = new Map(before.map((c) => [c.id, c]));
    for (const c of keep) {
      const h = had.get(c.id);
      if (h && h.updated === c.updated && !!h.gone === !!c.gone) continue;
      if (h && !h.gone && h.text && h.text !== c.text) {
        this.ctx.storage.sql.exec(
          'INSERT OR IGNORE INTO run_backups (id, updated, text) VALUES (?, ?, ?)',
          h.id,
          h.updated,
          h.text,
        );
        this.ctx.storage.sql.exec(
          'DELETE FROM run_backups WHERE rowid NOT IN (SELECT rowid FROM run_backups ORDER BY updated DESC LIMIT 20)',
        );
      }
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO runs (id, updated, gone, text) VALUES (?, ?, ?, ?)',
        c.id,
        c.updated,
        c.gone ? 1 : 0,
        c.gone ? '' : (c.text ?? ''),
      );
    }
  }

  private list(): VaultDeck[] {
    const rows = this.ctx.storage.sql
      .exec<Row>(
        'SELECT id, hero, tier, stage, deck, boons, ascendancy, max_hp, won, banked_at FROM decks ORDER BY banked_at, id',
      )
      .toArray();
    // a row that cannot be read is left out rather than failing the whole Vault
    return rows.flatMap((r): VaultDeck[] => {
      const d = cleanDeck({
        id: r.id,
        hero: r.hero,
        tier: r.tier,
        stage: r.stage ?? undefined,
        deck: parseJson(r.deck),
        boons: parseJson(r.boons),
        ascendancy: r.ascendancy ?? undefined,
        maxHp: r.max_hp ?? undefined,
        won: r.won === 1,
        bankedAt: r.banked_at,
      });
      return d ? [d] : [];
    });
  }

  private put(d: VaultDeck): void {
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO decks (id, hero, tier, stage, deck, boons, ascendancy, max_hp, won, banked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      d.id,
      d.hero,
      d.tier,
      d.stage ?? null,
      JSON.stringify(d.deck),
      JSON.stringify(d.boons),
      d.ascendancy ?? null,
      d.maxHp ?? null,
      d.won ? 1 : null,
      d.bankedAt,
    );
  }

  private remove(id: string): void {
    this.ctx.storage.sql.exec('DELETE FROM decks WHERE id = ?', id);
  }

  /**
   * The season has turned (DECISIONS #736): every deck last saved before it began is wiped. They are set aside in past_decks until
   * the next wipe replaces them. Cosmetics, runs and history are untouched.
   */
  private endSeason(now: number): void {
    const season = periodStart(now, 'month');
    if (this.seasonChecked === season) return;
    const gone = this.list().filter((d) => deckExpired(d, now));
    if (gone.length)
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec('DELETE FROM past_decks');
        for (const d of gone) {
          this.ctx.storage.sql.exec(
            'INSERT OR REPLACE INTO past_decks (id, wiped, data) VALUES (?, ?, ?)',
            d.id,
            now,
            JSON.stringify(d),
          );
          this.remove(d.id);
        }
      });
    this.seasonChecked = season;
  }

  /** The decks the last wipe took, newest first (nothing plays with them: they are there to be looked at). */
  private pastDecks(): { wiped: number | null; decks: VaultDeck[] } {
    const rows = this.ctx.storage.sql
      .exec<{ wiped: number; data: string }>('SELECT wiped, data FROM past_decks')
      .toArray();
    const decks = rows.flatMap((r): VaultDeck[] => {
      const d = cleanDeck(parseJson(r.data));
      return d ? [d] : [];
    });
    return {
      wiped: rows[0]?.wiped ?? null,
      decks: decks.sort((a, b) => b.bankedAt - a.bankedAt),
    };
  }

  override async fetch(request: Request): Promise<Response> {
    const action = new URL(request.url).pathname.replace(/^\/+/, '');
    this.endSeason(Date.now());
    const sealed = this.ctx.storage.sql
      .exec<{ account: string }>('SELECT account FROM identity_redirect WHERE k = 1')
      .toArray()[0]?.account;
    if (action === 'identity/seal') {
      const b = await request.json<{ account?: unknown }>();
      if (typeof b.account !== 'string' || !/^[a-f0-9]{64}$/.test(b.account)) return json({}, 400);
      if (sealed) return json({ ok: sealed === b.account }, sealed === b.account ? 200 : 409);
      const lease = this.lease();
      const cosmetics = this.cosmetics();
      if (
        lease.generation > 0 ||
        this.runs().length ||
        this.list().length ||
        this.list_('history').items.length ||
        this.list_('matches').items.length ||
        Object.keys(this.mastery()).length ||
        cosmetics.owned.length
      )
        return json({ error: 'existing-progress' }, 409);
      this.ctx.storage.sql.exec(
        'INSERT INTO identity_redirect (k, account) VALUES (1, ?)',
        b.account,
      );
      return json({ ok: true });
    }
    if (sealed) return json({ error: 'account-linked-reconnect' }, 409);
    if (action === 'list') return json({ ok: true, decks: this.list() });
    if (action === 'pastdecks') return json({ ok: true, ...this.pastDecks() });
    if (action === 'runbackups')
      return json({
        ok: true,
        runs: this.ctx.storage.sql
          .exec('SELECT id, updated, text FROM run_backups ORDER BY updated DESC')
          .toArray(),
      });
    if (action === 'runs')
      return json({
        ok: true,
        runs: this.runs(),
        revision: this.lease().revision,
        replays: this.replays(),
      });

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json<unknown>();
      if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'bad-body' }, 400);
    }

    const lease = this.lease();
    const proof = request.headers.get(PLAY_HEADER);
    const now = Date.now();
    if (action.startsWith('play/')) {
      const op = action.slice(5);
      if (op === 'claim' || op === 'takeover') {
        const holder = body['holder'];
        if (typeof holder !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(holder))
          return json({ ok: false, error: 'bad-holder' }, 400);
        const next =
          op === 'takeover'
            ? takeOverPlay(lease, holder, now, crypto.randomUUID())
            : claimPlay(lease, holder, proof, now, crypto.randomUUID());
        if (!next)
          return json({ ok: false, error: 'play-in-use', expires: lease.expires, now }, 409);
        this.setLease(next);
        return json({
          ok: true,
          ...next,
          now,
          runs: this.runs(),
          replays: this.replays(),
          decks: this.list(),
          history: this.list_('history'),
          matches: this.list_('matches'),
        });
      }
      if (op === 'release') {
        this.setLease(releasePlay(lease, proof));
        return json({ ok: true });
      }
      if (!ownsPlay(lease, proof, now)) return json({ ok: false, error: 'play-required' }, 409);
      if (op === 'renew') {
        const next = renewPlay(lease, proof, now)!;
        this.setLease(next);
        return json({ ok: true, expires: next.expires, now, revision: next.revision });
      }
      if (op === 'check') return json({ ok: true, expires: lease.expires, now });
      return json({ ok: false, error: 'not-found' }, 404);
    }
    if (
      ['bank', 'drop', 'runsave', 'listsync'].includes(action) &&
      !(action === 'listsync' && body['readOnly'] === true) &&
      !ownsPlay(lease, proof, now)
    )
      return json({ ok: false, error: 'play-required' }, 409);

    if (action === 'bank') {
      const deck = cleanDeck(body['deck']);
      if (!deck) return json({ ok: false, error: 'bad-deck' }, 400);
      // The save time is the device's. A device says what its clock reads now, and a clock that is off by more than a little has its
      // save times moved by as much, so a slow clock does not lose a deck saved just after the month turned and a fast one does not
      // get a deck that outlasts the season. Never later than now.
      const deviceNow = body['now'];
      if (typeof deviceNow === 'number' && Number.isFinite(deviceNow)) {
        const off = now - deviceNow;
        if (Math.abs(off) > BANK_CLOCK_SLACK_MS) deck.bankedAt += off;
      }
      if (deck.bankedAt > now + BANK_CLOCK_SLACK_MS) deck.bankedAt = now;
      // (DECISIONS #741) hero mastery is counted here, from what the run's deck says: how far it has got, and the campaign cleared.
      // Before anything can turn the deck away, so a full Vault or a turned month never costs a clear. `mastery` in the reply tells
      // the device a number rose.
      const mastery = this.countMastery([deckRunFacts(deck)]);
      // a deck of a season that has ended is not taken back (DECISIONS #736): a device that was offline over the turn of the month
      if (deckExpired(deck, now))
        return json({ ok: false, error: 'bad-deck', expired: true, mastery }, 400);
      const replaceId = typeof body['replaceId'] === 'string' ? body['replaceId'] : undefined;
      const before = this.list();
      const result = bankInto(before, deck, replaceId);
      if (!result.ok) return json({ ok: false, error: 'full', decks: result.list, mastery }, 409);
      if (!result.already) {
        // whatever the new list no longer holds (the deck this one replaces, or a deck given up) goes
        const keep = new Set(result.list.map((x) => x.id));
        for (const old of before) if (!keep.has(old.id)) this.remove(old.id);
        // (as the list holds it: a run that cleared the campaign stays marked so)
        this.put(result.list.find((x) => x.id === deck.id) ?? deck);
      }
      return json({ ok: true, decks: this.list(), mastery });
    }

    if (action === 'listsync') {
      const name = body['list'];
      if (!isListName(name)) return json({ ok: false, error: 'bad-list' }, 400);
      const have = this.list_(name);
      if (body['readOnly'] === true) return json({ ok: true, ...have });
      const removed = cleanRemoved([...have.removed, ...cleanRemoved(body['removed'])]);
      const brought = cleanListItems(name, body['items']);
      const items = mergeList(name, have.items, brought, removed);
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO lists (name, items, removed) VALUES (?, ?, ?)',
        name,
        JSON.stringify(items),
        JSON.stringify(removed),
      );
      // (DECISIONS #741) campaigns the run history says were cleared count toward mastery, each run once: what this device brought
      // (its copy may know a run was won where the kept copy does not) and what is kept
      const mastery =
        name === 'history'
          ? this.countMastery(
              this.historyRuns([
                ...[...brought].sort((a, b) => b.at - a.at).slice(0, HISTORY_COUNTED_AT_ONCE),
                ...items,
              ]),
            )
          : false;
      return json({ ok: true, items, removed, mastery });
    }

    // what a device has, merged with what is kept here (owning only grows; the newest choice of look wins), and the result back.
    // (a device may claim what is free to take; what is earned or sold is only ever given here, by `grant`: DECISIONS #737)
    if (action === 'cosmetics') {
      const merged = mergeCosmetics(
        this.cosmetics(),
        selfClaimed(cleanCosmetics(body['cosmetics'])),
      );
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO cosmetics (k, data) VALUES ('me', ?)",
        JSON.stringify(merged),
      );
      return json({ ok: true, cosmetics: merged });
    }

    // Give this player cosmetics (a season's rewards, a keepsake). Only the Worker asks this, never a device: it is not among the
    // actions a request from outside may name (VAULT_ACTIONS in worker.ts).
    if (action === 'grant') {
      const ids = Array.isArray(body['ids'])
        ? (body['ids'] as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 50)
        : [];
      const why = body['why'] === 'season' ? 'season' : 'gift';
      return json({ ok: true, ...this.give(ids, why), earned: this.earned() });
    }

    // Hero mastery (DECISIONS #739, #741). The campaign numbers (the highest tier, the clears) are counted here, from the decks a
    // run saves and from the run history: a device's copy of them is not taken. Its match counts (wins against players and ghosts)
    // are, the larger of each: they are a snapshot, and earn nothing. A Riftwalker's first clear gives its card back at once:
    // nothing is claimed. `seen` names entries of the earned log the player has acknowledged. The reply carries mastery, cosmetics
    // and the log.
    if (action === 'mastery') {
      // A browser keeps one copy of mastery, whoever is signed in. It says which Vault its copy was last brought together with; if
      // that was another player's (another account on the same browser), its numbers and acknowledgements are not taken, and it is
      // told to start again from this Vault's. (a short mark of this object's id; a browser that has never asked sends none)
      const owner = String(this.ctx.id ?? 'vault').slice(0, 16);
      const foreign = typeof body['owner'] === 'string' && body['owner'] !== owner;
      // (once: the campaigns the run history kept here already tells of, from before mastery was counted)
      const scanned = this.ctx.storage.sql
        .exec("SELECT k FROM mastery WHERE k = 'historyCounted'")
        .toArray().length;
      if (!scanned) {
        this.countMastery(this.historyRuns(this.list_('history').items));
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO mastery (k, data) VALUES ('historyCounted', '1')",
        );
      }
      const before = this.mastery();
      const merged = foreign
        ? before
        : mergeMastery(before, matchCountsOnly(cleanMastery(body['mastery'])));
      if (!sameMastery(before, merged))
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO mastery (k, data) VALUES ('me', ?)",
          JSON.stringify(merged),
        );
      const rewards = masteryRewards(merged);
      const { cosmetics } = rewards.length
        ? this.give(rewards, 'mastery')
        : { cosmetics: this.cosmetics() };
      const seen =
        !foreign && Array.isArray(body['seen'])
          ? (body['seen'] as unknown[])
              .filter((x): x is string => typeof x === 'string')
              .slice(0, 400)
          : [];
      let earned = this.earned();
      if (seen.length && earned.some((e) => !e.seen && seen.includes(e.id))) {
        earned = withSeen(earned, seen);
        this.setEarned(earned);
      }
      return json({
        ok: true,
        mastery: merged,
        cosmetics,
        earned,
        owner,
        ...(foreign ? { reset: true } : {}),
      });
    }

    if (action === 'runsave') {
      if (body['revision'] !== lease.revision)
        return json(
          { ok: false, error: 'save-conflict', revision: lease.revision, runs: this.runs() },
          409,
        );
      const arrived = cleanRunCopies(body['runs']);
      const existing = this.runs();
      if (arrived.some((c) => existing.some((old) => regressesRun(old, c))))
        return json(
          { ok: false, error: 'save-conflict', revision: lease.revision, runs: existing },
          409,
        );
      const replays = body['replays'];
      if (
        !replays ||
        typeof replays !== 'object' ||
        Array.isArray(replays) ||
        Object.keys(replays).length > 1000
      )
        return json({ ok: false, error: 'bad-replays' }, 400);
      const clean: Record<string, string> = {};
      for (const [key, value] of Object.entries(replays)) {
        if (
          !['sr.fightlog:', 'sr.ghostlog:', 'sr.duel.started:'].some((p) => key.startsWith(p)) ||
          typeof value !== 'string'
        )
          return json({ ok: false, error: 'bad-replays' }, 400);
        clean[key] = value;
      }
      if (JSON.stringify(clean).length > 1000000)
        return json({ ok: false, error: 'bad-replays' }, 413);
      this.ctx.storage.transactionSync(() => {
        this.saveRuns(cleanRunCopies(body['runs']));
        this.ctx.storage.sql.exec(
          'INSERT OR REPLACE INTO play_replays (k, data) VALUES (1, ?)',
          JSON.stringify(clean),
        );
        this.setLease({ ...lease, revision: lease.revision + 1 });
      });
      if (body['balanceRules'] === RULES_VERSION && typeof body['balanceVersion'] === 'string') {
        const stored = this.runs();
        const copies = cleanRunCopies(body['runs']).filter(
          (copy) =>
            !copy.gone &&
            stored.some((saved) => !saved.gone && saved.id === copy.id && saved.text === copy.text),
        );
        const version = body['balanceVersion'].slice(0, 40);
        this.ctx.waitUntil(this.reportCampaignDecks(copies, version).catch(() => undefined));
      }
      return json({ ok: true, runs: this.runs(), revision: lease.revision + 1, replays: clean });
    }

    if (action === 'drop') {
      const id = typeof body['id'] === 'string' ? body['id'] : '';
      if (id) this.remove(id);
      return json({ ok: true, decks: dropFrom(this.list(), id) });
    }

    return json({ ok: false, error: 'not-found' }, 404);
  }

  private async reportCampaignDecks(copies: RunCopy[], version: string): Promise<void> {
    const hash = async (text: string) =>
      Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))),
        (b) => b.toString(16).padStart(2, '0'),
      ).join('');
    for (const copy of copies) {
      if (copy.gone || !copy.text) continue;
      const facts = campaignDeckFacts(parseJson(copy.text));
      if (!facts) continue;
      const run = await hash(`balance-run-v1:${this.ctx.id.toString()}:${copy.id}`);
      const id = await hash(JSON.stringify([run, RULES_VERSION, version, facts]));
      const snapshot = {
        schema: 1,
        id,
        run,
        rules: RULES_VERSION,
        version,
        source: 'client-observed',
        ...facts,
      };
      await this.env.BOARD.get(this.env.BOARD.idFromName('main')).fetch(
        new Request('https://board.invalid/balance/campaign/save', {
          method: 'POST',
          body: JSON.stringify({ snapshot }),
          signal: AbortSignal.timeout(3000),
        }),
      );
    }
  }

  private lease(): PlayLease {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>('SELECT data FROM play_lease WHERE k = 1')
      .toArray()[0];
    return row ? (JSON.parse(row.data) as PlayLease) : emptyPlayLease();
  }
  private replays(): Record<string, string> {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>('SELECT data FROM play_replays WHERE k = 1')
      .toArray()[0];
    return row ? (JSON.parse(row.data) as Record<string, string>) : {};
  }
  private setLease(lease: PlayLease): void {
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO play_lease (k, data) VALUES (1, ?)',
      JSON.stringify(lease),
    );
  }
}
