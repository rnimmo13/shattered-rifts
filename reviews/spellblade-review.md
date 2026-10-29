# Spellblade rework review: Imbue / Discharge (DECISIONS #417)

Reviewer pass on commit `c6ccec6` plus the uncommitted Spellblade changes (pool retunes, `enchantLook.ts`, `tools/src/ledger/spellblade.ts`,
docs). The design brief is `docs/BASE_CLASS_REWORKS.md` §7 and the contract is `docs/reworks/SPELLBLADE.md`. No balance sims were run.
The targeted tests pass: `spellblade.test.ts` and `rework.test.ts`, 22 tests. I also ran the scenarios below in a scratch script against the
live engine.

Line numbers in `packages/combat/src/engine.ts` and `types.ts` are only approximate. Both files were being edited for the Shaman rework
(#418) during this review, so functions are named as well.

**Typecheck note:** right now `tsc` fails in combat, content and web. The cause is the Shaman work in progress, not the Spellblade:
- `types.ts` gained the metrics `spirit`/`totems`/`totemKinds`/`totemsOf`, the statuses `spirit`/`rousing`/`shelter` and the pending kinds
  `plantKind`/`plantAt`.
- So `metricValue` (engine.ts ~777), `METRIC_WORDS` (view.ts ~444), `STATUS_INFO` (info.ts:15) and `TITLE` in PickModal.tsx:9 are no
  longer exhaustive.

None of these errors points at Spellblade code.

Purity and determinism are fine. There is no `Math.random`/`Date`/DOM, the `Set` use is order-independent, the bot and `legalActions` handle
the new pending kinds through the generic `pickOptions`, and the new `SideState.enchants`/`Pending.ember|glass|discharged` fields are
plain JSON, so saves, PvP state and action logs carry them. No card id is special-cased in the engine. The retired-id block (46 ids) maps
nothing that is still live elsewhere.

---

## CRITICAL

None.

## HIGH

### H1. The attack preview ignores `per('discharged')`, so Overcharge Edge and Glass Requiem show the wrong numbers
- **Where:** `previewCardDamage`, the `op.op === 'discharge'` branch (engine.ts ~4349, `if (op.op === 'discharge' && !earlier) { ... return; }`).
  It works out `emberLo/emberHi` but never sets `a.discharged`, so `amountOf(... per('discharged') ...)` reads 0.
- **Failure:** blade `[ember, glass]`, Overcharge Edge (`discharge(2), scaled(dmg(4), per('discharged', 4))`) aimed at a foe. The card shows
  **7**, but the engine deals 4 + 8 + 3 = **15** on the hit (17 with the Glass shard; checked). Glass Requiem's second effect
  (`scaled(dmg(0,'allFoes'), per('discharged',3))`) shows **0**, but the engine deals **6** to every enemy. These are Burst payoff
  cards, and the number shown is exactly what decides whether to play them. This breaks the SPELLBLADE.md "Previews" contract and golden rule 3
  (the screen should show what the engine will do).
- **Fix:** in the discharge branch, set `a.discharged` to the count it would spend: `count >= 2 ? list.length : Math.min(1, list.length)`.
  For a single discharge from an empty blade that is 0. Then add a preview test for Overcharge Edge and Glass Requiem with 0, 1 and 2
  charges.

## MEDIUM

### M1. Glass Requiem's AoE rider is a real attack hit even at 0 damage: Thorns, Traps and Reflect answer it
- **Where:** `packages/content/src/v2/pools/spellblade.ts:441` (`glass-requiem`): `[discharge(2), dmg(14), scaled(dmg(0, 'allFoes'), per('discharged', 3))]`.
- **Failure:** empty blade, two enemies with 3 Thorns each. Playing Glass Requiem costs the hero **9 HP** instead of 3 (checked). The
  rider makes a 0-damage attack hit on every enemy, and Thorns answer each one. In the Arena, a "when attacked" Trap would spring on that
  phantom 0 hit and be spent. Even with charges, the rider is a second attack on the target, so it takes Thorns twice.
- **Fix:** wrap the rider the way the Assassin does (`assassin.ts:236`): `when('discharged', { atLeast: 1 }, [scaled(dmg(0,'allFoes'), per('discharged',3))])`.
  Or, if the rider is meant as "a shard, not an attack" like Glass, make it a non-attack effect. Then re-price it in the ledger.

### M2. The enchantment choice modal keeps the previous answer between two choices in a row
- **Where:** `apps/web/src/fight/FightView.tsx` ~2047, `<PickModal key={view.pending.pool.map((c) => c.id).join()} ...>`. For
  'enchant'/'discharge'/'recast', `PendingView.pool` is always `[]` (view.ts `pendingView`), so the key is `''` for every Spellblade choice.
- **Failure:** Etch the Edge or Unbreakable Crown on a full blade asks twice in a row (checked: two 'enchant' choices, both e0/e1). React
  reuses the same PickModal, so `chosen` still holds `['e0']` from the first answer. The second question opens pre-selected with Confirm
  enabled, and a double-click replaces the wrong charge. If a recast ever followed an enchant choice, the stale `'e0'` would be sent to a
  pool of kinds and throw `RulesError`.
- **Fix:** key the modal on the whole choice, for example ``key={`${p.kind}:${p.incoming ?? ''}:${(p.charges ?? []).map(c => c.id + c.kind).join()}:${p.pool.map(c => c.id).join()}`}``.
  A pending sequence number from the engine view would be better still. Alternatively, reset `chosen` in an effect on `pending`.

### M3. The display reducer ignores the `enchant` event, so the Obsidian Blade panel lags the animation
- **Where:** `apps/web/src/fight/display.ts:91` `reduceEvent` has no `case 'enchant'`. The panel reads `view.sides[side].enchants`, and
  during playback that view is `viewFor(g.display)` (FightView.tsx ~748).
- **Failure:** during a card's playback the panel still shows the charges from before the card: a discharged Ember stays lit through the
  hit, and an Imbue does not appear. Then everything jumps at the final resync (`g.display = clone(after)`). The Trickster's Suits got a
  reducer case for exactly this reason ("the pips light as the card is played").
- **Fix:** add `case 'enchant': s.sides[e.side].enchants = [...e.enchants]; return;` to `reduceEvent`. Optionally flash `e.spent`.

## LOW

- **L1. Twin Edge stacks are all eaten by one discharge.** `spendCharges` (engine.ts ~777) removes every `twinedge` stack. Two Echoing
  Blades in one turn give 2 stacks (checked), and the first discharge silently wastes the second. Fix: spend one stack, or cap Twin Edge at
  1 so the second Echoing Blade reads as wasted.
- **L2. A pointless question when both charges are the same.** `imbue` (engine.ts ~583) asks which charge to replace even when both are the
  same kind (`[ward, ward]`), but `discharge` skips the question for identical charges. Fix: when `list[0] === list[1]`, replace index 0
  without asking.
- **L3. Dead code in `pickCards` that would lose carried charges.** The `asked` branch (engine.ts ~4215, `if (asked) asked.rest = [...]`)
  can't be reached today, because triggers run with `pick: false`. If it ever were reached, `act.ember`/`act.glass` would not be copied
  into `asked`, and the card's carried Ember/Glass would be lost. Fix: copy `act.ember/glass/discharged` into `asked`, or remove the branch.
- **L4. The validator only checks the top level.** The discharge-before-damage check in validate.ts looks at top-level effects only. A
  `discharge` nested in `when`/`choose` would bypass it, and `spendCharges`' "card has no attack" test (`a.card.effects.some(op ===
  'damage')`, also top-level only) would then drop Ember from a card that does attack. No live card does this. Fix: reject nested
  `discharge`, or walk nested ops in both places.
- **L5. The blade panel's spend highlight misses one case.** EnchantSlots.tsx:29 highlights nothing for a single discharge on two
  identical charges, though the oldest is certainly spent. Also, FightView.tsx:1452 builds `preview.imbue`, but `EnchantSlots` never
  uses it (half-done: an incoming Imbue is not shown).
- **L6. Hard-coded numbers in UI text.** "of 2 enchantments" (EnchantSlots.tsx:23) and the numbers in `info.ts` (`discharge`
  keyword) and `tips.ts` (`enchants` tip) are written in, rather than taken from `ENCHANT_SLOTS`/`EMBER_DAMAGE`/`GLASS_DAMAGE`/`WARD_BARRIER`
  (the panel and `enchantLook.ts` already use the constants).
- **L7. The Discharge keyword text says "for this attack".** Three Skills discharge (Glass Barrier, Shatterguard, Mirror Glass), and on
  those the Ember is lost. The tooltip should say so (SPELLBLADE.md does).
- **L8. Dormant Obsidian Blade tooltips.** `info.ts:334-346` (Blade Sweep, Blade Echo, Bladebane) still say "Your Obsidian Blade ...".
  Nothing in content grants these statuses any more, so they are not visible, but the text is stale if they ever come back. "Twin Edge
  lasts the turn" is consistent everywhere.
- **L9. Docs out of step with the code:**
  - `docs/reworks/SPELLBLADE.md` "Strategies" names cards by their old internal ids or names: "Whetstone (Inscribe Twice)" is shown as
    *Etch the Edge*, and Faint Glow, Sunstrike, Skybolt, Astral Pulse, Gamma Burst, Devastate, Comet, Supernova, Radiance, Stellar Wind,
    Pale Beacon and Star Barrier all have other display names.
  - SPELLBLADE.md says a replacement "fires nothing", but the code fires `imbue` on a replacement (trait draw + Barrier, both in
    `pickCards` and in the no-choice path). That is probably intended ("Fires `imbue`" in the same row), so say "fires no discharge".
  - `docs/09_ROSTER.md` still lists the Spellblade pool size as 80 (it is 53).
  - DECISIONS #417, guide §15 and the ledger agree with the code numbers (Cleaving Edge+ 5, Warm Anvil+ 3, Emberglass Covenant 6/9,
    Tyrant Strike 15/19, Hollow Gaze 7/10, Mirror Glass 11/15, Dying Ember 10/12).
- **L10. Ward goes through the card's own `barrier` op.** `spendCharges` gives the Ward's Barrier with the card's `Act`, so card-level
  Barrier modifiers (Unmovable's "first Barrier a card gives you", `resonanceOf`) apply to it and can use up Unmovable's doubling before
  the card's own Barrier. This is harmless for her own pool, but it is a cross-class interaction. Fix: run it with `mkAct(hero)` if Ward
  should be a flat 3.

## Checked and fine
- **Charges spent exactly once.** This holds for one discharge, both, a choice and identical charges. A replacement is not a discharge.
  An empty blade spends nothing and keeps Twin Edge.
- **Ember lands on the first hit only.** After a discharge choice, the carried Ember and Glass reach the attack (`Pending.ember/glass/discharged`
  → `mkAct` in `pickCards`). Checked: Obsidian Cut on `[glass, ember]` → pick Glass → 8 on the target, 2 on the other.
- **Glass** breaks after the attack, also on enemies the attack killed off, never after the fight is won (`r.s.winner` check), and as a
  non-attack (no Might, Exposed or Thorns).
- **A Skill that discharges** loses its Ember and breaks its Glass at once.
- **Replays** (Reverb, Echo, Blade Echo, `inst.replay`, `playFree`) use a fresh `Act`. They spend only what is left, oldest first, without
  asking, and copy nothing.
- **Previews never change state**, and the Ember range and Twin Edge doubling match how the card resolves (apart from H1).
- **Trait:** the fight-start Ward is imbued before the trait trigger is registered, so it does not use up the "first Imbue each turn". In
  PvP, side b gets its Ward on its opening turn.
- **Pending view and modal:** the pending view shows charges and the incoming kind, and PickModal and enchantLook import correctly.
- **No stale Spellblade text:** none of her current card texts mentions Sharpen, Arcana, Retainers or ◆ (checked through `cardText`).
- **Run migration** (`CLASS_REWORKS.spellblade`) is tested.
