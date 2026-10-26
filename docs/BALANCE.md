# Balance Notes

Data from `pnpm sim` (bot-vs-bot). **Read the caveats first.** The bots are decent, not human: the
heuristic AI plays solidly but doesn't bluff, plan combos, or play around traps well. Treat these numbers as
*directional signals to investigate*, not verdicts. Rerun after every card or rule change and update this file
(`CLAUDE.md`: when balance numbers change, the docs stay the source of truth).

```
pnpm sim match   --a maren --b kesh --games 400      one matchup (alternates who goes first)
pnpm sim matrix  --games 160                         all starters against each other
pnpm sim card    --card WYL-05 --in kesh --games 600 deck ± one card (the ±6% / ±10% gate, 02_CARDS §3)
pnpm sim tiers   --character maren --tiers 3,5       does a deeper deck crush a Tier I deck? (DECISIONS #12)
pnpm sim enemies --character maren --games 200       a starter vs every enemy of its realm
pnpm test:property                                   10,000 random games with invariant checks (the engine gate)
flags: --ai heuristic|random  --personality …  --rules '{"secondPlayerExtraCards":1}'  --seed S  --workers N
```

## Balance audit (2026-10-25, DECISIONS #223): read this first

Robert: a Tier 2 Sehra dealt 450+ on turn 1 and the Warden never acted. Goal: Slay the Spire numbers, bosses that take 10+ turns,
Tier I a challenge, V an accomplishment, X a big one, XX a godly build, without huge HP.

**Tool:** `pnpm audit:balance -- <mode>` (tools/src/audit.ts, all cores, deterministic):
- `burst`: the most damage a deck can deal in one round (a wide search over every order of plays), turn 1 and turn 3.
- `optimize --level t2|t10|t20`: hill-climbs a deck (swap/add/remove any card of the character's pool, upgraded, deck rules kept)
  towards the most damage over the opening rounds, then plays it against every Warden. This is what a combo-hunting player finds;
  if one character's number is far above the rest, it has a broken combination.
- `ladder`: drafted decks of each depth (t1s1 = first Warden, t1s3 = end of loop 1, t2, t5, t10, t20) against their own tier:
  win %, turns, HP lost, best round as a share of enemy HP.
- `matrix`: deck depth x Rift Tier, Warden + Vorthax win % at full HP.

Decks are drafted like a person (tools/src/audit/decks.ts): one lane, the best card of it on offer, Strikes and Defends cut, upgrades
and Boons by depth (a deck that has looped owns nearly all 12 Boons). The fight bot is the beam-search bot (`chooseSmartAction`).
**Why the older sims misled:** random picks with no synergy and a one-ply bot that never sets a combo up, so engine characters looked
weak and got more HP (Sehra 116, Vesper 124). Read bot win rates as a floor for engine characters; burst and the optimizer are the ceiling.

**What the optimizer found (Tier II depth, damage in a round):** Sehra 1,433 on turn 1, Kesh 3,831, Sylas 4,214-6,127, Vesper 4,198,
Dorian 2,189, Valeria 667. Each rested on a free card that replaces itself or makes Mana (Calm in and out for +2 Mana, Frenzied Gulp,
Calculated Move, Blood Sacrifice, a permanent Cheapen), a doubler played again and again (Fatal Dose, Plague Bloom, Slip the Leash,
Briar Bloom), or a payoff multiplying a number that only grows (Colossus Blow, Final Reckoning, Harvest, Zenith). What changed: DECISIONS #223.

**After** (`burst`, turn 1, median / 90th percentile; the Warden HP at that depth's tier in brackets):

| Depth (Warden HP) | t1s1 (317) | t1s3 (317) | t2 (387) | t5 (565) | t10 (785) | t20 (988) |
|---|---|---|---|---|---|---|
| Sehra, before | 33/63 | 43/84 | 50/123 | 100/161 | 56/134 | 62/149 |
| Sehra, after | 23/54 | 41/95 | 60/99 | 38/142 | 45/125 | 55/102 |
| all ten, after (range of medians) | 17-41 | 18-46 | 22-60 | 23-59 | 28-69 | 23-63 |

**Optimizer ceilings after** (best deck, damage per round over rounds 1-3/4): Tier II 100-500 (was up to 6,127); against Tier XX Wardens
(~988 HP) the optimized decks win 0-100% in 4-15 turns, most 50-100% in 5-10. Still the strongest: Kesh's Feast (Hunger Unbound + Second
Helping) and Ilvane's Spirit stack; weakest: Obsidia, KP and Dorian at Tier XX. Re-run after every content change.

**Fights (`ladder`, drafted decks at their own tier):** regular 3.5-6 turns, Elite 5-14, Warden 10-20, Vorthax 13-35; the best round is at
most ~50% of a regular's HP and 13-27% of a boss's (before: Tier I regulars took 3-5 turns and optimized decks killed Wardens in 1-2).

**Tier curve (`matrix`, Warden + Vorthax win % at full HP, rows = deck depth):**

| Deck | T1 | T2 | T3 | T5 | T8 | T10 | T15 | T20 |
|---|---|---|---|---|---|---|---|---|
| end of loop 1 | **56%** | 35% | 23% | 11% | 5% | 4% | 3% | 2% |
| Tier II | 92% | **75%** | 59% | 36% | 17% | 14% | 10% | 8% |
| Tier V | 97% | 95% | 86% | **70%** | 51% | 40% | 30% | 26% |
| Tier X | 99% | 98% | 93% | 79% | 64% | **49%** | 36% | 28% |
| Tier XX (drafted) | 99% | 97% | 91% | 79% | 61% | 49% | 37% | **29%** |

A run adds attrition (HP carries, 3 bosses and Elites per loop), so run clear rates sit well below these. Decks plateau after about Tier
V (all Boons, everything upgraded), which is why the table climbs fast to Tier X and slowly after: Tier XX is beaten by an optimized deck,
not by a merely deep one. Bot noise is about +/-15 points per hero cell (30 fights); the "All heroes" rows are about +/-5.

**Known gaps:** Ilvane's and Valeria's bot fights run very long (they turtle behind Barrier); Vesper, Sehra and Obsidia are at the bottom
for the bot, but their engines are the ones the bot pilots worst; ghost Wardens are scaled by hero HP, not by the tier table; potions,
events, ancestral cards and Sanctified rolls are not in the audit decks.

---

## Harder Tier I and a steeper climb (2026-10-25, DECISIONS #228)

Players found 0.58 too easy. `matrix` (bot, Warden + Vorthax at full HP, each deck depth at its own tier):

| Deck | T1 | T2 | T3 | T4 | T5 | T10 |
|---|---|---|---|---|---|---|
| end of loop 1 | **34%** | 24% | 16% | 9% | 5% | 2% |
| Tier II | 64% | **50%** | 34% | 23% | 14% | 5% |
| Tier V | 96% | 93% | 88% | 75% | **63%** | 28% |
| Tier X | 99% | 95% | 90% | | 75% | **35%** |

(was 56 / 75 / 70 / 49% on the diagonal). The diagonal rises from Tier I to V because a deck grows fastest over its first loops; from
Tier V it falls again. People beat these numbers by a wide margin, so they are floors.

## Boon pacing (2026-10-25, DECISIONS #227)

Before: a free Boon from every Elite **and** the first two Wardens of every loop, plus the merchant, events, prizes and preludes, out of
only 12 Boons, kept across tiers: decks owned most of them within two or three loops. After: Elites only (about one a stage, plus
ambush and event Elites), 18 Boons, and the four Legendary ones (the run-defining +1 Mana / +1 card a turn among them) at 3% from an
Elite and 40% per loop cleared. Expect roughly 4-6 Boons per loop and every Boon only after many loops. Not measured by a bot yet:
`pnpm runsim` reports Boons per run if it needs a closer look.

## Threshold and Waymarks (2026-10-25, DECISIONS #224)

Yardstick: 100 shards buys about one removal and a half, or one upgrade and a half (Merchant: remove 40, upgrade 60, a common Boon 70).
A **blessing** is one solid thing (~100 shards' worth); a **bargain** should be worth roughly two blessings, paid mostly in HP that the
next rest heals, so taking it is a real temptation and not a trap. Prices that stay for the whole run (and every tier after it: the
deck carries on) are kept for the biggest rewards: max HP for a rare Boon or an upgraded rare of your choice, a Wound for a lot of
shards or a rare Boon.

| Reward | Worth (shards, roughly) |
|---|---|
| a card of your choice, common / uncommon / rare / Legendary | 50 / 90 / 160 / 260 (a random one: about half, it is usually off-lane) |
| remove a Strike or Defend | 40-60 |
| upgrade (your own card) | 60 |
| common / uncommon / rare Boon | 70 / 120 / 200+ (a rare Boon is +1 Mana or +1 card every turn, for good) |
| 10 max HP | 60-80 |
| a Wound (dead card) | -40 (the removal it costs) |
| 10 HP (healable) | -20 to -40 at the start of a run |

---

*Measured 2026-10-22 on the M2 build, heuristic AI (balanced) unless noted.*

---

> **Legacy section.** The commands below belong to the deleted Essence-duel engine (see DECISIONS #90); the current sim is `pnpm sim` (Combat v2, last section).

## 1. First player wins too often — **needs a decision from Robert**

Mirror matches (same deck both sides, alternating who goes first), 500 games each. The number is how often the
**first** player wins; fair is ~50%, a healthy card game is 50–55%.

| Deck | Today | Second player +1 card | Second player +2 cards |
|---|---|---|---|
| Maren (Oath of Dawn) | **60.4%** | 52.4% | 48.4% |
| Rivet (Iron Protocol) | **62.4%** | 55.2% | 54.4% |
| Kesh (Hunger Unleashed) | **73.2%** | 60.0% | 60.8% |

The second player already draws on turn 1 and gets Rift Spark, and it isn't enough, especially for the fast
Wyldmaw deck (Kesh mirrors last ~14 turns). **Proposal:** the second player starts with **6 cards + Rift Spark**
(one extra opening card). It's one number in `01_GAME_DESIGN.md §3.1`; the engine already supports it as a rule
(`Rules.secondPlayerExtraCards`, default 0, so nothing changed until you say so). A second extra card adds little.
Kesh would still favour the first player (60%) and may want its own tuning.
*This is a core-rule change, so it is not applied. See DECISIONS #57.*

## 2. The four starters are not equally strong *(accepted: see DECISIONS #63)*

> Robert: uneven starters are fine as long as weaker characters even out with a stronger deck (a character may need
> several clears to collect late-game cards). The thing to measure is **catch-up**, not equal starters: use
> `pnpm sim tiers` per character and check that every character's deeper decks reach parity.

Row deck's win rate against the column deck (160 games per cell).

| | Maren | Rivet | Kesh | Vesper |
|---|---|---|---|---|
| **Maren** | — | 97.5% | 41.9% | 82.5% |
| **Rivet** | 1.9% | — | 23.1% | 31.3% |
| **Kesh** | 55.6% | 72.5% | — | 89.4% |
| **Vesper** | 20.0% | 70.0% | 12.5% | — |

With the *random* AI (400 games) the order is the same: Kesh 84–90% against everyone, Rivet worst. So this is
deck strength, not just bot skill. Kesh (aggro Devour) is strongest, then Maren, then Vesper, then Rivet by a lot.

**Why it matters:** a run starts from the starter, so a weak starter makes a character feel bad in the first
stage. **Suggestions (not applied, they change character identity, so they're yours to pick):**
- *Rivet:* the 1/1 Drone swarm lacks payoff in the starter (Swarm Protocol ×1, Enforcer Mk.II ×2). Try
  Swarm Protocol ×2 and Enforcer ×3 in place of Recompile and a Salvage Bot.
- *Vesper:* the trap deck needs the AI/human to bait well; Shadow Coil ×3 is the main engine. Consider Snare
  Cascade or Mirror of Malice early in the deck (they're Rares, so more likely a reward than a starter card).
- *Kesh:* nerf nothing yet. Fix the first-player advantage (§1) first, as it hits Kesh hardest.

## 3. "Any deck can win" (pillar 9, DECISIONS #12): looks good so far

`pnpm sim tiers`, Maren. A *model*: a bot drafts decks 1-of-3 with the campaign's rarity odds
(`tools/src/sim/draft.ts`), no map/Resolve/Tempering. 240 games over 4 drafts each.

| Matchup | Deeper deck's win rate |
|---|---|
| Tier I deck vs plain 20-card starter | 71.7% |
| Tier III deck vs Tier I deck | 57.1% |
| Tier V deck vs Tier I deck | 55.0% |

A Tier I deck still wins **43–45%** against a deck that looped 3–5 times, which fits "a one-clear deck can beat a
five-clear deck". Depth buys a modest edge. Caveats: the bot skips picks to stay near 30 cards (real players
may bloat or refine differently); Boons never enter PvP so they're not modelled; Tempering (max 5) isn't either.

## 4. Card impact gate (02_CARDS §3)

Example: swapping one Lightbearer Acolyte for **Smite** in Oath of Dawn moves the win rate by **−0.5 points**
(gate ±6): fine. The full pass over all 86 cards is a follow-up (each card ≈ 20 s at 400 games).

## 5. Stage 1 enemy difficulty (starter deck vs the realm's enemies, 160 games)

Decks are authored in `packages/content/src/enemies.ts`. "Starter wins" is the player's 20-card starter **without
any run picks**, so Elites and Wardens are meant to be harder than this shows.

| Realm | Regular duelists | Elite 1 | Elite 2 | Warden |
|---|---|---|---|---|
| Aurelion (Maren) | 68 / 68 / 75% | Aldric **12.5%** | Maelis 40% | Seraphine **17.5%** |
| Nexus-9 (Rivet) | 86 / 89 / 94% | Hive-7 59% | Ghostwire 69% | Kron 35% |
| Wyldmaw (Kesh) | 90 / 88 / 90% | Ruhn 74% | Bloated One 62% | Gorrmaw 66% |

**Read:** regulars are comfortably beatable. Aurelion's Elite/Warden decks are much stronger than Wyldmaw's
(Aldric and Seraphine are brutal against a bare starter); Wyldmaw's are gentle. Expect to even these out once
the run model gives the player ~8–10 picks by Elite 1, and re-measure then (M4/M5). The Nexus enemy decks inherit
Rivet's weakness. A note for the AI: the Warden "signature mechanics" and Omens are not modelled yet (M5), so
Wardens will be harder than their numbers here.

---

## Method notes
- `Win rate` counts a draw as half a win; brackets are 95% Wilson intervals. At 400 games the interval is about
  ±5 points. Don't read anything smaller than that as real.
- Everyone alternates who goes first, so first-player advantage cancels out in matchups but **not** in §1.
- The simulations are deterministic for a given seed and worker count doesn't change results.
- Speed: roughly 6–9 games/second on 8 cores with the heuristic AI (the random-AI property gate is much faster).

## Combat v2 (C2 first pass, 2026-10-23)
`pnpm sim2 -- --n 30 --draft 10` plays each Riftwalker's starter deck plus 10 random reward cards with a greedy 1-ply bot
(`@sr/combat` `chooseAction`) against every encounter. Tuning knobs then: `ENEMY_SCALE` in `packages/content/src/v2/units.ts`
(regular/elite damage and HP multipliers; gone since #223, units.ts now holds Tier I numbers) and hand-tuned Warden numbers. First-pass results (average HP lost on a win):
regular fights 5-25 HP, Elites 15-45, Wardens 40-60 with Seraphine/Kron/Nyxara beatable (45-100%) and Gorrmaw hard for the
two non-summon characters (40-60% after the C2 review fixes); Vorthax with a 10-card draft is ~10% (the finale expects a full-run deck).
Known skew: summon/pack decks (Rivet, Kesh) beat Wardens more reliably than Maren/Vesper, whose damage is low per card.
The bot drafts randomly, so this is a floor for human play; real balance waits for playable runs (DECISIONS #74).

## Roster balance pass 1 (2026-10-23)

Tool: `pnpm balance -- --n 10 --draft 10` (greedy bot, random drafted cards from the hero's own pool, every regular/elite/Warden
encounter, Normal difficulty). Findings and changes:

- **Before:** with a 10-card draft, Wardens were beaten 90-100% by Rivet and Kesh but only 43-57% by Vesper, Astra and Mire; with
  starter decks only, Rivet won 95% of Warden fights and the rest 0-15%.
- **Changes:** Rivet and Kesh starters one companion card leaner, their starting Drone (4 to 3 damage) and Hound (5 to 4) weaker,
  Rivet 72 to 66 HP, Kesh 76 to 70; Vesper (68 to 76 HP), Quill (66 to 72), Ilvane (70 to 70 after a detour), Astra (74 to 80) and Mire
  (70 to 76) tougher; Vesper's Snares +2-4 damage; Astra's Lumen spenders hit harder (Lumen Bolt 14, Skybolt 18, Nova 30, Supernova
  55, Falling Sky 3 hits) and her Blade starts at 7; Mire's Doom numbers up (Grave Touch 4, Tolling Bell 7, Last Rites 10,
  Deathknell 14, Inevitable 3); Eruption 8 to 7. Fury's "take 50% more" stays (2x was far too harsh in the sim).
- **After (10-card draft, Warden win rate):** Maren 90, Rivet 85, Kesh 95, Vesper 65, Quill 93, Ilvane 93, Sehra 73, Astra 70, Mire 85.
  Elites and regular fights are won 93-100% by everyone: the campaign's pressure is in the Wardens and in HP across a run, not
  single fights.
- **Bot limits:** the greedy bot sets up engines badly (stances, runes, Lumen), so low numbers for those characters are partly the
  bot. Treat the table as a floor for them and a ceiling for companion decks. Human playtests decide the next pass.
- **Notes:** runsim prints the difficulty percent before the stage ramp (real fights are 92-150% of it by stage); cardscan models a mid-run fight (about stage 2-3). Runs already in progress keep their saved max HP and, if they were Easy, face the new Easy numbers (about 15-20% tougher than before).

**Still open:** Hollow runes scale without bound; Serene/Fury loops with Surge of Ire are strong; starter-only Wardens are very
  hard for most characters (intended: you are meant to draft), but Rivet/Kesh/Sehra start well ahead of the rest.

## Full balance review and difficulty modes (2026-10-23)

Why: friends found the game too easy. They were playing Easy (the default then), where a bot clears 100% of runs losing no fights;
and a full-run sim showed Normal was lopsided (Maren and Ilvane ~90-100% clears, Sehra, Astra and Vesper ~25-35%).

**New tools** (greedy bot, so read as directions, not verdicts):
- `pnpm runsim -- --n 40 --difficulty easy,normal,hard`: whole runs (kit, prelude, map, fights, rewards, shrines, events) with a
  decent-not-great bot (best-rarity drafting, rests when hurt, elites when healthy, no potions). Reports clear rate, average
  stage reached, fights lost, HP walking into duels/elites/Wardens, and which encounters beat each hero. `--hp --dmg --resolve`
  try a setting without editing the table.
- `pnpm cardscan -- --seeds 30`: every card of a pool added twice to a starter+8 random cards deck against elites/Wardens;
  score = share of HP left; shows the strongest and weakest per hero. Noise is ±8, so only the extremes matter.
- `pnpm balance -- --only snare|nosnare`: draft only (or never) Snares.

**Difficulty** (`DIFFICULTY` in packages/campaign/src/run.ts, percent of designed enemy HP/damage; Normal is the default now):

| Mode | Enemies | Resolve | Bot clear rate |
|---|---|---|---|
| Easy | 85% / 80% | 5 (+100 shards) | 99% (relaxed) |
| Normal | 117% / 111% | 2 | 31-33% overall, heroes 22-48% (was 115/110 with 3 Resolve: 50%) |
| Hard | 128% / 120% | 1 | 17% (no retries: one lost fight ends the run) |

(Superseded by DECISIONS #215: strength is now set by the tier table in `packages/campaign/src/tierTable.ts`, which also carries the stage ramp.) Before that, **enemies ramped by stage** (`STAGE_SCALE`): 80/85%, 95/95%, 110/105%, 120/115%, 130/125% of HP/damage for
stages 1-5, so the opening is gentle and the Rift is the real test (before, a stage-1 Warden was as hard as a stage-3 one and
killed weak decks at the start of the run).

**Cards (outliers found by cardscan, then rescanned):**
- Snares: the "cancel that attack" ones were the best cards in the game (Perfect Trap +26, Booby-Trapped Window +26, Silencing
  Snare +17, Mirror Veil +11). Mirror Veil and Silencing Snare cost 2, Perfect Trap 3 (22 damage), Hollow Snare 8 damage, Time
  Bomb 9, Pain Link 6, KP's Pit of Bottles 6, Booby-Trapped Window 10 damage and no Stun. Vesper gets a stronger Veil Strike
  (6 damage), more HP (104) and a longer Ambusher (Exposed for 2 turns).
- Defence made everything else pointless: Maren Sure Footing Bracing 1, Plated Resolve Armored 2, Aegis 6 Barrier at 2 Mana, Last
  Oath thorns 3 / bracing 1, Dawn Incarnate x2 Barrier; Ilvane's Ward rune (passive 1, release 6), Glacial Bastion, Stored Charge,
  Cold Snap (cost 1), Glimmer (cost 1), Glyph Guard, Frostglass, Hollow charges by 2; KP Glass Palace, Pass Out; Drowned King
  (no taunt, 22 HP, 10 damage, 4 Barrier, 1 Might); Still Flame Ascendant (cost 3, 4 Primed); Supernova 46, Falling Sky 7 x3, Lyra costs 2.
- Buffed the weakest: Maren Anvil Strike, Vengeful Light, Dawn's Verdict; Ion Lance; Reactor; Reinforce; Death Mark; Coup de
  Grace; Nightfall (cost 2); Hone; Royal Decree; Harmonic Wave; Cataclysm Glyph (cost 2); Deathless; KP Shatter, Barroom Brawl,
  Boomstick, Rack and Ruin.
- Heroes: HP Maren 66, Rivet 58, Kesh 92, Vesper 104, Quill 66, Ilvane 56, Sehra 90, Astra 102, KP 80, Mire 96; Maren
  Oathkeeper 2 Barrier, Astra Starborn 2 Lumen, Mire Grave Chill 3 Fate.

**Still open:** the bot cannot pilot engines well (Astra, Kesh, Vesper, Kp sit at 43-48% vs Maren 68%), so a human will do better
with them; Mana-trick cards (Overcharge, Saved Breath...) score low because the bot does not value Mana. Re-run after every
content change.

## v0.3.12-13 changes (2026-10-23)

- The Warden's Gift is now the hero's own rare cards (plus a 30/55/85% chance of an own legendary); Warden signature cards, Neutral rares and the ancestral card are gone from it, and it can be skipped. (`giftOffers`'s boss parameter is unused now and kept for callers.)
- New crowd fights (Drone Swarm 6 Scrap Drones, Page Troop 6 Gilded Pages of 6 HP and 2 damage, Raptor Horde 4). The first version (five Squires, five Raptors) dropped Normal from 33% to 16%; Pages and four raptors bring it back. Current `pnpm runsim -- --n 40`: Easy 97-98%, Normal 28-33%, Hard 9-11%.
- Eleven events (the bot only takes heal, upgrade or leave, so event value is not in these numbers).

## Per-deck pass (2026-10-23, DECISIONS #146)

`pnpm runsim -- --n 40 --difficulty normal` (whole runs; bot noise about ±8 points):

| Hero | Before | After |
|---|---|---|
| Maren | 45% | 43% |
| Rivet | 43% | 40% |
| Kesh | 28% | 38% |
| Vesper | 53% | 43% |
| Sylas (quill) | 33% | 45% |
| Ilvane | 60% | 53% |
| Ragnar (sehra) | 35% | 45% |
| Obsidia (astra) | 43% | 48% |
| KP | 45% | 57% (45-56% across runs at n=16-40) |
| Dorian (mire) | 38% | 40% |
| **Overall** | **42%** | **45%** |

Cardscan (`--seeds 10`) before the pass: summons are the strongest cards for Rivet (Scrap Heap, Forge Titan, Field Engineer
+35 to +37) and Mire (Grave Colossus, Legion of Bone +30 to +38), because an attack never carries past a companion (see #146:
a core-rule question for Robert). Aegis Eternal (+31) and Radiance Eternal (+34) led Maren; Eternal Rage (-7) and Final Round
(-8) were the weakest new legendaries. Ilvane's cards barely move his score (baseline 78% HP left): his strength was HP and the
free Hawk totem, so his HP came down and his weakest attacks went up.

## PvP, first look (2026-10-24, `pnpm pvpbalance 6`)

540 matches between starting decks, the greedy bot on both seats, average length 8.5 turns.

- **Moving first wins 57%, moving second 43%**, even though the second player already gets +1 Mana and +1 card on their first turn. A person plays differently from this bot, so read it as a hint: going first looks worth more than the head start pays for.
- **With the +10 HP for the second player (DECISIONS #162):** moving first 48.3%, moving second 51.7% (same bots, 540 matches). Close to an even trade; people will tell us which side they prefer.
- **Starting decks are far apart in PvP:** winning share across all pairings (moving first / second): Vesper 96% / 93%, Obsidia 85% / 83%, KP 87% / 81%, Kesh 69% / 43%, Quill 65% / 48%, Sehra 61% / 48%, Mire 35% / 11%, Ilvane 31% / 7%, Rivet 28% / 13%, Valeria 13% / 2%. The starting decks were tuned against enemies (runs), not against each other, and a PvP deck is a banked deck, so this is not the real picture yet; it says where to look when PvP balance starts.

## Baseline raised again, Gambler's Shrine (2026-10-25, DECISIONS #234)

Every Tier table row +15 HP / +8 damage points (Tier I 130% / 120%, Tier X 535-565% / 282-294%, Tier XX 761-775% / 378-384%); steps unchanged, the ladder still rises. To make up for the deeper tiers, from Tier VI a Shrine is the Gambler's Shrine (two different blessings of seven plus the Brass Reel). The Ledger's Max HP is the one open number to watch: 4 + 2 per signature means a run that signs at every Gambler's Shrine (5 or so a run) gains about 40 Max HP, at the cost of one blessing each visit.

## Arena: one-shots and match length, ghost Wardens (2026-10-25, DECISIONS #237)

No Boons (DECISIONS #236). Turn-one ceilings (deck optimizer, `pnpm audit:balance -- optimize --level t10 --rounds 1 --noboons`) before -> after the trims: Totemist 333 -> 263, Hunter 296 -> 188; Sehra 183, Trapper 150, Barbarian lane 0 146, the rest 50-135. At Tier XX (`--level t20`): Sehra lane 2 355 -> about 326 with Radiant giving 1 Mana on entry (was 2), Barbarian lane 0 208, Assassin 155, the rest under 140. Arena HP 6x base (420-528).

Bot-drafted Arena matches (`tools/src/arenasim.ts`, the ghost pilot on both seats, no Boons): HP x3 / x5 / x6 / x8 -> median rounds 8 / 10 / 12 / 13-15; nobody died having had only one or two turns at any multiplier; seat a wins 40-51%. Biggest single turn (p90): 44% / 36% / 35% / 28% of max HP at Tier X.

Ghost Wardens (`arenasim --ghost`): player deck and Boons of a level against another Riftwalker's deck of the same level. Bot win %: the old formula (1.65 + 0.07/tier, no damage) 46 / 31 / 40 at Tiers V / X / XX; the full tier table on a ghost 1-8%; the chosen growth (1.3x base at Tier IV, then the table's rise since Tier IV stage 1, HP and damage) about 45 / 13 / 14; the usual Warden 44 / 15 / 14.
