# Card art needed: the Spellblade rework (2026-10-31)

**39 new pictures in 5 sheets**, for the merged card list in `docs/reworks/SPELLBLADE_SPELL_POWER_MERGED.md`. The 50 cards the rework keeps hold their art (the eight whose jobs changed most were checked by eye and still suit: `whetstone`, `final-shatter`, `collapsing-star`, `hammer-and-anvil`, `glass-armory`, `pillar-of-light`, `gravity-well`, `orion`). Upgraded cards share their base card's art.

**Done and wired in (2026-10-31):** all 39 pictures are in `apps/web/public/art/cards/` and the manifest. The four sheets have no outer navy border, so `pack-cards.ps1` cannot read their gutters; they were cut by their measured gutters into `assets-src/cards/individual/<card id>.png`, which that script exports as overrides. ChatGPT's record of the prompts is in `assets-src/cards/spellblade-spell-power/`.

## How to use this

1. For each sheet, attach both style images and paste the prompt:
   - `apps/web/public/art/cards/collapsing-star.jpg` (a scene with no figure)
   - `apps/web/public/art/cards/hammer-and-anvil.jpg` (the Spellblade and her sword)
2. Check that the pictures are separate, in the right order, with no text. If one is wrong, regenerate the whole sheet: they are cut by position.
3. Save each sheet as `assets-src/cards/<sheet name>.png`, for example `spellblade-sp-01.png`.

A single picture also works: 4:3 landscape, saved as `assets-src/cards/individual/<card id>.png`, using the "Draw" text below.

## The cards

| Sheet | # | Card | Id | Rarity | Type | What it does |
|---|---|---|---|---|---|---|
| 01 | 1 | Storm of Glass | `storm-of-glass` | Rare | Attack, Sword | A storm of many sword hits |
| 01 | 2 | Thousand Shards | `thousand-shards` | Rare | Attack, Sword | Spends the blade's stored power for one hit per point |
| 01 | 3 | Soul of Steel | `soul-of-steel` | Rare | Skill | She gains lasting strength |
| 01 | 4 | Whispering Edge | `whispering-edge` | Rare | Aura | Every sword hit deals more |
| 01 | 5 | Tempered Focus | `tempered-focus` | Rare | Aura | Each turn her next attack hits harder |
| 01 | 6 | Crucible Heart | `crucible-heart` | Rare | Aura | Her growing enchantments grow faster |
| 01 | 7 | Measured Ruin | `measured-ruin` | Rare | Aura | Her first big spell each turn is much stronger |
| 01 | 8 | Rupture Script | `rupture-script` | Rare | Skill, Spell, curse | A huge number of cracks on one enemy |
| 01 | 9 | Breaking Point | `breaking-point-hex` | Rare | Skill, Spell, curse | A blast, then more cracks |
| 02 | 1 | Growing Crucible | `growing-crucible` | Uncommon | Skill | Stores power, and stores more every time |
| 02 | 2 | Measured Recharge | `measured-recharge` | Uncommon | Skill | Refills the blade after a spell |
| 02 | 3 | Last Ember | `last-ember` | Uncommon | Skill | Emergency recovery when she is empty |
| 02 | 4 | Crosscut | `crosscut` | Uncommon | Attack, Sword | A spell straight into sword strikes |
| 02 | 5 | Fault Piercer | `fault-piercer` | Uncommon | Attack, Sword | Sword hits that widen an enemy's cracks |
| 02 | 6 | Quenched Edge | `quenched-edge` | Uncommon | Aura | Spending power primes her next attack |
| 02 | 7 | Patient Edge | `patient-edge-aura` | Uncommon | Aura | Rewards holding power and not spending it |
| 02 | 8 | Controlled Release | `controlled-release` | Uncommon | Attack, Spell | A careful spell that keeps some power back |
| 02 | 9 | Stress the Glass | `stress-the-glass` | Uncommon | Skill, Spell, curse | Pours stored power into cracks |
| 03 | 1 | Fault Memory | `fault-memory` | Uncommon | Skill, Spell, curse | A curse that cracks deeper each use |
| 03 | 2 | Carry the Fault | `carry-the-fault` | Uncommon | Skill, Spell, curse | Moves cracks from one enemy to another |
| 03 | 3 | Deep Fault | `deep-fault` | Uncommon | Skill, Spell, curse | Every shatter hits harder for the fight |
| 03 | 4 | Fault Reader | `fault-reader` | Uncommon | Aura | Learns from each shatter |
| 03 | 5 | Deepening Fault | `deepening-fault` | Uncommon | Aura | Her shatters grow stronger every turn |
| 03 | 6 | Afterglow | `afterglow` | Uncommon | Aura | Comfort and a card after spending everything |
| 03 | 7 | Recenter | `recenter` | Uncommon | Skill | Draws cards after using sword and spell |
| 03 | 8 | Empty Crucible | `empty-crucible` | Common | Skill | Refills more when empty |
| 03 | 9 | Etching Edge | `etching-edge` | Common | Attack, Sword | Sword hits that leave small cracks |
| 04 | 1 | Rift Sweep | `rift-sweep` | Common | Attack, Sword | A wide sword sweep at every enemy |
| 04 | 2 | Glass Needle | `glass-needle` | Common | Attack, Sword | A quick, cheap stab |
| 04 | 3 | Guarded Cut | `guarded-cut` | Common | Attack, Sword | A cut with a guard |
| 04 | 4 | Tempered Bolt | `tempered-bolt` | Common | Attack, Spell | A plain spell that works when she is out of power |
| 04 | 5 | Glassbrand | `glassbrand` | Common | Attack, Spell | A hit that leaves cracks |
| 04 | 6 | Faultline Hex | `faultline-hex` | Common | Skill, Spell, curse | Her basic curse |
| 04 | 7 | Spreading Fault | `spreading-fault` | Common | Skill, Spell, curse | Cracks across every enemy |
| 04 | 8 | Pressure Point | `pressure-point-hex` | Common | Skill, Spell, curse | A precise touch that can set off a shatter |
| 04 | 9 | Glass Prison | `glass-prison` | Common | Skill, Spell, curse | Barrier and a few cracks |
| 05 | 1 | Crack the Shell | `crack-the-shell` | Common | Skill, Spell, curse | Breaks enemy armour and cracks it |
| 05 | 2 | Hairline Crack | `hairline-crack` | Common | Skill, Spell, curse | A tiny free curse |
| 05 | 3 | Hairline Hex | `hairline-hex` | Basic | Skill, Spell, curse (starting deck) | Her first curse, and a little Barrier |

## The prompts

### Sheet `spellblade-sp-01`

```
Create ONE ILLUSTRATION SHEET of 9 separate card-art pictures for a card-battler game, 2400 x 1800, no text.
The attached images are the STYLE ANCHOR: match their painted fantasy game-art rendering exactly (crisp dark outlines, rich saturated colour, cel shading with glowing light effects). Backgrounds are softer than the main subject so the subject pops.

LAYOUT (critical): a clean 3 x 3 grid of landscape 4:3 pictures (each about 760 x 570), separated by thin flat dark navy (#14181f) gutters, with NO frames, NO borders, NO captions, NO text, NO numbers. Every picture fills its own cell completely; nothing crosses a gutter. Each picture has ONE clear subject in the middle that reads at thumbnail size, a simple scene behind it, light from the upper left.

WORLD: the Spellblade, a warrior of black volcanic glass. If she appears: white hair, black armour with gold trim, a long black glass sword; keep her face turned to the viewer or in profile. World: a volcanic glass desert at dusk: black obsidian, ember-orange cracks, violet sheen, floating shards, purple-orange sky. Enemies are rock golems of cracked dark stone.
THE VISUAL LANGUAGE (keep it the same on every picture): SPELL POWER is violet and ember light stored inside the black glass of the sword. FRACTURE is thin glowing ember-and-violet cracks spreading through a target; it is a curse, so show the cracks spreading, not an explosion, unless the card says it bursts. A SWORD card shows several slashes or a blur of hits. A SPELL shows violet magic and an open hand or sigil.

THE PICTURES, in this exact order, left to right, top row first. Use the card name only to understand the idea; never write it:
1. "Storm of Glass" (a storm of many sword hits). Draw: The Spellblade at the centre of a whirling cyclone of black glass slashes, a dozen violet-and-ember arcs around her sword. Make it epic: glowing, richer detail, a grander composition.
2. "Thousand Shards" (spends the blade's stored power for one hit per point). Draw: Her black sword breaking into hundreds of glowing shards that all fly at one rock golem like a horizontal rain of needles. Make it epic: glowing, richer detail, a grander composition.
3. "Soul of Steel" (she gains lasting strength). Draw: A close view of her gauntleted hand gripping the hilt, ember light pouring up her arm from the sword into her, the armour glowing from within. Make it epic: glowing, richer detail, a grander composition.
4. "Whispering Edge" (every sword hit deals more). Draw: The black sword floating upright alone, thin violet wisps curling along its edge like breath, sharp glints running up the blade. Make it epic: glowing, richer detail, a grander composition.
5. "Tempered Focus" (each turn her next attack hits harder). Draw: The sword held level before a molten forge glow, a single line of white-hot light travelling slowly along its edge. Make it epic: glowing, richer detail, a grander composition.
6. "Crucible Heart" (her growing enchantments grow faster). Draw: A black glass crucible with a beating ember heart inside it, the molten glow overflowing in rings that spread outward. Make it epic: glowing, richer detail, a grander composition.
7. "Measured Ruin" (her first big spell each turn is much stronger). Draw: A floating ring of black glass runes tightening around a violet sun, gathering it to a precise bright point. Make it epic: glowing, richer detail, a grander composition.
8. "Rupture Script" (a huge number of cracks on one enemy). Draw: A rock golem seen from the chest up with a burning script of cracks racing across its whole body, about to burst but not yet broken. Make it epic: glowing, richer detail, a grander composition.
9. "Breaking Point" (a blast, then more cracks). Draw: A towering glass-cracked rock golem at the moment it bursts open, shards flying outward in a bright ember-and-violet flash. Make it epic: glowing, richer detail, a grander composition.

NEGATIVE: text, letters, numbers, captions, labels, UI, card frames, borders, watermark, logo, photorealism, gritty texture, nudity, gore, characters facing away.
```

### Sheet `spellblade-sp-02`

```
Create ONE ILLUSTRATION SHEET of 9 separate card-art pictures for a card-battler game, 2400 x 1800, no text.
The attached images are the STYLE ANCHOR: match their painted fantasy game-art rendering exactly (crisp dark outlines, rich saturated colour, cel shading with glowing light effects). Backgrounds are softer than the main subject so the subject pops.

LAYOUT (critical): a clean 3 x 3 grid of landscape 4:3 pictures (each about 760 x 570), separated by thin flat dark navy (#14181f) gutters, with NO frames, NO borders, NO captions, NO text, NO numbers. Every picture fills its own cell completely; nothing crosses a gutter. Each picture has ONE clear subject in the middle that reads at thumbnail size, a simple scene behind it, light from the upper left.

WORLD: the Spellblade, a warrior of black volcanic glass. If she appears: white hair, black armour with gold trim, a long black glass sword; keep her face turned to the viewer or in profile. World: a volcanic glass desert at dusk: black obsidian, ember-orange cracks, violet sheen, floating shards, purple-orange sky. Enemies are rock golems of cracked dark stone.
THE VISUAL LANGUAGE (keep it the same on every picture): SPELL POWER is violet and ember light stored inside the black glass of the sword. FRACTURE is thin glowing ember-and-violet cracks spreading through a target; it is a curse, so show the cracks spreading, not an explosion, unless the card says it bursts. A SWORD card shows several slashes or a blur of hits. A SPELL shows violet magic and an open hand or sigil.

THE PICTURES, in this exact order, left to right, top row first. Use the card name only to understand the idea; never write it:
1. "Growing Crucible" (stores power, and stores more every time). Draw: A black glass crucible on a rock, overflowing with violet-orange molten light, rings of older smaller rims stacked below it like growth rings. A little more dramatic and detailed.
2. "Measured Recharge" (refills the blade after a spell). Draw: The sword planted point-down in a cracked stone, a steady stream of violet light drawn up out of the ground into it. A little more dramatic and detailed.
3. "Last Ember" (emergency recovery when she is empty). Draw: One tiny ember glowing in cupped black gauntlets in the dark, a faint shield of light just beginning around it. A little more dramatic and detailed.
4. "Crosscut" (a spell straight into sword strikes). Draw: Two bright slashes crossing in an X in mid-air, one violet from a spell and one ember from a sword, sparks at the crossing. A little more dramatic and detailed.
5. "Fault Piercer" (sword hits that widen an enemy's cracks). Draw: A thrust of the black sword going straight into a glowing crack in a rock golem, the crack spreading out from the point. A little more dramatic and detailed.
6. "Quenched Edge" (spending power primes her next attack). Draw: The glowing sword being plunged into a basin of violet liquid, a burst of steam and a hot white edge on the blade. A little more dramatic and detailed.
7. "Patient Edge" (rewards holding power and not spending it). Draw: The sword resting across two stones at dusk, perfectly still, a slow violet glow pooling and brightening inside the glass. A little more dramatic and detailed.
8. "Controlled Release" (a careful spell that keeps some power back). Draw: A narrow, neat violet beam fired from the tip of the sword into a rock golem, most of the blade still glowing with held power. A little more dramatic and detailed.
9. "Stress the Glass" (pours stored power into cracks). Draw: A great pane of black glass under pressure from violet light on one side, fine white cracks spreading across it like frost. A little more dramatic and detailed.

NEGATIVE: text, letters, numbers, captions, labels, UI, card frames, borders, watermark, logo, photorealism, gritty texture, nudity, gore, characters facing away.
```

### Sheet `spellblade-sp-03`

```
Create ONE ILLUSTRATION SHEET of 9 separate card-art pictures for a card-battler game, 2400 x 1800, no text.
The attached images are the STYLE ANCHOR: match their painted fantasy game-art rendering exactly (crisp dark outlines, rich saturated colour, cel shading with glowing light effects). Backgrounds are softer than the main subject so the subject pops.

LAYOUT (critical): a clean 3 x 3 grid of landscape 4:3 pictures (each about 760 x 570), separated by thin flat dark navy (#14181f) gutters, with NO frames, NO borders, NO captions, NO text, NO numbers. Every picture fills its own cell completely; nothing crosses a gutter. Each picture has ONE clear subject in the middle that reads at thumbnail size, a simple scene behind it, light from the upper left.

WORLD: the Spellblade, a warrior of black volcanic glass. If she appears: white hair, black armour with gold trim, a long black glass sword; keep her face turned to the viewer or in profile. World: a volcanic glass desert at dusk: black obsidian, ember-orange cracks, violet sheen, floating shards, purple-orange sky. Enemies are rock golems of cracked dark stone.
THE VISUAL LANGUAGE (keep it the same on every picture): SPELL POWER is violet and ember light stored inside the black glass of the sword. FRACTURE is thin glowing ember-and-violet cracks spreading through a target; it is a curse, so show the cracks spreading, not an explosion, unless the card says it bursts. A SWORD card shows several slashes or a blur of hits. A SPELL shows violet magic and an open hand or sigil.

THE PICTURES, in this exact order, left to right, top row first. Use the card name only to understand the idea; never write it:
1. "Fault Memory" (a curse that cracks deeper each use). Draw: A glowing crack pattern drifting in the air like a sigil, older faded copies of it behind, each a little larger than the last. A little more dramatic and detailed.
2. "Carry the Fault" (moves cracks from one enemy to another). Draw: A ribbon of glowing cracks leaping through the air from one crumbling rock figure to a second, clean one. A little more dramatic and detailed.
3. "Deep Fault" (every shatter hits harder for the fight). Draw: A chasm split into a black glass plain, seen from above, burning ember light far down in its depths. A little more dramatic and detailed.
4. "Fault Reader" (learns from each shatter). Draw: A floating eye shape of black glass with a crack through the iris, shards orbiting it, ember light shining through the crack. A little more dramatic and detailed.
5. "Deepening Fault" (her shatters grow stronger every turn). Draw: A single glowing crack in a dark obsidian wall, split in three stages from hairline at the top to a wide burning rift at the bottom. A little more dramatic and detailed.
6. "Afterglow" (comfort and a card after spending everything). Draw: The sword with its power spent, dark and cooling, one soft warm rim of light left along the edge, embers drifting up. A little more dramatic and detailed.
7. "Recenter" (draws cards after using sword and spell). Draw: A calm ring of black shards orbiting a still point of violet light in empty air, a sword silhouette through the middle. A little more dramatic and detailed.
8. "Empty Crucible" (refills more when empty). Draw: A dark empty glass crucible on a rock, the first thin stream of violet light just starting to pour into it from above.
9. "Etching Edge" (sword hits that leave small cracks). Draw: The tip of the black sword scratching a glowing line across a rock golem's arm, thin cracks running out from the line.

NEGATIVE: text, letters, numbers, captions, labels, UI, card frames, borders, watermark, logo, photorealism, gritty texture, nudity, gore, characters facing away.
```

### Sheet `spellblade-sp-04`

```
Create ONE ILLUSTRATION SHEET of 9 separate card-art pictures for a card-battler game, 2400 x 1800, no text.
The attached images are the STYLE ANCHOR: match their painted fantasy game-art rendering exactly (crisp dark outlines, rich saturated colour, cel shading with glowing light effects). Backgrounds are softer than the main subject so the subject pops.

LAYOUT (critical): a clean 3 x 3 grid of landscape 4:3 pictures (each about 760 x 570), separated by thin flat dark navy (#14181f) gutters, with NO frames, NO borders, NO captions, NO text, NO numbers. Every picture fills its own cell completely; nothing crosses a gutter. Each picture has ONE clear subject in the middle that reads at thumbnail size, a simple scene behind it, light from the upper left.

WORLD: the Spellblade, a warrior of black volcanic glass. If she appears: white hair, black armour with gold trim, a long black glass sword; keep her face turned to the viewer or in profile. World: a volcanic glass desert at dusk: black obsidian, ember-orange cracks, violet sheen, floating shards, purple-orange sky. Enemies are rock golems of cracked dark stone.
THE VISUAL LANGUAGE (keep it the same on every picture): SPELL POWER is violet and ember light stored inside the black glass of the sword. FRACTURE is thin glowing ember-and-violet cracks spreading through a target; it is a curse, so show the cracks spreading, not an explosion, unless the card says it bursts. A SWORD card shows several slashes or a blur of hits. A SPELL shows violet magic and an open hand or sigil.

THE PICTURES, in this exact order, left to right, top row first. Use the card name only to understand the idea; never write it:
1. "Rift Sweep" (a wide sword sweep at every enemy). Draw: A wide horizontal arc of black-and-ember slash sweeping through three small rock figures at once.
2. "Glass Needle" (a quick, cheap stab). Draw: One slim needle of black glass flying fast, a thin bright streak behind it, against a soft dusk sky.
3. "Guarded Cut" (a cut with a guard). Draw: The sword held in a guard position mid-swing, a curved plate of glowing glass forming along the forearm.
4. "Tempered Bolt" (a plain spell that works when she is out of power). Draw: A small round bolt of ember light shot from an open gauntlet, leaving a short bright trail.
5. "Glassbrand" (a hit that leaves cracks). Draw: A glowing hot glass brand mark pressed into a rock golem's chest, small cracks spreading from it.
6. "Faultline Hex" (her basic curse). Draw: A violet hex sigil hovering in front of a rock golem, one straight bright crack running down the golem from it.
7. "Spreading Fault" (cracks across every enemy). Draw: A crack running along the cracked ground between three rock figures, branching up into each of them.
8. "Pressure Point" (a precise touch that can set off a shatter). Draw: One armoured fingertip touching a single spot on a slab of black glass, cracks radiating from that point.
9. "Glass Prison" (barrier and a few cracks). Draw: A cage of tall black glass shards around her, protecting her, its outer faces lightly cracked and glowing.

NEGATIVE: text, letters, numbers, captions, labels, UI, card frames, borders, watermark, logo, photorealism, gritty texture, nudity, gore, characters facing away.
```

### Sheet `spellblade-sp-05`

```
Create ONE ILLUSTRATION SHEET of 3 separate card-art pictures for a card-battler game, 2400 x 600, no text.
The attached images are the STYLE ANCHOR: match their painted fantasy game-art rendering exactly (crisp dark outlines, rich saturated colour, cel shading with glowing light effects). Backgrounds are softer than the main subject so the subject pops.

LAYOUT (critical): one clean row of 3 landscape 4:3 pictures (each about 760 x 570), separated by thin flat dark navy (#14181f) gutters, with NO frames, NO borders, NO captions, NO text, NO numbers. Every picture fills its own cell completely; nothing crosses a gutter. Each picture has ONE clear subject in the middle that reads at thumbnail size, a simple scene behind it, light from the upper left.

WORLD: the Spellblade, a warrior of black volcanic glass. If she appears: white hair, black armour with gold trim, a long black glass sword; keep her face turned to the viewer or in profile. World: a volcanic glass desert at dusk: black obsidian, ember-orange cracks, violet sheen, floating shards, purple-orange sky. Enemies are rock golems of cracked dark stone.
THE VISUAL LANGUAGE (keep it the same on every picture): SPELL POWER is violet and ember light stored inside the black glass of the sword. FRACTURE is thin glowing ember-and-violet cracks spreading through a target; it is a curse, so show the cracks spreading, not an explosion, unless the card says it bursts. A SWORD card shows several slashes or a blur of hits. A SPELL shows violet magic and an open hand or sigil.

THE PICTURES, in this exact order, left to right, top row first. Use the card name only to understand the idea; never write it:
1. "Crack the Shell" (breaks enemy armour and cracks it). Draw: A rock golem's stone shell splitting off in plates, ember light showing in the seams underneath.
2. "Hairline Crack" (a tiny free curse). Draw: A pristine black glass surface with one tiny, very thin glowing crack in the very centre.
3. "Hairline Hex" (her first curse, and a little barrier). Draw: A small plain violet sigil drawn in the air by a gauntleted finger, a thin crack forming on a stone behind it.

NEGATIVE: text, letters, numbers, captions, labels, UI, card frames, borders, watermark, logo, photorealism, gritty texture, nudity, gore, characters facing away.
```
