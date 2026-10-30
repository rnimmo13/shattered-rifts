# Shaman: hand-priced cost analysis (2026-10-29)

Priced with `docs/14_CARD_COSTING.md`: §15 "The Shaman: the totem cycle" (DECISIONS #430) for totems, commands, plants and Spirit,
§1-§12 for everything else. Budgets come from `tools/src/ledger/common.ts` (`budgetOf`): 1-cost common 10, then +9 a Mana; basic x0.8,
uncommon x1.12, rare x1.25; Consume +25%; an Aura is its cost's budget x1.5 (uncommon) or x2 (rare) over four turns.
Deviation = (price - budget) / budget. Verdicts: on budget within ±15%, strong +15 to +40%, broken above +40%, weak -15 to -40%,
dead below -40%. "(cond.)" marks a card whose value depends on a setup; it is priced at the guide's expected value.
No sims were run. No game code or docs were changed.

## Where the ledger stands

`tools/src/ledger/write.ts shaman` runs clean: **91 cards, 89 within ±15%** (the two outside are Tidecaller and Wind Whisper, both
with a reason). The only Shaman decisions after #430 (#438, #439, #447, #448) are UI changes, so every live card text matches the
ledger. I kept the ledger's price wherever it still holds. These are the prices I changed, and why:

- **The "help" is gone.** Twin Cinders, Chain Lightning, Storm Front and Maelstrom still counted the totems' help on the first spell
  of an element (#420-#422), which #430 removed (`spellBoost` reads `boost`, and no live totem has one). I swapped it for the Hawk's
  Primed landing on the extra hits. The prices barely move.
- **Faltering or Exposed on ALL enemies** is now 4.5 a stack (§4). The ledger used 3.9. This affects Hoarfrost, Winter's Embrace,
  Glacial Fortress, Avalanche and Absolute Zero.
- **Reverb** is ~12 (§5), not 9, so Phoenix Feather is 15.
- **Element triggers** (Smoulder, Heart of the Pyre, Lightning Rod) are counted at **1.5 spells a turn in the deck that wants them**
  (§7: "count how often X happens per turn in the deck that wants it"). The ledger used 1.2, which is closer to a mixed or starter
  deck. Frostbound is counted at ~1.7 debuffs a turn, because Faltering on ALL enemies and Burn each count once per enemy.
- **Spirit read by a card** (Spirit Lance, Spiritstorm) is counted at **~2**, the §15 mid-fight figure. The ledger used 3-3.5.
- Ember Lance is counted as played first ~70% of the time (you hold it until you can), not 35%. Spirit Walk draws 2 (3 + 4).
  Thunderbird's Cry and Bear's Guard now take off the passive they actually lose.

## Grades

| | |
|---|---|
| Cards on budget | **83 / 91 (91%)** |
| Broken / strong / weak / dead | **0 / 6 / 2 / 0** |
| Mean deviation | **+1.1%** |
| Spread (standard deviation) | **10.1 points** |
| Flame (17 cards) | mean +2.3%, 13 on budget (Smoulder, Heart of the Pyre and Phoenix Feather are strong; Spirit Lance is weak) |
| Frost (16) | mean +1.7%, 14 on budget (Frostbound and Absolute Zero are strong) |
| Storm (18) | mean -2.7%, 18 on budget |
| Glue: totems, commands, Spirit, utility (40) | mean +2.1%, 37 on budget (Tidecaller is strong; Spiritstorm is weak; Wind Whisper sits exactly on -15%) |

- **Letter grade: A.** At least 80% of cards are on budget, none is broken or dead, and the starter deck and all four build paths work
  (see below). The grade comes with two things to watch that the per-card points can't see: Spirit growing without limit in long
  fights, and a starter that is strong because of its trait. Both are covered in the starter and Spirit sections below.
- **Power level: fair, slightly over.** The mean is +1%. The strong cards are all Flame and Frost payoffs; Storm sits slightly under.
- **Consistency: A, tight.** The spread is about 10 points and no card is off by more than 40%. Upgrades all add between +8% and +47%.
  None goes past +50%.

## The 8 biggest outliers, with suggested fixes (suggestions only, not applied)

| # | Card | Dev | Problem | Suggested fix |
|---|---|---|---|---|
| 1 | **Smoulder** (1, uncommon Aura) | +40% (upgrade +87% over budget) | 3 Burn on every Flame spell. In a Flame deck that is ~6 triggers over four turns, and it feeds Pyroclasm, Firebrand, Flashpoint and Wildfire. It is also a multiplier: Smoulder, then Wildfire (double the Burn, +10), then Flashpoint (+3 per Burn) gives 40+ damage from two 1-cost cards (§8 test 2). | 2 Burn (2+ gives 3), or make it "the first Flame spell each turn". |
| 2 | **Heart of the Pyre** (1, rare Aura) | +35% | 5 to a random enemy on every Flame spell. Its damage is flat (unaffected by Might, Primed or Exposed), but it adds up fast with Kindle (0 cost). | 4 damage (upgrade 5), or make it cost 2. |
| 3 | **Tidecaller** (1, common) | +24% | 7 Barrier plus 1 Mana next turn. The guide already flags it (§9) as a known strong baseline copy. | Leave it as a reference card, or make it 5 Barrier. |
| 4 | **Frostbound** (1, rare Aura) | +23% (upgrade +63%) | A debuff on ALL enemies triggers it once per enemy. Calm Before the Storm puts Sapped on every enemy every turn, so with both in play that is ~9-11 Barrier a turn for no cards (§8 test 2). | Make it "the first time each turn you debuff an enemy: gain 5 Barrier", or count each card once. Upgrade to 4 only with that cap. |
| 5 | **Phoenix Feather** (1, rare) | +20% | Reverb on his big Flame hits (Inferno 30 + 3 Burn, Flame Spear 18) is worth more than the guide's ~12. It is also a Flame spell itself, so it triggers Smoulder and Heart of the Pyre. | Make it 2 cost with draw 2, or have it lose its Flame tag (then it no longer feeds the Flame Auras). |
| 6 | **Absolute Zero** (2, rare) | +17% (upgrade only +14%) | It hits every enemy for +3 per Faltering on each, then adds 2 Faltering to all. Its strength is in the base card; the upgrade adds little. | 9 to ALL as the base, 13 to ALL as the upgrade (the upgrade then adds ~+30%). |
| 7 | **Spirit Lance** (1, uncommon) | -20% | 7 + Spirit. At the ~2 Spirit of mid-fight that is 9 for an uncommon. It only catches up in a long fight with a Hawk deck. | 8 (+1 per Spirit), or (+2 per Spirit) with a base of 6. |
| 8 | **Spiritstorm** (1, rare) | -17% | (6 + Spirit) to ALL. Same problem as Spirit Lance, and a rare. | 7 (+1 per Spirit) to ALL, or +2 per Spirit. |

**Two design outliers the per-card points miss:**

- **Totem Circle versus Great Spirit's Call.** At guide rates, Totem Circle (2, uncommon: plant a Hawk, a Bear and a Thunderbird) is
  +13% and Great Spirit's Call (3, rare: command every totem, +5 Barrier) is -9%. But he starts with a full row of three, and into a
  full row Circle pushes out all three totems: three acts (~32 at 2 Spirit), and the row is full again. Great Spirit's Call gives the
  same three acts for a Mana more, then leaves the row empty. Priced on the full-row case, Circle is about +40-50% and Great Spirit's
  Call reads weak. Suggested fix: make Circle cost 3 (or plant two totems), or have Great Spirit's Call also plant a random totem.
- **Spirit Call is weak in the starter.** He has no plants there, so commanding the Hawk trades the Hawk's 2 Primed a turn for +1 on
  the Bear and the Thunderbird. That is roughly even, worth ~3-5 points over the rest of a 5-turn fight against a basic budget of 8.
  The second and third commands then empty the row for good. It is priced at the guide's 8 because in a deck with plants it is a fine
  card. Suggested fix: make the starter's command "Command your front totem, then plant a random totem", or swap one Strike for Hawk
  Feather, so the starter teaches the cycle.

## The starter deck

The starter is Strike x2, Defend, Spirit Call, Ember Bolt x2, Frost Ward x2 and Forked Lightning x2. Every card costs 1, so he plays
3 of his 5 cards a turn. His trait plants a Hawk, a Bear and a Thunderbird before turn 1.

Per card, on average: 3.85 damage (one enemy; Forked Lightning hits a lone enemy once at 125%, 6.25), 1.5 Barrier and ~0.2
Faltering. The totem passives, at the end of each of his turns: the Thunderbird hits 3 to 2 enemies (3.75 on one enemy), the Bear
gives 2 Barrier, and the Hawk gives 2 Primed, used by the next turn's first attack (+2, or +4 on Forked Lightning against two enemies).

| Turn | Damage (1 enemy) | Damage (3 enemies, total) | Barrier | Notes |
|---|---|---|---|---|
| 1 | ~15 (11.6 cards + 3.75 Thunderbird) | ~20 | ~6.5 (4.5 + Bear 2) | No Primed yet |
| 2 | ~17 (+2 Primed) | ~23 | ~6.5 | Spirit Call is usually in hand by now |
| 3 | ~16-17 | ~22 | ~6.5-7.5 | If the Hawk was commanded on turn 2: Spirit 1, the Bear gives 3, the Thunderbird 4 x2, and no more Primed |

That comes to **~26-27 points a turn** (17 damage + 6.5 Barrier x1.2 + ~1.8 Faltering). The guide's baseline for a Strike/Defend
starter is ~18-19 points a turn (three basics at ~6.2), and a full turn of commons is 28. His basics are slightly richer than
Strike/Defend (7.4 a card on average). Most of the gap is **the trait: three totem passives worth ~9.6 points a turn** (§15:
2.1 + 2.4 + 5.1), which is about one free extra card every turn and roughly twice the 4-5 a turn of the other traits priced in §15.
**The starter works and is on the strong side.** The strength sits in the trait, not the cards. Spirit stays at 0-1 in the starter
(the only Spirit is the Hawk, commanded once), so it doesn't snowball until he drafts plants and Hawks.

## The elements and the totem build

- **Flame (single-target burst, Burn): strongest, and the best against bosses.** Its commons are on budget, and its strong cards
  are all here: Smoulder, Heart of the Pyre and Phoenix Feather. Burn ignores Barrier, and Inferno, Flame Spear and Pyroclasm put
  everything into one target. The Smoulder + Wildfire + Flashpoint chain is the one real multiplier in the pool (outlier 1).
- **Frost (Barrier, Faltering): sound defence, thin damage.** It is on budget except Frostbound and Absolute Zero. Faltering is a
  percentage, so it gains value against bosses and higher tiers (§8 test 4), and Glacial Fortress is a good boss wall. Its damage is
  Frost Needle, Chill Touch, Ice Shatter, Avalanche and Absolute Zero, so a pure Frost deck kills slowly. It wants the Thunderbird or
  a second element. It works as a build path, not as a solo plan.
- **Storm (all enemies, Forks, Gathering Storm): fair in hallway fights, weakest against bosses.** All 18 cards are on budget, with
  a mean of -2.7%. Against one enemy, damage to ALL (priced x1.3) is worth x1.0, so it loses ~23%. A Fork 2 (priced x1.7) is worth
  x1.25, so it loses ~26%. Against a lone boss with no minions, Storm plays at about 75-80% of its price. Gathering Storm and Tempest
  Call need a long fight to pay off, which partly makes up for it.
- **Totems, commands and Spirit (40 glue cards): on budget and it works.** It plants, commands and cycles cleanly. Harmony, Totem
  Drum, Storm Sovereign and Spirit Chorus price on budget at ~1.3 acts a turn. Spirit Chorus empties the row in three turns without
  plants, so it is conditional on plants. Watch Totem Circle (above). The Elder Tree (+1 Mana a turn) is on budget at 3 Mana. Its
  upgrade (+draw 1, +9%), and those of the Moon Owl (+11%) and Spirit Chorus (Opening hand, +8%), are thin for rares.

## Spirit has no cap: does it grow out of hand?

**In a normal 4-6 turn fight it doesn't. In a long boss fight with a Hawk deck it does.**

- Each Spirit adds +1 to every totem number. With the usual three totems standing that is about +4-5 points a turn: the Bear's
  passive +1.2, the Thunderbird's +1.25 to 1.7, the Hawk's Primed +1-1.3, and +1 on every act. The §15 rate of ~10 a Spirit assumes
  ~3 turns left, which is right for hallway fights.
- Spirit comes only from a Hawk leaving the row (a command or a push-out), Spirit Surge and Spirit Walk. A Hawk deck (Hawk Call, Hawk
  Feather, Talon Strike, Totem Circle, Rally the Spirits on a Hawk) makes about 0.7-1 Spirit a turn. Nothing loops for free, since
  every Hawk costs a card and usually a Mana.
- Over a 10-turn boss fight that means Spirit ~6-9. At 8 Spirit, against one boss, the passives alone come to ~12 Barrier (Bear),
  ~14 damage (Thunderbird) and +10 Primed (Hawk): **~35 points a turn for no cards, more than his whole 3-Mana hand (28)**, before any
  command (now 14-16 each) or Storm Sovereign. Because Spirit grows every turn and each point pays every turn after, the output grows
  with the square of the fight's length. The Hawk's Primed on a two-hit AoE (Superstorm 12 x2 to ALL) adds 2 x (2+S) on each enemy.
- **Verdict:** this is the class's biggest balance risk, and per-card pricing can't show it (§8 test 3). Suggestions only: cap Spirit
  at 5, or make each Spirit add +1 per 2 (as the old totem help did), or limit Spirit from Hawks to 1 a turn. Any of these keeps
  the hallway pricing (~10 a Spirit) and stops the boss-fight snowball.

## Against bosses, in short

- **Flame:** best. It is single-target, and Burn ignores Barrier.
- **Frost:** survives well, because Faltering scales with the boss's damage, but kills slowly.
- **Storm:** loses ~20-25% of its value against a lone boss.
- **Totem/Spirit decks:** the strongest in any fight past ~7 turns, because of the uncapped Spirit.

## Full table

Price and budget are in points. "Upgrade dev" is the "+" card's points against the base card's budget, followed by how much the
upgrade adds over the base card.

| Card | Cost | Rarity | Text | Price | Budget | Dev % | Verdict | How it is priced | Upgrade dev |
|---|---|---|---|---|---|---|---|---|---|
| **Flame** |||||||||||
| Kindle | 0 | common | Flame. Deal 6 damage. | 6 | 6 | +0% | on budget | 6 | +33% (upgrade adds 33%) |
| Searing Lash | 1 | common | Flame. Deal 8 damage. Apply 2 Burn. | 10 | 10 | +0% | on budget | 8 + 2 Burn 1.95 | +30% (upgrade adds 30%) |
| Firebrand | 1 | common | Flame. Deal 7 damage. If the target is Burning: Deal 4 damage. | 9 | 10 | -10% | on budget (cond.) | 7 + 4 if the target bleeds (x0.5) | +20% (upgrade adds 33%) |
| Twin Cinders | 1 | common | Flame. Deal 4 damage 2 times. | 9 | 10 | -10% | on budget (cond.) | 4x2 = 8 + the Hawk's Primed on the 2nd hit (~1); the old spell help is gone since #430 | +30% (upgrade adds 44%) |
| Flare | 1 | common | Flame. Deal 10 damage. | 10 | 10 | +0% | on budget | 10 | +30% (upgrade adds 30%) |
| Flame Spear | 2 | common | Flame. Deal 18 damage. | 18 | 19 | -5% | on budget | 18 | +21% (upgrade adds 28%) |
| Talon Strike | 2 | common | Flame. Deal 11 damage. Plant a Hawk. | 19 | 19 | +0% | on budget | 11 + plant a Hawk 8 | +16% (upgrade adds 16%) |
| Wildfire | 1 | uncommon | Flame. Deal 9 damage. Double the Burn on the target (at most +10). Consume. | 12.9 | 14 | -8% | on budget (cond.) | 9 + doubling ~3 Bleed already there (at most 10 more) ~3.9 | +14% (upgrade adds 23%) |
| Ember Lance | 1 | uncommon | Flame. Deal 10 damage. If it is the first card you play this turn: Deal 3 damage. | 12.1 | 11.2 | +8% | on budget (cond.) | 10 + 3 x ~0.7 (played first when held) | +35% (upgrade adds 25%) |
| Spirit Lance | 1 | uncommon | Flame. Deal 7 (+1 per Spirit) damage. | 9 | 11.2 | -20% | weak (cond.) | 7 + Spirit at ~2 mid-fight (§15) | +7% (upgrade adds 33%) |
| Smoulder | 1 Aura | uncommon | Whenever you play a Flame spell: Apply 3 Burn to a random enemy. | 21 | 15 | +40% | strong (cond.) | 4 turns x 1.5 Flame spells (a Flame deck) x 3 Burn on a stack ~3.5 | +87% (upgrade adds 33%) |
| Immolate | 2 | uncommon | Flame. Deal 14 damage. Apply 4 Burn. | 20.5 | 21.28 | -4% | on budget | 14 + 4 Burn 6.5 | +15% (upgrade adds 20%) |
| Pyroclasm | 2 | uncommon | Flame. Deal 16 damage. If the target is Burning: Deal 8 damage. | 20 | 21.28 | -6% | on budget (cond.) | 16 + 8 if Burning (x0.5) 4 | +17% (upgrade adds 25%) |
| Phoenix Feather | 1 | rare | Flame. Gain 1 Reverb. Draw 1 card. | 15 | 12.5 | +20% | strong (cond.) | Reverb ~12 (guide §5) + draw 3 | +52% (upgrade adds 27%) |
| Flashpoint | 1 | rare | Flame. Deal 4 (+3 per Burn on the target) damage. Consume. | 16 | 15.63 | +2% | on budget (cond.) | 4 + 3 a Bleed (~4 in a Flame deck) | +28% (upgrade adds 25%) |
| Heart of the Pyre | 1 Aura | rare | Whenever you play a Flame spell: Deal 5 damage to a random enemy. | 27 | 20 | +35% | strong (cond.) | 4 turns x 1.5 Flame spells x 5 random (4.5) | +62% (upgrade adds 20%) |
| Inferno | 3 | rare | Flame. Deal 30 damage. Apply 3 Burn. | 33.9 | 35 | -3% | on budget | 30 + 3 Bleed 3.9 | +20% (upgrade adds 24%) |
| **Frost** |||||||||||
| Frost Needle | 0 | common | Frost. Deal 3 damage. Apply 1 Faltering. | 6 | 6 | +0% | on budget | 3 + 1 Faltering 3 | +33% (upgrade adds 33%) |
| Rime Shield | 1 | common | Frost. Gain 8 Barrier. | 9.6 | 10 | -4% | on budget | 8 Barrier | +32% (upgrade adds 38%) |
| Chill Touch | 1 | common | Frost. Deal 6 damage. Apply 1 Faltering. | 9 | 10 | -10% | on budget | 6 + 1 Faltering 3 | +20% (upgrade adds 33%) |
| Hoarfrost | 1 | common | Frost. Gain 5 Barrier. Apply 1 Faltering to ALL enemies. | 10.5 | 10 | +5% | on budget | 5 Barrier 6 + 1 Faltering to ALL 4.5 (guide §4) | +41% (upgrade adds 34%) |
| Bear Call | 1 | common | Frost. Plant a Bear. Gain 2 Barrier. | 10.4 | 10 | +4% | on budget | plant a Bear 8 + 2 Barrier 2.4 | +40% (upgrade adds 35%) |
| Glacier Guard | 1 | uncommon | Frost. Gain 6 Barrier. Next turn, gain 4 Barrier. | 11.2 | 11.2 | +0% | on budget | 6 Barrier 7.2 + 4 next turn 4 | +39% (upgrade adds 39%) |
| Frozen Grasp | 1 | uncommon | Frost. Apply 2 Faltering. Gain 4 Barrier. | 10.8 | 11.2 | -4% | on budget | 2 Faltering 6 + 4 Barrier 4.8 | +29% (upgrade adds 33%) |
| Ice Shatter | 1 | uncommon | Frost. Deal 6 (+3 per Faltering on the target) damage. | 11.4 | 11.2 | +2% | on budget (cond.) | 6 + 3 a Faltering on the target (~1.8 in a Frost deck) | +29% (upgrade adds 26%) |
| Ice Mirror | 1 | uncommon | Frost. Gain 6 Barrier. Until your next turn, attack damage your Barrier soaks is dealt back to the attacker. | 11.2 | 11.2 | +0% | on budget (cond.) | 6 Barrier 7.2 + soaked damage dealt back ~4 | +32% (upgrade adds 32%) |
| Hail Rite | 1 Aura | uncommon | At the end of your turn: If you have a Bear: Gain 4 Barrier. | 16.3 | 15 | +9% | on budget (cond.) | 4 turns x a Bear (~85%) x 4 Barrier 4.8 | +36% (upgrade adds 25%) |
| Ice Wall | 2 | uncommon | Frost. Gain 16 Barrier. | 19.2 | 21.28 | -10% | on budget | 16 Barrier | +13% (upgrade adds 25%) |
| Frostbound | 1 Aura | rare | Whenever you put a debuff on an enemy: Gain 3 Barrier. | 24.5 | 20 | +23% | strong (cond.) | 4 turns x ~1.7 debuffs (ALL-Faltering counts each enemy; Burn counts) x 3.6 | +63% (upgrade adds 33%) |
| Winter's Embrace | 2 | rare | Frost. Gain 12 Barrier. Apply 2 Faltering to ALL enemies. | 23.4 | 23.75 | -1% | on budget | 12 Barrier 14.4 + 2 Faltering to ALL 9 | +14% (upgrade adds 15%) |
| Avalanche | 2 | rare | Frost. Deal 14 damage to ALL enemies. Apply 1 Faltering to ALL enemies. | 22.7 | 23.75 | -4% | on budget | 14 ALL 18.2 + 1 Faltering ALL 4.5 | +17% (upgrade adds 23%) |
| Absolute Zero | 2 | rare | Frost. Deal 10 (+3 per Faltering on each) damage to ALL enemies. Apply 2 Faltering to ALL enemies. | 27.9 | 23.75 | +17% | strong (cond.) | 10 ALL 13 + 3 x ~1.5 Faltering x1.3 5.9 + 2 Faltering ALL 9 | +34% (upgrade adds 14%) |
| Glacial Fortress | 3 | rare | Frost. Gain 22 Barrier. Apply 2 Faltering to ALL enemies. | 35.4 | 35 | +1% | on budget | 22 Barrier 26.4 + 2 Faltering to ALL 9 | +22% (upgrade adds 20%) |
| **Storm** |||||||||||
| Spark Fork | 0 | common | Storm. Deal 4 damage to 2 different random enemies (25% more when only one enemy stands). | 6.8 | 6 | +13% | on budget | Fork 2 of 4 (x1.7) | +42% (upgrade adds 25%) |
| Gathering Storm | 1 | common | Storm. Deal 4 damage to ALL enemies. Every copy of this card gains 3 damage for the rest of the fight. | 9.9 | 10 | -1% | on budget (cond.) | 4 to ALL 5.2 + every copy +3 (3 x1.2 x1.3) 4.7 | +25% (upgrade adds 26%) |
| Chain Lightning | 1 | common | Storm. Deal 3 damage to a random enemy 3 times. | 10 | 10 | +0% | on budget (cond.) | 3x3 random 8.1 + Primed on 2 more hits ~1.9 (help gone) | +27% (upgrade adds 27%) |
| Gale Call | 1 | common | Storm. Deal 5 damage to ALL enemies. Draw 1 card. | 9.5 | 10 | -5% | on budget | 5 to ALL 6.5 + draw 3 | +34% (upgrade adds 41%) |
| Wind Wall | 1 | common | Storm. Gain 5 Barrier. Apply 2 Sapped to ALL enemies until the end of their next turn. | 9.1 | 10 | -9% | on budget | 5 Barrier 6 + 2 Sapped on ALL 3.1 | +27% (upgrade adds 40%) |
| Thunderbird Call | 2 | common | Storm. Deal 8 damage to ALL enemies. Plant a Thunderbird. | 18.4 | 19 | -3% | on budget | 8 to ALL 10.4 + plant a Thunderbird 8 | +17% (upgrade adds 21%) |
| Storm Front | 1 | uncommon | Storm. Deal 3 damage 2 times to ALL enemies. Draw 1 card. | 11.8 | 11.2 | +5% | on budget (cond.) | 3x2 ALL 7.8 + Primed on the 2nd hit ~1 + draw 3 (help gone) | +29% (upgrade adds 22%) |
| Tempest Call | 1 | uncommon | Storm. Every Gathering Storm you have deals 2 more damage for the rest of the fight (with none, one is added to your hand). Draw 1 card. | 10.8 | 11.2 | -4% | on budget (cond.) | Gathering Storms +2 (2 copies x ~1.5 casts x1.3) 7.8 + draw 3 | +31% (upgrade adds 36%) |
| Static Veil | 1 | uncommon | Storm. Gain 6 Barrier. Apply 3 Sapped to ALL enemies until the end of their next turn. | 11.9 | 11.2 | +6% | on budget | 6 Barrier 7.2 + 3 Sapped on ALL 4.7 | +38% (upgrade adds 30%) |
| Lightning Rod | 1 Aura | uncommon | Whenever you play a Storm spell: Deal 3 damage to a random enemy. | 16.2 | 15 | +8% | on budget (cond.) | 4 turns x 1.5 Storm spells x 3 random (2.7) | +44% (upgrade adds 33%) |
| Thunder Roost | 1 Aura | uncommon | At the start of your turn: If you have a Thunderbird: Deal 3 damage to ALL enemies. | 13.3 | 15 | -11% | on budget (cond.) | 4 turns x a Thunderbird (~85%) x 3 ALL 3.9 | +18% (upgrade adds 33%) |
| Thunder Fork | 2 | uncommon | Storm. Deal 10 damage to 3 different random enemies (25% more when only one enemy stands). | 20 | 21.28 | -6% | on budget | Fork 3 of 10: ~2.0 targets worth (0.4 x1.25 + 0.6 x ~2.4 enemies) | +22% (upgrade adds 30%) |
| Thunderclap | 2 | uncommon | Storm. Deal 15 damage to ALL enemies. | 19.5 | 21.28 | -8% | on budget | 15 to ALL | +16% (upgrade adds 27%) |
| Charged Sky | 2 | uncommon | Storm. Deal 10 damage to ALL enemies. Apply 2 Exposed to ALL enemies. | 20.8 | 21.28 | -2% | on budget | 10 to ALL 13 + 2 Exposed on ALL 7.8 | +16% (upgrade adds 19%) |
| Calm Before the Storm | 1 Aura | rare | At the start of your turn: Apply 3 Sapped to ALL enemies until the end of their next turn. | 18.7 | 20 | -7% | on budget | 4 turns x 3 Sapped on ALL 4.7 | +25% (upgrade adds 34%) |
| Maelstrom | 2 | rare | Storm. Deal 8 damage 2 times to ALL enemies. | 22.4 | 23.75 | -6% | on budget (cond.) | 8x2 ALL 20.8 + Primed on the 2nd hit ~1.6 | +16% (upgrade adds 23%) |
| Eye of the Tempest | 2 | rare | Storm. Deal 11 damage to 4 different random enemies (25% more when only one enemy stands). | 21.5 | 23.75 | -9% | on budget | Fork 4 of 11 (0.4 x1.25 + 0.6 x ~2.4 enemies = ~1.95) | +15% (upgrade adds 27%) |
| Superstorm | 3 | rare | Storm. Deal 12 damage 2 times to ALL enemies. | 31.2 | 35 | -11% | on budget | 12 x2 to ALL (x1.3) | +11% (upgrade adds 25%) |
| **Glue (totems, Spirit, utility)** |||||||||||
| Ember Bolt | 1 | basic | Flame. Deal 7 damage. | 7 | 8 | -12% | on budget | 7 | +25% (upgrade adds 43%) |
| Frost Ward | 1 | basic | Frost. Gain 5 Barrier. Apply 1 Faltering to a random enemy. | 8.7 | 8 | +9% | on budget | 5 Barrier 6 + 1 Faltering on a random enemy 2.7 | +54% (upgrade adds 41%) |
| Forked Lightning | 1 | basic | Storm. Deal 5 damage to 2 different random enemies (25% more when only one enemy stands). | 8.5 | 8 | +6% | on budget | Fork 2 of 5: ~1.7 targets worth (40% of fights one enemy at +25%, 60% two or more: 0.4 x1.25 + 0.6 x2 = 1.7) | +49% (upgrade adds 40%) |
| Spirit Call | 1 | basic | Command your front totem. | 8 | 8 | +0% | on budget (cond.) | command the front totem ~8 (its act ~10.7 at ~2 Spirit, less the passive it no longer gives) | +45% (upgrade adds 45%) |
| Hawk Feather | 0 | common | Plant a Hawk. Consume. | 8 | 7.5 | +7% | on budget | plant a Hawk 8 | +55% (upgrade adds 45%) |
| Bear Hide | 0 | common | Plant a Bear. Consume. | 8 | 7.5 | +7% | on budget | plant a Bear 8 | +55% (upgrade adds 45%) |
| Storm Feather | 0 | common | Plant a Thunderbird. Consume. | 8 | 7.5 | +7% | on budget | plant a Thunderbird 8 | +55% (upgrade adds 45%) |
| Call Again | 0 | common | Command your front totem. Consume. | 8 | 7.5 | +7% | on budget (cond.) | command the front totem 8 | +55% (upgrade adds 45%) |
| Turn the Wheel | 0 | common | Your front totem moves to the back. Draw 1 card. Discard 1 card. Gain 3 Barrier. | 6.1 | 6 | +2% | on budget (cond.) | the front totem to the back ~1.5 (choose the next to act) + draw/discard ~1 + 3 Barrier 3.6 | +42% (upgrade adds 39%) |
| Wind Whisper | 0 | common | Draw 1 card. Discard 1 card. Gain 3 Barrier. | 5.1 | 6 | -15% | on budget | draw 1, discard 1 ~1.5 + 3 Barrier 3.6 | +25% (upgrade adds 47%) |
| Hawk Call | 1 | common | Plant a Hawk. Draw 1 card. | 11 | 10 | +10% | on budget | plant a Hawk 8 + draw 3 | +46% (upgrade adds 33%) |
| Raise a Totem | 1 | common | Plant a random totem. Gain 2 Barrier. | 9.9 | 10 | -1% | on budget | plant a random totem 7.5 + 2 Barrier 2.4 | +35% (upgrade adds 36%) |
| Spirit Ward | 1 | common | Gain 2 Barrier. Command your front totem. | 10.4 | 10 | +4% | on budget (cond.) | 2 Barrier 2.4 + command the front totem 8 | +40% (upgrade adds 35%) |
| Hawk's Dive | 1 | common | Command your first Hawk. Gain 2 Barrier. | 10.4 | 10 | +4% | on budget (cond.) | command the first Hawk: 1 Spirit 10, less its Primed 2 + 2 Barrier 2.4 | +40% (upgrade adds 35%) |
| Bear's Guard | 1 | common | Command your first Bear. Gain 3 Barrier. | 10.8 | 10 | +8% | on budget (cond.) | act 8 Barrier 9.6 less passive 2.4 + 3 Barrier 3.6 | +44% (upgrade adds 33%) |
| Thunderbird's Cry | 1 | common | Command your first Thunderbird. | 10.3 | 10 | +3% | on budget (cond.) | act 8+2 to ALL 13 less ~2.7 passive | +33% (upgrade adds 29%) |
| Stone Skin | 1 | common | Gain 9 Barrier. | 10.8 | 10 | +8% | on budget | 9 Barrier | +44% (upgrade adds 33%) |
| Tidecaller | 1 | common | Gain 7 Barrier. Next turn, gain 1 extra Mana. | 12.4 | 10 | +24% | strong | 7 Barrier 8.4 + 1 Mana next turn 4 | +60% (upgrade adds 29%) |
| Read the Winds | 1 | common | Foresee 3. Gain 4 Barrier. | 8.8 | 10 | -12% | on budget | Foresee 3 (3 + 1) + 4 Barrier 4.8 | +24% (upgrade adds 41%) |
| Spirit Strike | 2 | common | Deal 11 damage. Command your front totem. | 19 | 19 | +0% | on budget (cond.) | 11 + command the front totem 8 | +21% (upgrade adds 21%) |
| Raise the Pole | 1 | uncommon | Gain a totem position. Gain 5 Barrier. Draw 1 card. | 12 | 11.2 | +7% | on budget | a position ~3 (one more totem working) + 5 Barrier 6 + draw 3 | +39% (upgrade adds 30%) |
| Last Called | 1 | uncommon | Command your newest totem. Draw 1 card. | 11 | 11.2 | -2% | on budget (cond.) | command the newest 8 + draw 3 | +41% (upgrade adds 44%) |
| Totem Strike | 1 | uncommon | Deal 2 (+3 per totem you have) damage. | 10.1 | 11.2 | -10% | on budget (cond.) | 2 + 3 per totem (~2.7) | +17% (upgrade adds 30%) |
| Totem Drum | 1 Aura | uncommon | Whenever one of your totems acts: Deal 3 damage to a random enemy. | 14 | 15 | -7% | on budget (cond.) | Aura: ~1.3 totem acts a turn x 3 to a random enemy (x0.9) x4 | +25% (upgrade adds 34%) |
| Clear Spring | 1 | uncommon | Draw 3 cards. | 11 | 11.2 | -2% | on budget | draw 3 (3 + 4 + 4); + a 4th at half | +16% (upgrade adds 18%) |
| Shaman's Insight | 1 | uncommon | Draw 1 card. Gain 3 Barrier. Your next Flame, Frost, Storm or Prism spell costs 0. | 12.6 | 11.2 | +13% | on budget (cond.) | draw 3 + 3 Barrier 3.6 + the next spell free ~6 | +48% (upgrade adds 32%) |
| Totem Circle | 2 | uncommon | Plant a Hawk. Plant a Bear. Plant a Thunderbird. | 24 | 21.28 | +13% | on budget | three plants 3 x8 | +35% (upgrade adds 20%) |
| Ancestral Exchange | 2 | uncommon | Command your newest totem. Plant a random totem. Gain 3 Barrier. | 19.6 | 21.28 | -8% | on budget (cond.) | command the newest 8 + plant a random totem in its place 8 + 3 Barrier 3.6 | +9% (upgrade adds 18%) |
| Rally the Spirits | 2 | uncommon | Command your front totem twice. Gain 4 Barrier. | 24 | 21.28 | +13% | on budget (cond.) | the front totem acts twice (2 x10.7, less its passive 2) 19.4 + 4 Barrier 4.8 | +30% (upgrade adds 15%) |
| Spirit Surge | 2 | uncommon | Gain 1 Spirit. Gain 8 Barrier. | 19.6 | 21.28 | -8% | on budget | 1 Spirit 10 + 8 Barrier 9.6 | +15% (upgrade adds 24%) |
| Carve the Spirit Pole | 1 | rare | Gain a totem position. Plant a random totem. Draw 1 card. | 13.5 | 12.5 | +8% | on budget | position 3 + random plant 7.5 + draw 3 | +40% (upgrade adds 30%) |
| Harmony | 1 Aura | rare | Whenever one of your totems acts: Gain 3 Barrier. | 18.7 | 20 | -7% | on budget (cond.) | Aura: ~1.3 totem acts a turn x 3 Barrier 3.6 x4 | +25% (upgrade adds 34%) |
| Storm Sovereign | 1 Aura | rare | Whenever one of your totems acts: Deal 3 damage to ALL enemies. | 20.3 | 20 | +2% | on budget (cond.) | Aura: ~1.3 totem acts a turn x 3 to ALL 3.9 x4 | +35% (upgrade adds 33%) |
| Bark Carapace | 1 Aura | rare | At the start of your turn: Gain 1 (+1 per totem you have) Barrier. | 20.6 | 20 | +3% | on budget (cond.) | 4 turns x (1 Barrier a totem, ~3.3, + 1) x1.2; + Opening hand 3.5 | +21% (upgrade adds 17%) |
| Spiritstorm | 1 | rare | Deal 6 (+1 per Spirit) damage to ALL enemies. | 10.4 | 12.5 | -17% | weak (cond.) | (6 + ~2 Spirit) ALL x1.3 | +14% (upgrade adds 38%) |
| Spirit Walk | 1 | rare | Gain 1 Spirit. Draw 2 cards. Consume. | 17 | 15.63 | +9% | on budget | 1 Spirit 10 + draw 2 (3 + 4) | +34% (upgrade adds 24%) |
| Call the Moon Owl | 2 | rare | Plant a Moon Owl. | 27 | 23.75 | +14% | on budget | plant 8 + 1 off the first elemental spell a turn (~2.5 x6 x0.9) 13.5 + its double spell when it acts (~9 x0.6) 5.4 | +26% (upgrade adds 11%) |
| Spirit Chorus | 2 Aura | rare | At the start of your turn: Command your front totem. Gain 2 Barrier. | 41.6 | 38 | +9% | on budget (cond.) | Aura: each turn the front totem acts 8 + 2 Barrier 2.4, x4 | +18% (upgrade adds 8%) |
| Call the Elder Tree | 3 | rare | Plant an Elder Tree. | 34 | 35 | -3% | on budget | plant 8 + 1 Mana a turn while it stands (~2.5 turns x7) 17.5 + its 2 Mana when it acts (14 x0.6) 8.4 | +6% (upgrade adds 9%) |
| Great Spirit's Call | 3 | rare | Command every totem, front to back. Gain 5 Barrier. | 32 | 35 | -9% | on budget (cond.) | every totem acts, front to back (~3 x10.7, less their passives 6) 26 + 5 Barrier 6 | +5% (upgrade adds 15%) |
