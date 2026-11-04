# Shattered Rifts: Lore

The story behind the game, written as the baseline every card, Warden line, event and page should agree with (DECISIONS #587).
It replaces the old "Prime World broke into pieces" premise of `01_GAME_DESIGN.md §1`.

**Player-facing text uses class names** (the Knight, the Rogue, the Shaman...), never the hidden personas in `Riftwalker.persona`
(DECISIONS #372, #519). The persona names below are for us only.

---

## 1. The short version (for the store page, the title screen and the lore page intro)

> There were many worlds, and for an age they never touched. Each was sealed inside the Ward, and each had a Warden to keep it.
> Then the Ward shattered. Rifts tore open between the worlds, and everything that lived in them began to spill across.
> A few can walk the Rifts and live. They are the Riftwalkers, champions of their own worlds, and the shards of the broken Ward
> are the only thing that can seal a world again. There aren't enough shards for everyone.

## 2. The full story

### 2.1 The Worlds Apart
There are many worlds, each with its own laws: in one, light is a weapon and faith is armour; in another, everything that lives
was built; in another, the forest eats. For an age they never touched, and none of them knew the others were there.

### 2.2 The Ward and its Wardens
What kept them apart was **the Ward**, a barrier between worlds, like glass no one could see. Every world had a **Warden**, a
guardian bound to keep its part of the Ward whole. Most of them were not cruel. They were jailers of a wall, and the wall was all
they knew.

### 2.3 The Shattering
Then the Ward broke, everywhere at once. Nobody agrees why. Cracks became **Rifts**, Rifts became doors, and through them came
creatures, machines and magic that had no business being in each other's worlds. Cards that are **Rift-crossed** are exactly
that: power that drifted in from somewhere else.

The Wardens were the first to fall. Something reached through the cracks and took them. They still guard their shards of the
Ward, but they no longer guard them for their worlds. They guard them for **the Heart**.

### 2.4 The Riftwalkers
Most who step into a Rift come out wrong, or don't come out. A rare few can walk the Rifts and live. Each comes from a different
world and walks for it: a knight of a world of light, an engineer of a world of machines, a hunter from a world that eats.
They are the classes the player chooses.

### 2.5 Shards and rivals
A Warden's shard can seal a world again, or at least close the Rifts around it. But the shards are finite and every world is
bleeding, so every Riftwalker who saves their home does it by taking a shard someone else needed. That is why Riftwalkers fight
each other as well as the Wardens, and why no one wins for good.

- **Echoes** are what the Rift keeps of a Riftwalker who walked before you: their deck, their habits, played back by the Rift
  as a ghost. These memories can be fought at the Crossing (Arena); campaign Echo fights and ghost Wardens are paused for now (DECISIONS #592).
- **The Arena** is the Crossing, a place where many Rifts meet. Riftwalkers fight there face to face (PvP).

### 2.6 The Heart of the Rift
At the centre of the broken Ward is **Vorthax, the Heart of the Rift**. It made the Wardens what they are now, which is why it
fights with all of their rules. Every time a Riftwalker seals a Rift, it tears open again, worse than before. That is the climb
through the 20 **Rift Tiers**: deeper, and worse, each time.

**Kept open on purpose (for later):** what Vorthax is, and what broke the Ward. The hint we plant everywhere: *the fighting
feeds it.* Every shard torn from a rival, every Rift sealed, makes the Heart stronger. Don't answer this in the game yet.

## 3. The worlds

| Realm (id) | What it is | Riftwalkers (class) | Its Wardens |
|---|---|---|---|
| **Aurelion** (`aurelion`) | A world of gilded light, cathedrals and oaths. Faith is a weapon here. | Knight, Monk | Seraphine, the Gilded Warden; The Hollow Benediction |
| **Nexus-9** (`nexus`) | A world of machines and foundries, where everything alive was built, and storms are harnessed in totems. | Engineer, Shaman | KR-0N "Kron", Foundry Overseer; Mother of Static |
| **Wyldmaw** (`wyldmaw`) | A world that eats: forests with teeth, packs and hunger. | Hunter | Gorrmaw, the Hunger Below; The Upside-Down Stag |
| **Umbral Veil** (`umbral`) | A world of shadow and masks, half theatre and half trap. Nothing is what it shows. | Trickster, Rogue | Nyxara, the Veiled Matriarch; The Applause Below |
| **The Hollow Crown** (`starfall`) | The ruin of a kingdom built on a fallen star, where spells are forged like blades. | Spellblade | Queen of the Unmade |
| **Gloomfen** (`gloomfen`) | A drowned marsh where the dead don't stay down. | Necromancer | The Mourning Tide |
| **The Midden** (`midden`) | Where the debris of every broken world washes up: the scrapheap of the multiverse. Nothing here is worth guarding, so it has no Warden. | Drunkard | none (DECISIONS: Midden has no Elites or Warden) |
| **The Far Rifts** (`beyond`) | The space between worlds, where the Ward broke worst. No one is from here. | none | Event Horizon Regent |

Where the Rifts are worst, worlds bleed into each other: that is the last stretch of a run (the Rift), and the home of Vorthax.

## 4. Writing rules for anything with lore in it
1. **Riftwalkers are champions, not heroes.** Each is right about their own world and in someone else's way. No pure villains
   among them.
2. **Wardens were guardians first.** Their lines can show what they were before the Heart took them.
3. **Every world has its own laws.** A card's flavour should feel like it comes from one world; a Rift-crossed card should feel
   out of place.
4. **Don't explain the Heart.** Hint that the fighting feeds it; never confirm.
5. **Original names only** (golden rule 6). No franchise terms.
6. **Class names in player text**, personas never (until Robert decides to use them).

## 5. The lore page (`#/lore`)

A scrolling, comic-style page that tells §2 in six chapters, then shows the worlds. Implemented in 0.188.0 (DECISIONS #588),
using all 26 illustrations requested in `docs/lore-prompts.md`. Riftwalkers use their current default models, with canonical
portraits independent of the player's equipped skins. Generated concept art and final prompts are catalogued in
`docs/lore-art-manifest.json` for Robert's review.

**Where it lives:** a route `#/lore`, linked from the home screen and from the Learn page ("The story").

**Layout:**
1. **Title splash:** the key art (`key-art.png`) full width, the §1 short version over its calm side.
2. **Six chapters**, one per §2 section (Worlds Apart, the Ward, the Shattering, the Riftwalkers, Shards and Rivals, the Heart).
   Each chapter is a heading, 2 or 3 comic panels and a short paragraph of story text (2 to 4 sentences) beside or under each
   panel. Panels alternate left and right on desktop and stack on a phone.
3. **The Worlds:** one card per realm from §3 (its vista image, its name, one line, the classes that come from it shown as their
   portraits, which the game already has). The Far Rifts card shows no class.
4. **Close:** a "Walk the Rifts" button into a new run.

**Rules:**
- All words are page text, never painted into the art (so it can be translated and edited).
- Prose keeps a max width (about 65 characters a line); nothing spans the full screen width at 1920.
- Panels fade and slide in as they scroll into view (`04_VISUALS_AND_ANIMATION.md` easing); with reduced motion or the Low
  graphics setting they simply appear.
- Images are lazy-loaded and encoded as WebP like the rest of the art.

## 6. Loading screens

The startup splash now paints from static HTML/CSS before web or desktop initialization. It uses the clean landscape key art,
shows actual settled Riftwalker artwork requests, and leaves as soon as required art and equipped skins are ready. After four
seconds, Continue while artwork loads can enter the game while remaining art arrives. Existing bounded art waits and placeholders
remain available. Native save errors stay on a styled Retry/Quit screen; continuing cannot bypass them. Lore panels load lazily
and are not included in startup preloading. Fight art is still prepared ahead in idle time (DECISIONS #572).

Lore art reuse:
1. **Startup splash** (desktop app and first web load): the key art while assets load.
2. **Rift Tier transitions (planned):** when a new Tier starts, a short card with a lore panel and one line ("Tier IV. The Rift
   tears open again."). No extra combat or tier loading delays were added in this release.
3. **Steam (future crops):** the key art is the source for the library hero, store capsules and store page header (`12_STEAM_READINESS.md`).

That's why the key art is asked for wide and with a calm area for text (see `lore-prompts.md`).
