# Standalone desktop updates (0.184.0, decisions #582-583)

Friends download the Windows x64 installer from the website home page:

https://github.com/rnimmo13/shattered-rifts/releases/latest/download/Shattered-Rifts-Setup.exe

Versions <=0.182.0 did not contain an updater. Install this release once over the existing app;
do not uninstall or delete AppData. Existing shared/local saves remain at their established paths.
Browser local storage remains a separate profile; this does not introduce automatic browser import.

## Player behavior

- Packaged standalone Windows checks after 15 seconds and every five minutes while running.
- Settings > About and updates displays the single installed version, download progress and Check for updates.
- New stable versions download automatically. No timer forces a restart or interrupts a fight.
- Downloaded updates install silently when quitting normally, after the window save guard finishes.
- Restart to update flushes the renderer save and releases the play claim. Main-process input is
  frozen while a final snapshot is committed. A failed save cancels installation and restores input.
  A successful snapshot permits closing before the updater starts the silent NSIS installer/relaunch.
- A global Save and restart prompt appears once a patch is ready, only outside mounted fight screens
  (including result/series screens). Later dismisses that version's prompt for this app session;
  Settings still offers the update. Explicit restart is also guarded during fights.
- The website polls an uncached version.json every minute and when focused. Save and refresh uses
  the same battle guard and releases the shared play claim after saving. No automatic reload occurs
  on deployment or missing stale chunks. Browser and mobile web use the same prompt.
- Offline errors are recoverable
  and do not block local play; Check for updates retries. No downgrade/prerelease/web installers.
- Development builds, non-Windows/store installs and Steam-configured editions disable this updater.
  Steam will distribute its own depot updates. Local offline mode may download an app update when
  connected, but does not upload its local saves.

## Publish each new version

Keep `apps/web/package.json` and `apps/desktop/package.json` at the same new stable version.
Update notes, validate, commit, and push the exact source to origin/main, then:

```text
pnpm desktop:release
```

This builds the separate desktop renderer/shell and NSIS installer, then runs `scripts/release.mjs`.
An already freshly built package can be checked with `pnpm desktop:release:validate` and published
with `node apps/desktop/scripts/release.mjs`, avoiding a redundant build. Never publish stale artifacts.
The command uses the signed-in GitHub CLI; no GitHub token is bundled or requested from testers.

The publisher verifies equal/stable versions, installer size/SHA-512 against latest.yml, the blockmap,
the embedded fixed GitHub feed, standalone Steam configuration, a clean tree and HEAD=origin/main.
The packed source stamp must match that clean commit and version, preventing stale/dirty builds
from being published even when their version number happens to match.
It creates `v<version>` as a draft targeting that commit, uploads all three artifacts, then publishes
and marks the complete release latest. A failed upload leaves a draft; rerunning can resume only
for the same commit. A published release cannot be replaced by this command: bump the version.

Required assets (all generated in `apps/desktop/dist`):

- `Shattered-Rifts-Setup.exe`
- `Shattered-Rifts-Setup.exe.blockmap`
- `latest.yml`

`resources/app-update.yml` is generated inside the package from the fixed GitHub publish config.
The stable installer basename keeps the website link valid across releases. The updater supports
differential downloads when the old release/blockmap is available, with full-download fallback.
Source push deploys the website; it does **not** publish a desktop installer. Future release work
must run the publisher as documented in CLAUDE.md. CI workflows remain ignored pending token scope.

## Security and edition boundaries

The updater runs in Electron's main process. The named preload exposes only status/check/install;
the renderer supplies no feed URL, installer path or process arguments. IPC is limited to the main
frame of the trusted local game origins. Release files are public HTTPS GitHub assets; the library
checks their SHA-512 against release metadata. No privileged game tokens go to GitHub.

The playtest remains **unsigned**, matching earlier installers. No certificate/publisher identity
is configured, so Windows Authenticode publisher verification is unavailable; checksums and HTTPS
do not substitute for publisher signing. Protect GitHub release access. Windows may show an
unrecognized-app/SmartScreen warning, and some managed machines may refuse unsigned installers.
Add an actual signing certificate/publisher before broader distribution; never ship credentials.

See the version-matched [Electron Builder auto-update documentation](https://www.electron.build/v26/docs/features/auto-update/).
The builder/runtime are deliberately pinned to the compatible v26/v6 family.

## Validation

`updates.test.ts` checks disabled modes, concurrent checks, progress/readiness, offline retry,
no install-on-download, failed-save refusal, save-before-install ordering and close-guard rollback.
The desktop smoke checks offline/restart/save isolation with update networking disabled. Its first
process also renders a ready-update fixture and clicks the actual Restart to update button through
renderer/preload/main IPC; a fake installer asserts that the final canonical snapshot was saved
before handoff. Later processes use the ordinary Quit path and verify exact save recovery.

`pnpm desktop:update:smoke` additionally builds two test-only NSIS packages, versions 0.183.0/0.183.1,
using a fresh app id, registry GUID and product name. Install/cache/profile paths are verified under
the run's ignored workspace directory; no production app or player profile is launched. A local
loopback feed first serves a corrupt installer, which must be rejected, then the real installer.
Electron Updater downloads/verifies it and hands off to actual NSIS. The runner checks the installed
package version and a preserved save marker, then uninstalls only its uniquely named test product.
The test fixtures are never published. Logs/artifacts remain under `.smoke-profile/updates/run-*`.

First public release verification checks GitHub's generated metadata, public asset URLs, the website
download button and live version. A first release naturally has no newer public release to discover;
the isolated two-version integration test covers that transition without publishing a fake version.
