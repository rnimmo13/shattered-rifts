# The Shaman: the totem cycle (2026-10-29, DECISIONS #430)

Robert's third direction for Ilvane (id `shaman`). His earlier versions (elements, totems that help spells, Trinity; DECISIONS #420-
#422, #427) are frozen in `reviews/balance-baselines/2026-10-29-shaman-cycle/` and described in the DECISIONS log. Card-by-card prices
are in [`shaman-ledger.md`](shaman-ledger.md) (generated); the rates are in `docs/14_CARD_COSTING.md` §15.

**Fantasy:** an elder shaman who casts Flame, Frost and Storm and keeps a row of totems. Each totem works every turn while it stands;
when he commands it, its spirit acts once more and is gone, and a new one takes its place at the back of the row. No summons, no
Trinity, no help on spells.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| The row | `HeroTrait.totems` gives 3 positions (cards add more, up to 5). The row is kept packed and in planting order: the front is the oldest. Shown on the Totems panel, the front one marked "Next". |
| Plant | `plant`: into the first free position (the back). With every position taken, the front totem is **pushed out** first: its spirit acts (its command ops) and it leaves, the rest move up, and the new one stands at the back. '*' is a random kind that is not rare. |
| Command | `totemCommand`: a totem's spirit acts `times` times and the totem is **consumed** (it leaves, the rest move up). 'front' (the next in the cycle), 'newest', a kind (the front-most of it), or 'all' (every totem standing when it began, front to back). |
| Rotate | `totemRotate`: the front totem moves to the back (nothing acts). |
| Passives | `TotemDef.passive`: ops at the start or the end of his turn, front to back, while the totem stands. End-of-turn passives run after his end-of-turn Auras; start-of-turn ones once the hand is drawn and the Mana set. |
| Spirit | The hero status `spirit`, never lost. Totem numbers read it through `per('spirit')` in their ops: +1 per point. The Elder Tree and the Moon Owl do not, and neither does the Hawk's own Spirit. |
| Triggers | Each act (a command or a push-out) answers `command` ("Whenever one of your totems acts") once, and `plant` answers each plant. |
| Moon Owl | Its passive gives the temporary status `spellcut` 1 (the next elemental spell this turn costs 1 less; the first one spends it all); its command gives `twinspell` 1 (the next elemental spell is played twice). |

| Totem | Every turn while it stands | When it acts (a command, or pushed out) |
|---|---|---|
| Hawk | end of turn: 2 (+1 per Spirit) Primed, only if he is not Primed | gain 1 Spirit (flat) |
| Bear | end of turn: 2 (+1 per Spirit) Barrier | 6 (+1 per Spirit) Barrier |
| Thunderbird | end of turn: 3 (+1 per Spirit) to 2 different random enemies, 25% more when one stands | 8 (+1 per Spirit) to every enemy |
| Elder Tree (rare) | start of turn: 1 Mana | 2 Mana |
| Moon Owl (rare) | start of turn: his first elemental spell costs 1 less | his next elemental spell is played twice |

The Hawk's Primed only when he is not Primed: Primed adds to every hit of his next attack, so a Hawk left standing over quiet turns
would otherwise pile it up onto a multi-hit Storm spell. Two Hawks do not Prime twice; they are the Spirit totems.

## Trait and starter

- **The Totem Cycle:** a Hawk, a Bear and a Thunderbird at the start, in that order; the rules above.
- **Starter (10):** 2 Strike, Defend, Spirit Call (command the front totem), 2 Ember Bolt, 2 Frost Ward, 2 Forked Lightning.

## Strategies (91 cards; 87 reward-eligible; 12 Auras)

- **Flame:** big single-target hits (Flare 10, Flame Spear 18, Pyroclasm 16 +8 on a Burning enemy, Inferno 30), Burn as a small extra,
  and Talon Strike (11, plant a Hawk). The Hawk's Primed lands on his next attack, so a Flame turn follows a Hawk turn.
- **Frost:** Barrier and Faltering (Rime Shield, Hoarfrost, Ice Wall, Winter's Embrace, Absolute Zero), Bear Call (plant a Bear).
- **Storm:** every enemy (Gathering Storm, which stacks; Thunderclap; Charged Sky; Maelstrom; Superstorm two big hits) or Forks
  (Forked Lightning, Spark Fork, Thunder Fork, Eye of the Tempest), Sapped, Thunderbird Call.
- **The cycle (glue):** plants for every totem (Hawk Call, Hawk Feather, Bear Hide, Storm Feather, Raise a Totem, Totem Circle,
  Talon Strike, Bear Call, Thunderbird Call, the rare Elder Tree and Moon Owl), commands (Spirit Call, Spirit Strike, Spirit Ward,
  Call Again, Hawk's Dive, Bear's Guard, Thunderbird's Cry, Last Called, Ancestral Exchange, Rally the Spirits, Great Spirit's Call),
  Turn the Wheel (the front to the back), positions (Raise the Pole, Carve the Spirit Pole), Totem Strike.
- **Auras that stack** (every copy answers on its own): Totem Drum, Harmony, Storm Sovereign (each totem act), Spirit Chorus (the
  front totem acts every turn), Bark Carapace, Lightning Rod, Thunder Roost, Smoulder, Heart of the Pyre, Hail Rite, Frostbound, Calm
  Before the Storm.
- **Spirit:** the commanded Hawk (1 each), Spirit Surge, Spirit Walk; Spirit Lance and Spiritstorm read it.

**Sequencing:** the order is the plan. Plant behind what you want to act next; command the front when its act is worth more than its
passive; Turn the Wheel when the front one should keep working; a full row makes every plant a free command.

## Checks the points can't do (guide §8)

- **Loops:** a free command or a free plant Consumes (a push-out is a free command, and the Elder's act is 2 Mana). No card makes the
  Elder act for less than it costs: the Elder costs 3 to plant and gives 1 a turn and 2 once. The Owl doubles only an elemental spell
  (never a command), and its discount is once a turn. Turn the Wheel and Wind Whisper draw one and discard one. Tested: an 8-card deck
  of free plants, Call Again, Turn the Wheel, Wind Whisper and the Elder plays fewer than 30 cards a turn over 30 seeds.
- **Multipliers:** Primed adds to every hit, so the Storm multi-hits are few and short (Superstorm 2 hits, Eye of the Tempest a Fork
  of 4); the Hawk Primes only when he is not Primed. Spirit grows only through Hawks commanded and three cards.
- **Burst (through legal actions, 540 HP Arena hero):** at 4 Spirit with Primed 6 and an Owl at the front, Spirit Call (the Owl) then
  Inferno+ played twice: 38 + 6 + 38 = 82 (15%) on a 4-Mana turn. A full row of three Thunderbirds at 4 Spirit and Great Spirit's
  Call deals 3 x12 = 36 to every enemy for 3 Mana and empties the row.
- **Arena:** the totems work against a hero the same way (the Thunderbird's Fork finds the lone hero, 25% more). Nothing reads an
  enemy intent.

## Saves, decks and replays

`CLASS_REWORKS.shaman` is version 3 ("the totem cycle"): a run saved before it is told, its fight starts again, and its removed cards
become their nearest new ones (`RETIRED_CARDS`, the totem-cycle block: Flame Shield > Rime Shield, Pyre Ward > Ice Wall, Burning
Aegis > Heart of the Pyre, Static Crackle > Spark Fork, Squall > Storm Front, Prism Spell > Totem Strike, Communion > Spirit Surge,
Spirit Memory > Read the Winds, Crystal Ward > Stone Skin, Ironbark > Ice Wall, Smoke Offering > Tidecaller, Skybreaker > Flame Spear,
Spirit Vision > Carve the Spirit Pole, Gale Strike > Spirit Strike). Old Arena games and replays are refused by the next
`RULES_VERSION`.

## Art

The carved Hawk, Bear and Elder Tree and their spirits are drawn (`apps/web/public/art/totems`, #429); the Thunderbird and the Moon
Owl keep their marks until drawn. New cards with no picture: Flare, Talon Strike, Pyroclasm, Raise a Totem, Hawk Feather, Bear Hide,
Storm Feather, Totem Circle, Spirit Strike, Spirit Ward, Turn the Wheel, Last Called, Totem Strike, Totem Drum, Wind Whisper
(`docs/CLASS_REWORK_ART.md`).
