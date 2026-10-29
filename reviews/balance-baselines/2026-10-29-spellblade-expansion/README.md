# Spellblade before the balance pass of 2026-10-29 (frozen; commit 780256c)

Reward-eligible Spellblade cards: **51** (rewardPool, the class's own cards; basics and tokens excluded). All cards: 53.

Trait: **Glass and Ember**: Start every fight with a Ward enchantment on your Obsidian Blade. The first time each turn you Imbue, draw 1 card and gain 2 Barrier.

Starter: strike, strike, strike, strike, defend, defend, defend, defend, ember-inscription, obsidian-cut

## Rules as they stood

- Two enchantment positions (ENCHANT_SLOTS 2), duplicates allowed; Ember 3 on the first hit, Glass 2 to all after the attack, Ward 3 Barrier at once
- discharge(1) asks when the two differ, discharge(2) spends both; no kind-specific discharge yet
- Trait Glass and Ember: a Ward at the start; the first Imbue each turn draws 1 and gives 2 Barrier
- 5 Auras: Warm Anvil, Cleaving Edge, Glass Guard, Emberglass Covenant, Obsidian Aegis

## Cards

| Id | Name | Rarity | Cost | Text | Upgrade |
|---|---|---|---|---|---|
| `astral-pulse` | Shard Pulse | common | 1 | Discharge an enchantment. Deal 7 damage to ALL enemies. | Discharge an enchantment. Deal 9 damage to ALL enemies. |
| `banked-embers` | Banked Embers | uncommon | 1 | Imbue Ember. Next turn, gain 1 extra Mana. Gain 1 Holdfast. Gain 3 Barrier. | Imbue Ember. Next turn, gain 1 extra Mana. Gain 1 Holdfast. Gain 6 Barrier. |
| `big-bang` | Magma Surge | rare | 0 | Gain 1 Mana. Imbue Ember. Consume. | Gain 1 Mana. Imbue Ember. Consume. Opening hand. |
| `bladewall` | Bladewall | uncommon | 2 | Gain 14 Barrier. Imbue Ward. | Gain 18 Barrier. Imbue Ward. |
| `call-the-blade` | Call the Blade | uncommon | 1 | Draw cards until you draw a card that is not a Skill. Imbue Glass. Gain 3 Barrier. | Draw cards until you draw a card that is not a Skill. Imbue Glass. Gain 6 Barrier. |
| `cleaving-edge` | Cleaving Edge | rare | 1 | Whenever you Discharge: Deal 4 damage to ALL enemies. | Whenever you Discharge: Deal 5 damage to ALL enemies. |
| `comet` | Lava Bomb | rare | 3 | Discharge both enchantments. Deal 20 damage. Apply 2 Faltering. Apply 2 Exposed. | Discharge both enchantments. Deal 26 damage. Apply 2 Faltering. Apply 2 Exposed. |
| `cosmic-lance` | Obsidian Lance | common | 1 | Deal 5 (+3 per enchantment on your blade) damage. | Deal 8 (+3 per enchantment on your blade) damage. |
| `crownfall` | Crownfall | uncommon | 2 | Discharge both enchantments. Deal 17 damage. | Discharge both enchantments. Deal 22 damage. |
| `devastate` | Molten Ruin | uncommon | 3 | Discharge both enchantments. Deal 26 damage. | Discharge both enchantments. Deal 34 damage. |
| `dying-star` | Dying Ember | rare | 2 | Discharge an enchantment. Deal 10 damage to ALL enemies. Apply 6 Sapped to ALL enemies until the end of their next turn. | Discharge an enchantment. Deal 12 damage to ALL enemies. Apply 8 Sapped to ALL enemies until the end of their next turn. |
| `echoing-blade` | Echoing Blade | rare | 0 | Gain 1 Twin Edge until the end of your turn. Draw 1 card. Gain 3 Barrier. Consume. | Gain 1 Twin Edge until the end of your turn. Draw 1 card. Gain 6 Barrier. Consume. |
| `ember-cache` | Ember Cache | common | 1 | Imbue Ember. Draw 2 cards. | Imbue Ember. Draw 3 cards. |
| `ember-inscription` | Ember Inscription | basic | 1 | Deal 5 damage. Imbue Ember. | Deal 8 damage. Imbue Ember. |
| `emberglass-covenant` | Emberglass Covenant | rare | 1 | The first time each turn you Discharge two different enchantments at once: Next turn, gain 1 extra Mana. Gain 6 Barrier. | The first time each turn you Discharge two different enchantments at once: Next turn, gain 1 extra Mana. Gain 9 Barrier. |
| `faint-glow` | Faint Ember | common | 0 | Imbue Ember. Foresee 2. Consume. | Imbue Ember. Foresee 3. Consume. |
| `final-shatter` | Final Shatter | uncommon | 3 | Deal 26 damage. If this is fatal: Imbue Ember if your blade has room. Imbue Glass if your blade has room. | Deal 34 damage. If this is fatal: Imbue Ember if your blade has room. Imbue Glass if your blade has room. |
| `forged-in-fury` | Forged in Fury | common | 1 | Deal 7 damage. Imbue Ember. | Deal 10 damage. Imbue Ember. |
| `fracture-script` | Fracture Script | common | 1 | Deal 7 damage. Imbue Glass. | Deal 10 damage. Imbue Glass. |
| `gamma-burst` | Glass Burst | uncommon | 1 | Discharge an enchantment. Deal 5 damage. Apply 1 Faltering. Apply 1 Exposed. | Discharge an enchantment. Deal 8 damage. Apply 1 Faltering. Apply 1 Exposed. |
| `glass-requiem` | Glass Requiem | rare | 2 | Discharge both enchantments. Deal 14 damage. If the enchantments discharged is 1 or more: Deal damage equal to 3 times the enchantments discharged to ALL enemies. | Discharge both enchantments. Deal 19 damage. If the enchantments discharged is 1 or more: Deal damage equal to 3 times the enchantments discharged to ALL enemies. |
| `glass-veil` | Glass Veil | common | 2 | Gain 11 Barrier. Next turn, gain 5 Barrier. | Gain 13 Barrier. Next turn, gain 7 Barrier. |
| `glass-wall` | Glass Wall | uncommon | 1 | Gain 5 Barrier. Imbue Ward. Foresee 1. | Gain 8 Barrier. Imbue Ward. Foresee 1. |
| `glassward` | Glassward | common | 1 | Gain 5 Barrier. Imbue Ward. | Gain 8 Barrier. Imbue Ward. |
| `gleam` | Glint | common | 1 | Deal 7 damage. Draw 1 card. Put a card from your hand on top of your draw pile. | Deal 10 damage. Draw 1 card. Put a card from your hand on top of your draw pile. |
| `heirloom-maul` | Heirloom Maul | rare | 2 | Discharge both enchantments. Deal 16 damage. Draw cards equal to the enchantments discharged. | Discharge both enchantments. Deal 21 damage. Draw cards equal to the enchantments discharged. |
| `hollow-gaze` | Hollow Gaze | common | 1 | Gain 7 Barrier. Put a random card from your discard pile on top of your draw pile. | Gain 10 Barrier. Put a random card from your discard pile on top of your draw pile. |
| `humble` | Humble | common | 0 | Apply 1 Faltering. Apply 1 Exposed. Consume. | Apply 1 Faltering. Apply 1 Exposed. |
| `mirror-glass` | Mirror Glass | uncommon | 2 | Discharge an enchantment. Gain 11 Barrier. Until your next turn, attack damage your Barrier soaks is dealt back to the attacker. | Discharge an enchantment. Gain 15 Barrier. Until your next turn, attack damage your Barrier soaks is dealt back to the attacker. |
| `molten-weight` | Molten Weight | common | 1 | Deal 7 damage to ALL enemies. Apply 1 Sapped to ALL enemies until the end of their next turn. | Deal 9 damage to ALL enemies. Apply 1 Sapped to ALL enemies until the end of their next turn. |
| `obsidian-aegis` | Obsidian Aegis | rare | 1 | At the end of your turn: Gain Barrier equal to 3 times the enchantments on your blade. | At the end of your turn: Gain Barrier equal to 4 times the enchantments on your blade. |
| `obsidian-cut` | Obsidian Cut | basic | 1 | Discharge an enchantment. Deal 6 damage. | Discharge an enchantment. Deal 9 damage. |
| `obsidian-flurry` | Obsidian Flurry | common | 2 | Discharge an enchantment. Deal 6 damage 3 times. | Discharge an enchantment. Deal 8 damage 3 times. |
| `overcharge-edge` | Overcharge Edge | uncommon | 1 | Discharge both enchantments. Deal 4 (+4 per enchantment discharged) damage. | Discharge both enchantments. Deal 7 (+4 per enchantment discharged) damage. |
| `pale-beacon` | Pale Ward | common | 1 | Gain 8 Barrier. If your blade holds a Ward: Draw 1 card. | Gain 11 Barrier. If your blade holds a Ward: Draw 1 card. |
| `parry` | Glass Guard | uncommon | 1 | Whenever you Discharge: Gain 3 Barrier. | Whenever you Discharge: Gain 4 Barrier. |
| `radiance` | Shard Storm | uncommon | 1 | Discharge an enchantment. Deal 4 damage 2 times to ALL enemies. | Discharge an enchantment. Deal 5 damage 2 times to ALL enemies. |
| `recast-the-edge` | Recast the Edge | uncommon | 1 | Your newest enchantment becomes another kind (your choice). Gain 6 Barrier. Draw 1 card. | Your newest enchantment becomes another kind (your choice). Gain 9 Barrier. Draw 1 card. |
| `scheme` | Scheme | uncommon | 1 | Next turn, draw 2 extra cards. Imbue Glass. Gain 2 Barrier. | Next turn, draw 3 extra cards. Imbue Glass. Gain 2 Barrier. |
| `seven-shards` | Seven Shards | rare | 2 | Discharge both enchantments. Deal 3 damage 7 times. | Discharge both enchantments. Deal 4 damage 7 times. |
| `shard-strike` | Shard Strike | uncommon | 1 | Deal 8 damage. Imbue Glass. | Deal 11 damage. Imbue Glass. |
| `shatterguard` | Shatterguard | uncommon | 1 | Discharge both enchantments. Gain Barrier equal to 5 times the enchantments discharged. | Discharge both enchantments. Gain 2 (+5 per enchantment discharged) Barrier. |
| `skybolt` | Spellbolt | common | 1 | Discharge an enchantment. Deal 6 damage. Draw 1 card. | Discharge an enchantment. Deal 9 damage. Draw 1 card. |
| `sovereign-strike` | Tyrant Strike | uncommon | 2 | Discharge an enchantment. Deal 15 damage. Next turn, gain 1 extra Mana. | Discharge an enchantment. Deal 19 damage. Next turn, gain 1 extra Mana. |
| `star-barrier` | Glass Barrier | common | 1 | Discharge an enchantment. Gain 7 Barrier. | Discharge an enchantment. Gain 10 Barrier. |
| `stellar-wind` | Ash Wind | uncommon | 1 | Draw 3 cards. Put a card from your hand on top of your draw pile. | Draw 4 cards. Put a card from your hand on top of your draw pile. |
| `sunstrike` | Emberstrike | common | 1 | Deal 9 damage. If your blade has no enchantments: Imbue Ember. | Deal 12 damage. If your blade has no enchantments: Imbue Ember. |
| `supernova` | Cataclysm | rare | 1 | Discharge both enchantments. Deal 9 damage to ALL enemies. | Discharge both enchantments. Deal 12 damage to ALL enemies. |
| `twin-sigils` | Twin Sigils | rare | 1 | Imbue Ember. Imbue Ward. Gain 4 Barrier. Draw 1 card. | Imbue Ember. Imbue Ward. Gain 7 Barrier. Draw 1 card. |
| `unbreakable-crown` | Unbreakable Crown | rare | 2 | Gain 16 Barrier. Imbue Ward. Imbue Ward. | Gain 20 Barrier. Imbue Ward. Imbue Ward. |
| `ward-weave` | Weave the Ward | uncommon | 1 | Imbue Ward. Gain Barrier equal to 3 times the Wards on your blade. Draw 1 card. | Imbue Ward. Gain Barrier equal to 4 times the Wards on your blade. Draw 1 card. |
| `warm-anvil` | Warm Anvil | uncommon | 1 | At the start of your turn: Imbue Ember if your blade has room. Gain 2 Barrier. | At the start of your turn: Imbue Ember if your blade has room. Gain 3 Barrier. |
| `whetstone` | Etch the Edge | common | 1 | Imbue Ember. Imbue Glass. Gain 5 Barrier. | Imbue Ember. Imbue Glass. Gain 8 Barrier. |
