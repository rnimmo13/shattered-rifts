# C5b review: Potions, enemy move tooltips, art loader, reward/transition CSS

Scope: everything in the request. Source files were not modified. Findings are from reading the code; nothing was run.

## CRITICAL

None.

## HIGH

### H1. Using two potions quickly can drink the wrong one (belt index comes from the replayed display, the action goes to the engine)
- `apps/web/src/fight/FightView.tsx:777-795` (belt), `:440-452` (`act`), `packages/combat/src/engine.ts:817-836` (`usePotion`), `apps/web/src/fight/display.ts:180`.
- The belt is rendered from `me.potions`, which comes from the *display* state. That state only drops a potion when its `potion` event is replayed through the `chain` queue. `act()` applies actions to the *engine* state immediately, and `legal` is also engine-fresh. Buttons are only disabled during the enemy phase or after the fight ends.
- Scenario: belt `[A, B, C]`. Click A. The engine is now `[B, C]`, but the screen still shows `[A, B, C]` while an earlier card animation is still playing. Click B (display index 1). The engine uses index 1, which is **C**. The same mismatch breaks the `needs` check (`legal.some(a.index === i)`) and `aimPotion`, because `aimPotion` is a display index compared against engine `legal`.
- The display test does not cover this: `display.test.ts:53-73` applies one potion and replays it fully.
- Fix (either one):
  - (a) Render the belt from the engine state (`game.current.state.sides.a.potions`) so the index always matches the action, and re-render on `act`.
  - (b) Disable the belt while `pending.current.all > 0`.
  - (c) Best for robustness: make the action carry the potion id, or add `potion: string` to the action and validate `sd.potions[index] === id`, so a stale index is refused instead of misfiring.
- Add a UI-level or reducer-ordering test: use potion 0 and then potion 1 before the first batch replays.

### H2. `legalActions` has a dangling `else`: ally-targeted ("friend") potions are never offered, and foe potions can emit illegal actions
- `packages/combat/src/engine.ts:764-774`.
```
else if (p.target === 'foe')
  for (const t of foes)
    if (t.hp > 0) out.push(...);
    else
      for (const t of sd.units) ...   // binds to `if (t.hp > 0)`, not to `else if (p.target === 'foe')`
```
- Result: a `target: 'friend'` potion yields no actions at all. A `foe` potion with a dead enemy still in `units` emits actions that target your own units, which `usePotion` then rejects.
- No current potion has `target: 'friend'`, so this is latent, but `PotionDef.target` is typed `CardTarget` and `validate.ts` accepts it. The existing engine tests do not exercise it.
- Fix: add braces: `else if (p.target === 'foe') { for ... }  else { for (const t of sd.units) ... }`. Add a test with a `friend` potion. Better: share one target-listing helper with the card branch above so the two cannot drift.

### H3. The blocking art preload can leave the whole app blank on a slow or stalled network
- `apps/web/src/main.tsx:20-26`, `apps/web/src/art/assets.ts:35-62,65-67`.
- `createRoot(root).render` only runs after `preloadArt()` resolves. `preloadArt` awaits the manifest fetch and then **every figure image**, with no timeout and no progress. `loadImage` has no timeout either, so a request that stalls (rather than failing) holds the page empty forever. A 404 or a network error is handled; slow or hung is not.
- The cost grows with the art: about 50 figures at roughly 1 MB or more each is a very long white screen on mobile.
- Fix: render the app immediately and treat art as progressive:
  - (a) Race the manifest with about 3 s, and each figure with about 5-8 s (`AbortController` plus `Promise.race`).
  - (b) Do not block the first paint (`main.tsx`); await only in the fight and the card views that need it, with a bounded wait.
  - (c) Or lazily load the figures a fight needs.
- Add a unit test for the timeout and failure paths. There are no tests for `assets.ts`.

## MEDIUM

### M1. Aiming a potion and a card can be active at once, and `act()` never clears the potion aim
- `FightView.tsx:440-452` (`act` clears only `selected`), `:523-531` (Esc and the `E` and `1-9` keys), `:724-729` (`onSelect`, `onDragTargets`), `:482-491` (`aimSet`).
- With a potion aimed (`aimPotion` set), clicking or dragging a hand card sets `selected` or `dragTargets` but leaves `aimPotion`. `aimSet` prefers `aimPotion`, so the glowing targets and the click handler belong to the potion while a card's arrow and aim bar also show.
- Pressing `1-9` (plays a card) or `E` (ends the turn) while aiming a potion calls `act()`, which does not clear `aimPotion`. After the potion list shifts, `aimPotion` points at a different potion, or at the same slot after the enemy turn, and the aim bar shows the wrong name.
- Fix: clear `aimPotion` inside `act()`, in `onSelect`/`onDragTargets` (when a card is picked), and when `locked`/`finished` become true. Also clear `selected` when `aimPotion` is set. Add an effect: if `aimPotion !== null` and `!legal.some(a => a.type==='potion' && a.index===aimPotion)`, reset it.

### M2. The potion belt CSS collides with the run-screen chip CSS
- `apps/web/src/run/run.css:689-711` defines `.potion--uncommon`/`.potion--rare` (background gradient, `border-color`, `color:#fff`) as plain single-class rules. `fight.css:715-748` styles `.potionbtn` and also gives it the `potion--<rarity>` class (`PotionChip.tsx:36`).
- Both are specificity (0,1,0). In the run, `run.css` is imported after `FightView`'s CSS (`RunScreen.tsx:47-48`), so uncommon and rare belt buttons would pick up the chip's gradient background and white text. Common ones would not, so the three rarities would look inconsistent. It only appears in the campaign, not in `#/play`.
- Fix: scope the chip rules to `.potion.potion--uncommon` (or rename the button's class to `potionbtn--uncommon`), and use `.booncard.potion--*` only where wanted.

### M3. Potions gained when the belt is full are silently lost, and there is no way to swap or discard
- `packages/campaign/src/run.ts:291-295`, `apps/web/src/run/Pickers.tsx:100,271`.
- The drop is skipped with no message. The merchant button just disables without saying why (belt full). The player cannot drop a potion to make room.
- Fix: show "Belt full" on the reward and merchant screens, or let the player replace a potion when a new one is offered. At minimum add a text hint where the buy button is disabled.

### M4. The potion drop roll is skipped when the belt is full, so reward rng depends on the belt
- `run.ts:292`: `r.potions.length < MAX_POTIONS && nextInt(...)` short-circuits, so rng advances only when there is room. The same seed yields different card offers afterwards depending on how many potions you drank. Determinism holds, but seed-based tests and "same seed, same rewards" shift. The merchant also draws two `offerPotion` calls before `offerBoon` (`:144-148`), which shifts boon and card rolls for all existing seeds.
- Fix: always call `nextInt` first (`const roll = nextInt(...)`, then check capacity). Call out in DECISIONS that seeds shifted.

### M5. Potions and the art loader are not recorded in the design docs
- `docs/DECISIONS.md` #92 and #93 do not mention potions, tooltips or the loader. A search for "potion" in `DECISIONS.md`, `08_COMBAT_V2.md`, `03_CAMPAIGN.md` and `CHANGELOG.md` finds nothing. CLAUDE.md says to log every rules decision there (belt size 3, free use, drop rates 40 and 75 percent, prices 30/50/80, potions ignore Taunt, a lost fight refunds potions) and keep `CHANGELOG.md` updated for player-visible changes.
- Fix: add decision entries and spec text. Note in particular that foe potions bypass Taunt (`usePotion` checks only `hp>0` and side, while cards use `legalFoes`). That may be intended, but it should be a stated rule.

### M6. Art loader: unbounded image sizes and unvalidated manifest data
- `assets.ts:41-50` (figures), `:52-55` (cards, backdrops), `:36-39`.
- Every figure is copied to a canvas at its natural size. Several 4096-pixel images cost tens of MB each in decoded memory (plus the copy), and a canvas larger than the GPU texture limit fails when Pixi uploads it. Fix: downscale to a max height (about 1024) while copying.
- The manifest is trusted blindly: values are not checked to be strings, and `..` or absolute or odd paths are concatenated into `${base()}art/${path}`. It is a same-origin, developer-owned file, so this is not exploitable today, but one bad entry produces `art/undefined`. Fix: accept only `typeof path === 'string' && /^[\w./-]+$/.test(path) && !path.includes('..')` and only plain-object sections.
- Card and backdrop URLs are stored without being checked or preloaded (`:52-55`). A manifest entry whose file is missing gives a broken `<img>` in the card art (`fight/art.ts:145-146`, no `onerror` fallback to the procedural art), and a card image is not decoded before first use, so it flashes. Fix: verify them with `loadImage` too, or add an `onError` fallback.
- `realBackdrop` is exported but never used (`rg realBackdrop` finds only the definition), so backdrops in the manifest do nothing today. `docs/09_ART_BRIEF_V2.md` says boon and potion icons are "listed in the manifest format already", but `Manifest` has no `boons` or `potions` key, so those entries are silently ignored. Fix the doc or add the keys.

## LOW

### L1. Enemy move tooltip: no viewport clamping, stacking, or touch behaviour
- `fight.css:677-703`, `Plates.tsx:37-58`.
- The tip is `width:14rem`, centred on the enemy with `translateX(-50%)`, so for an enemy near the left or right edge it can run off-screen. For tall bosses the intent sits near or above the top of the screen. Fix: clamp the tip's `left`/`right` against the host width, or flip it above or below the intent.
- The tooltip is below the intent and covers the enemy's head and plate while hovered; while it is open, clicks aimed at that enemy land on the tip and do nothing (it is `pointer-events:auto` and the plates layer is outside the stage). Fix: give `.intent__tip` `pointer-events:none`.
- Every `.intent` has `z-index:11` plus an animation (its own stacking context), so a later enemy's intent can paint over an earlier enemy's tip. Fix: raise `.intent:hover`/`:focus-within` (for example `z-index:60`).
- `aria-label` is on a div without a role; the tip has `role="tooltip"` but no `aria-describedby`. On touch there is no hover, so only focus shows it (tap on a tabindex element works on most browsers).
- `view.ts:151-160` `WHO_ENEMY['target']` is the empty string, so "Deal 9 damage." reads fine, but `addCard` text `o.side === 'self' ? 'your' : 'the enemy'` is not enemy-relative (`opText` ignores `who` there), so an enemy move that adds a Wound shows "Add Wound to the enemy hand". Pass `who` or a flag into the `addCard`, `draw` and `mana` cases. The `heal`/`barrier` cases say "Gain 8 Barrier" for an enemy that is acting; the wording reads as if you gain it. Check these reads in the UI.

### L2. Save validation gaps
- `packages/campaign/src/save.ts:80-96,153-159`.
- Merchant potion entries do not check `sold` is a boolean, and prices accept 0 (free) up to 100000; the limit `r.potions.length > 3` is a literal instead of `MAX_POTIONS`. Because the card items check the same way, this is consistent, but a hand-edited save can still buy potions free. `RUN_SAVE_VERSION` was not bumped for the new fields (the `undefined` default covers old saves). A `merchant.potions` list longer than 2 or duplicates are not rejected.
- Fix: validate `typeof sold === 'boolean'`, reject lengths above about 4, and import `MAX_POTIONS`.

### L3. A lost or forfeited fight refunds every potion used
- `run.ts:278-285` (loss returns before the potion handling) and `RunScreen.tsx:60-66`. This is consistent with HP also resetting, and the test documents it (`boons.test.ts:139`), so it is a decision, not a bug. It does mean potions can be used freely in a fight you intend to lose or abandon, and "close the page mid-fight" is a free scouting run. Log it in DECISIONS.
- `finishDuel` correctly uses a multiset intersection, so a tampered `potionsLeft` cannot duplicate or invent potions (checked: duplicates beyond what the run holds are ignored). `hpLeft` is still taken on trust.

### L4. UI and hard-coded values
- `Pickers.tsx:271` hard-codes 3 instead of `MAX_POTIONS`. `FightView.tsx:886` is a function named like a constant (`COMBAT_DB_POTION_NAME`).
- No keyboard shortcut for potions (the buttons are tab-focusable, Esc cancels aiming). A foe potion with a single legal target still needs an aim click (cards auto-play with one target, `:528`).
- The `potion` event has no animation, sound or float (it hits the `default:` branch in `playEvent`), so using a potion has no feedback beyond its effects. Not a bug, but weak for a "juice" pass.
- Belt layout: `.fight__potions` is absolutely positioned at `left:1rem; top:3.4rem` with `min-width:4rem` buttons and no wrap. Three buttons fit, but long potion names (for example "Healing Philtre") widen them, and at very narrow widths the belt can run under the boon chips. Add `flex-wrap:wrap` and `max-width`.
- `PotionChip`'s glyph is a text character, `cursor:help`, and `.potion{pointer-events:auto}` is set globally (fine inside `.fight > *` rules only for direct children).

### L5. Art list generator
- `tools/src/artlist.ts:32-47,70-73`: output path (`../../docs/art-briefs.md` from `tools/src`) is correct, there are no "undefined" realm strings in the current `docs/art-briefs.md`, and the potion and boon sections match `POTIONS` (10) and `BOONS`.
- Units that only appear as *summons* are missing: `gilded-halberdier`, `maw-spawn` and `rift-shard` are not in the file (they are not in any encounter's `units`). Fix: also iterate every `db.units` entry whose brain is `enemy` and was not seen.
- Names containing double quotes (`KR-0N "Kron", Foundry Overseer`) break the quoted prompt strings. Fix: strip or escape quotes in prompts.
- The section header says `cards/<id>` and `boons/<id>` but the manifest keys are the plain card id (and boons and potions are not read at all). Align the generator and the brief with the real manifest format.
- `docs/art-briefs.md` is committed, and says "do not edit by hand": make sure `pnpm artlist` is re-run in CI or `pnpm check` so it does not go stale. The docs list "about 33 enemies" and "12 companions", which the script now makes verifiable; print counts at the end.

### L6. Run-screen transitions (`run.css:718-758`)
- No functional problems found. `reduced-motion` correctly disables all three animations. `.offers .pick:nth-child(n)` delays stop at 4 children, so a fifth offer would deal in with no delay. `.stage-panel` animates `transform`, which makes it a containing block for `position:fixed` descendants (such as `CardHover`) only while the 0.35 s animation runs, so a hover tooltip created in that window can be misplaced. `.booncard` also animates in the merchant on every mount, which is fine.

## Tests: weak or missing
- `engine.test.ts:877-885` is named "a potion can win the fight" but asserts `a.winner` is `null`, with only one of two foes killed. It never reaches a win, so it does not test a potion that ends the fight, kills the last enemy, or leaves events in the right order (`potion` event before `died`/`gameOver`). Make it kill the last enemy and assert `winner === 'a'` and a final `gameOver`.
- Missing engine tests: friend-target potion (H2); using a potion when `heroOf` is missing; after `winner` (throws); an `ember-bomb` style all-foes potion; the real content potions (`@sr/content/v2` `POTIONS`) through `validateDb` and a scenario test each. CLAUDE.md rule 5 says every card gets a scenario test, and potions are data in the same way, but nothing in `v2.test.ts` covers any of the 10 potions.
- Missing display test: two potions in sequence (H1), a potion used in the middle of a longer event batch, and `startingDisplay` with potions.
- Campaign: no test that a tampered `potionsLeft` with duplicates of a potion the run holds once does not duplicate it; no test for the full-belt no-drop path or that rng does not shift (M4); no test of a `merchant.potions` save with bad `sold`/`price` (L2).
- Web: there are no tests at all for `assets.ts` (manifest 404, invalid JSON, bad entries, timeout).

## Checked and found fine
- Potions cannot be used on the wrong side (`usePotion` checks `target.side` against the active side), with no hero (`heroOf` check throws), after the fight ends (`applyAction` throws), or on a dead unit (`hp > 0`). A potion that kills the last enemy ends the fight through `runOps`'s `winner` checks. The enemy phase cannot receive a player action (`act` returns while `pending.enemy > 0`, and the engine runs the whole enemy turn inside `endTurn`).
- `result.potions` is read from the engine state, not the display, so the post-fight belt is right even when replay lags.
- `finishDuel` potion carry-over cannot create potions (multiset check), and a loss keeps the run's belt.
- `BASE_URL` with the GitHub Pages subpath is handled (`SR_BASE=/<name>/`, Vite normalises it to a trailing slash); a SPA fallback returning HTML for a missing `manifest.json` is caught by the JSON parse `try`.

## Resolution
H1 fixed (potions named by id, belt/aim by id), H2 fixed (braces), H3 fixed (2 s preload timeout). MEDIUM: aim states cleared, CSS collision, belt-full label, docs, tooltip no longer blocks clicks, tests added. Deferred: art loader size caps/validation, backdrop and icon wiring, potion animation/sound/keys, seed drift note.
