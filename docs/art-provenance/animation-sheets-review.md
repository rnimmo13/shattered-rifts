# Animation and effect sheets: generation review

Generated 2026-11-01 with the built-in image_gen tool from docs/animation-prompts.md. Exact tool model/version is not exposed. Valeria and icons-01.png were used as style references for every sheet. fx-debuffs.png was generated and inspected first as requested.

## Deliverables

15 original PNG sheets at 1536 by 1024 pixels, saved under assets-src/fx/ with the requested filenames. Nine effect sheets each contain four six-frame rows (36 effects, 216 frames). Six still sheets each contain 12 pictures (72 stills). Total: 288 frame/still positions.

animation-sheets-manifest.json records the prompts, reference paths, grid dimensions, and selected generation files. animation-sheets-checks.json records image dimensions, corner colours, and SHA-256 hashes. animation-sheets-preview.png is an overview for review. Reduced-size diagnostic copies were made at 180 pixels per effect cell and 48 pixels per still cell and are available in the chat outputs.

## Visual checks and limits

- All sheets were visually inspected for row/column count, subject order, style, and obvious stray text. Effect rows generally progress from a small start through a stronger middle to dispersed remnants. The contact sheet and selected size-check images were inspected for readability.
- fx-hits.png and fx-units.png were regenerated with additional spacing and endpoint instructions; selected second attempts are recorded in the manifest. Discarded first attempts were not copied into the project.
- These are generated source sheets, not validated runtime animation atlases. They have not been cut, chroma-keyed, or played in the game. Precise anchor alignment and temporal smoothness still require extraction/playback QA. Do not independently tight-crop each frame and assume its pivot remains stable.
- Backgrounds are near magenta rather than exact uniform #FF00FF. Use tolerant colour keying and inspect antialiased edges, smoke, fading violet shapes, glass, and other partially transparent-looking regions. The PNGs have opaque backgrounds; painted fades are not real alpha.
- Some effects leave visible material in the last frame. Plating ends as assembled plates; Barrier Hit retains the shield. Add an appropriate fade/hold during integration or request targeted replacement frames if needed.
- Generated details vary from literal prompt wording: the intent shield has a sun decoration, Consumed cards have a decorated back, and the Ascend banner has a purple cloth centre rather than an open transparent hole. The banner remains blank for code-rendered text.
- No images are marked human-approved by this generation pass. Robert can review the saved sheets under the project's existing art approval rule.

No game code, cutter, or animation wiring was changed. The motion and integration work remains as described in animation-prompts.md.
