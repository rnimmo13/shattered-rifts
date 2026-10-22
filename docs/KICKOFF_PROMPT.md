# Kickoff prompt for the build agent

Paste this into Claude Code from a VS Code terminal opened in `D:\Code\ShatteredRifts`:

---

You're the lead developer on **Shattered Rifts**, a deep, trap-driven card-dueling game. It ships first
as a free web campaign (Ko-fi-funded) and later as a paid Steam game with PvP. The full design is
already written, and your job is to build it.

**Step 1: Read, then report back before writing code.**
Read `CLAUDE.md`, then every file in `docs/` in numeric order, then `ROADMAP.md`. Then give me:
- a 10-line summary of the game in your own words (so I know you understood the rules, especially the Chain and traps),
- any contradictions, gaps or rules you think are ambiguous or will be painful to implement, with your proposed resolution for each,
- your plan for M0 and M1 as a checklist.
Wait for my go-ahead after this report.

**Step 2: M0 (project setup).** Check my environment first (node, pnpm, git versions; install pnpm via corepack if it's missing).
Set up the pnpm monorepo exactly as `docs/07_TECH_ARCHITECTURE.md §2` describes, using current stable
versions of each library: TypeScript strict, ESLint + Prettier, Vitest, a Vite + React app that renders a
placeholder title screen, `.gitignore`, `CHANGELOG.md`, `docs/DECISIONS.md`. `git init` and commit.

**Step 3: M1 (engine core + CLI duel).** Build `packages/engine` and the parts of `packages/content`
it needs:
- Zones, turn flow, Aether (including held Aether on the opponent's turn), Resonance, mulligan, fatigue.
- Units and combat, spells, traps, relics, rifts, and **the full Chain** with response windows,
  priority, fizzles, negation and the passive trigger queue, exactly per `01_GAME_DESIGN.md §3.6`.
- The `pending`-prompt model, the seeded PRNG, `GameEvent` output, and `viewFor()` redaction.
- The effect DSL interpreter, with every common from the four starter Grimoires implemented as data.
- A scenario test builder, plus tests for every rule and every implemented card, plus a seed-replay determinism test.
- `pnpm duel`: a playable text-mode duel in the terminal against a random-legal-move AI, using two starter Grimoires.

Commit at each meaningful step. At the end of M1, show me the test results and a short transcript of a
CLI duel where a trap springs mid-chain. Then stop and summarise what's next (M2).

Rules for the whole project: follow `CLAUDE.md`, keep the engine pure and deterministic, keep cards
as data, never use Yu-Gi-Oh! names or trade dress, and log design decisions in `docs/DECISIONS.md`.
Ask me before changing core rules, the economy or monetisation.
