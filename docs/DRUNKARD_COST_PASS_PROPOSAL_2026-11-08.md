# Drunkard cost pass: analysis and proposal (2026-11-08, not built)

Status: **approved and built locally (DECISIONS #695), not released.** Two changes from the tables below, both Robert's: the
Gunslinger's gun keeps growing every turn with no 10-turn stop (his far-scaling engine), and Last Call is 1 Mana with +1 Mana and 1
Hangover at the start of each turn (the recurring price #410 asks of a 1-Mana +1 Mana Aura; A in a Brewmaster deck).

Same goal as the Hunter (#693) and Trickster (#694): each Ascendancy opens more than one way to win with long-term scaling, priced
against builds known to be good; Rares in A (125-160%), most Uncommons in B (90-124%), upgrades about +30%. Prices follow
[docs/14_CARD_COSTING.md](14_CARD_COSTING.md). Drunkard specifics: Precision 2.5 a point (the gun hits every enemy, Holds, comes round
2-3 times a fight); a Buckshot Shell 5.2; Hangover -1.5 a stack (1 HP on his 88); about 30% of HP missing mid-fight (Pane, Bar
Stool and the heals read it); damage to all 1.3 a point; a random enemy 0.9.

**What the analysis found.** Not one Drunkard Rare reaches A: 22 are B, three C (Last Orders, Booby-Trapped Window, Broken Window
Theory), two D (Rock Bottom, Last Call). Most commons and uncommons are a flat B, with some C (Shotgun Wedding, Slugfest, Spray and Pray,
Barroom Brawl, Stumble, Free-for-All...) and one D (Swig). Three Uncommons sit in A on purpose and stay: Shell Game and Scope (the
gun's engines) and Bandolier (above Gun Oil by #681). So the class has a working engine (the gun) but its payoffs never climb, which is
why Brewmaster (B+) and Deathwish (B) lag.

## 1. Ascendancies

| Ascendancy | Now (late game / Arena) | Proposed | Routes it opens |
|---|---|---|---|
| **Gunslinger** | Gun starts 3 sharper, +2 sharper each turn (A- / A-) | **The gun starts 3 sharper and grows 2 sharper at the start of each of your first 10 turns. Each Shell you play makes it 1 sharper.** | **The big gun**: Precision cards (Rack the Slide, Reload, Rack and Ruin, Extended Mag, Trigger Discipline, Double Tap). **Shell spam**: Shell Game, Rolling Thunder, Ammo Dump, Scattergun Symphony, Hot Brass, Bandolier, which now sharpen the gun too |
| **Brewmaster** | First Hangover payment on your turn: 1 Fermentation (up to 5); each heals 0.6% max HP and gives 2 Barrier at turn end (B+ / B+) | **First Hangover payment on your turn: 1 Fermentation (up to 8). At the end of your turn each heals 1% of your max HP and gives 2 Barrier. Your Attacks deal 4% more per Fermentation.** | **Hangover damage**: Haymaker, Bender, Blind Drunk, Bottle to the Head, Drunken Swing, now +32% at 8 Fermentation. **Sustain**: Black Out, Dutch Courage, Morning After, Bottomless Flask, Pass Out, healing up to 8% a turn |
| **Deathwish** | Below 70% HP up to +25% at 40% and +40% at 10%; Barrier on the first Attack at 40% or lower; one rescue (B / B) | **Up to +30% at 40% HP and +50% at 10%. New: whenever your own cards cost you HP, deal that much to a random enemy (twice a turn, up to 4 each).** Rest unchanged | **Low-HP burst**: Bar Stool, Smash the Pane, Last Orders, Haymaker on the low-HP bonus and Clutch Genes. **Pain**: Take It on the Chin, Chaser, Mean Drunk, Glass Jaw, Rock Bottom, Glass Palace, every payment striking back |

Expected: Gunslinger A- / A, Brewmaster A- / A, Deathwish A- / A-. Deathwish stays modest ("nothing crazy", #685).

## 2. Gun and Shell cards

| Card | Rarity | Now (grade) | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Boomstick | Rare | 3: 14 to all + 2 per card consumed (B 97%) | 22 to all + 2 per card consumed | 30 + 2 | A ~126% | +24% |
| The Last Shell | Rare | 2: 24 + 1 Exposed, Consume, Hold (B 98%) | 32 + 2 Exposed | 42 + 2 | A ~135% | +25% |
| One More Round | Rare (Aura) | 3: each turn 2 Shells, heal 3 (B 107%) | 3 Shells, heal 3 | heal 6 | A ~134% | +24% |
| Extended Mag | Rare (Aura) | 2: each turn 2 Precision + a Shell (B 108%) | 3 Precision + a Shell | Opening hand | A ~133% | +25% |
| Rack and Ruin | Rare | 2: 10 to all, 4 Precision (B 97%) | 12 to all, 6 Precision | 14, 8 | A ~129% | +25% |
| Trigger Discipline | Rare (Aura) | 1: 1 Precision per Attack (B 100%) | also 1 Barrier per Attack | Opening hand | A ~148% | +25% |
| Fire in the Hole | Rare | 2: 12 to all + 1 per card consumed (B 99%) | 16 + 1.5 per card consumed | 20 + 2 | A ~137% | +28% |
| Ammo Dump | Rare | 2: 6 Shells, Consume; upgraded Shells+ (+50%) | 7 Shells, draw 1 | 9 Shells, draw 1 | A ~133% | +26% |
| Rolling Thunder | Rare (Aura) | 2: 2 Shells each turn (B 110%) | Opening hand | costs 1 | A ~137% | ~+30% |
| Ironsights | Rare | 1: 3 Precision + 2 Shells, Consume (B 115%) | 4 Precision + 2 Shells | 3 Shells | A ~131% | +25% |
| Gunmetal Soul | Rare (Aura) | 1: turn end 1 Precision + 3 Barrier (B 122%) | 1 Precision + 4 Barrier | 6 Barrier | A ~146% | +33% |
| Hot Brass | Rare (Aura) | 1: per card consumed 1 Barrier + 1 Precision (B 111%) | 2 Barrier + 1 Precision | 3 Barrier | A ~147% | +25% |
| Scattergun Symphony | Rare (Aura) | 1: 3 to all per Shell (B 117%) | 4 to all | 5 | A ~156% | +25% |
| Ricochet | Rare (Aura) | 1: draw 1 per Shell (B 90%) | draw 1 and 1 Barrier per Shell | Opening hand | A ~126% | +25% |
| Shotgun Wedding | Uncommon | 2: 7 x 2 to all (C 85%) | 8 x 2 | 10 x 2 | B ~98% | +25% |
| Slugfest | Uncommon | 2: 5 x 4 (C 85%) | 6 x 4 | 7 x 4 | B ~99% | +19% |
| Spray and Pray | Uncommon | 2: 10 to all + 0.5 per card made (C 80%) | 12 + 1 per card made | 16 + 1 | B ~110% | +22% |
| Pick Up the Brass | Uncommon | 1: return 2 consumed cards, Consume (C 74%) | return 3 | Hold | B ~107% | ~+20% |
| Dead Eye | Uncommon | 1: 2 Precision + 1 Exposed to all (C 85%) | 3 Precision | 4 | B ~107% | +21% |
| Pump Action | Uncommon | upgrade 3 Shells (+39%) | unchanged | 2 Shells, draw 2 | B 120% | +30% |
| Reload | Uncommon | upgrade 5 Precision (+48%) | unchanged | 4 | B 94% | +24% |
| Shellshocked | Uncommon (Aura) | upgrade 3 to all (+50%) | unchanged | Opening hand | B 104% | +25% |
| Gun Oil | Common (Aura) | upgrade 3 Barrier (+50%) | unchanged | Opening hand | A 128% | +25% |
| Slug Round | Common | 2: 16 (C 84%) | 19 | 24 | B 100% | +26% |
| Shard Toss | Common | 1: 6 to all + 1 Brittle; upgraded 9 (+44%) | 7 to all | 9 | B ~101% | +26% |

## 3. Hangover cards (Brewmaster)

| Card | Rarity | Now (grade) | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Haymaker | Rare | 2: 14 + 3 per Hangover (B 97%) | 18 + 4 per Hangover | 26 + 4 | A ~126% | +27% |
| Bottoms Up | Rare | 1: 2 Mana, draw 2, 4 Hangover, Consume (B 96%) | 2 Mana, draw 3, 3 Hangover | draw 4, 2 Hangover | A ~131% | +27% |
| Bottomless Flask | Rare (Aura) | 2: each turn heal 2 + 1 per 10% missing, draw 1 (B 121%) | heal 3 + 1 per 10% missing | heal 5 | A ~137% | +23% |
| Pass Out | Rare | 2: heal 8 + 1 per 3% missing, sober up, Consume (B 106%) | also draw 2 | costs 1 | A ~140% | +22% |
| Blind Drunk | Rare | 2: (6 + 1 per Hangover) x 3 random (B 93%) | 9 x 3 random (+ Hangover) | 12 | A ~128% | +30% |
| Last Call | Rare (Aura) | 2: +1 Mana each turn, 2 Hangover (D 66%) | kept at 2 Mana by #410; Opening hand, 1 Hangover | also draw 2 when played | C ~86% (the one Rare kept below A by that rule) | ~+25% |
| Whiskey Miracle | Rare | 1: heal 10, Consume (B 96%) | heal 10 + 1 per 10% missing | heal 14 + 1 per 10% | A ~125% | +30% |
| Barroom Brawl | Uncommon | 2: 16 to all, 2 Hangover (C 84%) | 18 to all | 23 | B ~96% | +29% |
| Swig | Uncommon | 0: 4 Might this turn, 2 Hangover, Consume (D 60%) | 5 Might this turn, draw 1 | 6 Might | B ~119% | +20% |
| One for the Road | Common | 0: draw 3, 3 Hangover, Consume (C 87%) | 2 Hangover | 1 Hangover | B ~107% | +19% |
| Drunken Swing | Common | upgrade 18 (+42%) | unchanged | 17 | B 95% | +32% |
| Nurse the Hangover | Common | upgrade 8 (+37%) | unchanged | 7 | B 96% | +25% |
| Black Out | Uncommon | upgrade 18 (+48%) | unchanged | 17 | B 96% | +33% |
| Sob Story | Common | upgrade heal 6 (+45%) | unchanged | heal 5 | B 104% | +30% |

## 4. Low HP, pain and glass cards (Deathwish)

| Card | Rarity | Now (grade) | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Rock Bottom | Rare (Aura) | 1: 2 Might; lose 1 HP each turn (D ~35%) | 3 Might now; each of your first 6 turns lose 1 HP and gain 1 Might | Opening hand | A ~120-150% | +25% |
| Last Orders | Rare | 2: 8 to all + 1 per 4% missing (C 85%) | 14 + 1 per 3% missing | 18 + 0.4 per % missing | A ~131% | +26% |
| Broken Window Theory | Rare (Aura) | 2: turn end 1 + 1 per 6% missing to all (C 82%) | 4 + 1 per 5% missing | 7 + 1 per 5% | A ~137% | +30% |
| Booby-Trapped Window | Rare (Trap) | 2: when attacked, cancel + 13 (C 89%) | cancel + 18 + 2 Exposed | 26 | A ~129% | +25% |
| The Glass Palace | Rare (Aura) | 3: turn start 3 + 1 per 6% missing Barrier; self-HP loss hits all, max 5 (B 124%) | 4 Barrier + 1 per 6%; max 6 | max 8 | A ~132% | +25% |
| Glass Jaw | Rare (Aura) | 2: self-HP loss hits all (max 6), 2 Barrier (B 120%) | max 7, 3 Barrier | max 9, 4 Barrier | A ~132% | +27% |
| Stumble | Uncommon | 1: 9 random, 4 Barrier, 2 Hangover (C 88%) | 10 random, 5 Barrier | 13 | B ~107% | +23% |
| Free-for-All | Uncommon | 2: 7 x 3 random (C 89%) | 8 x 3 | 10 x 3 | B ~101% | +25% |
| Rusty Nail Board | Uncommon (Trap) | 1: enemy turn 5 to all + 1 Faltering to all (C 88%) | 7 to all | 9 | B ~109% | +19% |
| Rummage the Bin | Common | 0: Foresee 3 (C 83%) | Foresee 3, 1 Barrier | 3 Barrier | B ~103% | +40% (nearest) |
| Hammer Swing | Basic | 1: 6 + 1 Brittle; upgraded 9 (+44%) | 7 + 1 Brittle | 9 | B ~97% | +26% |

Unchanged (already on target): Pane Up, Bottle Tripwire, Buckshot Shell, Old Twelve Gauge, Smash the Pane, Load Shells, Shell Game (A,
the gun's engine), Scope (A, the gun's engine), Bandolier (A, #681), Rack the Slide, Powder Load, Pistol Whip, Glass Cover, Hair
Trigger, Shell Shock, Shellshocked base, Birdshot, Buttstroke, Spare Barrel, Gun Oil base, Broken Bottle, Chaser, Dumpster Dive, Sway,
Liquid Courage, Window Pane, Mean Drunk, Double Tap, Molotov Cocktail, Sawn-Off, Tin Can Alley, Bar Stool, Bar Fight, Take It on the
Chin, Liquid Lunch, Bottle to the Head, Sweat It Out, Bender, Hair of the Dog, Liquid Dinner, Dutch Courage, Haphazard Hook, Drunken
Lurch, Drunken Master, Morning After.

## 5. Engine work needed

- Gunslinger: the turn-start sharpening for the first 10 turns (`times: 10`) and a Shell play sharpening the gun (a play trigger on the
  `shell` tag, as Hair Trigger already does).
- Brewmaster: the `brewing` discipline gains an Attack bonus per Fermentation (`attackPct`) and a higher cap and heal.
- Deathwish: new numbers on the `desperation` discipline; the strike-back is a `loseHp` trigger to a random enemy, twice a turn, scaled
  by the HP just lost (max 4), with existing pieces.
- Rock Bottom: a turn-start trigger for its first 6 turns (`times: 6`).
