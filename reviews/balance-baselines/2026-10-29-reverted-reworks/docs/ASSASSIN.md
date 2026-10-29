# The Assassin rebuilt: Preparation and embedded knives (2026-10-29, DECISIONS #416; the pool expansion, DECISIONS #424)

From `docs/BASE_CLASS_REWORKS.md` §6. The Silent copy he was (DECISIONS #368) is frozen in
`reviews/balance-baselines/2026-10-29-pre-identity-reworks/` (`cards/assassin.md`). Card prices: [`assassin-ledger.md`](assassin-ledger.md)
(generated); rates: `docs/14_CARD_COSTING.md` §15.

**Fantasy:** he sets up a precise kill, plants physical knives in his enemies, then chooses when to pull them. Two resources,
connected but not the same: Preparation is the setup in his head, knives are the setup in their bodies.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| Preparation | `prep` on the hero: at most 3 (`PREP_MAX`), kept between turns, never cleared by an ordinary attack. Gained by setup cards and his trait (`prepare`); spent by finishers (`spendPrep(n)`: up to n, or 99 for all), which read how much with `per('prepSpent')`. Nothing makes it every turn on its own. |
| Embed | `embed(n)` puts n knives in the target (or each enemy, or a random one), at most 3 in a unit (`KNIFE_MAX`); more is simply lost (no refund, no overflow). After a card's attack: only into a living enemy, and only one the card's hits landed on (a hit a Trap or Shielded stopped does not land; one Barrier soaked does). An embed with no attack before it (Knife Juggle) always goes in. |
| A knife sits there | It does nothing while it is in an enemy: no damage each turn. |
| Pull | `pull(n, each?)` takes up to n knives from the target (99: all; or from every enemy), exactly what is there. Each knife pulled runs `each` once, aimed at the enemy it came from, and the trait deals 3 to that enemy (every knife pays, even after the enemy died of an earlier one: what would land on it does nothing, what you gain you still gain); `per('extracted')` counts what this card pulled. A pulled knife is gone. |
| Ownership | Knives sit in the other side's units (in the Arena, the other hero) and only their owner pulls them; a unit of your side never holds yours. |
| Death | A unit that dies takes its knives with it: nothing is looted from the dead, nothing spreads. A summoned, replaced or revived unit is a new unit with none. |
| Previews | A finisher's damage counts the Preparation you have; a pull's damage counts the knives in the target, and a Shield the pull's own hits will take off (exact, tested: Draw Steel, Twist the Blade, the finishers). A pull behind a condition (Thread the Needle), and the knife hit of Final Cut, show their printed text. |

## Trait and starter

- **Knife Work:** start every fight with 1 Preparation and a knife in every enemy; the first time each turn you embed a knife, gain 1
  Preparation; whenever you pull a knife, deal 3 damage to that enemy. (~14 in the starter, ~24 in a knife deck; guide §15.) No more
  Dagger every turn.
- **Starter (11):** 4 Strike, 3 Defend, **Quiet Incision** (1: 6, embed a knife), **Draw Steel** (1: pull up to 2, 4 + 4 a knife),
  **Finishing Thrust** (2: spend up to 3 Preparation, 8 + 4 each), **Patient Footwork** (1: 5 Barrier, 1 Preparation). The first fight
  asks: embed now and pull later, or pull the opening knife at once; spend Preparation now or wait for 3.

## Strategies

1. **Execution:** build Preparation, spend it on one target. Read the Guard, Prepared Ambush, Side Slip, Lay Bare, Knife in the Back,
   Severing Finish, Throat Cut, Killing Stroke, Final Cut, Eyes in the Dark. Package: Prepared Ambush (2) + the trait's (1) = 3, then
   Severing Finish deals 26.
2. **Knives:** spread knives, pull them where it counts. Knife Juggle, Feint Strike, Blade Flurry, Pinning Throw, Scatter Knives,
   Pincushion, Executioner's Mark, Flurry of Steel; pulls Draw Steel, Twist the Blade, Harvest the Field, Twist and Pull, Thread the
   Needle, Reap the Steel, Worry the Wound (reads them, keeps them), Whetted Edge. Package: Pincushion (3 in one) then Thread the Needle
   (4 + 15, +9 from Knife Work).
3. **Shadow:** defence and cycling on the move, with small pulls for Barrier and cards. Duck and Weave, Backspring, Roll Away, Smoke
   Veil, Nimble Deal, Practiced Hands, Fade Out, Leave No Trace, Cut and Run, Disarm, Sweep the Leg, Vanishing Act, Hidden in Plain
   Sight, Bladestorm Ward, Recall the Blades.

Glue: Hobbling Jab, Dirty Hit, Quick Slash, Barbed Stab (Bleed is unchanged for everyone else), Cartwheel Cut. All three strategies
work against a single boss: none needs a kill.

## Card disposition (55 live: 27 kept or changed, 28 new; 57 removed)

**Kept (same card or lightly tuned):** Hobbling Jab (now a common; upgrade 5 + 1 Faltering), Dirty Hit, Quick Slash, Barbed Stab,
Backspring (3 Barrier, draw 2: it was +30% over), Turn Aside (upgrade 6), Roll Away, Stalker's Lunge (14 + 2 cards next turn), Darting
Strike, Smoke Veil, Sweep the Leg, Marked for Death.

**Changed (same id, new job):** Duck and Weave (8 Barrier, discard 1, 1 Preparation: no Sly engine), Flick Knife (7, embed, draw 1,
discard 1), Knife Juggle (embed 2 and 4 Barrier, not three Daggers), Feint Strike (5 and embed 2), Shroud and Shank (6 Barrier and
embed), Blade Flurry (5 to all and a knife in each), Cartwheel Cut (no Sly), Knife in the Back (a Preparation finisher), Whetted Edge
(each pull 2 damage and 1 Barrier, not permanent damage for every knife), Nimble Deal (draw 3, discard 1, 1 Preparation), Practiced
Hands (+1 Preparation), Lay Bare (+1 Preparation), Side Slip (+1 Preparation, 1 Barrier), Killing Stroke (a 1-cost Preparation
finisher), Recall the Blades (pull every knife for Preparation and Barrier).

**New:** Quiet Incision, Draw Steel, Finishing Thrust, Patient Footwork, Read the Guard, Severing Finish, Throat Cut, Prepared Ambush,
Final Cut, Eyes in the Dark, Pinning Throw, Twist the Blade, Pincushion, Harvest the Field, Scatter Knives, Worry the Wound,
Executioner's Mark, Flurry of Steel, Twist and Pull, Thread the Needle, Reap the Steel, Leave No Trace, Cut and Run, Disarm, Fade Out,
Hidden in Plain Sight, Vanishing Act, Bladestorm Ward.

**Removed** (into the nearest new card, `retired.ts` Assassin block): the Dagger engine (Dagger/`sleeve-knife`, Inked Dagger, Sleeve
Drop, Bottomless Sleeves, Ghost Knives, Spare Blades, Wide Arc, Steel Monsoon, Inked Blades, Glancing Knives); the Poison package (Open
Vein, Viper's Kiss, Thin the Blood, Tossed Vials, Reopen the Wound, Blood Mist, Red Mirage, Weeping Cuts, Hemorrhage, Serrated Edges,
Bloodburst, Sapping Wound, Blood Scent, Chilling Shriek, Garrote); the Sly/discard engine (Grand Scheme, Into the Shadows, Palm Switch,
Quick Reflexes, Cool Head, Slip the Blow, Razor Skin, All or Nothing, Nimble Routine, Shuffle Up, Bolt Hole, Fleet Fingers, Needle
Rain, Graveside Cut); and Rippling Cut, Final Flourish, Run Through, Spring Attack, Nerve Strike, Clean Cut, Serpent's Coil, Final Bow,
Sense the Blow, Fleet Step, Rush of Blood, Shadow Echo, Stilled Time, Double Trick, Slow Murder, Recurring Dream, Mantle of Night,
Patient Hands. Ordinary discard stays (Duck and Weave, Flick Knife, Nimble Deal).

## Checks the points can't do (guide §8)

- **Loops:** no 0-cost card draws itself back or makes Mana now (Side Slip's Mana is next turn's; Lay Bare Consumes). Preparation
  and knives are capped at 3, and nothing turns one into the other in a loop (Recall the Blades gives Preparation for knives, but
  nothing gives knives for Preparation).
- **Multipliers:** Preparation adds a fixed amount per point to one finisher; it never multiplies every knife. The biggest turn:
  Final Cut with 3 Preparation and 3 knives = 16 + 18 + 18 + 9 (Knife Work) = 61 for 3 Mana, after two or three turns of setup.
  Whetted Edge and Hidden in Plain Sight are bounded by how many knives exist (3 a target).
- **Turn-four ceiling:** a knife deck's usual turn 4: Pincushion last turn, then Thread the Needle (4 + 15 + 9) and Draw Steel: about
  40 over a turn, a rare's turn.
- **Tiers:** finishers and pulls are flat, so they shrink against Tier X HP; Faltering and Exposed on his cards keep up.
- **Arena:** knives and Preparation are on the units, visible to both; the opening knife goes into the other hero.

## The pool expansion (2026-10-29, DECISIONS #424): 91 cards, 87 reward-eligible

The cards as they stood (55, 51 reward-eligible, 3 Auras) are frozen in `reviews/balance-baselines/2026-10-29-assassin-expansion/`.
36 cards added, none changed or removed; 12 Auras. Rates as in the guide's §15 (a knife 2, a pull its payoff minus 2 a knife, a
Preparation gained 1.5, spent its payoff minus 1.5 a point; Knife Work's 3 a pull is the trait's and not counted on the card).

| Card | R | Mana | Type | Effect | Upgrade | Role | Decision | Points | Combo risk |
|---|---|---|---|---|---|---|---|---|---|
| Measured Cut | C | 1 | Attack | Spend up to 1 Preparation. Deal 7, +5 per Preparation spent | 10 | Precision: the small spender | take 12 now, or keep the point for a bigger finisher | 7 + (5 - 1.5) x0.9 = 10.15 | none: one point |
| Poised Strike | U | 2 | Attack | Deal 12, +4 per Preparation you have (none spent) | 16 | Precision: the reason to sit on Preparation | hold 3 for 24, or spend it on a finisher | 12 + 4 x1.8 = 19.2 | with 3: 24 every copy, but it never spends, so the finisher turn competes |
| Mark the Vein | U | 1 | Skill | 6 Barrier. Spend up to 1 Preparation: 1 Exposed and 1 Faltering on the target per point | 9 Barrier | Precision/utility: a spender that sets up | a point for Exposed before the finisher, or keep it for the finisher | 7.2 + (6 - 1.5) x0.9 = 11.25 | Exposed then a finisher: x1.5 on it (priced as Exposed) |
| Silent Massacre | R | 2 | Attack | Spend up to 3 Preparation. 8 to ALL, +5 to ALL per Preparation spent | 11 | Precision: the group finisher | many enemies: all 3 here; one boss: Severing Finish | 10.4 + (6.5 - 1.5) x2 = 20.4 | 23 to each of three enemies for 3 Preparation |
| Steady Hand | C | 0 | Skill | 3 Barrier, 1 Preparation, Hold | 5 Barrier | Precision/defence: a free point to time | play now, or hold it for the turn you need the point | 3.6 + 1.5 + Hold 1 = 6.1 | no draw, no Mana: no loop |
| Weigh the Moment | C | 1 | Skill | Foresee 2, 1 Preparation, 4 Barrier | Foresee 3, 6 Barrier | Utility: selection for the finisher | dig for the finisher while building to it | 3.5 + 1.5 + 4.8 = 9.8 | none |
| Calculated Retreat | U | 1 | Skill | 6 Barrier. Spend up to 1 Preparation: 6 more Barrier per point | 9 Barrier | Defence/precision: Preparation into safety | a point for 6 Barrier now, or a point toward a kill | 7.2 + (7.2 - 1.5) x0.9 = 12.33 | none: one point |
| Assassinate | R | 2 | Attack | Spend up to 3 Preparation. Deal 12, +6 per point; if it kills, gain 2 Preparation | 16 | Precision: the finisher that chains in a crowd | kill the right enemy and keep the chain going | 12 + 4.5 x2 + a kill ~0.9 = 21.9 | a kill refunds 2 (capped at 3); never needed against one boss |
| Read the Wound | C | 1 | Attack | Deal 8; if the target has a knife, gain 1 Preparation | 11 | Hybrid: knives into Preparation without pulling | hit the knifed enemy for the point, or the dangerous one | 8 + 1.5 x0.75 = 9.1 | reads knives, never removes or adds them: no loop |
| Exacting Pull | U | 1 | Attack | Deal 4. Spend up to 2 Preparation: pull a knife for each point spent, 8 to the target each | 7 | Hybrid: Preparation buys extraction (one way) | two points and two knives for 26 (with Knife Work), or keep both | 4 + (8 - 2 - 1.5) x1.5 = 10.75 | one way only (Preparation and knives into damage); Recall the Blades makes Preparation from knives, nothing makes knives from Preparation |
| Lodged Steel | C | 1 | Attack | Deal 7; if the target has a knife, 1 Faltering | 10 | Leave the knife: control | leave the knife in for this, or pull it | 7 + 3 x0.75 = 9.25 | none |
| Pinned | U | 1 | Skill | 5 Barrier; the target is Sapped 2 per knife in it until its turn ends | 8 Barrier | Leave the knife/defence | three knives: 6 off every hit it makes this turn | 6 + 2 x1.8 x1.2 = 10.3 | Sapped never more than the hit (guide) |
| Barbed Anchor | U | 1 | Skill | Embed a knife; the target gets 1 Faltering per knife in it; 3 Barrier | 6 Barrier | Leave the knife: a debuff that grows with the knives | stack one enemy for 3 Faltering, or spread | 2 + 2.2 x3 + 3.6 = 12.2 | capped by 3 knives |
| Thousand Cuts | R | 2 | Attack | Deal 7, once more per knife in the target (keeps them) | 9 | Leave the knife: the payoff for not pulling | 3 knives: 28 and the knives stay for a pull later | 7 x(1 + ~2) = 21 | Exposed and 3 knives: 42; then a pull still pays |
| Steel Rain | U | 2 | Attack | 8 to ALL, +5 to each per knife in it (keeps them) | 11 | Fieldwork: spread, then hit all | spread knives first, or finish one | 10.4 + 5 x1.2 x1.3 = 18.2 | three enemies with 3: 23 each |
| Fan of Blades | C | 1 | Skill | Embed a knife in a random enemy, twice; draw 1; 3 Barrier | 5 Barrier | Fieldwork: cheap spread | random spread for the group payoffs | 4 + 3 + 3.6 = 10.6 | random only from the seeded PRNG |
| Reaping Arc | C | 1 | Attack | 5 to ALL; pull a knife from each enemy: 4 to it | 7 | Fieldwork: a light group pull that leaves the rest | one knife each, keep the others | 6.5 + (4 - 2) x1.2 = 8.9 | one knife each enemy |
| Quick Pull | C | 0 | Attack | Deal 3; pull a knife: 5 to the target | 5 | Selective: the free damage pull | one knife now for 11 (Knife Work), or wait | 3 + (5 - 2) x0.8 = 5.4 | no draw or Mana: no loop |
| Pry Loose | U | 1 | Attack | Deal 7; pull a knife: 2 Exposed on the target | 10 | Selective: the setup pull | pull one for Exposed, then the big hit | 7 + (6 - 2) x0.8 = 10.2 | Exposed is priced, not multiplied |
| Sleight of Steel | C | 1 | Skill | 5 Barrier; pull a knife: draw 2 | 8 Barrier | Selective/utility: the selection pull | a knife for two cards | 6 + (6 - 2) x0.8 = 9.2 | needs a knife each time: finite |
| Bide in Shadow | U | 1 | Skill | 6 Guarded (Barrier next turn), next turn draw 1, Hold | 9 Guarded | Shadow: set up the next turn | hold for the turn before the kill | 6 + 3 + 1 = 10 | none |
| Melt Away | C | 1 | Skill | 7 Barrier; put a card from your hand on top of your draw pile | 10 Barrier | Shadow/utility: save the finisher for next turn | which card waits | 8.4 + 1.5 = 9.9 | none |
| Feign Weakness | C | 1 | Skill | 5 Barrier; 2 Sapped on the target until its turn ends; 1 Preparation | 8 Barrier | Shadow/defence: a setup turn that is safe | defend and build | 6 + 2.4 + 1.5 = 9.9 | none |
| Choking Smoke | U | 1 | Skill | 2 Faltering on ALL, 4 Barrier | 7 Barrier | Shadow/group defence | blunt a crowd before a setup turn | 7.8 + 4.8 = 12.6 | none |
| Set the Stage | U | 1 | Skill | Next turn: 1 more Mana, 2 more cards. Hold | next turn 3 cards | Shadow/resources: the attack window | a quiet turn now for a big one | 4 + 6 + 1 = 11 | next turn only: no loop |
| Cold Patience | R | 1 | Skill | 2 Preparation, 8 Guarded, Hold | 11 Guarded | Shadow/precision: a guarded setup | two points and next turn safe | 3 + 8 + 1 = 12 | Preparation caps at 3 |
| Strike from Shadow | U | 2 | Attack | Deal 16; if the target is Faltering, 8 more. Hold | 20 | Shadow: the debuff-timed hit | Faltering first (Hobbling Jab, Pinned), then this | 16 + 8 x0.5 + 1 = 21 | none |
| Patient Coil | U | 1 | Aura | At the end of your turn: 2 Barrier per Preparation you have | Opening hand | Preparation management: saving pays defence | sit on 3 for 6 Barrier a turn, or spend | 1.6 x2.4 x4 = 15.4 | two copies: 12 at 3; it never makes Preparation |
| The Waiting Blade | R | 1 | Aura | At the start of your turn, with 3 Preparation: draw 1, 2 Barrier (no Mana since the review: a holding deck keeps 3 nearly every turn) | Opening hand | Setup to finisher: the full count pays until spent | spend 3 on the finisher and lose it, or hold | 0.4 x(7 + 3 + 3.6) x4 = 21.8 | two copies 2 Mana a turn at 3 Preparation; spending turns it off |
| Lingering Steel | U | 1 | Aura | At the start of your turn: each enemy is Sapped 1 per knife in it until its turn ends | Opening hand | Retained knives: defence while they sit | leave knives in the attackers | 3 knives x1.2 x4 = 14.4 | at most 3 an enemy; no damage |
| Steel Thicket | U | 1 | Aura | At the end of your turn: 1 Barrier per knife in all enemies | Opening hand | Group specialisation: spread wide | many enemies with knives, kept in | 3 x1.2 x4 = 14.4 | 9 a turn against three full enemies; 3 against one boss |
| Clean Extraction | U | 1 | Aura | The first time each turn you pull a knife: draw 1, 1 Barrier | Opening hand | Bounded extraction: selection | one pull a turn | 0.85 x4.2 x4 = 14.3 | once a turn |
| Lie in Wait | U | 1 | Aura | At the end of a turn you played no Attack: 6 Barrier, 1 Preparation | 9 Barrier | Defensive sequencing: the setup turn | skip attacking to bank | 0.4 x8.7 x4 = 13.9 | it pays Preparation, which only damage turns spend: a setup turn leads to a kill |
| Economy of Motion | U | 1 | Aura | The first time each turn you spend Preparation: if some is left, draw 1 and 3 Barrier | 5 Barrier | Spending management: partial spends | spend 1-2, not all 3 | 3 x0.75 x6.6 = 14.9 | once a turn |
| Recycled Steel | R | 1 | Aura | The first time each turn you pull a knife: embed a knife in a random enemy, 3 Barrier | Opening hand | Extraction that keeps a knife in play | pull where it counts, a knife goes back elsewhere | 0.85 x4 x(2 + 3.6 + 0.75) = 21.6 | once a turn; the embed can give Knife Work's Preparation |
| Cruel Precision | U | 1 | Aura | Whenever you put a debuff on an enemy with a knife in it: 2 Barrier | Opening hand | Debuff management | debuff the knifed enemies | 1.5 x2.4 x4 = 14.4 | each debuff once; Lingering Steel's Sapped counts (one an enemy a turn) |

### Six ways to play him

1. **Precision execution** (Measured Cut, Mark the Vein, Calculated Retreat, Poised Strike, Silent Massacre, Assassinate; Economy of
   Motion, Patient Coil, The Waiting Blade): spending all 3 is not always right. Poised Strike and The Waiting Blade pay for holding 3;
   Measured Cut, Mark the Vein and Calculated Retreat each want one point now; Economy of Motion pays for leaving some.
2. **Leave the knife** (Lodged Steel, Pinned, Barbed Anchor, Thousand Cuts; Lingering Steel): a knife left in gives control (Faltering,
   Sapped) or Thousand Cuts' hits. Bounded by 3 a target; nothing deals damage on its own each turn.
3. **Selective extraction** (Quick Pull, Pry Loose, Sleight of Steel, with Leave No Trace and Cut and Run; Clean Extraction, Recycled
   Steel): one knife for one job (damage, Exposed, cards, Barrier), the rest kept.
4. **Fieldwork** (Fan of Blades, Reaping Arc, Steel Rain; Steel Thicket): spread knives, then choose where to pull or hit all. Every
   card still works against one enemy; nothing spreads on a death.
5. **Shadow and timing** (Steady Hand, Bide in Shadow, Melt Away, Feign Weakness, Choking Smoke, Set the Stage, Cold Patience, Strike
   from Shadow; Lie in Wait, Cruel Precision): Hold, selection and debuffs line up the kill turn; defence pays Preparation, which only an
   attack spends, so it leads to damage.
6. **Hybrid** (Read the Wound, Exacting Pull, Weigh the Moment): knives into Preparation by reading (no pull), Preparation into pulls
   (one way). No card turns Preparation into knives, so there is no Preparation-knives-Preparation loop.

Utility and defence (non-Aura): Steady Hand, Weigh the Moment, Mark the Vein, Calculated Retreat, Pinned, Barbed Anchor, Fan of Blades,
Sleight of Steel, Bide in Shadow, Melt Away, Feign Weakness, Choking Smoke, Set the Stage, Cold Patience (14).

### Checks (expansion)

- **Loops:** the free cards (Steady Hand, Quick Pull) draw and make nothing. Every new trigger that draws, embeds or makes Mana is once a
  turn (Economy of Motion, Clean Extraction, Recycled Steel) or at a turn boundary (The Waiting Blade, Patient Coil, Lie in Wait, Steel
  Thicket, Lingering Steel). In an eight-card deck, Fan of Blades, Sleight of Steel, Clean Extraction and Recycled Steel gain cards but no
  Mana: three plays a turn at most. Recall the Blades turns knives into Preparation; nothing turns Preparation into knives.
- **Multiple copies:** two Patient Coils on 3 Preparation give 12 Barrier a turn and make nothing; two Waiting Blades 2 cards a turn (they made 2 Mana before the review), off
  the moment a finisher spends. Assassinate's kill refund is capped at 3 and needs a kill (never against one boss).
- **Single boss / human:** every strategy needs no kill and no intent; Sapped, Faltering and Barrier from knives work on a hero; the
  group cards (Silent Massacre, Steel Rain, Reaping Arc, Steel Thicket) are plain single-target cards against one.
- **Arena** (worked through legal actions; 540 HP, the other hero with 0 Barrier; the Preparation and knives on the units are visible to
  both players, so the threat can be read and answered by Barrier):

| Turn | Mana | Setup | Damage |
|---|---|---|---|
| Pry Loose+, Exacting Pull+, Measured Cut+ | 3 | 3 Preparation, 3 knives | 75 (14%) |
| Final Cut+ | 3 | 3, 3 | 67 (12%) |
| Exacting Pull+, Measured Cut+, Quick Pull+ (tested) | 2 | 3, 3 | 57 (11%) |
| The Waiting Blade turn: Poised Strike+, Measured Cut+, Quick Pull+ | 3 | 3, 1 | 56 (10%) |
| Steady Hand+, Mark the Vein+ (Exposed), Thousand Cuts+ | 3 | 0, 3 | 52 (10%) |
| Assassinate+, Quick Pull+ | 2 | 3, 1 | 47 (9%) |
| No setup: Strike, Quick Pull+, Lodged Steel+, Strike | 3 | 0, 1 | 35 (6%) |


## Saves, decks and replays

As for the Knight (DECISIONS #414): removed ids become their replacements; a pre-rework Assassin run is stamped, the player told, and a
fight in progress restarts; `RULES_VERSION` 34.

## Art

The 36 cards of the expansion (#424) have no art yet (listed in `docs/CLASS_REWORK_ART.md`). Before it: no new pictures. 27 cards keep theirs (Knife Juggle, Feint Strike, Shroud and Shank, Blade Flurry, Flick Knife, Whetted Edge, Recall the
Blades and Duck and Weave were drawn as flying daggers or Sly tricks: listed for review in `docs/CLASS_REWORK_ART.md`); the 28 new
cards use the placeholder. In code: the Knives chip on enemies (†, "n/3"), the Preparation chip on the hero (◔, "n/3"), tooltips and a
teaching tip; planting and pulling knives use the dagger icon and the flurry animation.
