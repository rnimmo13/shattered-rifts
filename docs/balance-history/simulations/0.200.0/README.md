# Shared AI check — 0.200.0 / rules83

Current policy: `synergy-2`, shared by ghosts and simulations, width8/depth10/budget900. Local only. Full method and limits: [Arena testing guide](../../../ARENA_TESTING_2026-11-05.md).

| Diagnostic | Shared AI | Previous pilot |
|---|---:|---:|
| Mirrored Arena wins | 38/60 | 22/60 |
| Vorthax wins | 17/30 | 13/30 |
| Vorthax unresolved | 1/30 | 1/30 |

Arena: each of30 Ascendancies plays its identical frozen0.199 tuned deck against itself twice, once with each policy in each seat. One seed/style; fixed1000HP and the current second-seat card-only compensation apply to both policies. No Arena draws or censored games. This tests policy differences, not inter-class balance. Vorthax: one matched seed per style with each policy, the existing full-health/+18HP/12-Boon loadout, frozen boss decks and current0.199 boss content. One unresolved attempt per policy is not a loss; wins use all attempts as denominator.17/30 is not an estimate of an optimized human player's clear rate.

The previous pilot has actual own-draw-order foreknowledge, while the new policy uses a deterministic belief sample. Its authored evaluation/fingerprint and pending-choice planning also differ. The result supports the new shared baseline without proving every individual style improved. No policy weights were tuned against these outcomes. No full-field or reward-acquisition simulation was rerun, and the old deck search is not proof of optimal synergies.

`policy-jobs.json.gz` stores all120 jobs/decks/seeds; `policy-db.json.gz` freezes content; `policy-check.jsonl.gz` stores exact outcomes. [Summary](policy-summary.json) and [archive hashes](archive-manifest.json). All120 job/outcome IDs, seeds and participants verified. Tool: `tools/src/ascendancySim/policyCheck.ts`; archived prior pilot in `legacyPilot.ts`. Reruns require this source/rules version and a fresh output label/directory; existing results are never overwritten. Future training now covers ten opponent styles in both seats rather than two, snapshots content and stamps the AI version before execution.

Learning remains a reviewed workflow: inspect a bad decision, preserve it as a regression fixture, improve the shared policy, compare on separate seeds/decks, then append a new assessment. More simulations alone do not change the policy. Live human alpha/beta evidence will be collected separately by the private Arena report.

`candidates.json` carries forward the authored starting recipes for future training; it is not a newly optimized result set. Broad training must run before selecting new field decks. Current matched results use the exact frozen lists embedded in the archived jobs.
