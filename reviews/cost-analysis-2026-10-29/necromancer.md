# Necromancer: card cost analysis (2026-10-29)

Hand-priced with `docs/14_CARD_COSTING.md` (§1-§12, §14) against the live pool (`packages/content/src/v2/pools/necromancer.ts`,
text from `cardText`, engine semantics checked in `packages/combat/src/engine.ts`). No sims were run and no game code or docs changed.
Every card and its "+" is in the table at the end.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall** | **D** | Only 38% on budget, and 12 broken cards. The cards are not uniformly strong: they are scattered on both sides, with the Thralls and Fate payoffs over and many Souls rares dead. |
| **Power level** | **Over** | Mean deviation **+11%**. Thralls +17%, Fate +23%, Souls -2%, glue +18%. |
| **Consistency** | **F** | Spread (standard deviation) **41 points**, the widest of my three classes. Fleshcraft +216% and Spirit Walk -100% bracket it. |

Counts (85 cards graded: the 83 pool cards and 2 class basics; Strike and Defend are left out): **32 on budget (38%), 26 strong,
12 broken, 11 weak, 4 dead.**

Scale for consistency: spread up to 12 points is A, up to 18 B, up to 25 C, up to 35 D, over 35 F. Power: "fair" is a mean within ±5%.

**How sensitive the grade is.** Many of the "strong" cards are the Necrobinder baseline copies the guide was built from: Rot Strike
+36%, Tolling Bell +21%, Creeping End +23%, Desecrate +30%, Entomb +25%, Wither +16%. The guide's §9 table marks +21% as fine, but this
task's band is ±15%. The second lever is the Command rate (below). If a Command is priced at one Thrall with no allowance for more (the
guide's other reading), the Thralls path falls to about on budget, but Bone Snap and the 1-cost Commands turn weak. The broken Fate and
Souls cards and the dead Souls rares stay as they are either way, so the overall grade stays **D** under both readings (on budget would
rise to about 45-50%).

## Method and the rates I had to choose

- **Budgets:** 6 / 10 / 19 / 28 / 37 for 0-4 Mana. Class basics 80%, uncommon x1.12, rare x1.25. An Aura's 4-turn total is set
  against 1.5x (uncommon) or 2x (rare) its cost's budget. **No Consume or Fleeting bonus on the budget:** Grave Chill and his payoffs
  make them upside (§6). X cards: 7 a point of X at uncommon, priced at X = 3 (§2).
- **Grave Chill's Fate is priced with the trait, not on the cards** (the 3 Fate a consumed card gives, the 2 an ally's death gives).
  Otherwise every Consume card would carry +2.1 and every Raise +1.4.
- **Commands** ("your companions each deal N"): **N x1.43** on a 1+ cost card, **N x1.0** on a 0-cost one. That's the guide's §2: 1+
  cost Commands sit at 70% at one Thrall and 0-cost ones at 100%. Grave Chill now raises a Thrall at the start of **his** turn, so a
  Command nearly always has at least one, about 1.4 on average.
- **Raise N** = 1.2N + 3 (a new body; §3). **Thrall HP** for "plus their own HP": ~3 (the trait's Thralls are 2 HP), max HP ~4 in a
  Thralls deck.
- **Gravesoul** (0: draw 2, Consume) added to the draw pile **3** (+1 card on a later turn, ~80% drawn this fight), to hand **7**, to
  the discard **2.5**.
- **Fate** 0.7 a stack (0.9 to ALL). **Fate and every debuff fire "whenever you curse/debuff an enemy" once per enemy**
  (`addStatus` → `debuffFoe`/`doomFoe`): a curse to ALL answers once for each enemy.
- **Counts:** ~2.5 Fate or debuff applications a turn in a Fate deck; ~0.8 Gravesouls and ~0.8 Fleeting cards played a turn in a
  Souls deck; ~1 death a turn (his 2-HP Thralls die to the first enemy hit; `deaths` counts both sides).
- **Cost that drops per death or per Fleeting card played (Mourning, Wailing Cry):** priced at the cost usually paid (§5). Mourning
  costs ~1 on average over a fight. Wailing Cry is dead in hand until it costs ~3, so it is priced there.
- **Upgrade dev** is the "+" card against its own budget x1.3. **(c)** marks a card whose value depends on a setup, priced at the
  expected value in the deck built for it.

## The trait: Grave Chill

Raise 2 at the start of every turn: 2.4, plus 3 when it makes a new body (it does while fewer than three stand). That's ~27 over 5
turns. About one death a turn at 2 Fate (1.4) adds ~7. A consumed card gives 3 Fate (2.1): nothing in the starter, ~1.5 a turn in a
Souls deck, ~16. **~34 a fight with the starter, ~50 in a Souls deck.** That's among the strongest traits now, against ~15 at the
2026-10-28 review (Raise 2 at the start of his turn fixes "his Commands deal 0"). The Fate part is worth less than 0.7 against bosses:
it has to climb to their HP.

## Starter deck (4 Strike, 4 Defend, Raise Thrall, Off the Leash)

Baseline: about **10 damage and 6 Barrier a turn (~18 points)**.

| Turn | Damage | Barrier | Notes |
|---|---|---|---|
| 1 | ~11 | ~6 + a 2-HP Thrall | Off the Leash (on ~30% of turns) with one 2-HP Thrall deals 8 |
| 2 | ~11 | ~6 + 2 Thrall HP (~1.5 with Raise Thrall) | the Thrall dies to the first enemy hit (2 Fate on a random enemy) |
| 3 | ~11 | ~6 + Thrall HP | Fate ~2 a turn, which never kills on its own |

**Reading:** at the baseline, ~19-20 points a turn counting the Thrall as sticky Barrier. **Off the Leash reads broken (+61%)**: it is
6 + the Thrall's HP per Thrall, and with ~1.4 Thralls of ~3 HP that's ~13 for 1 Mana. But it is the starter's only Command. The
starter's damage is ~11 with it and ~9 without it, so cutting it hard would make the opening weak. Raise Thrall is +12%, on budget.

## Build paths

| Path | Cards | Mean | On budget | How it holds up |
|---|---|---|---|---|
| **Thralls** | 23 | +17% | 48% | Works and is over. The trait guarantees a body on his turn, so every Command pays, and the payoffs that multiply by the Thrall count or their HP are well past budget: Bone Rain +117% (Barrier and AoE per Thrall, for 1), Death Grip +63% (+5 per Command card in the deck), The Drowned King +60% (and its "+" costs 0), Goad +48%, Ossify +49%, Grasping Hands +38%. The big-body cards are under: Grave Colossus -26% and Fen Offering -39% (a Thrall is struck before it can be offered). |
| **Fate** | 18 | +23% | 39% | Works, but two cards break it. **Fleshcraft** (+216%): 9 damage every time a debuff lands, and Fate counts, once per enemy, as do Grave Chill's own curses. **Spreading Rot** (+121%): a 0-cost copy of a target's whole Fate stack onto every other enemy. Burial Shroud +60% reads the same per-enemy event. The rest is near budget or hot like the baselines. Reaper's Mantle is -40%. Payoffs are reachable: the Fate commons stack 7-13 a card. |
| **Souls** | 34 | -2% | 32% | The mean is fair but the spread is wide. The commons run hot (Barrow Keeper +26%, Soul Rend +20%, Desecrate +30%), and Unmaking (+49%) is broken. Several rares do almost nothing: **Spirit Walk** -100% (needs 6+ cards in hand to give anything), **Call the Departed** -84%, **Soul Harvest** -57%, **Reaping Scythe** -45% (Consume throws away the growth that is its point). Wailing Cry is reachable after ~3 Fleeting cards (turn 4). Its "+" costs 2 less, which makes it ~1 Mana for 33 to ALL (+164%). |

## Against bosses (front-loaded big hits, needing big single-target damage or block)

- **Block:** Thralls take single attacks first, but a 2-HP Thrall soaks only 2 of a 25-damage hit (the overflow carries to him). The
  big-body cards (Grave Colossus 20, Goad) are what blunt a boss's opener. Bone Bulwark, Stay of Execution and Mourning (cheap late in a
  fight) add plain Barrier.
- **Damage:** strong single-target: Entomb 52, Harvest 27, Death Grip and The Drowned King in a Thralls deck, Unmaking at X. Fate is
  at its weakest on a boss: it has to climb to boss HP, so The Last Toll and Last Rites are slow. Final Reckoning (damage equal to the
  Fate) is the Fate deck's boss tool. Fleshcraft turns every curse into damage and is the strongest boss card in the pool.
- **Soul Tithe** (+71%) curses *him* with 3 Fate a turn for the rest of the fight. In a long boss fight that becomes a real death
  clock (24 Fate by turn 8).

## Biggest outliers and suggested fixes (suggestions only, not applied)

| # | Card | Now | Suggested fix | After |
|---|---|---|---|---|
| 1 | **Fleshcraft** (2, uncommon Aura) | +216% (c): 9 per debuff, Fate included, per enemy | **3** damage (upgrade 4); or "the first debuff on each enemy each turn" | ~+5% |
| 2 | **Spreading Rot** (0, rare) | +121% (c): copies the target's Fate to every enemy for 0 | Cost **1** and 5 damage (upgrade Hold); or copy every debuff but Fate | ~+17% |
| 3 | **Bone Rain** (1, uncommon) | +117%: per-Thrall Barrier and AoE, then they die | Cost **2** at today's numbers; or 5 Barrier and 6 to ALL per ally at 1 | +14% / +8% |
| 4 | **Soul Tithe** (0, rare Aura) | +71%: +3 Mana and draw 2 for 0 | Cost **1** | +3% |
| 5 | **Death Grip** (3, rare) | +63% (c): 20 + 5 per Command card | **16 + 3** per Command card (upgrade 20 + 4) | +14% |
| 6 | **Off the Leash** (1, basic) | +61%: 6 + HP per Thrall | **4** + their HP (upgrade 7 + HP). The starter loses ~1 damage a turn; check turn 1-3 against weak openings | +25% |
| 7 | **The Drowned King** (1, rare) | +60%; its "+" costs 0 (+95%) | **7** + max HP; the "+" is 10 + max HP at 1 Mana, not cost 0 | +26% |
| 8 | **Goad** (1, uncommon) | +48%: Raise 3, +5 max HP to all, Hold | +**3** max HP and no Hold | +7% |
| 9 | **Spirit Walk** (2, rare) | -100%: 2 Ghostly only with 6+ cards consumed | Cost **1**: "Consume your hand. If 4 or more were consumed: gain 2 Ghostly." | ~-10% counting Grave Chill's Fate (~-30% without) |
| 10 | **Call the Departed** (1, rare) / **Soul Harvest** (1, rare Aura) | -84% / -57% | Call: "Turn **3** random draw-pile cards into Gravesouls" at 0 cost. Soul Harvest: Raise **3** per Gravesoul | ~-20% / ~-18% |

Also: **Reaping Scythe** (-45%): remove Consume so the growth can happen, and 15 base damage (then ~-16%). **Wailing Cry+** should be 33 → 40 damage, not
-2 cost. **Unquiet Rest** (+39%) fails §8's loop test: a free card that puts a copy of itself in the discard doubles every reshuffle.
It needs a cap ("at most once a turn" or Consume on the copy). **Toll in Advance** (-38%): every card costs 1 more, so +5 Mana buys
about one extra card. +6 Mana would bring it to about -15%. **Bonded Dead** (+23%) and **Call at Dusk** (+34%) are cheap Mana engines,
flagged but not urgent.

## Full table

Cards graded: **85** (Strike and Defend excluded). On budget **32** (38%), strong **26**, broken **12**, weak **11**, dead **4**.
Mean deviation **+11%**, spread (standard deviation) **41 points**.

| Build path | Cards | Mean dev | On budget |
|---|---|---|---|
| starter | 2 | +37% | 50% |
| Thralls | 23 | +17% | 48% |
| Fate | 18 | +23% | 39% |
| glue | 8 | +18% | 25% |
| Souls | 34 | -2% | 32% |

Verdicts: on budget within ±15%, strong +15 to +40%, broken over +40%, weak −15 to −40%, dead under −40%. (c) = conditional, priced at its expected value. "Upgrade dev" is the "+" card against its own budget x1.3 (the guide aims upgrades at about +30%); "gain" is the "+" over the base card.

| Card | Cost | Rarity | Path | Text (live) | Price | Budget | Dev | Verdict | Upgrade dev (vs budget x1.3) | Working |
|---|---|---|---|---|---|---|---|---|---|---|
| Strike | 1 | basic | starter | Deal 6 damage. | 6.0 | 6.0 | +0% | on budget | +15% (gain +50%) | 6 dmg |
| Defend | 1 | basic | starter | Gain 5 Barrier. | 6.0 | 6.0 | +0% | on budget | +23% (gain +60%) | 5 Barrier |
| Raise Thrall | 1 | basic | starter | Raise 5. | 9.0 | 8.0 | +13% | on budget | +10% (gain +27%) | Raise 5: 6 + 3 (guide reference) |
| Off the Leash | 1 | basic | starter | Your companions each deal 6 damage, plus their own HP. | 12.9 | 8.0 | +61% | broken | +65% (gain +33%) | (6 + ~3 HP: Grave Chill Thralls are 2 HP) x1.43 |
| After the End | 1 | common | Thralls | Raise 6. Consume. | 10.2 | 10.0 | +2% | on budget | +6% (gain +35%) | Raise 6 |
| Bone Crush | 2 | common | Thralls | Costs 0 if your companions have struck this turn. Your companions each deal 12 damage. | 24.2 | 19.0 | +27% | strong (c) | +21% (gain +24%) | 12 x1.43 = 17.2 + "costs 0" (2 Mana 14) x ~50% (a Command first, a Thrall up) |
| Call at Dusk | 1 | common | Thralls | Next turn: Raise 2. Gain 2 Mana. | 13.4 | 10.0 | +34% | strong | +28% (gain +24%) | next turn: Raise 2 (5.4) + 2 Mana (4 + 4); a 1-cost card that nets +1 Mana |
| Knucklebone | 0 | common | Thralls | Your companions each deal 6 damage. | 6.0 | 6.0 | +0% | on budget | +15% (gain +50%) | 6 x1.0 (0-cost Command, guide reference) |
| Bone Bulwark | 2 | common | Thralls | Raise 5. Gain 8 Barrier. | 18.6 | 19.0 | -2% | on budget | -10% (gain +19%) | Raise 5 (9) + 8 Barrier 9.6 |
| Bone Snap | 1 | common | Thralls | Your companions each deal 7 damage. A random card in your hand gains Hold. | 11.0 | 10.0 | +10% | on budget | +18% (gain +39%) | 7 x1.43 + a card gains Hold (~1) |
| Bone Rain | 1 | uncommon | Thralls | Gain Barrier equal to 9 times the number of your allies. Your companions each deal 9 damage to ALL enemies. Then they die. | 24.3 | 11.2 | +117% | broken | +139% (gain +43%) | ~1.4 companions: 9 Barrier each (15.1) + 9 to ALL each (16.4) + their deaths 2 Fate each (2) - sacrifice 1.4 x (1.2 x ~3 HP + 3) (9.2) |
| Ossify | 1 | uncommon Aura | Thralls | Your companions’ attacks deal 4 more damage for the rest of the fight. | 22.4 | 15.0 | +49% | broken (c) | +72% (gain +50%) | Aura: +4 per companion hit, ~1 Command x1.4 companions a turn x4 (+6 up) |
| Bone Sift | 1 | uncommon | Thralls | Raise 5. Consume the top card of your draw pile. | 10.0 | 11.2 | -11% | on budget | -15% (gain +24%) | Raise 5 (9) + consume the top card (~+1: thins, feeds consume payoffs) |
| Bone Toss | 0 | uncommon | Thralls | Your companions each deal 3 damage. If this is the first time you play it this turn: Draw 1 card. | 6.0 | 6.7 | -11% | on budget | +3% (gain +50%) | 3 x1.0 + draw 1 as an extra 3 |
| Grasping Hands | 2 | uncommon | Thralls | Your companions each deal 11 damage to ALL enemies. Apply 2 Exposed to ALL enemies. | 29.4 | 21.3 | +38% | strong | +36% (gain +28%) | 11 to ALL x1.3 x1.43 (20.4) + 2 Exposed ALL 9 |
| Army of the Drowned | 2 | uncommon | Thralls | Raise 6 twice. Consume. | 20.4 | 21.3 | -4% | on budget | -9% (gain +24%) | Raise 6 twice (10.2 each) |
| Rattle the Bones | 1 | uncommon | Thralls | Your companions each deal 7 damage, 1 more time per time your companions have struck this turn. | 15.0 | 11.2 | +34% | strong (c) | +33% (gain +29%) | 7 x ~1.5 hits (a Command before it ~50%) x1.43 |
| Helping Hand | 0 | uncommon | Thralls | Whenever you play a card that costs 2 or more, this returns from your discard pile to your hand. Your companions each deal 4 damage. | 6.0 | 6.7 | -11% | on budget | -8% (gain +33%) | 4 x1.0 + returns after a 2+ cost card (~+2) |
| Seize Them | 1 | uncommon | Thralls | Your companions each deal 5 damage. Apply 3 Quarry until the end of your turn. | 10.7 | 11.2 | -4% | on budget (c) | -3% (gain +32%) | 5 x1.43 + 3 Quarry: a later Command this turn (~50%) raises 3 per companion hit (1.4 x 6.6) |
| Goad | 1 | uncommon | Thralls | Raise 3. Your companions gain 5 max HP. Hold. | 16.6 | 11.2 | +48% | broken | +55% (gain +36%) | Raise 3 (6.6) + 5 max HP x1.2 x ~1.5 companions (9) + Hold 1 |
| Shared Agony | 2 | rare Aura | Thralls | Raise 5. Whenever one of your companions loses HP: ALL enemies lose HP equal to the HP it lost. | 35.0 | 38.0 | -8% | on budget (c) | -22% (gain +10%) | Aura: Raise 5 (9) + ~5 companion HP lost an enemy turn -> 5 to ALL (6.5) x4 |
| Grave Colossus | 3 | rare | Thralls | Raise 20. Consume. | 26.0 | 35.0 | -26% | weak | -30% (gain +23%) | Raise 20: 24 + ~2 body (often grows a standing Thrall instead) |
| Fen Offering | 1 | rare | Thralls | Gain Barrier equal to 2 times the target's max HP. Sacrifice the chosen ally. Hold. | 7.6 | 12.5 | -39% | weak (c) | -22% (gain +0% (cost 0)) | 2x max HP Barrier on a ~6 HP Thrall (14.4) - sacrifice (10.2) + its death 1.4 + Hold 2; up costs 0 |
| Ever Watchful | 2 | rare Aura | Thralls | At the start of your turn: Add a Baleful Glance to your hand. | 36.0 | 38.0 | -5% | on budget | +38% (gain +0% (cost 1)) | Aura: a Baleful Glance a turn (0-cost Command 10 to a random enemy: 9) x4; up costs 1 |
| Death Grip | 3 | rare | Thralls | Your companions each deal 20 (+5 per Command card in your deck) damage. | 57.2 | 35.0 | +63% | broken (c) | +55% (gain +23%) | (20 + 5 x ~4 Command cards in a Thralls deck) x1.43; ~36 in the starter (1 Command) |
| The Drowned King | 1 | rare | Thralls | Your companions each deal 10 damage, plus their own max HP. | 20.0 | 12.5 | +60% | broken | +95% (gain -5% (cost 0)) | (10 + ~4 max HP) x1.43; up costs 0: (15 + 4) x1.0 at the 0-cost Command rate |
| Rot Strike | 1 | common | Fate | Deal 8 damage. Curse the target with Fate equal to the damage dealt. | 13.6 | 10.0 | +36% | strong | +31% (gain +25%) | 8 + 8 Fate 5.6 (guide-flagged baseline) |
| Creeping End | 1 | common | Fate | Gain 5 Barrier. Curse ALL enemies with 7 Fate. | 12.3 | 10.0 | +23% | strong | +32% (gain +39%) | 5 Barrier 6 + 7 Fate ALL 6.3 |
| Tolling Bell | 1 | common | Fate | Curse the target with 13 Fate. Draw 1 card. | 12.1 | 10.0 | +21% | strong | +40% (gain +50%) | 13 Fate 9.1 + draw 1 (3) (guide reference: its table marks +21% as fine) |
| Inevitable | 1 | uncommon Aura | Fate | At the start of your turn: Curse a random enemy with 6 Fate. | 16.8 | 15.0 | +12% | on budget | +29% (gain +50%) | Aura: 6 Fate a turn 4.2 x4 |
| At the Threshold | 1 | uncommon | Fate | Gain 6 Barrier. If you have cursed an enemy with Fate this turn: Gain 6 Barrier twice. | 14.4 | 11.2 | +29% | strong (c) | +15% (gain +17%) | (6 + 12 x ~50% Fate this turn first) Barrier x1.2 |
| The Final Hour | 2 | uncommon | Fate | Curse ALL enemies with 21 Fate. Apply 1 Faltering to ALL enemies. | 23.4 | 21.3 | +10% | on budget | +1% (gain +19%) | 21 Fate ALL 18.9 + Faltering ALL 4.5 (guide reference) |
| Last Rites | 1 | uncommon | Fate | Curse the target with 10 (+5 per 10 Fate on the target) Fate. | 11.2 | 11.2 | 0% | on budget (c) | +1% (gain +31%) | (10 + ~6 for the Fate already there) x0.7 |
| Burial Shroud | 1 | uncommon Aura | Fate | Whenever you curse an enemy with Fate: Gain 2 Barrier. | 24.0 | 15.0 | +60% | broken (c) | +85% (gain +50%) | Aura: 2 Barrier per enemy cursed, ~2.5 a turn in a Fate deck (a curse to ALL counts each enemy) x4 |
| Fleshcraft | 2 | uncommon Aura | Fate | Whenever you put a debuff on an enemy: Deal 9 damage to that enemy. | 90.0 | 28.5 | +216% | broken (c) | +251% (gain +44%) | Aura: 9 to that enemy per debuff put on an enemy (Fate counts, per enemy), ~2.5 a turn in a Fate deck x4 |
| Toll in Advance | 1 | uncommon | Fate | Gain 5 Mana. Cards cost 1 more this turn. | 7.0 | 11.2 | -38% | weak | -24% (gain +57%) | +5 Mana but each card +1: about one more card played (~7); 0-cost Gravesouls cost 1 |
| Wither | 1 | uncommon | Fate | Deal 10 damage. Apply 2 Debilitated. | 13.0 | 11.2 | +16% | strong | +13% (gain +27%) | 10 + 2 Debilitated 3 (guide reference) |
| Fester | 1 | uncommon | Fate | Apply 2 Faltering. Apply 2 Exposed. Consume. | 12.0 | 11.2 | +7% | on budget | +24% (gain +50%) | 2 Faltering 6 + 2 Exposed 6 |
| The Last Toll | 3 | rare | Fate | Curse ALL enemies with 29 Fate. Every enemy whose HP is at or below its Fate dies now. | 30.1 | 35.0 | -14% | on budget | -18% (gain +24%) | 29 Fate ALL 26.1 + kills now, not at its turn end (~4) |
| Mark of Ending | 0 | rare | Fate | This turn, whenever you play a card: Curse the target with 3 Fate. | 7.4 | 7.5 | -1% | on budget | +1% (gain +32%) | 3 Fate x ~3.5 cards after it this turn |
| Reaper's Mantle | 3 | rare Aura | Fate | For the rest of the fight, whenever your Attacks take HP off an enemy, curse it with that much Fate. | 33.6 | 56.0 | -40% | weak | -51% (gain +6%) | Aura: ~12 attack HP a turn as Fate (x0.7) x4; up Hold |
| Final Reckoning | 2 | rare | Fate | Deal damage equal to the target's Fate. Consume. | 22.0 | 23.8 | -7% | on budget (c) | -21% (gain +11%) | damage = ~22 Fate on the target in a Fate deck; up Hold |
| Spreading Rot | 0 | rare | Fate | Deal 7 damage. Put the target's debuffs on every other enemy too. | 16.6 | 7.5 | +121% | broken (c) | +101% (gain +18%) | 7 + the target's ~12 Fate + 1 Exposed (11.4) to ~1.4 others x 60% of fights with more than one enemy; up Hold |
| Common Grave | 0 | rare | Fate | Gain 2 Sapped. Apply 2 Sapped. Consume. | 5.0 | 7.5 | -33% | weak (c) | -12% (gain +72%) | Sapped lasts the fight: 2 on the target (x1.2 x1.5 hits x3 = 10.8) - 2 on himself (~-6, he hits less than most: his Thralls are not Sapped) |
| Soul Tithe | 0 | rare Aura | glue | Gain 3 Mana. Draw 2 cards. At the start of your turn: Curse yourself with 3 Fate. | 20.5 | 12.0 | +71% | broken | +54% (gain +17%) | Aura at 0: +3 Mana now (7+7+3.5) + draw 2 (7) - 3 Fate on himself a turn (~-4 over a fight; lethal in long boss fights) |
| Barrow Keeper | 1 | common | Souls | Gain 8 Barrier. Add a Gravesoul to your draw pile. | 12.6 | 10.0 | +26% | strong | +25% (gain +29%) | 8 Barrier 9.6 + a Gravesoul in the draw pile 3 |
| Soul Rend | 1 | common | Souls | Deal 9 damage. Add a Gravesoul to your draw pile. | 12.0 | 10.0 | +20% | strong | +31% (gain +42%) | 9 + Gravesoul 3; up a Gravesoul+ (~6) |
| Desecrate | 1 | common | Souls | Deal 13 damage. Fleeting. | 13.0 | 10.0 | +30% | strong | +31% (gain +31%) | 13; Fleeting is upside for him (no +15%), guide reference |
| Grave Defiance | 1 | common | Souls | Gain 6 Barrier. Apply 1 Faltering. Fleeting. | 10.2 | 10.0 | +2% | on budget | +6% (gain +35%) | 6 Barrier 7.2 + Faltering 3 |
| Cold Dread | 1 | common | Souls | Deal 7 damage. Apply 1 Exposed. Fleeting. | 10.0 | 10.0 | +0% | on budget | +8% (gain +40%) | 7 + Exposed 3 |
| Wraith Strike | 1 | common | Souls | Deal 9 damage. A random card in your hand gains Fleeting. | 9.0 | 10.0 | -10% | on budget | -8% (gain +33%) | 9; making a card Fleeting is ~0 for him |
| Marsh Light | 0 | common | Souls | Gain 1 Mana. Consume. | 7.0 | 7.0 | +0% | on budget | -12% (gain +14%) | +1 Mana, Consume: the guide's own reference card (budget = its 7) |
| Bottled Soul | 1 | uncommon | Souls | The target loses 3 HP. Add 3 Gravesouls to your draw pile. | 12.0 | 11.2 | +7% | on budget | +10% (gain +33%) | 3 HP loss + 3 Gravesouls in the draw pile 9 |
| Lament | X | uncommon | Souls | Raise 3 X times. Add Gravesouls to your draw pile equal to the Mana spent. Consume. | 24.6 | 21.0 | +17% | strong | +14% (gain +27%) | at X = 3: Raise 3 x3 (10.8 + ~1.6 new bodies 4.8) + 3 Gravesouls 9; budget 7 a point of X (guide §2) |
| Restless Spirits | 1 | uncommon Aura | Souls | Whenever you play a Gravesoul: A random enemy loses 6 HP. | 17.3 | 15.0 | +15% | strong (c) | +18% (gain +33%) | Aura: 6 to a random enemy (5.4) x ~0.8 Gravesouls a turn x4 |
| Killing Chill | 1 | uncommon Aura | Souls | For the rest of the fight, your first Attack each turn deals 50% more damage. Fleeting. | 18.0 | 15.0 | +20% | strong | +38% (gain +50%) | Aura: +50% on the first Attack (~9) a turn = 4.5 x4 |
| Grimoire Gale | 1 | uncommon Aura | Souls | Whenever you draw a Fleeting card: Draw 1 card. | 17.6 | 15.0 | +17% | strong (c) | +50% (gain +0% (cost 0)) | Aura: a card (4) per Fleeting card drawn, ~1.1 a turn in a Souls deck x4; up costs 0 |
| Spectral Ledger | 1 | uncommon | Souls | Draw 3 cards. Fleeting. | 11.0 | 11.2 | -2% | on budget | -11% (gain +18%) | draw 3 |
| Drag Under | 1 | uncommon | Souls | Deal damage equal to 5 times the Fleeting cards played this fight. | 12.5 | 11.2 | +12% | on budget (c) | +20% (gain +40%) | 5 x ~2.5 Fleeting played by mid-fight |
| Sever the Thread | 2 | uncommon | Souls | Deal 13 damage. Add a Gravesoul to your draw pile. Add a Gravesoul to your hand. Add a Gravesoul to your discard pile. | 25.5 | 21.3 | +20% | strong | +10% (gain +20%) | 13 + Gravesouls in draw 3, hand 7, discard 2.5 |
| Withering Touch | 1 | uncommon | Souls | Apply 8 Sapped until the end of their next turn. Fleeting. | 9.6 | 11.2 | -14% | on budget | -9% (gain +38%) | 8 Sapped for a turn ~ 8 Barrier x1.2 (guide reference) |
| Soul Lance | 1 | uncommon | Souls | Deal 10 damage. Your next Fleeting card costs 0. | 13.0 | 11.2 | +16% | strong | +10% (gain +23%) | 10 + next Fleeting card free (~5 x 60%) |
| Dance of Bones | 1 | uncommon Aura | Souls | Whenever you play a card that costs 2 or more: Gain 4 Barrier. | 11.5 | 15.0 | -23% | weak (c) | -11% (gain +50%) | Aura: 4 Barrier x ~0.6 cards of cost 2+ a turn x4 |
| Funeral March | 1 | uncommon | Souls | Deal 8 (+4 per card drawn this turn) damage. | 14.0 | 11.2 | +25% | strong (c) | +17% (gain +21%) | 8 + 4 x ~1.5 cards drawn mid-turn (the opening hand does not count) |
| Stay of Execution | 2 | uncommon | Souls | Gain 11 Barrier. Next turn, gain 1 extra Mana. | 17.2 | 21.3 | -19% | weak | -15% (gain +37%) | 11 Barrier 13.2 + 1 Mana next turn 4 |
| Grave Digging | 1 | uncommon | Souls | Return 3 random cards from your discard pile to your hand. Consume. | 11.0 | 11.2 | -2% | on budget | -18% (gain +9%) | 3 random cards back from the discard (4 + 4 + 3); up Hold |
| Mourning | 3 (~1) | uncommon | Souls | Costs 1 less for each death this fight. Gain 13 Barrier. | 15.6 | 11.2 | +39% | strong (c) | +40% (gain +31%) | 13 Barrier; ~1 death a turn (his 2-HP Thralls), so it costs ~1 on average over a fight |
| Wailing Cry | 9 (~3) | rare | Souls | Costs 2 less for each Fleeting card played this fight. Deal 33 damage to ALL enemies. | 42.9 | 35.0 | +23% | strong (c) | +164% (gain +0% (cost 7)) | 33 to ALL x1.3; ~0.8 Fleeting a turn, played once it costs ~3 (dead in hand before); up costs 2 less (~1) |
| Whispers Beyond | 1 | rare Aura | Souls | At the start of your turn: Add a random card from your pool to your hand. It is Fleeting. | 20.0 | 20.0 | +0% | on budget | -10% (gain +18%) | Aura: a random pool card a turn, Fleeting (~5) x4; up Opening hand |
| Phylactery | 3 | rare Aura | Souls | At the start of your turn: Gain 1 Mana. Draw 1 card. Fleeting. | 42.0 | 56.0 | -25% | weak | -15% (gain +0% (cost 2)) | Aura: +1 Mana (7) and a card (3.5) a turn x4; up costs 2 |
| Soul Harvest | 1 | rare Aura | glue | Whenever you play a Gravesoul: Raise 1. | 8.6 | 20.0 | -57% | dead (c) | -52% (gain +45%) | Aura: Raise 1 (1.2 + a body ~1.5) x ~0.8 Gravesouls a turn x4 |
| Spirit Walk | 2 | rare | Souls | Consume your hand. If 6 or more cards were consumed this way: Gain 2 Ghostly. | 0.0 | 23.8 | -100% | dead (c) | -100% (gain n/a (cost 1)) | consumes ~4 cards (lost for the fight) for 2 Ghostly (26) only at 6+ cards (~10%): ~0 before Grave Chill's Fate |
| Unmaking | X | rare | Souls | Deal 11 damage X times. Hold. | 35.0 | 23.4 | +49% | broken | +51% (gain +31%) | 11 x X = 3 (33) + Hold 2; budget 7 a point of X x rare |
| Gather Souls | 1 | rare | Souls | Add 3 Gravesouls to your draw pile. Consume. | 9.0 | 12.5 | -28% | weak | -26% (gain +33%) | 3 Gravesouls in the draw pile |
| Gallows | 1 | rare | Souls | Deal 10 damage. Apply 1 Noose. | 15.0 | 12.5 | +20% | strong (c) | +11% (gain +20%) | 10 + Noose (the next Gallows on that enemy deals double: ~+10 x 50%) |
| Call the Departed | 1 | rare | Souls | Turn a random card in your draw pile into a Gravesoul. Fleeting. | 2.0 | 12.5 | -84% | dead | -79% (gain +0% (cost 0)) | a random draw-pile card becomes a Gravesoul: +3, less the card it replaced (~-1) |
| Requiem | 1 | rare | glue | Deal 9 (+2 per consumed Gravesoul) damage. | 15.0 | 12.5 | +20% | strong (c) | +11% (gain +20%) | 9 + 2 x ~3 consumed Gravesouls by mid-fight |
| Ashfall | 1 | rare Aura | Souls | Whenever you play a Fleeting card: Gain 4 Barrier. | 15.4 | 20.0 | -23% | weak (c) | -26% (gain +25%) | Aura: 4 Barrier x ~0.8 Fleeting cards a turn x4 |
| Reaping Scythe | 2 | rare | Souls | Deal 13 damage, plus all it has grown. Every copy of this card gains 4 damage for the rest of the fight. Consume. | 13.0 | 23.8 | -45% | dead | -58% (gain +0%) | 13; Consume means one play a fight, so the growth is lost unless he has copies |
| Echo of the Dead | 1 | rare | Souls | A random card in your hand gains Replay (it is played one more time) and costs 1 more for this fight. Consume. | 8.0 | 12.5 | -36% | weak | -32% (gain +38%) | Replay on a random hand card (~9) but it costs 1 more for the fight (~-7 now, then ~+2 a later play); up loses Consume |
| Unquiet Rest | 0 | rare | Thralls | Gain 7 Barrier. Add a copy of this card to your discard pile. | 10.4 | 7.5 | +39% | strong | +31% (gain +23%) | 7 Barrier 8.4 + a copy into the discard +2 (and the copies multiply: loop test) |
| Leech Lore | 1 | common | glue | Deal 10 damage. Upgrade 2 random cards in your discard pile for this fight. | 14.8 | 10.0 | +48% | broken | +44% (gain +26%) | 10 + 2 discard cards upgraded (~+3 each, x0.8 replayed) |
| Grave Robbery | 1 | common | Souls | Deal 6 damage. Return a random card from your discard pile to your hand. Consume. | 9.0 | 10.0 | -10% | on budget | -15% (gain +22%) | 6 + a random discard card back 3; up loses Consume |
| Harvest | 3 | common | glue | Deal 27 damage. Hold. | 29.0 | 28.0 | +4% | on budget | -4% (gain +21%) | 27 + Hold 2 |
| Scatter Ashes | 1 | common | glue | Deal 8 damage to ALL enemies. Hold. | 11.4 | 10.0 | +14% | on budget | +18% (gain +34%) | 8 to ALL x1.3 + Hold 1 |
| Entomb | 4 | uncommon | glue | Deal 52 damage. | 52.0 | 41.4 | +25% | strong | +17% (gain +21%) | 52 (guide-flagged baseline) |
| Bonded Dead | 1 | uncommon Aura | glue | Gain 2 Sapped. At the start of your turn: Gain 1 Mana. | 18.4 | 15.0 | +23% | strong | +19% (gain +26%) | Aura: +1 Mana a turn 28 - 2 Sapped for the fight on himself (~-9.6: his own attacks) |
