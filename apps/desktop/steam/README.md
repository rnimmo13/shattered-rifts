# Steamworks setup (0.179.0)

The integration code is implemented, but **Robert does not have a Steam app ID yet**. Standalone
builds remain playable. Do not treat local tests as proof of live Steam login, unlocks or Cloud sync.

## When the app exists

1. Set `SR_STEAM_APP_ID` to the game's real numeric app ID before `pnpm desktop:package`.
   In PowerShell: `$env:SR_STEAM_APP_ID = '<your actual app ID>'`. This public ID is baked into
   `out/steam-config.json`. Without it, builds explicitly run standalone. Spacewar's 480 is refused.
2. Give your Steam account a development license and run Steam before launching a configured build.
   Native Steam initialization happens only in main, before selecting the account's profile.
3. Configure backend `STEAM_APP_ID`, `STEAM_WEB_API_KEY` (publisher Web API key), and `SESSION_SECRET`
   in Cloudflare. Set secrets with `wrangler secret put`; **never put publisher keys into build
   variables, the renderer, steam-config.json or git**. No secret has been configured by this change.
4. Create and publish the achievement definitions below and their icons in Steamworks.
5. Enable Steam Cloud using the settings below and publish the partner configuration.
6. Upload `apps/desktop/dist/win-unpacked` as the Windows depot; launch `Shattered Rifts.exe`.
   Keep `steam_api64.dll` beside it and all packaged resources. Do not ship a development steam_appid.txt.

## Login

The main process obtains a ticket for identity `shattered-rifts`. The backend verifies it through
Valve for its own configured App ID, hashes Valve's verified Steam ID, and returns a signed session.
Main attaches that bearer only to the game's HTTPS/WSS backend requests; it is not exposed through
the preload. No password or browser cookie is needed. The Steam persona name goes through the
existing name claim rules; a duplicate or disallowed name still needs an alternative.

The current Steam ID isolates both the Chromium profile and Cloud files. An unavailable internet
connection does not change to another account. Failed Steam initialization refuses to open a
configured build rather than falling back into a shared guest profile. A build with no App ID remains
standalone. Web Google accounts/Vault codes and Steam are not silently linked; existing export/import
can move a standalone campaign into a Steam profile deliberately.

## Achievements

`src/saveData.ts` is the definition source. Building generates `out/steam-achievements.json` with
API IDs, names and descriptions for review/setup. The IDs must match Steamworks exactly:

- `FIRST_VICTORY`: win a campaign battle.
- `ASCENDANT`: choose an Ascendancy.
- `TIER_1`, `TIER_5`, `TIER_10`, `TIER_15`, `TIER_20`: clear that tier.
- `CLASS_KNIGHT`, `CLASS_ENGINEER`, `CLASS_HUNTER`, `CLASS_TRICKSTER`, `CLASS_ASSASSIN` (Rogue),
  `CLASS_SHAMAN`, `CLASS_MONK`, `CLASS_SPELLBLADE`, `CLASS_NECROMANCER`, `CLASS_DRUNKARD`:
  clear Tier I with the class.
- `ALL_CLASSES`: clear Tier I with all ten classes.

The 18 milestones are derived from saved campaign progress/history, not Sandbox battles. Entering
a tier or losing there does not count as clearing it. Earned IDs persist when runs are deleted.
Imported campaign progress can backfill unlocks. The main process permits only defined IDs and
retries unacknowledged unlocks when saves are checked; Steam maintains its offline stats cache.
Achievement icon artwork and live Steam stats verification are still required before release.

## Steam Auto-Cloud

The game writes files itself; Steam synchronizes them at launch/exit. Enter the fields in
`auto-cloud.json` in Steamworks (it is a reviewable configuration reference, not an upload API):

| Field | Value |
|---|---|
| Root | WinAppDataRoaming |
| Subdirectory | `ShatteredRifts/saves/{64BitSteamID}` |
| Pattern | `save-v1*.json` |
| Recursive | No |
| OS restriction | Cross-Platform |
| Byte quota | 67,108,864 |
| Number of files | 4 |

Only `save-v1.json` and `save-v1.previous.json` match. Temporary writes, Chromium caches, window size,
graphics quality, authentication and standalone saves are excluded. These two files contain versioned,
checksummed account-bound snapshots of campaigns, mid-fight replay logs, the Vault, histories,
cosmetics and portable preferences. Writes flush and rename atomically; the last valid revision is
rotated into a backup. Startup reads the canonical file before React loads, including deletions.
The previous revision can recover a damaged current file. Unknown/wrong-account data is preserved
and blocks overwriting if neither revision is readable.

Steam handles Cloud conflicts before launching the game. Do not run two computers' copies at once
while testing; deliberately test Steam's conflict choice and verify both files after resolution.
The app does not implement a second competing newest-wins merge. macOS/Linux root overrides and
Steam Deck are future work; this packaging target is Windows x64.

## Validation still needed with the real app

- Launch through Steam and confirm persona, account mapping and server-authenticated Vault access.
- Confirm a rejected/tampered ticket cannot sign in, and online interruptions preserve local play.
- Publish the exact achievement IDs/icons, unlock milestones, restart, and test an offline unlock.
- Move a Cloud save to a second computer, switch Steam accounts, resume a mid-fight save, and test
  intentional conflicts, Cloud disabled, corrupted current file and backup restoration.
- Verify packaged native DLLs, Steam overlay compatibility, and installation on another Windows PC.

References: [Steam ticket verification](https://partner.steamgames.com/doc/webapi/isteamuserauth),
[Steam Cloud setup and identifier paths](https://partner.steamgames.com/doc/features/cloud),
[steamworks.js](https://github.com/ceifa/steamworks.js).
