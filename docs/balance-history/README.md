# Balance history

Current local baseline: [0.200.0/rules83](0.200.0.md), [CSV](0.200.0.csv), [Arena rules and deck-report guide](../ARENA_TESTING_2026-11-05.md), [AI comparison](simulations/0.200.0/README.md). Equal1,000 HP, second-seat extra opening card only,30-minute games and mutual-pass match draws.120 matched policy games support the shared pilot revision, not class grades. All30 rows explicitly await fresh field evidence; historical projections remain preserved. **Not pushed/deployed.**

Latest local revision: [0.199.0 / rules82 assessment](0.199.0.md), [CSV](0.199.0.csv), [all 30 measured bot comparisons](simulations/0.199.0/RESULTS.md), [interpretation](simulations/0.199.0/README.md), [exact changes](../BALANCE_REVISION_2026-11-05.md). Implementation and follow-up simulations are authorized; **push/deployment are not**. The final 6,480-game evaluation improves boss clear rates but still misses all-A parity and the ten-own-turn Arena target. Current labels are benchmark review signals, not human letter grades. Prior projections are preserved; untested campaign bands are marked explicitly. Historical entries below retain their assessment-time context.

Latest evidence: [v0.198.0 simulation review 1](simulations/0.198.0/README.md), [all 30 builds and prior-grade comparison](simulations/0.198.0/RESULTS.md). Robert explicitly requested these simulations. The 9,480 main bot fights do **not** substantiate the earlier all-A-band projections or the 10+ own-turn Arena target. Frozen decks, raw outcomes, methodology and additional paired experiments are archived separately from human playtests. No balance rules changed; original estimates below remain intact as historical predictions.

Current: [0.198.0 / rules81](0.198.0.md), [CSV](0.198.0.csv), [exact implementation](../LONG_FIGHT_BALANCE_2026-11-04.md). Robert authorizes the complete long-fight proposal set, including Bonelord/Deathwish buffs. All30 projected grades, ten class starts and risks are saved with zero measured matches. Earlier summaries below describe their historical assessment/release state; unapplied proposals listed there are superseded by this release.

Current implemented release candidate: [0.197.0 / rules80](0.197.0.md), [CSV](0.197.0.csv), [exact Engineer changes](../ENGINEER_SCALING_2026-11-04.md). Following Robert's release authorization, only the focused Heavy Hitter/Resonant Pulse proposal P4 joins the20-minute Arena clock and approved lore. The wider review remains available below; P1–P3/P5–P7 and candidate buffs are unapplied. Prior review labels describe their assessment-time state. No measured parity is claimed.

Latest assessment: [0.197.0 Arena ten-plus-turn review](0.197.0-arena-review-1.md), [CSV](0.197.0-arena-review-1.csv), and [full reasoning/proposals](../ARENA_LONG_FIGHTS_REVIEW_2026-11-04.md). This revisits all30 Ascendancies under the longer target, with corrected Golemancer HP/card analysis. Only the approved Arena clock15→20 minutes is implemented locally; balance proposals are not applied, and rules79 still match the released balance. Zero measured matches; the friend's160-HP Golemancer report is anecdotal. Earlier snapshots stay intact.

The last implemented balance pass is [0.195.0](0.195.0.md). Compare [0.194.0](0.194.0.md), the prior released baseline. Release 0.196.0 carries exactly the 0.195.0 balance pass (rules 79), with a lore correction only. Robert approved release on 2026-11-04. Snapshots preserve their original assessment-time local/unreleased labels; this release mapping does not change any grades or add measured evidence.

[Baseline assessment revision 2](0.194.0-review-2.md) corrects retrospective progression and fight-development sub-grades that initially reused projected values. The original assessment remains intact. The original overall Arena grades are unchanged; this is an assessment correction, not another game version.

Each version has an authored JSON assessment, a generated Markdown chart and a CSV. Preserve earlier assessments once reviewed/committed. Add a new snapshot for every future balance pass, including unchanged rows, previous grades, exact source/rules/version, reasons, uncertainties and evidence. Corrections belong in the next assessment; do not silently revise history. Rebuild display files with `pnpm balance:history`; this command does not rate decks or simulate games.

The thirty example styles are reference decks in the design sense: they do not restore predefined builds or card-pool grouping. Players can combine engines and invent others. Each Ascendancy is assessed with the base class and its available cards. Marginal passive power, resource efficiency and deck strength are different questions.

Grades are **estimates**, with low or low–moderate confidence. **A+/A/A−** are sub-bands of competitive strength, **B** identifies a material consistency problem and **S** a suspected outlier. A-band parity and campaign beatability are targets until tested. No real-match dataset informed these first two assessments. Baseline Arena grades preserve the earlier conversation; campaign and sub-band baseline grades are retrospective estimates authored now. The documented free-loop and trigger-scope corrections qualify the original grades.

Ascendancies unlock after clearing Tier III. Grade I–III at class level. Separate campaign progression (IV–X, XI–XVI, XVII–XX) from fight development (opening turns 1–3, extended turns 6–10). Arena uses different HP and encounter conditions; the shared rules must still work in both modes. Arena opening/extended estimates do not imply every hand or opponent is equally favorable.

## Real playtest reports

Settings → Playtest and performance reports → **Export playtest results** downloads JSON. Collection begins with this version; there is no retroactive invention of results. The device keeps its latest 1,500 observations. Desktop saves preserve the journal with the account/offline save. Browser reports stay local and are not cloud-synced. Nobody receives a report automatically. Reports contain class/Ascendancy, coarse deck quality, fight result and timing counters, campaign tier/difficulty or Arena matchup/seat, build/rules version, Ascendancy selection and run endings. They contain no names, account IDs, seeds, full decks or action logs. Arena IDs are public replay identifiers; campaign observation IDs are salted local fingerprints. These are client-observed playtests, not anti-cheat or verified server analytics.

Aggregate friends' manually shared files with:

```text
pnpm balance:report C:/path/alice.json C:/path/bob.json --out D:/Code/ShatteredRifts/.wrangler/playtest-report
```

The command writes `REPORT.md`, `samples.csv` and deduplicated `samples.json`. Relative input/output paths resolve from `tools` through the pnpm workspace script; absolute paths avoid ambiguity. It never runs bots. Keep raw player exports in ignored `.wrangler` unless intentionally publishing a reviewed aggregate.

Do not combine versions, human opponents and ghosts, unascended decks, seat order, campaign difficulty or tier bands. Arena exports can contain two seat observations of the same game: count unique game IDs separately, and never treat the two seats as independent matches. The decisive-fight win rate excludes draws and prints its denominator. Banked and abandoned runs are censored, not losses. Quality columns and raw CSV allow comparisons at similar size/upgrades/rares; they do not control for player skill, exact deck composition, Boons, matchmaker selection or survivor bias. Run endings include their actual reason. Selection counts describe players who reached Ascendancy, not all starters or offer-adjusted pick rates. Missing observations do not become 0% win rates.

`turnIndex` is the engine turn index; Arena `endedTurns` counts accepted End turn actions, including replayed history after reconnect. Neither is an interchangeable count of full rounds. Forfeits may lack a turn index. Report versions stamp the client observing the result; compare against server rules/version when investigating mixed-client playtests.

## Acceptance and next iteration

- Test each style at comparable deck size/upgrades in campaign IV–X, XI–XVI and XVII–XX, recording both wins and failures. Do not credit an Ascendancy for I–III results.
- In human Arena, test both seats against pressure, control/cleanse, companion removal and long growth decks. Keep ghost results separate. Watch Golemancer/Deathwish reliability and the upper-band Consume/Fracture/draw engines first.
- Review repeatable zero-cost draw/Mana, delayed payment, multi-hit amplification, and removal/rebuild costs before broadly raising damage. Use the costing ledger and real results.
- A useful initial warning after at least 30 relevant games per style is a decisive win rate outside 45–55%, a large seat gap, or frequent unwinnable setup losses at comparable quality. These are review signals, not statistical proof of fairness; report sample counts and matchup coverage.
- Keep campaign enemy damage curve unchanged for this pass. Tier XVII–XX should be difficult; measure whether every style has a practical damage-and-survival plan, not an identical clear time.

See [the implementation ledger](../SHARED_BALANCE_2026-11-04.md) for exact changes, resource-card costing and counterplay limits.
