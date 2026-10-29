# The Spellblade rebuilt: Imbue and Discharge (2026-10-29, DECISIONS #417)

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

## Saves, decks and replays

As for the Knight (DECISIONS #414): removed ids become their replacements (`RETIRED_CARDS`); a pre-rework Spellblade run is stamped
(`CLASS_REWORKS.spellblade`), the player told, and a fight in progress restarts. `RULES_VERSION` 34 covers all three classes so far; an
old action log replays under its own version or is rejected, never silently reread.

## Art

No new pictures. 41 cards keep theirs; those drawn as a whetstone, a forge, stars or a crown (Etch the Edge, Warm Anvil, Banked Embers,
Call the Blade, Heirloom Maul, Magma Surge, Obsidian Lance, Cataclysm) are listed for review in `docs/CLASS_REWORK_ART.md`. The 12 new
cards use the placeholder. In code: the Obsidian Blade panel (two positions, a mark and a word each, an empty dotted ring, the aimed
card's spend shown), the charge tiles of the choice, tooltips and a teaching tip.
