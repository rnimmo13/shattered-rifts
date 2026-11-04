# Shattered Rifts: Agent Guide

A deep, combo-heavy, **trap-driven** card-dueling game (working title). Web campaign first (free,
Ko-fi-funded) → Steam full game ($7.99–$9.99) with PvP later. Owner: Robert.

## Read before doing anything
| Doc | What's in it |
|---|---|
| `docs/08_COMBAT_V2.md` | **The current game**: Slay-the-Spire-style combat (Mana, intents, Barrier, allies, Traps), PvP variant, milestones C0-C6 |
| `docs/01_GAME_DESIGN.md` | LEGACY (old duel rules: Essence, slots, the Chain). Pillars in §2 still apply; the rules do not |
| `docs/02_CARDS.md` | LEGACY card list and DSL for the old engine; realms and flavour still apply. Real data: `packages/content/src/v2` |
| `docs/03_CAMPAIGN.md` | Characters, run structure (20 Rift Tiers, no acts since DECISIONS #531; "stage" survives in code and older docs), Resolve, Bank/Continue, Rift Tiers, Wardens, Boons, Vault & seasons |
| `docs/09_ROSTER.md` | **The Riftwalkers**: pool rules (shared toolkit, owned signatures), the classes, traits, engine pieces. `10_CARD_LIST.md` is the generated card list (`pnpm cardlist`) |
| `docs/11_PVP.md` | PvP: how a match works, the Cloudflare server (`apps/server`), running and deploying it |
| `docs/12_STEAM_READINESS.md` | Steam checklist: shell, accounts, verified runs, achievements, disclosures, store page (plan only, nothing built) |
| `docs/14_CARD_COSTING.md` | **Card costing**: the points each effect is worth (damage, Barrier, Exposed, draw, Mana, Bleed, Fate...), budgets by cost and rarity, worked from the five baseline classes. Use it to price new cards and rebalance the other classes |
| `docs/13_PROPOSALS.md` | Designs waiting on Robert's review, ideas kept for later, ideas decided against (check before proposing features) |
| `docs/DECISIONS.md` | Every design decision and rules clarification, with dates and reasons |
| `docs/BALANCE.md` | Sim results (first-player advantage, starter matrix, tier model, enemy difficulty) and open balance questions |
| `docs/04_VISUALS_AND_ANIMATION.md` | Card frame spec, tokens, board layout, **animation catalog** with timings |
| `docs/05_ART_PIPELINE.md` | AI art style bible, prompts, files, per-card art briefs |
| `docs/06_WEB_PLATFORM.md` | Ko-fi donations, supporter codes, roadmap page, saves, hosting |
| `docs/07_TECH_ARCHITECTURE.md` | Stack, repo layout, engine API, testing, **milestones M0–M7** |
| `ROADMAP.md` | Player-facing roadmap |

**Riftwalker ids are class names** (knight, engineer, hunter, trickster, assassin, shaman, monk, spellblade, necromancer, drunkard; DECISIONS #190, #371, #372), except that the class with id `assassin` is shown as the **Rogue** (#519). Players see the class name (`hero.name`), or an Ascendancy's once taken (`classNameOf`); the character names are kept in `Riftwalker.persona` for later (#372). Never use a character's display name as an id; old ids are read through `canonicalHero`.

## Golden rules
1. **The engine is pure and deterministic.** `packages/combat` has no DOM, no `Math.random`, no
   `Date`, no I/O. All randomness goes through the seeded PRNG in state. Seed + action log = identical game.
2. **Cards are data.** Behaviour lives in the effect DSL. Never special-case a card ID in engine code.
   A new behaviour = a new generic `op` + tests.
3. **The client never decides rules.** It renders `viewFor()` and animates `GameEvent`s; it only offers
   `legalActions()`.
4. **Animations follow the spec** in `04_…` (durations, beats, easing, speed setting). Gameplay never
   waits on animation state.
5. **Tests are part of the feature.** Every card gets a scenario test; every rule gets a rules test;
   property tests stay green. No milestone is done with red tests.
6. **Original IP only.** No Yu-Gi-Oh!/Konami (or any franchise) names, terms of art, card frame look,
   or text. Mechanics like monsters/spells/traps/chains are fine; their specific trade dress is not.
7. **Respect the pillars** (`01_GAME_DESIGN.md §2`). No pay-to-win, ever.

## Working agreements
- Work milestone by milestone (`07_TECH_ARCHITECTURE.md §6`). At the end of each, summarise what's
  playable, what's next, and any design questions.
- **Design doc conflicts or gaps:** pick the simplest option that's consistent with the docs, log it in
  `docs/DECISIONS.md` (date, question, decision, why), and flag it in your summary. Ask Robert before any
  change to the core rules, the economy or monetisation.
- Small, frequent commits with clear messages. Keep `CHANGELOG.md` updated for player-visible changes.
- When balance numbers change, update `02_CARDS.md` so the docs stay the source of truth.
- **Balance is checked with `docs/14_CARD_COSTING.md`, not bot sims** (Robert, 2026-10-28): price the card or deck by hand, and work out a
  rate for a new mechanic when one comes up (then add it to the guide). Run a sim only when Robert asks for one.
- Windows dev machine (VS Code terminal). Use cross-platform scripts (no bash-only syntax in npm scripts).

## Commands
```
pnpm install
pnpm dev          # web client
pnpm test         # all tests
pnpm lint         # ESLint (combat/content/campaign have purity rules: no Math.random, Date, DOM, node I/O)
pnpm typecheck    # tsc per package
pnpm check        # lint + typecheck + test + build
pnpm fight        # CLI fight on the sample ruleset (--hero knight|tinker, --enemies slime,cultist,summoner,warden, --seed X, --auto)
pnpm sim          # Combat v2 balance sim: starter decks (+ --draft N random reward cards) vs every encounter (see docs/BALANCE.md)
pnpm deploy:web -- --repo OWNER/NAME   # build + publish the compiled site to GitHub Pages (see tools/src/deploy.ts)
pnpm build
pnpm pvp:dev      # the PvP server locally (wrangler dev, ws://127.0.0.1:8787); `pnpm pvpsmoke` plays bot matches against it
```
Toolchain: Node 22, pnpm 11 (corepack), TypeScript 6.0 (see DECISIONS #39). Workspace packages export TS source.

## Current status
**2026-11-04 (DECISIONS #583):** web/desktop safe update prompts wait until all FightViews unmount; web polls an uncached version.json every minute/focus, native checks every five minutes and exposes downloaded patches. Refresh/restart also guard battle entry across async save/release boundaries. Single version/build details/update controls in Settings > About and updates; Account left / Settings right, no alpha banner/footer versions. Desktop save mode now in Settings. Mobile touch/overflow reviewed. Version 0.184.0; rules 76 unchanged.
**2026-11-04 (DECISIONS #582):** standalone Windows auto-updates through electron-updater 6.8.11 / existing NSIS builder 26.18.0 and public GitHub Releases. Website download and latest feed use Shattered-Rifts-Setup.exe. Startup/6-hour background checks, Settings progress/check/restart, install-on-quit, save-before-explicit-restart gating; Steam/dev/store builds excluded. Version 0.183.0. See apps/desktop/UPDATES.md for release/validation and unsigned-build limits. Existing <=0.182.0 installers must be replaced once to bootstrap updates.

**Desktop release agreement (#582):** when bumping a game version, keep web/desktop versions equal. After checks, commit and push, then run `pnpm desktop:release` (or publish already validated fresh artifacts with `node apps/desktop/scripts/release.mjs`); verify GitHub release assets and website deployment. A website deploy alone does not update installed copies. The publisher refuses dirty/unpushed sources, Steam-configured builds, mismatched checksums and replacement of published versions. Use a new version for fixes, never overwrite a published installer. GitHub workflows remain ignored pending token workflow scope; the local release command handles publishing.
**2026-11-04 (DECISIONS #581):** Soulreaper now gives 3 Barrier/Consume and a once-per-own-turn Reap for 4 + 2 per genuine consumption this fight, enabled only by consumption that turn. Generic harvest discipline and turnSettled trigger run after hand cleanup/companion actions; existing weakestFoe selector uses current HP with board-order ties. Reap is blockable non-attack damage and inherits no Attack multipliers. Base Grave Chill remains. Card pools unchanged. Rules 76, release 0.182.0; exact specification and hand examples appended to docs/ASCENDANCY_PASS_2026-11-04.md. A-tier remains a playtest target.
**2026-11-04 (DECISIONS #580):** twelve Ascendancies redesigned with generic data-driven combat disciplines; exact values, distinct identities, hand budgets and remaining playtest targets are in docs/ASCENDANCY_PASS_2026-11-04.md. Card pools remain unchanged by Robert's request. New counters are visible on combat trait chips; modifiers are included in damage previews and large-machine intents. RULES_VERSION 75; older mid-fight logs restart the encounter checkpoint rather than replay different rules. Version 0.181.0. Do not claim measured A-tier parity or run balance simulations without a request.
**2026-11-04 (DECISIONS #579):** shared Campaign/Arena require an account-wide online play claim (45-second server lease, 10-second heartbeat) stored atomically in the existing Vault DO. Gameplay writes and Arena sockets are fenced; run/replay saves use server revisions and server timestamps. Read-only browsing stays available. Desktop srgame://local is an isolated offline origin with local-saves/<owner>, excluded from shared sync, Auto-Cloud and Steam unlocks. pnpm play:smoke checks local Worker protocol admission without playing bot matches. See docs/PLAY_SESSION_OWNERSHIP.md. Google/Steam/mobile provider linking is still a prerequisite for cross-provider identity. Version 0.180.0.
**2026-11-04 (DECISIONS #578):** desktop Settings Quit and atomic backed-up saves implemented; Steam main-process SDK/ticket auth, server provider/session verification, per-account saves and 18 achievements are ready. Auto-Cloud uses ShatteredRifts/saves/{64BitSteamID}/save-v1*.json under WinAppDataRoaming. Robert has no Steam app ID yet; never claim live Steam login, unlocks or cross-device sync tested/enabled. Steamworks setup in apps/desktop/steam/README.md. Standalone remains available. Version 0.179.0.
**2026-11-03 (DECISIONS #577):** Windows Electron prototype in apps/desktop. pnpm desktop:dev / desktop:package / desktop:pack / desktop:smoke build a separate apps/web/dist-desktop renderer; ordinary web dist/deploy remain independent. Local srgame://app origin, bundled assets, isolated sandbox, stable AppData/ShatteredRifts profile, fullscreen/window size persistence, desktop-only offline NameGate option. Steamworks and file-based Steam Cloud saves remain pending. See apps/desktop/README.md. Version 0.178.0.
**2026-11-03 (DECISIONS #576):** normal campaign enemies now gain constant +40 HP / +5 damage percentage points per tier (90% at I to 850% HP / 185% damage at XX). Removed hardening/category damage multipliers, Swarming adds and opening Exposed; bounded phase Might, first-hit and opening penalties; Blood Rites is fixed starting Might. Economy and authored encounter kits remain. Dedicated ghost curves and Arena remain. Hand analysis in BALANCE.md; endgame difficulty still needs player testing. Version 0.177.0.
**2026-11-03 (DECISIONS #575):** campaign Echoes and ghost Wardens now use their own linear curve: class base HP x (2.2 + 0.2 per tier after IV), plus an additive saved-Max-HP bonus capped at 50% of class base HP; damage 100% + 3 percentage points per tier after IV. No Arena-HP switch, extra Warden's Fury or ghost-specific Faltering. Normal Omens still apply. Campaign selection is uniform across nearby eligible decks instead of the upper half by wins; Arena is unchanged. Hand examples are in `docs/BALANCE.md`, with full-tier and encounter tests.
**2026-11-03 (DECISIONS #574):** the approved campaign rebalance is implemented; exact numbers, hand prices and target chart are in `docs/BALANCE_PROPOSAL_2026-11-03.md`. Engineer supports freely mixed small summons, large machines and personal weapons; Foreman is now Artillerist (old ids remain readable). New cards: Weapon Bench, Rotary Cannon, Measured Conviction, Spirit Pact, Morning After, and the consumed Flame Echo token. The class-wide card-grouping system remains removed (#453). Echo encounters are a separate later pass. Scenario tests check implementation; A-tier ratings still require campaign playtesting, and no balance simulations were requested.
**Combat v2 (Slay-the-Spire-style) replaced the old duel on 2026-10-23** (DECISIONS #86-90, design in `docs/08_COMBAT_V2.md`).
**Roster of 9 (2026-10-23, DECISIONS #95-105; Mire added with Doom, tier-3 mechanics, tips and a Learn page):** Maren, Rivet, Kesh, Vesper + Quill (Sleeve Knives/Seared/discard), Ilvane (totems), Solen (stances), Obsidia (id `spellblade`; Arcana/Sharpen), Mire (Doom/Thralls/Ashes); names are original, see DECISIONS #99; pools belong to a character (`CardDef.hero`), ~35-40 cards in three lanes each; engine gained choices (`pending`/`pick`), scaling amounts, Auras (`power` op) as triggers, totems (`channel`/`evoke` ops), stances, Arcana (`stars` op), sharpen (`forge` op). Next: balance, art for the new four, enemy counterparts, stretch characters Cinder and Mire.
**2026-10-28 (DECISIONS #362-364):** Legendary cards are put away (they are Rares, `SHELVED_LEGENDARIES`); Valeria (`knight`) is rebuilt as the Slay the Spire 2 Ironclad shape with original names, no Devotion. Robert will change her cards himself; the "no copied card effects" rule is waived for her only. Sylas, Obsidia, Dorian and Ilvane (now the Shaman, id shaman) were then rebuilt the same way on the Silent, the Regent, the Necrobinder and the Defect (DECISIONS #368-371): these five classes are the balancing baselines.
**2026-10-29 (DECISIONS #414-#419, docs/BASE_CLASS_REWORKS.md):** the five Slay-the-Spire-copy classes got their own identities, after the old versions were archived in `reviews/balance-baselines/2026-10-29-pre-identity-reworks/`: Knight (Guard, Riposte, Thorns), Assassin (Preparation and embedded knives), Spellblade (Imbue/Discharge on a two-position blade), Shaman (three totem positions, one command a turn, Spirit), Monk (Martial Forms and Mastery). Each has a contract and a hand-priced ledger in `docs/reworks/`; new rates in the costing guide §15. They are the new balancing baselines. **Same day, DECISIONS #428: the Knight, Assassin, Spellblade and Monk reworks were reverted** (back to their earlier cards; archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`); only the Shaman's rework (elements, totems, Trinity, Forks) is live.
**2026-10-30 (DECISIONS #450-#454):** the Shaman pool was trimmed to 88 reward cards; the Assassin got Defer (a card waits a turn and comes back 1 cheaper); the Knight's trait is now Mana Reserves (unspent Mana is kept as Reserves, a second pool shown beside Mana, up to Max Reserves 3; cards spend Mana first) with 11 new original cards that read, fill and raise Reserves, hold Barrier or pay blood; the old card-grouping system was removed.
Done: **C1** engine (`packages/combat`: pure, seeded, events, intents, allies, Traps, tiers, PvP mode, greedy bot) ·
**C2** content (`packages/content/src/v2`: 4 Riftwalkers, ~80 cards with "+" upgrades, 12 companions, 26 encounters incl. Wardens and
Vorthax) · **C3** the side-to-side fight screen (`apps/web/src/fight`, route `#/fight`) · **C4** campaign Run v2 (`packages/campaign`,
route `#/run`: map, HP carries between fights, rewards, shrine rest/upgrade/remove, merchant, event, Resolve, Bank/Continue) and the old
Essence/slot/chain engine, AI and UI were deleted. Next: **C5** (more enemies/Boons/Warden signature cards/upgrade polish/art) and **C6** (PvP on the same
engine). Balance is a first pass (`pnpm sim`, docs/BALANCE.md); first-player advantage is a PvP question for C6.
Deploy with `pnpm deploy:web -- --repo rnimmo13/shattered-rifts` (live: https://rnimmo13.github.io/shattered-rifts/).
