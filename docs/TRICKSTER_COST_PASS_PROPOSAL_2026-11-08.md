# Trickster cost pass: proposal (2026-11-08, not built)

Status: **approved and built locally (DECISIONS #694), not released.** Two changes from the tables, kept by earlier rules: Deep
Pockets stays 2 Mana (the shared price of a +1 Mana Aura, #410) and gains Opening hand instead (B); Pickpocket Master stays 2 Mana
(tied to the Monk's All-Seeing) and gives 3 upgraded free cards (4 upgraded).

Goal (as for the Hunter, #693): each Ascendancy opens more than one way to win, with long-term scaling for the Arena, priced against
builds known to be good. Prices follow [docs/14_CARD_COSTING.md](14_CARD_COSTING.md): Rares in A (125-160%), most Uncommons in B
(90-124%), upgrades about +30%. Trap spring factors: attacked 0.85, enemy turn 0.9, 3+ HP lost 0.75, enemy Barrier 0.6, enemy summons
0.4. A Full Trick comes about every other turn in a suits deck.

## 1. Ascendancies

| Ascendancy | Now (late game / Arena) | Proposed | Routes it opens |
|---|---|---|---|
| **Trapmaster** | 2 more Traps; a Trap springing draws 1 and gives 2 Barrier; Traps +5% per Trap sprung this fight, up to +50% (B+ / B+) | **2 more Traps. A Trap springing draws 1 and gives 2 Barrier plus 1 for every Trap sprung earlier this fight (up to +8). Your Traps deal 10% more for every Trap sprung earlier this fight, up to +100%.** | **Trap damage**: Time Bomb, Trap Net, Hollow Trap, Tripwire Garrote, Gleeful Trapsmith, Spring the Trap, Trapline Rider, which double by late fight. **Trap control**: Mirror Veil, Bait and Switch, Silencing Trap, The Perfect Trap, Trapper's Dividend, Master Trapper, whose growing Barrier is the defence |
| **Cardsharp** | A Full Trick gives 1 Mana and 1 Might (B / B) | **A Full Trick gives 1 Mana and 2 Might (up to 12 Might from it). The first time each turn you have shown 3 suits, draw 1.** | **Full Trick burst**: Masquerade, Showstopper, Royal Flourish, Card Sharp, Card Fan with growing Might on the ♠ Attacks. **♦ card flow**: The Whole Deck, Deep Pockets, Sleight of Hand, Cut the Deck, Wild Card, The Joker, which the 3-suit draw keeps fed |
| **Seer** | First aimed Attack each turn marks its enemy and applies 1 Exposed; same mark +10% a turn, up to +50% (A- / A-) | **Unchanged, except: when your marked enemy dies, your next mark keeps the bonus.** | **One mark**: Coup de Grace, Blindside, Death Mark, Long Con on a growing mark. **Spread Exposed**: Unmask, Smoke Bomb, Culling, Hunter's Eye, Patient Hunter, and the bonus carries from kill to kill in group fights |

Expected: Trapmaster A- / A, Cardsharp A- / A-, Seer A- / A.

## 2. Trap cards

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Time Bomb | Rare (Trap) | 1: enemy turn, 12 to all (B 112%) | 15 to all | 19 | A ~140% | +27% |
| Spring the Trap | Rare | 1: 6 + 5 per Trap set (B 108%) | 8 + 6 per Trap set | 10 + 8 | A ~136% | +29% |
| The Perfect Trap | Rare (Trap) | 3: cancel + 22 + Stun 2 (B 117%) | cancel + 26 + Stun 2 | costs 2 | A ~126% | ~+26% |
| Bait and Switch | Rare (Trap) | 2: cancel + 12 (C 86%) | cancel + 18 + 2 Exposed | 28 | A ~129% | ~+27% |
| Silencing Trap | Rare (Trap) | 2: Stun 2 + Shielded (C 89%) | Stun 3 + Shielded + 2 Exposed | costs 1 | A ~136% | ~+35% |
| Trapper's Dividend | Rare (Aura) | upgrade 8 Barrier (+40%) | unchanged | 7 | A 144% | +27% |
| Gleeful Trapsmith | Uncommon (Aura) | 1: setting a Trap, 4 to all (A 147%) | 3 to all | 4 | B ~110% | +33% |
| Trapline Rider | Uncommon | 1: 4 + 4 per Trap set (C 89%) | 5 + 4 per Trap set | 7 + 5 | B ~98% | +31% |

## 3. Exposed cards

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Coup de Grace | Rare | 3: 18 + 4 per Exposed (C 74%) | 2 Mana, 20 + 5 per Exposed | 26 + 6 | A ~126% | +27% |
| Culling | Rare | 2: 8 to all + 3 per Exposed on each (C 77%) | 14 to all + 5 per Exposed on each | 18 + 6 | A ~131% | +25% |
| Compound Fear | Rare | 1: 2 Exposed then double it (max 4), Consume (C 77%) | 0 Mana | max 6 | A ~128% | +25% |
| Hunter's Eye | Rare (Aura) | 2: each Attack's target gains 1 Exposed (D 63%) | 1 Mana, Opening hand | costs 0 | A ~150% | ~+30% |
| Patient Hunter | Rare (Aura) | 1: 1 Exposed to all each turn (B 90%) | 0 Mana, Opening hand | also 1 Faltering to all when played | A ~150% | +20% |
| Blindside | Rare | 2: 22 + 3 Exposed, Consume (B 104%) | not consumed | 30 | A ~131% | +26% |
| Long Con | Uncommon | 2: 14 + 1 Exposed, Hold (C 89%) | 16 | 21 | B ~99% | +24% |
| Tear the Veil | Common | upgrade 2 Exposed to all (+39%) | unchanged | draw 3 | B 115% | +35% |

## 4. Suit, card and Mana cards

| Card | Rarity | Now | New base | New upgrade | New grade | Gain |
|---|---|---|---|---|---|---|
| Showstopper | Rare | 3: 30, 1 cheaper per suit shown (S ~240%) | 20, 1 cheaper per suit shown, never below 1 | 26 | A ~160% | +30% |
| Royal Flourish | Rare | 2: 7 per suit shown (C 81%) | 1 Mana | 9 per suit | A ~140% | +29% |
| The Whole Deck | Rare (Aura) | 1: a Full Trick draws 2, +1 Mana next turn (B 110%) | a Full Trick draws 2 and gives 1 Mana now | draw 3 | A ~140% | +29% |
| Second Act | Rare | 1: next Attack played twice, Hold; upgraded costs 0 (+70%) | also draw 1 | draw 2 | A ~128% | +25% |
| The Joker | Rare | 1: a random free card, any suit (B 104%) | a random upgraded free card | also draw 1 and 2 Barrier | A ~128% | ~+30% |
| Pickpocket Master | Rare | 2: 2 random free cards, Consume (D 67%) | 1 Mana | they are upgraded | A ~128% | ~+25% |
| Deep Pockets | Rare (Aura) | 2: +1 max Mana (C 74%) | 1 Mana | Opening hand | A ~140% | +25% |
| Masquerade | Rare (Aura) | (A 141%) | unchanged | unchanged | A | +30% |
| Perfect Alibi | Rare | 1: 13 Barrier, discard 1 (B 109%) | 16 Barrier | 20 | A ~138% | +28% |
| Patient Guard | Rare (Aura) | 1: end of turn 2 Barrier per card held (C 72%) | 4 per card | 5 | A ~144% | +25% |
| Between Worlds | Rare | 2: Ghostly 2, Consume (C 88%) | Ghostly 3 | costs 1 | A ~131% | ~+30% |
| Frozen Moment | Uncommon | 1: hand costs 1 less for the fight, Consume (D 54%) | draw 1 first | draw 2 | B ~96% | +30% |
| Trick of the Light | Uncommon | 0: Foresee 2, 2 Barrier; upgraded +111% (D 66%) | Foresee 3, 3 Barrier | 5 Barrier | B ~121% | +30% |
| Wild Card | Uncommon | 0: draw 1, any suit, Consume (C 83%) | draw 2 | Hold | B ~119% | +20% |
| Weigh the Odds | Common | 1: Foresee 3, draw 1, Hold (C 80%) | Foresee 3, draw 2, Hold | draw 3 | B ~115% | +30% |

Unchanged (already on target): the basics; Trip Line, Hollow Trap, Trap Kit, Spring-Loaded, Fang Pit, False Floor, Mirror Veil,
Tripwire Garrote, Trap Net, Metronome Trap, Poison Pantry, Grim Collection, Trap Door, Curtain Call, Master Trapper, Opening Strike,
Masquerade, Mark Prey, Unmask, Exploit Weakness, Veil Dance, Cheap Shot, Slit and Run, Low Blow, Death Mark, Shadow Volley, Stalk,
Strip the Guard, Smoke Bomb, Dread Gaze, Cripple, Spotlight, Hamstring, Cold Read, Patient Blade, Shadow Cloak, Hidden Hand,
Flourish, Fade Back, Card Fan, Card Sharp, Cut the Deck, Queen of Hearts, Ace of Clubs, Sleight of Hand, Saved Breath, Stolen
Moment, The Long Game, Step Aside, Mask of Faces.

## 5. Engine work needed

- Trapmaster: the Barrier on a spring scales with Traps sprung this fight, capped (the `snaresSprung` metric exists; a scale `max`
  exists); the snarecraft numbers change to 10% / 100%.
- Cardsharp: Might from Full Tricks capped at 12 (`times: 6`); "the first time each turn you have shown 3 suits, draw 1" (a once-a-turn
  play trigger gated on the suits count, if the count is updated before play triggers; otherwise a small `threeSuits` trigger).
- Seer: when the marked enemy is dead, a new mark keeps the bonus (the `pursuit` discipline).
- Showstopper: a floor for `cheaperPer` (never below 1 Mana).
