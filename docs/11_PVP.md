# PvP: how it works and how to run it

First playable version (friends test). Two players, each with a banked deck, play one match on the real combat engine
(`docs/08_COMBAT_V2.md §8`). Matches are found from a queue, or by sharing a room code.

## What a player does

1. Play a run. The deck is saved by itself (decision #219): after every finished stop on the map (every fight once its reward is taken, and every shop, shrine and event) a copy of the deck goes into the **Vault** and the run carries on, replacing that run's earlier copy (so a run uses one of the 10 slots; when the Vault is full the player is told once per stage and can free a slot on the Saved decks page). The run bar shows "Arena deck: Tier 2 · Stage 1/3", and the first time a banner explains that other players may face the deck as a ghost and that if the run collapses it leaves the Vault (it can no longer be taken to the Arena) but stays as a ghost others may face (decision #231). The Vault is kept in this browser and also on the server under a **Vault code** (see below). The Arena only offers banked decks: with an empty Vault the screen says so and points to a New Run (decision #167). **Test build only:** the run bar's **Save deck** button also works between stages: after stage 1 or 2 is cleared (`apps/web/src/run/deckSave.ts`, flag `MID_RUN_SAVES`, decisions #168 and #172), so the Arena can be tried without a full run. Remove that flag before release.
2. Title screen → **Arena** (`#/arena`, also `#/pvp`). Pick a name (unique: no two players share one; it is claimed on the server when a match is looked for) and a deck.
3. **Find a match** (the queue), **Make a room for a friend** (shows a 5-letter code to send), or **Join a room** (type a code).
4. **Who goes first?** Both players are asked: *I will go first* or *I will go second (+60 HP)*. Different answers: everyone gets what they asked for. The same answer (or no answer in 20 s): the server flips a coin, and both players watch it spin and land on the portrait and name of whoever goes first.
5. **A match is the best of three games** (first to two wins). After a game the player who lost it chooses who goes first in the next (a coin decides if they do not answer in 30 s); a resignation or two missed turns end only that game, and leaving for over a minute forfeits the match. A match is recorded on the leaderboard once, when it is decided.
6. Play. Turns alternate; each turn has **75 s**. Two missed turns in a row lose the game. **Resign** is in the top bar.
   Closing the tab is not a forfeit for 60 s: reload the page and join the same room to come back.

## How it is built

```
browser (apps/web/src/pvp)  ──WebSocket──►  Cloudflare Worker (apps/server)
  PvpScreen, PvpSession                      worker.ts       routes /pvp/*
  FightView (pvp link)                       Matchmaker DO   the queue (one object)
                                             MatchRoom DO    one object per room code
                     both import:  packages/pvp  (rules, deck checks, queue pairing: pure, tested)
```

- **Lockstep with a referee.** Both browsers run the real engine from the same seed and the two decks. A player sends only
  "my move". The room checks it (their turn? legal? the right move number?) by running the engine too, then tells BOTH
  browsers the accepted move and a hash of the state after it. The engine is deterministic, so the two screens stay in step;
  a hash that differs shows an out-of-step warning.
- **Seats.** Who moves first is settled by the question above (`packages/pvp/src/order.ts`); seat a moves first, and seat b
  moves second with `SECOND_PLAYER_HP` (60) more HP and max HP, applied in `setupFor` so both browsers and the server agree. The
  engine's own second-player head start (+1 Mana, +1 card on their first turn) is kept. You always stand on the
  left; the opponent (mirrored, facing you) on the right. The arena is picked from the seed, so both see the same one.
- **Reconnecting.** The room saves its decks, seed and move list; a player who joins again is sent the moves so far (replayed
  silently) and carries on.
- **Matchmaking** (`packages/pvp/src/queue.ts`): longest-waiting first, the closest Rift Tier, within 1 tier until someone has
  waited 20 s, then anyone.
- **Deck check** (`deck.ts`): a real Riftwalker, 8 to 80 real cards, within the copy and Legendary limits. The server cannot
  know a deck was really banked, only that it is legal.

### Known limits of this version

- **Hidden information is not hidden.** Each browser holds the whole match state, so a modified client could read the
  opponent's hand. The server still decides every move, so nobody can break the rules. Fix later: the room keeps the state and
  sends each player only their own view (`viewFor` / `eventsFor` already exist for it).
- No accounts: the player id is random per tab, and the **Vault code** is the only key to the saved decks (whoever has it can read and change that Vault). No ratings, history or leaderboards.
- A match never changes the Vault: losing, forfeiting or disconnecting costs no deck (decision #166). Decks leave only when the player removes them or replaces one in a full Vault.
- Boons, Potions and run HP do not come into PvP (a banked deck is cards only).

## Running it

```
pnpm pvp:dev          # the server on ws://127.0.0.1:8787 (wrangler dev, local Durable Objects)
pnpm dev              # the web client; in dev it connects to the local server by itself
pnpm pvpbalance       # bot-vs-bot: does moving first win? (docs/BALANCE.md)
pnpm pvpsmoke         # plays whole matches against the local server with two bots (queue, room, reconnect, refusals)
```

To try it alone: open `#/pvp` in two tabs (each tab is its own player), make a room in one, join its code in the other.

## Saved decks page

`#/decks` (`apps/web/src/pvp/SavedDecksScreen.tsx`, `DeckReport.tsx`): each saved deck as a report. Decks have no names: they are told apart by Riftwalker, Rift Tier and the date saved. Cards are sorted by rarity, best first, then dearer first, with repeats stacked (`deckLayout.ts`, tested). The Boons the run held are saved with the deck (`VaultDeck.boons`, kept by the server too) and shown on the report; **they are not used in a match** (decision #236, reversing #171: `Entry.boons` is still checked by `checkEntry`, but `setupFor` gives both seats none). The Arena lists the decks in short (tier, date, card count, rarity tally, Boons) with a link here; removing a deck is only done on this page, behind a confirmation. The Vault holds 10 decks (`V2_DECK_RULES.vaultSlots`, decision #171), and both screens say how many are used.

## The Vault online

Each browser makes a random **Vault code** (16 letters and digits, shown `XXXX-XXXX-XXXX-XXXX`) the first time it needs one and keeps it in
localStorage (`sr-vault-code`). The Arena screen's **Vault code** box shows it, copies it, and loads another code, which replaces the
browser's list with that Vault's decks so the same decks appear on another device.

- The server keeps one **Vault** Durable Object per code (`apps/server/src/vault.ts`, a SQLite table of decks). The object is named by a
  SHA-256 of the code, so the code is not stored. Routes: `POST /pvp/vault/list|bank|drop` with a JSON body `{code, ...}` (the code goes
  in the body, never the URL).
- The rules are the shared pure ones in `packages/pvp/src/vault.ts` (slots, banking, cleaning what arrives: every deck goes through
  `checkEntry`). The server accepts only legal decks, at most 5, ids of letters, digits and `:.~-`.
- The browser copy always works: when the server cannot be reached the Arena uses the local list and says so. On opening the Arena (and
  after banking) the two are merged: what the server lacks goes up, what does not fit stays local (`vaultSync.ts`). A deck removed while
  offline comes back at the next sync.
- This is a Durable Object per Vault rather than the D1 database `shattered-rifts-db`: it needs no setup or migration by hand and
  cannot break a deploy. Moving to D1 (to list or search decks across players) is possible later if accounts arrive.

## Signing in (Google)

An account owns a Vault too, so decks follow the player without a Vault code. `apps/server/src/auth.ts`:

- `GET /auth/google/start` → Google (scope `openid` only: no email, no name) → `GET /auth/google/callback`. A state cookie (`sr_oauth`, 10 min) ties
  the answer to the browser that asked. The server exchanges the code for an id token and reads only the permanent user id (`sub`).
- The account id is `SHA-256("google:" + sub)`; nothing else about the person is stored. The Vault object is named by a further hash of it.
- The session is a signed cookie (`sr_session`: HttpOnly, Secure, SameSite=Lax, 30 days; HMAC-SHA256 with `SESSION_SECRET`). `GET /auth/me`
  says who is signed in; `POST /auth/logout` clears it. The Vault routes use the account when the body has no `code`.
- Because the session is a cookie, only the game's own address can sign in (shatteredrifts.app). The GitHub Pages copy keeps the guest Vault code.
- On sign-in the browser's decks are uploaded to the account (the same sync as for a code). Guest decks that are only under a Vault code
  are not pulled in automatically: load the code first, then sign in.
- **Secrets** (Cloudflare → the Worker → Settings → Variables and Secrets; never in the repo): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `SESSION_SECRET` (a long random string). Without all three, `/auth/me` says `available: false` and no sign-in button is shown.
  Google Cloud: an OAuth client (Web application) with the redirect URI `https://shatteredrifts.app/auth/google/callback`.
- Locally: `wrangler dev --var SESSION_SECRET:x --var GOOGLE_CLIENT_ID:x --var GOOGLE_CLIENT_SECRET:x`. Discord is not built yet.

## Putting it online (Cloudflare)

`wrangler.jsonc` at the repo root declares the Worker (`apps/server/src/worker.ts`), the three Durable Object classes (queue, match room, Vault) and
their migrations, and serves `apps/web/dist` as static assets, sending only `/pvp/*` to the Worker. The existing Cloudflare
Workers Build (build `pnpm install && pnpm --filter @sr/web build`, deploy `npx wrangler deploy`) therefore deploys the
server with the site. Durable Objects with SQLite storage are available on the free plan.

- A page served by that Worker needs no setting: it connects to its own address.
- The game lives at https://shatteredrifts.app, and the server is the same Worker. `PRODUCTION_SERVER` in
  `apps/web/src/pvp/config.ts` points every production build (including the GitHub Pages copy) there; a build can override it
  with `VITE_PVP_SERVER`, and a player can type another address into the **Server** box on the Arena screen (remembered).
- The Worker only accepts browsers from the game's own addresses (`worker.ts`, `ORIGINS`); add a domain there if the game moves.

## Leaderboards (weekly and monthly)

`#/board` (`apps/web/src/pvp/LeaderboardScreen.tsx`) shows two boards for **this week** (Monday 00:00 UTC) or **this month** (the 1st):

- **Arena:** ranked by wins (then fewer losses, then who got there first). Each row shows the win-loss record and the Riftwalkers the player used, with their own records. Decks are not shown.
- **Campaign:** each player's furthest run, ranked by stages cleared in all (three to a Rift Tier; a tie goes to whoever got there first), with the character.

How it works: one Durable Object (`Leaderboard`, `apps/server/src/board.ts`, named `main`, SQLite) holds the Arena results and run progress. The rules (periods, ranking, names) are pure in `packages/pvp/src/board.ts`. A match is recorded by the match room when it ends with a winner and at least two moves, for entries that carry a `who` (a hash the browser gets from `POST /pvp/board/id`, derived from the account or Vault code and never shown). A run reports its progress from the run screen when it clears a stage (`POST /pvp/board/run`, the id derived by the server from the session or Vault code). Names are the Arena name, cleaned and with a small block list; no email or other personal data is stored. Limits: a winner beats the same opponent at most 3 times a day on the board; run progress only moves forward one stage at a time and a run first seen beyond its first stage is not believed. Results older than 70 days are cleared. Campaign progress comes from the browser, so it can be faked (verifying runs on the server is a later step).

## Ghosts

**Ghost decks page** (`#/ghosts`, `GET /pvp/board/ghostdecks`): every deck that can be met as a ghost, newest first: whose, Riftwalker, Rift Tier and stage, records. Never the cards or Boons.

A **ghost** is a deck that has been played in the Arena, piloted by the computer, so a player with nobody to play still has a fight.

- **Where decks come from:** every Arena match between two people registers both decks (owner, Riftwalker, cards, Boons, Rift Tier and stage) in the `ghosts` table of the Leaderboard Durable Object (`apps/server/src/board.ts`). A deck is the same ghost every time its owner plays the same cards. Only decks from the last 30 days are offered.
- **Who you face:** `pickGhost` (`packages/pvp/src/board.ts`) takes the decks that are not yours, ranks them by wins (people's wins plus its own as a ghost, then win rate) and picks one at random from the **upper half**.
- **How to ask:** the Arena lobby has **Fight a ghost**; and after 20 seconds in the queue (`QUEUE_WIDEN_MS`) the waiting screen offers **Fight a ghost** too. Both send `{type:'ghost'}` on the queue socket; the matchmaker asks the board for a ghost, sets up a room with it (`POST /ghost/CODE` on the room object) and answers `matched` with `ghost: true`. The player then joins that room like any other.
- **Who plays it:** the match room itself. The ghost sits in the second arrival seat, answers who-goes-first at random, and when it is its turn the room (an alarm after 0.8 to 1.5 s, so it plays like someone thinking) asks `chooseSmartAction` for a move and sends it to the player like any other move. The match is authoritative on the server, so results cannot be faked. The start message says which seat is the ghost (`ghost`), and its name is "<owner>'s ghost". The ghost's owner's leaderboard id never leaves the server.
- **The pilot:** `packages/combat/src/smartBot.ts`, a beam search over a whole turn (the greedy bot looks one card ahead) that also values Barrier in PvP against what could come back. `pnpm ghostsim` measures it against the greedy bot (about 66% on starter decks).
- **What counts:** a match against a ghost does **not** count on the Arena board. It is recorded on the ghost boards: each ghost's wins and losses, and each person's wins and losses against ghosts (a person's wins against ghosts are capped at 15 a day). Leaderboards page, **Ghosts** tab: "Ghosts" (by wins, with whose deck and which Riftwalker) and "People against ghosts". The same rules for the minimum length of a match apply as for the Arena board.
