// Read exported real playtests. This command never plays games or runs bots.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { campaignBand, mergeBalanceExports, type BalanceSample } from '@sr/pvp';

const args = process.argv.slice(2);
const flag = args.indexOf('--out');
const out = resolve(flag < 0 ? 'balance-report' : args.splice(flag, 2)[1]!);
if (!args.length)
  throw new Error('Usage: pnpm balance:report <export.json> [more.json] --out <folder>');
const samples = mergeBalanceExports(
  args.map((p) => JSON.parse(readFileSync(resolve(p), 'utf8')) as unknown),
);
mkdirSync(out, { recursive: true });
const escape = (v: string | number | null | undefined) =>
  `"${String(v ?? '').replaceAll('"', '""')}"`;
const cols = [
  'id',
  'version',
  'rules',
  'kind',
  'mode',
  'source',
  'hero',
  'ascendancy',
  'opponent',
  'opponentAscendancy',
  'seat',
  'tier',
  'difficulty',
  'deckSize',
  'upgraded',
  'rares',
  'outcome',
  'reason',
  'turnIndex',
  'endedTurns',
];
const rows = samples.map((s) => [
  s.id,
  s.version,
  s.rules,
  s.kind,
  s.mode,
  s.source,
  s.player.hero,
  s.player.ascendancy ?? 'unascended',
  s.opponent?.hero,
  s.opponent?.ascendancy,
  s.seat,
  s.tier,
  s.difficulty,
  s.player.deckSize,
  s.player.upgraded,
  s.player.rares,
  s.outcome,
  s.reason,
  s.turnIndex,
  s.endedTurns,
]);
writeFileSync(
  resolve(out, 'samples.csv'),
  [cols, ...rows].map((r) => r.map(escape).join(',')).join('\n') + '\n',
);
writeFileSync(resolve(out, 'samples.json'), JSON.stringify({ schema: 1, samples }, null, 2) + '\n');
const groups = new Map<string, BalanceSample[]>();
for (const s of samples) {
  // Keep matchup/seat and campaign difficulty/tier separate, with deck quality visible below.
  const key = [
    s.version,
    `rules ${s.rules}`,
    s.kind,
    s.mode,
    s.source,
    s.player.hero,
    s.player.ascendancy ?? 'unascended',
    s.mode === 'arena'
      ? `${s.opponent?.hero ?? '?'} / ${s.opponent?.ascendancy ?? 'unascended'} / seat ${s.seat}`
      : `${campaignBand(s.tier ?? 1)} / ${s.difficulty ?? '?'}`,
  ].join(' · ');
  const group = groups.get(key) ?? [];
  group.push(s);
  groups.set(key, group);
}
const lines = [
  '# Real playtest balance report',
  '',
  'Client-observed, manually shared data; not a controlled experiment or a tier grade. No simulated results. Repeated exports deduplicated by observation ID. Arena seat observations may describe the same game: do not sum them as independent matches. Abandoned/banked runs are censored, not losses. These exports are bounded device histories, not a full player population.',
  '',
  `Observations: ${samples.length}. Unique Arena games: ${new Set(samples.filter((s) => s.mode === 'arena').map((s) => s.id.replace(/:[ab]$/, ''))).size}.`,
  '',
  '| Stratum | N | W / L / D | Win % (decisive fights) | Mean deck / upgrades / rares | Mean turn index / End turn actions |',
  '|---|---:|---|---|---|---|',
];
for (const [key, group] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
  const w = group.filter((s) => s.outcome === 'win').length;
  const l = group.filter((s) => s.outcome === 'loss').length;
  const d = group.filter((s) => s.outcome === 'draw').length;
  const mean = (f: (s: BalanceSample) => number | undefined) => {
    const ns = group.flatMap((s) => {
      const n = f(s);
      return n === undefined ? [] : [n];
    });
    return ns.length ? (ns.reduce((a, b) => a + b, 0) / ns.length).toFixed(1) : '—';
  };
  lines.push(
    `| ${key.replaceAll('|', '/')} | ${group.length} | ${w} / ${l} / ${d} | ${w + l ? `${((100 * w) / (w + l)).toFixed(1)}% (n=${w + l})` : '—'} | ${mean((s) => s.player.deckSize)} / ${mean((s) => s.player.upgraded)} / ${mean((s) => s.player.rares)} | ${mean((s) => s.turnIndex)} / ${mean((s) => s.endedTurns)} |`,
  );
}
lines.push(
  '',
  'Use samples.csv to compare exact deck quality, outcomes and reasons within strata. Small, self-selected samples can be misleading; mirror matches and both seats are retained. Neither turn metric is a count of full rounds. Choices count Ascendancy selections that reached Tier III, not all new runs; they do not establish offer-adjusted pick rates. No historical observations are invented for builds that have no samples.',
  '',
);
writeFileSync(resolve(out, 'REPORT.md'), lines.join('\n'));
process.stdout.write(`Wrote ${samples.length} real observations to ${out}\n`);
