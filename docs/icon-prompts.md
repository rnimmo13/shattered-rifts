# Status, Boon and pile art: prompts for ChatGPT

These replace the placeholder drawings in `apps/web/src/art/gameIcons.ts` and `apps/web/src/fight/PileArt.tsx` (DECISIONS #505). Nine sheets: 6 of buffs and debuffs, 2 of Boons and Warden's Hearts, 1 of piles.

**How to use**
1. Attach the Valeria image (`assets-src/heroes/_source/Sunlit Paladin with Shield and Sword.png`) as the style anchor and paste the prompt for sheet 1.
2. Check it against the checklist below, and regenerate until you like it. **This sheet sets the look of all the others.**
3. For each later sheet, attach Valeria **and your approved sheet 1**, and paste its prompt. The "Order" line above each prompt is for you, so you can check each picture is in the right place; it is not part of the prompt.
4. Save each one under its file name in `assets-src/icons/` as a PNG, and tell me. I will build the cutter that cuts them out and wire them into the game, as with the totems and weapons. The placeholders stay until then.

**Checklist for each sheet**
- The right number of pictures, in the right order and in an even grid.
- At the size of a fingernail, can you still tell what each one is? Shrink the image to check. If not, ask for "simpler and bolder" on that one.
- The background is plain magenta everywhere, with no glow or shadow on it.
- Every outline is unbroken: the cut-out follows it, and a gap lets the cut leak in.
- No stray words or numbers, other than the 0s on sheet 5.

**To redo one picture:** in the same chat, say "Keep everything exactly the same, but change icon 7: ...". ChatGPT may redraw the others a little, so compare them. Or ask for a new sheet holding only the pictures you want to replace, and I will cut those.

**Not on these sheets**
- **Auras** already show their own card art in a small round frame, so they need no new pictures.
- **Retired statuses** (Focus, Knives, Preparation, Twin Edge, Mastery, Opening, Rousing, Shelter) no longer come up in play or on the Learn page, so they keep their drawings.
- **The empty pile** stays a dashed outline drawn by the game.

**Keep it ours:** don't attach Slay the Spire 2 screenshots or name a game or artist in a prompt (Golden rule 6, and `05_ART_PIPELINE.md` §1). ChatGPT can copy too closely from a reference. The prompts ask for the small, bold, readable qualities you pointed at, without the source.

## Sheet 1: `icons-01.png` (Debuffs: wounds and weakness (make this one first))

Order: Bleed, Burn, Hemorrhage, Fate, Fracture, Shocked, Exposed, Faltering, Brittle, Debilitated, Sapped, Hangover.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached image is the STYLE ANCHOR: match its game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. A single fat drop of dark red blood, with a white highlight.
2. One big fierce flame, orange at the edges and yellow at its heart.
3. Three drops of blood falling together, one large over two small.
4. A pale violet skull, front on, with dark hollow eyes and a faint purple tint: a curse.
5. A jagged shard of black volcanic glass, split by bright violet glowing cracks.
6. A jagged yellow lightning bolt with two small white sparks beside it.
7. A steel shield split down the middle into two halves pulled apart, a red glow in the gap.
8. A sword snapped in half: gold crossguard and a short stump of blade, the broken tip falling away at an angle.
9. A shield of thin pale blue ice covered in dark cracks.
10. Two bold violet chevrons pointing down, one above the other, heavy and chiselled.
11. A weak drooping fist in pale skin tones with a bold red arrow pointing down beside it.
12. A battered wooden tankard with iron bands, its handle at the right, foam spilling over the rim.
```

## Sheet 2: `icons-02.png` (Marks, then attack buffs)

Order: Noose, Strangled, Quarry, Bladebane, Might, Primed, Keen, Lethality, Cruelty, Tracking, Clutch Genes, Cadence.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. A hangman's noose of thick tan rope: a round loop hanging from a wrapped knot.
2. Two thick tan ropes crossing in an X, pulled tight through one big dark knot in the middle.
3. A bold red crosshair: a thick ring with four short ticks and a dot in the centre.
4. A black glass sword, point up, with a thick red X slashed across it.
5. A big clenched fist in warm skin tones seen from the front, knuckles forward.
6. A wooden hunting bow drawn back, a steel-tipped arrow nocked and pointing to the right.
7. A polished steel longsword, point up, gold crossguard, with one bright white four-point star glinting at the tip.
8. A short dagger, point up, its blade red with blood, one fat drop of blood falling beside it.
9. A wide cruel grin: a black mouth with sharp white fangs and a thin line of red at the lip, no face around it.
10. A large dark brown animal paw print: one big pad and four round toes.
11. A short twist of double helix, one strand red and one strand blue, with white rungs between them.
12. A wooden metronome with a pale face and a tilted swinging arm with a gold weight.
```

## Sheet 3: `icons-03.png` (Defence)

Order: Thorns, Shielded, Bracing, Ghostly, Steadfast, Armored, Fortified, Plating, Sturdy, Unmovable, Guarded, Blur.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. A diagonal green bramble stem with big dark curved thorns on both sides.
2. A bright glassy cyan bubble with a curved white shine: a sphere, nothing inside it.
3. A blue kite shield with a big white plus sign on its face.
4. A small pale blue sheet-shaped ghost, wavy at the bottom, with two dark eyes and a small round mouth.
5. A closed steel knight's helm, front on, with a dark T-shaped visor slit.
6. A steel breastplate, front on, with broad shoulders and a gold clasp.
7. A small grey stone castle tower with battlements and a dark arched door.
8. Three overlapping curved steel plates stacked like roof tiles, bright on top and darker below.
9. A dark iron blacksmith's anvil seen from the side.
10. A grey mountain with two snow-capped peaks.
11. A blue shield with a gold arrow coming in from the left and pointing at it: a shield on its way.
12. A blue kite shield smeared sideways by speed, with several pale blue motion streaks trailing to the left.
```

## Sheet 4: `icons-04.png` (More defence, stances and doubled cards)

Order: Meld, Reflect, Buffer, Taunt, Serene, Fury, Radiant, Fervor, Poised, Empowered, Reverb, Mirrored.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. Two kite shields overlapping, one violet and one blue, merging into one.
2. A steel kite shield with a thick orange curved arrow bouncing off its face and back to the left.
3. A red heart safe inside a clear pale blue bubble.
4. A gold kite shield with a red bullseye target painted on its face.
5. A blue lotus flower with three open petals, sitting on a flat line of still water.
6. A red spiky burst with two furious slanted yellow eyes: rage, no other face.
7. A blazing golden sun with short triangular rays and a bright centre.
8. A ring of round golden prayer beads with one red tassel hanging from the bottom.
9. A tightly coiled steel spring, drawn upright.
10. A clenched fist in warm skin tones gripping a bright yellow lightning bolt that rises out of it.
11. Two steel swords crossed in an X, gold crossguards, points up.
12. Two identical upright playing cards side by side, one green and one pale blue, mirror images of each other, with plain backs.
```

## Sheet 5: `icons-05.png` (Cards that cost nothing, and card tricks)

Order: Free Attack, Free Skill, Free Aura, Free Spell, Free Fleeting, Free Play, Unbound, Echo, Resound, Momentum, Holdfast, Planner.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, labels or captions anywhere. The only character allowed on this sheet is the big numeral 0 on the six cards.

THE ICONS, in this exact order, left to right, top row first:
1. One upright card with a gold inner frame, RED, with a big white numeral 0 in the middle.
2. The same card and the same big white 0, GREEN.
3. The same card and the same big white 0, VIOLET.
4. The same card and the same big white 0, BLUE.
5. The same card and the same big white 0, PALE TRANSLUCENT GREY-BLUE, wispy at the edges like smoke.
6. The same card and the same big white 0, GOLD, with one white four-point star glinting at its corner.
7. A steel chain snapped into two pieces, with yellow sparks at the break.
8. A violet orb at the left with three curved sound waves spreading to the right.
9. A golden bell, slightly tilted, as if just struck.
10. Two thick cyan arrows chasing each other in a circle around a small pale gem.
11. A pale steel card held upright in an open hand in warm skin tones, the fingers in front of it. The card is plain.
12. A cream parchment scroll with short dark lines of writing (lines only, no letters), and a violet quill across it.
```

## Sheet 6: `icons-06.png` (Blades, spells, bones and owls)

Order: Edge, Honed, Fanned, Deftness, Blade Sweep, Blade Echo, Measured Ruin, Marrow, Reaping, Moonlit, Owl Charge, Owl Echo.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. A short steel dagger, point up, wide simple blade, gold crossguard, a white line along its edge.
2. The same short steel dagger with a big white four-point star glinting at its tip.
3. Three short steel daggers spread out in a fan, points outward, hilts meeting at the bottom.
4. A slim steel throwing dart flying up and to the right, with red feather flights.
5. A sword of black volcanic glass, tilted, with a broad bright violet swoosh arc curving around it.
6. Two swords of black volcanic glass side by side, points up, the left one a faded copy of the right.
7. A round black molten rock falling, a blazing orange trail streaming up and to the right behind it, glowing cracks in the rock.
8. A single cream bone, diagonal, with knobbed ends.
9. A scythe: a dark wooden shaft and a big curved pale violet blade.
10. A golden crescent moon with a small bold red arrow pointing down beside it.
11. A plump grey-violet owl, front on, with huge round yellow eyes and a small gold beak.
12. Two of the same plump grey-violet owls side by side, one slightly behind the other.
```

## Sheet 7: `boons-01.png` (Boons)

Order: Iron Sigil, Thorn Charm, Idol of Might, Ember Lamp, Healing Vial, Rift Satchel, Crystal Heart, Shard Purse, Vigor Wick, Hex Lantern, Hunter's Lens, Aegis of Ages.

```
Create ONE SHEET of 12 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate icons spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. A round dark iron token stamped with a raised shield shape.
2. A round wooden amulet on a short cord, a green bramble with thorns carved across it.
3. A small golden statuette of a stout figure raising one fist above its head, on a little base.
4. A low golden oil lamp with a curled handle and one small flame at its spout.
5. A round glass potion bottle with a cork, red liquid inside, a white cross on it.
6. A brown leather satchel with a violet flap and a gold buckle, faint violet light at the seam.
7. A heart cut from cyan crystal, with big flat bright facets.
8. A tied brown leather coin pouch with one gold coin escaping from its top.
9. A short cream candle on a gold dish with a small green flame.
10. A square iron lantern with a ring on top, dark glass, a green witch-flame inside.
11. A round magnifying glass with a gold rim and a wooden handle, handle to the lower right.
12. A very old round wooden shield with a worn gold rim and a gold boss in the centre, seen front on.
```

## Sheet 8: `boons-02.png` (The last Boon, the Warden's Hearts and Spirit)

Order: The Gilded Crown, Ember Heart, Glutton's Heart, Blood Heart, Thorned Heart, Warded Heart, Spirit, Plain heart (spare).

```
Create ONE SHEET of 8 separate small game icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 8 separate icons spaced in an even invisible grid of 4 across and 2 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
READABLE WHEN TINY (critical): each icon will be shown at only 32 pixels on a busy battlefield, so each is ONE bold object, centred and large, filling about 80% of its space. Big simple shapes, two or three main colours, no small details, no thin lines, no scenery, no hands or figures unless asked for. All icons share the same viewing angle, outline weight and lighting, so they look like one set.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ICONS, in this exact order, left to right, top row first:
1. A golden crown with five points, one red gem in the middle and a blue gem each side.
2. A simple dark red heart shape (a playing-card heart, not a real organ), charred, with a bright orange flame burning at its centre.
3. The same simple heart, bright red, with a wide mouth full of sharp white teeth across its middle.
4. The same simple heart, very dark red, with a bright red drop of blood running down its centre.
5. The same simple heart, bright red, wrapped by one green thorny vine with big thorns sticking out around it.
6. The same simple heart, bright red, with a small steel shield set on its centre.
7. A wisp of pale cyan spirit fire rising, white at its heart, soft in shape but with a clear outline.
8. The same simple heart, plain bright red, nothing added (the game can use it for anything new).
```

## Sheet 9: `piles-01.png` (the draw, discard and Consumed piles)

Four sizes each: the game picks the size by how many cards are in the pile.

```
Create ONE SHEET of 12 separate pictures of stacks of playing cards for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, one plain flat solid magenta (#FF00FF) background over the WHOLE sheet, with 12 separate stacks spaced in an even invisible grid of 4 across and 3 down. No grid lines, cells, frames, badges or circles behind anything. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): no shadow on the ground, no glow or sparkles outside the outline, no gradient, no texture. Each picture has a thick, unbroken near-black outline all the way round its silhouette. Use no magenta or hot pink inside the pictures.
SAME ANGLE (critical): every stack is seen from the same three-quarter view from above, turned slightly to the right, the cards upright in portrait shape, standing as a thick stack with its side edges showing, so a stack visibly has weight. Each stack fills most of its space. The top card of each kind is exactly the same picture in all four sizes, so they swap cleanly as a pile grows.
NO TEXT: no letters, numbers, labels or captions anywhere.

THE ROWS, each with four sizes. Left to right in every row: 1 card, a thin stack of about 4 cards, a stack of about 10 cards, a thick stack of about 25 cards.
TOP ROW, the DRAW pile: cards FACE DOWN and squared up neatly. The card back is deep navy blue with a gold frame, a faint gold diamond lattice, and in the centre a gold-rimmed diamond holding a jagged violet rift of light. The edges of the stack are warm cream paper with thin gold lines.
MIDDLE ROW, the DISCARD pile: cards FACE UP, thrown down crooked at different small angles so the stack is messy. The top card has a cream parchment face, a dark gold border, a small square painted picture of a stormy violet landscape in its upper half, and three short dark lines where text would be (lines only, no letters).
BOTTOM ROW, the CONSUMED pile: the same crooked stack, but burnt: charcoal black card faces, bitten ragged edges, glowing orange embers along the burnt edges, a little grey ash on top. No flames rising above the stack and no smoke, so the background stays clean.
```
