# Art brief for Combat v2

The game currently draws **placeholder art in code** (shapes for figures, a picture-of-the-effect for each card). Real art
replaces it piece by piece with no code changes. This page says what to make, in what format, and how to add it.

## What to make (in order of impact)
1. **Figures** (transparent PNG cut-outs): 4 Riftwalkers, 12 companions and about 33 enemies. They are the biggest gap to
   the Slay the Spire look. Feet touch the bottom edge; any size, about 1024 px tall is plenty. Facing the centre of the
   stage is a bonus (heroes face right, enemies face left); the game does not flip them.
2. **Card art windows** (4:3, about 1024x768): about 90 cards. Upgraded cards ("+") reuse the base card's art.
3. **Backdrops** (1920x1080): one per realm plus the neutral Rift. Keep the lower third empty and flat: that is where the
   fighters stand.
4. **Boon and Potion icons** (256 px, transparent): 12 Boons and 10 Potions.

## The list with prompts
`pnpm artlist` writes `docs/art-briefs.md`: every asset above with its id, text and a ready-to-use image prompt. Regenerate it
whenever content changes. Style for all of it: dark-fantasy painterly, bold readable silhouette, rich colour, soft rim
light, no text, no border; each realm has its own palette (see the file).

## How to add finished art
1. Put the files in `apps/web/public/art/` (any sub-folders).
2. List them in `apps/web/public/art/manifest.json`:
   ```json
   {
     "figures": { "hero:knight": "figures/knight.png", "unit:squire": "figures/squire.png" },
     "cards": { "strike": "cards/strike.webp" },
     "backdrops": { "aurelion": "backdrops/aurelion.webp" }
   }
   ```
3. Reload. Anything not listed keeps its generated placeholder, so art can arrive a few pieces at a time.

Figure keys are `hero:<heroId>` and `unit:<unitId>` (a "+" companion uses its base id). Card keys are the card id. Boon/Potion
icons and realm backdrops are listed in the manifest format already; wiring backdrops and icons into the screens is the
next code step once the first files exist (figures and card art work today).

## Rules
- Original IP only: no franchise characters, names, frames or trade dress (CLAUDE.md rule 6).
- Keep a consistent light direction (top-left rim light) and a dark mid-tone so the UI text and bars stay readable.
- Check any generated art for stray text, extra fingers and signatures before it goes in.
