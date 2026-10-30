# Engineer: card cost analysis (2026-10-29)

Hand-priced against `docs/14_CARD_COSTING.md`, live data 0.128.0. The Engineer starts each fight with a Drone (6 HP, hits 3); her
trait Tinkerer heals 1 and gives her companions 1 max HP each turn, and Salvage hands scrapped machines' Might, Primed and half their
HP to the machine built in their place. Three companion slots (Light 1, Heavy 2, Colossal 3). 89 cards. Suggestions only; nothing
was changed.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall** | **C** | 64% on budget (one point short of B's 65%) but 8 broken or dead cards (B allows 2). The paths themselves are sound. |
| Power level | **fair** | mean -2%, median 0%. Swarm a little over (+2%), Core a little under (-5%). |
| Consistency | **C** | spread 23 points. The base cards are tidy (Assemble: 20 of 26 on budget); the misses are six dead build-around cards, and **16 upgrades past +50%** (mean upgraded deviation +38%, the highest of the three). |

| Measure | Value |
|---|---|
| Cards priced | 89 |
| On budget (within ±15%) | 57 (64%) |
| Strong (+15% to +40%) | 13 |
| Broken (over +40%) | 2 |
| Weak (-15% to -40%) | 11 |
| Dead (under -40%) | 6 |
| Mean deviation (power) | -2% |
| Median deviation | +0% |
| Spread (standard deviation of dev %) | 23 points |
| Mean absolute deviation | 17 points |
| Conditional cards | 11 |
| Upgrades past +50% of the card's points | 16: Deploy Drone, Spare Parts, Call Turret, Strip for Parts, Parts Bin, Scrap Heap, Swarm Tactics, Drone Carrier, Drone Ambush, Repair Bot, Build Enforcer, Reactor Meltdown, Titan Forge, Plating, Schematics, Self-Mending |
| Upgrades that cut the cost | 6: Mass Production, EMP, Command Chip, Overclock Core, Backup Core, Scrapyard King |
| Mean upgraded deviation | +38% |

| Build path | Cards | Mean dev | On budget | Strong | Broken | Weak | Dead |
|---|---|---|---|---|---|---|---|
| Swarm | 21 | +2% | 11 | 5 | 1 | 3 | 1 |
| Assemble | 26 | -1% | 20 | 4 | 0 | 0 | 2 |
| Core | 27 | -5% | 20 | 2 | 0 | 3 | 2 |
| shared | 15 | -5% | 6 | 2 | 1 | 5 | 1 |

## Starter deck

5 Strike, 3 Defend, Deploy Drone, Tune-Up, plus the free Drone. Baseline for a starter: about **18 points a turn, ~10 damage and
~7 Barrier**.

| Turn | Damage | Barrier | Notes |
|---|---|---|---|
| 1 | ~12 (1.5 Strikes 9 + the Drone 3) | ~4.5, plus the Drone's 6 HP in front | Deploy Drone or Tune-Up is in the hand half the time. |
| 2 | ~15 (a second drone, +1 Might on everyone after Tune-Up) | ~4.5, plus 7-11 HP of drones | |
| 3 | ~16 | ~4.5, plus drones | the drones' max HP grows 1 a turn (trait). |

About **14 damage and 4.5 Barrier a turn, with 6-11 HP of companions taking the first single-target hit**. Damage is over the
baseline, Barrier under, and the drone screen makes up most of the gap against single hits (overflow carries on to her, and AoE
skips it). Deploy Drone is a hot basic (+35% against the 80% basic budget; it is a full common's worth), Tune-Up on budget (0%).

## Build paths

- **Swarm (21 cards, mean +2%).** The cheap summons are on budget or over (Deploy Drone +35%, Scrap Heap +23%, Breach Charge
  +16%, Spare Parts +15%) and the summon-trigger Auras get the ~0.9 summons a turn they need, which is why Heavy Plating (+75%) and
  Swarm Tactics (+29%) score high. Its weak end is the sacrifice package: Strip for Parts (-50%) and Reactor Meltdown (-68%, Core)
  give back about what the sacrificed body was worth, so they are only good on a body about to die, and Hive Mind / Scrapyard King
  / Salvage Rights are priced on ~0.6 deaths a turn. The 3-slot cap limits it: Drone Carrier fills the board in one card.
- **Assemble (26 cards, mean -1%, 20 on budget).** The cleanest path in the three reports. Primed and "allies act" cards price
  exactly on the §10 rates. Relay Strike (+40%) is the strong common; EMP (-44%) and Command Chip (-60%) are the dead rares.
- **Core (27 cards, mean -5%).** The big machines are the guide's own reference companions and sit on budget (Siege Engine +7%,
  War Engine +6%, Dreadnought -4%, Enforcer +6%). Support is fine (Reinforce, Upgrade Chip, Weld Armor, Bulwark Frame). Payoffs
  that read the machine are weak (Heavy Hitter -24%, Siege Protocol -34%, Backup Core -53%). The Foundry Awakens (+39%) is the
  strong rare.
- **Shared (15 cards, mean -5%).** Overcharge (+49%) is broken; Blueprint (-55%) dead; Schematics, Static Field, Build Generator,
  Factory Floor, Swarm Surge weak.

**Upgrades are the class's main balance problem.** `plus()` raises a companion's HP *and* its hit, and some cards also gain a
second number, so most summon upgrades are +60% to +120% of the card: Deploy Drone+ (4 -> 8 HP, 3 -> 5: +63%), Spare Parts+
(+79%), Parts Bin+ (+93%), Scrap Heap+ (+79%), Call Turret+ (+69%), Repair Bot+ (+72%), Drone Carrier+ (+63%). Build Enforcer+ and
Titan Forge+ cross 12 HP, which buys a whole second act (+73% / +81%).

**Bosses.** Companions are Barrier only against single-target hits; a front-loaded Warden hit (20-30) kills a drone and the
overflow lands on her. Swarm's AoE premium (Overcharge Blast, Detonate, Laser Grid, Drone Ambush) is wasted on a lone boss. Core is
the boss path: a Colossal with Heavy Industry / Self-Mending in front, single-target finishers (Railgun 34, Ion Lance 20, Heavy
Hitter), and the ramp Auras (Overclock Core, Mass Production, Perpetual Motion) that the 4-turn window underprices pay for 10-20
turns. Assemble scales with the pack it has; against a boss it needs Core's bodies.

## Biggest outliers and suggested fixes

| Card | Dev | Problem | Suggested fix |
|---|---|---|---|
| Heavy Plating (1, C, Aura) | +75% | 3 Barrier to every friend on each summon, in the path that summons most turns | 2 Barrier (+16%), upgrade to 3 |
| Reactor Meltdown (0, R) | -68% | AoE equal to the target's HP, but the sacrifice costs about as much as it gives | twice the target's HP to ALL (~8 on an 8-HP body: -13%) |
| Command Chip (3, R, Aura) | -60% | "allies act" on each Summon card is ~0.7 a turn; 3 Mana for ~22 points | cost 1 (+12%); the upgrade gives Opening hand |
| Blueprint (1, U) | -55% | a random Summon at full cost is a weak draw | the Summon costs 0 this turn (~9, -20%), or cost 0 |
| Backup Core (2, R, Aura) | -53% | a half-HP return on ~1.5 deaths in a regular fight | cost 1 (the upgrade's: -10%); the upgrade returns it with all its HP |
| Strip for Parts (0, C) | -50% | Barrier equal to HP trades one HP-point of Barrier for another and loses the body | Barrier equal to twice the target's HP (on budget) |
| Overcharge (0, U) | +49% | +2 Mana now for -1 next turn, at 0 | lose 2 Mana next turn (a pure tempo shift: -11%) |
| EMP (1, R, Trap) | -44% | a 1-turn Stun is ~7 points | cost 0 (the upgrade's: -7%), upgrade stuns 2 turns |
| Relay Strike (1, C) | +40% | 6 damage and "all allies act" on a common | 6 -> 3 damage (+10%), upgrade +3 |
| Summon upgrades (Deploy Drone, Spare Parts, Parts Bin, Scrap Heap, Call Turret, Repair Bot, Drone Carrier, Build Enforcer, Titan Forge) | gain +63% to +93% | `plus()` raises HP and hit (and the draw on Parts Bin) | hand-write each `up` to raise one number: HP +3, or the hit +1 |

## Method

Every card is priced by hand against `docs/14_CARD_COSTING.md` §1-§12 and the legacy rates in §14 (the §15 Monk rates are reverted,
DECISIONS #428, and are not used). Live text comes from `COMBAT_DB` (`cardText`); 0.128.0 data.

- **Budget** = §1 cost budget (0: 6, 1: 10, 2: 19, 3: 28) x rarity (common 1.0, uncommon 1.12, rare 1.25; a basic class card
  0.8, the middle of §1's 70-90%). Strike and Defend are Neutral and not in the table.
- **Consume** raises the budget by 25% (§6), except on a 0-cost card whose job is Mana: there Consume is the price (§6), so the
  budget is the plain 0-cost budget (mode `m`). For reference, the guide's own Draw Blood scores +58% this way, so a 0-cost
  Mana card near +50% is "Draw Blood level", not a new outlier.
- **Auras** (§7): the 4-turn total against 1.5x the cost budget (uncommon), 2x (rare). §7 gives no common rate: **1.3x** is used
  (derived: it sits where 1.5x / 1.12 and 2x / 1.25 put a common). An Aura whose whole effect happens once (gain N Might or Bracing
  for the fight) is priced as a card, as the guide prices Steel Resolve.
- **X cards** at X = 3, against 3 x 7 points (the §2 X rate at uncommon), scaled by rarity.
- **Traps** (§11): the effect x the spring factor (attacked 0.85, foeTurn 0.9, 5+ HP lost 0.7).
- **Conditional** cards (marked *cond.*) are priced at the expected value in a deck of their build path (§6: 60-70%).
- **Upgrade gain** = the "+" card's points over the base card's (§12: about +30%, at most +50%). **Upgrade dev %** = the "+" card
  against the budget at its own cost (so a cost cut shows up there).
- Verdicts: on budget within ±15%, strong +15% to +40%, broken over +40%, weak -15% to -40%, dead under -40%.

**Rates worked out here (no rate in the guide):**

| Thing | Rate | Why |
|---|---|---|
| Enter Fury / Enter Serene (Monk) | **6** | §5's 4, plus the trait's 1 Fervor (2) for a stance actually entered. Entering the stance you are in does nothing (engine `enterStance`). |
| "Leave your stance" | **3.5** | §5's "leaving Serene on a card"; leaving Fury gives the trait's 2 Primed (~2) and stops the 50% extra damage. |
| A Fury entered and left on the same card (Shifting Guard, Thread-Cutter) | **4** | the Fervor (2) and the 2 Primed of leaving it (2); the doubling is never used. |
| "+N per Fury" | **N x 0.65** | in Fury about two plays in three in a Fury deck. The doubling of the card's own damage is Fury's value and is not counted again. |
| Lifesteal 50% | **0.6 a damage point** | heal at 1.5 a HP on half the damage, x0.8 for Barrier soak and overheal. |
| Holdfast (hold the whole hand one turn) | **~6 a stack** | about 1.7 cards kept, each an extra draw next turn (3.5). |
| Cadence (gain 1 Might at the end of each turn) | **~17** | four Might in the four-turn window, at 6 x 0.8. |
| Unbound (skills cost 0, are consumed) | **~7 a turn** | ~1.4 Mana of skills a turn in a Hunter deck, less the skills lost. |
| A stack gained by an Aura's trigger or each turn, for the rest of the fight (Might) | **the stack rate x 0.8** | a later stack has fewer turns left (the guide prices Warm Anvil's Sharpen at its early rate; 0.8 splits early and late). |
| Hero Might for the Hunter / Might to all friends for the Engineer | **6 / 8** a stack | §10 (Pack Instinct, Tune-Up). |
| "+N per card played this turn" | **~1.5 cards** before it (**~2** in a Predator deck) | the guide has no usual X for it; the card is usually the 2nd or 3rd played. |
| Companions in play | **~1.3** (Hunter), **~1.7** (Engineer) | the Hound alone, then a summon; the Engineer starts with a Drone and summons more. |
| Companion acts | 1 + 1 per **full** 12 HP | §10's table rounds down (Enforcer 11 HP acts once, Pack Alpha 12 HP twice). |

**A bias to keep in mind:** the 4-turn window prices ramping Auras (Might a turn, Fervor engines, Ancient Fury, Overclock Core) for
a regular fight. Wardens last 10-20 turns (BALANCE.md), where those cards are worth two to three times their score. They are
flagged in the boss notes rather than repriced.

## Full table

| Card | Cost | Rarity | Path | Text | Price | Budget | Dev % | Verdict | Upgrade | Upg. gain | Upg. dev % | How it was priced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Deploy Drone | 1 | basic | shared | Summon Patrol Drone (4 HP). At the end of your turn it will: Deal 3 damage. | 10.8 | 8 | +35% | strong | 17.6 | +63% (too big) | +120% | Patrol Drone 4 HP 4.8 + body 3 + hit 3 x 1 act; the upgrade doubles HP and nearly doubles the hit |
| Tune-Up | 1 | basic | shared | Apply 1 Might to all friends. | 8 | 8 | +0% | on budget | 11 | +38% | +38% | Might to all friends 8 a stack |
| Spare Parts | 0 | common | Swarm | Summon Micro Drone (3 HP). At the end of your turn it will: Deal 2 damage. Consume. | 8.6 | 7.5 | +15% | on budget | 15.4 | +79% (too big) | +105% | Micro Drone 3 HP: 3.6 + 3 + 2 |
| Formation Strike | 1 | common | Swarm | Deal 2 (+4 per ally) damage. | 8.8 | 10 | -12% | on budget | 11.8 | +34% | +18% | 2 + 4 x ~1.7 allies |
| Call Turret | 1 | uncommon | Swarm | Summon Sentry Turret (5 HP, Taunt). At the end of your turn it will: Deal 2 damage. Gain 2 Barrier to your hero. | 13.4 | 11.2 | +20% | strong | 22.6 | +69% (too big) | +102% | Turret 5 HP Taunt: 6 + 3 + 2 + 2 Barrier to hero 2.4 |
| Strip for Parts *(cond.)* | 0 | common | Swarm | Gain Barrier equal to the target's HP. Draw 1 card. Sacrifice the chosen ally. | 3 | 6 | -50% | dead | 7.6 | +153% (too big) | +27% | Barrier = HP (~5) 6 + draw 3 - sacrifice (1.2 x 5 + 3) 9 = 0; +~3 expected from death payoffs |
| Overcharge Blast | 2 | uncommon | Swarm | Deal 9 (+3 per ally) damage to ALL enemies. | 18.3 | 21.3 | -14% | on budget | 22.2 | +21% | +4% | (9 + 3 x 1.7) x 1.3 |
| Legion | 2 | rare, Aura | Swarm | Whenever you summon an ally: Apply 1 Might to all friends. | 23 | 38 | -39% | weak | 26.5 | +15% | -30% | 1 Might to all (8 x 0.8 ramp) x 0.9 summons a turn x 4 |
| Parts Bin | 1 | uncommon | Swarm | Summon Micro Drone (3 HP). At the end of your turn it will: Deal 2 damage. Draw 1 card. | 11.6 | 11.2 | +4% | on budget | 22.4 | +93% (too big) | +100% | Micro Drone 8.6 + draw 3 |
| Scrap Heap | 1 | uncommon | Swarm | Summon 2 Micro Drones (3 HP each). At the end of your turn each will: Deal 2 damage. Consume. | 17.2 | 14 | +23% | strong | 30.8 | +79% (too big) | +120% | 2 Micro Drones |
| Swarm Tactics | 1 | uncommon, Aura | Swarm | Whenever you summon an ally: Deal 6 damage to a random enemy. | 19.4 | 15 | +29% | strong | 29.2 | +51% (too big) | +95% | 6 random 5.4 x 0.9 summons x 4 |
| Detonate | 0 | uncommon | Swarm | Deal 12 damage to ALL enemies. Sacrifice the chosen ally. | 7.8 | 6.7 | +16% | strong | 11.7 | +50% | +74% | 12 AoE 15.6 - sacrifice a drone (~4 HP) 7.8 |
| Hive Mind *(cond.)* | 1 | rare, Aura | Swarm | Whenever one of your allies dies: Draw 1 card. Summon Micro Drone (3 HP). At the end of your turn it will: Deal 2 damage. | 17.4 | 20 | -13% | on budget | 20.9 | +20% | +4% | (draw 3 + Micro Drone 8.6) x ~1.5 deaths in four turns |
| Mass Production | 3 | rare, Aura | Swarm | At the start of your turn: Summon Patrol Drone (4 HP). At the end of your turn it will: Deal 3 damage. | 43.2 | 56 | -23% | weak | 43.2 (cost 2) | +0% | +14% | Patrol Drone 10.8 a turn x 4 (slot cap and deaths make room); upgrade cuts the cost to 2 |
| Drone Carrier | 2 | rare | Swarm | Summon 3 Patrol Drones (4 HP each). At the end of your turn each will: Deal 3 damage. Consume. | 32.4 | 29.7 | +9% | on budget | 52.8 | +63% (too big) | +78% | 3 Patrol Drones (fills all 3 slots) |
| Breach Charge | 1 | common | Swarm | Deal 3 damage. Summon Micro Drone (3 HP). At the end of your turn it will: Deal 2 damage. | 11.6 | 10 | +16% | strong | 14.6 | +26% | +46% | 3 + Micro Drone 8.6 |
| Drone Ambush | 1 | uncommon, Trap | Swarm | At the start of the enemy turn: Deal 4 damage to ALL enemies. Summon Micro Drone (3 HP). At the end of your turn it will: Deal 2 damage. | 12.4 | 11.2 | +11% | on budget | 22 | +77% (too big) | +96% | Trap foeTurn x0.9: (4 AoE 5.2 + Micro Drone 8.6) |
| Deploy Spotter | 1 | common | Swarm | Summon Spotter Drone (4 HP). At the end of your turn it will: Apply 1 Exposed. | 10.8 | 10 | +8% | on budget | 15.6 | +44% | +56% | Spotter 4 HP: 4.8 + 3 + 1 Exposed 3 |
| Ping | 0 | common | Assemble | Apply 3 Primed to all friends. Consume. | 7.5 | 7.5 | +0% | on budget | 10 | +33% | +33% | Primed to all friends 2.5 a stack |
| Jumpstart | 1 | common | Assemble | Each of your companions gains 3 Primed. Gain 4 Barrier. | 9.3 | 10 | -7% | on budget | 12.9 | +39% | +29% | companions 3 Primed (1.5 a stack) + 4 Barrier 4.8 |
| Countermeasure Grid | 1 | common, Trap | Assemble | When you or an ally is attacked: Deal 5 damage to the attacker. Gain 5 Barrier. | 9.4 | 10 | -7% | on budget | 11.9 | +27% | +19% | Trap attacked x0.85: (5 + 5 Barrier 6) |
| Assemble | 1 | uncommon | Assemble | All your allies act now. Draw 1 card. | 11 | 11.2 | -2% | on budget | 15 | +36% | +34% | all allies act ~8 + draw 3 |
| Double Time | 1 | rare | Assemble | Apply 6 Primed to all friends. | 15 | 12.5 | +20% | strong | 20 | +33% | +60% | 6 Primed to all 2.5 a stack |
| Overdrive | 1 | uncommon | Assemble | Apply 1 Might to all friends. Each of your companions gains 2 Primed. | 11 | 11.2 | -2% | on budget | 14 | +27% | +25% | Might to all 8 + companions 2 Primed 3 |
| EMP | 1 | rare, Trap | Assemble | When you or an ally is attacked: Stun the attacker for 1 turn. | 7 | 12.5 | -44% | dead | 7 (cost 0) | +0% | -7% | Trap x0.85: Stunned ~7 (+ the hit it shrinks) ~7; upgrade cuts the cost to 0 |
| Perpetual Motion | 1 | rare, Aura | Assemble | At the start of your turn: Apply 2 Primed to all friends. | 20 | 20 | +0% | on budget | 30 | +50% | +50% | 2 Primed to all 5 x 4 |
| Relay Strike | 1 | common | Assemble | Deal 6 damage. All your allies act now. | 14 | 10 | +40% | strong | 17 | +21% | +70% | 6 + all allies act ~8 |
| Overwatch | 1 | uncommon, Trap | Assemble | When you or an ally is attacked: Each of your companions gains 4 Primed. Deal 7 damage to the attacker. | 11 | 11.2 | -2% | on budget | 14.9 | +35% | +33% | Trap x0.85: (companions 4 Primed 6 + 7) |
| Grand Assembly | 1 | rare | Assemble | Apply 2 Might to all friends. Consume. | 16 | 15.6 | +2% | on budget | 24 | +50% | +54% | 2 Might to all 16 |
| Link Up | 1 | uncommon | Assemble | Gain 4 Barrier to all friends. Draw 1 card. | 11.4 | 11.2 | +2% | on budget | 15.6 | +37% | +39% | 4 Barrier to all friends 2.1 a point + draw 3 |
| Chain Reaction | 1 | rare | Assemble | Draw 2 cards. Each of your companions gains 4 Primed. | 13 | 12.5 | +4% | on budget | 18.5 | +42% | +48% | draw 2 alone 7 + companions 4 Primed 6 |
| Command Chip | 3 | rare, Aura | Assemble | Whenever you play a Summon: All your allies act now. | 22.4 | 56 | -60% | dead | 22.4 (cost 2) | +0% | -41% | all allies act ~8 x 0.7 Summon cards a turn x 4; upgrade cuts the cost to 2 |
| Tandem Strike | 1 | common | Assemble | Deal 4 (+3 per card played this turn) damage. | 8.5 | 10 | -15% | on budget | 11.5 | +35% | +15% | 4 + 3 x ~1.5 cards played before it |
| Arc Relay | 2 | uncommon | Assemble | Deal 9 damage to ALL enemies. Apply 4 Primed to all friends. | 21.7 | 21.3 | +2% | on budget | 28.1 | +29% | +32% | 9 AoE 11.7 + 4 Primed to all 10 |
| Clockwork Trap | 1 | uncommon, Trap | Assemble | When you lose 5+ HP at once: Each of your companions gains 3 Primed. Gain 8 Barrier. | 9.9 | 11.2 | -12% | on budget | 13.4 | +35% | +20% | Trap hpLost x0.7: (companions 3 Primed 4.5 + 8 Barrier 9.6) |
| Surge Protocol | X | uncommon | Assemble | Apply Might equal to the Mana spent to all friends. | 24 | 21 | +14% | on budget | 32 | +33% | +52% | 1 Might to all (8) a Mana at X = 3 |
| Pulse Pistol | 1 | common | Assemble | Deal 5 damage 2 times. | 11 | 10 | +10% | on budget | 13 | +18% | +30% | 5x2 + ~1 for Might on the extra hit |
| Laser Grid | 2 | uncommon | Assemble | Deal 8 damage 2 times to ALL enemies. | 21.8 | 21.3 | +2% | on budget | 24.4 | +12% | +15% | 8x2 AoE 20.8 + ~1 Might on the extra hit |
| Targeting Uplink | 1 | uncommon, Aura | Assemble | Whenever you play an Attack: Each of your companions gains 2 Primed. | 18 | 15 | +20% | strong | 21.5 | +19% | +43% | companions 2 Primed 3 x ~1.5 Attacks a turn x 4 |
| Full Salvo | 2 | rare | Assemble | Apply 5 Primed to all friends. All your allies act now. | 20.5 | 23.8 | -14% | on budget | 25.5 | +24% | +7% | 5 Primed to all 12.5 + all allies act ~8 |
| Repair Bot | 1 | common | Swarm | Summon Repair Bot (4 HP). At the end of your turn it will: Heal 2 to your hero. | 10.8 | 10 | +8% | on budget | 18.6 | +72% (too big) | +86% | Repair Bot 4 HP: 4.8 + 3 + heal 2 3 |
| Build Enforcer | 2 | common | Core | Summon Enforcer Mk.II (Heavy: 2 slots, 11 HP). At the end of your turn it will: Deal 6 damage. | 20.2 | 19 | +6% | on budget | 35 | +73% (too big) | +84% | Enforcer (guide 20.2); the upgrade to 15 HP crosses 12 HP: a second act (+73%) |
| Reinforce | 1 | uncommon | Core | Gain 8 Barrier to the ally. Apply 2 Might to the ally. | 13 | 11.2 | +16% | strong | 18.5 | +42% | +65% | 8 Barrier on one ally 8 + 2 Might on one ally 5 |
| Upgrade Chip | 1 | uncommon | Core | Apply 2 Might to the ally. The ally gains 6 max HP. | 12.2 | 11.2 | +9% | on budget | 17.1 | +40% | +53% | 2 Might on one ally 5 + 6 max HP on one ally 7.2 |
| Siege Engine | 2 | rare | Core | Summon Siege Engine (Heavy: 2 slots, 12 HP). At the end of your turn it will: Deal 3 damage 2 times. | 25.4 | 23.8 | +7% | on budget | 34.2 | +35% | +44% | guide 25.4 |
| War Engine | 3 | rare | Core | Summon War Engine (Colossal: 3 slots, 20 HP). At the end of your turn it will: Deal 4 damage 2 times. | 37 | 35 | +6% | on budget | 54.8 | +48% | +57% | guide 37; upgrade 24 HP = a third act |
| Reactor | 2 | rare, Aura (one-shot) | Swarm | Apply 3 Might to all friends for the rest of the fight. | 24 | 23.8 | +1% | on budget | 32 | +33% | +35% | 3 Might to all friends for the fight (one-shot: card budget, cf. Steel Resolve) |
| Overclock Core | 2 | rare, Aura | Core | At the start of your turn: Apply 1 Might to all friends. | 25.6 | 38 | -33% | weak | 25.6 (cost 1) | +0% | +28% | 1 Might to all a turn: 4 x 8 x 0.8 ramp; upgrade cuts the cost to 1 |
| Weld Armor | 1 | uncommon | Core | The ally gains 5 max HP. Gain 5 Barrier to the ally. | 11 | 11.2 | -2% | on budget | 16.4 | +49% | +46% | 5 max HP on one ally 6 + 5 Barrier on it 5 |
| Heavy Plating | 1 | common, Aura | Swarm | Whenever you summon an ally: Gain 3 Barrier to all friends. | 22.7 | 13 | +75% | broken | 30.2 | +33% | +132% | 3 Barrier to all friends 6.3 x 0.9 summons a turn x 4 (Swarm deck) |
| Retrofit *(cond.)* | 1 | common | Core | Apply 3 Might to the ally. | 11.3 | 10 | +13% | on budget | 15 | +33% | +50% | 3 Might on one ally: 7.5, or 15 on a machine that strikes twice; half the Core deck's targets |
| Bulwark Frame | 1 | uncommon | Core | Gain 12 Barrier to the ally. | 12 | 11.2 | +7% | on budget | 15 | +25% | +34% | 12 Barrier on one companion 1.0 a point |
| Reactor Meltdown *(cond.)* | 0 | rare | Core | Deal damage equal to the target's HP to ALL enemies. Sacrifice the chosen ally. Consume. | 3 | 9.4 | -68% | dead | 6.9 | +130% (too big) | -26% | AoE = target HP x 1.3 - sacrifice (1.2 HP + 3): about even; ~3 on a machine about to fall |
| Rebuild *(cond.)* | 1 | uncommon | Core | Your most recently fallen ally returns with half its HP. Gain 3 Barrier. Consume. | 16 | 14 | +14% | on budget | 19.6 | +23% | +40% | half-HP return: a drone ~10.8, a Colossal ~25; + 3 Barrier 3.6 |
| Heavy Industry | 2 | rare, Aura | Core | At the start of your turn: Gain 4 Barrier to all friends. | 33.6 | 38 | -12% | on budget | 50.4 | +50% | +33% | 4 Barrier to all friends 8.4 x 4 |
| Armor Piercer | 1 | common | Core | Deal 6 damage. Apply 1 Exposed. | 9 | 10 | -10% | on budget | 12 | +33% | +20% | 6 + 1 Exposed 3 |
| Siege Protocol *(cond.)* | 2 | uncommon | Core | Deal 10 (+2 per Might) damage. | 14 | 21.3 | -34% | weak | 17 | +21% | -20% | 10 + 2 x ~2 hero Might mid-fight |
| Titan Forge | 2 | uncommon | Core | Summon Enforcer Mk.II (Heavy: 2 slots, 11 HP). At the end of your turn it will: Deal 6 damage. Apply 1 Might to all friends. Consume. | 28.2 | 26.6 | +6% | on budget | 51 | +81% (too big) | +92% | Enforcer 20.2 + its act also gives 1 Might to all (8) x 1 act; the upgrade gets 2 acts |
| Backup Core *(cond.)* | 2 | rare, Aura | Core | The first time each turn one of your allies dies: Your most recently fallen ally returns with half its HP. | 18 | 38 | -53% | dead | 18 (cost 1) | +0% | -10% | a half-HP return on ~1.5 deaths in four turns (~12 each in a Core deck); upgrade cuts the cost to 1 |
| Build Bulwark Walker | 2 | uncommon | Core | Summon Bulwark Walker (Heavy: 2 slots, 12 HP, Taunt). At the end of your turn it will: Gain 3 Barrier to your hero. | 22.6 | 21.3 | +6% | on budget | 32.2 | +42% | +51% | 12 HP Taunt 14.4 + 3 + 3 Barrier to hero x 2 acts - Heavy 2 |
| Scrap Golem | 2 | uncommon | Core | Summon Scrap Golem (Colossal: 3 slots, 12 HP). At the end of your turn it will: Deal 5 damage. | 23.4 | 21.3 | +10% | on budget | 32.2 | +38% | +51% | 12 HP 14.4 + 3 + 5 x 2 acts - Colossal 4 |
| Dreadnought | 3 | rare | Core | Summon Dreadnought (Colossal: 3 slots, 18 HP). At the end of your turn it will: Deal 5 damage to ALL enemies. | 33.6 | 35 | -4% | on budget | 43.6 | +30% | +25% | guide 33.6 |
| Arc Welder | 1 | common | Core | Deal 7 damage. Your biggest companion gains 3 max HP. | 10.6 | 10 | +6% | on budget | 13.6 | +28% | +36% | 7 + 3 max HP on one ally 3.6 |
| Static Field | 1 | common | shared | Deal 3 damage to ALL enemies. Apply 1 Faltering to ALL enemies. | 8.4 | 10 | -16% | weak | 12.3 | +46% | +23% | 3 AoE 3.9 + 1 Faltering to ALL 4.5 |
| Plating | 1 | common | shared | Gain 5 Barrier to all friends. | 10.5 | 10 | +5% | on budget | 16.8 | +60% (too big) | +68% | 5 Barrier to all friends 2.1 a point |
| Ion Lance | 2 | uncommon | shared | Deal 20 damage. | 20 | 21.3 | -6% | on budget | 23 | +15% | +8% | 20 |
| Railgun | 3 | rare | shared | Deal 34 damage. | 34 | 35 | -3% | on budget | 37 | +9% | +6% | 34 |
| Particle Cannon | 2 | rare | shared | Deal 8 (+6 per companion slot filled) damage. | 21.2 | 23.8 | -11% | on budget | 24.2 | +14% | +2% | 8 + 6 x ~2.2 slots filled |
| The Foundry Awakens | 3 | rare, Aura | Core | At the start of your turn: Each of your companions gains 3 Primed. Summon Siege Engine (Heavy: 2 slots, 12 HP). At the end of your turn it will: Deal 3 damage 2 times. | 78 | 56 | +39% | strong | 90 | +15% | +61% | Siege Engine 25.4 + Primed 4.5 the first turn, then ~16 a turn (a fresh Siege by Salvage + Primed on a twice-striking machine) |
| Overclocked Legion | 2 | rare, Aura | Assemble | Apply 2 Might to all friends. At the start of your turn: Each of your companions gains 3 Primed. | 34 | 38 | -11% | on budget | 42 | +24% | +11% | 2 Might to all 16 + companions 3 Primed 4.5 x 4 |
| Overcharge | 0 | uncommon | shared | Gain 2 Mana. Next turn, lose 1 Mana. Consume. | 10 | 6.7 | +49% | broken | 11 | +10% | +64% | +2 Mana 14 - 1 Mana next turn 4 |
| Battery Pack | 0 | common | shared | Gain 1 Mana. Consume. | 7 | 6 | +17% | strong | 10 | +43% | +67% | +1 Mana 7 |
| Schematics | 0 | uncommon | shared | Choose a card in your draw pile and put it on top. Draw 1 card. Consume. | 6 | 8.4 | -29% | weak | 10 | +67% (too big) | +19% | a chosen draw: draw 1 alone 4 + choice 2 |
| Build Generator *(cond.)* | 2 | rare | shared | Summon Generator (8 HP). At the end of your turn it will: Next turn, gain 1 extra Mana. | 20 | 23.8 | -16% | weak | 29.4 | +47% | +24% | Generator 8 HP 9.6 + 3 + 1 Mana next turn 4 x ~2 acts (it lives if it stands behind) |
| Sync Pulse | 1 | common | Assemble | Heal 2. Your companions gain 2 max HP. Draw 1 card. | 9.6 | 10 | -4% | on budget | 13.6 | +42% | +36% | heal 2 3 + companions 2 max HP 3.6 + draw 3 |
| Hardened Chassis | 1 | common | Core | Gain 8 Barrier to the ally. Draw 1 card. | 11 | 10 | +10% | on budget | 15 | +36% | +50% | 8 Barrier on one companion 8 + draw 3 |
| Factory Floor | 1 | uncommon, Aura | shared | Whenever you summon an ally: Draw 1 card. | 10.8 | 15 | -28% | weak | 14.3 | +32% | -5% | draw 3 x 0.9 summons x 4 |
| Blueprint | 1 | uncommon | shared | Add a random Summon card from your pool to your hand. | 5 | 11.2 | -55% | dead | 6 | +20% | -46% | a random Summon to hand at full cost: a draw 4 + 1 for the kind |
| Salvage Rights | 1 | uncommon, Aura | Swarm | Whenever one of your allies dies or is scrapped: Draw 1 card. Gain 2 Barrier. | 13 | 15 | -13% | on budget | 18.7 | +44% | +25% | (draw 3 + 2 Barrier 2.4) x 0.6 deaths/scraps a turn x 4 |
| Scrapyard King | 2 | uncommon, Aura | Swarm | Whenever one of your allies dies or is scrapped: Apply 1 Might to all friends. | 17.9 | 28.5 | -37% | weak | 17.9 (cost 1) | +0% | +19% | 1 Might to all (8 x 0.8) x 0.7 deaths/scraps a turn x 4; upgrade cuts the cost to 1 |
| Echo Command | 1 | uncommon | Assemble | Apply 5 Primed to all friends. Draw 1 card. Consume. | 15.5 | 14 | +11% | on budget | 20.5 | +32% | +46% | 5 Primed to all 12.5 + draw 3 |
| Resonant Pulse | 1 | uncommon, Aura | Assemble | Whenever you play a Skill: Heal 1. Your companions gain 1 max HP. | 19.8 | 15 | +32% | strong | 23.3 | +18% | +55% | (heal 1 1.5 + companions 1 max HP 1.8) x 1.5 Skills x 4 |
| Self-Mending | 2 | uncommon, Aura | Core | At the start of your turn: Heal 2. Your companions gain 2 max HP. | 26.4 | 28.5 | -7% | on budget | 39.6 | +50% (too big) | +39% | (heal 2 3 + companions 2 max HP 3.6) x 4 |
| Swarm Surge | 2 | rare | shared | Summon Patrol Drone (4 HP). At the end of your turn it will: Deal 3 damage. Draw cards equal to the number of your allies. | 19.8 | 23.8 | -17% | weak | 29 | +46% | +22% | Patrol Drone 10.8 + draw ~2.5 as an extra 9 |
| Patch Job | 0 | uncommon | Core | The ally gains 5 max HP. | 6 | 6.7 | -11% | on budget | 8.4 | +40% | +25% | 5 max HP on one ally 1.2 a point |
| Relay Network *(cond.)* | 1 | uncommon, Aura | shared | Whenever one of your Traps is triggered: Apply 3 Primed to all friends. | 15 | 15 | +0% | on budget | 20 | +33% | +33% | 3 Primed to all 7.5 x ~0.5 Trap springs a turn x 4 |
| Crankshaft *(cond.)* | 1 | common | Core | Deal 5 (+1 per 3 max HP of your biggest companion) damage. | 9 | 10 | -10% | on budget | 12 | +33% | +20% | 5 + max HP/3 of the biggest (~12 HP: 4) |
| Reinforced Frame | 1 | common | Core | The ally gains 5 max HP. Draw 1 card. | 9 | 10 | -10% | on budget | 12.6 | +40% | +26% | 5 max HP on one ally 6 + draw 3 |
| Heavy Hitter *(cond.)* | 2 | rare | Core | Deal damage equal to your biggest companion's max HP. | 18 | 23.8 | -24% | weak | 21 | +17% | -12% | damage = biggest companion max HP (~18 in a Core deck, ~8 otherwise) |
