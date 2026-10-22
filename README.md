# Shattered Rifts

*Working title.* A deep, combo-heavy, trap-driven card-dueling game. Walk between shattered worlds,
defeat their Wardens, and bind their power into your Grimoire.

- **Now:** a free web campaign (funded by Ko-fi donations)
- **Goal:** a full game on Steam with PvP and weekly tournaments

## Start here
- `CLAUDE.md`: guide for AI coding agents (and humans)
- `docs/01`–`07`: the complete design (rules, cards, campaign, visuals & animation, art, web platform, tech)
- `docs/KICKOFF_PROMPT.md`: the first prompt to give Claude Code
- `ROADMAP.md`: the public roadmap

## Setup (Windows)
1. Install **Node.js LTS** (22.12+) and **Git**.
2. In a terminal: `corepack enable` (provides the pnpm version pinned in `package.json`).
3. `pnpm install`

## Commands
```
pnpm dev          # web client (Vite)
pnpm test         # all tests (Vitest)
pnpm lint         # ESLint
pnpm typecheck    # tsc in every package
pnpm build        # production build
pnpm check        # lint + typecheck + test + build
pnpm duel         # play a duel in the terminal vs the AI
pnpm sim          # balance simulation (see docs/BALANCE.md)
pnpm test:property # 10,000 random games with invariant checks
```

## Layout
`packages/engine` (pure rules engine) · `packages/content` (cards as data) · `packages/ai` · `packages/campaign`
· `apps/web` (Vite + React client) · `tools` (CLI duel, sims, dev tools)

Recommended VS Code extensions: ESLint, Prettier, Vitest, Claude Code.
