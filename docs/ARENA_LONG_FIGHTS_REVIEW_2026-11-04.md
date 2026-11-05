# Arena review: ten-plus turns per player

This is the **pre-change assessment**. After this review, Robert authorized release and only P4 was implemented; see [the exact shipped scope](ENGINEER_SCALING_2026-11-04.md) and [rules 80 assessment](balance-history/0.197.0.md). Remaining proposals below are unapplied. The original rules 79 reasoning is retained for comparison.

2026-11-04 · local v0.197.0 · combat rules 79 · source 9f16335 plus decision #600 timer change.

**Only the Arena clock is implemented: 15 → 20 minutes per game, including ghosts.** Turns remain 75 seconds. Everything below that changes cards or Ascendancies is a proposal. No push/deploy approval, simulations or measured matchup dataset. The new [30-Ascendancy chart](balance-history/0.197.0-arena-review-1.md) and [CSV](balance-history/0.197.0-arena-review-1.csv) preserve earlier assessments separately.

The goal is distinct, competitive A-band choices and typical competitive games lasting ten-plus turns **per player**. A working tuning band of 10–14 is a recommendation, not a hard minimum. Equal-quality players should have time for setup, pressure and recovery; a badly exposed player can still lose sooner. Raising HP alone would favor percentage healing/Fate and permanent engines without fixing resource bursts or weak recovery.

## Assessment and evidence limits

Grades include the class trait and available pool, not just the Ascendancy passive. Overall includes setup and disruption; long-fight grades assume reaching own turns 10–15 with a functioning engine. S means a suspected outlier, not a verified win rate. B+ means a reliability concern. A-/A/A+ are competitive sub-bands. All new estimates have low confidence.

Opening turns 1–3, extended turns 6–10 and Campaign progression are separate axes. Their earlier grades are retained in the snapshot except the explicit Golemancer correction below. No after-proposal grades are asserted. Reference styles are freely mixed examples, not predefined builds or restricted card groups.

Evidence: [Ascendancies](../packages/content/src/v2/ascendancies.ts), [base classes](../packages/content/src/v2/index.ts), [card pools](../packages/content/src/v2/pools), [units](../packages/content/src/v2/units.ts), [discipline rules](../packages/combat/src/disciplines.ts), [engine](../packages/combat/src/engine.ts), [Arena setup](../packages/pvp/src/match.ts), [protocol](../packages/pvp/src/protocol.ts), and [costing guide](14_CARD_COSTING.md). Deterministic tests establish behavior only. The costing guide's short-fight assumptions do not establish fifteen-turn value.

## Updated Arena chart

| Class | Ascendancy | Prior overall | Revised overall | Conditional turns 10–15 |
|---|---|---|---|---|
| Knight | Paladin | A | A- | A- |
| Knight | Marshal | A | A- | A- |
| Knight | Blood Knight | A | A | A |
| Engineer | Swarmwright | A | A- | A |
| Engineer | Golemancer | A- | A | A+ |
| Engineer | Artillerist | A | A | A+ |
| Hunter | Beastmaster | A | A- | A |
| Hunter | Reaver | A+ | A | A |
| Hunter | Predator | A+ | A+ | A+ |
| Trickster | Trapmaster | A | A- | A- |
| Trickster | Cardsharp | A+ | A+ | A+ |
| Trickster | Seer | A | A | A+ |
| Rogue | Bladedancer | A+ | A+ | A+ |
| Rogue | Bloodletter | A+ | A+ | A+ |
| Rogue | Assassin | A | A | A |
| Shaman | Totemist | A+ | A+ | A+ |
| Shaman | Spiritwalker | A+ | A+ | A+ |
| Shaman | Elementalist | A | A+ | A+ |
| Monk | Sage | A+ | A+ | A+ |
| Monk | Zealot | A | A | A |
| Monk | Sunwalker | A+ | A+ | A+ |
| Spellblade | Blademaster | A | A | A+ |
| Spellblade | Archmage | A+ | A+ | S |
| Spellblade | Shatterer | A+ | S | S |
| Necromancer | Bonelord | A | B+ | A |
| Necromancer | Fateweaver | A+ | A+ | A+ |
| Necromancer | Soulreaper | A+ | S | S |
| Drunkard | Brewmaster | A+ | A+ | S |
| Drunkard | Gunslinger | A | A | A+ |
| Drunkard | Deathwish | A- | B+ | A- |

These changes reassess unchanged combat rules under a longer target. They do not mean the timer buffed/nerfed these passives. Golemancer's earlier assessment undercounted its pool. Bonelord and Deathwish are the clearest reliability concerns; capped passives such as Marshal are not automatically bad when their pools supply growth.

## Golemancer: the reported 160-HP machine

Robert reports a friend reaching 160 companion HP fairly easily in lower Campaign tiers and liking the playstyle. Record this as a second-hand observation: exact tier, unit, deck, upgrades, Boons, turn count and current versus max HP are unknown. It is not evidence of an average or of Arena dominance, but the code makes the number quite plausible.

Every heal on a companion adds that amount to **both current and max HP**, even when already full. Golemancer starts with Engineer's +1 and its own +3 per companion per own turn. Two Self-Mending Auras add another 4 each start (6 upgraded). Two Resonant Pulse Auras add 2 max/current HP per Skill play. Patch Job adds 5/7 for zero Mana; Reinforced Frame adds 5/8 and draws for one Mana. Arc Welder adds 3 to the biggest ally while dealing damage. Most of this growth is common/uncommon; the engine does not require a rare summon to exist.

An explicit arithmetic example, **not a play sequence or prediction of setup time**: start with a 22-HP War Engine and an already established two Self-Mending/two Resonant Pulse engine. Across eight subsequent own starts and 24 Skills, gain 32 passive HP +32 Self-Mending HP +48 Pulse HP. Two of those Skills being Reinforced Frame+ add 16 and two being base Patch Job add 10. Total:22+32+32+48+16+10=160 max HP. The four Auras cost 6 Mana and four cards before this accounting window; the 24 Skills need draw, payments and continued survival. Incoming damage lowers current HP but does not undo max HP. This illustrates a legal source of growth, not the friend's unidentified build or a demonstrated turn-eight result.

The number itself is less concerning than what can spend it:

| Payoff at 160 HP | Current base / upgraded | Constraint |
|---|---|---|
| Golemancer companion Attack bonus | +100% / +100% | Already capped at 100 max HP; only Heavy/Colossal companion attacks |
| Heavy Hitter, 2 Mana | 160 / 163 damage | Biggest living ally's **max** HP; hero Attack modifiers can amplify it |
| Crankshaft, 1 Mana | 58 / 61 damage | 5/8 + floor(max HP/3); common repeatable Attack |
| Bulwark Frame, 1 Mana | 40 / 43 Barrier | 8/11 + floor(20% max HP), applied to companion |
| Reactor Meltdown, 0 Mana, Consume | 160 / 163 to each foe | Assumes 160 **current** HP; sacrifices the machine, non-Attack damage |
| Strip for Parts, 0 Mana, Consume | 160 Barrier/draw 1 / 163 Barrier/draw 2 | Assumes 160 **current** HP; sacrifices the machine |

A wounded machine at 40/160 still powers 160 base Heavy Hitter and 58 Crankshaft, but only 40 base Meltdown or 40 Strip for Parts. Golemancer's +100% companion bonus does **not** double these hero cards. Might/Exposed and other ordinary hero Attack modifiers can amplify Heavy Hitter/Crankshaft.

At 160 HP, an unmodified base War Engine's three 4-damage hits become three 8-damage hits:24 total before Might, Primed, Reactor, Exposed or additional activations. Removing HP-based damage from the Ascendancy would miss the largest card conversions and damage the intended identity.

True death saves half **earned** growth capped 30; it does not preserve half the entire 160-HP machine. Revivals are fresh base-stat units; a later new large build can use the reserve. Scrapping instead transfers half current HP through Salvage and does not bank another death reserve. At full 160, Salvage transfers 80 HP, whereas hostile death retains at most 30 earned HP. These are materially different recovery paths.

Ordinary Arena attacks can target the Engineer directly unless Taunt restricts them. War Engine has no inherent Taunt; Bulwark Walker does. Campaign enemies often choose companions first, so a big unit can provide substantially more automatic protection there. Arena does not inherit that protection merely because the minion has 160 HP.

**Recommendation:** retain uncapped HP growth, the existing capped companion damage bonus, and recovery rules. Withdraw the tentative summon-refund buff. Target Heavy Hitter's conversion and extreme Pulse chains first (P4 below), while watching common Crankshaft and the sacrifice tradeoffs. Do not impose an arbitrary 160-HP cap. Correct the Campaign IV–X and XVII–XX estimate from A- to A because the earlier review undercounted these engines; late-tier survival is still unproven.

## Hand calculations: where longer fights change value

These are fixed-input arithmetic ledgers, not matches, simulated win rates or predicted lethal turns. They assume the described engine is present and ignore competing costs unless stated.

**Soulreaper.** With m genuine Consumptions per own round (m≤6), starting in round 1, cumulative Reap after n rounds is 4n + m·n·(n+1); cumulative Grave Chill Fate is 3mn. Reap on round n is 4+2mn. Requires one qualifying Reap every round, all effects reaching one hero, no Barrier/cleanse/diversion, enough generated cards and paid resources. Fate is execution pressure, not direct damage: damage plus Fate describes distance to an execution threshold only under these assumptions.

| Consumes/round | Rounds | Last Reap | Cumulative Reap | Fate | Combined threshold pressure |
|---|---|---|---|---|---|
| 3 | 10 | 64 | 370 | 90 | 460 |
| 3 | 15 | 94 | 780 | 135 | 915 |
| 6 | 7 | 88 | 364 | 126 | 490 |
| 6 | 10 | 124 | 700 | 180 | 880 |
| 6 | 15 | 184 | 1500 | 270 | 1770 |

The 490 example already exceeds 480 HP without counting normal attacks. It is not a verified seven-round kill: Reap chooses lowest current HP, Fate chooses randomly, and companions/Barrier/cleanse can change the result. Gravesoul generation and draw 2 tokens are substantial enablers; exceeding six Consumes still gives unlimited base Grave Chill Fate today. Preserve the offensive Consume identity while reducing its maximum growth rate.

**Shatterer.** At a deliberately fixed 10 Spell Power, Shatter k deals floor((20+10k)×115/100). Six successive Shatters total 378; twelve total 1170. At three qualifying plays per active engine turn, one Fault Lines gives 6 Fracture/turn and two give 12. Across ten such turns, those produce 6 versus 12 Shatters on a single target, assuming no other Fracture or prevention. Double the Aura does more than double cumulative damage because later Shatters are larger. Dedicated Fracture cards and actual Power growth can add further pressure. Fracture remains permanent; Steadfast can stop application, and Barrier absorbs Shatter damage.

**Archmage.** Molten Ruin at 20 spent Power with two base Measured Ruin Auras deals 12 +120 from its printed expenditure coefficient +20 Archmage +80 from the two Auras =232; with Exposed,348. At 40 spent Power the same card deals 452 before Exposed,678 with it. Requires two rare 2-Mana Auras,20 or 40 stored Power, the 2-Mana Molten Ruin, draw/access and time to establish. Molten Ruin spends all Power; this is conditional burst, not evidence of a normal opening. Proposed P5 lowers these no-Exposed values to 192 at 20 spent and 372 at 40 spent. Obsidian Drill is a **Sword**, so it receives neither Archmage's Spell bonus nor Measured Ruin; it also spends half held Power, not all. Do not use its three hits to multiply bonuses that do not apply. Reverb likewise must not simply be assumed to repeat every first-spell modifier.

**Brewmaster.** Five actual Hangover-payment turns build 5% max-HP healing plus 10 Barrier each end turn indefinitely. At 528 HP this is 27 healing; at second-seat 588 it is 30. At base Campaign 88 it is 5. These are gross values: HP paid to establish/maintain other drinks and wasted overhealing are not net sustain. Five payments are required, and the first generally cannot be assumed to happen on turn 1. Retaining the bonus without future payments is why long games create a stall concern.

**Paladin.** With constant G Barrier per turn and incoming D fully blocked, end-turn E obeys E=G+0.6·max(previous E−D,0). Without damage it approaches 2.5G, not infinity. For G30/D20 the fixed end-turn value is 45. Retention can still be excellent, but a claim of automatic exponential compounding was incorrect.

**Other growth:** Golemancer's unsupported 22-HP War Engine reaches 54 after eight subsequent own starts and 70 after twelve; card/healing engines can grow it much faster. Bonelord's two Raise 2 operations add 4 total HP across the board per start, not 4 to every Thrall; preserving 40 HP across three Thralls gives 64 base total Off the Leash damage (6+2 Marrow per Thrall plus their total current HP). Artillerist's ten Might adds 40 damage to four-hit Rotary Cannon. Totemist after ten qualifying end turns has 11 Spirit; a Hawk then deals 14 and Bear grants 13 Barrier, with the new Spirit applying before that end's passives. Full Trick's nth trigger deals 2n+1; ten triggers total 120 and fifteen 255 before target distribution. All three Tricksters share that base growth. Gunslinger's starting 3 plus two Precision per own start makes Old Twelve Gauge 35 base lone-target damage after ten starts and 48 after fifteen (nearest-integer rounding), before Clutch; playing it does not guarantee it returns to the next hand.

## Exact proposals, in priority order

**Not implemented.** Use shared Campaign/Arena rules initially. Each proposed change below applies to both modes, retains cost/rarity/type/Consume unless explicitly stated, and must receive exact player notes when implemented. Stage changes so poor Campaign outcomes have an identifiable cause. Do not simultaneously raise enemy damage or hero HP to compensate.

| ID | Proposed change | Purpose and Campaign risk |
|---|---|---|
| P1 | Soulreaper Harvest: first 6 → first 3 genuine Consumes per owner-round. Keep 3 Barrier for first 6 and Reap 4+2 per total Harvest, one qualifying end-turn Reap, no fight-total cap. Necromancer Grave Chill: first 6 Consumes per owner-round retain 3 Fate each; later ones give 1 instead of 3. | Three-Consume turns retain their offensive reward; huge chains grow more slowly. Basic low-throughput Necromancer unchanged; high-tier Consume decks lose speed. |
| P2 | Fault Lines, base and upgraded: first 6 own-turn Sword/Spell plays per Aura give 1 Fracture each instead of 2; later plays give 0 instead of 1. Cost 2/1 unchanged. Keep permanent Fracture and Shatterer's15%. | Two copies/three plays become 6 Fracture per active turn instead of 12. Dedicated Fracture attacks remain valuable. Campaign boss kills may take longer; test XVII–XX survival before release. |
| P3 | Brewmaster Fermentation healing 1% →0.6% max HP per stack, still five stacks, round up once after summing. Keep 2 Barrier/stack and existing payment trigger. | Max healing 27→16 at 528 HP,30→18 at 588,5→3 at 88. Retains a sustain identity but reduces Arena stall. Campaign attrition could worsen even when Arena improves. |
| P4 | Heavy Hitter: maxHP →12+floor(50% maxHP); upgraded 3+maxHP →15+floor(50% maxHP). Same 2 Mana. Resonant Pulse, both versions: heal 1 per Skill remains, but only first 4 own-turn Skills per Aura; subsequent Skills give 0. Upgrade retains Innate. | At 22 maxHP Heavy Hitter 22/25→23/26; at 160,160/163→92/95. Thus early payoff survives while giant-machine burst slows. Two Pulses still provide up to 8 companion growth/turn and normal three-Skill turns are unchanged. Reactive off-turn Skills would no longer trigger Pulse. Keep all other HP growth, Crankshaft, sacrifice cards and Golemancer's damage/HP bonus initially; monitor them. |
| P5 | Measured Ruin, base/upgraded: first qualifying Spell Attack's added damage per spent Power 2/3 →1/2 **per hit**. Keep 2-Mana Aura cost and stacking. | With two base copies at 20 spent Power, Archmage Molten Ruin 232→192 before Exposed; at 40 spent,452→372. Preserves Power spend/refund; rare spender decks lose burst in Campaign too. |
| P6 | Redistribute the listed resource cards between now and next own turn, as below. | Keeps total Mana but reduces immediate self-funding chains; delayed Mana can still concentrate into a later burst. |
| P7 | Cut the Deck: conditional 1-Mana refund only once per own turn across all copies; draw 2/3 and cost 1 unchanged. Scent of Weakness: draw 1 only on first 3 hostile Exposed applications per owner-round **per Aura**, instead of unlimited. | First ordinary use remains useful; repeated cycling has a real Mana/draw limit. Two Scents can still draw up to 6. Short Campaign turns usually change less than heavy combo turns. |

P6 exact resource timing (base/upgraded; all other effects unchanged):

| Card | Current Mana now | Proposed Mana now + next own turn |
|---|---|---|
| Crimson Offering | 2 / 2 | 1+1 / 1+1 |
| Blood Tithe | 2 / 2 | 1+1 / 1+1 |
| Adrenal Surge | 2 / 2 | 1+1 / 1+1 |
| Rush of Blood | 1 / 2 | 1+0 / 1+1 |
| Wellspring | 4 / 5 | 2+2 / 2+3 |
| Soul Tithe | 3 / 4 | 1+2 / 1+3 |
| Spirit Offering | 2 / 3 | 1+1 / 1+2 |

Do not treat delayed Mana as equal immediate power in the costing ledger, or claim these changes guarantee ten rounds. Crimson Offering still draws 3/4 and pays 6/5 HP; Blood Tithe still draws 2 and gives 1 Might while paying 7/5; Adrenal Surge retains its draw 1/2 and 3/2 HP payment. Soul Tithe keeps draw 2 and recurring self-Fate max(3,ceil 2% maxHP). Spirit Offering still adds Void. Consume behavior stays as currently defined. Multiple paid/consumed accelerants remain possible; base copy limits remain 5, Auras 2, legendary/ancestral 1.

The remembered zero-cost draw 2/gain 2 Mana example does exist in Rogue's **Rush of Blood+** and neutral ancestral **Forebear's Gift** (one-copy limit), not as a generic Trickster basic. Trickster still has excellent cycling and Full Trick. Attribute the actual pool advantage correctly.

## Lower-reliability options: second-stage proposals

Do not automatically buff every lower grade while also reducing its strongest opponents. Reassess after the priority changes and comparable human matches. If the two reliability problems remain:

- **Bonelord:** first Command played on own turn grants the hero 3 Barrier per living Bone Thrall, capped 9, after that Command resolves. Existing Raise/Marrow unchanged. This rewards an army without increasing its HP-to-damage coefficient or granting every Command free defense. A three-Thrall turn gains 9 protection; a cleared board gets none. Campaign risk: preserved armies become safer, and easy fights may become too forgiving.
- **Deathwish:** first Attack played on own turn while at or below 40% max HP grants ceil 5% maxHP Barrier before the Attack resolves, once per own turn. Keep the ramp/rescue; no healing or invulnerability. At 528 HP this is 27 Barrier, at 88 it is 5. Must check safe self-payment cycling and multi-hit opponents; this is a candidate, not a proven fix.

No Golemancer summon refund, minion HP multiplier, blanket summon damage buff or removal of HP-scaled companion damage. No universal forced-minion targeting. Paladin/Marshal/Trapmaster need observed matchup weaknesses before bespoke growth is added; A- is not evidence that their ideas are flawed.

## Class-pool checks and distinct identities

| Class | Late-game access and identity | Review priority |
|---|---|---|
| Knight | Barrier conversion, Reserves attacks, HP-payment retaliation | Distinguish bounded passive bonuses from Scent/blood-resource chains; first two styles need practical finishers. |
| Engineer | Many bodies/replacements, large HP investment, personal multi-hit weapons | Shared healing/card payoffs matter across all three; Golemancer is not dependent only on +3 HP. Test bypass versus Taunt. |
| Hunter | Shared Might pack, blood-payment tempo, draw-fed Primed | Survival and resources as well as full-pack damage; early burst versus replacement costs. |
| Trickster | Reactive traps, suit-driven Mana, focused marked-target attacks | Full Trick belongs to all; Cut the Deck cycling is a pool concern. Traps are opponent-trigger dependent. |
| Rogue | Extra Daggers, faster damage-over-time, Skill-fed execution | Rush of Blood and draw access can support all three; cleanse affects Bloodletter differently from Assassin. |
| Shaman | Passive Spirit row, active command/push row, mixed elements | Totems are not targetable companions; Spirit Pact stacking and Storm Sovereign command damage are secondary watch items. |
| Monk | Serene resources, Fury combat rhythm, frequent Radiant | Same base stance engine supports distinct choices. Morning Prayer and Mana refunds determine Radiant frequency. |
| Spellblade | Retained-Power Swords, spent-Power spells, permanent Fracture | Blade extra hits, Measured Ruin and Fault Lines amplify different resources. Avoid homogenizing all into flat damage. |
| Necromancer | Living Thrall investment, execution pressure, Consume/Reap | Grave Chill and generated Gravesouls affect every path. Preserve Consume offense while separating large-chain growth from defense. |
| Drunkard | Paid sustain, Precision guns, low-HP aggression | Percentage healing has an Arena advantage; low HP has an Arena liability against burst/Fate. Gun access is not automatic. |

## HP, targeting, seat advantage and real time

| Class | Base HP | Arena first seat | Arena second seat |
|---|---|---|---|
| Knight | 80 | 480 | 540 |
| Engineer | 70 | 420 | 480 |
| Hunter | 80 | 480 | 540 |
| Trickster | 80 | 480 | 540 |
| Rogue | 75 | 450 | 510 |
| Shaman | 75 | 450 | 510 |
| Monk | 78 | 468 | 528 |
| Spellblade | 75 | 450 | 510 |
| Necromancer | 70 | 420 | 480 |
| Drunkard | 88 | 528 | 588 |

Keep 6x hero HP/+60 second seat while collecting evidence. Flat HP payments become much cheaper proportionally: Crimson Offering's6 costs 1.25% of 480 versus 7.5% of 80. Percentage Fate/healing retain their relative strength. The second-seat 60 is 14.3% of 420 or 12.5% of 480; its interaction with first-turn tempo and percentage effects needs both-seat comparisons.

The 20-minute limit provides 60 seconds average per alternating turn over ten rounds, or about 42.9 seconds over fourteen. At 75 seconds every turn, ten rounds take 25 minutes and fourteen 35. Therefore 20 minutes improves room for longer fights but cannot guarantee the target. Timeout compares current/max hero HP, excluding Barrier, board and Fate; a healthy-looking hero near Fate execution can still win the clock. Engine sudden death begins around round 51, far beyond the target; it is not a ten-round anti-stall system. Keep timeout outcome tracking separate from combat victories before changing its rules.

Ordinary aimed Arena attacks may select the opposing hero unless Taunt limits targets. Human and ghost legal actions use the same rule; bot choices are not equivalent to human decisions. Many Campaign scripts prefer companions. A minion's protection value is therefore mode/encounter dependent. Totems occupy a separate non-attackable row. Preserve these differences in comparisons rather than assigning every unit the same defensive value.

The timer change requires the server deployment as well as the updated client/release. Existing server code computes restored rooms' deadline from their saved start time plus GAME_MS, so live rooms restored under the new code receive the longer deadline too. Combat rules 79 need no bump for this server clock change; card proposals would require a rules update and the existing unfinished-fight migration policy if approved.

## Validation before asserting A-band parity

1. Use actual player decks/replays at comparable size, upgrades and rare counts. For Golemancer record the unit, tier, turn reaching 100/160 HP, current/max HP, growth sources, HP-conversion cards, hero survival and recovery after true removal. Record observations that fail to build the engine too.
2. Test all 30 styles against pressure, removal/Taunt, cleanse, sustain and long growth, in both seats. Start with Golemancer HP-conversion versus direct hero pressure, Soulreaper versus cleanse/diversions, Shatterer versus prevention/Barrier, Archmage versus early pressure, and Brewmaster versus Fate. Keep human and ghost results separate.
3. Track each player's started turns including the lethal turn, elapsed time, winner, seat, timeout/disconnect/forfeit, engine setup turn and deck quality. Existing exports' endedTurns counts both players' accepted End turn actions; do not divide it blindly into final round count. It does not supply elapsed time or per-seat lethal-turn counts; inspect replays/record timing until instrumentation is extended.
4. Initial acceptance target: typical comparable games in the proposed 10–14 own-turn band, few uncontested early blowouts, and few forced clock wins. Review medians and distributions, not an average hiding five-turn kills and twenty-turn stalls. For at least 30 relevant games per style, decisive win rates outside 45–55% or large seat/matchup gaps are warning flags, not proof of imbalance or parity.
5. Separately test Campaign IV–X, XI–XVI and XVII–XX with realistic acquisition and Boons. Check setup deaths, boss kills and between-fight attrition, especially P2/P3/P4/P5. I–III has no Ascendancy; test class starts separately. Strong arena rarity access does not demonstrate a reliable Campaign draft.
6. Reassess after each priority group; append the next history snapshot with actual denominators and corrections. Implement targeted regression tests for triggers, caps, upgrade values, owner-round resets, stacking and previews if proposals are approved. Do not tune enemy damage at the same time or describe passing fixtures as A-tier balance.

The recommendation is a narrower set of shared-rule changes plus real comparison, not thirty redesigned passives or Arena-only balancing by default. If a specific shared mechanic remains incompatible after testing, an Arena-specific adjustment can then be evaluated with evidence.
