import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Which build this is, so everyone testing can say exactly what they are playing. */
function buildInfo(): { version: string; commit: string; dirty: boolean; date: string } {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  // Cloudflare Pages and GitHub Actions tell us the commit; a local build asks git
  let commit = process.env['CF_PAGES_COMMIT_SHA'] ?? process.env['GITHUB_SHA'] ?? '';
  let dirty = false;
  try {
    if (!commit)
      commit = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    dirty =
      execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim() !== '';
  } catch {
    /* not a git checkout (a zip download, say): the date still identifies the build */
  }
  return {
    version: pkg.version,
    commit: commit.slice(0, 7) || 'unknown',
    dirty,
    date: new Date().toISOString(),
  };
}

// GitHub Pages serves the site from /<repo>/, so deploys set SR_BASE (see tools/src/deploy.ts).
export default defineConfig({
  base: process.env['SR_BASE'] ?? '/',
  plugins: [react()],
  define: { __SR_BUILD__: JSON.stringify(buildInfo()) },
});
