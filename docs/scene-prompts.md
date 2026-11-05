# Scene art prompts: event scenes, new arenas, Warden arenas, the Crossing

Four sets of art for ChatGPT. Robert generates them; Claude cuts and wires them into the game.

1. **Event scenes:** a painted scene behind every event, the way Slay the Spire 2 gives each event its own place (97 images).
2. **New arenas:** finish the three half-made arenas, then add eight new fight sites so plain fights vary more (21 images).
3. **Warden arenas:** a unique boss arena for each of the 11 Wardens and Valerion (24 images).
4. **The Crossing:** a Rift-crossed arena for Echo (ghost) fights and PvP (2 images).

Floors for sets 2 to 4 come from three tile sheets (3 images). That's about 147 images in all; the order to make them in is at the end.

## How to run it

- **Style anchor:** attach `assets-src/heroes/_source/Sunlit Paladin with Shield and Sword.png` (Valeria) to the first message of every chat. Every older arena was made against it.
- **Use one ChatGPT chat per set**, because the size and layout rules differ between sets. Paste the set's **starter** once with the anchor, then send each item as its own message: one image per message. If the style starts to drift (usually after about 15 images), start a new chat and paste the starter again.
- **Save every file as PNG** with the exact name given, into these folders (create the ones that don't exist yet):

| Set | Folder | Name |
|---|---|---|
| Event scenes | `assets-src/events/` | `<event-id>.png` |
| Arena backdrops | `assets-src/arenas/backdrops/` | `<name>.png` |
| Arena props | `assets-src/arenas/props/` | `<name>.png` |
| Floor sheets | `assets-src/arenas/floors/` | `floors-2.png`, `floors-3.png`, `floors-4.png` |

- If an image comes out with text, a border or a character it shouldn't have, reply "same again, without the text/border/figure". Don't fix it by hand; regenerating is faster.
- Partial sets are fine. Any event or arena without art keeps the look it has now.

---

## 1. Event scenes (`assets-src/events/`)

### Starter (paste once per chat, with the Valeria image)

```
You are painting EVENT SCENES for a dark-fantasy card-battler game. Each event is a place the player stumbles on while travelling through the Rift (a broken multiverse). I will send one event per message; make ONE image per message.

STYLE ANCHOR: the attached image (Valeria). Match its cartoon game-art rendering: bold clean outlines, flat saturated colour, simple cel shading, crisp polished shapes. Do NOT copy her character. These are BACKGROUNDS, so render them a little softer and moodier than a character: atmospheric haze, strong directional light, a storybook stage-set feel.

FORMAT (every image): landscape 1536 x 1024, full bleed edge to edge, no border, no frame.
COMPOSITION (critical, every image):
- The FOCAL SUBJECT (the object, figure or creature named in the event) sits in the LEFT 60% of the image, at mid-distance, clearly readable as a silhouette.
- The RIGHT 40% is calmer: darker, less detail, mostly sky, wall, fog or shadow, because a text panel sits over it. Nothing important there.
- The bottom 15% is darker ground, because buttons sit over it.
- An eye-level view, as if the traveller just walked up to it. The traveller is NOT in the picture.
- One strong light source per scene; deep shadows around the edges (a soft vignette).
- Non-player figures named in the event (a ferryman, a gambler, a smith) ARE drawn, mid-distance, stylised, faces mostly in shade.

PALETTE: dark-fantasy rift. Deep indigo, slate and warm black for the shadows, with each scene's own accent colour from its message. Faint violet-and-cyan rift cracks may appear in the sky or ground as a recurring motif, but subtly.

NEGATIVE (every image): readable text, letters, numbers, signs with words, UI, frame, border, watermark, logo, the player character, heroes, photorealism, gritty grainy textures, gore.

Reply "ready" and wait for the first event.
```

### The events (send one line per message; save as the name in bold)

Common and early events:

1. **cache.png**: A seam split open in a rock wall, glowing violet-cyan, with coins, a vial and a card glinting inside. Accent: violet and gold.
2. **cache-open.png**: An iron strongbox half sunk in a mound of glassy rift crystal, lid broken open, a few treasures spilling out, footprints leading away. Accent: cyan crystal, warm gold.
3. **cache-trapped.png**: The same kind of strongbox, still sealed, a thin taut wire running from its lid to a coiled iron snare half hidden under it, glinting. Accent: cold cyan, a hint of red danger.
4. **altar.png**: A blood altar of black stone in a ruined chapel, a stone basin with dark red liquid, red candles, red light glowing up from the bowl. Accent: crimson.
5. **ancestors.png**: A circle of old standing stones humming with faint blue light, an old weapon and a cloak laid on the centre stone as a gift. Accent: pale blue, moss green.
6. **stranger.png**: A lonely road at dusk with a single card lying face down on it, glowing faintly; a trail of footprints from another world (strange shaped) leading off into fog. Accent: amber dusk, violet.
7. **sanctify.png**: A basin of pure white fire in a pale marble sanctum, light pouring upward, motes floating. Accent: white and gold.
8. **gambler.png**: A hooded figure at a small table under a hanging lantern, three bones mid-roll, a stack of glowing shards on the table. Accent: lantern amber, deep red cloth.
9. **traveller.png**: A wounded traveller slumped against a broken wall, pack open beside them, eyes closed, a cold campfire. Accent: grey dawn, a little warm light.
10. **idol.png**: A small idol of black glass on a mossy stump, violet light seeping from its eyes, the air around it bending. Accent: violet.
11. **well.png**: An old stone well in a still courtyard, the water perfectly dark and glassy, a bucket on a rope. Accent: deep teal, moonlight.
12. **shoal.png**: A glowing rift-pool full of fat pale fish crowding the surface, watching. Accent: pale cyan water, bone-white fish.
13. **forge.png**: An abandoned forge still burning, tongs resting on a glowing anvil, sparks drifting, nobody there. Accent: hot orange.
14. **wheel.png**: A huge wooden wheel painted in three colour bands (red, blue, gold), turning by itself on a stone axle in an empty plaza. Accent: red, blue, gold.
15. **gilded.png**: A golden idol on a pedestal in a silent stone room, a visible seam in the floor around the pedestal, dust in the light. Accent: gold, tomb grey.
16. **bonfire.png**: A fire with no fuel, burning on bare stone, small glowing spirit lights circling it like fireflies. Accent: warm orange, soft green spirit lights.
17. **alchemist.png**: A cluttered alchemist's bench of cracked glassware and steaming dishes, one bright green bubbling flask, a folded note. Accent: toxic green, brass.

Deals:

18. **ferry.png**: A ferryman waist-deep in black water holding a long pole, a far bank just across, fog on the water, a lantern on a post. Accent: lantern yellow on black water.
19. **hourglass.png**: An hourglass taller than a person, cracked, its sand falling UPWARD, standing alone in a ruined hall. Accent: gold sand, violet.
20. **silent-choir.png**: Rows of robed choir figures with their mouths open, faces in shadow, the air rippling with visible sound waves but no source. Accent: pale grey, faint violet ripples.
21. **beggar.png**: A beggar sitting on a crate of broken glass, hand out, sharp clever eyes glinting from under a hood. Accent: amber eyes, glass glints.
22. **scales.png**: Brass scales hanging from a gibbet, one pan heavy with coins, the other empty, against a stormy sky. Accent: brass, storm grey.
23. **reliquary.png**: A stone casket bound in heavy chains and red wax seals, faint light leaking through the cracks of the lid. Accent: red wax, cold light.
24. **hungry-door.png**: A wooden door set in a wall, with a toothy mouth where the handle should be, a tongue licking its lip. Accent: dark wood, pink mouth, a little menace.
25. **wagon.png**: A tinker's wagon hung with dozens of bottles and trinkets, a tired tinker sitting on the step, a lantern swinging. Accent: warm amber, bottle greens and blues.
26. **crossroads.png**: Three roads splitting under three tall lamps; the left lamp blazing, the right one dim, footprints along the middle road. Accent: lamplight gold, night blue.
27. **echo-vault.png**: A round stone chamber with rings of carved echoes on the walls, a single stand in the middle holding one face-down card under a beam of light. Accent: cool stone, a pale beam.
28. **mud-sworn.png**: A hulking figure of river clay blocking a muddy path, arms spread wide, water dripping off it. Accent: wet brown clay, river green.
29. **geyser.png**: A vent in a rocky floor spraying hot steam full of glittering shards high into the air. Accent: white steam, prismatic glints.
30. **gravedigger.png**: An old gravedigger leaning on a spade beside a half-dug hole in a crooked graveyard, crows on headstones. Accent: grey moonlight, dark earth.
31. **rust-eater.png**: A beast the colour of old iron gnawing on a broken iron gate, looking up hopefully, flakes of rust falling. Accent: rust orange.
32. **brewer.png**: A woman stirring a pot over a driftwood fire on a beach of grey salt, cups laid out on a plank. Accent: driftwood fire, sea grey.
33. **pact.png**: A lectern holding a page of black paper with an inkwell and quill, a hollow dark shape looming behind it like an open doorway. Accent: black, deep violet.
34. **purse.png**: A fat purse lying in the middle of a road, a thin red thread tied around it, footprints stepping around it on both sides. Accent: red thread, dusty road.
35. **patient-mirror.png**: A tall ornate mirror in an empty hall; the reflection inside shows a still silhouette that is not quite right. Accent: silver, cold blue.
36. **lantern-thief.png**: A small impish creature darting between stone pillars holding a stolen lantern, its light streaking. Accent: lantern gold in a dark colonnade.
37. **rift-fever.png**: A ruined chapel at night, a bedroll on the floor, broken stained glass casting feverish red and violet light. Accent: red and violet, sickly.
38. **wishing-stone.png**: A flat stone standing in a shallow dish of coins, candle stubs around it, a little wooden sign (no readable words). Accent: copper coins, candlelight.
39. **bell-tower.png**: A crooked bell tower with a bell as wide as a door, a frayed rope hanging down to the ground. Accent: bronze bell, overcast sky.
40. **pilgrims.png**: A line of hooded pilgrims carrying a litter of glowing glass bottles up a hill path, one gap in the line. Accent: soft lantern light, dusk hills.

Legends and rarer finds:

41. **legend-reliquary.png**: A museum-like hall: three cards behind glass on red velvet, each glowing a different colour, a keeper standing beside them. Accent: velvet red, gold, three card glows.
42. **echo-bargain.png**: A deep canyon whose walls carry faint double outlines of everything, sound rings rippling between the cliffs. Accent: dusty pink canyon, violet echoes.
43. **fading-saint.png**: A saint in old robes sitting by a road, half transparent, a faint halo, fading at the edges into light. Accent: white gold, soft.
44. **mirror-of-fates.png**: A cracked mirror whose shards each show a different glowing card fan. Accent: silver, many small colours.
45. **rift-pilgrim.png**: A pilgrim in strange foreign clothes walking out of a rift tear on the road, carrying a staff and a pack of odd objects. Accent: violet-cyan rift, earthy road.
46. **hungering-blade.png**: A sword sunk deep in a stone path, humming with dark red light, cracks spreading around it. Accent: dark red glow.
47. **smugglers-cache.png**: A loose stone pulled from a wall, a hollow behind it with a crate of mismatched contraband from three different worlds. Accent: lamplight, odd colours.

Rift oddities:

48. **open-rift.png**: A tear in the air wide as a door, and through it three floating card silhouettes on the far side, glowing. Accent: violet and cyan.
49. **walkers-cairn.png**: A tall cairn of piled stones from many worlds (different colours and textures), cards tucked under stones, static crackle in the air. Accent: mixed stone, crackling white.
50. **rift-broker.png**: A figure in a long coat with a card sticking out of every pocket, grinning, leaning on a rift-glass post. Accent: teal, gold.
51. **card-swap.png**: A woman sitting cross-legged on a rug made of playing cards, each from a different deck, cards floating around her. Accent: bright mixed colours on a dark rug.
52. **tithe-stone.png**: A flat black stone worn into a bowl on a hilltop, an offering inside, morning mist. Accent: black stone, pale dawn.
53. **torn-grimoire.png**: Scattered pages of an enormous torn book on the ground, the writing (unreadable, swirly) glowing faintly, one page floating. Accent: parchment, blue glow.
54. **buried-map.png**: A map half buried in mud with a red X mark, and a shifty dealer two steps away eyeing it. Accent: mud brown, red X.
55. **treasure-dig.png**: A deep hole in matching ground with a spade still stuck in the bottom, a glint of treasure just showing. Accent: earth, gold glint.
56. **hollow-feast.png**: A long table set for twelve in a ruined hall, every dish steaming, every chair empty, cobwebs. Accent: candle gold, sickly green steam.
57. **tax-collector.png**: A desk in the middle of an empty road with a huge ledger and a very tired clerk behind it. Accent: lamp yellow, dusty road.
58. **sundered-bridge.png**: A broken stone bridge over a deep chasm, the middle span gone, a fraying rope hanging down, wind tearing at it. Accent: storm blue, dark chasm.
59. **parasite.png**: The inside of an open travel pack, a small pink furry creature nestled in it, purring, chewing on a strap. Accent: pink, leather brown. (Cute but unsettling.)
60. **cursed-forge.png**: A hammer swinging by itself over a glowing anvil, coals an unnatural green-violet, no smith. Accent: sickly green-violet fire.
61. **deep-spring.png**: A stair spiralling down into a well that goes far too deep, thick warm water glowing far below. Accent: warm amber glow, dark stone.
62. **pale-dealer.png**: A dealer in white gloves and a pale mask shuffling a deck of cards with blank backs at a small table. Accent: white, black, a red card.
63. **dying-lamp.png**: A lantern hanging on a hook in the dark, its flame guttering low, smoke curling up. Accent: dim orange in deep black.
64. **tollkeeper.png**: A huge black iron gate on a mountain pass with a tiny door in it, a tollkeeper with a huge purse beside it, snow. Accent: black iron, snow white, gold purse.
65. **class-shrine.png**: A small plain wayside shrine with a weapon rack and an empty pedestal, prayer cloths fluttering, humble and a little neglected. Accent: soft warm light.
66. **potion-trade.png**: A cellar with shelves to the ceiling, all empty, a man in the corner polishing a glowing trinket. Accent: dusty brown, one glowing gem.

Trades:

67. **smelter.png**: A furnace built into a cliff face, molten metal pouring, a smith with huge arms working the bellows. Accent: molten orange, dark cliff.
68. **binders-table.png**: An old woman at a table stitching loose pages into books, candles, piles of paper. Accent: candlelight, parchment.
69. **the-fence.png**: The inside of a tent that is clearly bigger inside than out, racks of fine goods, a dealer sitting in the middle. Accent: rich purple and gold.
70. **step-up.png**: A training yard at dawn, a master figure waiting with crossed arms beside a weapon rack. Accent: dawn gold, clean stone.

Tuned events:

71. **smith.png**: A wandering smith with a cart of tools and no forge, sharpening a blade on a whetstone wheel. Accent: steel, warm sunlight.
72. **scrapyard.png**: Heaps of broken armour, wheels and machines, a crooked sign post (no readable words). Accent: rust, grey sky.
73. **shifter.png**: A wall made of moving cards, all rippling and shifting, a few lifting off. Accent: shimmering mixed colours.
74. **mirror.png**: A perfectly still pool reflecting not the sky but a fan of glowing cards. Accent: silver water, card glow.
75. **healer.png**: A healer's tent with herbs drying, bandages, a gentle figure with a very long scroll of prices. Accent: soft green, warm white.
76. **collector.png**: A stooped figure sorting cards into many glass jars on shelves, holding one jar to their ear. Accent: glass green, bone white.
77. **moth-shrine.png**: A small stone shrine covered so thickly in pale moths it seems to breathe, moonlight. Accent: pale cream moths, blue night.
78. **frost-garden.png**: A garden of ice flowers, each a different colour, a large shape sleeping under the snow mound. Accent: icy rainbow, white snow.
79. **old-soldiers.png**: Three grizzled old soldiers around a campfire, mismatched armour, swapping stories and gear. Accent: fire orange, night blue.
80. **ash-market.png**: Market stalls of grey cloth, grey ash falling like snow, traders with grey faces. Accent: all grey with one ember red stall lantern.
81. **unmaker.png**: A figure made of nothing: a human-shaped hole of void, with objects nearby coming apart into floating pieces. Accent: black void, white fragments.
82. **twin-pools.png**: Two pools side by side, one glowing red and one glowing blue, a narrow path between them. Accent: red and blue.
83. **mending-tree.png**: A white tree growing out of a crack in a stone floor, bearing faintly glowing fruit. Accent: white bark, soft gold fruit.
84. **engraver.png**: A blind old woman tapping a chisel against a whetstone in a stone workshop, engraved runes on the walls. Accent: stone grey, a blue spark.
85. **patient-monk.png**: A monk sitting cross-legged under a dead tree, a card held loosely in each hand, leaves long gone. Accent: dry ochre, calm sky.
86. **cold-kiln.png**: A kiln burning with white cold fire, frost on the bricks around its mouth. Accent: icy white-blue.
87. **dead-adventurer.png**: A body in good armour lying face down on the path, pack still full, a sword dropped nearby, something large's claw marks on a tree. Accent: grey-green, ominous. (No gore.)
88. **bandit-camp.png**: A bandit camp at night, tents, a fire, a treasure chest in the open, nobody watching it closely. Accent: fire orange, dark tents.
89. **guarded-hoard.png**: A glowing trinket on a pedestal, a huge coiled tail and a closed scaly eyelid wrapped around the pedestal, one eye just opening. Accent: gold, dark scales.
90. **champion.png**: A champion in heavy armour standing in the middle of the road holding a great weapon, banners behind. Accent: steel, crimson banner.
91. **nest.png**: A nest the size of a cart full of large warm speckled eggs, on a cliff ledge, a huge shadow of wings just above. Accent: warm straw, shadow.
92. **rift-storm.png**: The sky split open with violet-cyan rift lightning pouring down over a bare plain, no shelter. Accent: violet, cyan, black storm.
93. **pickpockets.png**: A narrow crowded alley, small cloaked figures scattering into the shadows, a coin falling through the air. Accent: dusk orange, deep shadow.
94. **cave-in.png**: A mine tunnel collapsing, timber supports snapping, rocks falling, dust everywhere. Accent: dusty brown, one lantern.
95. **cursed-coin.png**: A single old coin floating in the air in a dark room, whispering wisps curling off it. Accent: tarnished gold, green whispers.

Map stops (StS2 gives these their own scene too):

96. **merchant.png**: A merchant's stall set up in the Rift, a canopy hung with charms, potions and cards on display, a lantern, a cloaked shopkeeper. Accent: warm gold, deep purple.
97. **shrine.png**: A quiet rest shrine: a campfire beside a small stone altar under a sheltering rock arch, bedrolls, stars. Accent: warm fire, calm night blue.

---

## 2. Arenas: finish the three, add eight (`assets-src/arenas/`)

Arenas are made of layers (see `docs/arena-prompts.md`): a **backdrop** panorama, a **prop sheet** of nine cut-outs, and a **floor tile**. Use two chats: one for every backdrop (sets 2, 3 and 4), one for every prop sheet.

### Backdrop starter (paste once, with the Valeria image)

```
You are painting ARENA BACKDROPS for a side-view card-battler game. I will send one arena per message; make ONE image per message.

STYLE ANCHOR: the attached image (Valeria). Match its cartoon game-art rendering (bold clean outlines, flat saturated colour, simple cel shading, crisp polished shapes). Do NOT copy her character. Backgrounds are SOFTER and less contrasty than characters so the characters pop in front.

FORMAT (every image): an ultra-wide PANORAMIC BACKGROUND, 3:1 aspect ratio, 3072 x 1024, with NO characters.
COMPOSITION (critical, every image): a distant horizon scene. All the scenery fills the TOP 70% of the image with the horizon line at about 70% height. The BOTTOM 30% fades smoothly into plain flat dark ground colour #2a2030 with NO detail, because a game floor is drawn over it. Nothing in the centre foreground. Atmospheric depth with soft haze; the left and right ends slightly darker (vignette). Small glowing lights are fine. The player stands on the LEFT and the enemies on the RIGHT.

NEGATIVE (every image): characters, creatures, people, text, letters, numbers, UI, frame, border, watermark, logo, foreground objects, photorealism, gritty textures.

Reply "ready" and wait for the first arena.
```

### Prop starter (paste once, with the Valeria image)

```
You are painting PROP SHEETS for a side-view card-battler arena. I will send one arena per message with its nine objects; make ONE image per message.

STYLE ANCHOR: the attached image (Valeria). Match its cartoon game-art rendering (bold clean outlines, flat saturated colour, simple cel shading, crisp polished shapes). Do NOT copy her character. Scenery is SOFTER and less contrasty than characters.

FORMAT (every image): ONE PROP SHEET, 2048 x 2048, with NO characters.
LAYOUT (critical, every image): nine separate objects on a plain flat dark navy background (#14181f) across the WHOLE sheet, in a 3 x 3 grid. Each object fully inside its own cell with wide empty margin, nothing touching or overlapping, no grid lines, no labels, no text, no floor, no cast shadows. Front-on view, light from the upper left. The order is left to right, top row first:
- Row 1 (1-3): TALL BACKGROUND SILHOUETTES: big, a little hazy and slightly darker, they stand far back.
- Row 2 (4-6) and item 7: GROUND PROPS: smaller, they sit on the floor along the back edge; glowing parts clearly bright.
- Items 8 and 9: HANGING ITEMS, drawn as they hang down from the top of the screen, the top end cut off straight at the top of the cell.

NEGATIVE (every image): characters, creatures, people, text, letters, numbers, labels, grid lines, UI, frame, border, watermark, logo, floor, ground shadows, scenery behind the objects, photorealism, gritty textures.

Reply "ready" and wait for the first sheet.
```

### Finish the three existing arenas

These venues already have a floor, but no backdrop or props yet (`rift` has a backdrop already).

- **Backdrop `hollowcrown.png`**: The Hollow Crown, the Glass Desert. Dunes of dark sand and fields of jagged black and amber glass under a huge pale moon; a ruined crowned palace half sunk in the dunes on the horizon; heat shimmer, glinting shards. Palette: amber, black glass, bone, pale moonlight.
- **Props `hollowcrown.png`**: 1 a tall jagged black glass spire. 2 a tall broken palace column with a cracked crown carving. 3 a tall statue of a robed queen, head missing. 4 a cluster of glowing amber glass crystals. 5 a half-buried throne arm in sand. 6 a broken sand-worn sphinx paw. 7 a brazier with an amber glass flame. 8 hanging: torn silk banner with a crown motif. 9 hanging: a string of glass beads and a small brass bell.
- **Backdrop `midden.png`**: The Midden, the back-alley dump. A night city of leaning brick tenements, laundry lines, fire escapes, a glowing tavern sign shape (no words), steam from grates, a moon behind chimneys, heaps of junk. Palette: rust orange, bottle green, amber, deep blue-black.
- **Props `midden.png`**: 1 a tall leaning brick chimney stack. 2 a tall rickety fire-escape ladder tower. 3 a tall stack of barrels and crates. 4 a barrel fire with bright flames. 5 a pile of glass bottles and a broken crate. 6 an overflowing junk heap with a cart wheel. 7 a dented street lamp with a warm glow. 8 hanging: a laundry line with patched clothes. 9 hanging: a crooked tavern sign on a chain (no words, a tankard picture).
- **Props `rift.png`**: 1 a tall floating broken stone pillar. 2 a tall glowing crystal spire. 3 a tall floating island fragment with a ruined arch. 4 a cluster of glowing violet-and-cyan crystals. 5 a broken pillar base with energy leaking out. 6 a small floating rock with a crystal. 7 a glowing rift crack in a stone slab. 8 hanging: a cluster of floating crystal shards. 9 hanging: a wisp of violet energy.

### Eight new fight sites

A second site for each realm, plus the Far Rifts, which has enemies but no arena yet. Each one needs a backdrop and a prop sheet with the same name. Their floors are on `floors-2` (§5).

| Name | Realm | Backdrop scene | Palette | The nine props |
|---|---|---|---|---|
| `aurelion-ramparts` | Aurelion | Castle battlements high above a sea of sunset clouds, distant spires on floating rocks, flags snapping, a drawbridge chain | ivory, gold, sky blue, rose | 1 tall watchtower 2 tall gold-tipped flagpole with pennant 3 tall angel statue 4 a ballista 5 a stack of shields and spears 6 a crenellated wall section 7 a signal fire brazier 8 hanging: a long pennant 9 hanging: a gold chain with a bell |
| `nexus-dock` | Nexus-9 | A night cargo skydock: huge cranes, a moored airship, stacked containers, teal floodlights, a smoggy orange city glow | steel, teal, hazard orange, night blue | 1 tall loading crane 2 tall stack of containers 3 tall radio mast 4 a cargo crate with glowing teal lock 5 a coiled cable drum 6 a hazard barrier 7 a floodlight on a stand 8 hanging: a crane hook on a chain 9 hanging: a bundle of cables with a warning light |
| `wyldmaw-canopy` | Wyldmaw | High in a giant jungle canopy: rope bridges between enormous trunks, glowing fungi, a waterfall far off, shafts of green light | moss green, crimson flowers, bone white, gold light | 1 tall giant tree trunk with a platform 2 tall totem of carved skulls 3 tall hanging vine curtain 4 a cluster of glowing mushrooms 5 a bone-and-hide drum 6 a broken rope-bridge post 7 a nest of red flowers 8 hanging: thick vines with leaves 9 hanging: a bone wind chime |
| `umbral-garden` | Umbral Veil | A moonlit hedge maze garden behind a dark manor, topiary shapes, a black fountain, mist, a huge full moon | violet, near-black, spectral teal, silver | 1 tall topiary hedge arch 2 tall weeping-angel statue 3 tall wrought-iron gate 4 a black fountain with teal water 5 a stone bench with a dropped mask 6 a stone urn with dark roses 7 a teal will-o'-wisp lantern 8 hanging: a willow branch 9 hanging: a broken masquerade garland |
| `gloomfen-stilts` | Gloomfen | A stilt village over black swamp water: crooked huts on poles, rope walkways, green lantern lights, dead trees, heavy fog | swamp green, ash grey, bone, black water | 1 tall crooked stilt hut 2 tall dead tree with hanging moss 3 tall bone-and-reed totem 4 a bubbling witch cauldron with green glow 5 a pile of nets and crab traps 6 a half-sunk rowing boat 7 a green lantern on a pole 8 hanging: Spanish moss strands 9 hanging: a string of bones and bottles |
| `hollowcrown-bazaar` | The Hollow Crown | A ruined desert caravan bazaar at dusk: tattered awnings, sandstone arches, glass lanterns, a caravan of statues half buried | amber, terracotta, black glass, dusk violet | 1 tall sandstone arch 2 tall tattered awning on poles 3 tall obelisk of black glass 4 a merchant chest of glowing amber 5 a stack of rugs and pottery 6 a broken caravan wheel 7 a glass lantern with an amber flame 8 hanging: a tattered striped awning cloth 9 hanging: a cluster of brass lanterns |
| `midden-cellar` | The Midden | A huge tavern cellar under the city: barrel vaults, brick arches, kegs stacked to the ceiling, candle glow, a spilled-ale stream | warm amber, brick red, bottle green, deep brown | 1 tall brick arch pillar 2 tall stack of kegs 3 tall wine rack 4 a keg on a stand with a tap 5 a table with tankards and a candle 6 a pile of broken stools 7 a lantern on a barrel 8 hanging: a string of hams and garlic 9 hanging: an iron candle chandelier |
| `far-rifts` | The Far Rifts | A dead star's observatory floating in space: a broken telescope dome, star charts in light, a dying red sun, drifting rubble, nebula clouds | deep blue, star white, dying-sun red, cyan | 1 tall broken telescope 2 tall floating armillary sphere 3 tall pillar of stacked star-stone 4 a small orbiting planet model with a glow 5 a floating chunk of rubble with a crystal 6 a broken brass astrolabe 7 a glowing star-chart pedestal 8 hanging: a chain of small orbiting stars 9 hanging: a hanging comet lantern |

Send each as: "Backdrop `<name>`: <realm>. SCENE: <backdrop scene>. PALETTE: <palette>." and "Props `<name>`: <realm>. THE NINE: <the nine props>. PALETTE: <palette>."

---

## 3. Warden arenas (`assets-src/arenas/`, names start `boss-`)

A boss arena is where the Warden stands, so it should feel bigger than a realm's other fights. Each one is built around its Warden's own rule. Use the same two starters as §2, but **add this line to each Warden message:**

```
This is a BOSS ARENA: make it epic and grand. Put one huge centrepiece in the RIGHT-CENTRE of the scene (behind where the boss stands, still above the 70% horizon), lit dramatically, with scale cues (tiny windows, distant stairs) to show its size. More dramatic light and stronger contrast in the sky than a normal arena, but the bottom 30% stays flat #2a2030.
```

| Name | Warden (realm) | Backdrop: centrepiece and scene | Palette | The nine props |
|---|---|---|---|---|
| `boss-seraphine` | Seraphine, the Gilded Warden (Aurelion) | A cathedral throne nave at blazing noon: a colossal golden throne beneath a giant rose window, two huge kneeling knight statues flanking it, god rays, gold dust | gold, ivory, royal blue, white light | 1 tall gold-and-marble column with a halo ring 2 tall kneeling angel statue 3 tall sunburst stained-glass panel 4 a gold sunburst brazier 5 a pile of offered swords 6 a gilded prayer rail 7 a tall golden candle stand 8 hanging: a huge gold-and-blue banner with a sun 9 hanging: a halo chandelier of gold rings |
| `boss-benediction` | The Hollow Benediction (Aurelion) | A hollowed cathedral at night: rows of empty pews, wax dripping from everything, a huge cracked bell hanging over a hollow-eyed altar mask, two empty acolyte alcoves glowing | wax ivory, tarnished gold, candle amber, deep blue | 1 tall column drowned in wax 2 tall empty acolyte alcove with a glow 3 tall cracked bell tower frame 4 a cluster of melted candles 5 a hollow-eyed mask on a pedestal 6 a row of empty pews 7 a censer smoking incense 8 hanging: a cracked bell on a chain 9 hanging: strands of dripping wax and prayer beads |
| `boss-kron` | KR-0N "Kron", Foundry Overseer (Nexus-9) | The foundry's heart: a gigantic round furnace HATCH in the back wall, half open, molten light pouring out, crucibles pouring, giant gears, smokestacks, teal control lamps | molten orange, teal, steel, soot black | 1 tall smokestack with orange glow 2 tall giant gear on an axle 3 tall riveted hatch door frame 4 a crucible pouring molten metal 5 an anvil with a giant hammer 6 a control console with teal lamps 7 a pile of glowing slag 8 hanging: a giant chain hook 9 hanging: a hanging steam pipe with a vent |
| `boss-static` | Mother of Static (Nexus-9) | A broadcast cathedral: a colossal tower of antennae and dishes crackling with white-cyan static, cables like roots across the hall, banks of screens showing only static, half the lights dead | electric cyan, white, gunmetal, black | 1 tall antenna mast with sparks 2 tall bank of static screens 3 tall radio dish 4 a cable root knot with sparks 5 a broken server cabinet 6 a fizzing transformer 7 a tesla coil with arcs 8 hanging: a tangle of cables with plugs 9 hanging: a flickering broken lamp |
| `boss-gorrmaw` | Gorrmaw, the Hunger Below (Wyldmaw) | A gullet canyon: a huge bone-strewn nest pit in a ribcage of colossal bones, eggshells, an ember-red sky, a cave mouth like a throat | ember red, bone white, dark feather black, moss | 1 tall giant rib bone 2 tall jagged rock spire with claw marks 3 tall dead tree with feathers caught in it 4 a broken eggshell nest 5 a pile of gnawed bones 6 a cracked boulder with teeth marks 7 an ember fire pit 8 hanging: ragged black feathers on vines 9 hanging: a hanging rib with dangling bones |
| `boss-stag` | The Upside-Down Stag (Wyldmaw) | An inverted forest: trees hang from the sky with roots upward, a mirror lake on the horizon reflecting them right way up, a huge pair of antlers formed by upside-down branches as the centrepiece | moss green, deep teal, crimson, silver mirror | 1 tall upside-down tree hanging from above 2 tall antler-branch arch 3 tall mirror-water pillar 4 a cluster of upside-down glowing flowers 5 a mossy stone with an antler 6 a floating clod of earth with roots up 7 a ring of glowing mushrooms 8 hanging: upside-down tree roots 9 hanging: a curtain of falling-upward leaves |
| `boss-nyxara` | Nyxara, the Veiled Matriarch (Umbral Veil) | A throne room of veils: layers of black-violet curtains half hiding a towering bone throne, a bone chandelier, moonlight through a high window, everything partly hidden | violet, near-black, bone, moon silver | 1 tall veiled column 2 tall bone throne silhouette 3 tall shrouded statue 4 a violet-skull candelabra 5 a pile of black lace and bones 6 a cracked ballroom mirror 7 a violet brazier 8 hanging: long black-violet veils 9 hanging: a bone chandelier |
| `boss-applause` | The Applause Below (Umbral Veil) | An underground opera house: a giant stage with red velvet curtains half drawn, tiers of empty theatre boxes each with a single mask watching, footlights, a huge chandelier | velvet red, black, gold, spectral teal | 1 tall theatre box tower with masks 2 tall stage curtain column 3 tall organ pipe set 4 footlights in a row 5 a stack of masks and roses 6 a broken stage prop crown 7 a spotlight on a stand 8 hanging: red velvet curtain swag 9 hanging: a crystal chandelier |
| `boss-tide` | The Mourning Tide (Gloomfen) | A drowned funeral harbour: a sunken chapel with only its bell tower above black water, coffins drifting, a low tide line of stones, grey lanterns, a huge wave frozen in the fog | grey, black water, pale green, lantern yellow | 1 tall half-sunk bell tower 2 tall dead mast of a sunken ship 3 tall weeping statue 4 a floating coffin with a candle 5 a pile of mooring posts and rope 6 a funeral wreath on a rock 7 a grey lantern on a post 8 hanging: dripping seaweed strands 9 hanging: a tolling bell |
| `boss-queen` | Queen of the Unmade (The Hollow Crown) | A palace dissolving into sand and glass: a colossal shattered crown as the throne room's ceiling, walls breaking apart into floating shards, ember chess pieces on a cracked board floor | amber, black glass, ember red, gold | 1 tall column dissolving into shards 2 tall shattered crown spike 3 tall ember chess king 4 a giant ember chess pawn 5 a pile of shattered crown jewels 6 a cracked throne step 7 a brazier of amber glass fire 8 hanging: floating crown shards 9 hanging: unravelling tapestry threads |
| `boss-regent` | Event Horizon Regent (The Far Rifts) | A palace at the edge of a black hole: a huge black sphere ringed by a bright accretion disk filling the sky, staircases bending toward it, debris orbiting, starlight stretched into streaks | black, white-gold disk, deep blue, violet | 1 tall bent staircase spire 2 tall orbiting pillar 3 tall throne of folded space 4 a floating debris chunk with a glow 5 a cracked gravity well pedestal 6 a ring of orbiting stones 7 a star-lantern being pulled sideways 8 hanging: streaks of stretched starlight 9 hanging: a chain bending toward the right |
| `boss-vorthax` | Valerion, Heart of the Rift (the finale) | The Heart of the Rift: a colossal broken stone pillar perch at the centre of everything, a huge glowing violet-cyan rift heart pulsing behind it, floating chunks of every realm around it (a gold spire, a smokestack, a jungle tree, a ballroom arch, a swamp hut, a glass dune, a brick chimney) | dark purple, violet, cyan, white light | 1 tall broken pillar perch 2 tall floating chunk of a gold cathedral spire 3 tall floating chunk of a jungle tree with roots 4 a cracked rift-heart crystal 5 a floating chunk of foundry machinery 6 a floating chunk of swamp hut 7 a rift-fire brazier 8 hanging: shards of all realms on violet threads 9 hanging: a torn rift seam |

Send each as: "Backdrop `<name>`: <Warden>. BOSS ARENA line. SCENE: <backdrop>. PALETTE: <palette>." and "Props `<name>`: <Warden>. THE NINE: <props>. PALETTE: <palette>."

---

## 4. The Crossing: the arena for Echoes and PvP (`crossing`)

Echo (ghost) fights and PvP matches happen here. It's built from pieces of every realm, stitched together by rift seams, so it reads as neutral ground between worlds. **PvP needs it symmetric:** both sides are equal, unlike the other arenas.

- **Backdrop `crossing.png`** (backdrop starter, plus this line: "This arena is SYMMETRIC: the left and right halves mirror each other in weight; the centre focal point sits dead centre."): The Rift-Crossed Colosseum. A great round arena built from stitched pieces of seven worlds: one stretch of wall gold marble, the next foundry steel, then jungle wood, ballroom stone, swamp timber, black desert glass and city brick, joined by glowing violet-cyan rift seams. Tiers of empty stands lit by hundreds of small floating ghost-lights like an audience of spirits. Two great gates facing each other at left and right. Above the centre a slow rift vortex in the sky. Palette: violet, cyan, with small patches of each realm's own colour.
- **Props `crossing.png`**: 1 tall stitched column, half gold marble and half foundry steel, joined by a glowing seam. 2 tall arena gate tower. 3 tall pillar of stacked stones from different worlds. 4 a cluster of floating ghost-lights over a stone bowl. 5 a weapon rack holding weapons from different worlds. 6 a broken arena wall section with a rift seam. 7 a spectral flame brazier in cyan. 8 hanging: banners of every realm stitched into one. 9 hanging: a chain of glowing ghost lanterns.

---

## 5. Floor sheets (`assets-src/arenas/floors/`)

Send each floor sheet in a fresh chat with the Valeria image, as a complete prompt.

### `floors-2.png` (the eight new fight sites)

```
Create ONE TILE SHEET image of 8 seamless floor textures for a card-battler game, 2048 x 1024, in a clean 4 x 2 grid of square tiles with NO characters.
The attached image (Valeria) is the STYLE ANCHOR: match its cartoon game-art rendering (bold clean outlines, flat saturated colour, simple cel shading, crisp polished shapes). Do NOT copy her character. Backgrounds are SOFTER and less contrasty than characters so the characters pop in front.

LAYOUT (critical): eight square tiles that touch edge to edge with NO gaps, NO borders and NO labels. Each tile is a flat TOP-DOWN view of the floor material, evenly lit with NO shadows, NO strong highlights and NO objects on it, so that it can be tiled seamlessly (the pattern continues across all four edges). Gentle variation, thin dark joint lines, bold simplified cartoon shapes, medium contrast, slightly desaturated.

THE EIGHT, left to right, top row first:
1. castle rampart walkway: pale sandstone blocks with worn gold-inlaid edges. Palette: ivory, gold, sky blue.
2. skydock deck: riveted steel deck plates with teal-painted lane stripes. Palette: steel, teal, hazard orange.
3. canopy platform: lashed wooden planks with rope bindings and leaves. Palette: warm wood, moss green.
4. garden path: dark flagstones with moss and fallen violet petals. Palette: near-black, violet, silver-green.
5. stilt walkway: wet swollen boards with gaps and green slime. Palette: swamp green, grey wood.
6. bazaar floor: sun-baked terracotta tiles with sand drifts. Palette: terracotta, amber, sand.
7. cellar floor: worn red brick in a herringbone pattern with ale stains. Palette: brick red, amber, brown.
8. observatory floor: dark star-stone with inlaid brass constellation lines. Palette: deep blue, brass, star white.

NEGATIVE: text, letters, numbers, labels, UI, frame, border, watermark, logo, perspective, shadows, objects, characters, photorealism, gritty textures.
```

### `floors-3.png` (Wardens 1 to 8)

Same prompt as `floors-2`, with THE EIGHT replaced by:

```
1. Seraphine: polished gold-veined white marble with a sunburst inlay pattern. Palette: gold, ivory, blue.
2. Hollow Benediction: cracked cathedral tiles drowned in pale wax drips. Palette: wax ivory, tarnished gold.
3. Kron: heavy foundry floor plates with glowing orange seams. Palette: steel, molten orange.
4. Mother of Static: black rubber floor tiles crossed by thin cyan cables. Palette: gunmetal, cyan.
5. Gorrmaw: packed red earth scattered with eggshell and bone chips. Palette: ember red, bone.
6. Upside-Down Stag: shallow mirror water over mossy stones. Palette: teal, moss, silver.
7. Nyxara: black marble with violet veins and lace patterns. Palette: near-black, violet.
8. Applause Below: dark stage boards with faded gold paint marks. Palette: dark wood, gold, velvet red.
```

### `floors-4.png` (Wardens 9 to 12 and the Crossing)

Same prompt as `floors-2`, with THE EIGHT replaced by:

```
1. Mourning Tide: wet black flagstones with pools of grey tide water. Palette: grey, black, pale green.
2. Queen of the Unmade: a cracked chessboard of amber and black glass. Palette: amber, black glass.
3. Event Horizon Regent: dark stone tiles stretched and bent, star specks. Palette: black, white-gold, violet.
4. Valerion: dark cracked stone slabs with bright violet-and-cyan rift seams. Palette: dark purple, violet, cyan.
5. The Crossing: a patchwork of seven different floor materials (gold marble, steel, wood, black marble, swamp boards, glass, brick) stitched by glowing rift seams. Palette: mixed, violet and cyan seams.
6. The Crossing, sand: pale arena sand with faint violet rift-glass flecks. Palette: sand, violet.
7. The Crossing, centre: a stone circle with a carved rift sigil (abstract, no letters). Palette: grey stone, cyan glow.
8. spare: plain dark rift stone. Palette: dark purple.
```

---

## Order to make them in

1. **The Warden arenas** (24 images) with **`floors-3`** and **`floors-4`**, the biggest visible gain: every map ends on one.
2. **The Crossing** (2), so Echoes and PvP get their own ground (its floors are on `floors-4`).
3. **The event scenes**, most-seen first: 1-17, then 18-40, then the rest. `merchant` and `shrine` are seen almost every map, so make those two early.
4. **Finish the three arenas** (5), then **the eight new sites** (16) and **`floors-2`**.

**Done 2026-11-02 (DECISIONS #554):** all 147 were made; `tools/pack-scenes.ps1` packs the event scenes and `tools/pack-arenas.ps1` the arenas. A new scene or arena: add the file with the name above and run the packer (a new venue also needs a row in the packer, `VenueId` and `ARENA_LOOK`).
