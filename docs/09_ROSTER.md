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
   Heal, Exhaust, Retain, Might, 0-cost cards, AoE, Mana gain, Exposed/Faltering, self-damage. A mechanic with its own
   *rules* belongs to exactly one character:

| Signature mechanic | Owner | Everyone else gets |
|---|---|---|
| **Shivs** + discard payoffs | Quill | one or two 0-cost attacks, never the engine |
| **Seared** stacking (our poison): double, spread, cash out | Quill | a Seared hit now and then (Neutral, enemies) |
| **Runes** (channel / evoke / Resonance) | Ilvane | nothing |
| **Stances** and Mantra | Sehra | nothing |
| **Stars** and the Sovereign Blade (forge) | Astra | nothing |
| **Drones** and Assemble | Rivet | |
| **Pack** buffs | Kesh | |
| **Thorns** and Barrier-scaling | Maren | Barrier is shared; Thorns is Maren's |
| **Snares** (face-down, auto-springing) | Vesper | Maren has retaliation Snares; Rivet has two |
| **Scry** | Vesper, Sehra, Astra | a Neutral common |
| **Exhaust payoffs** | Kesh (Feast lane) | Neutral Exhaust-on-play is common |

4. **Starters are lane-neutral.** The first rewards decide the build.
5. **Powers are triggers.** A Power card registers a trigger (`power` op: when X happens, run these ops). No bespoke
   status per Power; new Powers are data.

## 2. The roster

| # | Riftwalker | Realm | HP | Lane A | Lane B | Lane C |
|---|---|---|---|---|---|---|
| 1 | **Ser Maren Ashcourt** | Aurelion | 80 | **Bulwark:** Barrier scaling, hits for your Barrier | **Thorns:** retaliation, punishing attackers | **Sanctified:** heal, Shielded, Radiant powers |
| 2 | **Rivet** | Nexus-9 | 72 | **Swarm:** many cheap Drones | **Assemble:** make allies act again, burst turns | **Core:** a few big constructs, Might, upgrades |
| 3 | **Kesh the Unfed** | Wyldmaw | 76 | **Bloodrage:** Might and self-damage | **Pack:** buffed companions | **Feast:** Exhaust, Devour, lifesteal |
| 4 | **Vesper Nightlace** | Umbral | 68 | **Snares:** many, varied triggers | **Exposed:** debuff burst, Faltering control | **Bluff:** Retain, Scry, held Mana |
| 5 | **Quill, the Knife-Dancer** | Umbral | 66 | **Shivs:** 0-cost, many hits | **Seared:** stack, double, cash out | **Sleight:** discard / cycle payoffs |
| 6 | **Ilvane, the Glyphwright** | Nexus-9 | 70 | **Spark:** damage runes | **Ward:** Barrier runes | **Hollow:** charging runes, Resonance |
| 7 | **Sehra, the Still Flame** | Aurelion | 72 | **Wrath:** burst | **Calm:** Mana and cards | **Mantra:** Retain/Scry to a payoff |
| 8 | **Astra, the Starcaller** | Starfall | 74 | **Sovereign Blade:** one growing weapon | **Stars:** spend for finishers | **Constellations:** Powers that tick |

Stretch (to reach 10): **Cinder** (Exhaust engine) and **Mire** (Doom / an undying minion).

Sigils (a passive on turn 1, so each run has an identity): Maren *Oathbound* (first unit gains Shielded); Rivet *Spare Parts*
(a Drone); Kesh *Pack Hunger* (a Hound); Vesper *Sleight* (starts with a random Snare set); **Quill** *Sleeve Knives* (start each
fight with a Shiv in hand); **Ilvane** *Primed* (start each fight with one Spark rune); **Sehra** *Centred* (start each fight in
Calm); **Astra** *Starlit* (start each fight with 2 Stars).

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
| **Stars** (`stars` op, `starCost` on a card) | Second resource that persists between turns | Astra |
| `forge` op; per-card `bonus` | Grow every copy of a scaling card | Astra |
| More Snare triggers: `foeDefends`, `foeTurn` | Vesper's lane needs variety | Vesper |

## 4. Build status

- [ ] Engine tier 1: choices, discard/exhaust/scry, scale, power triggers, extra Snare triggers
- [ ] Reorganise existing 4 into character pools; deepen each to ~40 cards in 3 lanes
- [ ] Quill (needs tier 1)
- [ ] Ilvane (runes)
- [ ] Sehra (stances)
- [ ] Astra (stars + forge)
- [ ] UI: pick modal, rune row, stars, power list, character picker for 8
- [ ] Sim + balance pass (`pnpm sim`), docs, changelog
