# C1 Review: Combat v2 engine (`packages/combat`) and `tools/src/fight.ts`

Spec: `docs/08_COMBAT_V2.md`. Reviewer: Claude (code-review subagent). Date: 2026-10-23.
Files read in full: `types.ts`, `engine.ts`, `view.ts`, `sample.ts`, `index.ts`, `rng.ts`, `engine.test.ts`, `tools/src/fight.ts`.
Source files were not modified. Three findings (H1, H2, H3 below) were reproduced with a throwaway script in the scratchpad (not in the repo).

## Overall

The structure is clean: pure functions, JSON state, whole-state clone per action, seeded RNG, no `Math.random`/`Date`/DOM/IO anywhere
in `packages/combat/src` (grep-verified), and no card or unit ID is special-cased in `engine.ts`. Damage order, Barrier timing,
Thorns, Shielded, Seared, Stunned, taunt retargeting and the PvP first-turn bonus match the spec on the main paths. There are no
reachable infinite loops from the sample data. The problems are in status decay semantics, enemy summoning and pattern bookkeeping,
the lack of event redaction for PvP, and gaps in tests and data validation.

## CRITICAL

None.

## HIGH

### H1. A summoned enemy gets its intent chosen twice in the same phase, so its first move is skipped
`engine.ts:355` (`spawn` calls `chooseIntent`) and `engine.ts:529` (`enemyPhase` calls `chooseIntent` for every unit after acting).
A unit summoned mid-phase (it is not in `order`, so it does not act) is chosen once at spawn and again at the end of the phase.
`moveCount` jumps by 2, the `opening` move is never used (the second choice has `moveCount === 1`), a cycle starts at index 1,
and a spurious second `intent` event is emitted. Reproduced: Rift Caller summons a Slime; events show `intent smack` for the new
slime twice, and the slime's cycle is now `smack, goo, smack` as seen by the player instead of `smack, smack, goo`.
The existing test (`engine.test.ts:382`) only asserts `intent` is not null.
Fix: in `enemyPhase`, only choose intents for units in `order` (the ones that acted or were stunned): replace line 529 with a loop over
`order` ids (looking each unit up with `findUnit`, skipping the dead and skipping units whose `intent` is already set and was
chosen this phase). Add a test: summoned slime's first shown move is its `order[0]` and its `opening` is honoured.

### H2. Exposed (and any defensive debuff) on the hero is erased before it can matter
`engine.ts:507-512`, `engine.ts:555`. `decay(r, side)` runs at the end of the owner's own turn. When an enemy applies Exposed to the
hero during the enemy phase, the hero's turn follows and `decay('a')` removes it at the end of that turn, so the enemies' next attack
(which the status is supposed to amplify) never sees it. Reproduced: a slime move that applies Exposed 1 to the hero: hero HP 60 ->
54 -> 48, i.e. the second smack was not amplified. Only Faltering on the hero works. The mirror problem exists in PvP (Exposed 1
applied by A to B decays at the end of B's turn, before A's next attack), and Exposed 1 applied by the hero to an enemy only helps for
the rest of the current turn.
Fix: decide the rule explicitly and implement it: decay each side's debuffs at the end of the *opposing* side's turn for Exposed (the
attacks it affects) and at the end of the owner's turn for Faltering (the attacks the owner makes), or tick both at the start of the
owner's next turn. Document it in 08_COMBAT_V2.md §4 and add tests per side and per status.

### H3. No per-viewer redaction of events, so PvP hidden information leaks
`engine.ts:708` (`play` event carries `def`), `engine.ts:712`, and every `draw`/`discard`/`addCard`/`burn` event carry card ids and
definitions; `applyAction` returns the same unredacted event list to everyone. `viewFor` hides Snares and hands in state, but the
`play` event for a Snare card reveals its definition (and the `draw` events reveal the opponent's draws), defeating the bluffing
pillar the moment PvP is wired (C6). Also the Snare's `id` equals its hand-card instance id, so it can be correlated with earlier events.
Fix: add `eventsFor(db, events, me)` in `view.ts` that strips `def` from `draw`, `play` (for snare cards or when the viewer is not the
owner), `addCard`, `discard`, `burn`, and `snareSprung` still reveals (it is public by design). Give Snares fresh ids unrelated to the
card instance id. Add a test that the opponent's event stream never contains an unsprung Snare's card id. (Medium if PvP is far off,
but fix before C6.)

### H4. Phase patterns do not reset the cycle position when a phase starts
`engine.ts:382-384`, `398-406`. A `cycle` indexes by the unit's global `moveCount`, so on entering a new phase the cycle starts at
an arbitrary position (`moveCount % order.length`). The signature phase-change move (e.g. Warden `rage`, listed first in the phase 2
order) is often skipped or delayed; the test at `engine.test.ts:392` hides this by zeroing `moveCount` by hand. Reproduced: HP forced
to 30 on move 3 happened to land on `rage` only because `3 % 3 === 0`; it would not with a different count.
Fix: store `phaseIndex` and `phaseMoveCount` on the unit; when `activePattern` resolves to a different phase than the last one, reset
`phaseMoveCount` to 0 (and optionally allow a phase to carry an `opening` move). Index cycles by `phaseMoveCount`.

## MEDIUM

### M1. `actAllies` can recurse without bound
`engine.ts:285-287` with `actAlly` (`engine.ts:437-448`). An ally whose `act` contains `actAllies` (or two allies that each contain it)
re-enters `actAlly` for every ally including itself: stack overflow. Likewise a Snare or enemy move using it. Not reachable with sample
data, but it is data-driven and C2 will author content.
Fix: pass a depth/`acting` set on `Run` and skip units already acting, or reject `actAllies` in `Brain.ally.act`/enemy moves at validation.

### M2. No content validation (`CombatDb`) or unit-kind checks
`engine.ts:328-357`, `engine.ts:274-278`. A `summon` op can place an enemy-brain unit on the hero side (it gets an intent but nothing
ever runs `actEnemy` for side `a`), or an ally-brain unit on the enemy side (never acts). Unknown cards in a deck throw inside
`createCombat` but unknown move ids only throw when chosen. Weighted pattern with all weights 0 throws `nextInt: bad range 0`
(`engine.ts:390`), empty `cycle.order` yields `undefined` move, `maxHp` 0 gives NaN percent (`engine.ts:425`), `phases: []` throws
mid-fight, and `activePattern` returns `phases[0]` even when HP is above its threshold (e.g. no 100% phase, `engine.ts:401-405`).
Fix: add `validateCombatDb(db)` (called in tests for the content package in C2 and once in `createCombat` in dev) covering these,
and have `spawn` reject a brain that does not match the side's role.

### M3. Taunt is only honoured for aimed damage cards, and not at all for allies' attacks or area selectors
`engine.ts:650-655`, `435-448`, `198-221`. `legalFoes` only enforces taunt if the card has `damage ... to: 'target'`; debuffs aimed at
a non-taunt foe are allowed. Ally attacks use `front` (first living foe) and ignore taunt (`engine.ts:445`), and `front`/`randomFoe`
selectors ignore it too. In PvP an enemy Golem can be bypassed by Drones. The spec (§5) says Taunt allies "must be hit first".
Fix: have `actAlly` choose its target through `pickFoe` (respecting taunt), make `front` taunt-aware, and decide whether
`randomFoe` should be restricted. Add tests (the existing "Golem taunts" test only covers enemy-to-hero-side).

### M4. Draw at turn start tops up rather than "draws up to 5"
`engine.ts:504`. The engine draws `handSize` cards regardless of retained cards (so hand can be 5 + retained, burning past 10). Spec
§3 says "draw up to 5 cards" in one place and "hand is 5 cards" in another. Decide, document, and test: either `draw(handSize - retained)`
or keep the StS rule (always 5) and change the spec wording. `engine.test.ts:107` checks only that the retained card stays.

### M5. Stale intent preview; displayed target can differ from the real one
`engine.ts:463-466`, `view.ts:83-94`. The target is stored when the intent is chosen, and re-resolved when the enemy acts (taunt,
dead target). If the player summons a Golem after the intent is shown, the UI keeps pointing at the hero and shows the damage with the
hero's modifiers while the hit lands on the Golem. Also `describeIntent` takes only the first `damage` op's amount but sums `hits`
across all damage ops (`view.ts:91-92`), and ignores `allFoes` Exposed handling.
Fix: have `describeIntent` re-run the same target resolution used in `actEnemy` (extract it as a shared `resolveIntentTarget`), and
build the damage list from every damage op.

### M6. Stunned skips the move but still advances the pattern; stun on a hero does nothing
`engine.ts:453-458`, `529`. A stunned enemy loses its shown move permanently (cycle advances, `moveCount++`) instead of retrying it.
That might be intended ("intent is cancelled"), but the spec should say so. A stunned hero is never affected (no check in
`playCard`/`endTurn`), and stun applied by an enemy to the hero is silently inert; the Stunned status text is also unspecified for
PvP. Also `Stunned` lingers on units whose owner never "acts" (a hero), so the invariant "all statuses > 0" holds but the status is
permanent.
Fix: decide and document; for heroes either forbid the status or make `canPlay` return false while stunned and clear it at end turn.

### M7. Snare and hit edge cases
- `engine.ts:150`: snares spring on attacks that do 0 damage (Faltering floors to 0, `amount: 0`), and `applyDamage` skips Shielded for
  0 damage but `attackHit` still springs the snare.
- `engine.ts:141-142`: `hpLost` also springs from the hero's own `loseHp` and from Seared/Thorns; Kesh-style self-damage will trigger
  his own Snares. Probably want `source !== own side`.
- `engine.ts:274-278`: a `summon` card at the unit cap still spends mana and the card; `canPlay` does not check the cap
  (`engine.ts:657-664`).
- `engine.ts:157-161`: Thorns reflect even when the attack was fully absorbed by Shielded/Barrier; spec says "hits it with an
  attack", fine, but it also reflects when the thorny unit died from this hit. Decide.
- A snare's `prevent` cancels only the single hit that sprang it, not the rest of the move (multi-hit moves still land the later hits).
  Probably acceptable; document it.

### M8. Outcome `draw` is not handled by the CLI/UI contract, and no `turnEnd` is emitted when the fight ends mid-turn
`engine.ts:371-377`, `fight.ts:133`, `engine.ts:524-527`, `engine.ts:548-554`. Thorns can kill both sides at once; the CLI prints
"Defeat." for a `draw`. `turnEnd` is skipped when the fight ends, so animation code waiting on it hangs. Emit `turnEnd` always before
`gameOver`, and give a draw its own message.

## LOW

- `types.ts:11`/`engine.ts:228`: `draw` of a huge `amount` loops `amount` times (burn/reshuffle can cycle), a data error that is cheap to
  cap (`Math.min(amount, MAX_HAND + draw + discard)`).
- `engine.ts:240-241`: a `damage ... to: 'target'` from a `target: 'none'` card silently retargets to a foe; a status op after a killing
  hit silently does nothing (target stays dead, `engine.ts:243`). Document or validate.
- `engine.ts:716`: Power cards go to `exhausted` and emit an `exhaust` event, so the UI will play an exhaust animation for powers.
  Consider a separate `power` event or pile.
- `engine.ts:604`: hero `startUnits` spawn quietly (`summon` event suppressed), so the UI cannot animate them in.
- `engine.ts:724-731`: `applyAction` takes no acting side. Fine for now, but for PvP the server must verify the sender owns
  `state.active`; consider `applyAction(db, state, action, as?: Side)` to enforce it in the engine.
- `engine.ts:726`: whole-state JSON clone per action is O(state); fine for now, watch it in AI search (`packages/ai` will call this
  thousands of times per decision).
- `view.ts:104`: `viewFor` sends the raw `Unit` incl. `moveCount`/`lastMoves` of enemies, which leaks the weighted-pattern history; strip
  them (the nominal intent is the only thing the player should read).
- `view.ts:162`: `opText` for `addCard` says "the enemy" even in PvP; for `damage` with `to: 'hero'` etc. the wording is awkward.
- `types.ts:233`: `Action` has no `targetSide`; target ids are global strings (fine) but the UI needs `legalActions` to enumerate them,
  which `legalActions` does.
- `fight.ts:98-102`: unknown `--hero`/`--enemies` throws an uncaught `RulesError` stack trace; `void main()` swallows rejections;
  `steps++ < 500` counts invalid-input retries; `rl` is not closed on throw; emoji icons render badly in some Windows consoles.
  The default seed uses `process.hrtime` which is fine in tools (outside the purity-linted packages).
- `index.ts:3`: re-exports `clone` and `RulesError` through `export * from './types'`; fine, but `rng.ts` helpers are not exported, yet
  the test imports `./rng` directly (OK inside the package).

## Test gaps and weak tests

- `engine.test.ts:263-268` ("Faltering from an enemy weakens your next attacks") asserts `faltering >= 0`: vacuous. It should
  assert the hero's Strike deals 4 after Goo, and that the status decays.
- `engine.test.ts:114-123` ("burns cards") builds `c`, `s0`, then asserts only `<= 10`; the first half is dead code.
- `engine.test.ts:310`: titled around "your own aimed cards for the other side" but does not test hero-side taunt (no sample enemy has
  `taunt`), `legalFoes` with taunt, or that taunt blocks `play` with a non-taunt target.
- `engine.test.ts:382`: summoner test does not check the summoned unit's first move (this would have caught H1).
- Not tested at all: Stunned on allies; Seared killing a unit and Seared on the hero (hpLost snare); Thorns with multi-hit and on
  allies; Shielded on 0-damage attacks and against `loseHp`/Seared; Snare triggers `hpLost` and `foeSummons` (no sample cards use
  them, so `fireSnare`'s branches and the `Trig` types are untested); Snare protecting an ally; Snare killing the attacker mid-move;
  `prevent` on a multi-hit move; PvP Snares (two heroes, each side's `attacked`); heal/loseHp/mana/addCard ops; `addCard` to hand when full;
  `retain` + draw count; exhausted/power not reshuffled; the reshuffle with `draw` of more cards than exist; `hp` option on
  `HeroSetup`; PvP taunt; PvP `viewFor` hand hiding on the *active* player; enemy cap of 4 via summon; stun clears intent; phase
  entry move; retargeting when an aimed multi-hit target dies mid-card; both-sides-die draw; `applyAction` after `winner`.
- The property test (`engine.test.ts:553-592`) drives only the sample cards, which exclude Seared, Thorns, Stunned, heal, loseHp,
  addCard-to-hand and `hpLost`/`foeSummons` snares, so the invariants never exercise those paths. Add sample cards/units for each op and
  status so each op appears in at least one random fight, and assert fights terminate (currently a run that hits `maxSteps=400` passes
  silently) and that a fight never exceeds a bounded number of events per action.
- No snapshot/golden test of the event stream, which the Pixi layer (C3) will depend on.
- No purity lint test: confirm `eslint.config.js:65` covers `packages/combat/src/**` (it does) but `sample.ts` and tests are inside that
  glob too; fine.

## Summary table

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 4 (H1 double intent on summon, H2 Exposed decay timing, H3 unredacted PvP events, H4 phase cycle position) |
| MEDIUM | 8 |
| LOW | 11 |

## Resolution
H1-H4 fixed (intent not re-chosen for summoned units; Exposed now wears off on the attacked side after the attacker turn; eventsFor redacts the other side card identities; cycles restart on phase change), plus actAllies recursion guard, vacuous tests replaced, CLI draw message. MEDIUM/LOW items deferred to C2 (DB validation, taunt for ally/random selectors, intent preview target, summon-at-cap).
