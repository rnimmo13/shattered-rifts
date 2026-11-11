/// <reference types="node" />
// Seasons on the server (DECISIONS #736, #737, #753): saved decks are kept when the month turns, earned cosmetics are only ever
// given by the server, and the leaderboard remembers what each player did in a season.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type * as Content from '@sr/content/v2';

// (no card back is made yet, so the rules are tried with stand-ins: one free to take, one earned)
vi.mock('@sr/content/v2', async (original) => {
  const actual = await original<typeof Content>();
  const extra: Record<string, Content.CosmeticDef> = {
    'back-free': { id: 'back-free', kind: 'cardBack', price: 0, earned: false },
    'back-season': { id: 'back-season', kind: 'cardBack', price: 0, earned: true },
  };
  return {
    ...actual,
    cosmeticDef: (id: unknown) =>
      typeof id === 'string' && extra[id] ? extra[id] : actual.cosmeticDef(id),
  };
});

import { RIFTWALKERS } from '@sr/content/v2';
import { RATING_START, seasonOf } from '@sr/pvp';
import { Vault } from './vault';
import { Leaderboard } from './board';

const DAY = 86_400_000;
const NOV_10 = Date.UTC(2026, 10, 10, 12);
const NOV_28 = Date.UTC(2026, 10, 28, 12);
const DEC_2 = Date.UTC(2026, 11, 2, 12);
const JAN_2 = Date.UTC(2027, 0, 2, 12);

const databases: DatabaseSync[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
  vi.useRealTimers();
});

function storage() {
  const db = new DatabaseSync(':memory:');
  databases.push(db);
  const kv = new Map<string, unknown>();
  return {
    db,
    ctx: {
      storage: {
        kv: {
          get: (key: string) => kv.get(key),
          put: (key: string, value: unknown) => kv.set(key, value),
        },
        // (SQL runs at once in Workers, not when the rows are read)
        sql: {
          exec: (query: string, ...args: SQLInputValue[]) => {
            const rows = db.prepare(query).all(...args);
            return { toArray: () => rows };
          },
        },
        transactionSync: <T>(fn: () => T): T => {
          db.exec('BEGIN');
          try {
            const result = fn();
            db.exec('COMMIT');
            return result;
          } catch (error) {
            db.exec('ROLLBACK');
            throw error;
          }
        },
      },
    },
  };
}

function vault() {
  const { db, ctx } = storage();
  const make = (): Vault =>
    new Vault(
      ctx as unknown as ConstructorParameters<typeof Vault>[0],
      {} as ConstructorParameters<typeof Vault>[1],
    );
  let object = make();
  const ask = async (action: string, body: object = {}, token = '') => {
    const response = await object.fetch(
      new Request(`https://vault.invalid/${action}`, {
        method: 'POST',
        headers: { 'x-sr-play-token': token },
        body: JSON.stringify(body),
      }),
    );
    return { status: response.status, data: await response.json<Record<string, unknown>>() };
  };
  return {
    db,
    ask,
    /** the object is put to sleep and woken, as the platform does: what it remembered in memory is gone */
    wake: (): void => void (object = make()),
  };
}

const deck = (id: string, bankedAt: number) => ({
  id,
  hero: 'knight',
  tier: 4,
  stage: 3,
  deck: [...RIFTWALKERS.knight.starter],
  boons: [],
  bankedAt,
  weaponCards: true,
});
const ids = (data: Record<string, unknown>): string[] =>
  (data['decks'] as { id: string }[]).map((d) => d.id);

describe('saved decks are kept when a season ends (DECISIONS #753)', () => {
  it('keeps every deck across the turn of a month, however old', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    expect(
      (await v.ask('bank', { deck: deck('r~october', Date.UTC(2026, 9, 3)) }, token)).status,
    ).toBe(200);
    expect((await v.ask('bank', { deck: deck('r~november', NOV_10) }, token)).status).toBe(200);

    vi.setSystemTime(DEC_2);
    v.wake();
    expect(ids((await v.ask('list')).data)).toEqual(['r~october', 'r~november']);
    vi.setSystemTime(JAN_2);
    v.wake();
    expect(ids((await v.ask('list')).data)).toEqual(['r~october', 'r~november']);
  });

  it('takes a deck saved in an earlier month from a device that was offline', async () => {
    vi.setSystemTime(DEC_2);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    expect((await v.ask('bank', { deck: deck('r~offline', NOV_28) }, token)).status).toBe(200);
    expect(ids((await v.ask('list')).data)).toEqual(['r~offline']);
  });

  it('a save time is never later than now, and a wrong device clock is corrected', async () => {
    const HOUR = 3_600_000;
    vi.setSystemTime(DEC_2);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    // a device whose clock is a year ahead: the deck is taken as saved now
    await v.ask('bank', { deck: deck('r~future', DEC_2 + 365 * DAY) }, token);
    // a device whose clock reads an hour behind, and says so: its save time is moved by the hour
    const slow = DEC_2 - HOUR;
    await v.ask('bank', { deck: deck('r~slow-clock', slow), now: slow }, token);
    const kept = (await v.ask('list')).data['decks'] as { id: string; bankedAt: number }[];
    expect(kept).toEqual([
      expect.objectContaining({ id: 'r~future', bankedAt: DEC_2 }),
      expect.objectContaining({ id: 'r~slow-clock', bankedAt: DEC_2 }),
    ]);
  });

  it('no request can ask for wiped decks: there are none', async () => {
    vi.setSystemTime(DEC_2);
    const v = vault();
    expect((await v.ask('pastdecks')).data['ok']).not.toBe(true);
  });
});

describe('a saved deck an update left unplayable is kept, shown and acknowledged (DECISIONS #754)', () => {
  /** a deck as an older version saved it, holding a card the game no longer has */
  const breakDeck = (v: ReturnType<typeof vault>, id: string): void => {
    v.db
      .prepare('UPDATE decks SET deck = ? WHERE id = ?')
      .run(JSON.stringify([...RIFTWALKERS.knight.starter, 'a-card-taken-out']), id);
  };
  const broken = (data: Record<string, unknown>) =>
    data['broken'] as { id: string; fault: string; inactive: boolean }[];

  it('leaves the list, takes no slot, and is told of with why', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    await v.ask('bank', { deck: deck('r~old', NOV_10) }, token);
    await v.ask('bank', { deck: deck('r~fine', NOV_10) }, token);
    expect(broken((await v.ask('list')).data)).toEqual([]);

    breakDeck(v, 'r~old');
    v.wake();
    const listed = (await v.ask('list')).data;
    expect(ids(listed)).toEqual(['r~fine']);
    expect(broken(listed)).toEqual([
      expect.objectContaining({ id: 'r~old', hero: 'knight', fault: 'card', inactive: false }),
    ]);
  });

  it('is inactive once acknowledged, and only a broken deck can be', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    await v.ask('bank', { deck: deck('r~old', NOV_10) }, token);
    await v.ask('bank', { deck: deck('r~fine', NOV_10) }, token);
    breakDeck(v, 'r~old');

    // (a playable deck cannot be put aside this way)
    await v.ask('deckack', { id: 'r~fine' });
    expect(ids((await v.ask('list')).data)).toEqual(['r~fine']);
    expect(v.db.prepare('SELECT inactive FROM decks WHERE id = ?').get('r~fine')).toEqual({
      inactive: null,
    });

    const acked = await v.ask('deckack', { id: 'r~old' });
    expect(broken(acked.data)).toEqual([expect.objectContaining({ id: 'r~old', inactive: true })]);
    v.wake();
    expect(broken((await v.ask('list')).data)[0]?.inactive).toBe(true);
  });

  it('comes back by itself when a later update makes it playable again, and can be removed', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    await v.ask('bank', { deck: deck('r~old', NOV_10) }, token);
    await v.ask('bank', { deck: deck('r~other', NOV_10) }, token);
    breakDeck(v, 'r~old');
    breakDeck(v, 'r~other');
    await v.ask('deckack', { id: 'r~old' });

    v.db
      .prepare('UPDATE decks SET deck = ? WHERE id = ?')
      .run(JSON.stringify([...RIFTWALKERS.knight.starter]), 'r~old');
    const again = (await v.ask('list')).data;
    expect(ids(again)).toEqual(['r~old']);
    expect(broken(again).map((b) => b.id)).toEqual(['r~other']);
    // ... and it is not inactive any more: an update that breaks it again is told of again
    breakDeck(v, 'r~old');
    expect(broken((await v.ask('list')).data).find((b) => b.id === 'r~old')?.inactive).toBe(false);
    v.db
      .prepare('UPDATE decks SET deck = ? WHERE id = ?')
      .run(JSON.stringify([...RIFTWALKERS.knight.starter]), 'r~old');

    const dropped = await v.ask('drop', { id: 'r~other' }, token);
    expect(broken(dropped.data)).toEqual([]);
    expect(v.db.prepare('SELECT COUNT(*) AS n FROM decks').get()).toEqual({ n: 1 });
  });
});

describe('earned cosmetics are only ever given by the server (DECISIONS #737)', () => {
  it('a device cannot claim an earned card back, but may take a free one and say what it uses', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const sent = await v.ask('cosmetics', {
      cosmetics: {
        owned: ['back-free', 'back-season'],
        using: { cardBack: { id: 'back-season', at: 5 } },
      },
    });
    expect(sent.data['cosmetics']).toEqual({ owned: ['back-free'], worn: {} });

    const given = await v.ask('grant', { ids: ['back-season', 'made-up'] });
    expect(given.data['granted']).toEqual(['back-season']);
    expect((await v.ask('grant', { ids: ['back-season'] })).data['granted']).toEqual([]);

    const again = await v.ask('cosmetics', {
      cosmetics: { owned: [], using: { cardBack: { id: 'back-season', at: 9 } } },
    });
    expect(again.data['cosmetics']).toEqual({
      owned: ['back-free', 'back-season'],
      worn: {},
      using: { cardBack: { id: 'back-season', at: 9 } },
    });
  });
});

describe("the leaderboard remembers a season's records (DECISIONS #737)", () => {
  function board() {
    const { db, ctx } = storage();
    const object = new Leaderboard(
      ctx as unknown as ConstructorParameters<typeof Leaderboard>[0],
      {} as ConstructorParameters<typeof Leaderboard>[1],
    );
    const post = async (path: string, body: object) => {
      const response = await object.fetch(
        new Request(`https://board.invalid/${path}`, {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
      return response.json<Record<string, unknown>>();
    };
    return { db, post };
  }
  const player = 'a'.repeat(64);

  it('keeps the highest Rift Tier cleared in each season, even for a run played across the turn of the month', async () => {
    vi.setSystemTime(NOV_10);
    const { db, post } = board();
    db.prepare('INSERT INTO names (player,key,name,at) VALUES (?,?,?,?)').run(
      player,
      'ann',
      'Ann',
      NOV_10,
    );
    const report = (tier: number, stage: number) =>
      post('run', { player, run: 'long-run', hero: 'knight', tier, stage });
    await report(1, 0);
    for (const [tier, stage] of [
      [1, 3],
      [2, 0],
      [2, 3],
    ] as const) {
      vi.setSystemTime(Date.now() + 10 * 60_000);
      expect((await report(tier, stage))['counted']).toBe(true);
    }
    // the same run is played on in December and clears Tier III there
    vi.setSystemTime(DEC_2);
    await report(3, 0);
    vi.setSystemTime(DEC_2 + 10 * 60_000);
    await report(3, 3);

    const november = seasonOf(NOV_10);
    const december = seasonOf(DEC_2);
    db.prepare(
      'INSERT INTO ratings (player, season, rating, games, wins, peak, name, hero, at) VALUES (?,?,?,?,?,?,?,?,?)',
    ).run(player, december, RATING_START + 90, 7, 5, RATING_START + 130, 'Ann', 'knight', DEC_2);

    const got = await post('season/record', { player, seasons: [december, november] });
    expect(got['records']).toEqual({
      [String(november)]: { tierCleared: 2, peak: 0, games: 0 },
      [String(december)]: { tierCleared: 3, peak: RATING_START + 130, games: 7 },
    });
    expect((await post('season/record', { player: 'nobody', seasons: [december] }))['ok']).toBe(
      false,
    );
  });

  it('a run the board first hears of mid-tier is not credited with tiers it cleared some other time', async () => {
    vi.setSystemTime(DEC_2);
    const { db, post } = board();
    db.prepare('INSERT INTO names (player,key,name,at) VALUES (?,?,?,?)').run(
      player,
      'ann',
      'Ann',
      DEC_2,
    );
    await post('run', { player, run: 'old-run', hero: 'knight', tier: 9, stage: 0 });
    const got = await post('season/record', { player, seasons: [seasonOf(DEC_2)] });
    expect(got['records']).toEqual({
      [String(seasonOf(DEC_2))]: { tierCleared: 0, peak: 0, games: 0 },
    });
  });
});
