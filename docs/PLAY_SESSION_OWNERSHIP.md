# Shared play ownership (0.180.0, decision #579)

One game identity may play on one device at a time, across Campaign, Arena and practice. Other
devices may sign in and browse cards, history, decks, cosmetics, boards, replays and live matches.
There is no forced takeover button. Use **Save and stop playing** on the home screen, or Quit to
Desktop, then resume on the other device. A crashed/closed client releases by lease expiry within
45 seconds. A live connection renews every 10 seconds. Losing connectivity pauses shared gameplay.

Robert explicitly chose online-only shared play and separate local offline campaigns. Desktop
**Local offline play** opens `srgame://local`, with its own Chromium storage origin and snapshots at
`%APPDATA%/ShatteredRifts/local-saves/<owner>`. Online mode remains `srgame://app` and
`saves/<owner>`. Local saves do not auto-import into shared accounts, enter Arena, publish progress,
match Steam Auto-Cloud paths, or grant Steam achievements. Existing online-profile saves remain
there; this change does not delete them. Run file export/import remains an explicit action.

## Server rules

- `/pvp/play/claim`, `renew`, `release` resolve the signed-in identity first, else a guest Vault code.
  The same existing Vault Durable Object stores a private lease row. No new namespace is required.
- A valid current proof is required for gameplay writes, run/deck deletion, publishing campaign
  progress, entering matchmaking/rooms, and every existing Arena socket's gameplay messages.
  Watch-only sockets cannot join a seat without proof. Client-chosen player IDs cannot impersonate
  another seat: queue/reconnect identity is derived from the verified account claim.
- Claim conflicts do not reveal the other device's proof. Late releases, heartbeats and saves from
  an old proof cannot affect a new holder. Read-only requests do not obtain/extend the lease.
- Runs and mid-fight replay logs commit under an expected server revision, in a SQLite transaction.
  Stale revisions are rejected. Valid saves receive server timestamps; client clocks do not choose
  the winner. The initial migration can adopt old local progress only for a never-saved identity.
- A newly claimed client loads confirmed runs, replay logs, Vault and histories before enabling
  controls. Reconnecting remounts gameplay from that checkpoint. Divergent local run copies are
  retained at `sr.runConflictCopies` for support/recovery, never automatically promoted over a
  newer confirmed branch. The first migration preserves local replay logs for adoption too.
- A browser/native process that disappears may lose up to the last unconfirmed sync interval;
  local disk copies remain for recovery. This is not a claim that network failures can preserve
  every final action on the server. Use Save and stop playing before changing devices.

## Identity and platform limits

The lock is per game identity, not per human or physical hardware. The same Google account,
the same Steam account, or the same guest Vault code shares a claim. A Steam account and an
unlinked Google/mobile account are different identities today. Account linking is required before
launching a cross-platform shared account promise; it is not silently implemented by this release.
App-store native wrappers and mobile sign-in still need their own platform work. Steam activation
still awaits Robert's real App ID and partner setup. No offline system can enforce a global lock
while disconnected, which is why local mode has no shared progression.

## Validation

`pnpm test` includes real Vault code over an in-memory SQLite adapter, competing claim requests,
revision rejection, rollback validation, pure lease expiry/fencing, browser gate states and stale
Arena sockets. `pnpm desktop:smoke` blocks all network requests, checks that shared play refuses
entry, switches to isolated local mode, creates/continues a campaign, renders a fight, quits through
Settings, and verifies that the shared save did not receive local progress. A fresh-profile local
file restoration is checked as well.

For a local Worker integration check, run Wrangler on port 8792, then `pnpm play:smoke`. This
probe is restricted to localhost and checks claim collisions, read-only access, fenced save writes,
room admission, stale socket rejection, and a new device resuming the same account's Arena seat.
It never plays a battle or runs a balance simulation. The older PvP protocol smoke transport now
acquires/renews test-account claims too; running its bot matches still requires Robert's request.

Older website/desktop clients must update: the backend rejects gameplay writes/sockets without
the ownership proof. Existing replays keep their combat rules version.
