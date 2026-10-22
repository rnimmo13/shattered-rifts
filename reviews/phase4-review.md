# Phase 4 review: trap sigils, reveal sequence, favicon

Scope: apps/web `Traps.ts`, `cardFace.ts`, `BattlefieldScene.ts`, `Monsters.ts` (SoundName), `DuelScreen.tsx`,
`previewHarness.ts` + test, `public/favicon.svg`, `index.html`. Paths relative to `apps/web/`.
Checked against pixi.js 8.22.0 sources in node_modules. `vitest run src/duel`: 14/14 pass. No source modified.

Counts: CRITICAL 0 / HIGH 2 / MEDIUM 8 / LOW 8

## CRITICAL
None.

## HIGH

### H1. Removing a trap mid-reveal crashes the timeline, and the stale onComplete can remove a different trap
- `src/duel/scene/Traps.ts:229-236` (remove), `:310-314` (flip `tl.call`), `:278-285` (onComplete).
- `remove()` kills tweens on the trap's objects and destroys `t.root`, but it does not kill the reveal timeline. That timeline keeps running:
  - At `:310-314` the call does `t.cardSprite.texture = faceTex; ...anchor.set(0.5, 1)` on a destroyed Sprite. In Pixi v8 `Sprite.destroy` nulls `_anchor`, so this throws `TypeError` inside gsap's ticker callback. The rest of the sequence is skipped (burst, name flash, `onEffect`, dim fade), so the dim sheet can stay at 0.62 and the promise never resolves.
  - `:278-285` `onComplete` calls `this.remove(key)` by key. If the caller removed the trap and then `set()` a new trap on the same key during the roughly 2.5 s sequence, the stale timeline deletes the NEW trap.
  - Later `to()` calls on `t.card`, `t.seal`, `t.core` also target destroyed objects.
- Fix: keep the reveal timeline and resolver on the Trap (`t.revealTl`). `remove()` must either refuse/defer while a reveal is running, or kill that timeline, tween `dim` to 0, call `endSlowMo()`, and resolve the promise. Capture the `Trap` object, not the key, in `onComplete` and only remove if `this.traps.get(key) === t`. Guard the `tl.call` callbacks with `t.root.destroyed`.

### H2. Face-down trap definition is kept on the client Trap, and the API invites passing it
- `src/duel/scene/Traps.ts:100` (`set(key, faceDown, def?)`), `:20`/`:161` (`def` stored on every Trap incl. face-down), `src/duel/DuelScreen.tsx:109-110`, `:154-155`.
- Hidden-information rule: the client must never know a face-down card. `Traps.set` accepts and retains `def` for a face-down trap (the field is never read afterwards). The preview passes the real def for face-down ENEMY traps (`DuelScreen.tsx:109`) and keeps it in `trapDefs`. When wired to `viewFor()`, copying this call shape would put the secret in client memory and in devtools (`__scene.traps`).
- The reveal path itself is correct: `reveal(key, def)` receives the def only at spring time, and `cardFaceCanvas(def)` is first called then.
- Fix: split the API into `setFaceDown(key)` (no def) and `setFaceUp(key, def)`. Drop `def` from the Trap when face-down. Mark `trapDefs` in `DuelScreen.tsx` with a loud `PREVIEW ONLY - delete when wired to viewFor()` comment (currently the comment is present but mild) and add a test that face-down view slots carry no def.

## MEDIUM

### M1. Reveal layers sit below the fog and motes, so the dim does not cover everything
- `src/duel/scene/BattlefieldScene.ts:199-205` vs `:233-239`.
- `layers.dim` and `layers.reveal` are added to `world` before `fogMid`, `moteLayer`, `fogNear`, so those draw on top of the dim sheet, the flying card and the TRAP SPRUNG title. The comment at `Traps.ts:38` says "drawn above everything".
- Fix: add `dim` and `reveal` after `fogNear` (keep `units/traps/fx` where they are).

### M2. Global slow-mo via `gsap.globalTimeline.timeScale` affects unrelated tweens; overlapping reveals fight over it
- `src/duel/scene/Traps.ts:272-276`, `:346-350`, `:498-500`.
- It slows the hand fan, drag, slot glows, monster tweens and any other gsap use. A second `reveal()` within 650 ms overwrites `this.slowTimer` without clearing the first timer; the first timer then fires `endSlowMo()`, which clears the second timer handle and ends slow-mo early. Slow-mo cannot get stuck (destroy resets it), but it is wrong. `destroy()` resetting the global to 1 would also clobber any other consumer.
- Fix: put scene tweens in a scene-owned `gsap.timeline()` and slow only that, or `clearTimeout(this.slowTimer)` before setting a new one and refcount.

### M3. Overlapping reveals share one dim sheet with no ownership
- `src/duel/scene/Traps.ts:266-271`, `:334`; `src/duel/DuelScreen.tsx:319` (Spring stays enabled during a reveal).
- `reveal()` only blocks the same key. Springing a second trap uses `overwrite: true` on `dim`, which can kill the first sequence's pending dim fade; the first sequence's later fade-to-0 can brighten the board in the middle of the second reveal. Both cards and titles fly to the same spot.
- Fix: serialise reveals (promise queue) or ref-count the dim and only fade at 0. Disable Spring while a reveal is active.

### M4. Reduced motion: white flash and shockwave still play when `still` is true
- `src/duel/scene/Traps.ts:353-391` (burst).
- `if (!p.still)` only guards sparks. The full white additive flash scaling to 7x and the 14x shock ring always run. This is a photosensitivity concern for prefers-reduced-motion users. Slow-mo and shake also run in the "reduced effects" mode (only skipped when `still`).
- Fix: when `p.still`, skip flash and shock (or a short low-alpha fade with no scaling). Consider dropping slow-mo and shake in `reduced` mode too.

### M5. Card canvases are cached before web fonts are loaded
- `src/art/cardFace.ts:112-150`, `:166`, `:225`; `src/duel/scene/Traps.ts:398-409` (Pixi `Text`, Cinzel 900).
- `@fontsource` faces load lazily on first DOM use. Canvas drawing with an unloaded face renders the fallback and `faceCache` keeps it forever. Bebas Neue, Cinzel 900 and Source Sans 600 may not have been requested yet at the first reveal. The Pixi title is measured with the fallback too.
- Fix: `await Promise.all([...].map(f => document.fonts.load(f)))` for the four font specs in `BattlefieldScene.create` before first draw, or skip caching until `document.fonts.check(...)` passes.

### M6. Texture/canvas retention and incomplete cleanup
- `src/duel/scene/Traps.ts:58`, `:77`, `:81-88`, `:518-519`; `src/art/cardFace.ts:82`, `:170`.
- `ringTex` is per `Traps` instance and only freed by `app.destroy` if some sprite still uses it (leaks when no traps are on the board). `texCache.clear()` drops references without `destroy()`. Face/back textures are never released after a trap is spent (worst case about 74 x 300x420x4 B, roughly 37 MB GPU plus canvases). `app.destroy(..., {texture:true})` calls `texture.destroy()` without `textureSource:true`, so GPU sources are not freed (matters on repeated mount/unmount).
- Fix: in `Traps.destroy()` call `ringTex.destroy(true)` and destroy each `texCache` texture with `true` before clearing; optionally destroy the face texture after its reveal.

### M7. Spring and selection accessibility
- `src/duel/DuelScreen.tsx:179-189`, `:250`, `:310-320`.
- Selecting a trap or monster is pointer-only (`onPointerDown` on a non-focusable div), so keyboard users cannot select a trap and cannot reach Spring. The aside's `aria-label` still says "Monster animation tests". The reveal is not announced to assistive tech. After Spring, the button turns `disabled` and focus is dropped to `<body>`.
- Fix: add a keyboard path (e.g. a list of selectable traps/monsters as buttons), rename the aside label, announce "Trap sprung: <name>" via the existing `role="status"` toast, and keep focus (use `aria-disabled`).

### M8. A trap that is mid-reveal can be re-selected
- `src/duel/DuelScreen.tsx:179-189`, `src/duel/scene/Traps.ts:216-227`.
- `pick` can select a trap that is mid-reveal (`traps.has` is still true): the gold ring fades in on the lifted sigil and React `selected` points at a trap about to vanish. `select()` has no `busy` guard.
- Fix: `if (t.busy) return` in `select`, or expose `isRevealing(key)` and ignore it in `pick`.

## LOW

- L1. `Traps.ts:62-67` `track()` prunes finished animations only above 150 live, so finished tweens keep references to destroyed sprites. Delete from `live` in an `onComplete`/`onInterrupt` instead.
- L2. `Traps.ts:353-391`, `:448-480`: spark counts (22 + 6..16) and the 14x additive shock ring (about 3500 px wide) and 7x flash are not scaled by `p.particles`; fill-rate spike on weak GPUs. Scale by profile and cap shock reach in reduced mode.
- L3. `Traps.ts:486` `this.traps.values()` allocates an iterator per frame; use a cached array updated on set/remove (negligible).
- L4. After unmount, pending resolvers (`Traps.ts:520`) call `setSelected` in DuelScreen, and `damage()`'s `window.setTimeout(... monsters.die ...)` (`DuelScreen.tsx:221`) can fire on a destroyed `Monsters`. Harmless today; track and clear the timeout, add a mounted ref.
- L5. Dev globals (`DuelScreen.tsx:68`) are correctly guarded by `import.meta.env.DEV` (Vite replaces it with `false`, so they are tree-shaken in production; `types: ["vite/client"]` is set; gsap is bundled anyway via the scene). They are never deleted on unmount, so a destroyed `__scene` stays referenced in dev.
- L6. `SoundName` lives in `Monsters.ts` and `Traps.ts` imports a type from a sibling implementation. Move it to `scene/sound.ts`.
- L7. Favicon: `%BASE_URL%favicon.svg` (`index.html:6`) is correct. Vite substitutes it, `deploy.ts:46` sets `SR_BASE=/${name}/` (leading and trailing slash), and the default `'/'` covers dev and a custom domain. Caveat: a custom-domain deploy must not keep `SR_BASE=/name/`. SVG-only favicon is unsupported by older Safari; add a PNG/ICO fallback and an apple-touch-icon.
- L8. `previewHarness.ts`: correctly labelled preview-only. `UNIT_SLOT_COUNT = 5` and `TRAP_SLOT_COUNT = 4` duplicate the counts in `layout.ts:81-84`; derive from there. `isTrapKey` uses `includes('-trap-')`; use a slot-key parser. Tests do not cover `opp-` keys for the trap helpers.

## Checked and OK
- Pixi v8: `Texture.from(canvas)` is cached by canvas and the cache entry is removed on texture destroy (so remount is safe). `Texture.WHITE.destroy` is a NOOP, so the dim sheet is safe under `texture:true`. `Text` options (stroke object, `dropShadow {color, blur, distance, alpha}`, `resolution`) are valid in v8. Reparenting `t.root` into `layers.reveal` is fine (same `world` space). `root.destroy({children:true})` does not destroy shared textures; no double destroy of `glowTex`/`ringTex`.
- Scene destroy: `Traps.destroy()` kills tracked tweens, resets `timeScale`, kills dim tweens, resolves pending promises; the reveal `onComplete` is guarded by `destroyed`. Unmount mid-reveal does not leave slow-mo on or tween destroyed objects.
- Hidden info at reveal: the def reaches `reveal()` only at spring time.
- `reveal()` on a trap that is already revealing or still animating in resolves immediately (`busy` guard); a trap cannot be sprung for about 0.55 s after being set.
