# M1 Review — engine core, content (40 Commons), AI, CLI duel

Scope: `git log m0..HEAD` (commits 1b96b5f, f4c334f, c676c4f). I read every source file in
`packages/engine/src` (incl. `testkit/*`), `packages/content/src` (schema, all card files,
characters, index), `packages/ai/src/index.ts`, `tools/src/duel.ts`, `tools/src/cli/render.ts`, and
skimmed all test files. Checked against 01 §3, DECISIONS 17–38 and 02 §4.

Baseline: `pnpm test` 352/352 green, `pnpm typecheck` clean, `pnpm lint` clean, `pnpm duel -- --auto`
plays a full game to a result.

Verification method: throwaway Vitest probes (a temp `*.test.ts` in `packages/content/src` that used the
real `CARD_DB` + the scenario testkit; deleted after). "Reproduced" below means a probe showed the
behaviour; "code-verified" means it is directly evident from the code path; "unverified" is flagged.

**Overall:** the engine is in good shape. The chain (priority, pass-pass resolution, LIFO, window
reopening to the non-owner of the new top link), trap readiness (#23), trap matching at any depth
(#21), negate, fizzle (#25), passive-trigger timing (#31: after the link / before the window,
active player first), effect-made summons (#18), Ambush flip-on-attack ordering (#26), Stun (#30),
temporary Guard (#28), held vs temp Aether, Resonance (#35), hand limit/burn, fatigue, draw and
turn cap are all implemented as written, and I found no determinism leaks (`legalActions`
also stays pure; I checked it against deep-frozen states across 16 starter pairings). All 40
Commons, the 5 tokens, Rift Spark and the 4 Sigils do what their text says. **No CRITICAL issues.**
The two HIGH issues are a hidden-information leak and a broken Scry prompt in the CLI. Both come
from the same gap: `viewFor` / `eventsFor` don't give the client what it needs to render.

---

## CRITICAL

None found.

---

## HIGH

### H1. `statsChanged` events leak the real Power/Guard of face-down units
`packages/engine/src/effects.ts:416-421` (`emitStats`), called from `buff` (241-254), `assemble`,
`transform`; `packages/engine/src/view.ts:106-120` (`eventsFor` doesn't redact it).

`emitStats` runs `computeStats` on the real card definition and puts `{id, power, guard}` into a
public event. If the unit is face-down (an Ambush unit can be the target of unit effects without
flipping, DECISIONS #26), the opponent receives its true stats. With Commons this is reachable:
**Benediction** on any face-down unit (enemy or your own) emits `statsChanged` with the post-buff
stats. For a Hollow Lurcher that's 4/7, which identifies the card exactly. This breaks the redaction
contract (DECISIONS #38). `viewFor` correctly shows `cardId: '?'` for the same card.
`Engine.stats(state, id)` (`engine.ts:159-162`) has the same problem for any caller that holds the
full state (see M4).

**Reproduced:** p2 sets UMB-05 as an Ambush. p1 casts AUR-11 on it. `viewFor(state,0).cards[id].cardId === '?'`,
but `eventsFor(events,0)` contains `{"type":"statsChanged","id":"c2","power":4,"guard":7}`.

**Fix:** in `eventsFor`, redact `statsChanged` (and any future stat-bearing event) for cards the
viewer can't see. `eventsFor` needs the state for that: `eventsFor(events, viewer, state)`. A
simpler option is not to emit `statsChanged` for face-down units at all (`emitStats`: `if
(c.faceDown) return;`). Add a redaction test that buffs a face-down enemy unit and checks that no
event in `eventsFor(…, opponent)` contains its stats.

### H2. The Scry prompt can't be rendered from the viewer's own view, so the CLI Scry is blind
`packages/engine/src/view.ts:45-103`, `packages/engine/src/effects.ts:302-307`,
`tools/src/cli/render.ts:365` (and `nameOf`, which only knows cards in `viewFor().cards`).

The `scry` prompt holds deck instance ids. `viewFor` never adds deck cards to `cards`, so the
player being asked can't see which cards they're scrying. The CLI resolves names through the view,
so every option reads "Top: a face-down card | Bottom: —". The default `pnpm duel` seat is Maren,
whose starter has 2× Rift Wanderer, so a human hits this in normal play and makes the Scry decision
blind.

**Reproduced:** p1 plays NEU-01 with a 2-card deck. `pending.cards = ['c1']`, and
`viewFor(state,0).cards['c1']` is `undefined`. The CLI output follows from the code path:
`describe` → `nameOf` → `visible()` → `cardName(undefined)`.

**Fix:** in `viewFor`, when `s.pending?.player === viewer`, `show()` every id referenced by the
pending prompt (`scry.cards`, `chooseCards.from`, `chooseTargets.slots[].options`). The prompt
already makes them visible to that player. Add a view test for it.

---

## MEDIUM

### M1. Corrode keeps stacking below 0 Power and eats later buffs
`packages/engine/src/flow.ts:386-394` (Dawn pushes `{power: -corrode}` as a permanent buff every
turn), `packages/engine/src/stats.ts:163` (the clamp to 0 only happens at the end).

§3.8: Corrode "loses 1 Power (to a minimum of 0)". The engine adds an unbounded negative permanent
buff every Dawn and clamps only the final total. A unit at 0 Power keeps building hidden negative
Power, so later buffs do nothing or less. Acid Spitter is in the Kesh starter, so this happens in
normal games.

**Reproduced:** p1's Acid Spitter corrodes p2's Gilded Squire (1/2). After 3 of p2's Dawns the Squire
shows 0 Power (buff total −3). Blood Frenzy (+3) then gives **1** Power. By the text it should be 3.

**Fix:** at Dawn, lose only what the unit has: compute the current permanent-layer power (base +
permanent buffs), then push `-min(corrode, max(0, thatPower))`. Alternatively, track corrode loss
as a separate field and clamp it so `base + permanent − corrodeLoss ≥ 0`. Add a test with 2 stacks
and a test for the floor.

### M2. `concede` skips every legality check, including after the game has ended, so it can rewrite the result
`packages/engine/src/engine.ts:138` (concede is exempt from the legal-action check),
`packages/engine/src/actions.ts:411-413`, `packages/engine/src/combat.ts:116-127` (`endGame`
has no `winner !== null` guard).

Once a game is over, `applyAction(state, {type:'concede', player: winner})` sets `winner` to the
loser and emits a second `gameOver`. That breaks the "seed + action log = result" guarantee the
server is meant to replay (DECISIONS #16): a log with an extra trailing action changes who won.

**Reproduced:** p1's Cavalier kills p2 (`winner === 0`). Conceding as p0 then returns `winner === 1`,
events `['gameOver']`.

**Fix:** in `applyAction`, reject any action (concede included) when `s.winner !== null`. Also make
`endGame` a no-op if the game has already ended. Add a test.

### M3. Echo Wisp can be Echoed again and again after being returned to hand
`packages/engine/src/rt.ts:151-173` (the `echoed` flag is only honoured for a move to the Void),
`packages/engine/src/effects.ts:181-194`.

§3.8 Echo: "cast it from [the Void] … Then it goes Beyond." Every zone change creates a fresh
instance with `echoed: false`. An Echoed Echo Wisp that is Recompiled (or burned) goes back to hand
as a normal card. Once it dies it's in the Void again and can be Echoed a second time, without limit.

**Reproduced:** NEU-02 Echoed from the Void, then NEX-11 Recompile on it. The card is in hand with
`echoed: false`.

**Fix (simplest consistent with the doc):** when an `echoed` instance leaves the field for *any*
zone other than Beyond, send it Beyond instead (`if (old.echoed && zone !== 'units') zone = 'beyond'`).
Tokens are unaffected. Log the decision in DECISIONS and add a test.

### M4. The client API can't render a board from `viewFor` alone (no computed stats)
`packages/engine/src/view.ts` (`GameView.cards` holds raw `CardInstance`s),
`packages/engine/src/engine.ts:159-162` (`stats()` needs a full `GameState`).

Golden rule 3 says the client renders `viewFor()`. But layered Power/Guard/keywords (auras,
Packhound, temporary buffs) can only be computed with `engine.stats(fullState, id)`. The CLI
already does this (`render.ts:84-87`). A web or PvP client would need the full state, which
includes the opponent's hand and the PRNG. Combined with H1, `stats()` also returns the real stats
of face-down cards.

**Fix:** have `viewFor` attach computed stats to every visible face-up unit, e.g.
`GameView.stats: Record<id, {power, guard, maxGuard, keywords}>`. Omit them for face-down cards the
viewer can't see. Switch the CLI to use these.

---

## LOW

### L1. Lifebind + Pierce heals for the excess twice
`packages/engine/src/combat.ts:38-41, 146-150`. The attacker deals its full Power to the unit, which
triggers Lifebind for the full Power, then deals the Pierce excess to the face, which triggers
Lifebind again. Total healing is Power + excess, but only Power was dealt.
**Reproduced** with a custom 3/3 Lifebind+Pierce card attacking a 1/2: healed 4 instead of 3. No
Common can have both keywords yet (Roar of the Maw + Aurumclaw could later).
**Fix:** on a Pierce carry-over, deal the full Power to the unit but trigger Lifebind once, for the
total. Or deal `guardBefore` to the unit and the excess to the face. Don't double-count.

### L2. "Evolve resets Arriving" never has any effect
`packages/engine/src/effects.ts:349`. `arrivedTurn = s.turn` only matters on the controller's own
turn. A Raptor that evolves while attacking has already attacked, and one that evolves while
defending loses Arriving at its controller's next Dawn. So DECISIONS #30's rule never changes
anything. **Code-verified.** This is a design question for Robert: should a Ravager that evolved on
the enemy's turn be unable to attack on its next turn? If yes, set `arrivedTurn = nextTurnOf(...)`.

### L3. `trapSet` hides the instance id but `ambushSet` doesn't, and `viewFor` shows both
`packages/engine/src/view.ts:110-113`. Nothing leaks (the backrow id is in the view anyway), but a
client can't link the `trapSet` event to the slot it animates into. **Fix:** keep `id`, hide only
`cardId`, matching `ambushSet`.

### L4. `cardPlayed.fromId` lets the opponent link plays to earlier draws
`packages/engine/src/actions.ts:500-507, 536-543`. Hand instance ids are never shown to the
opponent, except through `returnedToHand.id` (`effects.ts:186-192`). `fromId` then tells them "that
was the card that bounced". This is mostly public information in a physical game. **Fix
(optional):** redact `fromId` in `eventsFor` for the non-owner.

### L5. A delayed effect created during end-of-turn resolution is never cleaned up
`packages/engine/src/flow.ts:78-84`. `delayed` entries for `s.turn` are collected once, before the
end-of-turn triggers resolve. An `atEndOfTurn` created by one of those triggers would stay in
`s.delayed` for the rest of the game. No current card can do this (unverified as a live bug).
**Fix:** drop stale entries (`d.turn < s.turn`) at Dawn, or collect again after the drain.

### L6. Frames share `ctx` by reference, which a state clone splits
`packages/engine/src/effects.ts:394-397`, `flow.ts:45`. A `conditional` branch frame shares `ctx`
(notably `ctx.summoned`) with its parent while the game runs. After a prompt pause, `applyAction`'s
JSON clone turns them into separate copies. Replays stay deterministic, but a branch that summons and
then prompts would hide `summoned` from the parent frame's later `summonedByThis`. No current card
hits this (unverified). **Fix:** store `summoned` in the frame itself, or merge it back when the
branch frame finishes.

### L7. Units killed by the side effects of an SBA pass wait for the next pass
`packages/engine/src/combat.ts:95-106`. `stateBasedChecks` runs one pass. A death that removes an
aura (or Guard) from a unit already checked leaves that unit alive until the next `drain`. There are
no Guard auras in M1. **Fix:** loop until a pass kills nothing.

### L8. A `grant` of Shield or Veiled ignores `duration: 'turn'`
`packages/engine/src/effects.ts:256-262`. These keywords become permanent booleans. Every current
card uses `permanent`, so nothing is affected yet. **Fix:** reject `turn` for these in the schema,
or record an expiry.

### L9. Overclock can be paid when there is no legal target
`packages/engine/src/actions.ts:136`. If you have no Construct, Field Technician still offers an
`overclock: true` variant that pays 1 Aether for nothing. This is legal per #25, but it wastes the
random AI's Aether and clutters the CLI list. **Fix:** only offer the overclock variant if the
overclock abilities' slots have options.

### L10. Swift Echo spells can't be cast in response windows
`packages/engine/src/actions.ts:262-284` only lists Swift spells in hand. No Common is affected.
Note it for M2.

### L11. Last-known filters don't treat tokens as units
`packages/engine/src/stats.ts:212-221` (`defMatches`) and `triggers.ts:40`. `matchesFilter` maps
`token→unit`, but the last-known path doesn't, so an event filter `{type:'unit'}` on a dead token
fails. No current card uses this. **Fix:** do the same mapping in `defMatches`.

### L12. CLI rough edges
- `tools/src/duel.ts:42`: `--max-turns abc` gives `NaN`, and the turn cap is silently disabled.
  Validate the value.
- `tools/src/cli/render.ts:353`: "Spring X (cost)" shows the printed cost, not the effective one
  (with Whisper Acolyte out, a 1-cost trap shows (1) but costs 0).
- `chooseOptional` shows only "Yes/No" without naming the trigger. No Common has an optional
  passive yet.

### L13. The DSL in DECISIONS #36 doesn't match the code
#36 lists the event filter as `{killer:'self', cause:'combat'}`, but the code uses
`killedBySelf: true`. These are missing from the log: the condition `handCountAtMost`, the
`oncePerGame` flag, the filters `withoutShield`/`minCost`, `attackTarget`, `swiftCast`, and
`setFrom` being reshaped to `{zone:'deck', choose:'random'}`. 02 §2.1 is also out of date. **Fix:**
update DECISIONS #36 and 02 §2.1 so the docs stay the source of truth.

### L14. The AI reads the full `GameState`
`packages/ai/src/index.ts:58`. This is acceptable for a random AI in M1, but the M2 heuristic AI
should use `viewFor` + `legalActions` only (as the file header says).

---

## Test gaps
- No test for Corrode with several stacks or for the 0-Power floor (M1).
- No redaction test for events about face-down units (`statsChanged`, H1), and none that checks the
  viewer's own prompt cards are in `viewFor` (H2).
- No test that actions (or `concede`) after `gameOver` are rejected (M2).
- No test for Echo plus a zone change other than the Void (M3).
- DECISIONS #25 partial fizzle (one of two chosen targets gone → still resolves) has no
  multi-target test.
- DECISIONS #31 "then slot order (units left→right, backrow, rift)" for simultaneous triggers is
  untested.
- DECISIONS #30 "Evolve resets Arriving" is untested (and has no effect, see L2).
- DECISIONS #35: no explicit test that attacks and effect-made summons don't add Resonance.
- DECISIONS #26 "face-down units show no tribes" (for example, Packhound not counting a face-down
  Beast) is untested.
- Card tests are solid overall: every card has a scenario. These are thinner: Cleric (no
  "chooses among several damaged units" case in content), Smite (no case where the attack was
  negated), Bone Pit (no case where temporary Guard pushes Guard above 3).
