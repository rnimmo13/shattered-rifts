# Spellblade redesign — review draft

**31 October 2026 · Proposal only · No game files changed**

**Recommendation: 86 reward cards, 16 Auras, three damage engines, and one shared Spell Power reserve.** Swords preserve power for sustained multihit damage; spells spend it for immediate burst; Fracture invests in marks on enemies and increasingly powerful shatters. Growing enchantments provide the recharge engine that supports long boss fights.

This is a complete proposed class card pool, plus a starting deck and three illustrative 15-card builds. It is not a claim that a player should carry all 86 cards. Numbers are an initial hand-reviewed tuning pass, not a finished balance sign-off. No balance simulations were run.

**Change summary:** 51 existing reward-card identities reworked, 29 existing rewards cut, and 35 new rewards added: 80 − 29 + 35 = 86. All three Retainer tokens are also cut; the weapon and two existing basics are reworked, and one new basic is added. Every proposed reward has a Mana cost, rarity, base effect, upgrade and role below.

## Pool size checked against the current game

Read from the live content exports and `rewardPool`, filtered to each class's own cards, on 31 October. Excludes shared Neutral cards, upgrades, basics, generated cards and other reward-ineligible entries. This avoids counting a larger token collection as a larger draft pool.

| Class | Current class-owned reward cards | Current reward Auras |
|---|---:|---:|
| Knight | 93 | 26 |
| Engineer | 90 | 20 |
| Drunkard | 89 | 24 |
| Shaman | 88 | 19 |
| Hunter | 83 | 22 |
| Necromancer | 83 | 17 |
| Trickster | 81 | 11 |
| Spellblade — current | 80 | 16 |
| Assassin | 79 | 16 |
| Monk | 78 | 21 |
| **Spellblade — proposed** | **86** | **16** |

The other classes range from 78–93 rewards; 86 is close to the middle and below Shaman's 88. The proposed pool has **90 class-owned base identities**: 86 rewards, 3 starter-only basics, and the starter-only Obsidian Blade. Shared Strike/Defend and upgrades are additional and excluded from this count.

The live pool is the Arcana/Sharpen version. The earlier two-slot Imbue/Discharge rework was reverted in decision #428; this proposal does not restore it.

## Rules for this draft

### Spell Power: the only class resource

- **SP means Spell Power**, the magic stored in her blade. It replaces both Arcana and permanent Sharpen. It is a hero-side reserve, so removing the weapon card does not disable spell or curse decks.
- SP persists between turns, has no proposed hard cap, and resets each combat. You cannot spend more than you have; there is no negative balance or automatic debt.
- Preserve current health, Mana and hand size: **75 HP, 3 Mana, 5 cards**. Proposed revised **Kindled**: start combat with 3 SP; gain 1 SP at the start of every own turn, including the first. Thus the first hand starts at 4 SP. This is one gain per own turn in PvP, not per both players' turns.
- Gain and spend occur in printed order. Optional spends are chosen when playing the card, before its effects. Fixed optional payments are all-or-nothing; "spend up to N" allows 0 through min(N, current SP). "Spend all" includes 0. Every card remains playable without SP unless its text explicitly says otherwise.
- No separate permanent blade damage, enchantment slots, stored spell payload, or Mastery counter. Growth lives on generators; curse damage scaling belongs to Fracture.

### Swords: multihit damage that usually preserves SP

For compact review notation, **Edge = floor(current SP / 3)**. It is a calculated number, not a resource, and would be shown as the actual damage on a card preview. This formula is a tuning proposal, not another user-approved mechanic.

Each Sword snapshots Edge when that card starts resolving, before its own generation or expenditure. A later card reads the new SP. No Sword gains Edge unless its text says so. This deliberately avoids doubling a high-SP finisher's benefit through both hit count and per-hit SP scaling.

Swords are Attack cards tagged Sword. Their damage follows ordinary Attack rules: Might/Primed, Exposed, Faltering, Barrier, retaliation and Traps still apply. A hit counts for explicit on-hit effects even if Barrier absorbs it; canceled hits do not apply their riders. Bonus-hit finishers display one grouped animation with readable totals, while resolving real individual hits mechanically.

### Spells: damage, protection, and curses

Spell is a tag, not a replacement for existing Attack/Skill types. Spell Attacks are mainly single-hit bursts and use existing Attack modifiers; they are not new armor-piercing damage. Defensive and Fracture-only spells are Skills. Generator and selection Skills are not automatically Spells. The full table tags each card explicitly.

An Aura is neither a Sword nor a Spell. "Previous played card" means the immediately previous card played this turn, so a utility Skill can interrupt Crosscut/Glass Armory sequencing. "Earlier this turn" is a broader historical check. Sword generation happens after its hits unless specifically printed otherwise.

### Fracture: an independent win condition

- Fracture is a visible, non-decaying enemy mark. **At 10 Fracture, remove 10 and Shatter for 18 damage.** Resolve repeatedly if an application crosses multiple thresholds; retain the remainder. Stop dealing damage to a dead target. If 7 Fracture receives 16, it shatters twice and retains 3.
- Shatter is **non-Attack damage**, blocked by Barrier. It does not use Might, Primed, Exposed or Faltering and does not trigger attack-only Thorns/Traps. It never directly applies Fracture, generates SP, or triggers another Shatter. Ordinary damage defenses still apply.
- Shatter damage begins at 18 each fight. Deep Fault and Deepening Fault increase the owner's Shatter damage for that combat. This number is not spent when a target shatters. No card lowers the threshold or multiplies all existing marks.
- Marks belong to the applying side for damage attribution and scaling. Transferring marks moves them rather than copying them; the destination immediately resolves thresholds. A transfer is not a fresh application event, though its shatters count toward the resolving card's shatter check. Subsequent printed application is a normal application.
- Spell Power is optional acceleration. Faultline Hex, Fault Memory, Deep Fault, Deepening Fault and other dedicated cards let the curse deck generate pressure and scale without spending SP, without kills, and without the enemy attacking.
- A card's "caused a Shatter" checks any Shatter it produced. Aura payoffs trigger after the entire card resolves. For example, Deepening Fault cannot improve a Shatter from the same card that activated its increase. End-turn Aura applications do not activate card-only payoffs.
- Provisional PvP interaction: treat Fracture application as a debuff for Steadfast and other existing prevention. Prevention blocks that application, not the later Shatter damage event. Implementations must specify and test this interaction; the design is not relying on hidden enemy intentions.

### Growing cards, copies, and Auras

Deepening Enchantment and Growing Crucible increase the SP yield of **that physical card**, after it resolves. Fault Memory similarly improves its own Fracture application. Growth persists through discard and reshuffle, but resets after the fight. Upgrading a grown card preserves earned growth and changes only its printed base.

For this proposed ruleset, copied or newly created cards start at their printed base yield, with no inherited combat growth; returning the same card preserves it. Free replays can produce the current yield but cannot increase that card's yield again during the same originating card play. Likewise a replay of Fault Memory may apply its current amount but grants no additional growth. This is an explicit proposed guard against external replay interactions, not an existing engine guarantee.

Each Aura copy has its own once-per-turn trigger and stacks additively. Five copies can therefore give five bounded payoffs; this is included in the risk notes. Replays do not reset those limits. Growing-generator Aura triggers refer to a card increasing **itself**, so The Forgemaster modifying a different card does not activate Sigil of Kindling or Crucible Heart. Bonus growth from Crucible Heart does not recursively trigger another Heart. Auras never grow themselves.

Ordinary upgraded Auras replace the base card's effect; they are not additional free copies. All "this turn" effects end with the player's turn. Consume removes a card for the fight under existing rules. No proposed card returns a Consumed card, creates copies, or generates Mana.

## Proposed starting deck — 10 cards

3 Strike, 3 Defend, 1 Obsidian Blade, 1 Gather Power, 1 Cinderfall, 1 Hairline Hex. This replaces one current Strike with a simple Fracture introduction while keeping a 10-card starter. All can be removed through the normal deck-removal systems.

| Signature | Mana | Base | Upgrade |
|---|---:|---|---|
| Obsidian Blade — Sword, starter-only weapon | 2 | Hold. Opening hand. Strike for 3 + Edge three times. | Base damage 4 per hit. |
| Gather Power — basic Skill; formerly Gather Arcana | 1 | Gain 2 SP. | Gain 3 SP. |
| Cinderfall — basic Spell Attack | 1 | Spend up to 2 SP. Deal 4 damage plus 4 per SP spent. | Base damage 7. |
| Hairline Hex — new basic Spell Skill | 1 | Apply 5 Fracture. Gain 2 Barrier. | Apply 6 Fracture; Barrier 3. |

Obsidian Blade remains a real removable starter card with Opening hand, not an automatic card created by the trait. Starter-only cards are excluded from rewards. Hairline **Hex** is a basic; Hairline **Crack** in the reward pool is a different, zero-Mana Consume card.

The first-turn baseline at 4 SP is Edge 1: Obsidian Blade hits for 4 × 3 = 12 before modifiers. Gather Power first raises SP to 6, so a three-Mana Gather Power + Blade turn deals 15 and retains 6 SP. Cinderfall can instead spend two SP for 12 damage, or Hairline Hex can begin the curse route. The starter showcases the options without guaranteeing all three in every opening hand.


## Full reward pool

86 distinct class-owned reward cards. C = Common; U = Uncommon; R = Rare. Mana is paid in addition to any SP spent. The upgrade column lists only changes; all other text remains. Each Sword is an Attack. Spell / Attack and Spell / Skill are explicit tags on the existing card types. Auras are neither Swords nor Spells. Edge and spending rules are defined above.

### Generation and growing enchantments — 14

| # | Card | Rarity / Mana | Type | Base effect | Upgrade | Role / decision |
|---|---|---|---|---|---|---|
| 1 | **Forged in Fury** | C / 1 | Sword | Strike for 6 + Edge. Gain 1 SP after the hit. | Base damage 9. | Attack while rebuilding; snapshot before generation. |
| 2 | **Deepening Enchantment** | C / 1 | Skill | Gain 3 SP. This physical card gains +1 to its SP yield for this combat after resolving. | Starting yield 4; growth remains +1. | Core repeat-use generator; replaces Whetstone. |
| 3 | **Faint Ember** | C / 1 | Skill | Gain 2 SP. Draw 1. | Gain 3 SP. | Efficient cycling with a real Mana cost. |
| 4 | **Ember Cache** | C / 1 | Skill | Gain 1 SP now and 3 SP at the start of your next turn. | Next-turn gain 4. | Telegraphed preparation; loses tempo now. |
| 5 | **Pale Ward** | C / 1 | Spell / Skill | Gain 6 Barrier and 1 SP. | Barrier 9. | Defend without reducing your reserve. |
| 6 | **Emberstrike** | C / 1 | Sword | Strike for 3 + Edge twice. If you played a Spell earlier this turn, gain 2 SP after the hits. | Base damage 4 per hit. | Sword/spell sequencing bridge. |
| 7 | **Empty Crucible** | C / 1 | Skill | Gain 3 SP; gain 2 more if you had 0 SP when this card began. | Base gain 4. | Recovery after cashing out; weaker while hoarding. |
| 8 | **Bladewall** | U / 2 | Spell / Skill | Gain 12 Barrier and 3 SP. | Barrier 15. | Large defensive recharge. |
| 9 | **Banked Embers** | U / 1 | Skill | Gain 4 SP at the start of your next turn. Choose a card in hand to Hold this turn. | Next-turn SP 5. | Prepare a finisher without immediate output. |
| 10 | **Growing Crucible** | U / 2 | Skill | Gain 5 SP and 4 Barrier. This physical card gains +2 to its SP yield for this combat after resolving. | Barrier 7; starting yield unchanged. | Slower, more explosive repeat-use investment. |
| 11 | **Measured Recharge** | U / 1 | Skill | Gain 3 SP. If you spent at least 3 SP earlier this turn, draw 1. | Gain 4 SP. | Supports repeated medium spells rather than only all-in turns. |
| 12 | **Magma Surge** | R / 0 | Skill | Gain 3 SP. Consume. | Gain 4 SP. | Immediate acceleration that cannot cycle indefinitely. |
| 13 | **The Forgemaster** | R / 2 | Skill | Gain 6 SP. Choose a generator card in hand; increase its printed SP yield by 2 for this combat. Consume. | Gain 8 SP. | Paid investment in one generator; no global copy scaling. |
| 14 | **Last Ember** | U / 0 | Skill | Gain 2 SP. If you began this card at 0 SP, also gain 5 Barrier. Consume. | Barrier 8. | Emergency rebuild, no repeatable free engine. |

### Sword attacks and sword setup — 16

| # | Card | Rarity / Mana | Type | Base effect | Upgrade | Role / decision |
|---|---|---|---|---|---|---|
| 15 | **Obsidian Flurry** | C / 2 | Sword | Strike for 4 + Edge three times. | Base damage 5 per hit. | Reliable reserve-based single-target damage. |
| 16 | **Obsidian Lance** | C / 1 | Sword | Strike for 7 + twice Edge. | Base damage 10. | One hit against retaliation; less Might multiplication. |
| 17 | **Glint** | C / 1 | Sword | Strike for 5 + Edge. Draw 1. | Base damage 8. | Sword cycling without a free return loop. |
| 18 | **Etching Edge** | C / 1 | Sword | Strike for 2 + Edge twice. Apply 1 Fracture after each hit. | Base damage 3 per hit. | Accessible sword-to-Fracture bridge. |
| 19 | **Shard Strike** | U / 1 | Sword | Strike for 5 + Edge twice. If you have at least 9 SP, gain 4 Barrier. | Base damage 6 per hit. | Reward maintaining charge, not unlimited extra hits. |
| 20 | **Rift Sweep** | C / 2 | Sword | Strike all enemies for 3 + Edge twice. | Base damage 4 per hit. | Sword group coverage; each target takes both hits. |
| 21 | **Glass Needle** | C / 0 | Sword | Strike for 3 + Edge. Consume. | Base damage 5. | Cheap scaling hit that cannot repeat freely. |
| 22 | **Crowned Edge** | U / 1 | Skill | Your next Sword this turn gains +3 damage per hit, for at most its first 4 hits. Draw 1. | Bonus +4. | Bounded burst setup; not a global damage doubler. |
| 23 | **Call the Blade** | U / 1 | Skill | Return a chosen Sword from your discard pile to your hand. Gain 2 SP. | Gain 3 SP. | Paid retrieval; does not fetch Consume cards or create a blade. |
| 24 | **Tyrant Strike** | U / 2 | Sword | Strike for 5 + Edge three times. If you spent SP earlier this turn, apply 2 Exposed after the hits. | Base damage 6 per hit. | Sequence a spell before a sword; debuff helps later cards. |
| 25 | **Crosscut** | U / 1 | Sword | Strike for 3 + Edge twice. If a Spell was your previous played card this turn, strike a third time. | Base damage 4 per hit. | A weave payoff with an exact ordering requirement. |
| 26 | **Fault Piercer** | U / 2 | Sword | Strike for 4 + Edge three times. If the target had Fracture when this card began, apply 3 Fracture after the hits. | Base damage 5 per hit. | Works on one boss; no kill requirement. |
| 27 | **Thousand Shards** | R / 2 | Sword | Spend any amount of SP. Strike one target for 4 damage per SP spent. This card does not gain Edge. Consume. | Damage 5 per hit. | The huge targeted multihit finisher; loses the reserve. |
| 28 | **Obsidian Drill** | R / 3 | Sword | Spend up to 6 SP. Strike for 6 damage three times, plus once per SP spent. Does not gain Edge. | Base damage 7 per hit. | Repeatable capped-hit spender; distinct from all-in finisher. |
| 29 | **Hammer and Anvil** | R / 2 | Sword | Strike for 3 + Edge four times. After all hits, gain 1 SP for each distinct enemy you personally hit with a Sword this turn, up to 3. | Base damage 4 per hit. | Sustained attack; group setup improves its recharge. |
| 30 | **Guarded Cut** | C / 1 | Sword | Strike for 4 + Edge. Gain 4 Barrier. | Barrier 6. | Basic defensive sword option. |

### Burst and control spells — 12

| # | Card | Rarity / Mana | Type | Base effect | Upgrade | Role / decision |
|---|---|---|---|---|---|---|
| 31 | **Spellbolt** | C / 1 | Spell / Attack | Spend up to 2 SP. Deal 6 damage plus 5 per SP spent. | Base damage 9. | Small efficient release; preserves part of a reserve. |
| 32 | **Arcane Pulse** | C / 1 | Spell / Attack | Spend up to 3 SP. Deal 3 damage to all enemies plus 3 per SP spent. | Base damage 5. | Early group clear. |
| 33 | **Glass Burst** | U / 1 | Spell / Attack | Spend up to 3 SP. Deal 5 damage plus 5 per SP spent. If you spent 3, apply 1 Exposed and 1 Faltering. | Base damage 8. | Medium burst with control instead of maximum damage. |
| 34 | **Molten Ruin** | U / 2 | Spell / Attack | Spend all SP. Deal 12 damage plus 6 per SP spent. | Base damage 18. | Accessible boss finisher; no rare required. |
| 35 | **Arcane Flood** | U / 2 | Spell / Attack | Spend all SP. Deal 8 damage to all enemies plus 4 per SP spent. | Base damage 12. | All-in area spell; weaker than Molten Ruin on one target. |
| 36 | **Falling Shards** | U / 1 | Spell / Attack | Spend up to 4 SP. Deal 7 damage plus 5 per SP spent to one enemy. If it dies, apply Fracture equal to SP spent to every other enemy. | Base damage 10. | One-hit cleanup with a group rider; still useful against a boss. |
| 37 | **Lava Bomb** | R / 3 | Spell / Attack | Spend all SP. Deal 20 damage plus 8 per SP spent. Consume. | Base damage 28. | Largest single spell coefficient; full-turn commitment. |
| 38 | **Dying Ember** | R / 2 | Spell / Attack | Spend up to 4 SP. Deal 8 damage to all enemies plus 3 per SP spent. Apply 2 Faltering to all enemies. | Base damage 11. | Control-heavy burst that can retain excess power. |
| 39 | **Cataclysm** | R / 3 | Spell / Attack | Spend all SP. Deal 12 damage to all enemies plus 6 per SP spent. Consume. | Base damage 18. | Large group burst; no junk or card-creation engine. |
| 40 | **Tempered Bolt** | C / 1 | Spell / Attack | Deal 7 damage. If you began this card at 0 SP, gain 2 SP after the hit. | Base damage 10. | Useful spell when dry; recovery without a dedicated generator. |
| 41 | **Glassbrand** | C / 1 | Spell / Attack | Deal 5 damage. Apply 3 Fracture. | Base damage 8. | Immediate spell damage with an independent curse contribution. |
| 42 | **Controlled Release** | U / 1 | Spell / Attack | Spend up to 3 SP. Deal 4 damage plus 4 per SP spent. If you spent at least 1 SP and still have SP, draw 1. | Base damage 7. | Partial-spend bridge; lower damage pays for cycling. |

### Fracture application and payoffs — 14

| # | Card | Rarity / Mana | Type | Base effect | Upgrade | Role / decision |
|---|---|---|---|---|---|---|
| 43 | **Faultline Hex** | C / 1 | Spell / Skill | Apply 7 Fracture to one enemy. | Apply 9. | Core pure-curse application; requires no SP. |
| 44 | **Spreading Fault** | C / 1 | Spell / Skill | Apply 4 Fracture to all enemies. | Apply 6. | Wide application; no kills needed. |
| 45 | **Stress the Glass** | U / 1 | Spell / Skill | Spend up to 4 SP. Apply 4 Fracture plus 2 per SP spent. | Base Fracture 6. | SP accelerates a curse deck without replacing free application. |
| 46 | **Pressure Point** | C / 1 | Spell / Skill | Apply 4 Fracture. If this card caused a Shatter, draw 1. | Apply 6. | Exact threshold timing; moderate without a detonation. |
| 47 | **Glass Prison** | C / 1 | Spell / Skill | Gain 5 Barrier. Apply 3 Fracture. | Barrier 7. | Advance a win condition while defending. |
| 48 | **Crack the Shell** | C / 1 | Spell / Skill | Remove up to 6 enemy Barrier. Apply 5 Fracture. | Remove up to 10 Barrier; Fracture unchanged. | Counter defense without making all Shatter bypass Barrier. |
| 49 | **Fault Memory** | U / 1 | Spell / Skill | Apply 5 Fracture. This physical card applies 2 more Fracture each time it is played this combat, after resolving. | Starting Fracture 7; growth unchanged. | Rare-independent scaling for the curse archetype. |
| 50 | **Final Shatter** | U / 2 | Spell / Skill | Apply 10 Fracture to one enemy. Gain 6 Barrier if this card caused a Shatter. | Apply 13. | Guaranteed threshold progress even against one boss. |
| 51 | **Collapsing Vein** | U / 2 | Spell / Skill | Apply 5 Fracture to all enemies, then 5 more to a chosen enemy. | First application 7 to all; chosen bonus unchanged. | Focus one enemy while preparing others. |
| 52 | **Carry the Fault** | U / 1 | Spell / Skill | Move all remaining Fracture from one enemy to a different enemy, then apply 4 to the destination. With only one enemy, apply 7 to it instead. | Destination bonus 6; single-enemy application 9. | Rescue marks on an awkward target; explicit solo fallback. |
| 53 | **Hairline Crack** | C / 0 | Spell / Skill | Apply 4 Fracture. Consume. | Apply 6. | Cheap threshold finisher; no infinite cycling. |
| 54 | **Rupture Script** | R / 2 | Spell / Skill | Apply 18 Fracture to one enemy. Consume. | Apply 24. | Front-load multiple shatters; does not require existing marks. |
| 55 | **Deep Fault** | U / 2 | Spell / Skill | Increase your Shatter damage by 6 for this combat. Apply 4 Fracture. Consume. | Increase by 8. | Direct, uncommon boss scaling; attack-independent. |
| 56 | **Breaking Point** | R / 2 | Spell / Skill | Deal your current Shatter damage to one enemy, then apply 8 Fracture. The first damage is not a Shatter event. Consume. | Apply 12 Fracture. | Cash in damage scaling without recursive trigger abuse. |

### Defense, selection, and timing — 14

| # | Card | Rarity / Mana | Type | Base effect | Upgrade | Role / decision |
|---|---|---|---|---|---|---|
| 57 | **Arcane Barrier** | C / 1 | Spell / Skill | Spend up to 3 SP. Gain 5 Barrier plus 3 per SP spent. | Base Barrier 8. | Flexible defense with an opportunity cost. |
| 58 | **Glass Wall** | U / 2 | Spell / Skill | Spend up to 5 SP. Gain 12 Barrier plus 3 per SP spent. Hold. | Base Barrier 16. | Emergency protection; no return-to-hand loop. |
| 59 | **Mirror Glass** | U / 1 | Spell / Skill | Gain 7 Barrier. You may spend 2 SP to also gain 1 Shielded. | Barrier 10. | Anti-large-hit defense; optional fixed payment. |
| 60 | **Glass Veil** | C / 2 | Spell / Skill | Gain 10 Barrier now and 6 Barrier at the start of your next turn. | Barrier now 13. | Defense without spending charge; delayed protection. |
| 61 | **Hollow Gaze** | C / 1 | Spell / Skill | Gain 5 Barrier. Put a chosen card from your discard pile on top of your draw pile. | Barrier 8. | Prepare a generator or payoff; no immediate recursion. |
| 62 | **Ash Wind** | U / 1 | Skill | Draw 3 cards, then discard 1. | Draw 4, then discard 1. | Hand filtering; no Mana generation. |
| 63 | **Read the Embers** | U / 2 | Skill | Draw 5 cards. | Cost 1. | Large draw competes with burst Mana. |
| 64 | **Scheme** | U / 1 | Skill | Draw 2 additional cards at the start of your next turn. Gain 4 Barrier now. | Barrier 7. | Prepare a big turn while surviving. |
| 65 | **Feint** | C / 1 | Skill | Gain 7 Barrier. Your next Sword this turn gains 2 damage on its first hit only. | Barrier 10. | Defense plus bounded sword setup. |
| 66 | **Unbreakable Crown** | R / 2 | Spell / Skill | Gain 18 Barrier and 1 Steadfast. If you have at least 10 SP, gain 8 more Barrier. Consume. | Base Barrier 24. | Reserve-based defense with no resource spend; one use. |
| 67 | **Fated Hand** | R / 1 | Skill | Choose 2 cards in your draw pile and place them on top in your chosen order. Draw 1. Consume. | Draw 2. | Paid setup for engines or finishers; finite tutor. |
| 68 | **Temper the Glass** | C / 1 | Spell / Skill | Gain 6 Barrier. Remove up to 2 Faltering from yourself. | Barrier 9. | Debuff management for multihit decks. |
| 69 | **Steady Inscription** | U / 1 | Skill | Gain 5 Barrier. Choose another card in hand; it gains Hold for this combat. | Barrier 8. | Keep a generator or release without making it cheaper. |
| 70 | **Recenter** | U / 1 | Skill | Draw 2 cards. If you played both a Sword and a Spell earlier this turn, gain 2 SP. | Draw 3. | Weaving consistency; cannot pay its own Mana cost. |

### Auras — 16

| # | Card | Rarity / Mana | Type | Base effect | Upgrade | Role / decision |
|---|---|---|---|---|---|---|
| 71 | **Warm Anvil** | U / 2 | Aura | At the start of your turn, gain 2 SP. | Gain 3 SP. | Unconditional long-fight recharge; delayed return. |
| 72 | **Sigil of Kindling** | U / 1 | Aura | The first time each turn a card increases its own generator yield, gain 1 additional SP. | Also gain 2 Barrier on that trigger. | Growing-generator specialization; per turn, not per replay. |
| 73 | **Glass Guard** | U / 1 | Aura | After your first Sword each turn resolves, gain 4 Barrier. | Gain 6 Barrier. | Sword sustain; per card, never per hit. |
| 74 | **Cleaving Edge** | R / 2 | Aura | After your first single-target Sword each turn, deal non-attack damage equal to Edge to each other enemy. | Deal Edge + 2 instead. | Secondary-target pressure; no full weapon AoE conversion. |
| 75 | **Echoing Blade** | R / 2 | Aura | After your first Sword each turn, deal non-attack damage equal to twice Edge to its primary target. | Deal three times Edge instead. | Reserve payoff; no replay, no extra hits or Fracture triggers. |
| 76 | **Sigil of Glass** | U / 1 | Aura | After the first card each turn that spends at least 3 SP, gain 5 Barrier. | Gain 7 Barrier. | Caster sustain with a threshold; not Barrier per SP. |
| 77 | **Obsidian Aegis** | R / 2 | Aura | At the end of your turn, gain Barrier equal to half your SP, rounded down, up to 12. | Cap 16. | Defensive reserve build; consumes no SP but needs investment. |
| 78 | **Glass Armory** | U / 1 | Aura | After the first Sword each turn that follows a Spell as your previous played card, gain 2 SP. | Gain 3 SP. | Weaving engine; pays after damage, never recursively. |
| 79 | **Pillar of Glass** | U / 1 | Aura | After the first card each turn that causes at least one Shatter, gain 6 Barrier. | Gain 8 Barrier. | Curse sustain, independent of opponent attacking. |
| 80 | **Hungering Void** | U / 2 | Aura | At the end of your turn, apply 2 Fracture to each enemy that already has Fracture. | Apply 3. | Slow curse pressure; fully cleared marks need reapplication. |
| 81 | **Deepening Fault** | U / 2 | Aura | After the first card each turn that applies Fracture finishes resolving, increase your Shatter damage by 2 for this combat. | Increase by 3. | Accessible curse scaling; no bonus to the triggering card. |
| 82 | **Patient Edge** | U / 1 | Aura | At the end of your turn, if you spent no SP this turn, gain 2 SP. | Also gain 2 Barrier. | Rewards holding; conflicts with frequent spending. |
| 83 | **Afterglow** | U / 1 | Aura | After your first card each turn that spends SP finishes, if you now have 0 SP, draw 1 card. | Also gain 3 Barrier. | Empty-reserve recovery without refunding the spend. |
| 84 | **Crucible Heart** | R / 2 | Aura | The first time each turn a card increases its own generator yield, increase that same card's yield by 1 more. | Cost 1. | Investment compounds within individual generators, not copies. |
| 85 | **Measured Ruin** | R / 2 | Aura | Your first Spell Attack each turn that spends SP gains 2 damage per SP spent, up to 16 bonus damage. | Cap 24. | Burst specialization with a bounded additional coefficient. |
| 86 | **Fault Reader** | U / 1 | Aura | After your first card each turn that causes a Shatter, draw 1 card. | Also gain 2 Barrier. | Curse consistency; never draws per shatter. |

## Current-card disposition

Every current class-owned base card is accounted for here. A retained name does **not** mean the old effect survives: all 51 retained reward identities are reworked under the table above.

### Reward cards cut — 29

| Current card | Why cut it |
|---|---|
| Spoils | Free-form draw plus permanent Sharpen is replaced by paid generation and specialized selection. |
| Tyrant's Stomp | Draw-to-cheapen attack does not serve the three proposed engines. |
| Crowned Fist | Draw-to-grow damage is replaced by play-to-grow generator cards. |
| Heat of the Forge | Generic next-attack amplification overlaps Crowned Edge; removes a dangerous unbounded multihit multiplier. |
| Humble | Generic free double debuff is covered by paid control spells. |
| Ley Line | SP-to-Mana conversion risks turning growing generators into a self-funding loop. |
| Weight of the Crown | Permanent Might plus enemy Might reduction is outside the new identity and compounds multihit. |
| Arcane Burst | A resource-cost-to-larger-resource-gain exchange is replaced by explicit generators. |
| Seven Shards | Large fixed AoE multihit spell blurs the sword/spell split; Cataclysm fills the burst role. |
| Weigh the Crown | Random triple Skill replay interacts explosively with growing generators. |
| Magma Crash | Rubble-generation package is removed. |
| Molten Weight | Generic AoE Sapped attack overlaps Dying Ember and does not advance the new engine. |
| Out of My Sight! | Retainer transformations are removed. |
| Hex Volley | Attack hits per Skill played creates another uncapped multihit axis; Crosscut covers weaving. |
| Sigil of Momentum | Generic every-N-cards Mana engine competes with the intended SP economy. |
| Distant Ember | Generic five-card-turn draw is replaced by archetype-specific consistency. |
| Sigil of Wandering | Neutral-card generation is removed from the class identity. |
| To Arms! | Retainer transformations are removed. |
| Royal Decree | Neutral discovery is replaced by deliberate deck selection. |
| Grand Speech | Generic per-card Might engine would compound the new high-hit finishers. |
| Wild Spark | Neutral-card generation is removed. |
| Endless Barrage | Replay-from-Consume attack is unrelated to the new engines and complicates finite finishers. |
| Heirloom Maul | Neutral copying is removed; copying grown generators needs a separate explicit policy. |
| By Decree | Free recurring attack creates a cheap payoff loop with Skill-heavy generators. |
| Tyrant's Gaze | Per-Attack enemy suppression is replaced by paid defense and bounded Aura sustain. |
| Iron Rule | Generic random Consume/draw is replaced by focused selection tools. |
| Hollow Form | Free-play turns bypass the Mana constraint that makes generation and spending meaningful. |
| Rift Gifts | Neutral-card generation is removed. |
| Call the Guard! | Retainer transformations are removed. |

### Reward identities retained and reworked — 51

| Current name | Proposed name | Source ID (reference only) |
|---|---|---|
| Forged in Fury | Forged in Fury | forged-in-fury |
| Whetstone | Deepening Enchantment | whetstone |
| Faint Ember | Faint Ember | faint-glow |
| Ember Cache | Ember Cache | ember-cache |
| Pale Ward | Pale Ward | pale-beacon |
| Emberstrike | Emberstrike | sunstrike |
| Bladewall | Bladewall | bladewall |
| Banked Embers | Banked Embers | banked-embers |
| Magma Surge | Magma Surge | big-bang |
| The Forgemaster | The Forgemaster | the-forgemaster |
| Obsidian Flurry | Obsidian Flurry | obsidian-flurry |
| Obsidian Lance | Obsidian Lance | cosmic-lance |
| Glint | Glint | gleam |
| Shard Strike | Shard Strike | shard-strike |
| Crowned Edge | Crowned Edge | conqueror |
| Call the Blade | Call the Blade | call-the-blade |
| Tyrant Strike | Tyrant Strike | sovereign-strike |
| Obsidian Drill | Obsidian Drill | obsidian-drill |
| Hammer and Anvil | Hammer and Anvil | hammer-and-anvil |
| Spellbolt | Spellbolt | skybolt |
| Arcane Pulse | Arcane Pulse | astral-pulse |
| Glass Burst | Glass Burst | gamma-burst |
| Molten Ruin | Molten Ruin | devastate |
| Arcane Flood | Arcane Flood | radiance |
| Falling Shards | Falling Shards | falling-sky |
| Lava Bomb | Lava Bomb | comet |
| Dying Ember | Dying Ember | dying-star |
| Cataclysm | Cataclysm | supernova |
| Final Shatter | Final Shatter | final-shatter |
| Collapsing Vein | Collapsing Vein | collapsing-star |
| Arcane Barrier | Arcane Barrier | star-barrier |
| Glass Wall | Glass Wall | glass-wall |
| Mirror Glass | Mirror Glass | mirror-glass |
| Glass Veil | Glass Veil | glass-veil |
| Hollow Gaze | Hollow Gaze | hollow-gaze |
| Ash Wind | Ash Wind | stellar-wind |
| Read the Embers | Read the Embers | read-the-embers |
| Scheme | Scheme | scheme |
| Feint | Feint | feint |
| Unbreakable Crown | Unbreakable Crown | unbreakable-crown |
| Fated Hand | Fated Hand | fated-hand |
| Warm Anvil | Warm Anvil | warm-anvil |
| Sigil of Kindling | Sigil of Kindling | orion |
| Glass Guard | Glass Guard | parry |
| Cleaving Edge | Cleaving Edge | cleaving-edge |
| Echoing Blade | Echoing Blade | echoing-blade |
| Sigil of Glass | Sigil of Glass | cygnus |
| Obsidian Aegis | Obsidian Aegis | obsidian-aegis |
| Glass Armory | Glass Armory | glass-armory |
| Pillar of Glass | Pillar of Glass | pillar-of-light |
| Hungering Void | Hungering Void | gravity-well |

### New reward cards — 35

Empty Crucible; Growing Crucible; Measured Recharge; Last Ember; Etching Edge; Rift Sweep; Glass Needle; Crosscut; Fault Piercer; Thousand Shards; Guarded Cut; Tempered Bolt; Glassbrand; Controlled Release; Faultline Hex; Spreading Fault; Stress the Glass; Pressure Point; Glass Prison; Crack the Shell; Fault Memory; Carry the Fault; Hairline Crack; Rupture Script; Deep Fault; Breaking Point; Temper the Glass; Steady Inscription; Recenter; Deepening Fault; Patient Edge; Afterglow; Crucible Heart; Measured Ruin; Fault Reader.

### Basics, weapon, and generated cards

| Existing card | Proposal |
|---|---|
| Cinderfall | Rework as the starter burst spell below. |
| Gather Arcana | Rename Gather Power; generates SP. |
| Obsidian Blade | Keep as a removable starter-only weapon; rework as multihit. No permanent weapon bonus. |
| Retainer Strike | Cut generated card. |
| Retainer Dive | Cut generated card. |
| Retainer Guard | Cut generated card. |
| Rubble (junk-owned, not part of the 86 class-owned count) | Remove Spellblade sources; retain globally if anything else uses it. |
| Hairline Hex | New starter-only basic, not a reward card. |

Count reconciliation: current 80 rewards − 29 cuts + 35 new rewards = **86 rewards**. Current 86 class-owned base identities − 29 reward cuts − 3 Retainer tokens + 35 new rewards + 1 new basic = **90 proposed class-owned base identities**. Shared Strike and Defend do not count toward either class-owned total. Upgrades are excluded throughout.

## Example review decks — 15 cards each

These are curated **build examples**, not guaranteed campaign reward sequences. They use base cards, no upgrades, no rares and no external boons. Each contains at most two copies of a reward card, within the current five-copy ceiling, and has 15 cards, matching the current Arena minimum. Most campaign decks will be less tidy and include additional basics; these lists show the intended destination.

### Charged swordswoman

| Card | Copies |
|---|---:|
| Obsidian Blade | 1 |
| Deepening Enchantment | 2 |
| Faint Ember | 1 |
| Pale Ward | 2 |
| Obsidian Flurry | 2 |
| Glint | 1 |
| Guarded Cut | 1 |
| Call the Blade | 1 |
| Glass Guard | 1 |
| Patient Edge | 1 |
| Spellbolt | 1 |
| Arcane Barrier | 1 |

Maintain a reserve, use multihit damage repeatedly, and decide whether an immediate spell or defensive spend is worth weakening the next Sword. Patient Edge helps a holding strategy, but provides nothing on a spending turn. Optional rare destinations: Echoing Blade for sustained scaling; Thousand Shards for one decisive cash-out. Neither is needed for the build to work.

### Growing burst caster

| Card | Copies |
|---|---:|
| Deepening Enchantment | 2 |
| Growing Crucible | 1 |
| Ember Cache | 1 |
| Faint Ember | 1 |
| Pale Ward | 2 |
| Spellbolt | 1 |
| Molten Ruin | 2 |
| Arcane Pulse | 1 |
| Glass Wall | 1 |
| Ash Wind | 1 |
| Warm Anvil | 1 |
| Afterglow | 1 |

The starter weapon has been removed in this example. Grow the generator cards, use limited spends when possible, and cash out with Molten Ruin. Growing recharge allows repeated boss bursts. Warm Anvil costs setup tempo; Afterglow improves recovery without refunding SP. Optional rares: Lava Bomb for a larger one-time release, Crucible Heart for generator investment.

### Fracture control

| Card | Copies |
|---|---:|
| Faultline Hex | 2 |
| Fault Memory | 2 |
| Glass Prison | 2 |
| Stress the Glass | 1 |
| Spreading Fault | 1 |
| Final Shatter | 1 |
| Deep Fault | 1 |
| Deepening Fault | 1 |
| Pillar of Glass | 1 |
| Ash Wind | 1 |
| Arcane Barrier | 1 |
| Pale Ward | 1 |

Scale application with Fault Memory and damage with Deep Fault/Deepening Fault. Use the passive SP supply for defensive magic or Stress the Glass. The build functions without drawing a Sword or a direct damage Spell. Against a single boss, most cards apply marks directly; Spreading Fault is less efficient but still works. Optional rare destinations: Rupture Script and Breaking Point.

Hybrid direction: substitute Etching Edge, Fault Piercer and Glass Armory into the sword list for Fracture/weaving; use Controlled Release in caster lists to keep enough reserve for Swords. Defensive cards create time for a chosen win condition; they are not a fourth independent damage engine.

## Hand calculations and first-pass costing

### What the numbers are based on

The repository's `docs/14_CARD_COSTING.md` sets common budgets of approximately 6/10/19/28 points for 0/1/2/3 Mana, about 112% for uncommon and 125% for rare; Barrier is about 1.2 points, extra draw about 3, and AoE about 1.3 times its printed damage. These are design heuristics, not proofs. The guide contains stale statements claiming Arcana is no longer live; the actual pool and decision #428 establish that it was restored.

Working new-mechanic rates for review:

- **SP gained: provisional 3 points per SP**, checked at 4–12 stored SP in ordinary mid-fight states and 20–40 in committed builds. Unlike the old Arcana rate, SP has holding value as well as spending value. A fixed exchange rate understates repeated Sword use, so compare full sequences as well.
- **SP spent on direct single-target spells: generally 4–6 extra damage**, rising to 8 for a 3-Mana rare Consume finisher. Area spending is generally 3–4 per enemy, or 6 for the matching 3-Mana rare Consume finisher. No SP-spend bonus is added to Sword damage unless printed.
- **Fracture: provisional 1.3 points per mark at base Shatter damage 18**, reflecting 1.8 eventual damage per mark with threshold delay and possible leftover marks. At Shatter damage 30 the eventual rate becomes 3 per mark; this increase must be treated as intentional engine scaling, not a cheap application bonus.
- **Edge:** at SP 4/9/18/30, Edge is 1/3/6/10. Price all hits, then check high-SP states and external Might. Edge does not grant global damage to cards without an Edge term.
- Growing-generator cards are deliberately below full immediate output and earn value over later plays. Growth is not capped to ordinary 4–6-turn fights: boss potential is part of the point. That also makes small-deck cycling a priority for actual testing.

Representative checks (base cards; rough points):

| Card | Calculation | Reading |
|---|---|---|
| Faint Ember | 2 SP × 3 + draw 1 × 3 = 9 | Near the 10-point common budget. |
| Pale Ward | 6 Barrier × 1.2 + 1 SP × 3 = 10.2 | Basic defense/recharge anchor. |
| Deepening Enchantment | First play 3 SP × 3 = 9; then yields 4/5/6 SP | Engine payoff deliberately rises above the first-play budget. |
| Glass Prison | 5 Barrier × 1.2 + 3 Fracture × 1.3 = 9.9 | Defense/application anchor before curse scaling. |
| Faultline Hex | 7 Fracture × 1.3 = 9.1 | Near common budget, with remainder risk. |
| Arcane Barrier, spending 3 SP | 14 Barrier = 16.8 gross points, plus the cost of surrendering the reserve | Less damage-efficient than a spell; defense has immediate survival value. |
| Obsidian Flurry, at 9 SP | (4 + 3) × 3 = 21 | Slightly above common 2-Mana baseline after building the reserve. |
| Spellbolt, spending 2 SP | 6 + 5 × 2 = 16 damage | Requires a generator/trait investment and reduces future Sword output. |
| Warm Anvil | 2 SP × 4 future turns × 3 = 24 | Below the guide's ~32-point four-turn uncommon 2-Mana target, with high long-fight utility. |
| Glass Guard | 4 Barrier × 4 turns × 1.2 = 19.2 | Above the ~16.8-point uncommon 1-Mana Aura target; flagged for tuning with multiple copies. |

These checks anchor the proposal; they are **not a completed per-card costing ledger for all 86 cards**. In particular upgraded Auras, external multipliers, reward availability and boss encounter tuning need a full implementation-time pass.

### Legal three-Mana choices from the same reserve

Assume a turn has already begun, you have **10 SP**, 3 Mana, and a Deepening Enchantment that has been played twice (current yield 5). No Might, Exposed, Auras or extra Mana. Its two prior plays are prior setup, not free gains this turn.

| Play | Mana | Damage now | SP afterward |
|---|---:|---:|---:|
| Deepening Enchantment → Obsidian Flurry | 1 + 2 | SP becomes 15; Edge 5; 3 × (4 + 5) = **27** | **15** |
| Deepening Enchantment → Molten Ruin | 1 + 2 | SP becomes 15; 12 + 6 × 15 = **102** | **0** |
| Deepening Enchantment → Thousand Shards | 1 + 2 | Spend 15; 15 × 4 = **60**, across 15 hits | **0**; finisher Consumed |

This is an intentional trade: the spell produces much more immediate damage than a reserve-preserving Sword. The sword finisher has lower printed damage than the spell but amplifies external per-hit buffs: with 3 Might it would deal 15 × 7 = **105** before other modifiers, versus 105 for Molten Ruin's single hit. It is vulnerable to per-hit retaliation and costs a Consume card. These are comparisons of supported states, not damage ceilings or claims about likely draw sequences.

### Visible long-fight potential without a rare

At **27 SP**, base Obsidian Flurry deals (4 + 9) × 3 = **39** for 2 Mana while retaining the reserve; Molten Ruin deals 12 + 6 × 27 = **174** for 2 Mana and empties it. A state of 27 SP is arithmetically reachable by turn six with 3 initial SP + 6 passive SP + four plays of the same Deepening Enchantment (3 + 4 + 5 + 6 = 18), assuming you spent no SP. Those plays need to be drawn/returned and paid for; this is a setup illustration, not a guaranteed curve.

### Fracture turn without any SP expenditure

Assume one Deepening Fault is already active, current Shatter damage is 24 from prior setup, the target has 6 Fracture, and you have 3 Mana. Play Faultline Hex (1), then Final Shatter (2):

1. Faultline adds 7: 13 Fracture → one Shatter for **24**, leaving 3.
2. After that card resolves, Deepening Fault raises Shatter damage to **26** (its once-per-turn increase is now used).
3. Final Shatter adds 10: 13 → one Shatter for **26**, leaving 3. Gain **6 Barrier**.

Total: **50 damage and 6 Barrier**, 3 Mana, no SP spent. A previously active Pillar of Glass would add 6 more Barrier once this turn, not once per Shatter. Each card's application and Aura timing matter. Against Barrier, some or all of that damage is absorbed normally.

## Balance risks to resolve before shipping

1. **Long-term reserve hoarding.** With no SP cap, passive generation eventually makes holding attractive. The draft counters this with much higher immediate spell-spend coefficients, not resource decay. Check whether Swords still outpace bursts over realistic boss windows and whether defensive stalling becomes dominant.
2. **External per-hit buffs.** Five copies of generic Might effects, Primed, Exposed and card replays can multiply Thousand Shards. Its Consume and full-resource spend constrain repetition, but do not prove it safe. Check single-hit limits, Thorns, block, and kill interruption. Do not apply a hidden extra hit cap to the user-facing all-in version.
3. **Growing generators and small decks.** Deepening Enchantment's successive plays yield 3/4/5/6; Growing Crucible yields 5/7/9. Cost reductions, tutors and replays must be evaluated together. New copies must not inherit grown yields. No SP-to-Mana converter is in this pool.
4. **Aura duplicates are real.** The current maximum is five copies, so five Warm Anvils generate 10 SP/turn after costing 10 Mana to establish; five Glass Guards give 20 Barrier on the first Sword; five Deepening Faults add 10 Shatter damage per eligible turn after 10 Mana of setup. Five upgraded Crucible Hearts would add +5 growth to the first growing generator each turn after 5 Mana of setup. These are explicit stress cases, not certified balanced outcomes. If too strong, adjust costs/numbers or adopt a clearly stated stacking rule; do not silently pretend only one copy is legal.
5. **Fracture linear scaling.** At Shatter 18, 10 marks mean 18 damage; at 48, the same marks mean 48. Fault Memory scales application too, giving a powerful two-axis boss engine. Deepening Fault is once per turn and applies after the triggering card, but high-copy builds still need hand-calculated ceilings and deterministic tests.
6. **PvP counterplay.** Resources and Fracture should be visible. Barrier blocks Shatter; debuff prevention can stop applications; tempo punishes setup. No plan requires hidden intents, kills, or opponents attacking. Check enemy cleansing and boss immunity implementations so they neither silently nullify the archetype nor accidentally erase the owner-wide Shatter damage increase.
7. **Early draft reliability.** Generators, single-target damage, group damage, defense and Fracture application all exist at common. Uncommon growing generators and Deep Fault/Deepening Fault provide scaling without rares. Check reward distributions before declaring this reliable in practice.

## What implementation would require after review

- One SP state and migration away from separate Arcana/weapon bonuses; explicit Sword/Spell tags; exact damage previews with rounding and partial-spend choices.
- Per-physical-card generator growth, copying/replay policy, per-owner Shatter damage, owner-attributed Fracture marks and deterministic threshold resolution.
- Trigger timing for card completion, distinct Sword targets, first-per-turn effects, and additive Aura copies. Stored generator values and Fracture must survive save/reconnect/replay.
- A current-card save migration reviewed separately: reuse names/IDs only when safe, map retired cards to sensible replacements, and preserve paid upgrades and valid modifications. The disposition table is a design mapping, not a finished migration algorithm.
- Full costing ledger, focused rule/card scenarios, existing project checks and human boss playtests. No bot simulations unless separately requested.

## Provenance and validation

Read-only inputs: `D:\Code\ShatteredRifts\packages\content\src\v2\pools\spellblade.ts`, live `COMBAT_DB` / `RIFTWALKERS` / `rewardPool` exports, `docs/DECISIONS.md` (especially #428 and the weapon decisions), `docs/14_CARD_COSTING.md`, `docs/08_COMBAT_V2.md`, `docs/11_PVP.md`, `docs/13_PROPOSALS.md`, and current PvP deck limits. The source and current exported data take precedence over stale historical descriptions.

Validated for this deliverable: exact proposed pool count, unique card names, 16 Auras, all retained source IDs present, no source reused twice, complete cut reasons, all current class-owned identities reconciled, example-deck totals, and the arithmetic shown above. The proposal is not loaded into the game engine, so no card behavior, legality, boss viability or upgrade balance has been engine-tested.
