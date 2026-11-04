// Real NSIS download/install test, isolated by a fresh app id, registry guid and workspace paths.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { strict as assert } from 'node:assert';
import { parse } from 'yaml';
import electron from 'electron';

if (process.platform !== 'win32') throw new Error('This NSIS integration check requires Windows');
const desktop = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(desktop, '../..');
const scratch = resolve(desktop, '.smoke-profile/updates');
mkdirSync(scratch, { recursive: true });
const run = mkdtempSync(resolve(scratch, 'run-'));
const bounded = (path) => {
  const absolute = resolve(path);
  if (!absolute.startsWith(`${run}${sep}`)) throw new Error('Test path escaped its workspace');
  return absolute;
};
const guid = randomUUID();
const name = `SRUpdateTest-${guid.slice(0, 8)}`;
const install = bounded(resolve(run, 'installed'));
const profile = bounded(resolve(run, 'profile'));
mkdirSync(profile);
const marker = resolve(profile, 'save-marker.json');
writeFileSync(marker, '{"campaign":"preserve me"}');
const env = { ...process.env, LOCALAPPDATA: bounded(resolve(run, 'cache')) };
delete env.ELECTRON_RUN_AS_NODE;
const cli = process.env.npm_execpath;
if (!cli) throw new Error('Run through pnpm desktop:update:smoke');
function execute(command, args, label, cwd = root) {
  return new Promise((done, reject) => {
    const log = createWriteStream(resolve(run, `${label}.log`));
    const child = spawn(command, args, {
      cwd,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let tail = '';
    const output = (chunk) => {
      log.write(chunk);
      tail = (tail + chunk.toString()).slice(-2400);
    };
    child.stdout.on('data', output);
    child.stderr.on('data', output);
    child.on('error', reject);
    child.on('close', (code) => {
      log.end();
      if (code === 0) done();
      else reject(new Error(`${label} failed (${code}): ${tail}`));
    });
  });
}
const builderRequire = createRequire(
  realpathSync(resolve(desktop, 'node_modules/electron-builder/package.json')),
);
const libRequire = createRequire(builderRequire.resolve('app-builder-lib'));
const asar = libRequire('@electron/asar');
const installedVersion = () => {
  try {
    return JSON.parse(
      asar.extractFile(resolve(install, 'resources/app.asar'), 'package.json').toString(),
    ).version;
  } catch {
    return null;
  }
};
async function waitVersion(version) {
  for (let i = 0; i < 120; i++) {
    if (installedVersion() === version) return;
    await delay(500);
  }
  throw new Error(`Installed version did not become ${version}; found ${installedVersion()}`);
}
for (const [folder, version] of [
  ['old', '0.183.0'],
  ['new', '0.183.1'],
]) {
  console.log(`Building isolated updater fixture ${version}…`);
  await execute(
    process.execPath,
    [
      cli,
      '--filter',
      '@sr/desktop',
      'exec',
      'electron-builder',
      '--win',
      'nsis',
      '--x64',
      '--publish',
      'never',
      `--config.appId=app.shatteredrifts.updater-test.${guid}`,
      `--config.productName=${name}`,
      `--config.directories.output=${bounded(resolve(run, folder))}`,
      `--config.nsis.guid=${guid}`,
      `--config.extraMetadata.version=${version}`,
      `--config.extraMetadata.name=${name.toLowerCase()}`,
      '--config.nsis.createDesktopShortcut=false',
      '--config.nsis.createStartMenuShortcut=false',
      '--config.nsis.runAfterFinish=false',
    ],
    `build-${folder}`,
  );
}
let server;
try {
  console.log('Installing the old fixture into its isolated workspace directory…');
  await execute(
    bounded(resolve(run, 'old/Shattered-Rifts-Setup.exe')),
    ['/S', `/D=${install}`],
    'install-old',
  );
  await waitVersion('0.183.0');
  const info = parse(readFileSync(resolve(run, 'new/latest.yml'), 'utf8'));
  assert.equal(info.version, '0.183.1');
  let executableRequests = 0;
  server = createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/latest.yml') {
      res.end(readFileSync(resolve(run, 'new/latest.yml')));
      return;
    }
    if (path !== '/Shattered-Rifts-Setup.exe') {
      res.writeHead(404);
      res.end();
      return;
    }
    executableRequests++;
    if (executableRequests === 1) {
      res.end('corrupt update fixture');
      return;
    }
    res.setHeader('Content-Length', info.files[0].size);
    createReadStream(resolve(run, 'new/Shattered-Rifts-Setup.exe')).pipe(res);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const port = server.address().port;
  const require = createRequire(resolve(desktop, 'package.json'));
  const harness = bounded(resolve(run, 'harness'));
  mkdirSync(harness);
  writeFileSync(
    resolve(harness, 'package.json'),
    JSON.stringify({ name: name.toLowerCase(), version: '0.183.0', main: 'main.cjs' }),
  );
  writeFileSync(
    resolve(harness, 'dev-app-update.yml'),
    `provider: generic\nurl: http://127.0.0.1:${port}\nupdaterCacheDirName: ${name}\n`,
  );
  writeFileSync(
    resolve(harness, 'main.cjs'),
    `
    const {app} = require('electron');
    const assert = require('node:assert/strict');
    const {NsisUpdater} = require(${JSON.stringify(require.resolve('electron-updater'))});
    app.setPath('userData', ${JSON.stringify(profile)});
    app.whenReady().then(async () => {
      const updater = new NsisUpdater();
      updater.forceDevUpdateConfig = true;
      updater.autoDownload = false; updater.autoInstallOnAppQuit = false;
      updater.autoRunAppAfterInstall = false; updater.disableDifferentialDownload = true;
      updater.installDirectory = ${JSON.stringify(install)};
      updater.logger = null; updater.on('error', () => {});
      const result = await updater.checkForUpdates();
      assert.equal(result.updateInfo.version, '0.183.1');
      let rejected = false;
      try { await updater.downloadUpdate(); } catch (error) {
        assert.match(String(error), /checksum|sha512|size/i); rejected = true;
      }
      assert.equal(rejected, true, 'A corrupt installer must be rejected');
      console.log('Corrupt update rejected. Retrying with the real installer.');
      await updater.downloadUpdate();
      console.log('Verified update downloaded. Handing off to NSIS without launching the game.');
      updater.quitAndInstall(true, false);
    }).catch(error => { console.error(error); app.exit(1); });
    setTimeout(() => { console.error('Updater harness timed out'); app.exit(1); }, 90000).unref();
  `,
  );
  console.log(
    'Checking metadata, rejecting corruption, downloading and installing with real Electron Updater…',
  );
  await execute(electron, [harness], 'updater');
  await waitVersion('0.183.1');
  assert.equal(readFileSync(marker, 'utf8'), '{"campaign":"preserve me"}');
  assert.ok(executableRequests >= 2);
  console.log(
    'PASS: 0.183.0 → 0.183.1, corrupted download rejected, actual NSIS handoff and save marker preserved.',
  );
} finally {
  server?.close();
  // Only this run's fresh GUID/name was installed; never invoke a production uninstaller.
  if (existsSync(install)) {
    const uninstaller = readdirSync(install).find(
      (file) => file.startsWith('Uninstall ') && file.endsWith('.exe'),
    );
    if (uninstaller)
      await execute(bounded(resolve(install, uninstaller)), ['/S'], 'uninstall-test');
  }
  console.log(`Updater test logs/artifacts: ${run}`);
}
