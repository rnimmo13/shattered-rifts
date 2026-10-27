# Shattered Rifts: Agent Guide

A deep, combo-heavy, **trap-driven** card-dueling game (working title). Web campaign first (free,
Ko-fi-funded) → Steam full game ($7.99–$9.99) with PvP later. Owner: Robert.

## Read before doing anything
| Doc | What's in it |
|---|---|
| `docs/08_COMBAT_V2.md` | **The current game**: Slay-the-Spire-style combat (Mana, intents, Barrier, allies, Traps), PvP variant, milestones C0-C6 |
| `docs/01_GAME_DESIGN.md` | LEGACY (old duel rules: Essence, slots, the Chain). Pillars in §2 still apply; the rules do not |
| `docs/02_CARDS.md` | LEGACY card list and DSL for the old engine; realms and flavour still apply. Real data: `packages/content/src/v2` |
| `docs/03_CAMPAIGN.md` | Characters, run structure (3 stages), Resolve, Bank/Continue, Rift Tiers, Wardens, Boons, Vault & seasons |
| `docs/09_ROSTER.md` | **The Riftwalkers**: pool rules (3 build paths, shared toolkit, owned signatures), build paths per character, traits, engine pieces. `10_CARD_LIST.md` is the generated card list (`pnpm cardlist`) |
| `docs/11_PVP.md` | PvP: how a match works, the Cloudflare server (`apps/server`), running and deploying it |
| `docs/12_STEAM_READINESS.md` | Steam checklist: shell, accounts, verified runs, achievements, disclosures, store page (plan only, nothing built) |
| `docs/13_PROPOSALS.md` | Designs waiting on Robert's review, ideas kept for later, ideas decided against (check before proposing features) |
| `docs/DECISIONS.md` | Every design decision and rules clarification, with dates and reasons |
| `docs/BALANCE.md` | Sim results (first-player advantage, starter matrix, tier model, enemy difficulty) and open balance questions |
| `docs/04_VISUALS_AND_ANIMATION.md` | Card frame spec, tokens, board layout, **animation catalog** with timings |
| `docs/05_ART_PIPELINE.md` | AI art style bible, prompts, files, per-card art briefs |
| `docs/06_WEB_PLATFORM.md` | Ko-fi donations, supporter codes, roadmap page, saves, hosting |
| `docs/07_TECH_ARCHITECTURE.md` | Stack, repo layout, engine API, testing, **milestones M0–M7** |
| `ROADMAP.md` | Player-facing roadmap |

**Riftwalker ids are class names** (knight, engineer, hunter, trapper, assassin, totemist, barbarian, spellblade, necromancer, drunkard; DECISIONS #190). Never use a character's display name as an id; old ids are read through `canonicalHero`.

## Golden rules
1. **The engine is pure and deterministic.** `packages/combat` has no DOM, no `Math.random`, no
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
pnpm lint         # ESLint (combat/content/campaign have purity rules: no Math.random, Date, DOM, node I/O)
pnpm typecheck    # tsc per package
pnpm check        # lint + typecheck + test + build
pnpm fight        # CLI fight on the sample ruleset (--hero knight|tinker, --enemies slime,cultist,summoner,warden, --seed X, --auto)
pnpm sim          # Combat v2 balance sim: starter decks (+ --draft N random reward cards) vs every encounter (see docs/BALANCE.md)
pnpm deploy:web -- --repo OWNER/NAME   # build + publish the compiled site to GitHub Pages (see tools/src/deploy.ts)
pnpm build
pnpm pvp:dev      # the PvP server locally (wrangler dev, ws://127.0.0.1:8787); `pnpm pvpsmoke` plays bot matches against it
```
Toolchain: Node 22, pnpm 11 (corepack), TypeScript 6.0 (see DECISIONS #39). Workspace packages export TS source.

## Current status
**Combat v2 (Slay-the-Spire-style) replaced the old duel on 2026-10-23** (DECISIONS #86-90, design in `docs/08_COMBAT_V2.md`).
**Roster of 9 (2026-10-23, DECISIONS #95-105; Mire added with Doom, tier-3 mechanics, tips and a Learn page):** Maren, Rivet, Kesh, Vesper + Quill (Sleeve Knives/Seared/discard), Ilvane (totems), Sehra (stances), Obsidia (id `spellblade`; Arcana/Sharpen), Mire (Doom/Thralls/Ashes); names are original, see DECISIONS #99; pools belong to a character (`CardDef.hero`), ~35-40 cards in three lanes each; engine gained choices (`pending`/`pick`), scaling amounts, Auras (`power` op) as triggers, totems (`channel`/`evoke` ops), stances, Arcana (`stars` op), sharpen (`forge` op). Next: balance, art for the new four, enemy counterparts, stretch characters Cinder and Mire.
Done: **C1** engine (`packages/combat`: pure, seeded, events, intents, allies, Traps, tiers, PvP mode, greedy bot) ·
**C2** content (`packages/content/src/v2`: 4 Riftwalkers, ~80 cards with "+" upgrades, 12 companions, 26 encounters incl. Wardens and
Vorthax) · **C3** the side-to-side fight screen (`apps/web/src/fight`, route `#/fight`) · **C4** campaign Run v2 (`packages/campaign`,
route `#/run`: map, HP carries between fights, rewards, shrine rest/upgrade/remove, merchant, event, Resolve, Bank/Continue) and the old
Essence/slot/chain engine, AI and UI were deleted. Next: **C5** (more enemies/Boons/Warden signature cards/upgrade polish/art) and **C6** (PvP on the same
engine). Balance is a first pass (`pnpm sim`, docs/BALANCE.md); first-player advantage is a PvP question for C6.
Deploy with `pnpm deploy:web -- --repo rnimmo13/shattered-rifts` (live: https://rnimmo13.github.io/shattered-rifts/).
