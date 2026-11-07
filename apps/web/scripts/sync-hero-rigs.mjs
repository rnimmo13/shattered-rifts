// Keeps the game's 2D hero rigs in step with their sources (DECISIONS #680). assets-src/ is git-ignored, so a build that runs from
// a checkout (the deploy) never sees it: the game ships committed copies, and this script refreshes them whenever the sources are
// on this machine. It runs before every local `dev` and `build`; with no assets-src it does nothing and the copies stand.
//
//   assets-src/heroes/<name>-2d/runtime/rig.json, atlas.png -> apps/web/public/art/heroes2d/<name>/
//   assets-src/heroes/<name>-2d/runtime/*.js                -> apps/web/src/art/hero2d/<file> as an ES module
//
// A runtime script attaches its exports to window (`global.Hero2D = ...`); its copy runs the same code against a private scope and
// exports those names instead. The newest copy of a file wins when two rigs carry it (hero2d.js). knight2d.js is superseded by
// hero2d.js, which runs the knight's rig unchanged, so it is not copied.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const heroes = resolve(web, '../../assets-src/heroes');
const publicDir = join(web, 'public/art/heroes2d');
const moduleDir = join(web, 'src/art/hero2d');
const SKIP = new Set(['knight2d.js']);
const TAIL = "})(typeof window !== 'undefined' ? window : globalThis);";

if (!existsSync(heroes)) {
  console.log('sync-hero-rigs: no assets-src/heroes here; the committed rigs stand.');
  process.exit(0);
}

const sameBytes = (a, b) => existsSync(b) && readFileSync(a).equals(readFileSync(b));
let changed = 0;
const scripts = new Map();

for (const folder of readdirSync(heroes)) {
  if (!folder.endsWith('-2d')) continue;
  const runtime = join(heroes, folder, 'runtime');
  if (!existsSync(runtime)) continue;
  const id = folder.slice(0, -3);
  mkdirSync(join(publicDir, id), { recursive: true });
  for (const f of ['rig.json', 'atlas.png']) {
    const from = join(runtime, f);
    const to = join(publicDir, id, f);
    if (existsSync(from) && !sameBytes(from, to)) {
      copyFileSync(from, to);
      changed++;
      console.log(`sync-hero-rigs: ${id}/${f}`);
    }
  }
  for (const f of readdirSync(runtime)) {
    if (!f.endsWith('.js') || SKIP.has(f)) continue;
    const path = join(runtime, f);
    const was = scripts.get(f);
    if (!was || statSync(path).mtimeMs > statSync(was).mtimeMs) scripts.set(f, path);
  }
}

mkdirSync(moduleDir, { recursive: true });
for (const [f, path] of scripts) {
  const code = readFileSync(path, 'utf8');
  // (a script mid-edit, or a helper that is not a runtime, is left alone: the game keeps its last good copy and the build goes on)
  const names = [...new Set([...code.matchAll(/\bglobal\.(\w+)\s*=/g)].map((m) => m[1]))];
  if (!code.includes(TAIL) || !names.length) {
    console.warn(
      `sync-hero-rigs: skipped ${f} (not a window-wrapped runtime script; the game keeps its current copy)`,
    );
    continue;
  }
  const rel = path.slice(resolve(heroes, '../..').length + 1).replaceAll('\\', '/');
  const out =
    `/* eslint-disable */\n// Copied from ${rel} by apps/web/scripts/sync-hero-rigs.mjs (do not edit here: edit the source and run it).\n` +
    `// The original attaches ${names.join(', ')} to window; this copy runs the same code against a private scope object and exports them.\n` +
    `const scope = {};\n` +
    code.replace(TAIL, '})(scope);') +
    `\n${names.map((n) => `export const ${n} = scope.${n};`).join('\n')}\n`;
  const to = join(moduleDir, f);
  if (!existsSync(to) || readFileSync(to, 'utf8') !== out) {
    writeFileSync(to, out);
    changed++;
    console.log(`sync-hero-rigs: src/art/hero2d/${f}`);
  }
}
console.log(`sync-hero-rigs: ${changed ? `${changed} file(s) refreshed` : 'up to date'}.`);
