# Shared balance pass: 0.195.0 / rules 79 (local, unreleased)

The goal is three or more distinct competitive styles per class in campaign and Arena under shared rules. [Versioned chart](balance-history/0.195.0.md), [baseline](balance-history/0.194.0.md), [history and real-playtest workflow](balance-history/README.md). No balance simulations or measured match results were used. Fixtures verify implementation. Current A-band estimates remain hypotheses, especially Golemancer and Deathwish.

## Changes

| Item | Before → implemented | Why / boundary |
|---|---|---|
| Strip for Parts / Detonate | Repeatable → Consume, base and upgrade | Same costs/effects; closes natural discard recycling. Explicit reclaim/copy effects still work under their normal rules. |
| Swarmwright | Fabrication per 4 → per 3 successful non-starting summons | Four slots and 1 Primed retained. At 3/6/9 summons: +1/+2/+3 per companion attack hit; future replacements share it. |
| Golemancer | Add 50% earned max-HP death recovery, cap 30 | Retains +3 companion max HP/own turn and +1% large-machine attack per max HP, capped +100%. Next successful new Heavy/Colossal receives saved HP once. Simultaneous deaths keep the largest reserve, not their sum. Salvage/previous reserve is inherited, not newly earned; scrapping never banks and revivals do not spend it. |
| Bonelord | Extra Raise 1 → 2; Marrow 1 → 2 | Recurring companion HP and +1 more damage on each commanded companion hit. |
| Blood Knight | First real own-card HP payment each own turn gives +10 percentage points Retaliation | Shares existing 30/owner-round charge and 60 stored caps. Prevented HP loss pays nothing. Existing percentage-loss charge remains. |
| Deathwish | Abrupt +25% at ≤40% → ramp below 70%, reaching +25% at 40% | Rounded down percentage-point bonus; stacks with base Clutch as before. Once/fight hostile lethal rescue covers Skill/Aura/Attack/Bleed/Burn. Leaves 1 HP +10% max HP Barrier. Self-payment, Fate execution and sudden death excluded; later hits kill. |
| Predator | All additional draws 2 Primed → first 6 own-turn draws 2 each, later 1 | Opening-hand draw excluded. Eight additional draws =14 rather than16 Primed; six =12 unchanged. |
| Soulreaper | Unlimited Harvest/Barrier → first 6 genuine consumptions per owner-round | Round starts at own turn start. Further Consume/base Grave Chill still works. Reap remains once after own-turn cleanup/actions when any genuine Consume occurred that turn; 4+2 per eligible Harvest this fight, no fight-total cap. Three consumes/round unchanged: Reap10/28/52 at turns1/4/8 and9 Barrier/turn. Six/round: Reap16/52/100 and18 Barrier/turn. |
| Storm Sovereign | Cost1 →2; Barrier only first3 commands/push-outs each turn | Damage3/up4 on every activation retained; Barrier3/up4 gives9/12 maximum per copy per turn. Standing passive effects never triggered it. Clarified generic command text. |
| Fault Lines | 2 Fracture each Sword/Spell → first6 give2, later1 | Seven qualifying plays =13 instead of14. A card tagged both counts once; copies have their own counters. Cost2/up1 unchanged. |
| Soul Tithe | Self-Fate3/turn → max(3, ceil(2% max HP)) | At70/149/151/420 maxHP:3/3/4/9. Upfront Mana3/up4 and draw2/cost0 unchanged. |
| Hostile debuff ownership | Exposed hero exclusion / active-side assumption → applier-owned hostile triggers | Enemy heroes and companions qualify, reactive turns credit their applier, self-debuffs do not. Fate/debuff triggers use the same ownership. Bleed/Burn retain latest applying side for lethal-rescue attribution. |
| Campaign reward consistency | No reroll → one optional combat-card reward reroll per Rift Tier | Uses original duel/Elite/Warden Gift generation and odds. Can repeat a prior option; no rarity guarantee, archetype filter or retry-until-better loop. Spoils must be taken first; no event/Ascendancy rerolls. Saved RNG/use prevents refresh granting another reroll. |
| Cleanse clarity | Static card wording → exact current self-debuff before→after note | Desktop hover and portrait touch inspection; Fracture explicitly cannot be cleansed. No availability or values changed. |

War Engine example: base22 HP, earned48 growth gives70; on death reserve24 makes the next new War Engine46. It still receives the normal +46% large-machine attack multiplier at that max HP. Its inherited24 does not earn another reserve when it dies. Death can bank even if Backup Core revives a fresh machine; revival preserves the bank for a later new build and does not refund the revive card/charge.

## Resource-card audit (hand estimates, no additional unapproved edits)

Use the established guide: roughly9 points/Mana,3 per draw, and1.5 per self-HP near campaign base health. A card slot, Consume/rarity and combo context matter. These rates do not price Arena flat HP payments correctly by themselves: at six-times HP the same payment is roughly one sixth of its base-health risk. Below are upfront contributions, not a proof of balanced total value.

| Card | Base upfront rate | Status / remaining concern |
|---|---|---|
| Crimson Offering | 2 Mana +3 draw −6 HP ≈18+9−9=18 points | Rare Consume; flat HP cost weakens at Arena HP. Review real Blood Knight burst; unchanged. |
| Blood Tithe | 2 Mana +2 draw +1 Might −7 HP | Rare Consume; recurring Might and Reaver synergy add value beyond immediate24 resource points. Upgrade pays5HP. Unchanged. |
| Adrenal Surge | 2 Mana +1 draw −3 HP ≈18+3−4.5=16.5 | Uncommon Consume; obvious efficiency review candidate. Draw happens before its HP payment, so lethal payment still matters. Unchanged. |
| Wellspring | 4 Mana (5 upgraded) ≈36/45 | Rare Consume; no HP price, strong X/command engine fuel. Does not draw its own replacement. Unchanged. |
| Rush of Blood | 1 Mana +2 draw ≈15 (upgrade2 Mana ≈24) | Rare Consume; high-quality burst/cycling. Unchanged. |
| Soul Tithe | 3 Mana +2 draw ≈33 (upgrade≈42) | Aura removal is not a genuine Consume; recurring self-Fate now proportional with a floor. At420HP it adds9/turn per copy. Existing cleanses can delay Fate: this remains a watch item. |

These cards across multiple pools demonstrate why changing Ascendancies alone cannot establish equal class strength. Preserve strong identities; review the strongest resource chains against comparable normal decks with the new report data. No global draw/Mana nerf was inferred from the user's approval.

## Counterplay audit

Shake It Off is common Neutral1Mana, reduces every cleansable debuff by max(1,ceil25%), then4Barrier. Steady Nerves is uncommon Neutral1Mana, max(2,ceil50%), then6Barrier. Purging Light is rare Neutral2Mana, complete cleanse then8Barrier, Consume. They are already in general reward/shop eligibility; they are optional choices, not guaranteed finds. Do not claim every deck can always answer a Fate/Bleed stack. Fracture deliberately persists and cannot be cleansed; race it with pressure, not a misleading cleanse promise. Companion targeting/area pressure already supplies counterplay to summoners. No mandatory counter card, sideboard or forced pool grouping added.

## Verification and release

Deterministic scenarios cover growth/recovery/inheritance/revival/scrapping, trigger limits/reset/JSON restoration, hostile Exposed/reactive ownership, Skills/DoT rescue and Fate exclusion, proportional Soul Tithe, reroll profiles/persistence/gates and report validation/deduplication. Existing Ascendancy scenarios retain normal-turn and damage-preview checks. Real playtesting must establish consistency and fairness.

Rules79 makes old unfinished encounter logs restart through existing checkpoint compatibility handling. Web and desktop both use0.195.0. No release/push/deploy is authorized by this implementation request.
