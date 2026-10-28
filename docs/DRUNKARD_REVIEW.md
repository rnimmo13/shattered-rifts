# Drunkard review: balance by the card costing guide (proposal, 2026-10-28)

**Status: applied 2026-10-28 (DECISIONS #393).** Robert: "lets make the balance changes, add stagger mechanic with cards that use it, cut how many shells he gets, hangover raise the drinks number. make sure he has enough utility in the deck". Everything in §2-§3 is in, plus:

- **Stagger** (§5 idea 1): a card tag. A Stagger card's damage lands on a random enemy (the card needs no target) and it hits about
  15% harder than an aimed card. Its text starts "Stagger." and the keyword tip explains it. Six cards, all in the Hangover build
  path:

  | Card | Cost, type, rarity | Text | Points / budget |
  |---|---|---|---|
  | Haphazard Hook | 0, Attack, common | Stagger. 7 to a random enemy. | 6.3 / 6 |
  | Drunken Lurch | 1, Attack, common | Stagger. 12 to a random enemy. | 10.8 / 10 |
  | Stumble | 1, Attack, uncommon | Stagger. 9 to a random enemy, 4 Barrier, 2 Hangover. | 9.9 / 11.2 |
  | Free-for-All | 2, Attack, uncommon | Stagger. 7 to a random enemy, 3 times. | 18.9 / 21.3 |
  | Drunken Master | 1, Aura, uncommon | Whenever you play a Stagger card: gain 2 Barrier. | 1.0x |
  | Blind Drunk | 2, Attack, rare | Stagger. 6 to a random enemy twice, and once more per Hangover. | ~27 / 23.8 at 3 Hangover |

- **Utility** (glue, any build path):
  - **Rummage the Bin** (0, common): Foresee 3. He had no way to dig.
  - **Sway** (1, uncommon): 7 Barrier, draw 1.
- **His utility now:**
  - Draw: Reload, Pump Action, Dumpster Dive, Chaser, One for the Road, Sob Story, Liquid Dinner, Bottoms Up, Ricochet, Bottomless
    Flask, Sway.
  - Card selection: Rummage the Bin.
  - Mana: Liquid Lunch, Chaser, Hair of the Dog, Bottoms Up, Last Call.
  - Barrier: Pane Up, Window Pane, Glass Cover, Black Out, Sway, Stumble, the Barrier Auras.
  - Debuffs: Brittle, Faltering, Exposed (Dead Eye to all).
  - Getting cards back: Pick Up the Brass.
- **Bar Stool** moved to uncommon at 7 (+1 per 6% missing), to make room for the two Stagger rares.
- **Rarity:** 22 commons, 36 uncommons, 28 rares.
- **Upgrades:** Sway+ has a hand-written upgrade (10 Barrier). Last Call+ costs 2 less Hangover instead of 1 less Mana, since Last Call
  is now 1 Mana.

Every number is from `docs/14_CARD_COSTING.md`: a card's points against the budget for its cost and rarity, fine within ±15%.
**Budgets:** 0 Mana 6, 1 Mana 10, 2 Mana 19, 3 Mana 28 for a common; uncommon x1.12, rare x1.25; basics 70-90% of a common; Consume
x1.25. An Aura's 4-turn total: about 1.5x its cost's common budget for an uncommon, 2x for a rare.

## 0. The short answer

Unlike the Monk, the Drunkard isn't too strong overall. He's uneven:

- **Shells are over.** A Buckshot Shell is a free card that hits every enemy for 4. Load Shells (3 of them for 1 Mana), Shell Game (one
  every turn, at common), One More Round and Ironsights hand out too many.
- **Most Hangover cards are under.** A drink pays its Hangover in HP, and the guide prices HP at 1.5 a point. So Barroom Brawl (10 to
  all, 3 Hangover, 2 Mana), One for the Road and Swig cost more than they give.
- **A handful of self-damage Auras are far over:** Glass Jaw, The Glass Palace and Dutch Courage.
- **Several Gun Auras are under:** Scope, Trigger Discipline and Gunmetal Soul.

The trait, **Clutch Genes** (50% more attack damage at half HP or below), is fine: it only works when he's in trouble.

## 1. New rates, added to the guide

| Effect | Points | Why |
|---|---|---|
| **Sharpen the Old Twelve Gauge** | **2.5** a point | The Gun costs 1, hits every enemy (x1.3), Holds, and comes round about 2-3 times a fight; Sharpen pays on every shot. The Obsidian Blade's 0.8 is for a 2-cost, single-target weapon that comes back less. |
| **A Buckshot Shell** (0, 4 to ALL, Consume) | **5.2** | Like a Dagger (4), but it hits every enemy. |
| **Hangover N** (lose N HP next turn, never the last) | **-1.5** a stack | It is HP, the guide's rate. Its payoffs (Bottle to the Head, Haymaker, Bender) are priced on a stack already being there (~3). |
| "+1 per N% HP missing" | at **30%** missing | Mid-fight; the Hangover deck runs lower. |

## 2. Number changes

### Over budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Pane Up (1, basic) | 6 (+1 per 11% missing) Barrier | **5** (+1 per 11%) | 10.4 → 9.2 (basic 7-9) |
| Load Shells (1, common) | 3 Shells | **2 Shells** | 15.6 → 10.4 |
| Shell Game (1, common Aura) | a Shell every turn | **uncommon** | 21 (a common Aura is ~12) → 1.4x an uncommon's; the Assassin's Bottomless Sleeves (a Dagger a turn) is 1.6x |
| Powder Load (0, common, Consume) | Sharpen 4 | **Sharpen 3** | 10 → 7.5 / 7.5 |
| Gun Oil (1, common Aura) | each gun: 4 Barrier | **3 Barrier** | 19 → 14 |
| Ironsights (1, rare, Consume) | Sharpen 5, 2 Shells | **Sharpen 3** | 23 → 18 / 15.6 |
| The Twelve-Gauge Opera (2, rare Aura) | Sharpen 6; each gun: Sharpen 2, 4 Barrier | each gun: **Sharpen 1, 3 Barrier** | 1.4x → 1.0x |
| Hot Brass (1, rare Aura) | each card consumed: 2 Barrier, Sharpen 1 | **1 Barrier** | 1.5x → 1.1x |
| One More Round (3, rare Aura) | each turn: 3 Shells, heal 3 | **2 Shells** | 1.4x → 1.1x |
| Hair of the Dog (0, uncommon, Consume) | clear Hangover, 1 Mana, draw 1, 2 Hangover | **no draw** | 11.5 → 8.5 / 8.4 |
| Liquid Dinner (1, uncommon, Consume) | heal 4 (+1 per 5% missing), draw 1 | **heal 2** | 18 → 15 / 14 |
| Dutch Courage (1, uncommon Aura) | each turn end: Barrier = 2x Hangover | **= your Hangover** | 1.9x → 1x |
| The Glass Palace (3, rare Aura) | each turn: 6 (+1 per 6%) Barrier; self-damage: 5 to ALL | **3** (+1 per 6%) Barrier; **3 to ALL** | 1.6x → 1.1x |
| Glass Jaw (1, rare Aura) | self-damage: 4 to ALL, 3 Barrier | **2 Mana**, 3 to ALL, 2 Barrier | 2.6x → 1.0x |
| Whiskey Miracle (1, rare, Consume) | heal 15 | **heal 10** | 22.5 → 15 / 15.6 (healing carries through the run) |

### Under budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Rack the Slide (1, common) | Sharpen 3 | **Sharpen 4** | 7.5 → 10 |
| Scope (1, uncommon Aura) | each turn: Sharpen 1 | **Sharpen 2** | 0.5x → 0.9x (Sharpen is worth less late) |
| Trigger Discipline (2, rare Aura) | each Attack: Sharpen 1 | **1 Mana** | 0.5x → 0.9x |
| Gunmetal Soul (2, rare Aura) | each turn end: Sharpen 1, 3 Barrier | **1 Mana** | 0.6x → 1.2x |
| Shard Toss (1, common) | 4 to ALL, 1 Brittle to ALL | **6 to ALL** | 6.2 → 8.8 |
| Birdshot (0, common, Consume) | 3 to ALL | **6 to ALL** | 3.9 → 7.8 / 7.5 (it was worse than the free Shell) |
| Molotov Cocktail (1, uncommon Trap, summon) | 12 to ALL, 1 Brittle | **0 Mana** | 6.6 against 11.2 → against 6.7 (as the Trickster's False Floor) |
| Sawn-Off (1, uncommon) | 7 to ALL, lose 2 HP | **9 to ALL, lose 1** | 6 → 10.2 |
| Spray and Pray (2, uncommon) | 4 (+1 per 4 cards made) to ALL | **10 (+1 per 2)** | 8.5 → 19.5 |
| Boomstick (3, rare) | 12 (+2 per consumed) to ALL | **14** | 28.6 → 31 |
| Fire in the Hole (2, rare) | 6 (+1 per 2 consumed) to ALL | **12 (+1 per consumed)** | 11 → 22 |
| Scattergun Symphony (2, rare Aura) | each Shell: 2 to ALL | **1 Mana, 3 to ALL** | 0.4x → 1.15x |
| Ricochet (2, rare Aura) | each Shell: draw 1 | **1 Mana** | 0.55x → 1.05x |
| One for the Road (0, common, Consume) | draw 2, 3 Hangover | **draw 3** | 2.5 → 6.5 / 7.5 |
| Drunken Swing (1, common) | 12, 3 Hangover | **14** | 7.5 → 9.5 |
| Smash the Pane (2, uncommon) | 8 (+1 per 4% missing) | **12** | 15.5 → 19.5 |
| Swig (0, uncommon, Consume) | 3 Might this turn, 3 Hangover | **4 Might, 2 Hangover** | 3 → 7 / 8.4 |
| Barroom Brawl (2, uncommon) | 10 to ALL, 3 Hangover | **16 to ALL, 2 Hangover** | 8.5 → 17.8 |
| Bottoms Up (1, rare, Consume) | 2 Mana, draw 2, 6 Hangover | **4 Hangover** | 12 → 15 / 15.6 |
| Last Call (2, rare, Consume) | +1 Mana a turn from next turn, 4 Hangover | **1 Mana** | 15 against 30 → against 15.6 (it also Consumes, unlike Deep Pockets and Inner Furnace at 2) |
| Rock Bottom (2, rare Aura) | 2 Might; lose 1 HP each turn | **1 Mana** | 0.66x → 1.25x (Might adds to every Shell and every Gun hit) |
| Dumpster Dive (1, uncommon) | draw 2, discard 1, heal 2 | **heal 4** | 8 → 11 |
| Booby-Trapped Window (2, rare Trap) | cancel a hit, 10 to the attacker | **13** | 18.7 → 21 |

### Left as they are

Old Twelve Gauge, Buckshot Shell, Hammer Swing, Bottle Tripwire, Pistol Whip, Aim, Buttstroke, Glass Cover (+20%), Hair Trigger,
Reload, Pick Up the Brass, Spare Barrel, Dead Eye, Double Tap, Bandolier, Extended Mag, Rack and Ruin, Shell Shock, Slug Round (-16%),
Pump Action (+20%), Shotgun Wedding, Slugfest, Shellshocked, Rusty Nail Board, Tin Can Alley, The Last Shell, Ammo Dump, Last Orders,
Liquid Lunch (the Hunter's Draw Blood, with the HP a turn late), Bottle to the Head, Sob Story, Sweat It Out, Mean Drunk, Black Out,
Bender, Bar Stool (+20%), Haymaker, Bottomless Flask, Pass Out, Broken Bottle, Chaser, Liquid Courage, Window Pane, Broken Window
Theory.

## 3. Upgrades past +50% (hand-written "+")

| Card | Automatic "+" | Proposed "+" |
|---|---|---|
| Buttstroke | +3, +1 Faltering, Sharpen +2 (+105%) | **8 damage** |
| Pistol Whip | +3, Sharpen +2 (+73%) | **9 damage** |
| Glass Cover | +3 Barrier, Sharpen +2 (+64%) | **Sharpen 4** |
| Reload | Sharpen +2, +1 card (+86%) | **Sharpen 5** |
| Dead Eye | Sharpen +2, +1 Exposed to ALL (+100%) | **2 Exposed to ALL** |
| Shard Toss | +3 to ALL, +1 Brittle (+56%) | **9 to ALL** |
| Pump Action | +1 Shell, +1 card (+69%) | **3 Shells** |
| Hammer Swing | +3, +1 Brittle (+55%) | **9 damage** |
| Broken Bottle | +3, +1 Exposed (+60%) | **10 damage** |
| Sob Story | +3 heal, +1 card (+65%) | **heal 6** |
| Sweat It Out | +3 Barrier, +3 heal (+60%) | **7 Barrier** |
| Liquid Dinner | +3 heal, +1 card | **heal 5** |
| Dumpster Dive | +1 card, +3 heal (+77%) | **draw 3** |
| Chaser | -1 HP, +1 card (+79%) | **lose 1 HP** |
| One for the Road | +1 card (+61% on the new base) | **2 Hangover** |

## 4. Rarity

The Drunkard has **20 commons, 30 uncommons, 28 rares** (the baselines: 20 / 35-36 / 24-27). Shell Game moves up to uncommon (31).
Two or three rares could move down once the numbers settle; after the changes, the best fits are Bar Stool, Ricochet and Scattergun
Symphony.

## 5. Mechanics, if you want more

He already has three distinct build paths, so I wouldn't add a fourth. Two ideas that would sharpen the drunk himself:

1. **Stagger.** Attacks that hit a random enemy, harder: a drunk's swing.
   - Random targeting is priced at 0.9 a point, so a Stagger card can hit about 15% harder than its aimed version.
   - It needs no engine work: the `randomFoe` target exists.
   - It would make the Hangover path *feel* drunk, not just hurt.
2. **Last Orders as a theme.** A few cards that pay off at exactly 1 HP above death. Hangover already never takes your last HP (#354),
   so "at 1 HP" is reachable on purpose.
   - It needs one metric ("HP is 1") and is a high-risk, high-fun Clutch Genes path.
   - I'd keep it to two or three cards.

## 6. Questions for Robert

1. **Shells:** Load Shells to 2 and Shell Game to uncommon, or would you rather keep Shells generous and make the Shell cards cost
   more?
2. **Hangover at -1.5 a stack** makes most drinks weak. Raising their numbers (as proposed) keeps the path; the other way is to price
   Hangover gentler, at -1, since it can never kill you. Which do you prefer?
