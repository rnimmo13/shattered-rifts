# Simulation-led balance revision — local candidate 0.199.0 / rules 82

Robert authorized balance revisions following the requested simulations and asked for a broader review. This authorizes implementation and follow-up simulations, **not push or deployment**. Previous v0.198.0 assessments and experiment outcomes remain preserved. All changes below are shared between Campaign and Arena unless explicitly marked Campaign only. No hero HP multiplier, targeting rule or match clock changes.

## Why this pass is broader

The first benchmark contradicted the all-A projections. It exposed resource recycling, a severe dependence on deck refinement, weak protection during setup, and a boss whose repeated Ward, Barrier and healing could prevent sustained progress. The experiments measure complete decks, not isolated passive strength. Low bot results alone are insufficient reason for indiscriminate buffs.

A separate experimental pilot values survival, Spirit, totems, attack Auras and Reserves, and stops merging states with different buffs/resources. It is never used by production ghosts. On the same released data and 600 paired boss fights, total wins changed from 63 to 73; many weak styles still had no successes. This audit improves confidence that the issues extend beyond one evaluator, without establishing human-equivalent play.

## Exact local changes

| Area | Before | Revision |
|---|---|---|
| Blood Oath / + | Every play: lose 3/2 HP, gain 3 Reserves | Same payment and gain, once on your own turn **shared across all copies and replays**. Later plays neither pay HP nor gain Reserves. Still repeatable on future turns; not Consume. |
| Marshal | Max Reserves 4; +10% attack damage per Reserve spent, cap 40% | Also gain 1 Reserve at each own-turn start, including the opening turn, within the normal cap. |
| Measured Conviction / + | 2 Mana | 1 Mana; existing end-turn condition and rewards unchanged. |
| The Drowned King+ | 0 Mana; each companion hits for 15 + its max HP | 1 Mana; full HP conversion retained. Base remains 1 Mana, 10 + max HP. |
| Restless Spirits / + | Every soul play: 4/6 HP loss + 1 per three previously consumed souls | Each Aura gives that full payoff on its first 3 soul plays on the owner's turn; later soul plays that turn give 1/2 HP loss. No opponent-turn trigger. Counter resets each own turn; copies count separately; accumulated soul growth remains. |
| Bloodburst / + | 1 Mana | 2 Mana. Bleed 9/12 to all enemies and immediate tick unchanged. |
| Artillerist | +1 Might each own-turn start; first own-turn Attack gives 3 Barrier | +2 Might; 6 Barrier. |
| Golemancer | +3 companion max HP each own-turn start | Same growth, then hero Barrier = floor(10% of largest living companion max HP), capped at 12. No companion HP cap; existing damage/growth recovery unchanged. |
| Swarmwright | Four slots, 1 Primed per companion each turn, Fabrication growth | Also gain 3 hero Barrier on each of the first 3 successful own-turn summons. Failed summons give none; resets next own turn. |
| Link Up / + | 4/6 Barrier to all friends, draw 1 | 6/8 Barrier to all friends, draw 1; still 1 Mana. |
| Heavy Industry / + | 2 Mana | 1 Mana; still 4/6 Barrier to all friends at turn start, no immediate shield. |
| Bulwark Frame / + | Selected ally gains 8/11 + floor(20% of its max HP) Barrier | The hero also gains the same amount, using the selected ally's max HP. Still 1 Mana; target remains a companion. |
| Beastmaster | Companions share 75% of hero Might | Also gain 1 hero Might each own-turn start. |
| Reaver | First self-effect HP payment each turn draws 1 and gives 2 Primed | Also gives 4 hero Barrier; same trigger and once-per-turn limit. |
| Pack Tactics / + | 1 Might, 2/4 Barrier to all friends | 1 Might, 4/6 Barrier to all friends; still 1 Mana. |
| Pack Bond / + | 2 Mana | 1 Mana; still 4/6 Barrier to all friends at turn start. |
| Spiritwalker | First command/push-out each turn draws 1 and gives 4 Barrier | Also gains 1 Spirit on the first **ordered** command on the owner's turn. Push-outs do not grant this Spirit. |
| Blademaster | First Sword each turn draws 1; +1 damage per Sword hit | That first Sword also gives 4 Barrier; other effects unchanged. |
| Archmage | Start with +3 Power; first paid Spell Attack gets +1 damage/spent Power/hit and refunds half next turn | Also gains 2 Power at own-turn start; existing bonus and refund unchanged. |

### Vorthax — Campaign only

The campaign's linear tier multipliers stay unchanged. This revises the authored finale encounter rather than globally reducing campaign damage.

| Encounter property | Before | Revision |
|---|---|---|
| Vorthax base HP / Tier XX Normal HP | 360 / 3,060 | 300 / 2,550 |
| Rift Ward base HP / Tier XX Normal HP | 40 / 340 | 15 / 128 |
| Rift Ward Resonant Hum | +1 permanent Might to all friends, then attack 4 | +1 Primed to all friends, then attack 4; no perpetual Might accumulation from Hum |
| Rift Shard base HP / Tier XX Normal HP | 21 / 179 | 12 / 102 |
| First-phase cycle | Shards → Ward → Collapse → Refract | Refract → Shards → Ward → Collapse; opening is a setup move |
| Raise the Ward Barrier | 4% boss max HP | 1% |
| First-phase Refract Barrier | 6% boss max HP | 2%; still gains 1 Might |
| First-phase Collapse base hit | 26 | 22 |
| Feed on the Shards healing | 4% boss max HP per consumed Shard | 2%; still +1 Might per Shard; no Shards still leaves Exposed |
| Second-phase Collapse base hit | 30 | 24 |
| Third/fourth-phase Prismatic Beam base hits | 17 × 2 | 12 × 2 |

Taunt, the four phase thresholds, phase transitions, later Barrier/Shielded, Veil, Unmaking, Gravity, Shard summons and final Fate pressure remain. Clearing adds and preparing for the final quarter still matter. Existing card/save IDs are retained. Rules 82 uses the existing incompatible-battle migration instead of replaying rules-81 action logs under changed data.

## Hand costing and safeguards

- Blood Oath supplies at most 3 immediate Reserves per own turn across copies. Marshal adds one steady Reserve per turn rather than restoring repeatable zero-cost resource generation. At most four additional resources before other cards, limited by available pool capacity; drawing/replaying Blood Oath cannot bypass this allowance. The earlier Consume-only experiment collapsed the frozen Marshal deck, so it is not used.
- The Drowned King+ at 1 Mana makes a 3-body command consume tempo while preserving its defining HP payoff. No companion HP cap or blanket minion multiplier is introduced.
- Six soul plays after no prior souls now deal 15/24 total direct HP loss per Restless Spirits Aura, instead of 27/39. At 30 prior souls, the first three still each use the earned +10; later triggers stay small. This controls front-loaded throughput without erasing growth or Soulreaper's Reap.
- Bulwark Frame on a 20-HP ally gives 12/15 Barrier to each recipient; on a 160-HP machine it gives 40/43. That high ceiling requires a living, invested companion and spending a card/Mana each time. Golemancer's free hero Barrier is separately capped at 12. Watch long-fight sustain and removal/rebuild counterplay.
- The cheaper recurring protection Auras have no immediate payout, require drawing and spending a card, and have the normal two-copy limit. They help weaker setup paths without adding free Mana or unbounded draw loops.
- Spiritwalker earns Spirit by spending/commanding its row; Totemist earns it by leaving a cultivated row standing. These remain different plans. Archmage recovers resources for paid spell cycling; Blademaster gets protection while using Swords.
- Vorthax's first-phase repeatable Barrier falls from floor(4% HP) + floor(6% HP) = 305 per cycle to 25 + 51 = 76, before Ward replacement. His finale does not require every class to bypass the Ward or supply an extreme burst engine merely to make progress.

## Evidence status

Candidate experiments, frozen decks, pilot audit, before/after data snapshots and final comparison belong under `docs/balance-history/simulations/0.199.0/`. Changes are evaluated with both frozen original lists and separately retuned support packages. Training seeds never determine held-out match outcomes. Do not call this measured all-A parity; final rates and unresolved risks are recorded with the completed experiment report.

The completed [6,480-game final report](balance-history/simulations/0.199.0/README.md) raises matched-seed boss wins from 17.3% to 47.5% tuned, and 1.5% to 18.9% good. Arena median rounds remain 5/7; both players reach turn ten in only 7.6%/19.5% of decisive games. Bloodletter and Blood Knight remain upper outliers; Golemancer, Artillerist, Hunter and Spiritwalker still need attention. A separate matched Golemancer Bulwark Frame substitution changes 1/116 wins to 2/116, not a sufficient recovery. [All30 before/after figures](balance-history/simulations/0.199.0/RESULTS.md) and the [new versioned assessment](balance-history/0.199.0.md) preserve the evidence and uncertainty. This candidate is not validated for all-A parity and is not released.
