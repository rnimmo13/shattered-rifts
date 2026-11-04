import { mkdtempSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
mkdirSync('.smoke-profile', { recursive: true });
const profile = mkdtempSync(resolve('.smoke-profile/account-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
for (const stage of ['write', 'read']) {
  const child = spawnSync(require('electron'), [resolve('out/accountSmoke.js'), profile, stage], {
    env,
    windowsHide: true,
    stdio: 'inherit',
    timeout: 130000,
  });
  if (child.error) throw child.error;
  if (child.status) process.exit(child.status);
}
console.log(`Account test saves and screenshots: ${profile}`);
