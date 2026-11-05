// Exercise real SQLite storage + private Worker export locally. No live services or player data.
import { createRequire } from 'node:module';
import { realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('../..'),
  work = join(root, '.wrangler/balance-smoke');
mkdirSync(work, { recursive: true });
const require = createRequire(realpathSync(resolve('node_modules/wrangler/package.json')));
await require('esbuild').build({
  entryPoints: [resolve('src/worker.ts')],
  bundle: true,
  keepNames: true,
  format: 'esm',
  platform: 'browser',
  external: ['cloudflare:workers'],
  outfile: join(work, 'worker.js'),
  logLevel: 'silent',
});
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const token = 'local-balance-smoke-token-not-a-production-secret';
const mf = new Miniflare(
  convertV4MiniflareOptions({
    workers: [
      {
        modules: true,
        modulesRoot: work,
        scriptPath: join(work, 'worker.js'),
        compatibilityDate: '2026-10-01',
        durableObjects: Object.fromEntries(
          [
            ['MATCHMAKER', 'Matchmaker'],
            ['MATCH', 'MatchRoom'],
            ['VAULT', 'Vault'],
            ['BOARD', 'Leaderboard'],
            ['IDENTITY', 'Identity'],
          ].map(([key, className]) => [key, { className, useSQLite: true }]),
        ),
        bindings: { BALANCE_ADMIN_TOKEN: token },
        outboundService: () => new Response('No network', { status: 503 }),
      },
    ],
  }),
);
try {
  const board = await mf.getDurableObjectNamespace('BOARD');
  const stub = board.get(board.idFromName('main'));
  const deck = {
    hero: 'knight',
    ascendancy: 'knight:marshal',
    cards: ['blood-oath+', 'strike', 'strike'],
  };
  const game = {
    schema: 1,
    id: 'fixture-game',
    at: Date.now(),
    rules: 83,
    bot: 'synergy-2',
    startingHp: 1000,
    source: 'human',
    ghostSeat: null,
    a: deck,
    b: { ...deck, hero: 'engineer', ascendancy: 'engineer:golemancer' },
    winner: 'a',
    reason: 'win',
    durationMs: 600000,
    actions: 70,
    turns: { a: 11, b: 10 },
    heroDamage: { a: 1000, b: 750 },
    peakHeroDamage: { a: 180, b: 140 },
  };
  const put = (body) =>
    stub.fetch('https://board.invalid/balance/save', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  assert.equal((await put({ game })).status, 200);
  assert.equal((await put({ game })).status, 200);
  assert.equal((await put({ game: { ...game, a: { ...deck, cards: [42] } } })).status, 400);
  assert.equal((await mf.dispatchFetch('https://game.test/admin/balance')).status, 401);
  assert.equal(
    (
      await mf.dispatchFetch('https://game.test/admin/balance', {
        headers: { authorization: 'Bearer wrong' },
      })
    ).status,
    401,
  );
  const res = await mf.dispatchFetch('https://game.test/admin/balance', {
    headers: { authorization: 'Bearer ' + token },
  });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const data = await res.json();
  assert.equal(data.games.length, 1);
  assert.deepEqual(data.games[0], game);
  const next = await mf.dispatchFetch('https://game.test/admin/balance?after=' + data.next, {
    headers: { authorization: 'Bearer ' + token },
  });
  assert.equal((await next.json()).games.length, 0);
  // More than one page and deduplication are checked against SQLite, not a mocked query result.
  for (let i = 0; i < 251; i++)
    assert.equal((await put({ game: { ...game, id: 'page-' + i } })).status, 200);
  const page = await (
    await mf.dispatchFetch('https://game.test/admin/balance', {
      headers: { authorization: 'Bearer ' + token },
    })
  ).json();
  assert.equal(page.games.length, 250);
  assert.equal(page.more, true);
  const tail = await (
    await mf.dispatchFetch('https://game.test/admin/balance?after=' + page.next, {
      headers: { authorization: 'Bearer ' + token },
    })
  ).json();
  assert.equal(tail.games.length, 2);
  assert.equal(tail.more, false);
  writeFileSync(join(work, 'fixture.json'), JSON.stringify({ schema: 1, games: [game] }, null, 2));
  console.log(
    'PASS: real SQLite exact decks, deduplication, validation, owner authentication, no-store export and pagination. Fixture is synthetic.',
  );
} finally {
  await mf.dispose();
}
