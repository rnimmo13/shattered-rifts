# C3 review: Combat v2 fight screen

Scope: `apps/web/src/fight/*` (FightView, FightHand, FightCard, Fighters, Plates, info, art, display, display.test, FightScreen, fight.css), the `BattlefieldScene.ts` changes (SceneOptions, `fighters`, `clientToStage`, `stageToHost`) and the `#/fight` route in `App.tsx`. Checked against `docs/08_COMBAT_V2.md`, the golden rules, and `packages/combat/src` (engine.ts, view.ts, types.ts). `display.test.ts` passes (1 test). I did not run the UI.

Overall: the architecture follows the golden rules. The client only offers `legalActions()`, renders `viewFor()` of a display copy, and snaps to the engine state after each batch. No rules are decided in the client. The findings below are about robustness of the queue, lifecycle and input.

## CRITICAL

None. (No hidden-information leak: only `viewFor(...,'a')` is rendered, the draw pile modal is sorted, enemy hand and Snares are null.)

## HIGH

### H1. React StrictMode double-mount creates two scenes and two games (dev), and the first scene leaks
`FightView.tsx:353-395`. `main.tsx` wraps the app in `<StrictMode>`. In dev the effect runs, cleans up, and runs again. The cleanup sets `cancelledRef.current = true`, but the second run immediately resets it to `false` (line 356). When the first `BattlefieldScene.create` promise resolves, it sees `cancelledRef.current === false` (line 360). It then registers as the live scene: it appends a second canvas to the same host, calls `createCombat`, and enqueues a second opening. The first scene's `created` closure belongs to an effect run that already cleaned up, so it is never destroyed. This gives two WebGL contexts, two games, and `scene.current`/`game.current` flipping between them.
Fix: use a per-run flag, `let cancelled = false` inside the effect, checked in `.then`/`.catch`, and set to true in that run's cleanup. Keep `cancelledRef` only for the async replay loop, or make it a run token (an incrementing counter compared against the captured value).

### H2. A throw after the replay loop permanently soft-locks the fight
`FightView.tsx:303-350`. `runBatch` wraps only the event loop in try/catch. `fighters.sync(...)` (line 320, `Texture.from`/`unitHeight` can throw), `show` and `clone` run outside it. If any throws, the promise in `chain.current` rejects. The decrement of `pending.current.all/enemy` and `setLocked(false)` in `enqueue` (lines 336-339) never run. Because `chain.current` is now a rejected promise, every later `.then(async ...)` is skipped. Result: End turn reads "Enemy turn…" forever, or the hand stops reacting after plays. Only Leave works.
Fix: in `enqueue`, use `chain.current = chain.current.catch(() => {}).then(async () => { try { await runBatch(...) } catch (e) { console.warn(e) } finally { pending.all--; ...; recompute locked; maybe result } })`. Also move the final resync into a guarded helper that cannot throw past the `finally`.

### H3. Error state has no way out
`FightView.tsx:554` and `:556`. When scene creation fails (WebGL unavailable, `createCombat` throws on a bad setup), only the "The fight hit a problem" overlay shows. The header with Leave is rendered only when `view && ready`, and `.fight > *` is `pointer-events: none`, so there is no button. The player must edit the URL.
Fix: render a Leave/Back button in the error branch (and in the loading branch after a few seconds).

### H4. Plates and floats go stale after a window resize
`FightView.tsx:382-386` plus `BattlefieldScene.ts:293`. The ResizeObserver calls `bump`, so React re-renders and reads `sc.stageToHost` immediately. But the scene refits (`world.scale/position`) later, on Pixi's resize and the `renderer.on('resize')` handler. The DOM plates, intents and floats are positioned using the old transform. Nothing re-renders afterwards, so they stay misplaced until some unrelated state change.
Fix: have the scene expose `onFit?: () => void` (called at the end of `fit()`), and have FightView `bump` from that. Alternatively, `requestAnimationFrame` twice in the RO callback (a weaker fix).

## MEDIUM

### M1. Global keyboard shortcuts fire when they should not
`FightView.tsx:479-496`.
- No modifier check: Ctrl+1..9 (browser tab switch), Ctrl+E, Alt+digit also play a card or end the turn.
- No target check: typing 1 or E while the speed `<select>` or a button has focus plays a card or ends the turn (changing speed with the keyboard plays cards).
- While the pile modal is open, E and 1-9 still act on the fight. (`result` dialog is guarded only because `act` refuses on `winner`.)
- `e.repeat` is not ignored.
Fix: return early on `e.ctrlKey || e.metaKey || e.altKey || e.repeat`, on `e.target` being `select/input/textarea`, and when `pile || result` is open.

### M2. Whole screen re-renders on every pointer move
`FightView.tsx:466-477`. `setPointer({x,y})` creates a new object per `pointermove`, so FightView, UnitPlates and FightHand (with `fanLayout`) re-render at the mouse rate even when nothing is being aimed. `Fighters.setHover` (`Fighters.ts:340-346`) also starts a `gsap.to(..., overwrite:true)` for every fighter on every move, untracked in `live`, so it is not killed on destroy.
Fix: only subscribe/update `pointer` while `selectedCard` is set (or write it to a ref and update the arrow `path` d attribute directly). In `setHover`, early-return when the hovered id has not changed.

### M3. Replay-error and banner/flourish cleanup
`FightView.tsx:276-284, 314-316, 633-639`. If `playEvent` throws between `setBanner(...)` and `setBanner(null)` (e.g. the Snare banner), the resync at line 319 does not clear the banner, so it stays on screen. The `onRefuse` timer (line 638) also blindly sets `banner` to null 700 ms later, which can erase an "Enemy turn" or "Snare!" banner that appeared in the meantime.
Fix: clear banner/flourish/floats in the resync path. Use a banner token (`{id,text}`) so a timer only clears its own banner, and track timers in a ref so unmount can clear them.

### M4. `aimSet` prefers the selected card over the card being dragged
`FightView.tsx:449-452`. If card A is selected (aim mode) and the player starts dragging card B, the highlighted targets and the arrow stay those of A while B is dragged. The drop test in `FightHand` uses B's targets, so the visuals contradict the behaviour.
Fix: prefer `dragTargets` when it is non-null. Also clear `selected` when a drag begins (`onDragTargets(non-null)`).

### M5. Touch input is likely broken
`FightHand.tsx:161-174`, `fight.css:373`. `.fhand__slot` has no `touch-action: none` (nothing in `hand/*.css`, `duel/*.css` or `fight.css` sets it). `preventDefault()` on `pointerdown` does not stop touch panning, so the browser sends `pointercancel` as soon as the finger moves, which `onCancel` handles by aborting the drag. Dragging a card on a phone or tablet will mostly cancel. Also, pointer ids are not tracked, so a second finger overwrites `dragRef`.
Fix: add `touch-action: none` to `.fhand__slot` (and the stage), store `pointerId` in `Drag` and ignore other ids in the window handlers.

### M6. Targeting is mouse-only (accessibility)
`FightView.tsx:485-492`, `FightHand.tsx:149-175`, `Plates.tsx`.
- Number keys can select a multi-target card, but there is no keyboard way to pick the target (no Tab/arrow cycling, no Enter).
- Hand cards are plain `div`s: not focusable, no role, no accessible name (`FightCard` has an empty `alt` image).
- Chips and plates rely on `title` tooltips (no touch, no screen reader), and floats are `aria-hidden` with no live region, so damage and enemy actions are never announced.
- The result and pile dialogs have `role="dialog"` but no `aria-modal`, no focus move or trap, and no focus return.
Fix: make slots `button`s (or `role="button" tabIndex=0`) with an `aria-label` of name, cost and rules text. In aim mode, let arrow keys cycle `aimSet` and Enter confirm. Add a visually hidden `aria-live="polite"` log fed from the events. Move focus into dialogs.

### M7. Plates and intents overlap at small widths
`Plates.tsx:30`, `fight.css:78-94, 178-192`, `Fighters.ts:15-21`. Plate width is `max(96px, ...)` and intents are `nowrap`, but the figure pitch is `205 * k` stage px. With four enemies at around 1024 px wide or less (k near 0.5), neighbouring plates and intents collide. The mana orb, Snares, piles and End turn are anchored with fixed rem from the bottom and are not checked for narrow or short viewports (`.fight__aimbar` at `top:4.2rem` also sits close to the header).
Fix: scale plate width and font with `k` (CSS `--k` on the plate), hide `intent__name` below a threshold, and add a `@media (max-width: 900px)` pass.

### M8. Opening state, locking and `act()` are not guarded together
`FightView.tsx:404-420, 427-430, 346-347`.
- `act()` checks only `winner` and `cancelled`, not `locked`. The UI blocks input, but a drag that started before the lock (e.g. dragging a card and pressing E) can still drop and call `onPlay -> act` during the enemy replay. The action is legal against the real state, which has already moved on to the player's next turn, so it queues behind the replay. This is not unsafe, but it is a race the lock is meant to prevent.
- During the 300 ms between `gameOver` replay and `setResult`, `finished` is still false, so the hand looks playable. Clicks do nothing on `act` but show "No target" through `onRefuse`.
Fix: guard `act` on `lockedRef` (a ref mirror of the counters), clear drag state when `locked` flips true, and set `finished` from `game.current.state.winner` as soon as it is known.

### M9. `legal` comes from the real state, the hand from the display state
`FightView.tsx:435-444`. During a play batch the display hand still contains the card just played, which is marked unplayable because it is gone from `legal`. Clicking it shows "No target" (the `onRefuse` message at line 635-637 is only right for Mana). Cards no longer playable for other reasons (Snare cap, `unplayable`) also say "No target".
Fix: pick the refusal message from the reason (mana, no target, snare limit, played already), or ignore clicks on cards not in the real hand.

### M10. Weak tests
`display.test.ts`.
- It re-implements `startingDisplay` by hand (lines 50-55) instead of importing it, so the real function is untested.
- Only 6 encounters, one deterministic bot line, and the hero is `heroes[i % 4]`. It does not assert that every event type the engine can emit is handled (no coverage guard for `burn`, `addCard`, `prevented`, snare spring, summon index, stun).
- It compares state only at action boundaries. It does not check `maxHp`, `taunt`, `name` of summoned units, snare `card`, `draw` order, or invariants during replay (hp >= 0, hand <= limit).
- It never reaches hero death or `gameOver` with `lost`, which is the path that loses the hero fighter.
- All queue and lock logic in `FightView` (the most bug-prone part: `pending` counters, `enqueue`, resync) has no test.
Fix: import `startingDisplay`; run many seeds across all heroes and encounters plus a random-action bot; assert full-state equality after every event batch and also that the union of event types seen covers the `CombatEvent` union. Extract the queue/lock logic into a plain controller (`createReplayQueue({play, onIdle})`) and test it with fake timers, including a throwing step.

## LOW

- `FightView.tsx:342`, `:122`, `:171`: `setTimeout` calls (result, floats, flourish) are never cleared on unmount. Harmless in React 18, but track and clear them. `sleep()` timers also outlive unmount (the loop exits on `cancelledRef`, fine).
- `FightView.tsx:614-618`: the flourish element is reused, so playing a second card while the first is still showing does not restart the CSS animation. The first card's timeout compares `c === def`, so back-to-back identical cards cancel each other early. Give the element `key={nonce}`. The CSS animation (0.65 s) also ignores the speed setting, while the timeout divides by speed.
- `FightView.tsx:642` and `fight.css:520`: the `.fight__hint` is rendered but `display:none`; `hoverCard` state re-renders for nothing. Remove or implement.
- `FightView.tsx:107`: `bump` re-render hack. Fine, but a sign that layout reads belong in the scene.
- `FightView.tsx:660`: the aim arrow starts at (0,0)/last pointer until the first mouse move after a keyboard selection.
- `FightView.tsx:208-229`: a hit that both blocks and loses HP shows only `-lost`, with no Barrier feedback. The `heal`/`barrier` floats have no sound variety. Cosmetic.
- `FightView.tsx:526-535`: the pile contents are a snapshot at open and do not update during replay; the draw pile is built from the display state, fine.
- `display.ts:80`: `e.type === 'burn' ? 'discard' : 'discard'` is a redundant ternary. `display.ts:62-63` (`moveCard` def/inst juggling) is hard to read. `display.ts:104`: a Snare card placed when the card was not found in discard gets `card: ''`, so the tooltip shows "Snare".
- `Plates.tsx:16-22`: props `heroId` and `names` are unused. `aria-hidden={false}` is a no-op. Intent target (who is being attacked) is not shown.
- `info.ts:11-12`: status descriptions hard-code 50 % and 25 %, duplicating engine constants (`engine.ts:102-103`). Derive from a shared constant.
- `art.ts:8-61`: the unit/hero to silhouette tables are keyed by id in client code. Unknown ids silently fall back to `wanderer`. Better as an `art` field in content data; add a test that every `COMBAT_DB` unit/hero has an entry.
- `art.ts:99-110` and `proceduralArt.cardArtUrl` (`proceduralArt.ts:1100`): art is cached by `def.id` only (with `+` stripped). If a v2 card id equals an old-engine card id, or an upgraded card should look different, they share art. Prefix the id (`v2:`).
- `Fighters.ts:340-346`: `setHover` tweens are not tracked. `Fighters.ts:355`: `tick` writes `ring.alpha` for targetable figures every frame even when still mode (fine). `Fighters.ts:204-210`: textures created per `Texture.from(canvas)` are not destroyed on `remove` (reclaimed on scene destroy).
- `FightHand.tsx:67`: `aboveHand` uses `cardWidth * 1.5` from the bottom, which sits above a hovered card; dropping a card "slightly" above its resting spot but inside the hand band silently cancels with no feedback.
- `FightHand.tsx:153-160`: `hover` index is stored by index, so a card removed from under the pointer leaves `hover` pointing at the next card until pointer leave.
- `PileModal` (`FightView.tsx:763-787`): closing on `pointerdown` of the backdrop means the following click may land on the control underneath. Use `click`, and add Esc focus return.
- `fight.css`: reduced-motion only disables `.intent` and `.fight__end.is-ready`. Float, banner, flourish, `draw-in` and bar transitions still animate. Add them to the media query.
- `FightScreen.tsx:25-26`: `Date.now()`/`Math.random` for the seed is fine (client), but the chosen seed is not shown, so a bug cannot be reproduced. Show it in the title or the console.
- `FightScreen.tsx:40-41`: `onDone` ignores the result (fine for a preview; C4 must use it).

## Checked and OK
- Event replay covers every state-changing `CombatEvent` in `display.ts`; the final `g.display = clone(after)` resync keeps the screen equal to the engine, and batches chain strictly in order, so `after` of batch k equals the starting display of batch k+1.
- `pending.enemy` lock logic is correct for the normal path (enemy phase is one batch in PvE).
- Window listeners in `FightHand`/`FightView` are removed on cleanup; the drag effect is keyed on drag start only and reads props via a ref (no stale closure).
- Pixi destroy, `ResizeObserver.disconnect`, scene listeners and gsap kills on destroy are all present (`BattlefieldScene.destroy`, `Fighters.destroy`).
- All CSS custom properties used exist (tokens are written by `design/tokens.ts`, `--font-display` in `global.css`). Overlay z-order and `pointer-events` layering is consistent (`.fight > *` none, interactive pieces re-enabled; chips swallow clicks while aiming, which is minor).
- No card IDs are special-cased in the engine or the client rule paths. Turn display `ceil(turn/2)` is right for PvE (the turn counter increments per side).
