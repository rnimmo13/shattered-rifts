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

## Spellblade brief

Read docs/reworks/SPELLBLADE.md, the current pool, and ledger.

Preserve the enchanted Obsidian Blade: two stored enchantments; spells Imbue and selected attacks/skills Discharge. Preserve Ember/Glass/Ward effects, duplicate charges, full-slot replacement choices, actual charge spending, Recast changing rather than copying/restoring, bounded Twin Edge, between-turn persistence, and the current once-per-turn trait.

Use Imbue consistently. Do not restore Sharpened, permanent blade attack growth, Arcana/Stars, Retainers, or the Sovereign Blade.

Reach 87 eligible cards. Aim for 12 total Auras (last count 5, approximately 7 new). Include at least 8 new non-Aura utility/defense cards.

Develop six strategies:
1. Frequent single discharge: preserve the other charge for a purpose; no free discharge/refill loop.
2. Mixed-charge burst: prepare different charges and choose release timing; offer more than maximum printed damage.
3. Matching-charge specialization: distinct applications for Ember/Ember, Glass/Glass, Ward/Ward. Neither matching nor mixed is universally superior. Prefer flexible payoffs over many narrow cards.
4. Ward weaving: hold Wards for benefits or spend for immediate defense. Provide a route to victory without unlimited Barrier/healing.
5. Recast/adaptation: fix an inconvenient charge at an appropriate card/Mana cost. Effortless conversion must not erase charge choices.
6. Delayed release: holding charges offers benefits but occupies slots and delays pressure. Include useful empty-blade recovery so holding is not mandatory.

Distribute Auras across single discharge, mixed discharge, matching charges, holding, Ward defense, Recast/replacement, and a spell/weapon bridge. Avoid redundant automatic damage triggers and replacement rewards that make discharge inferior.

Account for trait draw/Barrier, Warm Anvil, Cleaving Edge, Glass Guard, Obsidian Aegis, and Emberglass Covenant. Check per-card versus per-charge triggers, multiple Auras/copies, full-slot replacement chains, echoes/replays, Ember applying only to the correct first hit, Glass remaining non-attack damage, choices/pending state, and accurate previews.

No restoring just-spent charges without a carefully bounded paid effect. Deliver burst, sustained blade play, and defensive weaving with different sequencing decisions.

