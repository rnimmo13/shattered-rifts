# Release 0.203.0 validation

2026-11-05. Robert approved commit, push and deployment of the complete current changes (decision #623). Web and desktop versions match; shared combat rules remain83. Campaign uses a versioned route/Omen profile so active legacy tiers and unfinished fights retain their previous effects until advancing.

- Full regression: **181 files, 3,849 tests passed**. Includes actual SQLite save fences/checkpoint retention and leaderboard migration/spending/stale-report checks; uploads during continuous play, in-flight updates, failed handoff, stale acknowledgement and local recovery; unique Warden permutations, saved gauntlet transitions/rewards, full-HP Resolve and real initial-combat shuffle/reload stability.
- Workspace type-checking passed. Lint passed with the two pre-existing React refresh warnings in `PileArt.tsx` and `MapInk.tsx`.
- Production web and separate desktop renderer/shell builds passed. Existing dynamic-import/chunk-size warnings remain.
- Isolated native desktop smoke passed write, restart/read, update handoff and save isolation with synthetic data; no production player profile used. Online handoff failure/acknowledgement paths are covered by dedicated tests, not a claim of live two-device network-failure testing.
- Isolated Chromium map checks:1920×1080,1366×768,1280×720,1024×600,390×844,320×640. Desktop horizontal and phone vertical graph, five first choices, viewport/body fit, internal scrolling, current-choice restoration, final labels and battle-overlay geometry checked. Overlay checks use the real map component in its shell; they do not initialize/render a live GPU battle.
- Actual CDP touch gestures over rendered cards scrolled both Shrine Upgrade and Remove pickers245px without choosing a card; Cancel/header remained reachable.
- Victory art loaded on desktop/phone; responsive actions and reduced-motion animation disabling checked. Synthetic fixture, not a measured campaign victory. Campaign Shards column checked on desktop/phone with internal table scrolling and no page-width overflow.
- Player notes rendered at1360,390,320px, including current campaign changes and prior exact card buff/nerf rows/art. Synthetic exact-deck report filtering also passed.
- Balance history preserves the initial local assessment and appends `0.203.0-campaign-review-1` with all30 Ascendancies, ten class starts and representative freely mixed builds. All revised Campaign strength labels remain unrated. **No balance simulations or human match dataset were used.** Broader difficulty tuning remains a follow-up.

Original victory art and processing provenance are in `victory-art-203.json`. Raw images, synthetic fixture saves and screenshots stay in ignored workspace directories. No player save identifiers, account credentials or raw recovery copies are committed.

Release packaging must follow `apps/desktop/UPDATES.md`: rebuild from the clean committed source, validate installer SHA-512/feed/source stamp, push that exact commit and publish all three updater assets together. Verify the automatic website/server deployment and stable Windows release afterward. The incomplete0.202 draft stays unpublished.
