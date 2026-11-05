# Shattered Rifts project instructions

Read `CLAUDE.md` before working on the game.

## Release approval (Robert, 2026-11-04)

- Do not push, deploy, or publish a release without Robert's explicit approval for the current changes.
- Approval to implement changes, positive feedback, and earlier release approvals do not authorize a new push or deployment.
- Implementation, testing, and packaging may proceed locally. Present the completed work for review before release approval.
- Pushing `main` automatically deploys the website. Approval must cover that deployment before pushing `main`.
- This overrides older instructions to automatically push or publish after making changes.

## Balance history

- For future balance reviews, inspect available real-player Arena exports/shared match JSON and private Campaign snapshots before relying on estimated grades. Collection, commands and retention are documented in `docs/ARENA_TESTING_2026-11-05.md`. If no real observations are available, say so; synthetic fixtures and bot games are not player data. Preserve raw exports in separate testing-phase/date folders. Cite the games/positions behind proposed fixes, distinguish inferred strategy from optional player intent notes, and treat Campaign snapshots as client-observed save positions rather than independent matches or complete reward histories.

- Every future balance change must append an assessment under `docs/balance-history/`, following its README. Preserve previous snapshots and explain changed grades or corrected assumptions in the new version.
- Track all Ascendancies and representative freely mixed builds in both modes, campaign progression bands, fight opening/extended strength, setup, recovery, rare reliance and confidence.
- Distinguish estimated ratings, acceptance targets and measured playtests. Never present deterministic fixture checks as measured A-tier parity. Do not run balance simulations unless Robert requests them.
- Arena pacing target: Robert wants fights in the 10+ turn range. Working interpretation is turns per player, following the discussion; see `docs/BALANCE.md` and decision #599. Future assessments must examine growth beyond turn ten, not assume the existing turns 6-10 grades establish long-fight parity. No HP change is authorized by that target alone.

## Transparent balance patch notes (Robert, 2026-11-04)

- **Readable changes (Robert, 2026-11-05):** prefer structured `PatchItem` entries with a card/Ascendancy title, existing card art or class icon, and short labelled before → after rows. Colour the new value green for a buff and red for a nerf; also show a text label so colour is not the only signal. Judge benefit semantically: lower Mana cost is a buff, not a nerf. Neutral/system changes stay neutral. Separate base/upgraded numbers. Use prose for trigger, stacking, reset or migration details that the numbers cannot explain; avoid repeating the rows in paragraphs. Do not recolour old prose heuristically or omit exact changes for brevity.

- **Current balance direction (Robert, 2026-11-05):** Arena first; all classes/ghosts start at 1,000 HP, both seats equal. Second seat receives only its existing +1 first-turn card, no bonus HP/Mana. Game limit30 minutes; both players passing three consecutive own turns without playing a card draws the game. Compare practical damage, survival, setup, consistency and ceiling, not equal raw DPS. Vorthax ideal optimized-deck clear target is approximately50% or somewhat above, not the previously proposed60–75% default. Treat bot results as conditional evidence. Shared ghost/simulation policy must be versioned; simulations do not automatically train it or certify optimal decks. Preserve human/ghost, rules, HP, seat and AI-version separation in reports.

- Every player-visible balance change must have a specific entry in `apps/web/src/app/patchNotes.ts`, with corresponding developer details in `CHANGELOG.md`. A general summary does not replace the individual changes.
- Name every affected card, Ascendancy or class. Show exact old -> new values for costs, damage, HP, scaling, thresholds and other changed numbers; distinguish base and upgraded cards when their changes differ.
- Explain changed triggers, target eligibility, limits, durations, resets, stacking and keyword/type changes in plain language. For a redesign, describe the old behavior and the replacement so players can understand how their build changes.
- State whether the change applies to Campaign, Arena or both. Explain effects on existing cards, saves or unfinished battles when relevant. Group related changes under the affected class or Ascendancy for readability.
- Update the player notes alongside the implementation and check them against the final code before release. Avoid vague statements such as "stronger summons" or "improved scaling" without the actual values and conditions.
- Keep security controls, anti-cheat implementation and deliberately hidden reward odds out of player notes; transparency about balance does not require exposing those details.
