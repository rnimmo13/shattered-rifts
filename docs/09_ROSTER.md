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
| **Preparation** and embedded knives (Daggers and the discard engine until #416) | Quill (id `assassin`) | nothing |
| **Bleed** (our poison) | shared since #416 (the Assassin's Bleed package went with his rework; Barbed Stab keeps a Bleed hit) | a Bleed hit now and then (Neutral, enemies, the Hunter) |
| **Elements, totems and Trinity** (Flame, Frost, Storm spells; Hawk, Bear and Thunderbird totems that help them; commands; Spirit with no cap; DECISIONS #420) | Ilvane (id `shaman`) | his elemental spells may be Rift-crossed; his totems, commands, Trinity and Spirit never |
| **Martial Forms** and Mastery (Root, Current, Ember; techniques; was stances and Fervor until #419) | Solen | nothing |
| **Enchantments** on the Obsidian Blade (Imbue / Discharge; was Arcana and Sharpen until #417) | Obsidia (id `spellblade`) | nothing |
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
| 6 | **Ilvane** (id `shaman`) | Nexus-9 | 75 | **Flame:** single-target damage and Bleed, Thorns to guard (rebuilt 2026-10-29, DECISIONS #420; the Defect copy is archived) | **Frost:** Barrier and Faltering | **Storm:** every enemy, Sapped to guard; Trinity and his totems serve all three (docs/reworks/SHAMAN.md) |
| 7 | **Solen, the Still Flame** | Aurelion | 82 | **Root:** discipline, Defensive techniques and defensive Mastery (rebuilt 2026-10-29, DECISIONS #419; the stances are archived) | **Current:** flow, a Defensive then a Striking technique, hand planning | **Ember:** pressure, varied strikes at one enemy and a Mastery finisher (docs/reworks/MONK.md) |
| 8 | **Obsidia, Spellblade of the Hollow Crown** (id `spellblade`) | The Hollow Crown (id `starfall`) | 75 | **Edge:** Imbue cheaply, Discharge one charge at a time (rebuilt 2026-10-29, DECISIONS #417; the Regent copy is archived) | **Burst:** fill both positions with different charges, then Discharge both | **Ward:** Barrier, Wards, and payoffs for what the blade holds (docs/reworks/SPELLBLADE.md) |
| 9 | **Mire, the Gravewarden** | Gloomfen | 76 | **Doom:** stack, double, cash in | **Thralls:** the dead fight for you | **Ashes:** consumed cards fuel you |
| 10 | **KP, the Homeless Drunk** | The Midden | 88 | **Gun:** sharpen the Old Twelve Gauge | **Shells:** buckshot and booby traps that hit every enemy | **Hangover:** (with Stagger, attacks that hit a random enemy harder, #393) drink now, pay tomorrow: drinks give Mana, cards or Might plus Hangover (HP lost at the start of his next turn, never the last), payoffs that grow with Hangover, and heals that grow with missing HP (DECISIONS #354) |

**KP's look (art brief):** short, fat, bald dwarf; ragged coat, ruddy drunk's nose; a hammer in one hand, a sawed-off 12 gauge across his back, a shopping trolley loaded with window panes and glass. Sigil/colour: bottle green and rust. He is a Drunkard (role): the Trapper role stays Vesper's, KP only has a few Traps. His signature is the Buckshot Shell (tag `shell`, 0-cost, hits every enemy, consumed), tested like Quill's knives.

Mire was the stretch character and is now built (Doom is hers alone). Still open: **Cinder** (a Consume engine) for a tenth.

Sigils (a passive on turn 1, so each run has an identity). The original four use starting companions or their starter cards
(Rivet starts with a Drone, Kesh with a Hound; Maren's and Vesper's Sigils from `03_CAMPAIGN.md` are not built yet). The new four have real Sigils (traits now: §3 below): **Quill** *Knife Work* (1 Preparation and a knife in every enemy at the
start; #416); **Ilvane** *Spirit and Trinity* (three totems at the start, a command a turn, Trinity for Spirit; #420); **Solen** *Martial Forms* (start each fight in
Current; #419); **Obsidia** *Glass and Ember* (a Ward on her blade at the start; the first Imbue each turn draws 1 and gives 2 Barrier; #417).

Role tags (what kind of fighter, shown on every character screen): Maren **Knight**, Rivet **Engineer**, Kesh **Hunter**, Vesper **Trickster**, Quill **Assassin**, Ilvane **Shaman**, Solen **Monk** (was Barbarian, #391), Obsidia **Spellblade**, Mire **Necromancer**. One word, unique per character (`Riftwalker.role`, tested).

## 3. Engine pieces (all generic ops; never a card id in engine code)

| Piece | What | Used by |
|---|---|---|
| **Choices** (`pending`, action `pick`) | An op can ask the player to choose cards (discard / exhaust N from hand, scry) and the rest of the card resumes after. | Quill, Vesper, Solen, Obsidia, Kesh |
| `discard`, `exhaustCards`, `scry` ops; `onDiscard` / `onExhaust` on a card | Cycling and payoffs (Sly-style) | Quill, Kesh |
| `scale` on any amount | "Deal 1 per Barrier / per card exhausted / per Bleed on the target ..." One field, a list of metrics | everyone |
| `scaleStatus` op | Double Bleed, triple it, etc. | Quill |
| `power` op | Register a trigger: turn start / turn end / on play / on exhaust / on discard | all Power cards |
| **Totems** (runes in the engine): `channel`, `evoke`, `runeSlots`; `RuneDef` in the DB | Passive at your turn end, evoke when pushed out or on demand | nobody since #418 (kept in the engine) |
| **Commanded totems** (`HeroTrait.totems`, `SideState.totems`, `TotemDef` in `db.totems`; ops `plant`, `uproot`; action `command`; statuses `spirit` (at most 3), `rousing`, `shelter`; triggers `command`, `plant`, `replace`; metrics `totems`, `totemKinds`, `totemsOf`, `spirit`, `commanded`, `uprooted`, `replacedNow`, `spiritSpent`) | Three fixed positions; once a turn one totem is commanded and its spirit acts (DECISIONS #418) | Ilvane |
| **Stances**: `stance` op; statuses `calm`, `wrath`, `radiant`; `mantra` | Exclusive statuses with enter/exit effects and damage multipliers | nobody since #419 (kept in the engine) |
| **Martial Forms** (`HeroTrait.forms`, `SideState.form`; op `form`; tags `defensive`/`striking`; status `mastery` (at most 3); triggers `technique`, `formChange`; metrics `mastery`, `masterySpent`, `techniqueDone`, `techniquesTurn`, `defensiveTurn`, `inRoot`, `inCurrent`, `inEmber`) | A form names two techniques; completing them once a turn gives Mastery, which techniques spend (DECISIONS #419) | Solen |
| **Arcana** (`stars` op, `starCost` on a card) | Second resource that persists between turns | nobody since #417 (kept in the engine) |
| `sharpen` op; per-card `bonus` | Grow every copy of a scaling card | KP's Precision (Obsidia's until #417) |
| **Enchantments** (`SideState.enchants`, at most 2; ops `imbue`, `discharge`, `recast`; status `twinedge`; triggers `imbue`, `discharge`, `dischargeMixed`; metrics `enchants`, `enchantKinds`, `wards`, `discharged`) | Spells store Ember / Glass / Ward on the blade; blade attacks spend one or both (DECISIONS #417) | Obsidia |
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
fight), Consume (the card leaves the fight), Hold (stays in hand), Fleeting, Foresee, Root / Current / Ember (the Monk's forms), Defensive and Striking
techniques, Mastery (the Monk), totems, command, Spirit and Rousing (the Shaman), Imbue, Discharge, Ember, Glass and Ward (the
Spellblade), Preparation and knives (the Assassin), Guard, Opening, Riposte (the Knight), Precision (the Old Twelve Gauge). Retired
with the 2026-10-29 reworks (kept in the engine, archived): Fury / Serene / Radiant, Fervor, Arcana, the Obsidian Blade's Sharpen,
the Dagger.
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
| Orbs and Focus | (archived) commanded totems and capped Spirit, an original engine (#418) | Ilvane |
| Stances, Mantra | (archived) Martial Forms and Mastery, an original engine (#419) | Solen |
| Stars, Forge, the Sovereign Blade | (Arcana, Sharpen: archived) Imbue and Discharge on the Obsidian Blade, an original engine (#417) | Obsidia |
| Osty, Doom, Souls | Bone Thrall (a companion), **Doom**, Gravesouls | Mire |
| Minions, Sacrifice | allies, `sacrifice` | Rivet, Kesh, Mire |
| Traps (ours) | Traps | Vesper masters them; everyone has a few |

**Deliberately not built:** card Enchantments (permanent per-card modifiers chosen out of combat), dynamic "costs less per X" cards
(we use `cheapen` instead), and choose-one-of-three Discovery (ours adds one random card; a choice of three would need a new
pending kind). Say the word if you want them.

## Innate traits

Every Riftwalker has one passive (`Riftwalker.trait`), and it helps all of their build paths (DECISIONS #255): Valeria (id knight) Hold and Answer (6 Barrier at the start; Guard: an enemy attack hit her Barrier stops completely leaves it Open until the end of her next turn; 3 Barrier the first time each turn she earns an Opening; DECISIONS #415, was Oathkeeper: 6 Barrier and 6 Plating), Rivet Tinkerer (heal 1 each turn, and each companion gains 1 max HP; DECISIONS #356; her starting Drone has 6 HP, #411), Kesh Pack Instinct (her companions share half her Might, rounded down; DECISIONS #285, #329, #333), Vesper Lying in Wait (6 Barrier and 1 extra card at the start, #412; its 4 Barrier a turn went in #398, and its Full Trick deals 3 more for each one before it in a fight; was Ambusher, Exposed for 3 turns), with Suits: the first time in a turn all four suits are showing, a Full Trick (3 damage to a random enemy, +2 for each earlier one in the fight, draw 1; `HeroTrait.suits`, DECISIONS #387, #398, #404, #411, #412), Sylas (id assassin) Knife Work (1 Preparation and a knife in every enemy at the start; 1 Preparation the first time each turn he embeds a knife; 3 damage for every knife he pulls; DECISIONS #416, was Hidden Blades: a Dagger every turn), Ilvane Spirit and Trinity (a Hawk, a Bear and a Thunderbird from the start, each helping the first spell of its element each turn; a command a turn; Trinity, a spell of every element in a turn, gives 1 Spirit, which never goes down; DECISIONS #420, was Totem-bound: a Hawk, a Bear and a Splinter that pulsed every turn), Solen Martial Forms (start in Current; once a turn, completing his form's technique gives 1 Mastery and 3 Barrier; DECISIONS #419, was Inner Fire: Fervor, Serene's Mana and Fury's Primed), Obsidia Glass and Ember (a Ward on her blade at the start; the first time each turn she Imbues, draw 1 and gain 2 Barrier; DECISIONS #417, was Kindled: Arcana and Sharpen each turn), Dorian (id necromancer) Grave Chill (Raise 2 at the start of every turn, DECISIONS #397, #401; Fate on a random enemy whenever an ally dies (2, #413) or a card is consumed (3; #403; 5 a death for a while, #398); no Fate at the start; his starting Thrall has 2 HP, #411), KP Clutch Genes (1% more attack damage for every HP missing, #411; was +50% at or below half HP). A trait can have triggers (`HeroTrait.triggers`) that fire like an Aura's but never count or show as one. Hero HP is 70-88, Slay the Spire's range.
