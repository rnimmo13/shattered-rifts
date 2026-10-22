# UX2 review: duel targeting, response window, ready indicator, card layout

Scope: apps/web/src play/DuelView.tsx, play/actions.ts, play/Hud.tsx, play/Prompts.tsx, hand/Hand.tsx,
duel/scene/Monsters.ts, cards/Card.tsx, cards/card.css, play/play.helpers.test.ts. No source modified.
Counts: CRITICAL 0, HIGH 3, MEDIUM 7, LOW 7.

## CRITICAL
None. No hard soft-lock was found: a pending chooseTargets always has either the board path (pendingMap, only when every
target is a field card) or the ChoiceList fallback; the mode chooser has Cancel; click-target mode has Cancel/Escape/right-click.

## HIGH

H1. Stale `targeting` state survives any submit that did not come from a board click (DuelView.tsx:277-289, 91-94, 510).
`submit()` clears chooser and selection but never `targeting`; only the onStageDown path calls `setTargeting(null)` first.
While targeting, these are still live and each submits then leaves `targeting` set: the ActionBar (shown whenever
`inputOpen`, line 731), the WindowPanel buttons and Pass (line 741), and the E shortcut (H2). Afterwards `targeting` still holds
the old action map, so on the next idle: `targetActions` is non-null, the hand is locked (line 678), End turn is hidden
(848), ready indicators are hidden (545), highlight/arrow show stale targets, and a click on a stale target submits an
action that is no longer legal. It also overrides a genuine `pendingMap` (`targeting?.actions ?? pendingMap`, line 510), so a
new chooseTargets prompt caused by the cast would be answered with stale actions. Escape/Cancel recovers, but it looks like a soft-lock.
Fix: call `setTargeting(null)` inside `submit` (next to `setChooser(null)`), and add an effect that clears `targeting` when
`legal` changes, `busy` becomes true, or the turn changes. Optionally verify each stored action is still in `legalRef`.

H2. E ends the turn while in click-target mode (DuelView.tsx:581-591 vs 848).
The End turn button is hidden with `!targetActions`, but the keyboard handler only checks `inputOpen && end && !pending &&
!chooser && !showHelp && !showWindow`. Press E mid-targeting and the turn ends, the played card is never cast, and H1 leaves
stale targeting behind. (With pendingMap, `!pending` already blocks it.)
Fix: add `&& !targetActions` to the condition.

H3. Right-click on a glowing target casts instead of cancelling (DuelView.tsx:400-416, 626-631).
`onStageDown` is on `onPointerDown` with no `e.button` filter. pointerdown fires for the right button before contextmenu, so
right-clicking a highlighted target submits that action (irreversible). In normal mode a right-click also selects units.
Fix: at the top of onStageDown, `if (e.button !== 0) return;` and let contextmenu do the cancelling.

## MEDIUM

M1. No keyboard path to pick a target (DuelView.tsx:705-722, 399-416). Targeting mode is pointer-only (Pixi hit-test); only
Escape/Cancel work from the keyboard. A keyboard user who presses Enter on a targeted spell (Hand.tsx:243) enters a mode they
cannot complete; for a mandatory pendingMap prompt they cannot answer at all (the ChoiceList is suppressed, line 886).
Fix: add a "Choose from list" button to the targetbar (always for pendingMap) that shows ChoiceList of `describeAction`
options; give the targetbar proper focus/aria.

M2. Mandatory pending chooseTargets has no list fallback if board hit-testing fails (DuelView.tsx:499-509, 886). If a target
sits under DOM panels (log, Inspector, FoePanel) or is otherwise not hittable, the player is stuck. Same fix as M1.

M3. The drop point is reused as target selection for unit/trap plays (DuelView.tsx:296-333, 346-350). `onPlayCard` passes the
drop point for every card kind; for a unit with a targeted on-play effect, dropping on an occupied own slot that is a valid
target picks it as the target instead of being a placement. Fix: pass `drop` only when `dropKind(card.def) === 'spell'`.

M4. Keyboard activation passes a fake coordinate (Hand.tsx:246). `onPlay(card, 0, 0)` runs `sc.slotAtClient(0,0)` in
resolveActions; harmless today but fragile. Fix: let onPlay take a nullable point and pass `drop = null` for keyboard.

M5. Ready arrow is drawn behind the body sprite (Monsters.ts:235, 232). Child order is `shadow, ring, ready, body`, and the
arrow sits at `-height*0.9`, inside the sprite extent, so most of it is hidden behind opaque art; only the glow reads.
Fix: add `ready` after `body` (or raise the arrow above `-height`) and check visually.

M6. `m.ready` tweens are not killed or faded on die/vanish (Monsters.ts:129-150, 552-570; only destroy() kills them). A 0.3s
fade from setReady can finish after `root.destroy({children:true})` and run `m.ready.visible = false` on a destroyed
container (the `destroyed` guard covers scene teardown only). vanish() also leaves `m.ready` out of its alpha list, so the
indicator stays solid while the unit fades. Fix: add `m.ready` to vanish's alpha targets and die()'s `killTweensOf`, and guard
the onComplete with `this.units.get(m.key) === m`.

M7. Card layout offsets collide (card.css art 96-125, type/gem 224-252). The art window now ends at 496 (+7px ring = 503); the
rarity gem is centred at 502 (about 484-520 rotated), overlapping the art frame and the top of the centred TYPE line (starts
514). The art ring (7px) also touches the cost gem (bottom 92 vs art top 96). Fix: move `.card__gem` to about 506 and the type
line to about 530 (rules top accordingly), or shrink the art to about 380; screenshot all five rarities.

## LOW

L1. Rules text can overflow when flavor shows (card.css 208-232, Card.tsx 39-71). The box is about 338px tall (568..938). Size
`l` (41px, up to 170 chars) is about 6 lines (290px); flavor (width >= 300, e.g. inspector) adds about 70px: about 360 > 338,
with no overflow handling (justify-content:center spills both ways over the type line). A quick scan of
packages/content found no card text over 150 chars (single-line regex only), so fine today. Add a content test on max text
length, or `overflow:hidden` plus a smaller flavor for `l`/`xl`.

L2. Size classes count characters only (Card.tsx:39), not line breaks or long keyword words; text with explicit newlines may
wrap more than estimated.

L3. `winButtons` key for setTrap/setAmbush is `type::` (DuelView.tsx:481-487), so different cards would merge into one button
if the engine ever lists them in a window (not seen today). Include `a.card` for those types. `dragHint` is also true when the
only 'play' options are Echo casts from the Void (line 745), which cannot be dragged from the hand.

L4. Variants with identical descriptions (same target twice) render identical labels in the fallback list (actions.ts:208-221,
describeAction). Add a mode suffix or index.

L5. Escape closes click-target mode only (DuelView.tsx:557-564), not the mode chooser, which has a Cancel (Prompts.tsx:51).

L6. Ready indicator under reduced motion (`still`): tick skips the bob so the arrow sits at its initial y (fine), but the 0.3s
fade ignores the speed setting (Monsters.ts:393). Indicators also stay while Help/Settings are open (readyKeys ignores
`showHelp`, `chooser`). Cosmetic.

L7. Tests (play.helpers.test.ts) cover groupByMode, singleTargetMap and targetsOfAction but not `chooseTargetsOf` with
pendingMap rules, `describeMode`, `modeKey` for activate-by-ability, flip and activateTrap, or the winButtons grouping.
Extract the grouping from DuelView into actions.ts and test it.

## Verified OK
- Single-click cannot double-submit: submit gates on `busyRef` (set synchronously) and onStageDown also returns when busy.
- targetRef is updated in an effect but only read from pointer handlers after render; no stale-ref window beyond H1.
- Same target in two actions, multi-target, zero-target and non-board (hand/Void/face) targets all make `singleTargetMap` return
  null or fail the `fieldKeys` check, falling back to the ChoiceList (resolveActions and pendingMap).
- A hidden enemy card is only a drop target if the engine lists it as legal; rules stay in the engine.
- Spell on own unit works: own field ids are in `fieldKeys`; probe and drop handle them.
- Hand plays removed from the window panel stay reachable by drag (and Enter on a focused card); activateTrap, activate, flip
  are grouped into buttons, Echo goes through the ActionBar, and Pass is always present.
- Hand is locked during targeting; stat badges are still HP left / DMG right (matches Help); flavor hidden under width 300 only
  affects hand-size cards (150-230px); the inspector is unaffected.
- No rule logic added to the client: readyKeys, target maps and mode grouping derive only from `legal`.
