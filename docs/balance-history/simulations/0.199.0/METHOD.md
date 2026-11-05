# Revision experiment method — 2026-11-05

This follows Robert's request to implement balance revisions after the v0.198.0 simulations. Local candidate: **0.199.0 / rules 82**, based on release commit `c644dfc01d74114eb23b87b199155b98c39872a4`. No push or deployment is authorized. Card/Ascendancy/boss changes are in [the exact ledger](../../../BALANCE_REVISION_2026-11-05.md); `content-diff.json` preserves the before/after definitions.

## Data isolation

The released `COMBAT_DB` was saved before edits as `baseline-db.json.gz`. Every revision run freezes its own complete database before workers start, and its jobs point to that snapshot. Combat engine rules and the production bot implementation are unchanged. This makes before/after content comparisons possible even after local source edits. The database contains Ascendancies in `ascended`, as well as cards, units, heroes and Boons.

The `pilot-audit` uses the old data with a separate tool-only evaluator. It retains the search shape (width 8, depth 10, 300 positions/action), adds explicit values for hero survival in PvE, Spirit, Keen, Might, Reserves, queued Power, totems, attack Auras and enemy Fracture, and expands the state fingerprint to distinguish buffs/resources/queues. It does not fix every pilot weakness or provide optimal human decisions. Production ghosts never import it. Audit outcomes: 600 boss fights and 60 Arena fights, paired with the earlier benchmark. No candidate is selected using its final evaluation results.

## Candidate exploration and deck tuning

- `candidate-a`: 600 boss attempts (first ten seeds per build/quality), plus 60 sampled optimized Arena games, using the original frozen decks. This tests the first resource/protection revision and a gentler Vorthax opening.
- `candidate-b`: the final content candidate, **600 boss + 3,480 Arena** games on the original frozen lists and original seeds. This isolates content changes, separately from deck retuning.
- `train-b300`: **2,400** fights on final content: 30 Ascendancies × 10 variants × (4 boss + 4 Arena training games). The original six variants are supplemented with four authored support-package variants, replacing four shared support cards and optionally thinning duplicate core cards. Packages favor protection or resource recovery. Copy limits and own-class legality are validated. At least one of the starting core cards remains; these are representative styles, not an exhaustive deck search.
- Arena and boss selection are independent. Training scoring, tie-breaking and good-deck construction follow the [previous method](../0.198.0/METHOD.md). `selection.json` preserves every score, and `variants.json` every training list. The frozen final lists are in `decks.json` / `DECKS.md`.

“Optimized” means best tested training candidate, fully ordinarily upgraded. “Good” retains the core, replaces up to two rare duplicates, adds four useful fallback cards and upgrades approximately half the deck. It does not mean every reasonable human deck or a randomly generated draft. Both qualities have separate Arena fields.

## Final evaluation

**6,480 games:**

- 3,000 Vorthax attempts: 50 seeds × 30 builds × 2 qualities. Seeds are `holdout-boss-50` through `holdout-boss-99`, reserved from this revision's candidate experiments and deck selection. The old release's results on those exact seeds form the boss comparison. Their earlier aggregate benchmark was already known; these are not a wholly unseen historical dataset.
- 3,480 Arena games: 435 unordered pairs × 2 seeds × both seats × 2 qualities. Every build gets 116 games per quality, four against each other Ascendancy, with no mirrors. Final suffixes 2/3 are new shuffle seeds, distinct from candidate-b's 0/1 and all deck-training seeds. The release comparison uses its 0/1 seeds, so it is a field comparison rather than a paired shuffle comparison.

Final comparison combines changed content **and retuned lists**. Do not attribute the whole gain to passive changes. Frozen candidate-b results separately measure content-only effects on unchanged recipes. Good/optimized groups face different-quality fields; a higher good-field percentage is not a head-to-head claim about the two versions.

Boss setup: actual Tier XX Normal `duelPlan`, full hero HP at base +18, same twelve Boons as the first experiment, no Heart, potions, accumulated max-HP farming or entry attrition. Vorthax now has 2,550 HP, Rift Ward 128, Rift Shard 102, at the unchanged 850% HP / 185% damage tier multipliers. The engine tier remains the plan's value of 1; multiplying it by campaign tier 20 would double-apply progression and is not done. Phase behavior, Omens and the finale's exemption from extra Omen phase rises remain real engine behavior.

Arena setup remains 6× class HP and +60 second-seat HP, no campaign Boons/HP. No targeting or clocks changed. The final evaluation uses the released pilot, not the review pilot, so evaluator changes cannot masquerade as a balance improvement.

The runner still censors at 3,000 actions or after 40 own turns. Censored outcomes are not losses. Arena decisive percentages exclude unresolved/drawn games; boss success percentages count wins among all attempts. A “round” is the larger started-turn count; the pacing check requires both players to start ten turns. CPU seconds do not model a human's 75-second turn or 20-minute match clock.

At 50 boss attempts, sampling uncertainty near 50% is approximately ±13 percentage points (95% Wilson). Zero of 50 has an upper bound around 7.1% for the fixed experiment, not proof of impossibility. Arena sampling is structured by opponent and paired seats; Wilson intervals are descriptive. Bot blind spots, narrow recipe coverage, fixed Boons and acquisition assumptions remain more important limitations. No new human playtests are included.

## Reproduction

Use the pinned Node/pnpm environment and the corresponding source revision. Do not rerun a historical experiment against later combat rules. The runner rejects an existing output label rather than overwrite an experiment.

```text
pnpm --filter @sr/tools exec tsx src/ascendancySim/revision.ts --label pilot-audit --data baseline --pilot review --workers 10
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode train --dir docs/balance-history/simulations/0.199.0 --broader yes --workers 8
node tools/src/ascendancySim/select.mjs docs/balance-history/simulations/0.199.0
pnpm --filter @sr/tools exec tsx src/ascendancySim/revision.ts --label final --mode evaluate --seed-start 50 --seeds 100 --arena-seed-offset 2 --decks docs/balance-history/simulations/0.199.0/decks.json --workers 16
node tools/src/ascendancySim/revisionReport.mjs
```

An additional post-hoc Golemancer probe replaces two Static Field+ with two Bulwark Frame+ in the selected Arena deck, keeping the other cards and the final field's 116 optimized matchups/seeds. It is excluded from deck selection and the main table. Generate its lists with `node tools/src/ascendancySim/golemProbe.mjs`, then run `revision.ts --label golem-probe --mode evaluate --only-mode arena --only-quality optimized --focus engineer:golemancer --arena-seed-offset 2 --decks docs/balance-history/simulations/0.199.0/golem-probe-decks.json`. Wins change 1/116 → 2/116; this single substitution does not establish human strength.

The report verifies all 14,396 job/outcome identities and roster counts, including that probe, then stores exact gzip archives and SHA-256 hashes. Raw local JSONL/job JSON are ignored; compressed copies are versioned. The report accepts either form. Decompress training JSONL/job JSON before rerunning selection/resuming training. `candidate-a` is historical intermediate content; use its saved database to replay its jobs, not the final source definitions. No failed or unfinished run is silently counted as a completed evaluation.
