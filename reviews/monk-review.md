# Monk rework review (commit 8d4e296, "Martial Forms and Mastery") + Shaman follow-ups

Reviewer pass, 2026-10-29. Scope: engine (`types.ts`, `engine.ts`, `view.ts`), content (`pools/monk.ts`, `index.ts`, `retired.ts`,
`shelved.ts`, `legendary.ts`, `build.ts`, `monk.test.ts`), web (`FormPanel.tsx`, `formLook.ts`, `FightView.tsx`, `PickModal.tsx`,
`info.ts`, `tips.ts`, `display.ts`, `LearnScreen.tsx`), and the Shaman fixes in the same commit. Checked against
`docs/reworks/MONK.md`, DECISIONS #419, `docs/BASE_CLASS_REWORKS.md` §12 Option A and the Monk ledger.

Verification run: `packages/content`, `packages/campaign`, `packages/combat`, `packages/pvp` and `apps/web` tests all pass
(2040 + 448); `tsc --noEmit` is clean for combat, content and web. I confirmed the behaviour below with throwaway probe tests kept
outside the repo (scratchpad).

What holds up: engine purity (no randomness, Date or I/O added), cards stay data (generic `form` op, `technique`/`formChange` triggers,
generic `spend` of `mastery`), the once-a-turn flag survives form changes, steps only come from hand (`playFree` passes `free = true`;
echoes, Twinned/Mirrored repeats and Replay/Blade Echo run `runOps` without `finishCard`), the turn-start reset, the Mastery cap
(through `addStatus`, so Wreath of Flame and Coiled Serpent are capped too; verified 3 stays 3), Mastery kept between turns
(verified), Grandmaster's Patience (verified), `previewCardDamage` (its generic `spend` branch sets `spentBy.mastery` before the
scaled damage: Mountain Breaker with 2 Mastery previews 22, the right number), form choice keep/change (`min: 0`, PickModal keyed by
`pickCount`, so a Foresee pick never carries over into the form pick), serialization (all new `SideState` fields are optional plain
JSON with no whitelist anywhere in saves, PvP or server), and the Shaman fixes (Taunt in `commandTargets` matches `legalFoes`;
turn-stamped `aimCommandAt` / `empowerAt` with correct hook deps).

---

## CRITICAL

None.

## HIGH

### H1. A Striking technique that asks a question after it kills its target loses its target, so it cannot complete Ember
- **Where:** `packages/combat/src/engine.ts:4392` (`pickCards`: `finishCard(r, sd, fin, cd, findUnit(r.s, p.target) ?? null, p.paid)`),
  with `techniqueStep` at `engine.ts:~4086` and `reap` at `engine.ts:3173` (dead units are removed from `sd.units`).
- **Scenario (reproduced):** two enemies, Ember form. Quick Palms at enemy A, then Foretold Flame at A for the kill. Foretold Flame
  has `scry(2)` after its damage, so it raises a pending Foresee. A has been reaped by then, so after the pick `findUnit` returns
  `undefined`, and the step is recorded as `{card:'foretold-flame', tag:'striking'}` with no `target`. Ember does not complete: no Mastery,
  no 3 Barrier, no Perfected Motion or Unmoved Mind. The same kill with a card that asks nothing (Quick Palms as the second strike)
  does complete, because `playCard` still holds the `Unit` object. So the result depends on whether the card asked a question and
  whether the hit killed. It is deterministic but wrong, and the Monk's own card text says nothing about it. (The `play` triggers in
  that path get `target: null` too, but that problem was already there and is not Monk-specific.)
- **Fix:** record the aimed enemy by id, not by looking up a live unit. Either pass `p.target` (the id) and the card's aim into
  `techniqueStep` from `pickCards` (e.g. `techniqueStep(r, sd, cd, targetId, cd.target === 'foe')`), or keep the target id on
  `finishCard`'s call from both paths and push `{ target: id }` when `cd.target === 'foe'`. Add a scenario test: Ember, Quick Palms, then
  a killing Foretold Flame with a non-empty draw pile completes the objective.

---

## MEDIUM

### M1. Learn page and tooltips still teach the Monk's old stances
- **Where:** `apps/web/src/fight/info.ts:57-80` (`calm` "A stance. Leaving it gives the Monk 2 Mana (once a turn, his trait Inner
  Fire).", `wrath` Fury, `radiant`, `mantra` Fervor "At 10 you spend it to enter Radiant."), `apps/web/src/app/LearnScreen.tsx:29`
  (`'stance'` still in `SIGNATURE_WORDS`) and `LearnScreen.tsx:235` (`Object.values(STATUS_INFO)` lists every status, these four
  included), plus `info.ts:539` (`stance` keyword).
- **Scenario:** a player opens Learn, then Statuses, and reads that the Monk gets 2 Mana from Serene through "Inner Fire", a trait
  that no longer exists. The signature-mechanics list shows both "Form/Technique" and "Stance", although no live card or hero uses
  stances (the only live references are archived fixtures and a `rewards.ts` check).
- **Fix:** drop `'stance'` from `SIGNATURE_WORDS`. Filter the Learn status list to statuses some live content can apply (or keep an
  `archived` flag on `STATUS_INFO` entries and skip them). Reword `calm` so it no longer names the Monk or Inner Fire (the engine still
  needs the entries for archived fixtures).

### M2. Monk-only payoffs can be offered to other Riftwalkers as Rift-crossed cards and do nothing there
- **Where:** `packages/campaign/src/rewards.ts:48-66` (`OWNER_ONLY` holds only the Suits; `readsOwnerOnly` knows nothing of
  `technique`, `formChange`, the `defensive`/`striking` tag triggers, `mastery`/`masterySpent`/`techniqueDone`/`inRoot`/`inCurrent`/`inEmber`).
  The stale comment at `rewards.ts:53-54` still names Still Water and Gentle Return as calm cards.
- **Scenario:** a Knight run's Rift-crossed deal (`deals.ts:171/178/253` through `crossedOffers`) offers Perfected Motion (rare) or
  Unmoved Mind. Both are `on('technique')` Auras, and `techniqueStep` returns at once without `sd.form`, so they never fire. Breath
  Between Blows and The River Turns wait for tagged cards no other hero owns. Grandmaster's Patience needs 3 Mastery. All of them are
  dead Auras in that deck. Unbroken Calm, Flowing Step, Still Water and Wreath of Flame lose their bonus line.
- **Fix:** treat what only the Monk's trait builds as owner-only. That means the `technique` and `formChange` triggers, `play`
  triggers narrowed to the `defensive`/`striking` tags, `when`/scale on `mastery`, `masterySpent`, `techniqueDone`, `techniquesTurn`,
  `defensiveTurn`, `inRoot`, `inCurrent` and `inEmber`, and the `form` op. Extend `deadElsewhere.test.ts` with these ids. (The same gap
  probably exists for the Shaman's `command` Auras, the Spellblade's `imbue` and the Assassin's Preparation spenders, so this is worth
  one pass over all of them.)

### M3. Still Water's draw never pays on the play that completes the objective
- **Where:** `packages/content/src/v2/pools/monk.ts` (`still-water`: `when('techniqueDone', {atLeast:1}, [draw(1)])`).
  `techniqueStep` runs in `finishCard` after the card's effects (`engine.ts:~4086`).
- **Scenario (reproduced):** Root form, Still Guard, then Still Water: the objective completes, but Still Water draws nothing. Its
  text, "If you have completed your technique this turn", reads to most players as true on that play. The ledger's role,
  "Root: rewards the finished pair", suggests the second Defensive technique is meant to pay. As built, it only pays as a third
  Defensive technique.
- **Fix:** decide which is meant. If the completing play should draw, move the check after the step (for example, make the draw a
  one-card `technique` trigger, or evaluate `when` ops tagged as "after step"). If not, reword the card to "If you had already
  completed your technique this turn" and re-price it (the 0.5 chance in the ledger is then generous for a Root deck).

---

## LOW

### L1. The panel's progress pips lag during animation and can read the old form's steps
- **Where:** `apps/web/src/fight/display.ts:180-183`. The reducer copies `form` and `formDone` from the `form` event but drops
  `e.progress`, and leaves `formSteps` alone. `view.ts` then works out `formProgress` from the display state's stale steps.
- **Scenario:** in Current, Still Guard (1 pip after resync), then Settle into Root. During that card's animation the panel shows Root
  with 1 pip (Current's Defensive step read against Root) until the next resync puts it back to 0. Pips also do not move on a step
  until the resync. MONK.md says "the `form` event moves the panel as it happens".
- **Fix:** in the reducer, set `formSteps = []` when `e.form` differs from the shown form. Better, keep `e.progress` on the display state
  (a display-only `formShown` field that `FormPanel` prefers), or rebuild a synthetic `formSteps` that gives `e.progress`.

### L2. "Mastery stops at 3" test does not test the cap
- **Where:** `packages/content/src/v2/monk.test.ts` (the "Mastery stops at 3" case sets `statuses.mastery = 5` directly and expects 5).
- **Fix:** gain Mastery through the engine (complete with 3 held, or Wreath of Flame after a completion) and expect 3. Also add
  scenarios for an echo or free play not being a step (Echo Form `echoing`, `playFree`), and for Still Water (M3).

### L3. Form choice "keep" button says "Keep them all"
- **Where:** `apps/web/src/fight/PickModal.tsx:88`.
- **Fix:** for `p.kind === 'form'`, show "Keep my form" (or "Keep {current}") when nothing is chosen.

### L4. Engine view text names content totems
- **Where:** `packages/combat/src/view.ts:~1021` (Rousing: "Your next Hawk or Bear command this turn...").
- **Note:** generic engine text now hard-codes two content totem names. It is better to derive it from `db.totems` (the totems with
  `empower`) or phrase it as "your next empowerable command". This is presentation only, so LOW.

### L5. Technique counters skip free plays, while tag Auras do not
- **Where:** `techniqueStep` increments `techniquesTurn` / `defensiveTurn` only for hand plays (`engine.ts:~708`), but `on('play',
  ..., {tag:'defensive'})` (Breath Between Blows, The River Turns) also fires for `playFree` plays.
- **Scenario:** a Defensive technique played for free by some effect triggers Breath Between Blows. Turning Palm, though, still says
  "If you have played a Defensive technique this turn" is false. This is consistent with "only from hand" for the objective, but the
  card text on Turning Palm, Redirect and Planted Heel does not say so.
- **Fix:** either count free plays in the two counters (they are not objective steps), or document the rule in the Technique tooltip.

### L6. Ember and all-enemies strikes
- Scattering Kick, Rage of Ages and Last Ember (the last is a Striking technique named after the form) never count as Ember steps.
  MONK.md documents this ("an all-enemies strike aims at none"), but neither the card text nor the Form tooltip says so. Consider
  adding "(an all-enemies strike aims at no one)" to the Ember goal in `formLook.ts` or the Technique keyword.

### L7. 0-cost, 0-damage Striking step
- Master's Flourish with 0 Mastery is a 0-Mana Striking technique that deals 0. With Quick Palms it completes Ember (or closes Current)
  for 0 Mana. This is legal and maybe intended, but check it against the "never require an uncommon" and "objective completion ~2.5
  points" assumptions in the ledger.

### L8. Brief vs build: Turning Palm's condition
- The brief (§12 sample) prices Turning Palm as "if the previous played card was Guard-tagged". The build uses "a Defensive technique
  this turn" (`defensiveTurn`), which is looser. The ledger prices it at 0.65 either way. Note the deviation in DECISIONS #419 if it was
  deliberate.
