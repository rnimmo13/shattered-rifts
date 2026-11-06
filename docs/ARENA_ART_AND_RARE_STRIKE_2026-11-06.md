# Arena composition and Rare Breaching Strike — local 0.213.0 / rules 89

Robert requested richer arenas, restored glowing cracks, continuous scenery instead of black sides, and one of the newly added Common Strikes promoted to Rare. He then supplied two battle-screen composition references and approved the new Aurelion painting: “Yes, use this direction.” He also approved adding this revision's entries to the shared version and patch-note files while preserving Claude's separate updater work. Implementation approval does not authorize a push or deployment.

## Arena art

All 33 venue IDs receive a dedicated `battlefield-v2.jpg`, including secondary sites, twelve Warden arenas, the four newer realms and the Crossing. Complete paintings join the floor and architecture with consistent perspective, light, materials and physically integrated scenery. Each contains a glowing fissure. The legacy cutout kit is not loaded on this path. The named arena themes and encounter-to-venue mapping remain intact; the First Ruin gets its own devastated throne and immense violet wound in reality.

The painting covers the viewport with preserved aspect ratio and its ground line anchored behind the fighters. The background does not move under stationary feet. Portrait crops retain continuous ground; ultrawide views have no side void. Gentler vignette shading preserves visible edges. Existing figure placement, full-silhouette separation, pointer targets, direct HP-plate selection and reduced-motion controls are unchanged. No combat mechanic changes arise from the art.

The built-in image-generation tool created the paintings; full prompts and source provenance are in `art-prompts/0.213-arenas.json`. Raw PNGs are retained under `assets-src/arenas/0.213/`; JPEG encoding changes format only. Original arena files remain available as missing-art fallback. The supplied reference screenshots are composition references, not shipped game art.

## Exact card revision — Campaign and Arena

| Breaching Strike | Before | After |
|---|---|---|
| Rarity | Common | Rare |
| Mana, base / upgraded | 1 / 1 | 2 / 2 |
| Damage, base / upgraded | 7 / 10 | 18 / 24 |
| Exposed, base / upgraded | 1 / 1 | 2 / 2 |

It remains a single-target Attack with damage first, Exposed second. Its own new Exposed does not amplify that initial hit. Existing Exposed stacking and duration rules apply. Raised Hell still costs 2 Mana and auto-plays drawn Strikes against random eligible enemies without paying their Mana; it gets a larger Breaching hit but no new trigger or draw loop. Mastered Strike still counts each Breaching copy as one Strike. Shield Strike remains Common (1 Mana, 5 damage/5 Barrier; upgraded 8/6), and Muster Strike remains Uncommon (1 Mana, 8 damage/1 Reserves; upgraded 11/1).

Existing card IDs and acquired copies remain valid and resolve the current definitions, including rarity and cost. Existing generated offers are not rerolled. Future reward selection uses the new Rare classification. Rules 89 invokes the established older-battle checkpoint migration without spending Resolve; earned run progress is retained. Class starters, enemy stats, rewards and Arena HP are unchanged.

## Assessment and evidence

The two available retained client Campaign positions, `mvvj1kc7-6049` (Rogue) and `mw2hdh90-7d18` (Golemancer), were inspected and copied to `.wrangler/testing-0.213-2026-11-06/real-campaign/`. Neither contains Breaching Strike. These historical positions cannot establish how the new card performs or why a player chose a reward. No relevant real-player Arena exports or current Knight observations were available. No simulations were run.

By the existing card-costing heuristic, 18 damage + 2 Exposed is 24 points, close to the 2-Mana Rare target of 19 × 1.25 = 23.75. The upgraded 24 + 6 = 30 points adds a conventional damage upgrade. The important tradeoff is one stronger card versus the extra manual Mana and different acquisition availability. Under Raised Hell the extra manual Mana is bypassed, but the Aura and subsequent draws still require setup. The card adds no Barrier, healing, draw, refund or permanent growth. “Rare” alone is not a benefit and does not prove players will pick it.

The append-only `balance-history/0.213.0` assessment covers all thirty Ascendancies, ten class starts, free mixing, Campaign I–III/IV–VII/VIII–X/XI–XII, opening and extended fights, recovery, setup, Rare dependence and 11+ own turns. No measured grades change; Arena parity, ten-plus-turn pacing and the optimized Drago clear target remain unverified targets.

## Validation

- Full working-tree suite: 195 test files, 4,002 tests passed. Includes manual Breaching Strike Mana requirements, base/upgraded effects and unchanged free Raised Hell auto-play. No simulations were run.
- Web, content, PvP and desktop TypeScript checks; changed-source ESLint; `git diff --check` passed. Production web and desktop renderer builds and desktop shell compilation/configuration passed. Both renderer manifests report 0.213.0. Vite retains its existing large-chunk warning.
- All 33 production JPEGs decoded successfully in Chromium, with dimensions of at least 1500 × 800; total added JPEG size 13,570,705 bytes. Raw PNGs and complete prompts/provenance were retained.
- Local isolated Chromium/Electron checks covered 1366×768, 390×844, 2560×1080 and 844×390, plus the final build at 320×740. Three-enemy formations retained positive horizontal silhouette gaps; no horizontal page overflow or JavaScript console errors. Final Aurelion and Drago screenshots were visually inspected, and HP/name plates had unobstructed click centers. Drago and its ward use different ranks; the three-enemy horizontal-only spacing assertion does not describe that boss formation.
- Evidence: `.wrangler/213-tests.log`, `.wrangler/213-web-build.log`, `.wrangler/213-desktop-build.log`, `.wrangler/qa213/results.json`, `final-results.json`, `asset-decode.json` and `battle-*.png`. These isolated fixtures are implementation checks, not real-player matches or balance measurements.
- Claude's separate updater changes and 0.212 notes remain in the working tree and were preserved. No commit, push, deployment or release packaging was performed for this revision.

## Release authorization

After the local review above, Robert explicitly approved pushing and deploying the complete candidate, including the preserved updater fixes, on 2026-11-06 (decision 659). Earlier local-only labels describe the state before that approval.
