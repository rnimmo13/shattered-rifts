# Phase 5 review: juice pass and UI polish

Scope: `apps/web/src` (timescale, BattlefieldScene, Monsters, Traps, sfx, Hud, DuelView, replay, Prompts, play.css, CharacterPicker, Pickers, RunScreen, MapView, run.css, PlayScreen, TitleScreen, duel.css). Source files were read in full; none were modified. Nothing was run in a browser. Layout findings are computed from the CSS and the layout constants, so confirm them visually.

Counts: CRITICAL 0 / HIGH 3 / MEDIUM 11 / LOW 16

## What is sound
- `timescale.ts` is a clean single owner. Effective scale is base x the slowest hold, and `resetTimeScale()` runs from `BattlefieldScene.destroy()` before the heavy teardown. `Traps.endSlowMo()` releases the 'trap' hold on remove and destroy. The hit-stop timer is cleared in `destroy()`. The clock cannot stay slowed after leaving the duel, apart from the two cases noted below (M10).
- Shake restores the world position correctly. It uses `baseX/baseY`, and `fit()` rewrites the base and the position, so a refit during shake is overwritten next tick without drift. Shake and hit-stop are skipped when `profile.still` is set. Reduced-effects mode halves the shake and skips the freeze. `Math.random` is used only for visuals and audio noise.
- No engine rule leaks into the new code. Hud, DuelView and replay only render `view` and `legal`, with the exceptions in L14.

## CRITICAL
None.

## HIGH

### H1. Hit-stop re-arms on every impact, so multi-hit sequences leave the board almost frozen
- Files: `duel/scene/BattlefieldScene.ts:588-604`, `duel/scene/Monsters.ts:490` (hit) and `:574` (die, always `impact(6)`), `play/replay.ts:209`, `play/DuelView.tsx:170`.
- Each `impact()` calls `hitStop(ms)`, which sets the hold to 0.04 and restarts a real-time timer.
- Non-attack damage events are spaced `wait(120)` apart, and `unitDestroyed` waits 220 ms. A stop of 130 ms (amount >= 6, or any `die`) is longer than the 120 ms gap. For a sweeper or multi-target spell, a chain of lethal hits, or a face hit plus a death, the GSAP clock sits at about 4% for the whole sequence. Only the setTimeout-driven waits and the DOM animations keep moving.
- The result is frozen Pixi animation while the log, float numbers and ESS bar keep going. This is exactly the "UI feels frozen" risk.
- The stop ignores the speed setting. At 4x the replay waits are 30 ms, while 130 ms of hit-stop is a quarter of a second of animation time per hit. The `wait()` timers race ahead of the animations, so sequencing and animation drift apart.
- Fix:
  - Add a cooldown (for example, ignore a new hit-stop within about 250 ms of the last one ending).
  - Cap the total frozen time per replay batch.
  - Scale the duration by speed (`ms / base`).
  - Keep the maximum end time instead of resetting the timer to a possibly shorter one (see L2).
  - Ideally trigger hit-stop only from the attack-impact callback and big face hits, not from `die()` and every `hit()`.

### H2. The grown Self panel collides with the ActionBar, the hand and the Inspector (1024-1440 widths)
- Files: `play/play.css:188-204` and `:908-958` (panel), `:432-443` (actionbar), `:587-598` (inspect); `hand/Hand.tsx:124`, `hand/fanLayout.ts`.
- Phase 5 turned `.self` into crest + essence + gem + pips + counts. I estimate it at about 160 px tall plus 20 px offset, so its top is at about 11.4rem from the bottom.
- The old anchors were not moved:
  - `.actionbar` is at `bottom: 8.3rem` with the same z-index (30) and a later DOM position. Selecting a unit therefore draws the action bar over the top of the Self panel, covering the crest and your Essence bar at exactly the moment you are acting.
  - `.inspect` has `max-height: calc(100vh - 13rem)` from `top: 4.4rem`, so it ends at `100vh - 8.6rem`. It overlaps the Self panel by about 2.8rem when hovering a tall card.
  - At 1024 px the hand is 150 px cards with a spread of about 600 px, so the leftmost cards start near x = 140. The Self panel (about x 20-310, z-index 30) sits over hand cards (z-index 20), so the two leftmost cards are partly covered and unclickable. At 1440 px the overlap is only a few px.
- Fix:
  - Anchor `.actionbar` above the panel, for example `bottom: calc(1.25rem + var(--self-h) + 0.6rem)`, or move it beside it.
  - Reduce `.inspect` `max-height` to stay clear of the panel.
  - Compact the Self panel below about 1280 px (smaller crest, pips on the gem row, counts inline).
  - Or reserve the panel width in the Hand's `maxSpread` and centre calculation.

### H3. The Inspector hover reader is positioned against the document in the Sanctum, the card offers and the deck strip
- Files: `play/play.css:587-592`; used at `run/Pickers.tsx:132, 169, 213, 303, 344`.
- `.inspect` is `position: absolute; left: 1.25rem; top: 4.4rem`. In the duel it is anchored to the positioned `.duel`. In `.setup`, `.run`, `.deckstrip` and `.stage-panel` no ancestor is positioned, and `html/body/#root` are `height: 100%` with overflow scrolling the document.
- The reader is therefore placed 4.4rem from the top of the page, not the viewport. When the user hovers a starter-deck card below the fold (the usual case at 1024x768) it appears off-screen, and at scroll 0 it covers the character crests.
- DeckStrip exists so the player can read the starter deck, so its main job fails there.
- Fix: make `.inspect` `position: fixed` (it is full-viewport everywhere), or render it through a portal.

## MEDIUM

### M1. AudioContext created while suspended queues sounds that all fire at once
- File: `audio/sfx.ts:167-186, 308-316`.
- `ensure()` creates the context on the first `play()`, which may not follow a gesture (for example, a direct load of `#/play` or `#/run` then an automatic 'turn'/'deal'). The context stays `suspended`, so `currentTime` is frozen. Every recipe schedules at `currentTime + delay`, so on the first real click the whole backlog is released simultaneously as one loud burst.
- Fix: skip `play()` unless `ctx.state === 'running'`, after trying `resume()`. Better, create or resume the context in a one-shot `pointerdown/keydown` listener. Also handle `state === 'interrupted'` (iOS).

### M2. Hit-stop and shake duration ignore the speed setting
- Files: `BattlefieldScene.ts:588-604`, `timescale.ts:49-54`.
- Covered in H1. Scale by `base` and read the speed through `timescale.ts`, which should expose `getBaseSpeed()`.

### M3. The duel log stops auto-scrolling once it reaches 81 lines
- Files: `play/DuelView.tsx:175` (`[...cur.slice(-80), line]`), `play/Hud.tsx:164-167` (effect keyed on `lines.length`).
- After the cap the length stays at 81, so the effect never fires and new lines appear off-screen.
- Fix: key the effect on the last line plus a counter (or `lines`).

### M4. The turn banner is removed early at 2x and 4x
- Files: `DuelView.tsx:159-162` (timeout `900 / speed`), `play.css:333, 1041, 1061` (fixed 900 ms CSS animations).
- At 4x the banner is unmounted at 225 ms, about 25% through its keyframes, so it pops out fully opaque.
- Fix: set `animation-duration: calc(900ms / var(--speed))` or drive the removal from `animationend`.

### M5. DOM juice ignores prefers-reduced-motion and the Reduced effects toggle
- File: `play/play.css`. It has zero `prefers-reduced-motion` rules.
- Affected rules: `.dmgflash` (full-screen red or gold wash, `:1010-1030`), `.banner__streak`, `.banner span`, `num-pop`, `float-up`, `foe-pulse`, `end-pulse`, `dot-pulse`.
- The scene correctly gates its shake, flash and shockwave on `still`, but the DOM layer does not. `DamageFlash` is also rendered in `reduced` mode.
- Fix:
  - Add `@media (prefers-reduced-motion: reduce)` that disables these animations. For the flash, use a static, lower-opacity edge tint or none.
  - Add `.reduce-fx .dmgflash { display: none }`, since the root already has the `reduce-fx` class.
  - Consider rate-limiting the flash, because rapid hits can restart it more than 3 times per second.

### M6. Card hover/focus reading depends on disabled buttons
- File: `run/Pickers.tsx:93-103`.
- `disabled={props.disabled || !props.onClick}` means every DeckStrip card, the event card offer, the unaffordable merchant items and the read-only deck viewer are disabled buttons.
- Disabled buttons are not focusable, so `onFocus` is unreachable and there is no keyboard path to read the cards. Pointer events on disabled controls are also inconsistent across browsers.
- Fix: use `aria-disabled` plus a guard in the click handler, and keep the button focusable.

### M7. Sanctum character picker is a radiogroup without radio behavior
- File: `run/CharacterPicker.tsx:31-46`.
- Items have `role="radio"` but no roving `tabIndex` and no arrow-key handling, so all four are separate tab stops and ARIA expectations are not met. The practice screen reuses the picker.
- Fix: implement roving tabindex with Left/Right/Up/Down, or drop `role` and use `aria-pressed` buttons.

### M8. The map does not respond to resize, and its labels can collide
- Files: `run/MapView.tsx:100-101`, `run/run.css:346-368`.
- `window.innerWidth/innerHeight` are read during render with no resize listener, so the spacing only updates when something else re-renders.
- `COL_W` has a floor of 150 px but `.mapnode__label` is 10.5rem (168 px) wide. On narrow windows labels of neighbouring same-row nodes overlap.
- The first-floor label extends left of the map box and is clipped by `.mapwrap { overflow-x: auto }`.
- Fix: add a `useWindowSize` hook or a `ResizeObserver` on `.mapwrap`. Cap label width to `COL_W - 8`.

### M9. Accessibility semantics in the new HUD
- `Hud.tsx:116`: `aria-label` on a plain `div` (the mana gem) is not announced. Use `role="img"` or `role="meter"` with `aria-valuenow`.
- `Hud.tsx:106`: the same applies to `.self`, which has no role.
- `Hud.tsx:72`: `aria-label={props.name}` on the foe button replaces its content, so the enemy's Essence is not readable to a screen reader.
- `Hud.tsx:140` and `:156`: TurnPill is `role="status"` and Banner is `role="status" aria-live="polite"`, so every turn change is announced twice.
- `FloatNumbers` damage/heal values are not announced anywhere.
- `DuelView.tsx:892-899`: the speed buttons show their active state only through a glow (no `aria-pressed`).
- Modals have `aria-modal` but no focus move or trap.
- `RunScreen.tsx:240`: Resolve `aria-label` on a `span`.
- Fix: add roles and `aria-pressed`, make only one of TurnPill or Banner a live region, and focus the first control when a modal opens.

### M10. `resetTimeScale()` in `destroy()` is global, so a late-destroyed scene can clobber the live one
- Files: `BattlefieldScene.ts:606-616`, `DuelView.tsx:141-144, 178-186`, `main.tsx` (StrictMode).
- If a previous scene is destroyed after the next duel has started (a StrictMode double-mount in dev, or a very fast leave and re-enter during `create()`), it resets the new scene's base speed and holds to 1. The UI speed state would then disagree with the clock.
- The speed effect has no unmount cleanup, and speed resets to 1x on each "Duel again".
- Fix: make holds owned by the scene (`holdSlow(id)` keyed per scene with a release token) and only reset what that scene owns. Add `return () => setBaseSpeed(1)` to the speed effect cleanup. Consider remembering the player's speed in `localStorage`.

### M11. Loading spinner splits from its label
- File: `duel/duel.css:140-150, 312-322`.
- `.loading` is `display: grid` with `inset: 0`, so the `::before` ring and the text node become two stretched grid rows, which puts them about half a screen apart.
- Fix: use `grid-auto-flow: row; align-content: center; justify-items: center`, or wrap the content in a flex column.

## LOW
- L1. `BattlefieldScene.ts:348-379`: `slotAtClient` and `slotClientCenter` use the shaken `world.position` instead of `baseX/baseY`. Pointer hit-testing and the arrow endpoints wobble by up to about 26 px during shake.
- L2. `BattlefieldScene.ts:588-596`: a later, smaller hit-stop shortens an earlier, larger one. Track `endAt = max(endAt, now + ms)`.
- L3. `Traps.ts:306-308`: `slowTimer` is overwritten without clearing the previous one. A stale timer can release the new reveal's hold early. Call `endSlowMo()` first.
- L4. `Monsters.ts:496-522`: `killTweensOf(m.body.position)` leaves the old hit timeline's scale tweens and `onComplete` running. The old `onComplete` resets `body.position` to (0,0) mid-knockback when two hits land within 0.5 s. Kill the whole old timeline and keep a reference.
- L5. `timescale.ts:45` and `BattlefieldScene.impact`: `shakeFor(0)` is 3 px, so a fully absorbed (0 damage) hit still shakes, flashes (`playerHit` with amount 0), and shows "-0". Return 0 for amount <= 0.
- L6. `DuelView.tsx:625-628`: the `?bot` interval advances `globalTimeline.time()` by raw 33 ms per tick regardless of timescale, so the bot gets double-speed animation in a visible tab and defeats hit-stop and slow-mo. It is debug-only; skip it when `document.visibilityState === 'visible'`.
- L7. `sfx.ts`: no limiter on the master bus (`DynamicsCompressor`). Stacked layers (trapReveal alone is about 1.4 summed) clip at high volume. Linear volume is perceptually front-loaded (use `v*v`). `master.gain.value =` causes a click (use `setTargetAtTime`). At 4x there is no voice cap.
- L8. `sfx.ts:309` and `DuelView.tsx:855-889`: volume 0 with Sound on is silent but looks enabled. The volume slider previews only on pointerup, not with the keyboard.
- L9. `Hud.tsx:255-257`: `GameOver` replays its sound if it remounts (`busy` toggles), and a draw plays 'lose'.
- L10. `Prompts.tsx:68`: mulligan card width is computed from `window.innerWidth` at render with no resize handling.
- L11. `play.css:124-143` vs `:838-857`: stale `.foe` absolute/left/top/translate/z-index rules are overridden by `.foewrap .foe`.
- L12. `play.css:581-583`: `@media (max-width: 900px) .foe { min-width: 15rem }` is defeated by the higher specificity of `.foewrap .foe { min-width: 22rem }`. At 800 px the foe panel (x 224-576) also overlaps the header pill (about x 20-316).
- L13. Dead or duplicated CSS: `.self__manaMax`, `.play__panel`, the `.ess` height and `.ess__fill` transition duplicates, `.mull` flex-wrap rules, `.endturn` absolute vs `.corner .endturn` static. The Foe panel bottom is about 8.2rem and `.targetbar` starts at 8.6rem, so clearance is tight (about 0.4rem) and breaks if the panel grows.
- L14. The client duplicates campaign rules. `Pickers.tsx:225, 241, 272` hardcode "deck cannot go below 20 cards". `CharacterPicker.tsx:60` hardcodes "20 cards". Read the minimum from `@sr/campaign` and `deck.length` so the client does not decide rules (golden rule 3). `DuelView.tsx:391-396` `freeKeys` offers every slot, which is deliberate because the engine decides legality.
- L15. `TitleScreen.tsx`: the `locked` field and `#cta-note` id are unused. The label "Art preview" is a ghost link to the dev route. No functional issues.
- L16. Tests: `timescale.test.ts` covers combine and reset but not overlapping hit-stops, the stale-timer case, or scene-destroy mid-hold. `sfx` settings persistence and the suspended-context path have no tests.
- Also, the Sanctum "Import a run file" `<label class="btn">` wraps an sr-only file input, so keyboard focus is invisible (add `:focus-within`).

## Specific checks requested
- Stuck or wrong clock: the 'trap' and 'hitstop' holds are released on remove, destroy and their timers. Speed resets on scene destroy. The risks are M10 and the unscaled hit-stop (H1/M2). Preview `#/duel` uses the same scene and never sets speed, so it runs at 1x, and after a duel the destroy reset restores it.
- Two overlapping hit-stops: handled by a single timer (no leak), but with the shortening issue in L2.
- Scene destroyed mid-hold: the timer is cleared and the clock reset. OK.
- Real-time timers: replay `wait()` and banner use `setTimeout`, which desyncs from the GSAP clock during hit-stop (H1) and from CSS animations at speed > 1 (M4).
- AudioContext: see M1 and L7. There are no node leaks (oscillators and sources self-disconnect after stop), the `AudioContext` and webkit fallback are guarded, and `play()` swallows errors. Mute persistence works.
- Layout: see H2, L12, L13.
- Map and Sanctum: see H3, M6-M8.
