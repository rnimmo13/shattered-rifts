# Prompts: creatures redrawn larger, so their models stay sharp

Written 2026-11-14 (DECISIONS #793). On High graphics a model is never drawn larger than its own pixels: if its drawing is smaller
than the size it stands on stage, it is shown smaller instead of blurred. These 36 creatures were drawn too small for their stage
size (four poses squeezed into one image), so on a 1080p screen they would stand at 47% to 85% of their size, Drago and most
Wardens among them. Each is redrawn at about 1.33 times its stage height (sharp at full size up to 1440p).

The design, poses and timing stay as they are: every existing 4-pose sheet is redrawn pose for pose, split over two images (two
poses each), or four images (one pose each) for a creature much wider than it is tall. Claude then rebuilds and repacks them
(`build_units.py` needs a small change to read the split sheets first; ask Claude when the images are in).

## For ChatGPT: how to work

Everything lives in `D:/Code/ShatteredRifts/assets-src/units-pose-sheets`. Do not change or delete any existing image: every new
file name contains `_hd_`.

1. Work through the creatures below in order; tick each box when its images are saved and checked.
2. For every image attach: the creature's existing sheet named in the prompt, its `<id>_reference.png`, and the style anchor
   `D:/Code/ShatteredRifts/assets-src/heroes-pose-sheets/rogue/rogue_reference.png`. Read `docs/ART_DIRECTION.md` first.
3. Make the reference image first, then the sheet images. Save each as PNG in the creature's own folder with exactly the name given.
   Do not resize, crop or edit an image after making it.
4. Checklist for every image:
   - the same design, colours, proportions, weapon and facing (right) as the existing sheet and reference;
   - the same poses, in the same order, as the existing sheet;
   - the ready stance the height given, and every pose of the creature at that same scale in all its images;
   - at least 40 px of background around each pose and wide gaps between poses; nothing touching or cut off;
   - a plain solid background in the same colour as the existing sheet (#00FF00, or #FF00FF for a creature with green in it);
   - no effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows;
   - the inked style of the anchor: confident dark outline, selective interior ink lines, shaded colour with volume.

## Creatures

### Drago, Heart of the Rift (`vorthax`, 13-summoned/vorthax)

Now drawn 393 px tall, stands 640 on stage: ready stance **850 px** tall (at least 640). One pose per image. The landscape canvases generated for this set fit an individual full-scale pose with a clear margin. Each clip uses the same ready drawing for pose 1, matching the shared ready pose in the originals.

- [x] vorthax_hd_reference.png, vorthax_hd_attack1_1.png, vorthax_hd_attack1_2.png, vorthax_hd_attack1_3.png, vorthax_hd_attack1_4.png, vorthax_hd_attack2_1.png, vorthax_hd_attack2_2.png, vorthax_hd_attack2_3.png, vorthax_hd_attack2_4.png, vorthax_hd_hitdeath_1.png, vorthax_hd_hitdeath_2.png, vorthax_hd_hitdeath_3.png, vorthax_hd_hitdeath_4.png

**vorthax_hd_reference.png**

```
Redraw the creature in the attached reference picture, Drago, Heart of the Rift, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 850 px tall (never under 640 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack1_1.png**

```
The attached sheet vorthax_attack1.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack1_2.png**

```
The attached sheet vorthax_attack1.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack1_3.png**

```
The attached sheet vorthax_attack1.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack1_4.png**

```
The attached sheet vorthax_attack1.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack2_1.png**

```
The attached sheet vorthax_attack2.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack2_2.png**

```
The attached sheet vorthax_attack2.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack2_3.png**

```
The attached sheet vorthax_attack2.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_attack2_4.png**

```
The attached sheet vorthax_attack2.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_hitdeath_1.png**

```
The attached sheet vorthax_hitdeath.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_hitdeath_2.png**

```
The attached sheet vorthax_hitdeath.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_hitdeath_3.png**

```
The attached sheet vorthax_hitdeath.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**vorthax_hd_hitdeath_4.png**

```
The attached sheet vorthax_hitdeath.png is one row of 4 poses of Drago, Heart of the Rift, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 850 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Deep Watcher (`deep-watcher`, 09-tides/deep-watcher)

Now drawn 397 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). One pose per image, so the shell and tentacles fit at the target scale with clear margins. The opening ready drawing is shared across all three clips.

- [x] deep-watcher_hd_reference.png, deep-watcher_hd_attack1_1.png, deep-watcher_hd_attack1_2.png, deep-watcher_hd_attack1_3.png, deep-watcher_hd_attack1_4.png, deep-watcher_hd_attack2_1.png, deep-watcher_hd_attack2_2.png, deep-watcher_hd_attack2_3.png, deep-watcher_hd_attack2_4.png, deep-watcher_hd_hitdeath_1.png, deep-watcher_hd_hitdeath_2.png, deep-watcher_hd_hitdeath_3.png, deep-watcher_hd_hitdeath_4.png

**deep-watcher_hd_reference.png**

```
Redraw the creature in the attached reference picture, Deep Watcher, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack1_1.png**

```
The attached sheet deep-watcher_attack1.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack1_2.png**

```
The attached sheet deep-watcher_attack1.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack1_3.png**

```
The attached sheet deep-watcher_attack1.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack1_4.png**

```
The attached sheet deep-watcher_attack1.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack2_1.png**

```
The attached sheet deep-watcher_attack2.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack2_2.png**

```
The attached sheet deep-watcher_attack2.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack2_3.png**

```
The attached sheet deep-watcher_attack2.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_attack2_4.png**

```
The attached sheet deep-watcher_attack2.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_hitdeath_1.png**

```
The attached sheet deep-watcher_hitdeath.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_hitdeath_2.png**

```
The attached sheet deep-watcher_hitdeath.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_hitdeath_3.png**

```
The attached sheet deep-watcher_hitdeath.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**deep-watcher_hd_hitdeath_4.png**

```
The attached sheet deep-watcher_hitdeath.png is one row of 4 poses of Deep Watcher, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Planet Eater (`planet-eater`, 07-beyond/planet-eater)

Now drawn 418 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). One pose per image, with varied canvas sizes to accommodate both the upright and horizontal poses. The opening ready drawing is shared across the three clips.

- [x] planet-eater_hd_reference.png, planet-eater_hd_attack1_1.png, planet-eater_hd_attack1_2.png, planet-eater_hd_attack1_3.png, planet-eater_hd_attack1_4.png, planet-eater_hd_attack2_1.png, planet-eater_hd_attack2_2.png, planet-eater_hd_attack2_3.png, planet-eater_hd_attack2_4.png, planet-eater_hd_hitdeath_1.png, planet-eater_hd_hitdeath_2.png, planet-eater_hd_hitdeath_3.png, planet-eater_hd_hitdeath_4.png

**planet-eater_hd_reference.png**

```
Redraw the creature in the attached reference picture, Planet Eater, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack1_1.png**

```
The attached sheet planet-eater_attack1.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack1_2.png**

```
The attached sheet planet-eater_attack1.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack1_3.png**

```
The attached sheet planet-eater_attack1.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack1_4.png**

```
The attached sheet planet-eater_attack1.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack2_1.png**

```
The attached sheet planet-eater_attack2.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack2_2.png**

```
The attached sheet planet-eater_attack2.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack2_3.png**

```
The attached sheet planet-eater_attack2.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_attack2_4.png**

```
The attached sheet planet-eater_attack2.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_hitdeath_1.png**

```
The attached sheet planet-eater_hitdeath.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_hitdeath_2.png**

```
The attached sheet planet-eater_hitdeath.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_hitdeath_3.png**

```
The attached sheet planet-eater_hitdeath.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**planet-eater_hd_hitdeath_4.png**

```
The attached sheet planet-eater_hitdeath.png is one row of 4 poses of Planet Eater, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. Use a canvas that fits the subject at the shared scale, with clearance on all sides. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Xalvorr, the Last Eclipse (`xalvorr`, 12-ruin/xalvorr)

Now drawn 431 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). One pose per 1536 × 1024 PNG, including the ready reference, to keep the wing and tail tips inside the margins. The opening ready drawing is shared across the three clips.

- [x] xalvorr_hd_reference.png, xalvorr_hd_attack1_1.png, xalvorr_hd_attack1_2.png, xalvorr_hd_attack1_3.png, xalvorr_hd_attack1_4.png, xalvorr_hd_attack2_1.png, xalvorr_hd_attack2_2.png, xalvorr_hd_attack2_3.png, xalvorr_hd_attack2_4.png, xalvorr_hd_hitdeath_1.png, xalvorr_hd_hitdeath_2.png, xalvorr_hd_hitdeath_3.png, xalvorr_hd_hitdeath_4.png

**xalvorr_hd_reference.png**

```
Redraw the creature in the attached reference picture, Xalvorr, the Last Eclipse, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack1_1.png**

```
The attached sheet xalvorr_attack1.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack1_2.png**

```
The attached sheet xalvorr_attack1.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack1_3.png**

```
The attached sheet xalvorr_attack1.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack1_4.png**

```
The attached sheet xalvorr_attack1.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack2_1.png**

```
The attached sheet xalvorr_attack2.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack2_2.png**

```
The attached sheet xalvorr_attack2.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack2_3.png**

```
The attached sheet xalvorr_attack2.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_attack2_4.png**

```
The attached sheet xalvorr_attack2.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_hitdeath_1.png**

```
The attached sheet xalvorr_hitdeath.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 1 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_hitdeath_2.png**

```
The attached sheet xalvorr_hitdeath.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 2 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_hitdeath_3.png**

```
The attached sheet xalvorr_hitdeath.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 3 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**xalvorr_hd_hitdeath_4.png**

```
The attached sheet xalvorr_hitdeath.png is one row of 4 poses of Xalvorr, the Last Eclipse, facing right. Redraw only pose 4 from the left, alone, in exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Seraphine, the Gilded Warden (`seraphine`, 01-aurelion/seraphine)

Now drawn 439 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] seraphine_hd_reference.png, seraphine_hd_attack1_a.png, seraphine_hd_attack1_b.png, seraphine_hd_attack2_a.png, seraphine_hd_attack2_b.png, seraphine_hd_hitdeath_a.png, seraphine_hd_hitdeath_b.png

**seraphine_hd_reference.png**

```
Redraw the creature in the attached reference picture, Seraphine, the Gilded Warden, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**seraphine_hd_attack1_a.png**

```
The attached sheet seraphine_attack1.png is one row of 4 poses of Seraphine, the Gilded Warden, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**seraphine_hd_attack1_b.png**

```
The attached sheet seraphine_attack1.png is one row of 4 poses of Seraphine, the Gilded Warden, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**seraphine_hd_attack2_a.png**

```
The attached sheet seraphine_attack2.png is one row of 4 poses of Seraphine, the Gilded Warden, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**seraphine_hd_attack2_b.png**

```
The attached sheet seraphine_attack2.png is one row of 4 poses of Seraphine, the Gilded Warden, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**seraphine_hd_hitdeath_a.png**

```
The attached sheet seraphine_hitdeath.png is one row of 4 poses of Seraphine, the Gilded Warden, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**seraphine_hd_hitdeath_b.png**

```
The attached sheet seraphine_hitdeath.png is one row of 4 poses of Seraphine, the Gilded Warden, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### The Pearlbound Sovereign (`pearlbound-sovereign`, 09-tides/pearlbound-sovereign)

Now drawn 442 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] pearlbound-sovereign_hd_reference.png, pearlbound-sovereign_hd_attack1_a.png, pearlbound-sovereign_hd_attack1_b.png, pearlbound-sovereign_hd_attack2_a.png, pearlbound-sovereign_hd_attack2_b.png, pearlbound-sovereign_hd_hitdeath_a.png, pearlbound-sovereign_hd_hitdeath_b.png

**pearlbound-sovereign_hd_reference.png**

```
Redraw the creature in the attached reference picture, The Pearlbound Sovereign, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearlbound-sovereign_hd_attack1_a.png**

```
The attached sheet pearlbound-sovereign_attack1.png is one row of 4 poses of The Pearlbound Sovereign, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearlbound-sovereign_hd_attack1_b.png**

```
The attached sheet pearlbound-sovereign_attack1.png is one row of 4 poses of The Pearlbound Sovereign, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearlbound-sovereign_hd_attack2_a.png**

```
The attached sheet pearlbound-sovereign_attack2.png is one row of 4 poses of The Pearlbound Sovereign, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearlbound-sovereign_hd_attack2_b.png**

```
The attached sheet pearlbound-sovereign_attack2.png is one row of 4 poses of The Pearlbound Sovereign, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearlbound-sovereign_hd_hitdeath_a.png**

```
The attached sheet pearlbound-sovereign_hitdeath.png is one row of 4 poses of The Pearlbound Sovereign, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearlbound-sovereign_hd_hitdeath_b.png**

```
The attached sheet pearlbound-sovereign_hitdeath.png is one row of 4 poses of The Pearlbound Sovereign, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Morvane, the Hollow Maw (`morvane`, 12-ruin/morvane)

Now drawn 443 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] morvane_hd_reference.png, morvane_hd_attack1_a.png, morvane_hd_attack1_b.png, morvane_hd_attack2_a.png, morvane_hd_attack2_b.png, morvane_hd_hitdeath_a.png, morvane_hd_hitdeath_b.png

**morvane_hd_reference.png**

```
Redraw the creature in the attached reference picture, Morvane, the Hollow Maw, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**morvane_hd_attack1_a.png**

```
The attached sheet morvane_attack1.png is one row of 4 poses of Morvane, the Hollow Maw, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**morvane_hd_attack1_b.png**

```
The attached sheet morvane_attack1.png is one row of 4 poses of Morvane, the Hollow Maw, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**morvane_hd_attack2_a.png**

```
The attached sheet morvane_attack2.png is one row of 4 poses of Morvane, the Hollow Maw, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**morvane_hd_attack2_b.png**

```
The attached sheet morvane_attack2.png is one row of 4 poses of Morvane, the Hollow Maw, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**morvane_hd_hitdeath_a.png**

```
The attached sheet morvane_hitdeath.png is one row of 4 poses of Morvane, the Hollow Maw, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**morvane_hd_hitdeath_b.png**

```
The attached sheet morvane_hitdeath.png is one row of 4 poses of Morvane, the Hollow Maw, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Aethrion, the Storm-Crowned (`aethrion`, 12-ruin/aethrion)

Now drawn 452 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] aethrion_hd_reference.png, aethrion_hd_attack1_a.png, aethrion_hd_attack1_b.png, aethrion_hd_attack2_a.png, aethrion_hd_attack2_b.png, aethrion_hd_hitdeath_a.png, aethrion_hd_hitdeath_b.png

**aethrion_hd_reference.png**

```
Redraw the creature in the attached reference picture, Aethrion, the Storm-Crowned, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**aethrion_hd_attack1_a.png**

```
The attached sheet aethrion_attack1.png is one row of 4 poses of Aethrion, the Storm-Crowned, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**aethrion_hd_attack1_b.png**

```
The attached sheet aethrion_attack1.png is one row of 4 poses of Aethrion, the Storm-Crowned, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**aethrion_hd_attack2_a.png**

```
The attached sheet aethrion_attack2.png is one row of 4 poses of Aethrion, the Storm-Crowned, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**aethrion_hd_attack2_b.png**

```
The attached sheet aethrion_attack2.png is one row of 4 poses of Aethrion, the Storm-Crowned, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**aethrion_hd_hitdeath_a.png**

```
The attached sheet aethrion_hitdeath.png is one row of 4 poses of Aethrion, the Storm-Crowned, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**aethrion_hd_hitdeath_b.png**

```
The attached sheet aethrion_hitdeath.png is one row of 4 poses of Aethrion, the Storm-Crowned, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Pyrewing, the Cinder Tyrant (`pyrewing`, 12-ruin/pyrewing)

Now drawn 453 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] pyrewing_hd_reference.png, pyrewing_hd_attack1_a.png, pyrewing_hd_attack1_b.png, pyrewing_hd_attack2_a.png, pyrewing_hd_attack2_b.png, pyrewing_hd_hitdeath_a.png, pyrewing_hd_hitdeath_b.png

**pyrewing_hd_reference.png**

```
Redraw the creature in the attached reference picture, Pyrewing, the Cinder Tyrant, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pyrewing_hd_attack1_a.png**

```
The attached sheet pyrewing_attack1.png is one row of 4 poses of Pyrewing, the Cinder Tyrant, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pyrewing_hd_attack1_b.png**

```
The attached sheet pyrewing_attack1.png is one row of 4 poses of Pyrewing, the Cinder Tyrant, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pyrewing_hd_attack2_a.png**

```
The attached sheet pyrewing_attack2.png is one row of 4 poses of Pyrewing, the Cinder Tyrant, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pyrewing_hd_attack2_b.png**

```
The attached sheet pyrewing_attack2.png is one row of 4 poses of Pyrewing, the Cinder Tyrant, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pyrewing_hd_hitdeath_a.png**

```
The attached sheet pyrewing_hitdeath.png is one row of 4 poses of Pyrewing, the Cinder Tyrant, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pyrewing_hd_hitdeath_b.png**

```
The attached sheet pyrewing_hitdeath.png is one row of 4 poses of Pyrewing, the Cinder Tyrant, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Bronze Sphinx (`bronze-sphinx`, 11-sands/bronze-sphinx)

Now drawn 454 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] bronze-sphinx_hd_reference.png, bronze-sphinx_hd_attack1_a.png, bronze-sphinx_hd_attack1_b.png, bronze-sphinx_hd_attack2_a.png, bronze-sphinx_hd_attack2_b.png, bronze-sphinx_hd_hitdeath_a.png, bronze-sphinx_hd_hitdeath_b.png

**bronze-sphinx_hd_reference.png**

```
Redraw the creature in the attached reference picture, Bronze Sphinx, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bronze-sphinx_hd_attack1_a.png**

```
The attached sheet bronze-sphinx_attack1.png is one row of 4 poses of Bronze Sphinx, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bronze-sphinx_hd_attack1_b.png**

```
The attached sheet bronze-sphinx_attack1.png is one row of 4 poses of Bronze Sphinx, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bronze-sphinx_hd_attack2_a.png**

```
The attached sheet bronze-sphinx_attack2.png is one row of 4 poses of Bronze Sphinx, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bronze-sphinx_hd_attack2_b.png**

```
The attached sheet bronze-sphinx_attack2.png is one row of 4 poses of Bronze Sphinx, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bronze-sphinx_hd_hitdeath_a.png**

```
The attached sheet bronze-sphinx_hitdeath.png is one row of 4 poses of Bronze Sphinx, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bronze-sphinx_hd_hitdeath_b.png**

```
The attached sheet bronze-sphinx_hitdeath.png is one row of 4 poses of Bronze Sphinx, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Dream Custodian (`dream-custodian`, 10-vespera/dream-custodian)

Now drawn 459 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] dream-custodian_hd_reference.png, dream-custodian_hd_attack1_a.png, dream-custodian_hd_attack1_b.png, dream-custodian_hd_attack2_a.png, dream-custodian_hd_attack2_b.png, dream-custodian_hd_hitdeath_a.png, dream-custodian_hd_hitdeath_b.png

**dream-custodian_hd_reference.png**

```
Redraw the creature in the attached reference picture, Dream Custodian, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dream-custodian_hd_attack1_a.png**

```
The attached sheet dream-custodian_attack1.png is one row of 4 poses of Dream Custodian, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dream-custodian_hd_attack1_b.png**

```
The attached sheet dream-custodian_attack1.png is one row of 4 poses of Dream Custodian, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dream-custodian_hd_attack2_a.png**

```
The attached sheet dream-custodian_attack2.png is one row of 4 poses of Dream Custodian, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dream-custodian_hd_attack2_b.png**

```
The attached sheet dream-custodian_attack2.png is one row of 4 poses of Dream Custodian, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dream-custodian_hd_hitdeath_a.png**

```
The attached sheet dream-custodian_hitdeath.png is one row of 4 poses of Dream Custodian, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dream-custodian_hd_hitdeath_b.png**

```
The attached sheet dream-custodian_hitdeath.png is one row of 4 poses of Dream Custodian, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Nacreth, the Glassscale (`nacreth`, 12-ruin/nacreth)

Now drawn 459 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] nacreth_hd_reference.png, nacreth_hd_attack1_a.png, nacreth_hd_attack1_b.png, nacreth_hd_attack2_a.png, nacreth_hd_attack2_b.png, nacreth_hd_hitdeath_a.png, nacreth_hd_hitdeath_b.png

**nacreth_hd_reference.png**

```
Redraw the creature in the attached reference picture, Nacreth, the Glassscale, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nacreth_hd_attack1_a.png**

```
The attached sheet nacreth_attack1.png is one row of 4 poses of Nacreth, the Glassscale, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nacreth_hd_attack1_b.png**

```
The attached sheet nacreth_attack1.png is one row of 4 poses of Nacreth, the Glassscale, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nacreth_hd_attack2_a.png**

```
The attached sheet nacreth_attack2.png is one row of 4 poses of Nacreth, the Glassscale, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nacreth_hd_attack2_b.png**

```
The attached sheet nacreth_attack2.png is one row of 4 poses of Nacreth, the Glassscale, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nacreth_hd_hitdeath_a.png**

```
The attached sheet nacreth_hitdeath.png is one row of 4 poses of Nacreth, the Glassscale, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nacreth_hd_hitdeath_b.png**

```
The attached sheet nacreth_hitdeath.png is one row of 4 poses of Nacreth, the Glassscale, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### The Ashbound Colossus (`ashbound-colossus`, 08-cinder/ashbound-colossus)

Now drawn 461 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] ashbound-colossus_hd_reference.png, ashbound-colossus_hd_attack1_a.png, ashbound-colossus_hd_attack1_b.png, ashbound-colossus_hd_attack2_a.png, ashbound-colossus_hd_attack2_b.png, ashbound-colossus_hd_hitdeath_a.png, ashbound-colossus_hd_hitdeath_b.png

**ashbound-colossus_hd_reference.png**

```
Redraw the creature in the attached reference picture, The Ashbound Colossus, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**ashbound-colossus_hd_attack1_a.png**

```
The attached sheet ashbound-colossus_attack1.png is one row of 4 poses of The Ashbound Colossus, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**ashbound-colossus_hd_attack1_b.png**

```
The attached sheet ashbound-colossus_attack1.png is one row of 4 poses of The Ashbound Colossus, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**ashbound-colossus_hd_attack2_a.png**

```
The attached sheet ashbound-colossus_attack2.png is one row of 4 poses of The Ashbound Colossus, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**ashbound-colossus_hd_attack2_b.png**

```
The attached sheet ashbound-colossus_attack2.png is one row of 4 poses of The Ashbound Colossus, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**ashbound-colossus_hd_hitdeath_a.png**

```
The attached sheet ashbound-colossus_hitdeath.png is one row of 4 poses of The Ashbound Colossus, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**ashbound-colossus_hd_hitdeath_b.png**

```
The attached sheet ashbound-colossus_hitdeath.png is one row of 4 poses of The Ashbound Colossus, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### The Sandbound Chronicler (`sandbound-chronicler`, 11-sands/sandbound-chronicler)

Now drawn 472 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] sandbound-chronicler_hd_reference.png, sandbound-chronicler_hd_attack1_a.png, sandbound-chronicler_hd_attack1_b.png, sandbound-chronicler_hd_attack2_a.png, sandbound-chronicler_hd_attack2_b.png, sandbound-chronicler_hd_hitdeath_a.png, sandbound-chronicler_hd_hitdeath_b.png

**sandbound-chronicler_hd_reference.png**

```
Redraw the creature in the attached reference picture, The Sandbound Chronicler, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sandbound-chronicler_hd_attack1_a.png**

```
The attached sheet sandbound-chronicler_attack1.png is one row of 4 poses of The Sandbound Chronicler, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sandbound-chronicler_hd_attack1_b.png**

```
The attached sheet sandbound-chronicler_attack1.png is one row of 4 poses of The Sandbound Chronicler, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sandbound-chronicler_hd_attack2_a.png**

```
The attached sheet sandbound-chronicler_attack2.png is one row of 4 poses of The Sandbound Chronicler, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sandbound-chronicler_hd_attack2_b.png**

```
The attached sheet sandbound-chronicler_attack2.png is one row of 4 poses of The Sandbound Chronicler, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sandbound-chronicler_hd_hitdeath_a.png**

```
The attached sheet sandbound-chronicler_hitdeath.png is one row of 4 poses of The Sandbound Chronicler, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sandbound-chronicler_hd_hitdeath_b.png**

```
The attached sheet sandbound-chronicler_hitdeath.png is one row of 4 poses of The Sandbound Chronicler, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Walking Kiln (`walking-kiln`, 08-cinder/walking-kiln)

Now drawn 473 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] walking-kiln_hd_reference.png, walking-kiln_hd_attack1_a.png, walking-kiln_hd_attack1_b.png, walking-kiln_hd_attack2_a.png, walking-kiln_hd_attack2_b.png, walking-kiln_hd_hitdeath_a.png, walking-kiln_hd_hitdeath_b.png

**walking-kiln_hd_reference.png**

```
Redraw the creature in the attached reference picture, Walking Kiln, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**walking-kiln_hd_attack1_a.png**

```
The attached sheet walking-kiln_attack1.png is one row of 4 poses of Walking Kiln, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**walking-kiln_hd_attack1_b.png**

```
The attached sheet walking-kiln_attack1.png is one row of 4 poses of Walking Kiln, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**walking-kiln_hd_attack2_a.png**

```
The attached sheet walking-kiln_attack2.png is one row of 4 poses of Walking Kiln, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**walking-kiln_hd_attack2_b.png**

```
The attached sheet walking-kiln_attack2.png is one row of 4 poses of Walking Kiln, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**walking-kiln_hd_hitdeath_a.png**

```
The attached sheet walking-kiln_hitdeath.png is one row of 4 poses of Walking Kiln, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**walking-kiln_hd_hitdeath_b.png**

```
The attached sheet walking-kiln_hitdeath.png is one row of 4 poses of Walking Kiln, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Cinder Marshal (`cinder-marshal`, 08-cinder/cinder-marshal)

Now drawn 484 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] cinder-marshal_hd_reference.png, cinder-marshal_hd_attack1_a.png, cinder-marshal_hd_attack1_b.png, cinder-marshal_hd_attack2_a.png, cinder-marshal_hd_attack2_b.png, cinder-marshal_hd_hitdeath_a.png, cinder-marshal_hd_hitdeath_b.png

**cinder-marshal_hd_reference.png**

```
Redraw the creature in the attached reference picture, Cinder Marshal, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**cinder-marshal_hd_attack1_a.png**

```
The attached sheet cinder-marshal_attack1.png is one row of 4 poses of Cinder Marshal, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**cinder-marshal_hd_attack1_b.png**

```
The attached sheet cinder-marshal_attack1.png is one row of 4 poses of Cinder Marshal, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**cinder-marshal_hd_attack2_a.png**

```
The attached sheet cinder-marshal_attack2.png is one row of 4 poses of Cinder Marshal, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**cinder-marshal_hd_attack2_b.png**

```
The attached sheet cinder-marshal_attack2.png is one row of 4 poses of Cinder Marshal, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**cinder-marshal_hd_hitdeath_a.png**

```
The attached sheet cinder-marshal_hitdeath.png is one row of 4 poses of Cinder Marshal, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**cinder-marshal_hd_hitdeath_b.png**

```
The attached sheet cinder-marshal_hitdeath.png is one row of 4 poses of Cinder Marshal, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Sparring Dummy (`sparring-dummy`, 15-training/sparring-dummy)

Now drawn 493 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] sparring-dummy_hd_reference.png, sparring-dummy_hd_attack1_a.png, sparring-dummy_hd_attack1_b.png, sparring-dummy_hd_attack2_a.png, sparring-dummy_hd_attack2_b.png, sparring-dummy_hd_hitdeath_a.png, sparring-dummy_hd_hitdeath_b.png

**sparring-dummy_hd_reference.png**

```
Redraw the creature in the attached reference picture, Sparring Dummy, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sparring-dummy_hd_attack1_a.png**

```
The attached sheet sparring-dummy_attack1.png is one row of 4 poses of Sparring Dummy, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sparring-dummy_hd_attack1_b.png**

```
The attached sheet sparring-dummy_attack1.png is one row of 4 poses of Sparring Dummy, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sparring-dummy_hd_attack2_a.png**

```
The attached sheet sparring-dummy_attack2.png is one row of 4 poses of Sparring Dummy, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sparring-dummy_hd_attack2_b.png**

```
The attached sheet sparring-dummy_attack2.png is one row of 4 poses of Sparring Dummy, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sparring-dummy_hd_hitdeath_a.png**

```
The attached sheet sparring-dummy_hitdeath.png is one row of 4 poses of Sparring Dummy, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**sparring-dummy_hd_hitdeath_b.png**

```
The attached sheet sparring-dummy_hitdeath.png is one row of 4 poses of Sparring Dummy, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Hourglass Giant (`hourglass-giant`, 11-sands/hourglass-giant)

Now drawn 495 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] hourglass-giant_hd_reference.png, hourglass-giant_hd_attack1_a.png, hourglass-giant_hd_attack1_b.png, hourglass-giant_hd_attack2_a.png, hourglass-giant_hd_attack2_b.png, hourglass-giant_hd_hitdeath_a.png, hourglass-giant_hd_hitdeath_b.png

**hourglass-giant_hd_reference.png**

```
Redraw the creature in the attached reference picture, Hourglass Giant, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hourglass-giant_hd_attack1_a.png**

```
The attached sheet hourglass-giant_attack1.png is one row of 4 poses of Hourglass Giant, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hourglass-giant_hd_attack1_b.png**

```
The attached sheet hourglass-giant_attack1.png is one row of 4 poses of Hourglass Giant, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hourglass-giant_hd_attack2_a.png**

```
The attached sheet hourglass-giant_attack2.png is one row of 4 poses of Hourglass Giant, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hourglass-giant_hd_attack2_b.png**

```
The attached sheet hourglass-giant_attack2.png is one row of 4 poses of Hourglass Giant, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hourglass-giant_hd_hitdeath_a.png**

```
The attached sheet hourglass-giant_hitdeath.png is one row of 4 poses of Hourglass Giant, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hourglass-giant_hd_hitdeath_b.png**

```
The attached sheet hourglass-giant_hitdeath.png is one row of 4 poses of Hourglass Giant, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### KR-0N "Kron", Foundry Overseer (`kron`, 02-nexus/kron)

Now drawn 496 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] kron_hd_reference.png, kron_hd_attack1_a.png, kron_hd_attack1_b.png, kron_hd_attack2_a.png, kron_hd_attack2_b.png, kron_hd_hitdeath_a.png, kron_hd_hitdeath_b.png

**kron_hd_reference.png**

```
Redraw the creature in the attached reference picture, KR-0N "Kron", Foundry Overseer, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**kron_hd_attack1_a.png**

```
The attached sheet kron_attack1.png is one row of 4 poses of KR-0N "Kron", Foundry Overseer, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**kron_hd_attack1_b.png**

```
The attached sheet kron_attack1.png is one row of 4 poses of KR-0N "Kron", Foundry Overseer, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**kron_hd_attack2_a.png**

```
The attached sheet kron_attack2.png is one row of 4 poses of KR-0N "Kron", Foundry Overseer, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**kron_hd_attack2_b.png**

```
The attached sheet kron_attack2.png is one row of 4 poses of KR-0N "Kron", Foundry Overseer, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**kron_hd_hitdeath_a.png**

```
The attached sheet kron_hitdeath.png is one row of 4 poses of KR-0N "Kron", Foundry Overseer, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**kron_hd_hitdeath_b.png**

```
The attached sheet kron_hitdeath.png is one row of 4 poses of KR-0N "Kron", Foundry Overseer, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Nyxara, the Veiled Matriarch (`nyxara`, 04-umbral/nyxara)

Now drawn 502 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] nyxara_hd_reference.png, nyxara_hd_attack1_a.png, nyxara_hd_attack1_b.png, nyxara_hd_attack2_a.png, nyxara_hd_attack2_b.png, nyxara_hd_hitdeath_a.png, nyxara_hd_hitdeath_b.png

**nyxara_hd_reference.png**

```
Redraw the creature in the attached reference picture, Nyxara, the Veiled Matriarch, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nyxara_hd_attack1_a.png**

```
The attached sheet nyxara_attack1.png is one row of 4 poses of Nyxara, the Veiled Matriarch, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nyxara_hd_attack1_b.png**

```
The attached sheet nyxara_attack1.png is one row of 4 poses of Nyxara, the Veiled Matriarch, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nyxara_hd_attack2_a.png**

```
The attached sheet nyxara_attack2.png is one row of 4 poses of Nyxara, the Veiled Matriarch, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nyxara_hd_attack2_b.png**

```
The attached sheet nyxara_attack2.png is one row of 4 poses of Nyxara, the Veiled Matriarch, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nyxara_hd_hitdeath_a.png**

```
The attached sheet nyxara_hitdeath.png is one row of 4 poses of Nyxara, the Veiled Matriarch, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nyxara_hd_hitdeath_b.png**

```
The attached sheet nyxara_hitdeath.png is one row of 4 poses of Nyxara, the Veiled Matriarch, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### The Dreaming Monarch (`dreaming-monarch`, 10-vespera/dreaming-monarch)

Now drawn 509 px tall, stands 600 on stage: ready stance **800 px** tall (at least 600). Two poses per image.

- [ ] dreaming-monarch_hd_reference.png, dreaming-monarch_hd_attack1_a.png, dreaming-monarch_hd_attack1_b.png, dreaming-monarch_hd_attack2_a.png, dreaming-monarch_hd_attack2_b.png, dreaming-monarch_hd_hitdeath_a.png, dreaming-monarch_hd_hitdeath_b.png

**dreaming-monarch_hd_reference.png**

```
Redraw the creature in the attached reference picture, The Dreaming Monarch, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 800 px tall (never under 600 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreaming-monarch_hd_attack1_a.png**

```
The attached sheet dreaming-monarch_attack1.png is one row of 4 poses of The Dreaming Monarch, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreaming-monarch_hd_attack1_b.png**

```
The attached sheet dreaming-monarch_attack1.png is one row of 4 poses of The Dreaming Monarch, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreaming-monarch_hd_attack2_a.png**

```
The attached sheet dreaming-monarch_attack2.png is one row of 4 poses of The Dreaming Monarch, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreaming-monarch_hd_attack2_b.png**

```
The attached sheet dreaming-monarch_attack2.png is one row of 4 poses of The Dreaming Monarch, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreaming-monarch_hd_hitdeath_a.png**

```
The attached sheet dreaming-monarch_hitdeath.png is one row of 4 poses of The Dreaming Monarch, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreaming-monarch_hd_hitdeath_b.png**

```
The attached sheet dreaming-monarch_hitdeath.png is one row of 4 poses of The Dreaming Monarch, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 800 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Scrapyard Centipede (`scrapyard-centipede`, 02-nexus/scrapyard-centipede)

Now drawn 222 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Wide creature: **one pose per image**.

- [ ] scrapyard-centipede_hd_reference.png, scrapyard-centipede_hd_attack1_1.png, scrapyard-centipede_hd_attack1_2.png, scrapyard-centipede_hd_attack1_3.png, scrapyard-centipede_hd_attack1_4.png, scrapyard-centipede_hd_attack2_1.png, scrapyard-centipede_hd_attack2_2.png, scrapyard-centipede_hd_attack2_3.png, scrapyard-centipede_hd_attack2_4.png, scrapyard-centipede_hd_hitdeath_1.png, scrapyard-centipede_hd_hitdeath_2.png, scrapyard-centipede_hd_hitdeath_3.png, scrapyard-centipede_hd_hitdeath_4.png

**scrapyard-centipede_hd_reference.png**

```
Redraw the creature in the attached reference picture, Scrapyard Centipede, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack1_1.png**

```
The attached sheet scrapyard-centipede_attack1.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack1_2.png**

```
The attached sheet scrapyard-centipede_attack1.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack1_3.png**

```
The attached sheet scrapyard-centipede_attack1.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack1_4.png**

```
The attached sheet scrapyard-centipede_attack1.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack2_1.png**

```
The attached sheet scrapyard-centipede_attack2.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack2_2.png**

```
The attached sheet scrapyard-centipede_attack2.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack2_3.png**

```
The attached sheet scrapyard-centipede_attack2.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_attack2_4.png**

```
The attached sheet scrapyard-centipede_attack2.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_hitdeath_1.png**

```
The attached sheet scrapyard-centipede_hitdeath.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_hitdeath_2.png**

```
The attached sheet scrapyard-centipede_hitdeath.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_hitdeath_3.png**

```
The attached sheet scrapyard-centipede_hitdeath.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrapyard-centipede_hd_hitdeath_4.png**

```
The attached sheet scrapyard-centipede_hitdeath.png is one row of 4 poses of Scrapyard Centipede, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Glass Scorpion (`glass-scorpion`, 11-sands/glass-scorpion)

Now drawn 256 px tall, stands 390 on stage: ready stance **520 px** tall (at least 390). Wide creature: **one pose per image**.

- [ ] glass-scorpion_hd_reference.png, glass-scorpion_hd_attack1_1.png, glass-scorpion_hd_attack1_2.png, glass-scorpion_hd_attack1_3.png, glass-scorpion_hd_attack1_4.png, glass-scorpion_hd_attack2_1.png, glass-scorpion_hd_attack2_2.png, glass-scorpion_hd_attack2_3.png, glass-scorpion_hd_attack2_4.png, glass-scorpion_hd_hitdeath_1.png, glass-scorpion_hd_hitdeath_2.png, glass-scorpion_hd_hitdeath_3.png, glass-scorpion_hd_hitdeath_4.png

**glass-scorpion_hd_reference.png**

```
Redraw the creature in the attached reference picture, Glass Scorpion, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 520 px tall (never under 390 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack1_1.png**

```
The attached sheet glass-scorpion_attack1.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack1_2.png**

```
The attached sheet glass-scorpion_attack1.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack1_3.png**

```
The attached sheet glass-scorpion_attack1.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack1_4.png**

```
The attached sheet glass-scorpion_attack1.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack2_1.png**

```
The attached sheet glass-scorpion_attack2.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack2_2.png**

```
The attached sheet glass-scorpion_attack2.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack2_3.png**

```
The attached sheet glass-scorpion_attack2.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_attack2_4.png**

```
The attached sheet glass-scorpion_attack2.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_hitdeath_1.png**

```
The attached sheet glass-scorpion_hitdeath.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_hitdeath_2.png**

```
The attached sheet glass-scorpion_hitdeath.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_hitdeath_3.png**

```
The attached sheet glass-scorpion_hitdeath.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**glass-scorpion_hd_hitdeath_4.png**

```
The attached sheet glass-scorpion_hitdeath.png is one row of 4 poses of Glass Scorpion, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Scrap Collector (`scrap-collector`, 02-nexus/scrap-collector)

Now drawn 318 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Two poses per image.

- [ ] scrap-collector_hd_reference.png, scrap-collector_hd_attack1_a.png, scrap-collector_hd_attack1_b.png, scrap-collector_hd_attack2_a.png, scrap-collector_hd_attack2_b.png, scrap-collector_hd_hitdeath_a.png, scrap-collector_hd_hitdeath_b.png

**scrap-collector_hd_reference.png**

```
Redraw the creature in the attached reference picture, Scrap Collector, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrap-collector_hd_attack1_a.png**

```
The attached sheet scrap-collector_attack1.png is one row of 4 poses of Scrap Collector, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrap-collector_hd_attack1_b.png**

```
The attached sheet scrap-collector_attack1.png is one row of 4 poses of Scrap Collector, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrap-collector_hd_attack2_a.png**

```
The attached sheet scrap-collector_attack2.png is one row of 4 poses of Scrap Collector, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrap-collector_hd_attack2_b.png**

```
The attached sheet scrap-collector_attack2.png is one row of 4 poses of Scrap Collector, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrap-collector_hd_hitdeath_a.png**

```
The attached sheet scrap-collector_hitdeath.png is one row of 4 poses of Scrap Collector, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**scrap-collector_hd_hitdeath_b.png**

```
The attached sheet scrap-collector_hitdeath.png is one row of 4 poses of Scrap Collector, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Mirror Ray (`mirror-ray`, 09-tides/mirror-ray)

Now drawn 328 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Wide creature: **one pose per image**.

- [ ] mirror-ray_hd_reference.png, mirror-ray_hd_attack1_1.png, mirror-ray_hd_attack1_2.png, mirror-ray_hd_attack1_3.png, mirror-ray_hd_attack1_4.png, mirror-ray_hd_attack2_1.png, mirror-ray_hd_attack2_2.png, mirror-ray_hd_attack2_3.png, mirror-ray_hd_attack2_4.png, mirror-ray_hd_hitdeath_1.png, mirror-ray_hd_hitdeath_2.png, mirror-ray_hd_hitdeath_3.png, mirror-ray_hd_hitdeath_4.png

**mirror-ray_hd_reference.png**

```
Redraw the creature in the attached reference picture, Mirror Ray, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack1_1.png**

```
The attached sheet mirror-ray_attack1.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack1_2.png**

```
The attached sheet mirror-ray_attack1.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack1_3.png**

```
The attached sheet mirror-ray_attack1.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack1_4.png**

```
The attached sheet mirror-ray_attack1.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack2_1.png**

```
The attached sheet mirror-ray_attack2.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack2_2.png**

```
The attached sheet mirror-ray_attack2.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack2_3.png**

```
The attached sheet mirror-ray_attack2.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_attack2_4.png**

```
The attached sheet mirror-ray_attack2.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_hitdeath_1.png**

```
The attached sheet mirror-ray_hitdeath.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_hitdeath_2.png**

```
The attached sheet mirror-ray_hitdeath.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_hitdeath_3.png**

```
The attached sheet mirror-ray_hitdeath.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mirror-ray_hd_hitdeath_4.png**

```
The attached sheet mirror-ray_hitdeath.png is one row of 4 poses of Mirror Ray, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Puppet of Knots (`puppet-of-knots`, 04-umbral/puppet-of-knots)

Now drawn 280 px tall, stands 390 on stage: ready stance **520 px** tall (at least 390). Two poses per image.

- [ ] puppet-of-knots_hd_reference.png, puppet-of-knots_hd_attack1_a.png, puppet-of-knots_hd_attack1_b.png, puppet-of-knots_hd_attack2_a.png, puppet-of-knots_hd_attack2_b.png, puppet-of-knots_hd_hitdeath_a.png, puppet-of-knots_hd_hitdeath_b.png

**puppet-of-knots_hd_reference.png**

```
Redraw the creature in the attached reference picture, Puppet of Knots, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 520 px tall (never under 390 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**puppet-of-knots_hd_attack1_a.png**

```
The attached sheet puppet-of-knots_attack1.png is one row of 4 poses of Puppet of Knots, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**puppet-of-knots_hd_attack1_b.png**

```
The attached sheet puppet-of-knots_attack1.png is one row of 4 poses of Puppet of Knots, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**puppet-of-knots_hd_attack2_a.png**

```
The attached sheet puppet-of-knots_attack2.png is one row of 4 poses of Puppet of Knots, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**puppet-of-knots_hd_attack2_b.png**

```
The attached sheet puppet-of-knots_attack2.png is one row of 4 poses of Puppet of Knots, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**puppet-of-knots_hd_hitdeath_a.png**

```
The attached sheet puppet-of-knots_hitdeath.png is one row of 4 poses of Puppet of Knots, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**puppet-of-knots_hd_hitdeath_b.png**

```
The attached sheet puppet-of-knots_hitdeath.png is one row of 4 poses of Puppet of Knots, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Dreadnought (`dreadnought`, 14-companions/dreadnought)

Now drawn 281 px tall, stands 380 on stage: ready stance **510 px** tall (at least 380). Wide creature: **one pose per image**.

- [ ] dreadnought_hd_reference.png, dreadnought_hd_attack1_1.png, dreadnought_hd_attack1_2.png, dreadnought_hd_attack1_3.png, dreadnought_hd_attack1_4.png, dreadnought_hd_attack2_1.png, dreadnought_hd_attack2_2.png, dreadnought_hd_attack2_3.png, dreadnought_hd_attack2_4.png, dreadnought_hd_hitdeath_1.png, dreadnought_hd_hitdeath_2.png, dreadnought_hd_hitdeath_3.png, dreadnought_hd_hitdeath_4.png

**dreadnought_hd_reference.png**

```
Redraw the creature in the attached reference picture, Dreadnought, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 510 px tall (never under 380 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack1_1.png**

```
The attached sheet dreadnought_attack1.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack1_2.png**

```
The attached sheet dreadnought_attack1.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack1_3.png**

```
The attached sheet dreadnought_attack1.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack1_4.png**

```
The attached sheet dreadnought_attack1.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack2_1.png**

```
The attached sheet dreadnought_attack2.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack2_2.png**

```
The attached sheet dreadnought_attack2.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack2_3.png**

```
The attached sheet dreadnought_attack2.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_attack2_4.png**

```
The attached sheet dreadnought_attack2.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_hitdeath_1.png**

```
The attached sheet dreadnought_hitdeath.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_hitdeath_2.png**

```
The attached sheet dreadnought_hitdeath.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_hitdeath_3.png**

```
The attached sheet dreadnought_hitdeath.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**dreadnought_hd_hitdeath_4.png**

```
The attached sheet dreadnought_hitdeath.png is one row of 4 poses of Dreadnought, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Marble Mantis (`marble-mantis`, 01-aurelion/marble-mantis)

Now drawn 349 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Two poses per image.

- [ ] marble-mantis_hd_reference.png, marble-mantis_hd_attack1_a.png, marble-mantis_hd_attack1_b.png, marble-mantis_hd_attack2_a.png, marble-mantis_hd_attack2_b.png, marble-mantis_hd_hitdeath_a.png, marble-mantis_hd_hitdeath_b.png

**marble-mantis_hd_reference.png**

```
Redraw the creature in the attached reference picture, Marble Mantis, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**marble-mantis_hd_attack1_a.png**

```
The attached sheet marble-mantis_attack1.png is one row of 4 poses of Marble Mantis, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**marble-mantis_hd_attack1_b.png**

```
The attached sheet marble-mantis_attack1.png is one row of 4 poses of Marble Mantis, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**marble-mantis_hd_attack2_a.png**

```
The attached sheet marble-mantis_attack2.png is one row of 4 poses of Marble Mantis, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**marble-mantis_hd_attack2_b.png**

```
The attached sheet marble-mantis_attack2.png is one row of 4 poses of Marble Mantis, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**marble-mantis_hd_hitdeath_a.png**

```
The attached sheet marble-mantis_hitdeath.png is one row of 4 poses of Marble Mantis, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**marble-mantis_hd_hitdeath_b.png**

```
The attached sheet marble-mantis_hitdeath.png is one row of 4 poses of Marble Mantis, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### War Engine (`war-engine`, 14-companions/war-engine)

Now drawn 285 px tall, stands 380 on stage: ready stance **510 px** tall (at least 380). Wide creature: **one pose per image**.

- [ ] war-engine_hd_reference.png, war-engine_hd_attack1_1.png, war-engine_hd_attack1_2.png, war-engine_hd_attack1_3.png, war-engine_hd_attack1_4.png, war-engine_hd_attack2_1.png, war-engine_hd_attack2_2.png, war-engine_hd_attack2_3.png, war-engine_hd_attack2_4.png, war-engine_hd_hitdeath_1.png, war-engine_hd_hitdeath_2.png, war-engine_hd_hitdeath_3.png, war-engine_hd_hitdeath_4.png

**war-engine_hd_reference.png**

```
Redraw the creature in the attached reference picture, War Engine, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 510 px tall (never under 380 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack1_1.png**

```
The attached sheet war-engine_attack1.png is one row of 4 poses of War Engine, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack1_2.png**

```
The attached sheet war-engine_attack1.png is one row of 4 poses of War Engine, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack1_3.png**

```
The attached sheet war-engine_attack1.png is one row of 4 poses of War Engine, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack1_4.png**

```
The attached sheet war-engine_attack1.png is one row of 4 poses of War Engine, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack2_1.png**

```
The attached sheet war-engine_attack2.png is one row of 4 poses of War Engine, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack2_2.png**

```
The attached sheet war-engine_attack2.png is one row of 4 poses of War Engine, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack2_3.png**

```
The attached sheet war-engine_attack2.png is one row of 4 poses of War Engine, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_attack2_4.png**

```
The attached sheet war-engine_attack2.png is one row of 4 poses of War Engine, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_hitdeath_1.png**

```
The attached sheet war-engine_hitdeath.png is one row of 4 poses of War Engine, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_hitdeath_2.png**

```
The attached sheet war-engine_hitdeath.png is one row of 4 poses of War Engine, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_hitdeath_3.png**

```
The attached sheet war-engine_hitdeath.png is one row of 4 poses of War Engine, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**war-engine_hd_hitdeath_4.png**

```
The attached sheet war-engine_hitdeath.png is one row of 4 poses of War Engine, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 510 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Hooded Acolyte (`hooded-acolyte`, 04-umbral/hooded-acolyte)

Now drawn 356 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Two poses per image.

- [ ] hooded-acolyte_hd_reference.png, hooded-acolyte_hd_attack1_a.png, hooded-acolyte_hd_attack1_b.png, hooded-acolyte_hd_attack2_a.png, hooded-acolyte_hd_attack2_b.png, hooded-acolyte_hd_hitdeath_a.png, hooded-acolyte_hd_hitdeath_b.png

**hooded-acolyte_hd_reference.png**

```
Redraw the creature in the attached reference picture, Hooded Acolyte, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hooded-acolyte_hd_attack1_a.png**

```
The attached sheet hooded-acolyte_attack1.png is one row of 4 poses of Hooded Acolyte, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hooded-acolyte_hd_attack1_b.png**

```
The attached sheet hooded-acolyte_attack1.png is one row of 4 poses of Hooded Acolyte, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hooded-acolyte_hd_attack2_a.png**

```
The attached sheet hooded-acolyte_attack2.png is one row of 4 poses of Hooded Acolyte, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hooded-acolyte_hd_attack2_b.png**

```
The attached sheet hooded-acolyte_attack2.png is one row of 4 poses of Hooded Acolyte, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hooded-acolyte_hd_hitdeath_a.png**

```
The attached sheet hooded-acolyte_hitdeath.png is one row of 4 poses of Hooded Acolyte, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**hooded-acolyte_hd_hitdeath_b.png**

```
The attached sheet hooded-acolyte_hitdeath.png is one row of 4 poses of Hooded Acolyte, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Acid Spitter (`acid-spitter`, 03-wyldmaw/acid-spitter)

Now drawn 358 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Wide creature: **one pose per image**.

- [ ] acid-spitter_hd_reference.png, acid-spitter_hd_attack1_1.png, acid-spitter_hd_attack1_2.png, acid-spitter_hd_attack1_3.png, acid-spitter_hd_attack1_4.png, acid-spitter_hd_attack2_1.png, acid-spitter_hd_attack2_2.png, acid-spitter_hd_attack2_3.png, acid-spitter_hd_attack2_4.png, acid-spitter_hd_hitdeath_1.png, acid-spitter_hd_hitdeath_2.png, acid-spitter_hd_hitdeath_3.png, acid-spitter_hd_hitdeath_4.png

**acid-spitter_hd_reference.png**

```
Redraw the creature in the attached reference picture, Acid Spitter, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack1_1.png**

```
The attached sheet acid-spitter_attack1.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack1_2.png**

```
The attached sheet acid-spitter_attack1.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack1_3.png**

```
The attached sheet acid-spitter_attack1.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack1_4.png**

```
The attached sheet acid-spitter_attack1.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack2_1.png**

```
The attached sheet acid-spitter_attack2.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack2_2.png**

```
The attached sheet acid-spitter_attack2.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack2_3.png**

```
The attached sheet acid-spitter_attack2.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_attack2_4.png**

```
The attached sheet acid-spitter_attack2.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_hitdeath_1.png**

```
The attached sheet acid-spitter_hitdeath.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_hitdeath_2.png**

```
The attached sheet acid-spitter_hitdeath.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_hitdeath_3.png**

```
The attached sheet acid-spitter_hitdeath.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**acid-spitter_hd_hitdeath_4.png**

```
The attached sheet acid-spitter_hitdeath.png is one row of 4 poses of Acid Spitter, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Pearl Crab (`pearl-crab`, 09-tides/pearl-crab)

Now drawn 301 px tall, stands 390 on stage: ready stance **520 px** tall (at least 390). Wide creature: **one pose per image**.

- [ ] pearl-crab_hd_reference.png, pearl-crab_hd_attack1_1.png, pearl-crab_hd_attack1_2.png, pearl-crab_hd_attack1_3.png, pearl-crab_hd_attack1_4.png, pearl-crab_hd_attack2_1.png, pearl-crab_hd_attack2_2.png, pearl-crab_hd_attack2_3.png, pearl-crab_hd_attack2_4.png, pearl-crab_hd_hitdeath_1.png, pearl-crab_hd_hitdeath_2.png, pearl-crab_hd_hitdeath_3.png, pearl-crab_hd_hitdeath_4.png

**pearl-crab_hd_reference.png**

```
Redraw the creature in the attached reference picture, Pearl Crab, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 520 px tall (never under 390 px), centred, in a 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack1_1.png**

```
The attached sheet pearl-crab_attack1.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack1_2.png**

```
The attached sheet pearl-crab_attack1.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack1_3.png**

```
The attached sheet pearl-crab_attack1.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack1_4.png**

```
The attached sheet pearl-crab_attack1.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack2_1.png**

```
The attached sheet pearl-crab_attack2.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack2_2.png**

```
The attached sheet pearl-crab_attack2.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack2_3.png**

```
The attached sheet pearl-crab_attack2.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_attack2_4.png**

```
The attached sheet pearl-crab_attack2.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_hitdeath_1.png**

```
The attached sheet pearl-crab_hitdeath.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 1 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_hitdeath_2.png**

```
The attached sheet pearl-crab_hitdeath.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 2 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_hitdeath_3.png**

```
The attached sheet pearl-crab_hitdeath.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 3 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**pearl-crab_hd_hitdeath_4.png**

```
The attached sheet pearl-crab_hitdeath.png is one row of 4 poses of Pearl Crab, facing right. Redraw pose 4 only, alone, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Mossjaw Turtle (`mossjaw-turtle`, 03-wyldmaw/mossjaw-turtle)

Now drawn 366 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Two poses per image.

- [ ] mossjaw-turtle_hd_reference.png, mossjaw-turtle_hd_attack1_a.png, mossjaw-turtle_hd_attack1_b.png, mossjaw-turtle_hd_attack2_a.png, mossjaw-turtle_hd_attack2_b.png, mossjaw-turtle_hd_hitdeath_a.png, mossjaw-turtle_hd_hitdeath_b.png

**mossjaw-turtle_hd_reference.png**

```
Redraw the creature in the attached reference picture, Mossjaw Turtle, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mossjaw-turtle_hd_attack1_a.png**

```
The attached sheet mossjaw-turtle_attack1.png is one row of 4 poses of Mossjaw Turtle, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mossjaw-turtle_hd_attack1_b.png**

```
The attached sheet mossjaw-turtle_attack1.png is one row of 4 poses of Mossjaw Turtle, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mossjaw-turtle_hd_attack2_a.png**

```
The attached sheet mossjaw-turtle_attack2.png is one row of 4 poses of Mossjaw Turtle, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mossjaw-turtle_hd_attack2_b.png**

```
The attached sheet mossjaw-turtle_attack2.png is one row of 4 poses of Mossjaw Turtle, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mossjaw-turtle_hd_hitdeath_a.png**

```
The attached sheet mossjaw-turtle_hitdeath.png is one row of 4 poses of Mossjaw Turtle, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**mossjaw-turtle_hd_hitdeath_b.png**

```
The attached sheet mossjaw-turtle_hitdeath.png is one row of 4 poses of Mossjaw Turtle, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Cleric of the Ninth Bell (`bell-cleric`, 01-aurelion/bell-cleric)

Now drawn 377 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Two poses per image.

- [ ] bell-cleric_hd_reference.png, bell-cleric_hd_attack1_a.png, bell-cleric_hd_attack1_b.png, bell-cleric_hd_attack2_a.png, bell-cleric_hd_attack2_b.png, bell-cleric_hd_hitdeath_a.png, bell-cleric_hd_hitdeath_b.png

**bell-cleric_hd_reference.png**

```
Redraw the creature in the attached reference picture, Cleric of the Ninth Bell, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bell-cleric_hd_attack1_a.png**

```
The attached sheet bell-cleric_attack1.png is one row of 4 poses of Cleric of the Ninth Bell, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bell-cleric_hd_attack1_b.png**

```
The attached sheet bell-cleric_attack1.png is one row of 4 poses of Cleric of the Ninth Bell, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bell-cleric_hd_attack2_a.png**

```
The attached sheet bell-cleric_attack2.png is one row of 4 poses of Cleric of the Ninth Bell, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bell-cleric_hd_attack2_b.png**

```
The attached sheet bell-cleric_attack2.png is one row of 4 poses of Cleric of the Ninth Bell, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bell-cleric_hd_hitdeath_a.png**

```
The attached sheet bell-cleric_hitdeath.png is one row of 4 poses of Cleric of the Ninth Bell, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**bell-cleric_hd_hitdeath_b.png**

```
The attached sheet bell-cleric_hitdeath.png is one row of 4 poses of Cleric of the Ninth Bell, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Nightmare Loom (`nightmare-loom`, 10-vespera/nightmare-loom)

Now drawn 379 px tall, stands 470 on stage: ready stance **630 px** tall (at least 470). Two poses per image.

- [ ] nightmare-loom_hd_reference.png, nightmare-loom_hd_attack1_a.png, nightmare-loom_hd_attack1_b.png, nightmare-loom_hd_attack2_a.png, nightmare-loom_hd_attack2_b.png, nightmare-loom_hd_hitdeath_a.png, nightmare-loom_hd_hitdeath_b.png

**nightmare-loom_hd_reference.png**

```
Redraw the creature in the attached reference picture, Nightmare Loom, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 630 px tall (never under 470 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nightmare-loom_hd_attack1_a.png**

```
The attached sheet nightmare-loom_attack1.png is one row of 4 poses of Nightmare Loom, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nightmare-loom_hd_attack1_b.png**

```
The attached sheet nightmare-loom_attack1.png is one row of 4 poses of Nightmare Loom, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nightmare-loom_hd_attack2_a.png**

```
The attached sheet nightmare-loom_attack2.png is one row of 4 poses of Nightmare Loom, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nightmare-loom_hd_attack2_b.png**

```
The attached sheet nightmare-loom_attack2.png is one row of 4 poses of Nightmare Loom, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nightmare-loom_hd_hitdeath_a.png**

```
The attached sheet nightmare-loom_hitdeath.png is one row of 4 poses of Nightmare Loom, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**nightmare-loom_hd_hitdeath_b.png**

```
The attached sheet nightmare-loom_hitdeath.png is one row of 4 poses of Nightmare Loom, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 630 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```


### Keyhole Imp (`keyhole-imp`, 04-umbral/keyhole-imp)

Now drawn 323 px tall, stands 390 on stage: ready stance **520 px** tall (at least 390). Two poses per image.

- [ ] keyhole-imp_hd_reference.png, keyhole-imp_hd_attack1_a.png, keyhole-imp_hd_attack1_b.png, keyhole-imp_hd_attack2_a.png, keyhole-imp_hd_attack2_b.png, keyhole-imp_hd_hitdeath_a.png, keyhole-imp_hd_hitdeath_b.png

**keyhole-imp_hd_reference.png**

```
Redraw the creature in the attached reference picture, Keyhole Imp, larger and sharper, for a game model. The same design, pose, colours and proportions, facing right, in its ready stance, alone. Make it 520 px tall (never under 390 px), centred, in a 1024 x 1536 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**keyhole-imp_hd_attack1_a.png**

```
The attached sheet keyhole-imp_attack1.png is one row of 4 poses of Keyhole Imp, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**keyhole-imp_hd_attack1_b.png**

```
The attached sheet keyhole-imp_attack1.png is one row of 4 poses of Keyhole Imp, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**keyhole-imp_hd_attack2_a.png**

```
The attached sheet keyhole-imp_attack2.png is one row of 4 poses of Keyhole Imp, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**keyhole-imp_hd_attack2_b.png**

```
The attached sheet keyhole-imp_attack2.png is one row of 4 poses of Keyhole Imp, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**keyhole-imp_hd_hitdeath_a.png**

```
The attached sheet keyhole-imp_hitdeath.png is one row of 4 poses of Keyhole Imp, facing right. Redraw poses 1 and 2 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

**keyhole-imp_hd_hitdeath_b.png**

```
The attached sheet keyhole-imp_hitdeath.png is one row of 4 poses of Keyhole Imp, facing right. Redraw poses 3 and 4 only, side by side in the same order, as one row of 2 poses, each exactly the same pose, design, proportions, weapon and facing as in the sheet, but larger and sharper: draw the creature at the scale where its ready stance (pose 1 of the sheet) would be 520 px tall, the same scale as in its other images. 1536 x 1024 image. Style: inked, stylized fantasy with a slightly cartoon feel, as in the attached style anchor (confident dark outline, selective interior ink lines, shaded colour that gives volume); keep this creature's own design, colours and details exactly. Plain solid background in the same colour as the attached sheet, nothing else on it. No effects at all: no glows, beams, sparks, slash arcs, motion lines, dust or shadows. At least 40 px of background around every pose; nothing touching or cut off.
```

