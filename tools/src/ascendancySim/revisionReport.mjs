import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const dir = root + 'docs/balance-history/simulations/0.199.0/';
const oldDir = root + 'docs/balance-history/simulations/0.198.0/';
const read = (file) =>
  existsSync(file) ? readFileSync(file) : gunzipSync(readFileSync(file + '.gz'));
const rows = (file) => read(file).toString().trim().split('\n').map(JSON.parse);
const old = rows(oldDir + 'evaluate-b300.jsonl');
const final = rows(dir + 'final.jsonl');
assert.equal(final.length, 6480, 'Final evaluation must finish first');
const prior = JSON.parse(readFileSync(root + 'docs/balance-history/0.198.0.json'));
const median = (xs) => {
  const sorted = [...xs].sort((a, b) => a - b),
    n = sorted.length;
  return n ? (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2 : null;
};
function stats(rs, id) {
  const boss = rs[0]?.mode === 'boss';
  const w = rs.filter((r) => r.winner === (boss || r.a === id ? 'a' : 'b')).length;
  const u = rs.filter((r) => r.censored).length,
    d = rs.filter((r) => r.winner === 'draw').length;
  const l = rs.length - w - u - d;
  const n = boss ? rs.length : w + l;
  const p = n ? w / n : 0,
    z = 1.96,
    denom = 1 + (z * z) / (n || 1);
  const center = (p + (z * z) / (2 * (n || 1))) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / (n || 1) + (z * z) / (4 * (n || 1) ** 2))) / denom;
  return {
    n: rs.length,
    w,
    l,
    d,
    u,
    pct: n ? (100 * w) / n : null,
    ci: n ? [100 * (center - half), 100 * (center + half)] : null,
    medianTurns: median(rs.filter((r) => !r.censored).map((r) => Math.max(r.turns.a, r.turns.b))),
  };
}
const match = (rs, mode, quality, id) =>
  rs.filter(
    (r) =>
      r.mode === mode && r.quality === quality && (r.a === id || (mode === 'arena' && r.b === id)),
  );
const baselineBoss = old.filter((r) => r.mode === 'boss' && Number(r.seed.split('-').at(-1)) >= 50);
const table = prior.ratings.map((r) => {
  const result = {
    id: r.id,
    name: r.name,
    hero: r.hero,
    priorArena: r.arena.overall,
    priorCampaign: r.campaign.endgame,
  };
  for (const mode of ['arena', 'boss'])
    for (const quality of ['optimized', 'good']) {
      const field = mode + '_' + quality;
      result[field] = stats(match(final, mode, quality, r.id), r.id);
      result['before_' + field] = stats(
        match(mode === 'boss' ? baselineBoss : old, mode, quality, r.id),
        r.id,
      );
      assert.equal(result[field].n, mode === 'arena' ? 116 : 50);
    }
  return result;
});
function overall(data) {
  const out = {};
  for (const q of ['optimized', 'good']) {
    const ar = data.filter((r) => r.mode === 'arena' && r.quality === q);
    const bs = data.filter((r) => r.mode === 'boss' && r.quality === q);
    const finished = ar.filter((r) => !r.censored && r.winner !== 'draw');
    out[q] = {
      arenaGames: ar.length,
      arenaUnresolved: ar.filter((r) => r.censored).length,
      medianRounds: median(finished.map((r) => Math.max(r.turns.a, r.turns.b))),
      both10Pct: finished.length
        ? (100 * finished.filter((r) => Math.min(r.turns.a, r.turns.b) >= 10).length) /
          finished.length
        : null,
      firstWins: ar.filter((r) => r.winner === 'a').length,
      secondWins: ar.filter((r) => r.winner === 'b').length,
      boss: stats(bs, 'all'),
    };
  }
  return out;
}
const summary = {
  version: '0.199.0',
  rules: 82,
  date: '2026-11-05',
  baselineCommit: 'c644dfc01d74114eb23b87b199155b98c39872a4',
  mainMatches: final.length,
  humanMatches: 0,
  comparison:
    'Original release lists vs separately retuned candidate lists; Arena final seeds 2/3, baseline 0/1; paired boss seeds 50-99. Rule and recipe effects are combined. Candidate B separately isolates changed rules on frozen decks.',
  before: overall([...old.filter((r) => r.mode === 'arena'), ...baselineBoss]),
  after: overall(final),
  frozenCandidateB: overall(rows(dir + 'candidate-b.jsonl')),
  golemProbe: {
    baseline: stats(
      match(final, 'arena', 'optimized', 'engineer:golemancer'),
      'engineer:golemancer',
    ),
    substitution: stats(rows(dir + 'golem-probe.jsonl'), 'engineer:golemancer'),
    interpretation:
      'Post-hoc matched Arena diagnostic: replace two Static Field+ with two Bulwark Frame+. Same 116 matchups/seeds; excluded from the main table and deck selection.',
  },
  rows: table,
};
writeFileSync(dir + 'summary.json', JSON.stringify(summary, null, 2) + '\n');
const pct = (x) => (x === null ? '—' : x.toFixed(1) + '%');
const lines = [
  '# v0.199.0 local revision: simulation comparison',
  '',
  summary.comparison,
  '',
  'Bot/deck benchmarks, not human win-rate estimates. Arena excludes unresolved games; boss percentages include all 50 attempts. Exact counts and Wilson intervals are in CSV/JSON. Old letter grades remain archived predictions, not validated parity.',
  '',
  '| Ascendancy | Prior Arena | Arena before → revised | Arena good before → revised | Valerion before → revised | Valerion good before → revised |',
  '|---|---|---|---|---|---|',
  ...table.map(
    (r) =>
      '| ' +
      [
        r.name,
        r.priorArena,
        ...['arena_optimized', 'arena_good', 'boss_optimized', 'boss_good'].map(
          (k) => `${pct(r['before_' + k].pct)} → ${pct(r[k].pct)}`,
        ),
      ].join(' | ') +
      ' |',
  ),
  '',
];
writeFileSync(dir + 'RESULTS.md', lines.join('\n'));
const csv = [
  [
    'id',
    'stage',
    'mode',
    'quality',
    'games',
    'wins',
    'losses',
    'draws',
    'unresolved',
    'win_pct',
    'ci_low',
    'ci_high',
    'median_rounds',
  ],
];
for (const r of table)
  for (const stage of ['before', 'revised'])
    for (const mode of ['arena', 'boss'])
      for (const quality of ['optimized', 'good']) {
        const s = r[(stage === 'before' ? 'before_' : '') + mode + '_' + quality];
        csv.push([
          r.id,
          stage,
          mode,
          quality,
          s.n,
          s.w,
          s.l,
          s.d,
          s.u,
          s.pct,
          ...(s.ci ?? ['', '']),
          s.medianTurns,
        ]);
      }
writeFileSync(
  dir + 'results.csv',
  csv
    .map((r) => r.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(','))
    .join('\n') + '\n',
);
const decks = JSON.parse(readFileSync(dir + 'decks.json'));
writeFileSync(
  dir + 'DECKS.md',
  [
    '# Frozen revision deck lists',
    '',
    'Ten candidates per Ascendancy; separate Arena/boss selection on training seeds. Ordinary upgrades and copy limits apply. Good versions preserve the core with reduced refinement.',
    '',
    ...['arena', 'boss'].flatMap((mode) =>
      ['optimized', 'good'].flatMap((quality) =>
        decks[mode][quality].flatMap((d) => [
          `## ${mode} — ${d.name} — ${quality}`,
          '',
          `${d.deck.length} cards, ${d.selectedVariant}.`,
          '',
          d.deck.join(', '),
          '',
        ]),
      ),
    ),
  ].join('\n'),
);
// Verify every run against its frozen job specification, then archive exact bytes.
const counts = {
  'pilot-audit': 660,
  'candidate-a': 660,
  'candidate-b': 4080,
  'train-b300': 2400,
  final: 6480,
  'golem-probe': 116,
};
for (const [name, n] of Object.entries(counts)) {
  const data = rows(dir + name + '.jsonl');
  const jobs = JSON.parse(read(dir + name + '-jobs.json').toString());
  assert.equal(data.length, n);
  assert.equal(jobs.length, n);
  assert.equal(new Set(data.map((r) => r.id)).size, n);
  for (const r of data) {
    const j = jobs.find((j) => j.id === r.id);
    assert.ok(j);
    assert.equal(r.a, j.a.id);
    assert.equal(r.b, j.b?.id);
    assert.equal(r.seed, j.seed);
    assert.equal(r.quality, j.a.quality);
    assert.equal(r.censored, r.winner === null);
  }
  for (const file of [name + '.jsonl', name + '-jobs.json']) {
    const bytes = read(dir + file),
      gz = gzipSync(bytes, { level: 9 });
    assert.deepEqual(gunzipSync(gz), bytes);
    writeFileSync(dir + file + '.gz', gz);
  }
}
const manifest = readdirSync(dir)
  .filter((f) => f.endsWith('.gz'))
  .map((file) => {
    const bytes = readFileSync(dir + file),
      raw = gunzipSync(bytes);
    return {
      file,
      compressedBytes: bytes.length,
      rawBytes: raw.length,
      sha256: createHash('sha256').update(raw).digest('hex'),
    };
  });
writeFileSync(dir + 'archive-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(
  JSON.stringify({
    before: summary.before,
    after: summary.after,
    golemProbe: summary.golemProbe,
    runsVerified: 14396,
  }),
);
