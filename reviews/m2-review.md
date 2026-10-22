# M2 Review (cards, engine changes, AI, sim, enemies)

Scope: the three M2 commits (`97a8a80`, `bf1883b`, `c9f994c`; the repo has since gained `a6b5c98` and `f748cb0`).
Reviewer: Claude (code-review subagent). Date: 2026-10-22.

## What I ran

| Check | Result |
|---|---|
| `pnpm test` | 19 files / 644 tests pass |
| `pnpm typecheck`, `pnpm lint` | clean |
| `pnpm test:property -- --games 2000 --seed review` | 2000/2000 clean (avg 31 turns, longest 62) |
| Heuristic AI vs itself, 60 games, random legal decks from the whole pool (with `sim.applyAction` instrumented) | 8,391 decisions, 0 exceptions inside the AI's simulations, 0 fallbacks to a random action, 0 unfinished games |
| `pnpm sim ... --workers 1` vs `--workers 4` (same seed) | identical output, so worker count does not change results (runner order restoration is correct) |
| Repro probes (throwaway tests, deleted) | see "Reproduced" tags below |

**Housekeeping, please read:** while I was working, someone committed with `git add -A` (`f748cb0`) and swept four of
my throwaway files into history: `packages/ai/src/zz-review.test.ts`, `packages/content/src/cards/zz-review.test.ts`,
`zz-review2.test.ts`, `zz-review3.test.ts`. I deleted them from the working tree, so `git status` shows them as
` D`. Commit that deletion (`git rm` + commit). Nothing else in the repo was changed by me except this report.

No CRITICAL issues found. 3 HIGH, 11 MEDIUM, several LOW.

---

## HIGH

### H1. Hidden-information leak: `cardAdded` (and `cardBurned` for created cards) are not redacted
- `packages/engine/src/view.ts:146-160` (`eventsFor` has no case for `cardAdded`); producer `packages/engine/src/effects.ts:408-424`.
- AUR-08 Archmagister Velle adds a random Aurelion spell to **its owner's** hand. The event is
  `{type:'cardAdded', player, id, cardId:'AUR-10'}` and `eventsFor` passes it through unchanged, so the opponent's event stream
  names the card that went into the Velle player's hidden hand. Same problem for `cardBurned` when the hand is full
  (effects.ts:416-419): the created card never existed in the Void, yet its id is announced.
- **Reproduced:** `eventsFor([cardAdded p0 c4 AUR-10], 1)` returns the event with `cardId:'AUR-10'` intact.
- Fix: in `eventsFor`, `case 'cardAdded': return e.player === viewer ? e : { ...e, id: HIDDEN, cardId: HIDDEN }`. For the
  hand-full branch of `addRandomToHand`, emit a redacted event (or a card-less `cardBurned`), and have `cardBurned`
  hide the id unless the card truly went to the (public) Void. Add a regression test that runs every event type through
  `eventsFor` and asserts the opponent view contains no card ids that are not in the opponent's `viewFor().cards`.
  (`tools/src/cli/render.ts` currently has no `cardAdded` case, so the CLI does not display it. A web client will.)

### H2. Ascend is illegal when the unit row is full (AUR-09, WYL-07)
- `packages/engine/src/actions.ts:199` (`if (!unitSlot) continue;` runs before the Ascend branch at :205-214).
- Ascend destroys friendly units as its cost, which frees slots, but the early `continue` requires a free slot first.
  Thal'gor (destroy three) is exactly the card you play on a full board; Aurumclaw likewise.
- **Reproduced:** 5 units (incl. 2 Shielded) + AUR-09 in hand, 0 Aether: no `play` action. Same for WYL-07 with five units.
  The existing Ascend tests use 3 units, so they never hit it.
- Fix: compute the Ascend branch independently of `unitSlot`: allow it if `unitSlot || victims.length >= d.ascend.destroy`
  (the sacrificed units always free at least that many slots; `doPlay` already kills victims before `freeUnitSlot`).
  Keep the `unitSlot` requirement only for the pay-Aether path. Add full-board tests for both cards. (Design note: if you
  *want* "needs a free slot", say so in DECISIONS; the card text does not.)

### H3. The "NO PEEKING" test cannot detect a peeking AI, and `choose()` hands the AI the whole `GameState`
- `packages/ai/src/index.test.ts:92-131`, `packages/ai/src/heuristic.ts:56`.
- `belief.ts` itself is clean: it only reads `GameView`, and the run showed no leaks. But the guard test is vacuous.
  I built a `PeekAi` (subclass of `HeuristicAi` whose belief is a JSON clone of the real state, i.e. it sees the opponent's
  real hand, deck and face-down cards) and ran it through the same tamper loop (2 seeds, 227 decisions):
  **0 decisions differed**. The test would pass on a blatantly cheating AI.
  Reasons: the AI never simulates the opponent acting, so the opponent's hand/deck/trap identities barely affect
  `evaluate()`; the opponent is a RandomAi on a Maren-vs-Vesper pairing only; it compares chosen actions, not values.
- Also `choose(engine, state, player)` receives the full state, so nothing structurally prevents peeking.
- Fix (any/all): (a) unit-test `beliefFromView` directly: for a state with known hidden cards, assert the serialized belief
  contains none of their card ids, in the opponent's hand/deck/face-down cards, and that opponent hand/deck/set cards
  are placeholders; (b) change the AI interface to `choose(view, legal, player)` so the real state is unreachable;
  (c) make the tamper test compare the `scored` values (not just the final action) and run it with a heuristic opponent
  that sets traps/ambushes; (d) add an `eventsFor`/`viewFor` redaction test (see H1).

---

## MEDIUM

### M1. CALYX (NEX-07) and Prism (NEU-10) copies bypass Ward
- `packages/engine/src/effects.ts:475-507, 598-617`; Ward is applied only in `flow.ts:198-209 applyWard` for chain links.
- `copyFrameTask` runs the copied effects directly with the chosen targets, so "first enemy effect that targets this each
  turn is negated" never triggers. Veiled is respected (candidates use `targeting=true`), Ward is not.
- **Reproduced:** p1 casts Rift Bolt on a plain unit, then plays CALYX and copies it onto p2's Ward Construct (p2 CALYX): Ward
  holds nothing, guard drops 5 -> 3.
- Fix: run `applyWard` on the copy's targets (extract a shared helper using the copy's controller), emit `statusApplied warded`.

### M2. Mirror of Malice (UMB-11) triggers on spells that do not target a unit, and can redirect onto the caster's face-down unit
- `packages/engine/src/triggers.ts:283-285`.
- `spellTargets: 'friendlyUnit'` is implemented as "any chosen target controlled by the trap owner", with no zone check. Card text:
  "When an enemy spell targets one of your **units**."
- **Reproduced:** (a) p2 casts Shatter on p1's Lantern (a Relic): Mirror is offered and **negates** the Shatter. (b) Shatter
  aimed at p1's set Trap with Mirror active redirects to p2's own face-down Ambush unit and **destroys it**
  (`redirect` filters `zone === 'units'` over the `setCards` candidate list, effects.ts:517-519).
- Fix: in the matcher require `rt.s.cards[id]?.zone === 'units' && controller === ctl`. In `redirect`, only redirect when the
  spell's slot-0 spec is a units spec (or accept only `zone === 'units'` options that are *face-up*), else negate.

### M3. `returnedToHand` leaks the identity of a bounced face-down unit
- `packages/engine/src/view.ts:146-160` (no case), event from `effects.ts:198-205`.
- Face-down Ambush units are legal targets of "a unit" spells (UMB-09 Draw the Veil, any side). The event carries `cardId`, so the
  caster learns a set card that is going into a hidden hand.
- **Reproduced:** `eventsFor(returnedToHand{cardId:'UMB-05'}, 0)` for a bounced face-down Hollow Lurcher returns the cardId.
- Fix: redact `cardId` for the non-owner when the source was face-down (record `wasFaceDown` on the event, or redact whenever
  `player !== viewer` and the destination is a hand). Test it.

### M4. AI: candidate sampling can drop the winning action
- `packages/ai/src/heuristic.ts:174-185` (and `:236` `legal.slice(0, 12)` for own prompts).
- Over 60 candidates, a fixed stride keeps ~60 of N in list order (plays, then attacks, then flips/abilities, face attack last
  per attacker). Lethal "attack face" lines are dropped with probability about (N-60)/N. Big mid/late boards plus target-heavy
  spells exceed 60 routinely.
- Fix: never sample away attacks-to-face/lethal checks; prune by action type or score a cheap heuristic first and
  simulate the top K. Replace `slice(0,12)` with the same.

### M5. AI: belief state silently loses context; swallowed exceptions can hide engine bugs
- `belief.ts:124-146`: `tasks: []` and `rules: DEFAULT_RULES`. When the AI answers a prompt that interrupts a resolution,
  the rest of that resolution (e.g. `afterResolve`, later frames) is not simulated, so mid-resolution prompts are scored on a
  truncated outcome. Custom `Rules` (unit slots, max turns, `secondPlayerExtraCards`) are ignored.
- `heuristic.ts:207-209`: `value()` returns `-Infinity` on *any* exception, including `EngineCapError`/`RulesError` from real engine
  bugs. If every candidate throws, the main phase ends the turn and a response window passes, with no trace. My 60-game run
  showed zero throws, so this is a robustness/observability issue, not a current bug.
- Fix: catch only expected errors; count/log the rest (and make `pnpm sim` print "N simulation errors" and the first message).

### M6. Pierce carry-over ignores `damageReduction` (NEX-06)
- `packages/engine/src/combat.ts:199-203`. Carry = Power - Guard-before, but the defender actually took `Power - reduction`.
  Pierce 8 vs Guard 7 with 1 reduction: unit takes 7 (dies exactly), 1 carries to face. Arguably wrong either way; the text is
  silent. Decide and log in DECISIONS (suggest: excess = damage dealt - guard, i.e. reduction applies first). Not reproduced as a bug.

### M7. Sim / property CLI: bad input is silently accepted
- `tools/src/sim.ts:45-46`: `--rules` keys are never validated. **Reproduced:** `--rules '{"secondPlayerExtraCard":1}'` (typo) ran
  and printed exactly the baseline numbers (60.0% first-player), while the correct key gave 53.3%. A balance decision could be
  made on a no-op run.
- `sim.ts:24-34`: `flag()` returns the next token even if it is another flag, and a trailing `--games` with no value falls back to
  the default. `tools/src/property.ts:230`: `Number('abc')` is `NaN` -> `Array.from({length:NaN})` -> "0/0 games clean", exit code 0.
  A gate that can pass vacuously should fail when `ok.length === 0` or `games` is not a positive integer.
- `.gitignore` (commit `a6b5c98`) now ignores `.github/`, so the CI workflow that runs `pnpm test:property` is not tracked. The
  "runs in CI" claim in DECISIONS #61 and CHANGELOG is currently untrue for anyone cloning the repo.
- `tools/src/sim/runner.ts:227-240`: a worker that throws rejects the whole run and leaves the other workers running; a worker
  that exits without a message never settles (hang). One bad game aborts a long sim. Add `w.once('exit')` handling, catch per game.
- `sim.ts` and the `tiers` command ignore `--rules`; `card` does not `validateDeck` the modified deck (a 4th copy is accepted).

### M8. Override Virus (NEX-18) edge cases
- `effects.ts:220-235, 261-284`; `flow.ts:422-441`.
- **Reproduced:** if the thief's unit row is full, `takeControl` is skipped but the second effect (`grant blitz`) still runs on
  the **enemy's** Construct (it ends up with Blitz for the turn). Fix: make the grant conditional on the steal (e.g. one `takeControl`
  that also grants a keyword for its duration, or `conditional` on a "stole" flag).
- A permanent `takeControl` (Puppeteer) on a unit that still has `revertControl` does not clear it, so the unit would be returned at
  Dusk. Clear `revertControl` in `takeControl` when `duration !== 'turn'`.
- Verified OK: stolen unit bounced (goes to owner's hand, no revert needed), stolen unit returns at Dusk, Dusk with a full owner row
  destroys it (decision 54).

### M9. Hollow Veil (UMB-15) / `firstEachTurn` bookkeeping
- `board.ts:17-26`: when the extra slot goes away the **last** slot is destroyed regardless of free slots earlier in the row (5 cards ->
  4 slots loses one card, fine; 4 cards in slots 0,1,2,4 loses the card in 4 even though slot 3 is free). Compact the row first.
- `stats.ts:523,567`: the "first each turn" flag is stored on the *source card instance* (`usedTurn['costMod']`). Replacing the Rift
  (a new instance) in the same turn resets it, giving a second discount; Rift: Foundry Nexus-9 and Hollow Veil are both affected.
  Track it per player and turn instead (`PlayerState` map keyed by card id + turn), or copy the flag when a Rift is replaced.
- Verified OK: both players' mods are independent (side-filtered, per source), Ascend and Echo casts do not consume the discount
  (they never call `consumeCostMods`), the discount is consumed at pay time only.

### M10. UMB-17 Nyxara's Web "once per game"
- `effects.ts:536-544`: the `ps.once['reset:UMB-17']` key is **per card id, not per copy** (decks may hold 3), the flag is spent before
  checking `freeBackrowSlot` (flow.ts:217), so if the slot was refilled during the chain the Web goes to the Void and the one-time
  re-set is lost; and a second negate-trap on the same attack makes `negate` a no-op while `resetSelf` still spends the use.
  Decide per copy vs per name (log it), and spend the flag only when the re-set actually happens (move the check to `afterResolve`).

### M11. `copySpell` with `eachDifferentInVoid` + `choose` loses earlier copies
- `effects.ts:483-505`: copies are collected in `frames` and pushed after the loop, but the `choose` branch `return`s after setting a
  prompt, so frames already collected are dropped. Latent: Prism uses `random`; no card combines these. Push frames as you go, or
  forbid `eachDifferentInVoid` + `choose` in the schema.

---

## LOW

- `tools/src/sim/decks.ts:27-28`: label uses `ch.name.split(' ')[0]` and prints "Ser (Oath of Dawn)" for Maren.
- `triggers.ts` / `combat.ts:61-72`: `shieldPopped` only fires when the damage source is a live unit; Halberdier (AUR-19) ignores Shield
  pops caused by spells, and "deal 2 to the source" has no target then. Acceptable, document it.
- `view.ts`: a spell paused on a prompt (Draw the Veil's set-trap choice, Whispered Bargain, Seer) is in zone `chain` but its link is
  already popped, so it is in neither `chain` nor any container the view exposes; the M3 client cannot render the resolving card.
- `invariants.ts:65`: the `ps.backrow.length > 5` bound is hard-coded and `InvariantChecker` doesn't validate `pending` ids still exist or
  that `tasks` is empty when `toAct` returns null. Cheap extra checks.
- `heuristic.ts`: prompt answers that don't change the board (Whispered Bargain "put a card on top", Scry ties) pick the first
  candidate, which can be the best card in hand. Add a card-value term.
- `draft.ts`: the Warden's Gift pool includes Vorthax's Prism and all realms' signature cards for every Warden, so tier results are a model only.
  Also `random` per-loop picks do not respect `maxTempered`/Vault.
- `sim.ts`: unknown command prints help and exits 0; `duel.ts:61` treats any `--ai` value other than `random` as heuristic.
- `engine/src/effects.ts:408`: `addRandomToHand` pool is every collectible card of the realm/type, including boss-sourced ones
  (currently none for Aurelion spells, but it is a latent surprise); consider `source` filter.
- WYL-18/AUR-15: verified that two deaths in one resolution do not double-break the relic (the stale trigger no-ops).

## Verified correct (probed or read, with tests passing)
AUR-06 (Resonance counts itself, checked on resolution), AUR-09 normal cast + Ascend with 3 units (filter excludes non-Shielded and
face-down), AUR-14/NEU-08/NEX-13/UMB-17 negation paths, UMB-13 (name captured in the link event so it works after the attacker leaves),
UMB-04 (deck top 3, rest to bottom incl. when no Trap), UMB-09 (hand re-read after the bounce), UMB-07 (`trapResolved` only for
non-negated, non-fizzled Traps; `trapsReady`), UMB-19 (hand visible for the rest of that turn only), NEX-05 (prompt-time reveal;
Lantern suppresses it), NEX-06 (reduction before Shield; pop only if damage got through), NEX-07 (Ward on itself; copy asks for targets;
Resonance recomputed), NEU-04/NEU-10 `selfCost` (play path only; not in Echo/Ascend), NEU-10 (random targets with seeded PRNG; spells
with no targets copy fine; spells with no legal target are skipped), WYL-07 (count read before the destroy), WYL-18 onBreak,
AUR-08 `addRandomToHand` determinism (pool is `.sort()`ed, so DB key order does not matter), `resetSelf` flag cleared on zone change.

## Data / schema
- `schema.ts` mirrors `types.ts` (no field allowed by one and rejected by the other that I could find; `strictObject` catches typos).
- Enemy decks match the 03 §4 themes. All 25 are legal (`validateDeck`), 20/30 cards, Essence matches the doc. Minor: Wandering Knight
  ("Blitz knights") plays Echo Wisp/Shatter filler; Lost Courtier does not run the Faceless Courtier; none are mismatches.
- `docs/BALANCE.md` claims I could check: first-player 60.0% (doc 60.4%) and +1 card -> 53.3% (doc 52.4%): consistent within noise at n=120;
  Stage-1 Aurelion enemy trends reproduce (Aldric 7.5%/doc 12.5%, Seraphine 10.0%/doc 17.5% at n=40, within the stated +-5-10 points);
  "deterministic regardless of worker count": confirmed. **Not supported:** "roughly 25 games/second on 8 cores": the 240-game enemies run took 38 s
  (~6 games/s on 8 workers; a 24-game Maren-Rivet run was ~9 games/s on 4 workers). Update the number or say "5-10 games/s".
- Wilson interval math in `runner.ts:254-264` is correct; `aFirst` alternation is correct; draft decks obey deck rules; `randomLegalDeck`
  produces legal decks (re-validated per addition) and the pool includes every collectible card (all 74 + the signature cards).

## Test gaps
- Ascend on a full unit row (AUR-09, WYL-07), and Ascend + selfCost/Echo interplay.
- CALYX/Prism vs Ward; Prism with a Ward target; Prism when the Void has several spells needing targets.
- Mirror (UMB-11): non-unit targets (Shatter), a caster with a face-down unit, multi-target/zone variants, Ward/Veiled interplay.
- NEX-18: no free slot, stolen unit bounced/killed/devoured by the thief, permanent steal of an already-stolen unit.
- Hidden info: no test for `eventsFor` on the new events (`cardAdded`, `returnedToHand`, `handRevealed`, `redirected`) or for `viewFor` while
  a `chooseCards` prompt is open (the opponent's `pending` must be null and the `cards` map must not gain identities).
- No test that the AI's belief state is free of hidden identities (H3), nor that a heuristic opponent with traps/ambush is used in the tamper test.
- `firstEachTurn`: replacing the Rift mid-turn; two players each with a Rift; discount consumed by a play that is later negated.
- UMB-17: second copy in the deck, no free backrow slot, double negation. UMB-15: row with a hole shrinking.
- `copySpell` `lastCast` for Swift/Rift Spark and when the last spell was negated; `addRandomToHand` with a full hand (burn event).
- `tools`: no tests for `runTasks` order restoration, `summarise` (Wilson, draws as half, aFirst), flag parsing, or `property.ts` failure exit codes.
- `value()` exception swallowing is untested; nothing asserts the AI never falls back to a random legal move.
