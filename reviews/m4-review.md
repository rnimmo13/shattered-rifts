# M4 review: Campaign Run v1

Scope: `packages/campaign/src/*`, `apps/web/src/run/*`, the campaign hooks in `apps/web/src/play/{session,DuelView,Hud}`, `app/App.tsx`, `app/TitleScreen.tsx`, and `docs/03_CAMPAIGN.md` sections 2-4.
No source files were modified. Campaign unit tests pass (21/21). Line numbers refer to the files as read.

Counts: CRITICAL 0 / HIGH 4 / MEDIUM 8 / LOW 8

## What checks out
- Purity: the campaign package imports only `@sr/engine` and `@sr/content`. There is no `Math.random`, `Date`, DOM or I/O. ESLint `purityRules` cover `packages/campaign/src/**` (eslint.config:60-68). `Date.now` and `Math.random` appear only in the web `newSeed()`, which is fine.
- Every transition clones the run (JSON round-trip). The rng is a plain 4-number array, so it survives clone and JSON. `nextInt` mutates only the clone's rng.
- Deck legality is checked on every add via `canAdd` (copies, Legendary limit, Legendary+Mythic total). Removal is guarded at 20 in `takeShrine` and `buyRemoval`.
- Reward offers are distinct and legal, and the rarity ladder falls back downward. In practice they are never empty.
- Map graph: every node has `next.length >= 1` and every node on a floor gets an incoming edge, so there are no dead ends or unreachable nodes. Floor 1 is all Duels, floor 5 is Shrine/Merchant, at most one Elite, floors 3-4 only.
- Resolve: Duel loss costs 1, Elite or Warden costs 2, the same node is retried, 0 collapses. The stage 5 Warden goes to `loopCleared`. The Gift cannot be skipped (`run.ts:189`). Tier Essence bonus is +3 per tier, +5 for Wardens and the finale.
- Merchant: buying with exactly enough shards works (`>=`), double-buy is blocked by `sold`, and Leave is always available. The Shrine always has a legal choice because `rest` is never refused.
- localStorage access is wrapped in try/catch.

---

## CRITICAL
None.

## HIGH

### H1. Banking deletes the save, so the "safe" banked deck is lost on reload
`apps/web/src/run/RunScreen.tsx:52-56` calls `clearSavedRun()` as soon as `phase === 'banked'`. The Bank screen (`RunScreen.tsx:371-374`) says "This N-card deck is safe", but there is no Vault yet. A refresh, navigating away or closing the tab on that screen loses the deck permanently unless the player pressed Export. Banking a 60-90 minute run is the success state, and the deck is stored nowhere.
Fix: keep banked decks under a separate key (for example `sr.vault.v1`, up to 5 decks), or keep the `banked` save until the player explicitly leaves. Only clear on `collapsed` or on an explicit "Back to the Sanctum". At minimum, change the copy to "Export it now or it is lost".

### H2. A campaign duel has no escape hatch: error and "stuck" states soft-lock the run
- `RunScreen.tsx:107-108` passes `onExit` and `onAgain` as `() => undefined`.
- `DuelView.tsx:458` hides Leave in campaign mode.
- The "The duel stopped responding" dialog (`DuelView.tsx:531-548`) offers only "Start a new duel" and "Leave", both no-ops here.
- The `error` banner (`DuelView.tsx:453`) has no button at all.
- RunBar (and so Abandon and Export) is not rendered while a duel is on screen.
- The seed is deterministic (`run.seed:node:won:lost`), so a reload reproduces the same engine error or stuck state. The player cannot recover short of clearing localStorage.
Fix: in campaign mode, make the stuck and error dialogs offer "Forfeit duel (counts as a loss)" calling `campaign.onResult(false)`, and make "Start a new duel" and "Leave" meaningful or hide them. Alternatively, show Abandon on the duel screen.

### H3. Reloading before pressing Continue gives an unlimited free retry, and the replay is identical
The result reaches the run only when Continue is clicked (`DuelView.tsx:675-676`, `Hud.tsx:209`). The saved run still says `phase: 'duel'` with unchanged stats, so a reload or leaving the page restarts the same duel with the same seed (`RunScreen.tsx:101`). The same seed plus a seeded AI (`session.ts:117-121`) gives the same shuffle and AI behaviour.
- After seeing Defeat, the player reloads to avoid the Resolve loss. This works even on the last Resolve, because the collapse is applied only on click.
- Abandoning a duel mid-way costs nothing, and since the replay is deterministic the player can scout the AI's plays and replay with perfect information.
Fix: record the duel start in the run. Add `duelStarted` to `RunState` (or a `stats.duelsStarted` counter) and autosave it when the duel screen mounts. On resume, if it is set, treat the duel as a loss, or at least charge Resolve and give a fresh seed. Alternatively, apply the result to the run as soon as `winner` is set and let the button only navigate.

### H4. `parseRun` validates too little and nothing catches render errors, so a bad or older save can brick the app
`save.ts:351-375` checks the top-level scalars and the deck only. It does not check:
- `map.nodes` entries: shape, `kind`, `next` as known ids, `enemyId` against `ENEMIES`, `floor`, `map.stage` and `realm`;
- `cleared` or `at` as members of the map; `stageRealms` values; `stats` fields; `boons`; integer rng elements;
- `context`: its `nodeId` must exist and it must match the phase (`offers` an array of known card ids for reward and gift, `merchant.items` for merchant, `event` for event), and duel/shrine/merchant/event phases must have a non-null context.

Effects, reachable with a hand-edited save or one from an older build whose content changed, and the save auto-loads on mount (`RunScreen.tsx:46`):
- An unknown `enemyId` makes `duelPlan` throw during render (`run.ts:131` calls `enemy()`). There is no ErrorBoundary anywhere in `apps/web/src`, so the whole app unmounts, and every reload crashes again because the bad save stays in localStorage.
- `map.nodes` containing null makes MapView throw. An empty `nodes` array gives `Math.max(...[])` = -Infinity (`MapView.tsx:102`).
- `phase: 'reward'` or `'gift'` with a null context shows no cards, and `chooseCard` throws "nothing on offer". For a gift this is a dead end (only Abandon works), and a reward cannot even be skipped.
- `merchant.items` that is not an array crashes `MerchantView`. Unknown `cardId`s reach `Card` (`CARD_DB['constructor']` is truthy).
- `phase: 'map'` with `at` not in this map gives zero reachable nodes (Abandon still works).
Fix: (a) validate the full shape in `parseRun`: unique node ids, `next` targets exist, kinds known, enemy ids exist in `ENEMIES`, `at` and `cleared` inside the map, and a phase-to-context consistency check, returning null on failure. A cheap extra safety net is a smoke test that calls `availableNodes` and `duelPlan` inside try/catch. (b) Add a top-level ErrorBoundary whose button clears the run save. (c) On a parse failure, keep the raw text under a backup key (see L2).

---

## MEDIUM

### M1. Maps and offers depend on rng stream position, not only on the seed
`nextStage` and `continueLoop` generate the next map from the same rng that card offers and merchants consume (`run.ts:210, 314`). So the stage 2-5 maps and all offers depend on how many draws earlier choices made (visiting a merchant or event, skipping versus taking). A replay of the same seed with different choices gets different maps, which contradicts "generated from the run seed" (`mapgen.ts:1-2`). It is also fragile whenever a future change adds a draw.
Fix: derive a sub-rng per purpose, for example `seedRng(seed + ':map:' + tier + ':' + stage)` and `seedRng(seed + ':offer:' + tier + ':' + stage + ':' + nodeId + ':' + duelsWon)`. This will matter more once Boons and Anomalies add more draws.

### M2. A Gift with zero offers is an unrecoverable dead end
`giftOffers` (`rewards.ts:341-357`) can return `[]` if every signature card is illegal (Legendary cap reached) and padding finds nothing. The gift screen has no skip (`RunScreen.tsx:292-301`), so the only way out is Abandon. Very unlikely today but cheap to prevent.
Fix: guarantee at least one offer (fall back to a Neutral Rare), or advance past the gift when `offers.length === 0`. Also assert `offers.length >= 1` in `finishDuel`.

### M3. Spurious notices and a fragile double-activation path
`act` (`RunScreen.tsx:59-70`) applies each click as a functional `setRun`. A fast second click on a reward, gift, shop or Continue button, before React re-renders, runs a second updater against the new state. Usually it throws `RunError` and shows a confusing notice ("There is no card reward to choose from") over a successful action. The risky case is `finishDuel` on a loss: the first call leaves `phase: 'duel'` for the retry, so a second queued `finishDuel(r, false)` would charge Resolve twice. React flushes discrete events between clicks, so this is hard to hit with a mouse, but a held Enter key or a slow device could.
Fix: latch Continue so `onResult` fires once (ref in DuelView). Have `act` carry an expected `phase` and `nodeId` token and ignore mismatches. Move `setNotice` out of the updater (see L5).

### M4. Draws count as a loss and the player is not told
`DuelView.tsx:676` calls `onResult(view.winner === HUMAN)`, so `'draw'` becomes a loss. The GameOver copy says "Neither side could break the other" with no mention of Resolve. Either say so, or treat a draw as a free retry, and record the decision in DECISIONS.md.

### M5. Gaps against 03_CAMPAIGN (confirm they are intended for v1)
- No Shard scaling by Tier (x1.25, x2.0) (`run.ts:154`) and no Merchant +25% at Tier X (`run.ts:97`).
- No Anomaly nodes (Tier II+), no Boons, no Tempering; the Shrine offers Rest or Remove only. `run.ts:3-4` already says Boons and Tempering come later.
- The Gift is signature cards only. The design gives one offer per category (signature, Boon, deck surgery). Tier V gives 4 cards, not 4 categories.
- Vorthax's Gift is skipped (stage 5 goes straight to `loopCleared`) even though `BOSS_SOURCE` has `vorthax`. Confirm that is intended.
- "At least one path avoids the Elite" is not enforced. It holds globally for a single Elite, but a player standing on a floor-3 node whose only `next` is the floor-4 Elite is forced into it.
- Tier VIII: `tier < 8` after the increment means clearing Tier VII restores 0 Resolve. The doc ("From Tier VIII on") is ambiguous; confirm.
Fix: log these as deferred in DECISIONS.md.

### M6. Disabled buttons are used for read-only cards, which hurts keyboard focus and possibly hover
`Pickable` sets `disabled={props.disabled || !props.onClick}` (`Pickers.tsx:184`). In the view-only deck viewer, the Event card, and SOLD or unaffordable merchant cards, the buttons are disabled. Disabled buttons cannot take focus, so keyboard users cannot read those cards (`onFocus` never fires), and some browsers do not dispatch pointer events on disabled controls, so hover inspection can fail.
Fix: use `aria-disabled` with a guarded click handler (or a focusable non-button wrapper) and keep the pointer and focus handlers active.

### M7. The Inspector can overlap or go stale
`MerchantView` keeps its own `hover` state (`Pickers.tsx:331`). Buying makes the button disabled, which can swallow `pointerleave` and `blur` and leave the Inspector stuck. When the Remove modal opens, `DeckModal` renders a second `Inspector` while the merchant's one is still showing.
Fix: clear `hover` on click and when opening a modal, or lift one shared Inspector to the screen level.

### M8. Import is unbounded and accepts terminal phases
`onImport` (`RunScreen.tsx:79-88`) reads the whole file with no size cap, then `JSON.parse`. A very large file can hang the tab. Import only exists in the Sanctum, so it cannot overwrite a live run, which is good. Importing a `banked` or `collapsed` run triggers `clearSavedRun` (see H1) and shows an end screen without persisting.
Fix: cap the size (for example 256 KB), refuse `collapsed` imports with a message, and see H4 for deeper validation.

---

## LOW

- L1. `ShrineView` (`Pickers.tsx:288`) and `MerchantView` (`Pickers.tsx:335`) hard-code `20` instead of `MIN_DECK`. The "Move on" fallback (`Pickers.tsx:307-311`) calls `onRest`, so a button labelled "Move on" runs the rest function. It is harmless because rest is clamped, but add a proper `leave` choice.
- L2. A save that fails `parseRun` is invisible: `loadSavedRun` returns null and the next autosave overwrites the damaged text. Keep the raw text under a backup key and tell the player.
- L3. The title screen always says "Begin Run" (`TitleScreen.tsx:75`). Label it "Resume run" when a valid save exists.
- L4. Focus management: after a phase change the focused button unmounts and focus drops to `<body>`. Move focus to the new section heading (`tabIndex=-1`). Map nodes are real buttons with `aria-label`, and only reachable nodes are enabled, which is good. Consider `aria-current="location"` for the current node. Node labels show the enemy name, which is fine.
- L5. `act` calls `setNotice` inside the `setRun` updater (`RunScreen.tsx:63, 66`), a side effect inside an updater (StrictMode double-invokes it). Compute the next state outside the updater, using a ref of the latest run.
- L6. `exportRun` puts `run.seed` in the download name (`saves.ts:427`). Browsers sanitise it, but an imported save can hold arbitrary seed text, so slugify it. Export is unavailable mid-duel because RunBar is hidden there.
- L7. `chooseEvent('card')` silently adds nothing if `canAdd` fails and still clears the node (`run.ts:291`). Unreachable today, but a future Boon or Tempering step could hit it. Throw a `RunError` instead.
- L8. The merchant can show fewer than 4 items if the pool is thin (not a bug now), and `PRICE[rarity] ?? 60` hides a missing rarity entry.

## Anti-cheat notes (out of scope, state consistency only)
- The run is plain JSON in localStorage, so shards, resolve (up to `maxResolve` 9), tier (up to 99) and phase can be edited. Fine for a friends beta, but the Vault will need validation later.
- Seeds are not tied to the deck, so a hand-built deck export can be imported as a "banked" run. Same caveat.
