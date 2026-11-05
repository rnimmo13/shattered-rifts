# v0.198.0 simulation review 1 — 2026-11-04

**The simulations do not substantiate the earlier all-A-band assessment.** They show severe deck-performance differences, an Arena pacing miss, and a large gap between refined and less-refined decks against Tier XX Vorthax. The earlier estimates were too optimistic. Preserve them as the prediction being tested; do not relabel these bot results as human win rates or as definitive new Ascendancy grades.

Robert requested simulations of every build in Arena and against Vorthax, comparison with the strength analysis, and proposed remedies. This experiment changes **no production balance, bot, version or deployment**. Source: `c644dfc01d74114eb23b87b199155b98c39872a4`, v0.198.0 / rules 81. There are zero new human playtest observations.

## Evidence and files

- [All 30 builds, prior grades and both deck qualities](RESULTS.md), [CSV with counts and confidence intervals](results.csv), [machine-readable summary including paired experiments](summary.json).
- [Frozen deck lists](DECKS.md), [full method and limitations](METHOD.md), [optimized matchup matrix](arena-matrix-optimized.csv), [good-deck matchup matrix](arena-matrix-good.csv).
- Main evaluation: **9,480 fights**: 3,480 Arena and 6,000 Vorthax. Each build gets 116 Arena games and 100 Vorthax attempts **per quality**. Every Arena pair plays two seeds in both seats.
- Additional executions: 1,440 training, 20 harness pilot, 660 higher-search-budget checks, 600 hero-HP sensitivity, 600 boss-stat counterfactual and 216 Blood Oath counterfactual. Total **13,016**, plus four diagnostic replays. Replays and counterfactuals are not independent evidence about unchanged live balance.
- Every job and outcome is archived losslessly as `.gz`; [archive-manifest.json](archive-manifest.json) gives uncompressed SHA-256 and sizes. Local raw copies are ignored. Tooling: `tools/src/ascendancySim/`.

“Optimized” means the best of **six tested candidates**, selected separately for each mode on training seeds, fully ordinarily upgraded. It is not an exhaustive search or proof of optimal construction. “Good” retains the core but has fewer rare duplicates, four additional useful cards and roughly half the upgrades. Good and optimized Arena decks face separate fields; their percentages cannot measure which version wins head-to-head.

## What changed relative to the prediction

All earlier Arena grades were A−/A/A+, but tuned-deck decisive win rates range from **2.6% to 99.1%**. The old blanket A-band conclusion is unsupported. These measurements concern the whole class pool, deck and pilot, not the Ascendancy passive in isolation.

| Quality | Arena games | Median rounds | Both players reached turn 10 | Loser had fewer than 5 turns | Unresolved |
|---|---:|---:|---:|---:|---:|
| Best tested | 1,740 | 5 | 9.0% | 48.5% | 3 |
| Good | 1,740 | 7 | 23.0% | 15.2% | 1 |

“Rounds” is the larger started-turn count, including lethal turns. The ten-turn check requires both players to have started ten turns. These results miss Robert's 10+ turns-per-player target substantially. Second seat wins 51.9% / 53.1% of decisive games respectively; that modest aggregate difference does not explain the deck spread. Keep the current 6× class HP / +60 second-seat HP as a working baseline while investigating burst and resource engines; do not assume another HP multiplier fixes the cause.

| Class | Revised reading of the tested builds |
|---|---|
| Knight | Marshal is an extreme Arena resource-loop outlier despite failing Vorthax. Blood Knight is strong in Arena with substantial boss upgrade dependence. Paladin's middling Arena result does not establish a viable finale plan. |
| Engineer | All three tested lists are weak in Arena and win zero boss attempts. Golemancer's 2.6% makes another reflexive HP-growth nerf especially poorly supported. Audit setup, targeting and the pilot before compensating; keep the large-machine identity. |
| Hunter | All three tested lists underperform and fail the boss. Review sustained damage, companion replacement cost and early hero protection, not only passive late scaling. |
| Trickster | Cardsharp reaches 71.6% Arena, while Trapmaster and Seer lag; all three fail Vorthax. A strong general pool does not establish boss viability for every style. |
| Assassin | Bloodletter and Bladedancer substantially outperform the Assassin path. Their boss results collapse when the deck is less refined. Pure global damage nerfs would worsen that access gap. |
| Shaman | Totemist has the most successful good boss deck, but Spiritwalker fails both benchmarks. Elementalist's boss success is highly sensitive to encounter pressure. |
| Monk | Sunwalker is strong in both optimized benchmarks; Sage has a credible optimized boss plan. Zealot lacks one in this experiment. None of the good Monk lists wins the boss. |
| Spellblade | Low Arena performance across the tested lists; only Shatterer gets boss wins. Bot valuation of class resources is a significant limitation requiring focused review. |
| Necromancer | All three are strong Arena signals, especially Soulreaper and Bonelord. They have boss wins but depend strongly on refinement. Review card engines and HP conversion before another broad passive nerf. |
| Drunkard | Gunslinger is the strongest tested Arena style; Brewmaster/Deathwish vary strongly with field quality. All three fail Vorthax. This does not support the predicted shared late-game A band. |

## How often these decks beat Vorthax

The actual Tier XX Normal encounter has **3,060 Vorthax HP, a 340-HP Rift Ward and 185% damage scaling**. Every hero begins at full base HP +18 with the same twelve Boons. No potions, Heart, accumulated max-HP farming or entry attrition are assumed. This is an isolated final fight, not a simulated campaign or reward-acquisition rate.

| Deck quality | Wins | Observed win rate | Losses | Unresolved | Builds with zero wins |
|---|---:|---:|---:|---:|---:|
| Best tested | 535 / 3,000 | **17.8%** | 2,449 | 16 | 18 / 30 |
| Good | 42 / 3,000 | **1.4%** | 2,956 | 2 | 25 / 30 |

These pooled rates weight every build equally; they are not a universal probability for an optimized player. Individual best-tested rates include Bloodletter 90%, Bladedancer 76%, Sunwalker 70%, Sage 53%, Bonelord 50%, Totemist 49%, Soulreaper 44%, Blood Knight 37%, Elementalist 32%, Shatterer 17%, Fateweaver 16% and Marshal 1%. All others have zero wins. Good lists win only as Totemist 25%, Fateweaver 8%, Bladedancer/Bloodletter/Soulreaper 3% each. Each percentage uses 100 attempts. Spiritwalker's optimized zero includes 16 unresolved fights; these are not counted as losses.

Sampling uncertainty near 50/100 is roughly ±10 percentage points. Zero of 100 is not proof a build cannot win; its Wilson upper bound is about 3.7% for this fixed deck/pilot experiment. Missing human decision quality and alternative decks are larger uncertainties than the sampling interval.

## Paired sensitivity and counterfactual experiments

These change only the experiment, never production. The HP/boss checks use the same **first ten seeds per build/quality**, so compare against their paired baseline, not the full hundred-seed percentages.

| Experiment | Best-tested boss wins, baseline → experiment | Good boss wins, baseline → experiment |
|---|---:|---:|
| +60 hero current/max HP | 60/300 → 86/300 | 3/300 → 12/300 |
| Boss-side HP ×0.75, damage ×0.85 | 60/300 → 103/300 | 3/300 → 24/300 |

The boss-stat probe also scales Rift Ward and later summoned encounter units through the existing HP/damage percentage path. Rounding yields Vorthax 2,297 HP, Ward 255 HP and 157% damage. Most improvements go to engines that already work. All Engineer and Hunter lists, Spiritwalker and Archmage still have zero best-tested wins in these probes. Ten seeds cannot certify a final tuning number. The outcome argues against shipping a blanket boss reduction as the complete solution.

Raising the bot search budget from 300 to 900 changes only 6/600 paired boss outcomes (first-side wins 63 → 61) and 1/60 Arena outcomes (27 → 28). This establishes limited sensitivity to this budget increase; it does not validate the evaluator for every mechanic.

## Proposed next changes, in priority order

1. **Fix Marshal's repeatable resource economy with compensation.** Blood Oath currently costs zero Mana and loses 3 HP (2 upgraded) for 3 Reserves, without Consume. Hilt Strike+ and Oath of Iron+ draw two, enabling repeated recycling. One inspected opening played 35 cards and dealt 410 hero damage; Soulreaper survived and won that particular fight, so this is evidence of burst, not a claimed Marshal win. Across the field Marshal wins 115/116. The isolated **Consume-only** experiment falls to **2 wins / 110 losses / 4 unresolved** in the same 116 games, and boss wins 1/100 → 0/100. Do **not** ship Consume alone or stack a passive nerf on top. Prototype a limited burst resource card together with dependable once-per-turn Reserves generation/recovery, then retune the deck and rerun both modes. The counterfactual reused frozen decks and did not retune them, so the collapse also reflects their dependence on the removed loop.
2. **Review Bonelord's card-based HP conversion, retaining growing minions.** The Drowned King commands each companion for 10 + its max HP at 1 Mana; upgraded, it is **15 + max HP at 0 Mana**. Goad grows every companion. That is a strong conversion across multiple bodies, on top of Bonelord's existing kit. Candidate to test: keep the command at 1 Mana when upgraded and/or reduce max-HP conversion to 50%, retaining uncapped HP growth and a meaningful flat payoff. These are alternatives to test separately, not a validated package. Its good boss list has no wins, so any change needs campaign retuning and replacement consistency.
3. **Reduce explosive card throughput while preserving Consume/bleed identities.** Soulreaper's 90.5% Arena result and the Bloodletter/Bladedancer results warrant reviewing Bottled Soul → Gravesoul → Restless Spirits, draw recycling and immediate repeated damage. Restless Spirits grows with previously consumed souls, and multiple copies stack; a once-per-turn full-payoff allowance with reduced subsequent triggers is a candidate. Retain Soulreaper's offensive Consume payoff. For Assassin pools, review the actual high-draw bleed/knife turn before selecting a cap. Do not blindly nerf all passive scaling or remove long-fight growth; good-deck boss results are already low.
4. **Give struggling engines reliable setup and sustained payoff.** First review the frozen lists and representative choices for Engineer, Hunter, Spiritwalker and Spellblade. Then test cheaper recovery, accessible early protection, and repeatable damage support where the deficit survives improved piloting. Make ordinary cards support the style; do not make another rare card mandatory. Preserve the distinction between swarms, giant machines, personal weapons and the other class identities.
5. **Revisit Vorthax pressure and deck-quality cliffs together.** Test reduced opening pressure / a longer setup window before reducing his entire late fight. Audit how ordinary upgrades change draw and resource efficiency, so a useful but imperfect deck still functions. Suggested acceptance targets for this defined full-health benchmark are roughly 60–75% for well-tuned builds and 25–45% for good ones, subject to Robert's preferred difficulty. These are proposed design targets, not current measurements or a promise. Recheck the strongest builds so easing setup does not make their finale automatic.

Only the Blood Oath Consume change and the two encounter-stat probes were counterfactually executed. All other remedies above are proposals requiring implementation, retuning and validation before release.

## Limits and follow-through

The existing bot does not explicitly value several important resources and investments, including Fracture, Precision, Spirit, the current totem row, new attack Auras and Ascendancy counters. Its fingerprint omits some resources/statuses, it has limited planning horizon, and search can inspect future own draws. Therefore it is not a human-equivalent pilot or a guaranteed lower bound on player skill. The six-deck search is deliberately limited. Low-performing styles need a deck/pilot audit before definitive new letter grades; the resource-loop traces and large performance spread are concrete reasons to reject confident all-A claims now.

Next pass should retune decks after each proposed rule change, retain held-out seeds and both seats, rerun all 30 styles, and collect human confirmations. Keep the old assessment unchanged and append the next measurement. The raw dataset, deck definitions and reproducible runner make this baseline usable for that comparison. Nothing in this review has been pushed, deployed or applied to the live game.

Verification: tools typecheck, scoped ESLint and three harness tests pass. The integrity check verifies all 13,016 job/outcome identities, expected build coverage, four replays against original outcomes, and byte-identical archive decompression. Production files and prior rating snapshots remain unchanged.
