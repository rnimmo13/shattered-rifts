# Review: Engineer frames, scrap/Salvage and the costing pass (DECISIONS #383)

Reviewer pass, 2026-10-28. Scope: every modified file in `git status` plus `packages/content/src/v2/frames.test.ts` and
`docs/ENGINEER_REVIEW.md`.

Checks run: `pnpm typecheck` (all 7 projects clean), `pnpm lint` (clean), `pnpm test` (85 files, 2749 passed, 1 skipped).
The "+" text of the new cards was printed with a throwaway script (deleted afterwards): Pulse Pistol+ 6 x2, Laser Grid+ 9 x2,
Particle Cannon+ 11 base, Full Salvo+ 7 Primed, Legion+ cost 1, all as `ENGINEER_REVIEW.md` §4/§6 say.

## Summary

No CRITICAL or HIGH issues. The engine change is pure and deterministic: `releaseSets` enumerates bitmasks in a fixed order,
validation compares sorted id lists, `Run.salvage` lives only for one `applyAction` call and is keyed to the card instance. Duplicate
ids are de-duplicated and then fail the set match. A bad set throws `RulesError` before any state change. Legacy single-string releases
still parse. Card data matches the review doc, with the deviations the doc's status line lists.

## CRITICAL

None.

## HIGH

None.

## MEDIUM

**M1. `allyLost` Auras run before the card leaves the hand and before it is paid for.** `packages/combat/src/engine.ts:3395` vs `:3397`.
`playCard` captures the hand index `i` at the top, then fires `allyLost` once per scrapped companion, and only after that calls
`sd.hand.splice(i, 1)`. Salvage Rights draws a card at this point. A draw appends to the hand, so today `i` stays valid. But a `draw`
Aura that moves cards in or out of the hand would make `i` point at a different card, and then the wrong card is removed while the
summon card stays in hand. Example: the Knight's `on('draw', [playPile('drawn', { match: 'strike' })])` (knight.ts:250) in a
cross-class deck. Any trigger effect also lands before the card's `play` event and its Mana payment, so a kill there sets
`r.s.winner` and the card is still paid for and run. Fix: fire the `allyLost` triggers after `sd.hand.splice` (for example, right
after the `play` event), or look the index up again before splicing.

**M2. `needsRelease` asks for a release on cards that summon nothing when the side is over its cap.** `engine.ts:3228`.
`roomNeeded` is 0 for a card with no summons, but `0 > cap - slotsUsed` is true whenever `slotsUsed > cap`. In that state every
card (Strike, Defend...) is offered only with a `release` and rejected without one. Fresh play can't reach this because `spawn`
guards the cap. A state built under the old one-per-unit rule can: Enforcer + 2 drones was 3 units and is now 4 slots. That
includes any combat state kept across the update (a PvP room live during a deploy, a test fixture, a future mid-fight save). Fix:
`roomNeeded(...) > 0 && roomNeeded(...) > cap - used`.

**M3. RULES_VERSION was not bumped.** `packages/pvp/src/protocol.ts:63` is still 24, the same as the last commit, and the engine
rules changed: multi-summon cards need room for all of their summons, slots, the `release` shape and `allyLost`. An old client
against a new server (or the reverse) would disagree about which plays need a release. A new client's array release is rejected by
an old server, and an old client's single release for a Heavy over 3 Lights is rejected by a new one. The project convention bumps
on deploy (memory: versioning-and-commits), so this is a reminder to bump it to 25 with the version bump.

## LOW

**L1. Salvage is lost if the card's summon runs after a choice.** `engine.ts:1152`, `:3394`. `r.salvage` is per Run. A card that
asks for a pick (`pending`) before its summon op resolves the summon in a later `applyAction`, and by then the Salvage is gone. No
Engineer card has that shape today. Note it, or store the salvage on `CombatState.pending` if such a card is added.

**L2. `fireTriggers` skips an "attacker" Aura when there is no attacker for `allyDies` but not for `allyLost`.** `engine.ts:~2411`.
A release fires `allyLost` with no attacker. Today's `allyLost` Auras (Salvage Rights, Scrapyard King) don't aim at the attacker,
and `validate.ts` now allows `attacker` for `allyLost`. Add `|| when === 'allyLost'` to that guard so a future "strike the killer"
Aura behaves the same on both triggers.

**L3. A card that both targets an ally and summons could release its own target.** `engine.ts:3375-3392`. The target is checked
before the release. If the release removes that unit, the card's effects then act on a unit that is no longer on the board. No such
card exists now. Either filter the target out of `releaseSets` or reject it.

**L4. The view does not clamp `slots` the way the engine does.** `packages/combat/src/view.ts:201` reads `db.units[u.def]?.slots ?? 1`
directly, while `slotsOf` uses `max(1, floor(...))`. `summonText` (view.ts:1266) and `FightCard.frameOf` also read the raw value.
Use `slotsOf` so a data typo (0, 2.5) can't make the pips and the rules disagree.

**L5. `releases` in the hand model now repeats.** `apps/web/src/fight/FightView.tsx:1066`. The old code used `new Set`. Now a
targeted summon card (Breach Charge with 2 enemies) gets every release set once per target. Picking still works because the
filters are `every/includes`. But if a targeted Colossal card ever exists, the `scrapAll` test (`releases.length === 1`) would miss.
De-duplicate by the joined ids.

**L6. Release picking has no visible "picked" state and no way to undo a single pick.** `FightView.tsx:1204-1215`. Picked
companions only drop out of `aimSet`. The banner text changes, but the picked unit isn't highlighted, and Cancel starts over. This
is UX only.

**L7. Pips now show on every class's companions and summon cards.** `Plates.tsx:138`, `FightCard.tsx:186`. Every ally gets
`slots` in the view, so the Hunter's Pups, the Necromancer's Thralls and their summon cards all show one "●". That matches "this
applies to every hero", but it may be clutter for classes with no Heavy units. Consider showing pips only when `slots > 1`, or only
for the Engineer.

**L8. Card text nits** (generated, `docs/10_CARD_LIST.md`).
- Deploy Spotter: "At the end of your turn it will: Apply 1 Exposed." The target isn't named, and the review doc says "to the front
  enemy". The `target` selector has empty WHO text.
- Bulwark Walker: "Gain 3 Barrier to your hero." The grammar is awkward (an existing phrasing for an ally's `barrier(n,'hero')`).
- Full Salvo: "Apply 5 Primed to all friends" reads fine, but the review doc and the comment say "you and your companions".

**L9. The "+" machines that hit twice gain twice.** `units.ts:69-85` (`plusAlly` adds +2 per hit). Siege Engine+ goes from 3 x2 to
5 x2 and War Engine+ from 4 x2 to 6 x2, which is +4 a strike against +2 for one-hit machines. This isn't priced in §4 of the review.
It is a balance question for Robert, not a bug.

**L10. Doc consistency.**
- `docs/ENGINEER_REVIEW.md` §1 still says a *sacrifice* is "scrapped" and that "a `scrap` trigger fires on a release or a
  sacrifice". The status line at the top corrects this (`allyLost`, and only a release counts as scrapping). Edit the body or
  strike it through so it doesn't mislead.
- §3 Rebuild says "revive only". The code has revive + 3 Barrier, as the status line notes.
- DECISIONS #383 says "17 hand-written upgrades". engineer.ts now has about 24 `up:` entries: the §4 table plus Legion, Overclock
  Core, Scrapyard King, Arc Welder and Targeting Uplink.
- `docs/09_ROSTER.md` lists Rivet at 72 HP while `index.ts` has 70 (this was already wrong before this change).

**L11. Test gaps.** None of these is covered:
- a legacy single-string `release` when two companions must go (it should throw);
- `raiseAlly` with a Heavy unit (it falls back to growing the weakest);
- `cleanAction` with an array release (junk entries, more than 8, empty array);
- Backup Core / Rebuild with a full board (the revive fizzles and the def is pushed back);
- Command Chip after a scrap (the new machine acts once).

The code paths read correctly. These tests would pin them down.

## Checked and fine

- **Server** (`apps/server/src/wire.ts:71-83`): an array is capped at 8, each entry goes through `str` (string, at most 64 chars),
  non-strings are dropped, and an empty list omits `release`. The engine still checks the result against `releaseSets`, so cleaning
  can't turn junk into an illegal action.
- **Duplicate ids**: de-duplicated with `Set`. A set that needs 2 but names one id twice fails the match and throws.
- **Released companion with 0 HP**: `releaseSets` only offers living allies, and a dead one is reaped before the next action.
- **Cap smaller than needed**: `roomNeeded` is capped at `allyCap`, so a Colossal on a full board gives one set (everyone).
- **Card with no summons**: `roomNeeded` is 0, so no release is needed (except the over-cap case in M2).
- **Revive / Backup Core**: `spawn` returns null when there is no room, and the def goes back on `fallen`. Backup Core fires after
  `reap` has freed the slot.
- **Aura and Trap summons** (Foundry Awakens, Mass Production, Hive Mind, Drone Ambush): these sit inside `on(...)`, so they are not
  counted by `roomNeeded` and only fill free slots, as designed.
- **Salvage leaking**: it is cleared on the first matching summon, keyed by `a.inst.id`, so trigger summons (whose `inst` is null) and
  later actions can't take it. An echoed second run of the card finds it already spent.
- **PvP determinism**: the set order comes from the bitmask, and validation sorts the ids. No RNG and no `Date`.
- **React**: `releaseFits`, `sendRelease` and `aimSet` have correct deps. `onStagePointerDown` is rebuilt each render, so there is no
  stale closure.
- **Card data**: every number in `ENGINEER_REVIEW.md` §2, §3, §4 and §6 matches engineer.ts/units.ts, apart from the deviations the
  doc's status line lists (Siege Protocol 10 + 2, Rebuild 3 Barrier, the id `welding-arc`). The retired ids map in `retired.ts`, and
  `SHELVED_LEGENDARIES` and `tools/src/paths.ts` were updated. The rarity counts (+3 common, +4 uncommon, +3 rare) match §7.
