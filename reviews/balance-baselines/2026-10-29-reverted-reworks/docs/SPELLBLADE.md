# The Spellblade rebuilt: Imbue and Discharge (2026-10-29, DECISIONS #417; the pool expansion, DECISIONS #425)

From `docs/BASE_CLASS_REWORKS.md` §7. The Regent copy she was (DECISIONS #369: Arcana, the Sovereign Blade's Sharpen, Retainers) is
frozen in `reviews/balance-baselines/2026-10-29-pre-identity-reworks/` (`cards/spellblade.md`). Card prices:
[`spellblade-ledger.md`](spellblade-ledger.md) (generated); rates: `docs/14_CARD_COSTING.md` §15.

**Fantasy:** her Obsidian Blade is an enchanted weapon, not a whetstone project. Her spells write a charge into the glass; her blade
attacks release it. Nothing grows for good: a charge is stored, then spent.

## The rules (engine contract)

| Rule | Exactly |
|---|---|
| The blade | `SideState.enchants`: at most 2 (`ENCHANT_SLOTS`), in the order imbued, duplicates allowed. Shown in its own panel ("Obsidian Blade"), each as a mark and a word. Kept between turns; cleared when the fight ends. |
| Enchantments | **Ember**: the attack that discharges it deals 3 more (`EMBER_DAMAGE`) on its first hit (one target; Exposed and Might apply as to any attack damage). **Glass**: once that card's attack is done, 2 (`GLASS_DAMAGE`) to every enemy still standing, a shard and not an attack (no Might, no Exposed, no Thorns). **Ward**: 3 Barrier (`WARD_BARRIER`) at once. |
| Imbue | `imbue(kind, ifRoom?)` puts a charge in a free position. With both taken the player chooses which one it replaces (a pending choice; a replacement is an Imbue and fires `imbue`, never a discharge). `ifRoom`: only when there is a free position (Warm Anvil, Final Shatter). Fires `imbue`. |
| Discharge | `discharge(1)` spends one: the player chooses when the two differ (identical or single charges need no choice); `discharge(2)` spends both, once each, in their order. An empty blade discharges nothing and the card still plays. It must come before the card's damage (the validator checks), so the charge lands on that attack. A card with no attack (Star Barrier, Shatterguard) loses an Ember and breaks a Glass at once. Fires `discharge`, and `dischargeMixed` when two different kinds go together. `per('discharged')` counts what this card spent. |
| Recast | `recast` changes the newest charge into another kind of the player's choice. It is not a discharge, copies nothing and restores nothing. |
| Twin Edge | `twinedge` (Echoing Blade): the first charge of the next discharge counts twice (Ember +6, Glass 4, Ward 6). One charge, once; it does not copy a charge into a position. Lasts the turn. |
| Echoes and replays | A replayed or echoed card spends only the charges still on the blade when it resolves; nothing is copied. A discharge choice carries the spent Ember/Glass across the choice (`pending.ember`, `pending.glass`). |
| Previews | The attack preview adds the Ember a discharge would land (exact when the choice is forced, a range when it is the player's), and "(+N on the first hit)" for multi-hit attacks. Previews spend nothing. |
| Kind-specific discharge | `dischargeKind(kind, n)` (#425): spends only charges of that kind (the oldest first; 2: every one), never asks, leaves the rest; none of that kind: nothing, and "If it did" does not run. |
| A pair | `dischargedPair` / `dischargedMix` (#425): the card discharged two of the same / of different kinds at once. `echoCharges`: those charges take effect once more (Ember 3 on the next hit, Glass 2 to all after the attack, Ward 3 Barrier); it is not a discharge: no trigger answers it, nothing returns to the blade. The spent kinds are carried over a choice. |
| Recast trigger | `on('recast')` (#425): your newest enchantment was changed (Living Glass). |
| No Arcana | Her new cards have no ◆ cost and gain no Arcana; the Stars/Arcana engine stays in the engine for anyone, unused by her. Her blade is not Sharpened: the Obsidian Blade is no longer a Sharpen weapon, and the Drunkard's Precision is untouched. |

## Trait and starter

- **Glass and Ember:** start every fight with a Ward on the blade; the first time each turn you Imbue, draw 1 and gain 2 Barrier. (~14 in
  the starter, ~22 in an Imbue deck; guide §15.) No Arcana a turn, no Sharpen a turn, no Sovereign Blade.
- **Starter (10):** 4 Strike, 4 Defend, **Ember Inscription** (1: 5 spell damage, Imbue Ember), **Obsidian Cut** (1: Discharge one, 6).
  Turn 1 asks the first question at once: spend the starting Ward now on Obsidian Cut (3 Barrier and 6 damage) or keep it and Imbue an
  Ember first so the cut can choose.

## Strategies

1. **Edge (frequent single discharges):** cheap Imbues and attacks that spend one charge at a time. Forged in Fury, Ember Cache, Faint
   Glow, Sunstrike, Fracture Script, Shard Strike, Skybolt, Astral Pulse, Gamma Burst, Tyrant Strike, Call the Blade, Warm Anvil,
   Cleaving Edge, Magma Surge, Dying Ember. Package: Warm Anvil (an Ember each turn there is room) + Skybolt and Cleaving Edge: every
   turn one charge, one spend, 4 to every enemy.
2. **Burst (mixed charges, full discharges):** fill both positions with different kinds, then spend them together. Etch the Edge
   (`whetstone`), Twin Sigils, Banked Embers, Scheme, Crownfall, Devastate, Overcharge Edge, Comet (Lava Bomb), Seven Shards,
   Heirloom Maul, Cataclysm, Glass Requiem, Obsidian Lance (pays for holding), Final Shatter, Emberglass Covenant. Package: Etch the Edge
   (Ember + Glass, 5 Barrier) then Crownfall: 17 + 3 on the hit + 2 to every enemy, and the Covenant's Mana and Barrier next turn.
3. **Ward (defensive weaving):** Barrier, Wards, and payoffs for what the blade holds. Glassward, Glass Wall, Bladewall, Ward Weave,
   Pale Beacon, Unbreakable Crown, Star Barrier, Shatterguard, Mirror Glass, Glass Guard (Parry), Obsidian Aegis, Glass Veil. Package:
   Unbreakable Crown (16 + two Wards) then Shatterguard (10 Barrier) or hold the Wards for Obsidian Aegis's end-of-turn Barrier.

Glue: Glint, Hollow Gaze, Humble, Molten Weight, Stellar Wind, Recast the Edge, Echoing Blade. The real choice every strategy shares:
spend the stored charge now, or keep it (Obsidian Lance, Pale Beacon, Obsidian Aegis, Ward Weave pay for keeping; a full blade forces a
replacement choice). All three work against a single boss.

## Card disposition (53 live: 41 kept or changed, 12 new; 46 removed)

**Kept, numbers tuned (same job):** Glint, Hollow Gaze (7 Barrier), Humble, Molten Weight, Stellar Wind, Obsidian Flurry, Glass Veil,
Devastate, Final Shatter, Seven Shards, Cataclysm, Comet (Lava Bomb).

**Changed (same id, new job):** Forged in Fury (attack and Imbue Ember), Etch the Edge (`whetstone`: Ember and Glass, a magical
inscription), Bladewall (Barrier and a Ward), Call the Blade (finds an attack, Imbues Glass; never restores a spent charge), Warm Anvil
(an Ember at the start of a turn when there is room), Glass Guard / `parry` (Barrier whenever you Discharge), Echoing Blade (Twin
Edge: one charge counts twice, nothing duplicated), Skybolt, Astral Pulse, Gamma Burst, Tyrant Strike, Radiance, Dying Ember, Star
Barrier, Mirror Glass (discharge spenders), Ember Cache, Faint Glow, Sunstrike, Shard Strike, Magma Surge, Banked Embers, Scheme (Imbue
producers), Obsidian Lance, Pale Beacon, Glass Wall, Obsidian Aegis (pay for what the blade holds), Heirloom Maul, Cleaving Edge,
Unbreakable Crown.

**New:** Ember Inscription, Obsidian Cut, Fracture Script, Glassward, Recast the Edge, Crownfall, Overcharge Edge, Emberglass Covenant,
Twin Sigils, Glass Requiem, Shatterguard, Ward Weave.

**Removed** (into the nearest new card, `retired.ts` Spellblade identity block): the Sovereign Blade and its Sharpen package
(Starforged Blade, Forge Heat, Hammer and Anvil, Obsidian Drill, The Forgemaster, Glass Armory, Endless Barrage); the Arcana/Stars
generator-spender package (Gather Light, Falling Sky, Gravity Well, Cygnus, Chart the Orbit, Starburst, Orion, Collapsing Star, Orbit,
Distant Ember, Pillar of Light, Sigil of Wandering, Hex Volley, Crown's Weight, Meteor Jab); the Court/Retainer and created-card
package (Retainer Strike, Retainer Dive, Retainer Guard, To Arms, Call the Guard, Royal Decree, Grand Speech, Spoils, Rubble, Rift Gifts,
Wild Spark, Fated Hand, Tyrant's Gaze, Iron Rule, By Decree); the freeplay engine (Hollow Form); and Feint, Tyrant's Stomp, Crowned
Fist, Conqueror, Magma Crash, Out of My Sight, Weigh the Crown, Read the Embers.

## Checks the points can't do (guide §8)

- **Loops:** the trait's draw is once a turn; Faint Glow, Magma Surge and Echoing Blade (0-cost) Consume; no card restores a spent
  charge, and no Discharge makes an Imbue except Sunstrike (only when empty) and Final Shatter (only on a kill, only into room). Two
  positions bound everything: a full blade can never hold more than 2 charges, worth at most 7.2 (two Wards).
- **Multipliers:** a charge adds a flat amount once. Twin Edge doubles one charge once (at most +3.6). Per-charge payoffs (Overcharge
  Edge, Glass Requiem, Shatterguard, Heirloom Maul, Obsidian Aegis) read at most 2. The biggest turn: Etch the Edge, then Lava Bomb+
  (26 + 3 Ember + 2 to all, 2 Faltering, 2 Exposed) with Cleaving Edge and Emberglass Covenant out: about 45 for 4 Mana after a turn
  of setup and two Auras.
- **Turn-four ceiling:** an Edge deck with Warm Anvil and Cleaving Edge: one Ember a turn and one spend: ~6 + 3 + 5.2 AoE on top of the
  hand, an uncommon-plus-rare Aura pair's rate.
- **Tiers:** every charge is flat, so it shrinks against Tier X HP; Lava Bomb and Gamma Burst's debuffs keep up.
- **Arena:** the blade is on her side and in the view for both players; no reaction prompts, the discharge choice is on her own turn.

## The pool expansion (2026-10-29, DECISIONS #425): 89 cards, 87 reward-eligible

The cards before it (53, 51 reward-eligible) are frozen in `reviews/balance-baselines/2026-10-29-spellblade-expansion/`. 36 added, none
changed or removed; 12 Auras (was 5). Build paths (hidden): Edge 29, Burst 30, Ward 23. 88 of 89 within ±15% of budget.

### Six ways to play her

1. **Frequent single discharges** (Edge): spend one, keep the other for a purpose. Measured Release, Spark Thrust, Glass Fang, Searing
   Edge and Warding Strike (each spends only its kind, so the other charge stays), Double Release (two triggers), Edge Discipline.
   Sequencing: imbue the charge you want to keep first; the kind-specific cards then take the other.
2. **Mixed-charge burst** (Burst): Split the Light, Fault Line, Prism Break and the Emberglass Covenant reward two different kinds; Glass
   and Guard is the third mixed setup. The value is timing (draw 2, Exposed on all, 10 more), not only the printed number.
3. **Matching charges** (Burst): Kindle the Blade (Ember pair), Glaze the Edge (Glass pair), Unbreakable Crown (Ward pair); Resonant
   Pair and Kindred Shards make a matching pair take effect again, which is a different thing for each kind (6 on the hit, 4 to all,
   6 Barrier); Matched Set pays Barrier for building pairs. A mixed blade draws and bursts instead: neither is better every time.
4. **Ward weaving** (Ward): hold Wards (Hold the Glass, Sentinel Glass: 4 to all at the end of a turn a Ward is held) or spend them
   (Warding Strike, Wardbreak: 5 to all a Ward, Shattering Rebuke). Sentinel Glass and Wardbreak are the route to victory.
5. **Recast / adaptation**: Shift the Grain (0), Adaptive Strike, Obsidian Insight (Consume) and Living Glass (once a turn). Each Recast
   costs a card; the Aura pays only the first each turn.
6. **Delayed release**: holding pays (Bide the Blade, Tempered Wait, Glass Sight, Stored Light: a card and 2 Barrier at the start of a turn with a full
   blade, Obsidian Resonance: Twin Edge every turn) but fills both positions and delays the spend; Rekindle refills an empty blade, so
   holding is never forced.

Utility and defence (13 non-Aura): Glass and Guard, Glimpse Through Glass, Blade Recall, Hold the Glass, Blunting Ward, Purifying Shard,
Shattering Rebuke, Bide the Blade, Tempered Wait, Glass Sight, Shift the Grain, Rekindle, Obsidian Insight. Group: Fault Line, Wardbreak,
Scatter Glass, Glaze the Edge, Sentinel Glass.

### The expansion table

| Card | Rarity | Mana | Type | Effect | Upgrade | Role | Decision | Points | Combo risk |
|---|---|---|---|---|---|---|---|---|---|
| Measured Release | C | 1 | Attack | Discharge one, 7; draw 1 if a charge is left | 10 | Edge | which charge to keep, so the draw comes | 7 + 1 + draw 3 x0.5 = 9.5 | Edge Discipline: 2 cards; bounded by the 2 positions |
| Spark Thrust | C | 0 | Attack | Discharge one, 5 | 7 | Edge | a free spend: the charge, not the Mana, is the cost | 5 + 1 = 6 | needs a charge to spend (no charge, no trigger); no draw, no Mana |
| Glass Fang | C | 1 | Attack | Discharge a Glass (only), 7; if it did, 2 Sapped on ALL for their turn | 10 | Edge | spend the Glass, keep the Ember/Ward | 7 + 1 + 3.1 x0.6 = 9.9 | none: one charge |
| Searing Edge | U | 2 | Attack | Discharge an Ember (only), 14; if it did, 2 Exposed | 18 | Edge | the Ember for this hit, the rest for later | 14 + 1 + 6 x0.6 = 18.6 | Exposed into Molten Ruin / Lava Bomb: priced in the burst table |
| Double Release | U | 1 | Attack | Discharge one, 4; discharge one, 4 | 6 / 6 | Edge | two triggers from one card, each charge on its own hit | 8 + 2 = 10 | Cleaving Edge/Glass Guard answer twice: at most 2 (two charges) |
| Edge Discipline | U | 1 | Aura | the first time each turn you Discharge and a charge is left: draw 1, 1 Barrier | Opening hand | Edge engine | single discharges over double ones | 0.9 x 4.2 x4 = 15.1 | at most once per charge you can keep; 0-cost Spark Thrust + it replaces itself once per pair |
| Shift the Grain | C | 0 | Skill | Recast; 4 Barrier | 6 Barrier | Recast | fix the newest charge cheaply | 1.5 + 4.8 = 6.3 | no draw, no Mana: no loop |
| Adaptive Strike | U | 1 | Attack | Recast, then discharge one, 8 | 11 | Recast | change it and spend it in one card | 8 + 1.5 + 1 = 10.5 | none |
| Living Glass | U | 1 | Aura | first Recast each turn: 3 Barrier, draw 1 | Opening hand | Recast engine | pay a card for adaptation | 0.6 x 6.6 x4 = 15.8 | once a turn |
| Obsidian Insight | R | 0 | Skill | Foresee 3, Recast, draw 1, Consume | Foresee 4 | Recast/selection | the free fix, once a fight | 5 + 1.5 + 3 = 9.5 (Consume budget 9.4) | Consumes |
| Rekindle | C | 1 | Skill | 5 Barrier; if the blade is empty: Imbue Ember and Glass, draw 1 | 8 Barrier | recovery | play it after a full spend, not before | 6 + 7.7 x0.4 = 9.1 | only on an empty blade |
| Spell-Etched Steel | U | 1 | Aura | whenever you Imbue: 3 to a random enemy | 4 | spell/weapon bridge | Imbue more, spend later | 1.4 x 2.7 x4 = 15.1 | bounded by Imbue cards; two copies 6 an Imbue |
| Split the Light | U | 1 | Attack | Discharge both, 5; draw 2 on a mixed pair | 8 | mixed burst | build a mixed blade | 5 + 1.5 + 6 x0.55 = 9.8 | none |
| Fault Line | U | 2 | Attack | Discharge both, 11 to ALL; 1 Exposed on ALL on a mixed pair | 14 | mixed burst, group | mixed release on a crowd | 14.3 + 1.5 + 4.5 x0.55 = 18.3 | none |
| Prism Break | R | 2 | Attack | Discharge both, 13; 10 more on a mixed pair | 17 | mixed burst | hold a mixed blade for it | 13 + 1.5 + 10 x0.7 = 21.5 | Exposed: 26 x1.5 |
| Kindle the Blade | C | 1 | Skill | Imbue Ember twice, 4 Barrier | 7 | matching | an Ember pair (or replace one) | 5 + 4.8 = 9.8 | two Imbues: Spell-Etched Steel twice |
| Glaze the Edge | C | 1 | Skill | Imbue Glass twice, 4 Barrier | 7 | matching | a Glass pair for a crowd | 4.4 + 4.8 = 9.2 | as above |
| Resonant Pair | U | 1 | Attack | Discharge both; a matching pair takes effect again; 6 | 9 | matching payoff | Ember pair: 6 more; Glass pair: 4 more to all; Ward pair: 6 Barrier | 6 + 1.5 + 6.4 x0.55 = 11 | the echo is no discharge: no trigger, no charge back |
| Kindred Shards | R | 2 | Attack | Discharge both; a matching pair again and draw 1; 15 | 20 | matching payoff | as above | 15 + 1.5 + 9.4 x0.55 = 21.7 | as above |
| Matched Set | U | 1 | Aura | whenever you Imbue and the blade holds a matching pair: 3 Barrier | 4 | matching engine | build pairs | 1 x 3.6 x4 = 14.4 | one Barrier per Imbue, bounded by Imbues |
| Bide the Blade | U | 1 | Skill | 7 Barrier; draw 2 with a full blade; Hold | 10 | holding | keep the blade full one more turn | 8.4 + 6 x0.4 + 1 = 11.8 | none |
| Tempered Wait | C | 1 | Skill | 6 Barrier; 1 Mana next turn while an Ember is held | 9 | holding | keep the Ember for next turn | 7.2 + 4 x0.5 = 9.2 | next turn only |
| Glass Sight | U | 1 | Skill | 5 Barrier; draw 1 per kind on the blade; Hold | 8 | selection | a mixed blade draws more | 6 + 3.9 + 1 = 10.9 | at most 2 cards |
| Stored Light | R | 1 | Aura | start of turn, full blade: draw 1, 2 Barrier (no Mana since the review) | Opening hand | holding payoff | carry a full blade over and pay for spending it | 0.55 x 9.4 x4 = 20.7 | once a turn, needs both positions full |
| Obsidian Resonance | R | 1 | Aura | start of turn: Twin Edge, 2 Barrier | Opening hand | burst engine | which charge to spend first | 4 x (2.4 + 2.4) = 19.2 | one charge doubled a turn: at most +3.6 |
| Glass and Guard | C | 1 | Skill | Imbue Glass and Ward, 3 Barrier | 6 | mixed setup | Glass+Ward (the third mixed pair) | 2.2 + 3 + 3.6 = 8.8 | none |
| Glimpse Through Glass | C | 1 | Skill | Foresee 3, 4 Barrier | 7 | utility | selection over Imbue | 5 + 4.8 = 9.8 | none |
| Blade Recall | U | 1 | Skill | a blade Attack from discard to hand, Imbue Ward, 3 Barrier | 6 | utility | find the discharge you need | 4 + 3 + 3.6 = 10.6 | costs Mana, returns one card |
| Warding Strike | C | 1 | Attack | Discharge a Ward (only), 6 +4 if it did | 9 | Ward weaving | spend a Ward as damage, keep the Ember | 6 + 1 + 4 x0.6 = 9.4 | none |
| Wardbreak | U | 1 | Attack | Discharge every Ward; 5 to ALL a Ward | 6 a Ward | Ward weaving, group | held Wards into a group attack | 1.5 + 1.3 x 6.5 = 10 | at most 2 Wards |
| Hold the Glass | C | 1 | Skill | 5 Barrier +2 a Ward; Hold | 8 | Ward weaving | keep the Wards | 7.2 + 1 + 1.2 = 9.4 | none |
| Sentinel Glass | U | 1 | Aura | end of turn, a Ward held: 4 to ALL | 5 | Ward route to victory | hold a Ward or spend it for Barrier now | 0.75 x 5.2 x4 = 15.6 | once a turn; flat Aura damage |
| Blunting Ward | C | 1 | Skill | 1 Faltering, Imbue Ward, 3 Barrier | 6 | debuff/defence | blunt the attacker | 3 + 3 + 3.6 = 9.6 | none |
| Purifying Shard | U | 1 | Skill | lessen your debuffs by 2, 6 Barrier, Imbue Glass | 9 | debuff management | cleanse or not | 2 + 7.2 + 2.2 = 11.4 | none |
| Shattering Rebuke | U | 1 | Skill | Discharge one (from a Skill), 2 Faltering, 3 Barrier | 6 | defence | spend a Glass or Ward as protection (an Ember is lost) | 1 + 6 + 3.6 = 10.6 | none |
| Scatter Glass | C | 1 | Attack | 4 to ALL, Imbue Glass, 2 Barrier | 6 to ALL | group | a crowd now and a Glass for later | 5.2 + 2.2 + 2.4 = 9.8 | not a blade attack: discharges nothing |

### Arena burst (legal actions; seat b 540 HP, no Barrier)

| Turn | Mana | Damage |
|---|---|---|
| Kindle the Blade+, Resonant Pair+ | 2 | 21 |
| Etch the Edge+, Prism Break+ | 3 | 32 |
| Ember+Ember held, Twin Edge: Kindred Shards+, Spark Thrust+ | 2 | 42 |
| Ember+Ember held, Twin Edge: Searing Edge+, Lava Bomb+ | 5 | 67 (12%) |
| Cleaving Edge out, Ember+Glass held: Double Release+, Kindle the Blade, Resonant Pair+ | 3 | 50 |
| Ward+Ward held: Wardbreak+, Glassward, Warding Strike+ | 3 | 25 and 16 Barrier |

Charges are flat and capped at two, so no turn comes near a game. The opponent sees the blade (both positions) at all times; a human
who does not attack takes nothing less: none of these cards reads an intent or needs a kill.

### Checks

- **Loops:** no new card returns a charge; Spark Thrust and Shift the Grain (0) draw nothing and make no Mana; Obsidian Insight Consumes;
  Edge Discipline draws only on a discharge that leaves a charge (at most once per pair imbued); Stored Light (a card, once a turn) and Edge Discipline are once a turn and
  needs a full blade.
- **Per card vs per charge:** Double Release answers discharge triggers twice (two charges); the echo answers none.
- **Aura copies:** two Spell-Etched Steel deal 6 an Imbue; two Sentinel Glass 8 to all a turn: both bounded by Imbues and one Ward.

## Saves, decks and replays

As for the Knight (DECISIONS #414): removed ids become their replacements (`RETIRED_CARDS`); a pre-rework Spellblade run is stamped
(`CLASS_REWORKS.spellblade`), the player told, and a fight in progress restarts. `RULES_VERSION` 34 covers all three classes so far; an
old action log replays under its own version or is rejected, never silently reread.

## Art

No new pictures. 41 cards keep theirs; those drawn as a whetstone, a forge, stars or a crown (Etch the Edge, Warm Anvil, Banked Embers,
Call the Blade, Heirloom Maul, Magma Surge, Obsidian Lance, Cataclysm) are listed for review in `docs/CLASS_REWORK_ART.md`. The 12 new
cards use the placeholder; so do the 36 of the expansion (#425, listed in `docs/CLASS_REWORK_ART.md`). In code: the Obsidian Blade panel (two positions, a mark and a word each, an empty dotted ring, the aimed
card's spend shown), the charge tiles of the choice, tooltips and a teaching tip.
