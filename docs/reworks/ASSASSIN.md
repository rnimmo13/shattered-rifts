# The Assassin rebuilt: Preparation and embedded knives (2026-10-29, DECISIONS #416)

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

## Saves, decks and replays

As for the Knight (DECISIONS #414): removed ids become their replacements; a pre-rework Assassin run is stamped, the player told, and a
fight in progress restarts; `RULES_VERSION` 34.

## Art

No new pictures. 27 cards keep theirs (Knife Juggle, Feint Strike, Shroud and Shank, Blade Flurry, Flick Knife, Whetted Edge, Recall the
Blades and Duck and Weave were drawn as flying daggers or Sly tricks: listed for review in `docs/CLASS_REWORK_ART.md`); the 28 new
cards use the placeholder. In code: the Knives chip on enemies (†, "n/3"), the Preparation chip on the hero (◔, "n/3"), tooltips and a
teaching tip; planting and pulling knives use the dagger icon and the flurry animation.
