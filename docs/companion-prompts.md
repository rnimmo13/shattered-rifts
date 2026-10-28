# Companion sheets (matches the Valeria anchor style)

Seven companions are still drawn by the procedural painter: five of the Engineer's machines and two of the Hunter's pack. Two sheets cover them. Attach the Valeria anchor to each prompt; each prompt asks ChatGPT for a PNG named `mechs-2.png` / `pack-2.png` with a download link, so download them straight into `assets-src/minions/`, and run `powershell -File tools/pack-arenas.ps1` (both sheets are already listed in it).

Rules that matter for the game (already in the prompts): companions stand on the hero's side, so every one **faces RIGHT**. Figures are cut in reading order (left to right, top row first), so the order names them; an empty cell is fine. Each sheet must match the first one in its family: `mechs.png` (white-and-orange hazard-striped machines with cyan eyes) and `beasts.png` (bone-plated red-furred wolves).

---

## Sheet 1: Nexus machines (5 figures) → `mechs-2`

```
Create ONE CHARACTER SHEET of five robot companions for a card-battler game (like Slay the Spire), 2048 x 1366, no text.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, slightly chunky proportions). Do NOT copy her character.

LAYOUT (critical): five separate full-body machines on a plain flat dark navy background (#14181f), in a 3 x 2 grid (three on the top row, two on the bottom row, the bottom-right cell left EMPTY), each fully inside its own cell with wide empty margin; nothing touching or overlapping; no grid lines, no labels, no text, no floor, no cast shadows. EVERY machine faces RIGHT in a three-quarter view.

ONE FAMILY: all five are built by the same young engineer from a foundry world. Off-white and steel-grey plates with orange-and-charcoal hazard stripes, rivets, chunky joints, and glowing CYAN lenses and lights. Friendly but tough.

THE FIVE, in this exact order, left to right, top row first:
1. SPOTTER DRONE: a small hovering scout drone, a slim body with one big telescopic cyan lens like a spyglass pointing right, a small cyan targeting beam from the lens, two little rotors on top. Small figure.
2. GENERATOR: a squat walking power cell on four short stubby legs, a big glass core in the middle full of crackling cyan energy, two coiled copper rods on top with a small arc between them, cables hanging from the sides. Small figure.
3. BULWARK WALKER: a heavy two-legged guard walker carrying a huge tower-shield plate on its front arm, hazard stripes on the shield, a small cyan eye slot peering over the top, planted firmly. Medium-large figure.
4. SCRAP GOLEM: a big lumbering humanoid made of mismatched scrap: a barrel chest, a girder arm and a rivet-hammer fist, odd plates bolted on, a single round cyan eye, orange stripes on the cleanest plates. Large figure.
5. DREADNOUGHT: a massive armoured walking fortress on four thick legs with a broad hull, two shoulder-mounted cannons and a row of missile tubes, orange warning lights, cyan visor slit. The largest of the five.

PALETTE: off-white, steel grey, orange, charcoal, cyan glow. Soft rim light from the upper left.

NEGATIVE: text, letters, numbers, labels, grid lines, UI, frame, border, watermark, logo, background scenery, floor, ground shadows, machines facing left, facing the viewer, people, smoke, sparks, projectiles, muzzle flashes, photorealism, gritty texture, painterly smudge.

FILE: when the image is done, save it as a PNG file named exactly mechs-2.png and give me a download link to that file.
```

---

## Sheet 2: Wyldmaw pack (2 figures) → `pack-2`

```
Create ONE CHARACTER SHEET of two wolf companions for a card-battler game (like Slay the Spire), 2048 x 1024, no text.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, slightly chunky proportions). Do NOT copy her character.

LAYOUT (critical): two separate full-body beasts on a plain flat dark navy background (#14181f), side by side, each fully inside its own half with wide empty margin; nothing touching or overlapping; no labels, no text, no floor, no cast shadows. BOTH face RIGHT in a three-quarter side view.

ONE FAMILY: the pack of a tribal huntress from a bioluminescent jungle of bones. Lean wolves with cream bone plates and bone spikes grown over dark red fur, glowing red eyes, ragged moss-green cloth strips and spiked leather collars.

THE TWO, in this exact order, left to right:
1. PUP: a small young wolf pup, big paws and ears, a few small bone nubs on its back instead of spikes, a little spiked collar, yapping eagerly with a tiny snarl. Clearly a cub. Small figure, drawn about half the height of the other.
2. PACK ALPHA: a proud, lean, battle-scarred lead wolf, taller than a hound but slimmer than a dire wolf, a crest of long bone spikes along the spine, a bone-plate mask over the brow, a torn green war-banner strip around its neck, head raised in a howl-snarl. Medium-large figure.

PALETTE: cream bone, dark red fur, moss green cloth, dark leather, red eye glow. Soft rim light from the upper left.

NEGATIVE: text, letters, numbers, labels, UI, frame, border, watermark, logo, background scenery, floor, ground shadows, beasts facing left, facing the viewer, people, smoke, dust clouds, photorealism, gritty texture, painterly smudge, gore.

FILE: when the image is done, save it as a PNG file named exactly pack-2.png and give me a download link to that file.
```
