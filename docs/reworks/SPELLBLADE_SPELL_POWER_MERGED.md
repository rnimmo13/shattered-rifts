# Spellblade rework: the merged list (built 2026-10-31, DECISIONS #480)

**Built.** The live cards are `packages/content/src/v2/pools/spellblade.ts`, where they differ from this list (the differences are in "As built" below).
ChatGPT's draft (`SPELLBLADE_SPELL_POWER_CHATGPT.md`) was the main version; this replaces it and `SPELLBLADE_SPELL_POWER.md`. Every card is priced by
hand from `docs/14_CARD_COSTING.md`; no sim was run.

**As built, changed from the list below:**
- **DECISIONS #487:** every Shatter also adds the Spell Power you hold, spending none.
- **DECISIONS #488:** the **Obsidian Blade** is one hit of 5 + 2 per Spell Power (upgrade 8 + 2), not a growing number of hits. **Echoing Blade** adds 1 hit per copy, and copies stack.
- **DECISIONS #486:** a Shatter is now 10 + 10 x k (20, 30, 40... 110 at 100), and every Barrier of hers grows with Spell Power: +1 per 3 held (Unbreakable Crown +1 per 2, without its old "+8 at 10"), or +1 per 3 spent this turn on Last Ember, Sigil of Glass and Afterglow. This replaces the Shatter numbers and the Barrier prices below; the bases are unchanged, so each card is 3.2 points dearer (1.6 for the three that read spending).
- **DECISIONS #484:** Lava Bomb is 20 + 10 per point. Spell Power added to Emberstrike, Shard Strike, Crosscut, Tempered Bolt, Glass Veil, Ash Wind, Recenter and Fated Hand, with their other numbers trimmed (prices in the decision). Basics and commons are never X.
- **Fracture only adds up (DECISIONS #483):** where the list says "remove 10 and Shatter for 18", read: Fracture is never removed, and every 10 is a Shatter dealing 15 + 3 x k (18, 21, 24... 45 at 100). The rate is 1.6 a point, not 1.3. **Rupture Script** applies 20 (upgrade 26). **Carry the Fault** applies 4 plus half the most-cracked other enemy's Fracture (alone, 8).
- **Obsidian Ward replaces Hairline Hex** (1: 7 Barrier, gain 1 Spell Power; upgrade 10 Barrier), so no basic has Fracture. **Pale Ward** is 8 Barrier and 1 (upgrade 11).
- **No choice of amount (DECISIONS #482):** wherever the list says "Spend any amount", the card now spends a fixed share. **X (all):** Molten Ruin, Arcane Flood, Falling Shards, Lava Bomb, Cataclysm, Thousand Shards. **X/2 (half, rounded down):** Cinderfall, Spellbolt, Arcane Pulse, Glass Burst, Controlled Release, Dying Ember, Obsidian Drill, Stress the Glass, Arcane Barrier, Glass Wall. **Mirror Glass** costs a fixed 2 for 7 Barrier and 1 Shielded. The rates and damage per point are unchanged.
- **Banked Embers** gains 3 SP next turn and 1 Mana next turn (upgrade: 4 SP), not 4 SP and a Hold: a test holds that every class has a Mana trick, and this was hers. 7.65 + 4 = 11.65 / 11.2.
- **Crowned Edge** gives 2 Primed until the end of the turn, for any attack, not "2 more a hit on your next Sword": the same number with no new status.
- **Call the Blade** returns a random Sword, not a chosen one (the engine's tag fetch): 3 + 6 = 9 / 11.2.
- **Carry the Fault** moves Fracture from your most-cracked other enemy to the target; the player chooses only the target, so no second aim is needed.
- **Fault Memory** counts as a growing card for Sigil of Kindling and Crucible Heart.
- **Mirror Glass** is a "spend any amount" card that pays 1 Shielded at 2 or more; its slider opens at 2, so it never burns more unless you ask.
- **Pillar of Glass and Fault Reader** answer the first Shatter each turn from anything, so a Hungering Void Shatter at the end of your turn counts.

**Robert's calls (2026-10-31):** ChatGPT's version is the base. Swords grow by hits. **No caps on anything**, spells included. Sword rares
need real power, and there must be cards that make the Blade hit harder with Might or Primed. Its Fracture, recovery and mixing cards stay.

**The pool:** 88 reward cards (the other classes hold 78-93; she holds 80 now), 3 starter basics and the Obsidian Blade.

| Common | Uncommon | Rare | Total | Auras |
|---|---|---|---|---|
| 27 | 40 | 21 | 88 | 19 |

**From the live pool:** 50 cards stay, all reworked. 30 are cut. 38 are new. The three Retainer tokens go, and Rubble loses its Spellblade
sources.

## The rules

| Rule | Exactly |
|---|---|
| **Spell Power (SP)** | Replaces Arcana and Sharpen. On the hero's side, so a deck without the Blade still works. Lasts the fight, resets after it, no cap, never below 0. |
| **Kindled (trait)** | Start each fight with 3 SP. At the start of each of your turns, gain 1. |
| **Sword** | An Attack with the Sword tag. "SP/2" means 1 more hit per 2 SP, rounded down. **There is no hit cap.** A Sword reads SP as it starts resolving, and swinging spends nothing. Gains happen after the hits. |
| **Spend any amount** | You choose an amount from 0 to all your SP as you play the card, before its effects. Every card that says this can be played at 0. |
| **Spell** | A tag on Attacks and Skills. Spell Attacks are mainly single big hits, and Might, Primed and Exposed apply to them as usual. |
| **Fracture** | A visible mark on an enemy that never decays. Prevention such as Steadfast stops an application, not a later Shatter. |
| **Shatter** | At 10 Fracture, remove 10 and deal 18; repeat while it still has 10; the rest stays. Not an attack: no Might, Primed, Exposed or Thorns. Barrier stops it. It never applies Fracture, gains SP or sets off another Shatter. |
| **Shatter damage** | Starts at 18 each fight and only goes up. No card lowers the threshold. |
| **Growing cards** | "Grows N": this physical card's yield rises by N after it resolves, for the fight. It survives discard and reshuffle. An upgrade keeps what it has earned. Copies start at their printed number, and a free replay does not grow it again. |
| **Previous card** | The card played immediately before this one this turn. "Earlier this turn" is any time this turn. |
| **Aura copies** | Each copy has its own trigger and they add up. |

**"No caps" as applied:** every "up to N", "at most N" and hit limit in the ChatGPT draft is gone, so all spending is "spend any amount". To
stop a 1-Mana spell beating every finisher, **the rate per SP now rises with Mana: 4 at 1 Mana, 6 at 2, 8 at 3**. "First each turn" Aura
triggers stay: they stop free loops and aren't ceilings on damage.

**Starter (10):** 3 Strike, 3 Defend, Obsidian Blade, Gather Power, Cinderfall, Hairline Hex.

| Starter card | Mana | Text | Upgrade | Points / budget |
|---|---|---|---|---|
| **Obsidian Blade** | 2 | Sword. Hold. Opening hand. 5 damage, 1 hit + SP/2 | 6 a hit | 25 / 22.5 |
| Gather Power | 1 | Gain 2 SP | Gain 3 | 6 / 6 |
| Cinderfall | 1 | Spell. Spend any amount: 4 damage + 4 per SP | Base 7 | 12 at 2 spent / 13.3 |
| Hairline Hex | 1 | Spell. Apply 5 Fracture. 2 Barrier | Apply 6, 3 Barrier | 8.9 / 8.9 |

| SP | 4 | 6 | 8 | 12 | 14 | 20 | 27 |
|---|---|---|---|---|---|---|---|
| Blade hits | 3 | 4 | 5 | 7 | 8 | 11 | 14 |
| Blade damage | 15 | 20 | 25 | 35 | 40 | 55 | 70 |
| With 3 Might | 24 | 32 | 40 | 56 | 64 | 88 | 112 |

## Rates (to add to the costing guide if approved)

| Thing | Rate | Why |
|---|---|---|
| **SP gained** | **3** a point; at the start of next turn **2.55** | A point can power Swords and then a spell. |
| **Grows N** | **N x 3.6** | The guide's growth rate (N x 1.2) on 3 a point. |
| **Sword reads SP** | priced at **8 SP** | The mid-fight number with these generators, for a deck that holds. |
| **Spend any amount** | budget adds **4.5** per SP spent, at **4 SP spent for 1 Mana, 6 for 2, 10 for 3** | Below the guide's 6 for a fixed ◆ cost: the amount is chosen and nothing is ever wasted. |
| **Fracture** | **1.3** a point, **1.7** to ALL | 10 becomes 18, less the delay, leftovers and Barrier. |
| **Shatter damage +N** | **4** a point | About four Shatters left in a Fracture deck. |
| **Might** | **15** a stack in a Sword deck, 5 otherwise | About 7.5 hits a turn for about 3 turns, less misses. The guide's 5 assumes one hit a card. |
| **Primed** | **6** a stack | You save it for your biggest swing, about 6 hits. |
| **Shatters a turn** | about **0.8** first-Shatter triggers; about 1.4 Shatters | For Aura triggers. |

Budgets: 6 / 10 / 19 / 28 for 0 / 1 / 2 / 3 Mana; uncommon x1.12, rare x1.25; Consume x1.25. An Aura's 4-turn total should reach 1.5x (uncommon)
or 2x (rare) its cost's budget. **Status:** K = live name kept and reworked, N = new, † = number changed from the ChatGPT draft.

## Generators and growing cards (14)

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Forged in Fury | C | 1 | Sword. 2 damage, 1 hit + SP/3. Gain 1 SP | 3 a hit | 6 + 3 = 9 / 10 | K† |
| Deepening Enchantment | C | 1 | Gain 2 SP. Grows 1 | Gain 3 | 6 + 3.6 = 9.6 / 10 | K† |
| Faint Ember | C | 1 | Gain 2 SP. Draw 1 | Gain 3 | 6 + 3 = 9 / 10 | K |
| Ember Cache | C | 1 | Gain 1 SP now, 3 next turn | 4 next turn | 3 + 7.65 = 10.7 / 10 | K |
| Pale Ward | C | 1 | Spell. 6 Barrier. Gain 1 SP | 9 Barrier | 7.2 + 3 = 10.2 / 10 | K |
| Emberstrike | C | 1 | Sword. 2 damage, 2 hits + SP/3. If you played a Spell earlier this turn, gain 2 SP | 3 a hit | 8 + 3 = 11 / 10 | K† |
| Empty Crucible | C | 1 | Gain 3 SP; 2 more if you had 0 | Gain 4 | 9 + 1.5 = 10.5 / 10 | N |
| Bladewall | U | 2 | Spell. 12 Barrier. Gain 3 SP | 15 Barrier | 14.4 + 9 = 23.4 / 21.3 | K |
| Banked Embers | U | 1 | Gain 4 SP next turn. Choose a card in hand to Hold this turn | Gain 5 | 10.2 + 1 = 11.2 / 11.2 | K |
| Growing Crucible | U | 2 | Gain 4 SP. 4 Barrier. Grows 2 | 7 Barrier | 12 + 4.8 + 7.2 = 24 / 21.3 | N† |
| Measured Recharge | U | 1 | Gain 3 SP. If you spent 3+ SP earlier this turn, draw 1 | Gain 4 | 9 + 1.5 = 10.5 / 11.2 | N |
| Last Ember | U | 0 | Gain 2 SP. If you had 0, 5 Barrier. Consume | 8 Barrier | 6 + 1.8 = 7.8 / 8.4 | N |
| Magma Surge | R | 0 | Gain 3 SP. Consume | Gain 4 | 9 / 9.4 | K |
| The Forgemaster | R | 2 | Gain 6 SP. A generator in your hand yields 2 more for the fight. Consume | Gain 8 | 18 + 7.2 = 25.2 / 29.7 | K |

## Swords (16) and what makes them hit harder (6)

Points are at 8 SP. Might and Primed are priced on the card that gives them, not again on every Sword.

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Obsidian Flurry | C | 2 | Sword. 3 damage, 3 hits + SP/2 | 4 a hit | 21 / 19 | K† |
| Obsidian Lance | C | 1 | Sword. One hit: 6 damage + 1 per 2 SP | Base 9 | 10 / 10 | K† |
| Glint | C | 1 | Sword. 2 damage, 1 hit + SP/3. Draw 1 | 3 a hit | 6 + 3 = 9 / 10 | K† |
| Etching Edge | C | 1 | Sword. 2 damage, 1 hit + SP/4. Each hit applies 1 Fracture | 3 a hit | 6 + 3.9 = 9.9 / 10 | N† |
| Rift Sweep | C | 2 | Sword. 3 damage to ALL, 3 hits + SP/3 | 4 a hit | 19.5 / 19 | N† |
| Glass Needle | C | 0 | Sword. 2 damage, 1 hit + SP/3. Consume | 3 a hit | 6 / 7.5 | N† |
| Guarded Cut | C | 1 | Sword. 2 damage, 1 hit + SP/4. 4 Barrier | 6 Barrier | 6 + 4.8 = 10.8 / 10 | N† |
| Shard Strike | U | 1 | Sword. 2 damage, 2 hits + SP/3. At 9+ SP, 4 Barrier | 3 a hit | 8 + 2.2 = 10.2 / 11.2 | K† |
| Tyrant Strike | U | 2 | Sword. 4 damage, 3 hits + SP/3. If you spent SP earlier this turn, 2 Exposed | 5 a hit | 20 + 3 = 23 / 21.3 | K† |
| Crosscut | U | 1 | Sword. 2 damage, 2 hits + SP/4. If your previous card was a Spell, 2 more hits | 3 a hit | 8 + 2 = 10 / 11.2 | N† |
| Fault Piercer | U | 2 | Sword. 4 damage, 3 hits + SP/3. If the target has Fracture, apply 3 | 5 a hit | 20 + 2.7 = 22.7 / 21.3 | N† |
| Hammer and Anvil | R | 2 | Sword. 3 damage, 4 hits + SP/2. Gain 1 SP for each different enemy you hit with a Sword this turn | 4 a hit | 24 + 3 = 27 / 23.75 | K† |
| **Storm of Glass** | R | 3 | Sword. 5 damage, 4 hits + SP/2 | 6 a hit | 40 / 35 | N |
| Thousand Shards | R | 2 | Sword. Spend any amount: 1 hit of 6 per SP. Consume | 7 a hit | 60 at 10 spent, more with Might / 100 | N† |
| Obsidian Drill | R | 3 | Sword. Spend any amount: 7 damage, 3 hits + 1 per SP | 8 a hit | 63 at 6 spent / 69 | K† |
| Call the Blade | U | 1 | Choose a Sword in your discard pile: to your hand. Gain 2 SP | Gain 3 | 4 + 6 = 10 / 11.2 | K |

| Hit harder | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Feint | C | 1 | 5 Barrier. 1 Primed | 7 Barrier | 6 + 6 = 12 / 10 | K† |
| Crowned Edge | U | 1 | Your next Sword this turn deals 2 more a hit. Draw 1 | 3 more | 10 + 3 = 13 / 11.2 | K† |
| **Heat of the Forge** | U | 1 | 2 Primed (restored; was 7) | 3 Primed | 12 / 11.2 | K |
| **Weight of the Crown** | U | 1, spends 2 SP | 1 Might. 1 Sapped on ALL (restored) | Spends 1 SP | 15 + 3 = 18 / 24.6 | K |
| **Soul of Steel** | R | 2 | 2 Might. Consume | Also 5 Barrier | 30 / 29.7 | N |
| **Whispering Edge** | R | 1 | Aura. Your Sword hits deal 1 more | Opening hand | 7.5 x 4 = 30 / 25 | N |

## Sword Auras

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Glass Guard | U | 1 | Aura. After your first Sword each turn: 4 Barrier | 6 Barrier | 19.2 / 16.8 | K |
| **Quenched Edge** | U | 1 | Aura. After your first card each turn that spends SP: 1 Primed | 2 Primed | 6 x 3 turns = 18 / 16.8 | N |
| **Tempered Focus** | R | 1 | Aura. Start of turn: 1 Primed | Opening hand | 6 x 4 = 24 / 25 | N |
| Cleaving Edge | R | 1 | Aura. Gain 2 SP. Your Blade strikes ALL enemies | Gain 3 | 6 + ~16 = 22 / 25 | K† |
| Echoing Blade | R | 2 | Aura. Your Blade is played one more time | Costs 1 | 30 x 2 swings = 60 / 47.5 | K† |
| Patient Edge | U | 1 | Aura. End of turn, if you spent no SP: gain 2 | Also 2 Barrier | 14.4 / 16.8 | N |

## Spells (12)

Priced at the amount spent in the rates table.

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Spellbolt | C | 1 | Spend any amount: 8 damage + 4 per SP | Base 11 | 24 / 28 | K† |
| Arcane Pulse | C | 1 | Spend any amount: 7 to ALL + 3 per SP | Base 9 | 24.7 / 28 | K† |
| Tempered Bolt | C | 1 | 7 damage. If you had 0 SP, gain 2 | Base 10 | 7 + 1.5 = 8.5 / 10 | N |
| Glassbrand | C | 1 | 5 damage. Apply 3 Fracture | Base 8 | 5 + 3.9 = 8.9 / 10 | N |
| Glass Burst | U | 1 | Spend any amount: 6 damage + 4 per SP. If 3+ spent, 1 Exposed and 1 Faltering | Base 9 | 22 + 6 = 28 / 31.4 | K† |
| Controlled Release | U | 1 | Spend any amount: 8 damage + 4 per SP. If you spent some and have SP left, draw 1 | Base 11 | 24 + 3 = 27 / 31.4 | N† |
| Falling Shards | U | 1 | Spend any amount: 9 damage + 4 per SP. If it dies, apply Fracture equal to the SP spent to every other enemy | Base 12 | 25 + 1.5 = 26.5 / 31.4 | K† |
| Molten Ruin | U | 2 | Spend any amount: 12 damage + 6 per SP | Base 18 | 48 / 51.5 | K |
| Arcane Flood | U | 2 | Spend any amount: 10 to ALL + 4 per SP | Base 14 | 44.2 / 51.5 | K† |
| Dying Ember | R | 2 | Spend any amount: 8 to ALL + 4 per SP. 2 Faltering on ALL | Base 11 | 41.6 + 9 = 50.6 / 57.5 | K† |
| Lava Bomb | R | 3 | Spend any amount: 20 damage + 8 per SP. Consume | Base 28 | 100 / 114 | K |
| Cataclysm | R | 3 | Spend any amount: 18 to ALL + 6 per SP. Consume | Base 24 | 101 / 114 | K† |

## Fracture (14)

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Faultline Hex | C | 1 | Apply 7 | Apply 9 | 9.1 / 10 | N |
| Spreading Fault | C | 1 | Apply 5 to ALL | Apply 7 | 8.5 / 10 | N† |
| Pressure Point | C | 1 | Apply 5. If this caused a Shatter, draw 1 | Apply 7 | 6.5 + 1.8 = 8.3 / 10 | N† |
| Glass Prison | C | 1 | 5 Barrier. Apply 3 | 7 Barrier | 6 + 3.9 = 9.9 / 10 | N |
| Crack the Shell | C | 1 | Remove up to 6 enemy Barrier. Apply 5 | Remove up to 10 | 2.4 + 6.5 = 8.9 / 10 | N |
| Hairline Crack | C | 0 | Apply 5. Consume | Apply 7 | 6.5 / 7.5 | N† |
| Stress the Glass | U | 1 | Spend any amount: apply 4 + 3 per SP | Base 6 | 20.8 / 31.4 (low: it rises with Shatter damage) | N† |
| Fault Memory | U | 1 | Apply 5. This card applies 2 more each play this fight | Starts at 7 | 6.5 + 3.1 = 9.6 / 11.2 | N |
| Final Shatter | U | 2 | Apply 10. If this caused a Shatter, 6 Barrier | Apply 13 | 13 + 5 = 18 / 21.3 | K |
| Collapsing Vein | U | 2 | Apply 7 to ALL, then 5 more to a chosen enemy | 9 to ALL | 11.9 + 6.5 = 18.4 / 21.3 | K† |
| Carry the Fault | U | 1 | Move all Fracture from one enemy to another, then apply 4 there. With one enemy, apply 8 | 6; 10 | 10.4 / 11.2 | N† |
| Deep Fault | U | 2 | Shatter damage +6 for the fight. Apply 4. Consume | +8 | 24 + 5.2 = 29.2 / 26.6 | N |
| Rupture Script | R | 2 | Apply 22. Consume | Apply 28 | 28.6 / 29.7 | N† |
| Breaking Point | R | 2 | Deal your Shatter damage to an enemy (not a Shatter), then apply 8. Consume | Apply 12 | 24 + 10.4 = 34.4 / 29.7 | N |

## Fracture Auras (5)

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Deepening Fault | U | 2 | Aura. After your first card each turn that applies Fracture: Shatter damage +2 | +3 | 28 / 32 | N |
| Hungering Void | U | 1 | Aura. End of turn: apply 3 to each enemy that has Fracture | Apply 4 | 14 / 16.8 | K† |
| Pillar of Glass | U | 1 | Aura. After your first card each turn that causes a Shatter: 4 Barrier | 6 Barrier | 15.4 / 16.8 | K† |
| Fault Reader | U | 1 | Aura. After your first card each turn that causes a Shatter: draw 1, 2 Barrier | 4 Barrier | 17.3 / 16.8 | N† |
| Glass Armory | U | 1 | Aura. After your first Sword each turn that follows a Spell: gain 2 SP | Gain 3 | 14.4 / 16.8 | K |

## Spell and generator Auras (6)

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Warm Anvil | U | 2 | Aura. Start of turn: gain 2 SP | Gain 3 | 24 / 32 (low; it compounds) | K |
| Sigil of Kindling | U | 1 | Aura. The first time each turn a card grows itself: gain 2 SP, 2 Barrier | Gain 3 | 16.8 / 16.8 | K† |
| Sigil of Glass | U | 1 | Aura. After your first card each turn that spends 3+ SP: 5 Barrier | 7 Barrier | 16.8 / 16.8 | K |
| Afterglow | U | 1 | Aura. After a card that spends your last SP, once a turn: draw 1, 3 Barrier | 5 Barrier | 13.2 / 16.8 | N† |
| Crucible Heart | R | 1 | Aura. The first time each turn a card grows itself, it grows 2 more | Opening hand | 17 / 25 (an engine piece) | N† |
| Measured Ruin | R | 2 | Aura. Your first Spell Attack each turn that spends SP deals 2 more per SP | 3 more | 34 / 47.5 | N |

## Defence and selection (9)

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Arcane Barrier | C | 1 | Spell. Spend any amount: 5 Barrier + 3 per SP | Base 8 | 20.4 / 28 | K |
| Glass Veil | C | 2 | Spell. 10 Barrier. Next turn, 6 Barrier | 13 | 18 / 19 | K |
| Glass Wall | U | 2 | Spell. Spend any amount: 12 Barrier + 3 per SP. Hold | Base 16 | 37 / 51.5 (held low: no cap on Barrier) | K |
| Mirror Glass | U | 1 | Spell. 7 Barrier. You may spend 2 SP: 1 Shielded | 10 Barrier | 15.6 / 21.3 | K |
| Ash Wind | U | 1 | Draw 3, discard 1 | Draw 4 | 9 / 11.2 | K |
| Recenter | U | 1 | Draw 2. If you played a Sword and a Spell earlier this turn, gain 2 SP | Draw 3 | 9.4 / 11.2 | N |
| Obsidian Aegis | R | 1 | Aura. End of turn: Barrier equal to half your SP | Half your SP + 3 | 19 / 25 | K† |
| Unbreakable Crown | R | 2 | Spell. 18 Barrier. 1 Steadfast. At 10+ SP, 8 more. Consume | 24 Barrier | 29 / 29.7 | K |
| Fated Hand | R | 1 | Choose 2 cards in your draw pile, put them on top in any order. Draw 2. Consume | Draw 3 | 13 / 15.6 | K† |

## What changed from the ChatGPT draft

**Added (7):** Heat of the Forge, Weight of the Crown, Storm of Glass, Soul of Steel, Whispering Edge, Quenched Edge, Tempered Focus.

**Removed to make room (5):** Read the Embers, Scheme, Hollow Gaze, Steady Inscription, Temper the Glass.

**Rebuilt for real power:** Cleaving Edge and Echoing Blade are back to changing the Blade itself. Thousand Shards deals 6 a hit (was 4). Obsidian
Drill deals 7 a hit (was 6).

**Why growing cards dropped:** Deepening Enchantment gains 2, not 3, and Growing Crucible 4, not 5. At their first numbers they priced 26-27% over.

**Why some Fracture numbers rose:** Spreading Fault, Pressure Point, Hairline Crack, Rupture Script, Collapsing Vein, Carry the Fault, Stress the
Glass, Hungering Void, Fault Reader, Afterglow and Sigil of Kindling all priced well under budget as drafted. Pillar of Glass priced over and fell
to 4 Barrier.

## Cut from the live pool (30, plus 3 tokens)

| Card | Why |
|---|---|
| Spoils, Crowned Fist, Tyrant's Stomp | Growth now lives on generators; big single hits belong to spells |
| Humble, Molten Weight, Seven Shards | Their jobs moved to Glass Burst, Dying Ember and Cataclysm |
| Ley Line, Sigil of Momentum, Hollow Form | They make Mana or free plays, which bypass the SP economy |
| Arcane Burst, Weigh the Crown, Endless Barrage, By Decree, Iron Rule, Distant Ember, Tyrant's Gaze, Hex Volley, Grand Speech | Regent copies with no tie to these plans; Grand Speech was replaced by Soul of Steel |
| Read the Embers, Scheme, Hollow Gaze | Regent copies; made room for the Might and Primed cards |
| Magma Crash | Rubble goes |
| Out of My Sight!, To Arms!, Call the Guard! | Retainers go |
| Royal Decree, Wild Spark, Sigil of Wandering, Rift Gifts, Heirloom Maul | Neutral cards go |

**Tokens:** Retainer Strike, Retainer Dive, Retainer Guard.

## Balance checks

**Boss turn: 12 SP, 3 Mana, no Auras**

| Plan | The turn | Damage | SP left |
|---|---|---|---|
| Sword | Heat of the Forge, Blade: 7 hits of 7 | 49 | 12 |
| Sword with 2 Might | The same | 63 | 12 |
| Spell | Molten Ruin on 12 (84), Spellbolt on 0 (8) | 92 | 0 |
| Fracture | Shatter at 24: Faultline Hex and Final Shatter on 6 Fracture, plus 6 Barrier | 48 | 12 |

**Over four turns from 12 SP.** Both decks are assumed to have the same cards in hand every turn, which flatters both. The Sword deck plays Blade and
Obsidian Lance and gains only the trait's 1 SP. The spell deck plays Molten Ruin on everything, then a 3-SP generator and Molten Ruin each turn after.

| Turn | Sword, no Might | Sword, 2 Might | Spell |
|---|---|---|---|
| 1 | 47 | 63 | 92 |
| 2 | 47 | 63 | 36 |
| 3 | 53 | 71 | 36 |
| 4 | 53 | 71 | 36 |
| **After 3 turns** | **147** | **197** | **164** |
| **After 4 turns** | **200** | **268** | **200** |

Spell wins a short fight. A plain Sword deck draws level on the fourth turn, and one Might card puts it clearly ahead, so Might is the Sword deck's
payoff, as you asked.

**Ceilings at 27 SP** (ChatGPT's own turn-six setup), against an Arena opponent's 540 HP, Exposed already on:

| Setup | Turn | Damage | Share |
|---|---|---|---|
| Sword | 3 Might, Echoing Blade: Blade twice, 14 hits of 8 each | 336 | 62% |
| Sword finisher | 3 Might: Thousand Shards on 27, 27 hits of 9 | 365 | 68% |
| Spell | Lava Bomb on 27 | 354 | 66% |
| Spell with Measured Ruin | The same, 10 per SP | 435 | 81% |
| Fracture | Shatter at 27: Stress the Glass on 27 (85 Fracture), then a Faultline Hex | 243 | 45% (Barrier stops it) |

**Uncapped checks:**
- **Arena:** an 81% turn is what no caps allows. The opponent can watch SP climb to 27, but nothing but pressure stops it. This is the first number to watch in play.
- **Long hit counts:** 14-27 hits a card. These need the grouped animation, or a big swing will drag.
- **Barrier stalling:** Glass Wall on 27 SP is 93 Barrier for 2 Mana, and Obsidian Aegis gives 13 a turn with no spend. Both are held below budget for this reason.
- **Echoing Blade:** it priced 26% over at 60 / 47.5. I left it there because you asked for real power; five copies would each add a replay, so check it first.
- **Whispering Edge:** 30 / 25, also left over budget on purpose.

**Loops:** nothing returns itself or makes Mana. Growing cards still need Mana and a draw for each play. Shatters gain no SP on their own, and no
Shatter applies Fracture.

## If approved, what building it takes

- **Engine:** a choose-an-amount step on play (the UI, the action, previews and the PvP server); Fracture, Shatter and owner-wide Shatter damage; a
  Sword and Spell tag; "1 per N SP" hits; per-physical-card growth with the copy and replay rules; a "previous card" metric; card-finished triggers.
- **Content:** one SP pool (`stars` stays underneath); the Blade reads it; `forge` stays for the Drunkard's Precision.
- **Saves:** cut cards map to the nearest kept card; `CLASS_REWORKS` and `RULES_VERSION` bumps; Vault and Arena decks follow.
- **Tests and art:** a scenario for each card; rules tests for Fracture, spending and growth; placeholder art for 38 new cards.
- **Costing guide:** the rates above replace its stale Arcana and Sharpen notes for her.
