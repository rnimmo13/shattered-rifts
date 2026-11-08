# Rogue cost pass: proposal (2026-11-08, not built)

Status: **approved and built locally (DECISIONS #692), not released.** Only the trait's one Dagger changes with the Ascendancy
(other Dagger-making cards still make Daggers). One change from the chart below: a free card that draws must be consumed (the loop
rule), so Side Slip gives Defer and 3 Barrier (5 upgraded), Sleeve Drop+ gives 2 Barrier, Double Trick+ gives 3 Barrier, and Shuffle
Up is consumed.

Prices follow [docs/14_CARD_COSTING.md](14_CARD_COSTING.md): **Rares in A** (125-160% of budget), **most Uncommons in B** (90-124%),
**every upgrade about +30%**. A Dagger deck is priced at **about 6 Daggers a turn** (trait 1, Bottomless Sleeves 1, Pocket Blades,
Inked Blades and Feint Strike about 2 each, Knife Juggle 3, Bladedancer +1). The rule that keeps Daggers (0 Mana) out of the other
builds' payoffs is **"costs 1 or more"**.

Why: Daggers are the strongest Rogue build because the trait is a Dagger and the cards that pay off per Dagger (Whetted Edge, Ghost
Knives, Serpent's Coil, Final Flourish, Shadow Echo, Bladedancer's ramp, Recall) multiply with every free 0-Mana Attack, while the
Bleed and Sleight Rares sit at C/D and Serrated Edges (Bleed per hit) itself feeds on Daggers.

## 1. Trait and Ascendancies

| What | Now | Proposed |
|---|---|---|
| Hidden Blades (trait) | At the start of your turn, add a Dagger to your hand. | Same until you ascend; then this one card follows the Ascendancy. |
| Bladedancer | +1 Dagger a turn; each Dagger +10% per Dagger before it this turn (max +50%) | Unchanged: the trait still gives a **Dagger**. |
| Bloodletter | Bleed ticks one more time each turn | Trait gives a **Barbed Dagger**: 0 Mana Attack, 1 damage, apply 3 Bleed, Consume. |
| Assassin | Skills prepare +15% for the next Attack (max 60%); +20% vs enemies at half HP | Trait gives a **Shadow Feint**: 0 Mana Skill, gain 3 Barrier, Consume. New wording: "Every Skill you play adds 15% to your next Attack (up to 60%). That Attack uses all of it, even a Dagger, and it carries over between turns. Your Attacks deal 20% more to an enemy at half HP or less." |

## 2. Dagger cards

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Whetted Edge | Uncommon (Aura) | 1 Mana: Daggers deal 4 more (S) | 2 Mana: your first 4 Daggers each turn deal 2 more | costs 1 | B 112% | ~+30% |
| Ghost Knives | Uncommon (Aura) | 1 Mana: Daggers Hold; first Dagger each turn +9 (S) | 2 Mana, first Dagger +7, Daggers Hold | +9 | B 112% | +25% |
| Final Flourish | Uncommon | 1 Mana: 6 per Attack played this turn (S with Daggers) | 6, +6 per Attack costing 1 or more played this turn | 8, +8 | B 107% | +33% |
| Knife in the Back | Uncommon | 0: 11, Opening hand, Consume (A) | 9 | 13 | B 112% | +32% |
| Rippling Cut | Uncommon | 1: 10 to all, repeats on a kill (A) | 8 to all | 10 | B 116% | +25% |
| Clean Cut | Uncommon | 0: 13, -2 per other card in hand (A) | 11, -2 per other card | 13 | B 119% | +25% |
| Sleeve Drop | Uncommon | 0: discard 2, 2 Daggers; upgraded Daggers (+67%) | unchanged | discard 2, 2 Daggers, draw 1 | B | +40% (nearest) |
| Spare Blades | Uncommon | 2: 3 Daggers, 1 cheaper each play (C 70%) | 5 Daggers | costs 1 | B 108% | ~+39% |
| Serpent's Coil | Rare (Aura) | 3: 4 to a random enemy per card played (S with Daggers) | 5 damage, first 5 cards each turn | Opening hand | A ~129% (160% in a Dagger deck) | +25% |
| Shadow Echo | Rare (Aura) | 1: 1 Barrier per card played, at most 15 a turn | Gain 2 Barrier whenever you play a card costing 1 or more | Opening hand | A ~144% | +25% |
| Wide Arc | Rare (Aura) | 2: Daggers hit ALL; add 2 Daggers (D 53%) | Opening hand, Daggers hit ALL, add 3 Daggers | costs 1 | A ~126% | ~+30% |
| Steel Monsoon | Rare | 1: discard hand, a Dagger each (C 72%) | a Dagger per card discarded plus 1, then draw 1 | plus 2 Daggers | A ~128% | +25% |
| Inked Blades | Rare | 1: 2 Inked Daggers (A), automatic upgrade | unchanged | 2 Inked Daggers and a Dagger | A 128% | +25% |

## 3. Bleed cards

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Serrated Edges | Rare (Aura) | 2: whenever you hit, apply 1 Bleed (C; every Dagger counts) | **approved:** 1 Mana: whenever you play an Attack costing 1 or more, apply 2 Bleed to its target (a random enemy if none) | Opening hand | A ~130% | +25% |
| Red Tide | Rare | 1: this turn 2 Bleed to all per card drawn (C 80%) | draw 1, then 4 Bleed per card drawn this turn (as built) | 5 Bleed | A ~152% | +25% |
| Blood Scent | Rare (Aura) | 2: Attacks +50% vs Faltering enemies (D 63%) | same, plus at the start of your turn the most-bled enemy gains 1 Faltering | costs 1 | A ~125% | ~+30% |
| Sapping Wound | Rare | X: X Sapped (fight), X Faltering, Consume (B 96%) | also 2 x X Bleed | X+1 | A ~149% | +33% |
| Blood Mist | Uncommon | 2: 4 Bleed + 1 Faltering to all (D 61%); upgraded +105% | 1 Mana, 4 Bleed + 1 Faltering to all | 5 Bleed, 1 Faltering | B 116% | +32% |
| Thin the Blood | Uncommon (Aura) | 1: Bleed ticks once more (A); automatic upgrade | unchanged, kept A on purpose (Bleed engine) | Opening hand | A 133% | +25% |
| Reopen the Wound | Uncommon | 1: +9 Bleed on a bleeding target (A) | unchanged, kept A on purpose | 12 | A 126% | +33% |
| Viper's Kiss | Common | 2: 7 Bleed, Hold; upgraded 10 (+86%) | unchanged | 8 Bleed | B 101% | +27% |
| Barbed Stab | Common | 1: 6 + 3 Bleed; upgraded 8 + 4 (+46%) | unchanged | 6 + 4 | B 99% | +26% |
| Weeping Cuts | Uncommon (Aura) | 1: 2 Bleed to all each turn; upgraded 3 (+50%) | unchanged | Opening hand | B 113% | +25% |

## 4. Sleight cards

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Grand Scheme | Rare (Aura) | 2: Skills gain Premeditate (D 53%) | 1 Mana, Opening hand | costs 0 | A ~125% | ~+30% |
| Nimble Routine | Rare (Aura) | 1: each turn draw 1, discard 1 at random (D 60%) | each turn draw 2, discard 1 at random | Opening hand | A ~140% | +25% |
| Patient Hands | Rare (Aura) | 1: whole hand Holds every turn (C 80%) | same, plus draw 1 more each turn | Opening hand | A ~140% | +25% |
| Stilled Time | Rare | 3: no draws this turn; hand costs 0 (D 69%) | 2 Mana: draw 2, then hand costs 0 and no more draws this turn | costs 1 | A ~143% | +26% |
| Razor Skin | Rare (Aura) | 3, Premeditate: 1 Bracing, 4 Thorns (D 50%) | 2 Mana, 1 Bracing, 6 Thorns | 8 Thorns | A ~138% | +30% |
| Double Trick | Rare | 1: next Skill played twice (C 88%) | 0 Mana | also draw 1 | A ~147% | +27% |
| Recurring Dream | Rare | 3: 3 copies of a chosen card next turn, Consume (B) | 2 Mana | 4 copies | A ~135% | +33% |
| Mantle of Night | Rare | 1: Barrier gained this turn doubled; upgraded costs 0 (+60%) | also draw 1 | draw 2 | A ~139% | +23% |
| Slow Murder | Rare | 2: 1 + 1 per card drawn this fight (B 101%) | 8 + 1 per card drawn | 16 + 1 per card | A ~131% | +26% |
| Marked for Death | Rare | 1: 10, Consume, extra card reward on a kill (B) | 14 | 19 | A ~136% | +29% |
| Into the Shadows | Rare | 2: Defer 3, discard rest, next turn Attacks double (A); upgraded Defer 4 (+10%) | unchanged | costs 1 | A 147% | +26% |
| All or Nothing | Uncommon | 0: discard hand, draw that many, Consume (C 83%) | plus gain 2 Barrier | Hold (unchanged) | B 112% | ~+25% |
| Bolt Hole | Uncommon | 0: draw 1, 3 Barrier if a Skill, Consume (D 69%) | draw 1, gain 4 Barrier | 6 Barrier | B 105% | +27% |
| Practiced Hands | Uncommon | 1: draw 2, they Hold this turn (C 71%) | draw 3, they Hold | draw 4 | B 107% | +33% |
| Lay Bare | Uncommon | 0: remove Barrier, 2 Exposed, Consume (C 83%) | 3 Exposed | 4 Exposed | B 119% | +20% (nearest) |
| Needle Rain | Uncommon | 1: 5 per Skill in hand (C) | 6 per Skill | 8 | B 107% | +33% |
| Quick Reflexes | Uncommon | 3, Premeditate: draw 1, Defer (C 82%) | draw 2, gain 2 Barrier (no Defer) | draw 2, 4 Barrier | B 119% | +25% |
| Cool Head | Uncommon | 3, Premeditate: +1 Mana; upgraded +2 (+100%) | +1 Mana, gain 2 Barrier | +1 Mana, 4 Barrier | B 119% | +25% |

## 5. Defence commons and basics

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Turn Aside | Common | 0: 4 Barrier (C 80%) | 5 Barrier | 7 | B 100% | +40% (nearest) |
| Roll Away | Common | 1: 4 Barrier + 4 next turn (C 88%) | 5 + 5 | 7 + 6 | B 110% | +31% |
| Sense the Blow | Common | 0: 2 Bracing this turn (D) | 3 Bracing this turn and 3 Barrier | 4 and 4 | B 110% | +30% |
| Shuffle Up | Common | 0: draw 1, discard 1 (D) | draw 2, discard 1 | also 2 Barrier | B 117% | +34% |
| Side Slip | Common | 0: Defer a card (D 58%) | Defer, draw 1 | also 2 Barrier | B 108% | +37% |
| Slip the Blow | Common | 2, Premeditate: 6 Barrier, Defer (C 74%) | 9 Barrier, Defer | 12 | B 99% | +25% |
| Blade Flurry | Common | 4 x 2 to all; upgraded 6 x 2 (+50%) | unchanged | 5 x 2 | B 104% | +25% |
| Dirty Hit | Common | 8 + 1 Faltering; upgraded 10 + 2 (+45%) | unchanged | 11 + 1 | B 110% | +27% |
| Hobbling Jab | Basic | 0: 3 + 1 Faltering; upgraded 4 + 2 (+67%) | unchanged | 5 + 1 | A 125% | +33% |
| Pocket Blades | Basic | 1: 2 Daggers; upgraded 3 (+50%) | unchanged | 2 Daggers and 2 Barrier | B 100% | +30% |

Not changing (already on target): Duck and Weave, Fang and Claw, Knife Juggle, Shroud and Shank, Feint Strike, Quick Slash,
Stalker's Lunge, Glancing Knives, Cartwheel Cut, Bottomless Sleeves, Darting Strike, Run Through, Spring Attack, Nerve Strike, Killing
Stroke, Recall the Blades, Open Vein, Chilling Shriek, Tossed Vials, Red Mirage, Bloodburst, Backspring, Flick Knife, Nimble Deal,
Smoke Veil, Fleet Step, Palm Switch, Sweep the Leg, Graveside Cut, Fleet Fingers, Rush of Blood; Final Bow is a special case.

## Engine work needed (all generic)

- An Ascendancy can replace the trait's card; three new token cards (Barbed Dagger, Shadow Feint; Dagger unchanged).
- A per-turn count limit on Whetted Edge's Edge bonus (first N Daggers a turn).
- A "played Attacks costing 1 or more this turn" metric (Final Flourish).
- Serrated Edges: a play trigger filtered to Attacks costing 1 or more, applying to the card's target or a random enemy.
- Existing: the `minCost` trigger filter (Shadow Echo), `perTurnLimit` (Serpent's Coil), Opening hand, Premeditate.

## Build strength with these changes

See the grade table in the reply of 2026-11-08 and, once built, a balance-history assessment. Hand estimates only; no simulations.
