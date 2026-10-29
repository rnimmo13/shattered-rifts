# Class rework art: what is reused, new, retired and missing (2026-10-29)

For the identity reworks of `docs/BASE_CLASS_REWORKS.md`. **No image was generated for this work**: every new card uses the game's
procedural placeholder (`apps/web/src/art/proceduralArt.ts`) until a picture is made and approved, and every on-screen mark (Openings,
knives, enchantments, totem positions, the command button, form pips) is drawn in code (CSS/SVG), never baked into a picture. Nothing
was deleted: a removed card's picture stays in `apps/web/public/art/cards/` and in the manifest, unused (its hash is in the archive's
`assets/assets.json`), so it can be reused or retired by Robert.

Art rules that apply (docs/05_ART_PIPELINE.md): one consistent style and model per set, human approval before anything ships, no
franchise imagery or named artist styles. New pictures, when made, are candidates marked **unapproved** until Robert's review, with
their prompt, the provider and model the service actually returned, size, focal point, alpha and intended ids recorded here.

Supplied draft art: the brief names `shaman-totems-reference-v2.png` and `shaman-spirits-reference-v2.png` as supplied candidates. **They
are not in the repository** (searched 2026-10-29); nothing was integrated. The nearest files present are
`assets-src/archive/gritty-v1/Teal Spirit Shaman Totems.png` (the older realistic concept sheet the brief says not to follow) and
`assets-src/heroes/_source/Cyan Spirit Shaman Totemkeeper-2.png`. The Shaman's visual authority is `assets-src/heroes/shaman.png`.

Formats when art is made: card art is the 4:3 window, PNG or WebP, listed in `apps/web/public/art/manifest.json` under `cards` by card
id (an upgrade and a sanctified card use their base card's picture). Figures are transparent PNG cut-outs with the feet on the bottom
edge (`figures`). Run `pnpm artlist` / `pnpm cardprompts:missing` for the current list of cards with no picture.

## Knight (Guard, Riposte, Thorns)

Portrait: keep (`figures/hero-knight.png` and her two skins); the rework is a mechanics change, not a new character.

| Kind | Cards |
|---|---|
| Kept with their picture, still fitting | Oath of Iron, Dawn Smite, Hilt Strike, Field Repairs, Clarion Clap, Provoke, Ember Ward, Immovable Oath |
| Kept picture, effect changed: **review** whether it still shows the card | Sundering Blow (now a counter), Bulwark Blow (a shield riposte, no longer "hit with your Barrier"), Stoneskin (armour that answers Openings), Giant's Stance (meets an attacker), Bastion Engine (strikes the enemy it opened), Warlord's Oath (no longer Demon Form: a challenge each turn), Break Guard, Challenge |
| New, placeholder until drawn (38) | Briarplate, Squire's Drill, Rebuke, Clang of Steel, Sweeping Guard, Rallying Cry, Measured Guard, Shield Wall, Guarded Advance, Watchful Eye, Sentinel's Patience, Patient Guard, Iron Cadence, Aegis Eternal, Return the Blow, Draw Them In, Steady Blade, Counterstroke, Shoulder Check, Iron Rejoinder, Breaking Point, Deflecting Blow, Exploit the Gap, Perfect Counter, Masterstroke, Last Bastion, Duelist's Focus, Spiked Pauldron, Bramble Guard, Briar Lash, Thorned Gauntlet, Thornburst, Barbed Vigil, Barbed Retort, Thornwake, Wall of Briars, Vengeful Strike, Crown of Thorns |
| Pictures of removed cards that might fit a new card (**look before reusing**) | Twin Cut -> Return the Blow; Blood Plate / Stone Stance -> Shield Wall; Unbroken Wall -> Aegis Eternal; Rattle -> Clang of Steel; Hammer Fall -> Breaking Point; Hot Temper -> Shoulder Check; Rally -> Rallying Cry |
| New in the expansion (DECISIONS #423), placeholder until drawn (35) | Duelist: Testing Cut, Measured Footwork, Keep Your Distance, Patient Edge, Read the Duel, Closing Argument, Knight's Composure (Aura), Probing Thrust, Keen Eye, Second Intention, Measured Tempo (Aura), Seize the Moment. Formation: Answer Them All, Ring of Steel, Sweep the Line, Pick Them Apart, Cleaving Riposte, Marshal's Eye (Aura). Patient defender: Steady Breath, Night Watch, Steel Before Dawn, Bulwark of Dawn, Prepared Ground (Aura). Offensive Thorns: Shed the Spines, Bristle, Splinter Guard, Spine Volley, Thorned Momentum (Aura), Thornstorm Rush. Siege: Feinting Cut, Batter Down, Sunder Armour, Breach the Wall, Siege Doctrine (Aura), Siege Line |
| Changed in the expansion: **review** the picture | Barbed Vigil (now a held, two-turn guard with Thorns), Deflecting Blow (a counter that guards), Giant's Stance (Faltering on an Open enemy) |
| Retired (unused now) | the 67 removed Knight cards' pictures (`retired.ts`, Knight block) |

Signature illustration (priority 2 in the brief): one picture of the three ideas together (a raised shield catching a blow, the
sword answering through the gap, briars on the pauldron) would serve Sundering Blow or a store/learn banner. Not made.

In code: the Opening chip on an enemy (`chip--open`, a gold ring and the word "Open", so it reads without colour), the Riposte and Guard
tooltips, and the shield animation for Riposte cards (`weaponArt.ts`).

## Assassin (Preparation and embedded knives)

Portrait: keep (`figures/hero-assassin.png` and his two skins).

| Kind | Cards |
|---|---|
| Kept with their picture, still fitting | Hobbling Jab, Dirty Hit, Quick Slash, Barbed Stab, Cartwheel Cut, Stalker's Lunge, Darting Strike, Backspring, Turn Aside, Roll Away, Smoke Veil, Sweep the Leg, Nimble Deal, Marked for Death, Lay Bare, Side Slip |
| Kept picture, effect changed: **review** (most show airborne daggers or a Sly trick, the brief's concern) | Knife Juggle (now embeds two knives), Feint Strike, Shroud and Shank, Blade Flurry, Flick Knife, Whetted Edge (pulls pay), Recall the Blades (pull every knife), Knife in the Back and Killing Stroke (Preparation finishers), Duck and Weave, Practiced Hands |
| New, placeholder until drawn (28) | Quiet Incision, Draw Steel, Finishing Thrust, Patient Footwork, Read the Guard, Severing Finish, Throat Cut, Prepared Ambush, Final Cut, Eyes in the Dark, Pinning Throw, Twist the Blade, Pincushion, Harvest the Field, Scatter Knives, Worry the Wound, Executioner's Mark, Flurry of Steel, Twist and Pull, Thread the Needle, Reap the Steel, Leave No Trace, Cut and Run, Disarm, Fade Out, Hidden in Plain Sight, Vanishing Act, Bladestorm Ward |
| Pictures of removed cards that might fit (**look first**) | Garrote -> Throat Cut; Serrated Edges -> Pincushion; Steel Monsoon -> Harvest the Field; Into the Shadows / Mantle of Night -> Vanishing Act; Slow Murder -> Final Cut; Inked Blades -> Executioner's Mark |
| New in the expansion (DECISIONS #424), placeholder until drawn (36) | Precision: Measured Cut, Poised Strike, Mark the Vein, Calculated Retreat, Steady Hand, Weigh the Moment, Silent Massacre, Assassinate, Economy of Motion (Aura), Patient Coil (Aura), The Waiting Blade (Aura). Hybrid: Read the Wound, Exacting Pull. Leave the knife and fieldwork: Lodged Steel, Pinned, Barbed Anchor, Thousand Cuts, Steel Rain, Fan of Blades, Reaping Arc, Lingering Steel (Aura), Steel Thicket (Aura), Cruel Precision (Aura). Selective extraction and shadow: Quick Pull, Pry Loose, Sleight of Steel, Bide in Shadow, Melt Away, Feign Weakness, Choking Smoke, Set the Stage, Cold Patience, Strike from Shadow, Clean Extraction (Aura), Lie in Wait (Aura), Recycled Steel (Aura). Knives must read as planted in a body, never thrown or floating |
| Retired (unused now) | the 57 removed Assassin cards' pictures, including the Dagger token's |

Signature illustration (priority 3): a hand drawing a knife from a still-standing target, others planted in it, a quiet pause before
the finish: for Draw Steel or Final Cut. Not made.

In code: the Knives chip on an enemy (†, "n/3"), the Preparation chip on the hero (◔, "n/3"), tooltips, a teaching tip, and the dagger
icon and flurry animation for cards that plant or pull knives (`art.ts`).

## Spellblade (Imbue and Discharge)

Portrait: keep (`figures/hero-spellblade.png` and her skins).

| Kind | Cards |
|---|---|
| Kept with their picture, still fitting | Glint, Hollow Gaze, Humble, Molten Weight, Stellar Wind, Forged in Fury, Skybolt, Ember Cache, Faint Glow, Sunstrike, Astral Pulse, Gamma Burst, Shard Strike, Tyrant Strike, Echoing Blade, Cleaving Edge, Dying Ember, Obsidian Flurry, Devastate, Radiance, Final Shatter, Scheme, Lava Bomb, Seven Shards, Glass Veil, Pale Beacon, Star Barrier, Bladewall, Glass Guard, Mirror Glass, Glass Wall, Obsidian Aegis, Unbreakable Crown |
| Kept picture, effect changed: **review** (drawn as a whetstone, a forge, stars or a crown: the brief's "mundane sharpening" concern) | Etch the Edge (`whetstone`), Warm Anvil, Banked Embers, Call the Blade, Heirloom Maul, Magma Surge, Obsidian Lance, Cataclysm |
| New, placeholder until drawn (12) | Ember Inscription, Obsidian Cut, Fracture Script, Recast the Edge, Crownfall, Overcharge Edge, Emberglass Covenant, Twin Sigils, Glass Requiem, Shatterguard, Glassward, Ward Weave |
| Pictures of removed cards that might fit (**look first**) | Starforged Blade -> Obsidian Cut; Gather Light -> Ember Inscription; Collapsing Star -> Overcharge Edge; Retainer Guard -> Glassward; Call the Guard -> Shatterguard |
| Retired (unused now) | the 46 removed Spellblade cards' pictures (`retired.ts`, Spellblade identity block) |

Signature illustration (priority 4): runes of ember and glass written along a black-glass blade, one rune flaring as it is released into
a strike: for Ember Inscription or Crownfall. Not made.

In code: the Obsidian Blade panel (`EnchantSlots.tsx`: two positions, a mark and a word each so it reads without colour, an empty
dotted ring, the aimed card's spend shown), the charge tiles of the discharge and replacement choices, tooltips, a teaching tip and Learn page words.


## Shaman (elements, totems and Trinity, DECISIONS #420)

Portrait: keep (`figures/hero-shaman.png` and his skins). Visual authority for anything new: `assets-src/heroes/shaman.png` (bold ink
outlines, ochre carved wood, ivory feather and bone, teal cloth, cyan spirits).

| Kind | Cards |
|---|---|
| Kept ids with their picture: **review** whether each still shows the card (several were drawn as orbs or awakenings) | Frost Needle, Eye of the Tempest, Hail Rite, Bark Carapace, Ancestral Exchange, Communion, Spiritstorm, Hawk Call, Bear Call, Stone Skin, Tidecaller, Spirit Memory, Clear Spring, Crystal Ward, Ironbark, Skybreaker, Gale Strike, Smoke Offering, Wildfire, Flashpoint, Gathering Storm |
| New, placeholder until drawn (62) | every other card in `pools/shaman.ts`: the Flame, Frost and Storm spells, the defences and Auras, the totem and Trinity cards |
| Retired (unused now) | the cards of the Defect copy and of the first rework (`retired.ts`, the two Shaman blocks) |

Still wanted, **not made**: Hawk, Bear and Thunderbird totem silhouettes (and the rare Elder Tree and Moon Owl), their brief
manifestations when called, and a picture per element (flame, frost, storm) for the spell families. Until then the Totems panel draws
each totem in code (a mark and a word: ⋀ Hawk, ◼ Bear, ϟ Thunderbird, ✥ Elder Tree, ☾ Moon Owl), and the Trinity panel the elements
(♨ Flame, ❄ Frost, ϟ Storm). The two reference strips the brief names are not in the repository.

## Monk (Martial Forms and Mastery)

Portrait: keep (`figures/hero-monk.png` and his skins).

| Kind | Cards |
|---|---|
| Kept with their picture, still fitting | Inner Sight, Gather Breath, Held Breath, Coiled Serpent, Flood of Visions, Centre Yourself, Bowing Low, Still Water, Mountain's Stillness, Unbroken Calm, Breath Between Blows, Swift Step, Vigilance, Open Palm, Crushing Palm, Flurry of Palms, Quick Palms, Spinning Heel, Thousand Palms, Rage of Ages |
| Kept picture, effect changed: **review** (drawn as a stance aura, Fury's red or Radiant's light: the brief's warning against Calm/Wrath/Divinity recolours) | Kindle Strike (`kindle-fury`), Still Guard, Angry Palm, Ashen Fist, Scattering Kick (`red-mist`), Temper Flare, Fearless, Foretold Flame, Unmoved Mind, Wreath of Flame, Shield of Calm, Perfect Calm, Sunlit Kick, Final Account, Last Ember |
| New, placeholder until drawn (18) | Settle into Root, Find the Current, Stoke the Ember, Read the Rhythm, Perfected Motion, Grandmaster's Patience, Planted Heel, Iron Shirt, Rooted Resolve, Deflecting Palm, Flowing Step, Turning Palm, Redirect, The River Turns, Ember Step, Focused Strike, Mountain Breaker, Master's Flourish |
| Pictures of removed cards that might fit (**look first**) | Unburdened Guard -> Deflecting Palm; Thread-Cutter -> Redirect; Perfect Balance -> Perfected Motion; Settled Mind -> Read the Rhythm; Rending Hands -> Master's Flourish |
| Retired (unused now) | the 45 removed Monk cards' pictures (`retired.ts`, Monk identity block), including his three former Legendaries |

New illustrations the brief suggests, **not made**: Root (footwork planted on cracked marble), Current (a blow redirected through a
flowing palm sequence), Ember (focused flame released through one finishing strike). In code: the Form panel (`FormPanel.tsx`: the
form's mark and name, ⛰ Root, ≋ Current, ✺ Ember, its objective in a line, two progress pips and the Mastery pips), the form tiles of
Read the Rhythm's choice, tooltips, a teaching tip and Learn page words. No stance aura is drawn for him any more.
