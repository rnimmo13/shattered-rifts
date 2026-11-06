# Recall redesign and recurring Barrier comparison — 2026-11-05

Local0.209.0/rules86. Robert authorizes implementing the proposed Recall revision. Shadow Echo remains unchanged pending comparison; no push/deployment approval.

## Exact Recall change

Campaign and Arena, base/upgraded:2→3Mana;15Daggers/cast→all eligible consumed Daggers; after use Discard→Consume. Base retains original Dagger versions; upgraded still upgrades before replay. Pile order, targeting/Fanned and return-to-consumed behavior retained. Other copies can recall the same Daggers; suitable recovery effects can still retrieve Recall. Consume removes normal discard/reshuffle recycling, not an absolute once-per-fight rule. Existing deck copies inherit the revision. Rules86 restarts incompatible unfinished fights at their saved checkpoint through existing migration; decks/upgrades/progress retained.

Intent: preserve both knife-count and per-knife scaling while charging more immediate Mana and reducing ordinary repeat access. The higher cost is a nerf at small piles, uncapping a buff above15, Consume a repeatability nerf. No overall measured grade assigned. Shadow Echo remains15actualBarrier/copy/globalturn, both versions,1Mana, upgraded Opening hand.

## Available evidence

One retained client-observed Assassin Campaign completion/final-fight trace from0.206.0, privately archived under .wrangler/testing-0.208-2026-11-05/real-campaign/. Original-rules replay on sourceaaab200 confirms turn4 Final Flourish142damage at3Mana before play, then Recall796damage at2Mana before play,28automatic Daggers. This is a retained position/trace, not complete run/reward history, a new-rules result or an independent Arena match. Robert reports an effortless Campaign run; distinguish that context from retained trace observations. Existing local testing exports contain no matching real-player Arena recipe/outcome evidence. No simulations or counterfactual new-rules fight outcomes. At3Mana the recorded two-finisher sequence needs a resource or sequencing change; do not infer loss or extra turns automatically.

## Static Barrier comparison

Numbers below are exact rule arithmetic for TWO base/upgraded copies before Bracing, Hearts, Meld, Brittle/Stunned or other modifiers. Setup Mana is the total cost of playing both. They describe eligible activations, not observed turns, budgets or measured parity.

| Aura | Setup Mana | Condition/example | Two base copies | Two upgraded copies |
|---|---:|---|---:|---:|
| Shadow Echo |2|10cards played|20|20|
| Shadow Echo |2|15+cards played|30maximum|30maximum|
| Patient Wall |4|3Reserves at end turn|24|30|
| Patient Wall |4|5Reserves at end turn|40|50|
| Breath Between Blows |2|5Skills played|20|30|
| Breath Between Blows |2|10Skills played|40|60|
| Frostbound |2|3qualifying hostile debuff applications|18|24|
| Frostbound |2|6qualifying hostile debuff applications|36|48|
| Hardened Scars |2|4qualifying self-HP-loss events|24|32|
| Obsidian Aegis |2|20Spell Power held at end turn|20|26|
| Countermeasure Grid |2|3qualifying attacked triggers|30plus30retaliation damage|30plus48retaliation damage|

Patient Wall:4R/5R percopy; Mana banking precedes trigger, actual current Reserves read per Aura. Default Knight Max Reserves3;5requires capacity support or retained temporary excess. Additional capacity and holding Reserves have acquisition/Mana opportunity costs. Barrier arrives at end turn. Wall can provide sustained defense while spending regular turn Mana, so do not pretend banking costs the full held amount again every turn. Echo triggers on any played card, including free/automatic plays, arrives immediately and upgraded Opening hand improves setup reliability. Echo1Mana versus Wall2Mana percopy matters.

Breath Between Blows2/3Barrier perSkill percopy trades narrower trigger eligibility for higher output; each knife Attack does not qualify. Frostbound3/4perhostile-debuff application percopy requires actual eligible debuffs; multi-enemy applications need distinct observations. Hardened Scars3/4peractual self-HP-loss event percopy pays health and is not free mitigation. Aegis holds a different resource, half Spell Power plus0/3percopy. Broad comparisons must consider trigger frequency, resource spending/holding, setup certainty, timing, retention, extra effects and matchup pressure. Existing high-output cards are comparison points, not proof they are healthy.

Assessment: two upgraded Walls at normal3Reserves provide30Barrier, numerically matching two capped Echoes. This supports30as a provisional reference for two Echoes, not a universal ceiling. Two Walls cost4Mana versus2, and larger stored-Reserve engines can reasonably exceed30after investment. The uncapped Skill/debuff Auras can exceed that too and need separate scrutiny. Keep Echo unchanged during this authorized Recall-only revision; no permanent15/copy PvP balance conclusion established. Beyond10ownturns compare cumulative defense, retained Barrier, damage sacrificed and actual wins; do not impose equal rawBarrier/DPS across classes.

Retained desktop Campaign history was checked again for Patient Wall/Echo/Breath/Frostbound positions: only the already archived Assassin win with two Shadow Echo+ copies matched. No direct Patient Wall-versus-Echo outcome comparison is available from those retained histories. Countermeasure Grid also demonstrates that Barrier totals alone omit retaliation value; its attacked-trigger opportunities depend on the opposing sequence.

## Validation

Final full suite3,918tests/188files passed. All workspace typechecks and web/desktop-shell builds pass. Whole-repo lint0errors, two pre-existing React-refresh warnings in PileArt.tsx/MapInk.tsx. Dedicated regressions verify cost3, Consume, unbounded28knife replay/preview, base/upgraded knife effects, Fanned, another Recall copy using retained Daggers and unchanged Echo budget. Generated card list and exact patch notes match implementation. git diff --check clean. No simulations, commit, push or deployment.
