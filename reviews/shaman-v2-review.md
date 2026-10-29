# Shaman second rework (commit 9f0ccda, DECISIONS #420): code review

Reviewer pass, 2026-10-29. Scope: everything in `git show 9f0ccda --stat` except the two untracked expansion docs. Robert's
deliberate decisions (no Spirit cap, Spirit never spent, Trinity with no count, several commands a turn from cards, the Hawk's random
dive, no summons, a deliberately strong trait) are treated as given and not reported.

**Note on the working tree:** while this review ran, uncommitted edits appeared in `packages/combat/src/{engine,types,view,bot,
smartBot,validate}.ts` and `packages/content/src/v2/build.ts` (a DECISIONS #421 rework: Burn status, `totemCommand` op, the `command`
action and `SideState.commands` removed). Those edits are mid-way (tsc fails on them: `build.ts` redeclares `command`, `pools/shaman.ts`
imports `commands`/`commandAll` that no longer exist, `index.ts` sets `trait.commands`). They are **not** reviewed here. Every line
number below is from commit 9f0ccda (`git show 9f0ccda:<path>`). Some findings (commands, the display reducer) may become moot under
#421; the boost, preview, Aura, text and save findings will not.

What I ran: `vitest` on `shaman.test.ts`, `rework.test.ts`, `retired.test.ts` (25 tests, all green, before the concurrent edits);
scratch scripts (outside the repo) that print `cardText` for all 83 cards and probe the engine. No balance sims.

---

## CRITICAL

None.

---

## HIGH

### H1. The card's live damage number leaves out the totems' help, every turn
`packages/combat/src/engine.ts:4558` (`previewCardDamage`), used by `apps/web/src/fight/FightView.tsx:1250`.

The preview builds its `Act` with `plus: 0` and never calls anything like `spellBoost`, so the help is missing from the number on the
card. That help is the trait's main every-turn effect.

- Scenario (checked): the starting totems, Ember Bolt in hand. The preview shows `lo 7 / hi 7`; playing it deals 10. Twin Cinders
  shows 5 x2 and deals 8 x2. Gathering Storm with a Thunderbird shows 3 and deals 5 to each enemy. With 6 Spirit and two Hawks, Ember
  Bolt shows 7 and deals 19.
- The Spellblade review counted "previews ignore discharged charges" as a fix. This is the same kind of problem, on a mechanic that
  comes up on almost every turn.
- Fix: split `spellBoost` into a pure `boostFor(db, sd, cd): number`, which reads `boostsUsed` without changing it, and a part that
  marks the boosts used. In `previewCardDamage`, set `a.plus = sd.totems ? boostFor(...) : 0` and add `a.plus` to each damage
  effect's amount, the same way `resonanceOf` does in `execOp`. Add a test: "Ember Bolt previews 10 with a Hawk, 7 after the first
  Flame spell."

---

## MEDIUM

### M1. The help goes on every damage op, every hit and every Barrier op, but the totem texts say a flat "3 more"
`engine.ts:1401` (`resonanceOf` adds `a.plus` to every `damage` hit, `loseHp` and `barrier`), `engine.ts:4323-4324`. The texts are
in `packages/content/src/v2/pools/shaman.ts:62,71,80`.

The engine follows SHAMAN.md ("each damage and Barrier number on it"). What the player reads, and what the trait estimate in §15
assumes (about +3 a helped spell), are smaller. Checked with the three starting totems:

| Card | Text plus "3 more" | Actual |
|---|---|---|
| Twin Cinders (5 x2) | 13 | **16** (+3 each hit; only the Thunderbird's text says "each hit") |
| Kindle (4, +2 with a Hawk) | 9 | **12** (the `ifTotem` op is boosted too) |
| Firebrand on a bleeding enemy | 14 | **17** |
| Ember Lance as the first card | 16 | **19** |
| Prism Spell (as Flame) | 6 dmg | **6 dmg + 6 Barrier + 4 to every enemy** (+3 on each of its three numbers) |
| Flame Shield | 5 Barrier ("Hawk: deals 3 more") | **8 Barrier** |
| Wind Wall | 5 Barrier ("Thunderbird: deals 2 more with each hit") | **7 Barrier** |

The same happens with Ice Shatter, Rime Shield and Eye of the Tempest (their second op), Storm Front, Maelstrom and Superstorm (each
hit, which the Thunderbird's text does cover), and every multi-hit Flame or Frost attack.

- Why it matters: the text understates the help, and it most rewards the cards with two ops (Kindle, Prism Spell), which the ledger
  prices without it (`tools/src/ledger/shaman.ts:2`: "the help is the trait's").
- Fix (Robert's call): either
  - (a) apply the help once per card: to the first damage op's first hit, or to the first Barrier op when the card has no damage. For
    example, keep `plus` on the `Act` only until the first op it changes, then clear it. Or
  - (b) keep the behaviour and fix the texts ("each damage and Barrier number on your first Flame spell each turn is 3 higher, every
    hit"), then reprice Kindle, Prism Spell and the multi-hit Flame and Frost cards.

  Either way, add a test that pins the chosen rule (Twin Cinders, Kindle).

### M2. The element Auras ignore Prism Spell, and Smoulder does nothing on untargeted Flame spells
`shaman.ts:243` (Smoulder), `:263` (Heart of the Pyre), `:515` (Lightning Rod). The trigger filter is `{ tag: 'flame' }`, and
`view.ts:466` gives it the text "Whenever you play a Flame spell".

- Prism Spell "counts as an element you have not cast this turn", but the `play` trigger matches the card's literal tags. Checked:
  with Lightning Rod out, Flame and Frost cast, then Prism Spell (as Storm), Lightning Rod does not fire. Smoulder does not fire for a
  Prism Spell cast as Flame either.
- Smoulder's op is `status('seared', 3, 'target')`. On Flame Shield, Pyre Ward or Phoenix Feather (`target: 'none'`) the trigger's
  target is null, so no Bleed is applied (checked: 0). The text promises Bleed on every Flame spell.
- Fix:
  - Have `finishCard` pass the resolved element (from `elementOf`) into the `play` trigger context, and let a trigger `tag` that is
    an element also match it. That is generic and has no card ids.
  - For Smoulder, either aim at `randomFoe` when there is no target, or change the text to "Whenever a Flame spell you play hits an
    enemy, apply 3 Bleed to it".
  - Add scenario tests for both.

### M3. Removing two retired ids sends old Assassin and Knight saves to Shaman cards
`packages/content/src/v2/retired.ts`. The commit deletes `flashpoint: 'reopen-the-wound'` (the Silent-copy Assassin block, old line
239) and `wildfire: 'sweeping-guard'` (the Knight block, old line 546), because the Shaman now owns live cards with those ids. It
also removes `gathering-storm` and `smoke-offering`, which are the Shaman's own and harmless.

- Scenario: a run saved before 0.104.0 with the Assassin's old `flashpoint`, or a Knight run with the old `wildfire`. It now loads
  with the Shaman's Flame card in that deck. The old mapping no longer applies, and `canonicalCard` keeps the id because it is live
  again. A non-Shaman then holds a Flame Attack. It is playable, so nothing crashes, but it is the wrong card, and in the Assassin's
  case a different effect.
- DECISIONS #420 says "Ids that collided with other pools were renamed (Ice Shatter, Charged Sky)". These two collide with *retired*
  ids, and that check missed them.
- Fix: rename the two new cards (e.g. `searing-flashpoint`, `wildfire-brand`; neither has art yet besides what the art doc lists) and
  restore the two old mappings. Or make the migration hero-aware. Add a test: no live card id was ever a key of `TRIMMED_CARDS` in
  git history (or keep a frozen list of past retired keys).

---

## LOW

### L1. A Prism spell's element is worked out twice
`engine.ts:855-860` is called from `spellBoost` at the start of the play (`:4323`) and again from `castElement` in `finishCard`
(`:4163`).

Today nothing can change `elementsTurn` in between: Prism Spell asks no choice, the echo does not cast, and the Auras fire after
`castElement`. A future Prism card with a choice or a nested play that casts could, though, get help for one element and light a
different one.
- Fix: resolve the element once in `playCard`, store it on the pending (as `plus` is) and pass it to `finishCard`.

### L2. Autoplays count for Trinity only on some paths, and never get the help
`engine.ts:3027-3037`. An autoplay that ends in `finishCard(..., free=true)` lights its element and can trigger Trinity and the Moon
Owl's Mana. The `how === 'stay' | 'exhaust'` branch (`:3027-3036`) skips `castElement`. Neither branch applies `spellBoost`.

Nothing in the Shaman pool autoplays, so this only shows up through Rift-crossed cards.
- Fix: call `castElement` in the stay/exhaust branch too, or skip it for every free play, and write down which.

### L3. A help is spent on a spell with no numbers
`spellBoost` marks the element's help used for any first spell of that element. Phoenix Feather (Flame: Reverb, draw) and Tempest
Call (Storm: Gather, draw) spend the Hawk's or Thunderbird's help on nothing.

Checked: Phoenix Feather, then Ember Bolt (Reverb), deals 7+7 with no +3. The text supports this ("your first Flame spell"), but the
player won't expect it.
- Fix (design): only mark the help used when the card has a damage or Barrier op, or note it in the totem tooltip.

### L4. Free Spell with another one-shot free status
`engine.ts:4251-4265` (the `makesFree` pattern). If he holds `freespell` and another free status that also covers the card (e.g.
`freeethereal` on a Fleeting elemental spell), each `makesFree` check sees the card free through the other status, and **neither**
is spent.

This is the same flaw `freeattack` and `freeethereal` already have, now extended. The Shaman has no way to get the second status
today.
- Fix: work them out in order: once one is spent, skip the rest, and have `makesFree` look only at the statuses not yet chosen.

### L5. The display reducer doesn't follow commands or the turn's reset
`apps/web/src/fight/display.ts:173-183`. A `command` event sets `commanded` but never lowers `commands`. A `commands` op only emits
a `totems` event. There is no `turnStart` reset of `elementsTurn` or `trinityDone`.

During an animation the Totems panel can show "1 command left: press a totem" after the command has been used. At his turn start the
last turn's lit pips stay until the snap. It corrects itself when the replay ends.
- Fix: lower `commands` on `command`, and clear the pips on that side's `turnStart`. Or give the `elements` and `command` events a
  `left` count. (Moot if #421 removes commands.)

### L6. Stale first-rework text and dead fields

| Where (commit lines) | What is stale |
|---|---|
| `types.ts:90-92` | "Spirit: at most SPIRIT_MAX... spent to empower a command (+SPIRIT_BOOST)"; `rousing` and `shelter` are no longer read by any command |
| `types.ts:1006-1008` | `TotemDef` doc: "once a turn... aimed at a foe, a friendly or nothing. Rousing, and one Spirit when `empower` allows" |
| `TotemDef.aim`, `TotemDef.empower`; `command` event's `target`, `empowered` | always `'none'`, `false`, `null`, `false` |
| `build.ts:348` | "Gain Spirit (at most 3, kept between turns)"; also `rouse` and `shelter` helpers, now unused |
| `engine.ts:137`, `engine.ts:1400` | "a command's Rousing and Spirit" (`plus` is now also the spell help) |
| `bot.ts:123` | "so the cards' Rousing lands on it" |
| `view.ts:1047-1055`, `apps/web/src/fight/info.ts:425-435, 694-698`, `packages/campaign/src/rewards.ts:84-86` | Rousing and Shelter text and keyword hooks for statuses no card gives |

- Fix: rewrite the comments; drop `aim` and `empower` (or make them optional) and the dead event fields; leave the
  `rousing`/`shelter` status ids only if saves need them.

### L7. The "built" proposal disagrees with what was built
`docs/reworks/SHAMAN_ELEMENTS_PROPOSAL.md`:

| Line | Proposal says | Built (DECISIONS #420 and SHAMAN.md) |
|---|---|---|
| 20 | "a Prism Spell lights all three" | one pip, the next element |
| 106 | Prism Spell "Counts as Flame, Frost and Storm" | one element |
| 17 | Moon Owl's command: next spell "costs 1 less" | costs 0 |
| 117 | Shaman's Insight: "costs 1 less" | costs 0 |
| 50 | Smoulder: 2 Bleed | 3 Bleed |

- Fix: add a "Built differently" note at the top, or correct the lines, so the next reader doesn't take the proposal as the rules.

### L8. The bot spends commands last
`packages/combat/src/bot.ts:123-135`: the bot only weighs a command when no card is worth playing. With a Moon Owl, the Free Spell
command comes after the spells it should have paid for. Bot quality only, not rules.

### L9. Five totem positions in the side column
`fight.css:2594-2604`: `.totems__row` is a non-wrapping flex row of `min-width: 3.6rem` buttons. Five of them, plus gaps, come to
about 20rem, which may overflow the FloatPanel at narrow widths. I did not check this on screen. Fix: `flex-wrap: wrap`, or shrink
the buttons when there are more than 3.

### L10. Missing tests for the trickier rules
- the help is not on the echo (Reverb)
- the help carries over a choice (checked by hand with a scratch card: correct, 8 + 8)
- the Elder Tree's help goes to the first spell of any element
- Free Spell is not spent on a card that is already free (checked by hand: correct)
- Spirit Chorus gives 2 commands next turn (checked by hand: correct)
- Great Spirit's Call with Storm Sovereign (checked: 6 + 3 + 3x3)
- the preview (H1)

---

## Checked and fine
- Two of a kind help twice. A kind he doesn't have adds nothing, and its help is not marked used.
- Spirit's half is `floor(spirit / 2)` per totem, the Elder Tree included.
- Trinity fires once a turn, only with `trait.trinity`, never for a hero without totems, and not on the echo. The Moon Owl's Mana
  comes on Trinity, before the `play` Auras.
- Free Spell is kept when the card is already free (Kindle at 0).
- `commands` resets at turn start before the `turnStart` Auras (Spirit Chorus stacks correctly).
- `commandAll` doesn't spend commands and fires `command` per totem.
- `totemSlot` stops at 5.
- "Of your choice" plants exclude rare totems.
- `onPlant` runs on every plant. `replace` only fires for a different kind (Ancestral Exchange onto the same kind gives no Spirit).
- `wire.ts` keeps only `totem`.
- The new `SideState` fields are plain JSON. The RNG is only used through `nextInt`.
- Card text matches behaviour for all 83 cards, except for M1 and M2.
