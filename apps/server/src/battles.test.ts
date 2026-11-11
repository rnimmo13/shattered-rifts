/// <reference types="node" />
// The Arena board shows battles beside matches (DECISIONS #746): a match is a best of three and places go by matches won; every game
// inside those matches is a battle, counted for both players.

import { afterEach, expect, it } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Leaderboard } from './board';

let database: DatabaseSync | undefined;
afterEach(() => database?.close());

function board() {
  const db = (database = new DatabaseSync(':memory:'));
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
          return { toArray: () => rows, one: () => rows[0] };
        },
      },
    },
  };
  const object = new Leaderboard(
    ctx as unknown as ConstructorParameters<typeof Leaderboard>[0],
    {} as ConstructorParameters<typeof Leaderboard>[1],
  );
  const post = async (path: string, body: object) =>
    (
      await object.fetch(
        new Request(`https://board.invalid${path}`, { method: 'POST', body: JSON.stringify(body) }),
      )
    ).json<Record<string, unknown>>();
  const get = async (path: string) =>
    (await object.fetch(new Request(`https://board.invalid${path}`))).json<
      Record<string, unknown>
    >();
  return { post, get };
}

const ANN = 'a'.repeat(64);
const BEN = 'b'.repeat(64);

it('counts every battle of a match for both players, and ranks by matches as before', async () => {
  const b = board();
  // a best of three that went the distance: Ann, Ben, Ann
  expect((await b.post('/pvp/game', { winner: ANN, loser: BEN }))['counted']).toBe(true);
  await b.post('/pvp/game', { winner: BEN, loser: ANN });
  await b.post('/pvp/game', { winner: ANN, loser: BEN });
  // ... and the match it decided
  const match = await b.post('/pvp', {
    winner: { id: ANN, name: 'Ann', hero: 'knight' },
    loser: { id: BEN, name: 'Ben', hero: 'monk' },
  });
  expect(match['counted']).toBe(true);

  const view = await b.get('/pvp?period=week');
  const rows = view['board'] as {
    name: string;
    wins: number;
    losses: number;
    battles?: { won: number; lost: number };
  }[];
  expect(rows.map((r) => [r.name, r.wins, r.losses, r.battles])).toEqual([
    ['Ann', 1, 0, { won: 2, lost: 1 }],
    ['Ben', 0, 1, { won: 1, lost: 2 }],
  ]);
});

it('counts battles against a ghost for the ghost and for the person, only for a ghost the board knows', async () => {
  const b = board();
  // (a ghost nobody registered: not counted)
  expect(
    (await b.post('/ghost/game', { ghost: 'nobody', human: ANN, ghostWon: false }))['counted'],
  ).toBe(false);
  expect((await b.post('/ghost/game', { ghost: 'g1', human: 'x', ghostWon: false }))['ok']).toBe(
    false,
  );
});

it('does not count a battle against oneself, or a malformed one', async () => {
  const b = board();
  expect((await b.post('/pvp/game', { winner: ANN, loser: ANN }))['counted']).toBe(false);
  expect((await b.post('/pvp/game', { winner: 'x', loser: BEN }))['ok']).toBe(false);
});
