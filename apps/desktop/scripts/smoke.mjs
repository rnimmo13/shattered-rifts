import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import electron from 'electron';

// Kept under this workspace and ignored; no access to a player's actual desktop saves.
mkdirSync('.smoke-profile', { recursive: true });
const profile = mkdtempSync(resolve('.smoke-profile', 'run-'));
const restored = mkdtempSync(resolve('.smoke-profile', 'cloud-'));
for (const stage of ['write', 'read', 'cloud-read']) {
  const current = stage === 'cloud-read' ? restored : profile;
  if (stage === 'cloud-read') {
    mkdirSync(resolve(current, 'saves/standalone'), { recursive: true });
    copyFileSync(
      resolve(profile, 'saves/standalone/save-v1.json'),
      resolve(current, 'saves/standalone/save-v1.json'),
    );
  }
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(
    electron,
    ['out/smoke.js', current, stage === 'cloud-read' ? 'read' : stage],
    {
      stdio: 'inherit',
      env,
      timeout: 90000,
      windowsHide: true,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Screenshots and isolated test saves: ${profile}`);
