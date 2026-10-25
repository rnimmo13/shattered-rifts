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
