# Lore art prompts: the story panels, the worlds and the key art

Art for the lore page (`docs/15_LORE.md §5`), the startup splash, Rift Tier transitions and Steam. Robert generates the images in
ChatGPT; the asset pipeline encodes and wires them. The first complete set was generated with the built-in imagegen tool;
final augmented prompts, source hashes and references are recorded in `docs/lore-art-manifest.json`. These briefs now reflect the partial Shattering caused by Valerion and his conquest motive (#597-598); the manifest preserves the prompts actually used for the existing art. No artwork was regenerated for the lore correction.

Three sets, 26 images in all:
1. **Story panels:** comic panels for the six chapters of the story (16 images).
2. **World vistas:** one wide view of each world (8 images).
3. **Key art:** the title image, used for the lore page splash, the startup splash and Steam (2 images).

## How to run it

- **Style anchor:** attach `assets-src/heroes/knight.png` (the current default Knight) to the first message
  of every chat, as with every other art set.
- **For the panels showing Riftwalkers,** attach the current default class image from `assets-src/heroes/<class>.png` so they look
  like themselves. Robert requested default character models: do not use cosmetic skins or the older `_source/` variants.
- **One chat per set.** Paste the set's starter once, then send one item per message: one image per message. If the style
  drifts (about every 15 images), start a new chat and paste the starter again.
- **Save as PNG** with the exact name given, into `assets-src/lore/` (create the folder).
- If an image comes out with text, speech bubbles, a border or a panel grid, reply "same again, without the text/bubbles/border".
  The words go on the page, never in the picture.
- Partial sets are fine; the page will be built once the panels for a chapter exist.

## Integrated set (0.188.0)

All 26 PNGs are saved in `assets-src/lore/` (raw art remains ignored). Run `pnpm lore:art` to produce the committed full-size and
640px WebP previews, home thumbnail, social preview and manifest. The generated images are concept artwork pending Robert's
art review; generation does not imply human approval. The key-art pair also supports future Steam crops; no Steam listing is
published by this work. `pnpm lore:smoke` checks the built page and startup at desktop and phone sizes.

---

## 1. Story panels (`assets-src/lore/`)

### Starter (paste once per chat, with the Knight image)

```
You are painting STORY PANELS for the lore page of a dark-fantasy card-battler game called Shattered Rifts. The story: many separate worlds were sealed apart by an invisible barrier called the Ward, each kept by a guardian called a Warden. Valerion, the unmatched tyrant of his original realm, sacrificed cities to break out and seek other worlds to conquer. From the space between worlds he unleashed a cataclysmic blast that shattered a vast section of the Ward; distant sections remain intact. Rifts tore open between the exposed worlds, and champions from each world (Riftwalkers) now fight the corrupted Wardens and each other for the shards of the broken Ward. At the centre is Valerion, the Heart of the Rift, who takes Wardens to claim their worlds' laws. His original realm is unnamed; do not depict an existing class homeland as his birthplace. His precise nature and appearance remain unrevealed.

I will send one panel per message; make ONE image per message.

STYLE ANCHOR: the attached image. Match its cartoon game-art rendering: bold clean outlines, flat saturated colour, simple cel shading, crisp polished shapes. Think of a premium graphic novel drawn in that style: cinematic framing, strong silhouettes, dramatic lighting. Do NOT copy the attached character unless the panel asks for the Knight.

FORMAT (every image): landscape 1536 x 1024, full bleed edge to edge. ONE single illustration per image: NOT a page of several panels, no panel grid, no gutters, no border, no frame.

COMPOSITION: one clear focal moment per panel, readable at a glance as a small thumbnail. One strong light source, deep shadows at the edges (soft vignette).

RECURRING MOTIFS (keep them consistent across every panel):
- THE WARD: when visible, a faint, glassy, slightly iridescent wall or dome, like a soap bubble made of stained glass.
- THE RIFTS: jagged cracks of violet and cyan light, with crystal-like shards breaking off at their edges.
- WARD SHARDS: palm-sized, glowing shards of that same glassy iridescent material.
- THE HEART: never fully shown. A vast dark shape glimpsed in the deepest rift, a single violet glow like an eye or a pulse, tendrils of rift light.

PALETTE: dark-fantasy rift. Deep indigo, slate and warm black, with violet and cyan rift light; each panel adds the accent named in its message.

NEGATIVE (every image): readable text, letters, numbers, speech bubbles, captions, sound effects, comic page layout, panel borders, UI, frame, watermark, logo, photorealism, gritty grainy textures, gore.

Reply "ready" and wait for the first panel.
```

### The panels (send one per message; save as the name in bold)

**Chapter 1: The Worlds Apart**
1. **ch1-worlds.png**: A cosmic view of many separate worlds floating in darkness, each inside its own faint glassy bubble, each a different colour and shape: a golden city of spires, a world of smoke-stacks and gears, a world of giant trees, a world of shadow and lantern light. Calm, wondrous, silent. Accent: each world's own colour on deep indigo.
2. **ch1-apart.png**: Close on one glassy bubble wall: on one side a golden cathedral city at dawn, on the other side, just beyond the glass, the dim shape of a forest with glowing eyes. Neither side sees the other. Accent: gold on one side, green on the other.

**Chapter 2: The Ward and its Wardens**
3. **ch2-ward.png**: A towering robed guardian figure (a Warden, face hidden in a hood of light) standing on a cliff at the edge of their world, one hand raised and resting on the glassy Ward that curves overhead like a sky. Solemn, protective. Accent: pale gold.
4. **ch2-wardens.png**: Several different Warden guardians, each in their own world, seen as small figures at the foot of the great glassy wall: a radiant angelic figure, a huge iron foundry machine, a vast beast-shape in the roots, a masked woman in shadow. Each keeps watch. Accent: a different light behind each.

**Chapter 3: The Shattering**
5. **ch3-crack.png**: The first crack: a single jagged violet-cyan line splitting across the glassy Ward sky above a golden city, people on the rooftops looking up. Ominous stillness. Accent: violet against gold.
6. **ch3-shatter.png**: A vast section of the Ward shattering under Valerion's cataclysmic blast: the glass sky breaking into a storm of falling iridescent shards, rifts tearing open across the exposed land, light pouring through. Distant sections of the barrier remain intact. Huge scale, chaotic, beautiful. Accent: violet, cyan, iridescent white.
7. **ch3-spill.png**: Through a fresh rift in a quiet machine-world street, wild things spill in: a vine-covered beast, a swirl of shadow birds, a floating golden relic. The machines turn to look. Accent: industrial orange, green, violet rift light.
8. **ch3-taken.png**: A Warden guardian on their knees as dark tendrils of rift light wrap around them from a crack behind, their light turning from gold to sickly violet. Tragic, not gory. Accent: gold fading into violet.

**Chapter 4: The Riftwalkers**
9. **ch4-step.png**: A lone silhouetted figure stepping into a towering rift of violet and cyan light, their cloak whipping in the wind from it, the broken landscape of their home behind them. Accent: violet rift light, home sunset behind.
10. **ch4-champions.png** (attach the Knight, Engineer and Hunter hero images): Three Riftwalkers standing on three separate floating rocks, each lit by the colour of their own world: a gold-armoured knight with a shield, a teal-armoured engineer with an orbiting drone, a tribal huntress with bone weapons. A rift crackles between them. Accent: gold, orange, green.
11. **ch4-many.png**: A wide shot of many tiny figures from different worlds walking along a path of floating stone through the Far Rifts, each carrying their own world's light (a lantern, a glowing blade, a spirit flame). Accent: many small warm lights in deep indigo.

**Chapter 5: Shards and Rivals**
12. **ch5-shard.png**: A gloved hand closing around a glowing Ward shard, light spilling between the fingers. Behind, out of focus, the defeated silhouette of a huge Warden. Accent: iridescent shard light.
13. **ch5-rivals.png** (attach the Trickster and Spellblade hero images): Two Riftwalkers from different worlds facing each other across a single glowing shard on a broken stone pedestal: a masked trickster with cards fanned in one hand, and a spellblade with a sword of starlight. Tense standoff. Accent: deep purple on one side, starlight blue on the other.
14. **ch5-echo.png**: A translucent, ghostly copy of a Riftwalker, made of shifting violet light and floating cards, rising from a rift crack to face a living Riftwalker. Eerie. Accent: pale violet ghost light.

**Chapter 6: The Heart of the Rift**
15. **ch6-sealed.png**: A Riftwalker pushing a glowing shard into a closing rift, the crack sealing with a flash; but in the distance behind them, three new cracks are already opening. Accent: bright seal flash, violet cracks.
16. **ch6-heart.png**: The deepest rift: an endless chasm of violet and cyan, and at its bottom a vast dark shape with a single slow-pulsing violet glow, tendrils of rift light reaching up toward many tiny shards falling in. Never show its full form. Dread. Accent: violet and black.

---

## 2. World vistas (`assets-src/lore/`)

Use the same starter as set 1, then add this one message before the first vista:

```
For this set, each image is a WIDE VISTA of one world, seen from a high vantage point at its most characteristic time of day. No figures in the foreground; small creatures or machines in the distance are fine. Keep the bottom 30% darker and calmer, because a name and a line of text sit over it. Faint violet-cyan rift cracks should be visible somewhere in each sky: these are the worlds exposed by the shattered section, not every world in existence.
```

1. **world-aurelion.png**: Aurelion: a city of white marble and gold spires on terraced cliffs, cathedral bells, banners, rays of holy light through clouds. Accent: gold and white.
2. **world-nexus.png**: Nexus-9: a sprawling foundry world of towers, pipes, smoke and furnace glow, lightning harnessed between metal totems. Accent: industrial orange and electric blue.
3. **world-wyldmaw.png**: Wyldmaw: a primeval forest of colossal trees with roots like teeth, mist, something huge moving in the canopy. Accent: deep green and amber.
4. **world-umbral.png**: Umbral Veil: a shadowed city of masks and lantern-lit theatres, crooked alleys, a velvet curtain sky. Accent: deep purple and lantern gold.
5. **world-hollow-crown.png**: The Hollow Crown: the ruins of a crystal kingdom built around a fallen, still-glowing star, broken towers and floating shards. Accent: starlight blue and silver.
6. **world-gloomfen.png**: Gloomfen: a drowned marsh at night, half-sunk graves and dead trees, ghostly lights over black water. Accent: sickly green and bone white.
7. **world-midden.png**: The Midden: an endless scrapheap where wreckage from many worlds has washed up: a broken golden spire, a rusted machine, a fallen tree, all heaped together under a dirty sky. Strangely homely, with a small campfire. Accent: rust and bottle green.
8. **world-far-rifts.png**: The Far Rifts: the space between worlds, floating islands of broken land from many worlds drifting in a void of violet and cyan cracks. Accent: violet, cyan, black.

---

## 3. Key art (`assets-src/lore/`)

Same starter as set 1, attach the Knight plus three or four other hero images, then send:

1. **key-art.png**: Landscape 1920 x 1080. The title image of the game. A great shattering Ward sky over a broken landscape where pieces of several worlds collide (a golden spire, a foundry tower, a giant tree, a shadow theatre). In the LEFT half, four Riftwalkers stand ready on a ridge, backs half-turned, facing the storm: the Knight, the Engineer, the Trickster and the Spellblade. In the RIGHT half, calmer sky and a huge central rift with the faint violet glow of the Heart deep inside. Keep the upper right third calm enough for a logo. Epic, hopeful and dangerous at once.
2. **key-art-clean.png**: The same scene, the same framing, WITHOUT the Riftwalkers (only the landscape and sky). Used behind the logo for the Steam library hero and the startup splash.

---

## Order to make them in
1. `key-art.png` and `key-art-clean.png` (they're also needed for Steam).
2. Chapter 3 (the Shattering), the heart of the story, then chapters 1, 2, 4, 5, 6.
3. The world vistas last.


## Four additional realm vistas (0.209)

These use the dedicated realm panorama as a responsive lore illustration; full prompts and packed paths are in art-prompts/0.209-arenas.json.

1. **world-cindervault.png**: Ash-buried living furnaces, basalt foundries, iron chains, smoke and orange kiln light.
2. **world-thalassar.png**: Underwater pearl citadels, shell palaces and turquoise luminous reefs.
3. **world-vespera.png**: Sleeping violet dream courts, moth-wing arches and floating memories.
4. **world-hourglass.png**: Twin suns, buried bronze/sandstone kingdoms and monumental hourglasses.
