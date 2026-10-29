# Card costing: what every number on a card is worth

How to price a card, worked out from the five baseline classes (Knight, Assassin, Spellblade, Necromancer, Shaman: the
Ironclad, Silent, Regent, Necrobinder and Defect shapes, DECISIONS #364-371). Their numbers are the reference because they come from a
game that has been balanced for years; this file turns them into exchange rates we can use on the other five classes and on new
cards. Written 2026-10-28 from the card list at 0.106.0 (`docs/10_CARD_LIST.md`).

These are rules of thumb, not a formula the game enforces. A card that scores on budget can still be broken in a combo, and a card
that scores low can be the best card in its build path. Use the score to find the cards worth a closer look, then check them in play
(and with `pnpm audit:balance` when Robert asks for sims).

Everything assumes the normal turn: 3 Mana, a 5-card hand, a fight of about 4-6 of your turns, Tier I enemies hitting for 8-15.

---

## 1. The unit: 1 point = 1 damage to one enemy, now

Every effect converts into points. A card's points, added up, should land on its **budget** (§2).

### The budget by cost (a common card)

| Cost | Budget | Reference cards |
|---|---|---|
| 0 | **6** | Quick Slash (6), Arc Flash (3 + 1 Exposed), Turn Aside (4 Barrier) |
| 1 | **10** | Hilt Strike (9 + draw 1), Twin Cut (5 x2), Dirty Hit (8 + 1 Faltering), Stone Skin (9 Barrier), Emberstrike (9 + 1 Arcana) |
| 2 | **19** | Obsidian Flurry (6 x3), Glass Veil (11 + 5 next turn), Stalker's Lunge (15 + 2 cards next turn) |
| 3 | **28** | Harvest (27, Hold), Skybreaker (26, +1 Mana on a kill), Hammer Fall (32, uncommon) |
| 4 | **37** | |

Past 1 Mana each Mana buys about **9 points**. A 0-cost card is worth more than its zero suggests: it still spends a card from your
hand, and that card slot is worth about 5-6 points on its own. That is also why a card that costs 1 more is never just "+9": the bigger
card saves you a card.

### Rarity

| Rarity | Budget |
|---|---|
| Basic (Strike, Defend) | 60% (Strike 6 of 10, Defend 5 Barrier = 6 of 10). They are meant to be the cards you want to remove. |
| Basic (class signature) | 70-90% (Sundering Blow 74%, Cinderfall 78%, Raise Thrall ~90%) |
| Common | 100% |
| Uncommon | ~112% |
| Rare | ~125%, or an effect that is not on this scale at all (an Aura that changes how you play, an engine piece) |

### The quick conversions (memorise these)

On a 1-cost common (10 points) the following are all fair trades for **3 damage**:

- **1 Exposed** or **1 Faltering** on one enemy
- **2-3 Barrier**
- **draw 1** (as an extra on a card that already does something)
- **2 HP** you pay (self-damage)
- **4 Bleed** worth of total ticks (a fresh 2 Bleed)
- **4 Fate**
- **Hold** plus **Opening hand**

So `Deal 10` = `Deal 7, Apply 1 Exposed` = `Deal 4, Apply 2 Exposed` = `Deal 7, draw 1` = `Deal 13, lose 2 HP`.

---

## 2. Damage and targeting

| Modifier | Points | Notes |
|---|---|---|
| Damage, one target | **1.0** per point | The unit. |
| Damage to ALL enemies | **1.3** per point | AoE numbers sit at ~75-80% of single-target: Breach (9 AoE, lose 1 HP), Cartwheel Cut (7 AoE, Sly), Scatter Ashes (8 AoE, Hold), Ember Toss (6 AoE + draw 1). In a one-enemy fight it is plain damage, so don't push AoE past 1.4. |
| Damage to a random enemy | **0.9** per point | Can't focus a kill (Cleaving Throws 3 x3 = 9). |
| Several hits | same total as one hit | Twin Cut 5 x2 = 10. But every hit gets Might, Primed, Edge and Thorns: in a class with Might sources, take **~1 point off per extra hit**; in a class with none, multi-hit is free flavour. |
| "Your companions each deal N" | **0.7-1.0 x** a normal attack's number per Thrall | Price it at one companion; the second and third are the build's payoff. 0-cost Commands sit at 100% (Knucklebone 6), 1+ cost at ~70% (Bone Snap 7, Bone Crush 12). |
| X cost | **~7 points per X** at uncommon (70-80% of the 9-per-Mana slope) | X cards never waste Mana and grow with every Mana effect. Run Through 8/X, Whirling Blade 5 AoE/X. The upgrade is always X+1 (`plus()`). |
| Damage that grows ("every copy gains N") | first play at ~90% of budget, then **N x 1.2** for the growth | A card comes round every 2-3 turns, so expect 1-2 more plays (Mounting Fury 9 + 5, Gathering Storm 3 + 2 at 0 cost). |
| "+N per X" scaling | price at the X you expect **mid-fight**, not the best case | Mastered Strike: 6 + 2 per Strike, about 16-19 in a starter-based deck. Price the median; then check the ceiling with the combo test in §8. Usual X: **3-4 cards in hand** (more in a Hold deck), **1-2 Mana left** in a Patience deck (0-1 otherwise), **1.5 Traps set** in a Trap deck (3 at most). |

---

## 3. Defence

| Modifier | Points | Notes |
|---|---|---|
| Barrier, now | **1.2** per point | 9 Barrier = 10 damage. Defend 5 = Strike 6. Stone Skin 9, Dawn Smite 5 + 5 Barrier = 11. |
| Barrier next turn (Guarded, "next turn gain N") | **1.0** per point | Can't be aimed at a known intent. Roll Away 4 + 4 Guarded, Glass Veil 11 + 5. |
| Plating N | **~2.5** per stack | Only keeps Barrier you already have; shrinks each turn. Stoneskin (4) is a 1-cost uncommon. |
| Blur | the Barrier you expect to carry over (~4-5) | Smoke Veil: 5 Barrier + Blur. |
| Shielded | **~one enemy hit** (10-12 at Tier I) | Great against one big hit, nearly nothing against chip damage. |
| Cancel a hit (a Trap's "cancel that attack") | **~12**, one Tier I hit | The Trap springs on the first hit of a move and stops that hit only. Mirror Veil, Bait and Switch. |
| Ghostly (each hit capped at 1, fades each turn) | **~13** a stack: one enemy turn's damage | More against multi-hit enemies. Fade Away, Between Worlds. |
| Steadfast (ignore the next debuff) | **~2.5** a stack | 0 against an enemy that never debuffs. Mask of Faces. |
| Thorns until the enemy turn ends | **1 per stack per hit** the enemy makes that turn (~1.5 hits) | Ember Ward: 12 Barrier + 4 Thorns = 2 Mana. |
| Raise N (Thrall HP) | **1.2 per HP**, **+3** when it makes a new Thrall | A Thrall is Barrier that stays until struck, and another body for every Command. Raise Thrall 5 = ~9; After the End 6 + Consume. |
| Heal | **1.5** per HP | HP carries through the run. Expect Consume on any heal (Wanderer's Draught 6, Rally 10). |
| Bracing, rest of fight | **~4** per stack | You play fewer Barrier cards than attacks. Fleet Step: 2 Bracing for 1. |
| Bracing / Might / Spirit "this turn" | **1 per stack per card it will touch** this turn | Usually 2-3 cards: Heave (2 Might, 0 cost) ≈ 4-5. |

---

## 4. Debuffs on enemies

Percentage debuffs (Exposed, Faltering, Debilitated) are worth more as numbers grow (late tiers, Might decks, multi-hit). Flat ones
(Sapped, Thorns, Bleed) are worth less against big enemies. Re-check a status card against Tier X numbers, not only Tier I.

| Modifier | Points | Notes |
|---|---|---|
| **Exposed** (takes 50% more from attacks) | **3** per stack on one enemy (the first 3 stacks; 2 each after) | Sundering Blow 8 + 2 Exposed (basic, 74%), Crushing Palm 8 + 1, Provoke 7 Barrier + 1, Rattle 3 Exposed + Consume. Worth more in a deck that hits many times or with companions after it. |
| Exposed to ALL enemies | **4.5** per stack | Clarion Clap: 4 AoE + 1 Exposed to all. |
| **Faltering** (deals 25% less) | **3** per stack, vs an enemy that will attack | Dirty Hit 8 + 1, Stagger 4 + 2, Sweep the Leg 11 Barrier + 2. Zero against a buff or defend intent (Frost Needle checks for this). Grows with enemy damage, so it scales with tier. |
| Faltering to ALL enemies | **4.5** per stack | |
| **Debilitated** (Exposed/Faltering count double) | **~1.5** per stack in a deck that applies Exposed or Faltering, 0 otherwise | Wither: 10 + 2 Debilitated. |
| **Sapped** for a turn (flat damage off) | **1.2 per point per hit** the enemy makes that turn | Withering Touch 8 Sapped (Fleeting) ≈ 8 Barrier. Never worth more than the hit it shrinks. For the rest of the fight: about 3x. |
| **Bleed**, a fresh stack of N | **65% of the total it will tick**: N(N+1)/2 x 0.65 | It's slow but ignores Barrier. Open Vein 5 (15 ticks) ≈ 10, Barbed Stab 6 + 3 Bleed ≈ 10, Viper's Kiss 7 + Hold ≈ 19 (a 2-cost). Short version: ~1.5 per stack for 1-3 Bleed, ~2 per stack for 5-7. |
| Bleed added to an existing stack | **~0.65 x N x the turns that stack has left** | Stacking is where Bleed gets strong; the payoffs (Virulent, Bloodburst, Reopen the Wound) are priced on a stack already being there. |
| **Fate** | **0.7** per stack (**0.9** to ALL) | Nothing until it reaches the enemy's HP, then everything. Tolling Bell 13 Fate + draw 1, Creeping End 5 Barrier + 7 to all. Weakest against bosses (it has to climb to their HP), strongest as a finisher on regular fights. |
| Strangled N (loses N per card you play) | **N x the cards you will still play this turn** (~3) | Garrote: 8 + 2 Strangled ≈ 14 (uncommon). |
| Stunned | Exposed + Faltering + Brittle together, so **~7 per turn** of it, more on a big attacker | Keep it rare. |
| Brittle (its Barrier gains are 25% smaller) | **~0.75** a stack | Only against enemies that defend. Strip the Guard, Poison Pantry. |

---

## 5. Resources: Mana, cards, and class resources

| Modifier | Points | Notes |
|---|---|---|
| **+1 Mana now** | **7** (the 1st and 2nd); **3.5** each after | You need cards to spend it on, so Mana past +2 is worth half. Every Mana-making card that costs less than it makes must Consume (`plus()` never makes one free). Marsh Light: 0 cost, +1, Consume. Rift Surge: 1 cost, +2, Consume. |
| +1 Mana next turn | **4** | Tidecaller: 7 Barrier + 1 next turn. Side Slip: 0 cost, +1 next turn. |
| Next card costs 0 (Free Attack / Skill / Aura) | **~6** | Only as good as the card it lands on. Relentless Push: 12 + Free Attack (2 cost). |
| "Costs 1 less for the rest of the fight" | **+3** | Gale Strike 11. |
| "Costs N less for each X this turn" | price at the cost you will usually pay | Trampling Charge, Nerve Strike. |
| **Draw 1** as an extra (the card replaces itself) | **3** | Hilt Strike 9 + draw = 12; Oath of Iron 8 Barrier + draw. |
| Each further card drawn | **4** (halve past the 3rd extra card in a turn: no Mana left to play them) | Catch Breath (draw 2) = 7, Clear Spring (draw 3) = 11, Read the Embers (draw 6, 2 cost) ≈ 17. |
| Extra draw next turn | **3.5** each | Scheme, Stalker's Lunge. |
| Discard 1 (yours, as a cost) | **-2**, or **+2** with Sly / discard payoffs in the deck | Duck and Weave, Flick Knife. *(legacy: "in the Assassin's pool call it 0" held for his Sly engine, gone since #416; it is -2 for him now)* |
| Put a card on top of your draw pile | **+1.5** | Ram Home, Glint. |
| Foresee N (look at the top N, draw the one you choose, discard the rest) | a draw (**3** as an extra, **4** on its own) **+0.5 per card past the first** (at most +2) | Cold Read (0: Foresee 4) ≈ 5.5. |
| Reverb (your next Attack is played twice) | the next Attack's value, **~12** in an ordinary deck | Second Act. Check it against the best Attack in its build path (§8). |
| Return a random card from discard to hand | **+3** (a draw); a chosen card **+4** | |
| Add a random card to your hand | **+4** (Neutral), **~9** if it is from your pool and costs 0 (Consume) | Royal Decree, Borrowed Blade, Rift Windfall. |
| A Dagger | **4** (its damage) + Edge | *(legacy: the Assassin's Dagger tokens and Edge, gone since #416; his knives are embedded markers now, §15)* |
| **Arcana gained** | **2.5** each | Gather Arcana 2, Emberstrike 9 + 1, Pale Ward 8 Barrier + 1. |
| **Arcana spent** (a ◆ cost) | each ◆ buys **~6** points on top of the Mana budget | Molten Ruin 1+4◆ = 10 + 24 = 34 → 35 damage. Glass Burst 0+3◆ = 6 + 18 = 24 → 13 + 2 Faltering + 2 Exposed. Gaining is cheap and spending is rich: the gap is what the class pays for needing both halves. |
| Sharpen N | **0.8** per point if played early, ~0.5 late | The Blade costs 2 and comes back a few times a fight. Forged in Fury 7 + Sharpen 7, Whetstone 8 + Mana next turn, Bladewall 12 Barrier + 10. |
| Plant a totem | Hawk **4**, Bear **4**, Elder **5**, Splinter **6**, Owl **7** (+2 each per Spirit) | It pulses until pushed, then bursts. Spark Lash 7 + Hawk, Rime Strike 6 + Bear, Splinter Ward 5 Barrier + Splinter. |
| Spirit (Focus) | this turn: **1 per totem** in the row (~3); for the fight: **~2.5 per totem** | Spirit Strike 9 + 1 Spirit this turn, Elemental Focus. |
| Precision (the Old Twelve Gauge's Sharpen, DECISIONS #400) | **2.5** a point | The Gun costs 1, hits every enemy, Holds and comes round 2-3 times a fight (the Obsidian Blade's Sharpen is 0.8: 2 Mana, one target, fewer shots). |
| A Buckshot Shell (0, 4 to ALL, Consume) | **5.2** | A Dagger that hits every enemy. |
| Hangover N (lose N HP next turn, never the last) | **-1.5** a stack | HP, at the usual rate; its payoffs are priced on ~3 stacks already there. |
| Enter Fury (double attack damage, take 50% more) | **4**, plus the Barbarian's trait per stance entered | Kindle Fury (2, basic: 9 and Fury). Worth the attacks after it this turn; staying in Fury through the enemy turn costs ~6 HP. |
| Enter Serene (leaving it gives 2 Mana, once a turn) | **4**, plus the trait | Still Guard / Vigilance. Leaving Serene on a card: about **+3.5**. Since DECISIONS #413 the 2 Mana is the Monk's trait (Inner Fire), not an engine rule; his cards keep these prices, so the trait table counts the same Mana again (about 7.5 a Serene exit) and the two must not be added up. |
| Fervor | **2** a stack | 10 is a Radiant turn (~35-40), but it can't be timed. |
| Enter Radiant now | **~31** | Rise Radiant (2, rare, Consume). |
| Primed N | **1 per stack per hit** of the next attack | Feint 8 Barrier + 2 Primed, Heat of the Forge 7. Much better before a multi-hit attack. |
| Might, rest of fight | **5** per stack | Steel Resolve: 2 for 1 Mana. Also lifts companions' strikes if the class shares Might with them. Attacks only: Aura, totem and Trap damage is flat (DECISIONS #376), so an Aura's damage never scales with Might, Exposed or Faltering. |

---

## 6. Card keywords and costs you pay

| Modifier | Effect on the budget | Notes |
|---|---|---|
| **Consume** on a card you'd play every reshuffle | **+25%** | Immovable Oath 30 Barrier for 2 (rare + Consume). Required on Mana, card-making and heal cards that would loop. In a class with Consume payoffs (Knight) it is upside, so don't also give it the +25%. On a 0-cost card that makes Mana, Consume is the price of the card, not a bonus: compare it with **Draw Blood** (lose 3 HP, +2 Mana, Consume: a common) and **Rift Surge** (1 Mana for +2, Consume) instead of adding up points. |
| **Fleeting** | **+15%** on a card you would always play when drawn; more on one you'd rather keep | Desecrate 13 (Fleeting) vs ~11. Necromancer payoffs make it upside for him. |
| **Hold** | **+1**, **+2-3** on a big or conditional card you want to time | Steady Guard 8 + Hold vs Stone Skin 9. |
| **Opening hand** | **+3-4** | With Consume on a 0-cost card it may carry a 1-cost card's budget: Knife in the Back 11, Crystal Ward 10 Barrier, Killing Stroke 10 + 1 Exposed. |
| **Sly** | price the free play on discard at **7-10**; the printed cost is there to stop you casting it | *(legacy: the archived Assassin's Slip the Blow, Quick Reflexes, Cool Head; no live Assassin card has Sly since #416)* Sly on a card that is fine to cast anyway ≈ +1. |
| Lose N HP (yours) | **-1.5** per HP (it carries through the run) | Reckless Smite 15 for 2 HP. In a Blood build the payoffs (Scar Over, Blood Fire, Spiteful Jab) make it upside; price the card for the deck that doesn't have them. |
| A junk card into your deck (Wound, Haze, Muck...) | **-2** into the draw or discard pile, **-3** into your hand | Mudslide 4 x3 + Muck, Ironbark 13 Barrier + 2 Wounds. Shaman Status payoffs flip it. |
| A copy of itself into the discard pile | **+2** | Hot Temper, Needling Blow. On a 0-cost card it is a combo risk (§8). |
| "If X: bonus" | the bonus x **how often X is true**: ~60-70% in a deck built for it, ~30% otherwise | Break Guard 8 + 8 if Exposed; Cold Stare 8 + 8 if you consumed this turn. |
| "Only playable if X" (a hard gate) | up to **2-3x** budget | Ashen Reckoning 17 AoE at 0 (3 consumed), Final Bow 60 AoE (draw pile empty). |
| "If this is fatal" | ~**+2** on a normal hit, more on a big finisher | Skybreaker, Final Shatter. |

---

## 7. Auras (played once, last the fight)

Add up what the Aura does over **4 of your turns** (it is usually played turn 1-3 and the fight lasts 5-6). Then:

- an uncommon Aura's 4-turn total should be about **1.5x** the budget of its cost,
- a rare's about **2x**.

The extra is because the turn you play it you did nothing else, and you might draw it on turn 5. Examples: Bottomless Sleeves (1 cost,
a Knife a turn: 16 over 4 turns, 1.6x), Inner Furnace (2 cost, +1 Mana a turn: ~28, 1.5x, a little low for a rare), Warm Anvil (Sharpen 5 a turn: 16, 1.6x).
For "whenever X" triggers, count how often X happens per turn in the deck that wants it, not in a starter deck.

**+1 Mana every turn** is ~28 over the four turns (7 a Mana): a 2-cost Aura with no price (Inner Furnace, Ascendant Form, Deep Pockets, Attunement, Last Call with 2 Hangover). At 1 it needs a real price, ~-10 (Blood Pact: 7 HP). A Skill that does it and Consumes is an Aura in disguise: make it an Aura (DECISIONS #410).

---

## 8. Checks the points can't do

1. **The loop test.** Can a 0-cost card make Mana, draw itself back, or make a copy of itself? Then it must Consume, cost Mana,
   or be capped. Every broken deck in the 2026-10-25 audit (BALANCE.md) was a free card that replaced itself or made Mana, a doubler
   played again and again, or a payoff on a number that only grows.
2. **The multiplier test.** Two multipliers on one card (Exposed and Reverb, Primed and multi-hit, Strangled and a free-card engine)
   multiply each other. Price the card in the deck that has the other half.
3. **The best-case test.** For "+N per X" and "plus all it has grown", work out the number at the end of a good fight. If it beats a
   rare's budget by turn 4 in an ordinary deck of its build path, lower the per-X.
4. **The tier test.** Flat numbers (Sapped, Thorns, Bleed, Fate, Barrier) shrink against Tier X enemies; percentages grow. A card on
   budget at Tier I may be weak or strong at Tier X.
5. **The upgrade check.** Price the "+" version too (§12).

---

## 9. How to price a card (worked examples)

1. Add the points of every effect.
2. Compare with the budget for its cost and rarity.
3. Within **±15%**: fine. Over: lower a number or add a cost. Under: it needs a reason (a build-path payoff, an engine piece).
4. Run the checks in §8.

**Baseline cards, to show the rule fits them**

| Card | Points | Budget | |
|---|---|---|---|
| Dirty Hit (1, common): 8 + 1 Faltering | 8 + 3 = 11 | 10 | ✓ |
| Oath of Iron (1, common): 8 Barrier, draw 1 | 9.6 + 3 = 12.6 | 10 | +26% (a known strong common) |
| Barbed Stab (1, common): 6 + 3 Bleed | 6 + 6 x 0.65 = 9.9 | 10 | ✓ |
| Spark Lash (1, common): 7 + plant Hawk | 7 + 4 = 11 | 10 | ✓ |
| Tolling Bell (1, common): 13 Fate, draw 1 | 9.1 + 3 = 12.1 | 10 | ✓ |
| Darting Strike (2, uncommon): 10 Barrier, 10 damage | 12 + 10 = 22 | 21 | ✓ |
| Ember Ward (2, uncommon): 12 Barrier, 4 Thorns | 14.4 + 6 = 20.4 | 21 | ✓ |
| Glass Burst (0+3◆, uncommon): 13 + 2 Faltering + 2 Exposed | 13 + 6 + 6 = 25 | (6 + 18) x 1.12 = 27 | ✓ |
| The Final Hour (2, uncommon): 21 Fate to all, 1 Faltering to all | 19 + 4.5 = 23.5 | 21 | ✓ |

**Other classes, to show how to use it**

| Card | Points | Budget | Reading |
|---|---|---|---|
| Hunter: Bone Crack (1, common): 7 + 2 Exposed | 7 + 6 = 13 | 10 | +30%. 7 + 1 Exposed, or 5 + 2 Exposed. |
| Hunter: Rend (1, basic): 9, lose 2 HP, 1 Might | 9 - 3 + 6 = 12 | 7-9 (basic) | A hot basic: now 6 damage (9), DECISIONS #377. |
| Hunter: Twin Fang (1, common): 5 x2, lose 2 HP | 10 - 3 = 7 | 10 | Under unless the HP pays off; fine only as a Bloodrage card. |
| Barbarian: Crushing Palm (1, common): 8 + 1 Exposed | 8 + 3 = 11 | 10 | ✓ |
| Barbarian: Spinning Heel (2, uncommon): 12 + 2 Exposed, draw 1 | 12 + 6 + 3 = 21 | 21 | ✓ |
| Hunter: Pounding Heart (0, common): +1 Mana, lose 2 HP, Consume | 7 - 3 = 4 (+25% Consume) | 6 | Slightly under; fine. |

**Baseline cards the rule flags** (left alone: they are the reference copies, DECISIONS #367-371; noted so nobody copies the outlier
into another class)

- **Entomb** (4 cost, 52 damage): 52 against a 41 uncommon budget, +27%.
- **Rot Strike** (1, common: 8 + Fate equal to the damage): 13.6, +36%.
- **Tidecaller** (1, common: 7 Barrier, +1 Mana next turn): 12.4, +24%.
- **Heart of Flame** (0, rare: +4 Mana, Consume): ~21 with the diminishing Mana rate, against ~10 for a 0-cost rare with Consume.
- Fixed 2026-10-28 (DECISIONS #375), after reading weak because part of the original was lost in the copy: **Army of the Drowned**
  now raises two Thralls (Raise 6 twice, ~20 points against ~26), **Fated Hand** chooses its 2 cards from the draw pile, and **Marked for
  Death** gives an extra card reward when it kills.

---

## 10. Companions (summons)

No baseline class summons a companion that acts on its own (the Necromancer's Thralls never act; DECISIONS #370), so this rate is
built from pieces the baselines already price: a companion is **sticky Barrier** (Raise, §3) plus **a body** plus **its hits**.

**Companion value = 1.2 x HP + 3 + its hit x expected acts**

- **1.2 x HP:** single attacks aimed at your side hit a companion first, and what kills it carries on to you (overflow 100%), so each
  HP is a point of Barrier that lasts until it is struck. The same rate as Raise. It does nothing against attacks that hit everyone.
- **+3 for the body:** every "per ally" card, Might shared with the pack, "all your allies act now" and "whenever an ally dies"
  get one more to work with. The same +3 a new Thrall gets.
- **Expected acts = 1 + 1 per 12 HP** (at most 3). It acts at the end of the turn it arrives, then a Tier I enemy (~12 a hit) takes
  about 12 HP off it each enemy turn while it stands in front. A Pup or a Hound acts about once; a 16-HP body twice.
- A companion that grows (Pack Alpha's Might each act) counts the growth in its later acts.

| Companion | Points | Reads as |
|---|---|---|
| Bone Thrall, Raise 5 (no hit) | 6 + 3 = 9 | Raise Thrall: a basic at ~90% |
| Pup (6 HP, hits 3) | 7.2 + 3 + 3 = 13.2 | a 1-cost common at +32% |
| Hound (8 HP, hits 4) | 9.6 + 3 + 4 = 16.6 | a 1.5-cost card on its own |
| Pack Alpha, before #377 (16 HP, hits 10) | 19.2 + 3 + 20 = 42 | far past a 2-cost rare (~24-30) |
| Pack Alpha, since #377 (12 HP, hits 6) | 14.4 + 3 + 12 = 29.4 | a 2-cost rare |
| Dire Wolf, before #377 (24 HP, hits 14) | 28.8 + 3 + 42 = 74 | twice a 3-cost rare (35); now 18 HP, hits 9: 43 |

**Pack effects**

| Modifier | Points | Notes |
|---|---|---|
| All your allies act now | each companion's hit, added up (**~8** with the usual 1-2 companions) | Worth much more with a full pack: price the card at 1-2 companions. |
| Your companions gain N max HP | **1.2 x N per companion** (~1.5 companions) | Like Raise on a Thrall already standing. |
| Barrier to all friends | **1.2 x N for you + 0.6 x N per companion** | Only the companion in front is struck, so the others' Barrier is often wasted. |
| Each of your allies gains N Barrier | **0.6 x N per companion** | |
| Your companions each deal N | §2 (0.7-1.0 x a normal attack per companion) | |
| Sacrifice an ally | minus what it had left: **1.2 x its HP + 3** | Devour Ally, Fen Offering. |
| "Whenever an ally dies" | per death, x **~2 deaths a fight** in a deck that summons | |
| Might, for a class whose companions share it | **6** a stack (5, plus half of it on the pack's hits) | the Hunter's Pack Instinct. |
| Might to all friends (the companions take it themselves) | **5 + 2 per companion** (~8) | the Engineer's Tune-Up, Overdrive, Reactor. |
| Might on one companion | **2.5** a stack; a companion that strikes twice gets twice that | Retrofit, Reinforce. Price it on the machine it is meant for (§8, the multiplier test). |
| Primed on your companions | **1 a stack per companion** (~1.5); per hit on a machine that strikes twice | Jumpstart, Overdrive. |
| "You and your companions gain N Primed" | **2.5** a stack | the hero's Primed goes into the next Attack card, on every hit (Ping, Full Salvo). |
| Barrier on one companion | **1.0** a point | it is struck only while that companion stands in front (Hardened Chassis, Bulwark Frame). |

**Frames (DECISIONS #383).** A hero has 3 companion slots. A **Light** companion takes 1, a **Heavy** 2 and a **Colossal** all 3.
Take **2 points off for each slot past the first** (Heavy -2, Colossal -4): the slots it fills are Light bodies and per-ally payoffs
the deck can't have. The Engineer's Salvage (scrapped companions hand their Might, Primed and half their HP to the machine built in
their place) is not priced into the summon card; it is the reason to play Light machines before a big one.

| Companion | Points | Reads as |
|---|---|---|
| Enforcer Mk.II (Heavy, 11 HP, hits 6) | 13.2 + 3 + 6 - 2 = 20.2 | a 2-cost common |
| Siege Engine (Heavy, 12 HP, hits 3 twice) | 14.4 + 3 + (6 - 1) x 2 - 2 = 25.4 | a 2-cost rare |
| War Engine (Colossal, 20 HP, hits 4 twice) | 24 + 3 + (8 - 1) x 2 - 4 = 37 | a 3-cost rare |
| Dreadnought (Colossal, 18 HP, 5 to ALL) | 21.6 + 3 + 6.5 x 2 - 4 = 33.6 | a 3-cost rare |

---

## 11. Traps

No baseline class has Traps (the five copies have none), so this rate is the Trap's effect, priced as any card's, times how likely
and how soon it springs. A Trap returns to the discard pile after springing, like any played card, and at most 3 can be set.

**Trap value = its effect x the spring factor**

| Trigger | Spring factor | Why |
|---|---|---|
| When the enemy turn begins (`foeTurn`) | **0.9** | Always springs, one enemy turn later. Barrier gained then protects you that turn. |
| When you or an ally is attacked (`attacked`) | **0.85** | Springs on the next attack; a turn of buffs or defending makes it wait. It springs before the hit lands, so Faltering, Sapped or Stun on the attacker shrink that very hit. |
| When you lose 5+ HP at once (`hpLost`) | **0.7** (3+ HP: **0.75**) | Needs a hit that gets through your Barrier. |
| When an enemy gains Barrier (`foeDefends`) | **0.6** | Depends on the enemy. |
| When the enemy summons (`foeSummons`) | **0.4** | Most fights never set it off; it needs a big payoff to be worth a card. |

| Trap | Points | Budget | |
|---|---|---|---|
| Gnarltooth Trap (Hunter, 1, uncommon): 6 to the attacker, gain 1 Might | (6 + 6) x 0.85 = 10.2 | 11.2 | ✓ |
| Gut Trap (Hunter, 1, uncommon): 8 to ALL, heal 4 (5+ HP lost) | (10.4 + 6) x 0.7 = 11.5 | 11.2 | ✓ |
| Hidden Pitfall (Neutral, 1, common): 7 to the attacker | 7 x 0.85 = 6 | 10 | weak |
| Alarm Bell (Neutral, 1, common): 6 + 2 Faltering + 4 Barrier on a summon | 16.8 x 0.4 = 6.7 | 10 | weak (a rare trigger) |

---

## 12. Upgrades

From the base and "+" versions of every card of the five baseline classes (most of theirs are hand-written in their game):

**An upgrade is worth about +30% of the card's points**, at least 3: about **+3** on a 0- or 1-cost card, **+5-6** on a 2-cost card,
**+8-10** on a 3-cost card. Up to +50% is fine; past that, the upgrade is too big.

| The baselines' upgrades | Gain | Examples |
|---|---|---|
| One number +3 (damage or Barrier) | +30% on a 1-cost card | Stone Skin 9 → 12, Twin Cut 5x2 → 6x2, Dawn Smite 5+5 → 8+8 |
| A bigger card's main number | +20-35% | Stalker's Lunge 15 → 20, Molten Ruin 35 → 45, Harvest 27 → 33, Hammer Fall 32 → 35 |
| A status +1 (+2 from 5 stacks up) | +30-50% | Steel Resolve 2 → 3 Might, Open Vein 5 → 7 Bleed, Rattle 3 → 4 Exposed |
| X cards: X is 1 higher | about one more Mana's worth (+30% at X = 3) | Whirling Blade, Run Through, Unmaking |
| An Aura: its main number +30-50% | +30-50% | Rampage of Ire 6 → 9, Daily Rite 2 → 3 Fervor, Pack Bond 4 → 6 Barrier |
| An Aura: Opening hand, when +1 would double it | +3-4 | Shell Game, Battle Rhythm, Legion, Bottomless Sleeves |
| An Aura: a smaller drawback | +1.5 per HP | Ancient Fury 3 → 2 HP a turn, Berserk Tempo 2 → 1 |
| An Aura: 1 less Mana, only when the effect is on/off or an engine | +33-60% | Unbroken Wall, Unholy Pact, Command Chip, Ascendant Form |
| A cheap card loses Consume, or gains Hold | ~+25% / +1-3 | Owl Call, Circle of Spirits, Elemental Focus lose Consume; Stone Fury gains Hold |
| Paying less HP | +1.5 per HP | Draw Blood 3 → 2 HP, Reckless Smite 2 → 1 HP |

**Auras (DECISIONS #396):** Slay the Spire upgrades a Power by raising its number (about two in three), giving it Innate (about one in
six) or costing 1 less (about one in six, only when the effect is on/off: Barricade, Corruption, Dark Embrace). `plus()` never looks
inside an Aura's `power` op, so an Aura with no hand-written `up` falls back to the cost cut. Give every new Aura an `up`; a cost cut
has to be listed in `auraUpgrades.test.ts`.

**What to watch:** `plus()` (`packages/content/src/v2/build.ts`) raises *every* number on a card that has no hand-written upgrade, so
a card with three numbers gains three times as much. Hilt Strike+ (+3 damage and +1 card: +7, +58%) and Clarion Clap+ (+3 to all and
+1 Exposed to all: +8.4, +87%) are the baselines' own examples. When the automatic upgrade of a new card is past +50%, give it a
hand-written `up` that raises one number (the one that makes the card what it is). A 1 → 0 cost cut on a card that is not an Aura is
a +60% jump: only on cards with nothing else to grow, and never on a card that makes Mana or cards (`plus()` already refuses those).

---

## 13. Keeping this file true

When a baseline card's numbers change, or a new keyword or status is added, add its rate here with one reference card. If a rate
stops fitting most of the cards that use it, change the rate, not the cards.

---

## 14. Legacy rates (the archived baseline pools)

The five baseline classes this guide was built from were rebuilt on 2026-10-29 (docs/BASE_CLASS_REWORKS.md, DECISIONS #415-#420). Their
old pools are frozen in `reviews/balance-baselines/2026-10-29-pre-identity-reworks/`, with the guide as it was. The general rates
(damage, Barrier, draw, Mana, Exposed, Faltering, Bleed, Fate, Plating, Might, Primed, Thorns, Consume...) still hold for every class.
The rates that only described a rebuilt class's old engine are **legacy**: use them to read the archive, never to price the new
resources. They are marked *(legacy)* in the tables above as each class is rebuilt; the new rates are in §15.

## 15. Class identity rework rates (2026-10-29)

These are hypotheses made by hand for the rebuilt classes, from how often a thing happens in a four-to-six-turn fight. A cap or a
condition is priced at how often it is really met, never as a free multiplier. Gross output and the cost of building a resource are
priced separately: a producer card is priced for what it makes, a consumer for what it does with it, and the package is checked as a
whole (each class's ledger in `docs/reworks/`).

### The Knight: Guard, Riposte, Thorns (DECISIONS #415)

An **Opening** is put on an enemy when her Barrier stops one of its attack hits completely (at least 1 damage; not a Shielded,
Ghostly, cancelled or overflow hit). One per enemy; it goes at the end of her next turn.

| Thing | Rate | Why |
|---|---|---|
| A **Riposte** bonus (+N damage, or "Riposte: ...") | **0.55 x** its value | An Opening is there on about half her turns in an ordinary Knight deck (the starter blocks a whole hit on about half the enemy turns that attack), two in three in a deck built for Guard. Only one Riposte a turn finds it on a single enemy, so a second Riposte card the same turn is priced at its base. Reference: Return the Blow (1: 7, Riposte +5) = 9.75. |
| A card that **leaves an enemy Open** | **4** | It makes one Riposte certain this turn: a typical bonus of ~6, times ~0.7 that you hold a Riposte card to spend it. 3 in a Thorns deck (fewer Ripostes). Draw Them In (1: 4 Barrier, open the target) = 8.8. |
| "**Whenever you earn an Opening**" (an Aura or the trait) | **2.6** answers over four turns | 0.65 a turn in a Guard deck; only Guard earns one, a card that opens an enemy does not, so these never feed each other. Bastion Engine (8 to the opened enemy) = 20.8. |
| "**Whenever you spend an Opening**" | **2.2** answers over four turns | about one Riposte that lands every other turn. Exploit the Gap = 14.5. |
| "**Whenever your Thorns strike**" (once a turn) | **2.8** answers over four turns | a Thorns deck has Thorns up on about 70% of enemy turns. Thornwake = 15.1. |
| Thorns you have on your own turn (for "+N per Thorns") | **~2.5** stacks in a Thorns deck | Thorns are temporary and only there after a Thorns card that turn. Briar Lash (5 + 2 per Thorns) = 10. |
| "If an enemy means to attack" | **x0.7** | most Tier I intents are attacks. |

The trait, **Hold and Answer** (6 Barrier at the start, Guard, and 3 Barrier the first time each turn an Opening is earned), prices at
7.2 + 2.5 earned Openings x 3.6 = ~16, plus what Guard lets her Riposte cards do (about +5 in the starter, through Sundering Blow): ~21,
level with the middle of the roster. It no longer starts with Plating.

### The Assassin: Preparation and embedded knives (DECISIONS #416)

Two resources priced so a package is never counted twice: the **producer** is paid for what it stores, the **consumer** for what it
does with it *minus* what it uses up.

| Thing | Rate | Why |
|---|---|---|
| A **knife embedded** (`embed`) | **2** | its producer's share. A knife pays nothing while it sits there; about 70% are pulled before their enemy dies or the fight ends, for a typical pull payoff of 4-6 (card) + 3 (Knife Work). Quiet Incision (1: 6 + a knife) = 8. |
| A **pull** (`pull`) | the payoff a knife **minus 2**, times the knives there usually are | 1.5 on one target for "up to 2", 2 for "every" or "up to 3", 0.8 for "a knife". The 2 is the knife's stored value, moved from producer to consumer. Draw Steel (1: 4 + 4 a knife, up to 2) = 4 + 2 x1.5 = 7. |
| **Preparation** gained | **1.5** a point | its producer's share: a finisher turns a point into ~4-6 damage, but only on the turn you choose, and the cap of 3 wastes some. Patient Footwork (1: 5 Barrier, 1 Preparation) = 7.5. |
| **Preparation** spent | the payoff a point **minus 1.5**, at the Preparation there usually is | ~2 for "up to 3" or "all", 1.5 for "up to 2". Finishing Thrust (2: 8 + 4 a point) = 8 + 2.5 x2 = 13. |
| "Whenever you embed / pull a knife" | per knife: ~1.2 pulls and ~1.5 embeds a turn in a knife deck | "the first time each turn": 0.8-0.85 a turn. |
| "Whenever you spend Preparation" (once a turn) | **2.4** answers over four turns | a finisher about every other turn, more in an Execution deck. |

The trait, **Knife Work** (1 Preparation and a knife in every enemy at the start; 1 Preparation the first time each turn you embed;
3 damage to an enemy for every knife pulled from it): ~14 in the starter (one embed and one pull card in 11), ~24 in a knife deck.
