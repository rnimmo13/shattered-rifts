import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { appIdOf } from '../out/steam.js';
import { ACHIEVEMENTS } from '../out/saveData.js';
const appId = appIdOf(process.env.SR_STEAM_APP_ID);
mkdirSync('out', { recursive: true });
writeFileSync('out/steam-config.json', JSON.stringify({ appId }));
writeFileSync('out/steam-achievements.json', JSON.stringify(ACHIEVEMENTS, null, 2));
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
let commit = 'unknown';
let dirty = true;
try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  dirty = !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
} catch {
  /* Developer builds still work; the publisher rejects unknown sources. */
}
writeFileSync('out/desktop-build.json', JSON.stringify({ version, commit, dirty }));
