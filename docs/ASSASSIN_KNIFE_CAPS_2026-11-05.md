# Assassin knife limits — 2026-11-05

Local0.208.0/rules85, implementation approved by Robert; no push/deployment approval. Applies to Campaign and Arena, including existing deck copies. This joins the local Reserves/provenance correction; the earlier assessment is preserved.

## Exact changes

Recall the Blades, base/upgraded: all eligible consumed Daggers → up to15 per cast, taken in existing consumed-pile order after filtering. Base retains normal cards; upgraded still upgrades selected Daggers before replay. Both retain2Mana, target/Fanned behavior, return to consumed pile and repeat-cast eligibility. Unselected cards remain unchanged. Preview uses the same selected15 cards.

Shadow Echo, base/upgraded: unlimited Barrier from its1-Barrier-per-card trigger → maximum15 actual Barrier per Aura instance per global turn. Upgraded retains Opening hand, both cost1Mana. Automatic plays count. Each copy is independent; two can grant30. Count actual Barrier after Bracing, Meld, Warded Heart and Brittle/Stunned rounding, clamp the final grant to the remaining allowance. Zero grants consume no budget; losing Barrier does not refill it. Budget persists through JSON restoration and resets on the next qualifying trigger in a new turn, including off-turn play. Other Barrier sources remain independent. Auras created during a turn start with their own allowance.

## Real-player evidence and limits

One client-observed completed Assassin Campaign record, version0.206.0, TierXII, won=true, final enemy IDs rift-ward/vorthax; raw filtered history and analysis retained privately in .wrangler/testing-0.208-2026-11-05/real-campaign/. Exact original source aaab200 was archived privately for replay. All70 saved actions accepted under historical rules84 (unordered choice arrays compared as sets); result winnera,704/704HP after4ownturns. This is one retained final-fight trace and save position, not70matches, a complete run/reward history or an Arena result. Robert reports no difficulty through this build’s Campaign; that is player context, separate from the retained final trace.

Deck29cards:5Inked Blades+,2Shadow Echo+,2Sanctified Ghost Knives+,Sanctified Whetted Edge+,2Final Flourish+,Recall the Blades+,3Rush of Blood+,2Rift Surge+,2Shuffle Up+,Wide Arc+,Blood Scent+,Forebear’s Gift+,Into the Shadows+,Knife Juggle+,2Knife in the Back+ (one Sanctified),Sanctified Killing Stroke+,Wound.14Boons including Glutton’s Heart, Aegis of Ages and Rift Satchel. Boss replay turn4:46plays including automatic replays,1327outgoing damage across enemies. Recall alone28Daggers,796damage and56Barrier. Final Flourish142damage. Aegis plus Ward Elixir supplied3Shielded that blocked Valerion’s triple attack. Do not attribute fullHP solely to Echo.

Inferred mechanism: one knife generation/spend sequence yields damage, Faltering, Aura Barrier, attack-count scaling and a reusable consumed-pile finisher. The change bounds per-cast replay and per-copy defensive throughput while preserving generation/setup rewards.15 is an authorized acceptance limit, not measured parity. No new-rules counterfactual win-rate or difficulty claim, and no balance simulations were run. Retained replay diagnostics used the original rules only.

## Assessment and migration

Arena first: no human Arena matches for this recipe available; no class/Ascendancy regrade. All30 Ascendancies,10starts and mixed-build rows carried in the appended assessment with conditional notes. Watch Assassin, Bladedancer and Bloodletter recipe effects; other classes can acquire mixed pieces. Campaign I–III acquisition/starts are unchanged; later IV–VII/VIII–X/XI–XII impact depends on finding cards/copies. Opening reliability and rare reliance unchanged, late replay/Barrier ceilings lower. Beyond10ownturns: Recall cannot grow past15percast, but additional casts/Edge/damage multipliers still grow; Echo caps generation, while retention/other defense matter separately. No verified50% boss clear rate or10+turn pacing claim.

Rules85 already covers this unpublished0.208 candidate. Existing cards/decks remain; older incompatible unfinished battles restart at their saved checkpoint through the existing migration, preserving run progress. Older rules84 replays require original rules.

## Validation

Final full suite:3,916tests across188files passed, including11dedicated cap scenarios and the complete card-text suite. All workspace typechecks pass. Whole-repo lint passes with only two pre-existing React-refresh warnings (PileArt.tsx/MapInk.tsx); final changed-source lint passes. Web production and desktop-shell builds pass. Generated card list matches both limits; git diff --check clean. No simulations or publication.
