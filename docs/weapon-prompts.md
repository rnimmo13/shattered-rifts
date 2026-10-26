# Weapon and attack-effect prompts

Attacks are drawn in code today (`apps/web/src/fight/attackStyles.ts`, `attackFx.ts`): a slash arc, tracers, a shock ring, no
pictures. These two sheets add real weapons. **The heroes do not move.** The game shows the weapon beside the hero for a moment
and animates it in code: the hammer rises and comes down, the shotgun kicks back with a flash, the sword sweeps across. So each
weapon is ONE still picture, drawn the same way so the game can hold it by the handle and swing it.

Why stills and not frame-by-frame animation from the AI: image AIs redraw the object a little differently in every frame, so a
six-frame swing flickers and wobbles. One clean picture moved by the game stays crisp at every size and speed, follows the speed
setting, and costs one image per weapon. The effects sheet (sheet 2) is the exception: a flash or a puff of dust is meant to
change shape, so frames suit it.

How to use: attach the Valeria image (`Sunlit Paladin with Shield and Sword.png`) as the style anchor, paste one prompt, check the
grid, and save the result as `assets-src/weapons/weapons-01.png` (sheet 1) or `assets-src/weapons/fx-01.png` (sheet 2). Tell me
and I will cut them and wire them into the attack animation.

## Sheet 1: `weapons-01` (12 weapons)

```
Create ONE SHEET of 12 separate weapon pictures for a 2D card-battler game (like Slay the Spire), 2400 x 1800, no text.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, light from the upper left).

LAYOUT (critical): a clean 4 x 3 grid of equal cells (4 across, 3 down), separated by thin flat dark navy (#14181f) gutters. EVERY cell has a plain flat dark navy (#14181f) background: no scenery, no floor, no shadow on the ground, no glow halo, no frame, no text. Each cell holds ONE weapon on its own, with no hand or character holding it.

POSE (critical, the same for every weapon): seen from the side, lying HORIZONTALLY across the cell, the HANDLE or GRIP at the LEFT and the blade, head, point or muzzle pointing to the RIGHT. The weapon fills about 80% of the cell's width, centred, with an empty margin all round; nothing touches the cell's edges.

THE WEAPONS, in this exact order, left to right, top row first:
1. Valeria's longsword: a knightly longsword, polished steel blade, gold crossguard, blue leather grip, a small sun emblem on the pommel.
2. Valeria's tower shield, seen from the side at a slight angle so its face shows: blue and gold, a gilded sun boss, its strap side to the left.
3. Rivet's heavy wrench: an oversized steel monkey wrench, orange hazard-striped handle, a glowing cyan bolt in the jaw.
4. Kesh's bone cleaver: a brutal cleaver of a giant beast's jawbone, teeth along the edge, a crimson-wrapped grip, a bone talisman dangling.
5. Vesper's stiletto: a needle-thin black dagger with a violet-teal sheen, a masked-face pommel, a ribbon at the grip.
6. Sylas's throwing knife: a slim leaf-shaped throwing knife, dark steel with a teal edge glow, a ring at the end of the handle.
7. Ilvane's totem staff: a carved wooden staff topped with a small hawk-headed totem, feathers and beads tied on, teal spirit light in the carving's eyes.
8. Sehra's flame blade: a curved monk's blade whose edge is a ribbon of orange-gold fire, a wrapped white-and-gold grip.
9. Obsidia's obsidian blade: a long sword of black volcanic glass, ember-orange cracks glowing along it, a jagged glass crossguard.
10. Dorian's grave lantern: an old iron lantern on a short bone handle, pale green witch-fire inside, chains hanging from it (handle at the left, lantern at the right).
11. KP's hammer: a heavy sledge with a battered iron head and a long ash handle wrapped in tape, a bottle cap nailed to the side.
12. KP's Old Twelve Gauge: a sawed-off double-barrel shotgun, scratched barrels, taped wooden stock, stock at the left and both muzzles at the right.

NEGATIVE: text, letters, numbers, labels, UI, frame, border, watermark, logo, hands, arms, characters, background scenery, floor, ground shadow, glow halo spilling into the gutters, photorealism, gritty texture, weapons pointing left, vertical weapons, weapons touching the cell edges.
```

## Sheet 2: `fx-01` (attack effects, 4 effects x 6 frames)

```
Create ONE SPRITE SHEET of attack effects for a 2D card-battler game, 2400 x 1600, no text.
Match the attached style anchor's cartoon rendering: bold clean shapes, flat saturated colours, simple cel shading.

LAYOUT (critical): a 6 x 4 grid of equal square cells (6 across, 4 down), separated by thin flat dark navy (#14181f) gutters, every cell on a plain flat dark navy (#14181f) background. Each ROW is ONE effect played left to right in 6 frames: it appears small, grows to its biggest by frame 3, then breaks up and fades out by frame 6 (frame 6 is nearly gone). Every effect is centred in its cell, the same centre in every frame, and never touches the cell's edges. No objects, no weapons, no characters: effects only.

THE ROWS, top to bottom:
1. A shotgun MUZZLE FLASH pointing RIGHT: a bright yellow-white star of fire bursting out to the right with orange flame tongues, then a curl of grey smoke as it fades.
2. A heavy HAMMER IMPACT seen from the side: a flat ring of dust and stone chips bursting outward along the ground with a white flash at the centre, then settling dust.
3. A SPARK HIT: a burst of bright gold sparks and a white star where a blade strikes, sparks flying outward, then dimming embers.
4. A SPIRIT CAST: a swirling orb of teal-white spirit light gathering, flaring, and scattering into small glowing motes.

NEGATIVE: text, numbers, labels, UI, frame, border, watermark, characters, weapons, background scenery, ground, photorealism, effects crossing into other cells, a different centre from frame to frame.
```

## What I need to know when you send them

- If a weapon came out facing the wrong way or vertical, regenerate the sheet: the cutter and the swing both rely on the
  handle being at the left.
- Effects that drift between frames still work (they are quick), but tell me if a row looks jumpy and I will use fewer frames.
