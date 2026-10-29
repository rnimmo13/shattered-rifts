# The Shaman before the balance pass of 2026-10-29 (frozen; commit 1353ddd)

Reward-eligible Shaman cards: **83** (rewardPool, his own cards; basics and tokens excluded). All cards: 87.

Trait: **Spirit and Trinity**: You start with a Hawk, a Bear and a Thunderbird totem; each helps your first spell of its element each turn, and cards command them to act. The first time each turn you cast a Flame, a Frost and a Storm spell, Trinity gives you 1 Spirit. Spirit never goes down: each point adds 1 to your totems' commands, and every 2 add 1 to their help.

Starter: strike, strike, defend, spirit-call, ember-bolt, ember-bolt, frost-ward, frost-ward, gathering-storm, gathering-storm

## Totems

- **Hawk** (`hawk`): Your first Flame spell each turn: +3 to every damage and Barrier number on it. Command: 6 damage to a random enemy.
- **Bear** (`bear`): Your first Frost spell each turn: +3 to every damage and Barrier number on it. Command: gain 5 Barrier.
- **Thunderbird** (`thunderbird`): Your first Storm spell each turn: +2 to every damage and Barrier number on it (each hit). Command: 3 damage to every enemy.
- **Elder Tree** (`elder`): Planting it gives 2 Spirit. Your first elemental spell each turn: +2 to every damage and Barrier number on it. Command: gain 1 Spirit and draw a card.
- **Moon Owl** (`owl`): Whenever Trinity triggers, gain 1 Mana. Command: your next elemental spell costs 0.

## Rules as they stood

- A totem's help (TotemDef.boost) was added to every damage and Barrier op of the first spell of its element each turn: every hit, every enemy, and the ops inside an "If ...:" condition too. Any spell of the element used it up, even one with no damage or Barrier.
- "Command your Hawks" commanded every totem of the kind; Hawk Call commanded every Hawk after planting one.
- Call Again (0 Mana, a random totem) did not Consume.

## Cards

| Id | Name | Rarity | Cost | Text | Upgrade |
|---|---|---|---|---|---|
| `absolute-zero` | Absolute Zero | rare | 2 | Frost. Deal 10 damage to ALL enemies. Apply 2 Faltering to ALL enemies. | Frost. Deal 13 damage to ALL enemies. Apply 2 Faltering to ALL enemies. |
| `ancestral-exchange` | Ancestral Exchange | uncommon | 1 | Plant a totem of your choice, in a position you choose. If it replaced a totem of another kind: Gain 1 Spirit. Draw 1 card. Gain 3 Barrier. | Plant a totem of your choice, in a position you choose. If it replaced a totem of another kind: Gain 1 Spirit. Draw 1 card. Gain 6 Barrier. |
| `avalanche` | Avalanche | rare | 2 | Frost. Deal 14 damage to ALL enemies. Apply 1 Faltering to ALL enemies. | Frost. Deal 18 damage to ALL enemies. Apply 1 Faltering to ALL enemies. |
| `bears-guard` | Bear's Guard | common | 1 | Command your Bears. Gain 3 Barrier. | Command your Bears. Gain 6 Barrier. |
| `burning-aegis` | Burning Aegis | rare | 1 | At the start of your turn: Gain 3 Thorns until the enemy turn is over. | At the start of your turn: Gain 4 Thorns until the enemy turn is over. |
| `call-again` | Call Again | common | 0 | Command a random totem. | Command a random totem. Gain 2 Barrier. |
| `call-the-elder-tree` | Call the Elder Tree | rare | 1 | Plant an Elder Tree. | Plant an Elder Tree. Gain 3 Barrier. |
| `call-the-moon-owl` | Call the Moon Owl | rare | 1 | Plant a Moon Owl. Draw 1 card. | Plant a Moon Owl. Draw 2 cards. |
| `calm-before-the-storm` | Calm Before the Storm | rare | 1 | At the start of your turn: Apply 3 Sapped to ALL enemies until the end of their next turn. | At the start of your turn: Apply 4 Sapped to ALL enemies until the end of their next turn. |
| `carve-the-spirit-pole` | Carve the Spirit Pole | rare | 1 | Gain a totem position. Plant a totem of your choice. Draw 2 cards. | Gain a totem position. Plant a totem of your choice. Draw 3 cards. |
| `chain-lightning` | Chain Lightning | common | 1 | Storm. Deal 4 damage to a random enemy 3 times. | Storm. Deal 5 damage to a random enemy 3 times. |
| `charged-sky` | Charged Sky | uncommon | 2 | Storm. Deal 10 damage to ALL enemies. Apply 2 Exposed to ALL enemies. | Storm. Deal 13 damage to ALL enemies. Apply 2 Exposed to ALL enemies. |
| `chill-touch` | Chill Touch | common | 1 | Frost. Deal 6 damage. Apply 1 Faltering. | Frost. Deal 9 damage. Apply 1 Faltering. |
| `clear-spring` | Clear Spring | uncommon | 1 | Draw 3 cards. | Draw 4 cards. |
| `crystal-ward` | Crystal Ward | uncommon | 0 | Gain 10 Barrier. Consume. Opening hand. | Gain 13 Barrier. Consume. Opening hand. |
| `ember-bolt` | Ember Bolt | basic | 1 | Flame. Deal 7 damage. | Flame. Deal 10 damage. |
| `ember-lance` | Ember Lance | uncommon | 1 | Flame. Deal 10 damage. If it is the first card you play this turn: Deal 3 damage. | Flame. Deal 13 damage. If it is the first card you play this turn: Deal 3 damage. |
| `eye-of-the-tempest` | Eye of the Tempest | rare | 2 | Storm. Deal 3 damage to a random enemy 7 times. If you have a Thunderbird: Deal 3 damage to a random enemy. | Storm. Deal 4 damage to a random enemy 7 times. If you have a Thunderbird: Deal 4 damage to a random enemy. |
| `firebrand` | Firebrand | common | 1 | Flame. Deal 7 damage. If the target is Burning: Deal 4 damage. | Flame. Deal 10 damage. If the target is Burning: Deal 4 damage. |
| `flame-shield` | Flame Shield | common | 1 | Flame. Gain 5 Barrier. Gain 3 Thorns until the enemy turn is over. | Flame. Gain 8 Barrier. Gain 3 Thorns until the enemy turn is over. |
| `flame-spear` | Flame Spear | common | 2 | Flame. Deal 17 damage. | Flame. Deal 22 damage. |
| `flash-burn` | Flashpoint | rare | 1 | Flame. Deal 4 (+3 per Burn on the target) damage. Consume. | Flame. Deal 8 (+3 per Burn on the target) damage. Consume. |
| `frost-needle` | Frost Needle | common | 0 | Frost. Deal 4 damage. If the enemy means to attack: Apply 1 Faltering. | Frost. Deal 6 damage. If the enemy means to attack: Apply 1 Faltering. |
| `frost-shatter` | Ice Shatter | uncommon | 1 | Frost. Deal 7 damage. If the target is Faltering: Deal 6 damage. | Frost. Deal 10 damage. If the target is Faltering: Deal 6 damage. |
| `frost-ward` | Frost Ward | basic | 1 | Frost. Gain 5 Barrier. Apply 1 Faltering to a random enemy. | Frost. Gain 8 Barrier. Apply 1 Faltering to a random enemy. |
| `frostbound` | Frostbound | rare | 1 | Whenever you put a debuff on an enemy: Gain 3 Barrier. | Whenever you put a debuff on an enemy: Gain 4 Barrier. |
| `frozen-grasp` | Frozen Grasp | uncommon | 1 | Frost. Apply 2 Faltering. Gain 4 Barrier. | Frost. Apply 2 Faltering. Gain 7 Barrier. |
| `gale-call` | Gale Call | common | 1 | Storm. Deal 5 damage to ALL enemies. Draw 1 card. | Storm. Deal 8 damage to ALL enemies. Draw 1 card. |
| `gale-strike` | Gale Strike | common | 1 | Deal 8 damage. This card costs 1 less for the rest of the fight. | Deal 11 damage. This card costs 1 less for the rest of the fight. |
| `gathering-storm` | Gathering Storm | basic | 1 | Storm. Deal 3 damage to ALL enemies. Every copy of this card gains 2 damage for the rest of the fight. | Storm. Deal 4 damage to ALL enemies. Every copy of this card gains 3 damage for the rest of the fight. |
| `glacial-fortress` | Glacial Fortress | rare | 3 | Frost. Gain 22 Barrier. Apply 2 Faltering to ALL enemies. | Frost. Gain 28 Barrier. Apply 2 Faltering to ALL enemies. |
| `glacier-guard` | Glacier Guard | uncommon | 1 | Frost. Gain 6 Barrier. Next turn, gain 4 Barrier. | Frost. Gain 8 Barrier. Next turn, gain 6 Barrier. |
| `great-spirits-call` | Great Spirit's Call | rare | 2 | Command every totem you have. Gain 5 Barrier. | Command every totem you have. Gain 9 Barrier. |
| `harmony` | Harmony | rare | 1 | Whenever Trinity triggers: Gain 6 Barrier. Draw 1 card. | Whenever Trinity triggers: Gain 9 Barrier. Draw 1 card. |
| `hawks-dive` | Hawk's Dive | common | 1 | Command your Hawks. Gain 3 Barrier. | Command your Hawks twice. |
| `heart-of-the-pyre` | Heart of the Pyre | rare | 1 | Whenever you play a Flame spell: Deal 5 damage to a random enemy. | Whenever you play a Flame spell: Deal 6 damage to a random enemy. |
| `hoarfrost` | Hoarfrost | common | 1 | Frost. Gain 5 Barrier. Apply 1 Faltering to ALL enemies. | Frost. Gain 8 Barrier. Apply 1 Faltering to ALL enemies. |
| `ice-mirror` | Ice Mirror | uncommon | 1 | Frost. Gain 6 Barrier. Until your next turn, attack damage your Barrier soaks is dealt back to the attacker. | Frost. Gain 9 Barrier. Until your next turn, attack damage your Barrier soaks is dealt back to the attacker. |
| `ice-wall` | Ice Wall | uncommon | 2 | Frost. Gain 16 Barrier. | Frost. Gain 20 Barrier. |
| `immolate` | Immolate | uncommon | 2 | Flame. Deal 13 damage. Apply 4 Burn. | Flame. Deal 17 damage. Apply 4 Burn. |
| `inferno` | Inferno | rare | 3 | Flame. Deal 30 damage. Apply 3 Burn. | Flame. Deal 38 damage. Apply 3 Burn. |
| `ironbark` | Ironbark | uncommon | 1 | Gain 13 Barrier. Add 2 Wounds to your discard pile. | Gain 17 Barrier. Add 2 Wounds to your discard pile. |
| `kindle` | Kindle | common | 0 | Flame. Deal 4 damage. If you have a Hawk: Deal 2 damage. | Flame. Deal 6 damage. If you have a Hawk: Deal 2 damage. |
| `lightning-rod` | Lightning Rod | uncommon | 1 | Whenever you play a Storm spell: Deal 3 damage to a random enemy. | Whenever you play a Storm spell: Deal 4 damage to a random enemy. |
| `maelstrom` | Maelstrom | rare | 2 | Storm. Deal 8 damage 2 times to ALL enemies. | Storm. Deal 10 damage 2 times to ALL enemies. |
| `permafrost` | Hail Rite | uncommon | 1 | At the end of your turn: If you have a Bear: Gain 4 Barrier. | At the end of your turn: If you have a Bear: Gain 5 Barrier. |
| `phoenix-feather` | Phoenix Feather | rare | 1 | Flame. Gain 1 Reverb. Draw 1 card. | Flame. Gain 1 Reverb. Draw 2 cards. |
| `prism-spell` | Prism Spell | uncommon | 1 | Prism (for Trinity and your totems' help, it counts as an element you have not cast this turn). Deal 3 damage. Gain 3 Barrier. Deal 1 damage to ALL enemies. | Prism (for Trinity and your totems' help, it counts as an element you have not cast this turn). Deal 5 damage. Gain 4 Barrier. Deal 1 damage to ALL enemies. |
| `pyre-ward` | Pyre Ward | uncommon | 2 | Flame. Gain 12 Barrier. Gain 4 Thorns until the enemy turn is over. | Flame. Gain 15 Barrier. Gain 5 Thorns until the enemy turn is over. |
| `raise-the-pole` | Raise the Pole | uncommon | 1 | Gain a totem position. Gain 5 Barrier. Draw 1 card. | Gain a totem position. Gain 8 Barrier. Draw 1 card. |
| `rally-the-spirits` | Rally the Spirits | uncommon | 1 | Command a totem of your choice twice. | Command a totem of your choice twice. Gain 4 Barrier. |
| `read-the-winds` | Read the Winds | common | 1 | Foresee 3. Gain 4 Barrier. | Foresee 3. Gain 7 Barrier. |
| `rime-shield` | Rime Shield | common | 1 | Frost. Gain 7 Barrier. If you have a Bear: Gain 2 Barrier. | Frost. Gain 10 Barrier. If you have a Bear: Gain 2 Barrier. |
| `rune-carapace` | Bark Carapace | rare | 1 | At the start of your turn: Gain 1 (+1 per totem you have) Barrier. | At the start of your turn: Gain 1 (+1 per totem you have) Barrier. Opening hand. |
| `searing-lash` | Searing Lash | common | 1 | Flame. Deal 7 damage. Apply 2 Burn. | Flame. Deal 10 damage. Apply 2 Burn. |
| `shamans-insight` | Shaman's Insight | uncommon | 1 | Draw 1 card. Gain 3 Barrier. Your next Flame, Frost, Storm or Prism spell costs 0. | Draw 2 cards. Gain 3 Barrier. Your next Flame, Frost, Storm or Prism spell costs 0. |
| `skybreaker` | Skybreaker | uncommon | 3 | Deal 26 damage. If this is fatal: Gain 1 Mana. | Deal 34 damage. If this is fatal: Gain 1 Mana. |
| `smoke-offering` | Smoke Offering | uncommon | 1 | Consume 1 card. Next turn, gain 2 extra Mana. Draw 1 card. | Consume 1 card. Next turn, gain 2 extra Mana. Draw 2 cards. |
| `smoulder` | Smoulder | uncommon | 1 | Whenever you play a Flame spell: Apply 3 Burn to a random enemy. | Whenever you play a Flame spell: Apply 4 Burn to a random enemy. |
| `spark-cast` | Hawk Call | common | 1 | Plant a Hawk. Command your Hawks. Gain 2 Barrier. | Plant a Hawk. Command your Hawks. Gain 5 Barrier. |
| `spirit-call` | Spirit Call | basic | 1 | Command a totem of your choice. Gain 2 Barrier. | Command a totem of your choice. Gain 5 Barrier. |
| `spirit-chorus` | Spirit Chorus | rare | 1 | At the start of your turn: Command a random totem. | At the start of your turn: Command a random totem. Opening hand. |
| `spirit-lance` | Spirit Lance | uncommon | 1 | Flame. Deal 7 (+1 per Spirit) damage. | Flame. Deal 10 (+1 per Spirit) damage. |
| `spirit-memory` | Spirit Memory | common | 1 | Gain 6 Barrier. Return a random card from your discard pile to your hand. | Gain 9 Barrier. Return a random card from your discard pile to your hand. |
| `spirit-surge` | Spirit Surge | uncommon | 1 | Gain 1 Spirit. Gain 5 Barrier. | Gain 1 Spirit. Gain 8 Barrier. |
| `spirit-vision` | Spirit Vision | rare | 1 | Draw 3 cards. Gain 1 Spirit. Consume. | Draw 4 cards. Gain 1 Spirit. Consume. |
| `spirit-walk` | Spirit Walk | rare | 1 | Gain 2 Spirit. Draw 2 cards. Consume. | Gain 2 Spirit. Draw 3 cards. Consume. |
| `spiritstorm` | Spiritstorm | rare | 1 | Deal 6 (+1 per Spirit) damage to ALL enemies. | Deal 9 (+1 per Spirit) damage to ALL enemies. |
| `spreading-flames` | Wildfire | uncommon | 1 | Flame. Deal 9 damage. Double the Burn on the target (at most +10). Consume. | Flame. Deal 12 damage. Double the Burn on the target (at most +10). Consume. |
| `squall` | Squall | uncommon | 1 | Storm. Deal 2 damage to a random enemy 6 times. | Storm. Deal 2 damage to a random enemy 8 times. |
| `static-crackle` | Static Crackle | common | 0 | Storm. Deal 4 damage to ALL enemies. | Storm. Deal 5 damage to ALL enemies. |
| `static-veil` | Static Veil | uncommon | 1 | Storm. Gain 6 Barrier. Apply 3 Sapped to ALL enemies until the end of their next turn. | Storm. Gain 9 Barrier. Apply 3 Sapped to ALL enemies until the end of their next turn. |
| `stone-skin` | Stone Skin | common | 1 | Gain 9 Barrier. | Gain 12 Barrier. |
| `storm-front` | Storm Front | uncommon | 1 | Storm. Deal 3 damage 2 times to ALL enemies. Draw 1 card. | Storm. Deal 4 damage 2 times to ALL enemies. Draw 1 card. |
| `storm-sovereign` | Storm Sovereign | rare | 1 | Whenever you command a totem: Deal 4 damage to ALL enemies. | Whenever you command a totem: Deal 5 damage to ALL enemies. |
| `superstorm` | Superstorm | rare | 3 | Storm. Deal 6 damage 4 times to ALL enemies. | Storm. Deal 8 damage 4 times to ALL enemies. |
| `tempest-call` | Tempest Call | uncommon | 1 | Storm. Gather 2 (Gathering Storm gains 2 damage). Draw 1 card. | Storm. Gather 3 (Gathering Storm gains 3 damage). Draw 1 card. |
| `thunder-roost` | Thunder Roost | uncommon | 1 | At the start of your turn: If you have a Thunderbird: Deal 3 damage to ALL enemies. | At the start of your turn: If you have a Thunderbird: Deal 4 damage to ALL enemies. |
| `thunderbird-call` | Thunderbird Call | common | 1 | Plant a Thunderbird. Deal 4 damage to ALL enemies. Gain 3 Barrier. | Plant a Thunderbird. Deal 6 damage to ALL enemies. Gain 4 Barrier. |
| `thunderbirds-cry` | Thunderbird's Cry | common | 1 | Command your Thunderbirds. Deal 3 damage to ALL enemies. Draw 1 card. | Command your Thunderbirds. Deal 5 damage to ALL enemies. Draw 1 card. |
| `thunderclap` | Thunderclap | uncommon | 2 | Storm. Deal 15 damage to ALL enemies. | Storm. Deal 19 damage to ALL enemies. |
| `tidecaller` | Tidecaller | common | 1 | Gain 7 Barrier. Next turn, gain 1 extra Mana. | Gain 10 Barrier. Next turn, gain 1 extra Mana. |
| `tune-the-lattice` | Communion | uncommon | 1 | Gain 1 Spirit. Draw 1 card. Gain 3 Barrier. | Gain 1 Spirit. Draw 2 cards. Gain 3 Barrier. |
| `twin-cinders` | Twin Cinders | common | 1 | Flame. Deal 5 damage 2 times. | Flame. Deal 7 damage 2 times. |
| `wardkeepers-pact` | Bear Call | common | 1 | Plant a Bear. Gain 7 Barrier. | Plant a Bear. Gain 10 Barrier. |
| `wind-wall` | Wind Wall | common | 1 | Storm. Gain 5 Barrier. Apply 2 Sapped to ALL enemies until the end of their next turn. | Storm. Gain 8 Barrier. Apply 2 Sapped to ALL enemies until the end of their next turn. |
| `winters-embrace` | Winter's Embrace | rare | 2 | Frost. Gain 12 Barrier. Apply 2 Faltering to ALL enemies. | Frost. Gain 15 Barrier. Apply 2 Faltering to ALL enemies. |
