# Card costing: what every number on a card is worth

Local simulation-led revision: [2026-11-05 ledger](BALANCE_REVISION_2026-11-05.md). Includes shared once-per-turn Reserve pricing, diminishing soul triggers, invested companion HP converted into hero protection, and reduced recurring finale defenses. Simulation results supplement these hand budgets; they do not replace card-level reasoning or establish human A-tier parity.

Current local shared pass: [0.195.0 ledger](SHARED_BALANCE_2026-11-04.md), including proportional Soul Tithe, six resource-card comparisons, diminishing triggers, recovery and uncertainty. [Versioned strength charts](balance-history/README.md) preserve estimates separately from future measured data.

How to price a card, worked out from the five baseline classes (Knight, Assassin, Spellblade, Necromancer, Shaman: the
Ironclad, Silent, Regent, Necrobinder and Defect shapes, DECISIONS #364-371). Their numbers are the reference because they come from a
game that has been balanced for years; this file turns them into exchange rates we can use on the other five classes and on new
cards. Written 2026-10-28 from the card list at 0.106.0 (`docs/10_CARD_LIST.md`).

These are rules of thumb, not a formula the game enforces. A card that scores on budget can still be broken in a combo, and a card
that scores low can be the best card in its deck. Use the score to find the cards worth a closer look, then check them in play
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
| 2 | **19** | Obsidian Flurry (18 at 8 Spell Power), Glass Veil (11 + 5 next turn), Stalker's Lunge (15 + Defer a card) |
| 3 | **28** | Harvest (27, Hold), Skybreaker (26, +1 Mana on a kill), Hammer Fall (32, uncommon) |
| 4 | **37** | |

Past 1 Mana each Mana buys about **9 points**. A 0-cost card is worth more than its zero suggests: it still spends a card from your
hand, and that card slot is worth about 5-6 points on its own. That is also why a card that costs 1 more is never just "+9": the bigger
card saves you a card.

### Neutral and Ancestral cards

A Neutral card is never better than the class card it resembles: equal at most, or a little behind. An Ancestral card may compete with the class versions (DECISIONS #500). Compare upgrades too.

### Rarity

| Rarity | Budget |
|---|---|
| Basic (Strike, Defend) | 60% (Strike 6 of 10, Defend 5 Barrier = 6 of 10). They are meant to be the cards you want to remove. |
| Basic (class signature) | 70-90% (Sundering Blow 74%, Cinderfall 83% (0 Mana since #558), Raise Thrall ~90%) |
| Common | 100% |
| Uncommon | ~112% |
| Rare | ~125%, or an effect that is not on this scale at all (an Aura that changes how you play, an engine piece) |

**Grade targets (Robert, 2026-11-08).** A card's grade is its points as a share of its budget for its cost and rarity, as in the tables
above (Auras: the four-turn total in §7): **S** over 160%, **A** 125-160%, **B** 90-124%, **C** 70-89%, **D**
under 70%. **Every Rare should be in A.** **Most Uncommons should be in B**, unless we decide that one should be A (say why when
proposing it). S, C and D are things to fix.

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
| Damage to ALL enemies | **1.3** per point | AoE numbers sit at ~75-80% of single-target: Breach (9 AoE, lose 1 HP), Cartwheel Cut (7 AoE, Premeditate), Scatter Ashes (8 AoE, Hold), Ember Toss (6 AoE + draw 1). In a one-enemy fight it is plain damage, so don't push AoE past 1.4. |
| Damage to a random enemy | **0.9** per point | Can't focus a kill (Cleaving Throws 3 x3 = 9). |
| Several hits | same total as one hit | Twin Cut 5 x2 = 10. But every hit gets Might, Primed, Edge and Thorns: in a class with Might sources, take **~1 point off per extra hit**; in a class with none, multi-hit is free flavour. |
| "Your companions each deal N" | **0.7-1.0 x** a normal attack's number per Thrall | Price it at one companion; the second and third are the build's payoff. 0-cost Commands sit at 100% (Knucklebone 6), 1+ cost at ~70% (Bone Snap 7, Bone Crush 12). |
| X cost | **~7 points per X** at uncommon (70-80% of the 9-per-Mana slope) | X cards never waste Mana and grow with every Mana effect. Run Through 8/X, Whirling Blade 5 AoE/X. X cards are the one exception to "never scale hits": Mana is their limit (DECISIONS #509). The upgrade is always X+1 (`plus()`). |
| Damage that grows ("every copy gains N") | first play at ~90% of budget, then **N x 1.2** for the growth | A card comes round every 2-3 turns, so expect 1-2 more plays (Mounting Fury 9 + 5, Gathering Storm 3 + 2 at 0 cost). |
| "+N per X" scaling | **more damage on each hit, never more hits** (DECISIONS #507, #509: Might and Primed add to every hit, so hits that scale multiply them; a fixed few hits are fine, and the rate counts on all of them). Price at the X you expect **mid-fight**, not the best case | Mastered Strike: 6 + 2 per Strike, about 16-19 in a starter-based deck. Price the median; then check the ceiling with the combo test in §8. Usual X: **3-4 cards in hand** (more in a Hold deck), **1-2 Mana left** in a Patience deck (0-1 otherwise), **1.5 Traps set** in a Trap deck (3 at most). |

---

## 3. Defence

| Modifier | Points | Notes |
|---|---|---|
| Barrier, now | **1.2** per point | 9 Barrier = 10 damage. Defend 5 = Strike 6. Stone Skin 9, Dawn Smite 5 + 5 Barrier = 11. |
| Barrier next turn (Guarded, "next turn gain N") | **1.0** per point | Can't be aimed at a known intent. Roll Away 4 + 4 Guarded, Glass Veil 11 + 5. |
| Plating N (gain N Barrier at the end of your turn, then N falls by 1) | a fresh stack: **N(N+1)/2 x 0.9**; added to a stack, **~0.9 x N x the turns it has left** | Bleed's shape: 2 Plating is 3 Barrier fresh (2.7), and about 6 on a stack that is already running, so 2 is worth about 4.5 in a deck that keeps playing it. Barrier at the end of your turn cannot be aimed at a known intent as closely as a card's, but it comes every turn. Stoneskin (5) gives 15 Barrier for 1 Mana, a little over budget for an Aura that changes how she plays; Stoneskin+ is 6 (21). A deck holds 2 copies (DECISIONS #513). |
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
| Bleed added to an existing stack | **~0.65 x N x the turns that stack has left** | Stacking is where Bleed gets strong; the payoffs (Hemorrhage, Bloodburst, Reopen the Wound) are priced on a stack already being there. |
| **Burn**, a fresh stack of N | **55% of the total it will tick**: N(N+1)/2 x 0.55; added to a stack, **~0.55 x N x the turns it has left** | Bleed's shape, a step cheaper: Barrier still standing at the start of the unit's turn soaks the ticks (it still loses 1), so it does less against whatever holds Barrier (DECISIONS #501). Wildfire 8 Burn = 19.8. A payoff that reads the stack should spend some of it: Flashpoint halves it. |
| **Fate** | **0.7** per stack (**0.9** to ALL) | Nothing until it reaches the enemy's HP, then everything. Tolling Bell 13 Fate + draw 1, Creeping End 5 Barrier + 7 to all. Weakest against bosses (it has to climb to their HP), strongest as a finisher on regular fights. |
| Strangled N (loses N per card you play) | **N x the cards you will still play this turn** (~3) | No card applies it now (Garrote, 8 + 2 Strangled ≈ 14, left the pool: DECISIONS #474). |
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
| Extra draw next turn | **3.5** each | Scheme. |
| **Reserves** (Knight, 2026-10-30) | **3.5** each gained, **1.5** a point of *Max Reserves for this turn*, **4** a point of Max Reserves for the fight | Mana kept instead of lost, spent after the turn's Mana. Capped at the Max Reserves (3), so the 4th and later are wasted. Blood Oath: 3 HP (-4.5) for 3 Reserves (10.5) = 6 on a 0-cost card. A card that *reads* them is priced at the ~1.5 Reserves a deck holds mid-fight: Vow Kept 3 + 5 each = 10.5, Vow Fulfilled 18 + 7 each = 28.5 (39 at full). Reserves do not expire, so "if you have any Reserves" is rarely true early and can stay true once a deck holds some: Set Your Shield is 6 Barrier (7.2, a basic at 72%) early and 9 (10.8, 108%) once it is on. Over budget at its best on purpose (DECISIONS #470). |
| **Defer a card** (Assassin, 2026-10-30) | **3.5** each | A card of your hand that costs 1+ (never a 0-cost or X card) waits a turn and comes back costing 1 less until it is played: about +1 Mana next turn (4) less ~12% for the wait, and it needs a card to take. It is set aside, not discarded, so discard payoffs do not hear of it. Stalker's Lunge 15 + Defer = 18.5, Palm Switch 7 Barrier + Defer = 11.9, Side Slip = 3.5. *Up to N* (Into the Shadows) is priced at 3.5 x the cards you will usually have to give (~3 of 3), a little less. |
| Discard 1 (yours, as a cost) | **-2**, or **+2** with Premeditate / discard payoffs in the deck | Duck and Weave, Flick Knife. *(legacy: "in the Assassin's pool call it 0" held for his Sly engine, gone since #416; it is -2 for him now)* |
| Put a card on top of your draw pile | **+1.5** | Ram Home, Glint. |
| Foresee N (look at the top N, draw the one you choose, discard the rest) | a draw (**3** as an extra, **4** on its own) **+0.5 per card past the first** (at most +2) | Cold Read (0: Foresee 4) ≈ 5.5. |
| Reverb (your next Attack is played twice) | the next Attack's value, **~12** in an ordinary deck | Second Act. Check it against the best Attack in its deck (§8). |
| Return a random card from discard to hand | **+3** (a draw); a chosen card **+4** | |
| Add a random card to your hand | **+4** (Neutral), **~9** if it is from your pool and costs 0 (Consume) | Royal Decree, Borrowed Blade, Rift Windfall. |
| A Dagger | **4** (its damage) + Edge | *(legacy: the Assassin's Dagger tokens and Edge, gone since #416; his knives are embedded markers now, §15)* |
| **Arcana gained** *(legacy: the archived Spellblade; no live class makes Arcana since #417)* | **2.5** each | Gather Arcana 2, Emberstrike 9 + 1, Pale Ward 8 Barrier + 1. |
| **Arcana spent** (a ◆ cost) *(legacy, as above)* | each ◆ buys **~6** points on top of the Mana budget | Molten Ruin 1+4◆ = 10 + 24 = 34 → 35 damage. Glass Burst 0+3◆ = 6 + 18 = 24 → 13 + 2 Faltering + 2 Exposed. Gaining is cheap and spending is rich: the gap is what the class pays for needing both halves. |
| Sharpen N *(legacy for the Spellblade since #417; still the rate of the Drunkard's Precision)* | **0.8** per point if played early, ~0.5 late | The Blade costs 2 and comes back a few times a fight. Forged in Fury 7 + Sharpen 7, Whetstone 8 + Mana next turn, Bladewall 12 Barrier + 10. |
| Plant a totem *(legacy: the archived Shaman's orb queue; his totems since #418 and #420 are priced in §15)* | Hawk **4**, Bear **4**, Elder **5**, Splinter **6**, Owl **7** (+2 each per Spirit) | It pulses until pushed, then bursts. Spark Lash 7 + Hawk, Rime Strike 6 + Bear, Splinter Ward 5 Barrier + Splinter. |
| Spirit (Focus) | this turn: **1 per totem** in the row (~3); for the fight: **~2.5 per totem** | Spirit Strike 9 + 1 Spirit this turn, Elemental Focus. |
| Precision (the Old Twelve Gauge's Sharpen, DECISIONS #400) | **2.5** a point | The Gun costs 1, hits every enemy, Holds and comes round 2-3 times a fight (the Obsidian Blade's Sharpen is 0.8: 2 Mana, one target, fewer shots). |
| A Buckshot Shell (0, 4 to ALL, Consume) | **5.2** | A Dagger that hits every enemy. |
| Hangover N (lose N% of Max HP next turn, rounded up, never the last) | **-1.5** a stack | HP, at the usual rate: 1 HP a stack on his 88 HP, so a share of Max HP keeps the same price in the Arena (DECISIONS #502). Its payoffs are priced on ~3 stacks already there. |
| Enter Fury (double attack damage, take 50% more) *(legacy: the archived Monk; his Martial Forms since #419 are in §15)* | **4**, plus the Barbarian's trait per stance entered | Kindle Fury (2, basic: 9 and Fury). Worth the attacks after it this turn; staying in Fury through the enemy turn costs ~6 HP. |
| Enter Serene (leaving it gives 2 Mana, once a turn) *(legacy, as above)* | **4**, plus the trait | Still Guard / Vigilance. Leaving Serene on a card: about **+3.5**. Since DECISIONS #413 the 2 Mana is the Monk's trait (Inner Fire), not an engine rule; his cards keep these prices, so the trait table counts the same Mana again (about 7.5 a Serene exit) and the two must not be added up. |
| Fervor *(legacy, as above)* | **2** a stack | 10 is a Radiant turn (~35-40), but it can't be timed. |
| Enter Radiant now *(legacy, as above)* | **~31** | Rise Radiant (2, rare, Consume). |
| Primed N | **1 per stack per hit** of the next attack | Feint 8 Barrier + 2 Primed, Heat of the Forge 7. Much better before a multi-hit attack. A hero's or companion's Primed loses half (rounded up) as its turn ends (DECISIONS #533): Primed that waits a turn is worth half, and none of it can be banked for a big turn. |
| Might, rest of fight | **5** per stack | Steel Resolve: 2 for 1 Mana. Also lifts companions' strikes if the class shares Might with them. Attacks only: Aura, totem and Trap damage is flat (DECISIONS #376), so an Aura's damage never scales with Might, Exposed or Faltering. |

---

## 6. Card keywords and costs you pay

| Modifier | Effect on the budget | Notes |
|---|---|---|
| **Consume** on a card you'd play every reshuffle | **+25%** | Immovable Oath 30 Barrier for 2 (rare + Consume). Required on Mana, card-making and heal cards that would loop. In a class with Consume payoffs (Knight) it is upside, so don't also give it the +25%. On a 0-cost card that makes Mana, Consume is the price of the card, not a bonus: compare it with **Draw Blood** (lose 3 HP, +2 Mana, Consume: a common) and **Rift Surge** (1 Mana for +2, Consume) instead of adding up points. |
| **Fleeting** | **+15%** on a card you would always play when drawn; more on one you'd rather keep | Desecrate 13 (Fleeting) vs ~11. Necromancer payoffs make it upside for him. |
| **Hold** | **+1**, **+2-3** on a big or conditional card you want to time | Steady Guard 8 + Hold vs Stone Skin 9. |
| **Opening hand** | **+3-4** | With Consume on a 0-cost card it may carry a 1-cost card's budget: Knife in the Back 11, Crystal Ward 10 Barrier, Killing Stroke 10 + 1 Exposed. |
| **Premeditate** (was Sly, DECISIONS #433) | a discard by a card is worth **the card again next turn at 0, on top of the hand**: about its own value less ~15% for the wait (it is not played now), so price the card as if its printed cost were ~1 lower when the deck discards on purpose | The printed cost is paid only when it is drawn and played normally. Slip the Blow (2: 6 Barrier) discarded by Duck and Weave is 6 Barrier next turn for 0. *(Sly, before #433: the free play now was priced at 7-10.)* |
| Lose N HP (yours) | **-1.5** per HP (it carries through the run) | Reckless Smite 15 for 2 HP. In a Blood build the payoffs (Scar Over, Blood Fire, Spiteful Jab) make it upside; price the card for the deck that doesn't have them. |
| A junk card into your deck (Wound, Haze, Muck...) | **-2** into the draw or discard pile, **-3** into your hand | Mudslide 4 x3 + Muck, Ironbark 13 Barrier + 2 Wounds. Shaman Status payoffs flip it. |
| A copy of itself into the discard pile | **+2** | Hot Temper, Needling Blow. On a 0-cost card it is a combo risk (§8). |
| "If X: bonus" | the bonus x **how often X is true**: ~60-70% in a deck built for it, ~30% otherwise | Break Guard 8 + 8 if Exposed; Cold Stare 8 + 8 if you consumed this turn. |
| "Only playable if X" (a hard gate) | up to **2-3x** budget | Ashen Reckoning 17 AoE at 0 (3 consumed), Final Bow 60 AoE (draw pile empty). |
| "If this is fatal" | ~**+2** on a normal hit, more on a big finisher | Skybreaker, Final Shatter. |

---

## 7. Auras (played once, last the fight)

Single-use delayed buffs are priced for their one use, not four turns of repeated triggers. Backup Core (#593) is a Consume Skill costing 2 Mana (1 upgraded), granting one visible revival charge. It restores half a companion's base max HP plus the fresh body's future actions; invested max HP and Might are lost. Repeated plays can add finite charges through normal Skill/Consume/reclaim interactions, and normal Skill deck limits apply. It receives no recurring Aura budget multiplier.

Add up what the Aura does over **4 of your turns** (it is usually played turn 1-3 and the fight lasts 5-6). Then:

- an uncommon Aura's 4-turn total should be about **1.5x** the budget of its cost,
- a rare's about **2x**.

The extra is because the turn you play it you did nothing else, and you might draw it on turn 5. Examples: Bottomless Sleeves (1 cost,
a Knife a turn: 16 over 4 turns, 1.6x), Inner Furnace (2 cost, +1 Mana a turn: ~28, 1.5x, a little low for a rare), Warm Anvil (Sharpen 5 a turn: 16, 1.6x).
For "whenever X" triggers, count how often X happens per turn in the deck that wants it, not in a starter deck. A deck holds at most **2 copies of an Aura** (DECISIONS #498), so check the pair too: it doubles the effect, and a trigger that replaces itself at one copy makes a profit at two.

**+1 Mana every turn** is ~28 over the four turns (7 a Mana): a 2-cost Aura with no price (Inner Furnace, Ascendant Form, Deep Pockets, Last Call with 2 Hangover). Attunement, the Neutral one, costs 3 (DECISIONS #500). At 1 it needs a real price, ~-10 (Blood Pact: 7 HP). A Skill that does it and Consumes is an Aura in disguise: make it an Aura (DECISIONS #410).

---

## 8. Checks the points can't do

1. **The loop test.** Can a 0-cost card make Mana, draw itself back, or make a copy of itself? Then it must Consume, cost Mana,
   or be capped. Every broken deck in the 2026-10-25 audit (BALANCE.md) was a free card that replaced itself or made Mana, a doubler
   played again and again, or a payoff on a number that only grows.
2. **The multiplier test.** Two multipliers on one card (Exposed and Reverb, Primed and multi-hit, Strangled and a free-card engine)
   multiply each other. Price the card in the deck that has the other half.
3. **The best-case test.** For "+N per X" and "plus all it has grown", work out the number at the end of a good fight. If it beats a
   rare's budget by turn 4 in an ordinary deck of its class, lower the per-X.
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

When this rate was set no baseline class summoned a companion that acts on its own (the Necromancer's Thralls never acted, DECISIONS
#370; since #684 they strike, see the Necromancer note below), so this rate is
built from pieces the baselines already price: a companion is **sticky Barrier** (Raise, §3) plus **a body** plus **its hits**.

**The Necromancer since #684.** Raise Dead N is still 1.2 per HP (+3 for a new Thrall), but each new Thrall now also strikes for 2
(+1 per 4 max HP) at the end of each turn it stands (~2.5 points a turn while it lives, one or two turns for a small one). With no slot
free the HP goes to the healthiest companion, so it buys a bigger hit (+1 per 4 HP) as well as sticky Barrier. A death an enemy causes
bursts back for half the companion's max HP (the Bonelord, all of it): ~0.5 x max HP per enemy kill, ~2 kills a fight. The Grave
Colossus (18 HP, Taunt, 2 slots, 6 a hit at 18 HP, half of a Command) is ~40 points less ~5 for its second slot: a 3-Mana rare.

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
| Might to all friends (the companions take it themselves) | **5 + 2 per companion** (~8) | the Engineer's Tune-Up, Overdrive and Grand Assembly. Reactor now uses the continuous attack bonus below. |
| Might on one companion | **2.5** a stack; a companion that strikes twice gets twice that | Retrofit, Reinforce. Price it on the machine it is meant for (§8, the multiplier test). |
| Continuous attack damage (`attackAura`) | **1 point per added damage per qualifying hit**, over the Aura's four-turn window | Applies to present and future units. Reactor +3 on four friendly hits per turn is 48 over four turns, close to a 2-cost rare Aura's 47.5. Does not add Might, feed Might-counting effects, or transfer through Salvage. Copies add, and multi-hit/command/Golemancer ceilings must be checked. |
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
| Siege Engine (Heavy, 12 HP, hits 4 twice) | 14.4 + 3 + (8 - 1) x 2 - 2 = 29.4 | a 2-cost rare, a little over on purpose (DECISIONS #468) |
| War Engine (Colossal, 22 HP, hits 4 three times) | 26.4 + 3 + (12 - 2) x 2 - 4 = 45.4 | past a 3-cost rare (~35) on purpose: Might and Primed go on every hit, so a Colossal needs the hits a swarm has (DECISIONS #469) |
| Dreadnought (Colossal, 22 HP, 4 to ALL twice) | 26.4 + 3 + (10.4 - 1) x 2 - 4 = 44.2 | the same (DECISIONS #469) |
| Scrap Golem (Colossal, 12 HP, hits 3 twice) | 14.4 + 3 + (6 - 1) x 2 - 4 = 23.4 | a 2-cost uncommon (DECISIONS #469) |

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
**+8-10** on a 3-cost card.

**The target is +30% for every rarity (Robert, 2026-11-08).** Commons, Uncommons and Rares alike. A Rare's upgrade is already
bigger in points because its base is bigger, so it needs no separate rule. Going above or below 30% is allowed only as a stated
exception for a specific card (for example an Aura costing 1 less, Opening hand or losing Consume, which cannot land exactly on 30%):
say why when proposing it. Grades (§1) are read from the base card; an upgrade is judged by its gain.

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
whole (each class's ledger in `docs/reworks/`). Since DECISIONS #428 only the Shaman's rework is live; the other four are reverted.

### The Knight: Guard, Riposte, Thorns (DECISIONS #415)

> **Reverted (2026-10-29, DECISIONS #428):** the Knight is back to the cards from before the identity rework; no live card uses these rates. Kept for reference (the rework is archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`).

An **Opening** is put on an enemy when her Barrier stops one of its attack hits completely (at least 1 damage; not a Shielded,
Ghostly, cancelled or overflow hit). One per enemy; it goes at the end of her next turn.

| Thing | Rate | Why |
|---|---|---|
| A **Riposte** bonus (+N damage, or "Riposte: ...") | **0.55 x** its value (**~0.65** since Guard counts half a hit, #427: her cards were not repriced, a deliberate buff) | An Opening is there on about half her turns in an ordinary Knight deck (the starter blocks a whole hit on about half the enemy turns that attack), two in three in a deck built for Guard. Only one Riposte a turn finds it on a single enemy, so a second Riposte card the same turn is priced at its base. Reference: Return the Blow (1: 7, Riposte +5) = 9.75. |
| A card that **leaves an enemy Open** | **4** | It makes one Riposte certain this turn: a typical bonus of ~6, times ~0.7 that you hold a Riposte card to spend it. 3 in a Thorns deck (fewer Ripostes). Draw Them In (1: 4 Barrier, open the target) = 8.8. |
| "**Whenever you earn an Opening**" (an Aura or the trait) | **2.6** answers over four turns | 0.65 a turn in a Guard deck; only Guard earns one, a card that opens an enemy does not, so these never feed each other. Bastion Engine (8 to the opened enemy) = 20.8. |
| "**Whenever you spend an Opening**" | **2.2** answers over four turns | about one Riposte that lands every other turn. Exploit the Gap = 14.5. |
| "**Whenever your Thorns strike**" (once a turn) | **2.8** answers over four turns | a Thorns deck has Thorns up on about 70% of enemy turns. Thornwake = 15.1. |
| Thorns you have on your own turn (for "+N per Thorns") | **~2.5** stacks in a Thorns deck | Thorns are temporary and only there after a Thorns card that turn. Briar Lash (5 + 2 per Thorns) = 10. |
| "If an enemy means to attack" | **x0.7** | most Tier I intents are attacks. No Knight card reads it since #423 (it is 0 against an Arena hero). |
| "If the target is Open" / "if an enemy is Open" (read, **not spent**) | **0.55 x** its value | the same chance as a Riposte bonus, but it keeps the Opening for the Riposte after it (#423). Testing Cut (7, 4 Barrier if Open) = 9.6. |
| **Fork N** (N different random enemies, +25% when only one stands, #427) | a Fork 2 **~1.7x** its number, a Fork 3 **~2.0x** | 40% of fights have one enemy (+25%), the rest about 2.4. Forked Lightning (5) = 8.5. |
| "+N per Open enemy" | **~0.8** Open enemies | in a deck that makes Openings, several enemies. Ring of Steel = 8.9. |
| A Riposte bonus on **every enemy** | the bonus x **~0.7** Open enemies | each spends its own. Answer Them All (10 to all, +8 each Open) = 18.6. |
| A temporary Thorns **shed** for +N damage | **N - 1.5** a stack (~3 stacks shed in a Thorns deck) | what the stack would have dealt kept is lost. Shed the Spines (6, +3 each, up to 4) = 10.5. |
| Remove the target's Barrier | **~3** | most enemies hold little; far more against a defender or an Arena Knight. Sunder Armour = 11. |
| A trigger on a hit that takes HP from an Open enemy | **~1.5** a turn in a Duelist deck | a Riposte spends first and does not count; a hit its Barrier soaks completely does not either. Measured Tempo (2 Barrier) = 14.4. |
| "At the end of your turn, if an enemy is Open" | **~0.65** of turns in a Duelist deck | she keeps it on purpose; with Warlord's Oath nearly always. Knight's Composure (6 Barrier) = 18.7. |
| "At the end of your turn, if you have 8+ Barrier" | **~0.65** of turns in a Guard deck | Prepared Ground (a Mana and a card next turn) = 18.2. |

The trait, **Hold and Answer** (6 Barrier at the start, Guard, and 3 Barrier the first time each turn an Opening is earned), prices at
7.2 + 2.5 earned Openings x 3.6 = ~16, plus what Guard lets her Riposte cards do (about +5 in the starter, through Sundering Blow): ~21,
level with the middle of the roster. It no longer starts with Plating.

### The Assassin: Preparation and embedded knives (DECISIONS #416)

> **Reverted (2026-10-29, DECISIONS #428):** the Assassin is back to the cards from before the identity rework; no live card uses these rates. Kept for reference (the rework is archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`).

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
| "Spend up to 1 Preparation" | the payoff **minus 1.5**, **x0.9** | a point is nearly always there in a deck that makes it (#424). Measured Cut (7, +5) = 10.15. |
| Preparation **held** ("+N per Preparation", read, not spent) | **~1.8** points | an Execution deck sits on 1-3; it competes with spending. Poised Strike (12 + 4 each) = 19.2. |
| Knives **read** in a target (+N, Sapped, Faltering per knife; extra hits) | **~2** in one target, **~3** over all enemies, ~1.2 in each | a knife deck keeps them in; reading never removes them (#424). Thousand Cuts (7, once more a knife) = 21. |
| "If the target has a knife in it" | **x0.75** | Knife Work plants one at the start and a knife deck refills. |
| "At the start of your turn, with 3 Preparation" | **~0.4** of turns | it turns off when a finisher spends; The Waiting Blade = 21.8. |
| "At the end of a turn you played no Attack" | **~0.4** of turns | the setup turns of a Shadow deck; Lie in Wait = 13.9. |

The trait, **Knife Work** (1 Preparation and a knife in every enemy at the start; 1 Preparation the first time each turn you embed;
3 damage to an enemy for every knife pulled from it): ~14 in the starter (one embed and one pull card in 11), ~24 in a knife deck.

### The Spellblade: Spell Power and Fracture (DECISIONS #480)

Every card's price is in `docs/reworks/SPELLBLADE_SPELL_POWER_MERGED.md`. These replace the Arcana and Sharpen rates for her (§5 keeps them for the Drunkard's Precision).

| Thing | Rate | Why |
|---|---|---|
| **SP gained** | **3** a point; next turn **2.55** | A point can power Swords and then a spell. |
| **Grows N** | **N x 3.6** | The growth rate (N x 1.2) on 3 a point. |
| **A Sword reading SP** | priced at **8 SP** | The mid-fight number for a deck that holds it. A Sword never adds hits: more damage per step of SP, at most 2 a point across all its hits; the bigger ones strike a fixed 2-4 times (DECISIONS #507, #509). |
| **Keen N** | **N x 3.5** a turn | About two Swords a turn, at 1-4 hits each (Whispering Edge: Keen 2). |
| **X or X/2** | budget adds **4.5** per SP spent, at **4 spent for 1 Mana, 6 for 2, 10 for 3** | Below 6 for a fixed cost: it scales with what you hold, and no point is wasted. X/2 cards are priced at half of about 8 held (DECISIONS #482). |
| **Fracture** | **2.5** a point, **3.3** to ALL (3.1 / 4.1 before #713) | It only adds up, and the k-th Shatter deals 15 + 5k (20, 25, 30..., DECISIONS #713; was 10 + 10k) + the Spell Power held: 35.5 per 10 over the first four at the priced 8 (43 before #713), so Fracture is about **2.5** a point (3.3 to ALL) from #713, and the cards priced at 3.1 are about 19% lower, less the delay and Barrier (DECISIONS #486, #487, #523). Damage by total Fracture on one enemy, before Spell Power: 20 at 10, 45 at 20, 75 at 30, 150 at 50, 425 at 100 (650 before #713). From 50 Fracture on, each Shatter also cracks another enemy for 10 (about 3 a Shatter against a group, nothing alone). Over a six-turn fight, 11 Mana of it deals about 22 a Mana at 8 Spell Power, between a deck with 2 Mounting Furies (19) and one with 3 (24). Applied at about **7 a Mana** on a common since DECISIONS #564 (5 from #499; Faultline Hex 1: 7, Final Shatter 2: 8 and 12 Barrier on a Shatter, Rupture Script 2: 10 with Consume). That stays over budget at this rate on purpose: Fracture does nothing until it crosses a 10. |
| **Shatter damage +N** | **4** a point | About four Shatters left in a Fracture deck. |
| **Might** | **10** a stack in a Sword deck, 5 otherwise | About 3.5 hits a turn for 3 turns, as her Swords no longer add hits (DECISIONS #509). Worth less on a turn the Obsidian Blade swings, one hit without Blade Echo (DECISIONS #488); not repriced. |
| **Primed** | **4** a stack | Saved for the biggest swing, about 4 hits. |
| **Obsidian Blade** | **5 + 2 per SP**, 21 at 8 SP | Against a budget of 19 for 2 Mana, with Hold and Opening hand on top (DECISIONS #488). Might and Primed add once a swing, so they buy little here without Blade Echo. |
| **Blade Echo** | **+1 Blade hit** a copy | 21 more per swing at 8 SP (DECISIONS #488). Copies stack: 42, 63, 84. |
| **Barrier +1 per 3 SP** | **+3.2** | 2.67 Barrier at the priced 8 SP, x1.2 (DECISIONS #486). +1 per 2 (Unbreakable Crown) is +4.8. |
| **Barrier +1 per 3 SP spent this turn** | **+1.6** | About 4 spent by then, on the cards that need her empty or spending. |

### The Spellblade: Imbue and Discharge (DECISIONS #417)

> **Reverted (2026-10-29, DECISIONS #428):** the Spellblade is back to the cards from before the identity rework; no live card uses these rates. Kept for reference (the rework is archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`).

Two positions on the Obsidian Blade; a spell Imbues a charge, a blade attack Discharges it. The **producer** (the Imbue) is paid for the
charge; the **consumer** (the Discharge) only for the choice and timing it adds, so a package is never counted twice.

| Thing | Rate | Why |
|---|---|---|
| A charge, when discharged | **Ember 3, Glass 2.6, Ward 3.6** | Ember is 3 damage on one hit; Glass 2 to every enemy (x1.3); Ward 3 Barrier (x1.2). Flat, once. |
| **Imbue** a charge | **0.85 x** its value: **Ember 2.5, Glass 2.2, Ward 3** | about one charge in seven is lost: the fight ends, a full blade forces a replacement, or no Discharge is drawn in time. The trait's first Ward is ~3. Ember Inscription (1: 5 spell damage, Imbue Ember) = 7.5. |
| **Discharge one** | **+1** on the card's own effects | the choice of which charge, and the timing; the charge itself is the Imbue's. Obsidian Cut (1: Discharge, 6) = 7. |
| **Discharge both** | **+1.5** | as above, for a pair. Crownfall (2: both, 17) = 18.5. |
| "per enchantment discharged" (after a both-discharge) | **~1.6** charges | a Burst deck fills both positions before a full discharge most of the time, not every time. |
| "per enchantment on your blade" (not spent) | **~1.3** | the blade is rarely empty in her decks (the trait's Ward, cheap Imbues) and rarely full and unspent. "Wards on your blade" after an Imbue Ward: ~1.5. |
| "If your blade has no enchantments" | **~40%** | right after a spend. |
| "Whenever you Discharge" | **~1 a turn** in a deck that wants it | most of her attacks discharge. |
| "Whenever you Discharge two different enchantments at once" | **~45%** of turns in a Burst deck | needs a mixed blade and a both-discharge in hand. |
| Twin Edge (the next first charge twice) | **~2.4** | one charge (~3) on about four Twin Edges in five. |
| A mixed pair on a both-discharge | **~55%** (**~70%** in a deck built for it) | (#425) Split the Light, Fault Line, Prism Break. |
| A matching pair on a both-discharge | **~55%** in a matching deck | "they take effect again" is worth the pair: ~6.4 (Ember 6, Glass 5.2, Ward 7.2). Resonant Pair = 11. |
| Discharge **one kind** only ("Discharge a Glass") | **+1**, and its "If it did" bonus **x0.6** | the kind is there about 60% of the time; the other charge stays. |
| Recast | **1.5** | a card spent to fix a charge. |
| A full blade at the start of a turn | **~55%** in a holding deck | Stored Light = 20.7. |
| A Ward held at the end of a turn | **~75%** in a Ward deck | Sentinel Glass (4 to all) = 15.6. |

The trait, **Glass and Ember** (a Ward on the blade at the start; the first Imbue each turn draws 1 and gives 2 Barrier), prices at ~3
+ 4 turns x ~50% (one Imbue card in the starter's 10) x 5.4 = ~14 in the starter, ~22 in an Imbue deck (an Imbue most turns), level
with the Assassin's Knife Work. Positions cap the blade at 2 charges, worth at most 7.2; nothing grows for good.

### The Shaman: the totem cycle (DECISIONS #430; his earlier versions, #418, #420-#422, are in the DECISIONS log)

His totems stand in a row in planting order. Each works every turn while it stands (its passive); a command makes the front one act
and consumes it; a plant into a full row pushes the front one out, and it acts. Spirit (never lost) adds 1 to every totem number but
the Elder Tree's, the Moon Owl's and the Hawk's own Spirit.

| Thing | Rate | Why |
|---|---|---|
| **1 Spirit** | **~10** | +1 to every totem number: with three standing, ~1.4 a totem a turn plus ~1 on its act, ~4 a turn, over the ~3 turns left when it is gained mid-fight. The commanded Hawk is his main source (1 each, flat). |
| A totem's **act** (at 0 Spirit) | Hawk 1 Spirit **10**; Bear 6 Barrier **7.2**; Thunderbird 8 to ALL **10.4**; Elder Tree 2 Mana **14**; Moon Owl a doubled elemental spell **~9** | each scaled act is ~2 more at the ~2 Spirit of mid-fight. |
| A **command** (it acts and is consumed) | **~8** | its act (~10.7) less the passive it no longer gives until the row is refilled. "Twice, then consumed": a second act. "Every totem": each, less every passive lost. |
| A **plant** | **~8** (a random kind 7.5) | into a full row, its push-out acts; into a free position, its passive works for the turns left. A free plant Consumes. |
| Passives, a turn | Hawk 2 Primed **~2.1** (only when not Primed); Bear 2 Barrier **2.4**; Thunderbird a Fork 2 of 3 **~5.1**; Elder Tree 1 Mana **7**; Moon Owl 1 off the first elemental spell **~5.4** | a rare totem's card prices its passive for ~2.5 turns and its act at x0.6 (it may be pushed out or commanded early). |
| A **position** | **~3** | one more totem working later. |
| "Whenever one of your totems acts" | **~1.3** a turn | a command or a push-out most turns; each copy of an Aura answers on its own. |
| Primed on a multi-hit spell | the Primed on every hit | Storm multi-hits are kept to 2 hits or a Fork of 4; the Hawk Primes only when he is not Primed. |

### The Monk: Martial Forms and Mastery (DECISIONS #419)

> **Reverted (2026-10-29, DECISIONS #428):** the Monk is back to the cards from before the identity rework; no live card uses these rates. Kept for reference (the rework is archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`).

One form at a time; a form names two techniques that complete his objective this turn (Root: two different Defensive; Current: a
Defensive then a Striking; Ember: two different Striking at one enemy). Only tagged cards played from hand count; it completes at
most once a turn, for 1 Mastery (at most 3, kept) and the trait's 3 Barrier. No form multiplies damage, makes Mana or hurts him.

| Thing | Rate | Why |
|---|---|---|
| A completion (the trait's) | **~60% of turns** with the starter, **~80%** in a technique deck | the starter (10 cards: 2 Defensive, 2 Striking techniques, all different) holds a Defensive and a Striking one in about 58% of 5-card hands; a drafted deck has about half its cards tagged. |
| **Mastery** spent (a spender's bonus) | **0.8 x** its payoff a point, at **~1.5** for "up to 2", **~0.9** for "up to 1" | Mastery comes from the trait, not from cards, so the spender is paid for what it turns it into (as the Knight's Riposte is), less the other spenders it competes with and the cap of 3. Mountain Breaker (2: 16 + 3 a point) = 19.6. |
| Mastery a card gives | **2.5** | about one later point of a spender (+3 damage or +2.4 Barrier), with the delay. Rare on purpose: Wreath of Flame (only after a completion), Coiled Serpent. |
| A technique tag | **0** | the completion it enables is the trait's; a card is priced for what it does. |
| A form change | **1** (a chosen one **1.5**) | it moves the objective to the hand he holds, and starts the turn's progress again. |
| "If this is your first technique" / "if you played a Defensive technique this turn" | **x0.65** | one of the two steps is usually played first. |
| "If you completed your technique this turn" / "in <form>" | **x0.5** | |
| "Whenever you complete your technique" | **~0.75 a turn** | once a turn at most. |
| A Defensive or Striking technique played | **~1.2 a turn** each in a technique deck | River Turns, Breath Between Blows. |
| "+N per Mastery you have" (read, not spent) | **~1.5** Mastery | he holds 1-2 most turns; it never competes with a spender. Centred Strike (7 +2) = 10 (#426). |
| "If you did not complete your technique this turn" | **~0.4** of turns | the recovery cards: Unfinished Form, Adapting Flow. |
| "If your technique is one step from done" | **x0.5** | Ember's Edge. |
| Primed on the Monk's attacks | **~1.3 hits** | Thousand Palms (4 hits since #533; it was 7) is the ceiling: Coiled Stance's 3 adds 12 there. |

The trait, **Martial Forms** (start in Current; a completion gives 1 Mastery and 3 Barrier), prices at ~0.6 x (Kindle Strike's 4 a
Mastery 3 + 3.6 Barrier) x 4 turns = ~16 with the starter, ~21 in a technique deck, level with the Knight. Nothing loops: no card
makes Mana now, no completion gives a card or Mana on its own (Perfected Motion's card is one a turn), Mastery is capped at 3 and
spent at most 2 a card.

---

## 16. Boons and Warden's Hearts (2026-10-31)

A Boon pays every fight of the run, so price it **per fight** (5 of your turns), not against a card's budget. Turn-long rates x 5.
Compare Boons with each other. A Boon's points are not a card's points: there is no Mana or card slot to pay for it.

**Boons have no rarity, so every Boon sits at 7-15 points a fight** (DECISIONS #497). A new one above that needs a real drawback, and then it is a Warden's Heart, not a Boon. Hearts run about 15-25: they are one at a time, and each costs something.

| Effect | Points a fight | Notes |
|---|---|---|
| +1 Mana every turn | **35-45** | 7-9 a turn. Rift Core had this at no price and was taken out (DECISIONS #496). |
| Draw 1 more every turn | **~20** | 4 a turn. More in a deck of cheap cards. |
| Lasting Thorns, per stack | **~7.5** | Thorns never fade: 1 per enemy hit, ~1.5 hits a turn. More against several enemies or multi-hit moves. |
| Might at the start, per stack | **~10** | 1 per hit, ~2 hits a turn; more with multi-hit cards. Higher than the card rate of 5, because it covers every turn. |
| Barrier every turn, per point | **6** | 1.2 x 5. |
| Heal N HP every turn | **7.5 x N** | 1.5 x 5, and it grows in long fights. |
| Heal N HP after a fight | **1.5 x N** | |
| Lose N HP every turn | **-7.5 x N** | A heal after the fight can pay it back in full. |
| Exposed on you for 2 turns | **~-27** at Tier I | 50% more on ~1.5 hits of 12, two turns running: 18 HP at 1.5. Barrier and Shielded lessen it. It grows with the tier. |
| Burn on a random enemy each turn, N | **~6 x N** on one enemy | The stack climbs (3, 5, 7, 9, 11 over 5 turns at 3), at Burn's 0.55. Less against a crowd, as it spreads; more in a long Warden fight (8 turns: about 44). Ember Heart. |
| Plating at the start, N | **N(N+1)/2 x 0.9** | x 0.75 under Brittle. Warded Heart's 7 is 25, 19 under its own Brittle. Bastion Engine answers every tick, unpriced: watch it. |
| Fight-start effects | their usual rates | Iron Sigil 7, Rift Satchel 7, Aegis of Ages 12, Hex Lantern 9, Hunter's Lens ~7 (one turn, more in a big-hitting deck). |
| Max HP | **1.5 per HP, once** | The Gilded Crown: 6 Max HP (9 once) and 3 HP a fight (4.5). |
| Shards after a fight | no rate yet | Shard Purse's 6 is about 36 an act, against about 160 from an act's fights. |


## 17. Approved campaign balance pass (2026-11-03, DECISIONS #574)

The full before/after numbers and hand calculations are in [BALANCE_PROPOSAL_2026-11-03.md](BALANCE_PROPOSAL_2026-11-03.md). This pass supports free combinations; it adds no card groups or reward weighting. These are prototypes backed by scenario tests, not measured campaign win rates.

- A 2-Mana uncommon Aura's four-turn reference remains `19 x 1.12 x 1.5 = 31.92` points; a rare's is `19 x 1.25 x 2 = 47.5`.
- **Play-trigger timing:** Weapon Bench and Drunken Master resolve after the triggering Attack. One Weapon Bench with two two-hit Attacks per turn adds 2, 6, 10 and 14 damage over four full turns (32 total), before multipliers and setup cost. One two-hit Attack per turn adds only 12 in total. Two copies must be assessed together.
- **Engineer companion Might:** Jumpstart's 1 lasting Might uses the existing rate of 2.5 points per single-hit companion, multiplied for multi-hit machines. At 1.5 single-hit companions, it is 3.75 plus 4.8 for Barrier (8.55); at three it is 12.3, a deliberate full-board payoff above a 1-Mana common's 10. Companions must remain alive; a replacement does not inherit a dead machine's buffs automatically.
- **Growing weapons:** Ion Lance is 18 plus growth 4: `18 + 4 x 1.2 = 22.8`, about 7% above the 21.28-point uncommon reference. Its upgrade starts at 22 and retains growth 4. Gallows replaces doubling with growth 6 (8 upgraded); compare to Mounting Fury and check several copies, not just one cycling.
- **Fixed multi-hit weapons:** Rotary Cannon is 16 raw damage for 2 Mana, 24 at 2 Might. Primed 5 adds 20 more, not 5. Its upgrade is four hits of 5; no resource adds hits. Combine with Exposed, two Weapon Benches and Artillerist when checking the ceiling.
- **Conditional lasting growth:** Measured Conviction gives four Might plus eight Barrier over four qualifying turns: approximately 29.6 points. Drunken Master gives four Might plus twelve Barrier: approximately 34.4, about 8% above the uncommon Aura reference. Its Might fires once per own turn, not once per Stagger or hit. Morning After requires actual Hangover HP loss and gives nothing at the 1-HP floor or for unrelated self-damage.
- **Invested defenses:** Bulwark Frame is unchanged at 20 ally max HP (12 Barrier; 15 upgraded), but reaches 20/23 at 60 max HP. That late-fight budget excess is deliberate and requires paid companion investment; it does not increase Heavy Hitter's multiplier.
- **Stack-based engines:** Swarm Tactics gains one damage per four successful non-starting summons. Gleeful Trapsmith gains one per four actual springs. These read counters shared by the side, not a separate counter for each Aura. Evaluate two copies and resource costs; failed summons and merely setting Traps add no progress.
- **Fervor:** Foretold Flame reads one-third of actual positive Fervor gains through the fight, including trait gains, retaining progress after Radiant spends stacks. The Monk's new permanent Might reward is once per own turn across every stance together and never from initial Serene setup. Check four-hit Radiant, not a single-hit normal attack.
- **Burn payoff:** Heart of the Pyre costs 2 and reads the randomly selected enemy's Burn. At 4 Burn and two Flame cards each turn, four full turns give 48 damage, close to the 47.5 rare Aura reference. At 20 Burn, its base trigger is 10. It keeps the Burn; Flashpoint still spends half.
- **Command growth:** Spirit Pact grants one Spirit and 3 Barrier after the first explicit command on the owner's turn. Passive effects, planting push-outs and empty commands do not qualify. Spirit improves every applicable totem number, including Fork targets, so three totems, extra positions and two Aura copies need separate ceiling checks.
- **Souls:** Restless Spirits excludes the triggering consumed soul from its count: six base plays give 27 damage (previously 36), thirty give 255 (previously 180). Requiem now replaces its card; its upgraded multiplier is reduced to 2 to pay for draw and extra base damage. The draw/Consume shell must be checked as a complete deck.

These late-fight effects deliberately exceed front-loaded card budgets after setup. A point estimate does not establish an A grade or excuse a same-turn infinite, an unattended survival lock, or a multiplier that invalidates other builds. Recheck upgrades, two Auras, realistic defense spending, missing preferred rares, and recovery from losing a machine. Echo encounter tuning remains separate; run balance simulations only on Robert's request.

## Ascendancy development budgets (2026-11-04, decision #580)

See [the Ascendancy pass](ASCENDANCY_PASS_2026-11-04.md) for exact values and turn-four/eight hand examples. Price the marginal Ascendancy contribution separately from its base class and cards. Resource/health expenditure, maintaining a row, delayed recovery and giving up a small attack are real opportunity costs. Percentage multipliers scale with a developed deck; growth limited once per own turn cannot be priced as an unlimited per-card trigger. Prepared and wounded-target bonuses add rather than multiply. Never count existing Exposed, Fury or Clutch twice. Large-machine HP multiplies attack output with a 100% ceiling and never adds hits. Enemy health percentage and player health percentage mechanics must be compared at Arena HP as well as campaign HP. A-tier is an acceptance goal, not a result of these point estimates. Card-pool balance remains a separate pass.

### Soulreaper harvest (0.182.0, decision #581)

Consume now grants 3 Barrier, with one Reap after end-turn cleanup/actions if consumption occurred that turn: 4 + 2 per genuine consumption this fight, non-attack damage against the lowest-current-HP enemy. At three consumes per turn, Reap is 10/28/52 on turns 1/4/8, plus 9 Barrier each turn. Four turns total 76 damage and 36 Barrier versus the prior 48 Barrier; this requires twelve actual consumptions and sustained generation. Retained base Grave Chill supplies Fate too, but an execution threshold is not immediate damage and cannot simply be added to this budget. Aura removal, playing a Fleeting card normally and discards are not consumption. See the Ascendancy pass for exact timing, protections and playtest limits.

## 18. Warden Hearts revision, 2026-11-05 (local0.206)

Section16 Heart examples are historical pre-revision prices. Current effects and hand calculations: WARDEN_HEARTS_2026-11-05.md. Flat15–25-point five-turn comparisons do not establish parity for percentage card output, proportional HP loss, economic opportunity or Resurgent threshold overkill prevention. Assess actual card output/rounding, Attack-only Faltering, three-turn openings, prolonged fights and early-versus-late reward acquisition. No simulations or measured parity.

### 2026-11-05: Recall commitment and Barrier comparison (local0.209)

Recall the Blades base/upgraded costs3Mana (was2), consumes itself (was discard), and replays all eligible consumed Daggers (was at most15). A3Mana common benchmark is28points, or about35at rare; this is an immediate-output reference, not a damage ceiling for a finisher funded by earlier knife generators and setup. Compare total generation/setup investment, marginal cast cost, repeat access, defensive triggers and the opponent’s pressure window. Consume does not prohibit other copies or suitable recovery. Shadow Echo’s15actualBarrier/copy/turn cap is unchanged; two upgraded Patient Walls at3Reserves yield30for4setupMana versus Echo’s2setupMana, while holding5Reserves yields50. Narrower-trigger Auras can exceed30. Do not establish a universal Barrier allowance from these examples. Exact before/after, evidence and static comparison: [review](RECALL_AND_BARRIER_REVIEW_2026-11-05.md). No simulations or measured PvP regrades.
