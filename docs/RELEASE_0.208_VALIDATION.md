# Release0.208.0 / rules85 validation

Robert approved committing, pushing and deploying the complete candidate, decision640 (2026-11-05), website/server and Windows updater.

Scope: Reserves scaling audit and recurring card provenance for existing Warded/Blood Heart modifiers; shared Campaign/Arena Recall cap15Daggers/cast and Echo cap15actualBarrier/copy/turn; previews/card text, exact player/developer notes and append-only assessments. Existing copies use new limits. Rules85 uses existing incompatible-battle checkpoint migration.

Final full suite3,916tests/188files passed. All workspace typechecks pass. Whole-repo lint0errors with two existing React-refresh warnings in PileArt.tsx and MapInk.tsx. Web production and desktop-shell builds pass. Eleven dedicated cap scenarios cover upgrades,15/28knife piles, filtered order, previews, automatic/Fanned/off-turn plays, independent copies, modifier rounding, JSON restore and turn reset. Exact calculations and historical real-player evidence are in RESERVES_AUDIT_2026-11-05.md and ASSASSIN_KNIFE_CAPS_2026-11-05.md; no balance simulations or new-rules strength measurements.

Release workflow: verify native isolated save smoke, commit source, push main for automatic Cloudflare deployment, build/package from clean source, validate installer/feed/blockmap and clean commit stamp, publish all three GitHub assets as stable latest, verify live manifest/check and public release feed/checksums. Private test exports remain ignored.

Native pre-release smoke passed: fresh desktop renderer/shell build and isolated offline save write/read/restart plus cloud-read checks; artifacts retained under ignored apps/desktop/.smoke-profile/run-JXHchJ. No player profile was used.
