# Simulation method — v0.198.0 / rules 81

Robert explicitly requested these Arena and Vorthax simulations after release. Production source is commit `c644dfc01d74114eb23b87b199155b98c39872a4`. No game rules, cards, HP or production bot code are changed by this experiment. No release is authorized or performed for the experiment.

## What the experiment can answer

This compares 30 representative Ascendancy decks with the released deterministic engine and its existing smart bot. It tests whether the earlier static A-band assessment survives this particular benchmark. These are bot outcomes, not measured human matchups, real campaign completion rates or a proof of globally optimal deck construction. Decks are examples for comparison, not restored predefined build paths.

## Deck construction and selection

- Each Ascendancy starts with a 20-card authored list: eight shared class support cards and twelve cards supporting its style. Own-class reward/starter legality, shared base/upgraded copy limits and Aura limits are checked before execution. There are no foreign-class cards, Ancestrals, engravings or sanctification.
- Six variants are tested: the starting list, two extra defense/cycling replacements, a 16-card trimmed list, two mitigation replacements, four mitigation replacements, and four common support replacements. At least one of every original core card remains. Mitigation variants may contain 18–20 cards when adding another Aura would exceed its limit.
- Each candidate receives four Vorthax training seeds and four Arena training games: two opponent classes in both seats. Arena opponents are baseline candidates at roster offsets seven and thirteen. This is a small, bounded tuning exercise, not exhaustive deck optimization.
- Arena and Vorthax independently select their best training candidate. The primary score is wins, with draws/unresolved games worth half in training; small HP/progress tie-breakers select among equal win counts. Ties otherwise prefer the earlier candidate. Evaluation wins never feed deck selection.
- “Optimized” in filenames means **best tested candidate for that mode**, with every ordinary upgrade available applied. It does not mean an unbeatable or mathematically optimal deck.
- “Good” versions retain that core, replace up to two rare duplicates while keeping at least one copy of each rare, add four useful class fallback cards, and upgrade roughly half the slots, prioritizing core cards. Fallback additions respect copy limits; ordinary Defend/Strike are last fallbacks. Old Twelve Gauge has no ordinary upgrade. These are controlled less-refined decks, not random bad drafts or simulated reward acquisition.
- Both versions start from full HP. Good/optimized Arena groups play separate equal-quality fields. A higher percentage in the good field does not establish that a deck beats its own optimized version.

Frozen lists and exact selected variants: [DECKS.md](DECKS.md), [decks.json](decks.json), [candidates.json](candidates.json), [selection.json](selection.json). Card metadata is frozen in card-reference.json.

## Vorthax

The main test is **Tier XX, Normal**, using the real campaign `duelPlan`, its encounter units, tier Omens, starting statuses and phase behavior. Vorthax starts at **3,060 HP**, with a **340-HP Rift Ward**; baseline damage scaling is **185%**. The finale exemption from additional Omen phase rises is preserved. No obsolete stage multiplier, ghost or Arena HP is used.

Each build/quality receives **100 independent held-out fight seeds**, shared between qualities for paired comparisons: 30 × 2 × 100 = **6,000 boss fights**. Seeds are distinct from training. The 12 Boons are Iron Sigil, Idol of Might, Ember Lamp, Rift Satchel, Crystal Heart, Vigor Wick, Thorn Charm, Hunter's Lens, Aegis of Ages, Hex Lantern, Gilded Crown and Healing Vial. Their max-HP bonuses total **18**; post-fight healing has no value inside this isolated full-HP fight.

No Heart, potion, persistent max-HP farming bonus, incoming attrition or full-run acquisition process is assumed. The results therefore answer “how often this exact loadout wins this boss fight,” not “how often a player reaches and clears Tier XX.” A separate paired 10-seed-per-build/quality test adds **60 hero max/current HP**, with everything else fixed. That is a sensitivity test, not an assertion that every campaign earns exactly 60 extra HP.

## Arena

Each quality gets the full 30-build round robin: 435 unordered pairs × two shuffle seeds × both seat orders = **1,740 games**. Both qualities total **3,480 games**. Every build has **116 games per quality**, four against each of its 29 opponents; no mirrors.

Use the released **6× class HP and +60 second-seat HP**, no Boons, no campaign HP gains, and unchanged hero targeting/Taunt rules. Each seat uses the same pilot configuration. Different builds use their own tuned lists; this measures complete deck-plus-Ascendancy performance and does not isolate passive strength.

Arena win percentages in the main table exclude unresolved games and engine draws. W-L-unresolved counts remain visible, with draws and all-game percentages in CSV/JSON. High unresolved rates make decisive win percentages selective; examine the counts before ranking a control deck.

## Pilot, pacing and limits

The released smart bot searches with width 8, depth 10 and a budget of **300 positions per action**. It uses the existing greedy choice handler for pending selections. The existing bot ends a turn after 60 played cards. Each experiment stops at 3,000 actions or after 40 own turns; an unfinished fight is **censored/unresolved**, never relabelled as a loss, draw or time-limit victory.

Both players' started turns are recorded, including lethal turns. “Rounds” in the report is the larger of the two started-turn counts. The 10+ target check requires both players to have started at least ten turns. CPU execution time is not a player's thinking time: this experiment does **not** simulate the 20-minute Arena clock, 75-second turn clock, disconnects or timeout adjudication.

A paired sensitivity test raises the search budget to **900** on the first ten boss seeds of every build/quality (600 fights), plus 60 selected optimized Arena games covering all builds in both seats. This checks search-budget sensitivity but does not fix the evaluator's blind spots. It is not a retuning pass.

Important pilot limits: the evaluator does not explicitly value Fracture, Precision, Spirit, the current totem row, new attack Auras or Ascendancy progression counters. It can see immediate damage, end-turn effects and some consequences through lookahead, but may misprice investments. Its state fingerprint also omits several statuses/resources. It does not plan a complete boss fight, and can examine its own future draws through engine search; it is neither a uniformly weaker human nor a human-information-equivalent optimal player. Increasing search budget alone cannot remove these limitations. Low results should trigger deck/decision review before indiscriminate buffs.

## Statistical interpretation and reproduction

All main seeds are held out from tuning. The report includes 95% Wilson intervals. At 100 trials, a result near 50% has roughly ±10 percentage points of sampling uncertainty. Zero wins in 100 is not proof of impossibility (Wilson upper bound about 3.7% for this fixed experiment). Arena intervals are descriptive: opponent mixtures and paired seats/seeds create structure that a simple binomial interval does not capture. Four games per specific matchup are insufficient for precise matchup claims. No player-population weighting or human win-rate inference is made.

From the repository root, with the pinned Node/pnpm toolchain:

```text
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode train --budget 300 --workers 8
node tools/src/ascendancySim/select.mjs
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode evaluate --budget 300 --workers 12
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode pilotcheck --budget 900 --seeds 10 --workers 4
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode sensitivity --budget 300 --seeds 10 --workers 4
node tools/src/ascendancySim/report.mjs
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode bossprobe --budget 300 --seeds 10 --workers 4
pnpm --filter @sr/tools exec tsx src/ascendancySim/run.ts --mode oathprobe --budget 300 --workers 4
node tools/src/ascendancySim/report.mjs
node tools/src/ascendancySim/verify.mjs --archive
```

The runner saves every job specification and outcome, supports resumption from complete JSONL records, and rejects a changed job specification for an existing output name. Raw files are archived as `.gz`; decompress all job JSON and outcome JSONL archives into this folder before resuming a run, rerunning selection or tracing. The report/verification readers accept raw or gzipped results directly. Reproduction must use this release's combat/content/campaign source; later rules are a new experiment. Three harness tests verify deterministic replay, Arena HP, the actual Tier XX boss/hero HP setup, and isolation of experimental card overrides from the released database.

The additional `bossprobe` changes only the experiment's encounter HP/damage percentages by factors 0.75/0.85. The `oathprobe` overlays Consume on base/upgraded Blood Oath in a private database copy for Marshal's original 116 optimized Arena games and 100 boss seeds; decks are not retuned after the override. These are diagnostic counterfactuals, not approved or shipped balance changes. See README.md and summary.json for paired results and interpretation.
