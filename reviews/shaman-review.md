# Shaman rework review (commit 6db0196, "commanded totems", DECISIONS #418)

Reviewer: Claude (code review subagent), 2026-10-29. Scope: the Shaman part of 6db0196 only (engine totems/command/plant/uproot,
content pool, trait and starter, server wire, replays, bots, web Totems panel, aim, plant choice tiles, tips, info, log and Learn page).
The Spellblade parts, the two untracked expansion docs and `tools/src/_*.ts` are out of scope.

Line numbers refer to the files **as committed in 6db0196**. The working tree has changed since (the Monk work is in progress in
engine.ts, types.ts, view.ts, FightView.tsx, PickModal.tsx, info.ts, tips.ts...), so current lines may be a few off.

How it was checked: I read every file in the brief, ran `shaman.test.ts`, `rework.test.ts` and `cards.test.ts` (1609 passed), ran
`tsc --noEmit` on combat, content, web, server and pvp, and ran two scratch probe scripts (outside the repo) against the real engine
and content: taunt, Hawk's Counsel with free and full positions, the Ancestral Exchange choice chain, Rousing and the Elder, Shelter
with Rousing and Empower, Mirrored and Twinned replays of plant cards, malformed commands, uproot then command, a command during a
pending choice, Circle of Ancestors, Stormcrown, Roar of the Den, Spirit Drum, Rite of Returning, Hail Rite, Bark Carapace, Elder's
Wisdom, Spiritstorm, Totem Volley, Chorus of Spirits, the Spirit cap, the turn reset and a JSON round trip. I ran no balance sims.

**Overall:** the engine side is solid. These all behave as the contract says: one command a turn, no command while a choice is
pending, refusal of dead, wrong-side or missing targets, no Empower on the Elder or without Spirit, Rousing spent only by a Hawk or
Bear command, Shelter spent only by a friendly-aimed command, the `plantKind` then `plantAt` chain keeping the rest of the card and
`replacedNow`, "keep them all" with `min 0`, the `replace` trigger only when the kind changes, uproot then command, and null
positions after a JSON round trip. `plant('*')` with nobody to ask picks the sorted first kind, so it is deterministic. Every retired
id resolves to a live card, and no live card, boon, potion or unit still uses `channel`, `evoke`, `runeSlots`, `pulse` or
`resonance`. The real problems are in the web aiming and Empower state (two HIGH), plus one rules gap (taunt).

---

## CRITICAL

None.

## HIGH

### H1. Choosing a card or a potion does not cancel an aimed command, so the next click sends the command instead
`apps/web/src/fight/FightView.tsx:1895-1899` (hand `onSelect`), `:1955-1962` (potion `onUse`), `:985-1000` (`act` clears
`selected`, `aimPotion` and `releasing`, but not `aimCommand`), `:1377-1391` (pointer handler), `:1225-1247` (`aimSet`).

- **Order mismatch.** `aimSet` puts `aimPotion` first, then `aimCommand`, then the card. The pointer handler checks `aimCommand`
  **before** `aimPotion` and before `selectedCard`.
- **Card scenario.** Press the Hawk totem (the aim bar appears), change your mind and click a Strike in hand (or press its number
  key). The card is selected and the AimArrow is drawn from it. But `aimCommand` is still 0, so `aimSet` glows the Hawk's targets.
  Clicking an enemy sends `{type:'command', totem:0, target}` and not the Strike. That uses up the turn's only command and leaves the
  card unplayed.
- **Potion scenario.** Aim the Hawk, then press an enemy-targeted potion. `aimSet` now holds the potion's targets, but the click
  fires the Hawk command at that enemy. The potion is not used.
- **Stale aim after a card play.** Aim a command, then drag-play a card (or end the turn). `aimCommand` survives the play.
- **Invisible lock.** If that totem is then uprooted or replaced (Release the Spirits, a plant choice), the aim bar disappears
  because `me.totems[aimCommand]` is null. `aimCommand` stays set, though, and `aimSet` is empty. Every later click on the stage is
  swallowed by the `aimCommand` branch, so a selected card can no longer be clicked onto a target, with nothing on screen to say why.
  Only Esc or a right-click frees it.
- **Fix:**
  - Call `setAimCommand(null)` in the hand `onSelect`, in the potion `onUse`, in the number-key select path and inside `act()`, next
    to the existing `setAimPotion(null)`.
  - Order the pointer handler the same way as `aimSet` (or make the two exclusive).
  - Optionally clear `aimCommand` whenever `legal` has no command for that totem.

### H2. Empower can get stuck on, which locks every command (for that turn and later ones) with no way to turn it off
`apps/web/src/fight/FightView.tsx:1528` (`ready` keeps only commands whose `!!a.empower === empowerOn`), `:1553`
(`canEmpower={cmds.some(a => a.empower)}`), `apps/web/src/fight/TotemPanel.tsx:81` (the toggle only renders when `canEmpower`).
`empowerOn` is reset only after a command or by the toggle. Esc, the end of the turn and Spirit reaching 0 do not reset it.

- **Scenario.** He has 1 Spirit. Press "Empower +2", then play Spiritstorm or Elder's Wisdom (both spend all Spirit).
  1. `canEmpower` becomes false, so the toggle disappears, but `empowerOn` is still true.
  2. `ready` is now empty, so every totem is disabled and the panel says "No command now". The Elder is disabled as well.
  3. He loses the turn's command, and every later turn's command too, until something gives Spirit again and the toggle comes back
     (still on).
- **Same lock, other route.** Empower is on, and every totem is then uprooted or replaced by an Elder.
- **Milder case.** Empower left on at the end of a turn silently spends Spirit on the next turn's first command.
- **Fix:**
  - Use `const empowering = empowerOn && cmds.some(a => a.empower)` for `ready`, the aim filter and the action sent.
  - Reset `empowerOn` at the player's turn start and on Esc.
  - Let a non-empowerable totem (the Elder) stay commandable while Empower is on: send it plain.

## MEDIUM

### M1. A Hawk command ignores Taunt
`packages/combat/src/engine.ts:721-724` (`commandTargets`) and `:3893`, versus `legalFoes` at `:3692-3697`.
- **Rule.** A card that deals target damage must aim at a taunter when there is one. The command offers every living enemy.
- **Probe.** With a taunting enemy, cards may target only `u23`, while commands may target `u22` and `u23`.
- **Impact.** Taunt is on companions (Sentry Turret, Bulwark Walker, Gilded Guard). In the Arena, a Shaman's Hawk steps around an
  Engineer's or Knight's guards to hit the hero every turn. SHAMAN.md says "a Hawk aims at the other hero or a companion" and is
  silent on Taunt.
- **Fix.** For `aim === 'foe'`, filter to taunters when any are standing, as `legalFoes` does. Otherwise, if it is meant, log the
  exception in DECISIONS and in the keyword text.

### M2. Card text says "your next command" but the Elder neither uses nor wastes Rousing
`packages/combat/src/view.ts:974-977` prints "Your next command this turn deals or gives N more." on every Rousing card (Guided
Talon, Hawk Call, Frostbark, Stormcaller's Rite...). The engine (`engine.ts:750-752`) applies and spends it only on a Hawk or Bear
command. So a player who commands the Elder after Stormcaller's Rite keeps Rousing 8 with nothing to spend it on, which reads as
broken. The status tooltip (`info.ts:412`) and SHAMAN.md already say "next Hawk or Bear command".
**Fix:** generate "Your next Hawk or Bear command this turn deals or gives N more." Better still, word it from the TotemDefs that
have `empower`, so it stays generic.

### M3. Two cards depart from the design brief without a logged decision
`docs/BASE_CLASS_REWORKS.md` §5 asks for:
- **Shared Shelter:** "Bear's next command protects hero and one companion at reduced values". Built: every friendly at full value,
  with Rousing and Spirit added to each (`engine.ts:761-766`). With two or three companions from neutral cards, one Bear command
  plus Ancestral Bulwark gives 10+ Barrier to each friendly.
- **Ancestral Exchange:** "a bounded benefit only if spirit kind changes, **once per turn**". Built: the payoff has no once-a-turn
  limit, so two copies pay twice.

DECISIONS #418 and SHAMAN.md do not mention either change, which the working agreements require ("log it in docs/DECISIONS.md").
**Fix:** either follow the brief (a `once` guard on the Exchange payoff; Shelter on the hero and one companion, or reduced values),
or log both choices with reasons and confirm their prices in the ledger.

### M4. Most new cards have no scenario test (golden rule 5)
`packages/content/src/v2/shaman.test.ts` covers about ten cards by name: Wardkeeper's Pact, Guided Talon, Ancestral Exchange, Call
the Elder, Shared Shelter, Release the Spirits, Spark Lash, Stormcrown, Elder Communion and Tune the Spirits. Many others are covered
only by the generic "resolves and does something": Roar of the Den, Spirit Drum, Rite of Returning, Circle of Ancestors, Hail Rite,
Bark Carapace, Elder's Wisdom, Spiritstorm, Totem Volley, Chorus of Spirits, Hawk's Counsel (and its full-row "keep" path), Thunderhead,
Ancestral Bulwark and Frostglass. My probes found them all behaving correctly; nothing would catch a regression.
**Fix:** add short scenario tests. My probe numbers can serve as expected values: Roar +6 Barrier and 5 to all; Spirit Drum 1 Spirit
+2 Barrier, Rite next-turn draw 1; Hail 4 to all with a Bear; Carapace 2 a totem; Wisdom draws the Spirit spent; Spiritstorm
4 + 4×Spirit; Volley 4×totems; Chorus 4×kinds.

### M5. No live number on a command
The Totems panel and the aim bar show the static TotemDef text ("4 damage"). Neither shows the actual amount once Rousing and
Empower are added. Cards get exact previews (`previewCardDamage`), but a command, the class's main action, does not. A player
building Stormcaller's Rite (Rousing 8) plus Empower cannot see "14" before clicking.
**Fix:** show the amount in the aim bar and the totem tooltip from a tiny engine helper, for example `commandAmount(db, s, totem,
empower)` that reads Rousing and SPIRIT_BOOST. Keep it in the engine so the client does not compute rules.

## LOW

- **L1. The Elder accepts a stray target.** `engine.ts:743` ignores `action.target` for `aim:'none'`. The probe shows
  `{type:'command', totem:2, target:'u22'}` is accepted. So two different action logs mean the same move, and the server cleaner
  passes it through. Refuse a target on an aimless command, or drop it in `cleanAction`.
- **L2. Mirrored or Echo replays of `plant('*')`** run without a pick and plant a Bear (`Object.keys(...).sort()[0]`, `engine.ts:661`)
  in the first free position. The player gets a kind they never chose. It is deterministic but arbitrary. Consider using the kind
  chosen in the first run (carry it on the pending), or planting nothing.
- **L3. Text: "Whenever you command your Hawk"** (Stormcrown, Roar of the Den; `view.ts:1178`) reads as if there is one Hawk. He can
  have up to three. "Whenever you command a Hawk" is clearer.
- **L4. Dead rune text is left behind:**
  - The `runes` tip (`tips.ts:41-44`) never fires now but still describes pulsing and awakening.
  - `STATUS_INFO.resonance` is renamed "Focus (old totems)" (`info.ts:51`), a player-facing name for something no live card gives.
  - `UI_TIPS.emptyRune` and `RuneArc` are kept only for archived fixtures.

  This is harmless; delete them or mark them clearly as legacy.
- **L5. The new tip reads side `a`.** The `totems` tip uses `v.sides.a.totems` (`tips.ts:51`). In the Arena as seat `b`, a Shaman
  never sees it, and an opponent of a Shaman on seat `a` does. Tips are probably PvE-only; if not, read `me`.
- **L6. Stale "Commanded this turn" on the foe's panel.** `TotemPanel.tsx:26` shows it during your turn, from their last turn,
  because `commanded` resets only at that side's turn start. Show it only for the active side.
- **L7. Foe totem tooltips may not show.** Every foe totem is a `disabled` button (`TotemPanel.tsx:45`). Some browsers do not send
  pointer events to disabled controls, so the delegated `data-tip` tooltip may not appear in the Arena. Render the foe's positions as
  `<span>`s, or use `aria-disabled` and ignore clicks instead.
- **L8. `validateDb` skips the TotemDefs.** `validate.ts:131` checks `plant` spirits, but not the TotemDefs' `command` ops (an unknown
  status or card in a command would only fail at run time). `trait.totems` above `TOTEM_SLOTS` is quietly clamped
  (`engine.ts:3594`).
- **L9. Plant position is not chosen as the brief says.** The brief says "Plant into an empty chosen position". The build fills the
  first empty one. This is a reasoned and logged routine detail (DECISIONS #418), noted here only for traceability.
- **L10. No in-game patch note for 0.121.0.** `apps/web/src/app/patchNotes.ts` has nothing on the four reworks yet (CHANGELOG does).
  Presumably it is written at deploy time.
- **L11. The typecheck fails today on code outside this commit.** `apps/web` gives `info.ts` 'mastery' missing and `PickModal.tsx`
  'form' missing. Both come from the uncommitted Monk work in the working tree, not from 6db0196 (combat, content, server and pvp
  typecheck clean). Worth knowing before the next commit.

## Not issues (checked)

- **Engine rules.**
  - A double command in one turn is refused. A command with a pending choice is refused ("Make your choice first"). The other side's
    turn is handled by `active` and the server's seat check.
  - Commands at a dead target, a wrong-side target, an out-of-range, negative or fractional position, an empty position, or an
    Empowered Elder are all refused.
  - Uproot leaves no commands, and a later plant starts at position 1.
- **The plant choice chain.**
  - `plantKind` then `plantAt` keeps `rest`, `finish` and `again`, and counts `replacedNow` on the act that runs the rest.
  - "Keep them all" (`min 0`) runs the rest and plants nothing.
  - A replacement fires `plant`, and fires `replace` only when the kind changed. Circle of Ancestors fires inside a pick.
- **Statuses.** Rousing and Shelter wear off at the end of the turn through `temps`, with no negative stacks. Spirit is capped at 3.
  `commanded` is reset in `beginHeroTurn`.
- **Command maths.**
  - Hawk damage is not an attack: no Traps, Thorns, Might, Vigor or Exposed.
  - `plus` reaches only damage, HP loss and Barrier, and only of the command's own ops, not of the triggers it fires.
- **Wire, replays, bots.**
  - The server's `cleanAction` command case uses an integer-only `num`.
  - The replay `ACTIONS` set accepts `command`.
  - PvP timeouts use `chooseAction` only to answer a pending choice.
  - The ghost duel and smart bot search commands. The greedy bot commands after its last useful card.
- **Display and choice window.** The display reducer applies `totems` and `command` events, and the screen resyncs to the engine
  after each batch. The PickModal key includes the kind, the spirits and `pickCount`, so two plant choices in a row open fresh.

### Summary of CRITICAL and HIGH
- CRITICAL: none.
- HIGH:
  - **H1:** an aimed command is not cancelled by choosing a card or potion (or by any `act`), and the pointer handler checks it
    first. The next click fires the Hawk command instead of the card or potion. If the aimed totem then disappears, a hidden aim
    swallows every stage click.
  - **H2:** Empower can stay on after Spirit runs out. Its toggle disappears and every totem stays disabled, so the player cannot
    command until Spirit comes back.
