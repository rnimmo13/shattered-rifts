# Campaign shard increase — 2026-11-05

Local0.209.0/rules86, shared release candidate with the separately approved Recall revision. Robert chose25/50/100 and explicitly confirmed new base rewards with existing tier reductions. Implementation authorized; no commit/push/deployment approval for these new changes.

## Exact economy change

Normal fight base15→25; Elite base36→50; Warden base65→100. Preserve Elite interpolation from full base atI to normal-fight floor atXIX, existing Times Are Tough reduction (20%fromIII, plus2points/tier, max50%), Rift−25%/Gilded+40% multipliers and Math.round at existing stages. Preserve Elite choice between shards/MaxHP/heal, Shard Purse flat6extra, starting balances/difficulty, shop/event prices and all other rewards. Valerion remains immediate completion with no post-victory rewards.

| Tier | Old normal/Elite/Warden actual payout | New normal/Elite/Warden actual payout |
|---|---|---|
| I |15 /36 /65|25 /50 /100|
| VI |11 /22 /48|19 /32 /74|
| XI |10 /15 /42|16 /23 /64|
| XII |9 /14 /40|16 /22 /62|

These are hand-calculated exact rules before Hearts, flat Boon income or event bonuses; Elite amounts are selectable shard spoils. AtXII old/new Elite pre-Omen bases are23→35. AtI Rift pays normal11→19,Elite27→38,Warden49→75; Gilded normal21→35,Elite50→70,Warden91→140. Percentages unchanged.

Without price inflation, removal50requires4→2normal victories, upgrade75requires5→3, rare95requires7→4, assuming no other income/spending and a merchant opportunity. These are affordability examples, not complete run-income measurements. AtXII prices remain162for a95-base rare,128for a75-base first upgrade,85for a50-base removal; higher income does not cancel Omen price inflation. Finale has free refinement shrines, not added merchant opportunities, so late wealth may remain unspent.

## Persistence and scope

No retroactive deposits, balance rewrites or rerolls. Future victory calculation uses new bases; old generated Elite offers keep their saved amount. Save bounds now recognize the held Heart’s shard modifier so legitimate Gilded offers can reload; do not change reward claiming or permit duplication. No combat HP/damage, map/fight frequency, prices, card reward odds or Arena fight rules changed by this economy patch. Campaign acquisition can affect later banked Arena decks; evaluate equal deck quality separately from acquisition opportunity. Rules86 already belongs to the unpublished Recall candidate; no additional combat-rule revision required for income.

## Evidence and balance assessment

User reports wanting more Campaign shards. Available retained client Campaign snapshots include the previously archived Golemancer and Assassin wins; these are positions/final-fight traces, not full purchases/reward ledgers or independent economy matches. No representative observed per-tier income/spending sample establishes a target. New numbers are Robert’s explicit choice; arithmetic/regression checks establish payouts only, not difficulty/parity. No simulations run.

All30Ascendancies,10starts and freely mixed builds retain prior unmeasured grades. I–III purchases become more accessible; IV–VII/VIII–X/XI–XII still suffer existing reward/price Omens. More shards may help removal, upgrades, recovery purchases and rare-engine assembly differently. Track actual selected Elite spoils, skipped offers, shops reached, shards spent/held, Heart modifiers, setup/recovery/rare reliance, opening1–3/extended6–10/beyond10ownturns. Fixed event rewards and flat6ShardPurse are relatively smaller; extra income raises the opportunity cost of taking HP/healing instead of Elite shards. No class parity or boss clear rate inferred.

## Validation

Final full suite3,925tests/189files passed, including pending Recall revision. All workspace typechecks, web production and desktop-shell builds pass. Whole-repo lint0errors with only two pre-existing React-refresh warnings in PileArt.tsx/MapInk.tsx. Regression scenarios cover actual TierI/VI/XI/XII payouts, Heart bonuses and saved Elite offers, preserved old pending amounts, alternatives, losses and Valerion no-payout. git diff --check clean. No simulations, commit, push or deployment for this candidate.
