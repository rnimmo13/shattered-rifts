// `pnpm --filter @sr/tools exec tsx src/baselineVerify.ts <archive-dir> [--write]`: checks a frozen balance-baseline archive
// (reviews/balance-baselines/...). With --write (once, when the archive is made) it also writes the archive's metadata, its asset
// inventory, VALIDATION.md and HASHES.sha256. Without it, it only checks: every file still has the hash it was archived with, the
// counts and starters agree, and the representative numbers below are still what the archive says. It reads the archive's own JSON,
// never the live game, so it keeps working after the classes it describes have been rebuilt.

import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dir = process.argv[2];
const write = process.argv.includes('--write');
if (!dir) throw new Error('usage: baselineVerify.ts <archive-dir> [--write]');
const root = join(dir, '..', '..', '..');

const sha = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex');
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const json = <T>(p: string): T => JSON.parse(readFileSync(join(dir, p), 'utf8')) as T;

const CLASSES = ['knight', 'shaman', 'assassin', 'spellblade', 'necromancer', 'monk'] as const;
interface Op {
  op: string;
  amount?: number;
  status?: string;
  hits?: number;
  to?: string;
}
interface Def {
  id: string;
  cost: number;
  effects: Op[];
  upgrade?: string;
  starCost?: number;
  rarity?: string;
}
interface ClassFile {
  hero: { id: string; maxHp: number; mana: number; handSize: number };
  trait: { name: string; text: string };
  starter: string[];
  counts: Record<string, number>;
  cards: { id: string; def: Def; upgrade: { id: string; def: Def } | null }[];
}
interface Db {
  cards: Record<string, Def>;
  heroes: Record<string, unknown>;
  runes: Record<string, unknown>;
}

const problems: string[] = [];
const lines: string[] = [];
const check = (ok: boolean, what: string): void => {
  lines.push(`- ${ok ? 'PASS' : 'FAIL'}: ${what}`);
  if (!ok) problems.push(what);
};

// --- 1. metadata and the asset inventory (written once) -------------------------------------------------------------------
if (write) {
  const git = (cmd: string): string =>
    execSync(`git ${cmd}`, { cwd: root, encoding: 'utf8' }).trim();
  const web = JSON.parse(readFileSync(join(root, 'apps/web/package.json'), 'utf8')) as {
    version: string;
  };
  const protocol = readFileSync(join(root, 'packages/pvp/src/protocol.ts'), 'utf8');
  const save = readFileSync(join(root, 'packages/campaign/src/save.ts'), 'utf8');
  const meta = {
    archived: new Date().toISOString(),
    purpose:
      'Frozen hand-balance reference for the five baseline classes (and the Monk) before the 2026-10-29 identity reworks (docs/BASE_CLASS_REWORKS.md).',
    commit: git('rev-parse HEAD'),
    branch: git('rev-parse --abbrev-ref HEAD'),
    dirty: git('status --porcelain'),
    dirtyNote:
      'The only uncommitted file was docs/BASE_CLASS_REWORKS.md (the rework brief, untracked, copied into docs/ here). No source file differed from the commit, so source/ is an exact git archive of it.',
    gameVersion: web.version,
    rulesVersion: Number(/RULES_VERSION = (\d+)/.exec(protocol)?.[1]),
    runSaveVersion: Number(/RUN_SAVE_VERSION = (\d+)/.exec(save)?.[1]),
    node: process.version,
    lockfileSha256: sha(join(root, 'pnpm-lock.yaml')),
    schema:
      'resolved/*.json: CardDef / HeroDef / RuneDef / UnitDef as in packages/combat/src/types.ts at this commit (also inside source/).',
    regenerate:
      'git checkout <commit>; pnpm install; pnpm --filter @sr/tools exec tsx src/baselineArchive.ts <dir>; then baselineVerify.ts <dir> --write. Never rerun into this folder: make a new, dated one.',
  };
  writeFileSync(join(dir, 'METADATA.json'), JSON.stringify(meta, null, 1) + '\n');

  const manifest = JSON.parse(
    readFileSync(join(root, 'apps/web/public/art/manifest.json'), 'utf8'),
  ) as {
    figures: Record<string, string>;
    cards: Record<string, string>;
    skins: Record<string, string>;
  };
  const weapons = JSON.parse(
    readFileSync(join(root, 'apps/web/public/art/weapons/index.json'), 'utf8'),
  ) as { weapons: Record<string, string> };
  const art = (rel: string | undefined): { path: string | null; sha256: string | null } => {
    if (!rel) return { path: null, sha256: null };
    const p = join(root, 'apps/web/public/art', rel);
    return { path: `apps/web/public/art/${rel}`, sha256: existsSync(p) ? sha(p) : null };
  };
  const inv: Record<string, unknown> = {};
  const md: string[] = [
    '# Asset inventory at the archive',
    '',
    'Every picture the archived classes used, with its SHA-256. No file was moved, replaced or deleted by the rework: the files stay',
    'where they are, and these hashes say whether they are still the same. A card with no listed art used the procedural placeholder.',
    '',
  ];
  for (const hero of CLASSES) {
    const c = json<ClassFile>(`resolved/${hero}.json`);
    const cards = c.cards.map((x) => ({ id: x.id, ...art(manifest.cards[x.id]) }));
    const skins = Object.entries(manifest.skins)
      .filter(([k]) => k.startsWith(`${hero}-`))
      .map(([k, v]) => ({ id: k, ...art(v) }));
    const figure = { id: `hero:${hero}`, ...art(manifest.figures[`hero:${hero}`]) };
    inv[hero] = { figure, skins, cards };
    const missing = cards.filter((x) => !x.path).map((x) => x.id);
    md.push(
      `## ${hero}`,
      '',
      `Figure: \`${figure.path}\` (${figure.sha256?.slice(0, 12) ?? 'missing'}). Skins: ${skins.map((s) => s.id).join(', ') || 'none'}.`,
      '',
      `Cards with art: ${cards.length - missing.length} of ${cards.length}.${missing.length ? ` Placeholder: ${missing.join(', ')}.` : ''}`,
      '',
    );
  }
  inv['weapons'] = Object.fromEntries(Object.entries(weapons.weapons).map(([k, v]) => [k, art(v)]));
  md.push(
    '## Weapons',
    '',
    ...Object.entries(weapons.weapons).map(([k, v]) => `- ${k}: \`apps/web/public/art/${v}\``),
    '',
    "The Shaman's totems were drawn in code (apps/web/src/fight/art.ts and the fight screen), not from image files.",
    '',
  );
  mkdirSync(join(dir, 'assets'), { recursive: true });
  writeFileSync(join(dir, 'assets', 'assets.json'), JSON.stringify(inv, null, 1) + '\n');
  writeFileSync(join(dir, 'assets', 'INVENTORY.md'), md.join('\n'));
}

// --- 2. the checks (on the archive's own files) ----------------------------------------------------------------------------
const db = json<Db>('resolved/combat-db.json');
const summary =
  json<Record<string, { counts: Record<string, number>; cards: number; starter: string[] }>>(
    'resolved/summary.json',
  );
for (const hero of CLASSES) {
  const c = json<ClassFile>(`resolved/${hero}.json`);
  check(
    c.cards.length === summary[hero]?.cards,
    `${hero}: ${c.cards.length} cards, as the summary says`,
  );
  check(
    Object.values(c.counts).reduce((a, b) => a + b, 0) === c.cards.length,
    `${hero}: the rarity counts add up to the card count (${JSON.stringify(c.counts)})`,
  );
  const unresolved = c.starter.filter((id) => !db.cards[id]);
  check(
    unresolved.length === 0,
    `${hero}: every starter card (${c.starter.length}) is in the archived database`,
  );
  const ups = c.cards.filter((x) => x.def.upgrade);
  check(
    ups.every((x) => x.upgrade && db.cards[x.upgrade.id]),
    `${hero}: all ${ups.length} upgrades resolve to an archived "+" card`,
  );
  check(
    c.cards.every((x) => JSON.stringify(db.cards[x.id]) === JSON.stringify(x.def)),
    `${hero}: every card in ${hero}.json matches combat-db.json exactly`,
  );
  check(!!db.heroes[hero], `${hero}: the hero definition is archived`);
}
// representative numbers, base and upgraded (these are the archive's own values, written down so a later edit of the JSON shows up)
const op = (id: string, i: number): Op | undefined => db.cards[id]?.effects[i];
const reps: [string, boolean][] = [
  [
    'knight Sundering Blow: 2 Mana, 8 damage, 2 Exposed',
    db.cards['sundering-blow']?.cost === 2 &&
      op('sundering-blow', 0)?.amount === 8 &&
      op('sundering-blow', 1)?.amount === 2,
  ],
  [
    'knight Sundering Blow+: 11 damage, 3 Exposed',
    op('sundering-blow+', 0)?.amount === 11 && op('sundering-blow+', 1)?.amount === 3,
  ],
  [
    'knight Oath of Iron: 8 Barrier, draw 1; + 11 Barrier, draw 2',
    op('oath-of-iron', 0)?.amount === 8 &&
      op('oath-of-iron+', 0)?.amount === 11 &&
      op('oath-of-iron+', 1)?.amount === 2,
  ],
  [
    'knight Ember Ward: 12 Barrier, 4 Thorns until the enemy turn ends',
    op('ember-ward', 0)?.amount === 12 && op('ember-ward', 1)?.amount === 4,
  ],
  [
    'assassin Dagger (sleeve-knife): 0 Mana, 4 damage; + 6',
    db.cards['sleeve-knife']?.cost === 0 &&
      op('sleeve-knife', 0)?.amount === 4 &&
      op('sleeve-knife+', 0)?.amount === 6,
  ],
  [
    'assassin Hobbling Jab: 3 + 1 Faltering; + 4 + 2',
    op('hobbling-jab', 0)?.amount === 3 &&
      op('hobbling-jab+', 0)?.amount === 4 &&
      op('hobbling-jab+', 1)?.amount === 2,
  ],
  ['shaman Hawk Call plants a Hawk (spark)', op('spark-cast', 0)?.op === 'channel'],
  [
    'spellblade Cinderfall: 0+2 Arcana, 8 damage; + 12',
    db.cards['meteor-jab']?.starCost === 2 &&
      op('meteor-jab', 0)?.amount === 8 &&
      op('meteor-jab+', 0)?.amount === 12,
  ],
  [
    'spellblade Obsidian Blade: 2 Mana, 10 damage plus its Sharpen',
    db.cards['starforged-blade']?.cost === 2 && op('starforged-blade', 0)?.amount === 10,
  ],
  ['necromancer Raise Thrall: Raise 5', op('raise-thrall', 0)?.amount === 5],
  [
    'monk Kindle Fury: 2 Mana, 9 damage, enter Fury',
    db.cards['kindle-fury']?.cost === 2 && op('kindle-fury', 0)?.amount === 9,
  ],
  [
    'totems: Hawk, Bear, Elder, Owl, Splinter archived',
    ['spark', 'ward', 'hollow', 'prism', 'splinter'].every((r) => !!db.runes[r]),
  ],
];
for (const [what, ok] of reps) check(ok, what);
const startersOk = CLASSES.every((h) => {
  const s = summary[h]?.starter ?? [];
  return s.length >= 10 && s.every((id) => !!db.cards[id]);
});
check(startersOk, 'every archived starter has 10+ cards, all in the database');

// --- 3. hashes -------------------------------------------------------------------------------------------------------------
const files = walk(dir)
  .map((p) => relative(dir, p).replace(/\\/g, '/'))
  .filter((f) => f !== 'HASHES.sha256' && f !== 'VALIDATION.md')
  .sort();
if (write) {
  writeFileSync(
    join(dir, 'HASHES.sha256'),
    files.map((f) => `${sha(join(dir, f))}  ${f}`).join('\n') + '\n',
  );
} else {
  const listed = readFileSync(join(dir, 'HASHES.sha256'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => l.split(/\s+/) as [string, string]);
  for (const [h, f] of listed)
    check(existsSync(join(dir, f)) && sha(join(dir, f)) === h, `hash of ${f}`);
  check(listed.length === files.length, `no file added or removed (${files.length} files)`);
}
const meta = existsSync(join(dir, 'METADATA.json'))
  ? (JSON.parse(readFileSync(join(dir, 'METADATA.json'), 'utf8')) as {
      commit: string;
      archived: string;
    })
  : null;
const report = [
  '# Archive validation',
  '',
  `Run ${new Date().toISOString()} on the archive of commit ${meta?.commit ?? '?'} (archived ${meta?.archived ?? '?'}), by \`tools/src/baselineVerify.ts\`.`,
  `It reads only the archive's own files. ${problems.length ? `${problems.length} problem(s).` : 'Everything passed.'}`,
  '',
  ...lines,
  '',
].join('\n');
if (write) writeFileSync(join(dir, 'VALIDATION.md'), report);
console.log(report);
if (problems.length) process.exitCode = 1;
