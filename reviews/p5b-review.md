# P5b review: duel animation queue, avatars, card layout

Scope: apps/web/src (play/DuelView.tsx, session.ts, replay.ts, prefs.ts; duel/scene/Avatars.ts, BattlefieldScene.ts, Monsters.ts, Traps.ts, layout.ts; art/avatars.ts, proceduralArt.ts avatarCutout; cards/card.css, Card.tsx).
Counts: CRITICAL 0, HIGH 2, MEDIUM 6, LOW 9.

## Verdict on the queue design (answers to the specific questions)
- Can the AI act before the previous replay finishes? Its state mutation happens early (engine apply runs before onBatch), but its batch returns `queue`, so its replay always runs after every earlier replay, and the next `ai.choose` waits for it. Replay ordering is correct: human and AI batches are serial.
- Can onIdle enable input while the human's own animations run? Yes, by design. Side effects are H1, M1 and M2.
- reconcile() against a stale `after`: inside the serial queue it is not stale (batch N reconciles before N+1 starts). The only stale case is the watchdog zombie (H2).
- Two batches touching one slot key: serial replay plus `await Promise.all(background)` before reconcile means a dying monster always finishes before the next batch. A summon into a still-dying key is silently dropped by Monsters.summon (units.has) but reconcile re-summons it after the death finishes (pre-existing, still OK).

## HIGH

### H1. Game-over modal covers the killing blow when the human wins
DuelView.tsx:1006 (`!busy && view.winner !== null`), DuelView.tsx:234-239, session.ts:164.
The human's lethal action returns from onBatch immediately, pump breaks (winner set), and `onIdle` fires at once: `setView(sess.view())` (already has `winner`) and `setBusy(false)`. GameOver (and, in campaign, the Continue button; TurnPill `over`) shows while the attack, death, the `gameOver` event wait(400) and `avatars.finish` are still queued. AI wins are fine (that batch is awaited).
Fix: keep a pending-replay counter (increment when queuing, decrement in `run`'s finally; state or ref plus a state mirror) and gate GameOver and `stuck` on it being 0; or in onIdle do `if (sess.over) await queue` before setView/setBusy.

### H2. Watchdog does not cancel the timed-out replay (zombie replay corrupts later batches)
DuelView.tsx:212-225, replay.ts:225-226.
`Promise.race` only stops waiting. `replayBatch` keeps running in the background while the next batch replays, and when it finally ends it runs `reconcile(scene, b.after)` with an OLD view, which vanishes monsters and traps that newer batches added (and re-summons ones that died). The catch-path `reconcile` (line 221) is also unbounded: if a vanish/die promise never resolves, `queue = queue.then(run)` never advances and every later batch is blocked.
Fix: give each batch an abort token (`env.cancelled = () => cancelled || token.aborted`), set `token.aborted = true` in the timeout branch; replayBatch already checks `env.cancelled()` in the loop and before reconcile, so that is enough. Wrap the catch-path reconcile in its own race. Also `clearTimeout` the 25 s timer when the replay wins (currently one dangling timer per batch).

## MEDIUM

### M1. Scene lags view: late-summoned monsters never get the "ready" glow or selection ring
DuelView.tsx:597-608 and 474-481; Monsters.ts:394-410, 412-423.
`setReady(keys)` only touches monsters that exist now; the effect re-runs only when `readyKeys` changes. After a human play, onIdle publishes the view (ahead of the scene), the new unit's key is computed but the unit is not yet in the scene; when it appears `readyOn` is false until something else changes the set. Same for clicking a slot whose summon is still queued: `monsters.has` is false so it falls to `traps.select(key)` (no-op) while `selectedRef`/`selected` are set (action bar shows, no ring).
Fix: remember the wanted ready keys and selected key inside Monsters and apply them in `summon()`, or re-run those effects when the queue drains (the counter from H1).

### M2. Prompts and highlights appear before the animation that caused them
DuelView.tsx:234-239, 590-594, 770-800.
Because onIdle publishes the final engine view while replays run, pending-target prompts, glowing targets and the attack arrow use ids whose monsters are not yet on the board. Rules-safe (the engine validates), visually odd.
Fix: delay publishing `legal`/pending prompts until the queue drains, while hand and Mana still update immediately.

### M3. `Monsters.attack` silently skips the whole lunge when the attacker is busy
Monsters.ts:432-435.
`m.busy > 0` (summon about 0.57 s, hit shake, etc.) now happens much more often because the human can order an attack right after a summon or hit while the earlier replay is still settling (replay waits only 110 ms after a summon). The attack then shows as an instant impact with no lunge.
Fix: wait for busy to clear (delayedCall polling or a per-monster promise chain, capped) instead of skipping.

### M4. Lunge at an avatar crosses the whole board in about 0.08 s
Monsters.ts:439-441, 468-473; layout.ts:93-96.
The face target is now the avatar (enemy at x 1700, yours at x 215), so lunges are 800-1300 stage px but still 0.13 s base (divided by the 1.6 timeScale and the global speed 1.5-4). At speed 4 it is about one frame: reads as a teleport; the enemy attacking you flies over your whole unit row to the far left.
Fix: duration = clamp(0.13 + dist/6000, 0.13, 0.28).

### M5. Card names ellipsised on the longest cards
card.css:515-518 (40px) with base nowrap/ellipsis at card.css:141-155. Usable width after the override is 750-100-12-24 = 614 px; names such as "Nyxara, the Veiled Matriarch", "CALYX, Ascended Intelligence", `KR-0N "Kron", Foundry Overseer`, "Seraphine, the Gilded Warden" (28-30 chars in a wide display face) will clip. Not worse than before (42px in 596 px) but still visible, and at inspector scale (k about 0.36 at 270 px, about 14 px type) it reads as "Nyxara, the Veil...".
Fix: a length class in Card.tsx like `card__rules--*` (n > 22: 32px, n > 27: 28px), or a CSS variable set from name length.

### M6. Avatar click gives no affordance or feedback
DuelView.tsx:451-455, 489-510; BattlefieldScene.ts:388-396.
Clicking the enemy avatar with nothing selected, or when face is not a legal target (blockers), does nothing and also skips the normal select/deselect logic (early return). No pointer cursor or hover state over the avatar. The canvas hit area is invisible to assistive tech; FoePanel (a real button, `targetable`) is the keyboard path, which is fine, but the hint text only mentions clicking.
Fix: only early-return when `faceTargetable`, otherwise fall through; set `cursor: crosshair` on the host in onStageMove when over the avatar and face is targetable; give FoePanel `aria-label="Attack <name>"` while targetable.

## LOW

- L1. DuelView.tsx:162-169: the banner clear timer is not cancelled by a newer banner, so back-to-back banners ("Your turn", then "Enemy's turn" within 650 ms/speed) clear the second early. Store and clear the timeout id.
- L2. Traps.ts:307-308: `slowTimer` is overwritten without clearing the previous one when two reveals run back to back, so the first timer ends the second's slow-mo early. `clearTimeout` before reassigning.
- L3. Avatars.ts:152, 183: the flinch timeline `onComplete` does `body.position.set(0, 0)`, resetting y to 0, which can fight finish()'s `y: 22` collapse (flinch to gameOver is only about 0.1 s apart). Keep a handle on the flinch timeline, kill it in finish(), and reset only x.
- L4. Avatars.ts:206: `tick` writes `body.scale.y` every frame, fighting cast()'s swell tween (only x visibly swells). Apply breathing to the `sprite` child or make the swell a multiplier.
- L5. Avatars.ts:48-50: `set()` replaces an avatar without killing tweens on the old objects; harmless today (called once per side).
- L6. Avatars.ts:131-136 / 203: a rapid off/on within 0.2 s lets the fade-out tween fight `tick` for a few frames; kill the tween in the `on` branch.
- L7. main.tsx uses StrictMode (dev only): the first, cancelled boot's late `s.destroy()` calls `resetTimeScale()`, resetting global speed to 1 while the real scene runs, so dev builds ignore the stored 1.5 speed until the user changes it. Re-apply `setBaseSpeed(speedRef.current)` after scene creation.
- L8. card.css:489-507: the orb has z-index 3 while fx overlays are auto, so mythic/legendary holo and gloss never wash over the orb. The orb overlaps the art frame by about 4-10 px (intentional) and sits flush against the banner (orb ring ends about 104 px, banner starts at 100 px); fine at full size, cramped when tiny.
- L9. replay.ts:116-119: the unawaited spell flourish (card at y 470) can overlap the next batch's trap-reveal card (y 560, dimmed layer) for about 0.4 s. Cosmetic.

## Checked, no issue found
- timeScale(1.x) on timelines that resolve promises: it is set before children are added and only scales time; onComplete still fires; with the global scale (speed times trap slow-mo hold) the product is fine; at speed 4 times 1.6 the impact `call` still fires. Destroy resolves pending promises (Monsters.pending, Traps.pending), so awaiting replays never hang on teardown.
- Killed timelines: die/vanish/Traps.remove kill child tweens by target; parent timelines still complete, `m.busy--` on a destroyed container is harmless.
- Avatar layout at 1024-1440 px wide: the enemy avatar (stage x 1606-1794, y 190-480) does not overlap FoePanel (centred), the log (moved to top 21rem, hidden under 900 px) or any slot; your avatar (x 87-343, y 520-910) clears the self panel and hand reserve. The card inspector (fixed left, pointer-events none) overlays your avatar while hovering, cosmetic only.
- Avatar hit-rect vs slots: no overlap with any slot (opp unit slot 4 at x about 1285, opp trap slot 3 about 1119, my unit slot 0 starts at x 398), so the avatar-first check in onStageDown cannot steal a slot click.
- Avatars.destroy kills tracked and per-target tweens; calls after destroy are no-ops because `list` is cleared.
- session.ts: busy/onIdle pairing is correct (onIdle fires exactly once per submit/start); illegal actions are swallowed and legal actions re-offered; auto-pass batches return immediately but the next AI batch awaits the queue.
