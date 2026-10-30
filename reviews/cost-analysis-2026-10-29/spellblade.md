# Spellblade: hand-priced card pool (2026-10-29)

83 class cards (80 pool cards + Cinderfall, Gather Arcana and the Obsidian Blade), priced with the costing guide. Trait **Kindled**: 1
Arcana and Sharpen the Blade by 1 at the start of every turn; she starts every fight with 3 Arcana. 75 HP. Starter: 4 Strike, 4 Defend,
Cinderfall, Gather Arcana, the Obsidian Blade (2: 10 + sharpening, Hold, Opening hand).

Rates (all legacy §5/§14, live again since #428): Arcana gained 2.5 a point, an Arcana cost adds ~6 a point to the budget, Sharpen 0.8 a
point. The gap between gaining (2.5) and spending (6) is what the guide says the class pays for needing both halves; it makes every pure
Arcana maker read low and every big spender read fair, which shows in the Arcana path below.

## Method

- Live card data at 0.128.0 (`COMBAT_DB`, `cardText`), every card with `hero` set to the class, no `+`, no `~`, no `source`. The starter's Strike and Defend are in the table for reference but left out of every count and grade.
- Rates: `docs/14_CARD_COSTING.md` §1-§12 and the §5/§14 legacy rates (Dagger 4 + Edge, Arcana gained 2.5 / spent ~6 a point, Sharpen 0.8 a point). **The §15 identity-rework rates were not used** (DECISIONS #428 reverted the Knight, Assassin and Spellblade).
- Budget: 6 / 10 / 19 / 28 / 37 by cost (a fractional "effective cost" is interpolated), +6 a point of Arcana cost, x0.6 Strike/Defend, x0.8 for a class signature basic, x1.12 uncommon, x1.25 rare. Consume +25% only on a card you would play every reshuffle and only outside the Knight (§6: in a class with Consume payoffs it is upside); never on Mana or card-making cards, where Consume is required. Fleeting +15%.
- Auras: a flat-rate Aura (Might, Plating, Bracing, Edge-like statuses with a direct rate) is priced on its rate against the plain budget. A triggered Aura is the 4-turn total (4 triggers, as the guide's own Bottomless Sleeves, Inner Furnace and Warm Anvil examples count) against 1.5x (uncommon) or 2x (rare) the budget of its cost. Cards that replay themselves from the consumed pile every turn (Howl of the Fallen, Endless Barrage) are Auras in disguise and priced that way.
- X cards: priced at X = 3 against 7 a X (uncommon) or 7.8 a X (rare). Hard gates ("only playable if"): 3x the budget. 0-cost Mana cards with Consume: against Draw Blood (9.5) times rarity, as §6 says.
- Upgrades: "Upg dev %" is the + card's price against **1.3 x the budget at its own cost** (the §12 norm of +30%), so 0% means a normal upgrade; a big number on an otherwise on-budget card means the upgrade is too big.
- Conditional cards ("cond.") are priced at the guide's expected value in a deck of their own build path (e.g. "if X" at 60-70%, triggers counted in the deck that wants them). "(ref)" marks the guide's own reference cards; several of them read outside ±15% even on the guide's own rates, which is noted rather than hidden.
- Verdicts: on budget within ±15%, strong +15 to +40%, broken above +40%, weak -15 to -40%, dead below -40%.
- Power grade (mean deviation): A within ±5%, B ±10%, C ±15%, D ±25%, F beyond. Consistency grade (interquartile range of the deviations, robust to the few huge outliers that the broken/dead counts already punish): A ≤15 points, B ≤25, C ≤35, D ≤45, F beyond.
- No sims were run; the starter-deck numbers below are expected values worked by hand.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall (rubric)** | **D** | 41% on budget (34 of 83), below the C line; 5 broken and 11 dead. |
| Power (mean deviation) | **A: fair, slightly under** | mean -4%, median -7%, clipped mean -4% |
| Consistency (spread) | **D** | IQR 42 points (SD 35): fewer extreme outliers than the Assassin, but a wide middle |

| Verdict | Count |
|---|---|
| on budget | 34 |
| strong | 16 |
| broken | 5 (Hungering Void, Arcane Flood, Sigil of Glass, Crowned Fist, Arcane Burst) |
| weak | 17 |
| dead | 11 (Wild Spark, Iron Rule, Tyrant's Gaze, Distant Ember, Obsidian Aegis, Ley Line, Sigil of Kindling, Weight of the Crown, The Forgemaster, Sigil of Wandering, Grand Speech) |

## Starter deck

| | Turn 1 | Turn 2 | Turn 3 | Guide baseline |
|---|---|---|---|---|
| Damage | ~20 | ~14 | ~12 (+5 if the Blade comes back) | |
| Barrier | ~2 | ~6.5 | ~6 | |
| Points a turn | ~24 | ~22 | ~20 | 18 (a basic starter), 30 (a turn of commons) |

Worked by hand: the Blade is always in the opening hand (11 on turn 1 after Kindled's Sharpen), so turn 1 is the Blade and one card,
plus Cinderfall in 40% of hands (0 + 2 Arcana: 8 + 1 Faltering + 1 Exposed, played first so the Blade hits Exposed). Turns 2-3 play
about 1.5 Strikes and 1.3 Defends. Turns 1-3 ~46 damage and ~15 Barrier: the most damage and the least Barrier of the three. Cinderfall is
on budget (-3%); the Obsidian Blade is on budget (-13%) and has **no upgrade** (`starforged-blade+` does not exist, so a shrine can't
upgrade it). **Gather Arcana is dead weight in the starter** (-38% on paper, and in practice 0): 3 Arcana at the start and 1 a turn
already pay for Cinderfall every time it is drawn, and the starter has no other Arcana cost. Kindled's Sharpen is ~0.8 a turn, its Arcana
2.5 a turn but idle until she drafts a spender.

## Build paths

| Path | Cards | On budget | Mean dev | Broken / strong / weak / dead | Holds up? |
|---|---|---|---|---|---|
| Blade | 19 | 42% | +9% | 1 / 7 / 2 / 1 | **Works, a little over.** Because the Blade is in the opening hand every fight, its payoffs are always reachable: Forged in Fury, Spoils, Feint, Crowned Edge, Glass Guard and Hammer and Anvil are strong, Crowned Fist (+50%) broken. The Forgemaster (Sharpen 30 for 1 + 4 Arcana) reads dead on the 0.8 Sharpen rate, but it is the path's boss card, and Echoing Blade doubles it. Heat of the Forge (-19%) needs Obsidian Flurry or Seven Shards. Cleaving Edge (-17%) is nothing against a lone enemy. |
| Arcana | 30 | 40% | -2% | 4 / 2 / 8 / 4 | **Works, but bimodal.** The spenders are fair (Molten Ruin, Glass Burst, Lava Bomb, Seven Shards, Mirror Glass, Final Shatter, Spellbolt, Obsidian Lance). The makers are weak or dead (Gather Arcana, Sigil of Kindling -47%, Ley Line -48%, Ember Cache, Faint Ember), and the triggered payoffs are broken (Hungering Void +160%, Arcane Flood +64%, Sigil of Glass +60%, Arcane Burst +49%) because the trait's Arcana a turn sets them off for free. Weight of the Crown, Obsidian Aegis and Arcane Pulse are priced far under their Arcana cost. |
| Court | 31 | 39% | **-13%** | 0 / 7 / 6 / 6 | **Under.** The cards that just do things are fine or strong (Glint, Magma Crash, Molten Weight, Cataclysm, Collapsing Vein, Glass Veil, Royal Decree), but six Auras and Skills are dead (Iron Rule, Tyrant's Gaze, Distant Ember, Sigil of Wandering, Grand Speech, Wild Spark) and the created-card payoffs (Pillar of Glass -23%, Glass Armory -10%) need ~1.2 created cards a turn that only a deep Court deck reaches. |

**Against bosses.** Strong. The Arcana spenders are the biggest single-target hits in the three classes (Molten Ruin 35, Lava Bomb 33
+ 3 Exposed, Final Shatter 30, Tyrant's Stomp 27, Glass Burst), and the Blade grows for the whole fight (Warm Anvil, Forgemaster, Echoing
Blade, Glass Guard's 10 Barrier a swing), so long boss fights favour her. The AoE half (Arcane Pulse, Seven Shards, Cleaving Edge, Molten
Weight, Cataclysm, Hungering Void) loses about a quarter of its value against a lone boss. Her weak side is Barrier against a front-loaded
big hit early: the starter blocks least of the three, and her best answers (Mirror Glass 15 + reflect, Glass Veil, Bladewall, Dying
Ember's 9 Sapped) cost Arcana or 2 Mana.

## Biggest outliers and suggested fixes (suggestions only, nothing applied)

| Card | Dev | Why | Suggested fix |
|---|---|---|---|
| Hungering Void (1, unc. Aura) | +160% | 3 to ALL on every Arcana gain **and** every spend: Kindled alone sets it off every turn, and an Arcana deck has ~10 events in four turns. | Spend only, 3 to ALL (~-7%), or gain only at 2. |
| Arcane Flood (0, unc.) | +64% | 3 to ALL per Arcana gained this turn, at 0; with Arcane Burst (9 gained) it is 27 to ALL. | 2 a point (~+9%). |
| Sigil of Glass (1, unc. Aura) | +60% | 2 Barrier per Arcana spent: ~20 Barrier over four turns of normal spending. | 1.5 per Arcana, or cost 2 (-16%). |
| Crowned Fist (1, unc.) | +50% | Grows 4 on every draw, so the first play is already 12, then 16, 20. | Grow when played, not drawn (~+14%), or grow 3 from 7. |
| Arcane Burst (0 + 5A, unc.) | +49% | Net +4 Arcana for 0, and the 9 "gained" feeds Arcane Flood and Hungering Void. | Gain 8 (net +3), and count as one gain. |
| Wild Spark (0 + 2A, unc.) | -80% | A random Neutral card (4) for 2 Arcana (budget 20). | No Arcana cost, and the Neutral card costs 0 this turn. |
| Iron Rule (1, rare Aura) | -80% | Draw 1, then a random hand card consumed: about nothing a turn, in a class with no consume payoffs. | Consume a card of your choice and draw 2 (or make it uncommon). |
| Tyrant's Gaze (2, rare Aura) | -70% | 1 Sapped per Attack until their next turn ends: ~3 a turn. | 2 Sapped per Attack and cost 1 (~+15%). |
| Obsidian Aegis (1 + 5A, rare) | -60% | 8 Plating (20) for 1 Mana and 5 Arcana (budget 50). | 2 Arcana and 10 Plating (~-9%). |
| Ley Line / Sigil of Kindling | -48% / -47% | +2 Mana for 3 Arcana; +2 Arcana a turn for 2 Mana, both against the "spending is rich" budget. | Ley Line for 2 Arcana (it makes Mana, so check the §8 loop test against Arcane Burst first); Sigil of Kindling at 1 Mana. |

**Upgrades** (mean 0% against the +30% norm, so they run normal). Too big: Obsidian Drill+ (+154% gain: X+1 reaches the X ≥ 4 doubling
at 3 Mana, 64 damage), Distant Ember+ (+100%), Iron Rule+ (+88%, Opening hand on a dead card), Pillar of Glass+ (+50%); Echoing Blade+
(cost 2 to 1) reads +54% against a + budget. Small: Crowned Edge+ (+11%) and Out of My Sight!+ (+14%). The Obsidian Blade has no +.

## Full table

| Card | Build path | Cost | Rarity | Text | Price | Budget | Dev % | Verdict | Upg price | Upg budget | Upg dev % | How it was priced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Strike | starter basic | 1 | basic | Deal 6 damage. | 6 | 6 | +0% | on budget | 9 | 7.8 | +15% | 6 |
| Defend | starter basic | 1 | basic | Gain 5 Barrier. | 6 | 6 | +0% | on budget | 9.6 | 7.8 | +23% | 5 Barrier |
| Obsidian Blade | - | 2 | common | Deal 10 (+1 per point of sharpening) damage. Hold. Opening hand. | 16.5 | 19 | -13% | on budget | - | - | no upgrade | 10 + ~2 sharpening by turn 2 + Hold 1 + Opening hand 3.5. No upgrade |
| Cinderfall | - | 0 + 2A | basic | Deal 8 damage. Apply 1 Faltering. Apply 1 Exposed. | 14 | 14.4 | -3% | on budget | 18 | 18.7 | -4% | 8 + 1 Faltering + 1 Exposed (0 + 2 Arcana; basic budget 80%) |
| Gather Arcana (ref) | - | 1 | basic | Gain 2 Arcana. | 5 | 8 | -37% | weak | 7.5 | 10.4 | -28% | 2 Arcana x2.5 (basic budget 80%) |
| Forged in Fury (ref) | Blade | 1 | common | Deal 7 damage. Sharpen 7 (every Obsidian Blade you have deals 7 more damage for the rest of the fight). | 12.6 | 10 | +26% | strong | 16.2 | 13 | +25% | 7 + Sharpen 7 x0.8 |
| Whetstone (ref) | Blade | 1 | common | Sharpen 8 (every Obsidian Blade you have deals 8 more damage for the rest of the fight). Next turn, gain 1 extra Mana. | 10.4 | 10 | +4% | on budget | 13.6 | 13 | +5% | Sharpen 8 x0.8 + 1 Mana next turn 4 |
| Spoils | Blade | 1 | common | Sharpen 6 (every Obsidian Blade you have deals 6 more damage for the rest of the fight). Draw 2 cards. | 11.8 | 10 | +18% | strong | 14.2 | 13 | +9% | Sharpen 6 x0.8 + draw 2 (3 + 4) |
| Feint (ref) | Blade | 1 | common | Gain 8 Barrier. Gain 2 Primed. | 11.6 | 10 | +16% | strong | 15 | 13 | +15% | 9.6 + 2 Primed |
| Obsidian Flurry (ref) | Blade | 2 | common | Deal 6 damage 3 times. | 20 | 19 | +5% | on budget | 27 | 24.7 | +9% | 18 + 2 (Might sources: Weight of the Crown, Grand Speech, Glass Armory) |
| Tyrant's Stomp | Blade | 4 | uncommon | Deal 27 damage. When you draw this: This card costs 1 less until you play it. | 27 | 31.4 | -14% | on budget | 35 | 40.8 | -14% | 27; drawn, it costs 3 |
| Crowned Fist | Blade | 1 | uncommon | Deal 8 damage, plus all it has grown. When you draw this: This card deals 4 more damage for the rest of the fight. | 16.8 | 11.2 | +50% | broken | 23.2 | 14.6 | +59% | grows 4 on every draw: 12 the first play + 4 x1.2 |
| Bladewall (ref) | Blade | 2 | uncommon | Gain 12 Barrier. Sharpen 10 (every Obsidian Blade you have deals 10 more damage for the rest of the fight). | 22.4 | 21.3 | +5% | on budget | 28.4 | 27.7 | +3% | 14.4 + Sharpen 10 x0.8 |
| Crowned Edge (cond.) | Blade | 1 | uncommon | Sharpen 3 (every Obsidian Blade you have deals 3 more damage for the rest of the fight). Your Obsidian Blade deals double damage to the target this turn. | 15 | 11.2 | +34% | strong | 16.6 | 14.6 | +14% | Sharpen 3 2.4 + the Blade doubled (~18 more) x70% that it is in hand to swing the same turn |
| Call the Blade | Blade | 1 | uncommon | Put your Obsidian Blade into your hand from wherever it is. Sharpen 8 (every Obsidian Blade you have deals 8 more damage for the rest of the fight). | 10.4 | 11.2 | -7% | on budget | 12.8 | 14.6 | -12% | tutor the Blade 4 + Sharpen 8 x0.8 |
| Heat of the Forge (ref) | Blade | 1 | uncommon | Gain 7 Primed. | 9.1 | 11.2 | -19% | weak | 13 | 14.6 | -11% | 7 Primed x ~1.3 hits (Flurry, Seven Shards make it much more) |
| Warm Anvil (ref) | Blade | 1 | uncommon, Aura | At the start of your turn: Sharpen 5 (every Obsidian Blade you have deals 5 more damage for the rest of the fight). | 16 | 15 | +7% | on budget | 22.4 | 19.5 | +15% | Sharpen 5 a turn x0.8 x4 |
| Glass Guard (cond.) | Blade | 1 | uncommon, Aura | Whenever you play an Obsidian Blade: Gain 10 Barrier. | 20.4 | 15 | +36% | strong | 28.6 | 19.5 | +47% | ~1.7 Blade plays in 4 turns x 12 |
| Hammer and Anvil (cond.) | Blade | 1 | rare | Sharpen 5 (+5 per time the target was hit this turn). Deal 5 damage. | 15 | 12.5 | +20% | strong | 19.4 | 16.3 | +19% | Sharpen 5 + 5 x ~1.5 hits before = 12.5 x0.8 + 5 |
| Obsidian Drill (cond.) | Blade | X | rare | Deal 8 damage X times. If X is 4 or more: Deal 8 damage X times. | 26 | 23.4 | +11% | on budget | 66 | 30.4 | +117% | X=3: 24 + 2 (hits); X=4+ doubles to 64 (+ makes X=4 at 3 Mana) |
| Cleaving Edge | Blade | 1 | rare, Aura | Sharpen 7 (every Obsidian Blade you have deals 7 more damage for the rest of the fight). Your Obsidian Blade strikes ALL enemies for the rest of the fight. | 16.6 | 20 | -17% | weak | 19.8 | 26 | -24% | Sharpen 7 5.6 + the Blade on all (~2 plays x ~18 x 0.3); 0 against a boss alone |
| Echoing Blade | Blade | 2 (+: 1) | rare, Aura | Your Obsidian Blade is played one more time for the rest of the fight. | 40 | 38 | +5% | on budget | 40 | 26 | +54% | the Blade twice: ~2 plays x ~20 |
| The Forgemaster (cond.) | Blade | 1 + 4A | rare | Sharpen 30 (every Obsidian Blade you have deals 30 more damage for the rest of the fight). | 24 | 42.5 | -44% | dead | 32 | 55.3 | -42% | Sharpen 30 x0.8 (1 + 4 Arcana). More with Echoing Blade or in long boss fights |
| Magma Surge | Blade | 0 | rare | Draw 1 card. Gain 1 Mana. Gain 1 Arcana. Sharpen 5 (every Obsidian Blade you have deals 5 more damage for the rest of the fight). Consume. | 16.5 | 11.9 | +39% | strong | 20 | 15.5 | +29% | draw 3 + Mana 7 + Arcana 2.5 + Sharpen 4; against Draw Blood x rare |
| Arcane Pulse | Arcana | 0 + 3A | common | Deal 6 damage 2 times to ALL enemies. | 16.6 | 24 | -31% | weak | 21.8 | 31.2 | -30% | 12 AoE x1.3 + 1 (hits); 0 + 3 Arcana |
| Obsidian Lance (cond.) | Arcana | 1 + 1A | common | Deal 8 (+2 per card with an Arcana cost in your deck) damage. | 16 | 16 | +0% | on budget | 20 | 20.8 | -4% | 8 + 2 x ~4 Arcana-cost cards in the deck; 1 + 1 Arcana |
| Spellbolt | Arcana | 1 + 2A | common | Deal 12 damage. Next turn, draw 2 extra cards. | 19 | 22 | -14% | on budget | 23.5 | 28.6 | -18% | 12 + 2 cards next turn 7; 1 + 2 Arcana |
| Emberstrike (ref) | Arcana | 1 | common | Deal 9 damage. Gain 1 Arcana. | 11.5 | 10 | +15% | on budget | 15 | 13 | +15% | 9 + 1 Arcana |
| Arcane Barrier | Arcana | 0 + 1A | common | Gain 7 Barrier. | 8.4 | 12 | -30% | weak | 12 | 15.6 | -23% | 7 Barrier; 0 + 1 Arcana |
| Pale Ward (ref) | Arcana | 1 | common | Gain 8 Barrier. Gain 1 Arcana. | 12.1 | 10 | +21% | strong | 15.7 | 13 | +21% | 9.6 + 1 Arcana |
| Faint Ember | Arcana | 1 | common | Gain 1 Arcana. Draw 1 card. Next turn, draw 1 extra card. | 9 | 10 | -10% | on budget | 11.5 | 13 | -12% | 1 Arcana + draw 1 + 1 card next turn |
| Ember Cache | Arcana | 1 | common | Gain 1 Arcana. Next turn, gain 3 Arcana. | 9.5 | 10 | -5% | on budget | 12 | 13 | -8% | 4 Arcana (1 now, 3 next turn) |
| Humble | Arcana | 0 | common | Apply 1 Faltering. Apply 1 Exposed. Consume. | 6 | 7.5 | -20% | weak | 7.5 | 9.8 | -23% | 1 Faltering + 1 Exposed. + loses Consume (+25%) |
| Molten Ruin (ref) | Arcana | 1 + 4A | uncommon | Deal 35 damage. | 35 | 38.1 | -8% | on budget | 45 | 49.5 | -9% | 35; 1 + 4 Arcana |
| Glass Burst (ref) | Arcana | 0 + 3A | uncommon | Deal 13 damage. Apply 2 Faltering. Apply 2 Exposed. | 25 | 26.9 | -7% | on budget | 30 | 34.9 | -14% | 13 + 2 Faltering + 2 Exposed; 0 + 3 Arcana |
| Final Shatter | Arcana | 3 | uncommon | Deal 30 damage. If this is fatal: Gain 5 Arcana. | 35 | 31.4 | +12% | on budget | 43 | 40.8 | +5% | 30 + fatal 5 Arcana (~35% x 12.5) + 2 |
| Arcane Flood (cond.) | Arcana | 0 | uncommon | Deal 3 damage for each Arcana gained this turn to ALL enemies. | 11 | 6.7 | +64% | broken | 14 | 8.7 | +60% | 3 AoE x ~2.5 Arcana gained this turn x1.3 + hits |
| Shard Strike | Arcana | 1 | uncommon | Deal 8 damage. Gain 2 Arcana. It goes on top of your draw pile after you play it. | 14.5 | 11.2 | +29% | strong | 17.5 | 14.6 | +20% | 8 + 2 Arcana 5 + back on top of the draw pile 1.5 |
| Falling Shards | Arcana | 0 + XA | uncommon | Spend all your Arcana: X is the Arcana spent. Deal 5 damage to a random enemy X times. | 5.5 | 6.7 | -18% | weak | 7.3 | 8.7 | -16% | a point: 5 x0.9 random + 1 (hits) for each Arcana; budget 6 a point x1.12 |
| Tyrant Strike | Arcana | 2 | uncommon | Deal 15 damage. Next turn, gain 2 extra Mana. | 23 | 21.3 | +8% | on budget | 30 | 27.7 | +8% | 15 + 2 Mana next turn 8 |
| Hungering Void (cond.) | Arcana | 1 | uncommon, Aura | Whenever you gain Arcana: Deal 3 damage to ALL enemies. Whenever you spend Arcana: Deal 3 damage to ALL enemies. | 39 | 15 | +160% | broken | 52 | 19.5 | +167% | ~10 Arcana gain or spend events in 4 turns (the trait is 4 of them) x3.9 |
| Sigil of Glass (cond.) | Arcana | 1 | uncommon, Aura | Whenever you spend Arcana: Gain Barrier equal to 2 times the Arcana spent. | 24 | 15 | +60% | broken | 36 | 19.5 | +85% | ~10 Arcana spent in 4 turns x2 Barrier x1.2 |
| Ley Line | Arcana | 0 + 3A | uncommon | Gain 2 Mana. | 14 | 26.9 | -48% | dead | 17.5 | 34.9 | -50% | +2 Mana for 3 Arcana |
| Banked Embers | Arcana | 1 | uncommon | Next turn, gain 1 extra Mana. Next turn, gain 1 Arcana. Gain 1 Holdfast. | 9 | 11.2 | -20% | weak | 11.5 | 14.6 | -21% | +1 Mana next turn 4 + 1 Arcana 2.5 + Holdfast ~2.5 |
| Mirror Glass | Arcana | 1 + 3A | uncommon | Gain 15 Barrier. Until your next turn, attack damage your Barrier soaks is dealt back to the attacker. | 30 | 31.4 | -4% | on budget | 36 | 40.8 | -12% | 18 + reflect ~12 (one enemy turn of soaked hits); 1 + 3 Arcana |
| Weight of the Crown | Arcana | 1 + 2A | uncommon | Gain 1 Might. Apply 1 Sapped to ALL enemies. | 13 | 24.6 | -47% | dead | 18 | 32 | -44% | 1 Might 5 + 1 Sapped to all for the fight ~8; 1 + 2 Arcana |
| Arcane Burst | Arcana | 0 + 5A | uncommon | Gain 9 Arcana. Consume. | 10 | 6.7 | +49% | broken | 12 | 8.7 | +38% | pay 5 Arcana, gain 9: net +4 x2.5 (Consume required) |
| Glass Wall | Arcana | 0 + 2A | uncommon | Gain 9 Barrier. It goes back to your hand after you play it. | 12.8 | 20.2 | -37% | weak | 16.4 | 26.2 | -37% | 10.8 + back to hand 2; 0 + 2 Arcana |
| Lava Bomb | Arcana | 0 + 5A | rare | Deal 33 damage. Apply 3 Faltering. Apply 3 Exposed. | 51 | 45 | +13% | on budget | 62 | 58.5 | +6% | 33 + 3 Faltering + 3 Exposed; 0 + 5 Arcana |
| Dying Ember | Arcana | 1 + 3A | rare | Deal 9 damage to ALL enemies. Apply 9 Sapped to ALL enemies until the end of their next turn. Fleeting. | 27.7 | 40.3 | -31% | weak | 33 | 52.3 | -37% | 11.7 AoE + 9 Sapped to all (~16); 1 + 3 Arcana |
| Seven Shards | Arcana | 2 + 7A (+: 1) | rare | Deal 7 damage 7 times to ALL enemies. | 70 | 76.3 | -8% | on budget | 70 | 84.5 | -17% | 49 AoE x1.3 + 6 (hits); 2 + 7 Arcana |
| Sigil of Kindling | Arcana | 2 | rare, Aura | At the start of your turn: Gain 2 Arcana. | 20 | 38 | -47% | dead | 30 | 49.4 | -39% | +2 Arcana a turn x2.5 x4 |
| Obsidian Aegis | Arcana | 1 + 5A | rare | Gain 8 Plating. | 20 | 50 | -60% | dead | 27.5 | 65 | -58% | 8 Plating x2.5 (flat); 1 + 5 Arcana |
| Weigh the Crown (cond.) | Arcana | 0 + 6A | rare | Draw 3 cards. Play a random Skill from your hand 3 times. Consume. | 32 | 52.5 | -39% | weak | 40 | 68.3 | -41% | draw 3 11 + a random Skill played 3 times (~7 x3); 0 + 6 Arcana |
| Magma Crash | Court | 0 | common | Deal 10 damage. Add a Rubble to your hand. | 8 | 6 | +33% | strong | 12 | 7.8 | +54% | 10 + a Rubble into the hand (-2: junk, but it counts as a created card) |
| Molten Weight | Court | 1 | common | Deal 8 damage to ALL enemies. Apply 1 Sapped to ALL enemies until the end of their next turn. | 12.2 | 10 | +22% | strong | 15 | 13 | +15% | 10.4 AoE + 1 Sapped to all |
| Glint | Court | 1 | common | Deal 10 damage. Draw 1 card. Put a card from your hand on top of your draw pile. | 14 | 10 | +40% | strong | 21 | 13 | +62% | 10 + draw 1 3 + a card back on top 1. + raises two numbers (+50%) |
| Out of My Sight! | Court | 1 | common | Turn a card in your hand into a Retainer Strike. | 7 | 10 | -30% | weak | 8 | 13 | -38% | a weak hand card becomes a Retainer Strike (0: 6 + draw 1): ~+7 |
| Hollow Gaze | Court | 1 | common | Gain 6 Barrier. Put a random card from your discard pile on top of your draw pile. | 8.7 | 10 | -13% | on budget | 12.3 | 13 | -5% | 7.2 + a card on top 1.5 |
| Glass Veil (ref) | Court | 2 | common | Gain 11 Barrier. Next turn, gain 5 Barrier. | 18.2 | 19 | -4% | on budget | 22.6 | 24.7 | -9% | 13.2 + 5 next turn |
| Hex Volley (cond.) | Court | 0 | uncommon | Deal 4 damage for each Skill played this turn. | 6 | 6.7 | -11% | on budget | 7.5 | 8.7 | -14% | 4 x ~1.5 Skills before it |
| Collapsing Vein (cond.) | Court | 1 | uncommon | Deal 5 (+2 per card created this fight) damage. | 13 | 11.2 | +16% | strong | 16 | 14.6 | +10% | 5 + 2 x ~4 cards created by mid-fight |
| Sigil of Momentum | Court | 2 (+: 1) | uncommon, Aura | For the rest of the fight, every 4 Mana you spend gives 1 Mana back. | 21 | 28.5 | -26% | weak | 21 | 19.5 | +8% | ~0.75 Mana a turn x7 x4 |
| Distant Ember (cond.) | Court | 1 | uncommon, Aura | At the end of your turn: If you have played 5 or more cards this turn: Next turn, draw 1 extra card. | 5.6 | 15 | -63% | dead | 11.2 | 19.5 | -43% | 5+ cards ~40% of turns x 3.5 |
| Pillar of Glass (cond.) | Court | 1 | uncommon, Aura | Whenever a card is created: Gain 2 Barrier. | 11.5 | 15 | -23% | weak | 17.3 | 19.5 | -11% | ~1.2 created a turn x2.4 |
| Sigil of Wandering | Court | 2 (+: 1) | uncommon, Aura | At the start of your turn: Add a random Neutral card to your hand. | 16 | 28.5 | -44% | dead | 16 | 19.5 | -18% | a random Neutral card a turn 4 x4 |
| To Arms! | Court | 1 | uncommon | Turn 2 random cards in your draw pile into Retainer Dives. | 12 | 11.2 | +7% | on budget | 15 | 14.6 | +3% | 2 random draw-pile cards become Retainer Dives (13 at 0): ~+6 each, later |
| Ash Wind | Court | 1 | uncommon | Draw 3 cards. Put a card from your hand on top of your draw pile. | 12 | 11.2 | +7% | on budget | 16 | 14.6 | +10% | draw 3 11 + a card on top 1 |
| Royal Decree (ref) | Court | 1 | uncommon | Gain 7 Barrier. Add a random Neutral card to your hand. | 12.4 | 11.2 | +11% | on budget | 15.6 | 14.6 | +7% | 8.4 + a random Neutral 4 |
| Grand Speech | Court | 0 | uncommon | This turn, whenever you play a card: Gain 1 Might until the end of your turn. | 4 | 6.7 | -40% | dead | 6 | 8.7 | -31% | +1 Might this turn a card: ~4 Might-hits after it |
| Scheme (ref) | Court | 1 | uncommon | Next turn, draw 2 extra cards. | 7 | 11.2 | -38% | weak | 10.5 | 14.6 | -28% | 2 cards next turn |
| Read the Embers (ref) | Court | 2 | uncommon | Draw 6 cards. | 17 | 21.3 | -20% | weak | 21 | 27.7 | -24% | draw 6 (guide: ~17) |
| Wild Spark | Court | 0 + 2A | uncommon | Add a random Neutral card to your hand. | 4 | 20.2 | -80% | dead | 5.5 | 26.2 | -79% | a random Neutral card 4, for 2 Arcana |
| Endless Barrage | Court | 3 | rare | At the start of your turn, if this is consumed, it is played for free and goes back. Deal 18 damage. Consume. | 72 | 56 | +29% | strong | 96 | 72.8 | +32% | plays itself from the consumed pile every turn: 18 x4; priced as a rare 3-cost Aura (2 x 28) |
| Cataclysm | Court | 1 | rare | Deal 21 damage to ALL enemies. Add Rubbles to your hand equal to the room left in your hand. | 17.3 | 12.5 | +38% | strong | 23.8 | 16.3 | +46% | 27.3 AoE - Rubbles filling the hand (~5 x -2) |
| Heirloom Maul | Court | 2 | rare | Deal 20 damage. Add a copy of a random Neutral card in your hand to your hand. | 21.6 | 23.8 | -9% | on budget | 26.6 | 30.9 | -14% | 20 + a Neutral copied ~40% x4 |
| By Decree | Court | 0 | rare | Deal 6 damage. Every 3 Skills you play in a turn, it comes back to your hand. | 7.8 | 7.5 | +4% | on budget | 11.7 | 9.8 | +20% | 6 + back to hand on 3 Skills (~30%) |
| Glass Armory (cond.) | Court | 1 | rare, Aura | Whenever a card is created: Gain 1 Might. | 18 | 20 | -10% | on budget | 21.5 | 26 | -17% | ~1.2 created a turn = ~5 Might by turn 4, each ~3.5 |
| Tyrant's Gaze | Court | 2 (+: 1) | rare, Aura | Whenever you play an Attack: Apply 1 Sapped until the end of their next turn. | 11.5 | 38 | -70% | dead | 11.5 | 26 | -56% | ~2 Attacks a turn x 1 Sapped x1.2 x1.2 hits |
| Iron Rule | Court | 1 | rare, Aura | At the start of your turn: Draw 1 card. Consume 1 random card. | 4 | 20 | -80% | dead | 7.5 | 26 | -71% | draw 1 (3) and a random hand card consumed (-2) a turn |
| Hollow Form | Court | 3 | rare, Aura | End your turn. The first 2 cards you play each turn cost no Mana. Fleeting. | 56 | 64.4 | -13% | on budget | 64.4 | 72.8 | -12% | first 2 cards free: ~2 Mana a turn x7 x4. + loses Fleeting |
| Rift Gifts | Court | 1 | rare | Add 3 random Neutral cards to your hand. Consume. | 12 | 12.5 | -4% | on budget | 16 | 16.3 | -2% | 3 random Neutral cards x4 (Consume required) |
| Fated Hand | Court | 1 | rare | Choose 2 cards in your draw pile and put them on top. Next turn, draw 2 extra cards. | 11 | 12.5 | -12% | on budget | 15.5 | 16.3 | -5% | 2 chosen cards on top (+2 each) + 2 cards next turn 7 |
| Call the Guard! | Court | 2 | rare | Turn any number of cards in your hand into Retainer Guards. Consume. | 16 | 23.8 | -33% | weak | 22 | 30.9 | -29% | ~3 weak hand cards become Retainer Guards (8.4 each, ~+5.4) |
| Unbreakable Crown | Court | 1 | rare | Gain 10 Barrier. At the end of your turn, if this is on top of your draw pile, it is played. | 14.4 | 12.5 | +15% | strong | 18 | 16.3 | +11% | 12 + played again from the top ~20% x12 |
