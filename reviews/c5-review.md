# C5 review: difficulty, Boons, Warden signature cards, events

Scope: everything listed in the request. `pnpm test` is green (118 tests), so the findings below are things the tests do not catch. Source files were not modified.

## CRITICAL

### C1. Max-HP gains never reach the fight, so Crystal Heart does nothing and costs you HP
- `packages/combat/src/engine.ts:641` (`buildHeroSide`), `packages/combat/src/types.ts:HeroSetup`, `apps/web/src/run/RunScreen.tsx:171`.
- `HeroSetup` has no `maxHp`. The hero unit always gets `maxHp = hd.maxHp` and `hp = min(hd.maxHp, h.hp)`. `FightPlan.maxHp` is computed but never used.
- With Crystal Heart (+12) the run has `hp = maxHp = 92`, but the fight starts at 80/80. Winning with 75 HP sets `run.hp = 75`, and the extra 12 is gone. The run bar then shows `/92` while every fight caps you at 80.
- The same applies to the blood-altar boon and the merchant purchase. The `boons.test.ts` assertions only check `run.maxHp`, never a fight.
- Fix: add `maxHp?: number` to `HeroSetup`. In `buildHeroSide`, set the unit's `maxHp = h.maxHp ?? hd.maxHp` and clamp `hp` to that. Pass `maxHp: plan.maxHp` in `RunScreen`. Add a test that creates a combat with `hp: 92, maxHp: 92` and checks the hero unit.

## HIGH

### H1. The FightScreen "Easy mode" checkbox does nothing
- `apps/web/src/fight/FightScreen.tsx:30,93,103-110`. `easy` is state and is rendered, but the setup is `b: { enemies: e.units }`, so it never sets `hpPct` or `dmgPct`.
- Fix: `b: { enemies: e.units, ...(easy ? { hpPct: DIFFICULTY.easy.hpPct, dmgPct: DIFFICULTY.easy.dmgPct } : {}) }`.

### H2. Easy mode does not scale enemy `loseHp`, Seared, or Thorns, so the Umbral enemies and Vorthax stay at full strength
- `packages/combat/src/engine.ts:100-106` (`modifiedDamage` is the only place `dmgPct` is applied), `engine.ts:251` (`loseHp`), `engine.ts:512-516` (Seared).
- Examples: `rupture` (`lose(6)`) in `units.ts:381`, and the enemy Seared moves at `units.ts:307,328,355`.
- Fixes: scale an enemy actor's `loseHp` by `dmgPct` (with a minimum of 1 when the base amount is above 0). Document that status-based damage is unscaled, or scale enemy-applied Seared stacks too.

### H3. Damage that rounds to 0
- `engine.ts:104`. `floor(n * dmgPct / 100)` makes 1-damage hits do 0 at 55%. Multi-hit moves are the worst case (1 x N), and 2 x 55% gives 1.
- `applyDamage` is still called with `amount 0`, so the UI shows "0" intents and floating numbers. Thorns still trigger on a 0-damage hit.
- Fix: when `base + might > 0` and `dmgPct < 100`, use `max(1, ...)`, or use `round` instead of `floor`. Also hide the damage number when it is 0.

## MEDIUM

### M1. `fightStart` boons never run for PvP seat b
- `engine.ts:540`: `r.s.turn === 1`. Seat b's first turn is turn 2, so its `fightStart` boons are silently skipped. `boons.ts:3` also claims "Boons never appear in PvP", but the engine, `HeroSetup` and `validate` all allow them.
- Fix: track a per-side `started` flag (`SideState.fightStarted`), or decide that PvP has no boons and reject `boons` in a PvP setup.

### M2. `merchant.boon` and event shapes are not validated in saves
- `packages/campaign/src/save.ts:191-209` (`validContext`).
- `merchant.boon` is not checked: no id existence, no integer price, no `sold` boolean.
- A hand-edited `{id:'x'}` with no price shows "Buy for undefined shards", leaves the button enabled (`shards < undefined` is false), and `buyBoon` then sets `shards -= undefined`, which gives NaN. The next save then fails `isInt`.
- `merchant.items[].sold` is not checked either.
- Event: `option.id` is not checked against the allowed set. `boonOffer` is not checked against `COMBAT_DB.boons`. `cardOffer` is not checked to be a string or a known card. A bad `boonOffer` makes the "boon" option throw a RunError rather than fail at load.
- Fix: validate each of these in `validContext`. In `buyBoon`, also `need(Number.isInteger(b.price))`.

### M3. A boon dropped by the stage-5 Warden, or by a Warden with no gift offers, is never shown
- `run.ts:284-287` and `run.ts:289-292` return `loopCleared` or `stageClear` with `context` null or without `boonGained`. The boon was already added by `gainBoon` at `run.ts:273`, but `loopCleared` and `stageClear` do not display it.
- Fix: keep `boonGained` in the context for those phases and render a `BoonCard` in the stage-clear and loop-cleared panels.

### M4. Enemy `heal` is not scaled by `hpPct`
- `engine.ts:259-265`. At 60% HP a fixed heal of 8 is proportionally much stronger. Examples: the Seraphine ascension (`units.ts:134`) and lifesteal moves.
- Fix: scale enemy heals by `hpPct` as well, or note that it is accepted.

### M5. Signature-card tests are weak
- `packages/content/src/v2/v2.test.ts:137-173` only checks counts, upgrades, and that a deck full of them plays 800 bot actions. Golden rule 5 asks for a scenario test per card.
- Missing:
  - Bell of Judgment and Nyxara's Web actually springing, with Web's PREVENT, exposed and barrier.
  - Orbital Uplink springing on an enemy summon.
  - Gilded Guard (taunt) redirecting an enemy attack.
  - Override Virus stunning.
  - Hunger Below healing.
  - Gorrmaw's Tooth losing HP.
  - The `+` versions (the `gilded-guard+` and `maw-hatchling+` units).

### M6. Test gaps for difficulty and boons
- `display.test.ts` never uses `hpPct`, `dmgPct`, or boons, so the "scaled summons" mirroring in `display.ts:28,48` is untested. Engine-vs-display equality works today only because both call `scaledEnemyHp`.
- `engine.test.ts:765-791` covers only iron-sigil, ember-lamp, satchel and rift-core from `SAMPLE_BOONS`. The real `BOONS` are never played: thorn-charm, ward-stone, might-idol, vigor-wick (heal on the hero), scholars-tome.
- It does not test:
  - that a fight-start barrier survives turn 1 and is cleared on the next turn (the order is `startOfTurn`, then boons, which is correct);
  - turn-start boons not running on enemy turns;
  - a boon whose `fightStart` kills the last enemy.
- The events test (`boons.test.ts:~105`) only asserts `seen.size >= 2`. It does not assert that the blood altar was seen, and it only passes `if (!e) continue` quietly.
- Fix: add a test that plays each real boon, a display-reducer test with `hpPct`/`dmgPct`/boons, and assert that all event kinds (smith, altar, cache) are exercised.

### M7. `sim.ts` flags
- `tools/src/sim.ts:249-256`. `arg()` returns NaN for `--hp` with no value (`Number(undefined ?? fallback)` is fine, but `Number('abc')` is NaN). `createCombat` does `Math.max(10, NaN)`, which is NaN, so enemy HP is NaN.
- `sim.ts:4-5` header comment is garbled (the `--draft` description is merged into the `--hp` line).
- Fix: validate the numbers and repair the comment. Also consider clamping and validating `hpPct`/`dmgPct` in `createCombat`.

## LOW

- L1. `RunScreen.tsx:299` and `FightView.tsx:594`. The boon strips have no wrap or overflow handling (`run.css:606`). With 12 boons the top bar or run bar can overflow or collide at narrow widths. `BoonChip` shows only the first letter (Iron Sigil, Idol of Might, Rift Satchel and Rift Core are ambiguous). Tooltips are `title` only, so there is nothing on touch. Suggest `flex-wrap` and an icon or tap-to-expand.
- L2. `boons.ts`. The id `coin-purse` has the name "Shard Purse". The text duplicates the numbers rather than deriving them. `scholars-tome` (rare, turn-start draw) is mechanically the same as `rift-satchel` (uncommon, handSize). Differentiate or swap the rarities.
- L3. `run.ts:158-181`. Event labels hard-code 10 HP, 15 HP, 60 shards, 30 shards and 20%, which are duplicated in `chooseEvent`. Pull them into constants.
- L4. `run.ts:176-181` and `chooseEvent`. Bleeding while a heal-after-fight or rest option exists is fine, and `hp > 10` and `hp > 15` are always satisfied by the `hp > 20` guard. The checks only matter for tampered saves. The 'card' option silently does nothing if `canAdd` fails (`run.ts:458`); it should throw or hide the option.
- L5. `rewards.ts:84-103`. At tier below 5 the Gift is exactly the 3 signature cards, with no realm rares (the UI hint at `RunScreen` says "or another rare"). Also `giftOffers` loops with `guard` and `nextInt(rng, rares.length)`; this is safe only because of the `target` calculation. Consider a comment.
- L6. Signature balance for a later pass: Nyxara's Web (1 cost: prevent, exposed 2, 6 Barrier) is very strong, and Gorrmaw's Tooth is permanent Might 2 for 1 mana with a 3 HP cost. Orbital Uplink and Whisper Net only trigger when an enemy summons, so it is dead in most encounters (that is by design, but note it).
- L7. `run.ts:265-269` and `273`. `healAfterFight` heals before the boon drop and before the elite/Warden heal, so a Crystal Heart dropped by an elite does not get the vial heal. Order is cosmetic.
- L8. `run.ts:50`. `newRun` with an unknown difficulty throws a TypeError rather than a RunError.

## Checked and found OK
- Fight-start boon ops run once. They happen after the barrier clear and the draw, so Iron Sigil's Barrier survives into the enemy phase. Turn-start ops run only on the hero (`heroOf`), so they never fire on the enemy side.
- Duplicate boons are prevented by `offerBoon`, `gainBoon` and `parseRun`.
- `heal()` is clamped to `maxHp`, and `hpLeft` is validated against `maxHp`.
- A retried fight uses unchanged `run.boons` and `run.hp`.
- Event RNG is drawn from the run RNG, so the same seed reproduces.
- The smith is only offered when something is upgradable.
- The `display.ts` summon scaling matches the engine (`scaledEnemyHp`, `dmgPct`, tier Might).
- `plus()` on the signature cards yields existing units (`gilded-guard+`, `maw-hatchling+`).
- `source` is excluded from `rewardPool` and `signatureCards` skips `+` cards.
- The `attacker` and `target` selectors in the snares resolve correctly (`foeSummons` uses the summoned unit).
- Phases and `lowPct` use percent of the scaled maxHp, so `hpPct` is safe there.

## Resolution
CRITICAL fixed (HeroSetup.maxHp), HIGH fixed (FightScreen easy wired, enemy unblockable/Seared scaled, hits never round to 0), MEDIUM: fight-start boons for PvP seat b, merchant/event save validation, no hidden stage-5 boon. Deferred: enemy heal scaling, sim flag NaN, balance notes on Nyxara Web / Gorrmaw Tooth.
