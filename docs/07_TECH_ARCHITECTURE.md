# Shattered Rifts: Technical Architecture & Build Plan

## 1. Stack
| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) everywhere | One language for engine, web, server, desktop |
| Monorepo | **pnpm workspaces** | Simple, fast; packages share types |
| Rules engine | Plain TS, **zero runtime dependencies** | Pure, deterministic, runs in browser/server/workers |
| Validation | **zod** | Card/enemy/save schemas |
| Web shell | **Vite + React** | Menus, Vault, Codex, map, PvP lobby, settings |
| Duel board | **PixiJS v8** (WebGL/WebGPU) | Smooth 2D rendering, shaders, particles |
| Animation | **GSAP** (+ PixiPlugin) | Timelines, easing, sequencing: the backbone of the AnimationDirector |
| Audio | **Howler.js** | Sprites, fades, music stems |
| App state | **Zustand** | Meta/game-shell state (not engine state) |
| Tests | **Vitest** (+ fast-check for property tests) | Fast and TS-native |
| Desktop (later) | **Electron + steamworks.js** | Steam overlay, achievements, cloud saves |
| PvP server (later) | **Node + ws** (or Colyseus), engine authoritative | Hidden info stays server-side |

Use the current stable version of each library at setup time (check, don't assume). Node: current LTS.

## 2. Repository layout
```
ShatteredRifts/
├─ CLAUDE.md                  agent guide (read first)
├─ README.md · ROADMAP.md · CHANGELOG.md
├─ docs/                      design docs (01–07)
├─ packages/
│  ├─ engine/                 rules engine: state, actions, chain, effects interpreter, RNG, events
│  ├─ content/                cards, tokens, enemies, bosses, campaign tables + zod schemas + content tests
│  ├─ ai/                     AI players: heuristics, 1–2 ply search, personalities, boss scripts glue
│  └─ campaign/               loop/run state machine, map generation, rewards, economy (pure)
├─ apps/
│  └─ web/                    Vite + React + PixiJS game client
│     └─ src/
│        ├─ app/              routing/screens: Title, Sanctum, Map, Duel, Grimoire, Forge, Rewards, Roadmap, Settings
│        ├─ duel/             PixiJS board, AnimationDirector, VFX presets, shaders, input/targeting
│        ├─ cards/            shared card renderer (SVG frame templates → DOM and Pixi textures)
│        ├─ audio/  save/  content/ (roadmap.ts, supporters)  ui/ (shared React components)
└─ tools/                     sim runner, CLI duel, art grading, supporter codes, card PNG exporter
```
Later: `apps/desktop/` (Electron) and `apps/server/` (PvP).

## 3. Engine design (`packages/engine`)

### 3.1 API (the whole surface)
```ts
createGame(cfg: GameConfig): GameState                         // seed, decks, essence, boss script, rule overrides
legalActions(s: GameState, player: PlayerId): Action[]
applyAction(s: GameState, a: Action): { state: GameState; events: GameEvent[] }  // pure: clones the input
viewFor(s: GameState, player: PlayerId): PlayerView            // hides opponent hand/deck/face-down cards
eventsFor(events: GameEvent[], player: PlayerId): GameEvent[]  // same redaction for the event stream
```
These are returned by `createEngine(cardDb)` so the engine stays dependency-free and the state stays plain JSON
(DECISIONS.md #37).
- **State** is plain JSON (serialisable, structured-cloneable). Card *instances* have stable
  `instanceId`s; definitions are looked up by `cardId` from `content`.
- **Every decision is a `pending` prompt** on the state: `mulligan | chooseTarget | responseWindow |
  optionalEffect | scry | chooseFromList`. Actions answer prompts. One uniform loop for humans, AI and network.
- **Randomness** only through the seeded PRNG stored in state (xoshiro128**). No `Math.random`,
  no `Date`. The same seed + action log always gives the same game. That's what makes saves, replays,
  bug reports and PvP verification work.
- **Effects interpreter:** walks the card's `abilities` (DSL in `02_CARDS.md`). New behaviour = new
  generic `op` with tests, never `if (card.id === ...)`.
- **Chain:** an explicit stack of links + a passive trigger queue, exactly per `01_GAME_DESIGN.md §3.6`.
  Safety caps: chain depth 64, trigger queue 256 per action. Hitting a cap is a failing test, not a silent stop.
- **Static modifiers** (auras, cost changes) are recomputed through a layered stats function
  (`base → permanent buffs → statics → temporary`), never stored as mutated numbers.
- **Events** are the only output the client animates from. A discriminated union, roughly:
  `turnStarted, aetherChanged, resonanceChanged, cardDrawn, cardBurned, cardPlayed, unitSummoned,
  tokenCreated, trapSet, ambushSet, flipped, attackDeclared, responseWindowOpened, chainLinkAdded,
  chainLinkResolved, negated, fizzled, damageDealt, healed, shieldPopped, statsChanged, keywordGranted,
  statusApplied, unitDestroyed, unitBanished, returnedToHand, controlChanged, evolved, assembled,
  devoured, relicChargeChanged, relicBroken, riftChanged, discarded, omenTicked, omenFired,
  bossPhaseChanged, dialogue, gameOver`.

### 3.2 Bosses
Boss signature mechanics, Omens and phases are **boss scripts** in `content/bosses/*.ts`: declarative
hooks (`onTurnStart`, `onEvent`, `onEssenceBelow`) that return engine effects. They're deterministic and use
the engine RNG. Omens are visible state (`omens: [{id, countdown, veiled}]`).

### 3.3 AI (`packages/ai`)
- Inputs: `viewFor(state, aiPlayer)` only. **No peeking.** For search, it **determinises** hidden
  info by sampling plausible hands/sets from the unseen card pool.
- Policy: enumerate legal actions → simulate with `applyAction` (1 ply for normal enemies, 2 for
  elites/bosses, beam-limited) → evaluate (board power, card advantage, Essence, tempo, threat
  of the opponent's held Aether) → apply personality weights → pick, with a configurable mistake rate.
- Runs in a **Web Worker** in the client so the UI never stutters.
- Must answer a response window in < 300 ms (precomputed fast path); "thinking" delay is cosmetic.

## 4. Client design (`apps/web`)
- **React** renders everything except the duel board. The **Duel screen** mounts one PixiJS
  `Application`.
- **Card renderer:** card frames are **SVG template functions** per realm × type
  (`renderCardSVG(cardDef, instanceState, finish)`). The same SVG is used inline in React (Codex,
  rewards) and rasterised into Pixi textures (board), so cards look identical everywhere. Cache by key.
- **AnimationDirector:** consumes `GameEvent[]` → builds GSAP timelines per `04_VISUALS_AND_ANIMATION.md`
  (durations, beats, overlaps, speed setting, skip-to-end). Board sprites live in a registry keyed by
  `instanceId`. The director, never game logic, moves sprites.
- **Input:** drag-to-play, click-to-target, right-click inspect, Space = pass/confirm, Esc = cancel.
  Only `legalActions` are ever offered: illegal moves can't be made, not "rejected".
- **Debug panel** (dev builds, `~` key): state inspector, give card, set Aether, force draw, replay from
  action N, copy seed+log, toggle "show hidden info".

## 5. Testing strategy (non-negotiable)
- **Every card** has at least one scenario test using a fluent builder:
  ```ts
  scenario().p1.board('AUR-04').p2.hand('WYL-11').p2.set('WYL-11')
    .p1.attack('AUR-04', 'p2-face').p2.respond('WYL-11')
    .expect(s => s.p1.void).toContain('AUR-04');
  ```
- **Rules tests** for every section of `01_GAME_DESIGN.md §3` (turn flow, chain ordering, fizzles,
  trigger queue order, Guardian, Ambush flips, Fatigue...).
- **Property tests:** 10,000 random legal games per CI run with invariant checks (card conservation,
  ≤ 5 units, ≤ 4/5 backrow, no NaN, the game always ends within 200 turns, caps never hit).
- **Content tests:** schema validity, text ↔ data consistency, every token/reference resolves, every
  enemy deck is legal.
- **Determinism test:** replaying the seed + action log reproduces an identical state hash.
- **Sim tool:** `pnpm sim --a <deck> --b <deck> --games 1000` → win rates, average turns, card impact.
  Used for the balance gate in `02_CARDS.md §3`.

## 6. Build milestones (internal dev roadmap)
Each milestone ends with something playable/verifiable and a commit tag.

| # | Milestone | Done when |
|---|---|---|
| **M0** | Monorepo, TS strict, lint/format, Vitest, CI config, Vite app with a placeholder title screen (deploy config present, not deployed) | `pnpm test` + `pnpm build` green |
| **M1** | **Engine core:** zones, turn flow, Aether/held Aether, Resonance, units & combat, spells, traps, relics, rifts, the full chain, keywords; **all 40 Commons** + tokens + Rift Spark + character Sigils; the four 20-card starters; **CLI duel** (`pnpm duel`) vs a random AI | Rules tests green; a full game is playable in the terminal |
| **M2** ✅ | All 74 cards + Warden signature cards, content validation, heuristic AI, sim tool (incl. a "tier advantage" sim: Tier I bank vs Tier V bank decks), enemy decks | Every card tested; 10k-game property test green (`pnpm test:property`) |
| **M3** | **Duel UI v1:** board, hand, drag/target, response windows, chain panel, placeholder art, core animations (draw, generic summon, attack, Shatter, trap spring, chain add/resolve) | A full duel vs the AI in the browser feels good at 1× and 4× |
| **M4** | **Run v1:** Sanctum, character pick, stage map, nodes, card rewards/skip, Shards & Merchant, Shrine, Resolve, Stage 1 + its Warden, Warden's Gift, local saves + export | **Friends alpha** (single-player) |
| **M5** | All 5 stages + Vorthax, Bank/Continue, Vault (5 slots), Rift Tiers I–X, Boons, Events, Tempering, permanent unlocks & Codex | A full loop completes; Tier II plays differently; a deck can be banked |
| **M6** | **Online beta:** accounts, ghost upload + ghost matches, live casual PvP (authoritative server), weekly season + wipe, Weekend Tournament, leaderboard (live + ghost wins), Hall of Fame | **Friends PvP beta**: a full weekly cycle runs |
| **M7** | Polish: full animation catalog, realm overlays, audio, AI art integration, tutorial, accessibility. Public web launch (Ko-fi, roadmap, server-verified runs) | Public beta; the store-trailer-worthy build |
| **M8** | Steam prep: Electron + steamworks.js, achievements, cloud saves, store page | Steam Early Access candidate |
