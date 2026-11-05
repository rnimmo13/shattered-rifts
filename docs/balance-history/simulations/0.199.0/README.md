# Local balance revision: v0.199.0 / rules 82

Implemented locally on 2026-11-05. **Not pushed or deployed.** This is a tested revision candidate, not an assertion that the roster is balanced. The final evaluation still contradicts all-A parity and the ten-own-turn Arena goal.

- [All 30 before/after build results](RESULTS.md), [counts and intervals](results.csv), [complete summary](summary.json).
- [Exact card, Ascendancy and Vorthax changes](../../../BALANCE_REVISION_2026-11-05.md), [versioned assessment](../../0.199.0.md).
- [Method and limitations](METHOD.md), [frozen deck lists](DECKS.md), [data archive hashes](archive-manifest.json).

## What improved, and what did not

| Final benchmark | Released baseline | Local revision |
|---|---:|---:|
| Tuned Vorthax wins, same 50 seeds/build | 259/1,500 (17.3%) | 713/1,500 (47.5%) |
| Good Vorthax wins, same 50 seeds/build | 22/1,500 (1.5%) | 283/1,500 (18.9%) |
| Tuned Arena median rounds | 5 | 5 |
| Good Arena median rounds | 7 | 7 |
| Tuned Arena: both players started turn ten | 9.0% | 7.6% |
| Good Arena: both players started turn ten | 23.0% | 19.5% |

Each Arena field contains 1,740 games, and each build appears in 116 games per quality. Each boss build has 50 attempts per quality. The final comparison includes both revised rules and retuned decks; Arena uses new seeds. It does not isolate the effect of each individual buff or nerf. The baseline boss percentages differ slightly from the previous report's 100-seed results because this comparison uses only matching seeds 50–99.

Boss unresolved attempts increased from 10/2 to 53/65 for tuned/good decks. They remain in the attempt denominator but are **not losses**. Arena has 8/4 unresolved games, excluded from decisive percentages and pacing. Trapmaster's tuned boss sample is 50 unresolved, not 50 deaths; its stalemate deserves separate attention.

“Tuned/optimized” means best of ten authored candidates on a small training sample, not a globally optimized deck. “Good” means the defined less-refined counterpart. These are bot/deck results, not predictions of a person's win rate, Ascendancy-only strength or a full campaign clear rate. Early/deep campaign and human matchups remain untested.

## Readings that changed

- **Marshal:** 99.1% → 74.6% tuned Arena. The original frozen list falls to 51.8% on the revised content, but retuning restores substantial strength. Limiting Blood Oath removes a concrete recycling problem without destroying the style; this does not establish that its replacement economy is now fair.
- **Engineer:** Swarmwright improves 24.1% → 37.9% Arena and 0% → 52% boss. Artillerist improves 12.9% → 24.1% Arena but wins only 1/50 boss attempts. Golemancer gets 18/50 boss wins but remains 1/116 in tuned Arena. Keep giant-machine growth intact; additional raw max HP is poorly justified by these results.
- **Hunter:** Beastmaster gets 18/50 boss wins but remains weak in Arena. Reaver and Predator still have no boss clears. The new protection and Might are not a complete remedy for this class's damage/survival plan.
- **Shaman/Spellblade:** Spiritwalker improves from no boss wins to 19/50, yet remains weak in Arena. Archmage improves in Arena but barely clears the boss. Shatterer reaches 46.6% tuned Arena and 50/50 boss wins: boss difficulty and competitive strength cannot be inferred from each other.
- **Upper Arena outliers:** Bloodletter 96.6%, Blood Knight 92.2%, Bladedancer 88.8%, Soulreaper 82.8%, Bonelord 78.4%, Cardsharp 77.6%, Fateweaver 76.7%, Marshal 74.6%. Slowing Bloodburst alone did not control Bloodletter's complete engine. The increase in its relative win rate does not prove that increasing its Mana cost made the card stronger.
- **Quality cliffs:** Paladin clears 62% tuned / 0% good; Bonelord 80% / 0%; Spiritwalker 38% / 0%; Sunwalker 88% / 6%. Ordinary access to the engine and recovery matter as much as its ideal ceiling. Conversely, some good Arena lists score above tuned lists in their separate opponent fields; this is not a head-to-head superiority claim.
- **Finale overshoot:** Blood Knight, Bloodletter, Elementalist and Shatterer win 50/50 tuned boss attempts; Totemist wins 48/50. These are reasons to inspect their bypass/burst interactions before reducing Vorthax globally again. Fifty wins is not a guarantee or proof the encounter is trivial for humans.

## Golemancer deck diagnostic

The small Arena training sample chose two Static Field+ and no Bulwark Frame. A post-hoc probe replaces those two cards with two Bulwark Frame+, leaving the other 18 cards, all opponents, seats and seeds unchanged. Wins move from **1/116 to 2/116**. That substitution alone does not explain or fix the poor result. It is excluded from the main evaluation and was not used to retroactively choose a more flattering deck. Its jobs, data snapshot and results are archived as `golem-probe-*`.

The probe does not exhaust Golemancer construction or prove human weakness. Longer-horizon piloting, companion removal, direct hero pressure, drawing protection at the right time and replacement cost still need matchup-level examination. The first pass's isolated 160-HP anecdote cannot establish competitive strength either.

## Next balance priorities

These are **unimplemented next investigations**, not hidden additional changes in this candidate:

1. Trace Bloodletter/Blood Knight/Bladedancer's decisive turns and cap the demonstrated repeatable amplification, rather than repeatedly raising a finisher's cost. Inspect repeated Bleed ticks, knife recycling, HP-payment-to-Might/damage and draw/Mana chains. Preserve meaningful first uses and growth across turns. Recheck good campaign decks after each limit.
2. Audit the weak engines' card sequencing and legal construction against pressure, summon removal and control. Engineer weapons, Hunter, Golemancer, Spiritwalker and Archmage need accessible damage plus survival. Avoid adding another mandatory rare or enough passive Barrier to force stalemates. The review pilot's limited improvements do not establish that the remaining bot results are human-equivalent.
3. Widen Arena training opponents before treating selected recipes as optimized. Current selection uses only two opponent styles in both seats; held-out full-field results reveal large training failures. Do not optimize to the final evaluation seeds.
4. Address Vorthax's remaining clear-rate spread through build engines and specific encounter interactions. The revised opening helps setup; a further blanket HP/damage reduction would also help the already near-perfect decks. Diagnose Trapmaster's action/turn-limit stalls separately from genuine deaths.
5. Recheck ten-plus-turn pacing after the burst revisions. Current hero HP remains the baseline. Five/seven median rounds and a lower turn-ten share mean this candidate has **not** solved the requested Arena duration; a longer clock alone cannot do so.

All 30 assessments retain historical projections and now use descriptive review signals rather than unsupported A grades. Their progression/fight subgrades are explicitly untested where this isolated experiment supplies no evidence. Frozen data and previous snapshots are preserved.

## Verification

14,396 experiment executions: 660 pilot audit, 660 candidate A, 4,080 candidate B, 2,400 training, 6,480 final, and 116 post-hoc Golemancer probes. Training, repeated seeds and diagnostic executions are not independent final-match evidence. Every outcome is checked against its frozen job; lossless archives and hashes preserve the data. Four harness tests include loading the released database after source changes.

Production verification: 3,781 tests passed before the extra harness replay test was added; the four-test harness then passed separately. Full repository lint, typecheck and build passed. Two existing React-refresh lint warnings remain. New combat scenarios verify the exact costs, resource limits, hero protection, soul triggers and Vorthax opening; they establish behavior, not balance parity.
