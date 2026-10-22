# M0 Scaffold Review (commit `m0` / 3c9b3dd)

**Verified locally (Windows):** `pnpm lint`, `pnpm typecheck`, `pnpm test` (4/4), `pnpm build`,
`pnpm format:check`, `pnpm duel`, and the Netlify command `pnpm --filter "@sr/web..." build` all pass.
I also probed the purity rules by piping code through `eslint --stdin` (no files changed).

Purity is enforced twice. ESLint catches `Math.random`, `Date` and `Date.now`. On top of that,
`types: []` plus an ES-only `lib` makes tsc reject `window`, `document`, `setTimeout`, `fetch` and
`process` in the engine, ai and campaign packages.

## CRITICAL
None.

## HIGH
None.

## MEDIUM
1. **`packages/content` gets no purity rules.** See `eslint.config.js:60-64`. I confirmed that
   `Math.random()` in `packages/content/src/index.ts` lints clean. Content data feeds the engine
   (for example, generated tables), so nondeterminism there breaks "seed + log = identical game".
   *Fix:* add `'packages/content/src/**/*.ts'` to the purity `files` list.
2. **The `no-restricted-imports` patterns are gitignore-style, so they also match relative paths.**
   See `eslint.config.js:31`. I confirmed that `import { x } from './path'` in the engine is
   reported as "The engine does no I/O". Any future `./path.ts` module (pathfinding, map paths) or
   `./os` module will be blocked by mistake.
   *Fix:* use `paths: ['fs', 'path', 'os', 'child_process', 'fs/promises', ...]` for the bare
   names and keep `patterns: [{ group: ['node:*'] }]` only for the scheme prefix.
3. **There is no `.gitattributes`, but Prettier enforces `endOfLine: "lf"`.** See
   `.prettierrc.json:5`. This machine has `core.autocrlf=false`, so it passes here. Any Windows
   clone with the Git-for-Windows default (`autocrlf=true`) will fail `pnpm format:check` on
   every file.
   *Fix:* add `.gitattributes` containing `* text=auto eol=lf`.
4. **The disabled CTA explains itself only through `title`.** See
   `apps/web/src/app/TitleScreen.tsx:70`. Disabled buttons don't get focus or hover in most
   browsers, so keyboard, touch and many screen-reader users never see "Runs arrive in M4".
   *Fix:* use `aria-disabled="true"` (keep it focusable and make the handler a no-op) with
   `aria-describedby` pointing at a visible line such as "Runs arrive in M4". Or simply render
   that text under the button.

## LOW
1. **`globalThis.Math.random()` and `Math['random']` slip past `no-restricted-properties`.** See
   `eslint.config.js:10-15`. Accept this, or add a `no-restricted-syntax` selector for
   `MemberExpression[property.name='random']`.
2. **Test files are excluded from the purity rules.** See `eslint.config.js:65`. Tests can then
   call `Math.random`/`Date`, which makes them non-reproducible.
   *Fix:* apply at least the `Math.random` rule to `*.test.ts` and steer tests to fast-check seeds.
3. **The root `tsconfig.json` (`vitest.config.ts`, `eslint.config.js`) is never type-checked.**
   `pnpm -r` skips the workspace root ("Scope: 6 of 7").
   *Fix:* make `"typecheck"` at `package.json:14` run `"tsc -p tsconfig.json && pnpm -r --if-present typecheck"`.
4. **`check` and CI run different steps.** CI runs `format:check` but `check`
   (`package.json:18`) does not. *Fix:* prepend `pnpm format:check &&`.
5. **The CI workflow has no `permissions` block or concurrency group.** See
   `.github/workflows/ci.yml`. *Fix:* add `permissions: { contents: read }` and
   `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`. Consider
   `node-version-file` or `22.12` so it matches `engines`. `pnpm/action-setup@v4` with no
   `version` is fine, because it reads `packageManager`.
6. **`tseslint.config(...)` is deprecated in typescript-eslint 8.x.** See `eslint.config.js:39`.
   *Fix:* use `defineConfig` from `eslint/config`.
7. **The locked roster card's dim text fails contrast.** At `global.css:133-135`,
   `grayscale(0.8) brightness(0.6)` turns `--text-dim` into roughly 2.6:1. Its name is also read
   aloud as "question mark question mark question mark".
   *Fix:* add visually hidden text "Locked character", or `aria-label`, on the `<li>`, and
   dim with opacity on the glyph and border only.
8. **The `<footer>` sits inside `<main>`, so it isn't a `contentinfo` landmark.** See
   `TitleScreen.tsx:74`. *Fix:* move it outside `<main>` (wrap both in a fragment).
9. **The beta label is inconsistent.** The UI says "Friends alpha" (`TitleScreen.tsx:49`) and
   `netlify.toml:1` says "friends beta". Pick one.
10. **`CHANGELOG.md` "Changed" lists the campaign redesign.** That change is design-doc only and
    nothing a player can see yet. Consider moving it to a "Planned" note or to ROADMAP.md.
11. **`netlify.toml` has no security headers.** Add a basic `[[headers]]` block (CSP,
    `X-Content-Type-Options`, `Referrer-Policy`) before the first deploy.

## Consistency with docs
- The layout matches `07_TECH_ARCHITECTURE.md §2`: the packages, `apps/web/src/app/` and `tools/`.
  PixiJS is not needed until the duel milestone.
- The M0 exit criteria in §6 (`pnpm test` and `pnpm build` green, deploy config present but not
  deployed) are met.
- Golden rules: the engine has no deps and no card-ID special-casing, and the original IP is
  respected (realm names come from the docs). DECISIONS #39 and #40 are logged.
