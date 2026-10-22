# M3 review: the real duel UI (`apps/web/src/play`)

Scope: `play/` (session, actions, slots, log, replay, Prompts, promptHelpers, Hud, DuelView, PlayScreen, play.css, tests), `hand/Hand.tsx`
(canPlay/locked), `duel/scene/Monsters.ts` (defOf, vanish), `duel/scene/Traps.ts` (cast, setFaceDown/Up), `app/App.tsx`, `app/TitleScreen.tsx`,
`apps/web/package.json`. Checked against `packages/engine/src` (engine, view, actions/legalActions, types, effects) and `packages/ai/src`.
Paths relative to `apps/web/src/` unless stated. Static review only; no source modified, nothing run.

Counts: CRITICAL 0 / HIGH 4 / MEDIUM 12 / LOW 9

Good news first: the hidden-information boundary holds. The UI only reads `viewFor(HUMAN)` and `eventsFor(...)` output. `replay.ts`, `log.ts` and
`Hud.tsx` never read engine state. `trapSet`/`ambushSet` carry '?' for the enemy and `defOf('?')` is undefined. `Traps.setFaceDown(key)` takes no def.
The AI decides from `viewFor` plus `legalActions` only (`heuristic.ts:57-81`). Every `Action` type and `Pending` kind is reachable (details in the
coverage table at the end). StrictMode creates one session and at most one live scene. Leaving mid-AI-turn cannot hang on a Promise, because
`Monsters`/`Traps.destroy()` resolve their `pending` resolvers.

---

## CRITICAL
None.

---

## HIGH

### H1. An exception while animating a batch ends the match (animation can gate rules)
- `play/session.ts:173-185` (`apply` awaits `hooks.onBatch`), `:139-171` (pump catch sets `stopped = true`), `:118-132` (submit catch), `play/DuelView.tsx:146-151` (onBatch has no try/catch).
- The engine state is already applied when `onBatch` runs. If `replayBatch` or `reconcile` throws, `apply` rejects, so `pump`/`submit` set `stopped = true` and call `onError`. The player sees "The duel hit a problem" and the duel is dead. Likely throw sites:
  - `Traps.cast` on a destroyed container.
  - `scene.monsters.attack` or `summon` with a slot geometry that does not exist.
  - Any gsap callback.
  - The earlier Phase 4 review found a throw in `Traps.remove` mid-reveal (the Phase 4 H1 finding).
- This breaks golden rule 4: gameplay must never wait on, or die from, animation state.
- Fix: in `DuelView` `onBatch`, wrap `replayBatch` in try/catch. On failure, `console.error`, then run `reconcile` in a second try/catch and carry on. `onError` should be reserved for engine errors. Better, make `session.apply` catch around `hooks.onBatch` separately from `engine.applyAction`, so only engine errors set `stopped`.

### H2. No watchdog: one animation promise that never settles freezes the duel permanently
- `play/session.ts:173-185`, `play/DuelView.tsx:146-151`, `play/replay.ts:115,173,189,220` (every `await scene.*`).
- The AI loop and the human's `busy` flag wait on `onBatch`. Anything that leaves a promise unresolved stops input forever, with no recovery except Leave. Candidates:
  - A gsap timeline that is killed or never fires (tab hidden then restored, or a target destroyed).
  - `Monsters.attack` returning early without ever calling `onImpact` (see M1).
  - `Traps.reveal` interleaved with `remove` (the Phase 4 H1/M3 findings).
- Concede is also `disabled={!inputOpen}` (`DuelView.tsx:474`), so the player cannot even concede.
- Fix: `await Promise.race([replayBatch(b, env), timeout(6000 / speed)])` in `onBatch`, then force `reconcile`. Keep Concede and Leave enabled whenever the game is not over.

### H3. Auto-pass ignores Rift Spark unconditionally, contrary to DECISIONS #47 (and hardcodes the card id)
- `play/session.ts:56-63` (`isOnlyPassOrSpark`), `:150-157`.
- DECISIONS #47: "auto-pass ignores Rift Spark unless its +1 Mana would let you afford another legal response". The code passes whenever the legal list is only Pass and/or a Spark play, and never checks what Spark would enable.
- TOK-SPARK is Swift, so it is legal inside windows. Take a second player at 0 Mana with a face-down 1-cost Trap or a 1-cost Swift spell. `legalActions` shows only [pass, play Spark], because the Trap is not affordable yet. The session passes silently and the player can never Spark-then-spring. This is exactly the Rift Spark scenario.
- `'TOK-SPARK'` is hardcoded in client code (`session.ts:57`), while DECISIONS #41 makes it `Rules.secondPlayerCard`. This is a golden-rule-2 smell.
- Fix: read `state.rules.secondPlayerCard`. Before auto-passing, run `engine.applyAction(clone, spark)` on a throwaway copy. If the resulting `legalActions` contains anything other than pass or another Spark play, do NOT auto-pass. This is an engine query, not a client rule. Add a test with a hand of [Spark, 1-cost Swift spell] at 0 Mana in a window.
- The unit test (`session.test.ts:82-96`) only checks a trivial `[pass]` and `[endTurn]`.

### H4. Targets, abilities and attacks are chosen from text lists that cannot tell identical cards apart
- `play/actions.ts:72-77` (`targetNames`), `:80-126` (`describeAction`), `play/promptHelpers.ts:6-8,10-28`, `play/Hud.tsx:152-156` and `:179-181`, `play/DuelView.tsx:259-263`.
- Every target prompt (`chooseTargets`, play-with-targets chooser, window buttons, `chooseCards`) shows only card names: "Play Fireball → Cinder Whelp". There is no owner, no slot, no stats, and no highlight on the board. Mirror matches, tokens, multiple copies, or "your Whelp vs their Whelp" make the options indistinguishable and effectively random.
- `pendingTitle` for `chooseTargets` is just "Choose targets", with no source card and no purpose.
- Fix: label with owner and slot, e.g. "Enemy Cinder Whelp (slot 2, 3/2)", built from `fieldKeys(view)` and `view.stats`. Highlight the hovered option's slot with `scene.highlightSlots`. Title it "Cinderbolt: choose a target" using `pending.then.trigger.sourceId`. Long term, let the player click targets on the board (`highlightSlots` already exists).

---

## MEDIUM

### M1. `Monsters.attack` can return early without calling `onImpact`, so consumed damage, log lines and floats are lost
- `duel/scene/Monsters.ts:375-377` (`if (!m || m.dying || m.busy > 0) return Promise.resolve()`), caller `play/replay.ts:161-183`.
- `replay` marks the grouped impact events as consumed (`:172`) and relies on the `onImpact` callback to show them. If the attacker is busy (still in a hit shake or another attack) or dying, the callback never runs. The player-face damage float, the "N damage to X" log line and the death animation are skipped. `reconcile` later fixes the board but not the log or floats.
- The same happens if the scene is destroyed mid-attack, which is harmless.
- Fix: in `replay`, track `let hit = false` inside the callback. After `await scene.monsters.attack(...)`, `if (!hit) callback()`. Or make `Monsters.attack` always invoke `onImpact` on the early-return path.

### M2. `reconcile()` Evolve/transform handling races and can leave a ghost or a missing unit
- `play/replay.ts:254-259`.
- `vanish` is awaited via `leaving`, but the re-summon is a bare `window.setTimeout(..., 400)` that is neither awaited nor speed-scaled.
  - Under trap slow-mo (`gsap.globalTimeline.timeScale(0.35)`) the vanish tween takes about 1 s. At 400 ms `summon` hits `this.units.has(key)` (still present, dying) and returns silently. The unit never appears until a later reconcile.
  - Conversely, the next batch (the AI starts about 50 ms later) can destroy the unit while the timer is pending. `has(k)` is false so there is no death animation, then the timer resurrects a ghost for the rest of that batch.
- The `evolved` event is not handled at all in `replayBatch`, so there is no transform beat.
- Fix: `leaving.push(scene.monsters.vanish(k).then(() => { if (!env.cancelled()) scene.monsters.summon(k, d, power, guard); }))`. Handle `evolved` in the event loop (vanish, then summon, using `b.after.stats`).

### M3. Rift, Sigil, the Void and your own face-down cards cannot be seen or inspected
- `play/replay.ts:225-288` (reconcile only draws units and backrow), `play/Hud.tsx:83-103` (`SelfPanel` shows only a void count), `play/DuelView.tsx:280-323`.
- `ps.rift` and `ps.sigil` are never drawn, and the enemy's are not shown at all. A Rift's passive or start-of-turn effect and your Sigil's text are invisible after the cast flourish. You cannot tell which of your own set Traps is which: your own face-down card appears as an anonymous sigil, and the card text is only discoverable when "Spring X" appears in a window. There is no hover or inspect of any field card, the enemy's included. The Void (Echo) is only listed by "Echo ..." buttons.
- Fix (M3 polish): an inspect panel on hover or long-press, fed from `view.cards` (own face-down cards have a real `cardId` in your view). Add Rift and Sigil chips to the panels. Add a Void viewer. Any future Sigil or Rift `activated` ability (`livePermanents` includes them, `actions.ts:290-310`) would be unreachable because `fieldActions` is only offered for selectable board slots. None exists in content today.

### M4. Drag-drop validity is client-side rule logic and disagrees with the engine (Ascend with a full row)
- `play/DuelView.tsx:268-294` (`freeKeys`, `probe`).
- `probe` requires a free slot of the card's kind. The engine lets Ascend plays work with a full unit row (`engine/actions.ts:104-115`, "the sacrifice frees slots"). A card whose only legal play is an Ascend with a full row cannot be dropped, and it is still `playable` and keyboard-playable. The dropped-on slot is also ignored, because the engine picks the first free slot and the unit appears elsewhere.
- Fix: valid drop = `cardPlays(legal, uid).length > 0` over the board area, not "slot is free". Highlight all slots of that kind regardless, or only the one the engine will use.

### M5. The speed setting only scales `setTimeout` waits and the banner, not the gsap animations
- `play/DuelView.tsx:77,102-104`, `play/replay.ts:57-58`, `duel/scene/Monsters.ts` and `Traps.ts` (`cast` about 1.25 s, trap reveal about 2.5 s, attack about 0.9 s, vanish and die fixed). Spec `04_...` requires a speed setting.
- At 4x only the gaps shrink. The long tweens stay at 1x, so AI turns are still slow.
- Fix: a scene-owned `gsap.timeline` or `scene.setTimeScale(speed)` driven by `speedRef`. Keep reveal slow-mo relative to it.

### M6. Modals have no focus management, and board play is pointer-only
- `play/Prompts.tsx:15-25` (`role="dialog" aria-modal` but no initial focus, no focus trap, no Escape; the Hand's `tabIndex=0` slots stay tabbable behind it), `play/Hud.tsx:139,197` (the GameOver dialog lacks aria-modal and focus), `play/DuelView.tsx:296-323` (select and attack only via `onPointerDown` on the canvas), `play/play.css` (no `:focus-visible` rules, only a few animations are guarded).
- A keyboard or screen-reader user cannot attack, select a unit, use a unit's ability or flip an Ambush. They can play cards and end the turn. The mulligan buttons do have aria-pressed.
- Fix: focus the first button (or the dialog) on open and restore it on close, with Escape cancelling the chooser. Mark the rest of the UI `inert` while a modal is open. Add a keyboard path for attacks (a list of "your units" then "targets", reusing `attackTargets`). Add `:focus-visible` outlines.

### M7. The AI runs on the main thread, so each decision can stutter animation and input
- `play/session.ts:159-162` (only a `setTimeout(0)` yield between decisions), `packages/ai/src/heuristic.ts:54,73-80` (up to 60 candidate simulations per decision plus belief-state creation; the session tests use 120 s timeouts).
- A single heavy decision (full board, chains) can block the thread for hundreds of ms, which hitches the gsap ticker (attack and hit animations) and the hand fan.
- DECISIONS #77 accepts this for now. Suggested mitigations: `maxCandidates` 30 for the browser, or a Web Worker (`choose(view, legal)` is already pure).

### M8. A single stale or illegal human action is fatal
- `play/session.ts:118-132`, `play/DuelView.tsx:234-246`.
- If `engine.applyAction` throws a `RulesError` for the human (e.g. an Echo or ability action built from a stale `legal`, or any UI bug), the session sets `stopped = true` and the match is over. It should be recoverable: refresh `legal` and `view` and keep playing. The state was not mutated, since `applyAction` clones.
- Fix: in `submit`, catch errors from the human's `applyAction` separately (before any batch). Do not set `stopped`. Call `onIdle()` and surface a toast.

### M9. Dead-end states have no way out
- `play/session.ts:148-149` (`legal.length === 0` breaks the loop with the human to act), `play/DuelView.tsx:355-356,474`, `play.css:154-159` (`.loading--error` is `absolute; inset: 0`, so it may sit over the Leave button).
- If `toAct` is the human but the legal list is empty (a `chooseCards` with min above the eligible count, a rules bug), the player sees an enabled-looking board with nothing clickable. Concede is disabled because `inputOpen` is false. The error overlay has no explicit buttons.
- Fix: show "Nothing to do here" with Concede and Leave whenever `!busy && legal.length === 0 && !winner`. Give the error panel Leave and Retry buttons with a higher z-index.

### M10. Same-turn relic, Rift and Echo UX gaps
- `play/DuelView.tsx:338` (`barActions = selectedId ? sel : echoes`), `play/replay.ts:112-118`.
- Echo options disappear whenever any of your units is selected, and the title is just "Echo". Relics (back-row, face-up) get no placement animation, because `cardPlayed` only flourishes spell and rift, so they pop in via reconcile. The Rift flourish has no persistent representation (see M3).
- Fix: always show Echo as its own group. Add a relic place animation.

### M11. Test gaps for the riskiest new code
- `play/session.test.ts`, `play/play.helpers.test.ts`.
- There are no tests for:
  - `replayBatch`/`reconcile` (a fake scene would do: assert the scene matches `view` after random batches).
  - `Prompts` (mulligan subset matching, YesNo).
  - An "every Pending kind and Action type is answerable" check (a headless pass over random games asserting `optionsFor`/`describeAction` never produce '' or throw for chooseTargets, scry or chooseCards).
  - The hidden-info rule for `trapSet`/`ambushSet`/`cardAdded` for seat 1. The existing test only checks `cardDrawn`.
  - Auto-pass with Spark (see H3).
- `play.helpers.test.ts:62-67` "only offers attack targets" is vacuous: it asserts `attackTargets(legal, 'nope')` is empty and `windowOptions` of `[pass]` is empty.
- `playOut` always picks randomly, so it rarely reaches window, scry, chooseCards and flip states.
- Fix: add the above. A fake-scene reconcile test is the most valuable.

### M12. Raw `GameState` and unredacted action escape the session
- `play/session.ts:41,94-96` (`get raw()`), `:38-45` (`Batch.action`).
- `Batch.action` is the AI's actual action, e.g. `{type:'play', card:<real id>}`, `setTrap` or `mulligan` card ids, `ambush` ids. It is not redacted and is unused today (only `b.actor`, `b.events`, `b.before`, `b.after` are read). The `raw` getter exposes the whole `GameState` including the AI's hand and deck order, and is used only by a test.
- Both are footguns for the "UI only uses `GameView`" rule. Instance ids carry no information (ids are created after the shuffle), but the action fields can.
- Fix: drop `action` from `Batch` (or expose only `type`). Rename `raw` to `__testState`, or move it behind a test-only export.

### M13. `Hand` accessible name says "not enough Mana" for every unplayable reason
- `hand/Hand.tsx:238`.
- While locked (the enemy's turn or an animation) or when a card is unplayable for any reason other than Mana, the label reads ", not enough Mana". Misleading for screen readers.
- Fix: `locked ? ', not your turn' : canPlay ? '' : ', cannot be played now'`.

### M14. Re-render pressure: every log line and every float re-renders the whole duel screen
- `play/DuelView.tsx:113-128,64-72`; the `Hand` is not memoized and rebuilds `handCards` from `view`.
- `setLog` and `setFloats` live in `DuelView`, so each log line, float and banner re-renders the Hand (up to 9 `Card` components), panels and the choice lists. `setView` is called twice per human batch and once per AI batch. `AttackArrow` correctly keeps `pointermove` local, and the DuelView itself does not re-render on pointermove.
- Fix: move log, floats and banner into small child components fed by a ref-backed event emitter. `React.memo(Hand)` with stable props.

---

## LOW

1. **Events not covered by `eventsFor` can leak face-down stats and identities (engine side).** `statsChanged`, `keywordGranted`, `statusApplied` and `evolved` (`from`/`to`) have no redaction (`engine/view.ts:321-339`). The UI ignores them for hidden units (no monster in the slot, and `describeEvent` returns null), so nothing is displayed today. A future animation or log line could leak. Fix: redact in `eventsFor` for face-down cards the viewer does not control.
2. **Log names for departed tokens.** `play/log.ts:16-18` and `:37-38` use `b.after`, so an attacker or target that left play and is not in the Void (a destroyed token) logs "a hidden card attacks...". Fall back to `b.before` for names.
3. **Attack groups cross a trap spring.** `play/replay.ts:166-172`: if a response happens between `attackDeclared` and the damage, the `chainLinkAdded` stopper ends the group early. The lunge plays with no damage, then the Trap reveals, then the combat damage appears without a lunge. It reads out of order. Fix: group by `chainLinkResolved`, or delay the lunge until damage.
4. **Leave has no confirmation.** `play/DuelView.tsx:360` abandons the duel instantly.
5. **StrictMode (dev only) initializes two Pixi Applications on the same host at once.** `DuelView.tsx:130-137` and `BattlefieldScene.create`. The first is destroyed on arrival, which is correct but wasteful, and module-level caches (`Monsters.texCache.clear()` in `destroy`) are shared. Consider guarding with a per-effect abort flag before `app.init`.
6. **`ready` flips before the session starts** (`DuelView.tsx:163-165`). The HUD shows an empty board for a frame while the AI mulligans and the first banner plays. This is cosmetic.
7. **`before` view is recomputed each apply** (`session.ts:174`). It could reuse the previous `after`. Two `viewFor` computations per action also build stats for all units.
8. **`prefers-reduced-motion` is not honoured by the new CSS animations.** `play.css:149,293,333,404,497` (foe pulse, float-up, banner, toasts). The scene has a "Reduced effects" toggle, but OS-level reduced motion does not apply to these.
9. **`PlayScreen` radio group is not keyboard-navigable.** `play/PlayScreen.tsx:59-72` uses `role="radio"` buttons without arrow-key handling or roving tabindex.

---

## Coverage checks (all pass unless noted)

**Every Action type is reachable:**
- `mulligan`: MulliganPrompt.
- `play` / `setTrap` / `setAmbush`: hand drag or Enter, plus the chooser for variants.
- `play` with `echo`: the Echo action bar (see M10).
- `flip` / `activate` / `activateTrap`: ActionBar for the selected unit; Trap springs and Swift spells in WindowPanel. `activate` on a Sigil or Rift has no UI (none exist in content, see M3).
- `attack`: click then a target (pointer only, see M6).
- `pass`: WindowPanel.
- `endTurn`: End turn button.
- `concede`: Concede button.
- `chooseTargets` / `chooseCards` / `scry`: ChoiceList with the full list of options. `scry` has n permutations, which is fine for n <= 3, and `.choices` scrolls at 55vh. The labels are ambiguous (H4).
- `chooseOptional`: YesNoPrompt.

**Every Pending kind has a dialog:** mulligan, chooseTargets, chooseOptional, scry, chooseCards.

**Windows with non-empty legal and nothing shown:** none found.
- Main phase always shows End turn.
- Windows show WindowPanel when there is a non-Pass option.
- A window with only Pass is auto-passed (but see H3).
- A `pending` for the human shows a modal.

**Races reviewed:**
- Double submit is safe, because `busyRef` is set synchronously in `submit`.
- `onIdle` fires after `busy` is reset.
- `submit` during `start()` is ignored, and `busyRef` starts true so the UI cannot do it.
- Unmount mid-AI-turn: `stop()` plus `cancelled`, and animation promises resolve on scene destroy. The pump exits on `stopped`.

**Rules decided in the client:**
- Auto-pass policy (H3).
- Drop-slot validity (M4).
- Everything else filters `legalActions`.

**Other:**
- `apps/web/package.json` adds `@sr/ai` as `workspace:*`, which is correct. `@sr/ai` is pure (no DOM).
- `App.tsx` and `TitleScreen.tsx` routes are fine. `#/play` is lazy-loaded.
- `Traps.cast` and `Traps.setFaceDown/setFaceUp`: the API split is correct, with no def stored for face-down cards.
- `Monsters.defOf` and `vanish` are fine. `vanish` resolves on scene destroy.
