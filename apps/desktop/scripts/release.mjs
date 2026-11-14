// Publish a complete release atomically: drafts cannot be discovered by installed clients.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
/** where installed copies look for updates, and the website's download comes from: a public repo of installers only, so the game's
 * own repo can be private (DECISIONS #805) */
const repo = 'rnimmo13/shattered-rifts-releases';
/** also published here while copies from before the move still look there (0.278.0 and older read the game's repo): the release
 * that moves them over. Empty this once the game's repo is private */
const BRIDGE = ['rnimmo13/shattered-rifts'];
const pkg = JSON.parse(readFileSync(resolve(root, 'apps/desktop/package.json'), 'utf8'));
const web = JSON.parse(readFileSync(resolve(root, 'apps/web/package.json'), 'utf8'));
const dist = resolve(root, 'apps/desktop/dist');
const files = ['Shattered-Rifts-Setup.exe', 'Shattered-Rifts-Setup.exe.blockmap', 'latest.yml'];
if (pkg.version !== web.version || !/^\d+\.\d+\.\d+$/.test(pkg.version))
  throw new Error('Website and desktop need the same stable version');
const info = parse(readFileSync(resolve(dist, 'latest.yml'), 'utf8'));
if (
  info.version !== pkg.version ||
  info.path !== files[0] ||
  info.files?.length !== 1 ||
  info.files[0].url !== files[0]
)
  throw new Error('Update metadata does not match this release');
for (const file of files)
  if (!statSync(resolve(dist, file)).size) throw new Error(`Empty artifact: ${file}`);
const hash = createHash('sha512');
for await (const chunk of createReadStream(resolve(dist, files[0]))) hash.update(chunk);
const checksum = hash.digest('base64');
if (
  checksum !== info.sha512 ||
  checksum !== info.files[0].sha512 ||
  statSync(resolve(dist, files[0])).size !== info.files[0].size
)
  throw new Error('Installer checksum or size does not match latest.yml');
const feed = parse(readFileSync(resolve(dist, 'win-unpacked/resources/app-update.yml'), 'utf8'));
if (feed.provider !== 'github' || `${feed.owner}/${feed.repo}` !== repo)
  throw new Error('Wrong packaged update feed');
if (
  JSON.parse(readFileSync(resolve(root, 'apps/desktop/out/steam-config.json'), 'utf8')).appId !==
  null
)
  throw new Error(
    'Public desktop updates must use the standalone configuration, not a Steam app ID',
  );
console.log(`Validated v${pkg.version}: installer, SHA-512, blockmap and embedded GitHub feed.`);
if (process.argv.includes('--validate')) process.exit(0);

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
if (git('status', '--porcelain')) throw new Error('Commit all changes before publishing');
const commit = git('rev-parse', 'HEAD');
const builderRequire = createRequire(
  realpathSync(resolve(root, 'apps/desktop/node_modules/electron-builder/package.json')),
);
const libRequire = createRequire(builderRequire.resolve('app-builder-lib'));
const asar = libRequire('@electron/asar');
const packed = (file) =>
  JSON.parse(asar.extractFile(resolve(dist, 'win-unpacked/resources/app.asar'), file).toString());
const stamp = packed('out/desktop-build.json');
if (stamp.version !== pkg.version || stamp.commit !== commit || stamp.dirty)
  throw new Error(
    'Build artifacts are stale or came from uncommitted sources. Rebuild after committing.',
  );
if (packed('out/steam-config.json').appId !== null)
  throw new Error('Packaged edition is configured for Steam');
if (git('rev-parse', 'origin/main') !== commit)
  throw new Error('Push this commit to origin/main first');
const ghPath =
  process.platform === 'win32' && existsSync('C:/Program Files/GitHub CLI/gh.exe')
    ? 'C:/Program Files/GitHub CLI/gh.exe'
    : 'gh';
const gh = (...args) =>
  execFileSync(ghPath, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
const tag = `v${pkg.version}`;
mkdirSync(resolve(root, '.wrangler'), { recursive: true });
const notes = resolve(root, '.wrangler/desktop-release-notes.txt');
writeFileSync(
  notes,
  `Windows 64-bit desktop playtest v${pkg.version}.\n\nDownload Shattered-Rifts-Setup.exe, install it, and launch Shattered Rifts. Updates download automatically. Once ready, the game saves and restarts automatically outside an active battle; a failed save keeps the game open for retry.\n\nExisting versions 0.182.0 and earlier require this installer once to enable future automatic updates. Your saved profile is preserved.\n\nThis playtest is unsigned, so Windows may show an unrecognized-app warning. Steam editions receive updates through Steam.\n\nWebsite and patch notes: https://shatteredrifts.app/#/patch-notes\n`,
);
/** One repo's release: drafted, filled, then made the latest at once (a draft is never seen by installed copies). The releases repo
 * holds no source, so its tag goes on its own default branch; the game's repo tags the commit the build came from. */
function publish(target, onCommit) {
  let existing = null;
  try {
    existing = JSON.parse(
      gh('release', 'view', tag, '--repo', target, '--json', 'isDraft,targetCommitish,url'),
    );
  } catch {
    /* create below also verifies authentication/repository access */
  }
  if (existing && (!existing.isDraft || (onCommit && existing.targetCommitish !== commit)))
    throw new Error(
      `Release already exists in ${target}; bump the version rather than replacing it`,
    );
  if (!existing)
    console.log(
      gh(
        'release',
        'create',
        tag,
        '--repo',
        target,
        '--draft',
        ...(onCommit ? ['--target', commit] : []),
        '--title',
        `Shattered Rifts ${tag}`,
        '--notes-file',
        notes,
      ),
    );
  console.log(`Uploading installer and metadata to the draft release in ${target}…`);
  gh(
    'release',
    'upload',
    tag,
    ...files.map((file) => resolve(dist, file)),
    '--repo',
    target,
    '--clobber',
  );
  gh('release', 'edit', tag, '--repo', target, '--draft=false', '--latest');
  console.log(`Published https://github.com/${target}/releases/tag/${tag}`);
}
publish(repo, false);
for (const old of BRIDGE) publish(old, true);
