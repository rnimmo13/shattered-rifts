# Arena testing baseline — local 0.200.0 / rules 83

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
