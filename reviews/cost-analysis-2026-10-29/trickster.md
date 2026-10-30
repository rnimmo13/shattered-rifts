# Trickster: card cost analysis (2026-10-29)

Hand-priced with `docs/14_CARD_COSTING.md` (§1-§12, §14) against the live pool (`packages/content/src/v2/pools/trickster.ts`, text
from `cardText`). No sims were run and no game code or docs changed. Every card and its "+" is in the table at the end.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall** | **C** | 74% on budget would be a B, but 3 cards are broken or dead (the B line allows 2): Showstopper, Trapper's Dividend, Hunter's Eye. Fix any one of them and the class is a B. |
| **Power level** | **Fair** | Mean deviation **+2%**. Traps +7%, Suits +3%, Exposed -2%, glue -1%. |
| **Consistency** | **B** | Spread (standard deviation) **18 points**. It's mostly two Suits payoffs (Showstopper over, Royal Flourish and Pickpocket Master under) and the Trap Auras. |

Counts (84 cards graded: the 81 pool cards and 3 class basics; Strike and Defend are left out): **62 on budget (74%), 10 strong,
2 broken, 9 weak, 1 dead.**

Scale used for consistency (the same for all three of my classes): spread up to 12 points is A, up to 18 B, up to 25 C, up to 35 D,
over 35 F. Power: "fair" is a mean within ±5%.

## Method and the rates I had to choose

- **Budgets:** 6 / 10 / 19 / 28 / 37 for 0-4 Mana. Class basics are at 80% of a common, uncommon x1.12, rare x1.25. Consume x1.25 and
  Fleeting x1.15 on the budget. An Aura's 4-turn total is set against 1.5x (uncommon) or 2x (rare) its cost's budget.
- **0-cost Consume Mana cards** are compared with the guide's own references, as §6 says, instead of adding points: +1 Mana = Marsh
  Light (7), +2 Mana = Draw Blood (9.5), times rarity (Stolen Moment, Saved Breath).
- **Traps:** the effect times the §11 spring factor (attacked 0.85, enemy turn 0.9, 3+ HP lost 0.75, summon 0.4, enemy Barrier 0.6).
  Trap damage is flat, so a Trap's Exposed only pays through attacks. "Per Trap set" is priced at 1.5 Traps.
- **Suits (no rate in the guide; from `docs/TRICKSTER_SUITS.md`):** when a payoff is played, a Suits deck shows **~2.5 suits** (the
  card's own suit counts, `showSuit` runs first). "3 or more suits" happens **~50%** of the time and "all four" **~35%**. A Full Trick
  goes off on **~45%** of turns in a Suits deck and **~20%** with the starter (it has only one ♦ and one ♣ card). A **wild suit** is
  worth **~3** (it often completes a Full Trick). A random pool card that costs 0 is worth **~10**.
- **Cost that drops per suit (Showstopper):** priced at the cost usually paid (§5). About 1.75 suits are already shown when it is
  played, so it costs about 1.25.
- **Upgrade dev** is the "+" card against its own budget x1.3, since the guide aims for +30%. "Gain" is the "+" over the base.
- **(c)** marks a card whose value depends on a setup. Those are priced at the expected value in the deck built for them.

## The trait: Lying in Wait

6 Barrier (7.2) and an extra card on turn 1 (4). The Full Trick is 3 to a random enemy, 2 more for each Full Trick before it, and draw
1 (about 6-8). With the starter that's ~20% of turns x 5 turns, about 6. In a Suits deck it's ~45%, about 16. **~17 a fight with the
starter, ~27 in a Suits deck.** That's in the middle of the roster.

## Starter deck (3 Strike, 3 Defend, 2 Veil Strike, Set the Web, Pick a Card)

Baseline: a 5 Strike / 4 Defend / 1 signature deck plays 3 cards a turn, for about **10 damage and 6 Barrier (~18 points)**.

| Turn | Damage | Barrier | Notes |
|---|---|---|---|
| 1 | ~13 | ~11 | 6-card hand; the trait's 6 Barrier; Veil Strike's Exposed lifts a Strike played after it (~+1-2) |
| 2 | ~13 | ~5 | Set the Web springs on ~1 turn in 3 (7 + Exposed on the attacker, ~2 a turn on average) |
| 3 | ~13 | ~5 | Pick a Card (free Foresee 2) smooths the draws |

**Reading:** about 30% more damage than the baseline and a little less Barrier after turn 1. Overall it's on par: ~18-20 points a turn
(27 on turn 1). The basics are on budget: Veil Strike +12%, Set the Web +6%, Pick a Card -6%. The starter shows all four suits, but a
Full Trick needs both singletons (Pick a Card, Set the Web) in the same hand, so the Suits trait is mostly dormant until the deck is
drafted.

## Build paths

| Path | Cards | Mean | On budget | How it holds up |
|---|---|---|---|---|
| **Traps** | 22 | +7% | 77% | Works. The Traps themselves sit on budget: a Trap's effect is printed about 15% hot to pay for the spring factor, which is right. All the over-budget cards are its payoff **Auras**: Trapper's Dividend +53%, Gleeful Trapsmith +39%, Master Trapper +32%. All three are 1-cost, so they come down on turn 1-2 and then pay on every Trap. The 3-Trap cap is the only brake, and Trap Door and Trap Kit fill the slots for free. |
| **Exposed** | 23 | -2% | 74% | Works, because Exposed lifts every attack, not only the payoffs. The cheap enablers are on budget (Mark Prey, Dread Gaze, Spotlight, Strip the Guard). The cards that pay **per Exposed** are under: Coup de Grace -20%, Culling -23%, Compound Fear -17%. Hunter's Eye is dead at -42%: from the second stack on, its Exposed mostly lands on a target that is already Exposed. The path plays fine, but its rares are the weak part. |
| **Suits** | 22 | +3% | 68% | The widest spread. The commons and uncommons are on budget at 2.5 suits. The rares swing: Showstopper +96% (one Mana for 30 once two suits are shown), Masquerade +23%; Royal Flourish -26% and Pickpocket Master -33%. The payoffs **can be reached** only after drafting ♦ and ♣ cards (the starter has one of each): Cold Read, Weigh the Odds, Trick of the Light and the debuff skills do it. |

## Against bosses (front-loaded big hits, needing big single-target damage or block)

- **Good.** Traps that cancel a hit (Mirror Veil, Bait and Switch, The Perfect Trap) and Traps that Stun (Silencing Trap for 2 turns,
  The Perfect Trap, The Long Ambush) are the best answers in the game to one big telegraphed hit. A cancel stops one hit only, though,
  so a boss's multi-hit move still lands its other hits.
- Exposed is a percentage, so it grows against bosses' HP. Blindside (22 + 3 Exposed), Death Mark, Long Con and Showstopper give the
  big single hits.
- Weak spots: Trap damage is flat and gets no Exposed, so a pure Trap deck is slow on a 150+ HP boss. Masquerade, Culling, Unmask and
  Time Bomb lose their AoE share against a lone boss.

## Biggest outliers and suggested fixes (suggestions only, not applied)

| # | Card | Now | Suggested fix | After |
|---|---|---|---|---|
| 1 | **Showstopper** (3, rare) | +96% (c): 30 damage for ~1.25 Mana | Cap the reduction at 1 (it costs 2 at best); or keep the reduction and deal 22 | +26% / +44% → cap is better; with the cap and 26 damage: +9% |
| 2 | **Trapper's Dividend** (1, rare Aura) | +53% (c): draw 1 and 5 Barrier on every spring | Draw 1, gain **3** Barrier (upgrade 5) | +12% |
| 3 | **Gleeful Trapsmith** (1, uncommon Aura) | +39% (c): 4 to ALL per Trap played | **3** to ALL (upgrade 4) | +4% |
| 4 | **Stolen Moment** (0, uncommon, Consume) | +34%: +1 Mana and Foresee 2 for 0 | Drop the Foresee and add Hold ("Gain 1 Mana. Hold. Consume.") | +2% |
| 5 | **Master Trapper** (1, rare Aura) | +32% (c): draw 1 and 3 Barrier per Trap played | Draw 1 and **2** Barrier (upgrade 3) | +8% |
| 6 | **Hunter's Eye** (2, rare Aura) | -42%: 1 Exposed per Attack, mostly overlapping | Cost **1** (what the upgrade does now); give the "+" Opening hand | +10% |
| 7 | **Pickpocket Master** (2, rare, Consume) | -33%: 2 free random pool cards | **3** cards (upgrade: cost 1) | +1% |
| 8 | **Royal Flourish** (2, rare) | -26% (c): 7 per suit | **9** per suit (upgrade 11) | -5% |
| 9 | **Culling** (2, rare) | -23% (c): 8 + 3 per Exposed to ALL | **10** + 3 per Exposed (upgrade 13) | -12% |
| 10 | **Coup de Grace** (3, rare) | -20% (c): 18 + 4 per Exposed | 18 + **5** per Exposed (upgrade 22 + 6) | -13% |

Also worth a look: **Second Act+** costs 0 (a +49% upgrade, the 1→0 jump §12 warns about); **Deep Pockets** reads -26% because the
guide's §7 calls a +1 Mana Aura fair at 2 Mana, while the 2x rare rule wants more. That's a guide question, not a card one (it applies
to the Drunkard's Last Call too). The Trap upgrades that raise two numbers (Hollow Trap+, Tripwire Garrote+, Hamstring+, Spotlight+) gain
+42-50%, at the top of §12's range.

## Full table

Cards graded: **84** (Strike and Defend excluded). On budget **62** (74%), strong **10**, broken **2**, weak **9**, dead **1**.
Mean deviation **+2%**, spread (standard deviation) **18 points**.

| Build path | Cards | Mean dev | On budget |
|---|---|---|---|
| starter | 3 | +4% | 100% |
| Traps | 22 | +7% | 77% |
| Exposed | 23 | -2% | 74% |
| Suits | 22 | +3% | 68% |
| glue | 14 | -1% | 71% |

Verdicts: on budget within ±15%, strong +15 to +40%, broken over +40%, weak −15 to −40%, dead under −40%. (c) = conditional, priced at its expected value. "Upgrade dev" is the "+" card against its own budget x1.3 (the guide aims upgrades at about +30%); "gain" is the "+" over the base card.

| Card | Cost | Rarity | Path | Text (live) | Price | Budget | Dev | Verdict | Upgrade dev (vs budget x1.3) | Working |
|---|---|---|---|---|---|---|---|---|---|---|
| Strike | 1 | basic | starter | Deal 6 damage. | 6.0 | 6.0 | +0% | on budget | +15% (gain +50%) | 6 dmg |
| Defend | 1 | basic | starter | Gain 5 Barrier. | 6.0 | 6.0 | +0% | on budget | +23% (gain +60%) | 5 Barrier x1.2 |
| Veil Strike | 1 | basic | starter | Deal 6 damage. Apply 1 Exposed. | 9.0 | 8.0 | +13% | on budget | +15% (gain +33%) | 6 + 1 Exposed (3) |
| Set the Web | 1 | basic Trap | starter | When you or an ally is attacked: Deal 7 damage to the attacker. Apply 1 Exposed to the attacker. | 8.5 | 8.0 | +6% | on budget | +7% (gain +31%) | (7 + 1 Exposed 3) x0.85 attacked |
| Pick a Card | 0 | basic | starter | Foresee 2. | 4.5 | 4.8 | -6% | on budget | -20% (gain +11%) | Foresee 2 on its own: 4 + 0.5 |
| Trip Line | 0 | common Trap | Traps | When you or an ally is attacked: Deal 8 damage to the attacker. | 6.8 | 6.0 | +13% | on budget | +21% (gain +38%) | 8 x0.85 |
| Hollow Trap | 1 | common Trap | Traps | When you or an ally is attacked: Deal 10 damage to the attacker. Apply 1 Faltering to the attacker. | 11.1 | 10.0 | +11% | on budget | +25% (gain +46%) | (10 + 1 Faltering 3) x0.85; up raises both numbers (+46%) |
| Trap Kit | 1 | common | Traps | Add 2 Trip Lines to your hand. Consume. | 13.6 | 12.5 | +9% | on budget | +11% (gain +32%) | 2 Trip Lines (6.8 each); up 3rd one often finds no free slot (max 3 Traps): ~18 |
| Mirror Veil | 1 | uncommon Trap | Traps | When you or an ally is attacked: Cancel that hit. Apply 1 Faltering to the attacker. | 12.8 | 11.2 | +14% | on budget | +5% (gain +20%) | (cancel a hit 12 + 1 Faltering 3) x0.85 |
| Time Bomb | 1 | rare Trap | Traps | At the start of the enemy turn: Deal 12 damage to ALL enemies. | 14.0 | 12.5 | +12% | on budget | +8% (gain +26%) | 12 to ALL x1.3 x0.9 |
| Spring-Loaded | 1 | common | Traps | Gain Barrier equal to 5 times the number of Traps you have set. | 9.0 | 10.0 | -10% | on budget (c) | -3% (gain +40%) | 5 per Trap set at 1.5 Traps = 7.5 Barrier x1.2 |
| Master Trapper | 1 | rare Aura | Traps | Whenever you play a Trap: Draw 1 card. Gain 3 Barrier. | 26.4 | 20.0 | +32% | strong (c) | +38% (gain +36%) | Aura: a Trap played ~1/turn in a Trap deck: draw 1 (3) + 3 Barrier (3.6) x4 turns |
| Bait and Switch | 2 | rare Trap | Traps | When you or an ally is attacked: Cancel that hit. Deal 12 damage to the attacker. | 20.4 | 23.8 | -14% | on budget | -26% (gain +13%) | (cancel 12 + 12) x0.85 |
| Silencing Trap | 2 | rare Trap | Traps | When you or an ally is attacked: Stun the attacker for 2 turns. Gain 1 Shielded. | 21.3 | 23.8 | -10% | on budget | -12% (gain +28%) | (Stun 2 turns 14 + Shielded ~11) x0.85 |
| Tripwire Garrote | 1 | uncommon Trap | Traps | When you or an ally is attacked: Deal 7 damage to the attacker. Apply 2 Exposed to the attacker. | 11.1 | 11.2 | -1% | on budget | +11% (gain +46%) | (7 + 2 Exposed 6) x0.85; Trap damage is flat, the Exposed pays through attacks |
| Trap Net | 1 | uncommon Trap | Traps | At the start of the enemy turn: Deal 6 damage to ALL enemies. Apply 1 Faltering to ALL enemies. | 11.1 | 11.2 | -1% | on budget | +0% (gain +32%) | (6 to ALL 7.8 + Faltering ALL 4.5) x0.9 |
| Trapper's Dividend | 1 | rare Aura | Traps | Whenever one of your Traps is triggered: Draw 1 card. Gain 5 Barrier. | 30.6 | 20.0 | +53% | broken (c) | +65% (gain +40%) | Aura: ~0.85 springs a turn x4 (3.4) x (draw 1 3 + 5 Barrier 6, gained before the hit lands) |
| Spring the Trap | 1 | rare | Traps | Deal 6 (+5 per Trap set) damage. | 13.5 | 12.5 | +8% | on budget (c) | +2% (gain +22%) | 6 + 5 x1.5 Traps set |
| The Perfect Trap | 3 | rare Trap | Traps | When you or an ally is attacked: Cancel that hit. Deal 22 damage to the attacker. Stun the attacker for 2 turns. | 40.8 | 35.0 | +17% | strong | +32% (gain +0% (cost 2)) | (cancel 12 + 22 + Stun 2 turns 14) x0.85; up only costs 2 |
| Gleeful Trapsmith | 1 | uncommon Aura | Traps | Whenever you play a Trap: Deal 4 damage to ALL enemies. | 20.8 | 15.0 | +39% | strong (c) | +60% (gain +50%) | Aura: 4 to ALL (5.2) per Trap played, ~1 a turn x4 |
| Fang Pit | 1 | common Trap | Traps | When you lose 3+ HP at once: Deal 6 damage to ALL enemies. Apply 1 Exposed to ALL enemies. | 9.2 | 10.0 | -8% | on budget | -6% (gain +33%) | (6 to ALL 7.8 + Exposed ALL 4.5) x0.75 |
| False Floor | 0 | common Trap | Traps | When the enemy summons: Deal 12 damage to that enemy. Apply 2 Exposed to that enemy. | 7.2 | 6.0 | +20% | strong (c) | +23% (gain +33%) | (12 + 2 Exposed 6) x0.4 summon; also sits in a Trap slot in fights with no summoner |
| Metronome Trap | 0 | uncommon Trap | Traps | At the start of the enemy turn: Deal 3 damage to ALL enemies. Gain 3 Barrier. | 6.8 | 6.7 | +1% | on budget | +4% (gain +34%) | (3 to ALL 3.9 + 3 Barrier 3.6) x0.9 |
| Trapline Rider | 1 | uncommon | Traps | Deal 4 damage, 1 more time per Trap set. | 10.0 | 11.2 | -11% | on budget (c) | -14% (gain +25%) | 4 x (1 + 1.5 Traps); no Might in the class, multi-hit is free |
| Grim Collection | 2 | uncommon | Traps | Deal 12 damage. Gain Barrier equal to 4 times the number of Traps you have set. | 19.2 | 21.3 | -10% | on budget (c) | -7% (gain +34%) | 12 + 4 x1.5 Traps = 6 Barrier (7.2) |
| Trap Door | 2 | uncommon Aura | Traps | At the start of your turn: Add a Trip Line to your hand. | 25.0 | 28.5 | -12% | on budget | -14% (gain +28%) | Aura: a Trip Line (6.8) a turn x4, less ~10% for the 3-Trap cap |
| Poison Pantry | 0 | uncommon Trap | Traps | When an enemy gains Barrier: Deal 10 damage to that enemy. Apply 2 Brittle to that enemy. | 6.9 | 6.7 | +3% | on budget (c) | +5% (gain +33%) | (10 + 2 Brittle 1.5) x0.6 (enemy gains Barrier) |
| Mark Prey | 0 | common | Exposed | Apply 2 Exposed. | 6.0 | 6.0 | +0% | on budget | +15% (gain +50%) | 2 Exposed (3 each) |
| Unmask | 1 | common | Exposed | Apply 2 Exposed to ALL enemies. | 9.0 | 10.0 | -10% | on budget | +4% (gain +50%) | 2 Exposed to ALL (4.5 each) |
| Exploit Weakness | 1 | common | Exposed | Deal 5 (+2 per Exposed on the target) damage. | 9.0 | 10.0 | -10% | on budget (c) | -8% (gain +33%) | 5 + 2 x ~2 Exposed on the target in an Exposed deck |
| Veil Dance | 1 | common | Exposed | Apply 1 Faltering to ALL enemies. Gain 5 Barrier. | 10.5 | 10.0 | +5% | on budget | +8% (gain +34%) | Faltering ALL 4.5 + 5 Barrier 6 |
| Death Mark | 2 | uncommon | Exposed | Deal 12 damage. Apply 3 Exposed. | 21.0 | 21.3 | -1% | on budget | -6% (gain +24%) | 12 + 3 Exposed 9 |
| Shadow Volley | 1 | uncommon | Exposed | Deal 4 damage to a random enemy 3 times. | 10.8 | 11.2 | -4% | on budget | -7% (gain +25%) | 4 x3 random (0.9) |
| Coup de Grace | 3 | rare | Exposed | Deal 18 (+4 per Exposed on the target) damage. | 28.0 | 35.0 | -20% | weak (c) | -24% (gain +23%) | 18 + 4 x ~2.5 Exposed on the target |
| Patient Hunter | 1 | rare Aura | Exposed | At the start of your turn: Apply 1 Exposed to ALL enemies. | 18.0 | 20.0 | -10% | on budget | -17% (gain +19%) | Aura: 1 Exposed to ALL a turn (4.5) x4; up Opening hand +3.5 |
| Cheap Shot | 1 | common | Exposed | Deal 6 damage. Apply 1 Faltering. If you have a Trap set: Apply 1 Exposed. | 10.5 | 10.0 | +5% | on budget (c) | +4% (gain +29%) | 6 + 1 Faltering 3 + 1 Exposed 3 x~0.5 (a Trap set) |
| Stalk | 2 | uncommon | Exposed | Deal 16 damage. If the target is Exposed: Next turn, draw 2 extra cards. | 20.6 | 21.3 | -3% | on budget (c) | -7% (gain +25%) | 16 + 2 cards next turn (7) x0.65 (target Exposed) |
| Strip the Guard | 1 | uncommon | Exposed | Apply 3 Exposed. Apply 2 Brittle. | 10.5 | 11.2 | -6% | on budget | -9% (gain +27%) | 3 Exposed 9 + 2 Brittle 1.5 |
| Smoke Bomb | 1 | uncommon | Exposed | Apply 1 Faltering to ALL enemies. Apply 1 Exposed to ALL enemies. Gain 3 Barrier. | 12.6 | 11.2 | +12% | on budget | +17% (gain +36%) | Faltering ALL 4.5 + Exposed ALL 4.5 + 3 Barrier 3.6 |
| Opening Strike | 0 | rare | Exposed | Deal 8 damage. Apply 2 Exposed. Consume. Opening hand. | 14.0 | 12.5 | +12% | on budget | +23% (gain +43%) | 8 + 2 Exposed 6; budget is a 1-cost rare (guide §6: 0-cost Consume Opening card), Opening not added again |
| Hunter's Eye | 2 | rare Aura | Exposed | Whenever you play an Attack: Apply 1 Exposed. | 22.0 | 38.0 | -42% | dead | -15% (gain +0% (cost 1)) | Aura: ~2 Attacks a turn, 1 Exposed each, mostly re-applied to an already Exposed target (8 stacks: 3x3 + 5x2 = 19, ~22 with the target always Exposed); up costs 1 |
| Blindside | 2 | rare | Exposed | Deal 22 damage. Apply 3 Exposed. Consume. | 31.0 | 29.7 | +4% | on budget | -7% (gain +16%) | 22 + 3 Exposed 9 |
| Dread Gaze | 0 | uncommon | Exposed | Apply 3 Exposed. Consume. | 9.0 | 8.4 | +7% | on budget | +1% (gain +22%) | 3 Exposed |
| Slit and Run | 1 | common | Exposed | Deal 5 damage. Gain 3 Barrier. Apply 1 Exposed. | 11.6 | 10.0 | +16% | strong | +12% (gain +26%) | 5 + 3 Barrier 3.6 + 1 Exposed 3 |
| Culling | 2 | rare | Exposed | Deal 8 (+3 per Exposed on each) damage to ALL enemies. | 18.2 | 23.8 | -23% | weak (c) | -28% (gain +21%) | (8 + 3 x ~2 Exposed on each) x1.3 AoE |
| Cripple | 1 | uncommon | Exposed | Apply 1 Faltering. Apply 1 Exposed. Gain 5 Barrier. | 12.0 | 11.2 | +7% | on budget | +3% (gain +25%) | Faltering 3 + Exposed 3 + 5 Barrier 6 |
| Spotlight | 1 | uncommon | Exposed | Apply 3 Exposed. Apply 1 Faltering. | 12.0 | 11.2 | +7% | on budget | +17% (gain +42%) | 3 Exposed 9 + 1 Faltering 3; up +2 numbers (+42%) |
| Compound Fear | 1 | rare | Exposed | Apply 2 Exposed. Double the Exposed on the target (at most +4). Consume. | 13.0 | 15.6 | -17% | weak (c) | -21% (gain +23%) | 2 Exposed, then double (cap +4): ~5.5 stacks added on a target with ~1.5 already (2x3 + 3.5x2) |
| Hamstring | 1 | uncommon | Exposed | Deal 6 damage. Apply 2 Exposed. | 12.0 | 11.2 | +7% | on budget | +24% (gain +50%) | 6 + 2 Exposed 6; up 9 + 3 Exposed (+50%) |
| Cold Read | 0 | common | Suits | Foresee 4. | 5.5 | 6.0 | -8% | on budget | -23% (gain +9%) | Foresee 4 (guide reference) |
| Patient Blade | 1 | common | Suits | Deal 9 damage. Hold. | 10.0 | 10.0 | +0% | on budget | +0% (gain +30%) | 9 + Hold 1 |
| Shadow Cloak | 1 | common | Suits | Gain 6 Barrier. Draw 1 card. | 10.2 | 10.0 | +2% | on budget | +6% (gain +35%) | 6 Barrier 7.2 + draw 1 (3) |
| Weigh the Odds | 1 | common | Suits | Foresee 3. Draw 1 card. Hold. | 10.0 | 10.0 | +0% | on budget | +12% (gain +45%) | Foresee 3 (5) + a further card 4 + Hold 1; up Foresee 4 + draw 2 (+45%) |
| Hidden Hand | 1 | common | Suits | Draw 2 cards. Gain 3 Barrier. Hold. | 11.6 | 10.0 | +16% | strong | +20% (gain +34%) | draw 2 (7) + 3 Barrier 3.6 + Hold 1 |
| Flourish | 1 | common | Suits | Deal 7 damage. If you have played a ♥ this turn: Gain 4 Barrier. | 9.2 | 10.0 | -8% | on budget (c) | -6% (gain +33%) | 7 + 4 Barrier x ~45% (a heart shown first) |
| Fade Back | 1 | uncommon | Suits | Gain 6 Barrier. Next turn, gain 4 Barrier. Hold. | 12.2 | 11.2 | +9% | on budget | +9% (gain +30%) | 6 Barrier 7.2 + 4 next turn 4 + Hold 1 |
| Long Con | 2 | uncommon | Suits | Deal 14 damage. Apply 1 Exposed. Hold. | 19.0 | 21.3 | -11% | on budget | -10% (gain +32%) | 14 + 1 Exposed 3 + Hold 2 (big card) |
| Card Fan | 1 | uncommon | Suits | Deal 4 (+3 per suit played this turn) damage. | 11.5 | 11.2 | +3% | on budget (c) | 0% (gain +26%) | 4 + 3 x 2.5 suits |
| Card Sharp | 1 | uncommon | Suits | Deal 8 damage. If all four suits are showing: Deal 8 damage. | 10.8 | 11.2 | -4% | on budget (c) | +2% (gain +38%) | 8 + 8 x 35% (all four showing) |
| Cut the Deck | 1 | uncommon | Suits | Draw 2 cards. If you have played 3 or more suits this turn: Gain 1 Mana. | 10.5 | 11.2 | -6% | on budget (c) | 0% (gain +38%) | draw 2 (7) + 1 Mana (7) x 50% |
| Queen of Hearts | 1 | uncommon | Suits | Gain 5 (+2 per suit played this turn) Barrier. | 12.0 | 11.2 | +7% | on budget (c) | +7% (gain +30%) | (5 + 2 x 2.5 suits) Barrier x1.2 |
| Ace of Clubs | 1 | uncommon | Suits | Apply 2 Exposed. Apply 1 Faltering. If you have played 3 or more suits this turn: Draw 1 card. | 10.5 | 11.2 | -6% | on budget (c) | -7% (gain +29%) | 2 Exposed 6 + Faltering 3 + draw (3) x 50% |
| Wild Card | 0 | uncommon | Suits | Draw 1 card. Consume. | 7.0 | 8.4 | -17% | weak | -27% (gain +14%) | draw 1 on its own 4 + a wild suit (~3: it often completes a Full Trick); up Hold |
| Second Act | 1 | rare | Suits | Gain 1 Reverb. Hold. | 14.5 | 12.5 | +16% | strong | +49% (gain +0% (cost 0)) | Reverb ~12 + Hold 2.5 (timing); up costs 0 (a +60% jump, guide §12) |
| Pickpocket Master | 2 | rare | Suits | Add 2 random cards from your pool to your hand (they cost 0 the next time you play them). Consume. | 20.0 | 29.7 | -33% | weak | -2% (gain +0% (cost 1)) | 2 random pool cards, free: ~10 each (a pool card ~13 less ~25% for the randomness); up costs 1 |
| Royal Flourish | 2 | rare | Suits | Deal damage equal to 7 times the suits played this turn. | 17.5 | 23.8 | -26% | weak (c) | -27% (gain +29%) | 7 x 2.5 suits (itself included) |
| Showstopper | 3 (~1.25) | rare | Suits | Costs 1 less for each suit played this turn. Deal 30 damage. | 30.0 | 15.3 | +96% | broken (c) | +91% (gain +27%) | priced at the cost usually paid (guide §5): ~1.75 suits shown before it, so ~1.25 Mana |
| The Joker | 1 | rare | Suits | Add a random card from your pool to your hand (it costs 0 the next time you play it). | 13.0 | 12.5 | +4% | on budget | -14% (gain +8%) | a random pool card, free (~10) + wild suit 3; up Hold |
| The Whole Deck | 1 | rare Aura | Suits | Whenever you make a Full Trick (all four suits this turn): Draw 2 cards. Next turn, gain 1 extra Mana. | 19.8 | 20.0 | -1% | on budget (c) | +4% (gain +36%) | Aura: Full Trick ~45% of turns x4 x (draw 2 7 + 1 Mana next turn 4) |
| Masquerade | 2 | rare Aura | Suits | At the end of your turn: Deal damage equal to 3 times the suits played this turn to ALL enemies. | 46.8 | 38.0 | +23% | strong (c) | +26% (gain +33%) | Aura: 3 suits by the end of a Suits-deck turn x3 = 9 to ALL (11.7) x4 |
| Trick of the Light | 0 | uncommon | Suits | Foresee 2. Gain 2 Barrier. | 6.9 | 6.7 | +3% | on budget | +12% (gain +42%) | Foresee 2 (4.5) + 2 Barrier 2.4; up +2 numbers (+42%) |
| Saved Breath | 0 | uncommon | glue | Next turn, gain 2 extra Mana. Foresee 2. Consume. | 11.5 | 10.6 | +8% | on budget | +1% (gain +22%) | +2 Mana next turn (8) + Foresee 2 as an extra 3.5; budget = Draw Blood (9.5, the guide's 0-cost +2 Mana Consume reference) x1.12 |
| The Long Game | 1 | uncommon Aura | glue | At the start of your turn: Draw 1 card. | 14.0 | 15.0 | -7% | on budget | -10% (gain +25%) | Aura: an extra card a turn 3.5 x4; up Opening hand |
| Frozen Moment | 1 | uncommon | glue | Cards in your hand cost 1 less the next time you play them. Consume. | 14.0 | 14.0 | 0% | on budget | +28% (gain +0% (cost 0)) | ~3 Mana saved across the hand it discounts (7 + 7 + 3.5, x0.8 for cards not played); up costs 0 |
| Deep Pockets | 2 | rare Aura | glue | From your next turn, gain 1 more Mana every turn for the rest of the fight. | 28.0 | 38.0 | -26% | weak | -34% (gain +16%) | Aura: +1 Mana a turn = 28 (guide §7 calls it a fair 2-cost Aura; the 2x rare rule reads it low); up Hold + Opening |
| Low Blow | 0 | common | glue | Deal 3 damage. Apply 1 Faltering. | 6.0 | 6.0 | +0% | on budget | +3% (gain +33%) | 3 + 1 Faltering |
| Tear the Veil | 1 | common | glue | Apply 1 Exposed to ALL enemies. Draw 2 cards. | 11.5 | 10.0 | +15% | on budget | +23% (gain +39%) | Exposed ALL 4.5 + draw 2 as an extra (3 + 4) |
| Step Aside | 1 | uncommon | glue | Gain 6 Barrier. Next turn, draw 1 extra card. | 10.7 | 11.2 | -4% | on budget | -2% (gain +34%) | 6 Barrier 7.2 + a card next turn 3.5 |
| Between Worlds | 2 | rare | glue | Gain 2 Ghostly. Consume. | 26.0 | 29.7 | -12% | on budget | +1% (gain +50%) | 2 Ghostly (13 each) |
| Perfect Alibi | 1 | rare | glue | Gain 13 Barrier. Discard 1 card. | 13.6 | 12.5 | +9% | on budget | +6% (gain +26%) | 13 Barrier 15.6 - discard 2 |
| Sleight of Hand | 1 | uncommon | glue | Draw 2 cards. Next turn, gain 1 extra Mana. | 11.0 | 11.2 | -2% | on budget | +3% (gain +36%) | draw 2 (7) + 1 Mana next turn 4 |
| Mask of Faces | 1 | uncommon | glue | Gain 2 Steadfast. Gain 6 Barrier. | 12.2 | 11.2 | +9% | on budget | +9% (gain +30%) | 2 Steadfast 5 + 6 Barrier 7.2 |
| Stolen Moment | 0 | uncommon | glue | Gain 1 Mana. Foresee 2. Consume. | 10.5 | 7.8 | +34% | strong | +8% (gain +5%) | +1 Mana 7 + Foresee 2 as an extra 3.5; budget = Marsh Light (7, the guide's 0-cost +1 Mana Consume reference) x1.12 |
| Curtain Call | 1 | uncommon | glue | Draw 1 card. Return 2 random Trap cards from your discard pile to your hand. | 9.0 | 11.2 | -20% | weak (c) | -28% (gain +17%) | draw 1 (3) + 2 Traps from the discard (+3 each, ~2 there in a Trap deck) |
| Patient Guard | 1 | rare Aura | glue | At the end of your turn: Gain 2 (+1 per card in hand) Barrier. | 16.8 | 20.0 | -16% | weak | +2% (gain +57%) | Aura: (2 + ~1.5 cards held) Barrier at the end of the turn x1.2 x4 |
| The Long Ambush | 3 | rare Trap | Exposed | At the start of the enemy turn: Deal 20 damage to ALL enemies. Stun ALL enemies for 1 turn. Apply 2 Exposed to ALL enemies. | 41.0 | 35.0 | +17% | strong | +7% (gain +18%) | (20 to ALL 26 + Stun ALL ~10.5 + 2 Exposed ALL 9) x0.9 |
