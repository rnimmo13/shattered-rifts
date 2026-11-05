import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const dir = resolve(root, 'docs/balance-history/simulations/0.198.0');
const load = (name) => {
  const p = resolve(dir, name);
  if (existsSync(p)) return readFileSync(p, 'utf8');
  if (existsSync(p + '.gz')) return gunzipSync(readFileSync(p + '.gz')).toString();
  return '';
};
const rows = (name) => load(name).trim().split('\n').filter(Boolean).map(JSON.parse);
const data = rows('evaluate-b300.jsonl');
const sensitivity = rows('sensitivity-b300.jsonl');
const pilot = rows('pilotcheck-b900.jsonl');
const bossProbe = rows('bossprobe-b300.jsonl');
const oathProbe = rows('oathprobe-b300.jsonl');
const prior = JSON.parse(readFileSync(resolve(root, 'docs/balance-history/0.198.0.json'), 'utf8'));
const decks = JSON.parse(load('decks.json'));
const med = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.floor(s.length / 2)]) / 2 : null;
};
function wilson(w, n) {
  if (!n) return null;
  const z = 1.96,
    p = w / n,
    d = 1 + (z * z) / n,
    c = (p + (z * z) / (2 * n)) / d,
    h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [100 * (c - h), 100 * (c + h)];
}
function stats(rs, id) {
  const boss = rs[0]?.mode === 'boss';
  let w = 0,
    l = 0,
    d = 0,
    u = 0;
  for (const r of rs) {
    const me = boss || r.a === id ? 'a' : 'b';
    if (r.censored) u++;
    else if (r.winner === me) w++;
    else if (r.winner === 'draw') d++;
    else l++;
  }
  return {
    n: rs.length,
    w,
    l,
    d,
    u,
    winPct: rs.length ? (100 * w) / rs.length : null,
    decisiveWinPct: w + l ? (100 * w) / (w + l) : null,
    ci: wilson(w, boss ? rs.length : w + l),
    medianTurns: med(rs.filter((r) => !r.censored).map((r) => Math.max(r.turns.a, r.turns.b))),
    winMedianTurns: med(
      rs
        .filter((r) => r.winner === (boss || r.a === id ? 'a' : 'b'))
        .map((r) => Math.max(r.turns.a, r.turns.b)),
    ),
    medianBossLeftOnLoss: med(
      rs.filter((r) => r.winner === 'b' && boss).map((r) => 100 * r.bossFraction),
    ),
  };
}
const result = prior.ratings.map((p) => {
  const r = {
    id: p.id,
    name: p.name,
    hero: p.hero,
    priorArena: p.arena.overall,
    priorEndgame: p.campaign.endgame,
  };
  for (const q of ['optimized', 'good']) {
    r['arena_' + q] = stats(
      data.filter((x) => x.mode === 'arena' && x.quality === q && (x.a === p.id || x.b === p.id)),
      p.id,
    );
    r['boss_' + q] = stats(
      data.filter((x) => x.mode === 'boss' && x.quality === q && x.a === p.id),
      p.id,
    );
    r['hp60_' + q] = stats(
      sensitivity.filter((x) => x.quality === q && x.a === p.id),
      p.id,
    );
    r['pilot900_' + q] = stats(
      pilot.filter((x) => x.mode === 'boss' && x.quality === q && x.a === p.id),
      p.id,
    );
  }
  return r;
});
const summary = {
  version: '0.198.0',
  rules: 81,
  source: 'c644dfc01d74114eb23b87b199155b98c39872a4',
  complete: data.length === 9480,
  mainMatches: data.length,
  pilotCheckMatches: pilot.length,
  hpSensitivityMatches: sensitivity.length,
  rows: result,
  overall: {},
};
for (const q of ['optimized', 'good']) {
  const ar = data.filter((r) => r.mode === 'arena' && r.quality === q),
    bs = data.filter((r) => r.mode === 'boss' && r.quality === q),
    finished = ar.filter((r) => !r.censored);
  summary.overall[q] = {
    arenaGames: ar.length,
    arenaCensored: ar.filter((r) => r.censored).length,
    arenaDraws: ar.filter((r) => r.winner === 'draw').length,
    arenaMedianRounds: med(finished.map((r) => Math.max(r.turns.a, r.turns.b))),
    arenaBoth10PlusPct: finished.length
      ? (100 * finished.filter((r) => Math.min(r.turns.a, r.turns.b) >= 10).length) /
        finished.length
      : null,
    arenaLoserUnder5Pct: finished.length
      ? (100 *
          finished.filter((r) =>
            r.winner === 'a' ? r.turns.b < 5 : r.winner === 'b' && r.turns.a < 5,
          ).length) /
        finished.length
      : null,
    firstSeatWins: ar.filter((r) => r.winner === 'a').length,
    secondSeatWins: ar.filter((r) => r.winner === 'b').length,
    boss: stats(bs, 'all'),
  };
}
const lookup = new Map(
  data.map((r) => [`${r.mode}|${r.a}|${r.b ?? ''}|${r.quality}|${r.seed}`, r]),
);
summary.pilotComparison = {};
for (const mode of ['boss', 'arena']) {
  const pairs = pilot
    .filter((r) => r.mode === mode)
    .map((r) => [lookup.get(`${r.mode}|${r.a}|${r.b ?? ''}|${r.quality}|${r.seed}`), r])
    .filter(([a]) => a);
  summary.pilotComparison[mode] = {
    n: pairs.length,
    outcomeChanges: pairs.filter(([a, b]) => a.winner !== b.winner).length,
    baseFirstWins: pairs.filter(([a]) => a.winner === 'a').length,
    largerSearchFirstWins: pairs.filter(([, b]) => b.winner === 'a').length,
  };
}
// Match the exact seats, loadouts and seeds; never compare a ten-seed probe to
// the unrelated percentage from the full hundred-seed main sample.
summary.experiments = {};
for (const [name, experiment] of [
  ['heroHpPlus60', sensitivity],
  ['bossHp75Damage85', bossProbe],
  ['bloodOathConsume', oathProbe],
]) {
  const groups = {};
  for (const mode of ['boss', 'arena'])
    for (const quality of ['optimized', 'good']) {
      const changed = experiment.filter((r) => r.mode === mode && r.quality === quality);
      if (!changed.length) continue;
      const base = changed.map((r) =>
        lookup.get(`${r.mode}|${r.a}|${r.b ?? ''}|${r.quality}|${r.seed}`),
      );
      if (base.some((r) => !r)) throw Error('Unpaired experiment');
      const focal = mode === 'arena' ? 'knight:marshal' : 'all';
      groups[mode + '_' + quality] = {
        base: stats(base, focal),
        changed: stats(changed, focal),
        byBuild:
          mode === 'boss'
            ? result
                .map((r) => ({
                  id: r.id,
                  base: stats(
                    base.filter((x) => x.a === r.id),
                    r.id,
                  ),
                  changed: stats(
                    changed.filter((x) => x.a === r.id),
                    r.id,
                  ),
                }))
                .filter((r) => r.base.n)
            : undefined,
      };
    }
  summary.experiments[name] = groups;
}
writeFileSync(resolve(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const pct = (n) => (n === null ? '—' : n.toFixed(1) + '%');
const cell = (s) => (s.n ? `${pct(s.decisiveWinPct)} (${s.w}-${s.l}-${s.u})` : '—');
const lines = [
  '# v0.198.0 simulation results',
  '',
  'Simulation outcomes, not human win-rate estimates. Arena cells show decisive win percentage and W-L-unresolved; draws are separately recorded in JSON/CSV. Vorthax percentages mean wins within the experiment limit. Prior grades are the saved static estimates.',
  '',
  `Main games completed: ${data.length}/9,480.`,
  '',
  '| Ascendancy | Prior Arena / late Campaign | Arena tuned | Arena good | Vorthax tuned | Vorthax good |',
  '|---|---|---|---|---|---|',
  ...result.map(
    (r) =>
      `| ${r.name} | ${r.priorArena} / ${r.priorEndgame} | ${cell(r.arena_optimized)} | ${cell(r.arena_good)} | ${pct(r.boss_optimized.winPct)} (${r.boss_optimized.w}/${r.boss_optimized.n}; ${r.boss_optimized.u} unresolved) | ${pct(r.boss_good.winPct)} (${r.boss_good.w}/${r.boss_good.n}; ${r.boss_good.u} unresolved) |`,
  ),
  '',
  'See README.md for design, limitations, interpretation and follow-up proposals.',
];
writeFileSync(resolve(dir, 'RESULTS.md'), lines.join('\n') + '\n');
const headers = [
  'id',
  'mode',
  'quality',
  'prior_grade',
  'games',
  'wins',
  'losses',
  'draws',
  'unresolved',
  'win_pct_all',
  'win_pct_decisive',
  'ci_low',
  'ci_high',
  'median_rounds',
  'median_win_rounds',
  'median_boss_hp_left_loss',
];
const csv = [
  headers,
  ...result.flatMap((r) =>
    ['arena', 'boss'].flatMap((m) =>
      ['optimized', 'good'].map((q) => {
        const s = r[m + '_' + q];
        return [
          r.id,
          m,
          q,
          m === 'arena' ? r.priorArena : r.priorEndgame,
          s.n,
          s.w,
          s.l,
          s.d,
          s.u,
          s.winPct,
          s.decisiveWinPct,
          ...(s.ci ?? ['', '']),
          s.medianTurns,
          s.winMedianTurns,
          s.medianBossLeftOnLoss,
        ];
      }),
    ),
  ),
];
writeFileSync(
  resolve(dir, 'results.csv'),
  csv
    .map((row) => row.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(','))
    .join('\n') + '\n',
);
const ids = prior.ratings.map((r) => r.id);
for (const q of ['optimized', 'good']) {
  const matrix = [
    ['id', ...ids],
    ...ids.map((id) => [
      id,
      ...ids.map((foe) => {
        if (id === foe) return '';
        const s = stats(
          data.filter(
            (r) =>
              r.mode === 'arena' &&
              r.quality === q &&
              ((r.a === id && r.b === foe) || (r.a === foe && r.b === id)),
          ),
          id,
        );
        return s.n ? `${s.w}/${s.n} wins; ${s.u} unresolved` : '';
      }),
    ]),
  ];
  writeFileSync(
    resolve(dir, `arena-matrix-${q}.csv`),
    matrix.map((row) => row.map((v) => '"' + v + '"').join(',')).join('\n') + '\n',
  );
}
const dl = [
  '# Frozen evaluated decks',
  '',
  'Mode-specific versions selected on training seeds; evaluation seeds never used to select decks. Good versions retain the core, replace up to two rare duplicates, add four useful common/uncommon fallback cards and upgrade approximately half their slots. Old Twelve Gauge has no ordinary upgrade.',
  '',
];
for (const mode of ['arena', 'boss'])
  for (const q of ['optimized', 'good'])
    for (const d of decks[mode][q])
      dl.push(
        `## ${mode} — ${d.name} — ${q}`,
        '',
        `${d.deck.length} cards; selected from ${d.selectedVariant}.`,
        '',
        d.deck.join(', '),
        '',
      );
writeFileSync(resolve(dir, 'DECKS.md'), dl.join('\n'));
console.log(
  JSON.stringify({
    complete: summary.complete,
    matches: data.length,
    overall: summary.overall,
    pilotComparison: summary.pilotComparison,
  }),
);
