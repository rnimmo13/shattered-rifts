# Hunter review: balance and new cards (proposal, 2026-10-28)

**Status: applied 2026-10-28 (Robert: "i want you to make these changes to the hunter's card pool"; DECISIONS #377).** Differences from the proposal below: **Mark the Prey** is called **Single Out** (the Trickster has Mark Prey); Tripwire is called **Snare Line** (a Trickster card is already Tripwire Garrote); **Baited Snare** reads "Your companions each deal 5 damage" (to the attacker) rather than "act now", because the act-now op cannot aim, and the points are the same; and **Alpha Call** scores 35, not 30: its "Gain 1 Might" is a one-off for you when it is played, not growth on the Alpha, so it is still ~47% over a 2-cost rare. Robert then had the Might dropped: Alpha Call now only summons the Alpha (~29). Four rares moved to uncommon as §6 says: The Hunger, Unchained, Hunter's Call and Frothing Rage.

Every number below is from the card costing guide (`docs/14_CARD_COSTING.md`): add up a card's points, compare them with the budget
for its cost and rarity, and call it fine within ±15%. The companion and Trap rates are new sections of that guide (§10, §11), built
from the baseline rates, and the upgrade rule is §12. Since DECISIONS #376, Might and the other attack statuses no longer add to Aura,
Trap or totem damage, and the scores below assume that.

**Budgets:** 0 Mana 6, 1 Mana 10, 2 Mana 19, 3 Mana 28 for a common; uncommon x1.12 (6.7 / 11.2 / 21.3 / 31.4), rare x1.25 (7.5 /
12.5 / 23.8 / 35); basics 70-90% of a common.

**Hunter-only rates:**

- **Might is worth 6 a stack** (5 elsewhere), because Pack Instinct passes half of it to the companions, and their strikes are attacks.
- **Self-damage is priced at the full 1.5 per HP**, as the guide says: a card is priced for the deck without the Bloodrage payoffs.
- **The pack is 1-2 companions** when a card is priced (the starting Hound, plus one).

---

## 1. Companions: the biggest gap

Companion value = 1.2 x HP + 3 + its hit x expected acts (1 + 1 per 12 HP, at most 3). See the guide, §10.

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Summon Pup (1, common) | Pup 6 HP, hits 3 | **Pup 5 HP**, hits 3 (Pup+ 7 HP) | 13.2 → 12 | The Pack path's common entry card: a little over budget is fine, a third over is not. |
| Alpha Call (2, rare) | Pack Alpha 16 HP, hits 10; you gain 1 Might | **12 HP, hits 6**, no Might | 48 → 29 | About twice a 2-cost rare. |
| Dire Wolf (3, rare) | 24 HP, hits 14 | **18 HP, hits 9** | 74 → 43 | Twice a 3-cost rare. Still the biggest body in the game. |
| Litter (2, uncommon) | 2 Hounds | **2 Pups** | 33 → 24 | Two Hounds for 2 Mana is 55% over. |
| Bloodmoon Hunt (2, rare, Consume) | 2 Hounds, each companion +3 Might, all act | **1 Hound**, each companion **+2 Might**, all act | ~63 → ~35 | About twice a 2-cost rare with Consume. |
| Rally the Pack (2, uncommon) | Hound, each ally 4 Barrier | each ally **3 Barrier** | 26 → 22 | |

The starting Hound (8 HP, hits 4) stays as it is.

---

## 2. Number changes

### Starting cards

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Rend (1, basic) | 9 damage, lose 2 HP, 1 Might | **6 damage** | 12 → 9 | A starting card at 120% of a common: the starter shouldn't be the best deck. |
| Blood Frenzy (1, basic) | 4 to all, lose 1 HP, 1 Might | **3 to all** | 9.7 → 8.4 | |
| Savage Bite (1, basic) | 8 damage, Lifesteal 50% | **7 damage** | 11 → 10 | |

### Over budget

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Bone Crack (1, common) | 7 damage, 2 Exposed | **1 Exposed** | 13 → 10 | |
| Pack Tactics (1, common) | 1 Might, 4 Barrier to all friends | **2 Barrier** to all friends | 14.4 → 10.2 | |
| Thick Hide (1, common) | 6 Barrier to all friends | **5** | 12.6 → 10.5 | |
| Primal Feast (1, common) | Heal 7, companions +7 max HP | **Heal 3, +4 max HP** | 23 → 11.7 | A heal you can play every reshuffle. |
| Open a Vein (0, common, Consume) | lose 3 HP, 2 Might | **lose 4 HP** | 9.4 → 7.5 | |
| Devour Ally (1, uncommon) | Heal 12, 3 Might, sacrifice an ally | **Heal 8, 2 Might** | 24 → 12 | Was over twice its budget, even after losing the ally. |
| Blood Bond (1, uncommon) | lose 3 HP, 2 Might, 6 Barrier to all friends | **1 Might, 5 Barrier** | 20 → 12 | |
| Bone Collar (1, uncommon Aura) | on an ally's death: 2 Might, heal 4 | **1 Might, heal 2** | 3.2x → 1.6x its budget over a fight | |
| Burst of Speed (1, uncommon) | next turn +2 Mana, +2 cards | **+1 Mana**, +2 cards | 15 → 11 | The old version almost repeats the Neutral Plan Ahead. |
| Scar Tissue (1, rare Aura) | on self-damage: 3 Barrier, 1 Might this turn | **2 Barrier** | 2.7x → 2.1x | |
| Apex Frenzy (2, rare, Consume) | 6 a hit | **5 a hit** | 34 → 27.5 | |
| Bloodstorm (X, rare) | 7 a hit, draw X | **5 a hit**, draw X | 10.5 → 8.5 a Mana | X cards sit at ~7 a Mana; the draw is extra. |
| Slip the Leash (1, rare, Consume) | double your Might (at most +6) | **2 Mana, at most +4** | up to 45 → at most 30 | The 2026-10-25 audit found it in a doubler combo. |
| Hunger Unbound (2, rare Aura) | Unbound, lose 3 HP a turn | **3 Mana, lose 2 HP a turn** | | The Knight's Unholy Pact costs 3 for Unbound; this was in the strongest combo the audit found. |
| The Hunger Unleashed (2, rare Aura) | lose 7 HP, 4 Might, 2 Cadence | lose **6** HP, **2 Might, 1 Cadence** | | 73% for the first player in PvP (BALANCE.md). |
| Red Frenzy (2, rare Aura) | every card drawn: +1 Might this turn | **only cards drawn during your turn** (not the opening hand), **1 Mana** | ~60 → ~18 a fight | Five free Might a turn from the normal draw. |

### Under budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Ravage (2, uncommon) | 9 to all, lose 3 HP | **10 to all, twice**, lose 3 HP | 7.2 → 20.5 |
| Twin Fang (1, common) | 5 x2, lose 2 HP | **6 x2** | 7 → 9 |
| Feral Instinct (0, common, Consume) | lose 3 HP, draw 2 | **lose 2 HP** | 3 → 5 |
| Pound (1, common) | 8, draw 1, lose 2 HP | **lose 1 HP** | 8 → 9.5 |
| Rush In (1, common) | 6, draw 1 | **7**, draw 1 | 9 → 10 |
| Reckless Blow (1, uncommon) | lose 3 HP, 7 x2 | **lose 2 HP** | 8.5 → 10 |
| Tear Loose (1, uncommon) | 7, lose 3 HP, 4 Primed | **9, lose 2 HP** | 6.5 → 10 |
| Crushing Blow (2, uncommon) | 8 (+2 per Might) | **10** (+2 per Might) | 17 → 19 at 3 Might |
| Run Wild (2, uncommon) | 6 x2, 1 Might | **7 x2** | 17 → 19 |
| Rip and Tear (2, uncommon) | 5 x3, draw 1 | **6 x3** | 16 → 19 |
| Blur of Claws (1, uncommon) | 4 (+2 per card played) | **5 (+3 per card played)** | 8 → 11 |
| Rising Howl (2, rare) | 8 (+4 per card played) | **10 (+5 per card played)** | 16 → 20 |
| Savage Command (2, uncommon) | all allies act now, 1 Might | **1 Mana** | 13.5 at 1 Mana |
| Pack Bond (2, uncommon Aura) | 3 Barrier to all friends a turn | **4** | 1.2x → 1.6x |
| The Hunger (1, rare Aura) | lose 5 HP, 2 Might | **lose 4 HP, 3 Might** | 4.5 → 12 (now worse than the Knight's uncommon Steel Resolve) |
| Unchained (2, rare Aura) | 3 Might | **4 Might** | 18 → 24 |
| Den Mother (3, rare Aura) | an ally dies: 15 to its killer | **2 Mana** | 0.86x → 1.26x |
| Hunter's Call (2, rare Aura) | 1 Might a turn | **1 Mana** | 0.63x → 1.2x (the Knight's Warlord's Oath is 3 Mana for 2 a turn) |
| Bloodsong (1, rare Aura) | lose 3 HP, 1 Cadence | **0 Mana** | otherwise worse than Hunter's Call at 1 Mana |

### Left as they are (on budget)

Pain Ward, Rummage, Trail of Blood, Bared Teeth, Lead the Charge, Throw Scraps, Pounding Heart, Wild Swings, Shake Loose, Whirling
Maul, Hamstring Slam, Feeding Time, Devour, Gnarltooth Trap, Bone Offering, Bloodied Howl, Gut Trap, Whet the Fangs, Frenzied Gulp,
Adrenal Surge (next to Draw Blood it is a fair uncommon), Battle Rhythm, Reckless Abandon, Pack Leader, Wounded Wrath (its 4 damage no
longer grows with Might, #376), Blood Tithe, Scarred Warrior, Skullcrusher, Pack Frenzy, Wild Hunt, Blood Pact, Frothing Rage, Death
or Glory, Berserk Tempo, Killing Spree, Ancient Fury.

---

## 3. Upgrades past +50%

The automatic upgrade raises every number on a card, so these gain far more than the ~30% the baselines do (guide §12). Each gets a
hand-written "+" that raises one number.

| Card | Automatic "+" gains | Proposed "+" | Gain |
|---|---|---|---|
| Blood Frenzy | +3 to all and +1 Might (+100%) | **5 to all** | +31% |
| Feral Instinct | -1 HP and +1 card (+110%) | **lose 1 HP** | +30% |
| Pound | +3, +1 card, -1 HP (+106%) | **12 damage** | +32% |
| Rush In | +3 and +1 card (+78%) | **10 damage** | +30% |
| Shake Loose | +1 card and +3 Barrier (+72%) | **6 Barrier** | +34% |
| Pack Tactics | +1 Might and +3 Barrier to all (+75%) | **4 Barrier to all friends** | +41% |
| Primal Feast | +3 heal, +3 max HP (+56%) | **companions +7 max HP** | +46% |
| Bloodied Howl | -1 HP, +1 Exposed to all, +1 card (+110%) | **3 Exposed to all** | +50% |
| Blood Bond | -1 HP, +1 Might, +3 Barrier to all (+70%) | **7 Barrier to all friends** | +35% |
| Feeding Time | +2 max HP, +1 Might (+84%) | **companions +6 max HP** | +47% |
| Bone Offering | +1 card, +3 heal (+85%) | **draw 3** | +40% |
| Frothing Rage | -1 HP, +1 Might, +1 card (+70%) | **draw 3** | +38% |
| Gnarltooth Trap | +3 damage, +1 Might (+75%) | **9 damage** | +25% |
| The Hunger Unleashed | -1 HP, +1 Might, +1 Cadence | **3 Might** | |
| Burst of Speed | +1 Mana, +1 card next turn | **3 extra cards** | +32% |

---

## 4. Retire 2

- **Crimson Pact:** "lose 4 HP, consume a card, draw 2". Bone Offering does the same job with a heal instead of an HP cost, so
  Crimson Pact is always the worse pick.
- **Unbridled:** a third 0-cost "Mana and cards for HP" card, next to Blood Tithe and Adrenal Surge.

Both would be retired into their closest card (`retired.ts`), so old saves and decks keep working.

---

## 5. New cards (7)

The theme: the hunter sets snares that slow the prey (Faltering), marks it, and the pack finishes it. The Traps feed the pack cards,
so the Hunter's Traps are a hunt, not a copy of the Trickster's.

| Card | Cost, type, rarity | Text | Points / budget |
|---|---|---|---|
| **Bear Trap** | 1, Trap, common | When you or an ally is attacked: Deal 6 damage to the attacker. Apply 2 Faltering to it. | (6 + 6) x 0.85 = 10.2 / 10 |
| **Tripwire** | 1, Trap, common | When the enemy turn begins: Gain 5 Barrier. Apply 1 Faltering to ALL enemies. | (6 + 4.5) x 0.9 = 9.5 / 10 |
| **Deadfall** | 2, Trap, uncommon | When you or an ally is attacked: Deal 18 damage to the attacker. Apply 2 Exposed to it. | (18 + 6) x 0.85 = 20.4 / 21.3 |
| **Baited Snare** | 1, Trap, uncommon | When you or an ally is attacked: All your allies act now, against the attacker. Gain 3 Barrier. | (8 + 3.6) x 0.85 = 9.9 / 11.2, more with a full pack |
| **Hunting Grounds** | 1, Aura, uncommon | Whenever one of your Traps springs: Gain 1 Might. | ~0.6 springs a turn x 6 x 4 turns = ~15 (1.3x) |
| **Single Out** | 1, Skill, common | Apply 1 Exposed. Your companions each gain 3 Primed. Draw 1 card. | 3 + 4.5 + 3 = 10.5 / 10 |
| **Run It Down** | 1, Attack, uncommon | Deal 7 damage. If the target is Faltering: your companions each deal 5 damage to it. | 7 + ~4.9 = 11.9 / 11.2 |

**Engine pieces they may need:** Baited Snare's "act now, against the attacker" may need an aim option on the act-now op; Mark the
Prey gives Primed to companions (a selector for "your companions" is used by Feeding Time already). Hunting Grounds uses the existing
`snare` trigger, Run It Down the existing `when` and `command` ops, and Red Frenzy's change the existing `drawMidTurn` trigger.

---

## 6. Rarity spread

| Class | Cards | Common | Uncommon | Rare | Rare share |
|---|---|---|---|---|---|
| Knight | 74 | 18 | 32 | 23 | 31% |
| Assassin | 78 | 18 | 33 | 25 | 32% |
| Spellblade | 74 | 20 | 32 | 21 | 28% |
| Necromancer | 80 | 17 | 36 | 25 | 31% |
| Shaman | 78 | 20 | 33 | 23 | 29% |
| **Hunter** | 79 | 20 | **28** | **28** | **35%** |

(Card list counts, tokens left out.) The Hunter has 3-5 more rares and 4-8 fewer uncommons than any baseline. Retiring Unbridled
takes one rare off; the new cards are commons and uncommons. To match the baselines, about **4 rares would move down to uncommon**:
the plain Might Auras (Hunter's Call, The Hunger, Unchained) and one of Frothing Rage or Scarred Warrior. Their budgets drop by about
10% with the rarity, which most of them meet after the changes in §2.

## 7. Totals

| | Now | After |
|---|---|---|
| Hunter cards (own pool, basics included) | 81 | **86** (81 - 2 retired + 7 new) |
| Hunter Traps | 2 | 6 |

Plus Strike and Defend (Neutral) and the starting Hound. Fell the Prey stays switched off (DECISIONS #319).

The Trickster still has far more Traps (17, and the test asks for at least twice anyone else's: 17 ≥ 12). `docs/09_ROSTER.md` says
other decks get "a trap or two"; that line would say the Hunter has six.
