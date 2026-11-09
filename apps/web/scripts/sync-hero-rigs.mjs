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
// --- animated 2D hero videos (DECISIONS #715, a beta setting) ---------------------------------------------------------------
//   assets-src/heroes/2d-animated/<folder>/<hero>.mp4           -> the idle loop
//   assets-src/heroes/2d-animated/<folder>/<hero>_<anim>.mp4    -> another clip (strike, hit, aura, death; attack, hurt, cast, die)
//   copied to apps/web/public/art/heroes-video/<hero>/<clip>.mp4, and listed in src/art/heroVideos.ts. "skins" is left for later.
const videoSrc = join(heroes, '2d-animated');
const videoOut = join(web, 'public/art/heroes-video');
// (the files are named for what players see: the Rogue is the class with id assassin)
// (paladin: the Knight's death clip was named for his Ascendancy)
const VIDEO_HERO = { rogue: 'assassin', paladin: 'knight' };
const VIDEO_CLIP = {
  idle: 'idle',
  strike: 'strike',
  attack: 'strike',
  slash: 'strike',
  hit: 'hit',
  hurt: 'hit',
  damage: 'hit',
  aura: 'aura',
  cast: 'aura',
  skill: 'aura',
  power: 'aura',
  death: 'death',
  die: 'death',
  defeat: 'death',
};
if (existsSync(videoSrc)) {
  const found = {};
  // (any depth, "skins" left out: default/knight.mp4, default/animations/knight-slash.mp4...)
  const files = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const path = join(dir, f);
      if (statSync(path).isDirectory()) {
        if (f !== 'skins') walk(path);
      } else if (/\.mp4$/i.test(f)) files.push(path);
    }
  };
  walk(videoSrc);
  files.sort();
  for (const path of files) {
    // <hero>.mp4, or <hero>-<move>.mp4 / <hero>_<move>.mp4: the hero is the first word ("drunkard-shotgun", "engineer-drone-attack")
    const base = path.split(/[\\/]/).pop();
    const m = /^([a-z0-9]+)(?:[-_]([a-z0-9_-]+))?\.mp4$/i.exec(base);
    if (!m) {
      console.warn(`sync-hero-rigs: skipped ${base} (name it <hero>.mp4 or <hero>-<move>.mp4)`);
      continue;
    }
    const hero = VIDEO_HERO[m[1].toLowerCase()] ?? m[1].toLowerCase();
    const move = (m[2] ?? 'idle').toLowerCase().replaceAll('_', '-');
    // (a clip known by its name; any other move is an attack, "strike:<move>", the first of a hero's also its plain "strike")
    const known = VIDEO_CLIP[move];
    const keys = known ? [known] : [`strike:${move}`];
    if (!known && !found[hero]?.['strike']) keys.push('strike');
    const name = `${known ?? `strike-${move}`}.mp4`;
    mkdirSync(join(videoOut, hero), { recursive: true });
    const to = join(videoOut, hero, name);
    if (!sameBytes(path, to)) {
      copyFileSync(path, to);
      changed++;
      console.log(`sync-hero-rigs: heroes-video/${hero}/${name}`);
    }
    for (const k of keys) (found[hero] ??= {})[k] = `art/heroes-video/${hero}/${name}`;
  }
  const sorted = Object.fromEntries(
    Object.keys(found)
      .sort()
      .map((h) => [
        h,
        Object.fromEntries(
          Object.keys(found[h])
            .sort()
            .map((c) => [c, found[h][c]]),
        ),
      ]),
  );
  const out =
    `// Generated by apps/web/scripts/sync-hero-rigs.mjs from assets-src/heroes/2d-animated (do not edit here).\n` +
    `// Each hero's animated 2D video clips (DECISIONS #715), paths under the site's base URL.\n` +
    `export const HERO_VIDEOS: Readonly<Record<string, Readonly<Record<string, string>>>> = ${JSON.stringify(sorted, null, 2)};\n`;
  const to = join(web, 'src/art/heroVideos.ts');
  if (!existsSync(to) || readFileSync(to, 'utf8') !== out) {
    writeFileSync(to, out);
    changed++;
    console.log('sync-hero-rigs: src/art/heroVideos.ts');
  }
}

console.log(`sync-hero-rigs: ${changed ? `${changed} file(s) refreshed` : 'up to date'}.`);
