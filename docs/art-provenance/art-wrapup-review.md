# Art wrap-up review

All 10 requested source PNGs generated: one Warden helper sheet, one four-status icon sheet, five elite event scenes, and three card sheets (nine card pictures).

The three initial card drafts were replaced to match the actual hero portraits: Engineer's brown curls and respirator, Spellblade's obsidian skin and white hair, Drunkard's bald scalp and patched green coat. Valeria remains the rendering-style anchor. Prompts, references, rejected draft paths, generation attempts, dimensions and checksums are recorded in wrapup-manifest.json.

Pending human approval. No cutters, runtime changes or approval flags were applied.

Integration notes:

- Card sheets use the requested 2400x1800 canvas, with art across the top and unused navy space below. Spellblade has two painted cells; Drunkard has four. Confirm explicit cell rectangles before packing: the cutter's auto-detection expects three occupied columns per row and may fall back to an unsuitable equal-canvas grid for incomplete rows.
- Navy backgrounds contain slight generated tonal variation; confirm keyed edges during cutting. Icons retain magenta for the established icon workflow.
- Event scene subject, layout and atmosphere were visually checked. Fine decorative counts, such as the pegboard's fifteen prizes, remain approximate generated detail.
- Sources with different native dimensions were resized with bicubic interpolation to the requested sheet size, without cropping. Icons have no mandated canvas size and retain native dimensions.

Next integration steps are documented in docs/art-wrapup-prompts.md: pack arenas, icons, cards and scenes, connect the five elite scene IDs, and regenerate the missing-card report.
