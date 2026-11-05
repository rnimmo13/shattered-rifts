# Art wrap-up: everything the game still draws a stand-in for (checked 2026-11-02)

**Done 2026-11-02:** all four were made and cut (`pack-arenas.ps1`, `pack-icons.ps1`, `pack-cards.ps1 -Only <sheet>`, `pack-scenes.ps1`); the elite events name their scenes. Every unit, card, status and event now has its own art.

The game was checked piece by piece against its art files:
- every unit that can stand on the board (enemies, summons, companions)
- every card
- every status, Boon and potion icon
- every map stop
- every event

Four things are left. Everything else has its own art. An upgraded companion ("+") uses its base companion's figure, so it needs none of its own.

| # | What | Images | Where it shows now |
|---|---|---|---|
| 1 | The three units that stand beside a Warden | 1 sheet | A drawn stand-in figure |
| 2 | The Wardens' four status icons | 1 sheet | Copies of Ghostly, Orbit and Fracture |
| 3 | Scenes for the five elite events (the Spin To Win machines) | 5 | No scene |
| 4 | Card art: 3 cards with none, 6 borrowing another card's picture | 3 sheets | A borrowed or drawn picture |

**Style anchor:** `assets-src/heroes/_source/Sunlit Paladin with Shield and Sword.png` (Valeria), attached to every prompt, as for everything before. When an item asks for more pictures, attach those too.

---

## 1. The Wardens' helpers → `assets-src/enemies/warden-helpers.png`

These units stand in front of or beside a Warden, and the player has to deal with them first:
- **Foundry Hatch:** Kron's. It must be broken before attacks reach him.
- **Hollow Acolytes:** the Hollow Benediction's. They make every enemy stronger each turn they stand.
- **Rift Ward:** Valerion's. It shields the Heart of the Rift.

Attach these three figures alongside Valeria, so the helpers match their masters:
- `apps/web/public/art/figures/kron.png`
- `apps/web/public/art/figures/the-hollow-benediction.png`
- `apps/web/public/art/figures/vorthax.png`

```
Create ONE CHARACTER SHEET of three enemy figures for a card-battler game (like Slay the Spire), 2048 x 1024, no text.
The first attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering exactly (bold clean dark outlines, flat saturated colours, simple cel shading, crisp polished shapes, slightly chunky proportions). Do NOT copy her character. The other attached images are the three bosses these figures serve: match each figure's materials, colours and trim to its boss.

LAYOUT (critical): three separate full-body figures on a plain flat dark navy background (#14181f), in a row of 3 across, each fully inside its own third with wide empty margin; nothing touching or overlapping; no grid lines, no labels, no text, no floor, no cast shadows. EVERY figure faces LEFT (three-quarter view toward the left), as if squaring up to a hero on their left.

THE THREE, in this exact order, left to right:
1. FOUNDRY HATCH (Kron's; it stands in front of him and must be broken first): a squat, wide armoured furnace door that walks. A heavy round riveted iron hatch, as big as the figure, set in a thick steel frame on two short stumpy piston legs. Molten orange light leaks from the seams round the hatch and through a small barred viewport in it; yellow-and-black hazard stripes on the frame; two teal indicator lamps on top; a big locking wheel in the middle of the hatch. Solid, stubborn and immovable, a living blast door, no face. Same orange, teal, steel and soot as the attached Kron.
2. HOLLOW ACOLYTE (the Hollow Benediction's; two stand beside it): a small hollow suit of priestly armour with nobody inside, in the same ivory-white plate, gold trim and royal-blue cloth as the attached Hollow Benediction. Where the face should be, an open helm with darkness inside; in the empty chest, a small dim golden sun glowing through the gaps. It swings a gold censer on a chain, trailing warm gold incense smoke, and wears a blue-and-gold sash with a sun emblem. About half the height of a soldier, devout and eerie, not monstrous.
3. RIFT WARD (Valerion's; it shields the Heart of the Rift): a floating obelisk of dark cracked stone, taller than it is wide, hovering just above the ground, split by bright glowing violet-and-cyan rift seams like the attached Valerion. Three jagged crystal shards orbit it, and a glowing abstract rift sigil (a ring and a split, NO letters or runes that read as writing) is carved in its face. A thin shimmering dome of violet light just around it. No face, no limbs: a ward, not a creature.

Draw the Foundry Hatch and the Rift Ward about the size of a big soldier, the Acolyte smaller.
PALETTE: each figure in its boss's colours; soft rim light from the upper left.

NEGATIVE: text, letters, numbers, labels, readable runes, grid lines, UI, frame, border, watermark, logo, floor, ground shadow, scenery, photorealism, gritty textures, figures facing right.
```

---

## 2. The Wardens' status icons → `assets-src/icons/icons-07.png`

Use the prompt already written as **Sheet 17** in [animation-prompts.md](animation-prompts.md#sheet-17-icons-07png-the-wardens-statuses). It covers Slippery, Veiled, Gravity and Unmaking, on a magenta background, with `icons-01.png` and `icons-03.png` as its anchors. The icon cutter now expects this sheet (`tools/pack-icons.ps1`), so the real icons replace the stand-ins as soon as it's cut.

---

## 3. Elite event scenes → `assets-src/events/<name>.png`

The five elite events are "Spin To Win" stops: a brass prize-reel machine that you can pay to spin again. They are the only events without a scene. Use the **event starter** from [scene-prompts.md §1](scene-prompts.md#1-event-scenes-assets-srcevents) in a new chat (paste it once with the Valeria image), then send one line per message. The machine is the subject in every one, so give each its own setting and mood, and keep the reel window large and readable as a shape (no readable writing on it).

1. **brass-cascade.png**: A tall brass prize machine standing against a ruined stone wall, a window of spinning prizes (cards, bottles, a glowing trinket) in its chest, a coin slot glowing beside it, a hand-painted sign hung on a nail (no readable words). Ivy and fallen stones around it. Accent: polished brass, warm amber.
2. **brass-pegboard.png**: A very old brass reel machine in a quiet market square at dusk, older than the crooked houses around it, gleaming with fresh oil, a long lever on its side, fifteen prizes behind its round glass turning past a pointer. Accent: brass, dusk violet, lamplight.
3. **copper-chute.png**: A copper-and-brass machine crowded with bottles, cards and trinkets turning in its window, beside it a tinker asleep on a stool with his hat over his eyes, a lever with a little hand-written note tied to it (no readable words). Accent: copper, bottle green, candlelight.
4. **silver-sluice.png**: A water-driven brass machine by a stream: a small waterwheel turns its reel, water trickling down a wooden chute, prizes on the reel glinting wet, mist and moss. Accent: silver water, brass, cool green.
5. **gilded-drop.png**: A grand gilded prize machine in a hall with no roof, open to a starry sky, prizes on red velvet turning past a pointer, a bowl of coins on a cushion before it and a polite attendant in livery standing to one side. Accent: gold, velvet red, starlight blue.

---

## 4. Card art → `assets-src/cards/`

The card prompts are generated, not written by hand: **[card-art/missing-batch-01.md](card-art/missing-batch-01.md)** has the three sheets, with the same rules as every card sheet before:

| Sheet | Cards |
|---|---|
| `engineer-m01` | Critical Mass, Final Volley, Full Throttle (no art yet) |
| `spellblade-m01` | Guarded Cut, Obsidian Ward |
| `drunkard-m01` | Take It on the Chin, Bar Fight, Drunken Swing, Pane Up |

The spellblade and drunkard cards are the six borrowing another card's picture.

---

## When they are in

Tell Claude which are in. Each has a cutter that already knows its file:

| Art | Cutter |
|---|---|
| The helpers | `tools/pack-arenas.ps1` (table entry `enemies/warden-helpers.png`) |
| The icons | `tools/pack-icons.ps1` (`icons-07`) |
| The cards | `tools/pack-cards.ps1`, then `pnpm cardprompts:missing` again |
| The elite scenes | `tools/pack-scenes.ps1`, plus one line so the elite events name their scene |
