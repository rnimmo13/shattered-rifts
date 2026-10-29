# Assassin before the balance pass of 2026-10-29 (frozen; commit 780256c)

Reward-eligible Assassin cards: **51** (rewardPool, the class's own cards; basics and tokens excluded). All cards: 55.

Trait: **Knife Work**: Start every fight with 1 Preparation and a knife in every enemy. The first time each turn you embed a knife, gain 1 Preparation. Whenever you pull a knife, deal 3 damage to that enemy.

Starter: strike, strike, strike, strike, defend, defend, defend, quiet-incision, draw-steel, finishing-thrust, patient-footwork

## Rules as they stood

- Preparation (prep) caps at 3 (PREP_MAX), persists between turns; ordinary attacks never spend it; spendPrep(n) spends up to n, read with per('prepSpent').
- Knives cap at 3 per enemy (KNIFE_MAX), do nothing while embedded; embed only into a living enemy whose hit landed; pull(n, each) removes what is there, each knife runs its ops and Knife Work deals 3 to that enemy; the dead keep theirs.
- Trait Knife Work: 1 Preparation and a knife in every enemy at the start; the first embed each turn gives 1 Preparation; 3 damage per knife pulled.
- 3 Auras before the expansion: Eyes in the Dark, Whetted Edge, Hidden in Plain Sight.

## Cards

| Id | Name | Rarity | Cost | Text | Upgrade |
|---|---|---|---|---|---|
| `backspring` | Backspring | common | 1 | Gain 3 Barrier. Draw 2 cards. | Gain 6 Barrier. Draw 2 cards. |
| `barbed-stab` | Barbed Stab | common | 1 | Deal 6 damage. Apply 3 Bleed. | Deal 8 damage. Apply 4 Bleed. |
| `blade-flurry` | Blade Flurry | common | 1 | Deal 5 damage to ALL enemies. Embed a knife in each enemy. | Deal 7 damage to ALL enemies. Embed a knife in each enemy. |
| `bladestorm-ward` | Bladestorm Ward | rare | 2 | Gain 15 Barrier. Embed a knife in each enemy. | Gain 19 Barrier. Embed a knife in each enemy. |
| `cartwheel-cut` | Cartwheel Cut | common | 1 | Deal 7 damage to ALL enemies. | Deal 9 damage to ALL enemies. |
| `cut-and-run` | Cut and Run | uncommon | 1 | Deal 8 damage. Pull a knife from the target: for each, draw 1 card and gain 1 Preparation. | Deal 11 damage. Pull a knife from the target: for each, draw 1 card and gain 1 Preparation. |
| `darting-strike` | Darting Strike | uncommon | 2 | Gain 10 Barrier. Deal 10 damage. | Gain 13 Barrier. Deal 13 damage. |
| `dirty-hit` | Dirty Hit | common | 1 | Deal 8 damage. Apply 1 Faltering. | Deal 10 damage. Apply 2 Faltering. |
| `disarm` | Disarm | uncommon | 1 | Pull up to 3 knives from the target: for each, apply 1 Faltering to that enemy and gain 4 Barrier. | Pull up to 3 knives from the target: for each, apply 1 Faltering to that enemy and gain 5 Barrier. |
| `draw-steel` | Draw Steel | basic | 1 | Pull up to 2 knives from the target. Deal 4 (+4 per knife pulled) damage. | Pull up to 2 knives from the target. Deal 7 (+4 per knife pulled) damage. |
| `duck-and-weave` | Duck and Weave | common | 1 | Gain 8 Barrier. Discard 1 card. Gain 1 Preparation. | Gain 11 Barrier. Discard 1 card. Gain 1 Preparation. |
| `executioners-mark` | Executioner's Mark | rare | 1 | Embed 3 knives in the target. Gain 1 Preparation. Gain 4 Barrier. | Embed 3 knives in the target. Gain 1 Preparation. Gain 7 Barrier. |
| `eyes-in-the-dark` | Eyes in the Dark | rare | 1 | The first time each turn you spend Preparation: Draw 1 card. Gain 4 Barrier. | The first time each turn you spend Preparation: Draw 1 card. Gain 6 Barrier. |
| `fade-out` | Fade Out | uncommon | 1 | Gain 7 Barrier. Draw 1 card. If you have no Preparation: Gain 1 Preparation. | Gain 10 Barrier. Draw 1 card. If you have no Preparation: Gain 1 Preparation. |
| `feint-strike` | Feint Strike | common | 1 | Deal 5 damage. Embed 2 knives in the target. | Deal 8 damage. Embed 2 knives in the target. |
| `final-cut` | Final Cut | rare | 3 | Spend all your Preparation. Pull every knife from the target. Deal 16 (+6 per Preparation spent) damage. If you pulled a knife: Deal damage equal to 6 times the knives pulled. | Spend all your Preparation. Pull every knife from the target. Deal 22 (+6 per Preparation spent) damage. If you pulled a knife: Deal damage equal to 6 times the knives pulled. |
| `finishing-thrust` | Finishing Thrust | basic | 2 | Spend up to 3 Preparation. Deal 8 (+4 per Preparation spent) damage. | Spend up to 3 Preparation. Deal 12 (+4 per Preparation spent) damage. |
| `flick-knife` | Flick Knife | common | 1 | Deal 7 damage. Embed a knife in the target. Draw 1 card. Discard 1 card. | Deal 10 damage. Embed a knife in the target. Draw 1 card. Discard 1 card. |
| `flurry-of-steel` | Flurry of Steel | rare | 2 | Deal 5 damage 4 times. Embed a knife in the target. | Deal 6 damage 4 times. Embed 2 knives in the target. |
| `harvest-the-field` | Harvest the Field | uncommon | 1 | Pull every knife from every enemy: for each, deal 6 damage to that enemy. | Pull every knife from every enemy: for each, deal 7 damage to that enemy. |
| `hidden-in-plain-sight` | Hidden in Plain Sight | rare | 1 | The first time each turn you pull a knife: Gain 1 Preparation. Gain 4 Barrier. | The first time each turn you pull a knife: Gain 1 Preparation. Gain 6 Barrier. |
| `hobbling-jab` | Hobbling Jab | common | 0 | Deal 3 damage. Apply 1 Faltering. | Deal 5 damage. Apply 1 Faltering. |
| `killing-stroke` | Killing Stroke | rare | 1 | Spend all your Preparation. Deal 8 (+6 per Preparation spent) damage. Consume. Opening hand. | Spend all your Preparation. Deal 12 (+6 per Preparation spent) damage. Consume. Opening hand. |
| `knife-in-the-back` | Knife in the Back | uncommon | 1 | Spend all your Preparation. Deal 5 (+5 per Preparation spent) damage. | Spend all your Preparation. Deal 8 (+5 per Preparation spent) damage. |
| `knife-juggle` | Knife Juggle | common | 1 | Embed 2 knives in the target. Gain 4 Barrier. | Embed 2 knives in the target. Gain 7 Barrier. |
| `lay-bare` | Lay Bare | uncommon | 0 | Remove all Barrier and Steadfast from the target. Apply 1 Exposed. Gain 1 Preparation. Consume. | Remove all Barrier and Steadfast from the target. Apply 2 Exposed. Gain 1 Preparation. Consume. |
| `leave-no-trace` | Leave No Trace | uncommon | 1 | Gain 5 Barrier. Pull a knife from the target: for each, gain 6 Barrier. | Gain 8 Barrier. Pull a knife from the target: for each, gain 6 Barrier. |
| `marked-for-death` | Marked for Death | rare | 1 | Deal 10 damage. If this is fatal: Gain an extra card reward after this fight. Consume. | Deal 15 damage. If this is fatal: Gain an extra card reward after this fight. Consume. |
| `nimble-deal` | Nimble Deal | uncommon | 1 | Draw 3 cards. Discard 1 card. Gain 1 Preparation. | Draw 4 cards. Discard 1 card. Gain 1 Preparation. |
| `patient-footwork` | Patient Footwork | basic | 1 | Gain 5 Barrier. Gain 1 Preparation. | Gain 7 Barrier. Gain 1 Preparation. |
| `pincushion` | Pincushion | uncommon | 2 | Deal 5 damage 3 times. Embed 3 knives in the target. | Deal 7 damage 3 times. Embed 3 knives in the target. |
| `pinning-throw` | Pinning Throw | common | 1 | Deal 5 damage. Embed a knife in the target. Apply 1 Faltering. | Deal 8 damage. Embed a knife in the target. Apply 1 Faltering. |
| `practiced-hands` | Practiced Hands | uncommon | 1 | Draw 2 cards. They Hold this turn. Gain 1 Preparation. | Draw 3 cards. They Hold this turn. Gain 1 Preparation. |
| `prepared-ambush` | Prepared Ambush | uncommon | 1 | Gain 2 Preparation. Gain 6 Barrier. | Gain 2 Preparation. Gain 9 Barrier. |
| `quick-slash` | Quick Slash | common | 0 | Deal 6 damage. | Deal 9 damage. |
| `quiet-incision` | Quiet Incision | basic | 1 | Deal 6 damage. Embed a knife in the target. | Deal 9 damage. Embed a knife in the target. |
| `read-the-guard` | Read the Guard | common | 1 | Gain 1 Preparation. Draw 2 cards. Gain 2 Barrier. | Gain 1 Preparation. Draw 3 cards. Gain 2 Barrier. |
| `reap-the-steel` | Reap the Steel | rare | 1 | Deal 6 damage to ALL enemies. Pull every knife from every enemy: for each, deal 4 damage to that enemy. | Deal 8 damage to ALL enemies. Pull every knife from every enemy: for each, deal 4 damage to that enemy. |
| `recall-the-blades` | Recall the Blades | rare | 1 | Pull every knife from every enemy: for each, gain 1 Preparation and gain 4 Barrier. | Pull every knife from every enemy: for each, gain 1 Preparation and gain 5 Barrier. |
| `roll-away` | Roll Away | common | 1 | Gain 4 Barrier. Gain 4 Guarded. | Gain 6 Barrier. Gain 5 Guarded. |
| `scatter-knives` | Scatter Knives | uncommon | 1 | Embed a knife in each enemy. Gain 1 Preparation. Gain 5 Barrier. | Embed a knife in each enemy. Gain 1 Preparation. Gain 8 Barrier. |
| `severing-finish` | Severing Finish | uncommon | 2 | Spend up to 3 Preparation. Deal 14 (+4 per Preparation spent) damage. | Spend up to 3 Preparation. Deal 19 (+4 per Preparation spent) damage. |
| `shroud-and-shank` | Shroud and Shank | common | 1 | Gain 6 Barrier. Embed a knife in the target. | Gain 9 Barrier. Embed a knife in the target. |
| `side-slip` | Side Slip | uncommon | 0 | Next turn, gain 1 extra Mana. Gain 1 Preparation. Gain 1 Barrier. | Next turn, gain 1 extra Mana. Gain 2 Preparation. Gain 1 Barrier. |
| `smoke-veil` | Smoke Veil | uncommon | 1 | Gain 5 Barrier. Gain 1 Blur. | Gain 8 Barrier. Gain 1 Blur. |
| `stalkers-lunge` | Stalker's Lunge | common | 2 | Deal 14 damage. Next turn, draw 2 extra cards. | Deal 19 damage. Next turn, draw 2 extra cards. |
| `sweep-the-leg` | Sweep the Leg | uncommon | 2 | Apply 2 Faltering. Gain 11 Barrier. | Apply 3 Faltering. Gain 14 Barrier. |
| `thread-the-needle` | Thread the Needle | rare | 0 | If the target has 3 knives in it: Pull every knife from the target. Deal 4 (+5 per knife pulled) damage. | If the target has 3 knives in it: Pull every knife from the target. Deal 7 (+5 per knife pulled) damage. |
| `throat-cut` | Throat Cut | uncommon | 1 | Spend up to 2 Preparation. Deal 5 (+4 per Preparation spent) damage. If the Preparation spent is 1 or more: Apply 1 Faltering. | Spend up to 2 Preparation. Deal 8 (+4 per Preparation spent) damage. If the Preparation spent is 1 or more: Apply 1 Faltering. |
| `turn-aside` | Turn Aside | common | 0 | Gain 4 Barrier. | Gain 6 Barrier. |
| `twist-and-pull` | Twist and Pull | rare | 1 | Pull every knife from the target: for each, that enemy loses 5 HP and apply 1 Faltering to that enemy. | Pull every knife from the target: for each, that enemy loses 7 HP and apply 1 Faltering to that enemy. |
| `twist-the-blade` | Twist the Blade | common | 1 | Pull a knife from the target. Deal 6 (+6 per knife pulled) damage. | Pull a knife from the target. Deal 9 (+6 per knife pulled) damage. |
| `vanishing-act` | Vanishing Act | rare | 1 | Gain 6 Barrier. Gain 1 Blur. Gain 2 Preparation. | Gain 9 Barrier. Gain 1 Blur. Gain 2 Preparation. |
| `whetted-edge` | Whetted Edge | uncommon | 1 | Whenever you pull a knife: Deal 2 damage to that enemy. Gain 1 Barrier. | Whenever you pull a knife: Deal 3 damage to that enemy. Gain 1 Barrier. |
| `worry-the-wound` | Worry the Wound | uncommon | 0 | Deal 2 (+3 per knife in it on the target) damage. | Deal 4 (+3 per knife in it on the target) damage. |
