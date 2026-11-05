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
  // Server-owned recent replay history is independent of browser localStorage.
  const owners = ['a'.repeat(64), 'b'.repeat(64)];
  const replay = {
    rules: 83,
    seed: 'synthetic-replay',
    a: { hero: 'knight', name: 'Fixture A', deck: Array(20).fill('strike'), boons: [], tier: 20 },
    b: { hero: 'knight', name: 'Fixture B', deck: Array(20).fill('strike'), boons: [], tier: 20 },
    log: [],
    winner: 'a',
    reason: 'resign',
  };
  const replayIds = [];
  for (let i = 0; i < 11; i++) {
    const r = await stub.fetch('https://board.invalid/replay/save', {
      method: 'POST',
      body: JSON.stringify({
        key: 'synthetic:' + i,
        owners,
        ownerSeats: { [owners[0]]: 'a', [owners[1]]: 'b' },
        replay,
      }),
    });
    const saved = await r.json();
    assert.equal(saved.ok, true);
    replayIds.push(saved.id);
    const duplicate = await stub.fetch('https://board.invalid/replay/save', {
      method: 'POST',
      body: JSON.stringify({ key: 'synthetic:' + i, owners, replay }),
    });
    assert.equal((await duplicate.json()).id, saved.id);
  }
  for (const [index, player] of owners.entries()) {
    const res = await stub.fetch('https://board.invalid/replay/recent', {
      method: 'POST',
      body: JSON.stringify({ player }),
    });
    const recent = await res.json();
    assert.equal(recent.replays.length, 10);
    assert.deepEqual(
      recent.replays.map((r) => r.id),
      replayIds.slice(1).reverse(),
    );
    assert.ok(recent.replays.every((r) => r.viewerSeat === (index === 0 ? 'a' : 'b')));
  }
  const stranger = await stub.fetch('https://board.invalid/replay/recent', {
    method: 'POST',
    body: JSON.stringify({ player: 'c'.repeat(64) }),
  });
  assert.equal((await stranger.json()).replays.length, 0);
  const noOwner = await mf.dispatchFetch('https://game.test/pvp/board/replays', {
    method: 'POST',
    body: JSON.stringify({ player: owners[0] }),
    headers: { 'content-type': 'application/json' },
  });
  assert.equal(noOwner.status, 401);
  const snapshot = {
    schema: 1,
    id: 'd'.repeat(64),
    run: 'e'.repeat(64),
    rules: 83,
    version: '0.201.0',
    source: 'client-observed',
    hero: 'knight',
    ascendancy: null,
    cards: ['strike', 'strike+'],
    boons: [],
    tier: 1,
    difficulty: 'normal',
    phase: 'map',
    hp: 80,
    maxHp: 80,
    resolve: 2,
    seed: 'must-not-export',
    token: 'must-not-export',
  };
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await stub.fetch('https://board.invalid/balance/campaign/save', {
          method: 'POST',
          body: JSON.stringify({ snapshot }),
        })
      ).status,
      200,
    );
  assert.equal(
    (await mf.dispatchFetch('https://game.test/admin/balance?kind=campaign')).status,
    401,
  );
  const campaignRes = await mf.dispatchFetch('https://game.test/admin/balance?kind=campaign', {
    headers: { authorization: 'Bearer ' + token },
  });
  assert.equal(campaignRes.headers.get('cache-control'), 'no-store');
  const campaign = await campaignRes.json();
  assert.equal(campaign.snapshots.length, 1);
  assert.deepEqual(campaign.snapshots[0].cards, snapshot.cards);
  assert.equal(JSON.stringify(campaign).includes('must-not-export'), false);
  // Exercise the actual accepted-save -> private collection path, not only the Board endpoint.
  const vaultNamespace = await mf.getDurableObjectNamespace('VAULT');
  const vault = vaultNamespace.get(vaultNamespace.idFromName('campaign-fixture-owner'));
  const claimRes = await vault.fetch('https://vault.invalid/play/claim', {
    method: 'POST',
    body: JSON.stringify({ holder: 'campaign-smoke' }),
  });
  const claim = await claimRes.json();
  assert.equal(claim.ok, true);
  const savedRun = {
    v: 2,
    character: 'knight',
    seed: 'never-export-this-run-seed',
    deck: ['strike', 'defend'],
    boons: [],
    tier: 1,
    difficulty: 'normal',
    phase: 'map',
    hp: 80,
    maxHp: 80,
    resolve: 2,
    stats: { duelsWon: 2, duelsLost: 1 },
    cleared: [],
    accountSecret: 'never-export-this-account-field',
  };
  const saveBody = {
    revision: claim.revision,
    balanceRules: 83,
    balanceVersion: '0.201.0',
    runs: [{ id: 'fixture-run', updated: Date.now(), text: JSON.stringify(savedRun) }],
    replays: {},
  };
  const saveRes = await vault.fetch('https://vault.invalid/runsave', {
    method: 'POST',
    headers: { 'x-sr-play-token': claim.token },
    body: JSON.stringify(saveBody),
  });
  assert.equal(saveRes.status, 200);
  let collected;
  for (let i = 0; i < 40; i++) {
    const res = await mf.dispatchFetch('https://game.test/admin/balance?kind=campaign', {
      headers: { authorization: 'Bearer ' + token },
    });
    collected = await res.json();
    if (collected.snapshots.length === 2) break;
    await new Promise((done) => setTimeout(done, 50));
  }
  assert.equal(collected.snapshots.length, 2);
  const observed = collected.snapshots.find((s) => s.id !== snapshot.id);
  assert.deepEqual(observed.cards, ['defend', 'strike']);
  assert.equal(observed.fightsWon, 2);
  assert.equal(observed.fightsLost, 1);
  assert.equal(JSON.stringify(collected).includes('never-export-this'), false);
  assert.equal(JSON.stringify(collected).includes('fixture-run'), false);
  assert.equal(
    (
      await vault.fetch('https://vault.invalid/runsave', {
        method: 'POST',
        headers: { 'x-sr-play-token': claim.token },
        body: JSON.stringify(saveBody),
      })
    ).status,
    409,
  );
  writeFileSync(join(work, 'campaign-fixture.json'), JSON.stringify(campaign, null, 2));
  const reportText =
    'Shattered Rifts performance report (synthetic)\n== Machine ==\nGraphics: fixture\n== Frames ==\nTypical frame 16 ms\n<script>do not execute</script>';
  const shareReport = () =>
    mf.dispatchFetch('https://game.test/pvp/reports', {
      method: 'POST',
      headers: { origin: 'https://game.test', 'content-type': 'application/json' },
      body: JSON.stringify({ text: reportText }),
    });
  const shared = await shareReport();
  assert.equal(shared.status, 200);
  const sharedBody = await shared.json();
  assert.match(sharedBody.id, /^[a-f0-9]{32}$/);
  const publicReport = await mf.dispatchFetch('https://game.test/pvp/reports/' + sharedBody.id);
  assert.equal(publicReport.status, 200);
  const html = await publicReport.text();
  assert.ok(html.includes('&lt;script&gt;do not execute&lt;/script&gt;'));
  assert.equal(html.includes('<script>'), false);
  const rawReport = await mf.dispatchFetch(
    'https://game.test/pvp/reports/' + sharedBody.id + '?format=json',
  );
  assert.equal((await rawReport.json()).text, reportText);
  assert.equal(
    (await mf.dispatchFetch('https://game.test/pvp/reports/' + '0'.repeat(32))).status,
    404,
  );
  for (let i = 1; i < 20; i++) assert.equal((await shareReport()).status, 200);
  assert.equal((await shareReport()).status, 429);
  console.log(
    'PASS: SQLite exact decks, private exports, last-10 replays, Campaign snapshots and database-backed diagnostic links/rate limits. Fixtures are synthetic.',
  );
} finally {
  await mf.dispose();
}
