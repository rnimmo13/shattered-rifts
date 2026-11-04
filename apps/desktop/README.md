# Shattered Rifts desktop prototype

Windows x64 Electron wrapper for the existing React/Pixi game. Steam integration code is implemented
in 0.179.0; live Steam features await an actual app ID and partner setup. See [Steam setup](steam/README.md).

**0.181.0:** twelve Ascendancies have distinct late-game mechanics and combat progress chips.
See [the pass](../../docs/ASCENDANCY_PASS_2026-11-04.md). The offline smoke also renders a Marshal
fixture through the actual campaign UI before restoring its original isolated save.

**0.180.0:** shared Campaign/Arena now require an internet connection and one account-wide play
claim. Other devices may browse. Use Save and stop playing before switching devices. The desktop
Local offline play button opens an isolated `srgame://local` origin, with files in
`%APPDATA%/ShatteredRifts/local-saves/<owner>`; those runs never enter shared sync, Arena or Steam
Cloud. Returning to Online account restores the original shared profile. See
[play ownership](../../docs/PLAY_SESSION_OWNERSHIP.md) for the protocol and identity-linking limits.

From the repository root (Node 22.12+, pnpm installed):

```text
pnpm install
pnpm desktop:dev      # build bundled assets, compile shell, launch
pnpm desktop:package  # build a Windows NSIS installer
pnpm desktop:pack     # unpacked app folder, useful for later Steam depots
pnpm desktop:smoke    # isolated real-Electron offline/restart test
```

The first Electron launch downloads its pinned runtime. Packaging downloads the Windows build tools.
Installers are in `apps/desktop/dist/Shattered-Rifts-<version>-Setup.exe`; unpacked files are in
`apps/desktop/dist/win-unpacked`. This prototype is unsigned and still uses Electron's default app icon.
No Steam partner credentials or App ID are needed to test it.

## Independent website and desktop builds

`pnpm build` still builds the website into `apps/web/dist`; it only compiles the desktop shell.
The explicit desktop commands build the renderer in Vite desktop mode into `apps/web/dist-desktop`.
All artwork, fonts, rules and UI are bundled. Desktop packaging copies that directory into `resources/game`.
It never loads the live website to run the campaign. No automatic desktop updater is installed.

The stable `srgame://app` origin preserves root-relative asset paths and local saves. Its handler
rejects escaping paths. Renderer Node integration is off; sandbox, context isolation and web security
are on. A named preload bridge handles save snapshots, status and Quit without exposing filesystem,
process, ticket or arbitrary Steam access. Pixi's CSP-compatible helpers run
only in the desktop entry. HTTPS links open in the default browser; other external protocols are blocked.

## Saves and controls

Desktop runs, settings and Vault codes persist in Chromium local storage under
`%APPDATA%/ShatteredRifts`. This path stays the same when the installer or game version changes.
Do not delete it to update the game. **Settings > Quit to Desktop** saves and closes the app.
The native close button/menu also snapshots progress before exiting. **Game > Open save folder** opens the profile; press Alt to show
the menu. `window-v1.json` stores window size, maximized and fullscreen state. F11 / Alt+Enter toggle
fullscreen; the existing in-game fullscreen setting remains available.

Browser and desktop profiles are separate. Existing run export/import transfers a run manually;
Vault codes can sync supported data when online. Canonical snapshots and the previous-revision backup
are under `%APPDATA%/ShatteredRifts/saves/standalone` or `saves/<Steam ID>`. Configured Steam profiles
use `profiles/<Steam ID>` for Chromium data. Steam Auto-Cloud setup is documented above; it has not
been activated or tested against Valve because no app ID exists yet. Online Google cookies are not shared with desktop.

On a fresh profile, select **Local offline play** to start an isolated campaign without a connection.
Arena, ghosts, boards and Vault sync require a connection and the usual online identity. The server
must contain decision #577's exact desktop-origin allowance. No renderer security setting is disabled
to work around cross-origin requests.

## Validation

`desktop:smoke` runs the bundled renderer in three separate hidden Electron processes with all HTTP,
HTTPS and WebSocket requests blocked. The first starts an offline campaign, checks local assets and
renderer isolation, renders a sandbox fight, and quits. The second checks that the exact run survived.
The first also verifies that shared gameplay refuses entry without a connection and that local
progress does not enter the shared save. The third restores the isolated local backup into a fresh
profile. Each quits through Settings. Test profiles and screenshots remain under ignored
`.smoke-profile/run-*` and `.smoke-profile/local-recovery-*`, separate from real saves.
The test's hidden window disables background throttling so animation frames can render.

Before public distribution, test the installer on another Windows computer, add branded icons and
signing, and complete real Steam account/achievement/two-machine Cloud testing using the setup guide.
Steam Deck, controllers, macOS and Linux are not validated by this Windows prototype.
