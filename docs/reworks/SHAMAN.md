# The Shaman rebuilt: elements, totems and Trinity (2026-10-29, DECISIONS #420, #421, #422)

Robert's direction, worked out in `SHAMAN_ELEMENTS_PROPOSAL.md`. It replaces the first rework (DECISIONS #418: one aimed command a
turn, Empower, Rousing, Shelter), which never shipped. The Defect copy before both is frozen in
`reviews/balance-baselines/2026-10-29-pre-identity-reworks/` (`cards/shaman.md`). Card prices: [`shaman-ledger.md`](shaman-ledger.md)
(generated); rates: `docs/14_CARD_COSTING.md` §15.

**Fantasy:** an elder shaman who casts Flame, Frost and Storm himself. His totems stand beside him and lend their power to his
spells, and he calls on their spirits to strike and shield for him. No summons: the spirits act and are gone.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| Elements | A spell's tag: `flame`, `frost` or `storm` (card text "Flame." and so on); `prism` counts as the element not cast yet this turn, for Trinity and the help (not for the element Auras). Flame: single-target damage and **Burn** (`burn`, exactly as Bleed but its own status, #421), Thorns for defence. Frost: Barrier and Faltering, attacks that leave enemies Faltering. Storm: every enemy or random ones, Sapped for defence. Damage spells are Attacks; defensive spells are Skills. |
| Totems | `HeroTrait.totems` 3 positions, grown to 5 by `totemSlot`. He starts with a **Hawk**, a **Bear** and a **Thunderbird**. A totem stays for the fight; planting into a full row asks which one to replace, or keep them all. "A totem of your choice" offers only the three basic kinds. |
| Help each turn | `TotemDef.boost`: the **first spell of its element each turn that has a damage or Barrier number of its own** gets +N on each such number: every hit and every enemy (Hawk +3 Flame, Bear +3 Frost, Thunderbird +2 Storm, Elder Tree +2 the first elemental spell). **Never on an "If ...:" bonus** (#422). A spell with no damage or Barrier of its own (Phoenix Feather, Tempest Call) leaves the help for the next one and still counts for Trinity. Two of a kind help twice; every 2 Spirit add 1 to each totem's help. The help goes to the card's own play, not its echo, is carried over a choice, and is in the number shown on the card. |
| Commands | **Only cards command** (#421). The op `totemCommand` (`commandTotem` / `commandOne`): **one totem of a kind** ("Command a Hawk": Hawk's Dive, Bear's Guard, Thunderbird's Cry, Hawk Call, #422), one of the player's choice (Spirit Call, Rally the Spirits twice), a random one (Call Again, Spirit Chorus) or **every totem he has** (Great Spirit's Call, 3 Mana: the duplicate-totem payoff). The spirit aims by itself: Hawk 6 to a random enemy, Bear 5 Barrier to him, Thunderbird 3 to every enemy, **Elder Tree 1 Spirit and a card**, Moon Owl a Free Spell. Every Spirit adds 1 to every damage and Barrier number of a command. Each totem that acts answers "Whenever you command a totem" once. A free command (Call Again) **Consumes** (#422: three Elder Trees and two Call Agains in a thin deck looped for ever). Not an attack, not a card. |
| Rare totems | `rare: true`, planted only by Call the Elder Tree (`onPlant`: 2 Spirit) and Call the Moon Owl (`onTrinity`: 1 Mana). |
| Trinity | The first time each turn he has cast a Flame, a Frost and a Storm spell: 1 Spirit (`trinity` trigger; the `elements` event carries the elements cast and whether Trinity fired). No count, streak or halving. |
| Spirit | `spirit` on the hero: **no cap, never goes down** (Robert's decision). +1 to every command, +1 per 2 to every totem's help. Gained from Trinity, the Elder Tree and Spirit cards; nothing spends it. |
| Free Spell | `freespell`: his next elemental spell costs 0 (Moon Owl's command, Shaman's Insight). |
| Visibility | `SideView.totems`, `commanded`, `elementsTurn`, `trinityDone` for both players. The number on a card counts the help it will get. |

## Trait and starter

- **Spirit and Trinity:** the three totems, their help, and Trinity's Spirit (no command of its own since #421). About 30 over four
  turns, still well above the other traits (14-21), by design. If he plays too strong, the levers are the +3/+3/+2 help and the
  command cards' numbers.
- **Starter (10, #427):** 2 Strike, 1 Defend, **Spirit Call** (a totem of your choice acts), 2 Ember Bolt (Flame), 2 Frost Ward (Frost), 2 Forked Lightning (Storm; was
  Gathering Storm (Storm). A 5-card hand holds a spell of every element about 40% of the time.

## Strategies (87 cards; Flame 17, Frost 15, Storm 16, glue 39)

1. **Flame:** Searing Lash, Kindle, Firebrand, Twin Cinders, Flame Spear, Immolate, Wildfire, Ember Lance, Spirit Lance, Phoenix
   Feather, Flashpoint, Inferno; defence: Flame Shield, Pyre Ward; Auras: Smoulder, Heart of the Pyre, Burning Aegis.
2. **Frost:** Frost Needle, Chill Touch, Ice Shatter, Avalanche, Absolute Zero; defence: Frost Ward, Rime Shield, Hoarfrost, Ice Wall,
   Glacier Guard, Frozen Grasp, Ice Mirror, Winter's Embrace, Glacial Fortress; Auras: Hail Rite, Frostbound.
3. **Storm:** Gathering Storm, Chain Lightning, Static Crackle, Gale Call, Thunderclap, Squall, Storm Front, Maelstrom, Charged Sky,
   Eye of the Tempest, Superstorm, Tempest Call; defence: Wind Wall, Static Veil; Auras: Lightning Rod, Calm Before the Storm, Storm
   Sovereign.

Glue: totems and commands (Spirit Call, Hawk's Dive, Bear's Guard, Thunderbird's Cry, Hawk Call, Bear Call, Thunderbird Call, Call Again, Raise the Pole, Carve the Spirit Pole, Rally the
Spirits, Ancestral Exchange, Thunder Roost, Bark Carapace, Call the Elder Tree, Call the Moon Owl, Spirit Chorus, Great Spirit's
Call), Trinity and Spirit (Prism Spell, Spirit Surge, Communion, Spiritstorm, Harmony, Spirit Walk) and utility (Stone Skin,
Tidecaller, Spirit Memory, Read the Winds, Clear Spring, Crystal Ward, Ironbark, Shaman's Insight, Smoke Offering, Skybreaker, Spirit
Vision, Gale Strike).

## The balance pass of 2026-10-29 (DECISIONS #422)

The cards and rules as they stood before it are frozen in `reviews/balance-baselines/2026-10-29-shaman-balance-pass/`.

| Card | Before | After |
|---|---|---|
| Call Again | 0: a random totem acts | 0: the same, **Consume** (upgrade + 2 Barrier, still Consumes) |
| Spirit Call (basic) | a totem of your choice, 2 Barrier | a totem of your choice (upgrade + 3 Barrier) |
| Hawk's Dive | every Hawk, 3 Barrier; upgrade: every Hawk twice | **a Hawk**, 3 Barrier; upgrade 6 Barrier |
| Bear's Guard | every Bear, 3 Barrier | **a Bear**; upgrade + 3 Barrier |
| Thunderbird's Cry | every Thunderbird, 3 to all, draw 1 | **a Thunderbird**, draw 1; upgrade + 3 to all |
| Hawk Call | plant a Hawk, every Hawk acts, 2 Barrier | plant a Hawk, **a Hawk** acts; upgrade + 3 Barrier |
| Rally the Spirits | 1: one of your choice twice | **2**: the same, 4 Barrier |
| Great Spirit's Call | 2: every totem, 5 Barrier | **3**: the same |
| Spirit Chorus | 1 Aura: a random totem a turn | **2** Aura: the same and 2 Barrier |
| Storm Sovereign | 4 to all a command (5) | **3** (4): one card can now command several totems |
| Squall | 2 x6 at random | **2 x4** (upgrade 3 x4) |
| Chain Lightning | 4 x3 at random | **3 x3** (upgrade 4 x3) |
| Eye of the Tempest | 3 x7 | **3 x6** (upgrade 4 x6) |
| Twin Cinders | 5 x2 | **4 x2** (upgrade 6 x2) |
| Prism Spell | 3, 3 Barrier, 1 to all | **4, 3 Barrier** (upgrade 6, 5) |
| Ice Shatter | 7, +6 if the target is Faltering | **6 + 3 a Faltering on the target** (upgrade 9) |
| Absolute Zero | 10 to all, 2 Faltering to all | **10 + 3 a Faltering on each** to all, then 2 Faltering (upgrade 13) |

Rules: the help skips spells with no damage or Barrier of their own and never adds to an "If" bonus; a named command moves one
totem of the kind. Verified examples before and after (starting totems, 0 Spirit, the help unused): Kindle 12 -> 9, Rime Shield 15
-> 12, Squall on one enemy 24 -> 16; three Hawks at 4 Spirit, Hawk's Dive+ 60 -> 10 (Great Spirit's Call, 3 Mana, makes them all act:
30). Frost now finishes: Ice Shatter on an enemy with 2 Faltering deals 12 (15 with the Bear's help), Absolute Zero 16 to it.

## Forks, a new starter, and choosing totems on the panel (2026-10-29, DECISIONS #427)

The cards as they stood are frozen in `reviews/balance-baselines/2026-10-29-shaman-forks/`.

- **Fork N** (generic: a damage effect to N *different* random enemies, `distinct`, with `lonePct: 25`): N enemies once each, or,
  when only one enemy stands as it begins, that one 25% harder (5 -> 6). The bonus reads the enemies standing when the spell begins,
  so a first hit that kills does not make the second harder. Each hit takes the Thunderbird's help (+2), as any Storm hit.
- **Starter:** 2 Strike, Defend, Spirit Call, 2 Ember Bolt, 2 Frost Ward, **2 Forked Lightning** (basic, 1 Mana: Fork 2 of 5; upgrade
  7). **Gathering Storm** is a common reward now (4 to all, every copy +3 each cast; upgrade 6), not in the starter.
- **New Forks:** Spark Fork (common, 0: Fork 2 of 4; upgrade 5), Thunder Fork (uncommon, 2: Fork 3 of 10; upgrade 13).
- **Choosing a totem** (a command of your choice, or where a planted totem goes into a full row) is done on the totem panel itself:
  the panel opens and glows, the totems that can be chosen pulse (number keys 1-5 pick them), the rest dim; no pop-up. Choosing a
  kind of spirit to plant still uses the card choice window.
- Pricing: a Fork 2 is worth ~1.7 times its number (40% of fights one enemy at +25%, 60% two or more), a Fork 3 ~2.0.

## Checks the points can't do (guide §8)

- **Ramp:** Spirit has no cap. A Trinity deck with Spirit cards gains 2-3 a turn; by turn 10 of a boss fight it may hold 10-15
  (+10-15 a command, +5-7 a help). That is the intended power curve. The long boss fight is the case to watch.
- **Command loops:** every command comes from a card or Spirit Chorus (one a turn). The Elder Tree's command draws a card and gives
  Spirit, so a free command must Consume: Call Again does (#422); every other command card costs Mana. No command makes Mana (the Moon Owl's is on Trinity, once a turn). Great Spirit's Call with a full row and Storm Sovereign is the multiplier (3 a totem commanded).
- **Burn:** Wildfire doubles the target's Burn (at most 10 more) and Consumes; Flashpoint (3 a Burn) Consumes.
- **Arena:** no reaction prompts; the Hawk's dive is random; totems, commands, elements and Trinity are on his side of the view.

## Saves, decks and replays

`CLASS_REWORKS.shaman` version 2 ("elements, totems and Trinity"): runs saved under the Defect copy or the first rework are migrated
(their cards through `RETIRED_CARDS`, by a chain from the Defect ids), the player is told, and a fight in progress restarts.
`RULES_VERSION` 34 still covers every unreleased rework.

## Art

No new pictures. Ids kept from earlier pools keep their art (Frost Needle, Eye of the Tempest, Hail Rite, Bark Carapace, Ancestral
Exchange, Communion, Spiritstorm, Hawk Call, Bear Call, Stone Skin, Tidecaller, Spirit Memory, Clear Spring, Crystal Ward, Ironbark,
Skybreaker, Gale Strike, Smoke Offering, Wildfire, Flashpoint, Gathering Storm); the rest use the placeholder (list in
`docs/CLASS_REWORK_ART.md`). In code: the Totems panel, the Trinity panel (the Suits' row with three element pips), tooltips, a
teaching tip and the Learn page's totem list.
