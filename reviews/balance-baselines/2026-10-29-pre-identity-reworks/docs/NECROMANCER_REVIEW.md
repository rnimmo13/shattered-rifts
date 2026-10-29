# Necromancer review: the card costing guide (proposal, 2026-10-28)

**Status: applied 2026-10-28 (0.117.0, DECISIONS #397).** Robert: "he felt particularly weak in the first stage where everyone else felt ok or good ... i feel like raise 2 trait should be like raise 5 or something", then, after the numbers below, "ok lets go with raise 3 and the small card fixes you suggested". Built: Grave Chill gains "At the start of your turn, Raise 3"; Bone Bulwark Raise 5 + 8 Barrier (+ Raise 6 + 10); Bone Sift Raise 5; Grave Robbery 6 (+ 8); Spirit Walk needs 6 cards; Toll in Advance gives 5 Mana (not "next card costs 1 more": there is no such op, and "+3 now, 1 less next turn" would have been the Engineer's Overcharge). Re-priced with each turn's Thrall dying and feeding Grave Chill's Fate: Raise 2 ≈ +25, Raise 3 ≈ +33 (trait ~48, level with the Trickster), Raise 5 ≈ +45 (~60, the strongest in the game). Robert: "the necromancer feels weak. can you run it through the card cost
analysis and tell me what you think".

## Verdict

**The cards are fine; the class around them is not.** The Necromancer is one of the five classes the costing guide was built from
(the Necrobinder copy, DECISIONS #370), and most of his cards land within ±15% of budget, as they should. The weakness is in three
places the card prices don't see:

1. **His trait is the weakest in the game for its job** (about 15 points a fight in the starter deck, against 20-30 for most classes).
2. **His damage cards need a Thrall standing on his turn, and his Thralls rarely survive the enemy's turn.** The guide prices a Command
   card at one Thrall; in play it is often zero.
3. **Fate does nothing until it reaches an enemy's HP**, and Grave Chill's 3 Fate never gets there on its own.

## 1. The trait, priced (a fight of 5 turns, the starter deck)

| Class | Trait | Points a fight |
|---|---|---|
| Trickster | 6 Barrier, 2 cards, 4 Barrier a turn, Full Trick | ~40-50 |
| Engineer | a Drone, heal 1 and +1 companion max HP a turn | ~29 |
| Spellblade | 1 Arcana and Sharpen 1 a turn | ~17 (more with Arcana cards) |
| Knight | 6 Barrier, 6 Plating | ~22 |
| Hunter | a Hound, Might shared, heal 2 after a fight | ~20-25 |
| Assassin | a Dagger a turn | ~20 |
| Monk | 1 Fervor a stance | ~10-20 |
| Shaman | Hawk, Bear and Splinter totems | ~14 |
| **Necromancer** | a 5-HP Thrall (9), 3 Fate to all (2.7), 3 Fate per death or consume (~2 deaths: 4.2; the starter consumes nothing) | **~15** (~23 in a Souls deck) |

And the Fate part is worth less than its 0.7 a stack here: 3 Fate on a 40-HP enemy never kills it without Fate cards on top.

## 2. Thralls die before he can command them

- The starting Thrall has 5 HP. A Tier I enemy hits for 8-15, and a single attack strikes the companion in front first, so the Thrall
  dies on the enemy's first attack, almost always turn 1.
- From then on **Off the Leash, Knucklebone, Bone Snap, Bone Crush, Grasping Hands, Rattle the Bones, Death Grip, The Drowned King and
  Baleful Glance deal 0** unless he spends a card and 1 Mana on a Raise first, the same turn. The starter has one Raise in ten cards.
- The guide prices Commands at one living Thrall ("0.7-1.0 x a normal attack per Thrall"). That assumption holds maybe half his turns
  in the starter deck, so the Thrall build path plays at roughly half its price until he finds several Raise cards.

## 3. The cards

Within ±15%: almost all of them (Knucklebone, Creeping End, Tolling Bell, Barrow Keeper, Desecrate, Grasping Hands, Inevitable, Wither,
Last Rites, Bottled Soul, Grave Colossus, The Last Toll...). The ones the guide flags:

| Card | Points | Budget | Reading |
|---|---|---|---|
| Bone Bulwark (2, common): Raise 4, 7 Barrier | 7.8 + 8.4 = 16.2 | 19 | -15%: Raise 5, 8 Barrier (18.6) |
| Bone Sift (1, uncommon): Raise 3, consume the top card | 6.6 + ~2 = 8.6 | 11.2 | -23%: Raise 5 (11) |
| Grave Robbery (1, common): 4, a random card back, Consume | (4 + 3) x 1.25 = 8.75 | 10 | -12%: 6 damage (10) |
| Toll in Advance (1, uncommon): +4 Mana, cards cost 1 more this turn | after its own cost and +1 on ~3 cards, about +0 Mana | 11.2 | weak, and a trap for new players |
| Spirit Walk (2, rare): consume your hand; 9+ consumed: 2 Ghostly | almost never 9 | 23.8 | dead: needs 6 or more, or 1 Ghostly per 3 consumed |
| Death Grip (3, rare): companions each deal 20 (+5 per Command) | at 1 Thrall ~21 | 35 | fine with 2-3 Thralls, which he rarely has (§2) |
| Final Reckoning (2, rare): damage equal to Fate, Consume | ~15-20 Fate mid-fight: ~19-25 | 23.8 | fine in a Fate deck |
| Unquiet Rest (0, rare): 7 Barrier, a copy into discard | 10.4 | 7.5 | +39% (the reference copy) |
| At the Threshold (1, uncommon): 6 Barrier, +12 if you cursed this turn | ~15.8 | 11.2 | +40% in a Fate deck |
| Leech Lore (1, common): 10, upgrade 2 random cards in discard | ~14 | 10 | +40% |

The over-budget ones are the reference copies the guide leaves alone; the under ones are small. **Fixing cards alone will not fix
him.**

## Proposal (as first written; what was built is in the Status at the top: Raise 3, and Toll in Advance gives 5 Mana)

1. **Grave Chill gains "At the start of your turn, Raise 2."** (the Fate parts stay). That's about **+15 points a fight** (2.4 HP a turn,
   +3 whenever it makes a new Thrall), so he lands around 30, with the Engineer and the Knight. More to the point, there is a Thrall
   standing on most of his turns, so his Command cards do what they are priced to do. A chain of 2-HP Thralls also dies in a chain to
   one big hit (overflow), feeding Grave Chill's Fate.
   - **Watch:** Raise makes a new Thrall up to three. Three Thralls under Knucklebone is 18 damage for 0 Mana; that's the Thrall build
     path's payoff, but check it doesn't make the other two paths play the same.
   - **Smaller alternative:** the starting Thrall has 10 HP (it survives one hit) and Raise Thrall is Raise 7. About +8 a fight; fixes
     turn 1-2, not the rest.
2. **Card fixes** (small): Bone Bulwark Raise 5 + 8 Barrier; Bone Sift Raise 5; Grave Robbery 6 damage; Spirit Walk needs 6 cards;
   Toll in Advance becomes "Gain 3 Mana. Your next card costs 1 more" (+1 Mana net after its own cost, like the rest of the class's
   Mana cards; today it is about +0 net over three cards).
3. **Leave alone:** his HP (70, raised from the Necrobinder's 66), the over-budget reference copies, the Fate rates.
