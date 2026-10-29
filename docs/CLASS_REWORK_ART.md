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
| Retired (unused now) | the 57 removed Assassin cards' pictures, including the Dagger token's |

Signature illustration (priority 3): a hand drawing a knife from a still-standing target, others planted in it, a quiet pause before
the finish: for Draw Steel or Final Cut. Not made.

In code: the Knives chip on an enemy (†, "n/3"), the Preparation chip on the hero (◔, "n/3"), tooltips, a teaching tip, and the dagger
icon and flurry animation for cards that plant or pull knives (`art.ts`).
