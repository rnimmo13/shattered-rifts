# Animation and effect art: prompts for ChatGPT

These add the small touches that make a card game feel alive: a card flying to the discard pile, a shield splitting when an enemy is Exposed, a potion shattering. Sixteen sheets: one of potions, nine of animated effects, three of Ascendancy crests, one of class crests, and two more stills I'm suggesting (enemy intents, map stops).

**How to use**
1. Attach the Valeria image (`assets-src/heroes/_source/Sunlit Paladin with Shield and Sword.png`) and `assets-src/icons/icons-01.png` as style anchors, and paste one prompt. Those two keep this art matching the icons already in the game.
2. Do `fx-debuffs` first, as it is the one to judge the animated style by. If it reads well, carry on; if not, tell ChatGPT what to change and regenerate before the others.
3. Save each one under its file name in `assets-src/fx/` as a PNG, and tell me. I'll cut them up and wire them in. The "Order" line above each prompt is for checking the result, not part of it.

**Checklist for each sheet**
- The right number of pictures and rows, in the right order and an even grid.
- In an animated row: the frames line up, so nothing jumps when played. Frame 1 is small, the middle is biggest, frame 6 is nearly gone.
- Plain magenta everywhere behind them.
- Shrink it down: still readable at about 180 px a frame for effects, 48 px for stills.

**Keep it ours:** don't attach Slay the Spire 2 screenshots or name a game or artist in a prompt (Golden rule 6, `05_ART_PIPELINE.md` §1). Save `icon-sheets-manifest.json`-style prompt records if ChatGPT writes them; Steam's AI disclosure will want them.

## What the art can't do, and I'll build in code

Most of what you're describing is motion, not pictures, so these need no art beyond the sheets below. I'll build them when the sheets are in:

| Moment | What happens |
|---|---|
| **A card played** | It lifts, flies to the target, and its effect plays on arrival |
| **To the discard pile** | It shrinks and curves into the pile with a dust trail; the pile bumps and its count ticks up |
| **To the Consumed pile** | It stops, burns up in place, and its embers drift into the pile |
| **Drawing** | Cards deal out of the draw pile one by one with a light trail; the pile's stack shrinks |
| **Shuffling** | The discard pile's cards arc across the screen into the draw pile |
| **A status landing** | Its icon flies from the card to the target, its effect plays there, and the chip pops in with a bounce |
| **A status ticking** | The chip pulses and the effect plays, with the damage number from it |
| **Damage** | The HP bar shows a pale trail that drains after the red, the figure flinches, a brief freeze on a big hit, and the screen shakes in proportion |
| **Barrier** | The number pops on gain; on breaking, the blue bar shatters |
| **Enemy intent** | It swings in at the start of your turn and shakes just before the enemy acts |
| **Mana** | The gem drains as you pay, and a card you can't afford shakes |
| **End turn** | The button pulses when nothing more can be played |
| **Fate** | The purple band grows on the HP bar, and pulses at lethal (done) |
| **A Trap springing** | The card flips up, the screen dims for a beat, and it strikes |
| **An Ascendancy chosen** | The screen darkens, the crest rises, the old class name burns away and the new one is written in gold |
| **Rewards and map** | A reward card flies into your deck pile; the path to the next stop draws itself in gold |

All of these follow the speed setting and the reduced-motion setting, and gameplay never waits on them.

## Sheet 1: `potions-01.png` (Potions)

The bottles on the belt. They replace the coloured liquid the game draws now.

Order: Fire Flask, Guard Draught, Mana Vial, Swift Draught, Might Tonic, Healing Philtre, Ember Bomb, Frost Phial, Shock Tonic, Ward Elixir, (spare) empty round flask, (spare) empty tall vial.

```
Create ONE SHEET of 12 separate potion bottles for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. A round glass flask with a cork, full of churning orange fire, a flame licking out at the neck.
2. A squat steel-banded blue bottle with a small shield stamped on its front.
3. A slender vial of glowing cyan liquid with a gem for a stopper.
4. A tall thin green bottle with a winged stopper, liquid swirling up it.
5. A stout red bottle shaped like a clenched fist, with a gold cap.
6. A round rose-pink flask with a white cross on it and bubbles rising.
7. A black iron sphere with a lit fuse and glowing orange cracks: a thrown bomb.
8. A frosted pale blue vial with ice crystals growing over its glass and a mist at the stopper.
9. A yellow bottle crackling with a small bolt of lightning inside it.
10. A gold-trimmed violet bottle with thorns wrapped around it.
11. An empty round glass flask with a cork.
12. An empty tall glass vial with a cork.
```

## Sheet 2: `fx-potions.png` (Drinking and throwing a potion)

Plays on the hero or on the target when a potion is used. The bottle itself is moved by the game: these are what comes out.

Order: Drink, Heal, Shatter, Explosion.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: using a potion, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: DRINK: a swirl of bright liquid rising in a spiral, white-gold, ending in a soft ring of droplets flying outward.
Row 2: HEAL: green and white motes and small plus-shaped sparks rising upward in a column, gently spreading.
Row 3: SHATTER: a glass flask breaking in mid-air into big jagged shards, with a splash of liquid bursting out.
Row 4: EXPLOSION: a round orange fire burst with a dark smoke ring, chunks of black iron flying out.
```

## Sheet 3: `fx-debuffs.png` (Debuffs landing)

Plays on the unit the moment it gains the debuff, so you can see Exposed hit an enemy.

Order: Exposed, Faltering, Brittle, Shocked.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: a debuff landing on a target, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: EXPOSED: a steel shield appears, cracks down the middle, splits into two halves that fall apart, a red glow bursting from the gap.
Row 2: FALTERING: a sword appears point up, snaps in the middle, the tip falling away, grey-purple wisps sinking downward.
Row 3: BRITTLE: a shield of pale blue ice appears, dark cracks spread across it, then it crumbles into falling shards.
Row 4: SHOCKED: yellow lightning bolts strike down from above and crackle outward in jagged arcs with white sparks.
```

## Sheet 4: `fx-curses.png` (More debuffs and curses)

Fate is shown on the HP bar now; this is its moment of landing, and of killing.

Order: Fate lands, Fate kills, Fracture, Shatter.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: a curse landing on a target, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: FATE LANDS: a pale violet skull fades in, its eye sockets flare with purple light, then it sinks down in violet smoke.
Row 2: FATE KILLS: a huge violet skull snaps its jaws shut, then bursts outward into purple smoke and shards.
Row 3: FRACTURE: thin bright violet cracks race outward from the centre across empty air, like cracks in black glass.
Row 4: SHATTER: a sheet of black glass bursts outward into many big jagged shards with a bright violet flash at the centre.
```

## Sheet 5: `fx-ticks.png` (Damage over time and stacks)

Plays each time a stack ticks, so a burning or bleeding enemy reads at a glance.

Order: Bleed tick, Burn tick, Hangover, Static.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: damage over time ticking on a target, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: BLEED: a burst of dark red blood droplets spraying outward and falling under gravity, ending in a few drips.
Row 2: BURN: a tongue of orange and yellow flame flaring upward, leaving rising embers.
Row 3: HANGOVER: sickly green-yellow bubbles rising and popping, with a small woozy swirl.
Row 4: STATIC: a small grey-blue crackle of broken lines fizzling and flickering out.
```

## Sheet 6: `fx-buffs.png` (Buffs)

Plays on the unit when it gains the buff.

Order: Might, Primed, Thorns, Shielded.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: a buff landing on a character, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: MIGHT: a golden clenched fist flares up, shockwave ring pushing outward, red-gold streaks rising.
Row 2: PRIMED: gold energy gathers inward to a bright point, then flashes like a charged blow.
Row 3: THORNS: green brambles with dark thorns burst outward in a ring, then settle and fade.
Row 4: SHIELDED: a glassy cyan bubble swells up with a curved white shine, ripples once, then fades to a faint outline.
```

## Sheet 7: `fx-barrier.png` (Barrier)

Barrier is your most-seen effect. It should feel solid when gained and satisfying when it breaks.

Order: Barrier gained, Barrier hit, Barrier broken, Plating.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: a character protected by a magic barrier, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: BARRIER GAINED: a translucent blue hexagon-patterned kite shield snaps into being with a bright rim flash, then fades to a soft glow.
Row 2: BARRIER HIT: an impact star of white and cyan on a blue shield surface, ripples spreading from it.
Row 3: BARRIER BROKEN: a blue shield cracks all over, then blows apart into big glowing blue shards flying outward.
Row 4: PLATING: three curved steel plates slide in from the sides and clamp together with a spark at each join.
```

## Sheet 8: `fx-hits.png` (Hits)

Today hits are drawn in code: a slash arc, a shock ring. These add weight.

Order: Slash, Heavy blow, Pierce, Critical burst.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: an attack hitting a target, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: SLASH: a bold curved white-gold blade arc sweeping diagonally, tapering to a point, with a few sparks.
Row 2: HEAVY BLOW: a star-shaped impact with thick orange-white rays and a dark shockwave ring.
Row 3: PIERCE: a narrow bright spear of light thrusting straight across, with a small burst at its tip.
Row 4: CRITICAL BURST: a huge jagged white and gold starburst with red edges, for the biggest hits.
```

## Sheet 9: `fx-cards.png` (Cards moving)

The game moves the cards themselves. These are what they leave behind and what happens when they land.

Order: Draw trail, Discard trail, Consumed burn-up, Card arrives.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: a playing card moving around the table, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: DRAW TRAIL: a streak of blue-white light with small stars, thin at the back and bright at the front, moving right.
Row 2: DISCARD TRAIL: a streak of warm grey-gold dust, thin at the back and fading, moving right.
Row 3: CONSUMED BURN-UP: an upright portrait-shaped playing card with a plain dark back catching fire from its bottom edge, burning upward into glowing embers and ash until nothing is left.
Row 4: CARD ARRIVES: a small puff of gold sparks and a thin ring, as a card lands on a pile.
```

## Sheet 10: `fx-units.png` (Comings and goings)

Summons, deaths, and the moments between turns.

Order: Summon rift, Enemy death, Phase rise, Heal on a hero.

```
Create ONE SHEET of a short frame-by-frame visual effects animation for a dark-fantasy 2D card-battler: a character arriving or leaving, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image holding 4 rows of EXACTLY 6 frames each, 6 across and 4 down, spaced in an even invisible grid. Each row is ONE effect, played left to right: frame 1 is the very start, small and faint; frames 2 to 4 grow to the brightest moment; frames 5 and 6 fade and break apart until almost nothing is left. Every frame in a row is centred on the same point and drawn at the same scale, so it plays without jumping. Effects stay inside their own space and never touch a neighbour.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
EFFECT STYLE (critical): these play over a battlefield at about 180 pixels for about half a second, so they are bold, graphic, painted shapes with strong silhouettes and clear colour, not soft glows or fine particles. A dark outline around the larger shapes; small sparks may have none. No characters, hands, cards or scenery unless asked for.

THE EFFECTS, one per row, top row first:
Row 1: SUMMON RIFT: a jagged violet rift opens as a glowing vertical tear on the ground, sparks pouring out, then it closes.
Row 2: DEATH: a dark smoke and ember burst rising and thinning upward, with a few bright fragments falling away.
Row 3: PHASE RISE: a pillar of red-violet energy bursting upward, with a ring of force at the base, for an enemy rising into its next phase.
Row 4: REST: warm golden motes rising and circling slowly upward.
```

## Sheet 11: `intents-01.png` (What enemies mean to do)

The intent marks over an enemy, today drawn with symbols.

Order: Attack, Multi-attack, Big attack, Defend, Buff, Debuff, Summon, Unknown, Set a Trap, Charge, Flee, Sleep.

```
Create ONE SHEET of 12 separate enemy intent icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. A single sword angled down and to the left, ready to strike, red-tinted steel.
2. Three small swords in a fan, red-tinted steel.
3. A huge jagged blade with a blazing orange edge.
4. A plain blue kite shield.
5. A golden upward arrow with a glowing fist inside it.
6. A violet downward arrow with a skull mark inside it.
7. A jagged violet rift with a small silhouette stepping out.
8. A big question mark shape made of grey smoke. (This is the one character allowed on this sheet.)
9. A hidden spring-jaw trap, half open, dark iron.
10. A swirling ball of gathering orange energy.
11. A running boot with a dust cloud behind it.
12. A small crescent moon with three stars, for an enemy that is asleep.
```

## Sheet 12: `map-01.png` (Map stops)

The stops on the act map, today plain line drawings. I suggest these because the map is now 15 floors and worth looking at.

Order: Duel, Elite, Event, Shrine, Merchant, Warden, Ghost Warden, Your position, Cleared stop, Rift-crossed Merchant, (spare) treasure, (spare) sealed door.

```
Create ONE SHEET of 12 separate map markers for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. Two crossed steel swords.
2. A horned red demon skull.
3. A glowing question mark made of blue mist. (A question mark is allowed on this sheet.)
4. A small stone shrine with a green flame on it.
5. A leather merchant pack with coins and a small hanging lantern.
6. A huge dark crown with a red gem.
7. A pale blue ghost wearing a dark crown.
8. A gold four-point compass star.
9. A faded grey stone with a check-shaped chip cut into it.
10. A merchant pack split by a violet rift crack.
11. A small iron-bound treasure chest.
12. A round stone door with a rune, sealed.
```

## Sheet 13: `ascend-01.png` (Ascendancies, part 1)

Each class's crest, for the choice screen and beside the name once chosen. This one is a new need from the Ascendancies.

Order: Paladin, Marshal, Blood Knight, Foreman, Golemancer, Overclocker, Beastmaster, Reaver, Predator, Trapmaster, Cardsharp, Seer.

```
Create ONE SHEET of 12 separate heraldic class crests for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. A gold-and-white shield with a radiant sun, wings at its sides.
2. A general’s baton crossed with a banner, gold and royal blue.
3. A black helm with a stream of blood running down it.
4. A hard hat style iron helm on crossed spanners, with a small drone above.
5. A hulking iron golem’s head with a glowing furnace mouth.
6. A gear with a lightning bolt through it, cyan and orange.
7. A wolf’s head roaring, crowned with bone.
8. A bone cleaver dripping red, with a torn edge.
9. A big cat’s skull with glowing red eye sockets, fangs bared.
10. A spring-jaw trap with a spider sitting in its centre.
11. A fan of four playing cards with blank faces, one glowing gold.
12. A single open eye inside a ring of cards, teal and gold.
```

## Sheet 14: `ascend-02.png` (Ascendancies, part 2)

Order: Assassin, Bladedancer, Bloodletter, Totemist, Spiritwalker, Pyromancer, Sage, Zealot, Sunwalker, Blademaster, Archmage, Shatterer.

```
Create ONE SHEET of 12 separate heraldic class crests for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. A black hood with a single dagger through it, a red drop at the tip.
2. Three daggers spinning in a ring, teal trails behind them.
3. A curved red blade above a pool of three blood drops.
4. A carved totem pole with a hawk and a bear, glowing eyes.
5. A translucent cyan bird rising out of an open hand.
6. A flaming iron brazier with a tall column of orange flame.
7. A still blue lotus above a calm ring of water.
8. A flaming red fist breaking a chain.
9. A golden sun rising behind a pair of praying hands.
10. A long sword of black glass, point up, glowing violet edge.
11. An open book with a blazing orange star rising out of it.
12. A cracked black glass orb bursting at one side with violet light.
```

## Sheet 15: `ascend-03.png` (Ascendancies, part 3)

Order: Brewmaster, Gunslinger, Deathwish, Bonelord, Fateweaver, Soulreaper, then the Ascend banner frame and four spare crests.

```
Create ONE SHEET of 12 separate heraldic class crests for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: match their game-art rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. A huge frothing tankard with a gold band, crossed with a bottle.
2. A sawed-off double-barrel shotgun over a pair of crossed cartridges.
3. A cracked skull grinning, with a dwarf’s braided beard.
4. A throne of bones with a green glow.
5. A skull with violet threads running out of its eyes to a spindle.
6. A scythe with a green wisp of soul trailing from its blade.
7. A wide ornate empty gold-and-violet banner frame, horizontal, blank in the middle: for the word Ascend, which the game writes itself.
8. A plain gold laurel wreath, empty in the middle.
9. A plain silver laurel wreath, empty in the middle.
10. A rising violet rift flame.
11. A pair of gold wings, open.
12. A cracked crown with light pouring out of the crack.
```

## Sheet 16: `class-01.png` (the ten class crests)

The classes' own crests, painted to match the Ascendancy crests. Today each class is a flat one-colour symbol on a round plate (`apps/web/src/art/emblems.ts`). These replace that plate wherever a class is shown: the title screen, the pickers, the fight plates, the leaderboards and the card book. Card art keeps the flat symbols. Each crest keeps its class's colour so the classes still read apart at a glance, and each is a different object from its three Ascendancy crests. The Elementalist is on this sheet too, so the single prompt below is only needed if it comes out wrong here.

Attach `ascend-01.png` and `ascend-02.png` as the style anchor, not the Valeria image: these should look like the same set as those.

Order: Knight, Engineer, Hunter, Trickster, Rogue, Shaman, Monk, Spellblade, Necromancer, Drunkard, Elementalist, a spare for the Random pick.

```
Create ONE SHEET of 12 separate heraldic class crests for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: these new crests belong to the same set as the attached crests, so match their rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 12 separate pictures spaced in an even invisible grid of 4 across and 3 down. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown from 32 to 120 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details. Each has one main colour, given below, so the twelve are easy to tell apart. All share the same viewing angle, outline weight and lighting, so they look like one set.

THE PICTURES, in this exact order, left to right, top row first:
1. Pale gold: a closed knight's great helm in polished steel and gold, a gold sun on its brow, a longsword standing upright behind it.
2. Bright cyan: a riveted iron gauntlet gripping a brass gear with a glowing cyan core.
3. Coral red: a broad bone-white spearhead bound in coral-red cloth with two hanging feathers, three wide claw slashes behind it.
4. Violet: a violet domino mask over a single tall playing card with a blank face, the card tilted behind it.
5. Crimson: two slim throwing knives crossed point down, crimson-wrapped grips, a red gleam on each edge.
6. Leaf green: a carved wooden spirit mask with glowing green eyes and three feathers rising above it.
7. Warm orange: a closed fist wrapped in cloth tape, inside a ring of large wooden prayer beads.
8. Steel silver: a faceted black obsidian shard set in a silver sword hilt, a cold silver-blue rune glowing on the shard.
9. Sickly green: a horned skull with a green lantern flame burning in its brow.
10. Bottle green and rust: a round bottle-green bottle, its cork popped, a rust-red shotgun shell lying across it.
11. A carved stone ring set with three gems, an orange flame gem, an icy pale-blue frost gem and a crackling violet storm gem, evenly spaced, with a thin twist of fire, frost and lightning curling between them.
12. Deep violet and gold: a swirling violet rift portal in a cracked gold ring.
```

**Checklist for this sheet:** each crest's main colour matches its number above, and none looks like its class's Ascendancy crests (the Knight's must not look like the Paladin's winged shield, the Engineer's like the Overclocker's gear, the Monk's like the Zealot's fist).

## One crest: `crest-hunter.png` (the Hunter, redone)

Sheet 16 gave the Hunter a bow, but she carries none: her figure has a bone cleaver and a feathered spear, and her cards are blood, the Hound and the pack, and feasting. This crest uses her spear and claws, and keeps clear of her Ascendancy crests (Beastmaster's wolf head, Reaver's cleaver, Predator's cat skull). Attach `class-01.png` and `assets-src/heroes/` Kesh's figure (`apps/web/public/art/figures/hero-hunter.png`) as the style anchor. Save it as `assets-src/fx/class-hunter.png`.

```
Create ONE heraldic class crest for a dark-fantasy 2D card-battler, no text, matching the attached crests exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left). It belongs to the same set as the attached sheet of crests.
THE BACKGROUND MUST STAY CLEAN: one plain flat solid magenta (#FF00FF) over the whole image, no shadow, no gradient, no frame. Use no magenta or hot pink inside the picture. NO TEXT.
READABLE WHEN SMALL: it will be shown from 32 to 120 pixels, so ONE bold object, centred and large, with a thick unbroken near-black outline and big simple shapes. No thin lines: every part is thick enough to read at 32 pixels.
THE PICTURE, main colour coral red: a broad bone-white spearhead, point up, its shaft bound in coral-red cloth with two red-and-white feathers hanging from it, in front of three wide coral-red claw slashes torn diagonally behind it, like the attached figure's spear.
```

## One crest: `crest-shaman-elementalist.png` (the Elementalist, DECISIONS #542)

The Elementalist replaced the Pyromancer; until this is painted it wears the Pyromancer's brazier. It is number 11 on sheet 16, so use this only if that one comes out wrong. Attach two or three crests from sheets 13-15 as the style anchor.

```
Create ONE heraldic class crest for a dark-fantasy 2D card-battler, no text, matching the attached crests exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).
THE BACKGROUND MUST STAY CLEAN: one plain flat solid magenta (#FF00FF) over the whole image, no shadow, no gradient, no frame. Use no magenta or hot pink inside the picture. NO TEXT.
READABLE WHEN SMALL: it will be shown at only 48 pixels, so ONE bold object, centred and large, with a thick unbroken near-black outline and big simple shapes.
THE PICTURE: a carved stone ring set with three gems, an orange flame gem, an icy pale-blue frost gem and a crackling violet storm gem, evenly spaced, with a thin twist of fire, frost and lightning curling between them.
```

## One crest: `crest-engineer-swarmwright.png` (the Swarmwright, DECISIONS #569)

The Overclocker became the Swarmwright, the only class with a 4th companion slot; until this is painted it wears the Overclocker's lightning gear. The crest is about FOUR machines, and must keep clear of the Engineer's other Ascendancy crests: the Foreman's hard hat with one drone and crossed wrenches, the Golemancer's stone golem head. Attach `assets-src/fx/ascend-01.png` as the style anchor. Save it as `assets-src/fx/crest-swarmwright.png`.

```
Create ONE heraldic class crest for a dark-fantasy 2D card-battler, no text, matching the attached crests exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left). It belongs to the same set as the attached sheet of crests.
THE BACKGROUND MUST STAY CLEAN: one plain flat solid magenta (#FF00FF) over the whole image, no shadow, no gradient, no frame. Use no magenta or hot pink inside the picture. NO TEXT.
READABLE WHEN SMALL: it will be shown from 32 to 120 pixels, so ONE bold emblem, centred and large, with a thick unbroken near-black outline and big simple shapes. No thin lines: every part is thick enough to read at 32 pixels.
THE PICTURE, main colour bright cyan on brass and dark steel: FOUR identical round brass machine cores, each with one big glowing cyan eye, set in a diamond (top, bottom, left, right) on a dark steel hexagonal plate, each joined by a thick brass strut to a small bright cyan spark at the centre. Clearly four machines working as one swarm. No hard hat, no wrenches, no gear, no golem face, no lightning bolt.
```

## Sheet 17: `icons-07.png` (the Wardens' statuses)

Four status icons for the Wardens' rules. All four are stand-ins today: Slippery wears Ghostly's ghost (DECISIONS #528), and Veiled, Gravity and Unmaking wear copies of Ghostly, Orbit and Fracture (DECISIONS #546). Attach `assets-src/icons/icons-01.png` and `icons-03.png` as the style anchor. Save it as `assets-src/icons/icons-07.png`.

Order: Slippery, Veiled, Gravity, Unmaking.

```
Create ONE SHEET of 4 separate status icons for a dark-fantasy 2D card-battler, no text.
The attached images are the STYLE ANCHOR: these belong to the same set as the attached icons, so match their rendering exactly (hand-painted dark-fantasy look, bold clean near-black outlines, rich saturated colours, simple painted shading, a small bright highlight, light from the upper left).

LAYOUT (critical): a wide landscape image, with 4 separate pictures spaced in an even invisible row of 4 across. Nothing touches or overlaps a neighbour or the edge of the image; leave clear magenta all round each one.
THE BACKGROUND MUST STAY CLEAN (critical, the game cuts each picture out by this colour): one plain flat solid magenta (#FF00FF) over the WHOLE sheet, no grid lines, cells, frames or badges, no shadow on the ground, no gradient, no texture. Use no magenta or hot pink inside the pictures. NO TEXT anywhere: no letters, numbers, labels or captions.
READABLE WHEN SMALL (critical): each picture will be shown at only 24 to 48 pixels, so each is ONE bold object, centred and large, with a thick unbroken near-black outline all round its silhouette, big simple shapes and no small details.

THE PICTURES, in this exact order, left to right:
1. Slippery: a fat glossy pale-blue water drop with a bright streak of shine down one side, a little splash at its foot.
2. Veiled: a dark violet lace veil drawn over a pale mask, only two faint glowing eyes showing through.
3. Gravity: a small black sphere with a glowing violet ring around it, three playing cards bending and falling into it.
4. Unmaking: a gold crown cracking in two down the middle, pale light pouring out of the crack, flakes falling away.
```
