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
| `docs/BALANCE.md` | Sim results (first-player advantage, starter matrix, tier model, enemy difficulty) and open balance questions |
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

## Commands
```
pnpm install
pnpm dev          # web client
pnpm test         # all tests
pnpm lint         # ESLint (engine/ai/campaign have purity rules: no Math.random, Date, DOM, node I/O)
pnpm typecheck    # tsc per package
pnpm check        # lint + typecheck + test + build
pnpm duel         # CLI duel vs AI. Flags (after --): --p1/--p2 maren|rivet|kesh|vesper, --seed X, --auto
pnpm sim          # balance sims: match | matrix | card | tiers | enemies (see docs/BALANCE.md)
pnpm test:property # 10,000 random games with invariant checks
pnpm deploy:web -- --repo OWNER/NAME   # build + publish the compiled site to GitHub Pages (see tools/src/deploy.ts)
pnpm build
```
Toolchain: Node 22, pnpm 11 (corepack), TypeScript 6.0 (see DECISIONS #39). Workspace packages export TS source.

## Current status
Design complete; campaign redesigned on 2026-10-22 to run-built decks + weekly PvP seasons (see
`docs/DECISIONS.md`). Web build = private friends beta for now. **M0, M1 and M2 done** (engine, all 74 cards + 12 signature cards, enemy decks, heuristic AI, balance sim,
10k-game property gate). First-player advantage (`docs/BALANCE.md` §1) is parked: balance waits until a playable campaign exists, even an easy one (DECISIONS #74). Starter imbalance is accepted (DECISIONS #63).
**In progress: the browser game, playable through the campaign** (DECISIONS #64–70). UI art phases (stop after each for Robert):
**Phases 1-4 done** (tokens, Pixi battlefield; hand + card frames; monsters; trap sigils + reveal). **M3 first playable duel done** (`#/play`: any Riftwalker vs any enemy deck, vs the heuristic AI). Next order (Robert, 2026-10-22): campaign loop (M4/M5) → 5 juice.
Deploy with `pnpm deploy:web -- --repo rnimmo13/shattered-rifts` (live: https://rnimmo13.github.io/shattered-rifts/).
