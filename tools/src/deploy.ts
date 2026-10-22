// `pnpm deploy:web -- --repo OWNER/NAME [--branch gh-pages]`
//
// Builds the web client and publishes ONLY the compiled site to a branch of a GitHub repo (GitHub Pages
// serves it). It needs no GitHub Actions and no extra token scopes beyond `repo`, so it works with the
// normal `gh auth login`. The source repo is never touched; point --repo at a separate "play" repo to
// keep the source private (the compiled JS is readable by anyone who can open the site).
//
//   pnpm deploy:web -- --repo rnimmo13/shattered-rifts-play
//   pnpm deploy:web -- --repo rnimmo13/shattered-rifts --branch gh-pages   (only if Pages works for that repo)
//   pnpm deploy:web -- --repo OWNER/NAME --dry-run                         build + stage, don't push
//
// The site lives at https://OWNER.github.io/NAME/, so the build uses that as its base path.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2).filter((x) => x !== '--');
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const repo = flag('repo');
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error('Usage: pnpm deploy:web -- --repo OWNER/NAME [--branch gh-pages] [--dry-run]');
  process.exit(1);
}
const branch = flag('branch') ?? 'gh-pages';
const dryRun = argv.includes('--dry-run');
const name = repo.split('/')[1] as string;
const root = resolve(import.meta.dirname, '../..');

const run = (cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv = process.env) => {
  execFileSync(cmd, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' });
};

console.log(`Building the web client for https://${repo.split('/')[0]}.github.io/${name}/ ...`);
run('pnpm', ['--filter', '@sr/web', 'build'], root, { ...process.env, SR_BASE: `/${name}/` });

const dist = join(root, 'apps/web/dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('Build produced no index.html');

const stage = mkdtempSync(join(tmpdir(), 'sr-deploy-'));
try {
  cpSync(dist, stage, { recursive: true });
  // Pages: no Jekyll processing; unknown URLs fall back to the app (client-side routing)
  writeFileSync(join(stage, '.nojekyll'), '');
  cpSync(join(stage, 'index.html'), join(stage, '404.html'));
  mkdirSync(join(stage, '.git'), { recursive: true });
  rmSync(join(stage, '.git'), { recursive: true, force: true });

  if (dryRun) {
    console.log(`Dry run: staged at ${stage} (not pushed, not deleted).`);
  } else {
    run('git', ['init', '-q', '-b', branch], stage);
    run('git', ['add', '-A'], stage);
    run(
      'git',
      [
        '-c',
        'user.name=Shattered Rifts deploy',
        '-c',
        'user.email=deploy@invalid',
        'commit',
        '-q',
        '-m',
        `Deploy ${new Date().toISOString()}`,
      ],
      stage,
    );
    run('git', ['push', '--force', `https://github.com/${repo}.git`, `HEAD:${branch}`], stage);
    console.log(`\nDeployed to branch "${branch}" of ${repo}.`);
    console.log(
      `Site: https://${repo.split('/')[0]}.github.io/${name}/  (Pages: Settings → Pages → Deploy from branch "${branch}", folder "/ (root)")`,
    );
  }
} finally {
  if (!dryRun) rmSync(stage, { recursive: true, force: true });
}
