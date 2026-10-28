# Barbarian review: balance by the card costing guide (proposal, 2026-10-28)

**Status: applied 2026-10-28 (DECISIONS #390)** as proposed: Inner Fire gives Fervor only, Still Guard is 3 Barrier at 1 Mana, and every change in §3-§4. Robert also asked to re-theme her as a monk (being confirmed; not done yet). Robert: "i feel like its already pretty good, maybe too
strong right now. i want you to run it through the card cost analysis, and propose some changes. and let me know if there are any
other mechanics you would want to add."

Every number is from `docs/14_CARD_COSTING.md`: a card's points against the budget for its cost and rarity, fine within ±15%.
**Budgets:** 0 Mana 6, 1 Mana 10, 2 Mana 19, 3 Mana 28 for a common; uncommon x1.12, rare x1.25; basics 70-90% of a common; Consume
x1.25. An Aura's 4-turn total: about 1.5x its cost's common budget for an uncommon, 2x for a rare.

## 0. The short answer

She is too strong, and most of it is one thing: **her trait pays on every stance change, on top of cards built on the Watcher's shape
that already pay for stance changes.**

- **Inner Fire** gives 1 Fervor and 2 Barrier every time she enters a stance. That's about 4.4 points per stance entered.
  - A starter deck changes stance about once a turn: ~4.4 points a turn, like the other traits.
  - A Flow deck changes stance 2-3 times a turn: ~11 points a turn, every turn. That's about three times any other class's trait,
    and it stacks with Flow Auras that also pay per stance (Unmoved Mind, Wheel of Motion, Perfect Balance).
- **Still Guard**, her basic, is the Watcher's 2-cost Vigilance at 1 Mana: 7 Barrier and Serene. That's 160% of a basic's budget.
  Leaving Serene gives 2 Mana, so it nets Mana on turn 1.
- **The per-stance Auras** run at 2-3x their budget in a Flow deck.
- **A few 0-cost cards are far over**, for example Bowing Low: 2 Fervor and 6 Barrier for 0 Mana is 187% of budget.

The proposal: trim the trait first, then bring the outliers back. Most attacks and the Radiant path are fine or slightly weak.

## 1. New rates (stances), added to the guide

The baselines have no stances, so these come from the Watcher cards her pool was built on (Eruption, Vigilance, Prostrate).

| Effect | Points | Why |
|---|---|---|
| **Enter Fury** (attacks deal double, you take 50% more) | **4**, plus the trait | Kindle Fury (2, basic: 9 and Fury) at 70-90% of a 2-cost common gives 4-8. Fury doubles the attacks after it this turn, but staying in it through the enemy turn costs about 6 HP. |
| **Enter Serene** (leaving it gives 2 Mana, once a turn) | **4**, plus the trait | The 2 Mana arrive only once you leave it. Still Guard / Vigilance at 2 Mana fits this. |
| **Leave your stance** | **0**; leaving Serene is about **+3.5** (the 2 Mana half the time) | |
| **Fervor** (10 of it is Radiant: triple damage for the turn and 1 Mana) | **2** a stack | A Radiant turn is worth about 35-40, but Fervor can't be timed and takes turns to build. Prostrate (0: 2 Mantra, 4 Block) prices Mantra near 1, so 2 is generous. |
| **Enter Radiant now** | **~31** | Triple damage for the rest of the turn (~+24 on a normal turn) and 1 Mana. Rise Radiant (2, rare, Consume) fits. |
| **Inner Fire, today** | **+4.4 per stance entered** (2 Fervor points, 2.4 Barrier points) | |
| **Inner Fire, proposed** | **+2 per stance entered** | 1 Fervor only. |

So with the proposed trait, entering Fury or Serene on a card is worth **6**. A card that enters Fury then Serene is worth **8**: two
Fervor and the Serene, since Fury has no attack to double before it ends.

## 2. The trait

| | Now | Proposed |
|---|---|---|
| **Inner Fire** | Whenever you enter a stance, gain 1 Fervor and 2 Barrier. | **Whenever you enter a stance, gain 1 Fervor.** |

It still feeds all three build paths: Fury and Flow change stance, and every change is Fervor for Radiant. The Barrier stays on the
cards that are meant to give it (Unmoved Mind, Perfect Balance, Gentle Return), where it costs a card slot and Mana.

**Alternative, if you'd like to keep the Barrier:** "Whenever you enter a stance: gain 1 Fervor. The first time each turn, also gain 3
Barrier." This keeps the starter feeling the same and stops it scaling past one entry a turn.

## 3. Number changes

All prices assume the proposed trait (stance entry = 6).

### Starting cards

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Still Guard (1, basic) | 7 Barrier, enter Serene | **3 Barrier**, enter Serene | 14.4 → 9.6 (basic 7-9) |
| Kindle Fury (2, basic) | 9, enter Fury | as it is | 15 (basic 13-17) |

### Over budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Bowing Low (0, common) | 2 Fervor, 6 Barrier | 2 Fervor, **2 Barrier** | 11.2 → 6.4 / 6 |
| Red Mist (1, common) | 5 to ALL, Fury | **4 to ALL** | 12.5 → 11.2 |
| Centre Yourself (1, common) | draw 2, Serene | **draw 1** | 13 → 9.5 |
| Shifting Guard (1, common) | 5 Barrier, Fury, Serene | **2 Barrier** | 14 → 10.4 |
| Thread-Cutter (1, common) | 5, Fury, Serene | **3** | 13 → 11 |
| Watchful Calm (1, common) | 6 Barrier, Serene, Foresee 2 | **2 Barrier** | 16.7 → 11.9 |
| Settling Fist (1, common) | 8, 3 Barrier, leave stance | **7, no Barrier** | 15 → 10.5 |
| Temper Flare (1, uncommon) | 3 x3, Fury | **2 x3** | 15 → 12 |
| Wrathful Guard (1, uncommon) | 8 Barrier, Fury | **6 Barrier** | 15.6 → 13.2 |
| Hot-Blooded (1, uncommon) | 8 (+1 per 6% HP missing), Fury | **4** (+1 per 6%) | 17 → 13 |
| Cornered Beast (1, uncommon Trap) | 12, 4 Primed, Fury | **8** | 15.4 → 12.6 |
| Unafraid (1, uncommon) | 8, Serene | **6** | 14 → 12 |
| Exhale (0, uncommon, Consume) | leave stance, 1 Mana, draw 1 | **no draw** | 13.5 → 10.5 / 8.4 |
| Unmoved Mind (1, uncommon Aura) | each stance: 3 Barrier, 2 to a random enemy | **2 Mana, 2 Barrier** | 2.9x → 1.2x |
| Wheel of Motion (1, uncommon Aura) | each stance: 3 to ALL | **2 Mana** | 2x → 1.1x |
| Morning Prayer (1, uncommon Aura) | each turn: 1 Fervor, 3 Barrier | **2 Barrier** | 1.5x → 1.2x |
| Surge of Ire (1, rare Aura) | each Fury: 6 Barrier, draw 1 | **2 Mana, the first time each turn** | 3.2x → 1.1x |
| Eye of the Storm (2, rare Aura) | each turn: Fury, 6 to ALL, 6 Barrier | **4 to ALL, 4 Barrier** | 1.7x → 1.2x |
| Perfect Balance (2, rare Aura) | each stance: draw 1, 5 Barrier, 1 Fervor | **draw 1, 2 Barrier** | 2.6x → 1.2x |
| Gentle Return (1, rare Aura) | each Serene: heal 2, 3 Barrier | **heal 1** | 1.6x → 1.2x |
| Tide of Peace (X, rare) | 5 Barrier and a card per Mana, Serene | **4 Barrier per Mana, draw 2** | 37 → 28 at X=3 |
| Rage Unbound (0, rare, Consume) | Fury, 1 Mana | Fury, 1 Mana, **lose 3 HP** | 13 → 8.5 / 9.4 |
| Burning Litany (2, rare, Consume) | Fervor to ALL, enter Radiant | **3 Mana** | it was Rise Radiant (same cost) plus damage |
| Gather Breath (1, uncommon) | +2 Mana next turn, draw 1 | +2 Mana next turn, **draw 2, Consume** | makes more Mana than it costs (the guide's rule, as Measured Breath) |

### Under budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Rending Hands (1, uncommon) | 5 x2, lose 2 HP | **6 x2, lose 1** | 7 → 10.5 |
| Blood on the Sand (1, uncommon Aura) | each Fury: lose 2 HP, 2 Primed | lose 2 HP, **3 Primed** | ~0.3x → 1x |
| Final Account (2, rare) | 10 (+8 in Fury) | **14 (+10 in Fury)** | 15 → 20 |
| Rage of Ages (3, rare) | 5 x3 to ALL | **8 x3 to ALL** | 19.5 → 31 |
| Ashes of Restraint (2, rare) | 6 (+2 per consumed), Fury | **9** | 18 → 21 |
| The Offering (2, uncommon) | 5 Fervor, Hold | **1 Mana** | 12 against 21 → against 11 |
| Hymn of Embers (2, uncommon) | 4 Fervor, 6 Barrier | **5 Fervor, 8 Barrier** | 15 → 19.6 |
| Crown of Embers (1, uncommon) | 5 Primed, 1 Fervor | **6 Primed, 2 Fervor** | 7 → 10 |
| Faith Kept (1, common) | 2 Fervor, Hold, consumed: 3 Fervor | **3 Fervor** | 6 → 8 |
| Litany (2, rare Aura) | Fervor per Skill | **1 Mana** | 0.4x → 0.8x |
| Radiant Heart (2, rare Aura) | entering Radiant: draw 2 | **1 Mana, draw 3** | 0.3x → 0.8x |
| Last Rites of the Flame (3, rare) | 14 to ALL, 5 Fervor | **16 to ALL** | 28 → 31 |
| All-Seeing (3, rare, Consume) | 2 random pool cards, free | **2 Mana**: it is the Trickster's Pickpocket Master word for word, which costs 2 | 24 against 44 → against 30 |
| Mountain's Stillness (2, rare) | 4 (+2 per card in hand) Barrier | **6 (+3 per card)** | 13 → 20 |
| Thousand Palms (2, rare) | 3 x6 | **3 x7** | 18 → 21 |
| Quick Palms (0, common) | 3 | **4, gain 1 Fervor** | 3 → 6 |
| Poise (1, uncommon Aura) | 2 Bracing | **3 Bracing** | 8 → 12 |

### Left as they are

Kindle Fury, Angry Palm, Ashen Fist (+5%), Rising Ire (+20%, a 0-cost Consume), Flurry of Palms, Unleashed Roar, Swift Step, Spinning
Heel (a guide reference), Berserk Tide, Wrath Incarnate, Rampage of Ire, Hushed Stillness, Settled Mind, Let Go, Still Water, Mirror
Pool, Open Palm, Ascendant Form (the Knight's Inner Furnace, same cost, as you asked), Perfect Calm, Recollect, Serenity Incarnate,
Whispered Vow, Sunlit Blade, Reading the Signs, Kneel, Daily Rite, Foretold Flame, Mantra Engine, Shield of Faith, Rise Radiant, Still
Flame Ascendant, Flood of Visions, Unwavering, Crushing Palm, Inner Sight, Held Breath, Breath Between Blows, Unbroken Calm.

## 4. Upgrades past +50% (hand-written "+")

| Card | Automatic "+" | Proposed "+" |
|---|---|---|
| Bowing Low | +1 Fervor, +3 Barrier | **3 Fervor** |
| Kneel | +1 Fervor, +1 card | **3 Fervor** |
| Still Water | +3 Barrier, +1 card | **7 (+6 per Serene) Barrier** |
| Shield of Faith | +3 Barrier, +1 Fervor | **10 Barrier** |
| Crushing Palm | +3, +1 Exposed | **11 damage** |
| Watchful Calm | +3 Barrier, +1 Foresee | **5 Barrier** |
| Shifting Guard | +3 Barrier (on 2) | **4 Barrier** |

## 5. Mechanics I'd add (your question)

My honest read first: **her cards don't read as a barbarian.** Angry Palm, Kneel, Morning Prayer, Hymn of Embers and Serenity
Incarnate are a monk or a zealot, which is where the Watcher shape came from. The mechanics are fine; the names and art direction are
the gap. If you want her to feel like a barbarian, I'd rename the Radiant path and Fervor (for example **Bloodlust** that builds to a
**Berserk** turn) and rename the palms and prayers (axes, war cries, trophies) before adding much.

New mechanics, in the order I'd add them:

1. **Fury breaks (an exit trigger).** Today only Serene pays when you leave it.
   - A `leaveStance` trigger would let Fury pay on the way out: "Whenever your Fury ends: gain 6 Barrier", or "deal 5 to ALL".
   - That makes the in-and-out dance a choice between two payoffs, not just a Mana engine.
   - Small engine work: one trigger.
2. **Trophies.** Killing an enemy with an Attack takes a trophy: a lasting buff for the rest of the fight.
   - Example: "Take a Head: deal 12. If this kills, gain 1 Might."
   - It rewards finishing blows, it's very barbarian, and no other class does it.
   - The engine already has `onKill`; this needs new cards only.
3. **Heavy blows.** Big 3-cost attacks that cost 1 less while you are in Fury ("Two-Handed").
   - Fury already reads as a stance you want to be in when you swing; this makes the stance change the cost, not only the damage.
   - Uses the existing `cheaperPer` with the `wrath` metric.

I'd avoid more Barrier-per-stance pieces: that is exactly what's over today.

## 6. Totals

| | Now | After |
|---|---|---|
| Cards changed | | 1 trait, 2 basics (one changed), 24 over, 17 under, 7 hand-written upgrades |
| Rarity (common / uncommon / rare) | 20 / 30 / 28 | unchanged (the baselines are 20 / 35-36 / 24-27; 2-3 rares could move down, e.g. Gentle Return, Litany, Radiant Heart) |

## 7. Questions for Robert

1. **The trait:** Fervor only (my pick), or Fervor plus 3 Barrier the first time each turn?
2. **Still Guard at 3 Barrier** keeps her 1-Mana Serene opener. Or should it go back to 2 Mana with 7 Barrier, like the Watcher's
   Vigilance?
3. **Re-theme her toward a barbarian** (names, Fervor → Bloodlust, Radiant → Berserk), or keep the monk flavour?
