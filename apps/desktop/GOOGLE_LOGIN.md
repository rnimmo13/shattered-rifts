# Google desktop login and Steam linking (0.187.0, decision #586)

The standalone desktop Account panel and Settings > Desktop offer Google sign-in and sign-out.
The default browser opens the existing website Google OAuth flow. The user confirms desktop sign-in
in that browser, then returns to the app. This uses the existing server-only Google Web client and
registered `/auth/google/callback`; no Google secret or Google access/refresh token enters the app.
Only `openid` is requested. No Google name or email is retained.

## Identity and save boundaries

- The app creates a 256-bit verifier; the server stores its SHA-256 challenge for a ten-minute,
  one-use handoff. Its browser URL contains only an unguessable attempt ID. Confirmation is protected
  by OAuth state, a separate ten-minute HttpOnly cookie and a per-attempt form secret. The ordinary
  website session cookie is unchanged, including when the browser is signed into a different account.
- The Identity Durable Object (binding IDENTITY, SQLite migration v4) issues a separate thirty-day
  game session. Only its proof hash is stored server-side. Tokens never enter renderer IPC replies,
  URLs, localStorage, save files, logs or Steam Cloud. Sign-out revokes that session when online and
  deletes its local credential even offline; otherwise its server expiry still applies.
- Windows safeStorage encrypts `%APPDATA%/ShatteredRifts/auth/google-v1.dat`. If secure storage is
  unavailable on a fresh profile, login lasts only for that process. An unreadable existing credential
  is preserved and blocks startup rather than selecting another person's profile.
- Google save files live under `account-saves/google-<hashed account>/save-v1*.json`; existing guest
  and Steam save paths stay intact. Switching flushes/syncs the old account, releases its play claim,
  freezes input, commits the final snapshot, clears old renderer storage and restores the selected
  account. Account operations are serialized and cannot switch save mode while pending.
- Login shows a blocking, cancellable waiting screen. Account changes are refused in mounted fights.
  Expired/revoked sessions retain their account's files and offer reconnect. Local offline mode remains
  a separate origin/save directory; signing in does not import those runs or upload them to Cloud.
- Website and desktop Google sessions resolve to the same existing hashed account and therefore use
  the same server saves and account-wide Campaign/Arena lease. Another device can still browse.

## Steam account linking

Steam editions offer Link existing Google account when their verified Steam session is online and
unlinked. Google browser confirmation explicitly chooses keeping Google progression. There is no
automatic merge and no unlink UI. A Steam identity already linked elsewhere is refused.

The source Steam Vault must never have claimed play and must have no saved runs, decks, history or
owned cosmetics. Native Steam shared saves are checked too. The old Vault is permanently sealed
before recording the alias, fencing stale in-flight requests. An interrupted link can retry with the
same Google account. Existing signed Steam sessions resolve through the alias on every server request,
so linked devices share the Google account's play lock. Steam's local profile/Auto-Cloud paths still
use the actual Steam user ID. Linking neither grants a Steam license nor activates Steamworks.

Robert has no Steam app ID yet. Real Valve ticket validation, live linking and Steam achievements/Cloud
still require the partner setup in `steam/README.md`; local fixtures are not a claim of live Steam testing.

## Validation and deployment

`pnpm desktop:account:smoke` uses two real hidden Electron processes with isolated profiles and all
renderer HTTP/WS blocked. A simulated auth service checks the app verifier. Real Windows credential
encryption, two-account/guest save separation, sign-out, a battle guard and restart restoration are
exercised. `pnpm desktop:smoke` retains existing offline/update/save checks. Unit tests cover proof
mismatch, one-use exchange, cancellation, expiry, revocation, browser-cookie separation and linking
conflicts; Vault tests cover permanent source fencing.

Deploy the Worker and migration before distributing the desktop release. Production already uses
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and SESSION_SECRET for website login. Keep these secrets in
Cloudflare; none belongs in desktop configuration. Keep migration v4 and Identity storage when making
future changes: aliases and active desktop sessions live there. Standalone desktop releases use the
existing public updater workflow in UPDATES.md.

For a live smoke test, use the new app to sign in, confirm in the browser, reopen the app, and check
that the same website account's progress appears. Release the website's play claim before entering a
fight on desktop. Sign out and verify guest/local saves remain separate. No developer can complete a
real user's Google consent on their behalf; automated login fixtures do not replace that live check.
