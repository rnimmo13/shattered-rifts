# Engineer review: frames, guns, balance and new cards (proposal, 2026-10-28)

**Status: applied 2026-10-28 (Robert: "1) yes 2) lets go with it for now 3) no 4) i like the pips on the card and the machine ... i want those in the game"; DECISIONS #383).** Salvage is on the trait, Full Salvo gives 5 Primed, the starter is unchanged, and frames show as pips on the summon card and on the machine (Heavy and Colossal machines are also drawn larger). Differences from the proposal below: **Siege Protocol** is 10 (+2 per Might), not 8 (+3), because the balance guard caps a payoff on a resource that only grows at 2 a point (still ~19 at 3 Might); **Rebuild** keeps 3 Barrier (a card has to do something when nothing has fallen: ~19 in the best case, 3.6 otherwise); **Arc Welder** has the id `welding-arc` (`arc-welder` was trimmed into Armor Piercer, #358); the scrap trigger is `allyLost` ("dies or is scrapped"), and only a release counts as scrapping there, since a sacrifice is already a death. A card that summons several companions needs room for all of them for every hero, so the Hunter's Litter now asks for room for both Pups.

Robert asked for the following (2026-10-28):
- the Engineer re-assessed by the card costing guide, as the Hunter was;
- mechanics that make the pool feel unique and fit the theme;
- **companions that take 1 to 3 of the 3 companion slots**, so one large machine can fill the board by itself;
- cards where the Engineer deals damage with weapons the Engineer built;
- the five baseline classes used as the reference;
- "act now" kept, but not too much of it;
- Primed on companions for bursty turns, especially when paired with act now.

Every number below comes from the card costing guide (`docs/14_CARD_COSTING.md`). Add up a card's points, compare the total with the
budget for its cost and rarity, and a card within ±15% is fine. Companions use the guide's rate (§10): **1.2 x HP + 3 + its hit x
expected acts**, where expected acts = 1 + 1 per full 12 HP, as the Hunter review counted them. Might and the other attack statuses
add only to attacks (#376), so a companion's strike and the Engineer's own Attack cards get them; Auras and Traps do not.

**Budgets:** 0 Mana 6, 1 Mana 10, 2 Mana 19, 3 Mana 28 for a common. Uncommon is x1.12 (6.7 / 11.2 / 21.3 / 31.4), rare x1.25 (7.5 /
12.5 / 23.8 / 35). Consume adds +25% on a card you would play every reshuffle. Basics are 70-90% of a common.

---

## 0. What the baselines suggest

None of the five baseline classes has a Riftwalker whose companions act on their own. Their shapes still map onto the Engineer's three
build paths:

| Engineer path | Baseline shape it borrows | What it takes from it |
|---|---|---|
| **Swarm** (many small drones) | Necromancer's Thralls (the Necrobinder copy) | Bodies are cheap, cards count them, and losing one pays out. Priced like Raise: 1.2 per HP plus 3 per body. |
| **Core** (one big machine, built up) | Necrobinder's Osty, Regent's Sovereign Blade | A single thing you grow all fight and cash in. Heavy Hitter and Crankshaft read its size, as Osty's payoffs read his. |
| **Assemble** (charge up, then fire) | Defect's orbs and Focus | Charge first, release later. Primed is the charge and "act now" is the release (the Defect's Evoke). That is why act now stays scarce. |
| **The Engineer's guns** (new) | Defect's and Regent's own attacks | A small set of plain attacks with a twist that feeds the machines. Rates are the guide's ordinary damage rates. |

**Engineer-only rates** (added to the guide if this is approved):

- **Might to all friends: 5 + 2 per companion**, so about 8 with the usual 1-2 companions. The Engineer's companions take the Might
  themselves, rather than half of it as the Hunter's do.
- **Might on one companion: 2.5 a stack.** A companion that strikes twice gets twice that: priced at the Colossal it is meant for,
  this is the multiplier test from guide §8.
- **Primed on your companions: 1 a stack for each companion**, about 1.5 a stack. Primed counts on every hit of one strike, so a
  two-hit machine doubles it.
- **"You and your companions gain N Primed": 2.5 a stack.** The hero's Primed goes into the next Attack card, which also counts it
  on every hit (`vigor`, engine.ts).
- **Barrier on one companion: 1.0 a point.** It is struck only while that companion stands in front.
- **Frame: -2 for each slot past the first** (Heavy -2, Colossal -4). It stands for the Light companions and per-ally payoffs the
  machine keeps off the board. See §1.

---

## 1. New mechanic: Frames (companions take 1, 2 or 3 slots)

The Engineer still has **3 companion slots**. Each companion now has a **frame**:

| Frame | Slots | What it is | Companions |
|---|---|---|---|
| **Light** | 1 | drones and turrets: cheap, fragile, many at once | Drone, Patrol Drone, Micro Drone, Sentry Turret, Repair Bot, **Spotter Drone** (new) |
| **Heavy** | 2 | walkers: one Heavy plus one Light fills the board | Enforcer Mk.II, Siege Engine, **Bulwark Walker** (new) |
| **Colossal** | 3 | a war machine that stands alone | War Engine, **Scrap Golem** (new), **Dreadnought** (new) |

**Rules.**
- A summon fits only if its slots are free. If not, you **scrap** companions to make room. When only one has to go you choose it, as
  you do now; when every companion has to go (a Colossal), the card says so before you confirm.
- A card that summons several (Drone Carrier, Scrap Heap) needs room for all of them. Today the extra ones fizzle without a word.
- The frame is shown as 1-3 pips on the companion and in the card text: "Summon Enforcer Mk.II (Heavy: 2 slots, 11 HP)".

**Why it is good for the class.** The slot cap now tames the engines that used to run away: Mass Production, The Foundry Awakens,
Command Chip, Legion and Drone Carrier can only fill 3 slots, and a Colossal shuts them off. That leaves a real choice of how to
fill the board, and the build paths split on it. Swarm wants three Lights. Core wants one Colossal. Assemble wants whatever the
burst turn needs.

### Scrap and Salvage (the Engineer's own twist)

A companion you **release to make room** or **sacrifice** is **scrapped**. Two things hang off this:

1. **Salvage is added to the trait.** Tinkerer would read: "At the start of your turn, you heal 1 and your companions gain 1 max HP.
   **Salvage:** a companion you build by scrapping others takes their Might and Primed, and half their HP as extra max HP."
   This turns the frames from a limit into a play. You start the fight with Light drones, Prime them and Tune them up, then scrap
   them into a Heavy or a Colossal that keeps all of it. It fits the theme: the Engineer recycles.
2. **A `scrap` trigger** for Auras. Salvage Rights and Scrapyard King change to "Whenever one of your allies dies **or is scrapped**".

**Pricing the Salvage.** Scrapping two Patrol Drones (4 HP each) into a War Engine adds +4 max HP plus whatever Might and Primed they
held: about +5 to +10 points, once a fight. The drones were already paid for, so the Colossal summons are priced without it. The
Salvage is the reason to play a Light card before a Colossal.

**Engine pieces:** `UnitDef.slots` (default 1). `spawn` and `needsRelease` count slots. The `release` action may name several
companions. A `scrap` trigger fires on a release or a sacrifice. A trait field, `salvage`, moves the scrapped companions' Might,
Primed and half their HP to the new arrival. New metric `slots` (for Particle Cannon) and new selector `biggestAlly` (for Arc
Welder; the metric already exists).

---

## 2. Companions

| Companion | Frame | Now | Proposed | Points now → after | Card that summons it |
|---|---|---|---|---|---|
| Drone (you start with it) | Light | 8 HP, hits 3 | unchanged | 15.6 | (start of fight) |
| Patrol Drone | Light | 5 HP, hits 4 | **4 HP, hits 3** | 13 → 10.8 | Deploy Drone (1, basic): 145% → 108% of a common, still the class's signature |
| Micro Drone | Light | 3 HP, hits 3 | **3 HP, hits 2** | 9.6 → 8.6 | Spare Parts (0, Consume): +28% → +15% |
| Sentry Turret | Light | 7 HP, Taunt, hits 3, you gain 2 Barrier | **5 HP**, Taunt, **hits 2**, you gain 2 Barrier | 16.8 → 13.4 | Call Turret (1, uncommon): +50% → +20%. A Swarm card you named (#356), so it is left a little over |
| Repair Bot | Light | 4 HP, heals you 3 | **heals you 2** | 12.3 → 10.8 | Repair Bot (1, common) |
| Enforcer Mk.II | **Heavy** | 12 HP, hits 6 | **11 HP**, hits 6 | 29.4 → 20.2 | Build Enforcer (2, common): +55% → +6% |
| Siege Engine | **Heavy** | 16 HP, hits 13 | **12 HP, hits 3 twice** | 48 → 25.4 | Siege Engine (2, rare): twice its budget → +7%. The two hits make it the Primed and Might machine |
| War Engine | **Colossal** | 22 HP, hits 9 | **20 HP, hits 4 twice** | 47 → 37 | War Engine (3, rare): +35% → +6% |

The "+" companions keep the house rule of 4 more HP. Tinkerer still grows every companion by 1 max HP a turn.

**Hand checks.**
- **War Engine.** Reactor's 3 Might plus Full Salvo's 5 Primed is 12 a hit, twice, on the act now. Its own strike at the end of the
  turn is 7 twice. That makes about 38 from one machine on a well-built burst turn, after two setup cards. That passes the guide's
  turn-4 check for a rare.
- **Siege Engine and The Foundry Awakens.** The Aura summons a Siege Engine each turn, but only when 2 slots are free, so it no
  longer stacks machines.

---

## 3. Number changes

### Starting cards

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Deploy Drone (1, basic) | Patrol Drone 5 HP, hits 4 | Patrol Drone 4 HP, hits 3 | 13 → 10.8 | The same lesson as the Hunter's Rend: the starter shouldn't be the best deck. |
| Tune-Up (1, basic) | 1 Might to all friends | unchanged | 7 | 70% of a common, on the line for a basic. |

### Over budget

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Breach Charge (1, common) | 5 damage, Micro Drone | **3 damage**, Micro Drone | 13.6 → 11.6 | A Swarm card you named (#356). Its "+" goes back to 6 damage (§4). |
| Plating (1, common) | 6 Barrier to all friends | **5** | 12.6 → 10.5 | |
| Sync Pulse (1, common) | heal 3 (companions +3 max HP), draw 1 | **heal 2** (+2 max HP), draw 1 | 12.9 → 9.6 | A heal you play every reshuffle. |
| Hardened Chassis (1, common) | 9 Barrier to the ally, draw 1 | **8** | 12 → 11 | |
| Heavy Plating (1, common Aura) | on summon: 5 Barrier to all friends | **3** | 2.4x → 1.6x over a fight | About one summon a turn in Swarm. |
| Weld Armor (1, uncommon) | ally +6 max HP, 6 Barrier | **+5 max HP, 5 Barrier** | 13.2 → 11 | |
| Bulwark Frame (1, uncommon) | 14 Barrier to the ally | **12** | 14 → 12 | |
| Rebuild (1, uncommon, Consume) | revive, 6 Barrier | **revive** only | ~23 → ~16 / 14 | The revived machine is most of the card. |
| Titan Forge (2, uncommon, Consume) | Enforcer, 2 Might to all friends | Enforcer (Heavy), **1 Might** | 36 → 28.2 / 26.6 | |
| Patch Job (0, uncommon) | ally +8 max HP, 3 Barrier | **ally +5 max HP** | 12.6 → 6 / 6.7 | Nearly twice a 0-cost card. |
| Self-Mending (1, uncommon Aura) | each turn: heal 2, companions +2 max HP | **2 Mana** | 1.76x → 0.93x | On top of Tinkerer's 1 a turn. |
| Drone Carrier (3, rare, Consume) | 3 Patrol Drones | **2 Mana** | (after the drone change) 32.4: −26% at 3 Mana → +9% at 2 | Needs 3 free slots now. |

### Under budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Ping (0, common, Consume) | companions 2 Primed | **you and your companions 3 Primed** | 3 → 7.5 |
| Tandem Strike (1, common) | 3 (+2 per card played) | **4 (+3 per card played)** | 7 → 10 (2 cards before it) |
| Crankshaft (1, common) | 4 (+1 per 4 max HP of your biggest companion) | **5 (+1 per 3)** | 7 → 9 at 12 HP; 11.6 at a 20-HP Colossal |
| Overcharge Blast (2, uncommon) | 8 (+2 per ally) to ALL | **9 (+3 per ally)** to ALL | 15.6 → 19.5 at 2 allies |
| Detonate (0, uncommon) | 10 to ALL, sacrifice | **12** to ALL | 4 → 6.6 (after the lost body) |
| Overwatch (1, uncommon Trap) | companions 3 Primed, 6 to the attacker | **4 Primed, 7** | 8.9 → 11 |
| Arc Relay (2, uncommon) | 6 to ALL, companions 3 Primed | **9 to ALL, you and your companions 4 Primed** | 12.3 → 21.7 |
| Echo Command (1, uncommon, Consume) | companions 5 Primed | **you and your companions 5 Primed, draw 1** | 7.5 → 15.5 / 14 |
| Siege Protocol (2, uncommon) | 6 (+2 per Might) | **8 (+3 per Might)** | 10 → 20 at 3 Might (Might counted once more on the hit) |
| Ion Lance (2, uncommon) | 16 | **20** | 16 → 20 |
| Salvage Rights (1, uncommon Aura) | an ally dies: draw 1 | dies **or is scrapped**: draw 1, **gain 2 Barrier** | ~6 → ~16 (3 a fight) |
| Scrapyard King (2, uncommon Aura) | an ally dies: 1 Might to all friends | dies **or is scrapped** | ~16 → ~24 |
| Swarm Tactics (1, rare Aura) | on summon: 3 to a random enemy | **6**, and **uncommon** | 0.4x → 1.1x (uncommon) |
| Hive Mind (2, rare Aura) | an ally dies: draw 1, Micro Drone | **1 Mana** | 0.6x → 1.15x |
| Double Time (2, rare) | companions 6 Primed | **1 Mana, you and your companions 6 Primed** | 9 → 15 / 12.5 |
| Perpetual Motion (2, rare Aura) | each turn: companions 2 Primed | **1 Mana, you and your companions** | 0.3x → 1x |
| Grand Assembly (2, rare, Consume) | 2 Might to all friends | **1 Mana** | 16 / 15.6 at 1 Mana |
| Chain Reaction (2, rare) | draw 2, companions 4 Primed | **1 Mana** | 13 / 12.5 at 1 Mana |
| Overclock Core (3, rare Aura) | each turn: 1 Might to all friends | **2 Mana** | ~20 a fight: 0.36x → 0.53x. Kept under on purpose: Might on a two-hit Colossal multiplies (§8). |
| Factory Floor (2, rare Aura) | on summon: draw 1 | **1 Mana, uncommon** | 0.24x → 0.8x |
| Relay Network (2, rare Aura) | a Trap springs: companions 3 Primed | **1 Mana, uncommon, you and your companions** | 0.24x → 1x (with the 5 Traps) |
| Railgun (3, rare) | 30 | **34** | 30 → 34 / 35 |
| Swarm Surge (2, rare, Consume) | Patrol Drone, draw 1 per ally | **no Consume** | 20 / 29.75 → 20 / 23.8 |

### Left as they are (on budget, or an engine piece that is fine under)

Spare Parts, Formation Strike, Strip for Parts, Jumpstart, Countermeasure Grid, Relay Strike, Repair Bot, Build Enforcer (the
companion changed), Retrofit (7.5 on a Light, 18 on a two-hit Colossal: Core's payoff), Armor Piercer, Static Field, Reinforced Frame,
Call Turret (companion changed), Parts Bin, Scrap Heap (+23%; the slots cap it), Drone Ambush, Assemble, Overdrive, Link Up,
Clockwork Trap, Surge Protocol, Reinforce, Upgrade Chip, Overcharge, Blueprint, Resonant Pulse (about +30%, left: it only feeds the
Tinkerer growth), Legion, Mass Production (it summons only into a free slot), EMP, Command Chip, Siege Engine (companion changed),
War Engine (companion changed), Reactor, Reactor Meltdown, Heavy Industry, Backup Core (it revives only into free slots),
The Foundry Awakens, Overclocked Legion, Heavy Hitter.

---

## 4. Upgrades past +50%

`plus()` raises every number on a card, so a card with several numbers gains too much. Each card here gets a hand-written "+" that
raises the one number that matters (guide §12).

| Card | Automatic "+" gains | Proposed "+" | Gain |
|---|---|---|---|
| Tune-Up | 2 Might to all friends (+100%) | **1 Might to all friends, draw 1** | +43% |
| Breach Charge | +3 damage, Micro Drone+ (+67%) | **6 damage**, Micro Drone | +26% |
| Jumpstart | +1 Primed, +3 Barrier (+55%) | **7 Barrier** | +39% |
| Overdrive | +1 Might to all, +1 Primed (+90%) | **companions 4 Primed** | +29% |
| Sync Pulse | +3 heal, +3 max HP, +1 card (+145%) | **draw 2** | +42% |
| Link Up | +3 Barrier to all, +1 card (+90%) | **6 Barrier to all friends** | +37% |
| Countermeasure Grid | +3 damage, +3 Barrier (+60%) | **8 damage** | +27% |
| Static Field | +3 to all, +1 Faltering to all (+100%) | **6 to ALL** | +46% |
| Armor Piercer | +3 damage, +1 Exposed (+67%) | **2 Exposed** | +33% |
| Hardened Chassis | +3 Barrier, +1 card (+64%) | **12 Barrier** | +36% |
| Reinforced Frame | +2 max HP, +1 card (+71%) | **+8 max HP** | +40% |
| Echo Command | +2 Primed, +1 card (+58%) | **7 Primed** | +32% |
| Heavy Plating | 6 Barrier to all on summon (+100%) | **4** | +33% |
| Heavy Industry | 7 Barrier to all a turn (+75%) | **6** | +50% |
| Self-Mending | heal 5 a turn (+150%) | **costs 1** | Aura cost cut |
| Resonant Pulse | heal 4 per Skill (+300%) | **Opening hand** | +3-4 |
| Salvage Rights | draw 2, 5 Barrier (+140%) | **costs 0** | Aura cost cut |
| Scrapyard King, Legion, Overclock Core | 2 Might per trigger (+100%) | **costs 1 less** | Aura cost cut |
| Hive Mind, Factory Floor | draw 2 per trigger (+100%) | **Opening hand** | +3-4 |

---

## 5. Retire 4

Each retires into its closest card (`retired.ts`), so old saves and decks keep working.

- **Nanoswarm** → Scrap Heap. Three Micro Drones for 1 Mana was twice its budget, and Scrap Heap and Drone Carrier already do the job.
- **Drone Uprising** (a shelved Legendary, now a rare) → Drone Carrier. Both summon three drones with Consume, and Drone Uprising's
  8-HP Drones were 1.7x its budget.
- **Overload** → Double Time. This leaves one big Primed card per rarity: Ping (common), Echo Command (uncommon) and Double Time
  (rare).
- **Mob Rule** → Overcharge Blast. Both were "damage to ALL plus more per ally", one rare and one uncommon.

---

## 6. New cards (10)

The theme: **the Engineer builds the machines, then fires through them.** Light drones are spent and scrapped. Heavy walkers and
Colossal war machines are built from their parts. The Engineer's own guns charge the machines (Primed), and a rare act now fires
everything at once. That is the bursty turn: shoot, Prime, act now.

### The Engineer's guns

| Card | Cost, type, rarity | Text | Points / budget |
|---|---|---|---|
| **Pulse Pistol** | 1, Attack, common | Deal 5 damage twice. | 10 − 1 (multi-hit with Might) = 9 / 10. Both shots spend your Primed, so Ping into Pulse Pistol is +6. "+": 6 twice. |
| **Arc Welder** | 1, Attack, common | Deal 7 damage. Your biggest companion gains 3 max HP. | 7 + 3.6 = 10.6 / 10. The Core path's gun. "+": 10 damage. |
| **Laser Grid** | 2, Attack, uncommon | Deal 8 damage to ALL enemies twice. | 8 x 2 x 1.3 − 1 = 19.8 / 21.3. "+": 9 twice. |
| **Particle Cannon** | 2, Attack, rare | Deal 8 damage, plus 6 for each companion slot filled. | 23 / 23.8 at 2.5 slots (26 with a full board). Fits Swarm and Core alike. "+": 11 base. |
| **Targeting Uplink** | 1, Aura, uncommon | Whenever you play an Attack: your companions each gain 2 Primed. | ~1.5 attacks a turn x 2 x 1.5 companions x 4 turns = ~18 (1.2x). Every shot charges the machines. "+": Opening hand. |

### Machines

| Card | Cost, type, rarity | Text | Points / budget |
|---|---|---|---|
| **Deploy Spotter** | 1, Summon, common | Summon Spotter Drone (Light, 4 HP). At the end of your turn it will: Apply 1 Exposed to the front enemy. | 4.8 + 3 + 3 = 10.8 / 10. It acts first, so the companions after it and your next turn's guns hit the Exposed enemy. |
| **Build Bulwark Walker** | 2, Summon, uncommon | Summon Bulwark Walker (Heavy, 12 HP, Taunt). At the end of your turn it will: You gain 3 Barrier. | 14.4 + 3 + 3.6 x 2 − 2 = 22.6 / 21.3 |
| **Scrap Golem** | 2, Summon, uncommon | Summon Scrap Golem (Colossal, 12 HP). At the end of your turn it will: Deal 5 damage. | 14.4 + 3 + 5 x 2 − 4 = 23.4 / 21.3. The cheap Colossal, and the reason to scrap your Light drones: Salvage makes it big. |
| **Dreadnought** | 3, Summon, rare | Summon Dreadnought (Colossal, 18 HP). At the end of your turn it will: Deal 5 damage to ALL enemies. | 21.6 + 3 + 6.5 x 2 − 4 = 33.6 / 35 |

### The burst

| Card | Cost, type, rarity | Text | Points / budget |
|---|---|---|---|
| **Full Salvo** | 2, Skill, rare | You and your companions gain 5 Primed. All your allies act now. | 5 (your next Attack) + 7.5 (companions) + ~8 (the act) = 20.5 / 23.8. On a War Engine the Primed lands twice. "+": 7 Primed. |

**Act now after this: 4 cards**, each with it once: Assemble (1, uncommon), Relay Strike (1, common), Command Chip (3, rare Aura) and
Full Salvo (2, rare). Today there are 3 (#361). Full Salvo is the one that pairs with Primed. The rest of the Primed cards charge
up, and act now spends it.

**Engine pieces they need:** the frames and the Salvage (§1), the `slots` metric (Particle Cannon) and the `biggestAlly` selector
(Arc Welder). Targeting Uplink uses the existing `play` trigger with `filter: 'attack'`. The Spotter Drone's Exposed uses an
ally act op that already exists, `status('exposed', 1, 'target')`.

---

## 7. Rarity spread

| Class | Cards | Common | Uncommon | Rare | Rare share |
|---|---|---|---|---|---|
| Knight | 74 | 18 | 32 | 23 | 31% |
| Assassin | 78 | 18 | 33 | 25 | 32% |
| Spellblade | 74 | 20 | 32 | 21 | 28% |
| Necromancer | 80 | 17 | 36 | 25 | 31% |
| Shaman | 78 | 20 | 33 | 23 | 29% |
| **Engineer now** | 80 | 20 | 30 | **28** | **35%** |
| **Engineer after** | 86 | 23 | 36 | 25 | 30% |

(Cards include the 2 basics; the rarity columns leave them out.) How it gets there: three rares are retired (Drone Uprising, Overload, Mob Rule) and one
uncommon (Nanoswarm). Swarm Tactics, Factory Floor and Relay Network move from rare to uncommon. The new cards add 3 commons, 4
uncommons and 3 rares.

## 8. Frames across the pool

| | Light (1 slot) | Heavy (2 slots) | Colossal (3 slots) |
|---|---|---|---|
| Companions | 6 | 3 | 3 |
| Cards that summon one | Deploy Drone, Spare Parts, Breach Charge, Parts Bin, Scrap Heap, Repair Bot, Call Turret, Drone Ambush, Deploy Spotter, Swarm Surge, Drone Carrier, Mass Production, Hive Mind, Blueprint (random) | Build Enforcer, Titan Forge, Build Bulwark Walker, Siege Engine, The Foundry Awakens | Scrap Golem, War Engine, Dreadnought |

## 9. Totals

| | Now | After |
|---|---|---|
| Engineer cards (own pool, basics included) | 80 | **86** (80 − 4 retired + 10 new) |
| Companions | 8 (all one slot) | **12**: 6 Light, 3 Heavy, 3 Colossal |
| The Engineer's own Attacks | 14 | 17 (4 new guns; Mob Rule retired) |
| Act now cards | 3 | 4 |
| Traps | 5 | 5 |

---

## 10. Questions for Robert

1. **Salvage on the trait.** Should scrapping into a bigger machine pass on Might, Primed and half the HP? I recommend yes: without it,
   the frames are only a limit. The other choice is plain frames, where scrapping gives nothing.
2. **Colossal and act now.** On a War Engine, Full Salvo is a big turn: about 38 from the machine after two setup cards. I think that
   is the fantasy you asked for. Say if you want it smaller (Full Salvo at 4 Primed).
3. **The starter.** Should one Strike become a Pulse Pistol, so the Engineer's own gun shows up from the first fight? It would cost a
   basic slot: Pulse Pistol is 9 points against a Strike's 6. I lean no and would keep the starter as it is.
4. **Frame pips.** I propose 1-3 pips on the companion and the card. An alternative is a larger body sprite for Heavy and Colossal
   machines (art later, as agreed).

---

## 11. Utility added after the review (DECISIONS #384)

Robert asked what utility the class had: its draw was fine (about ten cards draw 1, plus Chain Reaction, Swarm Surge and three draw
Auras), but Mana was only Overcharge and nothing chose a card. He took three of the suggestions, with the Mana engine made "different
somehow" from the other classes' Auras: it is a machine.

| Card | Cost, type, rarity | Text | Points / budget |
|---|---|---|---|
| **Battery Pack** | 0, Skill, common | Gain 1 Mana. Consume. | Marsh Light's shape (Necromancer common). "+": also draw 1. |
| **Schematics** | 0, Skill, uncommon | Choose a card in your draw pile and put it on top. Draw 1 card. Consume. | a chosen card ~5 (+25% Consume) / 6.7. "+": draw 2. |
| **Build Generator** | 2, Summon, rare | Summon Generator (Light, 8 HP). At the end of your turn it will: next turn, gain 1 extra Mana. | 9.6 + 3 + 4 x ~2.5 acts = 22.6 / 23.8 |

The Generator is the trade-off the frames make interesting: it takes a slot, it can be struck down (it stands behind the machines
summoned before it), it can't stand beside a Colossal, and an act now makes it produce again.
