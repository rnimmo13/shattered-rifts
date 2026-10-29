# Base class reworks: progress (complete 2026-10-29)

> **2026-10-29, DECISIONS #428:** the Knight, Assassin, Spellblade and Monk reworks were reverted to their earlier cards (Robert: they could not fight bosses and lost what he wants them to be). Only the Shaman's rework is live. Their documents and ledgers are archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`; nothing for those four classes below is in the game.

Brief: `docs/BASE_CLASS_REWORKS.md` (Knight, Assassin, Spellblade, Shaman, and the Monk's Option A, Martial Forms and Mastery,
approved by Robert). All five are implemented and committed. Nothing is pushed or deployed.

| Step | Commit | Notes |
|---|---|---|
| Archive of the old Knight, Assassin, Shaman, Spellblade, Necromancer and Monk | `611e616` | `reviews/balance-baselines/2026-10-29-pre-identity-reworks/`; `tools/src/baselineVerify.ts <dir>` re-checks it: 81 of 81 pass after all five reworks (the archive is unchanged). |
| Knight: Guard, Riposte, Thorns | `46de0bd` | DECISIONS #414-#415, `docs/reworks/KNIGHT.md`. Also the shared pieces: run migration (`CLASS_REWORKS`), the costing guide's §14-15, the ledger generator. |
| Assassin: Preparation and embedded knives | `035004b`, fixes in `c6ccec6` | DECISIONS #416, `docs/reworks/ASSASSIN.md`. |
| Spellblade: Imbue and Discharge | `c6ccec6` (work in progress), `6db0196` (finished) | DECISIONS #417, `docs/reworks/SPELLBLADE.md`, review `reviews/spellblade-review.md` (no critical issues; the one high and three medium issues fixed). |
| Shaman: commanded totems | `6db0196`, review fixes in `8d4e296` | DECISIONS #418, `docs/reworks/SHAMAN.md`, review `reviews/shaman-review.md` (no critical issues; the two high fixed, and Taunt, the Rousing wording, the deviations logged, more scenarios). |
| Monk: Martial Forms and Mastery | `8d4e296`, review fixes in the next commit | DECISIONS #419, `docs/reworks/MONK.md`, review `reviews/monk-review.md` (no critical issues; the high issue and three medium fixed). |
| Final pass | `8d4e296` | The brief's status line; `pnpm cardlist` (763 cards); the CLAUDE.md status; the roster's stale Dagger, Bleed, Sigil and keyword text; the helper scripts deleted. |

## Check results (2026-10-29, after the Monk)

Run with nvm's Node 22.21.1 first on the PATH for each command only (the shell's default had become Node 20.10, where Vitest 5 and
rolldown do not run; the global nvm setting was not changed).

| Check | Result |
|---|---|
| Tests (`vitest run`, the whole repo) | 97 files, 2504 passed, 1 skipped, 0 failed |
| ESLint (`eslint .`) | 0 errors, 0 warnings |
| TypeScript (`tsc --noEmit`) | combat, content, campaign, pvp, apps/web, apps/server, tools: all pass |
| Web build (`vite build`) | pass |
| Ledgers (`tools/src/ledger/write.ts`) | Knight 52/54, Assassin 53/55, Spellblade 52/53, Shaman 51/53, Monk 53/53 within ±15% (the rest give a reason) |
| Archive check | 81 of 81 pass |
| Balance simulations | none run (by instruction) |
| The running game | checked by hand in the dev server: the Shaman's Totems panel, a Hawk command and its log line; the Monk's Form panel and technique text |

## Open points for Robert

- **Smaller pools:** each rebuilt class has 53-55 cards, down from about 80 (no near-duplicates). That means fewer distinct card
  rewards.
- **New art:** none was made (brief priorities 1-4). 18-38 placeholders per class, plus kept pictures to review, are listed in
  `docs/CLASS_REWORK_ART.md`. The two Shaman reference strips the brief names are not in the repository.
- **Low starter traits:** the Assassin's and Spellblade's traits price at about 14 in the starter, the low end of the roster.
- **Arena gap:** "if the target means to attack" reads 0 against a hero, so a few Knight cards are weaker in the Arena.
- **Shaman:** Shared Shelter gives full Barrier to every friendly, not the brief's "hero and one companion at reduced values". He has no
  companions of his own. Logged in DECISIONS #418.
