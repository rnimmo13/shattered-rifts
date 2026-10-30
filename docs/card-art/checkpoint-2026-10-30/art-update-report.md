# Shattered Rifts artwork update

- Corrected 126 existing card illustrations for subject or hero-model consistency.
- Added 55 missing illustrations for the current Shaman pool.
- Added Thunderbird and Moon Owl carved totems plus both spirit forms.
- Sources: D:/Code/ShatteredRifts/assets-src/cards/individual/ and D:/Code/ShatteredRifts/assets-src/weapons/individual-totems/.
- Game card exports: D:/Code/ShatteredRifts/apps/web/public/art/cards/, 640 x 480 JPEG.
- The card and totem packers read the individual source folders. Upgrades share their base card's art.
- Generation mode: built-in image_gen. Exact generation prompts are in card-art-prompts.json and individual per-card JSON records. The three earlier refinements have additional refinement descriptions.
- The live Shaman card inventory was refreshed after its roster changed during this task. Completed art for retired cards is retained as source material, but is not counted toward live Shaman coverage.

Validation results are recorded in verification.json. Preview contact sheets are included in the previews folder. Artwork was visually reviewed for subject and character identity; no human approval is implied.

## Paused checkpoint
Generation stopped at the user's request to conserve usage. Remaining: 32 Shaman additions and 34 corrections, listed in remaining-shaman.json and remaining-corrections.json. The completed exports and manifest are installed in the game repository for the user to publish. No deployment was performed.

