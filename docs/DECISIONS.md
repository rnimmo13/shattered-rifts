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


95. **Roster of 8, pools owned by a character, lanes not single mechanics (Robert, 2026-10-23: "i think sps does a great job of allowing the poison character the options to go shivs as well ... i dont want our characters to be given too few options") →** a Riftwalker's reward pool is its own (`CardDef.hero`) plus Neutral, ~35-40 cards in three lanes, instead of "realm + Neutral" (a realm is now flavour and the stage's enemies; Quill and Vesper are both Umbral, Sehra and Maren both Aurelion, Ilvane and Rivet both Nexus-9, Astra is Starfall). The 1-in-10 Rift-crossed card comes from any other Riftwalker's pool. New: Quill, Ilvane, Sehra, Astra. Design and rationale in `docs/09_ROSTER.md`; the generated card list is `docs/10_CARD_LIST.md` (`pnpm cardlist`).
96. **Shared toolkit, owned signatures (Robert: "i know other classes have ways to draw cards ... something like shiv or poison really should be the one character") →** draw, Barrier, Heal, Exhaust, Retain, Might, Scry, 0-cost cards and AoE appear in several pools in each character's flavour; mechanics with their own rules belong to one: Shivs and Seared stacking (Quill), Runes (Ilvane), Stances and Mantra (Sehra), Stars and Forge (Astra), Drones/Assemble (Rivet), Pack (Kesh), Thorns (Maren), Snares (Vesper). Enforced by tests (`cards.test.ts`). Seared cards that used to be Vesper's (Mindrot, Hungering Dark, Nightfall) moved to Quill; Vesper took Exposed and Bluff lanes. Rift-crossing can still hand anyone another character's engine card (that is the point of crossing).
97. **Engine additions for the roster (all generic ops; no card ids in the engine) →** (a) **choices**: `discard`/`exhaustCards`/`scry` ops pause the card with `state.pending` and the player answers with action `pick`; only a card's own effects may ask (Powers, Snares, units, runes, potions get random or nothing); a one-card hand or an "all" request needs no answer; (b) **scaling**: any amount can carry `scale` ("+mult per metric"; `into: 'hits'` for extra hits; X cards spend all remaining Mana, `x: true`, cost 0); (c) **Powers are triggers** (`power` op: turnStart, turnEnd, play (by kind/tag), exhaust, discard, summon, snare, stance), nested up to 6 deep; (d) **runes** (4 in the DB: Spark, Ward, Hollow, Prism; 3 slots; passive at end of your turn, evoke when pushed out or by a card; Resonance adds to rune damage/Barrier and Hollow charge), (e) **stances** as exclusive statuses (Calm: leaving gives 2 Mana; Wrath: deal x2, take x1.5; Radiant: deal x3, +2 Mana on entry, ends with your turn; Mantra 5 = Radiant), (f) **Stars** (second resource, `starCost`) and **forge** (every copy of a card gains a persistent bonus; Astra's Blade comes from her Sigil), (g) **Sigil** (`HeroDef.sigil`, ops at fight start), (h) **ally-target cards and `sacrifice`**, (i) Snare triggers `foeDefends` (fires before the Barrier lands so it cannot soak the punishment) and `foeTurn`, (j) innate and ethereal cards, tokens (`source: 'token'`, no "+"). A Power sees its own play (Afterimage triggers on itself). Rules tests: `packages/combat/src/mechanics.test.ts`.
98. **First-pass balance for the roster →** `pnpm sim -- --draft 8` (greedy bot, random drafts): every character beats regular fights; Astra trails because the bot does not value Stars or Forge, and Kesh over-performs against Wardens. Not tuned yet: balance waits until the content set is complete, per #91 (Easy by default for now).
99. **Naming pass so the game is not a clone (Robert, 2026-10-23: "make sure to rename things so it doesnt seem like a clone of slay the spire 2") →** about 85 card ids and names that matched another deckbuilder's cards were replaced with original ones, and the player-facing vocabulary changed: Calm -> Serene, Wrath -> Fury, Mantra -> Fervor, Stars -> Lumen, Forge -> Sharpen, Sovereign Blade -> Starforged Blade, Shiv -> Sleeve Knife, Exhaust -> Consume, Retain -> Hold, Innate -> Opening hand, Ethereal -> Fleeting, Scry -> Foresee, the Power card type -> Aura, Strike/Defend -> Slash/Guard (names only). Engine identifiers are unchanged (only what the player reads moved), except the Edge tag, now `EDGE_TAG` ('knife'). Mechanics stay: they are ideas, not expression. Policy in `docs/09_ROSTER.md §5`. Old saves that hold renamed card ids will not load (dev builds only). Before a Steam release, spend an hour or two of IP-lawyer time on names and store copy; do not use another game's name in the title or description.
100. **Review fixes (same day) →** Snare plays now fire "when you play" Powers (Master Trapper did nothing before); Powers in play no longer count as consumed cards; scaled-only amounts do not get a flat "+" on upgrade and scaled hits get +1 per hit; `validateDb` rejects X cards that never read X, scaling by X on non-X cards, sacrifice without an ally target, and runes that evoke or channel themselves; Foresee reshuffles a short draw pile first; leftover Fervor keeps converting; a sharpened blade shows its bonus on the card; Prism evoke is 1 Mana, Devour Ally and War Breath cost 1. Known and left for the balance pass: Hollow runes scale without bound, Serene/Fury loops with Rushdown (now Surge of Ire) are strong.
101. **Snares are a shared toolkit with one master (Robert, 2026-10-23: "kind of like Might where other decks can still have it sometimes, but theres one character that really gets the most of it") →** every Riftwalker now has at least one Snare in their own flavour (Kesh's Gnarltooth Trap feeds the pack Might, Quill's Poisoned Needle applies Seared, Ilvane's Glyph Trap channels a Ward, Sehra's Poised Riposte enters Fury, Astra's Lumen Trap gains Lumen) and Neutral has Hidden Pitfall and Alarm Bell. Vesper stays the trap deck: 14 Snares plus Spare Traps and the Gleeful Trapsmith Aura (whenever you set a Snare, 4 damage to all enemies). A test requires that Vesper has at least twice as many Snares as any other character.
102. **Foresee made worth taking (Robert: "is scry really useful? sounds kind of pointless") →** Scry was the weakest StS mechanic unless something paid for discarding. Cards you Foresee away now count as real discards (their "if discarded" effects, "whenever you discard" Auras and the "cards discarded this turn" count all fire), and each of the three characters with a Foresee lane gets a payoff Aura (Marked Cards: 3 damage to a random enemy; Reading the Signs: 1 Fervor; Star Chart: 1 Lumen). A short draw pile is reshuffled before looking.
103. **Mechanic coverage and a ninth Riftwalker (Robert: "make sure we have at least all the card mechanics from sps2") →** engine tier 3 (see `09_ROSTER.md §6`): Bracing, Brittle, Ghostly, Steadfast, Armored, Ritual, Vigor, Doom, Twinned, Mirrored, Unbound, Fortified, Holdfast; temporary statuses, Mana and cards for next turn, discover, upgrade/cheapen the hand, copy self. Doom needed a home: **Mire, the Gravewarden** (Gloomfen, 76 HP, starts with a Bone Thrall) owns Doom, a Thralls lane and an Ashes lane (consumed cards). Every other pool and Neutral got a few cards using the shared ones. Note: StS2's exact card list is only partly known to us; coverage is by mechanic, not by copying cards, and names stay original.
104. **Teaching the mechanics →** (a) one-time tips in the fight the first time something new appears (basics, companions, runes, Lumen, stances, Fervor, Doom, Snares, Auras), dismissible and switchable (`Tips on/off`, kept in the browser); (b) a "How it works" list per Riftwalker on the character screen (`Riftwalker.howTo`); (c) a `#/learn` page listing the basics, every character's notes, every status, keyword and rune (generated from the same data, so it cannot drift).
105. **Balance pass 1 →** see `BALANCE.md`. New tool `pnpm balance`. The bot now values Doom, Snares, Sharpen and banked Mana.
106. **Choices at the start of a run and a stage (Robert, 2026-10-23: "encounters like in sps where you get to make choices along the way, like at the start of acts or the start of a run") →** a new run phase `prelude` (`packages/campaign/src/preludes.ts`). **The Threshold** opens every run: 3 blessings and 1 bargain from two pools. **A Waymark** opens each stage (and each new loop): a rest (heal 30%), 2 blessings, and a bargain half the time, with a line of realm flavour. An option is a list of plain effects (max HP, heal, lose HP (never to 0), shards, a random card of a rarity from your own pool, upgrades, remove or transform Slash/Guard cards, a random Boon, a Potion, Resolve, Wounds), so the text on screen is generated from what is applied, saves and replays work, and tests can check each effect. Amounts scale a little with the stage. Offers come from the run's seeded PRNG. Blessings are always safe; bargains are marked "At a price". Old saves are unaffected (no prelude phase in them). Not built yet: choosing among several offered cards (an option gives a random card), and realm-specific Waymark options. Names are original: nothing here borrows another game's event text.
107. **Review fixes, round two →** a card that gives Mirrored/Twinned no longer spends the stack on itself, and a doubled card that asks for a choice is doubled after the choice; Ghostly caps attacks only (Doom still kills); a temporary status is only recorded if it landed (Steadfast); free discoveries are modest (cost 2 or less, never rare) and never the discovering card; Holdfast still consumes Fleeting cards; "+" of Hunger Unbound and Unbroken Wall is cheaper (more stacks do nothing); Fever Dream+ and Palmed Card+ have hand-written upgrades; the display keeps cost changes. Known and left: Needling Blow adds a copy of itself each play (watch it in `pnpm balance`), Gravesoul loops are bounded by the deck.
108. **Two starting decks to choose from (Robert, 2026-10-23: "update the opening of a run to include an encounter and a selection of 2 sets of semi-random starting decks") →** a new first run phase `kit` (`packages/campaign/src/kits.ts`), before The Threshold (the opening encounter, #106). A kit is the Riftwalker's starter with three plain Slash/Guard cards swapped for three common/uncommon cards from their own pool: an anchor card plus two that share its mechanic. The mechanic comes from what the cards do (Snares, Companions, Runes, Lumen, Fate, Seared...), restricted to mechanics with at least two cards in the pool, with generic ones (Auras, making cards) never used as a theme; the two kits never share a card and lean on different themes where the pool allows. The screen names what each kit leans toward and shows the three added cards. Seeded from the run's PRNG, saved with the run (so a saved run at this step keeps its offer). Not built yet: a re-roll, and kits chosen from specific lanes by hand (lanes are not tagged on cards; the mechanic is derived).
109. **Practice fight deck builder (Robert, 2026-10-23: "pick from all cards in the game for your deck ... so we can test every combination") →** the practice fight (`#/fight`) now has a deck section: every card in the game filterable by pool (each Riftwalker, Neutral, Warden gifts, tokens, other), rarity, text, and "+" versions, any number of copies (no deck rules apply to practice), with the starter one click away and a random-20 button; plus Boons and Potions pickers. The logic is in `apps/web/src/fight/deckCatalog.ts` (named so it cannot collide with `DeckBuilder.tsx` on case-insensitive filesystems) and is tested, including a test that plays 108 random decks drawn from the whole game, on every Riftwalker, against regulars, elites and Wardens, to the end with the bot and no engine error. The campaign is unchanged: deck rules (minimum 8, at most 4 copies) still apply there.
110. **UI pass from playtest feedback (Robert, 2026-10-23) →** (a) **hand hover twitch**: a hovered card lifts and grows, which moved its bottom edge away from a pointer resting near it, so it dropped and lifted again forever. The pointer is now tested against an invisible stand-in that stays at the card's *resting* spot (with a zone that extends over the lifted card while it is hovered); the visible card follows the layout but never takes the pointer. (b) **one tooltip layer** (`ui/Tooltip.tsx`, `ui/tip.ts`): any element opts in with `data-tip` (via `tipAttrs`), so there are no wrapper elements; it renders in a portal, never takes the pointer, clamps to the screen and flips below when there is no room above. Used for statuses, Barrier, HP, Mana, Lumen, runes, Auras, Snares, piles, Boons and potions; card keywords sit beside the lifted card. (c) **potions** are SVG flasks coloured by effect on a labelled three-slot belt; **Boons** are rarity medallions with a symbol of what they do. (d) the **deck viewer** shows cards at 190 px; the **merchant** is laid out in aligned blocks and rows. (e) **Card luck** (`RunState.luck`: normal / lucky / blessed, chosen in the Sanctum, saved with the run, old saves are normal) tilts card offers and the shop's stock towards rarer cards (`LUCK_WEIGHTS`); it does not change Boons, Potions or the opening choices. Not done: luck for practice fights (they already allow any card).
111. **Role tags and a build label (Robert, 2026-10-23) →** each Riftwalker has a one-word `role` (a test requires one word, unique) shown on the title screen, both pickers and the Learn page. The build label is injected by Vite (`define __SR_BUILD__`, `apps/web/vite.config.ts`): version from `apps/web/package.json` (bump it by hand when you want a new named version), commit from Cloudflare's `CF_PAGES_COMMIT_SHA`, GitHub's `GITHUB_SHA` or `git`, `+` when the working tree was dirty, and the build time. It shows in every screen's corner and the title footer.
112. **Legendary cards and the grimoire picker (Robert, 2026-10-23) →** `Rarity` gains `legendary`: one copy per deck (`canAdd`), never a starter, excluded from Discover, 20 cards (2 per Riftwalker, 2 Neutral; a test requires it). Offer weights: normal duel 0%, elite 1%, lucky duel 1% / elite 4%, blessed duel 4% / elite 7%; the Warden's Gift adds one of your legendaries 30/55/85% of the time (normal/lucky/blessed); merchant price 260; prelude bargain "A Legend's Price" (lose 15 HP). The practice deck builder is a book (`DeckBuilder.tsx`, tab logic in `deckCatalog.ts`: `TABS`, `tabOf`, `tabCards`, `paginate`, tested): a ribbon per realm, six cards per page, two pages on wide windows.
113. **KP, the Homeless Drunk (Robert, 2026-10-23: a short fat bald dwarf, a trapper, with a 12 gauge, a hammer and window panes) →** the 10th Riftwalker, Nexus-9. Snares are a shared tool and Vesper owns the trapper role, so KP has 4 Snares (a test keeps Vesper at 2x anyone) and a different role word, **Drunkard** (roles are unique). His special lane is **Shells**: the `buckshot-shell` token (tag `shell`, owned by KP in the signature test) hits every enemy for a little, the opposite of Quill's one-target knives; his Glass lane is Barrier + Thorns (Thorns is a shared status; `per('thorns')` payoffs). New field `Riftwalker.quotes` (shown on the character picker). No engine changes. Art uses the Engineer silhouette until real art is made.
114. **Summon limit, KP's own realm, role changes (Robert, 2026-10-23) →** (a) a card with a `summon` op can no longer be played when the hero already has 3 companions (`canPlay`: it is not offered by `legalActions`, so the UI and the bot both respect it); before, it was playable and the extra unit was silently dropped. (b) KP gets a realm of his own, **The Midden** (`midden`, amber and rust; the rift's rubbish heap), in `RealmId`/`REALMS`, the card frame, crest, art palette and ribbons. (c) Roles: Kesh is a **Hunter** (beasts and the pack), Sehra a **Barbarian** (Fury and Serene stances); "Monk" is no longer used.
115. **Art, class colours, KP's gun, Mana tools, Boon banner (Robert, 2026-10-23) →** (a) `art/heroFigures.ts` paints a bespoke figure per Riftwalker and `art/emblems.ts` holds ~40 one-colour emblems (a character icon each, plus card symbols chosen by `emblemOf` in `fight/art.ts` from the card's name, then its motif); real art in `art/manifest.json` still overrides. (b) `card--hero-<id>` CSS classes give each character's cards their own palette (Warden gifts keep their realm's). (c) Hover lift is `y -0.4w, scale 1.28` (was -0.62w, 1.5). (d) KP's Old Twelve Gauge reuses the `forge` op (now owned by Astra and KP; Lumen stays Astra's alone) with tag `gun`, hits all enemies: `dmg(5, allFoes)` scaled by `bonus`; Shells (tag `shell`) stay his too. (e) New op `maxMana` (+N max Mana for the fight and N now) and negative `manaNext` (Mana owed next turn; a turn never starts below 0). Every Riftwalker has at least one Mana card (test). (f) `RunScreen` shows a `BoonToast` for each Boon that arrives through `setRun`.
116. **Innate traits, title-screen character choice, snare tiles (Robert, 2026-10-23) →** (a) `Riftwalker.trait` (name, text, `fightStart`/`turnStart` ops, or `clutch {below, damagePct}`) is copied onto the engine's `HeroDef` in `COMBAT_DB`; `fightStart` runs once after the Sigil, `turnStart` every turn, and Clutch Genes is a `clutch` status (value = bonus %) the engine switches on while the hero is at or below the line (`syncClutch`, after damage, healing and at turn start) that `modifiedDamage` applies. All ten traits are small on purpose; the full balance review comes next (Robert: Snares feel too strong). (b) The chosen hero is remembered in localStorage (`sr.hero`, `app/heroChoice.ts`) and used by Begin Run, the Sanctum and Practice fight. (c) Snares are drawn by `SnareRow` as trap tiles near the hero with their trigger written under them. (d) Maximum Mana is capped at 6 (`MAX_MAX_MANA`) and its changes are an event (`maxMana`) so the display follows; owed Mana carries to the next turn.
117. **Difficulty modes and the full balance review (Robert, 2026-10-23: "too easy... more in line with intentions but make sure easy mode is easy") →** three modes (Easy 85/80% enemies and 5 Resolve, Normal 115/110% and 3 Resolve, Hard 125/118% and 2 Resolve), Normal is the default, saves from before the setting load as Easy; enemies ramp by stage (`STAGE_SCALE`); targets measured with `pnpm runsim`: Easy ~99% clears, Normal ~50% (bot), Hard ~20%. Card and hero changes are listed in docs/BALANCE.md (Snares were the biggest outliers). Version 0.3.0.
118. **Normal is 2 Resolve and about a third of runs (Robert, 2026-10-23) →** Normal 117%/111% enemies and 2 Resolve (bot clears ~31-33%; heroes 22-48%), Hard 128%/120% and 1 Resolve (~17%), Easy unchanged (85%/80%, 5 Resolve, ~99%). `MAX_RESOLVE` is 2. Because a lost Elite or Warden costs 2 Resolve, one of those ends a Normal run. The reference point is the published Slay the Spire 2 Ascension 0 average of about 16% for all players; a bot with retries at ~33% is meant to feel like roughly 20-40% for casual players (to be checked against real playtests; run logging is the next step). Version 0.3.1.
119. **Ancestral cards, summon text, unit looks (Robert, 2026-10-23: "powerful but not class specific and only offered in some situations") →** a new rarity `ancestral` (12 neutral cards in `pools/neutral.ts`, tagged `source: 'ancestral'` so they stay out of every reward pool and Discover; `ancestralCards()`; one copy per deck like a legendary). Where they appear: the Ancestors' Offering event (18% of events, 12 HP), the Warden's Gift (22/40/60% by luck, as an extra choice), the merchant (28/40/55%, 240 shards) and the "Call on the Ancestors" bargain (12 HP). Never in `offerCards`. Summon cards' rules text includes the unit's HP and what it does (`view.ts`). Every unit has a Look (`art/unitLooks.ts`: hue, build, accessories, chest emblem; a test requires one per unit and that no two are alike). Version 0.3.6.
120. **Holding merchant cards, page-turn fix (Robert, 2026-10-23: "a deferral locking mechanism for the merchant cards") →** `holdCard`: pay `HOLD_DEPOSIT` (20%) of a card's price at a merchant; `RunState.held` keeps it, and the next merchant sells it first in the row for `HOLD_LATER` (70%) of the old price (90% in all, so holding is a small discount for committing, not a free reservation). One card at a time, no refund if you never buy it. The grimoire page turn is a slide and fade, because the 3D rotation made the nearer page taller than the book while it ran. Version 0.3.8.
121. **Seared is now Bleed (Robert, 2026-10-23) →** a display rename like Doom to Fate (#96): the status id and the metric id stay `seared` in the data, the player-facing name is `Bleed` (`STATUS_NAME` and `METRIC_WORDS` in view.ts, `STATUS_INFO` in info.ts, the card keyword list, the kit theme label, Quill's blurb and lanes, the docs). Version 0.3.9.
122. **Rift-crossed tags, class-only Warden Gift, skippable rewards, crowds, clean card art (Robert, 2026-10-23) →** (a) a card from another class in a reward, event or shop gets a Rift-crossed tag (`CrossTag` in run/Pickers.tsx); 8% of merchants are visitors selling only one other Riftwalker's cards (`merchant.crossed`, no ancestral extras). (b) `giftOffers` now returns only rare and legendary cards whose `hero` is the player's class; Warden signature cards are no longer offered (the data stays). `chooseCard(null)` works for the Gift too. (c) `MAX_START_ENEMIES` = 7 for a fight's opening line-up while summons stay capped by `MAX_ENEMIES` = 4; `slotX` packs a crowd closer and `UnitPlates` narrows or staggers plates. New fights: Drone Swarm (6 Scrap Drones), Page Troop (6 Gilded Pages), Raptor Horde (4). (d) Card art draws the motif at 34% behind one crisp emblem (`proceduralArt.ts`); the owner's icon is on the card (`.card__owner`). Re-run `pnpm runsim` after adding swarms: Normal stays ~33%. Version 0.3.12.
123. **Events and sanctifying (Robert, 2026-10-23: "sanctify the whole deck... 25% increase/decrease to every card... more events... a card shouldn't be offered every time") →** events live in `packages/campaign/src/events.ts` as a weighted table (`EVENTS`: `when` says if it can happen now, `build` makes it, `resolveEvent` carries out an option and returns a sentence, shown as the run notice via `RunState.eventResult`); eleven events, only the cache (35%), the Ancestors and the mirror touch cards. Sanctify: every card with damage, Barrier, healing, HP-loss or status numbers is re-rolled up (55%) or down 25%; the rolled card is a derived variant with id `hi~<id>` / `lo~<id>` (`packages/content/src/v2/sanctify.ts`; `COMBAT_DB.cards` is a Proxy that derives them on first use and never lists them, so pools, the library and tests are unchanged). A rolled card keeps one copy limit with its plain and upgraded versions (`stripRoll` in `canAdd`), upgrades into the matching rolled upgrade, and saves as its id. Version 0.3.13.
124. **Lanes shown, Mire's dead, Rivet, crossing rates (Robert, 2026-10-23) →** (a) `tools/src/lanes.ts` (`pnpm lanes`) derives `lanes.generated.ts` (card id → lane 0/1/2) from the pool files' section headings (KP and a few Mire cards by id); `laneOf`, `laneName`, `laneSizes` are exported from `content/v2`. The grimoire sorts hero → lane → rarity and heads each page "Hero · Lane"; the picker shows lane sizes. Shared "glue" cards have no lane (a test requires >55% laned, each lane ≥7 cards). (b) KP's lanes are Gun / Shells / Hangover; his glass cards use `per('missingHp')` instead of Thorns (Maren's lane). (c) Engine: trigger `allyDies`, ops `reclaim` (Consumed non-Aura cards back to hand) and `revive` (last fallen ally, half HP; `SideState.fallen`); Mire's four new cards use them. (d) Rivet 72 HP, Tinkerer heals 3 (Normal clears 10% → ~30%). (e) `CROSSED_MERCHANT_CHANCE` 7.5%, ordinary offers cross 3%, event `stranger`. Version 0.3.15.
125. **Minions first, summons in front, bigger maps, more events (Robert, 2026-10-23) →** (a) the default enemy target (`FoeRule` 'hero') is the front-most living ally, then the hero; an intent aimed at the hero re-targets to an ally summoned afterwards; Taunt still wins. (b) A summoning enemy's minions are inserted just in front of the summoner (`spawn(..., summoner)`). (c) Because companions now soak hits, Normal is 124%/116%; companion heroes trimmed after re-evaluating (Rivet 46 HP, Tinkerer heals 1, Kesh 80, Mire 76; n=100 bot Normal: Rivet 42%, Kesh 41%, Mire 44%, overall 31%). (d) The Rift-crossed merchant is decided when the map is generated (`MapNode.crossed`, `CROSSED_MERCHANT_CHANCE` 7.5% per merchant) so the map can show it; `View map` is a read-only overlay during fights. (e) Maps stay five floors (Robert: no longer than StS2) but have 2-4 nodes per floor, 55% forks, up to two Elites and two Merchants, Shrines mid-map; `MAX_EVENTS_IN_A_ROW` = 2 (a third becomes a Duel). (f) Eight more events (see CHANGELOG); sanctify leaves 20% of cards unchanged. Version 0.3.15.
126. **Weak heroes lifted (Robert, 2026-10-23: "look at those characters as well") →** with n=100-150 bot Normal runs after #125: Astra 5% → ~23% (Starborn and Gather Light 3 Lumen, Sigil 3 Lumen, a second Lumen Bolt replaces a Strike, +10-18% on Lumen spenders, Blade base 9), Sehra 17% → ~33% (HP 104). Now Normal: Rivet 42, Kesh 41, Mire 44, Sehra 33, Vesper 27, KP 25, Astra 23, Ilvane 22 (Maren ~39, Quill ~50 untouched). The bot drafts by rarity only, so synergy-heavy heroes (Astra, Ilvane, KP) are under-measured. Runes are drawn beside the hero (`RuneArc` x/cy) so they no longer overlap the buff row.
127. **Splinter rune (Robert, 2026-10-23: "the glass rune ... one that does AOE") →** `splinter` in `RUNES`: passive 2 to all enemies, release 6 to all enemies (Spark stays single-target); four Spark-lane cards (Splinter Cast, Prismatic Burst, Shard Chorus, Glasswright); Ilvane 56 → 74 HP (bot Normal 13% → 33%).
128. **Lane depth (Robert, 2026-10-23: "we still need more cards for each build") →** every lane of every Riftwalker has at least 12 cards (was 7-8 for Maren, Rivet, Ilvane, Mire, Astra; a test now requires 12): Maren +11, Rivet +10, Mire +6, Ilvane +7, Astra +3, and one to three each for Kesh, Vesper, Quill, Sehra, KP (KP's lane ids are listed in `tools/src/lanes.ts`; run `pnpm lanes` after adding cards). New cards use only existing ops. Bot Normal after: overall 33% (Maren 44, Rivet 48, Kesh 42, Quill 44, Ilvane 37, Mire 29, Vesper 26, KP 25, Sehra 22, Astra 17; n=100). Sehra's blurb says barbarian, not monk.
129. **70 cards per character, Slay the Spire 2 as the baseline (Robert, 2026-10-23: "around the same number of cards and a lot of the same cards... interesting mechanics and combos") →** the wiki lists ~80-90 cards per character (Ironclad 3/20/38/27); Robert chose 70 each with a rarity spread like 20/26/20 and a mostly-matching mapping (Ironclad = Maren + Kesh, Silent = Quill + Vesper, Defect = Ilvane, Regent = Astra, Necrobinder = Mire; Rivet, Sehra, KP original). Equivalents copy the mechanic and shape (cost, effect), never the name or text. Engine additions (all generic, no card ids): Power triggers `barrier`, `loseHp` (own cards only), `draw`, `created`; op `fetch` (random discard card to hand or top of draw; builder `fetchCards`); metrics `skillsPlayed`, `drawn`, `created`; the bot ends a turn after 60 plays (two free draw cards could loop for ever). Tests in `triggers.test.ts`. Counts now: Maren 70, Rivet 70, Kesh 71, Vesper 69, Quill 70, Ilvane 71, Sehra 69, Astra 74, KP 73, Mire 70. Normal 124/116 → 128/118: bot clears Maren 49, Rivet 47, Quill 41, Mire 36, Kesh 33, KP 32, Sehra 31, Ilvane 28, Vesper 19, Astra 19, overall 34% (n=100). Open: Vesper and Astra are the weakest; Sehra has only 15 rares.
130. **90 cards per character (Robert, 2026-10-23: "each character has around 90") →** 221 more cards (about 90-97 per Riftwalker, 995 in all), added with existing ops only; no engine change. Powers cannot run choice ops such as Foresee (validation rejects `scry` inside a Power), so Pleiades and Breath Between Blows give Barrier instead. The random-deck stress test now accepts a stalemate (a defensive deck against a healing enemy) as long as the fight is still turning over. Engine gaps noted by the card writers, not built: a stance filter on `on('play')`, a "Doom kill" trigger, spreading Doom, custom Thrall stats, "keep the oldest rune" for Ilvane.
131. **X cards upgrade by +1 X (Robert, 2026-10-23: "all x upgrades should go to x+1 like in slay the spire") →** `CardDef.xBonus`: X counts as the Mana spent plus the bonus; `plus()` gives every X card `xBonus + 1` and nothing else, and the card text says "X is 1 higher". This is why Mana gain matters for these characters.
132. **Loops trimmed, weak heroes lifted (Robert, 2026-10-23: "address the loops", "balance changes are more needed for weaker characters... tune down later") →** Bated Breath, Cannibalise, Faith Kept cost 1; Rapid Prototype, Open a Vein, Bleed the Void are Consumed; Mean Drunk costs 2, Glass Jaw 4 damage / 3 Barrier, Spray and Pray 0.25 per card created, Blood on the Sand 2 Vigor. Weak heroes (`pnpm runsim -- --n 60 --difficulty normal`: KP 13%, Vesper 28%, Astra 30%, Mire 30%, Quill 32%) got HP and trait buffs: KP 96 HP and Clutch Genes below 60% for +60%; Vesper Ambusher 3 turns Exposed plus 6 Barrier; Astra 112 HP; Mire 86 HP and 4 Fate; Quill 78 HP. Result: KP 47%, Vesper 37%, Astra 43%, Mire 38%, Quill 42% (Maren 58%, Rivet 52% unchanged). KP is slightly over: tune down later. KP's lanes are Gun / Shells / Hangover as in the code (his AoE cards and Snares moved into Shells); the roster table now says so.
133. **Versioning (Robert, 2026-10-23) →** every publish/deploy bumps the minor version in `apps/web/package.json`, and every commit message starts with the version number.
134. **Shorter names (Robert, 2026-10-23: friends wanted better names; "shorten them up", then "lets go with ragnar for the barb") →** display names are now **Maren** (was Ser Maren Ashcourt; the plate cut it off) and **Ragnar** (was Sehra, the Still Flame). Ids, roles and files stay `maren` / `sehra`; docs still say Sehra for the pool.
135. **All short names (Robert, 2026-10-23) →** display names: Maren, Rivet, Kesh the Unfed, Vesper Nightlace, Quill, Ilvane Glyphwright, Ragnar, Astra, Dorian Blackthorn (the necromancer, was Mire), KP. Ids and pool files are unchanged.
136. **Tier cap and full heal (Robert, 2026-10-23) →** Rift Tier 20 is the last (`MAX_TIER`): after clearing it only Bank is offered. Continuing a loop now heals to full HP (was 50%). Tier 20 means about +228% enemy HP and +6 Might.
137. **Preset lane kits (Robert, 2026-10-23: "pre-set starter kits of 2 cards that lean into one of the 3 lanes... uncommon... consistent... not overpowering") →** the start-of-run choice is now three fixed kits per Riftwalker, one per lane: the usual starter with two plain cards (an Attack replaces a Strike, anything else a Defend) swapped for two fixed uncommons of that lane (`KIT_CARDS` in `packages/campaign/src/kits.ts`; no randomness, no rares or setup-heavy cards; Astra's Constellations kit is two cheap Auras, Ursa and Draco). Kit ids are a/b/c = lane 0/1/2; a test checks each kit is two uncommon cards of the right lane and a legal deck. The old random mechanic labels (`mechanicsOf`) are gone.
138. **50 events (Robert, 2026-10-23: "slay the spire 2 has more than double so lets increase our events") →** 30 new events (50 in all), written as data: an option carries `deal` steps (hurt, heal, shards, max HP, Wound, potion, Boon, upgrade, remove, transform, copy, gift of a rarity, chance) in `packages/campaign/src/deals.ts`, events in `eventDeals.ts`. An event is only offered when every one of its options can be taken right now (`dealFeasible`, run on copies), so none is unplayable. Option ids d1-d4 are new; the older events keep their one-off ids. Labels read "Headline (price): reward" for the card-style event screen. A hand-edited save could carry its own deal numbers; saves are the player's own so they are not policed.
139. **Names, looks and balance (Robert, 2026-10-23) →** Quill is displayed as **Scarlet** (female assassin art), Astra and Rivet are drawn as women, Rivet keeps the role **Engineer** (her model is female). After the preset kits (#137) the Normal clear rate (`pnpm runsim -- --n 150`) was Ilvane 17%, Vesper 26%, Rivet 29%, KP 30%, so HP went up: Rivet 46 to 60, Vesper 104 to 134, Ilvane 74 to 100, KP 96 to 106, and Ilvane's Attuned gives 2 Resonance (was 1). Result at n=120: Kesh 33% (weakest, not yet touched) to Quill/Ilvane 56%. Event removals (`remove`/`transform`) now only take plain Neutral Slash/Guard cards, never a Riftwalker's own starter card or a Wound unless the card says Wound; event options in saves are validated.
140. **Astra re-themed as Obsidia, the Glasswaste Spellblade (Robert, 2026-10-23: "change the theme of the character", keep the cards) →** Lumen/Sharpen/Starforged Blade were too close to Slay the Spire 2's Stars/Forge/Sovereign Blade, so the character became a volcanic-glass spellblade. Display only: **Astra → Obsidia**, realm **Starfall → The Glasswaste**, **Lumen → Arcana** (Robert chose the name), **Starforged Blade → Obsidian Blade**, trait **Starborn → Kindled**, lane **Constellations → Sigils**, all ~67 card names re-flavoured (stars/comets → glass/ember/sigils), palette gold-indigo → ember orange and black glass, emblem a shard. Ids (`astra`, `starfall`, `stars` op, `starforged-blade`, every card id) are unchanged so saves and tests keep working, as in #135. Effects and numbers are untouched. Art (the hero figure still has a starry coat) is left for Robert's unique art.
141. **Ilvane re-themed as a totem carver (Robert, 2026-10-23: the Glyphwright copied Defect's orbs; "maybe we do totems?") →** same pattern as #140, display only. **Ilvane Glyphwright → Ilvane** (role Runecaster → **Totemist**), **runes → totems** (rune ids kept): Spark → **Hawk**, Splinter stays, Ward → **Bear**, Hollow → **Elder**, Prism → **Owl**; **Conjure → Plant**, **Release → Awaken**, **Resonance → Spirit** (status id `resonance`), trait Attuned → **Spirit-touched**, lanes Hawk / Bear / Elder, all card names re-flavoured (glyph/rune/spark → totem/bark/hawk/spirit), palette blue → wood brown with moss green, a totem-pole emblem. Realm stays Nexus-9 (changing it would touch Rivet's realm tests and stage content); revisit if the sci-fi setting jars. The structure (3 slots, passive each turn, burst when pushed out) is unchanged, so it is still Defect-shaped; a mechanical difference would be a later, separate change. The hero figure and totem art are left for Robert's unique art.
142. **Final names (Robert, 2026-10-23) →** the re-themed Astra is **Obsidia** and the re-themed Ilvane keeps the name **Ilvane** (Robert first picked Dakar, then changed back) (these replace the working names Vael and Ilvane Rootcarver used in #140 and #141; ids `astra` and `ilvane` unchanged). Display names are the single words "Obsidia" and "Ilvane", like Quill or Ragnar.
143. **Hero models and the upgrade picker (Robert, 2026-10-23) →** **Obsidia** is redrawn as a female obsidian-spellblade villain (black glass, ember cracks, a crown of shards); her **Obsidian Blade floats beside her only while a card tagged `blade` is in her hand** (an optional `FighterSpec.prop`, so any hero can have one later). **Ilvane** is a **stone golem** who plants carved totems and **calls the spirits in them to do his bidding** (he is not a worshipper of gods): same mechanics, new blurb. The upgrade picker's hover preview now measures its real height and slides up so it never runs off the bottom of the screen.
144. **Five Legendaries per Riftwalker, and a Legendary limit (Robert, 2026-10-23: "5 legendary cards but limit their deck to a certain number of them at a time... a real decision instead of a 50/50 coinflip") →** every Riftwalker now has **five Legendary cards** (the two they had plus three new ones, one per lane, in `pools/legendary.ts`); the two Neutral ones are unchanged. **A deck holds at most `V2_DECK_RULES.maxLegendary` = 2 Legendary cards**; once it has two, no Legendary is offered or can be added (rewards, Warden's Gift, merchant, preludes all go through `canAdd`). So being offered one costs a slot another could have used. The limit of 2 is a first guess: it is one constant. The 30 new cards are a first balance pass, to be tuned with `pnpm sim`.
145. **Fortified is weaker (Robert, 2026-10-23: "retain 75% of armour after each turn, maybe 50 but we will see") →** Fortified now keeps **75% of your Barrier (rounded down)** at the start of your turn instead of all of it. It is one constant, `FORTIFIED_KEEP` in `engine.ts`, so trying 50% is a one-line change. The `barrierDrop` event now carries the Barrier left (`total`).
