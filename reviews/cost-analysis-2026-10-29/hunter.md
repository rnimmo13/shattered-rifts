# Hunter: card cost analysis (2026-10-29)

Hand-priced against `docs/14_CARD_COSTING.md`, live data 0.128.0. The Hunter starts each fight with a Hound (8 HP, hits 4); her
trait Pack Instinct shares half her Might (rounded down) with her companions and heals 2 after a won fight. 80 max HP. 86 cards.
Suggestions only; nothing was changed.

## Grades

| | Grade | Reading |
|---|---|---|
| **Overall** | **D** | 53% on budget would be a C, but the rubric's D line is "several broken cards": three (Blood Tithe +120%, Adrenal Surge +86%, Devour Ally +45%), with nine dead and Predator clearly under. One fixed broken card would make it a C. |
| Power level | **fair** | mean -3%, median -2%: the over and under cards cancel. Bloodrage +2%, Pack -1%, Predator -12%. |
| Consistency | **D** | spread 28 points, the widest of the three; 26 cards weak or dead next to 14 strong or broken. |

| Measure | Value |
|---|---|
| Cards priced | 86 |
| On budget (within ±15%) | 46 (53%) |
| Strong (+15% to +40%) | 11 |
| Broken (over +40%) | 3 |
| Weak (-15% to -40%) | 17 |
| Dead (under -40%) | 9 |
| Mean deviation (power) | -3% |
| Median deviation | -2% |
| Spread (standard deviation of dev %) | 28 points |
| Mean absolute deviation | 20 points |
| Conditional cards | 16 |
| Upgrades past +50% of the card's points | 8: The Hunger, Scar Tissue, Thick Hide, Rally the Pack, Gut Trap, Bone Crack, Frenzied Gulp, Tear Loose |
| Upgrades that cut the cost | 7: Wild Hunt, Apex Frenzy, Red Frenzy, Killing Spree, Hunger Unbound, Hunting Grounds, Bloodmoon Hunt |
| Mean upgraded deviation | +31% |

| Build path | Cards | Mean dev | On budget | Strong | Broken | Weak | Dead |
|---|---|---|---|---|---|---|---|
| Bloodrage | 24 | +2% | 15 | 3 | 1 | 4 | 1 |
| Pack | 30 | -1% | 15 | 6 | 1 | 6 | 2 |
| Predator | 21 | -12% | 10 | 0 | 1 | 6 | 4 |
| shared | 11 | -7% | 6 | 2 | 0 | 1 | 2 |

## Starter deck

4 Strike, 3 Defend, Savage Bite, Blood Frenzy, Rend, plus the free Hound. Baseline for a starter: about **18 points a turn, ~10
damage and ~7 Barrier**.

| Turn | Damage | Barrier | Notes |
|---|---|---|---|
| 1 | ~17 (2.1 attacks at ~6.3 + the Hound 4) | ~4.5, plus the Hound's 8 HP in front | 7 of 10 cards attack. |
| 2 | ~19 (+1 Might from Rend or Blood Frenzy most turns) | ~4.5 | the Hound gets none of 1 Might (half, rounded down) until she has 2. |
| 3 | ~20 | ~4.5 | ~1.5 HP a turn paid, ~3 healed back by Savage Bite. |

About **19 damage and 4.5 Barrier a turn**, with the Hound soaking the first single-target hit: the highest damage of the three
starters and the thinnest Barrier. Savage Bite (+40%, at the line) is a hot basic; Rend (+13%) and Blood Frenzy (+5%) are fine.

## Build paths

- **Bloodrage (24 cards, mean +2%, 15 on budget).** Works as priced: the HP-for-Might cards (Rend, The Hunger, Open a Vein,
  Run Wild) land on budget and the self-damage payoffs (Scar Tissue, Wounded Wrath, Pain Ward, Gut Trap) are reachable at ~1.2
  self-damage events a turn. Blood Tithe (+120%) is the outlier. Ancient Fury (-46%) and The Hunger Unleashed (-47%) score dead in
  the 4-turn window: they are long-fight cards, and Hunger Unleashed is also beaten by Bloodsong, which gives the same Cadence for 0.
- **Pack (30 cards, mean -1%).** The summons are all strong by the companion formula (Pup +20%, Alpha Call +24%, Dire Wolf +23%,
  Litter +13%), which the guide accepts. The pack payoffs are mixed: Wild Hunt (-43%, 3 cost) and Trail of Blood (-41%, ~0.4
  summons a turn) are dead, Den Mother and Pack Frenzy weak, while Devour Ally (+45%) and Bloodmoon Hunt (+35%) overshoot. The path's
  Traps (Bear Trap, Snare Line, Deadfall) are on budget; Baited Snare and Hunting Grounds are weak.
- **Predator (21 cards, mean -12%, no strong card): the path that is clearly under.** It runs on two broken enablers (Adrenal
  Surge here, Blood Tithe from Bloodrage) and Berserk Tempo; everything that should turn the Mana and cards into damage misses:
  Killing Spree (-57%), Battle Rhythm (-47%), Feral Instinct (-47%), Frenzied Gulp (-40%), Red Frenzy, Rising Howl, Reckless
  Abandon (weak). The "per card played" attacks need ~2 cards before them; Predator only gets there with the broken 0-cost Mana
  cards, so fixing those two without lifting the rest would leave the path without a working turn.
- **Shared (11 cards, mean -7%).** Hunger Unbound (-71%) dead; Slip the Leash weak; Devour (+20%) strong.

**Bosses.** Pack holds up best: the Hound, Pups and Alpha take single big hits in front of her (but overflow carries on, so a
25-damage opener kills a Pup and still hits), and Pack Bond / Pack Leader keep Barrier on everyone. Bloodrage is the riskiest
against a front-loaded hitter (self-damage plus thin Barrier) but has the best single-target scaling: Might ramps (Hunter's Call,
Ancient Fury, Cadence) are worth two or three times their 4-turn score over a 10-20 turn Warden. Predator's burst is real only with
the 0-cost Mana cards; its single-target peak is Rising Howl / Apex Frenzy at ~25-35.

## Biggest outliers and suggested fixes

| Card | Dev | Problem | Suggested fix |
|---|---|---|---|
| Blood Tithe (0, R) | +120% | Draw Blood plus draw 2 and a Might | "Lose 6 HP. Gain 2 Mana. Draw 1 card. Consume." (~8, +7%) |
| Adrenal Surge (0, U) | +86% | +2 Mana and a card for 3 HP at 0 (Draw Blood with a card) | cost 1 (a Rift Surge with a card: -11%) |
| Hunger Unbound (3, R, Aura) | -71% | free skills that Consume, for 3 Mana and 2 HP a turn, in a class with few costly skills | cost 1 (-20%) |
| Killing Spree (3, R, Aura) | -57% | draw 1 per Attack, ~2 a turn, at 3 Mana | cost 2 base (the upgrade's), upgrade Opening hand; or cost 1 (+20%) |
| The Hunger Unleashed (2, R, Aura) | -47% | Bloodsong's Cadence plus 2 Might, for 2 more Mana and 3 more HP | cost 1 (on budget) |
| Battle Rhythm (1, U, Aura) | -47% | a card a turn for 1 HP a turn, at 1 Mana | no HP loss (14, -7%) |
| Ancient Fury (2, R, Aura) | -46% | 2 Might a turn, but 3 HP a turn eats half of it | 1 HP a turn (~32, -15%); it is a boss card either way |
| Devour Ally (1, U) | +45% | heal 8 and 2 hero Might for a Pup | heal 8 -> 5 (+4%) |
| Wild Hunt (3, R, Aura) | -43% | "all allies act" each turn is ~8 a turn at 3 Mana | cost 2 base (-16%), upgrade Opening hand |
| Feral Instinct / Frenzied Gulp (0, Consume) | -47% / -40% | draws that cost HP in the one path that needs cards | lose 1 / 2 HP (their upgrades' HP): -27% / -5% |
| Cost-cut upgrades: Apex Frenzy+ (2 -> 1, +118%), Bloodmoon Hunt+ (2 -> 1, +156%) | upgrade | a cost cut on a 34-40 point card | raise a number instead: Apex Frenzy 5 -> 6 a hit, Bloodmoon Hunt 2 -> 3 Might |

Other upgrades past +50%: Rally the Pack+ (+82%: the 12-HP Hound acts twice), The Hunger+ (+63%), Scar Tissue+ (+55%), Thick
Hide+ (+60%), Bone Crack+ (+60%: two numbers), Gut Trap+ (+51%), Tear Loose+ (+55%), Frenzied Gulp+ (+70%).

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
| Savage Bite | 1 | basic | shared | Deal 7 damage. Lifesteal 50%. | 11.2 | 8 | +40% | strong | 14.4 | +29% | +80% | 7 + Lifesteal 50% (0.6 a damage point: heal 1.5 a HP, x0.8 for Barrier and overheal) |
| Blood Frenzy | 1 | basic | shared | Deal 3 damage to ALL enemies. Lose 1 HP. Gain 1 Might. | 8.4 | 8 | +5% | on budget | 11 | +31% | +38% | 3 AoE 3.9 - 1 HP 1.5 + 1 Might 6 (shared with the pack) |
| Rend | 1 | basic | Bloodrage | Deal 6 damage. Lose 2 HP. Gain 1 Might. | 9 | 8 | +13% | on budget | 12 | +33% | +50% | 6 - 2 HP 3 + 1 Might 6 |
| Twin Fang | 1 | common | Bloodrage | Deal 6 damage 2 times. Lose 2 HP. | 10 | 10 | +0% | on budget | 13.5 | +35% | +35% | 6x2 + 1 (Might on the extra hit) - 2 HP 3 |
| Feral Instinct *(cond.)* | 0 | common | Predator | Lose 2 HP. Draw 2 cards. Consume. | 4 | 7.5 | -47% | dead | 5.5 | +38% | -27% | draw 2 alone 7 - 2 HP 3 (Bloodrage payoffs make the HP upside) |
| Pain Ward *(cond.)* | 1 | common | Bloodrage | Gain 5 (+1 per 5% HP missing) Barrier. | 12 | 10 | +20% | strong | 15.6 | +30% | +56% | (5 + ~5 at 25% HP missing) Barrier x 1.2 |
| Blood Tithe | 0 | rare | Bloodrage | Lose 7 HP. Gain 2 Mana. Draw 2 cards. Gain 1 Might. Consume. | 16.5 | 7.5 | +120% | broken | 19.5 | +18% | +160% | -7 HP 10.5 + 2 Mana 14 + draw 2 as an extra 7 + 1 Might 6 |
| Crushing Blow *(cond.)* | 2 | uncommon | Bloodrage | Deal 10 (+2 per Might) damage. | 16 | 21.3 | -25% | weak | 19 | +19% | -11% | 10 + 2 x ~3 Might |
| Run Wild | 2 | uncommon | Bloodrage | Deal 7 damage 2 times. Gain 1 Might. | 21 | 21.3 | -1% | on budget | 29 | +38% | +36% | 7x2 + 1 + 1 Might 6 |
| Ravage | 2 | uncommon | Bloodrage | Deal 10 damage 2 times to ALL enemies. Lose 3 HP. | 22.5 | 21.3 | +6% | on budget | 26.6 | +18% | +25% | 10x2 AoE 26 + 1 - 3 HP 4.5 |
| The Hunger | 1 | uncommon, Aura (one-shot) | Bloodrage | Lose 4 HP. Gain 3 Might for the rest of the fight. | 12 | 11.2 | +7% | on budget | 19.5 | +63% (too big) | +74% | -4 HP 6 + 3 Might 18 (one-shot: card budget) |
| Rummage | 1 | common | Bloodrage | Deal 8 damage. Put a random Attack card from your discard pile on top of your draw pile. | 9.5 | 10 | -5% | on budget | 14 | +47% | +40% | 8 + an Attack on top 1.5 |
| Pound | 1 | common | Bloodrage | Deal 8 damage. Draw 1 card. Lose 1 HP. | 9.5 | 10 | -5% | on budget | 13.5 | +42% | +35% | 8 + draw 3 - 1 HP 1.5 |
| Scar Tissue *(cond.)* | 1 | rare, Aura | Bloodrage | Whenever you lose HP to your own cards or Hangover: Gain 2 Barrier. Gain 1 Might until the end of your turn. | 21 | 20 | +5% | on budget | 32.6 | +55% (too big) | +63% | (2 Barrier 2.4 + 1 Might this turn ~2) x ~1.2 self-damage events a turn x 4 |
| Whirling Maul | X | uncommon | Bloodrage | Deal 6 damage X times to ALL enemies. Lose 3 HP. | 21 | 21 | +0% | on budget | 29.7 | +41% | +41% | 6 AoE x 3 = 23.4 + ~2 Might on extra hits - 3 HP 4.5 |
| Reckless Blow | 1 | uncommon | Bloodrage | Lose 2 HP. Deal 7 damage 2 times. | 12 | 11.2 | +7% | on budget | 15.5 | +29% | +38% | 7x2 + 1 - 2 HP 3 |
| Hamstring Slam | 2 | uncommon | Bloodrage | Deal 11 damage. Apply 2 Faltering. Each of your allies gains 3 Barrier. | 19.3 | 21.3 | -9% | on budget | 27.7 | +44% | +30% | 11 + 2 Faltering 6 + 3 Barrier to each companion (0.6 x 3 x 1.3) |
| Skullcrusher | 3 | rare | Bloodrage | Deal 26 damage. All your allies act now. | 32 | 35 | -9% | on budget | 35 | +9% | +0% | 26 + all allies act (~6 with the Hound and a Pup) |
| Scarred Warrior | 1 | rare, Aura | Bloodrage | At the start of your turn: Lose 2 HP. Gain 8 Barrier. | 26.4 | 20 | +32% | strong | 36 | +36% | +80% | (-2 HP 3 + 8 Barrier 9.6) x 4 |
| Pack Tactics | 1 | common | Pack | Gain 1 Might. Gain 2 Barrier to all friends. | 10 | 10 | +0% | on budget | 14 | +40% | +40% | 1 Might 6 + 2 Barrier to all friends (1.2 + 0.6 x 1.3 companions a point) |
| Thick Hide | 1 | common | Pack | Gain 5 Barrier to all friends. | 9.9 | 10 | -1% | on budget | 15.8 | +60% (too big) | +58% | 5 Barrier to all friends ~2 a point |
| Savage Command | 1 | uncommon | Pack | All your allies act now. Gain 1 Might. | 14 | 11.2 | +25% | strong | 20 | +43% | +79% | all allies act ~8 + 1 Might 6 |
| Pack Bond | 2 | uncommon, Aura | Pack | At the start of your turn: Gain 4 Barrier to all friends. | 31.6 | 28.5 | +11% | on budget | 47.4 | +50% | +66% | 4 Barrier to all friends 7.9 x 4 |
| Alpha Call | 2 | rare | Pack | Summon Pack Alpha (12 HP). At the end of your turn it will: Deal 6 damage. | 29.4 | 23.8 | +24% | strong | 38.2 | +30% | +61% | Pack Alpha (guide 29.4) |
| Unchained | 2 | uncommon, Aura (one-shot) | Pack | Gain 4 Might for the rest of the fight. | 24 | 21.3 | +13% | on budget | 30 | +25% | +41% | 4 Might 24 (one-shot: card budget) |
| Den Mother *(cond.)* | 2 | rare, Aura | Pack | Whenever one of your allies dies: Deal 15 damage to the attacker. | 26 | 38 | -32% | weak | 35 | +35% | -8% | 15 to the attacker x ~1.75 companion deaths in four turns |
| Dire Wolf | 3 | rare | Pack | Summon Dire Wolf (18 HP). At the end of your turn it will: Deal 9 damage. | 43 | 35 | +23% | strong | 51.4 | +20% | +47% | Dire Wolf (guide 43) |
| Summon Pup | 1 | common | Pack | Summon Pup (5 HP). At the end of your turn it will: Deal 3 damage. | 12 | 10 | +20% | strong | 14.4 | +20% | +44% | Pup 5 HP 6 + 3 + 3 |
| Feeding Time | 1 | uncommon | Pack | Your companions gain 3 max HP. Gain 1 Might. | 10.7 | 11.2 | -4% | on budget | 15.4 | +44% | +37% | companions 3 max HP (1.2 x 1.3) + 1 Might 6 |
| Rally the Pack | 2 | uncommon | Pack | Summon Hound (8 HP). At the end of your turn it will: Deal 4 damage. Each of your allies gains 3 Barrier. | 20.7 | 21.3 | -3% | on budget | 37.7 | +82% (too big) | +77% | Hound 16.6 + 3 Barrier on ~2.3 companions 4.1; the upgrade (12 HP Hound = 2 acts, 6 Barrier) is +82% |
| Trail of Blood | 1 | common, Aura | Pack | Whenever you summon an ally: Gain 1 Might. | 7.7 | 13 | -41% | dead | 11.2 | +45% | -14% | 1 Might (6 x 0.8) x ~0.4 summons a turn x 4 |
| Pack Frenzy | 2 | rare | Pack | Gain 2 Might. All your allies act now. Consume. | 20 | 29.7 | -33% | weak | 26 | +30% | -12% | 2 Might 12 + all allies act ~8 |
| Wild Hunt | 3 | rare, Aura | Pack | At the start of your turn: All your allies act now. | 32 | 56 | -43% | dead | 32 (cost 2) | +0% | -16% | all allies act ~8 x 4; upgrade cuts the cost to 2 |
| Devour | 2 | uncommon | shared | Deal 16 damage. Lifesteal 50%. | 25.6 | 21.3 | +20% | strong | 30.4 | +19% | +43% | 16 + Lifesteal 9.6 |
| Devour Ally | 1 | uncommon | Pack | Heal 8 to your hero. Apply 2 Might to your hero. Sacrifice the chosen ally. | 16.2 | 11.2 | +45% | broken | 20.7 | +28% | +85% | heal 8 12 + 2 Might 12 - sacrifice a Pup (1.2 x 4 + 3) 7.8 |
| Gnarltooth Trap | 1 | uncommon, Trap | Bloodrage | When you or an ally is attacked: Deal 6 damage to the attacker. Gain 1 Might. | 10.2 | 11.2 | -9% | on budget | 12.8 | +25% | +14% | guide 10.2 |
| The Hunger Unleashed | 2 | rare, Aura | Bloodrage | Lose 6 HP. Gain 2 Might. Gain 1 Cadence. These last the rest of the fight. | 20 | 38 | -47% | dead | 26 | +30% | -32% | -6 HP 9 + 2 Might 12 + Cadence 1 ~17 (NEW RATE: four end-of-turn Might at 6 x 0.8, last one late) |
| Apex Frenzy *(cond.)* | 2 | rare | Predator | Deal 5 damage 2 times, 1 more time per card played this turn. Lifesteal 50%. Consume. | 34 | 29.7 | +15% | on budget | 34 (cost 1) | +0% | +118% | 5 x (2 + ~2 cards played) = 20 + Lifesteal 12 + ~2 Might; upgrade cuts the cost to 1 |
| Blood Pact | 1 | rare, Aura | Predator | Lose 7 HP. From your next turn, gain 1 more Mana every turn for the rest of the fight. | 17.5 | 20 | -12% | on budget | 19 | +9% | -5% | +1 Mana a turn 28 - 7 HP 10.5 (guide reference) |
| Bone Offering | 1 | uncommon | Predator | Consume 1 card. Draw 2 cards. Heal 2. | 9 | 11.2 | -20% | weak | 13 | +44% | +16% | consume a card from hand ~-1 + draw 2 alone 7 + heal 2 3 |
| Open a Vein | 0 | common | Bloodrage | Lose 4 HP. Gain 2 Might. Consume. | 6 | 7.5 | -20% | weak | 7.5 | +25% | +0% | -4 HP 6 + 2 Might 12 |
| Bloodied Howl | 1 | uncommon | Bloodrage | Lose 2 HP. Apply 2 Exposed to ALL enemies. Draw 1 card. | 9 | 11.2 | -20% | weak | 13.5 | +50% | +21% | -2 HP 3 + 2 Exposed to ALL 9 + draw 3 |
| Frothing Rage | 1 | uncommon | Bloodrage | Lose 3 HP. Gain 3 Might until the end of your turn. Draw 2 cards. | 10 | 11.2 | -11% | on budget | 14 | +40% | +25% | -3 HP 4.5 + 3 Might this turn (~2.5 a stack) 7.5 + draw 2 alone 7 |
| Wounded Wrath *(cond.)* | 1 | common, Aura | Bloodrage | Whenever you lose HP to your own cards or Hangover: Deal 4 damage to a random enemy. | 17.3 | 13 | +33% | strong | 25.9 | +50% | +99% | 4 random 3.6 x ~1.2 self-damage events a turn x 4 |
| Death or Glory *(cond.)* | 2 | rare | Bloodrage | Deal 10 (+1 per 2.5% HP missing) damage. Consume. | 22 | 29.7 | -26% | weak | 25 | +14% | -16% | 10 + ~12 at 30% HP missing |
| Bared Teeth | 1 | common | Pack | Gain 3 (+3 per ally) Barrier. | 8.3 | 10 | -17% | weak | 11.9 | +43% | +19% | (3 + 3 x ~1.3 companions) Barrier x 1.2 |
| Lead the Charge | 1 | common | Pack | Deal 5 (+3 per ally) damage. | 8.9 | 10 | -11% | on budget | 11.9 | +34% | +19% | 5 + 3 x ~1.3 |
| Blood Bond | 1 | uncommon | Pack | Lose 3 HP. Gain 1 Might. Gain 5 Barrier to all friends. | 11.4 | 11.2 | +2% | on budget | 13.9 | +22% | +24% | -3 HP 4.5 + 1 Might 6 + 5 Barrier to all 9.9 |
| Litter | 2 | uncommon | Pack | Summon 2 Pups (5 HP each). At the end of your turn each will: Deal 3 damage. | 24 | 21.3 | +13% | on budget | 28.8 | +20% | +35% | 2 Pups 12 each |
| Bone Collar | 1 | uncommon, Aura | Pack | Whenever one of your allies dies: Gain 1 Might. Heal 2. | 13.7 | 15 | -9% | on budget | 18.9 | +38% | +26% | (1 Might 6 x 0.8 + heal 2 3) x ~1.75 deaths |
| Hunter's Call | 1 | uncommon, Aura | Pack | At the start of your turn: Gain 1 Might. | 19.2 | 15 | +28% | strong | 23.2 | +21% | +55% | 1 Might a turn: 4 x 6 x 0.8 ramp |
| Throw Scraps | 0 | common | Predator | Consume 1 card. Gain 1 Mana. | 6 | 6 | +0% | on budget | 7 | +17% | +17% | consume a card from hand ~-1 + 1 Mana 7 (not Consume itself: the cards it eats are the limit) |
| Gut Trap | 1 | uncommon, Trap | Bloodrage | When you lose 5+ HP at once: Deal 8 damage to ALL enemies. Heal 4. | 11.5 | 11.2 | +3% | on budget | 17.4 | +51% (too big) | +55% | guide 11.5 |
| Bone Crack | 1 | common | shared | Deal 7 damage. Apply 1 Exposed. | 10 | 10 | +0% | on budget | 16 | +60% (too big) | +60% | 7 + 1 Exposed 3; upgrade +3 damage and +1 Exposed (+60%) |
| Whet the Fangs | 0 | uncommon | shared | Gain 6 Primed. | 7 | 6.7 | +4% | on budget | 9.3 | +33% | +38% | 6 Primed on the next attack (~1.15 hits) |
| Primal Feast | 1 | common | shared | Heal 3 to your hero. Your companions gain 4 max HP. | 10.7 | 10 | +7% | on budget | 15.4 | +44% | +54% | heal 3 4.5 + companions 4 max HP 6.2 |
| Bloodsong | 0 | rare, Aura | shared | Lose 3 HP. Gain 1 Cadence for the rest of the fight. | 12.5 | 12 | +4% | on budget | 14 | +12% | +17% | -3 HP 4.5 + Cadence 1 ~17 |
| Slip the Leash *(cond.)* | 2 | rare | shared | Double the Might to yourself (at most +4). Consume. | 21 | 29.7 | -29% | weak | 22 | +5% | -26% | doubles ~3.5 Might: +3.5 x 6 |
| Rush In | 1 | common | Predator | Deal 7 damage. Draw 1 card. | 10 | 10 | +0% | on budget | 13 | +30% | +30% | 7 + draw 3 |
| Pounding Heart | 0 | common | Predator | Gain 1 Mana. Lose 2 HP. Consume. | 4 | 6 | -33% | weak | 5.5 | +38% | -8% | +1 Mana 7 - 2 HP 3 (guide reads it "slightly under") |
| Wild Swings *(cond.)* | 1 | common | Predator | Deal 3 damage, 1 more time per card played this turn. | 9 | 10 | -10% | on budget | 11.5 | +28% | +15% | 3 x (1 + ~1.5 cards played) + ~1.5 Might on extra hits |
| Shake Loose | 1 | common | Predator | Draw 2 cards. Gain 3 Barrier. | 10.6 | 10 | +6% | on budget | 14.2 | +34% | +42% | draw 2 alone 7 + 3 Barrier 3.6 |
| Frenzied Gulp *(cond.)* | 0 | uncommon | Predator | Draw 3 cards. Lose 4 HP. Consume. | 5 | 8.4 | -40% | dead | 8.5 | +70% (too big) | +1% | draw 3 alone 11 - 4 HP 6 |
| Adrenal Surge | 0 | uncommon | Predator | Gain 2 Mana. Draw 1 card. Lose 3 HP. Consume. | 12.5 | 6.7 | +86% | broken | 17 | +36% | +153% | +2 Mana 14 + draw 3 - 3 HP 4.5 (Draw Blood + a card) |
| Blur of Claws *(cond.)* | 1 | uncommon | Predator | Deal 5 (+3 per card played this turn) damage. | 11 | 11.2 | -2% | on budget | 14 | +27% | +25% | 5 + 3 x ~2 cards played in a Predator turn |
| Battle Rhythm | 1 | uncommon, Aura | Predator | At the start of your turn: Draw 1 card. Lose 1 HP. | 8 | 15 | -47% | dead | 11.5 | +44% | -23% | (draw 1 at turn start 3.5 - 1 HP 1.5) x 4 |
| Reckless Abandon | 1 | uncommon | Predator | Draw 3 cards. Discard 1 card. | 9 | 11.2 | -20% | weak | 11 | +22% | -2% | draw 3 alone 11 - discard 1 2 |
| Burst of Speed | 1 | uncommon | Predator | Next turn, gain 1 extra Mana. Next turn, draw 2 extra cards. | 11 | 11.2 | -2% | on budget | 14.5 | +32% | +29% | +1 Mana next turn 4 + 2 draws next turn 7 |
| Rip and Tear | 2 | uncommon | Predator | Deal 6 damage 3 times. Draw 1 card. | 23 | 21.3 | +8% | on budget | 30 | +30% | +41% | 6x3 + ~2 Might on extra hits + draw 3 |
| Berserk Tempo | 2 | rare, Aura | Predator | At the start of your turn: Gain 1 Mana. Draw 1 card. Lose 2 HP. | 28 | 38 | -26% | weak | 34 | +21% | -11% | (+1 Mana 7 + draw 3 - 2 HP 3) x 4 |
| Red Frenzy *(cond.)* | 1 | rare, Aura | Predator | Whenever you draw a card during your turn: Gain 1 Might until the end of your turn. | 14 | 20 | -30% | weak | 14 (cost 0) | +0% | +17% | +1 Might this turn x ~2 mid-turn draws, touching ~1.5 hits after: ~3.5 a turn x 4; upgrade cuts the cost to 0 |
| Bloodstorm | X | rare | Predator | Deal 5 damage X times. Draw cards equal to the Mana spent. | 22.5 | 23.4 | -4% | on budget | 30 | +33% | +28% | 5 x 3 + ~2 Might + draw 3 at half (no Mana left) ~5.5 |
| Rising Howl *(cond.)* | 2 | rare | Predator | Deal 10 (+5 per card played this turn) damage. | 20 | 23.8 | -16% | weak | 23 | +15% | -3% | 10 + 5 x ~2 cards played |
| Killing Spree | 3 | rare, Aura | Predator | Whenever you play an Attack: Draw 1 card. | 24 | 56 | -57% | dead | 24 (cost 2) | +0% | -37% | draw 3 x ~2 Attacks a turn x 4; upgrade cuts the cost to 2 |
| Pack Leader | 2 | uncommon, Aura | Pack | Whenever you play an Attack: Gain 2 Barrier to all friends. | 32 | 28.5 | +12% | on budget | 48 | +50% | +68% | 2 Barrier to all friends ~4 x ~2 Attacks a turn x 4 |
| Tear Loose | 1 | uncommon | shared | Deal 9 damage. Lose 2 HP. Gain 4 Primed. | 10 | 11.2 | -11% | on budget | 15.5 | +55% (too big) | +38% | 9 - 2 HP 3 + 4 Primed 4 |
| Ancient Fury | 2 | rare, Aura | shared | At the start of your turn: Gain 2 Might. Lose 3 HP. | 20.4 | 38 | -46% | dead | 26.4 | +29% | -31% | 2 Might a turn (8 x 6 x 0.8 = 38.4) - 3 HP a turn (18) |
| Hunger Unbound | 3 | rare, Aura | shared | Gain 1 Unbound. At the start of your turn: Lose 2 HP. | 16 | 56 | -71% | dead | 16 (cost 2) | +0% | -58% | Unbound (skills free and consumed): ~1.4 Mana a turn ~7 x 4 - 2 HP a turn 12; upgrade cuts the cost to 2 |
| Bear Trap | 1 | common, Trap | Pack | When you or an ally is attacked: Deal 6 damage to the attacker. Apply 2 Faltering to the attacker. | 10.2 | 10 | +2% | on budget | 12.8 | +25% | +28% | Trap x0.85: (6 + 2 Faltering 6) |
| Snare Line | 1 | common, Trap | Pack | At the start of the enemy turn: Gain 5 Barrier. Apply 1 Faltering to ALL enemies. | 9.5 | 10 | -6% | on budget | 12.7 | +34% | +27% | Trap foeTurn x0.9: (5 Barrier 6 + 1 Faltering to ALL 4.5) |
| Deadfall | 2 | uncommon, Trap | Pack | When you or an ally is attacked: Deal 18 damage to the attacker. Apply 2 Exposed to the attacker. | 20.4 | 21.3 | -4% | on budget | 25.5 | +25% | +20% | Trap x0.85: (18 + 2 Exposed 6) |
| Baited Snare | 1 | uncommon, Trap | Pack | When you or an ally is attacked: Your companions each deal 5 damage. Gain 3 Barrier. | 7.3 | 11.2 | -35% | weak | 9 | +23% | -20% | Trap x0.85: (companions each 5, priced at one + 3 Barrier 3.6) |
| Hunting Grounds *(cond.)* | 1 | uncommon, Aura | Pack | Whenever one of your Traps is triggered: Gain 1 Might. | 11.5 | 15 | -23% | weak | 11.5 (cost 0) | +0% | +28% | 1 Might (6 x 0.8) x ~0.6 Trap springs a turn x 4; upgrade cuts the cost to 0 |
| Single Out | 1 | common | Pack | Apply 1 Exposed. Each of your companions gains 3 Primed. Draw 1 card. | 10.5 | 10 | +5% | on budget | 13.5 | +29% | +35% | 1 Exposed 3 + companions 3 Primed 4.5 + draw 3 |
| Run It Down *(cond.)* | 1 | uncommon | Pack | Deal 7 damage. If the target is Faltering: Your companions each deal 5 damage. | 9.5 | 11.2 | -15% | weak | 12.5 | +32% | +12% | 7 + companions each 5 (priced at one) x ~0.5 Faltering |
| Bloodmoon Hunt | 2 | rare | Pack | Summon Hound (8 HP). At the end of your turn it will: Deal 4 damage. Each of your companions gains 2 Might. All your allies act now. Consume. | 40 | 29.7 | +35% | strong | 40 (cost 1) | +0% | +156% | Hound 16.6 + 2 Might on ~2.3 companions 11.5 + all act ~12; upgrade cuts the cost to 1 |
