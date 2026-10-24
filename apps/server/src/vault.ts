// A player's Vault, kept on the server: one Durable Object per Vault code, with a small SQLite table of decks. The code is the
// only thing that identifies a player (there are no accounts yet): whoever holds it can read and change that Vault, so it is
// long and random, and the object is named by a hash of it rather than by the code itself.

import { DurableObject } from 'cloudflare:workers';
import { bankInto, cleanDeck, dropFrom, type VaultDeck } from '@sr/pvp';
import type { Env } from './env';

interface Row extends Record<string, SqlStorageValue> {
  id: string;
  hero: string;
  tier: number;
  stage: number | null;
  deck: string;
  boons: string;
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
  }

  private list(): VaultDeck[] {
    const rows = this.ctx.storage.sql
      .exec<Row>(
        'SELECT id, hero, tier, stage, deck, boons, banked_at FROM decks ORDER BY banked_at, id',
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
        bankedAt: r.banked_at,
      });
      return d ? [d] : [];
    });
  }

  private put(d: VaultDeck): void {
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO decks (id, hero, tier, stage, deck, boons, banked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      d.id,
      d.hero,
      d.tier,
      d.stage ?? null,
      JSON.stringify(d.deck),
      JSON.stringify(d.boons),
      d.bankedAt,
    );
  }

  private remove(id: string): void {
    this.ctx.storage.sql.exec('DELETE FROM decks WHERE id = ?', id);
  }

  override async fetch(request: Request): Promise<Response> {
    const action = new URL(request.url).pathname.replace(/^\/+/, '');
    if (action === 'list') return json({ ok: true, decks: this.list() });

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json<unknown>();
      if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'bad-body' }, 400);
    }

    if (action === 'bank') {
      const deck = cleanDeck(body['deck']);
      if (!deck) return json({ ok: false, error: 'bad-deck' }, 400);
      const replaceId = typeof body['replaceId'] === 'string' ? body['replaceId'] : undefined;
      const result = bankInto(this.list(), deck, replaceId);
      if (!result.ok) return json({ ok: false, error: 'full', decks: result.list }, 409);
      if (!result.already) {
        if (replaceId !== undefined) this.remove(replaceId);
        this.put(deck);
      }
      return json({ ok: true, decks: this.list() });
    }

    if (action === 'drop') {
      const id = typeof body['id'] === 'string' ? body['id'] : '';
      if (id) this.remove(id);
      return json({ ok: true, decks: dropFrom(this.list(), id) });
    }

    return json({ ok: false, error: 'not-found' }, 404);
  }
}
