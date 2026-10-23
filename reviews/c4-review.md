# C4 review: campaign on Combat v2 + old engine deletion

Scope: packages/campaign/src, combat tier/mana changes, apps/web run + fight/display + cleanup. Spec: docs/08 section 9, DECISIONS #89 and #90.
Baseline: `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` (97 tests) all pass. No source files were modified.

Verdict: no CRITICAL issues. The run state machine is clean (pure, clones, RunError on illegal moves, HP/Resolve rules match #89). The problems are a broken CI step, save validation holes, the mid-fight reload design, and leftover dead code/docs from the deletion.

## CRITICAL
None.

## HIGH

### H1. CI still runs the deleted `pnpm test:property` (every CI run fails)
- `.github/workflows/ci.yml:24-25` ends with `pnpm test:property` ("the engine gate"). The script no longer exists in package.json (DECISIONS #90 says so).
- Fix: delete those two lines (or point at a combat random-play test if one exists).

### H2. `parseRun` accepts prototype keys as ids, then the UI crashes
- `packages/campaign/src/save.ts:110`: `r.character in RIFTWALKERS` is true for `"constructor"`, `"toString"`, `"__proto__"`, `"hasOwnProperty"`. `RunBar` then does `RIFTWALKERS[run.character].hero.name` (RunScreen.tsx:234) and throws.
- `save.ts:115`, `:63` (`cards()`), `:82` (merchant `cardId`): `!CARD_DB[id]` / `!!CARD_DB[id]` is truthy for `"constructor"`, `"toString"` etc., so a deck or offer list containing them passes validation, then `defOf`/`FightCard`/`createCombat` break.
- parseRun is the trust boundary for imported files and, later, the Vault/PvP deck.
- Fix: use `Object.hasOwn(RIFTWALKERS, id)` / `Object.hasOwn(CARD_DB, id)` (or build `Set`s of valid ids once, as ENEMY_IDS already does). Add a test with `character: 'constructor'` and `deck: ['toString', ...]`.

### H3. A crash (or leaving the page) during a fight silently costs Resolve, and the reload loop can destroy a run
- `RunScreen.tsx:52-62` + `saves.ts` (`duelWasStarted`): any resume of a `duel` phase that was marked started is converted into a loss by `finishDuel(saved, false)`.
- `ErrorBoundary.tsx` offers "Reload". If the FightView throws on render (bad content, Pixi failure), each Reload is a resumed started duel, so each reload costs 1-2 Resolve until the run collapses. The player loses the run to a bug.
- The explanatory notice (`initial.notice`) is only rendered in the non-duel branch (RunScreen.tsx:151), so in the common case (Resolve left, the same fight reopens) the player never sees "You left the last duel unfinished"; Resolve is just lower. Same for navigating away via Back/hash change and returning.
- Fix: (a) render `notice` over the FightView branch (or show a one-time modal before re-entering the fight); (b) clear the started marker in the boundary (`clearDuelStarted()` on Reload and in `componentDidCatch`) so a crash is never charged; (c) do not charge for FightView's error state (see M1).

## MEDIUM

### M1. Forfeit and engine errors count as defeats, with no confirmation
- `RunScreen.tsx:136` wires `onExit` to `reportResult(false)`; `FightView.tsx:577` shows the same button in the error state ("The fight hit a problem"). An engine/content error therefore costs Resolve. One mis-click on Forfeit (FightView.tsx:586, no confirm) costs 1-2 Resolve.
- Window: `FightView.tsx:350-354` sets the result 300 ms after the last animation batch. Between the winning blow and the dialog the Forfeit button is clickable, which reports a loss for a won fight (engine `winner === 'a'`).
- Fix: confirm on Forfeit; in the error branch use a handler that does not charge Resolve; disable Forfeit once the engine state has a winner.

### M2. Upgrading bypasses the 4-copy limit
- `run.ts:268-273` (`takeShrine` upgrade) swaps `id` for `id+`; `rewards.ts:13-18` (`canAdd`) counts exact ids only. A deck can hold 4 `dawn-smite` and 4 `dawn-smite+` (8 copies), and after upgrading all four, rewards/merchant offer 4 more base copies.
- Fix: count by base id (`id.replace(/\+$/, '')`) in `canAdd` and in parseRun validation. Decide explicitly and log in DECISIONS.

### M3. `parseRun` leaves many holes
`save.ts` (parseRun starts at :98, validContext at :57):
- `stats` only checked as an object (:127). Missing/NaN `duelsLost` makes the retry seed `...:undefined` and `++` gives NaN. Validate the three counters as ints >= 0.
- `stageRealms` only `isStrArray` + length 3 (:126); values not checked against the realm list. `realmOfStage` then returns junk, `REALM_LABEL[...]` is undefined, and `nextStage` -> `generateStageMap` -> `pick()` on an empty list throws a plain Error (generic message, stuck run). Also validate `map.realm`, `map.stage === r.stage`, and that `next` links go to floor + 1.
- Phase/stage coherence is not checked: `stageClear` at stage 5, `loopCleared` below stage 5, `gift` on a non-warden node, `shrine`/`merchant`/`event` phase on a node of another kind, `context.nodeId !== at`, a `map` phase with non-null context.
- `cleared` may contain duplicates; `at` may be an unreachable node.
- Context contents: merchant `sold`/`removed` booleans, event `cardOffer` (card id or ''), option `id` in the allowed set, `label` string are not checked. A bad `cardOffer`/option id gives a silent no-op or an unrenderable button.
- Deck: only "card exists and size >= minSize". Copy limits (non-basic > 4), `unplayable` cards and other realms' cards are not rejected. Matters once decks are banked for PvP.
- `maxHp` is 1..9999 and not tied to `RIFTWALKERS[character].hero.maxHp`; `tier` allows 99 (tierHp = 12x); `maxResolve` up to 9. Bind to the hero/expected values if tamper resistance matters.
- Opposite problem: `validContext` for `reward`/`gift` requires `offers.length > 0` (:63). `offerCards` can return `[]` (all candidates at the copy limit) and `finishDuel` would produce that context; it saves fine but is rejected on reload and the run is lost into `.rejected`. Allow empty offers for `reward` (skip is legal) or make `finishDuel` go straight to the map when offers are empty (as the gift path does at run.ts:198).
- Add tests for each rejection.

### M4. Save-scumming via Export/Import
- The "leaving a duel = loss" guard (RunScreen.tsx:52) does not apply to exported files. Export on the map, fight, lose, re-import: Resolve restored free, and the rng state is in the save so rewards can be rerolled. Fine for a friends beta, but undermines Resolve/Bank for PvP integrity. Note it in DECISIONS or flag imported decks so they cannot enter the Vault.

### M5. Side effects inside React updaters/initializers
- `RunScreen.tsx:78-89` `act()` calls `setNotice` inside the `setRun` updater (updaters must be pure; StrictMode runs them twice). Compute the next state outside the updater (ref or reducer) and set the notice in the catch.
- `RunScreen.tsx:52-62` the `useState` initializer calls `clearDuelStarted()` and `finishDuel`. In StrictMode dev the initializer runs twice; it works only because React keeps the first result (the second call sees the marker cleared). Move it to a module-level load or a one-time ref.

### M6. Retry seed repeats across loops
- `run.ts:160` seed = `run:node:duelsLost`. After `continueLoop` node ids repeat (`s1-f1-a`), so a Tier 2 fight at the same node with the same `duelsLost` shuffles the same way as Tier 1 (deck usually differs, but opening draws correlate). Add `tier` and `stats.duelsWon` (or `nodesCleared`) to the seed.

### M7. Tests are thin where the rules are
`packages/campaign/src/run.test.ts`:
- No tests for: `buyCard` (0 shards, too expensive, copy limit, sold), `buyRemoval` (min deck, price, one per visit), `chooseEvent` (each option, heal clamp), `chooseCard` (skip on gift, off-list card, copy limit), `giftOffers` empty fallback to `stageClear`, elite/Warden Resolve cost 2, Warden +30% heal and +1 Resolve, shard rewards, `nextStage` 4 to 5, stage 5 to `loopCleared`, `bank`, `continueLoop` Resolve rules (tier < 8), the upgrade vs copy-limit case (M2), parseRun rejection of mid-phase contexts. Lines 273-274 (`expect(buyCard).toBeDefined()`) are placeholders that assert nothing.
- The bot test (:249-258) accepts `banked` OR `collapsed`, so it passes even if the bot always dies in stage 1 and never exercises gifts, stage 5, Bank or Continue. Assert that at least one hero reaches `loopCleared`, or drive phases directly with scripted wins via `finishDuel`.
- `index.test.ts` only checks two constants.
- `apps/web/src/fight/display.test.ts:37` uses tier 3 for only `i % 3 === 0` encounters, so a summoning encounter at tier > 1 is not guaranteed to be covered. Run every encounter at tier 1 and tier 4, or add a targeted test that a summoned unit's `maxHp` and `might` match the engine.

### M8. Spec gap: no heal after elites
- docs/08 section 9 says HP recovers "a little after elites"; `finishDuel` (run.ts:165-215) heals only on Wardens. Implement (e.g. 10% max HP on elite win) or record the omission in DECISIONS #89, since HP economy is the main difficulty lever.

## LOW

### L1. Dead code and stale artifacts from the deletion
- `apps/web/src/duel/scene/textures.ts:777` `runeRingTexture` (the slot rune ring, with a `'unit' | 'trap'` branch at :832) has zero callers. Delete it, and any helpers that become unused.
- `apps/web/src/duel/scene/layout.ts:36-43` `rows.oppTrap` / `rows.myTrap` have no callers except `layout.test.ts` (:22, :26-29), which keeps them alive. Only `rows.riftLine` is used (BattlefieldScene.ts:188, :318). Header comments (layout.ts:1-3, BattlefieldScene.ts:4-5) still mention slots/monsters/traps.
- `BattlefieldScene.ts:70-74` sound names `trapSet|trapCharge|trapReveal|trapEffect|trapSpent`; unused exports `SoundName`, `SceneStats` (BattlefieldScene), `TileNoise`, `clamp01` (noise.ts), `PAD_Y`, `makeCanvas`, `FloorTextures` (textures.ts), `prefersReducedMotion`, `saveEffectsMode` (effects.ts; nothing sets the mode), `archetypeOf`, `CardArt`, `cardArt` (proceduralArt.ts, internal use only). Un-export or delete.
- `proceduralArt.ts:16` `ArtCard.type` still carries the v1 union (`unit|trap|relic|rift|token|sigil`); `fight/art.ts` maps v2 kinds onto it with fake ids. Fine for now; note for the art pass.
- `apps/web/src/duel/duel.css`: unused classes `duel__fps`, `duel__label`, `duel__panel`, `duel__stage`, `duel__tests*` (the "Phase 3 demo: monster animation tests" block, :275-310), `duel__toast`, `duel__top`, `mana__btn`, `mana__deal`, `mana__gem`, `toggle*` (no TS/TSX user found).
- `packages/campaign/src/rewards.ts:92` `MIN_DECK` is exported but unused; use `V2_DECK_RULES.minSize` or delete.
- Docs: `README.md:28-34` still lists `pnpm duel`, `pnpm test:property`, `packages/engine`, `packages/ai`, "CLI duel"; `docs/BALANCE.md:14` lists `pnpm test:property`; `docs/08_COMBAT_V2.md:149` says the old duel "keeps working until C4" (now done); `docs/KICKOFF_PROMPT.md` and `docs/07_TECH_ARCHITECTURE.md` still describe `packages/engine` (mark them legacy like 01/02). Clean: `pnpm-lock.yaml`, eslint.config.js, tsconfig files, workspace globs, tools/package.json (no engine/ai references).

### L2. Persistence/UX details
- `saves.ts:14`: an unparseable save is copied to `.rejected` but the player sees nothing; the Sanctum looks like a fresh start and the next autosave overwrites the original key. Show a notice and offer the rejected file for download.
- DECISIONS #89 says old saves are "refused and kept as `.rejected`". Only the `sr.run.v2` key is read, so pre-v2 saves (other key) are neither read nor copied. Fine, but make the doc match.
- `leaveRun` (RunScreen.tsx:100) does not call `clearDuelStarted()`; harmless (keyed by seed) but untidy.
- Leaving mid-fight via the browser back button/hash counts as a loss with no warning; consider a `beforeunload` prompt during a duel.
- The event "heal" option stays enabled at full HP (wasted pick); disable or relabel (run.ts:115, Pickers.tsx EventView).
- `MapView.tsx` computes `COL_W/ROW_H` from `window.innerWidth/Height` at render with no resize listener.
- `CardHover.tsx`: fixed 300px + 190px + gap panel overflows narrow viewports; it is `aria-hidden`, and Pickable's `aria-label` has only name and cost, so card text is unreachable by screen readers.
- `duelPlan` returns null for an enemy-less node; RunScreen then falls through to `Body`, which returns null for `duel` (blank screen). parseRun prevents it for loaded saves; a fallback ("Return to map") is cheap.
- `mapgen.ts`: nothing guarantees an elite per stage (22% roll on floors 3-4 only) and floor 5 can be shrine+shrine. Intentional? Note in DECISIONS.

## Checked and found correct
- HP carry: a loss keeps `hp` (run.ts:170-178); a win sets `hp = hpLeft` with integer 1..maxHp validation; `duelPlan` passes the entry HP; retry seed changes per loss; elite/Warden loss costs 2; collapse at 0.
- Tier scaling: engine `spawn` (engine.ts:360-363) and `display.ts:26-30` use the same `tierHp`/`tierMight`, same rounding, same `hero === null` and `brain.kind === 'enemy'` conditions; summoned units go through `spawn`; `createCombat` sets `s.tier` before building the enemy side; PvP stays tier 1; display reads `s.tier` from the cloned state.
- The end-of-turn `mana` event (engine.ts:577) is emitted only when mana > 0 and `display.ts:108` reduces it; the display test compares mana at every step.
- Shrine remove / merchant removal enforce `minSize`; `buyCard` checks sold, price (always >= 30, so 0 shards cannot buy) and `canAdd`; an empty gift falls through to `stageClear`; `chooseCard` rejects skipping a gift.
- FightView is remounted per retry via `key={plan.seed}`; a double "Continue" click yields only a RunError notice (phase already changed), not a double report.

## Resolution
HIGH fixed: prototype-key saves (Object.hasOwn), crash/reload no longer counts as a loss and the notice shows during a fight, CI line removed. MEDIUM fixed: forfeit confirmation, act() without updater side effects, upgrade shares the copy limit, retry seed includes tier, elites heal 10%, reward with empty offers loads, tests for merchant/event/gift/bank/elite. Remaining MEDIUM/LOW deferred (parseRun deep coherence checks, save-scumming via export, dead CSS/exports).
