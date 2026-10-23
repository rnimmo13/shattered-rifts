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
    becomes a 1-Mana play. This keeps the "they attacked into it!" moment free while closing the discount.
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
22. **Mana & Dawn order →** max Mana starts at 0, so the first Dawn makes it 1. Dawn order: reset Resonance →
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
    `summonedByThis`, multi-zone targets, event filter `{killedBySelf: true, cause: 'combat'}`, `attackTarget` and `swiftCast` event filters, condition `handCountAtMost`, `oncePerGame` on passives, filters `minCost` and `withoutShield`, `destroy { devour: true }`, `setFrom { zone: 'deck', choose: 'random' }`, a concrete
    `StaticModifier` union (`cantAttack`, `costMod`, `powerPerCount`, ...), ability kind `duelStart` (for Sigils).
    The `resonance` field is always additive; "instead" cards use `conditional`. **The authoritative DSL is
    `packages/engine/src/types.ts`** (mirrored by `packages/content/src/schema.ts`); 02 §2.1 is a summary.
37. **Engine ↔ content →** DSL types live in `engine`. `content` depends on `engine` + zod. The engine receives
    cards through `createEngine(cardDb)`, which returns the four API functions. *Why:* the engine has no
    dependencies, state is plain JSON, and there's no global registry.
38. **Redaction →** `eventsFor(events, player)` sits next to `viewFor`. Views strip PRNG state and deck order.
39. **2026-10-22 · Toolchain versions → TypeScript 6.0.3 (not 7.0) and pnpm 11 (not 12).** typescript-eslint
    8.72 supports TS < 6.1 only (TS 7 is the native port without the JS API linters need). pnpm 12's packaging
    needs a corepack that requires Node ≥ 22.22, and this machine has 22.21. Revisit both when they're unblocked.
40. **2026-10-22 · Packages consumed as TS source.** Workspace packages export `src/index.ts` directly (no build
    step). Vite, Vitest and tsx all compile TS, which keeps the dev loop instant.
41. **2026-10-22 · Rift Spark is a rules setting, not engine code →** `Rules.secondPlayerCard` (default
    `TOK-SPARK`). *Why:* golden rule 2, never special-case a card ID in engine code.
42. **2026-10-22 · Game ending mid-resolution →** `endGame` sweeps spells/traps still staged on the chain
    into the Void. *Why:* the property test caught a card stranded in the 'chain' zone when a spell's
    resolution ended the game.
43. **2026-10-22 · Client-facing additions →** `engine.stats(state, id)` returns layered stats for
    rendering, and a `chainLinkResolving` event marks the start of each link's resolution (the animation
    spec's "chain resolve per link" beat).
44. **2026-10-22 · M1 random AI →** "random-legal-move" with two nudges: it responds in about half of the
    windows where it can, and it rarely ends its turn while it can still act. *Why:* pure uniform choice
    ends turns constantly and produces unreadable games. It's still random, not strategic.
45. **2026-10-22 · M1 review fixes (reviews/m1-review.md) →** a face-down unit's stats are never put in
    events or views. A player's own prompt reveals its cards to them (Scry). No action is accepted after the
    game ends. Corrode stops at 0 Power. An Echoed card that leaves the field for any zone goes Beyond.
    Views include layered stats. Lifebind heals once per hit even with Pierce. State-based checks repeat
    until stable.
46. **2026-10-22 · Evolve timing → An evolved unit can attack on its owner's next turn, even if it evolved
    while defending** (Robert). *Why:* evolving should feel like a reward. "Resets Arriving" (#30) stays as-is.
47. **2026-10-22 · Smart auto-pass and Rift Spark → auto-pass ignores Rift Spark unless its +1 Mana would let
    you afford another legal response** (Robert). Implement in the M3 duel UI.
48. **2026-10-22 · Character names → keep Ser Maren Ashcourt, Rivet, Kesh the Unfed, Vesper Nightlace for now**
    (Robert).

## M2 card implementation (2026-10-22)

49. **Signature card IDs and costs →** the 12 Warden signature cards are AUR-17–19, NEX-17–19, WYL-17–19 and
    UMB-17–19 (table in 02 §4). Unspecified costs: Seraphine's Oath 3, Kron's Assembly Arm 3, Maw Spawn Egg 3,
    Gorrmaw's Tooth 2. Gilded Halberdier is a 3-cost 3/3 **with Shield** (its text only makes sense with one),
    and Maw Spawn is a new token, TOK-MAWSPAWN. *Why:* `03_CAMPAIGN.md` gave text but not every cost. Revisit in
    balance sims.
50. **Netrunner Ix, "look then destroy" →** resolves as a prompt at resolution time (`peekDestroy`): you see
    *all* enemy set cards, then may destroy one costing 3 or less (or none). It is not a pre-chosen target.
    *Why:* targets for a played card are chosen when you play it, before you could look, so hidden information
    would leak or the look would be meaningless. Lantern of Lost Names hides set cards from it.
51. **Rift: The Hollow Veil →** the static is `backrowSlots: 5`. If it leaves, cards in the extra slot are
    destroyed (to the Void). Its first-Trap discount counts per turn number (either player's turn).
52. **Mirror of Malice →** "a random enemy unit" means a random unit controlled by the spell's caster that the
    spell could legally target. If there is none, the spell is negated. *Why:* "enemy" is relative to the
    Mirror's owner, so the spell turns back on its caster's side.
53. **CALYX / Prism copies →** "last spell you cast this game" is the last spell *you* cast (Swift spells and
    Rift Spark count; copies don't). CALYX's copy asks you to choose new targets. Prism's copies pick random
    targets with the seeded PRNG, one copy per different Spell card in your Void. Prism's cost counts the
    different *printed* card types in your Void.
54. **Signature-card details →** Thal'gor and The Hunger Below apply their buff *before* the destroy so the
    value is read while the units are still there (same result as the text's order). Gorrmaw's Tooth is a
    separate "whenever you Devour" trigger that gives the devourer +1/+1. Override Virus's stolen unit returns at
    Dusk (destroyed if its owner has no free slot). Faceless Courtier shows you the hand for the rest of that
    turn. Nyxara's Web can re-set once per game per player.
55. **New generic DSL pieces (all card-agnostic, with tests) →** ops `addRandomToHand`, `setTrapFrom`,
    `peekDestroy`, `copySpell`, `redirect`, `revealHand`, `resetSelf`; `takeControl {duration}`; `buff` amounts
    can be a count or a unit's Power; statics `selfCost`, `damageReduction`, `backrowSlots`, `trapsReady`,
    `protectSetCards`, `costMod.firstEachTurn`; events `trapResolved`, `shieldPopped`, `assembled`; ability
    kind `onBreak`; event filters `onSelf` and `spellTargets`; filter `sameNameAsEventSource`.

## M2 AI, sims and enemies (2026-10-22)

56. **AI design (HeuristicAi) →** a 1-ply search over a *belief state* rebuilt from `viewFor()` only: the
    opponent's hand, both decks and face-down enemy cards become placeholders (a hidden unit is assumed to be a
    2/2). It simulates each legal action, lets the chain resolve assuming the opponent passes, evaluates the board,
    and picks the best, shaped by a Personality (aggression, trap-happiness, card value, caution, mistake rate).
    A test swaps the opponent's hidden cards and checks its decisions don't change ("no peeking"). Difficulty
    comes from the mistake rate, not from cheating. *Not yet:* 2-ply search for Elites/Wardens, and boss scripts.
57. **First-player advantage → NOT changed, flagged for Robert.** Sims show the first player wins 60–73% of
    mirror matches. The data supports giving the second player one extra opening card (52–60%). The engine has the
    knob (`Rules.secondPlayerExtraCards`, default 0). Details and options in `docs/BALANCE.md` §1. *Why not
    applied:* it's a core rule.
58. **Starter imbalance → NOT changed, flagged for Robert.** Kesh ≫ Maren > Vesper > Rivet (BALANCE.md §2).
    *Why not applied:* the fix changes character identity, so it's a design call.
59. **Enemy decks (03 §4.6) →** all 12 regular duelists (20 cards, 14 Essence), 8 Elites (30 cards, 30 Essence),
    4 Wardens (30 cards, 35/35/40/40 Essence) and Vorthax (30 cards, 50 Essence) are authored in
    `packages/content/src/enemies.ts` from each theme using realm + Neutral cards. Wardens' signature cards
    (Aurumclaw, etc.) are left out of their decks because Omens/phases (M5) give them those. Each enemy has an AI
    personality (Stage 1 regulars lean `novice` for the onboarding duel).
60. **Deck rules live in `@sr/content` →** `DECK_RULES`, `validateDeck`, `randomLegalDeck`; `@sr/campaign`
    re-exports `DECK_RULES`. *Why:* enemy decks and property tests need them, and content can't depend on campaign.
61. **Property gate →** `pnpm test:property` plays 10,000 random legal games (random legal decks from the whole
    pool, random Sigils) with a strengthened invariant checker (every card in exactly one container matching its
    zone field, conservation, slot limits, finite numbers, every game ends ≤ 200 turns, safety caps never hit). It
    runs in CI. `pnpm test` also runs a quicker 300-game version. Verified clean on 30,000 games across two seeds.
62. **Balance sim (`pnpm sim`) →** match / matrix / card (the ±6%/±10% gate) / tiers (a draft-bot *model*) /
    enemies. Runs on worker threads; deterministic for a seed regardless of worker count.

## Browser build & hosting plan (2026-10-22)

63. **Character balance philosophy (Robert) →** characters may be uneven early. A weaker character can need a few
    clears to gather late-game cards, as long as it **evens out as its deck gets stronger**. So the balance test is
    "do the weaker characters catch up in the tier model?" (`pnpm sim tiers`), not "make the starters equal".
    BALANCE.md §2 is therefore accepted, not a bug. The first-player advantage (#57) is still open.
64. **The browser build is the test vehicle (Robert) →** the terminal duel is a dev tool only. Goal: a browser game
    playable through the whole campaign, deployed to GitHub-hosted pages for Robert and friends.
65. **Board tech: DOM/CSS first, PixiJS later →** M3 builds the duel board in React + CSS (fast to build, easy to
    make accessible and responsive), driven by `viewFor()` / `GameEvent`s. PixiJS + GSAP for the full animation
    spec (04_VISUALS) arrive with M6 polish, behind the same event interface. *Why:* gets a playable game to
    friends sooner; the engine/event contract doesn't change.
66. **Hosting →** the web client is a static site. `pnpm deploy:web -- --repo OWNER/NAME` builds it and pushes
    only the compiled output to a branch of a GitHub repo for GitHub Pages. It needs no GitHub Actions and no extra
    token scopes. Because the source repo is private and Pages from a private repo needs a paid plan, the
    recommended setup is a separate public "play" repo that holds only compiled output. The site is public to
    anyone with the link either way (not a security boundary).

## Browser UI: art direction and renderer (2026-10-22)

67. **Renderer: hybrid PixiJS + web elements (Robert approved) →** the battlefield is a PixiJS v8 WebGL scene
    (background, arena floor, fog and rift particles, slots, later monsters, traps and effects), with GSAP for
    timing. The hand, card frames, HUD, banners and menus stay as web elements (crisp text, accessibility, 3D tilt).
    **Supersedes #65** ("DOM first"). The engine/event contract is unchanged: the UI renders `viewFor()` and replays
    `GameEvent`s, and never decides rules.
68. **Art direction (Robert's brief) →** dark-fantasy rifts. Palette: deep obsidian/navy, warm gold trim, electric
    violet and cyan rift energy, no default browser colours. Feel target: Slay the Spire 2, i.e. hand-painted 2D
    characters standing on the battlefield, constant subtle motion, punchy feedback on every action. No flat
    rectangles or emoji placeholders. All colours, glows, shadows and easing/timing live in
    `apps/web/src/design/tokens.ts` (CSS reads them as `--c-*`, `--glow-*`, `--t-*`, `--ease-*`; Pixi reads the same values).
    Phases: 1 tokens + battlefield + ambient · 2 hand + card frames · 3 monsters on the field · 4 trap sigils and
    reveal · 5 juice (shake, hit-stop, numbers, banners, animation queue). Stop after each for review.
69. **No art exists yet, so the scene is procedural →** the sky, ruins, stone floor, cracks, fog and rune rings are
    generated from seeded noise and gradients at load (deterministic). Real painted backgrounds and card art replace
    them later behind the same layer interface. Monsters will use stylized silhouettes until real art exists;
    generated card art will need a background-removal step before it can stand on the floor.
70. **Performance rules for the scene →** one canvas, backdrops extended past the 16:9 stage so wide windows have no
    bars, a pixel budget (about 1080p worth of shaded pixels; less in reduced mode), **adaptive quality** (if frames
    run slow the render scale steps down by itself, never back up so it can't flicker), baked fog fades instead of
    masks, capped particles, and "reduced effects" plus prefers-reduced-motion handled in one profile
    (`duel/effects.ts`). `?fps` in the address shows the frame rate and render scale. Measured in a
    software-rendered browser: 17 fps before, ~40 fps after (a machine with a GPU should be far higher).
71. **Phase 2 (hand and cards) uses preview-only drop rules →** the demo hand decides "can I afford it / where can it go"
    on the client (`hand/dropRules.ts`) only to preview the interaction. When the duel is wired (M3) these come from
    `legalActions()`, and `rift`/`sigil` card types get their own handling. Card art is procedural (silhouette per tribe/type,
    seeded by card id) until real art exists; `art/proceduralArt.ts` is the one place to swap it. Review: `reviews/phase2-review.md`.


72. **Renamed Aether → Mana (Robert, 2026-10-22) →** the play resource is now called Mana everywhere (rules, cards, engine identifiers, UI). Mechanics unchanged. Older review files keep the old name.
73. **Phase 3: monsters, and the board no longer sits under the hand (Robert's feedback) →** the board is fitted above a
    reserved strip equal to the resting hand's height (`handReserve`), the hand rests lower (cards sink 35% below the screen
    edge and lift fully on hover), and cards are a little smaller. Monsters are cut-outs of the card art with a ground shadow,
    puppeted with transforms only (`duel/scene/Monsters.ts`): idle breathing, attack lunge, hit, death. The Attack/Hit/Buff/Defeat
    buttons and the damage maths in `DuelScreen` are a preview harness only; the duel will drive `Monsters` from `GameEvent`s.


74. **Priority: a playable campaign before balance (Robert, 2026-10-22) →** balance and difficulty tuning are deferred until the campaign is built; it is fine for the first playable campaign to be very easy. The first-player advantage question (#57) stays open and parked. Effect on the plan: after the UI art phases, the duel UI wired to the engine (M3) and the campaign loop (M4/M5) come before any balance work.
75. **Phase 4: trap sigils and the reveal (`duel/scene/Traps.ts`) →** a set trap is a sealed rune sigil on the floor with a card back
    hovering over it (cyan for yours, rose for the opponent's). The reveal is the big moment: the board dims and slows, the seal
    spins up and the card trembles, it flips to its face and flies to the middle of the board with a light burst and shockwave, the
    name flashes across the screen, the caller's effect lands, then the spent card dissolves. The client only ever learns the card
    at reveal time (`reveal(key, def, onEffect)` takes the def from the event); the preview's `trapDefs` map is preview-only.
    Reduced effects / reduced motion skip the slow-mo, shake and most particles. The site now has a favicon (`public/favicon.svg`).
76. **Hosting moves to Cloudflare (Robert, 2026-10-22) →** domain `shatteredrifts.app` (registered at Cloudflare), site served by
    Cloudflare Workers Builds from `main` via `wrangler.jsonc` (build `pnpm install && pnpm --filter @sr/web build`, deploy
    `npx wrangler deploy`). The old GitHub Pages `deploy:web` stays as a fallback.
77. **M3: the real duel in the browser (`apps/web/src/play`, route `#/play`) →** a `DuelSession` runs the pure engine and the
    heuristic AI (the human is always seat 0). After every applied action it emits a Batch (events redacted with `eventsFor`,
    plus the views before and after) and waits for the UI to animate it before the AI moves again, so the board always shows the
    game in order while the logic is already resolved (golden rule 4). The UI only ever offers `legalActions()`: cards are grouped
    by card id, several variants (Overclock, Echo, Ascend, targets, set-as-Ambush) go through a chooser, and every `pending`
    prompt kind has a dialog (mulligan, targets, optional, scry, choose cards). Auto-pass: when the only legal action is Pass (or a
    free Rift Spark), the session passes for you. The AI runs on the main thread for now (one action per tick); moving it to a Web
    Worker is a later optimisation. A `replay` layer animates events on the scene and a `reconcile` step then forces the scene to
    match the final view, so a missed event can never leave the board wrong. Practice duels let you pick any of the four
    Riftwalkers against any enemy deck. The old art preview stays at `#/duel`.


78. **Players see "HP" and "Damage", not Guard and Power (Robert, 2026-10-22) →** HP sits on the left of a card and unit, Damage on the right. Card rules text, the card frame, the board badges and the inspector all use these words. The engine keeps `guard`/`power` internally; the "x/y" shorthand in text stays Damage/HP order as before (`+1/+1`, `a 3/2 Drone` = Damage 3, HP 2).
79. **Run v1 rules (`packages/campaign`) →** pure, seeded, JSON state; every step returns a new RunState. Maps: stages 1-4 have 5 floors
    of 2-3 nodes plus the Warden (floor 1 all duels, one elite at most and only on floors 3-4, one merchant at most), stage 5 is
    Shrine-or-Merchant then Vorthax. Stage order: Aurelion/Nexus/Wyldmaw shuffled, then Umbral, then the Rift. A duel loss costs 1
    Resolve (elite/Warden 2) and retries the same node; 0 Resolve collapses the run. Win rewards: 12 / 28 / 50 shards and 3 card
    offers (4 from Tier IV), or the Warden's Gift (a signature card). Tier scales enemy Essence (+3, Wardens +5 per tier above I).
    Not in Run v1: Boons, Tempering, Anomalies, Tier mutators beyond Essence, the Vault. Balance is deliberately not tuned (DECISIONS #74).
80. **Run v1 screens (`apps/web/src/run`, route `#/run`) →** Sanctum (pick a Riftwalker; all four are unlocked for now, Vesper's
    unlock is a later job), stage map, card reward / Warden's Gift, shrine, merchant, event, stage clear, loop cleared (Bank or
    Continue), Rift Collapse, Deck banked. The run is autosaved to localStorage after every step (`sr.run.v1`) and can be
    exported and imported as JSON; a finished run (collapsed or banked) clears the save. A duel in a run uses the run's deck and the
    enemy's Tier-scaled Essence; its shuffle seed is derived from the run seed, the node and the win/loss count, so a retry after a
    loss is a fresh shuffle. Conceding counts as a loss. The practice duel (`#/play`) and the art preview (`#/duel`) stay.
81. **Run v1: what is deliberately not built yet (from the M4 review, `reviews/m4-review.md`) →** Boons, Tempering, Anomaly nodes,
    Tier shard multipliers and Merchant price rises, the Vorthax gift, the Vault, a guarantee that one path per stage avoids the Elite,
    per-stage sub-seeds (maps and offers currently depend on the run's shared random stream, so they are reproducible for a whole run
    but not independently per stage), and a duel-in-progress save (a reload mid-duel counts the duel as a loss instead). A draw counts
    as a loss. Banked decks stay in the browser save until the player leaves the Deck banked screen, because the Vault does not exist.
82. **Targeting without menus (Robert's feedback) →** a play whose variants differ only by a single board target is resolved by
    position: dropping the card directly on a valid target submits that variant at once, dropping it elsewhere above the hand line
    enters click-a-target mode (valid targets glow, Esc / right-click / Cancel backs out), and a pending "choose targets" prompt
    with simple board targets is answered the same way. Several modes (Overclock, Ascend, set face-down...) still ask which mode first,
    and anything with multiple or off-board targets falls back to the list. The client never decides what is legal: every option still
    comes from `legalActions()`. Units that can attack, flip or use an ability show a ready indicator.
83. **Phase 5 (juice) →** one owner for the animation clock (`duel/scene/timescale.ts`): the effective GSAP timeline scale is the
    speed setting times the slowest active hold (trap-reveal slow-mo, hit-stop). Screen shake and hit-stop scale with damage
    (`shakeFor`, `hitStopFor`); reduced effects halves the shake and drops hit-stop, and prefers-reduced-motion drops both. Sound is
    synthesized with the Web Audio API (`audio/sfx.ts`), so there are no audio assets; it is on by default at half volume and can be
    muted. Every scene event already had a sound hook; they now play. Real recorded sound can replace the recipes later.
84. **Pacing and input never blocked by animation (Robert's feedback: "drawn out", "can't chain actions") →** the duel screen keeps an
    ordered animation queue: every batch of engine events replays in order, but a batch caused by the HUMAN returns to the session at
    once, so `onIdle` re-opens input immediately and the player can chain actions while earlier animations play. A batch caused by
    the AI is awaited, so the AI never acts faster than the screen can show. Only the newest batch may set the HUD view. Default animation
    speed is 1.5x; beats were shortened (attacks ~0.5s, trap reveal ~1.7x faster, spell flourish ~0.7s and non-blocking, banner ~0.65s).
85. **Riftwalker avatars on the field →** each side's Riftwalker is a standing figure (placeholder art from the same painters as monsters;
    Maren knight, Rivet drone, Kesh beast, Vesper masked cultist; enemies by realm) at AVATAR_POS (me front-left, opponent back-right).
    They are the visual target for attacks on the player, so a unit attacking "face" lunges at the opposing avatar.

86. **Pivot to Slay-the-Spire-style combat (Robert, 2026-10-23) →** runs, combat and mechanics become StS-like: the Riftwalker is a combatant with HP; Mana/draw-hand/Barrier turns; enemies telegraph intents; side-to-side layout with a hero at each end and allies in a line; no aiming when only one target; no response windows (traps become auto-firing Snares); PvP is kept as a variant on the same engine. Companions are mixed per character (none / buffed / fighting). Supersedes the Essence/slot/chain duel rules. Full spec and milestones C0-C6 in `docs/08_COMBAT_V2.md`; the old engine stays until C4. Open numbers (3 Mana, 5-card hand, HP persisting between fights, status names) are listed there for Robert to confirm.
87. **C1 built: `packages/combat` (Robert, 2026-10-23: "lets continue with this new path forward") →** a new pure engine beside the old one. Choices made while building, all consistent with `08_COMBAT_V2.md`: units and heroes share one unit model; allies and enemies are both "units" with a `brain` (ally = acts at the end of its owner's turn, enemy = shows an intent, acts in its side's phase) so enemy summoners and player summoners use the same `summon` op; card effects are a small op DSL with selectors relative to the actor (`target/self/hero/front/allFoes/randomFoe/allFriends/attacker`); a unit side is ordered nearest-the-centre first with the hero always last; Snares spring at most one per event, oldest first, and a sprung Snare returns to the discard pile; `prevent` cancels only the current hit; a target that dies mid-attack makes the remaining hits pick a new target; taunt is enforced at the moment an enemy acts; weighted patterns never repeat a move three times running; Barrier of enemies lasts through the player's turn and falls at the start of their own phase; Exposed/Faltering tick down at the end of their owner's turn. Sample ruleset (`@sr/combat/sample`) is test scaffolding only; real content is C2. `pnpm fight` plays a text fight.
88. **C2 content v2 (2026-10-23) →** `packages/content/src/v2`: 13 Neutral + 17 Aurelion + 17 Nexus + 17 Wyldmaw + 17 Umbral cards (each with a "+" version derived by one rule in `build.plus()`), 12 companions, 33 enemy units, 26 encounters (3-4 regulars, 2 Elites, 1 Warden per realm, plus Vorthax). Riftwalkers: Maren 80 HP / no companions (Barrier, Thorns, retaliation Snares); Rivet 72 HP / starts with a Drone, builds machines; Kesh 76 HP / starts with a Hound, pays HP to buff the pack; Vesper 68 HP / no companions, Snares + Exposed + Seared. Starters are 10 cards. Wardens' signature mechanics and Omens are expressed as their telegraphed moves and HP phases; Omens "never lie" is automatic because intents are always shown. Enemy strength is two knobs (`ENEMY_SCALE`) plus hand-tuned bosses. Numbers are a first pass (BALANCE.md).
89. **C3 fight screen and C4 campaign (2026-10-23) →** the screen shows a *display state* advanced one engine event at a time (`apps/web/src/fight/display.ts`, tested against the engine over every encounter) so bars and hands change when the matching animation plays; human actions are applied to the engine at once and queued for replay, and input is only locked while the enemy phase plays. Cards with no target or one legal target play on release above the hand (no arrow); with several targets you drop on one or click then click a target. Run v2 (`packages/campaign`): `v:2` saves (old saves are refused and kept as `.rejected`), `hp/maxHp` carry between fights, a won fight sets HP, a lost fight costs Resolve (1, or 2 for elite/Warden) and retries at the entry HP with a different shuffle seed, a Warden win heals 30% and gives +1 Resolve, shrines offer Rest (35% max HP) / Temper (upgrade) / Let one go (remove), events can heal 20%, Continue heals 50%, Rift Tiers give enemies +12% HP and +1 Might per tier (summoned enemies too). The Warden's Gift is a pick among rare cards until Warden signature cards exist. Deck rules v2: min 8 cards, max 4 copies of a non-basic card.
90. **Old engine deleted (2026-10-23) →** `packages/engine`, `packages/ai`, the v1 card/enemy content, the practice duel UI, the old scene classes (monsters, traps, avatars, slots) and their tests/tools were removed (recoverable from git history at commit before this entry). `docs/01_GAME_DESIGN.md` and `02_CARDS.md` stay as legacy design history. `pnpm sim` is now the Combat v2 sim; `pnpm duel` and `pnpm test:property` no longer exist (random-play invariants live in the combat tests).

91. **Difficulty setting, Easy by default for now (Robert, 2026-10-23: "keep the campaign easy for now so we can readily test the game quickly ... deal with balance after the game is more fully built") →** a run has a difficulty (\`DIFFICULTY\` in \`packages/campaign/src/run.ts\`): **Easy** = enemies at 60% HP and 55% attack damage, 5 Resolve, 100 starting shards; **Normal** = 100%/100%, 3 Resolve, 0 shards. The engine takes \`b.hpPct/dmgPct\` (state \`enemyHpPct/enemyDmgPct\`, per-unit \`dmgPct\`), so intents show the scaled numbers. Old saves load as Easy. \`pnpm sim -- --hp 60 --dmg 55\` measures it (the greedy bot wins every encounter losing only a few HP, which is the point for now). Balance passes wait until the content is complete (C5/C6).
92. **C5a: Boons, Warden signature cards, more events (2026-10-23) →** Boons (`packages/content/src/v2/boons.ts`, 12) are run-long passives: the engine runs a boon's `fightStart` ops as the first turn begins (after the Barrier clear, so Barrier lasts through turn 1) and its `turnStart` ops every turn after the draw, and adds `mana`/`handSize`; the campaign applies `maxHp` (also raises the fight's max HP via `HeroSetup.maxHp`), `healAfterFight` and `shardsPerFight`. Elites and non-final Wardens drop one unowned boon; the merchant sells one (70/120/200 shards by rarity). Each of Seraphine, Kron, Gorrmaw and Nyxara has three signature cards (`CardDef.source`, never ordinary rewards) that are offered first in the Warden's Gift, the rest of the choice filled with rare cards. Events: the cache, the wandering smith (free random upgrade) and the blood altar (10 HP for 60 shards, or 15 HP for a boon). Difficulty percent also scales enemy unblockable damage and Seared and never rounds a hit to 0. Enemy healing is not scaled (deliberately left for the balance pass).

93. **Fight polish pass 1 (2026-10-23, after an honest Spire comparison) →** cards now show whole in the hand (sink 3%, less overlap, bigger on wide screens) so rules text is readable without hovering; each card gets generated art that shows what it does (slash, flurry, burst, shield, heal, flame, curse, draw, power, snare, crystal, or the companion it summons) instead of one shared picture; hovering a card lists the keywords on it (Barrier, Exposed, Snare...); aiming a card shows the damage it will do on the hovered enemy (with LETHAL); Mana, End turn and the draw/discard piles sit in the corners like Slay the Spire; figures are larger. Placeholder art stays placeholder: real art is the largest remaining gap to the Spire's look.
94. **Potions, enemy move tooltips, art loader (2026-10-23) →** Potions (`packages/content/src/v2/potions.ts`, 10): carried up to 3, used for free on your turn (engine action `potion`, named by id so a shifted belt cannot drink the wrong one), aimed ones ignore Taunt. Fights drop one (40% regular, 75% elite/Warden) if there is room; potions found with a full belt are lost; the merchant sells two. Potions you did not use come with you after a win; a lost or forfeited fight gives back the ones used in it (same rule as HP: a retry starts from how you entered). Hovering an enemy's intent shows what the move does in words. Real artwork is optional: files listed in `apps/web/public/art/manifest.json` replace the generated placeholders (figures and card art today); the manifest fetch times out after 2 s so a slow network never blanks the app. `pnpm artlist` writes docs/art-briefs.md with a prompt for every asset.

