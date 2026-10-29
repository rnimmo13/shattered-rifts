# Base class reworks: progress (paused 2026-10-29)

Brief: `docs/BASE_CLASS_REWORKS.md` (Knight, Assassin, Spellblade, Shaman, plus the Monk's Option A, Martial Forms and Mastery, approved
by Robert). Paused at Robert's request at a coherent checkpoint, part-way through the Spellblade. **The Shaman and the Monk have not
been started.** Nothing is pushed or deployed.

## Completed (committed)

| Step | Commit | Notes |
|---|---|---|
| Archive of the old Knight, Assassin, Shaman, Spellblade, Necromancer and Monk | `611e616` | `reviews/balance-baselines/2026-10-29-pre-identity-reworks/`: resolved JSON of every card, upgrade, hero, trait and totem; readable lists and rules; a `git archive` source snapshot with the lockfile; asset hashes; metadata. `tools/src/baselineVerify.ts <dir>` re-checks it (81 checks passed). It is ignored by ESLint and Prettier. |
| Knight: Guard, Riposte, Thorns | `323ef83` | DECISIONS #414-#415. It also adds the shared pieces: the run-save migration (`CLASS_REWORKS`, `RunState.reworked` and `reworkNotice`, a fight in progress restarts, a notice is shown), `RULES_VERSION` 34, costing guide §14 (legacy rates) and §15 (new rates), and the ledger generator `tools/src/ledger/`. A reviewer found no critical or high issues; its fixes are in the next commit. |
| Assassin: Preparation and embedded knives | `035004b` | DECISIONS #416. A reviewer found no critical or high issues. |
| Assassin review fixes, and the Spellblade (work in progress) | the checkpoint commit made with this file (message starts "0.121.0: WIP checkpoint") | See below. |

## Partial: the Spellblade (Imbue and Discharge), committed as a checkpoint but not finished

**Built and tested:**
- **Engine** (`packages/combat`):
  - `Enchant` type, two ordered positions (`SideState.enchants`).
  - Ops `imbue` (with `ifRoom`), `discharge` (1 or 2) and `recast`.
  - Choices (pending `enchant`, `discharge`, `recast`) that carry what was discharged across the choice.
  - Ember +3 on the first hit; Glass 2 to every enemy after the attack, as a non-attack shard; Ward 3 Barrier at once.
  - Status `twinedge`; triggers `imbue`, `discharge`, `dischargeMixed`; metrics `enchants`, `enchantKinds`, `wards`, `discharged`.
  - Previews: an exact or ranged Ember, and "(+N on the first hit)" for multi-hit attacks.
  - Validator: a discharge must come before the card's damage.
- **Content:**
  - `pools/spellblade.ts`: 53 cards (41 ids kept or changed, 12 new).
  - Trait "Glass and Ember": start with a Ward, and the first Imbue each turn draws 1 and gives 2 Barrier. No Arcana Sigil.
  - Starter: 4 Strike, 4 Defend, Ember Inscription, Obsidian Cut.
  - `CLASS_REWORKS.spellblade`, 46 removed ids in `retired.ts`, and the paths (edge 17, burst 17, ward 12).
- **Web:**
  - `EnchantSlots.tsx`, a movable "Obsidian Blade" panel.
  - `PickModal` charge tiles.
  - Tooltips and keywords, a teaching tip, and Learn page words.
  - The Obsidian Blade removed from Sharpen.
- **Display fix (`display.ts`):** a card being played is no longer swept into a mid-play reshuffle. This was a pre-existing bug, exposed by the trait's draw.
- **Tests:** `spellblade.test.ts` (16 tests); updated `cards`, `copyFixes`, `triggers`, `auraUpgrades`, `deckCatalog` and `info` tests.

**Not yet done for the Spellblade:**
1. **Ledger:** `tools/src/ledger/spellblade.ts`, registered in `tools/src/ledger/write.ts`.
   - Rates: Ember 3, Glass 2.6, Ward 3.6; an Imbue at 0.85 of the charge's value; a discharge card at its base +1 (one) or +1.5 (both).
   - Run `npx tsx src/ledger/write.ts spellblade` from `tools/` and tune any card more than 15% off budget.
2. **Docs:**
   - `docs/reworks/SPELLBLADE.md`: contract, strategies, disposition, loop and multiplier checks.
   - Costing guide §15 Spellblade rates, and *(legacy)* marks on the Arcana, Sharpen and Obsidian Blade rows.
   - DECISIONS #417; the CHANGELOG entry.
   - The `09_ROSTER.md` row, trait line and engine-pieces line.
   - The Spellblade section of `CLASS_REWORK_ART.md` (use `tools/src/_art.ts spellblade`).
3. **Test:** a Spellblade case in `packages/campaign/src/rework.test.ts`.
4. **Review:** a reviewer subagent on the Spellblade (the global rule); fix critical and high findings.
5. **Lint:** move `ENCHANT_LOOK` out of `EnchantSlots.tsx` to clear the react-refresh warning.

## Remaining after the Spellblade (not started)

1. **Shaman** (brief §5):
   - Three fixed, selectable totem positions: no FIFO, no auto-awaken.
   - One command a turn, through a visible action and UI.
   - Hawk, Bear and Elder spirits; Spirit capped at 3, with one enhancement per command.
   - Retire Owl and Splinter.
   - Audit every `runeSlots`, `channel`, `evoke`, `pulse` and `resonance` use first.
   - The full slice: ledger, docs, tests and migration.
2. **Monk** (brief §12, Option A):
   - Forms Root, Current and Ember, with one objective completion a turn.
   - Mastery capped at 3, at most 2 spent a card (reuse the `spend` op and trigger).
   - Retire Fervor, Radiant and the Serene/Fury trait; audit stance use by enemies and neutral cards.
   - `CLASS_REWORKS.monk`, and the full slice.
3. **Final pass:**
   - Update the status line of `docs/BASE_CLASS_REWORKS.md`: no longer "proposal only", and the Monk is approved.
   - `pnpm cardlist`; the `CLAUDE.md` status line; the stale Dagger, Bleed and Sigil text in `09_ROSTER.md` (about lines 25, 72, 113).
   - Delete the uncommitted helper scripts `tools/src/_art.ts`, `_chk.ts`, `_refs.ts`, `_val.ts` and `_dbg.ts`.
   - `pnpm check`; a look at the UI in the running game; the final report.

## Actual check results at this checkpoint (2026-10-29)

**Environment note:** partway through the session, the shell's active Node was switched to v20.10 (nvm), and `pnpm` was no longer on the PATH. Vitest 5 and rolldown need Node 22, so the checks below were run with nvm's v22.21.1 put first on the PATH for each command only. The global nvm setting was not changed.

| Check | Result |
|---|---|
| Tests (`vitest run`, the whole repo) | **97 files, 2611 passed, 1 skipped, 0 failed** |
| ESLint (`eslint .`) | **0 errors**, 1 warning: react-refresh `only-export-components` in `apps/web/src/fight/EnchantSlots.tsx` |
| TypeScript (`tsc --noEmit`) | combat, content, campaign, pvp, apps/web, apps/server: pass. tools: pass on rerun; the first run exited 1 with no error output, likely a PowerShell redirection quirk. |
| Web build (`vite build`) | pass |
| Balance simulations | none run (by instruction) |
| Archive check (`baselineVerify.ts`) | 81 of 81 passed (run when the archive was made) |
| Running game UI | not reviewed yet |

## Left untouched on purpose

- `docs/ART_AND_ANIMATION_EXPANSION_2026-10-29.md` and `docs/MULTIVERSE_ENEMY_EXPANSION.md`: untracked files from other work. They are not part of these commits.
- Agent worktrees under `.claude/worktrees/`.

## Open points for Robert

- **Smaller pools:** each rebuilt class has about 52-55 cards, against about 80 before (no near-duplicates). This is a smaller reward depth.
- **Arena gap:** "if the target means to attack" reads 0 against a hero, so a few Knight cards are weaker in the Arena.
- **Low trait:** the Assassin's trait prices at about 14 in the starter, the low end of the roster.
