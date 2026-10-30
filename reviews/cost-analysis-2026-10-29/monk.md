# Monk: card cost analysis (2026-10-29)

Hand-priced against `docs/14_CARD_COSTING.md`, live data 0.128.0. The Monk is on his pre-rework cards (DECISIONS #428): stances
(Serene, Fury, Radiant), Fervor, the trait Inner Fire (1 Fervor a stance entered; 2 Mana the first time each turn you leave Serene;
2 Primed on leaving Fury). 80 cards. Suggestions only; nothing was changed.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall** | **C** | 59% on budget (B needs 65%) with 5 broken or dead cards (B allows 2). No path is clearly over or under. |
| Power level | **fair** | mean -2%, median 0%. Flow sits a little over (+2% mean but 7 strong/broken), Fury a little under (-6%). |
| Consistency | **C** | spread 21 points; 14 strong and 14 weak around a fair middle. Most misses are Auras whose trigger the path seldom meets. |

| Measure | Value |
|---|---|
| Cards priced | 80 |
| On budget (within ±15%) | 47 (59%) |
| Strong (+15% to +40%) | 14 |
| Broken (over +40%) | 2 |
| Weak (-15% to -40%) | 14 |
| Dead (under -40%) | 3 |
| Mean deviation (power) | -2% |
| Median deviation | +0% |
| Spread (standard deviation of dev %) | 21 points |
| Mean absolute deviation | 16 points |
| Conditional cards | 12 |
| Upgrades past +50% of the card's points | 3: Morning Prayer, Held Breath, Iron Body |
| Upgrades that cut the cost | 6: Wrath Incarnate, Ascendant Form, All-Seeing, Litany, Rise Radiant, Mantra Engine |
| Mean upgraded deviation | +32% |

| Build path | Cards | Mean dev | On budget | Strong | Broken | Weak | Dead |
|---|---|---|---|---|---|---|---|
| Fury | 23 | -6% | 14 | 4 | 0 | 3 | 2 |
| Flow | 23 | +2% | 10 | 6 | 1 | 6 | 0 |
| Radiant | 23 | +1% | 16 | 3 | 1 | 3 | 0 |
| shared | 11 | -6% | 7 | 1 | 0 | 2 | 1 |

## Starter deck

4 Strike, 4 Defend, Kindle Fury, Still Guard; starts Serene. Baseline for a starter (§1: three basics a turn at 60%): about
**18 points a turn, ~10 damage and ~7 Barrier**.

| Turn | Damage | Barrier | Notes |
|---|---|---|---|
| 1 | ~20 (31 with Kindle Fury in hand, 9 without; 50/50) | ~7 | Kindle Fury leaves Serene: its 2 Mana pays for itself, then up to three Strikes hit for 12 in Fury. |
| 2 | ~14 | ~6 | after a Kindle turn he sits in Fury: Strikes still 12, but every enemy hit is +50% (a 12 becomes 18). |
| 3 | ~18 | ~6 | reshuffle; Still Guard (+20%, the best basic here) is the only way out of Fury, back to Serene. |

About **17 damage and 6 Barrier a turn**: well over the baseline's damage, under its defence, and on Fury turns the +50% damage
taken costs him ~5 HP a turn. Kindle Fury prices on budget (-1%), Still Guard strong (+20%). It is a fast, fragile start: good
against regular fights, poor against a front-loaded Elite or Warden.

## Build paths

- **Fury (23 cards, mean -6%).** The attacks are fine (Ashen Fist, Temper Flare, Burning Breath, Angry Palm all on budget) and the
  payoffs are reachable: once in Fury he stays there. That is also the path's problem: its four "whenever you enter Fury" cards
  (Surge of Ire -36%, Rampage of Ire -34%, Wrath Incarnate -62%, Iron Body -81%) need him to *leave* Fury, and no Fury card leaves a
  stance (the leave cards, Settling Fist, Open Palm, Let Go, Exhale, Shifting Guard, are all Flow). As drafted, Fury's Auras only
  work in a Fury/Flow hybrid. Defence is the other gap: the bot data already show Fury dying to the damage it lets in at Tier V.
- **Flow (23 cards, mean +2%, 6 strong, 1 broken).** The strongest and most self-sufficient path. Its 1-cost commons change stance
  twice (Shifting Guard +24%, Thread-Cutter +30%) and every change pays the trait (Fervor, Primed, the Serene Mana), so Flow's
  stance-entry Auras (Unmoved Mind -12%, Wheel of Motion -18%, Perfect Balance -15%, priced at 1.5 entries a turn) will reach ~2
  entries a turn in practice and land on budget or over. Exhale (+56%) is the outlier: from Serene it is three Mana for 0. The weak
  cards are the Serene-entry Auras (Gentle Return, Serenity Incarnate) and the card makers (Recollect, All-Seeing).
- **Radiant (23 cards, mean +1%, 16 on budget).** The most consistent path. Fervor builders price at 2 a stack and land on budget;
  10 Fervor comes in 2-3 turns with Daily Rite or Morning Prayer plus stance entries; Rise Radiant / Still Flame Ascendant / Burning
  Litany cash in on budget. Mantra Engine (+44%, and +140% upgraded at 0 cost) is the one broken card; Radiant Heart (-34%) is the
  weak payoff (about one Radiant per regular fight).
- **Shared (11 cards, mean -6%).** Thousand Palms, Crushing Palm, Inner Sight on budget; Held Breath dead (-46%); Mountain's
  Stillness weak.

**Bosses.** Radiant is the boss path: a Radiant turn triples a full hand of attacks without the Fury penalty, and Fervor Auras
(Daily Rite, Mantra Engine, Unwavering) keep paying for 10-20 turns. Flow is next: Barrier engines (Unbroken Calm, Perfect Calm,
Mirror Pool) and the once-a-turn Serene Mana are steady. Fury is worst against a front-loaded hitter: +50% damage taken, and its
single-target ceiling (Final Account 14+10, Ashen Fist 14) is only average. Ramp Auras (Ascendant Form, Daily Rite, Mantra Engine)
are underpriced by the 4-turn window against Wardens.

## Biggest outliers and suggested fixes

| Card | Dev | Problem | Suggested fix |
|---|---|---|---|
| Iron Body (1, U, Aura) | -81% | lose 2 HP for 3 Primed per Fury entry: nets ~0, and Fury is rarely re-entered | drop the HP loss and give 4 Primed: (4 x 1.3) x 0.8 x 4 = ~17, +11% |
| Wrath Incarnate (2, R, Aura) | -62% | entering Fury at the start of a turn does nothing while you are in Fury; strictly worse than Eye of the Storm at the same cost | cost 1 and add "gain 2 Primed" each turn: ~20, on budget |
| Exhale (0, U) | +56% | leave stance + 1 Mana: from Serene it is +3 Mana for 0 | "Leave your stance. Draw 1 card. Gain 2 Barrier. Consume." (~8.9, +6%) |
| Held Breath (1, U) | -46% | 1 Holdfast alone is about one next-turn draw and a half | add 5 Barrier (~12, +7%), or cost 0 |
| Mantra Engine (1, U, Aura) | +44% (upgrade +140%) | Barrier equal to Fervor every turn; the upgrade makes it free | make it rare (21.6 vs 20, +8%); the upgrade gives Opening hand, not cost 0 |
| All-Seeing (2, R) | -39% | two random 0-cost cards for 2 Mana and a Consume | cost 1 base (the upgrade's), upgrade adds a third card |
| Surge of Ire / Rampage of Ire (2, R, Auras) | -36% / -34% | Fury-entry triggers in a path with no way to leave Fury | give the Fury path a leave card (or move these to Flow), or start them at their upgraded numbers (9 Barrier / 9 to all: -13% / -2%) |
| Radiant Heart (1, R, Aura) | -34% | ~1.2 Radiant entries a regular fight | cost 0 (13.2 vs 12, +10%) |
| Thread-Cutter / Shifting Guard (1, C) | +30% / +24% | two stance changes on a common: two Fervor, 2 Primed and the Serene Mana each | make them uncommon (+16% / +11%), and hand-write their upgrades (+60% / +48% now) |
| Rise Radiant+ (cost 2 -> 1) | upgrade +98% | a cost cut on a 31-point Radiant entry | keep cost 2; the upgrade adds draw 2 instead |

Other upgrades past +50% of their points: Morning Prayer+ (2 -> 4 Barrier, +55%), Held Breath+ (doubles), Iron Body+ (from almost
nothing). Spinning Heel+ (+48%), Sunlit Blade+ (+45%) and Rising Ire+ / Hushed Stillness+ (+44%) are near the line: `plus()`
raises every number on them.

## Method

Every card is priced by hand against `docs/14_CARD_COSTING.md` §1-§12 and the legacy rates in §14 (the §15 Monk rates are reverted,
DECISIONS #428, and are not used). Live text comes from `COMBAT_DB` (`cardText`); 0.128.0 data.

- **Budget** = §1 cost budget (0: 6, 1: 10, 2: 19, 3: 28) x rarity (common 1.0, uncommon 1.12, rare 1.25; a basic class card
  0.8, the middle of §1's 70-90%). Strike and Defend are Neutral and not in the table.
- **Consume** raises the budget by 25% (§6), except on a 0-cost card whose job is Mana: there Consume is the price (§6), so the
  budget is the plain 0-cost budget (mode `m`). For reference, the guide's own Draw Blood scores +58% this way, so a 0-cost
  Mana card near +50% is "Draw Blood level", not a new outlier.
- **Auras** (§7): the 4-turn total against 1.5x the cost budget (uncommon), 2x (rare). §7 gives no common rate: **1.3x** is used
  (derived: it sits where 1.5x / 1.12 and 2x / 1.25 put a common). An Aura whose whole effect happens once (gain N Might or Bracing
  for the fight) is priced as a card, as the guide prices Steel Resolve.
- **X cards** at X = 3, against 3 x 7 points (the §2 X rate at uncommon), scaled by rarity.
- **Traps** (§11): the effect x the spring factor (attacked 0.85, foeTurn 0.9, 5+ HP lost 0.7).
- **Conditional** cards (marked *cond.*) are priced at the expected value in a deck of their build path (§6: 60-70%).
- **Upgrade gain** = the "+" card's points over the base card's (§12: about +30%, at most +50%). **Upgrade dev %** = the "+" card
  against the budget at its own cost (so a cost cut shows up there).
- Verdicts: on budget within ±15%, strong +15% to +40%, broken over +40%, weak -15% to -40%, dead under -40%.

**Rates worked out here (no rate in the guide):**

| Thing | Rate | Why |
|---|---|---|
| Enter Fury / Enter Serene (Monk) | **6** | §5's 4, plus the trait's 1 Fervor (2) for a stance actually entered. Entering the stance you are in does nothing (engine `enterStance`). |
| "Leave your stance" | **3.5** | §5's "leaving Serene on a card"; leaving Fury gives the trait's 2 Primed (~2) and stops the 50% extra damage. |
| A Fury entered and left on the same card (Shifting Guard, Thread-Cutter) | **4** | the Fervor (2) and the 2 Primed of leaving it (2); the doubling is never used. |
| "+N per Fury" | **N x 0.65** | in Fury about two plays in three in a Fury deck. The doubling of the card's own damage is Fury's value and is not counted again. |
| Lifesteal 50% | **0.6 a damage point** | heal at 1.5 a HP on half the damage, x0.8 for Barrier soak and overheal. |
| Holdfast (hold the whole hand one turn) | **~6 a stack** | about 1.7 cards kept, each an extra draw next turn (3.5). |
| Cadence (gain 1 Might at the end of each turn) | **~17** | four Might in the four-turn window, at 6 x 0.8. |
| Unbound (skills cost 0, are consumed) | **~7 a turn** | ~1.4 Mana of skills a turn in a Hunter deck, less the skills lost. |
| A stack gained by an Aura's trigger or each turn, for the rest of the fight (Might) | **the stack rate x 0.8** | a later stack has fewer turns left (the guide prices Warm Anvil's Sharpen at its early rate; 0.8 splits early and late). |
| Hero Might for the Hunter / Might to all friends for the Engineer | **6 / 8** a stack | §10 (Pack Instinct, Tune-Up). |
| "+N per card played this turn" | **~1.5 cards** before it (**~2** in a Predator deck) | the guide has no usual X for it; the card is usually the 2nd or 3rd played. |
| Companions in play | **~1.3** (Hunter), **~1.7** (Engineer) | the Hound alone, then a summon; the Engineer starts with a Drone and summons more. |
| Companion acts | 1 + 1 per **full** 12 HP | §10's table rounds down (Enforcer 11 HP acts once, Pack Alpha 12 HP twice). |

**A bias to keep in mind:** the 4-turn window prices ramping Auras (Might a turn, Fervor engines, Ancient Fury, Overclock Core) for
a regular fight. Wardens last 10-20 turns (BALANCE.md), where those cards are worth two to three times their score. They are
flagged in the boss notes rather than repriced.

## Full table

| Card | Cost | Rarity | Path | Text | Price | Budget | Dev % | Verdict | Upgrade | Upg. gain | Upg. dev % | How it was priced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kindle Fury | 2 | basic | shared | Deal 9 damage. Enter Fury. | 15 | 15.2 | -1% | on budget | 18 | +20% | +18% | 9 + Enter Fury (4 + 1 Fervor 2 = 6) |
| Still Guard | 1 | basic | shared | Gain 3 Barrier. Enter Serene. | 9.6 | 8 | +20% | strong | 13.2 | +38% | +65% | 3 Barrier 3.6 + Enter Serene 6 |
| Angry Palm *(cond.)* | 1 | common | Fury | Deal 7 (+6 per Fury) damage. | 10.9 | 10 | +9% | on budget | 13.9 | +28% | +39% | 7 + 6 x 0.65 (in Fury in a Fury deck; the doubling is Fury's, not counted) |
| Ashen Fist | 2 | common | Fury | Deal 14 damage. Enter Fury. | 20 | 19 | +5% | on budget | 23 | +15% | +21% | 14 + Fury 6 |
| Temper Flare | 1 | uncommon | Fury | Deal 2 damage 3 times. Enter Fury. | 12 | 11.2 | +7% | on budget | 15 | +25% | +34% | 2x3 = 6 (hits land before Fury) + Fury 6 |
| Rising Ire | 0 | common | Fury | Enter Fury. Draw 1 card. Consume. | 9 | 7.5 | +20% | strong | 13 | +44% | +73% | Fury 6 + draw 3 |
| Swift Step | 1 | uncommon | Fury | Enter Fury. Gain 4 Primed. | 10 | 11.2 | -11% | on budget | 11 | +10% | -2% | Fury 6 + 4 Primed (next attack, 1 hit) |
| Final Account *(cond.)* | 2 | rare | Fury | Deal 14 (+10 per Fury) damage. | 20.5 | 23.8 | -14% | on budget | 23.5 | +15% | -1% | 14 + 10 x 0.65 |
| Surge of Ire *(cond.)* | 2 | rare, Aura | Fury | The first time each turn you enter Fury: Gain 6 Barrier. Draw 1 card. | 24.5 | 38 | -36% | weak | 33.1 | +35% | -13% | (6 Barrier 7.2 + draw 3) x 0.6 fresh Fury entries a turn x 4; Fury persists, so re-entries are rare |
| Rage of Ages | 3 | rare | Fury | Deal 8 damage 3 times to ALL enemies. | 31.2 | 35 | -11% | on budget | 35.1 | +13% | +0% | 24 to ALL x 1.3 |
| Wrath Incarnate *(cond.)* | 2 | rare, Aura | Fury | At the start of your turn: Enter Fury. | 14.4 | 38 | -62% | dead | 14.4 (cost 1) | +0% | -28% | Enter Fury 6 only on turns you left it (~0.6) x 4; strictly worse than Eye of the Storm |
| Burning Breath | 1 | common | Fury | Deal 4 damage to ALL enemies. Enter Fury. | 11.2 | 10 | +12% | on budget | 15.1 | +35% | +51% | 4 AoE 5.2 + Fury 6 |
| Flurry of Palms | 0 | common | Fury | Deal 3 damage 2 times. | 6 | 6 | +0% | on budget | 8 | +33% | +33% | 3x2 |
| Spinning Heel | 2 | uncommon | Fury | Deal 12 damage. Apply 2 Exposed. Draw 1 card. | 21 | 21.3 | -1% | on budget | 31 | +48% | +46% | 12 + 2 Exposed 6 + draw 3; auto-upgrade raises three numbers (+48%) |
| Wrathful Guard | 1 | uncommon | Fury | Gain 6 Barrier. Enter Fury. | 13.2 | 11.2 | +18% | strong | 16.8 | +27% | +50% | 6 Barrier 7.2 + Fury 6 |
| Rampage of Ire *(cond.)* | 2 | rare, Aura | Fury | Whenever you enter Fury: Deal 6 damage to ALL enemies. | 25 | 38 | -34% | weak | 37.4 | +50% | -2% | 6 AoE 7.8 x 0.8 Fury entries a turn x 4 (flat, Fury does not double it) |
| Rage Unbound | 0 | rare | Fury | Enter Fury. Gain 1 Mana. Lose 3 HP. Consume. | 8.5 | 7.5 | +13% | on budget | 10 | +18% | +33% | Fury 6 + 1 Mana 7 - 3 HP 4.5 |
| Hot-Blooded *(cond.)* | 1 | uncommon | Fury | Deal 4 (+1 per 6% HP missing) damage. Enter Fury. | 14 | 11.2 | +25% | strong | 17 | +21% | +52% | 4 + ~4 (25% HP missing mid-fight) + Fury 6 |
| Storm of Fists | X | uncommon | Fury | Deal 4 damage X times. Enter Fury. | 18 | 21 | -14% | on budget | 22 | +22% | +5% | 4 x 3 = 12 + Fury 6 (hits before Fury) |
| Unleashed Roar | 1 | common | Fury | Apply 1 Exposed to ALL enemies. Enter Fury. | 10.5 | 10 | +5% | on budget | 15 | +43% | +50% | 1 Exposed to ALL 4.5 + Fury 6 |
| Coiled Serpent | 1 | uncommon, Trap | Fury | When you lose 5+ HP at once: Deal 8 damage to the attacker. Gain 4 Primed. Enter Fury. | 12.6 | 11.2 | +12% | on budget | 15.4 | +22% | +37% | Trap hpLost x0.7: (8 + 4 Primed + Fury 6) |
| Ashes of Restraint *(cond.)* | 2 | rare | Fury | Deal 9 (+2 per consumed card) damage. Enter Fury. | 19 | 23.8 | -20% | weak | 22 | +16% | -7% | 9 + 2 x ~2 consumed + Fury 6 |
| Centre Yourself | 1 | common | Flow | Draw 1 card. Enter Serene. | 10 | 10 | +0% | on budget | 14 | +40% | +40% | draw 1 alone 4 + Serene 6 |
| Shifting Guard | 1 | common | Flow | Gain 2 Barrier. Enter Fury. Enter Serene. | 12.4 | 10 | +24% | strong | 14.8 | +19% | +48% | 2 Barrier 2.4 + Fury (Fervor 2 + leave-Fury 2 Primed 2) + Serene 6 |
| Thread-Cutter | 1 | common | Flow | Deal 3 damage. Enter Fury. Enter Serene. | 13 | 10 | +30% | strong | 16 | +23% | +60% | 3 + Fury (Fervor 2 + Primed 2) + Serene 6 |
| Settled Mind *(cond.)* | 1 | uncommon | Flow | Draw cards equal to 3 times your Serene. Enter Serene. | 12 | 11.2 | +7% | on budget | 15 | +25% | +34% | Serene ~50%: draw 3 (12) x 0.5 + Serene 6; + draw 1 (4) on the upgrade |
| Hushed Stillness | 0 | common | Flow | Enter Serene. Draw 1 card. Consume. | 9 | 7.5 | +20% | strong | 13 | +44% | +73% | Serene 6 + draw 3 |
| Unmoved Mind | 2 | uncommon, Aura | Flow | Whenever you enter a stance: Gain 2 Barrier. Deal 2 damage to a random enemy. | 25.2 | 28.5 | -12% | on budget | 37.8 | +50% | +33% | (2 Barrier 2.4 + 2 random 1.8) x 1.5 stance entries a turn x 4 |
| Ascendant Form | 2 | rare, Aura | Flow | At the start of your turn: Gain 1 Mana. | 28 | 38 | -26% | weak | 28 (cost 1) | +0% | +40% | +1 Mana a turn = 28 (guide: Inner Furnace); upgrade is a cost cut to 1 |
| Perfect Calm | 2 | rare | Flow | Gain 12 Barrier. Enter Serene. Draw 1 card. | 23.4 | 23.8 | -1% | on budget | 31 | +32% | +31% | 12 Barrier 14.4 + Serene 6 + draw 3 |
| Watchful Calm | 1 | common | Flow | Gain 2 Barrier. Enter Serene. Foresee 2. | 11.9 | 10 | +19% | strong | 15.5 | +30% | +55% | 2 Barrier 2.4 + Serene 6 + Foresee 2 as an extra 3.5 |
| Settling Fist | 1 | common | Flow | Deal 7 damage. Leave your stance. | 10.5 | 10 | +5% | on budget | 13.5 | +29% | +35% | 7 + leave your stance 3.5 |
| Wheel of Motion | 2 | uncommon, Aura | Flow | Whenever you enter a stance: Deal 3 damage to ALL enemies. | 23.4 | 28.5 | -18% | weak | 31.2 | +33% | +9% | 3 AoE 3.9 x 1.5 entries x 4 |
| Unafraid | 1 | uncommon | Flow | Deal 6 damage. Enter Serene. | 12 | 11.2 | +7% | on budget | 15 | +25% | +34% | 6 + Serene 6 |
| Recollect | 1 | rare | Flow | Return a random card from your discard pile to your hand. Enter Serene. Hold. | 10 | 12.5 | -20% | weak | 13 | +30% | +4% | random card back 3 + Serene 6 + Hold 1 |
| Let Go | 1 | uncommon | Flow | Draw 2 cards. Leave your stance. | 10.5 | 11.2 | -6% | on budget | 14.5 | +38% | +29% | draw 2 alone 7 + leave stance 3.5 |
| All-Seeing | 2 | rare | Flow | Add 2 random cards from your pool to your hand (they cost 0 the next time you play them). Consume. | 18 | 29.7 | -39% | weak | 18 (cost 1) | +0% | +15% | 2 random own-pool cards at 0 (~9 each); upgrade is a cost cut to 1 |
| Serenity Incarnate | 3 | rare, Aura | Flow | At the end of your turn: Heal 3. Gain 6 Barrier. | 46.8 | 56 | -16% | weak | 61.2 | +31% | +9% | (heal 3 4.5 + 6 Barrier 7.2) x 4 |
| Still Water *(cond.)* | 1 | uncommon | Flow | Gain 4 (+6 per Serene) Barrier. Draw 1 card. | 11.4 | 11.2 | +2% | on budget | 15 | +32% | +34% | (4 + 6 x 0.5 Serene) Barrier x 1.2 + draw 3 |
| Exhale | 0 | uncommon | Flow | Leave your stance. Gain 1 Mana. Consume. | 10.5 | 6.7 | +56% | broken | 11.5 | +10% | +71% | leave stance 3.5 (in Serene: the trait's 2 Mana) + 1 Mana 7: three Mana at 0 from Serene |
| Mirror Pool | 1 | uncommon | Flow | Gain Barrier equal to 3 times your Mana. Enter Serene. Hold. | 14.2 | 11.2 | +27% | strong | 17.8 | +25% | +59% | 3 x Mana held (~2: play it first) = 6 Barrier 7.2 + Serene 6 + Hold 1 |
| Gentle Return | 1 | rare, Aura | Flow | Whenever you enter Serene: Heal 1. Gain 3 Barrier. | 16.3 | 20 | -18% | weak | 24 | +47% | +20% | (heal 1 1.5 + 3 Barrier 3.6) x 0.8 Serene entries x 4 |
| Tide of Peace | X | rare | Flow | Gain Barrier equal to 4 times the Mana spent. Draw 2 cards. Enter Serene. | 23.9 | 23.4 | +2% | on budget | 28.7 | +20% | +22% | 4 Barrier a Mana at X = 3: 14.4 + draw 2 at half (no Mana left) 3.5 + Serene 6 |
| Whispered Vow | 1 | common | Radiant | Gain 3 Fervor. Foresee 2. | 10.5 | 10 | +5% | on budget | 13 | +24% | +30% | 3 Fervor 6 + Foresee 2 alone 4.5 |
| Bowing Low | 0 | common | Radiant | Gain 2 Fervor. Gain 2 Barrier. | 6.4 | 6 | +7% | on budget | 8.4 | +31% | +40% | 2 Fervor 4 + 2 Barrier 2.4 |
| Sunlit Blade | 1 | common | Radiant | Deal 9 damage. Gain 1 Fervor. | 11 | 10 | +10% | on budget | 16 | +45% | +60% | 9 + 1 Fervor 2 |
| The Offering | 1 | uncommon | Radiant | Gain 5 Fervor. Hold. | 11 | 11.2 | -2% | on budget | 15 | +36% | +34% | 5 Fervor 10 + Hold 1 |
| Litany | 1 | rare, Aura | Radiant | Whenever you play a Skill: Gain 1 Fervor. | 16 | 20 | -20% | weak | 16 (cost 0) | +0% | +33% | 1 Fervor x ~2 Skills a turn x 4; upgrade is a cost cut to 0 |
| Daily Rite | 1 | uncommon, Aura | Radiant | At the start of your turn: Gain 2 Fervor. | 16 | 15 | +7% | on budget | 24 | +50% | +60% | 2 Fervor a turn x 4 (guide reference) |
| Rise Radiant | 2 | rare | Radiant | Enter Radiant. Consume. | 31 | 29.7 | +4% | on budget | 31 (cost 1) | +0% | +98% | Enter Radiant ~31 (guide); upgrade cuts the cost 2 -> 1 |
| Reading the Signs | 1 | common, Aura | Radiant | Whenever you discard a card: Gain 1 Fervor. | 12 | 13 | -8% | on budget | 15.5 | +29% | +19% | 1 Fervor x ~1.5 Foresee discards a turn x 4 (Foresee discards fire it) |
| Perfect Balance | 2 | rare, Aura | Flow | Whenever you enter a stance: Draw 1 card. Gain 2 Barrier. | 32.4 | 38 | -15% | on budget | 46.8 | +44% | +23% | (draw 3 + 2 Barrier 2.4) x 1.5 entries x 4 |
| Still Flame Ascendant | 3 | rare | Radiant | Enter Radiant. Gain 4 Primed. Draw 2 cards. Consume. | 42 | 43.8 | -4% | on budget | 47 | +12% | +7% | Radiant 31 + 4 Primed + draw 2 as an extra 7 |
| Gather Breath | 1 | uncommon | Radiant | Next turn, gain 2 extra Mana. Draw 2 cards. Consume. | 15 | 14 | +7% | on budget | 19 | +27% | +36% | +2 Mana next turn 8 + draw 2 alone 7 |
| Kneel | 0 | common | Radiant | Gain 2 Fervor. Draw 1 card. Consume. | 7 | 7.5 | -7% | on budget | 9 | +29% | +20% | 2 Fervor 4 + draw 3 |
| Hymn of Embers | 2 | uncommon | Radiant | Gain 5 Fervor. Gain 8 Barrier. | 19.6 | 21.3 | -8% | on budget | 27.2 | +39% | +28% | 5 Fervor 10 + 8 Barrier 9.6 |
| Morning Prayer | 1 | uncommon, Aura | Radiant | At the start of your turn: Gain 1 Fervor. Gain 2 Barrier. | 17.6 | 15 | +17% | strong | 27.2 | +55% (too big) | +81% | (1 Fervor 2 + 2 Barrier 2.4) x 4; upgrade doubles the Barrier (+55%) |
| Flood of Visions | 1 | rare | Radiant | Draw 5 cards. Gain 2 Fervor. Consume. | 19 | 15.6 | +22% | strong | 23 | +21% | +47% | draw 5 alone ~15 + 2 Fervor 4 |
| Last Rites of the Flame | 3 | rare | Radiant | Deal 16 damage to ALL enemies. Gain 5 Fervor. | 30.8 | 35 | -12% | on budget | 38.7 | +26% | +11% | 16 AoE 20.8 + 5 Fervor 10 |
| Radiant Heart *(cond.)* | 1 | rare, Aura | Radiant | Whenever you enter Radiant: Draw 3 cards. | 13.2 | 20 | -34% | weak | 15.6 | +18% | -22% | draw 3 (11) x ~1.2 Radiant entries in four turns |
| Foretold Flame *(cond.)* | 1 | uncommon | Radiant | Deal 5 (+1 per Fervor) damage. Foresee 2. | 13 | 11.2 | +16% | strong | 16.5 | +27% | +47% | 5 + ~4.5 Fervor held + Foresee 2 as an extra 3.5 |
| Faith Kept | 1 | common | Radiant | Gain 3 Fervor. Hold. If consumed: Gain 3 Fervor. | 7.6 | 10 | -24% | weak | 9.8 | +29% | -2% | 3 Fervor 6 + Hold 1 + the consumed bonus ~10% (the pool rarely consumes a held card) |
| Mantra Engine *(cond.)* | 1 | uncommon, Aura | Radiant | At the end of your turn: Gain Barrier equal to your Fervor. | 21.6 | 15 | +44% | broken | 21.6 (cost 0) | +0% | +140% | Barrier = Fervor (~4.5 average in a Fervor deck) x 1.2 x 4; upgrade cuts the cost to 0 |
| Burning Litany | 3 | rare | Radiant | Deal damage equal to your Fervor to ALL enemies. Enter Radiant. Consume. | 40.1 | 43.8 | -8% | on budget | 44 | +10% | +1% | ~7 Fervor to ALL 9.1 + Radiant 31 |
| Unwavering | 2 | rare, Aura | Radiant | Whenever you discard a card: Gain 4 Barrier. Gain 1 Fervor. Whenever a card is consumed: Gain 4 Barrier. Gain 1 Fervor. | 40.8 | 38 | +7% | on budget | 55.2 | +35% | +45% | (4 Barrier 4.8 + 1 Fervor 2) x ~1.5 discards/consumes a turn x 4 |
| Crushing Palm | 1 | common | shared | Deal 8 damage. Apply 1 Exposed. | 11 | 10 | +10% | on budget | 14 | +27% | +40% | 8 + 1 Exposed 3 |
| Inner Sight | 1 | uncommon | shared | Gain 5 Barrier. Foresee 4. | 10.5 | 11.2 | -6% | on budget | 14.6 | +39% | +30% | 5 Barrier 6 + Foresee 4 as an extra 4.5 |
| Quick Palms | 0 | common | shared | Deal 4 damage. Gain 1 Fervor. | 6 | 6 | +0% | on budget | 9 | +50% | +50% | 4 + 1 Fervor 2 |
| Mountain's Stillness | 2 | rare | shared | Gain 6 (+3 per card in hand) Barrier. | 18 | 23.8 | -24% | weak | 21.6 | +20% | -9% | 6 + 3 x ~3 cards in hand = 15 Barrier x 1.2 |
| Breath Between Blows | 1 | rare, Aura | shared | Whenever you play a Skill: Gain 2 Barrier. | 19.2 | 20 | -4% | on budget | 28.8 | +50% | +44% | 2 Barrier x ~2 Skills a turn x 4 |
| Held Breath | 1 | uncommon | shared | Gain 1 Holdfast. | 6 | 11.2 | -46% | dead | 12 | +100% (too big) | +7% | NEW RATE Holdfast ~6 a stack: ~1.7 cards kept = next-turn draws at 3.5 |
| Rending Hands | 1 | uncommon | Fury | Deal 6 damage 2 times. Lose 1 HP. | 10.5 | 11.2 | -6% | on budget | 12.5 | +19% | +12% | 6x2 - 1 HP 1.5 |
| Iron Body | 1 | uncommon, Aura | Fury | Whenever you enter Fury: Lose 2 HP. Gain 3 Primed. | 2.9 | 15 | -81% | dead | 7.7 | +166% (too big) | -49% | (3 Primed x 1.3 hits - 2 HP 3) x 0.8 entries x 4: nearly nothing |
| Open Palm | 1 | uncommon | Flow | Deal 5 damage 2 times. Leave your stance. | 13.5 | 11.2 | +21% | strong | 15.5 | +15% | +38% | 5x2 + leave stance 3.5 |
| Shield of Faith | 1 | uncommon | Radiant | Gain 7 Barrier. Gain 1 Fervor. | 10.4 | 11.2 | -7% | on budget | 14 | +35% | +25% | 7 Barrier 8.4 + 1 Fervor 2 |
| Poise | 1 | uncommon, Aura (one-shot) | shared | Gain 3 Bracing for the rest of the fight. | 12 | 11.2 | +7% | on budget | 16 | +33% | +43% | 3 Bracing for the fight, 4 a stack (one-shot: card budget) |
| Thousand Palms | 2 | rare | shared | Deal 3 damage 7 times. | 24 | 23.8 | +1% | on budget | 31 | +29% | +31% | 3x7 = 21 + ~3 from the trait's Primed on every hit |
| Unbroken Calm | 2 | rare, Aura | shared | At the start of your turn: Gain 4 Barrier. Draw 1 card. | 31.2 | 38 | -18% | weak | 40.8 | +31% | +7% | (4 Barrier 4.8 + draw 3) x 4 |
| Crown of Embers | 1 | uncommon | Radiant | Gain 6 Primed. Gain 2 Fervor. | 11.8 | 11.2 | +5% | on budget | 16.4 | +39% | +46% | 6 Primed x 1.3 hits 7.8 + 2 Fervor 4 |
| Eye of the Storm | 2 | rare, Aura | Fury | At the start of your turn: Enter Fury. Deal 4 damage to ALL enemies. Gain 4 Barrier. | 49.6 | 38 | +31% | strong | 69.6 | +40% | +83% | (Fury ~0.4 x 6 + 4 AoE 5.2 + 4 Barrier 4.8) x 4 |
