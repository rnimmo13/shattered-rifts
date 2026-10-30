# Knight: hand-priced card pool (2026-10-29)

82 class cards (81 pool cards + Sundering Blow), priced with the costing guide. Trait **Oathkeeper**: 6 Barrier and 6 Plating at the start
of every fight. 80 HP. Starter: 5 Strike, 4 Defend, Sundering Blow.

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
| **Overall (rubric)** | **D** | 55% on budget (45 of 82), but 7 broken cards ("several broken" is a D) and one dead. Without the broken cards it would be a C (50%+ on budget, one build path over). |
| Power (mean deviation) | **B: fair, slightly over** | mean +6%, median 0%, mean with outliers clipped to [-60, +100] +4% |
| Consistency (spread) | **B** | IQR 23 points (SD 38, pulled up by Blood Fire and Stone Fury) |

| Verdict | Count |
|---|---|
| on budget | 45 |
| strong | 13 |
| broken | 7 (Blood Fire, Stone Fury, Howl of the Fallen, Bloodied Plate, Immovable Oath, Grim Focus, Spiteful Jab) |
| weak | 16 |
| dead | 1 (Rite of Recall) |

Three of the seven broken cards sit within 12 points of the line (Immovable Oath +52%, Grim Focus +49%, Spiteful Jab +43%); four are well past it.
Several of the pool's strong cards are the guide's own reference cards (Oath of Iron +26%, Hilt Strike +20%, Mounting Fury +34%), so the
guide's examples and its rates disagree a little at the top end.

## Starter deck

| | Turn 1 | Turn 2 | Turn 3 | Guide baseline |
|---|---|---|---|---|
| Damage | ~11 | ~11 | ~11 (+3 when Exposed carries over) | |
| Barrier | ~5 + 6 (trait) = 11 | ~5 + ~4 kept by Plating | ~5 + ~3 kept | |
| Points a turn | ~24 | ~21 | ~20 | 18 (a basic starter: 3 cards at 60%), 30 (a turn of commons) |

Worked by hand: a 5-card hand from 5 Strike / 4 Defend / Sundering Blow, 3 Mana. Half the hands hold Sundering Blow (8 + 2 Exposed, then a
Strike for 9); the rest play about 1.7 Strikes and 1.3 Defends. Sundering Blow is on budget for a signature basic (-8%). The trait is
worth ~22 points, all in the first three turns (7.2 Barrier + 6 Plating at 2.5), which makes the Knight the most comfortable opener of the
three classes graded here. Turns 1-3: ~33 damage and ~28 Barrier. It has no draw and no scaling, so it falls behind from turn 4 until it
drafts one of its engines.

## Build paths

| Path | Cards | On budget | Mean dev | Broken / strong / weak / dead | Holds up? |
|---|---|---|---|---|---|
| Bulwark | 12 | 67% | +1% | 1 / 1 / 2 / 0 | **Works.** The trait's Plating starts the Barrier carry-over the path wants; Bulwark Blow, Bastion Engine and Stone Stance are reachable payoffs. Unbroken Wall (-32%) is slow in a 4-6 turn fight but is the best card against bosses. Immovable Oath reads broken only because the Knight gets no Consume bonus (the guide's own pairing reads +21%). |
| Might | 32 | 59% | +3% | 1 / 6 / 6 / 0 | **Works**, the deepest path. Twin Cut, Hilt Strike, Mastered Strike, Mounting Fury, Whirling Blade and Hammer Fall carry it. Weak spots: Challenge (-34%, the enemy's Might eats the gain), Warlord's Oath (-36% in a 4-turn window), Relentless Push, Juggler's Rhythm, Scent of Weakness. Stone Fury (+167%) is the outlier. |
| Consume | 22 | 50% | +3% | 2 / 3 / 5 / 1 | **Works but swings.** Howl of the Fallen (+98%) and Grim Focus (+49%) are over; Rite of Recall (-45%), Brace for Battle (-31%), Unholy Pact (-29%, an engine that is priced low until Numbing Rite and Rite of Recall join it), Pact of Embers and Wild Gamble are under. The payoffs (Ashen Reckoning, Smoldering Blow, Numbing Rite) are reachable by turn 3 with two or three consume cards. |
| Blood | 11 | 45% | **+31%** | 3 / 2 / 1 / 0 | **Clearly over.** Blood Fire sets itself off every turn (+213%), Bloodied Plate is 8 Barrier a turn for 1 HP (+62%), Spiteful Jab and Rending Fury are always "on" next to them. Rally (-37%) is the one weak card. |

**Against bosses.** Good. Big single-target hits are there (Hammer Fall 32, Mastered Strike 17-19, Mounting Fury growing, Rending Fury,
Bulwark Blow with Fortified), Barrier for a front-loaded big hit is there (Immovable Oath 30, Stone Stance doubling, Crippling Blow's 10
Sapped, Unbroken Wall keeping it), and the slow cards that read weak in a 4-turn window (Warlord's Oath, Unbroken Wall) pay off in a long
boss fight. The AoE cards (Howl, Breach, Whirling Blade, Clarion Clap, Wildfire) lose about a quarter of their value against a lone boss.
The Blood path costs HP every turn of a long fight, but Bloodied Plate and Blood Fire more than pay for it.

## Biggest outliers and suggested fixes (suggestions only, nothing applied)

| Card | Dev | Why | Suggested fix |
|---|---|---|---|
| Blood Fire (1, unc. Aura) | +213% | Its own "lose 1 HP at the start of your turn" is HP lost to your own card, so it deals 6 to ALL every turn for 1 HP before any other Blood card. | Don't let its own HP loss trigger it, or "the first time each turn you lose HP to a card". Either brings it to ~+10-40%. |
| Stone Fury (0, rare) | +167% | Every Attack in hand becomes a Giant Rock (1: 16) for the rest of the fight: ~+10 a Strike now and again every reshuffle, for 0 Mana. | Giant Rock for this turn only, or Giant Rock 12 and Stone Fury costs 1. |
| Howl of the Fallen (3, unc.) | +98% | Replays itself from the consumed pile every turn: 16 to ALL a turn, an uncommon that out-does a rare Aura. | Make it rare and 10-12 to ALL, or keep 16 and drop the replay. |
| Bloodied Plate (1, rare Aura) | +62% | 8 Barrier a turn for 1 HP at 1 Mana (32 over four turns against 20), and it feeds Scar Over and Blood Fire. | 5 Barrier a turn (-10%), or cost 2 (-15%). |
| Immovable Oath (2, rare) | +52% | 30 Barrier; no Consume bonus in the Knight (§6). With the guide's own +25% pairing it is +21%. | 25 Barrier if the class rule stands; otherwise leave it and note the §6 contradiction in the guide. |
| Grim Focus (0, unc.) | +49% | Draw 3 for 0 (the "no more draws" costs little). | Cost 1 (-11%), or draw 2. |
| Spiteful Jab (0, unc.) | +43% | 6 + 6 if you lost HP this turn, nearly always true next to Blood Fire or Bloodied Plate. | 5 + 5. |
| Rite of Recall (2, rare Aura) | -45% | Draw 1 per consume (~1.5 a turn) is ~21 over four turns against a 2-cost rare's 38. | Cost 1 (the + is already that), or uncommon. |
| Rally (2, rare) | -37% | Heal 10 with Consume, at 1.5 a HP. | Cost 1, or heal 15. |
| Warlord's Oath (3, rare Aura) / Challenge (2, unc.) | -36% / -34% | +2 Might a turn starts too late for a 4-turn window; Challenge hands the enemy +1 Might for the fight. | Warlord's Oath at 2 (the +'s cost); Challenge without "Apply 1 Might", or 6 x2. |

**Upgrades** (mean +18% against the +30% norm, so upgrades run a little big): Clarion Clap+ (+87% gain), Double Down+ (two Reverb: +100%),
Borrowed Blade+ (+100%), Forsake+ (+91%), Intimidate+, Provoke+, Oath of Iron+, Hilt Strike+ and Dawn Smite+ (+58-62%) are past the +50%
line; most come from `plus()` raising every number. 20 cards upgrade by a cost cut, mostly Auras (in line with §12); the cost cuts on
Blood Fire, Bloodied Plate and Raised Hell make already-strong Auras stronger. Immovable Oath+, Hammer Fall+, Stone Fury+ and Fan the
Flames+ gain under 15%.

## Full table

| Card | Build path | Cost | Rarity | Text | Price | Budget | Dev % | Verdict | Upg price | Upg budget | Upg dev % | How it was priced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Strike | starter basic | 1 | basic | Deal 6 damage. | 6 | 6 | +0% | on budget | 9 | 7.8 | +15% | 6 damage |
| Defend | starter basic | 1 | basic | Gain 5 Barrier. | 6 | 6 | +0% | on budget | 9.6 | 7.8 | +23% | 5 Barrier x1.2 |
| Sundering Blow | - | 2 | basic | Deal 8 damage. Apply 2 Exposed. | 14 | 15.2 | -8% | on budget | 20 | 19.8 | +1% | 8 + 2 Exposed (6) |
| Bulwark Blow (cond.) | Bulwark | 1 | common | Deal damage equal to your Barrier. | 10 | 10 | +0% | on budget | 13 | 13 | +0% | Barrier when played ~10 in a Bulwark deck (Plating carry + a Defend) |
| Oath of Iron (ref) | Bulwark | 1 | common | Gain 8 Barrier. Draw 1 card. | 12.6 | 10 | +26% | strong | 20.2 | 13 | +55% | 9.6 + draw 3; guide: a known strong common. + is +60% (11 Barrier and draw 2) |
| Field Repairs | Bulwark | 1 | common | Gain 5 Barrier. Upgrade a random card in your hand for this fight. | 10 | 10 | +0% | on budget | 13.6 | 13 | +5% | 6 + a hand card upgraded for the fight (~4: this play and maybe one more) |
| Cold Stare (cond.) | Bulwark | 1 | uncommon | Gain 8 Barrier. If you have consumed a card this turn: Gain 8 Barrier. | 12.5 | 11.2 | +12% | on budget | 17.2 | 14.6 | +18% | 9.6 + 9.6 x 30% (consumed this turn; Bulwark deck, not a Consume deck) |
| Provoke (ref) | Bulwark | 1 | uncommon | Gain 7 Barrier. Apply 1 Exposed. | 11.4 | 11.2 | +2% | on budget | 18 | 14.6 | +24% | 8.4 + 1 Exposed |
| Stoneskin (ref) | Bulwark | 1 | uncommon | Gain 4 Plating. | 10 | 11.2 | -11% | on budget | 15 | 14.6 | +3% | 4 Plating x2.5 (flat-rate Aura) |
| Giant's Stance (cond.) | Bulwark | 1 | uncommon | Gain 5 Barrier. Gain 1 Sturdy. | 9 | 11.2 | -20% | weak | 12.6 | 14.6 | -13% | 6 + Sturdy: half of one enemy hit (~6) x ~50% that the attacker is Exposed |
| Bastion Engine | Bulwark | 2 (+: 1) | rare, Aura | Whenever you gain Barrier: Deal 5 damage to a random enemy. | 32.4 | 38 | -15% | on budget | 32.4 | 26 | +25% | ~1.8 Barrier gains a turn x 4.5 (5 random) x 4 turns |
| Immovable Oath | Bulwark | 2 | rare | Gain 30 Barrier. Consume. | 36 | 23.8 | +52% | broken | 39.6 | 30.9 | +28% | 30 Barrier x1.2. No Consume bonus in the Knight (§6); the guide pairs it with +25% (would read +21%). Overblocks Tier I hits |
| Unbroken Wall (cond.) | Bulwark | 3 (+: 2) | rare, Aura | Gain Fortified for the rest of the fight. | 38 | 56 | -32% | weak | 38 | 49.4 | -23% | Fortified: ~8 Barrier kept a turn in a Bulwark deck x1.2 x4. Weak in 4-6 turns, strong in boss fights |
| Stone Stance (cond.) | Bulwark | 2 (+: 1) | rare, Aura | Gain 1 Unmovable. | 38 | 38 | +0% | on budget | 38 | 26 | +46% | Unmovable: first Barrier card doubled, ~8 a turn x1.2 x4. Immovable Oath doubles to 60 |
| Ember Ward (ref) | Bulwark | 2 | uncommon | Gain 12 Barrier. Gain 4 Thorns until the enemy turn is over. | 20.4 | 21.3 | -4% | on budget | 25.5 | 27.7 | -8% | 14.4 + 4 Thorns x1.5 hits |
| Twin Cut (ref) | Might | 1 | common | Deal 5 damage 2 times. | 11 | 10 | +10% | on budget | 13 | 13 | +0% | 10, +1 for the extra hit (Knight has Might) |
| Braced Strike | Might | 1 | common | Deal 7 damage. Gain 2 Might until the end of your turn. | 10 | 10 | +0% | on budget | 14.5 | 13 | +12% | 7 + 2 Might this turn (~1.5 attacks after it) |
| Cleaving Throws (ref) | Might | 1 | common | Deal 3 damage to a random enemy 3 times. | 9.6 | 10 | -4% | on budget | 12.8 | 13 | -2% | 9 x0.9 random + 2 for the extra hits |
| Hilt Strike (ref) | Might | 1 | common | Deal 9 damage. Draw 1 card. | 12 | 10 | +20% | strong | 19 | 13 | +46% | 9 + draw 3. + is +58% (guide example) |
| Clarion Clap (ref) | Might | 1 | common | Deal 4 damage to ALL enemies. Apply 1 Exposed to ALL enemies. | 9.7 | 10 | -3% | on budget | 18.1 | 13 | +39% | 4 AoE 5.2 + 1 Exposed to all 4.5. + is +87% (guide example) |
| Rattle (ref) | Might | 1 | common | Apply 3 Exposed. Consume. | 9 | 10 | -10% | on budget | 11 | 13 | -15% | 3 Exposed (Consume is neutral in the Knight) |
| Mastered Strike (cond.) | Might | 2 | common | Deal 6 (+2 per Strike card in your deck) damage. | 17 | 19 | -11% | on budget | 20 | 24.7 | -19% | 6 + 2 per Strike card: ~5-6 Strike cards (guide 16-19) |
| Steel Resolve (ref) | Might | 1 | uncommon | Gain 2 Might for the rest of the fight. | 10 | 11.2 | -11% | on budget | 15 | 14.6 | +3% | 2 Might x5 (flat-rate Aura) |
| Challenge | Might | 2 | uncommon | Deal 5 damage 2 times. Gain 2 Might. Apply 1 Might. | 14 | 21.3 | -34% | weak | 19 | 27.7 | -31% | 10 + 1 (hits) + 2 Might 10, minus the enemy's +1 Might for the fight (~-6) |
| Intimidate (cond.) | Might | 1 | uncommon | Apply 1 Exposed. Gain Might equal to the target's Exposed. Consume. | 13 | 11.2 | +16% | strong | 21 | 14.6 | +44% | 1 Exposed 3 + Might = target Exposed (~2) x5 |
| Break Guard (cond.) | Might | 1 | uncommon | Deal 8 damage. If the target is Exposed: Deal 8 damage. | 13.2 | 11.2 | +18% | strong | 18.2 | 14.6 | +25% | 8 + 8 x65% (target Exposed in a Might/Exposed deck) |
| Rising Fist | Might | 2 | uncommon | Deal 13 damage. Apply 1 Faltering. Apply 1 Exposed. | 19 | 21.3 | -11% | on budget | 28 | 27.7 | +1% | 13 + 1 Faltering + 1 Exposed. + raises three numbers (+47%) |
| Pile On (cond.) | Might | 0 | uncommon | Deal 4 (+2 per Exposed on the target) damage. | 7 | 6.7 | +4% | on budget | 10 | 8.7 | +14% | 4 + 2 per Exposed (~1.5 on the target) |
| Whirling Blade | Might | X | uncommon | Deal 5 damage X times to ALL enemies. | 22.5 | 21 | +7% | on budget | 30 | 27.3 | +10% | X=3: 5 AoE x3 = 6.5 + 1 (hits) a X; budget 7 a X |
| Mounting Fury | Might | 1 | uncommon | Deal 9 damage, plus all it has grown. Every copy of this card gains 5 damage for the rest of the fight. | 15 | 11.2 | +34% | strong | 18.6 | 14.6 | +28% | 9 + 5 x1.2 growth (guide rate; the reference card itself reads strong) |
| Hammer Fall (ref) | Might | 3 | uncommon | Deal 32 damage. | 32 | 31.4 | +2% | on budget | 35 | 40.8 | -14% | 32 |
| Plunder | Might | 1 | uncommon | Deal 6 damage. Draw cards until you draw a card that is not an Attack. | 13 | 11.2 | +16% | strong | 16 | 14.6 | +10% | 6 + draw until a non-Attack: ~2 cards (3 + 4) |
| Trampling Charge | Might | 3 | uncommon | Costs 1 less for each Attack played this turn. Deal 12 damage to ALL enemies. | 15.6 | 16.2 | -4% | on budget | 19.5 | 21.1 | -8% | 12 AoE x1.3; usually costs 1-2 (budget at 1.5) |
| Relentless Push (ref) | Might | 2 | uncommon | Deal 12 damage. Gain 1 Free Attack. | 18 | 21.3 | -15% | weak | 21 | 27.7 | -24% | 12 + Free Attack 6 |
| Berserker's Rage | Might | 0 | uncommon | This turn, whenever you play an Attack: Gain 3 Barrier. | 7.2 | 6.7 | +7% | on budget | 9.2 | 8.7 | +5% | ~2 attacks after it x3 Barrier |
| Charging Herd | Might | 2 (+: 1) | uncommon, Aura | At the end of your turn: Play a random Attack from your hand against a random enemy. | 21.6 | 28.5 | -24% | weak | 21.6 | 19.5 | +11% | an attack left in hand ~60% of turns, ~9 (free card and Mana) x4 |
| Juggler's Rhythm (cond.) | Might | 1 (+: 0) | uncommon, Aura | Whenever you play an Attack: If this is your third Attack this turn: Add a copy of that card to your hand. | 12 | 15 | -20% | weak | 12 | 11.7 | +3% | a third Attack ~50% of turns in a 0-cost-attack deck; the copy still costs Mana (~6) |
| Scent of Weakness (cond.) | Might | 1 (+: 0) | uncommon, Aura | Whenever you apply Exposed to an enemy: Draw 1 card. | 11 | 15 | -27% | weak | 11 | 11.7 | -6% | ~0.8 Exposed applications a turn x draw 3.5 |
| Warlord's Oath | Might | 3 (+: 2) | rare, Aura | At the start of your turn: Gain 2 Might. | 36 | 56 | -36% | weak | 36 | 49.4 | -27% | +2 Might a turn: ~6 stacks by turn 4, each worth less the later it comes. Boss fights are where it pays |
| Wildfire | Might | 1 | rare | Deal 8 (+2 per Attack played this turn) damage to ALL enemies. | 13 | 12.5 | +4% | on budget | 16.9 | 16.3 | +4% | 8 + 2 (one Attack before) AoE x1.3 |
| Double Down (ref) | Might | 1 | rare | Gain 1 Reverb. | 12 | 12.5 | -4% | on budget | 24 | 16.3 | +48% | Reverb ~12. + doubles it (2 Reverb) |
| Cruel Streak (cond.) | Might | 1 (+: 0) | rare, Aura | Gain 1 Cruelty. | 18 | 20 | -10% | on budget | 18 | 15.6 | +15% | +25% vs Exposed: ~70% of attack damage in an Exposed deck x ~20 a turn |
| Crippling Blow | Might | 3 | rare | Deal 15 damage. Apply 10 Sapped until the end of their next turn. | 30 | 35 | -14% | on budget | 36 | 45.5 | -21% | 15 + 10 Sapped (1.2 x 1.5 hits, capped at the hit: ~15) |
| Bloodfeast | Might | 1 | rare | Deal 10 damage. If this is fatal: Raise your max HP by 3 for good. Consume. | 13 | 12.5 | +4% | on budget | 16 | 16.3 | -2% | 10 + fatal: +3 max HP for good (~40% x ~7 run value) |
| Raised Hell (cond.) | Might | 2 (+: 1) | rare, Aura | Whenever you draw a card: Play it against a random enemy if it is a Strike card. | 47 | 38 | +24% | strong | 47 | 26 | +81% | ~1.8 Strike cards drawn a turn, each played free (~6.5) |
| Unforgiving Drill | Might | 1 (+: 0) | rare, Aura | At the start of your turn: Return a random Attack card from your discard pile to your hand. It is upgraded. | 22 | 20 | +10% | on budget | 22 | 15.6 | +41% | an Attack back from discard (3) + upgraded (~2.5) x4 |
| Stone Fury (cond.) | Might | 0 | rare | Turn every Attack in your hand into a Giant Rock. | 20 | 7.5 | +167% | broken | 22 | 9.8 | +126% | ~1.5 Attacks in hand become Giant Rocks (16 for 1): ~+10 each now, more on later cycles |
| Sacrificial Guard | Consume | 1 | common | Gain 7 Barrier. Consume 1 random card. | 9.4 | 10 | -6% | on budget | 13 | 13 | +0% | 8.4 + a random hand card consumed (lost card offset by Knight payoffs: +1) |
| Scorching Blow | Consume | 2 | common | Deal 17 damage. Consume 1 random card. | 18 | 19 | -5% | on budget | 21 | 24.7 | -15% | 17 + random consume (+1) |
| Searing Fist (cond.) | Consume | 1 | common | Deal 10 damage. Double the Exposed on the target (at most +3). Consume. | 13 | 10 | +30% | strong | 16 | 13 | +23% | 10 + Exposed doubled: ~1 extra stack expected (3). No Consume bonus in the Knight |
| Ram Home (ref) | Consume | 1 | common | Deal 9 damage. Put a random card from your discard pile on top of your draw pile. | 10.5 | 10 | +5% | on budget | 15 | 13 | +15% | 9 + a card on top 1.5 |
| Wild Gamble | Consume | 1 (+: 0) | common | Play the top card of your draw pile and consume it. | 8 | 10 | -20% | weak | 8 | 7.8 | +3% | the top card played free (~8), then consumed (neutral in the Knight) |
| Smoldering Blow (cond.) | Consume | 1 | uncommon | Deal 6 (+1 per consumed card) damage. | 10 | 11.2 | -11% | on budget | 13 | 14.6 | -11% | 6 + ~4 consumed mid-fight |
| Grim Focus | Consume | 0 | uncommon | Draw 3 cards. You cannot draw more cards this turn. | 10 | 6.7 | +49% | broken | 13 | 8.7 | +49% | draw 3 on its own 11, -1 for no more draws. Mana-limited, but a 0-cost |
| Numbing Rite (cond.) | Consume | 1 (+: 0) | uncommon, Aura | Whenever a card is consumed: Gain 3 Barrier. | 15.8 | 15 | +5% | on budget | 15.8 | 11.7 | +35% | ~1.1 consumes a turn x 3.6 |
| Borrowed Blade | Consume | 1 | uncommon | Add a random Attack card from your pool to your hand (it costs 0 the next time you play it). Consume. | 9 | 11.2 | -20% | weak | 18 | 14.6 | +24% | a 0-cost pool Attack ~9 (Consume required) |
| Bitter Breath | Consume | 1 | uncommon | Consume every card in your hand that is not an Attack. Gain Barrier equal to 5 times the cards consumed this way. | 13 | 11.2 | +16% | strong | 16 | 14.6 | +10% | ~2 non-Attacks in hand x5 Barrier 12, +1 for the consumes |
| War Drums | Consume | 0 | uncommon, Aura | Draw 2 cards. At the start of your turn: Consume the top card of your draw pile. | 11 | 9 | +22% | strong | 14.5 | 11.7 | +24% | draw 2 (7) + a top card consumed a turn (~+1 with payoffs) |
| Brace for Battle | Consume | 2 (+: 1) | uncommon | Gain Mana equal to the number of Attacks in your hand. No more Mana can be gained this turn. | 14.7 | 21.3 | -31% | weak | 14.7 | 14.6 | +1% | ~2.2 Attacks left in hand = ~2.2 Mana (for 2) |
| Ritual of Ash (cond.) | Consume | 1 (+: 0) | uncommon | If you have consumed a card this turn: Gain 3 Mana. Consume. | 11.4 | 11.2 | +2% | on budget | 11.4 | 8.7 | +30% | 3 Mana 17.5 x65% |
| Flailing Blows (cond.) | Consume | 1 | rare | Consume a random Attack in your hand. Deal 4 damage 2 times. Deal damage equal to the damage of the Attacks consumed this way. | 14 | 12.5 | +12% | on budget | 19 | 16.3 | +17% | 8 + 1 + ~7 (the consumed Attack) - 2 (the card lost) |
| Rite of Recall (cond.) | Consume | 2 (+: 1) | rare, Aura | Whenever a card is consumed: Draw 1 card. | 21 | 38 | -45% | dead | 21 | 26 | -19% | ~1.5 consumes a turn x draw 3.5 |
| Unholy Pact (cond.) | Consume | 3 (+: 2) | rare, Aura | Gain 1 Unbound. | 40 | 56 | -29% | weak | 40 | 49.4 | -19% | Skills free and consumed: ~2 Mana a turn for 3 turns, minus the Skills lost. An engine |
| Burn It All | Consume | 2 | rare | Deal damage equal to 7 times the number of cards in your hand. Consume your hand. Consume. | 24.5 | 23.8 | +3% | on budget | 35 | 30.9 | +13% | 7 x ~3.5 cards in hand |
| Forsake | Consume | 0 | rare | Lose 1 HP. Consume 1 card. Gain 1 Might. | 5.5 | 7.5 | -27% | weak | 10.5 | 9.8 | +8% | -1.5 + 1 Might 5 + a chosen consume +2 |
| Unravel | Consume | X | rare | Play the top X cards of your draw pile. | 24 | 23.4 | +3% | on budget | 32 | 30.4 | +5% | X=3: three top cards played free (~8 each); rare budget 7.8 a X |
| Fan the Flames | Consume | 1 | rare | Consume your hand. Add a random card from your pool to your hand for each card consumed this way. | 14 | 12.5 | +12% | on budget | 16 | 16.3 | -2% | ~4 hand cards for 4 random pool cards (+3.5 each over starter cards) |
| Howl of the Fallen | Consume | 3 | uncommon | At the start of your turn, if this is consumed, it is played for free and goes back. Deal 16 damage to ALL enemies. Consume. | 83 | 42 | +98% | broken | 98.8 | 54.6 | +81% | plays itself from the consumed pile every turn: 20.8 x4. Priced as an uncommon 3-cost Aura (1.5 x 28) |
| Ashen Reckoning (ref) | Consume | 0 | rare | Only playable with 3 or more cards consumed. Deal 17 damage to ALL enemies. | 22.1 | 22.5 | -2% | on budget | 26 | 29.3 | -11% | hard gate (3 consumed): 3x the 0-cost rare budget |
| Draw Blood (ref) | Blood | 0 | common | Lose 3 HP. Gain 2 Mana. Consume. | 9.5 | 9.5 | +0% | on budget | 11 | 12.4 | -11% | the guide's anchor for 0-cost Mana cards (14 - 4.5) |
| Blood Plate | Blood | 2 | common | Lose 2 HP. Gain 16 Barrier. | 16.2 | 19 | -15% | on budget | 21.3 | 24.7 | -14% | 19.2 - 3 |
| Breach (ref) | Blood | 1 | common | Lose 1 HP. Deal 9 damage to ALL enemies. | 10.2 | 10 | +2% | on budget | 14.1 | 13 | +8% | 11.7 AoE - 1.5 |
| Reckless Smite (ref) | Blood | 1 | uncommon | Lose 2 HP. Deal 15 damage. | 12 | 11.2 | +7% | on budget | 16.5 | 14.6 | +13% | 15 - 3 |
| Scar Over (cond.) | Blood | 1 (+: 0) | uncommon, Aura | Whenever you lose HP to your own cards or Hangover: Gain 1 Might. | 14 | 15 | -7% | on budget | 14 | 11.7 | +20% | ~3 Might over 4 turns in a Blood deck |
| Blood Fire (cond.) | Blood | 1 (+: 0) | uncommon, Aura | At the start of your turn: Lose 1 HP. Whenever you lose HP to your own cards or Hangover: Deal 6 damage to ALL enemies. | 47 | 15 | +213% | broken | 47 | 11.7 | +302% | its own 1 HP a turn sets it off: 7.8 - 1.5 every turn, plus ~0.7 more self-damage a turn x7.8 |
| Spiteful Jab (cond.) | Blood | 0 | uncommon | Deal 6 damage. If you have lost HP this turn: Deal 6 damage. | 9.6 | 6.7 | +43% | broken | 14.4 | 8.7 | +65% | 6 + 6 x60% (lost HP this turn, Blood deck) |
| Crimson Offering | Blood | 0 | rare | Lose 6 HP. Gain 2 Mana. Draw 3 cards. Consume. | 16 | 11.9 | +34% | strong | 20.5 | 15.5 | +32% | -9 + 2 Mana 14 + draw 3 11; against Draw Blood x rare |
| Bloodied Plate | Blood | 1 (+: 0) | rare, Aura | At the start of your turn: Lose 1 HP. Gain 8 Barrier. | 32.4 | 20 | +62% | broken | 32.4 | 15.6 | +108% | 9.6 - 1.5 a turn x4 (and it feeds Scar Over and Blood Fire) |
| Rending Fury (cond.) | Blood | 2 | rare | Deal 5 damage, 1 more time per time you lost HP this fight. | 33 | 23.8 | +39% | strong | 39 | 30.9 | +26% | ~5 HP losses by mid-fight (enemy hits count): 6 hits x5 + 3 (Might) |
| Rally | Blood | 2 | rare | Heal 10. Consume. | 15 | 23.8 | -37% | weak | 19.5 | 30.9 | -37% | heal 10 x1.5 |
| Dawn Smite (ref) | - | 1 | common | Deal 5 damage. Gain 5 Barrier. | 11 | 10 | +10% | on budget | 17.6 | 13 | +35% | 5 + 6. + raises both (+60%) |
| Hot Temper | - | 0 | common | Deal 6 damage. Add a copy of this card to your discard pile. | 8 | 6 | +33% | strong | 11 | 7.8 | +41% | 6 + a copy into the discard 2 |
| Pact of Embers | - | 1 | uncommon | Consume 1 card. Draw 2 cards. | 9 | 11.2 | -20% | weak | 13 | 14.6 | -11% | draw 2 (7) + a chosen consume (+2) |
| Inner Furnace (ref) | - | 2 (+: 1) | rare, Aura | At the start of your turn: Gain 1 Mana. | 28 | 38 | -26% | weak | 28 | 26 | +8% | +1 Mana a turn (guide: a little low for a rare) |
