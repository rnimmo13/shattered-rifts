/// <reference types="node" />
// Hero mastery on the server (DECISIONS #739, #741): a player's Vault counts the campaign itself, from the decks a run saves and from
// the run history (each run once), gives a mastered Riftwalker's card back without being asked, logs what it gave, and remembers what
// the player has acknowledged. A device's own numbers are taken only for matches won.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { RIFTWALKERS } from '@sr/content/v2';
import { VAULT_SLOTS, type Earned } from '@sr/pvp';
import { Vault } from './vault';

const NOV_10 = Date.UTC(2026, 10, 10, 12);

const databases: DatabaseSync[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
  vi.useRealTimers();
});

function vault() {
  const db = new DatabaseSync(':memory:');
  databases.push(db);
  const ctx = {
    storage: {
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
  };
  const make = (): Vault =>
    new Vault(
      ctx as unknown as ConstructorParameters<typeof Vault>[0],
      {} as ConstructorParameters<typeof Vault>[1],
    );
  let object = make();
  let token = '';
  const ask = async (action: string, body: object = {}) => {
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
    ask,
    /** this device takes play, as a device does before it saves anything */
    play: async (): Promise<void> => {
      token = (await ask('play/claim', { holder: 'pc' })).data['token'] as string;
    },
    wake: (): void => void (object = make()),
  };
}

const owned = (data: Record<string, unknown>): string[] =>
  (data['cosmetics'] as { owned: string[] }).owned;
const log = (data: Record<string, unknown>): Earned[] => data['earned'] as Earned[];

const deck = (id: string, hero: string, tier: number, stage: number, won = false, at = NOV_10) => ({
  id,
  hero,
  tier,
  stage,
  deck: [...RIFTWALKERS[hero as keyof typeof RIFTWALKERS].starter],
  boons: [],
  bankedAt: at,
  weaponCards: true,
  ...(won ? { won: true } : {}),
});

describe('hero mastery on the Vault (DECISIONS #739, #741)', () => {
  it('counts how far a run has got from the deck it saves, and says so when a number rises', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    const first = await v.ask('bank', { deck: deck('r~one', 'knight', 3, 0) });
    expect(first.data['mastery']).toBe(true);
    // the same stop again: nothing rises
    expect((await v.ask('bank', { deck: deck('r~one', 'knight', 3, 0) })).data['mastery']).toBe(
      false,
    );
    await v.ask('bank', { deck: deck('r~one', 'knight', 3, 3, false, NOV_10 + 1000) });
    const now = await v.ask('mastery', {});
    expect(now.data['mastery']).toEqual({
      knight: { best: 3, clears: 0, arenaWins: 0, ghostWins: 0 },
    });
    expect(owned(now.data)).toEqual([]);
    expect(log(now.data)).toEqual([]);
  });

  it('a won run is one clear, gives the card back at once, and is never counted twice', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    await v.ask('bank', { deck: deck('r~won', 'knight', 12, 3, true) });
    // saved again (another device, a later copy): still one clear
    await v.ask('bank', { deck: deck('r~won', 'knight', 12, 3, true, NOV_10 + 5000) });
    const one = await v.ask('mastery', {});
    expect(one.data['mastery']).toEqual({
      knight: { best: 12, clears: 1, arenaWins: 0, ghostWins: 0 },
    });
    expect(owned(one.data)).toEqual(['back-knight']);
    expect(log(one.data)).toEqual([
      { id: 'cosmetic:back-knight', at: NOV_10, cosmetic: 'back-knight', why: 'mastery' },
    ]);
    // a second campaign cleared with the same Riftwalker: mastery 2, no second card back
    v.wake();
    await v.ask('bank', { deck: deck('r~won-again', 'knight', 12, 3, true, NOV_10 + 9000) });
    const two = await v.ask('mastery', {});
    expect((two.data['mastery'] as Record<string, { clears: number }>)['knight']?.clears).toBe(2);
    expect(log(two.data)).toHaveLength(1);
  });

  it('standing in the last tier is not a clear until the run is won', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    await v.ask('bank', { deck: deck('r~late', 'monk', 12, 3) });
    const m = (await v.ask('mastery', {})).data;
    expect(m['mastery']).toEqual({ monk: { best: 11, clears: 0, arenaWins: 0, ghostWins: 0 } });
    expect(owned(m)).toEqual([]);
  });

  it('a clear counts even when the Vault has no room for the deck', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    for (let i = 0; i < VAULT_SLOTS; i++)
      await v.ask('bank', { deck: deck(`r~fill-${i}`, 'hunter', 1, 0, false, NOV_10 + i) });
    const full = await v.ask('bank', { deck: deck('r~won', 'shaman', 12, 3, true, NOV_10 + 99) });
    expect(full.status).toBe(409);
    expect(full.data['mastery']).toBe(true);
    expect(owned((await v.ask('mastery', {})).data)).toEqual(['back-shaman']);
  });

  it('counts the campaigns the run history tells of, once each, with the deck of the same run', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    const history = [
      { id: 'old-1', at: 100, hero: 'necromancer', tier: 12, end: 'banked', won: true, deck: [] },
      { id: 'old-2', at: 200, hero: 'necromancer', tier: 12, end: 'banked', won: true, deck: [] },
      { id: 'old-3', at: 300, hero: 'trickster', tier: 6, end: 'collapsed', deck: [] },
      // (a record from before runs said they were won: its last fight beat the last enemy)
      {
        id: 'old-4',
        at: 400,
        hero: 'monk',
        tier: 12,
        end: 'collapsed',
        deck: [],
        lastFight: { won: true, setup: { b: { enemies: ['vorthax'] } } },
      },
    ];
    const synced = await v.ask('listsync', { list: 'history', items: history, removed: [] });
    expect(synced.data['mastery']).toBe(true);
    // the history again, and the deck of one of those runs: nothing more is counted
    expect(
      (await v.ask('listsync', { list: 'history', items: history, removed: [] })).data['mastery'],
    ).toBe(false);
    await v.ask('bank', { deck: deck('r~old-1', 'necromancer', 12, 3, true) });
    const m = await v.ask('mastery', {});
    expect(m.data['mastery']).toEqual({
      necromancer: { best: 12, clears: 2, arenaWins: 0, ghostWins: 0 },
      trickster: { best: 5, clears: 0, arenaWins: 0, ghostWins: 0 },
      monk: { best: 12, clears: 1, arenaWins: 0, ghostWins: 0 },
    });
    expect(owned(m.data).sort()).toEqual(['back-monk', 'back-necromancer']);
  });

  it('counts a history kept here from before mastery, the first time mastery is asked for', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    // (kept by a server from before this: written straight to the list, as it would have been)
    await v.ask('listsync', {
      list: 'history',
      items: [
        { id: 'kept', at: 100, hero: 'drunkard', tier: 12, end: 'banked', won: true, deck: [] },
      ],
      removed: [],
    });
    v.wake();
    const m = await v.ask('mastery', {});
    expect((m.data['mastery'] as Record<string, { clears: number }>)['drunkard']?.clears).toBe(1);
    expect(owned(m.data)).toEqual(['back-drunkard']);
  });

  it("takes a device's match counts, the larger of each, and nothing else of its numbers", async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.ask('mastery', { mastery: { knight: { arenaWins: 3, ghostWins: 8 } } });
    const second = await v.ask('mastery', {
      mastery: { knight: { best: 12, clears: 40, arenaWins: 2, ghostWins: 9 } },
    });
    expect(second.data['mastery']).toEqual({
      knight: { best: 0, clears: 0, arenaWins: 3, ghostWins: 9 },
    });
    // (a device cannot say it cleared the campaign: no card back)
    expect(owned(second.data)).toEqual([]);
  });

  it('remembers what the player has acknowledged, on every device', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    await v.ask('bank', { deck: deck('r~won', 'shaman', 12, 3, true) });
    const seen = await v.ask('mastery', { seen: ['cosmetic:back-shaman', 'cosmetic:made-up'] });
    expect(log(seen.data)[0]).toMatchObject({ cosmetic: 'back-shaman', seen: true });
    v.wake();
    expect(log((await v.ask('mastery', {})).data)[0]?.seen).toBe(true);
  });

  it('a device still cannot claim the card back for itself', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    const claimed = await v.ask('cosmetics', {
      cosmetics: {
        owned: ['back-knight'],
        worn: {},
        using: { cardBack: { id: 'back-knight', at: 5 } },
      },
    });
    expect(owned(claimed.data)).toEqual([]);
    expect((claimed.data['cosmetics'] as { using?: unknown }).using).toBeUndefined();
    // earned, it can be put to use
    await v.ask('bank', { deck: deck('r~won', 'knight', 12, 3, true) });
    const used = await v.ask('cosmetics', {
      cosmetics: { owned: [], worn: {}, using: { cardBack: { id: 'back-knight', at: 9 } } },
    });
    expect((used.data['cosmetics'] as { using?: unknown }).using).toEqual({
      cardBack: { id: 'back-knight', at: 9 },
    });
  });

  it("does not take another player's copy from a browser they shared", async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const first = await v.ask('mastery', { mastery: { monk: { arenaWins: 4 } } });
    const owner = first.data['owner'] as string;
    expect(typeof owner).toBe('string');
    // the same browser, back again with this Vault's mark: its match counts are taken
    const same = await v.ask('mastery', { owner, mastery: { monk: { arenaWins: 6 } } });
    expect(same.data['reset']).toBeUndefined();
    expect(same.data['mastery']).toEqual({
      monk: { best: 0, clears: 0, arenaWins: 6, ghostWins: 0 },
    });
    // a browser whose copy was brought together with another Vault: nothing of it is taken, and it is told to start again
    const other = await v.ask('mastery', {
      owner: 'someone-else',
      mastery: { knight: { arenaWins: 50 } },
      seen: ['cosmetic:back-knight'],
    });
    expect(other.data['reset']).toBe(true);
    expect(other.data['mastery']).toEqual({
      monk: { best: 0, clears: 0, arenaWins: 6, ghostWins: 0 },
    });
  });

  it('a run that cleared the campaign stays marked when a build that does not know the mark saves it again', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    await v.ask('bank', { deck: deck('r~won', 'knight', 12, 3, true) });
    const later = deck('r~won', 'knight', 12, 3, false, NOV_10 + 1000);
    const again = await v.ask('bank', { deck: { ...later, deck: [...later.deck, 'strike'] } });
    const saved = (again.data['decks'] as { won?: boolean; deck: string[] }[])[0]!;
    expect(saved.deck).toHaveLength(later.deck.length + 1);
    expect(saved.won).toBe(true);
  });

  it('a season reward the server gives is logged as one', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    const given = await v.ask('grant', { ids: ['back-monk'], why: 'season' });
    expect(given.data['granted']).toEqual(['back-monk']);
    expect(log(given.data)).toEqual([
      { id: 'cosmetic:back-monk', at: NOV_10, cosmetic: 'back-monk', why: 'season' },
    ]);
  });

  it('is kept, with the deck, when a season ends', async () => {
    vi.setSystemTime(NOV_10);
    const v = vault();
    await v.play();
    await v.ask('bank', { deck: deck('r~won', 'knight', 12, 3, true) });
    await v.ask('mastery', { mastery: { knight: { arenaWins: 4 } } });

    vi.setSystemTime(Date.UTC(2026, 11, 2, 12));
    v.wake();
    expect((await v.ask('list')).data['decks']).toHaveLength(1);
    const after = await v.ask('mastery', {});
    expect(after.data['mastery']).toEqual({
      knight: { best: 12, clears: 1, arenaWins: 4, ghostWins: 0 },
    });
    expect(owned(after.data)).toEqual(['back-knight']);
    expect(log(after.data)).toHaveLength(1);
  });
});
