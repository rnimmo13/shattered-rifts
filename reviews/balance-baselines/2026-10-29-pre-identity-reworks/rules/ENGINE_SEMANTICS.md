# Engine semantics needed to read the archived cards

Frozen 2026-10-29 at commit 82867b0 (game 0.121.0, RULES_VERSION 33). This is what the numbers in `resolved/` *meant* at that
commit, so they can be priced later without the live engine. The full source of that engine is in `source/` (a `git archive` of the
commit); this file is the part a balance reader needs.

## Turn structure

- PvE: the hero's turn (draw 5, refill to 3 Mana), then every enemy acts in order, then the next hero turn. `turn` counts both sides.
- At the start of a unit's own turn its Barrier falls away, except: Blur keeps all of it (one turn per stack), Plating N keeps up to N
  and then loses 1 stack, Fortified keeps 75%. Then Bleed ticks, then Hangover is paid.
- At the end of a side's turn: its own units lose 1 Faltering; the OTHER side's units lose 1 Exposed (so Exposed 1 put on an enemy on
  your turn lasts through your next turn). Ghostly, Brittle, Debilitated and Stun also count down then. Fate (doom) kills a unit at the
  end of its own turn if its HP is at or below its Fate.
- The hand is discarded at the end of the turn, except Hold (retain) cards; Fleeting (ethereal) cards still in hand are consumed.

## Damage

- **Attack damage** is damage from an Attack card, or a unit's own strike (an enemy move, a companion act). Only attacks read Might,
  Sapped, Faltering, the stances, Exposed, Cruelty, Primed, Edge and the like, and only attacks set off "when attacked" Traps, Thorns
  and Reflect. Damage from a Skill, an Aura, a totem, a Trap or a potion is the printed number (DECISIONS #376), changed only by the
  difficulty's damage percent.
- Order for an attack hit: base + Might - Sapped (+ Edge on knife cards, + Primed on the first damage effect, + Spirit on totem effects,
  which are not attacks), then Clutch Genes %, Faltering x0.75 (x0.5 Debilitated), Radiant x3 or Fury x2, target in Fury x1.5, target
  Exposed x1.5 (x2 Debilitated; Cruelty x1.25 more), Empowered x2, Tracking x1.5 on a Faltering target; floors at each step.
- Ghostly caps each attack hit at 1; Shielded cancels one hit entirely; Barrier soaks attack damage before HP. Direct damage (Bleed,
  Fate, loseHp) ignores Barrier.
- Thorns N: every attack hit on the unit deals N direct damage back to the attacker. Temporary Thorns (`statusTheirs`) wear off at the
  end of the other side's next turn.
- Overflow (DECISIONS #321): a single-target attack that kills a companion carries 100% of the excess to the next companion, then the
  hero.

## Statuses the archived classes lean on

| Status (id) | Player name | Meaning at this commit |
|---|---|---|
| `might` | Might | +1 attack damage per stack, permanent |
| `exposed` | Exposed | takes 50% more attack damage; counts down at the end of the other side's turn |
| `faltering` | Faltering | deals 25% less attack damage; counts down at the end of its own turn |
| `plating` | Plating | keeps up to N Barrier through its turn start, then loses 1 stack |
| `thorns` | Thorns | reflects N to each attacker, per hit |
| `seared` | Bleed | N direct damage at the start of its turn, then N-1 |
| `doom` | Fate | dies at the end of its own turn while HP <= Fate |
| `vigor` | Primed | the next attack card's first damage effect deals N more (per hit), then spent |
| `edge` | Edge | knife-tagged attacks deal N more, permanent |
| `bracing` | Bracing | +N to every Barrier gain |
| `resonance` | Spirit | +N to every totem effect's damage/Barrier, and to a charging totem's growth |
| `calm` / `wrath` / `radiant` | Serene / Fury / Radiant | stances, at most one: Fury doubles attacks dealt and takes x1.5; Radiant triples attacks dealt and ends with the turn (+1 Mana on entry). Serene's exit Mana was moved into the Monk's trait at DECISIONS #413 (2 Mana, first exit each turn) |
| `mantra` | Fervor | at 10 the stacks are spent and the hero enters Radiant |
| `sapped` | Sapped | its attacks deal N less |
| `guarded` | Guarded | N Barrier at the start of its next turn |

## Resources and objects

- **Arcana** (`stars`, the Spellblade's): a second currency gained by `stars` ops and spent by `starCost` on top of Mana; persists
  between turns; `starX` cards spend all of it. Auras answer `gainArcana` / `arcana` (spent).
- **Sharpen** (`forge` op): adds a permanent `bonus` to every copy of the named card in hand, draw and discard (and to the card itself
  if it is that card); the running total is kept per card id (`SideState.forged`), and a new copy of a `weapon` card starts with it
  (DECISIONS #399). The Obsidian Blade (`starforged-blade`) deals 10 + its bonus. If no copy exists, `forge` creates one in hand.
- **Totems** (`runes`, the Shaman's): a FIFO row of `runeSlots` (3). `channel` plants at the end; a full row first awakens (`evoke`) and
  removes the OLDEST. Each totem's passive fires at the end of your turn (Owl at the start). `evoke` awakens the oldest N (newest with
  `last`). `pulse` fires passives now. Totem damage is not an attack. Archived totems: Hawk (spark) 3 random / 8 random; Bear (ward)
  2 Barrier / 5 Barrier; Elder (hollow) charges 6 +6 a turn, awakens on the weakest enemy; Owl (prism) +1 Mana at turn start / +2;
  Splinter 4 charge to ALL, -1 each pulse / twice its charge.
- **Daggers** (`sleeve-knife`, the Assassin's): 0-cost Attack, 4 damage, Consume, tag `knife` (Edge applies). Created by cards and by
  the trait every turn.
- **Thralls** (the Necromancer's `bone-thrall`): companions that never act; `raise` makes a new one with that HP or grows the weakest
  when all 3 slots are full; `command` makes each companion run the ops.
- **Traps** (`snare` cards): set face down (at most 3), spring automatically on their trigger, then go to the discard pile.
- **Foresee N** (`scry`): look at the top N, draw the one you choose, discard the rest.

## Card upgrades

A card with a hand-written `up` uses it; otherwise `plus()` raises every number: damage +3 (+1 per hit when it hits several times),
Barrier +3, heal +3, statuses +1 (+2 from 5 stacks), draw +1, Foresee +1 (+2 from 4), Raise +2, Sharpen +2, `addCard` times +1, never
Mana; a card with nothing to raise costs 1 less (never to 0 if it makes Mana/cards or scales: it Holds instead). X cards get X+1.
Auras need a hand-written `up` (the `power` op is never raised).

## Costing reference

The live costing guide at this commit is `docs/14_CARD_COSTING.md` (copied in `docs/`). Its rates were worked out from these five
classes; the rework replaces their identities, so read the old rates as LEGACY rates for these archived pools.
