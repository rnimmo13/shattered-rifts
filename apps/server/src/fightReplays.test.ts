/// <reference types="node" />
// Campaign fights kept on the server (DECISIONS #697): each account's newest ten, shared by a link, and anyone with it may fetch one.
import { afterEach, expect, it } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
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
const fightOf = (n: number) => ({
  rules: 100,
  version: '0.234.0',
  title: `Fight ${n}`,
  won: n % 2 === 0,
  hero: 'necromancer',
  tier: 3,
  replay: { setup: { seed: `s${n}` }, moves: [], title: `Fight ${n}`, me: 'a' },
});
const ip = 'c'.repeat(64);
const post = async (b: Leaderboard, path: string, body: object) =>
  await (
    await b.fetch(
      new Request(`https://board.invalid${path}`, {
        method: 'POST',
        body: JSON.stringify({ ip, ...body }),
      }),
    )
  ).json<Record<string, unknown>>();

it('keeps a player’s newest ten Campaign fights, lists them newest first and serves one by its id', async () => {
  const b = board();
  const player = 'a'.repeat(64);
  const ids: string[] = [];
  for (let n = 0; n < 12; n++) {
    const r = await post(b, '/fight/save', { player, fight: fightOf(n) });
    expect(r['ok']).toBe(true);
    ids.push(r['id'] as string);
  }
  const list = await post(b, '/fight/recent', { player });
  const fights = list['fights'] as { id: string; title: string; won: boolean; tier: number }[];
  expect(fights).toHaveLength(10);
  expect(fights[0]!.title).toBe('Fight 11');
  expect(fights[0]!.won).toBe(false);
  expect(fights[0]!.tier).toBe(3);
  // (the two oldest are gone)
  expect(fights.map((f) => f.id)).not.toContain(ids[0]);
  const one = await (
    await b.fetch(new Request(`https://board.invalid/fight?id=${ids[11]}`))
  ).json<{
    ok: boolean;
    fight: { title: string; replay: { setup: { seed: string } } };
  }>();
  expect(one.ok).toBe(true);
  expect(one.fight.replay.setup.seed).toBe('s11');
  const gone = await b.fetch(new Request(`https://board.invalid/fight?id=${ids[0]}`));
  expect(gone.status).toBe(404);
  // (another player's list does not show them)
  const other = await post(b, '/fight/recent', { player: 'b'.repeat(64) });
  expect(other['fights']).toEqual([]);
});

it('refuses a fight with no moves list, or one too big', async () => {
  const b = board();
  const player = 'a'.repeat(64);
  expect((await post(b, '/fight/save', { player, fight: { rules: 100, title: 'x' } }))['ok']).toBe(
    false,
  );
  const huge = fightOf(1);
  huge.replay.moves = Array.from({ length: 5000 }, () => ({
    seat: 'a',
    action: { type: 'endTurn', pad: 'x'.repeat(60) },
  })) as never;
  expect((await post(b, '/fight/save', { player, fight: huge }))['ok']).toBe(false);
});

it('keeps one fight sent twice once, under the link it already has', async () => {
  const b = board();
  const player = 'a'.repeat(64);
  const first = await post(b, '/fight/save', { player, fight: fightOf(1) });
  const again = await post(b, '/fight/save', { player, fight: fightOf(1) });
  expect(again['id']).toBe(first['id']);
  const list = await post(b, '/fight/recent', { player });
  expect(list['fights']).toHaveLength(1);
});

it('refuses a fight of the wrong shape, keeps only the known fields, and needs a player', async () => {
  const b = board();
  const player = 'a'.repeat(64);
  const bad = (change: Record<string, unknown>) =>
    post(b, '/fight/save', { player, fight: { ...fightOf(1), ...change } });
  expect((await bad({ replay: { setup: null, moves: [] } }))['ok']).toBe(false);
  expect((await bad({ title: { not: 'text' } }))['ok']).toBe(false);
  expect((await bad({ tier: '3' }))['ok']).toBe(false);
  expect((await bad({ won: 'yes' }))['ok']).toBe(false);
  const ok = await bad({ extra: 'dropped' });
  const one = await (
    await b.fetch(new Request(`https://board.invalid/fight?id=${ok['id'] as string}`))
  ).json<{ fight: Record<string, unknown> }>();
  expect(one.fight['extra']).toBeUndefined();
  expect((await post(b, '/fight/save', { player: 'nobody', fight: fightOf(2) }))['ok']).toBe(false);
  expect((await post(b, '/fight/recent', { player: 'nobody' }))['ok']).toBe(false);
});

it('lets one address save only so many fights a day, whatever codes it uses', async () => {
  const b = board();
  let saved = 0;
  // (400 a day since #714)
  for (let n = 0; n < 410; n++) {
    const player = n.toString(16).padStart(64, '0');
    if ((await post(b, '/fight/save', { player, fight: fightOf(n) }))['ok']) saved++;
  }
  expect(saved).toBe(400);
});
