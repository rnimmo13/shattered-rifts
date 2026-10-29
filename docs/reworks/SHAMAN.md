# The Shaman rebuilt: elements, totems and Trinity (2026-10-29, DECISIONS #420, #421)

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
| Help each turn | `TotemDef.boost`: the first spell of its element each turn deals or gives more (each damage and Barrier number on it): Hawk +3 Flame, Bear +3 Frost, Thunderbird +2 Storm (each hit), Elder Tree +2 to the first spell of any element. Two of a kind help twice. Every 2 Spirit add 1 to each totem's help. The help goes to the card's own play, not its echo, and is carried over a choice it asks. |
| Commands | **Only cards command** (#421: no free command, no action to press). The op `totemCommand` (`commandTotem(spirit, times)`) makes every totem of a kind act (Hawk's Dive, Bear's Guard, Thunderbird's Cry, Hawk Call), one of the player's choice (`'choose'`: Spirit Call, Rally the Spirits), a random one (Call Again, Spirit Chorus) or all of them (Great Spirit's Call). The spirit aims by itself: Hawk 6 to a random enemy, Bear 5 Barrier to him, Thunderbird 3 to every enemy, Elder Tree 1 Spirit and a card, Moon Owl a Free Spell. Every Spirit adds 1 to every damage and Barrier number of a command. Not an attack, not a card. |
| Rare totems | `rare: true`, planted only by Call the Elder Tree (`onPlant`: 2 Spirit) and Call the Moon Owl (`onTrinity`: 1 Mana). |
| Trinity | The first time each turn he has cast a Flame, a Frost and a Storm spell: 1 Spirit (`trinity` trigger; the `elements` event carries the elements cast and whether Trinity fired). No count, streak or halving. |
| Spirit | `spirit` on the hero: **no cap, never goes down** (Robert's decision). +1 to every command, +1 per 2 to every totem's help. Gained from Trinity, the Elder Tree and Spirit cards; nothing spends it. |
| Free Spell | `freespell`: his next elemental spell costs 0 (Moon Owl's command, Shaman's Insight). |
| Visibility | `SideView.totems`, `commanded`, `elementsTurn`, `trinityDone` for both players. The number on a card counts the help it will get. |

## Trait and starter

- **Spirit and Trinity:** the three totems, their help, and Trinity's Spirit (no command of its own since #421). About 30 over four
  turns, still well above the other traits (14-21), by design. If he plays too strong, the levers are the +3/+3/+2 help and the
  command cards' numbers.
- **Starter (10):** 2 Strike, 1 Defend, **Spirit Call** (a totem of your choice acts), 2 Ember Bolt (Flame), 2 Frost Ward (Frost), 2
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

## Checks the points can't do (guide §8)

- **Ramp:** Spirit has no cap. A Trinity deck with Spirit cards gains 2-3 a turn; by turn 10 of a boss fight it may hold 10-15
  (+10-15 a command, +5-7 a help). That is the intended power curve. The long boss fight is the case to watch.
- **Command loops:** every command comes from a card (or Spirit Chorus, one a turn); no command makes a card or Mana (the Moon Owl's
  Mana is on Trinity, once a turn). Storm Sovereign with several command cards in a turn is the multiplier.
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
