// Every picture the game can ask for has its file, spelled exactly so and committed: the live sites are case-sensitive and only have what\n// was committed, and a missing one is a broken image on a phone (Robert, 2026-11-02).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { it, expect } from 'vitest';
import { ASCENDANCIES, POTIONS } from '@sr/content/v2';
import { paintedFiles } from './gameIcons';
import { FX_IDS, crestPic } from '../fight/fxMoments';

const pub = resolve(__dirname, '../../public');
// (what git has: without git, a copy from a zip say, that part of the check is skipped)
const tracked: Set<string> | null = (() => {
  try {
    return new Set(
      execSync('git ls-files -z apps/web/public', { cwd: resolve(__dirname, '../../../..') })
        .toString()
        .split('\0'),
    );
  } catch {
    return null;
  }
})();
const why = (rel: string): string | null => {
  const full = resolve(pub, rel);
  if (!existsSync(full)) return 'no file';
  const parts = rel.split('/');
  const dir = resolve(pub, ...parts.slice(0, -1));
  if (!readdirSync(dir).includes(parts[parts.length - 1]!)) return 'letter case differs';
  if (tracked && !tracked.has(`apps/web/public/${rel}`)) return 'not committed';
  return null;
};

it('every picture has its file', () => {
  const missing: string[] = [];
  const need = (rel: string, label = rel): void => {
    const w = why(rel);
    if (w) missing.push(`${label} (${w})`);
  };
  for (const id of paintedFiles()) need(`art/icons/${id}.png`);
  for (const p of Object.values(POTIONS)) need(`art/icons/potion-${p.id}.png`);
  for (const a of ASCENDANCIES) need(`art/icons/${crestPic(a.id)}.png`);
  for (const k of ['attack', 'defend', 'buff', 'debuff', 'summon', 'special', 'big', 'multi'])
    need(`art/icons/intent-${k}.png`);
  for (const k of [
    'duel',
    'elite',
    'event',
    'merchant',
    'shrine',
    'warden',
    'done',
    'crossed',
    'ghost',
    'here',
  ])
    need(`art/icons/map-${k}.png`);
  for (const id of FX_IDS) need(`art/fx/${id}.png`);
  const json = (f: string): unknown =>
    JSON.parse(readFileSync(resolve(pub, f), 'utf8').replace(/^\uFEFF/, ''));
  const walk = (file: string, v: unknown): void => {
    if (typeof v === 'string') {
      if (/\.(png|webp|jpg)$/i.test(v)) need(`art/${v}`, `${file}: ${v}`);
    } else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(file, x);
  };
  for (const f of ['art/manifest.json', 'art/weapons/index.json', 'art/totems/index.json'])
    walk(f, json(f));
  expect(missing).toEqual([]);
});
