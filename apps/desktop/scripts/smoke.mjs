import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import electron from 'electron';

// Kept under this workspace and ignored; no access to a player's actual desktop saves.
mkdirSync('.smoke-profile', { recursive: true });
const profile = mkdtempSync(resolve('.smoke-profile', 'run-'));
for (const stage of ['write', 'read']) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(electron, ['out/smoke.js', profile, stage], {
    stdio: 'inherit',
    env,
    timeout: 90000,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Screenshots and isolated test saves: ${profile}`);
