// A player's Vault, kept on the server: one Durable Object per Vault code (or account), with a small SQLite table of decks, and
// one of their runs so a run follows them from device to device (DECISIONS #309). The code is the
// only thing that identifies a player (there are no accounts yet): whoever holds it can read and change that Vault, so it is
// long and random, and the object is named by a hash of it rather than by the code itself.

import { DurableObject } from 'cloudflare:workers';
import {
  claimPlay,
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
  dropFrom,
  isListName,
  keepRunCopies,
  mergeCosmetics,
  mergeList,
  type Cosmetics,
  type ListName,
  type RunCopy,
  type VaultDeck,
} from '@sr/pvp';
import type { Env } from './env';

interface Row extends Record<string, SqlStorageValue> {
  id: string;
  hero: string;
  tier: number;
  stage: number | null;
  deck: string;
  boons: string;
  ascendancy: string | null;
  max_hp: number | null;
  banked_at: number;
}

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
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
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
        'SELECT id, hero, tier, stage, deck, boons, ascendancy, max_hp, banked_at FROM decks ORDER BY banked_at, id',
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
        bankedAt: r.banked_at,
      });
      return d ? [d] : [];
    });
  }

  private put(d: VaultDeck): void {
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO decks (id, hero, tier, stage, deck, boons, ascendancy, max_hp, banked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      d.id,
      d.hero,
      d.tier,
      d.stage ?? null,
      JSON.stringify(d.deck),
      JSON.stringify(d.boons),
      d.ascendancy ?? null,
      d.maxHp ?? null,
      d.bankedAt,
    );
  }

  private remove(id: string): void {
    this.ctx.storage.sql.exec('DELETE FROM decks WHERE id = ?', id);
  }

  override async fetch(request: Request): Promise<Response> {
    const action = new URL(request.url).pathname.replace(/^\/+/, '');
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
      if (op === 'claim') {
        const holder = body['holder'];
        if (typeof holder !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(holder))
          return json({ ok: false, error: 'bad-holder' }, 400);
        const next = claimPlay(lease, holder, proof, now, crypto.randomUUID());
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
      const replaceId = typeof body['replaceId'] === 'string' ? body['replaceId'] : undefined;
      const before = this.list();
      const result = bankInto(before, deck, replaceId);
      if (!result.ok) return json({ ok: false, error: 'full', decks: result.list }, 409);
      if (!result.already) {
        // whatever the new list no longer holds (the deck this one replaces, or a deck given up) goes
        const keep = new Set(result.list.map((x) => x.id));
        for (const old of before) if (!keep.has(old.id)) this.remove(old.id);
        this.put(deck);
      }
      return json({ ok: true, decks: this.list() });
    }

    if (action === 'listsync') {
      const name = body['list'];
      if (!isListName(name)) return json({ ok: false, error: 'bad-list' }, 400);
      const have = this.list_(name);
      if (body['readOnly'] === true) return json({ ok: true, ...have });
      const removed = cleanRemoved([...have.removed, ...cleanRemoved(body['removed'])]);
      const items = mergeList(name, have.items, cleanListItems(name, body['items']), removed);
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO lists (name, items, removed) VALUES (?, ?, ?)',
        name,
        JSON.stringify(items),
        JSON.stringify(removed),
      );
      return json({ ok: true, items, removed });
    }

    // what a device has, merged with what is kept here (owning only grows; the newest choice of look wins), and the result back.
    // (every skin is free for now, so a device may claim any skin it names; a priced skin will need the server to grant it)
    if (action === 'cosmetics') {
      const merged = mergeCosmetics(this.cosmetics(), cleanCosmetics(body['cosmetics']));
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO cosmetics (k, data) VALUES ('me', ?)",
        JSON.stringify(merged),
      );
      return json({ ok: true, cosmetics: merged });
    }

    if (action === 'runsave') {
      if (body['revision'] !== lease.revision)
        return json(
          { ok: false, error: 'save-conflict', revision: lease.revision, runs: this.runs() },
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
      return json({ ok: true, runs: this.runs(), revision: lease.revision + 1, replays: clean });
    }

    if (action === 'drop') {
      const id = typeof body['id'] === 'string' ? body['id'] : '';
      if (id) this.remove(id);
      return json({ ok: true, decks: dropFrom(this.list(), id) });
    }

    return json({ ok: false, error: 'not-found' }, 404);
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
