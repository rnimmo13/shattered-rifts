# Assassin: hand-priced card pool (2026-10-29)

82 class cards (80 pool cards + Hobbling Jab and Duck and Weave), priced with the costing guide. Trait **Hidden Blades**: a Dagger
(0: 4, Consume) into the hand at the start of every turn. 70 HP. Starter: 5 Strike, 5 Defend, Hobbling Jab, Duck and Weave.

Assassin-specific rules used (the guide leaves these open since the rework was reverted):

- **Discard as a cost**: -2 in the starter and the Bleed path (§5), **0** in a Daggers or Sleight deck, which holds Premeditate cards and
  discard payoffs (Graveside Cut, Sleeve Drop, Steel Monsoon) about half the time.
- **Premeditate**: in the Sleight path, which discards on purpose, the card is priced as if its printed cost were 1 lower (§6). In the
  Daggers path (Glancing Knives, Cartwheel Cut) it is +1 for the occasional discard.
- A Dagger is 4 points plus Edge (§5, legacy but live again: the trait makes one every turn).

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
| **Overall (rubric)** | **D** | 43% on budget (35 of 82), below the C line; 4 broken and 8 dead. The Sleight path is clearly under, the Daggers path over. |
| Power (mean deviation) | **A: fair on average, but only on average** | mean +2%, median -2%, clipped mean -2%. Daggers +22%, Sleight -21%: the class average hides two paths pulling opposite ways. |
| Consistency (spread) | **D** | IQR 43 points (SD 52), the widest of the three classes graded here. |

| Verdict | Count |
|---|---|
| on budget | 35 |
| strong | 16 |
| broken | 4 (Bloodburst, Final Bow, Ghost Knives, Whetted Edge) |
| weak | 19 |
| dead | 8 (Blood Scent, Grand Scheme, Quick Reflexes, Cool Head, Sense the Blow, Nimble Routine, Recurring Dream, Side Slip) |

## Starter deck

| | Turn 1 | Turn 2 | Turn 3 | Guide baseline |
|---|---|---|---|---|
| Damage | ~14 | ~14 | ~14 | |
| Barrier | ~7.5 | ~7.5 | ~7.5 | |
| Points a turn | ~24 | ~24 | ~24 | 18 (a basic starter), 30 (a turn of commons) |

Worked by hand: 12 cards, 5 in hand, 3 Mana, plus the trait's Dagger every turn (4 damage for 0). About 1.4 Strikes and 1.4 Defends a
turn, Hobbling Jab in 42% of hands (0: 3 + 1 Faltering, +25% for a signature basic: its + doubles the Faltering, +67%), Duck and Weave
on budget (-5% with the discard at -2). The trait is worth ~4 points a turn, every turn, so the Assassin's starter is steady rather than
front-loaded: turns 1-3 ~41 damage and ~22 Barrier, on the lowest HP (70). The 12-card deck dilutes the two signature cards. Nothing in it
discards on purpose except Duck and Weave, so the Premeditate cards he drafts early need a second discard card to work.

## Build paths

| Path | Cards | On budget | Mean dev | Broken / strong / weak / dead | Holds up? |
|---|---|---|---|---|---|
| Daggers | 31 | 55% | **+22%** | 3 / 8 / 3 / 0 | **Over.** The trait feeds it from turn 1, so Dagger payoffs are always reachable: Ghost Knives (+153%: +9 on the trait's Dagger every turn) and Whetted Edge (+113% in a deck of ~2 Daggers a turn) are the problem. Knife Juggle, Rippling Cut, Final Flourish, Inked Blades, Steel Monsoon and Into the Shadows are strong. Final Bow is broken on paper but gated. Spare Blades (-30%) and Wide Arc (-32%, nothing against a lone boss) are the weak ones. |
| Bleed | 16 | 56% | +8% | 1 / 2 / 3 / 1 | **Works.** The guide's own Bleed rate fits Open Vein, Barbed Stab, Viper's Kiss and Garrote. Bloodburst (+260%: 9 Bleed to every enemy, ticked at once, for 1) is the single biggest outlier in the three classes. Blood Scent (Tracking, -68%) is dead: the class applies Faltering too rarely. Blood Mist and Serrated Edges are weak. Its upgrades are big: Open Vein+, Viper's Kiss+, Blood Mist+ and Serrated Edges+ gain 87-106% because Bleed's value grows with the square of the stack. |
| Sleight | 33 | **24%** | **-21%** | 0 / 5 / 13 / 7 | **Clearly under.** Draw and Barrier cards are fine (Backspring, Flick Knife, Nimble Deal, Smoke Veil, Sweep the Leg, Graveside Cut), but the path's own identity cards read low: the 3-cost Premeditate cards are dead even at the discount (Quick Reflexes, Cool Head -67%), Slip the Blow -28%, and the payoff rares (Grand Scheme -68%, Slow Murder -37%, Recurring Dream -43%, Nimble Routine -50%, Patient Hands -30%, Stilled Time -34%) are well under. It functions as a support package for the other two paths more than as a way to win. |

**Against bosses.** Mixed. Bleed is the best boss plan in the three classes: it ignores Barrier and a long fight lets every tick land
(Viper's Kiss, Reopen the Wound, Bloodburst, Weeping Cuts). Daggers scale fine on one target (Edge, Honed, Final Flourish, Into the
Shadows' Empowered turn), though Wide Arc and Fanned are worth nothing against a lone boss. The weak side is Barrier against a
front-loaded big hit: the Sleight Barrier cards are small (Turn Aside 4, Roll Away 4 + 4, Sense the Blow), he has the lowest HP, and his
best answers (Smoke Veil's Blur, Sweep the Leg's Faltering, Chilling Shriek's Sapped, Sapping Wound) are one-offs.

## Biggest outliers and suggested fixes (suggestions only, nothing applied)

| Card | Dev | Why | Suggested fix |
|---|---|---|---|
| Bloodburst (1, rare) | +260% | 9 Bleed to ALL, then every enemy's Bleed ticks at once: ~32 an enemy for 1 Mana. Its + (12 Bleed) is worse still. | Apply 4 Bleed to ALL, then tick (~-12%); or keep 9 on one target only. |
| Final Bow (0, rare) | +247% | 60 to ALL behind the "draw pile empty" gate: 10x a 0-cost rare's budget, past the guide's 2-3x for a hard gate. In a draw deck the gate is met most fights, and the card is in hand when it is. | 25-30 to ALL; it stays the best finisher in the pool. |
| Ghost Knives (1, unc. Aura) | +153% | Honed 9: the first Dagger each turn +9, and the trait makes that Dagger every turn. ~36 over four turns against 15. | Honed 4 (~+20%), or rare. |
| Whetted Edge (1, unc. Aura) | +113% | Edge 4 on ~2 Daggers a turn. Fair in the starter (1 a turn: +7%), broken in the Dagger deck it is for. | Edge 2 (its + 3). |
| Quick Reflexes / Cool Head (3, unc.) | -67% | Premeditate cards at 3: draw 2 or +1 Mana, priced at 2 Mana. Only playable as discard fodder, and the starter has one discard card. | Cost 2, and Quick Reflexes draws 3, Cool Head gives 2 Mana. |
| Blood Scent (2, rare Aura) | -68% | Tracking (+50% vs Faltering) needs Faltering, which few of his cards apply, and only lifts attacks. | Cost 1 and count Bleeding enemies too. |
| Grand Scheme (2, rare Aura) | -68% | Planner makes played Skills Premeditate for the fight; only pays with heavy discarding. | Cost 1 with Opening hand, or fold it into a Skill. |
| Sense the Blow (0, common) | -50% | 2 Bracing for the turn: ~3 Barrier. | 3 Bracing and draw 1. |
| Nimble Routine (1, rare Aura) / Side Slip (0, unc.) | -50% / -40% | A draw-and-random-discard a turn is ~2.5 a turn; +1 Mana next turn alone is 4. | Nimble Routine: draw 2, discard 1 of your choice. Side Slip: also draw 1 next turn. |
| Recurring Dream (3, rare) | -43% | Three copies next turn still cost Mana; the gain over a normal turn is small. | Cost 2 (the + is already that) and the copies cost 0. |

**Upgrades** (mean +13% against the +30% norm). Too big: the Bleed upgrades (+87-106% gain), Hobbling Jab+ (+67%), and every
Sleight card whose + doubles a small number (Shuffle Up+, Side Slip+, Cool Head+, Double Trick+, Turn Aside+, Sense the Blow+: +67-100%);
those mostly repair weak base cards, so the + card lands near budget. Nine cards upgrade by a cost cut (Into the Shadows+ to 0 reads +64%
against a normal + budget). Fleet Fingers+ (Opening hand) gains only 13%.

## Full table

| Card | Build path | Cost | Rarity | Text | Price | Budget | Dev % | Verdict | Upg price | Upg budget | Upg dev % | How it was priced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Strike | starter basic | 1 | basic | Deal 6 damage. | 6 | 6 | +0% | on budget | 9 | 7.8 | +15% | 6 |
| Defend | starter basic | 1 | basic | Gain 5 Barrier. | 6 | 6 | +0% | on budget | 9.6 | 7.8 | +23% | 5 Barrier |
| Hobbling Jab | - | 0 | basic | Deal 3 damage. Apply 1 Faltering. | 6 | 4.8 | +25% | strong | 10 | 6.2 | +60% | 3 + 1 Faltering. + doubles the Faltering (+67%) |
| Duck and Weave | - | 1 | basic | Gain 8 Barrier. Discard 1 card. | 7.6 | 8 | -5% | on budget | 11.2 | 10.4 | +8% | 9.6 - 2 (discard, starter deck) |
| Knife Juggle | Daggers | 1 | common | Add 3 Daggers to your hand. Consume. | 12 | 10 | +20% | strong | 16 | 13 | +23% | 3 Daggers x4 (Consume required) |
| Shroud and Shank | Daggers | 1 | common | Gain 6 Barrier. Add a Dagger to your hand. | 11.2 | 10 | +12% | on budget | 15.2 | 13 | +17% | 7.2 + a Dagger |
| Feint Strike | Daggers | 1 | common | Deal 3 damage. Add 2 Daggers to your hand. | 11 | 10 | +10% | on budget | 14 | 13 | +8% | 3 + 2 Daggers |
| Blade Flurry | Daggers | 1 | common | Deal 4 damage 2 times to ALL enemies. | 10.4 | 10 | +4% | on budget | 15.6 | 13 | +20% | 8 AoE x1.3 |
| Quick Slash (ref) | Daggers | 0 | common | Deal 6 damage. | 6 | 6 | +0% | on budget | 9 | 7.8 | +15% | 6 |
| Dirty Hit (ref) | Daggers | 1 | common | Deal 8 damage. Apply 1 Faltering. | 11 | 10 | +10% | on budget | 16 | 13 | +23% | 8 + 1 Faltering |
| Stalker's Lunge (ref) | Daggers | 2 | common | Deal 15 damage. Next turn, draw 2 extra cards. | 22 | 19 | +16% | strong | 27 | 24.7 | +9% | 15 + 2 cards next turn (7) |
| Glancing Knives | Daggers | 2 | common | Premeditate. Deal 3 damage to a random enemy 4 times. | 11.8 | 19 | -38% | weak | 14.5 | 24.7 | -41% | 12 x0.9 random + Premeditate +1 (a Daggers deck rarely discards it) |
| Cartwheel Cut (ref) | Daggers | 1 | common | Premeditate. Deal 7 damage to ALL enemies. | 10.1 | 10 | +1% | on budget | 12.7 | 13 | -2% | 9.1 AoE + Premeditate +1 |
| Whetted Edge (cond.) | Daggers | 1 | uncommon, Aura | Gain 4 Edge: your Daggers deal 4 more damage for the rest of the fight. | 32 | 15 | +113% | broken | 48 | 19.5 | +146% | +4 a Dagger x ~2 Daggers a turn (trait + makers) x4. Starter only: 16 |
| Knife in the Back (ref) | Daggers | 0 | uncommon | Deal 11 damage. Consume. Opening hand. | 11 | 11.2 | -2% | on budget | 15 | 14.6 | +3% | guide: a 0-cost + Consume + Opening hand carries a 1-cost budget |
| Sleeve Drop | Daggers | 0 | uncommon | Discard 2 cards. Add 2 Daggers to your hand. | 8 | 6.7 | +19% | strong | 12 | 8.7 | +37% | 2 Daggers; the 2 discards are 0 in a deck with Premeditate cards |
| Bottomless Sleeves (ref) | Daggers | 1 | uncommon, Aura | At the start of your turn: Add a Dagger to your hand. | 16 | 15 | +7% | on budget | 19.5 | 19.5 | +0% | a Dagger a turn x4 |
| Ghost Knives | Daggers | 1 | uncommon, Aura | Gain 9 Honed. | 38 | 15 | +153% | broken | 50 | 19.5 | +156% | Honed 9: the first Dagger each turn +9, and the trait makes one every turn |
| Spare Blades | Daggers | 2 | uncommon | Add 3 Daggers to your hand. This card costs 1 less for the rest of the fight. | 15 | 21.3 | -30% | weak | 19 | 27.7 | -31% | 3 Daggers 12 + costs 1 less for the fight 3 |
| Rippling Cut | Daggers | 1 | uncommon | Deal 10 damage to ALL enemies. Repeat this for each enemy it kills. | 15 | 11.2 | +34% | strong | 18.9 | 14.6 | +30% | 10 AoE x1.3 + a repeat on a kill (~2) |
| Darting Strike (ref) | Daggers | 2 | uncommon | Gain 10 Barrier. Deal 10 damage. | 22 | 21.3 | +3% | on budget | 28.6 | 27.7 | +3% | 12 + 10 |
| Final Flourish (cond.) | Daggers | 1 | uncommon | Deal damage equal to 6 times the Attacks played this turn. | 15 | 11.2 | +34% | strong | 20 | 14.6 | +37% | 6 x ~2.5 Attacks this turn (with itself) |
| Run Through (ref) | Daggers | X | uncommon | Deal 8 damage X times. | 24 | 21 | +14% | on budget | 32 | 27.3 | +17% | X=3: 8 a X; budget 7 a X |
| Spring Attack | Daggers | 2 | uncommon | Deal 14 damage. Gain 1 Free Skill. | 20 | 21.3 | -6% | on budget | 26 | 27.7 | -6% | 14 + Free Skill 6 |
| Nerve Strike | Daggers | 3 | uncommon | Costs 1 less for each Skill played this turn. Deal 15 damage. | 15 | 16.2 | -8% | on budget | 19 | 21.1 | -10% | 15; usually costs 1-2 |
| Clean Cut (cond.) | Daggers | 0 | uncommon | Deal 13 (-2 per card in hand) damage. | 7 | 6.7 | +4% | on budget | 10 | 8.7 | +14% | 13 - 2 x 3 cards left in hand |
| Killing Stroke (ref) | Daggers | 0 | rare | Deal 10 damage. Apply 1 Exposed. Consume. Opening hand. | 13 | 12.5 | +4% | on budget | 19 | 16.3 | +17% | 10 + 1 Exposed; 0-cost + Consume + Opening = a 1-cost budget |
| Inked Blades | Daggers | 1 | rare | Add 2 Inked Daggers to your hand. | 16 | 12.5 | +28% | strong | 24 | 16.3 | +48% | 2 Inked Daggers (5 + 1 Faltering = 8 each) |
| Wide Arc | Daggers | 2 | rare, Aura | Gain 1 Fanned. Add 4 Daggers to your hand. | 26 | 38 | -32% | weak | 30 | 49.4 | -39% | 4 Daggers 16 + Fanned (~2 Daggers a turn x4 x0.3 extra AoE = ~10). 0 against a boss alone |
| Recall the Blades (cond.) | Daggers | 2 | rare | Play every Dagger in your consumed pile against the target; they go back there. | 26 | 23.8 | +9% | on budget | 38 | 30.9 | +23% | ~6 Daggers in the consumed pile mid-fight x4 (+ Edge); repeatable and grows |
| Serpent's Coil | Daggers | 3 | rare, Aura | Whenever you play a card: Deal 4 damage to a random enemy. | 58 | 56 | +4% | on budget | 87 | 72.8 | +20% | ~4 cards a turn x 3.6 x4 |
| Into the Shadows (cond.) | Daggers | 1 (+: 0) | rare | Discard your hand. Gain 1 Poised. | 16 | 12.5 | +28% | strong | 16 | 9.8 | +64% | Empowered next turn: ~16 more attack damage; the hand discard costs little played last |
| Steel Monsoon (cond.) | Daggers | 1 | rare | Discard your hand. Add Daggers to your hand equal to the cards discarded this way. | 16 | 12.5 | +28% | strong | 24 | 16.3 | +48% | ~4 cards discarded = 4 Daggers |
| Marked for Death (ref) | Daggers | 1 | rare | Deal 10 damage. If this is fatal: Gain an extra card reward after this fight. Consume. | 14 | 15.6 | -10% | on budget | 19 | 20.3 | -6% | 10 + fatal: an extra card reward (~+4) |
| Final Bow (cond.) (ref) | Daggers | 0 | rare | Only playable while your draw pile is empty. Deal 60 damage to ALL enemies. | 78 | 22.5 | +247% | broken | 97.5 | 29.3 | +233% | hard gate (empty draw pile): 3x the 0-cost rare budget. 60 AoE is 10x the budget, past the guide's 2-3x |
| Open Vein (ref) | Bleed | 1 | common | Apply 5 Bleed. | 9.8 | 10 | -2% | on budget | 18.2 | 13 | +40% | 5 Bleed: 15 ticks x0.65. + is +87% (7 Bleed = 28 ticks) |
| Barbed Stab (ref) | Bleed | 1 | common | Deal 6 damage. Apply 3 Bleed. | 9.9 | 10 | -1% | on budget | 14.5 | 13 | +12% | 6 + 3 Bleed |
| Viper's Kiss (ref) | Bleed | 2 | common | Apply 7 Bleed. Hold. | 19.2 | 19 | +1% | on budget | 36.8 | 24.7 | +49% | 7 Bleed 18.2 + Hold. + is +91% (10 Bleed = 55 ticks) |
| Chilling Shriek | Bleed | 1 | common | Apply 6 Sapped to ALL enemies until the end of their next turn. Consume. | 10.9 | 12.5 | -13% | on budget | 14.5 | 16.3 | -11% | 6 Sapped x1.2 x ~1.2 hits x70% attacking x ~1.8 enemies |
| Thin the Blood (cond.) | Bleed | 1 | uncommon, Aura | Gain 1 Virulent. | 16 | 15 | +7% | on budget | 24 | 19.5 | +23% | Virulent speeds up Bleed rather than adding to it: ~4 a turn in a Bleed deck |
| Tossed Vials | Bleed | 2 | uncommon | Apply 3 Bleed to a random enemy 3 times. | 18.5 | 21.3 | -13% | on budget | 26 | 27.7 | -6% | 3 x 3 Bleed random: stacks on one enemy (29) 40% of fights, spreads otherwise; x0.9 |
| Reopen the Wound (cond.) | Bleed | 1 | uncommon | If the target has Bleed: Apply 9 Bleed. | 12.3 | 11.2 | +10% | on budget | 16.4 | 14.6 | +13% | 9 Bleed onto a stack: 0.65 x9 x ~3 turns x70% (the target bleeds) |
| Blood Mist | Bleed | 2 | uncommon | Apply 4 Bleed to ALL enemies. Apply 1 Faltering to ALL enemies. | 13.6 | 21.3 | -36% | weak | 28 | 27.7 | +1% | 4 Bleed to all (6.5 x1.4) + 1 Faltering to all 4.5 |
| Red Mirage (cond.) | Bleed | 1 | uncommon | Gain Barrier equal to the Bleed on ALL enemies. Consume. | 9.6 | 14 | -31% | weak | 12 | 18.2 | -34% | Barrier = all Bleed (~8 in a Bleed deck). + loses Consume (+25%) |
| Weeping Cuts | Bleed | 1 | uncommon, Aura | At the start of your turn: Apply 2 Bleed to ALL enemies. | 18 | 15 | +20% | strong | 27 | 19.5 | +38% | 2 Bleed to all a turn onto growing stacks: ~4.5 a turn |
| Garrote (ref) | Bleed | 1 | uncommon | Deal 8 damage. Apply 2 Strangled until the end of your turn. | 14 | 11.2 | +25% | strong | 19 | 14.6 | +30% | 8 + 2 Strangled x ~3 cards (guide: 14) |
| Hemorrhage (cond.) | Bleed | 1 | rare | This turn, whenever you draw a card: Apply 2 Bleed to ALL enemies. | 13.7 | 12.5 | +9% | on budget | 20 | 16.3 | +23% | ~2.5 draws after it: 5 Bleed to all |
| Serrated Edges (cond.) | Bleed | 2 | rare, Aura | Whenever an Attack of yours deals damage to an enemy’s HP: Apply 1 Bleed. | 26 | 38 | -32% | weak | 52 | 49.4 | +5% | ~4 hits through a turn (Daggers, multi-hit) x 1 Bleed onto stacks |
| Bloodburst | Bleed | 1 | rare | Apply 9 Bleed to ALL enemies. The Bleed on ALL enemies deals its damage now. | 45 | 12.5 | +260% | broken | 77 | 16.3 | +374% | 9 Bleed to all, then a tick: 9 now + 36 ticks x0.65 = 32 an enemy, x1.4 for all |
| Sapping Wound | Bleed | X | rare | Apply Sapped equal to the Mana spent. Apply Faltering equal to the Mana spent. Consume. | 25 | 29.3 | -15% | on budget | 33 | 38 | -13% | X=3: 3 Sapped (no end given: rest of fight ~16) + 3 Faltering 9 |
| Blood Scent (cond.) | Bleed | 2 (+: 1) | rare, Aura | Gain 1 Tracking. | 12 | 38 | -68% | dead | 12 | 26 | -54% | Tracking +50% vs Faltering: ~40% of ~15 attack damage a turn |
| Sense the Blow | Sleight | 0 | common | Gain 2 Bracing until the end of your turn. | 3 | 6 | -50% | dead | 5 | 7.8 | -36% | 2 Bracing this turn x ~1.5 Barrier cards after it |
| Backspring | Sleight | 1 | common | Gain 5 Barrier. Draw 2 cards. | 13 | 10 | +30% | strong | 16.6 | 13 | +28% | 6 + draw 2 (3 + 4) |
| Flick Knife | Sleight | 1 | common | Deal 9 damage. Draw 1 card. Discard 1 card. | 12 | 10 | +20% | strong | 15 | 13 | +15% | 9 + draw 1; discard 0 in a Sleight deck |
| Turn Aside (ref) | Sleight | 0 | common | Gain 4 Barrier. | 4.8 | 6 | -20% | weak | 8.4 | 7.8 | +8% | 4 Barrier x1.2 (the guide lists it as a 0-cost reference at 6) |
| Roll Away (ref) | Sleight | 1 | common | Gain 4 Barrier. Gain 4 Guarded. | 8.8 | 10 | -12% | on budget | 13.2 | 13 | +2% | 4.8 + 4 Guarded |
| Shuffle Up | Sleight | 0 | common | Draw 1 card. Discard 1 card. | 4 | 6 | -33% | weak | 8 | 7.8 | +3% | draw 1 (4) + discard 0 |
| Slip the Blow | Sleight | 2 | common | Premeditate. Gain 6 Barrier. | 7.2 | 10 | -28% | weak | 10.8 | 13 | -17% | Premeditate in a discard deck: priced at 1 Mana |
| Nimble Deal | Sleight | 1 | uncommon | Draw 3 cards. Discard 1 card. | 11 | 11.2 | -2% | on budget | 15 | 14.6 | +3% | draw 3 11, discard 0 |
| Smoke Veil (ref) | Sleight | 1 | uncommon | Gain 5 Barrier. Gain 1 Blur. | 10.5 | 11.2 | -6% | on budget | 14.1 | 14.6 | -3% | 6 + Blur ~4.5 |
| All or Nothing | Sleight | 0 | uncommon | Discard your hand. Draw cards equal to the cards discarded this way. Consume. | 6 | 8.4 | -29% | weak | 8 | 10.9 | -27% | ~4 cards cycled (+1 each) + a Premeditate card back (+2) |
| Bolt Hole | Sleight | 0 | uncommon | Draw 1 card. If you drew a Skill: Gain 3 Barrier. Consume. | 5.8 | 8.4 | -31% | weak | 6.7 | 10.9 | -39% | draw 1 (4) + 3 Barrier x50% |
| Practiced Hands | Sleight | 1 | uncommon | Draw 2 cards. They Hold this turn. | 9 | 11.2 | -20% | weak | 13 | 14.6 | -11% | draw 2 (7) + they Hold (+1 each) |
| Lay Bare | Sleight | 0 | uncommon | Remove all Barrier and Steadfast from the target. Apply 2 Exposed. Consume. | 9 | 8.4 | +7% | on budget | 12 | 10.9 | +10% | strip Barrier ~3 + 2 Exposed 6 |
| Needle Rain (cond.) | Sleight | 1 | uncommon | Deal 5 damage for each Skill in your hand. | 8.8 | 11.2 | -22% | weak | 12.3 | 14.6 | -16% | 5 x ~1.75 Skills left in hand |
| Fleet Step (ref) | Sleight | 1 | uncommon | Gain 2 Bracing for the rest of the fight. | 8 | 11.2 | -29% | weak | 12 | 14.6 | -18% | 2 Bracing x4 (rest of fight) |
| Palm Switch | Sleight | 1 | uncommon | Gain 7 Barrier. A random Skill in your hand gains Premeditate this turn. | 10.4 | 11.2 | -7% | on budget | 14 | 14.6 | -4% | 8.4 + a Skill gains Premeditate (~2) |
| Sweep the Leg (ref) | Sleight | 2 | uncommon | Apply 2 Faltering. Gain 11 Barrier. | 19.2 | 21.3 | -10% | on budget | 25.8 | 27.7 | -7% | 13.2 + 2 Faltering |
| Graveside Cut (cond.) | Sleight | 1 | uncommon | Deal 9 (+4 per card discarded this turn) damage. | 13 | 11.2 | +16% | strong | 16 | 14.6 | +10% | 9 + 4 x ~1 discard this turn |
| Quick Reflexes | Sleight | 3 | uncommon | Premeditate. Draw 2 cards. | 7 | 21.3 | -67% | dead | 11 | 27.7 | -60% | draw 2; Premeditate priced at 2 Mana. Only discard fodder |
| Side Slip (ref) | Sleight | 0 | uncommon | Next turn, gain 1 extra Mana. | 4 | 6.7 | -40% | dead | 8 | 8.7 | -8% | +1 Mana next turn 4 (guide reference at 0) |
| Fleet Fingers (cond.) | Sleight | 2 | uncommon, Aura | Whenever you draw a card during your turn: Deal 2 damage to ALL enemies. | 26 | 28.5 | -9% | on budget | 29.5 | 37.1 | -20% | ~2.5 mid-turn draws x 2.6 x4 |
| Cool Head | Sleight | 3 | uncommon | Premeditate. Gain 1 Mana. | 7 | 21.3 | -67% | dead | 14 | 27.7 | -49% | +1 Mana; Premeditate priced at 2 Mana |
| Razor Skin | Sleight | 3 | rare | Premeditate. Gain 1 Bracing. Gain 4 Thorns. These last the rest of the fight. | 28 | 23.8 | +18% | strong | 36 | 30.9 | +17% | 4 Thorns for the fight (~1.5 hits x4 turns = 24) + 1 Bracing 4; Premeditate at 2 Mana |
| Rush of Blood | Sleight | 0 | rare | Gain 1 Mana. Draw 2 cards. Consume. | 14 | 11.9 | +18% | strong | 17.5 | 15.5 | +13% | +1 Mana 7 + draw 2 7; against Draw Blood x rare |
| Shadow Echo | Sleight | 1 | rare, Aura | Whenever you play a card: Gain 1 Barrier. | 21.6 | 20 | +8% | on budget | 25.1 | 26 | -3% | ~4.5 cards a turn x1.2 x4 |
| Stilled Time | Sleight | 3 (+: 2) | rare | You cannot draw more cards this turn. Every card in your hand costs 0 this turn. | 23 | 35 | -34% | weak | 23 | 30.9 | -26% | ~4 cards free: ~+4.8 Mana (7, 7, then 3.5s), -1 for no draws, for 3 |
| Double Trick | Sleight | 1 | rare | Gain 1 Mirrored. | 9 | 12.5 | -28% | weak | 18 | 16.3 | +11% | next Skill twice: ~9 |
| Grand Scheme (cond.) | Sleight | 2 (+: 1) | rare, Aura | Gain 1 Planner. | 12 | 38 | -68% | dead | 12 | 26 | -54% | Planner: played Skills keep Premeditate; ~3 a turn when the deck discards |
| Slow Murder (cond.) | Sleight | 3 (+: 2) | rare | Deal 1 (+1 per card drawn this fight) damage. | 22 | 35 | -37% | weak | 22 | 30.9 | -29% | 1 + ~21 cards drawn by turn 3 in a draw deck |
| Recurring Dream | Sleight | 3 (+: 2) | rare | Choose a card in your hand. Next turn, add 3 copies of it to your hand. Consume. | 20 | 35 | -43% | dead | 20 | 30.9 | -35% | 3 copies of a hand card next turn (~+6 over a normal turn plus 3 cards). Consume required |
| Mantle of Night (cond.) | Sleight | 1 (+: 0) | rare | Gain 1 Meld until the end of your turn. | 9.6 | 12.5 | -23% | weak | 9.6 | 9.8 | -2% | Meld: ~8 Barrier gained after it, doubled |
| Nimble Routine | Sleight | 1 (+: 0) | rare, Aura | At the start of your turn: Draw 1 card. Discard 1 random card. | 10 | 20 | -50% | dead | 10 | 15.6 | -36% | draw 1 (3) and a random discard (-0.5) a turn |
| Patient Hands | Sleight | 1 (+: 0) | rare, Aura | At the end of your turn: Gain 1 Holdfast. | 14 | 20 | -30% | weak | 14 | 15.6 | -10% | Holdfast a turn: ~3.5 a turn in held cards |
