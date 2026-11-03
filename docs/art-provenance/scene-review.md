# Scene art generation review

Generated November 2, 2026 from docs/scene-prompts.md with the built-in image_gen tool. Exact model/version is not exposed.

All 147 requested images were generated in the prescribed priority order: 24 Warden arena images, floors-3 and floors-4, the Crossing pair, 97 event scenes (Merchant and Shrine first), five missing existing-arena images, eight new arena pairs, and floors-2. Total: 97 events, 23 backdrops, 24 prop sheets, three floor sheets.

The brief's assets-src/heroes/maren.png is absent. The original Valeria anchor at assets-src/heroes/_source/Sunlit Paladin with Shield and Sword.png was viewed and supplied to every generation. Every call included its complete set starter and individual subject prompt. No franchise or artist references were added.

Final PNG dimensions: events 1536 x 1024; backdrops 3072 x 1024; props 2048 x 2048; floors 2048 x 1024. The generator returned events at the requested dimensions, backdrops at 2172 x 724, props at 1254 x 1254, and floors at 1774 x 887. Nonmatching images were resampled with bicubic interpolation, without cropping; this does not add native detail. Native originals remain at the source paths recorded in the manifest. Final file hashes and native/final dimensions are in scene-checks.json.

Each generated image was visually inspected for its subject, composition, obvious text/borders, and grid order where applicable. Event focal subjects sit to the left with darker quieter space to the right and at the bottom. Arena images leave a clear dark foreground. Prop sheets show nine separate objects. Floor sheets show eight materials in a 4 x 2 grid.

Integration limitations:
- Background colours are approximate and vary slightly, despite the flat-colour prompt. Prop sheets are opaque and require tolerant navy background removal, especially around haze and glows; the backdrops' bottom areas are dark gradients rather than exact uniform #2a2030.
- Floor tiles have not been cut or tested for seamless repetition. Generated edge patterns may require targeted regeneration or integration treatment. Seamlessness is not certified.
- Decorative sun insignia and blue/gold details from the anchor recur in several scenes. Literal details may vary: some hanging props have a margin above their suspension point, and the two cache strongboxes differ in ornamentation. Gorrmaw's backdrop was regenerated to remove unwanted bird silhouettes; the selected second attempt uses loose fallen feathers.
- The Crossing is visually balanced with paired gates and a centred vortex, but is not a pixel-perfect mirrored image.

Prompts, anchor, source paths and filenames are preserved in scene-manifest.json. No images are marked human-approved. No game code, cutter configuration, runtime wiring, commits or deployment were changed. Source images are ready for Robert's review and the documented cutting/integration pass.
