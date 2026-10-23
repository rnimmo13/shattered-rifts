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
(`@sr/combat` `chooseAction`) against every encounter. Tuning knobs: `ENEMY_SCALE` in `packages/content/src/v2/units.ts`
(regular/elite damage and HP multipliers) and hand-tuned Warden numbers. First-pass results (average HP lost on a win):
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

On top of that, **enemies ramp by stage** (`STAGE_SCALE`): 80/85%, 95/95%, 110/105%, 120/115%, 130/125% of HP/damage for
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
