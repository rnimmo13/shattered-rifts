# Shattered Rifts: Agent Guide

A deep, combo-heavy, **trap-driven** card-dueling game (working title). Web campaign first (free,
Ko-fi-funded) → Steam full game ($7.99–$9.99) with PvP later. Owner: Robert.

## Read before doing anything
| Doc | What's in it |
|---|---|
| `docs/01_GAME_DESIGN.md` | Player-experience pillars, **exact duel rules**, the Chain, keywords |
| `docs/02_CARDS.md` | Realms, card data schema + **effect DSL**, balance budget, all 74 Core Set cards, starter decks |
| `docs/03_CAMPAIGN.md` | Characters, run structure (5 stages), Resolve, Bank/Continue, Rift Tiers, Wardens, Boons, Vault & seasons |
| `docs/DECISIONS.md` | Every design decision and rules clarification, with dates and reasons |
| `docs/04_VISUALS_AND_ANIMATION.md` | Card frame spec, tokens, board layout, **animation catalog** with timings |
| `docs/05_ART_PIPELINE.md` | AI art style bible, prompts, files, per-card art briefs |
| `docs/06_WEB_PLATFORM.md` | Ko-fi donations, supporter codes, roadmap page, saves, hosting |
| `docs/07_TECH_ARCHITECTURE.md` | Stack, repo layout, engine API, testing, **milestones M0–M7** |
| `ROADMAP.md` | Player-facing roadmap |

## Golden rules
1. **The engine is pure and deterministic.** `packages/engine` has no DOM, no `Math.random`, no
   `Date`, no I/O. All randomness goes through the seeded PRNG in state. Seed + action log = identical game.
2. **Cards are data.** Behaviour lives in the effect DSL. Never special-case a card ID in engine code.
   A new behaviour = a new generic `op` + tests.
3. **The client never decides rules.** It renders `viewFor()` and animates `GameEvent`s; it only offers
   `legalActions()`.
4. **Animations follow the spec** in `04_…` (durations, beats, easing, speed setting). Gameplay never
   waits on animation state.
5. **Tests are part of the feature.** Every card gets a scenario test; every rule gets a rules test;
   property tests stay green. No milestone is done with red tests.
6. **Original IP only.** No Yu-Gi-Oh!/Konami (or any franchise) names, terms of art, card frame look,
   or text. Mechanics like monsters/spells/traps/chains are fine; their specific trade dress is not.
7. **Respect the pillars** (`01_GAME_DESIGN.md §2`). No pay-to-win, ever.

## Working agreements
- Work milestone by milestone (`07_TECH_ARCHITECTURE.md §6`). At the end of each, summarise what's
  playable, what's next, and any design questions.
- **Design doc conflicts or gaps:** pick the simplest option that's consistent with the docs, log it in
  `docs/DECISIONS.md` (date, question, decision, why), and flag it in your summary. Ask Robert before any
  change to the core rules, the economy or monetisation.
- Small, frequent commits with clear messages. Keep `CHANGELOG.md` updated for player-visible changes.
- When balance numbers change, update `02_CARDS.md` so the docs stay the source of truth.
- Windows dev machine (VS Code terminal). Use cross-platform scripts (no bash-only syntax in npm scripts).

## Commands (fill in as they're created)
```
pnpm install
pnpm dev          # web client
pnpm test         # all tests
pnpm duel         # CLI duel vs AI (M1+)
pnpm sim          # balance simulation (M2+)
pnpm build
```

## Current status
Design complete; campaign redesigned on 2026-10-22 to run-built decks + weekly PvP seasons (see
`docs/DECISIONS.md`). Web build = private friends beta for now. **Next: M0 (setup) → M1 (engine core + CLI duel).**
