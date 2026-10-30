# Artwork and motion review — 2026-10-29

Scope: source artwork and encounter designs ONLY; no playable monster registrations, combat rules or live UI code changed.

## Findings from current sources

- Current heroes and modern enemy sheets share bold outlines, cel-shaded planes and readable fantasy silhouettes. This is the style authority, not the older painterly/gritty archive or the stale global prose in the art bible. All seven new enemy sheets were generated with the actual Knight hero image attached as style reference. Strong gold/ivory trim carries through some other realms; keep the silhouettes but consider realm palette adjustments in an individual art pass if it feels too Aurelion-heavy.
- `assets-src/animations` contained no source files at inspection. This does NOT mean the game lacks animation: Fighters.ts, attackFx.ts, attackStyles.ts and weaponArt.ts already animate weapons, melee/ranged bodies, slash arcs, thrown knives, orbs, tracers, muzzle/impact/cast frames and recovery. Reuse that system rather than introduce another combat event scheduler.
- Existing weapons-01 includes twelve excellent cutout sources; source art isn't the principal melee gap. Enemy-specific weapons, elemental specificity, target attachments and semantic status feedback offer greater benefit than generating another sword sheet.
- `weaponFor` largely selects by hero; ordinary spells can inherit a hero's default weapon presentation. Select elemental/motion profiles using explicit presentation metadata or existing effect tags, with a fallback. Do not dispatch real damage based on art or English-name matching. Existing spell tags must be audited before integrating.
- The inspected plates render HP, Barrier, statuses and intents. There was no dedicated Fate lethal predicate or badge in the inspected fight renderer. Fate is currently a tooltip/status until engine end-turn execution. The proposed persistent hourglass/bracket/striped bar addresses this gap without claiming immediate death.
- Hollow Crown/glass and Midden/alley did not have their own source backdrops among inspected backdrops. Those remain useful future illustrations. Existing hero portraits do not need wholesale replacement. Source originals and supplied new candidates remain separate.
- Keep licensed fx-magic-effects sources out of AI reference uploads and reusable redistribution bundles. This pack uses original procedural effects and existing project-owned weapon cutouts only.

## Recommended integration priority

1. Fate threshold badge, numeric condition and accessible tooltip; clear on healing; actual Fate execution reason/event for death effect.
2. Typed lightning/fire/ice profiles and source/target attachment points; use existing slash/shoot fallbacks when metadata is absent.
3. Knife extraction, transient spirit command and Imbue consumption feedback tied to the new class events, after those mechanics are actually available.
4. Enemy gravity profile for singularities; then per-enemy props and short anticipation changes.
5. Optional later art: independent left/right enemy weapon sets; isolated Shaman command spirits; charging/idle layers for unusual monsters; glass/alley backdrops. No full character animation rig is required for the supplied pack.

## New deliverables

16 animation designs: 192 transparent PNG frames, sixteen 6x2 sheets, sixteen GIF previews, sixteen static SVG keyframes, deterministic SVG renderer and timing manifest. The effects include melee responses and familiar shots as reusable variants, plus the elemental/status gaps. GIFs repeat solely for review. One-shot effects must not loop in combat. Static SVG keyframes do not animate when loaded as Pixi textures.

Enemy definitions counted directly from ENEMY_UNITS: 31. This expansion supplies 62 unique new artwork/design candidates, making a proposed 93-enemy roster. Breakdown: 41 regular, 14 elite, 7 boss candidates. There are seven nine-cell source sheets, with Far Rifts last cell deliberately blank. Source images returned by the tool are not guaranteed to match requested 2048px; actual dimensions are in provenance.json. These are concept/source sheets, not a claim of 62 already-integrated figures.

## Fate timing and reliability

The inspected engine applies doom (Fate) when HP <= Fate at the end of the affected side's own turn, after healing and other relevant turn-end effects. Display `Fate lethal at turn end` only while living HP > 0, Fate > 0 and HP <= Fate. This is a current-state warning, not an unconditional prediction. Units can still act, heal, or have the condition removed. Do not treat Barrier as a defense against execution. Card-hover predictions must be dashed and explicitly hypothetical. Use the actual death reason, not a badge's presence, to decide which execution animation plays.

## Enemy balance limits

HP/move cycles are provisional design targets, NOT validated balanced encounters. The card-costing guide prices player resources, not enemy action economy. Compare combined three-turn damage, setup windows, junk/debuff burden and enemy bodies to current same-stage encounter budgets. No balance simulations were run. Existing slot limits and deterministic intent previews remain unchanged. No proposed visual effect authorizes new hidden combat mechanics.

## QA / production work still needed

Visually reviewed all seven source sheets: roster order is recognizable and broad cel-shaded aesthetic matches. Some face-on objects/figures will need directional refinement. Gloomfen Pallbearer Swarm is ONE fused enemy illustration with several small figures, not four additional monster types. The mask is an original asymmetric theatrical design; it deliberately avoids an existing game's iconic mask silhouette/markings.

Illustrations require human approval, individual cell isolation/background cleanup, scale/anchor review and runtime packing before use. Preserve the original source sheets. No production asset approval was silently granted. This task does not change assets.ts, unitLooks.ts, attackStyles.ts, unit definitions or campaign encounter tables.

## Existing figure-file coverage

At inspection, these current ENEMY_UNITS IDs lacked an exact same-name PNG in public/art/figures: none. This is a filename coverage check, not a claim that the live renderer cannot use aliases/fallbacks.
