# Phase 3 review: monsters on the field

Scope (all under `apps/web/src`): `duel/scene/Monsters.ts` (new), `duel/scene/BattlefieldScene.ts`, `duel/DuelScreen.tsx`,
`hand/Hand.tsx`, `hand/fanLayout.ts`, `hand/hand.test.ts`, `duel/duel.css`. Read in full. No source modified. I did not run the app
or the tests. Findings are from reading the code. Where a claim depends on Pixi v8 or GSAP internals I say "verify".

Counts: CRITICAL 0 · HIGH 4 · MEDIUM 9 · LOW 9

---

## CRITICAL

None.

## HIGH

### H1. Module-level `texCache` outlives the scene and holds destroyed Textures
`Monsters.ts:48-56`, `BattlefieldScene.ts:536`
`texCache` is module scope. `BattlefieldScene.destroy()` calls `app.destroy(..., { children: true, texture: true })`. That destroys
the `Texture` of every Sprite still on stage, including the cached cut-outs of every living monster. The next duel mount
(Back, then re-enter; or HMR) calls `cutoutTexture()`, gets a destroyed Texture, and renders nothing or throws inside the renderer.
The demo opens with three opponent monsters on stage, so any leave-and-return after the summons hits this.
Fix: make the cache an instance field of `Monsters` (it dies with the scene). Alternatively clear it in `Monsters.destroy()`, or
check `tex.destroyed` before returning a cached entry. Also pass `texture: false` for these shared textures and destroy them
explicitly, so ownership is clear.

### H2. `Monsters.destroy()` leaves tweens, timelines and Promises behind
`Monsters.ts:580-600`; related `:182-192`, `:207-213`, `:312-361`, `:425`, `:440-528`, `:532-564`
`destroy()` only kills tweens whose targets are the monster's own display objects. Still alive after it:
- `tl.call(() => this.landingBurst(...), [], 0.32)` (`:192`). A scene destroyed within 320 ms of a summon runs `fx.addChild` on a destroyed container.
- Landing-burst tweens (`:207-213`), spark tweens (`:554-562`) and float-text timelines (`:425-428`). They target `fx` children that `app.destroy` has already destroyed, so GSAP writes to destroyed Pixi objects. `gsap.to(s.scale)` and `t.y` on a destroyed object are likely to throw (verify). The `onComplete` then calls `destroy()` a second time.
- The `die()` shard timeline `tl` (`:485`, shards are not in the kill list) and the `grey` tween (`:454`, target is the plain `grey` object). The latter keeps assigning `m.sprite.tint` on a destroyed sprite.
- `die()` Promise: on the `p.still` path the only completion is the `gsap.to([m.body, m.shadow], { onComplete: finish })` tween (`:463`). `destroy()` kills it, so the Promise never resolves. `finish()` also runs again after destroy and double-destroys `m.root`.
- `attack()` Promise: resolves only from the timeline `onComplete` (`:331-337`). Killing its child tweens shortens or alters the timeline, so resolution after destroy is accidental. `tl.call(... onImpact ...)` can still fire after destroy.
Fix: add a `destroyed` flag. Keep a `Set<gsap.core.Animation>` of every timeline and fx tween (register in summon, attack, hit, die, floatText, sparks, burst). In `destroy()`, kill them all, destroy the leftover fx objects, and resolve any pending `die`/`attack` resolvers (store `resolve` in a Set). Early-return from `summon`/`hit`/`attack`/`die` when destroyed. Wrapping the whole thing in one `gsap.context()` that you `revert()` is the simplest option.

### H3. `fit()` runs with stale `app.screen` size after a window resize
`BattlefieldScene.ts:214, 491-496, 512-528`; `DuelScreen.tsx:80-87`
Pixi's `resizeTo` plugin resizes on the next animation frame, not synchronously in the `resize` event. The scene's `onResize`
and DuelScreen's `apply` both run synchronously in that event. `fit()` therefore reads the old `app.screen` size. Worse,
`applyResolution` calls `renderer.resize(app.screen.width, app.screen.height, res)` with the old size, which can undo the pending resize.
After a resize or maximise the board stays fitted to the previous window, so the playable rows can end up under the hand strip.
Fix: subscribe to `app.renderer.on('resize', () => this.fit())` (that is the point where `screen` is current). In `applyResolution`,
call `renderer.resize(host.clientWidth, host.clientHeight, res)`. `setBottomReserve` can then keep calling `fit()`, which is idempotent.

### H4. Client-side "rules" in the demo are not separated from the real wiring (golden rule 3)
`DuelScreen.tsx:110-120, 122-140, 157-180, 258-297`
Guard subtraction and "guard 0 means dies" (`:157-167`), same-lane target choice (`:168-180`), free-slot choice (`:128-129`), the
slot-occupancy check in `probe` (`:117`), and mana deduction (`:136`) live inline in the same component and callbacks that will
become the production wiring. The only marker is a stale "Phase 2 preview" header comment and a toast. The test panel is rendered
unconditionally, so it ships in the deployed beta.
Fix: move every demo-only decision into one module (e.g. `duel/demo/previewRules.ts` plus `DemoPanel.tsx`) with a "PREVIEW ONLY, replaced by engine `legalActions()`/`GameEvent`s" banner. Render the panel only under `import.meta.env.DEV` or `?demo`. Keep `DuelScreen` to calling `scene.*` in response to events. Make the `Monsters` API event-shaped (`applyDamage(key, newGuard)`) so the engine can drive it later. Update the header comment.

---

## MEDIUM

### M1. Dying monsters stay "alive" to the UI (selection and targeting desync)
`Monsters.ts:87-98, 436-438`; `DuelScreen.tsx:153-156, 164, 174, 290`
`has()` and `keys()` include monsters with `dying === true` until `finish()` (about 1.1 s later). The selected key is only cleared in `.then(...)`.
Consequences:
- The panel keeps saying "Selected monster" and the buttons stay enabled while the ring is already gone (`die` calls `select(null)` internally).
- Buff on a dying monster plays the sound and glow (`setStats` doesn't check `dying`).
- A dying monster can be re-picked with a click (`pick`).
- `attack` can choose a dying foe as `target`.
- A second Defeat press returns `Promise.resolve()` at once and clears the selection early.
Fix: add `Monsters.isAlive(key)` (`has && !dying`) and use it in `pick`, `runSelected`, `probe` and `keys()` (add an `includeDying` flag). Clear `selected` synchronously when `die()` starts, via an `onDeath(key)` callback or by returning the key from `die`. Make `setStats` and `heal` ignore dying units. Decide whether a dying unit still blocks `summon` (today it silently drops the summon, `:103`).

### M2. Shard Textures are never destroyed
`Monsters.ts:477, 443`
Each death creates 6 to 12 `new Texture({ source, frame })`. `root.destroy({ children: true })` doesn't destroy textures, and they aren't in `texCache`. In Pixi v8 a Texture subscribes to its source events, so every death leaves listeners on the long-lived shared cut-out source (verify). Memory grows with each defeat.
Fix: keep the shard textures in an array and call `tex.destroy(false)` for each in `finish()` (the `false` argument keeps the shared source alive). Or reuse one set of frame textures per cut-out in a per-instance cache.

### M3. Repeated `hit()` and `attack()` fight each other
`Monsters.ts:312-361, 365-398`
- `hit` kills `m.body.position` tweens but not `m.body.scale` tweens (`:384, 393`), so overlapping hits animate scale concurrently.
- The killed timeline still fires its `onComplete` early, which resets position to 0 and decrements `busy` while the second timeline is still running. `tick()` then writes scale/skew/position.y over the live tween (jitter).
- A hit during a summon fight over `body.y`. The summon tweens `m.body` (`y`), the hit tweens `m.body.position`. They are different GSAP targets, so neither kills the other.
- `attack()` has no re-entrancy guard (`busy` is only a counter). Double-clicking Attack runs two timelines on `m.root`, fires `onImpact` twice, and `zIndex` is reset by whichever finishes first.
Fix: store the current timeline per monster per channel (`m.hitTl`, `m.attackTl`). Kill and revert the previous one before starting a new one. Reject `attack` while `m.attackTl` is active. Replace the `busy` counter with "any active timeline".

### M4. Reduced-effects setting barely affects monster motion; some prefers-reduced-motion cases not honoured
`Monsters.ts:176, 327, 373, 187, 462-466, 414-428`
- `mode === 'reduced'` only reduces shard count. Drop-in, squash, shake, lunge, and badge pop (1.7x to 1x) are full strength.
- With `still` (OS reduced motion), the lunge still travels 82% of the distance and springs back with `back.out`. The badge pop (`:259-263`) and the float-text drift and scale (`:426-428`) are unchanged. The full-alpha white hit flash (`:372`) is unchanged.
Fix: derive a `motion` factor from the profile (0 for `still`, about 0.5 for `reduced`). Scale lunge distance, shake amplitude, scale pops and drift by it. Under `still`, use crossfades and short flashes only (alpha 0.4 or less), no spring.

### M5. Stale drag state when the dragged card disappears
`Hand.tsx:99-102`
When the dragged card leaves `cards` (re-deal), the effect calls `onDragEnd()` but never clears `dragState`, `liveDrag` or `arrowState`. Because `onDragEnd` is an inline arrow in DuelScreen (new each render), the effect runs on every later render and keeps calling `setDragTargets(null)`. The stale state also confuses `dragRef`.
Fix: in that branch call `putDrag(null); setArrow(null);` and read `onDragEnd` through `endRef`, so it isn't a dependency.

### M6. Badge text re-rasterised on every tween frame
`Monsters.ts:254-256`
`b.text.text = String(Math.round(b.shown.v))` runs every frame for 0.4 s. Pixi regenerates the canvas texture on each assignment, even when the rounded value is unchanged. That is about 24 canvas texture builds per badge, per stat change, and GC churn at 60 fps.
Fix: `const s = String(Math.round(v)); if (s !== b.text.text) b.text.text = s;`.

### M7. New `Text` per hit/heal with a stroke
`Monsters.ts:408-429`
`floatText` constructs a fresh `Text` (canvas, stroke, `resolution = 2`) and destroys it afterwards. The cost lands on the same frame as the flash, shake and sparks. `Bebas Neue` may not have loaded when the first Text rasterises, so early text can be cached in the fallback font (verify the font is awaited before the scene is created).
Fix: pool a few float-text objects, or use `BitmapText` or pre-built number glyphs. `await document.fonts.load(...)` before creating the scene. Derive `resolution` from `renderer.resolution` instead of hard-coding 2.

### M8. Test panel is not keyboard-operable
`DuelScreen.tsx:142-151, 258-297`
Monsters can only be selected by pointer on the canvas (`onPointerDown` on a div). Keyboard and screen-reader users cannot select a monster, so every panel button stays disabled for them. The "Selected monster" title is not a live region. Focus is dropped to `body` when the buttons disable themselves after a death.
Fix: add a roving `role="listbox"` or a `<select>` of current monsters (`Monsters.keys()`) in the panel, with arrow-key selection. Make the title `role="status"` with the monster name. Keep focus on the panel when the selected monster dies.

### M9. Selection ring tweens have no overwrite
`Monsters.ts:295-305`
Fade-in and fade-out tweens on `ring.alpha` are stacked without `overwrite`. Rapid select/deselect leaves two live tweens, and the later-created one wins even if it is the stale one.
Fix: add `overwrite: true`, or `gsap.killTweensOf(ring)` before each tween. `highlightSlots` already uses `overwrite: true`.

---

## LOW

- L1. `Monsters.ts:318-319, 359`: magic coordinates (`960`, `420`, `900`) for "opponent's back line", and `void dir` leaves an unused variable. Use `stage.width / 2` and `rows.*` from `layout.ts`; delete `dir`.
- L2. `Monsters.ts:575`: after summon or hit finishes, floaters jump from `y = 0` to `-7 + sin`. Ease the idle offset in (lerp `body.y` toward the target).
- L3. `Monsters.ts:539, 563` / `BattlefieldScene.ts:197`: slot lookup is `slotViews.find(slotKey(...))`, which allocates strings per call. Build a `Map<string, SlotView>` once. `Monsters.sparks` ignores `p.particles` for the death burst (`16`/`6`) while the landing burst respects it.
- L4. `Monsters.ts:421`: `t.zIndex = 9000` has no effect because `layers.fx` doesn't have `sortableChildren`. Additive bursts added later draw over damage numbers. The fx layer also sits under the mid/near fog and motes, so damage numbers get fogged. Set `fx.sortableChildren = true`, or add a separate overlay layer above fog.
- L5. `Monsters.ts:164, 424, 501-518`: `Math.random()` in presentation is fine under the golden rules (the engine is where it's banned), but it makes visual tests unrepeatable. Take an injectable `rng` in `MonsterHost`.
- L6. `DuelScreen.tsx:139, 163`: un-tracked `setTimeout`s (toast clear, delayed die). A late toast timer clears a newer toast early; on unmount they fire against a destroyed scene (they are harmless only because `units` is cleared). Keep ids in refs and clear them in cleanup.
- L7. `DuelScreen.tsx:143-151`: `pick` accepts any mouse button and runs on pointerdown for right-click and drag-starts. Check `e.button === 0` and use `onClick`.
- L8. `hand/hand.test.ts:87-90`: "reserve covers only the visible part" passes for any reserve below `1.4 * w`, so it does not pin the `HAND_SINK` relationship. `fanLayout.ts:59` hard-codes `1.05` (= `1.4 - HAND_SINK`) and `Hand.tsx:195` hard-codes `1.4`. Export `CARD_ASPECT = 1.4`, define `handReserve = w * (CARD_ASPECT - HAND_SINK) + 12`, and test against that. No test covers the `Monsters` stat/selection logic or `HAND_SINK`.
- L9. `duel.css`: only `.loading` and `.toggle` honour `prefers-reduced-motion`. `toast-in`, `.mana__btn` transitions and the new `.duel__tests` have no reduced-motion rules. `.duel__tests` (`:276-291`, fixed `left:1.25rem; top:4rem`) is not responsive and can overlap the board on narrow viewports. `.mana` (`aria-label` on a role-less `div`) is ignored by assistive tech: give it `role="group"`. Also `Hand.tsx:250-253`: the armed-drag card is scaled around `transform-origin: 50% 120%`, so its centre ends up about 0.2 card widths away from the arrow origin the maths assumes (cosmetic).

---

## Checked and found fine
- Drag y-offset maths with `HAND_SINK` (`Hand.tsx:206-218`) is consistent with the slot `bottom` offset. The hovered card (scale 1.5, origin 50% 120%) clears the screen edge.
- `liveDrag` ref pattern for fast pointer events is sound apart from M5. `endDrag` re-derives `wasArmed`.
- Idle `tick()` correctly skips `busy`/`dying` monsters, and it allocates nothing per frame. No per-frame allocations in `BattlefieldScene.tick` beyond the existing motes loop.
- Slot dim/overwrite: `overwrite: true` on `v.glow` and `v.dim` is correct. The off-then-on `highlightSlots` calls on drag end collapse to one tween.
- `Monsters` demo-summon timers are cleaned up in the effect; scene creation handles cancellation (`cancelled` flag) correctly, including StrictMode.
