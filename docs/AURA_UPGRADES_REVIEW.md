# Aura upgrades: a Slay the Spire-style pass (proposal, 2026-10-28)

**Status: done (0.116.0, DECISIONS #396)**, except the Knight (Robert: "dont touch the knight"). What changed from this proposal when it was built:

- The Knight's 17 Auras are untouched (they keep the cost cut).
- Four copies of Slay the Spire cards already had a hand-written cost cut that mirrors the original, so they keep it: Sigil of Momentum, Sigil of Wandering, Ever Watchful, Phylactery.
- Priced against the guide: Hot Brass+ gives 2 Barrier (not 3), Scarred Warrior+ 10 Barrier (not 11), Ancient Fury+ loses 2 HP (not 1), Iron Body+ loses 1 HP instead of gaining Primed, and Mass Production+ keeps its cost cut (Patrol Drone+ was +64%).
- Six of the 113 had a hand-written cost cut from a costing pass (Bottomless Flask, Eye of the Storm, Legion, Salvage Rights, Self-Mending, and The Twelve-Gauge Opera); they follow the proposal like the rest.

Result: 62 Auras changed; 51 of 195 still get cheaper (17 of them the Knight's), against 113 before.

## Why so many Auras get cheaper

113 of our 195 Auras cost 1 less when upgraded, and **none of the 113 was chosen by hand**. The automatic upgrade (`plus()` in
`packages/content/src/v2/build.ts`) raises the numbers on a card's own effects, but an Aura's numbers sit inside its `power` op, and
`plus()` never looks in there. It finds nothing to raise and falls back to "1 less Mana". The other 82 Auras have hand-written upgrades
(mostly the classes copied from Slay the Spire), and they nearly all raise a number instead.

The costing guide (§12) lists "an Aura: 1 less Mana" as a baseline upgrade, with Warlord's Oath and Bastion Engine as examples. Those two
got their cost cut from the same fallback, so that row in the guide comes from the gap, not from a design choice.

## How Slay the Spire upgrades a Power

Across the Powers in Slay the Spire, roughly two in three raise their number, about one in six gains Innate, and about one in six costs
1 less. A few lose a drawback. Which one a Power gets follows from what it does:

| Rule | When | Examples from Slay the Spire | Ours |
|---|---|---|---|
| **Raise** the main number, about +30-50% | the Aura has a number that can grow | Inflame 2 → 3, Metallicize 3 → 4, Juggernaut 5 → 7, Feel No Pain 3 → 4, Caltrops 3 → 5, Like Water 5 → 7, Devotion 2 → 3 | the guide's +30-50% rule |
| **Opening hand** (Innate) | a cheap engine that is worth most when it starts turn 1, where +1 would double it | Brutality, Infinite Blades, After Image, Storm, Battle Hymn, Establishment | `innate`, already used (Bottomless Sleeves, Trigger Discipline) |
| **Cost 1 less** | the effect is on/off and cannot be bigger (a rule change, a Mana engine, "all your allies act") | Barricade, Corruption, Dark Embrace, Envenom, Creative AI, Rushdown, Tools of the Trade | keep the current cut |
| **Smaller drawback** | the drawback is the part to trim | Berserk (Vulnerable 2 → 1), Echo Form and Deva Form lose Ethereal | HP lost each turn, Fleeting |

## The result (as proposed; see the status at the top for what was built: 48 raise, 10 Opening hand, 4 drawback, 51 still cheaper)

| | Raise | Opening hand | Smaller drawback | Keeps its cost cut |
|---|---|---|---|---|
| Drunkard (18) | 14 | 2 | | 2 |
| Monk (20) | 15 | 1 | | 4 |
| Engineer (12) | 7 | 1 | | 4 |
| Trickster (10) | 7 | 2 | | 1 |
| Hunter (16) | 6 | 3 | 2 | 5 |
| Knight (17) | 6 | 2 | | 9 |
| Neutral (5) | 1 | 1 | 1 | 2 |
| Spellblade (4) | 1 | 1 | | 2 |
| Necromancer (3) | | 1 | 1 | 1 |
| Shaman (4) | | | | 4 |
| Assassin (4) | | | | 4 |
| **All 113** | **57** | **14** | **4** | **38** |

Afterwards **38 of 195 Auras (19%) get cheaper** when upgraded, against 58% now: about Slay the Spire's share.

Each raise is sized by the guide's +30-50% rule on the number raised. Before building anything, I would price each one against §7 (the
Aura's 4-turn total) and trim any that go past +50%.

## Every card

### Drunkard

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Bandolier (1, U) | Shell: 2 Barrier | cost 0 | Shell: **3** Barrier | Raise |
| Bottomless Flask (2, R) | Heal 2 (+1 per 10% missing), draw 1 | cost 1 | Heal **4** (+1 per 10% missing), draw 1 | Raise |
| Broken Window Theory (2, R) | End of turn: 1 (+1 per 6% missing) to all | cost 1 | **3** (+1 per 6% missing) to all | Raise |
| Drunken Master (1, U) | Stagger: 2 Barrier, 2 to a random enemy | cost 0 | **3** Barrier, **3** damage | Raise |
| Dutch Courage (1, U) | End of turn: Barrier equal to Hangover | cost 0 | keep cost 0 | Cost (it scales with Hangover; nothing to raise) |
| Extended Mag (2, R) | Sharpen 2 and a Shell each turn | cost 1 | Sharpen **3** and a Shell | Raise |
| Glass Jaw (2, R) | Lose HP: 3 to all, 2 Barrier | cost 1 | **5** to all, 2 Barrier | Raise |
| Gun Oil (1, C) | Gun: 3 Barrier | cost 0 | Gun: **4** Barrier | Raise |
| Hair Trigger (1, U) | Shell: Sharpen 1 | cost 0 | **Opening hand** | Opening hand (Sharpen 2 would double it) |
| Hot Brass (1, R) | Consumed: 1 Barrier, Sharpen 1 | cost 0 | **3** Barrier, Sharpen 1 | Raise |
| Mean Drunk (2, U) | Lose HP: 1 Might this turn, 2 Barrier | cost 1 | 1 Might, **4** Barrier | Raise |
| One More Round (3, R) | 2 Shells and heal 3 each turn | cost 2 | 2 Shells and heal **6** | Raise |
| Rolling Thunder (2, R) | 2 Shells each turn | cost 1 | keep cost 1 | Cost (a third Shell is a card engine, like Creative AI) |
| Scope (1, U) | Sharpen 2 each turn | cost 0 | Sharpen **3** | Raise |
| Shell Game (1, U) | A Shell each turn | cost 0 | **Opening hand** | Opening hand (Infinite Blades) |
| Shellshocked (1, U) | Consumed: 2 to all | cost 0 | **3** to all | Raise |
| The Glass Palace (3, R) | 3 (+1 per 6% missing) Barrier; lose HP: 3 to all | cost 2 | lose HP: **5** to all | Raise |
| The Twelve-Gauge Opera (2, R) | Sharpen 6; gun: Sharpen 1, 3 Barrier | cost 1 | Sharpen **9**; gun: Sharpen 1, 3 Barrier | Raise |

### Monk

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Ascendant Form (2, R) | 1 Mana each turn | cost 1 | keep cost 1 | Cost (a Mana engine) |
| Iron Body (1, U) | Enter Fury: lose 2 HP, 3 Primed | cost 0 | lose 2 HP, **4** Primed | Raise |
| Breath Between Blows (1, R) | Skill: 2 Barrier | cost 0 | Skill: **3** Barrier | Raise |
| Daily Rite (1, U) | 2 Fervor each turn | cost 0 | **3** Fervor | Raise (Devotion 2 → 3) |
| Morning Prayer (1, U) | 1 Fervor, 2 Barrier each turn | cost 0 | 1 Fervor, **4** Barrier | Raise |
| Eye of the Storm (2, R) | Enter Fury, 4 to all, 4 Barrier each turn | cost 1 | **6** to all, **6** Barrier | Raise |
| Gentle Return (1, R) | Enter Serene: heal 1, 3 Barrier | cost 0 | heal 1, **5** Barrier | Raise (Like Water) |
| Wheel of Motion (2, U) | Enter a stance: 3 to all | cost 1 | **4** to all | Raise |
| Litany (1, R) | Skill: 1 Fervor | cost 0 | keep cost 0 | Cost (2 Fervor would double it) |
| Mantra Engine (1, U) | End of turn: Barrier equal to Fervor | cost 0 | keep cost 0 | Cost (it scales; nothing to raise) |
| Perfect Balance (2, R) | Enter a stance: draw 1, 2 Barrier | cost 1 | draw 1, **4** Barrier | Raise |
| Radiant Heart (1, R) | Enter Radiant: draw 3 | cost 0 | draw **4** | Raise |
| Rampage of Ire (2, R) | Enter Fury: 6 to all | cost 1 | **9** to all | Raise |
| Reading the Signs (1, C) | Discard: 1 Fervor | cost 0 | **Opening hand** | Opening hand |
| Serenity Incarnate (3, R) | End of turn: heal 3, 6 Barrier | cost 2 | heal 3, **9** Barrier | Raise |
| Surge of Ire (2, R) | First Fury each turn: 6 Barrier, draw 1 | cost 1 | **9** Barrier, draw 1 | Raise |
| Unbroken Calm (2, R) | 4 Barrier, draw 1 each turn | cost 1 | **6** Barrier, draw 1 | Raise |
| Unmoved Mind (2, U) | Enter a stance: 2 Barrier, 2 to a random enemy | cost 1 | **3** Barrier, **3** damage | Raise |
| Unwavering (2, R) | Discard or consume: 4 Barrier, 1 Fervor | cost 1 | **6** Barrier, 1 Fervor | Raise |
| Wrath Incarnate (2, R) | Enter Fury each turn | cost 1 | keep cost 1 | Cost (on/off) |

### Engineer

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Backup Core (2, R) | First ally death each turn: it returns at half HP | cost 1 | keep cost 1 | Cost (on/off) |
| Command Chip (3, R) | Summon: all allies act | cost 2 | keep cost 2 | Cost (on/off) |
| The Foundry Awakens (3, R) | 3 Primed to companions, a Siege Engine each turn | cost 2 | **5** Primed | Raise |
| Legion (2, R) | Summon: 1 Might to all friends | cost 1 | **Opening hand** | Opening hand (2 Might would double it) |
| Mass Production (3, R) | A Patrol Drone each turn | cost 2 | a **Patrol Drone+** each turn | Raise |
| Overclock Core (2, R) | 1 Might to all friends each turn | cost 1 | keep cost 1 | Cost (2 a turn would double it) |
| Perpetual Motion (1, R) | 2 Primed to all friends each turn | cost 0 | **3** Primed | Raise |
| Relay Network (1, U) | Trap: 3 Primed to all friends | cost 0 | **4** Primed | Raise |
| Salvage Rights (1, U) | Ally dies: draw 1, 2 Barrier | cost 0 | draw 1, **4** Barrier | Raise |
| Scrapyard King (2, U) | Ally dies: 1 Might to all friends | cost 1 | keep cost 1 | Cost (2 would double it) |
| Self-Mending (2, U) | Heal 2, companions +2 max HP each turn | cost 1 | heal **3**, **+3** max HP | Raise |
| Swarm Tactics (1, U) | Summon: 6 to a random enemy | cost 0 | **9** damage | Raise |

### Trickster

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Gleeful Trapsmith (1, U) | Play a Trap: 4 to all | cost 0 | **6** to all | Raise |
| Hunter's Eye (2, R) | Attack: 1 Exposed | cost 1 | keep cost 1 | Cost (Envenom 2 → 1) |
| The Long Game (1, U) | Draw 1 each turn | cost 0 | **Opening hand** | Opening hand |
| Masquerade (2, R) | End of turn: 3 x suits to all | cost 1 | **4** x suits to all | Raise |
| Master Trapper (1, R) | Play a Trap: draw 1, 3 Barrier | cost 0 | draw 1, **5** Barrier | Raise |
| Patient Guard (1, R) | End of turn: 2 (+1 per card in hand) Barrier | cost 0 | **4** (+1 per card in hand) Barrier | Raise |
| Patient Hunter (1, R) | 1 Exposed to all each turn | cost 0 | **Opening hand** | Opening hand |
| The Whole Deck (1, R) | Full Trick: draw 2, 1 Mana next turn | cost 0 | draw **3**, 1 Mana next turn | Raise |
| Trap Door (2, U) | A Trip Line each turn | cost 1 | a **Trip Line+** each turn | Raise |
| Trapper's Dividend (1, R) | Trap springs: draw 1, 5 Barrier | cost 0 | draw 1, **8** Barrier | Raise |

### Hunter

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Ancient Fury (2, R) | 2 Might, lose 3 HP each turn | cost 1 | 2 Might, lose **1** HP | Smaller drawback (Berserk) |
| Battle Rhythm (1, U) | Draw 1, lose 1 HP each turn | cost 0 | **Opening hand** | Opening hand (Brutality) |
| Berserk Tempo (2, R) | 1 Mana, draw 1, lose 2 HP each turn | cost 1 | lose **1** HP | Smaller drawback (Berserk) |
| Bone Collar (1, U) | Ally dies: 1 Might, heal 2 | cost 0 | 1 Might, heal **4** | Raise |
| Hunger Unbound (3, R) | Unbound; lose 2 HP each turn | cost 2 | keep cost 2 | Cost (Corruption 3 → 2) |
| Hunter's Call (1, U) | 1 Might each turn | cost 0 | **Opening hand** | Opening hand (2 a turn would double it) |
| Hunting Grounds (1, U) | Trap springs: 1 Might | cost 0 | keep cost 0 | Cost |
| Killing Spree (3, R) | Attack: draw 1 | cost 2 | keep cost 2 | Cost (on/off) |
| Pack Bond (2, U) | 4 Barrier to all friends each turn | cost 1 | **6** Barrier | Raise |
| Pack Leader (2, U) | Attack: 2 Barrier to all friends | cost 1 | **3** Barrier | Raise |
| Red Frenzy (1, R) | Draw: 1 Might this turn | cost 0 | keep cost 0 | Cost |
| Scar Tissue (1, R) | Lose HP: 2 Barrier, 1 Might this turn | cost 0 | **4** Barrier, 1 Might | Raise |
| Scarred Warrior (1, R) | Lose 2 HP, 8 Barrier each turn | cost 0 | lose 2 HP, **11** Barrier | Raise |
| Trail of Blood (1, C) | Summon: 1 Might | cost 0 | **Opening hand** | Opening hand |
| Wild Hunt (3, R) | All allies act each turn | cost 2 | keep cost 2 | Cost (on/off) |
| Wounded Wrath (1, C) | Lose HP: 4 to a random enemy | cost 0 | **6** damage | Raise |

### Knight

The Knight is the Ironclad's list (DECISIONS #367), and Robert sets her cards himself, so these follow the Ironclad's own upgrades where
the card is a clear copy, and are only a suggestion.

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Bastion Engine (2, R) | Gain Barrier: 5 to a random enemy | cost 1 | **7** damage | Raise (Juggernaut 5 → 7) |
| Blood Fire (1, U) | Lose 1 HP each turn; lose HP: 6 to all | cost 0 | **8** to all | Raise (Combust 5 → 7) |
| Bloodied Plate (1, R) | Lose 1 HP, 8 Barrier each turn | cost 0 | **11** Barrier | Raise |
| Charging Herd (2, U) | End of turn: play a random Attack from hand | cost 1 | keep cost 1 | Cost (on/off) |
| Cruel Streak (1, R) | Cruelty | cost 0 | keep cost 0 | Cost (on/off) |
| Inner Furnace (2, R) | 1 Mana each turn | cost 1 | keep cost 1 | Cost (a Mana engine) |
| Juggler's Rhythm (1, U) | Third Attack in a turn: a copy to hand | cost 0 | **Opening hand** | Opening hand |
| Numbing Rite (1, U) | Consumed: 3 Barrier | cost 0 | **4** Barrier | Raise (Feel No Pain 3 → 4) |
| Raised Hell (2, R) | Draw a Strike: play it | cost 1 | keep cost 1 | Cost (on/off) |
| Rite of Recall (2, R) | Consumed: draw 1 | cost 1 | keep cost 1 | Cost (Dark Embrace 2 → 1) |
| Scar Over (1, U) | Lose HP: 1 Might | cost 0 | **2** Might | Raise (Rupture 1 → 2) |
| Scent of Weakness (1, U) | Apply Exposed: draw 1 | cost 0 | keep cost 0 | Cost |
| Stone Stance (2, R) | Unmovable | cost 1 | keep cost 1 | Cost (on/off) |
| Unbroken Wall (3, R) | Fortified | cost 2 | keep cost 2 | Cost (Barricade 3 → 2) |
| Unforgiving Drill (1, R) | An Attack back from discard, upgraded, each turn | cost 0 | **Opening hand** | Opening hand |
| Unholy Pact (3, R) | Unbound | cost 2 | keep cost 2 | Cost (Corruption 3 → 2) |
| Warlord's Oath (3, R) | 2 Might each turn | cost 2 | **3** Might | Raise (Demon Form 2 → 3) |

### Neutral, Spellblade, Necromancer, Shaman, Assassin

| Aura | Now | Upgrade now | Proposed upgrade | Rule |
|---|---|---|---|---|
| Ancient Pact (Neutral 1, Ancestral) | 1 Mana, lose 2 HP each turn | cost 0 | lose **1** HP | Smaller drawback |
| Attunement (Neutral 2, R) | 1 more Mana each turn from next turn | cost 1 | keep cost 1 | Cost (a Mana engine) |
| Heart of the Rift (Neutral 3, R) | 1 Mana, draw 1 each turn | cost 2 | keep cost 2 | Cost (a Mana engine) |
| Lineage (Neutral 2, Ancestral) | Play an Aura: draw 1 | cost 1 | **Opening hand** | Opening hand (it wants to come before your other Auras) |
| Unbroken Line (Neutral 3, Ancestral) | 6 Barrier, heal 2 each turn | cost 2 | **9** Barrier, heal 2 | Raise |
| Echoing Blade (Spellblade 2, R) | Obsidian Blade plays once more | cost 1 | keep cost 1 | Cost (on/off) |
| Sigil of Momentum (Spellblade 2, U) | Every 4 Mana spent: 1 back | cost 1 | every **3** Mana | Raise |
| Sigil of Wandering (Spellblade 2, U) | A random Neutral card each turn | cost 1 | **Opening hand** | Opening hand |
| Tyrant's Gaze (Spellblade 2, R) | Attack: 1 Sapped | cost 1 | keep cost 1 | Cost (Envenom) |
| Ever Watchful (Necromancer 2, R) | A Baleful Glance each turn | cost 1 | **Opening hand** | Opening hand |
| Grimoire Gale (Necromancer 1, U) | Draw a Fleeting card: draw 1 | cost 0 | keep cost 0 | Cost |
| Phylactery (Necromancer 3, R) | 1 Mana, draw 1 each turn; Fleeting | cost 2 | cost 3, **loses Fleeting** | Smaller drawback (Echo Form loses Ethereal) |
| Ash to Spirits, Spirit Drum, Wild Heart, Spiritfont (Shaman) | | cost -1 | keep | Cost (on/off, or Creative AI) |
| Blood Scent, Grand Scheme, Nimble Routine, Patient Hands (Assassin) | | cost -1 | keep | Cost (on/off statuses, Tools of the Trade) |

## If approved

1. Give each of the 75 changed Auras a hand-written `up` in its pool, and price each one against §7 first.
2. Fix the guide (§12): an Aura's upgrade raises its number by about +30-50%, gains Opening hand when +1 would double it, or costs 1 less only when its effect is on/off. Drop Warlord's Oath and Bastion Engine as the cost-cut examples.
3. Add a test so that a new Aura whose upgrade is only the automatic cost cut has to be marked as meant (like the rule that flags automatic upgrades past +50%).
4. Saved decks keep their upgraded cards; only what "+" does changes. Card effects change, so RULES_VERSION goes up at the deploy.
