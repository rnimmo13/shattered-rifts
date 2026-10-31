# Spellblade rework: Spell Power and Fracture (proposal for Robert's review, 2026-10-31)

Nothing here is built. Prices are hand-worked from `docs/14_CARD_COSTING.md` and are a first pass; no sim was run. Card ids stay the
same on reworked cards, so art and saves survive.

**The rule that holds the class together:** swords reward holding Spell Power, spells reward spending it, and Fracture rewards building
pressure on a target.

**The pool:** 87 cards, plus the Obsidian Blade (listed apart, as it is today). The other classes hold 81-97; she holds 82 now.

| | Basic | Common | Uncommon | Rare | Total |
|---|---|---|---|---|---|
| Live now | 2 | 20 | 36 | 24 | 82 |
| This proposal | 3 | 24 | 35 | 25 | 87 |

**What changes:** 49 live cards stay (25 keep their effect, 24 change), 33 are cut, 38 are new. 17 are Auras (16 now). The Retainer
tokens and Rubble go too.

## The rules

| Rule | Exactly |
|---|---|
| **Spell Power** | One number on the blade; replaces both Arcana and Sharpen. Every fight starts with 3. It lasts the fight and has no cap. |
| **Imbue N** | Gain N Spell Power. |
| **Spells** | A ◆ cost spends Spell Power. Swinging a Sword spends nothing. |
| **Sword** | A tag on the card. Its hits grow with Spell Power, rounded down, and **no Sword goes past 8 hits**. |
| **Fracture** | A mark on an enemy. It stays until it shatters. Applying it needs no Spell Power unless the card says so. |
| **Shatter** | When an enemy reaches 10 Fracture, remove 10 and deal 12 damage to it; the rest stays. Repeat if it still has 10. |
| **What a Shatter is** | Not an attack: no Might, Exposed or Thorns. Barrier stops it, so an Arena opponent who sees 8 Fracture can block. It never applies Fracture or sets off another Shatter. |
| **Deepen N** | Your Shatters deal N more for the rest of the fight. This is how the plan scales against bosses. The threshold never drops. |
| **Growing cards** | "Grows N": this copy Imbues N more each time you play it this fight. Other copies do not grow. No growing card costs 0 or returns itself. |

**Trait, Kindled:** at the start of your turn, Imbue 1. (It was 1 Arcana and Sharpen 1; the two merge.)

**Starter (10):** 3 Strike, 3 Defend, Cinderfall, Gather Power, Hairline Crack, Obsidian Blade. One Strike makes way, so every run sees
Fracture from turn 1.

**Obsidian Blade (2 Mana, Sword, Hold, Opening hand):** 6 damage, 1 hit + 1 per 2 Spell Power. Upgrade: 7 a hit.
Priced at 7 Spell Power: 4 hits, 24, against a budget of 22.5.

| Spell Power | 3 | 4 | 6 | 8 | 12 | 14+ |
|---|---|---|---|---|---|---|
| Hits | 2 | 3 | 4 | 5 | 7 | 8 |
| Damage | 12 | 18 | 24 | 30 | 42 | 48 |

### New prices (to add to the costing guide if approved)

| Thing | Rate | Why |
|---|---|---|
| Imbue | **3** a point | 1 Arcana (2.5) and Sharpen 3 (2.4) were already level, and a point can serve the blade and then a spell. |
| Spent ◆ | **6** a point, as now | 1 point held is 3 a swing, so spending it breaks even with two swings left. |
| Reading Spell Power | priced at **7** held, then checked at 14 | The mid-fight number for a deck that holds it. |
| Fracture | **1** a point, **1.3** to ALL | 10 becomes 12 damage, less about 20% for the delay and for Barrier. |
| Deepen | **3** a point | About three Shatters left when it is played. |
| Grows N | **N x 3.6** | The guide's growth rate (N x 1.2) on Imbue's 3. |

## Sword: hold Spell Power and hit many times

"SP/2" means 1 more hit per 2 Spell Power. Points are at 7 Spell Power. K = kept effect, C = changed, N = new.

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Obsidian Flurry | C | 2 | Sword. 4 damage, 3 hits + SP/3 | 5 a hit | 20 / 19 | C |
| Forged in Fury | C | 1 | Sword. 4 x2. Imbue 1 | 5 x2 | 11 / 10 | C |
| Glass Rake | C | 1 | Sword. 2 damage, 2 hits + SP/2 | 3 a hit | 10 / 10 | N |
| Flicker Cut | C | 0 | Sword. 2 damage, SP/2 hits | 3 a hit | 6 / 6 | N |
| Edge Guard | C | 1 | Sword. 3 x2. 4 Barrier | 4 x2, 5 Barrier | 10.8 / 10 | N |
| Feint | C | 1 | 6 Barrier. 1 Primed | 8 Barrier | 11.2 / 10 | C |
| Glass Skin | C | 1 | 5 Barrier, +1 per 2 Spell Power (at most +8) | 7 Barrier | 9.6 / 10 | N |
| Bladewall | U | 2 | 12 Barrier. Imbue 3 | 15, Imbue 4 | 23.4 / 21.3 | C |
| Crowned Edge | U | 1 | Imbue 1. Your Blade deals double to the target this turn | Imbue 2 | ~12.6 / 11.2 | C |
| Call the Blade | U | 1 | Blade to your hand from anywhere. Imbue 2 | Imbue 3 | 10 / 11.2 | C |
| Heat of the Forge | U | 1 | 3 Primed (was 7) | 4 Primed | 13.5 / 11.2 | C |
| Whirling Glass | U | 2 | Sword. 4 to ALL, 2 hits + SP/3 | 5 a hit | 20.8 / 21.3 | N |
| Hollow Draw | U | 1 | Sword. 4 damage; at 8+ Spell Power, 3 more hits | 5 a hit | 11.2 / 11.2 | N |
| Grand Speech | U | 0 | This turn, whenever you play a card: 1 Might until your turn ends | Hold | ~6 / 6.7 | K |
| Glass Guard | U | 1 | Aura. Whenever you play a Sword: 3 Barrier | 4 Barrier | 17.3 / 16.8 | C |
| Warm Anvil | U | 1 | Aura. Start of turn: Imbue 1 | Opening hand | 12 / 16.8 (low; it compounds) | C |
| Keen Resonance | U | 1 | Aura. Your first Sword each turn has 1 more hit | Opening hand | 20 / 16.8 | N |
| Hammer and Anvil | R | 1 | Imbue 1, +1 per 2 times the target was hit this turn (at most +3). 5 damage | 7 damage | ~14 / 12.5 | C |
| Obsidian Drill | R | X | Sword. 8 damage X times; at X 4+, X times again | X+1 | as now | K |
| Storm of Glass | R | 3 | Sword. 6 damage, 3 hits + SP/2 | 7 a hit | 36 / 35 | N |
| Whispering Edge | R | 1 | Aura. Your Sword hits deal 1 more | Opening hand | 24 / 25 | N |
| Cleaving Edge | R | 1 | Aura. Imbue 2. Your Blade strikes ALL enemies | Imbue 3 | as now | C |
| Echoing Blade | R | 2 | Aura. Your Blade plays again with half its hits (was a full replay) | Costs 1 | as now, trimmed | C |
| The Forgemaster | R | 1+4◆ | Imbue 12 | Imbue 15 | 36 / 42 | C |

## Spell burst: spend it for big damage now

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Cinderfall | Basic | 0+2◆ | 8. 1 Faltering. 1 Exposed | 12 | 14 / 14 | K |
| Arcane Pulse | C | 0+3◆ | 6 x2 to ALL | 8 x2 | 15.6 / 24 (a group card) | K |
| Spellbolt | C | 1+2◆ | 12. Next turn, draw 2 extra | 13, draw 3 | 19 / 22 | K |
| Arcane Barrier | C | 0+1◆ | 7 Barrier | 10 Barrier | 8.4 / 12 | K |
| Molten Ruin | U | 1+4◆ | 35 | 45 | 35 / 38 | K |
| Glass Burst | U | 0+3◆ | 13. 2 Faltering. 2 Exposed | 18 | 25 / 27 | K |
| Obsidian Lance | U (was C) | 1 | Spend up to 10 Spell Power: 6 damage each, one hit | 7 each | 24 at 4 spent, 60 at 10 | C |
| Falling Shards | U | 0 | Spend all: 5 to a random enemy, once each | 7 | 18 at 4 spent | K |
| Final Edge (was Final Shatter) | U | 3 | 30. If fatal: Imbue 5 | 38 | 32 / 31.4 | C |
| Ley Line | U | 0+3◆ | Gain 2 Mana | 3 Mana | 14 / 27 | K |
| Mirror Glass | U | 1+3◆ | 15 Barrier. Until your next turn, attack damage it soaks returns to the attacker | 20 | as now | K |
| Glass Wall | U | 0+2◆ | 9 Barrier. Returns to your hand | 12 | as now | K |
| Sigil of Glass | U | 1 | Aura. Whenever you spend Spell Power: 2 Barrier each | 3 each | ~19 / 16.8 | K |
| Hungering Void | U | 1 | Aura. Whenever you gain or spend Spell Power: 2 to ALL (was 3; the trait sets it off every turn) | 3 to ALL | 20.8 / 16.8 | C |
| Lava Bomb | R | 0+5◆ | 33. 3 Faltering. 3 Exposed | 44 | 51 / 45 | K |
| Dying Ember | R | 1+3◆ | 9 to ALL. 9 Sapped on ALL for their next turn. Fleeting | 11 | as now | K |
| Seven Shards | R | 2+7◆ | 7 x7 to ALL | Costs 1 | as now | K |
| Cataclysm | R | 1+4◆ | 28 to ALL (was 1 Mana, 21, Rubble) | 34 | 36.4 / 42 | C |
| Black Glass Requiem | R | 1 | Spend all (at most 16): 4 each to ALL. Consume your Obsidian Blade | 5 each | 36 at 7; 83 at 16 | N |
| Obsidian Aegis | R | 1+5◆ | Aura. 8 Plating | 11 | as now | K |

## Spell Power generators: every deck needs these

| Card | Rarity | Mana | Text | Upgrade | Points / budget | |
|---|---|---|---|---|---|---|
| Gather Power (was Gather Arcana) | Basic | 1 | Imbue 2 | Imbue 3 | 6 / 6 | C |
| Emberstrike | C | 1 | 8 (was 9). Imbue 1 | 9, Imbue 2 | 11 / 10 | C |
| Pale Ward | C | 1 | 7 Barrier (was 8). Imbue 1 | 10 Barrier | 11.4 / 10 | C |
| Faint Ember | C | 1 | Imbue 1. Draw 1. Next turn, draw 1 extra | Imbue 2 | 9.5 / 10 | K |
| Etch the Edge (was Whetstone) | C | 1 | Imbue 2. Next turn, 1 extra Mana | Imbue 3 | 10 / 10 | C |
| Arcane Insight (was Spoils) | C | 1 | Imbue 1. Draw 2 | Imbue 2 | 10 / 10 | C |
| **Kindling Rite** | C | 1 | Imbue 2. Grows 1 | Imbue 3 | 9.6 / 10 | N |
| **Deep Well** | U | 1 | 6 damage. Imbue 1. Grows 1 | 9 damage | 12.6 / 11.2 | N |
| Shard Strike | U | 1 | 6 (was 8). Imbue 2. Goes on top of your draw pile | 9 | 12 / 11.2 | C |
| Arcane Flood | U | 0 | 3 to ALL per Spell Power gained this turn | 4 | ~7.8 / 6.7 | K |
| **Ember Reliquary** | R | 2 | Imbue 4. Grows 2. Hold | Imbue 5 | 20.2 / 23.75 | N |
| Magma Surge | R | 0 | Draw 1. 1 Mana. Imbue 2. Consume | Opening hand | as now | C |
| Sigil of Kindling | R | 2 | Aura. Start of turn: Imbue 2 | Imbue 3 | 24 / 47.5 (low, kept) | K |
| Ember Recoil | R | 1 | Aura. Whenever a card spends Spell Power: Imbue 1 (at most 2 a turn) | Opening hand | 18 / 25 | N |

## Fracture: build marks, then set off Shatters

All 24 cards are new. Points are at 7 Spell Power where a card reads it.

| Card | Rarity | Mana | Text | Upgrade | Points / budget |
|---|---|---|---|---|---|
| Hairline Crack | Basic | 1 | Apply 7 Fracture | 10 | 7 / 7.5 |
| Faultline Hex | C | 1 | Apply 10 | 14 | 10 / 10 |
| Splinter Cut | C | 1 | 6 damage. Apply 4 | 8, apply 5 | 10 / 10 |
| Etching Edge | C | 1 | Sword. 2 x3. Each hit applies 1 | 3 x3 | 9 / 10 |
| Cracked Ward | C | 1 | 6 Barrier. Apply 3 | 8, apply 4 | 10.2 / 10 |
| Stress the Glass | C | 0+1◆ | Apply 10 | 13 | 10 / 12 |
| Spreading Fault | U | 1 | Apply 6 to ALL, 3 more to those already Fractured | 8, 4 more | 10.1 / 11.2 |
| Stress Fracture | U | 2 | 11 damage. Apply 10 | 14, apply 12 | 21 / 21.3 |
| Scoring Edge | U | 1 | Sword. 2 damage, 2 hits + SP/3. Each hit applies 1 | 3 a hit | 12 / 11.2 |
| Resonant Hex | U | 1 | Apply 4 + your Spell Power (nothing spent) | 7 + | 11 / 11.2 |
| Breaking Point | U | 1 | 6 damage, +1 per Fracture on the target (none removed) | 8 + | 11 / 11.2 |
| Widen the Cracks | U | 1 | Deepen 3. Apply 2 | Deepen 4 | 11 / 11.2 |
| Trace the Flaw | U | 1 | Foresee 3. Apply 5 | Apply 8 | 10 / 11.2 |
| Glass Prison | U | 1 | 6 Barrier; 6 more if you caused a Shatter this turn | 8, 8 more | 11.5 / 11.2 |
| Deepening Fault | U | 1 | Aura. The first time each turn you apply Fracture: Deepen 1 | Opening hand | 15 / 16.8 |
| Shard Rain | U | 1 | Aura. Whenever you cause a Shatter: 3 to ALL | 4 to ALL | 20 / 16.8 |
| Aftershock | U | 1 | Aura. Whenever you cause a Shatter: Imbue 1 | Opening hand | 15.6 / 16.8 |
| Fractal Edge | R | 2 | Sword. 3 damage, 2 hits + SP/2. Each hit applies 2 | 4 a hit | 25 / 23.75 |
| Sundered Glass | R | 3 | Apply 34 | 42 | 34 / 35 |
| Breaking Strain | R | 0 | Bring the target to its next 10 (at most 9 added). Draw 1. Consume | Hold | ~8 / 7.5 |
| Hollow Collapse | R | 1 | Spend up to 12 Spell Power: apply 4 each | 5 each | 16 at 4 spent, 48 at 12 |
| Heart of the Fault | R | 2 | Aura. Start of turn: Deepen 3 | Deepen 4 | 39 / 47.5 |
| Resonant Cascade | R | 3 | Aura. Your first Shatter each turn happens twice | Costs 2 | ~64 / 70 |
| Spreading Lattice | R | 1 | Aura. Start of turn: apply 3 to ALL. When a Fractured enemy dies, its Fracture passes to all the others | Apply 4 | 20 / 25 |

## Utility, shared by every plan

| Card | Rarity | Mana | Text | Upgrade | |
|---|---|---|---|---|---|
| Humble | C | 0 | 1 Faltering. 1 Exposed. Consume | No Consume | K |
| Molten Weight | C | 1 | 8 to ALL. 1 Sapped on ALL for their next turn | 9, 2 Sapped | K |
| Glass Veil | C | 2 | 11 Barrier. Next turn, 5 Barrier | 13, 7 | K |
| Ash Wind | U | 1 | Draw 3. Put a card from your hand on top of your draw pile | Draw 4 | K |
| Fated Hand | R | 1 | Choose 2 cards in your draw pile, put them on top. Next turn, draw 2 extra | 3 and 3 | K |

## How each build wins

| Build | How it wins | Key cards | Weakness |
|---|---|---|---|
| **Flurry** | Holds Spell Power, swings many times | Blade, Storm of Glass, Whispering Edge, Cleaving Edge, Primed and Might | The hit cap; flat Barrier soaks small hits |
| **Sorcery** | Generates and spends on single big hits, with Exposed | Molten Ruin, Lava Bomb, Obsidian Lance, Ember Recoil | Its Blade stays weak; it runs dry after a big turn |
| **Spellblade** | Swings at full power, then spends it all in the same turn | Blade, Kindling Rite, Lance, Requiem | The highest ceiling, but it needs both halves in hand |
| **Fracture** | Builds marks and crosses thresholds deliberately | Faultline Hex, Heart of the Fault, Resonant Cascade | Slow start; Barrier stops Shatters |
| **Sword-Fracture** | Multi-hit swords that also crack the target | Fractal Edge, Scoring Edge, Etching Edge | Thin on damage until the Fracture pays |
| **Caster-Fracture** | Spends Spell Power to force a decisive Shatter turn | Stress the Glass, Hollow Collapse, Aftershock | Spending weakens its Swords |
| **Glass Ward** | Survives, then wins late with whichever engine it grew | Glass Skin, Mirror Glass, Glass Prison, Glass Guard | Slowest clock |

## Balance checks

**Boss check, turn 4-5, 3 Mana** (the reverted Imbue rework failed here: its charges were worth at most about 7):

| Build | The turn | Damage |
|---|---|---|
| Sword | 12 Spell Power: Blade 42, Glass Rake 16 | 58 |
| Spell | 8 Spell Power: Molten Ruin 35, Obsidian Lance on the last 4 (24), one more card | 59+ |
| Fracture | Deepen 6 (Shatter 18): three cards applying 10 each | 54, and more each turn |

**Ceilings** against an Arena opponent's 540 HP:

| Setup | Turn | Damage |
|---|---|---|
| Sword, Echoing Blade out | 12 Spell Power, 2 Might, Heat of the Forge, Exposed, Blade | ~163 (30%) |
| Mix | 14 Spell Power: Humble, Blade 72, Lava Bomb 50, Lance on 9 (81) | ~203 (38%) |
| Fracture | Heart of the Fault and Resonant Cascade out, Deepen 9 (Shatter 21): Hollow Collapse on 12 (48), two Faultline Hexes: 68 Fracture, 6 Shatters and the Cascade's repeat | ~147 (27%), and Barrier stops it |

The 38% is the one to watch: it needs 14 held, four exact cards and a visible number the opponent has watched climb. I would accept it
for now, because you asked for high ceilings, and lower Obsidian Lance's limit first if it proves too much.

**Loops:** no Shatter applies Fracture. Stress the Glass plus Ember Recoil and Aftershock gains Spell Power, but each play spends a card
from hand and Recoil stops at 2 a turn. Glass Wall plus Recoil still loses 1 Spell Power a play.

**Multipliers to test first in play:** Crowned Edge (double Blade), Grand Speech on many hits, Primed on many hits, Cleaving Edge with
Echoing Blade.

**Tiers:** Shatter is flat, so Deepen has to carry it at high Tiers. Check Heart of the Fault against Tier X numbers.

## Cards cut (33, plus 4 tokens)

| Card | Rarity | Why |
|---|---|---|
| Magma Crash | C | Rubble goes |
| Out of My Sight! | C | Retainers go |
| Glint | C | A Regent copy; Ash Wind and Arcane Insight do its job |
| Hollow Gaze | C | A Regent copy with no tie to any plan |
| Ember Cache | C | A Regent copy; Etch the Edge and Kindling Rite do its job |
| Tyrant's Stomp | U | A Regent copy; spells now own big single hits |
| Crowned Fist | U | Growth now lives on generators |
| Tyrant Strike | U | A Regent copy; no tie to any plan |
| Weight of the Crown | U | Might is on Grand Speech and Whispering Edge now |
| Arcane Burst | U | A plain gain with no decision once points also read on the blade |
| Hex Volley | U | Rewards Skills, which no plan asks for now |
| Collapsing Vein | U | Created cards go |
| Sigil of Momentum | U | A Regent copy; no tie to any plan |
| Distant Ember | U | A Regent copy; rewards 5-card turns, which no plan asks for |
| Pillar of Glass | U | Created cards go |
| Sigil of Wandering | U | Neutral cards go |
| To Arms! | U | Retainers go |
| Royal Decree | U | Neutral cards go |
| Scheme | U | A Regent copy; Spellbolt and Faint Ember give next-turn draw |
| Read the Embers | U | A Regent copy; Ash Wind covers big draw |
| Wild Spark | U | Neutral cards go |
| Banked Embers | U | A Regent copy; Etch the Edge gives next-turn Mana |
| Weigh the Crown | R | A Regent copy, random and hard to plan around |
| Endless Barrage | R | A Regent copy; no tie to any plan |
| Heirloom Maul | R | Copies Neutral cards, which go |
| By Decree | R | Rewards Skills, which no plan asks for now |
| Glass Armory | R | Created cards go |
| Tyrant's Gaze | R | A Regent copy; no tie to any plan |
| Iron Rule | R | A Regent copy; no tie to any plan |
| Hollow Form | R | A Regent copy (its Void Form) |
| Rift Gifts | R | Neutral cards go |
| Call the Guard! | R | Retainers go |
| Unbreakable Crown | R | A Regent copy; no tie to any plan |

**Tokens:** Retainer Strike, Retainer Dive, Retainer Guard, Rubble.

## If approved, what building it takes

- **Engine:** a Fracture status with the Shatter threshold and event, Deepen, a Barrier-respecting non-attack damage source, a per-hit
  "applies Fracture" option, a hit cap and "per 2" on scaled hits, "this copy grows" on Imbue. The `stars` resource, its metric and the
  `arcana` spend trigger already exist.
- **Content:** the Blade reads Spell Power; `forge` leaves her cards but stays for the Drunkard's Precision.
- **Saves:** cut cards map to the nearest kept card, a `CLASS_REWORKS` bump, a `RULES_VERSION` bump; Vault and Arena decks go through
  the same mapping.
- **Tests and art:** a scenario for each new card, rules tests for Fracture; 38 new cards use placeholder art.
- **Text:** Arcana and Sharpen wording across her tips, trait and How to play. The word "Shatter" sits beside Ice Shatter, Shattering
  Call and the Neutral Shatter Strike, none of which cause one.
