# Steam readiness

A checklist for taking Shattered Rifts from the web build to Steam. **Nothing here has been built yet**: it is a plan and a list of
decisions. Milestone M8 in `07_TECH_ARCHITECTURE.md` already names the stack (Electron + steamworks.js); this doc fills in the rest.
Anything that changes the economy, monetisation or core rules needs Robert's sign-off first (see `CLAUDE.md`).

Status key: **[ ]** not started · **[?]** needs a decision · **[x]** done

## 1. Shape of the Steam build

The Steam build is the web client wrapped in a desktop shell, talking to the same Cloudflare server for the Arena.

- [?] **Shell:** Electron + steamworks.js (the current plan) or Tauri. Electron is heavier but steamworks.js is mature and Pixi/WebGL
  behaves the same as in Chrome. Decide before M8.
- [ ] Load the compiled site from local files (no hosted page), so the campaign works offline.
- [ ] Steam-aware settings: fullscreen and windowed, resolution, controller-free (mouse only is fine for a card game), Steam Deck check.
- [ ] Remove or hide web-only things in the desktop build: Ko-fi links, supporter codes, the Pages/Cloudflare deploy notes. Decide what
  replaces them (see §5).
- [ ] Auto-update comes from Steam, not from the web deploy: keep the client and server **protocol versions** compatible (see §3).

## 2. What runs where

| Part | Where | Works offline? |
|---|---|---|
| Campaign, runs, rewards, combat | In the client (`packages/combat`, `campaign`, `content`) | Yes |
| Saved runs, settings | Local storage / files | Yes |
| Arena matches, matchmaking, ghost battles | Cloudflare Worker + Durable Objects (`apps/server`) | No |
| Saved decks (Vault), leaderboards | Cloudflare Durable Objects (SQLite) | No (local copy still works) |

The rules and wire protocol live in `packages/pvp`, which has no Cloudflare code. Only `apps/server` is tied to Cloudflare, so moving
hosts later would mean rewriting the server layer, not the game.

- [ ] Offline behaviour: the Arena, boards and ghosts show a clear "no connection" state; the campaign never needs the server.
- [ ] Decide what happens to saved Arena decks offline (today they are kept in the browser and synced when online).

## 3. Server and protocol

- [ ] **Version handshake:** the client sends its build number; the server refuses (with a readable message) a client too old to play
  safely. Steam updates roll out unevenly, so old and new builds will overlap.
- [ ] Check the Cloudflare cost model against a launch spike (Workers requests, Durable Object duration, WebSocket messages). Set
  billing alerts.
- [ ] Rate limits and abuse limits exist for boards and ghosts; review them under real traffic.
- [ ] Backups: Durable Object storage has no easy export today. Decide whether leaderboards and Vault decks need a periodic dump.
- [ ] A staging server for pre-release tests, separate from production.

## 4. Identity and accounts

Today a player is a **Vault code** (a guest) or a **Google sign-in**. Steam players will expect their Steam identity.

- [ ] **Steam sign-in:** the client asks Steam for an auth ticket; the server verifies it with Steam's Web API and maps it to an account.
  The Steam ID becomes the player id behind saved decks and rankings (hashed, as board ids are now).
- [?] **Linking:** can a Steam account be linked to an existing Vault code or Google account so a web player keeps their decks? Decide
  before launch; it is hard to add afterwards.
- [x] **Player names (decided, Robert 2026-10-25; DECISIONS #212):** on Steam the player's Steam persona name is their username, with no prompt. For any other way of signing in (web, Google, Vault code) we ask for a username and never use the account's real name or email. Usernames are unique (`checkUsername`, the board's `names` table), so the Steam persona name must go through the same claim: if it is taken (or not allowed) the player is asked for a different one. Steam names are not filtered by us, so run them through the same name rules before showing them on a board.
- [ ] Privacy: what is stored per player, and a way to delete it. Needed for the store page and for GDPR.

## 5. Monetisation and the web build

The plan is a **paid game ($7.99–$9.99)**, with the web campaign free and funded by Ko-fi. Robert must decide before M8:

- [?] What is free on the web vs paid on Steam (campaign length, Arena access, characters, Rift Tiers).
- [?] Whether Ko-fi supporter codes carry over to Steam, and whether any supporter benefit survives (no pay-to-win, ever: pillars).
- [?] Whether the web build keeps the Arena, or Arena is Steam-only.
- [ ] Price, regional pricing, launch discount, and Early Access vs full release.

## 6. Cheating and fairness

- [ ] **Server-verified runs.** Campaign progress on the boards is currently trusted from the browser (Robert's choice for friends).
  For a paid game with public rankings, the server should replay a run. The engine is pure and deterministic (seed + action log =
  identical game), so the client can send the seed and action log and the server re-plays it. Needs: an action-log format for whole
  runs, a size limit, and a replay time budget per run.
- [ ] Arena matches are already server-authoritative (the server plays the same engine and hashes states).
- [ ] Ghost matches are played on the server (already the case).
- [ ] Decide how far to go against save editing for single-player progress (usually: nothing).

## 7. Steamworks features

- [ ] **Achievements** (list, icons, unlock triggers from the event stream: first win, clearing a Tier, a character's first Legendary…).
- [ ] **Cloud saves** for runs, settings and the local Vault. Keep saves small and versioned; handle conflicts by newest-wins plus
  a "keep both" prompt.
- [ ] **Rich presence** (in a fight, in the Arena) and the Steam overlay (check that Electron's GPU mode lets it attach).
- [ ] **Leaderboards:** ours or Steam's. Ours already exist and work across web and Steam; Steam's would split them.
- [ ] Trading cards, workshop, controller support: not planned; list them as "not supported" on the store page.

## 8. Content, legal and disclosure

- [ ] **AI disclosure.** Steam requires developers to describe AI-generated content (and pre-generated vs live). Robert's account
  (2026-10-25): the **character and enemy models, the card art and the battle arenas** were built largely with AI, then cut out and
  edited by hand; everything else is drawn in code. Nothing is generated while the game runs, so only the *pre-generated* part applies.
  Done: the credits page and `CREDITS.md` say so. Still to do:
  - [ ] Fill in the Steamworks AI survey to match (pre-generated: yes; live-generated: no) and keep the wording identical to the credits.
  - [ ] Keep an **AI asset register**: for each group below, the tool and version, the date, where the prompts are, and the licence terms
    in force when it was made (screenshot or save them).
  - [ ] Confirm each tool's terms allow commercial use and Steam distribution.
  - [ ] Update the disclosure whenever AI art is added or replaced.
  - **Code:** the game's code was written with Claude Code (Anthropic). Steam's disclosure is about content players see and hear, and
    its guidance has treated coding aids as out of scope, but re-read the current survey wording and decide whether to mention it anyway
    (it costs nothing to say so in the credits).
  - **OpenAI terms (Terms of Use, effective 2026-01-01, saved by Robert 2026-10-25):** read for this project, not legal advice.
    - Ownership: Output belongs to the user ("to the extent permitted by applicable law"), and OpenAI assigns whatever rights it has.
      Nothing in the terms bans commercial use or selling a game that contains Output. Keep a dated copy of these terms.
    - Not unique: other users may get similar output, and the terms do not cover other people's output. Do not rely on any picture
      being exclusive to the game.
    - You must make sure Output does not infringe anyone's rights, and review it before use. This is the reason for the original-IP
      check (§8, below): no look-alike characters or frames from other franchises.
    - It is against the terms to **represent Output as human-made when it was not**. Disclosing the AI use (credits, Steam survey)
      keeps the game on the right side of that.
    - Other limits that matter here: no using Output to build a competing model, and no scripted bulk extraction of Output.
      Images made by hand in the ChatGPT interface are fine; do not automate it.
    - Copyright caveat: in the US, work made purely by AI is generally not protected by copyright, though human selection, editing and
      arrangement can be. Others may be able to copy the unedited AI art, so the code, the design and the edited composition are what
      is protected. Decide whether that matters for merchandise or a sequel, and ask a lawyer before the Steam launch.
    - The Valeria anchor image and every sheet came out of the same tool, so one set of terms covers all four groups.

  | Group | Where it lives | Prompts and sources | Tool and terms |
  |---|---|---|---|
  | Character (hero) models | `public/art/figures/hero-*.png` | `docs/hero-prompts.md`, `assets-src/heroes`, `assets-src/valeria` | ChatGPT image generation (OpenAI); Terms of Use effective 2026-01-01 (see below) |
  | Enemy models | `public/art/figures/*.png` | `docs/enemy-prompts.md`, `assets-src/enemies`, `assets-src/minions` | ChatGPT image generation (OpenAI); Terms of Use effective 2026-01-01 (see below) |
  | Card art | `public/art/cards/*.jpg` | `docs/art-briefs.md`, `docs/card-art/`, `assets-src/cards` | ChatGPT image generation (OpenAI); Terms of Use effective 2026-01-01 (see below) |
  | Battle arenas | `public/art/arenas/*` | `docs/arena-prompts.md`, `assets-src/arenas` | ChatGPT image generation (OpenAI); Terms of Use effective 2026-01-01 (see below) |
- [x] **Third-party art:** none remains (DECISIONS #184, `CREDITS.md`). If any is added again, check its licence for commercial use.
- [ ] **Original IP check** (golden rule 6): scan card names, text, frames and art for anything close to another franchise before the
  store page goes up.
- [ ] **Fonts and audio:** confirm the licence of every font, sound and music file used (the credits page currently lists nothing).
- [ ] Terms of service and privacy policy pages for the online features; age rating questionnaire (violence level: cartoon).
- [ ] Business side: Steamworks partner account, tax and bank forms, the app fee, company or sole-trader details, trademark of the
  title (the working title may not be final).

## 9. Store page and launch

- [ ] Final **title** and name check (the current name is a working title).
- [ ] Capsule art in the required sizes, 5+ screenshots, a trailer (30–60 s of real gameplay), short and long descriptions, tags.
- [ ] Store page up early (Steam wants it public for a while before release) and a wishlist push.
- [ ] A **demo** (the web campaign's first Rift Tier is a natural one) and a Steam Next Fest slot.
- [ ] Playtest through Steam (a closed beta branch) with the build that will ship.
- [ ] Support plan: where bugs are reported, a Discord or Steam discussions, a patch cadence.

## 10. Quality bar before launch

- [ ] Full tests green: `pnpm check`; Arena smoke (`pnpm pvpsmoke`) against staging; balance sims re-run (`pnpm sim`, `pnpm ghostsim`,
  `pnpm pvpbalance`), including the tripled Arena HP.
- [ ] Performance: 60 fps on a mid laptop and on Steam Deck, memory over a long run, cold-start time.
- [ ] Accessibility: text size, colour-blind safe indicators, reduce-motion (exists), a sound-off play-through.
- [ ] Localisation: decide the launch languages (English only is fine) and keep strings in one place if more are planned.
- [ ] Crash reporting and a log the player can send.

## Suggested order

1. Decide §5 (what is free vs paid) and the shell (§1): they shape everything else.
2. Server-verified runs (§6) and the version handshake (§3): these are the biggest technical items and also help the web build.
3. Steam sign-in and account linking (§4).
4. Achievements and cloud saves (§7).
5. Disclosures, legal, store page (§8, §9), then the playtest and demo.

Open questions for Robert are marked **[?]**; log each answer in `DECISIONS.md`.
