# Shattered Rifts: animated character guidelines

The standing rules for every animated Riftwalker and every skin: what each character is, how big it is drawn, which
animations it has, how many poses each needs, and what a paid skin must add. Read this before designing a character or a
skin, writing a ChatGPT pose-sheet prompt, or processing sheets for the game.

Started 2026-11-13 (Robert). These are guidelines to "somewhat abide by", not law: break one when the result is clearly
better, and write the exception down in section 11.

Related files:
- `assets-src\heroes-pose-sheets\<hero>\<hero>_HD_PROMPT.txt`: the base heroes' ChatGPT prompts, the pattern for all others.
- `assets-src\heroes-pose-sheets\CHATGPT_SKINS_BATCH_2.md`: the six skins written to these guidelines.
- `docs\animation-guideline-2d-models.md`: the older single-file rig prompt. It predates pose sheets; this document is
  the standard for pose-sheet characters.

---

## 1. The short version

1. Every character is drawn as pose sheets: 1536 x 1024 images, three poses each, the ready stance about 700 px tall.
2. Every character has the same animation set: idle, fidget, attack (two for some), hit, death, power-up.
3. Every pose faces right, on a plain green or magenta background, with no effects drawn in.
4. The game adds all effects (glows, projectiles, particles, sound). Art never bakes them in.
5. A Riftwalker's identity (section 6) survives every skin: the Knight always has a sword.
6. A skin is a new character, not a recolour, with its own signature colour, effects, idle and sound. It need not be human.
7. Male and female looks stay near an even split across the whole game.

---

## 2. Art style

- Polished cartoon fantasy: bold clean dark outlines, saturated colours, crisp cel-shaded forms, controlled detail.
- Somewhat cartoony and stylized. Not realistic, not shiny or metallic, not painterly, not pixel art.
- A skin matches the base heroes' style. When making a skin's design image, attach the base hero's reference picture
  for style and size.
- **Characters do not have to be human** (Robert, 2026-11-13). A skin can be a creature, a construct, an undead thing,
  a spirit or an elemental, and the roster should have a mix. A non-human skin still needs what the animations rely on:
  an upright body with a clear ready stance, a way to hold or be its Riftwalker's weapon (section 6), a readable
  attack, and a way to fall down defeated.
- Every humanlike character is clearly an adult.
- Some female skins are meant to be sexy. Keep it to a stylish fitted costume and confidence: tasteful, fully clothed,
  natural proportions, no exaggerated anatomy, no pin-up pose. The same standard applies to male skins.

---

## 3. Sizes

| What | Size | Notes |
|---|---|---|
| Pose sheet image | 1536 x 1024 px, landscape | ChatGPT's largest landscape size |
| Poses per image | 3 | ready stance on the left, then two consecutive poses |
| Ready stance height | about 700 px | feet near the bottom edge, same in every image |
| Gap between poses | at least 30 px | nothing touching, nothing cut off |
| Design reference image (skins) | 1024 x 1536 px, portrait | one figure about 1250 px tall |
| Prop sheet | 1536 x 1024 px | four views in a row, each about 300 to 330 px wide |
| In-game frame | about 400 px tall | the packer scales the sheets to roughly 57% |

- Never draw source poses smaller than this unless the character is too wide to fit (section 11). The Demon Knight's
  first poses were about 480 px tall and he is visibly softer in battle than the others.
- Relative size on screen is set in the game (`displayScale`), not by drawing a character smaller on the sheet. Every
  character's ready stance is drawn about 700 px tall, the dwarf included.
- The Knight is the largest model (`displayScale` 1.15); the others are 1.0.
- A skin stands as tall on screen as its Riftwalker. A skin does not make a hero bigger or smaller.

---

## 4. The animation set

Every character has all of these. "Drawn poses" does not count the ready stance repeated at the left of each image.

| Animation | Game clip | Drawn poses | Images | What it is |
|---|---|---|---|---|
| Idle (breathing) | `idle` | 2 | 1 | breathing in, breathing out; feet, hands and weapon do not move |
| Fidget | `fidget` (new) | 4 | 2 | a small in-character movement played every few seconds while standing |
| Attack | `attack` | 10 | 5 | the character's signature strike |
| Second attack | `attack2` | 10 | 5 | only for characters with two weapons (Drunkard, Spellblade) |
| Hit and death | `hit`, `death` | 6 | 3 | one sequence; the first poses are the hit, all six are the death |
| Power-up | `aura` | 5 | 3 | played for auras, skills and traps; ends on a held pose |
| Props | varies | 4 per sheet | 1 each | anything that moves on its own (section 7) |

A one-attack character is 14 images, a two-attack character 19, plus prop sheets, plus one design image for a skin.

### Pose order

- **Attack (10):** settling in, anticipation, coiling, wind-up peak, release, mid-strike, contact, follow-through,
  recovery, settling back.
- **Hit and death (6):** impact, hit reaction, staggering, falling, hitting the ground, defeated.
- **Power-up (5):** start, building, rising, nearly there, peak (held).
- **Fidget (4):** leaving the ready stance, the gesture, a second beat of the gesture, returning.

### How they play

- The pipeline blends between drawn poses, so the game plays smooth motion: idle is a 2-second loop, and attacks, hits,
  deaths and power-ups play at up to 60 frames a second.
- Limited-frame, pose-to-pose playback reads as dated, which is why the pipeline blends.

### How many poses

The counts in the table are the upper limit, not a starting point. Do not add poses to a new character.

- A drawn pose is needed only where blending fails: at every change of direction (wind-up peak, contact, end of the
  follow-through) and wherever the silhouette changes a lot (a limb crossing the body, a weapon swinging through more
  than about 45 degrees, standing to lying down).
- Useful ranges: idle 2, fidget 3 to 4, attack 8 to 10, hit 2, death 5 to 6, power-up 4 to 5.
- Past about 10 poses in one animation the returns drop fast. Every extra image is another chance for the design or
  size to drift, and one off-model pose looks worse in motion than a slightly longer blend.
- Strong key poses and good effects matter more than the count: the Demon Knight has 8 drawn poses in all and is
  Robert's favourite so far.
- If an animation looks smeared in the game, add ONE pose at the spot where it smears. Do not redo the set.

---

## 5. Pose rules

These are the rules in every prompt. They exist because each one has gone wrong before.

- **Ready stance:** the left pose of every image, identical every time. The pipeline matches scale by it.
- **Facing:** every pose faces right.
- **One movement:** the poses of an animation are consecutive moments of one continuous movement, each a small even
  step from the last, the weapon on one smooth path.
- **Feet:** the same foot stays planted through a movement unless the pose says to step.
- **Hands:** weapons stay in the same hand in every image. Nothing ever changes hands.
- **Grip:** weapons are held correctly. The Knight's sword is never in a reversed grip.
- **Dropped items:** a dropped weapon touches the body or the hand and stays in its own third of the image.
- **Thrown or fired things:** not drawn. The hand is open or the weapon has just fired; the game adds the projectile.
- **Defeated:** lying on the back, head toward the left.
- **No effects:** no beams, flashes, slash arcs, glows, sparks, flames, frost, motion lines, dust or ground shadows.
  A glow that is part of the design (eyes, a gauge, tattoos) stays exactly as in the reference.
- **Background:** plain bright green `#00FF00`. Use magenta `#FF00FF` when the design has green or teal in it.
- **Nothing else:** no text, labels, numbers, borders or grid lines.

---

## 6. Who each Riftwalker is

The fixed identity of each character. A skin may change the person, the species, the outfit, the gender and the colours, but keeps the
"always" column and the attack type, so the class reads at a glance and the cards still make sense.

The Knight and Spellblade rows are Robert's words. The other rows are drawn from the roster, the lore and the current
art, and are proposals until Robert confirms them.

| Riftwalker | Realm | Always | Attack | Theme | Base look |
|---|---|---|---|---|---|
| **Knight** | Aurelion, a world of gilded light and oaths | A sword. A big brute: the largest model in the game. | A slash, never a stab | Strength, armour, oaths | Male, white and gold plate, blue cape, sun shield |
| **Spellblade** | The Hollow Crown, a kingdom built on a fallen star | A blade unlike a normal sword, and descent from the stars in some way | Two: a blade slash and an off-hand spell | Star-born, crystal, void, cosmic | Female, obsidian skin, white hair |
| **Rogue** | Umbral Veil, a world of shadow and masks | Small blades in the hands: daggers, knives, needles | A lunging stab | Speed, knives, bleeding, sleight of hand | Male, purple coat, teal daggers |
| **Drunkard** | The Midden, the scrapheap of the multiverse | A dwarf: short and stout. Two weapons, a blunt hammer and a short gun, and a drink somewhere on him | Two: an overhead slam and a gun blast | Scrappy, comic, booze-fuelled | Male, green coat, red beard |
| **Engineer** | Nexus-9, a world of machines | A machine companion and an oversized tool | Commanding the companion to fire | Gadgets, drones, built things | Male, teal jacket, wrench, scout drone |
| **Hunter** | Wyldmaw, a world that eats | A spear or polearm held in both hands. Primal: bone, fur, hide | A two-handed thrust | The wild, the pack, the hunt | Female, bone-skull pauldron, bone spear |
| **Monk** | Aurelion | Bare hands. Markings on the body that carry the power | A stepping straight punch | Discipline, stances, inner fire | Male, bald, prayer beads, flaming fists |
| **Necromancer** | Gloomfen, a drowned marsh where the dead do not stay down | A staff, a hood or veil, and something dead that serves | A staff thrust that sends the power forward | Death, thralls, doom | Male, hooded, bone staff, soul lantern |
| **Shaman** | Nexus-9 | A spirit bird and a totem staff | Sending the bird | Elements (flame, frost, storm), spirits, totems | Male, grey dreadlocks, hawk totem staff |
| **Trickster** | Umbral Veil | Playing cards in hand, stage-show flair (a hat, a mask), and something that says traps | A card throw | Theatre, traps, the four suits | Female, top hat, purple coat |

Checks against the live skins: Demon Knight carries a greatsword; Nova Ronin carries a katana and is named for a star;
Arc Welder has a wasp drone and a power gauntlet; Rogue Tailor fights with needles. All four fit.

---

## 7. Props and companions

Props that move are part of what makes a skin feel premium.

- **Attached props** (a still on the back, a shield on the arm) are drawn as part of the character in every pose.
- **Props that move on their own** (a companion, a perched bird, a puppet, floating objects) get their own sheets and
  are never drawn in the character's poses. The game places and animates them, so they can move while the character
  stands still.
- A companion sheet has four poses in a row at one size, drawn solid (not see-through), facing right.
- A companion usually needs two sheets: one for its idle loop, one for its actions (attack, celebrate, defeated).
- The skin's design image shows the companion beside the character at its true size, so every sheet matches.
- In the character's poses, leave the place the prop lives empty (an empty falconry glove, an open puppeteer's hand).
- Anything thin or glowing that links the two (puppet strings, a tether, a beam) is drawn by the game.

---

## 8. Idle: noticeable and modern

Idle is what players look at most, so it carries the most layers. A character standing still should never look still.

1. **Breathing:** the 2-second loop, always running.
2. **Trailing parts:** hair, capes, braids, sashes and tails sway. Design every character with at least one.
3. **Fidget:** every few seconds, a short in-character gesture (shadow boxing, tipping a hat, riffling cards).
4. **Prop life:** companions and props run their own loops, out of step with the body (a bird preens, a drone bobs).
5. **Ambient effects:** particles and glows from the game (embers, breath mist, sparks, vapour).

Base heroes need layers 1 and 2 and should gain 3. A paid skin needs all five.

---

## 9. Effects

All effects are added by the game on top of the sheets.

Every skin owns one signature colour that no other skin uses, carried through all its effects:

| Skin | Riftwalker | Gender | Signature colour | Status |
|---|---|---|---|---|
| Demon Knight | Knight | Male | Red on black | Live |
| Nova Ronin | Spellblade | Male | Violet | Live |
| Arc Welder | Engineer | Female | Electric blue with orange welding sparks (recoloured from purple) | Live |
| Rogue Tailor | Rogue | Female | Amber gold | Live |
| Moonshine Marshal | Drunkard | Female | Blue alcohol flame | Prompt written |
| Tempest Sage | Monk | Female | Glowing storm markings, a set for each stance: Serene pale blue, Fury red-gold, Radiant white-gold | Prompt written |
| Bone Puppeteer | Necromancer | Female | Bone white and rose pink | Prompt written |
| Ash Falconer | Shaman | Female | Fire orange | Prompt written |
| Glacier Lancer | Hunter | Male | Ice cyan | Prompt written |
| High Roller | Trickster | Female (a teal-skinned luck-fiend, not human) | Black and gold with teal neon | Prompt written |

With the ten base heroes (7 male, 3 female) that makes 10 male and 10 female looks.

### What a paid skin must have

- [ ] A clearly different character from the base look, not a recolour
- [ ] Its own signature colour
- [ ] An attack trail or projectile in that colour
- [ ] Its own hit effect: a different shape, not only a different colour
- [ ] Idle ambience, a fidget, and prop life where it has a prop
- [ ] A power-up effect that is a moment worth watching
- [ ] A death unlike the base hero's
- [ ] Its own attack sound and hit sound
- [ ] A Store preview that plays the attack, so buyers see the effects before paying
- [ ] Shown to the opponent in the Arena

---

## 10. Names, files and folders

- **Skin id:** `<hero id>-<skin name in kebab case>`, for example `monk-tempest-sage`. Hero ids: `knight`,
  `assassin` (the Rogue), `drunkard`, `engineer`, `hunter`, `monk`, `necromancer`, `shaman`, `spellblade`, `trickster`.
- **Skin names:** two words in the style of the live four, a striking word plus a role: Demon Knight, Arc Welder.
- **Source folder:** `assets-src\heroes-pose-sheets\<hero>` for a base hero, `assets-src\heroes-pose-sheets\<skin id>`
  for a skin.
- **Sheet files:** `<id>_hd_<animation>_<nn>.png`, with animation one of `idle`, `fidget`, `attack`, `attackB`,
  `hitdeath`, `aura`. Prop sheets: `<id>_hd_<prop>_<nn>.png`. Reference: `<id>_reference.png`.
- **Prompt file:** `<id>_HD_PROMPT.txt` in the same folder.
- **Game files:** `apps\web\public\art\heroes-sheets\<hero>` and `apps\web\public\art\heroes-sheets\skins\<skin id>`.
- A skin shows in the game only once it has an animated model (`ANIMATED_SKINS` in `apps\web\src\art\heroRigs.ts`).

---

## 11. Open items and exceptions

- **Fidget is new.** No character has one in the game yet. The pipeline and the game need a `fidget` clip, played at
  intervals between idle loops, before the new skins' fidget sheets are used.
- **Separate props are new for skins.** The Shaman's hawk already has its own sheet; the puppet, the phoenix and the
  High Roller's chips and dice need the same handling, plus placement on the character and their own loops.
- **Per-skin effects are thin today.** Each live skin's only effect in the fight code is an attack tint.
- **Arc Welder is recoloured to electric blue** so she no longer matches Nova Ronin's violet. The recoloured game
  sheets are in `assets-src\heroes-pose-sheets\engineer-arc-welder\recolour-electric-blue`, waiting to be swapped in.
  A re-colour is acceptable for the Engineer's skin (Robert, 2026-11-13).
- **Wide characters are an exception to the three-pose sheet.** The Demon Knight holds a greatsword level, so he is far
  wider than he is tall: his sheets hold two poses each, with the ready stance about 560 px tall, the most that fits.
  Any future character wider than about 500 px at a 700 px height does the same.
- **The four live skins** were made before this document. Their revision prompts are in
  `assets-src\heroes-pose-sheets\CHATGPT_LIVE_SKIN_REVISIONS.md`: a fidget for each.
- **The Demon Knight stays as he is.** Robert really likes how he came out. A full redraw prompt exists in his folder
  but is optional; what he gets is a fidget and stronger effects.
- **The effects each skin should get** are listed in `docs\SKIN_EFFECTS_BRIEF.md`.
- **Section 6** is confirmed only for the Knight and the Spellblade.
