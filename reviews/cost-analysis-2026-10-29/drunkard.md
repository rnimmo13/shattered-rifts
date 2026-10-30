# Drunkard: card cost analysis (2026-10-29)

Hand-priced with `docs/14_CARD_COSTING.md` (§1-§12, §14, and the Drunkard rates in §5: Precision 2.5, a Shell 5.2, Hangover -1.5)
against the live pool (`packages/content/src/v2/pools/drunkard.ts`, text from `cardText`, engine semantics checked in
`packages/combat/src/engine.ts`). No sims were run and no game code or docs changed. Every card and its "+" is in the table at the end.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall** | **B** | 75% on budget, no broken cards, 2 dead (Rock Bottom, Gun Oil). The 2026-10-28 pass (DECISIONS #393, #434) shows: nothing is far over. Fixing the two dead Auras and three weak Gun Auras would make it an A. |
| **Power level** | **Fair** | Mean deviation **-2%**. Gun -4%, Shells -1%, Hangover 0%, glue -6%. |
| **Consistency** | **B** | Spread (standard deviation) **15 points**, the tightest of my three classes. |

Counts (93 cards graded: the 92 pool cards and the Old Twelve Gauge; Strike and Defend are left out): **70 on budget (75%), 9 strong,
0 broken, 12 weak, 2 dead.**

Scale for consistency: spread up to 12 points is A, up to 18 B, up to 25 C, up to 35 D, over 35 F. Power: "fair" is a mean within ±5%.

## Method and the rates I had to choose

- **Budgets:** 6 / 10 / 19 / 28 / 37 for 0-4 Mana. Class basics 80%, uncommon x1.12, rare x1.25. Consume x1.25 on the budget. An
  Aura's 4-turn total is set against 1.5x (uncommon) or 2x (rare). **A common Aura** (Gun Oil; the guide has no rule) at 1.25x.
- **0-cost Consume Mana cards** are compared with the guide's references, as §6 says: +1 Mana = Marsh Light (7), +2 Mana = Draw Blood
  (9.5). Liquid Lunch *is* Draw Blood with Hangover for HP.
- **Precision** 2.5 a point when a card gives it. An **Aura's** gains come later in the fight, with fewer shots left, so they are
  priced at **1.8**. **The Old Twelve Gauge** is one copy (Hold, Opening hand) and fires **~0.5 a turn**. Only it counts as a "gun",
  and only the Buckshot Shell as a "shell" (tags in the pool file).
- **Shells:** **~1.5 played a turn** in a Shells deck or a Gun deck with Shell makers. Shells are Attacks, so they count for Trigger
  Discipline.
- **Hangover** -1.5 a stack. "+per Hangover" payoffs at **~3 stacks** (the guide's number; see the timing caveat under Build paths).
  "+1 per N% HP missing" at **30%** missing (**35%** for Hangover-path cards), rounded down as the engine does. HP losses to his own
  cards or Hangover: **~1.3 a turn** of ~3 HP in a Hangover deck (DECISIONS #434).
- **Stagger** damage lands on a random enemy: x0.9 (§2). Hangover-path multi-hits get +0.5 a hit for his Might sources (Swig, Mean
  Drunk, Rock Bottom); Shells-path multi-hits don't (no Might there).
- **Clutch Genes** is priced with the trait, not on each attack.
- **Upgrade dev** is the "+" card against its own budget x1.3. **(c)** marks a card whose value depends on a setup, priced at the
  expected value in the deck built for it.

## The trait: Clutch Genes

+1% attack damage for every 1% of HP missing. At ~30% missing with ~11 attack damage a turn: ~+3.3 a turn, ~16 a fight. ~25 at half
HP, 0 at full. **~10-20 a fight**, the low-middle of the roster. It rises exactly when he is in trouble (and against bosses, fought
late and hurt). It also stacks with his missing-HP cards (Smash the Pane, Bar Stool, Last Orders), which already pay for the same HP.

## Starter deck (3 Strike, 3 Defend, 2 Hammer Swing, Pane Up, Bottle Tripwire, Old Twelve Gauge: 11 cards)

Baseline: about **10 damage and 6 Barrier a turn (~18 points)**.

| Turn | Damage | Barrier | Notes |
|---|---|---|---|
| 1 | ~11-12 (Gun 5 to ALL in the opening hand) | ~4.5 | the Gun is +25% against a lone enemy (Point Blank) |
| 2 | ~11 | ~6.5 | Bottle Tripwire springs ~1 turn in 3 (7 + Faltering) |
| 3 | ~11 (+Gun again after the reshuffle, or held) | ~6.5 | Clutch Genes adds ~1-2 as HP drops |

**Reading:** on par: ~17-18 points a turn, with a little more damage and a little less Barrier. Hammer Swing is the weakest basic
(-15%: its Brittle is worth little); Pane Up +5%, Bottle Tripwire +6%, the Gun +15%. The 11th card makes the starter one card thicker
than the others, which slightly delays the Gun's second shot.

## Build paths

| Path | Cards | Mean | On budget | How it holds up |
|---|---|---|---|---|
| **Gun** | 24 | -4% | 79% | Works. The Precision producers are on budget (Rack the Slide, Powder Load, Aim, Reload, Pistol Whip, Ironsights). **The Auras that pay per gun play are under**: one Gun fires ~0.5 a turn, so Gun Oil -42% (dead), The Twelve-Gauge Opera -28%, Hair Trigger -28%. Double Tap and Pick Up the Brass (more guns, more shots) are the path's real multipliers. The payoff is reachable from turn 1: the Gun starts in hand and Holds. |
| **Shells** | 23 | -1% | 74% | Works. The Shell makers run hot: Shell Game +39% (one free Shell a turn at uncommon), Pump Action +20%; Scattergun Symphony +17%. The consumed-count payoffs (Boomstick, Fire in the Hole) are on budget at ~5 consumed by mid-fight. Spray and Pray (-21%) and Last Orders (-18%) are under. |
| **Hangover** | 32 | 0% | 78% | On budget after #393/#434, with one caveat the prices hide: **Hangover clears at the start of his turn** (it costs that HP, then goes). So on his turn the only Hangover he has is from drinks played earlier **that turn**. The "+per Hangover" cards (Bottle to the Head, Bender, Haymaker, Blind Drunk, Nurse the Hangover, Dutch Courage) are priced at the guide's ~3 stacks. Played without a drink first they get 0, so in practice they run ~10-25% under their listed prices unless he sequences drink then payoff. The self-loss payoffs (Glass Jaw, Mean Drunk, The Glass Palace, Bar Fight) read the morning-after tick, which is reliable. **Rock Bottom** is dead (-60%): 2 Might for 1 HP a turn. |

## Against bosses (front-loaded big hits, needing big single-target damage or block)

- **Damage:** his AoE (the Gun, Shells, Barroom Brawl, Shotgun Wedding, every "to ALL" Aura) loses its x1.3 against a lone boss, so
  the Shells path reads ~20% under its price there. The Gun's Point Blank (+25% with one enemy left) makes up part of it. Big
  single hits: The Last Shell 24, Haymaker 14 + 3 per Hangover, Smash the Pane 12 + 1 per 4% missing, Slug Round 16 (weak). Clutch
  Genes helps most here.
- **Block:** Black Out 14 for 4 Hangover, Pane Up and Window Pane (grow with missing HP), Booby-Trapped Window (cancels the big hit)
  and the heals (Pass Out, Liquid Dinner, Bottomless Flask). It's fine, but the Hangover deck goes into a boss's opener lower on HP by
  design. Pass Out and Sweat It Out are the release valves.

## Biggest outliers and suggested fixes (suggestions only, not applied)

| # | Card | Now | Suggested fix | After |
|---|---|---|---|---|
| 1 | **Rock Bottom** (1, rare Aura) | -60% (c): 2 Might, lose 1 HP a turn | **3** Might, and "whenever Hangover costs you HP, gain 1 Might" (upgrade 4 Might) | ~+10% |
| 2 | **Gun Oil** (1, common Aura) | -42% (c): 3 Barrier per gun play, ~0.5 a turn | **5** Barrier per gun play (upgrade 7); "gun or shell: 1 Barrier" would read -23% | -4% |
| 3 | **Shell Game** (1, uncommon Aura) | +39%: a free Shell every turn | Back to **rare** (budget 20) | +4% |
| 4 | **Liquid Courage** (1, uncommon) | +34%: 5 Barrier + 6 Primed (the Gun and Shells hit every enemy) | **4** Primed (upgrade 6) | +7% |
| 5 | **Last Call** (2, rare Aura) | -34%: +1 Mana a turn, 2 Hangover | Opening hand on the base (the "+" then drops the Hangover). Or settle the guide: §7 calls a +1 Mana Aura fair at 2 Mana, the 2x rare rule wants ~38 | -25%, or on budget if the guide reads rare Mana Auras at 1.5x |
| 6 | **The Twelve-Gauge Opera** (2, rare Aura) | -28%: Precision 6, +1 per gun play | Precision **8** (upgrade 11) | -15% |
| 7 | **Hair Trigger** (1, uncommon Aura) | -28% (c): Precision 1 per Shell | Cost **0** (upgrade: Opening hand) | +20% |
| 8 | **Pick Up the Brass** (1, uncommon, Consume) | -26% (c): 2 consumed cards back (nearly always Shells) | **3** (upgrade 4) | +11% |
| 9 | **Spray and Pray** (2, uncommon) | -21% (c) | **12** (+1 per 2 made) to ALL | -8% |
| 10 | **Bender / Blind Drunk** (Hangover payoffs) | +21% / +22% (c) at 3 Hangover | Leave the numbers; add a "drink first" cue (keyword tip: "Hangover is the HP you'll lose next turn; it only counts this turn for what you drank this turn"). At the ~2 stacks really seen they are on budget | on budget at 2 stacks |

Also worth a look: **Rusty Nail Board+** and **Bottle Tripwire+** raise both numbers (+77% and +60% gains, past §12's +50%): give them a
hand-written "+" that raises one. **Aim+** is Precision 2 → 4 (+83% gain). **Rolling Thunder+** costs 1 (+60% vs its budget).

## Full table

Cards graded: **93** (Strike and Defend excluded). On budget **70** (75%), strong **9**, broken **0**, weak **12**, dead **2**.
Mean deviation **-2%**, spread (standard deviation) **15 points**.

| Build path | Cards | Mean dev | On budget |
|---|---|---|---|
| Gun | 24 | -4% | 79% |
| starter | 3 | -1% | 67% |
| Shells | 23 | -1% | 74% |
| Hangover | 32 | 0% | 78% |
| glue | 11 | -6% | 64% |

Verdicts: on budget within ±15%, strong +15 to +40%, broken over +40%, weak −15 to −40%, dead under −40%. (c) = conditional, priced at its expected value. "Upgrade dev" is the "+" card against its own budget x1.3 (the guide aims upgrades at about +30%); "gain" is the "+" over the base card.

| Card | Cost | Rarity | Path | Text (live) | Price | Budget | Dev | Verdict | Upgrade dev (vs budget x1.3) | Working |
|---|---|---|---|---|---|---|---|---|---|---|
| Strike | 1 | basic | starter | Deal 6 damage. | 6.0 | 6.0 | +0% | on budget | +15% (gain +50%) | 6 |
| Defend | 1 | basic | starter | Gain 5 Barrier. | 6.0 | 6.0 | +0% | on budget | +23% (gain +60%) | 5 Barrier |
| Old Twelve Gauge | 1 | common | Gun | Deal 5 (+1 per point of sharpening) damage to ALL enemies. Point Blank: 25% more when only one enemy is left. Hold. Opening hand. | 11.5 | 10.0 | +15% | on budget | -12% (gain +0%) | 5 to ALL 6.5 + Point Blank ~0.5 + Hold 1 + Opening 3.5; every Precision card adds to it |
| Hammer Swing | 1 | basic | starter | Deal 6 damage. Apply 1 Brittle. | 6.8 | 8.0 | -15% | weak | -6% (gain +44%) | 6 + 1 Brittle 0.75 |
| Pane Up | 1 | basic | starter | Gain 5 (+1 per 11% HP missing) Barrier. | 8.4 | 8.0 | +5% | on budget | +15% (gain +43%) | (5 + 2 at 30% missing) Barrier x1.2 |
| Bottle Tripwire | 1 | basic Trap | starter | When you or an ally is attacked: Deal 7 damage to the attacker. Apply 1 Faltering to the attacker. | 8.5 | 8.0 | +6% | on budget | +31% (gain +60%) | (7 + Faltering 3) x0.85; up raises both (+60%) |
| The Twelve-Gauge Opera | 2 | rare Aura | Gun | Precision 6 (every Old Twelve Gauge you have deals 6 more damage for the rest of the fight). Whenever you play a gun: Precision 1 (every Old Twelve Gauge you have deals 1 more damage for the rest of the fight). Gain 3 Barrier. | 27.2 | 38.0 | -28% | weak | -30% (gain +28%) | Aura: Precision 6 (15) + per gun play (~0.5 a turn x4) Precision 1 (2.5) + 3 Barrier 3.6 |
| Rack the Slide | 1 | common | Gun | Precision 4 (every Old Twelve Gauge you have deals 4 more damage for the rest of the fight). | 10.0 | 10.0 | +0% | on budget | +15% (gain +50%) | Precision 4 |
| Aim | 0 | common | Gun | Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). Hold. | 6.0 | 6.0 | +0% | on budget | +41% (gain +83%) | Precision 2 (5) + Hold 1; up Precision 4 (+83%) |
| Buttstroke | 1 | common | Gun | Deal 5 damage. Apply 1 Faltering. Precision 1 (every Old Twelve Gauge you have deals 1 more damage for the rest of the fight). | 10.5 | 10.0 | +5% | on budget | +4% (gain +29%) | 5 + Faltering 3 + Precision 1 (2.5) |
| Powder Load | 0 | common | Gun | Precision 3 (every Old Twelve Gauge you have deals 3 more damage for the rest of the fight). Consume. | 7.5 | 7.5 | +0% | on budget | +3% (gain +33%) | Precision 3 |
| Pistol Whip | 1 | common | Gun | Deal 6 damage. Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). | 11.0 | 10.0 | +10% | on budget | +8% (gain +27%) | 6 + Precision 2 (5) |
| Glass Cover | 1 | uncommon | Gun | Gain 7 Barrier. Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). | 13.4 | 11.2 | +20% | strong | +26% (gain +37%) | 7 Barrier 8.4 + Precision 2 (5) |
| Hair Trigger | 1 | uncommon Aura | Gun | Whenever you play a shell: Precision 1 (every Old Twelve Gauge you have deals 1 more damage for the rest of the fight). | 10.8 | 15.0 | -28% | weak (c) | -27% (gain +32%) | Aura: Precision 1 (1.8) x ~1.5 Shells a turn x4; up Opening hand |
| Reload | 1 | uncommon | Gun | Precision 3 (every Old Twelve Gauge you have deals 3 more damage for the rest of the fight). Draw 1 card. | 10.5 | 11.2 | -6% | on budget | +6% (gain +48%) | Precision 3 (7.5) + draw 1 (3) |
| Extended Mag | 2 | rare Aura | Gun | At the start of your turn: Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). Add a Buckshot Shell to your hand. | 35.2 | 38.0 | -7% | on budget | -14% (gain +20%) | Aura: Precision 2 (3.6) + a Shell 5.2 a turn x4 |
| Rack and Ruin | 2 | rare | Gun | Deal 10 damage to ALL enemies. Precision 4 (every Old Twelve Gauge you have deals 4 more damage for the rest of the fight). | 23.0 | 23.8 | -3% | on budget | +3% (gain +39%) | 10 to ALL 13 + Precision 4 (10); up +2 numbers (+39%) |
| Trigger Discipline | 1 | rare Aura | Gun | Whenever you play an Attack: Precision 1 (every Old Twelve Gauge you have deals 1 more damage for the rest of the fight). | 18.0 | 20.0 | -10% | on budget (c) | -17% (gain +19%) | Aura: Precision 1 (1.8) x ~2.5 Attacks a turn (Shells are Attacks) x4; up Opening hand |
| Ironsights | 1 | rare | Gun | Precision 3 (every Old Twelve Gauge you have deals 3 more damage for the rest of the fight). Add 2 Buckshot Shells to your hand. Consume. | 17.9 | 15.6 | +15% | on budget | +14% (gain +29%) | Precision 3 (7.5) + 2 Shells 10.4 |
| Scope | 1 | uncommon Aura | Gun | At the start of your turn: Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). | 14.4 | 15.0 | -4% | on budget | +11% (gain +50%) | Aura: Precision 2 (3.6) a turn x4 |
| Gunmetal Soul | 1 | rare Aura | Gun | At the end of your turn: Precision 1 (every Old Twelve Gauge you have deals 1 more damage for the rest of the fight). Gain 3 Barrier. | 21.6 | 20.0 | +8% | on budget | +20% (gain +44%) | Aura: Precision 1 (1.8) + 3 Barrier 3.6 at the end of each turn x4 |
| Double Tap | 1 | uncommon | Gun | Add an Old Twelve Gauge to your hand. | 11.0 | 11.2 | -2% | on budget (c) | -18% (gain +9%) | a second Old Twelve Gauge for the fight: a ~19-point shot at ~10 Precision for 1 more Mana, plus later shots |
| Bandolier | 1 | uncommon Aura | Gun | Whenever you play a shell: Gain 2 Barrier. | 14.4 | 15.0 | -4% | on budget (c) | +11% (gain +50%) | Aura: 2 Barrier 2.4 x ~1.5 Shells a turn x4 |
| Pick Up the Brass | 1 | uncommon | Gun | Return 2 random Consumed cards to your hand (never one that returns cards). Consume. | 10.4 | 14.0 | -26% | weak (c) | -14% (gain +50%) | 2 Consumed cards back, nearly always Shells (5.2 each) |
| Hot Brass | 1 | rare Aura | Gun | Whenever a card is consumed: Gain 1 Barrier. Precision 1 (every Old Twelve Gauge you have deals 1 more damage for the rest of the fight). | 18.0 | 20.0 | -10% | on budget (c) | -3% (gain +40%) | Aura: (1 Barrier 1.2 + Precision 1 1.8) x ~1.5 consumes a turn x4 |
| Spare Barrel | 1 | uncommon | Gun | Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). Add a Buckshot Shell to your hand. | 10.2 | 11.2 | -9% | on budget | +4% (gain +49%) | Precision 2 (5) + a Shell 5.2; up Precision 4 (+49%) |
| Gun Oil | 1 | common Aura | Gun | Whenever you play a gun: Gain 3 Barrier. | 7.2 | 12.5 | -42% | dead (c) | -41% (gain +33%) | Aura: 3 Barrier per gun play, ~0.5 a turn x4; common Aura budget taken as 1.25x (the guide has none) |
| Dead Eye | 1 | uncommon | Gun | Precision 2 (every Old Twelve Gauge you have deals 2 more damage for the rest of the fight). Apply 1 Exposed to ALL enemies. | 11.5 | 11.2 | +3% | on budget | +10% (gain +39%) | Precision 2 (5) + Exposed ALL 4.5 + ... (Exposed lifts the Gun's attack too) ~+2 |
| Shard Toss | 1 | common | Shells | Deal 6 damage to ALL enemies. Apply 1 Brittle to ALL enemies. | 8.8 | 10.0 | -12% | on budget | -2% (gain +44%) | 6 to ALL 7.8 + Brittle ALL ~1 |
| Load Shells | 1 | common | Shells | Add 2 Buckshot Shells to your hand. | 10.4 | 10.0 | +4% | on budget | +20% (gain +50%) | 2 Shells |
| Slug Round | 2 | common | Shells | Deal 16 damage. | 16.0 | 19.0 | -16% | weak | -23% (gain +19%) | 16 |
| Pump Action | 1 | uncommon | Shells | Add 2 Buckshot Shells to your hand. Draw 1 card. | 13.4 | 11.2 | +20% | strong | +28% (gain +39%) | 2 Shells 10.4 + draw 1 (3) |
| Shotgun Wedding | 2 | uncommon | Shells | Deal 7 damage 2 times to ALL enemies. | 18.2 | 21.3 | -14% | on budget | -25% (gain +14%) | 7 x2 to ALL x1.3 (no Might in the Shells path) |
| Shell Game | 1 | uncommon Aura | Shells | At the start of your turn: Add a Buckshot Shell to your hand. | 20.8 | 15.0 | +39% | strong | +25% (gain +17%) | Aura: a Shell a turn x4; up Opening hand |
| Boomstick | 3 | rare | Shells | Deal 14 (+2 per consumed card) damage to ALL enemies. | 31.2 | 35.0 | -11% | on budget (c) | -23% (gain +13%) | (14 + 2 x ~5 consumed by mid-fight) x1.3 |
| The Last Shell | 2 | rare | Shells | Deal 24 damage. Apply 1 Exposed. Consume. Hold. | 29.5 | 29.7 | -1% | on budget | -8% (gain +20%) | 24 + 1 Exposed 3 + Hold 2.5 |
| One More Round | 3 | rare Aura | Shells | At the start of your turn: Add 2 Buckshot Shells to your hand. Heal 3. | 59.6 | 56.0 | +6% | on budget | +7% (gain +30%) | Aura: 2 Shells 10.4 + heal 3 (4.5) a turn x4 |
| Shell Shock | 1 | common | Shells | Deal 3 damage to ALL enemies. Add a Buckshot Shell to your hand. | 9.1 | 10.0 | -9% | on budget | +0% (gain +43%) | 3 to ALL 3.9 + a Shell 5.2 |
| Slugfest | 2 | uncommon | Shells | Deal 5 damage 4 times. | 20.0 | 21.3 | -6% | on budget | -13% (gain +20%) | 5 x4 |
| Shellshocked | 1 | uncommon Aura | Shells | Whenever a card is consumed: Deal 2 damage to ALL enemies. | 15.6 | 15.0 | +4% | on budget (c) | +20% (gain +50%) | Aura: 2 to ALL 2.6 x ~1.5 consumes a turn x4 |
| Fire in the Hole | 2 | rare | Shells | Deal 12 (+1 per consumed card) damage to ALL enemies. | 22.1 | 23.8 | -7% | on budget (c) | -16% (gain +18%) | (12 + ~5 consumed) x1.3 |
| Ammo Dump | 2 | rare | Shells | Add 6 Buckshot Shells to your hand. Consume. | 31.2 | 29.7 | +5% | on budget | +21% (gain +50%) | 6 Shells (5.2 each); up 6 Shells+ (7.8 each, +50%) |
| Rolling Thunder | 2 | rare Aura | Gun | At the start of your turn: Add 2 Buckshot Shells to your hand. | 41.6 | 38.0 | +9% | on budget | +60% (gain +0% (cost 1)) | Aura: 2 Shells a turn x4; up costs 1 |
| Last Orders | 2 | rare | Shells | Deal 8 (+1 per 4% HP missing) damage to ALL enemies. | 19.5 | 23.8 | -18% | weak (c) | -24% (gain +20%) | (8 + 7 at 30% missing) to ALL x1.3 |
| Rusty Nail Board | 1 | uncommon Trap | Shells | At the start of the enemy turn: Deal 5 damage to ALL enemies. Apply 1 Faltering to ALL enemies. | 9.9 | 11.2 | -12% | on budget | +20% (gain +77%) | (5 to ALL 6.5 + Faltering ALL 4.5) x0.9; up raises both (+77%) |
| Molotov Cocktail | 0 | uncommon Trap | Shells | When the enemy summons: Deal 12 damage to ALL enemies. Apply 1 Brittle to ALL enemies. | 6.6 | 6.7 | -2% | on budget (c) | -2% (gain +30%) | (12 to ALL 15.6 + Brittle ALL 1) x0.4 (summon) |
| Sawn-Off | 1 | uncommon | Shells | Deal 9 damage to ALL enemies. Lose 1 HP. | 10.2 | 11.2 | -9% | on budget | -3% (gain +38%) | 9 to ALL 11.7 - 1 HP 1.5 |
| Tin Can Alley | 1 | uncommon | Shells | Deal 3 damage 3 times to ALL enemies. | 11.7 | 11.2 | +4% | on budget | +7% (gain +33%) | 3 x3 to ALL x1.3 |
| Spray and Pray | 2 | uncommon | Shells | Deal 10 (+1 per 2 cards created this fight) damage to ALL enemies. | 16.9 | 21.3 | -21% | weak (c) | -25% (gain +23%) | (10 + ~3 for ~6 cards made by mid-fight) x1.3 |
| Birdshot | 0 | common | Shells | Deal 6 damage to ALL enemies. Consume. | 7.8 | 7.5 | +4% | on budget | +20% (gain +50%) | 6 to ALL x1.3 |
| Scattergun Symphony | 1 | rare Aura | Shells | Whenever you play a shell: Deal 3 damage to ALL enemies. | 23.4 | 20.0 | +17% | strong (c) | +20% (gain +33%) | Aura: 3 to ALL 3.9 x ~1.5 Shells a turn x4 |
| Ricochet | 1 | rare Aura | Shells | Whenever you play a shell: Draw 1 card. | 21.0 | 20.0 | +5% | on budget (c) | -6% (gain +17%) | Aura: draw 1 (3.5) x ~1.5 Shells a turn x4; up Opening hand |
| Smash the Pane | 2 | uncommon | Hangover | Deal 12 (+1 per 4% HP missing) damage. | 20.0 | 21.3 | -6% | on budget | -17% (gain +15%) | 12 + 8 at 35% missing |
| The Glass Palace | 3 | rare Aura | Hangover | At the start of your turn: Gain 3 (+1 per 6% HP missing) Barrier. Whenever you lose HP to your own cards or Hangover: Deal damage equal to the HP you lost (at most 5) to ALL enemies. | 58.8 | 56.0 | +5% | on budget (c) | -16% (gain +3%) | Aura: (3 + 5 at 35%) Barrier 9.6 + ~1.3 self-losses a turn of ~3 HP to ALL (5.1), x4 |
| Glass Jaw | 2 | rare Aura | Hangover | Whenever you lose HP to your own cards or Hangover: Deal damage equal to the HP you lost (at most 6) to ALL enemies. Gain 2 Barrier. | 32.8 | 38.0 | -14% | on budget (c) | -18% (gain +23%) | Aura: ~1.3 self-losses a turn x (3 to ALL 3.9 + 2 Barrier 2.4) x4 |
| Bar Stool | 1 | uncommon | Hangover | Deal 7 (+1 per 6% HP missing) damage. | 12.0 | 11.2 | +7% | on budget | +3% (gain +25%) | 7 + 5 at 35% missing |
| Mean Drunk | 2 | uncommon Aura | Hangover | Whenever you lose HP to your own cards or Hangover: Gain Might equal to half of the HP you lost (at most 3) until the end of your turn. Gain 2 Barrier. | 28.0 | 28.5 | -2% | on budget (c) | +10% (gain +45%) | Aura: ~1.3 triggers a turn x (~1.5 Might on ~2 attacks 3 + 2 Barrier 2.4) x4 |
| Rock Bottom | 1 | rare Aura | glue | Gain 2 Might. At the start of your turn: Lose 1 HP. | 8.0 | 20.0 | -60% | dead (c) | -50% (gain +63%) | Aura: 2 Might for the fight 10 - 1 HP a turn (-6) + 4 extra self-loss triggers for his payoffs (~4) |
| Bar Fight | 1 | common | Hangover | Deal 7 (+3 per time you lost HP this turn, at most +9) damage. | 10.9 | 10.0 | +9% | on budget (c) | +7% (gain +28%) | 7 + 3 x ~1.3 HP losses this turn (Hangover counts) |
| Nurse the Hangover | 1 | common | Hangover | Gain 5 (+1 per Hangover, at most +8) Barrier. | 9.6 | 10.0 | -4% | on budget (c) | +2% (gain +38%) | (5 + ~3 Hangover) Barrier x1.2 |
| Take It on the Chin | 1 | uncommon | Hangover | Lose 3 HP. Gain 10 Barrier. Draw 1 card. | 10.5 | 11.2 | -6% | on budget | -3% (gain +34%) | -3 HP 4.5 + 10 Barrier 12 + draw 1 (3) |
| Liquid Lunch | 0 | common | Hangover | Gain 2 Mana. Gain 3 Hangover. Consume. | 9.5 | 9.5 | +0% | on budget | -11% (gain +16%) | +2 Mana 14 - 3 Hangover 4.5 = Draw Blood exactly (the guide's reference, budget 9.5) |
| One for the Road | 0 | common | Hangover | Draw 3 cards. Gain 3 Hangover. Consume. | 6.5 | 7.5 | -13% | on budget | -18% (gain +23%) | draw 3 (11) - 3 Hangover 4.5 |
| Drunken Swing | 1 | common | Hangover | Deal 14 damage. Gain 3 Hangover. | 9.5 | 10.0 | -5% | on budget | +4% (gain +42%) | 14 - 3 Hangover 4.5 |
| Bottle to the Head | 1 | common | Hangover | Deal 5 (+2 per Hangover) damage. | 11.0 | 10.0 | +10% | on budget (c) | +8% (gain +27%) | 5 + 2 x ~3 Hangover |
| Sob Story | 1 | common | Hangover | Heal 3 (+1 per 8% HP missing). Draw 1 card. Consume. | 13.5 | 12.5 | +8% | on budget | +11% (gain +33%) | heal (3 + 4 at 35%) x1.5 + draw 1 (3) |
| Sweat It Out | 1 | common | Hangover | Gain 4 Barrier. Heal HP equal to your Hangover. Clear your Hangover. Consume. | 13.8 | 12.5 | +10% | on budget (c) | +7% (gain +26%) | 4 Barrier 4.8 + heal ~3 Hangover 4.5 + the ~3 HP it would have cost 4.5 |
| Swig | 0 | uncommon | Hangover | Gain 4 Might until the end of your turn. Gain 2 Hangover. Consume. | 7.0 | 8.4 | -17% | weak (c) | -13% (gain +36%) | 4 Might this turn on ~2.5 hits (10) - 2 Hangover 3 |
| Barroom Brawl | 2 | uncommon | Hangover | Deal 16 damage to ALL enemies. Gain 2 Hangover. | 17.8 | 21.3 | -16% | weak | -17% (gain +29%) | 16 to ALL 20.8 - 2 Hangover 3 |
| Black Out | 1 | uncommon | Hangover | Gain 14 Barrier. Gain 4 Hangover. | 10.8 | 11.2 | -4% | on budget | +7% (gain +44%) | 14 Barrier 16.8 - 4 Hangover 6 |
| Bender | 1 | uncommon | Hangover | Deal 3 damage, 1 more time per Hangover. | 13.5 | 11.2 | +21% | strong (c) | +20% (gain +30%) | 3 x (1 + ~3 Hangover) = 12 + 0.5 a hit for Might |
| Hair of the Dog | 0 | uncommon | Hangover | Clear your Hangover. Gain 1 Mana. Gain 2 Hangover. Consume. | 8.5 | 7.8 | +8% | on budget (c) | +13% (gain +35%) | clear ~3 Hangover 4.5 + 1 Mana 7 - 2 Hangover 3; budget = Marsh Light 7 x1.12 |
| Liquid Dinner | 1 | uncommon | Hangover | Heal 2 (+1 per 5% HP missing). Draw 1 card. Consume. | 16.5 | 14.0 | +18% | strong | +15% (gain +27%) | heal (2 + 7 at 35%) x1.5 + draw 1 (3) |
| Dutch Courage | 1 | uncommon Aura | Hangover | At the end of your turn: Gain Barrier equal to your Hangover. | 14.4 | 15.0 | -4% | on budget (c) | +23% (gain +0% (cost 0)) | Aura: Barrier = ~3 Hangover at the end of a turn (3.6) x4; up costs 0 |
| Haymaker | 2 | rare | Hangover | Deal 14 (+3 per Hangover) damage. | 23.0 | 23.8 | -3% | on budget (c) | -6% (gain +26%) | 14 + 3 x ~3 Hangover |
| Bottoms Up | 1 | rare | Hangover | Gain 2 Mana. Draw 2 cards. Gain 4 Hangover. Consume. | 15.0 | 15.6 | -4% | on budget | -6% (gain +27%) | +2 Mana 14 + draw 2 as an extra 7 - 4 Hangover 6 |
| Last Call | 2 | rare Aura | Hangover | Gain 2 Hangover. At the start of your turn: Gain 1 Mana. | 25.0 | 38.0 | -34% | weak | -42% (gain +14%) | Aura: +1 Mana a turn 28 - 2 Hangover 3 (DECISIONS #410 calls it a fair 2-cost Aura; the 2x rare rule reads it low); up Opening |
| Bottomless Flask | 2 | rare Aura | Hangover | At the start of your turn: Heal 2 (+1 per 10% HP missing). Draw 1 card. | 44.0 | 38.0 | +16% | strong | +13% (gain +27%) | Aura: heal (2 + 3 at 35%) 7.5 + a card 3.5 a turn x4 |
| Pass Out | 2 | rare | Hangover | Heal 8 (+1 per 3% HP missing). Clear your Hangover. Consume. | 33.0 | 29.7 | +11% | on budget | -3% (gain +14%) | heal (8 + 11 at 35%) 28.5 + clear ~3 Hangover 4.5 |
| Haphazard Hook | 0 | common | Hangover | Stagger. Deal 7 damage to a random enemy. | 6.3 | 6.0 | +5% | on budget | +15% (gain +43%) | 7 random x0.9 |
| Drunken Lurch | 1 | common | Hangover | Stagger. Deal 12 damage to a random enemy. | 10.8 | 10.0 | +8% | on budget | +4% (gain +25%) | 12 random x0.9 |
| Stumble | 1 | uncommon | Hangover | Stagger. Deal 9 damage to a random enemy. Gain 4 Barrier. Gain 2 Hangover. | 9.9 | 11.2 | -12% | on budget | -13% (gain +27%) | 9 random 8.1 + 4 Barrier 4.8 - 2 Hangover 3 |
| Free-for-All | 2 | uncommon | Hangover | Stagger. Deal 7 damage to a random enemy 3 times. | 19.9 | 21.3 | -6% | on budget | -9% (gain +27%) | 7 x3 random x0.9 + Might 1 |
| Drunken Master | 1 | uncommon Aura | Hangover | Whenever you play a Stagger card: Gain 2 Barrier. Deal 2 damage to a random enemy. | 13.4 | 15.0 | -11% | on budget (c) | +4% (gain +51%) | Aura: (2 Barrier 2.4 + 2 random 1.8) x ~0.8 Stagger cards a turn x4 |
| Blind Drunk | 2 | rare | Hangover | Stagger. Deal 6 damage to a random enemy 2 times, 1 more time per Hangover. | 29.0 | 23.8 | +22% | strong (c) | +9% (gain +16%) | 6 x (2 + ~3 Hangover) x0.9 + Might 2 |
| Broken Bottle | 1 | common | glue | Deal 7 damage. Apply 1 Exposed. | 10.0 | 10.0 | +0% | on budget | +0% (gain +30%) | 7 + Exposed 3 |
| Chaser | 0 | common | glue | Lose 2 HP. Gain 1 Mana. Draw 1 card. Consume. | 7.0 | 7.0 | +0% | on budget | -7% (gain +21%) | -2 HP 3 + 1 Mana 7 + draw 1 (3); budget = Marsh Light 7 |
| Dumpster Dive | 1 | uncommon | glue | Draw 2 cards. Discard 1 card. Heal 4. | 11.0 | 11.2 | -2% | on budget | +3% (gain +36%) | draw 2 (7) - discard 2 + heal 4 (6) |
| Rummage the Bin | 0 | common | glue | Foresee 3. | 5.0 | 6.0 | -17% | weak | -29% (gain +10%) | Foresee 3 on its own (Cold Read's Foresee 4 is 5.5) |
| Sway | 1 | uncommon | glue | Gain 7 Barrier. Draw 1 card. | 11.4 | 11.2 | +2% | on budget | +3% (gain +32%) | 7 Barrier 8.4 + draw 1 (3) |
| Whiskey Miracle | 1 | rare | glue | Heal 10. Consume. | 15.0 | 15.6 | -4% | on budget | -4% (gain +30%) | heal 10 x1.5 |
| Liquid Courage | 1 | uncommon | glue | Gain 5 Barrier. Gain 6 Primed. | 15.0 | 11.2 | +34% | strong | +48% (gain +44%) | 5 Barrier 6 + 6 Primed on the next attack (~1.5 hits: the Gun and Shells hit every enemy) 9 |
| Window Pane | 1 | uncommon | glue | Gain 7 (+1 per 8% HP missing) Barrier. | 12.0 | 11.2 | +7% | on budget | +7% (gain +30%) | (7 + 3 at 30% missing) Barrier x1.2 |
| Booby-Trapped Window | 2 | rare Trap | glue | When you or an ally is attacked: Cancel that hit. Deal 13 damage to the attacker. | 21.3 | 23.8 | -10% | on budget | -20% (gain +16%) | (cancel 12 + 13) x0.85 |
| Broken Window Theory | 2 | rare Aura | glue | At the end of your turn: Deal 1 (+1 per 6% HP missing) damage to ALL enemies. | 31.2 | 38.0 | -18% | weak | -16% (gain +33%) | Aura: (1 + 5 at 30%) to ALL x1.3 at each turn end x4 |
