# Riftwalker figure prompts

The style anchor for every hero is the Valeria image (`Sunlit Paladin with Shield and Sword.png`): attach it to each prompt. Hero art goes in `assets-src/heroes/<heroId>.png` and `tools/pack-heroes.ps1` cuts it into the game. Heroes face **right**, one full-body figure on a flat dark background.

## Rivet (`engineer`, the engineer with the drone)

The prompt used for the current art was not saved, so this one is rebuilt from the picture ("Teal Tech Hero and Orbital Drone"): a young engineer with curly dark hair and goggles on his forehead, a teal jacket over a white shirt, a belt of wrenches and glowing cyan vials, big orange-and-grey boots, a giant orange wrench over the shoulder, and a round white hovering drone with one cyan eye beside him. (The docs call Rivet "she"; the current art reads as a young man, so swap the wording if your friend wants her as a woman.)

```
Create ONE full-body character illustration of a hero for a card-battler game (like Slay the Spire), tall portrait (about 948 x 1659), NO text.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, expressive face, slightly chunky heroic proportions). Do NOT copy her character, outfit or pose.

LAYOUT (critical): ONE character standing in a confident three-quarter pose FACING RIGHT, full body from boots to hair with a little empty margin all round, on a plain flat dark navy background (#14181f). No floor, no cast shadow, no scenery, no frame, no text. Nothing touches the edges.

CHARACTER: RIVET, a cheerful young engineer from Nexus-9, a teal-and-orange foundry of machines. Curly dark hair, big grin, brass goggles with glowing cyan lenses pushed up on the forehead. A teal work jacket with orange panels over a white shirt, fingerless brown gloves with orange-and-steel bracers, a tool belt of wrenches and glowing cyan vials, dark baggy trousers with a big cargo pocket, chunky orange-and-grey steel-toed boots. A giant orange-and-steel wrench rests on one shoulder like a weapon. Beside the shoulder a small round white hovering drone with orange propeller blades and a single glowing cyan eye.

PALETTE: teal, orange, steel grey, warm brown, cyan glow. Soft rim light from the upper left.

NEGATIVE: text, letters, numbers, UI, frame, border, watermark, logo, background scenery, floor, ground shadow, photorealism, gritty texture, painterly smudge, extra characters, character facing left, character facing the viewer, cropped limbs.
```

### Asking for a different variation

Paste the prompt above and add one of these lines at the end of the CHARACTER paragraph (or replace the character description to keep what you like):

- **Different person:** "Make Rivet a young woman with a short braided ponytail, same outfit colours."
- **Different tool:** "Instead of the wrench, a rocket-powered hammer / a riveting gun / a robotic arm on one side."
- **Different mood:** "Serious and focused instead of grinning, a welding mask pushed up."
- **Different drone:** "A small six-legged spider drone / a floating toolbox drone / two tiny drones."
- **Different outfit:** "A long leather work apron over a teal vest, rolled sleeves, a mechanical arm."

Keep the layout, background and "facing right" lines unchanged: the cutter needs the flat dark background and a figure that does not touch the edge. Save the result as `assets-src/heroes/engineer.png` (keep the old one aside) and run `powershell -File tools/pack-heroes.ps1`; the cutter wipes the drone out of the corner of the picture (Rivet's drone is a companion that the game draws separately), so keep it in about the same place, beside the right shoulder, or tell me and I will move the wipe area.

## Solen (`monk`, the monk of stances) — redesign 2026-10-28 (in the game)

The old art ("Flamebound Warrior with Twin Scimitars") was the Barbarian: two flaming swords, and the same-looking woman as Kesh (the Hunter). The Monk fights bare-handed in stances (Serene, Fury, Radiant) and builds Fervor, and his realm is Aurelion (gold, ivory, royal blue). Robert chose a man (DECISIONS #395): Solen, a shaved head, pale skin and a calm face, the opposite of Kesh at a glance. This prompt made the current art; use it again for a redo.

```
Create ONE full-body character illustration of a hero for a card-battler game (like Slay the Spire), tall portrait (about 948 x 1659), NO text.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, expressive face, slightly chunky heroic proportions). Do NOT copy her character, outfit or pose.

LAYOUT (critical): ONE character in a low martial-arts fighting stance FACING RIGHT, full body from bare feet to head with a little empty margin all round, on a plain flat dark navy background (#14181f). No floor, no cast shadow, no scenery, no frame, no text, no soft glow haze spreading into the background. Nothing touches the edges.

CHARACTER: SOLEN, a man, a monk of a gilded sun-temple who fights with his bare hands. Tall, lean and wiry, in his late thirties, pale skin, a completely SHAVED head, sharp grey eyes, a small gold sun mark on his brow, faint gold sun-ray markings on his upper arms. His face is serene and composed, never a grin. Weight low on the back leg; the front hand is an open palm pushed forward toward the right, the rear fist chambered at the hip. Both hands and forearms are wrapped in ivory cloth bindings, and crisp-edged golden-white flames curl around the forward palm and the fist (inner fire, not a weapon). Outfit: a high-collared sleeveless ivory wrap tunic, loose ivory trousers bound at the ankles, a wide sash (teal or royal blue) with a gold sun-disc buckle, a saffron half-robe over one shoulder, a string of large wooden prayer beads across the chest. Bare feet with cloth ankle wraps. NO weapons of any kind.

PALETTE: ivory, saffron, gold, teal or royal blue, pale skin, golden-white flame. Soft rim light from the upper left.

NEGATIVE: hair on the head, beard, feathers, face paint, grin, sword, blade, scimitar, staff, any weapon, armour plates, text, letters, numbers, UI, frame, border, watermark, logo, background scenery, floor, ground shadow, glow haze, photorealism, gritty texture, painterly smudge, extra characters, character facing left, character facing the viewer, cropped limbs.

FILE: when the image is done, save it as a PNG file named exactly monk.png and give me a download link to that file.
```

Variations: "Serene: hands pressed together in a prayer, eyes closed, no flames" / "Radiant: a thin gold ring of light behind his head" / "Older: lines at the eyes, a white scar across the scalp". Save as `assets-src/heroes/monk.png` and run `powershell -File tools/pack-heroes.ps1`.

## Vesper (`trickster`, the card magician) — redesign 2026-10-28 (in the game)

The old art ("Glamorous Teal-Glow Witch Rogue") was the Trapper: a witch with a coiled rope and a dart. The Trickster is now a stage magician who fights with playing cards (Suits, the Full Trick) and still sets Traps; her realm is the Umbral Veil (a moonlit masquerade ballroom, violet and teal). Keep the silver-streaked dark hair and sly smile so she still reads as Vesper. Her mask is the one on the Masquerade and Mask of Faces cards (an ivory masquerade half-mask with gold filigree and a teal gem crest), so the figure and the cards match. Original design only: no famous card-throwing characters (no Gambit or Twisted Fate trench coat and staff, no jester-clown makeup).

```
Create ONE full-body character illustration of a hero for a card-battler game (like Slay the Spire), tall portrait (about 948 x 1659), NO text.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, expressive face, slightly chunky heroic proportions). Do NOT copy her character, outfit or pose.

LAYOUT (critical): ONE character standing in a confident showman's three-quarter pose FACING RIGHT, full body from boots to hat with a little empty margin all round, on a plain flat dark navy background (#14181f). No floor, no cast shadow, no scenery, no frame, no text, no soft glow haze spreading into the background. Nothing touches the edges.

CHARACTER: VESPER, a masquerade stage magician who fights with razor-edged playing cards. A sly, smiling woman with long wavy dark hair streaked with silver. She wears a MASQUERADE MASK: an elegant ivory-white Venetian half-mask covering her eyes, brow and upper cheeks (mouth and chin bare), with swept, pointed edges at the temples, ornate gold filigree trim around the eye holes and edges, black lacquer accents at the sides, and a small crest of gold points rising from the centre of the brow around a glowing teal diamond gem. Her eyes glint through the eye holes. A short violet top hat tilted back on her head behind the mask's crest, its band tucked with three playing cards. A fitted black-and-violet tailcoat with long split tails, the lining deep teal, over a gold-buttoned waistcoat embroidered with the four card suits (spade, heart, diamond, club) in gold thread. Long black gloves. Fitted dark trousers and tall heeled boots with small gold buckles. One hand (toward the right) holds a fan of five playing cards with teal-glowing edges, ready to throw; above the other open palm a single card spins in the air. The card faces show only big simple suit symbols, no numbers or letters. A slim card case and a coil of thin silver wire (her traps) on her belt.

PALETTE: black, deep violet, ivory, gold trim, teal glow, a touch of crimson on the heart and diamond symbols. Soft rim light from the upper left.

NEGATIVE: text, letters, numbers on the cards, UI, frame, border, watermark, logo, background scenery, floor, ground shadow, glow haze, witch hat, rope, staff, trench coat, clown makeup, jester bells, full-face mask, plain domino mask, bare uncovered eyes, photorealism, gritty texture, painterly smudge, extra characters, character facing left, character facing the viewer, cropped limbs, nudity.

FILE: when the image is done, save it as a PNG file named exactly trickster.png and give me a download link to that file.
```

Variations: "No top hat, the mask's crest taller, hair pinned up" / "A long cape with a violet lining instead of tails" / "Cards fanned in both hands". Save as `assets-src/heroes/trickster.png` (the cutter names the figure after the file, so it lands on `hero-trickster.png`; move the old `trapper.png` to `assets-src/heroes/_source/`) and run `powershell -File tools/pack-heroes.ps1`.

## Skins (alternate looks for the Store)

Make a skin like a hero figure (the same prompt shape: one figure facing right on the flat dark navy background, the Valeria style anchor) and save it as `assets-src/heroes/skins/<heroId>-<skin-name>.png`: the class id, then the skin's name in kebab case, for example `knight-moonlit-regent.png`. For the class drawn as the other gender, use `<heroId>-gender-female.png` or `<heroId>-gender-male.png`. Run `powershell -File tools/pack-heroes.ps1`: the Store shows every skin in the folder, named from the file ("Moonlit Regent", "Female Engineer"). The Engineer's drone corner is wiped as for his figure, so keep his drone at the top left.
