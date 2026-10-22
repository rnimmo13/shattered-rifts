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
- Speed: roughly 25 games/second on 8 cores with the heuristic AI.
