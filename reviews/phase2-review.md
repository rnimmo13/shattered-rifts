# Phase 2 review: hand, cards, procedural art, drag targeting

Scope: `apps/web/src/{art/proceduralArt.ts, cards/*, hand/*, duel/DuelScreen.tsx, duel/scene/BattlefieldScene.ts (setDragTargets, slotAtClient, slotClientCenter)}` and `apps/web/package.json`.
Verified: `pnpm --filter @sr/web typecheck` is clean; `vitest run apps/web` passes (23 tests). No source was modified.

Counts: CRITICAL 0, HIGH 4, MEDIUM 8, LOW 7.

---

## CRITICAL
None. Nothing crashes in the normal flow or corrupts engine state (the client holds no engine state in Phase 2).

## HIGH

### H1. Drag state is orphaned if the dragged card leaves `cards` or Hand unmounts mid-drag (hand goes dead)
`hand/Hand.tsx:55-61, 151-161, 207-211`, `duel/DuelScreen.tsx:156-158`
`drag` is only cleared by pointerup/cancel on the dragged slot. If the card disappears while held, the slot element is unmounted and no `pointerup` or `pointercancel` ever fires. Triggers: the "Deal new hand" button (reachable with a second pointer or touch), the auto re-deal timer, or any future engine event such as the opponent bouncing the card.
Result:
- `drag` stays non-null, so `onPointerEnter` (`if (drag) return`) and `tilt` (`if (drag) return`) never run again.
- The dead drag has `focusIdx = -1` and `armed` possibly true, so the fan layout is frozen.
- The TargetingArrow stays on screen.
- `onDragEnd` is never called, so the scene keeps lit and dimmed slots.
Fix: add an effect `useEffect(() => { if (drag && !cards.some(c => c.uid === drag.uid)) { setDrag(null); setArrow(null); onDragEnd?.(); } }, [cards, drag])`. Also add an unmount cleanup that calls `onDragEnd` if a drag was active (keep a `dragRef`). Also handle `lostpointercapture` (see M1).

### H2. Scene tweens on `v.ring` are not killed in `destroy()`, so unmounting mid-drag throws inside GSAP
`duel/scene/BattlefieldScene.ts:282, 492`
`setDragTargets` tweens `v.ring.alpha`, but `destroy()` only runs `gsap.killTweensOf(...glow)`. Navigating "Back" (or a StrictMode remount, or the cancelled-init path) while a 0.25 s ring tween is live makes GSAP write `alpha` on a destroyed Pixi Sprite on the next tick. Pixi 8 can throw or log errors there.
Fix: `gsap.killTweensOf([...this.slotViews.flatMap(v => [v.glow, v.ring])])` before `app.destroy`. Also pass `overwrite: 'auto'` to both `gsap.to` calls (see L3).

### H3. Procedural art is generated synchronously in render and encoded on the main thread
`art/proceduralArt.ts:999-1107`, `cards/Card.tsx:404`
Mounting a 7-card hand calls `cardArtUrl` 7 times inside `useMemo` during render. Each call paints two canvases (420x560 and 640x480), does 12 radial gradients, ~700 `fillRect`s and a silhouette painter, then `toDataURL('image/webp')`. The WebP encode is synchronous and typically 15-60 ms per card. A first paint of a fresh hand will plausibly block the main thread for 150-400 ms. The same stall hits every "Deal new hand" and the 1.2 s re-deal, and it lands in the deal-in animation. That breaks the 60 fps target.
Related costs:
- Safari does not encode WebP and silently falls back to PNG, which is slower and much larger.
- `cache` retains both source canvases forever, about 2.1 MB of bitmap per card, so about 155 MB if all 74 cards are seen. The `urlCache` string is a duplicate on top of that.
- `<img>` decode of large data URLs happens on first paint.
Fix:
- Prewarm art during the "Opening the rift…" load or in `requestIdleCallback` chunks (one card per task), not in render.
- Use `OffscreenCanvas.convertToBlob` plus `URL.createObjectURL`, or `canvas.toBlob`, which are async.
- After the blob URL exists, drop `window` from the cache and keep `cutout` only when Phase 3 needs it (generate it lazily).
- Add `decoding="async"` to the `<img>` at `Card.tsx:417`.
- Make the type guard `cardArt` / `cardArtUrl` return a placeholder until ready, then swap.

### H4. Hand is pointer-only: no keyboard or screen-reader path, and ARIA is misapplied
`hand/Hand.tsx:198-220`, `cards/Card.tsx:409-455`
- A game card in the hand has no `tabIndex`, no `role`, and no key handlers. Playing a card is only possible by pointer drag, so keyboard-only and switch users cannot play.
- `aria-label` on the plain `div`s (`Card.tsx:423, 440, 443`) is ignored or invalid without a role.
- The card root has no accessible name or description (cost, type, rules).
- Refusal and success feedback is visual only (shake, toast). The toast `<p>` has no `role="status"` / `aria-live`.
- The drag-over valid/invalid state is colour-only (cyan vs red arrow).
Fix:
- Give each slot `role="button"`, `tabIndex={0}` (roving), and `aria-label="<name>, cost N, <type>. <rules>"`.
- Add Enter/Space to pick up, arrows to cycle targets (`validSlotKeys`), Enter to confirm and Esc to cancel.
- Add `aria-live="polite"` on the toast.
- Differentiate valid/invalid by shape or icon as well as colour.
- Mark decorative `aria-label`s on the stat divs as `role="img"` or fold them into the card label.

---

## MEDIUM

### M1. Pointer-drag edge cases: capture loss, multi-pointer, Escape, resize
`hand/Hand.tsx:119-161`
- Pointer capture is set but there is no `onLostPointerCapture`. If capture is lost (element re-parented, browser gesture, DOM change under the slot), the drag stays latched with no further events. Handle `lostpointercapture` the same as cancel.
- Capture is set on `e.currentTarget` but the handlers use `drag` state from the render closure. Both sides are fine today, but there is no `isPrimary` check. A second finger or mouse on another card calls `startDrag` and overwrites `drag`. The first pointer stays captured to a slot whose `endDrag` now bails (`drag.uid !== card.uid`), and `onDragStart` fires twice. Guard with `if (!e.isPrimary || drag) return`.
- No Escape or right-click cancel. A player who changes their mind can only drop on an invalid spot. Add a `keydown` Escape listener while dragging and ignore `contextmenu`.
- `origin` is captured once at drag start (`originOf()`), so a window resize or mobile address-bar change mid-drag leaves the arrow origin stale. Recompute on `resize` or in `moveDrag`.
- `setPointerCapture` can throw `NotFoundError` if the pointer is already gone. Wrap in try/catch.
- The refuse timeout at line 125 is never cleared on unmount. It is harmless in React 19 but is a stray timer; store the id and clear it in an effect.

### M2. Whole Hand re-renders on every pointermove; ref callback defeats `memo(Card)`
`hand/Hand.tsx:139-148, 226-229`, `cards/Card.tsx:401`
Each pointermove while dragging calls `setDrag` and `setArrow` with new objects, so Hand re-renders (up to 120 Hz on high-rate mice). Because `ref={(el) => ...}` is a fresh closure each render, React re-runs the ref (null then element) for every card on every move and also fails `memo`'s bailout, so all 7 Cards reconcile every move. Fixes:
- Memoise the ref callbacks per uid, or register in `useLayoutEffect` using `data-uid` queries.
- Keep pointer coordinates in a ref and move the dragged slot and arrow imperatively (rAF-throttled `style.transform` / `setAttribute('d')`). Only commit React state on armed or valid transitions.
- Throttle `probe()` (it does a linear scan of 18 slots plus `getBoundingClientRect`, and is also called again at drop). Cache `host.getBoundingClientRect()` and invalidate on resize.

### M3. Card CSS runs many always-on animations and blend modes
`cards/card.css` (`.card__fx--shimmer`, `--holo` with `mix-blend-mode: color-dodge` and `hue-rotate`, `.card__edge` pulses, `gem-spin`, `playable-pulse`)
Every playable card has an infinite opacity pulse, rares have a screen-blend shimmer, and legendary and mythic cards have color-dodge holo plus a filter animation, plus `filter: drop-shadow` on every `.card`. With 7 cards there is up to 14+ concurrent animations, each forcing re-composition of a 750x1050 face with blend modes. Expect GPU/paint cost on low-end laptops. Fix:
- Run shimmer, holo and gem-spin only on `:hover` / the focused card; keep the idle state static.
- Drop `mix-blend-mode: color-dodge` in favour of a pre-blended gradient overlay.
- Use `will-change: opacity` only on animated layers.
- Respect `.reduce-fx` for the pulses too (currently `.card__edge` is covered but `playable-pulse` on `.is-playable .card__edge` is covered only via `.card__edge`, which is fine; the shimmer on hover is not paused when the tab is hidden).

### M4. Targeting arrow SVG is expensive per frame
`hand/TargetingArrow.tsx:17-35`, `hand/hand.css:54-102`
A full-viewport `<svg>` (100vw x 100vh) with a Gaussian-blur filter on a path that changes every pointermove, plus `filter: drop-shadow` on the head and an infinite `stroke-dashoffset` animation, repaints the whole filtered layer each frame. The blurred filter region also uses the default `objectBoundingBox` units, which can clip the glow for near-straight paths. Fixes:
- Replace the filter blur with a second wider, lower-opacity stroke (already there: the glow path), or use CSS `drop-shadow` on a small group only.
- Set `filterUnits="userSpaceOnUse"`, or drop the filter entirely.
- Size the svg to the path bbox instead of 100vw x 100vh.
- Animate dash offset via `stroke-dashoffset` on a path whose `d` changes, which forces a repaint anyway, so consider a static dashed texture.

### M5. `setDragTargets(null)` clobbers the "Show playable slots" toggle
`duel/DuelScreen.tsx:95-97, 133`, `BattlefieldScene.ts:277-284`
`onDragEnd` calls `setDragTargets(null)` which calls `highlightSlots(null)`, turning every glow off even when `lit === true` (the toggle). After one drag the toggle reads "on" but nothing glows. Also `onDragStart` replaces the all-lit state. Fix: after drag end call `scene.highlightSlots(lit ? 'all' : null)`, or let `setDragTargets` accept a baseline.

### M6. Arming gate can make low or short viewports unplayable
`hand/Hand.tsx:36, 138`
A drop only plays if `wasArmed`, and arming needs the pointer to rise `ARM_RISE + 0.4*cardW` (about 150 + 52-92 px) above the hand anchor. On short windows (laptop with a bookmarks bar, mobile landscape) the player's unit and trap slots can sit within that distance of the bottom edge, so a direct drag onto a visible slot never arms and the card snaps back. Fix: arm when the pointer leaves the hand's bounding box OR enters a valid slot (probe), or scale `ARM_RISE` to `min(150, 0.2 * innerHeight)`.

### M7. Client-side rule decisions (preview only, but must be isolated before the duel is wired)
`hand/dropRules.ts:11-31`, `duel/DuelScreen.tsx:77-86`, `hand/Hand.tsx:121, 196`
Golden rule 3: the client must only offer `legalActions()`. `isPlayable` (cost <= aether), unit/trap slot counts (`UNIT_SLOTS = 5`, `TRAP_SLOTS = 4`), the `me-` side key prefix, and `SPELL_CAST_LINE` (a pixel threshold deciding whether a spell is "cast") are client-owned rules. The file header acknowledges this is a Phase 2 preview, which is acceptable now. Risks to close before the duel is wired:
- `dropKind` sends every unknown type (`rift`, `sigil`) to `'spell'`, so those would show as castable anywhere.
- Occupied slots are not excluded.
- Spell targeting (single-target spells) is not modelled.
- `isPlayable` ignores free-cast and cost-reduction effects.
Fix when wiring: derive `valid`, `snap` and playability solely from `legalActions(state)` (action to slot mapping), delete `UNIT_SLOTS` / `TRAP_SLOTS` / `isPlayable` from the client, and add a TODO(DECISIONS) note so they are not left behind. Re-check affordability on drop, since `aether` is read at pointerdown but may change before pointerup.

### M8. Missing tests for the interactive logic
`hand/hand.test.ts`
Tests cover only the pure helpers (fan, drop kinds, rules text, archetypes). Nothing covers drag state transitions (arm, cancel, drop, unmount), `arrowControl` (imported nowhere in tests), or `slotAtClient`'s ellipse hit-test and `slotClientCenter` (pure maths once geometry is injected). `archetypeOf` "every card gets a subject" is vacuous because the function always returns `'wanderer'` as fallback. Add: arrowControl cases (zero length, vertical), drag reducer tests if the logic is extracted to a pure reducer, and a hit-test test using `slotGeometry()` with a stubbed world transform.

---

## LOW

- L1. `hand/Hand.tsx:67-81`: the deal-in effect depends on `entered`, so it re-runs and re-creates timers after each card enters; cancelled timers for cards not yet entered are recreated with new stagger offsets, so a rapid sequence re-staggers from `i=0`. Functionally ok, but it can compress or extend timing. Track pending ids in a ref instead.
- L2. `duel/DuelScreen.tsx:88-93`: the toast `setTimeout` is never cleared, so a second play within 1.8 s has its toast removed early by the first timer. Keep the id in a ref, clear on replace and on unmount.
- L3. `BattlefieldScene.ts:265, 282`: overlapping `gsap.to` calls on the same target property without `overwrite: 'auto'` pile up on fast pick-up and cancel cycles.
- L4. `hand/TargetingArrow.tsx:11`: `useId().replace(/:/g, '')` assumes colon-style ids. React 19 uses `«r0»` / `_r_0_` style ids; `url(#g«r0»)` may not resolve in some browsers. Use `.replace(/[^a-zA-Z0-9_-]/g, '')`.
- L5. `cards/Card.tsx:448`: `title={def.rarity}` on the gem (mouse tooltip only; rarity is conveyed only by colour and effects, so also add it to the card's accessible label). `def.tribes.join(' ')` rendering ("Human Knight") loses the separator between tribes.
- L6. `art/proceduralArt.ts:1014`: `void big;` leaves dead code (`big` is computed and unused; either use it to scale legendary/mythic silhouettes or remove it).
- L7. `package.json`: `@sr/web` has no `test` script, so tests only run via the root `vitest.config.ts` glob (fine, matches the existing convention). `@types/react` / `react` versions line up. No dependency issues found. Consider adding `eslint-plugin-react-hooks` coverage: `Hand.tsx` closures over `drag` would be flagged by `exhaustive-deps` if hooks were used there.

## Checked and fine
- No `Math.random` in the art (seeded `rng(hashSeed(def.id))`), so cards look identical across sessions.
- Pointer capture is correctly set on the slot, so `pointerup` is received outside the element in the normal path.
- `useCardWidth` removes its resize listener; the deal-in effect clears its timers; BattlefieldScene `destroy()` removes its window and host listeners.
- `parseRules` renders text through React nodes (no `innerHTML`), so no XSS path from card text.
- No Yu-Gi-Oh trade dress found: the frame is a custom bezel with realm-coloured metal, a top-left cost gem, a left-banner name plate, and bottom corner stats, using original silhouettes, so it does not copy the franchise layout. (Design call, not a legal one: a cost gem plus an attack/defence pair in bottom corners is a common genre idiom; the stat names here are Power / Guard, which is original.)
- Hit-testing in `slotAtClient` / `slotClientCenter` is consistent with `fit()` (world scale and position are CSS px thanks to `autoDensity`), and parallax moves only background layers, not `world`, so the maths holds.
