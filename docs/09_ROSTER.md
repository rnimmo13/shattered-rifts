# Shattered Rifts: The Roster (9 Riftwalkers)

> Decision log: `DECISIONS.md` #95-#97. Status of the build is at the bottom.

The goal (Robert, 2026-10-23): reach 8-10 characters, each with **real choices at the reward screen**, covering the same
mechanics Slay the Spire's classes do. Silent works because her pool has three lanes (poison, shivs, discard) and a good
deck takes one and a half of them. Our pools were ~16 cards and one lane each. That is the main thing this document fixes.

## 1. Rules for every pool

1. **A pool belongs to a character**, not a realm (`CardDef.hero`). A realm is flavour and enemy stage; two characters can
   share one (Maren and Sehra are both Aurelion). Reward offers come from *your* pool + Neutral (+ the 1-in-10 Rift-crossed
   card from another character's pool).
2. **About 40 cards per character:** 3 lanes of ~8-10 cards each, ~6 **glue** cards that help two lanes, and a few
   build-around rares. Each lane works alone; two lanes can combine; all three at once is a bad deck.
3. **Shared toolkit, owned signatures.** Everyone has some of the common StS tools in their own flavour: draw, Barrier,
   Heal, Consume, Retain, Might, 0-cost cards, AoE, Mana gain, Exposed/Faltering, self-damage. A mechanic with its own
   *rules* belongs to exactly one character:

| Signature mechanic | Owner | Everyone else gets |
|---|---|---|
| **Sleeve Knives** + discard payoffs | Quill | one or two 0-cost attacks, never the engine |
| **Seared** stacking (our poison): double, spread, cash out | Quill | a Seared hit now and then (Neutral, enemies) |
| **Runes** (channel / evoke / Resonance) | Ilvane | nothing |
| **Stances** and Fervor | Sehra | nothing |
| **Lumen** and the Starforged Blade (sharpen) | Astra | nothing |
| **Drones** and Assemble | Rivet | |
| **Pack** buffs | Kesh | |
| **Thorns** and Barrier-scaling | Maren | Barrier is shared; Thorns is Maren's |
| **Snares** (face-down, auto-springing) | Vesper gets the most (14, with payoffs for setting them) | **Shared toolkit** like Might or Consume: every deck has a trap or two in its own flavour (Maren 4, Rivet 2, Quill 2 incl. a Seared needle, Kesh, Ilvane, Sehra, Astra 1 each) and Neutral has 2. Enforced by `cards.test.ts` |
| **Foresee** | Vesper, Sehra, Astra | a Neutral common |
| **Consume payoffs** | Kesh (Feast lane) | Neutral Consume-on-play is common |

4. **Starters are lane-neutral.** The first rewards decide the build.
5. **Powers are triggers.** A Power card registers a trigger (`power` op: when X happens, run these ops). No bespoke
   status per Power; new Powers are data.

## 2. The roster

| # | Riftwalker | Realm | HP | Lane A | Lane B | Lane C |
|---|---|---|---|---|---|---|
| 1 | **Ser Maren Ashcourt** | Aurelion | 80 | **Bulwark:** Barrier scaling, hits for your Barrier | **Thorns:** retaliation, punishing attackers | **Sanctified:** heal, Shielded, Radiant powers |
| 2 | **Rivet** | Nexus-9 | 72 | **Swarm:** many cheap Drones | **Assemble:** make allies act again, burst turns | **Core:** a few big constructs, Might, upgrades |
| 3 | **Kesh the Unfed** | Wyldmaw | 76 | **Bloodrage:** Might and self-damage | **Pack:** buffed companions | **Feast:** Consume, Devour, lifesteal |
| 4 | **Vesper Nightlace** | Umbral | 68 | **Snares:** many, varied triggers | **Exposed:** debuff burst, Faltering control | **Bluff:** Retain, Foresee, held Mana |
| 5 | **Quill, the Knife-Dancer** | Umbral | 66 | **Sleeve Knives:** 0-cost, many hits | **Seared:** stack, double, cash out | **Sleight:** discard / cycle payoffs |
| 6 | **Ilvane, the Glyphwright** | Nexus-9 | 70 | **Spark:** damage runes | **Ward:** Barrier runes | **Hollow:** charging runes, Resonance |
| 7 | **Sehra, the Still Flame** | Aurelion | 72 | **Fury:** burst | **Serene:** Mana and cards | **Fervor:** Retain/Foresee to a payoff |
| 8 | **Astra, the Starcaller** | Starfall | 80 | **Blade:** sharpen one weapon | **Lumen:** spend for finishers | **Constellations:** Auras that tick |
| 9 | **Mire, the Gravewarden** | Gloomfen | 76 | **Doom:** stack, double, cash in | **Thralls:** the dead fight for you | **Ashes:** consumed cards fuel you |
| 10 | **KP, the Homeless Drunk** | The Midden | 88 | **Junk Traps:** a few booby-trap Snares | **Glass:** Barrier + Thorns, then break it | **Shells:** 12 gauge buckshot that hits every enemy; swigs and liquid courage |

**KP's look (art brief):** short, fat, bald dwarf; ragged coat, ruddy drunk's nose; a hammer in one hand, a sawed-off 12 gauge across his back, a shopping trolley loaded with window panes and glass. Sigil/colour: bottle green and rust. He is a Drunkard (role): the Trapper role stays Vesper's, KP only has a few Snares. His signature is the Buckshot Shell (tag `shell`, 0-cost, hits every enemy, consumed), tested like Quill's knives.

Mire was the stretch character and is now built (Doom is hers alone). Still open: **Cinder** (a Consume engine) for a tenth.

Sigils (a passive on turn 1, so each run has an identity). The original four use starting companions or their starter cards
(Rivet starts with a Drone, Kesh with a Hound; Maren's and Vesper's Sigils from `03_CAMPAIGN.md` are not built yet). The new four have real Sigils: **Quill** *Sleeve Knives* (start each
fight with a Sleeve Knife in hand); **Ilvane** *Primed* (start each fight with one Spark rune); **Sehra** *Centred* (start each fight in
Serene); **Astra** *Starlit* (start each fight with 2 Lumen).

Role tags (what kind of fighter, shown on every character screen): Maren **Knight**, Rivet **Engineer**, Kesh **Hunter**, Vesper **Trapper**, Quill **Assassin**, Ilvane **Runecaster**, Sehra **Barbarian**, Astra **Spellblade**, Mire **Necromancer**. One word, unique per character (`Riftwalker.role`, tested).

## 3. Engine pieces (all generic ops; never a card id in engine code)

| Piece | What | Used by |
|---|---|---|
| **Choices** (`pending`, action `pick`) | An op can ask the player to choose cards (discard / exhaust N from hand, scry) and the rest of the card resumes after. | Quill, Vesper, Sehra, Astra, Kesh |
| `discard`, `exhaustCards`, `scry` ops; `onDiscard` / `onExhaust` on a card | Cycling and payoffs (Sly-style) | Quill, Kesh |
| `scale` on any amount | "Deal 1 per Barrier / per card exhausted / per Seared on the target ..." One field, a list of metrics | everyone |
| `scaleStatus` op | Double Seared, triple it, etc. | Quill |
| `power` op | Register a trigger: turn start / turn end / on play / on exhaust / on discard | all Power cards |
| **Runes**: `channel`, `evoke`, `runeSlots`; `RuneDef` in the DB | Passive at your turn end, evoke when pushed out or on demand | Ilvane |
| **Stances**: `stance` op; statuses `calm`, `wrath`, `radiant`; `mantra` | Exclusive statuses with enter/exit effects and damage multipliers | Sehra |
| **Lumen** (`stars` op, `starCost` on a card) | Second resource that persists between turns | Astra |
| `sharpen` op; per-card `bonus` | Grow every copy of a scaling card | Astra |
| More Snare triggers: `foeDefends`, `foeTurn` | Vesper's lane needs variety | Vesper |

## 4. Build status (2026-10-23)

- [x] Engine: choices, discard/exhaust/scry, scale, Powers as triggers, runes, stances, Lumen, sharpen, sacrifice, extra Snare triggers (DECISIONS #97)
- [x] Existing 4 reorganised into character pools and deepened to 3 lanes (34-38 cards each)
- [x] Quill, Ilvane, Sehra, Astra: 34-39 cards each
- [x] UI: pick modal, side panel (Lumen, runes, Powers), exact damage preview, character picker for 8 with lanes
- [x] First-pass sim; per-card scenario tests; generated `10_CARD_LIST.md`
- [ ] Balance pass (waits for the content set to settle, DECISIONS #91)
- [ ] Stretch characters: Cinder (Consume engine), Mire (Doom / undying minion)
- [ ] Real art for the four new Riftwalkers (placeholders reuse existing silhouettes)
- [ ] Enemy counterparts that use the new mechanics (runes, stances...) and a Starfall stage realm

## 5. Naming (DECISIONS #99)

Card and keyword names are original to Shattered Rifts. Mechanics are free to share with other deckbuilders; names, keyword
vocabulary and trade dress are not. When adding a card, give it a name nobody else's game uses, and check `10_CARD_LIST.md`.
Player-facing words: Barrier, Exposed, Faltering, Might, Seared, Thorns, Shielded, Snare, Aura (a card whose effect lasts the
fight), Consume (the card leaves the fight), Hold (stays in hand), Fleeting, Foresee, Fury / Serene / Radiant (stances), Fervor
(builds to Radiant), Lumen (the second resource), Sharpen (grow the Starforged Blade), Sleeve Knife (the 0-cost knife).
Internal ids in code (`exhaust`, `scry`, `forge`, `stars`, `wrath`, `calm`, `mantra`) are not renamed: only what the player reads.

## 6. Mechanic coverage (2026-10-23)

The goal: every card *mechanic* a Slay the Spire player expects exists, with our own names (DECISIONS #99). Where it lives:

| Mechanic | Ours | Where |
|---|---|---|
| Block / Strength / Vulnerable / Weak / Thorns / Buffer / Poison | Barrier / Might / Exposed / Faltering / Thorns / Shielded / Seared | everyone (Seared: Quill) |
| Dexterity / Frail | **Bracing** / **Brittle** (Brittle also shrinks an enemy's Barrier moves) | Maren, Sehra / Maren, Vesper |
| Intangible / Artifact / Plated Armor / Ritual | **Ghostly** / **Steadfast** / **Armored** / **Ritual** | Vesper / Vesper / Maren / Kesh |
| Barricade / Corruption / Metallicize | **Fortified** / **Unbound** / end-of-turn Barrier Aura | Maren / Kesh / Maren |
| Double Tap / Burst | **Twinned** / **Mirrored** | Neutral (Echoing Blow) / Quill (Encore) |
| Vigor, Flex | **Vigor**, temporary statuses (`temp`) | Kesh, Neutral (Heave) |
| Exhaust / Ethereal / Retain / Innate | Consume / Fleeting / Hold / Opening hand | shared |
| Sly (discard triggers) | `onDiscard` | Quill |
| Scry | **Foresee**, and cards it discards are real discards (payoffs fire) | shared; payoffs: Marked Cards (Vesper), Reading the Signs (Sehra), Star Chart (Astra), Quill's discard cards |
| X-cost, Unplayable, 0-cost chains | `x`, `unplayable`, cost 0 | shared |
| Draw / Mana now / Mana and cards next turn | draw, mana, **manaNext**, **drawNext** | shared |
| Discovery / Madness / Armaments / Anger | **discover**, **cheapen**, **upgrade** (hand), **copySelf** | Neutral, Quill, Ilvane |
| Orbs and Focus | Runes and Resonance | Ilvane |
| Stances, Mantra | Fury / Serene / Radiant, Fervor | Sehra |
| Stars, Forge, the Sovereign Blade | Lumen, Sharpen, the Starforged Blade | Astra |
| Osty, Doom, Souls | Bone Thrall (a companion), **Doom**, Gravesouls | Mire |
| Minions, Sacrifice | allies, `sacrifice` | Rivet, Kesh, Mire |
| Traps (ours) | Snares | Vesper masters them; everyone has a few |

**Deliberately not built:** card Enchantments (permanent per-card modifiers chosen out of combat), dynamic "costs less per X" cards
(we use `cheapen` instead), and choose-one-of-three Discovery (ours adds one random card; a choice of three would need a new
pending kind). Say the word if you want them.
