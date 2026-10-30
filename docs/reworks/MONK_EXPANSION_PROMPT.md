# Card-pool expansion prompt

Complete this character’s card-pool expansion in D:\Code\ShatteredRifts. Apply the character-specific brief below together with all these instructions.

## Scope and preparation

Read CLAUDE.md, applicable AGENTS.md instructions, the character’s current cards, tests, rework document, costing ledger, docs/14_CARD_COSTING.md, and docs/11_PVP.md. Current implementation is authoritative where documents disagree.

Target **87 distinct, class-owned, reward-eligible cards**. Exclude basics, upgrades, generated-only cards, retired cards, and shared neutral cards. Verify eligibility through rewardPool rather than simply counting non-basic definitions. The last review found 51 eligible cards per character, implying 36 additions. Recount first and adjust additions to reach 87. Preserve work already completed.

Complete the entire expansion in this task. Do not stop after a first batch or add filler to satisfy the count. Before editing existing cards or rules, save a dated balance snapshot. Preserve unrelated uncommitted changes.

## Design quality

Keep the existing identity and resource rules. Expand the decisions within that identity. Each proposed card needs a clear role, a reason to choose it over an existing card, a deck-building or sequencing decision, explicit base and upgraded effects, and a hand-calculated price.

Avoid near-duplicates, strict upgrades at equal cost/rarity, excessive conditions, builds requiring rares to function, excessive draw/resource generation, unlimited healing, defensive stalling, free loops, and generic permanent-stat engines that erase identity.

Supply card selection and controlled draw, timing tools such as Hold where appropriate, defense and debuff management, resource management, useful group options, and progress against a single boss or human opponent. Utility supports decisions rather than making every hand perfect.

## Auras

Follow the character-specific target. Count actual Aura cards excluding upgrades. Give Auras different strategic jobs, with accessible uncommon engines and specialized rare payoffs. Avoid multiple versions of generic damage/draw whenever the main mechanic triggers. Price expected trigger counts and check multiple copies and optimized combinations.

## Design and implementation

Create a complete expansion table in the character’s design document before implementation: name, rarity, Mana, type, effects, upgrade, role, decision, point calculation, and combo risks. Then implement the whole expansion without waiting for approval on routine card choices.

Use generic DSL behavior, never card-ID special cases. Reuse operations where suitable; add small generic operations only for meaningful decisions. Do not change core caps, trait, starter, or combat timing merely to simplify implementation.

## Balance and Arena

Use docs/14_CARD_COSTING.md and character rates. Evaluate ordinary mid-fight output, reliable specialized conditions, optimized burst/defense, resource competition, multiple Aura copies, eight-card minimum decks, actual allowed card copies, upgrades, and existing resource engines. Do not discount an almost-permanent condition as rare. Calculate legal turns with actual Mana and cards; never spend the same resource twice in a calculation.

Do not run balance simulations unless separately authorized. Use hand calculations and focused deterministic scenarios.

Human opponents may attack, defend, or develop their board. Core builds must not require AI intents or kills. Do not predict hidden information or add reaction prompts. Preserve ownership, server authority, deterministic replays, visible resources, and counterplay. Check single-hero fights and supported companions. Opponents declining to attack must not disable the whole class.

## Documentation, art, validation, delivery

Update the rework document, costing ledger, generated card list where required, and changelog. List art needs and use fallback art; do not generate artwork.

Add meaningful scenarios for every new card and upgrade and generic rules tests for new behavior. Cover caps, timing, ownership, dead targets, multiple copies, and loops. Run relevant tests and required project checks.

Report final eligible count, cards added/modified, Aura count, utility coverage, distinct builds and decisions, costing/Arena findings, checks and results, art needs, and remaining playtesting questions. Proceed through complete implementation.

## Monk brief

Read docs/reworks/MONK.md, the current pool, and ledger. Verify the trait from code; do not apply an older proposed trait change.

Preserve martial techniques completed through deliberate Root, Current, and Ember sequencing. Preserve current objectives and starting form; once-per-turn completion across all changes; Mastery cap 3; at most 2 Mastery spent per card; distinct-card requirements with upgrades the same identity; Ember same-target requirement; technique tags; untagged cards; echoes and plays outside hand; form changes resetting progress but not completion limit.

Do not restore damage-doubling Fury, Mana-on-exit Serene, Fervor/Radiant, or entry/exit resource loops. Forms are objectives, not global multipliers.

Reach 87 eligible cards. Aim for 12 total Auras (last count 6, approximately 6 new). Include at least 8 new non-Aura utility/defense cards.

Develop six strategies:
1. Root discipline: distinct defensive techniques with a route to damage. Avoid stall and the Knight’s full-block/Opening mechanic.
2. Current sequencing: defense into offense, selection/Hold to assemble pairs; order matters without an automatic universal sequence.
3. Ember commitment: two distinct affordable strikes at one target; meaningful target choice. Check death and target changes.
4. Mastery conservation: useful benefits at 1–2 as well as 3. Sitting at the cap must not make spending a mistake.
5. Tactical spending: small offensive, defensive, utility spenders compete for limited Mastery. No card exceeds current spending limit.
6. Adaptive forms: limited flexible changes/selection adapt to hand while preserving progress-reset cost. No resources from switching for its own sake.

Distribute Auras across Root defense leading to pressure, Current’s ordered pair, Ember commitment, conserving Mastery, spending Mastery, and flexible sequencing/recovery. Avoid redundant generic completion rewards. Never bypass once-per-turn completion.

Account for Perfected Motion, Grandmaster’s Patience, Unbroken Calm, Breath Between Blows, The River Turns, and Unmoved Mind. Verify technique timing, newly earned Mastery resolution, copies/upgrades not bypassing distinct IDs, echoes adding no steps, untagged utility neither advancing nor breaking progress, free techniques/draw not cycling, no second completion after changes, and Ember targeting in Arena including companions.

Maintain a healthy mix of Defensive, Striking, and untagged utility. Not every useful card advances progress. All forms work against one boss/human hero, with choices between completing, changing, saving, and spending.

