# Player balance data (DECISIONS #714)

Balancing from bots and hand pricing only gets close. This is how real players' games are kept and read, so playtests show what is actually strong, what players use for big damage, where runs die and which builds cannot deal enough.

## What is kept

All of it only from online play, tied to a one-way hashed account id (never a name or email), for **30 days**. Offline desktop play is never sent. Players are told in Settings ("Game data").

| What | When | Where (Leaderboard DO "main") |
|---|---|---|
| **Every Campaign fight**: build, tier, encounter, map node and floor, won/lost, its replay (seed and every move), and its numbers (see below) | each fight's result screen, in the same request that keeps the player's own ten fights (no extra server traffic) | `balance_fights` (30 days, at most ~1.5 GB of text, oldest first) |
| **Arena games**: exact decks, winner, turns, hero damage, evidence, and the replay (player names taken out on export) | each finished game | `balance_games` (30 days) joined to `replays` on export |
| **Campaign deck snapshots** with every **deck choice** of the run: card rewards (offered and taken, or skipped), cards bought, removed or upgraded | each run save that changed something | `balance_campaign` (30 days) |

Fight numbers (`FightStats`, packages/pvp/src/fightStats.ts) are worked out by replaying the fight with the engine, counted from the hits themselves (a Barrier wearing off, or the enemy hurting itself, is not damage dealt). The player's machine works them out when the fight is saved, so they stay readable after the rules change; the server keeps only their known fields, and the report works them out again from the replay whenever today's rules can play it: turns, HP at start and end, HP the player's own cards cost them, damage dealt in all and each own turn, damage and plays by card, damage on no card (companions and Auras as the turn ends, Bleed and Traps on the enemy turn), and the biggest turn with the cards that made it.

Limits: 300 fights a day per account, 400 per network address; a fight's replay at most 300,000 characters.

## Reading it

```
BALANCE_ADMIN_TOKEN=<owner secret> pnpm balance:players -- --server https://<worker> --out player-report
pnpm balance:players -- --input player-report --out player-report   # again, from the saved pull
```

It writes `fights.json`, `arena.json` and `campaign.json` (the pull) and `report.md`:

- **Builds by Rift Tier**: fights, players, win rate, turns, damage per turn, kill pace (share of the enemies' HP taken a turn) and HP lost.
- **Where players lose**: encounters by loss rate, how much enemy HP was left standing, and which builds lost.
- **Builds that lack damage**: slowest kill pace, how many fights ran 8+ turns, enemy HP left when they lost.
- **Cards**: damage, plays, damage per play, win rate when in the deck, how often a card was in a fight's biggest turn.
- **Biggest single turns**: the burst players found, with the cards that made it.
- **Card rewards**: pick rates when offered, and skips.
- **Arena**: builds' win rates in real games, and damage by card from the replays (games under today's rules).

A fight under older rules cannot be replayed, but its numbers sent with it still count. The older tools still work: `pnpm balance:arena`, `pnpm balance:campaign` (exact decks), `pnpm fight:check <link>` (one fight hit by hit).

To try the report without players: `pnpm --filter @sr/tools exec tsx src/playerReportSample.ts <dir>` makes a bot-played sample in the export's shape.

## Known gaps

- Damage from companions and Auras is counted as "on no card", not credited to the card that summoned or played them.
- A fight a player forfeits is not kept (the result screen never shows).
- Shop and event offers that were not bought are not recorded, only what was taken.
