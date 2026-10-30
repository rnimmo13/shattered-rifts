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

## Assassin brief

Read docs/reworks/ASSASSIN.md, the current pool, and ledger.

Preserve the precise killer who builds Preparation, embeds physical knives, and chooses when to extract them. Preparation caps at 3 and persists; knives cap at 3 per enemy and do no automatic damage over time. Actual extraction removes knives and triggers the trait correctly. Preserve embedding, hit validation, ownership, death rules, and ordinary attacks not spending Preparation.

Do not restore generated-Dagger, Poison, or Sly/discard engines. Ordinary discard and incidental existing debuffs may support builds.

Reach 87 eligible cards. Aim for 12 total Auras (last count 3, approximately 9 new). Include at least 8 new non-Aura cards primarily serving utility or defense; these may overlap build packages.

Develop six strategies:
1. Precision execution: partial spenders and finishers; choose immediate smaller payoff versus saving Preparation. Spending all 3 must not always be correct.
2. Leave the knife: attack/control benefits while knives remain embedded, without extracting them. Bounded bonuses; no automatic knife damage each turn.
3. Selective extraction: pull one knife for a tactical effect and preserve the rest. Different cards offer damage, defense, or selection, rather than each providing all three.
4. Fieldwork: spread knives, then choose whom to finish or extract from. Core cards remain useful against one target. No automatic death spreading.
5. Shadow and timing: Hold, selection, debuffs, and setup turns align an attack window. Defense leads toward victory rather than indefinite sustain.
6. Hybrid execution: limited bridges between Preparation and knives. No reversible Preparation-to-knives-to-Preparation loop.

Distribute Auras across Preparation management, retained knives, bounded extraction, defensive sequencing, setup/finisher transitions, and group specialization. Avoid nine versions of pull-a-knife/gain-value. Use bounded or once-per-turn triggers where needed.

Extraction already includes trait damage: price it. Account for Whetted Edge and Hidden in Plain Sight. Audit repeated embed/extract/draw combinations in eight-card decks. Follow actual death/reward rules. Visible Preparation and knives must communicate Arena threats.

Deliver both planned burst and useful turns without an ideal finisher.

