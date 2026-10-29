# The Shaman rebuilt: commanded totems (2026-10-29, DECISIONS #418)

From `docs/BASE_CLASS_REWORKS.md` §5. The Defect copy he was (DECISIONS #371: an orb queue that pushed the oldest out, Focus, Owl
Mana, the 0-cost and status-card packages) is frozen in `reviews/balance-baselines/2026-10-29-pre-identity-reworks/`
(`cards/shaman.md`). Card prices: [`shaman-ledger.md`](shaman-ledger.md) (generated); rates: `docs/14_CARD_COSTING.md` §15.

**Fantasy:** he plants enduring spirit anchors and chooses which spirit manifests. A totem is not an orb in a queue and its spirit is
not a companion: it appears when called, acts once, and returns.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| Positions | `HeroTrait.totems` (3, `TOTEM_SLOTS`) gives the side `SideState.totems`: three fixed positions, each a spirit id or empty. Shown in the Totems panel by the hero. They last the fight. |
| Spirits | `db.totems` (`TotemDef`): **Hawk** (aim: an enemy; 4 damage, not an attack: no Might, no Exposed, no Thorns or Traps), **Bear** (aim: a friendly; 4 Barrier), **Elder** (no aim; 1 Spirit and a card; cannot be empowered). A totem does nothing on its own: no passive, no awakening. |
| Plant | `plant(spirit)`: into the first empty position. With all three taken the player chooses one to replace, **or keeps them all** (no plant). `plant(spirit, true)` (Hawk's Counsel, Ancestral Exchange): a position the player chooses, empty or taken. `plant('*')`: the player chooses the kind first. A replacement is not a command and gives nothing by itself; it fires `replace` only when the kind changed. With nobody to ask (a trigger), the first empty position, and nothing replaced. |
| Command | The action `{ type: 'command', totem, target?, empower? }`, offered by `legalActions` on your own turn with no choice pending: **once a turn** (`SideState.commanded`, cleared at your turn's start), any planted totem, any legal target of its aim (a Hawk is bound by Taunt, as an aimed card is). It is an ability, not a card: it costs no Mana, is not played, and never counts as an Attack. Fires `command` (narrowed by `rune` to one spirit). |
| Spirit | Status `spirit` on the hero: at most 3 (`SPIRIT_MAX`), kept between turns. `empower: true` spends one on a Hawk or Bear command for +2 (`SPIRIT_BOOST`): at most one a command. The Elder makes Spirit and can never spend it, so there is no gain/spend loop. |
| Rousing | Status `rousing` (this turn): the next Hawk or Bear command adds it, and it is spent ("your next Hawk or Bear command" on the card). An Elder command neither uses nor wastes it. |
| Shelter | Status `shelter` (this turn): the next Bear command gives its Barrier to every friendly (the hero alone when he has no companions). |
| Uproot | `uproot` empties every position (`per('uprooted')` counts them). With none planted there is nothing to command until he plants again. |
| Ownership and PvP | The positions are on his side and in the view for both players (`SideView.totems`, `commanded`); the command is his own action on his turn: no reaction prompts. The server's action cleaner and the replay checker know `command`. |
| Bots | The greedy bot commands once nothing in hand is worth playing (so Rousing lands on it); the smart bot searches commands like plays. |

## Trait and starter

- **Spirit Caller:** three totem positions; once each turn, command one; start every fight with a Hawk planted. (~18 over four turns:
  the command, nothing passive; guide §15.) No triple-totem start, no Splinter, no pulse every turn.
- **Starter (10):** 4 Strike, 4 Defend, **Wardkeeper's Pact** (1: 5 Barrier, plant a Bear), **Guided Talon** (1: 6; if you have a
  Hawk, Rousing 3). Turn 1 asks the question at once: Guided Talon and a 7-damage Hawk command, or Wardkeeper's Pact and a choice between
  the Hawk and the Bear, given the enemy's intent. No rare is needed.

## Strategies

1. **Storm (the Hawk on the attack):** Hawk Call, Spark Lash, Hawk's Eye, Diving Talon, Hawk's Counsel, Stormcrown, Arc Lightning,
   Thunderhead, Eye of the Tempest, Stormcaller's Rite, Verdict of the Sky. Package: Stormcaller's Rite (Rousing 8, 1 Spirit) then an
   empowered Hawk: 4 + 8 + 2 = 14 to one enemy, and Stormcrown's 4 to all.
2. **Shelter (the Bear and Barrier):** Rime Strike, Still Water, Frostbark, Bear Hug, Shared Shelter, Frostglass, Deep Den, Hail Rite,
   Bark Carapace, Ancestral Bulwark, Deep Freeze, Roar of the Den. Package: Ancestral Bulwark (14 Barrier, Rousing 6) and the Bear:
   24 Barrier for 2 Mana, Roar of the Den's 5 to all.
3. **Rites (Spirit, the Elder, replacement):** Call the Elder, Resonant Strike, Tune the Spirits, Spirit Guide, Ancestral Exchange,
   Rite of Returning, Resounding Call, Elder's Wisdom, Chorus of Spirits, Spirit Drum, Circle of Ancestors, Elder Communion, Heart of
   the World Tree, Spiritstorm, Release the Spirits, Totem Volley. Package: the Elder most turns for Spirit and cards, Circle of
   Ancestors paying for a deliberate swap, then Spiritstorm (4 + 12 to all) or Release the Spirits (6 a totem to all).

Glue: Stone Skin, Gale Strike, Ember Toss, Mudslide, Tidecaller, Arc Flash, Frost Needle, Spirit Memory, Clear Spring, Crystal Ward,
Ironbark, Skybreaker. All three strategies work against a single boss; no kill or attack intent is needed.

## Card disposition (53 live: 31 kept or changed, 22 new; 53 removed)

**Kept (same card or lightly tuned):** Stone Skin, Ember Toss, Mudslide, Tidecaller, Arc Flash (upgrade 5 + 1 Exposed), Frost Needle
(4, upgrade 6), Gale Strike (8: its cost cut was free), Clear Spring, Crystal Ward, Ironbark, Skybreaker, Spirit Memory (6 Barrier, no
Consume).

**Changed (same id, new job):** Hawk Call (plant a Hawk, Rousing 4, 4 Barrier), Spark Lash (7, plant a Hawk, Rousing 2), Totem Volley (4
a totem), Rime Strike (6, 3 Barrier, plant a Bear), Still Water (`chilled-focus`: Barrier, a card if a Bear), Call the Elder
(`gathering-dusk`), Resonant Strike (8 and 1 Spirit), Spirit Guide (`driver-of-runes`: a card if an Elder), Stormcrown (Hawk
commands hit all), Arc Lightning, Frostglass, Deep Den (`void-pulse`), Hail Rite (`permafrost`), Chorus of Spirits (per kind), Bark
Carapace (per totem), Elder Communion (`tune-the-lattice`: 3 Spirit, draw 2; no permanent Focus), Deep Freeze, Verdict of the Sky
(`falling-star`, 3 Mana, was 5), Release the Spirits (`shatter-the-row`: uproot for damage, no mass awakening).

**New:** Wardkeeper's Pact, Guided Talon, Hawk's Eye, Diving Talon, Frostbark, Bear Hug, Tune the Spirits, Hawk's Counsel, Thunderhead,
Shared Shelter, Ancestral Exchange, Rite of Returning, Resounding Call, Elder's Wisdom, Spirit Drum, Eye of the Tempest, Stormcaller's
Rite, Ancestral Bulwark, Roar of the Den, Circle of Ancestors, Heart of the World Tree, Spiritstorm.

**Removed** (into the nearest new card, `retired.ts` Shaman identity block): the orb queue and slots (Twin Awakening, Many Voices,
Glyph Lattice, Carve a Notch, Echoing Loop, Gathering Dark, Aegis Array, Echo Cascade, Sparkstorm, Storm Pole, Cold Snap, Wild Call,
Splinter Wheel, Shard Chorus, Prism Cut, Night Veil, Prismatic Cascade); permanent Focus and the Rites-of-Auras package (Tune the
Lattice's old Focus, Thundercall, Tuning Fork, White Noise, Spiritfont, Echoing Form, Overtune, Machine Learning, Sentinel Sigil,
Earthen Might, Hyperbeam, Fire Bloom); the Owl Mana and free-Mana cards (Leyline Tap, Tidal Surge, Inner Flame, Heart of Flame,
Smoke Offering); the 0-cost recursion package (Spirit Wave, Wild Heart, Wind's Favor, Rapids, River Scour, Whirlpool, Retune, Gathering
Storm, Shifting Strike); the status-card package (Gather Kindling, Kindling, Kindled Rite, Glacial Memory, Feed the Fire, Boulder Fist,
Blazing Aperture, Biased Weave, Gust Step, Elemental Focus); and Storm Call. Mudslide and Ironbark still make junk cards; the junk
cards themselves stay (enemies and events use them).

## Checks the points can't do (guide §8)

- **Loops:** no card or command makes Mana now except Skybreaker's kill; the Elder's draw is one a turn (one command); Spirit is capped
  at 3 and spent one a command; no card grants a second command; Release the Spirits Consumes.
- **Multipliers:** Rousing and Spirit add flat amounts to one command. The biggest single command: Stormcaller's Rite+ (11) and
  Spirit: 4 + 11 + 2 = 17 for 1 Mana and the turn's command. The biggest turn: Verdict of the Sky (24, 2 Exposed, Rousing 5) and an
  empowered Hawk (11), with Stormcrown out: about 40 for 3 Mana, a rare's turn.
- **Turn-four ceiling:** a Rites deck with Spirit Drum and Heart of the World Tree empowers every command (+2) and gains Barrier: two
  Auras' worth, bounded by one command.
- **Tiers:** every command is flat, so it shrinks against Tier X HP; Verdict of the Sky's Exposed keeps up.
- **Arena:** totems and commands are visible to both players; a Hawk aims at the other hero or a companion, a Bear at his own side.

## Saves, decks and replays

As for the Knight (DECISIONS #414): removed ids become their replacements (`RETIRED_CARDS`); a pre-rework Shaman run is stamped
(`CLASS_REWORKS.shaman`), the player told, and a fight in progress restarts. `RULES_VERSION` 34 (it covers every identity rework, none of which has shipped yet; the new `command` action is in it):
an old action log replays under its own version or is rejected, never silently reread. The old rune machinery (`channel`, `evoke`,
`pulse`, `runeSlots`, `resonance`) stays in the engine, unused by any live card, so archived fixtures still read.

## Art

No new pictures. 31 cards keep theirs; those drawn as an orb row or an awakening burst are listed for review in
`docs/CLASS_REWORK_ART.md`. The 22 new cards use the placeholder. In code: the Totems panel (three positions, a mark and a word each, the
commandable ones as buttons with a bright edge, Spirit pips and the Empower toggle), the command aim bar, the spirit and position tiles
of the plant choice, tooltips, a teaching tip and the Learn page's spirit list.
