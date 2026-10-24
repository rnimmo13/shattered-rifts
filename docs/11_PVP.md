# PvP: how it works and how to run it

First playable version (friends test). Two players, each with a banked deck, play one match on the real combat engine
(`docs/08_COMBAT_V2.md §8`). Matches are found from a queue, or by sharing a room code.

## What a player does

1. Clear a run and choose **Bank**: the deck goes into the **Vault** (this browser, 5 slots; a full Vault asks which deck to
   give up). Or skip the run: every Riftwalker's starting deck is always offered, so a match can be tried at once.
2. Title screen → **Duel a player** (`#/pvp`). Pick a name and a deck.
3. **Find a match** (the queue), **Make a room for a friend** (shows a 5-letter code to send), or **Join a room** (type a code).
4. **Who goes first?** Both players are asked: *I will go first* or *I will go second (+10 HP)*. Different answers: everyone gets what they asked for. The same answer (or no answer in 20 s): the server flips a coin, and both players watch it spin and land on the portrait and name of whoever goes first.
5. Play. Turns alternate; each turn has **75 s**. Two missed turns in a row forfeit. **Resign** is in the top bar.
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
  moves second with `SECOND_PLAYER_HP` (10) more HP and max HP, applied in `setupFor` so both browsers and the server agree. The
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
- No accounts: the player id is random per tab and the Vault lives in the browser. No ratings, history or leaderboards.
- Boons, Potions and run HP do not come into PvP (a banked deck is cards only).

## Running it

```
pnpm pvp:dev          # the server on ws://127.0.0.1:8787 (wrangler dev, local Durable Objects)
pnpm dev              # the web client; in dev it connects to the local server by itself
pnpm pvpbalance       # bot-vs-bot: does moving first win? (docs/BALANCE.md)
pnpm pvpsmoke         # plays whole matches against the local server with two bots (queue, room, reconnect, refusals)
```

To try it alone: open `#/pvp` in two tabs (each tab is its own player), make a room in one, join its code in the other.

## Putting it online (Cloudflare)

`wrangler.jsonc` at the repo root declares the Worker (`apps/server/src/worker.ts`), the two Durable Object classes and
their migration, and serves `apps/web/dist` as static assets, sending only `/pvp/*` to the Worker. The existing Cloudflare
Workers Build (build `pnpm install && pnpm --filter @sr/web build`, deploy `npx wrangler deploy`) therefore deploys the
server with the site. Durable Objects with SQLite storage are available on the free plan.

- A page served by that Worker needs no setting: it connects to its own address.
- The game lives at https://shatteredrifts.app, and the server is the same Worker. `PRODUCTION_SERVER` in
  `apps/web/src/pvp/config.ts` points every production build (including the GitHub Pages copy) there; a build can override it
  with `VITE_PVP_SERVER`, and a player can type another address into the **Server** box on the Duel screen (remembered).
- The Worker only accepts browsers from the game's own addresses (`worker.ts`, `ORIGINS`); add a domain there if the game moves.
