# Arena scaling pass, 2026-11-12 (DECISIONS #762)

Rules 109. Not released. Worked by hand from the card data and this week's real fights; no bot games.

## Why

Robert: "the game has massive imbalances still... the game needs comparable scaling for every class", balanced around the Arena, with diminishing returns on cards and mechanics and no cap on a turn's damage. Classes are judged against Slay the Spire 2: an engine may ramp and pay off in a big turn, but every class's ramp should land in the same band.

The goldfish pass two days earlier (#726 to #728) had a bot report "no kill before own turn 6, median 11". Real players in the same week killed on own turn 3 (Beastmaster, 946 in one turn) and hit for 1,376 with one card (Obsidian Blade). The bot plans one turn at a time and never builds an engine, so its numbers are not a measure of the ceiling.

## Evidence

- Server pull of 9 to 12 November: 507 Campaign fights, 12 runs, 7 Arena games, 3 players, 11 of the 40 builds.
- A hand-worked ledger for all 30 Ascendancies: each class's growing stats, its payoffs, and what they reach on own turns 4, 7 and 10 against 1,000 HP and an opponent who does nothing (a tight 25-card upgraded deck, no Boons, average draws; about ±30%).
- The hand arithmetic reproduces the real hits: Obsidian Blade 1,374 against 1,376 recorded; Pack Frenzy 411 against 411; Gathering Storm 1,485 against a 1,452 turn.

## The pattern

Every runaway build had the same three parts: a stat that grows all fight with no slowdown, a cheap payoff that can be played every turn, and one or more doublers on top (replays, extra actions, Fury). The builds that were already in band had "half past a threshold" or a ceiling on the stat; the runaway ones never got it.

## Before: kill turn against a passive 1,000 HP, by hand

| Build | Kill turn | Biggest card on own turn 7 |
|---|---|---|
| Beastmaster | 4-5 (3 lucky) | 850-1,200 |
| Totemist on Gathering Storm | 5 | 165 a cast, about 10 casts a turn |
| Bonelord | 5 | 420 |
| Seer | 5 | 225 (450 replayed) |
| Sunwalker | 6 | 144 (the turn is about 430) |
| Archmage | 5-7 | 390-1,550 |
| Gunslinger, Deathwish | 6-7 | 270 (560-1,150 at low HP) |
| Fateweaver | 6-7 | an execute |
| Marshal | 7 on paper (10+ in real fights) | 207 |
| Bladedancer | 7-8 | 450-650 |
| Bloodletter, Shatterer, Golemancer, Reaver, Zealot, Sage, Spiritwalker | 7-8 | 100-290 |
| Paladin, Blood Knight, Swarmwright, Artillerist, Predator, Soulreaper | 8-9 | 86-160 |
| Assassin, Cardsharp, Trapmaster, Brewmaster, Blademaster, Elementalist | 8-12 | 54-132 |

Target band: a kill against a passive opponent on own turn 7 to 9, which is about 10 against one who fights back.

## What changed

### Rules

| Rule | Before | Now |
|---|---|---|
| A card that is free by a condition (Bone Crush after a Command) | cost nothing, whatever was added to the copy | its own cost is waived; cost added to the copy (a Replay mark's +1 each) is still paid |
| Fury or Serene on a hero who is not a Monk (a Rift-crossed Swift Step) | lasted the rest of the fight: every Attack doubled | ends as their next turn begins, so Fury's 50% more damage taken is still paid on the enemy's turn |
| Companions made to act again by a card or Aura | every time in full | the first time each turn in full, every time after that for half damage (the turn's own action at its end is not counted) |
| Reaper's Mantle | Fate equal to the HP your Attacks take | half of it, rounded up |

### Ascendancy

| Ascendancy | Before | Now |
|---|---|---|
| Beastmaster | companions share all your Might | all of the first 6, half of the rest |

### Cards

| Card | Before | Now |
|---|---|---|
| Obsidian Blade | +2 per Spell Power | +2 per Spell Power to 20 of it, +1 after |
| Every card that spends Spell Power (Cataclysm, Lava Bomb, Molten Ruin, Thousand Shards, Stress the Glass, Arcane Barrier, Glass Wall and the rest) | every point spent in full | the first 20 points in full, the rest half |
| Gathering Storm | reads all its Gather | in full to +12, half after, at most +24 |
| Old Twelve Gauge | reads all its Precision | in full to +30, half after, at most +90 |
| Exploit Weakness | +2 per Exposed, no limit | in full to +16, half after, at most +32 |
| Slip the Leash | doubles your Might | doubles it, gaining at most 8 (10 upgraded) |
| Off the Leash | each companion adds half its HP | half its HP to +15, a quarter after |
| Recall the Blades | plays every consumed Dagger | the first 20, and every second one after |

## After, by hand (own turn 7, passive opponent)

| Build | Biggest card | The turn | Kill turn |
|---|---|---|---|
| Archmage | Blade about 120 a hit (240 with one Echoing Blade) at 93 Spell Power; Cataclysm about 360 once | about 250-400 | 7-8 |
| Totemist on Gathering Storm | at most 47 a cast | about 400-470 with ten casts | 6-7 |
| Gunslinger, Deathwish | at most 119 a shot before the low-HP bonuses | about 390 | 7 |
| Beastmaster | one action about 180 | about 550-650 | 5-6 |
| Bonelord | Off the Leash about 300 replayed as the first Attack; Bone Crush once or twice | about 550 | 6 |
| Seer | Exploit Weakness 90, Coup de Grace 166 | about 350 | 6-7 |
| Bladedancer | Recall about 320 (34 of 48 Daggers) | about 350 | 8 |

These are estimates. The Beastmaster and the Bonelord are still the fastest and should be watched first.

## Left alone on purpose

- **Sunwalker.** No stat runs away: Radiant triples every turn from turn 3. That is a design question, not a ceiling, and after this pass it sits with the other top builds.
- **Marshal.** By hand it kills on turn 7; in real fights this week it was the slowest deck by far (a 41-card list). Not touched until a tight list is played.
- **Fateweaver.** Fate never fades and executes; kill on turn 6 to 7 by hand. Watch.
- **The low-HP bonuses of the Drunkard** (Clutch Genes and Deathwish), which about double the gun at 40% HP: that is the class's risk and stays.
- **Shatter's own step** (+3 a Shatter) and Fault Memory's growth. The Spell Power part of a Shatter engine is slowed by the spend rule above.
- **Echoing Blow replaying an X spell with the same X**, now that the X is slowed.
- **Defence that grows without limit** (the Bonelord's wall, Barrier from Spell Power, Barrier per Shell): not priced in this pass.

## Not done yet: the builds that sit below the band

Blademaster without generators, Cardsharp, the Brewmaster's own cards, Predator, Soulreaper, the Elementalist's own trait, and a Trapmaster whose opponent does not attack. They need a pull up, by hand, in a later pass.

## How to check it

Each number can be reproduced in the Sandbox against a training dummy at Arena HP. Tests: `packages/content/src/v2/arenaScaling.test.ts`, and the updated numbers in `assassinCaps.test.ts`, `hunterPass.test.ts`, `necromancer.test.ts`, `spellblade.test.ts` and `packages/combat/src/raise.test.ts`.

## Later the same day: #763 to #766

- **#764 Radiant doubles** attack damage (it tripled it). Sunwalker: about 430 to about 290 on own turn 7.
- **#765 Rift Surge is Uncommon and Nerve Surge is Rare.**
- **#763 Campaign:** steeper tiers, a Warden premium, Rare 20% from Elites, and the three curse answers Hold once upgraded.
- **#766 Seven builds brought up:** Blademaster, Cardsharp, Brewmaster, Predator, Soulreaper, Elementalist, Trapmaster (see DECISIONS #766 for each number).

## Grades after the whole pass

By hand: Arena, 1,000 HP, an opponent who does nothing, a tight 25-card upgraded deck, no Boons, average draws. About ±30%. "Real" means a real player's fights from 9 to 12 November exist for that build (all from before these changes); "hand" means nothing but the arithmetic.

Grade by kill turn: **S** 5 or sooner (too strong), **A** 6 to 7, **B** 8 to 9, **C** 10 or later (too weak). The band aimed for is A- to B+.

| Class | Ascendancy | Own turn 7, a turn | Kill turn | Grade | Evidence | Note |
|---|---|---|---|---|---|---|
| Hunter | Beastmaster | 550-650 | 5-6 | S- | real | still the fastest; watch first |
| Necromancer | Bonelord | about 550 | 6 | A+ | real | also the safest deck in real fights |
| Spellblade | Shatterer | about 500 | 7 | A | hand | untouched but for Spell Power; may now be near the top |
| Shaman | Totemist | 400-470 | 6-7 | A | real | on Gathering Storm |
| Drunkard | Deathwish | about 390, double at low HP | 6-7 | A | real | strongest when hurt, which is the risk it takes |
| Trickster | Seer | about 350 | 6-7 | A | hand | |
| Necromancer | Fateweaver | an execute | 6-7 | A | real, low tiers | Fate never fades; answers now Hold |
| Drunkard | Gunslinger | about 390 | 7 | A- | real, low tiers | |
| Spellblade | Archmage | 250-400 | 7-8 | A- | real | |
| Knight | Marshal | 450-500 on paper | 7 on paper | A- | real, and slow there | a 41-card list was the slowest deck of the week |
| Rogue | Bloodletter | about 250 | 7-8 | A- | hand | |
| Shaman | Spiritwalker | about 300, one 700 turn | 7-8 | A- | hand | |
| Hunter | Reaver | about 270 | 7-8 | A- | hand | |
| Monk | Sunwalker | about 290 | 7-8 | B+ | real | was A+ before Radiant doubled |
| Monk | Sage | about 250 | 7-8 | B+ | hand | |
| Rogue | Bladedancer | about 350 with Recall | 8 | B+ | hand | |
| Engineer | Golemancer | 280-340 | 8 | B+ | hand | |
| Monk | Zealot | 220-300 | 7-8 | B | hand | takes 50% more all fight |
| Knight | Blood Knight | 200-250 | 8-9 | B | hand | |
| Engineer | Swarmwright | 250-350 | 8-9 | B | hand | |
| Hunter | Predator | about 270 | 8 | B | hand | buffed |
| Necromancer | Soulreaper | about 240 | 8 | B | hand | buffed |
| Trickster | Cardsharp | about 245 | 8-9 | B | hand | buffed |
| Shaman | Elementalist | shell plus about 80 | 8 | B | hand | buffed; rides a Storm or Burn deck |
| Trickster | Trapmaster | 180 passive, about 250 attacked | 8 | B | hand | buffed |
| Spellblade | Blademaster | 180-200 | 9 | B- | hand | buffed |
| Drunkard | Brewmaster | about 185 on his own cards | 9 | B- | hand | buffed; A with the gun cards |
| Knight | Paladin | under 100 to 300 | 8-9 or worse | B- | hand | its damage is Barrier the opponent leaves alone |
| Rogue | Assassin | 160-200 | 8-10 | B- | hand | every part capped; not buffed |
| Engineer | Artillerist | 150-220 | 8-9 | B- | hand | capped by design; not buffed |

Nothing is C by hand any more, and one build is still S. The spread is turn 5 to 6 at the top and turn 9 at the bottom; before today it was turn 3 to 4 and turn 11 to 12.

## #767: the gap closed further, and Arena HP 1200

The Beastmaster's share of Might stops at 14 and the Bonelord has 2 Marrow; the Paladin, the Assassin and the Artillerist are brought up (see DECISIONS #767). Arena HP is 1200; this ledger and every tool stay on the 1,000 baseline, so in the Arena itself each kill turn below comes about one turn later.

Rows that changed from the table above:

| Class | Ascendancy | Own turn 7, a turn | Kill turn | Grade | Was |
|---|---|---|---|---|---|
| Hunter | Beastmaster | about 460 | 6 | A | S- |
| Necromancer | Bonelord | about 530 | 6 | A | A+ |
| Knight | Paladin | 170-330 | 8 | B | B- |
| Rogue | Assassin | about 200 | 8-9 | B | B- |
| Engineer | Artillerist | 190-260 | 8 | B | B- |

The top is now seven builds at A (Beastmaster, Bonelord, Shatterer, Totemist, Deathwish, Seer, Fateweaver: a kill on own turn 6 to 7) and the bottom two at B- (Blademaster and the Brewmaster on his own cards: turn 9). Nothing is S or C by hand.

## #768 (after 0.259.0, not released): the top eased down

See DECISIONS #768 for every number. The chart after it, by hand on the 1,000 baseline (a passive opponent, a tight upgraded deck, about ±30%); grade by kill turn, S 5 or sooner, A 6 to 7, B 8 to 9, C 10 or later, with a kill on turn 7 to 8 counted B+.

| Grade | Class | Ascendancy | Own turn 7, a turn | Kill turn |
|---|---|---|---|---|
| A- | Hunter | Beastmaster | about 440 | 6-7 |
| A- | Necromancer | Bonelord | about 450 | 6-7 |
| A- | Knight | Marshal | 450-500 on paper | 7 on paper; the slowest deck in real fights |
| B+ | Spellblade | Shatterer | about 400 | 7-8 |
| B+ | Shaman | Totemist | 350-390 | 7 |
| B+ | Drunkard | Deathwish | about 350, double at low HP | 7-8 |
| B+ | Drunkard | Gunslinger | about 350 | 7-8 |
| B+ | Trickster | Seer | about 320 | 7 |
| B+ | Necromancer | Fateweaver | an execute | 7-8 |
| B+ | Spellblade | Archmage | 230-380 | 7-8 |
| B+ | Rogue | Bloodletter | about 250 | 7-8 |
| B+ | Shaman | Spiritwalker | about 300, one 700 turn | 7-8 |
| B+ | Hunter | Reaver | about 260 | 7-8 |
| B+ | Monk | Sunwalker | about 290 | 7-8 |
| B+ | Monk | Sage | about 250 | 7-8 |
| B+ | Rogue | Bladedancer | about 350 with Recall | 8 |
| B+ | Engineer | Golemancer | 280-340 | 8 |
| B | Monk | Zealot | 220-300 | 7-8 |
| B | Knight | Blood Knight | 200-250 | 8-9 |
| B | Engineer | Swarmwright | 250-350 | 8-9 |
| B | Hunter | Predator | about 260 | 8 |
| B | Necromancer | Soulreaper | about 240 | 8 |
| B | Trickster | Cardsharp | about 245 | 8-9 |
| B | Shaman | Elementalist | its deck plus about 80 | 8 |
| B | Trickster | Trapmaster | 180 passive, about 250 attacked | 8 |
| B | Knight | Paladin | 170-330 | 8 |
| B | Rogue | Assassin | about 200 | 8-9 |
| B | Engineer | Artillerist | 190-260 | 8 |
| B- | Spellblade | Blademaster | 180-200 | 9 |
| B- | Drunkard | Brewmaster | about 185 on his own cards | 9 |

## #769: the Beastmaster and the Knight through their cards

Trail of Blood (the first 4 summons), Pack Frenzy+ (4 Might, two actions), Hot Temper (a copy only as the first Attack of a turn), Oath Unbroken (2 Might), Vow Fulfilled (half past 5 Reserves). Rows that changed from the chart above:

| Grade | Class | Ascendancy | Own turn 7, a turn | Kill turn | Was |
|---|---|---|---|---|---|
| B+ | Hunter | Beastmaster | about 370 | 7 | A- |
| B+ | Knight | Marshal | about 380 on paper | 7-8 | A- |
| B+ | Necromancer | Bonelord | about 450 | 6-7 | A- (regraded: a high B+, the strongest row, and the first to watch) |

Nothing is above B+ and nothing below B-: by hand every build kills a passive 1,000 HP between own turn 7 and turn 9, about 8 to 10 in the Arena at 1,200.
