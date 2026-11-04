# Shattered Rifts desktop prototype

Windows x64 Electron wrapper for the existing React/Pixi game. Steamworks is a later milestone.

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
are on. No preload bridge exposes filesystem or process access. Pixi's CSP-compatible helpers run
only in the desktop entry. HTTPS links open in the default browser; other external protocols are blocked.

## Saves and controls

Desktop runs, settings and Vault codes persist in Chromium local storage under
`%APPDATA%/ShatteredRifts`. This path stays the same when the installer or game version changes.
Do not delete it to update the game. **Game > Open save folder** opens the profile; press Alt to show
the menu. `window-v1.json` stores window size, maximized and fullscreen state. F11 / Alt+Enter toggle
fullscreen; the existing in-game fullscreen setting remains available.

Browser and desktop profiles are separate. Existing run export/import transfers a run manually;
Vault codes can sync supported data when online. File-backed campaign snapshots, automatic backups
and Steam Cloud are not implemented yet. Online Google cookies are not shared with the desktop.

On a fresh profile, select **Play offline without the leaderboard** to start a campaign immediately.
Arena, ghosts, boards and Vault sync require a connection and the usual online identity. The server
must contain decision #577's exact desktop-origin allowance. No renderer security setting is disabled
to work around cross-origin requests.

## Validation

`desktop:smoke` runs the bundled renderer in two separate hidden Electron processes with all HTTP,
HTTPS and WebSocket requests blocked. The first starts an offline campaign, checks local assets and
renderer isolation, renders a sandbox fight, and quits. The second checks that the exact run survived.
Test profiles and screenshots remain under ignored `.smoke-profile/run-*`, separate from real saves.
The test's hidden window disables background throttling so animation frames can render.

Before public distribution, test the installer on another Windows computer, add branded icons and
signing, test online play against staging, and add file-backed saves/backup and Steamworks features.
Steam Deck, controllers, macOS and Linux are not validated by this Windows prototype.
