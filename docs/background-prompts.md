# Menu background prompts: the home page, the Store, the Collection, the Arena and the record pages

Backgrounds for the pages that are not fights. Robert generates them in ChatGPT; Claude cuts and wires them (written 2026-11-11, DECISIONS #745). Nothing here is built yet: every page keeps the look it has now until its picture exists.

## What I recommend, and why

**Yes, a few. Not one per page.** Every menu today is the same dark blue gradient, so the Store, the Collection, Saved decks and the leaderboards all feel like one screen with different text. Premium games on Steam and phones give each *place* a picture and keep the *lists* quiet: the hub, the shop, the PvP lobby and "your stuff" each have a look you recognise before you read a word. Seven pictures cover the whole game:

| # | Picture | Pages that use it | Priority |
|---|---|---|---|
| 1 | The Sanctum | Home | First |
| 2 | The Rift Market | Store | First (tells the Store apart from the Collection) |
| 3 | The Vault | Collection, Earned | First (same reason) |
| 4 | The Crossing Gate | Arena lobby, Arena rules, Ghost decks | Second |
| 5 | The Archive | Saved decks, Card library, Run history | Second |
| 6 | The Hall of Champions | Leaderboards, Trophy case | Third |
| 7 | The Chronicle | How to play, Patch notes, Credits | Third (optional) |

**The home page: a place, not a poster.** The most modern look for this kind of game is a dim, deep room with the picked Riftwalker standing in it, not a busy key-art splash behind the menu. Slay the Spire 2, Marvel Snap, Hearthstone and Balatro all keep the hub calm and let one living thing (the hero, a card, a light) carry it. So the Sanctum picture is an empty stage: a quiet hall with the rift glowing far off, darkest where the menu and the hero's text sit. The Riftwalker's animated model, a slow drift of motes and a little parallax on mouse move do the rest, and those I can build once the picture is in. I would not put the loading screen's key art behind the home page: it is beautiful, but it is bright and detailed exactly where the buttons are.

**Rules every picture follows** (they are in the starter, so ChatGPT is told once):
- **Dark and quiet.** Text and cards sit on top, so the picture is a backdrop: low contrast, mostly in shadow, detail and light kept to the places named in each prompt.
- **No people, no creatures, no text.** The game puts its own Riftwalkers and words on top.
- **Wide, with the middle safe.** 16:9 for desktop. A phone held upright shows only the middle third, so nothing important is at the far left or right.
- **One colour each**, matching the page: gold and violet for the Store, teal and deep green for the Collection (the colours those pages now use in the game, DECISIONS #744), ember red for the Arena, and so on.

## How to run it

- **Style anchor:** attach `assets-src/lore/ch1-worlds.png` (a lore painting: the painted look, the palette and the level of detail to match) to the first message. These are painted places, like the lore pages, not cartoon cut-outs like the fight arenas.
- **One ChatGPT chat for all seven.** Paste the **starter** once with the anchor, then send each picture's prompt as its own message, one image per message. If the style drifts, start a new chat and paste the starter again.
- **Size:** ask for the widest landscape size offered (1536 x 1024 is fine; I upscale and crop to 16:9).
- **Save as PNG** in `assets-src/backgrounds/` (create it) with the exact name given.
- If one comes out too bright or too busy, reply "same again, darker and calmer, with less detail in the middle". That is the most common fix.

## Starter (paste once, with the anchor attached)

```
You are painting BACKGROUND PLATES for the menu screens of a dark-fantasy card-battler game called Shattered Rifts. The world: many separate worlds were sealed apart by an invisible barrier called the Ward. The Ward shattered, violet rifts tore open between the worlds, and champions called Riftwalkers cross between them.

The attached painting is the STYLE ANCHOR: match its painterly fantasy concept-art look, its brushwork, its deep blue-violet shadows and its gold and violet light. Do not copy its scene.

These are BACKDROPS that game menus, buttons and cards are drawn on top of. Every image must follow these rules:
- Landscape, the widest size you offer. An interior or a place seen straight on, at eye level, with real depth.
- DARK AND QUIET: about 70% of the picture in deep shadow, low contrast, soft focus toward the edges. Light only where I say. Nothing bright or detailed behind the middle of the picture unless I say so.
- NO people, NO creatures, NO characters, NO statues of people in the foreground, NO text, NO letters, NO numbers, NO symbols that look like writing, NO logos, NO UI, NO frame, NO border, NO watermark.
- Keep anything that matters in the middle 60% of the width: the far left and right may be cropped away on narrow screens.
- A gentle vignette: the corners fall to near black.
- Painted, not photographed, not 3D rendered, not cartoon line art.

I will send one prompt per image. Reply with the image only.
```

## 1. The Sanctum (`sanctum.png`): the home page

```
THE SANCTUM. The Riftwalkers' refuge: a vast, quiet stone hall between worlds, seen from just inside its entrance.

LAYOUT (critical): the LEFT 40% of the picture is the darkest part, almost plain, a wall of old stone falling into shadow, because the game's menu is drawn there. The RIGHT 60% opens into the hall: a broad, empty circular dais of pale stone in the middle distance where a hero will be drawn standing (leave it EMPTY, softly lit from above, like a stage waiting for someone). Behind the dais, far off through a tall broken archway, a single violet rift glows in a night sky, its light catching drifting dust.

DETAILS: tall columns fading up into darkness, a few low braziers with small warm gold flames along the right wall, fragments of golden Ward crystal floating very faintly high up, a floor of worn flagstones with a thin inlaid gold ring around the dais.
LIGHT: cool blue-violet shadow overall; one soft pool of warm light on the dais; the distant rift as a small cold accent.
PALETTE: deep navy, indigo, violet, a little warm gold.
MOOD: calm before setting out. Vast, still, safe.
```

## 2. The Rift Market (`market.png`): the Store

```
THE RIFT MARKET. A travelling merchant's stall set up in a ruined gatehouse between worlds: a place to buy fine things.

LAYOUT (critical): seen straight on. The stall's goods frame the LEFT and RIGHT edges and the TOP of the picture; the MIDDLE and LOWER MIDDLE is a dark, plain, softly lit backcloth of deep violet velvet, because a grid of items is drawn there.

DETAILS at the edges: hanging lanterns of amber glass, rolled banners and bolts of rich cloth, ornate empty armour stands and empty cloak hooks (NO armour shaped like a person standing), small chests with gold fittings, hanging blank card-shaped frames, strings of small glowing rift crystals, a brass scale. Everything a little too fine for the ruin it sits in.
LIGHT: warm gold lantern light from the top corners, falling off quickly; violet shadow below.
PALETTE: gold, amber, deep violet, plum. Warm and inviting.
MOOD: a rich, friendly shop at night. Things to want.
```

## 3. The Vault (`vault.png`): the Collection and the Earned page

```
THE VAULT. The player's own treasure room: a quiet, private strongroom cut into rock, where what they own is kept. It must feel clearly different from a shop: cool, ordered, personal, nothing for sale.

LAYOUT (critical): seen straight on. Stone alcoves and shelves frame the LEFT and RIGHT edges; the MIDDLE and LOWER MIDDLE is a dark, plain wall of smooth teal-green stone in soft shadow, because a grid of items is drawn there. At the very top, the curve of a heavy round vault door standing open.

DETAILS at the edges: neat alcoves lit from within by pale teal light, empty display stands and empty velvet cushions waiting for things, a few sealed chests, folded cloaks on shelves, a rack of blank card-shaped plaques, a single trophy cup. Orderly and cared for.
LIGHT: cool teal glow from inside the alcoves; one thin shaft of pale light from the open door above; no warm lantern light at all.
PALETTE: deep green, teal, sea-glass, a touch of pale gold on metal. Cool and calm.
MOOD: yours. Safe, still, proud.
```

## 4. The Crossing Gate (`crossing-gate.png`): the Arena lobby

```
THE CROSSING GATE. The entrance to the Arena: the tunnel under a great stone colosseum built around a rift, seen from inside the tunnel looking out toward the arena floor.

LAYOUT (critical): the tunnel walls and a raised iron portcullis frame the LEFT, RIGHT and TOP in near-black. Through the opening in the MIDDLE, small and far off: the sand of the arena floor and, across it, a second gate exactly like this one, with a violet rift burning in the sky between the tiers above it. The LOWER THIRD is dark tunnel floor, plain, because buttons are drawn there.

DETAILS: two iron torch brackets with ember-red flames on the tunnel walls, chains, worn stone steps, banners hanging limp in two opposing colours (one deep red, one deep blue) on either side of the opening, dust in the light. The tiers of the colosseum are EMPTY and far away (no crowd).
LIGHT: ember red and orange from the torches at the edges; cold violet from the rift in the far middle.
PALETTE: near-black, ember red, rust, with violet as the far accent.
MOOD: the walk out before a duel. Tense, heavy, exciting.
```

## 5. The Archive (`archive.png`): Saved decks, the Card library, Run history

```
THE ARCHIVE. A scribe's hall where decks and records are kept: tall shelves of ledgers and card cases in a vaulted stone library.

LAYOUT (critical): seen straight on down the length of the hall. Shelves rise on the LEFT and RIGHT edges into darkness; the MIDDLE is the long dim aisle between them, fading into deep blue shadow, almost plain, because lists and cards are drawn there.

DETAILS at the edges: rows of leather card cases with brass corners, bound ledgers, rolled maps, a rolling ladder, a reading desk at the far left with a single shaded lamp, loose blank cards drifting very faintly in the air as if the room remembers them. Far at the end of the aisle, a tall narrow window with pale moonlight.
LIGHT: one small warm lamp at the far left; cold moonlight at the far end; the rest in blue shadow.
PALETTE: deep blue, slate, parchment, old brass.
MOOD: studious and quiet. A place to think about a deck.
```

## 6. The Hall of Champions (`champions.png`): Leaderboards and the Trophy case

```
THE HALL OF CHAMPIONS. A long ceremonial hall where the best are remembered: banners, empty plinths and a great wall of blank golden plaques.

LAYOUT (critical): seen straight on. Tall banners hang down the LEFT and RIGHT edges; the MIDDLE is a broad dark wall of polished stone set with rows of small BLANK plaques that fade into shadow, almost plain, because a table of names is drawn there.

DETAILS: long banners in deep red and gold with NO emblems or writing on them, a row of empty stone plinths along the bottom edge at the far left and far right (EMPTY: no statues, no figures), trophy cups and laurel wreaths on two of them, braziers burning low, a high vaulted ceiling lost in darkness with a few shards of golden Ward crystal glinting.
LIGHT: warm gold from the braziers at the edges, catching the rims of the plaques; deep shadow in the middle.
PALETTE: black stone, deep crimson, antique gold.
MOOD: honour and ambition. Your name could be here.
```

## 7. The Chronicle (`chronicle.png`): How to play, Patch notes, Credits (optional)

```
THE CHRONICLE. A chronicler's desk in a small tower room, where the story of the Rifts is being written down.

LAYOUT (critical): seen straight on. The MIDDLE of the picture is a large, plain, dark sheet of old parchment lying on the desk and filling most of the frame, softly lit and EMPTY (no writing, no marks), because pages of text are drawn there. The desk's clutter sits around its edges.

DETAILS at the edges: a brass candlestick with a low flame at the top left, an inkwell and quills, a magnifying lens, a few loose blank cards, a small shard of golden Ward crystal used as a paperweight, the corner of a round window at the top right showing a violet rift far away in the night.
LIGHT: warm candlelight from the top left falling across the parchment and fading to the right.
PALETTE: warm brown, parchment, candle gold, with one violet accent in the window.
MOOD: quiet study late at night.
```

## What I do with them

- Each is cut to 3840 x 2160 and 1920 x 1080 WebP, plus a tall crop of the middle for phones, in `apps/web/public/art/backgrounds/`.
- A page fades its picture in behind a dark wash, so text contrast is the same as today whatever the painting looks like. A page whose picture is missing looks as it does now.
- The home page gets the Sanctum behind the Riftwalker, with slow motes and a little parallax (off under reduced motion and low graphics).
- A later pass could tint the Sanctum by the picked Riftwalker's realm (eleven variants) if the single one feels too plain. I would wait and see it in the game first.
