# Shattered Rifts project instructions

Read `CLAUDE.md` before working on the game.

## Release approval (Robert, 2026-11-04)

- Do not push, deploy, or publish a release without Robert's explicit approval for the current changes.
- Approval to implement changes, positive feedback, and earlier release approvals do not authorize a new push or deployment.
- Implementation, testing, and packaging may proceed locally. Present the completed work for review before release approval.
- Pushing `main` automatically deploys the website. Approval must cover that deployment before pushing `main`.
- This overrides older instructions to automatically push or publish after making changes.

## Balance history

- Every future balance change must append an assessment under `docs/balance-history/`, following its README. Preserve previous snapshots and explain changed grades or corrected assumptions in the new version.
- Track all Ascendancies and representative freely mixed builds in both modes, campaign progression bands, fight opening/extended strength, setup, recovery, rare reliance and confidence.
- Distinguish estimated ratings, acceptance targets and measured playtests. Never present deterministic fixture checks as measured A-tier parity. Do not run balance simulations unless Robert requests them.

## Transparent balance patch notes (Robert, 2026-11-04)

- Every player-visible balance change must have a specific entry in `apps/web/src/app/patchNotes.ts`, with corresponding developer details in `CHANGELOG.md`. A general summary does not replace the individual changes.
- Name every affected card, Ascendancy or class. Show exact old -> new values for costs, damage, HP, scaling, thresholds and other changed numbers; distinguish base and upgraded cards when their changes differ.
- Explain changed triggers, target eligibility, limits, durations, resets, stacking and keyword/type changes in plain language. For a redesign, describe the old behavior and the replacement so players can understand how their build changes.
- State whether the change applies to Campaign, Arena or both. Explain effects on existing cards, saves or unfinished battles when relevant. Group related changes under the affected class or Ascendancy for readability.
- Update the player notes alongside the implementation and check them against the final code before release. Avoid vague statements such as "stronger summons" or "improved scaling" without the actual values and conditions.
- Keep security controls, anti-cheat implementation and deliberately hidden reward odds out of player notes; transparency about balance does not require exposing those details.
