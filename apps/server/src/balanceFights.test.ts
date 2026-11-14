/// <reference types="node" />
// Player balance data (DECISIONS #714): every online Campaign fight is kept for the owner's review with its numbers and replay, apart
// from the player's own ten, and the owner's export pages through them.
import { afterEach, expect, it } from 'vitest';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Leaderboard } from './board';

let database: DatabaseSync | undefined;
afterEach(() => database?.close());

function board(): Leaderboard {
  const db = (database = new DatabaseSync(':memory:'));
  const ctx = {
    storage: {
      kv: { get: () => undefined, put: () => undefined },
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
const stats = {
  schema: 1,
  me: 'a',
  won: true,
  turns: 4,
  deckSize: 10,
  hp: { start: 80, end: 60, max: 80 },
  selfHpLost: 0,
  dealt: 82,
  foeHp: 82,
  perTurn: [20, 20, 22, 20],
  byCard: { strike: { plays: 6, dealt: 60 }, bash: { plays: 2, dealt: 22 } },
  unplayed: 0,
  peak: { turn: 3, dealt: 22, cards: [{ card: 'bash', dealt: 22 }] },
};
const fightOf = (n: number, extra: Record<string, unknown> = {}) => ({
  rules: 102,
  version: '0.236.0',
  title: `Fight ${n}`,
  won: true,
  hero: 'knight',
  tier: 2,
  encounter: 'squire-pair',
  node: 'duel',
  floor: 3,
  stats,
  replay: { setup: { seed: `s${n}` }, moves: [], title: `Fight ${n}`, me: 'a' },
  ...extra,
});
const post = async (b: Leaderboard, path: string, body: object) =>
  await (
    await b.fetch(
      new Request(`https://board.invalid${path}`, {
        method: 'POST',
        body: JSON.stringify({ ip: 'c'.repeat(64), ...body }),
      }),
    )
  ).json<Record<string, unknown>>();
const exportPage = async (b: Leaderboard, after = 0) =>
  await (
    await b.fetch(new Request(`https://board.invalid/balance/fights/export?after=${after}`))
  ).json<{
    fights: Record<string, unknown>[];
    next: number;
    more: boolean;
    retentionDays: number;
  }>();

it('keeps every fight for the balance review, past the player’s own ten, with its numbers and where it was', async () => {
  const b = board();
  const player = 'a'.repeat(64);
  for (let n = 0; n < 14; n++)
    expect((await post(b, '/fight/save', { player, fight: fightOf(n) }))['ok']).toBe(true);
  // (sent again: kept once)
  await post(b, '/fight/save', { player, fight: fightOf(3) });
  const page = await exportPage(b);
  expect(page.fights).toHaveLength(14);
  expect(page.more).toBe(false);
  expect(page.retentionDays).toBe(30);
  const f = page.fights[0]!;
  // (an id of its own in the public export, never the player's leaderboard id, DECISIONS #804; the same player keeps the same one)
  expect(f['player']).toMatch(/^[0-9a-f]{64}$/);
  expect(f['player']).not.toBe(player);
  expect(f['encounter']).toBe('squire-pair');
  expect(f['node']).toBe('duel');
  expect(f['floor']).toBe(3);
  expect(f['stats']).toEqual(stats);
  expect((f['replay'] as { setup: { seed: string } }).setup.seed).toBe('s0');
  // (the player's own list still keeps ten)
  expect((await post(b, '/fight/recent', { player }))['fights']).toHaveLength(10);
});

it('drops stats of the wrong shape and anything unknown, and keeps the fight', async () => {
  const b = board();
  const player = 'a'.repeat(64);
  await post(b, '/fight/save', {
    player,
    fight: fightOf(1, {
      stats: { ...stats, perTurn: ['lots'] },
      encounter: 'x'.repeat(200),
      secret: 'y',
    }),
  });
  const f = (await exportPage(b)).fights[0]!;
  expect(f['stats']).toBeUndefined();
  expect(f['encounter']).toBeUndefined();
  expect(JSON.stringify(f)).not.toContain('secret');
});

it('pages the export twenty at a time', async () => {
  const b = board();
  for (let n = 0; n < 25; n++)
    await post(b, '/fight/save', {
      player: (n % 9).toString(16).repeat(64),
      fight: fightOf(n),
    });
  const first = await exportPage(b);
  expect(first.fights).toHaveLength(20);
  expect(first.more).toBe(true);
  const second = await exportPage(b, first.next);
  expect(second.fights).toHaveLength(5);
  expect(second.more).toBe(false);
});
