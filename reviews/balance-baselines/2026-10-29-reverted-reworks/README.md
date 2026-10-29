# The identity reworks that were reverted (2026-10-29, DECISIONS #428)

Robert, 2026-10-29: "the knight, assassin, monk, and spellblade all need to be reverted. they all suck, they cant fight bosseses at
all, and they lost the plot of what i want them to be." These four classes are back to their cards from before the identity
reworks (commit `82867b0`, archived in `../2026-10-29-pre-identity-reworks/`). The Shaman's rework stays.

What is kept here, for reference only (nothing in the game reads it):

- `docs/`: the four rework documents (Guard/Riposte/Thorns, Preparation and knives, Imbue and Discharge, Martial Forms and Mastery)
  with their expansions, and their generated balance ledgers.
- `ledger-prices/`: the hand prices those ledgers were made from (TypeScript, renamed `.ts.txt` so nothing compiles them).
- The full card data of the reworks as they last stood is in git at commit `b80d803` (pools in `packages/content/src/v2/pools/`).
  Earlier dated snapshots: `../2026-10-29-knight-duelist-pass/`, `../2026-10-29-knight-half-block/`,
  `../2026-10-29-assassin-expansion/`, `../2026-10-29-spellblade-expansion/`, `../2026-10-29-monk-expansion/`.

The generic engine pieces the reworks added (Openings and Riposte, knives and Preparation, enchantments, forms) stay in
`packages/combat`, unused by any live card, with their engine tests.
