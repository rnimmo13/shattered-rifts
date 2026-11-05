/// <reference types="node" />
import { afterEach, expect, it } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Leaderboard } from './board';

let database: DatabaseSync | undefined;
afterEach(() => database?.close());
it('migrates old boards and updates spending at equal progress without restoring a delayed balance', async () => {
  const db = (database = new DatabaseSync(':memory:'));
  db.exec(
    'CREATE TABLE runs (player TEXT NOT NULL, run TEXT NOT NULL, name TEXT NOT NULL, hero TEXT NOT NULL, tier INTEGER NOT NULL, stage INTEGER NOT NULL, total INTEGER NOT NULL, first_at INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY(player,run))',
  );
  const kv = new Map<string, unknown>();
  const ctx = {
    storage: {
      kv: {
        get: (key: string) => kv.get(key),
        put: (key: string, value: unknown) => kv.set(key, value),
      },
      sql: {
        exec: (query: string, ...args: SQLInputValue[]) => {
          const rows = db.prepare(query).all(...args);
          return { toArray: () => rows };
        },
      },
    },
  };
  const board = new Leaderboard(
    ctx as unknown as ConstructorParameters<typeof Leaderboard>[0],
    {} as ConstructorParameters<typeof Leaderboard>[1],
  );
  const player = 'a'.repeat(64);
  db.prepare('INSERT INTO names (player,key,name,at) VALUES (?,?,?,?)').run(
    player,
    'ann',
    'Ann',
    Date.now(),
  );
  const ask = async (body: object) => {
    const response = await board.fetch(
      new Request('https://board.invalid/run', {
        method: 'POST',
        body: JSON.stringify({
          player,
          run: 'ranked-run',
          hero: 'knight',
          tier: 5,
          stage: 0,
          ...body,
        }),
      }),
    );
    return response;
  };
  const at = Date.now() - 1000;
  expect((await ask({ shards: 200, reportedAt: at })).status).toBe(200);
  const progressAt = (db.prepare('SELECT at FROM runs').get() as { at: number }).at;
  await ask({ shards: 40, reportedAt: at + 100 });
  await ask({ shards: 200, reportedAt: at });
  expect(db.prepare('SELECT shards,at FROM runs').get()).toEqual({ shards: 40, at: progressAt });
  await ask({ tier: 4, shards: 999, reportedAt: at + 200 });
  expect((db.prepare('SELECT shards FROM runs').get() as { shards: number }).shards).toBe(40);
  expect((await ask({ shards: -1 })).status).toBe(400);
  const view = await board.fetch(
    new Request('https://board.invalid/view', {
      method: 'POST',
      body: JSON.stringify({ kind: 'runs', period: 'week', player }),
    }),
  );
  const result = await view.json<{ board: { shards: number }[] }>();
  expect(result.board[0]!.shards).toBe(40);
});

it('records and repairs completed runs without letting late death reports overwrite victory', async () => {
  const db = (database = new DatabaseSync(':memory:'));
  const kv = new Map<string, unknown>();
  const board = new Leaderboard(
    {
      storage: {
        kv: {
          get: (key: string) => kv.get(key),
          put: (key: string, value: unknown) => kv.set(key, value),
        },
        sql: {
          exec: (q: string, ...args: SQLInputValue[]) => {
            const rows = db.prepare(q).all(...args);
            return { toArray: () => rows };
          },
        },
      },
    } as unknown as ConstructorParameters<typeof Leaderboard>[0],
    {} as ConstructorParameters<typeof Leaderboard>[1],
  );
  const player = 'b'.repeat(64);
  db.prepare('INSERT INTO names (player,key,name,at) VALUES (?,?,?,?)').run(
    player,
    'bob',
    'Bob',
    Date.now(),
  );
  const ask = (body: object) =>
    board.fetch(
      new Request('https://board.invalid/run', {
        method: 'POST',
        body: JSON.stringify({
          player,
          run: 'winner',
          hero: 'knight',
          tier: 12,
          stage: 3,
          ...body,
        }),
      }),
    );
  expect((await ask({ ended: 'completed', shards: 80 })).status).toBe(200);
  expect(db.prepare('SELECT ended FROM runs').get()).toEqual({ ended: 'completed' });
  await ask({ ended: 'fell' });
  await ask({ ended: 'abandoned' });
  expect(db.prepare('SELECT ended FROM runs').get()).toEqual({ ended: 'completed' });
  db.exec("UPDATE runs SET ended='fell'");
  await ask({ ended: 'completed' });
  expect(db.prepare('SELECT ended,shards FROM runs').get()).toEqual({
    ended: 'completed',
    shards: 80,
  });
  const view = await board.fetch(
    new Request('https://board.invalid/view', {
      method: 'POST',
      body: JSON.stringify({ kind: 'runs', period: 'week', player }),
    }),
  );
  expect((await view.json<{ board: { status: string }[] }>()).board[0]!.status).toBe('completed');
  expect((await ask({ ended: 'completed', tier: 11 })).status).toBe(400);
  expect((await ask({ ended: 'completed', stage: 0 })).status).toBe(400);
});
