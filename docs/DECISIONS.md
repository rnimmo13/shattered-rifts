# Design Decisions Log

Format: **date · question → decision · why**. Newest at the bottom of each section. Items marked
**(Robert)** were decided or approved by Robert. Everything else is a dev call made under the "simplest option
consistent with the docs" rule and can be revisited.

---

## Campaign & PvP model (redesign, 2026-10-22)

1. **2026-10-22 · Collection campaign or run-built decks? → Run-built decks (Slay-the-Spire style)** (Robert).
   Each run starts from a 20-card character starter and grows by picks and shops. The persistent collection,
   crafting (Rift Forge) and the duplicate→Shards economy are removed. *Why:* the meaningful choices come every
   few minutes, every deck is different, and it makes a natural entry ticket for PvP.
2. **2026-10-22 · Bank or push → After a full clear, either Bank the deck (to the Vault, 5 slots) or Continue to the
   next Rift Tier. If you reach 0 Resolve, the run and its deck are lost** (Robert). *Why:* push-your-luck is the
   central tension.
3. **2026-10-22 · Does one loss end the run? → No. Keep Resolve (3 per run): a lost duel costs 1, an Elite or Warden
   costs 2, and you retry the node. Clearing a loop restores +1 (max 3)** (Robert). *Why:* card duels have more
   variance than StS fights. One unlucky hand shouldn't erase 90 minutes.
4. **2026-10-22 · Deck size → Minimum 20, no maximum. Copy limits stay: max 3 per card, Legendary/Mythic max 1 each,
   and at most 2 Legendary+Mythic cards per deck** (Robert approved the floor; the Legendary cap is a dev call
   for PvP balance). *Why:* thin decks dominate one-on-one duels. Fatigue and dilution naturally limit big decks.
5. **2026-10-22 · Reward after each Warden → "Warden's Gift": pick 1 of 3 from a signature card, a Boon, and deck
   surgery (remove / transform / Temper)** (Robert: "after each boss").
6. **2026-10-22 · Characters → One named character per realm, each with a starting passive ("Sigil") and a
   20-card starter.** Ser Maren Ashcourt (Aurelion), Rivet (Nexus-9), Kesh the Unfed (Wyldmaw), Vesper
   Nightlace (Umbral, unlocked by first defeating Nyxara). Names are placeholders pending Robert's taste.
7. **2026-10-22 · PvP gate → PvP unlocks after the first full campaign clear** (Robert).
8. **2026-10-22 · Season → Weekly. Vault decks are wiped Monday 00:00 UTC. The Weekend Rift Tournament runs Friday
   18:00 – Sunday 23:59 UTC, with one registered (locked) deck per player. Casual play is open all week** (Robert).
   Runs still in progress at the wipe carry over. Only the Vault is wiped.
9. **2026-10-22 · Live vs ghost PvP → Both. Vault decks are uploaded as "ghosts" that other players fight with
   the AI piloting them. Live matches happen when two humans are queued** (Robert). *Why:* a small player base
   can't fill weekend-only live brackets.
10. **2026-10-22 · Leaderboard → Weekly. Score = live wins + ghost wins (wins your ghost earns while you're
    away). Tune later** (Robert).
11. **2026-10-22 · Brackets by tier, or one pool? → One shared pool. Each deck's Tier shows as a badge.**
    *Why:* this replaces the tier-bracket idea. Robert's goal is that a one-clear deck *can* beat a five-clear
    deck, and splitting a small beta into brackets empties each one. If grinding wins too much, add
    tier-weighted scoring.
12. **2026-10-22 · How do we stop "most hours wins"? → Power plateau:** Boons are run-only and never enter PvP. At
    most 5 Tempered cards per deck. The Legendary cap from (4). Deeper tiers mainly buy *choice* (more options,
    rerolls, removal) and cosmetics, not raw stats. Signature cards are sidegrades budgeted on the normal rarity
    premium. *Why:* Robert's stated goal (see 11).
13. **2026-10-22 · Pillar 5 "nothing is ever taken away" → reworded "Decks are seasonal, progress is
    permanent."** Permanent: characters, card-pool unlocks, cosmetics, finishes discovered, ranks, titles, and a
    read-only Hall of Fame snapshot of every tournament deck (Robert approved the fix).
14. **2026-10-22 · Run length → target 60–90 minutes.** Regular (hallway) enemies have 12–15 Essence, so those
    duels take about 4 minutes. Elites and Wardens stay full-length. *Why:* a weekly cycle needs several runs per
    week for people with jobs.
15. **2026-10-22 · Web version scope → private beta for Robert and friends.** Ko-fi and public launch come later.
    Online features (ghosts, live PvP, leaderboard) need a small backend, scheduled as a later milestone.
16. **2026-10-22 · Cheating → From day one, every run is recorded as seed + action log. In the friends beta the
    server trusts the client. Before any public PvP, the server issues run seeds and replays logs to verify
    decks.** *Why:* the deterministic engine makes this cheap. It isn't worth building before there's a public.

## Core rules clarifications (2026-10-22)

17. **A1 · Ambush discount → Setting an Ambush unit costs 1. A voluntary flip in your Main costs (printed cost −
    1), minimum 0. A flip caused by being attacked is free.** *Why:* without this, a 4-cost Hollow Lurcher
    becomes a 1-Aether play. This keeps the "they attacked into it!" moment free while closing the discount.
18. **A2 · Do effect-made summons/casts open response windows? → No.** Only *actions* open windows: playing a
    card (including Echo/Ascend), declaring an attack, activating a trap or Quick ability, playing a Relic/Rift.
    Summons/casts produced while an effect resolves emit events that fire `whenever` passives only. *Why:*
    readable chains, and no windows opening in the middle of resolution.
19. **A3 · M1 card scope → every Common in the Core Set (40) + tokens + Rift Spark + the 4 character Sigils.**
    The new 20-card starters use only Commons. Rares move to M2.
20. **A4 · M0 deployment → add a CI workflow and `netlify.toml`, but don't deploy.** There's no remote or account
    yet.
21. **Trap trigger matching →** a Trigger matches any link still unresolved on the current chain.
    `negate {link:'trigger'}` cancels the most recent matching link.
22. **Aether & Dawn order →** max Aether starts at 0, so the first Dawn makes it 1. Dawn order: reset Resonance →
    max +1 → refill → draw → start-of-turn effects.
23. **Trap / Ambush readiness →** a set card can be activated (or voluntarily flipped) on any turn after the turn
    it was set.
24. **Empty links →** every summon from hand opens a window, even for a vanilla unit (an empty "summoned" link).
    Relics/Rifts land immediately, can't be negated, and open a window the same way.
25. **Targets →** chosen when the link is created, legality rechecked on resolution. A link fizzles only if all
    its chosen targets are gone, and then none of its effects happen. A spell needs a legal target to be cast. A
    summon effect with no legal target skips that effect, but the link still exists.
26. **Attacked Ambush →** it flips when the attack is declared. Its Flip effect becomes a link (owned by the
    defender) above the attack, then the window opens. Face-down units can't attack, aren't Guardians, show no
    tribes/keywords to other cards, count as "set cards", and can be targeted by unit effects without flipping.
27. **Zone change = new instance →** new instanceId; damage/buffs/statuses cleared (control change excepted).
    Tokens leaving the field cease to exist. Transformed cards revert to their original card when they leave the
    field. *Why:* simple rules, card conservation, and no tracking hidden cards by ID.
28. **Temporary Guard →** temporary Guard absorbs damage first, so an expiring "+0/+2 this turn" never kills.
    "Guard" in conditions means current remaining Guard.
29. **Shield vs Pierce →** Shield blocks the whole instance, so nothing carries over.
30. **Keyword details →** Veiled only blocks *enemy* targeting/attacks. Stun lasts through the end of the
    controller's next turn. Corrode stacks: each stack is −1 Power, permanently, at the controller's Dawn.
    "Evolve resets Arriving" = the unit becomes Arriving again.
31. **Trigger ordering →** passive triggers caused by an action resolve before that action's window opens.
    Triggers that fire together: active player first, then event order, then slot order (units left→right,
    backrow, rift). Deaths are checked after every link and every trigger.
32. **Edge cases →** a card returned to a full hand is burned. Essence heals cap at starting Essence. If both
    players hit 0 at once, it's a draw (the campaign counts it as a loss). A 200-turn cap also ends in a draw.
33. **Overclock / Assemble →** the Overclock bonus is permanent. An Assembled unit goes to the Void without
    dying. The Assemble unit gains its current Power, remaining Guard and keywords.
34. **Rift Spark →** ID `TOK-SPARK` (spell, not collectible), given to the second player after mulligans.
35. **Resonance counting →** a card played from hand counts when it's played. Rift Spark counts. Copies,
    effect-made summons and attacks don't.

## Engine / DSL (2026-10-22)

36. **New generic DSL pieces:** ability flag `overclock: true` (the ability only applies, and only asks for targets, if the Overclock cost was paid), condition `resonanceAtLeast`, op `assemble`, op
    `atEndOfTurn` (delayed effects), op `removeCharge`, op `topdeckFromHand`, target picks `linkTarget` and
    `summonedByThis`, multi-zone targets, event filter `{killer:'self', cause:'combat'}`, a concrete
    `StaticModifier` union (`cantAttack`, `costMod`, `powerPerCount`, ...), ability kind `duelStart` (for Sigils).
    The `resonance` field is always additive; "instead" cards use `conditional`.
37. **Engine ↔ content →** DSL types live in `engine`. `content` depends on `engine` + zod. The engine receives
    cards through `createEngine(cardDb)`, which returns the four API functions. *Why:* the engine has no
    dependencies, state is plain JSON, and there's no global registry.
38. **Redaction →** `eventsFor(events, player)` sits next to `viewFor`. Views strip PRNG state and deck order.
39. **2026-10-22 · Toolchain versions → TypeScript 6.0.3 (not 7.0) and pnpm 11 (not 12).** typescript-eslint
    8.72 supports TS < 6.1 only (TS 7 is the native port without the JS API linters need). pnpm 12's packaging
    needs a corepack that requires Node ≥ 22.22, and this machine has 22.21. Revisit both when they're unblocked.
40. **2026-10-22 · Packages consumed as TS source.** Workspace packages export `src/index.ts` directly (no build
    step). Vite, Vitest and tsx all compile TS, which keeps the dev loop instant.
