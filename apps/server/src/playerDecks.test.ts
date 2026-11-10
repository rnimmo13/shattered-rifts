/// <reference types="node" />
// A player's saved decks by username (DECISIONS #723): public, from an unlisted page.
import { afterEach, expect, it } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { RIFTWALKERS } from '@sr/content/v2';
import { Leaderboard } from './board';

let database: DatabaseSync | undefined;
afterEach(() => database?.close());

function board(): Leaderboard {
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
  return new Leaderboard(
    ctx as unknown as ConstructorParameters<typeof Leaderboard>[0],
    {} as ConstructorParameters<typeof Leaderboard>[1],
  );
}
const ip = 'c'.repeat(64);
const player = 'a'.repeat(64);
const post = async (b: Leaderboard, path: string, body: object) =>
  await (
    await b.fetch(
      new Request(`https://board.invalid${path}`, {
        method: 'POST',
        body: JSON.stringify({ ip, ...body }),
      }),
    )
  ).json<Record<string, unknown>>();
const decksOf = async (b: Leaderboard, name: string) =>
  await (
    await b.fetch(new Request(`https://board.invalid/decks?name=${encodeURIComponent(name)}`))
  ).json<{
    ok: boolean;
    found: boolean;
    name: string;
    decks: { hero: string; cards: string[]; tier: number }[];
  }>();

it("finds a player's saved decks by their username, any case, with the cards", async () => {
  const b = board();
  expect((await post(b, '/name/claim', { player, name: 'Sacagweeda' }))['ok']).toBe(true);
  const deck = [...RIFTWALKERS.shaman.starter];
  const saved = await post(b, '/ghost/register', {
    owner: player,
    entry: {
      name: 'Sacagweeda',
      hero: 'shaman',
      deck,
      boons: [],
      tier: 4,
      stage: 1,
      run: 'r'.repeat(64),
    },
  });
  expect(saved['registered']).toBe(true);
  const found = await decksOf(b, 'sacagweeda');
  expect(found).toMatchObject({ ok: true, found: true, name: 'Sacagweeda' });
  expect(found.decks).toHaveLength(1);
  expect(found.decks[0]).toMatchObject({ hero: 'shaman', tier: 4 });
  expect([...found.decks[0]!.cards].sort()).toEqual([...deck].sort());
});

it('answers plainly for an unknown or bad name', async () => {
  const b = board();
  expect(await decksOf(b, 'nobody')).toMatchObject({ ok: true, found: false, decks: [] });
  expect((await decksOf(b, '')).ok).toBe(false);
  expect((await decksOf(b, 'x'.repeat(41))).ok).toBe(false);
});
