# Balance baselines before the identity reworks (2026-10-29)

A frozen copy of the five balancing-baseline classes (Knight, Assassin, Shaman, Spellblade, Necromancer) and, for reference, the
Monk, exactly as they were at commit `82867b0` (game 0.121.0, RULES_VERSION 33), just before the class identity reworks of
`docs/BASE_CLASS_REWORKS.md`. The Necromancer stays in the live game unchanged; the other five were rebuilt after this snapshot.

**Never edit, regenerate or "fix" anything in this folder.** When the live classes are tuned, this stays as it is: it is the point of
comparison. A new snapshot goes in a new, dated folder (add a suffix such as `-b` if the date is taken).

## What is here

| Path | What |
|---|---|
| `resolved/combat-db.json` | The whole combat database at the commit: every card (with its "+" version), hero, totem, unit, Boon and Potion, as plain JSON. It is self-contained: nothing in it depends on code. |
| `resolved/<class>.json` | One class: hero numbers, trait, Sigil, starter (ids and text), starting companions, rarity counts, and every card with its generated rules text and its upgrade. |
| `resolved/totems.json`, `summary.json` | The totem definitions; counts and starters for all six. |
| `cards/<class>.md` | The same card lists, for people: id, name, cost, type, rarity, text, keywords, upgrade text. |
| `rules/ENGINE_SEMANTICS.md` | What the statuses, ops and upgrade rule meant at this commit (turn order, damage order, attack vs non-attack, Sharpen, Arcana, totems, Daggers). |
| `rules/CLASSES.md` | Each class: trait, starter, engines, representative combos, and its known deviations from the Slay the Spire character it copied. |
| `docs/` | The costing guide, roster, combat design, card list, balance notes, DECISIONS and the class reviews, as they were. |
| `source/source-snapshot-HEAD-82867b0.tar.gz` | `git archive` of the engine (`packages/combat`), content (`packages/content`), campaign, PvP packages, the tools' source, root package files, `pnpm-lock.yaml` and the TypeScript/Vitest/ESLint configs. No `node_modules`, no secrets. |
| `assets/INVENTORY.md`, `assets/assets.json` | Every picture these classes used (hero figure, skins, card art, weapons) with its SHA-256. No art was moved or deleted by the rework; the hashes show whether a file is still the same. |
| `METADATA.json` | Commit, dirty state, time, game/rules/save versions, Node version, lockfile hash, how it was generated. |
| `HASHES.sha256` | SHA-256 of every file here (except itself and VALIDATION.md). |
| `VALIDATION.md` | The checks run when it was made. |

## Using it for hand balance

The live classes are priced with `docs/14_CARD_COSTING.md`. To compare a rebuilt class with its old self:

1. Read the old card in `cards/<class>.md` (or its full definition in `resolved/<class>.json` -> `cards[].def`), and its upgrade.
2. Price it with the costing guide's **legacy** rates (`docs/14_CARD_COSTING.md` here is the guide as it was; the live guide labels the
   rates built for these classes as legacy). `rules/ENGINE_SEMANTICS.md` says what each op did then.
3. Compare per-cost and per-rarity budgets, the starter as a whole (`resolved/<class>.json` -> `starter`, `starterText`), and the trait.

Old Arcana, Sharpen, totem-plant, Fervor and Dagger rates describe these pools only: do not price the new resources with them.

## What is runnable, and what is not

- The JSON and Markdown need nothing to read.
- The source snapshot builds and runs at its own commit: `git checkout 82867b0 && pnpm install && pnpm test` in a clean clone (or unpack
  the tarball into an empty folder, copy a matching `node_modules`, and run the tests there). The tarball is not wired into this repo's
  build, imports, reward pools or test discovery, and must not be.
- `tools/src/baselineVerify.ts <this folder>` re-checks the hashes, counts, starters and representative numbers against these files
  only (it never reads the live game). `tools/src/baselineArchive.ts` is the generator; it reads the live content, so it only
  reproduces this archive when run at commit `82867b0`.
