# Shattered Rifts: The Roster (8 Riftwalkers)

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
| 8 | **Astra, the Starcaller** | Starfall | 74 | **Starforged Blade:** one growing weapon | **Lumen:** spend for finishers | **Constellations:** Powers that tick |

Stretch (to reach 10): **Cinder** (Consume engine) and **Mire** (Doom / an undying minion).

Sigils (a passive on turn 1, so each run has an identity). The original four use starting companions or their starter cards
(Rivet starts with a Drone, Kesh with a Hound; Maren's and Vesper's Sigils from `03_CAMPAIGN.md` are not built yet). The new four have real Sigils: **Quill** *Sleeve Knives* (start each
fight with a Sleeve Knife in hand); **Ilvane** *Primed* (start each fight with one Spark rune); **Sehra** *Centred* (start each fight in
Serene); **Astra** *Starlit* (start each fight with 2 Lumen).

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
