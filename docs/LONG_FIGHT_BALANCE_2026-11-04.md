# Shared long-fight balance — 0.198.0 / rules 81

2026-11-04 · decision #603 · based on released 50bc92a (0.197.0/rules 80). Robert explicitly requested implementing and pushing/deploying all proposals, including the two defensive buffs. This implements P1–P3/P5–P7 from the Arena review; P4 was already released in 0.197.0. Website/server and standalone desktop share the new rules.

## Exact changes

All changes apply to Campaign and Arena. Costs, rarities, types, Consume flags and unlisted effects remain unchanged.

- **Necromancer — Grave Chill:** Genuine Consumes give 3 Fate each for the first 6 per owner-round, then 1 each (previously 3 without a limit). An owner-round starts on your turn and lasts until your next turn starts, including reactive Consumes on the opponent’s turn. Ally deaths still give 2 Fate.
- **Soulreaper — Harvest:** Only the first 3 genuine Consumes per owner-round add Harvest (was 6). The first 6 still grant 3 Barrier each. Reap remains 4 + 2 damage per accumulated Harvest, once at the end of your own turn if you consumed that turn; accumulated Harvest has no fight-total cap.
- **Spellblade — Fault Lines:** Base and upgraded: each Aura gives 1 Fracture on each of your first 6 own-turn Sword/Spell plays (was 2), then 0 on later plays (was 1). Copies count separately and reset each own turn; a card with both tags counts once. Costs remain 2/1 Mana. Permanent Fracture and Shatterer’s 15% bonus stay unchanged.
- **Spellblade — Measured Ruin:** Added damage on the first qualifying Spell Attack each turn drops from 2 to 1 per spent Power, or 3 to 2 upgraded, per hit. Copies still stack; the Aura still costs 2 Mana. Sword-only attacks such as Obsidian Drill do not qualify.
- **Brewmaster — Fermentation:** End-turn healing drops from 1% to 0.6% max HP per stack, rounded up once after totaling all stacks. The five-stack cap, actual Hangover-payment trigger and 2 Barrier per stack stay unchanged. At five stacks, healing is 16 instead of 27 at 528 max HP, 18 instead of 30 at 588, and 3 instead of 5 at 88.
- **Knight — Crimson Offering:** Base and upgraded change from 2 Mana immediately to 1 immediately + 1 next own turn. Draw stays 3/4 and HP payment stays 6/5.
- **Hunter — Blood Tithe:** Base and upgraded change from 2 Mana immediately to 1 immediately + 1 next own turn. Draw 2, Might 1 and HP payment 7/5 stay unchanged.
- **Hunter — Adrenal Surge:** Base and upgraded change from 2 Mana immediately to 1 immediately + 1 next own turn. Draw stays 1/2 and HP payment stays 3/2.
- **Rogue — Rush of Blood:** Upgraded changes from 2 Mana immediately to 1 immediately + 1 next own turn. Base still gives 1 immediately; both still draw 2.
- **Shaman — Wellspring:** Base changes from 4 Mana immediately to 2 immediately + 2 next own turn. Upgraded changes from 5 immediately to 2 immediately + 3 next own turn.
- **Necromancer — Soul Tithe:** Base changes from 3 Mana immediately to 1 immediately + 2 next own turn. Upgraded changes from 4 immediately to 1 immediately + 3 next own turn. Draw 2 and recurring self-Fate of the greater of 3 or 2% max HP rounded up stay unchanged.
- **Shaman — Spirit Offering:** Base changes from 2 Mana immediately to 1 immediately + 1 next own turn. Upgraded changes from 3 immediately to 1 immediately + 2 next own turn. Still adds Void to your discard and remains repeatable.
- **Trickster — Cut the Deck:** The conditional 1-Mana refund now works once on your own turn across all base/upgraded copies and replays, rather than on every qualifying play. The three-suit requirement must be met before the allowance is spent. Cost 1 and draw 2/3 stay unchanged.
- **Knight — Scent of Weakness:** Each Aura draws 1 on only the first 3 hostile Exposed applications per owner-round, instead of without a limit. Base and upgraded share this rule; each Aura counts independently, including reactive applications during the opponent’s turn. Two Auras can draw up to 6 per owner-round.
- **Bonelord:** New: after your first Command played on your own turn resolves, gain 3 Barrier per surviving Bone Thrall, capped at 9. A first Command with no surviving Thralls still uses that turn’s opportunity. Existing Raise 2 bonus and Marrow 2 remain.
- **Deathwish:** New: before your first Attack played on your own turn resolves, gain 5% max HP as Barrier, rounded up, if you are already at or below 40% HP. Playing that first Attack above 40% uses the opportunity without granting Barrier. Free plays qualify; repeating the same Attack’s effects does not grant it again. Existing damage ramp and once-per-fight rescue remain.

Existing cards and decks receive these changes. Resource cards keep their total Mana, costs and Consume behavior; delayed Mana arrives once at the start of your next own turn and separate grants add together. Hero HP and enemy scaling are unchanged. Unfinished battles from older versions restart from their saved encounter checkpoint; Campaign progress and decks are kept.

## Timing and implementation

Owner-round limits reset at the owner's next turn start, not the opponent's start. Harvest's three growth triggers and six Barrier triggers are independent. Grave Chill's six full-Fate triggers are shared across real consumption sources. Aura limits are per installed Aura; Cut the Deck uses a side-wide shared key so copies/upgrades/replays cannot reset the refund. A failed suit condition leaves the refund available.

Generic playStart fires only after a legal play pays its cost, before card effects, for paid and free plays. Deathwish tests HP at that point; self-injury later in the Attack cannot retroactively qualify it. Preview clones isolate the same pre-Attack Barrier behavior from the live state. Bonelord reserves the first Command instance at playStart and counts survivors after that same instance finishes. Nested free Commands cannot steal the reservation; pending choices and counters survive serialization. Barrier protection is not healing, a Taunt or protection from direct HP loss/Fate.

## Hand budgets, not simulated matches

- Soulreaper at three genuine Consumes every owner-round retains Reap 10/28/52 on own turns 1/4/8 and 9 Barrier per such turn. At six, Harvest growth is halved: turn-eight Reap 52 instead of 100 while Barrier remains 18. Reap needs a qualifying own-turn Consume; don't count a free attack every round if the deck runs out. Eight Consumes now give 20 Grave Chill Fate rather than 24 (before other Fate modifiers). Fate is an execution threshold, not equivalent immediate damage.
- Two Fault Lines at three qualifying plays give 6 Fracture/turn instead of 12; at six, 12 instead of 24. Later plays add none. Dedicated Fracture cards retain their role. This is the largest sustained offensive reduction and the highest Campaign XVII–XX underperformance risk.
- Two base Measured Ruins at 20 spent Power yield Archmage Molten Ruin 192 instead of 232 before Exposed; upgraded Auras yield 232 instead of 272. Refund remains 10 Power, so another spell is a different resource state. Sword-tagged Drill does not get this Spell-only bonus.
- Fermentation at cap gives 3% max HP healing plus 10 Barrier each end turn: 16+10 at 528, 18+10 at 588, 3+10 at 88. The Barrier is unchanged, so the total defense reduction is smaller than the 40% healing reduction. Actual Hangover payments still establish the engine.
- Bonelord gains 0/3/6/9 Barrier with 0/1/2/3 surviving Thralls. This buys hero survival without raising Thrall HP conversion or making an army protect the hero automatically. Losing the board removes the new benefit.
- Deathwish gains 5 Barrier at 88 max HP, 27 at 528, 30 at 588. Low HP and correct first-Attack sequencing are mandatory. Fate, direct HP loss and follow-up damage can still defeat it.
- Resource cards preserve total Mana, but next-turn Mana is less valuable for immediate chains. Each listed change moves 1–3 Mana out of the current turn; it cannot fund another card now. This reduces front-loaded tempo without deleting paid resources. At the costing guide's immediate Mana rate, the removed immediate budget is proportional to that shifted amount; do not value a delayed grant as immediate Mana or double-count its next-turn payout. Draw, blood payment, Void and self-Fate risks remain. Next-turn stacking can still create a burst and must be watched.
- One successful Cut the Deck refund remains effectively free after its condition. The second qualifying play costs its printed 1 Mana. Two Scents can still draw 6 per owner-round, so neither draw engine disappears.

## Assessment and follow-up

The costing guide prices the first two immediate Mana at 7 points each, additional immediate Mana at 3.5, and next-turn Mana at 4. Isolating only the Mana component:

| Cards | Base Mana budget, old → new | Upgraded, old → new |
|---|---|---|
| Crimson Offering, Blood Tithe, Adrenal Surge | 14 → 11 | 14 → 11 |
| Rush of Blood | 7 → 7 | 14 → 11 |
| Wellspring | 21 → 22 | 24.5 → 26 |
| Soul Tithe | 17.5 → 15 | 21 → 19 |
| Spirit Offering | 14 → 11 | 17.5 → 15 |

Wellspring's scalar budget rises slightly because the guide discounts immediate Mana above two more heavily than delayed Mana. This does not make its immediate combo stronger: only two Mana arrive now. The discrepancy shows why the budget is a heuristic and timing must be evaluated separately. All non-Mana benefits/costs are unchanged; these numbers are not whole-card scores or win-rate predictions.

See [all 30 projected grades](balance-history/0.198.0.md), [CSV](balance-history/0.198.0.csv), and the authored [JSON](balance-history/0.198.0.json). Ten class starts are separate from Ascendancies, which unlock after Tier III. Campaign progression and opening/extended/10–15-turn Arena strength, setup, recovery, rare reliance, uncertainty and previous Arena grades are preserved. Older snapshots remain unchanged.

The central estimates land in the A band, but that is a hypothesis, not proof that all builds are equally strong. Shatterer and Deathwish retain B+ downside risk; Soulreaper/Archmage/Cardsharp still have upper-band risk; Monk and Shaman retain strong shared pools. There are zero measured matches in this snapshot. Run no balance simulations. Collect comparable real games in both seats and Campaign tier bands, including failed setups, timeouts and board losses. Revisit when reports exist; do not erase these estimates retrospectively.

Hero HP stays at 6x class base with +60 for second seat; minions, targeting, campaign enemy damage and the 20-minute/75-second clocks remain unchanged. Holding those variables fixed makes this broad card pass easier to evaluate. Ten-plus turns per player remains a target, not a guarantee.

## Validation

`pnpm check` passed: lint (two existing unrelated React refresh warnings, no errors), all workspace type checks, 3,758 tests in 166 files, and production builds. The 27 new deterministic fixtures cover exact base/upgraded Mana timing, owner-round caps, reactive triggers, independent/shared limits, nested Commands, survivor counting, first-Attack thresholds, previews and serialization. All 16 historical assessment artifacts match their committed bytes. Fixtures establish rule behavior, not A-tier parity or late-campaign clears.
