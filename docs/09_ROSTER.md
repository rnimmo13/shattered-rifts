# Shattered Rifts: The Roster (9 Riftwalkers)

> Decision log: `DECISIONS.md` #95-#97 (ids: #190). Status of the build is at the bottom.

**Internal ids are the class** (DECISIONS #190), so a name or a gender can change without touching code: knight (Valeria), engineer (Rivet), hunter (Kesh), trickster (Vesper; was trapper, #372), assassin (Sylas), shaman (Ilvane; was totemist, #371), monk (Solen, a man; was Sehra and barbarian, #391, #395), spellblade (Obsidia), necromancer (Mire), drunkard (KP). Players only ever see the names in brackets. Older ids (maren, rivet, kesh, vesper, quill, ilvane, sehra, astra, mire, kp) are still read from saves, Vault decks and server rows through `canonicalHero` (`@sr/content/v2`).

The goal (Robert, 2026-10-23): reach 8-10 characters, each with **real choices at the reward screen**, covering the same
mechanics Slay the Spire's classes do. Silent works because her pool has three build paths (poison, shivs, discard) and a good
deck takes one and a half of them. Our pools were ~16 cards and one build path each. That is the main thing this document fixes.

## 1. Rules for every pool

1. **A pool belongs to a character**, not a realm (`CardDef.hero`). A realm is flavour and enemy stage; two characters can
   share one (Maren and Solen are both Aurelion). Reward offers come from *your* pool + Neutral (+ the 1-in-10 Rift-crossed
   card from another character's pool).
2. **Every Riftwalker has about 20 commons, 30 uncommons and 25-28 rares (the Legendaries are Rares for now, DECISIONS #363).** Each build path holds 6 commons, 9
   uncommons and 7-8 rares; a few **glue** cards have no build path (DECISIONS #341). **There is no rule that a character has three build paths** (DECISIONS #362): most have three, Valeria four (her cards are the Ironclad's list, #367). Rares define a build. Each build path works alone; two build paths can
   combine; all of them at once is a bad deck. `pnpm poolaudit` (docs/POOL_AUDIT.md) lists each pool by build path and flags near-duplicates.
3. **Shared toolkit, owned signatures.** Everyone has some of the common StS tools in their own flavour: draw, Barrier,
   Heal, Consume, Retain, Might, 0-cost cards, AoE, Mana gain, Exposed/Faltering, self-damage. A mechanic with its own
   *rules* belongs to exactly one character:

| Signature mechanic | Owner | Everyone else gets |
|---|---|---|
| **Daggers** + discard payoffs | Quill | one or two 0-cost attacks, never the engine |
| **Bleed** stacking (our poison): double, spread, cash out | Quill | a Bleed hit now and then (Neutral, enemies) |
| **Totems** (was Runes: plant / awaken / Spirit) | Ilvane (id `totemist`) | nothing |
| **Stances** and Fervor | Solen | nothing |
| **Arcana** (was Lumen) and the Obsidian Blade (sharpen) | Obsidia (id `spellblade`) | nothing |
| **Drones** and Assemble | Rivet | |
| **Pack** buffs | Kesh | |
| **Thorns** and Barrier-scaling | nobody since DECISIONS #367 (Valeria's Thorns went when she became the Ironclad's list) | Barrier is shared |
| ~~**Devotion**~~ | gone (DECISIONS #364) | Valeria's heal-and-spend mechanic was removed when she became the Ironclad shape |
| **Traps** (face-down, auto-springing) | Vesper gets the most (14, with payoffs for setting them) | **Shared toolkit** like Might or Consume: every deck but Valeria's (the Ironclad's list has none, #367) has a trap or two in its own flavour (the Hunter has 6 since DECISIONS #377: snares that slow the prey for the pack; the Engineer 5, Quill 2 incl. a Bleed needle, Ilvane, Solen, Obsidia 1 each) and Neutral has 2. Enforced by `cards.test.ts` |
| **Foresee** | Vesper, Solen, Obsidia | a Neutral common |
| **Consume payoffs** | Kesh (Feast build path) | Neutral Consume-on-play is common |

4. **Starters belong to no build path.** The first rewards decide the build.
5. **Powers are triggers.** A Power card registers a trigger (`power` op: when X happens, run these ops). No bespoke
   status per Power; new Powers are data.

### What makes a build path (DECISIONS #255)

A build path passes when it has **its own verb** (something you do on your turn that the other two don't), **its own payoff
cards**, and **a name that says how you play**, not what you collect. Three flavours of one resource (Ilvane's old Hawk, Bear and
Elder totems) are one build path, not three. The build paths are the tags players see on the character picker.

**A trait helps every build path** (Sylas's used to be Bleed, which only his Bleed build path cared about). **No card copies
another game:** no Slay the Spire 1 or 2 card name, and no card that is a famous card's effect with its numbers. The ids of the
reworked cards stayed the same, so their art and every saved deck still work.

## 2. The roster

| # | Riftwalker | Realm | HP | Build path 1 | Build path 2 | Build path 3 |
|---|---|---|---|---|---|---|
| 1 | **Valeria** (id `knight`) | Aurelion | 80 | **Guard:** stop attacks completely and gain from every Opening (rebuilt 2026-10-29, DECISIONS #415; the Ironclad copy is archived) | **Riposte:** heavy counters that spend an enemy's Opening | **Thorns:** hurt whatever hits you (docs/reworks/KNIGHT.md) |
| 2 | **Rivet** | Nexus-9 | 72 | **Swarm:** go wide: many cheap Light drones (1 slot each), payoffs per ally, per summon and per death, sacrifice, Might for everyone | **Assemble:** charge companions (and the Engineer's own guns) up with Primed, then fire: only Assemble, Relay Strike, Command Chip and Full Salvo make them act now (#383) | **Core:** go tall: one Heavy (2 slots) or Colossal (all 3) machine you grow (max HP, Might, Barrier on one ally), revive, and cash in (Heavy Hitter, Crankshaft, Reactor Meltdown); Salvage passes scrapped drones into it (#383) |
| 3 | **Kesh the Unfed** | Wyldmaw | 76 | **Bloodrage:** Might and self-damage | **Pack:** buffed companions | **Predator:** Mana and draw for burst turns |
| 4 | **Vesper Nightlace** | Umbral | 80 | **Traps:** many, varied triggers | **Exposed:** debuff burst, Faltering control | **Suits:** every card is ♠ ♥ ♦ or ♣; show all four in a turn for a Full Trick (DECISIONS #387; was Patience) |
| 5 | **Sylas** (id `assassin`) | Umbral | 70 | **Execution:** build Preparation, spend it on a finisher (rebuilt 2026-10-29, DECISIONS #416; the Silent copy is archived) | **Knives:** embed knives in enemies, pull them for payoffs | **Shadow:** defence and cycling on the move (docs/reworks/ASSASSIN.md) |
| 6 | **Ilvane** (id `totemist`) | Nexus-9 | 76 | **Totems:** plant, Spirit and slots, awaken | **Elements:** spells of storm, ice, fire and earth that grow with Spirit | **Rites:** Auras that pay when another Aura is played |
| 7 | **Solen, the Still Flame** | Aurelion | 82 | **Fury:** get in, hit hard, live through it | **Flow:** change stance again and again; every change pays | **Radiant:** build Fervor to 10 for a triple-damage turn |
| 8 | **Obsidia, Spellblade of the Hollow Crown** (id `spellblade`) | The Hollow Crown (id `starfall`) | 80 | **Blade:** sharpen one weapon | **Arcana:** spend for finishers | **Sigils:** Auras that tick |
| 9 | **Mire, the Gravewarden** | Gloomfen | 76 | **Doom:** stack, double, cash in | **Thralls:** the dead fight for you | **Ashes:** consumed cards fuel you |
| 10 | **KP, the Homeless Drunk** | The Midden | 88 | **Gun:** sharpen the Old Twelve Gauge | **Shells:** buckshot and booby traps that hit every enemy | **Hangover:** (with Stagger, attacks that hit a random enemy harder, #393) drink now, pay tomorrow: drinks give Mana, cards or Might plus Hangover (HP lost at the start of his next turn, never the last), payoffs that grow with Hangover, and heals that grow with missing HP (DECISIONS #354) |

**KP's look (art brief):** short, fat, bald dwarf; ragged coat, ruddy drunk's nose; a hammer in one hand, a sawed-off 12 gauge across his back, a shopping trolley loaded with window panes and glass. Sigil/colour: bottle green and rust. He is a Drunkard (role): the Trapper role stays Vesper's, KP only has a few Traps. His signature is the Buckshot Shell (tag `shell`, 0-cost, hits every enemy, consumed), tested like Quill's knives.

Mire was the stretch character and is now built (Doom is hers alone). Still open: **Cinder** (a Consume engine) for a tenth.

Sigils (a passive on turn 1, so each run has an identity). The original four use starting companions or their starter cards
(Rivet starts with a Drone, Kesh with a Hound; Maren's and Vesper's Sigils from `03_CAMPAIGN.md` are not built yet). The new four have real Sigils: **Quill** *Daggers* (start each
fight with a Dagger in hand); **Ilvane** *Primed* (start each fight with one Hawk totem); **Solen** *Centred* (start each fight in
Serene); **Obsidia** *Kindled* (3 Arcana at turn start; starts with 3 Arcana and an Obsidian Blade).

Role tags (what kind of fighter, shown on every character screen): Maren **Knight**, Rivet **Engineer**, Kesh **Hunter**, Vesper **Trickster**, Quill **Assassin**, Ilvane **Shaman**, Solen **Monk** (was Barbarian, #391), Obsidia **Spellblade**, Mire **Necromancer**. One word, unique per character (`Riftwalker.role`, tested).

## 3. Engine pieces (all generic ops; never a card id in engine code)

| Piece | What | Used by |
|---|---|---|
| **Choices** (`pending`, action `pick`) | An op can ask the player to choose cards (discard / exhaust N from hand, scry) and the rest of the card resumes after. | Quill, Vesper, Solen, Obsidia, Kesh |
| `discard`, `exhaustCards`, `scry` ops; `onDiscard` / `onExhaust` on a card | Cycling and payoffs (Sly-style) | Quill, Kesh |
| `scale` on any amount | "Deal 1 per Barrier / per card exhausted / per Bleed on the target ..." One field, a list of metrics | everyone |
| `scaleStatus` op | Double Bleed, triple it, etc. | Quill |
| `power` op | Register a trigger: turn start / turn end / on play / on exhaust / on discard | all Power cards |
| **Totems** (runes in the engine): `channel`, `evoke`, `runeSlots`; `RuneDef` in the DB | Passive at your turn end, evoke when pushed out or on demand | Ilvane |
| **Stances**: `stance` op; statuses `calm`, `wrath`, `radiant`; `mantra` | Exclusive statuses with enter/exit effects and damage multipliers | Solen |
| **Arcana** (`stars` op, `starCost` on a card) | Second resource that persists between turns | Obsidia |
| `sharpen` op; per-card `bonus` | Grow every copy of a scaling card | Obsidia |
| More Trap triggers: `foeDefends`, `foeTurn` | Vesper's build path needs variety | Vesper |
| **Preparation and knives** (statuses `prep`, `knives`, both at most 3; ops `embed`, `extract` (`pull`), `spend` (`spendPrep`); triggers `embed`, `extract`, `spend`; metrics `knives`, `knivesAll`, `prep`, `extracted`, `prepSpent`) | Setup that finishers spend, and knives that sit in an enemy until pulled for a payoff (DECISIONS #416) | Sylas |
| **Guard** (`HeroTrait.openings`; status `opening`; `counter` damage with `riposte`, the `riposte` op; triggers `opening`, `riposte`, `thorns`; metrics `opening`, `foesOpen`, `foesAttacking`) | A hit her Barrier stops completely leaves the attacker Open; a Riposte spends it for a bonus (DECISIONS #415) | Valeria |

## 4. Build status (2026-10-23)

- [x] Engine: choices, discard/exhaust/scry, scale, Powers as triggers, runes, stances, Arcana, sharpen, sacrifice, extra Trap triggers (DECISIONS #97)
- [x] Existing 4 reorganised into character pools and deepened to 3 build paths (34-38 cards each)
- [x] Quill, Ilvane, Solen, Obsidia: 34-39 cards each
- [x] UI: pick modal, side panel (Arcana, totems, Powers), exact damage preview, character picker for 8 with build paths
- [x] First-pass sim; per-card scenario tests; generated `10_CARD_LIST.md`
- [ ] Balance pass (waits for the content set to settle, DECISIONS #91)
- [ ] Stretch characters: Cinder (Consume engine), Mire (Doom / undying minion)
- [ ] Real art for the four new Riftwalkers (placeholders reuse existing silhouettes)
- [ ] Enemy counterparts that use the new mechanics (runes, stances...) and a Starfall stage realm

## 5. Naming (DECISIONS #99)

Card and keyword names are original to Shattered Rifts. Mechanics are free to share with other deckbuilders; names, keyword
vocabulary and trade dress are not. When adding a card, give it a name nobody else's game uses, and check `10_CARD_LIST.md`.
Player-facing words: Barrier, Exposed, Faltering, Might, Bleed, Thorns, Shielded, Trap, Aura (a card whose effect lasts the
fight), Consume (the card leaves the fight), Hold (stays in hand), Fleeting, Foresee, Fury / Serene / Radiant (stances), Fervor
(builds to Radiant), Arcana (the second resource), Sharpen (grow the Obsidian Blade), Dagger (the 0-cost knife).
Internal ids in code (`exhaust`, `scry`, `forge`, `stars`, `wrath`, `calm`, `mantra`) are not renamed: only what the player reads.

## 6. Mechanic coverage (2026-10-23)

The goal: every card *mechanic* a Slay the Spire player expects exists, with our own names (DECISIONS #99). Where it lives:

| Mechanic | Ours | Where |
|---|---|---|
| Block / Strength / Vulnerable / Weak / Thorns / Buffer / Poison | Barrier / Might / Exposed / Faltering / Thorns / Shielded / Bleed | everyone (Bleed: Quill) |
| Dexterity / Frail | **Bracing** / **Brittle** (Brittle also shrinks an enemy's Barrier moves) | Maren, Solen / Maren, Vesper |
| Intangible / Artifact / Plated Armor / Ritual | **Ghostly** / **Steadfast** / **Armored** / **Ritual** | Vesper / Vesper / Maren / Kesh |
| Barricade / Corruption / Metallicize | **Fortified** / **Unbound** / end-of-turn Barrier Aura | Maren / Kesh / Maren |
| Double Tap / Burst | **Reverb** / **Mirrored** | Neutral (Echoing Blow) / Quill (Encore) |
| Vigor, Flex | **Vigor**, temporary statuses (`temp`) | Kesh, Neutral (Heave) |
| Exhaust / Ethereal / Retain / Innate | Consume / Fleeting / Hold / Opening hand | shared |
| Sly (discard triggers) | `onDiscard` | Quill |
| Scry | **Foresee N**: look at the top N cards, draw one of them, discard the rest; the cards it discards are real discards (payoffs fire) | shared; payoffs: Marked Cards (Vesper), Reading the Signs (Solen), Spellbook (Obsidia), Quill's discard cards |
| X-cost, Unplayable, 0-cost chains | `x`, `unplayable`, cost 0 | shared |
| Draw / Mana now / Mana and cards next turn | draw, mana, **manaNext**, **drawNext** | shared |
| Discovery / Madness / Armaments / Anger | **discover**, **cheapen**, **upgrade** (hand), **copySelf** | Neutral, Quill, Ilvane |
| Orbs and Focus | Totems and Spirit | Ilvane |
| Stances, Mantra | Fury / Serene / Radiant, Fervor | Solen |
| Stars, Forge, the Sovereign Blade | Arcana, Sharpen, the Obsidian Blade | Obsidia |
| Osty, Doom, Souls | Bone Thrall (a companion), **Doom**, Gravesouls | Mire |
| Minions, Sacrifice | allies, `sacrifice` | Rivet, Kesh, Mire |
| Traps (ours) | Traps | Vesper masters them; everyone has a few |

**Deliberately not built:** card Enchantments (permanent per-card modifiers chosen out of combat), dynamic "costs less per X" cards
(we use `cheapen` instead), and choose-one-of-three Discovery (ours adds one random card; a choice of three would need a new
pending kind). Say the word if you want them.

## Innate traits

Every Riftwalker has one passive (`Riftwalker.trait`), and it helps all of their build paths (DECISIONS #255): Valeria (id knight) Hold and Answer (6 Barrier at the start; Guard: an enemy attack hit her Barrier stops completely leaves it Open until the end of her next turn; 3 Barrier the first time each turn she earns an Opening; DECISIONS #415, was Oathkeeper: 6 Barrier and 6 Plating), Rivet Tinkerer (heal 1 each turn, and each companion gains 1 max HP; DECISIONS #356; her starting Drone has 6 HP, #411), Kesh Pack Instinct (her companions share half her Might, rounded down; DECISIONS #285, #329, #333), Vesper Lying in Wait (6 Barrier and 1 extra card at the start, #412; its 4 Barrier a turn went in #398, and its Full Trick deals 3 more for each one before it in a fight; was Ambusher, Exposed for 3 turns), with Suits: the first time in a turn all four suits are showing, a Full Trick (3 damage to a random enemy, +2 for each earlier one in the fight, draw 1; `HeroTrait.suits`, DECISIONS #387, #398, #404, #411, #412), Sylas (id assassin) Knife Work (1 Preparation and a knife in every enemy at the start; 1 Preparation the first time each turn he embeds a knife; 3 damage for every knife he pulls; DECISIONS #416, was Hidden Blades: a Dagger every turn), Ilvane Totem-bound (starts with a Hawk, a Bear and a Splinter totem), Solen Inner Fire (1 Fervor whenever he enters a stance, 2 Mana the first time each turn he leaves Serene (an engine rule until #413), and 2 Primed whenever he leaves Fury, #412; its 2 Barrier went in DECISIONS #390; was 2 Fervor at the start), Obsidia Kindled (1 Arcana and Sharpen 1 each turn; she starts with 3 Arcana), Dorian (id necromancer) Grave Chill (Raise 2 at the start of every turn, DECISIONS #397, #401; Fate on a random enemy whenever an ally dies (2, #413) or a card is consumed (3; #403; 5 a death for a while, #398); no Fate at the start; his starting Thrall has 2 HP, #411), KP Clutch Genes (1% more attack damage for every HP missing, #411; was +50% at or below half HP). A trait can have triggers (`HeroTrait.triggers`) that fire like an Aura's but never count or show as one. Hero HP is 70-88, Slay the Spire's range.
