// Render append-only assessments; no gameplay, bots or rating inference.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
interface Rating {
  id: string;
  hero: string;
  name: string;
  build: string;
  previousArena: string | null;
  campaign: {
    developing: string;
    deep: string;
    endgame: string;
    openingFight: string;
    extendedFight: string;
  };
  arena: { overall: string; opening: string; extended: string; long?: string };
  pacing?: string;
  setup: string;
  recovery: string;
  rareReliance: string;
  scaling: string;
  rationale: string;
  watch: string;
  confidence: string;
  evidence: string[];
}
interface Snapshot {
  schema: 1;
  version: string;
  rules: number;
  date: string;
  status: string;
  source: string;
  basis: string;
  measuredMatches: number;
  target: string;
  ratings: Rating[];
  starters: { hero: string; grade: string; rationale: string }[];
  corrections: string[];
  assessmentId?: string;
  longFightBand?: string;
}
const root = fileURLToPath(new URL('../../docs/balance-history/', import.meta.url));
const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(root)
      .filter((f) => /^\d.*\.json$/.test(f))
      .sort();
for (const file of files) {
  const s = JSON.parse(readFileSync(resolve(root, file), 'utf8')) as Snapshot;
  if (s.schema !== 1 || s.ratings.length !== 30 || new Set(s.ratings.map((r) => r.id)).size !== 30)
    throw new Error(`Incomplete balance snapshot ${file}`);
  const lines = [
    `# Balance assessment ${s.version}`,
    '',
    `${s.date} · rules ${s.rules} · ${s.status} · source: ${s.source}`,
    '',
    s.basis,
    '',
    `Measured matches used: ${s.measuredMatches}. Target: ${s.target}`,
    '',
    'Grades are estimates of complete deck strength, not isolated passive value. A+/A/A− are competitive sub-bands; B indicates a meaningful reliability problem; S flags a suspected outlier. They are not win rates. Ascendancies unlock after Tier III. Developing = IV–X, deep = XI–XVI, endgame = XVII–XX. Fight opening = turns 1–3; extended = turns 6–10. These bands describe different things.',
    '',
    '## Class start, before Ascendancy (tiers I–III)',
    '',
    '| Class | Estimated strength | Reason |',
    '|---|---|---|',
    ...s.starters.map((r) => `| ${r.hero} | ${r.grade} | ${r.rationale} |`),
    '',
    '## Main play styles',
    '',
    'Examples for comparison, freely mixed cards and hybrids; these do not define card pools or force three decks per class.',
    '',
    '| Class / Ascendancy | Example style | Campaign IV–X | XI–XVI | XVII–XX | Arena prior → current | Arena opening | Extended |',
    '|---|---|---|---|---|---|---|---|',
    ...s.ratings.map(
      (r) =>
        `| ${r.hero} / ${r.name} | ${r.build} | ${r.campaign.developing} | ${r.campaign.deep} | ${r.campaign.endgame} | ${r.previousArena ?? '—'} → ${r.arena.overall} | ${r.arena.opening} | ${r.arena.extended} |`,
    ),
    ...(s.longFightBand
      ? [
          '',
          `## Longer Arena fights: ${s.longFightBand}`,
          '',
          'Conditional strength after reaching this band with a functioning engine. Overall includes setup and disruption. Neither column predicts match length. Opening/extended and Campaign grades above retain the preceding assessment unless a correction is explicitly described below.',
          '',
          '| Ascendancy | Overall | Long-fight power | Pacing / reliability concern |',
          '|---|---|---|---|',
          ...s.ratings.map(
            (r) =>
              `| ${r.name} | ${r.arena.overall} | ${r.arena.long ?? 'Unrated'} | ${r.pacing ?? ''} |`,
          ),
        ]
      : []),
    '',
    '## Scaling, dependency and recovery',
    '',
    '| Ascendancy | Campaign fight opening / extended | Setup | Recovery after disruption | Rare reliance | Scaling |',
    '|---|---|---|---|---|---|',
    ...s.ratings.map(
      (r) =>
        `| ${r.name} | ${r.campaign.openingFight} / ${r.campaign.extendedFight} | ${r.setup} | ${r.recovery} | ${r.rareReliance} | ${r.scaling} |`,
    ),
    '',
    '## Reasoning and next checks',
    '',
    ...s.ratings.flatMap((r) => [
      `### ${r.name}`,
      '',
      `${r.rationale} Confidence: ${r.confidence}.`,
      '',
      `Watch: ${r.watch}`,
      '',
      `Evidence: ${r.evidence.join('; ')}.`,
      '',
    ]),
    '## Corrections and limits',
    '',
    ...s.corrections.map((c) => `- ${c}`),
    '',
  ];
  const stem = file.replace(/\.json$/, '');
  writeFileSync(resolve(root, `${stem}.md`), lines.join('\n'));
  const csv = [
    [
      'id',
      'class',
      'ascendancy',
      'build',
      'campaign_IV_X',
      'campaign_XI_XVI',
      'campaign_XVII_XX',
      'arena',
      'opening',
      'extended',
      'confidence',
      ...(s.longFightBand ? ['arena_long', 'long_fight_band', 'pacing'] : []),
    ],
    ...s.ratings.map((r) => [
      r.id,
      r.hero,
      r.name,
      r.build,
      r.campaign.developing,
      r.campaign.deep,
      r.campaign.endgame,
      r.arena.overall,
      r.arena.opening,
      r.arena.extended,
      r.confidence,
      ...(s.longFightBand ? [r.arena.long ?? '', s.longFightBand, r.pacing ?? ''] : []),
    ]),
  ];
  writeFileSync(
    resolve(root, `${stem}.csv`),
    csv.map((r) => r.map((x) => `"${x.replaceAll('"', '""')}"`).join(',')).join('\n') + '\n',
  );
  process.stdout.write(`Rendered ${s.version}: ${s.ratings.length} Ascendancies\n`);
}
