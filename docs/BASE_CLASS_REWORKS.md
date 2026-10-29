# BASE_CLASS_REWORKS — Shattered Rifts design and Claude Code handoff

> **2026-10-29, DECISIONS #428:** the Knight, Assassin, Spellblade and Monk reworks were reverted to their earlier cards (Robert: they could not fight bosses and lost what he wants them to be). Only the Shaman's rework is live. Their documents and ledgers are archived in `reviews/balance-baselines/2026-10-29-reverted-reworks/`; nothing for those four classes below is in the game.

Status: **implemented 2026-10-29** (DECISIONS #414-#419). The Knight, Assassin, Spellblade and Shaman directions below, and the Monk's Option A (Martial Forms and Mastery, approved by Robert with this brief), are live; the old versions are archived in `reviews/balance-baselines/2026-10-29-pre-identity-reworks/`. Each class's contract, disposition and checks are in `docs/reworks/<CLASS>.md`, its hand-priced ledger beside it, the new rates in `docs/14_CARD_COSTING.md` §15, and the art inventory in `docs/CLASS_REWORK_ART.md`. The Monk sections (§10, §12) are kept as written for the record; Options B and C were not chosen. Below is the brief as it was handed over.

Work in `D:\Code\ShatteredRifts`. Implement these authorized class reworks, starting by archiving the existing versions intact. Preserve the class themes, deepen their strategies, and replace the recognizable Slay the Spire character engines rather than merely rename their effects. Complete implementation and validation; do not stop at a proposal. Do not deploy, publish, or discard unrelated changes.

## 1. Read first and establish the baseline

Read applicable AGENTS.md files, CLAUDE.md, docs/08_COMBAT_V2.md, docs/09_ROSTER.md, docs/13_PROPOSALS.md, docs/14_CARD_COSTING.md (all sections), docs/04_VISUALS_AND_ANIMATION.md, docs/05_ART_PIPELINE.md, relevant recent DECISIONS, and the actual code. Current source overrides stale descriptive tables; reconcile the docs you change. Inspect git status and preserve all existing work. Do not reset the checkout.

Read pools/knight.ts, shaman.ts, assassin.ts, spellblade.ts, their tests, build.ts, index.ts, engine/types/view/serialization, campaign rewards, Vault/deck compatibility, Arena validation, assets and learn pages. Inspect Monk for the report, not a fifth implementation.

User decisions in this prompt supersede the old instructions to keep these four as copied balancing baselines. The archived versions will now serve that purpose. User authorizes the four class mechanics and their necessary engine/UI/content changes here; resolve routine details yourself and document them. Economy, monetization, unrelated class redesigns and deployment remain out of scope. Do not run combat/balance simulations: follow the repository's hand-costing rule. Unit/scenario/property tests are required.

## 2. FIRST: create a usable, immutable reference archive

Before changing any class data or shared behavior, create a dated, versioned archive, e.g. `reviews/balance-baselines/2026-10-29-pre-identity-reworks/` (choose a new version suffix if present; never overwrite an archive).

Archive ALL FIVE existing balancing baseline classes if readily separable: Knight, Shaman, Assassin, Spellblade, Necromancer. The first four are mandatory; Necromancer remains unchanged in the live game. Also snapshot Monk as a reference for this review; do not redesign it. Preserve:

- Original pool definitions, tokens, upgrades, rarities, source/offer rules, starting decks, HP/Mana/hand sizes, traits/sigils, totem definitions, and relevant tests.
- A fully resolved machine-readable card/hero/totem export including upgraded cards. A TypeScript source copy alone is insufficient because imports into build.ts can change its meaning later.
- Human-readable rules and card lists with representative combos, costing guide, assumptions, known deviations from their modeled STS versions, and exact engine semantics required to interpret them.
- Asset inventory/paths and hashes; preserve any art that would be replaced or removed. Record current commit, dirty state, timestamp, schema version, file hashes and generation instructions. A commit hash alone cannot capture uncommitted baseline changes.
- A full recoverable snapshot of relevant shared engine/schema/build helpers and dependencies or an equivalent self-contained reference bundle; do not depend on a moving live engine to reconstruct old behavior. Do not copy node_modules or secrets. Include package/lockfile metadata.

Add a README explaining how to use the frozen resolved definitions for HAND BALANCE comparison, and what is/isn't runnable. Keep this outside production imports, reward pools and normal test discovery. Verify exports, counts, hashes, representative base/upgrade values and all archived hero starters before proceeding. Record a concise archive validation report. Never change these snapshots when new rules are tuned.

## 3. Shared implementation requirements

- Keep engine pure, deterministic and seeded. Cards are data using generic DSL ops/triggers, never card-ID branches in combat. Add generic mechanics with meaningful tests.
- Maintain stable hero IDs. Preserve card IDs where conceptual continuity exists; give genuinely new cards new IDs. Archive removed cards, exclude them from fresh offers, and deliberately migrate or reject old saved decks with a readable explanation. Never silently reinterpret an old incompatible save/replay as current rules. Check guests, accounts, Vault, deck import/export, Arena and old action logs. Version content/rules where needed.
- Keep unaffected characters, shared Bleed, traps, companion slots, Foresee and Drunkard Precision semantics intact. Do not globally rename `forge` or alter shared helpers just to implement Spellblade. Use dedicated semantics or scoped migration.
- Use one clearly displayed main resource for each class, plus enemy markers where needed. No reaction prompts or timing windows; triggers resolve automatically. Counters, charges, commands and legal targets must be visible; exact previews must agree with resolution.
- Keep the current comparable reward depth/rarity distribution unless a smaller prototype is necessary internally. Final playable pools must support at least three distinct, viable strategic directions each, plus glue cards. Do not fill quotas with near-duplicates or re-enable hidden build-path UI without need.
- Replace old starters and passive traits so new decisions appear in the first fight, with at least one useful attack and defense even when no enemy is attacking. No required rare to make a starter function.
- Suggested numbers below are first-pass costing examples, NOT instructions to ship unchecked values. Adjust within the costing framework, explicitly price upgrades, and explain material deviations.

## 4. Knight: Guard / Riposte / Thorns

Fantasy: a disciplined armored knight who meets attacks, creates openings and punishes contact. No self-burning or blood-mage engine as a primary identity.

Core rules:

- Guard uses existing Barrier. A positive enemy attack hit aimed at the Knight that is fully absorbed BY BARRIER grants one Opening against its attacker. Zero damage before mitigation, canceled attacks, Shielded/Ghostly or unrelated prevention alone do not count. Define and test mitigation order.
- Maximum one Opening per enemy; a multi-hit attack cannot create multiple Openings. They last through the Knight's next player turn and expire at its end, unless consumed first. Openings do not accumulate indefinitely. Define ownership in PvP, attacker death and replacement IDs.
- Riposte is an attack explicitly spending that target's Opening for a bonus. Normal attacks do not spend it. No automatic extra attack for every blocked hit.
- Temporary Thorns remains retaliation on enemy attack contact under existing semantics. It does not itself grant Openings or trigger attacks recursively. Support a dedicated Thorn strategy alongside precise defense and heavy ripostes. Permanent Thorns, if present, must be priced over realistic incoming hits and capped payoff frequency.
- Suggested trait: a small initial Barrier grant plus a once-per-turn benefit for earning an Opening, hand-costed as a passive; do not retain excessive front-loaded Plating automatically. No mandatory command/companion system.

Card disposition suggestions (audit full pool and produce an ID-by-ID final map):

KEEP or lightly tune: Oath of Iron as general defense/draw (it is above the guide's nominal common budget; do not use it to justify every new card being above budget); Dawn Smite as basic attack/defense glue; Provoke as Exposed setup; Ember Ward as the temporary Thorns anchor.

MODIFY: Sundering Blow into a signature attack using an Opening, with baseline damage useful without it; Bulwark Blow into an Opening finisher instead of damage equal to all held Barrier; Stoneskin into armor/guard support with explicit costing; Giant's Stance into a response to a threatening attacker; Bastion Engine into a CAPPED Opening or retaliation payoff instead of damage on every Barrier event; Warlord's Oath into martial technique support instead of passive Demon Form growth.

REMOVE FROM LIVE POOL or fully replace: Unholy Pact (free consumed Skills), Rite of Recall (draw on every Consume), Numbing Rite (Barrier on every Consume), the hand-burning Fiend Fire package, large Barrier-retention-to-damage combo, and the Scar Over/Draw Blood/Blood Fire self-harm engine. Keep ordinary Consume as a shared card keyword, not this class's primary payoff chain. Do not retain the complete Might/multihit copied package alongside the rework.

ADD candidates:

| Card | Cost/rarity | Initial design | Costing starting point |
|---|---|---|---|
| Measured Guard | 1 common | 6 Barrier; your next earned Opening before next turn also draws 1, once | 7.2 + 3 x realistic trigger probability; at 65% = 9.15 |
| Return the Blow | 1 common | 7 damage; spend target Opening for +5 damage | 7 + 5 x 0.65 = 10.25; Opening supply has an opportunity cost |
| Briarplate | 1 common | 5 Barrier; 2 Thorns until enemy turn ends | 6 + 2 x 1.5 expected incoming hits = 9 |
| Iron Rejoinder | 2 uncommon | 13 damage; spend Opening for 6 Barrier | 13 + 7.2 x 0.65 = 17.68; room to tune toward 21.28 budget, price actual reliability |
| Barbed Vigil | 2 uncommon | 10 Barrier; 4 temporary Thorns | 12 + 6 = 18; tune to budget without excessive multi-hit payoff |
| Thornwake | rare Aura | first retaliation each enemy turn improves next Riposte; bounded, no recursive retaliation | cost four useful turns and overlapping payoffs before choosing numbers |

At least one Thorn payoff should reward using retaliation well without requiring no-damage turns. Test Guard versus multi-hit, AoE, Barrier break, companion-targeted attacks, debuffs, no-attack turns and retaliation kills. Avoid forced no-damage stall loops.

## 5. Shaman: commanded spirit totems

Fantasy: a shaman plants enduring spirit anchors and chooses which spirit manifests. Totems are not a renamed FIFO orb queue and spirits are not a competing Engineer drone army.

Core rules:

- Three fixed, visibly selectable totem positions. Plant into an empty chosen position; replacing an occupied one is deliberate. Overflow never auto-awakens the oldest. Replacement grants no free full command effect.
- Once per player turn, choose ONE planted spirit for its main command, through a visible deterministic action/UI. It manifests briefly, acts and returns to its totem. It is not a persistent HP companion and uses no companion slot. The command is an ability, not a generated free Attack card. No Might/Exposed attack scaling unless deliberately specified and costed; preserve existing distinction between attacks and totem damage.
- MVP spirits: Hawk (targeted damage), Bear (Barrier on a chosen legal friendly), Elder (a small, bounded Spirit resource gain or ritual effect). Do not port Dark charging, Plasma Mana and Glass fading effects directly. Retire Owl/Splinter from new offers unless redesigned into a real distinct spirit role.
- Suggested base commands: Hawk 4 targeted non-attack damage; Bear 4 Barrier to one friendly; Elder gain 1 Spirit. These are provisional; command opportunity is shared, so planting three does NOT buy three full commands per turn.
- Spirit: persistent between turns, cap 3, spent to strengthen the selected command (e.g. one Spirit for +2 damage or +2 Barrier); at most one enhancement per command initially. Elder cannot enhance its own resource generation; no gain-Spirit/spend-Spirit recursion. Remove universal permanent Focus scaling.
- Start with one useful spirit, with starter tools to access another early; hand-cost trait plus command baseline together. No passive triple-totem free engine. Keep passive outputs absent or small enough that command selection remains central.
- Three strategies: direct Hawk/elemental offense; Bear/ward protection; deliberate totem replacement and ritual support. Rituals must work with the one-command rule, not simply bypass it every turn.

KEEP/TUNE: Stone Skin, Ember Toss, Clear Spring and other generic spell/defense/draw glue when within budget. MODIFY Hawk Call to plant a chosen Hawk position; Spark Lash to interact with an already planted Hawk or plant at reduced damage; Still Water into utility plus Bear setup; Frostbark into ward support; Spirit Drum, Tune the Spirits and Resounding Call into bounded command support. Replace Twin Awakening's dual-evoke starter completely.

REMOVE/REPLACE: extra-orb-slot scaling, oldest/newest passive repetition, mass evoke, Lightning-count replication, Dark-charge/Owl-Mana loop, permanent Focus growth and the copied zero-cost recursion package. Generic 0-cost spells can remain; All-for-One style recurrence must not remain a second Defect identity. Explicitly audit every runeSlots/channel/evoke/pulse/resonance reference before altering shared code.

ADD candidates:

- **Hawk's Counsel:** plant a Hawk; choose placement. Cost using usable remaining commands, NOT the old 'plant Hawk = 4' rate.
- **Wardkeeper's Pact:** gain modest Barrier and plant Bear; reduce immediate Barrier for the expected plant value.
- **Guided Talon:** modest direct spell damage; if Hawk is present, enhance its command this turn. No extra free command.
- **Shared Shelter:** Bear's next command protects hero and one companion at reduced values; single-target fights must remain useful.
- **Ancestral Exchange:** replace one totem; gain a bounded benefit only if spirit kind changes, once per turn. No repeated free swapping.
- **Rite of Returning:** a priced recovery tool or next-turn benefit after a command, with strict once-per-turn trigger and no self-recovery loop.

Targeting must include commands with no enemies/friendlies as applicable, full positions, replacement cancellation, Spirit cap/spend, power timing, double-command prevention and PvP visibility. Explain command affordance without adding raster-rendered text.

## 6. Assassin: Preparation AND embedded knives

Fantasy: setting up a precise kill, planting physical knives, then choosing when to retrieve them. BOTH Preparation and embedded knives are required, connected but not redundant.

Core rules:

- Preparation is a class resource, cap 3, persists between turns. Specific setup actions earn it; designated finishers spend it. Ordinary attacks don't automatically clear it. Avoid free indefinite passive generation that removes preparation decisions.
- Knife cards can embed one physical knife marker AFTER their attack resolves against a surviving legal enemy. Cap 3 markers per enemy initially. Embed does not itself deal automatic Poison-like damage each turn. Hitting the cap does not generate a refund or overflow benefit.
- Extraction removes a stated number of knives for a priced one-time payoff. A knife can be extracted only once. Extracted knives vanish unless a card explicitly creates a replacement; no inherent 0-cost Dagger refunds. No loot from already dead targets. Preparation empowers finishers/extractions, never multiplies every knife by unbounded stacks.
- Marks belong to the applying side, with exact targeting and UI. Target death clears marks without spreading; add death recovery only through a specific capped payoff if needed later. Define invulnerable, summoned, transformed and revived units.
- Trait suggestion: first knife embedded each turn grants 1 Preparation, capped once; pair with a starter that can reliably embed. Does not generate free knives automatically every turn.
- Three strategies: concentrated execution; knives spread across targets with selective extraction; mobile setup/defensive cycling. Single-target boss encounters must support all of them without kill triggers.

KEEP/TUNE: ordinary defense, Faltering, attack/draw and modest cycling. MODIFY Knife Juggle into setup/embedding access rather than 'make 3 Shivs'; Feint Strike into low damage plus embed; Whetted Edge into bounded extraction support instead of permanent +damage to every generated knife; Knife in the Back into Preparation finisher; Duck and Weave into defensive setup without mandatory Sly engine; Open Vein/Barbed Stab into limited wound support or knife setup. Shared Bleed remains unchanged for other users.

REMOVE/REPLACE: automatic Dagger-per-turn trait and its redundant Aura; bulk knife-spam/Accuracy engine; Poison-style doubling/spread/burst package; the full mass-Sly discard/autoplay/recursion engine. Ordinary discard is allowed; no full Silent triangle alongside the new system.

ADD first-pass costed candidates (provisional knife value 2 points per marker; Preparation 1.5 per point, based on a +2 damage spend with usability discount; verify supply and spend together):

| Card | Cost/rarity | Initial design | Initial value |
|---|---|---|---|
| Quiet Incision | 1 common | 7 damage, embed 1 knife | 7 + 2 = 9; trait synergy accounted separately |
| Patient Footwork | 1 common | 6 Barrier, gain 1 Preparation | 7.2 + 1.5 = 8.7 |
| Draw Steel | 1 common | 8 damage; extract up to 2 knives for +3 damage each | baseline 8, conditioned spend payoff; price marker consumption, not free +6 |
| Severing Finish | 2 uncommon | 15 damage; spend up to 3 Preparation for +2 damage each; optionally extract knives for separately priced effect | 15 base; +6 costs built resource; DO NOT add unlimited knife multiplier |
| Leave No Trace | 1 uncommon | modest Barrier and extract 1 knife for a defensive payoff | price total prevented damage and consumed marker |
| Hidden in Plain Sight | rare Aura | once per turn after extraction, gain small defense or Preparation, not card/Mana loop | four-turn trigger-frequency costing |

Do not count embedding and eventual extraction twice as full independent benefits, or discount consumer cards as if generated markers cost nothing. Track build turns and two-card package points. Test no markers, capped markers, exact partial extraction, target death between effects, Preparation limits, AoE ownership, no extra passive Bleed, no negative counts, and generated-card/Consume/discard interactions.

## 7. Spellblade: Imbue / Discharge

User terminology decision: replace player-facing Sharpen/Sharpened/Sharpening on the Spellblade with Imbue/Imbued/Imbuing. This is a new magical enchantment mechanic, NOT only a text replacement. Audit tooltips, learn pages, card text, class descriptions, animation labels, accessibility text and localization. Do not rename or redesign the Drunkard's Precision or unrelated weapons. Internal compatibility aliases can remain clearly documented.

Core rules:

- Obsidian Blade is an enchanted weapon with TWO enchantment positions. Qualifying spells Imbue a type; designated weapon attacks Discharge one or both. Charges persist until spent, fight end, or deliberate replacement. No permanent +damage-per-Sharpen counter.
- Types: Ember = +3 damage to the attack's primary target; Glass = 2 damage to all enemies as a separate non-attack shard effect; Ward = 3 Barrier to self. These are provisional and should be priced at 3, 2.6, 3.6 points before usability adjustment. Duplicates allowed; store exact order. If full, user chooses a charge to replace; replacement is not a discharge.
- A one-charge attack selects the charge through the existing pending-choice system, or uses a clearly documented deterministic order with preview; prefer choice if it stays readable. A full Discharge consumes both exactly once. No charge copies from attack echoes; define snapshot ordering and ensure replay only spends resources actually available.
- Remove generic persistent Arcana costs/resource from this class's normal new cards. If the UI uses Arcana as a thematic label for occupied enchantment positions, ensure it isn't an additional independent currency. Prefer display of the two enchantments directly.
- Trait suggestion: begin with a Ward enchantment, or enhance first Imbue per turn with a small bounded benefit. Remove automatic Arcana gain and Sharpen every turn. Starter must include an Imbue spell and a useful Discharge attack.
- Three strategies: frequent single discharges; mixed-charge/full Discharge bursts; Ward-focused defensive weaving. At least one viable choice is whether to spend a useful stored enchantment now or keep it for another attack.

KEEP/TUNE: black-glass/ember visuals, Obsidian Blade identity, modest general attacks/Barrier/Foresee utility. MODIFY Forged in Fury into attack plus Imbue; Whetstone into a magical inscription with a new displayed name; Bladewall into Barrier plus Ward; Call the Blade into priced weapon access, not restoring spent enchantments; Warm Anvil into bounded enchantment support; Glass Guard into a discharge payoff; Echoing Blade into a specifically capped interaction with no duplicated enchantments.

REMOVE/REPLACE: generic Stars/Arcana generator-spender package; persistent Sharpen/Forge growth; Court/Retainer transformation and generic Neutral-card creation engine; broad generated-card Strength/Barrier payoffs; freeplay/Hollow Form-style engine unless rebuilt around a unique, bounded enchantment decision. Audit every starCost/starX/starsNext/forge/BLADE/created-card payoff.

ADD first-pass candidates:

| Card | Cost/rarity | Initial design | Initial value before usability adjustment |
|---|---|---|---|
| Ember Inscription | 1 common | 6 spell damage, Imbue Ember | 6 + 3 = 9 |
| Glassward | 1 common | 5 Barrier, Imbue Ward | 6 + 3.6 = 9.6 |
| Fracture Script | 1 common | 5 damage, Imbue Glass | 5 + 2.6 = 7.6; tune upward after usable discharge estimate |
| Obsidian Cut | 1 common | 8 attack damage; Discharge one enchantment | 8 base; output comes from a separately paid stored charge; price flexibility/access |
| Crownfall | 2 uncommon | 17 attack damage; Discharge both enchantments | resource package valuation, not 17 plus 'free' 6.6; tune after combo checks |
| Recast the Edge | 1 uncommon | replace one stored enchantment with another chosen type; modest defense | no duplication, recovery or replacement-as-discharge |
| Emberglass Covenant | rare Aura | once per turn after consuming two different types together, gain a bounded benefit next turn | price four-turn realistic frequency, explicit upgrade |

Avoid recreating Regent under new names by making Imbue just a permanent stored attack bonus. Do not use old Sharpen 0.8/point, Arcana gain 2.5, Arcana spend +6 rates for these charges. Test full/empty positions, identical types, replacement, attack cancellation/invalid target, target death before shard effect, both-charge order, repeat attacks, Ward timing, and no consumption on previews.

## 8. Balance method and required ledger

Use docs/14_CARD_COSTING.md, not intuition or sims. Current baseline budgets: 0 cost = 6; 1 = 10; 2 = 19; 3 = 28; then +9/Mana. Common 100%, uncommon ~112%, rare ~125%; signatures 70-90%. Damage 1, AoE 1.3, Barrier 1.2, extra draw 3 then 4, Mana now 7 for first two, next turn 4, single Exposed/Faltering 3. Temporary Thorns = stacks x realistic enemy hits (~1.5 baseline). Apply multi-hit/Might adjustments and existing trap likelihood factors.

Add explicit NEW rates for Openings, embedded knives, Preparation, totem planting under shared command limit, command enhancement/Spirit, and each enchantment type. Explain expected use within 4-6 turns, resource cap, lost value, target death, delayed access and opportunity costs. Rates here are hypotheses, not measured facts. Separate gross output from the net cost of building and spending a resource. Do not treat caps or conditional gates as permission for 2-3x budgets without calculating their actual reliability.

For every base and upgraded card, deliver a ledger: ID/name, role, rarity, cost, effects, assumptions, points, budget, deviation, resource producer/consumer package example, justification. Aim within +/-15% except documented engines. Auras are costed over four useful turns at ~1.5x uncommon or ~2x rare cost budget; do not apply the rare multiplier twice. Explicit handwritten upgrades for new multi-effect cards, usually +30%, normally <=50%. Check free Mana/draw/copy loops, multiplicative synergies, turn-four ceilings, tier scaling, boss/single-target play and PvP. No new uncapped permanent scaling.

Do not claim cost metrics prove equal win rates. Keep archived reference values frozen and label legacy conversion rates as legacy in the live guide.

## 9. Artwork and UI deliverables

Audit current art before replacing it. Reuse art only when it still depicts the new effect. Keep portraits unless there is a concrete visual mismatch; these are mechanics reworks, not character replacements.

Priority new raster art:

1. Shaman Hawk/Bear/Elder totem silhouettes and matching transient manifestations, with consistent material/palette, clear occupied/selected/commanded states. Spirits need only static source art plus code animation initially; don't promise full spritesheet animation from one illustration.
2. Knight signature Guard/Riposte/Thorns illustration if existing art cannot communicate the combination.
3. Assassin preparation/embedded-knife/extraction illustration if existing art only shows airborne knife spam.
4. Spellblade magical Imbue/Discharge illustration, replacing mundane sharpening/forge imagery where misleading.

UI positions, selection rings, counters, links to embedded knives, enchantment chips, command button, labels and simple particles should be code/SVG/CSS consistent with existing UI, not text baked into generated images. Keep gameplay readable without glow/color alone. Shaman manifestations do not create extra combat units or targetable bodies.

Initial draft artwork may be supplied beside this prompt. Inspect it and the art bible before adoption. A concept sheet is a reference, not a ready atlas: obtain isolated transparent source assets or explicitly slice/validate separated cells, alpha, margins and scale before integration. Generated signature illustrations are candidate card art, not approved production assets. Record provenance, exact prompts, provider/model actually returned, dimensions, focal point, alpha status, intended IDs and approval state. Never invent model/version or seed. Preserve the repository's human-approval and consistent-model rules; mark new images unapproved pending Robert's art review. This does not block coding or procedural placeholders.

Create `docs/CLASS_REWORK_ART.md` listing reuse/new/retire per card and display, required formats, missing exports and integration paths. Keep assets non-destructive and versioned. Do not use franchise imagery or named artist styles.

## 10. Monk assessment only

Report the same resemblance concern, but correctly identify the source as the original Slay the Spire's WATCHER, rather than an official STS2 launch character. Current Monk: Serene exit +2 Mana once/turn, Fury double damage with +50% incoming rather than Watcher's double incoming, Radiant triple damage, 10 Fervor as Mantra, stance-switch rewards, Foresee and analogous starter effects. Its altered passive, starting stance, incoming damage and original card combinations are real differences, but the core decision system remains strongly recognizable.

Use a clearly subjective rough similarity range of 80-90% for gameplay identity relative to Watcher; this is not a card-by-card measured clone percentage or legal conclusion. A future Monk could use martial forms that change which action is rewarded, bounded technique sequences, and a deliberately spent mastery resource instead of Calm refunds + Wrath multiplier + 10-to-Divinity. Do not implement these changes in this task. Include comparison evidence and distinguish current roster facts from the original game's character.

## 11. Implementation order, checks and final handoff

1. Archive and verify first.
2. Establish the mechanic contracts/rates and full KEEP/MODIFY/REMOVE/ADD map in a rework document. Resolve ordinary details; do not stop here for approval.
3. Implement one complete class slice at a time (engine, cards, starter/trait, UI, tests, migrations), preserving unrelated characters. Update the balance ledger as effects change.
4. Update docs, generated card list, decisions, costing, tutorial/help, art manifest and changelog. Inspect package.json for actual script names; run required generation/audits rather than guessing names. No sim commands.
5. Run targeted scenario tests then repository-required lint/typecheck/test/build (`pnpm check` when applicable). Cover determinism, event ordering, base/upgrade behavior, state visibility, serialization/migration, single-target/boss and PvP action legality. Distinguish new failures from pre-existing failures.
6. Review UI in runnable game if available: correct resource/target/command displays, no hidden active old engines, no stale Sharpen text for Spellblade, keyboard/readable labels, exact previews and sensible animation timings. If runtime interaction isn't available, state that honestly.
7. Final report: archive path and validation; four playable identities and strategies; card disposition counts and file links; costing summary and unresolved balance assumptions; tests actually run/results; saves/replays/Arena migration policy; supplied art versus missing/awaiting review; Monk assessment. No unsupported new similarity percentages or unperformed test claims.

Acceptance: existing baseline versions are recoverable and independent of moving helpers; all four requested mechanics are live and distinct; Knight includes meaningful Thorns; Assassin includes BOTH Preparation and embedded knives; Shaman is not FIFO orbs or a drone army; Spellblade uses temporary magical Imbue/Discharge rather than permanent Sharpen or Stars; new resources are priced; unchanged classes keep their rules; complete playable pools, valid upgrades, deterministic tests and visible UI accompany the rework.

## 12. Expanded Monk assessment and redesign options — review only

### Finding and methodology

Solen strongly resembles the WATCHER from the original Slay the Spire. This comparison does not identify an official STS2 launch counterpart. Monk was not rebuilt explicitly card-for-card in the way the four baseline pools were, so do not describe every card as a direct copy. The close correspondence is strongest in the character's rule system and reward incentives.

Using the same subjective rubric as the other four: signature rules 35%, card effects/packages 35%, strategy 20%, starting experience 10%. Scores: 95, 70, 95, 75. Weighted result = 0.35*95 + 0.35*70 + 0.20*95 + 0.10*75 = 84.25, rounded to **84% mechanical similarity**, with a rough 80-90% uncertainty range. This is a design judgment, NOT a measured percent of copied cards, legal conclusion, or prediction from player research. The 70 card score reflects recognizable effect families plus many variations; no complete normalized Watcher-card census was performed. Small differences between class percentages are not significant.

Inspected sources: `packages/content/src/v2/pools/monk.ts`, `packages/content/src/v2/index.ts` and the hand-costing guide. Re-read on 2026-10-29: live Inner Fire has changed since the earlier review. It now grants Fervor on stance entry, +2 Mana on first Serene exit each turn, and +2 Primed whenever Fury is left. The earlier description of Barrier on stance entry is stale. Starting HP 82, 3 Mana, hand 5, starts Serene; starter is 4 Strikes, 4 Defends, Kindle Fury, Still Guard.

| Feature | Monk now | Watcher correspondence | Assessment |
|---|---|---|---|
| Defensive/preparatory stance | Serene exit grants 2 Mana, first exit per turn through trait | Calm exit grants 2 Energy | Same central economic incentive, capped here |
| Aggressive stance | Fury doubles attacks, takes 50% more | Wrath doubles dealt and received attack damage | Risk tuned down, core attack multiplication remains |
| Ascension stance | Radiant triples attacks until turn ends | Divinity triples attacks, grants Energy and ends at turn end | Strong recognizable payoff; not identical full rule set |
| Threshold resource | 10 Fervor triggers Radiant | 10 Mantra triggers Divinity | Near-direct rule correspondence |
| Opening attack | Kindle Fury: 2 Mana, 9 damage, enter Fury | Eruption's base attack-and-Wrath package | Especially recognizable starter |
| Strategic directions | Fury burst, stance cycling, Fervor/Radiant | Wrath burst, stance cycling, Mantra/Divinity | Same high-level strategic map |
| Trait | Fervor per entry, first Serene exit refund, Primed on Fury exit | Different original starting relic | Real difference but strengthens familiar switching loop |
| Foresee | Draw a selected inspected card and discard the rest | Scry inspects/discards without that inherent draw | Real rules difference; shared toolkit rather than sole identity |

External references: original game's stance summary https://slaythespire.wiki.gg/wiki/Stance ; official Watcher beta announcements https://store.steampowered.com/news/posts/?appids=646570&enddate=1569013658 ; official historical patch feed confirming Mantra/Divinity https://store.steampowered.com/news/posts/?appids=646570&enddate=1573249844&feed=steam_community_announcements . Exact current card code is local; web references establish the original game's broad systems, not a complete current patch diff.

### What can stay

Keep the martial artist fantasy, spiritual flame, calm concentration, flowing technique sequences, palms/kicks and a spectacular moment of mastery. Keep some hand planning, Hold and Foresee. None of those alone causes the resemblance. Replace the combined economy of 'exit calm for Mana, enter rage for double damage, count to ten for triple damage.' Changing stance names or raising the Fervor threshold would preserve the same decisions.

### Option A — Martial Forms and completed techniques (recommended)

Main question: **Which technique does this hand let me complete, and should I commit to it or adapt?** Forms change the objective you pursue, not the global damage multiplier. This separates Monk from Knight's reactions, Assassin's target preparation and Spellblade's stored enchantments.

Initial prototype contract, not approved live rules:

- Three forms: **Root**, **Current**, **Ember**. One active form. No form gives a blanket attack multiplier, incoming vulnerability or Mana refund on exit.
- Root objective: play two DIFFERENT Guard-tagged cards this turn. Current: play a Guard-tagged card then a Strike-tagged card, different card IDs, in order. Ember: play two DIFFERENT Strike-tagged cards against the same enemy this turn. Tag only intended technique cards; ordinary neutral cards do not all count automatically. Aura/snare tags and wildcard behavior require explicit rules, not inference from English names.
- At most ONE objective completion per player turn, regardless of form switching, echoes or duplicated cards. Start with a form at fight start. Allow one explicit paid card to choose a new form; progress resets on change. Do not make every form change grant resources.
- Completing the objective grants **1 Mastery**, cap 3, persistent through the fight. It never automatically triggers a new stance. Specific techniques spend Mastery, at most 2 per card initially. Suggested baseline spend: +3 single-target damage or +2 Barrier per Mastery, not doubled/tripled damage to the whole hand.
- Initial trait could grant 3 Barrier on the first completed objective each turn; tune total passive value against archived baselines. Do not also keep current Fervor/exit-Mana/Primed trait.
- Forms do not individually grant additional passive rewards initially: the tagged cards and which Mastery spender you draft create the differentiation. First verify the action pattern is interesting. If different completion rewards are added, hand-cost the whole trait/objective package again.
- Mastery is earned from an actual sequence and changes how you draft different techniques. It must not become Assassin Preparation with a renamed generic 'gain resource' card engine. Most Mastery should come from objective completion, not unconditional Skills.

Strategies: **Root discipline** uses efficient guard techniques and defensive Mastery spends, without Knight's block-an-attack trigger; **Current flow** alternates roles and uses flexible hand planning; **Ember pressure** commits varied strikes to a target and spends Mastery on a strong finisher. Boss fights support all three; no kills or enemy attack intentions are required to complete objectives.

Drawback: sequencing adds UI and cognitive load. Show only the active objective with two clear progress pips and the Mastery count. Avoid long lists of hidden combo recipes. Specific two-card sequences can be too restrictive in a five-card hand; audit starter probability and common card access by hand. Never require an uncommon or rare for basic objective completion.

### Option B — Breath and Exertion

Main question: **How far can I push this turn before I need to recover?** Hard techniques build Exertion, bounded 0-4. At the cap, heavy techniques are temporarily unavailable or lose a stated bonus. Recovery techniques lower it and provide modest defense. No HP penalty is required. Light techniques remain playable at every level so the player cannot become action-locked.

Three directions: short controlled combos; high-Exertion finishers; measured recovery and sustained pressure. Spellblade stores magic to spend, while this Monk manages fatigue and recovery. This is stronger differentiation than changing Fury's percentage, but must avoid an always-identical 'hit cap, recover' script. Add several recovery timings and viable light moves. Remove Calm refunds and automatic Radiant regardless. More state/tuning work than A; preserve readability by using one bar and explicit heavy/light tags.

### Option C — Stillness and deliberate release

Main question: **When do I stop meditating and use what I have learned?** End a turn with at least one Guard technique played and no attack cards played to earn one Stillness (cap 2). A specific release technique spends it on a fixed, bounded area strike or control effect, never a global triple-damage turn. Other cards offer immediate pressure without Stillness. Three routes: patient release, short alternating pressure/recovery, and defensive control.

This fits the 'Still Flame' name but has the greatest risk of slow/stall play and overlaps Assassin's patient buildup more than A. Meditation turns must still be useful and not award permanent healing/Mana loops. Enemies that do not attack cannot offer free infinite setup. Optional one-turn windup telegraph is valuable in PvP. Lowest recommendation unless Robert specifically prefers a slower Monk.

### Recommended removal/modification map for Option A

All entries are suggestions; do not implement Monk until a direction is selected. Archive it first if it is subsequently authorized.

| Current card/package | Suggested disposition | Reason/new role |
|---|---|---|
| Kindle Fury | Modify | Signature Strike that establishes Ember or helps its objective; remove Fury multiplier |
| Still Guard | Modify | Signature Guard that selects Root; cost form utility, no Serene refund |
| Shifting Guard / Thread-Cutter | Fully rewrite | Remove double stance-change in one card; one card must not complete both sequence steps |
| Unmoved Mind / Wheel of Motion / Perfect Balance | Fully rewrite | Pay once for completed technique objective, not every form change |
| Wrath Incarnate / Surge of Ire / Rampage of Ire | Remove or replace | No automatic Fury entry or repeated switch-trigger engine |
| Rising Ire / Hushed Stillness | Modify | Paid/consumed planning or form choice, no free draw-plus-refund chain |
| Whispered Vow / Kneel / Hymn of Embers | Modify | Form setup, planning, defensive techniques; remove Mantra/Fervor counters |
| Daily Rite / Litany / Morning Prayer | Replace | Avoid passive resource clock; allow capped objective-support Auras |
| Rise Radiant / Still Flame Ascendant / Burning Litany | Replace | Fixed Mastery-spending signature techniques instead of triple damage |
| Foretold Flame / Faith Kept / Shield of Faith | Modify | Mastery spender or technique utility, no automatic-ascension threshold |
| Mantra Engine / Radiant Heart / Reading the Signs | Replace | No payoff for keeping the former Watcher resource system alive |
| Gentle Return / Serenity Incarnate | Remove or fully redesign | Repeated stance-healing/stall risks; any healing must respect guide's run-HP value and restrictions |
| Crushing Palm / Spinning Heel / Inner Sight / Open Palm | Keep theme, reprice/retag | Generic attack, debuff, defense and planning glue need not all disappear |
| Gather Breath | Consider keep/tune | Delayed resources with Consume can remain, but cannot replace technique identity |
| Thousand Palms | Keep theme, reprice | Many-hit move still interacts strongly with Might/Primed; no global 2x/3x multiplier |
| Coiled Serpent | Modify | Martial trap if desired; remove automatic Fury and avoid Knight-style full-block identity |
| Current trait and Fervor UI | Replace | Removing the old payoff cards alone leaves the defining Watcher system intact |

Retire live Fervor-to-Radiant rule usage for Monk, but do not delete shared stance machinery blindly: audit enemies, other heroes, old saves, archived fixtures and neutral/imported cards. A later chosen redesign must update migration and replay versioning just like the other four.

### Sample additions and guide-based starting costs for A

Hand-costing only; no sims run. Budgets common 1 Mana = 10, uncommon = 11.2; 2-Mana uncommon = 21.28, rare = 23.75. Damage 1, Barrier 1.2, Exposed 3, draw as an extra 3. A normal expected objective completion (1 Mastery) is provisionally worth ~2.5 points based on a later +3 damage/+2 Barrier spend with delay and usability loss. This rate is NEW and not the old Fervor=2 conversion. Cap expected objective generation at one/turn, price trait's extra Barrier separately, and verify actual Mastery supply/consumption in a four-to-six-turn fight.

| Proposed card | Cost/rarity | Draft effect | First-pass calculation |
|---|---|---|---|
| Planted Heel | 1 common Guard | 6 Barrier; if this is your first tagged technique this turn, gain 2 more | 7.2 + 2.4*0.65 = 8.76, before objective synergy |
| Turning Palm | 1 common Strike | 7 damage; if previous played card was Guard-tagged, +4 | 7 + 4*0.65 = 9.6; check trait completion too |
| Ember Step | 1 common Strike | 7 damage and 1 Exposed | 7 + 3 = 10; a different ID from other strikes enables variety |
| Read the Rhythm | 1 uncommon Skill | 4 Barrier, Foresee 3; may change form, resetting progress | 4.8 + 4 = 8.8 for main effects, leaves room for choice value; not Guard-tagged to prevent easy completion |
| Mountain Breaker | 2 uncommon Strike | 16 damage; spend up to 2 Mastery for +3 damage each | Gross cap 22, but built resource is spent; price the generating cards/trait plus spender as a package |
| Rooted Resolve | 1 uncommon Guard | 7 Barrier; optionally spend 1 Mastery for +2 Barrier and draw 1 | Base 8.4; gross spend output 13.8; consumes a resource notionally ~2.5, so requires whole-package check |
| Perfected Motion | 2 rare Aura | first completed form objective each turn also draws 1; no Mana refund | ~12 points over four useful turns from draw alone; under budget as sole effect, so add bounded support or lower cost after testing; do not call this already balanced |

Upgrades should normally add ~3 points on a 1-cost card, ~5-6 on a 2-cost; manually write upgrades rather than increasing every damage/Barrier/resource number. For Turning Palm, raise base damage 7->10 rather than raising both base and conditional bonus. For Mountain Breaker, raise base 16->21 rather than doubling the Mastery multiplier. Do not introduce repeated free card draw on every form change.

Example decision: in Current, Planted Heel then Turning Palm completes the Guard->Strike objective and earns 1 Mastery (plus any explicitly costed trait reward). You may spend it immediately on a defensive technique, keep it for Mountain Breaker, or abandon progress by switching forms before completion. The payoff is a bounded, selected technique; the rest of the hand is never globally doubled or tripled. Guard->Guard from the same repeated card ID does not complete Root; one multi-effect card is one step; echoed/autoplayed cards should not count as manually played technique steps in the initial prototype.

### Verification and art for a later Monk redesign

Test order, distinct IDs, Guard/Strike tag resolution, simultaneous-tag cards, duplicates, replay/echo/autoplay exclusion, one completion total per turn, reset on form change/end turn, target change/death in Ember, Mastery caps and spend ordering, previews and PvP visibility. Confirm there is no residual Calm-Mana refund or 10-Fervor global multiplier in the new ruleset. The sequence counter is about played player cards, not hit count.

Keep existing Monk portrait and martial card art where valid. UI requires active-form symbol, two progress pips and Mastery counter, best built in code/SVG. Potential NEW illustrations: Root footwork planted on cracked marble, Current redirection through a flowing palm sequence, Ember focused flame released through a single finishing strike. Avoid new Calm/Wrath/Divinity-style aura recolors as the main visual distinction. No Monk art generated yet because no direction has been chosen.

### Updated Shaman art reference direction

Use `assets-src/heroes/shaman.png` as the visual authority, rather than the earlier realistic/painterly concept sheet. It uses bold ink outlines, angular cel shading, ochre carved wood, ivory feather/bone details, teal cloth and luminous cyan spirits. Match its hawk staff carving, bear spirit and branch-faced Elder Tree manifestation. The Elder should be an ancient tree spirit, not a hooded human ghost. Supplied revision candidates: `shaman-totems-reference-v2.png` (three anchors) and `shaman-spirits-reference-v2.png` (three manifested commands), generated with the actual Shaman image as reference. These remain draft source strips requiring inspection, isolated exports and animation integration, not approved production assets. Preserve original source files and previous candidates.
