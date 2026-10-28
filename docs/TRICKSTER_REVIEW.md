# Trickster review: balance by the card costing guide (proposal, 2026-10-28)

**Status: proposal, waiting on Robert.** Nothing in the game has changed yet.

Every number below is from the card costing guide (`docs/14_CARD_COSTING.md`): add up a card's points, compare them with the budget
for its cost and rarity, and call it fine within ±15%. Trap values use the spring factors in §11 of the guide. The Trickster brought
up eight effects the guide had no rate for (Foresee as this game plays it, cancelling a hit, Ghostly, Steadfast, Brittle, Reverb,
"per card in hand", "per Mana left"); their rates are now in the guide, and listed at the end of this file.

**Budgets:** 0 Mana 6, 1 Mana 10, 2 Mana 19, 3 Mana 28 for a common; uncommon x1.12 (6.7 / 11.2 / 21.3 / 31.4), rare x1.25 (7.5 /
12.5 / 23.8 / 35); basics 70-90% of a common. Consume on a card you would play every reshuffle: budget x1.25. An Aura's 4-turn total:
about 1.5x its cost's common budget for an uncommon, 2x for a rare.

**Trickster facts that change the prices:**

- **Trap, Aura and Skill damage is flat** (DECISIONS #376): Exposed only raises *attack* damage. A Trap that applies Exposed pays off
  through the Trickster's attacks, not through other Traps.
- **At most 3 Traps are set**, and the oldest matching Trap springs (one per event). Trap counts ("per Trap set") are priced at
  **1.5 Traps** in a Trap deck, 3 at best.
- **"Cancel that attack" cancels one hit.** The Trap springs on the first hit of an enemy's move and stops that hit; a two-hit move
  still lands its second hit (`attackHit` in the engine). It is priced as one enemy hit, **~12 at Tier I**. See question 1.
- **The Trickster has no companions**, so "when you or an ally is attacked" always means you.

---

## 1. Starting cards

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Veil Strike (1, basic) | 6 damage, 1 Exposed | as it is | 9 | The top of the basic range (90%). Only its upgrade changes (§4). |
| Set the Web (1, basic Trap) | 8 to the attacker, 2 Exposed | **7, 1 Exposed** | 11.9 → 8.5 | A starting card at 119% of a *common*. It also made Tripwire Garrote (7 + 2 Exposed, an uncommon) worse than the basic; after this, Garrote is the better Trap, as an uncommon should be. |

Strike, Defend and the rest of the starter (3 Strikes, 4 Defends, 2 Veil Strikes, Set the Web) stay as they are.

---

## 2. Number changes

### Over budget

| Card | Now | Proposed | Points now → after | Why |
|---|---|---|---|---|
| Slit and Run (1, common) | 7, 4 Barrier, 1 Exposed | **5, 3 Barrier**, 1 Exposed | 14.8 → 11.6 | Three effects at full size: +48%. |
| Smoke Bomb (1, uncommon) | 1 Faltering and 1 Exposed to ALL, 4 Barrier | **3 Barrier** | 13.8 → 12.6 | |
| Cripple (1, uncommon) | 2 Faltering, 2 Exposed, 5 Barrier | **1 Faltering, 1 Exposed**, 5 Barrier | 18 → 12 | +61%: the worst over-budget uncommon in the pool. |
| Metronome Trap (0, uncommon) | each enemy turn: 4 to ALL, 4 Barrier | **3 to ALL, 3 Barrier** | 9 → 6.8 | A 0-cost card at +34%. |
| Dread Gaze (0, uncommon, Consume) | 4 Exposed | **3 Exposed** | 11 → 9 (budget 8.4) | Exposed past 3 stacks is worth 2 a stack, not 3. |
| Trick of the Light (0, uncommon) | Foresee 2, 3 Barrier | Foresee 2, **2 Barrier** | 8.1 → 6.9 | |
| Measured Breath (1, uncommon) | +2 Mana next turn, 3 Barrier | +2 Mana next turn, **5 Barrier, Consume** | 10.6 → 13 (budget 14) | It makes more Mana than it costs, every reshuffle; the guide's rule is that such a card Consumes. Without Consume, the honest version is Tidecaller (Shaman: 7 Barrier, +1 Mana next turn). |
| Trap Door (1, uncommon Aura) | a Trip Line in hand every turn | **2 Mana** | 2.7x → 1.4x its cost | Four Trip Lines (6.8 each) over four turns. |
| Spring the Trap (1, rare) | 6 (+8 per Trap set) | **6 (+5 per Trap set)** | 18 → 13.5 at 1.5 Traps (30 → 21 with 3) | It doesn't spend the Traps it counts. |
| Opening Strike (0, rare, Consume, Opening hand) | 12, 2 Exposed | **8**, 2 Exposed | 18 → 14 (budget ~12.5) | Guide §6: a 0-cost Consume Opening-hand card carries a 1-cost card's budget. Also further from the Assassin's Killing Stroke (10, 1 Exposed, the same shape). |
| Perfect Alibi (1, rare) | 20 Barrier, discard 1 | **13 Barrier**, discard 1 | 22 → 13.6 | +76%: a 1-cost card that blocks a Tier I turn and a half. |
| Patient Guard (1, rare Aura) | each turn end: 4 (+1 per card in hand) Barrier | **2** (+1 per card in hand) | 1.7x → 1.2x | |
| The Perfect Trap (3, rare Trap) | cancel, 22, Stun 2 turns, 2 Shielded | **no Shielded** | 57.8 → 40.8 | Was a Legendary (now shelved as a rare, DECISIONS #363). +17% after: fine for a 3-cost build-around. |
| The Long Ambush (3, rare Trap) | 25 to ALL, Stun ALL 2 turns, 3 Exposed to ALL | **20 to ALL, Stun ALL 1 turn, 2 Exposed to ALL** | 57.6 → 39.6 | Also a shelved Legendary. +13% after. |

### Under budget

| Card | Now | Proposed | Points now → after |
|---|---|---|---|
| Fang Pit (1, common Trap, 3+ HP lost) | 5 to ALL, 1 Exposed to ALL | **6 to ALL** | 8.3 → 9.2 |
| False Floor (1, common Trap, an enemy summons) | 12, 2 Exposed | **0 Mana** | 7.2 against 10 → against 6 |
| Hidden Hand (1, common) | draw 2, Hold | draw 2, **3 Barrier**, Hold | 8 → 11.6 |
| Tear the Veil (1, common) | 1 Exposed to ALL, draw 1 | 1 Exposed to ALL, **draw 2** | 7.5 → 11.5 |
| Mirror Veil (2, uncommon Trap) | cancel, 2 Faltering | **1 Mana**, cancel, **1 Faltering** | 15.3 against 21.3 → 12.8 against 11.2 |
| Trap Net (2, uncommon Trap) | each enemy turn: 6 to ALL, 1 Faltering to ALL | **1 Mana** | 11.1 against 21.3 → against 11.2 |
| Poison Pantry (1, uncommon Trap, an enemy gains Barrier) | 8, 2 Brittle | **0 Mana, 10 damage** | 5.7 against 11.2 → 6.9 against 6.7 |
| Grim Collection (2, uncommon) | 10, Barrier 4 per Trap set | **12**, Barrier 4 per Trap set | 17.2 → 19.2 |
| Fade Back (1, uncommon) | 7 Barrier, Hold | **6 Barrier, 4 Barrier next turn**, Hold | 9.4 → 12.2. It was worse than the Neutral common Steady Guard (8 Barrier, Hold). |
| Step Aside (1, uncommon) | 5 Barrier, 1 more card next turn | **6 Barrier** | 9.5 → 10.7 |
| Mask of Faces (1, uncommon) | 2 Steadfast | 2 Steadfast, **6 Barrier** | 5 → 12.2 |
| Master Trapper (1, rare Aura) | play a Trap: draw 1 | play a Trap: draw 1, **gain 3 Barrier** | 0.55x → 1.1x |
| Trapper's Dividend (2, rare Aura) | a Trap springs: draw 1, 5 Barrier | **1 Mana** | 0.6-0.8x → 1.2-1.5x |
| The Long Game (2, rare Aura) | draw 1 every turn | **1 Mana** | 0.4x → 0.8x (a little low; the upgrade makes it 0) |
| Coup de Grace (3, rare) | 16 (+3 per Exposed) | **18 (+4 per Exposed)** | 25 → 30 at 3 Exposed |
| Culling (2, rare) | 6 (+2 per Exposed on each) to ALL | **8 (+3 per Exposed on each)** | 13 → 18 at 2 Exposed each, 22 at 3 |
| Between Worlds (2, rare, Consume) | 2 Ghostly, lose 1 Mana next turn | 2 Ghostly, **no Mana lost** | 22 → 26 (budget 29.8) |
| Compound Fear (1, rare) | 1 Exposed, double it (at most +3), Consume | **no Consume** | 10.5 against 15.6 → against 12.5 |
| Curtain Call (1, rare, Consume) | draw 1, 2 random Traps from discard to hand | **uncommon, no Consume** | 9.5 against 15.6 → 10 against 11.2 |

### Left as they are (on budget)

Trip Line, Hollow Trap, Trap Kit, Spring-Loaded, Mark Prey, Unmask, Exploit Weakness, Veil Dance, Cold Read, Patient Blade, Shadow
Cloak, Weigh the Odds, Waiting Game, Low Blow, Tripwire Garrote, Death Mark, Shadow Volley, Strip the Guard, Banked Breath, Gleeful
Trapsmith, Coiled Patience (a little low outside a Patience deck), Saved Breath, Trapline Rider, Long Con, Spotlight, Sleight of
Hand, Hamstring, Stolen Moment, Time Bomb, Bait and Switch (-14%), Silencing Trap, Patient Hunter, Hunter's Eye, Blindside,
Masquerade, Second Act, Frozen Moment, Fade Away, Pickpocket Master (-19%, but its two cards are random), Sandbag (moves to uncommon,
§6), Deep Pockets (question 2).

---

## 3. Two cards that copy the Assassin

The Assassin is a baseline class, so the Trickster's copies change, not the Assassin's cards.

| Card | Now (identical to) | Proposed | Points |
|---|---|---|---|
| Cheap Shot (1, common) | 8, 1 Faltering (**Dirty Hit**, Assassin common) | **Deal 6. Apply 1 Faltering. If you have a Trap set: apply 1 Exposed.** | 6 + 3 + ~2 = 11 / 10 |
| Stalk (2, uncommon) | 15, 2 more cards next turn (**Stalker's Lunge**, Assassin common) | **Deal 16. If the target is Exposed: next turn, draw 2 extra cards.** | 16 + ~4.6 = 20.6 / 21.3 |

Both tie the card to a Trickster build path (Traps, Exposed). They use the existing `when` op with the `snares` and `exposed` metrics,
so no engine work.

---

## 4. Upgrades past +50%

The automatic upgrade raises every number on a card, so cards with two or three numbers gain far more than the ~30% the baselines do
(guide §12). Each of these gets a hand-written "+" that raises one number. Gains are against the proposed base card.

| Card | Automatic "+" gains | Proposed "+" | Gain |
|---|---|---|---|
| Veil Strike | +3 damage and +1 Exposed (+67%) | **9 damage**, 1 Exposed | +33% |
| Set the Web | +3 and +1 Exposed (+60%) | **10 damage**, 1 Exposed | +30% |
| Veil Dance | +1 Faltering to ALL and +3 Barrier (+77%) | **8 Barrier** | +34% |
| Shadow Cloak | +3 Barrier and +1 card (+75%) | **9 Barrier**, draw 1 | +35% |
| Fang Pit | +3 to ALL and +1 Exposed to ALL (+68%) | **9 to ALL**, 1 Exposed to ALL | +32% |
| Slit and Run | +3, +3 Barrier, +1 Exposed (+83%) | **8 damage** | +26% |
| Hidden Hand | +1 card and +3 Barrier (+66%) | **draw 3** | +34% |
| Low Blow | +3 and +1 Faltering (+100%) | **5 damage**, 1 Faltering | +33% |
| Tear the Veil | +1 Exposed to ALL and +1 card (+74%) | **2 Exposed to ALL** | +39% |
| Trap Net | +3 to ALL and +1 Faltering to ALL (+68%) | **9 to ALL**, 1 Faltering | +31% |
| Smoke Bomb | +1 of each status to ALL and +3 Barrier (~+100%) | **2 Exposed to ALL** | +36% |
| Sleight of Hand | +1 card and +1 Mana next turn (+64%) | **draw 3** | +36% |
| Metronome Trap | +3 to ALL and +3 Barrier (+100%) | **5 to ALL**, 3 Barrier | +35% |
| Cripple | +1 of each status and +3 Barrier (+80%) | **2 Exposed** | +25% |
| Step Aside | +3 Barrier and +1 card next turn (+66%) | **9 Barrier** | +34% |
| Mask of Faces | +1 Steadfast and +3 Barrier (+50%) | **9 Barrier** | +30% |
| Trick of the Light | +1 Foresee and +3 Barrier (+60%) | **Foresee 3, 4 Barrier** | +42% |
| Silencing Trap | costs 1 (a 2-cost Trap at 1: ~+90%) | **Stun for 3 turns** | +28% |
| Second Act | 2 Reverb (+100%) | **0 Mana** | ~+40% |
| Fade Away | 2 Ghostly (+100%) | **0 Mana** | ~+40% |
| Compound Fear | +1 Exposed and the cap to +5 (+76%) | **cap +5** | +38% |
| Curtain Call | +1 card and +1 Trap (+70%) | **3 Traps** | +30% |

And one that gains too little: **Coup de Grace+** gains only 3 damage (+10% on a 3-cost card; the guide asks for +8-10). Proposed: **22
(+5 per Exposed)**, +23% at 3 Exposed.

---

## 5. Retire 2

- **Death Trap** (2, rare Trap: cancel, 18, 2 Exposed; +29%). Brought onto budget it becomes either Bait and Switch with 2 Exposed
  added, or (without the cancel) the Hunter's Deadfall word for word. Retired into **Bait and Switch**.
- **Whisper Net** (1, uncommon Trap, an enemy summons: 8 and Stun 1 turn; -46%). It shares the rarest trigger with False Floor, and
  both are far under budget; one summon Trap is enough. Retired into **False Floor** (which drops to 0 Mana, §2).

Both go through `retired.ts`, so old saves and decks keep working. The Trickster keeps every trigger: attacked, enemy turn, HP lost,
summon, Barrier gained.

---

## 6. Rarity spread

Counted from the card data (basics and tokens left out):

| Class | Common | Uncommon | Rare |
|---|---|---|---|
| Baselines (Knight, Assassin, Spellblade, Necromancer, Shaman) | 20 | 35-36 | 24-27 |
| Hunter (after #377) | 23 | 38 | 23 |
| **Trickster now** | 20 | **30** | 28 |
| **Trickster after** | 20 | **31** | 25 |

The Trickster has a few rares too many and **5-6 uncommons too few**. Retiring Death Trap takes one rare off; **Sandbag** (11 at 2 Mana
left, under a rare's budget) and **Curtain Call** (§2) move down to uncommon; Whisper Net's retirement takes one uncommon off. That
leaves the uncommons 4-5 short of the baselines, which is the best argument for new cards (§8).

---

## 7. Questions for Robert

1. **"Cancel that attack" only cancels one hit.** Against a two- or three-hit enemy move, Mirror Veil, Bait and Switch and The Perfect
   Trap stop the first hit and the rest land. Either the text says "Cancel that hit", or the engine cancels the rest of that move.
   This is a core rule, so it is your call. The prices above assume one hit; cancelling the whole move would make these Traps about
   a third stronger against multi-hit enemies.
2. **Deep Pockets** (3, rare Aura: +1 maximum Mana from next turn) does what the Knight's **Inner Furnace** (2, rare Aura: gain 1 Mana
   at the start of each turn) does, for one Mana more. You set its upgrade in DECISIONS #302. Should it cost 2, like Inner Furnace?
3. **Wording:** a Trap that springs on a summon or on an enemy gaining Barrier says "Deal 12 damage to *the attacker*" (False Floor,
   Poison Pantry, and Whisper Net until it is retired). It should say "that enemy". A text-only fix in the generated card text.

---

## 8. Totals

| | Now | After |
|---|---|---|
| Trickster cards (own pool, basics included) | 80 | **78** (80 - 2 retired) |
| Trickster Traps | 17 | 15 |
| Cards changed | | 34 number changes, 2 reworks, 2 rarity moves, 23 hand-written upgrades |

The roster test wants the Trickster to have at least twice the Traps of anyone else: 15 against the Hunter's 6 still passes.

No new cards are proposed; this pass only prices what is there. The pool would still be 4-5 uncommons short of the
baselines (§6), so if you'd like the Trickster to get new mechanics the way the Hunter did, four or five new uncommons would fill
that gap.

## 9. Rates this review added to the guide

| Effect | Rate |
|---|---|
| **Foresee N** (look at the top N, draw the one you choose, discard the rest) | a draw (**3** as an extra, **4** on its own) **+0.5 per card past the first** (at most +2) |
| **Cancel a hit** (a Trap's "cancel that attack") | **~12**: one Tier I enemy hit, like Shielded |
| **Ghostly** (each hit capped at 1, fades each turn) | **~13 a stack**: one enemy turn's damage |
| **Steadfast** (ignore the next debuff) | **~2.5 a stack** (0 against an enemy that never debuffs) |
| **Brittle** on an enemy (its Barrier 25% smaller) | **~0.75 a stack**; only against enemies that defend |
| **Reverb** (your next Attack is played twice) | the next Attack's value, **~12** in an ordinary deck |
| "+N per card in hand" | at **3-4 cards** in hand (more in a Hold deck) |
| "+N per Mana left" | at **1-2 Mana** left (in a Patience deck), 0-1 otherwise |
| Trap on "3+ HP lost" | spring factor **0.75** (5+ HP is 0.7) |
