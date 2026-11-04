# Campaign balance proposal — 2026-11-03

**Approved and implemented, 2026-11-03 (DECISIONS #574).** The reviewed proposal remains below as the specification. The grade targets still require campaign playtesting.

Source reviewed: `db0b7f7`. This is a hand analysis of card data, upgrades, traits, Ascendancies, engine semantics, and the costing guide. Implementation adds controlled scenario tests; no balance simulations or campaign playtests were run. The grades below are qualitative assessments and design targets, not measured win rates or a claim that the patch already achieves them.

## Direction

Robert wants three or more A-level ways to play each class, with freely mixed cards and emergent combinations. The named card-grouping system was removed in DECISIONS #453. It must stay removed. The combinations in this document are examples to evaluate, never reward filters, deck tags, quotas, or prescribed lists.

Engineer should support many small summons, larger machines that occupy more spaces, and the Engineer's own destructive weapons. Replace Foreman with an offensive Ascendancy. Companion commands remain tools usable by any combination, rather than a separate designated build.

Echo encounters, ghost selection, enemy scaling, rewards, merchants, and the economy are outside this proposal. The Shaman card named Echoing Strike is discussed separately from Echo encounters.

An A-level combination should have accessible setup, sustained damage, defense during setup, and a recovery plan. It must function without finding one particular rare. It may have difficult matchups. Three high-ceiling decks that all require exceptional rewards do not meet the goal.

## Why Engineer can fall behind around Tier V

- Tier I enemy HP is 90% of base; Tier V is 250%, or 2.78 times Tier I. Attack damage goes from 90% to 126%, or 1.4 times Tier I. Increasing the basic drones' numbers would also strengthen their already useful early game.
- Three ordinary Patrol Drones deal 9 damage per action before buffs. Filling the board does not itself provide continuing damage growth.
- Engineer spends Mana and cards on bodies, protection, buffs, and extra actions. Having individually efficient cards does not guarantee that the complete sequence is affordable.
- Max-HP investment has a strong rare payoff in Heavy Hitter, but does not inherently increase the machine's ordinary strikes.
- Pulse Pistol, Laser Grid, Ion Lance, and Railgun can hit hard initially, but the latter two have no native continuing growth. Several weapon-support effects mostly reward the machines instead of the Engineer.
- My earlier ratings overvalued a completed deck's ceiling. Robert's Tier V experience is a reason to lower confidence in those ratings, not evidence of a specific bug or a diagnosis of his unseen deck.

## Proposed Engineer changes

All new names are working names. Existing card costs and rarities stay unless explicitly changed. `+` means the upgraded version. Growth lasts for the fight only.

| ID | Item | Current | Proposed | Purpose |
|---|---|---|---|---|
| E1 | Foreman → **Artillerist** | Second starting Drone; companion attacks +25% | At the start of your turn, gain 1 Might. The first Attack you play on your turn gives you 3 Barrier. | Personal offense and protection while firing. Works without a particular weapon or a full companion board. |
| E2 | **Weapon Bench**, new uncommon Aura | — | 2 Mana. The first Attack you play on your turn gives you 1 Might. Upgrade: costs 1. | A weapon deck can obtain continuing growth below rare, including in its initial uncommon choices. Applies to the Engineer's attacks, not companion strikes. |
| E3 | Jumpstart | 1 Mana; companions gain 3 Primed; gain 4 Barrier. `+`: 7 Barrier. | Companions gain 1 Might instead of 3 Primed; Barrier unchanged. | Makes an existing common support sustained summon damage. Trades some first-action burst for repeatable growth. |
| E4 | Ion Lance | 2 Mana, uncommon; 20 damage. `+`: 23. | 18 damage; every copy gains 4 damage for this fight. `+`: 22 damage, same growth. | An independently growing personal weapon. Lowers the first shot to pay for later damage. |
| E5 | **Rotary Cannon**, new uncommon Attack | — | 2 Mana; deal 4 damage four times to one enemy. `+`: 5 damage four times. | A personal weapon that rewards Might and Primed. Always four hits; resource growth never adds hits. |
| E6 | Swarm Tactics | 1 Mana, uncommon Aura; a successful summon deals 6 to a random enemy. `+`: 9. | Same, plus 1 damage per 4 companions successfully summoned by your side this fight. | Summoning and replacing machines develops damage over time. Successful summons count; failed spawns do not. The new summon is included in the count. |
| E7 | Bulwark Frame | 1 Mana, uncommon; give an ally 12 Barrier. `+`: 15. | Give it 8 Barrier + 20% of its max HP, rounded down. `+`: 11 + 20%. | At 20 max HP, unchanged at 12/15. At 60, 20/23. Makes protection grow with an invested machine without multiplying its damage. |
| E8 | Rebuild | 1 Mana, uncommon, Consume; last fallen ally returns at half HP; gain 3 Barrier. | Return at 75% HP, rounded down, minimum 1; Barrier and Consume unchanged. Other revival behavior unchanged. | One recovery opportunity with more chance of surviving the next hit. Does not refund every lost buff or create repeatable resurrection. |

E1 removes the old companion percentage bonus and extra Drone. It is a replacement, not an additional trait. Golemancer and Swarmwright initially stay unchanged. Swarmwright retains its fourth slot and 1 Primed per companion per turn.

Existing Foreman saves/decks map to Artillerist through the compatibility mechanism used for renamed Ascendancies. New cards temporarily reuse related existing artwork; Artillerist reuses the former Foreman crest. Dedicated artwork is separate follow-up work.

### Engineer hand checks

These are isolated arithmetic checks, not full deck results. They omit defenses, Exposed, enemy disruption, and setup costs unless stated.

- **Jumpstart:** at 1.5 single-hit companions, 1 companion Might is about 3.75 points, plus 4.8 for its 4 Barrier: 8.55 against a 1-Mana common budget of 10. At three companions it is about 12.3, intentionally above the ordinary budget for maintaining a full board. A three-hit machine also benefits more; it must be checked with extra actions and two scaling Auras.
- **Three surviving Patrol Drones, one Jumpstart per turn, two actions per turn:** new Might gives raw round damage of 24, 30, 36, 42 across four rounds. Current Primed gives 27 each round if applied before the first action. This assumes all three survive and replacement is unnecessary. New drones do not inherit the lost one's Might merely by being summoned.
- **Ion Lance:** four base plays produce 18, 22, 26, 30, totaling 96 versus the current 80. Using the guide's growth shortcut: 18 + 4×1.2 = 22.8 points, about 7% above a 2-Mana uncommon's 21.28. Upgraded sequence: 22, 26, 30, 34. Multiple copies accelerate shared growth; that is a required ceiling check.
- **Rotary Cannon:** 16 base damage; at 2 Might, 24. A 2-Mana uncommon's ordinary budget is 21.28, but this needs paid support. Primed 5 adds 20 to the attack, not 5. At 2 Might and 5 Primed, it deals 44 raw damage. Do not add scaling hit counts or a repeatable free-attack effect to this card.
- **Artillerist:** over four turns with two hero attack hits per turn, its accumulating Might adds 2+4+6+8 = 20 damage. Four first Attacks give 12 Barrier. With four hits per turn, the damage addition is 40. This is why its growth is only 1 Might and it does not also draw a card or increase companion damage.
- **Weapon Bench:** ordinary play triggers occur after the Attack. With one two-hit Attack each turn, four turns yield 0+2+4+6 = 12 added damage. With two two-hit Attacks each turn, the second benefits immediately and the total is 2+6+10+14 = 32, versus the approximate uncommon Aura budget of 31.92. Two copies and Artillerist require checking together, including setup turns. Drunken Master's play trigger also follows the triggering attack.
- **Bulwark Frame:** at 20 max HP the base card stays at 12 ally Barrier; at 60 it becomes 20. That exceeds an ordinary 1-Mana budget after significant HP investment, rather than increasing early damage or Heavy Hitter's multiplier.
- **Swarm Tactics:** 4/12/24 successful summons make a base trigger deal 7/9/12 instead of 6. Two copies double the trigger, not the summon counter. This increases long-fight output without a permanent damage multiplier or a self-sustaining resource loop.

These checks justify prototypes. They do not establish an A rating. The weakest remaining uncertainty is whether developed machines survive long enough for their sustained growth to matter.

## Changes across the other classes

### Knight

| ID | Item | Current | Proposed |
|---|---|---|---|
| K1 | **Measured Conviction**, new uncommon Aura | — | 2 Mana. At the end of your turn, if you have at least 2 Reserves, gain 1 Might and 2 Barrier. `+`: 4 Barrier; same Might. |
| K2 | Smoldering Blow | 1 Mana, uncommon; 6 + 1 per consumed card. `+`: 9 + 1. | 6 + 2 per consumed card. `+`: 9 + 2. |

K1 supplies a below-rare reason to retain Reserves while the existing rare payoffs remain desirable. Four successful triggers give 4 Might plus 8 Barrier: approximately 20 + 9.6 = 29.6 points against a 31.92-point 2-Mana uncommon Aura reference. This estimate still needs checking with multi-hit attacks and Oath Unbroken. It must never check Reserves before card costs and then spend those same Reserves for free.

At 5 consumed cards, K2 rises from 11 to 16 damage; at 10, from 16 to 26. This supports the Consume package without buffing its draw/Mana engine. It is intentionally over ordinary front-loaded damage budgets once cards have been consumed. Barrier and ordinary Might cards receive no initial increases.

### Hunter

**No initial numerical change.** Existing permanent Might, sharing, lifesteal, card draw, and extra actions already provide several growth mechanisms. Check pack commands, hero multi-hit/blood, and draw-heavy Predator combinations as reference decks. This is a hypothesis to validate, not proof that three Hunter combinations currently meet the reliable A standard. If a specific reference fails, address that bottleneck rather than raise every Hunter attack.

### Trickster

| ID | Item | Current | Proposed |
|---|---|---|---|
| T1 | Gleeful Trapsmith | 1 Mana, uncommon Aura; playing a Trap deals 4 to all. `+`: 6. | 4 + 1 per 4 of your Traps sprung this fight. `+`: 6 + same growth. |
| T2 | Masquerade | 2 Mana, rare Aura; end turn: 3 damage per suit to all. `+`: 4 per suit. | Same, plus 2 damage per Full Trick made this fight, but only on a turn in which you make a Full Trick. |

T1 counts actual springing, not merely playing or creating a Trap. A canceled hit is still one Trap spring, and one Trap cannot increment the count several times for several effects. At 12 sprung Traps, a base T1 trigger deals 7 rather than 4. Its existing high trigger frequency makes the two-copy ceiling important.

At four suits and the sixth Full Trick, T2 deals 24 to each enemy instead of 12; upgraded, 28 instead of 16. A later turn with fewer than four suits receives only the existing suit damage. This rewards successfully executing the mechanic rather than banking a permanent unattended AoE engine. Exposed payoffs stay unchanged initially.

### Rogue

| ID | Item | Current | Proposed |
|---|---|---|---|
| R1 | Slow Murder | Rare; 3 Mana, 1 + cards drawn this fight. `+`: 2 Mana, same damage. | Base costs 2. `+` also costs 2, deals 8 + cards drawn this fight. |
| R2 | Side Slip | Uncommon, 0 Mana, Defer a card. | Common, with current effect and upgrade retained. |

At 20 drawn cards, R1 is 21 damage for 2 Mana, near the rare budget of 23.75. At 40 it is 41; that is the reward for developing draw, not its turn-one value. Do not add multi-hit or additional damage multiplication to it. R2 improves access to Defer while leaving its card-slot cost and one-turn delay intact. Daggers and Bleed receive no initial damage increases.

### Shaman

| ID | Item | Current | Proposed |
|---|---|---|---|
| S1 | Spirit Strike | Common, 2 Mana; 11 damage, command front totem. `+`: 15 damage. | 1 Mana; 5 damage, command front totem. `+`: 8 damage. |
| S2 | **Spirit Pact**, new rare Aura | — | 2 Mana. After your first explicit totem command on your turn, gain 1 Spirit and 3 Barrier. `+`: 5 Barrier; same Spirit. |
| S3 | Echoing Strike | 2 Mana, rare; 18 damage and a free copy in discard, which can make more copies. `+`: 23. | Same initial damage; add a 0-Mana Flame token to discard that deals 18 and Consumes, with no copying effect. `+` makes a 23-damage token. |
| S4 | Heart of the Pyre | 1 Mana, rare Aura; each Flame card deals 5 to a random enemy. `+`: 6. | 2 Mana. Each Flame card deals 5 + 1 per 4 Burn on the randomly chosen enemy. `+`: base damage 8, same scaling. |

S1 reduces the Mana spent combining an attack with a command. It still consumes the commanded totem and therefore requires replenishment. A zero-Spirit Hawk makes its base raw offense 12, but the Hawk has been paid for and is lost. This is deliberately above an ordinary 1-Mana attack once set up.

S2 supplies continuing command-related growth. It triggers after the first explicitly ordered command action, not from passive totem effects or an automatic push-out when planting. A multi-command card produces one payment per Aura that turn. Three regular totems receiving 1 extra Spirit per round can add roughly 30 passive damage/Barrier units over four completed rounds, plus command benefits and the Aura's 12 Barrier; multi-target effects and two copies require extra review. This is a rare engine, with Spirit Surge remaining the accessible uncommon way to grow Spirit.

S3 contains a card-generation outlier. The original card can still generate another token when played again; the token cannot generate tokens. The token may interact with Flame and Consume support normally. This has no effect on Echo encounter rules.

S4 turns a flat Flame payoff into a Burn payoff. At 4 Burn and two Flame cards a turn, four full turns produce 48 raw damage from one Aura, close to the 47.5-point 2-Mana rare Aura reference. At 20 Burn, a trigger deals 10 rather than 5. Burn is not spent by this trigger; Flashpoint still trades away half its stack. Its randomly chosen victim supplies the Burn value, not the enemy with the highest stack. The extra Mana cost pays for scaling and avoids strengthening every early Flame deck indiscriminately.

**Remaining uncertainty:** Flame without the self-copy engine needs particular attention. Its target A grade is less certain than Storm's, and S4 is another rare payoff rather than a guarantee of ordinary reward access. Check a Flame deck missing Heart of the Pyre before adopting further changes.

### Monk

| ID | Item | Current | Proposed |
|---|---|---|---|
| M1 | Inner Fire trait | Fervor on stance entry; once-per-turn Serene exit Mana and Fury exit Primed. | Keep those effects; additionally gain 1 Might the first time you enter a stance on your own turn. |
| M2 | Foretold Flame | Uncommon, 1 Mana; 5 + current Fervor damage; Foresee 2. `+`: 8 + current Fervor. | 5 + 1 per 3 Fervor gained by your hero this fight; Foresee 2. `+`: 8 + same scaling. |

M1 is shared class growth, capped once per own turn across Fury, Serene, and Radiant together. Re-entering the same stance without an actual change does not count. It must not give a separate point for each stance or for enemy-turn stance changes. No extra Might is granted just for the initial starting Serene setup.

That supports several freely mixed combinations without requiring every Monk to find one Aura. After four qualifying turns, 4 Might adds 16 raw damage to Thousand Palms, before Fury/Radiant and defenses. This multiplier is the main risk; start at 1 Might, not 2.

M2 avoids losing its entire scaling payoff when reaching Radiant spends Fervor. At 30 Fervor gained, it deals 15 before stance multipliers, or 45 in Radiant; upgraded, 54. It measures actual positive Fervor gains, not the number of times Fervor is read or spent. Its lower rate pays for keeping progress. No changes to the stance multipliers, incoming Fury damage, Radiant duration, or Serene Mana rules.

### Spellblade

**No initial numerical change.** Banked Spell Power, spending/recharging, and Fracture already have continuing growth and shared defensive support. Use these as another reference, including mixed Sword/Spell play. Validate generator access and recovery after spending power; do not raise all Sword numbers to match a fully developed Fracture deck's best turn.

### Drunkard

| ID | Item | Current | Proposed |
|---|---|---|---|
| D1 | **Morning After**, new uncommon Aura | — | 2 Mana. The first time on your own turn that Hangover actually costs you HP, gain 1 Might and 3 Barrier. `+`: 5 Barrier; same Might. |
| D2 | Drunken Master | 1 Mana, uncommon Aura; each Stagger gives 2 Barrier and deals 2 random damage. `+`: 3 and 3. | 2 Mana. The first Stagger you play on your own turn gives 1 Might and 3 Barrier. `+`: costs 1; same effect. |

D1 makes enduring Hangover build lasting offense. Clearing it still avoids the damage but does not receive the payment reward. An attempted payment prevented entirely, including at the 1-HP floor, must not grant Might. This needs a generic Hangover-payment event; ordinary self-damage is not enough.

D2 exchanges unlimited small per-card triggers for bounded permanent growth. Haphazard Hook cannot farm repeated Might in one turn. The proposed new Auratype text uses the existing Stagger tag, not a new card group.

Four full D2 triggers approximate 20 points of Might plus 14.4 points of Barrier: 34.4, about 8% above the 31.92-point uncommon Aura reference. Clutch, three-hit attacks, two copies, and D1 together make its actual ceiling more important than that estimate. Keep the Hangover cap and existing Clutch rules; do not raise either as part of this pass. Gun and Shell engines receive no initial raw damage increase.

### Necromancer

| ID | Item | Current | Proposed |
|---|---|---|---|
| N1 | Restless Spirits | 1 Mana, uncommon Aura; playing a Gravesoul makes a random enemy lose 6 HP. `+`: 8. | 4 + 1 per 3 Gravesouls consumed this fight. `+`: 6 + same growth. |
| N2 | Requiem | Rare, 1 Mana; 9 + 2 per consumed Gravesoul. `+`: 9 + 3. | Base keeps its damage and also draws 1. `+`: 12 + 2 per consumed Gravesoul, draw 1. |
| N3 | Gallows | Rare, 1 Mana; 10 damage and Noose, causing exponential damage growth. `+`: 13. | Remove the Noose effect and tag. Deal 10; every copy gains 6 damage this fight. `+`: 13 damage; every copy gains 8. |

N1 trades some opening damage for a growing reward. Count actually consumed soul-tag cards, excluding the card that triggered the play effect: the engine has already consumed that card when play triggers run. Six base soul plays deal 4+4+4+5+5+5 = 27 from one Aura versus 36 previously. Thirty deal 255 versus 180. This deliberately improves long fights rather than the earliest turns. New Gravesoul generation still costs cards and resources.

N2 supplies a repeatable draw link without making it free. Upgraded scaling is reduced from 3 to 2 in exchange for the draw and extra base damage; it is not a uniform buff. At 5 consumed souls the upgrade becomes 22 + draw instead of 24; at 20, 52 + draw instead of 69. Test whether the consistency improvement is sufficient before raising the multiplier again.

N3 makes repeated Gallows plays 10,16,22,28,34,40 rather than 10,20,40,80,160,320 before modifiers. It remains a growing rare, slightly above Mounting Fury's base 9 with growth 5. It must be tested with several copies; shared growth is still faster than one copy repeatedly cycling. Thralls and Fate receive no initial numerical increase. Fleeting remains a support package rather than a mandatory independent victory condition.

## Chart: current assessment → target after this proposal

Current grades are estimates for developed campaign combinations, with reliability considered. A means strong, B viable with substantial weaknesses, C struggling, and S an outlier ceiling. These are broad bands; earlier plus/minus ratings were more precise than the evidence warranted. Target A is an acceptance goal, not a forecast established by tests. Different rows can share cards or combine in one deck.

| Class | Example combination | Current | Target | Main reason / confidence |
|---|---|---|---|---|
| Knight | Barrier + retaliation/Barrier attacks | A | A | Keep existing engine; reference. |
| Knight | Might + multi-hit/X attacks | A/B | A | Existing growth; reference. |
| Knight | Reserves + patient attacks | B | A | K1 gives accessible growth before specific rares. |
| Knight | Consume + attack cycling | C/B | B+ | K2 improves damage, but deck depletion still constrains it. |
| Engineer | Many small summons + replacement effects | B/C | A | E3 and E6 improve continuing output; survival remains a test. |
| Engineer | Large machines + growth/protection | B; A ceiling | A | E3, E7, E8 reduce its offense/protection/recovery tradeoff. |
| Engineer | Personal multi-hit weapons + Might/Primed | C/B | A | E1, E2, E4, E5 make independent hero offense practical. |
| Engineer | Weapons + a few supporting machines | B | A | Shared buffs, extra actions, weapon growth, and optional Generator support. |
| Hunter | Hero Might + multi-hit/blood | A | A | Retain; validate as a reference. |
| Hunter | Pack + shared Might + commands | A/B | A | Existing growth; validate reliability before buffing. |
| Hunter | Draw-heavy turns + Predator | A/B | A | Existing per-draw and per-card payoffs; validate defense. |
| Trickster | Traps + draw/Barrier triggers | B | A | T1 adds cumulative damage to an existing defensive engine. |
| Trickster | Exposed + repeated finishers | A/B | A | Existing scaling; reference. |
| Trickster | Four-suit turns + repeated Full Tricks | C/B | A | T2 makes successful repeated execution grow AoE output. |
| Rogue | Daggers + Edge + attack-count payoffs | A | A | Keep existing engine; reference. |
| Rogue | Bleed + accelerated ticks | A | A | Keep existing engine; reference. |
| Rogue | Defer + draw/discard + Slow Murder | B | A | R1/R2 improve accessible setup and a long-fight finisher. |
| Shaman | Storm + growing zero-cost attacks | A | A | Keep growth; test after S3 removes an outlier interaction. |
| Shaman | Flame/Burn + generation/recursion | B; S copy ceiling | A | S3 contains the outlier, S4 rewards Burn; ordinary Flame needs the most validation. |
| Shaman | Totems + Spirit + explicit commands | B/C | A | S1 improves tempo, S2 develops continuing growth. Rare dependence is a concern. |
| Monk | Stance changes + recurring attack turns | B | A | M1 grows the underlying attacks as stance triggers supply utility. |
| Monk | Fury + multi-hit + safe exits | C/B | A | M1 supplies the missing persistent offense. |
| Monk | Fervor + timed Radiant attacks | B | A | M1 plus M2 preserve meaningful progress across Radiant entries. |
| Spellblade | Banked power + Swords | A | A | Keep existing engine; reference. |
| Spellblade | Power spending + recharge | A/B | A | Existing growth; validate setup/recovery. |
| Spellblade | Fracture + Shatter + power | A | A | Keep existing engine; reference. |
| Spellblade | Alternating Swords/Spells + Fault Lines | A/B | A | Existing shared tools; reference. |
| Drunkard | Precision + guns | A | A | Keep existing engine; reference. |
| Drunkard | Shell volume + Consume + weapon growth | A/B | A | Existing combined engine; reference. |
| Drunkard | Hangover + Stagger + recovery | C/D | A | D1/D2 give lasting offense without increasing Hangover's cap. |
| Drunkard | Low HP + sustained weapons | B | B+/A | Still risky; no promise of A for a pure low-HP package. |
| Necromancer | Thralls + HP growth + commands | A/B | A | Existing scaling; validate recovery. |
| Necromancer | Fate + damage + execution | A/B | A | Existing percentage and stack growth; reference. |
| Necromancer | Gravesouls + Consume + Requiem | C/B | A | N1/N2 grow a dedicated offense; early weakening needs careful checking. |
| Necromancer | Gallows repeated cycling | S ceiling | A | N3 replaces exponential output with linear shared growth. |

Frost control, Serene defense, small Trap packages, and standalone Fleeting are supporting components. Their value is what they enable in a complete deck; they need not each receive a standalone A grade. This does not forbid a player from discovering a strong unusual combination.

## Acceptance checks before calling this balanced

1. Hand-price base and upgrade against the costing guide, then calculate turn-4 and turn-8 sequences including setup costs, ordinary draw, defense spending, two Aura copies, and relevant multipliers. The isolated examples above are not substitutes for this.
2. Use several representative reward histories at Tiers III, V, X, and XX. Include a deck missing its preferred rare. Preserve the early challenge, then require accessible progression by Tier V and continuing damage later.
3. For Engineer, separately examine three/four Lights, Heavy + Light, a lone Colossal, and weapons with zero/one/several machines. The weapon deck must still deal credible damage when its companion dies.
4. Play controlled scenarios for loss of a developed machine, bad opening hands, and a defensive Warden. Check that 75%-HP Rebuild restores only what the current revival rules permit and that Swarm Tactics cannot count failed spawns.
5. Check extreme combinations: Artillerist + two Weapon Benches + Rotary Cannon + Exposed; four buffed companions with repeated actions; two copies of each growing trigger Aura; Monk Might with four-hit Radiant; Hangover growth + Clutch + three-hit Stagger; several growing Gallows/Ion Lance copies.
6. Compare to existing strong Hunter and Spellblade combinations. Reject runaway same-turn loops and unattended survival locks. Accept some late-fight budget excess when paid setup and escalating enemy durability justify it; record exceptions explicitly rather than describing all proposed cards as on-budget.
7. Check PvP interactions because the same cards travel there. Do not use extra damage specifically against campaign enemies to hide a general card problem. Echo encounter tuning remains a separate later pass.
8. If implemented, add scenario/rule tests for each new behavior, regenerate the card list, update the costing guide and patch notes, and complete lint, typecheck, tests, and build. Run balance simulations only if Robert requests them.

## Recommended order

Implement and validate the Engineer changes first, followed by Monk, Trickster, Drunkard, and Necromancer. Apply the smaller Knight/Rogue/Shaman adjustments next. Use Hunter and Spellblade as comparison points. Start with the proposed numbers, revise from concrete failed scenarios, and do not label thirty combinations A merely because the chart targets it.

The content and trait changes above are approved and implemented. Open questions remain practical balance uncertainty, particularly Engineer survival at Tier V, ordinary Flame after the copy change, command-engine rarity dependence, and the full-stack ceilings. The chart records playtest targets rather than measured A-tier certification.
