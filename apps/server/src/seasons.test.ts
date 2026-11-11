/// <reference types="node" />
// Seasons on the server (DECISIONS #736, #737): saved decks are wiped when the month turns, cosmetics never are, earned cosmetics are
// only ever given by the server, and the leaderboard remembers what each player did in a season.

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
import { FIRST_DECK_WIPE, RATING_START, seasonOf } from '@sr/pvp';
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

describe('saved decks are wiped when the season ends (DECISIONS #736)', () => {
  it('keeps every deck until the first wipe, then wipes what was saved before the month turned', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    expect(
      (await v.ask('bank', { deck: deck('r~october', Date.UTC(2026, 9, 3)) }, token)).status,
    ).toBe(200);
    expect((await v.ask('bank', { deck: deck('r~november', NOV_10) }, token)).status).toBe(200);
    vi.setSystemTime(NOV_28);
    expect(ids((await v.ask('list')).data)).toEqual(['r~october', 'r~november']);

    vi.setSystemTime(FIRST_DECK_WIPE - 1000);
    expect(ids((await v.ask('list')).data)).toHaveLength(2);
    vi.setSystemTime(FIRST_DECK_WIPE);
    expect(ids((await v.ask('list')).data)).toEqual([]);
  });

  it('a run played on into the new season keeps its deck, and the wiped ones are set aside until the next wipe', async () => {
    vi.setSystemTime(NOV_28);
    const v = vault();
    let token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    await v.ask('bank', { deck: deck('r~finished', NOV_10) }, token);
    await v.ask('bank', { deck: deck('r~going', NOV_28) }, token);

    vi.setSystemTime(DEC_2);
    v.wake();
    // (the play claim hands back the decks: they are already this season's)
    const claimed = await v.ask('play/takeover', { holder: 'pc' });
    token = claimed.data['token'] as string;
    expect(ids(claimed.data)).toEqual([]);
    // the run still going saves again after its next stop, and that deck is December's
    expect((await v.ask('bank', { deck: deck('r~going', DEC_2) }, token)).status).toBe(200);
    expect(ids((await v.ask('list')).data)).toEqual(['r~going']);

    const past = (await v.ask('pastdecks')).data;
    expect(ids(past).sort()).toEqual(['r~finished', 'r~going']);
    expect(past['wiped']).toBe(DEC_2);

    // nothing more is wiped within the season, and the copy set aside stays
    vi.setSystemTime(DEC_2 + 20 * DAY);
    v.wake();
    expect(ids((await v.ask('list')).data)).toEqual(['r~going']);
    expect(ids((await v.ask('pastdecks')).data)).toHaveLength(2);

    // the next wipe replaces it
    vi.setSystemTime(JAN_2);
    expect(ids((await v.ask('list')).data)).toEqual([]);
    expect(ids((await v.ask('pastdecks')).data)).toEqual(['r~going']);
  });

  it('does not take back a deck of a season that has ended, or let a wrong clock outlast the season', async () => {
    vi.setSystemTime(DEC_2);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    const late = await v.ask('bank', { deck: deck('r~offline', NOV_28) }, token);
    expect(late.status).toBe(400);
    expect(late.data['error']).toBe('bad-deck');
    // a device whose clock is a year ahead: the deck is taken as saved now
    await v.ask('bank', { deck: deck('r~future', DEC_2 + 365 * DAY) }, token);
    const kept = (await v.ask('list')).data['decks'] as { id: string; bankedAt: number }[];
    expect(kept).toEqual([expect.objectContaining({ id: 'r~future', bankedAt: DEC_2 })]);
    vi.setSystemTime(JAN_2);
    expect(ids((await v.ask('list')).data)).toEqual([]);
  });

  it('a device whose clock is slow does not lose a deck saved just after the month turned', async () => {
    const HOUR = 3_600_000;
    vi.setSystemTime(FIRST_DECK_WIPE + HOUR / 2);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    // its clock reads an hour behind, so the save time it sends is still November's
    const slow = Date.now() - HOUR;
    const saved = await v.ask('bank', { deck: deck('r~slow-clock', slow), now: slow }, token);
    expect(saved.status).toBe(200);
    const kept = (await v.ask('list')).data['decks'] as { id: string; bankedAt: number }[];
    expect(kept).toEqual([expect.objectContaining({ id: 'r~slow-clock', bankedAt: Date.now() })]);
    // ... and a deck it really saved a week ago is a week old, and so last season's: refused, and said to be expired
    const old = await v.ask('bank', { deck: deck('r~old', slow - 7 * DAY), now: slow }, token);
    expect(old.data).toEqual(
      expect.objectContaining({ ok: false, error: 'bad-deck', expired: true }),
    );
  });

  it('a device whose clock is fast cannot bring back a deck the wipe took', async () => {
    vi.setSystemTime(DEC_2);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    // its clock is three days ahead: a deck it saved on 29 November carries a December save time
    const fast = Date.now() + 3 * DAY;
    const back = await v.ask(
      'bank',
      { deck: deck('r~fast-clock', fast - 3 * DAY), now: fast },
      token,
    );
    expect(back.data['expired']).toBe(true);
    expect(ids((await v.ask('list')).data)).toEqual([]);
  });

  it('never touches cosmetics, runs or history', async () => {
    vi.setSystemTime(NOV_28);
    const v = vault();
    const token = (await v.ask('play/claim', { holder: 'pc' })).data['token'] as string;
    await v.ask('bank', { deck: deck('r~one', NOV_28) }, token);
    await v.ask('cosmetics', { cosmetics: { owned: ['knight-sunwarden'] } });
    await v.ask('grant', { ids: ['back-season'] });
    await v.ask(
      'runsave',
      { runs: [{ id: 'run', updated: 1, text: 'a run in progress' }], revision: 0, replays: {} },
      token,
    );
    vi.setSystemTime(JAN_2);
    v.wake();
    expect(ids((await v.ask('list')).data)).toEqual([]);
    const cosmetics = (await v.ask('cosmetics', { cosmetics: {} })).data['cosmetics'];
    expect(cosmetics).toEqual(
      expect.objectContaining({ owned: ['knight-sunwarden', 'back-season'] }),
    );
    expect((await v.ask('runs')).data['runs']).toEqual([
      expect.objectContaining({ id: 'run', text: 'a run in progress' }),
    ]);
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
