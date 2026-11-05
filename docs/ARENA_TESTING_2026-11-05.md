# Arena testing baseline — local 0.200.0 / rules 83

## Real-player evidence extension — local 0.201.0 / rules 83

**Performance/debug sharing follow-up (#608):** Settings → Start recording → Stop → **Share report** uploads the recording explicitly to the server's SQLite database. Copy the resulting short `https://shatteredrifts.app/pvp/reports/<id>` link into Discord or this chat. The recipient reads a server-rendered page without a login or executing the game; `?format=json` exposes the same report for analysis. No file attachment or long pasted text is required. Hardware/browser/timing details are visible to anyone with the unguessable 128-bit link; nothing is uploaded automatically. Reports expire after90 days or earlier under the2,000-report storage cap. Requests are size/origin/rate limited, report text is escaped, and failures preserve the local recording for retry. The share link remains available when closing/reopening Settings during the same session. Desktop replay share URLs also point to the web origin, rather than a local `srgame://` URL. This is user-supplied diagnostic evidence, distinct from authoritative Arena records. No public report index or account/deck inventory is exposed. Implementation remains unpublished pending release approval.

The explicit diagnostics route also works from the isolated offline desktop origin without acquiring a play lease or uploading saves. Only the exact report routes bypass the offline progress guard; online Campaign/Arena writes remain fenced. Local follow-up verification:176 files/3,802 tests passed with two workers, followed by10 targeted tests including the offline exception. Typechecks, changed-source lint, web/desktop-shell build, real Worker/SQLite report save/read/rate limits and Chromium Start→Stop→Share/copy-fallback/reopen/mobile checks passed. No actual Discord messages were sent; the test verifies a short HTTPS link and independently readable full report.

No combat, card, AI-policy or balance values change in this extension. No simulations were run for it. This section supersedes earlier collection/replay descriptions where they differ; the 0.200 baseline and archived results below remain historical.

**Player workflow:** History → Arena matches → Watch opens a match record. Watch replay, copy its share link, optionally describe the intended plan, or choose **Save match record**. Send the JSON file to Robert or attach it for analysis. **Open a saved match record** in History reads the file locally without uploading it. Anyone with a public replay link can see both decks/hands and public display names. Downloads remove account/run IDs. Notes travel in the downloaded file, not a server feedback database.

**Retention:** the server keeps an owner-to-replay index for the latest ten recorded games per authenticated account/Vault, including human/ghost games and early resignations. Those games are protected from the ordinary 30-day/20,000 replay archival pruning while they remain in anyone's latest ten. The global cap is consequently a soft cap for protected records. Older unprotected links can expire after 30 days or archival pressure; downloaded files persist independently. Recording remains best-effort, with existing per-owner rate limits and a 400,000-character record bound. Pre-extension games have no server ownership index; old local history remains a fallback. An unchanged account/Vault identity is required to find the same history on another device. Saving the same authoritative game again returns its original replay ID.

**Evidence:** authoritative rooms record opening positions; each accepted action's events, card definition (for hand plays) and Mana/Reserves/Power/pile counts; and detailed hands (including temporary card modifiers), boards, statuses, Auras, runes and discipline state at turn boundaries/lethals. Pending choices are retained as accepted actions. The evidence is rebuilt on reconnect from the same accepted log. It is capped at 1,001 frames / 200,000 serialized frame characters; `truncated` and `totalActions` expose incomplete captures. Detailed positions occur after the relevant action, not before it. Numerical event evidence is distinct from the older partial attributed-damage aggregate. Do not infer missing damage/setup/removal from an absent aggregate or missing frame. This is post-game evidence, never a live hidden-hand endpoint.

Private Arena `games.json` and `turn-evidence.json` now include this evidence. Shared match archives include exact decks, initial setup inputs, accepted moves, state hashes where present, optional intent notes and recorded evidence. Matching current card/content definitions are attached only when the running rules match. Retired historical card IDs remain inspectable, but playback stays rules-gated; a data snapshot does not contain an executable historical engine. Shared files can be edited and are user-supplied evidence; private server exports are the stronger provenance. No new evidence is invented for older replays.

**Private Campaign access:** accepted online run saves from clients reporting the current rules contribute whitelisted exact deck/upgrades, Boons, HP, tier/difficulty/phase, cumulative win/loss counters and cleared-node counts. A run-scoped opaque hash links positions without an account name/id; identical positions deduplicate. Save snapshots are client-observed, not verified fight results. They omit raw saves, seeds, RNG, maps, names and credentials. Offline runs and historical saves from clients without collection metadata are not uploaded. Ended/deleted runs may have only their earlier uploaded positions; this is not a complete population, end-state, reward-offer or card-choice history. Consecutive deck differences suggest changes, not which offer or player intention caused them. Collection is disclosed in Campaign and patch notes. Decks remain private; no public directory is needed.

The existing owner secret authorizes both exports; it never belongs in a browser or a shared report:

```text
pnpm balance:arena --server https://YOUR-WORKER --out D:/Code/ShatteredRifts/.wrangler/testing-PHASE/arena
pnpm balance:campaign --server https://YOUR-WORKER --out D:/Code/ShatteredRifts/.wrangler/testing-PHASE/campaign
pnpm balance:campaign --input D:/Code/ShatteredRifts/.wrangler/testing-PHASE/campaign/snapshots.json --out D:/Code/ShatteredRifts/.wrangler/testing-PHASE/campaign-review
```

`BALANCE_ADMIN_TOKEN` must be set in the process environment as before. Campaign uses `/admin/balance?kind=campaign`, with the same authentication/no-store policy and paginated 90-day/20,000-snapshot retention. Open generated `report.html`; JSON/CSV retain exact IDs and grouping context. Use a new phase/date output directory for every collection and archive the raw JSON before server retention removes it. The tools write the chosen directory; they do not merge or archive earlier exports automatically. Snapshot count is not match count. Keep human/ghost, seat, rules/AI/HP, Campaign difficulty/tier and provenance separate. Link each proposed balance fix to observed games/positions and report counterexamples and sample limitations.

Implementation is local and requires fresh release approval. Production collection is not asserted merely because local fixture checks pass.

Local verification for 0.201: lint (zero errors, two existing React-refresh warnings), workspace typechecks and web/desktop-shell build passed. The full suite passed with `pnpm exec vitest run --maxWorkers 2`: 3,797 tests / 174 files. The initial higher-concurrency run timed out in the pre-existing ghost-AI test; the reduced-worker run passed without changing that test's timeout. Local Worker/SQLite checks exercise private export authentication/pagination, owner/seat isolation, latest-ten ordering, duplicate replay saves, accepted-save Campaign collection and raw-field exclusion. `pnpm --filter @sr/web replay:smoke` checks real Chromium at 1360/390/320px, playback, JSON download with feedback/evidence/content, local file import and server-history seat rendering. All smoke data is explicitly synthetic; these checks establish behavior, not balance or player outcomes.

Robert prioritizes Arena balance over Campaign. All ten classes and both seats start at **1,000 current/max HP**, independent of class HP and campaign upgrades. The second seat retains its existing **one extra first-turn card**; its former +60 HP and +1 opening Mana are removed. Normal later draw/Mana rules remain. No new card or Ascendancy numbers change in this version; the local0.199 candidate remains underneath it.

Each Arena game has **30 minutes** (was20), including ghosts. The75-second turn limit and two-timeout forfeiture remain. The entire Arena match draws once both players have passed **three consecutive own turns without playing a card**. Playing a card resets that player's streak. A single player's pass streak is insufficient. Automatic companion attacks, statuses and mandatory choices do not count as playing a card. Combat lethals take precedence. Accepted actions rebuild streaks after reconnect; unfinished older-rule games use existing migration/version guards. This ends the whole series as a draw; it does not automatically schedule another game.

## Developer deck review

Completed online Arena games send an internal server observation containing the exact two starting decks (including duplicates and upgrades), class, Ascendancy, rules, starting HP, AI version, human/ghost seat, result/reason, duration, own turns, and attributed hero HP damage/peak. Both seats' data is recorded before a series moves on. Campaign/local offline decks and games that never reach completion are not collected here. No account identifier, login credential or display name is included. Reporting is best-effort and does not block gameplay; retain at most20,000 games/90 days, exporting regularly for a longer alpha/beta history. The Arena screen and player notes disclose collection.

The export is **owner-only**, not a public live-deck endpoint. Configure a long random Worker secret named `BALANCE_ADMIN_TOKEN` when the release is approved. Never put it in the web build, a URL, repo or report. The route is disabled without a configured secret. Set the same secret in the local process environment when exporting:

```text
pnpm balance:arena --server https://YOUR-WORKER --out D:/Code/ShatteredRifts/.wrangler/arena-balance
```

Open the generated `report.html` locally. Filter by rules/HP/AI/source, search class/Ascendancy/card names, then expand an exact deck to see card counts and its game rows. `games.json` preserves raw observations; `decks.csv` and `deck-observations.json` support subsequent analysis. Import a saved export with:

```text
pnpm balance:arena --input D:/path/games.json --out D:/path/report
```

The report defaults to combat wins and pass draws. Resignations, disconnects, timeouts and time-limit results require choosing the expanded result filter. It separates ghost-controlled deck observations from human-controlled ones even in the same ghost game. Wins use decisive games as denominator; draws are shown separately. Small samples are flagged. Neither a two-seat observation nor multiple seeds is an independent human match.

Damage means HP lost by an enemy hero from an attributable opposing unit source. It excludes Barrier absorption, self-payments and unattributed sources (including some DOT/Fate). It is **not total offensive power or theoretical DPS**. Per-turn peaks are grouped by the attacker's own turns and can include reactive damage before its next turn. Healing, removal, control, consistency and survival still matter. Unknown/missing data must not be treated as zero skill or a weak class.

## Shared AI and evidence

`chooseSmartAction` is the shared policy used by online ghosts, browser ghost combat and the Ascendancy simulation harness. Policy stamp: `synergy-2`; default search: width8, depth10, budget900. The harness now defaults to the same budget; deliberate overrides are recorded. Older frozen experiments remain historical and require their original source/rules, not a rerun against changed live code.

Changes: search fingerprints retain buffs, card modifications, Reserves, totems, Auras, counters and pending choices; pending choices can be planned through rather than always delegated to a one-step picker. The evaluator recognizes Spirit, Keen, queued Power, Reserves, attack Auras, Fracture and setup investment. Campaign HP has additional survival weight. Search builds a deterministic belief state: own unknown draw order is sampled from known deck contents, actual RNG is replaced, opponent hidden hand/draw identities and trap definitions are not read. Revealed pending-choice cards remain available. The actual state is never modified by planning.

This is **not human-equivalent play or automatic learning**. One imagined draw order can be wrong; the evaluator still uses authored weights and a short horizon, and the trap prior is deliberately incomplete. Simulations identify mistakes; turn them into reviewed regression positions, improve the shared policy, stamp a new version, and compare against frozen previous-policy runs before shipping. Keep held-out decks/seeds separate from weight/deck selection. A small mirrored comparison is a diagnostic, not proof of universal improvement.

The earlier best-of-ten deck search is not globally optimized and trained against only two Arena opponent styles. Future training now covers ten opponent styles in both seats and freezes content/AI metadata; this broader search has not been used to claim new optimal decks here. Do not infer the best available synergy from those lists. Real deck exports provide candidate recipes and counterexamples; validate card legality/upgrades and compare equal-quality decks against a varied field before any new grades. Published0.199 statistics do not describe this new HP/AI/Mana baseline.

The matched diagnostic supports this policy revision:38 new-policy wins against22 legacy-policy wins in60 mirrored Arena games, plus17/30 versus13/30 Vorthax clears (one unresolved attempt each). One seed per style, no new deck optimization and no human matches. Detailed frozen jobs/outcomes are in `balance-history/simulations/0.200.0/`; this does not establish a per-build Vorthax probability or balanced Arena field.

## What to balance next

- Arena: compare median and high-end pressure, turn-ten growth, setup failures, recovery, both seats and archetype matchups. Higher ceilings can be acceptable when setup/draw dependence and counterplay justify them. Damage alone does not equal win strength.
- Use human games as the primary alpha/beta evidence; keep ghosts and bots separate and report sample size.
- Campaign follows Arena: Robert's desired optimized Vorthax success is roughly50% or somewhat higher. Tune authored monster durability/pressure as needed after deck balance is understood. This is a design target, not a promised player probability.
- Preserve earlier assessments. New1,000-HP/AI results need a fresh sample before assigning A-band grades or claiming the ten-plus-turn pacing target.

No push, deployment, secret provisioning or release is authorized by implementation approval.

## Local verification

`pnpm check` passed:3,792 tests/171 files, typecheck and web/desktop-shell build. Lint has zero errors and two pre-existing React-refresh warnings. Subsequent simulation-adapter updates passed tools typecheck/lint. Private-export smoke checks use a local Worker with real SQLite to verify exact decks, deduplication, validation, authentication and pagination. Isolated Chromium checks passed at1360,390 and320px for patch notes/card images, and for developer-report filtering/mobile overflow. The report preview uses explicitly synthetic fixtures, not player records. No desktop installer or live service was published.

Older `sim`, `runsim`, `balance`, `pvpbalance`, card/trait scans and stage-one tools now default to the shared policy too. Explicit greedy comparison modes remain available. `arenasim` defaults to the actual fixed-HP `Match` path (including pass draws); explicit nonzero `--mults` remain labelled counterfactuals. Those old exploratory tools are not a substitute for the versioned Ascendancy experiment and real-player report.
