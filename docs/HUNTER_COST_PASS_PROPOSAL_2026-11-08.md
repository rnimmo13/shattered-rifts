# Hunter cost pass: proposal (2026-11-08, not built)

Status: **approved and built locally (DECISIONS #693), not released.** One change from the tables: Crushing Blow is 14 + 2 per Might
(18 + 2 upgraded), since 2 a point is the most a payoff may scale.

Robert's goals: every Hunter Ascendancy opens more than one way to win, with long-term scaling for the Arena (fights of about 10 turns),
priced against builds already known to be good rather than tuned to a turn count. Beastmaster wins with companions; Reaver wins
despite (and through) losing HP, scaling like the Blood Knight; Predator gets a Preparation-style mechanic and several routes (draw,
Mana, Exposed, Primed).

Prices follow [docs/14_CARD_COSTING.md](14_CARD_COSTING.md): Rares in A (125-160% of budget), most Uncommons in B (90-124%), upgrades
about +30%. Hunter companions: 1-2 standing, hits of 4-6; Might is 6 a stack (the pack shares it); HP paid is -1.5 a point, more in a
deck with HP payoffs. A card is priced in the build it belongs to (a Reaver card in a Reaver deck).

## 1. Ascendancies

| Ascendancy | Now | Proposed | Routes it opens |
|---|---|---|---|
| **Beastmaster** | Companions share 3/4 of your Might; +1 Might each turn | **Your companions share all your Might. At the start of your turn, gain 1 Might (up to 10) and each companion gains 2 max HP.** | One big beast (Alpha Call, Dire Wolf, Feeding Time, Primal Feast) or a wide pack (Pups, Litter, Rally the Pack, Trail of Blood, Pack Leader, Den Mother), driven by Commands (Savage Command, Pack Frenzy, Wild Hunt, Skullcrusher) |
| **Reaver** | First HP payment each turn: draw 1, 2 Primed, 1 Might, 4 Barrier | **Bloodlust: every 3 HP your own effects cost you gives 1 Might for the fight (up to 12). The first time each turn your own effect costs you HP, draw 1 and gain 4 Barrier. At half HP or less, your Attacks heal you for 20% of the damage they deal.** | Bloodrage attacks that grow with Might (Rend, Twin Fang, Reckless Blow, Ravage, Crushing Blow, Death or Glory), or the scar route that turns HP loss into Barrier and damage (Scar Tissue, Scarred Warrior, Wounded Wrath, Pain Ward, Gut Trap, Ancient Fury, Blood Pact) |
| **Predator** | Mid-turn draws give Primed (2 each for the first 6) | **Ambush: each card you draw on your turn after your opening hand adds 10% to your next Attack (up to 60%). That Attack uses it all, even a free one, and Ambush waits across turns. The first time each turn you apply Exposed, draw 1.** | The draw-and-Mana burst (Blood Tithe, Adrenal Surge, Berserk Tempo, Killing Spree, then Rising Howl, Apex Frenzy, Bloodstorm), or the hunt: Expose the prey and let the pack finish it (Single Out, Bone Crack, Bloodied Howl, Run It Down, Bear Trap, Deadfall), each Exposed drawing toward Ambush |

Reference: the Blood Knight stores +2% per 1% of max HP lost, up to 30% a round and 60% in all, spent by the next Attack. The Reaver's
Bloodlust instead keeps what it earns (Might for the fight, like the Artillerist's 12-Might cap over 6 turns) and adds healing when
low, so paying HP is both its fuel and survivable. Expected: Beastmaster A- / A (late game / Arena), Reaver A- / A, Predator A- / A-.

Arena guard: **Ritual (Bloodsong, Hunger Unleashed) gives its Might for the first 8 turns only**, like the Artillerist's cap, so a long
Arena fight does not run away.

## 2. Pack cards (Beastmaster)

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Dire Wolf | Rare | 3: a Dire Wolf, 18 HP, hits 9 twice (S ~190%) | a Dire Wolf with 15 HP that hits 7 twice | it arrives with 4 more max HP | A ~143% | ~+28% |
| Den Mother | Rare (Aura) | 2: a companion dies, 15 to its killer (D 59%) | a companion dies: 15 to its killer, gain 1 Might, summon a Pup | costs 1 | A ~134% | ~+30% |
| Pack Frenzy | Rare | 2: 2 Might, companions act now, Consume (D 67%) | 3 Might, your companions act twice, not consumed | act three times | A ~143% | +24% |
| Wild Hunt | Rare (Aura) | 3: companions act at the start of your turn (D 57%) | 2 Mana, Opening hand: at the start of your turn your companions act and each gains 2 max HP | costs 1 | A ~153% | ~+30% |
| Skullcrusher | Rare | 3: 26, companions act now (B 97%) | 30, companions act now, gain 1 Might | 34, companions act twice | A ~126% | +27% |
| Pack Bond | Uncommon (Aura) | 1: from next turn, 4 Barrier to you and companions each turn (S) | 3 Barrier to you and companions each turn | 4 | B ~122% | +33% |
| Pack Leader | Uncommon (Aura) | 2: 2 Barrier to you and companions per Attack (A 147%) | 2 Barrier to you and 1 to each companion per Attack | 3 and 1 | B ~116% | +29% |
| Feeding Time | Uncommon | 1: you and companions +3 max HP, 1 Might (A 129%) | +2 max HP, 1 Might | +4 | B ~104% | +22% |
| Trail of Blood | Common (Aura) | 1: 1 Might per summon (C/D) | 0 Mana | Opening hand | B ~100% | +33% |
| Primal Feast | Common | upgrade +7 max HP (+46%) | unchanged | companions +6 | B 117% | +31% |
| Baited Snare | Uncommon (Trap) | 1: when attacked, companions strike for 5, 3 Barrier (C 85%) | companions strike for 6, 4 Barrier | 8 | B ~104% | +20% |
| Hunting Grounds | Uncommon (Aura) | 1: 1 Might per Trap sprung (C 87%) | same, Opening hand | costs 0 | B ~107% | ~+30% |

Unchanged and on target: Summon Pup, Pack Tactics, Thick Hide, Bared Teeth, Lead the Charge, Savage Command (A edge, the Commands'
entry card), Rally the Pack, Unchained, Blood Bond, Litter, Bone Collar, Hunter's Call, Alpha Call, Devour Ally, Gnarltooth Trap.

## 3. Blood cards (Reaver)

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Ancient Fury | Rare (Aura) | 2: each turn 2 Might, lose 3 HP (D 32%) | 1 Mana: each turn 2 Might and lose 2 HP, for your first 6 turns | lose 1 HP | A ~130% in a Reaver deck (B elsewhere) | ~+25% |
| Hunger Unleashed | Rare (Aura) | 2: lose 6 HP, 2 Might, Ritual 1 (D 51%) | 1 Mana: lose 4 HP, 4 Might, Ritual 1 | 5 Might, lose 3 | A ~135% | +33% |
| Bloodsong | Rare (Aura) | 0: lose 3 HP, Ritual 1 (D 30%) | 0 Mana: lose 2 HP, 2 Might, Ritual 1, draw 1 | 3 Might | A ~140% | +29% |
| Slip the Leash | Rare | 2: double your Might, Consume (C 81%) | 1 Mana | Hold and draw 1 | A ~154% | +21% |
| Death or Glory | Rare | 2: 10 + 0.4 per % HP missing, Consume (C 88%) | 12 + 0.5 per % missing, not consumed | 16 + 0.6 | A ~135% | +25% |
| Blood Pact | Rare (Aura) | 1: lose 7 HP, +1 max Mana (C 88%) | lose 4 HP, +1 max Mana, draw 1 | costs 0 | A ~125% | ~+28% |
| Scar Tissue | Rare (Aura) | upgrade 4 Barrier (+55%) | unchanged | 3 Barrier | A 132% | +27% |
| Crushing Blow | Uncommon | 2: 10 + 2 per Might (C 75%) | 12 + 3 per Might | 14 + 4 | B ~99% | +24% |
| Run Wild | Uncommon | 2: 7 x 2, 1 Might (C 89%) | 8 x 2, 1 Might | 11 x 2 | B ~99% | +29% |
| Whirling Maul | Uncommon | X: 6 to all per X, lose 3 (C 81%) | 7 to all per X, lose 2 | X+1 | B ~103% | +33% |
| Reckless Blow | Uncommon | 1: lose 2, 7 x 2 (C 89%) | lose 2, 8 x 2 | 10 x 2 | B ~107% | +33% |
| Bloodied Howl | Uncommon | 1: lose 2, 2 Exposed to all, draw 1 (C 80%) | lose 1 | draw 2 | B ~94% | ~+30% |
| Tear Loose | Uncommon | 1: 9, lose 2, 4 Primed (C 80%) | 10, lose 2, 5 Primed | 13 | B ~98% | +27% |
| Devour | Uncommon | 2: 16, heal half (A 131%) | 14, heal half | 18 | B ~115% | +29% |
| Twin Fang | Common | 1: 6 x 2, lose 2 (C 80%) | 7 x 2, lose 2 | 9 x 2 | B 100% | +30% |
| Feral Instinct | Common | 0: lose 2, draw 2, Consume (C) | lose 2, draw 3, Consume | lose 1 | B ~107% | +19% |
| Open a Vein | Common | 0: lose 4, 2 Might, Consume (C 80%) | lose 3 | lose 2 | B 100% | +20% |
| Pound | Common | upgrade 12 (+42%) | unchanged | 11 | B 95% | +32% |
| Wounded Wrath | Common (Aura) | upgrade 6 (+50%) | unchanged | 5 | B | +25% |

Unchanged and on target: Rend, Blood Frenzy, Savage Bite (upgrade +29%), Pain Ward, Blood Tithe, Scarred Warrior, Ravage, The Hunger,
Hamstring Slam, Frothing Rage, Gut Trap.

## 4. Hunt and burst cards (Predator)

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Killing Spree | Rare (Aura) | 3: draw 1 per Attack played (D 64%) | 1 Mana: the first 2 Attacks you play each turn draw a card | Opening hand | A ~140% | +25% |
| Hunger Unbound | Rare (Aura) | 3: Skills cost 0 and are consumed; lose 2 HP a turn (D 43%) | 2 Mana, Opening hand: Skills cost 0 and are consumed (no HP loss) | costs 1 | A ~131% | ~+30% |
| Berserk Tempo | Rare (Aura) | 2: each turn +1 Mana, draw 1, lose 2 HP (C 84%) | 2 Mana, Opening hand: each turn +1 Mana, draw 1, lose 1 HP | costs 1 | A ~125% | ~+30% |
| Red Frenzy | Rare (Aura) | 1: 1 Might this turn per card drawn mid-turn (C) | also 1 Barrier per card drawn mid-turn | 2 Barrier | A ~130% | ~+28% |
| Rising Howl | Rare | 2: 10 + 5 per card played this turn (B 95%) | 14 + 7 per card played | 18 + 9 | A ~133% | +30% |
| Bloodstorm | Rare | X: 5, X times, draw X (B 92%) | 7, X+1 times, draw X | X+1 | A ~138% | ~+30% |
| Apex Frenzy | Rare | 2: (4 + 2 per card played) x 2, heal half, Consume (B 115%) | not consumed | 6 + 2 per card (unchanged) | A ~143% | +20% |
| Frenzied Gulp | Uncommon | 0: draw 3, lose 4, Consume (D 60%) | lose 2 | lose 1 | B ~95% | +18% |
| Battle Rhythm | Uncommon (Aura) | 1: each turn draw 1, lose 1 HP (D 67%) | each turn draw 1 (no HP) | Opening hand | B ~107% | +25% |
| Reckless Abandon | Uncommon | 1: draw 3, discard 1 (C 80%) | draw 3, discard 1, gain 2 Barrier | draw 4 | B ~102% | +31% |
| Rip and Tear | Uncommon | 2: 6 x 3, draw 1 (C 89%) | 7 x 3, draw 1 | 9 x 3 | B ~103% | +27% |
| Bone Offering | Uncommon | 1: Consume a card, draw 2, heal 2 (C 89%) | heal 3 | draw 3 | B ~103% | +35% |
| Adrenal Surge | Uncommon | upgrade draw 2 and lose 2 (+58%) | unchanged | lose 1 HP | B 113% | +32% |
| Pounding Heart | Common | 0: +1 Mana, lose 2, Consume (C) | also draw 1 | lose 1 | B ~93% | +21% |
| Throw Scraps | Common | 0: Consume a card, +1 Mana (D 67%) | also heal 2 | heal 4 | B ~117% | +25% |

Unchanged and on target: Rush In, Wild Swings, Shake Loose, Blur of Claws, Burst of Speed, Bone Crack, Whet the Fangs, Single Out,
Run It Down, Bear Trap, Snare Line, Deadfall.

## 5. Engine work needed

- Reaver's Bloodlust: a discipline that turns HP paid by your own effects into Might, 1 per 3 HP, up to 12 a fight; and Attacks heal
  20% of their damage while the hero is at half HP or less.
- Predator's Ambush: the existing Preparation discipline (`execution`) counting mid-turn draws instead of Skills, with no wounded
  bonus; the Exposed draw uses the existing `exposeFoe` trigger (once a turn).
- Beastmaster: data only (`shareMight: 1`, `growHp` on turn start, Might `times: 10`).
- Ritual gives Might for the first 8 turns of a fight.
- Dire Wolf: the unit drops to 15 HP and 7 x 2; its upgraded card needs a summon with extra max HP (or a `dire-wolf+` unit).
- Killing Spree's "first 2 Attacks" is the existing `perTurnLimit`.
